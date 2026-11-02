// ===================================================================== networking
// Browser-to-browser over WebRTC (PeerJS). The host runs the simulation; clients send their own
// position plus action requests, and get snapshots back at 15 Hz.
const NET={mode:'solo',host:false,peer:null,conns:new Map(),hostConn:null,myId:'me',code:'',lobby:[],started:false,snapT:0,meT:0,boxT:0,sentBver:-1,closing:false};
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
function hostAccept(c){
  c.on('open',()=>{if(NET.conns.size>=3){try{c.send({t:'full'})}catch(e){}setTimeout(()=>c.close(),400);return}NET.conns.set(c.peer,c)});
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
  if(m.t==='me'&&S){const p=S.players[c.peer];if(p&&Array.isArray(m.p)){const [x,z,yaw,pitch,light]=m.p;if(isFinite(x)&&isFinite(z)){p.x=clamp(x,WH.x0,WH.x1);p.z=clamp(z,TZ_DOCK-TRAIL_LEN,WH.z1)}if(isFinite(yaw))p.yaw=yaw;if(isFinite(pitch))p.pitch=clamp(pitch,-1.5,1.5);p.light=!!light}return}
  if(m.t==='act'&&S){act(c.peer,m.a);return}}
function hostSend(m){for(const c of NET.conns.values())if(c.open)try{c.send(m)}catch(e){}}
function lobbyBroadcast(){hostSend({t:'lobby',players:NET.lobby,started:NET.started});if(!NET.started)renderLobby()}

function netJoin(code){return new Promise((res,rej)=>{if(!window.Peer)return rej('The multiplayer library did not load. Are you offline?');
  const p=new Peer({debug:0});NET.peer=p;let done=false;
  const fail=msg=>{if(done)return;done=true;clearTimeout(to);try{p.destroy()}catch(e){}NET.peer=null;rej(msg)};
  const to=setTimeout(()=>fail('Timed out. Check the code and try again.'),15000);
  p.on('open',id=>{NET.myId=id;const c=p.connect(PFX+code,{reliable:true,serialization:'json'});NET.hostConn=c;
    c.on('open',()=>{if(done)return;done=true;clearTimeout(to);NET.mode='client';NET.host=false;NET.code=code;c.send({t:'hi',name:myName()});res()});
    c.on('data',m=>clientMsg(m));c.on('close',()=>hostLost());c.on('error',()=>{})});
  p.on('error',e=>{if(!done)fail(errText(e));else if(e&&e.type!=='peer-unavailable')console.warn('peer',e)});
  p.on('disconnected',()=>{if(!NET.closing)try{p.reconnect()}catch(e){}})})}
function clientMsg(m){if(!m)return;
  switch(m.t){
  case 'full':NET.closing=true;netClose();showMenu('That crew is full (4 workers max).');break;
  case 'lobby':NET.lobby=m.players||[];if(!GAME.on)renderLobby();break;
  case 'start':clientStart();break;
  case 'tp':ME.x=m.x;ME.z=m.z;ME.ready=true;break;
  case 'b':if(S)applyBoxes(m.b);break;
  case 's':if(S)applySnap(m);break;
  }}
function hostLost(){if(NET.closing||NET.mode!=='client')return;NET.closing=true;netClose();
  if(GAME.on){GAME.on=false;document.exitPointerLock&&document.exitPointerLock();showOver({why:'host',night:S?S.night:1,total:S?S.total+S.shelved:0,score:S?S.score:0})}else showMenu('The host closed the crew room.')}
function netClose(){NET.closing=true;try{NET.peer&&NET.peer.destroy()}catch(e){}NET.peer=null;NET.conns.clear();NET.hostConn=null;NET.mode='solo';NET.host=false;NET.started=false;NET.lobby=[];setTimeout(()=>NET.closing=false,50)}

