// ===================================================================== simulation
// Runs on the host (or solo). Clients hold a mirror of S built from snapshots.
let S=null;
const HOST={nextTruck:0,nextStalker:0,trucksTonight:0,lampT:[],lampNext:[]};
let boxSeq=1,monSeq=1;
const EVQ=[],NETEV=[];
function emit(e){EVQ.push(e);if(NET.host)NETEV.push(e)}
const LURK_HOME=-TRAIL_LEN+1.15, CRAWL_HOME=-TRAIL_LEN+1.3; // both behind the blanket pile at the nose

function newState(){return{night:1,t:0,phase:'play',inter:0,quota:15,shelved:0,lost:0,score:0,total:0,aidLeft:2,lamps:LAMPS.map(()=>1),
  players:{},boxes:[],trucks:BAYS.map(()=>({st:0,z:TZ_FAR,door:0,t:0,warn:false,claw:false,n:0,left:0,reject:false})),mons:[],over:null,bver:0}}
function addPlayer(id,name,col){S.players[id]={id,name,col,x:0,z:-16,yaw:0,pitch:0,light:true,hp:100,dead:false,carry:-1,lastHurt:-99}}
function spawnPoint(i){return{x:-2.4+(i%4)*1.6,z:-15.5}}
function calcQuota(){const n=Math.max(1,Object.keys(S.players).length);return Math.round((10+S.night*5)*(1+.45*(n-1)))}

function startNight(){
  S.t=0;S.phase='play';S.shelved=0;S.lost=0;S.aidLeft=2;S.boxes=[];S.mons=[];S.bver++;
  for(const s of SLOTS)s.box=-1;
  S.trucks.forEach(tr=>Object.assign(tr,{st:0,z:TZ_FAR,door:0,t:0,warn:false,claw:false,n:0,left:0,reject:false,lurk:false,emptyT:undefined,honk:0}));
  S.lamps=LAMPS.map(()=>1);HOST.lampT=LAMPS.map(()=>0);HOST.lampNext=LAMPS.map((L,i)=>rand(20,45)*(i===0?1.8:i===3?.6:1));
  HOST.nextTruck=6;HOST.nextStalker=rand(42,55)-Math.min(20,(S.night-1)*6);HOST.trucksTonight=0;HOST.lastTruck=false;S.ot=false;
  S.quota=calcQuota();
  const pos={};Object.values(S.players).forEach((p,i)=>{const sp=spawnPoint(i);Object.assign(p,{x:sp.x,z:sp.z,yaw:0,pitch:0,hp:100,dead:false,carry:-1,lastHurt:-99});pos[p.id]=[sp.x,sp.z]});
  emit({e:'night',n:S.night,q:S.quota,pos});
}
function endNight(){
  if(S.shelved>=S.quota){S.total+=S.shelved;S.phase='inter';S.inter=9;
    S.trucks.forEach(tr=>Object.assign(tr,{st:0,z:TZ_FAR,door:0}));S.mons=[];S.boxes=S.boxes.filter(b=>b.st===2);S.bver++;
    for(const p of Object.values(S.players))p.carry=-1;
    emit({e:'nightDone',n:S.night,sh:S.shelved,q:S.quota,lo:S.lost,ot:!!S.ot});S.ot=false}
  else gameOver('quota')}
function gameOver(why){if(S.over)return;S.over={why,night:S.night,total:S.total+S.shelved,score:S.score,shelved:S.shelved,quota:S.quota,ot:!!S.ot};emit({e:'over'})}
// how far behind the steady pace that meets quota exactly at 6:00 AM
function behindPace(){return Math.ceil(S.quota*Math.min(1,S.t/SHIFT_END)-S.shelved)}
// the supervisor radios at 3, 4 and 5 AM, but only when the crew is falling behind
function paceCheck(h){const b=behindPace();
  if(b>=2){const bad=b>=Math.max(4,S.quota*.3);
    emit({e:'radio',m:bad?`You're ${b} boxes behind. Miss ${S.quota} by six and don't bother coming back tomorrow.`:pick([`You're ${b} boxes behind pace. Pick it up.`,`${b} boxes behind where you should be. Move it.`])})}
  if(h===5)emit({e:'finalHour',need:Math.max(0,S.quota-S.shelved)})}
// 6 AM and short: one minute of overtime with the lights out and everything hungrier
function startOvertime(){S.ot=true;S.lamps=LAMPS.map(()=>0);HOST.nextStalker=Math.min(HOST.nextStalker,4);
  const has=S.trucks.some((tr,i)=>(tr.st===1||tr.st===2)&&S.boxes.some(b=>b.st===0&&b.bay===i&&!b.m));let bay=-1;
  if(!has){const free=S.trucks.map((t,i)=>t.st===0?i:-1).filter(i=>i>=0);if(free.length){bay=pick(free);spawnTruck(bay,true)}}
  emit({e:'overtime',need:S.quota-S.shelved,b:bay})}

function boxWorld(b){if(b.st===0){return{x:BAYS[b.bay].x+b.x,y:b.y,z:S.trucks[b.bay].z+b.z}}
  if(b.st===1){const p=S.players[b.h];if(p)return{x:p.x,y:1.1,z:p.z}}return{x:b.x,y:b.y,z:b.z}}
