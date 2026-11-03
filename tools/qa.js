// Test harness for Stocking In The Dark. Load it into a running page (local server) with:
//   await import('/tools/qa.js?'+Date.now())
// It drives the game frame by frame (so it works with the tab in the background), adds bot workers that play the
// shift through the real host actions, and records every error. Nothing in the game loads this file.
const QA=window.QA={errs:[],log:[],T:performance.now()};
addEventListener('error',e=>QA.errs.push(String(e.message)));
const cerr=console.error.bind(console);console.error=(...a)=>{QA.errs.push(a.map(String).join(' ').slice(0,300));cerr(...a)};
const sleep0=()=>new Promise(r=>setTimeout(r,0));
// stop the page's own animation loop: from here on only QA drives frames
QA.freeze=()=>{window.requestAnimationFrame=()=>0};
// advance the game. Full frames (sim + client + render) every `every`th step, sim-only steps in between.
QA.run=async(sec,every=1)=>{const n=Math.round(sec/.05);for(let i=0;i<n;i++){QA.T+=50;
    try{if(i%every===0)GS.frame(QA.T);else if(!GS.GAME.paused)GS.simUpdate(.05)}catch(e){QA.errs.push('frame: '+e.message+' @'+(e.stack||'').split('\n')[1]);return}
    if(i%40===39)await sleep0()}};
QA.put=(x,z,yaw=0,pitch=0)=>{Object.assign(GS.ME,{x,z,yaw,pitch});const p=GS.S.players[GS.NET.myId];if(p)Object.assign(p,{x,z})};
QA.shot=()=>GS.shot();
// a contact sheet of shots in the page, two to a row, for the screenshot tool
QA.sheet=(shots,cols=2)=>{let b=document.getElementById('qasheet');if(b)b.remove();b=document.createElement('div');b.id='qasheet';
  b.style.cssText=`position:fixed;inset:0;z-index:99;display:grid;grid-template-columns:repeat(${cols},1fr);background:#000;align-content:start`;
  for(const s of shots){const i=document.createElement('img');i.src=s;i.style.width='100%';b.appendChild(i)}document.body.appendChild(b)};
QA.unsheet=()=>{const b=document.getElementById('qasheet');if(b)b.remove()};
// a lit look at a spot: brighter ambient and thin fog, camera placed by hand, then everything put back
QA.look=(x,y,z,yaw,pitch,lit=true)=>{const amb=GS.scene.children.find(o=>o.isHemisphereLight),a0=amb.intensity,f0=GS.scene.fog.density;
  if(lit){amb.intensity=1.6;GS.scene.fog.density=.012}GS.camera.position.set(x,y,z);GS.camera.rotation.set(pitch,yaw,0);GS.camera.updateMatrixWorld();
  const s=GS.shot();amb.intensity=a0;GS.scene.fog.density=f0;return s};
// look at a point from a spot
QA.lookAt=(x,y,z,tx,ty,tz,lit=true)=>{const dx=tx-x,dy=ty-y,dz=tz-z;return QA.look(x,y,z,Math.atan2(-dx,-dz),Math.atan2(dy,Math.hypot(dx,dz)),lit)};

QA.boot=async({diff=1,bots=3,adds=[],night=1}={})=>{GS.startSolo();QA.freeze();await QA.run(1);const S=GS.S;S.diff=diff;
  for(let i=1;i<=bots;i++)GS.addPlayer('b'+i,'Bot '+i,['#a4e33a','#38d4e8','#ff4fa8','#ffd23a','#9b6bff','#ff3b3b','#3bff9b','#3b7bff','#c08a5a'][i-1]);
  S.adds=adds.slice();GS.applyAdds();S.night=night;GS.startNight();QA.stats={nights:0,shelved:0,shortBy:[],deaths:0,events:{}};
  for(const id of['big','lockmsg'])document.getElementById(id).style.display='none';return S};

