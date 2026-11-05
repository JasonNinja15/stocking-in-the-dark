// ===================================================================== post-processing: depth outlines, grade, grain, scares
const RT=new THREE.WebGLRenderTarget(4,4,{type:THREE.HalfFloatType,depthBuffer:true});
RT.depthTexture=new THREE.DepthTexture(4,4);RT.depthTexture.type=THREE.UnsignedIntType;
const POST=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,
  uniforms:{tCol:{value:RT.texture},tDep:{value:RT.depthTexture},res:{value:new THREE.Vector2(4,4)},time:{value:0},near:{value:camera.near},far:{value:camera.far},
    hurt:{value:0},flash:{value:0},fear:{value:0},lowhp:{value:0},dead:{value:0},edgeW:{value:1},scan:{value:0},eLo:{value:.02},eHi:{value:.07},eFar:{value:11},eOn:{value:1},scanK:{value:1}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
  fragmentShader:`precision highp float;uniform sampler2D tCol,tDep;uniform vec2 res;uniform float time,near,far,hurt,flash,fear,lowhp,dead,edgeW,scan,eLo,eHi,eFar,eOn,scanK;varying vec2 vUv;
  float W(vec2 uv){float d=texture2D(tDep,uv).r;float vz=(near*far)/((far-near)*d-far);return -1.0/vz;}
  float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
  void main(){vec2 uv=vUv;
    uv+=vec2(sin(uv.y*38.0+time*6.0),cos(uv.x*29.0+time*4.3))*0.0016*fear;
    vec2 px=edgeW/res;float c=W(uv);
    float lap=abs(W(uv-vec2(px.x,0.))+W(uv+vec2(px.x,0.))+W(uv-vec2(0.,px.y))+W(uv+vec2(0.,px.y))-4.0*c)/max(c,1e-5);
    // outlines fade out with the fog, so nothing far away shows up as a silhouette against lamp glow
    float zl=1.0/max(c,1e-5);float edge=smoothstep(eLo,eHi,lap)*(1.0-smoothstep(eFar*.55,eFar,zl))*eOn;
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
    float sl=sin(vUv.y*res.y*1.6+time*30.)*.5+.5;col*=1.0-sl*.035*scanK*(1.0+fear);
    col=floor(col*40.+.5)/40.;
    col=mix(col,vec3(1.,.96,.92),flash);
    col=mix(col,vec3(lum*.55,0.,0.),dead*.75);
    col=mix(col,vec3(lum*.25,lum*.4,lum*.9+.03),scan*.85); // thermal scanner: the world goes cold blue
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
  // outlines: phones often keep depth at lower precision, which shows up as stray lines on flat floors and walls, and they
  // stretch the picture up to the screen, which turns the scanlines into stripes. Soft ignores small depth steps, keeps outlines
  // close up, and drops the scanlines. Auto picks Soft on touch screens.
  {const m=SET.outl||'auto',mob=TOUCH.on||matchMedia('(pointer:coarse)').matches,o=m==='auto'?(mob?'soft':'on'):m,U=POST.uniforms;
   U.eOn.value=o==='off'?0:1;U.eLo.value=o==='soft'?.075:.02;U.eHi.value=o==='soft'?.17:.07;U.eFar.value=o==='soft'?7.5:11;U.scanK.value=o==='on'?1:0}
  const shadows=q>0,ms=q===2?1024:512;if(FL.castShadow!==shadows||FL.shadow.mapSize.x!==ms){FL.castShadow=shadows;FL.shadow.mapSize.set(ms,ms);if(FL.shadow.map){FL.shadow.map.dispose();FL.shadow.map=null}}
  DUST.uniforms.px.value=h/900;
  camera.aspect=innerWidth/innerHeight;camera.fov=+SET.fov;camera.updateProjectionMatrix()}
addEventListener('resize',applyQuality);

// ===================================================================== local player
const GAME={on:false,paused:false,overShown:false,overT:0,wasLocked:false,hints:{},hudT:0};
const ME={x:0,z:-15.5,yaw:0,pitch:0,vx:0,vz:0,stam:100,exh:false,bat:100,light:true,bob:0,stepPh:0,kickCD:0,kickA:0,scare:null,shake:0,hurt:0,flash:0,fear:0,specId:'',lastHp:100,target:null,deathT:0,charging:false,beatT:0,flick:1,
  lightOn(){return this.light&&this.bat>0}};
const K={};
// touch screens (phones, tablets) get on-screen controls instead of the mouse lock; Settings can force it either way
const TOUCH={on:false};const TJ={x:0,y:0,run:false}; // TJ: the touch stick, x right, y down, -1..1
const locked=()=>TOUCH.on||document.pointerLockElement===canvas;
// both the keyboard and the touch stick drive these: forward and right, -1..1 (the stick gives in-between values)
function moveAxes(){return[clamp((K.KeyW||K.ArrowUp?1:0)-(K.KeyS||K.ArrowDown?1:0)-TJ.y,-1,1),clamp((K.KeyD||K.ArrowRight?1:0)-(K.KeyA||K.ArrowLeft?1:0)+TJ.x,-1,1)]}
function reqLock(){if(TOUCH.on)return;try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{})}catch(e){}}
// ---- rebindable keys. The game reads every action by its default key; a rebinding turns the key you actually
// pressed into the default key of the action it's bound to (and the action's old key into nothing).
const BINDS=[['fwd','Move forward','KeyW'],['back','Move back','KeyS'],['left','Move left','KeyA'],['right','Move right','KeyD'],['run','Run','ShiftLeft'],
  ['use','Use, pick up, shelve','KeyE'],['kick','Kick','KeyQ'],['drop','Set a box down','KeyG'],['light','Flashlight','KeyF'],['lamp','Red headlamp','KeyH'],['shake','Shake flashlight (hold)','KeyR'],['item','Use the picked item (hold for the scanner)','Space']];
let KEYMAP={};
const boundKey=id=>{const b=BINDS.find(x=>x[0]===id);return(SET.keys&&SET.keys[id])||b[2]};
function buildKeymap(){KEYMAP={};
  for(const [id,,def] of BINDS){const k=boundKey(id);if(k===def)continue;KEYMAP[k]=def;if(!(def in KEYMAP))KEYMAP[def]=null;if(id==='run'&&!('ShiftRight' in KEYMAP))KEYMAP.ShiftRight=null}
  const kh=$('keyhint');if(kh)kh.textContent=`${['fwd','left','back','right'].map(i=>keyName(boundKey(i))).join('')} move · ${keyName(boundKey('run'))} run · ${keyName(boundKey('light'))} flashlight · ${keyName(boundKey('use'))} use · ${keyName(boundKey('kick'))} kick · ${keyName(boundKey('drop'))} set down · scroll + right click or ${keyName(boundKey('item'))} items · Esc pause`}
const mapKey=c=>c in KEYMAP?KEYMAP[c]:c;
function keyName(c){if(!c)return'?';if(/^Key.$/.test(c))return c.slice(3);if(/^Digit.$/.test(c))return c.slice(5);
  return{ShiftLeft:'L-Shift',ShiftRight:'R-Shift',ControlLeft:'L-Ctrl',ControlRight:'R-Ctrl',AltLeft:'L-Alt',AltRight:'R-Alt',Space:'Space',Tab:'Tab',CapsLock:'Caps',
    ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',Backquote:'`',Minus:'-',Equal:'=',BracketLeft:'[',BracketRight:']',Semicolon:';',Quote:"'",Comma:',',Period:'.',Slash:'/',Backslash:'\\'}[c]||c.replace(/^Numpad/,'Num ')}
// the key you'd press for a default-key action, as text (for prompts and messages)
const TLAB={KeyE:'USE',KeyQ:'KICK',KeyG:'DROP',KeyF:'LIGHT',KeyH:'LAMP',KeyR:'SHAKE',Space:'ITEM'};
const keyLabel=def=>{if(TOUCH.on&&TLAB[def])return TLAB[def];const b=BINDS.find(x=>x[2]===def);return keyName(b?boundKey(b[0]):def)};
const relabel=s=>s.replace(/<kbd>([EQGFHR])<\/kbd>/g,(m,c)=>`<kbd>${keyLabel('Key'+c)}</kbd>`).replace(/<kbd>Right click<\/kbd>/g,()=>TOUCH.on?'<kbd>ITEM</kbd>':'<kbd>Right click</kbd>');
let REBIND=null; // the action waiting for a key in Settings
addEventListener('keydown',e=>{if(!REBIND)return;e.preventDefault();e.stopImmediatePropagation();
  if(e.code!=='Escape'){const id=REBIND,old=boundKey(id),other=BINDS.find(b=>b[0]!==id&&boundKey(b[0])===e.code);SET.keys=SET.keys||{};SET.keys[id]=e.code;if(other)SET.keys[other[0]]=old;saveSet();buildKeymap()}
  REBIND=null;renderBinds()},true);
addEventListener('keydown',e=>{if(e.target&&e.target.tagName==='INPUT')return;const code=mapKey(e.code);if(code===null)return;K[code]=true;
  if(!e.repeat)keyPress(code);
  if(GAME.on&&['Space','Tab','KeyF','KeyQ','KeyE','KeyG','KeyH'].includes(code))e.preventDefault()});
// a key (or touch button) going down: spectating, it switches whose view you watch
function keyPress(code){if(!GAME.on||GAME.paused)return;const me=S&&S.players[NET.myId];
  if(me&&me.dead&&S.phase==='play'){if(['Space','ArrowRight','KeyD','KeyE'].includes(code))specCycle(1);else if(['ArrowLeft','KeyA','KeyQ'].includes(code))specCycle(-1)}else onKey(code)}
addEventListener('keyup',e=>{const code=mapKey(e.code);if(code)K[code]=false});
addEventListener('blur',()=>{for(const k in K)K[k]=false});
// Chrome sometimes reports one wildly wrong mouse movement while the pointer is locked (most often just after it locks,
// or when the window gets focus back), which snaps the camera round. Skip the first few events after locking, and any
// single event that moves further than a hand plausibly could in one go.
let lookSkip=0;
document.addEventListener('mousemove',e=>{if(!GAME.on||!locked()||GAME.paused)return;if(lookSkip>0){lookSkip--;return}
  const mx=e.movementX,my=e.movementY;if(Math.abs(mx)>Math.max(250,innerWidth*.3)||Math.abs(my)>Math.max(200,innerHeight*.3))return;
  const s=.0021*SET.sens;ME.yaw-=mx*s;ME.pitch=clamp(ME.pitch-my*s,-1.45,1.45)});
addEventListener('focus',()=>{lookSkip=3});
canvas.addEventListener('mousedown',e=>{auInit();if(!GAME.on)return;if(!locked()){reqLock();return}
  const me=S&&S.players[NET.myId];if(me&&me.dead){specCycle(e.button===2?-1:1);return}
  if(e.button===0)onKey('KeyE');else if(e.button===2){K.Mouse2=true;onKey('UseItem')}});
addEventListener('mouseup',e=>{if(e.button===2)K.Mouse2=false});
// the scroll wheel walks the item hotbar
canvas.addEventListener('wheel',e=>{if(!GAME.on||!locked()||GAME.paused)return;e.preventDefault();if(e.deltaY)scrollItem(Math.sign(e.deltaY))},{passive:false});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
// between nights (a saved run picks up in the shop) the mouse stays free: a lock the browser grants late used to
// hide the shop and leave nothing on screen, with no way to move
document.addEventListener('pointerlockchange',()=>{if(locked()&&S&&S.phase==='shop'&&GAME.on){if(document.pointerLockElement)document.exitPointerLock();return}
  if(locked()){lookSkip=3;GAME.wasLocked=true;$('lockmsg').classList.add('hide');if(GAME.on){hideScreens();GAME.paused=false}}
  else if(GAME.on&&!GAME.overShown&&!(S&&S.phase==='shop')){showPause()}});

function onKey(code){const me=S&&S.players[NET.myId];if(!me||me.dead||ME.scare||S.phase!=='play')return;
  if(ME.grab){if(['KeyE','KeyQ','Space'].includes(code))struggle();return}
  if(code!=='KeyF'&&onKey2(code,me))return;
  if(code==='KeyF'){if(ME.bat>0)ME.light=!ME.light;SFX.click();return}
  if(code==='KeyE'){const t=ME.target;if(!t)return;
    if(t.kind==='box')doAct({a:'pick',b:t.b.id});
    else if(t.kind==='slot'){if(t.ok)doAct({a:'place',s:t.s.id});else SFX.deny()}
    else if(t.kind==='panel'){const tr=S.trucks[t.bay];if(tr.st===2||(tr.st===0&&tr.stuck>0)||!bayOn(t.bay))doAct({a:'panel',b:t.bay});else SFX.deny()}
    else if(t.kind==='aid')doAct({a:'aid'});
    else if(t.kind==='exit'){SFX.locked();toast('Locked. Nobody leaves before 6:00 AM.')}
    return}
  if(code==='KeyQ'){if(ME.kickCD>0)return;ME.kickCD=.8;ME.kickA=.35;const t=ME.target;if(t&&t.kind==='box')doAct({a:'kick',b:t.b.id});else{const b=kickAim();if(b)doAct({a:'kick',b:b.id})}return}
  if(code==='KeyG'){if(me.carry<0)return;const fx=-Math.sin(ME.yaw),fz=-Math.cos(ME.yaw);doAct({a:'drop',x:r2(ME.x+fx*.9),z:r2(ME.z+fz*.9),ry:r2(ME.yaw)});return}}

// a kick with no box under the crosshair still hits the nearest loose box at your feet in front of you
function kickAim(){const fx=-Math.sin(ME.yaw),fz=-Math.cos(ME.yaw);let best=null,bs=1e9;
  for(const b of S.boxes){if((b.st!==0&&b.st!==3)||b.amr)continue;const w=boxWorld(b);if(w.y>1.2)continue;const dx=w.x-ME.x,dz=w.z-ME.z,d=Math.hypot(dx,dz);if(d>1.9||d<.01)continue;
    const c=(dx*fx+dz*fz)/d;if(c<.45)continue;const sc=d*(2-c);if(sc<bs){bs=sc;best=b}}
  return best}
const RC=new THREE.Raycaster();const _v=new THREE.Vector3(),_v2=new THREE.Vector3();
function rayBox(ray,x0,y0,z0,x1,y1,z1){const o=ray.origin,d=ray.direction;let t0=0,t1=1e9;
  for(const [oo,dd,a,b] of[[o.x,d.x,x0,x1],[o.y,d.y,y0,y1],[o.z,d.z,z0,z1]]){if(Math.abs(dd)<1e-9){if(oo<a||oo>b)return null;continue}let ta=(a-oo)/dd,tb=(b-oo)/dd;if(ta>tb)[ta,tb]=[tb,ta];t0=Math.max(t0,ta);t1=Math.min(t1,tb);if(t0>t1)return null}return t0}
let BOXPICK=[];
const GHOST=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1,1,1).translate(0,.5,0)),new THREE.LineBasicMaterial({color:0x9dff9a,transparent:true,opacity:.75,fog:false,depthWrite:false}));GHOST.visible=false;scene.add(GHOST);
function updGhost(me){const t=ME.target;const b=t&&t.kind==='slot'&&me&&me.carry>=0?S.boxes.find(x=>x.id===me.carry):null;GHOST.visible=!!b;if(!b)return;
  const K=BOX_KINDS[b.k];GHOST.scale.set(t.s.rot&&!t.under?K.d:K.w,K.h,t.s.rot&&!t.under?K.w:K.d);if(t.under){GHOST.position.set(t.under.x,t.under.y+BOX_KINDS[t.under.k].h+.01,t.under.z);GHOST.rotation.y=t.under.ry}else{GHOST.position.set(t.s.x,t.s.y+.01,t.s.z);GHOST.rotation.y=0}GHOST.material.color.set(t.ok?0x9dff9a:0xff6a5a);GHOST.material.opacity=.45+Math.sin(performance.now()/160)*.25}
