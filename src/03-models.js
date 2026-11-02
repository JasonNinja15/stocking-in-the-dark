// ===================================================================== models
function part(geo,mat,sx,sy,sz,x,y,z,parent,{rx=0,ry=0,rz=0,cast=true}={}){const m=new THREE.Mesh(geo,mat);m.scale.set(sx,sy,sz);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=cast;m.receiveShadow=true;if(parent)parent.add(m);return m}
function pivot(x,y,z,parent){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g}

// ---- trailer. Origin = centre of the rear opening at floor height; the inside runs toward -z.
function makeTrailer(reefer=false){const g=new THREE.Group();const L=TRAIL_LEN,hw=TRAIL_HW,H=TRAIL_H,R=reefer?MAT.reefer:MAT.ribs;
  const geos=new Map();const add=(m,w,h,d,x,y,z,uv)=>{const b=new THREE.BoxGeometry(w,h,d);if(uv)uvs(b,uv[0],uv[1]);b.translate(x,y,z);(geos.get(m)||geos.set(m,[]).get(m)).push(b)};
  add(MAT.ply,hw*2+.4,.2,L+.2,0,-.1,-L/2);
  add(R,.2,H,L,-hw-.1,H/2,-L/2);add(R,.2,H,L,hw+.1,H/2,-L/2);if(reefer){add(MAT.steel,1.7,1.0,.55,0,H-.7,-L-.48);add(MAT.dark,1.4,.7,.05,0,H-.7,-L-.2)} // refrigeration unit on the nose
  add(R,hw*2+.4,.2,L+.2,0,H+.1,-L/2,[1,7]);
  add(MAT.dark,hw*2+.6,.25,.2,0,H+.1,.05);add(MAT.dark,.2,H+.1,.2,-hw-.2,H/2,.05);add(MAT.dark,.2,H+.1,.2,hw+.2,H/2,.05);
  add(MAT.dark,hw*2+.4,.25,.25,0,-.2,.05);
  for(let z=-1;z>-L;z-=2.3)for(const s of[-1,1])add(MAT.steel,.05,.08,.05,s*(hw-.03),1.2,z); // tie-down rails
  add(MAT.steel,.04,.04,L-.4,-hw+.02,1.2,-L/2);add(MAT.steel,.04,.04,L-.4,hw-.02,1.2,-L/2);
  // nose pile of shipping blankets the big one hides behind
  // (tall and wall to wall, so nothing lying behind it shows from the door)
  add(MAT.pallet,2.4,.14,1.1,0,.07,-L+2.3);add(MAT.blanket,2.42,.75,1.0,0,.52,-L+2.25);add(MAT.blanket,1.7,.45,.8,-.3,1.12,-L+2.2);add(MAT.blanket,.9,.3,.7,.6,1.05,-L+2.3);
  for(const [m,arr] of geos){const mesh=new THREE.Mesh(mergeGeometries(arr),m);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);arr.forEach(a=>a.dispose())}
  const front=new THREE.Mesh(new THREE.BoxGeometry(hw*2,H,.2),R);front.position.set(0,H/2,-L-.1);front.receiveShadow=true;g.add(front);
  // wheels/landing gear peek below the floor
  for(const z of[-1.6,-2.9])for(const s of[-1,1])part(GEO.cyl,MAT.rubber,.5,.32,.5,s*(hw-.1),-.75,z,g,{rz:Math.PI/2});
  g.userData.front=front;g.userData.reefer=reefer;g.visible=false;return g}

// ---- boxes
function boxMat(b){return b.fz?MAT.frozen:b.ret?MAT.ret:b.pri?MAT.pri:b.f?MAT.fragile:MAT.box[b.v%4]}
function makeBoxMesh(b){const m=new THREE.Mesh(BOX_KINDS[b.k].geo,boxMat(b));m.castShadow=true;m.receiveShadow=true;m.userData={kind:'box',id:b.id};return m}

