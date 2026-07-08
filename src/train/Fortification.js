// === src/train/Fortification.js ===
import * as THREE from 'three';

// Barbed wire, metal sheet — gây sát thương cho kẻ thù chạm
export class Fortification {
  constructor(game) {
    this.game = game;
    this.scene = game.scene.scene;
    this.fortifications = []; // { mesh, type, position, damage, durability }
  }

  addBarbedWire(localPos) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7, metalness: 0.6 });
    const g = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.03, 4, 8), mat);
      ring.position.set(0, 0, (i - 2) * 0.15);
      ring.rotation.x = Math.PI / 2;
      g.add(ring);
    }
    g.position.copy(localPos);
    this.game.train.mesh.add(g);
    const fort = {
      mesh: g, type: 'wire', localPos: localPos.clone(),
      damage: 15, durability: 100, worldPos: new THREE.Vector3()
    };
    this.fortifications.push(fort);
    g.getWorldPosition(fort.worldPos);
    this.game.notify.show('Barbed wire deployed', 2000, 'good');
  }

  addMetalSheet(localPos) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5, metalness: 0.8 });
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 0.1), mat);
    m.position.copy(localPos);
    this.game.train.mesh.add(m);
    const fort = {
      mesh: m, type: 'sheet', localPos: localPos.clone(),
      damage: 0, durability: 200, worldPos: new THREE.Vector3()
    };
    this.fortifications.push(fort);
    m.getWorldPosition(fort.worldPos);
    this.game.notify.show('Metal sheet reinforced', 2000, 'good');
  }

  update(dt) {
    // Cập nhật worldPos và check collision với enemies
    for (const f of this.fortifications) {
      f.mesh.getWorldPosition(f.worldPos);
      if (f.type === 'wire') {
        for (const e of this.game.enemies) {
          if (e.mesh.position.distanceTo(f.worldPos) < 1.0) {
            e.takeDamage(f.damage * dt);
            f.durability -= dt * 5;
          }
        }
      }
    }
    // Xóa fortification hỏng
    this.fortifications = this.fortifications.filter(f => {
      if (f.durability <= 0) {
        this.game.train.mesh.remove(f.mesh);
        return false;
      }
      return true;
    });
  }
}
