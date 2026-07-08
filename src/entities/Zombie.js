// === src/entities/Zombie.js ===
import * as THREE from 'three';

// Zombie: Walker, Runner, Horde — AI đơn giản đuổi theo player
export class Zombie {
  constructor(game, type = 'walker', pos = null) {
    this.game = game;
    this.type = type;
    this.scene = game.scene.scene;

    const stats = {
      walker: { hp: 40, speed: 1.6, dmg: 8, color: 0x4a6a3a, scale: 1 },
      runner: { hp: 30, speed: 4.0, dmg: 12, color: 0x6a4a3a, scale: 0.95 },
      horde:  { hp: 25, speed: 2.2, dmg: 6, color: 0x3a4a2a, scale: 0.9 }
    };
    const s = stats[type];
    this.maxHP = s.hp; this.hp = s.hp;
    this.speed = s.speed; this.damage = s.dmg; this.color = s.color;
    this.attackCD = 0;

    this._build(s.scale);
    if (pos) this.mesh.position.copy(pos);
    this.scene.add(this.mesh);
    game.addEnemy(this);
  }

  _build(scale) {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: this.color, roughness: 1 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.8, 4, 6), mat);
    body.position.y = 0.9; body.castShadow = true;
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), mat);
    head.position.y = 1.55; head.castShadow = true;
    g.add(head);
    // Arms extended forward
    const armMat = new THREE.MeshStandardMaterial({ color: this.color, roughness: 1 });
    const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.55, 4, 6), armMat);
    armL.position.set(-0.4, 1.1, 0.3); armL.rotation.x = -1.4;
    g.add(armL);
    const armR = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.55, 4, 6), armMat);
    armR.position.set(0.4, 1.1, 0.3); armR.rotation.x = -1.4;
    g.add(armR);
    // Legs
    const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.55, 4, 6), armMat);
    legL.position.set(-0.15, 0.3, 0); g.add(legL);
    const legR = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.55, 4, 6), armMat);
    legR.position.set(0.15, 0.3, 0); g.add(legR);
    this.legL = legL; this.legR = legR;

    // Glowing eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), eyeMat);
    eyeL.position.set(-0.1, 1.6, 0.22);
    g.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), eyeMat);
    eyeR.position.set(0.1, 1.6, 0.22);
    g.add(eyeR);

    g.scale.setScalar(scale);
    this.mesh = g;
  }

  update(dt) {
    if (this.hp <= 0) return;
    const target = this._findTarget();
    if (!target) return;
    const dir = target.clone().sub(this.mesh.position);
    dir.y = 0;
    const dist = dir.length();
    dir.normalize();

    // Move
    if (dist > 1.2) {
      this.mesh.position.addScaledVector(dir, this.speed * dt);
      this.mesh.rotation.y = Math.atan2(dir.x, dir.z);
    } else {
      // Attack
      this.attackCD -= dt;
      if (this.attackCD <= 0) {
        this.attackCD = 1.0;
        this._attack();
      }
    }

    // Walk anim
    if (dist > 1.2) {
      const t = performance.now() * 0.008;
      this.legL.rotation.x = Math.sin(t) * 0.5;
      this.legR.rotation.x = -Math.sin(t) * 0.5;
    }

    // Random groan
    if (Math.random() < dt * 0.1) this.game.audio.groan();
  }

  _findTarget() {
    // Ưu tiên player nếu gần, ngược lại theo tàu
    const p = this.game.player.mesh.position;
    const t = this.game.train.position;
    const dp = this.mesh.position.distanceTo(p);
    const dt2 = this.mesh.position.distanceTo(t);
    if (dp < 15) return p;
    if (dt2 < 30) return t;
    return p;
  }

  _attack() {
    const p = this.game.player.mesh.position;
    const t = this.game.train.position;
    if (this.mesh.position.distanceTo(p) < 1.8) {
      this.game.player.takeDamage(this.damage);
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.game.totalKills++;
    // Drop loot or fuel
    if (Math.random() < 0.4) {
      // Drop scrap (burnable)
      this.game.train.addFuelFromBurnable(5);
    }
    if (Math.random() < 0.2) {
      // Drop ammo
      this.game.inventory.ammoReserve += 2;
    }
    // Bounty for some
    this.game.money += 1;
    this.destroy();
  }

  destroy() {
    this.scene.remove(this.mesh);
    this.game.removeEnemy(this);
  }
}
