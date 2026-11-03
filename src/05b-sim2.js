// ===================================================================== simulation: shop, additions, later-night monsters, items
// Host only, like 05-sim. Every addition adds boxes to the quota and minutes to the shift (the shift starts
// earlier: 11:15 PM instead of midnight, and so on).
const ADDS={
  cold:{name:'Cold Storage',price:250,q:6,time:45,desc:'A freezer room in the north-east corner. Trucks bring frozen crates: shelve each in the freezer within a minute or it spoils.'},
  conv:{name:'Sorting Conveyor',price:300,q:8,time:45,desc:'Parcels ride a belt along the south wall. Set the lever to the colour at the end to sort them. Hit the red button if it jams.'},
  fork:{name:'Repaired Forklift',price:350,q:8,time:45,desc:'Some trucks bring pallets of eight boxes. Drive one onto a top shelf to shelve all eight at once. Or carry three loose boxes on the forks.'},
  base:{name:'Basement Returns',price:400,q:6,time:60,desc:'Ten damaged returns in a cage downstairs, reached by the freight elevator. They can\'t be shelved: each one fed to the shredder counts toward quota.'},
  gen:{name:'Generator Room',price:300,q:0,time:40,desc:'Backup power for outages (from night 3). Keep it fuelled with jerry cans from the rack by the roof ladder.'},
  bayc:{name:'Bay C',price:500,q:10,time:60,desc:'A third dock, for refrigerated trailers.'},
  heat:{name:'Warehouse Heater',price:250,q:0,time:0,desc:'A gas heater high on the east wall. The warehouse holds its warmth an extra night between cold spells.'},
  medkit:{name:'Medkit Upgrade',price:300,q:0,time:0,desc:'A bigger first-aid cabinet: the crew can buy a third first-aid refill each night.'},
  amrs:{name:'Autonomous Mobile Robot S',price:2000,q:0,time:0,desc:'A small robot with a pad on the dock near the bays. Put a box on the pad and it drives it to a free bottom or middle shelf and shelves it, one box at a time. Slow, and it stops for anyone in its way.'},
  amrl:{name:'Autonomous Mobile Robot L',price:5000,q:0,time:0,desc:'A big pallet robot with a pad on the dock. Set a pallet on the pad with the forklift and it carries it to a free top shelf and lifts it in, one pallet at a time. Trucks bring pallets a little more often.'}};
const SHOP={
  fl2:{name:'Better flashlight',price:150,once:true,desc:'Brighter, wider beam. The battery lasts twice as long.'},
  shake:{name:'Shake flashlight',price:100,once:true,key:'R',desc:'Hold R to shake your flashlight and charge it anywhere. Anything listening hears it.'},
  batt:{name:'Spare batteries',price:20,give:2,key:1,desc:'Two batteries. Swap one in for a full charge.'},
  flare:{name:'Flares',price:25,give:2,key:2,desc:'Two road flares. Each lights the floor for 35 s, and most things won\'t cross one.'},
  cutter:{name:'Box cutter',price:60,once:true,key:3,desc:'Cut open the box you\'re looking at. Kills a mimic; ruins a real box.'},
  strobe:{name:'Strobe',price:70,give:3,key:4,desc:'Three blinding flashes that drive off almost anything in front of you.'},
  scanner:{name:'Thermal scanner',price:120,once:true,key:5,desc:'Pick it on the hotbar and hold right click to see warm bodies through walls nearby.'},
  horn:{name:'Air horn',price:40,give:3,key:6,desc:'Three loud blasts. Things that hunt by sound go to it.'},
  drink:{name:'Energy drinks',price:15,give:2,key:7,desc:'Two cans. Twenty seconds of sprinting without getting tired.'},
  stam:{name:'Stamina upgrade',price:90,once:true,desc:'Sprint half again as long, and get your breath back faster.'},
  stam2:{name:'Stamina upgrade II',price:160,once:true,needs:'stam',desc:'Sprint twice as long as you could at the start, and get your breath back twice as fast.'},
  stam3:{name:'Stamina upgrade III',price:900,once:true,needs:'stam2',night:7,desc:'Sprint well over twice as long as you could at the start (2.6 times), and recover that much faster.'},
  stam4:{name:'Stamina upgrade IV',price:1800,once:true,needs:'stam3',night:10,desc:'Sprint more than three times as long as you could at the start, and recover that much faster.'},
  stock2:{name:'Better Stocking',price:500,once:true,desc:'Stack a second box on top of one already on a shelf, as long as the two fit under the shelf above.'},
  remote:{name:'Bay door remote',price:90,give:1,key:8,desc:'Shuts the nearest bay door from anywhere. Its truck leaves at once.'},
  bulb:{name:'Lamp bulb',price:50,give:1,key:9,desc:'Use it under a dead light fixture to fix it for the rest of the run.'},
  hand:{name:'Carry Upgrade',price:110,once:true,desc:'Carry up to three boxes at once. Slower, and noisier.'},
  red:{name:'Red headlamp',price:80,once:true,key:'H',desc:'A dim red light (H) that monsters don\'t notice.'},
  aid:{name:'First-aid refill',price:30,desc:'One more use of the first-aid cabinet next night (two at most, three with the Medkit Upgrade).'}};
const PA_SPOTS=[{n:'by the roof ladder',x:-22.4,z:12.2},{n:'at the west end of aisle two',x:-28.4,z:1.5},{n:'behind the east racks',x:28.6,z:2.5},
  {n:'by the barrels',x:26.4,z:16.4},{n:'between the middle racks',x:0,z:1.5},{n:'at the west end of aisle four',x:-28.4,z:11.5},{n:'by the dock columns',x:5.5,z:-11.2}];
let parSeq=1,palSeq=1,flSeq=1;
const pay=x=>{S.score+=x;S.cash=(S.cash||0)+x*1.25};
const nearPos=(p,x,z,r)=>Math.hypot(p.x-x,p.z-z)<=r;
const inCold=p=>p.x>COLD.x0&&p.x<COLD.x1&&p.z>COLD.z0&&p.z<COLD.z1;
const inCar=(p,C)=>p.x>C.x0&&p.x<C.x1&&p.z>C.z0&&p.z<C.z1;
const lightZone=(x,z,pad=0)=>lampZone(x,z,pad)>=0||(S.flares&&S.flares.some(f=>Math.hypot(f.x-x,f.z-z)<3+pad));
function noise(x,z,r){(HOST.noise||(HOST.noise=[])).push({x,z,r,t:S.t})}
function toP(p,m){if(!p)return;emit({e:'msg',m,p:p.id})}

// ---------------------------------------------------------------- night set-up
function addExtras(){let q=0,t=0;for(const k of S.adds){q+=ADDS[k].q;t+=ADDS[k].time}return{q,t}}
function nightSetup(){const ex=addExtras();S.extra=ex.t;S.t=-S.extra;
  S.aidLeft=2+(S.aidBonus||0);S.aidBonus=0;
  S.lamps=LAMPS.map((L,i)=>L.dead&&!S.fixed.includes(i)?0:1);
  S.parcels=[];S.pallets=[];S.flares=[];S.cold={door:0,open:false,t:0};S.conv={sel:S.conv?S.conv.sel:0,next:12,jam:false};
  S.elev={lvl:0,st:'idle',t:0,gate:1,stall:false,stallDone:false,hl:0,ht:0,pass:[],step:0};S.gen={fuel:100,out:false};S.yard=null;S.amr=['s','l'].filter(k=>owned('amr'+k)).map(k=>({k,x:AMR[k].x,z:AMR[k].z,ry:Math.PI,st:'home',load:-1,slot:-1,t:0,path:null,rep:0,stop:0}));for(const b of S.boxes)if(b.amr){b.amr=1;b.x=AMR.s.x;b.z=AMR.s.z;b.y=owned('amrs')?AMR.s.deck:0}S.rg=null;S.stash=true;HOST.rgT=0;S.chill=null;HOST.frzT=0;HOST.chillAt=coldNight(S.night)?(SHIFT_END-S.extra)/2:Infinity;S.paN=0;S.outage=false;
  HOST.outageAt=S.night>=3&&Math.random()<Math.min(.6,.22+.07*S.night)*diffEv()?rand(SHIFT_END*.12,SHIFT_END*.8):1e9;
  S.fork={x:FORK_HOME.x,z:FORK_HOME.z,ry:FORK_HOME.ry,lift:0,drv:'',pal:-1,pass:null};
  Object.assign(HOST,{nextPA:rand(70,120),nextMoth:rand(30,50),palDue:owned('fork')?(owned('amrl')?5:3):0,mgr:false,noise:[]});
  for(const p of Object.values(S.players))Object.assign(p,{can:false,stack:[],wu:0,idleT:0,wuCD:0,binT:0,spd:0,px:undefined,baseIdle:0,baseWarn:false,strug:0});
  if(owned('base'))S.mons.push({id:monSeq++,ty:14,x:HUNCH.x,z:HUNCH.z,y:0,ry:-2.4,st:'sit',a:0,t:0,cd:0,tg:''});
  // topped back up to ten: returns nobody dealt with last night are still lying there
  if(owned('base'))for(let i=S.boxes.filter(b=>b.ret).length;i<10;i++)S.boxes.push({id:boxSeq++,st:3,x:rand(79.6,83.5),y:0,z:rand(-5,4),ry:rand(-.4,.4),k:randi(0,1),f:false,v:randi(0,3),h:'',s:-1,m:false,ret:true});
  if(owned("cold"))for(const [x,z] of[[21.6,-13.6],[28.9,-13.3],[22.3,-18.4]]) // each hidden behind a stack of frozen stock
   S.mons.push({id:monSeq++,ty:6,x,z,y:0,hx:x,hz:z,ry:rand(-3,3),st:'still',a:0,cd:0});
  if(S.night>=4)S.mons.push({id:monSeq++,ty:5,x:SHRINK_HOME.x,z:SHRINK_HOME.z,y:0,ry:-2.4,st:'home',a:0,heard:-99,cd:0,path:null,rep:0});
  S.bver++}

