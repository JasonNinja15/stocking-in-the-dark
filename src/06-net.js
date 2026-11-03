// ===================================================================== networking
// Browser-to-browser over WebRTC (PeerJS). The host runs the simulation; clients send their own
// position plus action requests, and get snapshots back 20 times a second.
const NET={mode:'solo',host:false,peer:null,conns:new Map(),fast:new Map(),fastConn:null,sq:0,lastSq:-1,hostConn:null,myId:'me',code:'',lobby:[],started:false,snapT:0,meT:0,boxT:0,sentBver:-1,closing:false};
const PFX='stocking-in-the-dark-d13-';
const CODE_CHARS='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function genCode(){let s='';for(let i=0;i<5;i++)s+=CODE_CHARS[randi(0,CODE_CHARS.length-1)];return s}
function errText(e){const t=e&&e.type;if(t==='peer-unavailable')return'No crew with that code.';if(t==='network'||t==='server-error'||t==='socket-error')return'Could not reach the matchmaking server.';if(t==='browser-incompatible')return'This browser does not support multiplayer.';return'Connection failed'+(t?' ('+t+')':'')+'.'}
function myName(){return(SET.name||'').trim().slice(0,14)||'Worker '+randi(10,99)}
function freeColor(){const used=new Set(NET.lobby.map(p=>p.col));return VEST.find(c=>!used.has(c))||VEST[0]}

function netHost(){return new Promise((res,rej)=>{if(!window.Peer)return rej('The multiplayer library did not load. Are you offline?');
  const tryCode=(left)=>{const code=genCode(),p=new Peer(PFX+code,{debug:0});let done=false;
    const to=setTimeout(()=>{if(!done){done=true;try{p.destroy()}catch(e){}rej('Could not reach the matchmaking server.')}},15000);
    p.on('open',id=>{if(done)return;done=true;clearTimeout(to);NET.peer=p;NET.mode='host';NET.host=true;NET.code=code;NET.myId=id;NET.started=false;
      NET.lobby=[{id,name:myName(),col:VEST[0]}];res(code)});
    p.on('connection',c=>hostAccept(c));
    p.on('error',e=>{if(done){if(e&&e.type!=='peer-unavailable')console.warn('peer',e);return}if(e&&e.type==='unavailable-id'&&left>0){done=true;clearTimeout(to);try{p.destroy()}catch(x){}tryCode(left-1);return}done=true;clearTimeout(to);try{p.destroy()}catch(x){}rej(errText(e))});
    p.on('disconnected',()=>{if(!NET.closing)try{p.reconnect()}catch(e){}})};
  tryCode(3)})}
// Each crewmate opens two connections: the main one (reliable, in order) for joining, actions, events and box lists,
// and a "fast" one (unreliable) for the 20-a-second snapshots and their own position. On a reliable channel one lost
// packet holds up every snapshot behind it until it's resent, which shows up as stutter; on the fast one a lost
// snapshot is simply replaced by the next.
function hostAccept(c){
  if(c.label==='fast'){c.on('open',()=>NET.fast.set(c.peer,c));c.on('data',m=>{if(m&&m.t==='me')hostMsg(c,m)});const drop=()=>{if(NET.fast.get(c.peer)===c)NET.fast.delete(c.peer)};c.on('close',drop);c.on('error',drop);return}
  c.on('open',()=>{if(NET.conns.size>=MAX_CREW-1){try{c.send({t:'full'})}catch(e){}setTimeout(()=>c.close(),400);return}NET.conns.set(c.peer,c)});
  c.on('data',m=>hostMsg(c,m));
  const gone=()=>{if(!NET.conns.has(c.peer))return;NET.conns.delete(c.peer);NET.lobby=NET.lobby.filter(p=>p.id!==c.peer);
    if(S&&S.players[c.peer]){const p=S.players[c.peer];dropCarry(p);delete S.players[c.peer];emit({e:'msg',m:`${p.name} clocked out.`})}
    lobbyBroadcast()};
  c.on('close',gone);c.on('error',gone)}
