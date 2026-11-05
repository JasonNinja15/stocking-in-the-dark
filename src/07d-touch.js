
// ===================================================================== touch controls (phones and tablets)
// Left thumb: a stick that appears wherever you put it down (push it all the way up to run).
// Right thumb: drag anywhere to look, and the buttons in the corner press the same keys the keyboard
// would (USE is E, KICK is Q, ITEM is Space...), so holding USE at the charger or ITEM with the scanner just works.
// Items on the hotbar can be tapped to pick them.
const TOUCH_KEYS=['KeyE','KeyQ','Space','KeyF','KeyG','KeyH','KeyR'];
const TT={stick:null,look:null,btn:new Map(),vis:false,el:null,knob:null,base:null,R:60,portraitOk:false};
function touchDetect(){const m=SET.touch||'auto';
  TOUCH.on=m==='on'||(m!=='off'&&!!(matchMedia&&matchMedia('(pointer:coarse)').matches));
  document.body.classList.toggle('touch',TOUCH.on);document.documentElement.style.setProperty('--tbs',String(SET.tbs||1));
  GAME.lastPr=null;GAME.lastHb=null;buildKeymap();
  // Settings shows the sensitivity for what you play with: the screen on touch, the mouse otherwise
  const row=id=>{const e=$(id);return e&&e.closest('.row')};if(row('sSens'))row('sSens').classList.toggle('hide',TOUCH.on);
  if(row('sTsens'))row('sTsens').classList.toggle('hide',!TOUCH.on);if(row('sTbs'))row('sTbs').classList.toggle('hide',!TOUCH.on);
  if(typeof applyQuality==='function'&&renderer)applyQuality();if(TOUCH.on&&document.pointerLockElement)document.exitPointerLock()}
function touchRelease(){for(const k of TOUCH_KEYS)K[k]=false;TJ.x=TJ.y=0;TJ.run=false;TT.stick=TT.look=null;TT.btn.clear();
  if(TT.base)TT.base.classList.add('hide');if(TT.el)TT.el.querySelectorAll('.tb.on').forEach(b=>b.classList.remove('on'))}
