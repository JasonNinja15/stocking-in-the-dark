// ===================================================================== models
function part(geo,mat,sx,sy,sz,x,y,z,parent,{rx=0,ry=0,rz=0,cast=true}={}){const m=new THREE.Mesh(geo,mat);m.scale.set(sx,sy,sz);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=cast;m.receiveShadow=true;if(parent)parent.add(m);return m}
function pivot(x,y,z,parent){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g}

// ---- trailer. Origin = centre of the rear opening at floor height; the inside runs toward -z.
function makeTrailer(){const g=new THREE.Group();const L=TRAIL_LEN,hw=TRAIL_HW,H=TRAIL_H;
  const geos=new Map();const add=(m,w,h,d,x,y,z,uv)=>{const b=new THREE.BoxGeometry(w,h,d);if(uv)uvs(b,uv[0],uv[1]);b.translate(x,y,z);(geos.get(m)||geos.set(m,[]).get(m)).push(b)};
  add(MAT.ply,hw*2+.4,.2,L+.2,0,-.1,-L/2);
  add(MAT.ribs,.2,H,L,-hw-.1,H/2,-L/2);add(MAT.ribs,.2,H,L,hw+.1,H/2,-L/2);
  add(MAT.ribs,hw*2+.4,.2,L+.2,0,H+.1,-L/2,[1,7]);
  add(MAT.dark,hw*2+.6,.25,.2,0,H+.1,.05);add(MAT.dark,.2,H+.1,.2,-hw-.2,H/2,.05);add(MAT.dark,.2,H+.1,.2,hw+.2,H/2,.05);
  add(MAT.dark,hw*2+.4,.25,.25,0,-.2,.05);
  for(let z=-1;z>-L;z-=2.3)for(const s of[-1,1])add(MAT.steel,.05,.08,.05,s*(hw-.03),1.2,z); // tie-down rails
  add(MAT.steel,.04,.04,L-.4,-hw+.02,1.2,-L/2);add(MAT.steel,.04,.04,L-.4,hw-.02,1.2,-L/2);
  // nose pile of shipping blankets the big one hides behind
  add(MAT.pallet,2.1,.14,1.1,0,.07,-L+2.3);add(MAT.blanket,1.9,.55,1.0,.05,.42,-L+2.25);add(MAT.blanket,1.1,.45,.8,-.35,.9,-L+2.2);
  for(const [m,arr] of geos){const mesh=new THREE.Mesh(mergeGeometries(arr),m);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);arr.forEach(a=>a.dispose())}
  const front=new THREE.Mesh(new THREE.BoxGeometry(hw*2,H,.2),MAT.ribs);front.position.set(0,H/2,-L-.1);front.receiveShadow=true;g.add(front);
  // wheels/landing gear peek below the floor
  for(const z of[-1.6,-2.9])for(const s of[-1,1])part(GEO.cyl,MAT.rubber,.5,.32,.5,s*(hw-.1),-.75,z,g,{rz:Math.PI/2});
  g.userData.front=front;g.visible=false;return g}

// ---- boxes
function boxMat(b){return b.f?MAT.fragile:MAT.box[b.v%4]}
function makeBoxMesh(b){const m=new THREE.Mesh(BOX_KINDS[b.k].geo,boxMat(b));m.castShadow=true;m.receiveShadow=true;m.userData={kind:'box',id:b.id};return m}