function hostMsg(c,m){if(!m||!NET.conns.has(c.peer))return;
  if(m.t==='hi'){if(NET.lobby.some(p=>p.id===c.peer))return;const pl={id:c.peer,name:String(m.name||'Worker').slice(0,14),col:freeColor()};NET.lobby.push(pl);
    if(NET.started&&S){addPlayer(pl.id,pl.name,pl.col);const sp=spawnPoint(Object.keys(S.players).length-1);Object.assign(S.players[pl.id],sp);
      c.send({t:'start',id:pl.id});c.send({t:'b',b:boxSnap()});c.send({t:'tp',x:sp.x,z:sp.z});emit({e:'msg',m:`${pl.name} clocked in.`})}
    lobbyBroadcast();return}
  if(m.t==='me'&&S){const p=S.players[c.peer];if(p&&Array.isArray(m.p)){const [x,z,yaw,pitch,light,fx,fz,fry]=m.p;
    if(S.fork&&S.fork.drv===c.peer&&isFinite(fx)&&isFinite(fz)){S.fork.x=fx;S.fork.z=fz;S.fork.ry=+fry||0}
    if(isFinite(x)&&isFinite(z)&&!(p.tpT>0)){const up=x<-100;p.x=x>60?clamp(x,BASE.x0,BASE.x1):up?clamp(x,ROOF.x0,ROOF.x1):clamp(x,WH.x0,WH.x1);p.z=x>60?clamp(z,BASE.z0,BASE.z1):up?clamp(z,ROOF.z0,ROOF.z1):clamp(z,TZ_DOCK-TRAIL_LEN,WH.z1)}if(isFinite(yaw))p.yaw=yaw;if(isFinite(pitch))p.pitch=clamp(pitch,-1.5,1.5);p.light=!!light}return}
  if(m.t==='act'&&S){act(c.peer,m.a);return}}
function hostSend(m){for(const c of NET.conns.values())if(c.open)try{c.send(m)}catch(e){}}
// snapshots go on the fast connection where there is one
function hostSendFast(m){for(const [id,c] of NET.conns){const f=NET.fast.get(id),ch=f&&f.open?f:c;if(ch.open)try{ch.send(m)}catch(e){}}}
function lobbyBroadcast(){hostSend({t:'lobby',players:NET.lobby,started:NET.started,df:DIFFS[SET.diff]?SET.diff:1});if(!NET.started)renderLobby()}

function netJoin(code){return new Promise((res,rej)=>{if(!window.Peer)return rej('The multiplayer library did not load. Are you offline?');
  const p=new Peer({debug:0});NET.peer=p;let done=false;
  const fail=msg=>{if(done)return;done=true;clearTimeout(to);try{p.destroy()}catch(e){}NET.peer=null;rej(msg)};
  const to=setTimeout(()=>fail('Timed out. Check the code and try again.'),15000);
  p.on('open',id=>{NET.myId=id;const c=p.connect(PFX+code,{reliable:true,serialization:'json'});NET.hostConn=c;
    c.on('open',()=>{if(done)return;done=true;clearTimeout(to);NET.mode='client';NET.host=false;NET.code=code;c.send({t:'hi',name:myName()});res();
      const f=p.connect(PFX+code,{reliable:false,serialization:'json',label:'fast'});f.on('open',()=>{NET.fastConn=f});f.on('data',m=>clientMsg(m));f.on('close',()=>{if(NET.fastConn===f)NET.fastConn=null});f.on('error',()=>{})});
    c.on('data',m=>clientMsg(m));c.on('close',()=>hostLost());c.on('error',()=>{})});
  p.on('error',e=>{if(!done)fail(errText(e));else if(e&&e.type!=='peer-unavailable')console.warn('peer',e)});
  p.on('disconnected',()=>{if(!NET.closing)try{p.reconnect()}catch(e){}})})}
