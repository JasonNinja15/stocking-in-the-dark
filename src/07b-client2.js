// ===================================================================== client: additions, later-night monsters, items, the shop
let FORK3D=null,GIANT=null,PASS3D=null;const PV=new Map(),PALV=new Map(),FLV=new Map();
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
  VM.can=makeCan();VM.can.position.set(-.16,-.36,-.55);VM.can.visible=false;VM.g.add(VM.can);VM.can.traverse(o=>{if(o.isMesh){o.castShadow=false;o.renderOrder=5}});buildRoofVisuals()}
const shown=o=>{for(let p=o.parent;p;p=p.parent)if(!p.visible)return false;return true};

// ---------------------------------------------------------------- per-frame sync of the additions' moving parts
function syncExtras(dt,time){if(!S)return;const t=time;
  // the shredder's rollers turn while it eats something; its lamp glows red while the thing in the corner is up
  if(ADDV.shredRolls){ADDV.shredSpin=(ADDV.shredSpin||0)-dt;const sp=ADDV.shredSpin>0?16:0;ADDV.shredRolls.forEach((r,i)=>r.rotation.x+=(i?-1:1)*sp*dt);
    const up=S.mons.some(m=>m.ty===14&&m.a!==0);ADDV.shredLamp.material.color.set(up?(Math.sin(t*10)>0?0xff2010:0x300404):0x3a0a0a)}
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
  // (someone else driving it: glide between snapshots instead of jumping to each one)
  const f=S.fork;if(f&&FORK3D){const mine=f.drv===NET.myId||NET.mode!=='client',P=FORK3D.position,far=Math.hypot(P.x-f.x,P.z-f.z)>4;
    if(mine||far){P.set(f.x,0,f.z);FORK3D.rotation.y=f.ry}else{P.x=damp(P.x,f.x,12,dt);P.z=damp(P.z,f.z,12,dt);FORK3D.rotation.y=angLerp(FORK3D.rotation.y,f.ry,1-Math.exp(-12*dt))}
    const fx=P.x,fz=P.z,fry=FORK3D.rotation.y;const u=FORK3D.userData;u.lift.position.y=damp(u.lift.position.y,.08+(f.pal>=0?2.62:f.lift||0),3,dt);
    u.beacon.material.color.set(f.drv&&Math.sin(t*9)>0?0xffa020:0x3a2408);
    PASS3D.visible=!!f.pass;if(f.pass){const tip={x:fx+Math.sin(fry)*1.35,z:fz+Math.cos(fry)*1.35};PASS3D.position.set(tip.x,u.lift.position.y+.06,tip.z);PASS3D.rotation.y=fry+Math.PI}
    if(AU.ready){if(!FORK3D.userData.eng)FORK3D.userData.eng=loop('engine',{x:f.x,y:1,z:f.z},.55);const sp=Math.hypot(f.x-(FORK3D.userData.px??f.x),f.z-(FORK3D.userData.pz??f.z))/Math.max(dt,1e-3);
      FORK3D.userData.px=f.x;FORK3D.userData.pz=f.z;FORK3D.userData.eng.pos({x:f.x,y:1,z:f.z});FORK3D.userData.eng.set(f.drv?.35+Math.min(1,sp/4)*.6:0,.2)}}
  // pallets
  const pl=new Set();PALPICK.length=0;
  for(const p of S.pallets||[]){pl.add(p.id);let g=PALV.get(p.id);if(!g){g=makePallet();g.traverse(o=>{if(o.isMesh)o.userData={kind:'pallet',id:p.id}});ROOT.add(g);PALV.set(p.id,g)}
    if(p.st===0){const tr=S.trucks[p.bay];g.visible=tr.st!==0;g.position.set(BAYS[p.bay].x+p.lx,0,tr.z+p.lz);g.rotation.y=0}
    else if(p.st===1&&f){g.visible=true;const u=FORK3D.userData,P=FORK3D.position,ry=FORK3D.rotation.y;g.position.set(P.x+Math.sin(ry)*1.45,u.lift.position.y+.02,P.z+Math.cos(ry)*1.45);g.rotation.y=ry}
    else if(p.st===2){const s=SLOTS[p.s];g.visible=true;if(s)g.position.set(s.x,s.y,s.z);g.rotation.y=0}
    else{g.visible=true;g.position.set(p.x,p.y||0,p.z);g.rotation.y=p.ry}
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
  // the thing in the yard: each time it steps closer it stoops lower to see in, and at the last step its fingers
  // come round the top of the door frame
  if(S.yard){const y=S.yard,bx=BAYS[y.bay].x,z=WH.z0-YARD_D[y.stage],u=GIANT.userData,v=u.v||(u.v={walk:0,st:0});GIANT.visible=camera.position.x>-100;
    if(!GIANT.position.z){GIANT.position.z=z}const oz=GIANT.position.z;GIANT.position.set(bx,-1.25,damp(oz,z+(y.hit?4.5*clamp(y.ht/.5,0,1):0),y.hit?6:1.2,dt)); /* reaching in, it lunges up to the doorway */const sp=Math.abs(GIANT.position.z-oz)/Math.max(dt,1e-3);
    v.walk+=sp*dt*.55;v.st=damp(v.st,Math.min(1,sp/1.2),3,dt);v.cr=damp(v.cr||0,[0,.15,.4,1][y.stage],1.5,dt);v.ln=damp(v.ln||0,[0,.1,.35,1.25][y.stage],1.5,dt);GIANT.rotation.y=0;
    const grip=y.stage===3?_yv.set(bx+DOOR_HW-.25,DOOR_H+.15,WH.z0-.35):null;
    // the fourth look: its free hand comes in low through the doorway, straight at whoever was looking
    let reach=null;const vt=y.hit&&S.players[y.hit];
    if(vt){const a=clamp(y.ht/.9,0,1),e=a*a*(3-2*a),door=_pv.set(bx,1.6,WH.z0+.4),tgt=y.hit===NET.myId?_pw.copy(camera.position):_pw.set(vt.x,1.2,vt.z);
      reach=e<.5?GIANT.localToWorld(_rv.set(-2.1,.9,1.6)).lerp(door,e*2):door.lerp(tgt,(e-.5)*2)}
    poseGiant(GIANT,{walk:v.walk,stride:v.st,crouch:v.cr,lean:v.ln+(vt?.15:0),look:vt&&y.hit!==NET.myId?_rm.set(vt.x,1.6,vt.z):camera.position,hands:[reach,grip],curl:[vt?.6:0,grip?.75:0],t})}
  else{GIANT.visible=false;GIANT.position.z=0}
  syncAmr(dt,t);syncRoof(dt,t)}
const reach0=g=>g.st==='reach'||g.st==='retract'||g.st==='eat',_pv=new THREE.Vector3(),_pw=new THREE.Vector3();
const _yv=new THREE.Vector3(),_rv=new THREE.Vector3(),_rm=new THREE.Vector3(),_rh=new THREE.Vector3();

// ---------------------------------------------------------------- the warehouse robots
const AMRV={};
function syncAmr(dt,t){const live=new Set();
  for(const r of S.amr||[]){live.add(r.k);let v=AMRV[r.k];if(!v){v=AMRV[r.k]={g:r.k==='s'?makeAmrS():makeAmrL(),x:r.x,z:r.z,h:0,snd:null};ROOT.add(v.g)}
    const A=AMR[r.k],g=v.g,ox=v.x,oz=v.z;v.x=damp(v.x,r.x,8,dt);v.z=damp(v.z,r.z,8,dt);g.visible=true;g.position.set(v.x,0,v.z);g.rotation.y=angLerp(g.rotation.y,r.ry,1-Math.exp(-10*dt));
    const moving=Math.hypot(v.x-ox,v.z-oz)/Math.max(dt,1e-3)>.1,s=SLOTS[r.slot],k=r.st==='lift'?clamp(r.t/AMR_LIFT,0,1):0;
    // the deck: down while driving; lifting, it rises to the shelf (the small one's box then slides across onto it)
    const top=r.k==='s'&&s?s.y:(r.k==='l'&&s?s.y:A.deck);v.h=damp(v.h,r.st==='lift'?A.deck+(top-A.deck)*Math.min(1,k/.6):A.deck,6,dt);amrLift(g,v.h);
    if(r.k==='s'&&r.load>=0){const m=BM.get(r.load);if(m){m.visible=true;let x=v.x,z=v.z;if(s&&k>.6){const e=(k-.6)/.4;x=lerp(v.x,s.x,e);z=lerp(v.z,s.z,e)}m.position.set(x,v.h,z);m.rotation.set(0,g.rotation.y,0)}}
    // the pallet on the big one rides its (smoothed) table rather than jumping with each snapshot
    if(r.k==='l'&&r.load>=0){const pg=PALV.get(r.load);if(pg){let x=v.x,z=v.z,ry=g.rotation.y;if(s&&k>.6){const e=(k-.6)/.4;x=lerp(v.x,s.x,e);z=lerp(v.z,s.z,e);ry=lerp(ry,0,e)}pg.position.set(x,v.h,z);pg.rotation.y=ry}}
    g.userData.band.color.setHSL(.57,1,r.st==='home'?.35:.45+.15*Math.sin(t*6));if(g.userData.beacon)g.userData.beacon.material.color.set(moving&&Math.sin(t*9)>0?0xffb020:0x3a2408);
    if(AU.ready){if(!v.snd)v.snd=loop('lift',{x:v.x,y:.4,z:v.z},.35);if(v.snd){v.snd.pos({x:v.x,y:.4,z:v.z});v.snd.set(moving||r.st==='lift'?.5:0,.2)}}}
  for(const k in AMRV)if(!live.has(k)){AMRV[k].g.visible=false;AMRV[k].snd&&AMRV[k].snd.set(0,.2)}}

// ---------------------------------------------------------------- up on the roof: the storm, and what comes out of it
let ROOFG=null,SNOW=null,WIND=null;
function buildRoofVisuals(){ROOFG=makeGiant();ROOFG.visible=false;ROOT.add(ROOFG);
  // snow that wraps around the camera, falling and blowing sideways; only flakes in your beam really show
  const N=3200,a=new Float32Array(N*3),sd=new Float32Array(N);for(let i=0;i<N;i++){a[i*3]=rand(-18,18);a[i*3+1]=rand(-8,8);a[i*3+2]=rand(-18,18);sd[i]=Math.random()}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(a,3));g.setAttribute('seed',new THREE.BufferAttribute(sd,1));
  SNOW=new THREE.Points(g,new THREE.ShaderMaterial({uniforms:{t:{value:0},cam:{value:new THREE.Vector3()},fw:{value:new THREE.Vector3(0,0,-1)},lit:{value:1}},transparent:true,depthWrite:false,
    vertexShader:`uniform float t,lit;uniform vec3 cam,fw;attribute float seed;varying float vA;
      void main(){vec3 p=position;p.y-=t*(1.5+seed*1.3);p.x+=t*(4.+seed*2.5)+sin(t*1.3+seed*40.)*.7;p.z+=t*1.4+sin(t*.8+seed*23.)*.9;
        vec3 r=mod(p-cam+vec3(18.,8.,18.),vec3(36.,16.,36.))-vec3(18.,8.,18.);vec3 w=cam+r;vec4 mv=viewMatrix*vec4(w,1.);float d=max(-mv.z,.05);
        float beam=smoothstep(.9,.975,dot(normalize(r),fw))*lit*exp(-d*.07);vA=clamp(beam*1.2+.1*exp(-d*.3),0.,1.);
        gl_PointSize=clamp((1.5+seed*1.6)*14./d,1.,9.);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`varying float vA;void main(){vec2 c=gl_PointCoord-.5;float r=dot(c,c);if(r>.25)discard;gl_FragColor=vec4(.86,.9,1.,vA*(1.-r*4.));}`}));
  SNOW.frustumCulled=false;SNOW.visible=false;scene.add(SNOW)}
const FOG0={c:new THREE.Color(0x030305),d:.052},FOG_ROOF={c:new THREE.Color(0x07090d),d:.06};
function syncRoof(dt,t){const cp=camera.position,up=cp.x<-100&&S.phase==='play',me=S.players[NET.myId];chillHint(me); // (by the camera, so spectating someone up there shows the storm too)
  // the storm: a lighter, bluer murk, snow in the air, wind, frost creeping in at the edges of your sight
  scene.fog.color.lerp(up?FOG_ROOF.c:FOG0.c,1-Math.exp(-6*dt));scene.fog.density=damp(scene.fog.density,up?FOG_ROOF.d:FOG0.d,6,dt);AMB.intensity=damp(AMB.intensity,up?.07:.32,6,dt);
  const inRm=up&&inRoofRoom(cp); // indoors up there: out of the snow and most of the wind
  if(SNOW){SNOW.visible=up&&!inRm;if(up){const u=SNOW.material.uniforms;u.t.value=t;u.cam.value.copy(camera.position);camera.getWorldDirection(u.fw.value);u.lit.value=ME.lightOn()?1:.15}}
  if(AU.ready){if(!WIND)WIND=loop('wind',null,1);if(WIND){WIND.P.panningModel='equalpower';WIND.P.refDistance=1e4;WIND.set(up?(inRm?.18:.55):0,up?.4:.25)}}
  const fr=$('frost');if(fr){ME.cold=damp(ME.cold||0,(up&&!inRm)||chilled()?1:0,up||chilled()?.25:1.5,dt);fr.style.opacity=(ME.cold*.85).toFixed(3)}
  if(ROOFV.beacon)ROOFV.beacon.material.color.set(Math.sin(t*2.2)>.6?0xff2a1a:0x2a0503);
  if(ROOFV.lamp)ROOFV.lamp.intensity=up?(Math.random()<.02?6:30):0;
  if(ROOFV.ventLamp)ROOFV.ventLamp.material.color.set(!S.chill?0x2aff6a:Math.sin(t*(S.chill.st==='cold'?12:5))>0?0x5ab8ff:0x0a1a30);
  if(ROOFV.lid){ROOFV.lid.visible=!S.stash;ROOFV.lid.rotation.x=-1.9}
  // the thing itself
  // (only drawn for someone up there, or watching someone up there)
  const g=S.rg;ROOFG.visible=!!g&&camera.position.x<-100;if(!g){ROOFG.userData.v=null;if(ROOFG.userData.breath)ROOFG.userData.breath.set(0,.5);return}
  const u=ROOFG.userData;let v=u.v;if(!v)v=u.v={x:g.x,z:g.z,walk:0,st:0,k:0,hx:g.hx,hz:g.hz,hi:1};
  const ox=v.x,oz=v.z;v.x=damp(v.x,g.x,4,dt);v.z=damp(v.z,g.z,4,dt);const sp=Math.hypot(v.x-ox,v.z-oz)/Math.max(dt,1e-3);
  v.walk+=sp*dt*.5;v.st=damp(v.st,Math.min(1,sp/1.4),3,dt);v.k=damp(v.k,g.k,5,dt);v.br=damp(v.br||0,g.b&&reach0(g)?1:0,1.4,dt);v.hx=damp(v.hx,g.hx,6,dt);v.hz=damp(v.hz,g.hz,6,dt);
  // braced, it steps right up to the wall
  ROOFG.position.set(v.x+Math.sin(g.ry)*v.br*1.6,ROOF.gy,v.z+Math.cos(g.ry)*v.br*1.6);ROOFG.rotation.y=angLerp(ROOFG.rotation.y,g.ry,1-Math.exp(-3*dt));
  const tg=S.players[g.tg],eat=g.st==='eat',reach=eat||g.st==='reach'||g.st==='retract';
  // (while eating, its head holds still on its neck: the camera is placed by its face, so it mustn't chase the camera)
  const look=eat?null:tg&&onRoof(tg)?(g.tg===NET.myId?camera.position:_rv.set(tg.x,1.5,tg.z)):camera.position;
  let hand=null,curl=0,jaw=0;
  if(reach){_rh.set(v.hx,.4,v.hz);ROOFG.updateMatrixWorld(true);const loc=ROOFG.worldToLocal(_rm.copy(_rh));if(!eat)v.hi=loc.x>=0?1:0;
    const e=_rm.set(clamp(v.x,ROOF.x0+.3,ROOF.x1-.3),2.6,clamp(v.z,ROOF.z0+.3,ROOF.z1-.3)),k=v.k;
    // up over the parapet first, then down across the roof towards you
    if(k<.35){const rest=ROOFG.localToWorld(_yv.set(ROOFG.userData.arms[v.hi].s*2.1,.9,1.6)),a=clamp(k/.35,0,1);hand=rest.lerp(e,a*a*(3-2*a))}else hand=e.lerp(_rh,(k-.35)/.65);
    curl=g.k>=1?.2:0;
    // eating: up in front of its face with the elbow swung out of the way, the jaw drops open, the hand goes in
    // through the teeth, and the mouth shuts
    if(eat){const T=g.t,H=ROOFG.userData.head,a=clamp(T/2.4,0,1);hand=_rh.lerp(H.localToWorld(_yv.set(0,-.5,3.2)),a*a*(3-2*a));
      if(T>RG_BITE-1.1){const b=clamp((T-RG_BITE+1.1)/1.1,0,1);hand.lerp(H.localToWorld(_pv.set(0,-.15,.3)),b*b*(3-2*b))}
      curl=.5;jaw=T<1.6?0:T<RG_BITE?Math.min(1,(T-1.6)/1.3):Math.max(0,1-(T-RG_BITE)/.15);
      if(T>1.6&&!v.jawS){v.jawS=1;SFX.gjaw(H.getWorldPosition(_pw))}}
    _rh.copy(hand);hand=_rh}
  if(!eat)v.jawS=0;
  // from inside its fist your view of its face would be all forearm and fingers, so you don't see your own hand of it
  ROOFG.userData.arms.forEach((A,i)=>A.el.visible=!(eat&&g.tg===NET.myId&&i===v.hi));
  const hands=[null,null];if(hand)hands[v.hi]=hand;const cl=[0,0];cl[v.hi]=curl;const out=[0,0];if(eat)out[v.hi]=1;
  // reaching far: the other hand comes down flat on the roof beside it and takes its weight, and it leans right over
  if(v.br>.01){const o=1-v.hi,A=ROOFG.userData.arms[o],sx=Math.cos(ROOFG.rotation.y),sz=-Math.sin(ROOFG.rotation.y),fx=Math.sin(ROOFG.rotation.y),fz=Math.cos(ROOFG.rotation.y);
    const px=clamp(v.x+fx*(RG_O+2.2)+sx*A.s*3.2,ROOF.x0+.6,ROOF.x1-.6),pz=clamp(v.z+fz*(RG_O+2.2)+sz*A.s*3.2,ROOF.z0+.6,ROOF.z1-.6);
    const rest=ROOFG.localToWorld(_pv.set(A.s*2.1,.9,1.6));hands[o]=rest.lerp(_pw.set(px,.12,pz),v.br);cl[o]=.35*v.br}
  poseGiant(ROOFG,{walk:v.walk,stride:v.st,lean:Math.min(1,v.k*1.25)+(g.st==='wait'?.15:0)+v.br*.12,crouch:v.k*.35-v.br*.15,jaw,look,hands,curl:cl,out,t});
  // its breathing
  if(AU.ready){const hp=ROOFG.userData.head.getWorldPosition(_pw);if(!u.breath){u.breath=loop('gbreath',hp,1);if(u.breath){u.breath.P.refDistance=9;u.breath.P.rolloffFactor=.5}}
    if(u.breath){u.breath.pos(hp);u.breath.set(ROOFG.visible?.9:0,.5)}}}
// where a held player is: in its fist
function rgHeldAt(id){const g=S.rg;if(!g||g.st!=='eat'||g.tg!==id||!ROOFG||!ROOFG.userData.v)return null;return giantHand(ROOFG,ROOFG.userData.v.hi,_rm)}
// being lifted: the camera rides in its hand, turned to face what it's lifting you to
// (sat out past the fingers, so nothing of the hand is between you and its face), and in the end into its mouth
function rgHeld(dt,me){const h=rgHeldAt(NET.myId);if(!h){ME.eatFade=0;return false}ME.vx=ME.vz=0;ME.fear=1;ME.shake=0;
  const mouth=ROOFG.userData.head.localToWorld(_yv.set(0,-.15,.3));camera.position.copy(h).lerp(mouth,.45);camera.position.y+=.2;camera.lookAt(mouth);
  // the jaw shuts and everything goes black
  if(S.rg.t>RG_BITE-.05&&!ME.eatFade){ME.eatFade=1;const f=$('fade');f.style.transition='opacity .12s';f.style.opacity=1;setTimeout(()=>{f.style.transition='opacity 1.4s';f.style.opacity=0},2200)}
  return true}

// ---------------------------------------------------------------- driving the forklift
function driveUpdate(dt,me){const f=S.fork,busy=!!ME.scare||S.phase!=='play';
  const ax=moveAxes(),th=busy?0:ax[0],st=busy?0:ax[1];
  ME.fv=damp(ME.fv||0,th>0?4.4:th<0?-2:0,th?2:3.5,dt);
  // D steers right, A left (turning right means the heading angle goes down); Settings can invert it
  f.ry-=st*dt*1.5*clamp(Math.abs(ME.fv)/1.2,0,1)*(ME.fv<0?-1:1)*(SET.forkInv?-1:1);
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
  // number keys jump straight to that item on the hotbar; right click uses it
  const k=ITEM_KEYS[code];
  if(k){if(!haveItem(me,k)){SFX.deny();toast(`No ${SHOP[k].name.toLowerCase()}. They're sold between nights.`,2.5);return true}
    if(ME.sel!==k){ME.sel=k;SFX.click()}return true}
  if(code==='UseItem'||code==='Space'){useSel(me);return true}
  // pushing a hand cart: Q lets go, G sets a box down beside it
  if(ME.cart>=0){if(code==='KeyQ'){doAct({a:'cart'});return true}
    if(code==='KeyG'){if(me.carry<0)return true;const fx=-Math.sin(ME.yaw),fz=-Math.cos(ME.yaw),rx=Math.cos(ME.yaw),rz=-Math.sin(ME.yaw);let x=ME.x+rx*.85+fx*.7,z=ME.z+rz*.85+fz*.7;
      if(insideAny(x,z,.2)){x=ME.x-rx*.85+fx*.7;z=ME.z-rz*.85+fz*.7}doAct({a:'drop',x:r2(x),z:r2(z),ry:r2(ME.yaw)});return true}}
  if(ME.driving){
    if(code==='KeyQ'){doAct({a:'fork'});return true}
    if(code==='KeyE'){const t=ME.target;if(t&&t.kind==='fslot'){if(t.ok)doAct({a:'fplace',s:t.s.id});else SFX.deny()}else if(t&&t.kind==='fpal')doAct({a:'fpick'});
      else if(t&&t.kind==='box')doAct({a:'pick',b:t.b.id});else if(t&&t.kind==='slot'){if(t.ok)doAct({a:'place',s:t.s.id});else SFX.deny()}else SFX.deny();return true}
    if(code==='KeyG'){const f=S.fork;if(f.pal>=0)doAct({a:'fdrop'});else if(me.carry>=0)doAct({a:'drop',x:r2(f.x+Math.sin(f.ry)*1.55),z:r2(f.z+Math.cos(f.ry)*1.55),ry:r2(f.ry)});return true}
    return true}
  if(code==='KeyE'){const t=ME.target;if(!t)return false;
    switch(t.kind){
    case 'fork':if(ME.cart>=0)toast('Let go of the cart first.',2.5);else if(!owned('fork')){toast('The forklift is broken. It can be repaired between nights.',3);SFX.locked()}else if(me.carry>=0||me.can)toast('Put down what you\'re carrying first.',2.5);else doAct({a:'fork'});return true;
    case 'cart':{const c=S.carts&&S.carts[t.i];if(!c)return true;if(c.by)toast('Someone else is pushing that cart.',2.5);else if(me.can)toast('Put the jerry can down first.',2.5);else doAct({a:'cart',i:t.i});return true}
    case 'pallet':toast('Far too heavy to lift by hand. That\'s forklift work.',3);SFX.deny();return true;
    case 'parcel':toast('Parcels sort themselves. Set the lever to the next colour.',3);return true;
    case 'cold':doAct({a:'cold'});return true;
    case 'lever':doAct({a:'lever'});return true;
    case 'jam':return true; // held, see localUpdate2
    case 'elevIn':doAct({a:'elevIn',lvl:t.lvl});return true;
    case 'elevCall':doAct({a:'elevCall',lvl:t.lvl});return true;
    case 'gen':if(me.can)doAct({a:'fuel'});else toast('Bring a jerry can from the fuel rack.',2.5);return true;
    case 'fuelrack':if(me.can)toast('You already have a can.',2);else if(me.carry>=0)toast('Your hands are full.',2);else doAct({a:'can'});return true;
    case 'shred':if(me.carry<0)toast('Bring a box to feed it.',2);else doAct({a:'shred'});return true;
    case 'ladder':case 'hatch':if(ME.cart>=0||me.carry>=0||me.can){toast('You need both hands for the ladder.',2.5);SFX.deny()}else doAct({a:'climb'});return true;
    case 'amrPad':if(me.carry<0)toast('Bring a box. The robot takes it to a shelf for you.',2.5);else doAct({a:'amrLoad'});return true;
    case 'stash':doAct({a:'stash'});return true}}
  if(code==='KeyQ'&&ME.target&&ME.target.kind==='parcel'){if(ME.kickCD>0)return true;ME.kickCD=.8;ME.kickA=.35;doAct({a:'kick',pc:ME.target.id});return true}
  return false}
// ---------------------------------------------------------------- the item hotbar: scroll to pick, right click to use
const haveItem=(me,k)=>k==='cutter'||k==='scanner'?!!(me.up&&me.up[k]):!!(me.inv&&me.inv[k]>0);
const heldItems=me=>me?Object.values(ITEM_KEYS).filter(k=>haveItem(me,k)):[];
function curSel(me){const h=heldItems(me);if(!h.includes(ME.sel))ME.sel=h[0]||'';return ME.sel}
function scrollItem(dir){const me=S&&S.players[NET.myId];if(!me||me.dead||S.phase!=='play')return;const h=heldItems(me);if(h.length<2)return;
  const i=h.indexOf(curSel(me));ME.sel=h[(i+dir+h.length)%h.length];SFX.click()}
function useSel(me){const k=curSel(me);if(!k){SFX.deny();toast('No items. They\'re sold between nights.',2.5);return}
  if(k==='scanner')return; // held, see localUpdate2
  if(k==='cutter'){const t=ME.target;if(t&&t.kind==='box')doAct({a:'use',k,b:t.b.id});else if(t&&t.kind==='parcel')doAct({a:'use',k,pc:t.id});
    else{const m=looseMimic();if(m)doAct({a:'use',k,m:m.id});else toast('Look at a box to cut it open.',2)}return}
  if(k==='strobe'){ME.flash=Math.max(ME.flash,.55);SFX.strobe()}
  doAct({a:'use',k})}
// a burst mimic within reach and roughly in front of you
function looseMimic(){let best=null,bd=2.9;const fx=-Math.sin(ME.yaw),fz=-Math.cos(ME.yaw);
  for(const m of S.mons){if(m.ty!==0)continue;const dx=m.x-ME.x,dz=m.z-ME.z,d=Math.hypot(dx,dz);if(d<bd&&(d<1||(dx*fx+dz*fz)/d>.5)){bd=d;best=m}}return best}
// held E on the jam button for a moment clears it
function localUpdate2(dt,me){const t=ME.target;
  if(t&&t.kind==='vent'&&K.KeyE&&S.chill&&!ME.scare){ME.ventT=(ME.ventT||0)+dt;if(ME.ventT>2){ME.ventT=-99;doAct({a:'vent'})}}else if(!K.KeyE||!S.chill)ME.ventT=0;
  if(t&&t.kind==='jam'&&K.KeyE&&S.conv&&S.conv.jam&&!ME.scare){ME.holdT=(ME.holdT||0)+dt;if(ME.holdT>1.2){ME.holdT=-99;doAct({a:'jam'})}}else if(!K.KeyE)ME.holdT=0;
  ME.drinkT=Math.max(0,(ME.drinkT||0)-dt);ME.scan=!!((K.Mouse2||K.Space)&&curSel(me)==='scanner'&&!ME.scare)}
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
      if(m.ty===1)put(m.x,1.1,m.z,1.6);else if(m.ty===3)put(m.x,m.y+(m.k===2?-.3:.4),m.z,1);else if(m.ty===0)put(m.x,m.y+.4,m.z,.7);else if(m.ty===11)put(m.x,.9,m.z,.9);else if(m.ty===13)put(m.x,1.6,m.z,1.5);else if(m.ty===14)put(m.x,.5,m.z,1.1);else if(m.ty===15)put(m.x,m.y,m.z,2.4)}
    for(const b of S.boxes)if(b.m&&(b.st===0||b.st===3)){const w=boxWorld(b);if(near(w.x,w.z))put(w.x,w.y+.3,w.z,.7)}
    for(const p of S.parcels||[])if(p.m&&near(p.x,CONV.z))put(p.x,CONV.y+.2,CONV.z,.6);
    for(const p of Object.values(S.players))if(p.id!==NET.myId&&!p.dead&&near(p.x,p.z))put(p.x,1.1,p.z,1.2);
    if(S.fork&&S.fork.pass&&near(S.fork.x,S.fork.z))put(PASS3D.position.x,PASS3D.position.y+.5,PASS3D.position.z,.9)}
  for(;i<SCAN.length;i++)SCAN[i].visible=false}

