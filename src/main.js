/* global THREE */
/* ============================================================================
   DEAD RAILS 1899 — single-bundle build.
   Mỗi section dưới đây tương ứng 1 file trong cây thư mục đề bài.
   ========================================================================== */
(function () {
"use strict";

/* ==========================================================================
   src/core/Constants.js
   ========================================================================== */
const K = {
  TRACK_LENGTH: 80000,
  TRAIN_SPEED: 55,            // m/s ở throttle 100%
  FUEL_MAX: 100,
  FUEL_PER_M: 0.0042,
  TRAIN_HP: 1000,
  PLAYER_HP: 100,
  START_MONEY: 50,
  EYE: 1.65,
  WALK: 4.6, RUN: 7.4, MOUNT: 12,
  GRAV: 22,
  DAY_LENGTH: 300,            // 1 ngày in-game = 300s thật
  SPD: 0.2,                   // hệ số quy đổi "SPD" trong bảng -> m/s
  DECK_Y: 2.25,
  LOAD_DIST: 320, UNLOAD_DIST: 460,
  MAX_ENEMIES: 55
};

const ITEMS = {
  // --- tiêu hao / công cụ ---
  coal:        {n:'Coal',            d:'Nhiên liệu tàu (+10 fuel)',      buy:8,  sell:4,  fuel:10, cat:'misc'},
  wood:        {n:'Wood Plank',      d:'Gỗ vụn (+5 fuel)',               buy:0,  sell:2,  fuel:5,  cat:'misc'},
  torch:       {n:'Torch',           d:'Soi sáng 12m, đốt cháy zombie',  buy:5,  sell:2,  cat:'tool', use:true},
  bandage:     {n:'Bandage',         d:'Hồi 30 HP / hồi sinh đồng đội',  buy:10, sell:5,  heal:30, cat:'tool', use:true},
  snakeoil:    {n:'Snake Oil',       d:'Hồi 75 HP',                      buy:35, sell:15, heal:75, cat:'tool', use:true},
  banjo:       {n:'Banjo',           d:'Gảy đàn → hút zombie về phía âm thanh', buy:20, sell:8, cat:'tool', use:true},
  newspaper:   {n:'Newspaper',       d:'Giáp tàu: chặn 1 lần damage',    buy:3,  sell:1,  cat:'tool', use:true},
  saddle:      {n:'Saddle',          d:'Cưỡi Horse / Unicorn / Wolf',    buy:45, sell:18, cat:'tool'},
  dynamite:    {n:'Dynamite',        d:'Ném (G) → nổ sau 3s, AOE 9m',    buy:40, sell:18, cat:'throw', throwable:true},
  holywater:   {n:'Holy Water',      d:'Ném (G) → sét đánh, AOE undead', buy:0,  sell:30, cat:'throw', throwable:true},
  crucifix:    {n:'Crucifix',        d:'Đặt xuống → vùng thiêng đốt undead', buy:0, sell:50, cat:'tool', use:true},
  vaultcode:   {n:'Vault Code',      d:'Mã két sắt ngân hàng',           buy:0,  sell:0,  cat:'quest'},
  depotkey:    {n:'Supply Depot Key',d:'Mở kho Fort Constitution',       buy:0,  sell:0,  cat:'quest'},
  vampireknife:{n:'Vampire Knife',   d:'Dao cận chiến 90 dmg, hút máu',  buy:0,  sell:60, cat:'weapon'},
  // --- loot bán được ---
  gold_bar:      {n:'Gold Bar',        sell:50, cat:'loot'},
  silver_bar:    {n:'Silver Bar',      sell:30, cat:'loot'},
  gold_nugget:   {n:'Gold Nugget',     sell:20, cat:'loot', rndSell:[15,25]},
  gold_sculpt:   {n:'Gold Sculpture',  sell:45, cat:'loot'},
  silver_sculpt: {n:'Silver Sculpture',sell:25, cat:'loot'},
  gold_picture:  {n:'Gold Picture',    sell:35, cat:'loot'},
  stone_statue:  {n:'Stone Statue',    sell:5,  cat:'loot'},
  bonds:         {n:'Bonds',           sell:100,cat:'loot'},
  vase:          {n:'Vase',            sell:8,  cat:'loot'},
  junk:          {n:'Junk',            sell:5,  cat:'loot'},
  // --- xác ---
  corpse_zombie:  {n:'Xác Zombie',   sell:0,   fuel:6,  cat:'corpse'},
  corpse_wolf:    {n:'Xác Wolf',     sell:8,   fuel:8,  cat:'corpse'},
  corpse_outlaw:  {n:'Xác Outlaw',   sell:35,  fuel:10, cat:'corpse'},
  corpse_werewolf:{n:'Xác Werewolf', sell:20,  fuel:15, cat:'corpse'},
  corpse_vampire: {n:'Xác Vampire',  sell:15,  fuel:8,  cat:'corpse'},
  corpse_unicorn: {n:'Xác Unicorn',  sell:150, fuel:12, cat:'corpse'},
  corpse_horse:   {n:'Xác Horse',    sell:10,  fuel:10, cat:'corpse'},
  corpse_prescott:{n:'Xác Cpt. Prescott', sell:150, fuel:20, cat:'corpse'},
  // --- đạn (mua theo gói) ---
  ammo_revolver:{n:'Đạn Revolver x12', buy:10, ammo:'revolver', amt:12, cat:'ammo'},
  ammo_rifle:   {n:'Đạn Rifle x8',     buy:15, ammo:'rifle',    amt:8,  cat:'ammo'},
  ammo_shotgun: {n:'Đạn Shotgun x6',   buy:12, ammo:'shotgun',  amt:6,  cat:'ammo'},
  ammo_maxim:   {n:'Đạn Maxim x30',    buy:20, ammo:'maxim',    amt:30, cat:'ammo'}
};

const WEAPONS = {
  fists:         {n:'Nắm đấm',        dmg:15, rate:.45, melee:true,  range:2.4},
  vampireknife:  {n:'Vampire Knife',  dmg:90, rate:.5,  melee:true,  range:2.8, lifesteal:.25},
  revolver:      {n:'Revolver',       dmg:34, rate:.32, mag:6,  ammo:'revolver', range:90,  spread:.020, buy:35},
  rifle:         {n:'Rifle',          dmg:55, rate:.85, mag:5,  ammo:'rifle',    range:400, spread:.004, buy:75},
  shotgun:       {n:'Shotgun',        dmg:17, rate:.75, mag:6,  ammo:'shotgun',  range:34,  spread:.085, pellets:8, buy:60},
  revolvingrifle:{n:'Revolving Rifle',dmg:50, rate:.55, mag:6,  ammo:'rifle',    range:320, spread:.0015, buy:90, hsKill:true},
  maxim:         {n:'Maxim Gun',      dmg:22, rate:.085,mag:30, ammo:'maxim',    range:150, spread:.030, buy:125, turret:true}
};

const MOBS = {
  zombie:   {n:'Zombie',        hp:60,  spd:8,  dmg:8,  atk:1.1, undead:true, corpse:'corpse_zombie',  c:0x54703f, c2:0x6b5a3a},
  runner:   {n:'Runner Zombie', hp:60,  spd:20, dmg:10, atk:.85, undead:true, corpse:'corpse_zombie',  c:0x7a3b30, c2:0x4a3a2a},
  wolf:     {n:'Wolf',          hp:100, spd:20, dmg:12, atk:.9,  beast:true,  corpse:'corpse_wolf',    c:0x5a5148, quad:true},
  werewolf: {n:'Werewolf',      hp:500, spd:25, dmg:35, atk:1.2, beast:true,  corpse:'corpse_werewolf',c:0x3b3128, big:true},
  outlaw:   {n:'Outlaw',        hp:100, spd:30, dmg:11, atk:1.3, ranged:true, corpse:'corpse_outlaw',  c:0x6b4a2c, c2:0x2c2420},
  vampire:  {n:'Vampire',       hp:150, spd:16, dmg:20, atk:1.1, undead:true, corpse:'corpse_vampire', c:0x1c1420, c2:0x8b1020, blink:true},
  banker:   {n:'Zombie Banker', hp:120, spd:8,  dmg:10, atk:1.1, undead:true, corpse:'corpse_zombie',  c:0x3a4a3a, c2:0x111111},
  prescott: {n:'Captain Prescott', hp:900, spd:14, dmg:26, atk:1.0, ranged:true, boss:true,
             corpse:'corpse_prescott', c:0x2f4256, c2:0xb0952f},
  horse:    {n:'Horse',         hp:100, spd:30, passive:true, corpse:'corpse_horse',  c:0x5b3a22, quad:true},
  unicorn:  {n:'Unicorn',       hp:100, spd:30, passive:true, corpse:'corpse_unicorn',c:0xf2eaf5, quad:true, magic:true}
};

/* ==========================================================================
   src/core/Utils
   ========================================================================== */
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const rnd=(a,b)=>a+Math.random()*(b-a);
const rndi=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
function mulberry32(s){return function(){s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const fmt=n=>n.toLocaleString('en-US');

/* ==========================================================================
   src/assets/ProceduralTextures.js
   ========================================================================== */
const Tex = (function(){
  const cache={};
  function make(key,w,h,draw){
    if(cache[key])return cache[key];
    const c=document.createElement('canvas');c.width=w;c.height=h;
    draw(c.getContext('2d'),w,h);
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;
    cache[key]=t;return t;
  }
  function noise(ctx,w,h,amt,base){
    const img=ctx.getImageData(0,0,w,h),d=img.data;
    for(let i=0;i<d.length;i+=4){const n=(Math.random()-.5)*amt;
      d[i]=clamp(d[i]+n,0,255);d[i+1]=clamp(d[i+1]+n,0,255);d[i+2]=clamp(d[i+2]+n,0,255);}
    ctx.putImageData(img,0,0);
  }
  return {
    sand(){return make('sand',256,256,(x,w,h)=>{
      x.fillStyle='#c9a870';x.fillRect(0,0,w,h);
      for(let i=0;i<160;i++){x.fillStyle=`rgba(${170+Math.random()*50},${140+Math.random()*40},${90+Math.random()*40},.35)`;
        x.beginPath();x.ellipse(Math.random()*w,Math.random()*h,rnd(8,40),rnd(2,7),Math.random()*3,0,7);x.fill();}
      noise(x,w,h,26);});},
    wood(){return make('wood',128,128,(x,w,h)=>{
      x.fillStyle='#6b4a2a';x.fillRect(0,0,w,h);
      for(let i=0;i<26;i++){x.fillStyle=`rgba(${60+Math.random()*50},${38+Math.random()*30},${18+Math.random()*20},.6)`;
        x.fillRect(0,i*5,w,rnd(1,3));}
      for(let i=0;i<6;i++){x.strokeStyle='#3a2716';x.lineWidth=2;x.beginPath();
        x.moveTo(i*22,0);x.lineTo(i*22,h);x.stroke();}
      noise(x,w,h,18);});},
    plank(){return make('plank',128,128,(x,w,h)=>{
      x.fillStyle='#8a6a45';x.fillRect(0,0,w,h);
      for(let i=0;i<8;i++){x.fillStyle=i%2?'#7a5c3b':'#96754c';x.fillRect(0,i*16,w,15);}
      noise(x,w,h,22);});},
    stone(){return make('stone',128,128,(x,w,h)=>{
      x.fillStyle='#6e6a63';x.fillRect(0,0,w,h);
      for(let i=0;i<40;i++){x.fillStyle=`rgba(${90+Math.random()*50},${88+Math.random()*45},${82+Math.random()*40},.8)`;
        x.fillRect(rnd(0,w),rnd(0,h),rnd(10,30),rnd(8,18));}
      x.strokeStyle='#4a4741';x.lineWidth=2;
      for(let r=0;r<8;r++)for(let c2=0;c2<4;c2++)x.strokeRect(c2*32+(r%2?16:0),r*16,32,16);
      noise(x,w,h,16);});},
    metal(){return make('metal',64,64,(x,w,h)=>{
      x.fillStyle='#3b3b40';x.fillRect(0,0,w,h);noise(x,w,h,34);});},
    roof(){return make('roof',64,64,(x,w,h)=>{
      x.fillStyle='#5a2f22';x.fillRect(0,0,w,h);
      for(let i=0;i<8;i++){x.fillStyle=i%2?'#4a2519':'#6b3a29';x.fillRect(0,i*8,w,7);}
      noise(x,w,h,14);});},
    paper(){return make('paper',64,64,(x,w,h)=>{
      x.fillStyle='#ddd4bb';x.fillRect(0,0,w,h);x.fillStyle='#5a5348';
      for(let i=3;i<h;i+=5)x.fillRect(4,i,w-8,1.6);
      x.fillStyle='#2a2620';x.fillRect(6,4,w-12,7);});}
  };
})();

/* ==========================================================================
   src/assets/ProceduralAudio.js
   ========================================================================== */
const Audio2 = (function(){
  let ctx=null,master=null;
  function init(){ if(ctx)return; ctx=new (window.AudioContext||window.webkitAudioContext)();
    master=ctx.createGain(); master.gain.value=.32; master.connect(ctx.destination); }
  function noiseBuf(d){ const n=ctx.sampleRate*d,b=ctx.createBuffer(1,n,ctx.sampleRate),o=b.getChannelData(0);
    for(let i=0;i<n;i++)o[i]=Math.random()*2-1; return b; }
  function burst(dur,freq,vol,type){ if(!ctx)return;
    const s=ctx.createBufferSource();s.buffer=noiseBuf(dur);
    const f=ctx.createBiquadFilter();f.type=type||'lowpass';f.frequency.value=freq;
    const g=ctx.createGain();g.gain.setValueAtTime(vol,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(.0008,ctx.currentTime+dur);
    s.connect(f);f.connect(g);g.connect(master);s.start();}
  function tone(f0,f1,dur,vol,type){ if(!ctx)return;
    const o=ctx.createOscillator(),g=ctx.createGain();o.type=type||'sine';
    o.frequency.setValueAtTime(f0,ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(f1,1),ctx.currentTime+dur);
    g.gain.setValueAtTime(vol,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(.0008,ctx.currentTime+dur);
    o.connect(g);g.connect(master);o.start();o.stop(ctx.currentTime+dur);}
  return {
    init, get ok(){return !!ctx;},
    shot(w){ if(!ctx)return;
      if(w==='shotgun'){burst(.35,1400,.9);tone(120,40,.25,.5,'square');}
      else if(w==='maxim'){burst(.10,2400,.55);tone(200,70,.07,.28,'square');}
      else if(w==='rifle'||w==='revolvingrifle'){burst(.28,2600,.75);tone(300,60,.14,.35,'sawtooth');}
      else {burst(.18,2000,.6);tone(260,70,.1,.3,'square');}},
    dry(){tone(900,300,.06,.2,'square');},
    reload(){tone(500,900,.08,.18,'square');setTimeout(()=>tone(700,400,.1,.18,'square'),160);},
    hit(){burst(.08,900,.4);},
    melee(){burst(.12,600,.35);},
    explode(){burst(1.3,320,1.0);tone(90,25,.9,.6,'sawtooth');},
    thunder(){burst(1.8,700,.95,'bandpass');tone(70,20,1.4,.5,'sine');},
    groan(){tone(rnd(90,150),rnd(50,80),.7,.16,'sawtooth');},
    howl(){tone(400,180,1.2,.22,'sine');},
    banjo(){[392,494,587,392,330].forEach((f,i)=>setTimeout(()=>tone(f,f*.96,.42,.22,'triangle'),i*135));},
    pickup(){tone(660,990,.09,.16,'triangle');},
    buy(){tone(880,1320,.12,.18,'triangle');setTimeout(()=>tone(1320,1760,.1,.14,'triangle'),90);},
    sell(){tone(523,784,.14,.2,'triangle');},
    err(){tone(200,120,.16,.2,'square');},
    hurt(){tone(220,80,.25,.3,'sawtooth');},
    whistle(){tone(520,500,.9,.28,'sine');setTimeout(()=>tone(660,640,.7,.2,'sine'),120);},
    chug(){tone(70,45,.16,.10,'sine');burst(.14,300,.07);}
  };
})();

/* ==========================================================================
   src/core/Scene.js
   ========================================================================== */
const canvas=document.getElementById('game');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;

const scene=new THREE.Scene();
scene.fog=new THREE.Fog(0xd8b98a,60,600);
const camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,.1,3000);

const hemi=new THREE.HemisphereLight(0xffe0b0,0x6b5334,.75);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0d0,1.1);
sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.left=-70;sun.shadow.camera.right=70;
sun.shadow.camera.top=70;sun.shadow.camera.bottom=-70;sun.shadow.camera.far=300;
scene.add(sun);scene.add(sun.target);
const ambient=new THREE.AmbientLight(0x404050,.3);scene.add(ambient);

const torchLight=new THREE.PointLight(0xffa040,0,14,2);scene.add(torchLight);
const muzzleLight=new THREE.PointLight(0xffd070,0,22,2);scene.add(muzzleLight);

addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});

// vật liệu dùng chung
const MAT={
  sand:new THREE.MeshLambertMaterial({map:Tex.sand()}),
  wood:new THREE.MeshLambertMaterial({map:Tex.wood()}),
  plank:new THREE.MeshLambertMaterial({map:Tex.plank()}),
  stone:new THREE.MeshLambertMaterial({map:Tex.stone()}),
  metal:new THREE.MeshLambertMaterial({map:Tex.metal()}),
  roof:new THREE.MeshLambertMaterial({map:Tex.roof()}),
  paper:new THREE.MeshLambertMaterial({map:Tex.paper()}),
  dark:new THREE.MeshLambertMaterial({color:0x241a12}),
  gold:new THREE.MeshLambertMaterial({color:0xf0c650,emissive:0x4a3700}),
  silver:new THREE.MeshLambertMaterial({color:0xd8d8e0,emissive:0x333340}),
  cactus:new THREE.MeshLambertMaterial({color:0x4d7a3a}),
  rock:new THREE.MeshLambertMaterial({color:0x8a7b64}),
  glass:new THREE.MeshLambertMaterial({color:0x88aacc,transparent:true,opacity:.35}),
  blood:new THREE.MeshBasicMaterial({color:0x8b0000})
};
const BOX=new THREE.BoxGeometry(1,1,1);
function box(w,h,d,mat,x,y,z,parent){
  const m=new THREE.Mesh(BOX,mat);m.scale.set(w,h,d);m.position.set(x,y,z);
  m.castShadow=true;m.receiveShadow=true;if(parent)parent.add(m);return m;
}

/* ==========================================================================
   src/core/InputManager.js
   ========================================================================== */
const Input={keys:{},mouse:{down:false},locked:false,yaw:0,pitch:0,
  justPressed:{},
  isDown(c){return !!this.keys[c];},
  consume(c){if(this.justPressed[c]){this.justPressed[c]=false;return true;}return false;}};
addEventListener('keydown',e=>{
  if(!Input.keys[e.code])Input.justPressed[e.code]=true;
  Input.keys[e.code]=true;
  if(['Tab','Space','KeyE','KeyF','KeyG','Digit1','Digit2','Digit3'].includes(e.code))e.preventDefault();
});
addEventListener('keyup',e=>{Input.keys[e.code]=false;});
addEventListener('mousedown',e=>{if(e.button===0)Input.mouse.down=true;});
addEventListener('mouseup',e=>{if(e.button===0)Input.mouse.down=false;});
document.addEventListener('pointerlockchange',()=>{
  Input.locked=(document.pointerLockElement===canvas);
  if(!Input.locked&&Game.state==='PLAYING'&&!UI.anyOverlay())Game.pause();
});
addEventListener('mousemove',e=>{
  if(!Input.locked)return;
  Input.yaw-=e.movementX*0.0022;
  Input.pitch=clamp(Input.pitch-e.movementY*0.0022,-1.5,1.5);
});
canvas.addEventListener('click',()=>{if(Game.state==='PLAYING'&&!UI.anyOverlay())canvas.requestPointerLock();});

/* ==========================================================================
   src/world/Terrain.js  — sa mạc + cactus + đá theo chunk
   ========================================================================== */
const Terrain=(function(){
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(1400,1400,1,1),MAT.sand);
  ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  MAT.sand.map.repeat.set(180,180);
  const CH=120,R=3,chunks=new Map();
  const cactusG=new THREE.CylinderGeometry(.32,.38,3.2,7);
  const rockG=new THREE.DodecahedronGeometry(1,0);
  function build(cx,cz){
    const g=new THREE.Group();const r=mulberry32(cx*73856093^cz*19349663);
    const n=Math.floor(r()*7);
    for(let i=0;i<n;i++){
      const x=cx*CH+r()*CH,z=cz*CH+r()*CH;
      if(Math.abs(z)<16)continue;                    // chừa hành lang đường ray
      if(r()<.55){
        const c=new THREE.Mesh(cactusG,MAT.cactus);
        const s=.7+r()*.9;c.scale.set(s,s,s);c.position.set(x,1.6*s,z);c.castShadow=true;g.add(c);
        if(r()<.6){const a=new THREE.Mesh(cactusG,MAT.cactus);a.scale.set(.4*s,.35*s,.4*s);
          a.position.set(x+.55*s,2.1*s,z);a.rotation.z=.6;a.castShadow=true;g.add(a);}
      }else{
        const k=new THREE.Mesh(rockG,MAT.rock);
        const s=.5+r()*1.6;k.scale.set(s,s*.7,s);k.position.set(x,s*.3,z);k.castShadow=true;
        k.receiveShadow=true;g.add(k);
      }
    }
    scene.add(g);return g;
  }
  return{
    update(px,pz){
      ground.position.set(Math.round(px/50)*50,0,Math.round(pz/50)*50);
      MAT.sand.map.offset.set(ground.position.x/(1400/180),-ground.position.z/(1400/180));
      const ccx=Math.floor(px/CH),ccz=Math.floor(pz/CH);
      for(let i=-R;i<=R;i++)for(let j=-R;j<=R;j++){
        const key=(ccx+i)+','+(ccz+j);
        if(!chunks.has(key))chunks.set(key,build(ccx+i,ccz+j));
      }
      chunks.forEach((g,key)=>{
        const[a,b]=key.split(',').map(Number);
        if(Math.abs(a-ccx)>R+1||Math.abs(b-ccz)>R+1){scene.remove(g);chunks.delete(key);}
      });
    }
  };
})();

/* ==========================================================================
   src/world/Railroad.js  — đường ray dựng theo chunk dọc trục X
   ========================================================================== */
const Railroad=(function(){
  const CH=120,R=4,chunks=new Map();
  const sleeperG=new THREE.BoxGeometry(.4,.18,3.2);
  function build(cx){
    const g=new THREE.Group();
    const railL=box(CH,.16,.18,MAT.metal,cx*CH+CH/2,.42,-.72);
    const railR=box(CH,.16,.18,MAT.metal,cx*CH+CH/2,.42,.72);
    g.add(railL,railR);
    const im=new THREE.InstancedMesh(sleeperG,MAT.wood,Math.floor(CH/1.6));
    const d=new THREE.Object3D();
    for(let i=0;i<im.count;i++){d.position.set(cx*CH+i*1.6,.28,0);d.updateMatrix();im.setMatrixAt(i,d.matrix);}
    im.castShadow=false;im.receiveShadow=true;g.add(im);
    const bal=box(CH,.24,4.4,MAT.rock,cx*CH+CH/2,.12,0);bal.castShadow=false;g.add(bal);
    scene.add(g);return g;
  }
  return{update(px){
    const c=Math.floor(px/CH);
    for(let i=-R;i<=R;i++){const k=c+i;if(!chunks.has(k))chunks.set(k,build(k));}
    chunks.forEach((g,k)=>{if(Math.abs(k-c)>R+1){scene.remove(g);chunks.delete(k);}});
  }};
})();

/* ==========================================================================
   src/world/DayNight.js
   ========================================================================== */
const DayNight={
  t:6.5,                      // giờ in-game
  phase:'DAY',                // DAY | NIGHT | FULLMOON | BLOODMOON
  dayCount:0,
  update(dt){
    const prev=this.t;
    this.t=(this.t+dt*(24/K.DAY_LENGTH))%24;
    if(this.t<prev){this.dayCount++;}
    const night=(this.t>=22||this.t<5);
    if(night&&this.phase==='DAY'){
      const r=Math.random();
      if(r<.18){this.phase='FULLMOON';EventManager.onMoon('FULLMOON');}
      else if(r<.32){this.phase='BLOODMOON';EventManager.onMoon('BLOODMOON');}
      else {this.phase='NIGHT';UI.notify('🌙 MÀN ĐÊM BUÔNG XUỐNG','warn');}
    }
    if(!night&&this.phase!=='DAY'){this.phase='DAY';UI.notify('🌞 BÌNH MINH — an toàn hơn đôi chút','good');
      document.getElementById('moonflash').style.opacity=0;}
    // ánh sáng
    const ang=((this.t-6)/24)*Math.PI*2;
    const h=Math.sin(ang);
    sun.position.set(Math.cos(ang)*120+Player.pos.x,Math.max(h*120,-40),60+Player.pos.z);
    sun.target.position.copy(Player.pos);
    const day=clamp(h*1.6+.35,0,1);
    let skyC,fogC,sunC,inten;
    if(this.phase==='BLOODMOON'){skyC=0x2a0508;fogC=0x3a0a0c;sunC=0xff3a3a;inten=.30;}
    else if(this.phase==='FULLMOON'){skyC=0x0b1224;fogC=0x141d33;sunC=0x9fb6ff;inten=.34;}
    else if(day<.25){skyC=0x0a0d18;fogC=0x121624;sunC=0x8fa0cc;inten=.16;}
    else {skyC=0x87b6d8;fogC=0xd8b98a;sunC=0xfff0d0;inten=.35+day*.85;}
    const sk=new THREE.Color(skyC),fg=new THREE.Color(fogC);
    scene.background=sk;scene.fog.color.copy(fg);
    scene.fog.near=day<.25?18:60;scene.fog.far=day<.25?170:600;
    sun.color.setHex(sunC);sun.intensity=inten;
    hemi.intensity=.12+day*.7;
    hemi.color.setHex(day<.25?0x223046:0xffe0b0);
    ambient.intensity=this.phase==='BLOODMOON'?.35:.22+day*.2;
    ambient.color.setHex(this.phase==='BLOODMOON'?0x4a0a0a:0x404050);
  },
  isNight(){return this.phase!=='DAY';},
  label(){
    const hh=String(Math.floor(this.t)).padStart(2,'0'),mm=String(Math.floor((this.t%1)*60)).padStart(2,'0');
    const m={DAY:'🌞 NGÀY',NIGHT:'🌙 ĐÊM',FULLMOON:'🌕 FULL MOON',BLOODMOON:'🩸 BLOOD MOON'}[this.phase];
    return `${m} — ${hh}:${mm}`;
  },
  danger(){return{DAY:1,NIGHT:1.7,FULLMOON:2.4,BLOODMOON:2.6}[this.phase];}
};

/* ==========================================================================
   src/world/Colliders — AABB tĩnh
   ========================================================================== */
const Colliders={
  list:[],
  addFromMesh(m){m.updateWorldMatrix(true,false);
    const b=new THREE.Box3().setFromObject(m);this.list.push(b);return b;},
  remove(arr){this.list=this.list.filter(b=>arr.indexOf(b)<0);},
  resolve(pos,r,py){
    for(let i=0;i<this.list.length;i++){
      const b=this.list[i];
      if(py+1.7<b.min.y||py>b.max.y)continue;
      if(pos.x<b.min.x-r||pos.x>b.max.x+r||pos.z<b.min.z-r||pos.z>b.max.z+r)continue;
      const dxl=pos.x-(b.min.x-r),dxr=(b.max.x+r)-pos.x;
      const dzl=pos.z-(b.min.z-r),dzr=(b.max.z+r)-pos.z;
      const m=Math.min(dxl,dxr,dzl,dzr);
      if(m===dxl)pos.x=b.min.x-r;else if(m===dxr)pos.x=b.max.x+r;
      else if(m===dzl)pos.z=b.min.z-r;else pos.z=b.max.z+r;
    }
  }
};

/* ==========================================================================
   src/world/Interactables
   ========================================================================== */
const Interact={
  list:[],
  add(o){this.list.push(o);return o;},
  removeGroup(g){this.list=this.list.filter(o=>o.owner!==g);},
  nearest(p){
    let best=null,bd=1e9;
    for(const o of this.list){
      if(o.dead)continue;
      const wp=o.pos||o.obj.getWorldPosition(new THREE.Vector3());
      const d=wp.distanceTo(p);
      if(d<(o.radius||3)&&d<bd){bd=d;best=o;}
    }
    return best;
  }
};

/* ==========================================================================
   src/buildings/*  — BuildingFactory + các loại nhà
   ========================================================================== */
const Build=(function(){
  function shell(g,w,d,h,mat,doorSide,solids,noRoof){
    const t=.25;
    const floor=box(w,.2,d,MAT.plank,0,.1,0,g);floor.receiveShadow=true;
    function wall(sx,sy,sz,px,py,pz){const m=box(sx,sy,sz,mat,px,py,pz,g);solids.push(m);return m;}
    const dw=2.2;
    // 4 tường, chừa cửa ở doorSide
    const sides=[['S',0,d/2],['N',0,-d/2],['E',w/2,0],['W',-w/2,0]];
    for(const[s,px,pz]of sides){
      const horiz=(s==='S'||s==='N');
      const len=horiz?w:d;
      if(s===doorSide){
        const seg=(len-dw)/2;
        if(horiz){wall(seg,h,t,-(dw/2+seg/2),h/2,pz);wall(seg,h,t,(dw/2+seg/2),h/2,pz);
                  wall(dw,h-2.2,t,0,h-(h-2.2)/2,pz);}
        else{wall(t,h,seg,px,h/2,-(dw/2+seg/2));wall(t,h,seg,px,h/2,(dw/2+seg/2));
             wall(t,h-2.2,dw,px,h-(h-2.2)/2,0);}
      }else{
        if(horiz)wall(w,h,t,0,h/2,pz);else wall(t,h,d,px,h/2,0);
      }
    }
    if(!noRoof){const r=box(w+.7,.3,d+.7,MAT.roof,0,h+.15,0,g);
      const r2=box(w*.75,.3,d*.75,MAT.roof,0,h+.55,0,g);}
    return g;
  }
  function lantern(g,x,y,z){
    const m=box(.3,.4,.3,new THREE.MeshBasicMaterial({color:0xffb050}),x,y,z,g);
    const l=new THREE.PointLight(0xffa040,.9,9,2);l.position.set(x,y,z);g.add(l);
    g.userData.lights=(g.userData.lights||[]).concat(l);return m;
  }
  function table(g,x,z){box(1.6,.12,.9,MAT.plank,x,.85,z,g);
    [[-.7,-.35],[.7,-.35],[-.7,.35],[.7,.35]].forEach(([a,b])=>box(.12,.85,.12,MAT.wood,x+a,.42,z+b,g));}

  function container(g,x,y,z,loot,label,owner,mat){
    const m=box(.9,.9,.7,mat||MAT.wood,x,y,z,g);
    Interact.add({obj:m,radius:2.4,label:label||'Lục lọi',kind:'loot',data:{loot},owner});
    return m;
  }
  function counter(g,x,z,shopId,owner,color){
    const m=box(3.2,1.1,.9,MAT.plank,x,.55,z,g);
    box(3.4,.12,1.1,MAT.wood,x,1.16,z,g);
    Interact.add({obj:m,radius:3.2,label:{general:'GENERAL STORE',gunsmith:'GUNSMITH',trading:'TRADING POST'}[shopId],
      kind:'shop',data:{shop:shopId},owner});
    return m;
  }

  return {
    /* ---- buildings/House.js ---- */
    house(opts,solids,owner){
      const g=new THREE.Group();
      const w=opts.w||8,d=opts.d||7,h=opts.h||3.4;
      shell(g,w,d,h,opts.mat||MAT.wood,opts.door||'S',solids);
      table(g,rnd(-w/4,w/4),rnd(-d/4,d/4));
      lantern(g,w/2-.7,2.6,-d/2+.7);
      if(opts.loot)for(let i=0;i<opts.loot.length;i++)
        container(g,-w/2+1.2+i*1.4,.55,-d/2+1.1,opts.loot[i],'Lục tủ',owner);
      return g;
    },
    /* ---- buildings/Church.js ---- */
    church(solids,owner){
      const g=new THREE.Group();
      shell(g,10,16,5.5,MAT.stone,'S',solids);
      const tower=box(3,9,3,MAT.stone,0,4.5,-6.5,g);solids.push(tower);
      box(.4,3.2,.4,MAT.plank,0,10.6,-6.5,g);box(1.8,.4,.4,MAT.plank,0,10.2,-6.5,g);
      for(let i=0;i<5;i++){box(6,.25,.7,MAT.plank,0,.85,-4+i*2.2,g);}
      box(3,1,1.2,MAT.plank,0,.5,-6,g);
      lantern(g,0,4,-2);lantern(g,0,4,4);
      const alt=box(1.2,1,1,MAT.stone,0,.5,-6.6,g);
      Interact.add({obj:alt,radius:2.6,label:'Lục bàn thờ',kind:'loot',
        data:{loot:[['holywater',rndi(1,2)],['crucifix',rndi(1,2)]]},owner});
      g.userData.holy=true;
      return g;
    },
    /* ---- buildings/GeneralStore.js / Gunsmith.js / TradingPost.js ---- */
    shop(id,solids,owner){
      const g=new THREE.Group();
      shell(g,11,9,4,MAT.plank,'S',solids);
      counter(g,0,-1.6,id,owner);
      lantern(g,-4,3,-3);lantern(g,4,3,-3);
      const signC=document.createElement('canvas');signC.width=512;signC.height=128;
      const cx2=signC.getContext('2d');
      cx2.fillStyle='#2b1c10';cx2.fillRect(0,0,512,128);
      cx2.strokeStyle='#c9a24a';cx2.lineWidth=6;cx2.strokeRect(8,8,496,112);
      cx2.fillStyle='#e8c46a';cx2.font='bold 52px Courier New';cx2.textAlign='center';
      cx2.fillText({general:'GENERAL STORE',gunsmith:'GUNSMITH',trading:'TRADING POST'}[id],256,82);
      const st=new THREE.CanvasTexture(signC);
      const sign=new THREE.Mesh(new THREE.PlaneGeometry(7,1.75),
        new THREE.MeshBasicMaterial({map:st}));
      sign.position.set(0,4.5,4.7);g.add(sign);
      // hàng hoá trang trí
      if(id==='gunsmith')for(let i=0;i<4;i++)box(.14,.14,1.5,MAT.metal,-3+i*2,2.2,-4.1,g);
      if(id==='general')for(let i=0;i<5;i++)box(.6,.6,.6,MAT.wood,-3.5+i*1.7,1.9,-4,g);
      if(id==='trading'){box(.5,.5,.5,MAT.gold,-3,1.7,-4,g);box(.5,.5,.5,MAT.silver,3,1.7,-4,g);}
      return g;
    },
    /* ---- buildings/HealthCenter.js ---- */
    healthCenter(solids,owner){
      const g=new THREE.Group();
      shell(g,10,9,4,MAT.plank,'S',solids);
      const c=box(1.1,1.6,.7,new THREE.MeshLambertMaterial({color:0xddddd0}),-3.5,.8,-3.6,g);
      Interact.add({obj:c,radius:2.5,label:'Lục tủ thuốc',kind:'loot',owner,
        data:{loot:[['bandage',rndi(1,3)],['snakeoil',rndi(0,2)]]}});
      box(2.2,.6,1.1,new THREE.MeshLambertMaterial({color:0xcfd4d8}),1.5,.6,-2,g);
      lantern(g,0,3,-3);
      const cross=new THREE.Mesh(new THREE.PlaneGeometry(1.6,1.6),
        new THREE.MeshBasicMaterial({color:0xcc2222}));cross.position.set(0,4.3,4.6);g.add(cross);
      return g;
    },
    /* ---- buildings/Bank.js ---- */
    bank(solids,owner,code){
      const g=new THREE.Group();
      shell(g,14,12,5,MAT.stone,'S',solids);
      for(let i=0;i<4;i++)box(.7,5,.7,MAT.stone,-5+i*3.4,2.5,5.6,g);
      const door=box(3,3.2,.5,MAT.metal,0,1.6,-5.6,g);solids.push(door);
      Interact.add({obj:door,radius:3,label:'🔐 Két sắt (cần mã 5 số)',kind:'vault',
        data:{code,open:false,group:g},owner});
      lantern(g,-5,3.6,-4);lantern(g,5,3.6,-4);
      counter(g,4,0,'trading',owner);
      return g;
    },
    /* ---- buildings/Watchtower ---- */
    tower(solids,owner){
      const g=new THREE.Group();
      [[-2,-2],[2,-2],[-2,2],[2,2]].forEach(([x,z])=>{const m=box(.5,9,.5,MAT.wood,x,4.5,z,g);solids.push(m);});
      const plat=box(6,.3,6,MAT.plank,0,9,0,g);solids.push(plat);
      for(let i=0;i<4;i++){const a=i*Math.PI/2;
        box(6,1,.3,MAT.wood,Math.sin(a)*3,9.6,Math.cos(a)*3,g).rotation.y=a;}
      box(7,.3,7,MAT.roof,0,11.4,0,g);
      const lad=box(.6,9,.3,MAT.wood,0,4.5,2.4,g);
      Interact.add({obj:lad,radius:2.6,label:'Trèo lên tháp',kind:'climb',data:{y:9.4},owner});
      return g;
    },
    /* ---- palisade / tường gỗ ---- */
    palisade(g,x0,x1,z,solids,gapAt){
      for(let x=x0;x<x1;x+=2){
        if(gapAt!==undefined&&Math.abs(x-gapAt)<5)continue;
        const p=box(2,4,.5,MAT.wood,x,2,z,g);solids.push(p);
        box(2.1,.3,.7,MAT.wood,x,4.1,z,g);
      }
    },
    palisadeZ(g,z0,z1,x,solids,gapAt){
      for(let z=z0;z<z1;z+=2){
        if(gapAt!==undefined&&Math.abs(z-gapAt)<5)continue;
        const p=box(.5,4,2,MAT.wood,x,2,z,g);solids.push(p);
        box(.7,.3,2.1,MAT.wood,x,4.1,z,g);
      }
    },
    lantern,table,container,counter,shell
  };
})();

/* ==========================================================================
   src/world/locations/*  — mỗi builder trả {group,solids,spawns}
   ========================================================================== */
const LootTable={
  house(){const t=[];const n=rndi(2,5);
    const pool=['junk','junk','vase','coal','newspaper','wood','gold_nugget','stone_statue','bandage','torch'];
    for(let i=0;i<n;i++)t.push([pick(pool),1]);return t;},
  rich(){return[[pick(['gold_bar','silver_bar','gold_sculpt','silver_sculpt','gold_picture']),1],
                ['gold_nugget',rndi(1,3)],['bonds',rndi(0,1)]].filter(x=>x[1]>0);},
  guns(){const t=[['ammo_revolver',1],[pick(['ammo_rifle','ammo_shotgun']),1]];
    if(Math.random()<.35)t.push(['revolvingrifle',1]);
    if(Math.random()<.3)t.push([pick(['revolver','shotgun','rifle']),1]);
    t.push(['junk',rndi(1,2)]);return t;},
  camp(){const t=LootTable.guns();t.push(['dynamite',rndi(0,1)]);t.push(['coal',rndi(1,3)]);
    return t.filter(x=>x[1]>0);}
};

const Locations=(function(){
  function fort(cx,label){
    const g=new THREE.Group();g.position.x=cx;const solids=[],spawns=[];
    // tường bao quanh, chừa lỗ cho đường ray ở x hai đầu
    Build.palisade(g,-60,62,-52,solids);
    Build.palisade(g,-60,62,52,solids);
    Build.palisadeZ(g,-52,54,-60,solids,0);
    Build.palisadeZ(g,-52,54,60,solids,0);
    // 3 shop hữu dụng
    const s1=Build.shop('general',solids,g);s1.position.set(-34,0,-24);g.add(s1);
    const s2=Build.shop('gunsmith',solids,g);s2.position.set(-10,0,-30);g.add(s2);
    const s3=Build.shop('trading',solids,g);s3.position.set(20,0,-26);g.add(s3);
    // 3 nhà trang trí
    const d1=Build.house({w:7,d:6,h:3.2},solids,g);d1.position.set(-34,0,26);g.add(d1);
    const d2=Build.house({w:7,d:6,h:3.2},solids,g);d2.position.set(-8,0,30);g.add(d2);
    const d3=new THREE.Group();Build.shell(d3,9,8,3.6,MAT.plank,'X',solids);
    d3.position.set(24,0,28);g.add(d3);
    Interact.add({obj:d3,pos:new THREE.Vector3(cx+24,1.5,24),radius:3,
      label:'Nhà kho bỏ hoang — cửa khoá chặt',kind:'none',owner:g});
    // đèn + lính canh NPC (trang trí)
    for(let i=-2;i<=2;i++)Build.lantern(g,i*22,3.4,-48);
    for(let i=0;i<4;i++){const s=box(.9,1.9,.6,new THREE.MeshLambertMaterial({color:0x4a5a3a}),
      -40+i*26,1.6,44,g);}
    g.userData.safe=true;g.userData.label=label;
    return{group:g,solids,spawns,safe:true,center:new THREE.Vector3(cx,0,0)};
  }

  return {
    /* ---- StartingZone.js ---- */
    start(){return fort(-40,'FORT KHỞI ĐẦU');},
    /* ---- Checkpoint.js ---- */
    checkpoint(x){const f=fort(x,'CHECKPOINT FORT');f.checkpoint=true;return f;},
    /* ---- AbandonedVillage.js ---- */
    village(x){
      const g=new THREE.Group();g.position.x=x;const solids=[],spawns=[];
      const side=Math.random()<.5?-1:1;
      const houses=rndi(3,5);
      for(let i=0;i<houses;i++){
        const hx=-30+i*16+rnd(-4,4),hz=side*(30+rnd(0,18));
        const h=Build.house({w:rnd(7,9),d:rnd(6,8),h:3.4,loot:[LootTable.house()]},solids,g);
        h.position.set(hx,0,hz);h.rotation.y=rnd(-.3,.3);g.add(h);
        for(let z=0;z<rndi(1,2);z++)spawns.push({type:'zombie',pos:new THREE.Vector3(x+hx+rnd(-3,3),0,hz+rnd(-3,3))});
      }
      const hc=Build.healthCenter(solids,g);hc.position.set(18,0,side*46);g.add(hc);
      spawns.push({type:'zombie',pos:new THREE.Vector3(x+18,0,side*44)});
      if(Math.random()<.6)spawns.push({type:'runner',pos:new THREE.Vector3(x+20,0,side*42)});
      const ch=Build.church(solids,g);ch.position.set(-42,0,side*44);ch.rotation.y=side>0?Math.PI:0;g.add(ch);
      g.userData.churchPos=new THREE.Vector3(x-42,0,side*44);
      return{group:g,solids,spawns,label:'LÀNG BỎ HOANG',center:new THREE.Vector3(x,0,side*36)};
    },
    /* ---- Standalone house ---- */
    standalone(x){
      const g=new THREE.Group();g.position.x=x;const solids=[],spawns=[];
      const side=Math.random()<.5?-1:1,hz=side*rnd(26,44);
      const h=Build.house({w:8,d:7,h:3.4,loot:[LootTable.house(),LootTable.house()]},solids,g);
      h.position.set(0,0,hz);h.rotation.y=rnd(-.4,.4);g.add(h);
      for(let i=0;i<rndi(1,2);i++)spawns.push({type:Math.random()<.25?'runner':'zombie',
        pos:new THREE.Vector3(x+rnd(-4,4),0,hz+rnd(-4,4))});
      if(Math.random()<.35)spawns.push({type:'horse',pos:new THREE.Vector3(x+rnd(-14,14),0,hz+side*14)});
      return{group:g,solids,spawns,label:'NHÀ ĐƠN LẺ',center:new THREE.Vector3(x,0,hz)};
    },
    /* ---- OutlawCamp.js ---- */
    camp(x){
      const g=new THREE.Group();g.position.x=x;const solids=[],spawns=[];
      const side=Math.random()<.5?-1:1,cz=side*rnd(32,48);
      // lều + lửa trại
      for(let i=0;i<3;i++){
        const t=new THREE.Mesh(new THREE.ConeGeometry(2.4,3.4,6),MAT.plank);
        t.position.set(rnd(-12,12),1.7,cz+rnd(-10,10));t.castShadow=true;g.add(t);
        solids.push(t);
      }
      const fire=box(1.4,.4,1.4,new THREE.MeshBasicMaterial({color:0xff7020}),0,.2,cz,g);
      const fl=new THREE.PointLight(0xff8030,1.4,16,2);fl.position.set(0,1.2,cz);g.add(fl);
      const chest=Build.container(g,2.6,.5,cz+2,LootTable.camp(),'Rương của băng cướp',g);
      const n=rndi(3,6);
      for(let i=0;i<n;i++)spawns.push({type:'outlaw',pos:new THREE.Vector3(x+rnd(-14,14),0,cz+rnd(-12,12))});
      if(Math.random()<.5)spawns.push({type:'horse',pos:new THREE.Vector3(x+rnd(-16,16),0,cz+side*16)});
      return{group:g,solids,spawns,label:'OUTLAW CAMP',center:new THREE.Vector3(x,0,cz)};
    },
    /* ---- Town.js ---- */
    town(x){
      const g=new THREE.Group();g.position.x=x;const solids=[],spawns=[];
      const side=Math.random()<.5?-1:1;
      const n=rndi(5,8);
      for(let i=0;i<n;i++){
        const hx=-48+i*15+rnd(-3,3),hz=side*(30+(i%2)*20);
        const h=Build.house({w:rnd(8,11),d:rnd(7,9),h:rnd(3.4,4.6),
          loot:[LootTable.house(),Math.random()<.3?LootTable.rich():LootTable.house()]},solids,g);
        h.position.set(hx,0,hz);g.add(h);
        for(let z=0;z<rndi(1,3);z++)spawns.push({type:Math.random()<.35?'runner':'zombie',
          pos:new THREE.Vector3(x+hx+rnd(-6,6),0,hz+rnd(-6,6))});
      }
      const code=String(rndi(10000,99999));
      const bank=Build.bank(solids,g,code);bank.position.set(20,0,side*52);g.add(bank);
      spawns.push({type:'banker',pos:new THREE.Vector3(x+20,0,side*50),code});
      const ch=Build.church(solids,g);ch.position.set(-40,0,side*54);g.add(ch);
      g.userData.churchPos=new THREE.Vector3(x-40,0,side*54);
      for(let i=0;i<rndi(4,8);i++)spawns.push({type:'zombie',
        pos:new THREE.Vector3(x+rnd(-50,50),0,side*rnd(20,60))});
      return{group:g,solids,spawns,label:'THỊ TRẤN — high risk, high reward',
        center:new THREE.Vector3(x,0,side*40)};
    },
    /* ---- Castle.js ---- */
    castle(x){
      const g=new THREE.Group();g.position.x=x;const solids=[],spawns=[];
      const side=Math.random()<.5?-1:1,cz=side*70;
      const keep=new THREE.Group();
      Build.shell(keep,30,26,10,MAT.stone,'S',solids);
      keep.position.set(0,0,cz);g.add(keep);
      [[-16,-14],[16,-14],[-16,14],[16,14]].forEach(([tx,tz])=>{
        const t=new THREE.Mesh(new THREE.CylinderGeometry(3.4,3.8,16,10),MAT.stone);
        t.position.set(tx,8,cz+tz);t.castShadow=true;g.add(t);solids.push(t);
        const cone=new THREE.Mesh(new THREE.ConeGeometry(4.4,5,10),MAT.roof);
        cone.position.set(tx,18.5,cz+tz);g.add(cone);
      });
      for(let i=0;i<4;i++)Build.container(g,-10+i*7,.6,cz-9,LootTable.rich(),'Rương lâu đài',g);
      Build.container(g,0,.6,cz+6,[['vampireknife',1],['bonds',rndi(1,2)],['gold_bar',rndi(1,2)]],'Quan tài',g);
      Build.lantern(g,-10,6,cz);Build.lantern(g,10,6,cz);
      spawns.push({type:'vampire',pos:new THREE.Vector3(x,0,cz)});
      if(Math.random()<.5)spawns.push({type:'vampire',pos:new THREE.Vector3(x+6,0,cz-4)});
      for(let i=0;i<16;i++)spawns.push({type:'werewolf',
        pos:new THREE.Vector3(x+rnd(-26,26),0,cz+rnd(-22,22))});
      return{group:g,solids,spawns,label:'🏰 LÂU ĐÀI — 15+ WEREWOLF & VAMPIRE',
        center:new THREE.Vector3(x,0,cz),danger:true};
    },
    /* ---- Watchtower ---- */
    watchtower(x){
      const g=new THREE.Group();g.position.x=x;const solids=[],spawns=[];
      const side=Math.random()<.5?-1:1,tz=side*rnd(24,34);
      const t=Build.tower(solids,g);t.position.set(0,0,tz);g.add(t);
      Build.container(g,3,.5,tz+3,LootTable.guns(),'Hòm đạn',g);
      for(let i=0;i<rndi(2,3);i++)spawns.push({type:'outlaw',
        pos:new THREE.Vector3(x+rnd(-2,2),9.4,tz+rnd(-2,2)),onTower:true});
      return{group:g,solids,spawns,label:'THÁP CANH',center:new THREE.Vector3(x,0,tz)};
    },
    /* ---- FortConstitution.js ---- */
    fortC(x){
      const g=new THREE.Group();g.position.x=x;const solids=[],spawns=[];
      const side=Math.random()<.5?-1:1,cz=side*56;
      Build.palisade(g,-40,42,cz-30,solids,0);
      Build.palisade(g,-40,42,cz+30,solids);
      Build.palisadeZ(g,cz-30,cz+32,-40,solids);
      Build.palisadeZ(g,cz-30,cz+32,40,solids);
      const bar=Build.house({w:14,d:10,h:4},solids,g);bar.position.set(-18,0,cz+12);g.add(bar);
      const depot=new THREE.Group();Build.shell(depot,12,10,4.5,MAT.plank,'S',solids);
      depot.position.set(18,0,cz+10);g.add(depot);
      const dd=box(2.4,3,.4,MAT.metal,18,1.5,cz+15.2,g);solids.push(dd);
      Interact.add({obj:dd,radius:3,label:'🔒 Supply Depot (cần chìa khoá)',kind:'depot',
        data:{open:false,group:g,pos:new THREE.Vector3(x+18,0,cz+10)},owner:g});
      const t=Build.tower(solids,g);t.position.set(0,0,cz-16);g.add(t);
      spawns.push({type:'prescott',pos:new THREE.Vector3(x,0,cz)});
      for(let i=0;i<rndi(4,7);i++)spawns.push({type:'outlaw',
        pos:new THREE.Vector3(x+rnd(-30,30),0,cz+rnd(-20,24))});
      return{group:g,solids,spawns,label:'⚔️ FORT CONSTITUTION — BOSS: CPT. PRESCOTT',
        center:new THREE.Vector3(x,0,cz),danger:true};
    }
  };
})();

/* ==========================================================================
   src/world/ProceduralGen.js  — lịch trình địa điểm theo km
   ========================================================================== */
const ProcGen={
  plan:[],loaded:[],
  init(){
    this.plan=[];this.loaded=[];
    this.plan.push({x:-40,type:'start',fixed:true});
    this.plan.push({x:7000,type:'village'});
    for(let x=10000;x<K.TRACK_LENGTH;x+=10000)this.plan.push({x,type:'checkpoint'});
    this.plan.push({x:38000+rnd(-600,600),type:'castle'});
    this.plan.push({x:rnd(20000,70000),type:'fortC'});
    let x=12000;
    while(x<K.TRACK_LENGTH-2000){
      x+=rnd(1000,3000);
      const near=this.plan.some(p=>Math.abs(p.x-x)<900);
      if(near)continue;
      const r=Math.random();
      const type=r<.40?'standalone':r<.68?'camp':r<.88?'town':'watchtower';
      this.plan.push({x,type});
    }
    this.plan.sort((a,b)=>a.x-b.x);
  },
  update(refX){
    for(const p of this.plan){
      const d=Math.abs(p.x-refX);
      if(d<K.LOAD_DIST&&!p.inst)this.load(p);
      else if(d>K.UNLOAD_DIST&&p.inst)this.unload(p);
    }
  },
  load(p){
    const fn={start:Locations.start,checkpoint:Locations.checkpoint,village:Locations.village,
      standalone:Locations.standalone,camp:Locations.camp,town:Locations.town,
      castle:Locations.castle,watchtower:Locations.watchtower,fortC:Locations.fortC}[p.type];
    const inst=p.type==='start'?fn():fn(p.x);
    scene.add(inst.group);inst.group.updateWorldMatrix(true,true);
    inst.boxes=inst.solids.map(m=>Colliders.addFromMesh(m));
    inst.entities=[];
    for(const s of inst.spawns){
      const e=Entities.spawn(s.type,s.pos.x,s.pos.y||0,s.pos.z,{home:s.pos.clone(),guard:true,
        code:s.code,onTower:s.onTower});
      if(e)inst.entities.push(e);
    }
    p.inst=inst;this.loaded.push(p);
    if(inst.label&&Math.abs(p.x-Train.pos)<K.LOAD_DIST)
      UI.notify('📍 '+inst.label,inst.danger?'blood':'gold');
    if(inst.safe&&p.type==='checkpoint')Train.arriveCheckpoint(p.x);
  },
  unload(p){
    const inst=p.inst;
    Colliders.remove(inst.boxes);
    Interact.removeGroup(inst.group);
    (inst.group.userData.lights||[]).forEach(l=>l.parent&&l.parent.remove(l));
    inst.entities.forEach(e=>{if(e.alive)Entities.remove(e);});
    scene.remove(inst.group);
    inst.group.traverse(o=>{if(o.geometry&&o.geometry!==BOX)o.geometry.dispose();});
    p.inst=null;this.loaded=this.loaded.filter(q=>q!==p);
  },
  churchNear(pos){
    for(const p of this.loaded){
      const c=p.inst&&p.inst.group.userData.churchPos;
      if(c&&c.distanceTo(pos)<14)return true;
    }
    return false;
  },
  safeZone(pos){
    for(const p of this.loaded){
      if(p.inst&&p.inst.safe&&Math.abs(pos.x-p.x)<62&&Math.abs(pos.z)<54)return true;
    }
    return false;
  }
};

/* ==========================================================================
   src/train/*  — Train.js, TrainMesh.js, FuelSystem.js, TrainArmor.js
   ========================================================================== */
const Train={
  pos:0,speed:0,throttle:1,fuel:0,hp:K.TRAIN_HP,maxhp:K.TRAIN_HP,
  armor:0,armorMeshes:[],group:null,cars:[],stopUntil:0,lastCheckpoint:-1,
  chugT:0,
  init(){
    const g=new THREE.Group();scene.add(g);this.group=g;
    // ---- TrainMesh.js: đầu máy ----
    const loco=new THREE.Group();
    box(9,1.2,4,MAT.metal,0,1.4,0,loco);                 // khung
    const boiler=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,6,12),MAT.metal);
    boiler.rotation.z=Math.PI/2;boiler.position.set(1.4,2.9,0);boiler.castShadow=true;loco.add(boiler);
    box(3,2.8,3.8,MAT.dark,-3,3.4,0,loco);               // cabin
    box(3.2,.3,4.2,MAT.roof,-3,4.9,0,loco);
    const stack=new THREE.Mesh(new THREE.CylinderGeometry(.75,.5,2.2,10),MAT.dark);
    stack.position.set(3.6,4.6,0);loco.add(stack);
    box(2,2.4,4.2,MAT.metal,5,1.6,0,loco);               // cản trước
    for(const z of[-2.05,2.05])for(let i=0;i<3;i++){
      const w=new THREE.Mesh(new THREE.CylinderGeometry(.85,.85,.3,12),MAT.dark);
      w.rotation.x=Math.PI/2;w.position.set(-2+i*2.6,.85,z);loco.add(w);
    }
    // lò lửa
    const fireM=new THREE.MeshBasicMaterial({color:0xff6a10});
    const fire=box(.5,1,1.6,fireM,-4.4,2.2,0,loco);
    this.fireMesh=fire;
    this.fireLight=new THREE.PointLight(0xff7020,1.6,18,2);
    this.fireLight.position.set(-4.6,2.4,0);loco.add(this.fireLight);
    loco.position.x=0;g.add(loco);
    this.loco=loco;
    // ---- toa hàng ----
    for(let i=1;i<=2;i++){
      const c=new THREE.Group();
      box(10,1,4.2,MAT.plank,0,1.7,0,c);
      box(10,.9,.3,MAT.wood,0,2.6,2.05,c);
      box(10,.9,.3,MAT.wood,0,2.6,-2.05,c);
      box(.3,.9,4.2,MAT.wood,-5,2.6,0,c);
      for(const z of[-2.05,2.05])for(let k=0;k<2;k++){
        const w=new THREE.Mesh(new THREE.CylinderGeometry(.8,.8,.3,12),MAT.dark);
        w.rotation.x=Math.PI/2;w.position.set(-3+k*6,.8,z);c.add(w);
      }
      c.position.x=-12*i;g.add(c);this.cars.push(c);
    }
    // đèn đầu máy
    this.head=new THREE.SpotLight(0xfff0c0,0,90,.5,.4,1.5);
    this.head.position.set(6,3.4,0);this.head.target.position.set(60,0,0);
    g.add(this.head);g.add(this.head.target);
    // vùng tương tác: lò đốt + lên tàu
    Interact.add({obj:fire,radius:3.4,label:'🔥 Lò đốt — F để nạp nhiên liệu',kind:'firebox'});
    this.footprint=[{x0:-5,x1:6.5},{x0:-17,x1:-7},{x0:-29,x1:-19}];
    this.reset();
  },
  reset(){
    this.pos=0;this.speed=0;this.fuel=12;this.hp=this.maxhp;this.armor=0;
    this.armorMeshes.forEach(m=>m.parent&&m.parent.remove(m));this.armorMeshes=[];
    this.stopUntil=0;this.lastCheckpoint=-1;this.group.position.x=0;
  },
  /* ---- FuelSystem.js ---- */
  addFuel(v){this.fuel=Math.min(K.FUEL_MAX,this.fuel+v);},
  burnItem(id){
    const it=ITEMS[id];if(!it||!it.fuel)return false;
    this.addFuel(it.fuel);return true;
  },
  /* ---- TrainArmor.js ---- */
  addArmor(){
    if(this.armor>=8)return false;
    this.armor++;
    const c=pick(this.cars.concat([this.loco]));
    const m=box(2,.9,.06,MAT.paper,rnd(-3,3),2.6,pick([2.15,-2.15]),c);
    this.armorMeshes.push(m);return true;
  },
  damage(v){
    if(this.armor>0){
      this.armor--;const m=this.armorMeshes.pop();
      if(m&&m.parent)m.parent.remove(m);
      UI.notify('📰 Newspaper chắn 1 đòn!','small');return;
    }
    this.hp-=v;
    if(this.hp<=0){this.hp=0;Game.over('ĐOÀN TÀU ĐÃ BỊ PHÁ HUỶ');}
  },
  onDeck(x,z){
    const lx=x-this.pos;
    if(Math.abs(z)>2.1)return false;
    return this.footprint.some(f=>lx>f.x0&&lx<f.x1);
  },
  arriveCheckpoint(x){
    if(this.lastCheckpoint===x)return;
    this.lastCheckpoint=x;this.stopUntil=Game.time+60;
    UI.notify('🛑 CHECKPOINT — tàu dừng 60 giây','gold');
    Audio2.whistle();
  },
  update(dt){
    const stopped=Game.time<this.stopUntil;
    const target=(this.fuel>0&&!stopped&&this.pos<K.TRACK_LENGTH)?K.TRAIN_SPEED*this.throttle:0;
    this.speed+=clamp(target-this.speed,-8*dt,3.2*dt);
    if(this.speed<.05)this.speed=Math.max(0,this.speed-dt);
    const dx=this.speed*dt;
    this.pos+=dx;
    if(this.fuel>0&&this.speed>.1){
      this.fuel=Math.max(0,this.fuel-dx*K.FUEL_PER_M);
      this.chugT-=dt;
      if(this.chugT<=0){this.chugT=Math.max(.18,1.6-this.speed/45);Audio2.chug();}
    }
    this.group.position.x=this.pos;
    // hiệu ứng lò lửa + đèn
    const f=this.fuel/K.FUEL_MAX;
    this.fireLight.intensity=.4+f*2.2+Math.sin(Game.time*14)*.2;
    this.fireMesh.material.color.setHSL(.06,1,.3+f*.25);
    this.head.intensity=DayNight.isNight()?2.6:0;
    if(this.pos>=K.TRACK_LENGTH)Game.win();
    return dx;
  },
  frontPos(){return new THREE.Vector3(this.pos+5,1.5,0);}
};