// ---------------------------------------------------------------- the shop (between nights)
// what something costs right now: 12% more for every night survived, and the shared additions scale with the crew
function priceOf(k){const it=ADDS[k]||SHOP[k];if(!it)return 0;return Math.round(it.price*(1+.12*Math.max(0,(S?S.night:1)-1))*(ADDS[k]?crewMul():1)/5)*5}
const aidCap=()=>owned('medkit')?3:2;
function shopAct(pid,a){const p=S.players[pid];if(!p)return;
  // everyone votes on being done shopping; more than half the crew and the next night starts
  if(a.a==='start'){if(S.phase!=='shop')return;const v=S.votes||(S.votes=[]);if(v.includes(pid))S.votes=v.filter(x=>x!==pid);else v.push(pid);shopVoteCheck();return}
  if(a.a!=='buy'||S.phase!=='shop')return;const k=a.k;
  const no=m=>emit({e:'msg',m,p:pid});
  if(ADDS[k]){const it=ADDS[k];if(owned(k))return no('Already built.');const pr=priceOf(k);if(S.cash<pr)return no('Not enough money.');
    S.cash-=pr;S.adds.push(k);applyAdds();emit({e:'bought',k,p:pid,n:p.name});saveRun();return}
  const it=SHOP[k];if(!it)return;const pr=priceOf(k);if(S.cash<pr)return no('Not enough money.');
  if(it.once&&p.up[k])return no('You already have one.');
  if(it.needs&&!p.up[it.needs])return no(`Buy the ${SHOP[it.needs].name} first.`);
  if(it.night&&S.night+1<it.night)return no(`Not sold until night ${it.night}.`);
  if(k==='aid'&&(S.aidBonus||0)>=aidCap())return no('The cabinet is already stocked for tomorrow.');
  if(k==='bulb'){const held=Object.values(S.players).reduce((a,q)=>a+(q.inv.bulb||0),0);if(S.fixed.length+held>=MAX_BULBS)return no('There are no more fixtures worth fixing.')}
  S.cash-=pr;if(it.once)p.up[k]=true;else if(k==='aid')S.aidBonus=(S.aidBonus||0)+1;else p.inv[k]=(p.inv[k]||0)+it.give;
  emit({e:'bought',k,p:pid,n:p.name});saveRun()}

function shopVoteCheck(){const ids=Object.keys(S.players),v=(S.votes||[]).filter(id=>ids.includes(id));S.votes=v;
  if(S.phase==='shop'&&v.length*2>ids.length){S.night++;startNight()}}

// ---------------------------------------------------------------- every tick during a shift
function extrasUpdate(dt){
  if(HOST.noise)HOST.noise=HOST.noise.filter(n=>S.t-n.t<.6);
  for(const p of alivePlayers()){
    // speed from position changes (clients' positions arrive in steps, so smooth it)
    if(p.px!==undefined){const v=Math.hypot(p.x-p.px,p.z-p.pz)/Math.max(dt,1e-3);p.spd=damp(p.spd||0,Math.min(v,9),5,dt)}p.px=p.x;p.pz=p.z;
    p.nT=(p.nT||0)-dt;if(p.nT<=0){p.nT=.4;if(p.spd>4.3)noise(p.x,p.z,9);else if(p.spd>.8&&p.stack&&p.stack.length)noise(p.x,p.z,6)}
    p.wuCD=Math.max(0,(p.wuCD||0)-dt);p.tpT=Math.max(0,(p.tpT||0)-dt)}
  S.flares=S.flares.filter(f=>(f.t-=dt)>0);
  // a power outage, once it happens, lasts until morning
  if(!S.outage&&!S.ot&&S.t>=HOST.outageAt){S.outage=true;if(!genPowered())S.lamps=S.lamps.map(()=>0);emit({e:'outage',gen:genPowered()});spawnBlind()}
  coldUpdate(dt);convUpdate(dt);elevUpdate(dt);genUpdate(dt);forkUpdate(dt);paUpdate(dt);yardUpdate(dt);roofUpdate(dt);chillUpdate(dt);amrUpdate(dt);
  if(!HOST.mgr&&S.night>=3&&S.t>=-S.extra+50){HOST.mgr=true;S.mons.push({id:monSeq++,ty:4,x:MGR_SPOT.x,z:MGR_SPOT.z,y:0,ry:Math.PI,st:'walk',a:2,t:0,path:null,rep:0})}
  if(owned('gen')){HOST.nextMoth-=dt;if(HOST.nextMoth<=0){HOST.nextMoth=rand(40,70);spawnMoth()}}}

// ---------------------------------------------------------------- cold storage: door, thawing, frost figures
function coldUpdate(dt){if(!owned('cold'))return;const c=S.cold;
  // a box left in the doorway props it open
  const propped=S.boxes.some(b=>b.st===3&&b.x>COLD.dx0-.3&&b.x<COLD.dx1+.3&&Math.abs(b.z-COLD.z1)<.7);
  // a push bar on the inside: walk up to the shut door from inside and it opens
  if(!c.open&&alivePlayers().some(p=>inCold(p)&&Math.hypot(p.x-(COLD.dx0+COLD.dx1)/2,p.z-COLD.z1)<1.3)){c.open=true;c.t=4;emit({e:'coldDoor',o:1})}
  if(chilled()&&!c.open){c.open=true;c.t=2;emit({e:'coldDoor',o:1})}if(chilled())c.t=Math.max(c.t,1); // what's in there wants out
  if(c.open){c.t-=dt;if(c.t<=0&&!propped){c.open=false;emit({e:'coldDoor',o:0})}}
  c.door=clamp(c.door+(c.open?dt*2.2:-dt*3),0,1);
  for(const b of S.boxes){if(!b.fz||(b.st!==1&&b.st!==3)||chilled())continue;b.th-=dt; /* nothing thaws while the warehouse is cold */
    if(b.th<=0){const h=b.st===1?S.players[b.h]:null;if(h){if(h.carry===b.id)h.carry=h.stack.length?h.stack.pop():-1;else h.stack=h.stack.filter(x=>x!==b.id)}
      b.st=4;S.lost++;S.bver++;emit({e:'msg',m:'A frozen crate thawed and spoiled.'})}}}
// in and out of the freezer room by its door (the floor grid can't see a way through the shelving in there)
function frostGo(m,tx,tz,home,sp,dt){const dc=(COLD.dx0+COLD.dx1)/2,inM=inCold(m);
  if(home===inM)return inM?walkStraight(m,tx,tz,sp,dt):monWalk(m,tx,tz,sp,dt);
  if(inM){if(walkStraight(m,dc,COLD.z1-.7,sp,dt)<.3){m.z=COLD.z1+.9;m.path=null}return 99}
  if(monWalk(m,dc,COLD.z1+.9,sp,dt)<.4){m.z=COLD.z1-.7;m.x=dc}return 99}
function walkStraight(m,tx,tz,sp,dt){const dx=tx-m.x,dz=tz-m.z,d=Math.hypot(dx,dz);if(d>.02){const s=Math.min(d,sp*dt);m.x+=dx/d*s;m.z+=dz/d*s;m.ry=Math.atan2(dx,dz)}return Math.hypot(tx-m.x,tz-m.z)}
function frostUpdate(m,dt){m.cd-=dt;if(!isFinite(m.x)||!isFinite(m.z)){m.x=m.hx;m.z=m.hz;m.path=null}const shut=S.cold.door<.3;
  // while the warehouse is cold they can leave the freezer room and come after anyone in the building; when it warms
  // up again they run back to their corners
  if(chilled()){m.out=true;if(litBy(m.x,1.4,m.z)){m.a=1;return}
    const tgt=nearestPlayer(m.x,m.z,45,p=>inWH(p)&&inTrailer(p)<0);if(!tgt){m.a=0;return}
    if(Math.hypot(tgt.x-m.x,tgt.z-m.z)<.95&&m.cd<=0){emit({e:'scare',p:tgt.id,ty:6,id:m.id});damage(tgt,30);m.cd=7;return}
    m.a=2;frostGo(m,tgt.x,tgt.z,false,1.5,dt);return}
  if(m.out){m.a=2;if(frostGo(m,m.hx,m.hz,true,4.2,dt)<.3){m.out=false;m.st='still';m.path=null}return}
  if(m.st==='back'){m.a=2;const dx=m.hx-m.x,dz=m.hz-m.z,d=Math.hypot(dx,dz);if(d<.1||m.cd<=0&&!shut){m.st='still'}else{const s=Math.min(d,1.2*dt);m.x+=dx/d*s;m.z+=dz/d*s;m.ry=Math.atan2(dx,dz)}return}
  // they can only move while the door is shut, and never while light is on them
  if(!shut||litBy(m.x,1.4,m.z)){m.a=shut?1:0;return}
  const tgt=nearestPlayer(m.x,m.z,12,inCold);if(!tgt){m.a=0;return}
  const dx=tgt.x-m.x,dz=tgt.z-m.z,d=Math.hypot(dx,dz);
  // one grab and they all shrink back to their corners for a while
  if(d<.95&&m.cd<=0){emit({e:'scare',p:tgt.id,ty:6,id:m.id});damage(tgt,30);for(const o of S.mons)if(o.ty===6){o.st='back';o.cd=8}return}
  if(d<1e-3)return;
  const s=Math.min(d,1.5*dt);m.x=clamp(m.x+dx/d*s,COLD.x0+.4,COLD.x1-.4);m.z=clamp(m.z+dz/d*s,COLD.z0+1.3,COLD.z1-.4);m.ry=Math.atan2(dx,dz);m.a=2}

// follow the floor grid towards a spot (the same walking the night manager does)
function monWalk(m,tx,tz,sp,dt){m.rep=(m.rep||0)-dt;if(m.rep<=0||!m.path){m.rep=.6;m.path=astar(m.x,m.z,tx,tz)}let px=tx,pz=tz;
  if(m.path){while(m.path.length&&Math.hypot(m.path[0].x-m.x,m.path[0].z-m.z)<.4)m.path.shift();if(m.path.length){px=m.path[0].x;pz=m.path[0].z}}
  const dx=px-m.x,dz=pz-m.z,d=Math.hypot(dx,dz);if(d>.02){const s=Math.min(d,sp*dt);m.x+=dx/d*s;m.z+=dz/d*s;m.ry=angLerp(m.ry,Math.atan2(dx,dz),dt*6)}return Math.hypot(tx-m.x,tz-m.z)}
// ---------------------------------------------------------------- sorting conveyor
function convUpdate(dt){if(!owned('conv'))return;const c=S.conv;
  c.next-=dt;if(c.next<=0&&S.parcels.length<6&&!c.jam){c.next=rand(13,19);
    S.parcels.push({id:parSeq++,x:CONV.x0+.4,c:randi(0,2),m:S.night>=2&&Math.random()<.14*diffEv(),jam:Math.random()<.13*diffEv(),tw:rand(1,3)});emit({e:'parcel'})}
  const ps=S.parcels.sort((a,b)=>b.x-a.x);let front=CONV.x1-.25;
  for(const p of ps){if(!c.jam)p.x=Math.min(p.x+.75*dt,front);front=p.x-.55;
    const np=nearestPlayer(p.x,CONV.z,3.5,inWH);if(p.m&&np){p.tw-=dt;if(p.tw<=0){p.tw=rand(1.6,3.5);emit({e:'ptw',id:p.id})}}}
  const end=ps[0];if(end&&end.x>=CONV.x1-.26){
    if(end.jam&&!c.jam){c.jam=true;emit({e:'jam'})}
    else if(!c.jam){S.parcels=S.parcels.filter(p=>p!==end);
      if(end.m){const x=CONV.x1,z=CONV.z;emit({e:'burst',x,y:1,z});const v=nearestPlayer(x,z,5,inWH);
        S.mons.push({id:monSeq++,ty:0,x,y:CONV.y,z,ry:0,st:'lunge',t:0,k:0,v:end.c,f:false,a:1,bay:-1});if(v){emit({e:'scare',p:v.id,ty:0});damage(v,25)}}
      // the arm only drops a parcel into the bin of its own colour; otherwise it waits (and the belt backs up)
      else if(c.sel===end.c){S.shelved++;pay(10);if(S.shelved===S.quota)emit({e:'quota'});emit({e:'sorted',ok:true,b:c.sel})}
      else{S.parcels.push(end);if(!end.wait){end.wait=true;emit({e:'pwait',c:end.c})}}}}
  // hands in the bins, for anyone who leans over them too long
  for(const p of alivePlayers()){const near=CONV.bins.some(bz=>Math.hypot(p.x-CONV.bx,p.z-bz)<1.25);
    if(p.binT<0)p.binT=Math.min(0,p.binT+dt);else if(near){p.binT+=dt;if(p.binT>2.5){p.binT=-4;damage(p,20);emit({e:'hands',p:p.id,x:CONV.bx,z:CONV.bins.reduce((a,b)=>Math.abs(b-p.z)<Math.abs(a-p.z)?b:a)})}}else p.binT=Math.max(0,p.binT-dt)}}
