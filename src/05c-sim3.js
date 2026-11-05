// ===================================================================== two later creatures (host side)
// Each one shows up on roughly every other night: a little over half the time after a night without it, and only a fifth
// of the time straight after a night it came. The long-legged thing from night 6, the auditor from night 11.
function rollVisit(last,from){if(S.night<from)return false;const p=(last===S.night-1?.2:.65)*Math.min(1.25,Math.sqrt(diffEv()));return Math.random()<p}
function nightSetup3(){
  HOST.spAt=rollVisit(S.spLast,6)?rand(SHIFT_END*.12,SHIFT_END*.55):1e9;HOST.spDone=false;
  HOST.audAt=rollVisit(S.audLast,11)?rand(SHIFT_END*.15,SHIFT_END*.6):1e9;HOST.audDone=false}
function update3(dt){if(!HOST.audDone&&S.t>=HOST.audAt&&S.t<SHIFT_END-90){HOST.audDone=true;spawnAuditor()}}

// ---------------------------------------------------------------- the long-legged thing (ty 15)
// Eight long legs round a flat body and a stubby head, taller than the racks, blackish purple, and completely blind.
// When a door motor sticks open it sometimes climbs in through that bay instead of the thing in the yard showing up,
// crouched low with its legs folded in. It walks straight over the racks (the legs over a rack fold up into the body),
// and anything it hears it walks to and stomps, hurting whoever is under it. After two minutes it leaves in the next
// truck that pulls out, crouching to fit in the trailer.
const SP_H=4.6,SP_LOW=1.2,SP_LIFE=120;
function spFree(x,z,pad=1.1){if(x<WH.x0+2.6||x>WH.x1-2.6||z<WH.z0+2.6||z>WH.z1-2.6)return false;
  for(const c of COL)if(c.on&&!c.dyn&&!c.rack&&x>c.x0-pad&&x<c.x1+pad&&z>c.z0-pad&&z<c.z1+pad)return false;return true}
// how far along a straight line it can walk before something other than a rack is in the way
function spReach(ax,az,bx,bz){const d=Math.hypot(bx-ax,bz-az),n=Math.ceil(d/.5);let ok=0;for(let i=1;i<=n;i++){const t=i/n;if(!spFree(lerp(ax,bx,t),lerp(az,bz,t)))break;ok=t}return ok}
function spiderDoor(i){if(HOST.spDone||S.t<HOST.spAt||S.ot||S.t>SHIFT_END-150||S.mons.some(m=>m.ty===15))return false;
  const tr=S.trucks[i];HOST.spDone=true;S.spLast=S.night;tr.door=1;tr.stuck=16;emit({e:'stuck',b:i});
  S.mons.push({id:monSeq++,ty:15,bay:i,x:BAYS[i].x,z:WH.z0-8,y:SP_LOW,ry:0,st:'enter',a:4,t:0,life:0,cd:0,hearT:0});return true}
