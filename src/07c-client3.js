// ===================================================================== the two later creatures (models, animation, sound)
Object.assign(SFX,{
  // The long-legged thing is no person and has no voice. Everything it makes is shell and air: a rasp of plates
  // rubbed together (the way crickets call, but the size of a car), mandibles clacking, joints creaking, and air
  // wheezing in and out of holes along its body.
  // It hears something: the plates rasp faster and higher over a deep hollow drone from the body, then three clacks.
  spVoice(pos){if(!AU.ready)return;const d=dest(pos,{rev:.7,gain:1.6,ref:7,roll:.8});
    let t=0;for(let i=0;i<64;i++){const k=i/64;t+=lerp(.034,.017,k)*rand(.85,1.15);nz(d,{t,dur:.013,a:.001,g:(.16+.22*Math.sin(k*Math.PI))*rand(.7,1),f:lerp(2100,3300,k)*rand(.9,1.1),q:7})}
    tone(d,{type:'sawtooth',f:33,f2:44,dur:t+.3,a:.25,g:.22});tone(d,{type:'triangle',f:66,f2:88,dur:t+.2,a:.3,g:.12}); // the body resonating like a drum
    nz(d,{dur:t,a:.3,g:.07,type:'highpass',f:4800}); // breath hissing out of the spiracles
    for(let i=0;i<3;i++){const c=t+.12+i*.13;nz(d,{t:c,dur:.03,g:.55,f:1700,q:5});tone(d,{t:c,f:420,f2:180,dur:.06,g:.2})}},
  // mandibles working while it waits and listens: a short run of uneven clicks
  spChitter(pos){if(!AU.ready)return;const d=dest(pos,{rev:.45,gain:1,ref:4});let t=0;
    for(let i=0,n=randi(5,9);i<n;i++){t+=rand(.028,.075);nz(d,{t,dur:.016,g:rand(.14,.26),f:rand(1700,2700),q:6})}nz(d,{t:t+.04,dur:.12,g:.05,f:3600,q:2})},
  // a leg joint flexing: a dry, rising creak, like an old hinge made of horn
  spCreak(pos){if(!AU.ready)return;const d=dest(pos,{rev:.4,gain:.8,ref:3.5});const f=rand(120,170);
    tone(d,{type:'sawtooth',f,f2:f*rand(1.6,2.1),dur:rand(.25,.4),a:.05,g:.035});nz(d,{dur:.35,a:.05,g:.1,f:rand(650,800),f2:rand(1000,1250),q:14})},
  // one leg tip touching down: a hard, hollow tick of shell on concrete
  spTap(pos){if(!AU.ready)return;const d=dest(pos,{rev:.35,gain:.65,ref:3});nz(d,{dur:.02,g:.32,f:4200,q:6});tone(d,{type:'triangle',f:950,f2:620,dur:.04,g:.08});tone(d,{f:120,f2:70,dur:.07,g:.14})},
  // the legs coming down hard: a heavy thud and the shell cracking against the floor
  spStomp(pos){if(!AU.ready)return;const d=dest(pos,{rev:.6,gain:1.5,ref:8,roll:.7});tone(d,{f:70,f2:30,dur:.55,a:.004,g:.8});nz(d,{dur:.3,a:.003,g:.55,type:'lowpass',f:500,f2:120});
    for(let i=0;i<5;i++)nz(d,{t:i*.035,dur:.03,g:.32,f:rand(2400,3600),q:4});tone(d,{type:'triangle',t:.02,f:340,f2:150,dur:.12,g:.12})},
  // the auditor's scanner: a short two-note beep
  audBeep(pos){if(!AU.ready)return;const d=dest(pos,{rev:.4,gain:.7,ref:3});tone(d,{type:'square',f:1860,dur:.07,g:.12});tone(d,{type:'square',f:1240,t:.11,dur:.09,g:.12})},
  // the error tone when it marks someone, loud and wrong
  audHit(pos){if(!AU.ready)return;const d=dest(pos,{rev:.5,gain:1.3,ref:4,dist:true});tone(d,{type:'sawtooth',f:150,dur:.9,a:.005,g:.5});tone(d,{type:'square',f:420,f2:300,dur:.9,g:.25});
    for(let i=0;i<3;i++)tone(d,{type:'square',f:2400,t:i*.16,dur:.08,g:.18})},
  // a box dragged off a shelf and dropped
  audPull(pos){if(!AU.ready)return;const d=dest(pos,{rev:.4,gain:1,ref:3});nz(d,{dur:.35,g:.3,f:700,f2:300,q:1.2});nz(d,{t:.42,dur:.16,g:.6,type:'lowpass',f:400});tone(d,{t:.42,f:110,f2:60,dur:.18,g:.4})}});

