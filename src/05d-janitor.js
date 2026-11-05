// ===================================================================== the night janitor (ty 17), night 5 and on (host side)
// A tall figure in grey overalls who comes out of the closet on the east wall and mops the aisles end to end, pushing a
// squeaking bucket and humming to himself. The floor behind him stays wet for about a minute. Walking on it is safe; run
// on it and you slip and go down for a couple of seconds (the fall is loud). He never touches anyone who is standing up.
// Anyone on the floor within earshot, he comes for, and if he reaches them before they're up he takes them by the ankle
// and drags them back to his closet. Mash E to kick free; a crewmate next to you can mash E to pull you free; a strobe
// makes him let go. Once he gets you through the closet door you're shut in (unhurt, no jumpscare) until a crewmate
// opens it and lets you out; you watch the crew meanwhile. With nobody left to let you out, you don't come out at all.
const JAN={door:{x:29.5,z:-3.5},from:5,wetR:.95,wetLife:55,wetMax:48,step:1.35,grip:1.4,minDrag:3.5,strugN:20,helpK:1.5,helpR:2.4,
  walk:.95,come:6.4,drag:1.15,hear:26,freeR:2.6,reach:1.15,grace:10};
// the aisles he mops: north of the first rack row, between the rows, and south of the last one
const JAN_AISLES=[-8.5,-3.5,1.5,6.5,11.5],JAN_ENDS=[-25.5,25.5];
// how long a slip keeps you on the floor: Easy, Normal, Hard
const slipDur=()=>[2.1,2.6,3.0][S&&DIFFS[S.diff]?S.diff:1];
let wetSeq=1;
// a wet patch under (x,z), if there is one
function wetAt(x,z,pad=0){if(!S||!S.wet)return null;for(const w of S.wet)if(Math.hypot(x-w.x,z-w.z)<JAN.wetR+pad)return w;return null}
function nightSetupJan(){S.wet=[];S.wver=(S.wver|0)+1;HOST.janAt=S.night>=JAN.from?rand(-S.extra+25,SHIFT_END*.3):1e9;HOST.janDone=false;
  for(const p of Object.values(S.players))Object.assign(p,{down:0,janCD:0,slipT:-99,locked:false})}
function addWet(x,z,sign){if(!S.wet)S.wet=[];if(x<WH.x0+.3||x>WH.x1-.3||z<WH.z0+.3||z>WH.z1-.3)return;
  const old=S.wet.find(w=>Math.hypot(w.x-x,w.z-z)<.6);if(old){old.t=JAN.wetLife;S.wver++;return}
  S.wet.push({id:wetSeq++,x:r2(x),z:r2(z),t:JAN.wetLife,s:sign?1:0});while(S.wet.length>JAN.wetMax)S.wet.shift();S.wver++}
function spawnJanitor(){if(S.mons.some(m=>m.ty===17))return;const d=JAN.door;
  S.mons.push({id:monSeq++,ty:17,x:d.x-.6,z:d.z,y:0,ry:-Math.PI/2,st:'mop',a:2,k:0,t:0,tg:'',path:null,rep:0,trav:0,n:0,leg:null});
  emit({e:'janIn',x:d.x,z:d.z})}
// every tick during a shift: the floor dries, people get back up, and he comes out once the shift is under way
function janTick(dt){
  if(S.wet&&S.wet.length){const n=S.wet.length;S.wet=S.wet.filter(w=>(w.t-=dt)>0);if(S.wet.length!==n)S.wver++}
  for(const p of Object.values(S.players)){if(p.down>0)p.down=Math.max(0,p.down-dt);if(p.janCD>0)p.janCD=Math.max(0,p.janCD-dt)}
  if(!HOST.janDone&&S.t>=HOST.janAt){HOST.janDone=true;spawnJanitor()}
  // shut in with nobody left out on the floor to open the door: that's the end of them
  const shut=Object.values(S.players).filter(p=>p.locked&&!p.dead);if(shut.length&&!alivePlayers().length)for(const p of shut){p.locked=false;damage(p,999)}}
