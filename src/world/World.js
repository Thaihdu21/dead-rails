// ==========================================================
//  World.js = Terrain + Railroad + DayNight + ProceduralGen
//             + BuildingFactory + locations/*
// ==========================================================
import * as THREE from 'three';
import { G } from '../core/Game.js';
import { TEX, Audio } from '../core/Assets.js';
import { CFG, mulberry32, rnd, pick, rollLoot } from '../core/Constants.js';

// ---------------- Materials ----------------
export const MAT = {};
function initMats(){
  MAT.sand  = new THREE.MeshLambertMaterial({map:TEX.sand()});
  MAT.wood  = new THREE.MeshLambertMaterial({map:TEX.wood()});
  MAT.dwood = new THREE.MeshLambertMaterial({map:TEX.darkwood()});
  MAT.stone = new THREE.MeshLambertMaterial({map:TEX.stone()});
  MAT.roof  = new THREE.MeshLambertMaterial({map:TEX.roof()});
  MAT.metal = new THREE.MeshLambertMaterial({map:TEX.metal()});
  MAT.rail  = new THREE.MeshLambertMaterial({color:0x6b6b70});
  MAT.tie   = new THREE.MeshLambertMaterial({color:0x4a3520});
  MAT.cact  = new THREE.MeshLambertMaterial({color:0x4a7a44});
  MAT.rock  = new THREE.MeshLambertMaterial({color:0x8b7a63});
  MAT.gold  = new THREE.MeshLambertMaterial({color:0xffd54a, emissive:0x664400});
  MAT.holy  = new THREE.MeshLambertMaterial({color:0xfff3c4, emissive:0x8a7a30});
  MAT.crate = new THREE.MeshLambertMaterial({color:0x8a6636});
  MAT.dark  = new THREE.MeshLambertMaterial({color:0x2a2118});
}

const box = (w,h,d)=>new THREE.BoxGeometry(w,h,d);

// ---------------- BuildingFactory.js ----------------
function part(group, mat, w,h,d, x,y,z, solid=true){
  const m = new THREE.Mesh(box(w,h,d), mat);
  m.position.set(x,y,z);
  m.userData.solid = solid;
  group.add(m); return m;
}

/** Nhà hộp có cửa ở mặt -Z */
function buildingShell(g, w, d, h, mat, roofMat, doorW = 1.8){
  const t = .22;
  part(g, mat, w, h, t, 0, h/2,  d/2);                    // back
  part(g, mat, t, h, d, -w/2, h/2, 0);                    // left
  part(g, mat, t, h, d,  w/2, h/2, 0);                    // right
  const side = (w - doorW)/2;
  part(g, mat, side, h, t, -(doorW/2+side/2), h/2, -d/2);
  part(g, mat, side, h, t,  (doorW/2+side/2), h/2, -d/2);
  part(g, mat, doorW, h-2.2, t, 0, h-(h-2.2)/2, -d/2);    // lintel
  const floor = new THREE.Mesh(box(w,.16,d), MAT.dwood);
  floor.position.y = .08; floor.userData.solid = false; g.add(floor);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)*.78, 1.9, 4), roofMat);
  roof.position.y = h + .9; roof.rotation.y = Math.PI/4;
  roof.userData.solid = false; g.add(roof);
  return g;
}

// ---------------- World ----------------
export class World{
  constructor(scene, seed = Date.now()%99999){
    initMats();
    this.scene = scene;
    this.seed = seed;
    this.rng = mulberry32(seed);
    this.colliders = [];        // {box:Box3, loc}
    this.interactables = [];    // {pos, r, label, fn, loc, obj}
    this.chunks = new Map();
    this.locations = [];
    this.holyZones = [];        // {pos, r, until}
    this.lures = [];            // banjo
    this.turrets = [];
    this.buildLights();
    this.buildGround();
    this.generateLocations();
  }

