// === src/world/World.js ===
import * as THREE from 'three';

// Địa hình sa mạc + cối xay gió + cactus + đá + xương rồng
export class World {
  constructor(game) {
    this.game = game;
    this.scene = game.scene.scene;
    this.sandMat = new THREE.MeshStandardMaterial({
      color: 0xc89b6a, roughness: 1.0, metalness: 0
    });
    this.detailMeshes = [];
    this._buildGround();
    this._buildScatter();
  }

  _buildGround() {
    // Mặt phẳng cát lớn trải dài
    const geo = new THREE.PlaneGeometry(2000, 2000, 32, 32);
    geo.rotateX(-Math.PI / 2);
    // Slight noise trên vertices
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setZ(i, (Math.random() - 0.5) * 0.3);
    }
    geo.computeVertexNormals();
    this.ground = new THREE.Mesh(geo, this.sandMat);
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    // Sương mù dày xa xa tạo cảm giác vô tận
  }

  _buildScatter() {
    // Rải đá, cactus, bụi cây dọc theo đường ray
    for (let i = 0; i < 300; i++) {
      const z = -i * 4 - Math.random() * 50;
      const x = (Math.random() - 0.5) * 180;
      if (Math.abs(x) < 8) continue; // tránh đường ray
      const type = Math.random();
      let mesh;
      if (type < 0.4) mesh = this._makeRock();
      else if (type < 0.75) mesh = this._makeCactus();
      else mesh = this._makeBush();
      mesh.position.set(x, 0, z);
      mesh.rotation.y = Math.random() * Math.PI * 2;
      const s = 0.7 + Math.random() * 0.7;
      mesh.scale.setScalar(s);
      this.scene.add(mesh);
      this.detailMeshes.push(mesh);
    }

    // Xương rồng khổng lồ đầu game
    this._makeDistantMountains();
  }

  _makeRock() {
    const geo = new THREE.DodecahedronGeometry(0.6 + Math.random() * 0.6, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0x8a7060, roughness: 1, flatShading: true });
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  _makeCactus() {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x4a6b3a, roughness: 0.9 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 2.0, 8), mat);
    trunk.position.y = 1; trunk.castShadow = true;
    g.add(trunk);
    if (Math.random() < 0.6) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.8, 6), mat);
      arm.position.set(0.3, 1.3, 0); arm.rotation.z = -0.5; arm.castShadow = true;
      g.add(arm);
    }
    return g;
  }

  _makeBush() {
    const mat = new THREE.MeshStandardMaterial({ color: 0x6b5030, roughness: 1 });
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 5), mat);
    m.position.y = 0.4; m.scale.y = 0.6; m.castShadow = true;
    return m;
  }

  _makeDistantMountains() {
    const mat = new THREE.MeshStandardMaterial({ color: 0x7a5a40, roughness: 1, flatShading: true });
    for (let i = 0; i < 12; i++) {
      const h = 30 + Math.random() * 30;
      const geo = new THREE.ConeGeometry(20 + Math.random() * 15, h, 5);
      const m = new THREE.Mesh(geo, mat);
      const side = i % 2 === 0 ? 1 : -1;
      m.position.set(side * (80 + Math.random() * 50), h / 2 - 2, -i * 70 - 40);
      this.scene.add(m);
    }
  }

  update(dt) {
    // Đưa mặt đất di chuyển theo tàu (giữ cảm giác vô tận)
    if (this.game.train) {
      this.ground.position.z = this.game.train.position.z;
      this.ground.position.x = this.game.train.position.x;
      // Cập nhật mountains/detail cũng follow
      for (const m of this.detailMeshes) {
        // Không cần di chuyển, tạo cảm giác vô tận bằng fog
      }
    }
  }
}
