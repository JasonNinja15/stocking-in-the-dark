// ===================================================================== client: additions, later-night monsters, items, the shop
let FORK3D=null,GIANT=null,PASS3D=null;const PV=new Map(),PALV=new Map(),FLV=new Map(),MOUTHV=new Map();
let PARCELPICK=[],PALPICK=[],FORKPICK=[];const SCAN=[];
const FLARE_L=new THREE.PointLight(0xff4a2a,0,10,1.5),ROOM_L=new THREE.PointLight(0x9fc4ff,0,12,1.5);
const REDL=new THREE.SpotLight(0xff2412,0,12,.5,.6,1.3);REDL.position.set(0,.12,0);REDL.target.position.set(0,-.4,-6);camera.add(REDL,REDL.target);
const ITEM_KEYS={Digit1:'batt',Digit2:'flare',Digit3:'cutter',Digit4:'strobe',Digit5:'scanner',Digit6:'horn',Digit7:'drink',Digit8:'remote',Digit9:'bulb'};
const PARCEL_NAMES=['red','blue','yellow'],PARCEL_CSS=['#e0493c','#4a7fe0','#e8c440'];

function buildExtrasVisuals(){FORK3D=makeForklift();ROOT.add(FORK3D);
  // one invisible box around the whole machine, so it's easy to look at and press E
  {const hit=new THREE.Mesh(GEO.box,basic(0));hit.scale.set(1.5,2.4,3.4);hit.position.set(0,1.2,.2);hit.visible=false;hit.userData={kind:'fork'};FORK3D.add(hit);FORKPICK.push(hit)}
  GIANT=makeGiant();GIANT.visible=false;ROOT.add(GIANT);PASS3D=makePassenger();PASS3D.visible=false;ROOT.add(PASS3D);ROOT.add(FLARE_L,ROOM_L);
  const tex=ctex(64,64,g=>{const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,220,140,1)');gr.addColorStop(.45,'rgba(255,110,30,.7)');gr.addColorStop(1,'rgba(255,40,0,0)');g.fillStyle=gr;g.fillRect(0,0,64,64)},{aniso:1});
  for(let i=0;i<20;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthTest:false,depthWrite:false,transparent:true,blending:THREE.AdditiveBlending,fog:false}));s.visible=false;s.renderOrder=9;scene.add(s);SCAN.push(s)}
  VM.can=makeCan();VM.can.position.set(-.16,-.36,-.55);VM.can.visible=false;VM.g.add(VM.can);VM.can.traverse(o=>{if(o.isMesh){o.castShadow=false;o.renderOrder=5}});
  VM.stack=[];for(let i=0;i<2;i++){const m=new THREE.Mesh(BOX_KINDS[0].geo,MAT.box[i]);m.scale.setScalar(.55);m.visible=false;m.renderOrder=5;VM.g.add(m);VM.stack.push(m)}}
const shown=o=>{for(let p=o.parent;p;p=p.parent)if(!p.visible)return false;return true};