// ---------------------------------------------------------------- monsters added later
function makeMonster2(m){if(m.ty===15)return makeSpider();if(m.ty===16)return makeAuditor();if(m.ty===13)return makeBlind();if(m.ty===14)return makeHunch();if(m.ty===4)return makeManager();if(m.ty===5)return makeShrink();if(m.ty===6)return makeFrost();if(m.ty===12)return makeMoth();
  if(m.ty===7){const g=makeDriver();const others=Object.values(S.players).filter(p=>p.id!==NET.myId);
    // in a crew it wears one of your crewmates' names
    if(others.length){const o=others[m.k%others.length],tag=makeTag(o.name,o.col||'#ccc');tag.position.y=2.1;g.add(tag)}return g}
  return null}
function coldify(g){g.traverse(o=>{if(o.isMesh&&o.material===MAT.lurkSkin)o.material=MAT.coldSkin})}
function loopFor(m){return m.ty===13?['breath',.9]:m.ty===14?['whisper',.5]:m.ty===5?['crinkle',1.2]:m.ty===6?['ice',1]:m.ty===12?['flutter',.6]:null}
function animMonster2(v,dt,time){if(v.ty>=15){animMonster3(v,dt,time);return}const u=v.g.userData,t=time+v.ph,a=v.a;
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
  else if(v.ty===12){u.wings.forEach(w=>w.w.rotation.z=w.s*Math.sin(t*22)*.9);u.body.rotation.x=Math.sin(t*3)*.2}
  else if(v.ty===13){const mv=a===2||a===4;v.gp=(v.gp||0)+(mv?dt*(a===4?6.5:2.6):0);u.legs.forEach((l,i)=>l.rotation.x=mv?Math.sin(v.gp+i*Math.PI)*(a===4?.55:.3):0);
    u.arms.forEach((s,i)=>s.rotation.x=mv?-Math.sin(v.gp+i*Math.PI)*.35-(a===4?.5:0):Math.sin(t*.7+i)*.05);u.torso.rotation.x=damp(u.torso.rotation.x,a===4?.35:.12,4,dt);
    u.head.rotation.x=.25;u.head.rotation.z=.4+Math.sin(t*(a===0?1.6:.6))*(a===0?.25:.08)} // listening, it rolls its head from side to side
  else if(v.ty===14){const k=a===0?0:a===2?1:2;v.gp=(v.gp||0)+(a===2?dt*3.5:0);
    u.body.position.y=damp(u.body.position.y,[-.28,-.18,-.05][k],5,dt);u.torso.rotation.x=damp(u.torso.rotation.x,[.5,1.05,.45][k],4,dt);u.head.rotation.x=damp(u.head.rotation.x,[.9,-.5,-.15][k],4,dt);
    u.legs.forEach((l,i)=>l.rotation.x=damp(l.rotation.x,k===0?-2.0:k===1?-1.2+Math.sin(v.gp+i*Math.PI)*.3:-.5,6,dt));u.knees.forEach(n=>n.rotation.x=damp(n.rotation.x,k===0?1.85:k===1?1.9:.9,6,dt));
    u.elbows.forEach(n=>n.rotation.x=damp(n.rotation.x,k===0?.15:k===1?-.2:-.3,6,dt));
    u.arms.forEach((s,i)=>s.rotation.x=damp(s.rotation.x,k===0?-.9+Math.sin(t*.5+i)*.04:k===1?-1.0+Math.sin(v.gp+i*Math.PI)*.45:-1.55+Math.sin(t*14)*.05,7,dt))}}
