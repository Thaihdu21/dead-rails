import * as THREE from 'three';
import { G } from './core/Game.js';
import { createRenderer, InputManager } from './core/Engine.js';
import { World } from './world/World.js';
import { Train } from './train/Train.js';
import { Player } from './player/Player.js';
import { EntityManager } from './entities/Entities.js';
import { UI } from './ui/UI.js';

const { renderer, scene, camera } = createRenderer(document.getElementById('game'));
G.renderer = renderer; G.scene = scene; G.camera = camera;
G.input    = new InputManager(renderer.domElement);
G.ui       = new UI();
G.entities = new EntityManager(scene);
G.world    = new World(scene);
G.train    = new Train(scene);
G.player   = new Player();

// khởi động: 3 zombie lảng vảng ngoài đồn để làm quen
for(let i=0;i<3;i++) G.entities.spawnEnemy('zombie', 70+i*9, (i%2?1:-1)*20);

renderer.domElement.addEventListener('click', ()=>{
  if(G.state==='PLAYING' && !G.input.locked) G.input.lock();
});

let last = performance.now();
function loop(now){
  requestAnimationFrame(loop);
  const dt = Math.min(.05, (now - last)/1000);
  last = now;

  if(G.state === 'PLAYING'){
    G.dt = dt; G.time += dt;
    G.player.update(dt);
    G.train.update(dt);
    G.world.update(dt, G.train.x);
    G.entities.update(dt);
    G.ui.update();
    if(G.ui.recoilAmt > 0){
      camera.rotation.x += G.ui.recoilAmt;
      G.player.pitch += G.ui.recoilAmt * .35;
      G.ui.recoilAmt *= .55;
      if(G.ui.recoilAmt < .002) G.ui.recoilAmt = 0;
    }
  }
  renderer.render(scene, camera);
}
requestAnimationFrame(loop);
