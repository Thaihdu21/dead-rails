// === src/systems/CombatSystem.js ===
import * as THREE from 'three';

// Combat: melee (khoảng cách gần), ranged (raycast), reload
export class CombatSystem {
  constructor(game) {
    this.game = game;
    this.scene = game.scene.scene;
    this.raycaster = new THREE.Raycaster();
    this.attackCD = 0;
    this.aiming = false;
    this.ammoInClip = 0;
    this.clipSize = 6;
    this.reloading = false;
    this.reloadTime = 0;
  }

  // Weapon stats
  static WEAPONS = {
    shovel:   { type: 'melee', dmg: 35, range: 2.2, rate: 0.7 },
    knife:    { type: 'melee', dmg: 18, range: 1.8, rate: 0.35 },
    axe:      { type: 'melee', dmg: 28, range: 2.0, rate: 0.55 },
    revolver: { type: 'ranged', dmg: 30, range: 40, rate: 0.4, clip: 6 },
    rifle:    { type: 'ranged', dmg: 50, range: 60, rate: 1.0, clip: 5 },
    shotgun:  { type: 'ranged', dmg: 25, range: 12, rate: 0.8, clip: 2, pellets: 5 },
    dynamite: { type: 'throw', dmg: 80, range: 15, rate: 1.5 }
  };

  update(dt) {
    this.attackCD = Math.max(0, this.attackCD - dt);
    if (this.reloading) {
      this.reloadTime -= dt;
      if (this.reloadTime <= 0) {
        this.reloading = false;
        const need = this.clipSize - this.ammoInClip;
        const take = Math.min(need, this.game.inventory.ammoReserve);
        this.ammoInClip += take;
        this.game.inventory.ammoReserve -= take;
        this.game.notify.show('Reloaded', 1000);
      }
    }
    // Aim
    this.aiming = this.game.input.mouse.rightDown;
  }

  playerAttack() {
    if (this.attackCD > 0) return;
    const sel = this.game.inventory.getSelected();
    const type = sel ? sel.type : 'fists';
    const weapon = CombatSystem.WEAPONS[type];
    if (!weapon) {
      // Fists
      this._melee(10, 1.8);
      this.attackCD = 0.4;
      return;
    }
    if (weapon.type === 'melee') {
      this._melee(weapon.dmg * this.game.player.classData.dmgMult, weapon.range);
      this.attackCD = weapon.rate;
      this.game.audio.hit();
      // Swing anim
      this._swingAnim();
    } else if (weapon.type === 'ranged') {
      this._shoot(type, weapon);
      this.attackCD = weapon.rate;
    } else if (weapon.type === 'throw') {
      this._throw(weapon);
      this.attackCD = weapon.rate;
      // Consume dynamite
      this.game.inventory.remove('dynamite', 1);
    }
  }

  _melee(dmg, range) {
    const p = this.game.player.mesh.position;
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(this.game.player.mesh.rotation);
    // Hit enemies in cone
    for (const e of this.game.enemies) {
      const to = e.mesh.position.clone().sub(p);
      to.y = 0;
      const d = to.length();
      if (d > range) continue;
      to.normalize();
      if (to.dot(dir) > 0.4) {
        e.takeDamage(dmg);
        // Knockback
        e.mesh.position.addScaledVector(to, 0.3);
      }
    }
  }

  _shoot(type, weapon) {
    if (this.ammoInClip <= 0) {
      this.game.notify.show('Out of ammo! Press R', 1500, 'warn');
      return;
    }
    this.ammoInClip--;
    this.clipSize = weapon.clip;
    this.game.audio.gunshot(type === 'shotgun' ? 'shotgun' : type);

    const camera = this.game.scene.camera;
    const pellets = weapon.pellets || 1;
    for (let i = 0; i < pellets; i++) {
      const ndc = new THREE.Vector2(
        (Math.random() - 0.5) * 0.02 * (this.game.input.mouse.rightDown ? 0.3 : 1),
        (Math.random() - 0.5) * 0.02 * (this.game.input.mouse.rightDown ? 0.3 : 1)
      );
      this.raycaster.setFromCamera(ndc, camera);
      this.raycaster.far = weapon.range;
      // Check enemies
      const enemyMeshes = this.game.enemies.map(e => e.mesh);
      const hits = this.raycaster.intersectObjects(enemyMeshes, true);
      if (hits.length > 0) {
        // Find enemy by traversing parent
        let obj = hits[0].object;
        while (obj && !this.game.enemies.find(e => e.mesh === obj)) obj = obj.parent;
        const enemy = this.game.enemies.find(e => e.mesh === obj);
        if (enemy) {
          enemy.takeDamage(weapon.dmg * this.game.player.classData.dmgMult);
          // Blood effect
          this._bloodHit(hits[0].point);
        }
      }
      // Tracer
      const origin = new THREE.Vector3();
      camera.getWorldPosition(origin);
      const dir = this.raycaster.ray.direction.clone();
      const end = origin.clone().addScaledVector(dir, weapon.range);
      const geo = new THREE.BufferGeometry().setFromPoints([origin.clone().add(dir.clone().multiplyScalar(1)), end]);
      const mat = new THREE.LineBasicMaterial({ color: 0xffcc33, transparent: true, opacity: 0.6 });
      const line = new THREE.Line(geo, mat);
      this.scene.add(line);
      setTimeout(() => this.scene.remove(line), 60);
    }
  }