function findTarget(me){ME.target=null;GHOST.visible=false;if(!me||me.dead||ME.scare)return;
  RC.setFromCamera({x:0,y:0},camera);RC.far=3.1;const carrying=me.carry>=0;
  // in the forklift: pallets first; with no pallet up, loose boxes and shelf slots out past the forks
  const drv=ME.driving,reach=drv?4.8:3.3,many=(me.up&&me.up.hand)||drv;
  if(drv){ME.target=S.fork.pal>=0||!carrying?forkTarget():null;if(ME.target||S.fork.pal>=0)return;RC.far=reach}
  if(carrying){let best=null,bt=reach;for(const s of SLOTS){if(Math.abs(s.x-ME.x)>6||Math.abs(s.z-ME.z)>6||(drv&&s.cold)||!slotOn(s))continue;const hx=s.rot?.55:.97,hz=s.rot?.97:.55;const t=rayBox(RC.ray,s.x-hx,s.y,s.z-hz,s.x+hx,s.y+1.08,s.z+hz);if(t!==null&&t<bt){bt=t;best=s}}
    const cb=S.boxes.find(x=>x.id===me.carry),ret=!!(cb&&cb.ret);
    if(best){const under=best.box>=0?S.boxes.find(x=>x.id===best.box):null,stack=!!under&&!(best.box2>=0)&&canStack(me,under,cb);
      ME.target={kind:'slot',s:best,ok:!ret&&!best.old&&(best.box===-1||stack),ret,stack,under:stack?under:null,full:best.box2>=0||!!under&&!stack&&!!(me.up&&me.up.stock2)};return}}
  const hits=RC.intersectObjects(BOXPICK.concat(INTER,PARCELPICK,PALPICK,FORKPICK),false);
  for(const h of hits){const ud=h.object.userData;if(!shown(h.object)||(drv&&ud.kind!=='box'))continue;
    // (parcels ride on top of the belt, inside its collider, so they can't be hidden behind it)
    if(ud.kind!=='parcel'&&segBlocked(ME.x,ME.z,h.point.x-(h.point.x-ME.x)*.08,h.point.z-(h.point.z-ME.z)*.08))break;
    if(ud.kind==='box'){const b=S.boxes.find(x=>x.id===ud.id);if(b&&(b.st===1||b.amr))continue; /* (the robots' loads aren't yours to grab) */if(!b||b.st===2)break;if(!carrying||(many&&(me.stack||[]).length<2))ME.target={kind:'box',b};break}
    if(findTarget2(me,h))break;if(ud.kind)ME.target={kind:ud.kind,bay:ud.bay};break}}

