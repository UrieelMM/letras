import * as T from 'three';
import { rain } from './rain';
import {
  fractal, instanced, lighting, noiseGLSL, randomGenerator, ridge, rockGeometry,
  skyDome, skyUniforms, terrain, type BuildScene, type Instance,
} from './scene';

const auroraGLSL = `
  vec3 aurora(vec3 direction, float time, vec3 accent) {
    vec2 uv = direction.xy / max(.22,-direction.z);
    float x = uv.x;
    float wave = sin(x*5.7+time*.23)*.071 + sin(x*11.4-time*.15)*.032;
    float y = uv.y - .24 - wave;
    float folds = .54+.25*sin(x*38. + sin(x*9.+time*.1)*3.) + .12*sin(x*113.-time*.27);
    float stream = noise(vec2(x*124. + sin(time*.18), 16.));
    float curtain = smoothstep(-.027,.012,y) * exp(-max(y,0.)*(8.5+3.5*folds));
    float edge = exp(-abs(y)*105.)*.39;
    vec3 tint = mix(accent,vec3(.67,.31,1.),smoothstep(.024,.28,y));
    vec3 main = tint*(curtain*(.44+.32*folds+stream*.21)+edge);
    float second = y + .13 + sin(x*7.1-time*.12)*.049;
    float halo = smoothstep(-.025,.015,second)*exp(-max(second,0.)*14.);
    return (main + mix(accent,vec3(.26,.51,1.),.53)*halo*(.18+.19*folds))*
      smoothstep(.014,.15,uv.y) * (1.-smoothstep(.65,1.13,abs(x)));
  }
`;

const auroraSky = `
  ${skyUniforms}
  ${noiseGLSL}
  ${auroraGLSL}
  void main() {
    vec3 d = viewRay();
    vec2 uv = d.xy / max(.3,-d.z);
    vec3 color = uBase * (.7 + .38*exp(-max(uv.y,0.)*4.))
      + vec3(.09,.105,.16)*exp(-abs(uv.y)*7.);
    float band = fbm(vec2(uv.x*4.4, uv.y*10. - uv.x*4.1));
    color += vec3(.07,.075,.15)*smoothstep(.37,.70,band)*smoothstep(.06,.42,uv.y);
    vec2 g = uv*vec2(211.,151.);
    vec2 index = floor(g);
    float star = hash(index);
    vec2 center = vec2(hash(index+30.),hash(index+64.))*.65+.175;
    float light = 1.-smoothstep(.01,.15,length(fract(g)-center));
    color += vec3(.64,.79,1.)*light*smoothstep(.91,1.,star)*(.74+.26*sin(star*30.+uTime*.46));
    color += aurora(d,uTime,uAccent)*.9;
    gl_FragColor = vec4(color,1.);
  }
`;

const stormSky = `
  ${skyUniforms}
  ${noiseGLSL}
  float cloud(vec3 p) {
    vec2 v = p.xz + vec2(p.y*.28,p.y*.59);
    float shape = fbm(v);
    float detail = noise(v*3.2 - vec2(p.y*1.7,p.y));
    float layers = sin(p.y*1.8+shape*3.2)*.095;
    return smoothstep(.33,.72,shape*.78+detail*.22+layers);
  }
  void main() {
    vec3 ray = viewRay();
    float pitch = max(ray.y,.025);
    vec3 light = normalize(vec3(-.48,.24,-.81));
    float glow = pow(max(0.,dot(ray,light)),5.);
    vec3 distant = mix(uBase*.52,uAccent*.56,exp(-pitch*5.3)*.78+glow*.19);
    vec4 volume = vec4(0.);
    float start = 1.5/(pitch+.115);
    for (int index=0;index<13;index++) {
      float stepIndex = float(index);
      vec3 p = ray * (start+stepIndex*.74);
      p.xz += vec2(uTime*.11+12.,uTime*.065-2.);
      p *= vec3(.64,.83,.75);
      float density = cloud(p);
      float diffuse = clamp(.6+(density-cloud(p+light*.34))*2.8, .09, .92);
      float alpha = density*.49 * smoothstep(0.,.4,pitch+.28);
      vec3 shade = mix(uBase*.52,uAccent*(.46+glow*.24), diffuse*.88);
      volume.rgb += (1.-volume.a) * shade * alpha;
      volume.a += (1.-volume.a) * alpha;
    }
    vec3 color = mix(distant,volume.rgb+distant*(1.-volume.a),smoothstep(-.015,.078,ray.y));
    float frame = mod(uTime+2.,15.);
    float pulse = exp(-pow((frame-5.05)*9.,2.))*.22+exp(-pow((frame-5.29)*15.,2.))*.115;
    vec2 direction = ray.xy / max(.18,-ray.z) - vec2(-.23,.18);
    float boltY = 1.-smoothstep(.15,.18,abs(direction.y+.025));
    float bolt = abs(direction.x + direction.y*.18 + (noise(vec2(direction.y*94.,15.))-.5)*.033);
    color += uAccent*exp(-length(direction)*5.)*pulse;
    color += uAccent*exp(-bolt*680.)*boltY*pulse*3.5;
    gl_FragColor = vec4(color,1.);
  }
`;

