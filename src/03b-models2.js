// ===================================================================== models: later-night monsters, additions' moving parts, items
// the night manager's face, finally: a smooth blank oval and a smile that runs from ear to ear
TEX.mface=ctex(256,256,(g,w,h)=>{g.fillStyle='#d7cfc0';g.fillRect(0,0,w,h);speckle(g,w,h,1200,'140,120,110',.15,2);const cx=128;
  for(const s of[-1,1]){g.fillStyle='#050404';g.beginPath();g.arc(cx+s*26,92,4,0,TAU);g.fill()}
  g.fillStyle='#120404';g.beginPath();g.moveTo(cx-100,128);g.quadraticCurveTo(cx,210,cx+100,128);g.quadraticCurveTo(cx,168,cx-100,128);g.fill();
  g.fillStyle='#e6e0d0';for(let i=-11;i<=11;i++){const x=cx+i*8.5,y=136+Math.pow(Math.abs(i)/11,2)*-6+18*(1-Math.pow(i/11,2));g.fillRect(x-3,y-9,6,11)}});
TEX.clip=ctex(128,160,(g,w,h)=>{g.fillStyle='#7a5a32';g.fillRect(0,0,w,h);g.fillStyle='#ece6d6';g.fillRect(10,22,w-20,h-30);g.fillStyle='#2a2a2a';g.fillRect(40,8,48,20);
  g.fillStyle='rgba(30,30,40,.7)';for(let y=40;y<h-14;y+=10)g.fillRect(18,y,rand(50,90),2);g.fillStyle='rgba(170,30,25,.85)';g.font='bold 16px Courier New';g.fillText('WRITE-UP',20,36)},{aniso:1});
MAT.mface=toon(0xffffff,{map:TEX.mface});MAT.clipboard=toon(0xffffff,{map:TEX.clip});

// ---- the night manager: a tall man in a grey suit, always reading his clipboard
function makeManager(){const g=new THREE.Group(),body=pivot(0,0,0,g);
  const legs=[];for(const s of[-1,1]){const hip=pivot(s*.11,1.0,0,body);part(GEO.cyl,MAT.suit,.07,1.0,.07,0,-.5,0,hip);part(GEO.box,MAT.rubber,.11,.07,.3,0,-1.0,.05,hip);legs.push(hip)}
  const torso=pivot(0,1.0,0,body);part(GEO.box,MAT.suit,.46,.72,.25,0,.38,0,torso);part(GEO.box,MAT.shirt,.14,.5,.02,0,.45,.13,torso,{cast:false});part(GEO.box,MAT.tie,.05,.42,.02,0,.42,.14,torso,{cast:false});
  const head=pivot(0,.95,0,torso);part(GEO.cyl,MAT.skin,.05,.12,.05,0,-.04,0,head);part(GEO.sph,MAT.mface,.14,.18,.15,0,.13,0,head,{ry:-Math.PI/2});part(GEO.sph,MAT.dark,.145,.08,.155,0,.24,-.02,head);
  const arms=[];for(const s of[-1,1]){const sh=pivot(s*.29,.68,0,torso);part(GEO.cyl,MAT.suit,.06,.55,.06,0,-.27,0,sh);const el=pivot(0,-.55,0,sh);part(GEO.cyl,MAT.suit,.05,.45,.05,0,-.22,0,el);part(GEO.sph,MAT.skin,.05,.06,.05,0,-.47,0,el);sh.userData.el=el;arms.push(sh)}
  // the clipboard is held up in front of his face until the very end
  const clip=pivot(0,1.05,.3,torso);part(GEO.box,MAT.clipboard,.32,.42,.02,0,0,0,clip);
  g.scale.setScalar(1.12);g.userData={body,torso,head,legs,arms,clip,ty:4};return g}

