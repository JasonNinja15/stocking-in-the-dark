// ===================================================================== warehouse additions
// Everything the crew can buy between nights. Each addition is built up front, hidden, and switched on when
// bought: its geometry becomes visible and its colliders (tagged with `add`) start counting for collisions
// and for the monsters' pathfinding grid.
const FORKCOL=col(0,0,0,0,{dyn:true}); // follows the forklift around
const ADDG={};         // addition key -> group
const ADDV={};         // moving parts: doors, gates, hatches, the sorting arm, gauges
function addGroup(k){const g=new THREE.Group();g.visible=false;ROOT.add(g);ADDG[k]=g;return g}
function acol(k,x0,z0,x1,z1,o={}){return col(x0,z0,x1,z1,{dyn:true,on:false,add:k,...o})}
function inter(mesh,ud,group){mesh.userData=ud;(group||ROOT).add(mesh);INTER.push(mesh);return mesh}
// addition signs are backlit: readable from across the dark building, so you can find what you bought
function addSign(lines,x,y,z,ry,w,h,group,o={}){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),basic(0xb8b4a8,{fog:false,map:signTex(lines,{w:512,h:Math.round(512*h/w),...o})}));m.position.set(x,y,z);m.rotation.y=ry;group.add(m);return m}

function buildAdditions(){
  {const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),basic(0xd6d0c0,{fog:false}));m.position.set(0,3.6,WH.z0+.04);m.visible=false;ROOT.add(m);ADDV.dir=m}
  // ---------------------------------------------------------------- cold storage (north-east corner)
  {const g=addGroup('cold'),H=3.4,C=COLD,wm=toon(0xc9d0d4,{map:TEX.wall});
    sbox(wm,.2,H,C.z1-C.z0,C.x0,H/2,(C.z0+C.z1)/2,{uv:[3,1.5]});acol('cold',C.x0-.1,C.z0,C.x0+.1,C.z1);
    sbox(wm,C.dx0-C.x0,H,.2,(C.x0+C.dx0)/2,H/2,C.z1,{uv:[1.5,1.5]});acol('cold',C.x0,C.z1-.1,C.dx0,C.z1+.1);
    sbox(wm,C.x1-C.dx1,H,.2,(C.dx1+C.x1)/2,H/2,C.z1,{uv:[2,1.5]});acol('cold',C.dx1,C.z1-.1,C.x1,C.z1+.1);
    sbox(wm,C.dx1-C.dx0,H-2.4,.2,(C.dx0+C.dx1)/2,2.4+(H-2.4)/2,C.z1);
    sbox(toon(0x8d989f),C.x1-C.x0,.15,C.z1-C.z0,(C.x0+C.x1)/2,H+.07,(C.z0+C.z1)/2,{cast:false});
    sbox(MAT.ice,C.x1-C.x0-.3,.012,C.z1-C.z0-.3,(C.x0+C.x1)/2,.006,(C.z0+C.z1)/2,{cast:false});
    for(let i=0;i<14;i++)sbox(MAT.ice,rand(.3,1.2),.02,rand(.2,.8),rand(C.x0+.5,C.x1-.5),.012,rand(C.z0+.5,C.z1-.5),{ry:rand(0,3),cast:false});
    // two insulated racks: one along the back wall, one along the east wall
    const rack=(x0,z0,x1,z1,rot)=>{const len=rot?z1-z0:x1-x0;for(let i=0;i<=len/2;i++){for(const s of[-.5,.5]){const px=rot?(x0+x1)/2+s:x0+i*2,pz=rot?z0+i*2:(z0+z1)/2+s;sbox(MAT.steel,.08,2.6,.08,px,1.3,pz)}}
      for(const ly of[.14,1.34,2.54])sbox(MAT.deck,rot?1.0:len,.03,rot?len:1.0,(x0+x1)/2,ly-.015,(z0+z1)/2)};
    rack(22,-19.85,28,-18.85,false);rack(28.85,-18,29.85,-14,true);
    acol('cold',21.9,-19.95,28.1,-18.75);acol('cold',28.8,-18.1,29.95,-13.9);
    // stacks of frozen stock in three corners; the frost figures stand behind them
    for(const [x,z,w,d] of[[22.55,-13.75,.9,1.8],[27.75,-13.45,.9,1.5],[22.3,-17.4,1.3,.9]]){sbox(MAT.frozen,w,1.95,d,x,.975,z,{uv:[w*2,2]});sbox(MAT.ice,w+.04,.05,d+.04,x,1.97,z,{cast:false});acol('cold',x-w/2,z-d/2,x+w/2,z+d/2)}
    for(const x of[23,25,27])for(const ly of[.14,1.34,2.54])SLOTS.push({id:SLOTS.length,x,y:ly,z:-19.35,box:-1,old:false,cold:true,add:'cold'});
    for(const z of[-17,-15])for(const ly of[.14,1.34,2.54])SLOTS.push({id:SLOTS.length,x:29.35,y:ly,z,box:-1,old:false,cold:true,add:'cold',rot:true});
    addSign([{t:'COLD STORAGE',size:52,bold:true},{t:'-18 °C · FROZEN ONLY',size:34}],(C.dx0+C.dx1)/2,2.95,C.z1+.11,0,1.6,.6,g,{bg:'#cfe0ea',fg:'#10243a'});
    // a blue beacon over the door, visible from anywhere in the building
    const bc=new THREE.Mesh(GEO.sph,basic(0x5ab4ff,{fog:false}));bc.scale.set(.16,.1,.16);bc.position.set((C.dx0+C.dx1)/2,3.42,C.z1+.12);g.add(bc);ADDV.coldBeacon=bc;
    // the door swings on a heavy spring hinge at its west edge
    const hinge=pivot(C.dx0,0,C.z1,g);const dm=new THREE.Mesh(GEO.box,toon(0xb9c3c8,{map:TEX.wall}));dm.scale.set(C.dx1-C.dx0,2.35,.1);dm.position.set((C.dx1-C.dx0)/2,1.18,0);dm.castShadow=true;hinge.add(dm);
    const handle=part(GEO.box,MAT.steel,.06,.3,.08,C.dx1-C.dx0-.15,1.1,.08,hinge);
    inter(dm,{kind:'cold'},hinge);ADDV.coldDoor=hinge;ADDV.coldCol=acol('cold',C.dx0,C.z1-.1,C.dx1,C.z1+.1,{door:true});
    flushStatics(g)}

  // ---------------------------------------------------------------- sorting conveyor (along the south wall)
  {const g=addGroup('conv'),c=CONV,len=c.x1-c.x0,mx=(c.x0+c.x1)/2;
    sbox(MAT.belt,len,.08,.7,mx,c.y,c.z,{cast:false});sbox(MAT.steel,len,.18,.08,mx,c.y-.05,c.z-.38);sbox(MAT.steel,len,.18,.08,mx,c.y-.05,c.z+.38);
    for(let x=c.x0+.3;x<c.x1;x+=1.4)for(const s of[-.34,.34])sbox(MAT.dark,.07,c.y,.07,x,c.y/2,c.z+s);
    for(let x=c.x0+.2;x<c.x1;x+=.35)scyl(MAT.steel,.05,.05,.72,x,c.y-.06,c.z,{rx:Math.PI/2,seg:6,cast:false});
    acol('conv',c.x0-.2,c.z-.45,c.x1,c.z+.45);
    // the hopper parcels drop out of, hung from the trusses
    sbox(MAT.steel,1.1,.9,1.0,c.x0+.4,2.6,c.z);sbox(MAT.dark,.7,.5,.6,c.x0+.4,2.0,c.z);for(const s of[-.4,.4])scyl(MAT.dark,.01,.01,4,c.x0+.4+s,5.05,c.z,{cast:false});
    // three bins, colour-rimmed, with a black drop inside
    c.bins.forEach((bz,i)=>{sbox(MAT.steel,1.0,.95,1.0,c.bx,.47,bz);sbox(MAT.chute,.84,.02,.84,c.bx,.96,bz,{cast:false});
      const rim=MAT.parcel[i];sbox(rim,1.04,.08,.1,c.bx,.98,bz-.5,{cast:false});sbox(rim,1.04,.08,.1,c.bx,.98,bz+.5,{cast:false});sbox(rim,.1,.08,1.04,c.bx-.5,.98,bz,{cast:false});sbox(rim,.1,.08,1.04,c.bx+.5,.98,bz,{cast:false})});
    acol('conv',c.bx-.55,c.bins[0]-.55,c.bx+.55,c.bins[2]+.55);
    // the diverter arm at the end of the belt
    const arm=pivot(c.x1,c.y+.06,c.z,g);part(GEO.box,MAT.steel,.9,.18,.06,.45,.09,0,arm);ADDV.arm=arm;
    // lever post: the lamp on top shows which bin is selected
    sbox(MAT.dark,.18,1.1,.18,c.lever.x,.55,c.lever.z);acol('conv',c.lever.x-.12,c.lever.z-.12,c.lever.x+.12,c.lever.z+.12);
    const lv=pivot(c.lever.x,1.12,c.lever.z,g);part(GEO.cyl,MAT.steel,.025,.45,.025,0,.2,0,lv);const knob=part(GEO.sph,MAT.red,.06,.06,.06,0,.43,0,lv,{cast:false});ADDV.lever=lv;
    const lamp=new THREE.Mesh(GEO.sph,basic(0xc8352a));lamp.scale.setScalar(.09);lamp.position.set(c.lever.x,1.2,c.lever.z+.12);g.add(lamp);ADDV.leverLamp=lamp;
    const lvHit=inter(new THREE.Mesh(GEO.box,toon(0x30343a)),{kind:'lever'},g);lvHit.scale.set(.45,.7,.45);lvHit.position.set(c.lever.x,1.2,c.lever.z);lvHit.visible=false; // invisible hit box
    // red jam-clear button beside the end of the belt, right by the bins
    sbox(MAT.dark,.12,.9,.12,c.jam.x,.45,c.jam.z);const js=inter(new THREE.Mesh(GEO.box,basic(0x9a1a12)),{kind:'jam'},g);js.scale.set(.22,.18,.16);js.position.set(c.jam.x,.98,c.jam.z);ADDV.jamBtn=js;
    addSign([{t:'SORTING',size:70,bold:true},{t:'RED · BLUE · YELLOW',size:34}],-7.5,2.6,WH.z1-.03,Math.PI,2.4,.9,g);
    flushStatics(g)}

  // ---------------------------------------------------------------- freight elevator + basement returns
  {const g=addGroup('base'),H=2.7,cw=toon(0x4c4f52,{map:TEX.ribs});
    const car=(C,lvl)=>{const mx=(C.x0+C.x1)/2,mz=(C.z0+C.z1)/2,w=C.x1-C.x0,d=C.z1-C.z0;
      sbox(MAT.steel,w,.06,d,mx,.03,mz,{cast:false});sbox(MAT.steel,w,.1,d,mx,H+.05,mz);                      // floor, roof
      for(const z of[C.z0,C.z1]){sbox(cw,w,H,.1,mx,H/2,z,{uv:[1,1]});acol('base',C.x0,z-.1,C.x1,z+.1)}
      if(lvl===1){sbox(cw,.1,H,d,C.x0,H/2,mz);acol('base',C.x0-.1,C.z0,C.x0+.1,C.z1)}
      const hatch=new THREE.Mesh(GEO.box,MAT.dark.clone());hatch.scale.set(.7,.05,.7);hatch.position.set(mx,H-.01,mz);g.add(hatch);
      const gate=new THREE.Group();for(let i=0;i<9;i++){const b=new THREE.Mesh(GEO.box,MAT.cage);b.scale.set(.04,2.5,.04);b.position.set(0,1.25,C.z0+.15+i*(d-.3)/8);gate.add(b)}
      for(const y of[.2,1.25,2.4]){const b=new THREE.Mesh(GEO.box,MAT.cage);b.scale.set(.05,.05,d);b.position.set(0,y,mz);gate.add(b)}gate.position.x=C.x1;g.add(gate);
      const gcol=acol('base',C.x1-.1,C.z0,C.x1+.1,C.z1,{gate:lvl});
      const pin=inter(new THREE.Mesh(GEO.box,toon(0x30343a)),{kind:'elevIn',lvl},g);pin.scale.set(.3,.45,.08);pin.position.set(C.x0+.6,1.3,C.z0+.12);
      const btn=new THREE.Mesh(GEO.sph,basic(0x3aff7a));btn.scale.setScalar(.04);btn.position.set(C.x0+.6,1.38,C.z0+.17);g.add(btn);
      sbox(MAT.dark,.16,1.3,.16,C.x1+.3,.65,C.z0-.3);const call=inter(new THREE.Mesh(GEO.box,toon(0x30343a)),{kind:'elevCall',lvl},g);call.scale.set(.22,.3,.22);call.position.set(C.x1+.3,1.35,C.z0-.3);
      acol('base',C.x1+.2,C.z0-.4,C.x1+.4,C.z0-.2);
      // light inside the car: a caged bulb that the ride makes swing
      const bl=new THREE.Mesh(GEO.sph,MAT.bulbOn.clone());bl.scale.setScalar(.07);bl.position.set(mx,H-.15,mz+.6);g.add(bl);
      return{hatch,gate,gcol,btn,bl}};
    ADDV.carUp=car(CAR_UP,0);ADDV.carDn=car(CAR_DN,1);
    addSign([{t:'FREIGHT ELEVATOR',size:50,bold:true},{t:'RETURNS · BASEMENT',size:36}],CAR_UP.x1+.06,3.15,(CAR_UP.z0+CAR_UP.z1)/2,Math.PI/2,1.9,.62,g);
    // the basement: one long low room with the returns cage at the far end
    const B=BASE,bh=3.2,bm=toon(0x6d6a63,{map:TEX.wall});
    const fl=new THREE.Mesh(new THREE.PlaneGeometry(B.x1-B.x0,B.z1-B.z0).rotateX(-Math.PI/2),MAT.floor);fl.position.set((B.x0+B.x1)/2,0,(B.z0+B.z1)/2);fl.receiveShadow=true;g.add(fl);
    sbox(MAT.ceil,B.x1-B.x0,.2,B.z1-B.z0,(B.x0+B.x1)/2,bh+.1,(B.z0+B.z1)/2,{cast:false});
    sbox(bm,.2,bh,B.z1-B.z0,B.x0-.1,bh/2,0,{uv:[5,1.4]});sbox(bm,.2,bh,B.z1-B.z0,B.x1+.1,bh/2,0,{uv:[5,1.4]});
    sbox(bm,B.x1-B.x0,bh,.2,(B.x0+B.x1)/2,bh/2,B.z0-.1,{uv:[6,1.4]});sbox(bm,B.x1-B.x0,bh,.2,(B.x0+B.x1)/2,bh/2,B.z1+.1,{uv:[6,1.4]});
    acol('base',B.x0-.2,B.z0-.2,B.x0,B.z1+.2);acol('base',B.x1,B.z0-.2,B.x1+.2,B.z1+.2);acol('base',B.x0,B.z0-.2,B.x1,B.z0);acol('base',B.x0,B.z1,B.x1,B.z1+.2);
    for(let z=-5.6;z<=5.6;z+=.35)if(Math.abs(z)>1.05)sbox(MAT.cage,.03,2.4,.03,79,1.2,z,{cast:false});
    for(const y of[.1,1.2,2.4])for(const s of[-1,1])sbox(MAT.cage,.05,.05,4.7,79,y,s*3.4,{cast:false});
    acol('base',78.95,-5.9,79.05,-1.05);acol('base',78.95,1.05,79.05,5.9);
    for(let x=72;x<84;x+=2.5)scyl(MAT.steel,.08,.08,B.z1-B.z0,x,bh-.25,0,{rx:Math.PI/2,seg:8,cast:false});
    addSign([{t:'RETURNS',size:80,bold:true},{t:'DAMAGED · DO NOT RESELL',size:30}],83.85,2.3,0,-Math.PI/2,1.8,.7,g);
    const bb=new THREE.Mesh(GEO.sph,MAT.bulbOn.clone());bb.scale.setScalar(.1);bb.position.set(77,bh-.3,0);g.add(bb);ADDV.baseBulb=bb;
    // the shredder against the wall just outside the cage: a steel cabinet with a hopper on top and two toothed rollers in its throat
    {const X=SHRED.x,Z=SHRED.z,cab=toon(0x4a5058);sbox(cab,1.3,1.0,.9,X,.5,Z);sbox(MAT.hazard,1.32,.16,.92,X,.9,Z,{uv:[2.6,.3]});
     sbox(cab,1.5,.08,1.06,X,1.04,Z);for(const s of[-1,1]){sbox(cab,.08,.32,1.06,X+s*.71,1.22,Z);sbox(cab,1.5,.32,.08,X,1.22,Z+s*.49)}
     sbox(MAT.dark,1.34,.02,.9,X,1.08,Z,{cast:false});sbox(MAT.dark,.6,.25,.04,X,.45,Z+.46,{cast:false}); // the throat, the bin hatch
     ADDV.shredRolls=[];for(const dz of[-.13,.13]){const r=new THREE.Group();r.position.set(X,1.12,Z+dz);g.add(r);
       const c=new THREE.Mesh(GEO.cyl,MAT.steel);c.scale.set(.1,1.2,.1);c.rotation.z=Math.PI/2;r.add(c);
       for(let i=0;i<9;i++)for(let a=0;a<4;a++){const t=new THREE.Mesh(GEO.box,MAT.steel);t.scale.set(.03,.05,.05);const ang=a*Math.PI/2+i*.4;t.position.set(-.52+i*.13,Math.cos(ang)*.1,Math.sin(ang)*.1);t.rotation.x=ang;r.add(t)}
       ADDV.shredRolls.push(r)}
     const lamp=new THREE.Mesh(GEO.sph,MAT.red.clone());lamp.scale.setScalar(.07);lamp.position.set(X+.55,1.45,Z-.3);g.add(lamp);ADDV.shredLamp=lamp;
     inter(new THREE.Mesh(GEO.box,cab),{kind:'shred'},g).scale.set(1.5,1.4,1.1);INTER[INTER.length-1].position.set(X,.7,Z);INTER[INTER.length-1].visible=false;
     acol('base',X-.76,Z-.55,X+.76,Z+.55);
     addSign([{t:'SHREDDER',size:70,bold:true},{t:'RETURNS ONLY · KEEP HANDS CLEAR',size:28}],X,1.95,BASE.z0+.02,0,1.4,.5,g)}
    flushStatics(g)}

  // ---------------------------------------------------------------- generator (west wall, by the roof ladder)
  {const g=addGroup('gen');
    sbox(MAT.genY,1.8,1.1,1.2,GEN.x,.55,GEN.z);sbox(MAT.dark,1.9,.12,1.3,GEN.x,.06,GEN.z);sbox(MAT.dark,.5,.6,.5,GEN.x-.4,1.4,GEN.z);
    scyl(MAT.steel,.07,.07,1.6,GEN.x-.4,2.3,GEN.z,{seg:8});scyl(MAT.steel,.07,.07,.9,GEN.x-.4,3.1,GEN.z-.45,{rx:Math.PI/2,seg:8});
    sbox(MAT.dark,.04,3,.12,WH.x0+.03,3.2,GEN.z,{cast:false});
    const body=inter(new THREE.Mesh(GEO.box,toon(0x30343a)),{kind:'gen'},g);body.scale.set(.5,.4,.06);body.position.set(GEN.x+.45,.85,GEN.z+.63);
    const gauge=new THREE.Mesh(GEO.box,basic(0x3aff7a));gauge.scale.set(.36,.06,.02);gauge.position.set(GEN.x+.45,.95,GEN.z+.67);g.add(gauge);ADDV.genGauge=gauge;
    acol('gen',GEN.x-.9,GEN.z-.6,GEN.x+.9,GEN.z+.6);
    sbox(MAT.steel,1.0,.05,.5,FUELR.x,.5,FUELR.z);sbox(MAT.steel,1.0,.05,.5,FUELR.x,1.0,FUELR.z);for(const dx of[-.45,.45])for(const dz of[-.2,.2])sbox(MAT.dark,.04,1.05,.04,FUELR.x+dx,.52,FUELR.z+dz);
    for(const dx of[-.3,0,.3]){sbox(MAT.can,.24,.36,.14,FUELR.x+dx,.71,FUELR.z);sbox(MAT.dark,.06,.06,.04,FUELR.x+dx+.06,.92,FUELR.z)}
    const fr=inter(new THREE.Mesh(GEO.box,MAT.can),{kind:'fuelrack'},g);fr.scale.set(1,.9,.5);fr.position.set(FUELR.x,.7,FUELR.z);fr.visible=false;
    acol('gen',FUELR.x-.5,FUELR.z-.25,FUELR.x+.5,FUELR.z+.25);
    addSign([{t:'GENERATOR',size:64,bold:true},{t:'KEEP FUELLED',size:38}],WH.x0+.03,2.2,GEN.z+1.3,Math.PI/2,1.4,.55,g);
    flushStatics(g)}
}

