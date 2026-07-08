// === src/train/Turret.js ===
import * as THREE from 'three';

// Turret tự động bắn kẻ thù xung quanh tàu; E để điều khiển thủ công
export class Turret {
  constructor(game) {
    this.game = game;
    this.scene = game.scene.scene;
    this.damage = 25;
    this.range = 35;
    this.fireRate = 0.25; // s giữa các phát
    this.cooldown = 0;
    this.manual = false;
    this._build();
  }

  _build() {
    const g = new THREE.Group();
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6, metalness: 0.7 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.4, 12), baseMat);
    base.position.y = 0.2;
    g.add(base);

    const pivot = new THREE.Group();
    pivot.position.y = 0.4;
    g.add(pivot);

    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 1.5), baseMat);
    barrel.position.set(0, 0.2, 0.7);
    pivot.add(barrel);

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.5), baseMat);
    body.position.y = 0.2;
    pivot.add(body);

    g.position.set(0.8, 2.9, -0.5); // trên mái tàu
    this.game.train.mesh.add(g);

    this.group = g;
    this.pivot = pivot;
    this.worldPos = new THREE.Vector3();
  }

  toggleManual() {
    // Chỉ chuyển sang manual nếu player gần
    const p = this.game.player.mesh.position;
    g.getWorldPosition(this.worldPos);
    this.group.getWorldPosition(this.worldPos);
    if (p.distanceTo(this.worldPos) < 3) {
      this.manual = !this.manual;
      this.game.notify.show(this.manual ? 'Manual turret: ON' : 'Turret: auto', 1500);
    }
  }

  update(dt) {
    this.group.getWorldPosition(this.worldPos);
    this.cooldown = Math.max(0, this.cooldown - dt);

    // Tìm target gần nhất
    let target = null;
    let bestDist = this.range;
    for (const e of this.game.enemies) {
      const d = e.mesh.position.distanceTo(this.worldPos);
      if (d < bestDist) {
        bestDist = d;
        target = e;
      }
    }

    if (target) {
      // Quay pivot về phía target
      const dir = target.mesh.position.clone().sub(this.worldPos);
      const targetYaw = Math.atan2(dir.x, dir.z);
      this.pivot.rotation.y = THREE.MathUtils.lerp(this.pivot.rotation.y, targetYaw, dt * 5);
      const targetPitch = Math.atan2(-dir.y, Math.sqrt(dir.x * dir.x + dir.z * dir.z));
      this.pivot.rotation.x = THREE.MathUtils.lerp(this.pivot.rotation.x, targetPitch, dt * 5);

      if (this.cooldown <= 0) {
        this._fire(target);
        this.cooldown = this.fireRate;
      }
    }
  }

  _fire(target) {
    // Tracer line
    const muzzle = new THREE.Vector3();
    this.pivot.getWorldPosition(muzzle);
    muzzle.y += 0.2;

    const geo = new THREE.BufferGeometry().setFromPoints([muzzle, target.mesh.position.clone()]);
    const mat = new THREE.LineBasicMaterial({ color: 0xffaa33, transparent: true, opacity: 0.9 });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    setTimeout(() => this.scene.remove(line), 80);

    target.takeDamage(this.damage);
    this.game.audio.gunshot('rifle');
  }
}