function localUpdate(dt){const me=S.players[NET.myId];if(!me)return;
  if(me.hp<ME.lastHp-(chilled()?1.5:.5)){ME.hurt=Math.min(1,ME.hurt+.9);if(!ME.scare)SFX.hurt()}ME.lastHp=me.hp;
  ME.hurt=Math.max(0,ME.hurt-dt*.7);ME.flash=Math.max(0,ME.flash-dt*2.2);ME.kickCD-=dt;ME.kickA=Math.max(0,ME.kickA-dt);
  if(ME.scare)updScare(dt);else ME.shake=Math.max(0,ME.shake-dt*1.4);
  if(me.dead){ME.deathT+=dt;spectate(dt);findTarget(null);return}
  ME.deathT=0;localUpdate2(dt,me);if(grabUpdate(dt,me)||rgHeld(dt,me)){findTarget(null);return}
  const busy=!!ME.scare||S.phase!=='play';
  if(ME.driving){driveUpdate(dt,me);batteryUpdate(dt,busy,me);findTarget(me);return}
  const ax=moveAxes(),fw=busy?0:ax[0],st=busy?0:ax[1];
  // a stack (carry upgrade) is heavier; a jerry can slows you a little
  const carry=me.carry>=0?S.boxes.find(b=>b.id===me.carry):null,slow=(carry?BOX_KINDS[carry.k].slow:1)*Math.pow(.85,me.stack?me.stack.length:0)*(me.can?.9:1);
  const moving=fw||st,run=(K.ShiftLeft||K.ShiftRight||TJ.run)&&fw>0&&!ME.exh&&ME.stam>0;
  const spd=(run?5.3:3.05)*slow;
  const sx=-Math.sin(ME.yaw),sz=-Math.cos(ME.yaw),rx=Math.cos(ME.yaw),rz=-Math.sin(ME.yaw);
  let tx=sx*fw+rx*st,tz=sz*fw+rz*st;const tl=Math.hypot(tx,tz);if(tl>0){const m=Math.min(1,tl);tx=tx/tl*spd*m;tz=tz/tl*spd*m} // a half-pushed stick walks slower
  ME.vx=damp(ME.vx,tx,10,dt);ME.vz=damp(ME.vz,tz,10,dt);
  const p={x:ME.x+ME.vx*dt,z:ME.z+ME.vz*dt};collideCircle(p,.32);
  // never strand anyone outside: if the trailer they're in isn't docked, put them back by the bay door
  // the basement is its own room, far off to the east
  if(ME.x>60){p.x=clamp(p.x,BASE.x0+.3,BASE.x1-.3);p.z=clamp(p.z,BASE.z0+.3,BASE.z1-.3)}
  else if(onRoof(ME)){p.x=clamp(p.x,ROOF.x0+.5,ROOF.x1-.5);p.z=clamp(p.z,ROOF.z0+.5,ROOF.z1-.5)} // up on the roof, the parapet stops you
  else{if(p.z<WH.z0-.3){let bi=-1;for(let i=0;i<BAYS.length;i++)if(Math.abs(p.x-BAYS[i].x)<TRAIL_HW+.4)bi=i;
      const tr=bi>=0?S.trucks[bi]:null;if(!tr||(tr.st!==2&&tr.st!==3)){if(bi>=0)p.x=BAYS[bi].x;p.z=WH.z0+1.2}}
    p.x=clamp(p.x,WH.x0+.3,WH.x1-.3);p.z=clamp(p.z,TZ_DOCK-TRAIL_LEN+.3,WH.z1-.3)}
  const sp=Math.hypot(p.x-ME.x,p.z-ME.z)/Math.max(dt,1e-4);ME.x=p.x;ME.z=p.z;
  const fit=me&&me.up?(me.up.stam4?3.3:me.up.stam3?2.6:me.up.stam2?2:me.up.stam?1.5:1):1; // the stamina upgrades
  if(run&&sp>1){if(!(ME.drinkT>0))ME.stam-=dt*21/fit;if(ME.stam<=0){ME.stam=0;ME.exh=true}}else{ME.stam=Math.min(100,ME.stam+dt*(moving?10:16)*fit);if(ME.exh&&ME.stam>35)ME.exh=false}
  // head bob + footsteps
  if(sp>.3){const ph0=ME.stepPh;ME.stepPh+=dt*sp*(run?1.9:2.15);if(Math.floor(ph0/Math.PI)!==Math.floor(ME.stepPh/Math.PI))(onRoof(ME)?SFX.crunch(run):SFX.step(ME.z<WH.z0,run))}
  ME.bob=damp(ME.bob,sp>.3?1:0,6,dt);
  batteryUpdate(dt,busy,me);
  if(carry&&!GAME.hints.carry&&S.night===1){GAME.hints.carry=1;toast('Look at an empty shelf and press E to shelve it.',4.5)}
  // camera
  const bobY=Math.sin(ME.stepPh*2)*.045*ME.bob*(run?1.4:1),bobX=Math.cos(ME.stepPh)*.03*ME.bob;
  camera.position.set(ME.x+rx*bobX,1.62+bobY-(carry?.03:0),ME.z+rz*bobX);
  const sh=ME.shake*ME.shake;camera.rotation.set(ME.pitch-ME.kickA*.25+rand(-1,1)*sh*.05,ME.yaw+rand(-1,1)*sh*.05,rand(-1,1)*sh*.06);
  const shk=ME.shaking?Math.sin(performance.now()*.045)*.05:0; // pumping the shake flashlight
  VM.g.position.set(bobX*.3,bobY*.4-ME.kickA*.15+shk,0);
  me.x=ME.x;me.z=ME.z;me.yaw=ME.yaw;me.pitch=ME.pitch;me.light=ME.lightOn();
  findTarget(me);updGhost(me);}
function batteryUpdate(dt,busy,me){
  ME.charging=false;ME.shaking=false;
  // the shake flashlight: hold R to charge it anywhere, loudly
  if(K.KeyR&&!busy&&me.up&&me.up.shake&&!ME.driving){ME.charging=ME.shaking=true;ME.bat=Math.min(100,ME.bat+dt*7);ME.shakeT=(ME.shakeT||0)-dt;if(ME.shakeT<=0){ME.shakeT=.45;SFX.shake();doAct({a:'shake'})}}
  // holding E at the charger counts as charging even when full, so the battery never drains there
  else if(ME.target&&ME.target.kind==='charger'&&K.KeyE&&!busy){ME.charging=true;if(ME.bat<100){ME.bat=Math.min(100,ME.bat+dt*(mainsDown()?2.4:24)); /* a tenth of the speed in an outage */if(Math.random()<dt*6)SFX.charge()}}
  if(ME.lightOn()&&!ME.charging){ME.bat=Math.max(0,ME.bat-dt*(me.up&&me.up.fl2?.3:.6));if(ME.bat<=0){ME.light=false;SFX.click();toast('Your flashlight died.')}}
  if(ME.bat<25&&!GAME.hints.bat){GAME.hints.bat=1;toast('Battery low. Hold E at the charging dock between the bays.',5)}}

// ---- spectating: a third-person camera behind a crewmate who's still alive. The mouse orbits it;
// click, Space or the arrow keys switch to the next one. If they go down, it moves on to someone else.
const specList=()=>Object.values(S.players).filter(p=>!p.dead&&p.id!==NET.myId);
function specTarget(){const a=specList();return a.find(p=>p.id===ME.specId)||a[0]||null}
function specCycle(d){const a=specList();if(!a.length)return;const i=a.findIndex(p=>p.id===ME.specId);ME.specId=a[((i<0?0:i+d)%a.length+a.length)%a.length].id;ME.specSnap=true}
// can the camera sit here? (inside the walls, out of the racks, in a docked trailer or the basement)
function camFree(x,y,z){if(y<.25||insideAny(x,z,.18))return false;
  if(x>60)return x>BASE.x0+.2&&x<BASE.x1-.2&&z>BASE.z0+.2&&z<BASE.z1-.2&&y<3;
  if(x<WH.x0+.2||x>WH.x1-.2||z>WH.z1-.2||y>WH.h-.3)return false;
  if(z<WH.z0+.2)return BAYS.some((b,i)=>(S.trucks[i].st===2||S.trucks[i].st===3)&&Math.abs(x-b.x)<TRAIL_HW-.2&&z>S.trucks[i].z-TRAIL_LEN+.3&&y<TRAIL_H-.2);
  return true}
function spectate(dt){const p=specTarget();
  if(ME.deathT<2.2||!p){ // fall to the floor
    const k=Math.min(1,ME.deathT/1.2);camera.position.set(ME.x,lerp(1.62,.25,easeOut(k)),ME.z);camera.rotation.set(lerp(ME.pitch,-.2,k),ME.yaw,lerp(0,1.2,easeOut(k)));return}
  if(p.id!==ME.specId){ME.specId=p.id;ME.specSnap=true}
  const v=AV.get(p.id);if(!v)return;
  if(ME.specSnap){ME.specSnap=false;ME.yaw=v.yaw;ME.pitch=-.3;ME.specD=.5}
  ME.pitch=clamp(ME.pitch,-1.1,.5);
  const fx=v.x,fy=(S.fork&&S.fork.drv===p.id?2.1:1.45),fz=v.z,cp=Math.cos(ME.pitch),bx=Math.sin(ME.yaw)*cp,by=-Math.sin(ME.pitch),bz=Math.cos(ME.yaw)*cp;
  // pull in toward them wherever a wall or shelf is in the way
  let d=.4;while(d<3.4&&camFree(fx+bx*(d+.1),fy+by*(d+.1),fz+bz*(d+.1)))d+=.1;
  ME.specD=d<(ME.specD||0)?d:damp(ME.specD||d,d,3,dt);
  camera.position.set(fx+bx*ME.specD,fy+by*ME.specD,fz+bz*ME.specD);camera.lookAt(fx,fy,fz)}

// ---- jumpscares
function startScare(ty){if(ME.scare){camera.remove(ME.scare.g)}
  const g=makeScare2(ty)||(ty===1?makeLurker():ty===2?makeStalker():ty===3?makeCrawler():makeMimic(1,randi(0,3),false));g.traverse(o=>{if(o.isMesh){o.castShadow=false;o.renderOrder=6}});
  camera.add(g);ME.scare={t:0,ty,g};toastT=0;bigT=0;SCARE_L.color.set([2,3,6,9,10].includes(ty)?0x9fb4ff:0xff5a3a);SFX.scare(ty);ME.flash=.9;ME.shake=1;ME.fear=1}
const _q=new THREE.Quaternion();
function updScare(dt){const s=ME.scare,g=s.g,ud=g.userData;s.t+=dt;const k=s.t;
  const lunge=d=>easeOut(Math.min(1,k/d));
  if(s.ty>=4)updScare2(s,k,lunge);
  else if(s.ty===1){g.position.set(rand(-.02,.02),-2.3,lerp(-2.9,-1.55,lunge(.2)));ud.body.position.y=-.1;ud.torso.rotation.x=.45;ud.neck.rotation.x=.25;
    ud.head.rotation.set(-1.0,0,Math.sin(k*23)*.06+.18);ud.jaw.rotation.x=Math.min(.95,k*5);
    ud.arms.forEach((a,i)=>{a.rotation.x=-2.3;a.rotation.z=(i?-1:1)*.55;a.userData.el.rotation.x=-.5});ud.legs.forEach(l=>{l.th.rotation.x=-1.2;l.kn.rotation.x=1.6})}
  else if(s.ty===3){ // drops from above: upside down, face to face
    g.position.set(rand(-.01,.01),lerp(1.9,.66,lunge(.16)),-.06);g.rotation.y=Math.PI;ud.orient.rotation.set(0,0,Math.PI);ud.head.rotation.set(-.1,Math.PI,Math.sin(k*19)*.08);ud.neck.rotation.x=0;
    ud.limbs.forEach(l=>{l.sh.rotation.y=l.s*(l.ph?-.6:.6);l.el.rotation.z=l.s*-.5});ud.hair.quaternion.copy(ud.head.getWorldQuaternion(_q).invert()).multiply(camera.quaternion)} // hair hangs toward the bottom of the screen
  else if(s.ty===2){g.position.set(rand(-.015,.015),-2.5,lerp(-1.4,-.78,lunge(.16)));ud.torso.rotation.x=.05;ud.head.rotation.set(Math.sin(k*31)*.08,0,Math.sin(k*42)*.16+.25);
    ud.arms.forEach((a,i)=>{a.rotation.x=-1.45;a.rotation.z=(i?-1:1)*.62;a.userData.el.rotation.x=-.7})}
  else{g.position.set(rand(-.02,.02),-.38,lerp(-2.1,-1.55,lunge(.14)));g.rotation.x=1.2;ud.lids.forEach(l=>l.p.rotation.x=l.s*(.95+Math.sin(k*40)*.25));
    ud.legs.forEach(l=>{l.hip.rotation.x=Math.sin(k*30+l.ph)*.8})}
  ME.shake=Math.max(0,1-k/1.3);
  if(k>1.3){camera.remove(g);ME.scare=null;ME.shake=0}}

