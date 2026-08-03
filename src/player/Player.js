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
      G.ui.notify(u==='dynamite' ? '🧨 Ném dynamite — nổ sau 3 giây!' : '💧 Ném nước thánh!');
    }
    else if(u==='crucifix'){
      this.remove(u,1);
      G.world.addHolyZone(ground);
      G.ui.notify('✝ Đặt Crucifix — vùng thiêng bán kính 8m','good');
    }
    else if(u==='banjo'){
      this.remove(u,1); Audio.banjo();
      G.world.lures.push({pos:ground.clone(), t:20});
      const m = new THREE.Mesh(new THREE.BoxGeometry(.3,.7,.12),
        new THREE.MeshLambertMaterial({color:0xb0803a}));
      m.position.copy(ground); m.position.y=.4; G.scene.add(m);
      setTimeout(()=>G.scene.remove(m), 20000);
      G.ui.notify('🪕 Banjo vang lên — zombie bị hút về đó!','good');
    }
    else if(u==='newspaper'){
      if(Math.abs(this.pos.x - G.train.x) > 26){ Audio.deny(); G.ui.notify('Phải đứng gần tàu!','bad'); return; }
      this.remove(u,1); G.train.addArmor();
      G.ui.notify('📰 Dán giáp giấy lên tàu (chặn 1 đòn)','good');
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
