// ==========================================================
//  EntityManager + enemies/* + passive/* + Corpse + ObjectPool
// ==========================================================
import * as THREE from 'three';
import { G } from '../core/Game.js';
import { MOBS, CFG, ITEMS } from '../core/Constants.js';
import { MAT, ITNAME } from '../world/World.js';
import { Audio } from '../core/Assets.js';

const box = (w,h,d)=>new THREE.BoxGeometry(w,h,d);
const V = (x,y,z)=>new THREE.Vector3(x,y,z);

const SKIN = {
  zombie:0x6f8f5a, runner:0x8f8f4a, banker:0x5a6f8f, outlaw:0xc8a071,
  vampire:0xdcdcdc, werewolf:0x4a3a2a, wolf:0x6b6b6b, prescott:0xc8a071,
  horse:0x6b4a2a, unicorn:0xf2f0ea,
};

// ---------------- mesh builders ----------------
function humanoid(kind){
  const g = new THREE.Group();
  const skin = new THREE.MeshLambertMaterial({color:SKIN[kind]||0x888888});
  const cloth = new THREE.MeshLambertMaterial({
    color: kind==='outlaw'?0x6b4a2a : kind==='vampire'?0x22111a :
           kind==='banker'?0x2a2a3a : kind==='prescott'?0x2f4a2f : 0x4a5540});
  const torso = new THREE.Mesh(box(.7,1.0,.4), cloth); torso.position.y=1.25; g.add(torso);
  const head  = new THREE.Mesh(box(.42,.42,.42), skin); head.position.y=1.95; g.add(head);
  const armL = new THREE.Mesh(box(.2,.85,.2), skin); armL.position.set(-.47,1.35,0);
  const armR = armL.clone(); armR.position.x=.47; g.add(armL,armR);
  const legL = new THREE.Mesh(box(.24,.78,.24), cloth); legL.position.set(-.19,.39,0);
  const legR = legL.clone(); legR.position.x=.19; g.add(legL,legR);
  if(kind==='outlaw'||kind==='prescott'||kind==='banker'){
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.09,8),
      new THREE.MeshLambertMaterial({color:0x2a1e12}));
    hat.position.y=2.2; g.add(hat);
    const gun = new THREE.Mesh(box(.09,.8,.09), MAT.dwood);
    gun.position.set(.55,1.4,.25); gun.rotation.x=-1.4; g.add(gun);
  }
  if(kind==='vampire'){
    const cape = new THREE.Mesh(box(.9,1.2,.1), new THREE.MeshLambertMaterial({color:0x6a0f1a}));
    cape.position.set(0,1.25,-.28); g.add(cape);
  }
  if(kind==='zombie'||kind==='runner'||kind==='banker'){ armL.rotation.x=-1.3; armR.rotation.x=-1.3; }
  g.userData.anim = {legL, legR, armL, armR, head};
  return g;
}
function quadruped(kind){
  const g = new THREE.Group();
  const c = new THREE.MeshLambertMaterial({color:SKIN[kind]||0x777777});
  const big = (kind==='horse'||kind==='unicorn');
  const s = big?1.15:(kind==='werewolf'?1.5:1);
  const body = new THREE.Mesh(box(1.6*s,.8*s,.7*s), c); body.position.y=1.0*s; g.add(body);
  const neck = new THREE.Mesh(box(.4*s,.9*s,.4*s), c);
  neck.position.set(.8*s,1.4*s,0); neck.rotation.z=-.35; g.add(neck);
  const head = new THREE.Mesh(box(.7*s,.42*s,.4*s), c); head.position.set(1.2*s,1.8*s,0); g.add(head);
  const legs = [];
  [[-.6,-.28],[-.6,.28],[.6,-.28],[.6,.28]].forEach(([x,z])=>{
    const l = new THREE.Mesh(box(.2*s,1.0*s,.2*s), c);
    l.position.set(x*s,.5*s,z*s); g.add(l); legs.push(l);
  });
  if(kind==='unicorn'){
    const horn = new THREE.Mesh(new THREE.ConeGeometry(.09,.7,6), MAT.gold);
    horn.position.set(1.35*s,2.25*s,0); horn.rotation.z=-.3; g.add(horn);
    const glow = new THREE.PointLight(0xffe08a,.8,10); glow.position.y=2*s; g.add(glow);
  }
  if(kind==='werewolf'){
    const eyes = new THREE.Mesh(box(.5,.1,.05), new THREE.MeshBasicMaterial({color:0xff2200}));
    eyes.position.set(1.4*s,1.85*s,.2*s); g.add(eyes);
  }
  g.userData.anim = {legL:legs[0], legR:legs[2], armL:legs[1], armR:legs[3], head};
  return g;
}

