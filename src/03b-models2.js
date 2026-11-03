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

// ---- the thing in the yard: twenty metres of starved, chalk-white body standing out in the weather. Legs like
// pylons, a hunched rib cage, arms that hang down past its knees to fingers longer than you are tall, and a small
// head on a long neck, tipped to one side, with two pinprick eyes and a grin that opens much too far.
const GI={HIP:13.4,TH:7,SH:6.6,UA:8.4,FA:8};
function makeGiant(){const g=new THREE.Group(),M=MAT.giant.clone(),D=MAT.giantDark,T=MAT.giantTooth.clone(),o={cast:false},body=pivot(0,0,0,g);
  const legs=[];for(const s of[-1,1]){const hip=pivot(s*.85,GI.HIP,0,body);part(GEO.cyl,M,.3,GI.TH,.3,0,-GI.TH/2,0,hip,o);part(GEO.sph,M,.44,2.4,.46,0,-1.7,.02,hip,o);
    const knee=pivot(0,-GI.TH,0,hip);part(GEO.sph,M,.36,.42,.36,0,0,0,knee,o);part(GEO.cyl,M,.21,GI.SH,.21,0,-GI.SH/2,0,knee,o);part(GEO.sph,M,.3,1.7,.33,0,-1.6,-.07,knee,o);
    const foot=pivot(0,-GI.SH,0,knee);part(GEO.box,M,.34,.14,1.6,0,-.07,.5,foot,o);for(let f=-1;f<=1;f++)part(GEO.cyl,M,.04,.5,.04,f*.1,-.1,1.4,foot,{rx:Math.PI/2,cast:false});legs.push({hip,knee,foot})}
  part(GEO.sph,M,1.0,.55,.5,0,GI.HIP+.2,0,body,o);
  const torso=pivot(0,GI.HIP+.4,0,body);
  part(GEO.cyl,M,.42,5,.42,0,2.5,-.05,torso,o);part(GEO.sph,M,.92,1.7,.6,0,3.45,.05,torso,o);part(GEO.sph,M,.62,1.3,.44,0,1.35,.04,torso,o);
  for(let i=0;i<6;i++)for(const s of[-1,1])part(GEO.box,MAT.giantShade,.42-Math.abs(i-2.5)*.04,.05,.05,s*.3,2.45+i*.38,.57-Math.abs(i-2.5)*.01,torso,{rz:s*(.25+i*.03),cast:false});                     // the gaps between its ribs
  for(let i=0;i<7;i++)part(GEO.sph,M,.13,.13,.13,0,.9+i*.62,-.4,torso,o);                                           // spine knuckles
  part(GEO.sph,M,.75,.45,.42,0,5,-.12,torso,o);for(const s of[-1,1])part(GEO.cyl,M,.17,1.6,.17,s*.76,5.1,0,torso,{rz:s*(Math.PI/2-.2),cast:false}); // hunched shoulders, sloping collarbones
  const neck=pivot(0,5.15,.15,torso);part(GEO.cyl,M,.16,2,.16,0,1,0,neck,o);
  const head=pivot(0,2,0,neck);part(GEO.sph,M,.46,.8,.52,0,.38,0,head,o);
  for(const s of[-1,1]){part(GEO.sph,D,.13,.1,.06,s*.18,.5,.46,head,o);part(GEO.sph,T,.016,.016,.016,s*.18,.5,.515,head,o)} // deep sockets, a pinprick in each
  part(GEO.sph,D,.4,.26,.34,0,-.02,.24,head,o);                           // the inside of its mouth
  for(let i=0;i<12;i++)part(GEO.fang,T,.022,.1,.022,-.27+i*.049,.0,.52,head,{rx:Math.PI,cast:false});
  const jaw=pivot(0,.04,.1,head);part(GEO.sph,M,.42,.24,.46,0,-.14,.08,jaw,o);for(let i=0;i<11;i++)part(GEO.fang,T,.02,.09,.02,-.24+i*.048,-.02,.46,jaw,o);
  const arms=[];for(const s of[-1,1]){const sh=pivot(s*1.5,4.95,0,torso);part(GEO.sph,M,.3,.3,.3,0,0,0,sh,o);
    part(GEO.cyl,M,.15,GI.UA,.15,0,0,GI.UA/2,sh,{rx:Math.PI/2,cast:false});part(GEO.sph,M,.24,.24,1.9,0,0,1.9,sh,o);const el=pivot(0,0,GI.UA,sh);part(GEO.sph,M,.22,.22,.22,0,0,0,el,o);
    part(GEO.cyl,M,.12,GI.FA,.12,0,0,GI.FA/2,el,{rx:Math.PI/2,cast:false});part(GEO.sph,M,.19,.19,1.7,0,0,1.6,el,o);const wr=pivot(0,0,GI.FA,el);part(GEO.box,M,.5,.12,.7,0,0,.3,wr,o);
    const fingers=[];for(let f=0;f<4;f++){const fp=pivot(-.2+f*.135,0,.62,wr);fp.rotation.y=(f-1.5)*.07;part(GEO.cyl,M,.042,1.9,.042,0,0,.95,fp,{rx:Math.PI/2,cast:false});
      const tip=pivot(0,0,1.9,fp);part(GEO.cyl,M,.035,1.1,.035,0,0,.55,tip,{rx:Math.PI/2,cast:false});fingers.push({fp,tip})}
    const th=pivot(-s*.28,0,.2,wr);th.rotation.y=-s*.6;part(GEO.cyl,M,.045,1.3,.045,0,0,.65,th,{rx:Math.PI/2,cast:false});
    sh.up.set(s,1,0).normalize();arms.push({sh,el,wr,fingers,s})}
  g.userData={body,legs,torso,neck,head,jaw,arms,mats:[M,T],ty:9};return g}
