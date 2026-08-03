// ============ assets/ProceduralTextures.js + ProceduralAudio.js ============
import * as THREE from 'three';

const _cache = {};
function makeTex(key, draw, size = 64, rep = [1,1]){
  if(_cache[key]) return _cache[key];
  const c = document.createElement('canvas'); c.width = c.height = size;
  const x = c.getContext('2d'); draw(x, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep[0], rep[1]);
  t.colorSpace = THREE.SRGBColorSpace;
  _cache[key] = t; return t;
}
const noiseFill = (x,s,base,amt)=>{
  x.fillStyle = base; x.fillRect(0,0,s,s);
  for(let i=0;i<s*s*0.6;i++){
    const a = Math.random()*amt;
    x.fillStyle = `rgba(0,0,0,${a})`;
    x.fillRect(Math.random()*s|0, Math.random()*s|0, 1, 1);
  }
};

export const TEX = {
  sand : ()=>makeTex('sand', (x,s)=>{
      noiseFill(x,s,'#c9a870',.14);
      for(let i=0;i<40;i++){ x.fillStyle='rgba(255,240,200,.18)';
        x.fillRect(Math.random()*s,Math.random()*s,Math.random()*8|0,1); }
    }, 64, [300,300]),
  wood : ()=>makeTex('wood', (x,s)=>{
      noiseFill(x,s,'#7a5230',.18);
      for(let i=0;i<8;i++){ x.fillStyle='rgba(0,0,0,.28)'; x.fillRect(i*(s/8),0,1,s);
        x.fillStyle='rgba(255,220,170,.07)'; x.fillRect(i*(s/8)+2,0,2,s); }
    }, 64, [2,2]),
  darkwood:()=>makeTex('dwood',(x,s)=>{
      noiseFill(x,s,'#4a3320',.2);
      for(let i=0;i<6;i++){ x.fillStyle='rgba(0,0,0,.35)'; x.fillRect(0,i*(s/6),s,1); }
    }, 64, [2,2]),
  stone: ()=>makeTex('stone',(x,s)=>{
      noiseFill(x,s,'#6e6a63',.2);
      x.strokeStyle='rgba(0,0,0,.35)';
      for(let r=0;r<4;r++) for(let c=0;c<4;c++)
        x.strokeRect(c*(s/4)+(r%2?4:0), r*(s/4), s/4, s/4);
    }, 64, [3,3]),
  roof : ()=>makeTex('roof',(x,s)=>{
      noiseFill(x,s,'#5d2f1e',.18);
      for(let i=0;i<10;i++){ x.fillStyle='rgba(0,0,0,.25)'; x.fillRect(0,i*(s/10),s,1); }
    }, 64, [3,3]),
  metal: ()=>makeTex('metal',(x,s)=>{ noiseFill(x,s,'#3b3b40',.25); }, 32, [1,1]),
};

// ---------------- ProceduralAudio.js ----------------
export const Audio = {
  ctx:null, master:null, noiseBuf:null, lastChug:0,
  init(){
    if(this.ctx) return;
    this.ctx = new (window.AudioContext||window.webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.gain.value = .35;
    this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate*2;
    const b = this.ctx.createBuffer(1,len,this.ctx.sampleRate);
    const d = b.getChannelData(0);
    for(let i=0;i<len;i++) d[i] = Math.random()*2-1;
    this.noiseBuf = b;
  },
  _noise(dur, type, freq, gain, q=1){
    const c=this.ctx, src=c.createBufferSource(); src.buffer=this.noiseBuf; src.loop=true;
    const f=c.createBiquadFilter(); f.type=type; f.frequency.value=freq; f.Q.value=q;
    const g=c.createGain(); g.gain.setValueAtTime(gain,c.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(); src.stop(c.currentTime+dur);
  },
  _tone(freq, dur, type='sine', gain=.2, slideTo=null){
    const c=this.ctx, o=c.createOscillator(), g=c.createGain();
    o.type=type; o.frequency.setValueAtTime(freq,c.currentTime);
    if(slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime+dur);
    g.gain.setValueAtTime(gain,c.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+dur);
    o.connect(g); g.connect(this.master); o.start(); o.stop(c.currentTime+dur);
  },
  shot(kind='revolver'){
    if(!this.ctx) return;
    const p = {revolver:[.18,900,.55], rifle:[.28,600,.7], shotgun:[.32,420,.8],
               maxim:[.09,1200,.4], revolving_rifle:[.26,650,.65]}[kind]||[.18,900,.5];
    this._noise(p[0],'lowpass',p[1],p[2]);
    this._tone(160,.12,'square',.12,45);
  },
  melee(){ if(this.ctx) this._noise(.12,'bandpass',1800,.3,2); },
  hit(){ if(this.ctx) this._noise(.07,'bandpass',2600,.25,3); },
  explosion(){ if(!this.ctx) return; this._noise(.9,'lowpass',260,.95); this._tone(70,.7,'sawtooth',.4,25); },
  thunder(){ if(!this.ctx) return; this._noise(1.4,'lowpass',420,.9,.7); this._tone(50,1.1,'sine',.35,20); },
  pickup(){ if(!this.ctx) return; this._tone(660,.09,'square',.16); setTimeout(()=>this._tone(990,.1,'square',.14),70); },
  money(){ if(!this.ctx) return; [880,1180,1480].forEach((f,i)=>setTimeout(()=>this._tone(f,.1,'triangle',.15),i*60)); },
  deny(){ if(this.ctx) this._tone(150,.18,'square',.15,80); },
  growl(){ if(this.ctx) this._noise(.55,'lowpass',300,.22,1.4); },
  howl(){ if(!this.ctx) return; this._tone(300,1.1,'sawtooth',.18,160); },
  hurt(){ if(!this.ctx) return; this._tone(220,.25,'sawtooth',.22,90); },
  banjo(){ if(!this.ctx) return;
    [392,494,587,784,587,494].forEach((f,i)=>setTimeout(()=>this._tone(f,.32,'triangle',.16),i*160)); },
  chug(speed){
    if(!this.ctx || speed<=0) return;
    const now = this.ctx.currentTime;
    const gap = Math.max(.28, 1.6 - speed*.03);
    if(now - this.lastChug < gap) return;
    this.lastChug = now;
    this._noise(.16,'lowpass',180,.28);
  },
  whistle(){ if(!this.ctx) return;
    this._tone(520,.9,'sawtooth',.18); this._tone(660,.9,'sine',.12); },
};
