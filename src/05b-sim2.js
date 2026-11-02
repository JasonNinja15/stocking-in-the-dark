// ===================================================================== simulation: shop, additions, later-night monsters, items
// Host only, like 05-sim. Every addition adds boxes to the quota and minutes to the shift (the shift starts
// earlier: 11:15 PM instead of midnight, and so on).
const ADDS={
  cold:{name:'Cold Storage',price:250,q:6,time:45,desc:'A freezer room. Some trucks bring frozen crates that must reach its shelves within a minute of leaving the trailer, or they spoil. Frost figures stand inside. They move only while the door is shut and your light is off them.'},
  conv:{name:'Sorting Conveyor',price:300,q:8,time:45,desc:'Parcels ride a belt to three bins. Set the lever to the colour of the next parcel. Clear jams with the red button by the bins, quickly: hands come out of the bins for anyone who lingers. Kick any parcel that twitches.'},
  fork:{name:'Repaired Forklift',price:350,q:8,time:45,desc:'Some trucks carry four-box pallets that only the forklift can lift onto the top shelves. Its engine draws the stalker and the shrink-wrap. Sometimes a passenger rides the forks. Keep your light on it.'},
  base:{name:'Basement Returns',price:400,q:6,time:60,desc:'Ten damaged returns wait in a cage downstairs, reached by the freight elevator. Sometimes the elevator stops halfway and something walks on its roof. Keep your light on the hatch until it moves again.'},
  gen:{name:'Generator Room',price:300,q:0,time:40,desc:'Lamps stop failing at random while the generator has fuel. Carry jerry cans from the rack to keep it running, or every light goes out. Moths come for the lamps. Lure them off with your flashlight.'},
  bayc:{name:'Bay C',price:500,q:10,time:60,desc:'A third dock for refrigerated trailers. Their sleepers are colder: they creep faster, but light slows them down when they charge.'}};
const SHOP={
  fl2:{name:'Better flashlight',price:150,once:true,desc:'Brighter, wider beam that monsters notice from farther away. The battery lasts twice as long.'},
  batt:{name:'Spare batteries',price:20,give:2,key:1,desc:'Two batteries. Swap one in for a full charge anywhere.'},
  flare:{name:'Flares',price:25,give:2,key:2,desc:'Two road flares. Drop one to light the floor for 35 seconds. The stalker and the sleeper won\'t cross it, the crawler won\'t hang over it, and moths circle it instead of the lamps.'},
  cutter:{name:'Box cutter',price:60,once:true,key:3,desc:'Cut into a box you\'re looking at. Kills a mimic for good. Cutting a real box ruins it.'},
  strobe:{name:'Strobe',price:70,give:3,key:4,desc:'Three blinding flashes. Stops a charging sleeper, scatters the crawler, drives off mimics and moths, stuns the driver.'},
  scanner:{name:'Thermal scanner',price:120,once:true,key:5,desc:'Hold 5 to see warm bodies through walls nearby: sleepers, crawlers, mimics, the passenger, and your crew. The dead and the cold don\'t show, so a "crewmate" that stays dark isn\'t one.'},
  horn:{name:'Air horn',price:40,give:3,key:6,desc:'Three blasts. The shrink-wrap goes to the sound, and the driver is stunned.'},
  drink:{name:'Energy drinks',price:15,give:2,key:7,desc:'Two cans. Twenty seconds of sprinting without getting tired.'},
  remote:{name:'Bay door remote',price:90,give:1,key:8,desc:'Slams the nearest bay door shut from anywhere. A docked truck leaves at once and whatever of it is out in the warehouse is shut out for good. Won\'t fire while anyone is in that trailer.'},
  bulb:{name:'Lamp bulb',price:50,give:1,key:9,desc:'Stand under a dead light fixture and press 9 to bring it back for the rest of the run. Three fixtures at most.'},
  hand:{name:'Hand truck',price:110,once:true,desc:'Stack up to three boxes and carry them together. Slower, and loud enough for the shrink-wrap to hear.'},
  red:{name:'Red headlamp',price:80,once:true,key:'H',desc:'A dim red light on your head (H). Monsters don\'t notice it, so it doesn\'t count as light: not for scaring them off, not for setting them off.'},
  aid:{name:'First-aid refill',price:30,desc:'One more use of the first-aid cabinet next night (two at most).'}};