  // -------- DayNight.js --------
  buildLights(){
    this.hemi = new THREE.HemisphereLight(0xffe9c4, 0xa07a4a, .85);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff0d0, 1.0);
    this.sun.position.set(60,120,40);
    this.scene.add(this.sun);
    // stars + moon
    const pg = new THREE.BufferGeometry();
    const pos = [];
    for(let i=0;i<700;i++){
      const th = Math.random()*Math.PI*2, ph = Math.random()*Math.PI*.45;
      pos.push(Math.cos(th)*Math.cos(ph)*1200, Math.sin(ph)*1200+60, Math.sin(th)*Math.cos(ph)*1200);
    }
    pg.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
    this.stars = new THREE.Points(pg, new THREE.PointsMaterial({color:0xffffff,size:3,sizeAttenuation:false}));
    this.stars.visible = false; this.scene.add(this.stars);
    this.moonMesh = new THREE.Mesh(new THREE.SphereGeometry(46,16,16),
      new THREE.MeshBasicMaterial({color:0xf2f0e0}));
    this.moonMesh.visible = false; this.scene.add(this.moonMesh);
  }

  // -------- Terrain.js --------
  buildGround(){
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(3000,3000), MAT.sand);
    this.ground.rotation.x = -Math.PI/2;
    this.scene.add(this.ground);
  }

  chunkKey(i){ return 'c'+i; }
  buildChunk(i){
    const CS = 250, rng = mulberry32(this.seed + i*7919);
    const g = new THREE.Group();
    const x0 = i*CS;
    // Railroad.js — tà vẹt + 2 ray
    for(let k=0;k<CS/2.5;k++){
      const t = new THREE.Mesh(box(.5,.14,3.4), MAT.tie);
      t.position.set(x0+k*2.5, .07, 0); g.add(t);
    }
    [-.72,.72].forEach(z=>{
      const r = new THREE.Mesh(box(CS,.16,.16), MAT.rail);
      r.position.set(x0+CS/2, .2, z); g.add(r);
    });
    // scatter
    for(let k=0;k<26;k++){
      const x = x0 + rng()*CS, z = (rng()*2-1)*430;
      if(Math.abs(z) < 7) continue;
      const t = rng();
      if(t < .38){ // cactus
        const c = new THREE.Group();
        const hh = 1.6+rng()*2.4;
        const b1 = new THREE.Mesh(new THREE.CylinderGeometry(.28,.34,hh,6), MAT.cact);
        b1.position.y = hh/2; c.add(b1);
        if(rng()>.4){
          const a = new THREE.Mesh(new THREE.CylinderGeometry(.18,.2,1.1,6), MAT.cact);
          a.position.set(.5, hh*.65, 0); a.rotation.z = -.9; c.add(a);
        }
        c.position.set(x,0,z); g.add(c);
      } else if(t < .72){ // rock
        const r = new THREE.Mesh(new THREE.DodecahedronGeometry(.4+rng()*1.3), MAT.rock);
        r.position.set(x, .2, z); r.rotation.set(rng(),rng(),rng()); g.add(r);
      } else { // dune
        const d = new THREE.Mesh(new THREE.SphereGeometry(6+rng()*14, 8, 5,0,Math.PI*2,0,Math.PI/2), MAT.sand);
        d.position.set(x,-1.2,z); d.scale.y = .22+rng()*.2; g.add(d);
      }
    }
    this.scene.add(g);
    this.chunks.set(this.chunkKey(i), g);
  }

  // -------- ProceduralGen.js --------
  generateLocations(){
    const r = this.rng, L = [];
    L.push({x:0, z:0, type:'fort_start'});
    L.push({x:7000, z:0, type:'village'});
    for(let d=10000; d<=70000; d+=10000) L.push({x:d, z:0, type:'checkpoint'});
    L.push({x:38000, z: 90, type:'castle'});
    L.push({x: Math.round(20000 + r()*48000), z:-85, type:'fort_constitution'});

    let x = 11800;
    const kinds = ['house','house','house','outlaw_camp','watchtower','town','village','outlaw_camp'];
    while(x < 78000){
      if(!L.some(l=>Math.abs(l.x-x) < 900)){
        const type = pick(r, kinds);
        L.push({x:Math.round(x), z:(r()>.5?1:-1)*(38+r()*38), type, seed:(r()*1e6)|0});
      }
      x += 1000 + r()*2000;
    }
    L.sort((a,b)=>a.x-b.x);
    L.forEach(l=>{ l.seed = l.seed ?? ((r()*1e6)|0); l.spawned=false; });
    this.locations = L;
    // checkpoint stop list cho tàu
    this.stops = L.filter(l=>l.type==='checkpoint').map(l=>({x:l.x, done:false}));
  }

  update(dt, px){
    // chunks
    const ci = Math.floor(px/250);
    for(let i=ci-3;i<=ci+4;i++) if(!this.chunks.has(this.chunkKey(i))) this.buildChunk(i);
    for(const [k,g] of this.chunks){
      const idx = +k.slice(1);
      if(idx < ci-4 || idx > ci+5){ this.scene.remove(g); disposeTree(g); this.chunks.delete(k); }
    }
    this.ground.position.x = Math.round(px/100)*100;

    // locations
    for(const loc of this.locations){
      const d = Math.abs(loc.x - px);
      if(!loc.spawned && d < 700) this.spawnLocation(loc);
      else if(loc.spawned && d > 950) this.despawnLocation(loc);
    }
    this.updateSky(dt);

    // holy zones
    for(let i=this.holyZones.length-1;i>=0;i--){
      const z = this.holyZones[i];
      z.mesh.rotation.y += dt*.6;
      z.mesh.material.opacity = .18 + Math.sin(G.time*3)*.06;
    }
    for(let i=this.lures.length-1;i>=0;i--){
      const l = this.lures[i];
      l.t -= dt;
      if(l.t <= 0){ this.lures.splice(i,1); }
    }
  }

  updateSky(dt){
    G.gameTime += dt * (86400/CFG.DAY_LENGTH);
    const hour = (G.gameTime/3600) % 24;
    const wasNight = G.isNight;
    G.isNight = (hour >= 22 || hour < 5);
    if(G.isNight && !wasNight){
      const r = Math.random();
      G.moon = r < .18 ? 'blood' : (r < .38 ? 'full' : 'none');
      if(G.moon==='blood'){ G.ui.notify('🩸 BLOOD MOON — MA CÀ RỒNG THỨC GIẤC!','blood'); Audio.thunder(); }
      else if(G.moon==='full'){ G.ui.notify('🌕 FULL MOON — NGƯỜI SÓI SĂN MỒI!','blood'); Audio.howl(); }
      else G.ui.notify('🌙 Màn đêm buông xuống...','bad');
    }
    if(!G.isNight && wasNight){ G.moon='none'; G.ui.notify('☀ Bình minh — kẻ thù yếu đi','good'); }

    // ánh sáng
    const ang = ((hour-6)/24)*Math.PI*2;
    this.sun.position.set(Math.cos(ang)*200, Math.max(-40, Math.sin(ang)*220), 60);
    let sky, sunI, hemiI, fogNear, fogFar;
    if(G.isNight){
      sunI=.08; hemiI=.16;
      sky = G.moon==='blood' ? 0x2a0606 : 0x0a0d1c;
      fogNear=25; fogFar=260;
    } else if(hour<7 || hour>19){
      sunI=.55; hemiI=.5; sky=0xd88a4a; fogNear=60; fogFar=650;
    } else {
      sunI=1.0; hemiI=.85; sky=0x9fc3e0; fogNear=90; fogFar=900;
    }
    this.sun.intensity += (sunI-this.sun.intensity)*Math.min(1,dt*1.5);
    this.hemi.intensity += (hemiI-this.hemi.intensity)*Math.min(1,dt*1.5);
    this.sun.color.setHex(G.moon==='blood'&&G.isNight ? 0xff4444 : 0xfff0d0);
    this.scene.background.lerp(new THREE.Color(sky), Math.min(1,dt*1.5));
    this.scene.fog.color.copy(this.scene.background);
    this.scene.fog.near += (fogNear-this.scene.fog.near)*Math.min(1,dt);
    this.scene.fog.far  += (fogFar -this.scene.fog.far )*Math.min(1,dt);

    this.stars.visible = G.isNight;
    this.moonMesh.visible = G.isNight;
    if(G.isNight){
      const p = G.player.pos;
      this.stars.position.set(p.x, 0, p.z);
      this.moonMesh.position.set(p.x-300, 420, p.z-700);
      this.moonMesh.material.color.setHex(G.moon==='blood'?0xff2b2b:0xf2f0e0);
      this.moonMesh.scale.setScalar(G.moon==='none'?.6:1.2);
    }
  }

  // ---------- helpers ----------
  addCollidersFrom(group, loc){
    group.updateMatrixWorld(true);
    group.traverse(o=>{
      if(o.isMesh && o.userData.solid){
        this.colliders.push({box:new THREE.Box3().setFromObject(o), loc});
      }
    });
  }
  addInteract(loc, pos, r, label, fn, obj){
    const it = {pos:pos.clone(), r, label, fn, loc, obj, used:false};
    this.interactables.push(it); return it;
  }
  /** thùng loot dùng chung */
  addLootObject(loc, group, x,y,z, table, rng, label='Lục soát', mesh=null){
    const m = mesh || new THREE.Mesh(box(1,.8,.7), MAT.crate);
    m.position.set(x,y,z); group.add(m);
    const world = new THREE.Vector3();
    const it = this.addInteract(loc, new THREE.Vector3(), 2.6, label, ()=>{
      if(it.used) return;
      it.used = true;
      const loot = rollLoot(table, rng);
      let txt = [];
      for(const id in loot){
        if(id==='money'){ const amt = 15+Math.floor(rng()*70)*loot[id];
          G.player.money += amt; txt.push(`$${amt}`); }
        else if(id.startsWith('W:')){ const w=id.slice(2);
          G.player.giveWeapon(w); txt.push(WNAME(w)); }
        else { G.player.add(id, loot[id]); txt.push(`${ITNAME(id)} x${loot[id]}`); }
      }
      Audio.pickup();
      G.ui.notify('📦 ' + txt.join(', '), 'good');
      m.rotation.z = .35; m.position.y -= .15;
      it.label = 'Đã lục soát';
    }, m);
    it.dynamic = ()=>{ m.getWorldPosition(world); return world; };
    return it;
  }

  // ---------- locations/*.js ----------
  spawnLocation(loc){
    loc.spawned = true;
    const g = new THREE.Group();
    g.position.set(loc.x, 0, loc.z);
    this.scene.add(g);
    loc.group = g;
    const rng = mulberry32(loc.seed || 1);
    const fn = {
      fort_start:       ()=>this.buildFort(loc,g,rng,true),
      checkpoint:       ()=>this.buildFort(loc,g,rng,false),
      village:          ()=>this.buildVillage(loc,g,rng),
      town:             ()=>this.buildTown(loc,g,rng),
      house:            ()=>this.buildStandalone(loc,g,rng),
      outlaw_camp:      ()=>this.buildOutlawCamp(loc,g,rng),
      watchtower:       ()=>this.buildWatchtower(loc,g,rng),
      castle:           ()=>this.buildCastle(loc,g,rng),
      fort_constitution:()=>this.buildFortConstitution(loc,g,rng),
    }[loc.type];
    fn && fn();
    this.addCollidersFrom(g, loc);
  }
  despawnLocation(loc){
    if(loc.group){ this.scene.remove(loc.group); disposeTree(loc.group); loc.group = null; }
    this.colliders = this.colliders.filter(c=>c.loc!==loc);
    this.interactables = this.interactables.filter(i=>i.loc!==loc);
    G.entities.removeByLoc(loc);
    loc.spawned = false;
    loc.seed = loc.seed; // giữ nguyên -> loot state reset (chấp nhận được)
  }

  // ---- Fort (Starting Zone / Checkpoint) ----
  buildFort(loc, g, rng, isStart){
    const W = 62, D = 56;
    // tường gỗ (chừa 2 cổng cho đường ray)
    const h = 4.2;
    part(g, MAT.wood, W, h, .5, 0, h/2, -D/2);
    part(g, MAT.wood, W, h, .5, 0, h/2,  D/2);
    [-1,1].forEach(s=>{
      part(g, MAT.wood, .5, h, D/2-3.5, s*W/2, h/2, -(D/4+1.75));
      part(g, MAT.wood, .5, h, D/2-3.5, s*W/2, h/2,  (D/4+1.75));
    });
    // 3 SHOP hữu dụng
    const shops = [
      {x:-20, z:-18, key:'general',  t:'GENERAL STORE', mat:MAT.wood},
      {x:  2, z:-18, key:'gunsmith', t:'GUNSMITH',      mat:MAT.dwood},
      {x: 24, z:-18, key:'trading',  t:'TRADING POST',  mat:MAT.wood},
    ];
    shops.forEach(s=>{
      const b = new THREE.Group(); b.position.set(s.x, 0, s.z);
      buildingShell(b, 11, 9, 4, s.mat, MAT.roof);
      // biển hiệu
      const sign = new THREE.Mesh(box(8,1.1,.2),
        new THREE.MeshBasicMaterial({color: s.key==='trading'?0xc9a227:(s.key==='gunsmith'?0x8b3a3a:0x3a6b8b)}));
      sign.position.set(0, 4.4, -4.7); b.add(sign);
      g.add(b);
      const wp = new THREE.Vector3(loc.x+s.x, 1.4, loc.z+s.z-3.2);
      this.addInteract(loc, wp, 3.4, `🛒 Mở ${s.t}`, ()=>G.ui.openShop(s.key, s.t));
    });
    // 3 nhà trang trí
    const deco = [{x:-22,z:16,locked:false},{x:0,z:16,locked:false},{x:22,z:16,locked:true}];
    deco.forEach((d,i)=>{
      const b = new THREE.Group(); b.position.set(d.x,0,d.z);
      buildingShell(b, 10, 8, 3.6, MAT.dwood, MAT.roof, d.locked ? .01 : 1.8);
      if(!d.locked){
        part(b, MAT.wood, 2,.15,1.2, 0,.9,1.5);            // bàn
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(.22,8,8),
          new THREE.MeshBasicMaterial({color:0xffcc66}));
        lamp.position.set(0,1.2,1.5); b.add(lamp);
        b.add(new THREE.PointLight(0xffaa44, .5, 9));
      }
      g.add(b);
      const wp = new THREE.Vector3(loc.x+d.x, 1.4, loc.z+d.z-4.5);
      this.addInteract(loc, wp, 3, d.locked?'🔒 Cửa đã khóa chặt':'🏚 Nhà dân trống — chẳng có gì',
        ()=>G.ui.notify(d.locked?'Cửa kho bị khóa. Không vào được.':'Chỉ có bàn và một chiếc đèn lồng.'));
    });
    // lính canh NPC
    for(let i=0;i<4;i++){
      const guard = simpleNPC();
      guard.position.set(-24+i*16, 0, -6);
      g.add(guard);
    }
    if(isStart){
      const wp = new THREE.Vector3(loc.x, 1.2, loc.z+22);
      this.addInteract(loc, wp, 3, '📜 Bảng thông báo', ()=>
        G.ui.notify('Mexico cách 80,000m. Đốt lò, giữ mạng. Chúc may mắn, kẻ liều mạng.'));
    }
  }

  // ---- Abandoned Village ----
  buildVillage(loc, g, rng){
    const n = 3 + Math.floor(rng()*3);
    for(let i=0;i<n;i++){
      const x = -26 + i*15 + rng()*4, z = 26 + rng()*10;
      const b = new THREE.Group(); b.position.set(x,0,z);
      buildingShell(b, 10, 8, 3.6, rng()>.5?MAT.wood:MAT.dwood, MAT.roof);
      g.add(b);
      this.addLootObject(loc, b, rng()*4-2, .5, 2, 'house', rng);
      const cnt = 1 + Math.floor(rng()*2);
      for(let k=0;k<cnt;k++)
        G.entities.spawnEnemy(rng()>.75?'runner':'zombie',
          loc.x+x+rng()*3-1.5, loc.z+z+rng()*3-1.5, loc);
    }
    // Health Center
    const hc = new THREE.Group(); hc.position.set(-30, 0, -24); g.add(hc);
    buildingShell(hc, 12, 10, 4, MAT.wood, MAT.roof);
    const cross = new THREE.Mesh(box(2.4,.5,.2), new THREE.MeshBasicMaterial({color:0xcc2222}));
    cross.position.set(0,4.3,-5.2); hc.add(cross);
    const cross2 = cross.clone(); cross2.rotation.z = Math.PI/2; hc.add(cross2);
    this.addLootObject(loc, hc, 0,.5,3, 'doctor', rng, 'Lục tủ thuốc');
    this.addLootObject(loc, hc, -4,.5,3, 'doctor', rng, 'Lục tủ thuốc');
    for(let k=0;k<2;k++) G.entities.spawnEnemy('zombie', loc.x-30+k*3, loc.z-22, loc);

    // Church — vùng cấm zombie
    const ch = new THREE.Group(); ch.position.set(24,0,-26); g.add(ch);
    buildingShell(ch, 13, 16, 6, MAT.stone, MAT.roof, 2.4);
    const steep = new THREE.Mesh(new THREE.ConeGeometry(2.2, 6, 4), MAT.roof);
    steep.position.set(0, 10, -6); steep.rotation.y=Math.PI/4; ch.add(steep);
    const cv = new THREE.Mesh(box(.3,3,.3), MAT.gold); cv.position.set(0,14.5,-6); ch.add(cv);
    const chz = new THREE.Mesh(box(1.6,.3,.3), MAT.gold); chz.position.set(0,14.6,-6); ch.add(chz);
    ch.add(new THREE.PointLight(0xffd9a0, .8, 20));
    for(let k=0;k<4;k++) part(ch, MAT.dwood, 7,.4,.6, 0,.7,-3+k*3, false);
    this.addLootObject(loc, ch, 0,.9,6.5, 'church', rng, '✝ Bàn thờ — lấy thánh vật');
    loc.churchPos = new THREE.Vector3(loc.x+24, 0, loc.z-26);
    loc.churchR = 13;
  }

  // ---- Town ----
  buildTown(loc, g, rng){
    const n = 5 + Math.floor(rng()*4);
    for(let i=0;i<n;i++){
      const x = -34 + i*13, z = (i%2?1:-1)*(16+rng()*8);
      const b = new THREE.Group(); b.position.set(x,0,z);
      buildingShell(b, 11, 9, 4.4, rng()>.5?MAT.wood:MAT.dwood, MAT.roof);
      g.add(b);
      this.addLootObject(loc, b, 0,.5,2.5, 'town', rng);
      for(let k=0;k<1+Math.floor(rng()*3);k++)
        G.entities.spawnEnemy(rng()>.7?'runner':'zombie', loc.x+x+rng()*4, loc.z+z+rng()*4, loc);
    }
    // BANK
    const bk = new THREE.Group(); bk.position.set(0,0,-34); g.add(bk);
    buildingShell(bk, 16, 13, 6, MAT.stone, MAT.roof, 2.6);
    for(let i=0;i<4;i++) part(bk, MAT.stone, .7,5.6,.7, -6+i*4, 2.8, -6.8);
    const vault = new THREE.Mesh(box(3.2,3.2,.6), MAT.metal);
    vault.position.set(0,1.7,5.8); vault.userData.solid=false; bk.add(vault);
    const dial = new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,.2,12), MAT.gold);
    dial.rotation.x = Math.PI/2; dial.position.set(0,1.7,5.4); bk.add(dial);

    const code = String(10000 + Math.floor(rng()*89999));
    loc.vaultCode = code;
    const banker = G.entities.spawnEnemy('banker', loc.x+3, loc.z-30, loc);
    if(banker) banker.dropCode = {loc, code};

    const vpos = new THREE.Vector3(loc.x, 1.7, loc.z-34+5.2);
    const vit = this.addInteract(loc, vpos, 3, '🏦 Két sắt (cần mã 5 số)', ()=>{
      if(vit.used) return;
      if(G.player.vaultCodes.has(code)){
        vit.used = true; vault.position.z += 1.4; vault.rotation.y = .9;
        const loot = rollLoot('vault', rng, 5);
        let t=[];
        for(const id in loot){
          if(id==='money'){ const a=60+Math.floor(rng()*140); G.player.money+=a; t.push('$'+a); }
          else if(id.startsWith('W:')) { G.player.giveWeapon(id.slice(2)); t.push(WNAME(id.slice(2))); }
          else { G.player.add(id, loot[id]); t.push(`${ITNAME(id)} x${loot[id]}`); }
        }
        Audio.money(); G.ui.notify('💰 KÉT MỞ: ' + t.join(', '), 'good');
        vit.label = 'Két đã rỗng';
      } else {
        Audio.deny();
        G.ui.notify('🔒 Cần mã 5 số — giết Zombie Banker trong thị trấn!','bad');
      }
    });
    // Church
    const ch = new THREE.Group(); ch.position.set(34,0,26); g.add(ch);
    buildingShell(ch, 12, 14, 6, MAT.stone, MAT.roof, 2.4);
    const st = new THREE.Mesh(new THREE.ConeGeometry(2,5,4), MAT.roof);
    st.position.set(0,9,-5); ch.add(st);
    this.addLootObject(loc, ch, 0,.9,5.5, 'church', rng, '✝ Bàn thờ');
    loc.churchPos = new THREE.Vector3(loc.x+34,0,loc.z+26); loc.churchR = 12;
    // zombie cỡ lớn
    for(let k=0;k<2;k++){
      const z = G.entities.spawnEnemy('zombie', loc.x+rng()*20-10, loc.z+rng()*20-10, loc);
      if(z){ z.hp = z.maxHp = 160; z.dmg = 20; z.mesh.scale.setScalar(1.45); z.big = true; }
    }
  }

  // ---- Standalone house ----
  buildStandalone(loc, g, rng){
    const b = new THREE.Group(); g.add(b);
    buildingShell(b, 10, 8, 3.8, MAT.dwood, MAT.roof);
    this.addLootObject(loc, b, 1,.5,2, 'house', rng);
    if(rng()>.55) this.addLootObject(loc, b, -3,.5,-1, 'house', rng, 'Lục rương');
    for(let k=0;k<1+Math.floor(rng()*2);k++)
      G.entities.spawnEnemy('zombie', loc.x+rng()*5-2.5, loc.z+rng()*5-2.5, loc);
    // giếng trang trí
    const w = new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.2,1,10), MAT.stone);
    w.position.set(9,.5,4); w.userData.solid = true; g.add(w);
  }

  // ---- Outlaw Camp ----
  buildOutlawCamp(loc, g, rng){
    for(let i=0;i<4;i++){
      const t = new THREE.Mesh(new THREE.ConeGeometry(2.4,3.2,7),
        new THREE.MeshLambertMaterial({color:0x7a6a4a}));
      t.position.set(Math.cos(i*1.6)*9, 1.6, Math.sin(i*1.6)*9);
      t.userData.solid = true; g.add(t);
    }
    const fire = new THREE.Mesh(new THREE.ConeGeometry(.7,1.4,6),
      new THREE.MeshBasicMaterial({color:0xff7722}));
    fire.position.y = .7; g.add(fire);
    const fl = new THREE.PointLight(0xff7722, 1.6, 22); fl.position.y=1.4; g.add(fl);
    loc.fire = fire;
    this.addLootObject(loc, g, 0,.5,5, 'outlaw', rng, '🧰 Rương của băng cướp');
    const n = 3 + Math.floor(rng()*4);
    for(let i=0;i<n;i++){
      const o = G.entities.spawnEnemy('outlaw',
        loc.x+Math.cos(i*2)*11, loc.z+Math.sin(i*2)*11, loc);
      if(o && rng()>.6) o.mounted = true;
    }
    if(rng()>.6) G.entities.spawnPassive(rng()>.85?'unicorn':'horse', loc.x+14, loc.z+8, loc);
  }

  // ---- Watchtower ----
  buildWatchtower(loc, g, rng){
    [[-2,-2],[2,-2],[-2,2],[2,2]].forEach(([x,z])=>part(g, MAT.wood, .5,9,.5, x,4.5,z));
    part(g, MAT.dwood, 6,.4,6, 0,9.2,0);
    [[0,-3],[0,3],[-3,0],[3,0]].forEach(([x,z])=>
      part(g, MAT.wood, x?.3:6, 1.2, x?6:.3, x,10, z));
    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.6,2,4), MAT.roof);
    roof.position.y = 11.6; roof.rotation.y=Math.PI/4; g.add(roof);
    this.addLootObject(loc, g, 2,9.6,2, 'gunsmith_ab', rng, '🔫 Hòm súng');
    for(let i=0;i<2+Math.floor(rng()*2);i++){
      const o = G.entities.spawnEnemy('outlaw', loc.x+i*2-1, loc.z, loc);
      if(o){ o.mesh.position.y = 9.4; o.pos.y = 9.4; o.sniper = true; }
    }
  }

  // ---- Castle (~38,000m) ----
  buildCastle(loc, g, rng){
    const W=46, D=40, H=11;
    part(g, MAT.stone, W, H, 1.2, 0, H/2, -D/2);
    part(g, MAT.stone, W, H, 1.2, 0, H/2,  D/2);
    part(g, MAT.stone, 1.2, H, D, -W/2, H/2, 0);
    part(g, MAT.stone, 1.2, H, D,  W/2, H/2, 0);
    [[-W/2,-D/2],[W/2,-D/2],[-W/2,D/2],[W/2,D/2]].forEach(([x,z])=>{
      const t = new THREE.Mesh(new THREE.CylinderGeometry(3.4,3.8,17,10), MAT.stone);
      t.position.set(x,8.5,z); t.userData.solid=true; g.add(t);
      const c = new THREE.Mesh(new THREE.ConeGeometry(4.2,5,10), MAT.roof);
      c.position.set(x,19.5,z); g.add(c);
    });
    // keep
    const keep = new THREE.Group(); keep.position.set(0,0,6); g.add(keep);
    buildingShell(keep, 20, 16, 9, MAT.stone, MAT.roof, 3);
    keep.add(new THREE.PointLight(0x6688ff,.7,30));
    this.addLootObject(loc, keep, 0,.7,6, 'castle', rng, '⚰️ Quan tài kho báu');
    this.addLootObject(loc, keep, -6,.7,3, 'castle', rng, '🗝 Rương đá');
    G.entities.spawnEnemy('vampire', loc.x, loc.z+6, loc);
    if(rng()>.5) G.entities.spawnEnemy('vampire', loc.x+6, loc.z+2, loc);
    for(let i=0;i<15;i++){
      const a = i/15*Math.PI*2;
      G.entities.spawnEnemy('werewolf', loc.x+Math.cos(a)*(8+rng()*12), loc.z+Math.sin(a)*(8+rng()*12), loc);
    }
    G.ui.notify('🏰 LÂU ĐÀI phía trước — vampire & 15+ werewolf!','bad');
  }

  // ---- Fort Constitution ----
  buildFortConstitution(loc, g, rng){
    const W=52,D=44,H=5.5;
    part(g, MAT.dwood, W,H,.6, 0,H/2,-D/2);
    part(g, MAT.dwood, W,H,.6, 0,H/2, D/2);
    part(g, MAT.dwood, .6,H,D, -W/2,H/2,0);
    part(g, MAT.dwood, .6,H,D,  W/2,H/2,0);
    const depot = new THREE.Group(); depot.position.set(0,0,10); g.add(depot);
    buildingShell(depot, 16, 12, 5, MAT.wood, MAT.roof, 2.4);
    const crate = new THREE.Mesh(box(3,2,2), MAT.crate);
    crate.position.set(0,1,4); depot.add(crate);

    const boss = G.entities.spawnEnemy('prescott', loc.x, loc.z-8, loc);
    if(boss){ boss.mesh.scale.setScalar(1.3); boss.isBoss = true; boss.dropKey = true; }
    for(let i=0;i<5;i++) G.entities.spawnEnemy('outlaw', loc.x-16+i*8, loc.z-14, loc);

    const dpos = new THREE.Vector3(loc.x, 1.2, loc.z+10+2.6);
    const dit = this.addInteract(loc, dpos, 3, '🔐 Supply Depot (cần chìa)', ()=>{
      if(dit.used) return;
      if(!G.player.has('supply_key')){ Audio.deny(); G.ui.notify('Cần Supply Depot Key từ Captain Prescott!','bad'); return; }
      dit.used = true; G.player.remove('supply_key',1);
      const loot = rollLoot('depot', rng, 6); let t=[];
      for(const id in loot){
        if(id.startsWith('W:')){ G.player.giveWeapon(id.slice(2)); t.push(WNAME(id.slice(2))); }
        else { G.player.add(id, loot[id]); t.push(`${ITNAME(id)} x${loot[id]}`); }
      }
      Audio.money(); G.ui.notify('🎖 KHO QUÂN NHU: ' + t.join(', '), 'good');
      dit.label = 'Kho đã rỗng';
    });
    G.ui.notify('🏰 FORT CONSTITUTION — Captain Prescott đang chờ.','bad');
  }

  // ---- truy vấn ----
  nearbyColliders(x, z, r=4){
    const out = [];
    for(const c of this.colliders){
      const b = c.box;
      if(x > b.min.x-r && x < b.max.x+r && z > b.min.z-r && z < b.max.z+r) out.push(b);
    }
    return out;
  }
  inChurch(p){
    for(const l of this.locations){
      if(l.spawned && l.churchPos && p.distanceTo(l.churchPos) < l.churchR) return true;
    }
    return false;
  }
  addHolyZone(pos){
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(8,8,.15,24),
      new THREE.MeshBasicMaterial({color:0xfff0b0, transparent:true, opacity:.2, side:THREE.DoubleSide}));
    mesh.position.copy(pos); mesh.position.y = .1;
    this.scene.add(mesh);
    const cross = new THREE.Mesh(box(.16,1.2,.16), MAT.gold);
    cross.position.copy(pos); cross.position.y = .6; this.scene.add(cross);
    const arm = new THREE.Mesh(box(.7,.16,.16), MAT.gold);
    arm.position.copy(pos); arm.position.y = .95; this.scene.add(arm);
    const z = {pos:pos.clone(), r:8, mesh, extra:[cross,arm]};
    this.holyZones.push(z);
    return z;
  }
}