// ---------------- BaseEnemy ----------------
class Entity{
  constructor(kind, x, z, loc){
    const d = MOBS[kind];
    this.kind = kind; this.def = d; this.loc = loc;
    this.hp = d.hp; this.maxHp = d.hp; this.dmg = d.dmg; this.speed = d.spd;
    this.pos = V(x, 0, z);
    this.vel = V();
    this.dead = false; this.atkCd = 0; this.tick = 0;
    this.mesh = (kind==='wolf'||kind==='werewolf'||kind==='horse'||kind==='unicorn')
      ? quadruped(kind) : humanoid(kind);
    this.mesh.position.copy(this.pos);
    this.h = d.h || 1.8;
    this.r = kind==='werewolf' ? 1.1 : .55;
    G.scene.add(this.mesh);
    if(G.isNight && !d.passive){ this.hp *= 1.25; this.maxHp = this.hp; this.dmg *= 1.2; }
  }
  center(){ return V(this.pos.x, this.pos.y + this.h*.5, this.pos.z); }
  head(){ return V(this.pos.x, this.pos.y + this.h*.92, this.pos.z); }
  face(tx, tz){
    this.mesh.rotation.y = Math.atan2(tx-this.pos.x, tz-this.pos.z) + (this.def.passive||this.kind==='wolf'||this.kind==='werewolf' ? -Math.PI/2 : 0);
  }
  animate(dt, moving){
    const a = this.mesh.userData.anim; if(!a) return;
    if(moving){
      this.tick += dt * this.speed * 1.9;
      const s = Math.sin(this.tick);
      a.legL.rotation.x = s*.7; a.legR.rotation.x = -s*.7;
      if(this.kind!=='zombie'&&this.kind!=='runner'&&this.kind!=='banker'){
        a.armL.rotation.x = -s*.5; a.armR.rotation.x = s*.5;
      }
    }
  }
  hurt(n, crit){
    if(this.dead) return;
    this.hp -= n;
    G.ui.damageNumber(this.head(), Math.round(n), crit);
    Audio.hit();
    this.mesh.traverse(o=>{ if(o.isMesh && o.material.emissive){ o.material.emissive.setHex(0x660000); } });
    setTimeout(()=>{ if(this.mesh) this.mesh.traverse(o=>{ if(o.isMesh && o.material.emissive) o.material.emissive.setHex(0x000000); }); }, 70);
    if(this.hp <= 0) this.die();
  }
  die(){
    if(this.dead) return;
    this.dead = true;
    G.kills++;
    if(this.dropCode){
      G.player.vaultCodes.add(this.dropCode.code);
      G.ui.notify(`🔑 Mã két: ${this.dropCode.code}`,'good');
    }
    if(this.dropKey){
      G.player.add('supply_key',1);
      G.ui.notify('🗝 Nhận Supply Depot Key!','good');
    }
    G.entities.makeCorpse(this);
    Audio.growl();
  }
}

