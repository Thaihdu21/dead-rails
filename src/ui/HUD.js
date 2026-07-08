// === src/ui/HUD.js ===
// Cập nhật DOM bars, ammo, minimap mỗi frame
export class HUD {
  constructor(game) {
    this.game = game;
    this.minimap = document.getElementById('minimap');
    this.mmCtx = this.minimap.getContext('2d');
  }

  update() {
    const g = this.game;
    // Fuel
    document.getElementById('fuel-fill').style.width = `${g.train.fuel}%`;
    document.getElementById('speed-text').textContent = `${(g.train.speed * 36).toFixed(1)} km/h`;
    // HP
    document.getElementById('hp-fill').style.width = `${(g.player.hp / g.player.maxHP) * 100}%`;
    // Stamina
    document.getElementById('stamina-fill').style.width = `${(g.player.stamina / g.player.maxStamina) * 100}%`;
    // Distance
    document.getElementById('distance-text').textContent = `${g.km.toFixed(1)} / 80 km`;
    // Time
    document.getElementById('time-text').textContent = `Day ${g.day} — ${g.dayNight.formatTime()}`;
    // Money
    document.getElementById('money-text').textContent = `$${g.money}`;
    document.getElementById('class-text').textContent = `Class: ${g.selectedClass}`;
    // Ammo counter
    const sel = g.inventory.getSelected();
    const wi = document.getElementById('weapon-info');
    if (sel) {
      wi.textContent = `${sel.type.toUpperCase()} x${sel.count}`;
      if (g.combat.ammoInClip > 0 || g.inventory.ammoReserve > 0) {
        wi.textContent += ` | ${g.combat.ammoInClip}/${g.inventory.ammoReserve}`;
      }
    } else {
      wi.textContent = 'Fists';
    }
    // Inventory
    g.inventory._updateUI();
    // Minimap
    this._drawMinimap();
  }

  _drawMinimap() {
    const ctx = this.mmCtx;
    const w = this.minimap.width, h = this.minimap.height;
    ctx.fillStyle = 'rgba(20,10,5,0.7)';
    ctx.fillRect(0, 0, w, h);
    // Train at center
    const cx = w / 2, cy = h / 2;
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(cx - 3, cy - 3, 6, 6);
    // Player
    const p = this.game.player.mesh.position;
    const t = this.game.train.position;
    const dx = p.x - t.x, dz = p.z - t.z;
    ctx.fillStyle = '#5fb8d4';
    ctx.beginPath();
    ctx.arc(cx + dx * 0.5, cy + dz * 0.5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Enemies
    for (const e of this.game.enemies) {
      const ex = e.mesh.position.x - t.x;
      const ez = e.mesh.position.z - t.z;
      const mx = cx + ex * 0.5, my = cy + ez * 0.5;
      if (mx < 0 || mx > w || my < 0 || my > h) continue;
      ctx.fillStyle = '#ff3333';
      ctx.fillRect(mx - 1.5, my - 1.5, 3, 3);
    }
    // Track line
    ctx.strokeStyle = 'rgba(212,175,55,0.4)';
    ctx.beginPath();
    ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
    ctx.stroke();
    // Border
    ctx.strokeStyle = '#5a4a32';
    ctx.strokeRect(0, 0, w, h);
  }
}