// ---- the shrink-wrap: a person under a dozen layers of pallet wrap, face pressed against the plastic
function makeShrink(){const g=new THREE.Group(),body=pivot(0,0,0,g);
  const legs=[];for(const s of[-1,1]){const hip=pivot(s*.12,.9,0,body);part(GEO.cyl,MAT.wrap,.11,.92,.11,0,-.46,0,hip);legs.push(hip)}
  const torso=pivot(0,.9,0,body);part(GEO.cyl,MAT.wrap,.24,.8,.19,0,.38,0,torso);for(let i=0;i<5;i++)part(GEO.cyl,MAT.wrap,.26,.04,.21,0,.08+i*.16,0,torso,{rz:rand(-.15,.15),cast:false});
  // arms bound to its sides, hands free at the wrists
  for(const s of[-1,1]){part(GEO.cyl,MAT.wrap,.08,.7,.08,s*.3,.38,0,torso,{rz:s*.05});part(GEO.sph,MAT.skin,.05,.07,.05,s*.32,-.02,.02,torso)}
  const head=pivot(0,.88,0,torso);part(GEO.sph,MAT.wrap,.16,.2,.17,0,.12,0,head);
  for(const s of[-1,1])part(GEO.sph,MAT.dark,.04,.03,.02,s*.06,.15,.155,head,{cast:false});part(GEO.sph,MAT.dark,.05,.06,.02,0,.02,.16,head,{cast:false}); // pressed-in eyes, open mouth
  g.userData={body,torso,head,legs,ty:5};return g}

// ---- a frost figure from the freezer: a person frozen mid-step, head bowed, icicles on the chin and fingers
function makeFrost(){const g=new THREE.Group(),body=pivot(0,0,0,g);
  const legs=[];for(const s of[-1,1]){const hip=pivot(s*.12,.9,0,body);part(GEO.cyl,MAT.frost,.08,.9,.08,0,-.45,0,hip);legs.push(hip)}
  const torso=pivot(0,.9,0,body);part(GEO.box,MAT.frost,.42,.7,.24,0,.35,0,torso);
  const head=pivot(0,.82,0,torso);part(GEO.sph,MAT.frost,.15,.18,.16,0,.12,0,head);for(const s of[-1,1])part(GEO.sph,MAT.frostCold,.035,.02,.02,s*.06,.13,.14,head,{cast:false});
  for(let i=-2;i<=2;i++)part(GEO.cone,MAT.ice,.015,.12,.015,i*.03,-.06,.13,head,{rx:Math.PI,cast:false});
  const arms=[];for(const s of[-1,1]){const sh=pivot(s*.27,.62,0,torso);part(GEO.cyl,MAT.frost,.06,.7,.06,0,-.35,0,sh);for(let f=-1;f<=1;f++)part(GEO.cone,MAT.ice,.012,.1,.012,f*.025,-.75,0,sh,{rx:Math.PI,cast:false});arms.push(sh)}
  g.userData={body,torso,head,legs,arms,ty:6};return g}

// ---- the driver: a trucker who climbed out of his cab, head hanging off to one side. His torch never flickers.
function makeDriver(){const g=makeWorker('#c9c3a8','');const u=g.userData;u.tag.visible=false;
  part(GEO.cyl,toon(0x2c3a5a),.17,.06,.19,0,.12,.02,u.head);part(GEO.box,toon(0x2c3a5a),.18,.02,.14,0,.1,.18,u.head);
  u.head.rotation.z=.85;u.ty=7;return g}

// ---- the thing in the yard: impossibly tall and thin, standing in the fog past the bay doors
function makeGiant(){const g=new THREE.Group();
  part(GEO.cyl,MAT.giant,.35,6.5,.3,0,9.5,0,g,{cast:false});part(GEO.sph,MAT.giant,.6,.4,.4,0,12.8,0,g,{cast:false});
  for(const s of[-1,1]){part(GEO.cyl,MAT.giant,.12,7,.12,s*.75,6.6,.1,g,{rz:s*.06,cast:false});part(GEO.cyl,MAT.giant,.16,6.5,.16,s*.25,3.2,0,g,{cast:false})}
  const head=pivot(0,13.6,0,g);part(GEO.sph,MAT.giant,.38,.5,.38,0,0,0,head,{cast:false});for(const s of[-1,1])part(GEO.sph,MAT.giantEye,.05,.03,.02,s*.13,.04,.36,head,{cast:false});
  const arms=[];for(const s of[-1,1]){const a=pivot(s*.75,12.6,0,g);part(GEO.cyl,MAT.giant,.1,8,.1,0,-4,0,a,{cast:false});arms.push(a)}
  g.userData={head,arms,ty:9};return g}

