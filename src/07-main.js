// ===================================================================== post-processing: depth outlines, grade, grain, scares
const RT=new THREE.WebGLRenderTarget(4,4,{type:THREE.HalfFloatType,depthBuffer:true});
RT.depthTexture=new THREE.DepthTexture(4,4);RT.depthTexture.type=THREE.UnsignedIntType;
const POST=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,
  uniforms:{tCol:{value:RT.texture},tDep:{value:RT.depthTexture},res:{value:new THREE.Vector2(4,4)},time:{value:0},near:{value:camera.near},far:{value:camera.far},
    hurt:{value:0},flash:{value:0},fear:{value:0},lowhp:{value:0},dead:{value:0},edgeW:{value:1}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
  fragmentShader:`precision highp float;uniform sampler2D tCol,tDep;uniform vec2 res;uniform float time,near,far,hurt,flash,fear,lowhp,dead,edgeW;varying vec2 vUv;
  float W(vec2 uv){float d=texture2D(tDep,uv).r;float vz=(near*far)/((far-near)*d-far);return -1.0/vz;}
  float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
  void main(){vec2 uv=vUv;
    uv+=vec2(sin(uv.y*38.0+time*6.0),cos(uv.x*29.0+time*4.3))*0.0016*fear;
    vec2 px=edgeW/res;float c=W(uv);
    float lap=abs(W(uv-vec2(px.x,0.))+W(uv+vec2(px.x,0.))+W(uv-vec2(0.,px.y))+W(uv+vec2(0.,px.y))-4.0*c)/max(c,1e-5);
    // outlines fade out with the fog, so nothing far away shows up as a silhouette against lamp glow
    float zl=1.0/max(c,1e-5);float edge=smoothstep(.02,.07,lap)*(1.0-smoothstep(6.0,11.0,zl));
    vec2 ca=(uv-.5)*(0.0025+0.012*fear+0.02*hurt);
    vec3 col=vec3(texture2D(tCol,uv+ca).r,texture2D(tCol,uv).g,texture2D(tCol,uv-ca).b);
    col=col/(1.0+col*.3);
    col=pow(max(col,0.),vec3(1./2.2));
    col=mix(col,vec3(.008,.006,.01),edge*.9);
    float lum=dot(col,vec3(.299,.587,.114));
    col=mix(col*vec3(.82,.94,1.16),col*vec3(1.06,1.,.9),smoothstep(.12,.55,lum));
    col=mix(col,vec3(lum)*vec3(1.15,.55,.5),lowhp*.55);
    float vg=length((vUv-.5)*vec2(res.x/res.y,1.));col*=1.0-smoothstep(.42,1.1,vg)*(.78+.18*fear);
    col=mix(col,vec3(.5,0.,0.),hurt*(.18+.5*smoothstep(.2,.85,vg)));
    col+=(hash(vUv*res+fract(time*7.13)*91.0)-.5)*(.05+.05*fear);
    float sl=sin(vUv.y*res.y*1.6+time*30.)*.5+.5;col*=1.0-sl*.035*(1.0+fear);
    col=floor(col*40.+.5)/40.;
    col=mix(col,vec3(1.,.96,.92),flash);
    col=mix(col,vec3(lum*.55,0.,0.),dead*.75);
    gl_FragColor=vec4(col,1.);}`});
const postScene=new THREE.Scene(),postCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),POST));

// dust drifting through the flashlight beam
const DUST=(()=>{const n=900,p=new Float32Array(n*3),sd=new Float32Array(n);for(let i=0;i<n;i++){p[i*3]=rand(-8,8);p[i*3+1]=rand(0,6);p[i*3+2]=rand(-8,8);sd[i]=Math.random()}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('seed',new THREE.BufferAttribute(sd,1));
  const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{lp:{value:new THREE.Vector3()},ld:{value:new THREE.Vector3(0,0,-1)},cp:{value:new THREE.Vector3()},on:{value:1},time:{value:0},px:{value:1}},
    vertexShader:`attribute float seed;uniform vec3 lp,ld,cp;uniform float on,time,px;varying float vA;
      void main(){vec3 q=position+vec3(sin(time*.11+seed*6.)*.4,-time*.04*(.3+seed),cos(time*.13+seed*3.)*.4);
        q.xz=cp.xz+mod(q.xz-cp.xz+8.,16.)-8.;q.y=mod(q.y,6.);
        vec3 tl=q-lp;float d=length(tl);float c=dot(tl/max(d,.001),ld);
        vA=smoothstep(.9,.975,c)*(1.-smoothstep(3.,13.,d))*smoothstep(.3,1.2,d)*on;
        vec4 mv=viewMatrix*vec4(q,1.);gl_Position=projectionMatrix*mv;gl_PointSize=(1.5+seed*2.5)*px*12./max(-mv.z,.5);}`,
    fragmentShader:`varying float vA;void main(){float r=length(gl_PointCoord-.5);if(r>.5)discard;gl_FragColor=vec4(vec3(1.,.93,.8)*vA*(1.-r*2.)*.55,1.);}`});
  const pts=new THREE.Points(g,m);pts.frustumCulled=false;scene.add(pts);return m})();

function applyQuality(){const q=+SET.qual;const pr=q===2?Math.min(devicePixelRatio||1,1.5):1,sc=q===2?1:q===1?.8:.6;
  renderer.setPixelRatio(pr);renderer.setSize(innerWidth,innerHeight,false);
  const w=Math.max(4,Math.floor(innerWidth*pr*sc)),h=Math.max(4,Math.floor(innerHeight*pr*sc));RT.setSize(w,h);POST.uniforms.res.value.set(w,h);POST.uniforms.edgeW.value=w>2200?1.5:1;
  const shadows=q>0,ms=q===2?1024:512;if(FL.castShadow!==shadows||FL.shadow.mapSize.x!==ms){FL.castShadow=shadows;FL.shadow.mapSize.set(ms,ms);if(FL.shadow.map){FL.shadow.map.dispose();FL.shadow.map=null}}
  DUST.uniforms.px.value=h/900;
  camera.aspect=innerWidth/innerHeight;camera.fov=+SET.fov;camera.updateProjectionMatrix()}
addEventListener('resize',applyQuality);

// ===================================================================== local player
const GAME={on:false,paused:false,overShown:false,overT:0,wasLocked:false,hints:{},hudT:0};
const ME={x:0,z:-15.5,yaw:0,pitch:0,vx:0,vz:0,stam:100,exh:false,bat:100,light:true,bob:0,stepPh:0,kickCD:0,kickA:0,scare:null,shake:0,hurt:0,flash:0,fear:0,spec:0,lastHp:100,target:null,deathT:0,charging:false,beatT:0,flick:1,
  lightOn(){return this.light&&this.bat>0}};
const K={};
const locked=()=>document.pointerLockElement===canvas;
function reqLock(){try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{})}catch(e){}}
addEventListener('keydown',e=>{if(e.target&&e.target.tagName==='INPUT')return;K[e.code]=true;
  if(GAME.on&&!GAME.paused&&!e.repeat)onKey(e.code);
  if(GAME.on&&['Space','Tab','KeyF','KeyQ','KeyE','KeyG'].includes(e.code))e.preventDefault()});