function water(scene: T.Scene, accent: T.Color, base: T.Color, isWinter: boolean) {
  const material = new T.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uAccent: { value: accent }, uBase: { value: base } },
    vertexShader: `
      varying vec3 vWorld;
      void main(){
        vWorld = (modelMatrix*vec4(position,1.)).xyz;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
      }`,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uAccent, uBase;
      varying vec3 vWorld;
      ${noiseGLSL}
      ${isWinter ? auroraGLSL : ''}
      void main(){
        vec3 d = normalize(vWorld-cameraPosition);
        vec2 p = vWorld.xz;
        float waves = sin(p.y*3.7 + sin(p.x*.62)*1.8 + uTime*1.4);
        float chop = noise(p*vec2(4.8,2.7)+vec2(0.,uTime*.55));
        float ripples = waves*.006+(chop-.5)*.017;
        vec3 ref = normalize(vec3(d.x + ripples*.7, -d.y + ripples, d.z));
        float fresnel = pow(1.-abs(d.y), 3.2);
        ${isWinter ? `
          vec3 light = aurora(ref,uTime,uAccent);
          vec3 color = mix(uBase*.48,uBase+vec3(.05,.07,.1),fresnel);
          color += light*(.29+.22*chop)*smoothstep(.016,.1,ref.y);
          float sheen = noise(p*vec2(1.9,13.))*.04;
          color += sheen*vec3(.35,.65,1.)*fresnel;
        ` : `
          float diffuse = fbm((ref.xy/max(-ref.z,.3))*vec2(9.,15.) + vec2(uTime*.08,0.));
          vec3 color = mix(uBase*.43,uAccent*(.18+.27*diffuse),fresnel*.88);
          vec2 cell = floor(p*3.);
          vec2 offset = vec2(hash(cell),hash(cell+61.))*.63+.19;
          float age = fract(uTime*1.25+hash(cell+28.));
          float dist = length(fract(p*3.)-offset);
          float ring = (1.-smoothstep(.011,.035,abs(dist-age*.43)))*(1.-age)*smoothstep(0.,.19,-d.y);
          color += uAccent*(pow(max(0.,chop),5.)*.13 + ring*.19);
        `}
        float distant = smoothstep(54.,155.,distance(vWorld,cameraPosition));
        color = mix(color,uBase*.92,distant*.72);
        gl_FragColor=vec4(color,1.);
      }`,
  });
  const mesh = new T.Mesh(new T.PlaneGeometry(285,350).rotateX(-Math.PI/2).translate(0,0,-100), material);
  scene.add(mesh);
  return material.uniforms.uTime;
}

interface Peak { x: number; z: number; w: number; d: number; h: number }

function valley(scene: T.Scene, isWinter: boolean, base: T.Color) {
  const peaks: Peak[] = isWinter ? [
    {x:-32,z:-37,w:30,d:29,h:22}, {x:34,z:-43,w:34,d:33,h:28},
    {x:-50,z:-59,w:37,d:43,h:29}, {x:54,z:-74,w:39,d:43,h:38},
    {x:-23,z:-86,w:29,d:37,h:32}, {x:25,z:-94,w:37,d:40,h:35},
    {x:-4,z:-119,w:33,d:37,h:32}, {x:14,z:-146,w:42,d:44,h:25},
    {x:-48,z:-122,w:40,d:47,h:42}, {x:47,z:-132,w:44,d:45,h:43},
  ] : [
    {x:-36,z:-26,w:35,d:33,h:15}, {x:36,z:-47,w:29,d:34,h:22},
    {x:-49,z:-56,w:42,d:38,h:22}, {x:-17,z:-74,w:25,d:27,h:31},
    {x:34,z:-88,w:31,d:46,h:30}, {x:13,z:-109,w:28,d:36,h:19},
    {x:-24,z:-116,w:34,d:40,h:28}, {x:1,z:-151,w:35,d:44,h:25},
  ];
  const rand = randomGenerator(isWinter ? 809 : 259);
  const stone = new T.Color(isWinter ? '#3e4f7e' : '#30484a').lerp(base,.24);
  const cliff = new T.Color(isWinter ? '#52668a' : '#526463');
  const snow = new T.Color('#d9e5f9');
  const trees = new T.Color(isWinter ? '#172642' : '#1c343b');
  const getHeight = (x: number,z: number) => {
    const banks = (Math.abs(x)-10-(.12*Math.max(0,-z-10)))*.31;
    const a = fractal(x*.074+9,z*.081);
    const b = fractal(x*.24,z*.18);
    let elevation = Math.min(7, Math.max(-2.4,banks))*Math.exp(Math.min(0,(z+19)*.038));
    for (const p of peaks) {
      const shape = ridge(x+(a-.5)*13,z+(b-.5)*10,p.x,p.z,p.w,p.d);
      elevation = Math.max(elevation, Math.pow(shape, .86)*p.h*(.74+.59*a));
    }
    const headland = isWinter ? 0 : ridge(x,z, 10.8,-8,5.7,7.8)*3.25;
    return Math.max(headland,elevation)+(a-.58)*3.2 + (b-.5)*Math.min(elevation+2.6,9)*.72 - .63;
  };
  const mass = terrain(240,214,221,207,-73,getHeight,(x,y,z,slope) => {
    const channels = Math.abs(fractal(x*.14+y*.12,z*.18)-.50);
    const bands = fractal(x*.34+y*.77,z*.25);
    const cliffColor = stone.clone().lerp(cliff,bands*.71+Math.max(0,slope)*.29);
    const ice = T.MathUtils.smoothstep(y-bands*6-slope*12, isWinter ? 1.9 : 23, isWinter ? 12 : 34);
    const moss = T.MathUtils.smoothstep(y,0,5)*(1-T.MathUtils.smoothstep(y,7,16));
    return cliffColor.lerp(trees,moss*.46).lerp(snow,ice*(.56+bands*.37+channels*.22));
  });
  scene.add(mass);
  const stones: Instance[] = [];
  const pines: Instance[] = [];
  const snowcaps: Instance[] = [];
  const trunks: Instance[] = [];
  for (let i=0;i<1750;i++) {
    const sign = rand()<.5 ? -1:1;
    const x = sign*(10+rand()*42);
    const z = 18-rand()*112;
    const y = getHeight(x,z);
    if (y < .25 || y > (isWinter ? 10.1 : 9.6) || (!isWinter && Math.hypot(x-10.8,z+8)<4.6)) continue;
    const size = .47+Math.pow(rand(),1.3)*2.7;
    if (i%4===0) {
      stones.push({ x,y:y+.07,z,sx:size*.51,sy:size*.22,sz:size*.37,ry:rand()*6,color:stone.clone().lerp(isWinter ? snow : cliff,rand()*.69) });
      continue;
    }
    const lean = (rand()-.5)*.14;
    const barkColor = trees.clone().multiplyScalar(.82);
    trunks.push({ x,y:y+size*.43,z,sx:size*.083,sy:size*.86,sz:size*.083,rz:lean,color:barkColor });
    for(let tier=0;tier<4;tier++) {
      const radius = size*(.39-tier*.069)*(.89+rand()*.24);
      const h = size*(.53-tier*.053);
      const layerY = y+size*(.41+tier*.178);
      pines.push({ x,y:layerY,z,sx:radius,sy:h,sz:radius,ry:rand()*6,rz:lean,
        color:trees.clone().lerp(cliff,rand()*.35+.09*tier) });
      if (isWinter) snowcaps.push({ x,y:layerY+h*.075,z,sx:radius*.87,sy:h*.89,sz:radius*.87,
        ry:rand()*.58,rz:lean,color:snow.clone().lerp(stone,rand()*.35+.16) });
    }
  }
  instanced(scene,rockGeometry(18),new T.MeshStandardMaterial({vertexColors:true,roughness:.96}),stones);
  const needle = new T.MeshStandardMaterial({roughness:1, flatShading:true});
  const cone = new T.ConeGeometry(1,1,11,3);
  const vertices = cone.getAttribute('position');
  for (let i=0;i<vertices.count;i++) {
    const x=vertices.getX(i), z=vertices.getZ(i);
    const waves=Math.cos(Math.atan2(z,x)*5)*.15;
    vertices.setXYZ(i,x*(1+waves),vertices.getY(i)+waves*.14,z*(1+waves));
  }
  cone.computeVertexNormals();
  instanced(scene,cone,needle,pines);
  if (isWinter) instanced(scene,cone,needle,snowcaps);
  instanced(scene,new T.CylinderGeometry(.35,.7,1,6),needle,trunks);
  return getHeight;
}

function lighthouse(scene: T.Scene, y: number) {
  const tower = new T.Group();
  tower.position.set(10.8,y,-8);
  scene.add(tower);
  const lightStone = new T.MeshStandardMaterial({color:'#ded0b5',roughness:.88});
  const brick = new T.MeshStandardMaterial({color:'#843f40',roughness:.81});
  const iron = new T.MeshStandardMaterial({color:'#28303b',roughness:.64});
  const lamp = new T.MeshBasicMaterial({color:'#ffdca2'});

  function part(geometry: T.BufferGeometry, material: T.Material, x: number, height: number, z: number) {
    const mesh = new T.Mesh(geometry,material);
    mesh.position.set(x,height,z);
    tower.add(mesh);
    return mesh;
  }
  part(new T.CylinderGeometry(1.0,1.25,.53,18),iron,0,.15,0);
  for(let band=0;band<6;band++) {
    const side=.83-.052*band;
    part(new T.CylinderGeometry(side-.052,side,.79,20),band%2===0 ? lightStone : brick,0,.76+band*.79,0);
  }
  part(new T.BoxGeometry(.4,.77,.13),iron,0,.73,.8);
  for(const y of [2.35,3.92]) {
    part(new T.BoxGeometry(.24,.34,.12),iron,0,y,.78-(y-1)*.055);
    part(new T.BoxGeometry(.12,.20,.10),lamp,0,y,.84-(y-1)*.055);
  }
  part(new T.CylinderGeometry(1.01,.82,.29,24),iron,0,5.14,0);
  part(new T.CylinderGeometry(.40,.40,.74,18),lamp,0,5.64,0);
  part(new T.ConeGeometry(.79,.75,18),brick,0,6.37,0);
  part(new T.SphereGeometry(.105,10,8),iron,0,6.74,0);
  for(let i=0;i<16;i++) {
    const angle = i*Math.PI/8;
    part(new T.CylinderGeometry(.024,.024,.45,6),iron,Math.sin(angle)*.95,5.41,Math.cos(angle)*.95);
    if (i%2===0) part(new T.CylinderGeometry(.033,.033,.77,6),iron,Math.sin(angle)*.49,5.65,Math.cos(angle)*.49);
  }
  part(new T.TorusGeometry(.96,.024,5,32).rotateX(Math.PI/2),iron,0,5.61,0);

  const glow = new T.PointLight('#ffba77',17,14,2);
  glow.position.set(0,5.67,0);
  tower.add(glow);
  const beacon = new T.Group();
  beacon.position.y=5.67;
  tower.add(beacon);
  const beam = new T.Mesh(new T.ConeGeometry(1.65,19,32,1,true).rotateZ(Math.PI/2).translate(9.52,0,0),new T.ShaderMaterial({
    transparent:true,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending,
    vertexShader:`varying vec3 vBeam;
      void main(){ vBeam=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader:`varying vec3 vBeam;
      void main(){ gl_FragColor=vec4(.97,.79,.58,.083*(1.-smoothstep(0.,19.,vBeam.x))); }`,
  }));
  beacon.add(beam);
  return beacon;
}