  _throw(weapon) {
    // Spawn dynamite projectile that explodes after delay
    const p = this.game.player.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0));
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(this.game.player.mesh.rotation);
    const dyn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.25, 6),
      new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 0.5 })
    );
    dyn.position.copy(p);
    this.scene.add(dyn);
    const vel = dir.clone().multiplyScalar(15).add(new THREE.Vector3(0, 5, 0));
    let fuse = 1.5;
    const tick = () => {
      fuse -= 0.016;
      vel.y -= 0.5;
      dyn.position.addScaledVector(vel, 0.016);
      if (fuse <= 0) {
        // Explode
        this._explosion(dyn.position.clone(), weapon.dmg, weapon.range);
        this.scene.remove(dyn);
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  }

  _explosion(pos, dmg, range) {
    // Visual
    const flash = new THREE.Mesh(
      new THREE.SphereGeometry(2, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.8 })
    );
    flash.position.copy(pos);
    this.scene.add(flash);
    const startScale = 1;
    const expand = () => {
      flash.scale.multiplyScalar(1.1);
      flash.material.opacity *= 0.85;
      if (flash.material.opacity > 0.05) requestAnimationFrame(expand);
      else this.scene.remove(flash);
    };
    expand();

    // Light flash
    const light = new THREE.PointLight(0xff8800, 5, 20);
    light.position.copy(pos);
    this.scene.add(light);
    setTimeout(() => this.scene.remove(light), 200);

    // Damage
    for (const e of [...this.game.enemies]) {
      const d = e.mesh.position.distanceTo(pos);
      if (d < range) e.takeDamage(dmg * (1 - d / range));
    }
    if (this.game.player.mesh.position.distanceTo(pos) < range) {
      this.game.player.takeDamage(dmg * 0.5 * (1 - this.game.player.mesh.position.distanceTo(pos) / range));
    }
  }

  _bloodHit(pos) {
    for (let i = 0; i < 6; i++) {
      const p = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 4, 3),
        new THREE.MeshBasicMaterial({ color: 0x8b0000 })
      );
      p.position.copy(pos);
      this.scene.add(p);
      const v = new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 3);
      let life = 0.5;
      const tick = () => {
        life -= 0.016;
        v.y -= 0.3;
        p.position.addScaledVector(v, 0.016);
        if (life > 0) requestAnimationFrame(tick);
        else this.scene.remove(p);
      };
      tick();
    }
  }

  _swingAnim() {
    const arm = this.game.player.armR;
    if (!arm) return;
    arm.rotation.x = -1.5;
    const reset = () => {
      arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, 0, 0.3);
      if (Math.abs(arm.rotation.x) > 0.05) requestAnimationFrame(reset);
      else arm.rotation.x = 0;
    };
    requestAnimationFrame(reset);
  }

  reload() {
    const sel = this.game.inventory.getSelected();
    if (!sel) return;
    const weapon = CombatSystem.WEAPONS[sel.type];
    if (!weapon || weapon.type !== 'ranged') return;
    if (this.ammoInClip >= weapon.clip) return;
    if (this.game.inventory.ammoReserve <= 0) {
      this.game.notify.show('No reserve ammo!', 1500, 'warn');
      return;
    }
    this.reloading = true;
    this.reloadTime = 1.5;
    this.clipSize = weapon.clip;
    this.game.notify.show('Reloading...', 1500);
  }
}
