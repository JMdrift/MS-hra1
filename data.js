/* ═══════════ MOJE STAVBA — data a konfigurace ═══════════ */

const C = {
  grass:'#6E8A4C', meadow:'#96984C', forest:'#4F6B41', quarry:'#7C817C', clay:'#A3673F',
  road:'#A08659', dirt:'#8A7A50', wood:'#9C7442', woodD:'#77572F', log:'#8A6437',
  stone:'#8E938F', stoneD:'#6E736F', thatch:'#C8AF5A', tile:'#B65A3C', slate:'#5A6470',
  leaf1:'#5E8A45', leaf2:'#6E9A4E', leaf3:'#B0803A', wheat:'#C6AC4E', brick:'#A85B3E',
  concrete:'#A7ABA4', coal:'#33383D', asphalt:'#5E6266', steel:'#8892A0',
  glass:'#7FA8B8', plaster:'#D8CBB0', park:'#5C8A46',
  amber:'#E9A63C', green:'#8FBB5C', red:'#D9584A', sky:'#77AEC9'
};
const GAME_VER = 'verze 4 · srpen 2026';
const CUR = '¤';
const fmt  = n => Math.round(n).toLocaleString('cs-CZ') + ' ' + CUR;
const fmtN = n => Math.round(n).toLocaleString('cs-CZ');
/* krátký zápis do hlavičky: 8 420 → 8,4k · 1 250 000 → 1,25M */
function shortN(n) {
  n = Math.round(n);
  if (n >= 1e9) return (n/1e9).toFixed(n<1e10?2:1).replace('.',',')+'B';
  if (n >= 1e6) return (n/1e6).toFixed(n<1e7?2:1).replace('.',',')+'M';
  if (n >= 10000) return (n/1000).toFixed(n<1e5?1:0).replace('.',',')+'k';
  return n.toLocaleString('cs-CZ');
}

/* ─── suroviny ─── */
const RES = [
  { k:'drevo', l:'Dřevo',  c:C.log,     price:8,  ic:'log',   tier:0 },
  { k:'kamen', l:'Kámen',  c:C.stone,   price:12, ic:'rock',  tier:0 },
  { k:'slama', l:'Sláma',  c:C.wheat,   price:6,  ic:'wheat', tier:0 },
  { k:'hlina', l:'Hlína',  c:C.clay,    price:10, ic:'clay',  tier:0 },
  { k:'uhli',  l:'Uhlí',   c:'#4A5157', price:16, ic:'coal',  tier:0 },
  { k:'uran',  l:'Uran',   c:'#7FC24A', price:70, ic:'uran',  tier:0 }
];
const MAT = [
  { k:'prkno', l:'Prkna',  c:'#C09454', price:26, ic:'plank',  tier:1 },
  { k:'sterk', l:'Štěrk',  c:'#A6ABA5', price:34, ic:'gravel', tier:1 },
  { k:'cihla', l:'Cihly',  c:C.brick,   price:30, ic:'brick',  tier:1 },
  { k:'balik', l:'Balíky', c:'#D6C066', price:22, ic:'bale',   tier:1 }
];
const HIGH = [
  { k:'tram',    l:'Trámy',   c:'#B8823E', price:78, ic:'beam',  tier:2 },
  { k:'dlazba',  l:'Dlažba',  c:'#9BA3A8', price:92, ic:'pave',  tier:2 },
  { k:'obklad',  l:'Obklady', c:'#C2705A', price:86, ic:'tileM', tier:2 },
  { k:'izolace', l:'Izolace', c:'#D9CE86', price:70, ic:'insul', tier:2 }
];
const IRON = [
  { k:'ruda',     l:'Ruda',     c:'#8C6A5A', price:40,  ic:'ore',   tier:3 },
  { k:'roxor',    l:'Roxory',   c:'#9CA3AA', price:150, ic:'rebar', tier:3 },
  { k:'traverza', l:'Traverzy', c:'#7E8890', price:420, ic:'beamI', tier:3 }
];
const MTN = [
  { k:'zula',     l:'Žula',      c:'#9A8E86', price:520,  ic:'granite', tier:4 },
  { k:'bridlice', l:'Břidlice',  c:'#5E6470', price:600,  ic:'slate2',  tier:4 },
  { k:'kremen',   l:'Křemen',    c:'#C6CEDA', price:720,  ic:'quartz',  tier:4 },
  { k:'kvadr',    l:'Kvádry',    c:'#B0A498', price:1050, ic:'block',   tier:4 },
  { k:'tabule',   l:'Tabule',    c:'#6E7684', price:1250, ic:'shingle', tier:4 },
  { k:'sklo',     l:'Sklo',      c:'#A8D0DC', price:1550, ic:'pane',    tier:4 }
];
const ALL = [...RES, ...MAT, ...HIGH, ...IRON, ...MTN];
const RL = k => ALL.find(r => r.k === k);
const isMtnRes = k => { const r = RL(k); return !!r && r.tier >= 4; };
/* horské suroviny: tři těžené a tři zpracované */
const MTNR = MTN.filter(r => ['zula','bridlice','kremen'].indexOf(r.k) >= 0);
const MTNM = MTN.filter(r => ['kvadr','tabule','sklo'].indexOf(r.k) >= 0);
const BUY_MUL = 2.4;

/* ─── XP a levely ─── */
const LVL_STEP = [100,140,180,220,280,340,400,460,520,600,700,800,900,1000,
  1200,1400,1600,1800,2000,2400,2800,3200,3600,4000,4600,5200,5800,6400,7000,
  7800,8600,9400,10400,11400,12600,13800,15200,16600,18200,20000,
  22000,24000,26500,29000,32000,35000,38500,42000,46000,50000,
  55000,60000,66000,72000,79000,86000,94000,103000,112000,
  122000,133000,145000,158000,172000,188000,205000,224000,244000,266000,
  290000,316000,344000,375000,408000,444000,484000,527000,574000,625000,
  /* horský kraj */
  680000,740000,805000,875000,952000,1035000,1125000,1223000,1329000,1445000,
  1570000,1706000,1854000,2015000,2190000,2380000,2586000,2810000,3053000,3318000,
  3605000,3917000,4256000,4624000,5024000,5459000,5932000,6446000,7005000,7613000];
const LVL = [0];
LVL_STEP.forEach(v => LVL.push(LVL[LVL.length-1] + v));
const MAXLVL = LVL.length;
const XPC = 4, XPFIRST = 25, XPMOW = 25;

/* ═══════════ STAVBY ═══════════ */
const CAB_UP = [
  { reqLvl:12, cost:800,  need:{drevo:20,kamen:12}, dur:12000, rentMul:1.8, xp:260, label:'Přístavba a zápraží' },
  { reqLvl:24, cost:3500, need:{prkno:18,cihla:12}, dur:18000, rentMul:3.0, xp:900, label:'Zděná přístavba a komín' }
];
const BIG_UP = [
  { reqLvl:24, cost:6000,  need:{prkno:25,cihla:20}, dur:20000, rentMul:1.7, xp:1200, label:'Podkroví a terasa' },
  { reqLvl:29, cost:22000, need:{sterk:40,balik:30}, dur:26000, rentMul:2.6, xp:3200, label:'Druhé podlaží' }
];