/* ==========================================================================
   src/items/Inventory.js
   ========================================================================== */
const Inv={
  slots:[],max:24,
  clear(){this.slots=[];},
  count(id){const s=this.slots.find(s=>s.id===id);return s?s.q:0;},
  add(id,q=1){
    if(!ITEMS[id]&&!WEAPONS[id])return false;
    const stackable=!WEAPONS[id]||id==='vampireknife';
    const ex=this.slots.find(s=>s.id===id);
    if(ex&&stackable){ex.q+=q;return true;}
    if(this.slots.length>=this.max){UI.notify('🎒 Túi đầy!','warn');return false;}
    this.slots.push({id,q});return true;
  },
  remove(id,q=1){
    const i=this.slots.findIndex(s=>s.id===id);if(i<0)return false;
    this.slots[i].q-=q;if(this.slots[i].q<=0)this.slots.splice(i,1);
    if(Player.selected>=this.usable().length)Player.selected=0;
    return true;
  },
  usable(){
    return this.slots.filter(s=>WEAPONS[s.id]||(ITEMS[s.id]&&(ITEMS[s.id].use||ITEMS[s.id].throwable)));
  },
  name(id){return (ITEMS[id]&&ITEMS[id].n)||(WEAPONS[id]&&WEAPONS[id].n)||id;},
  sellValue(id){
    if(ITEMS[id]&&ITEMS[id].sell!==undefined)return ITEMS[id].sell;
    if(WEAPONS[id])return Math.floor((WEAPONS[id].buy||20)*.4);
    return 0;
  }
};

