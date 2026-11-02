// ===================================================================== audio (all synthesized)
const AU={ctx:null,out:null,rev:null,noise:null,dist:null,ready:false,ambT:6,beatT:0};
function auInit(){
  if(AU.ctx){if(AU.ctx.state==='suspended')AU.ctx.resume();return}
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  const C=new AC();AU.ctx=C;
  const comp=C.createDynamicsCompressor();comp.threshold.value=-12;comp.knee.value=8;comp.ratio.value=5;comp.attack.value=.003;comp.release.value=.25;comp.connect(C.destination);
  AU.out=C.createGain();AU.out.gain.value=SET.vol;AU.out.connect(comp);
  const len=C.sampleRate*2,buf=C.createBuffer(1,len,C.sampleRate),d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;AU.noise=buf;
  // big empty-building reverb
  const rl=C.sampleRate*2.6,ir=C.createBuffer(2,rl,C.sampleRate);for(let ch=0;ch<2;ch++){const a=ir.getChannelData(ch);for(let i=0;i<rl;i++){const t=i/rl;a[i]=(Math.random()*2-1)*Math.pow(1-t,3.2)*(i<C.sampleRate*.012?0:1)}}
  const cv=C.createConvolver();cv.buffer=ir;AU.rev=C.createGain();AU.rev.gain.value=.55;AU.rev.connect(cv);cv.connect(AU.out);
  AU.dist=C.createWaveShaper();const n=1024,cu=new Float32Array(n);for(let i=0;i<n;i++){const x=i/n*2-1;cu[i]=Math.tanh(x*6)}AU.dist.curve=cu;AU.dist.connect(AU.out);
  AU.ready=true;startAmbience();
}
function auVol(v){if(AU.out)AU.out.gain.setTargetAtTime(v,AU.ctx.currentTime,.05)}
function setP(P,p){if(P.positionX){P.positionX.value=p.x;P.positionY.value=p.y;P.positionZ.value=p.z}else P.setPosition(p.x,p.y,p.z)}
function mkPan(p,ref=2,roll=1.3){const P=AU.ctx.createPanner();P.panningModel='HRTF';P.distanceModel='inverse';P.refDistance=ref;P.rolloffFactor=roll;P.maxDistance=80;setP(P,p);return P}
// a destination for one sound: optional 3D position, reverb send, optional distortion
function dest(pos,{rev=.25,gain=1,dist=false,ref=2,roll=1.3}={}){const C=AU.ctx,g=C.createGain();g.gain.value=gain;
  let head=g;if(pos){const P=mkPan(pos,ref,roll);g.connect(P);head=P}
  head.connect(dist?AU.dist:AU.out);if(rev){const s=C.createGain();s.gain.value=rev;head.connect(s);s.connect(AU.rev)}
  setTimeout(()=>{try{g.disconnect();head.disconnect()}catch(e){}},6000);return g}
function tone(d,{type='sine',f=440,f2=0,t=0,dur=.2,a=.005,g=.3}){const C=AU.ctx,t0=C.currentTime+t,o=C.createOscillator(),e=C.createGain();o.type=type;o.frequency.setValueAtTime(f,t0);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t0+dur);
  e.gain.setValueAtTime(1e-4,t0);e.gain.exponentialRampToValueAtTime(g,t0+a);e.gain.exponentialRampToValueAtTime(1e-4,t0+dur);o.connect(e);e.connect(d);o.start(t0);o.stop(t0+dur+.05);return o}
function nz(d,{t=0,dur=.2,a=.004,g=.3,type='bandpass',f=1000,f2=0,q=1}){const C=AU.ctx,t0=C.currentTime+t,s=C.createBufferSource(),fl=C.createBiquadFilter(),e=C.createGain();s.buffer=AU.noise;fl.type=type;fl.frequency.setValueAtTime(f,t0);if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t0+dur);fl.Q.value=q;
  e.gain.setValueAtTime(1e-4,t0);e.gain.exponentialRampToValueAtTime(g,t0+a);e.gain.exponentialRampToValueAtTime(1e-4,t0+dur);s.connect(fl);fl.connect(e);e.connect(d);s.start(t0,Math.random()*1.5);s.stop(t0+dur+.05);return s}

// ---- creature voices
// A throat, roughly: a buzzy source (saw + sub-octave + breath) whose pitch wanders, chopped by an irregular
// flutter (the rasp of a torn throat), shaped by vowel resonances that can move mid-scream, then overdriven.
const VOWEL={aw:[[620,7,1],[1000,8,.7],[2500,9,.3]],ah:[[780,7,1],[1250,8,.75],[2600,9,.35]],eh:[[560,8,.8],[1800,10,.7],[2600,10,.4]],
  ee:[[330,9,.6],[2300,12,1],[3100,12,.6]],oo:[[330,8,1],[800,9,.4],[2300,10,.15]],small:[[950,7,1],[1650,8,.7],[3300,9,.4]]};
const SHAPERS={};
function shaper(k){if(SHAPERS[k])return SHAPERS[k];const n=2048,c=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;c[i]=Math.tanh(x*k)/Math.tanh(k)}return SHAPERS[k]=c}
function wander(f0,f1,dur,jit,vib=0,vibF=6){const n=Math.max(24,Math.floor(dur*150)),a=new Float32Array(n);let w=0;
  for(let i=0;i<n;i++){const t=i/(n-1);w=w*.92+(Math.random()*2-1)*jit;a[i]=Math.max(8,f0*Math.pow(f1/f0,t)*(1+w+vib*Math.sin(t*dur*vibF*TAU)))}return a}