function spGo(m,tx,tz,sp,dt){const dx=tx-m.x,dz=tz-m.z,d=Math.hypot(dx,dz);if(d<.05)return 0;const s=Math.min(d,sp*dt);m.x+=dx/d*s;m.z+=dz/d*s;m.ry=angLerp(m.ry,Math.atan2(dx,dz),dt*2.5);return d-s}
function spWanderTarget(m){for(let k=0;k<30;k++){const x=rand(WH.x0+4,WH.x1-4),z=rand(WH.z0+4,WH.z1-4);if(!spFree(x,z)||Math.hypot(x-m.x,z-m.z)<6)continue;if(spReach(m.x,m.z,x,z)<.98)continue;m.tx=x;m.tz=z;return true}return false}
// how far off it hears a sound: anything louder than walking from a long way, the reverse beeper and the air horn from across the floor
const spHearR=n=>n.k==='loud'?200:n.k==='beep'?60:n.r*2.6+6;
// head for the last sound it heard: straight there if nothing but racks is in the way, else via a free spot that gets it nearer
function spAim(m){const f=spReach(m.x,m.z,m.nx,m.nz);if(f>.97){m.tx=m.nx;m.tz=m.nz;return true}
  let best=null,bd=Math.hypot(m.nx-m.x,m.nz-m.z)-1;for(let k=0;k<40;k++){const a=rand(0,6.283),r=rand(2,10),x=m.x+Math.cos(a)*r,z=m.z+Math.sin(a)*r;
    if(!spFree(x,z)||spReach(m.x,m.z,x,z)<.98)continue;const d=Math.hypot(m.nx-x,m.nz-z);if(d<bd){bd=d;best={x,z}}}
  if(best){m.tx=best.x;m.tz=best.z;return true}if(f>.05){m.tx=lerp(m.x,m.nx,f);m.tz=lerp(m.z,m.nz,f);return true}
  // (boxed in where it stands, which only happens if it got pushed somewhere odd: just walk straight for it)
  if(!spFree(m.x,m.z)){m.tx=m.nx;m.tz=m.nz;return true}m.tx=m.x;m.tz=m.z;return false}
function spiderUpdate(m,dt){m.t+=dt;m.life+=dt;m.cd-=dt;m.hearT-=dt;const bx=BAYS[m.bay]?BAYS[m.bay].x:0,tr=S.trucks[m.bay];
  const rise=(h,k)=>{m.y=damp(m.y,h,k,dt)};
  if(m.st==='enter'){m.a=4;rise(SP_LOW,3);if(tr&&tr.st===0)tr.stuck=Math.max(tr.stuck,2);
    if(spGo(m,bx,WH.z0+4,1.4,dt)<.1){m.st='rise';m.t=0}return}
  if(m.st==='rise'){m.a=0;rise(SP_H,1.6);if(m.y>SP_H-.1){m.y=SP_H;m.st='wander';m.t=0;m.tx=undefined}return}
  if(m.st==='inside'){m.a=0;m.y=SP_LOW;m.x=bx;if(tr)m.z=tr.z+m.lz;return}
  if(m.st==='board'){m.a=4;rise(SP_LOW,3);if(m.y>SP_LOW+.3){return}
    if(spGo(m,bx,TZ_DOCK-7,1.5,dt)<.1){m.st='inside';m.lz=m.z-tr.z}return}
  if(m.st==='leave'){m.a=1;rise(SP_H,2);
    // hold on to a truck that's pulling out; until one is, keep wandering slowly
    if(!(tr&&tr.st===2&&m.go)){m.go=false;const i=S.trucks.findIndex((t,k)=>t.st===2&&t.leaving&&bayOn(k));if(i>=0){m.bay=i;m.go=true}}
    if(m.go){if(spGo(m,BAYS[m.bay].x,WH.z0+4,1.8,dt)<.15){m.st='board';m.t=0}return}}
  else if(m.life>=SP_LIFE&&m.st!=='stomp'){m.st='leave';m.go=false;return}
  // hearing: anything louder than walking, a long way off
  if(m.st!=='stomp'&&m.st!=='leave'){for(const n of HOST.noise||[]){if(n.k==='sp'||Math.hypot(n.x-m.x,n.z-m.z)>spHearR(n))continue;
      if(m.st!=='hunt'||Math.hypot(n.x-m.nx,n.z-m.nz)>1){if(m.hearT<=0){m.hearT=6;emit({e:'spHear',x:r2(m.x),z:r2(m.z)})}if(m.st!=='hunt')m.t=0;m.st='hunt';m.nx=n.x;m.nz=n.z;spAim(m)}}}
  if(m.st==='stomp'){m.a=3;rise(SP_H-.5,4);
    // two stamps: the legs come down at .55 s and again at 1.25 s
    for(const at of[.55,1.25])if(m.t>=at&&(m.hit||0)<at){m.hit=at;emit({e:'spStomp',x:r2(m.x),z:r2(m.z)});noise(m.x,m.z,8,'sp');
      for(const p of alivePlayers()){if(!inWH(p)||onRoof(p))continue;const d=Math.hypot(p.x-m.x,p.z-m.z);if(d<3.4)damage(p,d<1.4?30:20)}}
    if(m.t>1.9){m.st='listen';m.t=0;m.hit=0}return}
  if(m.st==='listen'){m.a=0;rise(SP_H,2);if(m.t>2.6){m.st='wander';m.t=0;m.tx=undefined}return}
  rise(SP_H,2);
  if(m.st==='wander'){m.a=1;if(m.tx===undefined&&!spWanderTarget(m)){m.a=0;return}
    if(spGo(m,m.tx,m.tz,1.25,dt)<.2){m.st='listen';m.t=0;m.tx=undefined}else if(!spFree(m.x,m.z,.6))m.tx=undefined;return}
  if(m.st==='hunt'){m.a=2;const left=spGo(m,m.tx,m.tz,3.6,dt);
    // stopped short by a wall: once it gets there, take the way round toward the sound
    if(left<.4&&Math.hypot(m.nx-m.x,m.nz-m.z)>2.5&&m.t<14&&spAim(m))return;
    if(left<.4||m.t>14){m.st='stomp';m.t=0;m.hit=0}}}

