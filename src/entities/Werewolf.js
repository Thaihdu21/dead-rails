// === src/entities/Werewolf.js ===
import * as THREE from 'three';

// Werewolf: rất nhanh, sát thương cao, ban đêm
export class Werewolf {
  constructor(game, pos = null) {
    this.game = game;
    this.scene = game.scene.scene;
    this.maxHP = 80; this.hp = 80;
    this.speed = 5.5;
    this.damage = 22;
    this.attackCD = 0;
    this._build();
    if (pos) this.mesh.position.copy(pos);
    this.scene.add(this.mesh);
    game.addEnemy(this);
  }

  _build() {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 1 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.9, 4, 6), mat);
    body.position.y = 1.0; body.castShadow = true;
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 1 }));
    head.position.y = 1.7; head.scale.z = 1.4;
    g.add(head);
    // Snout
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 6), mat);
    snout.rotation.x = Math.PI / 2; snout.position.set(0, 1.65, 0.35);
    g.add(snout);
    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), eyeMat);
    eyeL.position.set(-0.12, 1.75, 0.25); g.add(eyeL);
    const eyeR = eyeL.clone(); eyeR.position.x = 0.12; g.add(eyeR);
    // Legs (4-legged stance)
    const legMat = mat;
    const fl = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.5, 4, 6), legMat);
    fl.position.set(-0.25, 0.3, 0.25); g.add(fl);
    const fr = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.5, 4, 6), legMat);
    fr.position.set(0.25, 0.3, 0.25); g.add(fr);
    const bl = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.5, 4, 6), legMat);
    bl.position.set(-0.25, 0.3, -0.25); g.add(bl);
    const br = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.5, 4, 6), legMat);
    br.position.set(0.25, 0.3, -0.25); g.add(br);
    this.legs = [fl, fr, bl, br];
    this.mesh = g;
  }

  update(dt) {
    if (this.hp <= 0) return;
    const target = this.game.player.mesh.position;
    const dir = target.clone().sub(this.mesh.position);
    dir.y = 0;
    const dist = dir.length();
    dir.normalize();

    // Dash: occasional speed burst
    let curSpeed = this.speed;
    if (Math.sin(performance.now() * 0.001) > 0.5) curSpeed *= 1.4;

    if (dist > 1.5) {
      this.mesh.position.addScaledVector(dir, curSpeed * dt);
      this.mesh.rotation.y = Math.atan2(dir.x, dir.z);
      // Leg anim
      const t = performance.now() * 0.018;
      this.legs[0].rotation.x = Math.sin(t) * 0.6;
      this.legs[1].rotation.x = -Math.sin(t) * 0.6;
      this.legs[2].rotation.x = -Math.sin(t) * 0.6;
      this.legs[3].rotation.x = Math.sin(t) * 0.6;
    } else {
      this.attackCD -= dt;
      if (this.attackCD <= 0) {
        this.attackCD = 0.9;
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
    this.game.money += 8;
    this.destroy();
  }

  destroy() {
    this.scene.remove(this.mesh);
    this.game.removeEnemy(this);
  }
}
