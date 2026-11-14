import * as T from 'three';
import { rain } from './rain';
import {
  fractal, instanced, lighting, noiseGLSL, randomGenerator, rockGeometry, skyDome, skyUniforms, terrain,
  type BuildScene, type Instance,
} from './scene';

const rainbowGLSL = `
  vec4 rainbow(vec2 q) {
    float radial=length((q-vec2(.015,-.135))*vec2(.87,1.));
    float red=exp(-pow((radial-.367)*263.,2.));
    float yellow=exp(-pow((radial-.361)*226.,2.));
    float green=exp(-pow((radial-.355)*221.,2.));
    float blue=exp(-pow((radial-.349)*215.,2.));
    float violet=exp(-pow((radial-.343)*208.,2.));
    float density=red+yellow+green+blue+violet;
    vec3 bands=red*vec3(1.,.25,.18)+yellow*vec3(1.,.83,.25)+green*vec3(.38,1.,.44)
      +blue*vec3(.29,.60,1.)+violet*vec3(.69,.42,1.);
    return vec4(bands/max(.001,density), min(1.,density)*smoothstep(-.067,.065,q.y));
  }
`;

const sky = `
  ${skyUniforms}
  ${noiseGLSL}
  ${rainbowGLSL}
  void main() {
    vec3 ray=viewRay();
    vec2 q=ray.xy/max(.25,-ray.z);
    float clouds=fbm(vec2(q.x*7.,q.y*18.)+vec2(uTime*.034,0.));
    float glow=exp(-length((q-vec2(-.29,.27))*vec2(1.,1.5))*2.5);
    vec3 horizon=mix(vec3(.35,.61,.59),uAccent*.79,.66);
    vec3 color=mix(horizon,uBase+vec3(.11,.20,.22),smoothstep(0.,.59,q.y));
    color+=uAccent*(.20*clouds + .29*glow);
    color-=uBase*(smoothstep(.35,.64,clouds)*.46);
    vec4 bow=rainbow(q);
    color=mix(color,bow.rgb,bow.a*(.34+.12*clouds));
    gl_FragColor=vec4(color,1.);
  }
`;

function streamCenter(z: number) {
  return Math.sin(z*.11)*2.4;
}