// ---------------------------------------------------------------- per-frame sync of the additions' moving parts
function syncExtras(dt,time){if(!S)return;const t=time;
  // cold storage door swings out on its hinge
  if(S.cold)ADDV.coldDoor.rotation.y=-S.cold.door*1.7;
  // sorting: arm points at the selected bin, lever lamp shows its colour, the jam button flashes
  if(S.conv){const bz=CONV.bins[S.conv.sel];ADDV.arm.rotation.y=damp(ADDV.arm.rotation.y,-Math.atan2(bz-CONV.z,CONV.bx-CONV.x1),10,dt);
    ADDV.lever.rotation.z=damp(ADDV.lever.rotation.z,(S.conv.sel-1)*.5,12,dt);ADDV.leverLamp.material.color.set(PARCEL_CSS[S.conv.sel]);
    ADDV.jamBtn.material.color.set(S.conv.jam&&Math.sin(t*10)>0?0xff3020:0x9a1a12)}
  const live=new Set();PARCELPICK.length=0;
  for(const p of S.parcels||[]){live.add(p.id);let v=PV.get(p.id);if(!v){v={g:makeParcel(p.c),tw:0};v.g.traverse(o=>{if(o.isMesh)o.userData={kind:'parcel',id:p.id}});ROOT.add(v.g);PV.set(p.id,v)}
    v.g.position.set(damp(v.g.position.x||p.x,p.x,12,dt),CONV.y+.04,CONV.z);if(v.tw>0){v.tw-=dt;v.g.rotation.z=Math.sin(v.tw*60)*.08;v.g.position.y+=Math.abs(Math.sin(v.tw*40))*.03}else v.g.rotation.z=0;
    v.g.traverse(o=>{if(o.isMesh)PARCELPICK.push(o)})}
  for(const [id,v] of PV)if(!live.has(id)){ROOT.remove(v.g);PV.delete(id)}
  // elevator gates roll up into the car roof; the basement bulb flickers
  if(S.elev&&owned('base')){const e=S.elev;for(const [car,lvl] of[[ADDV.carUp,0],[ADDV.carDn,1]]){const open=e.lvl===lvl?e.gate:0;car.gate.position.y=open*2.35;car.btn.material.color.set(e.st==='idle'?0x3aff7a:0xffa020);
      // while something is on the roof the hatch glows a dull red and jolts under its weight
      const st=e.st==='stall'&&e.lvl===lvl;car.hatch.material.color.setRGB(st?.35+.25*Math.sin(t*7):.05,st?.04:.05,st?.03:.05);car.hatch.position.y=2.69-(st&&Math.random()<.05?.05:0)}
    ADDV.baseBulb.material.color.setScalar(Math.random()<.04?.2:1)}
  if(S.gen&&owned('gen')){const f=S.gen.fuel/100;ADDV.genGauge.scale.x=Math.max(.01,.36*f);ADDV.genGauge.material.color.set(f>.3?0x3aff7a:f>.12?0xffa020:(Math.sin(t*8)>0?0xff3020:0x400a08))}
  // forklift
  const f=S.fork;if(f&&FORK3D){FORK3D.position.set(f.x,0,f.z);FORK3D.rotation.y=f.ry;const u=FORK3D.userData;u.lift.position.y=damp(u.lift.position.y,.08+(f.pal>=0?2.62:f.lift||0),3,dt);
    u.beacon.material.color.set(f.drv&&Math.sin(t*9)>0?0xffa020:0x3a2408);
    PASS3D.visible=!!f.pass;if(f.pass){const tip={x:f.x+Math.sin(f.ry)*1.35,z:f.z+Math.cos(f.ry)*1.35};PASS3D.position.set(tip.x,u.lift.position.y+.06,tip.z);PASS3D.rotation.y=f.ry+Math.PI}
    if(AU.ready){if(!FORK3D.userData.eng)FORK3D.userData.eng=loop('engine',{x:f.x,y:1,z:f.z},.55);const sp=Math.hypot(f.x-(FORK3D.userData.px??f.x),f.z-(FORK3D.userData.pz??f.z))/Math.max(dt,1e-3);
      FORK3D.userData.px=f.x;FORK3D.userData.pz=f.z;FORK3D.userData.eng.pos({x:f.x,y:1,z:f.z});FORK3D.userData.eng.set(f.drv?.35+Math.min(1,sp/4)*.6:0,.2)}}
  // pallets
  const pl=new Set();PALPICK.length=0;
  for(const p of S.pallets||[]){pl.add(p.id);let g=PALV.get(p.id);if(!g){g=makePallet();g.traverse(o=>{if(o.isMesh)o.userData={kind:'pallet',id:p.id}});ROOT.add(g);PALV.set(p.id,g)}
    if(p.st===0){const tr=S.trucks[p.bay];g.visible=tr.st!==0;g.position.set(BAYS[p.bay].x+p.lx,0,tr.z+p.lz);g.rotation.y=0}
    else if(p.st===1&&f){g.visible=true;const u=FORK3D.userData;g.position.set(f.x+Math.sin(f.ry)*1.45,u.lift.position.y+.02,f.z+Math.cos(f.ry)*1.45);g.rotation.y=f.ry}
    else if(p.st===2){const s=SLOTS[p.s];g.visible=true;if(s)g.position.set(s.x,s.y,s.z);g.rotation.y=0}
    else{g.visible=true;g.position.set(p.x,0,p.z);g.rotation.y=p.ry}
    if(g.visible)g.traverse(o=>{if(o.isMesh)PALPICK.push(o)})}
  for(const [id,g] of PALV)if(!pl.has(id)){ROOT.remove(g);PALV.delete(id)}
  // flares, and one real light for the one nearest you
  const fs=new Set();let nf=null,nd=1e9;
  for(const fl of S.flares||[]){fs.add(fl.id);let v=FLV.get(fl.id);if(!v){v={g:makeFlare()};v.g.position.set(fl.x,0,fl.z);v.g.rotation.y=rand(0,TAU);ROOT.add(v.g);if(AU.ready)v.lp=loop('flare',{x:fl.x,y:.2,z:fl.z},.5);FLV.set(fl.id,v)}
    v.lp&&v.lp.set(.6,.2);const d=Math.hypot(fl.x-ME.x,fl.z-ME.z);if(d<nd){nd=d;nf=fl}}
  for(const [id,v] of FLV)if(!fs.has(id)){ROOT.remove(v.g);v.lp&&v.lp.stop();FLV.delete(id)}
  FLARE_L.intensity=nf?(8+Math.random()*3):0;if(nf)FLARE_L.position.set(nf.x,.5,nf.z);
  if(ADDV.coldBeacon)ADDV.coldBeacon.material.color.setHSL(.58,1,.35+.25*Math.max(0,Math.sin(t*4)));
  // a room light that follows you into the freezer or the basement
  if(ME.x>60&&owned('base')){ROOM_L.color.set(0xffc890);ROOM_L.position.set(77,2.8,0);ROOM_L.intensity=Math.random()<.04?.5:7}
  else if(owned('cold')&&ME.x>18&&ME.z<-9){ROOM_L.color.set(0x9fc4ff);ROOM_L.position.set(25.5,3,-16);ROOM_L.intensity=5}else ROOM_L.intensity=0;
  // mouths: teeth only where your own light falls
  const me=S.players[NET.myId];const ms=new Set(S.mouths||[]);
  for(const id of ms){let g=MOUTHV.get(id);const s=SLOTS[id];if(!g){g=makeTeeth();g.position.set(s.x,s.y,s.z);ROOT.add(g);MOUTHV.set(id,g)}g.visible=!!(me&&ME.lightOn()&&litByP(me,s.x,s.y+.2,s.z))}
  for(const [id,g] of MOUTHV)if(!ms.has(id)){ROOT.remove(g);MOUTHV.delete(id)}
  // the thing in the yard
  if(S.yard){GIANT.visible=true;const z=WH.z0-YARD_D[S.yard.stage];GIANT.position.x=BAYS[S.yard.bay].x;GIANT.position.z=damp(GIANT.position.z||z,z,1.5,dt);GIANT.position.y=-1.25;
    GIANT.rotation.y=Math.PI*0;GIANT.userData.head.rotation.z=Math.sin(t*.3)*.2;GIANT.userData.arms.forEach((a,i)=>a.rotation.x=Math.sin(t*.4+i)*.05)}else GIANT.visible=false}