function voice(d,{t=0,dur=1,f0=90,f1=55,jit=.05,vib=.02,rasp=40,raspD=.7,v='aw',v2=null,noise=.35,sub=.6,drive=4,g=.5,a=.02,rel=.35}){
  const C=AU.ctx,t0=C.currentTime+t,src=C.createGain(),nodes=[];
  const o=C.createOscillator();o.type='sawtooth';o.frequency.setValueCurveAtTime(wander(f0,f1,dur,jit,vib),t0,dur);o.connect(src);nodes.push(o);
  if(sub){const o2=C.createOscillator(),g2=C.createGain();o2.type='square';o2.frequency.setValueCurveAtTime(wander(f0*.5,f1*.5,dur,jit*.5),t0,dur);g2.gain.value=sub;o2.connect(g2);g2.connect(src);nodes.push(o2)}
  const ns=C.createBufferSource(),ng=C.createGain();ns.buffer=AU.noise;ng.gain.value=noise;ns.connect(ng);ng.connect(src);
  const am=C.createGain();am.gain.value=1-raspD*.5;src.connect(am);
  const l=C.createOscillator(),lg=C.createGain();l.type='sawtooth';l.frequency.setValueCurveAtTime(wander(rasp,rasp*.75,dur,.2),t0,dur);lg.gain.value=raspD*.5;l.connect(lg);lg.connect(am.gain);nodes.push(l);
  const mix=C.createGain(),V=VOWEL[v],V2=v2&&VOWEL[v2];
  V.forEach(([f,q,gg],i)=>{const b=C.createBiquadFilter(),fg=C.createGain();b.type='bandpass';b.Q.value=q;b.frequency.setValueAtTime(f,t0);
    if(V2)b.frequency.linearRampToValueAtTime(V2[i][0],t0+dur*.55);fg.gain.value=gg*4;am.connect(b);b.connect(fg);fg.connect(mix)});
  const lo=C.createBiquadFilter(),lgn=C.createGain();lo.type='lowpass';lo.frequency.value=220;lgn.gain.value=.5;am.connect(lo);lo.connect(lgn);lgn.connect(mix); // chest
  const ws=C.createWaveShaper();ws.curve=shaper(drive);ws.oversample='2x';mix.connect(ws);
  const e=C.createGain();e.gain.setValueAtTime(1e-4,t0);e.gain.exponentialRampToValueAtTime(g,t0+a);e.gain.setValueAtTime(g,t0+Math.max(a+.01,dur-rel));e.gain.exponentialRampToValueAtTime(1e-4,t0+dur);
  ws.connect(e);e.connect(d);
  for(const n of nodes){n.start(t0);n.stop(t0+dur+.05)}ns.start(t0,Math.random()*1.4);ns.stop(t0+dur+.05)}
// inhuman screech: two detuned saws ring-modulated against each other, gliding up
function screech(d,{t=0,dur=1,f0=700,f1=1300,g=.3,drive=5}){const C=AU.ctx,t0=C.currentTime+t;
  const a=C.createOscillator(),b=C.createOscillator(),rm=C.createGain();a.type='sawtooth';b.type='sawtooth';
  a.frequency.setValueCurveAtTime(wander(f0,f1,dur,.04,.03,9),t0,dur);b.frequency.setValueCurveAtTime(wander(f0*1.47,f1*1.39,dur,.05,.03,7),t0,dur);
  rm.gain.value=0;a.connect(rm);b.connect(rm.gain);
  const hp=C.createBiquadFilter();hp.type='highpass';hp.frequency.value=600;const ws=C.createWaveShaper();ws.curve=shaper(drive);
  const e=C.createGain();e.gain.setValueAtTime(1e-4,t0);e.gain.exponentialRampToValueAtTime(g,t0+.03);e.gain.setValueAtTime(g,t0+dur*.6);e.gain.exponentialRampToValueAtTime(1e-4,t0+dur);
  rm.connect(hp);hp.connect(ws);ws.connect(e);e.connect(d);a.start(t0);b.start(t0);a.stop(t0+dur+.05);b.stop(t0+dur+.05)}
function impact(d,g=.9){tone(d,{f:72,f2:26,dur:.6,a:.003,g});nz(d,{dur:.18,a:.002,g:g*.6,type:'lowpass',f:900});nz(d,{dur:.05,a:.001,g:g*.45,type:'highpass',f:3500})}
// garbled talking: short syllables on human-pitched voices with changing vowels; returns how long it lasts
function speech(d,{t=0,n=10,f=115,g=.3}){let tt=t;for(let i=0;i<n;i++){const dur=rand(.08,.19),p=f*rand(.9,1.18);
  voice(d,{t:tt,dur,a:.012,rel:.05,f0:p,f1:p*rand(.85,1.05),v:pick(['ah','eh','oo','aw','ee']),rasp:30,raspD:.12,jit:.03,noise:.12,sub:0,g,drive:2});
  tt+=dur+(Math.random()<.25?rand(.08,.2):rand(.01,.04))}return tt-t}
function chitter(d,{t=0,n=14,g=.25}){for(let i=0;i<n;i++){const tt=t+i*rand(.018,.04);tone(d,{type:'triangle',f:rand(2400,4200),dur:.02,a:.001,g,t:tt});nz(d,{t:tt,dur:.015,a:.001,g:g*.8,type:'highpass',f:3000})}}