const BUILDINGS = {
  chatka: {
    name:'Chatka', dur:15000, money:350, rent:14, rentCap:150, reqLvl:1, span:2, up:CAB_UP,
    vars:[
      { n:'Dřevěná',  style:{ wall:C.wood,    roof:C.thatch, roofT:'gable', chim:false }, mix:{} },
      { n:'Kamenná',  style:{ wall:C.stone,   roof:C.slate,  roofT:'gable', chim:true  }, mix:{drevo:'kamen'} },
      { n:'Hrázděná', style:{ wall:'#C4A46A', roof:C.tile,   roofT:'hip',   chim:true  }, mix:{slama:'hlina'} }],
    ph:[
      { n:'Kamenné patky',  need:{kamen:6}, xp:45 },
      { n:'Trámová kostra', need:{drevo:8}, xp:55 },
      { n:'Stěny',          need:{drevo:8}, xp:65 },
      { n:'Krov',           need:{drevo:6}, xp:65 },
      { n:'Střecha',        need:{slama:8}, xp:85 }]
  },
  sklad: {
    name:'Sklad', dur:25000, money:0, rent:0, reqLvl:5, span:2, store:true,
    vars:[{ n:'Dřevěný', style:{ wall:C.wood, roof:C.thatch, roofT:'gable', chim:false }, mix:{} }],
    ph:[
      { n:'Betonová deska',  need:{kamen:12}, xp:70 },
      { n:'Nosné sloupy',    need:{drevo:10}, xp:80 },
      { n:'Bednění stěn',    need:{drevo:10}, xp:90 },
      { n:'Krov',            need:{drevo:10}, xp:90 },
      { n:'Střecha a vrata', need:{slama:14}, xp:110 }]
  },
  dvur: {
    name:'Stavební dvůr', dur:20000, money:400, rent:0, reqLvl:6, span:3, big:true,
    office:true,
    up:[
      { reqLvl:20, cost:9000,  need:{prkno:30,cihla:24}, dur:18000, xp:2200, label:'Druhá kancelář' },
      { reqLvl:30, cost:45000, need:{sterk:60,dlazba:30}, dur:26000, xp:9000, label:'Dispečink a váha' }],
    vars:[
      { n:'Dřevěný',  style:{ wall:C.wood,    roof:C.thatch, roofT:'gable', chim:false }, mix:{} },
      { n:'Zděný',    style:{ wall:'#C8A070', roof:C.tile,   roofT:'hip',   chim:true  }, mix:{drevo:'kamen'} },
      { n:'Plechový', style:{ wall:C.steel,   roof:C.slate,  roofT:'gable', chim:false }, mix:{slama:'kamen'} }],
    ph:[
      { n:'Zpevněná plocha', need:{kamen:14}, xp:110 },
      { n:'Sklad materiálu', need:{drevo:14}, xp:120 },
      { n:'Kancelář',        need:{drevo:12,slama:8}, xp:130 },
      { n:'Váha a rampa',    need:{kamen:10,drevo:8}, xp:150 }]
  },
  dum: {
    name:'Rodinný dům', dur:45000, money:1200, rent:55, rentCap:560,
    reqLvl:15, span:3, big:true, up:BIG_UP,
    vars:[
      { n:'Omítaný', style:{ wall:'#CFA277', roof:C.tile,   roofT:'hip',   chim:true }, mix:{} },
      { n:'Cihlový', style:{ wall:C.brick,   roof:C.slate,  roofT:'hip',   chim:true }, mix:{hlina:'kamen'} },
      { n:'Roubený', style:{ wall:C.woodD,   roof:C.thatch, roofT:'gable', chim:true }, mix:{kamen:'drevo'} }],
    ph:[
      { n:'Základová deska',  need:{kamen:20}, xp:150 },
      { n:'Nosná konstrukce', need:{drevo:20}, xp:160 },
      { n:'Obvodové zdivo',   need:{drevo:25,hlina:15}, xp:180 },
      { n:'Příčky a komín',   need:{hlina:15,kamen:10}, xp:180 },
      { n:'Krov',             need:{drevo:15}, xp:200 },
      { n:'Střešní krytina',  need:{slama:25}, xp:230 }]
  },
  cinzak: {
    name:'Činžák', dur:60000, money:1500, rent:190, rentCap:1900,
    reqLvl:24, span:2, big:true, draw:[20,35,55], wdraw:[0,0,25], needPower:true,
    up:[
      { reqLvl:26, cost:12000, need:{cihla:40,prkno:30}, dur:22000, rentMul:1.9, xp:2600, label:'Třetí podlaží' },
      { reqLvl:29, cost:38000, need:{cihla:70,sterk:50}, dur:28000, rentMul:3.1, xp:6000, label:'Čtvrté podlaží a výtah' }],
    vars:[
      { n:'Cihlový',  style:{ wall:'#B0674C',  roof:C.tile,  roofT:'hip', chim:true  }, mix:{} },
      { n:'Panelový', style:{ wall:C.concrete, roof:C.slate, roofT:'hip', chim:false }, mix:{cihla:'sterk'} },
      { n:'Omítaný',  style:{ wall:'#C9A878',  roof:C.tile,  roofT:'hip', chim:true  }, mix:{prkno:'cihla'} }],
    ph:[
      { n:'Základová deska',    need:{sterk:20}, xp:400 },
      { n:'Nosné zdivo',        need:{cihla:26}, xp:440 },
      { n:'Stropy',             need:{prkno:22}, xp:470 },
      { n:'Druhé podlaží',      need:{cihla:24}, xp:500 },
      { n:'Střecha',            need:{prkno:16,balik:10}, xp:540 },
      { n:'Rozvody a přípojka', need:{sterk:14,prkno:10}, xp:580 }]
  },
  vila: {
    name:'Vila', dur:90000, money:4000, rent:320, rentCap:3200,
    reqLvl:27, span:3, big:true, draw:[45,70,100], wdraw:[0,30,50], needPower:true,
    up:[
      { reqLvl:31, cost:30000, need:{tram:24,obklad:20},   dur:26000, rentMul:1.8, xp:5200,  label:'Bazén a zimní zahrada' },
      { reqLvl:35, cost:90000, need:{dlazba:40,izolace:34},dur:32000, rentMul:2.8, xp:12000, label:'Druhé křídlo' }],
    vars:[
      { n:'Moderní', style:{ wall:C.plaster,  roof:C.slate,  roofT:'hip',   chim:false }, mix:{} },
      { n:'Cihlová', style:{ wall:C.brick,    roof:C.tile,   roofT:'hip',   chim:true  }, mix:{dlazba:'obklad'} },
      { n:'Dřevěná', style:{ wall:'#A87F49',  roof:C.thatch, roofT:'gable', chim:true  }, mix:{obklad:'tram'} }],
    ph:[
      { n:'Výkop a základy',  need:{sterk:30}, xp:900 },
      { n:'Nosné zdivo',      need:{cihla:36}, xp:960 },
      { n:'Stropy z trámů',   need:{tram:20},  xp:1050 },
      { n:'Příčky a rozvody', need:{obklad:18,prkno:16}, xp:1120 },
      { n:'Zateplení',        need:{izolace:22}, xp:1200 },
      { n:'Fasáda a dlažba',  need:{dlazba:24}, xp:1300 }]
  },
  park: {
    name:'Park', dur:60000, money:0, rent:0, reqLvl:27, span:2, park:true,
    boost:[0.15, 0.30, 0.50],
    up:[
      { reqLvl:30, cost:22000, need:{prkno:30,dlazba:18}, dur:20000, xp:3800, label:'Dětské hřiště' },
      { reqLvl:34, cost:60000, need:{tram:30,izolace:24}, dur:26000, xp:9000, label:'Jezírko a altán' }],
    vars:[
      { n:'Anglický',    style:{ wall:C.park,    roof:C.leaf1, roofT:'hip', chim:false }, mix:{} },
      { n:'Francouzský', style:{ wall:'#6E9A55', roof:C.leaf2, roofT:'hip', chim:false }, mix:{prkno:'dlazba'} },
      { n:'Lesopark',    style:{ wall:'#4F7A3E', roof:C.leaf1, roofT:'hip', chim:false }, mix:{dlazba:'tram'} }],
    ph:[
      { n:'Terénní úpravy', need:{sterk:18},   xp:700 },
      { n:'Cestičky',       need:{dlazba:14},  xp:780 },
      { n:'Výsadba',        need:{izolace:12}, xp:840 },
      { n:'Lavičky a plot', need:{prkno:18},   xp:900 }]
  },
  hotel: {
    name:'Hotel', dur:150000, money:6000, rent:520, rentCap:5200,
    reqLvl:52, span:3, big:true, draw:[70,110,160], wdraw:[60,90,140],
    needPower:true, needWater:true,
    up:[
      { reqLvl:55, cost:70000,  need:{tram:40,obklad:34},   dur:30000, rentMul:1.8, xp:14000, label:'Boční křídlo' },
      { reqLvl:59, cost:220000, need:{dlazba:70,izolace:60},dur:36000, rentMul:2.9, xp:32000, label:'Wellness a bazén' }],
    vars:[
      { n:'Lázeňský', style:{ wall:C.plaster,  roof:C.tile,  roofT:'hip', chim:true  }, mix:{} },
      { n:'Moderní',  style:{ wall:C.glass,    roof:C.slate, roofT:'hip', chim:false }, mix:{obklad:'dlazba'} },
      { n:'Horský',   style:{ wall:'#A8825A',  roof:C.thatch,roofT:'gable',chim:true }, mix:{dlazba:'tram'} }],
    ph:[
      { n:'Výkop a základy',   need:{sterk:50}, xp:2000 },
      { n:'Nosný skelet',      need:{tram:36},  xp:2200 },
      { n:'Obvodové zdivo',    need:{cihla:60}, xp:2400 },
      { n:'Pokoje a příčky',   need:{prkno:44,obklad:30}, xp:2600 },
      { n:'Zateplení',         need:{izolace:36}, xp:2800 },
      { n:'Fasáda a terasy',   need:{dlazba:40}, xp:3100 }]
  },
  parkoviste: {
    name:'Parkoviště', dur:60000, money:2500, rent:170, rentCap:1700,
    reqLvl:34, span:3, big:true, draw:[25,40,60], wdraw:[0,0,20], needPower:true,
    up:[
      { reqLvl:38, cost:40000,  need:{dlazba:30,cihla:26}, dur:20000, rentMul:1.8, xp:7000,  label:'Závory a osvětlení' },
      { reqLvl:44, cost:130000, need:{tram:44,obklad:36},  dur:26000, rentMul:2.8, xp:18000, label:'Patrové parkoviště' }],
    vars:[
      { n:'Asfaltové', style:{ wall:C.asphalt,  roof:C.slate, roofT:'hip', chim:false }, mix:{} },
      { n:'Dlážděné',  style:{ wall:'#9AA0A2',  roof:C.slate, roofT:'hip', chim:false }, mix:{cihla:'dlazba'} },
      { n:'Zelené',    style:{ wall:'#6E8A55',  roof:C.leaf1, roofT:'hip', chim:false }, mix:{sterk:'izolace'} }],
    ph:[
      { n:'Srovnání plochy',  need:{sterk:34}, xp:900 },
      { n:'Zpevnění povrchu', need:{dlazba:26}, xp:1000 },
      { n:'Vodorovné značení',need:{cihla:20}, xp:1100 },
      { n:'Osvětlení a vjezd',need:{prkno:22,izolace:14}, xp:1250 }]
  },
  stanek: {
    name:'Stánek', dur:30000, money:900, rent:85, rentCap:850,
    reqLvl:33, span:2, draw:[10,16,24], needPower:true,
    up:[
      { reqLvl:37, cost:16000, need:{prkno:24,obklad:16}, dur:14000, rentMul:1.9, xp:3200, label:'Zastřešená terasa' },
      { reqLvl:42, cost:55000, need:{tram:28,dlazba:22},  dur:20000, rentMul:3.0, xp:9000, label:'Kuchyně a zázemí' }],
    vars:[
      { n:'Kavárna',   style:{ wall:'#B5794A', roof:'#C2503C', roofT:'gable', chim:true  }, mix:{} },
      { n:'Bistro',    style:{ wall:'#8FA45C', roof:C.slate,   roofT:'gable', chim:true  }, mix:{obklad:'dlazba'} },
      { n:'Zmrzlina',  style:{ wall:'#D9C9A6', roof:'#77AEC9', roofT:'hip',   chim:false }, mix:{cihla:'prkno'} }],
    ph:[
      { n:'Základ a přípojka', need:{sterk:14}, xp:340 },
      { n:'Buňka a pult',      need:{prkno:18}, xp:380 },
      { n:'Markýza a vybavení',need:{cihla:14,obklad:10}, xp:430 }]
  },
  kolotoc: {
    name:'Kolotoč', dur:60000, money:20000, rent:520, rentCap:5200,
    reqLvl:58, span:2, big:true, draw:[60,90,130], wdraw:[10,20,30], needPower:true, needWater:true,
    up:[
      { reqLvl:61, cost:120000, need:{roxor:40,dlazba:50}, dur:80000, rentMul:1.8, xp:24000, label:'Světelná show' },
      { reqLvl:66, cost:380000, need:{traverza:40,obklad:70}, dur:100000, rentMul:2.8, xp:60000, label:'Dvoupatrový kolotoč' }],
    vars:[
      { n:'Klasický', style:{ wall:'#C4503C', roof:'#E3A63C', roofT:'hip', chim:false }, mix:{} },
      { n:'Pouťový',  style:{ wall:'#7C4FA0', roof:'#E3A63C', roofT:'hip', chim:false }, mix:{dlazba:'obklad'} },
      { n:'Retro',    style:{ wall:'#3C7C9A', roof:'#D9CE86', roofT:'hip', chim:false }, mix:{obklad:'prkno'} }],
    ph:[
      { n:'Betonová deska', need:{sterk:50}, xp:2400 },
      { n:'Nosná osa',      need:{roxor:24}, xp:2600 },
      { n:'Sedačky a plášť',need:{prkno:60,obklad:34}, xp:2900 },
      { n:'Osvětlení',      need:{dlazba:40}, xp:3200 }]
  },
  dracha: {
    name:'Horská dráha', dur:120000, money:70000, rent:1150, rentCap:11500,
    reqLvl:60, span:4, big:true, draw:[180,260,360], wdraw:[20,40,60], needPower:true, needWater:true,
    up:[
      { reqLvl:64, cost:420000,  need:{traverza:50,roxor:120}, dur:140000, rentMul:1.8, xp:70000,  label:'Loop a druhý vlak' },
      { reqLvl:70, cost:1400000, need:{traverza:140,dlazba:200}, dur:170000, rentMul:2.7, xp:180000, label:'Prodloužená trať' }],
    vars:[
      { n:'Ocelová',  style:{ wall:'#9CA3AA', roof:'#C4503C', roofT:'hip', chim:false }, mix:{} },
      { n:'Dřevěná',  style:{ wall:'#A87F49', roof:'#8FA45C', roofT:'gable', chim:false }, mix:{roxor:'tram'} },
      { n:'Neonová',  style:{ wall:'#3C7C9A', roof:'#7C4FA0', roofT:'hip', chim:false }, mix:{dlazba:'obklad'} }],
    ph:[
      { n:'Piloty',        need:{sterk:120}, xp:9000 },
      { n:'Ocelová kostra',need:{roxor:90},  xp:9800 },
      { n:'Kolejnice',     need:{traverza:30}, xp:10600 },
      { n:'Vlaky a stanice',need:{prkno:120,obklad:80}, xp:11400 },
      { n:'Zábradlí a světla', need:{dlazba:90,izolace:70}, xp:12400 }]
  },
  aquapark: {
    name:'Aquapark', dur:150000, money:110000, rent:1500, rentCap:15000,
    reqLvl:62, span:4, big:true, draw:[220,320,440], wdraw:[260,380,520], needPower:true, needWater:true,
    up:[
      { reqLvl:67, cost:600000,  need:{traverza:70,obklad:180}, dur:160000, rentMul:1.8, xp:100000, label:'Tobogány a vlnobití' },
      { reqLvl:72, cost:2000000, need:{traverza:180,dlazba:280},dur:190000, rentMul:2.8, xp:260000, label:'Krytá hala a sauny' }],
    vars:[
      { n:'Tropický', style:{ wall:'#4FA0B8', roof:'#D9CE86', roofT:'hip', chim:false }, mix:{} },
      { n:'Laguna',   style:{ wall:'#3C8C7C', roof:'#C4A46A', roofT:'hip', chim:false }, mix:{obklad:'dlazba'} },
      { n:'Městský',  style:{ wall:'#8FA8B8', roof:'#7E8890', roofT:'hip', chim:false }, mix:{dlazba:'roxor'} }],
    ph:[
      { n:'Výkop bazénů',  need:{sterk:160}, xp:12000 },
      { n:'Vany a izolace',need:{obklad:120,izolace:110}, xp:13000 },
      { n:'Technologie',   need:{roxor:100}, xp:14000 },
      { n:'Tobogány',      need:{traverza:40}, xp:15000 },
      { n:'Dlažba a lehátka', need:{dlazba:130,prkno:140}, xp:16500 }]
  },
  hala: {
    name:'Expediční hala', dur:70000, money:40000, rent:600, rentCap:6000,
    reqLvl:52, span:2, big:true, draw:[90,140,200], wdraw:[30,50,80], needPower:true,
    up:[
      { reqLvl:58, cost:300000,  need:{roxor:60,dlazba:70},    dur:90000,  rentMul:1.8, xp:40000,  label:'Nakládací rampy' },
      { reqLvl:66, cost:1100000, need:{traverza:70,obklad:120},dur:120000, rentMul:2.8, xp:120000, label:'Jeřábová dráha' }],
    vars:[
      { n:'Plechová', style:{ wall:'#8E959C', roof:C.slate, roofT:'gable', chim:false }, mix:{} },
      { n:'Zděná',    style:{ wall:C.brick,   roof:C.tile,  roofT:'gable', chim:true  }, mix:{dlazba:'cihla'} },
      { n:'Ocelová',  style:{ wall:'#6E736F', roof:'#4E5450',roofT:'gable',chim:false }, mix:{obklad:'roxor'} }],
    ph:[
      { n:'Zpevněná plocha', need:{sterk:70}, xp:5200 },
      { n:'Ocelový skelet',  need:{roxor:50}, xp:5800 },
      { n:'Opláštění',       need:{obklad:60,izolace:50}, xp:6400 },
      { n:'Vrata a rampa',   need:{dlazba:60,prkno:80}, xp:7000 }]
  },
  vetrnik: {
    name:'Větrná elektrárna', dur:80000, money:6000, rent:200, rentCap:2000,
    reqLvl:66, span:2, gen:[120,200,320], wdraw:[0,0,0],
    up:[
      { reqLvl:70, cost:900000,  need:{roxor:90,dlazba:80},     dur:100000, rentMul:1.8, xp:80000,  label:'Delší listy' },
      { reqLvl:75, cost:3000000, need:{traverza:90,izolace:140},dur:130000, rentMul:2.8, xp:220000, label:'Vyšší stožár' }],
    vars:[
      { n:'Bílá',   style:{ wall:'#D6D9D2', roof:'#B8BCB4', roofT:'hip', chim:false }, mix:{} },
      { n:'Šedá',   style:{ wall:'#9CA3AA', roof:'#7E8890', roofT:'hip', chim:false }, mix:{obklad:'roxor'} },
      { n:'Červená',style:{ wall:'#C4503C', roof:'#8E959C', roofT:'hip', chim:false }, mix:{dlazba:'cihla'} }],
    ph:[
      { n:'Betonová patka', need:{sterk:90}, xp:9000 },
      { n:'Stožár',         need:{roxor:60}, xp:10000 },
      { n:'Gondola',        need:{traverza:20,obklad:50}, xp:11000 },
      { n:'Listy rotoru',   need:{izolace:60,dlazba:50}, xp:12000 }]
  },
  vodni: {
    name:'Vodní elektrárna', dur:180000, money:60000, rent:900, rentCap:9000,
    reqLvl:68, span:3, big:true, gen:[600,1000,1600],
    up:[
      { reqLvl:73, cost:6000000,  need:{traverza:180,roxor:300}, dur:200000, rentMul:1.7, xp:400000,  label:'Druhá turbína' },
      { reqLvl:78, cost:20000000, need:{traverza:400,dlazba:500},dur:240000, rentMul:2.6, xp:1000000, label:'Zvýšení hráze' }],
    vars:[
      { n:'Betonová', style:{ wall:C.concrete, roof:C.slate, roofT:'hip', chim:false }, mix:{} },
      { n:'Kamenná',  style:{ wall:'#8E938F',  roof:'#5A6470',roofT:'hip', chim:false }, mix:{dlazba:'kamen'} },
      { n:'Moderní',  style:{ wall:'#8FB6C6',  roof:'#4E5450',roofT:'hip', chim:false }, mix:{obklad:'roxor'} }],
    ph:[
      { n:'Odvedení řeky',   need:{sterk:200}, xp:24000 },
      { n:'Základ hráze',    need:{sterk:260,roxor:120}, xp:26000 },
      { n:'Těleso hráze',    need:{roxor:200}, xp:28000 },
      { n:'Strojovna',       need:{traverza:90}, xp:30000 },
      { n:'Turbíny',         need:{traverza:120,obklad:150}, xp:33000 },
      { n:'Přeliv a rozvodna',need:{dlazba:200,izolace:180}, xp:36000 }]
  },
  mestansky: {
    name:'Měšťanský dům', dur:100000, money:50000, rent:0,
    reqLvl:69, span:2, big:true, draw:[90,140,200], wdraw:[30,55,90], needPower:true,
    city:[0.04, 0.07, 0.11],
    up:[
      { reqLvl:74, cost:1400000, need:{roxor:80,dlazba:110},   dur:120000, xp:120000, label:'Podkroví a arkýř' },
      { reqLvl:80, cost:4500000, need:{traverza:110,obklad:170},dur:150000, xp:300000, label:'Dvorní křídlo' }],
    vars:[
      { n:'Barokní',    style:{ wall:'#D8C9A8', roof:C.tile,   roofT:'gable', chim:true }, mix:{} },
      { n:'Renesanční', style:{ wall:'#C9A46E', roof:'#8E5A3C',roofT:'gable', chim:true }, mix:{dlazba:'obklad'} },
      { n:'Hrázděný',   style:{ wall:'#E0D6BE', roof:C.slate,  roofT:'gable', chim:true }, mix:{obklad:'tram'} }],
    ph:[
      { n:'Sklepení',        need:{sterk:90},  xp:12000 },
      { n:'Zdivo přízemí',   need:{cihla:120}, xp:13000 },
      { n:'Patra a stropy',  need:{roxor:60,tram:70}, xp:14000 },
      { n:'Krov a štít',     need:{traverza:40}, xp:15000 },
      { n:'Fasáda a portál', need:{obklad:90,dlazba:100}, xp:17000 }]
  },
  dispecink: {
    name:'Dispečink těžby', dur:150000, money:120000, rent:0,
    reqLvl:80, span:3, big:true,
    autoMine:[60000, 30000, 15000],
    up:[
      { reqLvl:84, cost:8000000,  need:{traverza:180,dlazba:260}, dur:170000, xp:400000, label:'Druhá směna' },
      { reqLvl:89, cost:24000000, need:{traverza:340,izolace:400},dur:200000, xp:900000, label:'Plná automatizace' }],
    vars:[
      { n:'Ocelový',  style:{ wall:'#8E959C', roof:C.slate, roofT:'hip', chim:false }, mix:{} },
      { n:'Skleněný', style:{ wall:C.glass,   roof:'#4E5450',roofT:'hip', chim:false }, mix:{dlazba:'obklad'} },
      { n:'Betonový', style:{ wall:C.concrete,roof:'#5A6470',roofT:'hip', chim:false }, mix:{izolace:'roxor'} }],
    ph:[
      { n:'Základová deska', need:{sterk:220}, xp:28000 },
      { n:'Skelet',          need:{roxor:180}, xp:30000 },
      { n:'Velín',           need:{traverza:100}, xp:32000 },
      { n:'Pásové rozvody',  need:{dlazba:200,obklad:180}, xp:34000 },
      { n:'Řídicí systém',   need:{izolace:200,prkno:220}, xp:38000 }]
  },
  sprava: {
    name:'Správcovská firma', dur:150000, money:100000, rent:0,
    reqLvl:81, span:3, big:true,
    autoRent:[120000, 60000, 30000],
    up:[
      { reqLvl:85, cost:7000000,  need:{traverza:160,obklad:240}, dur:170000, xp:380000, label:'Druhá pobočka' },
      { reqLvl:90, cost:22000000, need:{traverza:300,dlazba:380}, dur:200000, xp:850000, label:'Celoměstská správa' }],
    vars:[
      { n:'Kancelářský', style:{ wall:C.glass,    roof:C.slate, roofT:'hip', chim:false }, mix:{} },
      { n:'Cihlový',     style:{ wall:C.brick,    roof:C.tile,  roofT:'hip', chim:false }, mix:{obklad:'cihla'} },
      { n:'Kamenný',     style:{ wall:'#B8AE9C',  roof:'#5A6470',roofT:'hip',chim:false }, mix:{dlazba:'obklad'} }],
    ph:[
      { n:'Základy',        need:{sterk:200}, xp:26000 },
      { n:'Nosná konstrukce',need:{roxor:160}, xp:28000 },
      { n:'Kanceláře',      need:{traverza:90}, xp:30000 },
      { n:'Datové rozvody', need:{obklad:180,prkno:200}, xp:32000 },
      { n:'Fasáda',         need:{dlazba:190,izolace:170}, xp:36000 }]
  },
  udrzba: {
    name:'Údržbářská četa', dur:120000, money:60000, rent:0,
    reqLvl:82, span:2, big:true,
    autoFix:[2.0, 1.6, 1.3],
    up:[
      { reqLvl:86, cost:4000000,  need:{roxor:200,dlazba:180}, dur:140000, xp:280000, label:'Druhé vozidlo' },
      { reqLvl:91, cost:14000000, need:{traverza:220,obklad:260},dur:170000, xp:640000, label:'Nepřetržitá pohotovost' }],
    vars:[
      { n:'Červená',  style:{ wall:'#C4302C', roof:C.slate, roofT:'gable', chim:false }, mix:{} },
      { n:'Modrá',    style:{ wall:'#3C6E9A', roof:'#4E5450',roofT:'gable', chim:false }, mix:{dlazba:'obklad'} },
      { n:'Plechová', style:{ wall:'#8E959C', roof:'#5A6470',roofT:'gable', chim:false }, mix:{obklad:'roxor'} }],
    ph:[
      { n:'Zpevněná plocha', need:{sterk:150}, xp:20000 },
      { n:'Garáže',          need:{roxor:130}, xp:22000 },
      { n:'Dílna',           need:{traverza:70,cihla:180}, xp:24000 },
      { n:'Sklad dílů',      need:{obklad:140,izolace:130}, xp:27000 }]
  },
  nadrazi: {
    name:'Hlavní nádraží', dur:200000, money:400000, rent:0,
    reqLvl:80, span:4, big:true, draw:[320], wdraw:[110], needPower:true,
    world:true,
    vars:[
      { n:'Historické', style:{ wall:'#D8C9A8', roof:C.slate,  roofT:'gable', chim:true  }, mix:{} },
      { n:'Ocelové',    style:{ wall:'#8E959C', roof:'#4E5450',roofT:'gable', chim:false }, mix:{dlazba:'roxor'} },
      { n:'Moderní',    style:{ wall:C.glass,   roof:'#5A6470',roofT:'hip',   chim:false }, mix:{obklad:'dlazba'} }],
    ph:[
      { n:'Odvodnění a násep', need:{sterk:320}, xp:60000 },
      { n:'Kolejiště',         need:{roxor:280}, xp:64000 },
      { n:'Nástupiště',        need:{dlazba:300}, xp:68000 },
      { n:'Ocelová hala',      need:{traverza:220}, xp:72000 },
      { n:'Výpravní budova',   need:{cihla:400,tram:260}, xp:78000 },
      { n:'Zastřešení a hodiny',need:{obklad:320,izolace:300}, xp:86000 }]
  },
  mtSklad: {
    name:'Horský sklad', dur:90000, money:0, rent:0, reqLvl:80, span:3, big:true,
    mtnStore:[120, 260, 480, 800],
    up:[
      { reqLvl:84, cost:3192000,  need:{kvadr:120,traverza:160}, dur:110000, xp:180000, label:'Přístavba haly' },
      { reqLvl:90, cost:14630000, need:{kvadr:280,tabule:200},   dur:140000, xp:520000, label:'Druhá hala' },
      { reqLvl:96, cost:58520000, need:{sklo:240,kvadr:420},     dur:170000, xp:1400000,label:'Podzemní zásobník' }],
    vars:[
      { n:'Roubený', style:{ wall:'#8A6E4A', roof:'#5E6470', roofT:'gable', chim:false }, mix:{} },
      { n:'Kamenný', style:{ wall:'#9A9490', roof:'#4E545C', roofT:'gable', chim:false }, mix:{traverza:'roxor'} },
      { n:'Plechový',style:{ wall:'#8E959C', roof:'#5A6470', roofT:'gable', chim:false }, mix:{tabule:'obklad'} }],
    ph:[
      { n:'Vyrovnání terénu', need:{sterk:90}, xp:30000 },
      { n:'Základy do skály', need:{roxor:60}, xp:34000 },
      { n:'Hala',             need:{traverza:40,dlazba:80}, xp:38000 },
      { n:'Zastřešení',       need:{obklad:70,izolace:60}, xp:44000 }]
  },
  mtVoda: {
    name:'Horská elektrárna', dur:110000, money:0, rent:0, reqLvl:81, span:3, big:true,
    mgen:[280, 650, 1200, 1900], flood:[0, 92, 104, 116],
    up:[
      { reqLvl:85, cost:4522000,  need:{kvadr:140,roxor:240},   dur:130000, xp:220000,  label:'Druhá turbína' },
      { reqLvl:91, cost:18620000, need:{tabule:200,traverza:220},dur:160000, xp:600000,  label:'Vyšší jez' },
      { reqLvl:97, cost:74480000, need:{sklo:280,kvadr:400},    dur:190000, xp:1600000, label:'Přehradní hráz' }],
    vars:[
      { n:'Kamenná', style:{ wall:'#9A9490', roof:'#4E545C', roofT:'hip', chim:false }, mix:{} },
      { n:'Betonová',style:{ wall:C.concrete,roof:'#5A6470', roofT:'hip', chim:false }, mix:{kvadr:'sterk'} },
      { n:'Dřevěná', style:{ wall:'#8A6E4A', roof:'#6E7684', roofT:'gable',chim:false }, mix:{roxor:'tram'} }],
    ph:[
      { n:'Odvedení potoka', need:{sterk:240}, xp:34000 },
      { n:'Jez',             need:{roxor:180}, xp:38000 },
      { n:'Strojovna',       need:{traverza:110,dlazba:200}, xp:42000 },
      { n:'Turbína a rozvodna', need:{obklad:200,izolace:190}, xp:48000 }]
  },
  mtLanovka: {
    name:'Lanovka', dur:100000, money:80000, rent:0, reqLvl:82, span:2, big:true,
    mdraw:[30, 50, 80], cable:true,
    up:[
      { reqLvl:88, cost:5852000, need:{kvadr:120,tabule:100}, dur:120000, xp:280000, label:'Druhé lano' },
      { reqLvl:94, cost:22610000,need:{sklo:140,traverza:200},dur:150000, xp:760000, label:'Kabinková lanovka' }],
    vars:[
      { n:'Ocelová',  style:{ wall:'#8E959C', roof:'#4E545C', roofT:'hip', chim:false }, mix:{} },
      { n:'Dřevěná',  style:{ wall:'#8A6E4A', roof:'#5E6470', roofT:'gable',chim:false }, mix:{tabule:'tram'} },
      { n:'Kamenná',  style:{ wall:'#9A9490', roof:'#5A6470', roofT:'hip', chim:false }, mix:{kvadr:'kvadr'} }],
    ph:[
      { n:'Betonová patka',  need:{sterk:180}, xp:26000 },
      { n:'Stožár',          need:{roxor:150}, xp:30000 },
      { n:'Nosné lano',      need:{traverza:90}, xp:34000 },
      { n:'Stanice a vozíky',need:{traverza:60,dlazba:180}, xp:40000 }]
  },
  mtChata: {
    sea:[1.0, 1.7],
    name:'Horská chata', dur:90000, money:266000, rent:2200, rentCap:22000,
    reqLvl:83, span:2, big:true, mdraw:[40, 70, 110],
    up:[
      { reqLvl:88, cost:3990000, need:{kvadr:100,tabule:90},  dur:110000, rentMul:1.9, xp:240000, label:'Podkroví a terasa' },
      { reqLvl:95, cost:17290000,need:{sklo:120,kvadr:220},   dur:140000, rentMul:3.0, xp:680000, label:'Wellness a krb' }],
    vars:[
      { n:'Roubená',  style:{ wall:'#8A6E4A', roof:'#5E6470', roofT:'gable', chim:true }, mix:{} },
      { n:'Kamenná',  style:{ wall:'#9A9490', roof:'#4E545C', roofT:'gable', chim:true }, mix:{tabule:'kvadr'} },
      { n:'Prosklená',style:{ wall:'#A8D0DC', roof:'#5A6470', roofT:'hip',   chim:true }, mix:{kvadr:'sklo'} }],
    ph:[
      { n:'Základy do svahu', need:{sterk:160}, xp:24000 },
      { n:'Kamenná podezdívka',need:{kvadr:70}, xp:28000 },
      { n:'Srub',             need:{tram:200,traverza:70}, xp:32000 },
      { n:'Střecha z tabulí', need:{tabule:80}, xp:36000 },
      { n:'Okna a krb',       need:{tabule:40,obklad:150}, xp:42000 }]
  },
  mtPila: {
    name:'Horská pila', dur:100000, money:0, rent:0, reqLvl:83, span:3, big:true,
    mdraw:[50,80,120], mines:'drevo', mrate:[6000,4000,2600], mcap:[120,260,440],
    up:[{ reqLvl:88, cost:5320000,  need:{kvadr:100,roxor:200}, dur:120000, xp:260000, label:'Druhý katr' },
        { reqLvl:94, cost:18620000, need:{tabule:160,kvadr:240},dur:150000, xp:700000, label:'Pásová pila' }],
    vars:[{ n:'Dřevěná', style:{ wall:'#8A6E4A', roof:'#5E6470', roofT:'gable', chim:true }, mix:{} },
          { n:'Kamenná', style:{ wall:'#9A9490', roof:'#4E545C', roofT:'gable', chim:true }, mix:{roxor:'kvadr'} },
          { n:'Plechová',style:{ wall:'#8E959C', roof:'#5A6470', roofT:'gable', chim:false }, mix:{kvadr:'roxor'} }],
    ph:[{ n:'Zpevněná plocha', need:{sterk:180}, xp:24000 },
        { n:'Katr',            need:{roxor:150}, xp:28000 },
        { n:'Hala a sklad',    need:{tram:220,dlazba:170}, xp:34000 }] },
  mtVitr: {
    name:'Horský větrník', dur:120000, money:0, rent:0, reqLvl:89, span:3, big:true,
    mgen:[180, 550, 1250],
    up:[{ reqLvl:94, cost:15960000, need:{kvadr:180,traverza:200}, dur:140000, xp:420000,  label:'Delší listy' },
        { reqLvl:99, cost:53200000, need:{sklo:200,kvadr:340},     dur:170000, xp:1100000, label:'Vyšší stožár' }],
    vars:[{ n:'Bílý',  style:{ wall:'#D6D9D2', roof:'#B8BCB4', roofT:'hip', chim:false }, mix:{} },
          { n:'Šedý',  style:{ wall:'#9CA3AA', roof:'#7E8890', roofT:'hip', chim:false }, mix:{traverza:'roxor'} },
          { n:'Červený',style:{ wall:'#C4503C', roof:'#8E959C', roofT:'hip', chim:false }, mix:{kvadr:'cihla'} }],
    ph:[{ n:'Patka do skály', need:{sterk:220,kvadr:100}, xp:36000 },
        { n:'Stožár',         need:{traverza:140}, xp:40000 },
        { n:'Gondola',        need:{roxor:220,izolace:160}, xp:46000 },
        { n:'Listy rotoru',   need:{tabule:140,obklad:200}, xp:52000 }] },
  mtHotel: {
    sea:[1.2, 1.6],
    name:'Horský hotel', dur:140000, money:532000, rent:5200, rentCap:52000,
    reqLvl:90, span:3, big:true, mdraw:[140,200,290],
    up:[{ reqLvl:95, cost:31920000, need:{kvadr:240,sklo:140}, dur:160000, rentMul:1.9, xp:640000,  label:'Wellness' },
        { reqLvl:100,cost:106400000, need:{sklo:300,tabule:340},dur:190000, rentMul:3.0, xp:1700000, label:'Nová budova' }],
    vars:[{ n:'Roubený',  style:{ wall:'#8A6E4A', roof:'#5E6470', roofT:'gable', chim:true }, mix:{} },
          { n:'Kamenný',  style:{ wall:'#9A9490', roof:'#4E545C', roofT:'gable', chim:true }, mix:{sklo:'kvadr'} },
          { n:'Prosklený',style:{ wall:'#A8D0DC', roof:'#5A6470', roofT:'hip',   chim:true }, mix:{kvadr:'sklo'} }],
    ph:[{ n:'Základy do svahu', need:{sterk:280}, xp:50000 },
        { n:'Podezdívka',       need:{kvadr:180}, xp:56000 },
        { n:'Skelet',           need:{traverza:160}, xp:62000 },
        { n:'Střecha',          need:{tabule:160}, xp:68000 },
        { n:'Okna a interiér',  need:{sklo:140,obklad:260}, xp:76000 }] },
  mtLazne: {
    sea:[1.7, 1.0],
    name:'Horské lázně', dur:130000, money:332000, rent:3400, rentCap:34000,
    reqLvl:88, span:3, big:true, mdraw:[110,160,230],
    up:[{ reqLvl:93, cost:21280000, need:{kvadr:200,sklo:110}, dur:150000, rentMul:1.9, xp:520000,  label:'Venkovní bazén' },
        { reqLvl:98, cost:74480000, need:{sklo:260,tabule:280},dur:180000, rentMul:2.9, xp:1400000, label:'Termální vrt' }],
    vars:[{ n:'Kamenné',  style:{ wall:'#9A9490', roof:'#4E545C', roofT:'hip', chim:true }, mix:{} },
          { n:'Dřevěné',  style:{ wall:'#8A6E4A', roof:'#5E6470', roofT:'gable',chim:true }, mix:{kvadr:'tram'} },
          { n:'Prosklené',style:{ wall:'#A8D0DC', roof:'#5A6470', roofT:'hip', chim:false }, mix:{kvadr:'sklo'} }],
    ph:[{ n:'Jímka a rozvody', need:{sterk:240}, xp:42000 },
        { n:'Bazénová vana',   need:{kvadr:150}, xp:48000 },
        { n:'Hala',            need:{traverza:130}, xp:54000 },
        { n:'Zastřešení',      need:{tabule:130,sklo:90}, xp:62000 }] },
  mtSjezd: {
    sea:[0.3, 2.3],
    name:'Sjezdovka s vlekem', dur:150000, money:399000, rent:3800, rentCap:38000,
    reqLvl:84, span:4, big:true, mdraw:[120,180,260], tour:[0.10, 0.17, 0.26],
    up:[{ reqLvl:90, cost:23940000, need:{kvadr:180,traverza:220}, dur:170000, rentMul:1.8, xp:560000,  label:'Druhý vlek' },
        { reqLvl:96, cost:79800000, need:{sklo:200,tabule:320},    dur:200000, rentMul:2.8, xp:1500000, label:'Umělé zasněžování' }],
    vars:[{ n:'Klasická', style:{ wall:'#DCE4E8', roof:'#8E959C', roofT:'hip', chim:false }, mix:{} },
          { n:'Dřevěná',  style:{ wall:'#8A6E4A', roof:'#5E6470', roofT:'gable',chim:false }, mix:{traverza:'tram'} },
          { n:'Moderní',  style:{ wall:'#9CA3AA', roof:'#4E5450', roofT:'hip', chim:false }, mix:{kvadr:'roxor'} }],
    ph:[{ n:'Vyrovnání svahu', need:{sterk:300}, xp:46000 },
        { n:'Patky vleku',     need:{kvadr:160}, xp:52000 },
        { n:'Stožáry a lano',  need:{traverza:180}, xp:58000 },
        { n:'Stanice vleku',   need:{roxor:240,tabule:120}, xp:66000 }] },
  mtRozhl: {
    name:'Rozhledna', dur:170000, money:798000, rent:0, reqLvl:94, span:3, big:true,
    mdraw:[60,90,130], tour:[0.18, 0.30, 0.46],
    up:[{ reqLvl:98, cost:79800000,  need:{kvadr:340,sklo:200},  dur:200000, xp:1600000, label:'Vyšší ochoz' },
        { reqLvl:104,cost:266000000, need:{sklo:420,tabule:500}, dur:240000, xp:4000000, label:'Prosklená kupole' }],
    vars:[{ n:'Kamenná', style:{ wall:'#9A9490', roof:'#4E545C', roofT:'hip', chim:false }, mix:{} },
          { n:'Dřevěná', style:{ wall:'#8A6E4A', roof:'#5E6470', roofT:'hip', chim:false }, mix:{kvadr:'tram'} },
          { n:'Ocelová', style:{ wall:'#8E959C', roof:'#4E5450', roofT:'hip', chim:false }, mix:{kvadr:'traverza'} }],
    ph:[{ n:'Základ ve skále', need:{sterk:320,kvadr:180}, xp:80000 },
        { n:'Dřík',            need:{traverza:220}, xp:88000 },
        { n:'Schodiště',       need:{kvadr:260}, xp:96000 },
        { n:'Ochoz',           need:{tabule:200,roxor:280}, xp:106000 },
        { n:'Vyhlídka',        need:{sklo:180,obklad:300}, xp:120000 }] },
  mtZub: {
    sea:[1.8, 0.8],
    name:'Zubačka', dur:180000, money:665000, rent:2600, rentCap:26000,
    reqLvl:92, span:4, big:true, mdraw:[180,260,360], tour:[0.12, 0.20, 0.30],
    up:[{ reqLvl:97, cost:58520000,  need:{kvadr:300,traverza:340}, dur:200000, rentMul:1.8, xp:1200000, label:'Druhá souprava' },
        { reqLvl:103,cost:199500000, need:{sklo:360,tabule:420},    dur:240000, rentMul:2.7, xp:3200000, label:'Horní stanice' }],
    vars:[{ n:'Historická',style:{ wall:'#8A6E4A', roof:'#5E6470', roofT:'gable', chim:true }, mix:{} },
          { n:'Kamenná',   style:{ wall:'#9A9490', roof:'#4E545C', roofT:'gable', chim:false }, mix:{traverza:'kvadr'} },
          { n:'Moderní',   style:{ wall:'#9CA3AA', roof:'#4E5450', roofT:'hip',   chim:false }, mix:{kvadr:'sklo'} }],
    ph:[{ n:'Násep',        need:{sterk:340}, xp:70000 },
        { n:'Ozubnice',     need:{roxor:300}, xp:78000 },
        { n:'Mosty',        need:{traverza:240}, xp:86000 },
        { n:'Dolní stanice',need:{kvadr:240,tabule:160}, xp:96000 }] },
  mtMeteo: {
    name:'Meteostanice', dur:110000, money:0, rent:0, reqLvl:89, span:2, big:true,
    mdraw:[40,60,90], snowCut:[0.6, 0.42, 0.28],
    up:[{ reqLvl:94, cost:11970000,  need:{kvadr:120,sklo:80},  dur:130000, xp:340000, label:'Radar' },
        { reqLvl:100,cost:39900000, need:{sklo:180,tabule:200},dur:160000, xp:900000, label:'Předpovědní model' }],
    vars:[{ n:'Bílá',   style:{ wall:'#DCE4E8', roof:'#8E959C', roofT:'hip', chim:false }, mix:{} },
          { n:'Kamenná',style:{ wall:'#9A9490', roof:'#4E545C', roofT:'hip', chim:false }, mix:{sklo:'kvadr'} },
          { n:'Ocelová',style:{ wall:'#8E959C', roof:'#4E5450', roofT:'hip', chim:false }, mix:{kvadr:'roxor'} }],
    ph:[{ n:'Patka',     need:{sterk:160,kvadr:80}, xp:34000 },
        { n:'Budova',    need:{traverza:100}, xp:38000 },
        { n:'Přístroje', need:{sklo:70,izolace:180}, xp:44000 }] },
  mtSluzba: {
    name:'Horská služba', dur:110000, money:0, rent:0, reqLvl:88, span:2, big:true,
    mdraw:[50,80,120], autoFix:[1.8, 1.5, 1.2],
    up:[{ reqLvl:93, cost:10640000,  need:{kvadr:110,roxor:220}, dur:130000, xp:320000, label:'Druhé vozidlo' },
        { reqLvl:99, cost:37240000, need:{tabule:180,kvadr:260},dur:160000, xp:860000, label:'Vrtulník' }],
    vars:[{ n:'Červená', style:{ wall:'#C4302C', roof:'#4E545C', roofT:'gable', chim:false }, mix:{} },
          { n:'Dřevěná', style:{ wall:'#8A6E4A', roof:'#5E6470', roofT:'gable', chim:true }, mix:{roxor:'tram'} },
          { n:'Kamenná', style:{ wall:'#9A9490', roof:'#5A6470', roofT:'gable', chim:true }, mix:{kvadr:'kvadr'} }],
    ph:[{ n:'Zpevněná plocha', need:{sterk:170}, xp:30000 },
        { n:'Garáž',           need:{roxor:160}, xp:34000 },
        { n:'Zázemí',          need:{kvadr:90,izolace:170}, xp:40000 }] },
  radnice: {
    name:'Radnice', dur:120000, money:80000, rent:0,
    reqLvl:69, span:3, big:true, draw:[60,90,130], wdraw:[20,40,60], needPower:true,
    city:[0.07, 0.12, 0.18],
    up:[
      { reqLvl:73, cost:1600000, need:{roxor:120,dlazba:140}, dur:140000, xp:140000, label:'Věž s hodinami' },
      { reqLvl:79, cost:5000000, need:{traverza:140,obklad:200},dur:170000, xp:340000, label:'Zasedací sál' }],
    vars:[
      { n:'Barokní',  style:{ wall:'#D8C9A8', roof:C.tile,  roofT:'hip',   chim:true }, mix:{} },
      { n:'Renesanční',style:{ wall:'#C9B78E', roof:'#8E5A3C',roofT:'gable',chim:true }, mix:{dlazba:'obklad'} },
      { n:'Gotická',  style:{ wall:'#B8AE9C', roof:C.slate, roofT:'gable', chim:true }, mix:{obklad:'roxor'} }],
    ph:[
      { n:'Základy na náměstí', need:{sterk:170}, xp:16000 },
      { n:'Obvodové zdivo',     need:{cihla:220}, xp:17000 },
      { n:'Klenby',             need:{roxor:100}, xp:18000 },
      { n:'Věž',                need:{traverza:70}, xp:19000 },
      { n:'Fasáda a hodiny',    need:{obklad:150,dlazba:160}, xp:21000 }]
  },
  kostel: {
    name:'Kostel', dur:120000, money:60000, rent:0,
    reqLvl:70, span:3, big:true, draw:[30,50,70], wdraw:[10,20,30], needPower:true,
    city:[0.05, 0.09, 0.14],
    up:[
      { reqLvl:75, cost:1200000, need:{dlazba:130,izolace:120}, dur:140000, xp:120000, label:'Zvonice' },
      { reqLvl:81, cost:4000000, need:{traverza:120,obklad:180},dur:170000, xp:300000, label:'Varhany a vitráže' }],
    vars:[
      { n:'Kamenný', style:{ wall:'#B4B0A4', roof:C.slate,  roofT:'gable', chim:false }, mix:{} },
      { n:'Cihlový', style:{ wall:'#A8654A', roof:'#5A6470', roofT:'gable', chim:false }, mix:{dlazba:'cihla'} },
      { n:'Bílý',    style:{ wall:'#E0DCCE', roof:'#7E8890', roofT:'gable', chim:false }, mix:{obklad:'dlazba'} }],
    ph:[
      { n:'Výkop a základy', need:{sterk:110}, xp:15000 },
      { n:'Obvodové zdivo', need:{cihla:150}, xp:16000 },
      { n:'Krov a klenba',  need:{tram:90},   xp:17000 },
      { n:'Věž se zvonem',  need:{roxor:60},  xp:18000 },
      { n:'Střecha a okna', need:{dlazba:100,izolace:90}, xp:20000 }]
  },
  muzeum: {
    name:'Muzeum', dur:130000, money:100000, rent:0,
    reqLvl:72, span:3, big:true, draw:[80,120,170], wdraw:[30,50,80], needPower:true,
    city:[0.08, 0.14, 0.21],
    up:[
      { reqLvl:77, cost:2400000, need:{traverza:90,dlazba:160}, dur:150000, xp:180000, label:'Nové křídlo' },
      { reqLvl:83, cost:7000000, need:{traverza:200,izolace:240},dur:180000, xp:420000, label:'Depozitář a badatelna' }],
    vars:[
      { n:'Klasicistní', style:{ wall:'#DCD2BC', roof:C.slate, roofT:'hip', chim:false }, mix:{} },
      { n:'Moderní',     style:{ wall:'#9CA3AA', roof:'#4E5450',roofT:'hip', chim:false }, mix:{dlazba:'roxor'} },
      { n:'Kamenné',     style:{ wall:'#B8AE9C', roof:'#5A6470',roofT:'hip', chim:false }, mix:{obklad:'dlazba'} }],
    ph:[
      { n:'Výkop a základy', need:{sterk:200}, xp:20000 },
      { n:'Skelet',          need:{roxor:150}, xp:21000 },
      { n:'Sloupoví',        need:{traverza:85}, xp:22000 },
      { n:'Sály a schodiště',need:{cihla:180,prkno:160}, xp:24000 },
      { n:'Fasáda',          need:{obklad:140,dlazba:130}, xp:26000 }]
  },
  obchodak: {
    name:'Obchodní centrum', dur:150000, money:12000, rent:1100, rentCap:11000,
    reqLvl:33, span:4, big:true, draw:[160,240,340], wdraw:[0,80,120], needPower:true,
    up:[
      { reqLvl:36, cost:120000, need:{dlazba:60,obklad:50}, dur:32000, rentMul:1.7, xp:16000, label:'Druhé patro a kino' },
      { reqLvl:39, cost:320000, need:{tram:90,izolace:80},  dur:40000, rentMul:2.6, xp:34000, label:'Parkovací dům' }],
    vars:[
      { n:'Skleněné', style:{ wall:C.glass,    roof:C.slate, roofT:'hip', chim:false }, mix:{} },
      { n:'Cihlové',  style:{ wall:C.brick,    roof:C.tile,  roofT:'hip', chim:false }, mix:{dlazba:'obklad'} },
      { n:'Betonové', style:{ wall:C.concrete, roof:C.slate, roofT:'hip', chim:false }, mix:{obklad:'dlazba'} }],
    ph:[
      { n:'Výkop a piloty', need:{sterk:70},  xp:2400 },
      { n:'Skelet',         need:{tram:50},   xp:2600 },
      { n:'Obvodový plášť', need:{cihla:80},  xp:2800 },
      { n:'Podlahy',        need:{dlazba:46}, xp:3000 },
      { n:'Interiér',       need:{obklad:44,prkno:40}, xp:3200 },
      { n:'Vzduchotechnika',need:{izolace:50}, xp:3500 }]
  }
};