// ---------------------------------------------------------------- the "THIS WAY" board
// Hangs on the dock wall right in front of where everyone starts, listing what the crew owns with an arrow to
// each one (as seen from the start, facing the dock: up is the dock wall, down is the south wall behind you).
const DIR_INFO={fork:{n:'FORKLIFT',x:FORK_HOME.x,z:FORK_HOME.z},cold:{n:'COLD STORAGE',x:25.3,z:-13},bayc:{n:'BAY C',x:-24,z:-19},
  base:{n:'FREIGHT ELEVATOR',x:-27.5,z:-9.3},gen:{n:'GENERATOR',x:GEN.x,z:GEN.z},conv:{n:'SORTING CONVEYOR',x:-7.5,z:18}};
function drawDirectory(){const m=ADDV.dir,ks=Object.keys(DIR_INFO).filter(owned);m.visible=ks.length>0;if(!ks.length)return;
  const W=1024,LH=74,H=96+ks.length*LH;
  const t=ctex(W,H,(g,w,h)=>{g.fillStyle='#c9a227';g.fillRect(0,0,w,h);g.strokeStyle='#16130c';g.lineWidth=10;g.strokeRect(9,9,w-18,h-18);
    g.fillStyle='#16130c';g.font="bold 54px 'Special Elite', Courier New";g.textBaseline='middle';g.fillText('THIS WAY',40,52);
    ks.forEach((k,i)=>{const d=DIR_INFO[k],y=96+i*LH+LH/2-6;g.font="44px 'Special Elite', Courier New";g.fillText(d.n,40,y);
      const a=Math.atan2(d.z-(-15.5),d.x-0);g.save();g.translate(w-90,y);g.rotate(a);g.beginPath();g.moveTo(-30,-7);g.lineTo(8,-7);g.lineTo(8,-20);g.lineTo(32,0);g.lineTo(8,20);g.lineTo(8,7);g.lineTo(-30,7);g.closePath();g.fill();g.restore()})},{aniso:4});
  if(m.material.map)m.material.map.dispose();m.material.map=t;m.material.needsUpdate=true;m.scale.set(3.6,3.6*H/W,1);m.position.y=3.35+m.scale.y/2-.6}
