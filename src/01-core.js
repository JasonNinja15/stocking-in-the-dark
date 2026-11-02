// ===================================================================== core
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t;
const rand=(a,b)=>a+Math.random()*(b-a), randi=(a,b)=>Math.floor(rand(a,b+1)), pick=a=>a[Math.floor(Math.random()*a.length)];
const TAU=Math.PI*2;
const angDiff=(a,b)=>{let d=(b-a)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d};
const damp=(a,b,k,dt)=>lerp(a,b,1-Math.exp(-k*dt));
const easeOut=t=>1-Math.pow(1-t,3), easeIn=t=>t*t*t, easeIO=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;

const SET=Object.assign({sens:1,vol:0.8,fov:75,qual:2,fps:false,name:''},(()=>{try{return JSON.parse(localStorage.getItem('gs-settings'))||{}}catch(e){return{}}})());
function saveSet(){try{localStorage.setItem('gs-settings',JSON.stringify(SET))}catch(e){}}

// layout (metres). +x east, +z south, the loading dock is the north wall (z = -20).
const WH={x0:-30,x1:30,z0:-20,z1:20,h:7};
const BAYS=[{x:-12,name:'A'},{x:12,name:'B'}];
const TZ_DOCK=-20.25, TZ_FAR=-64, TRAIL_LEN=14, TRAIL_HW=1.25, TRAIL_H=2.9;
const DOOR_HW=1.7, DOOR_H=3.6;
// one in-game minute per real second
const HOUR=60, SHIFT_HOURS=6, DOCK_TIME=115, SHIFT_END=HOUR*SHIFT_HOURS, OVERTIME=60, LAST_TRUCK_AT=HOUR*5+8;
const CEIL_Y=6.25; // where the crawler hangs, just under the trusses
const RACK_ROWS=[-6,-1,4,9], RACK_COLS=[-27,-8,11], RACK_LEN=16, RACK_LEVELS=[0.14,1.34,2.54];
const LAMPS=[{x:0,z:-13.5,r:3.6},{x:-9.5,z:1.5,r:3.2},{x:9.5,z:6.5,r:3.2},{x:-3,z:15.5,r:3.4}];
const STATION={charger:{x:-1.3,z:-19.8},aid:{x:1.3,z:-19.8}};
const BOX_KINDS=[{w:.55,h:.42,d:.5,slow:.95},{w:.74,h:.56,d:.64,slow:.86},{w:.92,h:.72,d:.8,slow:.74}];
const VEST=['#ff7a1a','#a4e33a','#38d4e8','#ff4fa8'];

// ===================================================================== renderer
const canvas=$('c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance',stencil:false});
renderer.outputColorSpace=THREE.LinearSRGBColorSpace; // the post pass does its own gamma
renderer.toneMapping=THREE.NoToneMapping;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFShadowMap;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x020203);
scene.fog=new THREE.FogExp2(0x030305,0.052);
const camera=new THREE.PerspectiveCamera(SET.fov,innerWidth/innerHeight,0.05,70);
camera.rotation.order='YXZ';
scene.add(camera);

// toon ramp: 4 hard bands
const GRAD=(()=>{const d=new Uint8Array([10,62,150,255]);const t=new THREE.DataTexture(d,4,1,THREE.RedFormat);t.minFilter=t.magFilter=THREE.NearestFilter;t.generateMipmaps=false;t.needsUpdate=true;return t})();
const toon=(color,o={})=>new THREE.MeshToonMaterial({color,gradientMap:GRAD,...o});
const basic=(color,o={})=>new THREE.MeshBasicMaterial({color,...o});

// ===================================================================== procedural textures
function ctex(w,h,draw,{rep=null,srgb=true,aniso=4}={}){
  const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);
  const t=new THREE.CanvasTexture(c);if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=aniso;
  if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep[0],rep[1])}return t}