const PA_SPOTS=[{n:'by the office door',x:-22.4,z:12.2},{n:'at the west end of aisle two',x:-28.4,z:1.5},{n:'behind the east racks',x:28.6,z:2.5},
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
  S.parcels=[];S.pallets=[];S.flares=[];S.mouths=[];S.cold={door:0,open:false,t:0};S.conv={sel:S.conv?S.conv.sel:0,next:12,jam:false};
  S.elev={lvl:0,st:'idle',t:0,gate:1,stall:false,stallDone:false,hl:0,ht:0,pass:[],step:0};S.gen={fuel:100,out:false};S.yard=null;S.paN=0;
  S.fork={x:FORK_HOME.x,z:FORK_HOME.z,ry:FORK_HOME.ry,lift:0,drv:'',pal:-1,pass:null};
  Object.assign(HOST,{nextPA:rand(70,120),nextMoth:rand(30,50),palDue:owned('fork')?3:0,mgr:false,noise:[]});
  for(const p of Object.values(S.players))Object.assign(p,{can:false,stack:[],wu:0,idleT:0,wuCD:0,binT:0,spd:0,px:undefined});
  // a few of the empty lower slots are mouths tonight
  if(S.night>=5){const c=SLOTS.filter(s=>!s.old&&!s.add&&s.y<2);for(let i=0;i<2&&c.length;i++)S.mouths.push(c.splice(randi(0,c.length-1),1)[0].id)}
  if(owned('base'))for(let i=0;i<10;i++)S.boxes.push({id:boxSeq++,st:3,x:rand(79.6,83.5),y:0,z:rand(-5,5),ry:rand(-.4,.4),k:randi(0,1),f:false,v:randi(0,3),h:'',s:-1,m:false,ret:true});
  if(owned('cold'))for(const [x,z] of[[21.8,-13.3],[28.2,-13.2],[21.8,-17.6]])S.mons.push({id:monSeq++,ty:6,x,z,y:0,hx:x,hz:z,ry:rand(-3,3),st:'still',a:0,cd:0});
  if(S.night>=4)S.mons.push({id:monSeq++,ty:5,x:SHRINK_HOME.x,z:SHRINK_HOME.z,y:0,ry:-2.4,st:'home',a:0,heard:-99,cd:0,path:null,rep:0});
  S.bver++}

// ---------------------------------------------------------------- the shop (between nights)
function shopAct(pid,a){const p=S.players[pid];if(!p)return;
  if(a.a==='start'){if(S.phase!=='shop')return;if(NET.mode!=='solo'&&pid!==NET.myId)return;S.night++;startNight();return}
  if(a.a!=='buy'||S.phase!=='shop')return;const k=a.k;
  const no=m=>emit({e:'msg',m,p:pid});
  if(ADDS[k]){const it=ADDS[k];if(owned(k))return no('Already built.');if(S.cash<it.price)return no('Not enough money.');
    S.cash-=it.price;S.adds.push(k);applyAdds();emit({e:'bought',k,p:pid,n:p.name});return}
  const it=SHOP[k];if(!it)return;if(S.cash<it.price)return no('Not enough money.');
  if(it.once&&p.up[k])return no('You already have one.');
  if(k==='aid'&&(S.aidBonus||0)>=2)return no('The cabinet is already stocked for tomorrow.');
  if(k==='bulb'){const held=Object.values(S.players).reduce((a,q)=>a+(q.inv.bulb||0),0);if(S.fixed.length+held>=MAX_BULBS)return no('There are no more fixtures worth fixing.')}
  S.cash-=it.price;if(it.once)p.up[k]=true;else if(k==='aid')S.aidBonus=(S.aidBonus||0)+1;else p.inv[k]=(p.inv[k]||0)+it.give;
  emit({e:'bought',k,p:pid,n:p.name})}