function fearOf(v,d){if(v.ty>=15)return fearOf3(v,d);if(v.ty===4)return v.a===4?clamp(1-d/9,0,1)*1.2:clamp(1-d/7,0,1)*.35;if(v.ty===5)return v.a===2?clamp(1-d/9,0,1)*.8:0;
  if(v.ty===13)return clamp(1-d/10,0,1)*(v.a===4?1.1:.6);if(v.ty===14)return v.a===0?clamp(1-d/4,0,1)*.2:clamp(1-d/8,0,1)*1.1;
  if(v.ty===6)return clamp(1-d/6,0,1)*(v.a===2?.9:.3);if(v.ty===7)return clamp(1-d/8,0,1)*.8;if(v.ty===12)return clamp(1-d/5,0,1)*.25;return null}

// ---------------------------------------------------------------- jumpscares for the new ones
function makeScare2(ty){return ty===13?makeBlind():ty===14?makeHunch():ty===4?makeManager():ty===5?makeShrink():ty===6?makeFrost():ty===7?makeDriver():ty===10?makeRoofThing():ty===11?makePassenger():null}
function updScare2(s,k,lunge){const g=s.g,u=g.userData;
  if(s.ty===4){g.position.set(rand(-.01,.01),-2.36,lerp(-1.9,-.78,lunge(.18)));g.rotation.y=Math.PI*0;u.clip.position.y=.3;u.clip.rotation.x=1.35;u.head.rotation.set(-.2,0,Math.sin(k*17)*.05+.15);u.arms.forEach(a=>{a.rotation.x=-1.6;a.rotation.z=0})}
  else if(s.ty===5){g.position.set(rand(-.02,.02),-1.9,lerp(-1.4,-.6,lunge(.2)));u.head.rotation.set(-.15,0,Math.sin(k*25)*.2);u.torso.rotation.x=.25}
  else if(s.ty===6){g.position.set(rand(-.02,.02),-1.84,lerp(-1.5,-.62,lunge(.16)));u.arms.forEach((a,i)=>{a.rotation.x=-1.9;a.rotation.z=(i?-1:1)*.3});u.head.rotation.set(-.25,0,0)}
  else if(s.ty===7){g.position.set(rand(-.02,.02),-1.66,lerp(-1.4,-.58,lunge(.16)));g.rotation.y=Math.PI;u.head.rotation.set(-.2,0,.85+Math.sin(k*30)*.15);u.arms.forEach(a=>a.rotation.x=-1.7);u.beam.visible=false;u.tag.visible=false}
  else if(s.ty===10){g.position.set(rand(-.01,.01),lerp(1.2,.12,lunge(.14)),-.5);g.rotation.set(0,0,Math.PI);u.arms.forEach((a,i)=>a.rotation.z=(i?-1:1)*.8)}
  else if(s.ty===13){g.position.set(rand(-.02,.02),-2.2,lerp(-1.5,-.6,lunge(.16)));u.head.rotation.set(-.2,0,.4+Math.sin(k*22)*.12);u.arms.forEach(a=>a.rotation.x=-1.6)}
  else if(s.ty===14){g.position.set(rand(-.02,.02),-1.1,lerp(-1.2,-.45,lunge(.22)));u.body.position.y=0;u.torso.rotation.x=.3;u.head.rotation.x=-.2;u.arms.forEach(a=>a.rotation.x=-1.5)}
  else if(s.ty===11){g.position.set(rand(-.01,.01),-.95,lerp(-1.2,-.5,lunge(.12)));g.rotation.y=Math.PI;u.head.rotation.x=-.35;u.torso.rotation.x=-.1}}