function kickParcel(p,id,cut){const pc=S.parcels.find(x=>x.id===id);if(!pc||Math.hypot(p.x-pc.x,p.z-CONV.z)>3.2)return;S.parcels=S.parcels.filter(x=>x!==pc);
  if(pc.jam&&S.conv.jam&&pc.x>=CONV.x1-.3)S.conv.jam=false;
  if(pc.m){if(cut){emit({e:'squeal',x:pc.x,y:1,z:CONV.z});pay(5);toP(p,'Cut it open. Whatever it was, it\'s dead.')}
    else{const m={id:monSeq++,ty:0,x:pc.x,y:CONV.y,z:CONV.z+.6,ry:0,st:'lunge',t:0,k:0,v:pc.c,f:false,a:1,bay:-1};S.mons.push(m);emit({e:'burst',x:pc.x,y:1,z:CONV.z});pay(5);toP(p,'Good instincts.')}}
  else{S.lost++;emit({e:cut?'cut':'kick',x:pc.x,y:1,z:CONV.z});toP(p,cut?'You cut into a real parcel.':'The parcel fell off the belt.')}}

// ---------------------------------------------------------------- freight elevator
function elevUpdate(dt){if(!owned('base'))return;const e=S.elev;
  const open=e.st==='idle';e.gate=clamp(e.gate+(open?dt*1.5:-dt*2),0,1);
  if(e.st==='ride'){if(e.gate>0)return;e.t+=dt;
    if(e.stall&&!e.stallDone&&e.t>=3){e.st='stall';e.ht=0;e.hl=0;e.step=0;emit({e:'stall',lvl:e.lvl});return}
    if(e.t>=6)elevArrive();return}
  if(e.st==='stall'){e.ht+=dt;const C=e.lvl===0?CAR_UP:CAR_DN,hx=(C.x0+C.x1)/2,hz=(C.z0+C.z1)/2,inside=alivePlayers().filter(p=>inCar(p,C));
    e.step-=dt;if(e.step<=0){e.step=rand(.5,1.1);emit({e:'roof',x:hx+rand(-.6,.6),z:hz+rand(-.6,.6)})}
    // a light kept on the roof hatch makes it lose interest. The car is small: any working light aimed up at the
    // roof counts, so nobody has to hunt for the exact spot while something stamps overhead.
    if(inside.some(p=>p.light&&!p.dead&&(p.pitch>.6||litByP(p,hx,2.6,hz))))e.hl+=dt;
    if(e.hl>=ELEV_HOLD){e.st='ride';e.stallDone=true;emit({e:'unstall'});return}
    // you can't run from inside a stopped car, so the hatch hurts but never kills
    if(e.ht>=ELEV_WAIT){e.stallDone=true;e.st='ride';if(inside.length){const v=pick(inside);emit({e:'scare',p:v.id,ty:10});damage(v,45,12)}}}}
const ELEV_HOLD=2.5,ELEV_WAIT=18;
function elevStart(lvl){const e=S.elev;if(e.st!=='idle')return;const C=lvl===0?CAR_UP:CAR_DN;
  e.lvl=lvl;e.st='ride';e.t=0;e.stallDone=false;e.pass=alivePlayers().filter(p=>inCar(p,C)).map(p=>p.id);
  // it only stalls on a crew that has a working light between them
  e.stall=S.night>=2&&alivePlayers().some(p=>inCar(p,C)&&p.light)&&Math.random()<.3*diffEv();emit({e:'elevGo',lvl})}
function elevArrive(){const e=S.elev,from=e.lvl===0?CAR_UP:CAR_DN,dir=e.lvl===0?1:-1;
  for(const p of alivePlayers())if(inCar(p,from)){p.x+=CAR_OFF.x*dir;p.z+=CAR_OFF.z*dir;p.tpT=.8;emit({e:'tp',p:p.id,x:r2(p.x),z:r2(p.z)})}
  for(const b of S.boxes)if(b.st===3&&inCar(b,from)){b.x+=CAR_OFF.x*dir;b.z+=CAR_OFF.z*dir;S.bver++}
  e.lvl=1-e.lvl;e.st='idle';e.t=0;emit({e:'ding',lvl:e.lvl})}
const carGateOpen=lvl=>owned('base')&&S.elev&&S.elev.st==='idle'&&S.elev.lvl===lvl&&S.elev.gate>.8;

// ---------------------------------------------------------------- generator + moths
// the generator only burns fuel while it's carrying the building through an outage
function genUpdate(dt){if(!owned('gen')||S.ot||!S.outage)return;const g=S.gen;
  g.fuel=Math.max(0,g.fuel-dt*100/120);
  if(g.fuel<=0&&!g.out){g.out=true;emit({e:'genOut'})}}
const genPowered=()=>owned('gen')&&S.gen&&S.gen.fuel>0;
const mainsDown=()=>!!S.outage&&!genPowered(); // lamps dead, charger at a tenth of its speed
function powerOn(){S.lamps=LAMPS.map((L,i)=>L.dead&&!S.fixed.includes(i)?0:1);HOST.lampT=LAMPS.map(()=>0)}
function spawnMoth(){if(S.mons.filter(m=>m.ty===12).length>=2)return;const lit=LAMPS.map((L,i)=>i).filter(i=>S.lamps[i]);if(!lit.length)return;
  const li=pick(lit),L=LAMPS[li];S.mons.push({id:monSeq++,ty:12,x:L.x+1.2,z:L.z,y:4.4,ry:0,st:'circle',li,t:0,ph:rand(0,TAU),a:2,lt:0})}
function mothUpdate(m,dt){m.t+=dt;const L=LAMPS[m.li];
  if(m.st==='leave'){m.y+=dt*1.5;m.x+=Math.sin(m.ph)*dt*3;m.z+=Math.cos(m.ph)*dt*3;if(m.t>4){m.dead=true;emit({e:'fade',id:m.id})}return}
  const fl=S.flares.find(f=>Math.hypot(f.x-m.x,f.z-m.z)<16);
  const lp=litBy(m.x,m.y,m.z);
  if(lp&&m.st!=='lured'){m.st='lured';m.lur=lp.id;m.lt=0}
  if(m.st==='lured'){const p=S.players[m.lur];if(!p||p.dead){m.st='circle';return}
    if(litByP(p,m.x,m.y,m.z))m.lt=0;else{m.lt+=dt;if(m.lt>1.5){m.st='circle';return}}
    const tx=p.x,ty=1.7,tz=p.z,dx=tx-m.x,dy=ty-m.y,dz=tz-m.z,d=Math.hypot(dx,dy,dz);
    if(d<1){damage(p,6);emit({e:'mothHit',p:p.id,x:m.x,y:m.y,z:m.z});m.st='leave';m.t=0;return}
    const s=Math.min(d,2.4*dt);m.x+=dx/d*s;m.y+=dy/d*s;m.z+=dz/d*s;m.ry=Math.atan2(dx,dz);
    if(Math.hypot(m.x-L.x,m.z-L.z)>7){m.st='leave';m.t=0;emit({e:'msg',m:'The moth loses interest in the lamp.',p:p.id})}return}
  // circle a flare if there's one burning, otherwise its lamp, and break the bulb after a while
  const cx=fl?fl.x:L.x,cz=fl?fl.z:L.z,cy=fl?1.3:4.4,r=fl?.9:1.1;m.ph+=dt*2.2;
  const tx=cx+Math.cos(m.ph)*r,tz=cz+Math.sin(m.ph)*r,dx=tx-m.x,dy=cy-m.y,dz=tz-m.z,d=Math.hypot(dx,dy,dz);
  if(d>.01){const s=Math.min(d,3*dt);m.x+=dx/d*s;m.y+=dy/d*s;m.z+=dz/d*s;m.ry=Math.atan2(dx,dz)}
  if(!fl&&S.lamps[m.li]){if(m.t>14){lampOut(m.li,20);emit({e:'smashBulb',x:L.x,z:L.z});m.st='leave';m.t=0}}
  else if(!fl&&m.t>6){m.st='leave';m.t=0}}

// ---------------------------------------------------------------- forklift, pallets, the passenger
const forkTip=()=>({x:S.fork.x+Math.sin(S.fork.ry)*1.55,z:S.fork.z+Math.cos(S.fork.ry)*1.55});
function forkUpdate(dt){const f=S.fork;if(!f)return;FORKCOL.x0=f.x-.8;FORKCOL.x1=f.x+.8;FORKCOL.z0=f.z-.8;FORKCOL.z1=f.z+.8;
  if(!f.drv)return;const p=S.players[f.drv];if(!p||p.dead){f.drv='';return}
  f.nT=(f.nT||0)-dt;if(f.nT<=0){f.nT=.5;if(p.spd>.4){noise(f.x,f.z,14);HOST.nextStalker-=.3}}  // the engine carries
  if(f.pass){const t=forkTip(),y=.5+f.lift;if(litByP(p,t.x,y,t.z))f.pass.lit+=dt;else f.pass.dark+=dt;
    if(f.pass.lit>=3){f.pass=null;emit({e:'passGone',x:t.x,z:t.z})}
    else if(f.pass.dark>=7){f.pass=null;emit({e:'scare',p:p.id,ty:11});damage(p,40)}}
  const pal=S.pallets.find(x=>x.id===f.pal);if(pal){const t=forkTip();pal.x=t.x;pal.z=t.z;pal.ry=f.ry}}
// getting out (or 6 AM) sets any loose boxes on the forks down on the floor in front of them
function forkUnload(p){if(p.carry<0)return;const t=forkTip(),q=insideAny(t.x,t.z,.3)?{x:S.fork.x,z:S.fork.z}:t;
  for(const id of[p.carry,...p.stack])dropOne(q,id);p.carry=-1;p.stack=[];emit({e:'place',x:q.x,y:0,z:q.z})}
function palletInTruck(i){return S.pallets.some(x=>x.st===0&&x.bay===i)}

