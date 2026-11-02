// ===================================================================== world
// Static geometry is merged per material so the whole building is a few dozen draw calls.
const STAT=new Map();
function sg(mat,geo,cast=true){const k=mat.uuid+(cast?'c':'n');let e=STAT.get(k);if(!e)STAT.set(k,e={mat,cast,geos:[]});e.geos.push(geo);return geo}
function uvs(g,su,sv){const a=g.attributes.uv.array;for(let i=0;i<a.length;i+=2){a[i]*=su;a[i+1]*=sv}return g}
function sbox(mat,w,h,d,x,y,z,{ry=0,cast=true,uv=null}={}){const g=new THREE.BoxGeometry(w,h,d);if(uv)uvs(g,uv[0],uv[1]);if(ry)g.rotateY(ry);g.translate(x,y,z);return sg(mat,g,cast)}
function scyl(mat,rt,rb,h,x,y,z,{seg=10,rx=0,rz=0,cast=true}={}){const g=new THREE.CylinderGeometry(rt,rb,h,seg);if(rx)g.rotateX(rx);if(rz)g.rotateZ(rz);g.translate(x,y,z);return sg(mat,g,cast)}
function flushStatics(parent=scene){for(const e of STAT.values()){const m=new THREE.Mesh(mergeGeometries(e.geos),e.mat);m.castShadow=e.cast;m.receiveShadow=true;m.matrixAutoUpdate=false;m.updateMatrix();parent.add(m);for(const g of e.geos)g.dispose()}STAT.clear()}

// colliders: axis-aligned rectangles in xz. `on` toggles the dynamic ones (doors, trailers).
const COL=[];
function col(x0,z0,x1,z1,o={}){const c={x0:Math.min(x0,x1),z0:Math.min(z0,z1),x1:Math.max(x0,x1),z1:Math.max(z0,z1),on:true,dyn:false,...o};COL.push(c);return c}

const SLOTS=[];      // shelf slots: {id,x,y,z,box,old}
const INTER=[];      // interactable static meshes (charger, aid, panels, exit)
const LAMPV=[];      // lamp visuals
const BAYV=[];       // per-bay door/indicator visuals and colliders
let ROOT;