function trailerAt(x,z,m=.2){for(let i=0;i<BAYS.length;i++){const tr=S.trucks[i];if(tr.st!==2)continue;if(Math.abs(x-BAYS[i].x)<TRAIL_HW-m&&z<TZ_DOCK-.05&&z>TZ_DOCK-TRAIL_LEN+m)return i}return -1}
function inTrailer(p){for(let i=0;i<BAYS.length;i++){const tr=S.trucks[i];if(tr.st!==2&&tr.st!==3)continue;if(Math.abs(p.x-BAYS[i].x)<TRAIL_HW+.15&&p.z<TZ_DOCK-.05)return i}return -1}
function lampZone(x,z,pad=0){for(let i=0;i<LAMPS.length;i++){if(!S.lamps[i])continue;const L=LAMPS[i];if(Math.hypot(x-L.x,z-L.z)<L.r+pad)return i}return -1}
function alivePlayers(){return Object.values(S.players).filter(p=>!p.dead)}
function nearestPlayer(x,z,maxD=1e9,filter){let best=null,bd=maxD;for(const p of alivePlayers()){if(filter&&!filter(p))continue;const d=Math.hypot(p.x-x,p.z-z);if(d<bd){bd=d;best=p}}return best}
function applyColliders(){if(!S)return;S.trucks.forEach((tr,i)=>{const v=BAYV[i];v.doorCol.on=tr.door<.75;const on=tr.st===2||(tr.st===3&&tr.door>0);for(const c of v.trailCol)c.on=on})}
// is (x,y,z) inside someone's flashlight beam with nothing solid in the way?
// (anything up near the ceiling is above the racks, so only floor-level targets can be hidden behind them)
function litByP(p,x,y,z){if(p.dead||!p.light)return false;const dx=x-p.x,dy=y-1.6,dz=z-p.z,d=Math.hypot(dx,dy,dz);if(d>17||d<.05)return false;
  const cp=Math.cos(p.pitch),fx=-Math.sin(p.yaw)*cp,fy=Math.sin(p.pitch),fz=-Math.cos(p.yaw)*cp;
  const ang=Math.acos(clamp((dx*fx+dy*fy+dz*fz)/d,-1,1));if(ang>.43+Math.atan(.5/d))return false;
  return !(y<4&&segBlocked(p.x,p.z,x,z))}
function litBy(x,y,z){for(const p of Object.values(S.players))if(litByP(p,x,y,z))return p;return null}
// is anyone looking toward (x,y,z), light or no light?
function watched(x,y,z){for(const p of alivePlayers()){const dx=x-p.x,dy=y-1.6,dz=z-p.z,d=Math.hypot(dx,dy,dz);if(d<.05)return true;
  const cp=Math.cos(p.pitch),fx=-Math.sin(p.yaw)*cp,fy=Math.sin(p.pitch),fz=-Math.cos(p.yaw)*cp;
  if((dx*fx+dy*fy+dz*fz)/d<.68)continue;if(segBlocked(p.x,p.z,x,z))continue;return true}return false}
// a flashlight clicked off and on again while pointed at (x,y,z)
function flashedBy(x,y,z){for(const p of alivePlayers())if(p.togs&&p.togs.length>=2&&litByP(p,x,y,z))return p;return null}
function damage(p,amt){if(!p||p.dead)return;p.hp-=amt;p.lastHurt=S.t;if(p.hp<=0){p.hp=0;p.dead=true;dropCarry(p);emit({e:'died',p:p.id})}}
function dropCarry(p){const b=S.boxes.find(x=>x.id===p.carry);if(b){const tb=trailerAt(p.x,p.z,.3);if(tb>=0){b.st=0;b.bay=tb;b.x=p.x-BAYS[tb].x;b.z=p.z-S.trucks[tb].z}else{b.st=3;b.x=p.x;b.z=p.z}b.y=0;b.h='';S.bver++}p.carry=-1}
function settleTruck(bay){const bs=S.boxes.filter(b=>b.st===0&&b.bay===bay).sort((a,b)=>a.y-b.y);
  for(const b of bs){let sup=0;for(const c of bs){if(c===b||c.y>=b.y-.01)continue;if(Math.abs(c.x-b.x)<.45&&Math.abs(c.z-b.z)<.45)sup=Math.max(sup,c.y+BOX_KINDS[c.k].h)}b.y=sup}}

function simUpdate(dt){
  if(!S||S.over)return;
  if(S.phase==='inter'){S.inter-=dt;if(S.inter<=0){S.night++;startNight()}return}
  const h0=Math.floor(S.t/HOUR);S.t+=dt;const h1=Math.floor(S.t/HOUR);if(h1!==h0&&h1<SHIFT_HOURS){emit({e:'hour',h:h1});if(h1>=3)paceCheck(h1)}
  if(!S.ot&&S.t>=SHIFT_END){if(S.shelved>=S.quota){endNight();return}startOvertime()}
  if(S.ot){if(S.shelved>=S.quota){endNight();return}if(S.t>=SHIFT_END+OVERTIME){gameOver('quota');return}}
  applyColliders();
  for(const p of Object.values(S.players)){if(p._l===undefined)p._l=p.light;if(p.light!==p._l){p._l=p.light;(p.togs||(p.togs=[])).push(S.t)}
    if(p.togs)while(p.togs.length&&S.t-p.togs[0]>1.6)p.togs.shift()}
  trucksUpdate(dt);boxesUpdate(dt);monstersUpdate(dt);lampsUpdate(dt);
  for(const p of Object.values(S.players))if(!p.dead&&p.hp<60&&S.t-p.lastHurt>12)p.hp=Math.min(60,p.hp+dt*2.5);
  const ps=Object.values(S.players);if(ps.length&&ps.every(p=>p.dead))gameOver('dead');
}

