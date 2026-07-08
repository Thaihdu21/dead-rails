// === src/entities/Outlaw.js ===
import * as THREE from 'three';

// Outlaw: cưỡi ngựa, dùng súng, có bounty
export class Outlaw {
  constructor(game, pos = null) {
    this.game = game;
    this.scene = game.scene.scene;
    this.maxHP = 70; this.hp = 70;
    this.speed = 4.5;
    this.damage = 12;
    this.attackCD = 0;
    this.bounty = 25;
    this._build();
    if (pos) this.mesh.position.copy(pos);
    this.scene.add(this.mesh);
    game.addEnemy(this);
  }

  _build() {
    const g = new THREE.Group();
    // Horse body
    const horseMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 1 });
    const horseBody = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 1.4), horseMat);
    horseBody.position.y = 1.0; horseBody.castShadow = true;
    g.add(horseBody);
    const horseHead = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.5, 0.4), horseMat);
    horseHead.position.set(0, 1.3, 0.85); g.add(horseHead);
    // 4 legs
    const legPos = [[-0.25, 0.4, 0.5], [0.25, 0.4, 0.5], [-0.25, 0.4, -0.5], [0.25, 0.4, -0.5]];
    this.legs = [];
    for (const p of legPos) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.8, 0.12), horseMat);
      l.position.set(...p); g.add(l); this.legs.push(l);
    }
    // Rider
    const riderMat = new THREE.MeshStandardMaterial({ color: 0x4a2a1a, roughness: 1 });
    const rider = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.8, 4, 6), riderMat);
    rider.position.y = 1.7; rider.castShadow = true;
    g.add(rider);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xc8a878 }));
    head.position.y = 2.3; g.add(head);
    // Hat
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.05, 10),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
    hat.position.y = 2.5; g.add(hat);

    this.mesh = g;
  }

  update(dt) {
    if (this.hp <= 0) return;
    const target = this.game.player.mesh.position;
    const dir = target.clone().sub(this.mesh.position);
    dir.y = 0;
    const dist = dir.length();

    // Maintain distance ~8m, strafe
    if (dist > 10) {
      dir.normalize();
      this.mesh.position.addScaledVector(dir, this.speed * dt);
      this.mesh.rotation.y = Math.atan2(dir.x, dir.z);
    } else if (dist < 6) {
      dir.normalize().negate();
      this.mesh.position.addScaledVector(dir, this.speed * dt);
      this.mesh.rotation.y = Math.atan2(-dir.x, -dir.z);
    } else {
      // Strafe
      const perp = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
      this.mesh.position.addScaledVector(perp, this.speed * 0.5 * dt);
    }

    // Leg animation
    const t = performance.now() * 0.015;
    this.legs[0].position.y = 0.4 + Math.sin(t) * 0.1;
    this.legs[1].position.y = 0.4 - Math.sin(t) * 0.1;
    this.legs[2].position.y = 0.4 - Math.sin(t) * 0.1;
    this.legs[3].position.y = 0.4 + Math.sin(t) * 0.1;

    // Shoot
    this.attackCD -= dt;
    if (this.attackCD <= 0 && dist < 20) {
      this.attackCD = 1.5;
      this._shoot();
    }
  }

  _shoot() {
    // Tracer
    const from = this.mesh.position.clone().add(new THREE.Vector3(0, 1.7, 0));
    const to = this.game.player.mesh.position.clone().add(new THREE.Vector3(0, 1.0, 0));
    const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
    const mat = new THREE.LineBasicMaterial({ color: 0xffaa00 });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    setTimeout(() => this.scene.remove(line), 100);
    this.game.audio.gunshot('revolver');
    if (Math.random() < 0.6) this.game.player.takeDamage(this.damage);
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) this.die();
  }

  die() {
    this.game.totalKills++;
    this.game.money += this.bounty;
    this.game.notify.show(`Outlaw killed! +$${this.bounty} bounty`, 2500, 'good');
    this.destroy();
  }

  destroy() {
    this.scene.remove(this.mesh);
    this.game.removeEnemy(this);
  }
}