const SFX={
  step(metal,run,pos){if(!AU.ready)return;const d=dest(pos,{rev:.12,gain:pos?.9:.55});nz(d,{dur:run?.11:.09,g:run?.32:.22,type:'lowpass',f:metal?900:520+rand(-60,60),q:.7});
    if(metal){tone(d,{type:'triangle',f:rand(150,190),dur:.16,g:.08});nz(d,{dur:.12,g:.06,f:2400,q:8})}},
  pick(pos){if(!AU.ready)return;const d=dest(pos,{rev:.15});nz(d,{dur:.2,g:.28,f:1700,q:.8});nz(d,{t:.03,dur:.12,g:.25,type:'lowpass',f:300})},
  place(pos){if(!AU.ready)return;const d=dest(pos,{rev:.3});tone(d,{f:95,f2:48,dur:.22,g:.55});nz(d,{dur:.14,g:.3,type:'lowpass',f:700});tone(d,{type:'triangle',f:420,dur:.08,g:.05,t:.01})},
  kick(pos){if(!AU.ready)return;const d=dest(pos,{rev:.3});tone(d,{f:130,f2:40,dur:.24,g:.6});nz(d,{dur:.12,g:.4,f:900,q:.6})},
  smash(pos){if(!AU.ready)return;const d=dest(pos,{rev:.4});for(let i=0;i<7;i++){tone(d,{type:'triangle',f:rand(1800,4200),dur:rand(.08,.3),g:.12,t:rand(0,.12)})}nz(d,{dur:.3,g:.35,type:'highpass',f:2500})},
  click(){if(!AU.ready)return;const d=dest(null,{rev:0});tone(d,{type:'square',f:2400,dur:.025,g:.05});tone(d,{type:'square',f:900,dur:.02,g:.03,t:.03})},
  scratch(pos){if(!AU.ready)return;const d=dest(pos,{rev:.2,gain:1.4,ref:1.2,roll:1.6});const n=randi(5,10);for(let i=0;i<n;i++)nz(d,{t:i*rand(.03,.07),dur:.04,g:.25,type:'highpass',f:rand(2000,4000),q:2});if(Math.random()<.5)tone(d,{type:'sawtooth',f:rand(300,500),f2:rand(200,300),dur:.25,g:.04,t:.1})},
  // mimic tearing out of its box: cardboard rip, insect chitter, a small wet snarl
  burst(pos){if(!AU.ready)return;const d=dest(pos,{rev:.4,gain:1});nz(d,{dur:.22,a:.003,g:.5,f:1800,f2:900,q:1.2});chitter(d,{t:.05,n:10,g:.2});
    voice(d,{t:.1,dur:.7,f0:230,f1:150,v:'small',v2:'ah',rasp:58,jit:.08,g:.4,drive:5})},
  hiss(pos){if(!AU.ready)return;const d=dest(pos,{rev:.35,gain:1.2});nz(d,{dur:1.1,a:.08,g:.45,type:'highpass',f:3200});tone(d,{type:'sawtooth',f:70,f2:55,dur:1,g:.12})},
  // the trailer thing waking up: a long, low, rattling growl from deep in the chest
  growl(pos){if(!AU.ready)return;const d=dest(pos,{rev:.45,gain:1.2,ref:3});voice(d,{dur:1.9,a:.35,rel:.6,f0:68,f1:52,v:'oo',v2:'aw',rasp:26,raspD:.85,jit:.04,noise:.5,sub:.8,g:.45,drive:3})},
  // the sleeper, held in the light too long: a short, enormous roar as it comes for you
  roar(pos){if(!AU.ready)return;const d=dest(pos,{rev:.5,gain:1.1,ref:3});
    voice(d,{dur:1.1,a:.03,rel:.4,f0:120,f1:70,v:'ah',v2:'aw',rasp:31,raspD:.85,jit:.06,noise:.45,sub:.9,g:.6,drive:5});
    voice(d,{t:.05,dur:.9,a:.03,rel:.35,f0:190,f1:105,v:'eh',v2:'aw',rasp:44,raspD:.7,jit:.07,noise:.3,sub:.2,g:.3,drive:6})},
  // the crawler leaving its trailer: a high, wavering, almost-human sound, like a laugh that forgot how
  crawlOut(pos){if(!AU.ready)return;const d=dest(pos,{rev:.65,gain:1.1,ref:3});
    voice(d,{dur:2.4,a:.08,rel:.7,f0:420,f1:560,v:'oo',v2:'ee',rasp:7.5,raspD:.95,jit:.045,vib:.05,noise:.15,sub:0,g:.42,drive:3});
    voice(d,{t:.12,dur:2.1,a:.1,rel:.6,f0:628,f1:790,v:'ee',v2:'eh',rasp:11,raspD:.9,jit:.05,vib:.06,noise:.1,sub:0,g:.16,drive:2});
    nz(d,{t:2.2,dur:.5,a:.05,g:.12,f:2400,q:2})},
  // knuckles and nails on sheet metal, overhead
  tap(pos,soft){if(!AU.ready)return;const d=dest(pos,{rev:.35,gain:soft?.5:1,ref:2.5,roll:1.1});
    tone(d,{type:'triangle',f:rand(1100,1900),dur:.03,a:.001,g:.12});nz(d,{dur:.035,a:.001,g:.22,f:rand(2500,4200),q:3});tone(d,{f:rand(160,220),f2:90,dur:.07,g:.12})},
  // a mimic scrambling off to somewhere new
  skitter(pos){if(!AU.ready)return;const d=dest(pos,{rev:.3,gain:1,ref:1.6});nz(d,{dur:.12,g:.25,f:1600,q:1.5});chitter(d,{t:.04,n:12,g:.14})},
  // the stalker driven off by light: an ear-splitting, rising shriek
  shriek(pos){if(!AU.ready)return;const d=dest(pos,{rev:.6,gain:1});voice(d,{dur:1.0,a:.02,rel:.4,f0:520,f1:980,v:'ee',v2:'ah',rasp:63,raspD:.5,jit:.06,vib:.03,noise:.25,sub:0,g:.4,drive:6});screech(d,{t:.03,dur:.85,f0:900,f1:1500,g:.14})},
  scare(ty){if(!AU.ready)return;const d=dest(null,{rev:.5,gain:ty===1?.62:.75});impact(d,ty===1?1:.7);
    if(ty===1){ // the trailer thing: a huge two-throated roar, jaws snapping shut at the end
      voice(d,{dur:1.55,a:.03,rel:.5,f0:96,f1:46,v:'aw',v2:'ah',rasp:33,raspD:.8,jit:.06,vib:.025,noise:.45,sub:.9,g:.75,drive:5});
      voice(d,{t:.04,dur:1.35,a:.03,rel:.45,f0:150,f1:72,v:'eh',v2:'aw',rasp:47,raspD:.7,jit:.07,noise:.3,sub:.3,g:.38,drive:6});
      nz(d,{t:.1,dur:1.2,a:.1,g:.25,f:320,q:3});tone(d,{t:1.35,type:'triangle',f:1600,f2:300,dur:.06,a:.001,g:.4});nz(d,{t:1.35,dur:.08,a:.001,g:.5,type:'highpass',f:2500})}
    else if(ty===2){ // the stalker: a sharp inhale, then a shrieking scream with a growl underneath
      nz(d,{dur:.09,a:.06,g:.35,f:1200,f2:3500,q:1.5});
      voice(d,{t:.07,dur:1.35,a:.015,rel:.45,f0:470,f1:900,v:'ee',v2:'ah',rasp:61,raspD:.55,jit:.07,vib:.035,noise:.25,sub:0,g:.6,drive:7});
      screech(d,{t:.09,dur:1.15,f0:820,f1:1550,g:.2,drive:6});
      voice(d,{t:.07,dur:1.2,a:.03,rel:.4,f0:82,f1:64,v:'aw',rasp:38,raspD:.8,noise:.4,sub:.6,g:.32,drive:4})}
    else if(ty===3){ // the crawler dropping onto you: a gasp, then a high, human-sounding scream
      nz(d,{dur:.12,a:.08,g:.3,f:900,f2:2800,q:1.4});
      voice(d,{t:.08,dur:1.3,a:.015,rel:.45,f0:620,f1:1050,v:'ah',v2:'ee',rasp:52,raspD:.5,jit:.08,vib:.05,noise:.2,sub:0,g:.55,drive:6});
      voice(d,{t:.1,dur:1.2,a:.02,rel:.4,f0:930,f1:1400,v:'ee',rasp:13,raspD:.85,jit:.06,noise:.1,sub:0,g:.2,drive:4});
      screech(d,{t:.12,dur:.9,f0:1100,f1:1700,g:.12})}
    else if(ty===4){ // the night manager lowers his clipboard: paper snaps, then a man's voice, far too deep and far too wide
      nz(d,{dur:.12,a:.002,g:.5,f:2600,q:1});voice(d,{t:.05,dur:1.4,a:.04,rel:.5,f0:95,f1:62,v:'ah',v2:'aw',rasp:22,raspD:.6,jit:.03,vib:.02,noise:.25,sub:.7,g:.6,drive:4});
      voice(d,{t:.08,dur:1.2,a:.05,rel:.45,f0:190,f1:120,v:'eh',v2:'ah',rasp:35,raspD:.5,noise:.15,sub:0,g:.25,drive:3})}
    else if(ty===5){ // the shrink-wrap: plastic shrieking as it stretches, a muffled scream from inside it
      for(let i=0;i<10;i++)nz(d,{t:i*.05,dur:.07,a:.003,g:.35,f:rand(3000,6000),q:2});
      const m=AU.ctx.createBiquadFilter();m.type='lowpass';m.frequency.value=900;m.connect(d);voice(m,{t:.1,dur:1.3,a:.03,rel:.4,f0:330,f1:420,v:'ah',v2:'ee',rasp:40,raspD:.6,jit:.06,noise:.3,sub:0,g:.8,drive:5})}
    else if(ty===6){ // frost figure: ice cracking apart, a frozen throat forcing out a breath
      for(let i=0;i<7;i++)tone(d,{t:rand(0,.25),type:'triangle',f:rand(2500,5000),dur:.06,a:.001,g:.12});nz(d,{dur:.5,a:.002,g:.4,type:'highpass',f:2500});
      voice(d,{t:.1,dur:1.2,a:.06,rel:.4,f0:150,f1:95,v:'oo',v2:'ah',rasp:18,raspD:.8,jit:.05,noise:.6,sub:.3,g:.5,drive:4})}
    else if(ty===7){ // the driver: a man's yell that breaks apart halfway through
      voice(d,{dur:1.2,a:.02,rel:.4,f0:180,f1:120,v:'ah',v2:'aw',rasp:52,raspD:.6,jit:.09,vib:.04,noise:.3,sub:.3,g:.65,drive:7});screech(d,{t:.4,dur:.7,f0:600,f1:900,g:.1})}
    else if(ty===9){ // the thing in the yard: a sound too low and too big for any throat
      tone(d,{f:38,f2:22,dur:2.4,a:.05,g:.9});voice(d,{dur:2.2,a:.1,rel:.8,f0:48,f1:31,v:'oo',v2:'aw',rasp:14,raspD:.9,jit:.03,noise:.5,sub:1,g:.7,drive:3});nz(d,{dur:1.8,a:.2,g:.3,type:'lowpass',f:200})}
    else if(ty===10){ // the elevator roof: the hatch bangs open and something screams down through it
      tone(d,{type:'square',f:110,f2:60,dur:.25,a:.002,g:.4});nz(d,{dur:.2,a:.002,g:.5,f:1500,q:1});
      voice(d,{t:.12,dur:1.2,a:.02,rel:.4,f0:560,f1:880,v:'ee',v2:'ah',rasp:66,raspD:.6,jit:.08,noise:.2,sub:0,g:.55,drive:7});screech(d,{t:.15,dur:.9,f0:900,f1:1500,g:.14})}
    else if(ty===13){ // the blind one: a burst of clicks and a dry, rattling breath pulled in through the open mouth
      for(let i=0;i<9;i++)tone(d,{t:i*.035,type:'triangle',f:rand(1800,2600),dur:.02,a:.001,g:.3});voice(d,{t:.2,dur:1.3,a:.05,rel:.5,f0:120,f1:85,v:'aw',v2:'oo',rasp:60,raspD:.9,jit:.1,noise:.7,sub:.2,g:.55,drive:6})}
    else if(ty===14){ // the basement thing: the shredder motor and a low groan right in your ear
      tone(d,{type:'sawtooth',f:62,f2:40,dur:1.6,a:.02,g:.35});nz(d,{dur:1.4,a:.02,g:.5,type:'lowpass',f:900});voice(d,{t:.05,dur:1.4,a:.08,rel:.5,f0:85,f1:60,v:'oo',v2:'aw',rasp:22,raspD:.8,jit:.05,noise:.4,sub:.7,g:.55,drive:4})}
    else if(ty===11){ // the passenger: a dry, hoarse scream from a throat that hasn't been used in years
      nz(d,{dur:1.2,a:.04,g:.5,f:1400,f2:2400,q:2});voice(d,{t:.05,dur:1.1,a:.04,rel:.4,f0:260,f1:200,v:'ah',v2:'eh',rasp:70,raspD:.9,jit:.1,noise:.8,sub:0,g:.45,drive:6})}
    else{ // the mimic: cardboard tears, it chitters, then snarls in your face
      nz(d,{dur:.25,a:.002,g:.6,f:1700,f2:800,q:1.2});chitter(d,{n:16,g:.28});
      voice(d,{t:.08,dur:1.05,a:.015,rel:.35,f0:240,f1:135,v:'small',v2:'ah',rasp:57,raspD:.75,jit:.09,vib:.03,noise:.35,sub:.4,g:.6,drive:6});
      voice(d,{t:.1,dur:.9,a:.02,rel:.3,f0:120,f1:80,v:'aw',rasp:41,raspD:.7,noise:.4,sub:.5,g:.3,drive:4})}},
  // the supervisor on the handheld: squelch, a few seconds of muffled talking, squelch
  radio(){if(!AU.ready)return;const C=AU.ctx,d=dest(null,{rev:.04,gain:.9}),bp=C.createBiquadFilter(),ws=C.createWaveShaper();
    bp.type='bandpass';bp.frequency.value=1500;bp.Q.value=.9;ws.curve=shaper(3);bp.connect(ws);ws.connect(d);
    nz(d,{dur:.14,a:.003,g:.32,f:2600,q:.7});const len=speech(bp,{t:.16,n:randi(9,13),f:rand(100,125),g:.32});
    const end=.16+len+.05;nz(d,{t:end,dur:.12,a:.003,g:.28,f:2600,q:.7});tone(d,{t:end+.12,type:'square',f:1250,dur:.07,g:.05})},
  // the warehouse loudspeaker: two-note chime, then an echoing announcement. The wrong voice uses the wrong
  // chime: the same two notes played upside down and out of tune, and it talks too slowly and too low.
  pa(fake){if(!AU.ready)return;const C=AU.ctx,d=dest(null,{rev:.75,gain:.85}),bp=C.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1100;bp.Q.value=.8;bp.connect(d);
    if(fake){tone(d,{type:'sine',f:606,dur:1.1,a:.01,g:.22});tone(d,{type:'sine',f:771,dur:1.3,a:.01,g:.2,t:.5});tone(d,{type:'sine',f:779,dur:1.3,a:.01,g:.12,t:.5});speech(bp,{t:1.25,n:randi(8,10),f:rand(72,80),g:.4})}
    else{tone(d,{type:'sine',f:784,dur:.9,a:.01,g:.22});tone(d,{type:'sine',f:622,dur:1.1,a:.01,g:.22,t:.45});speech(bp,{t:1.15,n:randi(8,11),f:rand(95,110),g:.36})}},
  // ---- the later-night monsters
  heel(pos){if(!AU.ready)return;const d=dest(pos,{rev:.45,gain:1,ref:2,roll:1.2});tone(d,{type:'triangle',f:rand(900,1200),dur:.04,a:.001,g:.16});nz(d,{dur:.05,a:.001,g:.25,f:2600,q:2})},
  writeup(pos){if(!AU.ready)return;const d=dest(pos,{rev:.3,gain:1.2,ref:2});for(let i=0;i<9;i++)nz(d,{t:i*.07,dur:.06,a:.004,g:.22,f:rand(3000,4500),q:4});
    voice(d,{t:.75,dur:.35,a:.03,rel:.15,f0:105,f1:88,v:'eh',v2:'oo',rasp:20,raspD:.3,noise:.1,sub:.2,g:.3,drive:2})},
  boom(pos){if(!AU.ready)return;const d=dest(pos,{rev:.8,gain:1.6,ref:12,roll:.6});tone(d,{f:44,f2:26,dur:1.4,a:.01,g:.8});nz(d,{dur:.6,a:.01,g:.4,type:'lowpass',f:160})},
  crunch(run){if(!AU.ready)return;const d=dest(null,{rev:.05,gain:run?.75:.55});nz(d,{dur:.16,a:.004,g:.35,f:rand(1300,1900),q:.8});nz(d,{t:.03,dur:.1,a:.002,g:.25,type:'lowpass',f:500})},
  roofStep(pos){if(!AU.ready)return;const d=dest(pos,{rev:.25,gain:1.2,ref:2});tone(d,{f:90,f2:50,dur:.18,a:.002,g:.5});nz(d,{dur:.08,a:.002,g:.2,f:700,q:2})},
  hatch(pos){if(!AU.ready)return;const d=dest(pos,{rev:.3,gain:1});tone(d,{type:'sawtooth',f:180,f2:120,dur:.9,a:.2,g:.06})},
  chomp(pos){if(!AU.ready)return;const d=dest(pos,{rev:.3,gain:1.3});nz(d,{dur:.1,a:.002,g:.6,f:900,q:1});tone(d,{f:120,f2:50,dur:.25,g:.6});nz(d,{t:.12,dur:.3,a:.02,g:.25,f:500,q:3})},
  hands(pos){if(!AU.ready)return;const d=dest(pos,{rev:.3,gain:1.2});for(let i=0;i<6;i++)nz(d,{t:i*.06,dur:.1,a:.01,g:.25,f:rand(500,900),q:3});voice(d,{t:.1,dur:.8,a:.05,rel:.3,f0:140,f1:110,v:'oo',rasp:25,raspD:.7,noise:.6,sub:.2,g:.25,drive:3})},
  mothHit(pos){if(!AU.ready)return;const d=dest(pos,{rev:.15,gain:1});for(let i=0;i<8;i++)nz(d,{t:i*.03,dur:.03,a:.002,g:.3,f:rand(400,900),q:1.5})},
  smashBulb(pos){if(!AU.ready)return;const d=dest(pos,{rev:.6,gain:1.2,ref:4});for(let i=0;i<8;i++)tone(d,{type:'triangle',f:rand(2500,5200),dur:rand(.05,.2),g:.1,t:rand(0,.1)});nz(d,{dur:.2,g:.3,type:'highpass',f:3000})},
  vanish(pos){if(!AU.ready)return;const d=dest(pos,{rev:.7,gain:1});nz(d,{dur:1.2,a:.3,g:.25,f:900,f2:200,q:2})},
  // ---- additions
  sorted(ok,pos){if(!AU.ready)return;const d=dest(pos,{rev:.3});nz(d,{dur:.15,g:.3,type:'lowpass',f:600});if(ok){tone(d,{t:.15,type:'triangle',f:880,dur:.12,g:.08});tone(d,{t:.26,type:'triangle',f:1320,dur:.15,g:.08})}else tone(d,{t:.15,type:'square',f:150,dur:.3,g:.08})},
  lever(pos){if(!AU.ready)return;const d=dest(pos,{rev:.15});tone(d,{type:'square',f:300,f2:200,dur:.05,g:.08});nz(d,{dur:.06,g:.2,f:1800,q:3})},
  thunk(pos){if(!AU.ready)return;const d=dest(pos,{rev:.35});tone(d,{f:70,f2:40,dur:.35,g:.6});nz(d,{dur:.1,g:.3,type:'lowpass',f:800})},
  ding(pos){if(!AU.ready)return;const d=dest(pos,{rev:.4});tone(d,{f:1318,dur:1.2,a:.005,g:.12})},
  refuel(pos){if(!AU.ready)return;const d=dest(pos,{rev:.2});for(let i=0;i<12;i++)nz(d,{t:i*.09,dur:.08,a:.01,g:.18,f:rand(300,600),q:4})},
  sputter(pos){if(!AU.ready)return;const d=dest(pos,{rev:.4,gain:1.2,ref:4});for(let i=0;i<6;i++){tone(d,{t:i*.18+rand(0,.06),type:'sawtooth',f:55,dur:.1,g:.25});nz(d,{t:i*.18,dur:.08,g:.2,type:'lowpass',f:400})}},
  // ---- shop items
  buy(){if(!AU.ready)return;const d=dest(null,{rev:.2});tone(d,{type:'triangle',f:1568,dur:.25,g:.1});tone(d,{type:'triangle',f:2093,dur:.35,g:.1,t:.08});nz(d,{dur:.1,g:.15,f:5000,q:2})},
  strobe(){if(!AU.ready)return;const d=dest(null,{rev:.2,gain:.9});for(let i=0;i<6;i++){tone(d,{t:i*.07,type:'square',f:3200,dur:.02,a:.001,g:.08});nz(d,{t:i*.07,dur:.03,a:.001,g:.2,type:'highpass',f:5000})}},
  airhorn(pos){if(!AU.ready)return;const d=dest(pos,{rev:.6,gain:1.3,ref:5});for(const f of[415,523,622])tone(d,{type:'sawtooth',f,dur:1.4,a:.02,g:.12})},
  flare(pos){if(!AU.ready)return;const d=dest(pos,{rev:.3});nz(d,{dur:.4,a:.01,g:.4,type:'highpass',f:2000});nz(d,{t:.3,dur:1.5,a:.2,g:.15,f:3500,q:.8})},
  cut(pos){if(!AU.ready)return;const d=dest(pos,{rev:.2});nz(d,{dur:.25,a:.002,g:.45,f:2400,f2:1200,q:2})},
  squeal(pos){if(!AU.ready)return;const d=dest(pos,{rev:.4,gain:1});chitter(d,{n:10,g:.2});voice(d,{t:.05,dur:.7,a:.01,rel:.3,f0:700,f1:1200,v:'ee',rasp:50,raspD:.5,noise:.2,sub:0,g:.35,drive:6})},
  battery(){if(!AU.ready)return;const d=dest(null,{rev:0});tone(d,{type:'square',f:600,dur:.04,g:.06});tone(d,{type:'square',f:1400,dur:.05,g:.06,t:.12})},
  // the shake flashlight: a magnet sliding through the coil, rattling the batteries
  shake(pos){if(!AU.ready)return;const d=dest(pos,{rev:.15,gain:pos?1.2:.6});for(let i=0;i<3;i++){nz(d,{t:i*.07,dur:.05,g:.3,f:rand(1400,2200),q:3});tone(d,{type:'triangle',f:rand(300,380),dur:.04,g:.06,t:i*.07+.02})}},
  // the basement shredder: a motor straining, cardboard torn to strips
  shred(pos){if(!AU.ready)return;const d=dest(pos,{rev:.35,gain:1.3,ref:2});tone(d,{type:'sawtooth',f:58,f2:46,dur:1.3,a:.05,g:.22});nz(d,{dur:1.2,a:.04,g:.45,type:'lowpass',f:700});for(let i=0;i<12;i++)nz(d,{t:i*.09+rand(0,.03),dur:.06,g:.3,f:rand(1200,2600),q:2})},
  // the blind one placing a sound: dry tongue clicks, quick then slow
  clicks(pos){if(!AU.ready)return;const d=dest(pos,{rev:.4,gain:1.3,ref:2.5});for(let i=0;i<7;i++){const t=i<4?i*.07:.28+(i-4)*.22;tone(d,{type:'triangle',f:rand(1700,2300),dur:.018,a:.001,g:.35,t});nz(d,{t,dur:.012,a:.001,g:.25,type:'highpass',f:2500})}},
  drink(){if(!AU.ready)return;const d=dest(null,{rev:0});nz(d,{dur:.15,a:.002,g:.4,f:4000,q:1});for(let i=0;i<4;i++)tone(d,{t:.3+i*.22,f:180,f2:120,dur:.12,g:.15})},
  slam(pos){if(!AU.ready)return;const d=dest(pos,{rev:.6,gain:1.3,ref:4});impact(d,.9);for(let i=0;i<5;i++)nz(d,{t:i*.03,dur:.1,g:.25,f:rand(400,1200),q:2})},
  bulb(pos){if(!AU.ready)return;const d=dest(pos,{rev:.3});for(let i=0;i<4;i++)nz(d,{t:i*.08,dur:.06,g:.15,f:3000,q:5});tone(d,{t:.4,type:'sine',f:2200,dur:.4,g:.06})},
  tick(urgent){if(!AU.ready)return;const d=dest(null,{rev:.15,gain:urgent?1:.7});tone(d,{type:'triangle',f:urgent?2600:2100,dur:.035,a:.001,g:.16});nz(d,{dur:.02,a:.001,g:.1,type:'highpass',f:4000})},
  // every light in the building cutting out at once
  powerDown(){if(!AU.ready)return;const d=dest(null,{rev:.7,gain:1});impact(d,.8);tone(d,{type:'sawtooth',f:120,f2:22,dur:1.8,a:.01,g:.25});
    for(let i=0;i<6;i++)nz(d,{t:rand(0,.5),dur:.05,a:.002,g:.25,type:'highpass',f:3000})},
  hurt(){if(!AU.ready)return;const d=dest(null,{rev:.2});nz(d,{dur:.3,g:.4,type:'lowpass',f:500});tone(d,{f:80,f2:45,dur:.3,g:.5})},
  beat(v){if(!AU.ready)return;const d=dest(null,{rev:0,gain:v});tone(d,{f:58,f2:40,dur:.14,g:.6});tone(d,{f:52,f2:36,dur:.16,g:.45,t:.2})},
  brake(pos){if(!AU.ready)return;const d=dest(pos,{rev:.3,gain:1.2,ref:4});nz(d,{dur:1.3,a:.01,g:.4,type:'highpass',f:2200});tone(d,{type:'sawtooth',f:60,f2:35,dur:.6,g:.2})},
  horn(pos){if(!AU.ready)return;const d=dest(pos,{rev:.4,gain:1.2,ref:5});for(const f of[233,294])tone(d,{type:'square',f,dur:.9,a:.03,g:.13})},
  bell(){if(!AU.ready)return;const d=dest(null,{rev:.6,gain:.7});for(const [f,g] of[[523,.18],[784,.1],[1046,.05]])tone(d,{f,dur:2.4,a:.005,g})},
  creak(pos){if(!AU.ready)return;const d=dest(pos,{rev:.8,gain:1.1,ref:6,roll:.8});const r=Math.random();
    if(r<.4){const o=tone(d,{type:'sawtooth',f:rand(110,180),f2:rand(70,100),dur:rand(1.2,2.2),a:.3,g:.06});}
    else if(r<.75)nz(d,{dur:.7,g:.35,f:rand(200,400),q:4});
    else{for(let i=0;i<3;i++)tone(d,{type:'triangle',f:rand(600,1400),dur:1.2,g:.04,t:i*.08})}},
  locked(){if(!AU.ready)return;const d=dest(null,{rev:.2});for(let i=0;i<3;i++)nz(d,{t:i*.09,dur:.06,g:.3,f:700,q:3})},
  deny(){if(!AU.ready)return;const d=dest(null,{rev:0});tone(d,{type:'square',f:160,dur:.15,g:.08})},
  ok(){if(!AU.ready)return;const d=dest(null,{rev:0});tone(d,{type:'triangle',f:660,dur:.1,g:.1});tone(d,{type:'triangle',f:990,dur:.15,g:.1,t:.08})},
  charge(){if(!AU.ready)return;const d=dest(null,{rev:0});tone(d,{type:'sine',f:1200,dur:.05,g:.04})},
  scream(pos){if(!AU.ready)return;const d=dest(pos,{rev:.6,gain:1,ref:4});tone(d,{type:'sawtooth',f:420,f2:260,dur:.9,a:.03,g:.2});nz(d,{dur:.8,g:.2,f:1300,q:3})},
};

