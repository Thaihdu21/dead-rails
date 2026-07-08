// === src/systems/InventorySystem.js ===
// Quản lý slot item, add/remove, giới hạn 8 slot
export class InventorySystem {
  constructor(game) {
    this.game = game;
    this.slots = []; // array of {type, count} or null
    this.maxSlots = 8;
    this.selected = 0;
    this.ammoReserve = 0;
  }

  reset() {
    this.slots = new Array(this.maxSlots).fill(null);
    this.selected = 0;
    this.ammoReserve = 0;
  }

  add(type, count = 1) {
    // Stack if same type
    for (let i = 0; i < this.maxSlots; i++) {
      if (this.slots[i] && this.slots[i].type === type && this._isStackable(type)) {
        this.slots[i].count += count;
        this._updateUI();
        return true;
      }
    }
    // New slot
    for (let i = 0; i < this.maxSlots; i++) {
      if (!this.slots[i]) {
        this.slots[i] = { type, count };
        this._updateUI();
        return true;
      }
    }
    this.game.notify.show('Inventory full!', 2000, 'warn');
    return false;
  }

  _isStackable(type) {
    return ['coal', 'ammo', 'bandage', 'dynamite', 'scrap', 'gold'].includes(type);
  }

  remove(type, count = 1) {
    for (let i = 0; i < this.maxSlots; i++) {
      if (this.slots[i] && this.slots[i].type === type) {
        this.slots[i].count -= count;
        if (this.slots[i].count <= 0) this.slots[i] = null;
        this._updateUI();
        return true;
      }
    }
    return false;
  }

  has(type) {
    return this.slots.some(s => s && s.type === type);
  }

  count(type) {
    let c = 0;
    for (const s of this.slots) if (s && s.type === type) c += s.count;
    return c;
  }

  selectSlot(i) {
    if (i < 0 || i >= this.maxSlots) return;
    this.selected = i;
    this._updateUI();
    const item = this.slots[i];
    const wi = document.getElementById('weapon-info');
    if (item) wi.textContent = `${item.type.toUpperCase()} x${item.count}`;
    else wi.textContent = 'Fists';
  }

  getSelected() {
    return this.slots[this.selected];
  }

  _updateUI() {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = '';
    for (let i = 0; i < this.maxSlots; i++) {
      const div = document.createElement('div');
      div.className = 'inv-slot';
      if (i === this.selected) div.style.borderColor = '#d4af37';
      const s = this.slots[i];
      if (s) {
        div.classList.add('has-item');
        div.innerHTML = `<div>${this._icon(s.type)}</div>` +
          (s.count > 1 ? `<div class="count">${s.count}</div>` : '');
      }
      grid.appendChild(div);
    }
  }

  _icon(type) {
    const icons = {
      shovel: '🔧', knife: '🔪', axe: '🪓',
      revolver: '🔫', rifle: '🎯', shotgun: '💥',
      dynamite: '🧨', bandage: '🩹', coal: '⚫',
      ammo: '🔶', scrap: '⚙', gold: '🪙',
      bank_note: '💵', metal_sheet: '🛡', barbed_wire: '⚓'
    };
    return icons[type] || type.substring(0, 4);
  }
}