// ---------------------------------------------------------------- driving the forklift
function driveUpdate(dt,me){const f=S.fork,busy=!!ME.scare||S.phase!=='play';
  const th=busy?0:(K.KeyW||K.ArrowUp?1:0)-(K.KeyS||K.ArrowDown?1:0),st=busy?0:(K.KeyD||K.ArrowRight?1:0)-(K.KeyA||K.ArrowLeft?1:0);
  ME.fv=damp(ME.fv||0,th>0?4.4:th<0?-2:0,th?2:3.5,dt);
  f.ry+=st*dt*1.5*clamp(Math.abs(ME.fv)/1.2,0,1)*(ME.fv<0?-1:1);
  const p={x:f.x+Math.sin(f.ry)*ME.fv*dt,z:f.z+Math.cos(f.ry)*ME.fv*dt};collideCircle(p,.85);
  if(p.z<WH.z0-.3){let bi=-1;for(let i=0;i<BAYS.length;i++)if(Math.abs(p.x-BAYS[i].x)<TRAIL_HW+.4)bi=i;const tr=bi>=0?S.trucks[bi]:null;if(!tr||tr.st!==2){p.x=f.x;p.z=Math.max(f.z,WH.z0+.9)}}
  p.x=clamp(p.x,WH.x0+.9,WH.x1-.9);p.z=clamp(p.z,TZ_DOCK-TRAIL_LEN+1,WH.z1-.9);
  if(Math.hypot(p.x-f.x,p.z-f.z)<Math.abs(ME.fv)*dt*.3)ME.fv*=.5; // bumped into something
  f.x=p.x;f.z=p.z;
  ME.x=f.x-Math.sin(f.ry)*.25;ME.z=f.z-Math.cos(f.ry)*.25;
  if(AU.ready){if(!ME.beep)ME.beep=loop('beep',{x:f.x,y:1.5,z:f.z},.6);ME.beep.pos({x:f.x,y:1.5,z:f.z});ME.beep.set(ME.fv<-.3?.25:0,.05)}
  const sh=ME.shake*ME.shake;camera.position.set(ME.x,2.12+Math.sin(performance.now()/40)*.004*Math.abs(ME.fv),ME.z);camera.rotation.set(ME.pitch+rand(-1,1)*sh*.05,ME.yaw+rand(-1,1)*sh*.05,rand(-1,1)*sh*.06);
  VM.g.position.set(0,0,0);me.x=ME.x;me.z=ME.z;me.yaw=ME.yaw;me.pitch=ME.pitch;me.light=ME.lightOn();applyColliders()}
// what the forks are lined up with
function forkTarget(){const f=S.fork,t={x:f.x+Math.sin(f.ry)*1.55,z:f.z+Math.cos(f.ry)*1.55};
  if(f.pal>=0){let best=null,bd=2.6;for(const s of SLOTS){if(s.y<2||s.cold||!slotOn(s))continue;const d=Math.hypot(s.x-t.x,s.z-t.z);if(d<bd){bd=d;best=s}}return best?{kind:'fslot',s:best,ok:!best.old&&best.box===-1}:null}
  const pal=(S.pallets||[]).find(p=>(p.st===0||p.st===3)&&(()=>{const w=p.st===0?{x:BAYS[p.bay].x+p.lx,z:S.trucks[p.bay].z+p.lz}:p;return Math.hypot(w.x-t.x,w.z-t.z)<1.3})());
  return pal?{kind:'fpal',id:pal.id}:null}

// ---------------------------------------------------------------- input for the new things (returns true if it used the key)
function onKey2(code,me){
  if(code==='KeyH'){if(me.up&&me.up.red){ME.red=!ME.red;SFX.click()}else toast('You don\'t have a headlamp.');return true}
  const k=ITEM_KEYS[code];
  if(k){if(k==='scanner')return true;const have=k==='cutter'?me.up&&me.up.cutter:(me.inv&&me.inv[k]>0);if(!have){SFX.deny();toast(`No ${SHOP[k].name.toLowerCase()}. They're sold between nights.`,2.5);return true}
    if(k==='cutter'){const t=ME.target;if(t&&t.kind==='box')doAct({a:'use',k,b:t.b.id});else if(t&&t.kind==='parcel')doAct({a:'use',k,pc:t.id});else toast('Look at a box to cut it open.',2);return true}
    if(k==='strobe'){ME.flash=Math.max(ME.flash,.55);SFX.strobe()}
    doAct({a:'use',k});return true}
  if(ME.driving){
    if(code==='KeyQ'){doAct({a:'fork'});return true}
    if(code==='KeyE'){const t=ME.target;if(t&&t.kind==='fslot'){if(t.ok)doAct({a:'fplace',s:t.s.id});else SFX.deny()}else if(t&&t.kind==='fpal')doAct({a:'fpick'});else SFX.deny();return true}
    if(code==='KeyG'){if(S.fork.pal>=0){doAct({a:'fdrop'})}return true}
    return true}
  if(code==='KeyE'){const t=ME.target;if(!t)return false;
    switch(t.kind){
    case 'fork':if(!owned('fork')){toast('The forklift is broken. It can be repaired between nights.',3);SFX.locked()}else if(me.carry>=0||me.can)toast('Put down what you\'re carrying first.',2.5);else doAct({a:'fork'});return true;
    case 'pallet':toast('Far too heavy to lift by hand. That\'s forklift work.',3);SFX.deny();return true;
    case 'parcel':toast('Parcels sort themselves. Set the lever to the next colour.',3);return true;
    case 'cold':doAct({a:'cold'});return true;
    case 'lever':doAct({a:'lever'});return true;
    case 'jam':return true; // held, see localUpdate2
    case 'elevIn':doAct({a:'elevIn',lvl:t.lvl});return true;
    case 'elevCall':doAct({a:'elevCall',lvl:t.lvl});return true;
    case 'gen':if(me.can)doAct({a:'fuel'});else toast('Bring a jerry can from the fuel rack.',2.5);return true;
    case 'fuelrack':if(me.can)toast('You already have a can.',2);else if(me.carry>=0)toast('Your hands are full.',2);else doAct({a:'can'});return true}}
  if(code==='KeyQ'&&ME.target&&ME.target.kind==='parcel'){if(ME.kickCD>0)return true;ME.kickCD=.8;ME.kickA=.35;doAct({a:'kick',pc:ME.target.id});return true}
  return false}