/* ==========================================================================
   src/player/Player.js + PlayerCombat.js
   ========================================================================== */
const Player={
  pos:new THREE.Vector3(-40,0,20),vel:new THREE.Vector3(),
  hp:K.PLAYER_HP,maxhp:K.PLAYER_HP,money:K.START_MONEY,
  onGround:true,onTrain:false,mount:null,turret:null,
  weapon:'fists',mag:{},selected:0,fireCD:0,useCD:0,torchOn:false,
  kills:0,dmgFlash:0,
  reset(){
    this.pos.set(-40,0,22);this.vel.set(0,0,0);this.hp=this.maxhp;this.money=K.START_MONEY;
    this.weapon='fists';this.mag={};this.selected=0;this.onTrain=false;this.mount=null;
    this.turret=null;this.torchOn=false;this.kills=0;this.ammo={revolver:0,rifle:0,shotgun:0,maxim:0};
    Inv.clear();Inv.add('newspaper',rndi(2,3));
  },
  ammo:{revolver:0,rifle:0,shotgun:0,maxim:0},
  eye(){return this.pos.y+K.EYE;},
  heal(v){this.hp=Math.min(this.maxhp,this.hp+v);},
  hurt(v){
    this.hp-=v;this.dmgFlash=.5;Audio2.hurt();
    document.getElementById('dmgflash').style.opacity=.9;
    setTimeout(()=>document.getElementById('dmgflash').style.opacity=0,180);
    if(this.hp<=0){this.hp=0;Game.over('BẠN ĐÃ GỤC NGÃ GIỮA SA MẠC');}
  },
  equip(id){
    if(!WEAPONS[id])return;
    this.weapon=id;
    if(this.mag[id]===undefined)this.mag[id]=0;
    UI.refreshWeapon();
  },
  reload(){
    const w=WEAPONS[this.weapon];if(!w||w.melee)return;
    const need=w.mag-(this.mag[this.weapon]||0);
    if(need<=0)return;
    const have=this.ammo[w.ammo]||0;if(have<=0){Audio2.dry();UI.notify('Hết đạn dự trữ!','warn');return;}
    const take=Math.min(need,have);
    this.ammo[w.ammo]-=take;this.mag[this.weapon]=(this.mag[this.weapon]||0)+take;
    Audio2.reload();UI.refreshWeapon();
  },
  /* ---- PlayerCombat.js ---- */
  ray:new THREE.Raycaster(),
  fire(){
    if(this.fireCD>0)return;
    const wid=this.turret?'maxim':this.weapon;
    const w=WEAPONS[wid];if(!w)return;
    this.fireCD=w.rate;
    if(w.melee){
      Audio2.melee();
      const hit=this.castHit(w.range,0);
      if(hit){
        Combat.damageEnemy(hit.e,w.dmg,hit.head);
        if(w.lifesteal)this.heal(w.dmg*w.lifesteal);
        UI.hitmark();
      }
      return;
    }
    if((this.mag[wid]||0)<=0){Audio2.dry();this.reload();return;}
    this.mag[wid]--;
    Audio2.shot(wid);
    muzzleLight.position.copy(camera.position);muzzleLight.intensity=3.2;
    const pellets=w.pellets||1;
    for(let i=0;i<pellets;i++){
      const hit=this.castHit(w.range,w.spread);
      if(hit){
        let dmg=w.dmg;
        if(hit.head){dmg*=2.2;if(w.hsKill&&hit.dist<45)dmg=99999;}
        Combat.damageEnemy(hit.e,dmg,hit.head);UI.hitmark();
      }
      Combat.tracer(camera.position.clone(),this.lastEnd.clone());
    }
    UI.refreshWeapon();
  },
  lastEnd:new THREE.Vector3(),
  castHit(range,spread){
    const dir=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
    if(spread){dir.x+=rnd(-spread,spread);dir.y+=rnd(-spread,spread);dir.z+=rnd(-spread,spread);dir.normalize();}
    this.ray.set(camera.position,dir);this.ray.far=range;
    const targets=Entities.hitboxes();
    const hits=this.ray.intersectObjects(targets,false);
    this.lastEnd.copy(camera.position).addScaledVector(dir,range);
    if(hits.length){
      const h=hits[0];this.lastEnd.copy(h.point);
      return{e:h.object.userData.ent,head:!!h.object.userData.head,dist:h.distance};
    }
    return null;
  },
  /* ---- dùng vật phẩm ---- */
  useSelected(){
    const u=Inv.usable();const s=u[this.selected];if(!s)return;
    const id=s.id;
    if(WEAPONS[id]){this.equip(id);return;}
    if(this.useCD>0)return;this.useCD=.4;
    const it=ITEMS[id];
    if(it.heal){this.heal(it.heal);Inv.remove(id);Audio2.pickup();
      UI.notify(`+${it.heal} HP`,'good small');return;}
    if(id==='torch'){this.torchOn=!this.torchOn;
      UI.notify(this.torchOn?'🔥 Đuốc BẬT':'Đuốc TẮT','small');return;}
    if(id==='banjo'){Audio2.banjo();Items.lure(this.pos.clone(),9);
      UI.notify('🪕 Tiếng banjo vang xa — zombie đang kéo tới!','warn');return;}
    if(id==='newspaper'){
      if(this.pos.distanceTo(new THREE.Vector3(Train.pos-10,0,0))>26){
        UI.notify('Phải đứng cạnh tàu để gắn giấy báo','warn');return;}
      if(Train.addArmor()){Inv.remove(id);UI.notify('📰 Đã gắn giáp giấy báo lên tàu','good small');}
      else UI.notify('Tàu đã đủ giáp','warn');
      return;}
    if(id==='crucifix'){Items.placeCrucifix(this.pos.clone());Inv.remove(id);return;}
    if(it.throwable){this.throwItem();return;}
  },
  throwItem(){
    const u=Inv.usable();const s=u[this.selected];if(!s)return;
    const it=ITEMS[s.id];
    if(!it||!it.throwable){UI.notify('Vật phẩm này không ném được (Dynamite / Holy Water)','warn small');return;}
    const dir=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
    Items.throwProjectile(s.id,camera.position.clone(),dir.multiplyScalar(22).add(new THREE.Vector3(0,4,0)));
    Inv.remove(s.id);
  },
  update(dt){
    this.fireCD=Math.max(0,this.fireCD-dt);
    this.useCD=Math.max(0,this.useCD-dt);
    // ---- di chuyển ----
    const fwd=new THREE.Vector3(-Math.sin(Input.yaw),0,-Math.cos(Input.yaw));
    const right=new THREE.Vector3(Math.cos(Input.yaw),0,-Math.sin(Input.yaw));
    const dir=new THREE.Vector3();
    if(Input.isDown('KeyW'))dir.add(fwd);
    if(Input.isDown('KeyS'))dir.sub(fwd);
    if(Input.isDown('KeyD'))dir.add(right);
    if(Input.isDown('KeyA'))dir.sub(right);
    if(dir.lengthSq()>0)dir.normalize();

    if(this.turret){ /* đứng yên trên turret */ }
    else if(this.mount&&this.mount.alive){
      const sp=K.MOUNT;
      this.mount.pos.addScaledVector(dir,sp*dt);
      Colliders.resolve(this.mount.pos,1.1,this.mount.pos.y);
      this.mount.mesh.position.copy(this.mount.pos);
      if(dir.lengthSq()>0)this.mount.mesh.rotation.y=Math.atan2(dir.x,dir.z);
      this.pos.copy(this.mount.pos);this.pos.y=1.3;
      this.vel.set(0,0,0);
    }else{
      const sp=Input.isDown('ShiftLeft')?K.RUN:K.WALK;
      this.pos.addScaledVector(dir,sp*dt);
      // trọng lực
      this.vel.y-=K.GRAV*dt;this.pos.y+=this.vel.y*dt;
      let ground=0;
      if(Train.onDeck(this.pos.x,this.pos.z)&&this.vel.y<=0&&this.pos.y>K.DECK_Y-1.2)ground=K.DECK_Y;
      if(this.pos.y<=ground){this.pos.y=ground;this.vel.y=0;this.onGround=true;}
      else this.onGround=false;
      if(this.onGround&&Input.isDown('Space')){this.vel.y=8.2;this.onGround=false;}
      Colliders.resolve(this.pos,.45,this.pos.y);
      // di chuyển cùng tàu
      this.onTrain=(this.pos.y>=K.DECK_Y-.05&&Train.onDeck(this.pos.x,this.pos.z));
      if(this.onTrain)this.pos.x+=Game.trainDX;
    }
    // camera
    camera.position.set(this.pos.x,this.eye(),this.pos.z);
    camera.rotation.set(0,0,0,'YXZ');
    camera.rotation.order='YXZ';
    camera.rotation.y=Input.yaw;camera.rotation.x=Input.pitch;
    // đuốc
    torchLight.position.set(this.pos.x,this.pos.y+1.6,this.pos.z);
    torchLight.intensity=this.torchOn?(1.7+Math.sin(Game.time*13)*.25):0;
    torchLight.distance=this.torchOn?14:0;
    muzzleLight.intensity=Math.max(0,muzzleLight.intensity-dt*22);
    // đốt zombie bằng đuốc
    if(this.torchOn){
      Entities.forEachNear(this.pos,1.9,e=>{
        if(e.cfg.undead)Combat.damageEnemy(e,42*dt,false);
      });
    }
  }
};

