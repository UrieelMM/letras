import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  fractal, instanced, lighting, noiseGLSL, randomGenerator, ridge, rockGeometry, setInstances,
  skyDome, skyUniforms, terrain, type BuildScene, type Instance,
} from './scene';

const ocean = `
  ${skyUniforms}
  ${noiseGLSL}
  void main() {
    vec3 d = viewRay();
    vec2 uv = d.xy / max(.2,-d.z);
    float up = smoothstep(-.11,.48,uv.y);
    float caustics = fbm(vec2(uv.x*9.,uv.y*19.)+vec2(uTime*.17,-uTime*.13));
    vec3 color = mix(uBase*.5, uAccent*.57 + uBase*.13, up);
    color += uAccent*.19*pow(caustics,3.)*up;
    vec2 sun = uv-vec2(-.24,.48);
    float angle = atan(sun.x, -sun.y);
    float rays = pow(max(0.,sin(angle*18.5+sin(angle*8.1+uTime*.26))),5.);
    rays *= .53+.47*fbm(vec2(angle*10.,uv.y*8.+uTime*.31));
    color += (uAccent*.64+vec3(.04,.04,.06)) * rays * exp(-length(sun)*2.14) * smoothstep(-.1,.52,-sun.y);
    color += uAccent*.25*exp(-length(sun)*7.9);
    gl_FragColor=vec4(color,1.);
  }
`;

function fishGeometry() {
  const body = new T.SphereGeometry(1,18,10).scale(.65,.252,.104);
  const vertices = body.getAttribute('position');
  for(let i=0;i<vertices.count;i++) {
    const x = vertices.getX(i);
    vertices.setY(i,vertices.getY(i)*(1.+x*.3));
  }
  body.computeVertexNormals();
  const tailShape = new T.Shape().moveTo(-.45,.025).lineTo(-.88,.25).lineTo(-.81,.01)
    .lineTo(-.93,-.22).lineTo(-.48,-.06).closePath();
  const dorsal = new T.Shape().moveTo(-.39,.10).quadraticCurveTo(-.22,.38,.29,.32).lineTo(.46,.16).closePath();
  const pelvic = new T.Shape().moveTo(.23,-.08).quadraticCurveTo(-.05,-.34,-.39,-.27).lineTo(-.12,-.06).closePath();
  const fins = [tailShape,dorsal,pelvic].map(shape => new T.ShapeGeometry(shape,10));
  const eye = new T.SphereGeometry(.038,8,5).translate(.45,.06,.086);
  const parts = [body,...fins,eye];
  const fish = mergeGeometries(parts)!;
  parts.forEach((part) => part.dispose());
  return fish;
}

