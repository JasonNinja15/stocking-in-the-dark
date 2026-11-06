// A whole-run playthrough for Stocking In The Dark, driven in short synchronous chunks so it works in a background tab
// (no timers: a hidden tab throttles them). Load it into a running page (local server) with:
//   await import('/tools/playthrough.js?'+Date.now()); await PT.boot({bots:3});
// then call PT.step(25000) repeatedly (each call runs about 25 s of real time) until PT.done. PT.report() sums it up.
// Bot workers play through the real host actions, buy gear and vote on additions between nights, and everyone is kept
// alive (deaths are counted) so the run reaches the late nights. Nothing in the game loads this file.
const PT=window.PT={T:performance.now()+1e5,rows:[],errs:[],events:{},deaths:0,short:[],buys:{},g:0,done:false,maxNight:20};
addEventListener('error',e=>PT.errs.push(String(e.message)));
const cerr=console.error.bind(console);console.error=(...a)=>{PT.errs.push(a.map(String).join(' ').slice(0,300));cerr(...a)};
const near=(p,x,z)=>{p.x=x;p.z=z};
const freeSlot=pred=>GS.SLOTS.find(s=>!s.old&&s.box===-1&&GS.slotOn(s)&&pred(s));
PT.boot=async({bots=3,diff=1,maxNight=20}={})=>{GS.startSolo();await new Promise(r=>setTimeout(r,600));const S=GS.S;S.diff=diff;PT.maxNight=maxNight;
  window.requestAnimationFrame=()=>0; // from here on only PT drives frames
  for(let i=1;i<=bots;i++)GS.addPlayer('b'+i,'Bot '+i,['#a4e33a','#38d4e8','#ff4fa8','#ffd23a'][i-1]);
  GS.startNight();for(const id of['big','lockmsg'])document.getElementById(id).style.display='none';return S};
// one bot's next move: carry what it holds to a shelf (or the shredder, or the freezer), else pick something up
PT.bot=id=>{const S=GS.S,p=S.players[id];if(!p||p.dead||p.locked)return;const K=GS.K2,act=a=>GS.act(id,a);
  if(S.chill&&id==='b1'&&Math.random()<.02){near(p,K.VENT.x,K.VENT.z+1.2);act({a:'vent'});return}
  // someone shut in the janitor's closet: the nearest bot goes and lets them out
  if(Object.values(S.players).some(q=>q.locked)&&id==='b2'){near(p,28.6,-3.5);act({a:'janFree'});PT.events.closetRescue=1;return}
  if(Math.random()>.045)return;const carry=p.carry>=0?S.boxes.find(b=>b.id===p.carry):null;
  if(carry){if(carry.ret){near(p,K.SHRED.x,K.SHRED.z+1.6);act({a:'shred'});return}
    const s=freeSlot(s=>carry.fz?s.cold:!s.cold);if(!s){act({a:'drop',x:p.x,z:p.z,ry:0});return}near(p,s.x,s.z+(s.rot?0:1.2));act({a:'place',s:s.id});return}
  const docked=S.boxes.filter(b=>b.st===0&&S.trucks[b.bay]&&S.trucks[b.bay].st===2&&!b.amr),floor=S.boxes.filter(b=>b.st===3&&!b.amr);
  const b=docked[Math.floor(Math.random()*docked.length)]||floor[Math.floor(Math.random()*floor.length)];if(!b)return;
  const w=GS.boxWorld(b);near(p,w.x,w.z+.8);if(Math.random()<.3)act({a:'kick',b:b.id});act({a:'pick',b:b.id})};
// between nights: personal gear, then the cheapest addition (or a hand cart) by vote, then ready up
PT.shop=(id,g)=>{const S=GS.S,buy=k=>{GS.act(id,{a:'buy',k})};
  if(g<2){const ks=Object.keys(GS.SHOP).filter(k=>!GS.isTeam(k));for(let i=0;i<3;i++)buy(ks[Math.floor(Math.random()*ks.length)])}
  const team=Object.keys(GS.ADDS).filter(k=>!GS.owned(k)&&GS.priceOf(k)<=(S.cash||0)&&!(GS.ADDS[k].night&&S.night+1<GS.ADDS[k].night)).sort((a,b)=>GS.priceOf(a)-GS.priceOf(b));
  const k=team[0]||((S.carts||[]).length<2&&S.cash>=GS.priceOf('cart')?'cart':null);
  if(k&&!((S.tvotes||{})[k]||[]).includes(id))buy(k);if(g>3&&!(S.votes||[]).includes(id))GS.act(id,{a:'start'})};
// run the game for about budgetMs of real time, synchronously
PT.step=(budgetMs=25000)=>{const S=GS.S,end=performance.now()+budgetMs;let i=0;
  while(performance.now()<end&&!PT.done){
    if(S.phase==='play'){if(i%5===0)for(const id in S.players)if(id!=='me')PT.bot(id);
      for(const p of Object.values(S.players)){if(p.dead){PT.deaths++;PT.events['died_n'+S.night]=(PT.events['died_n'+S.night]||0)+1;p.dead=false;p.hp=100}else if(p.hp<25)p.hp=60}
      if(S.ot&&S.shelved<S.quota){PT.short.push(S.night+':'+(S.quota-S.shelved));S.shelved=S.quota}
      for(const m of S.mons)PT.events['ty'+m.ty]=1;if(S.rg)PT.events.roofGiant=1;if(S.yard)PT.events.yard=1;if(S.chill)PT.events['chill_'+S.chill.st]=1;
      if(S.outage)PT.events.outage=1;if(S.fork&&S.fork.pass)PT.events.passenger=1;if(S.elev&&S.elev.st==='stall')PT.events.elevStall=1;if((S.wet||[]).length)PT.events.wet=1;
      if(Object.values(S.players).some(p=>p.locked))PT.events.closetLocked=1;if((S.amr||[]).some(r=>r.st==='fetch'))PT.events.amrFetch=1;if(S.ot)PT.events.overtime=1}
    if(S.over){PT.rows.push('OVER '+S.over.why+' night '+S.night);S.over=null}
    if(S.phase==='shop'){PT.g++;if(PT.g%5===0){for(const id in S.players)if(id!=='me')PT.shop(id,PT.g/5);if(PT.g>20&&!(S.votes||[]).includes('me'))GS.act('me',{a:'start'})}}
    else if(PT.g){PT.g=0;PT.rows.push(`n${S.night}: quota ${S.quota}, adds ${S.adds.length}, carts ${(S.carts||[]).length}, team $${Math.round(S.cash)}`);if(S.night>PT.maxNight)PT.done=true}
    PT.T+=50;try{if(i%10===0)GS.frame(PT.T);else if(!GS.GAME.paused)GS.simUpdate(.05)}catch(e){PT.errs.push('frame '+e.message+' '+(e.stack||'').split('\n')[1]);PT.done=true}i++}
  return{steps:i,night:S.night,phase:S.phase,errs:PT.errs.length}};
PT.report=()=>({rows:PT.rows,errs:PT.errs.slice(0,10),deaths:PT.deaths,short:PT.short,events:Object.keys(PT.events).sort().join(','),adds:GS.S.adds.join(','),carts:(GS.S.carts||[]).length});
export default PT;
