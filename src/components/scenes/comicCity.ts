import * as T from 'three';
import { instanced, randomGenerator, skyDome, skyUniforms, type BuildScene, type Instance } from './scene';

const sky = `
  ${skyUniforms}
  void main() {
    vec3 direction = viewRay();
    vec2 uv = vec2(direction.x / -direction.z, direction.y / -direction.z);
    vec2 sun = (uv - vec2(-.175,.198)) * vec2(1.,1.04);
    float distanceToSun = length(sun);
    vec3 color = mix(uAccent * .78, uBase, smoothstep(-.06,.37,uv.y));
    color = mix(color, vec3(1.,.61,.38), (1.-smoothstep(.015,.25,abs(uv.y+.025)))*.28);
    float rays = sin(atan(sun.y,sun.x)*34. + distanceToSun*4. - uTime*.12);
    color = mix(color, vec3(1.,.58,.43), smoothstep(.84,.99,rays)*smoothstep(.14,.58,distanceToSun)*.21);
    vec2 dotCell = fract(uv*154.)-.5;
    color *= 1. - .31 * (1.-smoothstep(.12,.24,length(dotCell))) * smoothstep(.08,.36,distanceToSun);
    color = mix(color, vec3(.09,.055,.16), 1.-smoothstep(.123,.127,distanceToSun));
    float disk = 1.-smoothstep(.115,.12,distanceToSun);
    float stripe = smoothstep(.3,.43,fract((sun.y + .15)*99.)) * smoothstep(.03,.11,-sun.y);
    color = mix(color, mix(vec3(1.,.80,.5),uAccent,(1.-smoothstep(-.12,.1,sun.y))), disk*(1.-stripe*.82));
    gl_FragColor = vec4(color,1.);
  }
`;

const palette = (value: string) => new T.Color(value);

