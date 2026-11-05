// ===================================================================== the night janitor (client side): model, animation, sound, the wet floor, slipping
Object.assign(SFX,{
  // the mop turning at the end of a sweep: a wet slap and a slosh
  janSlosh(pos){if(!AU.ready)return;const d=dest(pos,{rev:.3,gain:.9,ref:2});nz(d,{dur:.32,a:.04,g:.3,type:'lowpass',f:750,f2:280,q:.8});nz(d,{t:.04,dur:.22,a:.02,g:.12,f:1900,q:1.4})},
  // one of the bucket's wheels
  janSqueak(pos){if(!AU.ready)return;const d=dest(pos,{rev:.35,gain:.8,ref:2});const f=rand(1300,1750);tone(d,{type:'triangle',f,f2:f*rand(1.05,1.2),dur:rand(.07,.14),a:.005,g:.09})},
  // humming to himself while he works: three or four low notes that don't quite make a tune
  janHum(pos){if(!AU.ready)return;const d=dest(pos,{rev:.55,gain:1,ref:2.5});let t=0;
    for(let i=0,n=randi(3,4);i<n;i++){const dur=rand(.45,.85),f=pick([92,98,104,110,117]);voice(d,{t,dur,f0:f,f1:f*rand(.96,1.02),jit:.01,vib:.015,rasp:6,raspD:.15,v:'oo',noise:.04,sub:.5,drive:1.6,g:.16,a:.1,rel:.2});t+=dur+rand(.05,.2)}},
  // a short grunt: he's seen someone go down, or he's lost his grip
  janGrunt(pos){if(!AU.ready)return;const d=dest(pos,{rev:.4,gain:1.1,ref:2.5});voice(d,{dur:.5,a:.02,rel:.25,f0:105,f1:80,v:'aw',rasp:28,raspD:.7,jit:.05,noise:.35,sub:.6,g:.4,drive:4})},
  // his closet door: a long hinge creak
  janDoor(pos){if(!AU.ready)return;const d=dest(pos,{rev:.6,gain:1,ref:3});nz(d,{dur:.8,a:.1,g:.22,f:900,f2:560,q:9});tone(d,{type:'sawtooth',f:240,f2:170,dur:.7,a:.08,g:.03})},
  // feet going out from under you on a wet floor: a shoe squeak, a splash, a body hitting concrete
  slip(pos){if(!AU.ready)return;const d=dest(pos,{rev:.35,gain:pos?1.2:1,ref:3});tone(d,{type:'triangle',f:1900,f2:2700,dur:.09,a:.004,g:.12});
    nz(d,{t:.03,dur:.3,a:.01,g:.18,f:2300,q:1});nz(d,{t:.18,dur:.25,g:.3,type:'lowpass',f:600});tone(d,{t:.18,f:85,f2:40,dur:.35,g:.55})}});
{const sc=SFX.scare;SFX.scare=function(ty){sc.call(this,ty);if(ty!==17||!AU.ready)return; // dragged through the closet door: the door, a wet slap, a low voice right over you
  const d=dest(null,{rev:.6,gain:.75});nz(d,{dur:.3,g:.3,type:'lowpass',f:700});voice(d,{t:.1,dur:1.4,a:.05,rel:.5,f0:88,f1:58,v:'oo',v2:'aw',rasp:20,raspD:.6,jit:.03,noise:.3,sub:.8,g:.55,drive:4});
  setTimeout(()=>SFX.slam(null),900)}}

// ---------------------------------------------------------------- model: a tall man in grey overalls with a mop and a yellow bucket
// A person first: warm skin, stubble, brown hair under a work cap, a rounded chest and shoulders, sleeves rolled to the
// elbow, worn brown work boots. Only the face stays wrong: always in the shadow of the brim, with two wet glints for eyes.
function janMats(){if(!MAT.janSuit)Object.assign(MAT,{janSuit:toon(0x646b72),janSuitDk:toon(0x484e55),janSkin:toon(0xc4936f),janStub:toon(0x8a6650),janHair:toon(0x3b2b1f),
  janCap:toon(0x2f3439),janBoot:toon(0x3d2b1c),janShirt:toon(0x8e9aa3),janBucket:toon(0xe2ac16),janStrand:toon(0xc9c1a9),janWood:toon(0x8a6a3e),janWater:toon(0x2a3a33),
  janShade:basic(0x0c0907),janGlint:basic(0xd9d2bc)})}
