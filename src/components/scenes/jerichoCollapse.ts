import * as T from 'three';
import { jerichoWarriors } from './jerichoWarriors';
import {
  fractal, instanced, lighting, noiseGLSL, randomGenerator, ridge, rockGeometry, setInstances,
  skyDome, skyUniforms, terrain, type BuildScene, type Instance,
} from './scene';

const sunset = `
  ${skyUniforms}
  ${noiseGLSL}
  void main() {
    vec3 d = viewRay();
    vec2 p = d.xy / max(.15,-d.z);
    vec2 sun = (p - vec2(-.30,.14))*vec2(1.,1.06);
    float glare = exp(-length(sun)*4.8);
    vec3 warm = mix(uAccent, vec3(.98,.48,.28), .35);
    vec3 color = mix(vec3(.53,.27,.23), uBase * .9, smoothstep(-.04,.49,p.y)) + warm*glare*.8;
    color = mix(color, vec3(1.,.86,.60), 1.-smoothstep(.041,.045,length(sun)));
    vec2 q = vec2(p.x*5., p.y*22.) + vec2(uTime*.036,0.);
    float clouds = smoothstep(.38,.69,fbm(q + noise(q*.53)*2.2)) * smoothstep(-.02,.12,p.y);
    color = mix(color, uBase*.5+warm*(.19+glare*.64), clouds*.74);
    gl_FragColor = vec4(color,1.);
  }
`;

interface Stone extends Instance {
  delay: number;
  drift: number;
  spin: number;
}