// ---------------------------------------------------------------- events
function onEvent2(e){if(onEvent3(e))return;const me=NET.myId,P=(x,z,y=1)=>({x,y,z});
  switch(e.e){
  case 'bought':SFX.buy();if(e.team)toast(`The crew voted to buy ${(ADDS[e.k]||SHOP[e.k]).name.toLowerCase()}.`,3);else if(e.p!==me)toast(`${e.n} bought ${(ADDS[e.k]||SHOP[e.k]).name.toLowerCase()}.`,3);renderShop(true);break;
  case 'stuck':toast(`Bay ${BAYS[e.b].name}'s door motor jammed. The door is stuck open.`,4.5);break;
  case 'slam':SFX.slam(P(e.x,e.z,2));break;
  case 'shake':if(e.p!==me)SFX.shake({x:e.x,y:1.2,z:e.z});break;
  case 'blindHear':SFX.clicks(P(e.x,e.z,2.2));break;
  case 'hunchWarn':if(e.p===me){SFX.growl(P(e.x,e.z,.6));toast('Something in the corner lifts its head. Find something to do.',4.5)}break;
  case 'hunchGo':SFX.skitter(P(e.x,e.z,.4));break;
  case 'grab':if(e.p===me){ME.grab=true;ME.strug=0;ME.shake=.6;SFX.hurt()}break;
  case 'freed':if(e.p===me){ME.grab=false;toast('You tore free. Get back to work.',3)}SFX.growl(P(e.x,e.z,.8));break;
  case 'shred':SFX.shred(P(e.x,e.z,1));ADDV.shredSpin=1.4;break;
  case 'item':if(e.p===me){if(e.k==='batt'){ME.bat=100;SFX.battery();toast('Fresh battery.',2)}else if(e.k==='drink'){ME.drinkT=20;ME.stam=100;ME.exh=false;SFX.drink()}}break;
  case 'flare':SFX.flare(P(e.x,e.z,.2));break;
  case 'strobe':if(e.p!==me){SFX.strobe();if(Math.hypot(e.x-ME.x,e.z-ME.z)<12)ME.flash=Math.max(ME.flash,.4)}break;
  case 'airhorn':SFX.airhorn(P(e.x,e.z,1.5));break;
  case 'squeal':SFX.squeal(P(e.x,e.z,e.y));break;
  case 'cut':SFX.cut(P(e.x,e.z,e.y));break;
  case 'hands':SFX.hands(P(CONV.bx,e.z,1));if(e.p===me){ME.shake=Math.max(ME.shake,.7);ME.vx+=(CONV.bx-ME.x)*2;ME.vz+=(e.z-ME.z)*2;toast('Something grabbed you from the bin.',3)}break;
  case 'mothHit':SFX.mothHit(P(e.x,e.z,e.y));if(e.p===me){ME.shake=Math.max(ME.shake,.3);ME.flick=0}break;
  case 'smashBulb':SFX.smashBulb(P(e.x,e.z,5));break;
  case 'passGone':SFX.vanish(P(e.x,e.z,1));break;
  case 'vanish':SFX.vanish(P(e.x,e.z,e.y||1));break;
  case 'writeup':SFX.writeup(evPos(e)||P(ME.x,ME.z));if(e.p===me)toast(e.n>=2?'The night manager writes you up again. Keep busy. Don\'t let it happen a third time.':'The night manager writes you up for standing around. That\'s $10 off your pay.',5,'radio');break;
  case 'mgrFinal':if(e.p===me){toast('He lowers the clipboard. Don\'t stop moving.',5,'radio');ME.shake=Math.max(ME.shake,.4)}break;
  case 'boom':SFX.boom(P(e.x,e.z,0));ME.shake=Math.max(ME.shake,.25);break; // the thing in the yard takes a step closer
  case 'roof':SFX.roofStep(P(e.x,e.z,2.8));break;
  case 'stall':SFX.thunk(P(ME.x,ME.z,2));if(AU.ready&&ADDV.lift)ADDV.lift.set(0,.1);if(Math.abs(ME.x-(e.lvl===0?-28.7:71.3))<3)toast('The elevator jerks to a stop. Something is on the roof. Shine your flashlight up at the hatch!',6,'radio');break;
  case 'unstall':SFX.thunk(P(ME.x,ME.z,2));break;
  case 'elevGo':SFX.thunk(P(e.lvl===0?-28.7:71.3,e.lvl===0?-9.3:0,1));break;
  case 'ding':SFX.ding(P(e.lvl===0?-28.7:71.3,e.lvl===0?-9.3:0,2.4));break;
  case 'tp':if(e.p===me){ME.x=e.x;ME.z=e.z;ME.vx=ME.vz=0;if(e.yaw!==undefined)ME.yaw=e.yaw;
      if(e.climb){const f=$('fade');if(f){f.style.transition='none';f.style.opacity=1;requestAnimationFrame(()=>{f.style.transition='opacity .9s';f.style.opacity=0})}
        for(let i=0;i<5;i++)setTimeout(()=>SFX.step(true,false),i*120);ME.yaw=e.climb>0?Math.PI*.75:Math.PI*.25;ME.pitch=0;
        if(e.climb>0&&!GAME.hints.roof){GAME.hints.roof=1;toast('The roof. It\'s snowing hard and nothing up here is lit. Someone keeps a supply crate at the far end.',6)}}}break;
  case 'stash':if(e.p===me){SFX.ok();toast(`Someone stashed supplies up here: +1 ${SHOP[e.k].name.toLowerCase()}.`,3.5)}break;
  case 'gstep':{const d=Math.hypot(e.x-ME.x,e.z-ME.z);if(onRoof(ME)){SFX.boom(P(e.x,e.z,ROOF.gy));ME.shake=Math.max(ME.shake,clamp(1-d/45,0,1)*.45)}break}
  case 'greach':if(onRoof(ME)&&S.rg)SFX.gcreak(P(S.rg.x,S.rg.z,ROOF.gy+16));break;
  case 'ggrab':if(e.p===me){SFX.gcreak(P(ME.x,ME.z,1.5));ME.shake=Math.max(ME.shake,.7);ME.fear=1}else{const v=AV.get(e.p);if(v)SFX.scream({x:v.x,y:4,z:v.z})}break;
  case 'gbite':if(onRoof(ME)||e.p===me)SFX.gbite(e.p===me?null:P(e.x,e.z,ROOF.gy+17));break;
  case 'chill':big('<span style="color:#7fc8ff">The Warehouse Is Getting Cold</span>','Restart the ventilation in the room on the roof within 2 minutes',5.5);SFX.radio();ME.chillAt=performance.now()+5600;break;
  case 'frozen':big('<span style="color:#7fc8ff">The Warehouse Is Freezing</span>','Everyone is losing health. Restart the ventilation on the roof',5);SFX.thunk(P(ME.x,ME.z,3));break;
  case 'warm':SFX.ok();toast(e.p===me?'The ventilation is running again.':`${e.n} got the ventilation running again.`,4);break;
  case 'yreach':SFX.gcreak(P(e.x,e.z,4));ME.shake=Math.max(ME.shake,.3);break;
  case 'yhit':if(e.p===me){ME.shake=1;ME.flash=Math.max(ME.flash,.35)}break;
  case 'amrBeep':SFX.ding(P(e.x,e.z,.6));break;
  case 'gflinch':if(onRoof(ME))SFX.gcreak(P(e.x,e.z,ROOF.gy+16));break;
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
const ITEM_ICON={batt:'Battery',flare:'Flare',cutter:'Cutter',strobe:'Strobe',scanner:'Scanner',horn:'Horn',drink:'Drink',remote:'Remote',bulb:'Bulb'};
const ITEM_USE={batt:'swap in a fresh battery',flare:'light a flare',cutter:'cut open the box you\'re looking at',strobe:'flash it',scanner:'hold to see warm bodies',horn:'blast it',drink:'drink it',remote:'shut the nearest bay door',bulb:'fit it under a dead fixture'};
function hotbarHTML(me){if(!me||!me.inv)return'';const sel=curSel(me),items=[];
  for(const [code,k] of Object.entries(ITEM_KEYS)){if(!haveItem(me,k))continue;const n=k==='cutter'||k==='scanner'?'':me.inv[k];
    items.push(`<span data-k="${k}" class="hb${k===sel?' sel':''}"><small>${code.slice(5)}</small>${ITEM_ICON[k]}${n?`<b>${n}</b>`:''}</span>`)}
  const name=sel?`<div class="hbname">${SHOP[sel].name} &middot; <kbd>${TOUCH.on?'ITEM':'Right click'}</kbd> ${ITEM_USE[sel]}${items.length>1?(TOUCH.on?' &middot; tap one to switch':' &middot; scroll to switch'):''}</div>`:'';
  const lamp=me.up.red?`<span data-k="lamp" class="hb lamp${ME.red?' on':''}"><small>${keyLabel('KeyH')}</small>Headlamp</span>`:'';
  return items.length||lamp?`${name}<div class="hbrow">${items.join('')}${lamp}</div>`:''}
function promptFor(t,me){switch(t.kind){
  case 'cart':{const c=S.carts&&S.carts[t.i];return!c?null:c.by?'Someone else is pushing this cart':'<kbd>E</kbd> Push the hand cart'+(me.carry>=0?' (your boxes go on it)':'')}
  case 'fork':return owned('fork')?'<kbd>E</kbd> Drive the forklift':'Broken forklift';
  case 'pallet':return'Pallet load: forklift only';
  case 'parcel':return'<kbd>Q</kbd> Kick off the belt'+(curSel(me)==='cutter'?' &nbsp; <kbd>Right click</kbd> Cut':'');
  case 'cold':return S.cold&&S.cold.open?'<kbd>E</kbd> Close the freezer':'<kbd>E</kbd> Open the freezer';
  case 'lever':return`<kbd>E</kbd> Switch bin (now <b style="color:${PARCEL_CSS[S.conv.sel]}">${PARCEL_NAMES[S.conv.sel]}</b>)`;
  case 'jam':return S.conv&&S.conv.jam?'Hold <kbd>E</kbd> Clear the jam':'Jam clear button';
  case 'elevIn':return S.elev.st!=='idle'?'Elevator moving&hellip;':S.elev.lvl===t.lvl?`<kbd>E</kbd> ${t.lvl===0?'Go down to the basement':'Go up to the warehouse'}`:'';
  case 'elevCall':return S.elev.st!=='idle'?'Elevator moving&hellip;':S.elev.lvl===t.lvl?'Elevator is here':'<kbd>E</kbd> Call the elevator';
  case 'gen':return me.can?'<kbd>E</kbd> Refuel the generator':`Generator: ${Math.round(S.gen.fuel)}% fuel`;
  case 'fuelrack':return me.can?'':'<kbd>E</kbd> Take a jerry can';
  case 'shred':{const b=me.carry>=0?S.boxes.find(x=>x.id===me.carry):null;return!b?'Shredder':b.ret?'<kbd>E</kbd> Shred the damaged return (counts toward quota)':'<kbd>E</kbd> Shred it <span class="warn">(good stock: counts as lost)</span>'}
  case 'ladder':return me.carry>=0||me.can?'Roof ladder (you need both hands)':'<kbd>E</kbd> Climb to the roof';
  case 'hatch':return'<kbd>E</kbd> Climb back down';
  case 'vent':return S.chill?`Hold <kbd>E</kbd> Restart the ventilation <span class="meter"><i style="width:${Math.round(clamp((ME.ventT||0)/2,0,1)*100)}%"></i></span>`:'Ventilation plant: running';
  case 'amrPad':{if(me.carry<0)return'AMR-S pad: put a box here and the robot shelves it';const b=S.boxes.find(x=>x.id===me.carry);
    if(b&&b.ret)return'The robot does not take returns';if(b&&b.fz)return'Frozen crates go to the freezer by hand';
    if(S.boxes.some(x=>x.st===3&&x.amr===1))return'A box is already waiting on the pad';return'<kbd>E</kbd> Put it on the robot pad'}
  case 'stash':return S.stash?'<kbd>E</kbd> Look in the supply crate':'The crate is empty tonight';
  case 'fslot':return t.ok?'<kbd>E</kbd> Set the pallet on the shelf':'Shelf is full';
  case 'fpal':return'<kbd>E</kbd> Lift the pallet';}return null}
// stuck in the elevator: shown in the middle of the screen, how long the light has been on the hatch and how long before it opens
function hatchNote(){const e=S.elev;if(!e||e.st!=='stall'||!owned('base')||!inCar(ME,e.lvl===0?CAR_UP:CAR_DN))return'';const k=clamp((e.hl||0)/ELEV_HOLD,0,1);
  return`<span class="warnline">SOMETHING IS ON THE ROOF &middot; ${Math.max(0,Math.ceil(ELEV_WAIT-(e.ht||0)))}s</span><br>${ME.lightOn()?'Shine your light up at the hatch':'<kbd>F</kbd> Turn your flashlight on and shine it up at the hatch'} <span class="meter"><i style="width:${Math.round(k*100)}%"></i></span>`}
// right after the cold warning, and until the plant is running again: which way to go
function chillHint(me){const el=$('chillHint');let h='';
  if(S&&S.chill&&S.phase==='play'&&me&&!me.dead&&performance.now()>(ME.chillAt||0)){const pre=S.chill.st==='cold'?'FREEZING &middot; ':'';
    if(inRoofRoom(ME))h=`${pre}The ventilation plant is in here: hold <b>E</b> on it`;
    else if(onRoof(ME))h=`${pre}Ventilation plant room ${dirTo(RROOM.x0-.8,(RROOM.door.z0+RROOM.door.z1)/2)}`;
    else if(ME.x>60)h=`${pre}The ventilation is on the roof &middot; take the elevator up first`;
    else h=`${pre}The ventilation is on the roof &middot; ladder ${dirTo(LADDER.x+.8,LADDER.z)}`}
  if(h!==ME.chillH){el.innerHTML=h;ME.chillH=h}}
function statusLines(me){let h='';
  if(S.chill)h+=S.chill.st==='cold'?`<div class="bay warnline" style="color:#8fd0ff">FREEZING &middot; ventilation on the roof</div>`:`<div class="bay" style="color:#8fd0ff">GETTING COLD &middot; ventilation on the roof &middot; ${mmss(S.chill.t)}</div>`;
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
  let s=ME.cart>=0?`On the cart: ${n} of ${CART_MAX}`:n>1?`Carrying ${n} boxes`:'';
  if(b.fz)s+=(s?' &middot; ':'')+`<span style="color:#9fd4ff">${chilled()?'Frozen: holding in the cold':`Frozen: thaws in ${Math.max(0,Math.ceil(b.th||0))}s`}${inCold(ME)?'':` &middot; freezer ${dirTo((COLD.dx0+COLD.dx1)/2,COLD.z1+.6)}`}</span>`;
  else if(b.ret)s+=(s?' &middot; ':'')+`<span style="color:#d9a35a">Damaged return: shred it &middot; ${ME.x>60?`shredder ${dirTo(SHRED.x,SHRED.z)}`:`basement elevator ${dirTo(CAR_UP.x1,(CAR_UP.z0+CAR_UP.z1)/2)}`}</span>`;
  else if(ME.x>60)s+=(s?' &middot; ':'')+`Shelves are upstairs &middot; elevator ${dirTo(CAR_DN.x1,0)}`;
  if(b.pri)s+=(s?' &middot; ':'')+'<span style="color:#ff7a5a">Priority</span>';return s}
// the first night after something is bought, say what it's for and where it is
const ADD_INTRO={fork:'The forklift is parked by the dock, just east of where you start. Some trailers have a pallet of eight boxes inside the door. Lift it with E, set it on any top shelf.',
  cold:'Cold storage is in the north-east corner, under the blue light. Frozen crates (pale blue) go on its shelves within 60 seconds of leaving the trailer.',
  conv:'The sorting conveyor is on the south wall, behind you as you start. Set its lever to the colour of the next parcel to reach the end.',
  base:'The freight elevator is on the west wall, past Bay A. Ten damaged returns wait in the basement. They can\'t be shelved: feed them to the shredder down there.',
  gen:'The generator is on the west wall near the roof ladder. If the power fails, it keeps the lights and the charger running while it has fuel.',
  amrs:'The AMR-S pad is on the dock, west of the charger. Put a box on it (E) and the robot shelves it on a free bottom or middle shelf.',
  amrl:'The AMR-L pad is on the dock, east of the charger. Set a pallet on it with the forklift (G) and the robot puts it on a free top shelf.',
  heat:'The heater is high on the east wall. The warehouse now takes an extra night to go cold between spells.',
  bayc:'Bay C is open in the north-west corner. Its refrigerated trucks bring more boxes, and more frozen crates if you have cold storage.'};
function introAdds(){const seen=GAME.seenAdds||(GAME.seenAdds=new Set());const fresh=(S.adds||[]).filter(k=>!seen.has(k));if(!fresh.length)return;
  fresh.forEach((k,i)=>{seen.add(k);setTimeout(()=>GAME.on&&S&&S.phase==='play'&&toast(ADD_INTRO[k],6.5),5200+i*7000)});
  setTimeout(()=>GAME.on&&toast('The THIS WAY board on the dock wall points to everything the crew has bought.',5),5200+fresh.length*7000)}

// ---------------------------------------------------------------- the shop screen
let shopShown=false,shopSig='';
function renderShop(force){if(!S)return;const me=S.players[NET.myId];if(!me)return;
  const sig=JSON.stringify([(S.carts||[]).length,S.cash,me.cash,S.tvotes,S.adds,me.inv,me.up,S.aidBonus,S.fixed,Math.round(S.shopT||0),S.votes,Object.keys(S.players).length]);if(!force&&sig===shopSig)return;shopSig=sig;
  const team=Math.round(S.cash||0),mine$=Math.round(me.cash||0),crew=Object.keys(S.players).length,tneed=Math.floor(crew/2)+1;
  $('shopCash').innerHTML=crew>1?`Team fund $${team}<small>·</small>Your fund $${mine$}`:`$${team+mine$}`;$('shopNight').textContent=`Night ${S.night} done. Night ${S.night+1} is next.`;
  // team things show their votes on the button: amber once anyone has voted, green when you have
  const card=(k,it,ownedNow,extra='')=>{const pr=priceOf(k),locked=it.night&&S.night+1<it.night,tm=isTeam(k),fund=tm?team:(crew>1?mine$:team+mine$),
      tv=tm?((S.tvotes||{})[k]||[]):[],voted=tv.includes(NET.myId),can=!ownedNow&&!locked&&(fund>=pr||voted);
    if(locked)extra+=`<div class="tag" style="color:#ff9f70">on sale from night ${it.night}</div>`;
    const label=!tm||crew<2?'Buy':tv.length?`${voted?'Voted':'Vote'} · ${tv.length} of ${crew} (${tneed} needed)`:'Vote to buy',cls=tm&&crew>1?(voted?'voted':tv.length?'votes':''):'';
    return`<div class="sc${ownedNow?' own':''}"><div class="sh"><b>${it.name}</b><span>${ownedNow?'OWNED':'$'+pr}</span></div><p>${it.desc}</p>${extra}${ownedNow?'':`<button data-buy="${k}" class="${cls}" ${can?'':'disabled'}>${label}</button>`}</div>`};
  const nCart=(S.carts||[]).length,maxCart=crew>1?2:1;
  const teamShop=Object.entries(SHOP).filter(([k,it])=>it.team).map(([k,it])=>k==='cart'?card(k,it,nCart>=maxCart,`<div class="tag">${crew>1?'the crew has':'you have'} ${nCart} of ${maxCart}${crew>1?'':' (two in a crew)'}</div>`)
    :card(k,it,false,`<div class="tag">the cabinet has ${S.aidBonus||0} extra tomorrow (${aidCap()} at most)</div>`)).join('');
  $('shopAdds').innerHTML=Object.entries(ADDS).map(([k,it])=>card(k,it,owned(k),`<div class="tag">${it.q||it.time?`+${it.q} boxes to quota · +${it.time} s of shift`:'no extra work'}</div>`)).join('')+teamShop;
  $('shopItems').innerHTML=Object.entries(SHOP).filter(([k,it])=>!it.team&&(!it.needs||me.up[it.needs])).map(([k,it])=>{const have=it.once?!!me.up[k]:(me.inv[k]||0);
    const where=!it.key?'':typeof it.key==='number'?'on the hotbar':`key ${it.key}`;
    return card(k,it,it.once&&have,!it.once&&have?`<div class="tag">you have ${have}${where?` · ${where}`:''}</div>`:where?`<div class="tag">${where}</div>`:'')}).join('');
  // the crew votes: more than half ready and the next night starts
  const n=Object.keys(S.players).length,v=(S.votes||[]).length,need=Math.floor(n/2)+1,mine=(S.votes||[]).includes(NET.myId);
  $('bShopGo').textContent=n<2?`Start night ${S.night+1}`:mine?'Not done yet':`Done: start night ${S.night+1}`;$('bShopGo').classList.toggle('on',mine);$('bShopGo').classList.remove('hide');
  $('shopWait').textContent=n<2?'':`${v} of ${n} done (${need} needed). Starts by itself in ${Math.max(0,Math.round(S.shopT||0))} s.`}
function shopTick(){if(!GAME.on||!S)return;const want=S.phase==='shop'&&!GAME.overShown;
  if(want&&!shopShown){shopShown=true;if(document.pointerLockElement)document.exitPointerLock();show('shop');$('hud').classList.add('hide');renderShop(true)}
  else if(!want&&shopShown){shopShown=false;hideScreens();$('hud').classList.remove('hide');if(!locked())$('lockmsg').classList.remove('hide')}
  // anything else that hid the shop while it's still between nights: put it back
  if(shopShown&&$('shop').classList.contains('hide')&&SCREENS.every(s=>$(s).classList.contains('hide'))){show('shop');$('hud').classList.add('hide');$('lockmsg').classList.add('hide');renderShop(true)}
  if(shopShown)renderShop(false)}
function bindShop(){$('shop').addEventListener('click',e=>{const b=e.target.closest('[data-buy]');if(b){auInit();doAct({a:'buy',k:b.dataset.buy});return}});
  $('bShopGo').onclick=()=>{auInit();const going=Object.keys(S.players).length<2;doAct({a:'start'});if(going)reqLock()}}

// ---------------------------------------------------------------- held by the thing in the basement
// It drags you to the shredder: you can't move, only mash E (or Q, Space, click) to break its grip.
function grabber(){return S.mons.find(m=>m.ty===14&&m.a===5&&m.tg===NET.myId)}
function grabUpdate(dt,me){const m=grabber();if(!m){ME.grab=false;return false}
  if(!ME.grab){ME.grab=true;ME.strug=0}
  // (the meter drains once you stop mashing, the same as on the host)
  if(performance.now()-(ME.sgT||0)>250)ME.strug=Math.max(0,(ME.strug||0)-dt*STRUG_DECAY);
  const v=MV.get(m.id),gx=v?v.g.position.x:m.x,gz=v?v.g.position.z:m.z,ry=v?v.g.rotation.y:m.ry;
  ME.x=gx+Math.sin(ry)*.85;ME.z=gz+Math.cos(ry)*.85;ME.vx=ME.vz=0;
  ME.yaw=angLerp(ME.yaw,Math.atan2(-(SHRED.x-ME.x),-(SHRED.z-ME.z)),dt*4);ME.pitch=damp(ME.pitch,-.3,4,dt);
  const t=performance.now()*.001;camera.position.set(ME.x,1.35+Math.sin(t*9)*.03,ME.z);camera.rotation.set(ME.pitch,ME.yaw+Math.sin(t*7)*.04,Math.sin(t*5)*.08);
  me.x=ME.x;me.z=ME.z;return true}
function struggle(){const now=performance.now();if(now-(ME.sgT||0)<60)return;ME.sgT=now;ME.strug=(ME.strug||0)+1;ME.shake=Math.max(ME.shake,.25);doAct({a:'struggle'})}
function grabNote(){if(!ME.grab)return'';const k=clamp((ME.strug||0)/STRUGGLE_N,0,1);
  return`<span class="warnline">IT HAS YOU</span><br>Mash <kbd>E</kbd> to break free <span class="meter"><i style="width:${Math.round(k*100)}%"></i></span>`}