function touchSetup(){
  const el=document.createElement('div');el.id='touch';el.className='hide';
  el.innerHTML=`<div id="tStick" class="hide"><i></i></div>
    <button class="tb" id="tPause" data-k="pause" aria-label="Pause">&#10074;&#10074;</button>
    <div id="tBtns">
      <button class="tb big" data-k="KeyE" id="tUse">USE</button>
      <button class="tb" data-k="KeyQ" id="tKick">KICK</button>
      <button class="tb" data-k="Space" id="tItem">ITEM</button>
      <button class="tb sm" data-k="KeyF" id="tLight">LIGHT</button>
      <button class="tb sm" data-k="KeyG" id="tDrop">DROP</button>
      <button class="tb sm hide" data-k="KeyH" id="tLamp">LAMP</button>
      <button class="tb sm hide" data-k="KeyR" id="tShake">SHAKE</button>
    </div>`;
  document.body.appendChild(el);TT.el=el;TT.base=$('tStick');TT.knob=TT.base.firstChild;
  const rot=document.createElement('div');rot.id='rotate';rot.className='hide';
  rot.innerHTML=`<div class="card"><h2>TURN YOUR PHONE SIDEWAYS</h2><div class="lbl">The warehouse is wide. It plays best held landscape.</div><button id="bRotOk" class="small">Play upright anyway</button></div>`;
  document.body.appendChild(rot);$('bRotOk').onclick=()=>{TT.portraitOk=true;rot.classList.add('hide')};
  const opt={passive:false};
  el.addEventListener('touchstart',e=>{e.preventDefault();auInit();for(const t of e.changedTouches)touchDown(t)},opt);
  el.addEventListener('touchmove',e=>{e.preventDefault();for(const t of e.changedTouches)touchMove(t)},opt);
  const up=e=>{e.preventDefault();for(const t of e.changedTouches)touchUp(t)};
  el.addEventListener('touchend',up,opt);el.addEventListener('touchcancel',up,opt);
  el.addEventListener('contextmenu',e=>e.preventDefault());
  // tapping an item on the hotbar picks it
  $('hotbar').addEventListener('touchstart',e=>{const s=e.target.closest('[data-k]');if(!s||!TOUCH.on)return;e.preventDefault();
    const me=S&&S.players[NET.myId];if(!me||me.dead)return;
    if(s.dataset.k==='lamp'){keyPress('KeyH');return}if(ME.sel!==s.dataset.k){ME.sel=s.dataset.k;SFX.click()}},opt);
  // phones go full screen (and try to stay landscape) when a shift starts or resumes
  document.addEventListener('click',e=>{if(!TOUCH.on)return;const b=e.target.closest&&e.target.closest('button');
    if(b&&(/^b(Solo|Host|Join|Cont2?|Start|Resume|Again)$/.test(b.id)||b.dataset.code))goFull()},true);
  // switching apps mid-shift takes you to the break room (solo, that stops the clock)
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&TOUCH.on&&GAME.on&&!GAME.overShown&&!(S&&S.phase==='shop'))showPause()});
  addEventListener('resize',()=>{if(TT.vis)touchRelease()});
  // Settings: touch controls on/off, look speed, button size
  // the screen sensitivity slider sits where the mouse one is
  {const ms=$('sSens')&&$('sSens').closest('.row'),ts=$('sTsens')&&$('sTsens').closest('.row');if(ms&&ts)ms.after(ts)}
  const set=$('touchSet');
  if(set){$('sTouch').value=SET.touch||'auto';$('sTouch').onchange=()=>{SET.touch=$('sTouch').value;saveSet();touchDetect()};
    const sl=(id,key,fmt,ap)=>{const i=$(id),o=$('v'+id.slice(1));i.value=SET[key]||1;o.textContent=fmt(+i.value);i.oninput=()=>{SET[key]=+i.value;o.textContent=fmt(+i.value);saveSet();ap&&ap()}};
    sl('sTsens','tsens',v=>v.toFixed(2));sl('sTbs','tbs',v=>Math.round(v*100)+'%',()=>document.documentElement.style.setProperty('--tbs',String(SET.tbs)))}
  touchDetect()}
function goFull(){const d=document.documentElement;if(document.fullscreenElement||document.webkitFullscreenElement)return;
  const f=d.requestFullscreen||d.webkitRequestFullscreen;if(!f)return;
  try{const p=f.call(d,{navigationUI:'hide'});const lock=()=>{try{const o=screen.orientation;if(o&&o.lock)o.lock('landscape').catch(()=>{})}catch(e){}};
    if(p&&p.then)p.then(lock).catch(()=>{});else lock()}catch(e){}}
function touchDown(t){const b=t.target&&t.target.closest&&t.target.closest('.tb');
  if(b){const k=b.dataset.k;TT.btn.set(t.identifier,b);b.classList.add('on');
    if(k==='pause'){if(GAME.on&&!GAME.overShown)showPause();return}
    if(k==='dev'){devToggle();return}
    if(navigator.vibrate&&(!navigator.userActivation||navigator.userActivation.hasBeenActive))try{navigator.vibrate(8)}catch(e){}
    K[k]=true;keyPress(k);return}
  if(t.clientX<innerWidth*.42&&!TT.stick){ // the stick comes up under your thumb
    TT.R=Math.max(44,Math.min(innerWidth,innerHeight)*.13);
    TT.stick={id:t.identifier,ox:t.clientX,oy:t.clientY};TJ.x=TJ.y=0;
    TT.base.style.left=t.clientX+'px';TT.base.style.top=t.clientY+'px';TT.base.style.width=TT.base.style.height=TT.R*2+'px';TT.knob.style.transform='translate(-50%,-50%)';TT.base.classList.remove('hide','run');return}
  if(!TT.look)TT.look={id:t.identifier,x:t.clientX,y:t.clientY,sx:t.clientX,sy:t.clientY,t0:performance.now()}}