// held E on the jam button for a moment clears it
function localUpdate2(dt,me){const t=ME.target;
  if(t&&t.kind==='jam'&&K.KeyE&&S.conv&&S.conv.jam&&!ME.scare){ME.holdT=(ME.holdT||0)+dt;if(ME.holdT>1.2){ME.holdT=-99;doAct({a:'jam'})}}else if(!K.KeyE)ME.holdT=0;
  ME.drinkT=Math.max(0,(ME.drinkT||0)-dt);ME.scan=!!(K.Digit5&&me.up&&me.up.scanner&&!ME.scare)}
function findTarget2(me,hit){const ud=hit.object.userData;
  if(ud.kind==='parcel'){ME.target={kind:'parcel',id:ud.id};return true}
  if(ud.kind==='pallet'){ME.target={kind:'pallet',id:ud.id};return true}
  if(ud.kind==='fork'){ME.target={kind:'fork'};return true}
  if(ud.kind==='elevIn'||ud.kind==='elevCall'){ME.target={kind:ud.kind,lvl:ud.lvl};return true}
  return false}

// ---------------------------------------------------------------- the thermal scanner: warm things glow through walls
function syncScanner(){let i=0;const put=(x,y,z,s)=>{if(i>=SCAN.length)return;const sp=SCAN[i++];sp.visible=true;sp.position.set(x,y,z);sp.scale.set(s,s*1.6,1)};
  if(ME.scan&&S){const near=(x,z)=>Math.hypot(x-ME.x,z-ME.z)<15;
    for(const m of S.mons){if(!near(m.x,m.z))continue;
      if(m.ty===1)put(m.x,1.1,m.z,1.6);else if(m.ty===3)put(m.x,m.y+(m.k===2?-.3:.4),m.z,1);else if(m.ty===0)put(m.x,m.y+.4,m.z,.7);else if(m.ty===11)put(m.x,.9,m.z,.9)}
    for(const b of S.boxes)if(b.m&&(b.st===0||b.st===3)){const w=boxWorld(b);if(near(w.x,w.z))put(w.x,w.y+.3,w.z,.7)}
    for(const p of S.parcels||[])if(p.m&&near(p.x,CONV.z))put(p.x,CONV.y+.2,CONV.z,.6);
    for(const p of Object.values(S.players))if(p.id!==NET.myId&&!p.dead&&near(p.x,p.z))put(p.x,1.1,p.z,1.2);
    if(S.fork&&S.fork.pass&&near(S.fork.x,S.fork.z))put(PASS3D.position.x,PASS3D.position.y+.5,PASS3D.position.z,.9)}
  for(;i<SCAN.length;i++)SCAN[i].visible=false}

// ---------------------------------------------------------------- monsters added later
function makeMonster2(m){if(m.ty===4)return makeManager();if(m.ty===5)return makeShrink();if(m.ty===6)return makeFrost();if(m.ty===12)return makeMoth();
  if(m.ty===7){const g=makeDriver();const others=Object.values(S.players).filter(p=>p.id!==NET.myId);
    // in a crew it wears one of your crewmates' names
    if(others.length){const o=others[m.k%others.length],tag=makeTag(o.name,o.col||'#ccc');tag.position.y=2.1;g.add(tag)}return g}
  return null}