// ---------------------------------------------------------------- every tick during a shift
function extrasUpdate(dt){
  if(HOST.noise)HOST.noise=HOST.noise.filter(n=>S.t-n.t<.6);
  for(const p of alivePlayers()){
    // speed from position changes (clients' positions arrive in steps, so smooth it)
    if(p.px!==undefined){const v=Math.hypot(p.x-p.px,p.z-p.pz)/Math.max(dt,1e-3);p.spd=damp(p.spd||0,Math.min(v,9),5,dt)}p.px=p.x;p.pz=p.z;
    p.nT=(p.nT||0)-dt;if(p.nT<=0){p.nT=.4;if(p.spd>4.3)noise(p.x,p.z,9);else if(p.spd>.8&&p.stack&&p.stack.length)noise(p.x,p.z,6)}
    p.wuCD=Math.max(0,(p.wuCD||0)-dt);p.tpT=Math.max(0,(p.tpT||0)-dt)}
  S.flares=S.flares.filter(f=>(f.t-=dt)>0);
  coldUpdate(dt);convUpdate(dt);elevUpdate(dt);genUpdate(dt);forkUpdate(dt);paUpdate(dt);yardUpdate(dt);
  if(!HOST.mgr&&S.night>=3&&S.t>=-S.extra+50){HOST.mgr=true;S.mons.push({id:monSeq++,ty:4,x:OFFICE_DOOR.x,z:OFFICE_DOOR.z,y:0,ry:Math.PI,st:'walk',a:2,t:0,path:null,rep:0})}
  if(owned('gen')){HOST.nextMoth-=dt;if(HOST.nextMoth<=0){HOST.nextMoth=rand(40,70);spawnMoth()}}}

// ---------------------------------------------------------------- cold storage: door, thawing, frost figures
function coldUpdate(dt){if(!owned('cold'))return;const c=S.cold;
  // a box left in the doorway props it open
  const propped=S.boxes.some(b=>b.st===3&&b.x>COLD.dx0-.3&&b.x<COLD.dx1+.3&&Math.abs(b.z-COLD.z1)<.7);
  if(c.open){c.t-=dt;if(c.t<=0&&!propped){c.open=false;emit({e:'coldDoor',o:0})}}
  c.door=clamp(c.door+(c.open?dt*2.2:-dt*3),0,1);
  for(const b of S.boxes){if(!b.fz||(b.st!==1&&b.st!==3))continue;b.th-=dt;
    if(b.th<=0){const h=b.st===1?S.players[b.h]:null;if(h){if(h.carry===b.id)h.carry=h.stack.length?h.stack.pop():-1;else h.stack=h.stack.filter(x=>x!==b.id)}
      b.st=4;S.lost++;S.bver++;emit({e:'msg',m:'A frozen crate thawed and spoiled.'})}}}
function frostUpdate(m,dt){m.cd-=dt;const shut=S.cold.door<.3;
  if(m.st==='back'){m.a=2;const dx=m.hx-m.x,dz=m.hz-m.z,d=Math.hypot(dx,dz);if(d<.1||m.cd<=0&&!shut){m.st='still'}else{const s=Math.min(d,1.2*dt);m.x+=dx/d*s;m.z+=dz/d*s;m.ry=Math.atan2(dx,dz)}return}
  // they can only move while the door is shut, and never while light is on them
  if(!shut||litBy(m.x,1.4,m.z)){m.a=shut?1:0;return}
  const tgt=nearestPlayer(m.x,m.z,12,inCold);if(!tgt){m.a=0;return}
  const dx=tgt.x-m.x,dz=tgt.z-m.z,d=Math.hypot(dx,dz);
  // one grab and they all shrink back to their corners for a while
  if(d<.95&&m.cd<=0){emit({e:'scare',p:tgt.id,ty:6,id:m.id});damage(tgt,30);for(const o of S.mons)if(o.ty===6){o.st='back';o.cd=8}return}
  const s=Math.min(d,1.5*dt);m.x=clamp(m.x+dx/d*s,COLD.x0+.4,COLD.x1-.4);m.z=clamp(m.z+dz/d*s,COLD.z0+1.3,COLD.z1-.4);m.ry=Math.atan2(dx,dz);m.a=2}