// ---------------------------------------------------------------- the loudspeaker: priority parcels, and the voice that isn't the supervisor
function paUpdate(dt){if(S.night<2||S.paN>=2||S.ot)return;HOST.nextPA-=dt;if(HOST.nextPA>0)return;HOST.nextPA=rand(80,130);
  const spots=PA_SPOTS.filter(s=>!lightZone(s.x,s.z,1)&&alivePlayers().every(p=>Math.hypot(p.x-s.x,p.z-s.z)>9));if(!spots.length)return;
  const s=pick(spots),fake=S.night>=6&&Math.random()<Math.min(.85,.5*diffEv());S.paN++;
  if(fake)spawnStalkerAt(s.x,s.z);
  else{S.boxes.push({id:boxSeq++,st:3,x:s.x,y:0,z:s.z,ry:rand(-.4,.4),k:1,f:false,v:0,h:'',s:-1,m:false,pri:true});S.bver++}
  emit({e:'pa2',fake,n:s.n})}
function spawnStalkerAt(x,z){const m={id:monSeq++,ty:2,x,y:0,z,ry:0,st:'ambush',a:0,litT:0,life:80,path:null,rep:0,lampT:0};S.mons.push(m)}

// ---------------------------------------------------------------- the thing in the yard
const yardOn=()=>S.night>=7||S.ot;
const YARD_D=[34,26,18,10],YARD_Y=[15,11,8,5]; // how far out it stands, and how high its face is (it stoops lower each step)
function yardUpdate(dt){const y=S.yard;if(!y)return;const tr=S.trucks[y.bay],gx=BAYS[y.bay].x;
  // its hand is on its way in through the door: it lands, then the door slams shut on it
  if(y.hit){y.ht+=dt;if(y.ht>=1.1){const v=S.players[y.hit];if(v&&!v.dead)damage(v,80);emit({e:'yhit',p:y.hit});tr.stuck=0;tr.door=0;emit({e:'slam',x:gx,z:WH.z0});S.yard=null}return}
  if(!(tr.st===0&&tr.stuck>0)){S.yard=null;return}
  const gz=WH.z0-YARD_D[y.stage],gy=YARD_Y[y.stage];
  for(const p of alivePlayers()){if(!inWH(p)||inTrailer(p)>=0)continue;const dx=gx-p.x,dy=gy-1.6,dz=gz-p.z,d=Math.hypot(dx,dy,dz);
    const cp=Math.cos(p.pitch),fx=-Math.sin(p.yaw)*cp,fy=Math.sin(p.pitch),fz=-Math.cos(p.yaw)*cp;
    if((dx*fx+dy*fy+dz*fz)/d<.93||segBlocked(p.x,p.z,gx,WH.z0-.5))continue;
    y.look+=dt;if(y.look<1.2)return;y.look=0;
    if(y.stage<3){y.stage++;emit({e:'boom',x:gx,z:WH.z0-YARD_D[y.stage]})}
    else{y.hit=p.id;y.ht=0;emit({e:'yreach',x:gx,z:WH.z0})} // the fourth look: it reaches in for whoever is looking
    return}}

// ---------------------------------------------------------------- the thing in the yard, when someone is up on the roof
// It comes in out of the storm from wherever nobody up there is looking, and walks round the outside of the building
// only as far as the nearest spot it can reach someone from. Then it leans over the parapet and reaches, slowly: its
// hand follows you at a walk, so you can step out from under it. If you're further in than its arm goes, it plants its
// other hand on the roof and leans right over the building. Nobody in the room in the middle of the roof can be
// reached. If the hand closes on you it lifts you up to its mouth. It gives up after a while and wanders off.
const RG_BITE=4.6,RG_O=2.8,RG_REACH=13.6,RG_REACH2=23.5,RG_SPD=2.1,RG_ST=['walk','reach','retract','eat','leave','wait'];
const rgRect=()=>({x0:ROOF.x0-RG_O,z0:ROOF.z0-RG_O,x1:ROOF.x1+RG_O,z1:ROOF.z1+RG_O});
const rgP=()=>{const r=rgRect();return 2*(r.x1-r.x0+r.z1-r.z0)};
function perimAt(s){const r=rgRect(),W=r.x1-r.x0,H=r.z1-r.z0,P=2*(W+H);s=((s%P)+P)%P;
  if(s<W)return{x:r.x0+s,z:r.z0};s-=W;if(s<H)return{x:r.x1,z:r.z0+s};s-=H;if(s<W)return{x:r.x1-s,z:r.z1};s-=W;return{x:r.x0,z:r.z1-s}}
function perimS(x,z){const r=rgRect(),W=r.x1-r.x0,H=r.z1-r.z0;x=clamp(x,r.x0,r.x1);z=clamp(z,r.z0,r.z1);
  const d=[z-r.z0,r.x1-x,r.z1-z,x-r.x0],m=Math.min(...d);
  return m===d[0]?x-r.x0:m===d[1]?W+(z-r.z0):m===d[2]?W+H+(r.x1-x):2*W+H+(r.z1-z)}
const arcD=(a,b)=>{const P=rgP();let d=Math.abs(a-b)%P;return Math.min(d,P-d)};
// does the straight walk from a to b cross the building?
function rgCrosses(ax,az,bx,bz){const R=ROOF,dx=bx-ax,dz=bz-az;let t0=0,t1=1;
  for(const [a,d,lo,hi] of[[ax,dx,R.x0,R.x1],[az,dz,R.z0,R.z1]]){if(Math.abs(d)<1e-9){if(a<lo||a>hi)return false;continue}
    let u=(lo-a)/d,v=(hi-a)/d;if(u>v)[u,v]=[v,u];t0=Math.max(t0,u);t1=Math.min(t1,v);if(t0>t1)return false}return t1>.01&&t0<.99}
const rgCanTake=p=>!!p&&!p.dead&&onRoof(p)&&!inRoofRoom(p);
// the spot round the building it can get to soonest from which p is in reach (an ordinary reach if anywhere allows
// it, otherwise one where it has to brace itself on the roof)
function rgSpot(g,p){const P=rgP(),gs=perimS(g.x,g.z),gp=perimAt(gs),off=Math.hypot(gp.x-g.x,gp.z-g.z);
  for(const R of[RG_REACH*.92,RG_REACH2*.95]){let best=null,bd=1e9;
    for(let s=0;s<P;s+=1){const q=perimAt(s);if(Math.hypot(q.x-p.x,q.z-p.z)>R)continue;
      const c=off<.5?arcD(s,gs):rgCrosses(g.x,g.z,q.x,q.z)?off+arcD(s,gs):Math.hypot(q.x-g.x,q.z-g.z);
      if(c<bd){bd=c;best={s,x:q.x,z:q.z,brace:R>RG_REACH,cost:c}}}
    if(best)return best}
  return null}
// out in the storm, in the direction furthest from where anyone up there is facing
function rgSpawnAt(ups,cx,cz){let best=null,bs=-9;
  for(let i=0;i<24;i++){const a=i/24*Math.PI*2,x=cx+Math.cos(a)*64,z=cz+Math.sin(a)*54;let sc=9;
    for(const p of ups){const dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz)||1;sc=Math.min(sc,(dx*Math.sin(p.yaw)+dz*Math.cos(p.yaw))/d)}
    if(sc>bs){bs=sc;best={x,z}}}return best}
function roofUpdate(dt){const ups=alivePlayers().filter(onRoof),R=ROOF,cx=(R.x0+R.x1)/2,cz=(R.z0+R.z1)/2;let g=S.rg;
  if(!g){HOST.rgT=ups.length?HOST.rgT+dt:Math.min(0,HOST.rgT+dt);
    if(HOST.rgT<9/diffEv())return;
    const sp=rgSpawnAt(ups,cx,cz);g=S.rg={st:'walk',x:sp.x,z:sp.z,ry:Math.atan2(cx-sp.x,cz-sp.z),k:0,hx:cx,hz:cz,tg:'',t:0,pt:0,far:0,stepD:0,b:0,re:0,goal:null};emit({e:'gnear'})}
  const P=rgP(),ease=v=>Math.max(0,v);
  const stepTo=(x,z,spd)=>{const dx=x-g.x,dz=z-g.z,d=Math.hypot(dx,dz);if(d<1e-3)return 0;const s=Math.min(d,spd*dt);g.x+=dx/d*s;g.z+=dz/d*s;g.ry=angLerp(g.ry,Math.atan2(dx,dz),dt*1.5);
    g.stepD+=s;if(g.stepD>3.4){g.stepD=0;emit({e:'gstep',x:r2(g.x),z:r2(g.z)})}return d-s};
  const face=(x,z)=>{g.ry=angLerp(g.ry,Math.atan2(x-g.x,z-g.z),dt*1.2)};
  let tg=S.players[g.tg];if(!rgCanTake(tg))tg=null;
  const prey=ups.filter(rgCanTake);
  if(g.st==='walk'||g.st==='wait'){
    if(!ups.length)g.st='leave';
    else{g.re-=dt;if(g.re<=0||!tg){g.re=.6;let best=null;for(const p of prey){const sp=rgSpot(g,p);if(sp&&(!best||sp.cost<best.sp.cost))best={p,sp}}
      if(best){tg=best.p;g.tg=tg.id;g.goal=best.sp}else{tg=null;g.goal=null}}}}
  if(g.st!=='leave'&&g.st!=='eat'){g.pt+=dt;if(g.pt>48&&g.st!=='reach')g.st=g.k>0?'retract':'leave'}
  const dTg=tg?Math.hypot(tg.x-g.x,tg.z-g.z):1e9,lim=g.b?RG_REACH2:RG_REACH;
  switch(g.st){
  case 'walk':case 'wait':{if(!tg||!g.goal){g.st='wait';break} // everyone up there is in the room: it waits outside
    const gs=perimS(g.x,g.z),gp=perimAt(gs),on=Math.hypot(gp.x-g.x,gp.z-g.z)<.4,go=g.goal;
    if(!on){stepTo(...(rgCrosses(g.x,g.z,go.x,go.z)?[gp.x,gp.z]:[go.x,go.z]),RG_SPD);g.st='walk';break} // still coming in out of the storm
    let ds=go.s-gs;if(ds>P/2)ds-=P;if(ds<-P/2)ds+=P;
    if(Math.abs(ds)>.35){const n=perimAt(gs+Math.sign(ds)*Math.min(Math.abs(ds),RG_SPD*dt));stepTo(n.x,n.z,RG_SPD*2);g.st='walk';break}
    face(tg.x,tg.z);g.st='wait';
    if(dTg<=(go.brace?RG_REACH2:RG_REACH)){g.st='reach';g.b=go.brace?1:0;g.hx=clamp(g.x,R.x0,R.x1);g.hz=clamp(g.z,R.z0,R.z1);g.far=0;emit({e:'greach'})}else g.re=0;break}
  case 'reach':{if(!tg){g.st='retract';break}face(tg.x,tg.z);g.k=Math.min(1,g.k+dt/(g.b?5.5:4.2));
    // the hand drifts after you at a walking pace, never further than its arm goes
    const dx=tg.x-g.hx,dz=tg.z-g.hz,d=Math.hypot(dx,dz),s=Math.min(d,(g.k<1?1.2:2.1)*dt);if(d>1e-3){g.hx+=dx/d*s;g.hz+=dz/d*s}
    const ox=g.hx-g.x,oz=g.hz-g.z,od=Math.hypot(ox,oz);if(od>lim){g.hx=g.x+ox/od*lim;g.hz=g.z+oz/od*lim}
    g.far=dTg>lim+1.2?g.far+dt:0;if(g.far>1.4){g.st='retract';break}
    if(g.k>=1&&Math.hypot(tg.x-g.hx,tg.z-g.hz)<1.15){g.st='eat';g.t=0;g.tg=tg.id;emit({e:'ggrab',p:tg.id})}break}
  case 'retract':g.k=Math.max(0,g.k-dt/2.6);if(g.k<=0){g.b=0;g.re=0;g.st=g.pt>48||!ups.length?'leave':'walk'}break;
  case 'eat':{const v=S.players[g.tg];if(!v||v.dead){g.st='leave';break}g.t+=dt;v.x=g.hx;v.z=g.hz;v.tpT=.5;
    // lifted to its face (2.4 s), the mouth opens, you go in, it closes on you
    if(g.t>=RG_BITE&&!g.bit){g.bit=1;emit({e:'gbite',p:v.id,x:r2(g.x),z:r2(g.z)})}
    if(g.t>=RG_BITE+.6){damage(v,999);g.st='leave';g.bit=0}break}
  case 'leave':{g.k=ease(g.k-dt/2);if(g.k<=0)g.b=0;const dx=g.x-cx,dz=g.z-cz,d=Math.hypot(dx,dz)||1;stepTo(g.x+dx/d*5,g.z+dz/d*5,RG_SPD*1.15);
    if(d>78){S.rg=null;HOST.rgT=-rand(25,40)}break}}}