addEventListener('keyup',e=>{K[e.code]=false});
addEventListener('blur',()=>{for(const k in K)K[k]=false});
document.addEventListener('mousemove',e=>{if(!GAME.on||!locked()||GAME.paused)return;const s=.0021*SET.sens;ME.yaw-=e.movementX*s;ME.pitch=clamp(ME.pitch-e.movementY*s,-1.45,1.45)});
canvas.addEventListener('mousedown',e=>{auInit();if(!GAME.on)return;if(!locked()){reqLock();return}
  const me=S&&S.players[NET.myId];if(me&&me.dead){ME.spec++;return}
  if(e.button===0)onKey('KeyE');else if(e.button===2)onKey('KeyQ')});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('pointerlockchange',()=>{if(locked()){GAME.wasLocked=true;$('lockmsg').classList.add('hide');if(GAME.on){hideScreens();GAME.paused=false}}
  else if(GAME.on&&!GAME.overShown){showPause()}});

function onKey(code){const me=S&&S.players[NET.myId];if(!me||me.dead||ME.scare||S.phase!=='play')return;
  if(code==='KeyF'){if(ME.bat>0)ME.light=!ME.light;SFX.click();return}
  if(code==='KeyE'){const t=ME.target;if(!t)return;
    if(t.kind==='box')doAct({a:'pick',b:t.b.id});
    else if(t.kind==='slot'){if(t.ok)doAct({a:'place',s:t.s.id});else SFX.deny()}
    else if(t.kind==='panel'){if(S.trucks[t.bay].st===2)doAct({a:'panel',b:t.bay});else SFX.deny()}
    else if(t.kind==='aid')doAct({a:'aid'});
    else if(t.kind==='exit'){SFX.locked();toast('Locked. Nobody leaves before 6:00 AM.')}
    return}
  if(code==='KeyQ'){if(ME.kickCD>0)return;ME.kickCD=.8;ME.kickA=.35;const t=ME.target;if(t&&t.kind==='box')doAct({a:'kick',b:t.b.id});return}
  if(code==='KeyG'){if(me.carry<0)return;const fx=-Math.sin(ME.yaw),fz=-Math.cos(ME.yaw);doAct({a:'drop',x:r2(ME.x+fx*.9),z:r2(ME.z+fz*.9),ry:r2(ME.yaw)});return}}

const RC=new THREE.Raycaster();const _v=new THREE.Vector3(),_v2=new THREE.Vector3();
function rayBox(ray,x0,y0,z0,x1,y1,z1){const o=ray.origin,d=ray.direction;let t0=0,t1=1e9;
  for(const [oo,dd,a,b] of[[o.x,d.x,x0,x1],[o.y,d.y,y0,y1],[o.z,d.z,z0,z1]]){if(Math.abs(dd)<1e-9){if(oo<a||oo>b)return null;continue}let ta=(a-oo)/dd,tb=(b-oo)/dd;if(ta>tb)[ta,tb]=[tb,ta];t0=Math.max(t0,ta);t1=Math.min(t1,tb);if(t0>t1)return null}return t0}
let BOXPICK=[];
const GHOST=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1,1,1).translate(0,.5,0)),new THREE.LineBasicMaterial({color:0x9dff9a,transparent:true,opacity:.75,fog:false,depthWrite:false}));GHOST.visible=false;scene.add(GHOST);
function updGhost(me){const t=ME.target;const b=t&&t.kind==='slot'&&me&&me.carry>=0?S.boxes.find(x=>x.id===me.carry):null;GHOST.visible=!!b;if(!b)return;
  const K=BOX_KINDS[b.k];GHOST.scale.set(K.w,K.h,K.d);GHOST.position.set(t.s.x,t.s.y+.01,t.s.z);GHOST.material.color.set(t.ok?0x9dff9a:0xff6a5a);GHOST.material.opacity=.45+Math.sin(performance.now()/160)*.25}
function findTarget(me){ME.target=null;GHOST.visible=false;if(!me||me.dead||ME.scare)return;
  RC.setFromCamera({x:0,y:0},camera);RC.far=3.1;const carrying=me.carry>=0;
  if(carrying){let best=null,bt=3.3;for(const s of SLOTS){if(Math.abs(s.x-ME.x)>4.5||Math.abs(s.z-ME.z)>4.5)continue;const t=rayBox(RC.ray,s.x-.97,s.y,s.z-.55,s.x+.97,s.y+1.08,s.z+.55);if(t!==null&&t<bt){bt=t;best=s}}
    if(best){ME.target={kind:'slot',s:best,ok:!best.old&&best.box<0};return}}
  const hits=RC.intersectObjects(BOXPICK.concat(INTER),false);
  for(const h of hits){const ud=h.object.userData;if(segBlocked(ME.x,ME.z,h.point.x-(h.point.x-ME.x)*.08,h.point.z-(h.point.z-ME.z)*.08))break;
    if(ud.kind==='box'){const b=S.boxes.find(x=>x.id===ud.id);if(!b||b.st===2||b.st===1)break;if(!carrying)ME.target={kind:'box',b};break}
    if(ud.kind)ME.target={kind:ud.kind,bay:ud.bay};break}}