function speckle(g,w,h,n,rgb,amax,size=2){for(let i=0;i<n;i++){g.fillStyle=`rgba(${rgb},${Math.random()*amax})`;const r=Math.random()*size+.5;g.fillRect(Math.random()*w,Math.random()*h,r,r)}}
function stain(g,x,y,r,rgb,a){const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,`rgba(${rgb},${a})`);gr.addColorStop(1,`rgba(${rgb},0)`);g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2)}
function crack(g,x,y,len,rgb='20,18,16',a=.6){g.strokeStyle=`rgba(${rgb},${a})`;g.lineWidth=1.2;g.beginPath();g.moveTo(x,y);let ang=Math.random()*TAU;for(let i=0;i<len;i++){ang+=rand(-.6,.6);x+=Math.cos(ang)*4;y+=Math.sin(ang)*4;g.lineTo(x,y)}g.stroke()}
// wrap-aware stains so tiled textures don't show seams
function wstain(g,w,h,x,y,r,rgb,a){for(const ox of[-w,0,w])for(const oy of[-h,0,h])stain(g,x+ox,y+oy,r,rgb,a)}

const TEX={};
TEX.concrete=ctex(512,512,(g,w,h)=>{g.fillStyle='#77746d';g.fillRect(0,0,w,h);
  for(let i=0;i<30;i++)wstain(g,w,h,rand(0,w),rand(0,h),rand(20,90),pick(['40,36,30','95,92,85','30,28,24']),rand(.08,.25));
  speckle(g,w,h,9000,'20,20,20',.35,2);speckle(g,w,h,5000,'200,198,190',.18,1.5);
  for(let i=0;i<6;i++)crack(g,rand(0,w),rand(0,h),randi(10,40));
  g.strokeStyle='rgba(25,24,22,.55)';g.lineWidth=2;g.strokeRect(0,0,w,h); // slab joints
},{rep:[15,10]});
TEX.wall=ctex(256,256,(g,w,h)=>{for(let x=0;x<w;x++){const s=Math.sin(x/w*TAU*8);const v=90+s*22;g.fillStyle=`rgb(${v*.82|0},${v*.9|0},${v|0})`;g.fillRect(x,0,1,h)}
  for(let i=0;i<10;i++){const x=rand(0,w),l=rand(40,200);const gr=g.createLinearGradient(0,0,0,l);gr.addColorStop(0,'rgba(90,50,20,.55)');gr.addColorStop(1,'rgba(90,50,20,0)');g.fillStyle=gr;g.fillRect(x,0,rand(2,7),l)}
  speckle(g,w,h,2500,'10,10,10',.3,2);for(let i=0;i<8;i++)wstain(g,w,h,rand(0,w),rand(0,h),rand(10,40),'20,18,14',.3);
  g.fillStyle='rgba(0,0,0,.4)';g.fillRect(0,0,w,3);
},{rep:[1,1]});
TEX.ply=ctex(256,256,(g,w,h)=>{g.fillStyle='#6a5233';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=2){g.fillStyle=`rgba(${Math.random()<.5?'40,28,14':'130,100,60'},${rand(.05,.25)})`;g.fillRect(0,y+Math.sin(y)*2,w,1)}
  for(let i=0;i<5;i++){g.fillStyle='rgba(20,12,6,.6)';g.beginPath();g.ellipse(rand(0,w),rand(0,h),rand(3,7),rand(2,4),0,0,TAU);g.fill()}
  g.fillStyle='rgba(0,0,0,.55)';for(let x=0;x<w;x+=64)g.fillRect(x,0,2,h);speckle(g,w,h,1500,'0,0,0',.4,2)},{rep:[2,9]});
TEX.ribs=ctex(256,256,(g,w,h)=>{g.fillStyle='#8e8f8a';g.fillRect(0,0,w,h);for(let x=0;x<w;x+=32){g.fillStyle='#5a5b57';g.fillRect(x,0,6,h);g.fillStyle='#b0b1ab';g.fillRect(x+6,0,2,h)}
  for(let y=0;y<h;y+=16){g.fillStyle='rgba(30,30,30,.5)';for(let x=3;x<w;x+=32)g.fillRect(x,y,2,2)}
  for(let i=0;i<14;i++){g.strokeStyle=`rgba(40,36,30,${rand(.2,.5)})`;g.lineWidth=rand(1,3);g.beginPath();const x=rand(0,w),y=rand(0,h);g.moveTo(x,y);g.lineTo(x+rand(-60,60),y+rand(-6,6));g.stroke()}
  speckle(g,w,h,2500,'20,20,20',.35,2)},{rep:[7,1.4]});