/* ==========================================================================
   src/systems/CombatSystem.js  — tracer, damage, corpse
   ========================================================================== */
const Combat={
  tracers:[],
  tracer(a,b){
    const g=new THREE.BufferGeometry().setFromPoints([a,b]);
    const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:0xffdd88,transparent:true,opacity:.85}));
    scene.add(l);this.tracers.push({l,t:.06});
  },
  damageEnemy(e,dmg,head){
    if(!e||!e.alive)return;
    e.hp-=dmg;e.flash=.12;e.aggro=true;
    Audio2.hit();
    if(e.hp<=0)Entities.kill(e);
  },
  explosion(pos,radius,dmg,holy){
    if(holy){Audio2.thunder();this.lightning(pos);}else Audio2.explode();
    const g=new THREE.Mesh(new THREE.SphereGeometry(1,12,10),
      new THREE.MeshBasicMaterial({color:holy?0xaad4ff:0xffa030,transparent:true,opacity:.85}));
    g.position.copy(pos);scene.add(g);
    this.fx=this.fx||[];this.fx.push({m:g,t:0,dur:.45,r:radius});
    Entities.forEachNear(pos,radius,e=>{
      const d=e.pos.distanceTo(pos);
      let v=dmg*(1-d/radius);
      if(holy&&(e.cfg.undead||e.type==='werewolf'))v*=2.5;
      if(v>0)this.damageEnemy(e,v,false);
    });
    if(Player.pos.distanceTo(pos)<radius&&!holy)
      Player.hurt(dmg*.5*(1-Player.pos.distanceTo(pos)/radius));
    if(Math.abs(pos.x-Train.pos+10)<20&&Math.abs(pos.z)<8&&!holy)Train.damage(dmg*.3);
  },
  lightning(pos){
    const pts=[];let y=60;
    let x=pos.x,z=pos.z;
    while(y>0){pts.push(new THREE.Vector3(x,y,z));y-=rnd(3,7);x+=rnd(-1.6,1.6);z+=rnd(-1.6,1.6);}
    pts.push(pos.clone());
    const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({color:0xbfe4ff,linewidth:3}));
    scene.add(l);this.tracers.push({l,t:.35});
    const fl=new THREE.PointLight(0xaaddff,10,60,2);fl.position.copy(pos).setY(6);scene.add(fl);
    setTimeout(()=>scene.remove(fl),200);
  },
  update(dt){
    for(let i=this.tracers.length-1;i>=0;i--){
      const t=this.tracers[i];t.t-=dt;
      t.l.material.opacity=clamp(t.t*10,0,.9);
      if(t.t<=0){scene.remove(t.l);t.l.geometry.dispose();this.tracers.splice(i,1);}
    }
    if(this.fx)for(let i=this.fx.length-1;i>=0;i--){
      const f=this.fx[i];f.t+=dt;const k=f.t/f.dur;
      f.m.scale.setScalar(.4+k*f.r);f.m.material.opacity=.85*(1-k);
      if(k>=1){scene.remove(f.m);f.m.geometry.dispose();this.fx.splice(i,1);}
    }
  }
};