function localUpdate(dt){const me=S.players[NET.myId];if(!me)return;
  if(me.hp<ME.lastHp-.5){ME.hurt=Math.min(1,ME.hurt+.9);if(!ME.scare)SFX.hurt()}ME.lastHp=me.hp;
  ME.hurt=Math.max(0,ME.hurt-dt*.7);ME.flash=Math.max(0,ME.flash-dt*2.2);ME.kickCD-=dt;ME.kickA=Math.max(0,ME.kickA-dt);
  if(ME.scare)updScare(dt);else ME.shake=Math.max(0,ME.shake-dt*1.4);
  if(me.dead){ME.deathT+=dt;spectate(dt);findTarget(null);return}
  ME.deathT=0;
  const busy=!!ME.scare||S.phase!=='play';
  const fw=busy?0:(K.KeyW||K.ArrowUp?1:0)-(K.KeyS||K.ArrowDown?1:0),st=busy?0:(K.KeyD||K.ArrowRight?1:0)-(K.KeyA||K.ArrowLeft?1:0);
  const carry=me.carry>=0?S.boxes.find(b=>b.id===me.carry):null,slow=carry?BOX_KINDS[carry.k].slow:1;
  const moving=fw||st,run=(K.ShiftLeft||K.ShiftRight)&&fw>0&&!ME.exh&&ME.stam>0;
  const spd=(run?5.3:3.05)*slow;
  const sx=-Math.sin(ME.yaw),sz=-Math.cos(ME.yaw),rx=Math.cos(ME.yaw),rz=-Math.sin(ME.yaw);
  let tx=sx*fw+rx*st,tz=sz*fw+rz*st;const tl=Math.hypot(tx,tz);if(tl>0){tx=tx/tl*spd;tz=tz/tl*spd}
  ME.vx=damp(ME.vx,tx,10,dt);ME.vz=damp(ME.vz,tz,10,dt);
  const p={x:ME.x+ME.vx*dt,z:ME.z+ME.vz*dt};collideCircle(p,.32);
  // never strand anyone outside: if the trailer they're in isn't docked, put them back by the bay door
  if(p.z<WH.z0-.3){let bi=-1;for(let i=0;i<BAYS.length;i++)if(Math.abs(p.x-BAYS[i].x)<TRAIL_HW+.4)bi=i;
    const tr=bi>=0?S.trucks[bi]:null;if(!tr||(tr.st!==2&&tr.st!==3)){if(bi>=0)p.x=BAYS[bi].x;p.z=WH.z0+1.2}}
  p.x=clamp(p.x,WH.x0+.3,WH.x1-.3);p.z=clamp(p.z,TZ_DOCK-TRAIL_LEN+.3,WH.z1-.3);
  const sp=Math.hypot(p.x-ME.x,p.z-ME.z)/Math.max(dt,1e-4);ME.x=p.x;ME.z=p.z;
  if(run&&sp>1){ME.stam-=dt*21;if(ME.stam<=0){ME.stam=0;ME.exh=true}}else{ME.stam=Math.min(100,ME.stam+dt*(moving?10:16));if(ME.exh&&ME.stam>35)ME.exh=false}
  // head bob + footsteps
  if(sp>.3){const ph0=ME.stepPh;ME.stepPh+=dt*sp*(run?1.9:2.15);if(Math.floor(ph0/Math.PI)!==Math.floor(ME.stepPh/Math.PI))SFX.step(ME.z<WH.z0,run)}
  ME.bob=damp(ME.bob,sp>.3?1:0,6,dt);
  // battery + charger
  ME.charging=false;
  // holding E at the charger counts as charging even when full, so the battery never drains there
  if(ME.target&&ME.target.kind==='charger'&&K.KeyE&&!busy){ME.charging=true;if(ME.bat<100){ME.bat=Math.min(100,ME.bat+dt*24);if(Math.random()<dt*6)SFX.charge()}}
  if(ME.lightOn()&&!ME.charging){ME.bat=Math.max(0,ME.bat-dt*.6);if(ME.bat<=0){ME.light=false;SFX.click();toast('Your flashlight died.')}}
  if(ME.bat<25&&!GAME.hints.bat){GAME.hints.bat=1;toast('Battery low. Hold E at the charging dock between the bays.',5)}
  if(carry&&!GAME.hints.carry&&S.night===1){GAME.hints.carry=1;toast('Look at an empty shelf and press E to shelve it.',4.5)}
  // camera
  const bobY=Math.sin(ME.stepPh*2)*.045*ME.bob*(run?1.4:1),bobX=Math.cos(ME.stepPh)*.03*ME.bob;
  camera.position.set(ME.x+rx*bobX,1.62+bobY-(carry?.03:0),ME.z+rz*bobX);
  const sh=ME.shake*ME.shake;camera.rotation.set(ME.pitch-ME.kickA*.25+rand(-1,1)*sh*.05,ME.yaw+rand(-1,1)*sh*.05,rand(-1,1)*sh*.06);
  VM.g.position.set(bobX*.3,bobY*.4-ME.kickA*.15,0);
  me.x=ME.x;me.z=ME.z;me.yaw=ME.yaw;me.pitch=ME.pitch;me.light=ME.lightOn();
  findTarget(me);updGhost(me);}

function spectate(dt){
  if(ME.deathT<2.2||!Object.values(S.players).some(p=>!p.dead&&p.id!==NET.myId)){ // fall to the floor
    const k=Math.min(1,ME.deathT/1.2);camera.position.set(ME.x,lerp(1.62,.25,easeOut(k)),ME.z);camera.rotation.set(lerp(ME.pitch,-.2,k),ME.yaw,lerp(0,1.2,easeOut(k)));return}
  const alive=Object.values(S.players).filter(p=>!p.dead&&p.id!==NET.myId);const p=alive[ME.spec%alive.length],v=AV.get(p.id);if(!v)return;
  camera.position.set(v.x,1.62,v.z);camera.rotation.set(v.pitch,v.yaw,0)}

// ---- jumpscares
function startScare(ty){if(ME.scare){camera.remove(ME.scare.g)}
  const g=ty===1?makeLurker():ty===2?makeStalker():makeMimic(1,randi(0,3),false);g.traverse(o=>{if(o.isMesh){o.castShadow=false;o.renderOrder=6}});
  camera.add(g);ME.scare={t:0,ty,g};toastT=0;bigT=0;SCARE_L.color.set(ty===2?0x9fb4ff:0xff5a3a);SFX.scare(ty);ME.flash=.9;ME.shake=1;ME.fear=1}
function updScare(dt){const s=ME.scare,g=s.g,ud=g.userData;s.t+=dt;const k=s.t;
  const lunge=d=>easeOut(Math.min(1,k/d));
  if(s.ty===1){g.position.set(rand(-.02,.02),-1.5,lerp(-3.6,-2.45,lunge(.22)));ud.body.rotation.x=.1;ud.jaw.rotation.x=Math.min(1.0,k*6)+Math.sin(k*30)*.05;ud.head.rotation.set(-.3,0,Math.sin(k*35)*.1);
    ud.arms.forEach((a,i)=>{a.rotation.x=-1.9;a.rotation.z=(i?-1:1)*.75})}
  else if(s.ty===2){g.position.set(rand(-.015,.015),-2.5,lerp(-1.4,-.78,lunge(.16)));ud.torso.rotation.x=.05;ud.head.rotation.set(Math.sin(k*31)*.08,0,Math.sin(k*42)*.16+.25);
    ud.arms.forEach((a,i)=>{a.rotation.x=-1.45;a.rotation.z=(i?-1:1)*.62;a.userData.el.rotation.x=-.7})}
  else{g.position.set(rand(-.02,.02),-.38,lerp(-2.1,-1.55,lunge(.14)));g.rotation.x=1.2;ud.lids.forEach(l=>l.p.rotation.x=l.s*(.95+Math.sin(k*40)*.25));
    ud.legs.forEach(l=>{l.hip.rotation.x=Math.sin(k*30+l.ph)*.8})}
  ME.shake=Math.max(0,1-k/1.3);
  if(k>1.3){camera.remove(g);ME.scare=null;ME.shake=0}}

// ===================================================================== world sync (host and clients both render from S)
const TV=[];const BM=new Map(),MV=new Map(),AV=new Map();
function syncTrucks(){S.trucks.forEach((tr,i)=>{const v=TV[i],b=BAYS[i],bv=BAYV[i];
  v.g.visible=tr.st!==0;v.g.position.set(b.x,0,tr.z);const fm=tr.claw?MAT.ribsClaw:MAT.ribs;if(v.g.userData.front.material!==fm)v.g.userData.front.material=fm;
  const pnl=bv.door.children[0],h=Math.max(.06,DOOR_H*(1-tr.door));pnl.scale.y=h;pnl.position.y=DOOR_H-h/2;
  bv.ind.material.color.set(tr.st===2&&tr.door>=1?0x2aff6a:tr.st===0?0x3a0c0c:0xffa020);bv.scr.material.color.set(tr.st===2?0x1d8a3e:0x4a1410);
  if(AU.ready){if(!v.eng){v.eng=loop('engine',{x:b.x,y:1,z:tr.z},1);v.beep=loop('beep',{x:b.x,y:1,z:tr.z},1);v.door=loop('door',{x:b.x,y:3,z:WH.z0},1)}
    const moving=tr.st===1||(tr.st===3&&tr.door<=0);v.eng.pos({x:b.x,y:1,z:tr.z-TRAIL_LEN-1.5});v.eng.set(tr.st===0?0:moving?.85:.16,.35);
    v.beep.pos({x:b.x,y:1.5,z:tr.z-1});v.beep.set(tr.st===1&&tr.t>1?.16:0,.03);
    const dm=Math.abs(tr.door-v.pd)>1e-4;v.door.set(dm?.45:0,.04);v.pd=tr.door}})}