// ---------------------------------------------------------------- trucks
function spawnTruck(i,last=false){const tr=S.trucks[i];const first=S.night===1&&HOST.trucksTonight===0;
  Object.assign(tr,{st:1,t:0,z:TZ_FAR,door:0,emptyT:undefined,reject:false,honk:0});
  const n=Math.min(16,randi(6,9)+Math.min(5,S.night-1));
  tr.lurk=!first&&Math.random()<Math.min(.55,.17+.09*(S.night-1));
  tr.crawl=!first&&!tr.lurk&&!S.mons.some(m=>m.ty===3)&&Math.random()<Math.min(.4,.14+.06*(S.night-1));
  tr.warn=tr.lurk||tr.crawl?Math.random()<.75:!first&&Math.random()<.1;tr.claw=tr.lurk&&Math.random()<.7;tr.n=n;tr.left=n;tr.kg=n*randi(18,30);tr.extra=randi(280,460);
  HOST.trucksTonight++;
  const mimP=first?0:Math.min(.24,.06+.035*(S.night-1));
  const spots=[];for(let r=5;r>=0;r--)for(const lx of[-.62,.62])spots.push({lx,lz:-2.0-r*1.55,h:0});
  let mimics=0;
  for(let k=0;k<n;k++){const sp=spots[k%spots.length];const K=randi(0,2),kind=BOX_KINDS[K];const m=Math.random()<mimP&&mimics<3;if(m)mimics++;
    S.boxes.push({id:boxSeq++,st:0,bay:i,x:sp.lx+rand(-.08,.08),y:sp.h,z:sp.lz+rand(-.12,.12),ry:rand(-.25,.25),k:K,f:Math.random()<.16,v:randi(0,3),h:'',s:-1,m,tw:rand(1,4)});sp.h+=kind.h}
  if(tr.lurk)S.mons.push({id:monSeq++,ty:1,bay:i,st:'sleep',lx:0,lz:LURK_HOME,x:BAYS[i].x,y:0,z:tr.z+LURK_HOME,ry:0,a:0,litT:0,cd:0,wake:0});
  if(tr.crawl)S.mons.push({id:monSeq++,ty:3,bay:i,st:'inside',x:BAYS[i].x,y:0,z:tr.z+CRAWL_HOME,ry:0,a:0,k:0,t:0,cd:0,side:Math.random()<.5?-1:1});
  S.bver++;emit({e:'truck',b:i,last})}
function truckGone(i){const tr=S.trucks[i];let n=0;for(const b of S.boxes)if(b.st===0&&b.bay===i){b.st=4;if(!b.m&&!tr.reject)n++}
  S.lost+=n;S.mons=S.mons.filter(m=>!((m.ty===1||m.ty===3)&&m.bay===i));S.bver++;
  if(n)emit({e:'msg',m:`Bay ${BAYS[i].name} left with ${n} box${n>1?'es':''} still on board.`});
  Object.assign(tr,{st:0,z:TZ_FAR,door:0,t:0,warn:false,claw:false,n:0,left:0,reject:false,lurk:false,emptyT:undefined,honk:0})}
function trucksUpdate(dt){
  HOST.nextTruck-=dt;
  if(HOST.nextTruck<=0){if(S.t<SHIFT_END-60){const free=S.trucks.map((t,i)=>t.st===0?i:-1).filter(i=>i>=0);
      if(free.length){spawnTruck(HOST.trucksTonight===0?0:pick(free));HOST.nextTruck=Math.max(24,rand(40,58)-S.night*3)}else HOST.nextTruck=5}else HOST.nextTruck=1e9}
  // the last truck of the night pulls in around 5:10 and is docked by about 5:25
  if(!HOST.lastTruck&&!S.ot&&S.t>=LAST_TRUCK_AT&&S.t<SHIFT_END-15){const free=S.trucks.map((t,i)=>t.st===0?i:-1).filter(i=>i>=0);
    if(free.length){HOST.lastTruck=true;spawnTruck(pick(free),true)}}
  S.trucks.forEach((tr,i)=>{
    if(tr.st===1){tr.t+=dt;const p=Math.min(1,tr.t/9.5);tr.z=lerp(TZ_FAR,TZ_DOCK,easeOut(p));if(p>=1){tr.st=2;tr.t=0;tr.z=TZ_DOCK;emit({e:'brake',b:i})}}
    else if(tr.st===2){tr.door=Math.min(1,tr.door+dt/2.6);tr.t+=dt;tr.left=S.boxes.filter(x=>x.st===0&&x.bay===i).length;
      if(tr.left===0&&tr.door>=1)tr.emptyT=(tr.emptyT===undefined?5:tr.emptyT)-dt;else tr.emptyT=undefined;
      if(tr.reject||(tr.emptyT!==undefined&&tr.emptyT<=0)||(tr.t>=DOCK_TIME&&!S.ot)){
        const inside=alivePlayers().some(p=>inTrailer(p)===i);const lur=S.mons.find(m=>m.ty===1&&m.bay===i),cr=S.mons.find(m=>m.ty===3&&m.bay===i);
        if(lur&&lur.st!=='sleep'&&!lurkTarget(lur))lur.st='return';
        if(cr&&cr.st!=='inside'&&cr.st!=='home')cr.ret=true; // the crawler goes home with its truck
        if(!inside&&(!lur||lur.st==='sleep')&&(!cr||cr.st==='inside'||cr.st==='home')){tr.st=3;tr.t=0;emit({e:'horn',b:i})}
        else{tr.honk=(tr.honk||0)-dt;if(tr.honk<=0){tr.honk=5;emit({e:'horn',b:i});if(inside)emit({e:'msg',m:`Bay ${BAYS[i].name}: the truck is pulling out. Get out of the trailer!`})}}}}
    else if(tr.st===3){tr.t+=dt;tr.door=Math.max(0,tr.door-dt/2.2);if(tr.door<=0){const p=clamp((tr.t-2.4)/8,0,1);tr.z=lerp(TZ_DOCK,TZ_FAR,easeIn(p));if(p>=1)truckGone(i)}}
  })}

