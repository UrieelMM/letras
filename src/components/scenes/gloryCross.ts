import * as T from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {
  fractal, instanced, lighting, noiseGLSL, randomGenerator, ridge, rockGeometry, skyDome, skyUniforms,
  terrain, type BuildScene, type Instance,
} from './scene';

const dawn = `
  ${skyUniforms}
  ${noiseGLSL}
  void main(){
    vec3 d=viewRay();
    vec2 uv=d.xy/max(.17,-d.z);
    vec2 source=(uv-vec2(-.155,.187))*vec2(1.,1.24);
    float distanceToLight=length(source);
    float halo=exp(-distanceToLight*4.5);
    vec3 plum=uBase*.88;
    vec3 color=mix(vec3(.61,.31,.30),plum,smoothstep(.012,.44,uv.y));
    color+=uAccent*halo*.76;
    vec2 q=vec2(uv.x*6.,uv.y*18.)+vec2(uTime*.019,0.);
    float cloud=fbm(q+noise(q*.43)*2.3);
    float density=smoothstep(.37,.64,cloud)*smoothstep(.07,.27,uv.y);
    float haloEdge=smoothstep(.45,.58,cloud-fbm(q+vec2(.12,.2))*.23+.16);
    color=mix(color,plum+vec3(.21,.15,.22)+halo*.35*uAccent,density*.89);
    color+=uAccent*.32*haloEdge*halo;
    float angle=atan(source.y,source.x);
    float fan=sin(angle*14.+sin(angle*8.)*.7)+sin(angle*23.-.4)*.43;
    float ray=pow(clamp(.46+.35*fan,0.,1.),4.)*(.48+.52*fbm(q*.5));
    color+=uAccent*(.61*ray*exp(-distanceToLight*2.7)+.43*exp(-distanceToLight*28.));
    gl_FragColor=vec4(color,1.);
  }
`;