export const comicCity: BuildScene = ({ scene, camera, accent, base }) => {
  const rand = randomGenerator(905);
  const ink = palette('#120e2a');
  const paper = palette('#faddaa');
  const teal = palette('#5ce6dd');
  const purple = base.clone().lerp(palette('#814e9d'), 0.38);
  const buildings: Instance[] = [];
  const edges: Instance[] = [];
  const trim: Instance[] = [];
  const windows: Instance[] = [];
  const tanks: Instance[] = [];
  const roofs: Instance[] = [];
  const boxes = new T.BoxGeometry();
  const skyTime = skyDome(scene, sky, accent, base);
  scene.fog = new T.FogExp2(base.clone().lerp(accent, 0.36), 0.0065);

  function add(list: Instance[], x: number, y: number, z: number, sx: number, sy: number, sz: number, color: T.Color, ry = 0) {
    list.push({ x, y, z, sx, sy, sz, color, ry });
  }

  function block(x: number, z: number, w: number, d: number, h: number, front: boolean) {
    const face = purple.clone().lerp(rand() > 0.4 ? accent : teal, rand() * 0.3);
    const lit = rand() > 0.45 ? paper : teal;
    add(buildings, x, h/2, z, w, h, d, face);
    add(trim, x, h+.1, z, w+.3, .2, d+.3, ink);
    add(trim, x, h+.35, z, w+.05, .23, d+.05, face.clone().lerp(paper,.22));
    for (const side of [-1, 1]) {
      for (const edge of [-1, 1]) add(edges, x+side*w/2, h/2, z+edge*d/2, .095, h+.14, .095, ink);
    }
    const cols = Math.max(2, Math.round(w / 1.05));
    const rows = Math.floor(h / 1.24);
    for (let row = 0; row < rows; row++) {
      const y = .78+row*1.24;
      if (row % 3 === 0) {
        add(trim, x, y+.63, z+d/2+.018, w, .09, .075, ink);
        if (front) add(trim, x-Math.sign(x)*w/2, y+.63, z, .08,.09,d, ink);
      }
      for (let col = 0; col < cols; col++) {
        const xx = x - w/2 + (col+.5)*w/cols;
        const dark = rand() < .26;
        add(windows, xx, y, z+d/2+.018, .55,.76,.05, ink);
        add(windows, xx, y+.025, z+d/2+.052, .39,.58,.05, dark ? face.clone().multiplyScalar(.65) : lit.clone().lerp(accent, rand()*.58).multiplyScalar(.63+rand()*.37));
        if (front && !dark) add(windows, xx, y+.025,z+d/2+.085,.033,.58,.026,ink);
      }
      if (!front) continue;
      for (let side = 0; side < Math.round(d); side++) {
        const zz = z+d/2-side-.5;
        const xx = x-Math.sign(x)*(w/2+.029);
        add(windows, xx, y, zz,.07,.77,.6,ink);
        add(windows, xx-Math.sign(x)*.042,y+.02,zz,.042,.6,.42,lit.clone().lerp(face, .5+rand()*.48));
      }
    }
    if (rand() > .23) {
      const tx = x + (rand()-.5)*w*.5;
      const tz = z + (rand()-.5)*d*.5;
      for (const dx of [-.36,.36]) for (const dz of [-.36,.36]) add(trim, tx+dx,h+.69,tz+dz,.09,.85,.09,ink);
      add(tanks,tx,h+1.21,tz,.78,.75,.78,face.clone().lerp(paper,.27));
      add(roofs,tx,h+1.7,tz,.91,.42,.91,ink);
      add(tanks,tx,h+1.35,tz,.82,.08,.82,ink);
      add(tanks,tx,h+1.05,tz,.82,.08,.82,ink);
      add(trim,tx+1,h+1.23,tz,.055,2.5,.055,ink);
      add(trim,tx+1,h+1.95,tz,.67,.055,.06,paper.clone().multiplyScalar(.66));
    }
    if (front) {
      for (let row = 1; row < h-2; row += 3.72) {
        const side = x - Math.sign(x)*(w/2+.37);
        add(trim, side,row,z+.61,.78,.085,d*.47,ink);
        add(trim, side-Math.sign(x)*.34,row+.36,z+.61,.075,.07,d*.49,ink);
        for (let i = 0; i < 7; i++) add(trim,side-Math.sign(x)*.34,row+.18,z-.49+i*.34,.054,.4,.054,ink);
      }
    }
  }

  for (let row = 0; row < 4; row++) {
    for (const side of [-1, 1]) {
      for (let lane = 0; lane < 3; lane++) {
        const z = 3-row*12+rand()*3-lane*4.3;
        const x = side*(9.1+lane*6+rand()*1.3+row*.3);
        block(x,z,4.6+rand()*1.6,4.7+rand()*3,4+rand()*8.8+lane, lane === 0);
      }
    }
  }
  for (let i = 0; i < 35; i++) block(-66+i*3.9,-53-rand()*20,3+rand()*2.6,3.4+rand()*4,1.8+rand()*10.8,false);

  add(trim,0,-.22,-25,155,.37,160,purple.clone().multiplyScalar(.66));
  add(trim,0,-.012,-24,12,.08,150,ink.clone().lerp(base,.37));
  for (let i = 0; i < 44; i++) {
    add(trim,0,.045,21-i*2.6,.117,.035,1.32,paper.clone().multiplyScalar(.62));
    for (const sign of [-1,1]) {
      add(trim,sign*6.2,.04,21-i*2.6,.21,.13,2.55,ink);
      add(trim,sign*6.37,.08,21-i*2.6,.10,.07,2.55,accent.clone().multiplyScalar(.62));
    }
  }
  for (const crossing of [7, -14, -34]) {
    for (let i = 0; i < 13; i++) add(trim, -5.3+i*.88,.05,crossing,.47,.046,1.46,paper.clone().multiplyScalar(.72));
  }
  for (const sign of [-1,1]) {
    for (let i = 0; i < 9; i++) {
      const z = 10-i*6.8;
      add(trim,sign*6.6,1.61,z,.105,3.24,.105,ink);
      add(trim,sign*6.29,3.2,z,.72,.084,.11,ink);
      add(windows,sign*5.94,3.16,z,.37,.19,.27,paper);
      add(trim,sign*7.44,.45,z-2.4,.61,.62,.61,purple);
    }
  }

  for (const rail of [1.73, 3.02, 3.75, 5.04]) {
    add(trim,rail,.045,-23,.07,.025,115,paper.clone().lerp(ink,.65));
  }
  for (const cable of [2.37,4.39]) add(trim,cable,3.98,-23,.024,.028,113,ink);
  for(let i=0;i<9;i++) {
    const z=10-i*8.8;
    add(trim,6.23,2.03,z,.08,4.1,.08,ink);
    add(trim,4.28,4.0,z,3.94,.05,.065,ink);
  }

  const facade = new T.MeshToonMaterial({ color: '#ffffff' });
  facade.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <dithering_fragment>', `
      vec2 cell = fract(gl_FragCoord.xy / 4.5) - .5;
      float dotInk = 1. - smoothstep(.16,.31,length(cell));
      gl_FragColor.rgb *= 1. - dotInk * .2;
      #include <dithering_fragment>
    `);
  };
  instanced(scene, boxes, facade, buildings);
  const flat = new T.MeshBasicMaterial({ color: '#ffffff' });
  instanced(scene, boxes, flat, [...edges, ...trim, ...windows]);
  instanced(scene, new T.CylinderGeometry(.5,.5,1,12), facade, tanks);
  instanced(scene, new T.ConeGeometry(.53,1,12), flat, roofs);
  const train = new T.Group();
  const red = accent.clone().lerp(palette('#962a36'),.32);
  const gold = paper.clone().lerp(palette('#ff903f'),.32);
  const glass = teal.clone().lerp(ink,.47);
  const wheel = new T.CylinderGeometry(.255,.255,.21,14).rotateZ(Math.PI/2);
  const trainParts: Instance[] = [];
  const wheels: Instance[] = [];
  for (const z of [0,-4.25]) {
    add(trainParts,0,.87,z,1.85,1.3,3.95,red);
    add(trainParts,0,1.68,z,1.77,1.02,3.78,gold);
    add(trainParts,0,2.22,z,1.96,.27,4.05,ink);
    add(trainParts,0,2.37,z,1.79,.09,3.85,gold.clone().multiplyScalar(.92));
    add(trainParts,0,.365,z,1.92,.22,4.08,ink);
    for (const side of [-1,1]) {
      for (const offset of [-1.26,-.42,.42,1.26]) {
        add(trainParts,side*.90,1.66,z+offset,.07,.79,.72,ink);
        add(trainParts,side*.943,1.68,z+offset,.039,.62,.57,glass);
        add(trainParts,side*.964,1.91,z+offset,.024,.08,.55,teal.clone().multiplyScalar(.84));
        add(trainParts,side*.952,1.15,z+offset,.045,.075,.73,gold);
      }
      for (const offset of [-1.18,1.18]) add(wheels,side*.81,.28,z+offset,1,1,1,ink);
      for (const end of [-1,1]) {
        add(trainParts,side*.40,1.68,z+end*1.92,.77,.82,.07,ink);
        add(trainParts,side*.40,1.71,z+end*1.965,.63,.64,.047,glass);
        add(trainParts,side*.48,.89,z+end*2.034,.27,.18,.07,end===1 ? paper : accent);
      }
    }
    add(trainParts,0,1.155,z+2.008,1.71,.11,.085,gold);
    add(trainParts,0,.51,z+2.09,1.75,.12,.2,ink);
    trainParts.push({x:0,y:3.1,z:z+.02,sx:.065,sy:1.8,sz:.065,rx:-.28,color:ink});
  }
  const chassis = instanced(scene,boxes,flat,trainParts);
  const axles = instanced(scene,wheel,flat,wheels);
  train.add(chassis,axles);
  scene.add(train);

  const light = new T.DirectionalLight('#ffd1b9', 1.25);
  light.position.set(-5,11,8);
  scene.add(light, new T.HemisphereLight('#e6b2f6','#8f709f',1.8));

  return {
    still: 6,
    update(time) {
      skyTime.value = time;
      train.position.set(2.37,0,-63+((time+17)%31)*2.8);
      camera.position.set(Math.sin(time*.15)*1.08, 3.8+Math.cos(time*.17)*.36, 18+Math.sin(time*.11)*1.9);
      camera.lookAt(-.6, 4.9, -31);
    },
  };
};