// ---------------------------------------------------------------- boxes
// Mimics keep still until someone is close. One that has been found out roams: it hides on a shelf or the
// floor as a box again, scrambles somewhere new when you get near, bites if you grab it, and leaves for good
// if you click your flashlight off and on at it.
function boxesUpdate(dt){let pr=false;
  for(const b of S.boxes){if(b.st===4){pr=true;continue}if(!b.m||(b.st!==0&&b.st!==3))continue;const w=boxWorld(b);
    const np=nearestPlayer(w.x,w.z,9),d=np?Math.hypot(np.x-w.x,np.z-w.z):99;
    if(b.roam){const fp=flashedBy(w.x,w.y+.3,w.z);if(fp){unboxMimic(b,'bolt',fp.id);continue}
      if(d<2.6){b.near+=dt;if(b.near>b.nearMax){unboxMimic(b,'run');continue}}else b.near=Math.max(0,b.near-dt)}
    if(d>3.5)continue;
    b.tw-=dt*(litBy(w.x,w.y+.3,w.z)?2.2:1)*(b.roam&&d<2.6?2.5:1);
    if(b.tw<=0){b.tw=rand(2.4,5.5);emit({e:'tw',id:b.id})}}
  if(pr){S.boxes=S.boxes.filter(b=>b.st!==4);S.bver++}}
function freeMimicBox(b){const w=boxWorld(b),bay=b.st===0?b.bay:-1;if(b.roam&&b.s>=0&&SLOTS[b.s]&&SLOTS[b.s].box===b.id)SLOTS[b.s].box=-1;b.st=4;S.bver++;if(bay>=0)settleTruck(bay);return{w,bay}}
function burstMimic(b,pid,attack){const {w,bay}=freeMimicBox(b);
  const pl=S.players[pid];
  S.mons.push({id:monSeq++,ty:0,x:w.x,y:w.y,z:w.z,ry:pl?Math.atan2(pl.x-w.x,pl.z-w.z):0,st:'lunge',t:0,k:b.k,v:b.v,f:b.f,a:0,bay});
  emit({e:'burst',x:w.x,y:w.y,z:w.z});
  if(attack){emit({e:'scare',p:pid,ty:0});damage(S.players[pid],28+4*(S.night-1))}}
// a roaming mimic gives itself up without a fight: off to a new hiding place, or gone for good
function unboxMimic(b,how,pid){const {w}=freeMimicBox(b);const m={id:monSeq++,ty:0,x:w.x,y:w.y,z:w.z,ry:rand(-3,3),st:'run',t:0,k:b.k,v:b.v,f:b.f,a:2,bay:-1};S.mons.push(m);
  emit({e:'skitter',x:w.x,y:w.y,z:w.z});
  if(how==='bolt'){boltMimic(m);emit({e:'msg',m:'It scuttles off into the dark. It won\'t be back.',p:pid})}else roamTo(m)}
const roamers=()=>S.mons.filter(m=>m.ty===0&&m.st!=='bolt').length+S.boxes.filter(b=>b.roam&&b.st===3).length;
function farCell(){let best=null,bd=-1;for(let k=0;k<16;k++){const i=randi(0,GRID.nx-1),j=randi(0,GRID.nz-1);if(GRID.blk[j*GRID.nx+i])continue;const x=GRID.x0+i+.5,z=GRID.z0+j+.5;const p=nearestPlayer(x,z);const d=p?Math.hypot(p.x-x,p.z-z):50;if(d>bd){bd=d;best={x,z}}}return best||{x:25,z:15}}
function boltMimic(m){m.st='bolt';m.t=0;m.path=null;const c=farCell();m.tx=c.x;m.tz=c.z}
// pick somewhere to hide: an empty shelf slot (approached from the aisle) or a dark patch of floor
function roamTo(m){if(roamers()>5){boltMimic(m);return}
  m.st='run';m.t=0;m.path=null;m.dest=null;const taken=new Set(S.mons.filter(o=>o.dest&&o.dest.s>=0).map(o=>o.dest.s));
  const farFromAll=(x,z,r)=>alivePlayers().every(p=>Math.hypot(p.x-x,p.z-z)>r);
  if(Math.random()<.65){const c=SLOTS.filter(s=>!s.old&&s.box<0&&!taken.has(s.id)&&farFromAll(s.x,s.z,6));
    for(let k=0;k<6&&c.length&&!m.dest;k++){const s=pick(c);for(const side of Math.random()<.5?[-1,1]:[1,-1]){const az=s.z+side*1.3,[i,j]=cellOf(s.x,az);if(!GRID.blk[j*GRID.nx+i]){m.dest={s:s.id,x:s.x,y:s.y,z:s.z,ax:s.x,az};break}}}}
  if(!m.dest)for(let k=0;k<30;k++){const i=randi(0,GRID.nx-1),j=randi(3,GRID.nz-1);if(GRID.blk[j*GRID.nx+i])continue;const x=GRID.x0+i+.5,z=GRID.z0+j+.5;
    if(lampZone(x,z,1)>=0||!farFromAll(x,z,7))continue;m.dest={s:-1,x,y:0,z,ax:x,az:z};break}
  if(!m.dest){boltMimic(m);return}m.tx=m.dest.ax;m.tz=m.dest.az}
