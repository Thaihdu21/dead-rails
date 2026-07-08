// === src/world/Town.js ===
// Helper class cho town logic (đã được tích hợp vào TrackGenerator)
// File này giữ lớp Town entity cho việc loot và enemy spawn tại town
import * as THREE from 'three';

export class Town {
  constructor(game, data) {
    this.game = game;
    this.data = data;
    this.looted = false;
    this.cleared = false;
  }

  // Trigger khi tàu đi ngang qua
  onTrainPass() {
    if (this.data.type === 'fort' && !this.cleared) {
      this.cleared = true;
      this.game.notify.show(`${this.data.name}: Safe zone. Trade & restock.`, 5000, 'good');
    }
  }
}