function syncBoxes(dt){const me=S.players[NET.myId];const live=new Set();
  for(const b of S.boxes){if(b.st===4)continue;live.add(b.id);let m=BM.get(b.id);if(!m){m=makeBoxMesh(b);BM.set(b.id,m);ROOT.add(m);m.userData.tw=0}
    if(b.st===1){if(b.h===NET.myId){m.visible=false;continue}const av=AV.get(b.h);if(!av||!av.g.visible){m.visible=false;continue}
      m.visible=true;m.position.set(av.x-Math.sin(av.yaw)*.42,.92-BOX_KINDS[b.k].h*.4,av.z-Math.cos(av.yaw)*.42);m.rotation.set(0,av.yaw,0);continue}
    m.visible=true;const w=boxWorld(b);m.position.set(w.x,w.y,w.z);m.rotation.set(0,b.ry,0);
    if(m.userData.tw>0){m.userData.tw-=dt;const k=m.userData.tw;m.rotation.z=Math.sin(k*70)*.07*Math.min(1,k*3);m.rotation.x=Math.cos(k*53)*.05*Math.min(1,k*3);m.position.y+=Math.abs(Math.sin(k*45))*.035}}
  for(const [id,m] of BM)if(!live.has(id)){ROOT.remove(m);BM.delete(id)}
  BOXPICK.length=0;for(const m of BM.values())if(m.visible)BOXPICK.push(m);
  const cb=me&&me.carry>=0?S.boxes.find(b=>b.id===me.carry):null;setViewBox(me&&!me.dead?cb:null)}
function syncMonsters(dt,time){const live=new Set();
  for(const m of S.mons){live.add(m.id);let v=MV.get(m.id);
    if(!v){const g=m.ty===0?makeMimic(m.k,m.v,m.f):m.ty===1?makeLurker():makeStalker();g.position.set(m.x,m.y,m.z);g.rotation.y=m.ry;ROOT.add(g);
      v={g,ty:m.ty,lp:null,ph:Math.random()*10,a:0,fade:1};MV.set(m.id,v)}
    if(AU.ready&&!v.lp&&m.ty!==0)v.lp=loop(m.ty===1?'breath':'whisper',{x:m.x,y:1.5,z:m.z},m.ty===1?1.3:1);
    const g=v.g;if(Math.hypot(g.position.x-m.x,g.position.z-m.z)>3){g.position.set(m.x,m.y,m.z)}
    else{g.position.x=damp(g.position.x,m.x,15,dt);g.position.z=damp(g.position.z,m.z,15,dt);g.position.y=damp(g.position.y,m.y,15,dt)}
    g.rotation.y=angLerp(g.rotation.y,m.ry,dt*8);v.a=m.a;animMonster(v,dt,time);
    if(v.lp){v.lp.pos({x:g.position.x,y:1.5,z:g.position.z});
      if(m.ty===1)v.lp.set(m.a===2?1:m.a===1?.35:.75,.2);
      else{ // the stalker only whispers now and then, a little more often once it's close
        const d=Math.hypot(g.position.x-ME.x,g.position.z-ME.z);v.wt=(v.wt??rand(4,9))-dt;
        if(v.wt<=0){v.wb=rand(1.2,2.2);v.wt=v.wb+(d<7?rand(5,9):rand(11,20))}
        v.wb=Math.max(0,(v.wb||0)-dt);v.lp.set(v.wb>0?.8:0,.35)}}}
  for(const [id,v] of MV)if(!live.has(id)){ROOT.remove(v.g);v.lp&&v.lp.stop();MV.delete(id)}}
function animMonster(v,dt,time){const u=v.g.userData,t=time+v.ph;
  if(v.ty===1){const hunt=v.a===2,lit=v.a===1,back=v.a===3;
    u.body.position.y=damp(u.body.position.y,hunt?-.08+Math.abs(Math.sin(t*7))*.06:-.3,6,dt);
    u.body.rotation.x=damp(u.body.rotation.x,hunt?.12:lit?-.08:back?-.15:.3,5,dt);
    u.body.rotation.z=lit?Math.sin(t*48)*.03:0;u.body.scale.y=1+Math.sin(t*1.8)*.03;
    u.jaw.rotation.x=damp(u.jaw.rotation.x,lit?.75:hunt?.4+Math.sin(t*9)*.1:.08,8,dt);
    u.head.rotation.x=damp(u.head.rotation.x,hunt?-.15:.25,5,dt);u.head.rotation.y=hunt?0:Math.sin(t*.4)*.4;
    u.arms.forEach((a,i)=>{a.rotation.x=damp(a.rotation.x,hunt?Math.sin(t*7+i*Math.PI)*.6-.3:lit?-1.2:0,8,dt)});
    for(const e of u.eyes)e.scale.y=lit?.015:.04}
  else if(v.ty===2){const mv=v.a===2,lit=v.a===1;
    u.legs.forEach((l,i)=>l.rotation.x=mv?Math.sin(t*5.5+i*Math.PI)*.45:0);
    u.arms.forEach((a,i)=>{a.rotation.x=lit?damp(a.rotation.x,-.4,10,dt):mv?Math.sin(t*5.5+i*Math.PI+Math.PI)*.35:Math.sin(t*.9+i)*.08;a.rotation.z=(i?-1:1)*(lit?.25:.08);a.userData.el.rotation.x=lit?-.8:-.15});
    u.torso.rotation.x=mv?.32:.18;u.torso.rotation.z=Math.sin(t*.7)*.06;
    u.head.rotation.z=lit?damp(u.head.rotation.z,1.25,14,dt):Math.sin(t*1.3)*.25+(Math.sin(t*11)>.97?.5:0);u.head.rotation.x=mv?-.3:.1}
  else{const mv=v.a===2;u.body.position.y=.35+(mv?Math.abs(Math.sin(t*30))*.04:.06);
    u.lids.forEach(l=>l.p.rotation.x=l.s*(v.a===1?1.3+Math.sin(t*35)*.3:.5+Math.sin(t*22)*.35));
    u.legs.forEach(l=>{l.hip.rotation.x=mv?Math.sin(t*26+l.ph)*.7:Math.sin(t*4+l.ph)*.1;l.hip.rotation.z=mv?Math.cos(t*26+l.ph)*.25:0})}}