function settleMimic(m){const d=m.dest,s=d.s>=0?SLOTS[d.s]:null;m.dead=true;
  const b={id:boxSeq++,st:3,x:d.x,y:0,z:d.z,ry:rand(-.2,.2),k:m.k,f:m.f,v:m.v,h:'',s:-1,m:true,roam:true,tw:rand(2,4),near:0,nearMax:rand(1.4,2.8)};b.x=d.ax;b.z=d.az;
  if(s&&!s.old&&s.box<0){b.y=s.y;b.x=s.x+rand(-.12,.12);b.z=s.z;b.s=s.id;s.box=b.id}
  S.boxes.push(b);S.bver++}

// ---------------------------------------------------------------- monsters
function monstersUpdate(dt){
  HOST.nextStalker-=dt;
  if(HOST.nextStalker<=0){const n=S.mons.filter(m=>m.ty===2).length,max=(S.night>=4?2:1)+(S.ot?1:0);
    if(n<max){HOST.nextStalker=spawnStalker()?(S.ot?rand(8,14):Math.max(16,rand(30,52)-S.night*4)):4}else HOST.nextStalker=6}
  for(const m of S.mons){if(m.ty===0)mimicUpdate(m,dt);else if(m.ty===1)lurkerUpdate(m,dt);else if(m.ty===3)crawlerUpdate(m,dt);else stalkerUpdate(m,dt)}
  S.mons=S.mons.filter(m=>!m.dead)}

function mimicUpdate(m,dt){m.t+=dt;
  if(m.st==='lunge'){m.a=1;m.y=Math.max(0,m.y-dt*4);if(m.t>.75)roamTo(m);return}
  if(m.st==='hop'){m.a=2;const k=Math.min(1,m.t/.42),d=m.dest;m.x=lerp(m.hx,d.x,k);m.z=lerp(m.hz,d.z,k);m.y=lerp(m.hy,d.y,k)+Math.sin(k*Math.PI)*.55;if(k>=1)settleMimic(m);return}
  m.y=Math.max(0,m.y-dt*4);m.a=2;
  if(m.st==='run'){const fp=flashedBy(m.x,m.y+.3,m.z);if(fp){boltMimic(m);emit({e:'msg',m:'It scuttles off into the dark. It won\'t be back.',p:fp.id})}}
  let tx=m.tx,tz=m.tz;
  if(m.z<WH.z0+.3){const bx=m.bay>=0?BAYS[m.bay].x:m.x;tx=bx;tz=WH.z0+1.5}
  else if(!m.path||m.rep<=0){m.path=astar(m.x,m.z,m.tx,m.tz);m.rep=1}
  m.rep=(m.rep||0)-dt;
  if(m.z>=WH.z0+.3&&m.path&&m.path.length){while(m.path.length&&Math.hypot(m.path[0].x-m.x,m.path[0].z-m.z)<.4)m.path.shift();if(m.path.length){tx=m.path[0].x;tz=m.path[0].z}}
  const dx=tx-m.x,dz=tz-m.z,d=Math.hypot(dx,dz),sp=m.st==='bolt'?7.5:6.2;if(d>.05){const s=Math.min(d,sp*dt);m.x+=dx/d*s;m.z+=dz/d*s;m.ry=Math.atan2(dx,dz)}
  const there=m.z>=WH.z0+.3&&Math.hypot(m.tx-m.x,m.tz-m.z)<.35;
  if(m.st==='bolt'){if(there||m.t>6){m.dead=true;emit({e:'fade',id:m.id})}return}
  // arrived (or stuck too long): jump up into the shelf slot, or just sit down where it is
  if(there||m.t>16){if(!there)m.dest={s:-1,x:m.x,y:0,z:m.z,ax:m.x,az:m.z};m.st='hop';m.t=0;m.hx=m.x;m.hy=m.y;m.hz=m.z}}