/* ==========================================================================
   src/entities/*  — EntityManager, BaseEnemy, EnemyAI
   ========================================================================== */
const Entities=(function(){
  const list=[],boxes=[];
  const headGeo=new THREE.BoxGeometry(.55,.55,.55);
  const hitGeo=new THREE.BoxGeometry(1,1,1);
  const hitMat=new THREE.MeshBasicMaterial({visible:false});

  function buildMesh(type,cfg){
    const g=new THREE.Group();
    const m1=new THREE.MeshLambertMaterial({color:cfg.c});
    const m2=new THREE.MeshLambertMaterial({color:cfg.c2||cfg.c});
    if(cfg.quad){
      const s=type==='werewolf'?1.4:1;
      box(1.9*s,1.05*s,.85*s,m1,0,1.15*s,0,g);
      box(.7*s,.7*s,.65*s,m1,1.15*s,1.55*s,0,g);
      [[-.7,-.35],[.7,-.35],[-.7,.35],[.7,.35]].forEach(([a,b])=>
        box(.22*s,1.15*s,.22*s,m2,a*s,.57*s,b*s,g));
      if(cfg.magic){const h=new THREE.Mesh(new THREE.ConeGeometry(.12,.7,7),MAT.gold);
        h.position.set(1.4,2.1,0);h.rotation.z=-.5;g.add(h);}
      if(type==='wolf'){const t=box(.7,.16,.16,m1,-1.1,1.3,0,g);t.rotation.z=.5;}
    }else{
      const s=cfg.big?1.45:1;
      box(.75*s,1.15*s,.45*s,m1,0,1.15*s,0,g);              // thân
      box(.52*s,.52*s,.5*s,m2,0,2.0*s,0,g);                 // đầu
      box(.22*s,1.0*s,.22*s,m1,-.5*s,1.15*s,0,g);           // tay
      box(.22*s,1.0*s,.22*s,m1,.5*s,1.15*s,0,g);
      box(.26*s,1.05*s,.26*s,m2,-.2*s,.52*s,0,g);           // chân
      box(.26*s,1.05*s,.26*s,m2,.2*s,.52*s,0,g);
      if(type==='outlaw'||type==='prescott'){
        box(.9*s,.1*s,.9*s,m2,0,2.32*s,0,g);box(.5*s,.32*s,.5*s,m2,0,2.45*s,0,g);
        const gun=box(.9,.12,.12,MAT.metal,.55*s,1.35*s,.25*s,g);
      }
      if(type==='vampire'){
        const cape=box(.95,1.4,.1,new THREE.MeshLambertMaterial({color:0x5a0a12}),0,1.3,-.3,g);
      }
      if(cfg.big){const j=box(.5,.25,.5,m2,0,1.85,.35,g);}
    }
    // hitbox + headshot box
    const hb=new THREE.Mesh(hitGeo,hitMat);
    hb.scale.set(cfg.big?1.9:1.15,cfg.quad?1.8:2.3,cfg.quad?2.2:1.0);
    hb.position.y=(cfg.quad?1.1:1.15)*(cfg.big?1.45:1);
    g.add(hb);
    const hd=new THREE.Mesh(headGeo,hitMat);
    hd.position.y=(cfg.quad?1.6:2.0)*(cfg.big?1.45:1);
    hd.position.x=cfg.quad?1.15:0;
    g.add(hd);
    return{g,hb,hd,mats:[m1,m2]};
  }

  function spawn(type,x,y,z,opt){
    if(list.length>=K.MAX_ENEMIES+15)return null;
    const cfg=MOBS[type];if(!cfg)return null;
    const built=buildMesh(type,cfg);
    const e={
      type,cfg,alive:true,hp:cfg.hp,maxhp:cfg.hp,
      pos:new THREE.Vector3(x,y||0,z),mesh:built.g,hb:built.hb,hd:built.hd,mats:built.mats,
      spd:cfg.spd*K.SPD,atkCD:0,flash:0,aggro:false,state:'idle',
      home:(opt&&opt.home)||new THREE.Vector3(x,0,z),guard:!!(opt&&opt.guard),
      code:opt&&opt.code,onTower:opt&&opt.onTower,tamed:false,blinkCD:rnd(3,6),
      groanCD:rnd(2,9),target:null,burnT:0
    };
    built.hb.userData.ent=e;built.hd.userData.ent=e;built.hd.userData.head=true;
    e.mesh.position.copy(e.pos);
    scene.add(e.mesh);list.push(e);boxes.push(built.hb,built.hd);
    return e;
  }

  function remove(e){
    e.alive=false;scene.remove(e.mesh);
    const i=list.indexOf(e);if(i>=0)list.splice(i,1);
    [e.hb,e.hd].forEach(h=>{const j=boxes.indexOf(h);if(j>=0)boxes.splice(j,1);});
  }

  function kill(e){
    if(!e.alive)return;
    Player.kills++;
    const corpseId=e.cfg.corpse;
    remove(e);
    if(corpseId)Items.dropCorpse(corpseId,e.pos.clone(),e.type);
    if(e.type==='banker'&&e.code){
      Items.dropItem('vaultcode',e.pos.clone().add(new THREE.Vector3(1,0,0)),{code:e.code});
      UI.notify('🔑 Zombie Banker rớt MÃ KÉT: '+e.code,'gold');
    }
    if(e.type==='prescott'){
      Items.dropItem('depotkey',e.pos.clone().add(new THREE.Vector3(1,0,0)));
      UI.notify('🏆 CAPTAIN PRESCOTT ĐÃ GỤC — nhặt Supply Depot Key','gold');
    }
    if(e.type==='outlaw'&&Math.random()<.5)
      Items.dropItem(pick(['ammo_revolver','ammo_rifle','ammo_shotgun']),e.pos.clone().add(new THREE.Vector3(0,0,1)));
  }

  /* ---- EnemyAI.js ---- */
  function ai(e,dt){
    e.flash=Math.max(0,e.flash-dt);
    const fl=e.flash>0;
    e.mats.forEach(m=>m.emissive&&m.emissive.setHex(fl?0x992222:(e.burnT>0?0x884400:0x000000)));
    if(e.burnT>0){e.burnT-=dt;e.hp-=30*dt;if(e.hp<=0){kill(e);return;}}

    const dP=e.pos.distanceTo(Player.pos);
    // ---- passive ----
    if(e.cfg.passive){
      if(Player.mount===e)return;
      if(dP<10&&!e.tamed){
        const away=e.pos.clone().sub(Player.pos).setY(0).normalize();
        e.pos.addScaledVector(away,e.spd*.7*dt);
        e.mesh.rotation.y=Math.atan2(away.x,away.z);
      }
      e.mesh.position.copy(e.pos);
      return;
    }
    // ---- tamed wolf ----
    if(e.tamed){
      let tgt=null,td=40;
      for(const o of list){if(o===e||o.cfg.passive||o.tamed)continue;
        const d=o.pos.distanceTo(e.pos);if(d<td){td=d;tgt=o;}}
      const goal=tgt?tgt.pos:Player.pos;
      const dir=goal.clone().sub(e.pos).setY(0);
      const dist=dir.length();
      if(dist>(tgt?1.6:3.5)){dir.normalize();e.pos.addScaledVector(dir,e.spd*dt);
        e.mesh.rotation.y=Math.atan2(dir.x,dir.z);}
      else if(tgt){e.atkCD-=dt;if(e.atkCD<=0){e.atkCD=.9;Combat.damageEnemy(tgt,22,false);}}
      e.mesh.position.copy(e.pos);
      return;
    }
    // ---- chọn mục tiêu ----
    let targetPos=null,targetIsTrain=false;
    const lurePos=Items.lurePoint;
    if(lurePos&&e.cfg.undead&&e.pos.distanceTo(lurePos)<70)targetPos=lurePos;
    else if(dP<(DayNight.isNight()?55:38)||e.aggro)targetPos=Player.pos;
    else{
      const tp=new THREE.Vector3(Train.pos-10,1,0);
      if(e.pos.distanceTo(tp)<40&&Train.speed<30){targetPos=tp;targetIsTrain=true;}
    }
    if(!targetPos){
      if(e.guard&&e.pos.distanceTo(e.home)>3&&!e.onTower){
        const d=e.home.clone().sub(e.pos).setY(0).normalize();
        e.pos.addScaledVector(d,e.spd*.4*dt);e.mesh.rotation.y=Math.atan2(d.x,d.z);
      }else{
        e.pos.x+=Math.sin(Game.time*.5+e.pos.z)*e.spd*.15*dt;
      }
      e.mesh.position.copy(e.pos);
      groan(e,dt);return;
    }
    // ---- vùng thiêng (crucifix / nhà thờ) ----
    if(e.cfg.undead||e.type==='werewolf'){
      if(Items.inHolyZone(e.pos)){e.hp-=45*dt;e.burnT=Math.max(e.burnT,.3);
        if(e.hp<=0){kill(e);return;}}
      if(ProcGen.churchNear(e.pos)){
        const away=e.pos.clone().sub(targetPos).setY(0).normalize();
        e.pos.addScaledVector(away,e.spd*dt);e.mesh.position.copy(e.pos);return;
      }
    }
    const to=targetPos.clone().sub(e.pos);to.y=0;
    const dist=to.length();to.normalize();
    e.mesh.rotation.y=Math.atan2(to.x,to.z);
    // ---- vampire blink ----
    if(e.cfg.blink){
      e.blinkCD-=dt;
      if(e.blinkCD<=0&&dist>8&&dist<45){
        e.blinkCD=rnd(4,7);
        e.pos.copy(targetPos).addScaledVector(to,-3.2);
        Audio2.tone&&0;Audio2.groan();
      }
    }
    // ---- outlaw / boss bắn từ xa ----
    if(e.cfg.ranged){
      if(dist>(e.onTower?10:14)){e.pos.addScaledVector(to,e.spd*dt);}
      e.atkCD-=dt;
      if(e.atkCD<=0&&dist<(e.cfg.boss?70:55)){
        e.atkCD=e.cfg.boss?.55:rnd(.9,1.7);
        Audio2.shot('revolver');
        const acc=clamp(1-dist/70,.15,.8);
        Combat.tracer(e.pos.clone().setY(1.5),targetPos.clone().setY(1.4));
        if(Math.random()<acc){
          if(targetIsTrain)Train.damage(e.cfg.dmg);
          else Player.hurt(e.cfg.dmg);
        }
      }
    }else{
      if(dist>1.7)e.pos.addScaledVector(to,e.spd*dt);
      else{
        e.atkCD-=dt;
        if(e.atkCD<=0){e.atkCD=e.cfg.atk;
          if(targetIsTrain)Train.damage(e.cfg.dmg*1.4);else Player.hurt(e.cfg.dmg);}
      }
    }
    // leo lên sàn tàu
    const wantDeck=Train.onDeck(e.pos.x,e.pos.z);
    const gy=wantDeck?K.DECK_Y:(e.onTower?e.pos.y:0);
    e.pos.y+=(gy-e.pos.y)*Math.min(1,dt*6);
    if(!e.onTower)Colliders.resolve(e.pos,.6,e.pos.y);
    e.mesh.position.copy(e.pos);
    groan(e,dt);
  }
  function groan(e,dt){
    e.groanCD-=dt;
    if(e.groanCD<=0){
      e.groanCD=rnd(5,14);
      if(e.pos.distanceTo(Player.pos)<28){
        if(e.type==='werewolf'||e.type==='wolf')Audio2.howl();
        else if(e.cfg.undead)Audio2.groan();
      }
    }
  }

  return{
    list,spawn,remove,kill,
    hitboxes(){return boxes;},
    forEachNear(p,r,fn){for(let i=list.length-1;i>=0;i--){
      const e=list[i];if(e.alive&&e.pos.distanceTo(p)<r)fn(e);}},
    nearestPassive(p,r){let b=null,bd=r;
      for(const e of list){if(!e.cfg.passive&&e.type!=='wolf')continue;
        const d=e.pos.distanceTo(p);if(d<bd){bd=d;b=e;}}return b;},
    update(dt){
      for(let i=list.length-1;i>=0;i--){
        const e=list[i];if(!e.alive)continue;
        ai(e,dt);
        // despawn quá xa
        if(e.pos.distanceTo(Player.pos)>230&&Math.abs(e.pos.x-Train.pos)>230)remove(e);
      }
    },
    clear(){while(list.length)remove(list[0]);},
    countHostile(){return list.filter(e=>!e.cfg.passive&&!e.tamed).length;}
  };
})();