function syncAvatars(dt,time){const live=new Set();let si=0;
  for(const p of Object.values(S.players)){if(p.id===NET.myId)continue;live.add(p.id);let v=AV.get(p.id);
    if(!v){const g=makeWorker(p.col||VEST[1],p.name||'Worker');ROOT.add(g);v={g,x:p.x,z:p.z,yaw:p.yaw,pitch:p.pitch,walk:0};AV.set(p.id,v)}
    const ox=v.x,oz=v.z;v.x=damp(v.x,p.x,11,dt);v.z=damp(v.z,p.z,11,dt);v.yaw=angLerp(v.yaw,p.yaw,1-Math.exp(-12*dt));v.pitch=damp(v.pitch,p.pitch,12,dt);
    const sp=Math.hypot(v.x-ox,v.z-oz)/Math.max(dt,1e-3);const w0=v.walk;v.walk+=dt*sp*2.3;
    if(sp>.4&&Math.floor(w0/Math.PI)!==Math.floor(v.walk/Math.PI)&&Math.hypot(v.x-ME.x,v.z-ME.z)<16)SFX.step(v.z<WH.z0,sp>4,{x:v.x,y:.1,z:v.z});
    const g=v.g,u=g.userData;g.visible=!p.dead;g.position.set(v.x,0,v.z);g.rotation.y=v.yaw+Math.PI;
    const a=Math.min(1,sp/3);u.legs[0].rotation.x=Math.sin(v.walk)*.6*a;u.legs[1].rotation.x=-Math.sin(v.walk)*.6*a;
    if(p.carry>=0){u.arms.forEach(x=>x.rotation.x=damp(x.rotation.x,-1.25,10,dt))}else{u.arms[0].rotation.x=-Math.sin(v.walk)*.5*a;u.arms[1].rotation.x=-.9}
    u.torch.rotation.x=-v.pitch;u.head.rotation.x=-v.pitch*.6;u.beam.visible=!!p.light;
    if(si<REMOTE_SPOTS.length){const s=REMOTE_SPOTS[si++];u.torch.getWorldPosition(s.position);const cp=Math.cos(v.pitch);s.target.position.set(s.position.x-Math.sin(v.yaw)*cp*8,s.position.y+Math.sin(v.pitch)*8,s.position.z-Math.cos(v.yaw)*cp*8);s.intensity=p.light&&!p.dead?24:0}}
  for(;si<REMOTE_SPOTS.length;si++)REMOTE_SPOTS[si].intensity=0;
  for(const [id,v] of AV)if(!live.has(id)){ROOT.remove(v.g);AV.delete(id)}}
const MENU_LAMPS=LAMPS.map(()=>({on:1,t:rand(2,8)}));
function syncLamps(dt){LAMPV.forEach((L,i)=>{let on;
  if(S)on=S.lamps[i];else{const m=MENU_LAMPS[i];m.t-=dt;if(m.t<=0){m.on=1-m.on;m.t=m.on?rand(4,12):rand(.3,2.5)}on=m.on}
  if(L.prev!==undefined&&L.prev!==on){L.sput=.45;if(AU.ready&&GAME.on)SFX.creak({x:LAMPS[i].x,y:5,z:LAMPS[i].z})}L.prev=on;
  let lv=on?1:0;if(L.sput>0){L.sput-=dt;lv=Math.random()<.5?1:.05}
  if(on&&Math.random()<(i===3?.035:.008))L.fl=rand(.05,.25);if(L.fl>0){L.fl-=dt;lv*=Math.random()<.5?.12:1}
  L.light.intensity=17*lv;L.bulb.material.color.setRGB(lerp(.1,1,lv),lerp(.08,.85,lv),lerp(.06,.62,lv));L.cone.material.opacity=.035*lv;
  if(AU.ready){if(!L.hum)L.hum=loop('hum',{x:LAMPS[i].x,y:5,z:LAMPS[i].z},.35);L.hum.set(lv*.35,.03)}})}
function syncWorld(dt,time){applyColliders();syncTrucks();syncAvatars(dt,time);syncBoxes(dt);syncMonsters(dt,time)}
function clearVisuals(){for(const m of BM.values())ROOT.remove(m);BM.clear();for(const v of MV.values()){ROOT.remove(v.g);v.lp&&v.lp.stop()}MV.clear();for(const v of AV.values())ROOT.remove(v.g);AV.clear();
  for(const v of TV)v.g.visible=false;for(const s of REMOTE_SPOTS)s.intensity=0;setViewBox(null);if(ME.scare){camera.remove(ME.scare.g);ME.scare=null}
  for(const s of SLOTS)s.box=-1;BOXPICK.length=0}

// ===================================================================== events
function evPos(e){if(e.x!==undefined)return{x:e.x,y:e.y??1,z:e.z};const v=MV.get(e.id);if(v)return{x:v.g.position.x,y:1.4,z:v.g.position.z};return null}
function drainEvents(){while(EVQ.length){const e=EVQ.shift();try{onEvent(e)}catch(err){console.error(err)}}}
function onEvent(e){const me=NET.myId;
  switch(e.e){
  case 'night':{const p=e.pos&&e.pos[me];if(p){ME.x=p[0];ME.z=p[1];ME.ready=true;ME.yaw=0;ME.pitch=0;ME.vx=ME.vz=0}ME.bat=100;ME.stam=100;ME.light=true;ME.lastHp=100;ME.deathT=0;
    big(`NIGHT ${e.n}`,`Shelve ${e.q} boxes before 6:00 AM or you're fired`,4.5);SFX.bell();
    if(e.n===1&&!GAME.hints.start){GAME.hints.start=1;setTimeout(()=>GAME.on&&toast('A truck is backing into Bay A. Unload it and shelve the boxes.',5),4500);
      setTimeout(()=>GAME.on&&toast('Your quota is top left. Keep the bar ahead of the white marker to stay on pace.',6),11000)}break}
  case 'radio':SFX.radio();toast(`Supervisor, on the radio: "${e.m}"`,6,'radio');break;
  case 'finalHour':SFX.pa();toast(e.need>0?`Loudspeaker: "Final hour. ${e.need} more box${e.need>1?'es':''} to make quota."`:'Loudspeaker: "Final hour."',5,'radio');break;
  case 'overtime':SFX.powerDown();big('OVERTIME',`${e.need} more box${e.need>1?'es':''} in 60 seconds. The lights are out.`,5);
    if(e.b>=0)setTimeout(()=>GAME.on&&toast(`One last truck is backing into Bay ${BAYS[e.b].name}.`,4,'radio'),2500);break;
  case 'nightDone':big(e.ot?'MADE IT':'6:00 AM',`Night ${e.n} survived${e.ot?' on overtime':''} · ${e.sh} / ${e.q} shelved${e.lo?` · ${e.lo} lost`:''}`,7);SFX.bell();break;
  case 'hour':SFX.bell();toast(`${e.h}:00 AM`,2.5);break;
  case 'truck':if(e.last&&!S.ot){SFX.pa();toast(`Loudspeaker: "Last truck of the night, Bay ${BAYS[e.b].name}."`,5,'radio')}else if(!e.last)toast(`Truck inbound: Bay ${BAYS[e.b].name}`,3);break;
  case 'brake':SFX.brake({x:BAYS[e.b].x,y:1,z:TZ_DOCK-6});break;
  case 'horn':SFX.horn({x:BAYS[e.b].x,y:1.5,z:TZ_DOCK-TRAIL_LEN});break;
  case 'tw':{const m=BM.get(e.id);if(m){m.userData.tw=.7;SFX.scratch({x:m.position.x,y:m.position.y+.3,z:m.position.z})}break}
  case 'burst':SFX.burst(evPos(e));break;
  case 'scare':if(e.p===me)startScare(e.ty);else{const v=AV.get(e.p);if(v)SFX.scream({x:v.x,y:1.6,z:v.z})}break;
  case 'died':if(e.p!==me){const p=S.players[e.p];toast(`${p?p.name:'Someone'} is down.`,3.5)}break;
  case 'pick':SFX.pick({x:e.x,y:e.y,z:e.z});break;
  case 'place':SFX.place({x:e.x,y:e.y,z:e.z});break;
  case 'kick':SFX.kick({x:e.x,y:e.y,z:e.z});break;
  case 'smash':SFX.smash({x:e.x,y:e.y,z:e.z});break;
  case 'growl':{const p=evPos(e);if(p)SFX.growl(p);break}
  case 'hiss':{const p=evPos(e);if(p)SFX.hiss(p);break}
  case 'shriek':{SFX.shriek({x:e.x,y:1.8,z:e.z});const d=Math.hypot(e.x-ME.x,e.z-ME.z);if(d<16){ME.flash=Math.max(ME.flash,.25);ME.shake=Math.max(ME.shake,.35)}break}
  case 'stalk':if(Math.random()<.6)setTimeout(()=>GAME.on&&toast(pick(['You feel like you are being watched.','Something moved in the dark.','The air just got colder.']),3.5),rand(1500,5000));break;
  case 'lamp':SFX.creak({x:LAMPS[e.i].x,y:5,z:LAMPS[e.i].z});break;
  case 'msg':if(!e.p||e.p===me)toast(e.m,3.8);break;
  case 'quota':SFX.ok();toast('Quota met. Every extra box is bonus pay.',4);break;
  case 'healed':if(e.p===me){SFX.ok();toast('Patched up.',2.5)}break;
  }}

