// === src/entities/Vampire.js ===
import * as THREE from 'three';

// Vampire: chỉ ban đêm, có thể teleport ngắn, yếu với lửa/đèn
export class Vampire {
  constructor(game, pos = null) {
    this.game = game;
    this.scene = game.scene.scene;
    this.maxHP = 60; this.hp = 60;
    this.speed = 3.5;
    this.damage = 15;
    this.attackCD = 0;
    this.teleportCD = 5;
    this._build();
    if (pos) this.mesh.position.copy(pos);
    this.scene.add(this.mesh);
    game.addEnemy(this);
  }

  _build() {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x2a1a3a, roughness: 0.7 });
    const cape = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.8, 6), mat);
    cape.position.y = 1.0; cape.castShadow = true;
    g.add(cape);
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.7, 4, 6), mat);
    body.position.y = 1.1; g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xd0c0c0, roughness: 0.5 }));
    head.position.y = 1.7; g.add(head);
    // Red eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 5), eyeMat);
    eyeL.position.set(-0.08, 1.72, 0.18); g.add(eyeL);
    const eyeR = eyeL.clone(); eyeR.position.x = 0.08; g.add(eyeR);
    this.mesh = g;
  }

  update(dt) {
    if (this.hp <= 0) return;
    // Only active at night
    if (this.game.dayNight.isDay) {
      // Burn in daylight
      this.hp -= 8 * dt;
      if (this.hp <= 0) { this.die(); return; }
    }

    const target = this.game.player.mesh.position;
    const dir = target.clone().sub(this.mesh.position);
    dir.y = 0;
    const dist = dir.length();
    dir.normalize();

    // Teleport when far
    this.teleportCD -= dt;
    if (dist > 8 && this.teleportCD <= 0) {
      this.teleportCD = 6 + Math.random() * 3;
      const angle = Math.random() * Math.PI * 2;
      this.mesh.position.x = target.x + Math.cos(angle) * 4;
      this.mesh.position.z = target.z + Math.sin(angle) * 4;
      this.game.audio.shriek();
      this.game.notify.show('Vampire teleported!', 1500, 'warn');
      return;
    }

    if (dist > 1.3) {
      this.mesh.position.addScaledVector(dir, this.speed * dt);
      this.mesh.rotation.y = Math.atan2(dir.x, dir.z);
    } else {
      this.attackCD -= dt;
      if (this.attackCD <= 0) {
        this.attackCD = 1.2;
        this.game.player.takeDamage(this.damage);
      }
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) this.die();
  }

  die() {
    this.game.totalKills++;
    this.game.money += 5;
    this.destroy();
  }

  destroy() {
    this.scene.remove(this.mesh);
    this.game.removeEnemy(this);
  }
}
