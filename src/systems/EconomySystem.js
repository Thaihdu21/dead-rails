// === src/systems/EconomySystem.js ===
// Tiền, mua bán, bounty
export class EconomySystem {
  constructor(game) {
    this.game = game;
    this.shopCatalog = [
      { id: 'coal',     name: 'Coal (x3)',   price: 10, type: 'coal',    amount: 3 },
      { id: 'revolver', name: 'Revolver',    price: 60, type: 'revolver', amount: 1 },
      { id: 'rifle',    name: 'Rifle',       price: 90, type: 'rifle',    amount: 1 },
      { id: 'shotgun',  name: 'Shotgun',     price: 75, type: 'shotgun',  amount: 1 },
      { id: 'ammo',     name: 'Ammo (x12)',  price: 15, type: 'ammo',     amount: 12 },
      { id: 'bandage',  name: 'Bandage',     price: 12, type: 'bandage',  amount: 1 },
      { id: 'shovel',   name: 'Shovel',      price: 20, type: 'shovel',   amount: 1 },
      { id: 'dynamite', name: 'Dynamite',    price: 25, type: 'dynamite', amount: 1 }
    ];
  }

  reset() {
    // Money handled in Game; nothing to reset
  }

  buy(itemId) {
    const item = this.shopCatalog.find(i => i.id === itemId);
    if (!item) return;
    if (this.game.money < item.price) {
      this.game.notify.show('Not enough money!', 2000, 'warn');
      return;
    }
    this.game.money -= item.price;
    if (item.type === 'ammo') this.game.inventory.ammoReserve += item.amount;
    else this.game.inventory.add(item.type, item.amount);
    this.game.audio.pickup();
    this.game.notify.show(`Bought ${item.name}`, 1500, 'good');
  }

  sellLoot() {
    // Sell all gold and bank notes
    let total = 0;
    if (this.game.inventory.has('gold')) {
      const c = this.game.inventory.count('gold');
      total += c * 50;
      this.game.inventory.remove('gold', c);
    }
    if (this.game.inventory.has('bank_note')) {
      const c = this.game.inventory.count('bank_note');
      total += c * 100;
      this.game.inventory.remove('bank_note', c);
    }
    if (this.game.inventory.has('scrap')) {
      const c = this.game.inventory.count('scrap');
      total += c * 3;
      this.game.inventory.remove('scrap', c);
    }
    if (total > 0) {
      this.game.money += total;
      this.game.notify.show(`Sold loot: +$${total}`, 2000, 'good');
    } else {
      this.game.notify.show('Nothing to sell', 1500);
    }
  }
}