BUILDINGS.mrakodrap = {
  name:'Mrakodrap', dur:180000, money:150000, rent:5200, rentCap:52000,
  reqLvl:64, span:4, big:true, draw:[600,900,1300], wdraw:[220,340,480],
  needPower:true, needWater:true,
  up:[
    { reqLvl:70, cost:4000000,  need:{traverza:300,dlazba:400}, dur:200000, rentMul:1.8, xp:400000, label:'Nástavba a heliport' },
    { reqLvl:76, cost:14000000, need:{traverza:700,obklad:600}, dur:240000, rentMul:2.7, xp:900000, label:'Druhá věž' }],
  vars:[
    { n:'Skleněný', style:{ wall:'#7FA8B8', roof:'#5A6470', roofT:'hip', chim:false }, mix:{} },
    { n:'Ocelový',  style:{ wall:'#8E959C', roof:'#4E5450', roofT:'hip', chim:false }, mix:{obklad:'roxor'} },
    { n:'Kamenný',  style:{ wall:'#B8A88E', roof:'#7E8890', roofT:'hip', chim:false }, mix:{dlazba:'obklad'} }],
  ph:[
    { n:'Hloubený výkop',      need:{sterk:300}, xp:60000 },
    { n:'Základová deska',     need:{sterk:260,roxor:120}, xp:62000 },
    { n:'Pilotové založení',   need:{roxor:200}, xp:64000 },
    { n:'Jádro budovy',        need:{traverza:120}, xp:66000 },
    { n:'Skelet 1.–10. patro', need:{traverza:150}, xp:70000 },
    { n:'Skelet 11.–20. patro',need:{traverza:170}, xp:74000 },
    { n:'Skelet 21.–30. patro',need:{traverza:190}, xp:78000 },
    { n:'Stropní desky',       need:{roxor:260,sterk:280}, xp:82000 },
    { n:'Schodiště a výtahy',  need:{traverza:140,roxor:180}, xp:86000 },
    { n:'Obvodový plášť',      need:{obklad:300}, xp:90000 },
    { n:'Prosklení fasády',    need:{dlazba:320}, xp:94000 },
    { n:'Technické patro',     need:{roxor:220,izolace:200}, xp:98000 },
    { n:'Rozvody a klimatizace', need:{prkno:340,izolace:240}, xp:102000 },
    { n:'Příčky kanceláří',    need:{cihla:400,prkno:300}, xp:106000 },
    { n:'Podlahy',             need:{dlazba:280,obklad:260}, xp:110000 },
    { n:'Byty v horních patrech', need:{obklad:320,izolace:280}, xp:116000 },
    { n:'Zateplení',           need:{izolace:340}, xp:122000 },
    { n:'Lobby a recepce',     need:{dlazba:240,tram:200}, xp:128000 },
    { n:'Střešní terasa',      need:{traverza:110,dlazba:200}, xp:134000 },
    { n:'Osvětlení a kolaudace', need:{roxor:200,obklad:220}, xp:145000 }]
};