TEX.ribsClaw=ctex(256,256,(g,w,h)=>{g.drawImage(TEX.ribs.image,0,0);
  for(let s=0;s<4;s++){const x0=rand(20,200),y0=rand(10,90),dx=rand(-20,20);for(let k=0;k<4;k++){g.strokeStyle='rgba(15,8,6,.85)';g.lineWidth=3;g.beginPath();g.moveTo(x0+k*11,y0);g.quadraticCurveTo(x0+k*11+dx*.5,y0+70,x0+k*13+dx,y0+140);g.stroke();g.strokeStyle='rgba(210,200,180,.5)';g.lineWidth=1;g.stroke()}}
  for(let i=0;i<5;i++)stain(g,rand(0,w),rand(100,h),rand(10,30),'60,10,6',.55)},{rep:[1,1]});
TEX.hazard=ctex(128,128,(g,w,h)=>{g.fillStyle='#151513';g.fillRect(0,0,w,h);g.fillStyle='#c79a16';for(let i=-4;i<8;i++){g.beginPath();g.moveTo(i*32,0);g.lineTo(i*32+16,0);g.lineTo(i*32+16+h,h);g.lineTo(i*32+h,h);g.fill()}speckle(g,w,h,900,'0,0,0',.5,2)},{rep:[1,1]});
TEX.pallet=ctex(128,128,(g,w,h)=>{g.fillStyle='#7d6037';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=3){g.fillStyle=`rgba(40,26,10,${rand(.05,.3)})`;g.fillRect(0,y,w,1)}speckle(g,w,h,600,'0,0,0',.5,2)});
TEX.vest=ctex(64,64,(g,w,h)=>{g.fillStyle='#fff';g.fillRect(0,0,w,h);g.fillStyle='#c9cdd2';g.fillRect(0,22,w,7);g.fillRect(0,42,w,7);g.fillRect(12,0,7,h);g.fillRect(45,0,7,h)});

function boxTex(kind){return ctex(256,256,(g,w,h)=>{
  const old=kind==='old';g.fillStyle=old?'#6e5435':'#a77a48';g.fillRect(0,0,w,h);
  for(let i=0;i<300;i++){g.fillStyle=`rgba(${Math.random()<.5?'70,45,20':'190,150,100'},${rand(.05,.2)})`;g.fillRect(0,rand(0,h),w,1)}
  speckle(g,w,h,1200,'40,25,10',.3,2);
  g.fillStyle=kind==='fragile'?'rgba(190,40,30,.85)':'rgba(205,175,120,.75)';g.fillRect(0,h*.44,w,h*.12);
  g.strokeStyle='rgba(60,40,20,.5)';g.lineWidth=2;g.strokeRect(2,2,w-4,h-4);
  g.fillStyle='rgba(25,18,12,.85)';g.textAlign='center';
  if(kind==='fragile'){g.save();g.translate(w/2,h*.28);g.rotate(-.12);g.strokeStyle='rgba(180,30,25,.9)';g.lineWidth=5;g.strokeRect(-92,-24,184,48);g.fillStyle='rgba(180,30,25,.9)';g.font='bold 38px Courier New';g.fillText('FRAGILE',0,13);g.restore();
    g.font='bold 18px Courier New';g.fillStyle='rgba(180,30,25,.8)';g.fillText('HANDLE WITH CARE',w/2,h*.78)}
  else if(kind===0){g.font='bold 20px Courier New';g.fillText('THIS SIDE UP',w/2,h*.3);for(const x of[w*.3,w*.7]){g.beginPath();g.moveTo(x,h*.66);g.lineTo(x-14,h*.8);g.lineTo(x-5,h*.8);g.lineTo(x-5,h*.92);g.lineTo(x+5,h*.92);g.lineTo(x+5,h*.8);g.lineTo(x+14,h*.8);g.fill()}}
  else if(kind===1){g.font='bold 22px Courier New';g.fillText('NOCTURNE',w/2,h*.25);g.font='15px Courier New';g.fillText('FREIGHT CO.',w/2,h*.33);g.fillStyle='rgba(240,236,225,.9)';g.fillRect(w*.55,h*.66,90,52);g.fillStyle='#111';for(let x=0;x<80;x+=3)if(Math.random()<.6)g.fillRect(w*.55+5+x,h*.68,2,30);g.font='10px Courier New';g.fillText('13-'+randi(1000,9999),w*.55+45,h*.66+48)}
  else if(kind===2){g.font='bold 26px Courier New';g.fillText('DOCK 13',w/2,h*.3);g.font='16px Courier New';g.fillText('KEEP DRY',w/2,h*.75);g.beginPath();g.arc(w/2,h*.85,10,Math.PI,0);g.fill()}
  else{g.font='bold 16px Courier New';g.fillText('DO NOT STACK',w/2,h*.26);g.fillText('MORE THAN 3 HIGH',w/2,h*.33);g.font='bold 30px Courier New';g.fillText('#'+randi(10,99),w/2,h*.8)}
  if(old){speckle(g,w,h,3000,'200,195,180',.12,2);for(let i=0;i<6;i++)stain(g,rand(0,w),rand(0,h),rand(20,60),'30,22,12',.4)}
})}
TEX.box=[boxTex(0),boxTex(1),boxTex(2),boxTex(3)];TEX.fragile=boxTex('fragile');TEX.old=boxTex('old');

