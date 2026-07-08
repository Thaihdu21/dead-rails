// === src/ui/ShopUI.js ===
// Giao diện General Store / Trading Post
export class ShopUI {
  constructor(game) {
    this.game = game;
    this.screen = document.getElementById('shop-screen');
    this.itemsDiv = document.getElementById('shop-items');
    this.moneyDiv = document.getElementById('shop-money');

    document.getElementById('shop-close').addEventListener('click', () => this.close());
    // Close on F
    document.addEventListener('keydown', e => {
      if (e.code === 'KeyF' && this.game.state === 'shop') this.close();
    });
  }

  open(town) {
    this.game.state = 'shop';
    this.game.input.exitPointerLock();
    this._render();
    this.screen.classList.remove('hidden');
  }

  close() {
    this.game.state = 'playing';
    this.screen.classList.add('hidden');
    this.game.input.requestPointerLock();
  }

  _render() {
    this.moneyDiv.textContent = `You have: $${this.game.money}`;
    this.itemsDiv.innerHTML = '';
    for (const item of this.game.economy.shopCatalog) {
      const div = document.createElement('button');
      div.className = 'shop-item';
      if (this.game.money < item.price) div.classList.add('disabled');
      div.innerHTML = `<span>${item.name}</span><span class="price">$${item.price}</span>`;
      div.addEventListener('click', () => {
        this.game.economy.buy(item.id);
        this._render();
      });
      this.itemsDiv.appendChild(div);
    }
    // Sell button
    const sell = document.createElement('button');
    sell.className = 'shop-item';
    sell.style.gridColumn = '1 / -1';
    sell.innerHTML = '<span>SELL ALL LOOT (gold, bank notes, scrap)</span><span class="price">+$</span>';
    sell.addEventListener('click', () => {
      this.game.economy.sellLoot();
      this._render();
    });
    this.itemsDiv.appendChild(sell);
  }
}