export const fjordStorm: BuildScene = ({ scene,camera,accent,base }) => {
  scene.fog = new T.FogExp2(base.clone().lerp(accent,.24),.0135);
  const sky = skyDome(scene,stormSky,accent,base);
  const lake = water(scene,accent,base,false);
  const rainfall = rain(scene,accent);
  const shore = valley(scene,false,base);
  const lantern = lighthouse(scene,shore(10.8,-8));
  const light = lighting(scene,'#b2d0df','#596b71','#bfdaed',1.6,[-18,23,1],1.55);
  return {
    still: 2,
    update(time) {
      sky.value = lake.value = rainfall.value = time;
      const flash = (time+2)%15;
      lantern.rotation.y = time*.37+.34;
      light.intensity = 1.6 + .72*Math.exp(-Math.pow((flash-5.05)*9,2));
      camera.position.set(Math.sin(time*.11)*1.3,4.22+Math.sin(time*.14)*.31,23+Math.cos(time*.12)*1.9);
      camera.lookAt(-.9,9.2,-49);
    },
  };
};

export const alpineAurora: BuildScene = ({ scene,camera,accent,base }) => {
  scene.fog = new T.FogExp2(base.clone().lerp(new T.Color('#446187'),.38),.009);
  const sky = skyDome(scene,auroraSky,accent,base);
  const lake = water(scene,accent,base,true);
  valley(scene,true,base);
  lighting(scene,'#91bee9','#2c3250','#b6dafa',1.45,[-19,25,4],1.50);
  return {
    still: 5,
    update(time) {
      sky.value = lake.value = time;
      camera.position.set(Math.sin(time*.095)*1.43,3.86+Math.sin(time*.14)*.29,24+Math.cos(time*.086)*2.0);
      camera.lookAt(.1,7.7,-54);
    },
  };
};
