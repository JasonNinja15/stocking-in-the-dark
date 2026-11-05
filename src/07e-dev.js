// ===================================================================== the dev console (client side)
// A player named "Flingus Dingus" presses X in a match (or taps DEV on a touch screen) to open it. The buttons send
// commands to the host, which checks the name again before doing anything (see devAct).
const DEV={open:false,el:null};
function devOk(){if(!GAME.on||!S)return false;const me=S.players[NET.myId];return isDevName(me?me.name:myName())}
function devKey(){if(!devOk())return false;devToggle();return true}
function devBuild(){if(DEV.el)return;const el=document.createElement('div');el.id='dev';el.className='hide';
  const b=(k,label,extra='')=>`<button class="small" data-dev="${k}"${extra}>${label}</button>`;
  el.innerHTML=`<div class="devHead"><b>DEV CONSOLE</b><button class="small" data-dev="close" aria-label="Close">&#10005;</button></div>
    <div class="devNote">Only you can see this. Press <kbd>X</kbd> to close.</div>
    <div class="devLbl">Nights</div><div class="devRow">${b('skip','Skip this night')}</div>
    <div class="devLbl">Money</div><div class="devRow">${[100,1000,10000].map(n=>b('cash',`+$${n.toLocaleString()}`,` data-n="${n}"`)).join('')}</div>
    <div class="devLbl">Spawn a monster</div><div class="devRow">${DEV_MONS.map(([ty,nm])=>b('mon',nm,` data-ty="${ty}"`)).join('')}</div>
    <div class="devNote" id="devMsg"></div>`;
  const css=document.createElement('style');
  css.textContent=`#dev{position:fixed;top:max(12px,env(safe-area-inset-top));right:max(12px,env(safe-area-inset-right));z-index:40;width:min(380px,calc(100vw - 32px));max-height:calc(100vh - 24px);overflow:auto;
      background:rgba(12,10,9,.94);border:1px solid #ffb84a;padding:12px 14px;font-size:14px;color:var(--ink);box-shadow:0 6px 30px rgba(0,0,0,.6)}
    #dev.hide{display:none}#dev .devHead{display:flex;justify-content:space-between;align-items:center;color:#ffd890;letter-spacing:.12em}
    #dev .devHead button{padding:2px 9px}#dev .devLbl{margin:10px 0 5px;color:#c4b99f;font-size:12px;letter-spacing:.1em;text-transform:uppercase}
    #dev .devRow{display:flex;flex-wrap:wrap;gap:6px}#dev .devRow button{padding:6px 10px;font-size:13px}
    #dev .devNote{color:#a99f88;font-size:12px;margin-top:6px}#dev #devMsg{color:#8fd48a;min-height:1em}
    #touch #tDev{left:calc(50% + var(--u)*.52);top:max(6px,env(safe-area-inset-top));width:calc(var(--u)*.66);height:calc(var(--u)*.66);font-size:calc(var(--u)*.16);border-radius:8px;border-color:#ffb84a;color:#ffd890}`;
  document.head.appendChild(css);document.body.appendChild(el);DEV.el=el;
  el.addEventListener('click',e=>{const t=e.target.closest('[data-dev]');if(!t)return;const k=t.dataset.dev;SFX.click();
    if(k==='close')return devToggle(false);
    if(k==='skip')doAct({a:'dev',k:'skip'});else if(k==='cash')doAct({a:'dev',k:'cash',n:+t.dataset.n});else if(k==='mon')doAct({a:'dev',k:'mon',ty:+t.dataset.ty});
    $('devMsg').textContent='Sent: '+t.textContent})}
function devToggle(on=!DEV.open){devBuild();DEV.open=on&&devOk();DEV.el.classList.toggle('hide',!DEV.open);$('devMsg').textContent='';
  // the mouse has to be free to click the buttons; closing the console goes straight back to the game
  if(DEV.open){if(document.pointerLockElement)document.exitPointerLock();return}
  if(GAME.on&&S&&S.phase==='play'&&!GAME.overShown&&!GAME.paused&&!TOUCH.on&&!locked()){reqLock();setTimeout(()=>{if(GAME.on&&!locked()&&!DEV.open&&!GAME.overShown&&S&&S.phase==='play')$('lockmsg').classList.remove('hide')},400)}}
addEventListener('keydown',e=>{if(DEV.open&&e.code==='Escape')devToggle(false)});
// a DEV button next to pause on touch screens, for the dev only; and the console shuts when the match ends
(function(){const tp=$('tPause');if(tp){const d=document.createElement('button');d.className='tb hide';d.id='tDev';d.dataset.k='dev';d.textContent='DEV';tp.after(d)}})();
setInterval(()=>{const ok=devOk();if(DEV.open&&!ok)devToggle(false);const d=$('tDev');if(d)d.classList.toggle('hide',!ok)},300);
