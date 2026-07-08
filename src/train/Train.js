// === src/train/Train.js ===
import * as THREE from 'three';

// Con tàu hơi nước: di chuyển theo Z, fuel logic, toa xe
export class Train {
  constructor(game) {
    this.game = game;
    this.scene = game.scene.scene;
    this.position = new THREE.Vector3(0, 0, 0);
    this.speed = 0; // km/s display
    this.maxSpeed = 0.35; // km/s ~ 12 km/h display
    this.fuel = 50;     // %
    this.fuelMax = 100;
    this.fuelBurn = 1.2; // %/s khi chạy
    this.coalInStorage = 5;
    this.length = 8;
    this.width = 2.4;
    this.height = 2.5;
    this.previousZ = 0;
    this.mesh = null;
    this._build();
  }

  reset() {
    this.position.set(0, 0, 0);
    this.speed = 0;
    this.fuel = 50;
    this.coalInStorage = 5;
    this.mesh.position.copy(this.position);
  }

  _build() {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3a2a20, roughness: 0.7, metalness: 0.3 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.8 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xb8860b, roughness: 0.3, metalness: 0.9 });

    // Locomotive body
    const loco = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.4, 4.5), bodyMat);
    loco.position.set(0, 1.5, 0);
    loco.castShadow = true; loco.receiveShadow = true;
    group.add(loco);

    // Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 1.8), bodyMat);
    cabin.position.set(0, 2.9, -1.4);
    cabin.castShadow = true;
    group.add(cabin);

    // Boiler front (tròn)
    const boiler = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.5, 16), metalMat);
    boiler.rotation.z = Math.PI / 2;
    boiler.position.set(0, 1.5, 2.6);
    boiler.castShadow = true;
    group.add(boiler);

    // Smokestack
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 1.2, 12), brassMat);
    stack.position.set(0, 3.7, 2.2);
    group.add(stack);

    // Cowcatcher (mũi tàu phía trước)
    const cowGeo = new THREE.ConeGeometry(0.9, 1.2, 4);
    const cow = new THREE.Mesh(cowGeo, metalMat);
    cow.rotation.x = Math.PI / 2;
    cow.rotation.y = Math.PI / 4;
    cow.position.set(0, 0.8, 3.5);
    group.add(cow);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5, metalness: 0.7 });
    const wheelPositions = [[-1, 0.5, -1.5], [1, 0.5, -1.5], [-1, 0.5, 0], [1, 0.5, 0], [-1, 0.5, 1.5], [1, 0.5, 1.5]];
    this.wheels = [];
    for (const p of wheelPositions) {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.x = Math.PI / 2;
      w.position.set(...p);
      group.add(w);
      this.wheels.push(w);
    }

    // Lò (furnace) — điểm nạp than
    const furnace = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.2), new THREE.MeshStandardMaterial({ color: 0x2a1a0a, emissive: 0xff4400, emissiveIntensity: 0.3 }));
    furnace.position.set(0, 1.4, -0.5);
    group.add(furnace);
    this.furnaceMesh = furnace;
    this.furnaceWorldPos = new THREE.Vector3();

    // Flatcar (toa hàng) phía sau
    const flatMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 1 });
    const flatcar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 4), flatMat);
    flatcar.position.set(0, 0.8, -4.5);
    flatcar.castShadow = true; flatcar.receiveShadow = true;
    group.add(flatcar);

    // Cargo crates trên flatcar
    for (let i = 0; i < 3; i++) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), new THREE.MeshStandardMaterial({ color: 0x6a4a2a }));
      c.position.set((i - 1) * 0.8, 1.35, -4.5);
      c.castShadow = true;
      group.add(c);
    }

    // Vị trí ghế lái (driver seat)
    this.driverSeat = new THREE.Object3D();
    this.driverSeat.position.set(0, 3.0, -1.4);
    group.add(this.driverSeat);

    // Roof walkway (mái tàu có thể đứng)
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 4.5), flatMat);
    roof.position.set(0, 2.85, 0);
    group.add(roof);

    // Light from furnace
    const furnaceLight = new THREE.PointLight(0xff6600, 1.5, 8);
    furnaceLight.position.set(0, 1.4, -0.3);
    group.add(furnaceLight);
    this.furnaceLight = furnaceLight;

    // Headlight (đèn đầu)
    const headlight = new THREE.SpotLight(0xffeeaa, 2.5, 30, Math.PI / 6, 0.5);
    headlight.position.set(0, 2.5, 3.5);
    headlight.target.position.set(0, 0, 20);
    group.add(headlight);
    group.add(headlight.target);
    this.headlight = headlight;

    group.position.copy(this.position);
    this.scene.add(group);
    this.mesh = group;
    this.previousZ = this.position.z;

    // Collision boxes (top của tàu — nơi player có thể đứng)
    this.walkSurfaces = [
      { x: 0, z: 0, w: 2.0, l: 4.5, y: 2.85 },  // roof
      { x: 0, z: -4.5, w: 2.2, l: 4.0, y: 0.95 } // flatcar top
    ];
  }

  // Tàu di chuyển nếu có fuel và player gần
  update(dt) {
    this.previousZ = this.position.z;
    const playerDist = this.game.player.mesh.position.distanceTo(this.position);
    const playerNear = playerDist < 25;

    if (this.fuel > 0 && playerNear) {
      this.speed = THREE.MathUtils.lerp(this.speed, this.maxSpeed, dt * 0.5);
      this.fuel = Math.max(0, this.fuel - this.fuelBurn * dt * (this.speed / this.maxSpeed));
    } else {
      this.speed = THREE.MathUtils.lerp(this.speed, 0, dt * 1.0);
    }

    if (this.fuel <= 0 && this._lastFuelWarn === undefined) {
      this._lastFuelWarn = 0;
    }
    if (this.fuel <= 0) {
      this._lastFuelWarn += dt;
      if (this._lastFuelWarn > 8) {
        this.game.notify.show('Train out of fuel! Add coal.', 3000, 'warn');
        this._lastFuelWarn = 0;
      }
    }

    // 1 unit = 0.1 km display
    this.position.z -= this.speed * dt * 10; // speed in km/s * dt * 10 = units
    this.mesh.position.copy(this.position);

    // Quay wheel
    const wheelSpeed = this.speed * 3;
    for (const w of this.wheels) w.rotation.y += wheelSpeed * dt;

    // Cập nhật furnace glow theo fuel
    this.furnaceLight.intensity = (this.fuel / this.fuelMax) * 2.5 + 0.3;
    this.furnaceMesh.material.emissiveIntensity = (this.fuel / this.fuelMax) * 0.6 + 0.1;

    // Update furnace world pos
    this.furnaceMesh.getWorldPosition(this.furnaceWorldPos);

    // Headlight on at night
    this.headlight.intensity = this.game.dayNight.isNight ? 3.5 : 0.5;

    // Cập nhật km
    const deltaKm = (this.previousZ - this.position.z) / 10;
    this.game.km += deltaKm;

    // Check town spawn
    this.game.track.checkTownSpawn(this.game.km);

    // Smoke particles (đơn giản)
    if (this.speed > 0.05 && Math.random() < dt * 8) {
      this._spawnSmoke();
    }
  }

  _spawnSmoke() {
    const geo = new THREE.SphereGeometry(0.25, 6, 5);
    const mat = new THREE.MeshBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.7 });
    const s = new THREE.Mesh(geo, mat);
    s.position.copy(this.position).add(new THREE.Vector3(0, 4.4, 2.0));
    this.scene.add(s);
    s.userData.life = 1.5;
    s.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 0.5, 1.5 + Math.random(), (Math.random() - 0.5) * 0.5);
    this._smoke = this._smoke || [];
    this._smoke.push(s);
    if (this._smoke.length > 30) {
      const old = this._smoke.shift();
      this.scene.remove(old);
    }
    // Update smoke mỗi frame trong update
    if (!this._smokeInitialized) {
      this._smokeInitialized = true;
      const tick = () => {
        if (!this._smoke) return;
        for (let i = this._smoke.length - 1; i >= 0; i--) {
          const s = this._smoke[i];
          s.userData.life -= 0.016;
          s.position.addScaledVector(s.userData.vel, 0.016);
          s.material.opacity = s.userData.life / 1.5 * 0.7;
          s.scale.multiplyScalar(1.015);
          if (s.userData.life <= 0) {
            this.scene.remove(s);
            this._smoke.splice(i, 1);
          }
        }
        requestAnimationFrame(tick);
      };
      tick();
    }
  }

  // Nạp than vào lò
  addCoal(amount = 1) {
    const fuelPerCoal = 20;
    this.fuel = Math.min(this.fuelMax, this.fuel + fuelPerCoal * amount);
    this.game.notify.show(`+${fuelPerCoal * amount}% fuel`, 1500, 'good');
  }

  // Thêm nhiên liệu từ zombie/scrap
  addFuelFromBurnable(amount) {
    this.fuel = Math.min(this.fuelMax, this.fuel + amount);
  }

  // Player đứng trên tàu?
  isPlayerOnTrain() {
    return this.game.player.onTrain;
  }

  // Vị trí có thể đứng gần furnace
  getFurnacePos() {
    return this.furnaceWorldPos.clone();
  }
}