// ---- the sleeper, in the trailer. Asleep behind the blankets until someone reaches the back of the trailer,
// then it sits up without a sound. Light on it makes it growl; hold the light there and it comes for you.
// In the dark it only moves while nobody is looking at it.
function lurkTarget(m){const bx=BAYS[m.bay].x;return nearestPlayer(m.x,m.z,16,p=>inTrailer(p)===m.bay||(p.z>WH.z0-.5&&p.z<WH.z0+7&&Math.abs(p.x-bx)<5))}
function lurkerUpdate(m,dt){const tr=S.trucks[m.bay],bx=BAYS[m.bay].x;
  if(tr.st!==2){m.st='sleep';m.lx=0;m.lz=LURK_HOME;m.a=0;m.ry=0;m.litT=0}
  m.x=bx+m.lx;m.z=tr.z+m.lz;m.y=0;if(tr.st!==2)return;
  m.gT=(m.gT||0)-dt;
  const step=(tx,tz,sp)=>{const dx=tx-m.lx,dz=tz-m.lz,d=Math.hypot(dx,dz);if(d<.01)return 0;const s=Math.min(d,sp*dt);m.lx+=dx/d*s;m.lz+=dz/d*s;
    if(m.lz<-.25)m.lx=clamp(m.lx,-TRAIL_HW+.45,TRAIL_HW-.45);else m.lx=clamp(m.lx,-4,4);m.lz=clamp(m.lz,LURK_HOME,6.8);m.ry=angLerp(m.ry,Math.atan2(dx,dz),dt*5);return d};
  if(m.st==='sleep'){m.a=0;m.cd-=dt;if(m.cd>0||tr.door<1)return;
    const deep=alivePlayers().some(p=>inTrailer(p)===m.bay&&p.z<tr.z-8);
    if(deep){m.wake+=dt;if(m.wake>(S.ot?.3:.8)){m.st='sit';m.t=0;m.wake=0;m.litT=0}}else m.wake=Math.max(0,m.wake-dt);return}
  if(m.st==='return'){m.a=2;const d=step(0,LURK_HOME,2.4);m.litT=0;if(d<.1){m.st='sleep';m.cd=8;m.ry=0;m.lx=0;m.lz=LURK_HOME}return}
  const tgt=lurkTarget(m);if(!tgt){m.st='return';return}
  const tlx=tgt.x-bx,tlz=tgt.z-tr.z,d=Math.hypot(tlx-m.lx,tlz-m.lz);
  if(d<1.25){emit({e:'scare',p:tgt.id,ty:1,id:m.id});damage(tgt,999);m.st='return';return}
  if(m.st==='charge'){m.a=4;step(tlx,tlz,S.ot?7:6.2);return}
  if(m.st==='sit'){m.t+=dt;m.a=3;if(m.t>1.8)m.st='stalk';return}   // sitting up, slowly, silently
  const lit=litBy(m.x,1.6,m.z);
  if(lit){m.a=1;m.litT+=dt;m.ry=angLerp(m.ry,Math.atan2(tlx-m.lx,tlz-m.lz),dt*3);
    if(m.gT<=0){m.gT=3;emit({e:'growl',id:m.id})}
    if(m.litT>(S.ot?1.3:2)){m.st='charge';emit({e:'roar',id:m.id})}return}
  m.litT=Math.max(0,m.litT-dt*.35);
  if(watched(m.x,1.6,m.z)){m.a=3;return}
  m.a=2;step(tlx,tlz,Math.min(1.9,1.15+.12*(S.night-1))*(S.ot?1.3:1))}
function angLerp(a,b,t){return a+angDiff(a,b)*clamp(t,0,1)}

// ---- the crawler. Bolts out of its trailer when the door opens, climbs the wall beside the bay and works
// across the ceiling toward whoever is below. Light scatters it. Right above someone it holds still for a
// moment, then drops. When its truck is ready to go it crawls back inside.
const crawlSpot=m=>({x:BAYS[m.bay].x+m.side*(DOOR_HW+1.4),z:WH.z0});
function ceilMove(m,tx,tz,sp,dt){tx=clamp(tx,WH.x0+.7,WH.x1-.7);tz=clamp(tz,WH.z0+.8,WH.z1-.7);const dx=tx-m.x,dz=tz-m.z,d=Math.hypot(dx,dz);
  if(d>.03){const s=Math.min(d,sp*dt);m.x+=dx/d*s;m.z+=dz/d*s;m.ry=angLerp(m.ry,Math.atan2(dx,dz),dt*8)}return d}