// ---------------------------------------------------------------- the auditor (ty 16), night 11 and on
// A very tall, thin figure in a grey day-shift coat, with a flat slab for a face split by one red scanning line. It walks
// the aisles pulling boxes back off the shelves to "check" them: each one it pulls drops on the floor and comes off
// the quota until someone shelves it again (no pay for shelving the same box twice). Its scan line reaches 9 m; stand
// in it for more than a second and it marks you (34 damage, more on later nights). Racks block the line. A strobe sends it away, and it
// leaves on its own after four boxes or about two minutes.
const AUD_RANGE=9,AUD_COS=Math.cos(.36);
function spawnAuditor(){if(S.mons.some(m=>m.ty===16))return;let best=null,bd=-1;
  for(let k=0;k<60;k++){const i=randi(0,GRID.nx-1),j=randi(4,GRID.nz-1);if(GRID.blk[j*GRID.nx+i])continue;const x=GRID.x0+i+.5,z=GRID.z0+j+.5;if(Math.abs(x)>28||Math.abs(z)>18)continue;
    const p=nearestPlayer(x,z,1e9,inWH),d=p?Math.hypot(p.x-x,p.z-z):30;if(d>bd){bd=d;best={x,z}}}
  if(!best)return;S.audLast=S.night;S.mons.push({id:monSeq++,ty:16,x:best.x,z:best.z,y:0,ry:rand(-3,3),st:'pick',a:0,t:0,life:0,cd:2,pulled:0,exp:{},path:null,rep:0});
  emit({e:'audIn',x:best.x,z:best.z})}
function audPath(m,tx,tz){m.tx=tx;m.tz=tz;m.path=astar(m.x,m.z,tx,tz,()=>false);return !!m.path}
function audWalk(m,sp,dt){if(!m.path)return 1e9;while(m.path.length&&Math.hypot(m.path[0].x-m.x,m.path[0].z-m.z)<.35)m.path.shift();
  const px=m.path.length?m.path[0].x:m.tx,pz=m.path.length?m.path[0].z:m.tz,dx=px-m.x,dz=pz-m.z,d=Math.hypot(dx,dz);
  if(d>.02){const s=Math.min(d,sp*dt);m.x+=dx/d*s;m.z+=dz/d*s;m.ry=angLerp(m.ry,Math.atan2(dx,dz),dt*4)}return Math.hypot(m.tx-m.x,m.tz-m.z)}