// ---- snapshots
const r2=v=>Math.round(v*100)/100,r3=v=>Math.round(v*1000)/1000;
function snap(){return{t:'s',tm:r2(S.t),n:S.night,ph:S.phase,ot:S.ot?1:0,it:r2(S.inter),q:S.quota,sh:S.shelved,lo:S.lost,sc:S.score,to:S.total,ai:S.aidLeft,la:S.lamps,bv:S.bver,ov:S.over,
  pl:Object.values(S.players).map(p=>[p.id,p.name,p.col,r2(p.x),r2(p.z),r3(p.yaw),r3(p.pitch),p.light?1:0,Math.ceil(p.hp),p.dead?1:0,p.carry]),
  tr:S.trucks.map(t=>[t.st,r2(t.z),r2(t.door),Math.round(t.t),t.warn?1:0,t.claw?1:0,t.left,t.n,t.reject?1:0,t.kg||0,t.extra||0]),
  mo:S.mons.map(m=>[m.id,m.ty,r2(m.x),r2(m.y||0),r2(m.z),r2(m.ry),m.a|0,m.k|0,m.v|0,m.f?1:0]),
  ev:NETEV.splice(0)}}
function boxSnap(){return S.boxes.filter(b=>b.st!==4).map(b=>[b.id,b.st,r2(b.x),r2(b.y),r2(b.z),r2(b.ry),b.k,b.f?1:0,b.v,b.h||'',b.s,b.bay??-1])}
function applyBoxes(arr){S.boxes=arr.map(a=>({id:a[0],st:a[1],x:a[2],y:a[3],z:a[4],ry:a[5],k:a[6],f:!!a[7],v:a[8],h:a[9],s:a[10],bay:a[11]}));
  for(const s of SLOTS)s.box=-1;for(const b of S.boxes)if((b.st===2||b.st===3)&&b.s>=0&&SLOTS[b.s])SLOTS[b.s].box=b.id}
function applySnap(m){Object.assign(S,{t:m.tm,night:m.n,phase:m.ph,ot:!!m.ot,inter:m.it,quota:m.q,shelved:m.sh,lost:m.lo,score:m.sc,total:m.to,aidLeft:m.ai,lamps:m.la,over:m.ov});
  const seen=new Set();
  for(const a of m.pl){const [id,name,col,x,z,yaw,pitch,light,hp,dead,carry]=a;seen.add(id);let p=S.players[id];if(!p)p=S.players[id]={id};Object.assign(p,{name,col,hp,dead:!!dead,carry});
    if(id!==NET.myId)Object.assign(p,{x,z,yaw,pitch,light:!!light});else if(!p.init){p.init=1;p.x=x;p.z=z}}
  for(const id in S.players)if(!seen.has(id))delete S.players[id];
  m.tr.forEach((a,i)=>Object.assign(S.trucks[i],{st:a[0],z:a[1],door:a[2],t:a[3],warn:!!a[4],claw:!!a[5],left:a[6],n:a[7],reject:!!a[8],kg:a[9],extra:a[10]}));
  S.mons=m.mo.map(a=>({id:a[0],ty:a[1],x:a[2],y:a[3],z:a[4],ry:a[5],a:a[6],k:a[7],v:a[8],f:!!a[9]}));
  applyColliders();
  for(const e of m.ev||[])EVQ.push(e)}
function netTick(dt){
  if(NET.mode==='host'&&NET.started&&S){NET.snapT-=dt;
    if(S.bver!==NET.sentBver||NET.boxT<=0){NET.sentBver=S.bver;NET.boxT=3;hostSend({t:'b',b:boxSnap()})}NET.boxT-=dt;
    if(NET.snapT<=0){NET.snapT=1/15;if(NET.conns.size)hostSend(snap());else NETEV.length=0}}
  else if(NET.mode==='client'&&NET.hostConn&&NET.hostConn.open&&ME.ready){NET.meT-=dt;if(NET.meT<=0){NET.meT=1/20;try{NET.hostConn.send({t:'me',p:[r2(ME.x),r2(ME.z),r3(ME.yaw),r3(ME.pitch),ME.lightOn()?1:0]})}catch(e){}}}}
function doAct(a){if(NET.mode==='client'){try{NET.hostConn&&NET.hostConn.open&&NET.hostConn.send({t:'act',a})}catch(e){}}else act(NET.myId,a)}