function crawlFlee(m,from){m.st='flee';m.t=0;m.fT=rand(1.6,2.4);const a=from?Math.atan2(m.x-from.x,m.z-from.z)+rand(-.6,.6):rand(0,TAU);m.fx=m.x+Math.sin(a)*12;m.fz=m.z+Math.cos(a)*12}
function crawlerUpdate(m,dt){const tr=S.trucks[m.bay],bx=BAYS[m.bay].x;m.t+=dt;m.cd-=dt;
  if(m.st==='inside'||m.st==='home'){m.x=bx;m.z=tr.z+CRAWL_HOME;m.y=0;m.k=0;m.a=0;m.ry=0;
    if(m.st==='inside'&&tr.st===2&&tr.door>.45&&!tr.reject){m.st='out';m.wp=[{x:bx,z:WH.z0+1},crawlSpot(m)];m.wp[1].z+=.3;emit({e:'crawlOut',id:m.id,x:m.x,y:.6,z:m.z+6})}return}
  const walk=(sp,next)=>{const w=m.wp[0],dx=w.x-m.x,dz=w.z-m.z,d=Math.hypot(dx,dz);m.a=2;if(d>.05){const s=Math.min(d,sp*dt);m.x+=dx/d*s;m.z+=dz/d*s;m.ry=Math.atan2(dx,dz)}if(d<.08){m.wp.shift();if(!m.wp.length)next()}};
  if(m.st==='out'){walk(7.5,()=>{m.st='climb';m.k=1;m.z=WH.z0+.05;m.ry=Math.PI});return}
  if(m.st==='climb'){m.a=2;m.y=Math.min(CEIL_Y,m.y+dt*4.5);if(m.y>=CEIL_Y){m.st='hunt';m.k=2;m.z=WH.z0+.9}return}
  if(m.st==='back'){m.a=2;if(m.k===2){const c=crawlSpot(m);if(ceilMove(m,c.x,WH.z0+.9,5.5,dt)<.1){m.k=3;m.z=WH.z0+.05;m.ry=0}}
    else if(m.k===3){m.y=Math.max(0,m.y-dt*4.5);if(m.y<=0){m.k=0;m.z=WH.z0+.35;m.wp=[{x:bx,z:WH.z0+1},{x:bx,z:tr.z+CRAWL_HOME}]}}
    else walk(6,()=>{m.st='home';m.ret=false});return}
  if(m.st==='dive'){m.a=4;const k=Math.min(1,m.t/.32),p=S.players[m.tg];m.y=lerp(CEIL_Y,.85,easeIn(k));
    if(p)ceilMove(m,p.x,p.z,4,dt);
    if(k>=1){if(p&&!p.dead&&Math.hypot(p.x-m.x,p.z-m.z)<1.3){emit({e:'scare',p:p.id,ty:3,id:m.id});damage(p,42+5*(S.night-1))}m.st='rise';m.t=0}return}
  if(m.st==='rise'){m.a=2;m.y=lerp(.85,CEIL_Y,easeOut(Math.min(1,m.t/.7)));if(m.t>=.7){m.y=CEIL_Y;m.cd=7;if(m.ret)m.st='back';else crawlFlee(m,nearestPlayer(m.x,m.z))}return}
  if(m.ret){m.st='back';return}
  const lp=litBy(m.x,m.y-.45,m.z);
  if(lp&&m.st!=='flee'){crawlFlee(m,lp);return}
  if(m.st==='flee'){m.a=2;ceilMove(m,m.fx,m.fz,6.5,dt);if(m.t>m.fT){m.st='hunt';m.cd=Math.max(m.cd,1.5)}return}
  const tgt=nearestPlayer(m.x,m.z,1e9,p=>p.z>WH.z0+.3&&inTrailer(p)<0);
  if(m.st==='poise'){m.a=3;if(!tgt){m.st='hunt';return}ceilMove(m,tgt.x,tgt.z,.8,dt);if(m.t>.6){m.st='dive';m.t=0;m.tg=tgt.id}return}
  // hunt
  if(!tgt){m.a=2;if(!m.wx||Math.hypot(m.wx-m.x,m.wz-m.z)<.5){m.wx=rand(-24,24);m.wz=rand(-16,16)}ceilMove(m,m.wx,m.wz,1.5,dt);return}
  m.a=2;const d=ceilMove(m,tgt.x,tgt.z,(S.ot?3.8:3)+.1*(S.night-1),dt);
  if(d<.75&&m.cd<=0){m.st='poise';m.t=0}}

function spawnStalker(){const ps=alivePlayers().filter(p=>inTrailer(p)<0);if(!ps.length)return false;
  for(let k=0;k<70;k++){const i=randi(0,GRID.nx-1),j=randi(2,GRID.nz-1);if(GRID.blk[j*GRID.nx+i])continue;const x=GRID.x0+i+.5,z=GRID.z0+j+.5;
    if(lampZone(x,z,2)>=0)continue;let ok=true;
    for(const p of alivePlayers()){const d=Math.hypot(p.x-x,p.z-z);if(d<14||(d<26&&!segBlocked(p.x,p.z,x,z))){ok=false;break}}
    if(!ok)continue;const m={id:monSeq++,ty:2,x,y:0,z,ry:0,st:'creep',a:0,litT:0,life:rand(55,80),path:null,rep:0,lampT:0};S.mons.push(m);emit({e:'stalk',id:m.id});return true}
  return false}
function stalkerUpdate(m,dt){m.life-=dt;if(m.life<=0){m.dead=true;emit({e:'fade',id:m.id});return}
  if(litBy(m.x,1.75,m.z)){m.litT+=dt;m.a=1;if(m.litT>.33){m.dead=true;emit({e:'shriek',id:m.id,x:m.x,z:m.z});HOST.nextStalker=Math.max(HOST.nextStalker,rand(14,24)-S.night)}return}
  m.litT=Math.max(0,m.litT-dt*.5);
  const tgt=nearestPlayer(m.x,m.z,1e9,p=>inTrailer(p)<0&&p.z>WH.z0);if(!tgt){m.a=0;return}
  const D=Math.hypot(tgt.x-m.x,tgt.z-m.z);
  if(D<1.05){emit({e:'scare',p:tgt.id,ty:2,id:m.id});damage(tgt,Math.min(72,40+6*(S.night-1)));m.dead=true;HOST.nextStalker=Math.max(HOST.nextStalker,rand(18,30));return}
  // standing in a working lamp's light keeps it out... until it puts the lamp out
  const li=lampZone(tgt.x,tgt.z,0);
  if(li>=0&&Math.hypot(LAMPS[li].x-m.x,LAMPS[li].z-m.z)<LAMPS[li].r+2.5){m.lampT+=dt;m.a=0;if(m.lampT>3){m.lampT=0;lampOut(li,rand(6,9))}return}
  m.rep-=dt;if(m.rep<=0||!m.path){m.rep=.45;m.path=astar(m.x,m.z,tgt.x,tgt.z,(x,z)=>lampZone(x,z,0)>=0)}
  let tx=tgt.x,tz=tgt.z;
  if(!(D<2.5&&!segBlocked(m.x,m.z,tgt.x,tgt.z))&&m.path){while(m.path.length&&Math.hypot(m.path[0].x-m.x,m.path[0].z-m.z)<.45)m.path.shift();if(!m.path.length){m.a=0;return}tx=m.path[0].x;tz=m.path[0].z}
  const dx=tx-m.x,dz=tz-m.z,d=Math.hypot(dx,dz);if(d<.01)return;
  const sp=Math.min(3.3,1.6+.28*(S.night-1))*(S.ot?1.35:1);const nx=m.x+dx/d*sp*dt,nz=m.z+dz/d*sp*dt;
  if(lampZone(nx,nz,0)>=0){m.a=0;return}
  m.x=nx;m.z=nz;m.ry=Math.atan2(dx,dz);m.a=2}