// Pose it. walk: stride phase; stride/crouch/lean/jaw 0..1; look: a world point its head turns to; hands: world points
// for the two hands (null hangs that arm at its side); curl: how closed each hand is.
const _gv=new THREE.Vector3(),_gs=new THREE.Vector3(),_gup=new THREE.Vector3();
function poseGiant(g,{walk=0,stride=0,crouch=0,lean=0,jaw=0,look=null,hands=[null,null],curl=[0,0],out=[0,0],t=0}={}){const u=g.userData;let H=0;
  u.legs.forEach((l,i)=>{const ph=walk+i*Math.PI,sw=Math.sin(ph)*.3*stride,a=-(crouch*1.15)-sw,b=.22+crouch*2.1+Math.max(0,-Math.cos(ph))*.45*stride;
    l.hip.rotation.x=a;l.knee.rotation.x=b;l.foot.rotation.x=-(a+b);H=Math.max(H,GI.TH*Math.cos(a)+GI.SH*Math.cos(a+b)+.14)});
  u.body.position.y=H-GI.HIP;
  u.torso.rotation.set(.16+lean*1.2+crouch*.35,0,Math.sin(t*.23)*.04);u.neck.rotation.set(.5-lean*.55-crouch*.2,0,0);u.jaw.rotation.x=.25+jaw*1.1;
  g.updateMatrixWorld(true);
  if(look){u.head.lookAt(look);u.head.rotateZ(.32+Math.sin(t*.37)*.07)}else u.head.rotation.set(.25,0,.3);
  for(let i=0;i<2;i++){const A=u.arms[i];A.sh.getWorldPosition(_gs);
    if(hands[i])_gv.copy(hands[i]);else{_gv.set(A.s*2.1,.9+Math.sin(t*.5+i*2)*.25,1.6+lean*3+Math.sin(t*.31+i)*.2);g.localToWorld(_gv)}
    _gup.set(A.s*(.3+out[i]*1.2),1-out[i]*1.3,-.45+out[i]*.5).transformDirection(g.matrixWorld);A.sh.up.copy(_gup);
    const d=clamp(_gv.distanceTo(_gs),1,(GI.UA+GI.FA)*.995),c1=clamp((GI.UA*GI.UA+d*d-GI.FA*GI.FA)/(2*GI.UA*d),-1,1),c2=clamp((GI.UA*GI.UA+GI.FA*GI.FA-d*d)/(2*GI.UA*GI.FA),-1,1);
    A.sh.lookAt(_gv);A.sh.rotateX(-Math.acos(c1));A.el.rotation.x=Math.PI-Math.acos(c2);A.wr.rotation.x=.25+curl[i]*.3;
    for(const f of A.fingers){f.fp.rotation.x=.2+curl[i]*1.1;f.tip.rotation.x=.25+curl[i]*1.3}}}
// world position of a hand's palm
function giantHand(g,i,out){return g.userData.arms[i].wr.localToWorld(out.set(0,0,.9))}

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