// ---------------------------------------------------------------- the warehouse getting cold
// From night 3, every second night (every third with the heater), halfway through the shift the ventilation plant in
// the room on the roof starts failing. The crew gets two minutes to restart it there. After that the warehouse goes
// cold: everyone loses a point of health a second until someone restarts it, frozen crates stop thawing, and the
// frost figures can leave the freezer room. Once it is running again they run back.
const CHILL_WARN=120;
function coldNight(n){const N=owned('heat')?3:2;return n>1&&(n-1)%N===0}
function chillUpdate(dt){
  if(!S.chill&&S.t>=HOST.chillAt){HOST.chillAt=Infinity;S.chill={st:'warn',t:CHILL_WARN};emit({e:'chill'})}
  const c=S.chill;if(!c)return;
  if(c.st==='warn'){c.t-=dt;if(c.t<=0){c.st='cold';c.t=0;HOST.frzT=0;emit({e:'frozen'})}return}
  HOST.frzT+=dt;if(HOST.frzT<1)return;HOST.frzT-=1;
  for(const p of alivePlayers()){p.hp-=1;if(p.hp<=0){p.hp=1;damage(p,999)}}}
function fixVent(p){if(!S.chill||!nearPos(p,VENT.x,VENT.z,3.4))return;const was=S.chill.st;S.chill=null;emit({e:'warm',p:p.id,n:p.name,was})}

// ---------------------------------------------------------------- the warehouse robots (AMR S and AMR L)
// Each waits on its pad on the dock. Load it (a box on the S pad by hand, a pallet on the L pad with the forklift) and
// it picks a free shelf (bottom or middle for S, top for L), drives there slowly down the aisles, lifts the load in,
// shelves it, and comes back. One load at a time. It stops for anyone standing in front of it.
const AMR_ST=['home','go','lift','back'];
const AMR_LIFT=1.8;
const amrAt=A=>(S.amr||[]).some(r=>r.k===(A===AMR.s?'s':'l')&&r.st==='home');
// a free shelf for a robot's load, nearest the pad first, and the aisle spot in front of it
function amrSlot(r){const A=AMR[r.k],taken=new Set((S.amr||[]).map(o=>o.slot));let best=null,bd=1e9;
  for(const s of SLOTS){if(s.old||s.cold||!slotOn(s)||s.box!==-1||taken.has(s.id))continue;if(r.k==='s'?s.y>2:s.y<2)continue;
    const d=Math.hypot(s.x-A.x,s.z-A.z);if(d<bd){const ap=amrAisle(s,r.x,r.z);if(ap){bd=d;best={s,ap}}}}return best}
function amrAisle(s,fx,fz){const free=(x,z)=>{const [i,j]=cellOf(x,z);return!GRID.blk[j*GRID.nx+i]&&x>WH.x0+1&&x<WH.x1-1&&z>WH.z0+1&&z<WH.z1-1};
  const c=[[s.x,s.z-1.4],[s.x,s.z+1.4]].filter(([x,z])=>free(x,z)).sort((a,b)=>Math.hypot(a[0]-fx,a[1]-fz)-Math.hypot(b[0]-fx,b[1]-fz));return c[0]?{x:c[0][0],z:c[0][1]}:null}
function amrDrive(r,tx,tz,sp,dt){r.rep-=dt;if(r.rep<=0||!r.path){r.rep=.8;r.path=astar(r.x,r.z,tx,tz)}let px=tx,pz=tz;
  if(r.path){while(r.path.length&&Math.hypot(r.path[0].x-r.x,r.path[0].z-r.z)<.45)r.path.shift();if(r.path.length){px=r.path[0].x;pz=r.path[0].z}}
  const dx=px-r.x,dz=pz-r.z,d=Math.hypot(dx,dz);if(d<.02)return Math.hypot(tx-r.x,tz-r.z);
  // turn on the spot first, then roll; and stop dead for anyone in the way
  const want=Math.atan2(dx,dz),off=Math.abs(angDiff(r.ry,want));r.ry=angLerp(r.ry,want,dt*2.2);
  const fx=Math.sin(r.ry),fz=Math.cos(r.ry),block=alivePlayers().some(p=>{const ox=p.x-r.x,oz=p.z-r.z,od=Math.hypot(ox,oz);return od<(r.k==='l'?1.9:1.3)&&(ox*fx+oz*fz)/Math.max(od,.01)>.2});
  if(block){if((r.stop+=dt)>2.5){r.stop=0;emit({e:'amrBeep',x:r.x,z:r.z})}return 99}
  if(off<.6){const s=Math.min(d,sp*dt);r.x+=dx/d*s;r.z+=dz/d*s}return Math.hypot(tx-r.x,tz-r.z)}
function amrUpdate(dt){for(const r of S.amr||[]){const A=AMR[r.k];
  const load=r.k==='s'?S.boxes.find(b=>b.id===r.load&&b.st!==4):S.pallets.find(p=>p.id===r.load&&p.st!==4);
  // the pallet rides on the big one; lifting, it goes up first (60% of the time) and then slides across onto the shelf
  const carry=()=>{if(r.k!=='l'||!load)return;const s=SLOTS[r.slot],k=r.st==='lift'?Math.min(1,r.t/AMR_LIFT):0,up=Math.min(1,k/.6),across=Math.max(0,(k-.6)/.4);
    load.x=s?lerp(r.x,s.x,across):r.x;load.z=s?lerp(r.z,s.z,across):r.z;load.ry=lerp(r.ry,0,across);load.y=A.deck+up*(s?s.y-A.deck:0)};
  switch(r.st){
  case 'home':{r.ry=angLerp(r.ry,Math.PI,dt*2);
    // something waiting on the pad?
    const w=r.k==='s'?S.boxes.find(b=>b.st===3&&b.amr===1&&Math.hypot(b.x-A.x,b.z-A.z)<1):S.pallets.find(p=>p.st===3&&p.amr===1&&Math.hypot(p.x-A.x,p.z-A.z)<1.2);
    if(!w)break;const sl=amrSlot(r);if(!sl){if((r.t-=dt)<=0){r.t=8;emit({e:'msg',m:`${A.name}: no free ${r.k==='s'?'lower':'top'} shelf to take it to.`})}break}
    w.amr=2;w.y=A.deck;r.load=w.id;r.slot=sl.s.id;r.goal=sl.ap;r.path=null;r.st='go';if(r.k==='s')S.bver++;emit({e:'amrGo',k:r.k,x:r.x,z:r.z});break}
  case 'go':{if(!load){r.st='back';break}carry();const s=SLOTS[r.slot];
    if(s.box!==-1){const sl=amrSlot(r);if(!sl){r.st='back';break}r.slot=sl.s.id;r.goal=sl.ap;r.path=null} // someone filled it first
    if(amrDrive(r,r.goal.x,r.goal.z,A.speed,dt)<.25){r.st='lift';r.t=0;r.ry=Math.atan2(s.x-r.x,s.z-r.z)}break}
  case 'lift':{if(!load){r.st='back';break}r.t+=dt;r.ry=angLerp(r.ry,Math.atan2(SLOTS[r.slot].x-r.x,SLOTS[r.slot].z-r.z),dt*4);carry();if(r.t<AMR_LIFT)break;
    const s=SLOTS[r.slot];if(s.box!==-1){r.st='go';r.t=0;break}
    if(r.k==='s'){const b=load;b.st=2;b.s=s.id;b.x=s.x+rand(-.12,.12);b.y=s.y;b.z=s.z+rand(-.06,.06);b.ry=rand(-.1,.1);b.amr=0;s.box=b.id;S.shelved++;pay(b.pri?20:b.f?15:10);S.bver++}
    else{const p=load;p.st=2;p.x=s.x;p.z=s.z;p.ry=0;p.y=0;p.amr=0;p.s=s.id;s.box=-(1000+p.id);S.shelved+=8;pay(80)}
    emit({e:'place',x:s.x,y:s.y,z:s.z});if(S.shelved>=S.quota&&S.shelved-(r.k==='s'?1:8)<S.quota)emit({e:'quota'});
    r.load=-1;r.slot=-1;r.st='back';r.path=null;r.t=0;break}
  case 'back':{if(load&&load.amr===2){load.amr=1;load.x=A.x;load.z=A.z;load.y=0;if(r.k==='s')S.bver++;r.load=-1;r.slot=-1}  // couldn't place it: brings it home
    if(amrDrive(r,A.x,A.z,A.speed,dt)<.2){r.x=A.x;r.z=A.z;r.st='home';r.t=0}break}}}}
// a box from your arms onto the AMR-S pad
function amrLoad(p){if(!owned('amrs'))return;const no=m=>toP(p,m),b=S.boxes.find(x=>x.id===p.carry&&x.st!==4);if(!b)return no('Bring a box to put on the pad.');
  if(!nearPos(p,AMR.s.x,AMR.s.z,2.8))return;if(b.ret)return no('The robot doesn\'t take returns. They go in the basement shredder.');if(b.fz)return no('Frozen crates need a person: take it to the freezer.');
  if(S.boxes.some(x=>x.st===3&&x.amr===1))return no('There\'s already a box waiting on the pad.');
  const home=amrAt(AMR.s);b.st=3;b.amr=1;b.h='';b.s=-1;b.x=AMR.s.x;b.z=AMR.s.z;b.y=home?AMR.s.deck:0;b.ry=0;p.carry=p.stack.length?p.stack.pop():-1;S.bver++;emit({e:'place',x:b.x,y:b.y,z:b.z})}