/* ==========================================================================
   src/items/ItemManager.js  — pickup thế giới, ném, crucifix zone
   ========================================================================== */
const Items=(function(){
  const drops=[],throwns=[],holyZones=[];
  let lurePoint=null,lureT=0;
  const pickupGeo=new THREE.BoxGeometry(.45,.45,.45);
  function colorOf(id){
    if(id.startsWith('gold'))return 0xf0c650;
    if(id.startsWith('silver'))return 0xd8d8e0;
    if(id==='coal')return 0x232323;
    if(id==='holywater')return 0x88ccff;
    if(id==='crucifix')return 0xe8d9a0;
    if(id==='dynamite')return 0xcc3322;
    if(WEAPONS[id])return 0x8a7a5a;
    return 0xb9a37a;
  }
  function dropItem(id,pos,extra){
    const m=new THREE.Mesh(pickupGeo,new THREE.MeshLambertMaterial({color:colorOf(id),
      emissive:new THREE.Color(colorOf(id)).multiplyScalar(.18)}));
    m.position.copy(pos).setY(.5);m.castShadow=true;scene.add(m);
    const d={id,mesh:m,extra:extra||{},t:0};
    drops.push(d);
    Interact.add({obj:m,radius:2.2,label:'Nhặt '+Inv.name(id),kind:'pickup',data:d});
    return d;
  }
  function dropCorpse(id,pos,type){
    const m=box(1.3,.4,.6,new THREE.MeshLambertMaterial({color:MOBS[type]?MOBS[type].c:0x555555}),
      pos.x,.22,pos.z);
    m.rotation.y=rnd(0,6.28);scene.add(m);
    const d={id,mesh:m,extra:{corpse:true,type},t:0};
    drops.push(d);
    Interact.add({obj:m,radius:2.4,label:'Nhặt '+Inv.name(id)+' (đốt/bán/thuần sói)',kind:'pickup',data:d});
    // thuần hoá sói gần đó
    Entities.forEachNear(pos,14,e=>{
      if(e.type==='wolf'&&!e.tamed&&Math.random()<.55){
        e.tamed=true;e.mats.forEach(m2=>m2.color.setHex(0x9aa6b0));
        UI.notify('🐺 Một con sói đã được thuần hoá!','good');
      }
    });
    return d;
  }
  function removeDrop(d){
    scene.remove(d.mesh);
    const i=drops.indexOf(d);if(i>=0)drops.splice(i,1);
    Interact.list=Interact.list.filter(o=>o.data!==d);
  }
  function throwProjectile(id,pos,vel){
    const m=new THREE.Mesh(new THREE.SphereGeometry(.22,8,6),
      new THREE.MeshLambertMaterial({color:colorOf(id),emissive:id==='holywater'?0x224466:0x330000}));
    m.position.copy(pos);scene.add(m);
    throwns.push({id,mesh:m,vel:vel.clone(),t:id==='dynamite'?3:6,fuse:id==='dynamite'});
    UI.notify(id==='dynamite'?'🧨 Dynamite — 3 giây!':'💧 Holy Water bay đi','small');
  }
  function placeCrucifix(pos){
    const g=new THREE.Group();
    box(.16,1.5,.16,MAT.plank,0,.75,0,g);box(.8,.16,.16,MAT.plank,0,1.1,0,g);
    g.position.copy(pos).setY(0);scene.add(g);
    const ring=new THREE.Mesh(new THREE.RingGeometry(11.4,12,32),
      new THREE.MeshBasicMaterial({color:0xffe9a0,transparent:true,opacity:.35,side:THREE.DoubleSide}));
    ring.rotation.x=-Math.PI/2;ring.position.copy(pos).setY(.06);scene.add(ring);
    holyZones.push({pos:pos.clone(),r:12,mesh:g,ring});
    UI.notify('✝️ VÙNG THIÊNG được lập — undead bước vào sẽ cháy','good');
    Audio2.pickup();
  }
  return{
    dropItem,dropCorpse,removeDrop,throwProjectile,placeCrucifix,
    get lurePoint(){return lureT>0?lurePoint:null;},
    lure(pos,dur){lurePoint=pos;lureT=dur;},
    inHolyZone(p){return holyZones.some(z=>z.pos.distanceTo(p)<z.r);},
    clear(){
      while(drops.length)removeDrop(drops[0]);
      throwns.forEach(t=>scene.remove(t.mesh));throwns.length=0;
      holyZones.forEach(z=>{scene.remove(z.mesh);scene.remove(z.ring);});holyZones.length=0;
      lureT=0;
    },
    update(dt){
      lureT=Math.max(0,lureT-dt);
      for(let i=drops.length-1;i>=0;i--){
        const d=drops[i];d.t+=dt;
        if(!d.extra.corpse){d.mesh.rotation.y+=dt*1.6;d.mesh.position.y=.5+Math.sin(d.t*2.4)*.12;}
        if(d.mesh.position.distanceTo(Player.pos)>240)removeDrop(d);
      }
      for(let i=throwns.length-1;i>=0;i--){
        const t=throwns[i];t.t-=dt;
        t.vel.y-=K.GRAV*dt;
        t.mesh.position.addScaledVector(t.vel,dt);
        let boom=false;
        if(t.mesh.position.y<=.2){t.mesh.position.y=.2;t.vel.multiplyScalar(.3);t.vel.y=0;
          if(t.id==='holywater')boom=true;}
        // holy water nổ khi chạm enemy
        if(t.id==='holywater'&&!boom)
          Entities.forEachNear(t.mesh.position,1.6,()=>{boom=true;});
        if(t.fuse&&t.t<=0)boom=true;
        if(t.t<=0&&t.id==='holywater')boom=true;
        if(boom){
          if(t.id==='dynamite')Combat.explosion(t.mesh.position.clone(),9,120,false);
          else Combat.explosion(t.mesh.position.clone(),8,60,true);
          scene.remove(t.mesh);throwns.splice(i,1);
        }
      }
      holyZones.forEach(z=>{z.ring.material.opacity=.22+Math.sin(Game.time*2)*.12;});
    }
  };
})();

