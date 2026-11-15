import * as T from 'three';
import { instanced, lighting, noiseGLSL, randomGenerator, type BuildScene, type Instance } from './scene';

const discoBallFragment = `
  uniform vec3 uAccent;
  uniform float uTime;
  varying vec2 vUV;
  varying vec3 vNormal,vView;
  ${noiseGLSL}
  void main(){
    vec2 grid=vUV*vec2(68.,37.);
    vec2 tile=floor(grid);
    vec2 cell=fract(grid);
    float h=hash(tile+7.);
    float angle=(tile.x+.5)/68.*6.28318;
    float latitude=(tile.y+.5)/37.*3.14159;
    vec3 facet=vec3(cos(angle)*sin(latitude),cos(latitude),sin(angle)*sin(latitude));
    vec3 normal=normalize(vNormal+facet*.088);
    vec3 reflection=reflect(-normalize(vView),normal);
    vec3 key=normalize(vec3(.53+.41*sin(uTime*1.65),.43,.57));
    vec3 fill=normalize(vec3(-.61,-.34+.38*sin(uTime*1.32),.41));
    float shine=pow(max(0.,dot(reflection,key)),17.);
    float blue=pow(max(0.,dot(reflection,fill)),11.);
    float glint=pow(max(0.,dot(reflection,normalize(vec3(.31,-.65,.51)))),46.);
    float rim=pow(1.-max(0.,dot(normal,normalize(vView))),2.8);
    float chroma=.45+.52*sin(tile.x*.93+tile.y*.51+uTime*.68);
    vec3 color=mix(vec3(.063,.10,.22),uAccent*.59,chroma);
    color*=.43+h*.81;
    color+=vec3(1.,.94,.89)*shine*(.58+h*.65)+vec3(.32,.74,1.)*blue*.88;
    color+=vec3(1.,.70,.34)*glint;
    color+=mix(uAccent,vec3(.43,.66,1.),h)*rim*.26;
    float seams=smoothstep(.045,.14,min(min(cell.x,1.-cell.x),min(cell.y,1.-cell.y)));
    gl_FragColor=vec4(color*(.25+.75*seams),1.);
  }
`;

