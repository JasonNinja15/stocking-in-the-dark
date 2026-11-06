// ===================================================================== client: hand carts
// Your own cart is drawn from your own movement (so it never lags behind you), a crewmate's from their smoothed
// avatar, and a parked one where the host says it is.
const CARTV=[];
const myCart=()=>S&&S.carts?S.carts.findIndex(c=>c.by===NET.myId):-1;
function cartPose(i){const c=S.carts[i];if(!c)return null;
  if(c.by&&c.by===NET.myId)return{x:ME.x-Math.sin(ME.yaw)*CART_OFF,z:ME.z-Math.cos(ME.yaw)*CART_OFF,ry:ME.yaw+Math.PI};
  const av=c.by&&AV.get(c.by);if(av)return{x:av.x-Math.sin(av.yaw)*CART_OFF,z:av.z-Math.cos(av.yaw)*CART_OFF,ry:av.yaw+Math.PI};
  return{x:c.x,z:c.z,ry:c.ry}}
function syncCarts(dt){const n=S&&S.carts?S.carts.length:0;
  for(let i=0;i<Math.max(n,CARTV.length);i++){let v=CARTV[i];
    if(i>=n){if(v){v.g.visible=false;if(v.snd)v.snd.set(0,.1)}continue}
    const P=cartPose(i);
    if(!v){const g=makeCart();ROOT.add(g);g.position.set(P.x,0,P.z);g.rotation.y=P.ry;
      const hit=new THREE.Mesh(GEO.box,basic(0));hit.scale.set(.8,1.15,1.2);hit.position.set(0,.55,0);hit.visible=false;hit.userData={kind:'cart',i};g.add(hit);FORKPICK.push(hit);
      v=CARTV[i]={g,snd:null,sw:0}}
    const g=v.g,u=g.userData,ox=g.position.x,oz=g.position.z;g.visible=true;
    if(S.carts[i].by===NET.myId||Math.hypot(P.x-ox,P.z-oz)>3){g.position.set(P.x,0,P.z);g.rotation.y=P.ry}
    else{g.position.x=damp(ox,P.x,14,dt);g.position.z=damp(oz,P.z,14,dt);g.rotation.y=angLerp(g.rotation.y,P.ry,1-Math.exp(-14*dt))}
    // wheels turn with the distance rolled; the front casters trail round to the way it's going
    const dx=g.position.x-ox,dz=g.position.z-oz,d=Math.hypot(dx,dz),ry=g.rotation.y,lz=dx*Math.sin(ry)+dz*Math.cos(ry),lx=dx*Math.cos(ry)-dz*Math.sin(ry);
    const sp=d/Math.max(dt,1e-3);for(const w of u.wheels)w.rotation.x+=(lz<0?-d:d)/.09;
    if(sp>.2){let a=Math.atan2(lx,lz);if(a>Math.PI/2)a-=Math.PI;else if(a<-Math.PI/2)a+=Math.PI;v.sw=damp(v.sw,a,6,dt)}
    for(const s of u.swivel)s.rotation.y=v.sw;
    if(AU.ready){if(!v.snd)v.snd=loop('cart',{x:P.x,y:.2,z:P.z},.35);if(v.snd){v.snd.pos({x:g.position.x,y:.2,z:g.position.z});v.snd.set(sp>.25?clamp(sp/3.2,.2,.8):0,.08)}}}}
// a box riding on someone's cart: two piles along the deck, filled in the order they were loaded
function cartBoxPose(b,h){const i=S.carts?S.carts.findIndex(c=>c.by===b.h):-1,v=CARTV[i];if(i<0||!v||!h)return null;
  const pile=[...(h.stack||[]),h.carry].map(id=>S.boxes.find(x=>x.id===id)).filter(Boolean),k=pile.indexOf(b);if(k<0)return null;
  let y=.28;for(let j=k%2;j<k;j+=2)y+=BOX_KINDS[pile[j].k].h;
  const g=v.g,ry=g.rotation.y,lz=k%2?-.2:.25;return{x:g.position.x+Math.sin(ry)*lz,y,z:g.position.z+Math.cos(ry)*lz,ry:ry+((b.id*37)%7-3)*.03}}
// pushing: the cart is a body of its own, two circles ahead of you, and it stops where it can't go
function cartCollide(p){const fx=-Math.sin(ME.yaw),fz=-Math.cos(ME.yaw);
  for(const off of[.72,1.3]){const c={x:p.x+fx*off,z:p.z+fz*off},x0=c.x,z0=c.z;collideCircle(c,.36);
    c.x=clamp(c.x,WH.x0+.4,WH.x1-.4);c.z=Math.min(c.z,WH.z1-.4);
    if(c.z<WH.z0+.4){let ok=false;BAYS.forEach((b,i)=>{const tr=S.trucks[i];if(bayOn(i)&&tr&&tr.st===2&&Math.abs(c.x-b.x)<TRAIL_HW-.35)ok=true});
      if(!ok)c.z=WH.z0+.4;else c.z=Math.max(c.z,TZ_DOCK-TRAIL_LEN+.45)}
    p.x+=c.x-x0;p.z+=c.z-z0}
  collideCircle(p,.32)}
// half the slowdown boxes would give you in your arms
const cartSlow=s=>1-(1-s)/2;
// boxes on the cart you're pushing turn see-through for you (and only you), so the stack never blocks your view
function boxGhost(m,on){const u=m.userData;if(!!u.gh===on)return;
  if(on){if(!u.ghMat){const mk=x=>{const c=x.clone();c.transparent=true;c.opacity=.22;c.depthWrite=false;return c};u.solidMat=m.material;u.ghMat=Array.isArray(m.material)?m.material.map(mk):mk(m.material)}
    m.material=u.ghMat;m.castShadow=false}else{m.material=u.solidMat||m.material;m.castShadow=true}u.gh=on}