function buildWorld(){
  ROOT=new THREE.Group();scene.add(ROOT);
  // floor and ceiling
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(60,40).rotateX(-Math.PI/2),MAT.floor);fl.receiveShadow=true;ROOT.add(fl);
  sbox(MAT.ceil,61,.3,41,0,WH.h+.15,0,{cast:false});
  for(let x=-27;x<=27;x+=6)sbox(MAT.dark,.35,.6,40,x,WH.h-.3,0);            // roof trusses
  for(let z=-16;z<=16;z+=8)sbox(MAT.dark,60,.25,.25,0,WH.h-.7,z);

  // outer walls; the north wall has the two bay openings
  const wt=.4,H=WH.h;
  const wallSeg=(x0,x1,z,y0=0,y1=H)=>{const w=x1-x0,h=y1-y0;sbox(MAT.wall,w,h,wt,(x0+x1)/2,(y0+y1)/2,z,{cast:false,uv:[w/2.2,h/2.2]})};
  const xs=[WH.x0-wt];for(const b of [...BAYS].sort((a,c)=>a.x-c.x))xs.push(b.x-DOOR_HW,b.x+DOOR_HW);xs.push(WH.x1+wt); // west to east
  for(let i=0;i<xs.length;i+=2){wallSeg(xs[i],xs[i+1],WH.z0-wt/2);col(xs[i],WH.z0-wt,xs[i+1],WH.z0)}
  for(const b of BAYS)wallSeg(b.x-DOOR_HW,b.x+DOOR_HW,WH.z0-wt/2,DOOR_H,H);
  wallSeg(WH.x0-wt,WH.x1+wt,WH.z1+wt/2);col(WH.x0-wt,WH.z1,WH.x1+wt,WH.z1+wt);
  {const g=new THREE.BoxGeometry(wt,H,40);uvs(g,40/2.2,H/2.2);g.translate(WH.x0-wt/2,H/2,0);sg(MAT.wall,g,false);col(WH.x0-wt,WH.z0,WH.x0,WH.z1)}
  {const g=new THREE.BoxGeometry(wt,H,40);uvs(g,40/2.2,H/2.2);g.translate(WH.x1+wt/2,H/2,0);sg(MAT.wall,g,false);col(WH.x1,WH.z0,WH.x1+wt,WH.z1)}
  // dark wainscot band and floor kick
  sbox(MAT.dark,60,1,.02,0,.5,WH.z1-.01,{cast:false});
  for(let i=0;i<xs.length;i+=2)sbox(MAT.dark,xs[i+1]-xs[i],1,.02,(xs[i]+xs[i+1])/2,.5,WH.z0+.01,{cast:false}); // not across the bay openings
  for(const x of[WH.x0+.01,WH.x1-.01])sbox(MAT.dark,.02,1,40,x,.5,0,{cast:false});

  // ---- loading bays
  BAYS.forEach((b,i)=>{
    sbox(MAT.hazard,DOOR_HW*2+.6,.012,3,b.x,.006,WH.z0+1.5,{cast:false,uv:[6,1]});
    sbox(MAT.yellow,.1,.012,6,b.x-DOOR_HW-.4,.007,WH.z0+3,{cast:false});sbox(MAT.yellow,.1,.012,6,b.x+DOOR_HW+.4,.007,WH.z0+3,{cast:false});
    // frame, bumpers, seals (the seals also close the gap beside a docked trailer)
    sbox(MAT.yellow,.18,DOOR_H,.5,b.x-DOOR_HW-.09,DOOR_H/2,WH.z0-.15);sbox(MAT.yellow,.18,DOOR_H,.5,b.x+DOOR_HW+.09,DOOR_H/2,WH.z0-.15);
    sbox(MAT.dark,DOOR_HW*2+.4,.5,.6,b.x,DOOR_H+.25,WH.z0-.2); // door drum housing
    for(const s of[-1,1]){sbox(MAT.rubber,.42,DOOR_H,.9,b.x+s*1.5,DOOR_H/2,WH.z0-.85);col(b.x+s*1.25,WH.z0-1.3,b.x+s*1.75,WH.z0-.4);
      sbox(MAT.rubber,.3,.35,.22,b.x+s*(DOOR_HW+.05),.55,WH.z0+.11)} // bumpers sit on the wall face, clear of the trailer
    // roll door
    const door=new THREE.Group();const panel=new THREE.Mesh(GEO.box,toon(0x8a8f92,{map:TEX.wall}));panel.scale.set(DOOR_HW*2,DOOR_H,.08);panel.castShadow=true;panel.receiveShadow=true;door.add(panel);
    door.position.set(b.x,0,WH.z0-.05);ROOT.add(door);
    const doorCol=col(b.x-DOOR_HW,WH.z0-wt,b.x+DOOR_HW,WH.z0,{dyn:true});
    // status lamp above the door + the dock control panel
    const ind=new THREE.Mesh(GEO.sph,MAT.red.clone());ind.scale.setScalar(.12);ind.position.set(b.x+DOOR_HW+.4,DOOR_H+.4,WH.z0+.1);ROOT.add(ind);
    const pnl=new THREE.Mesh(GEO.box,toon(0x30343a));pnl.scale.set(.5,.7,.16);pnl.position.set(b.x+DOOR_HW+.75,1.35,WH.z0+.08);pnl.castShadow=true;ROOT.add(pnl);
    const scr=new THREE.Mesh(new THREE.PlaneGeometry(.36,.22),basic(0x8a1a12));scr.position.set(b.x+DOOR_HW+.75,1.48,WH.z0+.165);ROOT.add(scr);
    const btn=new THREE.Mesh(GEO.cyl,basic(0xd02020));btn.scale.set(.06,.04,.06);btn.rotation.x=Math.PI/2;btn.position.set(b.x+DOOR_HW+.75,1.2,WH.z0+.17);ROOT.add(btn);
    pnl.userData={kind:'panel',bay:i};INTER.push(pnl);
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.2,1.1),toon(0xffffff,{map:signTex([{t:'BAY '+b.name,bold:true,size:120}],{bg:'#c9a227',fg:'#16130c'})}));sign.position.set(b.x,DOOR_H+1.35,WH.z0+.02);ROOT.add(sign);
    // trailer walls collide only while a truck is docked
    const tc=[col(b.x-TRAIL_HW-.25,TZ_DOCK-TRAIL_LEN-.3,b.x-TRAIL_HW,TZ_DOCK,{dyn:true,on:false}),col(b.x+TRAIL_HW,TZ_DOCK-TRAIL_LEN-.3,b.x+TRAIL_HW+.25,TZ_DOCK,{dyn:true,on:false}),col(b.x-TRAIL_HW-.25,TZ_DOCK-TRAIL_LEN-.3,b.x+TRAIL_HW+.25,TZ_DOCK-TRAIL_LEN,{dyn:true,on:false})];
    // a bay that isn't in service yet: its steel door stays down, barred with two hazard beams
    let boards=null;if(b.add){boards=new THREE.Group();const ht=TEX.hazard.clone();ht.repeat.set(12,.7);ht.needsUpdate=true;const hm=toon(0xffffff,{map:ht});for(const y of[.95,2.35]){const p=new THREE.Mesh(GEO.box,hm);p.scale.set(DOOR_HW*2+.7,.24,.08);p.position.set(b.x,y,WH.z0+.1);p.castShadow=true;boards.add(p);
      for(const s of[-1,1]){const k=new THREE.Mesh(GEO.box,MAT.steel);k.scale.set(.14,.36,.14);k.position.set(b.x+s*(DOOR_HW+.2),y,WH.z0+.12);boards.add(k)}}
      const s2=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.55),toon(0xffffff,{map:signTex([{t:'NOT IN SERVICE',size:44,bold:true}],{w:384,h:140,bg:'#c9a227',fg:'#16130c'})}));s2.position.set(b.x,1.7,WH.z0+.11);boards.add(s2);ROOT.add(boards)}
    BAYV.push({door,panel,doorCol,trailCol:tc,ind,scr,boards});
  });
  // outside: a lower yard so the void beyond the bay doors isn't a floating floor
  const yard=new THREE.Mesh(new THREE.PlaneGeometry(80,50).rotateX(-Math.PI/2),toon(0x1a1a1c));yard.position.set(0,-1.25,-46);ROOT.add(yard);

  // ---- charging dock + first aid, between the bays
  {const cx=STATION.charger.x,ax=STATION.aid.x,z=WH.z0;
    sbox(MAT.dark,.9,1.2,.25,cx,1.3,z+.13);
    const ch=new THREE.Mesh(GEO.box,toon(0x2c3036));ch.scale.set(.6,.35,.3);ch.position.set(cx,1.2,z+.3);ch.userData={kind:'charger'};ROOT.add(ch);INTER.push(ch);
    const cl=new THREE.Mesh(GEO.box,basic(0x37ff8a));cl.scale.set(.42,.06,.02);cl.position.set(cx,1.42,z+.46);ROOT.add(cl);BAYV.chargeLed=cl;
    const aid=new THREE.Mesh(GEO.box,toon(0xd8d4c8));aid.scale.set(.6,.6,.2);aid.position.set(ax,1.45,z+.12);aid.userData={kind:'aid'};ROOT.add(aid);INTER.push(aid);
    sbox(MAT.red,.36,.1,.02,ax,1.45,z+.23,{cast:false});sbox(MAT.red,.1,.36,.02,ax,1.45,z+.23,{cast:false});
    const st=new THREE.Mesh(new THREE.PlaneGeometry(1.6,.5),toon(0xffffff,{map:signTex([{t:'CHARGE · FIRST AID',size:46}],{h:150,bg:'#2a2d33',fg:'#d8d2bd'})}));st.position.set(0,2.15,z+.02);ROOT.add(st);}
  // posters
  const poster=(lines,x,z,ry,w=1.2,h=1.6,bg='#d6cfb8',fg='#1a1410')=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),toon(0xffffff,{map:signTex(lines,{w:384,h:512,bg,fg})}));m.position.set(x,1.9,z);m.rotation.y=ry;ROOT.add(m)};
  poster([{t:'KEEP',size:70,bold:true},{t:'THE LIGHTS',size:62,bold:true},{t:'ON',size:70,bold:true}],4.2,WH.z0+.02,0);
  poster([{t:'REPORT',size:52},{t:'ANY BOX',size:52},{t:'THAT MOVES',size:46},{t:'— Mgmt',size:32}],-4.2,WH.z0+.02,0);
  poster([{t:'DO NOT',size:60,bold:true},{t:'ENTER',size:60,bold:true},{t:'TRAILERS',size:50},{t:'THAT BREATHE',size:40}],WH.x1-.02,-10.4,-Math.PI/2,1.2,1.6,'#e0c341','#141005');
  poster([{t:'DAYS SINCE',size:44},{t:'LAST',size:44},{t:'INCIDENT',size:44},{t:'0',size:120,bold:true}],WH.x0+.02,-12,Math.PI/2);
  {const m=new THREE.Mesh(new THREE.PlaneGeometry(9,2.2),toon(0xffffff,{transparent:true,map:signTex([{t:'DOCK 13',size:170,bold:true}],{w:1024,h:256,bg:'rgba(0,0,0,0)',fg:'rgba(200,190,160,.55)',border:false,dirt:false})}));m.position.set(0,5.4,WH.z0+.02);ROOT.add(m)}

  // ---- racks: 3 columns x 4 rows, 8 bays x 3 levels each
  let sid=0;
  for(const rz of RACK_ROWS)for(const rx of RACK_COLS){
    for(let i=0;i<=8;i++){const x=rx+i*2;for(const s of[-.5,.5])sbox(MAT.rackBlue,.09,3.7,.09,x,1.85,rz+s)}
    for(const ly of[...RACK_LEVELS,3.66])for(const s of[-.5,.5])sbox(MAT.rackOrange,RACK_LEN,.1,.06,rx+RACK_LEN/2,ly-.05,rz+s);
    for(const ly of RACK_LEVELS){sbox(MAT.deck,RACK_LEN,.03,1.0,rx+RACK_LEN/2,ly-.015,rz);for(let i=0;i<8;i++){const x=rx+1+i*2;
      const old=Math.random()<.34;SLOTS.push({id:sid++,x,y:ly,z:rz,box:-1,old});
      if(old){const k=BOX_KINDS[randi(0,2)];const n=randi(1,2);let y=ly;for(let j=0;j<n&&y+k.h<ly+1.1;j++){sbox(MAT.old,k.w*rand(.95,1.25),k.h,k.d*rand(.95,1.15),x+rand(-.3,.3),y+k.h/2,rz+rand(-.1,.1),{ry:rand(-.15,.15)});y+=k.h}}}}
    for(let i=0;i<8;i++)for(const s of[-.5,.5])sbox(MAT.rackBlue,.04,.04,1.0,rx+.04+i*2,.6+s*0,rz,{cast:false});
    col(rx-.06,rz-.56,rx+RACK_LEN+.06,rz+.56,{rack:true});
  }
  // floor lines along the aisles
  for(const rz of RACK_ROWS)for(const rx of RACK_COLS)for(const s of[-1,1])sbox(MAT.yellow,RACK_LEN+.4,.01,.08,rx+RACK_LEN/2,.006,rz+s*.85,{cast:false});
  for(const x of[-9.5,9.5])sbox(MAT.yellow,.1,.01,25,x,.006,1.5,{cast:false});

  // dock area steel columns
  for(const x of[-5.5,5.5])for(const z of[-12.5]){sbox(MAT.steel,.45,WH.h,.45,x,WH.h/2,z);sbox(MAT.hazard,.5,1.2,.5,x,.6,z,{uv:[1,1]});col(x-.25,z-.25,x+.25,z+.25)}

  // ---- office (south-west)
  {const z=14,x1=-21,h=3.2;
    const wall=(x0,x1_,z0,z1)=>{sbox(MAT.wall,Math.max(.15,x1_-x0),h,Math.max(.15,z1-z0),(x0+x1_)/2,h/2,(z0+z1)/2,{uv:[2,1.3]});col(x0,z0,x1_,z1)};
    wall(WH.x0,-24.4,z-.08,z+.08);wall(-22.9,x1,z-.08,z+.08);sbox(MAT.wall,1.5,h-2.3,.16,-23.65,2.3+(h-2.3)/2,z);
    wall(x1-.08,x1+.08,z,WH.z1);sbox(MAT.dark,9.2,.12,6.1,(WH.x0+x1)/2,h+.06,(z+WH.z1)/2);
    sbox(MAT.desk,1.8,.08,.8,-27,.78,18.6);for(const dx of[-.8,.8])for(const dz of[-.35,.35])sbox(MAT.dark,.06,.78,.06,-27+dx,.39,18.6+dz);col(-27.95,18.15,-26.05,19.05);
    sbox(MAT.paper,.6,.5,.5,-26.6,1.07,18.8);const scr=new THREE.Mesh(new THREE.PlaneGeometry(.42,.32),MAT.screen);scr.position.set(-26.6,1.09,18.54);scr.rotation.y=Math.PI;ROOT.add(scr);LAMPV.crt=scr;
    sbox(MAT.dark,.5,.05,.5,-27.3,.48,17.7);sbox(MAT.dark,.5,.55,.05,-27.3,.75,17.45);col(-27.6,17.4,-27,18);
    sbox(MAT.steel,.6,1.4,.6,-29.6,.7,15);col(-29.95,14.65,-29.25,15.35);
    sbox(MAT.paper,.5,.02,.4,-27.5,.83,18.5,{ry:.3,cast:false});
    const cal=new THREE.Mesh(new THREE.PlaneGeometry(.6,.8),toon(0xffffff,{map:signTex([{t:'NOVEMBER',size:52},{t:'X X X X',size:46},{t:'X X X ?',size:46}],{w:256,h:340})}));cal.position.set(-29.98,1.7,17.5);cal.rotation.y=Math.PI/2;ROOT.add(cal);}

  // ---- exit door (south wall), always locked
  {const ex=12;sbox(MAT.door,1.3,2.3,.12,ex,1.15,WH.z1-.06);const d=new THREE.Mesh(GEO.box,MAT.door);d.scale.set(1.3,2.3,.14);d.position.set(ex,1.15,WH.z1-.07);d.userData={kind:'exit'};d.visible=false;ROOT.add(d);INTER.push(d);
    sbox(MAT.steel,.12,.06,.12,ex+.45,1.05,WH.z1-.15);
    const s=new THREE.Mesh(new THREE.PlaneGeometry(.8,.3),basic(0xffffff,{map:signTex([{t:'EXIT',bold:true,size:110}],{w:256,h:96,bg:'#0f6b34',fg:'#c8ffd8',border:false,dirt:false})}));s.position.set(ex,2.55,WH.z1-.03);s.rotation.y=Math.PI;ROOT.add(s);}

  // ---- clutter (south-east yard, dock area)
  const pallet=(x,z,ry=0,stack=1)=>{for(let i=0;i<stack;i++){const y=i*.15;sbox(MAT.pallet,1.2,.03,1.0,x,y+.135,z,{ry});for(const o of[-.5,0,.5]){const g=new THREE.BoxGeometry(.1,.1,1.0);g.translate(o,y+.07,0);g.rotateY(ry);g.translate(x,0,z);sg(MAT.pallet,g)}}const r=.68;col(x-r,z-r,x+r,z+r)};
  const wrapped=(x,z,ry=0)=>{pallet(x,z,ry);sbox(MAT.tarp,1.15,rand(1,1.6),.95,x,.15+.7,z,{ry});};
  const barrel=(x,z,m)=>{scyl(m,.3,.3,.9,x,.45,z,{seg:12});scyl(MAT.dark,.31,.31,.04,x,.3,z,{seg:12});scyl(MAT.dark,.31,.31,.04,x,.62,z,{seg:12});col(x-.32,z-.32,x+.32,z+.32)};
  wrapped(23,15);wrapped(24.5,17.6,.2);pallet(21,18.4,0,4);wrapped(27.5,11.8);wrapped(16,17.8,-.1);pallet(18.5,13.2,.1,3);
  barrel(28.5,14.3,MAT.barrelB);barrel(27.8,15.1,MAT.barrelR);barrel(28.6,15.9,MAT.barrelB);barrel(13.5,15.3,MAT.barrelR);barrel(-15,18.7,MAT.barrelB);
  // (kept clear: Bay C's apron in the north-west, the freezer room in the north-east)
  pallet(-28.4,-17.8,0,5);pallet(-28.6,-15.3,.3,2);pallet(28.5,-9.2,0,3);wrapped(17.2,-17.2);wrapped(-19,17.5,.1);wrapped(-16.8,15.5,-.2);
  pallet(-16.5,-16.8,.2);pallet(16.8,-14.8,-.3,2);
  // (the forklift is its own object now: broken until the crew pays to fix it)

  // ---- lamps: 4 working pendants + some dead fixtures
  const fixture=(x,z)=>{scyl(MAT.dark,.015,.015,WH.h-5.5,x,5.5+(WH.h-5.5)/2,z,{cast:false});
    const g=new THREE.ConeGeometry(.55,.4,14,1,true);g.translate(x,5.35,z);sg(MAT.shade,g,false);
    const b=new THREE.Mesh(GEO.sph,MAT.bulbOn.clone());b.scale.setScalar(.13);b.position.set(x,5.2,z);ROOT.add(b);return b};
  // dead fixtures get their light from a small shared pool once someone screws in a new bulb
  for(const L of LAMPS){const bulb=fixture(L.x,L.z);let light=null;
    if(!L.dead){light=new THREE.PointLight(0xffb36a,0,13,1.7);light.position.set(L.x,5.0,L.z);ROOT.add(light)}
    const cone=new THREE.Mesh(new THREE.ConeGeometry(2.6,5.1,24,1,true),new THREE.MeshBasicMaterial({color:0xffb36a,transparent:true,opacity:.035,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,fog:true}));
    cone.position.set(L.x,2.6,L.z);ROOT.add(cone);
    LAMPV.push({light,bulb,cone,lvl:1,hum:null});}
  LAMPV.pool=[];for(let i=0;i<MAX_BULBS;i++){const l=new THREE.PointLight(0xffc68a,0,12,1.7);ROOT.add(l);LAMPV.pool.push(l)}

  flushStatics(ROOT);
  buildAdditions();
  buildGrid();
}
const owned=k=>!!(S&&S.adds&&S.adds.includes(k));