// ===================================================================== world sync (host and clients both render from S)
const TV=[];const BM=new Map(),MV=new Map(),AV=new Map();
function syncTrucks(dt){S.trucks.forEach((tr,i)=>{const v=TV[i],b=BAYS[i],bv=BAYV[i];
  if(NET.mode==='client'&&tr.tz!==undefined)tr.z=damp(tr.z,tr.tz,9,dt); // glide between snapshots (the boxes inside ride along)
  v.g.visible=tr.st!==0;v.g.position.set(b.x,0,tr.z);const fm=tr.claw?MAT.ribsClaw:b.reefer?MAT.reefer:MAT.ribs;if(v.g.userData.front.material!==fm)v.g.userData.front.material=fm;
  const pnl=bv.door.children[0],h=Math.max(.06,DOOR_H*(1-tr.door));pnl.scale.y=h;pnl.position.y=DOOR_H-h/2;
  bv.ind.material.color.set(!bayOn(i)?0x140606:tr.stuck>0?(Math.sin(performance.now()/120)>0?0xff3020:0x3a0c0c):tr.st===2&&tr.door>=1?0x2aff6a:tr.st===0?0x3a0c0c:0xffa020);bv.scr.material.color.set(tr.st===2?0x1d8a3e:0x4a1410);
  if(AU.ready){if(!v.eng){v.eng=loop('engine',{x:b.x,y:1,z:tr.z},1);v.beep=loop('beep',{x:b.x,y:1,z:tr.z},1);v.door=loop('door',{x:b.x,y:3,z:WH.z0},1)}
    const moving=tr.st===1||(tr.st===3&&tr.door<=0);v.eng.pos({x:b.x,y:1,z:tr.z-TRAIL_LEN-1.5});v.eng.set(tr.st===0?0:moving?.85:.16,.35);
    v.beep.pos({x:b.x,y:1.5,z:tr.z-1});v.beep.set(tr.st===1&&tr.t>1?.16:0,.03);
    const dm=Math.abs(tr.door-v.pd)>1e-4;v.door.set(dm?.45:0,.04);v.pd=tr.door}})}
function syncBoxes(dt){const me=S.players[NET.myId];const live=new Set();
  for(const b of S.boxes){if(b.st===4)continue;live.add(b.id);let m=BM.get(b.id);if(!m){m=makeBoxMesh(b);BM.set(b.id,m);ROOT.add(m);m.userData.tw=0}
    if(b.st===1){const f=S.fork,onF=!!(f&&f.drv&&f.drv===b.h&&FORK3D),h=S.players[b.h];
      // the box in their arms (or on the forks), with anything stacked on top of it
      const pile=(h?[h.carry,...(h.stack||[]).slice().reverse()]:[]).map(id=>S.boxes.find(x=>x.id===id)).filter(Boolean),lv=Math.max(0,pile.indexOf(b));
      if(onF){let y=FORK3D.userData.lift.position.y+.08;for(let i=0;i<lv;i++)y+=BOX_KINDS[pile[i].k].h;const P=FORK3D.position,fr=FORK3D.rotation.y;        m.visible=true;m.position.set(P.x+Math.sin(fr)*1.45,y,P.z+Math.cos(fr)*1.45);m.rotation.set(0,fr+lv*.1,0);continue}
      if(b.h===NET.myId){m.visible=false;continue}const av=AV.get(b.h);if(!av||!av.g.visible){m.visible=false;continue}
      let y=.92-BOX_KINDS[(pile[0]||b).k].h*.4;for(let i=0;i<lv;i++)y+=BOX_KINDS[pile[i].k].h;
      m.visible=true;m.position.set(av.x-Math.sin(av.yaw)*.42,y,av.z-Math.cos(av.yaw)*.42);m.rotation.set(0,av.yaw+lv*.12,0);continue}
    m.visible=true;const w=boxWorld(b);m.position.set(w.x,w.y,w.z);m.rotation.set(0,b.ry,0);
    if(m.userData.tw>0){m.userData.tw-=dt;const k=m.userData.tw;m.rotation.z=Math.sin(k*70)*.07*Math.min(1,k*3);m.rotation.x=Math.cos(k*53)*.05*Math.min(1,k*3);m.position.y+=Math.abs(Math.sin(k*45))*.035}}
  for(const [id,m] of BM)if(!live.has(id)){ROOT.remove(m);BM.delete(id)}
  BOXPICK.length=0;for(const m of BM.values())if(m.visible)BOXPICK.push(m);
  const cb=me&&me.carry>=0?S.boxes.find(b=>b.id===me.carry):null;setViewBox(me&&!me.dead&&!ME.driving?cb:null)}
function syncMonsters(dt,time){const live=new Set();
  for(const m of S.mons){live.add(m.id);let v=MV.get(m.id);
    if(!v){const g=makeMonster2(m)||(m.ty===0?makeMimic(m.k,m.v,m.f):m.ty===1?makeLurker():m.ty===3?makeCrawler():makeStalker());if(m.ty===1&&m.k===1)coldify(g);g.position.set(m.x,m.y,m.z);g.rotation.y=m.ry;ROOT.add(g);
      v={g,ty:m.ty,lp:null,ph:Math.random()*10,a:0,fade:1};MV.set(m.id,v)}
    if(AU.ready&&!v.lp&&(m.ty===1||m.ty===2))v.lp=loop(m.ty===1?'breath':'whisper',{x:m.x,y:1.5,z:m.z},m.ty===1?1.3:1);
    if(AU.ready&&loopFor(m)){const [kind,vol]=loopFor(m);if(!v.l2)v.l2=loop(kind,{x:m.x,y:1,z:m.z},vol);v.l2.pos({x:v.g.position.x,y:v.g.position.y+1,z:v.g.position.z});v.l2.set(m.ty===12||m.a===2?1:0,.15)}
    if(AU.ready&&m.ty===1){if(!v.gr)v.gr=loop('growl',{x:m.x,y:1.6,z:m.z},1.4);v.gr.pos({x:v.g.position.x,y:1.6,z:v.g.position.z});v.gr.set(m.a===1?1:0,.12)} // growls for as long as the light is on it
    const g=v.g;if(Math.hypot(g.position.x-m.x,g.position.z-m.z,g.position.y-m.y)>3){g.position.set(m.x,m.y,m.z)}
    else{g.position.x=damp(g.position.x,m.x,15,dt);g.position.z=damp(g.position.z,m.z,15,dt);g.position.y=damp(g.position.y,m.y,15,dt)}
    g.rotation.y=angLerp(g.rotation.y,m.ry,dt*8);v.a=m.a;v.k=m.k;animMonster(v,dt,time);
    if(m.ty===3)g.visible=m.a!==0; // tucked away behind the blankets
    if(v.lp){v.lp.pos({x:g.position.x,y:1.5,z:g.position.z});
      if(m.ty===1)v.lp.set(m.a===0?.55:m.a===4?1:0,.25); // slow breathing in its sleep; awake, it makes no sound at all
      else{ // the stalker only whispers now and then, a little more often once it's close
        const d=Math.hypot(g.position.x-ME.x,g.position.z-ME.z);v.wt=(v.wt??rand(4,9))-dt;
        if(v.wt<=0){v.wb=rand(1.2,2.2);v.wt=v.wb+(d<7?rand(5,9):rand(11,20))}
        v.wb=Math.max(0,(v.wb||0)-dt);v.lp.set(v.wb>0?.8:0,.35)}}}
  for(const [id,v] of MV)if(!live.has(id)){ROOT.remove(v.g);v.lp&&v.lp.stop();v.gr&&v.gr.stop();v.l2&&v.l2.stop();MV.delete(id)}}