function signTex(lines,{w=512,h=256,bg='#d8d2bd',fg='#141210',border=true,dirt=true,font='Special Elite'}={}){return ctex(w,h,(g)=>{g.fillStyle=bg;g.fillRect(0,0,w,h);if(border){g.strokeStyle=fg;g.lineWidth=10;g.strokeRect(12,12,w-24,h-24)}
  g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';const n=lines.length;
  lines.forEach((l,i)=>{const sz=l.size||Math.min(90,(h-60)/n*.8);g.font=`${l.bold?'bold ':''}${sz}px '${font}', Courier New`;g.fillText(l.t,w/2,h/2+(i-(n-1)/2)*(h-60)/n)});
  if(dirt){for(let i=0;i<10;i++)stain(g,rand(0,w),rand(0,h),rand(20,90),'40,30,20',rand(.1,.35));speckle(g,w,h,2500,'30,25,20',.3,2)}})}

// the stalker's face: hollow sockets with pinprick pupils, cheekbones, a mouth stretched open too far
function faceTex(){return ctex(512,256,(g,w,h)=>{g.fillStyle='#a9a596';g.fillRect(0,0,w,h);speckle(g,w,h,4000,'60,58,50',.25,2);
  const cx=128,cy=112;
  for(let i=0;i<9;i++){g.strokeStyle='rgba(40,34,30,.45)';g.lineWidth=1;crack(g,cx+rand(-60,60),cy+rand(-70,40),randi(4,10),'40,34,30',.5)}
  for(const s of[-1,1]){stain(g,cx+s*34,cy-16,40,'20,18,16',.75);
    g.fillStyle='#020202';g.beginPath();g.ellipse(cx+s*30,cy-18,15,24,s*.3,0,TAU);g.fill();
    g.fillStyle='#f4f0e0';g.beginPath();g.arc(cx+s*28,cy-12,2,0,TAU);g.fill();
    g.fillStyle='rgba(15,10,8,.85)';g.fillRect(cx+s*30-1.5,cy+6,3,rand(26,44)); // weeping
    stain(g,cx+s*46,cy+26,18,'30,26,22',.5)}
  g.fillStyle='#020101';g.beginPath();g.moveTo(cx-48,cy+40);g.quadraticCurveTo(cx,cy+30,cx+48,cy+40);g.quadraticCurveTo(cx+20,cy+110,cx,cy+118);g.quadraticCurveTo(cx-20,cy+110,cx-48,cy+40);g.fill();
  g.fillStyle='#d6cfb8';for(let i=-5;i<=5;i++){const x=cx+i*8,y=cy+36+Math.abs(i)*.9;g.beginPath();g.moveTo(x-3.4,y);g.lineTo(x+3.4,y);g.lineTo(x+rand(-1,1),y+rand(10,17));g.fill()}
  for(let i=-3;i<=3;i++){const x=cx+i*8,y=cy+104-Math.abs(i)*6;g.beginPath();g.moveTo(x-3,y);g.lineTo(x+3,y);g.lineTo(x,y-rand(9,14));g.fill()}
  stain(g,cx,cy+120,30,'50,0,0',.45)})}
TEX.face=faceTex();
// the sleeper's hide: grey, bruised, threaded with dark veins
TEX.lskin=ctex(256,256,(g,w,h)=>{g.fillStyle='#6f6b60';g.fillRect(0,0,w,h);for(let i=0;i<26;i++)wstain(g,w,h,rand(0,w),rand(0,h),rand(10,46),pick(['40,38,44','92,70,64','50,58,48']),rand(.2,.45));
  for(let i=0;i<14;i++)crack(g,rand(0,w),rand(0,h),randi(8,22),'35,22,30',.55);speckle(g,w,h,2500,'20,18,18',.3,2)},{rep:[2,2]});