function audUpdate(m,dt){m.t+=dt;m.life+=dt;m.cd-=dt;
  // the scan line
  const fx=Math.sin(m.ry),fz=Math.cos(m.ry);
  for(const p of alivePlayers()){const dx=p.x-m.x,dz=p.z-m.z,d=Math.hypot(dx,dz);
    const inBeam=m.st!=='leave'&&inWH(p)&&!onRoof(p)&&d<AUD_RANGE&&d>.2&&(dx*fx+dz*fz)/d>AUD_COS&&!segBlocked(m.x,m.z,p.x,p.z);
    m.exp[p.id]=inBeam?(m.exp[p.id]||0)+dt:Math.max(0,(m.exp[p.id]||0)-dt*.6);
    if(m.exp[p.id]>1.15&&m.cd<=0){m.exp[p.id]=0;m.cd=5;damage(p,34);emit({e:'audHit',p:p.id,x:r2(m.x),z:r2(m.z)})}}
  if(m.st!=='leave'&&(m.life>125||m.pulled>=4)){m.st='leave';m.path=null}
  if(m.st==='leave'){m.a=2;if(!m.path){let far=null,fd=-1;for(let k=0;k<30;k++){const i=randi(0,GRID.nx-1),j=randi(4,GRID.nz-1);if(GRID.blk[j*GRID.nx+i])continue;const x=GRID.x0+i+.5,z=GRID.z0+j+.5;
        const p=nearestPlayer(x,z,1e9,inWH),d=p?Math.hypot(p.x-x,p.z-z):30;if(d>fd){fd=d;far={x,z}}}if(!far||!audPath(m,far.x,far.z)){m.dead=true;emit({e:'fade',id:m.id});return}}
    if(audWalk(m,2.2,dt)<.5||m.t>40){m.dead=true;emit({e:'fade',id:m.id})}return}
  if(m.st==='pick'){m.a=1;if(m.t<1.6)return;
    // a shelved box on an ordinary rack, from the nearest handful
    const cand=S.boxes.filter(b=>b.st===2&&b.s>=0&&SLOTS[b.s]&&!SLOTS[b.s].cold&&!SLOTS[b.s].add&&SLOTS[b.s].box2!==undefined&&(SLOTS[b.s].box2<0||SLOTS[b.s].box2===b.id)&&b.y<2.8)
      .map(b=>({b,d:Math.hypot(b.x-m.x,b.z-m.z)})).sort((a,c)=>a.d-c.d).slice(0,5);
    if(!cand.length){m.st='wander';m.t=0;m.path=null;return}
    const b=pick(cand).b,s=SLOTS[b.s],side=m.z>s.z?1:-1;let sz=s.z+side*1.45;if(insideAny(s.x,sz,.2))sz=s.z-side*1.45;
    if(!audPath(m,s.x,sz)){m.t=0;return}m.box=b.id;m.st='walk';m.t=0;return}
  if(m.st==='wander'){m.a=2;if(!m.path){const i=randi(0,GRID.nx-1),j=randi(4,GRID.nz-1);if(!GRID.blk[j*GRID.nx+i])audPath(m,GRID.x0+i+.5,GRID.z0+j+.5)}
    if(audWalk(m,1.2,dt)<.5||m.t>15){m.st='pick';m.t=0}return}
  if(m.st==='walk'){m.a=2;const b=S.boxes.find(x=>x.id===m.box);if(!b||b.st!==2){m.st='pick';m.t=0;return}
    m.rep-=dt;if(m.rep<=0){m.rep=1.5;audPath(m,m.tx,m.tz)}
    if(audWalk(m,1.25,dt)<.6||m.t>30){m.st='scan';m.t=0}return}
  if(m.st==='scan'){m.a=1;const b=S.boxes.find(x=>x.id===m.box);if(!b||b.st!==2){m.st='pick';m.t=0;return}
    m.ry=angLerp(m.ry,Math.atan2(b.x-m.x,b.z-m.z),dt*4);if(m.t<3.2)return;
    // it pulls the box and drops it at its feet
    const s=SLOTS[b.s];if(s){if(s.box2===b.id)s.box2=-1;else if(s.box===b.id){s.box=s.box2>=0?s.box2:-1;s.box2=-1}}
    let x=m.x+Math.sin(m.ry)*.5,z=m.z+Math.cos(m.ry)*.5;if(insideAny(x,z,.15)){x=m.x;z=m.z}
    Object.assign(b,{st:3,s:-1,x,z,y:0,ry:rand(-.6,.6),np:true});S.shelved=Math.max(0,S.shelved-1);S.bver++;markSlots();m.pulled++;
    emit({e:'audPull',x:r2(x),z:r2(z)});m.st='look';m.t=0;
    // then it turns round and looks down the aisle for a while
    m.lookRy=m.ry+Math.PI+rand(-.6,.6);return}
  if(m.st==='look'){m.a=1;m.ry=angLerp(m.ry,m.lookRy,dt*2);if(m.t>3.5){m.st='pick';m.t=0}}}