function animMonster(v,dt,time){const u=v.g.userData,t=time+v.ph;if(v.ty>=4){animMonster2(v,dt,time);return}
  if(v.ty===1){ // 0 asleep, 1 lit (growling), 2 creeping, 3 sitting up / frozen, 4 charging
    const a=v.a,move=a===2||a===4,gs=a===4?10:3.2;v.gp=(v.gp||0)+(move?dt*gs:0);const ph=v.gp,r=a===4?12:a===0?2:a===3?1.4:5;
    const T={0:{by:-.52,tor:1.5,nk:1.05,hx:.65,hz:.3,jaw:.04,sh:-.2,el:-1.6,th:-1.5,kn:2.2}, // curled up, head tucked
      1:{by:-.06,tor:.5,nk:.15,hx:-.2,hz:0,jaw:.9,sh:-.95,el:-.45,th:-1.25,kn:1.9},
      2:{by:-.2,tor:1.15,nk:-.85,hx:-.35,hz:.1,jaw:.12,sh:-1.35,el:-.25,th:-.9,kn:1.6},
      3:{by:-.08,tor:.42,nk:.35,hx:-.5,hz:.42,jaw:.22,sh:-1.55,el:.55,th:-1.3,kn:2.0}, // up on its knees, leaning over the blankets
      4:{by:-.12,tor:1.25,nk:-.95,hx:-.4,hz:0,jaw:.7,sh:-1.45,el:-.2,th:-.7,kn:1.4}}[a]||{};
    u.body.position.y=damp(u.body.position.y,T.by+(move?Math.abs(Math.sin(ph))*.05:0),r,dt);
    u.torso.rotation.x=damp(u.torso.rotation.x,T.tor,r,dt);u.torso.scale.y=1+(a===0?Math.sin(t*1.1)*.025:0);
    u.neck.rotation.x=damp(u.neck.rotation.x,T.nk,r,dt);
    u.head.rotation.x=damp(u.head.rotation.x,T.hx,r,dt);u.head.rotation.z=damp(u.head.rotation.z,T.hz,r*.6,dt);
    u.jaw.rotation.x=damp(u.jaw.rotation.x,T.jaw,a===1?3:6,dt);
    u.arms.forEach((s,i)=>{const sw=move?Math.sin(ph+i*Math.PI)*.45:0;s.rotation.x=damp(s.rotation.x,T.sh+sw,r,dt);s.rotation.z=damp(s.rotation.z,(i?-1:1)*(a===1?.35:.12),r,dt);
      s.userData.el.rotation.x=damp(s.userData.el.rotation.x,T.el-(move?Math.max(0,Math.sin(ph+i*Math.PI))*.4:0),r,dt)});
    u.legs.forEach((l,i)=>{const sw=move?Math.sin(ph+i*Math.PI+Math.PI)*.35:0;l.th.rotation.x=damp(l.th.rotation.x,T.th+sw,r,dt);l.kn.rotation.x=damp(l.kn.rotation.x,T.kn,r,dt)});
    for(const e of u.eyes)e.scale.y=damp(e.scale.y,a===0?.001:.012,6,dt)}
  else if(v.ty===3){ // surfaces: 0 floor, 1 climbing the wall, 2 ceiling, 3 climbing down. a: 2 moving, 3 holding still, 4 dropping
    const o=u.orient,k=v.k|0,r=10;o.rotation.x=damp(o.rotation.x,k===1?-Math.PI/2:k===3?Math.PI/2:0,r,dt);o.rotation.z=damp(o.rotation.z,k===2?Math.PI:0,r,dt);
    // it moves in total silence once it's out
    const move=v.a===2;v.gp=(v.gp||0)+(move?dt*(k===0?16:11):0);
    u.limbs.forEach(l=>{const s=Math.sin(v.gp+l.ph);l.sh.rotation.y=damp(l.sh.rotation.y,move?s*.5:v.a===4?l.s*.4:0,14,dt);l.el.rotation.z=damp(l.el.rotation.z,move?l.s*Math.max(0,s)*.45:0,14,dt)});
    u.body.position.y=.42+(move?Math.abs(Math.sin(v.gp))*.03:0);
    const look=k===2?(v.a===3||v.a===4?-1.5:-1.15):k===1||k===3?-.5:-.1;
    u.head.rotation.x=damp(u.head.rotation.x,look,8,dt);u.head.rotation.z=Math.sin(t*.7)*.15+(Math.sin(t*3.3)>.985?.6:0);
    u.hair.quaternion.copy(u.head.getWorldQuaternion(_q).invert())}
  else if(v.ty===2){const mv=v.a===2,lit=v.a===1;
    u.legs.forEach((l,i)=>l.rotation.x=mv?Math.sin(t*5.5+i*Math.PI)*.45:0);
    u.arms.forEach((a,i)=>{a.rotation.x=lit?damp(a.rotation.x,-.4,10,dt):mv?Math.sin(t*5.5+i*Math.PI+Math.PI)*.35:Math.sin(t*.9+i)*.08;a.rotation.z=(i?-1:1)*(lit?.25:.08);a.userData.el.rotation.x=lit?-.8:-.15});
    u.torso.rotation.x=mv?.32:.18;u.torso.rotation.z=Math.sin(t*.7)*.06;
    u.head.rotation.z=lit?damp(u.head.rotation.z,1.25,14,dt):Math.sin(t*1.3)*.25+(Math.sin(t*11)>.97?.5:0);u.head.rotation.x=mv?-.3:.1}
  else{const mv=v.a===2;u.body.position.y=.35+(mv?Math.abs(Math.sin(t*30))*.04:.06);
    u.lids.forEach(l=>l.p.rotation.x=l.s*(v.a===1?1.3+Math.sin(t*35)*.3:.5+Math.sin(t*22)*.35));
    u.legs.forEach(l=>{l.hip.rotation.x=mv?Math.sin(t*26+l.ph)*.7:Math.sin(t*4+l.ph)*.1;l.hip.rotation.z=mv?Math.cos(t*26+l.ph)*.25:0})}}
function syncAvatars(dt,time){const live=new Set(),lit=[];let si=0;
  for(const p of Object.values(S.players)){if(p.id===NET.myId)continue;live.add(p.id);let v=AV.get(p.id);
    if(!v){const g=makeWorker(p.col||VEST[1],p.name||'Worker');ROOT.add(g);v={g,x:p.x,z:p.z,yaw:p.yaw,pitch:p.pitch,walk:0};AV.set(p.id,v)}
    const ox=v.x,oz=v.z;v.x=damp(v.x,p.x,11,dt);v.z=damp(v.z,p.z,11,dt);v.yaw=angLerp(v.yaw,p.yaw,1-Math.exp(-12*dt));v.pitch=damp(v.pitch,p.pitch,12,dt);
    const sp=Math.hypot(v.x-ox,v.z-oz)/Math.max(dt,1e-3);const w0=v.walk;v.walk+=dt*sp*2.3;
    if(sp>.4&&Math.floor(w0/Math.PI)!==Math.floor(v.walk/Math.PI)&&Math.hypot(v.x-ME.x,v.z-ME.z)<16)SFX.step(v.z<WH.z0,sp>4,{x:v.x,y:.1,z:v.z});
    const g=v.g,u=g.userData,drv=S.fork&&S.fork.drv===p.id;g.visible=!p.dead;g.position.set(v.x,drv?.75:0,v.z);
    const held=rgHeldAt(p.id);if(held)g.position.set(held.x,held.y-1.1,held.z); /* in the giant's fist */g.rotation.y=drv?S.fork.ry:v.yaw+Math.PI;if(drv){u.legs.forEach(l=>l.rotation.x=-1.4)}
    const a=Math.min(1,sp/3);u.legs[0].rotation.x=Math.sin(v.walk)*.6*a;u.legs[1].rotation.x=-Math.sin(v.walk)*.6*a;
    if(p.carry>=0){u.arms.forEach(x=>x.rotation.x=damp(x.rotation.x,-1.25,10,dt))}else{u.arms[0].rotation.x=-Math.sin(v.walk)*.5*a;u.arms[1].rotation.x=-.9}
    u.torch.rotation.x=-v.pitch;u.head.rotation.x=-v.pitch*.6;u.beam.visible=!!p.light;
    if(p.light&&!p.dead)lit.push({v,u,d:Math.hypot(v.x-ME.x,v.z-ME.z)})}
  // only a few real lights to go round: they go to the nearest crewmates' torches
  lit.sort((a,b)=>a.d-b.d);
  for(const {v,u} of lit){if(si>=REMOTE_SPOTS.length)break;const s=REMOTE_SPOTS[si++];u.torch.getWorldPosition(s.position);const cp=Math.cos(v.pitch);s.target.position.set(s.position.x-Math.sin(v.yaw)*cp*8,s.position.y+Math.sin(v.pitch)*8,s.position.z-Math.cos(v.yaw)*cp*8);s.intensity=24}
  for(;si<REMOTE_SPOTS.length;si++)REMOTE_SPOTS[si].intensity=0;
  for(const [id,v] of AV)if(!live.has(id)){ROOT.remove(v.g);AV.delete(id)}}
const MENU_LAMPS=LAMPS.map(L=>({on:L.dead?0:1,t:L.dead?1e9:rand(2,8)}));
function syncLamps(dt){let pool=0;LAMPV.forEach((L,i)=>{let on;
  if(S)on=S.lamps[i];else{const m=MENU_LAMPS[i];m.t-=dt;if(m.t<=0){m.on=1-m.on;m.t=m.on?rand(4,12):rand(.3,2.5)}on=m.on}
  if(L.prev!==undefined&&L.prev!==on){L.sput=.45;if(AU.ready&&GAME.on)SFX.creak({x:LAMPS[i].x,y:5,z:LAMPS[i].z})}L.prev=on;
  let lv=on?1:0;if(L.sput>0){L.sput-=dt;lv=Math.random()<.5?1:.05}
  if(on&&Math.random()<(i===3?.035:.008))L.fl=rand(.05,.25);if(L.fl>0){L.fl-=dt;lv*=Math.random()<.5?.12:1}
  // a dead fixture with a new bulb borrows one of the pooled lights
  let light=L.light;if(!light&&on&&pool<LAMPV.pool.length){light=LAMPV.pool[pool++];light.position.set(LAMPS[i].x,5,LAMPS[i].z)}
  if(light)light.intensity=(L.light?17:15)*lv;L.bulb.material.color.setRGB(lerp(.1,1,lv),lerp(.08,.85,lv),lerp(.06,.62,lv));L.cone.material.uniforms.lv.value=lv;
  if(AU.ready){if(!L.hum)L.hum=loop('hum',{x:LAMPS[i].x,y:5,z:LAMPS[i].z},.35);L.hum.set(lv*.35,.03)}});
  for(;pool<LAMPV.pool.length;pool++)LAMPV.pool[pool].intensity=0}
function syncWorld(dt,time){applyColliders();syncTrucks(dt);syncAvatars(dt,time);syncBoxes(dt);syncMonsters(dt,time);syncExtras(dt,time)}
function clearVisuals(){for(const m of BM.values())ROOT.remove(m);BM.clear();for(const v of MV.values()){ROOT.remove(v.g);v.lp&&v.lp.stop();v.gr&&v.gr.stop()}MV.clear();for(const v of AV.values())ROOT.remove(v.g);AV.clear();
  for(const v of TV)v.g.visible=false;for(const s of REMOTE_SPOTS)s.intensity=0;setViewBox(null);if(ME.scare){camera.remove(ME.scare.g);ME.scare=null}
  for(const s of SLOTS)s.box=-1;BOXPICK.length=0;
  for(const v of PV.values())ROOT.remove(v.g);PV.clear();for(const g of PALV.values())ROOT.remove(g);PALV.clear();for(const v of FLV.values()){ROOT.remove(v.g);v.lp&&v.lp.stop()}FLV.clear();
  for(const v of MV.values())v.l2&&v.l2.stop();if(GIANT)GIANT.visible=false;if(ROOFG){ROOFG.visible=false;ROOFG.userData.v=null}if(PASS3D)PASS3D.visible=false;FLARE_L.intensity=0;ROOM_L.intensity=0}