// ===================================================================== HUD
let toastT=0,bigT=0;
function toast(m,d=3.5,cls=''){const el=$('toast');el.textContent=m;el.className=cls;el.style.opacity=1;toastT=d}
function big(a,b,d=4){const el=$('big');el.innerHTML=`${a}<small>${b||''}</small>`;el.style.opacity=1;bigT=d}
function fmtClock(t){const mins=Math.floor(t/HOUR*60),h=Math.floor(mins/60),m=mins%60;return`${h===0?12:h}:${String(m).padStart(2,'0')} AM`}
const mmss=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
function hud(dt){toastT-=dt;if(toastT<=0)$('toast').style.opacity=0;bigT-=dt;if(bigT<=0)$('big').style.opacity=0;
  const me=S.players[NET.myId];
  $('hpb').firstChild.style.width=(me?me.hp:0)+'%';$('batb').firstChild.style.width=ME.bat+'%';$('stb').firstChild.style.width=ME.stam+'%';
  $('batb').style.opacity=ME.charging?(Math.sin(performance.now()/90)>0?1:.5):1;
  const t=ME.target;let pr='';
  if(me&&!me.dead&&!ME.scare&&S.phase==='play'){const carrying=me.carry>=0;
    if(t){if(t.kind==='box')pr='<kbd>E</kbd> Pick up &nbsp; <kbd>Q</kbd> Kick';
      else if(t.kind==='slot')pr=t.ok?'<kbd>E</kbd> Shelve box':'Shelf is full';
      else if(t.kind==='charger')pr=ME.bat>=99.5?'Flashlight fully charged':ME.charging?`Charging&hellip; ${Math.floor(ME.bat)}%`:'Hold <kbd>E</kbd> Charge flashlight';
      else if(t.kind==='aid')pr=S.aidLeft>0?`<kbd>E</kbd> First aid (${S.aidLeft} left tonight)`:'First-aid cabinet is empty';
      else if(t.kind==='panel'){const tr=S.trucks[t.bay];pr=tr.st===2?(tr.reject?'Truck is leaving':`<kbd>E</kbd> Refuse delivery: send Bay ${BAYS[t.bay].name} away`):`Bay ${BAYS[t.bay].name}: no truck docked`}
      else if(t.kind==='exit')pr='<kbd>E</kbd> Exit';}
    if(carrying&&(!t||t.kind!=='slot'))pr+=(pr?' &nbsp; ':'')+'<kbd>G</kbd> Set down';}
  if(pr!==GAME.lastPr){$('prompt').innerHTML=pr;GAME.lastPr=pr}
  $('cross').className=t&&(t.kind!=='slot'||t.ok)?'on':'';
  // a clock ticks through the last minute and overtime, only while the quota isn't met; double time for the final 10 s
  if(S.phase==='play'&&!S.over&&S.shelved<S.quota&&S.t>=SHIFT_END-60){const urgent=S.ot&&S.t>=SHIFT_END+OVERTIME-10,k=Math.floor(S.t*(urgent?2:1));
    if(k!==GAME.tickK){if(GAME.tickK!==undefined)SFX.tick(urgent||S.ot);GAME.tickK=k}}else GAME.tickK=undefined;
  GAME.hudT-=dt;if(GAME.hudT>0)return;GAME.hudT=.1;
  const ck=$('clock');ck.textContent=S.phase==='inter'?'6:00 AM':S.ot?`OVERTIME ${mmss(Math.max(0,SHIFT_END+OVERTIME-S.t))}`:fmtClock(S.t);
  ck.className=S.phase!=='play'?'':S.ot?'ot':S.t>=HOUR*5&&S.shelved<S.quota?'late':'';$('night').textContent=`NIGHT ${S.night}`;
  // pace: how many boxes short of the steady rate that makes quota exactly at 6:00
  const met=S.shelved>=S.quota,pace=S.phase==='play'?Math.min(1,S.t/SHIFT_END):1,behind=met?0:Math.ceil(S.quota*pace-S.shelved);
  const st=met?'ok':behind>=Math.max(4,S.quota*.3)?'far':behind>=2?'behind':'';
  const q=$('quota');q.textContent=`Shelved ${S.shelved} / ${S.quota}`+(S.ot&&!met?` · ${S.quota-S.shelved} to go`:st==='behind'||st==='far'?` · ${behind} behind`:'');q.className=st;
  const qb=$('qbar');qb.className=st;qb.firstChild.style.width=Math.min(100,S.shelved/S.quota*100)+'%';qb.lastChild.style.left=(pace*100)+'%';
  let h='';S.trucks.forEach((tr,i)=>{const n=BAYS[i].name;
    if(tr.st===0)h+=`<div class="bay">BAY ${n} &middot; empty</div>`;
    else{let s=tr.st===1?'truck backing in&hellip;':tr.st===3?'truck pulling out':tr.reject?'refused, leaving':`${tr.left} / ${tr.n} boxes &middot; leaves in ${mmss(Math.max(0,DOCK_TIME-tr.t))}`;
      h+=`<div class="bay live">BAY ${n} &middot; ${s}</div>`;
      if(tr.st!==3)h+=`<div class="bay live" style="font-size:12.5px;color:#a69f8c">manifest ${tr.n} pcs, ${tr.kg} kg${tr.warn?` &middot; <span class="warn">scale reads ${tr.kg+tr.extra} kg</span>`:''}</div>`}});
  h+=`<div class="bay" style="margin-top:6px;font-size:12.5px;color:#a69f8c">first aid: ${S.aidLeft} left</div>`;
  $('tr').innerHTML=h;
  const ps=Object.values(S.players);
  $('plist').innerHTML=ps.length>1?ps.map(p=>`<div style="color:${p.dead?'#666':p.col}">${p.dead?'&#10013; ':''}${esc(p.name)} ${p.dead?'':'&middot; '+Math.ceil(p.hp)}</div>`).join(''):'';
  const sp=$('spect');if(me&&me.dead&&ps.some(p=>!p.dead)){const alive=ps.filter(p=>!p.dead&&p.id!==NET.myId);sp.classList.remove('hide');sp.textContent=alive.length?`You're down. Watching ${alive[ME.spec%alive.length].name} (click to switch). Back on shift next night.`:''}else sp.classList.add('hide');
  if(SET.fps)$('fps').textContent=GAME.fps+' fps';}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// fear, heartbeat, flashlight flicker
