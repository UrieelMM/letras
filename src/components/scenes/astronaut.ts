import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { lighting, noiseGLSL, randomGenerator, skyDome, skyUniforms, type BuildScene } from './scene';

const cosmos = `
  ${skyUniforms}
  ${noiseGLSL}
  vec3 galaxy(vec2 p, float scale, float time) {
    p=vec2(p.x*.84+p.y*.55,-p.x*.55+p.y*.84)*vec2(1.,3.2)*scale;
    float r=length(p);
    float a=atan(p.y,p.x)+log(max(r,.047))*3.1+time*.027;
    float arms=pow(.5+.5*cos(a*2.+r*1.1+fbm(p*1.7)*1.55),3.7);
    float grains=fbm(p*vec2(17.,23.));
    float disk=exp(-r*r*1.4)*(arms*.94+.27)*smoothstep(.22,.69,grains);
    vec3 tint=mix(vec3(1.,.58,.42),mix(uAccent,vec3(.64,.33,.9),.53),smoothstep(.13,.9,r));
    return tint*disk*.70+vec3(1.,.78,.58)*exp(-r*8.)*.75;
  }
  float stars(vec2 uv, float density, float threshold) {
    vec2 grid=uv*density;
    vec2 cell=floor(grid);
    float value=hash(cell);
    vec2 center=vec2(hash(cell+71.),hash(cell+219.))*.72+.14;
    vec2 delta=fract(grid)-center;
    float point=1.-smoothstep(.007,.125,length(delta));
    return point*smoothstep(threshold,1.,value)*(.77+.23*sin(value*243.+uTime*.57));
  }
  void main(){
    vec3 ray=viewRay();
    vec2 uv=ray.xy/max(.28,-ray.z);
    vec2 drift=vec2(sin(uTime*.14)*.014,cos(uTime*.104)*.009);
    vec2 p=vec2(uv.x+uv.y*.41,uv.y-uv.x*.41);
    float clouds=fbm(p*4.5+drift*4.);
    float structure=fbm(p*vec2(10.,21.)+clouds*1.7);
    float glow=exp(-abs(p.y-.12)*4.);
    vec3 color=uBase*.61+vec3(.026,.035,.087)*(1.-smoothstep(0.,.87,abs(p.x)));
    color+=mix(vec3(.25,.086,.35),uAccent*.52,structure)*glow*smoothstep(.30,.69,clouds)*.72;
    color+=vec3(.18,.05,.15)*glow*pow(structure,2.);
    color+=galaxy(uv-vec2(.39,.20)+drift,3.9,uTime);
    color+=galaxy(uv-vec2(-.56,.251),8.4,-uTime)*.45;
    color+=vec3(.51,.65,1.)*stars(uv+drift,196.,.61)*.52;
    color+=vec3(1.,.84,.72)*stars(uv-drift,66.,.86)*.85;
    gl_FragColor=vec4(color,1.);
  }
`;

type Piece = { geometry: T.BufferGeometry; material: T.Material };

function mergedParts(group: T.Group, parts: Piece[]) {
  const groups = new Map<T.Material,T.BufferGeometry[]>();
  for(const { geometry,material } of parts) {
    const geometries=groups.get(material) ?? [];
    const part = geometry.index ? geometry.toNonIndexed() : geometry;
    geometries.push(part);
    groups.set(material,geometries);
    if (part !== geometry) geometry.dispose();
  }
  groups.forEach((geometries,material)=>{
    const merged=mergeGeometries(geometries);
    if(merged) group.add(new T.Mesh(merged,material));
    geometries.forEach((geometry)=>geometry.dispose());
  });
}