// the crawler's face: almost a person. Eyes a little too big and too far apart, no brows, a slack smile that's too wide
TEX.cface=ctex(256,256,(g,w,h)=>{g.fillStyle='#d9cfc2';g.fillRect(0,0,w,h);speckle(g,w,h,1500,'150,130,120',.15,2);
  const cx=128,cy=120;for(const s of[-1,1]){stain(g,cx+s*46,cy-14,34,'120,95,95',.35);
    g.fillStyle='#050404';g.beginPath();g.ellipse(cx+s*44,cy-12,19,15,0,0,TAU);g.fill();
    g.fillStyle='rgba(235,230,220,.9)';g.beginPath();g.arc(cx+s*40,cy-16,2.2,0,TAU);g.fill();
    stain(g,cx+s*44,cy+10,22,'110,80,80',.3)}
  g.fillStyle='rgba(80,55,50,.6)';g.fillRect(cx-6,cy+22,3,3);g.fillRect(cx+3,cy+22,3,3);
  g.strokeStyle='#2a1414';g.lineWidth=3;g.beginPath();g.moveTo(cx-62,cy+46);g.quadraticCurveTo(cx,cy+64,cx+62,cy+46);g.stroke();
  g.fillStyle='#160606';g.beginPath();g.moveTo(cx-40,cy+50);g.quadraticCurveTo(cx,cy+76,cx+40,cy+50);g.quadraticCurveTo(cx,cy+60,cx-40,cy+50);g.fill()});

// shared geometries
const GEO={box:new THREE.BoxGeometry(1,1,1),cyl:new THREE.CylinderGeometry(1,1,1,10),sph:new THREE.SphereGeometry(1,14,10),cone:new THREE.ConeGeometry(1,1,6),fang:new THREE.ConeGeometry(1,1,8)};
for(const k of BOX_KINDS)k.geo=new THREE.BoxGeometry(k.w,k.h,k.d).translate(0,k.h/2,0);

const MAT={
  floor:toon(0xffffff,{map:TEX.concrete}),wall:toon(0x9aa0a6,{map:TEX.wall}),ceil:toon(0x15161a),
  rackBlue:toon(0x27457e),rackOrange:toon(0xc4581b),deck:toon(0x5d5a54),steel:toon(0x4a4c50),dark:toon(0x1b1c1f),rubber:toon(0x0f0f10),
  hazard:toon(0xffffff,{map:TEX.hazard}),yellow:toon(0xb78f19),ply:toon(0xffffff,{map:TEX.ply}),ribs:toon(0xffffff,{map:TEX.ribs}),ribsClaw:toon(0xffffff,{map:TEX.ribsClaw}),
  pallet:toon(0xffffff,{map:TEX.pallet}),blanket:toon(0x2d3a4e),tarp:toon(0x23402f),barrelB:toon(0x1f4f8c),barrelR:toon(0x8c231c),
  desk:toon(0x5a4630),door:toon(0x3d4147),forkY:toon(0xb8901a),wood:toon(0x6e5333),paper:toon(0xd8d2c0),
  box:TEX.box.map(t=>toon(0xffffff,{map:t})),fragile:toon(0xffffff,{map:TEX.fragile}),old:toon(0xffffff,{map:TEX.old}),
  bulbOn:basic(0xffd7a0),bulbOff:toon(0x2a2824),shade:toon(0x23352b),
  red:basic(0xff2a1a),green:basic(0x2aff6a),screen:basic(0x2f7a5e),
  skin:toon(0xc9a184),hat:toon(0xe0b51c),pants:toon(0x262a33),
  lurkSkin:toon(0xffffff,{map:TEX.lskin}),lurkDark:toon(0x35302a),lurkRib:toon(0x3a362f),crawlSkin:toon(0xb7ab9c),crawlFace:toon(0xffffff,{map:TEX.cface}),hair:toon(0x0b0a0a),tooth:toon(0xe8e0c8),gum:toon(0x5a1414),eye:basic(0xfff2a0),
  stalkBody:toon(0x1c1c22),stalkFace:toon(0xffffff,{map:TEX.face}),mimicLeg:toon(0x16120e),tongue:toon(0x9a2a2a),
};