// ---- what rides on the elevator roof (only ever seen through the hatch)
function makeRoofThing(){const g=new THREE.Group(),head=pivot(0,0,0,g);
  part(GEO.sph,MAT.crawlSkin,.17,.21,.18,0,0,0,head);part(GEO.sph,MAT.rubber,.07,.12,.03,0,-.08,.165,head,{cast:false});
  for(const s of[-1,1])part(GEO.sph,MAT.rubber,.04,.02,.02,s*.07,.07,.165,head,{cast:false});
  for(let i=0;i<14;i++){const a=(i/14)*TAU;part(GEO.cyl,MAT.hair,.013,.6,.013,Math.sin(a)*.15,-.3,Math.cos(a)*.13,head,{cast:false})}
  const arms=[];for(const s of[-1,1]){const a=pivot(s*.2,.1,0,g);part(GEO.cyl,MAT.crawlSkin,.035,.9,.035,0,-.45,.1,a,{rx:-.3});for(let f=-1.5;f<=1.5;f++)part(GEO.cyl,MAT.crawlSkin,.01,.22,.01,f*.022,-.98,.36,a,{rx:-.5});arms.push(a)}
  g.userData={head,arms,ty:10};return g}

// ---- the passenger: a dead-grey coworker in a faded vest, sitting on the forks with its head hanging
function makePassenger(){const g=new THREE.Group(),body=pivot(0,0,0,g),sk=toon(0x7d7f78),vest=toon(0x8d8a52,{map:TEX.vest});
  for(const s of[-1,1]){const hip=pivot(s*.12,.25,0,body);hip.rotation.x=-1.4;part(GEO.cyl,MAT.pants,.08,.5,.08,0,-.25,0,hip);const kn=pivot(0,-.5,0,hip);kn.rotation.x=1.5;part(GEO.cyl,MAT.pants,.07,.45,.07,0,-.22,0,kn)}
  const torso=pivot(0,.25,0,body);torso.rotation.x=.35;part(GEO.box,vest,.44,.6,.25,0,.3,0,torso);
  const head=pivot(0,.66,.05,torso);head.rotation.x=.9;part(GEO.sph,sk,.14,.16,.14,0,.1,0,head);part(GEO.sph,MAT.hat,.16,.08,.17,0,.17,0,head);
  for(const s of[-1,1]){const sh=pivot(s*.28,.55,0,torso);sh.rotation.x=-.3;part(GEO.cyl,vest,.06,.5,.06,0,-.25,0,sh);part(GEO.sph,sk,.05,.06,.05,0,-.53,0,sh)}
  g.userData={body,torso,head,ty:11};return g}

// ---- moths: fist-sized bodies, wings a foot across with a face in the markings
function makeMoth(){const g=new THREE.Group(),body=pivot(0,0,0,g);part(GEO.sph,MAT.mothBody,.07,.07,.2,0,0,0,body);part(GEO.sph,MAT.mothBody,.06,.06,.06,0,.01,.2,body);
  for(const s of[-1,1])part(GEO.cyl,MAT.dark,.006,.18,.006,s*.03,.08,.27,body,{rx:.9,rz:s*.4,cast:false});
  const wings=[];for(const s of[-1,1]){const w=pivot(0,.02,0,body);const m=new THREE.Mesh(new THREE.PlaneGeometry(.42,.42).rotateX(-Math.PI/2).translate(s*.22,0,0),MAT.wing);if(s>0)m.scale.x=-1;w.add(m);wings.push({w,s})}
  g.userData={body,wings,ty:12};return g}