export const livingReef: BuildScene = ({ scene,camera,accent,base }) => {
  const rand = randomGenerator(167);
  const blue = new T.Color('#235786');
  const seawater = base.clone().lerp(accent,.24);
  const grape = new T.Color('#532456');
  const sand = new T.Color('#3c5772');
  scene.fog = new T.FogExp2(seawater,.0195);
  const skyTime = skyDome(scene,ocean,accent,base);
  lighting(scene,'#a7e3eb','#8a63ad','#e8f4ff',2.34,[-11,17,11],1.66);

  function floor(x: number,z: number) {
    const forms = ridge(x,z,-13,-6,13,22)*4.0+ridge(x,z,15,-14,17,24)*4.7+
      ridge(x,z,21,-35,20,25)*7+ridge(x,z,-22,-39,19,26)*7.7;
    return (fractal(x*.12,z*.077)-.59)*2.46 + forms -1.28;
  }
  const bed = terrain(156,137,144,120,-33,floor,(x,y,z,slope) => {
    const channels = fractal(x*.23,z*.16);
    const speckle = fractal(x*.88,z*.8);
    return sand.clone().lerp(blue,.26+channels*.46).lerp(grape,Math.min(.51,y*.045+slope*.37+.12))
      .multiplyScalar(.67+speckle*.58);
  });
  const causticTime={value:0};
  bed.material.onBeforeCompile=(shader) => {
    shader.uniforms.uTime=causticTime;
    shader.vertexShader='varying vec2 vSand;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSand = position.xz;');
    shader.fragmentShader=('uniform float uTime; varying vec2 vSand;\n'+noiseGLSL+shader.fragmentShader).replace('#include <color_fragment>', `
      #include <color_fragment>
      vec2 p=vSand*1.18;
      vec2 warp=vec2(fbm(p*.68+uTime*.18),fbm(p*.74-uTime*.14));
      float fold=sin(p.x*4.1+warp.x*8.+uTime*.6)*cos(p.y*3.7+warp.y*8.-uTime*.43);
      diffuseColor.rgb += vec3(.07,.23,.27)*pow(1.-abs(fold),10.)*.38;
    `);
  };
  scene.add(bed);

  const rocks: Instance[] = [];
  for(let i=0;i<670;i++) {
    const x=(rand()-.5)*91, z=18-rand()*88;
    const size = .17+rand()**2.7*(Math.abs(x)>8 ? 3.3 : 1.2);
    rocks.push({x,y:floor(x,z)+size*.08,z,sx:size*1.27,sy:size*.68,sz:size,rx:rand()*3,ry:rand()*6,
      color:blue.clone().lerp(grape,rand()*.84).lerp(sand,rand()*.56)});
  }
  instanced(scene,rockGeometry(148,2),new T.MeshStandardMaterial({vertexColors:true,roughness:.9}),rocks);

  const coralColors = ['#ff717a','#e35593','#a779fa','#35bbdf','#53d6b9','#ff9f6c'].map(value => new T.Color(value));
  const branches: Instance[] = [];
  const tips: Instance[] = [];
  const plates: Instance[] = [];
  const polyps: Instance[] = [];
  const orientation = new T.Quaternion();
  const rotation = new T.Euler();
  const axis = new T.Vector3(0,1,0);
  const direction = new T.Vector3();

  function branch(origin: T.Vector3, end: T.Vector3, width: number, tint: T.Color) {
    direction.subVectors(end,origin);
    const length = direction.length();
    orientation.setFromUnitVectors(axis,direction.normalize());
    rotation.setFromQuaternion(orientation);
    branches.push({x:(origin.x+end.x)/2,y:(origin.y+end.y)/2,z:(origin.z+end.z)/2,
      sx:width,sy:length*1.07,sz:width,rx:rotation.x,ry:rotation.y,rz:rotation.z,color:tint});
  }

  function fan(origin: T.Vector3, length: number, angle: number, twist: number, n: number, coral: T.Color) {
    const end = origin.clone().add(new T.Vector3(Math.sin(angle)*Math.cos(twist),Math.cos(angle),Math.sin(angle)*Math.sin(twist)).multiplyScalar(length));
    branch(origin,end,length*(.075+n*.019),grape.clone().lerp(coral, .74-n*.1));
    if (n === 0) {
      const size = length*.28;
      tips.push({x:end.x,y:end.y,z:end.z,sx:size,sy:size*.86,sz:size,color:coral.clone().lerp(accent,.19)});
      return;
    }
    const curve = .38+rand()*.37;
    fan(end,length*(.65+rand()*.13),angle+curve,twist+.17,n-1,coral);
    fan(end,length*(.64+rand()*.14),angle-curve,twist-.14,n-1,coral);
    if (n > 2) fan(end,length*.57,angle*.52,twist+.84,n-1,coral);
  }

  for(let i=0;i<195;i++) {
    const side = i%2===0 ? -1 : 1;
    const x=side*(5.2+rand()*27), z=15-rand()*70;
    const y=floor(x,z);
    const size=(.46+rand()**1.18*1.9) * (Math.abs(x)<18 && z>-25 ? 1.15 : .93);
    const coral=coralColors[i%coralColors.length];
    if (i%3===0) {
      for(let j=0;j<4;j++) {
        const column = new T.Vector3(x+(rand()-.5)*size,y,z+(rand()-.5)*size);
        const shelf = column.clone().add(new T.Vector3((rand()-.5)*.65,size*(.28+j*.31),(rand()-.5)*.69));
        branch(column,shelf,size*.16,coral.clone().lerp(grape,.33));
        const radius = size*(.66+rand()*.5-j*.076);
        plates.push({x:shelf.x,y:shelf.y,z:shelf.z,sx:radius,sy:radius*.45,sz:radius*.86,rx:(rand()-.5)*.53,ry:rand()*6,rz:(rand()-.5)*.38,color:coral});
        for(let p=0;p<16;p++){
          const angle=p*Math.PI/8;
          const rad=(.2+rand()*.67)*radius;
          const s=radius*(.065+rand()*.072);
          polyps.push({x:shelf.x+Math.cos(angle)*rad,y:shelf.y+radius*.12,z:shelf.z+Math.sin(angle)*rad*.81,sx:s,sy:s*.36,sz:s,
            color:coral.clone().lerp(accent,rand()*.24).multiplyScalar(.51+rand()*.37)});
        }
      }
    } else {
      const twist = (rand()-.5)*1.6;
      fan(new T.Vector3(x,y,z),size*.72,(rand()-.5)*.41,twist,i%7===0 ? 4 : 3,coral);
      fan(new T.Vector3(x+.4,y,z-.37),size*.5,(rand()-.5)*1.3,twist+.52,2,coral);
    }
  }
  for (const [x,z,size,index] of [[-8,13,2.3,1],[8,11,2.2,5],[-10,5,2.7,2],[10,1,2.9,3]]) {
    const coral=coralColors[index];
    const y=floor(x,z);
    for(let stem=0;stem<3;stem++) fan(new T.Vector3(x+(stem-1)*.45,y,z),size*(.73+stem*.14),(stem-1)*.52,.3+stem*.48,4,coral);
  }
  const coralMaterial = new T.MeshStandardMaterial({roughness:.66,flatShading:true,emissive:'#5f274e',emissiveIntensity:.34});
  instanced(scene,new T.CylinderGeometry(.65,1,1,7),coralMaterial,branches);
  instanced(scene,new T.IcosahedronGeometry(1,1),new T.MeshBasicMaterial({color:'#ffffff'}),tips);
  instanced(scene,new T.SphereGeometry(1,18,5).scale(1,.42,1),coralMaterial,plates);
  instanced(scene,new T.IcosahedronGeometry(1,1),coralMaterial,polyps);

  const kelp = new T.PlaneGeometry(1,1,2,19).translate(0,.5,0);
  const blades: Instance[] = [];
  for(let i=0;i<114;i++) {
    const x=(rand()<.5?-1:1)*(5+rand()*23), z=14-rand()*61;
    const width=.37+rand()*.61, height=1.2+rand()*4.3;
    blades.push({x,y:floor(x,z),z,sx:width,sy:height,sz:width,ry:rand()*6,rz:(rand()-.5)*.6,
      color:new T.Color('#226464').lerp(accent,rand()*.44)});
  }
  const kelpTime = {value:0};
  const kelpMaterial = new T.MeshStandardMaterial({roughness:.88,side:T.DoubleSide,emissive:'#123832',emissiveIntensity:.32});
  kelpMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = kelpTime;
    shader.vertexShader = 'uniform float uTime; varying vec2 vBlade;\n'+shader.vertexShader.replace('#include <begin_vertex>', `
      #include <begin_vertex>
      vBlade=uv;
      float seed=instanceMatrix[3].x*.45+instanceMatrix[3].z*.16;
      transformed.x = position.x*sin(pow(uv.y,.58)*3.14159) * (.85+.15*sin(uv.y*36.));
      transformed.z += uv.y*uv.y*sin(uTime*.81+seed+uv.y*3.2)*.93;
      transformed.x += uv.y*uv.y*sin(seed+uTime*.52)*.53;
    `);
    shader.fragmentShader = 'varying vec2 vBlade;\n'+shader.fragmentShader.replace('#include <color_fragment>',`
      #include <color_fragment>
      float vein=1.-smoothstep(.016,.057,abs(vBlade.x-.5));
      float ribs=sin((vBlade.y+abs(vBlade.x-.5)*.13)*210.)*.05;
      diffuseColor.rgb *= .65 + .3*vBlade.y + vein*.30 + ribs;
    `);
  };
  instanced(scene,kelp,kelpMaterial,blades);

  const swimming = Array.from({length:125},(_,i) => ({
    phase:rand()*Math.PI*2, reach:2+rand()*5, flight:3+rand()*3.4,
    height:(rand()-.5)*3.4, depth:(rand()-.5)*10,
    school:i%3,parent:rand()*.37, size:.42+rand()*.81,
    color:accent.clone().lerp(coralColors[i%coralColors.length],.18+rand()*.64),
  }));
  const fish: Instance[] = swimming.map((entry) => ({x:0,y:0,z:0,sx:entry.size,sy:entry.size,sz:entry.size,color:entry.color}));
  const fishTime={value:0};
  const fishMaterial = new T.MeshStandardMaterial({roughness:.46,metalness:.05,side:T.DoubleSide});
  fishMaterial.onBeforeCompile=(shader) => {
    shader.uniforms.uTime = fishTime;
    shader.vertexShader = 'uniform float uTime; varying vec3 vFish;\n'+shader.vertexShader.replace('#include <begin_vertex>',`
      #include <begin_vertex>
      vFish=position;
      transformed.z += smoothstep(.06,.9,-position.x)*sin(uTime*10.+instanceMatrix[3].x*.47+position.x*12.)*.22;
    `);
    shader.fragmentShader = 'varying vec3 vFish;\n'+shader.fragmentShader.replace('#include <color_fragment>', `
      #include <color_fragment>
      float band = smoothstep(.05,.32,fract((vFish.x + vFish.y*.27)*5.1))*.32;
      diffuseColor.rgb *= .63+band + smoothstep(.02,.22,-vFish.y)*.24;
      if (vFish.z > .081 && distance(vFish.xy, vec2(.45,.06))<.038) diffuseColor.rgb*=.16;
    `);
  };
  const school = instanced(scene,fishGeometry(),fishMaterial,fish,true);

  const count=760;
  const data=new Float32Array(count*3);
  const sizes = new Float32Array(count);
  for(let i=0;i<count;i++) {
    data.set([(rand()-.5)*69,rand()*23-1.5,17-rand()*89],i*3);
    sizes[i]=.65+rand()**1.8*4.4;
  }
  const speckGeometry=new T.BufferGeometry();
  speckGeometry.setAttribute('position',new T.BufferAttribute(data,3)).setAttribute('aSize',new T.BufferAttribute(sizes,1));
  const speckTime={value:0};
  const specks=new T.Points(speckGeometry,new T.ShaderMaterial({
    uniforms:{uTint:{value:accent},uTime:speckTime},
    depthWrite:false,transparent:true,blending:T.AdditiveBlending,
    vertexShader:`
      uniform float uTime;
      attribute float aSize;
      varying float spark;
      void main(){
        vec3 p=position;
        p.y=mod(p.y+uTime*(.19+aSize*.09)+1.5,23.)-1.5;
        p.x+=sin(uTime*.4+p.z)*.51;
        vec4 view=modelViewMatrix*vec4(p,1.);
        gl_Position=projectionMatrix*view;
        gl_PointSize=clamp(aSize*34./-view.z,1.,12.);
        spark=(.28+.32*sin(p.z+uTime*.8+aSize*5.))*(1.-smoothstep(24.,82.,-view.z));
      }`,
    fragmentShader:`uniform vec3 uTint; varying float spark;
      void main(){float r=length(gl_PointCoord-.5);
        float glow=exp(-10.*r)+.5*exp(-46.*abs(r-.30));
        gl_FragColor=vec4(uTint,glow*max(.1,spark)*(1.-smoothstep(.4,.5,r)));
      }`,
  }));
  specks.frustumCulled=false;
  scene.add(specks);

  return {
    still:3.8,
    update(time) {
      skyTime.value = causticTime.value = kelpTime.value = fishTime.value = speckTime.value = time;
      swimming.forEach((entry,i) => {
        const t=time*(.31+entry.parent*.19)+entry.phase;
        const drift = time*.138+entry.school*2.1;
        fish[i].x = Math.sin(drift)*(8+entry.school*.7)+Math.sin(t)*entry.reach;
        fish[i].y = 5.0+entry.school*.65+entry.height+Math.sin(t+entry.school)*.8;
        fish[i].z = -14-entry.school*7+entry.depth+Math.cos(t)*entry.flight;
        fish[i].ry = Math.atan2(Math.sin(t)*entry.flight*.37,Math.cos(t)*entry.reach*.37+Math.cos(drift)*1.21);
        fish[i].rz = Math.cos(t+entry.school)*.11;
      });
      setInstances(school,fish);
      camera.position.set(Math.sin(time*.13)*1.45,5.73+Math.sin(time*.21)*.42,23+Math.cos(time*.1)*1.38);
      camera.lookAt(.55,4.95,-26);
    },
  };
};
