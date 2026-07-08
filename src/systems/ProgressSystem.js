// === src/systems/ProgressSystem.js ===
// Theo dõi km, trigger event, win/lose
export class ProgressSystem {
  constructor(game) {
    this.game = game;
    this.finalTriggered = false;
    this.finalWaveTime = 0;
    this.inFinalWave = false;
  }

  reset() {
    this.finalTriggered = false;
    this.finalWaveTime = 0;
    this.inFinalWave = false;
  }

  update(dt) {
    const km = this.game.km;

    // Milestone notifications
    this._checkMilestone(km);

    // Final fort at 80km
    if (km >= 78 && !this.finalTriggered) {
      this.finalTriggered = true;
      this._triggerFinalAssault();
    }

    if (this.inFinalWave) {
      this.finalWaveTime += dt;
      // Spawn waves continuously
      if (Math.random() < dt * 1.5 && this.game.enemies.length < 15) {
        this._spawnFinalEnemy();
      }
      if (this.finalWaveTime > 240) { // 4 minutes
        // Survived
        this.game.win();
      }
    }

    // Out of fuel too long = lose
    if (this.game.train.fuel <= 0 && this.game.train.speed < 0.01) {
      this._fuelOutTime = (this._fuelOutTime || 0) + dt;
      if (this._fuelOutTime > 60) {
        this.game.gameOver('Train stalled in the desert. The horde overran you.');
      }
    } else {
      this._fuelOutTime = 0;
    }
  }

  _checkMilestone(km) {
    const milestones = [10, 20, 30, 40, 50, 60, 70];
    const key = `m_${Math.floor(km)}`;
    if (milestones.includes(Math.floor(km)) && !this[key]) {
      this[key] = true;
      this.game.notify.show(`${Math.floor(km)} km traveled. ${Math.max(0, 80 - Math.floor(km))} km to go.`, 3000);
    }
  }

  _triggerFinalAssault() {
    this.game.notify.show('FINAL FORT AHEAD! Survive the assault!', 5000, 'warn');
    this.inFinalWave = true;
    this.finalWaveTime = 0;
    // Spawn initial assault wave
    for (let i = 0; i < 6; i++) {
      this._spawnFinalEnemy();
    }
  }

  _spawnFinalEnemy() {
    const t = this.game.train.position;
    const angle = Math.random() * Math.PI * 2;
    const pos = new THREE.Vector3(
      t.x + Math.cos(angle) * 20, 0,
      t.z + Math.sin(angle) * 20
    );
    const r = Math.random();
    if (r < 0.4) {
      import('../entities/Zombie.js').then(m => new m.Zombie(this.game, 'runner', pos));
    } else if (r < 0.7) {
      import('../entities/Outlaw.js').then(m => new m.Outlaw(this.game, pos));
    } else {
      import('../entities/Werewolf.js').then(m => new m.Werewolf(this.game, pos));
    }
  }
}