function clientMsg(m){if(!m)return;
  switch(m.t){
  case 'full':NET.closing=true;netClose();showMenu(`That crew is full (${MAX_CREW} workers max).`);break;
  case 'lobby':NET.lobby=m.players||[];NET.diff=m.df;if(!GAME.on)renderLobby();break;
  case 'start':clientStart();break;
  case 'tp':ME.x=m.x;ME.z=m.z;ME.ready=true;break;
  case 'b':if(S)applyBoxes(m.b);break;
  case 's':if(S&&!(m.sq<=NET.lastSq)){NET.lastSq=m.sq;applySnap(m)}break; // (the fast channel can deliver an old one late: skip it)
  case 'ev':for(const e of m.ev||[])EVQ.push(e);break;
  }}
// ---- public crews. There is no server of our own, so a public host also holds one of a few well-known "listing"
// peer ids, and answers anyone who connects to it with what its crew is up to (and its code). The Join Public screen
// connects to every listing id at once and shows whoever answers; joining is then the ordinary join by code.
const PUB_SLOTS=24,pubId=k=>PFX+'pub-'+k;
function pubInfo(){const on=NET.started&&S;return{t:'info',code:NET.code,name:(NET.lobby[0]&&NET.lobby[0].name)||myName(),n:on?Object.keys(S.players).length:NET.lobby.length,
  max:MAX_CREW,night:on?S.night:0,cash:on?Math.round(S.cash||0):0,ph:on?S.phase:'lobby',df:DIFFS[SET.diff]?SET.diff:1}}
function pubOpen(){if(NET.beacon||NET.mode!=='host'||!NET.pub||!window.Peer)return;const order=[...Array(PUB_SLOTS).keys()].sort(()=>Math.random()-.5);
  const tryK=i=>{if(i>=order.length||NET.mode!=='host'||!NET.pub)return;const b=new Peer(pubId(order[i]),{debug:0});let ok=false;
    b.on('open',()=>{ok=true;if(!NET.pub||NET.mode!=='host'||NET.beacon){try{b.destroy()}catch(e){}return}NET.beacon=b;if(!NET.started)renderLobby()});
    b.on('connection',c=>{c.on('open',()=>{try{c.send(pubInfo())}catch(e){}setTimeout(()=>{try{c.close()}catch(e){}},1500)})});
    b.on('error',e=>{if(!ok&&e&&e.type==='unavailable-id'){try{b.destroy()}catch(x){}tryK(i+1)}});
    b.on('disconnected',()=>{if(NET.beacon===b&&!NET.closing)try{b.reconnect()}catch(e){}})};
  tryK(0)}
function pubClose(){if(NET.beacon){try{NET.beacon.destroy()}catch(e){}NET.beacon=null}}
// knock on every listing id; onFound(info) for each crew that answers; resolves when the search is over
function pubScan(onFound){return new Promise((res,rej)=>{if(!window.Peer)return rej('The multiplayer library did not load. Are you offline?');
  const p=new Peer({debug:0});let done=false;const end=err=>{if(done)return;done=true;clearTimeout(to);try{p.destroy()}catch(e){}err?rej(err):res()};const to=setTimeout(()=>end(),6000);
  p.on('open',()=>{for(let k=0;k<PUB_SLOTS;k++){const c=p.connect(pubId(k),{reliable:true,serialization:'json'});c.on('data',m=>{if(m&&m.t==='info'&&/^[A-Z0-9]{5}$/.test(m.code))onFound(m);try{c.close()}catch(e){}});c.on('error',()=>{})}});
  p.on('error',e=>{if(e&&e.type!=='peer-unavailable')end(errText(e))})})}
function hostLost(){if(NET.closing||NET.mode!=='client')return;NET.closing=true;netClose();
  if(GAME.on){GAME.on=false;document.exitPointerLock&&document.exitPointerLock();showOver({why:'host',night:S?S.night:1,total:S?S.total+S.shelved:0,score:S?S.score:0})}else showMenu('The host closed the crew room.')}