// ---- the trailer lurker: big, hunched, four eyes, a jaw that drops open
function makeLurker(){const g=new THREE.Group(),body=pivot(0,0,0,g);
  part(GEO.sph,MAT.lurkSkin,.85,.72,.95,0,1.25,0,body,{rx:.35});
  part(GEO.sph,MAT.lurkDark,.7,.55,.7,0,1.65,-.35,body);
  for(let i=0;i<6;i++)part(GEO.cone,MAT.tooth,.07,.35-i*.03,.07,0,1.95-i*.08,-.1-i*.2,body,{rx:-.5-i*.12});
  const head=pivot(0,1.25,.85,body);
  part(GEO.sph,MAT.lurkSkin,.42,.3,.5,0,.05,0,head);
  part(GEO.box,MAT.lurkDark,.62,.09,.22,0,.2,.3,head,{rx:-.35}); // brow ridge
  const eyes=[];for(const [x,y] of[[-.15,.13],[.15,.13],[-.27,.05],[.27,.05]]){part(GEO.sph,MAT.lurkDark,.06,.045,.04,x,y,.4,head,{cast:false});const e=part(GEO.sph,MAT.eye,.026,.018,.02,x,y,.43,head,{cast:false});eyes.push(e)}
  part(GEO.box,MAT.gum,.62,.06,.3,0,-.1,.24,head);part(GEO.box,MAT.lurkDark,.56,.04,.36,0,-.13,.2,head);
  for(let i=-4;i<=4;i++)part(GEO.fang,MAT.tooth,.026,.2+Math.random()*.08,.026,i*.065,-.17,.4-Math.abs(i)*.018,head,{rx:Math.PI});
  const jaw=pivot(0,-.12,0,head);part(GEO.box,MAT.lurkSkin,.6,.1,.55,0,-.06,.22,jaw);part(GEO.box,MAT.gum,.52,.04,.45,0,0,.22,jaw);
  part(GEO.box,MAT.tongue,.16,.05,.32,0,.03,.2,jaw);
  for(let i=-4;i<=4;i++)part(GEO.fang,MAT.tooth,.024,.17+Math.random()*.07,.024,i*.062,.08,.46-Math.abs(i)*.018,jaw);
  const arms=[];for(const s of[-1,1]){const sh=pivot(s*.7,1.55,.3,body);arms.push(sh);
    part(GEO.cyl,MAT.lurkSkin,.14,.85,.14,0,-.4,.1,sh,{rx:-.25});const el=pivot(0,-.8,.25,sh);part(GEO.cyl,MAT.lurkDark,.11,.9,.11,0,-.42,.12,el,{rx:-.3});
    for(let c=-1;c<=1;c++)part(GEO.cone,MAT.tooth,.03,.25,.03,c*.07,-.9,.38,el,{rx:2.2})}
  for(const s of[-1,1]){part(GEO.cyl,MAT.lurkDark,.18,.75,.18,s*.45,.45,-.35,body,{rx:.6});part(GEO.cyl,MAT.lurkDark,.14,.5,.14,s*.45,.2,.0,body,{rx:-.4})}
  g.scale.setScalar(1.12);g.userData={body,head,jaw,arms,eyes,ty:1};return g}

// ---- the stalker: tall, starved, a pale grinning face
function makeStalker(){const g=new THREE.Group(),body=pivot(0,0,0,g);
  const legs=[];for(const s of[-1,1]){const hip=pivot(s*.11,1.25,0,body);part(GEO.cyl,MAT.stalkBody,.045,1.28,.045,0,-.64,0,hip);legs.push(hip)}
  const torso=pivot(0,1.25,0,body);part(GEO.cyl,MAT.stalkBody,.17,.95,.12,0,.47,0,torso);part(GEO.sph,MAT.stalkBody,.2,.12,.12,0,.92,0,torso);
  for(let i=0;i<5;i++)part(GEO.box,MAT.stalkBody,.3-i*.02,.025,.13,0,.15+i*.14,.02,torso);
  const arms=[];for(const s of[-1,1]){const sh=pivot(s*.22,.9,0,torso);arms.push(sh);part(GEO.cyl,MAT.stalkBody,.035,.8,.035,0,-.4,0,sh);const el=pivot(0,-.8,0,sh);part(GEO.cyl,MAT.stalkBody,.03,.75,.03,0,-.37,0,el);
    for(let f=-2;f<=2;f++)part(GEO.cyl,MAT.stalkBody,.008,.28,.008,f*.02,-.85,0,el,{rz:f*.08});sh.userData.el=el}
  const neck=pivot(0,1.0,0,torso);part(GEO.cyl,MAT.stalkBody,.035,.22,.035,0,.1,0,neck);
  const head=pivot(0,.32,.02,neck);const face=part(GEO.sph,MAT.stalkFace,.2,.27,.21,0,0,0,head);face.rotation.y=0;
  g.userData={body,torso,head,neck,arms,legs,ty:2};return g}