MON_UPD[15]=spiderUpdate;MON_UPD[16]=audUpdate;

// ---------------------------------------------------------------- the freight elevator is a safe room
// Nothing from outside gets into either car or hurts anyone standing in one (damage and jumpscares are
// dropped, see damage() and emit()). Monsters that wander up to a car are pushed back out through its gate,
// which is on the east side of both. The elevator's own stall, and the cold, still reach you in there.
const ELEV_PAD=.55;
const elevSafe=p=>!!p&&!p.dead&&owned('base')&&(inCar(p,CAR_UP)||inCar(p,CAR_DN));
function elevGuard(){if(!owned('base'))return;
  for(const m of S.mons)for(const C of [CAR_UP,CAR_DN])
    if(m.x>C.x0-ELEV_PAD&&m.x<C.x1+ELEV_PAD&&m.z>C.z0-ELEV_PAD&&m.z<C.z1+ELEV_PAD){m.x=C.x1+ELEV_PAD;if(m.path)m.path=null}}

// ---------------------------------------------------------------- the dev console (host side)
// Only a player named "Flingus Dingus" can use it. The host checks the name on every command, so it works the same
// for the host and for a crewmate who joined.
const DEV_NAME='flingus dingus',isDevName=n=>String(n||'').toLowerCase().replace(/\s+/g,' ').trim()===DEV_NAME;
const DEV_MONS=[[0,'Mimic'],[1,'Sleeper'],[3,'Crawler'],[2,'Stalker'],[4,'Night manager'],[5,'Shrink-wrap'],[13,'Blind one'],[7,'Driver'],[12,'Moth'],[15,'Long-legged thing'],[16,'Auditor']];
// a free floor spot a few metres in front of you (or as near as there is one)
function devSpot(p){const fx=-Math.sin(p.yaw),fz=-Math.cos(p.yaw),ok=(x,z)=>{if(x<WH.x0+1||x>WH.x1-1||z<WH.z0+1||z>WH.z1-1)return false;const [i,j]=cellOf(x,z);return !GRID.blk[j*GRID.nx+i]};
  for(const d of[5,4,6,3,7,8,2.5])for(const s of[0,.5,-.5,1,-1]){const x=p.x+(fx*Math.cos(s)-fz*Math.sin(s))*d,z=p.z+(fz*Math.cos(s)+fx*Math.sin(s))*d;if(ok(x,z))return{x,z}}
  for(let k=0;k<200;k++){const x=rand(WH.x0+2,WH.x1-2),z=rand(WH.z0+2,WH.z1-2);if(ok(x,z))return{x,z}}return{x:0,z:0}}
// sleepers and crawlers live in trailers, so ask for a truck with one in it
function devTruck(kind,p){const i=S.trucks.findIndex((t,k)=>bayOn(k)&&t.st===0&&!(t.stuck>0));HOST.devNext=kind;
  if(i<0)return toP(p,'Every bay is busy. The next truck in will bring it.');spawnTruck(i);toP(p,`A truck is backing into Bay ${BAYS[i].name} with one inside.`)}