// ---------------- EntityManager ----------------
export class EntityManager{
  constructor(scene){
    this.scene = scene;
    this.enemies = []; this.passives = []; this.corpses = [];
    this.projectiles = []; this.tracers = []; this.fx = [];
    this.spawnT = 0; this.ambushT = 40;
    this.tamed = [];
  }
  spawnEnemy(kind, x, z, loc=null){
    if(this.enemies.length >= CFG.MAX_ENEMIES) return null;
    const e = new Entity(kind, x, z, loc);
    this.enemies.push(e); return e;
  }
  spawnPassive(kind, x, z, loc=null){
    const e = new Entity(kind, x, z, loc);
    e.flee = 0;
    this.passives.push(e); return e;
  }
  removeByLoc(loc){
    const kill = a => a.filter(e=>{
      if(e.loc===loc && !e.important){ this.scene.remove(e.mesh); return false; }
      return true;
    });
    this.enemies = kill(this.enemies);
    this.passives = kill(this.passives);
    this.corpses = this.corpses.filter(c=>{
      if(c.loc===loc){ this.scene.remove(c.mesh); return false; }
      return true;
    });
  }
  makeCorpse(e){
    const m = e.mesh;
    m.rotation.x = -Math.PI/2.1;
    m.position.y = .25;
    const id = e.def.corpse;
    const c = {mesh:m, id, pos:e.pos.clone(), loc:e.loc, t:0};
    this.corpses.push(c);
    if(this.corpses.length > 26){
      const old = this.corpses.shift(); this.scene.remove(old.mesh);
    }
  }
  // ---------- WaveSpawner.js ----------
  updateSpawner(dt){
    const px = G.train.x, km = px/1000;
    this.spawnT -= dt;
    let rate = 7.5 - Math.min(4.5, km*0.055);
    if(G.isNight) rate *= .5;
    if(G.moon==='full' || G.moon==='blood') rate *= .6;
    if(this.spawnT <= 0){
      this.spawnT = rate + Math.random()*rate;
      if(this.enemies.length < CFG.MAX_ENEMIES) this.spawnWave(km);
    }
    // ambush outlaw
    this.ambushT -= dt;
    if(this.ambushT <= 0 && km > 12){
      this.ambushT = 90 + Math.random()*120;
      if(Math.random() < .55){
        G.ui.notify('🐎 PHỤC KÍCH! Băng cướp đang đuổi theo tàu!','bad');
        for(let i=0;i<3+Math.floor(Math.random()*3);i++){
          const o = this.spawnEnemy('outlaw', G.train.x - 30 + Math.random()*20,
            (Math.random()>.5?1:-1)*(12+Math.random()*8));
          if(o){ o.mounted = true; o.speed = 6.5; }
        }
      }
    }
  }
  spawnWave(km){
    const ahead = G.train.x + 60 + Math.random()*120;
    const side  = (Math.random()>.5?1:-1) * (14 + Math.random()*45);
    const r = Math.random();
    let kind = 'zombie';
    if(G.moon==='full' && r < .35) kind = 'werewolf';
    else if(G.moon==='blood' && r < .4) kind = 'vampire';
    else if(r < .1 + km*0.004) kind = 'outlaw';
    else if(r < .35) kind = 'runner';
    else if(r < .45) kind = 'wolf';
    const n = kind==='wolf' ? 1+Math.floor(Math.random()*6)
            : kind==='werewolf' ? 1+Math.floor(Math.random()*2)
            : 1+Math.floor(Math.random()*4);
    for(let i=0;i<n;i++)
      this.spawnEnemy(kind, ahead + Math.random()*14, side + Math.random()*10 - 5);
    if(Math.random() < .16) this.spawnPassive(Math.random()<.12?'unicorn':'horse',
      ahead + 20, side*1.4);
  }

  update(dt){
    const P = G.player, T = G.train;
    this.updateSpawner(dt);

    for(let i=this.enemies.length-1;i>=0;i--){
      const e = this.enemies[i];
      if(e.dead){ this.enemies.splice(i,1); continue; }
      const dToTrain = Math.abs(e.pos.x - T.x);
      if(dToTrain > 420 && e.pos.distanceTo(P.pos) > 420){
        this.scene.remove(e.mesh); this.enemies.splice(i,1); continue;
      }
      this.updateEnemy(e, dt);
    }
    for(const p of this.passives) this.updatePassive(p, dt);
    this.passives = this.passives.filter(p=>{
      if(p.dead){ return false; }
      if(Math.abs(p.pos.x - T.x) > 400){ this.scene.remove(p.mesh); return false; }
      return true;
    });
    this.updateProjectiles(dt);
    this.updateFX(dt);
    // turret (Maxim)
    for(const t of G.world.turrets) this.updateTurret(t, dt);
  }