// ---------------------------------------------------------------- the long-legged thing: model
const SP_HIPS=[.35,.95,1.65,2.4].flatMap(a=>[a,-a]); // the angle of each hip round the body (0 = straight ahead)
function makeSpider(){const g=new THREE.Group(),sk=MAT.spSkin||(MAT.spSkin=toon(0x2c1638,{map:TEX.lskin})),dk=MAT.spDark||(MAT.spDark=toon(0x150a1c));
  const body=pivot(0,0,0,g);part(GEO.sph,sk,1.2,.3,1.45,0,0,0,body);part(GEO.sph,dk,1.0,.22,1.2,0,-.12,0,body,{cast:false}); // a flat, wide body with a darker belly
  for(let i=0;i<5;i++)part(GEO.box,dk,.8-Math.abs(i-2)*.12,.04,.08,0,.27,-.75+i*.38,body,{cast:false}); // ridges along the back
  const head=pivot(0,-.02,1.38,body);part(GEO.sph,sk,.34,.24,.3,0,0,.08,head);part(GEO.sph,dk,.2,.12,.12,0,-.08,.3,head,{cast:false}); // a short, blunt head, no eyes at all
  const legs=SP_HIPS.map(a=>{const hip={x:Math.sin(a)*.95,y:-.05,z:Math.cos(a)*1.1};part(GEO.sph,dk,.16,.14,.16,hip.x,hip.y,hip.z,body,{cast:false});
    return{a,hip,fem:part(GEO.cyl,sk,.075,1,.075,0,0,0,g),tib:part(GEO.cyl,sk,.055,1,.055,0,0,0,g),knee:part(GEO.sph,dk,.1,.1,.1,0,0,0,g,{cast:false}),
      foot:null,from:null,st:-1,r:0}});
  g.userData={body,head,legs,ty:15};return g}
