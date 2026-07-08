// === src/main.js ===
import { Game } from './core/Game.js';

const game = new Game();
window.game = game; // expose for debug
game.init();