// ---- bots
const near=(p,x,z)=>{p.x=x;p.z=z};
function freeSlot(pred){const S=GS.S;return GS.SLOTS.find(s=>!s.old&&s.box===-1&&GS.slotOn(s)&&pred(s))}
QA.pace=.045; // chance per quarter second that a bot does its next thing (about one box per 11 s each, like a person)
function botStep(id){const S=GS.S,p=S.players[id];if(!p||p.dead)return;const K=GS.K2,act=a=>GS.act(id,a);
  if(S.chill&&id==='b1'&&Math.random()<.02){near(p,K.VENT.x,K.VENT.z+1.2);act({a:'vent'});return} // someone gets round to the cold, eventually
  if(Math.random()>QA.pace)return;
  // the cold: the first bot goes and fixes it
  const carry=p.carry>=0?S.boxes.find(b=>b.id===p.carry):null;
  if(carry){
    if(carry.ret){near(p,K.SHRED.x,K.SHRED.z+1.6);act({a:'shred'});return}
    const s=freeSlot(s=>carry.fz?s.cold:!s.cold);if(!s){near(p,p.x,p.z);act({a:'drop',x:p.x,z:p.z,ry:0});return}
    near(p,s.x,s.z+(s.rot?0:1.2));act({a:'place',s:s.id});return}
  // something to pick up: trailers first, then the floor (basement returns included)
  const docked=S.boxes.filter(b=>b.st===0&&S.trucks[b.bay]&&S.trucks[b.bay].st===2);
  const floor=S.boxes.filter(b=>b.st===3);const b=docked[Math.floor(Math.random()*docked.length)]||floor[Math.floor(Math.random()*floor.length)];
  if(!b)return;const w=GS.boxWorld(b);near(p,w.x,w.z+.8);
  if(Math.random()<.3)act({a:'kick',b:b.id}); // they check some boxes first
  act({a:'pick',b:b.id})}
function botShop(id){const S=GS.S,p=S.players[id];if(!p)return;
  const ks=Object.keys(GS.SHOP).concat(Object.keys(GS.ADDS));for(let i=0;i<3;i++){const k=ks[Math.floor(Math.random()*ks.length)];GS.act(id,{a:'buy',k})}
  if(!(S.votes||[]).includes(id))GS.act(id,{a:'start'})}

// play nights with the bots; keeps everyone alive (recording deaths) so the run carries on
QA.play=async(nights=1,{keepAlive=true,every=8,topUp=true}={})=>{const S=GS.S;
  for(let n=0;n<nights;n++){const start=S.night;let guard=0;
    while(S.night===start&&S.phase!=='shop'&&guard++<9000){
      if(S.phase==='play')for(const id in S.players)if(id!=='me')botStep(id);
      for(const p of Object.values(S.players)){if(p.dead){QA.stats.deaths++;if(keepAlive){p.dead=false;p.hp=100}}else if(keepAlive&&p.hp<25)p.hp=60}
      if(S.over){QA.log.push(`night ${S.night}: over (${S.over.why})`);S.over=null}
      // bots can fall short; note by how much and top up so the run continues
      if(topUp&&S.phase==='play'&&S.ot&&S.shelved<S.quota){QA.stats.shortBy.push(S.quota-S.shelved);S.shelved=S.quota}
      for(const m of S.mons)QA.stats.events['ty'+m.ty]=1;if(S.rg)QA.stats.events.roofGiant=1;if(S.yard)QA.stats.events.yard=1;if(S.chill)QA.stats.events['chill_'+S.chill.st]=1;if(S.outage)QA.stats.events.outage=1;
      await QA.run(.25,every);if(QA.errs.length>40)return}
    QA.stats.nights++;
    // the shop: bots buy things and vote; so does the local player
    let g=0;while(S.phase==='shop'&&g++<200){for(const id in S.players)if(id!=='me')botShop(id);if(!(S.votes||[]).includes('me'))GS.act('me',{a:'start'});await QA.run(.25,every)}}};
const SHIFT_END_GUESS=()=>360;
export default QA;
// photograph every monster that's out right now from a few metres in front of it, lit
QA.gallery=(dist=3.2)=>{const S=GS.S,seen=new Set(),out=[];if(GS.ME.scare){GS.camera.remove(GS.ME.scare.g);GS.ME.scare=null}Object.assign(GS.ME,{hurt:0,flash:0,fear:0,shake:0});
  for(const m of S.mons){if(seen.has(m.ty))continue;const v=GS.MV.get(m.id);if(!v||!v.g)continue;seen.add(m.ty);v.g.updateMatrixWorld(true);
    const p=v.g.position,ry=v.g.rotation.y,cx=p.x+Math.sin(ry)*dist,cz=p.z+Math.cos(ry)*dist,h=m.ty===3?Math.max(1.6,p.y):1.4;
    out.push({ty:m.ty,st:m.st,shot:QA.lookAt(cx,1.6,cz,p.x,Math.max(.8,(m.y||0)+1.2),p.z)})}
  return out};