function updFear(dt){const me=S.players[NET.myId];let f=0,near=99;
  for(const v of MV.values()){const d=Math.hypot(v.g.position.x-camera.position.x,v.g.position.z-camera.position.z);near=Math.min(near,d);
    const w=v.ty===2?1:v.ty===1?(v.a===0?.45:1.2):.6;f=Math.max(f,clamp(1-d/(v.ty===2?9:10),0,1)*w)}
  if(me&&me.hp<35&&!me.dead)f=Math.max(f,.35);
  ME.fear=damp(ME.fear,f,f>ME.fear?3:.8,dt);
  ME.beatT-=dt;if(ME.fear>.32&&ME.beatT<=0&&!(me&&me.dead)){ME.beatT=1.05-ME.fear*.55;SFX.beat(clamp(ME.fear,.2,1)*.9)}
  // flashlight: dies on low battery, stutters when something is close
  let fl=1;if(ME.bat<15&&Math.random()<.08)fl=rand(0,.5);
  if(near<7&&Math.random()<(1-near/7)*.12)fl=rand(0,.35);
  ME.flick=fl<1?fl:damp(ME.flick,1,25,dt);
  return near}

// ===================================================================== screens
const SCREENS=['menu','how','settings','lobby','pause','over'];
function hideScreens(){for(const s of SCREENS)$(s).classList.add('hide')}
function show(id){hideScreens();$(id).classList.remove('hide')}
let settingsBack='menu';
function showMenu(err){GAME.on=false;$('hud').classList.add('hide');$('lockmsg').classList.add('hide');show('menu');$('menuErr').textContent=err?String(err):'';if(document.pointerLockElement)document.exitPointerLock()}
function showPause(){if(!GAME.on)return;if(NET.mode==='solo')GAME.paused=true;$('pauseNote').textContent=NET.mode==='solo'?'The clock is stopped.':`Crew ${NET.code}: the night keeps going without you.`;show('pause')}
function renderLobby(){show('lobby');$('code').textContent=NET.code||'-----';
  $('lobbyList').innerHTML=NET.lobby.map(p=>`<li><span class="dot" style="background:${p.col}"></span>${esc(p.name)}${p.id===NET.myId?' <span class="lbl">(you)</span>':''}</li>`).join('');
  $('lobbyStatus').textContent=NET.mode==='host'?(NET.lobby.length>1?`${NET.lobby.length} workers. Start when everyone is in.`:'Share the code. Waiting for your crew…'):'Waiting for the host to start the shift…';
  $('bStart').classList.toggle('hide',NET.mode!=='host')}
function showOver(o){GAME.overShown=true;if(document.pointerLockElement)document.exitPointerLock();$('hud').classList.add('hide');
  const crew=S&&Object.keys(S.players).length>1;
  const T={dead:[crew?'THE CREW IS GONE':'YOU DIDN\'T MAKE IT',crew?'Nobody clocked out this morning.':'Something in the dark got you.'],quota:['FIRED',`You missed the quota${o.ot?', even on overtime':''}: ${o.shelved} of ${o.quota} boxes shelved.`],host:['DISCONNECTED','The host left the crew room.']}[o.why]||['SHIFT OVER',''];
  $('overTitle').textContent=T[0];$('overWhy').textContent=T[1];
  $('overStats').innerHTML=`Nights survived: <b>${Math.max(0,o.night-1)}</b><br>Boxes shelved: <b>${o.total}</b><br>Pay: <b>$${(o.score*1.25).toFixed(2)}</b>`;
  $('bAgain').classList.toggle('hide',NET.mode==='client'||o.why==='host');
  $('bAgain').textContent=NET.mode==='host'?'Start another shift (crew)':'Work another shift';
  show('over');if(NET.mode==='client'&&o.why!=='host')$('overWhy').textContent+=' Waiting for the host to start another shift…'}
function checkOver(dt){if(!S.over||GAME.overShown)return;if(ME.scare)return;GAME.overT+=dt;if(GAME.overT>1.8)showOver(S.over)}

function enterGame(){clearVisuals();hideScreens();$('hud').classList.remove('hide');GAME.on=true;GAME.paused=false;GAME.overShown=false;GAME.overT=0;GAME.lastPr=null;
  Object.assign(ME,{vx:0,vz:0,stam:100,exh:false,bat:100,light:true,kickCD:0,scare:null,shake:0,hurt:0,flash:0,fear:0,deathT:0,lastHp:100,spec:0});
  const me=S.players[NET.myId];if(me){ME.x=me.x;ME.z=me.z;ME.yaw=me.yaw||0;ME.pitch=0}
  auInit();reqLock();setTimeout(()=>{if(GAME.on&&!locked()&&!GAME.overShown)$('lockmsg').classList.remove('hide')},600)}
function startSolo(){netClose();NET.mode='solo';NET.myId='me';S=newState();addPlayer('me',myName(),VEST[0]);startNight();enterGame()}
function hostStartGame(){S=newState();for(const p of NET.lobby)addPlayer(p.id,p.name,p.col);NET.started=true;NET.sentBver=-1;NETEV.length=0;startNight();hostSend({t:'start'});lobbyBroadcast();enterGame()}
function clientStart(){S=newState();S.players={};EVQ.length=0;ME.ready=false;enterGame()}
function quitToMenu(){GAME.on=false;netClose();S=null;clearVisuals();EVQ.length=0;NETEV.length=0;showMenu()}