const _spUp=new THREE.Vector3(0,1,0),_spQ=new THREE.Quaternion(),_spV=new THREE.Vector3();
function boneBetween(m,a,b){_spV.set(b.x-a.x,b.y-a.y,b.z-a.z);const L=_spV.length()||1e-3;m.position.set((a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2);_spQ.setFromUnitVectors(_spUp,_spV.multiplyScalar(1/L));m.quaternion.copy(_spQ);m.scale.y=L}
// two-bone reach from hip to foot with the knee bent up and out
function legIK(H,F,L1,L2,out){let dx=F.x-H.x,dy=F.y-H.y,dz=F.z-H.z,d=Math.hypot(dx,dy,dz);const dm=Math.min(L1+L2-.01,Math.max(Math.abs(L1-L2)+.01,d));
  if(d<1e-4){dx=out.x;dy=0;dz=out.z;d=1}const ux=dx/d,uy=dy/d,uz=dz/d;const a=(L1*L1-L2*L2+dm*dm)/(2*dm),h=Math.sqrt(Math.max(0,L1*L1-a*a));
  // the bend direction: up, tipped outward, made square to the hip-foot line
  let bx=out.x*.15,by=1,bz=out.z*.15;const k=bx*ux+by*uy+bz*uz;bx-=ux*k;by-=uy*k;bz-=uz*k;const bl=Math.hypot(bx,by,bz)||1;
  return{x:H.x+ux*a+bx/bl*h,y:H.y+uy*a+by/bl*h,z:H.z+uz*a+bz/bl*h}}
function animSpider(v,dt,time){const g=v.g,u=g.userData,a=v.a,ry=g.rotation.y,c=Math.cos(ry),s=Math.sin(ry),gx=g.position.x,gy=g.position.y,gz=g.position.z;
  const toL=(x,y,z)=>{const dx=x-gx,dz=z-gz;return{x:dx*c-dz*s,y:y-gy,z:dx*s+dz*c}};
  const vx=(gx-(v.px??gx))/Math.max(dt,1e-3),vz=(gz-(v.pz??gz))/Math.max(dt,1e-3);v.px=gx;v.pz=gz;
  const low=gy<2.6,stomp=a===3;v.stT=stomp?(v.stT||0)+dt:0;const near=Math.hypot(gx-ME.x,gz-ME.z)<22;
  let stepping=u.legs.filter(l=>l.st>=0).length;
  // its mandibles work while it stands and listens (and now and then as it walks)
  if(near&&!stomp){v.chT=(v.chT??rand(1,3))-dt*(a===0?1:.4);if(v.chT<=0){v.chT=rand(2.2,5.5);SFX.spChitter({x:gx,y:gy-.3,z:gz})}}
  u.body.rotation.z=damp(u.body.rotation.z,stomp?Math.sin(v.stT*18)*.06:0,10,dt);u.body.position.y=stomp?Math.abs(Math.sin(v.stT*9))*-.15:damp(u.body.position.y,0,6,dt);
  u.head.rotation.x=damp(u.head.rotation.x,a===0?Math.sin(time*.8)*.15:a===2?.2:.05,4,dt);u.head.rotation.y=a===0?Math.sin(time*.5+v.ph)*.3:damp(u.head.rotation.y,0,3,dt);
  u.legs.forEach((l,i)=>{const R=low?2.6:4.1,lead=.32;
    const ix=gx+(Math.sin(l.a)*R*c+Math.cos(l.a)*R*s)+vx*lead,iz=gz+(-Math.sin(l.a)*R*s+Math.cos(l.a)*R*c)+vz*lead;
    if(!l.foot){l.foot={x:ix,z:iz}}
    // a leg whose foot would come down on a rack (or anything else) folds up into the body, and they all fold in to crouch
    const blocked=insideAny(ix,iz,.12)||insideAny(l.foot.x,l.foot.z,.05);l.r=damp(l.r,low?.72:blocked?1:0,blocked?7:4,dt);
    if(l.st<0&&!stomp){const far=Math.hypot(ix-l.foot.x,iz-l.foot.z);if((far>1.25||(blocked&&far>.3))&&stepping<4&&(i%2)===((Math.floor(time*3.3)+(i>>1))%2)){l.st=0;l.from={...l.foot};stepping++;if(near&&Math.random()<.12)SFX.spCreak({x:gx,y:gy,z:gz})}}
    let fy=0;if(l.st>=0){l.st+=dt/(a===2?.2:.3);const k=Math.min(1,l.st);l.foot.x=lerp(l.from.x,ix,k);l.foot.z=lerp(l.from.z,iz,k);fy=Math.sin(k*Math.PI)*.9;
      if(k>=1){l.st=-1;if(near&&l.r<.5&&Math.random()<.5)SFX.spTap({x:l.foot.x,y:0,z:l.foot.z})}}
    if(stomp){fy=Math.max(0,Math.sin(v.stT*9+(i%2)*Math.PI))*1.5;l.foot.x=damp(l.foot.x,ix,6,dt);l.foot.z=damp(l.foot.z,iz,6,dt)}
    const F=toL(l.foot.x,fy,l.foot.z),H=l.hip,out={x:Math.sin(l.a),z:Math.cos(l.a)};
    // folded: the foot tucks up under the hip, and both bones shrink back into the body
    const T={x:H.x*.55,y:H.y-.25,z:H.z*.55},r=l.r,P={x:lerp(F.x,T.x,r),y:lerp(F.y,T.y,r),z:lerp(F.z,T.z,r)},sc=1-.82*r;
    const L1=3.5*sc,L2=4.4*sc,K=legIK(H,P,L1,L2,out);boneBetween(l.fem,H,K);boneBetween(l.tib,K,P);l.knee.position.set(K.x,K.y,K.z);l.knee.visible=r<.9;
    const hide=r>.97;l.fem.visible=l.tib.visible=!hide})}

// ---------------------------------------------------------------- the auditor: model
function makeAuditor(){const g=new THREE.Group(),coat=MAT.audCoat||(MAT.audCoat=toon(0x6b6d68,{map:TEX.lskin})),sk=MAT.audSkin||(MAT.audSkin=toon(0xb9b2a4)),dk=MAT.lurkDark;
  const body=pivot(0,0,0,g),legs=[];for(const s of[-1,1]){const hip=pivot(s*.1,1.5,0,body);part(GEO.cyl,dk,.05,1.5,.05,0,-.75,0,hip);part(GEO.box,dk,.09,.05,.22,0,-1.48,.05,hip);legs.push(hip)}
  const torso=pivot(0,1.5,0,body);part(GEO.cyl,coat,.17,.95,.12,0,.47,0,torso);part(GEO.cyl,coat,.2,.75,.14,0,-.2,0,torso); // the long coat hangs below the hips
  part(GEO.box,MAT.dark,.06,.08,.01,.1,.75,.125,torso,{cast:false}); // a name badge with nothing on it
  const arms=[];for(const s of[-1,1]){const sh=pivot(s*.21,.9,0,torso);part(GEO.cyl,coat,.045,.8,.045,0,-.4,0,sh);const el=pivot(0,-.8,0,sh);part(GEO.cyl,sk,.03,.75,.03,0,-.37,0,el);
    for(let f=-1;f<=1;f++)part(GEO.cyl,sk,.01,.2,.01,f*.018,-.82,0,el,{cast:false});arms.push({sh,el})}
  const neck=pivot(0,.95,0,torso);part(GEO.cyl,sk,.04,.6,.04,0,.3,0,neck);
  const head=pivot(0,.62,0,neck);part(GEO.box,sk,.46,.3,.07,0,.12,0,head);part(GEO.box,dk,.48,.03,.08,0,.12,0,head,{cast:false}); // a flat slab of a face
  const slit=part(GEO.box,MAT.audRed||(MAT.audRed=basic(0xff2a1a)),.42,.018,.02,0,.12,.04,head,{cast:false});
  // the scan line: a thin red fan out to 9 m
  const fanG=new THREE.ConeGeometry(1,1,24,1,true).rotateX(-Math.PI/2).translate(0,0,.5);const fan=new THREE.Mesh(fanG,new THREE.MeshBasicMaterial({color:0xff2010,transparent:true,opacity:.11,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false}));
  fan.scale.set(3.3,.025,9);fan.position.set(0,.12,.05);head.add(fan);
  g.userData={body,torso,neck,head,legs,arms,slit,fan,ty:16};return g}
function animAuditor(v,dt,time){const u=v.g.userData,a=v.a,t=time+v.ph,mv=a===2;v.gp=(v.gp||0)+(mv?dt*3.2:0);
  u.legs.forEach((l,i)=>l.rotation.x=mv?Math.sin(v.gp+i*Math.PI)*.38:0);u.torso.rotation.x=damp(u.torso.rotation.x,mv?.08:.02,4,dt);
  u.arms.forEach(({sh,el},i)=>{sh.rotation.x=damp(sh.rotation.x,a===1&&i===0?-1.1:mv?-Math.sin(v.gp+i*Math.PI)*.25:.05,4,dt);el.rotation.x=damp(el.rotation.x,a===1&&i===0?-.5:-.1,4,dt)});
  // scanning, the head sweeps slowly up and down; walking it holds still and the line points ahead
  u.neck.rotation.x=damp(u.neck.rotation.x,a===1?.15+Math.sin(t*2.1)*.22:.05,5,dt);u.head.rotation.z=a===1?Math.sin(t*1.3)*.05:0;
  u.fan.material.opacity=.05+Math.sin(t*40)*.012;u.slit.scale.x=.42*(.9+Math.sin(t*30)*.1);
  v.bt=(v.bt??rand(.5,1.5))-dt;if(v.bt<=0){v.bt=a===1?1.1:2.4;if(Math.hypot(v.g.position.x-ME.x,v.g.position.z-ME.z)<26)SFX.audBeep({x:v.g.position.x,y:2.7,z:v.g.position.z})}}

// ---------------------------------------------------------------- hooks
function animMonster3(v,dt,time){if(v.ty===17)animJan(v,dt,time);else if(v.ty===15)animSpider(v,dt,time);else if(v.ty===16)animAuditor(v,dt,time)}
function fearOf3(v,d){if(v.ty===17)return janFear(v,d);if(v.ty===15)return clamp(1-d/14,0,1)*(v.a===2||v.a===3?1.2:.55);if(v.ty===16)return clamp(1-d/10,0,1)*.7;return null}
function onEvent3(e){const P=(x,z,y=1)=>({x,y,z});
  if(onEventJan(e))return true;
  switch(e.e){
  case 'spHear':SFX.spVoice(P(e.x,e.z,4.4));return true;
  case 'spStomp':{SFX.spStomp(P(e.x,e.z,.2));const d=Math.hypot(e.x-ME.x,e.z-ME.z);ME.shake=Math.max(ME.shake,clamp(1-d/16,0,1)*.6);return true}
  case 'audIn':SFX.audBeep(P(e.x,e.z,2.7));return true;
  case 'audPull':SFX.audPull(P(e.x,e.z,1));return true;
  case 'audHit':SFX.audHit(P(e.x,e.z,2.7));return true;
  case 'audOff':SFX.audHit(P(e.x,e.z,2.7));return true}
  return false}