export const gloryCross: BuildScene = ({ scene,camera,accent,base }) => {
  const color=(value:string)=>new T.Color(value);
  const rock=color('#4a405d');
  const range=color('#906979');
  const sandstone=color('#b29a8e');
  const amber=color('#cc9b58');
  const rand=randomGenerator(4467);
  scene.fog = new T.FogExp2(base.clone().lerp(accent,.43),.009);
  const sky = skyDome(scene,dawn,accent,base);
  lighting(scene,'#d8b0b2','#47323e','#ffe3ab',2.25,[-9,12,-16],1.58);
  const fill=new T.DirectionalLight('#a6a9cf',1.33);
  fill.position.set(13,13,15);
  scene.add(fill);
  const crossX=-4.25;
  const crossZ=-1.6;
  function ground(x:number,z:number) {
    const lift=ridge(x,z,-40,-30,31,35)*11+ridge(x,z,46,-50,38,37)*23
      +ridge(x,z,-49,-88,45,39)*29+ridge(x,z,15,-106,37,44)*20;
    const detail=(fractal(x*.087,z*.093)-.47)*(1.1+Math.min(3,lift*.19));
    const terrace=T.MathUtils.smoothstep(Math.hypot(x-crossX,z-crossZ),4.5,10);
    return -.5+lift+detail*terrace;
  }
  scene.add(terrain(164,180,145,145,-57,ground,(x,y,z,slope)=>{
    const texture=fractal(x*.4,z*.31+y*.33);
    return rock.clone().lerp(range,texture*.55).lerp(sandstone,Math.min(.65,slope*.57+texture*.29));
  }));

  const plaza:Instance[]=[];
  const broken:Instance[]=[];
  const column:Instance[]=[];
  const dust:Instance[]=[];
  for(let tier=0;tier<4;tier++) {
    const width=7.75-tier*1.43;
    plaza.push({x:crossX,y:-.28+tier*.31,z:crossZ,sx:width,sy:.32,sz:width*.71,
      color:sandstone.clone().lerp(rock,.25+.11*tier)});
    for(let i=0;i<12;i++){
      plaza.push({x:crossX+(i+.5-6)*width/12,y:-.28+tier*.31,z:crossZ+width*.355,
        sx:width/12-.021,sy:.25,sz:.14, color:sandstone.clone().lerp(rock,.14+rand()*.27)});
    }
  }
  for(let i=0;i<44;i++){
    const z=1.4+i*.54;
    const turn=crossX+Math.sin(i*.038)*3.2;
    for(let lane=0;lane<5;lane++) {
      const x=turn+(lane-2)*.83;
      plaza.push({x,y:ground(x,z)+.02,z,sx:.81,sy:.12,sz:.51,
        rx:(rand()-.5)*.09,ry:(rand()-.5)*.13,color:sandstone.clone().lerp(rock,.31+rand()*.39)});
    }
  }
  for(const sign of [-1,1]){
    for(let i=0;i<12;i++){
      const x=crossX+sign*(4.8+rand()*1.8)+Math.sin(i*.11)*.95;
      const z=12-i*2.7;
      const y=ground(x,z);
      const h=.67+rand()*2.4;
      plaza.push({x,y:y+.11,z,sx:.79,sy:.25,sz:.78,color:sandstone});
      for(let s=0;s<h;s+=.41) column.push({x,y:y+.26+s,z,sx:.46,sy:.39,sz:.46,
        ry:rand()*.75,color:sandstone.clone().lerp(range,rand()*.27)});
      if(i%3===0) plaza.push({x,y:y+h+.16,z,sx:.71,sy:.19,sz:.67,color:sandstone});
    }
  }
  for(let i=0;i<460;i++){
    const z=16-rand()*109;
    const x=(rand()-.5)*102;
    if (Math.hypot(x-crossX,z-crossZ)<4.8) continue;
    const y=ground(x,z);
    const size=.12+rand()**3*1.87;
    broken.push({x,y:y+size*.16,z,sx:size*1.38,sy:size*.59,sz:size,rx:rand()*3.1,ry:rand()*6.3,
      color:rock.clone().lerp(range,rand()*.68)});
    if(i%3===0) dust.push({x:x+.25,y:y+.24,z:z-.16,sx:.025,sy:.8,sz:.025,rz:.91,ry:rand()*6,
      color:amber.clone().lerp(rock,rand()*.61)});
  }
  instanced(scene,new T.BoxGeometry(),new T.MeshStandardMaterial({roughness:.83}),plaza);
  instanced(scene,new T.CylinderGeometry(.54,.5,1,14),new T.MeshStandardMaterial({roughness:.9}),column);
  instanced(scene,rockGeometry(41),new T.MeshStandardMaterial({vertexColors:true,roughness:.91}),broken);
  instanced(scene,new T.ConeGeometry(1,1,5),new T.MeshStandardMaterial({roughness:1}),dust);

  const cedar=new T.MeshStandardMaterial({color:'#7a4131',roughness:.80});
  cedar.onBeforeCompile=(shader)=>{
    shader.vertexShader='varying vec3 vWood;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWood=position;');
    shader.fragmentShader=('varying vec3 vWood;\n'+noiseGLSL+shader.fragmentShader).replace('#include <color_fragment>',`
      #include <color_fragment>
      vec2 p=vWood.xy+vWood.z*vec2(.73,.16);
      float fiber=fbm(p*vec2(42.,.75)+vec2(fbm(p*3.)*2.,0.));
      diffuseColor.rgb *= .59+.61*fiber+.1*noise(p*72.);
    `);
  };
  // Ambos travesaños comparten el veteado longitudinal al girar la pieza horizontal.
  const oldWood = new T.Group();
  oldWood.position.set(crossX,.85,crossZ);
  oldWood.rotation.y=.23;
  scene.add(oldWood);
  const vertical=new T.Mesh(new RoundedBoxGeometry(.84,8.0,.72,2,.057),cedar);
  vertical.position.y=3.96;
  const transverse=new T.Mesh(new RoundedBoxGeometry(.76,5.35,.68,2,.053),cedar);
  transverse.position.set(0,5.53,.056);
  transverse.rotation.z=Math.PI/2;
  oldWood.add(vertical,transverse);
  const copper=new T.MeshStandardMaterial({color:'#b48552',emissive:'#9c4920',emissiveIntensity:.22,roughness:.69});
  const nailGeo=new T.SphereGeometry(.066,13,8);
  for(const [x,y] of [[-.164,5.38],[.164,5.38],[-.164,5.70],[.164,5.70]]) {
    const nail=new T.Mesh(nailGeo,copper);
    nail.scale.set(1,1,.45);
    nail.position.set(x,y,.393);
    oldWood.add(nail);
  }
  const light=new T.PointLight('#ffce7a',50,16,2);
  light.position.set(crossX-1.7,7.35,crossZ-1.6);
  scene.add(light);

  const embers:Array<number>=[];
  for(let i=0;i<495;i++) embers.push((rand()-.5)*75,rand()*16,-57+rand()*75);
  const geo=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(embers,3));
  const sparksTime={value:0};
  const sparks=new T.Points(geo,new T.ShaderMaterial({
    transparent:true,depthWrite:false,blending:T.AdditiveBlending,
    uniforms:{uTime:sparksTime,uAccent:{value:accent}},
    vertexShader:`uniform float uTime; varying float vGlow;
      void main(){
        vec3 p=position;
        p.y=mod(p.y+uTime*(.18+fract(p.z*.19)*.42),16.);
        p.x+=sin(uTime*.38+p.z)*.63;
        vec4 view=modelViewMatrix*vec4(p,1.);
        gl_Position=projectionMatrix*view;
        gl_PointSize=clamp(60./-view.z,1.,6.);
        vGlow=(.55+.45*cos(p.z*8.1+uTime*.76))*(1.-smoothstep(22.,95.,-view.z));
      }`,
    fragmentShader:`uniform vec3 uAccent; varying float vGlow;
      void main(){float r=length(gl_PointCoord-.5);gl_FragColor=vec4(uAccent,(1.-smoothstep(.06,.48,r))*vGlow*.79);}`,
  }));
  sparks.frustumCulled=false;
  scene.add(sparks);

  return {
    still:4.1,
    update(time){
      sky.value=sparksTime.value=time;
      camera.position.set(1.1+Math.sin(time*.144)*1.82,4.68+Math.sin(time*.17)*.42,25.3+Math.cos(time*.10)*1.02);
      camera.lookAt(.42,4.25,-7.7);
    },
  };
};
