// ============ core/Scene.js + InputManager.js + GameLoop.js ============
import * as THREE from 'three';
import { G } from './Game.js';

export function createRenderer(container){
  const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = false;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9fc3e0);
  scene.fog = new THREE.Fog(0x9fc3e0, 90, 900);

  const camera = new THREE.PerspectiveCamera(72, innerWidth/innerHeight, .1, 2200);
  camera.rotation.order = 'YXZ';

  addEventListener('resize', ()=>{
    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
  return { renderer, scene, camera };
}

export class InputManager{
  constructor(dom){
    this.keys = {}; this.pressed = {};
    this.mouse = {dx:0, dy:0, down:false, clicked:false};
    this.locked = false;
    this.sens = .0022;

    addEventListener('keydown', e=>{
      const k = e.code;
      if(!this.keys[k]) this.pressed[k] = true;
      this.keys[k] = true;
      if(['Space','Tab'].includes(k)) e.preventDefault();
    });
    addEventListener('keyup', e=>{ this.keys[e.code] = false; });
    addEventListener('mousemove', e=>{
      if(!this.locked) return;
      this.mouse.dx += e.movementX; this.mouse.dy += e.movementY;
    });
    addEventListener('mousedown', e=>{ if(e.button===0 && this.locked){ this.mouse.down=true; this.mouse.clicked=true; } });
    addEventListener('mouseup',   e=>{ if(e.button===0) this.mouse.down=false; });
    document.addEventListener('pointerlockchange', ()=>{
      this.locked = document.pointerLockElement === dom;
      if(!this.locked && G.state==='PLAYING') G.ui.pause();
    });
    this.dom = dom;
  }
  lock(){ this.dom.requestPointerLock?.(); }
  unlock(){ document.exitPointerLock?.(); }
  down(k){ return !!this.keys[k]; }
  hit(k){ const v = !!this.pressed[k]; this.pressed[k] = false; return v; }
  clicked(){ const v = this.mouse.clicked; this.mouse.clicked = false; return v; }
  flush(){ this.mouse.dx = 0; this.mouse.dy = 0; }
}
