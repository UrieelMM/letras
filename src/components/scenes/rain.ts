import * as T from 'three';
import { randomGenerator } from './scene';

export function rain(scene: T.Scene, accent: T.Color, count = 2300) {
  const rand = randomGenerator(64);
  const positions = new Float32Array(count*6);
  const details = new Float32Array(count*6);
  for (let i=0;i<count;i++) {
    const x=(rand()-.5)*67, y=rand()*24, z=29-rand()*98, speed=8+rand()*17, length=.18+rand()*.62;
    positions.set([x,y,z,x,y,z],i*6);
    details.set([speed,length,0,speed,length,1],i*6);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position',new T.BufferAttribute(positions,3));
  geometry.setAttribute('drop',new T.BufferAttribute(details,3));
  const material = new T.ShaderMaterial({
    transparent:true,depthWrite:false,
    uniforms:{uTime:{value:0},uTint:{value:accent}},
    vertexShader:`
      uniform float uTime;
      attribute vec3 drop;
      varying float vOpacity;
      void main(){
        float y=mod(position.y-uTime*drop.x,24.);
        vec3 p=vec3(position.x+(24.-y)*.25+drop.z*drop.y*.26,y-drop.z*drop.y,position.z);
        vec4 view=modelViewMatrix*vec4(p,1.);
        gl_Position=projectionMatrix*view;
        vOpacity=(1.-smoothstep(12.,77.,-view.z))*(.27-drop.z*.18)*smoothstep(.1,1.6,y);
      }`,
    fragmentShader:'uniform vec3 uTint; varying float vOpacity; void main(){gl_FragColor=vec4(uTint,vOpacity);}',
  });
  const lines = new T.LineSegments(geometry,material);
  lines.frustumCulled = false;
  scene.add(lines);
  return material.uniforms.uTime;
}

export function forestRain(scene: T.Scene, tint: T.Color) {
  const random = randomGenerator(198);
  const count = 2040;
  const positions = new Float32Array(count * 4 * 3);
  const drops = new Float32Array(count * 4 * 3);
  const corners = new Float32Array(count * 4 * 2);
  const indices = new Uint16Array(count * 6);

  for (let i = 0; i < count; i++) {
    const near = i < 420;
    const x = (random() - .5) * (near ? 26 : 59);
    const y = random() * 18;
    const z = near ? 18 - random() * 12 : 6 - random() * 48;
    const speed = 10 + random() * 9;
    const length = (near ? .55 : .42) + random() * .74;
    const width = (near ? 1.25 : .86) + random() * .86;
    for (let j = 0; j < 4; j++) {
      const vertex = i * 4 + j;
      positions.set([x, y, z], vertex * 3);
      drops.set([speed, length, width], vertex * 3);
      corners.set([j % 2 === 0 ? -1 : 1, j < 2 ? 0 : 1], vertex * 2);
    }
    const first = i * 4;
    indices.set([first, first + 1, first + 2, first + 2, first + 1, first + 3], i * 6);
  }

  const geometry = new T.BufferGeometry()
    .setAttribute('position', new T.BufferAttribute(positions, 3))
    .setAttribute('aDrop', new T.BufferAttribute(drops, 3))
    .setAttribute('aCorner', new T.BufferAttribute(corners, 2))
    .setIndex(new T.BufferAttribute(indices, 1));
  const time = { value: 0 };
  const material = new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: T.DoubleSide,
    uniforms: { uTime: time, uTint: { value: tint } },
    vertexShader: `
      uniform float uTime;
      attribute vec3 aDrop;
      attribute vec2 aCorner;
      varying vec2 vCorner;
      varying float vOpacity;
      void main() {
        float y = mod(position.y - uTime * aDrop.x, 18.);
        float drift = .26 + .05 * sin(position.z * .31 + uTime * .91);
        vec3 start = vec3(position.x + (18. - y) * drift, y, position.z);
        vec3 end = start + vec3(aDrop.y * drift, -aDrop.y, 0.);
        vec4 top = projectionMatrix * modelViewMatrix * vec4(start, 1.);
        vec4 bottom = projectionMatrix * modelViewMatrix * vec4(end, 1.);
        vec4 clip = mix(top, bottom, aCorner.y);
        float ratio = projectionMatrix[0][0] / projectionMatrix[1][1];
        vec2 tangent = (bottom.xy / max(.1, bottom.w) - top.xy / max(.1, top.w)) / vec2(ratio, 1.);
        vec2 perpendicular = normalize(vec2(-tangent.y, tangent.x));
        float near = 1. - smoothstep(5., 31., clip.w);
        float width = aDrop.z * mix(.0018, .0035, near) * mix(.66, 1., aCorner.y);
        clip.xy += perpendicular * vec2(ratio, 1.) * aCorner.x * width * clip.w;
        gl_Position = clip;
        vCorner = aCorner;
        vOpacity = mix(.31, .69, near) * smoothstep(.1, 1.3, y) *
                   (1. - smoothstep(27., 65., clip.w)) * smoothstep(.85, 3.5, clip.w);
      }`,
    fragmentShader: `
      uniform vec3 uTint;
      varying vec2 vCorner;
      varying float vOpacity;
      void main() {
        float edge = 1. - smoothstep(.17, 1., abs(vCorner.x));
        float tip = smoothstep(0., .69, vCorner.y) * (1. - smoothstep(.87, 1., vCorner.y));
        gl_FragColor = vec4(mix(uTint * .64, uTint, edge), edge * tip * vOpacity);
      }`,
  });
  const streaks = new T.Mesh(geometry, material);
  streaks.frustumCulled = false;
  streaks.renderOrder = 2;
  scene.add(streaks);
  return time;
}