/* ==========================================================================
   src/systems/WaveSpawner.js + EventManager.js
   ========================================================================== */
const WaveSpawner={
  t:0,
  update(dt){
    this.t-=dt;
    if(this.t>0)return;
    const dg=DayNight.danger();
    this.t=clamp(6/dg-Train.pos/40000,1.1,7);
    if(Entities.countHostile()>K.MAX_ENEMIES)return;
    if(ProcGen.safeZone(Player.pos))return;
    const km=Train.pos/1000;
    const around=Player.onTrain?new THREE.Vector3(Train.pos,0,0):Player.pos;
    const a=rnd(0,Math.PI*2),r=rnd(55,110);
    const x=around.x+Math.cos(a)*r,z=around.z+Math.sin(a)*r;
    let type='zombie';
    const roll=Math.random();
    if(DayNight.phase==='FULLMOON'&&roll<.30)type='werewolf';
    else if(DayNight.phase==='BLOODMOON'&&roll<.38)type='vampire';
    else if(roll<.14+km/900)type='runner';
    else if(roll<.24)type='wolf';
    else if(roll<.30+km/1600)type='outlaw';
    else if(roll<.335)type=Math.random()<.12?'unicorn':'horse';
    const n=type==='wolf'?rndi(1,7):(type==='zombie'?rndi(1,Math.ceil(2*dg)):1);
    for(let i=0;i<n;i++)Entities.spawn(type,x+rnd(-6,6),0,z+rnd(-6,6),{});
  }
};

const EventManager={
  ambushT:60,
  onMoon(p){
    const f=document.getElementById('moonflash');
    if(p==='FULLMOON'){UI.notify('🌕 FULL MOON — WEREWOLF TRÀN VỀ!','warn');
      f.style.background='radial-gradient(circle,#0000 40%,#3a5a9a55)';f.style.opacity=1;
      for(let i=0;i<5;i++)Entities.spawn('werewolf',Train.pos+rnd(-90,90),0,rnd(-90,90),{});
      Audio2.howl();}
    else{UI.notify('🩸 BLOOD MOON — VAMPIRE THỨC GIẤC!','blood');
      f.style.background='radial-gradient(circle,#0000 30%,#8b000066)';f.style.opacity=1;
      for(let i=0;i<4;i++)Entities.spawn('vampire',Train.pos+rnd(-70,70),0,rnd(-70,70),{});
      Audio2.thunder();}
  },
  update(dt){
    this.ambushT-=dt;
    if(this.ambushT<=0){
      this.ambushT=rnd(90,190);
      if(Train.pos>3000&&Train.speed>5&&!ProcGen.safeZone(Player.pos)){
        UI.notify('🐎 AMBUSH! Băng cướp đang đuổi theo đoàn tàu!','warn');
        const side=Math.random()<.5?-1:1;
        for(let i=0;i<rndi(3,5);i++){
          Entities.spawn('outlaw',Train.pos-rnd(20,60),0,side*rnd(16,28),{});
          if(Math.random()<.6)Entities.spawn('horse',Train.pos-rnd(20,60),0,side*rnd(20,34),{});
        }
      }
    }
  }
};

/* ==========================================================================
   src/systems/EconomyManager.js + ShopSystem.js
   ========================================================================== */
const Economy={
  buy(id){
    const it=ITEMS[id]||WEAPONS[id];
    const price=(ITEMS[id]&&ITEMS[id].buy)||(WEAPONS[id]&&WEAPONS[id].buy)||0;
    if(!price){Audio2.err();return;}
    if(Player.money<price){Audio2.err();UI.notify('Không đủ tiền!','warn small');return;}
    Player.money-=price;
    if(ITEMS[id]&&ITEMS[id].ammo){Player.ammo[ITEMS[id].ammo]+=ITEMS[id].amt;}
    else Inv.add(id,1);
    if(WEAPONS[id]&&Player.weapon==='fists')Player.equip(id);
    Audio2.buy();UI.refreshAll();
  },
  sell(id,q){
    q=q||1;
    if(Inv.count(id)<q)return;
    let v=Inv.sellValue(id);
    if(ITEMS[id]&&ITEMS[id].rndSell)v=rndi(ITEMS[id].rndSell[0],ITEMS[id].rndSell[1]);
    Player.money+=v*q;Inv.remove(id,q);
    Audio2.sell();UI.refreshAll();
  },
  sellAllLoot(){
    let total=0;
    for(const s of [...Inv.slots]){
      const cat=ITEMS[s.id]&&ITEMS[s.id].cat;
      if(cat==='loot'||cat==='corpse'){
        let v=Inv.sellValue(s.id);
        if(ITEMS[s.id].rndSell)v=rndi(ITEMS[s.id].rndSell[0],ITEMS[s.id].rndSell[1]);
        total+=v*s.q;Inv.remove(s.id,s.q);
      }
    }
    Player.money+=total;Audio2.sell();
    UI.notify(total>0?`💰 Bán toàn bộ loot: +$${total}`:'Không có gì để bán',total>0?'gold':'warn');
    UI.refreshAll();
  },
  sellMount(){
    if(!Player.mount)return;
    const e=Player.mount;
    const v=e.type==='unicorn'?250:60;
    Player.money+=v;Player.mount=null;Entities.remove(e);
    UI.notify(`💰 Bán ${e.cfg.n} còn sống: +$${v}`,'gold');Audio2.sell();UI.refreshAll();
  }
};

const SHOP_STOCK={
  general:['coal','torch','bandage','snakeoil','banjo','dynamite','newspaper','saddle'],
  gunsmith:['revolver','rifle','shotgun','maxim','revolvingrifle',
            'ammo_revolver','ammo_rifle','ammo_shotgun','ammo_maxim']
};

/* ==========================================================================
   src/ui/*  — HUD.js, ShopUI.js, NotificationUI.js, Screens.js
   ========================================================================== */
const UI=(function(){
  const $=id=>document.getElementById(id);
  let shopOpen=null,invOpen=false,vaultOpen=null,vaultBuf='';
  function notify(txt,cls){
    const d=document.createElement('div');d.className='notif '+(cls||'');
    d.textContent=txt;$('notifs').appendChild(d);
    setTimeout(()=>d.remove(),3200);
  }
  function hitmark(){const h=$('hitmarker');h.classList.add('on');
    setTimeout(()=>h.classList.remove('on'),80);}
  function refreshBars(){
    $('hpfill').style.width=(Player.hp/Player.maxhp*100)+'%';
    $('hptext').textContent=Math.ceil(Player.hp)+'/'+Player.maxhp;
    $('fuelfill').style.width=(Train.fuel/K.FUEL_MAX*100)+'%';
    $('fueltext').textContent=Math.ceil(Train.fuel)+'/'+K.FUEL_MAX;
    $('thpfill').style.width=(Train.hp/Train.maxhp*100)+'%';
    $('thptext').textContent=Math.ceil(Train.hp)+'/'+Train.maxhp;
    $('armorline').innerHTML='📰 Newspaper armor: <b>'+Train.armor+'</b>';
    $('distance').textContent=fmt(Math.floor(Train.pos))+' m / '+fmt(K.TRACK_LENGTH)+' m';
    $('progfill').style.width=(Train.pos/K.TRACK_LENGTH*100)+'%';
    $('speed').textContent=Math.round(Train.speed*3.6)+' km/h'+(Game.time<Train.stopUntil?
      ' — DỪNG '+Math.ceil(Train.stopUntil-Game.time)+'s':'');
    $('money').textContent='$'+fmt(Player.money);
    $('phase').textContent=DayNight.label();
  }
  function refreshWeapon(){
    const w=WEAPONS[Player.turret?'maxim':Player.weapon];
    $('weapon').textContent=(Player.turret?'🔫 MAXIM TURRET':w.n);
    if(w.melee)$('ammo').textContent='∞';
    else $('ammo').textContent=(Player.mag[Player.turret?'maxim':Player.weapon]||0)+' / '+(Player.ammo[w.ammo]||0);
  }
  function refreshInv(){
    const el=$('invlist');el.innerHTML='';
    const shown=Inv.slots.slice(0,9);
    shown.forEach(s=>{const d=document.createElement('div');
      d.textContent='• '+Inv.name(s.id)+(s.q>1?' ×'+s.q:'');el.appendChild(d);});
    if(Inv.slots.length>9){const d=document.createElement('div');
      d.className='dim';d.textContent='… +'+(Inv.slots.length-9)+' vật phẩm khác';el.appendChild(d);}
    // hotbar
    const hb=$('hotbar');hb.innerHTML='';
    const u=Inv.usable().slice(0,8);
    if(Player.selected>=u.length)Player.selected=Math.max(0,u.length-1);
    u.forEach((s,i)=>{
      const d=document.createElement('div');
      d.className='slot'+(i===Player.selected?' sel':'');
      d.innerHTML='<span class="n">'+(i+1)+'</span><span class="t">'+Inv.name(s.id)+
        (s.q>1?' ×'+s.q:'')+'</span>';
      d.onclick=()=>{Player.selected=i;refreshInv();};
      hb.appendChild(d);
    });
    if(invOpen)renderInvPanel();
  }
  function renderInvPanel(){
    const g=$('invgrid');g.innerHTML='';
    Inv.slots.forEach(s=>{
      const it=ITEMS[s.id]||WEAPONS[s.id]||{};
      const c=document.createElement('div');c.className='card';
      c.innerHTML=`<div class="nm">${Inv.name(s.id)} ×${s.q}</div>
        <div class="ds">${it.d||(WEAPONS[s.id]?('DMG '+WEAPONS[s.id].dmg+' · '+(WEAPONS[s.id].mag||'-')+' viên'):'')}</div>`;
      c.onclick=()=>{
        if(WEAPONS[s.id])Player.equip(s.id);
        else{const idx=Inv.usable().findIndex(x=>x.id===s.id);
          if(idx>=0){Player.selected=idx;Player.useSelected();}}
        refreshAll();
      };
      g.appendChild(c);
    });
  }
  function openShop(id){
    shopOpen=id;$('shop').classList.remove('hidden');
    document.exitPointerLock();
    $('shoptitle').textContent={general:'🏪 GENERAL STORE',gunsmith:'🔫 GUNSMITH',
      trading:'💰 TRADING POST'}[id];
    $('sellall').classList.toggle('hidden',id!=='trading');
    renderShop();
  }
  function renderShop(){
    $('shopmoney').textContent='$'+fmt(Player.money);
    const g=$('shopgrid');g.innerHTML='';
    if(shopOpen==='trading'){
      const sellable=Inv.slots.filter(s=>Inv.sellValue(s.id)>0);
      if(Player.mount){
        const c=document.createElement('div');c.className='card';
        const v=Player.mount.type==='unicorn'?250:60;
        c.innerHTML=`<div class="nm">${Player.mount.cfg.n} (còn sống)<span class="pr">$${v}</span></div>
          <div class="ds">Bán con vật bạn đang cưỡi</div>`;
        c.onclick=()=>{Economy.sellMount();renderShop();};
        g.appendChild(c);
      }
      if(!sellable.length){const d=document.createElement('div');d.className='dim';
        d.textContent='Không có gì để bán. Hãy đi loot!';g.appendChild(d);}
      sellable.forEach(s=>{
        const v=Inv.sellValue(s.id);
        const c=document.createElement('div');c.className='card';
        c.innerHTML=`<div class="nm">${Inv.name(s.id)} ×${s.q}<span class="pr">$${v}</span></div>
          <div class="ds">Click bán 1 · Shift+Click bán tất cả</div>`;
        c.onclick=(ev)=>{Economy.sell(s.id,ev.shiftKey?s.q:1);renderShop();};
        g.appendChild(c);
      });
    }else{
      SHOP_STOCK[shopOpen].forEach(id=>{
        const it=ITEMS[id]||WEAPONS[id];
        const price=(ITEMS[id]&&ITEMS[id].buy)||(WEAPONS[id]&&WEAPONS[id].buy);
        const c=document.createElement('div');
        c.className='card'+(Player.money<price?' no':'');
        const desc=it.d||(WEAPONS[id]?`DMG ${WEAPONS[id].dmg} · băng ${WEAPONS[id].mag} · ${WEAPONS[id].pellets?'shotgun':'tầm '+WEAPONS[id].range+'m'}`:'');
        c.innerHTML=`<div class="nm">${it.n}<span class="pr">$${price}</span></div><div class="ds">${desc}</div>`;
        c.onclick=()=>{Economy.buy(id);renderShop();};
        g.appendChild(c);
      });
    }
  }
  function closeShop(){shopOpen=null;$('shop').classList.add('hidden');
    if(Game.state==='PLAYING')canvas.requestPointerLock();}
  function openVault(v){
    vaultOpen=v;vaultBuf='';$('vault').classList.remove('hidden');document.exitPointerLock();
    const kp=$('keypad');kp.innerHTML='';
    for(let i=0;i<10;i++){const b=document.createElement('button');b.textContent=i;
      b.onclick=()=>{if(vaultBuf.length<5){vaultBuf+=i;drawCode();
        if(vaultBuf.length===5)tryVault();}};kp.appendChild(b);}
    drawCode();
    if(Inv.count('vaultcode'))notify('Mã trong túi: '+Inv.slots.find(s=>s.id==='vaultcode').code,'gold small');
  }
  function drawCode(){$('vaultcode').textContent=(vaultBuf.padEnd(5,'_')).split('').join(' ');}
  function tryVault(){
    if(vaultBuf===vaultOpen.data.code){
      vaultOpen.data.open=true;vaultOpen.dead=true;
      notify('💰 KÉT MỞ! Vàng bạc đổ ra','gold');Audio2.sell();
      const p=vaultOpen.obj.getWorldPosition(new THREE.Vector3());
      for(let i=0;i<rndi(4,7);i++)
        Items.dropItem(pick(['gold_bar','silver_bar','bonds','gold_nugget','gold_sculpt']),
          p.clone().add(new THREE.Vector3(rnd(-2,2),0,rnd(1.5,3.5))));
      closeVault();
    }else{Audio2.err();vaultBuf='';drawCode();notify('Sai mã!','warn small');}
  }
  function closeVault(){vaultOpen=null;$('vault').classList.add('hidden');
    if(Game.state==='PLAYING')canvas.requestPointerLock();}
  function toggleInv(){
    invOpen=!invOpen;$('invpanel').classList.toggle('hidden',!invOpen);
    if(invOpen){document.exitPointerLock();renderInvPanel();}
    else if(Game.state==='PLAYING')canvas.requestPointerLock();
  }
  function setPrompt(txt){
    const p=$('prompt');
    if(!txt){p.classList.add('hidden');return;}
    p.classList.remove('hidden');p.innerHTML=txt;
  }
  function refreshAll(){refreshBars();refreshWeapon();refreshInv();
    if(shopOpen)renderShop();}
  return{notify,hitmark,refreshBars,refreshWeapon,refreshInv,refreshAll,
    openShop,closeShop,openVault,closeVault,toggleInv,setPrompt,
    anyOverlay(){return !!shopOpen||invOpen||!!vaultOpen;},
    get shopOpen(){return shopOpen;},get invOpen(){return invOpen;},get vaultOpen(){return vaultOpen;}};
})();