// ---------------------------------------------------------------- the night manager
function managerUpdate(m,dt){m.t+=dt;
  const walkTo=(tx,tz,sp)=>{m.rep-=dt;if(m.rep<=0||!m.path){m.rep=.6;m.path=astar(m.x,m.z,tx,tz)}let px=tx,pz=tz;
    if(m.path){while(m.path.length&&Math.hypot(m.path[0].x-m.x,m.path[0].z-m.z)<.4)m.path.shift();if(m.path.length){px=m.path[0].x;pz=m.path[0].z}}
    const dx=px-m.x,dz=pz-m.z,d=Math.hypot(dx,dz);if(d>.02){const s=Math.min(d,sp*dt);m.x+=dx/d*s;m.z+=dz/d*s;m.ry=angLerp(m.ry,Math.atan2(dx,dz),dt*6)}return Math.hypot(tx-m.x,tz-m.z)};
  if(m.st==='leave'){m.a=2;if(walkTo(MGR_SPOT.x,MGR_SPOT.z,1.4)<.5){m.dead=true;emit({e:'fade',id:m.id})}return}
  if(m.st==='final'){const p=S.players[m.tg];m.a=4;if(!p||p.dead||!inWH(p)||m.t>25){if(p)p.wu=2;m.st='walk';m.t=0;return}
    if(Math.hypot(p.x-m.x,p.z-m.z)<1.1){emit({e:'scare',p:p.id,ty:4,id:m.id});damage(p,999);m.st='leave';return}
    walkTo(p.x,p.z,2.85);return}
  if(m.st==='write'){m.a=3;if(m.t>1.4){m.st='walk';m.t=0;m.tx=undefined}return}
  // he notices anyone standing around empty-handed in front of him
  const fx=Math.sin(m.ry),fz=Math.cos(m.ry);
  for(const p of alivePlayers()){if(!inWH(p)||inTrailer(p)>=0||p.wuCD>0)continue;const dx=p.x-m.x,dz=p.z-m.z,d=Math.hypot(dx,dz);
    const seen=d<12&&(dx*fx+dz*fz)/Math.max(d,.01)>.8&&!segBlocked(m.x,m.z,p.x,p.z);
    const idle=p.spd<.3&&p.carry<0&&!p.can&&S.fork.drv!==p.id;
    if(seen&&idle){p.idleT+=dt;if(p.idleT>=3){p.idleT=0;p.wuCD=15;p.wu=(p.wu||0)+1;S.cash=Math.max(0,(S.cash||0)-10);
      emit({e:'writeup',p:p.id,n:p.wu,id:m.id});m.ry=Math.atan2(dx,dz);
      if(p.wu>=3){m.st='final';m.tg=p.id;m.t=0;emit({e:'mgrFinal',p:p.id})}else{m.st='write';m.t=0}return}}
    else p.idleT=Math.max(0,p.idleT-dt*.5)}
  if(m.st==='look'){m.a=0;m.ry+=Math.sin(m.t*.8)*dt*.6;if(m.t>m.lookT){m.st='walk';m.t=0;m.tx=undefined}return}
  m.a=2;if(m.tx===undefined){for(let k=0;k<30;k++){const i=randi(0,GRID.nx-1),j=randi(9,GRID.nz-1);if(GRID.blk[j*GRID.nx+i])continue;m.tx=GRID.x0+i+.5;m.tz=GRID.z0+j+.5;break}m.path=null}
  if(m.tx===undefined||walkTo(m.tx,m.tz,1.25)<.5){m.st='look';m.t=0;m.lookT=rand(2,4)}}

// ---------------------------------------------------------------- the shrink-wrap
function shrinkUpdate(m,dt){m.cd-=dt;
  const v=alivePlayers().find(p=>inWH(p)&&Math.hypot(p.x-m.x,p.z-m.z)<1.0);
  if(v&&m.cd<=0){emit({e:'scare',p:v.id,ty:5,id:m.id});damage(v,50);m.st='return';m.cd=6;m.path=null;return}
  // it hears running, kicking, forklifts, carry-upgrade stacks and air horns. Walking is silent.
  for(const n of HOST.noise||[])if(Math.hypot(n.x-m.x,n.z-m.z)<n.r&&(m.st!=='hunt'||Math.hypot(n.x-m.tx,n.z-m.tz)>1)){m.st='hunt';m.tx=n.x;m.tz=n.z;m.heard=S.t;m.path=null}
  let tx,tz,sp=1.7;
  if(m.st==='home'){m.a=0;return}
  if(m.st==='wait'){m.a=0;m.t-=dt;if(m.t<=0)m.st=S.t-m.heard>18?'return':'wait';if(m.st==='wait'&&m.t<=0)m.t=2;return}
  if(m.st==='return'){tx=SHRINK_HOME.x;tz=SHRINK_HOME.z;if(Math.hypot(tx-m.x,tz-m.z)<.4){m.st='home';m.ry=-2.4;return}}else{tx=m.tx;tz=m.tz}
  m.rep-=dt;if(m.rep<=0||!m.path){m.rep=.7;m.path=astar(m.x,m.z,tx,tz)}let px=tx,pz=tz;
  if(m.path){while(m.path.length&&Math.hypot(m.path[0].x-m.x,m.path[0].z-m.z)<.4)m.path.shift();if(m.path.length){px=m.path[0].x;pz=m.path[0].z}}
  const dx=px-m.x,dz=pz-m.z,d=Math.hypot(dx,dz);m.a=2;if(d>.02){const s=Math.min(d,sp*dt);m.x+=dx/d*s;m.z+=dz/d*s;m.ry=angLerp(m.ry,Math.atan2(dx,dz),dt*4)}
  if(m.st==='hunt'&&Math.hypot(tx-m.x,tz-m.z)<.6){m.st='wait';m.t=4}}

// ---------------------------------------------------------------- the driver
function spawnDriver(i){if(S.night<5||S.mons.some(m=>m.ty===7)||Math.random()>.22*diffEv())return;
  S.mons.push({id:monSeq++,ty:7,bay:i,x:BAYS[i].x+2.4,z:WH.z0+1.2,y:0,ry:0,st:'wander',a:2,life:75,stun:0,path:null,rep:0,k:randi(0,9)})}
function driverUpdate(m,dt){m.life-=dt;m.stun-=dt;
  const walkTo=(tx,tz,sp)=>{m.rep-=dt;if(m.rep<=0||!m.path){m.rep=.5;m.path=astar(m.x,m.z,tx,tz)}let px=tx,pz=tz;
    if(m.path){while(m.path.length&&Math.hypot(m.path[0].x-m.x,m.path[0].z-m.z)<.4)m.path.shift();if(m.path.length){px=m.path[0].x;pz=m.path[0].z}}
    const dx=px-m.x,dz=pz-m.z,d=Math.hypot(dx,dz);if(d>.02){const s=Math.min(d,sp*dt);m.x+=dx/d*s;m.z+=dz/d*s;m.ry=angLerp(m.ry,Math.atan2(dx,dz),dt*6)}return Math.hypot(tx-m.x,tz-m.z)};
  if(m.stun>0){m.a=1;return}
  if(m.st==='leave'||m.life<=0){m.st='leave';m.a=2;if(walkTo(BAYS[m.bay].x,WH.z0+.6,1.6)<.5){m.dead=true;emit({e:'fade',id:m.id})}return}
  const tgt=nearestPlayer(m.x,m.z,8,p=>inWH(p)&&inTrailer(p)<0&&!segBlocked(m.x,m.z,p.x,p.z));
  if(tgt){if(Math.hypot(tgt.x-m.x,tgt.z-m.z)<1.1){emit({e:'scare',p:tgt.id,ty:7,id:m.id});damage(tgt,35);m.st='leave';return}m.a=2;walkTo(tgt.x,tgt.z,1.6);return} // a slow, stiff walk: anyone can outpace him
  m.a=2;if(m.tx===undefined||walkTo(m.tx,m.tz,1.3)<.5){for(let k=0;k<30;k++){const i=randi(0,GRID.nx-1),j=randi(3,GRID.nz-1);if(GRID.blk[j*GRID.nx+i])continue;m.tx=GRID.x0+i+.5;m.tz=GRID.z0+j+.5;m.path=null;break}}}

