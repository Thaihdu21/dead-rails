// ==========================================================
//  Constants.js — toàn bộ dữ liệu số của game (viết trước tiên)
// ==========================================================
export const CFG = {
  TOTAL_DISTANCE : 80000,
  START_MONEY    : 50,
  PLAYER_HP      : 100,
  PLAYER_SPEED   : 5.4,
  PLAYER_RUN     : 8.4,
  MOUNT_SPEED    : 13,
  GRAVITY        : 22,
  JUMP           : 7.2,
  EYE            : 1.7,
  TRAIN_HP       : 1000,
  DECK_Y         : 1.75,
  DECK_FRONT     : 8.5,
  DECK_BACK      : -15,
  DECK_HALF_W    : 2.0,
  TRAIN_SPEED    : { slow: 12, normal: 26, fast: 44 },
  FUEL_BURN      : { slow: 0.18, normal: 0.34, fast: 0.66 }, // %/giây
  DAY_LENGTH     : 480,     // 480s thực = 24h in-game
  CHECKPOINT_STOP: 60,      // giây dừng ở checkpoint
  MAX_ENEMIES    : 55,
};

// ---------------- ITEMS ----------------
export const ITEMS = {
  coal          :{n:'Coal (Than)',        buy:8,  sell:4,  fuel:25},
  wood          :{n:'Wood (Gỗ)',                  sell:2,  fuel:9},
  torch         :{n:'Torch (Đuốc)',       buy:5,  sell:2},
  bandage       :{n:'Bandage (Băng)',     buy:10, sell:4,  heal:25},
  snake_oil     :{n:'Snake Oil',          buy:35, sell:15, heal:65},
  banjo         :{n:'Banjo',              buy:20, sell:8},
  dynamite      :{n:'Dynamite',           buy:40, sell:18},
  newspaper     :{n:'Newspaper',          buy:3,  sell:1,  fuel:4},
  holy_water    :{n:'Holy Water',                 sell:30},
  crucifix      :{n:'Crucifix',                   sell:50},
  saddle        :{n:'Saddle (Yên ngựa)',  buy:45, sell:20},
  ammo_revolver :{n:'Đạn Revolver x12',   buy:10, sell:4, ammo:12},
  ammo_rifle    :{n:'Đạn Rifle x8',       buy:15, sell:6, ammo:8},
  ammo_shotgun  :{n:'Đạn Shotgun x6',     buy:12, sell:5, ammo:6},
  ammo_maxim    :{n:'Đạn Maxim x30',      buy:20, sell:8, ammo:30},
  gold_bar      :{n:'Gold Bar',                   sell:50},
  silver_bar    :{n:'Silver Bar',                 sell:30},
  gold_nugget   :{n:'Gold Nugget',                sellRange:[15,25]},
  gold_sculpture:{n:'Gold Sculpture',             sell:45},
  silver_sculpture:{n:'Silver Sculpture',         sell:25},
  gold_picture  :{n:'Gold Picture',               sell:35},
  stone_statue  :{n:'Stone Statue',               sell:5},
  bonds         :{n:'Bonds',                      sell:60},
  vase          :{n:'Vase (Bình cổ)',             sell:12},
  junk          :{n:'Junk',                       sell:5,  fuel:6},
  supply_key    :{n:'Supply Depot Key',           sell:0},
  corpse_zombie :{n:'Xác Zombie',                 sell:0,  fuel:18, corpse:1},
  corpse_outlaw :{n:'Xác Outlaw',                 sell:35, fuel:18, corpse:1},
  corpse_werewolf:{n:'Xác Werewolf',              sell:20, fuel:26, corpse:1},
  corpse_vampire:{n:'Xác Vampire',                sell:15, fuel:22, corpse:1},
  corpse_wolf   :{n:'Xác Sói',                    sell:8,  fuel:16, corpse:1},
  corpse_horse  :{n:'Xác Ngựa',                   sell:20, fuel:30, corpse:1},
  corpse_unicorn:{n:'Xác Kỳ Lân',                 sell:150,fuel:30, corpse:1},
  corpse_prescott:{n:'Xác Captain Prescott',      sell:150,fuel:20, corpse:1},
};

// ---------------- WEAPONS ----------------
export const WEAPONS = {
  knife:{n:'Knife', melee:true, dmg:28, rpm:130, range:2.7},
  torch:{n:'Torch', melee:true, dmg:20, rpm:120, range:2.6, fire:true, light:true},
  vampire_knife:{n:'Vampire Knife', melee:true, dmg:75, rpm:150, range:3.0, lifesteal:.35},
  revolver:{n:'Revolver', dmg:34, mag:6, rpm:150, ammo:'ammo_revolver', spread:.022, range:70, price:35},
  rifle:{n:'Rifle', dmg:55, mag:5, rpm:58, ammo:'ammo_rifle', spread:.004, range:220, price:75},
  shotgun:{n:'Shotgun', dmg:17, pellets:8, mag:6, rpm:80, ammo:'ammo_shotgun', spread:.075, range:28, price:60},
  maxim:{n:'Maxim Gun', dmg:22, mag:30, rpm:520, ammo:'ammo_maxim', spread:.03, range:90, price:125, turret:true},
  revolving_rifle:{n:'Revolving Rifle', dmg:50, mag:6, rpm:110, ammo:'ammo_rifle',
                   spread:.0012, range:170, price:90, headshotKill:true},
};
export const WEAPON_ORDER = ['knife','revolver','shotgun','rifle','revolving_rifle','maxim','torch','vampire_knife'];