function bindUI(){
  $('name').value=SET.name||'';$('name').addEventListener('input',()=>{SET.name=$('name').value;saveSet()});
  $('bSolo').onclick=()=>{auInit();startSolo()};
  $('bHost').onclick=async()=>{auInit();NET.code='';NET.lobby=[];NET.mode='host';renderLobby();$('lobbyStatus').textContent='Opening a crew room…';$('bStart').classList.add('hide');
    try{await netHost();renderLobby()}catch(e){netClose();showMenu(e)}};
  const join=async()=>{const code=$('joinCode').value.trim().toUpperCase();if(!/^[A-Z0-9]{5}$/.test(code)){$('menuErr').textContent='Room codes are five letters or numbers.';return}
    auInit();NET.code=code;NET.lobby=[];NET.mode='client';renderLobby();$('lobbyStatus').textContent='Finding the crew…';
    try{await netJoin(code);renderLobby()}catch(e){netClose();showMenu(e)}};
  $('bJoin').onclick=join;$('joinCode').addEventListener('keydown',e=>{if(e.key==='Enter')join()});
  $('bStart').onclick=()=>{if(NET.mode==='host')hostStartGame()};
  $('bLeave').onclick=()=>{netClose();showMenu()};
  $('bHow').onclick=()=>show('how');$('bHowBack').onclick=()=>show('menu');
  $('bSettings').onclick=()=>{settingsBack='menu';openSettings()};$('bPauseSet').onclick=()=>{settingsBack='pause';openSettings()};
  $('bSetBack').onclick=()=>show(settingsBack);
  $('bResume').onclick=()=>{auInit();reqLock();hideScreens();GAME.paused=false;setTimeout(()=>{if(GAME.on&&!locked()&&!GAME.overShown)$('lockmsg').classList.remove('hide')},400)};
  $('bQuit').onclick=quitToMenu;$('bMenu').onclick=quitToMenu;
  $('bAgain').onclick=()=>{auInit();if(NET.mode==='host')hostStartGame();else startSolo()};
  const sl=(id,key,fmt,apply)=>{const el=$(id),out=$('v'+id.slice(1));el.value=SET[key];out.textContent=fmt(SET[key]);el.oninput=()=>{SET[key]=+el.value;out.textContent=fmt(SET[key]);saveSet();apply&&apply()}};
  sl('sSens','sens',v=>(+v).toFixed(2));sl('sVol','vol',v=>Math.round(v*100)+'%',()=>auVol(SET.vol));sl('sFov','fov',v=>v+'°',applyQuality);
  $('sQual').value=SET.qual;$('sQual').onchange=()=>{SET.qual=+$('sQual').value;saveSet();applyQuality()};
  $('sFps').checked=!!SET.fps;$('sFps').onchange=()=>{SET.fps=$('sFps').checked;saveSet();$('fps').classList.toggle('hide',!SET.fps)};$('fps').classList.toggle('hide',!SET.fps);
  $('lockmsg').addEventListener('click',()=>reqLock());
  addEventListener('beforeunload',()=>{try{NET.peer&&NET.peer.destroy()}catch(e){}})}
function openSettings(){show('settings')}

// ===================================================================== main loop
let lastT=performance.now(),fpsN=0,fpsAcc=0,lastFrameAt=performance.now();GAME.fps=0;
// Browsers stop requestAnimationFrame in hidden tabs. A worker timer keeps a host's world (and its
// snapshots to the crew) running while the host's tab is in the background.
(()=>{try{const w=new Worker(URL.createObjectURL(new Blob(['setInterval(()=>postMessage(0),50)'],{type:'text/javascript'})));let last=performance.now();
  w.onmessage=()=>{const now=performance.now(),dt=Math.min(.1,(now-last)/1000);last=now;if(now-lastFrameAt<200)return;
    if(GAME.on&&S&&NET.mode==='host'){simUpdate(dt);drainEvents();applyColliders();netTick(dt)}}}catch(e){}})();
const _ld=new THREE.Vector3();
function frame(now){requestAnimationFrame(frame);let dt=(now-lastT)/1000;lastT=now;lastFrameAt=performance.now();if(!(dt>0))dt=.016;dt=Math.min(dt,.05);const time=now/1000;
  fpsN++;fpsAcc+=dt;if(fpsAcc>=.5){GAME.fps=Math.round(fpsN/fpsAcc);fpsN=0;fpsAcc=0}
  let near=99;
  if(GAME.on&&S){
    if(NET.mode!=='client'&&!GAME.paused)simUpdate(dt);
    if(!GAME.paused)localUpdate(dt);
    drainEvents();syncWorld(dt,time);netTick(dt);hud(dt);near=updFear(dt);checkOver(dt);
    const me=S.players[NET.myId];
    FL.intensity=ME.scare?(Math.random()<.45?7:.5):(ME.lightOn()&&me&&!me.dead?30*ME.flick:0);
    SCARE_L.intensity=ME.scare?(Math.random()<.3?.6:4):0;
    VM.g.visible=!!(me&&!me.dead);VM.lens.material.color.setScalar(ME.lightOn()?ME.flick:.15);
    BAYV.chargeLed.material.color.set(ME.charging?(Math.sin(time*12)>0?0x37ff8a:0x0a3a1a):0x37ff8a);
  }else{ // title screen: drift through the dark dock
    const t=time*.05;camera.position.set(Math.sin(t)*7,2.1+Math.sin(t*1.7)*.2,-8+Math.cos(t*.8)*2);camera.rotation.set(-.08,Math.sin(t*.9)*.6,0);
    FL.intensity=0;SCARE_L.intensity=0;VM.g.visible=false;ME.fear=0;
  }
  syncLamps(dt);
  POST.uniforms.time.value=time;POST.uniforms.hurt.value=ME.hurt;POST.uniforms.flash.value=ME.flash;POST.uniforms.fear.value=ME.fear;
  const me=S&&S.players[NET.myId];POST.uniforms.lowhp.value=me&&!me.dead?clamp((40-me.hp)/40,0,1):0;POST.uniforms.dead.value=me&&me.dead?Math.min(1,ME.deathT/1.5)*(ME.deathT<2.2?1:.35):0;
  FL.getWorldPosition(DUST.uniforms.lp.value);FL.target.getWorldPosition(_ld);DUST.uniforms.ld.value.copy(_ld).sub(DUST.uniforms.lp.value).normalize();DUST.uniforms.cp.value.copy(camera.position);
  DUST.uniforms.on.value=FL.intensity>1?Math.min(1,FL.intensity/30):0;DUST.uniforms.time.value=time;
  if(AU.ready){auListener();if(AU.amb)AU.amb.set(GAME.on?.16+ME.fear*.1:.12,1);
    AU.ambT-=dt;if(AU.ambT<=0){AU.ambT=rand(7,20);const a=rand(0,TAU),d=rand(10,24);SFX.creak({x:camera.position.x+Math.cos(a)*d,y:rand(2,6),z:camera.position.z+Math.sin(a)*d})}}
  renderer.setRenderTarget(RT);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(postScene,postCam)}

async function init(){
  try{await Promise.race([Promise.all([document.fonts.load("40px 'Special Elite'"),document.fonts.load("40px 'Creepster'")]),new Promise(r=>setTimeout(r,2500))])}catch(e){}
  MAT.eye.fog=false;
  buildWorld();buildViewModel();
  for(let i=0;i<BAYS.length;i++){const g=makeTrailer();ROOT.add(g);TV.push({g,eng:null,beep:null,door:null,pd:0})}
  applyQuality();bindUI();
  renderer.compile(scene,camera);
  $('loading').classList.add('hide');requestAnimationFrame(frame);
  window.GS={get S(){return S},ME,NET,GAME,HOST,SLOTS,COL,act,doAct,camera,renderer,scene,BM,MV,AV,LAMPS,BAYS,TV,spawnTruck,spawnStalker,startScare,simUpdate,localUpdate,drainEvents,AU,SFX,EVQ,
    shot(){renderer.setRenderTarget(RT);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(postScene,postCam);return canvas.toDataURL('image/jpeg',.85)}}}
init().catch(e=>{console.error(e);$('loading').textContent='Something went wrong while loading: '+(e&&e.message||e)});