function touchMove(t){
  if(TT.stick&&t.identifier===TT.stick.id){let dx=t.clientX-TT.stick.ox,dy=t.clientY-TT.stick.oy;const R=TT.R,d=Math.hypot(dx,dy);
    // dragged well past the rim, the stick follows your thumb so it never gets stuck at the edge
    if(d>R*1.6){const k=(d-R*1.6)/d;TT.stick.ox+=dx*k;TT.stick.oy+=dy*k;dx=t.clientX-TT.stick.ox;dy=t.clientY-TT.stick.oy;TT.base.style.left=TT.stick.ox+'px';TT.base.style.top=TT.stick.oy+'px'}
    const m=Math.min(1,Math.hypot(dx,dy)/R),a=Math.atan2(dy,dx),dz=.14,v=m<dz?0:(m-dz)/(1-dz);
    TJ.x=Math.cos(a)*v;TJ.y=Math.sin(a)*v;TJ.run=v>.93&&TJ.y<-.55;
    TT.knob.style.transform=`translate(calc(-50% + ${Math.cos(a)*m*R}px),calc(-50% + ${Math.sin(a)*m*R}px))`;TT.base.classList.toggle('run',TJ.run);return}
  if(TT.look&&t.identifier===TT.look.id){const dx=t.clientX-TT.look.x,dy=t.clientY-TT.look.y;TT.look.x=t.clientX;TT.look.y=t.clientY;
    if(!GAME.on||GAME.paused)return;const s=.0052*(SET.tsens||1);ME.yaw-=dx*s;ME.pitch=clamp(ME.pitch-dy*s,-1.45,1.45)}}
function touchUp(t){const b=TT.btn.get(t.identifier);
  if(b){TT.btn.delete(t.identifier);b.classList.remove('on');const k=b.dataset.k;if(k!=='pause'&&![...TT.btn.values()].some(o=>o.dataset.k===k))K[k]=false;return}
  if(TT.stick&&t.identifier===TT.stick.id){TT.stick=null;TJ.x=TJ.y=0;TJ.run=false;TT.base.classList.add('hide');return}
  if(TT.look&&t.identifier===TT.look.id){const L=TT.look;TT.look=null;
    // watching a crewmate after you go down, a tap switches to the next one
    const me=S&&S.players[NET.myId];if(me&&me.dead&&performance.now()-L.t0<350&&Math.hypot(t.clientX-L.sx,t.clientY-L.sy)<14)specCycle(1)}}
// every frame: show the controls only while you're on shift, and fit the buttons to what you're doing
const _tl={};
function touchTick(){const vis=TOUCH.on&&GAME.on&&!$('hud').classList.contains('hide')&&SCREENS.every(s=>$(s).classList.contains('hide'));
  if(vis!==TT.vis){TT.vis=vis;TT.el.classList.toggle('hide',!vis);if(!vis)touchRelease()}
  $('rotate').classList.toggle('hide',!(vis&&!TT.portraitOk&&innerHeight>innerWidth*1.1));
  if(!vis)return;const me=S&&S.players[NET.myId];if(!me)return;
  const dead=!!me.dead,lab=(id,s)=>{if(_tl[id]!==s){_tl[id]=s;$(id).textContent=s}},hid=(id,h)=>$(id).classList.toggle('hide',h);
  const sel=dead?'':curSel(me);
  lab('tUse',dead?'NEXT':ME.grab?'PULL':'USE');lab('tKick',dead?'BACK':ME.grab?'PULL':ME.driving?'GET OUT':ME.cart>=0?'LET GO':'KICK');
  lab('tItem',sel?(ITEM_ICON[sel]||'ITEM').toUpperCase():'ITEM');hid('tItem',dead||!sel);
  hid('tLight',dead);hid('tDrop',dead||(me.carry<0&&!(ME.driving&&S.fork&&S.fork.pal>=0)));
  hid('tLamp',dead||!(me.up&&me.up.red));hid('tShake',dead||!(me.up&&me.up.shake)||ME.driving);
  $('tLight').classList.toggle('lit',ME.lightOn());$('tLamp').classList.toggle('lit',!!ME.red)}