export const astronaut: BuildScene = ({ scene,camera,accent,base }) => {
  const sky = skyDome(scene,cosmos,accent,base);
  lighting(scene,'#91aee4','#5d346d','#ddebff',2.55,[-9,12,12],1.32);
  const rim = new T.DirectionalLight('#ba7dff',2.6);
  rim.position.set(8,0,-8);
  scene.add(rim);

  const fabric = new T.MeshStandardMaterial({color:'#dce0e8',roughness:.81});
  const cloth = new T.MeshStandardMaterial({color:'#8d93a1', roughness:.93});
  const trim = new T.MeshStandardMaterial({color:'#262a42', roughness:.63,metalness:.15});
  const orange = new T.MeshStandardMaterial({color:'#e86342',roughness:.5});
  const metal = new T.MeshStandardMaterial({color:'#a3baca',roughness:.33,metalness:.36});
  const lamp = new T.MeshBasicMaterial({color:accent});
  const robot = new T.Group();
  scene.add(robot);

  const piece=(geometry: T.BufferGeometry,material: T.Material,x:number,y:number,z:number)=>({geometry:geometry.translate(x,y,z),material});
  const box=(w:number,h:number,d:number,r:number,mat:T.Material,x:number,y:number,z:number)=>
    piece(new RoundedBoxGeometry(w,h,d,2,r),mat,x,y,z);
  const ball=(w:number,h:number,d:number,mat:T.Material,x:number,y:number,z:number)=>
    piece(new T.SphereGeometry(1,22,14).scale(w,h,d),mat,x,y,z);
  const tube=(radius:number,length:number,mat:T.Material,x:number,y:number,z:number)=>
    piece(new T.CylinderGeometry(radius,radius,length,18,1),mat,x,y,z);
  const ring=(radius:number,width:number,mat:T.Material,x:number,y:number,z:number)=>
    piece(new T.TorusGeometry(radius,width,8,27).rotateX(Math.PI/2),mat,x,y,z);

  mergedParts(robot,[
    box(1.44,1.70,.84,.18,fabric,0,.72,0),
    ball(.77,.43,.46,fabric,0,-.34,.02),
    box(1.65,1.96,.51,.16,trim,0,.81,-.56),
    box(1.64,1.86,.33,.13,fabric,0,.81,-.81),
    box(.73,1.63,.26,.11,cloth,0,.81,-.98),
    box(.89,.63,.22,.067,trim,0,.98,.48),
    box(.83,.52,.19,.05,metal,0,1.015,.57),
    box(.57,.23,.049,.01,trim,0,1.083,.678),
    box(.44,.042,.055,.01,lamp,0,1.098,.705),
    box(.10,.061,.056,.014,orange,-.24,.914,.69),
    box(.12,.046,.052,.012,trim,0,.914,.69),
    box(.11,.061,.055,.014,lamp,.23,.913,.694),
    box(1.27,.14,.81,.04,trim,0,-.19,.032),
    box(.30,.22,.092,.034,metal,0,-.195,.479),
    tube(.57,.22,metal,0,1.59,.034),
    ring(.59,.047,trim,0,1.60,.035),
    box(.16,.88,.17,.03,orange,-.83,.78,-.06),
    box(.16,.88,.17,.03,orange,.83,.78,-.06),
  ]);

  const lines: Piece[]=[];
  for (const side of [-1,1]) {
    const hose=new T.CatmullRomCurve3([
      new T.Vector3(side*.25,.82,.57),new T.Vector3(side*.49,.62,.59),new T.Vector3(side*.65,.40,.51),
      new T.Vector3(side*.76,.46,.13),new T.Vector3(side*.73,.77,-.40),
    ]);
    lines.push(piece(new T.TubeGeometry(hose,24,.063,8,false),trim,0,0,0));
    for(let i=2;i<=16;i++){
      const t=i/19;
      const point=hose.getPoint(t);
      const direction=hose.getTangent(t);
      const geometry=new T.TorusGeometry(.068,.011,6,12);
      geometry.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),direction));
      lines.push(piece(geometry,metal,point.x,point.y,point.z));
    }
    lines.push(tube(.138,1.43,metal,side*.62,.80,-.91));
  }
  mergedParts(robot,lines);

  const helmet = new T.Group();
  helmet.position.set(0,2.03,.05);
  robot.add(helmet);
  mergedParts(helmet,[
    ball(.665,.664,.615,fabric,0,.012,-.033),
    ball(.585,.492,.473,trim,0,-.038,.275),
    box(.042,.287,.14,.016,orange,-.62,-.05,-.035),
    box(.041,.287,.14,.016,orange,.62,-.05,-.035),
    ball(.114,.136,.125,metal,-.603,-.014,0),
    ball(.114,.136,.125,metal,.603,-.014,0),
  ]);
  const visor = new T.Mesh(new T.SphereGeometry(1,40,26).scale(.553,.449,.452).translate(0,-.035,.302),new T.ShaderMaterial({
    uniforms:{uAccent:{value:accent}},
    vertexShader:`
      varying vec3 vPosition,vNormal,vView;
      void main(){
        vPosition=position;
        vec4 view=modelViewMatrix*vec4(position,1.);
        vNormal=normalize(normalMatrix*normal);
        vView=normalize(-view.xyz);
        gl_Position=projectionMatrix*view;
      }`,
    fragmentShader:`
      uniform vec3 uAccent;
      varying vec3 vPosition,vNormal,vView;
      ${noiseGLSL}
      void main(){
        float fresnel=pow(1.-max(0.,dot(normalize(vView),normalize(vNormal))),2.2);
        float lit=smoothstep(-.27,.35,vPosition.y);
        vec2 xy=vPosition.xy+vec2(.17,-.09);
        float curve=abs(xy.y+.36*xy.x+xy.x*xy.x*.48);
        float sheen=exp(-curve*17.)*(1.-smoothstep(.12,.39,abs(xy.x)));
        vec3 color=mix(vec3(.045,.025,.109),vec3(.32,.22,.41),lit);
        color+=uAccent*(.28*fresnel+.32*sheen+.12*lit);
        color+=vec3(.81,.59,.36)*pow(fbm(vPosition.xy*vec2(19.,12.)),4.)*.74;
        gl_FragColor=vec4(color,1.);
      }`,
  }));
  helmet.add(visor);

  const arms: T.Group[]=[];
  const legs: T.Group[]=[];
  for(const side of [-1,1]){
    const arm=new T.Group();
    arm.position.set(side*.77,1.31,0);
    robot.add(arm);
    arms.push(arm);
    mergedParts(arm,[
      ball(.289,.29,.29,metal,0,-.06,0),
      ball(.247,.42,.243,fabric,0,-.34,.013),
      box(.33,.124,.13,.027,orange,side*.102,-.269,.193),
      ball(.206,.21,.206,cloth,0,-.65,.057),
      box(.389,.55,.37,.15,fabric,0,-.91,.086),
      box(.27,.18,.085,.025,trim,0,-.86,.277),
      ring(.173,.039,orange,0,-1.143,.095),
      box(.311,.246,.258,.075,trim,0,-1.267,.10),
      ball(.071,.137,.073,cloth,-side*.155,-1.207,.17),
    ]);

    const leg=new T.Group();
    leg.position.set(side*.39,-.38,-.007);
    robot.add(leg);
    legs.push(leg);
    mergedParts(leg,[
      ball(.32,.46,.31,fabric,0,-.36,.0),
      ring(.276,.036,cloth,0,-.51,0),
      ball(.276,.269,.265,cloth,0,-.68,.055),
      box(.331,.354,.10,.049,metal,0,-.701,.308),
      box(.479,.63,.462,.14,fabric,0,-.996,.028),
      ring(.208,.032,orange,0,-1.255,.021),
      box(.493,.317,.663,.105,fabric,0,-1.408,.092),
      box(.505,.093,.655,.04,trim,0,-1.55,.101),
    ]);
  }

  const rand=randomGenerator(149);
  const positions:number[]=[];
  const sizes:number[]=[];
  for(let i=0;i<700;i++) {
    positions.push((rand()-.5)*147,(rand()-.5)*92,-6-rand()*141);
    sizes.push(.85+rand()**3*3.1);
  }
  const geometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(positions,3))
    .setAttribute('size',new T.Float32BufferAttribute(sizes,1));
  const time={value:0};
  scene.add(new T.Points(geometry,new T.ShaderMaterial({
    uniforms:{ uTime:time, uAccent:{value:accent} },transparent:true,depthWrite:false,blending:T.AdditiveBlending,
    vertexShader:`
      uniform float uTime;
      attribute float size;
      varying float vGlow;
      void main(){
        vec4 p=modelViewMatrix*vec4(position,1.);
        gl_Position=projectionMatrix*p;
        gl_PointSize=max(1.,size*53./-p.z);
        vGlow=.54+.31*sin(position.x*12.3+uTime*.53);
      }`,
    fragmentShader:`
      uniform vec3 uAccent;
      varying float vGlow;
      void main(){
        float r=length(gl_PointCoord-.5);
        gl_FragColor=vec4(mix(uAccent,vec3(1.,.89,.89),.49),exp(-r*7.)*(1.-smoothstep(.28,.5,r))*vGlow);
      }`,
  })));

  return {
    still:2.9,
    update(t) {
      time.value=sky.value=t;
      robot.position.set(-3.25+Math.sin(t*.29)*.64, .02+Math.sin(t*.49)*.36, 0.5+Math.cos(t*.27)*.76);
      robot.rotation.set(Math.sin(t*.30)*.18,-.26+Math.sin(t*.31)*.32,-.31+Math.sin(t*.27)*.12);
      helmet.rotation.y=.17+Math.sin(t*.52)*.18;
      arms[0].rotation.set(-.36+Math.sin(t*.78)*.18,.15,-.52+Math.sin(t*.59)*.16);
      arms[1].rotation.set(-1.06+Math.sin(t*.65)*.21,-.1,.65+Math.sin(t*.72)*.21);
      legs[0].rotation.set(.22+Math.sin(t*.49)*.15,.2,-.24);
      legs[1].rotation.set(-.57+Math.sin(t*.48)*.13,-.17,.32);
      camera.position.set(Math.sin(t*.12)*.65,.58,12.3);
      camera.lookAt(.2,.37,-4);
    },
  };
};