function makeJanitor(){janMats();const M=MAT,g=new THREE.Group(),body=pivot(0,0,0,g);
  // legs: thigh and shin in the overalls, a round knee, a heavy rounded boot
  const legs=[];for(const s of[-1,1]){const hip=pivot(s*.12,1.05,0,body);
    part(GEO.cyl,M.janSuit,.1,.52,.1,0,-.26,0,hip);part(GEO.sph,M.janSuit,.095,.08,.1,0,-.53,.01,hip);part(GEO.cyl,M.janSuit,.088,.46,.088,0,-.78,0,hip);
    part(GEO.cyl,M.janSuitDk,.092,.05,.092,0,-.99,0,hip,{cast:false}); // the turned-up hem
    part(GEO.sph,M.janBoot,.1,.075,.17,0,-1.0,.06,hip);part(GEO.cyl,M.rubber,.1,.02,.17,0,-1.05,.06,hip,{cast:false});legs.push(hip)}
  // body: hips, a belly, a broad rounded chest and shoulders, all under the overalls
  const torso=pivot(0,1.05,0,body);
  part(GEO.sph,M.janSuit,.22,.16,.15,0,.02,0,torso);part(GEO.cyl,M.janSuit,.21,.42,.15,0,.24,0,torso);part(GEO.sph,M.janSuit,.26,.24,.17,0,.55,0,torso);
  part(GEO.sph,M.janShirt,.13,.06,.08,0,.78,.04,torso,{cast:false}); // the shirt collar showing above the bib
  part(GEO.box,M.janSuitDk,.3,.3,.02,0,.56,.16,torso,{cast:false});for(const s of[-1,1])part(GEO.box,M.janSuitDk,.05,.36,.02,s*.13,.66,.13,torso,{rx:-.25,cast:false}); // bib and straps
  for(const s of[-1,1])part(GEO.sph,M.steel,.018,.018,.01,s*.13,.5,.172,torso,{cast:false}); // strap buttons
  part(GEO.box,M.paper2,.11,.045,.01,.1,.62,.172,torso,{cast:false}); // a name tag with nothing written on it
  const neck=pivot(0,.82,0,torso);part(GEO.cyl,M.janSkin,.06,.2,.06,0,.08,0,neck);
  // head: a long face with a heavy jaw and stubble, ears, a nose, hair at the back, the cap pulled low
  const head=pivot(0,.2,0,neck);part(GEO.sph,M.janSkin,.125,.16,.135,0,.1,0,head);part(GEO.sph,M.janStub,.11,.07,.11,0,.0,.025,head,{cast:false});
  part(GEO.sph,M.janSkin,.03,.045,.035,0,.08,.135,head,{cast:false});for(const s of[-1,1])part(GEO.sph,M.janSkin,.025,.045,.02,s*.125,.1,0,head,{cast:false});
  part(GEO.sph,M.janHair,.135,.12,.12,0,.14,-.04,head,{cast:false});
  part(GEO.cyl,M.janCap,.14,.08,.145,0,.22,0,head);part(GEO.sph,M.janCap,.14,.05,.145,0,.26,0,head,{cast:false});part(GEO.cyl,M.janCap,.13,.012,.11,0,.19,.12,head,{cast:false}); // cap, crown and rounded brim
  part(GEO.sph,M.janSkin,.1,.025,.035,0,.145,.11,head,{cast:false}); // a heavy brow
  for(const s of[-1,1]){part(GEO.sph,M.janShade,.03,.022,.02,s*.045,.12,.118,head,{cast:false});part(GEO.sph,M.janGlint,.009,.008,.006,s*.045,.12,.136,head,{cast:false})} // deep-set eyes, two wet glints
  // arms: rounded shoulders, the overall sleeve to the elbow, then bare forearms and big hands
  const arms=[];for(const s of[-1,1]){part(GEO.sph,M.janSuit,.1,.09,.1,s*.27,.7,0,torso);const sh=pivot(s*.29,.7,0,torso);
    part(GEO.cyl,M.janSuit,.07,.5,.07,0,-.25,0,sh);part(GEO.cyl,M.janShirt,.068,.08,.068,0,-.52,0,sh,{cast:false}); // the rolled sleeve
    const el=pivot(0,-.56,0,sh);part(GEO.sph,M.janSkin,.06,.06,.06,0,0,0,el);part(GEO.cyl,M.janSkin,.05,.5,.05,0,-.26,0,el);
    part(GEO.sph,M.janSkin,.06,.085,.045,0,-.55,0,el);part(GEO.sph,M.janSkin,.022,.035,.022,s*-.045,-.52,.025,el,{cast:false}); // hand and thumb
    sh.userData.el=el;arms.push(sh)}
  // the mop, held out in front, its head on the floor; it sweeps side to side
  const mop=pivot(0,1.0,.32,body),stick=pivot(0,0,0,mop);stick.rotation.x=-.6;
  part(GEO.cyl,M.janWood,.022,1.55,.022,0,-.42,0,stick);const mh=pivot(0,-1.2,0,stick);mh.rotation.x=.6;part(GEO.box,M.steel,.26,.04,.06,0,.13,0,mh,{cast:false});
  for(let i=0;i<9;i++)part(GEO.cyl,M.janStrand,.02,.24,.02,-.12+i*.03,.02,(i%2?.025:-.025),mh,{rz:(i-4)*.06,cast:false}); // loose grey-white strands
  // the bucket on its castors, beside him: round, with dirty water in it and the wringer on top
  const bucket=pivot(-.62,0,.5,g);part(GEO.cyl,M.janBucket,.24,.38,.24,0,.27,0,bucket);part(GEO.cyl,M.janBucket,.255,.03,.255,0,.46,0,bucket,{cast:false});
  part(GEO.cyl,M.janWater,.22,.01,.22,0,.455,0,bucket,{cast:false});part(GEO.box,M.janBucket,.12,.26,.22,0,.6,-.14,bucket);
  for(const [x,z] of[[-.17,-.17],[.17,-.17],[-.17,.17],[.17,.17]])part(GEO.sph,M.rubber,.045,.045,.045,x,.045,z,bucket,{cast:false});
  part(GEO.cyl,M.steel,.012,.5,.012,-.24,.7,0,bucket,{rx:Math.PI/2,cast:false});
  g.scale.setScalar(1.18);g.userData={body,torso,neck,head,legs,arms,mop,bucket,ty:17};return g}

