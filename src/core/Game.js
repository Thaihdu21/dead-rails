// === src/core/Game.js ===
import * as THREE from 'three';
import { SceneManager } from './SceneManager.js';
import { InputManager } from './InputManager.js';
import { AudioManager } from './AudioManager.js';
import { World } from '../world/World.js';
import { DayNightCycle } from '../world/DayNightCycle.js';
import { TrackGenerator } from '../world/TrackGenerator.js';
import { Train } from '../train/Train.js';
import { Fortification } from '../train/Fortification.js';
import { Turret } from '../train/Turret.js';
import { Player } from '../entities/Player.js';
import { Zombie } from '../entities/Zombie.js';
import { Vampire } from '../entities/Vampire.js';
import { Werewolf } from '../entities/Werewolf.js';
import { Outlaw } from '../entities/Outlaw.js';
import { InventorySystem } from '../systems/InventorySystem.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { EconomySystem } from '../systems/EconomySystem.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';
import { ProgressSystem } from '../systems/ProgressSystem.js';
import { HUD } from '../ui/HUD.js';
import { Notification } from '../ui/Notification.js';
import { ShopUI } from '../ui/ShopUI.js';
import { MenuScreen } from '../ui/MenuScreen.js';

// Quản lý state toàn cục, kết nối mọi hệ thống
export class Game {
  constructor() {
    this.state = 'menu';            // menu | playing | shop | gameover | win
    this.selectedClass = 'none';
    this.enemies = [];
    this.loot = [];
    this.towns = [];
    this.projectiles = [];
    this.km = 0;
    this.money = 0;
    this.day = 1;
    this.elapsed = 0;
    this.lastTime = performance.now();
    this.delta = 0;
    this.totalKills = 0;
    this.totalLoot = 0;
  }

  async init() {
    this.scene = new SceneManager(this);
    this.input = new InputManager(this);
    this.audio = new AudioManager(this);
    this.dayNight = new DayNightCycle(this);
    this.world = new World(this);
    this.track = new TrackGenerator(this);
    this.train = new Train(this);
    this.fortification = new Fortification(this);
    this.turret = new Turret(this);
    this.player = new Player(this);
    this.inventory = new InventorySystem(this);
    this.combat = new CombatSystem(this);
    this.economy = new EconomySystem(this);
    this.spawn = new SpawnSystem(this);
    this.progress = new ProgressSystem(this);
    this.hud = new HUD(this);
    this.notify = new Notification(this);
    this.shop = new ShopUI(this);
    this.menu = new MenuScreen(this);

    window.addEventListener('resize', () => this.scene.onResize());

    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  startGame(classId) {
    this.selectedClass = classId;
    this.state = 'playing';
    this.km = 0;
    this.money = 50;
    this.day = 1;
    this.elapsed = 0;
    this.totalKills = 0;
    this.totalLoot = 0;
    this.enemies.forEach(e => e.destroy());
    this.enemies = [];
    this.loot.forEach(l => this.scene.scene.remove(l.mesh));
    this.loot = [];

    this.player.reset(classId);
    this.train.reset();
    this.inventory.reset();
    this.economy.reset();
    this.spawn.reset();
    this.progress.reset();

    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    this.input.requestPointerLock();
    this.notify.show(`Class: ${classId.toUpperCase()}`, 3000, 'good');
    this.notify.show('Survive the journey. Reach 80km.', 4000);
  }

  gameOver(reason = 'You died on the rails.') {
    if (this.state !== 'playing') return;
    this.state = 'gameover';
    this.input.exitPointerLock();
    const stats = document.getElementById('go-stats');
    stats.innerHTML = `
      <div>${reason}</div>
      <div>Distance: <strong>${this.km.toFixed(1)} / 80 km</strong></div>
      <div>Day survived: <strong>${this.day}</strong></div>
      <div>Kills: <strong>${this.totalKills}</strong></div>
      <div>Loot collected: <strong>${this.totalLoot}</strong></div>
      <div>Money: <strong>$${this.money}</strong></div>
    `;
    document.getElementById('go-title').textContent = 'YOU DIED';
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('hud').classList.add('hidden');
  }

  win() {
    if (this.state !== 'playing') return;
    this.state = 'win';
    this.input.exitPointerLock();
    const stats = document.getElementById('go-stats');
    stats.innerHTML = `
      <div>You reached Mexico!</div>
      <div>Distance: <strong>80.0 / 80 km</strong></div>
      <div>Days survived: <strong>${this.day}</strong></div>
      <div>Total kills: <strong>${this.totalKills}</strong></div>
      <div>Money earned: <strong>$${this.money}</strong></div>
    `;
    document.getElementById('go-title').textContent = 'YOU SURVIVED';
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('hud').classList.add('hidden');
  }

  addEnemy(enemy) { this.enemies.push(enemy); }
  removeEnemy(enemy) {
    const i = this.enemies.indexOf(enemy);
    if (i >= 0) this.enemies.splice(i, 1);
  }
  addLoot(loot) { this.loot.push(loot); }
  removeLoot(loot) {
    const i = this.loot.indexOf(loot);
    if (i >= 0) {
      this.scene.scene.remove(loot.mesh);
      this.loot.splice(i, 1);
    }
  }

  _loop(t) {
    requestAnimationFrame(this._loop);
    this.delta = Math.min((t - this.lastTime) / 1000, 0.1);
    this.lastTime = t;

    if (this.state === 'playing') this._update(this.delta);
    this.scene.render();
  }

  _update(dt) {
    this.elapsed += dt;
    this.dayNight.update(dt);
    this.world.update(dt);
    this.player.update(dt);
    this.train.update(dt);
    this.fortification.update(dt);
    this.turret.update(dt);
    for (const e of [...this.enemies]) e.update(dt);
    this.combat.update(dt);
    this.spawn.update(dt);
    this.progress.update(dt);
    this.hud.update();
    this.scene.updateCamera(dt);
    this.audio.updateAmbient(dt);
  }
}
