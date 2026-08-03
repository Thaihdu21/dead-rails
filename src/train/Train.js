// ============ train/Train.js + TrainMesh.js + FuelSystem.js + TrainArmor.js ============
import * as THREE from 'three';
import { G } from '../core/Game.js';
import { CFG, ITEMS } from '../core/Constants.js';
import { MAT } from '../world/World.js';
import { Audio } from '../core/Assets.js';

const box = (w,h,d)=>new THREE.BoxGeometry(w,h,d);

export class Train{
  constructor(scene){
    this.x = 0; this.prevX = 0; this.deltaX = 0;
    this.speed = 0; this.throttle = 'normal';
    this.fuel = 100; this.hp = CFG.TRAIN_HP; this.maxHp = CFG.TRAIN_HP;
    this.armor = 0;                 // số tờ newspaper đang gắn
    this.stopTimer = 0;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.build();
    this.armorMeshes = [];
    this.smokeT = 0;
  }
  build(){
    const g = this.group;
    const add=(mat,w,h,d,x,y,z)=>{const m=new THREE.Mesh(box(w,h,d),mat);m.position.set(x,y,z);g.add(m);return m;};
    // sàn (flatcar + tender)
    add(MAT.dwood, 24, .35, 4.2, -3.5, 1.55, 0);
    // bánh
    for(let i=-14;i<=17;i+=3){
      [-1.9,1.9].forEach(z=>{
        const w = new THREE.Mesh(new THREE.CylinderGeometry(.75,.75,.28,12), MAT.metal);
        w.rotation.x = Math.PI/2; w.position.set(i,.75,z); g.add(w);
      });
    }
    // đầu máy
    add(MAT.metal, 11, 2.8, 3.6, 14, 2.4, 0);
    const boiler = new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,10,14), MAT.metal);
    boiler.rotation.z = Math.PI/2; boiler.position.set(14.5,3.0,0); g.add(boiler);
    add(MAT.dwood, 4.4, 3.4, 3.8, 9.6, 3.6, 0);            // cabin
    this.stack = add(MAT.metal, 1.3, 2.4, 1.3, 18.2, 5.0, 0);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.45,10,10),
      new THREE.MeshBasicMaterial({color:0xffdd88}));
    lamp.position.set(20, 3.4, 0); g.add(lamp);
    this.headlight = new THREE.SpotLight(0xffd9a0, 2.2, 90, .5, .4);
    this.headlight.position.set(20,3.4,0);
    this.headlight.target.position.set(70,0,0);
    g.add(this.headlight, this.headlight.target);
    // lò lửa
    this.firebox = add(new THREE.MeshBasicMaterial({color:0xff6600}), .8, 1.1, 1.6, 7.4, 2.3, 0);
    this.fireLight = new THREE.PointLight(0xff6a1a, 1.4, 16);
    this.fireLight.position.set(7,2.3,0); g.add(this.fireLight);
    // tender chở than
    add(MAT.dwood, 6, 1.7, 3.8, 4, 2.5, 0);
    // toa hàng
    add(MAT.dwood, 9, 2.4, 3.8, -9, 2.8, 0);
    [-1.9,1.9].forEach(z=>add(MAT.wood, 22, .9, .2, -4.5, 2.2, z)); // lan can
    // đòn bẩy throttle
    this.lever = add(MAT.gold, .12,.9,.12, 11, 4.2, 1.2);
    // khói
    this.smoke = [];
    for(let i=0;i<12;i++){
      const s = new THREE.Mesh(new THREE.SphereGeometry(.9,6,6),
        new THREE.MeshBasicMaterial({color:0x666666, transparent:true, opacity:0}));
      s.userData.t = i/12; g.add(s); this.smoke.push(s);
    }
  }
  worldPoint(lx, ly, lz){ return new THREE.Vector3(this.x+lx, ly, lz); }
  onDeck(p){
    const lx = p.x - this.x;
    return lx > CFG.DECK_BACK && lx < CFG.DECK_FRONT && Math.abs(p.z) < CFG.DECK_HALF_W;
  }
  addFuelItem(id){
    const it = ITEMS[id];
    if(!it?.fuel) return false;
    this.fuel = Math.min(100, this.fuel + it.fuel);
    Audio.hit();
    G.ui.notify(`🔥 Đốt ${it.n} → +${it.fuel}% nhiên liệu`,'good');
    return true;
  }
  damage(n){
    if(this.armor > 0){
      this.armor--;
      this.updateArmorMesh();
      G.ui.notify('📰 Giáp giấy đỡ 1 đòn! (còn '+this.armor+')');
      return;
    }
    this.hp = Math.max(0, this.hp - n);
    if(this.hp <= 0) G.ui.gameover('Đoàn tàu đã bị phá hủy giữa sa mạc.');
  }
  addArmor(){
    this.armor++;
    this.updateArmorMesh();
  }
  updateArmorMesh(){
    this.armorMeshes.forEach(m=>this.group.remove(m));
    this.armorMeshes = [];
    for(let i=0;i<Math.min(this.armor,10);i++){
      const m = new THREE.Mesh(box(1.4,1.0,.08),
        new THREE.MeshLambertMaterial({color:0xe8e2cf}));
      m.position.set(-13 + i*2.2, 2.6, (i%2?1:-1)*2.02);
      this.group.add(m); this.armorMeshes.push(m);
    }
  }
  cycleThrottle(){
    const o = ['slow','normal','fast'];
    this.throttle = o[(o.indexOf(this.throttle)+1)%3];
    Audio.whistle();
    G.ui.notify('🎚 Throttle: ' + this.throttle.toUpperCase());
  }
  update(dt){
    this.prevX = this.x;
    // dừng checkpoint
    if(this.stopTimer > 0){
      this.stopTimer -= dt; this.speed = 0;
    } else {
      for(const s of G.world.stops){
        if(!s.done && this.x >= s.x - 5){
          s.done = true; this.stopTimer = CFG.CHECKPOINT_STOP;
          Audio.whistle();
          G.ui.notify('🏳 CHECKPOINT — tàu dừng 60 giây. Mua bán ngay!','good');
        }
      }
      const target = this.fuel > 0 ? CFG.TRAIN_SPEED[this.throttle] : 0;
      this.speed += (target - this.speed) * Math.min(1, dt*.35);
      if(this.fuel <= 0 && this.speed < .4) this.speed = 0;
      this.x += this.speed * dt;
      this.fuel = Math.max(0, this.fuel - CFG.FUEL_BURN[this.throttle]*dt*(this.speed>1?1:0));
    }
    this.deltaX = this.x - this.prevX;
    this.group.position.x = this.x;
    Audio.chug(this.speed);

    // hiệu ứng lò + khói
    const f = this.fuel/100;
    this.fireLight.intensity = .4 + f*1.6 + Math.sin(G.time*12)*.15;
    this.firebox.material.color.setHex(f>.1?0xff6600:0x442200);
    this.headlight.visible = G.isNight;
    this.smokeT += dt;
    this.smoke.forEach((s,i)=>{
      let t = (this.smokeT*.5 + i/this.smoke.length) % 1;
      s.position.set(18.2 - t*10*(this.speed/26), 6.2 + t*9, Math.sin(t*7+i)*1.2);
      s.material.opacity = (1-t)*.4*(this.speed>1?1:0.15);
      s.scale.setScalar(.5 + t*3);
    });
    if(this.fuel <= 0 && !this._warned){ this._warned = true; G.ui.notify('⛽ HẾT NHIÊN LIỆU! Nhấn F để đốt lò.','bad'); }
    if(this.fuel > 5) this._warned = false;

    if(this.x >= CFG.TOTAL_DISTANCE) G.ui.victory();
  }
}