export const rainbowForest: BuildScene = ({ scene, camera, accent, base }) => {
  const rand = randomGenerator(982);
  const color = (value: string) => new T.Color(value);
  const moss = color('#346c33');
  const stone = color('#4b675d');
  const peat = color('#312723');
  scene.fog = new T.FogExp2(accent.clone().lerp(base,.48),.025);
  lighting(scene,'#c4efd4','#63824d','#ffebad',2.2,[-10,11,-16],1.65);
  const skyTime = skyDome(scene, sky, accent, base);
  const rainTime = rain(scene,color('#d7eadc'),1350);

  function ground(x: number,z: number) {
    const shore = T.MathUtils.smoothstep(Math.abs(x-streamCenter(z)),1.6,4.1);
    const slope = Math.min(2.3,Math.abs(x)*.055);
    const texture = (fractal(x*.16+2,z*.13)-.40)*1.25;
    return -1.05+shore*(1.36+slope+texture);
  }
  const bed=terrain(118,122,143,148,-36,ground,(x,y,z,slope) => {
    const variation=fractal(x*.47,z*.49);
    const mud=1-T.MathUtils.smoothstep(y,-.20,.5);
    return moss.clone().lerp(peat,.21+mud*.41+variation*.24).lerp(stone,slope*.65);
  });
  bed.material.onBeforeCompile=(shader)=>{
    shader.vertexShader='varying vec2 vMoss;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvMoss=position.xz;');
    shader.fragmentShader=('varying vec2 vMoss;\n'+noiseGLSL+shader.fragmentShader).replace('#include <color_fragment>',`
      #include <color_fragment>
      float moss=fbm(vMoss*3.5);
      diffuseColor.rgb *= .67+ .44*moss + noise(vMoss*18.)*.14;
    `);
  };
  scene.add(bed);
  const waterTime={value:0};
  const water = new T.Mesh(new T.PlaneGeometry(110,120).rotateX(-Math.PI/2).translate(0,-.18,-34),new T.ShaderMaterial({
    uniforms:{uTime:waterTime,uAccent:{value:accent},uBase:{value:base}},
    vertexShader:`
      varying vec3 vWorld;
      void main(){ vWorld=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader:`
      uniform float uTime;
      uniform vec3 uAccent,uBase;
      varying vec3 vWorld;
      ${noiseGLSL}
      ${rainbowGLSL}
      void main(){
        vec3 ray=normalize(vWorld-cameraPosition);
        vec2 p=vWorld.xz;
        float wave=noise(p*vec2(3.,5.2)+vec2(uTime*.42,0.));
        float reflected=pow(1.-abs(ray.y),2.9);
        vec2 ref=vec2(ray.x,-ray.y+(wave-.5)*.05)/max(.32,-ray.z);
        vec3 color=mix(uBase*.63,uAccent*(.17+.28*noise(ref*vec2(16.,2.))),reflected);
        vec2 i=floor(p*2.2),f=fract(p*2.2);
        vec2 drop=vec2(hash(i+7.),hash(i+24.))*.70+.15;
        float radius=fract(uTime*1.6+hash(i));
        float ring=1.-smoothstep(.013,.038,abs(distance(f,drop)-radius*.52));
        color+=uAccent*(ring*(1.-radius)*.21+pow(wave,4.)*.13);
        vec4 bow=rainbow(ref);
        color=mix(color,bow.rgb,bow.a*reflected*.36);
        gl_FragColor=vec4(color,1.);
      }`,
  }));
  scene.add(water);
  const bow = new T.Mesh(new T.PlaneGeometry(112,50).translate(0,12,-27),new T.ShaderMaterial({
    transparent:true,depthWrite:false,
    uniforms:{uTime:waterTime},
    vertexShader:`varying vec3 vWorld;
      void main(){vWorld=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`
      uniform float uTime;
      varying vec3 vWorld;
      ${noiseGLSL}
      ${rainbowGLSL}
      void main(){
        vec3 ray=normalize(vWorld-cameraPosition);
        vec2 uv=ray.xy/max(.26,-ray.z);
        vec4 bow=rainbow(uv);
        if (bow.a < .009) discard;
        float mist=.53+.31*fbm(uv*7.+vec2(uTime*.051,0.));
        gl_FragColor=vec4(bow.rgb,bow.a*mist);
      }`,
  }));
  scene.add(bow);

  const branches: Instance[]=[];
  const canopies: Instance[]=[];
  const underbrush: Instance[]=[];
  const ferns: Instance[]=[];
  const stones: Instance[]=[];
  const wood=color('#493b2f');
  const leaf=color('#214932');
  const litLeaf=color('#72a248');
  const direction=new T.Vector3();
  const rotation=new T.Euler();
  const quaternion=new T.Quaternion();
  const up=new T.Vector3(0,1,0);
  function bough(from: T.Vector3, to: T.Vector3, radius: number, tint: T.Color) {
    direction.subVectors(to,from);
    const length=direction.length();
    rotation.setFromQuaternion(quaternion.setFromUnitVectors(up,direction.normalize()));
    branches.push({ x:(from.x+to.x)*.5,y:(from.y+to.y)*.5,z:(from.z+to.z)*.5,
      sx:radius,sy:length,sz:radius,rx:rotation.x,ry:rotation.y,rz:rotation.z,color:tint });
  }
  for(let i=0;i<118;i++){
    const side=i%2===0 ? -1 : 1;
    const z=14-rand()*87;
    const x=side*(5.5+(15-z)*.105+rand()*27.5);
    if(Math.abs(x-streamCenter(z))<4.2) continue;
    const y=ground(x,z);
    const height=7+rand()*10+(z>1 ? 2.2 : 0);
    const width=.19+rand()*.52;
    const start=new T.Vector3(x,y-.19,z);
    const crotch=new T.Vector3(x+(rand()-.5)*1.33,y+height*.63,z+(rand()-.5)*1.33);
    const crown=new T.Vector3(crotch.x+(.5-rand())*1.63,y+height,crotch.z-.8);
    bough(start,crotch,width,wood.clone().multiplyScalar(.72+rand()*.48));
    bough(crotch,crown,width*.49,wood);
    for(let j=0;j<5;j++) {
      const angle=j*2.4+i*.9;
      const length=1.65+rand()*2.8;
      const fork=crotch.clone().lerp(crown,rand()*.62);
      const end=fork.clone().add(new T.Vector3(Math.cos(angle)*length,1.04+rand()*2.,Math.sin(angle)*length));
      end.x=side*Math.max(side*end.x,4.1+(15-z)*.105);
      bough(fork,end,width*(.11+rand()*.19),wood);
      for(let k=0;k<2;k++) {
        const size=1.26+rand()*1.84;
        canopies.push({x:end.x+(rand()-.5)*1.3,y:end.y+rand()*.89,z:end.z+(rand()-.5)*1.3,
          sx:size,sy:size*(.33+rand()*.31),sz:size*(.87+rand()*.34),ry:rand()*6.3,color:leaf.clone().lerp(litLeaf,rand()*.57) });
      }
    }
  }

  for (let i=0;i<620;i++) {
    const z=18-rand()*73;
    const x=(rand()<.5 ? -1 : 1)*(2.3+rand()**1.7*17)+streamCenter(z);
    const y=ground(x,z);
    const size=.22+rand()**1.6*.96;
    if (i%4===0) {
      stones.push({x,y:y+size*.14,z,sx:size*1.2,sy:size*.56,sz:size*.87,ry:rand()*6.3,
        color:stone.clone().lerp(leaf,rand()*.61)});
    } else if (i%3===0) {
      underbrush.push({x,y:y+size*.22,z,sx:size,sy:size*.57,sz:size*.84,ry:rand()*6.3,color:leaf.clone().lerp(litLeaf,rand()*.62)});
    } else if (i<430) {
      for(let j=0;j<5;j++) {
        const tilt=.28+rand()*.84;
        ferns.push({x,y:y+.024,z,sx:size*.47,sy:size*(.64+rand()*.66),sz:size,rx:-tilt,
          ry:j*1.26+i*.71,color:leaf.clone().lerp(litLeaf,.34+rand()*.66)});
      }
    }
  }
  const bark = new T.MeshStandardMaterial({ roughness:.96 });
  bark.onBeforeCompile=(shader)=>{
    shader.vertexShader='varying vec2 vBark;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvBark=uv;');
    shader.fragmentShader=('varying vec2 vBark;\n'+noiseGLSL+shader.fragmentShader).replace('#include <color_fragment>',`
      #include <color_fragment>
      float grooves=fbm(vBark*vec2(26.,3.));
      diffuseColor.rgb *= .53+.64*grooves;
    `);
  };
  instanced(scene,new T.CylinderGeometry(.62,1,1,9,2),bark,branches);
  const greenery=new T.MeshStandardMaterial({ vertexColors:true,roughness:1 });
  const clump=rockGeometry(605,1);
  instanced(scene,clump,greenery,[...canopies,...underbrush]);
  instanced(scene,rockGeometry(43,1),greenery,stones);

  const leaves = new T.Shape().moveTo(-.025,0);
  for(let i=1;i<=8;i++) {
    const y=i/9;
    const width=(1-y)*.58;
    leaves.lineTo(-width,y-.03).lineTo(-.025,y);
  }
  leaves.lineTo(0,1);
  for(let i=8;i>=1;i--) {
    const y=i/9;
    leaves.lineTo(.025,y).lineTo((1-y)*.58,y-.03);
  }
  leaves.lineTo(.025,0).closePath();
  const fernGeo=new T.ShapeGeometry(leaves);
  const vertices=fernGeo.getAttribute('position');
  for(let i=0;i<vertices.count;i++) vertices.setZ(i,vertices.getY(i)**2*.42);
  fernGeo.computeVertexNormals();
  instanced(scene,fernGeo,new T.MeshStandardMaterial({side:T.DoubleSide,roughness:.81}),ferns);

  return {
    still:2.2,
    update(time){
      skyTime.value=waterTime.value=rainTime.value=time;
      camera.position.set(Math.sin(time*.14)*1.1,3.34+Math.sin(time*.15)*.27,19+Math.cos(time*.118)*1.05);
      camera.lookAt(.3,6.95,-40);
    },
  };
};