export const discoEighties: BuildScene = ({ scene,camera,accent,base }) => {
  const color=(v:string)=>new T.Color(v);
  const rand=randomGenerator(1984);
  const dark=base.clone().multiplyScalar(.66);
  const violet=base.clone().lerp(color('#623b83'),.51);
  const cyan=color('#53def4');
  const gold=color('#ffbe75');
  const lavender=color('#9670ff');
  const mint=color('#5dffd0');
  const ink=color('#14132a');
  const coolLight=color('#aab9de');
  scene.background=dark;
  scene.fog=new T.FogExp2(base.clone().lerp(accent,.11),.018);
  lighting(scene,'#8c92ed','#593b8b','#9a86e5',1.90,[-12,15,4],1.40);
  const pink=new T.PointLight(accent,210,40,2);
  pink.position.set(-11,4,1);
  const blue=new T.PointLight(cyan,220,39,2);
  blue.position.set(11,3,-5);
  scene.add(pink,blue);

  const structure:Instance[]=[];
  const neon:Instance[]=[];
  const acoustic:Instance[]=[];
  const box=new T.BoxGeometry();
  const clock={value:0};
  const fixtures = [
    { origin: new T.Vector3(-13.3, 9.6, -22), tint: accent, phase: .2, reach: 11 },
    { origin: new T.Vector3(13.3, 9.6, -22), tint: cyan, phase: 2.8, reach: 11 },
    { origin: new T.Vector3(-10.6, 11.8, -11), tint: gold, phase: 4.3, reach: 9 },
    { origin: new T.Vector3(10.6, 11.8, -11), tint: lavender, phase: 1.6, reach: 9 },
    { origin: new T.Vector3(-8.8, 11.8, -2), tint: mint, phase: 3.5, reach: 12 },
    { origin: new T.Vector3(8.8, 11.8, -2), tint: accent, phase: 5.7, reach: 12 },
    { origin: new T.Vector3(-5.8, 9.4, -28), tint: lavender, phase: .8, reach: 8 },
    { origin: new T.Vector3(5.8, 9.4, -28), tint: cyan, phase: 3.9, reach: 8 },
  ];
  const spotTargets = fixtures.map(() => new T.Vector2());
  const spotColors = fixtures.map(({ tint }) => tint);
  function add(list:Instance[],x:number,y:number,z:number,sx:number,sy:number,sz:number,tint:T.Color,
    rx=0,ry=0,rz=0) {
    list.push({x,y,z,sx,sy,sz,color:tint,rx,ry,rz});
  }
  function bar(list:Instance[],a:T.Vector3,b:T.Vector3,width:number,tint:T.Color) {
    const center=a.clone().lerp(b,.5);
    const axis=b.clone().sub(a);
    const euler=new T.Euler().setFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),axis.clone().normalize()));
    add(list,center.x,center.y,center.z,width,axis.length(),width,tint,euler.x,euler.y,euler.z);
  }
  add(structure,0,7,-34,56,14,1,violet);
  add(structure,0,15,-7,58,.45,71,dark);
  for(const side of [-1,1]){
    add(structure,side*23,6.9,-8,.53,14,57,violet);
    add(structure,side*17,.36,-10,10,.61,50,ink);
    add(neon,side*12.05,.642,-10,.10,.04,49,side===1 ? accent : cyan);
    for(let i=0;i<11;i++) {
      const z=12-i*4.6;
      const x=side*(17.5+(i%2)*1.55);
      add(structure,x,4.14,z,1.15,8.7,1.1,ink);
      add(structure,x-side*.69,3.84,z,.40,6.9,.78,violet);
      add(neon,x-side*.92,3.6,z,.048,6.5,.08,i%2===0 ? accent : cyan);
      add(neon,x-side*.91,6.82,z,.07,.062,1.88,coolLight);
      add(structure,side*20.75,2.2,z,3.45,1.12,3.3,ink);
      add(neon,side*19.29,1.64,z,.075,.078,3.26,cyan.clone().lerp(accent,.53));
    }
  }
  for(let i=0;i<9;i++){
    const z=15-i*5.75;
    add(structure,0,12.74,z,43,.43,.57,ink);
    add(neon,0,12.49,z,40.5,.038,.10,i%2===0 ? accent : cyan);
    for(const side of [-1,1]) {
      const x=side*(9+i%3*2.1);
      add(structure,x,12.32,z,.64,.46,.72,ink);
      add(neon,x,12.04,z,.26,.079,.30,i%2===0 ? gold : cyan);
    }
  }
  for (const { origin, tint } of fixtures) {
    add(structure,origin.x,origin.y+.43,origin.z,.82,.87,.72,ink);
    add(neon,origin.x,origin.y+.05,origin.z,.48,.14,.41,tint);
  }
  for(let line=0;line<8;line++){
    const r=3.1+line*.99;
    const z=-33.0+line*.13;
    const tint=line%3===0 ? cyan : accent.clone().lerp(color('#8f65ff'),line*.085);
    for(const side of [-1,1]){
      bar(neon,new T.Vector3(side*r,6.6,z),new T.Vector3(0,6.6+r*.45,z),.064,tint);
      bar(neon,new T.Vector3(side*r,6.6,z),new T.Vector3(0,6.6-r*.45,z),.064,tint);
    }
  }

  // Tarima, monitores y tornamesas del DJ.
  for(let row=0;row<3;row++){
    add(structure,0,.34+row*.28,-25.6-row*.72,19-row*1.96,.31,9.4-row*.9,ink);
    add(neon,0,.455+row*.28,-20.91-row*1.15,19-row*1.97,.059,.079,row%2===0 ? accent : cyan);
  }
  add(structure,0,2.10,-27.8,9.7,2.45,2.6,violet);
  add(neon,0,3.37,-26.37,9.65,.073,.078,accent);
  add(neon,0,1.45,-26.38,9.65,.076,.078,cyan);
  add(structure,0,3.35,-27.81,10.1,.21,2.76,ink);
  for(const side of [-1,1]){
    add(structure,side*3.1,3.53,-27.81,2.73,.25,2.25,dark);
    add(acoustic,side*3.1,3.67,-27.79,1.94,.068,1.94,coloredVinyl(side));
    add(acoustic,side*3.1,3.716,-27.79,.53,.019,.53,gold);
    add(structure,side*4.21,3.77,-28.42,.085,.083,1.22,coolLight);
    add(structure,side*7.06,3.33,-27.85,2.32,4.95,1.68,ink);
    add(structure,side*7.06,3.33,-26.97,1.97,4.51,.12,violet);
    for (const [h,r] of [[2.04,.86],[3.74,.65],[4.98,.42]]){
      add(acoustic,side*7.06,h,-26.87,r*2,.13,r*2,ink,Math.PI/2);
      add(acoustic,side*7.06,h,-26.78,r*1.59,.13,r*1.59,dark,Math.PI/2);
      add(acoustic,side*7.06,h,-26.68,r*.51,.10,r*.51,violet,Math.PI/2);
    }
  }
  function coloredVinyl(side:number) {
    return side === 1 ? ink.clone().lerp(accent,.16) : ink.clone().lerp(cyan,.17);
  }
  for(let i=0;i<14;i++) {
    add(neon,(i-6.5)*.124,3.54,-26.96,.071,.067,.15,i%3===0 ? gold : accent);
  }
  instanced(scene,box,new T.MeshStandardMaterial({roughness:.72}),structure);
  const neonMaterial=new T.MeshBasicMaterial();
  neonMaterial.onBeforeCompile=(shader)=>{
    shader.uniforms.uTime=clock;
    shader.vertexShader='varying vec3 vFixture;\n'+shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvFixture=instanceMatrix[3].xyz;');
    shader.fragmentShader='uniform float uTime; varying vec3 vFixture;\n'+shader.fragmentShader.replace('#include <color_fragment>',`
      #include <color_fragment>
      float wave=.5+.5*sin(uTime*3.2+vFixture.z*.34+vFixture.x*.19);
      float chase=smoothstep(.24,.85,wave);
      diffuseColor.rgb *= .51+.62*chase;
    `);
  };
  instanced(scene,box,neonMaterial,neon);
  instanced(scene,new T.CylinderGeometry(.5,.5,1,24),new T.MeshStandardMaterial({roughness:.63}),acoustic);

  const floor=new T.Mesh(new T.PlaneGeometry(45,64).rotateX(-Math.PI/2).translate(0,0,-11),new T.ShaderMaterial({
    defines:{SPOTS:fixtures.length},
    uniforms:{
      uTime:clock,uAccent:{value:accent},uBase:{value:base},
      uSpotTargets:{value:spotTargets},uSpotColors:{value:spotColors},
    },
    vertexShader:`varying vec3 vFloor;
      void main(){vFloor=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`
      varying vec3 vFloor;
      uniform vec3 uAccent,uBase;
      uniform float uTime;
      uniform vec2 uSpotTargets[SPOTS];
      uniform vec3 uSpotColors[SPOTS];
      ${noiseGLSL}
      void main(){
        vec2 p=vFloor.xz*.73;
        vec2 tile=floor(p);
        vec2 f=fract(p);
        float edge=smoothstep(.032,.082,min(min(f.x,1.-f.x),min(f.y,1.-f.y)));
        float checker=mod(tile.x+tile.y,2.);
        float wash=.5+.5*sin(tile.y*.77+tile.x*.29-uTime*2.6);
        float pulse=.5+.5*sin(uTime*2.6+hash(tile+22.)*7.2);
        float center=1.-smoothstep(5.3,8.9,abs(tile.x+.5));
        vec3 tint=mix(vec3(.18,.71,.98),uAccent,smoothstep(.10,.90,wash));
        float sweep=pow(.5+.5*sin(tile.y*.57 + abs(tile.x)*.49 - uTime*3.2),2.5);
        vec3 color=uBase*(.56+.46*checker)+tint*(.11+checker*.29)*(.37+pulse*.38+sweep*.75)*edge*center;
        for (int light=0; light<SPOTS; light++) {
          vec2 offset=(vFloor.xz-uSpotTargets[light])*vec2(.71,1.);
          float distanceSquared=dot(offset,offset);
          float spot=1.-smoothstep(.22,5.3,distanceSquared);
          float halo=1.-smoothstep(2.,17.,distanceSquared);
          color+=uSpotColors[light]*(spot*.28+halo*.115)*(.69+.31*edge);
        }
        float speckle=pow(noise(p*22.),7.);
        color*=.87+speckle*.32;
        color=mix(color,uBase*.56,smoothstep(25.,69.,length(vFloor-cameraPosition))*.67);
        gl_FragColor=vec4(color,1.);
      }`,
  }));
  scene.add(floor);

  const ballMaterial=new T.ShaderMaterial({
    uniforms:{uAccent:{value:accent},uTime:clock},
    vertexShader:`
      varying vec2 vUV; varying vec3 vNormal,vView;
      void main(){
        vUV=uv;
        vec4 view=modelViewMatrix*vec4(position,1.);
        vNormal=normalMatrix*normal;
        vView=-view.xyz;
        gl_Position=projectionMatrix*view;
      }`,
    fragmentShader:discoBallFragment,
  });
  const ballGeo=new T.SphereGeometry(1,62,40);
  const balls=[[0,7.55,-11.45,2.44],[-8.7,8.81,-17.4,1.43],[8.3,8.85,-19.0,1.30]].map(([x,y,z,s])=>{
    const ball=new T.Mesh(ballGeo,ballMaterial);
    ball.position.set(x,y,z);
    ball.scale.setScalar(s);
    scene.add(ball);
    const cable=new T.Mesh(new T.CylinderGeometry(.019,.019,14-y,7),new T.MeshBasicMaterial({color:'#170f22'}));
    cable.position.set(x,(14+y)*.5,z);
    scene.add(cable);
    return ball;
  });

  const beamGeo=new T.ConeGeometry(1,1,20,1,true).rotateX(-Math.PI/2).translate(0,0,.5);
  const beamMaterial=new T.ShaderMaterial({
    side:T.DoubleSide,transparent:true,depthWrite:false,blending:T.AdditiveBlending,
    vertexShader:`varying vec3 vTint;
      varying float vReach;
      varying vec3 vView,vNormal;
      void main(){
        vTint=instanceColor;
        vReach=position.z;
        vec4 view=modelViewMatrix*instanceMatrix*vec4(position,1.);
        vView=-view.xyz;
        vNormal=normalMatrix*normalize(mat3(instanceMatrix)*vec3(normal.xy,0.));
        gl_Position=projectionMatrix*view;
      }`,
    fragmentShader:`varying vec3 vTint;
      varying float vReach;
      varying vec3 vView,vNormal;
      void main(){
        float edge=abs(dot(normalize(vView),normalize(vNormal)));
        float core=.36+.64*pow(edge,1.65);
        float reach=smoothstep(0.,.09,vReach)*(1.-.51*vReach);
        gl_FragColor=vec4(vTint,.108*reach*core);
      }`,
  });
  const beams = new T.InstancedMesh(beamGeo,beamMaterial,fixtures.length);
  beams.instanceMatrix.setUsage(T.DynamicDrawUsage);
  beams.frustumCulled=false;
  fixtures.forEach(({ tint },i)=>beams.setColorAt(i,tint));
  scene.add(beams);
  const beamPose = new T.Object3D();
  const beamAxis = new T.Vector3(0,0,1);
  const beamDirection = new T.Vector3();

  const leds:Instance[]=[];
  for(let col=0;col<35;col++){
    const x=(col-17)*.235;
    for(let row=0;row<7;row++){
      add(leds,x,1.66+.231*row,-26.43,.158,.147,.032, row>4 ? accent : row>2 ? gold : cyan);
    }
  }
  const ledMaterial=new T.MeshBasicMaterial();
  ledMaterial.onBeforeCompile=(shader)=>{
    shader.uniforms.uTime=clock;
    shader.vertexShader='varying vec2 vTile;\n'+shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvTile=instanceMatrix[3].xy;');
    shader.fragmentShader='uniform float uTime; varying vec2 vTile;\n'+shader.fragmentShader.replace('#include <color_fragment>',`
      #include <color_fragment>
      float line=2.0 + .46*sin(vTile.x*5.5+uTime*3.3) + .62*cos(vTile.x*3.1-uTime*1.85);
      diffuseColor.rgb*= .17 + .83*step(vTile.y,line);
    `);
  };
  instanced(scene,box,ledMaterial,leds);

  const dust=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(
    Array.from({length:630},(_,i)=>i%3===0 ? (rand()-.5)*48 : i%3===1 ? .15+rand()*11 : -42+rand()*67),3));
  scene.add(new T.Points(dust,new T.ShaderMaterial({
    uniforms:{uTime:clock,uAccent:{value:accent}},transparent:true,depthWrite:false,blending:T.AdditiveBlending,
    vertexShader:`uniform float uTime;varying float vAlpha;
      void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;
        gl_PointSize=clamp(50./-p.z,1.,5.);
        vAlpha=pow(.5+.5*sin(position.x*.69+position.z*.18+uTime*1.3),4.)*.73;
      }`,
    fragmentShader:`uniform vec3 uAccent;varying float vAlpha;
      void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(mix(uAccent,vec3(.7,1.,1.),.58),vAlpha*(1.-smoothstep(.09,.5,d)));}`,
  })));

  const reflections = new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(
    Array.from({length:780},(_,i)=>i%3===0 ? rand()*Math.PI*2 : i%3===1 ? 2.1+rand()*8.6 : rand()),3));
  const glints = new T.Points(reflections,new T.ShaderMaterial({
    uniforms:{uTime:clock,uAccent:{value:accent}},transparent:true,depthWrite:false,blending:T.AdditiveBlending,
    vertexShader:`uniform float uTime; varying vec2 vGlint;
      void main() {
        float angle=position.x+uTime*.58;
        vec2 ray=vec2(sin(angle),cos(angle));
        float width=22.5/max(.01,abs(ray.x));
        float back=21.9/max(.01,abs(ray.y));
        vec2 hit=ray*min(width,back);
        vec3 world=vec3(hit.x,position.y+sin(angle*2.+position.z*4.)*.8,hit.y-11.);
        vec4 view=modelViewMatrix*vec4(world,1.);
        gl_Position=projectionMatrix*view;
        gl_PointSize=clamp((42.+position.z*95.)/-view.z,1.3,9.);
        float pulse=.53+.47*sin(angle*2.3+position.z*29.);
        vGlint=vec2(position.z,pulse*.88*smoothstep(-.1,.3,-ray.y));
      }`,
    fragmentShader:`uniform vec3 uAccent; varying vec2 vGlint;
      void main(){
        float r=length(gl_PointCoord-.5);
        vec3 color=mix(vec3(.35,.84,1.),uAccent,smoothstep(.15,.88,vGlint.x));
        gl_FragColor=vec4(color,(1.-smoothstep(.07,.5,r))*vGlint.y);
      }`,
  }));
  glints.frustumCulled=false;
  scene.add(glints);

  return {
    still:4.1,
    update(time) {
      clock.value=time;
      balls.forEach((ball,i)=>ball.rotation.set(Math.sin(time*.38+i)*.14,time*(.78+i*.11)+i,0));
      fixtures.forEach(({ origin,phase,reach },i)=>{
        const target=spotTargets[i].set(Math.sin(time*1.16+phase)*reach,-9+Math.cos(time*.82+phase)*13);
        beamDirection.set(target.x,0,target.y).sub(origin);
        const length=beamDirection.length();
        beamPose.position.copy(origin);
        beamPose.scale.set(1.55,1.55,length);
        beamPose.quaternion.setFromUnitVectors(beamAxis,beamDirection.normalize());
        beamPose.updateMatrix();
        beams.setMatrixAt(i,beamPose.matrix);
      });
      beams.instanceMatrix.needsUpdate=true;
      pink.intensity=180+65*Math.sin(time*1.69);
      blue.intensity=195+60*Math.cos(time*1.51);
      camera.position.set(Math.sin(time*.29)*3.2,3.6+Math.sin(time*.32)*.49,22+Math.cos(time*.24)*1.43);
      camera.lookAt(0,5.25,-16);
    },
  };
};
