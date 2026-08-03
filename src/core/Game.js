// Singleton chia sẻ trạng thái giữa các module (tránh circular import)
export const G = {
  state:'MENU',            // MENU | PLAYING | PAUSED | SHOP | GAMEOVER | WIN
  scene:null, camera:null, renderer:null,
  world:null, train:null, player:null, entities:null, ui:null, input:null,
  time:0, dt:0,
  gameTime: 8*3600,        // giây in-game (bắt đầu 08:00)
  isNight:false, moon:'none',
  kills:0,
};