/* ─── elektrárna ─── */
const PLANT = {
  name:'Elektrárna', span:3, reqLvl:20, dur:100000, cost:9000,
  ph:[
    { n:'Betonové základy', need:{kamen:40}, xp:520 },
    { n:'Nosný skelet',     need:{drevo:34}, xp:560 },
    { n:'Kotelna',          need:{cihla:30}, xp:600 },
    { n:'Strojovna',        need:{cihla:22,sterk:16}, xp:640 },
    { n:'Komín',            need:{cihla:26}, xp:700 },
    { n:'Rozvodna',         need:{prkno:18,balik:12}, xp:760 }],
  /* turbíny pohání pára — u uhlí z kotle, po přestavbě z reaktoru */
  turbine:[
    { mw:50,  cost:0,      need:{},                    dur:0,     xp:0,     reqLvl:20, cool:1 },
    { mw:110, cost:9000,   need:{cihla:40,sterk:30},   dur:20000, xp:2600,  reqLvl:26, cool:1 },
    { mw:190, cost:26000,  need:{tram:26,dlazba:22},   dur:26000, xp:6400,  reqLvl:31, cool:2 },
    { mw:300, cost:70000,  need:{dlazba:50,obklad:40}, dur:32000, xp:15000, reqLvl:36, cool:2 }],
  cooling:[
    { cost:0,      need:{},                     dur:0,     xp:0,     reqLvl:20, water:0 },
    { cost:11000,  need:{sterk:40,cihla:30},    dur:22000, xp:3000,  reqLvl:28, water:0 },
    { cost:44000,  need:{dlazba:44,izolace:30}, dur:30000, xp:11000, reqLvl:34, water:0 },
    { cost:150000, need:{tram:70,obklad:60},    dur:34000, xp:26000, reqLvl:48, water:60 },
    { cost:420000, need:{dlazba:120,izolace:100},dur:40000, xp:60000,  reqLvl:55, water:90 },
    { cost:1400000,need:{traverza:60,roxor:140},   dur:60000, xp:180000, reqLvl:62, water:140 },
    { cost:4000000,need:{traverza:160,dlazba:300}, dur:80000, xp:420000, reqLvl:70, water:220 }],
  /* přestavba na jádro — kotelnu nahradí reaktor, turbíny zůstanou */
  nuclear:{ reqLvl:44, cost:180000, need:{tram:90,obklad:80,izolace:70}, dur:40000, xp:42000,
            cool:3, label:'Přestavba na jádro' },
  blocks:[
    { mw:400,  burn:60000, water:0,   cool:3, cost:0,      need:{},                     dur:0,     xp:0,     reqLvl:44 },
    { mw:850,  burn:34000, water:80,  cool:4, cost:200000, need:{cihla:120,dlazba:90},  dur:36000, xp:36000, reqLvl:50 },
    { mw:1600, burn:22000, water:160, cool:5, cost:600000,  need:{tram:150,izolace:120},   dur:42000,  xp:80000,  reqLvl:56 },
    { mw:2800, burn:16000, water:260, cool:6, cost:2400000, need:{roxor:220,dlazba:260},   dur:120000, xp:280000, reqLvl:64 },
    { mw:6600, burn:11000, water:400, cool:7, cost:9000000, need:{traverza:260,obklad:400},dur:180000, xp:700000, reqLvl:73 }],
  burnBase:18000
};
const COOL_SPOTS = [[24,5],[20,9],[24,9],[20,0],[24,0],[13,5],[17,9]];

/* ─── vodojem: kapacita vody, žere proud ─── */
const PUMP = {
  name:'Vodojem', span:3, reqLvl:42, dur:120000, cost:30000,
  ph:[
    { n:'Výkop a základy',  need:{sterk:60}, xp:2600 },
    { n:'Betonová nádrž',   need:{cihla:70}, xp:2800 },
    { n:'Nosná konstrukce', need:{tram:40},  xp:3000 },
    { n:'Čerpadla',         need:{dlazba:36},xp:3200 },
    { n:'Rozvody',          need:{prkno:50,obklad:30}, xp:3400 },
    { n:'Úpravna vody',     need:{izolace:40}, xp:3700 }],
  levels:[
    { water:150, mw:40,  cost:0,      need:{},                      dur:0,     xp:0,     reqLvl:42 },
    { water:320, mw:90,  cost:60000,  need:{cihla:70,dlazba:50},    dur:30000, xp:12000, reqLvl:47 },
    { water:600,  mw:150, cost:180000,  need:{tram:80,izolace:70},      dur:36000,  xp:28000,  reqLvl:57 },
    { water:1200, mw:280, cost:900000,  need:{roxor:120,dlazba:160},    dur:90000,  xp:120000, reqLvl:65 },
    { water:2400, mw:480, cost:3600000, need:{traverza:180,izolace:300},dur:150000, xp:380000, reqLvl:74 }]
};
/* čerpací stanice — přidají vodu navíc */
const PUMPST = { water:400, mw:52, dur:60000, xp:6000 };
/* čerpadla mohou mít vlastní parametry přímo v parcele */
const pstOf = (id, k) => (PARC[id] && PARC[id][k] !== undefined) ? PARC[id][k] : PUMPST[k];

const PUMPST_NEED = { cihla:60, dlazba:40 };
const pstNeed = id => (PARC[id] && PARC[id].need) || PUMPST_NEED;

/* ─── rudný sklad: jen na železo a jeho výrobky ─── */
const IRON_STORE = {
  name:'Rudný sklad', span:3, reqLvl:46, dur:60000, cost:150000,
  ph:[
    { n:'Zpevněná plocha', need:{sterk:70}, xp:5000 },
    { n:'Ocelová hala',    need:{tram:50,cihla:90}, xp:5400 },
    { n:'Zastřešení',      need:{dlazba:60,izolace:50}, xp:5800 }],
  levels:[
    { cap:60,  cost:0,       need:{},                       dur:0,     xp:0,      reqLvl:46 },
    { cap:140, cost:300000,  need:{roxor:60,cihla:180},     dur:70000, xp:26000,  reqLvl:54 },
    { cap:280, cost:1200000, need:{traverza:60,dlazba:220}, dur:90000, xp:90000,  reqLvl:63 },
    { cap:520,  cost:4000000,  need:{traverza:160,izolace:300}, dur:120000, xp:280000, reqLvl:70 },
    { cap:820,  cost:12000000, need:{traverza:260,dlazba:380},  dur:150000, xp:600000, reqLvl:74 }]
};