function coldify(g){g.traverse(o=>{if(o.isMesh&&o.material===MAT.lurkSkin)o.material=MAT.coldSkin})}
function loopFor(m){return m.ty===5?['crinkle',1.2]:m.ty===6?['ice',1]:m.ty===12?['flutter',.6]:null}
function animMonster2(v,dt,time){const u=v.g.userData,t=time+v.ph,a=v.a;
  if(v.ty===4){const mv=a===2||a===4,sp=a===4?7:4.2;const p0=v.gp||0;v.gp=p0+(mv?dt*sp:0);
    u.legs.forEach((l,i)=>l.rotation.x=mv?Math.sin(v.gp+i*Math.PI)*.4:0);
    u.arms[0].rotation.x=damp(u.arms[0].rotation.x,a===3?-1.1+Math.sin(t*14)*.15:-.2,8,dt);u.arms[1].rotation.x=damp(u.arms[1].rotation.x,a===4?-.2:-1.35,6,dt);
    u.clip.position.y=damp(u.clip.position.y,a===4?.35:1.05,5,dt);u.clip.rotation.x=damp(u.clip.rotation.x,a===4?1.3:0,5,dt);
    u.head.rotation.z=a===4?Math.sin(t*9)*.08+.25:0;
    if(mv&&Math.floor(p0/Math.PI)!==Math.floor(v.gp/Math.PI)&&Math.hypot(v.g.position.x-ME.x,v.g.position.z-ME.z)<24)SFX.heel({x:v.g.position.x,y:.05,z:v.g.position.z})}
  else if(v.ty===5){const mv=a===2;v.gp=(v.gp||0)+(mv?dt*3:0);u.legs.forEach((l,i)=>l.rotation.x=mv?Math.sin(v.gp+i*Math.PI)*.18:0);
    u.torso.rotation.z=mv?Math.sin(v.gp)*.12:Math.sin(t*.3)*.02;u.head.rotation.x=mv?.3:.15;u.head.rotation.z=mv?Math.sin(t*2.3)*.3:0}
  else if(v.ty===6){const mv=a===2;v.gp=(v.gp||0)+(mv?dt*2.4:0);u.legs.forEach((l,i)=>l.rotation.x=mv?Math.sin(v.gp+i*Math.PI)*.3:l.rotation.x);
    // when still they're frozen mid-reach, heads bowed; moving, both arms come up
    u.arms.forEach((s,i)=>s.rotation.x=damp(s.rotation.x,mv?-1.3:(i?-.35:-1.05),mv?3:.5,dt));u.head.rotation.x=damp(u.head.rotation.x,mv?-.1:.6,mv?4:.4,dt);u.torso.rotation.x=damp(u.torso.rotation.x,mv?.1:.18,2,dt)}
  else if(v.ty===7){const mv=a===2;v.gp=(v.gp||0)+(mv?dt*5:0);u.legs[0].rotation.x=mv?Math.sin(v.gp)*.5:0;u.legs[1].rotation.x=mv?-Math.sin(v.gp)*.5:0;
    u.arms[0].rotation.x=mv?-Math.sin(v.gp)*.4:0;u.arms[1].rotation.x=a===1?-.2:-.9;u.torch.rotation.x=.25;u.beam.visible=true;v.g.rotation.y+=Math.PI*0;
    u.head.rotation.z=.85+(a===1?Math.sin(t*20)*.1:0)}
  else if(v.ty===12){u.wings.forEach(w=>w.w.rotation.z=w.s*Math.sin(t*22)*.9);u.body.rotation.x=Math.sin(t*3)*.2}}
function fearOf(v,d){if(v.ty===4)return v.a===4?clamp(1-d/9,0,1)*1.2:clamp(1-d/7,0,1)*.35;if(v.ty===5)return v.a===2?clamp(1-d/9,0,1)*.8:0;
  if(v.ty===6)return clamp(1-d/6,0,1)*(v.a===2?.9:.3);if(v.ty===7)return clamp(1-d/8,0,1)*.8;if(v.ty===12)return clamp(1-d/5,0,1)*.25;return null}

// ---------------------------------------------------------------- jumpscares for the new ones
function makeScare2(ty){return ty===4?makeManager():ty===5?makeShrink():ty===6?makeFrost():ty===7?makeDriver():ty===9?makeGiant():ty===10?makeRoofThing():ty===11?makePassenger():null}
function updScare2(s,k,lunge){const g=s.g,u=g.userData;
  if(s.ty===4){g.position.set(rand(-.01,.01),-2.36,lerp(-1.9,-.78,lunge(.18)));g.rotation.y=Math.PI*0;u.clip.position.y=.3;u.clip.rotation.x=1.35;u.head.rotation.set(-.2,0,Math.sin(k*17)*.05+.15);u.arms.forEach(a=>{a.rotation.x=-1.6;a.rotation.z=0})}
  else if(s.ty===5){g.position.set(rand(-.02,.02),-1.9,lerp(-1.4,-.6,lunge(.2)));u.head.rotation.set(-.15,0,Math.sin(k*25)*.2);u.torso.rotation.x=.25}
  else if(s.ty===6){g.position.set(rand(-.02,.02),-1.84,lerp(-1.5,-.62,lunge(.16)));u.arms.forEach((a,i)=>{a.rotation.x=-1.9;a.rotation.z=(i?-1:1)*.3});u.head.rotation.set(-.25,0,0)}
  else if(s.ty===7){g.position.set(rand(-.02,.02),-1.66,lerp(-1.4,-.58,lunge(.16)));g.rotation.y=Math.PI;u.head.rotation.set(-.2,0,.85+Math.sin(k*30)*.15);u.arms.forEach(a=>a.rotation.x=-1.7);u.beam.visible=false;u.tag.visible=false}
  else if(s.ty===9){g.position.set(0,lerp(-14.8,-13.75,lunge(.5)),-1.5);u.arms[0].rotation.x=lerp(0,-1.1,lunge(.6))}
  else if(s.ty===10){g.position.set(rand(-.01,.01),lerp(1.2,.12,lunge(.14)),-.5);g.rotation.set(0,0,Math.PI);u.arms.forEach((a,i)=>a.rotation.z=(i?-1:1)*.8)}
  else if(s.ty===11){g.position.set(rand(-.01,.01),-.95,lerp(-1.2,-.5,lunge(.12)));g.rotation.y=Math.PI;u.head.rotation.x=-.35;u.torso.rotation.x=-.1}}

