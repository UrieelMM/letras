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