// ---------------------------------------------------------------- items
function useItem(p,a){const k=a.a==='use'?a.k:null;if(!k)return;const inv=p.inv,no=m=>toP(p,m);
  const take=()=>{if(!(inv[k]>0))return false;inv[k]--;return true};
  const fx=-Math.sin(p.yaw),fz=-Math.cos(p.yaw);
  switch(k){
  case 'batt':case 'drink':if(take())emit({e:'item',p:p.id,k});break;
  case 'flare':if(take()){const f={id:flSeq++,x:p.x+fx*.7,z:p.z+fz*.7,t:35};if(insideAny(f.x,f.z,.1)){f.x=p.x;f.z=p.z}S.flares.push(f);emit({e:'flare',x:f.x,z:f.z})}break;
  case 'cutter':{if(!p.up.cutter)return;if(a.pc!==undefined){kickParcel(p,a.pc,true);return}
    // a mimic that has already burst out (off the belt, or out of a box) can be cut down too, if you can reach it
    if(a.m!==undefined){const m=S.mons.find(x=>x.id===a.m&&x.ty===0&&x.st!=='bolt'&&!x.dead);if(!m||Math.hypot(p.x-m.x,p.z-m.z)>3)return;
      m.dead=true;emit({e:'squeal',x:m.x,y:m.y+.3,z:m.z});emit({e:'fade',id:m.id});pay(5);no('Cut it down. Whatever it was, it\'s dead.');return}
    const b=S.boxes.find(x=>x.id===a.b&&(x.st===0||x.st===3));if(!b)return;const w=boxWorld(b);if(Math.hypot(p.x-w.x,p.z-w.z)>3.2)return;
    if(b.m){freeMimicBox(b);emit({e:'squeal',x:w.x,y:w.y+.3,z:w.z});pay(5);no('Cut it open. Whatever it was, it\'s dead.')}
    else{const bay=b.st===0?b.bay:-1;b.st=4;S.lost++;S.bver++;if(bay>=0)settleTruck(bay);emit({e:'cut',x:w.x,y:w.y,z:w.z});no('You cut into real freight. That one\'s ruined.')}break}
  case 'strobe':{if(!take())return;emit({e:'strobe',p:p.id,x:p.x,z:p.z});
    const inCone=(x,z,r)=>{const dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz);return d<r&&(d<1.5||(dx*fx+dz*fz)/d>.6)};
    // flashed in the face, the thing in the yard snatches its hand back (and takes longer to try again)
    const g=S.rg;if(g&&onRoof(p)&&(g.st==='reach'||g.st==='wait')&&(inCone(g.x,g.z,30)||inCone(g.hx,g.hz,30))){g.st='retract';g.pt+=12;emit({e:'gflinch',x:r2(g.x),z:r2(g.z)})}
    for(const m of S.mons){
      if(m.ty===1&&m.st!=='sleep'&&m.st!=='return'&&inCone(m.x,m.z,12)){m.st='return';m.cd=10;m.litT=0}
      else if(m.ty===3&&!['inside','home','back','out','climb'].includes(m.st)&&Math.hypot(m.x-p.x,m.z-p.z)<14)crawlFlee(m);
      else if(m.ty===0&&m.st!=='bolt'&&Math.hypot(m.x-p.x,m.z-p.z)<10)boltMimic(m);
      else if(m.ty===7&&Math.hypot(m.x-p.x,m.z-p.z)<12)m.stun=6;
      else if(m.ty===12&&Math.hypot(m.x-p.x,m.z-p.z)<12){m.st='leave';m.t=0}
      else if(m.ty===2&&inCone(m.x,m.z,12)){m.dead=true;emit({e:'shriek',id:m.id,x:m.x,z:m.z})}}
    for(const b of S.boxes)if(b.roam&&b.st===3&&Math.hypot(b.x-p.x,b.z-p.z)<10)unboxMimic(b,'bolt',p.id);
    if(S.fork.pass&&Math.hypot(S.fork.x-p.x,S.fork.z-p.z)<8){S.fork.pass=null;const t=forkTip();emit({e:'passGone',x:t.x,z:t.z})}break}
  case 'horn':{if(!take())return;noise(p.x,p.z,45);emit({e:'airhorn',x:p.x,z:p.z});for(const m of S.mons)if(m.ty===7&&Math.hypot(m.x-p.x,m.z-p.z)<14)m.stun=6;break}
  case 'remote':{if(!(inv.remote>0))return;let bi=-1,bd=1e9;BAYS.forEach((b,i)=>{if(!bayOn(i))return;const d=Math.abs(p.x-b.x)+(p.x>60?1e6:0);if(d<bd){bd=d;bi=i}});if(bi<0)return;
    const tr=S.trucks[bi],nm=BAYS[bi].name;
    if(tr.st===0&&tr.stuck>0){inv.remote--;tr.stuck=0;tr.door=0;S.yard=null;emit({e:'slam',x:BAYS[bi].x,z:WH.z0});no(`Bay ${nm} door closed.`);break}
    if(tr.st!==2)return no(`Nothing to shut at Bay ${nm}.`);
    if(alivePlayers().some(q=>inTrailer(q)===bi))return no(`Someone is still inside the Bay ${nm} trailer.`);
    inv.remote--;tr.reject=true;tr.st=3;tr.t=0;tr.door=0;
    for(const m of S.mons){if(m.bay!==bi)continue;if(m.ty===3&&m.st!=='inside'&&m.st!=='home'){m.dead=true;emit({e:'vanish',x:m.x,y:m.y,z:m.z})}if(m.ty===1){m.st='sleep';m.lx=LURK_LX;m.lz=LURK_HOME;m.ry=Math.PI/2}}
    emit({e:'slam',x:BAYS[bi].x,z:WH.z0});emit({e:'horn',b:bi});no(`Bay ${nm} slammed shut. The truck is leaving.`);break}
  case 'bulb':{if(!(inv.bulb>0))return;let fi=-1;LAMPS.forEach((L,i)=>{if(L.dead&&!S.fixed.includes(i)&&Math.hypot(p.x-L.x,p.z-L.z)<2.2)fi=i});
    if(fi<0)return no('Stand under a dead light fixture to put the bulb in.');if(S.fixed.length>=MAX_BULBS)return no('That\'s as many fixtures as the wiring will take.');
    inv.bulb--;S.fixed.push(fi);if(!S.ot&&!mainsDown())S.lamps[fi]=1;emit({e:'bulbOn',i:fi});break}
  }}

// ---------------------------------------------------------------- the actions additions add (returns true if handled)
function act2(pid,p,a){
  switch(a.a){
  case 'use':useItem(p,a);return true;
  case 'cold':{if(!owned('cold'))return true;const c=S.cold;if(c.open){c.open=false}else{c.open=true;c.t=6}emit({e:'coldDoor',o:c.open?1:0});return true}
  case 'lever':{if(!owned('conv')||!nearPos(p,CONV.lever.x,CONV.lever.z,3))return true;S.conv.sel=(S.conv.sel+1)%3;emit({e:'lever',x:CONV.lever.x,z:CONV.lever.z});return true}
  case 'jam':{if(!owned('conv')||!S.conv.jam||!nearPos(p,CONV.jam.x,CONV.jam.z,2.5))return true;S.conv.jam=false;const e=S.parcels.find(x=>x.jam&&x.x>=CONV.x1-.3);if(e)e.jam=false;emit({e:'unjam'});return true}
  case 'elevIn':{if(!owned('base'))return true;const C=a.lvl===0?CAR_UP:CAR_DN;if(!inCar(p,C)||S.elev.lvl!==a.lvl)return true;elevStart(a.lvl);return true}
  case 'elevCall':{if(!owned('base'))return true;if(S.elev.st==='idle'&&S.elev.lvl!==a.lvl)elevStart(S.elev.lvl);return true}
  case 'shred':shredBox(p);return true;
  case 'climb':{if(p.carry>=0||p.can||(S.fork&&S.fork.drv===pid))return toP(p,'You need both hands for the ladder.'),true;
    const up=nearPos(p,LADDER.x,LADDER.z,2.4),down=nearPos(p,HATCH.x,HATCH.z,2.4);if(!up&&!down)return true;
    if(down&&S.rg&&S.rg.st==='eat'&&S.rg.tg===pid)return true;
    const x=up?HATCH.x+1.15:LADDER.x+1.1,z=up?HATCH.z-1.1:LADDER.z-.9;p.x=x;p.z=z;p.tpT=.8;
    emit({e:'tp',p:pid,x:r2(x),z:r2(z),climb:up?1:-1});return true}
  case 'vent':fixVent(p);return true;
  case 'amrLoad':amrLoad(p);return true;
  case 'stash':{if(!nearPos(p,STASH.x,STASH.z,2.4))return true;if(!S.stash)return toP(p,'Empty. Someone already went through it tonight.'),true;
    S.stash=false;const k=['batt','flare','drink','horn','strobe'][randi(0,4)];p.inv[k]=(p.inv[k]||0)+1;emit({e:'stash',p:pid,k});return true}
  case 'struggle':{if(S.t-(p.sgT??-1e9)<.06)return true;p.sgT=S.t;if(S.mons.some(m=>m.ty===14&&m.st==='drag'&&m.tg===pid))p.strug=(p.strug||0)+1;return true}
  case 'shake':{if(!p.up.shake||S.t-(p.shT??-1e9)<.3)return true;p.shT=S.t;noise(p.x,p.z,10);emit({e:'shake',p:pid,x:p.x,z:p.z});return true}
  case 'can':{if(!owned('gen')||p.carry>=0||p.can||!nearPos(p,FUELR.x,FUELR.z,2.6))return true;p.can=true;emit({e:'canUp',p:pid});return true}
  case 'fuel':{if(!owned('gen')||!p.can||!nearPos(p,GEN.x,GEN.z,2.8))return true;p.can=false;const was=mainsDown();S.gen.fuel=Math.min(100,S.gen.fuel+50);S.gen.out=false;if(was&&!S.ot)powerOn();emit({e:'refuel',x:GEN.x,z:GEN.z,on:was});return true}
  case 'fork':{const f=S.fork;if(f.drv===pid){forkUnload(p);f.drv='';const sx=Math.cos(f.ry),sz=-Math.sin(f.ry);let x=f.x+sx*1.2,z=f.z+sz*1.2;if(insideAny(x,z,.3)){x=f.x-sx*1.2;z=f.z-sz*1.2}
      p.x=x;p.z=z;p.tpT=.6;emit({e:'tp',p:pid,x:r2(x),z:r2(z)});emit({e:'forkOut',p:pid});return true}
    if(!owned("fork")||f.drv||p.carry>=0||p.can||Math.hypot(p.x-f.x,p.z-f.z)>5.2)return true; // (matches the reach of the hit box around it)
    f.drv=pid;if(S.night>=2&&!f.pass&&Math.random()<.25*diffEv())f.pass={lit:0,dark:0};emit({e:'forkIn',p:pid});return true}
  case 'fpick':{const f=S.fork;if(f.drv!==pid||f.pal>=0||p.carry>=0)return true;const t=forkTip();const pal=S.pallets.find(x=>(x.st===0||x.st===3)&&x.amr!==2&&Math.hypot(palWorld(x).x-t.x,palWorld(x).z-t.z)<1.3);
    if(!pal)return true;pal.st=1;f.pal=pal.id;pal.amr=0;pal.y=0;f.lift=2.62;emit({e:'pick',x:t.x,y:.5,z:t.z});return true}
  case 'fplace':{const f=S.fork,pal=S.pallets.find(x=>x.id===f.pal),s=SLOTS[a.s];if(f.drv!==pid||!pal||!s)return true;const t=forkTip();
    if(s.old||s.box!==-1||s.cold||!slotOn(s)||s.y<2||Math.hypot(t.x-s.x,t.z-s.z)>2.6)return true;
    pal.st=2;pal.x=s.x;pal.z=s.z;pal.ry=0;pal.s=s.id;s.box=-(1000+pal.id);f.pal=-1;f.lift=.1;S.shelved+=8;pay(80);emit({e:"place",x:s.x,y:s.y,z:s.z});if(S.shelved>=S.quota&&S.shelved-8<S.quota)emit({e:'quota'});return true}
  case 'fdrop':{const f=S.fork,pal=S.pallets.find(x=>x.id===f.pal);if(f.drv!==pid||!pal)return true;const t=forkTip();pal.st=3;pal.x=t.x;pal.z=t.z;if(owned('amrl')&&Math.hypot(t.x-AMR.l.x,t.z-AMR.l.z)<1.7&&!S.pallets.some(q=>q!==pal&&q.st===3&&q.amr)){pal.x=AMR.l.x;pal.z=AMR.l.z;pal.ry=0;pal.amr=1;pal.y=amrAt(AMR.l)?AMR.l.deck:0} /* onto the robot pad */f.pal=-1;f.lift=.1;emit({e:'place',x:t.x,y:0,z:t.z});return true}
  }
  return false}
function palWorld(pal){if(pal.st===0){const tr=S.trucks[pal.bay];return{x:BAYS[pal.bay].x+pal.lx,z:tr.z+pal.lz}}return{x:pal.x,z:pal.z}}