/* ─── sklad ─── */
const SKLAD_UP = [
  { cap:20,  cost:0,      need:{}, reqLvl:1 },
  { cap:60,  cost:0,      need:{}, reqLvl:5 },
  { cap:110, cost:8000,   need:{drevo:60,kamen:60},   reqLvl:22, xp:1400 },
  { cap:180, cost:20000,  need:{prkno:110,cihla:110}, reqLvl:26, xp:4200 },
  { cap:280, cost:45000,  need:{sterk:180,balik:180}, reqLvl:30, xp:9000 },
  { cap:420, cost:120000,  need:{tram:120,dlazba:120},    reqLvl:35, xp:22000 },
  { cap:640, cost:600000,  need:{roxor:120,obklad:160},   reqLvl:60, xp:70000 },
  { cap:950, cost:2500000, need:{traverza:120,izolace:220},reqLvl:71, xp:190000 }
];

/* ═══════════ TĚŽEBNÍ STANICE ═══════════ */
function stLine(names, out1, out2) {
  return names.map((nm, i) => ({
    name:nm, lvl:i+1,
    cost:   [300, 1200, 5000, 14000, 40000][i],
    reqLvl: [5, 15, 24, 29, 34][i],
    dur:    [8000, 12000, 18000, 24000, 30000][i],
    cap:    [30, 45, 70, 110, 170][i],
    mul:    [.60, .50, .42, .35, .28][i],
    queue:  [0, 15, 30, 45, 60][i],
    mw:     [0, 0, 20, 40, 70][i],
    done:   [590, 900, 2600, 6800, 16000][i],
    makes:  i === 0 ? [] : (i >= 3 ? [out1, out2] : [out1]),
    ph: [0,1,2].map(j => ({
      n: ['Základ a plocha','Konstrukce','Vybavení'][j],
      need: i < 2 ? { drevo:[8,10,10][j] + i*6, kamen:[5,6,6][j] + i*4 }
          : i < 4 ? { prkno:[16,20,18][j] + i*4, cihla:[10,12,14][j] + i*4 }
                  : { tram:[18,22,20][j], dlazba:[14,16,18][j] },
      xp: Math.round([120,140,160][j] * Math.pow(2.1, i)) }))
  }));
}
const ST_UP = {
  saw:    stLine(['Pila','Katr','Velká pila','Dřevozávod','Dřevařský kombinát'], 'prkno','tram'),
  quarry: stLine(['Kamenolom','Drtírna','Velký lom','Kamenický závod','Kamenický kombinát'], 'sterk','dlazba'),
  field:  stLine(['Pole','Lisovna','Velká lisovna','Zemědělský závod','Agrokombinát'], 'balik','izolace'),
  pit:    stLine(['Hliniště','Cihelna','Velká cihelna','Keramický závod','Keramický kombinát'], 'cihla','obklad'),
  iron:[
    { name:'Železný důl', lvl:1, cost:120000, reqLvl:46, dur:150000, cap:60, mul:.6, queue:0, mw:50, done:22000, makes:[],
      ph:[{ n:'Skrývka a rampa', need:{tram:60,dlazba:44}, xp:7000 },
          { n:'Těžní jáma',      need:{cihla:140,sterk:110}, xp:7600 },
          { n:'Drtírna rudy',    need:{obklad:80,izolace:70}, xp:8200 }] },
    { name:'Velký železný důl', lvl:2, cost:420000, reqLvl:55, dur:180000, cap:130, mul:.44, queue:0, mw:110, done:60000, makes:[],
      ph:[{ n:'Druhé patro',     need:{traverza:26,dlazba:90}, xp:20000 },
          { n:'Pásová doprava',  need:{roxor:70,cihla:180}, xp:22000 },
          { n:'Rypadlo',         need:{traverza:34,izolace:100}, xp:24000 }] },
    { name:'Rudný kombinát', lvl:3, cost:1400000, reqLvl:66, dur:210000, cap:260, mul:.32, queue:0, mw:180, done:180000, makes:[],
      ph:[{ n:'Hlubinné patro',  need:{traverza:90,dlazba:180}, xp:60000 },
          { n:'Třídírna',        need:{roxor:160,obklad:170}, xp:64000 },
          { n:'Nakládací most',  need:{traverza:110,izolace:150}, xp:70000 }] }
  ],
  smelt:[
    { name:'Hutní závod', lvl:1, cost:180000, reqLvl:47, dur:160000, cap:0, mul:1, queue:25, mw:120, done:26000,
      makes:['roxor'],
      ph:[{ n:'Základ pece',   need:{tram:70,cihla:160}, xp:8000 },
          { n:'Vysoká pec',    need:{dlazba:90,obklad:80}, xp:8800 },
          { n:'Válcovna',      need:{izolace:80,prkno:120}, xp:9600 }] },
    { name:'Ocelárna', lvl:2, cost:600000, reqLvl:57, dur:190000, cap:0, mul:1, queue:45, mw:240, done:74000,
      makes:['roxor','traverza'],
      ph:[{ n:'Druhá pec',     need:{roxor:60,dlazba:110}, xp:24000 },
          { n:'Kyslíkový konvertor', need:{roxor:80,obklad:120}, xp:26000 },
          { n:'Těžká válcovna', need:{roxor:110,izolace:120}, xp:28000 }] },
    { name:'Hutní kombinát', lvl:3, cost:1800000, reqLvl:68, dur:220000, cap:0, mul:1, queue:70, mw:400, done:210000,
      makes:['roxor','traverza'],
      ph:[{ n:'Třetí pec',      need:{traverza:80,dlazba:200}, xp:70000 },
          { n:'Kontilití',      need:{traverza:100,roxor:180}, xp:76000 },
          { n:'Expediční hala', need:{traverza:120,izolace:180}, xp:84000 }] }
  ],
  kamdilna:[
    { name:'Kamenická dílna', lvl:1, cost:1862000, reqLvl:84, dur:110000, cap:0, mul:1, queue:20, mw:70, done:180000,
      makes:['kvadr'],
      ph:[{ n:'Základová deska', need:{sterk:220}, xp:28000 },
          { n:'Hala',            need:{roxor:180}, xp:32000 },
          { n:'Lanová pila',     need:{traverza:110}, xp:36000 },
          { n:'Brusírna',        need:{dlazba:200,izolace:180}, xp:42000 }] },
    { name:'Velká kamenická dílna', lvl:2, cost:6650000, reqLvl:87, dur:140000, cap:0, mul:1, queue:40, mw:150, done:520000,
      makes:['kvadr'],
      ph:[{ n:'Druhá linka', need:{kvadr:140,traverza:180}, xp:300000 },
          { n:'Automatická pila', need:{sklo:160,kvadr:300}, xp:800000 }] }
  ],
  krytina:[
    { name:'Krytinárna', lvl:1, cost:3458000, reqLvl:86, dur:110000, cap:0, mul:1, queue:20, mw:80, done:200000,
      makes:['tabule'],
      ph:[{ n:'Zpevněná plocha', need:{sterk:240}, xp:30000 },
          { n:'Hala',            need:{kvadr:120}, xp:34000 },
          { n:'Štípací stroje',  need:{traverza:120}, xp:38000 },
          { n:'Třídírna',        need:{obklad:220,izolace:190}, xp:44000 }] }
  ],
  sklarna:[
    { name:'Sklárna', lvl:1, cost:9310000, reqLvl:91, dur:130000, cap:0, mul:1, queue:20, mw:130, done:340000,
      makes:['sklo'],
      ph:[{ n:'Základy pece', need:{sterk:260}, xp:44000 },
          { n:'Tavicí pec',   need:{cihla:300,kvadr:140}, xp:48000 },
          { n:'Hala',         need:{traverza:150}, xp:54000 },
          { n:'Chladicí pás', need:{tabule:120,izolace:220}, xp:60000 }] }
  ],
  granite:[
    { name:'Žulový lom', lvl:1, cost:931000, reqLvl:80, dur:120000, cap:80, mul:.7, queue:20, mw:40, done:120000,
      makes:[],
      ph:[{ n:'Odstřel skrývky', need:{sterk:260,roxor:140}, xp:34000 },
          { n:'Lomová stěna',    need:{traverza:90,dlazba:200}, xp:36000 },
          { n:'Kamenická dílna', need:{obklad:200,izolace:180}, xp:40000 }] },
    { name:'Velký žulový lom', lvl:2, cost:7980000, reqLvl:86, dur:160000, cap:180, mul:.5, queue:40, mw:90, done:400000,
      makes:[],
      ph:[{ n:'Druhá etáž',    need:{kvadr:90,traverza:140}, xp:110000 },
          { n:'Lanová pila',   need:{kvadr:120,roxor:220}, xp:120000 },
          { n:'Drtírna',       need:{tabule:80,dlazba:300}, xp:130000 }] },
    { name:'Kamenický kombinát', lvl:3, cost:39900000, reqLvl:93, dur:200000, cap:340, mul:.36, queue:70, mw:170, done:1400000,
      makes:[],
      ph:[{ n:'Hlubinná etáž', need:{kvadr:240,traverza:280}, xp:400000 },
          { n:'Pásová doprava',need:{tabule:200,sklo:120}, xp:430000 },
          { n:'Brusírna',      need:{kvadr:300,sklo:180}, xp:470000 }] }
  ],
  slateq:[
    { name:'Břidlicová stěna', lvl:1, cost:2128000, reqLvl:82, dur:130000, cap:80, mul:.75, queue:20, mw:50, done:180000,
      makes:[],
      ph:[{ n:'Přístupová lávka', need:{traverza:110,dlazba:220}, xp:44000 },
          { n:'Odlamovací stěna', need:{kvadr:70,roxor:180}, xp:48000 },
          { n:'Štípárna',         need:{obklad:240,izolace:200}, xp:52000 }] },
    { name:'Velký břidlicový lom', lvl:2, cost:11970000, reqLvl:89, dur:170000, cap:180, mul:.52, queue:40, mw:110, done:520000,
      makes:[],
      ph:[{ n:'Druhá stěna',  need:{kvadr:120,traverza:170}, xp:150000 },
          { n:'Lanový výtah', need:{tabule:100,roxor:260}, xp:160000 },
          { n:'Třídírna',     need:{sklo:80,dlazba:340}, xp:175000 }] },
    { name:'Břidlicový kombinát', lvl:3, cost:55860000, reqLvl:95, dur:210000, cap:340, mul:.38, queue:70, mw:190, done:1700000,
      makes:[],
      ph:[{ n:'Hlubinná stěna', need:{tabule:260,traverza:300}, xp:480000 },
          { n:'Automatická štípačka', need:{sklo:180,kvadr:280}, xp:520000 },
          { n:'Expedice',       need:{tabule:300,sklo:200}, xp:560000 }] }
  ],
  quartz:[
    { name:'Křemenná štola', lvl:1, cost:5320000, reqLvl:85, dur:150000, cap:70, mul:.85, queue:20, mw:70, done:340000,
      makes:[],
      ph:[{ n:'Ražba štoly',  need:{traverza:150,kvadr:110}, xp:80000 },
          { n:'Výztuž',       need:{roxor:280,tabule:90}, xp:88000 },
          { n:'Sklářská pec', need:{izolace:260,obklad:280}, xp:96000 }] },
    { name:'Hlubinná štola', lvl:2, cost:23940000, reqLvl:92, dur:190000, cap:160, mul:.58, queue:40, mw:150, done:900000,
      makes:[],
      ph:[{ n:'Druhé patro', need:{kvadr:200,traverza:240}, xp:280000 },
          { n:'Důlní vlečka',need:{tabule:180,roxor:340}, xp:300000 },
          { n:'Tavírna',     need:{sklo:140,kvadr:260}, xp:330000 }] },
    { name:'Sklářský kombinát', lvl:3, cost:93100000, reqLvl:98, dur:220000, cap:300, mul:.42, queue:70, mw:240, done:2600000,
      makes:[],
      ph:[{ n:'Hlubinné patro', need:{kvadr:340,traverza:360}, xp:800000 },
          { n:'Vanová pec',     need:{sklo:240,tabule:300}, xp:860000 },
          { n:'Brusírna skla',  need:{sklo:300,kvadr:340}, xp:940000 }] }
  ],
  coal:[
    { name:'Uhelný důl', lvl:1, cost:4000, reqLvl:20, dur:14000, cap:40, mul:.6, queue:0, mw:10, done:1600, makes:[],
      ph:[{ n:'Odkrytí sloje', need:{prkno:16,cihla:10}, xp:420 },
          { n:'Důlní výztuž',  need:{prkno:20,sterk:12}, xp:460 },
          { n:'Těžní věž',     need:{sterk:18,cihla:14}, xp:500 }] },
    { name:'Hlubinný důl', lvl:2, cost:11000, reqLvl:27, dur:20000, cap:80, mul:.42, queue:0, mw:25, done:4800, makes:[],
      ph:[{ n:'Hlubinná šachta', need:{cihla:34,sterk:26}, xp:1300 },
          { n:'Důlní vozíky',    need:{prkno:30,sterk:24}, xp:1450 },
          { n:'Třídírna uhlí',   need:{cihla:28,balik:18}, xp:1600 }] },
    { name:'Velkodůl', lvl:3, cost:34000, reqLvl:33, dur:28000, cap:150, mul:.32, queue:0, mw:50, done:14000, makes:[],
      ph:[{ n:'Odstřel skrývky', need:{dlazba:30,tram:22},  xp:4200 },
          { n:'Pásová doprava',  need:{dlazba:26,obklad:20},xp:4600 },
          { n:'Rypadlo',         need:{tram:34,izolace:22}, xp:5200 }] },
    { name:'Těžební kombinát', lvl:4, cost:90000, reqLvl:40, dur:32000, cap:240, mul:.26, queue:20, mw:90, done:34000,
      makes:['uran'],
      ph:[{ n:'Úpravna rudy',    need:{tram:70,dlazba:56},  xp:12000 },
          { n:'Loužicí linka',   need:{cihla:120,obklad:60},xp:13000 },
          { n:'Sklad koncentrátu', need:{izolace:70,prkno:80}, xp:14000 }] },
    { name:'Uranový kombinát', lvl:5, cost:260000, reqLvl:53, dur:38000, cap:380, mul:.2, queue:40, mw:140, done:90000,
      makes:['uran'],
      ph:[{ n:'Obohacovací linka', need:{tram:130,dlazba:110}, xp:30000 },
          { n:'Stínění a filtry',  need:{obklad:120,cihla:160}, xp:32000 },
          { n:'Palivové kazety',   need:{izolace:130,prkno:140}, xp:34000 }] }
  ]
};
const MAKE_DUR = [0, 0, 9000, 6000, 4000, 2600];
const MTN_MAKE_DUR = [0, 16000, 10000, 6500];
const SMELT_DUR = [0, 14000, 9000, 6000];

/* z čeho se co vyrábí — ušlechtilé suroviny vznikají ze zpracovaných */
const RECIPE = {
  prkno:{ drevo:2 },   sterk:{ kamen:2 },   cihla:{ hlina:2 },   balik:{ slama:2 },
  tram:{ drevo:4 },    dlazba:{ kamen:4 },  obklad:{ hlina:4 },  izolace:{ slama:4 },
  uran:{ uhli:8 },
  roxor:{ ruda:3 }, traverza:{ ruda:9 },
  kvadr:{ zula:3 }, tabule:{ bridlice:3 }, sklo:{ kremen:3 }
};
const recipeOf = out => RECIPE[out] || {};
const recipeTxt = out => Object.entries(recipeOf(out))
  .map(([k,v]) => `${v}× ${RL(k).l.toLowerCase()}`).join(' + ');
const canMake = out => { const r = recipeOf(out);
  return Math.min.apply(null, Object.entries(r).map(([k,v]) => Math.floor(S.res[k]/v))); };

const NODE_DEF = {
  les:   { id:'les',   kind:'saw',    base:'Lesík',          res:'drevo', gx:1,  gy:1,  base_tick:2400 },
  hlina: { id:'hlina', kind:'pit',    base:'Hliniště',       res:'hlina', gx:10, gy:1,  base_tick:3000 },
  lom:   { id:'lom',   kind:'quarry', base:'Kamenité místo', res:'kamen', gx:1,  gy:10, base_tick:3200 },
  pole:  { id:'pole',  kind:'field',  base:'Louka',          res:'slama', gx:10, gy:10, base_tick:2600 },
  zula:  { id:'zula',  kind:'granite',base:'Žulová skála',   res:'zula',     gx:18, gy:57, base_tick:9000,  plat:21 },
  bridl: { id:'bridl', kind:'slateq', base:'Břidlicová stěna',res:'bridlice',gx:57, gy:57, base_tick:10000, plat:24 },
  krem:  { id:'krem',  kind:'quartz', base:'Křemenná žíla',  res:'kremen',   gx:57, gy:70, base_tick:12000, plat:30 },
  uhli:  { id:'uhli',  kind:'coal',   base:'Uhelná sloj',    res:'uhli',  gx:14, gy:10, base_tick:5000, plat:1 },
  ruda:  { id:'ruda',  kind:'iron',   base:'Železná ruda',   res:'ruda',  gx:40, gy:1,  base_tick:9000, plat:7 },
  hut:   { id:'hut',   kind:'smelt',  base:'Staveniště hutě',res:'ruda',  gx:43, gy:9,  base_tick:0, plat:7, nomine:true },
  kdilna1: { id:'kdilna1', kind:'kamdilna', base:'Kamenická dílna',        res:'zula',     gx:14, gy:53, base_tick:0, plat:21, nomine:true },
  kdilna2: { id:'kdilna2', kind:'kamdilna', base:'Velká kamenická dílna',  res:'zula',     gx:14, gy:66, base_tick:0, plat:27, nomine:true },
  krytin1: { id:'krytin1', kind:'krytina',  base:'Krytinárna',             res:'bridlice', gx:53, gy:53, base_tick:0, plat:24, nomine:true },
  sklar1:  { id:'sklar1',  kind:'sklarna',  base:'Sklárna',                res:'kremen',   gx:53, gy:66, base_tick:0, plat:30, nomine:true }
};