// ---- the blind one: far too tall and thin, grey and hairless, a smooth face with no eyes at all, only a mouth
// that hangs open. Its head is always cocked, listening. Long arms, longer fingers.
function makeBlind(){const g=new THREE.Group(),body=pivot(0,0,0,g),sk=MAT.blindSkin||(MAT.blindSkin=toon(0x77746c,{map:TEX.lskin})),dk=MAT.lurkDark;
  const legs=[];for(const s of[-1,1]){const hip=pivot(s*.11,1.25,0,body);part(GEO.cyl,sk,.07,1.27,.07,0,-.63,0,hip);part(GEO.sph,sk,.06,.05,.13,0,-1.24,.06,hip);legs.push(hip)}
  const torso=pivot(0,1.25,0,body);part(GEO.cyl,sk,.17,.86,.12,0,.43,0,torso);for(let i=0;i<4;i++)part(GEO.cyl,dk,.175,.012,.125,0,.42+i*.09,0,torso,{cast:false}); // ribs
  const arms=[];for(const s of[-1,1]){const sh=pivot(s*.22,.8,0,torso);part(GEO.cyl,sk,.045,1.15,.045,0,-.57,0,sh);
    for(let f=-1.5;f<=1.5;f++)part(GEO.cyl,sk,.012,.24,.012,f*.022,-1.24,0,sh,{rz:f*.08,cast:false});arms.push(sh)}
  const head=pivot(0,.9,0,torso);part(GEO.cyl,sk,.05,.16,.05,0,.05,0,head);part(GEO.sph,sk,.13,.19,.15,0,.24,.01,head);
  part(GEO.box,MAT.dark,.08,.12,.03,0,.15,.14,head,{cast:false}); // the mouth, hanging open
  head.rotation.set(.25,0,.4);g.userData={body,torso,head,legs,arms,ty:13};return g}

// ---- the thing in the basement corner: hunched, knees up, a torn store apron, arms long enough to reach the
// floor while it sits. Its face is turned down and it doesn't look up until it moves.
function makeHunch(){const g=new THREE.Group(),body=pivot(0,0,0,g),sk=MAT.hunchSkin||(MAT.hunchSkin=toon(0x8a8478,{map:TEX.lskin})),ap=toon(0x5a2420),hr=MAT.hair;
  const torso=pivot(0,.5,0,body);part(GEO.box,sk,.36,.72,.24,0,.36,0,torso);part(GEO.box,ap,.38,.48,.02,0,.2,.13,torso,{cast:false});part(GEO.box,ap,.04,.3,.02,.12,.62,.13,torso,{rz:.3,cast:false});
  // knees drawn up: thigh, then a knee joint and the shin
  const legs=[],knees=[];for(const s of[-1,1]){const hip=pivot(s*.12,.5,0,body);part(GEO.cyl,sk,.065,.46,.065,0,-.23,0,hip);
    const kn=pivot(0,-.46,0,hip);part(GEO.cyl,sk,.055,.5,.055,0,-.25,0,kn);part(GEO.box,sk,.09,.04,.18,0,-.5,.05,kn);legs.push(hip);knees.push(kn)}
  // arms long enough to rest on the floor while it sits
  const arms=[],elbows=[];for(const s of[-1,1]){const sh=pivot(s*.23,.66,0,torso);part(GEO.cyl,sk,.045,.6,.045,0,-.3,0,sh);
    const el=pivot(0,-.6,0,sh);part(GEO.cyl,sk,.04,.62,.04,0,-.31,0,el);for(let f=-1;f<=1;f++)part(GEO.cyl,sk,.012,.2,.012,f*.022,-.7,0,el,{rz:f*.12,cast:false});arms.push(sh);elbows.push(el)}
  const head=pivot(0,.74,.03,torso);part(GEO.sph,sk,.14,.21,.16,0,.14,0,head);
  for(const s of[-1,1])part(GEO.sph,MAT.dark,.04,.03,.02,s*.055,.16,.15,head,{cast:false});part(GEO.box,MAT.dark,.1,.025,.02,0,.04,.15,head,{cast:false});
  for(let i=0;i<9;i++){const a=-1.3+i*.33;part(GEO.box,hr,.02,rand(.25,.45),.02,Math.sin(a)*.13,.05,Math.cos(a)*.12+.02,head,{rx:Math.cos(a)*.15,rz:-Math.sin(a)*.15,cast:false})} // lank hair over the face
  g.userData={body,torso,head,legs,knees,arms,elbows,ty:14};return g}
