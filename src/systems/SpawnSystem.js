// === src/systems/SpawnSystem.js ===
import * as THREE from 'three';
import { Zombie } from '../entities/Zombie.js';
import { Vampire } from '../entities/Vampire.js';
import { Werewolf } from '../entities/Werewolf.js';
import { Outlaw } from '../entities/Outlaw.js';
import { Horse } from '../entities/Horse.js';

// Spawn kẻ thù theo km, thời gian trong ngày, loại vùng
export class SpawnSystem {
  constructor(game) {
    this.game = game;
    this.spawnCD = 2;
    this.maxEnemies = 12;
    this.horseSpawned = false;
    this.teslaSpawned = false;
  }

  reset() {
    this.spawnCD = 2;
    this.horseSpawned = false;
    this.teslaSpawned = false;
  }

  update(dt) {
    this.spawnCD -= dt;
    if (this.spawnCD > 0) return;
    this.spawnCD = this._nextInterval();

    if (this.game.enemies.length >= this.maxEnemies) return;

    const isNight = this.game.dayNight.isNight;
    const km = this.game.km;

    // Decide what to spawn
    const r = Math.random();
    if (isNight) {
      // Night: vampires, werewolves, hordes
      if (r < 0.3 && km > 20) this._spawn(Vampire);
      else if (r < 0.5 && km > 30) this._spawn(Werewolf);
      else this._spawnHorde(4);
    } else {
      // Day: zombies, occasional outlaw, wolf
      if (r < 0.7) this._spawn(Zombie, 'walker');
      else if (r < 0.85) this._spawn(Zombie, 'runner');
      else if (r < 0.95 && km > 15) this._spawn(Outlaw);
      else this._spawn(Zombie, 'walker');
    }

    // Special: spawn horse once early
    if (!this.horseSpawned && km > 8 && Math.random() < 0.3) {
      this.horseSpawned = true;
      const pos = this._spawnPos(30, 60);
      new Horse(this.game, pos);
      this.game.notify.show('A wild horse appears nearby', 3000);
    }

    // Tesla boss in storm near 50km
    if (!this.teslaSpawned && km > 50 && km < 52) {
      this.teslaSpawned = true;
      // Simplified: spawn a werewolf as "boss" with extra HP
      const boss = new Werewolf(this.game, this._spawnPos(8, 12));
      boss.maxHP = 300; boss.hp = 300;
      boss.damage = 35;
      this.game.notify.show('⚠ Tesla approaches through the storm!', 5000, 'warn');
    }
  }

  _nextInterval() {
    const isNight = this.game.dayNight.isNight;
    const base = isNight ? 1.5 : 3.5;
    return base + Math.random() * 1.5;
  }

  _spawn(EnemyClass, subType = null) {
    const pos = this._spawnPos(15, 35);
    if (subType) new EnemyClass(this.game, subType, pos);
    else new EnemyClass(this.game, pos);
  }

  _spawnHorde(count) {
    const basePos = this._spawnPos(20, 40);
    for (let i = 0; i < count; i++) {
      const pos = basePos.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 6, 0, (Math.random() - 0.5) * 6
      ));
      new Zombie(this.game, 'horde', pos);
    }
    this.game.notify.show('A horde approaches!', 2500, 'warn');
  }

  _spawnPos(minD, maxD) {
    const angle = Math.random() * Math.PI * 2;
    const dist = minD + Math.random() * (maxD - minD);
    const t = this.game.train.position;
    return new THREE.Vector3(
      t.x + Math.cos(angle) * dist,
      0,
      t.z + Math.sin(angle) * dist
    );
  }
}