function netClose(){NET.closing=true;pubClose();NET.pub=false;NET.fast.clear();NET.fastConn=null;NET.lastSq=-1;try{NET.peer&&NET.peer.destroy()}catch(e){}NET.peer=null;NET.conns.clear();NET.hostConn=null;NET.mode='solo';NET.host=false;NET.started=false;NET.lobby=[];setTimeout(()=>NET.closing=false,50)}

// ---- snapshots
const r2=v=>Math.round(v*100)/100,r3=v=>Math.round(v*1000)/1000;
function snap(){return{t:'s',tm:r2(S.t),n:S.night,ph:S.phase,ot:S.ot?1:0,it:r2(S.inter),q:S.quota,sh:S.shelved,lo:S.lost,sc:S.score,to:S.total,ai:S.aidLeft,la:S.lamps,bv:S.bver,ov:S.over,
  pl:Object.values(S.players).map(p=>[p.id,p.name,p.col,r2(p.x),r2(p.z),r3(p.yaw),r3(p.pitch),p.light?1:0,Math.ceil(p.hp),p.dead?1:0,p.carry,p.inv||{},p.up||{},p.stack||[],p.can?1:0,p.wu|0,Math.round(p.cash||0)]),
  tr:S.trucks.map(t=>[t.st,r2(t.z),r2(t.door),Math.round(t.t),t.warn?1:0,t.claw?1:0,t.left,t.n,t.reject?1:0,t.kg||0,t.extra||0,r2(t.stuck||0)]),
  mo:S.mons.map(m=>[m.id,m.ty,r2(m.x),r2(m.y||0),r2(m.z),r2(m.ry),m.a|0,m.k|0,m.v|0,m.f?1:0,m.tg||'']),
  // the additions' moving parts
  x:{cash:Math.round(S.cash||0),tv:S.tvotes||{},adds:S.adds,fixed:S.fixed,ab:S.aidBonus|0,ex:S.extra|0,shopT:Math.round(S.shopT||0),vo:S.votes||[],
    par:(S.parcels||[]).map(p=>[p.id,r2(p.x),p.c,p.m?1:0]),pal:(S.pallets||[]).filter(p=>p.st!==4).map(p=>[p.id,p.st,p.bay??-1,p.lx||0,p.lz||0,r2(p.x||0),r2(p.z||0),r2(p.ry||0),p.s??-1,r2(p.y||0),p.amr|0]),
    fl:(S.flares||[]).map(f=>[f.id,r2(f.x),r2(f.z),Math.round(f.t)]),cold:S.cold&&[r2(S.cold.door),S.cold.open?1:0],conv:S.conv&&[S.conv.sel,S.conv.jam?1:0],
    elev:S.elev&&[S.elev.lvl,S.elev.st,r2(S.elev.t),r2(S.elev.gate),r2(S.elev.hl||0),r2(S.elev.ht||0)],df:S.diff,gen:S.gen&&[Math.round(S.gen.fuel),S.gen.out?1:0],
    out:S.outage?1:0,fork:S.fork&&[r2(S.fork.x),r2(S.fork.z),r3(S.fork.ry),r2(S.fork.lift),S.fork.drv,S.fork.pal,S.fork.pass?1:0],yard:S.yard&&[S.yard.bay,S.yard.stage,S.yard.hit||'',r2(S.yard.ht||0)],am:(S.amr||[]).map(r=>[r.k,r2(r.x),r2(r.z),r3(r.ry),AMR_ST.indexOf(r.st),r.load,r.slot,r2(r.t)]),st:S.stash?1:0,ch:S.chill&&[S.chill.st==='cold'?1:0,Math.ceil(S.chill.t)],
    rg:S.rg&&[RG_ST.indexOf(S.rg.st),r2(S.rg.x),r2(S.rg.z),r3(S.rg.ry),r2(S.rg.k),r2(S.rg.hx),r2(S.rg.hz),S.rg.tg||'',r2(S.rg.t),S.rg.b|0]},
  sq:++NET.sq}}