// where you stand to open his closet: just inside the warehouse, in front of the door
const janDoorAt=()=>({x:JAN.door.x-.9,z:JAN.door.z});
// dragged through the door: shut in, unhurt, until someone opens it. Alone (nobody else still up), you don't come out.
function janLock(v){emit({e:'jcloset',p:v.id,n:v.name,x:JAN.door.x,z:JAN.door.z});
  if(!alivePlayers().some(q=>q.id!==v.id)){damage(v,999);return}
  dropCarry(v);Object.assign(v,{locked:true,down:0,strug:0,janCD:0,x:JAN.door.x+1.2,z:JAN.door.z,tpT:.5})}
// a crewmate at the closet door lets everyone in there out
function janFree(p){if(!p||p.dead||p.locked)return;const d=janDoorAt();if(Math.hypot(p.x-d.x,p.z-d.z)>JAN.freeR)return;
  const shut=Object.values(S.players).filter(q=>q.locked&&!q.dead);if(!shut.length)return;
  shut.forEach((q,i)=>{const x=d.x-.4-i*.5,z=d.z+(i%2?.6:-.6);Object.assign(q,{locked:false,x,z,yaw:Math.PI/2,tpT:.6,janCD:JAN.grace});emit({e:'tp',p:q.id,x:r2(x),z:r2(z),yaw:r3(Math.PI/2)})});
  emit({e:'jout',p:p.id,n:p.name,who:shut.map(q=>q.name).join(' and '),ids:shut.map(q=>q.id),x:JAN.door.x,z:JAN.door.z})}
// someone ran onto a wet patch (the client that did it says so; the host checks the floor really is wet there)
function janSlip(p){if(!p||p.dead||S.phase!=='play'||p.down>0||S.t-(p.slipT??-99)<1.5)return;
  if(!wetAt(p.x,p.z,.6)||!inWH(p)||onRoof(p)||(S.fork&&S.fork.drv===p.id)||S.mons.some(m=>m.ty===17&&m.st==='drag'&&m.tg===p.id))return;
  p.slipT=S.t;{const ci=cartOf(p.id);if(ci>=0)cartLetGo(S.carts[ci])}dropCarry(p); // whatever you had goes down with you
  p.down=Math.max(.3,slipDur()-.3); // (a little less than the client's own, so the host never thinks you're still down once you're up)
  noise(p.x,p.z,12);damage(p,6);emit({e:'slip',p:p.id,x:r2(p.x),z:r2(p.z)})}
// keep whoever he has by the ankle on the floor behind him
function janHold(m,v){let x=m.x-Math.sin(m.ry)*1.15,z=m.z-Math.cos(m.ry)*1.15;if(insideAny(x,z,.2)){x=m.x;z=m.z}
  v.x=clamp(x,WH.x0+.35,WH.x1-.35);v.z=clamp(z,WH.z0+.35,WH.z1-.35);v.down=Math.max(v.down||0,1)}
// he lets go: kicked free, pulled free, or flashed with a strobe
function janRelease(m,v,how){if(v){v.down=0;v.strug=0;v.janCD=JAN.grace;if(how==='kick')damage(v,10)}
  m.st='stun';m.t=0;m.stunT=how==='strobe'?6:3;m.tg='';m.path=null;emit({e:'jfree',p:v?v.id:'',how,x:r2(m.x),z:r2(m.z)})}
function janStrobe(m){if(m.st==='inside')return;if(m.st==='drag'){janRelease(m,S.players[m.tg],'strobe');return}
  m.st='stun';m.t=0;m.stunT=5;m.tg='';m.path=null;emit({e:'jstun',x:r2(m.x),z:r2(m.z)})}
// a crewmate next to someone he's dragging pulls at them
function janHelp(p){if(!p||p.dead||S.t-(p.hgT??-1e9)<.06)return;p.hgT=S.t;const m=S.mons.find(o=>o.ty===17&&o.st==='drag');if(!m)return;
  const v=S.players[m.tg];if(!v||v.id===p.id||Math.hypot(p.x-v.x,p.z-v.z)>JAN.helpR+.4)return;v.strug=(v.strug||0)+JAN.helpK;v.sgT=S.t}