// ===================================================================== collision helpers
function collideCircle(p,r,extra){ // p:{x,z}; pushes out of every active collider
  for(let it=0;it<2;it++)for(const c of COL){if(!c.on)continue;pushOut(p,r,c)}
  if(extra)for(const c of extra)pushOut(p,r,c)}
function pushOut(p,r,c){const nx=clamp(p.x,c.x0,c.x1),nz=clamp(p.z,c.z0,c.z1);let dx=p.x-nx,dz=p.z-nz;const d2=dx*dx+dz*dz;
  if(d2>=r*r)return;
  if(d2>1e-8){const d=Math.sqrt(d2);p.x+=dx/d*(r-d);p.z+=dz/d*(r-d)}
  else{const l=p.x-c.x0,R=c.x1-p.x,t=p.z-c.z0,b=c.z1-p.z,m=Math.min(l,R,t,b);if(m===l)p.x=c.x0-r;else if(m===R)p.x=c.x1+r;else if(m===t)p.z=c.z0-r;else p.z=c.z1+r}}
function insideAny(x,z,pad=0){for(const c of COL)if(c.on&&x>c.x0-pad&&x<c.x1+pad&&z>c.z0-pad&&z<c.z1+pad)return true;return false}
// 2D segment vs rectangles: does anything solid sit between a and b?
function segBlocked(ax,az,bx,bz){const dx=bx-ax,dz=bz-az;
  for(const c of COL){if(!c.on)continue;let t0=0,t1=1;
    if(Math.abs(dx)<1e-9){if(ax<c.x0||ax>c.x1)continue}else{let a=(c.x0-ax)/dx,b=(c.x1-ax)/dx;if(a>b)[a,b]=[b,a];t0=Math.max(t0,a);t1=Math.min(t1,b);if(t0>t1)continue}
    if(Math.abs(dz)<1e-9){if(az<c.z0||az>c.z1)continue}else{let a=(c.z0-az)/dz,b=(c.z1-az)/dz;if(a>b)[a,b]=[b,a];t0=Math.max(t0,a);t1=Math.min(t1,b);if(t0>t1)continue}
    if(t1>0.02&&t0<0.98)return true}
  return false}