function boxSnap(){return S.boxes.filter(b=>b.st!==4).map(b=>[b.id,b.st,r2(b.x),r2(b.y),r2(b.z),r2(b.ry),b.k,b.f?1:0,b.v,b.h||'',b.s,b.bay??-1,b.fz?1:0,Math.round(b.th||0),b.ret?1:0,b.pri?1:0,b.m?1:0,b.amr|0])}
function applyBoxes(arr){S.boxes=arr.map(a=>({id:a[0],st:a[1],x:a[2],y:a[3],z:a[4],ry:a[5],k:a[6],f:!!a[7],v:a[8],h:a[9],s:a[10],bay:a[11],fz:!!a[12],th:a[13],ret:!!a[14],pri:!!a[15],m:!!a[16],amr:a[17]|0}));
  markSlots()}
// which box sits in each shelf slot, and (Better Stocking) which one is stacked on top of it
function markSlots(){for(const s of SLOTS){s.box=-1;s.box2=-1}
  for(const b of S.boxes){if((b.st!==2&&b.st!==3)||!(b.s>=0)||!SLOTS[b.s])continue;const s=SLOTS[b.s];if(s.box===-1)s.box=b.id;else s.box2=b.id}
  for(const s of SLOTS)if(s.box2>=0){const a=S.boxes.find(b=>b.id===s.box),c=S.boxes.find(b=>b.id===s.box2);if(a&&c&&c.y<a.y){s.box=c.id;s.box2=a.id}}
  for(const p of S.pallets||[])if(p.st===2&&p.s>=0&&SLOTS[p.s])SLOTS[p.s].box=-(1000+p.id)}
