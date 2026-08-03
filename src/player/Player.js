// ============ player/Player.js + PlayerCombat.js + Inventory.js ============
import * as THREE from 'three';
import { G } from '../core/Game.js';
import { CFG, ITEMS, WEAPONS, WEAPON_ORDER, UTILITY_ORDER } from '../core/Constants.js';
import { Audio } from '../core/Assets.js';
import { resolveCollision } from '../entities/Entities.js';
import { ITNAME } from '../world/World.js';

const V = (x,y,z)=>new THREE.Vector3(x,y,z);

export class Player{
  constructor(){
    this.pos = V(-6, 0, 8);
    this.vel = V();
    this.yaw = Math.PI/2; this.pitch = 0;
    this.hp = CFG.PLAYER_HP; this.maxHp = CFG.PLAYER_HP;
    this.money = CFG.START_MONEY;
    this.inv = { newspaper: 2 + Math.floor(Math.random()*2), coal: 2, bandage: 1 };
    this.ammo = { ammo_revolver: 0, ammo_rifle: 0, ammo_shotgun: 0, ammo_maxim: 0 };
    this.weapons = ['knife'];
    this.wi = 0;
    this.mag = {};
    this.fireCd = 0;
    this.onGround = true;
    this.onTrain = false;
    this.mount = null;
    this.utility = 'newspaper';
    this.vaultCodes = new Set();
    this.torchLight = new THREE.PointLight(0xff9944, 0, 14);
    G.scene.add(this.torchLight);
    this.hurtCd = 0;
  }
  // ---------- Inventory ----------
  add(id, n=1){
    if(ITEMS[id]?.ammo){ this.ammo[id] = (this.ammo[id]||0) + ITEMS[id].ammo*n; return; }
    this.inv[id] = (this.inv[id]||0) + n;
  }
  remove(id, n=1){ if(!this.inv[id]) return false;
    this.inv[id] -= n; if(this.inv[id] <= 0) delete this.inv[id]; return true; }
  has(id, n=1){ return (this.inv[id]||0) >= n; }
  giveWeapon(w){
    if(!this.weapons.includes(w)){
      this.weapons.push(w);
      this.weapons.sort((a,b)=>WEAPON_ORDER.indexOf(a)-WEAPON_ORDER.indexOf(b));
      G.ui.notify('🔫 Nhận vũ khí: ' + WEAPONS[w].n, 'good');
    }
    const def = WEAPONS[w];
    if(def.ammo){ this.ammo[def.ammo] = (this.ammo[def.ammo]||0) + def.mag; this.mag[w] = def.mag; }
  }
  weapon(){ return WEAPONS[this.weapons[this.wi]] ; }
  weaponId(){ return this.weapons[this.wi]; }
  eyePos(){ return V(this.pos.x, this.pos.y + CFG.EYE + (this.mount?1.1:0), this.pos.z); }

  hurt(n){
    if(this.hurtCd > 0 || G.state!=='PLAYING') return;
    this.hurtCd = .35;
    this.hp -= n;
    Audio.hurt();
    G.ui.flashDamage();
    if(this.hp <= 0){ this.hp = 0; G.ui.gameover('Bạn gục ngã dưới ánh trăng miền Tây.'); }
  }
  heal(){
    const id = this.has('bandage') ? 'bandage' : (this.has('snake_oil') ? 'snake_oil' : null);
    if(!id){ Audio.deny(); G.ui.notify('Không còn thuốc!','bad'); return; }
    if(this.hp >= this.maxHp){ G.ui.notify('Máu đã đầy'); return; }
    this.remove(id,1);
    this.hp = Math.min(this.maxHp, this.hp + ITEMS[id].heal);
    Audio.pickup(); G.ui.notify(`💊 Dùng ${ITEMS[id].n} (+${ITEMS[id].heal} HP)`,'good');
  }