/* ═══════════ PLATFORMY A PARCELY ═══════════ */
const PSZ = 13;
const PLATFORMS = [
  { id:0, name:'Domovský pozemek', ox:0,  oy:0,  reqLvl:1 },
  { id:1, name:'Průmyslová zóna',  ox:13, oy:0,  reqLvl:20 },
  { id:2, name:'Sídliště',         ox:0,  oy:13, reqLvl:24 },
  { id:3, name:'Předměstí',        ox:13, oy:13, reqLvl:27 },
  { id:4, name:'Obchodní zóna',    ox:26, oy:13, reqLvl:33 },
  { id:5, name:'Vodárna',          ox:26, oy:0,  reqLvl:42 },
  { id:6, name:'Lázeňská čtvrť',   ox:13, oy:26, reqLvl:52 },
  { id:7, name:'Železárny',        ox:39, oy:0,  reqLvl:46 },
  { id:8, name:'Lunapark',         ox:26, oy:26, reqLvl:58 },
  { id:9, name:'Obchodní čtvrť',   ox:39, oy:13, reqLvl:64 },
  { id:10,name:'Říční údolí',      ox:39, oy:26, reqLvl:66 },
  { id:11,name:'Staré město',      ox:0,  oy:26, reqLvl:69 },
  { id:12,name:'Přístav',          ox:52, oy:26, reqLvl:76 },
  { id:13,name:'Nádraží',          ox:52, oy:0,  reqLvl:80 },
  { id:14,name:'Řídicí centrum',   ox:52, oy:13, reqLvl:80 },
  /* ─── horský kraj: dvě hory a údolí mezi nimi ─── */
  { id:20,name:'Koncová stanice',   ox:0, oy:52, mtn:true, reqLvl:80 },
  { id:21,name:'Žulový lom',        ox:13, oy:52, mtn:true, reqLvl:80, req:'mt4' },
  { id:22,name:'Podhůří',           ox:26, oy:52, mtn:true, reqLvl:82, req:'kdilna1' },
  { id:23,name:'Údolí potoka',      ox:39, oy:52, mtn:true, reqLvl:81, req:'mt2' },
  { id:24,name:'Břidlicová stěna',  ox:52, oy:52, mtn:true, reqLvl:84, req:'mt7' },
  { id:25,name:'Východní úbočí',    ox:65, oy:52, mtn:true, reqLvl:86, req:'mt15' },
  { id:26,name:'Západní svah',      ox:0, oy:65, mtn:true, reqLvl:83, req:'mt10' },
  { id:27,name:'Kamenické dílny',   ox:13, oy:65, mtn:true, reqLvl:85, req:'mt6' },
  { id:28,name:'Sedlo',             ox:26, oy:65, mtn:true, reqLvl:87, req:'krytin1' },
  { id:29,name:'Přehradní profil',  ox:39, oy:65, mtn:true, reqLvl:88, req:'mt28' },
  { id:30,name:'Křemenná štola',    ox:52, oy:65, mtn:true, reqLvl:90, req:'mt17' },
  { id:31,name:'Východní sedlo',    ox:65, oy:65, mtn:true, reqLvl:92, req:'sklar1' },
  { id:32,name:'Horská osada',      ox:0, oy:78, mtn:true, reqLvl:86, req:'mt20' },
  { id:33,name:'Pod vrcholem',      ox:13, oy:78, mtn:true, reqLvl:89, req:'mt27' },
  { id:34,name:'Vrchol Kamenné',    ox:26, oy:78, mtn:true, reqLvl:94, req:'mt39' },
  { id:35,name:'Zatopené údolí',    ox:39, oy:78, mtn:true, reqLvl:91, req:'mt29' },
  { id:36,name:'Vrchol Sklenné',    ox:52, oy:78, mtn:true, reqLvl:96, req:'mt34' },
  { id:37,name:'Hřeben',            ox:65, oy:78, mtn:true, reqLvl:98, req:'mt41' }
];
const PLAT = i => PLATFORMS.find(p => p.id === i) || PLATFORMS[0];
const MTN_FIRST = 20;
const isMtnPlat = i => !!(PLATFORMS.find(p => p.id === i) || {}).mtn;

const PARC = {
  p1:{ name:'Parcela 1', gx:5, gy:5, span:2, plat:0, cost:0,    accept:['chatka'], free:true },
  p2:{ name:'Parcela 2', gx:5, gy:1, span:2, plat:0, cost:300,  accept:['sklad'],  after:'p1' },
  p3:{ name:'Parcela 3', gx:1, gy:5, span:3, plat:0, cost:400,  accept:['dvur'],   after:'p2' },
  p4:{ name:'Parcela 4', gx:9, gy:5, span:3, plat:0, cost:3000, accept:['dum'],    reqLvl:15 },
  p5:{ name:'Parcela 5', gx:5, gy:9, span:3, plat:0, cost:6000, accept:['chatka','dum'], reqLvl:18 },

  e1:{ name:'Areál elektrárny', gx:17, gy:5, span:3, plat:1, cost:0, plant:true, free:true },

  s1:{ name:'Sídliště 1', gx:1,  gy:14, span:2, plat:2, cost:5000,  accept:['cinzak'], reqLvl:24 },
  s2:{ name:'Sídliště 2', gx:5,  gy:14, span:2, plat:2, cost:8000,  accept:['cinzak'], reqLvl:25 },
  s3:{ name:'Sídliště 3', gx:10, gy:14, span:2, plat:2, cost:12000, accept:['cinzak'], reqLvl:26 },
  s4:{ name:'Sídliště 4', gx:1,  gy:19, span:2, plat:2, cost:17000, accept:['cinzak'], reqLvl:28 },
  s5:{ name:'Sídliště 5', gx:5,  gy:19, span:2, plat:2, cost:24000, accept:['cinzak'], reqLvl:30 },
  s6:{ name:'Sídliště 6', gx:10, gy:19, span:2, plat:2, cost:34000, accept:['cinzak'], reqLvl:32 },

  v1:{ name:'Vila 1', gx:13, gy:14, span:3, plat:3, cost:12000, accept:['vila'], reqLvl:27 },
  v2:{ name:'Vila 2', gx:20, gy:14, span:3, plat:3, cost:20000, accept:['vila'], reqLvl:29 },
  v3:{ name:'Vila 3', gx:13, gy:22, span:3, plat:3, cost:32000, accept:['vila'], reqLvl:32 },
  v4:{ name:'Vila 4', gx:20, gy:22, span:3, plat:3, cost:50000, accept:['vila'], reqLvl:34 },
  k1:{ name:'Park 1', gx:24, gy:14, span:2, plat:3, cost:9000, accept:['park'], reqLvl:27 },
  k2:{ name:'Park 2', gx:24, gy:22, span:2, plat:3, cost:24000, accept:['park'], reqLvl:31 },

  o1:{ name:'Obchodní centrum', gx:31, gy:22, span:4, plat:4, cost:55000, accept:['obchodak'], reqLvl:33 },

  pk1:{ name:'Parkoviště 1', gx:26, gy:18, span:3, plat:4, cost:26000,  accept:['parkoviste'], reqLvl:34 },
  pk2:{ name:'Parkoviště 2', gx:33, gy:18, span:3, plat:4, cost:70000,  accept:['parkoviste'], reqLvl:38 },
  sk1:{ name:'Stánek 1', gx:27, gy:13,  span:2, plat:4, cost:9000,   accept:['stanek'], reqLvl:33 },
  sk2:{ name:'Stánek 2', gx:30, gy:13,  span:2, plat:4, cost:16000,  accept:['stanek'], reqLvl:35 },
  sk3:{ name:'Stánek 3', gx:34, gy:13,  span:2, plat:4, cost:28000,  accept:['stanek'], reqLvl:37 },
  sk4:{ name:'Stánek 4', gx:37, gy:22,  span:2, plat:4, cost:48000,  accept:['stanek'], reqLvl:40 },

  w1:{ name:'Areál vodojemu',  gx:30, gy:5, span:3, plat:5, cost:0,      pump:true, free:true },
  w2:{ name:'Čerpací stanice 1', gx:27, gy:1, span:2, plat:5, cost:40000,  pumpst:true, reqLvl:54 },
  w3:{ name:'Čerpací stanice 2', gx:37, gy:1, span:2, plat:5, cost:90000,  pumpst:true, reqLvl:58 },
  w4:{ name:'Čerpací stanice 3', gx:27, gy:9, span:2, plat:5, cost:260000, pumpst:true, reqLvl:63 },
  w5:{ name:'Čerpací stanice 4', gx:37, gy:9, span:2, plat:5, cost:700000, pumpst:true, reqLvl:69 },
  w6:{ name:'Úpravna vody',      gx:31, gy:9, span:3, plat:5, cost:400000, pumpst:true, reqLvl:60,
       water:820, mw:120, dur:100000, xp:40000, need:{roxor:70,obklad:90} },

  h1:{ name:'Hotel 1', gx:13, gy:27, span:3, plat:6, cost:60000,  accept:['hotel'], reqLvl:52 },
  h2:{ name:'Hotel 2', gx:20, gy:27, span:3, plat:6, cost:95000,  accept:['hotel'], reqLvl:54 },
  h3:{ name:'Hotel 3', gx:13, gy:35, span:3, plat:6, cost:150000, accept:['hotel'], reqLvl:57 },
  /* Železárny (7) */
  f2:{ name:'Rudný sklad',  gx:39, gy:5,  span:3, plat:7, cost:150000, ironStore:true, reqLvl:46 },
  f3:{ name:'Expediční hala', gx:46, gy:5, span:2, plat:7, cost:260000, accept:['hala'], reqLvl:52 },

  /* Lunapark (8) */
  l1:{ name:'Kolotoč 1',    gx:27, gy:27, span:2, plat:8, cost:600000,  accept:['kolotoc'], reqLvl:58 },
  l2:{ name:'Kolotoč 2',    gx:34, gy:31, span:2, plat:8, cost:1100000,  accept:['kolotoc'], reqLvl:59 },
  l3:{ name:'Horská dráha', gx:30, gy:26, span:4, plat:8, cost:2400000,  accept:['dracha'],  reqLvl:60 },
  l4:{ name:'Aquapark',     gx:30, gy:35, span:4, plat:8, cost:4000000,  accept:['aquapark'],reqLvl:62 },
  l5:{ name:'Stánky u vstupu', gx:27, gy:31, span:2, plat:8, cost:400000, accept:['stanek'], reqLvl:58 },
  l6:{ name:'Parkoviště u lunaparku', gx:26, gy:35, span:3, plat:8, cost:1400000, accept:['parkoviste'], reqLvl:61 },

  /* Obchodní čtvrť (9) */
  m1:{ name:'Mrakodrap 1', gx:43, gy:22, span:4, plat:9, cost:3000000,  accept:['mrakodrap'], reqLvl:64 },
  m2:{ name:'Mrakodrap 2', gx:43, gy:13, span:4, plat:9, cost:9000000,  accept:['mrakodrap'], reqLvl:72 },
  m3:{ name:'Nákupní pasáž', gx:39, gy:13, span:3, plat:9, cost:1200000, accept:['obchodak'], reqLvl:66 },
  m4:{ name:'Parkovací dům', gx:39, gy:22, span:3, plat:9, cost:800000,  accept:['parkoviste'], reqLvl:65 },

  /* Přehrada (10) */
  d1:{ name:'Hráz',        gx:44, gy:35, span:3, plat:10, cost:6000000, accept:['vodni'],   reqLvl:68 },
  d2:{ name:'Větrník 1',   gx:39, gy:26, span:2, plat:10, cost:800000,  accept:['vetrnik'], reqLvl:66 },
  d3:{ name:'Větrník 2',   gx:39, gy:30, span:2, plat:10, cost:1200000, accept:['vetrnik'], reqLvl:67 },
  d4:{ name:'Větrník 3',   gx:39, gy:34, span:2, plat:10, cost:1800000, accept:['vetrnik'], reqLvl:69 },
  d5:{ name:'Větrník 4',   gx:39, gy:37, span:2, plat:10, cost:2600000, accept:['vetrnik'], reqLvl:71 },
  d6:{ name:'Větrník 5',   gx:49, gy:26, span:2, plat:10, cost:4000000, accept:['vetrnik'], reqLvl:74 },

  /* Staré město (11) */
  c1:{ name:'Náměstí — radnice', gx:0,  gy:26, span:3, plat:11, cost:2600000, accept:['radnice'], reqLvl:69 },
  c2:{ name:'Kostelní parcela',  gx:5,  gy:26, span:3, plat:11, cost:2000000,  accept:['kostel'],  reqLvl:70 },
  c3:{ name:'Muzejní parcela',   gx:9,  gy:26, span:3, plat:11, cost:4500000, accept:['muzeum'],  reqLvl:72 },
  c4:{ name:'Měšťanský dům 1',   gx:0,  gy:31, span:2, plat:11, cost:700000,  accept:['mestansky'], reqLvl:69 },
  c5:{ name:'Měšťanský dům 2',   gx:5,  gy:31, span:2, plat:11, cost:1200000, accept:['mestansky'], reqLvl:71 },
  c6:{ name:'Parčík u kostela',  gx:9,  gy:31, span:2, plat:11, cost:700000,  accept:['park'],    reqLvl:70 },
  c7:{ name:'Stánky na náměstí', gx:5,  gy:35, span:2, plat:11, cost:600000,  accept:['stanek'],  reqLvl:69 },
  c8:{ name:'Parkoviště v centru',gx:0, gy:35, span:3, plat:11, cost:1800000,  accept:['parkoviste'], reqLvl:71 },

  /* Přístav (12) */
  hp1:{ name:'Nákladní přístav',  gx:52, gy:26, span:4, plat:12, cost:6000000, port:'cargo',  reqLvl:76 },
  hp2:{ name:'Cestovní kancelář', gx:52, gy:36, span:3, plat:12, cost:3000000, port:'cruise', reqLvl:78 },
  hp3:{ name:'Přístavní hala',    gx:56, gy:26, span:2, plat:12, cost:900000,  accept:['hala'],   reqLvl:76 },
  hp4:{ name:'Stánky na nábřeží', gx:55, gy:36, span:2, plat:12, cost:500000,  accept:['stanek'], reqLvl:77 },

  /* Nádraží (13) */
  t1:{ name:'Kolejiště',       gx:56, gy:0,  span:4, plat:13, cost:12000000, accept:['nadrazi'],   reqLvl:80 },
  t2:{ name:'Výtopna',         gx:52, gy:0,  span:3, plat:13, cost:2000000,  accept:['hala'],      reqLvl:81 },
  t3:{ name:'Parkoviště P+R',  gx:52, gy:5,  span:3, plat:13, cost:2400000,  accept:['parkoviste'],reqLvl:82 },
  t4:{ name:'Stánky v hale',   gx:56, gy:5,  span:2, plat:13, cost:900000,   accept:['stanek'],    reqLvl:81 },

  /* Řídicí centrum (14) */
  a1:{ name:'Dispečink',       gx:52, gy:13, span:3, plat:14, cost:9000000,  accept:['dispecink'], reqLvl:80 },
  a2:{ name:'Správa budov',    gx:57, gy:13, span:3, plat:14, cost:7000000,  accept:['sprava'],    reqLvl:81 },
  a3:{ name:'Údržbářský dvůr', gx:52, gy:18, span:2, plat:14, cost:3500000,  accept:['udrzba'],    reqLvl:82 },
  a4:{ name:'Hala u dispečinku',gx:57, gy:18,span:2, plat:14, cost:1200000,  accept:['hala'],      reqLvl:82 },

  /* ═══ HORSKÝ KRAJ ═══ */
  /* 20 Koncová stanice */
  mt2:{ name:'Horský sklad',    gx:6,  gy:53, span:3, plat:20, cost:106400, accept:['mtSklad'], reqLvl:80 },
  mt3:{ name:'Chata u nádraží', gx:1,  gy:58, span:2, plat:20, cost:1197000,  accept:['mtChata'],   reqLvl:83 },
  mt4:{ name:'Lanovka k lomu',  gx:6,  gy:58, span:2, plat:20, cost:931000,  accept:['mtLanovka'], reqLvl:82 },
  /* 21 Žulový lom */
  mt6:{ name:'Chata nad lomem', gx:20, gy:53, span:2, plat:21, cost:2128000, accept:['mtChata'],   reqLvl:85 },
  mt7:{ name:'Sklad u lomu',    gx:14, gy:60, span:3, plat:21, cost:3990000, accept:['mtSklad'],  reqLvl:87 },
  /* 22 Podhůří */
  mt8:{ name:'Podhorská chata', gx:27, gy:53, span:2, plat:22, cost:1596000, accept:['mtChata'],   reqLvl:82 },
  mt9:{ name:'Horská pila',     gx:31, gy:53, span:3, plat:22, cost:2394000, accept:['mtPila'],    reqLvl:83 },
  mt10:{name:'Lanovka do sedla',gx:27, gy:58, span:2, plat:22, cost:2926000, accept:['mtLanovka'], reqLvl:85 },
  /* 23 Údolí potoka */
  mt11:{name:'Turbína na potoce',gx:40,gy:53, span:3, plat:23, cost:798000,  accept:['mtVoda'],   reqLvl:81 },
  mt12:{name:'Chata u vody',    gx:45, gy:58, span:2, plat:23, cost:2660000, accept:['mtChata'],   reqLvl:86 },
  mt13:{name:'Lázně v údolí',   gx:40, gy:58, span:3, plat:23, cost:7980000, accept:['mtLazne'],   reqLvl:88 },
  /* 24 Břidlicová stěna */
  mt15:{name:'Chata nad stěnou',gx:59, gy:53, span:2, plat:24, cost:3458000, accept:['mtChata'],   reqLvl:85 },
  mt16:{name:'Sklad u stěny',   gx:53, gy:60, span:3, plat:24, cost:5320000, accept:['mtSklad'],  reqLvl:89 },
  /* 25 Východní úbočí */
  mt17:{name:'Lanovka na východ',gx:66,gy:53, span:2, plat:25, cost:4522000, accept:['mtLanovka'], reqLvl:87 },
  mt18:{name:'Východní chata',  gx:71, gy:53, span:2, plat:25, cost:5054000, accept:['mtChata'],   reqLvl:88 },
  mt19:{name:'Meteostanice',    gx:66, gy:59, span:2, plat:25, cost:6650000, accept:['mtMeteo'],   reqLvl:89 },

  /* 26 Západní svah */
  mt20:{ name:'Sjezdovka',       gx:1,  gy:66, span:4, plat:26, cost:11970000, accept:['mtSjezd'],reqLvl:84 },
  mt21:{ name:'Chata pod sjezdovkou',gx:7,gy:66,span:2,plat:26, cost:3990000, accept:['mtChata'],   reqLvl:86 },
  mt22:{ name:'Horská služba',   gx:1,  gy:71, span:2, plat:26, cost:5586000, accept:['mtSluzba'], reqLvl:88 },
  /* 27 Kamenické dílny */
  mt24:{ name:'Sklad dílen',     gx:20, gy:66, span:3, plat:27, cost:7980000, accept:['mtSklad'],  reqLvl:90 },
  mt25:{ name:'Dělnická chata',  gx:14, gy:71, span:2, plat:27, cost:6118000, accept:['mtChata'],   reqLvl:88 },
  /* 28 Sedlo */
  mt26:{ name:'Chata v sedle',   gx:27, gy:66, span:2, plat:28, cost:6916000, accept:['mtChata'],   reqLvl:88 },
  mt27:{ name:'Větrník na hřebeni',gx:32,gy:66, span:3, plat:28, cost:10640000, accept:['mtVitr'],  reqLvl:89 },
  mt28:{ name:'Lanovka přes sedlo',gx:27,gy:71, span:2, plat:28, cost:7182000, accept:['mtLanovka'],reqLvl:90 },
  /* 29 Přehradní profil */
  mt29:{name:'Přehrada',        gx:40, gy:67, span:4, plat:29, cost:18620000,accept:['mtVoda'],   reqLvl:90 },
  mt30:{name:'Chata nad přehradou',gx:46,gy:66,span:2,plat:29, cost:7980000, accept:['mtChata'],   reqLvl:91 },
  /* 30 Křemenná štola */
  mt32:{name:'Chata u štoly',   gx:59, gy:66, span:2, plat:30, cost:8512000, accept:['mtChata'],   reqLvl:92 },
  mt33:{name:'Sklad u štoly',   gx:53, gy:71, span:3, plat:30, cost:11970000, accept:['mtSklad'],  reqLvl:93 },
  /* 31 Východní sedlo */
  mt34:{name:'Lanovka na vrchol',gx:66,gy:66, span:2, plat:31, cost:10640000, accept:['mtLanovka'], reqLvl:93 },
  mt35:{name:'Chata ve východním sedle',gx:71,gy:66,span:2,plat:31,cost:10108000,accept:['mtChata'],reqLvl:93 },

  /* 32 Horská osada */
  mt36:{ name:'Osada 1',         gx:1,  gy:79, span:2, plat:32, cost:4788000, accept:['mtChata'],   reqLvl:86 },
  mt37:{ name:'Osada 2',         gx:5,  gy:79, span:2, plat:32, cost:5852000, accept:['mtChata'],   reqLvl:87 },
  mt38:{ name:'Horský hotel',    gx:9,  gy:79, span:3, plat:32, cost:15960000,accept:['mtHotel'],  reqLvl:90 },
  mt39:{ name:'Lanovka do osady',gx:1,  gy:84, span:2, plat:32, cost:6650000, accept:['mtLanovka'], reqLvl:89 },
  /* 33 Pod vrcholem */
  mt40:{ name:'Chata pod vrcholem',gx:14,gy:79,span:2, plat:33, cost:9310000, accept:['mtChata'],   reqLvl:90 },
  mt41:{ name:'Zubačka',         gx:18, gy:79, span:4, plat:33, cost:26600000,accept:['mtZub'], reqLvl:92 },
  /* 34 Vrchol Kamenné */
  mt42:{ name:'Rozhledna',       gx:27, gy:79, span:3, plat:34, cost:39900000,accept:['mtRozhl'],reqLvl:94 },
  mt43:{ name:'Vrcholová chata', gx:33, gy:79, span:2, plat:34, cost:14630000,accept:['mtChata'],   reqLvl:95 },
  /* 35 Zatopené údolí */
  mt44:{ name:'Přístaviště',     gx:40, gy:79, span:3, plat:35, cost:11970000, accept:['mtSklad'],  reqLvl:91 },
  mt45:{name:'Chata u jezera',  gx:46, gy:79, span:2, plat:35, cost:11172000, accept:['mtChata'],   reqLvl:92 },
  /* 36 Vrchol Sklenné */
  mt46:{name:'Druhá rozhledna', gx:53, gy:79, span:3, plat:36, cost:53200000,accept:['mtRozhl'],reqLvl:96 },
  mt47:{name:'Chata na Sklenné',gx:59, gy:79, span:2, plat:36, cost:17290000,accept:['mtChata'],   reqLvl:96 },
  /* 37 Hřeben */
  mt48:{name:'Hřebenová chata', gx:66, gy:79, span:2, plat:37, cost:19950000,accept:['mtChata'],   reqLvl:98 },
  mt49:{name:'Větrník na hřebeni 2',gx:71,gy:79,span:2,plat:37,cost:23940000,accept:['mtVitr'],   reqLvl:98 },

  h4:{ name:'Hotel 4', gx:20, gy:35, span:3, plat:6, cost:230000, accept:['hotel'], reqLvl:60 }
};
const PIDS = Object.keys(PARC);
const spanOf = id => PARC[id].span || 2;