// a: 0 standing, 1 mopping on the spot, 2 walking and mopping, 3 stunned, 4 hurrying, 5 dragging someone. k: 1 while he's in his closet
function animJan(v,dt,time){const u=v.g.userData,a=v.a,t=time+v.ph;v.g.visible=v.k!==1;
  const mv=a===2||a===4||a===5,sp=a===4?6.2:a===5?3.4:2.6,p0=v.gp||0;v.gp=p0+(mv?dt*sp:0);
  u.legs.forEach((l,i)=>l.rotation.x=mv?Math.sin(v.gp+i*Math.PI)*(a===4?.55:.32):damp(l.rotation.x,0,6,dt));
  const sweep=a===1||a===2;v.mp=(v.mp||0)+(sweep?dt*(a===1?2.6:2.0):0);const sw=Math.sin(v.mp);
  u.mop.rotation.y=damp(u.mop.rotation.y,sweep?sw*.5:0,8,dt);u.mop.rotation.x=damp(u.mop.rotation.x,a===4?-.35:a===5?.35:0,5,dt); // held up out of the way when he hurries
  u.torso.rotation.x=damp(u.torso.rotation.x,a===5?.42:a===4?.18:.1,4,dt);u.torso.rotation.y=damp(u.torso.rotation.y,sweep?sw*.12:0,6,dt);
  // dragging, his right hand reaches back and down to the ankle he's holding; stunned, it comes up over his face
  u.arms[0].rotation.x=damp(u.arms[0].rotation.x,a===3?-2.4:a===5?.6:-.75,6,dt);u.arms[0].userData.el.rotation.x=damp(u.arms[0].userData.el.rotation.x,a===3?-1.2:a===5?.2:-.4,6,dt);
  u.arms[1].rotation.x=damp(u.arms[1].rotation.x,a===5?-.2:-.62,6,dt);u.arms[1].userData.el.rotation.x=damp(u.arms[1].userData.el.rotation.x,-.45,6,dt);
  u.neck.rotation.x=damp(u.neck.rotation.x,a===4?-.1:a===3?-.4:a===5?-.2:.38,4,dt); // head hung low while he works
  u.neck.rotation.z=a<=1?Math.sin(t*.4)*.12:damp(u.neck.rotation.z,0,4,dt);u.neck.rotation.y=a===3?damp(u.neck.rotation.y,.7,6,dt):damp(u.neck.rotation.y,0,4,dt);
  if(!v.g.visible)return;
  // what you hear: the mop turning, a castor squeaking, heavy boots, and every so often a hum
  const pos={x:v.g.position.x,y:.3,z:v.g.position.z},d=Math.hypot(pos.x-ME.x,pos.z-ME.z),dir=Math.cos(v.mp)>0;
  if(sweep&&dir!==v.mdir&&d<24)SFX.janSlosh(pos);v.mdir=dir;
  if(mv&&d<28){v.sq=(v.sq??rand(.4,1))-dt;if(v.sq<=0){v.sq=rand(.35,1.1);SFX.janSqueak(pos)}}
  if(mv&&a!==2&&Math.floor(p0/Math.PI)!==Math.floor(v.gp/Math.PI)&&d<22)SFX.step(false,a===4,{x:pos.x,y:.05,z:pos.z});
  if(a<=2&&d<30){v.hm=(v.hm??rand(2,5))-dt;if(v.hm<=0){v.hm=rand(7,12);SFX.janHum({x:pos.x,y:2.2,z:pos.z})}}}