// ===================================================================== events
function evPos(e){if(e.x!==undefined)return{x:e.x,y:e.y??1,z:e.z};const v=MV.get(e.id);if(v)return{x:v.g.position.x,y:1.4,z:v.g.position.z};return null}
function drainEvents(){while(EVQ.length){const e=EVQ.shift();try{onEvent(e)}catch(err){console.error(err)}}}
function onEvent(e){const me=NET.myId;
  switch(e.e){
  case 'night':{if(e.df!=null)S.diff=e.df;const p=e.pos&&e.pos[me];if(p){ME.x=p[0];ME.z=p[1];ME.ready=true;ME.yaw=0;ME.pitch=0;ME.vx=ME.vz=0}ME.bat=100;ME.stam=100;ME.light=true;ME.lastHp=100;ME.deathT=0;
    big(`NIGHT ${e.n}${S.diff!==1&&DIFFS[S.diff]?` &middot; ${DIFFS[S.diff].name.toUpperCase()}`:''}`,`Shelve ${e.q} boxes before 6:00 AM or you're fired${e.ex?` · shift starts at ${fmtClock(-e.ex)}`:''}`,4.5);SFX.bell();ME.red=false;ME.drinkT=0;introAdds();
    if(e.n===1&&!GAME.hints.start){GAME.hints.start=1;setTimeout(()=>GAME.on&&toast('A truck is backing into Bay A. Unload it and shelve the boxes.',5),4500);
      setTimeout(()=>GAME.on&&toast('Your quota is top left. Keep the bar ahead of the white marker to stay on pace.',6),11000)}break}
  case 'radio':SFX.radio();toast(`Supervisor, on the radio: "${e.m}"`,6,'radio');break;
  case 'finalHour':SFX.pa();toast(e.need>0?`Loudspeaker: "Final hour. ${e.need} more box${e.need>1?'es':''} to make quota."`:'Loudspeaker: "Final hour."',5,'radio');break;
  case 'overtime':SFX.powerDown();big('OVERTIME',`${e.need} more box${e.need>1?'es':''} in 60 seconds. The lights are out.`,5);
    if(e.b>=0)setTimeout(()=>GAME.on&&toast(`One last truck is backing into Bay ${BAYS[e.b].name}.`,4,'radio'),2500);break;
  case 'nightDone':big(e.ot?'MADE IT':'6:00 AM',`Night ${e.n} survived${e.ot?' on overtime':''} · ${e.sh} / ${e.q} shelved${e.lo?` · ${e.lo} lost`:''}`,7);SFX.bell();break;
  case 'hour':SFX.bell();toast(`${e.h||12}:00 AM`,2.5);break;
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
  default:onEvent2(e);break;
  case 'growl':{const p=evPos(e);if(p)SFX.growl(p);break}
  case 'hiss':{const p=evPos(e);if(p)SFX.hiss(p);break}
  case 'roar':{const p=evPos(e);if(p)SFX.roar(p);ME.shake=Math.max(ME.shake,.3);break}
  case 'crawlOut':SFX.crawlOut({x:e.x,y:e.y,z:e.z});break;
  case 'skitter':SFX.skitter({x:e.x,y:e.y,z:e.z});break;
  case 'shriek':{SFX.shriek({x:e.x,y:1.8,z:e.z});const d=Math.hypot(e.x-ME.x,e.z-ME.z);if(d<16){ME.flash=Math.max(ME.flash,.25);ME.shake=Math.max(ME.shake,.35)}break}
  case 'stalk':if(Math.random()<.6)setTimeout(()=>GAME.on&&toast(pick(['You feel like you are being watched.','Something moved in the dark.','The air just got colder.']),3.5),rand(1500,5000));break;
  case 'lamp':SFX.creak({x:LAMPS[e.i].x,y:5,z:LAMPS[e.i].z});break;
  case 'msg':if(!e.p||e.p===me)toast(e.m,3.8);break;
  case 'quota':SFX.ok();toast('Quota met. Every extra box is bonus pay.',4);break;
  case 'healed':if(e.p===me){SFX.ok();toast('Patched up.',2.5)}break;
  }}

// ===================================================================== HUD
let toastT=0,bigT=0;
function toast(m,d=3.5,cls=''){const el=$('toast');el.textContent=String(m).replace(/\b([Pp]ress|[Hh]old) ([EQGFHR])\b/g,(x,w,c)=>w+' '+keyLabel('Key'+c));el.className=cls;el.style.opacity=1;toastT=d}
function big(a,b,d=4){const el=$('big');el.innerHTML=`${a}<small>${b||''}</small>`;el.style.opacity=1;bigT=d}
function fmtClock(t){let mins=Math.floor(t/HOUR*60);if(mins<0)mins+=1440;const h=Math.floor(mins/60)%24,m=mins%60;return`${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`}
const mmss=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
function hud(dt){toastT-=dt;if(toastT<=0)$('toast').style.opacity=0;bigT-=dt;if(bigT<=0)$('big').style.opacity=0;
  const me=S.players[NET.myId];
  $('hpb').firstChild.style.width=(me?me.hp:0)+'%';$('batb').firstChild.style.width=ME.bat+'%';$('stb').firstChild.style.width=ME.stam+'%';
  $('batb').style.opacity=ME.charging?(Math.sin(performance.now()/90)>0?1:.5):1;
  const t=ME.target;let pr='';
  if(me&&!me.dead&&!ME.scare&&S.phase==='play'){const carrying=me.carry>=0;
    const p2=t&&promptFor(t,me);
    if(p2!==null&&p2!==undefined)pr=p2;
    else if(t){if(t.kind==='box'&&ME.driving)pr='<kbd>E</kbd> Load onto the forks';
      else if(t.kind==='box')pr=(carrying?'<kbd>E</kbd> Pick up another':'<kbd>E</kbd> Pick up')+(t.b.ret?' damaged return <span class="warn">(shredder only)</span>':'')+' &nbsp; <kbd>Q</kbd> Kick'+(curSel(me)==='cutter'?' &nbsp; <kbd>Right click</kbd> Cut':'');
      else if(t.kind==='slot')pr=t.ret?'<span class="warn">Returns can\'t be shelved: shred them in the basement</span>':t.ok?(t.stack?'<kbd>E</kbd> Stack it on top':'<kbd>E</kbd> Shelve box'):t.full?'No room to stack that here':'Shelf is full';
      else if(t.kind==='charger')pr=ME.bat>=99.5?'Flashlight fully charged':ME.charging?`Charging&hellip; ${Math.floor(ME.bat)}%`:'Hold <kbd>E</kbd> Charge flashlight';
      else if(t.kind==='aid')pr=S.aidLeft>0?`<kbd>E</kbd> First aid (${S.aidLeft} left tonight)`:'First-aid cabinet is empty';
      else if(t.kind==='panel'){const tr=S.trucks[t.bay];pr=!bayOn(t.bay)?`Bay ${BAYS[t.bay].name}: not in service`:tr.st===0&&tr.stuck>0?`<kbd>E</kbd> Close the Bay ${BAYS[t.bay].name} door`:tr.st===2?(tr.reject?'Truck is leaving':`<kbd>E</kbd> Refuse delivery: send Bay ${BAYS[t.bay].name} away`):`Bay ${BAYS[t.bay].name}: no truck docked`}
      else if(t.kind==='exit')pr='<kbd>E</kbd> Exit';}
    if(carrying&&(!t||t.kind!=='slot'))pr+=(pr?' &nbsp; ':'')+'<kbd>G</kbd> Set down';
    if(ME.driving&&!t)pr='<kbd>Q</kbd> Get out'+(S.fork.pal>=0?(owned('amrl')&&Math.hypot(forkTip().x-AMR.l.x,forkTip().z-AMR.l.z)<1.7?' &nbsp; <kbd>G</kbd> Set the pallet on the robot pad':' &nbsp; <kbd>G</kbd> Set the pallet down'):carrying?' &nbsp; <kbd>G</kbd> Set a box down':'');
    const cn=carryNote(me);if(cn)pr+=(pr?'<br>':'')+cn;
    const hn=hatchNote()||grabNote();if(hn)pr=hn;}
  pr=relabel(pr);if(pr!==GAME.lastPr){$('prompt').innerHTML=pr;GAME.lastPr=pr}
  $('cross').className=`xh x-${SET.cross||'dot'}${t&&(t.kind!=='slot'||t.ok)?' on':''}`;
  // a clock ticks through the last minute and overtime, only while the quota isn't met; double time for the final 10 s
  if(S.phase==='play'&&!S.over&&S.shelved<S.quota&&S.t>=SHIFT_END-60){const urgent=S.ot&&S.t>=SHIFT_END+OVERTIME-10,k=Math.floor(S.t*(urgent?2:1));
    if(k!==GAME.tickK){if(GAME.tickK!==undefined)SFX.tick(urgent||S.ot);GAME.tickK=k}}else GAME.tickK=undefined;
  GAME.hudT-=dt;if(GAME.hudT>0)return;GAME.hudT=.1;
  const ck=$('clock');ck.textContent=S.phase==='inter'?'6:00 AM':S.ot?`OVERTIME ${mmss(Math.max(0,SHIFT_END+OVERTIME-S.t))}`:fmtClock(S.t);
  ck.className=S.phase!=='play'?'':S.ot?'ot':S.t>=HOUR*5&&S.shelved<S.quota?'late':'';$('night').textContent=`NIGHT ${S.night}`;
  // pace: how many boxes short of the steady rate that makes quota exactly at 6:00
  const met=S.shelved>=S.quota,pace=S.phase==='play'?paceFrac():1,behind=met?0:Math.ceil(S.quota*pace-S.shelved);
  const st=met?'ok':behind>=Math.max(4,S.quota*.3)?'far':behind>=2?'behind':'';
  const q=$('quota');q.textContent=`Shelved ${S.shelved} / ${S.quota}`+(S.ot&&!met?` · ${S.quota-S.shelved} to go`:st==='behind'||st==='far'?` · ${behind} behind`:'');q.className=st;
  const qb=$('qbar');qb.className=st;qb.firstChild.style.width=Math.min(100,S.shelved/S.quota*100)+'%';qb.lastChild.style.left=(pace*100)+'%';
  let h='';S.trucks.forEach((tr,i)=>{const n=BAYS[i].name;if(!bayOn(i))return;
    if(tr.st===0)h+=`<div class="bay">BAY ${n} &middot; ${tr.stuck>0?'<span class="warn">door jammed open</span>':'empty'}</div>`;
    else{let s=tr.st===1?'truck backing in&hellip;':tr.st===3?'truck pulling out':tr.reject?'refused, leaving':`${tr.left} / ${tr.n} boxes &middot; leaves in ${mmss(Math.max(0,DOCK_TIME-tr.t))}`;
      h+=`<div class="bay live">BAY ${n} &middot; ${s}</div>`;
      if(tr.st!==3)h+=`<div class="bay small">manifest ${tr.n} pcs, ${tr.kg} kg${tr.warn?` &middot; <span class="warn">scale reads ${tr.kg+tr.extra} kg</span>`:''}</div>`}});
  h+=`<div class="bay small" style="margin-top:.4em">first aid: ${S.aidLeft} left</div>`+statusLines(me);
  {const n=Object.keys(S.players).length;$('cash').textContent=n>1&&me?`Team $${Math.round(S.cash||0)} · You $${Math.round(me.cash||0)}`:`$${Math.round((S.cash||0)+(me&&me.cash||0))}`}const hb=hotbarHTML(me);if(hb!==GAME.lastHb){$('hotbar').innerHTML=hb;GAME.lastHb=hb}
  $('tr').innerHTML=h;
  const ps=Object.values(S.players);
  $('plist').innerHTML=ps.length>1?ps.map(p=>`<div style="color:${p.dead?'#666':p.col}">${p.dead?'&#10013; ':''}${esc(p.name)} ${p.dead?'':'&middot; '+Math.ceil(p.hp)}</div>`).join(''):'';
  const sp=$('spect'),wt=me&&me.dead?specTarget():null;if(wt){const n=specList().length;sp.classList.remove('hide');sp.textContent=`You're down. Watching ${wt.name}${n>1?' · click or ← → to switch':''} · move the mouse to look around. Back on shift next night.`}else sp.classList.add('hide');
  if(SET.fps)$('fps').textContent=GAME.fps+' fps';}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// fear, heartbeat, flashlight flicker