/* ─── mapy ─── */
function homeMap() {
  const m = [];
  for (let y=0;y<PSZ;y++) { let r='';
    for (let x=0;x<PSZ;x++) {
      if ((x===4||x===8||y===4||y===8) && x!==0 && y!==0) r += 'R';
      else if (x<4 && y<4) r += 'f';
      else if (x>8 && y<4) r += 'h';
      else if (x<4 && y>8) r += 'S';
      else if (x>8 && y>8) r += 'm';
      else r += '.';
    } m.push(r); }
  return m;
}
function gridMap(g, rows, cols, skip) {
  skip = skip || {};
  const m = [];
  for (let y=0;y<PSZ;y++) { let r='';
    for (let x=0;x<PSZ;x++) {
      let road = rows.indexOf(y)>=0 || cols.indexOf(x)>=0;
      /* na téhle hraně silnice končí — za ní už nic nenavazuje */
      if (road && skip.right  && x === PSZ-1) road = false;
      if (road && skip.left   && x === 0)     road = false;
      if (road && skip.bottom && y === PSZ-1) road = false;
      if (road && skip.top    && y === 0)     road = false;
      r += road ? 'R' : g;
    } m.push(r); }
  return m;
}
/* přístav — moře na východ od ústí řeky, nábřeží a doky */
function portMap() {
  /* moře na východě, na západě ústí řeky z údolí */
  const isW = (x,y) => x >= 6 || (y >= 5 && y <= 8);
  const isB = (x,y) => !isW(x,y) &&
    [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]].some(d => isW(x+d[0], y+d[1]));
  const m = [];
  for (let y=0;y<PSZ;y++) { let r='';
    for (let x=0;x<PSZ;x++) r += isW(x,y) ? 'W' : isB(x,y) ? 'B' : '.';
    m.push(r); }
  return m;
}
/* horský terén — skály, potok, žádné silnice (jezdí se lanovkou) */
/* horské terény — bez silnic, propojení obstarají lanovky
   0 stanice · 1 lom · 2 stěna · 3 potok · 4 osada · 5 štola          */
function rnd0(x,y){ const s = Math.sin(x*127.1+y*311.7)*43758.5453; return s-Math.floor(s); }
function mtnMap(kind) {
  const m = [];
  for (let y=0;y<PSZ;y++) { let r='';
    for (let x=0;x<PSZ;x++) {
      const n = rnd0(x*1.7+kind*11, y*2.3+kind*7);
      let c;
      if (kind === 3) {                              // potok teče středem
        c = (x>=5 && x<=7) ? 'V' : (x>=4 && x<=8) ? 'b' : (n>.68 ? 'k' : 'g');
      } else if (kind === 1) {                       // lom — hodně skály
        c = n>.42 ? 'k' : n>.18 ? 'g' : 's';
      } else if (kind === 2) {                       // stěna — tmavá břidlice
        c = n>.46 ? 'K' : n>.22 ? 'k' : 's';
      } else if (kind === 5) {                       // štola
        c = n>.5 ? 'K' : n>.26 ? 'k' : 'g';
      } else if (kind === 4) {                       // osada — víc trávy
        c = n>.78 ? 'k' : n>.16 ? 'g' : 's';
      } else {                                       // koncová stanice
        c = n>.7 ? 'k' : n>.24 ? 'g' : 's';
      }
      r += c;
    } m.push(r); }
  return m;
}
const MAP0 = homeMap();
/* Přehrada — řeka teče napříč, kolem ní břehy a větrný hřeben */
function damMap() {
  /* říční údolí — žádné silnice, řeka přitéká zdola a stáčí se doprava */
  const isW = (x,y) => (x>=5 && x<=8 && y>=5) || (y>=5 && y<=8 && x>=5);
  const isB = (x,y) => !isW(x,y) &&
    [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]].some(d => isW(x+d[0], y+d[1]));
  const m = [];
  for (let y=0;y<PSZ;y++) { let r='';
    for (let x=0;x<PSZ;x++) r += isW(x,y) ? 'W' : isB(x,y) ? 'B' : '.';
    m.push(r); }
  return m;
}
const MAPS = { 0:MAP0, 1:gridMap('D',[4,8],[3,10],{top:true}), 2:gridMap('.',[4,8],[4,8],{left:true}),
               3:gridMap('.',[4,8],[3,10]), 4:gridMap('D',[4,8],[3,10]),
               5:gridMap('D',[4,8],[3,10],{top:true}), 6:gridMap('.',[4,8],[3,10],{bottom:true}),
               7:gridMap('D',[4,8],[3,10],{top:true}), 8:gridMap('.',[4,8],[3,10],{right:true,bottom:true}),
               9:gridMap('D',[4,8],[3,10],{bottom:true}), 10:damMap(),
               11:gridMap('.',[4,8],[4,8],{left:true,bottom:true}), 12:portMap(),
               13:gridMap('D',[4,8],[3,10],{right:true,top:true}),
               14:gridMap('D',[4,8],[3,10],{right:true,bottom:true}),
               20:mtnMap(0),
               21:mtnMap(1),
               22:mtnMap(2),
               23:mtnMap(3),
               24:mtnMap(4),
               25:mtnMap(5),
               26:mtnMap(0),
               27:mtnMap(1),
               28:mtnMap(2),
               29:mtnMap(3),
               30:mtnMap(4),
               31:mtnMap(5),
               32:mtnMap(0),
               33:mtnMap(1),
               34:mtnMap(2),
               35:mtnMap(3),
               36:mtnMap(4),
               37:mtnMap(5) };
const TCOL = { '.':C.grass, 'm':C.meadow, 'f':C.forest, 'S':C.quarry, 'h':C.clay,
  'R':C.road, 'D':'#6A6B63', 'W':'#3E6E86', 'B':'#7E8890',
  /* hory */
  'g':'#5E7A4E', 'k':'#7C8088', 'K':'#5A5F67', 's':'#DCE4E8',
  'V':'#4E8CA6', 'b':'#8A9098', 'G':'#6E7A62' };

/* ─── odemykání ─── */
const UNLOCKS = [
  { lv:5,  t:'Sklad',             d:'Postavíš ho na parcele 2 · kapacita 20 → 60 ks' },
  { lv:5,  t:'Vylepšení stanic',  d:'Kapacita 10 → 30 a rychlejší těžba' },
  { lv:6,  t:'Stavební dvůr',     d:'Třetí stavba · odemkne zakázky, hlavní zdroj peněz' },
  { lv:12, t:'Přístavba chatek',  d:'Zvýší nájem téměř na dvojnásobek' },
  { lv:15, t:'Rodinný dům',       d:'Vlastní parcela 3 × 3 na domovském pozemku' },
  { lv:15, t:'Zpracovny surovin', d:'Stanice začnou vyrábět prkna, štěrk, cihly a balíky' },
  { lv:18, t:'Parcela 5',         d:'Chatka nebo druhý rodinný dům' },
  { lv:20, t:'Průmyslová zóna',   d:'Nová část mapy · elektrárna a uhelný důl' },
  { lv:20, t:'Druhá kancelář',    d:'Dvě zakázky najednou' },
  { lv:22, t:'Sklad LVL 2',       d:'Kapacita 60 → 110 ks' },
  { lv:24, t:'Sídliště',          d:'Nová část mapy s činžáky' },
  { lv:24, t:'Velké provozy',     d:'Stanice LVL 3 — dvojnásobná fronta výroby' },
  { lv:26, t:'Turbína 2',         d:'Elektrárna 50 → 110 MW' },
  { lv:26, t:'Sklad LVL 3',       d:'Kapacita 110 → 180 ks' },
  { lv:27, t:'Předměstí',         d:'Nová část mapy s vilami a parky' },
  { lv:27, t:'Hlubinný důl',      d:'Uhelný důl LVL 2 · kapacita 80 ks' },
  { lv:28, t:'Chladicí věž 2',    d:'Bez ní neutáhneš třetí turbínu' },
  { lv:29, t:'Závody LVL 4',      d:'Nové suroviny — trámy, dlažba, obklady a izolace' },
  { lv:30, t:'Sklad LVL 4',       d:'Kapacita 180 → 280 ks' },
  { lv:30, t:'Dispečink a váha',  d:'Tři zakázky najednou' },
  { lv:31, t:'Turbína 3',         d:'Elektrárna 110 → 190 MW' },
  { lv:33, t:'Obchodní zóna',     d:'Nová část mapy · obchoďák, parkoviště, stánky' },
  { lv:33, t:'Velkodůl',          d:'Uhelný důl LVL 3 · kapacita 150 ks' },
  { lv:34, t:'Chladicí věž 3',    d:'Podmínka pro přestavbu na jádro' },
  { lv:34, t:'Kombináty LVL 5',   d:'Největší kapacita a nejrychlejší výroba' },
  { lv:36, t:'Turbína 4',         d:'Elektrárna 190 → 300 MW — strop uhlí' },
  { lv:40, t:'Těžební kombinát',  d:'Uhelný důl LVL 4 · z uhlí začne vyrábět uran' },
  { lv:42, t:'Vodárna',           d:'Nová část mapy · vodojem pro vylepšení staveb' },
  { lv:44, t:'Přestavba na jádro',d:'Reaktor místo kotelny · +400 MW, palivem je uran' },
  { lv:47, t:'Vodojem LVL 2',     d:'Kapacita 150 → 320 m³' },
  { lv:48, t:'Chladicí věž 4',    d:'Podmínka pro druhý blok reaktoru' },
  { lv:50, t:'Reaktor blok 2',    d:'Výkon 400 → 850 MW · 80 m³ vody' },
  { lv:52, t:'Lázeňská čtvrť',    d:'Nová část mapy s hotely' },
  { lv:53, t:'Uranový kombinát',  d:'Uhelný důl LVL 5 · největší výroba uranu' },
  { lv:54, t:'Čerpací stanice',   d:'Každá přidá 120 m³ vody navíc' },
  { lv:55, t:'Chladicí věž 5',    d:'Podmínka pro třetí blok reaktoru' },
  { lv:56, t:'Reaktor blok 3',    d:'Výkon 850 → 1600 MW · 160 m³ vody' },
  { lv:52, t:'Expediční hala',    d:'Odbyt oceli přímo v areálu železáren' },
  { lv:60, t:'Úpravna vody',      d:'Velký zdroj · přidá 820 m³ do sítě' },
  { lv:57, t:'Vodojem LVL 3',     d:'Kapacita 320 → 600 m³' },
  { lv:46, t:'Železárny',         d:'Nová část mapy · železná ruda a ocel' },
  { lv:47, t:'Hutní závod',       d:'Z rudy vyrábí roxory' },
  { lv:50, t:'Zpevněné silnice',  d:'Prašné cesty se změní v asfalt' },
  { lv:57, t:'Ocelárna',          d:'Hutní závod LVL 2 · přidá traverzy' },
  { lv:58, t:'Lunapark',          d:'Nová část mapy · kolotoče a atrakce' },
  { lv:60, t:'Horská dráha',      d:'Velká atrakce · odběr 180 MW' },
  { lv:62, t:'Aquapark',          d:'Vodní atrakce · 260 m³ vody' },
  { lv:63, t:'Chladicí věž 6',    d:'Podmínka čtvrtého bloku reaktoru' },
  { lv:64, t:'Obchodní čtvrť',    d:'Nová část mapy · mrakodrapy' },
  { lv:64, t:'Reaktor blok 4',    d:'Výkon 1600 → 2800 MW' },
  { lv:65, t:'Vodojem LVL 4',     d:'Kapacita 600 → 1200 m³' },
  { lv:71, t:'Chladicí věž 7',    d:'Podmínka pátého bloku reaktoru' },
  { lv:73, t:'Reaktor blok 5',    d:'Výkon 2800 → 6600 MW' },
  { lv:74, t:'Vodojem LVL 5',     d:'Kapacita 1200 → 2400 m³' },
  { lv:69, t:'Staré město',       d:'Nová část mapy · historické stavby zvednou nájem všude' },
  { lv:69, t:'Radnice',           d:'+7 % nájmu všem stavbám ve městě' },
  { lv:69, t:'Měšťanský dům',     d:'+4 % nájmu všem stavbám · dva domy na náměstí' },
  { lv:70, t:'Kostel',            d:'+5 % nájmu všem stavbám' },
  { lv:72, t:'Muzeum',            d:'+8 % nájmu všem stavbám' },
  { lv:60, t:'Sklad LVL 6',       d:'Kapacita 420 → 640 ks' },
  { lv:70, t:'Rudný sklad LVL 4',  d:'Kapacita 280 → 520 ks' },
  { lv:71, t:'Sklad LVL 7',       d:'Kapacita 640 → 950 ks' },
  { lv:74, t:'Rudný sklad LVL 5',  d:'Kapacita 520 → 820 ks' },
  { lv:76, t:'Přístav',           d:'Nová část mapy · nákladní loď a velké zakázky' },
  { lv:80, t:'Nádraží',           d:'Připravuje se · brána do horského kraje' },
  { lv:80, t:'Řídicí centrum',    d:'Připravuje se · město se začne obsluhovat samo' },
  { lv:78, t:'Výletní loď',       d:'Plavby bez materiálu · vydělávají samy' },
  { lv:66, t:'Přehrada',          d:'Nová část mapy · vítr a voda místo paliva' },
  { lv:66, t:'Větrná elektrárna', d:'120 MW bez paliva · nezhasne, když dojde uhlí' },
  { lv:68, t:'Vodní elektrárna',  d:'600 MW z hráze · největší obnovitelný zdroj' }
].sort((a,b)=>a.lv-b.lv);