// ---------------------------------------------------------------- events
function onEvent2(e){const me=NET.myId,P=(x,z,y=1)=>({x,y,z});
  switch(e.e){
  case 'bought':SFX.buy();if(e.p!==me)toast(`${e.n} bought ${(ADDS[e.k]||SHOP[e.k]).name.toLowerCase()}.`,3);if(ADDS[e.k])renderShop(true);break;
  case 'stuck':toast(`Bay ${BAYS[e.b].name}'s door jammed open. Don't look out at the yard.`,4.5);break;
  case 'slam':SFX.slam(P(e.x,e.z,2));break;
  case 'item':if(e.p===me){if(e.k==='batt'){ME.bat=100;SFX.battery();toast('Fresh battery.',2)}else if(e.k==='drink'){ME.drinkT=20;ME.stam=100;ME.exh=false;SFX.drink()}}break;
  case 'flare':SFX.flare(P(e.x,e.z,.2));break;
  case 'strobe':if(e.p!==me){SFX.strobe();if(Math.hypot(e.x-ME.x,e.z-ME.z)<12)ME.flash=Math.max(ME.flash,.4)}break;
  case 'airhorn':SFX.airhorn(P(e.x,e.z,1.5));break;
  case 'squeal':SFX.squeal(P(e.x,e.z,e.y));break;
  case 'cut':SFX.cut(P(e.x,e.z,e.y));break;
  case 'mouth':SFX.chomp(P(e.x,e.z,e.y));if(e.p===me){ME.shake=Math.max(ME.shake,.6);ME.flash=Math.max(ME.flash,.3);toast('That wasn\'t a shelf.',3)}break;
  case 'hands':SFX.hands(P(CONV.bx,e.z,1));if(e.p===me){ME.shake=Math.max(ME.shake,.7);ME.vx+=(CONV.bx-ME.x)*2;ME.vz+=(e.z-ME.z)*2;toast('Something grabbed you from the bin.',3)}break;
  case 'mothHit':SFX.mothHit(P(e.x,e.z,e.y));if(e.p===me){ME.shake=Math.max(ME.shake,.3);ME.flick=0}break;
  case 'smashBulb':SFX.smashBulb(P(e.x,e.z,5));break;
  case 'passGone':SFX.vanish(P(e.x,e.z,1));break;
  case 'vanish':SFX.vanish(P(e.x,e.z,e.y||1));break;
  case 'writeup':SFX.writeup(evPos(e)||P(ME.x,ME.z));if(e.p===me)toast(e.n>=2?'The night manager writes you up again. Keep busy. Don\'t let it happen a third time.':'The night manager writes you up for standing around. That\'s $10 off your pay.',5,'radio');break;
  case 'mgrFinal':if(e.p===me){toast('He lowers the clipboard. Don\'t stop moving.',5,'radio');ME.shake=Math.max(ME.shake,.4)}break;
  case 'boom':SFX.boom(P(e.x,e.z,0));ME.shake=Math.max(ME.shake,.25);break;
  case 'roof':SFX.roofStep(P(e.x,e.z,2.8));break;
  case 'stall':SFX.thunk(P(ME.x,ME.z,2));if(AU.ready&&ADDV.lift)ADDV.lift.set(0,.1);if(Math.abs(ME.x-(e.lvl===0?-28.7:71.3))<3)toast('The elevator jerks to a stop. Something is on the roof. Shine your flashlight up at the hatch!',6,'radio');break;
  case 'unstall':SFX.thunk(P(ME.x,ME.z,2));break;
  case 'elevGo':SFX.thunk(P(e.lvl===0?-28.7:71.3,e.lvl===0?-9.3:0,1));break;
  case 'ding':SFX.ding(P(e.lvl===0?-28.7:71.3,e.lvl===0?-9.3:0,2.4));break;
  case 'tp':if(e.p===me){ME.x=e.x;ME.z=e.z;ME.vx=ME.vz=0}break;
  case 'coldDoor':SFX.thunk(P((COLD.dx0+COLD.dx1)/2,COLD.z1,1));break;
  case 'lever':SFX.lever(P(e.x,e.z,1.2));break;
  case 'jam':SFX.deny();toast('The conveyor jammed. Hold E on the red button by the bins.',4);break;
  case 'unjam':SFX.thunk(P(CONV.jam.x,CONV.jam.z,1));break;
  case 'sorted':SFX.sorted(e.ok,P(CONV.bx,CONV.bins[e.b],1));break;
  case 'pwait':SFX.deny();if(Math.hypot(ME.x-CONV.lever.x,ME.z-CONV.lever.z)<30)toast(`A ${PARCEL_NAMES[e.c]} parcel is waiting at the end of the belt. Set the lever to ${PARCEL_NAMES[e.c]}.`,4);break;
  case 'ptw':{const v=PV.get(e.id);if(v){v.tw=.6;SFX.scratch({x:v.g.position.x,y:1.1,z:CONV.z})}break}
  case 'canUp':if(e.p===me)SFX.pick(P(FUELR.x,FUELR.z,.8));break;
  case 'refuel':SFX.refuel(P(e.x,e.z,.8));if(e.on)toast('The generator coughs back to life. The lights come on.',3);break;
  case 'genOut':SFX.sputter(P(GEN.x,GEN.z,1));SFX.powerDown();toast('The generator ran dry. The lights are out until someone refuels it.',5,'radio');break;
  case 'outage':SFX.powerDown();big('POWER OUTAGE',e.gen?'The generator kicks in. Keep it fuelled until morning.':'The mains are dead until morning. The charger barely works.',5);
    if(!e.gen&&!owned('gen'))setTimeout(()=>GAME.on&&toast('A generator would have kept the lights on. It can be bought between nights.',5),5500);break;
  case 'forkIn':if(e.p===me){ME.yaw=S.fork.ry+Math.PI;ME.pitch=-.1;ME.fv=0;toast('W/S drive, A/D steer. E lifts or sets down a pallet, Q gets out.',4)}break;
  case 'forkOut':break;
  case 'pa2':SFX.pa(e.fake);toast(`Loudspeaker: "Priority parcel ${e.n}. Double pay."`,6,e.fake?'radio fake':'radio');break;
  case 'bulbOn':SFX.bulb({x:LAMPS[e.i].x,y:5,z:LAMPS[e.i].z});toast('The light flickers on and stays on.',2.5);break;
  case 'skitter':SFX.skitter(P(e.x,e.z,e.y));break;
  }}