// ---- the trailer sleeper: a starved giant. Too-long arms and fingers, ribs through grey skin,
// a long neck and a lipless mouth full of flat, human teeth. Its eyes are two pinpricks deep in the skull.
function makeLurker(){const g=new THREE.Group(),body=pivot(0,0,0,g);
  const hips=pivot(0,.62,-.25,body);part(GEO.sph,MAT.lurkSkin,.3,.22,.26,0,0,0,hips);
  const legs=[];for(const s of[-1,1]){const th=pivot(s*.2,0,0,hips);part(GEO.cyl,MAT.lurkSkin,.08,.7,.08,0,-.32,.12,th,{rx:-.35});
    const kn=pivot(0,-.62,.3,th);part(GEO.cyl,MAT.lurkDark,.06,.62,.06,0,-.28,-.08,kn,{rx:.3});part(GEO.box,MAT.lurkDark,.12,.04,.3,0,-.58,.0,kn);legs.push({th,kn,s})}
  const torso=pivot(0,.05,0,hips);
  part(GEO.sph,MAT.lurkSkin,.36,.6,.26,0,.55,.02,torso);                       // a ribcage you can count
  for(let i=0;i<6;i++)part(GEO.box,MAT.lurkRib,.62-i*.035,.035,.08,0,.28+i*.13,.22-Math.abs(i-2.5)*.012,torso,{cast:false});
  for(let i=0;i<9;i++)part(GEO.cone,MAT.lurkDark,.035,.13,.035,0,.08+i*.13,-.24,torso,{rx:-1.9});  // spine knuckles
  part(GEO.sph,MAT.lurkSkin,.48,.16,.24,0,1.07,0,torso);                        // shoulders, wider than they should be
  const neck=pivot(0,1.12,.06,torso);part(GEO.cyl,MAT.lurkSkin,.065,.48,.065,0,.22,0,neck);part(GEO.cyl,MAT.lurkRib,.07,.04,.07,0,.12,0,neck,{cast:false});
  const head=pivot(0,.46,.02,neck);
  part(GEO.sph,MAT.lurkSkin,.18,.25,.24,0,.07,-.03,head);                       // long bald skull
  part(GEO.sph,MAT.lurkSkin,.16,.12,.17,0,-.1,.08,head);                         // sunken cheeks
  const eyes=[];for(const s of[-1,1]){part(GEO.sph,MAT.rubber,.07,.03,.04,s*.085,.08,.2,head,{cast:false,rz:s*-.35});eyes.push(part(GEO.sph,MAT.lurkEye,.01,.01,.01,s*.085,.078,.235,head,{cast:false}))} // wet, but no glow: in the dark there's nothing to see
  part(GEO.box,MAT.lurkDark,.22,.045,.07,0,.13,.21,head,{cast:false});          // heavy brow, no hair
  part(GEO.box,MAT.rubber,.04,.05,.02,0,.0,.24,head,{cast:false});              // two slits where a nose was
  part(GEO.box,MAT.rubber,.26,.07,.1,0,-.09,.18,head,{cast:false});             // a mouth with no lips, ear to ear
  for(let i=-6;i<=6;i++)part(GEO.box,MAT.tooth,.016,.036,.016,i*.018,-.07,.235-Math.abs(i)*.007,head,{cast:false}); // flat, human, too many
  const jaw=pivot(0,-.1,.04,head);part(GEO.box,MAT.lurkSkin,.2,.045,.2,0,-.045,.1,jaw);part(GEO.box,MAT.gum,.18,.02,.16,0,-.02,.1,jaw);
  for(let i=-6;i<=6;i++)part(GEO.box,MAT.tooth,.016,.032,.016,i*.018,0,.19-Math.abs(i)*.007,jaw,{cast:false});
  const arms=[];for(const s of[-1,1]){const sh=pivot(s*.44,1.04,0,torso);part(GEO.cyl,MAT.lurkSkin,.06,.95,.06,0,-.47,0,sh);
    const el=pivot(0,-.95,0,sh);part(GEO.sph,MAT.lurkSkin,.075,.075,.075,0,0,0,el,{cast:false});part(GEO.cyl,MAT.lurkSkin,.05,1.0,.05,0,-.5,0,el);
    const hand=pivot(0,-1.0,0,el);part(GEO.box,MAT.lurkSkin,.1,.12,.05,0,-.05,0,hand);
    for(let f=-1.5;f<=1.5;f++){const fg=pivot(f*.025,-.1,0,hand);part(GEO.cyl,MAT.lurkDark,.011,.32,.011,0,-.16,0,fg);part(GEO.cone,MAT.tooth,.012,.05,.012,0,-.34,0,fg,{rx:Math.PI,cast:false});fg.rotation.z=f*.07}
    sh.userData={el,hand,s};arms.push(sh)}
  g.scale.setScalar(1.15);g.userData={body,hips,torso,neck,head,jaw,arms,legs,eyes,ty:1};return g}