// ---------------------------------------------------------------- lamps
function lampOut(i,dur){if(!S.lamps[i])return;S.lamps[i]=0;HOST.lampT[i]=dur;emit({e:'lamp',i})}
function lampsUpdate(dt){if(S.ot)return;for(let i=0;i<LAMPS.length;i++){
  if(!S.lamps[i]){HOST.lampT[i]-=dt;if(HOST.lampT[i]<=0){S.lamps[i]=1;emit({e:'lampOn',i})}continue}
  HOST.lampNext[i]-=dt;if(HOST.lampNext[i]<=0){HOST.lampNext[i]=rand(25,50)*(i===0?1.8:i===3?.6:1);lampOut(i,rand(1.5,4.5))}}}

// ---------------------------------------------------------------- player actions
function act(pid,a){const p=S&&S.players[pid];if(!p||p.dead||S.phase!=='play'||S.over||!a)return;
  const B=id=>S.boxes.find(b=>b.id===id&&b.st!==4);
  const near=(w,r)=>Math.hypot(p.x-w.x,p.z-w.z,1.5-w.y)<=r;
  switch(a.a){
  case 'pick':{const b=B(a.b);if(!b||(b.st!==0&&b.st!==3)||p.carry>=0)return;const w=boxWorld(b);if(!near(w,3.4))return;
    if(b.m){burstMimic(b,pid,true);return}
    const fromTruck=b.st===0,bay=b.bay;b.st=1;b.h=pid;p.carry=b.id;if(fromTruck)settleTruck(bay);S.bver++;emit({e:'pick',p:pid,x:w.x,y:w.y,z:w.z});break}
  case 'place':{const b=B(p.carry),s=SLOTS[a.s];if(!b||!s||s.old||s.box>=0)return;if(Math.hypot(p.x-s.x,p.z-s.z)>3.8)return;
    b.st=2;b.s=s.id;b.x=s.x+rand(-.15,.15);b.y=s.y;b.z=s.z+rand(-.08,.08);b.ry=rand(-.12,.12);b.h='';b.m=false;s.box=b.id;p.carry=-1;S.shelved++;S.score+=b.f?15:10;S.bver++;
    emit({e:'place',x:b.x,y:b.y,z:b.z});if(S.shelved===S.quota)emit({e:'quota'});break}
  case 'drop':{const b=B(p.carry);if(!b)return;let x=+a.x,z=+a.z;if(!isFinite(x)||!isFinite(z)||Math.hypot(x-p.x,z-p.z)>2.2||insideAny(x,z,.15)){x=p.x;z=p.z}
    const tb=trailerAt(x,z,.3);if(tb>=0){b.st=0;b.bay=tb;b.x=x-BAYS[tb].x;b.z=z-S.trucks[tb].z;b.y=0;settleTruck(tb)}else{b.st=3;b.x=x;b.z=z;b.y=0}
    b.ry=+a.ry||0;b.h='';p.carry=-1;S.bver++;emit({e:'place',x,y:0,z});break}
  case 'kick':{const b=B(a.b);if(!b||(b.st!==0&&b.st!==3))return;const w=boxWorld(b);if(!near(w,3.2))return;
    if(b.m){const first=!b.roam;burstMimic(b,pid,false);if(first){S.score+=5;emit({e:'msg',m:'Good instincts.',p:pid})}return}
    if(b.f){const bay=b.st===0?b.bay:-1;b.st=4;S.lost++;S.bver++;if(bay>=0)settleTruck(bay);emit({e:'smash',x:w.x,y:w.y,z:w.z});emit({e:'msg',m:'You broke something fragile.',p:pid});return}
    const fx=-Math.sin(p.yaw),fz=-Math.cos(p.yaw);let nx=w.x+fx*1.1,nz=w.z+fz*1.1;if(insideAny(nx,nz,.3)){nx=w.x+fx*.3;nz=w.z+fz*.3;if(insideAny(nx,nz,.3)){nx=w.x;nz=w.z}}
    const was=b.st===0?b.bay:-1;const tb=trailerAt(nx,nz,.3);
    if(tb>=0){b.st=0;b.bay=tb;b.x=nx-BAYS[tb].x;b.z=nz-S.trucks[tb].z;b.y=0}else if(nz<TZ_DOCK){/* stay put in the trailer */if(b.st===0){b.y=0}}else{b.st=3;b.x=nx;b.z=nz;b.y=0}
    if(was>=0)settleTruck(was);if(tb>=0&&tb!==was)settleTruck(tb);
    b.ry+=rand(-.7,.7);S.bver++;emit({e:'kick',x:w.x,y:w.y,z:w.z});break}
  case 'panel':{const tr=S.trucks[a.b];if(tr&&tr.st===2&&!tr.reject){tr.reject=true;emit({e:'msg',m:`Bay ${BAYS[a.b].name}: delivery refused. The truck is leaving.`})}break}
  case 'aid':{if(S.aidLeft>0&&p.hp<100){S.aidLeft--;p.hp=100;emit({e:'healed',p:pid})}else emit({e:'msg',m:S.aidLeft>0?'You are not hurt.':'The first-aid cabinet is empty.',p:pid});break}
  }}