// ---- the forklift. Front (forks) is +z, like everything else. The fork carriage rides up the mast.
function makeForklift(){const g=new THREE.Group(),body=pivot(0,0,0,g);
  part(GEO.box,MAT.forkY,1.15,.85,1.7,0,.62,-.1,body);part(GEO.box,MAT.dark,1.1,.5,.5,0,.5,-.9,body); // body, counterweight
  for(const [x,z] of[[-.6,.45],[.6,.45],[-.6,-.75],[.6,-.75]])part(GEO.cyl,MAT.rubber,.3,.22,.3,x,.3,z,body,{rz:Math.PI/2});
  part(GEO.box,MAT.dark,.5,.12,.5,0,1.1,-.25,body);part(GEO.box,MAT.dark,.5,.5,.08,0,1.38,-.5,body);                     // seat
  for(const [x,z] of[[-.5,.35],[.5,.35],[-.5,-.65],[.5,-.65]])part(GEO.box,MAT.dark,.06,1.3,.06,x,1.7,z,body);           // overhead guard
  part(GEO.box,MAT.dark,1.06,.05,1.06,0,2.35,-.15,body);
  part(GEO.cyl,MAT.dark,.03,.25,.03,.15,1.25,.25,body,{rx:-.8});part(GEO.cyl,MAT.dark,.13,.03,.13,.15,1.35,.15,body,{rx:-.8}); // steering
  for(const s of[-.32,.32])part(GEO.box,MAT.steel,.1,2.4,.1,s,1.25,.75,body);                                            // mast
  const lift=pivot(0,.08,.8,body);part(GEO.box,MAT.steel,.8,.5,.06,0,.3,0,lift);for(const s of[-.25,.25])part(GEO.box,MAT.steel,.12,.05,1.15,s,0,.58,lift);
  const beacon=new THREE.Mesh(GEO.sph,basic(0xffa020));beacon.scale.setScalar(.06);beacon.position.set(0,2.42,-.2);body.add(beacon);
  g.userData={body,lift,beacon};return g}

// ---- a pallet load: eight boxes shrink-wrapped onto a pallet (counts as eight)
function makePallet(){const g=new THREE.Group();part(GEO.box,MAT.pallet,1.1,.14,1.0,0,.07,0,g);
  const k=BOX_KINDS[0];for(const dx of[-.28,.28])for(const dz of[-.25,.25])for(const dy of[0,1]){const m=new THREE.Mesh(k.geo,MAT.box[(dx>0?1:0)+dy*2]);m.position.set(dx,.14+dy*k.h,dz);m.castShadow=true;m.receiveShadow=true;g.add(m)}
  for(const y of[.3,.62,.88])part(GEO.box,MAT.wrap,1.14,.12,1.04,0,y,0,g,{cast:false}); // bands of wrap
  return g}
function makeParcel(c){const g=new THREE.Group();part(GEO.box,MAT.box[c%4],.46,.32,.4,0,.16,0,g);part(GEO.box,MAT.parcel[c],.47,.06,.41,0,.2,0,g,{cast:false});return g}
function makeFlare(){const g=new THREE.Group();part(GEO.cyl,MAT.can,.025,.3,.025,0,.03,0,g,{rz:Math.PI/2});const tip=part(GEO.sph,MAT.flare,.04,.04,.04,.16,.03,0,g,{cast:false});g.userData={tip};return g}
function makeCan(){const g=new THREE.Group();part(GEO.box,MAT.can,.24,.34,.13,0,0,0,g);part(GEO.box,MAT.dark,.05,.06,.05,.06,.2,0,g);part(GEO.box,MAT.dark,.12,.03,.03,-.03,.19,0,g);return g}
// grey hands that come up out of a sorting bin
function makeHands(){const g=new THREE.Group(),sk=toon(0x8a8478);for(let i=0;i<3;i++){const a=pivot(rand(-.25,.25),0,rand(-.25,.25),g);part(GEO.cyl,sk,.04,.8,.04,0,.4,0,a);
  for(let f=-1.5;f<=1.5;f++)part(GEO.cyl,sk,.012,.18,.012,f*.025,.88,0,a,{rz:f*.2});a.rotation.set(rand(-.4,.4),0,rand(-.4,.4))}return g}
// a rack slot that is a mouth: a gum line and teeth under the deck, only there when light falls on it
function makeTeeth(){const g=new THREE.Group();part(GEO.box,MAT.gum,1.8,.05,.06,0,-.05,.5,g,{cast:false});part(GEO.box,MAT.gum,1.8,.05,.06,0,-.05,-.5,g,{cast:false});
  for(let i=0;i<14;i++)for(const s of[-1,1])part(GEO.fang,MAT.tooth,.025,.14+Math.random()*.06,.025,-.85+i*.13,-.12,s*.5,g,{rx:Math.PI,cast:false});return g}