// ---------------------------------------------------------------- sorting conveyor
function convUpdate(dt){if(!owned('conv'))return;const c=S.conv;
  c.next-=dt;if(c.next<=0&&S.parcels.length<6&&!c.jam){c.next=rand(13,19);
    S.parcels.push({id:parSeq++,x:CONV.x0+.4,c:randi(0,2),m:S.night>=2&&Math.random()<.14,jam:Math.random()<.13,tw:rand(1,3)});emit({e:'parcel'})}
  const ps=S.parcels.sort((a,b)=>b.x-a.x);let front=CONV.x1-.25;
  for(const p of ps){if(!c.jam)p.x=Math.min(p.x+.75*dt,front);front=p.x-.55;
    const np=nearestPlayer(p.x,CONV.z,3.5,inWH);if(p.m&&np){p.tw-=dt;if(p.tw<=0){p.tw=rand(1.6,3.5);emit({e:'ptw',id:p.id})}}}
  const end=ps[0];if(end&&end.x>=CONV.x1-.26){
    if(end.jam&&!c.jam){c.jam=true;emit({e:'jam'})}
    else if(!c.jam){S.parcels=S.parcels.filter(p=>p!==end);
      if(end.m){const x=CONV.x1,z=CONV.z;emit({e:'burst',x,y:1,z});const v=nearestPlayer(x,z,5,inWH);
        S.mons.push({id:monSeq++,ty:0,x,y:CONV.y,z,ry:0,st:'lunge',t:0,k:0,v:end.c,f:false,a:1,bay:-1});if(v){emit({e:'scare',p:v.id,ty:0});damage(v,25)}}
      else{const ok=c.sel===end.c;if(ok){S.shelved++;pay(10);if(S.shelved===S.quota)emit({e:'quota'})}else S.lost++;emit({e:'sorted',ok,b:c.sel})}}}
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
    // a light kept on the roof hatch makes it lose interest
    if(inside.some(p=>litByP(p,hx,2.6,hz)))e.hl+=dt;
    if(e.hl>=3.5){e.st='ride';e.stallDone=true;emit({e:'unstall'});return}
    if(e.ht>=14){e.stallDone=true;e.st='ride';if(inside.length){const v=pick(inside);emit({e:'scare',p:v.id,ty:10});damage(v,45)}}}}
function elevStart(lvl){const e=S.elev;if(e.st!=='idle')return;const C=lvl===0?CAR_UP:CAR_DN;
  e.lvl=lvl;e.st='ride';e.t=0;e.stallDone=false;e.pass=alivePlayers().filter(p=>inCar(p,C)).map(p=>p.id);
  e.stall=S.night>=2&&e.pass.length>0&&Math.random()<.3;emit({e:'elevGo',lvl})}
function elevArrive(){const e=S.elev,from=e.lvl===0?CAR_UP:CAR_DN,dir=e.lvl===0?1:-1;
  for(const p of alivePlayers())if(inCar(p,from)){p.x+=CAR_OFF.x*dir;p.z+=CAR_OFF.z*dir;p.tpT=.8;emit({e:'tp',p:p.id,x:r2(p.x),z:r2(p.z)})}
  for(const b of S.boxes)if(b.st===3&&inCar(b,from)){b.x+=CAR_OFF.x*dir;b.z+=CAR_OFF.z*dir;S.bver++}
  e.lvl=1-e.lvl;e.st='idle';e.t=0;emit({e:'ding',lvl:e.lvl})}
const carGateOpen=lvl=>owned('base')&&S.elev&&S.elev.st==='idle'&&S.elev.lvl===lvl&&S.elev.gate>.8;