/* ==========================================================================
   src/systems/InteractionSystem — xử lý phím E / F / G
   ========================================================================== */
function doInteract(){
  // xuống ngựa / rời turret
  if(Player.turret){Player.turret=null;UI.notify('Rời Maxim Gun','small');UI.refreshWeapon();return;}
  if(Player.mount){Player.mount=null;UI.notify('Xuống ngựa','small');return;}
  const near=Interact.nearest(Player.pos);
  // lên/xuống tàu
  const trainD=Math.abs(Player.pos.x-(Train.pos-10))<20&&Math.abs(Player.pos.z)<7;
  if(!near&&trainD){
    if(Player.onTrain){
      Player.pos.z=Player.pos.z>0?4.5:-4.5;Player.pos.y=0;Player.onTrain=false;
      UI.notify('Đã xuống tàu','small');
    }else{
      Player.pos.y=K.DECK_Y;Player.pos.z=0;
      if(!Train.onDeck(Player.pos.x,0))Player.pos.x=Train.pos-12;
      Player.vel.y=0;UI.notify('Đã lên tàu','small');
    }
    return;
  }
  // cưỡi ngựa
  const mount=Entities.nearestPassive(Player.pos,3.6);
  if(!near&&mount){
    if(!Inv.count('saddle')){UI.notify('Cần Saddle (Yên ngựa) để cưỡi','warn');return;}
    Player.mount=mount;mount.tamed=true;
    UI.notify('🐎 Đang cưỡi '+mount.cfg.n+(mount.type==='unicorn'?' — bán $250 tại Trading Post!':''),'good');
    return;
  }
  if(!near){UI.notify('Không có gì để tương tác','small');return;}
  switch(near.kind){
    case 'shop':UI.openShop(near.data.shop);break;
    case 'loot':{
      let got=0;
      near.data.loot.forEach(([id,q])=>{if(Inv.add(id,q))got+=q;});
      near.dead=true;Audio2.pickup();
      UI.notify(got?`🎒 Nhặt được ${got} vật phẩm`:'Trống rỗng',got?'good small':'small');
      UI.refreshAll();break;}
    case 'pickup':{
      if(Inv.add(near.data.id,1)){
        if(near.data.extra.code){
          const s=Inv.slots.find(s=>s.id==='vaultcode');if(s)s.code=near.data.extra.code;}
        Items.removeDrop(near.data);Audio2.pickup();UI.refreshAll();
      }
      break;}
    case 'firebox':{
      UI.notify('Nhấn F để nạp nhiên liệu vào lò','small');break;}
    case 'vault':{
      if(near.data.open){UI.notify('Két đã mở','small');break;}
      UI.openVault(near);break;}
    case 'depot':{
      if(!Inv.count('depotkey')){UI.notify('Cần Supply Depot Key (giết Cpt. Prescott)','warn');break;}
      Inv.remove('depotkey');near.dead=true;
      UI.notify('🔓 Kho quân nhu đã mở!','gold');
      const p=near.obj.getWorldPosition(new THREE.Vector3());
      [['ammo_rifle',2],['ammo_revolver',2],['bandage',3],['bonds',rndi(1,3)],
       ['rifle',1],['dynamite',rndi(1,2)]].forEach(([id,q])=>
        Items.dropItem(id,p.clone().add(new THREE.Vector3(rnd(-2,2),0,rnd(2,4)))));
      break;}
    case 'climb':{
      Player.pos.y=near.data.y;Player.vel.y=0;
      const wp=near.obj.getWorldPosition(new THREE.Vector3());
      Player.pos.x=wp.x;Player.pos.z=wp.z-1.6;break;}
    case 'turret':{
      Player.turret=near.data;Player.pos.copy(near.data.pos).setY(near.data.pos.y);
      UI.notify('🔫 Đang điều khiển Maxim Gun — E để rời','good');UI.refreshWeapon();break;}
    default:UI.notify(near.label,'small');
  }
}

function doFuel(){
  const nearFire=Math.abs(Player.pos.x-Train.pos+4.5)<9&&Math.abs(Player.pos.z)<6;
  if(!nearFire&&!Player.onTrain){UI.notify('Phải ở gần lò đốt của đầu máy','warn small');return;}
  // ưu tiên: xác > gỗ > than
  const order=['corpse_zombie','corpse_wolf','corpse_horse','corpse_vampire','corpse_outlaw',
               'corpse_werewolf','corpse_prescott','corpse_unicorn','wood','coal'];
  let burned=null;
  for(const id of order){
    if(Inv.count(id)>0){
      // đừng tự đốt hàng đắt tiền trừ khi hết than
      if((id==='corpse_unicorn'||id==='corpse_prescott')&&Inv.count('coal')>0)continue;
      Train.burnItem(id);Inv.remove(id);burned=id;break;
    }
  }
  if(!burned){UI.notify('Không có gì để đốt! (Than / Gỗ / Xác)','warn');Audio2.err();return;}
  Audio2.pickup();
  UI.notify(`🔥 Đốt ${Inv.name(burned)} → +${ITEMS[burned].fuel} fuel`,'good small');
  UI.refreshAll();
}

/* ==========================================================================
   src/core/GameState.js + GameLoop.js + main.js
   ========================================================================== */
const Game={
  state:'MENU',time:0,trainDX:0,last:0,
  start(){
    // dọn dẹp thế giới cũ
    Entities.clear();Items.clear();
    ProcGen.loaded.slice().forEach(p=>ProcGen.unload(p));
    Colliders.list=[];Interact.list=[];
    Player.reset();Train.reset();
    DayNight.t=6.5;DayNight.phase='DAY';
    ProcGen.init();
    ProcGen.update(Player.pos.x);
    Interact.add({obj:Train.fireMesh,radius:3.4,label:'🔥 Lò đốt — F để nạp nhiên liệu',kind:'firebox'});
    this.state='PLAYING';this.time=0;
    document.getElementById('start').classList.add('hidden');
    document.getElementById('gameover').classList.add('hidden');
    document.getElementById('pause').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    Audio2.init();Audio2.whistle();
    UI.notify('🚂 Mua than ở General Store rồi nhấn F để khởi hành','gold');
    UI.refreshAll();
    canvas.requestPointerLock();
  },
  pause(){
    if(this.state!=='PLAYING')return;
    this.state='PAUSED';document.getElementById('pause').classList.remove('hidden');
    document.exitPointerLock();
  },
  resume(){
    if(this.state!=='PAUSED')return;
    this.state='PLAYING';document.getElementById('pause').classList.add('hidden');
    canvas.requestPointerLock();
  },
  over(msg){
    if(this.state==='GAMEOVER')return;
    this.state='GAMEOVER';
    document.getElementById('gotitle').textContent=msg;
    document.getElementById('gostats').innerHTML=
      `Đi được <b>${fmt(Math.floor(Train.pos))} m</b> / 80,000 m<br>
       Tiêu diệt <b>${Player.kills}</b> kẻ thù · Còn <b>$${fmt(Player.money)}</b>`;
    document.getElementById('gameover').classList.remove('hidden');
    document.exitPointerLock();
  },
  win(){
    if(this.state==='GAMEOVER')return;
    this.state='GAMEOVER';
    document.getElementById('gotitle').textContent='🇲🇽 ĐẾN MEXICO!';
    document.getElementById('gostats').innerHTML=
      `Bạn đã vượt trọn <b>80,000 m</b> địa ngục.<br>
       Tiêu diệt <b>${Player.kills}</b> kẻ thù · Mang theo <b>$${fmt(Player.money)}</b>`;
    document.getElementById('gameover').classList.remove('hidden');
    document.exitPointerLock();Audio2.whistle();
  }
};

Train.init();

/* ---- nút bấm màn hình ---- */
document.getElementById('btnplay').onclick=()=>Game.start();
document.getElementById('btnresume').onclick=()=>Game.resume();
document.getElementById('btnrestart').onclick=()=>Game.start();
document.getElementById('btnagain').onclick=()=>Game.start();
document.getElementById('shopclose').onclick=()=>UI.closeShop();
document.getElementById('sellall').onclick=()=>{Economy.sellAllLoot();};
document.getElementById('vaultclose').onclick=()=>UI.closeVault();

/* ---- vòng lặp ---- */
function loop(now){
  requestAnimationFrame(loop);
  const dt=Math.min(.05,(now-Game.last)/1000||0);Game.last=now;
  if(Game.state==='PLAYING'){
    Game.time+=dt;
    // phím tắt
    if(Input.consume('KeyE')&&!UI.anyOverlay())doInteract();
    if(Input.consume('KeyF')&&!UI.anyOverlay())doFuel();
    if(Input.consume('KeyG')&&!UI.anyOverlay())Player.throwItem();
    if(Input.consume('KeyR')&&!UI.anyOverlay())Player.reload();
    if(Input.consume('Tab'))UI.toggleInv();
    if(Input.consume('Escape')){
      if(UI.shopOpen)UI.closeShop();
      else if(UI.vaultOpen)UI.closeVault();
      else if(UI.invOpen)UI.toggleInv();
      else Game.pause();
    }
    for(let i=1;i<=8;i++)if(Input.consume('Digit'+i)){
      Player.selected=i-1;UI.refreshInv();
      const s=Inv.usable()[i-1];
      if(s&&WEAPONS[s.id])Player.equip(s.id);
    }
    if(!UI.anyOverlay()){
      if(Input.mouse.down&&Input.locked)Player.fire();
      if(Input.consume('KeyQ'))Player.useSelected();
      Game.trainDX=Train.update(dt);
      Player.update(dt);
      Entities.update(dt);
      Items.update(dt);
      Combat.update(dt);
      WaveSpawner.update(dt);
      EventManager.update(dt);
      DayNight.update(dt);
      Terrain.update(Player.pos.x,Player.pos.z);
      Railroad.update(Player.pos.x);
      ProcGen.update(Player.onTrain?Train.pos:Player.pos.x);
      // prompt tương tác
      const n=Interact.nearest(Player.pos);
      const mount=Entities.nearestPassive(Player.pos,3.6);
      const trainD=Math.abs(Player.pos.x-(Train.pos-10))<20&&Math.abs(Player.pos.z)<7;
      if(n)UI.setPrompt(`<b>[E]</b> ${n.label}`);
      else if(mount)UI.setPrompt(`<b>[E]</b> Cưỡi ${mount.cfg.n}`);
            // ---- prompt tương tác (tiếp) ----
      else if(trainD)UI.setPrompt(Player.onTrain?'<b>[E]</b> Xuống tàu':'<b>[E]</b> Lên tàu');
      else UI.setPrompt('');

      // ---- cảnh báo trạng thái tàu ----
      if(Train.fuel<=0&&Train.speed<.2&&Game.time-(Game._warn||0)>12){
        Game._warn=Game.time;
        UI.notify('⛽ HẾT NHIÊN LIỆU — nhấn F để đốt than / gỗ / xác','warn');
      }
      UI.refreshBars();
    }
  }
  renderer.render(scene,camera);
}
requestAnimationFrame(loop);

/* ==========================================================================
   PATCH — items/weapons/MaximGun.js : đặt turret cố định xuống đất
   ========================================================================== */
(function(){
  const origUse=Player.useSelected.bind(Player);
  Player.useSelected=function(){
    const s=Inv.usable()[Player.selected];
    if(s&&s.id==='maxim'&&!Player.turret){
      const p=Player.pos.clone();
      const g=new THREE.Group();
      box(1.6,.3,.3,MAT.metal,0,1.05,0,g);
      box(.6,.6,.6,MAT.dark,-.7,1.0,0,g);
      [[-.5,-.5],[.5,-.5],[0,.6]].forEach(([x,z])=>box(.12,.9,.12,MAT.metal,x,.45,z,g));
      g.position.copy(p).setY(p.y);scene.add(g);
      const data={pos:p.clone().setY(p.y),mesh:g};
      Interact.add({obj:g,pos:p.clone().setY(p.y+1),radius:2.8,
        label:'🔫 Dùng Maxim Gun',kind:'turret',data});
      Inv.remove('maxim');
      Player.mag.maxim=Player.mag.maxim||0;
      UI.notify('🔫 Đã đặt Maxim Gun — [E] để lên bắn (không di chuyển được)','good');
      UI.refreshAll();
      return;
    }
    origUse();
  };
})();

/* ==========================================================================
   PATCH — chuột phải / Q dùng vật phẩm đang chọn (tiện hơn)
   ========================================================================== */
addEventListener('contextmenu',e=>{
  e.preventDefault();
  if(Game.state==='PLAYING'&&!UI.anyOverlay())Player.useSelected();
});

})(); // end IIFE