/* ═══════════ ZAKÁZKY ═══════════
   Objednávky na materiál. Platí líp než prodej a dávají hře cíl
   i ve chvíli, kdy zrovna nemáš na co stavět.                       */
const ORDER_TIERS = [
  { id:'fast', n:'Rychlá',  dur:45000,  mul:8,  qty:[10,18], xp:0.9 },
  { id:'mid',  n:'Střední', dur:240000, mul:12, qty:[24,40], xp:1.6 },
  { id:'slow', n:'Velká',   dur:900000, mul:18, qty:[50,90], xp:2.6 }
];
const ORDER_CLIENTS = [
  'Obecní úřad','Stavební firma Novák','Truhlářství U Lípy','Statek Na Kopci',
  'Sousední vesnice','Kamenictví Skála','Cihlářský spolek','Zahradnictví Kvítek',
  'Krajská správa silnic','Družstvo Rozvoj'
];
const ORDER_SLOTS = 4;          // kolik nabídek je vidět
const ORDER_REFRESH = 90000;    // ms než se nabídka obmění
const REROLL_MAX = 3;           // kolik výměn si můžeš schovat
const REROLL_EVERY = 1200000;   // ms na doplnění jedné výměny (20 min → 3 za hodinu)


/* ═══════════ PORUCHY ═══════════
   Jednou za čas se něco rozbije. Stavba přestane fungovat,
   dokud ji hráč neopraví. Název závady sedí k typu stavby.      */
const FAULT_MIN = 300000, FAULT_MAX = 900000;   // 5 až 15 minut
const FAULT_FROM_LVL = 8;                        // dřív hráče neotravuje
const FAULT_OFFLINE = 12 * 3600 * 1000;          // zavřená hra: zhruba jedna za 12 h
const FAULT_OFFLINE_MAX = 2;                     // víc než tohle se nikdy nenajde

/* ═══════════ UDÁLOSTI NA MAPĚ ═══════════ */
const EV_MIN = 150000, EV_MAX = 360000;          // 2 až 5 minut
const EV_FROM_LVL = 6;
const CARGO_LIFE = 90000;                        // bedna počká minu a půl
const FEST_LIFE  = 300000;                       // festival trvá 5 minut
const FEST_MUL   = 2;                            // dvojnásobný nájem v lunaparku
const REPAIR_DRIVE = 8000;                       // než hasiči dojedou na místo
/* přebytek se prodává do sítě — vždycky míň, než kolik vynese budova na stejný odběr */
const MW_SELL = 1.5;                             // ¤ za MW a minutu

const FAULTS = {
  chatka:   ['Prasklá střešní krytina','Ucpaný komín','Uhnilý trám v krovu'],
  sklad:    ['Zaseknutá vrata','Propadlá podlaha','Utržený závěs vrat'],
  dvur:     ['Rozbitá váha','Porucha závory','Vytlučená okna kanceláře'],
  dum:      ['Prasklé potrubí','Vyhořelá pojistková skříň','Zatékající střecha'],
  cinzak:   ['Porucha výtahu','Prasklé stoupačky','Vytopený sklep'],
  vila:     ['Netěsnící bazén','Porucha vzduchotechniky','Rozbité zimní zahrady'],
  park:     ['Zlomená lavička','Přeražený vodovod k závlaze','Padlý strom přes cestu'],
  stanek:   ['Rozbitá lednice','Utržená markýza','Vypadlý jistič'],
  parkoviste:['Nefunkční závora','Vyhořelé osvětlení','Propadlý asfalt'],
  obchodak: ['Porucha eskalátoru','Vypadla klimatizace','Zaseknuté posuvné dveře'],
  hotel:    ['Vytopená kotelna','Porucha výtahů','Prasklý bazénový filtr'],
  hala:     ['Rozbitá jeřábová dráha','Zaseknutá vrata rampy','Prohnutá střešní vazba'],
  kolotoc:  ['Zadřený motor','Utržená sedačka','Spálené osvětlení'],
  dracha:   ['Vykolejený vozík','Prasklá kolejnice','Porucha brzd ve stanici'],
  aquapark: ['Prasklý tobogán','Zanesená filtrace','Vypadlý ohřev vody'],
  mrakodrap:['Zaseknutý výtah','Vypadla klimatizace','Prasklé sklo na fasádě'],
  vetrnik:  ['Zlomený list rotoru','Zadřená převodovka','Porucha natáčení gondoly'],
  vodni:    ['Zanesená turbína','Netěsnící přeliv','Porucha rozvodny'],
  _plant:   ['Porucha turbíny','Netěsnost v kotli','Vypadla rozvodna'],
  _plantN:  ['Odstávka reaktoru','Porucha chladicího okruhu','Závada na rozvodně'],
  _pump:    ['Prasklé čerpadlo','Zanesená úpravna','Netěsnící nádrž'],
  _pumpst:  ['Zadřené čerpadlo','Prasklý výtlak'],
  _iron:    ['Propadlá střecha haly','Zaseknutý dopravník'],
  saw:      ['Přetržený pás pily','Zlomený kotouč','Zaseknutá kladka'],
  quarry:   ['Rozbitý drtič','Utržené lano těžní kladky','Zavalená rampa'],
  field:    ['Porouchaný lis','Zaseknutý dopravník slámy','Utržený řemen'],
  pit:      ['Zaseknutá pásovka','Popraskaná vypalovací pec','Utržená korečka'],
  coal:     ['Zavalená štola','Porucha těžní věže','Vyhořelý motor pásu'],
  iron:     ['Porouchané rypadlo','Prasklý pás dopravníku','Zaseknutá drtírna'],
  smelt:    ['Vyhaslá pec','Prasklá vyzdívka','Porucha kontilití']
};


/* ═══════════ PŘÍSTAV ═══════════
   Nákladní loď odveze velkou zakázku a vrátí se za desítky minut.
   Výletní loď nepotřebuje materiál, vydělá míň, ale vrátí se dřív.  */
const PORT = {
  cargo: {
    name:'Nákladní loď', label:'Naložit a vyplout', reqLvl:76,
    build:{ dur:200000, cost:0,
      ph:[{ n:'Kesony a nábřeží', need:{sterk:300}, xp:60000 },
          { n:'Molo',             need:{roxor:220}, xp:64000 },
          { n:'Portálové jeřáby', need:{traverza:180}, xp:70000 },
          { n:'Kontejnerové pole',need:{dlazba:260,obklad:220}, xp:76000 },
          { n:'Celnice a sklad',  need:{cihla:300,izolace:240}, xp:84000 }] },
    tiers:[
      { n:'Pobřežní plavba', dur:30*60000, mul:26, qty:[40,70] },
      { n:'Dálková plavba',  dur:60*60000, mul:34, qty:[80,130] },
      { n:'Zámořská plavba', dur:90*60000, mul:44, qty:[140,220] }]
  },
  cruise: {
    name:'Výletní loď', label:'Vypravit na výlet', reqLvl:78,
    build:{ dur:170000, cost:0,
      ph:[{ n:'Základy budovy',  need:{sterk:180}, xp:40000 },
          { n:'Kanceláře',       need:{cihla:200,roxor:90}, xp:44000 },
          { n:'Terminál',        need:{traverza:80,dlazba:160}, xp:48000 },
          { n:'Nástupní můstek', need:{obklad:150,izolace:140}, xp:54000 }] },
    tiers:[
      { n:'Okružní plavba',    dur:20*60000, pay:60000 },
      { n:'Plavba po ostrovech',dur:40*60000, pay:160000 },
      { n:'Zámořská plavba',   dur:60*60000, pay:300000 }]
  }
};


/* ═══════════ HORSKÝ KRAJ — mechaniky ═══════════ */
/* horský obchod: cena roste s tím, kolik už jsi nakoupil */

/* počasí — sněhová bouře zastaví horskou těžbu */
const SNOW_MIN = 480000, SNOW_MAX = 1200000;   // 8 až 20 minut
const SNOW_LEN = 180000;                        // trvá tři minuty
const SNOW_CLEAR = 12000;                       // odklízení


/* ═══════════ HORY: SEZÓNY ═══════════ */
/* sezóny — střídají se po deseti minutách */
const SEASON_LEN = 600000;
const SEASONS = [
  { id:'leto', n:'Léto', c:'#8FA45C', d:'Turisté chodí na rozhlednu a do lázní' },
  { id:'zima', n:'Zima', c:'#A8D0DC', d:'Sjezdovka jede naplno, chaty jsou plné' }
];


/* ═══════════ K ČEMU JE KTERÁ STAVBA ═══════════
   Text se ukáže v panelu parcely dřív, než ji koupíš.            */
const WHY = {
  chatka:    'Tvůj první domek. Malý nájem, ale rozjede celou hru.',
  sklad:     'Zvětší kapacitu skladu všech surovin a odemkne obchod.',
  dvur:      'Odemkne zakázky — hlavní zdroj peněz. Vylepšení přidají další zakázku najednou.',
  dum:       'Solidní nájem za rozumnou cenu. Základ příjmu v první polovině hry.',
  cinzak:    'Víc nájemníků na menší ploše než dům. Potřebuje proud.',
  vila:      'Vysoký nájem, ale drahý materiál. Park vedle jí nájem ještě zvedne.',
  park:      'Sám nevydělá nic — zvedne nájem všem vilám na téhle platformě.',
  hotel:     'Nejvyšší nájem v lázeňské čtvrti. Spotřebuje hodně vody.',
  parkoviste:'Levná stavba se stálým příjmem. Nepotřebuje skoro žádný materiál.',
  stanek:    'Nejlevnější stavba ve hře. Rychle se vrátí, hodí se na dorovnání příjmu.',
  kolotoc:   'První atrakce v lunaparku. Točí se, když jde proud.',
  dracha:    'Velká atrakce. S vylepšením dostane smyčku a druhý vlak.',
  aquapark:  'Nejvýdělečnější atrakce, ale spolyká 260 m³ vody.',
  hala:      'Odbyt zboží přímo v areálu. Stálý nájem bez velkých nároků.',
  vetrnik:   'Dodá proud do sítě bez paliva. Točí se, i když elektrárně dojde uran.',
  vodni:     'Největší obnovitelný zdroj. 600 MW z hráze, po vylepšení 1 600.',
  mestansky: 'Nevydělá nic. Zvedne nájem VŠEM stavbám ve městě o 4 %, po přestavbách až o 11 %.',
  dispecink: 'Sveze suroviny ze všech městských stanic za tebe. V horách sklízíš sám.',
  sprava:    'Vybere nájem ze všech městských budov a vyzvedne hotové zakázky. V horách sklízíš sám.',
  udrzba:    'Opraví každou poruchu sama, ale za dvojnásobek ceny. Pohodlí za příplatek.',
  nadrazi:   'Nevydělá ani korunu. Otevře cestu do horského kraje — bez něj se tam nedostaneš.',
  obchodak:  'Velký nájem, velký odběr. Páteř obchodní zóny.',
  mrakodrap: 'Nejvyšší nájem ve městě. Dvacet fází a stovky traverz.',
  radnice:   'Nevydělá nic. Zvedne nájem VŠEM stavbám ve městě o 7 %, po přestavbách až o 18 %.',
  kostel:    'Nevydělá nic. Zvedne nájem VŠEM stavbám ve městě o 5 %, po přestavbách až o 14 %.',
  muzeum:    'Nevydělá nic. Zvedne nájem VŠEM stavbám ve městě o 8 %, po přestavbách až o 21 %.',
  /* hory */
  mtSklad:    'Jediné místo, kam se vejdou horské suroviny. Bez něj neseberš ani žulu.',
  mtVoda:     'Proud pro celé hory — z města sem nedosáhne. Po vylepšení zatopí údolí.',
  mtLanovka:   'V horách nahrazuje silnice. Spojí platformy a rozveze materiál.',
  mtChata:     'Nájem v horách. V zimě vydělá skoro dvakrát tolik co v létě.',
  mtPila:      'Těží dřevo přímo v horách, ať nejsi na vlaku závislý ve všem.',
  mtVitr:     'Proud z větru na hřebeni. Nepotřebuje vodu ani palivo.',
  mtHotel:    'Nejvyšší nájem v horách. V zimě i v létě slušný.',
  mtLazne:     'V LÉTĚ vydělají skoro dvakrát tolik. Protiváha sjezdovky.',
  mtSjezd: 'V ZIMĚ vydělá sedmkrát víc než v létě. Navíc zvedne nájem všem chatám.',
  mtRozhl: 'Nevydělá nic. Zvedne nájem VŠEM chatám a hotelům v horách až o 46 %.',
  mtZub:   'Vozí turisty nahoru. Zvedne nájem všem chatám a v létě vydělá nejvíc.',
  mtMeteo:     'Zkrátí sněhové bouře až na třetinu. Během bouře stojí veškerá horská těžba.',
  mtSluzba:   'Opraví poruchy v horách sama a levněji než městská četa.'
};
const WHY_SPECIAL = {
  plant:   'Elektrárna. Bez proudu nefunguje nic většího než chatka.',
  pump:    'Vodojem. Voda je potřeba na vylepšení domů, hotelů i atrakcí.',
  pumpst:  'Čerpací stanice — přidá vodu do sítě, ale ubere trochu proudu.',
  iron:    'Rudný sklad. Ruda, roxory a traverzy se do běžného skladu nevejdou.',
  cargo:   'Nákladní přístav. Naložíš materiál, loď odpluje a vrátí se s balíkem peněz.',
  cruise:  'Cestovní kancelář. Výletní loď nepotřebuje žádný materiál — vydělá si sama.',
};
