// === src/world/TrackGenerator.js ===
import * as THREE from 'three';

// Sinh đường ray dọc theo trục Z + các thị trấn dọc đường
export class TrackGenerator {
  constructor(game) {
    this.game = game;
    this.scene = game.scene.scene;
    this.railGroup = new THREE.Group();
    this.scene.add(this.railGroup);
    this.townMarkers = [];
    this._buildInitial();
    this._planTowns();
  }

  _buildInitial() {
    const railMat = new THREE.MeshStandardMaterial({ color: 0x4a4038, roughness: 0.6, metalness: 0.7 });
    const tieMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 1 });

    // 2 thanh ray song song, kéo dài 1000m
    const railGeo = new THREE.BoxGeometry(0.15, 0.15, 1000);
    const railL = new THREE.Mesh(railGeo, railMat);
    const railR = new THREE.Mesh(railGeo, railMat);
    railL.position.set(-0.8, 0.15, -500);
    railR.position.set(0.8, 0.15, -500);
    this.railGroup.add(railL, railR);

    // Các thanh tie (ngang) mỗi 1m
    const tieGeo = new THREE.BoxGeometry(2.0, 0.1, 0.3);
    for (let z = 0; z > -1000; z -= 1.2) {
      const tie = new THREE.Mesh(tieGeo, tieMat);
      tie.position.set(0, 0.05, z);
      this.railGroup.add(tie);
    }

    // Ballast (đá nền)
    const ballastMat = new THREE.MeshStandardMaterial({ color: 0x6a5a4a, roughness: 1 });
    const ballast = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 1000), ballastMat);
    ballast.position.set(0, -0.02, -500);
    this.railGroup.add(ballast);
  }

  _planTowns() {
    // Thị trấn mỗi 8km (game distance), đặt tại các km cụ thể
    const townData = [
      { km: 5, name: 'Fort Independence', type: 'fort' },
      { km: 14, name: 'Dustwood', type: 'town' },
      { km: 24, name: 'Cactus Flats', type: 'town' },
      { km: 35, name: 'Mining Camp', type: 'mining' },
      { km: 46, name: 'Black Mesa', type: 'town' },
      { km: 58, name: 'Estate Ruins', type: 'estate' },
      { km: 70, name: 'Castle Dread', type: 'castle' },
      { km: 80, name: 'Final Fort', type: 'final' }
    ];
    // Scale: 1 km = 10 unit
    this.towns = townData.map(t => ({
      ...t,
      z: -t.km * 10,
      spawned: false
    }));
  }

  getTownAt(km) {
    // Trả về thị trấn trong tầm gần
    return this.towns.find(t => Math.abs(t.km - km) < 1.0);
  }

  // Spawn thị trấn khi tàu đến gần
  checkTownSpawn(currentKm) {
    for (const t of this.towns) {
      if (!t.spawned && currentKm + 1.5 > t.km) {
        t.spawned = true;
        this._spawnTown(t);
      }
    }
  }

  _spawnTown(town) {
    const townGroup = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 1 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x5a3a2a, roughness: 1 });

    const count = town.type === 'fort' ? 6 : town.type === 'castle' ? 4 : 4;
    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const offset = 10 + (i / 2) * 6;
      const b = this._makeBuilding(woodMat, roofMat, town.type);
      b.position.set(side * offset, 0, town.z + (Math.random() - 0.5) * 8);
      b.rotation.y = (side > 0 ? -1 : 1) * Math.PI / 2 + (Math.random() - 0.5) * 0.3;
      townGroup.add(b);

      // Tạo loot crate trong/near building
      if (Math.random() < 0.7) {
        this._spawnLootCrate(b.position.clone(), town);
      }
    }

    // Đặc biệt: Bank note ở town thường
    if (town.type === 'town' || town.type === 'fort') {
      const bank = this._makeBuilding(woodMat, roofMat, 'bank');
      bank.position.set(15, 0, town.z);
      bank.rotation.y = -Math.PI / 2;
      townGroup.add(bank);
      this._spawnLootCrate(bank.position.clone(), town, 'bank_note');
    }

    // Sign post
    const sign = this._makeSign(town.name, town.km);
    sign.position.set(5, 0, town.z + 5);
    townGroup.add(sign);

    this.scene.add(townGroup);
    town.group = townGroup;

    this.game.notify.show(`Approaching ${town.name}`, 3500);
  }

  _makeBuilding(wallMat, roofMat, type) {
    const g = new THREE.Group();
    const w = 4 + Math.random() * 2;
    const h = 3 + Math.random() * 1;
    const d = 4 + Math.random() * 2;
    const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    walls.position.y = h / 2;
    walls.castShadow = true; walls.receiveShadow = true;
    g.add(walls);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.8, 1.5, 4), roofMat);
    roof.position.y = h + 0.75;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    g.add(roof);
    if (type === 'bank') {
      // Bank có vẻ kiên cố hơn
      walls.scale.y = 1.3;
    }
    return g;
  }

  _makeSign(name, km) {
    const g = new THREE.Group();
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 2.5, 6),
      new THREE.MeshStandardMaterial({ color: 0x4a3a2a })
    );
    post.position.y = 1.25;
    g.add(post);
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.7, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x8a6a4a })
    );
    board.position.y = 2.0;
    g.add(board);
    g.userData.signName = name;
    g.userData.signKm = km;
    return g;
  }

  _spawnLootCrate(pos, town, forceType = null) {
    // Loot object: hộp gỗ có nội dung random
    const types = forceType ? [forceType] :
      ['coal', 'ammo', 'bandage', 'scrap', 'gold', 'dynamite'];
    const type = types[Math.floor(Math.random() * types.length)];
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 1 });
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.6), crateMat);
    crate.position.set(pos.x + (Math.random() - 0.5) * 1.5, 0.25, pos.z + (Math.random() - 0.5) * 1.5);
    crate.castShadow = true;
    this.scene.add(crate);

    this.game.addLoot({
      mesh: crate,
      type: type,
      amount: type === 'gold' ? 25 : type === 'coal' ? 3 : type === 'ammo' ? 6 : 1,
      value: type === 'gold' ? 50 : type === 'bank_note' ? 100 : 5
    });
  }
}