// ---------------------------------------------------------------- HUD bits
function hotbarHTML(me){if(!me||!me.inv)return'';const items=[];
  for(const [code,k] of Object.entries(ITEM_KEYS)){const n=k==='cutter'||k==='scanner'?(me.up[k]?'':0):me.inv[k]||0;if(n===0)continue;items.push(`<span class="hb"><kbd>${code.slice(5)}</kbd>${SHOP[k].name.replace('Spare ','').replace('Thermal ','')}${n?` ×${n}`:''}</span>`)}
  if(me.up.red)items.push(`<span class="hb${ME.red?' on':''}"><kbd>H</kbd>Headlamp</span>`);return items.join('')}
function promptFor(t,me){switch(t.kind){
  case 'fork':return owned('fork')?'<kbd>E</kbd> Drive the forklift':'Broken forklift';
  case 'pallet':return'Pallet load: forklift only';
  case 'parcel':return'<kbd>Q</kbd> Kick off the belt'+(me.up&&me.up.cutter?' &nbsp; <kbd>3</kbd> Cut':'');
  case 'cold':return S.cold&&S.cold.open?'<kbd>E</kbd> Close the freezer':'<kbd>E</kbd> Open the freezer';
  case 'lever':return`<kbd>E</kbd> Switch bin (now <b style="color:${PARCEL_CSS[S.conv.sel]}">${PARCEL_NAMES[S.conv.sel]}</b>)`;
  case 'jam':return S.conv&&S.conv.jam?'Hold <kbd>E</kbd> Clear the jam':'Jam clear button';
  case 'elevIn':return S.elev.st!=='idle'?'Elevator moving&hellip;':S.elev.lvl===t.lvl?`<kbd>E</kbd> ${t.lvl===0?'Go down to the basement':'Go up to the warehouse'}`:'';
  case 'elevCall':return S.elev.st!=='idle'?'Elevator moving&hellip;':S.elev.lvl===t.lvl?'Elevator is here':'<kbd>E</kbd> Call the elevator';
  case 'gen':return me.can?'<kbd>E</kbd> Refuel the generator':`Generator: ${Math.round(S.gen.fuel)}% fuel`;
  case 'fuelrack':return me.can?'':'<kbd>E</kbd> Take a jerry can';
  case 'fslot':return t.ok?'<kbd>E</kbd> Set the pallet on the shelf':'Shelf is full';
  case 'fpal':return'<kbd>E</kbd> Lift the pallet';}return null}
// stuck in the elevator: shown in the middle of the screen, how long the light has been on the hatch and how long before it opens
function hatchNote(){const e=S.elev;if(!e||e.st!=='stall'||!owned('base')||!inCar(ME,e.lvl===0?CAR_UP:CAR_DN))return'';const k=clamp((e.hl||0)/ELEV_HOLD,0,1);
  return`<span class="warnline">SOMETHING IS ON THE ROOF &middot; ${Math.max(0,Math.ceil(ELEV_WAIT-(e.ht||0)))}s</span><br>${ME.lightOn()?'Shine your light up at the hatch':'<kbd>F</kbd> Turn your flashlight on and shine it up at the hatch'} <span class="meter"><i style="width:${Math.round(k*100)}%"></i></span>`}
function statusLines(me){let h='';
  if(mainsDown())h+=`<div class="bay warnline">POWER OUT &middot; charger slowed</div>`;
  if(owned('gen')&&S.gen)h+=`<div class="bay small${S.outage&&S.gen.fuel<25?' warnline':''}">generator ${S.outage?(S.gen.fuel>0?'running':'empty'):'on standby'} &middot; fuel ${Math.round(S.gen.fuel)}%</div>`;
  if(owned('conv')&&S.conv)h+=`<div class="bay small">sorting bin: <b style="color:${PARCEL_CSS[S.conv.sel]}">${PARCEL_NAMES[S.conv.sel]}</b>${S.conv.jam?' &middot; <span class="warn">JAMMED</span>':''}</div>`;
  if(me&&me.wu)h+=`<div class="bay small" style="color:#ff8a70">write-ups tonight: ${me.wu} / 3</div>`;
  return h}
// which way something is, relative to where you're looking, and how far
const ARROWS=['&uarr;','&nearr;','&rarr;','&searr;','&darr;','&swarr;','&larr;','&nwarr;'];
function dirTo(x,z){const dx=x-ME.x,dz=z-ME.z,d=Math.hypot(dx,dz),fx=-Math.sin(ME.yaw),fz=-Math.cos(ME.yaw),rx=Math.cos(ME.yaw),rz=-Math.sin(ME.yaw);
  const a=Math.atan2(dx*rx+dz*rz,dx*fx+dz*fz);return`<b class="arrow">${ARROWS[(Math.round(a/(Math.PI/4))+8)%8]}</b> ${Math.round(d)} m`}