// ---------------------------------------------------------------- generator + moths
function genUpdate(dt){if(!owned('gen')||S.ot)return;const g=S.gen;
  g.fuel=Math.max(0,g.fuel-dt*100/150);
  if(g.fuel<=0&&!g.out){g.out=true;S.lamps=S.lamps.map(()=>0);emit({e:'genOut'})}}
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
function palletInTruck(i){return S.pallets.some(x=>x.st===0&&x.bay===i)}

// ---------------------------------------------------------------- the loudspeaker: priority parcels, and the voice that isn't the supervisor
function paUpdate(dt){if(S.night<2||S.paN>=2||S.ot)return;HOST.nextPA-=dt;if(HOST.nextPA>0)return;HOST.nextPA=rand(80,130);
  const spots=PA_SPOTS.filter(s=>!lightZone(s.x,s.z,1)&&alivePlayers().every(p=>Math.hypot(p.x-s.x,p.z-s.z)>9));if(!spots.length)return;
  const s=pick(spots),fake=S.night>=6&&Math.random()<.5;S.paN++;
  if(fake)spawnStalkerAt(s.x,s.z);
  else{S.boxes.push({id:boxSeq++,st:3,x:s.x,y:0,z:s.z,ry:rand(-.4,.4),k:1,f:false,v:0,h:'',s:-1,m:false,pri:true});S.bver++}
  emit({e:'pa2',fake,n:s.n})}
function spawnStalkerAt(x,z){const m={id:monSeq++,ty:2,x,y:0,z,ry:0,st:'ambush',a:0,litT:0,life:80,path:null,rep:0,lampT:0};S.mons.push(m)}

// ---------------------------------------------------------------- the thing in the yard
const yardOn=()=>S.night>=7||S.ot;
const YARD_D=[34,26,18,10];
function yardUpdate(dt){const y=S.yard;if(!y)return;const tr=S.trucks[y.bay];if(!(tr.st===0&&tr.stuck>0)){S.yard=null;return}
  const gx=BAYS[y.bay].x,gz=WH.z0-YARD_D[y.stage],gy=8;
  for(const p of alivePlayers()){if(!inWH(p)||inTrailer(p)>=0)continue;const dx=gx-p.x,dy=gy-1.6,dz=gz-p.z,d=Math.hypot(dx,dy,dz);
    const cp=Math.cos(p.pitch),fx=-Math.sin(p.yaw)*cp,fy=Math.sin(p.pitch),fz=-Math.cos(p.yaw)*cp;
    if((dx*fx+dy*fy+dz*fz)/d<.93||segBlocked(p.x,p.z,gx,WH.z0-.5))continue;
    y.look+=dt;if(y.look<1.2)return;y.look=0;
    if(y.stage<3){y.stage++;emit({e:'boom',x:gx,z:WH.z0-YARD_D[y.stage]})}
    else{emit({e:'scare',p:p.id,ty:9});damage(p,80);tr.stuck=0;tr.door=0;emit({e:'slam',x:gx,z:WH.z0});S.yard=null}
    return}}