// mop an aisle end to end: the nearer end first, then back along the whole length
function janAisle(m){if(m.leg){m.tx=m.leg.x;m.tz=m.leg.z;m.leg=null;m.path=null;return}
  const z=pick(JAN_AISLES),e=JAN_ENDS.slice().sort((a,b)=>Math.abs(a-m.x)-Math.abs(b-m.x));m.tx=e[0];m.tz=z;m.leg={x:e[1],z};m.path=null}
// a: 0 standing, 1 mopping on the spot, 2 walking and mopping, 3 stunned, 4 hurrying, 5 dragging someone. k: 1 while he's in his closet
function janitorUpdate(m,dt){m.t+=dt;if(m.st!=='drag')m.v=0;
  if(m.st==='inside'){m.a=0;m.k=1;m.x=JAN.door.x+.4;m.z=JAN.door.z;if(m.t>m.wait){m.st='mop';m.t=0;m.k=0;m.x=JAN.door.x-.6;m.ry=-Math.PI/2;m.leg=null;m.tx=undefined;emit({e:'janIn',x:JAN.door.x,z:JAN.door.z})}return}
  if(m.st==='stun'){m.a=3;if(m.t>m.stunT){m.st='pause';m.t=0;m.pauseT=1.5}return}
  if(m.st==='drag'){const v=S.players[m.tg];
    if(!v||v.dead||!inWH(v)){m.st='pause';m.t=0;m.pauseT=2;m.tg='';return}
    if(S.t-(v.sgT??-1e9)>.25)v.strug=Math.max(0,(v.strug||0)-dt*STRUG_DECAY); // stop mashing and his grip comes back
    m.v=Math.min(JAN.strugN,Math.round(v.strug||0)); // (the snapshot carries how close they are to kicking free, crewmates' help included)
    if((v.strug||0)>=JAN.strugN){janRelease(m,v,'kick');return}
    m.a=5;janHold(m,v);if(m.t<JAN.grip)return; // he takes a moment to get a grip
    const d=monWalk(m,JAN.door.x-.3,JAN.door.z,JAN.drag,dt);janHold(m,v);
    if(d<.5&&m.t>JAN.grip+JAN.minDrag){ // in through the closet door, and it shuts behind them
      janLock(v); // (no jumpscare, no harm: the door just shuts on them)
      m.st='inside';m.t=0;m.wait=rand(18,26);m.k=1;m.tg=''}
    return}
  // anyone on the floor within earshot: he leaves the mop and comes for them
  let tgt=null,bd=JAN.hear;
  for(const p of alivePlayers()){if(!(p.down>.25)||p.janCD>0||!inWH(p)||onRoof(p)||inTrailer(p)>=0)continue;const d=Math.hypot(p.x-m.x,p.z-m.z);if(d<bd){bd=d;tgt=p}}
  if(tgt){if(m.st!=='come'){m.st='come';m.path=null;emit({e:'janCome',p:tgt.id,x:r2(m.x),z:r2(m.z)})}m.tg=tgt.id;m.a=4;
    if(bd<JAN.reach){m.st='drag';m.t=0;tgt.strug=0;tgt.sgT=-1e9;janHold(m,tgt);emit({e:'jgrab',p:tgt.id,n:tgt.name,id:m.id});return}
    monWalk(m,tgt.x,tgt.z,JAN.come,dt);return}
  if(m.st==='come'){m.st='pause';m.t=0;m.pauseT=rand(2,3);m.tg='';m.leg=null;m.tx=undefined} // they got up in time
  if(m.st==='pause'){m.a=1;if(m.t>m.pauseT){m.st='mop';m.t=0}return}
  if(m.tx===undefined)janAisle(m);
  m.a=2;const ox=m.x,oz=m.z,left=monWalk(m,m.tx,m.tz,JAN.walk,dt);
  m.trav+=Math.hypot(m.x-ox,m.z-oz);if(m.trav>=JAN.step){m.trav=0;m.n++;addWet(m.x,m.z,m.n%5===1)} // a yellow sign every so often
  if(left<.6||(m.path&&!m.path.length&&left<2.5)||m.t>75){addWet(m.x,m.z,false);m.tx=undefined;m.st='pause';m.t=0;m.pauseT=rand(2,4)}}
MON_UPD[17]=janitorUpdate;
DEV_MONS.push([17,'Night janitor']);