  // ---------- Update ----------
  update(dt){
    const IN = G.input;
    this.hurtCd -= dt; this.fireCd -= dt;

    // nhìn
    this.yaw   -= IN.mouse.dx * IN.sens;
    this.pitch -= IN.mouse.dy * IN.sens;
    this.pitch = Math.max(-1.5, Math.min(1.5, this.pitch));
    IN.flush();

    // đi theo tàu
    if(this.onTrain) this.pos.x += G.train.deltaX;

    // di chuyển
    const fwd = V(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const right = V(fwd.z, 0, -fwd.x);
    const dir = V();
    if(IN.down('KeyW')) dir.add(fwd);
    if(IN.down('KeyS')) dir.sub(fwd);
    if(IN.down('KeyD')) dir.add(right);
    if(IN.down('KeyA')) dir.sub(right);
    const running = IN.down('ShiftLeft') || IN.down('ShiftRight');
    let spd = this.mount ? CFG.MOUNT_SPEED : (running ? CFG.PLAYER_RUN : CFG.PLAYER_SPEED);
    if(dir.lengthSq() > 0){
      dir.normalize();
      this.pos.x += dir.x * spd * dt;
      this.pos.z += dir.z * spd * dt;
    }
    if(!this.mount) resolveCollision(this.pos, .42);

    // trọng lực / sàn tàu
    const deckArea = G.train.onDeck(this.pos);
    const floorY = deckArea ? CFG.DECK_Y : 0;
    if(IN.hit('Space') && this.onGround){ this.vel.y = CFG.JUMP; this.onGround = false; }
    this.vel.y -= CFG.GRAVITY * dt;
    this.pos.y += this.vel.y * dt;
    if(this.pos.y <= floorY){
      // "ramp" tự động leo lên sàn tàu
      this.pos.y = floorY; this.vel.y = 0; this.onGround = true;
    } else if(deckArea && this.pos.y < floorY){
      this.pos.y = Math.min(floorY, this.pos.y + 6*dt);
    }
    this.onTrain = deckArea && Math.abs(this.pos.y - CFG.DECK_Y) < .3;

    // camera
    G.camera.position.copy(this.eyePos());
    G.camera.rotation.set(this.pitch, this.yaw, 0);

    // torch light
    const isTorch = this.weaponId()==='torch';
    this.torchLight.intensity += ((isTorch?2.2:0) - this.torchLight.intensity)*Math.min(1,dt*6);
    this.torchLight.position.copy(this.eyePos()).addScaledVector(fwd, 1.2);
    if(isTorch){ // đốt zombie chạm phải
      for(const e of G.entities.enemies)
        if(e.pos.distanceTo(this.pos) < 2.2 && e.def.undead) e.hurt(18*dt, false);
    }

    // vũ khí
    for(let i=0;i<6;i++) if(IN.hit('Digit'+(i+1))) this.selectWeapon(i);
    if(IN.hit('KeyR')) this.reload();
    if(IN.hit('KeyH')) this.heal();
    if(IN.hit('KeyQ')) this.cycleUtility();
    if(IN.hit('KeyG')) this.useUtility();
    if(IN.hit('KeyF')) this.feedTrain();
    if(IN.hit('KeyE')) this.interact();

    const w = this.weapon();
    const wantFire = w.melee || w.rpm > 200 ? IN.mouse.down : IN.clicked();
    if(wantFire && this.fireCd <= 0) this.fire();

    // vùng thánh cứu người chơi? (chỉ hiệu ứng hình ảnh)
  }

  selectWeapon(i){
    if(i < this.weapons.length && i !== this.wi){
      this.wi = i; Audio.melee();
    }
  }
  cycleUtility(){
    const owned = UTILITY_ORDER.filter(u=>this.has(u));
    const corpses = Object.keys(this.inv).filter(k=>ITEMS[k]?.corpse);
    const list = [...owned, ...corpses];
    if(!list.length){ this.utility=null; G.ui.notify('Không có vật phẩm nào'); return; }
    const i = list.indexOf(this.utility);
    this.utility = list[(i+1) % list.length];
    G.ui.notify('🎒 Chọn: ' + ITNAME(this.utility));
  }

  // ---------- PlayerCombat.js ----------
  fire(){
    const w = this.weapon(), id = this.weaponId();
    this.fireCd = 60 / (w.rpm || 120);
    const origin = this.eyePos();
    const dir = new THREE.Vector3(0,0,-1).applyEuler(G.camera.rotation);

    if(w.melee){
      Audio.melee();
      const hit = this.raycastEnemies(origin, dir, w.range, .9);
      if(hit){
        hit.e.hurt(w.dmg * (hit.head?1.6:1), hit.head);
        if(w.lifesteal) this.hp = Math.min(this.maxHp, this.hp + w.dmg*w.lifesteal);
        G.ui.hitmark();
      }
      return;
    }
    if(!this.mag[id]) this.mag[id] = 0;
    if(this.mag[id] <= 0){ this.reload(); if(this.mag[id] <= 0){ Audio.deny(); } return; }
    this.mag[id]--;
    Audio.shot(id);
    G.ui.recoil();
    const pellets = w.pellets || 1;
    let any = false;
    for(let i=0;i<pellets;i++){
      const d = dir.clone();
      d.x += (Math.random()-.5)*w.spread*2;
      d.y += (Math.random()-.5)*w.spread*2;
      d.z += (Math.random()-.5)*w.spread*2;
      d.normalize();
      const hit = this.raycastEnemies(origin, d, w.range, .55);
      const end = hit ? hit.point : origin.clone().addScaledVector(d, w.range);
      G.entities.tracer(origin.clone().addScaledVector(d,1.2), end);
      if(hit){
        any = true;
        let dmg = w.dmg;
        if(hit.head){
          dmg = (w.headshotKill && hit.dist < 45) ? 9999 : w.dmg*2.2;
        }
        hit.e.hurt(dmg, hit.head);
      }
    }
    if(any) G.ui.hitmark();
  }
  reload(){
    const id = this.weaponId(), w = this.weapon();
    if(w.melee || !w.ammo) return;
    const have = this.ammo[w.ammo] || 0;
    const cur = this.mag[id] || 0;
    if(!have || cur >= w.mag) return;
    const need = w.mag - cur;
    const take = Math.min(need, have);
    this.mag[id] = cur + take;
    this.ammo[w.ammo] -= take;
    Audio.melee();
  }
  raycastEnemies(origin, dir, range, pad=.55){
    let best = null;
    const all = [...G.entities.enemies, ...G.entities.passives];
    for(const e of all){
      if(e.dead) continue;
      const bodyR = (e.r||.55) + pad;
      const tb = raySphere(origin, dir, e.center(), bodyR);
      const th = raySphere(origin, dir, e.head(), Math.max(.32, bodyR*.45));
      let t = -1, head = false;
      if(th > 0 && (tb < 0 || th <= tb + .6)){ t = th; head = true; }
      else if(tb > 0) t = tb;
      if(t > 0 && t < range && (!best || t < best.dist)){
        best = {e, dist:t, head, point: origin.clone().addScaledVector(dir, t)};
      }
    }
    if(best){
      // che khuất bởi tường
      const ray = new THREE.Ray(origin, dir);
      for(const b of G.world.nearbyColliders(origin.x, origin.z, 60)){
        const p = new THREE.Vector3();
        if(ray.intersectBox(b, p) && origin.distanceTo(p) < best.dist - .5) return null;
      }
    }
    return best;
  }

  // ---------- items ----------
  useUtility(){
    const u = this.utility;
    if(!u || !this.has(u)){ Audio.deny(); return; }
    const dir = new THREE.Vector3(0,0,-1).applyEuler(G.camera.rotation);
    const origin = this.eyePos().addScaledVector(dir, .8);
    const ground = V(this.pos.x + dir.x*2, this.pos.y, this.pos.z + dir.z*2);

    if(u==='dynamite' || u==='holy_water'){
      this.remove(u,1);
      G.entities.throwItem(u, origin, dir);
      G.ui.notify(u==='dynamite' ? '🧨 Ném dynamite — 3 giây!' : '💧 Ném nước thánh!');
    }
    else if(u==='crucifix'){
      this.remove(u,1);
      G.world.addHolyZone(ground);
      G.ui.notify('✝ Đã đặt Crucifix — vùng thiêng bán kính 8m','good');
    }
    else if(u==='banjo'){
      this.remove(u,1);
      Audio.banjo();
      const lure = {pos: ground.clone(), t: 20};
      G.world.lures.push(lure);
      const m = new THREE.Mesh(new THREE.BoxGeometry(.3,.7,.1),
        new THREE.MeshLambertMaterial({color:0xb0803a}));
      m.position.copy(ground); m.position.y = .4; G.scene.add(m);
      setTimeout(()=>G.scene.remove(m), 20000);
      G.ui.notify('🪕 Banjo vang lên — zombie bị hút về đó!','good');
    }
    else if(u==='newspaper'){
      if(Math.abs(this.pos.x - G.train.x) > 26){ Audio.deny(); G.ui.notify('Phải đứng gần tàu!','bad'); return; }
      this.remove(u,1); G.train.addArmor();
      G.ui.notify('📰 Dán giáp giấy lên thành tàu (chặn 1 đòn)','good');
    }
    else if(u==='saddle'){
      const near = G.entities.passives.find(p=>!p.rider && p.pos.distanceTo(this.pos) < 5);
      if(!near){ Audio.deny(); G.ui.notify('Không có Ngựa/Kỳ Lân nào gần đây','bad'); return; }
      this.remove(u,1); this.mountUp(near);
    }
    else if(ITEMS[u]?.corpse){   // thả xác để thuần hóa sói
      this.remove(u,1);
      const wolf = G.entities.enemies.find(e=>e.kind==='wolf' && e.pos.distanceTo(this.pos) < 18);
      if(wolf){
        wolf.dead = true; G.scene.remove(wolf.mesh);
        const pet = G.entities.spawnPassive('wolf', wolf.pos.x, wolf.pos.z);
        pet.tamed = true; pet.speed = 6;
        G.ui.notify('🐺 Đã thuần hóa một con sói!','good');
      } else {
        const m = new THREE.Mesh(new THREE.BoxGeometry(.8,.4,.5),
          new THREE.MeshLambertMaterial({color:0x6f5a4a}));
        m.position.copy(ground); m.position.y=.2; G.scene.add(m);
        setTimeout(()=>G.scene.remove(m), 15000);
        G.ui.notify('Đã thả ' + ITNAME(u) + ' xuống đất');
      }
    }
  }

  mountUp(p){
    this.mount = p; p.rider = true;
    G.ui.notify('🐎 Đang cưỡi ' + p.def.n + ' — E để xuống','good');
  }
  dismount(){
    if(!this.mount) return;
    this.mount.rider = false;
    this.mount.pos.z += 2;
    this.mount = null;
    G.ui.notify('Đã xuống ngựa');
  }

  // ---------- FuelSystem (F) ----------
  feedTrain(){
    if(Math.abs(this.pos.x - G.train.x) > 30){ Audio.deny(); G.ui.notify('Phải đứng gần đầu tàu!','bad'); return; }
    if(G.train.fuel >= 100){ G.ui.notify('Lò đã đầy'); return; }
    const order = ['coal','wood','junk','corpse_horse','corpse_werewolf','corpse_vampire',
                   'corpse_zombie','corpse_outlaw','corpse_wolf','newspaper'];
    const id = order.find(k=>this.has(k));
    if(!id){ Audio.deny(); G.ui.notify('Không có gì để đốt! (than, gỗ, xác...)','bad'); return; }
    this.remove(id,1); G.train.addFuelItem(id);
  }

  // ---------- E ----------
  interact(){
    if(this.mount){ this.dismount(); return; }

    // 1) interactable gần nhất
    let best=null, bd=1e9;
    for(const it of G.world.interactables){
      const p = it.dynamic ? it.dynamic() : it.pos;
      const d = p.distanceTo(this.pos);
      if(d < it.r && d < bd){ bd=d; best=it; }
    }
    if(best){ best.fn(); return; }

    // 2) nhặt xác
    const c = G.entities.corpses.find(c=>c.pos.distanceTo(this.pos) < 3);
    if(c){
      G.entities.corpses.splice(G.entities.corpses.indexOf(c),1);
      G.scene.remove(c.mesh);
      this.add(c.id,1); Audio.pickup();
      G.ui.notify('🧺 Nhặt ' + ITNAME(c.id) + ' (đốt hoặc bán)','good');
      return;
    }
    // 3) thu hồi turret
    const t = G.world.turrets.find(t=>t.pos.distanceTo(this.pos) < 3);
    if(t){
      G.scene.remove(t.group);
      G.world.turrets.splice(G.world.turrets.indexOf(t),1);
      this.giveWeapon('maxim');
      G.ui.notify('🔧 Thu hồi Maxim Gun'); return;
    }
    // 4) đặt Maxim
    if(this.weaponId()==='maxim'){
      const dir = new THREE.Vector3(0,0,-1).applyEuler(G.camera.rotation);
      G.entities.deployTurret(V(this.pos.x+dir.x*2, this.pos.y, this.pos.z+dir.z*2));
      this.weapons.splice(this.wi,1); this.wi = 0;
      return;
    }
    // 5) lên/xuống tàu
    if(Math.abs(this.pos.x - G.train.x) < 26 && Math.abs(this.pos.z) < 7){
      this.pos.set(G.train.x - 2, CFG.DECK_Y + .1, 0);
      this.vel.y = 0;
      G.ui.notify('🚂 Đã lên tàu'); return;
    }
    // 6) throttle khi đứng trong cabin
    if(this.onTrain && this.pos.x > G.train.x + 6){ G.train.cycleThrottle(); return; }
    Audio.deny();
  }
}

function raySphere(o, d, c, r){
  const ox=o.x-c.x, oy=o.y-c.y, oz=o.z-c.z;
  const b = ox*d.x + oy*d.y + oz*d.z;
  const cc = ox*ox+oy*oy+oz*oz - r*r;
  const disc = b*b - cc;
  if(disc < 0) return -1;
  const s = Math.sqrt(disc);
  const t1 = -b - s, t2 = -b + s;
  return t1 > 0 ? t1 : (t2 > 0 ? t2 : -1);
}