// ===================================================================== pathfinding grid (1 m cells, warehouse floor only)
const GRID={x0:WH.x0,z0:WH.z0,nx:60,nz:40,blk:null};
function buildGrid(){GRID.blk=new Uint8Array(GRID.nx*GRID.nz);
  for(let j=0;j<GRID.nz;j++)for(let i=0;i<GRID.nx;i++){const x=GRID.x0+i+.5,z=GRID.z0+j+.5;let b=0;
    for(const c of COL){if(c.dyn&&!(c.add&&owned(c.add)))continue;if(x>c.x0-.42&&x<c.x1+.42&&z>c.z0-.42&&z<c.z1+.42){b=1;break}}GRID.blk[j*GRID.nx+i]=b}}
const cellOf=(x,z)=>[clamp(Math.floor(x-GRID.x0),0,GRID.nx-1),clamp(Math.floor(z-GRID.z0),0,GRID.nz-1)];
function astar(sx,sz,tx,tz,avoid){ // avoid(x,z)->true to treat a cell as blocked (lit lamps)
  const nx=GRID.nx,nz=GRID.nz,N=nx*nz;const [si,sj]=cellOf(sx,sz);let [ti,tj]=cellOf(tx,tz);
  const bad=(i,j)=>GRID.blk[j*nx+i]||(avoid&&avoid(GRID.x0+i+.5,GRID.z0+j+.5));
  if(bad(ti,tj)){let best=null,bd=1e9;for(let r=1;r<5&&!best;r++)for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){const i=ti+di,j=tj+dj;if(i<0||j<0||i>=nx||j>=nz||bad(i,j))continue;const d=di*di+dj*dj;if(d<bd){bd=d;best=[i,j]}}if(!best)return null;[ti,tj]=best}
  const g=new Float32Array(N).fill(1e9),from=new Int32Array(N).fill(-1),closed=new Uint8Array(N);
  const heap=[];const push=(n,f)=>{heap.push([f,n]);let k=heap.length-1;while(k>0){const p=(k-1)>>1;if(heap[p][0]<=heap[k][0])break;[heap[p],heap[k]]=[heap[k],heap[p]];k=p}};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let k=0;for(;;){const l=2*k+1,r=l+1;let m=k;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===k)break;[heap[m],heap[k]]=[heap[k],heap[m]];k=m}}return top};
  const s=sj*nx+si,t=tj*nx+ti;g[s]=0;push(s,0);let found=false,iter=0;
  while(heap.length&&iter++<4000){const [,n]=pop();if(closed[n])continue;closed[n]=1;if(n===t){found=true;break}
    const i=n%nx,j=(n/nx)|0;
    for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const a=i+di,b=j+dj;if(a<0||b<0||a>=nx||b>=nz)continue;
      if(bad(a,b))continue;if(di&&dj&&(bad(i+di,j)||bad(i,j+dj)))continue;
      const m=b*nx+a;const ng=g[n]+(di&&dj?1.414:1);if(ng<g[m]){g[m]=ng;from[m]=n;push(m,ng+Math.hypot(a-ti,b-tj))}}}
  if(!found)return null;const path=[];for(let n=t;n!==-1&&n!==s;n=from[n])path.push({x:GRID.x0+n%nx+.5,z:GRID.z0+((n/nx)|0)+.5});path.reverse();return path}