  // ---------- EnemyAI.js ----------
  updateEnemy(e, dt){
    const P = G.player, T = G.train;
    // vùng thánh
    for(const z of G.world.holyZones){
      if(e.def.undead || e.kind==='werewolf'){
        if(e.pos.distanceTo(z.pos) < z.r){
          e.hurt(26*dt, false);
          if(e.dead) return;
        }
      }
    }
    // zombie né nhà thờ
    const avoidChurch = e.def.undead && G.world.inChurch(e.pos);

    // chọn mục tiêu
    let target = null, tp = null;
    const dp = e.pos.distanceTo(P.pos);
    const lure = G.world.lures[0];
    if(lure && e.def.undead && e.pos.distanceTo(lure.pos) < 70){ tp = lure.pos; }
    else if(dp < e.def.detect || e.aggro){ tp = P.pos; target = 'player'; e.aggro = true; }
    else {
      const dt2 = Math.hypot(e.pos.x - T.x, e.pos.z);
      if(dt2 < e.def.detect + 20){ tp = new THREE.Vector3(T.x - 4, 0, 0); target = 'train'; }
    }
    if(!tp){
      // lang thang về phía tàu
      tp = new THREE.Vector3(T.x, 0, 0);
    }

    const dir = new THREE.Vector3(tp.x - e.pos.x, 0, tp.z - e.pos.z);
    const dist = dir.length();
    dir.normalize();
    if(avoidChurch) dir.negate();

    // vampire teleport
    if(e.kind==='vampire'){
      e.tpCd = (e.tpCd ?? 3) - dt;
      if(e.tpCd <= 0 && dist > 12 && dist < 60){
        e.tpCd = 5 + Math.random()*3;
        e.pos.x = tp.x - dir.x*4; e.pos.z = tp.z - dir.z*4;
        this.spawnFX(e.pos, 0x6a0f1a, 2);
      }
    }
    // outlaw bắn
    if(e.def.ranged && dist < 45 && target==='player'){
      e.fireCd = (e.fireCd ?? 1.5) - dt;
      if(dist > 8) { /* giữ khoảng cách */ }
      if(e.fireCd <= 0){
        e.fireCd = e.isBoss ? .8 : 1.6 + Math.random();
        const acc = Math.max(.15, 1 - dist/60);
        this.tracer(e.head(), P.eyePos(), 0xffaa33);
        Audio.shot('rifle');
        if(Math.random() < acc*.55) P.hurt(e.dmg);
      }
    }
    const speed = e.speed * (e.mounted?1.6:1) * (G.isNight?1.12:1);
    if(dist > (target==='train' ? 5 : 1.5)){
      e.pos.x += dir.x * speed * dt;
      e.pos.z += dir.z * speed * dt;
      e.animate(dt, true);
    }
    // đụng tường
    if(e.pos.distanceTo(G.player.pos) < 70) resolveCollision(e.pos, e.r);
    e.face(tp.x, tp.z);
    e.mesh.position.copy(e.pos);

    // tấn công
    e.atkCd -= dt;
    if(e.atkCd <= 0){
      if(dp < 2.2 + e.r){
        e.atkCd = 1.1; P.hurt(e.dmg);
        const a = e.mesh.userData.anim;
        if(a){ a.armL.rotation.x = -2; setTimeout(()=>{ if(a.armL) a.armL.rotation.x = -1.3; },150); }
      } else if(Math.abs(e.pos.x - T.x) < 22 && Math.abs(e.pos.z) < 4.2){
        e.atkCd = 1.4; T.damage(e.dmg * .8);
        this.spawnFX(V(e.pos.x, 2, e.pos.z*.6), 0xffaa00, .8);
      }
    }
  }
  updatePassive(p, dt){
    if(p.rider) { // đang bị cưỡi
      p.pos.copy(G.player.pos); p.pos.y = 0;
      p.mesh.position.copy(p.pos);
      p.mesh.rotation.y = -G.player.yaw - Math.PI/2;
      p.mesh.visible = true;
      return;
    }
    const dp = p.pos.distanceTo(G.player.pos);
    if(dp < 12){
      const d = new THREE.Vector3().subVectors(p.pos, G.player.pos).setY(0).normalize();
      p.pos.addScaledVector(d, p.speed*dt*.8);
      p.animate(dt, true);
      p.face(p.pos.x + d.x, p.pos.z + d.z);
    } else {
      p.wander = (p.wander ?? 0) - dt;
      if(p.wander <= 0){ p.wander = 3+Math.random()*4; p.wdir = Math.random()*Math.PI*2; }
      p.pos.x += Math.cos(p.wdir)*dt*1.2; p.pos.z += Math.sin(p.wdir)*dt*1.2;
      p.animate(dt, true);
      p.face(p.pos.x+Math.cos(p.wdir), p.pos.z+Math.sin(p.wdir));
    }
    p.mesh.position.copy(p.pos);
  }