function updFear(dt){const me=S.players[NET.myId];let f=0,near=99;
  for(const v of MV.values()){if(v.ty===3&&v.a===0)continue;const d=Math.hypot(v.g.position.x-camera.position.x,v.g.position.z-camera.position.z);near=Math.min(near,d);
    const f2=fearOf(v,d);if(f2!==null){f=Math.max(f,f2);continue}
    const w=v.ty===2||v.ty===3?1:v.ty===1?(v.a===0?.45:1.2):.6;f=Math.max(f,clamp(1-d/(v.ty===2?9:10),0,1)*w)}
  if(me&&me.hp<35&&!me.dead)f=Math.max(f,.35);
  ME.fear=damp(ME.fear,f,f>ME.fear?3:.8,dt);
  ME.beatT-=dt;if(ME.fear>.32&&ME.beatT<=0&&!(me&&me.dead)){ME.beatT=1.05-ME.fear*.55;SFX.beat(clamp(ME.fear,.2,1)*.9)}
  // flashlight: dies on low battery, stutters when something is close
  let fl=1;if(ME.bat<15&&Math.random()<.08)fl=rand(0,.5);
  if(near<7&&Math.random()<(1-near/7)*.12)fl=rand(0,.35);
  ME.flick=fl<1?fl:damp(ME.flick,1,25,dt);
  return near}

// ===================================================================== screens
const SCREENS=['menu','how','settings','lobby','pause','over','shop','pubs','install'];
function hideScreens(){for(const s of SCREENS)$(s).classList.add('hide');cornerSync()}
function show(id){hideScreens();$(id).classList.remove('hide');cornerSync()}
let settingsBack='menu';
function showMenu(err){GAME.on=false;$('hud').classList.add('hide');$('lockmsg').classList.add('hide');show('menu');$('menuErr').textContent=err?String(err):'';saveNote();if(document.pointerLockElement)document.exitPointerLock()}
function showPause(){if(!GAME.on)return;if(NET.mode==='solo')GAME.paused=true;$('pauseNote').textContent=NET.mode==='solo'?'The clock is stopped.':`Crew ${NET.code}: the night keeps going without you.`;show('pause')}
function renderLobby(){show('lobby');$('code').textContent=NET.code||'-----';
  $('lobbyList').innerHTML=NET.lobby.map(p=>`<li><span class="dot" style="background:${p.col}"></span>${esc(p.name)}${p.id===NET.myId?' <span class="lbl">(you)</span>':''}</li>`).join('');
  $('lobbyStatus').textContent=NET.mode==='host'?(NET.lobby.length>1?`${NET.lobby.length} workers. Start when everyone is in.`:'Share the code. Waiting for your crew…'):'Waiting for the host to start the shift…';
  const d=NET.mode==='host'?SET.diff:NET.diff;if(DIFFS[d])$('lobbyStatus').textContent+=` Difficulty: ${DIFFS[d].name}.`;
  $('bStart').classList.toggle('hide',NET.mode!=='host');$('bCont2').classList.toggle('hide',NET.mode!=='host'||!loadSave());
  // the host can list the crew publicly (it stays listed, joinable, all the way through the run)
  const host=NET.mode==='host'&&!!NET.code;$('bPublic').classList.toggle('hide',!host);$('pubNote').classList.toggle('hide',!host||!NET.pub);
  $('bPublic').classList.toggle('on',!!NET.pub);$('bPublic').textContent=NET.pub?'Public: listed in Join Public':'Private: join by code only';
  $('pubNote').textContent=NET.beacon?'Anyone can find this crew under Join Public and join at any time, even mid-shift.':'Getting listed…'}
// ---- the public crew list
let pubSeq=0;
async function showPubs(){show('pubs');const seq=++pubSeq,found=new Map(),tb=$('pubList').tBodies[0];tb.innerHTML='';$('pubStatus').textContent='Looking for crews…';
  const draw=()=>{if(seq!==pubSeq)return;const rows=[...found.values()].sort((a,b)=>b.n-a.n);
    tb.innerHTML=rows.map(r=>`<tr><td>${esc(String(r.name).slice(0,14))}</td><td>${r.n} / ${r.max}</td><td>${r.ph==='lobby'?'crew room':r.ph==='shop'?`shop after ${r.night}`:r.night}</td><td>$${r.cash|0}</td><td><button data-code="${r.code}" ${r.n>=r.max?'disabled':''}>${r.n>=r.max?'Full':'Join'}</button></td></tr>`).join('');
    tb.querySelectorAll('button[data-code]').forEach(b=>b.onclick=()=>{pubSeq++;joinCode(b.dataset.code)})};
  try{await pubScan(info=>{if(seq!==pubSeq)return;found.set(info.code,info);draw();$('pubStatus').textContent=`${found.size} public crew${found.size>1?'s':''} found. Still looking…`})}
  catch(e){if(seq===pubSeq)$('pubStatus').textContent=String(e);return}
  if(seq!==pubSeq)return;$('pubStatus').textContent=found.size?`${found.size} public crew${found.size>1?'s':''}. Join one, or refresh.`:'No public crews right now. Host one and make it public, or refresh in a bit.'}
// join a crew by its code (from the code box or the public list)
async function joinCode(code){auInit();NET.code=code;NET.lobby=[];NET.mode='client';renderLobby();$('lobbyStatus').textContent='Finding the crew…';
  try{await netJoin(code);renderLobby()}catch(e){netClose();showMenu(e)}}
// the Continue button on the menu says what it would pick up
function saveNote(){const sv=loadSave();$('bCont').classList.toggle('hide',!sv);$('contNote').classList.toggle('hide',!sv);if(!sv)return;
  $('bCont').textContent=`Continue: night ${sv.night+1}`;
  $('contNote').textContent=`${DIFFS[sv.diff]?DIFFS[sv.diff].name:'Normal'}, ${sv.night} night${sv.night>1?'s':''} survived, $${Math.round(sv.cash||0)} in the kitty${sv.crew>1?' (a crew run: host a crew to carry on together)':''}. A new run replaces it once it gets through a night.`}
function showOver(o){GAME.overShown=true;if(document.pointerLockElement)document.exitPointerLock();$('hud').classList.add('hide');
  const crew=S&&Object.keys(S.players).length>1;
  const T={dead:[crew?'THE CREW IS GONE':'YOU DIDN\'T MAKE IT',crew?'Nobody clocked out this morning.':'Something in the dark got you.'],quota:['FIRED',`You missed the quota${o.ot?', even on overtime':''}: ${o.shelved} of ${o.quota} boxes shelved.`],host:['DISCONNECTED','The host left the crew room.']}[o.why]||['SHIFT OVER',''];
  $('overTitle').textContent=T[0];$('overWhy').textContent=T[1];
  $('overStats').innerHTML=`Nights survived: <b>${Math.max(0,o.night-1)}</b><br>Boxes shelved: <b>${o.total}</b><br>Pay: <b>$${(o.score*1.25).toFixed(2)}</b>`;
  $('bAgain').classList.toggle('hide',NET.mode==='client'||o.why==='host');
  $('bAgain').textContent=NET.mode==='host'?'Start another shift (crew)':'Work another shift';
  show('over');if(NET.mode==='client'&&o.why!=='host')$('overWhy').textContent+=' Waiting for the host to start another shift…'}
function checkOver(dt){if(!S.over||GAME.overShown)return;if(ME.scare)return;GAME.overT+=dt;if(GAME.overT>1.8)showOver(S.over)}

function enterGame(){clearVisuals();applyAdds();markSlots();hideScreens();$('hud').classList.remove('hide');GAME.on=true;GAME.paused=false;GAME.overShown=false;GAME.overT=0;GAME.lastPr=null;
  Object.assign(ME,{vx:0,vz:0,stam:100,exh:false,bat:100,light:true,kickCD:0,scare:null,shake:0,hurt:0,flash:0,fear:0,deathT:0,lastHp:100,specId:'',red:false,drinkT:0,driving:false,scan:false});shopShown=false;
  const me=S.players[NET.myId];if(me){ME.x=me.x;ME.z=me.z;ME.yaw=me.yaw||0;ME.pitch=0}
  auInit();if(S.phase!=='shop'){reqLock();setTimeout(()=>{if(GAME.on&&!locked()&&!GAME.overShown&&S&&S.phase!=='shop')$('lockmsg').classList.remove('hide')},600)}}
// sv: a saved run to pick up (in the shop, before its next night)
function startSolo(sv){netClose();NET.mode='solo';NET.myId='me';S=newState();addPlayer('me',myName(),VEST[0]);if(sv)restoreRun(sv);else startNight();enterGame()}
function hostStartGame(sv){S=newState();for(const p of NET.lobby)addPlayer(p.id,p.name,p.col);NET.started=true;NET.sentBver=-1;NETEV.length=0;if(sv)restoreRun(sv);else startNight();hostSend({t:'start'});lobbyBroadcast();enterGame()}
function clientStart(){S=newState();S.players={};EVQ.length=0;ME.ready=false;enterGame()}
function quitToMenu(){GAME.on=false;netClose();S=null;clearVisuals();EVQ.length=0;NETEV.length=0;showMenu()}