// ---- the mimic: a box that grew legs and teeth
function makeMimic(k=1,v=0,f=false){const K=BOX_KINDS[k];const g=new THREE.Group(),body=pivot(0,.35,0,g);
  const mat=f?MAT.fragile:MAT.box[v%4];
  part(GEO.box,mat,K.w,K.h*.8,K.d,0,K.h*.4,0,body);
  const lids=[];for(const s of[-1,1]){const p=pivot(0,K.h*.8,s*K.d/2,body);part(GEO.box,mat,K.w,.02,K.d/2,0,0,-s*K.d/4,p);
    for(let i=-3;i<=3;i++)part(GEO.cone,MAT.tooth,.025,.09,.025,i*K.w/8,-.04,-s*(K.d/2-.04),p,{rx:Math.PI});lids.push({p,s})}
  part(GEO.box,MAT.gum,K.w*.94,.02,K.d*.94,0,K.h*.81,0,body);part(GEO.box,MAT.tongue,.1,.03,K.d*.55,0,K.h*.83,.06,body);part(GEO.sph,MAT.rubber,K.w*.26,.012,K.d*.2,0,K.h*.815,-.06,body,{cast:false});
  const eye=part(GEO.sph,MAT.eye,.035,.035,.02,K.w*.2,K.h*.7,K.d/2+.01,body,{cast:false});part(GEO.sph,MAT.eye,.025,.025,.02,-K.w*.22,K.h*.62,K.d/2+.01,body,{cast:false});
  const legs=[];for(let i=0;i<6;i++){const s=i<3?-1:1,z=(i%3-1)*K.d*.35;const hip=pivot(s*K.w/2,K.h*.2,z,body);const up=part(GEO.cyl,MAT.mimicLeg,.02,.35,.02,s*.14,.1,0,hip,{rz:-s*1.1});
    const knee=pivot(s*.29,.2,0,hip);part(GEO.cyl,MAT.mimicLeg,.016,.5,.016,s*.06,-.22,0,knee,{rz:s*.25});legs.push({hip,s,ph:i*1.1})}
  g.userData={body,lids,legs,ty:0};return g}