// switch on everything the crew owns (host and clients both run this when the list changes)
function applyAdds(){for(const k in ADDG)ADDG[k].visible=owned(k);
  for(const c of COL)if(c.add&&!c.door&&c.gate===undefined)c.on=owned(c.add);
  BAYS.forEach((b,i)=>{if(b.add&&BAYV[i].boards)BAYV[i].boards.visible=!owned(b.add)});
  if(FORK3D)FORK3D.visible=true;drawDirectory();buildGrid()}
const slotOn=s=>!s.add||owned(s.add);
const bayOn=i=>!BAYS[i].add||owned(BAYS[i].add);

// ===================================================================== the roof
// Its own space far off to the west, like the basement: a flat roof the size of the warehouse under a foot of snow,
// a waist-high parapet, the lot seven metres below, and the storm. Nothing up here is lit.
const ROOFV={lid:null,beacon:null};
function buildRoof(){const R=ROOF,cx=(R.x0+R.x1)/2,cz=(R.z0+R.z1)/2,W=R.x1-R.x0,D=R.z1-R.z0,gy=R.gy;
  // the building under you, and the lot all around it
  {const g=new THREE.BoxGeometry(W+.4,-gy,D+.4);uvs(g,W/2.2,-gy/2.2);g.translate(cx,gy/2-.1,cz);sg(MAT.wall,g,false)}
  sbox(MAT.snow,W+.4,.1,D+.4,cx,-.05,cz,{cast:false});
  const lot=new THREE.Mesh(new THREE.PlaneGeometry(420,420).rotateX(-Math.PI/2),MAT.snow);lot.position.set(cx,gy,cz);lot.receiveShadow=true;ROOT.add(lot);
  // the parapet, capped with snow
  const par=(x0,z0,x1,z1)=>{sbox(MAT.wall,x1-x0,.75,z1-z0,(x0+x1)/2,.375,(z0+z1)/2,{uv:[(x1-x0+z1-z0)/2.2,.4]});sbox(MAT.snow,x1-x0+.08,.09,z1-z0+.08,(x0+x1)/2,.79,(z0+z1)/2,{cast:false})};
  par(R.x0-.2,R.z0-.2,R.x1+.2,R.z0+.15);par(R.x0-.2,R.z1-.15,R.x1+.2,R.z1+.2);par(R.x0-.2,R.z0+.15,R.x0+.15,R.z1-.15);par(R.x1-.15,R.z0+.15,R.x1+.2,R.z1-.15);
  // air handlers, vents and skylights (the skylights glow faintly with the lamps below)
  const hvac=(x,z,w,d,h=1.7)=>{sbox(MAT.hvac,w,h,d,x,h/2,z);sbox(MAT.snow,w+.06,.14,d+.06,x,h+.07,z,{cast:false});
    for(let i=0;i<Math.max(1,Math.floor(w/1.5));i++)scyl(MAT.dark,.5,.5,.06,x-w/2+.75+i*1.5,h+.17,z,{seg:16,cast:false});
    sbox(MAT.dark,w*.86,h*.45,.02,x,h*.42,z+d/2+.01,{cast:false});sbox(MAT.dark,w*.86,h*.45,.02,x,h*.42,z-d/2-.01,{cast:false});col(x-w/2,z-d/2,x+w/2,z+d/2)};
  hvac(-213,-8,4.4,2.2);hvac(-187,5,5.8,2.4,1.9);hvac(-201,-15.5,2.9,2);hvac(-177.5,12,2.9,2.2);hvac(-221,9,3,2.4,1.5);
  const vent=(x,z)=>{scyl(MAT.steel,.16,.16,1.1,x,.55,z);scyl(MAT.steel,.32,.32,.08,x,1.14,z);scyl(MAT.snow,.32,.32,.06,x,1.2,z,{cast:false});col(x-.22,z-.22,x+.22,z+.22)};
  for(const [x,z] of[[-224,-2],[-196,-6],[-182,-12],[-206,12],[-193,15],[-174,-4],[-216,17]])vent(x,z);
  const glow=basic(0x4a3216);
  for(const L of LAMPS.slice(0,4)){const x=L.x+R.ox,z=L.z;sbox(MAT.steel,2.3,.36,1.5,x,.18,z);const m=new THREE.Mesh(new THREE.BoxGeometry(2.05,.04,1.25),glow);m.position.set(x,.38,z);ROOT.add(m);col(x-1.15,z-.75,x+1.15,z+.75)}
  // drifts piled against the parapet
  for(let i=0;i<34;i++){const side=i%4,t=Math.random();let x,z;
    if(side===0){x=lerp(R.x0+1,R.x1-1,t);z=R.z0+.5}else if(side===1){x=lerp(R.x0+1,R.x1-1,t);z=R.z1-.5}else if(side===2){x=R.x0+.5;z=lerp(R.z0+1,R.z1-1,t)}else{x=R.x1-.5;z=lerp(R.z0+1,R.z1-1,t)}
    const g=new THREE.SphereGeometry(1,10,6);g.scale(rand(1.4,3),rand(.3,.6),rand(.6,1));if(side>1)g.rotateY(Math.PI/2);g.translate(x,0,z);sg(MAT.snow,g,false)}
  // a radio mast in the north-east corner with one red light on top
  {const x=R.x1-2,z=R.z0+2;scyl(MAT.steel,.07,.12,9,x,4.5,z,{seg:6});for(const a of[0,2.1,4.2])scyl(MAT.steel,.012,.012,9.4,x+Math.cos(a)*1.6,4.3,z+Math.sin(a)*1.6,{rx:Math.sin(a)*.17,rz:-Math.cos(a)*.17,cast:false});
    ROOFV.beacon=new THREE.Mesh(GEO.sph,basic(0xff2a1a,{fog:false}));ROOFV.beacon.scale.setScalar(.13);ROOFV.beacon.position.set(x,9.05,z);ROOT.add(ROOFV.beacon);col(x-.2,z-.2,x+.2,z+.2)}
  // the hatch you came up through
  {const {x,z}=HATCH;sbox(MAT.hvac,1.4,.55,1.4,x,.275,z);sbox(MAT.dark,1.1,.02,1.1,x,.56,z,{cast:false});sbox(MAT.hvac,1.4,1.4,.07,x,1.25,z+.72,{cast:false});
    for(const s of[-1,1]){sbox(MAT.steel,.06,1.1,.06,x+s*.35,1.1,z-.45);sbox(MAT.steel,.06,.06,.3,x+s*.35,1.65,z-.6)}
    const hit=new THREE.Mesh(GEO.box,MAT.steel);hit.scale.set(1.5,1.6,1.5);hit.position.set(x,.8,z);hit.userData={kind:'hatch'};hit.visible=false;ROOT.add(hit);INTER.push(hit);col(x-.7,z-.7,x+.7,z+.7)}
  // someone's stash at the far end: a crate under a tarp, restocked every night
  {const {x,z}=STASH;sbox(MAT.wood,1.1,.7,.8,x,.35,z,{uv:[1,1]});sbox(MAT.tarp,1.2,.05,.9,x,.73,z-.02,{cast:false});sbox(MAT.snow,1.1,.06,.7,x,.77,z,{cast:false});
    ROOFV.lid=new THREE.Mesh(new THREE.BoxGeometry(1.12,.05,.82).translate(0,0,.41),MAT.wood);ROOFV.lid.position.set(x,.7,z-.41);ROOFV.lid.visible=false;ROOT.add(ROOFV.lid);
    const hit=new THREE.Mesh(GEO.box,MAT.wood);hit.scale.set(1.3,1,1);hit.position.set(x,.45,z);hit.userData={kind:'stash'};hit.visible=false;ROOT.add(hit);INTER.push(hit);col(x-.58,z-.42,x+.58,z+.42)}
  // the lot: a fence line, dead light poles, a parked trailer, a row of utility poles far out in the storm
  for(let a=0;a<Math.PI*2;a+=.045){const x=cx+Math.cos(a)*52,z=cz+Math.sin(a)*40;scyl(MAT.steel,.05,.05,2.4,x,gy+1.2,z,{seg:5,cast:false})}
  for(const [x,z] of[[-238,-28],[-162,-30],[-160,26],[-242,24],[-200,-34]]){scyl(MAT.steel,.12,.16,10,x,gy+5,z,{seg:6});sbox(MAT.dark,.4,.25,1.2,x,gy+10,z+.4)}
  sbox(MAT.wall,2.6,2.9,13,-214,gy+1.75,-31,{ry:.15});sbox(MAT.dark,2.3,.9,.4,-213,gy+.45,-24.6,{ry:.15});
  for(let i=-3;i<=3;i++){const x=cx+i*26,z=cz+78;scyl(MAT.wood,.18,.2,12,x,gy+6,z,{seg:6});sbox(MAT.wood,2.6,.16,.16,x,gy+11.3,z)}}