function janFear(v,d){if(v.k===1)return 0;return v.a===4||v.a===5?clamp(1-d/10,0,1)*1.1:clamp(1-d/7,0,1)*.3}
// the jumpscare: he leans down over you in the closet doorway
function janScare(s,k,lunge){const g=s.g,u=g.userData;g.position.set(rand(-.01,.01),-2.25,lerp(-1.4,-.6,lunge(.2)));g.rotation.y=0;u.mop.visible=false;u.bucket.visible=false;
  u.torso.rotation.x=.55;u.neck.rotation.set(.45,0,Math.sin(k*15)*.06);u.arms.forEach(a=>{a.rotation.x=-1.5;a.userData.el.rotation.x=-.4})}

// ---------------------------------------------------------------- his closet on the east wall
const JANV={built:false,door:null,glow:null,open:0,night:0};
function buildJanCloset(){JANV.built=true;const x=WH.x1,z=JAN.door.z,g=new THREE.Group();ROOT.add(g);
  for(const s of[-1,1])part(GEO.box,MAT.dark,.1,2.45,.1,x-.05,1.22,z+s*.66,g);part(GEO.box,MAT.dark,.1,.1,1.42,x-.05,2.42,z,g);
  part(GEO.box,basic(0x020202),.01,2.3,1.2,x-.012,1.15,z,g,{cast:false}); // the dark inside, when the door is open
  const hinge=pivot(x-.07,0,z-.6,g);part(GEO.box,MAT.door,.06,2.3,1.2,0,1.15,.6,hinge);part(GEO.box,MAT.steel,.05,.06,.14,-.05,1.05,1.05,hinge,{cast:false});
  // light under the door while he's in there
  const glow=new THREE.Mesh(new THREE.PlaneGeometry(1.1,.04),basic(0xffd88a,{transparent:true,opacity:0}));glow.position.set(x-.11,.02,z);glow.rotation.y=-Math.PI/2;g.add(glow);
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.0,.32),toon(0xffffff,{map:signTex([{t:'JANITOR',bold:true,size:96}],{w:384,h:128,bg:'#2a2d33',fg:'#d8d2bd'})}));
  sign.position.set(x-.03,2.75,z);sign.rotation.y=-Math.PI/2;g.add(sign);JANV.door=hinge;JANV.glow=glow}