function devAct(p,a){if(!p||!isDevName(p.name)||!S||S.over)return;
  if(a.k==='skip'){if(S.phase!=='play')return toP(p,'There is no night running to skip.');S.shelved=Math.max(S.shelved,S.quota);endNight();return}
  if(a.k==='cash'){const n=Math.round(clamp(+a.n||0,0,1e6));if(!n)return;const solo=Object.keys(S.players).length<2;S.cash=(S.cash||0)+n;if(!solo)p.cash=(p.cash||0)+n;
    return toP(p,solo?`+$${n}.`:`+$${n} to you and +$${n} to the team fund.`)}
  if(a.k!=='mon')return;if(S.phase!=='play')return toP(p,'Monsters can only be spawned during a night.');
  const ty=+a.ty,sp=devSpot(p),name=(DEV_MONS.find(d=>d[0]===ty)||[0,'?'])[1],has=t=>S.mons.some(m=>m.ty===t&&!m.dead),here=n=>toP(p,`The ${n} is already here.`);
  switch(ty){
  case 0:S.boxes.push({id:boxSeq++,st:3,x:sp.x,y:0,z:sp.z,ry:rand(-.4,.4),k:randi(0,2),f:false,v:randi(0,3),h:'',s:-1,m:true,tw:rand(1,3)});S.bver++;break;
  case 1:return devTruck('lurk',p);
  case 3:return devTruck('crawl',p);
  case 2:spawnStalkerAt(sp.x,sp.z);break;
  case 4:if(has(4))return here('night manager');HOST.mgr=true;S.mons.push({id:monSeq++,ty:4,x:MGR_SPOT.x,z:MGR_SPOT.z,y:0,ry:Math.PI,st:'walk',a:2,t:0,path:null,rep:0});break;
  case 5:if(has(5))return here('shrink-wrap');S.mons.push({id:monSeq++,ty:5,x:SHRINK_HOME.x,z:SHRINK_HOME.z,y:0,ry:-2.4,st:'home',a:0,heard:-99,cd:0,path:null,rep:0});break;
  case 13:if(has(13))return here('blind one');S.mons.push({id:monSeq++,ty:13,x:sp.x,z:sp.z,y:0,ry:rand(-3,3),st:'look',a:0,t:0,lookT:3,cd:3,path:null,rep:0,hearT:0});break;
  case 7:{if(has(7))return here('driver');const i=S.trucks.findIndex((t,k)=>bayOn(k)&&t.st===2),b=Math.max(0,i);
    S.mons.push({id:monSeq++,ty:7,bay:b,x:i>=0?BAYS[b].x+2.4:sp.x,z:i>=0?WH.z0+1.2:sp.z,y:0,ry:0,st:'wander',a:2,life:75,stun:0,path:null,rep:0,k:randi(0,9)});break}
  case 12:{const n0=S.mons.filter(m=>m.ty===12).length;spawnMoth();if(S.mons.filter(m=>m.ty===12).length===n0)return toP(p,'Moths need a working light, and only two come at once.');break}
  case 15:{if(has(15))return here('long-legged thing');let i=S.trucks.findIndex((t,k)=>bayOn(k)&&t.st===0);if(i<0)i=Math.max(0,S.trucks.findIndex((t,k)=>bayOn(k)));
    const tr=S.trucks[i];if(tr.st===0){tr.door=1;tr.stuck=16;emit({e:'stuck',b:i})}
    S.mons.push({id:monSeq++,ty:15,bay:i,x:BAYS[i].x,z:WH.z0-8,y:SP_LOW,ry:0,st:'enter',a:4,t:0,life:0,cd:0,hearT:0});break}
  case 16:{if(has(16))return here('auditor');S.mons.push({id:monSeq++,ty:16,x:sp.x,z:sp.z,y:0,ry:rand(-3,3),st:'pick',a:0,t:0,life:0,cd:2,pulled:0,exp:{},path:null,rep:0});break}
  default:return}
  toP(p,`Spawned: ${name}.`)}
