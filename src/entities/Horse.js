// === src/entities/Horse.js ===
import * as THREE from 'three';

// Ngựa hoang: bắt được, cưỡi di chuyển nhanh
export class Horse {
  constructor(game, pos = null) {
    this.game = game;
    this.scene = game.scene.scene;
    this.maxHP = 60; this.hp = 60;
    this.mounted = false;
    this.rider = null;
    this.speed = 8;
    this._build();
    if (pos) this.mesh.position.copy(pos);
    this.scene.add(this.mesh);
    this.game.horse = this;
  }

  _build() {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x8a5a3a, roughness: 1 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 1.6), mat);
    body.position.y = 1.1; body.castShadow = true;
    g.add(body);
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.4), mat);
    neck.position.set(0, 1.5, 0.7); neck.rotation.x = -0.4;
    g.add(neck);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.5), mat);
    head.position.set(0, 1.9, 0.95); g.add(head);
    // Mane
    const mane = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x2a1a0a }));
    mane.position.set(0, 1.6, 0.6); g.add(mane);
    // Legs
    const legPos = [[-0.25, 0.45, 0.55], [0.25, 0.45, 0.55], [-0.25, 0.45, -0.55], [0.25, 0.45, -0.55]];
    this.legs = [];
    for (const p of legPos) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.9, 0.14), mat);
      l.position.set(...p); g.add(l); this.legs.push(l);
    }
    // Tail
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x2a1a0a }));
    tail.position.set(0, 1.0, -0.85); g.add(tail);
    this.mesh = g;
  }

  mount(player) {
    if (this.mounted) return;
    this.mounted = true;
    this.rider = player;
    this.game.notify.show('Mounted horse. Press F to dismount.', 2500, 'good');
  }

  dismount() {
    this.mounted = false;
    this.rider = null;
  }

  update(dt) {
    if (this.mounted && this.rider) {
      // Player on horse
      this.rider.mesh.position.copy(this.mesh.position).add(new THREE.Vector3(0, 1.5, 0));
      // WASD controls horse
      const yaw = this.game.scene.yaw;
      const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
      const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
      let mx = 0, mz = 0;
      if (this.game.input.isDown('KeyW')) mz += 1;
      if (this.game.input.isDown('KeyS')) mz -= 1;
      if (this.game.input.isDown('KeyA')) mx -= 1;
      if (this.game.input.isDown('KeyD')) mx += 1;
      const dir = new THREE.Vector3();
      dir.addScaledVector(forward, mz).addScaledVector(right, mx);
      if (dir.lengthSq() > 0) {
        dir.normalize();
        this.mesh.position.addScaledVector(dir, this.speed * dt);
        this.mesh.rotation.y = Math.atan2(dir.x, dir.z);
      }
    }
    // Leg animation when moving
    const t = performance.now() * 0.012;
    this.legs[0].position.y = 0.45 + Math.sin(t) * 0.08;
    this.legs[1].position.y = 0.45 - Math.sin(t) * 0.08;
    this.legs[2].position.y = 0.45 - Math.sin(t) * 0.08;
    this.legs[3].position.y = 0.45 + Math.sin(t) * 0.08;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    if (this.rider) this.rider.mesh.position.copy(this.mesh.position);
    this.scene.remove(this.mesh);
    if (this.game.horse === this) this.game.horse = null;
  }
}