// ---------------------------------------------------------------- the blind one
// Comes out as soon as the power fails. Tall, eyeless, and it lives in the dark: it won't step into lamp light or
// near a flare. It hunts by sound (running, kicking, dropped boxes, the air horn, a shaken flashlight), and close
// up it feels footsteps, so walking within 3 m of it gives you away. Standing still is safe; light does nothing.
function spawnBlind(){if(S.mons.some(m=>m.ty===13))return;let best=null,bd=-1;
  for(let k=0;k<50;k++){const i=randi(0,GRID.nx-1),j=randi(4,GRID.nz-1);if(GRID.blk[j*GRID.nx+i])continue;const x=GRID.x0+i+.5,z=GRID.z0+j+.5;if(lightZone(x,z,1))continue;
    const p=nearestPlayer(x,z,1e9,inWH),d=p?Math.hypot(p.x-x,p.z-z):30;if(d>bd){bd=d;best={x,z}}}
  if(best)S.mons.push({id:monSeq++,ty:13,x:best.x,z:best.z,y:0,ry:rand(-3,3),st:'look',a:0,t:0,lookT:3,cd:3,path:null,rep:0,hearT:0})}
function blindUpdate(m,dt){m.cd-=dt;m.t+=dt;m.hearT-=dt;
  const v=alivePlayers().find(p=>inWH(p)&&Math.hypot(p.x-m.x,p.z-m.z)<1.0);
  if(v&&m.cd<=0){emit({e:'scare',p:v.id,ty:13,id:m.id});damage(v,55);m.st='look';m.t=0;m.lookT=4;m.cd=7;return}
  const hear=(x,z)=>{if(lightZone(x,z,.3))return;if(m.st!=='hunt'||Math.hypot(x-m.tx,z-m.tz)>1){m.path=null;if(m.hearT<=0){m.hearT=4;emit({e:'blindHear',id:m.id,x:m.x,z:m.z})}}m.st='hunt';m.tx=x;m.tz=z};
  if(m.cd<=2){for(const n of HOST.noise||[])if(Math.hypot(n.x-m.x,n.z-m.z)<n.r*1.4)hear(n.x,n.z);
    for(const p of alivePlayers())if(inWH(p)&&p.spd>.8&&Math.hypot(p.x-m.x,p.z-m.z)<3.2)hear(p.x,p.z)}
  if(m.st==='look'){m.a=0;if(m.t>m.lookT){m.st='wander';m.t=0;m.tx=undefined}return}
  if(m.st==='wander'&&m.tx===undefined){for(let k=0;k<30;k++){const i=randi(0,GRID.nx-1),j=randi(4,GRID.nz-1);if(GRID.blk[j*GRID.nx+i])continue;const x=GRID.x0+i+.5,z=GRID.z0+j+.5;if(lightZone(x,z,.5))continue;m.tx=x;m.tz=z;break}m.path=null}
  if(m.tx===undefined){m.st='look';m.t=0;m.lookT=2;return}
  // its path keeps to the dark
  m.rep-=dt;if(m.rep<=0||!m.path){m.rep=.5;m.path=astar(m.x,m.z,m.tx,m.tz,(x,z)=>lightZone(x,z,0))}
  if(!m.path){m.st='look';m.t=0;m.lookT=2;m.tx=undefined;return}
  while(m.path.length&&Math.hypot(m.path[0].x-m.x,m.path[0].z-m.z)<.4)m.path.shift();const px=m.path.length?m.path[0].x:m.tx,pz=m.path.length?m.path[0].z:m.tz;
  const sp=m.st==='hunt'?3.3:1.1,dx=px-m.x,dz=pz-m.z,d=Math.hypot(dx,dz);m.a=m.st==='hunt'?4:2;
  if(d>.02){const s=Math.min(d,sp*dt),nx=m.x+dx/d*s,nz=m.z+dz/d*s;if(lightZone(nx,nz,0)){m.path=null;m.st='look';m.t=0;m.lookT=2;m.tx=undefined;return}m.x=nx;m.z=nz;m.ry=angLerp(m.ry,Math.atan2(dx,dz),dt*5)}
  if(Math.hypot(m.tx-m.x,m.tz-m.z)<.6){m.lookT=m.st==='hunt'?3.5:rand(2,4);m.st='look';m.t=0;m.tx=undefined}}

// ---------------------------------------------------------------- the basement: the shredder, and the hunched thing in the corner
// Anyone who stands around down there without handling a box gets noticed. It crawls over slowly, takes hold and
// drags them to the shredder. Mashing E breaks its grip; getting back to work before it arrives sends it back.
const inBase=p=>p.x>60;
const baseLimit=()=>25/Math.sqrt(diffEv()); // seconds of idling: 25 on Normal, about 34 on Easy and 20 on Hard
// the cage fence runs along x = 79 with its gate at z = 0
function baseStep(m,tx,tz,sp,dt){let wx=tx,wz=tz;const inside=m.x>79,want=tx>79;
  if(inside!==want){wx=Math.abs(m.z)>.5?(inside?79.7:78.3):(want?79.9:78.1);wz=0}
  const dx=wx-m.x,dz=wz-m.z,d=Math.hypot(dx,dz);if(d>.02){const s=Math.min(d,sp*dt);m.x+=dx/d*s;m.z+=dz/d*s;m.ry=angLerp(m.ry,Math.atan2(dx,dz),dt*5)}
  return Math.hypot(tx-m.x,tz-m.z)}
function hunchUpdate(m,dt){const lim=baseLimit();m.cd-=dt;m.t+=dt;
  for(const p of alivePlayers()){if(!inBase(p)){p.baseIdle=0;p.baseWarn=false;continue}
    const busy=p.carry>=0&&p.spd>.8;p.baseIdle=busy?Math.max(0,(p.baseIdle||0)-dt*2):(p.baseIdle||0)+dt;
    if(!p.baseWarn&&p.baseIdle>lim*.6){p.baseWarn=true;emit({e:'hunchWarn',p:p.id,x:m.x,z:m.z})}}
  const tg=S.players[m.tg];
  if(m.st==='sit'){m.a=0;m.ry=angLerp(m.ry,-2.4,dt*2);if(m.cd>0)return;
    let best=null;for(const p of alivePlayers())if(inBase(p)&&p.baseIdle>=lim&&(!best||p.baseIdle>best.baseIdle))best=p;
    if(best){m.st='reach';m.tg=best.id;emit({e:'hunchGo',x:m.x,z:m.z})}return}
  if(m.st==='back'){m.a=2;m.tg='';if(baseStep(m,HUNCH.x,HUNCH.z,1.3,dt)<.1){m.st='sit';m.x=HUNCH.x;m.z=HUNCH.z}return}
  if(m.st==='reach'){if(!tg||tg.dead||!inBase(tg)||tg.baseIdle<lim*.5){m.st='back';return}
    m.a=2;if(baseStep(m,tg.x,tg.z,.75,dt)<1.0){m.st='drag';m.t=0;tg.strug=0;emit({e:'grab',p:tg.id,id:m.id})}return}
  if(m.st==='drag'){if(!tg||tg.dead){m.st='back';return}
    if((tg.strug||0)>=STRUGGLE_N){damage(tg,20);tg.baseIdle=0;tg.baseWarn=false;m.st='back';m.cd=12;emit({e:'freed',p:tg.id,x:m.x,z:m.z});return}
    m.a=5;if(m.t<1.2)return; // it takes its time getting a grip
    if(baseStep(m,SHRED.x,SHRED.z+1.65,.9,dt)<.15){m.ry=Math.PI;emit({e:'scare',p:tg.id,ty:14,id:m.id});emit({e:'shred',x:SHRED.x,z:SHRED.z});damage(tg,999);m.st='back';m.cd=8}}}
function shredBox(p){const b=S.boxes.find(x=>x.id===p.carry&&x.st!==4);if(!b||!nearPos(p,SHRED.x,SHRED.z,2.4))return;
  b.st=4;p.carry=p.stack.length?p.stack.pop():-1;p.baseIdle=0;p.baseWarn=false;S.bver++;emit({e:'shred',x:SHRED.x,z:SHRED.z});
  if(b.m){pay(5);emit({e:'msg',m:'Whatever that was, it isn\'t anymore.',p:p.id})}
  else if(b.ret){S.shelved++;pay(5);if(S.shelved===S.quota)emit({e:'quota'})}
  else{S.lost++;emit({e:'msg',m:'That was good stock. It\'s confetti now.',p:p.id})}}
MON_UPD[13]=blindUpdate;MON_UPD[14]=hunchUpdate;

// ---------------------------------------------------------------- the saved run
// Kept in the browser of whoever runs the world, rewritten after every night the crew survives (and after
// every purchase in the shop). Loading it puts the crew back in the shop before the next night. When the run
// ends (the crew dies, or misses quota) the save goes with it. A new run leaves an
// older save alone until it has a night of its own to save over it.
const SAVE_KEY='sitd-run';
function saveRun(){if(!S||S.over)return;const pl={};for(const p of Object.values(S.players))pl[p.name]={inv:p.inv,up:p.up};
  const sv={v:1,night:S.night,diff:S.diff,total:S.total,score:S.score,cash:S.cash,adds:S.adds,fixed:S.fixed,aidBonus:S.aidBonus||0,sel:S.conv?S.conv.sel:0,pl,
    boxes:S.boxes.filter(b=>b.st===3).map(b=>({x:b.x,y:b.y,z:b.z,ry:b.ry,k:b.k,f:b.f,v:b.v,s:b.s,m:b.m,roam:b.roam,ret:b.ret,pri:b.pri})),crew:Object.keys(S.players).length,at:Date.now()};
  S.saved=true;try{localStorage.setItem(SAVE_KEY,JSON.stringify(sv))}catch(e){}}
function loadSave(){try{const sv=JSON.parse(localStorage.getItem(SAVE_KEY));return sv&&sv.v===1&&sv.night>=1?sv:null}catch(e){return null}}
function dropSave(){try{localStorage.removeItem(SAVE_KEY)}catch(e){}}
// players get their own gear back by name; anyone new to the crew picks up gear nobody claimed, or starts empty
function restoreRun(sv){Object.assign(S,{night:sv.night,diff:DIFFS[sv.diff]?sv.diff:1,total:sv.total|0,score:sv.score||0,cash:sv.cash||0,adds:(sv.adds||[]).filter(k=>ADDS[k]),fixed:sv.fixed||[],aidBonus:sv.aidBonus|0,
    conv:{sel:sv.sel|0,next:12,jam:false},phase:'shop',shopT:150,votes:[],saved:true});
  const left=Object.assign({},sv.pl||{}),ps=Object.values(S.players),give=(p,g)=>{p.inv=Object.assign({},g.inv||{});p.up=Object.assign({},g.up||{})};
  for(const p of ps)if(left[p.name]){give(p,left[p.name]);delete left[p.name];p.got=1}
  const rest=Object.values(left);for(const p of ps)if(!p.got&&rest.length)give(p,rest.shift());
  for(const p of ps){delete p.got;Object.assign(p,{hp:100,dead:false,carry:-1,stack:[],can:false})}
  S.boxes=(sv.boxes||[]).map(b=>Object.assign({id:boxSeq++,st:3,h:'',s:-1,tw:rand(2,4),near:0,nearMax:rand(1.4,2.8)},b,{f:!!b.f,m:!!b.m}));
  markSlots();
  S.bver++}