// ---------------- MOBS ----------------
export const MOBS = {
  zombie   :{n:'Zombie',      hp:60,  spd:2.0, dmg:9,  detect:38, corpse:'corpse_zombie',   undead:true, h:1.85},
  runner   :{n:'Runner',      hp:60,  spd:5.0, dmg:11, detect:55, corpse:'corpse_zombie',   undead:true, h:1.8},
  banker   :{n:'Zombie Banker',hp:180,spd:2.4, dmg:14, detect:45, corpse:'corpse_zombie',   undead:true, h:1.9},
  wolf     :{n:'Wolf',        hp:100, spd:5.0, dmg:12, detect:45, corpse:'corpse_wolf',     h:1.0},
  werewolf :{n:'Werewolf',    hp:500, spd:6.2, dmg:34, detect:70, corpse:'corpse_werewolf', h:2.6},
  outlaw   :{n:'Outlaw',      hp:100, spd:4.2, dmg:14, detect:60, corpse:'corpse_outlaw',   ranged:true, h:1.85},
  vampire  :{n:'Vampire',     hp:150, spd:4.0, dmg:22, detect:65, corpse:'corpse_vampire',  undead:true, h:1.9},
  prescott :{n:'Captain Prescott',hp:900,spd:4.4,dmg:26,detect:80, corpse:'corpse_prescott',ranged:true, h:2.1},
  horse    :{n:'Horse',       hp:100, spd:7.5, dmg:0,  passive:true, corpse:'corpse_horse',  h:1.9},
  unicorn  :{n:'Unicorn',     hp:100, spd:7.5, dmg:0,  passive:true, corpse:'corpse_unicorn',h:2.0},
};

// ---------------- SHOPS ----------------
export const STORE = {
  general :['coal','torch','bandage','snake_oil','banjo','dynamite','newspaper','saddle'],
  gunsmith:['W:revolver','W:rifle','W:shotgun','W:maxim','W:revolving_rifle',
            'ammo_revolver','ammo_rifle','ammo_shotgun','ammo_maxim'],
};

// ---------------- LOOT ----------------
export const LOOT = {
  house      :[['junk',4],['newspaper',3],['coal',3],['vase',2],['wood',3],
               ['gold_nugget',1],['bandage',1],['ammo_revolver',1],['stone_statue',1]],
  doctor     :[['bandage',5],['snake_oil',2],['junk',2],['newspaper',1]],
  church     :[['holy_water',3],['crucifix',2],['junk',1]],
  gunsmith_ab:[['ammo_revolver',3],['ammo_rifle',3],['ammo_shotgun',2],
               ['W:revolver',1],['W:revolving_rifle',1]],
  sheriff    :[['ammo_revolver',3],['W:revolving_rifle',1],['money',3],['bandage',1]],
  outlaw     :[['ammo_rifle',3],['ammo_revolver',3],['money',4],['dynamite',2],
               ['W:revolving_rifle',1],['W:rifle',1]],
  town       :[['junk',3],['gold_nugget',2],['silver_sculpture',1],['gold_picture',1],
               ['vase',2],['coal',2],['bandage',1]],
  vault      :[['gold_bar',4],['silver_bar',4],['bonds',3],['money',4],['gold_sculpture',2]],
  castle     :[['gold_bar',4],['silver_bar',3],['bonds',2],['W:vampire_knife',1],
               ['crucifix',1],['gold_sculpture',1]],
  depot      :[['ammo_maxim',3],['ammo_rifle',3],['bandage',4],['bonds',2],
               ['W:maxim',1],['W:rifle',1],['dynamite',2]],
};

// ---------------- UTIL ----------------
export const UTILITY_ORDER = ['dynamite','holy_water','crucifix','banjo','newspaper','saddle'];

export function mulberry32(a){
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export const rnd  = (r,a,b)=>a+(b-a)*r();
export const pick = (r,arr)=>arr[Math.floor(r()*arr.length)];

export function rollLoot(tableName, rng, count){
  const table = LOOT[tableName] || LOOT.house;
  const pool = [];
  table.forEach(([id,w])=>{ for(let i=0;i<w;i++) pool.push(id); });
  const out = {};
  const n = count ?? (2 + Math.floor(rng()*4));
  for(let i=0;i<n;i++){
    const id = pool[Math.floor(rng()*pool.length)];
    out[id] = (out[id]||0) + 1;
  }
  return out;
}
