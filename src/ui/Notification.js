// === src/ui/Notification.js ===
// Toast message tạm thời
export class Notification {
  constructor(game) {
    this.game = game;
    this.container = document.getElementById('toast-container');
  }

  show(text, duration = 2500, kind = '') {
    const div = document.createElement('div');
    div.className = 'toast ' + kind;
    div.textContent = text;
    this.container.appendChild(div);
    setTimeout(() => {
      div.style.opacity = '0';
      div.style.transition = 'opacity 0.5s';
      setTimeout(() => div.remove(), 500);
    }, duration);
  }
}