function applySnap(m){Object.assign(S,{t:m.tm,night:m.n,phase:m.ph,ot:!!m.ot,inter:m.it,quota:m.q,shelved:m.sh,lost:m.lo,score:m.sc,total:m.to,aidLeft:m.ai,lamps:m.la,over:m.ov});
  const seen=new Set();
  for(const a of m.pl){const [id,name,col,x,z,yaw,pitch,light,hp,dead,carry,inv,up,stack,can,wu,cash]=a;seen.add(id);let p=S.players[id];if(!p)p=S.players[id]={id};Object.assign(p,{name,col,hp,dead:!!dead,carry,inv,up,stack,can:!!can,wu,cash:cash|0});
    if(id!==NET.myId)Object.assign(p,{x,z,yaw,pitch,light:!!light});else if(!p.init){p.init=1;p.x=x;p.z=z}}
  for(const id in S.players)if(!seen.has(id))delete S.players[id];
  m.tr.forEach((a,i)=>{const tr=S.trucks[i];if(tr.z===undefined||Math.abs(tr.z-a[1])>6)tr.z=a[1];Object.assign(tr,{st:a[0],tz:a[1],door:a[2],t:a[3],warn:!!a[4],claw:!!a[5],left:a[6],n:a[7],reject:!!a[8],kg:a[9],extra:a[10],stuck:a[11]})});
  S.mons=m.mo.map(a=>({id:a[0],ty:a[1],x:a[2],y:a[3],z:a[4],ry:a[5],a:a[6],k:a[7],v:a[8],f:!!a[9],tg:a[10]||''}));
  const x=m.x||{};const addsChanged=JSON.stringify(x.adds||[])!==JSON.stringify(S.adds||[]);
  Object.assign(S,{outage:!!x.out,cash:x.cash,tvotes:x.tv||{},adds:x.adds||[],fixed:x.fixed||[],aidBonus:x.ab,extra:x.ex,shopT:x.shopT,votes:x.vo||[],yard:x.yard?{bay:x.yard[0],stage:x.yard[1],hit:x.yard[2]||'',ht:x.yard[3]||0}:null,amr:(x.am||[]).map(a=>({k:a[0],x:a[1],z:a[2],ry:a[3],st:AMR_ST[a[4]],load:a[5],slot:a[6],t:a[7]})),stash:!!x.st,chill:x.ch?{st:x.ch[0]?'cold':'warn',t:x.ch[1]}:null,
    rg:x.rg?{st:RG_ST[x.rg[0]],x:x.rg[1],z:x.rg[2],ry:x.rg[3],k:x.rg[4],hx:x.rg[5],hz:x.rg[6],tg:x.rg[7],t:x.rg[8],b:x.rg[9]|0}:null,
    parcels:(x.par||[]).map(a=>({id:a[0],x:a[1],c:a[2],m:!!a[3]})),pallets:(x.pal||[]).map(a=>({id:a[0],st:a[1],bay:a[2],lx:a[3],lz:a[4],x:a[5],z:a[6],ry:a[7],s:a[8],y:a[9]||0,amr:a[10]||0})),
    flares:(x.fl||[]).map(a=>({id:a[0],x:a[1],z:a[2],t:a[3]}))});
  { const sig=S.pallets.map(p=>p.id+":"+p.st+":"+p.s).join(); if(sig!==NET.palSig){NET.palSig=sig;markSlots()} } // pallets come in every snapshot: keep shelf slots in step with them
  if(x.cold)S.cold={door:x.cold[0],open:!!x.cold[1]};if(x.conv)S.conv={sel:x.conv[0],jam:!!x.conv[1]};
  if(x.elev)S.elev={lvl:x.elev[0],st:x.elev[1],t:x.elev[2],gate:x.elev[3],hl:x.elev[4],ht:x.elev[5]};if(x.df!=null)S.diff=x.df;if(x.gen)S.gen={fuel:x.gen[0],out:!!x.gen[1]};
  if(x.fork){const f=x.fork,mine=f[4]===NET.myId&&S.fork&&S.fork.drv===NET.myId;S.fork=Object.assign(S.fork||{},mine?{lift:f[3],drv:f[4],pal:f[5],pass:!!f[6]}:{x:f[0],z:f[1],ry:f[2],lift:f[3],drv:f[4],pal:f[5],pass:!!f[6]})}
  if(addsChanged)applyAdds();
  markSlots();applyColliders();
}
function netTick(dt){
  if(NET.mode==='host'&&NET.started&&S){NET.snapT-=dt;
    if(S.bver!==NET.sentBver||NET.boxT<=0){NET.sentBver=S.bver;NET.boxT=3;hostSend({t:'b',b:boxSnap()})}NET.boxT-=dt;
    if(NETEV.length){if(NET.conns.size)hostSend({t:'ev',ev:NETEV.splice(0)});else NETEV.length=0}
    if(NET.snapT<=0){NET.snapT=Math.max(NET.snapT+1/20,0);if(NET.conns.size)hostSendFast(snap())}} // (carry the remainder over, so a 50 ms timer still sends 20 a second)
  else if(NET.mode==='client'&&NET.hostConn&&NET.hostConn.open&&ME.ready){NET.meT-=dt;if(NET.meT<=0){NET.meT=1/20;try{(NET.fastConn&&NET.fastConn.open?NET.fastConn:NET.hostConn).send({t:'me',p:[r2(ME.x),r2(ME.z),r3(ME.yaw),r3(ME.pitch),ME.lightOn()?1:0].concat(ME.driving&&S.fork?[r2(S.fork.x),r2(S.fork.z),r3(S.fork.ry)]:[])})}catch(e){}}}}
function doAct(a){if(NET.mode==='client'){try{NET.hostConn&&NET.hostConn.open&&NET.hostConn.send({t:'act',a})}catch(e){}}else act(NET.myId,a)}