// ---------------- helpers dùng chung ----------------
export function disposeTree(root){
  root.traverse(o=>{
    if(o.isMesh){ o.geometry?.dispose?.(); }
  });
}
function simpleNPC(){
  const g = new THREE.Group();
  const body = new THREE.Mesh(box(.6,.9,.35), new THREE.MeshLambertMaterial({color:0x4a5a3a}));
  body.position.y = 1.15; g.add(body);
  const head = new THREE.Mesh(box(.35,.35,.35), new THREE.MeshLambertMaterial({color:0xc8a071}));
  head.position.y = 1.8; g.add(head);
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,.08,8), new THREE.MeshLambertMaterial({color:0x3a2a18}));
  hat.position.y = 2.0; g.add(hat);
  [-.42,.42].forEach(x=>{
    const l = new THREE.Mesh(box(.2,.7,.2), new THREE.MeshLambertMaterial({color:0x33291b}));
    l.position.set(x*.5,.35,0); g.add(l);
  });
  const rifle = new THREE.Mesh(box(.1,1.3,.1), MAT.dwood);
  rifle.position.set(.4,1.2,0); rifle.rotation.z=-.25; g.add(rifle);
  return g;
}
import { ITEMS, WEAPONS } from '../core/Constants.js';
export const ITNAME = id => ITEMS[id]?.n || id;
export const WNAME  = id => WEAPONS[id]?.n || id;
