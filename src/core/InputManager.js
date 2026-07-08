// === src/core/InputManager.js ===
// Quản lý phím, chuột, pointer lock
export class InputManager {
  constructor(game) {
    this.game = game;
    this.keys = {};
    this.mouse = { dx: 0, dy: 0, leftDown: false, rightDown: false };
    this.locked = false;

    document.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      this.keys[e.key.toLowerCase()] = true;
      if (e.code === 'KeyF') this._tryInteract();
      if (e.code === 'KeyR') this._tryReload();
      if (e.code === 'KeyE') this._tryTurret();
      if (e.code === 'Digit1') this._selectSlot(0);
      if (e.code === 'Digit2') this._selectSlot(1);
      if (e.code === 'Digit3') this._selectSlot(2);
      if (e.code === 'Digit4') this._selectSlot(3);
      if (e.code === 'Digit5') this._selectSlot(4);
    });
    document.addEventListener('keyup', e => {
      this.keys[e.code] = false;
      this.keys[e.key.toLowerCase()] = false;
    });

    document.addEventListener('mousedown', e => {
      if (!this.locked) return;
      if (e.button === 0) this.mouse.leftDown = true;
      if (e.button === 2) this.mouse.rightDown = true;
    });
    document.addEventListener('mouseup', e => {
      if (e.button === 0) this.mouse.leftDown = false;
      if (e.button === 2) this.mouse.rightDown = false;
    });

    document.addEventListener('mousemove', e => {
      if (!this.locked) return;
      this.mouse.dx += e.movementX;
      this.mouse.dy += e.movementY;
    });

    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === document.body || document.pointerLockElement === document.getElementById('game-canvas');
      const hint = document.getElementById('pause-hint');
      if (this.locked) hint.classList.add('hidden');
      else if (this.game.state === 'playing') hint.classList.remove('hidden');
    });

    document.addEventListener('contextmenu', e => e.preventDefault());

    document.getElementById('game-canvas').addEventListener('click', () => {
      if (this.game.state === 'playing' && !this.locked) this.requestPointerLock();
    });
  }

  requestPointerLock() {
    document.body.requestPointerLock();
  }
  exitPointerLock() {
    if (document.pointerLockElement) document.exitPointerLock();
  }

  // Đọc và reset delta chuột
  consumeMouseDelta() {
    const d = { x: this.mouse.dx, y: this.mouse.dy };
    this.mouse.dx = 0; this.mouse.dy = 0;
    return d;
  }

  isDown(code) { return !!this.keys[code]; }

  _tryInteract() {
    if (this.game.state !== 'playing') return;
    this.game.player.tryInteract();
  }
  _tryReload() {
    if (this.game.state !== 'playing') return;
    this.game.combat.reload();
  }
  _tryTurret() {
    if (this.game.state !== 'playing') return;
    this.game.turret.toggleManual();
  }
  _selectSlot(i) {
    if (this.game.state !== 'playing') return;
    this.game.inventory.selectSlot(i);
  }
}