touchSetup();

// ===================================================================== full screen and the app
// Two buttons in the bottom corners of the title screen and the break room: Full screen (any device that
// allows it) and, on phones and tablets, Get the app (install it to the home screen; it then opens full screen).
let INSTALL_EVT=null,INSTALL_BACK='menu';
const isApp=()=>!!(matchMedia('(display-mode: fullscreen)').matches||matchMedia('(display-mode: standalone)').matches||navigator.standalone);
const fsEl=()=>document.fullscreenElement||document.webkitFullscreenElement;
const fsOk=()=>{const d=document.documentElement;return!!(d.requestFullscreen||d.webkitRequestFullscreen)&&!matchMedia('(display-mode: fullscreen)').matches};
function cornerSync(){const c=$('corner');if(!c)return;const on=['menu','pause'].some(s=>!$(s).classList.contains('hide'));c.classList.toggle('hide',!on);if(!on)return;
  $('bFull').classList.toggle('hide',!fsOk());$('bFull').innerHTML=fsEl()?'&#x2716; Exit full screen':'&#x26F6; Full screen';
  const mobile=TOUCH.on||matchMedia('(pointer:coarse)').matches||/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  $('bApp').classList.toggle('hide',!mobile||isApp())}
function toggleFull(){if(fsEl()){const x=document.exitFullscreen||document.webkitExitFullscreen;try{const p=x&&x.call(document);if(p&&p.catch)p.catch(()=>{})}catch(e){}}else goFull()}
async function getApp(){
  if(INSTALL_EVT){const e=INSTALL_EVT;INSTALL_EVT=null;try{await e.prompt();const r=await e.userChoice;if(r&&r.outcome==='accepted')$('bApp').classList.add('hide')}catch(err){}return}
  // no install prompt from the browser: say how to do it by hand
  const ios=/iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  $('installHow').innerHTML=!/^https?:/.test(location.protocol)?'The game has to be opened from its web address (not a saved file) to be installed.'
    :ios?'In Safari, tap the <b>Share</b> button (the square with an arrow), then <b>Add to Home Screen</b>. Open it from the new icon and it plays full screen with no browser bars.'
    :'Open the browser menu (<b>&#8942;</b>, top right) and choose <b>Install app</b> or <b>Add to Home screen</b>. Open it from the new icon and it plays full screen.';
  INSTALL_BACK=$('pause').classList.contains('hide')?'menu':'pause';show('install')}
(()=>{const c=document.createElement('div');c.id='corner';c.className='hide';
  c.innerHTML='<button class="small" id="bApp">&#x2913; Get the app</button><button class="small" id="bFull">&#x26F6; Full screen</button>';document.body.appendChild(c);
  $('bFull').onclick=()=>{toggleFull();setTimeout(cornerSync,300)};$('bApp').onclick=getApp;$('bInstallBack').onclick=()=>show(INSTALL_BACK);
  document.addEventListener('fullscreenchange',cornerSync);document.addEventListener('webkitfullscreenchange',cornerSync);
  addEventListener('beforeinstallprompt',e=>{e.preventDefault();INSTALL_EVT=e;cornerSync()});
  addEventListener('appinstalled',()=>{INSTALL_EVT=null;cornerSync()});
  if('serviceWorker' in navigator&&/^https?:/.test(location.protocol))addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
  cornerSync()})();
