// === src/world/DayNightCycle.js ===
import * as THREE from 'three';

// Chu kỳ ngày/đêm: 90s = 1 ngày. Điều chỉnh ánh sáng, fog, sky
export class DayNightCycle {
  constructor(game) {
    this.game = game;
    this.scene = game.scene;
    this.timeOfDay = 6 / 24; // bắt đầu lúc 6h sáng
    this.dayLength = 90; // giây
    this.dayCount = 1;
    this.lastDay = 1;

    // Ánh sáng chính (mặt trời)
    this.sun = new THREE.DirectionalLight(0xffe5b4, 1.2);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.left = -40;
    this.sun.shadow.camera.right = 40;
    this.sun.shadow.camera.top = 40;
    this.sun.shadow.camera.bottom = -40;
    this.sun.shadow.camera.far = 120;
    this.sun.shadow.bias = -0.0005;
    this.scene.scene.add(this.sun);
    this.scene.scene.add(this.sun.target);

    // Hemisphere light cho sky/ground bounce
    this.hemi = new THREE.HemisphereLight(0xb0d8ff, 0xc89b6a, 0.5);
    this.scene.scene.add(this.hemi);

    // Ambient
    this.ambient = new THREE.AmbientLight(0x554433, 0.3);
    this.scene.scene.add(this.ambient);

    // Moonlight (active ban đêm)
    this.moon = new THREE.DirectionalLight(0x6a7ab0, 0);
    this.scene.scene.add(this.moon);
  }

  get isNight() { return this.timeOfDay < 0.25 || this.timeOfDay > 0.75; }
  get isDay() { return !this.isNight; }
  get duskFactor() {
    // 0 = ban ngày, 1 = ban đêm, mượt ở giao thời
    const t = this.timeOfDay;
    if (t < 0.2) return 1;
    if (t < 0.3) return 1 - (t - 0.2) / 0.1;
    if (t < 0.7) return 0;
    if (t < 0.8) return (t - 0.7) / 0.1;
    return 1;
  }

  update(dt) {
    this.timeOfDay += dt / this.dayLength;
    if (this.timeOfDay >= 1) {
      this.timeOfDay -= 1;
      this.dayCount++;
    }
    if (this.dayCount !== this.lastDay) {
      this.lastDay = this.dayCount;
      this.game.day = this.dayCount;
      this.game.notify.show(`Day ${this.dayCount} dawns.`, 4000, 'good');
    }

    // Cảnh báo hoàng hôn
    if (this.timeOfDay > 0.68 && this.timeOfDay < 0.7 && !this._warnedNight) {
      this.game.notify.show('Night is coming...', 3500, 'warn');
      this._warnedNight = true;
    }
    if (this.timeOfDay > 0.2 && this.timeOfDay < 0.22 && this._warnedNight) {
      this._warnedNight = false;
    }

    const df = this.duskFactor;

    // Sun position (cung trời)
    const angle = (this.timeOfDay - 0.25) * Math.PI * 2; // 0 = noon
    const sunY = Math.sin(angle);
    const sunX = Math.cos(angle);
    this.sun.position.set(sunX * 50, sunY * 50 + 5, 20);
    this.sun.target.position.copy(this.game.player.mesh.position);
    this.sun.target.updateMatrixWorld();

    // Màu trời & cường độ
    const dayColor = new THREE.Color(0xffe5b4);
    const duskColor = new THREE.Color(0xff7a3a);
    const nightColor = new THREE.Color(0x3a4a7a);
    let sunColor, sunIntensity;
    if (sunY > 0.3) {
      sunColor = dayColor;
      sunIntensity = 1.3;
    } else if (sunY > 0) {
      const t = sunY / 0.3;
      sunColor = duskColor.clone().lerp(dayColor, t);
      sunIntensity = 0.4 + t * 0.9;
    } else {
      sunColor = nightColor;
      sunIntensity = 0.05;
    }
    this.sun.color.copy(sunColor);
    this.sun.intensity = sunIntensity;

    // Moon
    this.moon.position.set(-sunX * 50, -sunY * 50 + 5, 20);
    this.moon.target.position.copy(this.game.player.mesh.position);
    this.moon.target.updateMatrixWorld();
    this.moon.intensity = df * 0.4;

    this.ambient.intensity = 0.15 + (1 - df) * 0.25;
    this.hemi.intensity = 0.3 + (1 - df) * 0.4;

    // Fog color
    const fogDay = new THREE.Color(0xd9a86a);
    const fogNight = new THREE.Color(0x1a1a2a);
    const fogColor = fogDay.clone().lerp(fogNight, df);
    const fogNear = 60 - df * 20;
    const fogFar = 280 - df * 120;
    this.scene.setFogColor(fogColor.getHex(), fogNear, fogFar);

    // Sky background
    const skyDay = new THREE.Color(0xf2c987);
    const skyNight = new THREE.Color(0x0a0a1a);
    const skyDusk = new THREE.Color(0xff5a2a);
    let bgColor;
    if (sunY > 0.2) bgColor = skyDay.clone().lerp(skyDusk, Math.max(0, 1 - sunY) * 0.5);
    else if (sunY > -0.1) bgColor = skyDusk.clone().lerp(skyNight, Math.max(0, -sunY + 0.1) / 0.1 + 0.5);
    else bgColor = skyNight;
    this.scene.scene.background = bgColor;
  }

  // Hàm tiện ích cho hệ thống khác
  get hourFloat() { return this.timeOfDay * 24; }
  formatTime() {
    const h = Math.floor(this.hourFloat);
    const m = Math.floor((this.hourFloat - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }
}