// ---- crewmate avatar
// soft light shaft: brightest at the torch, fading along its length and toward its silhouette edges
const BEAM_MAT=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
  vertexShader:`varying float vV,vF;void main(){vV=uv.y;vec4 mv=modelViewMatrix*vec4(position,1.);vF=abs(dot(normalize(normalMatrix*normal),normalize(-mv.xyz)));gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`varying float vV,vF;void main(){float a=.16*vV*vV*vF*vF;gl_FragColor=vec4(1.,.93,.8,a);}`});
function makeWorker(color,name){const g=new THREE.Group(),body=pivot(0,0,0,g);const vest=toon(color,{map:TEX.vest});
  const legs=[];for(const s of[-1,1]){const hip=pivot(s*.12,.9,0,body);part(GEO.cyl,MAT.pants,.085,.88,.085,0,-.44,0,hip);part(GEO.box,MAT.dark,.13,.08,.24,0,-.88,.04,hip);legs.push(hip)}
  part(GEO.box,vest,.46,.62,.26,0,1.22,0,body);part(GEO.box,MAT.pants,.44,.1,.24,0,.9,0,body);
  const arms=[];for(const s of[-1,1]){const sh=pivot(s*.29,1.48,0,body);part(GEO.cyl,vest,.065,.55,.065,0,-.26,0,sh);part(GEO.sph,MAT.skin,.06,.06,.06,0,-.56,0,sh);arms.push(sh)}
  const head=pivot(0,1.66,0,body);part(GEO.sph,MAT.skin,.15,.17,.15,0,0,0,head);
  part(new THREE.SphereGeometry(1,12,6,0,TAU,0,Math.PI/2),MAT.hat,.18,.13,.19,0,.06,0,head);part(GEO.cyl,MAT.hat,.21,.015,.23,0,.06,.02,head);
  part(GEO.box,MAT.dark,.1,.035,.03,-.06,.02,.15,head);part(GEO.box,MAT.dark,.1,.035,.03,.06,.02,.15,head); // shades of eyes
  const torch=pivot(.29,1.0,.25,body);part(GEO.cyl,MAT.dark,.03,.22,.03,0,0,0,torch,{rx:Math.PI/2});part(GEO.cyl,MAT.steel,.045,.06,.045,0,0,.12,torch,{rx:Math.PI/2});
  const beam=new THREE.Mesh(new THREE.ConeGeometry(1.5,9,16,1,true).translate(0,-4.5,0).rotateX(-Math.PI/2),BEAM_MAT);
  beam.position.set(0,0,.15);torch.add(beam);
  const tag=makeTag(name,color);tag.position.y=2.1;g.add(tag);
  g.userData={body,legs,arms,head,torch,beam,tag};return g}
function makeTag(name,color){const t=ctex(256,64,(g,w,h)=>{g.font="30px 'Special Elite', Courier New";g.textAlign='center';g.textBaseline='middle';g.fillStyle='rgba(0,0,0,.55)';const tw=g.measureText(name).width+24;g.fillRect(w/2-tw/2,8,tw,48);g.fillStyle=color;g.fillText(name,w/2,33)},{aniso:1});
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthWrite:false,transparent:true,fog:false}));s.scale.set(1.2,.3,1);return s}

// ---- first-person view model: flashlight + a carried box
const VM={g:new THREE.Group(),torch:null,box:null,boxKey:''};
function buildViewModel(){camera.add(VM.g);
  const t=pivot(.2,-.19,-.52,VM.g);t.scale.setScalar(.75);t.rotation.y=.06;part(GEO.cyl,MAT.dark,.028,.2,.028,0,0,0,t,{rx:Math.PI/2,cast:false});part(GEO.cyl,MAT.steel,.04,.06,.04,0,0,-.12,t,{rx:Math.PI/2,cast:false});
  const lens=part(GEO.cyl,basic(0xfff6dc),.034,.005,.034,0,0,-.152,t,{rx:Math.PI/2,cast:false});part(GEO.sph,MAT.skin,.05,.04,.06,0,-.02,.04,t,{cast:false});
  VM.torch=t;VM.lens=lens;
  VM.g.traverse(o=>{if(o.isMesh){o.castShadow=false;o.renderOrder=5}})}
function setViewBox(b){const key=b?`${b.k}-${b.v}-${b.f}`:'';if(key===VM.boxKey)return;VM.boxKey=key;
  if(VM.box){VM.g.remove(VM.box);VM.box=null}
  if(b){VM.box=new THREE.Mesh(BOX_KINDS[b.k].geo,boxMat(b));VM.box.scale.setScalar(.62);VM.box.position.set(-.04,-.5-BOX_KINDS[b.k].h*.62,-.78);VM.box.rotation.set(.32,.08,0);VM.box.castShadow=false;VM.g.add(VM.box)}}

// ---- lights: the local flashlight casts shadows; remote crewmates get shadowless spots (fixed count so shaders never recompile)
const FL=new THREE.SpotLight(0xfff1d6,0,24,0.44,0.5,1.25);
FL.position.set(.22,-.2,0);FL.target.position.set(-.05,0,-8);camera.add(FL,FL.target);
FL.castShadow=true;FL.shadow.mapSize.set(1024,1024);FL.shadow.camera.near=.25;FL.shadow.camera.far=24;FL.shadow.bias=-.0008;FL.shadow.normalBias=.02;
const REMOTE_SPOTS=[];for(let i=0;i<3;i++){const s=new THREE.SpotLight(0xfff1d6,0,20,0.44,0.5,1.3);scene.add(s,s.target);REMOTE_SPOTS.push(s)}
const SCARE_L=new THREE.PointLight(0xff5a3a,0,4,1.4);SCARE_L.position.set(0,.6,-.25);camera.add(SCARE_L);
const AMB=new THREE.HemisphereLight(0x3a4a66,0x0b0a08,0.32);scene.add(AMB);