  // ---------- projectiles / FX ----------
  throwItem(kind, origin, dir){
    const mat = kind==='dynamite'
      ? new THREE.MeshLambertMaterial({color:0xb03020})
      : new THREE.MeshLambertMaterial({color:0x9fd8ff, emissive:0x224466});
    const m = new THREE.Mesh(kind==='dynamite'? box(.2,.5,.2) : new THREE.SphereGeometry(.22,8,8), mat);
    m.position.copy(origin); this.scene.add(m);
    this.projectiles.push({kind, mesh:m, vel:dir.clone().multiplyScalar(22).add(V(0,5,0)), t:0});
    if(kind==='dynamite') Audio.melee();
  }
  updateProjectiles(dt){
    for(let i=this.projectiles.length-1;i>=0;i--){
      const p = this.projectiles[i];
      p.t += dt;
      p.vel.y -= CFG.GRAVITY*dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += dt*6;
      const grounded = p.mesh.position.y <= .2;
      if(grounded){ p.mesh.position.y = .2; p.vel.set(0,0,0); }
      const hitEnemy = this.enemies.find(e=>e.pos.distanceTo(p.mesh.position) < 1.6);
      if(p.kind==='holy_water' && (grounded || hitEnemy)){
        this.holyStrike(p.mesh.position.clone());
        this.scene.remove(p.mesh); this.projectiles.splice(i,1); continue;
      }
      if(p.kind==='dynamite' && p.t >= 3){
        this.explode(p.mesh.position.clone(), 9, 200);
        this.scene.remove(p.mesh); this.projectiles.splice(i,1); continue;
      }
    }
  }
  explode(pos, radius, dmg){
    Audio.explosion();
    this.spawnFX(pos, 0xff8800, radius*.7);
    for(const e of [...this.enemies]){
      const d = e.pos.distanceTo(pos);
      if(d < radius) e.hurt(dmg * (1 - d/radius), true);
    }
    for(const p of [...this.passives]){
      const d = p.pos.distanceTo(pos);
      if(d < radius){ p.hp -= dmg*(1-d/radius); if(p.hp<=0){ p.dead=true; this.makeCorpse(p); } }
    }
    const dpl = G.player.pos.distanceTo(pos);
    if(dpl < radius) G.player.hurt(dmg*.5*(1-dpl/radius));
    if(Math.abs(G.train.x - pos.x) < radius && Math.abs(pos.z) < 4) G.train.damage(dmg*.25);
  }
  holyStrike(pos){
    Audio.thunder();
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(.35,.1,60,6),
      new THREE.MeshBasicMaterial({color:0xffffcc}));
    bolt.position.set(pos.x, 30, pos.z); this.scene.add(bolt);
    const light = new THREE.PointLight(0xffffcc, 8, 60);
    light.position.set(pos.x, 6, pos.z); this.scene.add(light);
    this.fx.push({obj:bolt, t:.35, kind:'fade'}, {obj:light, t:.35, kind:'light'});
    for(const e of [...this.enemies]){
      const d = e.pos.distanceTo(pos);
      if(d < 7.5) e.hurt((e.def.undead||e.kind==='werewolf') ? 200 : 70, true);
    }
  }
  spawnFX(pos, color, size){
    const m = new THREE.Mesh(new THREE.SphereGeometry(size,10,10),
      new THREE.MeshBasicMaterial({color, transparent:true, opacity:.9}));
    m.position.copy(pos); this.scene.add(m);
    this.fx.push({obj:m, t:.4, kind:'boom'});
    const l = new THREE.PointLight(color, 5, size*8);
    l.position.copy(pos); this.scene.add(l);
    this.fx.push({obj:l, t:.4, kind:'light'});
  }
  tracer(a, b, color=0xffee88){
    const g = new THREE.BufferGeometry().setFromPoints([a,b]);
    const l = new THREE.Line(g, new THREE.LineBasicMaterial({color, transparent:true, opacity:.85}));
    this.scene.add(l);
    this.fx.push({obj:l, t:.06, kind:'fade'});
  }
  updateFX(dt){
    for(let i=this.fx.length-1;i>=0;i--){
      const f = this.fx[i]; f.t -= dt;
      if(f.kind==='boom'){ f.obj.scale.multiplyScalar(1+dt*4); f.obj.material.opacity = Math.max(0,f.t*2.2); }
      if(f.kind==='fade' && f.obj.material) f.obj.material.opacity = Math.max(0, f.t*8);
      if(f.kind==='light') f.obj.intensity = Math.max(0, f.t*14);
      if(f.t <= 0){ this.scene.remove(f.obj); f.obj.geometry?.dispose?.(); this.fx.splice(i,1); }
    }
  }
  // ---------- Maxim turret ----------
  deployTurret(pos){
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.35,.5,.5,8), MAT.metal);
    base.position.y=.25; g.add(base);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,1.6,8), MAT.metal);
    barrel.rotation.z = Math.PI/2; barrel.position.set(.7,.85,0);
    const head = new THREE.Group(); head.position.y=.5;
    const bodyM = new THREE.Mesh(box(.5,.4,.4), MAT.dwood); bodyM.position.y=.35; head.add(bodyM, barrel);
    g.add(head);
    g.position.copy(pos); g.position.y = pos.y;
    this.scene.add(g);
    const onTrain = G.train.onDeck(pos);
    const t = {group:g, head, pos:pos.clone(), ammo:200, cd:0,
               onTrain, localX: pos.x - G.train.x};
    G.world.turrets.push(t);
    G.ui.notify('🔫 Maxim Gun đã đặt (200 viên). E để thu hồi.');
    return t;
  }
  updateTurret(t, dt){
    if(t.onTrain){ t.pos.x = G.train.x + t.localX; t.group.position.x = t.pos.x; }
    t.cd -= dt;
    let best = null, bd = 1e9;
    for(const e of this.enemies){
      const d = e.pos.distanceTo(t.pos);
      if(d < 70 && d < bd){ bd = d; best = e; }
    }
    if(best){
      t.head.rotation.y = Math.atan2(best.pos.x - t.pos.x, best.pos.z - t.pos.z) - Math.PI/2;
      if(t.cd <= 0 && t.ammo > 0){
        t.cd = 60/520;
        t.ammo--;
        this.tracer(V(t.pos.x, t.pos.y+.9, t.pos.z), best.center(), 0xffcc55);
        Audio.shot('maxim');
        best.hurt(22, false);
      }
    }
  }
}

// va chạm dùng chung
export function resolveCollision(pos, radius){
  const boxes = G.world.nearbyColliders(pos.x, pos.z, radius+1);
  for(const b of boxes){
    if(pos.y > b.max.y - .15) continue;
    if(pos.y + 1.6 < b.min.y) continue;
    const cx = Math.max(b.min.x, Math.min(pos.x, b.max.x));
    const cz = Math.max(b.min.z, Math.min(pos.z, b.max.z));
    const dx = pos.x - cx, dz = pos.z - cz;
    const d2 = dx*dx + dz*dz;
    if(d2 < radius*radius){
      const d = Math.sqrt(d2) || .0001;
      if(d2 < 1e-6){
        pos.x += (pos.x > (b.min.x+b.max.x)/2 ? radius : -radius);
      } else {
        pos.x += dx/d * (radius - d);
        pos.z += dz/d * (radius - d);
      }
    }
  }
}
