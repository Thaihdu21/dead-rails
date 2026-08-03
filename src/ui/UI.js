import * as THREE from 'three';
import { G } from '../core/Game.js';
import { CFG, ITEMS, WEAPONS, STORE } from '../core/Constants.js';
import { Audio } from '../core/Assets.js';

const $ = id => document.getElementById(id);
const fmt = n => n.toLocaleString('en-US');
const sellPrice = id => {
  const it = ITEMS[id]; if(!it) return 0;
  if(it.sellRange) return Math.round((it.sellRange[0]+it.sellRange[1])/2);
  return it.sell || 0;
};

export class UI{
  constructor(){
    this.recoilAmt = 0;
    $('btn-start').onclick   = ()=>this.start();
    $('btn-resume').onclick  = ()=>this.resume();
    $('btn-restart').onclick = ()=>location.reload();
    $('btn-retry').onclick   = ()=>location.reload();
    $('btn-again').onclick   = ()=>location.reload();
    $('shop-close').onclick  = ()=>this.closeShop();
    addEventListener('keydown', e=>{
      if(e.code!=='Escape') return;
      if(G.state==='SHOP') this.closeShop();
      else if(G.state==='PLAYING') this.pause();
      else if(G.state==='PAUSED') this.resume();
    });
  }
  // -------- Screens --------
  start(){
    Audio.init();
    $('start').classList.add('hidden');
    $('hud').classList.remove('hidden');
    G.state = 'PLAYING';
    G.input.lock();
    this.notify('🚂 Đến Mexico — 80,000m. Nhấn F để đốt lò!','good');
  }
  pause(){ if(G.state!=='PLAYING') return; G.state='PAUSED'; $('pause').classList.remove('hidden'); G.input.unlock(); }
  resume(){ if(G.state!=='PAUSED') return; $('pause').classList.add('hidden'); G.state='PLAYING'; G.input.lock(); }
  gameover(txt){
    if(G.state==='GAMEOVER') return;
    G.state='GAMEOVER'; G.input.unlock();
    $('go-text').textContent = `${txt}\nĐi được ${fmt(Math.round(G.train.x))}m · ${G.kills} kill · $${G.player.money}`;
    $('gameover').classList.remove('hidden');
  }
  victory(){
    if(G.state==='WIN') return;
    G.state='WIN'; G.input.unlock();
    $('win-text').textContent = `Bạn đã sống sót qua 80,000m! ${G.kills} kill · $${G.player.money} còn lại.`;
    $('victory').classList.remove('hidden');
  }
  // -------- Notification --------
  notify(msg, cls=''){
    const d = document.createElement('div');
    d.className = 'notif ' + cls; d.textContent = msg;
    $('notifications').appendChild(d);
    setTimeout(()=>{ d.style.opacity='0'; d.style.transition='opacity .5s'; }, 2600);
    setTimeout(()=>d.remove(), 3200);
  }
  hitmark(){
    const h = $('hitmark'); h.classList.remove('hidden');
    clearTimeout(this._hm); this._hm = setTimeout(()=>h.classList.add('hidden'), 90);
  }
  recoil(){ this.recoilAmt = .028; }
  flashDamage(){
    document.body.style.boxShadow = 'inset 0 0 180px rgba(180,0,0,.75)';
    clearTimeout(this._fd);
    this._fd = setTimeout(()=>document.body.style.boxShadow='', 130);
  }
  damageNumber(worldPos, n, crit){
    const v = worldPos.clone().project(G.camera);
    if(v.z > 1) return;
    const d = document.createElement('div');
    d.className = 'dmg' + (crit?' crit':'');
    d.textContent = crit ? n+'!' : n;
    d.style.left = ((v.x*.5+.5)*innerWidth) + 'px';
    d.style.top  = ((-v.y*.5+.5)*innerHeight) + 'px';
    $('dmg-layer').appendChild(d);
    requestAnimationFrame(()=>{ d.style.transform='translateY(-46px)'; d.style.opacity='0'; });
    setTimeout(()=>d.remove(), 650);
  }
  // -------- HUD --------
  update(){
    const P = G.player, T = G.train;
    $('hp-fill').style.width = (P.hp/P.maxHp*100)+'%';
    $('hp-txt').textContent = Math.ceil(P.hp);
    $('thp-fill').style.width = (T.hp/T.maxHp*100)+'%';
    $('thp-txt').textContent = Math.ceil(T.hp);
    $('fuel-fill').style.width = T.fuel+'%';
    $('fuel-txt').textContent = Math.round(T.fuel)+'%';
    $('train-info').textContent =
      `Throttle: ${T.throttle.toUpperCase()} · 📰 x${T.armor}` +
      (T.stopTimer>0 ? ` · ⏸ DỪNG ${Math.ceil(T.stopTimer)}s` : '');
    $('dist').textContent = `${fmt(Math.round(T.x))} m / 80,000 m`;
    $('dist-fill').style.width = (T.x/CFG.TOTAL_DISTANCE*100)+'%';
    $('money').textContent = '$'+fmt(P.money);

    const w = P.weapon(), id = P.weaponId();
    $('weapon').textContent = w.n;
    $('ammo').textContent = w.melee ? '— melee —'
      : `${P.mag[id]||0} / ${P.ammo[w.ammo]||0}`;
    $('utility').textContent = 'G › ' + (P.utility ? (ITEMS[P.utility]?.n||P.utility) : '—');

    const h = (G.gameTime/3600)%24;
    const icon = G.moon==='blood' ? '🩸 BLOOD MOON' : G.moon==='full' ? '🌕 FULL MOON'
               : G.isNight ? '🌙 ĐÊM' : '☀ NGÀY';
    $('clock').textContent = `${String(Math.floor(h)).padStart(2,'0')}:${String(Math.floor(h%1*60)).padStart(2,'0')} — ${icon}`;

    // inventory
    const rows = Object.keys(P.inv).filter(k=>P.inv[k]>0)
      .map(k=>`<div><span>${ITEMS[k]?.n||k}</span><span>x${P.inv[k]}</span></div>`).join('');
    $('inv-list').innerHTML = rows || '<div style="color:#7a6a50">(trống)</div>';

    // prompt tương tác
    let best=null, bd=1e9;
    for(const it of G.world.interactables){
      const p = it.dynamic ? it.dynamic() : it.pos;
      const d = p.distanceTo(P.pos);
      if(d < it.r && d < bd){ bd=d; best=it; }
    }
    const pr = $('prompt');
    if(best){ pr.classList.remove('hidden'); pr.textContent = `[E] ${best.label}`; }
    else if(G.entities.corpses.some(c=>c.pos.distanceTo(P.pos)<3)){
      pr.classList.remove('hidden'); pr.textContent = '[E] Nhặt xác';
    }
    else if(Math.abs(P.pos.x-G.train.x)<26 && Math.abs(P.pos.z)<7 && !P.onTrain){
      pr.classList.remove('hidden'); pr.textContent = '[E] Lên tàu';
    }
    else if(P.onTrain && P.pos.x > G.train.x+6){
      pr.classList.remove('hidden'); pr.textContent = '[E] Đổi throttle · [F] Đốt lò';
    }
    else pr.classList.add('hidden');
  }
  // -------- ShopSystem / ShopUI --------
  openShop(key, title){
    if(G.state!=='PLAYING') return;
    G.state='SHOP'; G.input.unlock();
    this.shopKey = key;
    $('shop-title').textContent = title;
    $('shop').classList.remove('hidden');
    this.renderShop();
  }
  closeShop(){
    if(G.state!=='SHOP') return;
    $('shop').classList.add('hidden'); G.state='PLAYING'; G.input.lock();
  }
  renderShop(){
    const P = G.player;
    $('shop-money').textContent = '$'+fmt(P.money);
    const cols = $('shop-cols'); cols.innerHTML = '';
    const mk = (title, rows) => {
      const c = document.createElement('div'); c.className='shop-col';
      c.innerHTML = `<h4>${title}</h4>` + (rows.length?rows.join(''):'<div class="empty">Không có gì</div>');
      cols.appendChild(c);
    };
    if(this.shopKey === 'trading'){
      const rows = Object.keys(P.inv).filter(k=>P.inv[k]>0 && sellPrice(k)>0).map(k=>
        `<div class="row"><span class="nm">${ITEMS[k].n} x${P.inv[k]}</span>
         <span class="pr">$${sellPrice(k)}</span>
         <button data-sell="${k}">BÁN</button>
         <button data-sell="${k}" data-all="1">TẤT CẢ</button></div>`);
      mk('BÁN VẬT PHẨM', rows);
      const alive = G.entities.passives.filter(p=>p.pos.distanceTo(P.pos)<14);
      const rows2 = alive.map((p,i)=>
        `<div class="row"><span class="nm">${p.def.n} (sống)</span>
         <span class="pr">$${p.kind==='unicorn'?250:p.kind==='horse'?60:25}</span>
         <button data-live="${i}">BÁN</button></div>`);
      mk('BÁN ĐỘNG VẬT SỐNG (trong 14m)', rows2);
    } else {
      const list = STORE[this.shopKey] || [];
      const rows = list.map(id=>{
        if(id.startsWith('W:')){
          const w = id.slice(2), d = WEAPONS[w];
          const owned = P.weapons.includes(w);
          return `<div class="row ${owned?'dis':''}"><span class="nm">${d.n}</span>
            <span class="pr">$${d.price}</span>
            <button data-buyw="${w}" ${owned?'disabled':''}>${owned?'ĐÃ CÓ':'MUA'}</button></div>`;
        }
        const it = ITEMS[id];
        return `<div class="row"><span class="nm">${it.n}</span>
          <span class="pr">$${it.buy}</span>
          <button data-buy="${id}">MUA</button>
          <button data-buy="${id}" data-x5="1">x5</button></div>`;
      });
      mk(this.shopKey==='gunsmith' ? 'VŨ KHÍ & ĐẠN' : 'VẬT PHẨM', rows);
    }
    cols.querySelectorAll('button').forEach(b=>{
      b.onclick = ()=>{
        const d = b.dataset;
        if(d.buy) this.buy(d.buy, d.x5?5:1);
        if(d.buyw) this.buyWeapon(d.buyw);
        if(d.sell) this.sell(d.sell, d.all ? G.player.inv[d.sell] : 1);
        if(d.live) this.sellLive(+d.live);
        this.renderShop();
      };
    });
  }
  buy(id, n){
    const P=G.player, cost = ITEMS[id].buy*n;
    if(P.money < cost){ Audio.deny(); this.notify('Không đủ tiền!','bad'); return; }
    P.money -= cost; P.add(id, n); Audio.money();
  }
  buyWeapon(w){
    const P=G.player, d=WEAPONS[w];
    if(P.money < d.price){ Audio.deny(); this.notify('Không đủ tiền!','bad'); return; }
    P.money -= d.price; P.giveWeapon(w); Audio.money();
  }
  sell(id, n){
    const P=G.player; n=Math.min(n, P.inv[id]||0); if(!n) return;
    const it = ITEMS[id];
    let total = 0;
    for(let i=0;i<n;i++)
      total += it.sellRange ? Math.round(it.sellRange[0]+Math.random()*(it.sellRange[1]-it.sellRange[0])) : it.sell;
    P.remove(id, n); P.money += total; Audio.money();
    this.notify(`💰 Bán ${it.n} x${n} → $${total}`,'good');
  }
  sellLive(i){
    const P=G.player;
    const list = G.entities.passives.filter(p=>p.pos.distanceTo(P.pos)<14);
    const p = list[i]; if(!p) return;
    const price = p.kind==='unicorn'?250:p.kind==='horse'?60:25;
    if(P.mount===p) P.dismount();
    p.dead = true; G.scene.remove(p.mesh);
    P.money += price; Audio.money();
    this.notify(`💰 Bán ${p.def.n} sống → $${price}`,'good');
  }
}