function bindUI(){
  // difficulty: the host's (or a solo player's) choice runs the whole crew's night
  const DIFF_NOTE=['Smaller quotas, monsters hit softer, and bad luck is rarer.','The shift as it was meant to be worked.','Bigger quotas, monsters hit harder, and bad luck comes far more often.'];
  const setDiff=d=>{SET.diff=d;saveSet();document.querySelectorAll('#diffs button').forEach(b=>b.classList.toggle('on',+b.dataset.d===d));$('diffNote').textContent=DIFF_NOTE[d]+' (A crew plays on the host\'s setting.)'};
  document.querySelectorAll('#diffs button').forEach(b=>b.onclick=()=>setDiff(+b.dataset.d));setDiff(DIFFS[SET.diff]?SET.diff:1);
  $('name').value=SET.name||'';$('name').addEventListener('input',()=>{SET.name=$('name').value;saveSet()});
  $('bSolo').onclick=()=>{auInit();startSolo()};
  $('bHost').onclick=async()=>{auInit();NET.code='';NET.lobby=[];NET.mode='host';renderLobby();$('lobbyStatus').textContent='Opening a crew room…';$('bStart').classList.add('hide');
    try{await netHost();NET.pub=!!SET.pub;pubOpen();renderLobby()}catch(e){netClose();showMenu(e)}};
  const join=()=>{const code=$('joinCode').value.trim().toUpperCase();if(!/^[A-Z0-9]{5}$/.test(code)){$('menuErr').textContent='Room codes are five letters or numbers.';return}joinCode(code)};
  $('bPub').onclick=()=>showPubs();$('bPubRefresh').onclick=()=>showPubs();$('bPubBack').onclick=()=>{pubSeq++;showMenu()};
  $('bPublic').onclick=()=>{if(NET.mode!=='host')return;NET.pub=!NET.pub;SET.pub=NET.pub;saveSet();if(NET.pub)pubOpen();else pubClose();renderLobby()};
  $('bJoin').onclick=join;$('joinCode').addEventListener('keydown',e=>{if(e.key==='Enter')join()});
  $('bStart').onclick=()=>{if(NET.mode==='host')hostStartGame()};
  $('bCont').onclick=()=>{const sv=loadSave();if(!sv)return saveNote();auInit();startSolo(sv)};
  $('bCont2').onclick=()=>{const sv=loadSave();if(NET.mode==='host'&&sv)hostStartGame(sv)};
  $('bLeave').onclick=()=>{netClose();showMenu()};
  $('bHow').onclick=()=>show('how');$('bHowBack').onclick=()=>show('menu');
  $('bSettings').onclick=()=>{settingsBack='menu';openSettings()};$('bPauseSet').onclick=()=>{settingsBack='pause';openSettings()};
  $('bSetBack').onclick=()=>{REBIND=null;show(settingsBack)};
  $('bResume').onclick=()=>{auInit();reqLock();hideScreens();GAME.paused=false;setTimeout(()=>{if(GAME.on&&!locked()&&!GAME.overShown)$('lockmsg').classList.remove('hide')},400)};
  $('bQuit').onclick=quitToMenu;$('bMenu').onclick=quitToMenu;
  $('bAgain').onclick=()=>{auInit();if(NET.mode==='host')hostStartGame();else startSolo()};
  const sl=(id,key,fmt,apply)=>{const el=$(id),out=$('v'+id.slice(1));el.value=SET[key];out.textContent=fmt(SET[key]);el.oninput=()=>{SET[key]=+el.value;out.textContent=fmt(SET[key]);saveSet();apply&&apply()}};
  sl('sSens','sens',v=>(+v).toFixed(2));sl('sVol','vol',v=>Math.round(v*100)+'%',()=>auVol(SET.vol));sl('sFov','fov',v=>v+'°',applyQuality);
  $('sOutl').value=SET.outl||'auto';$('sOutl').onchange=()=>{SET.outl=$('sOutl').value;saveSet();applyQuality()};$('sQual').value=SET.qual;$('sQual').onchange=()=>{SET.qual=+$('sQual').value;saveSet();applyQuality()};
  $('sForkInv').value=SET.forkInv?'1':'0';$('sForkInv').onchange=()=>{SET.forkInv=$('sForkInv').value==='1';saveSet()};
  $('sCross').onchange=()=>{SET.cross=$('sCross').value;saveSet();renderBinds()};
  $('bKeysReset').onclick=()=>{SET.keys={};REBIND=null;saveSet();buildKeymap();renderBinds()};buildKeymap();
  $('sFps').checked=!!SET.fps;$('sFps').onchange=()=>{SET.fps=$('sFps').checked;saveSet();$('fps').classList.toggle('hide',!SET.fps)};$('fps').classList.toggle('hide',!SET.fps);
  $('lockmsg').addEventListener('click',()=>reqLock());
  addEventListener('beforeunload',()=>{try{NET.peer&&NET.peer.destroy()}catch(e){}})}
function openSettings(){REBIND=null;renderBinds();show('settings')}
function renderBinds(){const el=$('binds');if(!el)return;
  el.innerHTML=BINDS.map(([id,name])=>`<span>${name}</span><button data-bind="${id}" class="${REBIND===id?'wait':''}">${REBIND===id?'press a key…':keyName(boundKey(id))}</button>`).join('');
  el.querySelectorAll('button[data-bind]').forEach(b=>b.onclick=()=>{REBIND=b.dataset.bind;renderBinds()});
  $('sCross').value=SET.cross||'dot';$('xPrev').className=`xh x-${SET.cross||'dot'}`}

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
    ME.driving=!!(S.fork&&S.fork.drv===NET.myId);
    // (the reverse beep is only turned down while driving, so silence it here once you're out or paused)
    if(ME.beep&&(!ME.driving||GAME.paused)){ME.beep.set(0,.05);if(!ME.driving)ME.fv=0}
    if(!GAME.paused)localUpdate(dt);
    drainEvents();syncWorld(dt,time);netTick(dt);hud(dt);touchTick();near=updFear(dt);checkOver(dt);shopTick();syncScanner();
    const me=S.players[NET.myId];
    const fl2=me&&me.up&&me.up.fl2;FL.angle=fl2?.55:.44;FL.distance=fl2?28:24;
    FL.intensity=ME.scare?(Math.random()<.45?7:.5):(ME.lightOn()&&me&&!me.dead?(fl2?40:30)*ME.flick:0);
    REDL.intensity=ME.red&&me&&me.up&&me.up.red&&!me.dead&&!ME.scare?10:0;VM.can.visible=!!(me&&me.can);
    SCARE_L.intensity=ME.scare?(Math.random()<.3?.6:4):0;
    VM.g.visible=!!(me&&!me.dead);VM.lens.material.color.setScalar(ME.lightOn()?ME.flick:.15);
    BAYV.chargeLed.material.color.set(ME.charging&&!ME.shaking?(Math.sin(time*12)>0?0x37ff8a:0x0a3a1a):0x37ff8a);
  }else{ // title screen: drift through the dark dock
    const t=time*.05;camera.position.set(Math.sin(t)*7,2.1+Math.sin(t*1.7)*.2,-8+Math.cos(t*.8)*2);camera.rotation.set(-.08,Math.sin(t*.9)*.6,0);
    FL.intensity=0;SCARE_L.intensity=0;REDL.intensity=0;VM.g.visible=false;ME.fear=0;ME.scan=false;
  }
  syncLamps(dt);
  POST.uniforms.scan.value=damp(POST.uniforms.scan.value,ME.scan?1:0,10,dt);POST.uniforms.time.value=time;POST.uniforms.hurt.value=ME.hurt;POST.uniforms.flash.value=ME.flash;POST.uniforms.fear.value=ME.fear;
  const me=S&&S.players[NET.myId];POST.uniforms.lowhp.value=me&&!me.dead?clamp((40-me.hp)/40,0,1):0;POST.uniforms.dead.value=me&&me.dead?Math.min(1,ME.deathT/1.5)*(ME.deathT<2.2?1:.35):0;
  FL.getWorldPosition(DUST.uniforms.lp.value);FL.target.getWorldPosition(_ld);DUST.uniforms.ld.value.copy(_ld).sub(DUST.uniforms.lp.value).normalize();DUST.uniforms.cp.value.copy(camera.position);
  DUST.uniforms.on.value=FL.intensity>1?Math.min(1,FL.intensity/30):0;DUST.uniforms.time.value=time;
  if(AU.ready){auListener();if(AU.amb)AU.amb.set(GAME.on?.16+ME.fear*.1:.12,1);
    AU.ambT-=dt;if(AU.ambT<=0){AU.ambT=rand(7,20);const a=rand(0,TAU),d=rand(10,24);SFX.creak({x:camera.position.x+Math.cos(a)*d,y:rand(2,6),z:camera.position.z+Math.sin(a)*d})}}
  renderer.setRenderTarget(RT);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(postScene,postCam)}

async function init(){
  try{await Promise.race([Promise.all([document.fonts.load("40px 'Special Elite'"),document.fonts.load("40px 'Creepster'")]),new Promise(r=>setTimeout(r,2500))])}catch(e){}
  MAT.eye.fog=false;
  // the same seed on every machine, so the old stock, dead lamps and clutter match across a crew
  {const mr=Math.random;let a=0x5eed13;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
   try{buildWorld();for(let i=0;i<BAYS.length;i++){const g=makeTrailer(!!BAYS[i].reefer);ROOT.add(g);TV.push({g,eng:null,beep:null,door:null,pd:0})}buildExtrasVisuals()}finally{Math.random=mr}}
  buildViewModel();
  bindShop();
  applyQuality();bindUI();saveNote();
  renderer.compile(scene,camera);
  $('loading').classList.add('hide');requestAnimationFrame(frame);
  window.GS={get S(){return S},set S(v){S=v},snap,applySnap,boxSnap,applyBoxes,frame,ADDS,SHOP,applyAdds,owned,nightSetup,startNight,FORK3D,ADDV,LAMPV,PV,PALV,ME,NET,GAME,HOST,SLOTS,COL,act,doAct,camera,renderer,scene,BM,MV,AV,LAMPS,BAYS,TV,spawnTruck,spawnStalker,startScare,simUpdate,localUpdate,drainEvents,AU,SFX,EVQ,endNight,gameOver,saveRun,loadSave,restoreRun,startSolo,hostStartGame,forkTip,findTarget,roofUpdate,poseGiant,addPlayer,slotOn,bayOn,boxWorld,relabel,toast,applyBoxes,K2:{SHRED,CAR_UP,CAR_DN,VENT,LADDER,HATCH,STASH,COLD,BASE,ROOF,RROOM,WH,GEN,FUELR,CONV,STATION},get ROOFG(){return ROOFG},get GIANT(){return GIANT},CONV,showMenu,renderShop,K,onKey2,truckGone,spiderDoor,spawnAuditor,spFree,kickAim,MV,onKey,priceOf,isTeam,owned,netHost,netJoin,

    shot(){renderer.setRenderTarget(RT);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(postScene,postCam);return canvas.toDataURL('image/jpeg',.85)}}}
init().catch(e=>{console.error(e);$('loading').textContent='Something went wrong while loading: '+(e&&e.message||e)});
