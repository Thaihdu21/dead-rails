// === src/core/SceneManager.js ===
import * as THREE from 'three';

// Thiết lập Three.js scene, camera, renderer, fog, resize
export class SceneManager {
  constructor(game) {
    this.game = game;
    this.canvas = document.getElementById('game-canvas');

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas, antialias: true, powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf2c987);
    this.scene.fog = new THREE.Fog(0xd9a86a, 60, 280);

    this.camera = new THREE.PerspectiveCamera(
      70, window.innerWidth / window.innerHeight, 0.1, 800
    );
    this.camera.position.set(0, 6, 12);

    // Camera control state (third-person)
    this.yaw = 0;
    this.pitch = -0.2;
    this.cameraOffset = new THREE.Vector3(0, 4.5, 9);

    this.onResize();
  }

  onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // Cập nhật camera third-person theo player + yaw/pitch
  updateCamera(dt) {
    const player = this.game.player;
    if (!player.mesh) return;
    const target = player.mesh.position.clone().add(new THREE.Vector3(0, 1.8, 0));

    const offset = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      -Math.sin(this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch)
    ).multiplyScalar(7);

    const desired = target.clone().add(offset);
    desired.y = Math.max(desired.y, target.y + 1.5);
    this.camera.position.lerp(desired, 1 - Math.pow(0.001, dt));

    const look = target.clone();
    // Nhìn hơi cao hơn để có góc nhìn xuống nhẹ
    look.y += 0.3;
    this.camera.lookAt(look);
  }

  setFogColor(color, near, far) {
    this.scene.fog.color.setHex(color);
    this.scene.fog.near = near;
    this.scene.fog.far = far;
    this.scene.background = new THREE.Color(color);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
