import * as T from 'three';
import { randomGenerator } from './scene';

const color = (hex: string) => new T.Color(hex);

export function jerichoWarriors(scene: T.Scene, ground: (x: number, z: number) => number) {
  const rand = randomGenerator(6001);
  const people = Array.from({ length: 16 }, (_, i) => {
    const enemy = i >= 10;
    return {
      enemy,
      rank: enemy ? i - 10 : i,
      lane: (i % 5 - 2) * 1.33 + (rand() - .5)*.45,
      phase: rand() * Math.PI * 2,
      size: .93 + rand()*.28,
      tunic: (enemy ? color('#ac4638') : color('#ded2b3')).multiplyScalar(.77+rand()*.23),
      cloak: (enemy ? color('#7d2827') : color('#1162a9')).multiplyScalar(.74+rand()*.24),
      skin: color('#c48a55').lerp(color('#74442e'),rand()*.65),
    };
  });
  const count = people.length;
  const leather = color('#2d2024');
  const bronze = color('#c88c42');
  const silver = color('#d5dbe0');
  const wood = color('#715038');

  const partMaterial = new T.MeshStandardMaterial({ roughness: .84 });
  function batch(geometry: T.BufferGeometry, pieces: number) {
    const mesh = new T.InstancedMesh(geometry, partMaterial, count*pieces);
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    scene.add(mesh);
    return mesh;
  }
  const body = batch(new T.CylinderGeometry(.30, .24, .64, 10),1);
  const skirts = batch(new T.CylinderGeometry(.22,.32,.36,10),1);
  const spheres = batch(new T.SphereGeometry(1,12,8),4);
  const limbs = batch(new T.CylinderGeometry(.86,1,1,7),8);
  const plates = batch(new T.BoxGeometry(1,1,1),7);
  const disk = batch(new T.CylinderGeometry(1,1,.13,20).rotateX(Math.PI/2),3);
  const spears = batch(new T.CylinderGeometry(.016,.03,1.51,7),1);
  const spearheads = batch(new T.ConeGeometry(.073,.25,4),1);
  const capes = batch(new T.PlaneGeometry(.63,.65,5,8).translate(0,-.325,0),1);
  const cloth = new T.MeshStandardMaterial({ roughness:.94, side:T.DoubleSide });
  const clothTime={value:0};
  cloth.onBeforeCompile=(shader)=>{
    shader.uniforms.uTime=clothTime;
    shader.vertexShader='uniform float uTime;\n'+shader.vertexShader.replace('#include <begin_vertex>',`
      #include <begin_vertex>
      float fall=1.-uv.y;
      transformed.z += fall*fall*(.17+.14*sin(uv.x*13. + uTime*6. + instanceMatrix[3].x));
      transformed.x += fall*.09*sin(uTime*5.+instanceMatrix[3].z);
    `);
  };
  capes.material=cloth;
  const root = new T.Object3D();
  const part = new T.Object3D();
  const rotation = new T.Quaternion();
  const direction = new T.Vector3();
  const up = new T.Vector3(0,1,0);
  const local = new T.Matrix4();

  function piece(mesh: T.InstancedMesh, index: number, tint: T.Color, x: number, y: number, z: number,
    sx: number, sy: number, sz: number, rx = 0, ry = 0, rz = 0) {
    part.position.set(x,y,z);
    part.scale.set(sx,sy,sz);
    part.rotation.set(rx,ry,rz);
    part.updateMatrix();
    local.multiplyMatrices(root.matrix,part.matrix);
    mesh.setMatrixAt(index,local);
    mesh.setColorAt(index,tint);
  }

  function limb(index: number, tint: T.Color, a: T.Vector3, b: T.Vector3, radius: number) {
    direction.subVectors(b,a);
    const length=direction.length();
    rotation.setFromUnitVectors(up,direction.normalize());
    part.position.copy(a).lerp(b,.5);
    part.scale.set(radius,length,radius);
    part.quaternion.copy(rotation);
    part.updateMatrix();
    local.multiplyMatrices(root.matrix,part.matrix);
    limbs.setMatrixAt(index,local);
    limbs.setColorAt(index,tint);
  }

  const joints = Array.from({length:8}, () => new T.Vector3());
  return (time: number) => {
    clothTime.value=time;
    people.forEach(({ enemy,rank,lane,phase,size,tunic,cloak,skin },i) => {
      const pursue = T.MathUtils.smoothstep(time,1.7,8.4);
      const yieldShield = enemy ? T.MathUtils.smoothstep(time,4.6+rank*.14,5.5+rank*.17) : 0;
      const reset = T.MathUtils.smoothstep(time,10.25,12.65);
      const defeated = enemy && rank%3===1
        ? T.MathUtils.smoothstep(time,5.1+rank*.19,6.2+rank*.18)*(1-reset)
        : 0;
      const escape = enemy ? T.MathUtils.smoothstep(time,5.35,9.8)*(1-defeated) : T.MathUtils.smoothstep(time,8.0,10.8);
      const initialX = (enemy ? 2.75 : -5.8) + lane*.81;
      const x = initialX + (pursue*(enemy ? 6.9 : 12.0)+escape*(enemy ? 7.1 : 2.5))*(1-reset);
      const z = (enemy ? 8.0 : 9.4) + (rank%3)*1.86 + lane*.63 - (escape*6.0+pursue*1.5)*(1-reset);
      const rally = (enemy ? 0 : T.MathUtils.smoothstep(time,6.9,8.1)*(1-T.MathUtils.smoothstep(time,10.2,11.0)));
      const step = time * (enemy ? 14.2 : 11.6) + phase + rank*.34;
      const stride = Math.sin(step) * (.66-rally*.37)*(1-defeated);
      const vertical = Math.abs(Math.cos(step))*.069;
      root.position.set(x,ground(x,z)+vertical+.02-defeated*.15,z);
      root.rotation.set(.03+defeated*.66,Math.PI*.37+.21*Math.sin(time*.42+phase)+yieldShield*.30,-.13+stride*.10-defeated*.83);
      root.scale.setScalar(size*1.40);
      root.updateMatrix();
      piece(body,i,tunic,0,1.22,0,1,1,1);
      piece(skirts,i,tunic,0,.88,.007,1,1,1);
      piece(capes,i,cloak,0,1.49,-.17,.94,1.04,1,-.15);
      piece(spheres,i*4,skin,0,1.68,.06,.145,.171,.126);
      piece(spheres,i*4+1,enemy ? bronze : cloak,0,1.76,.042,.159,.134,.143);
      piece(spheres,i*4+2,leather,0,1.609,.118,.108,.075,.074);
      piece(spheres,i*4+3,bronze,0,1.741,.161,.028,.039,.026);
      piece(plates,i*7,leather,0,1.009,-.002,.515,.103,.493);
      piece(plates,i*7+1,bronze,0,1.01,.258,.10,.07,.042);
      piece(plates,i*7+2,cloak,-.02,1.317,.257,.103,.63,.035,0,0,.55);
      piece(plates,i*7+3,bronze,-.28,1.455,.007,.158,.121,.28,0,0,-.3);
      piece(plates,i*7+4,bronze,.28,1.455,.007,.158,.121,.28,0,0,.3);
      for (const side of [-1,1]) {
        const limbOffset=side===1 ? 4 : 0;
        const swing=side*stride;
        const handY=1.14+side*.07+Math.max(0,-swing)*.17+(side===1 ? rally*.78 : 0);
        const hip=joints[0].set(side*.133,.89,0);
        const knee=joints[1].set(side*.166,.53,swing*.33+Math.max(0,swing)*.17);
        const footY=.102+Math.max(0,-swing)*.27;
        const footZ=swing*.66;
        const ankle=joints[2].set(side*.173,footY,footZ);
        const shoulder=joints[3].set(side*.29,1.43,.005);
        const elbow=joints[4].set(side*.385,1.175+rally*(side===1 ? .31 : 0),-.07-swing*.26);
        const hand=joints[5].set(side*.42,handY,.32-swing*.29);
        limb(i*8+limbOffset,tunic,hip,knee,.120);
        limb(i*8+limbOffset+1,leather,knee,ankle,.077);
        limb(i*8+limbOffset+2,tunic,shoulder,elbow,.083);
        limb(i*8+limbOffset+3,skin,elbow,hand,.053);
        piece(plates,i*7+(side===-1 ? 5 : 6),leather,side*.17,footY-.039,footZ+.07,.15,.114,.29,swing*.30);
        if (side===1) {
          piece(spears,i,wood,hand.x,hand.y+.26,hand.z,1,1,1,.20+stride*.275-rally*.28-(enemy ? yieldShield*.99 : 0));
          piece(spearheads,i,silver,hand.x,hand.y+1.09,hand.z+.16,1,1,1,.20+stride*.27-rally*.28-(enemy ? yieldShield*.99 : 0));
        }
      }
      const shieldY=1.17-yieldShield*.94;
      const shieldZ=.38-yieldShield*.42;
      piece(disk,i*3,bronze,-.355,shieldY,shieldZ,.337,.378,.50,.10,0,-.16-yieldShield*.97);
      piece(disk,i*3+1,cloak,-.355,shieldY,shieldZ+.053,.278,.31,.42,.10,0,-.16-yieldShield*.97);
      piece(disk,i*3+2,bronze,-.355,shieldY,shieldZ+.103,.105,.105,.57,.10,0,-.16-yieldShield*.97);
    });
    for (const mesh of [body,skirts,spheres,limbs,plates,disk,spears,spearheads,capes]) {
      mesh.instanceMatrix.needsUpdate=true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate=true;
    }
  };
}