// ---- the crawler: nearly a person, wrong in the proportions. Long limbs bent like a spider's, a slack
// human face, black hair that always hangs toward the floor.
function makeCrawler(){const g=new THREE.Group(),orient=pivot(0,0,0,g),body=pivot(0,.42,0,orient);
  part(GEO.sph,MAT.crawlSkin,.21,.15,.4,0,0,0,body);part(GEO.sph,MAT.crawlSkin,.18,.12,.2,0,-.02,-.38,body);   // chest, hips
  for(let i=0;i<5;i++)part(GEO.box,MAT.lurkRib,.02,.03,.03,0,.12,-.3+i*.14,body,{cast:false});                 // spine bumps
  const neck=pivot(0,.05,.33,body);part(GEO.cyl,MAT.crawlSkin,.04,.22,.04,0,.08,.04,neck,{rx:.9});
  const head=pivot(0,.15,.13,neck);part(GEO.sph,MAT.crawlSkin,.145,.175,.155,0,0,0,head);
  const face=new THREE.Mesh(new THREE.SphereGeometry(1,16,12,Math.PI*.08,Math.PI*.84,Math.PI*.18,Math.PI*.62),MAT.crawlFace);face.scale.set(.147,.178,.158);head.add(face);
  // hair always hangs straight down (kept upright every frame) in a ring, so from below it frames the face
  const hair=pivot(0,0,0,head);for(let i=0;i<16;i++){const a=(i/16)*TAU;const l=rand(.3,.55);part(GEO.cyl,MAT.hair,.014,l,.014,Math.sin(a)*.13,-l/2+.05,Math.cos(a)*.12,hair,{cast:false})}
  const limbs=[];for(const [s,z,len] of[[-1,.28,1],[1,.28,1],[-1,-.34,.95],[1,-.34,.95]]){const sh=pivot(s*.15,0,z,body);
    part(GEO.cyl,MAT.crawlSkin,.055,.55*len,.055,s*.27*len,.13*len,0,sh,{rz:-s*1.12});const el=pivot(s*.52*len,.27*len,0,sh);part(GEO.sph,MAT.crawlSkin,.06,.06,.06,0,0,0,el,{cast:false});
    part(GEO.cyl,MAT.crawlSkin,.042,.75*len,.042,s*.11,-.35*len,0,el,{rz:s*.3});const hd=part(GEO.box,MAT.crawlSkin,.12,.03,.17,s*.22,-.7*len,.03,el,{cast:false});
    limbs.push({sh,el,s,ph:limbs.length%3===0?0:Math.PI})}
  g.userData={orient,body,neck,head,hair,limbs,ty:3};return g}

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
function setViewBox(b){const key=b?`${b.k}-${b.v}-${b.f}-${b.fz}-${b.ret}-${b.pri}`:'';if(key===VM.boxKey)return;VM.boxKey=key;
  if(VM.box){VM.g.remove(VM.box);VM.box=null}
  if(b){VM.box=new THREE.Mesh(BOX_KINDS[b.k].geo,boxMat(b));VM.box.scale.setScalar(.62);VM.box.position.set(-.04,-.5-BOX_KINDS[b.k].h*.62,-.78);VM.box.rotation.set(.32,.08,0);VM.box.castShadow=false;VM.g.add(VM.box)}}

// ---- lights: the local flashlight casts shadows; remote crewmates get shadowless spots (fixed count so shaders never recompile)
const FL=new THREE.SpotLight(0xfff1d6,0,24,0.44,0.5,1.25);
FL.position.set(.22,-.2,0);FL.target.position.set(-.05,0,-8);camera.add(FL,FL.target);
FL.castShadow=true;FL.shadow.mapSize.set(1024,1024);FL.shadow.camera.near=.25;FL.shadow.camera.far=24;FL.shadow.bias=-.0008;FL.shadow.normalBias=.02;
const REMOTE_SPOTS=[];for(let i=0;i<3;i++){const s=new THREE.SpotLight(0xfff1d6,0,20,0.44,0.5,1.3);scene.add(s,s.target);REMOTE_SPOTS.push(s)}
const SCARE_L=new THREE.PointLight(0xff5a3a,0,4,1.4);SCARE_L.position.set(0,.6,-.25);camera.add(SCARE_L);
const AMB=new THREE.HemisphereLight(0x3a4a66,0x0b0a08,0.32);scene.add(AMB);