function carryNote(me){if(!me)return'';
  if(me.can)return`Jerry can &middot; generator ${dirTo(GEN.x,GEN.z)}`;
  const b=me.carry>=0?S.boxes.find(x=>x.id===me.carry):null;if(!b)return'';const n=1+(me.stack?me.stack.length:0);
  let s=n>1?`Carrying ${n} boxes`:'';
  if(b.fz)s+=(s?' &middot; ':'')+`<span style="color:#9fd4ff">Frozen: thaws in ${Math.max(0,Math.ceil(b.th||0))}s${inCold(ME)?'':` &middot; freezer ${dirTo((COLD.dx0+COLD.dx1)/2,COLD.z1+.6)}`}</span>`;
  else if(ME.x>60)s+=(s?' &middot; ':'')+`Shelves are upstairs &middot; elevator ${dirTo(CAR_DN.x1,0)}`;
  if(b.pri)s+=(s?' &middot; ':'')+'<span style="color:#ff7a5a">Priority</span>';return s}
// the first night after something is bought, say what it's for and where it is
const ADD_INTRO={fork:'The forklift is parked by the dock, just east of where you start. Some trailers have a pallet of eight boxes inside the door. Lift it with E, set it on any top shelf.',
  cold:'Cold storage is in the north-east corner, under the blue light. Frozen crates (pale blue) go on its shelves within 60 seconds of leaving the trailer.',
  conv:'The sorting conveyor is on the south wall, behind you as you start. Set its lever to the colour of the next parcel to reach the end.',
  base:'The freight elevator is on the west wall, past Bay A. Ten returns wait in the basement for the shelves.',
  gen:'The generator is on the west wall by the office. If the power fails, it keeps the lights and the charger running while it has fuel.',
  bayc:'Bay C is open in the north-west corner. Its refrigerated trucks bring more boxes, and more frozen crates if you have cold storage.'};
function introAdds(){const seen=GAME.seenAdds||(GAME.seenAdds=new Set());const fresh=(S.adds||[]).filter(k=>!seen.has(k));if(!fresh.length)return;
  fresh.forEach((k,i)=>{seen.add(k);setTimeout(()=>GAME.on&&S&&S.phase==='play'&&toast(ADD_INTRO[k],6.5),5200+i*7000)});
  setTimeout(()=>GAME.on&&toast('The THIS WAY board on the dock wall points to everything the crew has bought.',5),5200+fresh.length*7000)}

// ---------------------------------------------------------------- the shop screen
let shopShown=false,shopSig='';
function renderShop(force){if(!S)return;const me=S.players[NET.myId];if(!me)return;
  const sig=JSON.stringify([S.cash,S.adds,me.inv,me.up,S.aidBonus,S.fixed,Math.round(S.shopT||0)]);if(!force&&sig===shopSig)return;shopSig=sig;
  $('shopCash').textContent=`$${Math.round(S.cash||0)}`;$('shopNight').textContent=`Night ${S.night} done. Night ${S.night+1} is next.`;
  const card=(k,it,ownedNow,extra='')=>{const can=!ownedNow&&S.cash>=it.price;return`<div class="sc${ownedNow?' own':''}"><div class="sh"><b>${it.name}</b><span>${ownedNow?'OWNED':'$'+it.price}</span></div><p>${it.desc}</p>${extra}${ownedNow?'':`<button data-buy="${k}" ${can?'':'disabled'}>Buy</button>`}</div>`};
  $('shopAdds').innerHTML=Object.entries(ADDS).map(([k,it])=>card(k,it,owned(k),`<div class="tag">+${it.q} boxes to quota · +${it.time} s of shift</div>`)).join('');
  $('shopItems').innerHTML=Object.entries(SHOP).map(([k,it])=>{const have=it.once?!!me.up[k]:k==='aid'?(S.aidBonus||0):(me.inv[k]||0);
    return card(k,it,it.once&&have,!it.once&&have?`<div class="tag">you have ${have}${it.key?` · key ${it.key}`:''}</div>`:it.key&&!it.once?`<div class="tag">key ${it.key}</div>`:it.key?`<div class="tag">key ${it.key}</div>`:'')}).join('');
  const host=NET.mode!=='client';$('bShopGo').classList.toggle('hide',!host);
  $('shopWait').textContent=host?(NET.mode==='host'?`Starts by itself in ${Math.max(0,Math.round(S.shopT||0))} s.`:''):`Waiting for the host to start night ${S.night+1} (or ${Math.max(0,Math.round(S.shopT||0))} s).`}
function shopTick(){if(!GAME.on||!S)return;const want=S.phase==='shop'&&!GAME.overShown;
  if(want&&!shopShown){shopShown=true;if(document.pointerLockElement)document.exitPointerLock();show('shop');$('hud').classList.add('hide');renderShop(true)}
  else if(!want&&shopShown){shopShown=false;hideScreens();$('hud').classList.remove('hide');if(!locked())$('lockmsg').classList.remove('hide')}
  if(shopShown)renderShop(false)}
function bindShop(){$('shop').addEventListener('click',e=>{const b=e.target.closest('[data-buy]');if(b){auInit();doAct({a:'buy',k:b.dataset.buy});return}});
  $('bShopGo').onclick=()=>{auInit();doAct({a:'start'});reqLock()}}