// ---------------------------------------------------------------- the wet floor: a dark sheen on the concrete, and a yellow sign every so often
const WETV=new Map();let WETG=null;
function wetGfx(){if(WETG)return WETG;const R=JAN.wetR;
  const tex=ctex(128,128,(g,w,h)=>{g.clearRect(0,0,w,h);for(let i=0;i<7;i++){const x=rand(36,92),y=rand(36,92),r=rand(22,38),gr=g.createRadialGradient(x,y,0,x,y,r);
    gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.7,'rgba(255,255,255,.7)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,w,h)}},{srgb:false,aniso:1});
  const off={transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2};
  const sTex=signTex([{t:'CAUTION',bold:true,size:58},{t:'WET',bold:true,size:80},{t:'FLOOR',bold:true,size:80}],{w:256,h:384,bg:'#f2c81e',fg:'#141005',dirt:false});
  WETG={geo:new THREE.PlaneGeometry(R*2.2,R*2.2).rotateX(-Math.PI/2),
    dark:toon(0x16222b,{...off,alphaMap:tex,opacity:.6}), // wet concrete, darker where the light hits it
    sheen:new THREE.MeshBasicMaterial({...off,color:0x5d7f98,alphaMap:tex,opacity:.13,blending:THREE.AdditiveBlending}), // and a faint shine, so you can see it in the dark close up
    sign:toon(0xffffff,{map:sTex,side:THREE.DoubleSide}),signGeo:new THREE.PlaneGeometry(.36,.56).translate(0,-.28,0)};return WETG}
function makeWetSign(){const G=wetGfx(),g=new THREE.Group();for(const s of[-1,1]){const p=pivot(0,.56,0,g);p.rotation.set(s*.3,s>0?Math.PI:0,0); /* each panel's printed side faces out, so the words read the right way round */const m=new THREE.Mesh(G.signGeo,G.sign);p.add(m)}
  part(GEO.box,MAT.dark,.38,.03,.03,0,.56,0,g,{cast:false});return g}
function syncJan(dt,time){if(!S)return;if(!JANV.built&&ROOT)buildJanCloset();
  // closet door: swings open when he goes in or out
  JANV.open=Math.max(0,JANV.open-dt);if(JANV.door)JANV.door.rotation.y=damp(JANV.door.rotation.y,JANV.open>0?-1.25:0,JANV.open>0?5:3,dt);
  const j=S.mons.find(m=>m.ty===17);if(JANV.glow)JANV.glow.material.opacity=j&&j.k===1?.55+Math.sin(time*13)*.08+(Math.random()<.04?-.4:0):0;
  // a crewmate's copy dries the patches itself between updates from the host
  if(NET.mode==='client'&&S.wet)S.wet=S.wet.filter(w=>(w.t-=dt)>0);
  const live=new Set();
  for(const w of S.wet||[]){live.add(w.id);let v=WETV.get(w.id);const G=wetGfx();
    if(v&&(v.x!==w.x||v.z!==w.z)){ROOT.remove(v.g);if(v.sign)ROOT.remove(v.sign);WETV.delete(w.id);v=null} // (an id reused by a new run)
    if(!v){const g=new THREE.Group(),ry=rand(0,TAU),d=new THREE.Mesh(G.geo,G.dark),s=new THREE.Mesh(G.geo,G.sheen);d.position.y=.012;s.position.y=.014;d.rotation.y=s.rotation.y=ry;d.renderOrder=s.renderOrder=1;g.add(d,s);
      g.position.set(w.x,0,w.z);ROOT.add(g);v={g,sign:null,x:w.x,z:w.z};if(w.s){v.sign=makeWetSign();v.sign.position.set(w.x+rand(-.3,.3),0,w.z+rand(-.3,.3));v.sign.rotation.y=rand(0,TAU);ROOT.add(v.sign)}WETV.set(w.id,v)}
    const k=clamp(w.t/14,.3,1);v.g.scale.set(k,1,k); // drying, it shrinks
    if(v.sign)v.sign.scale.setScalar(w.t<1.2?Math.max(.01,w.t/1.2):1)}
  for(const [id,v] of WETV)if(!live.has(id)){ROOT.remove(v.g);if(v.sign)ROOT.remove(v.sign);WETV.delete(id)}}

// ---------------------------------------------------------------- slipping
// Running on a wet patch: your feet go, you hit the floor, and you're down for a couple of seconds. Walking is safe.
function janSlipCheck(run,sp,me){if(!run||sp<2.2||ME.slipT>0||ME.driving||!S.wet||!S.wet.length||S.phase!=='play'||me.dead)return;
  if(performance.now()-(ME.slipAt||0)<1600||!wetAt(ME.x,ME.z))return;
  ME.slipAt=performance.now();ME.slipT=slipDur();ME.vx=ME.vz=0;ME.shake=Math.max(ME.shake,.7);SFX.slip(null);doAct({a:'slip'});
  if(!GAME.hints.slip){GAME.hints.slip=1;setTimeout(()=>GAME.on&&toast('Wet floor. Walk across it: only running makes you slip.',4.5),900)}}
// on the floor: the camera drops, you can look around, then you get back up
function janDown(dt,me){if(!(ME.slipT>0))return false;if(S.phase!=='play'||me.dead){ME.slipT=0;return false}
  ME.slipT=Math.max(0,ME.slipT-dt);const T=slipDur(),k=T-ME.slipT,fall=easeOut(Math.min(1,k/.35)),rise=ME.slipT<.6?easeIO(1-ME.slipT/.6):0;
  ME.vx=ME.vz=0;const h=lerp(lerp(1.62,.3,fall),1.62,rise),tilt=fall*(1-rise),sh=ME.shake*ME.shake;
  camera.position.set(ME.x,h,ME.z);camera.rotation.set(ME.pitch+.45*tilt+rand(-1,1)*sh*.05,ME.yaw,.35*tilt+rand(-1,1)*sh*.06);VM.g.position.set(0,-.35*tilt,0);
  batteryUpdate(dt,true,me);me.x=ME.x;me.z=ME.z;me.yaw=ME.yaw;me.pitch=ME.pitch;me.light=ME.lightOn();return true}
// dragged by the ankle: flat on your back behind him, looking up at him
function janHeld(dt,me,m){const v=MV.get(m.id),gx=v?v.g.position.x:m.x,gz=v?v.g.position.z:m.z,ry=v?v.g.rotation.y:m.ry;
  ME.x=gx-Math.sin(ry)*1.15;ME.z=gz-Math.cos(ry)*1.15;ME.vx=ME.vz=0;ME.slipT=0;
  ME.yaw=angLerp(ME.yaw,Math.atan2(-(gx-ME.x),-(gz-ME.z)),dt*5);ME.pitch=damp(ME.pitch,.45,4,dt);
  const t=performance.now()*.001;camera.position.set(ME.x,.32+Math.abs(Math.sin(t*5))*.04,ME.z);camera.rotation.set(ME.pitch,ME.yaw+Math.sin(t*4)*.05,Math.sin(t*3)*.12);
  VM.g.position.set(0,-.35,0);batteryUpdate(dt,true,me);me.x=ME.x;me.z=ME.z;return true}
// a crewmate is being dragged and you're right by them: E pulls at them (handled before anything else E would do)
function janVictimNear(){const m=S.mons.find(o=>o.ty===17&&o.a===5&&o.tg&&o.tg!==NET.myId);if(!m)return null;const p=S.players[m.tg];if(!p||p.dead)return null;
  return Math.hypot(p.x-ME.x,p.z-ME.z)<JAN.helpR?{m,p}:null}
// crewmates shut in his closet, and whether you're at its door
const janShut=()=>S?Object.values(S.players).filter(p=>p.locked&&!p.dead&&p.id!==NET.myId):[];
function janAtDoor(){const d={x:JAN.door.x-.9,z:JAN.door.z};return Math.hypot(ME.x-d.x,ME.z-d.z)<JAN.freeR-.2}
function janHelpKey(me){if(!S||ME.slipT>0)return false;
  if(janShut().length&&janAtDoor()){doAct({a:'janFree'});return true} // E at the closet door lets them out
  const n=janVictimNear();if(!n)return false;const now=performance.now();if(now-(ME.hgT||0)<60)return true;ME.hgT=now;
  ME.shake=Math.max(ME.shake,.15);doAct({a:'janHelp'});return true}

// ---------------------------------------------------------------- what the prompt line says
const janMeter=k=>`<span class="meter"><i style="width:${Math.round(clamp(k,0,1)*100)}%"></i></span>`;
function janGrabNote(m){const k=Math.max(ME.strug||0,m.v|0)/JAN.strugN;
  return`<span class="warnline">HE HAS YOU BY THE ANKLE</span><br>Mash <kbd>E</kbd> to kick free ${janMeter(k)}`}
function janNote(me){if(!S||!me||me.dead)return'';
  if(ME.slipT>0){const j=S.mons.find(m=>m.ty===17&&m.a===4&&m.tg===NET.myId);
    return`<span class="warnline">YOU SLIPPED</span><br>Getting up&hellip; ${janMeter(1-ME.slipT/slipDur())}${j?'<br><span class="warnline">Heavy footsteps, coming fast</span>':''}`}
  // someone is shut in his closet: at the door it's E, anywhere else the prompt points the way
  const shut=janShut();if(shut.length&&janAtDoor())return`<kbd>E</kbd> Open the closet: let ${esc(shut.map(p=>p.name||'someone').join(' and '))} out`;
  const n=janVictimNear();if(n)return`<span class="warnline">THE JANITOR HAS ${esc(String(n.p.name||'them').toUpperCase())}</span><br>Mash <kbd>E</kbd> to pull them free ${janMeter((n.m.v|0)/JAN.strugN)}${haveItem(me,'strobe')?' &middot; or flash him with the strobe':''}`;
  return''}
// anywhere else, an extra line under the usual prompt says who is shut in and which way the door is
function shutNote(me){if(!S||!me||me.dead||me.locked)return'';const shut=janShut();if(!shut.length||janAtDoor())return'';const who=esc(shut.map(p=>p.name||'someone').join(' and '));
  return`<span class="warnline">${who} ${shut.length>1?'are':'is'} shut in the janitor's closet</span> &middot; let them out at the door on the east wall ${dirTo(JAN.door.x-.9,JAN.door.z)}`}
function wetNote(me){if(!S||!S.wet||!S.wet.length||!me||me.dead||ME.slipT>0||ME.driving)return'';return wetAt(ME.x,ME.z,.5)?'<span style="color:#9fd4ff">Wet floor: walk, don\'t run</span>':''}

// ---------------------------------------------------------------- crewmates: flat on the floor after a slip, or dragged off feet first
function janAvatar(p,v,dt){const g=v.g;if(g.rotation.order!=='YXZ')g.rotation.order='YXZ';
  const held=S.mons.find(m=>m.ty===17&&m.a===5&&m.tg===p.id),down=!!p.down||!!held&&!p.dead;
  g.rotation.x=damp(g.rotation.x,down?-1.45:0,9,dt);
  if(held){const mv=MV.get(held.id);if(mv)g.rotation.y=mv.g.rotation.y} // feet toward him, head away
  if(down)g.userData.legs.forEach(l=>l.rotation.x=0)}

// ---------------------------------------------------------------- events
function onEventJan(e){const me=NET.myId,P=(x,z,y=1)=>({x,y,z});
  switch(e.e){
  case 'janIn':SFX.janDoor(P(e.x,e.z,1.2));JANV.open=1.8;
    if(S&&JANV.night!==S.night){JANV.night=S.night;setTimeout(()=>GAME.on&&S&&S.phase==='play'&&toast('Somewhere in the aisles a bucket squeaks and someone starts to mop. On a wet floor, walk: don\'t run.',6),1500)}return true;
  case 'slip':if(e.p===me){if(!(ME.slipT>0)){ME.slipT=slipDur();ME.shake=Math.max(ME.shake,.7);SFX.slip(null)}}else SFX.slip(P(e.x,e.z,.3));return true;
  case 'janCome':if(e.p===me)toast('Heavy footsteps, coming fast. Get up!',2.5);SFX.janGrunt(P(e.x,e.z,2));return true;
  case 'jgrab':if(e.p===me){ME.grab=true;ME.strug=0;ME.shake=.8;SFX.hurt();toast('He has you by the ankle. Mash E!',3)}
    else{const v=AV.get(e.p);if(v&&Math.hypot(v.x-ME.x,v.z-ME.z)<35)toast(`The janitor has ${e.n} by the ankle! Get to them and mash E to pull them free.`,4.5)}
    {const p=evPos(e);if(p)SFX.janGrunt(p)}return true;
  case 'jfree':if(e.p===me){ME.grab=false;ME.slipT=0;ME.strug=0;toast(e.how==='strobe'?'The flash makes him let go. Move!':'You\'re free. Get away from him.',3)}SFX.janGrunt(P(e.x,e.z,2));return true;
  case 'jstun':SFX.janGrunt(P(e.x,e.z,2));return true;
  case 'jcloset':JANV.open=1.4;SFX.janDoor(P(e.x,e.z,1.2));setTimeout(()=>SFX.slam(P(e.x,e.z,1.2)),700);
    if(e.p===me){ME.grab=false;ME.slipT=0;ME.strug=0;setTimeout(()=>{const p=S&&S.players[me];if(p&&p.locked)toast('The door shuts behind you. You\'re shut in the janitor\'s closet until a crewmate lets you out.',5)},400)}
    else toast(`${e.n} was dragged into the janitor's closet. Let them out: the door on the east wall.`,5);return true;
  case 'jout':JANV.open=1.6;SFX.janDoor(P(e.x,e.z,1.2));
    if((e.ids||[]).includes(me))toast(`${e.p===me?'You':e.n} opened the closet. You're out.`,3.5);else if(e.p===me)toast(`You let ${e.who} out.`,3);else toast(`${e.n} let ${e.who} out of the closet.`,3.5);return true}
  return false}