export const jerichoCollapse: BuildScene = ({ scene, camera, accent, base }) => {
  const rand = randomGenerator(1811);
  const color = (value: string) => new T.Color(value);
  const dark = base.clone().lerp(color('#473029'), .63);
  const sandstone = accent.clone().lerp(color('#987253'), .48);
  const earth = color('#604439').lerp(base, .2);
  scene.fog = new T.FogExp2(color('#9a6760').lerp(base,.15), .012);
  const skyTime = skyDome(scene, sunset, accent, base);
  lighting(scene, '#ccbcda', '#51362b', '#ffd49a', 2.5, [-14,16,4], 1.03);

  function ground(x: number, z: number) {
    const rolling = (fractal(x*.079, z*.095)-.5) * (1.45 + Math.max(0, -z-9)*.17);
    const plateau = 0.48 * Math.exp(-((z+4)*(z+4)/22));
    const hill = ridge(x,z,-32,-52,31,26)*7.6 + ridge(x,z,34,-70,44,31)*13 + ridge(x,z,-48,-88,48,31)*18;
    return rolling + plateau + hill;
  }

  const groundMesh = terrain(175, 152, 152, 141, -45, ground, (x,y,z,slope) => {
    const value = fractal(x*.21+5,z*.21) + .22*fractal(x*.8,z*.69) - slope*.24;
    const road = Math.exp(-Math.pow((x-Math.sin(z*.068)*1.6)/3.45,2)) * (z > -5 ? .35 : 0);
    return earth.clone().lerp(sandstone, T.MathUtils.clamp(value*.67 + road + y*.008,0,1));
  });
  groundMesh.material.onBeforeCompile=(shader) => {
    shader.vertexShader='varying vec2 vGround;\n'+shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvGround=position.xz;');
    shader.fragmentShader=('varying vec2 vGround;\n'+noiseGLSL+shader.fragmentShader).replace('#include <color_fragment>',`
      #include <color_fragment>
      vec2 p=vGround;
      float detail=fbm(p*2.4)*.23+noise(p*29.)*.13;
      float wind=sin(p.y*12.+p.x*1.2+fbm(p*.29)*14.)*.024;
      float shade=exp(-abs(p.y+3.9)*.49)*(1.-smoothstep(11.,18.,abs(p.x)))*.23;
      diffuseColor.rgb *= .80+detail+wind-shade;
    `);
  };
  scene.add(groundMesh);

  const fixed: Instance[] = [];
  const movable: Stone[] = [];
  function block(x: number, y: number, z: number, sx: number, sy: number, sz: number, angle = 0, falls = false) {
    const tint = dark.clone().lerp(sandstone, .38+rand()*.57).multiplyScalar(.86+rand()*.23);
    const stone = { x,y,z,sx,sy,sz, color: tint, rx: (rand()-.5)*.09, ry: (rand()-.5)*.07, rz: angle+(rand()-.5)*.046 };
    if (falls) movable.push({
      ...stone, delay: 1.95 + Math.abs(x)*.19 + Math.max(0,6-y)*.09 + rand()*.52,
      drift: (rand()-.48)*2.5,
      spin: (rand()-.5)*8,
    });
    else fixed.push(stone);
  }

  function face(cx: number, cz: number, cols: number, rows: number, width: number, falls: boolean, arch: boolean) {
    const pitch = width/cols;
    for (let row = 0; row < rows; row++) {
      const y = .65+row*.59;
      for (let col = 0; col < cols; col++) {
        const offset = (col+.5+(row%2)*.37)*pitch-width/2;
        if (arch && (y < 2.45 ? Math.abs(offset) < 1.77 : Math.hypot(offset, y-2.42) < 1.86)) continue;
        if (row === rows-1 && col % 2 === 1) continue;
        block(cx+offset,y+(rand()-.5)*.07,cz+(rand()-.5)*.073,pitch*.96,.567,1.28+(rand()*.44),0,falls);
      }
    }
  }

  face(0,-4.3,19,11,25,true,true);
  for (let i=0;i<11;i++) {
    const angle = Math.PI*(i+.5)/11;
    block(Math.cos(angle)*1.95,2.42+Math.sin(angle)*1.95,-3.5,.55,.61,1.12,angle+Math.PI/2,true);
  }
  for (const sign of [-1,1]) {
    for (let row=0;row<3;row++) block(sign*1.98,.68+row*.59,-3.46,.54,.59,1.14,0,true);
    for (let row=0;row<12;row++) {
      const y = .62 + row*.62;
      for (let segment=0;segment<16;segment++) {
        if (row === 11 && segment % 2 === 1) continue;
        const angle = (segment+row*.47)*Math.PI/8;
        const radius = row >= 10 ? 2.9 : 2.64-row*.021;
        block(sign*13.6+Math.cos(angle)*radius,y,-4.85+Math.sin(angle)*radius,
          1.12,.60,1.07,0,row>7 && Math.cos(angle)*sign < 0);
        const masonry = row>7 && Math.cos(angle)*sign < 0 ? movable : fixed;
        const stone = masonry[masonry.length-1];
        stone.ry = -angle;
      }
    }
    face(sign*22,-6,12,6,14,false,false);
    for (let terrace=0;terrace<4;terrace++) {
      const x = sign*(7+terrace*4.3);
      const z = -16-terrace*4;
      face(x,z,6,6+terrace%3,7.3,false,false);
      for (let i=0;i<5;i++) block(x-3.15+i*1.58,4.12+terrace%3*.59,z,1.49,.24,1.67);
    }
  }

  const stoneShape = new T.Shape()
    .moveTo(-.46,-.49).lineTo(.32,-.50).lineTo(.49,-.38).lineTo(.50,.34)
    .lineTo(.36,.50).lineTo(-.36,.49).lineTo(-.50,.36).lineTo(-.52,-.32).closePath();
  const stoneGeo = new T.ExtrudeGeometry(stoneShape,{ depth: .86, bevelThickness: .068, bevelSize: .052, bevelSegments: 1, steps: 1 });
  stoneGeo.translate(0,0,-.43);
  const stone = new T.MeshStandardMaterial({ roughness: .95 });
  stone.onBeforeCompile = (shader) => {
    shader.vertexShader = 'varying vec3 vStone;\n'+shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvStone=position;');
    shader.fragmentShader = ('varying vec3 vStone;\n'+noiseGLSL+shader.fragmentShader).replace('#include <color_fragment>',
      `#include <color_fragment>
      vec2 strata = vStone.xz*vec2(8.,5.) + vStone.y * vec2(2.,19.);
      float crumble = fbm(strata);
      float grain = noise(vStone.xz*78. + vStone.y*111.);
      diffuseColor.rgb *= .7 + .39*crumble + grain*.17;`);
  };
  instanced(scene, stoneGeo, stone, fixed);
  const falling = movable.map((part) => ({ ...part }));
  const collapse = instanced(scene, stoneGeo, stone, falling, true);

  const boulders: Instance[] = Array.from({ length: 660 }, () => {
    const x = (rand()-.5)*95;
    const z = 17-rand()*75;
    const s = (rand()*.7+.08) * (Math.abs(x) > 6 ? 1.7 : .46);
    return { x,y:ground(x,z)+s*.18,z,sx:s*1.23,sy:s*.53,sz:s,rx:rand()*3,ry:rand()*6,
      color: earth.clone().lerp(sandstone,rand()*.63) };
  });
  const contactShadows = instanced(scene, new T.PlaneGeometry(2,2).rotateX(-Math.PI/2), new T.ShaderMaterial({
    transparent:true,depthWrite:false, polygonOffset:true,polygonOffsetFactor:-1,
    vertexShader:`varying vec2 vShadow; void main(){vShadow=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 vShadow; void main(){float alpha=1.-smoothstep(.12,.5,length(vShadow-.5));gl_FragColor=vec4(.12,.067,.08,alpha*.42);}`,
  }), boulders.filter((boulder) => boulder.z > -24).map(({x,z,sx,sz}) => ({
    x,y:ground(x,z)+.042,z,sx:sx*1.35,sy:1,sz:sz*1.3,
  })));
  contactShadows.renderOrder=1;
  instanced(scene, rockGeometry(25), new T.MeshStandardMaterial({ vertexColors:true, roughness:.96 }), boulders);

  const dustCount = 185;
  const dustData = Array.from({ length: dustCount }, () => ({
    x:(rand()-.5)*28, z:-4+rand()*4, speed: .36+rand()*1.32, delay:2+rand()*2.3,
    rise: .46+rand()*.88, size: .7+rand()*2.6,
  }));
  const dustGeo = new T.BufferGeometry();
  const dustPositions = new T.BufferAttribute(new Float32Array(dustCount*3),3);
  const dustSize = new T.BufferAttribute(new Float32Array(dustCount),1);
  const dustAlpha = new T.BufferAttribute(new Float32Array(dustCount),1);
  dustGeo.setAttribute('position',dustPositions).setAttribute('aSize',dustSize).setAttribute('aAlpha',dustAlpha);
  const dust = new T.Points(dustGeo,new T.ShaderMaterial({
    transparent:true, depthWrite:false,
    uniforms:{ uTint:{ value: sandstone.clone().lerp(accent,.38) } },
    vertexShader:`
      attribute float aSize,aAlpha;
      varying float vAlpha;
      void main(){
        vec4 view = modelViewMatrix*vec4(position,1.);
        gl_Position=projectionMatrix*view;
        gl_PointSize=min(125.,aSize*880./-view.z);
        vAlpha=aAlpha;
      }`,
    fragmentShader:`uniform vec3 uTint; varying float vAlpha;
      ${noiseGLSL}
      void main(){
        vec2 p=gl_PointCoord-.5;
        float alpha=(1.-smoothstep(.06,.5,length(p)))*vAlpha;
        gl_FragColor=vec4(uTint*(.86+fbm(p*5.)*.32),alpha);
      }`,
  }));
  dust.frustumCulled = false;
  scene.add(dust);
  const warriors = jerichoWarriors(scene, ground);

  return {
    still: 4.7,
    update(time) {
      const t = (time+.7)%13;
      const rebuild = T.MathUtils.smoothstep(t,10.3,12.8);
      skyTime.value = time;
      warriors(t);
      movable.forEach((part,i) => {
        const dt = Math.max(0,t-part.delay);
        const stagger = dt * (1-rebuild);
        const floor = .33+Math.abs(Math.sin(i*6.13))*.32;
        const ballistic = part.y + stagger*.87 - 3.8*stagger*stagger;
        const target = falling[i];
        target.y = Math.max(floor,ballistic);
        target.x = part.x + part.drift*Math.min(stagger,1.34);
        target.z = part.z + (1.5+Math.sin(i*3.7))*Math.min(stagger*1.09,1.83);
        target.rx = (part.rx ?? 0) + Math.min(stagger,1.25)*part.spin;
        target.ry = (part.ry ?? 0) - Math.min(stagger,1.25)*part.spin*.7;
        target.rz = (part.rz ?? 0) + Math.min(stagger,1.2)*part.spin*.64;
      });
      setInstances(collapse,falling);
      dustData.forEach((part,i) => {
        const dt = Math.max(0,t-part.delay);
        const smoke = Math.sin(Math.min(dt/7.1,1)*Math.PI);
        dustPositions.setXYZ(i,part.x+Math.sign(part.x)*dt*.61, .58+part.rise*dt*.55,part.z+part.speed*dt);
        dustSize.setX(i,part.size*(.6+Math.min(dt,5)*.37));
        dustAlpha.setX(i,smoke*.28);
      });
      dustPositions.needsUpdate = dustSize.needsUpdate = dustAlpha.needsUpdate = true;
      camera.position.set(-1.5+Math.sin(time*.15)*3.5,4.72+Math.sin(time*.19)*.28,30+Math.cos(time*.15)*1.15);
      camera.lookAt(0,4.0,-7);
    },
  };
};