// looping 3D sources
function loop(kind,pos,vol=1){if(!AU.ready)return null;const C=AU.ctx,g=C.createGain();g.gain.value=0;const P=mkPan(pos||{x:0,y:0,z:0},kind==='engine'?5:2,kind==='hum'?2:1.2);g.connect(P);P.connect(AU.out);
  const rs=C.createGain();rs.gain.value=.25;P.connect(rs);rs.connect(AU.rev);
  const nodes=[];const osc=(type,f)=>{const o=C.createOscillator();o.type=type;o.frequency.value=f;o.start();nodes.push(o);return o};
  const ns=()=>{const s=C.createBufferSource();s.buffer=AU.noise;s.loop=true;s.start(0,Math.random());nodes.push(s);return s};
  const filt=(type,f,q=1)=>{const b=C.createBiquadFilter();b.type=type;b.frequency.value=f;b.Q.value=q;return b};
  const lfoTo=(param,f,depth,type='sine')=>{const l=osc(type,f),lg=C.createGain();lg.gain.value=depth;l.connect(lg);lg.connect(param)};
  const amp=(src,base)=>{const a=C.createGain();a.gain.value=base;src.connect(a);a.connect(g);return a};
  if(kind==='engine'){const f=filt('lowpass',240);osc('sawtooth',41).connect(f);osc('sawtooth',42.7).connect(f);const a=amp(f,.5);lfoTo(a.gain,11,.15);const n=filt('lowpass',160);ns().connect(n);amp(n,.5)}
  else if(kind==='beep'){const f=filt('bandpass',1100,2);osc('square',1060).connect(f);const a=amp(f,0);lfoTo(a.gain,1.15,.5,'square');const c=C.createConstantSource();c.offset.value=.5;c.start();nodes.push(c);c.connect(a.gain)}
  else if(kind==='door'){const f=filt('bandpass',650,2.5);ns().connect(f);const a=amp(f,.6);lfoTo(a.gain,17,.5,'square');const m=filt('lowpass',140);osc('sawtooth',55).connect(m);amp(m,.2)}
  else if(kind==='breath'){const f=filt('bandpass',380,1.4);ns().connect(f);const a=amp(f,.5);lfoTo(a.gain,.27,.5);const m=filt('lowpass',180);osc('sawtooth',46).connect(m);const b=amp(m,.12);lfoTo(b.gain,.27,.12)}
  else if(kind==='whisper'){const f=filt('bandpass',1700,4);ns().connect(f);const a=amp(f,.5);lfoTo(a.gain,.8,.5);const f2=filt('bandpass',820,6);ns().connect(f2);const b=amp(f2,.4);lfoTo(b.gain,1.37,.4);lfoTo(f.frequency,.31,500)}
  else if(kind==='growl'){ // a low, unbroken growl: two buzzing throats, a ragged flutter, a little chest rattle
    const f=filt('bandpass',420,2.2),lo=filt('lowpass',260);osc('sawtooth',52).connect(f);osc('sawtooth',77.5).connect(f);osc('sawtooth',52.6).connect(lo);
    const a=amp(f,.45);lfoTo(a.gain,23,.32,'sawtooth');lfoTo(a.gain,.37,.12);lfoTo(f.frequency,.21,90);const b=amp(lo,.6);lfoTo(b.gain,17,.3,'sawtooth');
    const n=filt('bandpass',330,3);ns().connect(n);const c=amp(n,.5);lfoTo(c.gain,29,.4,'square')}
  else if(kind==='crinkle'){const f=filt('highpass',2500,.7);ns().connect(f);const a=amp(f,.0);lfoTo(a.gain,13,.35,'square');lfoTo(a.gain,3.1,.25,'sawtooth')}
  else if(kind==='ice'){const f=filt('bandpass',3200,6);ns().connect(f);const a=amp(f,0);lfoTo(a.gain,7,.5,'square');const l=filt('lowpass',200);osc('sawtooth',40).connect(l);amp(l,.15)}
  else if(kind==='flutter'){const f=filt('bandpass',420,1.5);ns().connect(f);const a=amp(f,.2);lfoTo(a.gain,24,.2,'square')}
  else if(kind==='belt'){const f=filt('lowpass',300);osc('sawtooth',48).connect(f);amp(f,.4);const n=filt('bandpass',900,3);ns().connect(n);const a=amp(n,.15);lfoTo(a.gain,6,.1,'square')}
  else if(kind==='lift'){const f=filt('lowpass',220);osc('sawtooth',62).connect(f);osc('sawtooth',63.5).connect(f);amp(f,.5);const n=filt('bandpass',500,2);ns().connect(n);amp(n,.2)}
  else if(kind==='gen'){const f=filt('lowpass',380);osc('sawtooth',30).connect(f);osc('square',60).connect(f);const a=amp(f,.4);lfoTo(a.gain,15,.12);const n=filt('lowpass',600);ns().connect(n);amp(n,.15)}
  else if(kind==='flare'){const f=filt('bandpass',3500,.8);ns().connect(f);const a=amp(f,.4);lfoTo(a.gain,9,.12)}
  else if(kind==='wind'){ // a storm over a flat roof: a broad roar, a whistle that rises and falls, gusts
    const f=filt('lowpass',420);ns().connect(f);const a=amp(f,.55);lfoTo(a.gain,.11,.3);lfoTo(f.frequency,.07,220);
    const w=filt('bandpass',900,9);ns().connect(w);const b=amp(w,.18);lfoTo(w.frequency,.13,420);lfoTo(b.gain,.19,.16)}
  else if(kind==='hum'){const f=filt('lowpass',500);osc('sawtooth',120).connect(f);amp(f,.35);const n=filt('highpass',6000);ns().connect(n);amp(n,.05)}
  else if(kind==='amb'){const f=filt('lowpass',130);osc('sawtooth',55).connect(f);osc('sawtooth',55.35).connect(f);amp(f,.5);const n=filt('lowpass',220);ns().connect(n);amp(n,.55);
    const w=filt('bandpass',420,1.2);ns().connect(w);const a=amp(w,.12);lfoTo(a.gain,.06,.1);lfoTo(w.frequency,.045,180)}
  const L={g,P,vol,set(v,k=.12){g.gain.setTargetAtTime(v*this.vol,C.currentTime,k)},pos(p){setP(P,p)},stop(){g.gain.setTargetAtTime(0,C.currentTime,.1);setTimeout(()=>{for(const n of nodes)try{n.stop()}catch(e){}try{g.disconnect();P.disconnect();rs.disconnect()}catch(e){}},600)}};
  return L}
function startAmbience(){if(AU.amb)return;AU.amb=loop('amb',{x:0,y:3,z:0});if(AU.amb){AU.amb.P.panningModel='equalpower';AU.amb.P.refDistance=1e4;AU.amb.set(.16,1.5)}}
const _fw=new THREE.Vector3(),_up=new THREE.Vector3(),_cp=new THREE.Vector3();
function auListener(){if(!AU.ready)return;const L=AU.ctx.listener;camera.getWorldPosition(_cp);camera.getWorldDirection(_fw);_up.set(0,1,0).applyQuaternion(camera.quaternion);
  if(L.positionX){L.positionX.value=_cp.x;L.positionY.value=_cp.y;L.positionZ.value=_cp.z;L.forwardX.value=_fw.x;L.forwardY.value=_fw.y;L.forwardZ.value=_fw.z;L.upX.value=_up.x;L.upY.value=_up.y;L.upZ.value=_up.z}
  else{L.setPosition(_cp.x,_cp.y,_cp.z);L.setOrientation(_fw.x,_fw.y,_fw.z,_up.x,_up.y,_up.z)}}