// ---------------------------------------------------------------- the night manager
function managerUpdate(m,dt){m.t+=dt;
  const walkTo=(tx,tz,sp)=>{m.rep-=dt;if(m.rep<=0||!m.path){m.rep=.6;m.path=astar(m.x,m.z,tx,tz)}let px=tx,pz=tz;
    if(m.path){while(m.path.length&&Math.hypot(m.path[0].x-m.x,m.path[0].z-m.z)<.4)m.path.shift();if(m.path.length){px=m.path[0].x;pz=m.path[0].z}}
    const dx=px-m.x,dz=pz-m.z,d=Math.hypot(dx,dz);if(d>.02){const s=Math.min(d,sp*dt);m.x+=dx/d*s;m.z+=dz/d*s;m.ry=angLerp(m.ry,Math.atan2(dx,dz),dt*6)}return Math.hypot(tx-m.x,tz-m.z)};
  if(m.st==='leave'){m.a=2;if(walkTo(OFFICE_DOOR.x,OFFICE_DOOR.z,1.4)<.5){m.dead=true;emit({e:'fade',id:m.id})}return}
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
  // it hears running, kicking, forklifts, stacked hand trucks and air horns. Walking is silent.
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
function spawnDriver(i){if(S.night<5||S.mons.some(m=>m.ty===7)||Math.random()>.22)return;
  S.mons.push({id:monSeq++,ty:7,bay:i,x:BAYS[i].x+2.4,z:WH.z0+1.2,y:0,ry:0,st:'wander',a:2,life:75,stun:0,path:null,rep:0,k:randi(0,9)})}
function driverUpdate(m,dt){m.life-=dt;m.stun-=dt;
  const walkTo=(tx,tz,sp)=>{m.rep-=dt;if(m.rep<=0||!m.path){m.rep=.5;m.path=astar(m.x,m.z,tx,tz)}let px=tx,pz=tz;
    if(m.path){while(m.path.length&&Math.hypot(m.path[0].x-m.x,m.path[0].z-m.z)<.4)m.path.shift();if(m.path.length){px=m.path[0].x;pz=m.path[0].z}}
    const dx=px-m.x,dz=pz-m.z,d=Math.hypot(dx,dz);if(d>.02){const s=Math.min(d,sp*dt);m.x+=dx/d*s;m.z+=dz/d*s;m.ry=angLerp(m.ry,Math.atan2(dx,dz),dt*6)}return Math.hypot(tx-m.x,tz-m.z)};
  if(m.stun>0){m.a=1;return}
  if(m.st==='leave'||m.life<=0){m.st='leave';m.a=2;if(walkTo(BAYS[m.bay].x,WH.z0+.6,2)<.5){m.dead=true;emit({e:'fade',id:m.id})}return}
  const tgt=nearestPlayer(m.x,m.z,8,p=>inWH(p)&&inTrailer(p)<0&&!segBlocked(m.x,m.z,p.x,p.z));
  if(tgt){if(Math.hypot(tgt.x-m.x,tgt.z-m.z)<1.1){emit({e:'scare',p:tgt.id,ty:7,id:m.id});damage(tgt,70);m.st='leave';return}m.a=2;walkTo(tgt.x,tgt.z,2.7);return}
  m.a=2;if(m.tx===undefined||walkTo(m.tx,m.tz,2)<.5){for(let k=0;k<30;k++){const i=randi(0,GRID.nx-1),j=randi(3,GRID.nz-1);if(GRID.blk[j*GRID.nx+i])continue;m.tx=GRID.x0+i+.5;m.tz=GRID.z0+j+.5;m.path=null;break}}}

// ---------------------------------------------------------------- items
function useItem(p,a){const k=a.a==='use'?a.k:null;if(!k)return;const inv=p.inv,no=m=>toP(p,m);
  const take=()=>{if(!(inv[k]>0))return false;inv[k]--;return true};
  const fx=-Math.sin(p.yaw),fz=-Math.cos(p.yaw);
  switch(k){
  case 'batt':case 'drink':if(take())emit({e:'item',p:p.id,k});break;
  case 'flare':if(take()){const f={id:flSeq++,x:p.x+fx*.7,z:p.z+fz*.7,t:35};if(insideAny(f.x,f.z,.1)){f.x=p.x;f.z=p.z}S.flares.push(f);emit({e:'flare',x:f.x,z:f.z})}break;
  case 'cutter':{if(!p.up.cutter)return;if(a.pc!==undefined){kickParcel(p,a.pc,true);return}
    const b=S.boxes.find(x=>x.id===a.b&&(x.st===0||x.st===3));if(!b)return;const w=boxWorld(b);if(Math.hypot(p.x-w.x,p.z-w.z)>3.2)return;
    if(b.m){freeMimicBox(b);emit({e:'squeal',x:w.x,y:w.y+.3,z:w.z});pay(5);no('Cut it open. Whatever it was, it\'s dead.')}
    else{const bay=b.st===0?b.bay:-1;b.st=4;S.lost++;S.bver++;if(bay>=0)settleTruck(bay);emit({e:'cut',x:w.x,y:w.y,z:w.z});no('You cut into real freight. That one\'s ruined.')}break}
  case 'strobe':{if(!take())return;emit({e:'strobe',p:p.id,x:p.x,z:p.z});
    const inCone=(x,z,r)=>{const dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz);return d<r&&(d<1.5||(dx*fx+dz*fz)/d>.6)};
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
    inv.bulb--;S.fixed.push(fi);if(!S.ot&&!(S.gen&&S.gen.out))S.lamps[fi]=1;emit({e:'bulbOn',i:fi});break}
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
  case 'can':{if(!owned('gen')||p.carry>=0||p.can||!nearPos(p,FUELR.x,FUELR.z,2.6))return true;p.can=true;emit({e:'canUp',p:pid});return true}
  case 'fuel':{if(!owned('gen')||!p.can||!nearPos(p,GEN.x,GEN.z,2.8))return true;p.can=false;const was=S.gen.out;S.gen.fuel=Math.min(100,S.gen.fuel+50);S.gen.out=false;if(was&&!S.ot)powerOn();emit({e:'refuel',x:GEN.x,z:GEN.z,on:was});return true}
  case 'fork':{const f=S.fork;if(f.drv===pid){f.drv='';const sx=Math.cos(f.ry),sz=-Math.sin(f.ry);let x=f.x+sx*1.2,z=f.z+sz*1.2;if(insideAny(x,z,.3)){x=f.x-sx*1.2;z=f.z-sz*1.2}
      p.x=x;p.z=z;p.tpT=.6;emit({e:'tp',p:pid,x:r2(x),z:r2(z)});emit({e:'forkOut',p:pid});return true}
    if(!owned('fork')||f.drv||p.carry>=0||p.can||Math.hypot(p.x-f.x,p.z-f.z)>2.6)return true;
    f.drv=pid;if(S.night>=2&&!f.pass&&Math.random()<.25)f.pass={lit:0,dark:0};emit({e:'forkIn',p:pid});return true}
  case 'fpick':{const f=S.fork;if(f.drv!==pid||f.pal>=0)return true;const t=forkTip();const pal=S.pallets.find(x=>(x.st===0||x.st===3)&&Math.hypot(palWorld(x).x-t.x,palWorld(x).z-t.z)<1.3);
    if(!pal)return true;pal.st=1;f.pal=pal.id;f.lift=2.62;emit({e:'pick',x:t.x,y:.5,z:t.z});return true}
  case 'fplace':{const f=S.fork,pal=S.pallets.find(x=>x.id===f.pal),s=SLOTS[a.s];if(f.drv!==pid||!pal||!s)return true;const t=forkTip();
    if(s.old||s.box!==-1||s.cold||!slotOn(s)||s.y<2||Math.hypot(t.x-s.x,t.z-s.z)>2.6)return true;
    pal.st=2;pal.x=s.x;pal.z=s.z;pal.ry=0;pal.s=s.id;s.box=-(1000+pal.id);f.pal=-1;f.lift=.1;S.shelved+=4;pay(40);emit({e:'place',x:s.x,y:s.y,z:s.z});if(S.shelved>=S.quota&&S.shelved-4<S.quota)emit({e:'quota'});return true}
  case 'fdrop':{const f=S.fork,pal=S.pallets.find(x=>x.id===f.pal);if(f.drv!==pid||!pal)return true;const t=forkTip();pal.st=3;pal.x=t.x;pal.z=t.z;f.pal=-1;f.lift=.1;emit({e:'place',x:t.x,y:0,z:t.z});return true}
  }
  return false}
function palWorld(pal){if(pal.st===0){const tr=S.trucks[pal.bay];return{x:BAYS[pal.bay].x+pal.lx,z:tr.z+pal.lz}}return{x:pal.x,z:pal.z}}
