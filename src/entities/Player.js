// === src/entities/Player.js ===
import * as THREE from 'three';

// Player third-person: WASD, stamina, HP, class, walk on train
export class Player {
  constructor(game) {
    this.game = game;
    this.scene = game.scene.scene;

    this.maxHP = 100;
    this.hp = 100;
    this.maxStamina = 100;
    this.stamina = 100;
    this.moveSpeed = 5.5;
    this.sprintMult = 1.6;
    this.class = 'none';
    this.onTrain = false;
    this.downed = false;
    this.downTime = 0;
    this.velocity = new THREE.Vector3();
    this.facing = 0;
    this.classData = null;

    this._build();
  }

  _build() {
    const g = new THREE.Group();
    // Body
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x6a4a3a, roughness: 1 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.9, 4, 8), bodyMat);
    body.position.y = 1.0;
    body.castShadow = true;
    g.add(body);
    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0xd4a878, roughness: 0.9 })
    );
    head.position.y = 1.75;
    head.castShadow = true;
    g.add(head);
    // Hat (cowboy)
    const hat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.05, 12),
      new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 1 })
    );
    hat.position.y = 1.98;
    g.add(hat);
    const hatTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.2, 12),
      new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 1 })
    );
    hatTop.position.y = 2.05;
    g.add(hatTop);

    // Arms
    const armMat = new THREE.MeshStandardMaterial({ color: 0x5a3a2a, roughness: 1 });
    const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.6, 4, 6), armMat);
    armL.position.set(-0.45, 1.1, 0); armL.castShadow = true;
    g.add(armL);
    const armR = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.6, 4, 6), armMat);
    armR.position.set(0.45, 1.1, 0); armR.castShadow = true;
    g.add(armR);
    this.armR = armR;

    // Legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 1 });
    const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.6, 4, 6), legMat);
    legL.position.set(-0.18, 0.35, 0); legL.castShadow = true;
    g.add(legL);
    const legR = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.6, 4, 6), legMat);
    legR.position.set(0.18, 0.35, 0); legR.castShadow = true;
    g.add(legR);
    this.legL = legL; this.legR = legR;

    // Weapon holder (giữ vũ khí hiện tại)
    this.weaponMesh = new THREE.Group();
    this.weaponMesh.position.set(0.45, 1.0, 0.2);
    g.add(this.weaponMesh);

    g.position.set(0, 0, -2);
    this.scene.add(g);
    this.mesh = g;

    // Aim raycaster
    this.raycaster = new THREE.Raycaster();
  }

  reset(classId) {
    this.class = classId;
    this.hp = this.maxHP;
    this.stamina = this.maxStamina;
    this.downed = false;
    this.mesh.position.set(0, 0, -2);
    this.velocity.set(0, 0, 0);

    // Class-specific stats
    const classData = {
      none:      { dmgMult: 1.0, speedMult: 1.0, startItems: [] },
      doctor:    { dmgMult: 1.0, speedMult: 1.0, startItems: ['bandage', 'bandage'] },
      soldier:   { dmgMult: 1.25, speedMult: 0.95, startItems: ['rifle', 'ammo'] },
      outlaw:    { dmgMult: 1.1, speedMult: 1.2, startItems: ['knife'] },
      highroller:{ dmgMult: 1.0, speedMult: 1.0, startItems: ['gold'] }
    };
    this.classData = classData[classId];
    this.moveSpeed = 5.5 * this.classData.speedMult;

    // Reset inventory and give starting items
    this.game.inventory.reset();
    for (const item of this.classData.startItems) {
      this.game.inventory.add(item, item === 'ammo' ? 12 : 1);
    }
    // Always start with fists/shovel equipped
    this.game.inventory.add('shovel', 1);
    this.game.inventory.selectSlot(0);
  }

  update(dt) {
    if (this.downed) {
      this.downTime += dt;
      if (this.downTime > 15) {
        this.game.gameOver('Bled out on the rails.');
        return;
      }
      return;
    }

    // Camera look
    const md = this.game.input.consumeMouseDelta();
    this.game.scene.yaw -= md.x * 0.0025;
    this.game.scene.pitch -= md.y * 0.0025;
    this.game.scene.pitch = THREE.MathUtils.clamp(this.game.scene.pitch, -1.2, 0.3);

    // Movement
    const yaw = this.game.scene.yaw;
    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

    let mx = 0, mz = 0;
    if (this.game.input.isDown('KeyW') || this.game.input.isDown('w')) mz += 1;
    if (this.game.input.isDown('KeyS') || this.game.input.isDown('s')) mz -= 1;
    if (this.game.input.isDown('KeyA') || this.game.input.isDown('a')) mx -= 1;
    if (this.game.input.isDown('KeyD') || this.game.input.isDown('d')) mx += 1;

    const sprinting = (this.game.input.isDown('ShiftLeft') || this.game.input.isDown('shift')) && mz > 0 && this.stamina > 0;
    let speed = this.moveSpeed * (sprinting ? this.sprintMult : 1);

    if (sprinting) this.stamina = Math.max(0, this.stamina - 25 * dt);
    else this.stamina = Math.min(this.maxStamina, this.stamina + 15 * dt);

    const moveDir = new THREE.Vector3();
    moveDir.addScaledVector(forward, mz);
    moveDir.addScaledVector(right, mx);
    if (moveDir.lengthSq() > 0) moveDir.normalize();

    // Horizontal movement
    this.velocity.x = moveDir.x * speed;
    this.velocity.z = moveDir.z * speed;

    // Gravity & vertical
    this.velocity.y -= 18 * dt;

    // Train platform carry: nếu đang đứng trên tàu, ta sẽ được đẩy theo tàu
    const trainDeltaZ = this.game.train.position.z - this.game.train.previousZ;

    // Apply movement
    const next = this.mesh.position.clone();
    next.x += this.velocity.x * dt;
    next.z += this.velocity.z * dt;
    next.y += this.velocity.y * dt;

    // Ground/train collision
    this.onTrain = false;
    let groundY = 0;
    const t = this.game.train;
    const localX = next.x - t.position.x;
    const localZ = next.z - t.position.z;
    // Check flatcar top
    if (Math.abs(localX) < 1.1 && localZ > -6.5 && localZ < -2.5) {
      groundY = 0.95;
      this.onTrain = true;
    }
    // Check roof
    else if (Math.abs(localX) < 1.0 && localZ > -2.2 && localZ < 2.2) {
      groundY = 2.85;
      this.onTrain = true;
    }

    if (next.y <= groundY) {
      next.y = groundY;
      this.velocity.y = 0;
      this._grounded = true;
    } else {
      this._grounded = false;
    }

    // Nếu trên tàu, kéo theo delta Z của tàu
    if (this.onTrain) {
      next.z += trainDeltaZ;
    }

    this.mesh.position.copy(next);

    // Facing direction (theo yaw khi di chuyển hoặc luôn theo camera)
    if (moveDir.lengthSq() > 0) {
      this.facing = Math.atan2(moveDir.x, moveDir.z);
    } else {
      this.facing = yaw + Math.PI;
    }
    // Smooth rotate
    const cur = this.mesh.rotation.y;
    let diff = this.facing - cur;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.mesh.rotation.y = cur + diff * Math.min(1, dt * 10);

    // Walk animation (đơn giản)
    if (moveDir.lengthSq() > 0 && this._grounded) {
      const t2 = performance.now() * 0.012 * (sprinting ? 1.5 : 1);
      this.legL.rotation.x = Math.sin(t2) * 0.6;
      this.legR.rotation.x = -Math.sin(t2) * 0.6;
      this.armL.rotation.x = -Math.sin(t2) * 0.4;
    } else {
      this.legL.rotation.x *= 0.85;
      this.legR.rotation.x *= 0.85;
      this.armL.rotation.x *= 0.85;
    }

    // Attack
    if (this.game.input.mouse.leftDown) {
      this.game.combat.playerAttack();
    }

    // Update interaction prompt
    this._updateInteractPrompt();

    // HP regen for doctor
    if (this.class === 'doctor') {
      this.hp = Math.min(this.maxHP, this.hp + 2 * dt);
    }
  }

  _updateInteractPrompt() {
    const prompt = document.getElementById('interaction-prompt');
    const interactable = this._findInteractable();
    if (interactable) {
      prompt.classList.remove('hidden');
      prompt.textContent = `[F] ${interactable.label}`;
    } else {
      prompt.classList.add('hidden');
    }
  }

  _findInteractable() {
    const p = this.mesh.position;
    // Furnace
    const fpos = this.game.train.getFurnacePos();
    if (p.distanceTo(fpos) < 2.5 && this.game.train.fuel < this.game.train.fuelMax - 5) {
      return { label: 'Add Coal', type: 'coal', obj: this.game.train };
    }
    // Loot
    for (const l of this.game.loot) {
      if (p.distanceTo(l.mesh.position) < 2.0) {
        return { label: `Pickup ${l.type}`, type: 'loot', obj: l };
      }
    }
    // Shop at fort
    const town = this.game.track.getTownAt(this.game.km);
    if (town && town.type === 'fort' && Math.abs(this.game.km - town.km) < 0.8) {
      return { label: 'Open Shop', type: 'shop', obj: town };
    }
    // Horse
    if (this.game.horse && p.distanceTo(this.game.horse.mesh.position) < 2.5) {
      return { label: 'Mount Horse', type: 'horse', obj: this.game.horse };
    }
    return null;
  }

  tryInteract() {
    const i = this._findInteractable();
    if (!i) return;
    if (i.type === 'coal') {
      if (this.game.train.coalInStorage > 0) {
        this.game.train.coalInStorage--;
        this.game.train.addCoal(1);
      } else {
        this.game.notify.show('No coal in storage! Loot some.', 2000, 'warn');
      }
    } else if (i.type === 'loot') {
      const l = i.obj;
      this.game.inventory.add(l.type, l.amount);
      this.game.audio.pickup();
      this.game.totalLoot++;
      if (l.type === 'gold' || l.type === 'bank_note') {
        this.game.money += l.value;
        this.game.notify.show(`+$${l.value}`, 2000, 'good');
      } else if (l.type === 'coal') {
        this.game.train.coalInStorage += l.amount;
        this.game.notify.show(`+${l.amount} coal`, 2000, 'good');
      } else if (l.type === 'ammo') {
        this.game.inventory.ammoReserve += l.amount;
        this.game.notify.show(`+${l.amount} ammo`, 2000, 'good');
      }
      this.game.removeLoot(l);
    } else if (i.type === 'shop') {
      this.game.shop.open(i.obj);
    } else if (i.type === 'horse') {
      this.game.horse.mount(this);
    }
  }

  takeDamage(amount) {
    if (this.downed) return;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.down();
    }
  }

  heal(amount) {
    this.hp = Math.min(this.maxHP, this.hp + amount);
  }

  down() {
    this.downed = true;
    this.downTime = 0;
    this.game.notify.show('You are down! Wait for revive or bleed out.', 4000, 'warn');
  }

  revive() {
    this.downed = false;
    this.hp = 30;
    this.downTime = 0;
    this.game.notify.show('Revived!', 2000, 'good');
  }
}
