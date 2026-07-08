// === src/ui/MenuScreen.js ===
// Main menu, class select, restart
export class MenuScreen {
  constructor(game) {
    this.game = game;
    this.screen = document.getElementById('menu-screen');

    const cards = document.querySelectorAll('.class-card');
    cards.forEach(c => {
      c.addEventListener('click', () => {
        cards.forEach(x => x.classList.remove('selected'));
        c.classList.add('selected');
        game.selectedClass = c.dataset.class;
      });
    });

    document.getElementById('start-btn').addEventListener('click', () => {
      const sel = document.querySelector('.class-card.selected');
      game.audio.resume();
      game.startGame(sel.dataset.class);
    });

    document.getElementById('restart-btn').addEventListener('click', () => {
      // Hard reload để reset sạch
      location.reload();
    });
  }

  show() {
    this.screen.classList.remove('hidden');
  }
}
