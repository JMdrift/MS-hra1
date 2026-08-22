/* ═══════════ stav hry, ukládání, doběh po zavření ═══════════ */
const SAVE_KEY = 'mojestavba_hra_v4';
const OFFLINE_MAX = 12 * 3600 * 1000;

const newPlot = () => ({ key:null, vr:0, phase:0, done:false, hl:1, off:0,
  rent:0, bEnd:0, bDur:0, uEnd:0, uDur:0, upKind:null });
const newNode = () => ({ lvl:0, ph:0, buf:0, on:false, auto:false, tAcc:0,
  uEnd:0, uDur:0, make:{}, mEnd:{}, autoMake:false, autoOut:{} });

const S = {
  ver:4, lvl:1, xp:0, money:0,
  res: ALL.reduce((o,r)=>(o[r.k]=0,o), {}),
  first:{}, seen:{}, mowDone:false, skladLvl:0,
  plats:{ 0:true }, owned:{ p1:true },
  plot:{}, nodes:{},
  plant:{ turb:1, cool:1, nuke:0, blok:1 }, pump:{ lvl:1 }, iron:{ lvl:0 },
  orders:[], active:[], oSeed:0, oRefresh:0, rrLeft:REROLL_MAX, rrAt:0,
  faults:{}, nextFault:0, evs:[], nextEv:0, ships:{}, autoT:{ mine:0, rent:0 },
  world:0, snow:0, nextSnow:0, mbuy:{}, train:{ q:0, end:0, auto:false, load:{} },
  exp:{}, morder:{}, mseed:1,
  stats:{ mined:{}, made:{}, orders:0, voyages:0, faults:0, repairs:0,
          built:0, upgrades:0, cargo:0, sold:0, bought:0,
          earnedRent:0, earnedOrders:0, earnedShips:0, earnedMw:0, play:0, since:0 },
  t: Date.now()
};
PIDS.forEach(id => S.plot[id] = newPlot());
Object.keys(NODE_DEF).forEach(id => S.nodes[id] = newNode());

/* ─── odvozené ─── */
const lvIdx = (v,n) => Math.max(1, Math.min(v|0 || 1, n)) - 1;
const cap = () => SKLAD_UP[S.skladLvl].cap;
/* železo má vlastní sklad — bez něj se nemá kam vejít */
const isIron = k => RL(k) && RL(k).tier === 3;
const ironStoreId = () => PIDS.find(id => PARC[id].ironStore);
const ironBuilt = () => { const id = ironStoreId(); return !!(id && S.plot[id].done); };
const ironCap = () => ironBuilt() ? IRON_STORE.levels[lvIdx(S.iron.lvl,IRON_STORE.levels.length)].cap : 0;
const nextIronLvl = () => IRON_STORE.levels[S.iron.lvl] || null;
const capOf = k => isMtnRes(k) ? mtnStoreCap() : isIron(k) ? ironCap() : cap();
const skladBuilt = () => S.skladLvl >= 1;
const isOwned = id => !!S.owned[id];
const platOpen = i => !!S.plats[i];
/* v jednom světě se kreslí jen jeho platformy */
const inThisWorld = pl => !!pl.mtn === (S.world === 1);
const visible = id => platOpen(PARC[id].plat) && inThisWorld(PLAT(PARC[id].plat));
const buildKeyOf = id => S.plot[id].key;
const defOf = id => { const k = S.plot[id].key; return k ? BUILDINGS[k] : null; };
const isPlant = id => !!PARC[id].plant;
const isPump  = id => !!PARC[id].pump;
const isIronStore = id => !!PARC[id].ironStore;
const isPumpSt= id => !!PARC[id].pumpst;
const specialDef = id => isPlant(id) ? PLANT : isPump(id) ? PUMP
  : isIronStore(id) ? IRON_STORE : PARC[id].port ? PORT[PARC[id].port].build
  : PARC[id].mtrain ? TRAIN : null;

/* varianta stavby — jiný vzhled i jiná směs materiálu */
function varOf(id) {
  const D = defOf(id); if (!D) return null;
  return D.vars[Math.min(S.plot[id].vr, D.vars.length-1)];
}
function mixNeed(need, mix) {
  if (!mix) return need;
  const out = {};
  Object.entries(need).forEach(([k,v]) => { const t = mix[k] || k; out[t] = (out[t]||0) + v; });
  return out;
}
const phaseNeed = (id, i) => { const D = defOf(id); if (!D) return {};
  return mixNeed(D.ph[i].need, (D.vars[S.plot[id].vr]||{}).mix); };
const styleOf = id => { const v = varOf(id); return v ? v.style : null; };

/* ─── stanice ─── */
const nodeDef = id => NODE_DEF[id];
const stChain = id => ST_UP[nodeDef(id).kind];
const stCur = id => { const n = S.nodes[id]; return n.lvl ? stChain(id)[n.lvl-1] : null; };
const nodeName = id => { const c = stCur(id); return c ? c.name : nodeDef(id).base; };
const nodeCap = id => { const c = stCur(id); return c ? c.cap : 10; };
const nextStUp = id => { const n = S.nodes[id], c = stChain(id); return n.lvl < c.length ? c[n.lvl] : null; };
const canUpgradeNode = id => { const u = nextStUp(id); return !!u && S.lvl >= u.reqLvl; };
const nodeMakes = id => { const c = stCur(id); return c ? c.makes : []; };
const nodeMw = id => { const c = stCur(id); return c ? (c.mw||0) : 0; };
const nodePowered = id => nodeOk(id) &&
  (isMtnNode(id) ? mtnWorks() : (nodeMw(id) === 0 || gridLive()));
const nodeQueueMax = id => { const c = stCur(id); return c ? c.queue : 0; };
const noMine = id => !!nodeDef(id).nomine;
const makeDur = id => isMtnNode(id)
  ? (MTN_MAKE_DUR[Math.min(S.nodes[id].lvl, MTN_MAKE_DUR.length-1)] || 16000)
  : nodeDef(id).kind === 'smelt'
  ? (SMELT_DUR[Math.min(S.nodes[id].lvl, SMELT_DUR.length-1)] || 14000)
  : (MAKE_DUR[Math.min(S.nodes[id].lvl, MAKE_DUR.length-1)] || 9000);
function nodeTick(id) {
  const d = nodeDef(id), c = stCur(id);
  return Math.round(d.base_tick * (c ? c.mul : 1) * Math.pow(0.96, S.nodes[id].ph));
}
const anyFactory = () => Object.keys(NODE_DEF).some(id => nodeMakes(id).length > 0);
const autoOn = (id,out) => { const n = S.nodes[id];
  return n.autoOut && n.autoOut[out] !== undefined ? !!n.autoOut[out] : !!n.autoMake; };

/* ─── historické stavby zvedají nájem v celém městě ─── */
function cityBoost() {
  let b = 0;
  PIDS.forEach(id => { const D = defOf(id), p = S.plot[id];
    if (D && D.city && p.done && plotOk(id))
      b += D.city[Math.min(p.hl, D.city.length) - 1]; });
  return b;
}

/* ─── přístav ─── */
const isPort = id => PARC[id].port;
const isTrain = id => !!PARC[id].mtrain;
const portId = kind => PIDS.find(id => PARC[id].port === kind);
const portBuilt = kind => { const id = portId(kind); return !!(id && S.plot[id].done); };
const voyage = kind => S.ships[kind] || null;
const voyageDone = kind => { const v = voyage(kind); return !!v && Date.now() >= v.end; };
function cargoOffer(tier, seed) {
  const pool = HIGH.concat(IRON).map(r => r.k).filter(k => capOf(k) > 0);
  if (!pool.length) return null;
  const t = PORT.cargo.tiers[tier];
  const rnd2 = n => { seed = (seed*1103515245 + 12345) & 0x7fffffff; return (seed>>>16) % n; };
  const need = {}; const cnt = tier === 0 ? 1 : 2;
  const picked = [];
  for (let i=0;i<cnt;i++) {
    let k = pool[rnd2(pool.length)];
    if (picked.indexOf(k) >= 0) k = pool[(pool.indexOf(k)+1) % pool.length];
    picked.push(k);
    const q = t.qty[0] + rnd2(t.qty[1]-t.qty[0]+1);
    need[k] = Math.min(q, Math.max(10, Math.floor(capOf(k)*0.8)));
  }
  let val = 0; Object.entries(need).forEach(([k,q]) => val += q * RL(k).price);
  return { tier, n:t.n, dur:t.dur, need,
    pay: Math.round(val * t.mul * (1 + S.lvl*0.02) / 100) * 100,
    xp: Math.round(val * 6) };
}
function cruiseOffer(tier) {
  const t = PORT.cruise.tiers[tier];
  return { tier, n:t.n, dur:t.dur,
    pay: Math.round(t.pay * (1 + S.lvl*0.03) / 100) * 100,
    xp: Math.round(t.pay / 8) };
}

/* ─── nájem a parky ─── */
function parkBoost(plat) {
  let b = 0;
  PIDS.forEach(id => { const D = defOf(id), p = S.plot[id];
    if (D && D.park && p.done && PARC[id].plat === plat)
      b += D.boost[Math.min(p.hl, D.boost.length) - 1]; });
  return b;
}
function houseRent(id) {
  const D = defOf(id), p = S.plot[id];
  if (!D || !D.rent) return 0;
  let m = 1;
  if (D.up) for (let i = 1; i < p.hl; i++) if (D.up[i-1] && D.up[i-1].rentMul) m = D.up[i-1].rentMul;
  const mtn = PARC[id].plat >= MTN_FIRST;
  return Math.round(D.rent * m
    * (1 + (mtn ? tourBoost() : parkBoost(PARC[id].plat) + cityBoost()))
    * (mtn ? seaMul(id) : 1)
    * festMul(PARC[id].plat));
}
const houseRentCap = id => { const D = defOf(id); if (!D || !D.rentCap) return 0;
  return Math.round(D.rentCap * (houseRent(id) / D.rent)); };
const nextHouseUp = id => { const D = defOf(id), p = S.plot[id];
  return (D && D.up && D.up[p.hl-1]) ? D.up[p.hl-1] : null; };

/* ─── energie ─── */
const plantBuilt = () => S.plot.e1 && S.plot.e1.done;
const isNuke = () => plantBuilt() && S.plant.nuke > 0;
const nBlock = () => PLANT.blocks[lvIdx(S.plant.blok,PLANT.blocks.length)];
const turbMw = () => PLANT.turbine[lvIdx(S.plant.turb,PLANT.turbine.length)].mw;
/* obnovitelné zdroje — jedou bez paliva */
function renewMw() { let t = 0;
  PIDS.forEach(id => { const D = defOf(id), p = S.plot[id];
    if (D && D.gen && p.done && plotOk(id)) t += D.gen[Math.min(p.hl, D.gen.length)-1]; });
  return t; }
const plantMw = () => (plantBuilt() && plotOk('e1')) ? turbMw() + (isNuke() ? nBlock().mw : 0) : 0;
const powerMax = () => plantMw() + renewMw();
const canUnplug = id => { const D = defOf(id); return !!(D && D.draw && S.plot[id].done); };
const isOff = id => !!S.plot[id].off;
function powerUse() { let t = 0;
  PIDS.forEach(id => { const D = defOf(id), p = S.plot[id];
    if (D && D.draw && p.done && plotOk(id)) t += D.draw[Math.min(p.hl, D.draw.length)-1]; });
  Object.keys(NODE_DEF).forEach(id => { if (nodeOk(id)) t += nodeMw(id); });
  return t + pumpPower(); }
const powerFree = () => powerMax() - powerUse();
const fuelKey = () => isNuke() ? 'uran' : 'uhli';
/* síť žije, když hoří elektrárna nebo točí vítr a voda */
const fueled = () => plantBuilt() && S.res[fuelKey()] > 0;
const livePower = () => (fueled() ? plantMw() : 0) + renewMw();
const gridLive = () => livePower() > 0;
const waterLive = () => waterMax() > 0 && gridLive();
const burnRate = () => !plantBuilt() ? 0
  : isNuke() ? nBlock().burn : Math.round(PLANT.burnBase / S.plant.turb);
/* co je potřeba odemknout dřív */
const nextTurbine = () => (!isNuke() && PLANT.turbine[S.plant.turb]) || null;
const nextCooling = () => PLANT.cooling[S.plant.cool] || null;
const nextBlock   = () => (isNuke() && PLANT.blocks[S.plant.blok]) || null;
const turbineAllowed = () => { const u = nextTurbine();
  return !!u && S.plant.cool >= u.cool; };
const blockAllowed = () => { const u = nextBlock();
  return !!u && S.plant.cool >= u.cool; };
const nukeReady = () => plantBuilt() && !isNuke()
  && S.plant.turb >= PLANT.turbine.length && S.plant.cool >= PLANT.nuclear.cool;

const drawOf = id => { const D = defOf(id), p = S.plot[id];
  return (D && D.draw) ? D.draw[Math.min(p.hl, D.draw.length)-1] : 0; };
/* ─── voda ─── */
const pumpBuilt = () => S.plot.w1 && S.plot.w1.done;
function waterMax() {
  if (!pumpBuilt()) return 0;
  if (!plotOk('w1')) return 0;
  let t = PUMP.levels[lvIdx(S.pump.lvl,PUMP.levels.length)].water;
  PIDS.forEach(id => { if (isPumpSt(id) && S.plot[id].done && plotOk(id)) t += pstOf(id,'water'); });
  return t;
}
function waterUse() {
  let t = 0;
  PIDS.forEach(id => { const D = defOf(id), p = S.plot[id];
    if (D && D.wdraw && p.done && plotOk(id)) t += D.wdraw[Math.min(p.hl, D.wdraw.length)-1]; });
  if (plantBuilt()) for (let i=1;i<Math.min(S.plant.cool,PLANT.cooling.length);i++) t += (PLANT.cooling[i].water||0);
  if (isNuke()) for (let i=1;i<Math.min(S.plant.blok,PLANT.blocks.length);i++) t += (PLANT.blocks[i].water||0);
  return t;
}
const waterFree = () => waterMax() - waterUse();
const wdrawOf = id => { const D = defOf(id), p = S.plot[id];
  return (D && D.wdraw) ? D.wdraw[Math.min(p.hl, D.wdraw.length)-1] : 0; };
const nextPumpLvl = () => PUMP.levels[S.pump.lvl] || null;
/* vodojem a čerpací stanice si berou proud */
function pumpPower() {
  if (!pumpBuilt()) return 0;
  let t = PUMP.levels[lvIdx(S.pump.lvl,PUMP.levels.length)].mw;
  PIDS.forEach(id => { if (isPumpSt(id) && S.plot[id].done) t += pstOf(id,'mw'); });
  return t;
}


/* ─── zakázky ─── */
const officeId = () => PIDS.find(id => { const D = defOf(id); return D && D.office && S.plot[id].done; });
const hasOffice = () => !!officeId();
const orderSlots = () => { const id = officeId(); return id ? Math.min(3, S.plot[id].hl) : 0; };
function orderPool() {
  const out = ['drevo','kamen','slama','hlina'];
  if (Object.keys(NODE_DEF).some(i=>S.nodes[i].lvl>=1 && nodeDef(i).kind==='coal')) out.push('uhli');
  Object.keys(NODE_DEF).forEach(i => nodeMakes(i).forEach(m => { if (out.indexOf(m)<0) out.push(m); }));
  return out;
}
function makeOrder(seed) {
  let pool = orderPool();
  const rnd2 = n => { seed = (seed*1103515245 + 12345) & 0x7fffffff; return (seed >>> 16) % n; };
  /* drahé zakázky jsou o něco častější než dřív */
  const roll = rnd2(100);
  const tier = ORDER_TIERS[roll < 42 ? 0 : roll < 76 ? 1 : 2];
  const cnt = tier.id === 'fast' ? 1 : (rnd2(10) < 6 ? 1 : 2);
  const lim = Math.max(6, Math.floor(cap()*0.85));
  /* u větších zakázek si častěji řeknou o dražší materiál */
  if (tier.id !== 'fast' && pool.length > 4 && rnd2(100) < 30) {
    const hi = pool.filter(k => RL(k).tier >= 1);
    if (hi.length) pool = hi;
  }
  const need = {}; const picked = [];
  for (let i = 0; i < cnt; i++) {
    let k = pool[rnd2(pool.length)];
    if (picked.indexOf(k) >= 0) k = pool[(pool.indexOf(k)+1) % pool.length];
    picked.push(k);
    const base = tier.qty[0] + rnd2(tier.qty[1]-tier.qty[0]+1);
    let q = Math.max(4, Math.round(base / (RL(k).tier===2?3:RL(k).tier===1?1.8:1)));
    need[k] = Math.min(q, lim);
  }
  let val = 0;
  Object.entries(need).forEach(([k,q]) => val += q * RL(k).price);
  const lvlMul = 1 + S.lvl * 0.04;
  return { id:'o'+seed, tier:tier.id, name:tier.n, dur:tier.dur,
    client: ORDER_CLIENTS[rnd2(ORDER_CLIENTS.length)],
    need, pay: Math.round(val * tier.mul * lvlMul / 10) * 10,
    xp: Math.round(val * tier.xp) };
}
function refreshOrders(force) {
  if (!hasOffice()) { S.orders = []; return; }
  const now = Date.now();
  if (!force && S.orders.length >= ORDER_SLOTS && now < S.oRefresh) return;
  while (S.orders.length < ORDER_SLOTS) S.orders.push(makeOrder(++S.oSeed + S.lvl*7));
  S.oRefresh = now + ORDER_REFRESH;
}
function rerollRegen() {
  const now = Date.now();
  if (!S.rrAt) S.rrAt = now;
  if (S.rrLeft >= REROLL_MAX) { S.rrAt = now; return; }
  const gained = Math.floor((now - S.rrAt) / REROLL_EVERY);
  if (gained > 0) {
    S.rrLeft = Math.min(REROLL_MAX, S.rrLeft + gained);
    S.rrAt += gained * REROLL_EVERY;
    if (S.rrLeft >= REROLL_MAX) S.rrAt = now;
  }
}
const rerollLeft = () => { rerollRegen(); return S.rrLeft; };
const rerollIn = () => { rerollRegen();
  return S.rrLeft >= REROLL_MAX ? 0 : Math.max(0, REROLL_EVERY - (Date.now()-S.rrAt)); };
function rerollOrder(i) {
  rerollRegen();
  if (S.rrLeft <= 0) return false;
  if (S.rrLeft >= REROLL_MAX) S.rrAt = Date.now();
  S.rrLeft--;
  S.orders[i] = makeOrder(++S.oSeed + Date.now()%9973);
  return true;
}

/* ─── poruchy ─── */
const isBroken = key => !!S.faults[key];
const faultOf  = key => S.faults[key];
const plotOk   = id => !S.plot[id].off && !isBroken('p:'+id);
const nodeOk   = id => !isBroken('n:'+id);
const faultCount = () => Object.keys(S.faults).length;

/* co všechno se může rozbít */
function faultTargets() {
  const out = [];
  PIDS.forEach(id => { const st = S.plot[id];
    if (!st.done || st.off || isBroken('p:'+id)) return;
    out.push({ key:'p:'+id, id });
  });
  Object.keys(NODE_DEF).forEach(id => {
    if (!S.nodes[id].lvl || isBroken('n:'+id)) return;
    out.push({ key:'n:'+id, id, node:true });
  });
  return out;
}
function faultName(t) {
  let pool;
  if (t.node) pool = FAULTS[nodeDef(t.id).kind];
  else if (isPlant(t.id)) pool = isNuke() ? FAULTS._plantN : FAULTS._plant;
  else if (isPump(t.id)) pool = FAULTS._pump;
  else if (isPumpSt(t.id)) pool = FAULTS._pumpst;
  else if (isIronStore(t.id)) pool = FAULTS._iron;
  else { const D = defOf(t.id); pool = D ? FAULTS[S.plot[t.id].key] : null; }
  pool = pool || ['Technická závada'];
  return pool[Math.floor(Math.random()*pool.length)];
}
function faultTitle(t) {
  if (t.node) return nodeName(t.id);
  if (isPlant(t.id)) return isNuke() ? 'Jaderná elektrárna' : 'Elektrárna';
  if (isPump(t.id)) return 'Vodojem';
  if (isIronStore(t.id)) return 'Rudný sklad';
  if (isPumpSt(t.id)) return PARC[t.id].name;
  const D = defOf(t.id); return D ? D.name : PARC[t.id].name;
}
/* oprava stojí podle toho, jak drahá stavba to je — ale nikdy moc */
function repairCost(key) {
  const id = key.slice(2);
  const round = v => Math.max(200, Math.round(v/10)*10);
  if (key[0] === 'n') { const c = stCur(id);
    return round((c ? c.cost : 1000) * 0.008 + S.nodes[id].lvl * 250); }
  /* zhruba deset minut toho, co stavba vydělá — ať je to vždycky snesitelné */
  const D = defOf(id), sp = spanOf(id);
  if (D && D.rent) return round(houseRent(id) * 10 + sp * 60);
  if (isPlant(id)) return round((turbMw() + (isNuke() ? nBlock().mw : 0)) * 2 + 1500);
  if (isPump(id)) return round(PUMP.levels[lvIdx(S.pump.lvl,PUMP.levels.length)].water * 3 + 1000);
  if (isPumpSt(id)) return round(pstOf(id,'water') * 3);
  if (isIronStore(id)) return round(ironCap() * 5 + 400);
  return round(300 + sp * sp * 90);   // sklad, dvůr, park
}
function newFault() {
  const list = faultTargets();
  if (!list.length) return null;
  const t = list[Math.floor(Math.random()*list.length)];
  S.faults[t.key] = { n: faultName(t), t: Date.now() };
  return { key:t.key, name:S.faults[t.key].n, title:faultTitle(t), cost:repairCost(t.key) };
}
function scheduleFault() {
  S.nextFault = Date.now() + FAULT_MIN + Math.random()*(FAULT_MAX-FAULT_MIN);
}

/* ─── události na mapě ─── */
const festActive = () => S.evs.some(e => e.t === 'fest' && Date.now() < e.end);
const festMul = plat => (plat === 8 && festActive()) ? FEST_MUL : 1;

function freeTile() {
  const open = PLATFORMS.filter(p => platOpen(p.id));
  for (let tries = 0; tries < 40; tries++) {
    const pl = open[Math.floor(Math.random()*open.length)];
    const x = Math.floor(Math.random()*PSZ), y = Math.floor(Math.random()*PSZ);
    const c = MAPS[pl.id][y][x];
    if (c === 'R' || c === 'W') continue;
    const gx = pl.ox+x, gy = pl.oy+y;
    if (PARCEL_TILES.has(gx+','+gy)) continue;
    if (S.evs.some(e => e.gx === gx && e.gy === gy)) continue;
    return { gx, gy };
  }
  return null;
}
function cargoLoot() {
  const pool = ALL.filter(r => S.res[r.k] !== undefined && capOf(r.k) > 0
    && (r.tier === 0 || (r.tier === 1 && anyFactory())
        || (r.tier === 2 && Object.keys(NODE_DEF).some(i => S.nodes[i].lvl >= 4))));
  if (!pool.length || Math.random() < .3)
    return { money: Math.max(300, Math.round(S.lvl * 6) * 10) };
  const r = pool[Math.floor(Math.random()*pool.length)];
  const q = Math.max(4, Math.min(Math.floor(capOf(r.k)*.15), 6 + Math.floor(S.lvl/4)));
  return { res:r.k, q };
}
function newEvent() {
  const canFest = PIDS.some(id => PARC[id].plat === 8 && S.plot[id].done && defOf(id) && defOf(id).rent);
  if (canFest && !festActive() && Math.random() < .35) {
    S.evs.push({ id:'e'+Date.now(), t:'fest', gx:32, gy:32, end: Date.now()+FEST_LIFE });
    return { t:'fest' };
  }
  const spot = freeTile(); if (!spot) return null;
  const loot = cargoLoot();
  S.evs.push(Object.assign({ id:'e'+Date.now(), t:'cargo', end: Date.now()+CARGO_LIFE }, spot, loot));
  return { t:'cargo', loot };
}
function scheduleEvent() { S.nextEv = Date.now() + EV_MIN + Math.random()*(EV_MAX-EV_MIN); }
function pruneEvents() { const now = Date.now(); S.evs = S.evs.filter(e => now < e.end); }

/* ═══════════ HORSKÝ KRAJ ═══════════ */
const inMtn = () => S.world === 1;
const mtnOpen = () => PLATFORMS.some(p => p.mtn && platOpen(p.id));

/* vlastní sklad na horské suroviny */
const mtnStoreCap = () => { let c = 0;
  PIDS.forEach(id => { const D = defOf(id), p = S.plot[id];
    if (D && D.mtnStore && p.done && plotOk(id))
      c += D.mtnStore[Math.min(p.hl, D.mtnStore.length) - 1]; });
  return c; };
/* vlastní síť — proud z města sem nedosáhne */
function mPowerMax() { let t = 0;
  PIDS.forEach(id => { const D = defOf(id), p = S.plot[id];
    if (D && D.mgen && p.done && plotOk(id))
      t += D.mgen[Math.min(p.hl, D.mgen.length) - 1]; });
  return t; }
function mPowerUse() { let t = 0;
  PIDS.forEach(id => { const D = defOf(id), p = S.plot[id];
    if (D && D.mdraw && p.done && plotOk(id))
      t += D.mdraw[Math.min(p.hl, D.mdraw.length) - 1]; });
  Object.keys(NODE_DEF).forEach(id => {
    if ((nodeDef(id).plat||0) >= MTN_FIRST && nodeOk(id)) t += nodeMw(id); });
  return t; }
const mPowerFree = () => mPowerMax() - mPowerUse();
const isMtnNode = id => (nodeDef(id).plat||0) >= MTN_FIRST;
const mtnLive = () => mPowerMax() > 0 && mPowerFree() >= 0;

/* počasí */
const snowing = () => !!S.snow && Date.now() < S.snow;
const mtnWorks = () => mtnLive() && !snowing();

/* vlak */
const trainId = () => PIDS.find(id => PARC[id].mtrain);
const trainBuilt = () => { const id = trainId(); return !!(id && S.plot[id].done); };
const trainCap = () => { const id = trainId();
  return id ? TRAIN.cap[Math.min(S.plot[id].hl, TRAIN.cap.length)-1] : 0; };

/* horský obchod — cena roste s objemem nákupů */
function mtnPrice(k) {
  const r = RL(k), base = Math.round(r.price * MTN_BUY_MUL);
  const b = S.mbuy[k];
  if (!b) return base;
  const decay = Math.max(0, 1 - (Date.now() - b.t) / MTN_COOL);
  const steps = Math.floor(b.n / MTN_STEP) * decay;
  return Math.round(base * Math.pow(1 + MTN_RISE, steps));
}
function mtnBought(k, n) {
  const b = S.mbuy[k];
  if (!b || Date.now() - b.t > MTN_COOL) S.mbuy[k] = { n, t: Date.now() };
  else { b.n += n; b.t = Date.now(); }
}

/* co skončí pod hladinou, musí se před zvednutím hráze vykoupit */
function willFlood(newLevel) {
  const out = [];
  PIDS.forEach(id => { const P = PARC[id], st = S.plot[id];
    if (P.plat < MTN_FIRST || !isOwned(id)) return;
    if (P.flood === false) return;
    const gx = P.gx + spanOf(id)/2, gy = P.gy + spanOf(id)/2;
    if (!(Math.abs(gx-39) < 8 && gy > 56 && gy < 68)) return;
    if (hillZ(P.gx, P.gy) >= newLevel) return;
    out.push(id);
  });
  return out;
}
const floodPayout = id => Math.round(((PARC[id].cost||0) * 1.4 + 200000) / 1000) * 1000;
const floodBill = list => list.reduce((a,id) => a + floodPayout(id), 0);

/* ─── sezóny ─── */
let __SEA = -1;   // jen pro testy
const seasonIdx = () => __SEA >= 0 ? __SEA : Math.floor(Date.now() / SEASON_LEN) % 2;
const season = () => SEASONS[seasonIdx()];
const seasonLeft = () => SEASON_LEN - (Date.now() % SEASON_LEN);
const seaMul = id => { const D = defOf(id);
  return (D && D.sea) ? D.sea[seasonIdx()] : 1; };

/* ─── vývoz do města ─── */
const exportRun = () => S.exp && S.exp.end ? S.exp : null;
const exportDone = () => { const e = exportRun(); return !!e && Date.now() >= e.end; };
function exportOffer(tier, seed) {
  const pool = MTNM.map(r => r.k).filter(k => capOf(k) > 0);
  if (!pool.length) return null;
  const t = EXPORT.tiers[tier];
  const rnd2 = n => { seed = (seed*1103515245 + 12345) & 0x7fffffff; return (seed>>>16) % n; };
  const need = {}; const cnt = tier === 0 ? 1 : 2;
  const picked = [];
  for (let i=0;i<cnt;i++) { let k = pool[rnd2(pool.length)];
    if (picked.indexOf(k) >= 0) k = pool[(pool.indexOf(k)+1) % pool.length];
    picked.push(k);
    const q = t.qty[0] + rnd2(t.qty[1]-t.qty[0]+1);
    need[k] = Math.max(20, Math.min(q, Math.floor(mtnStoreCap()*0.85))); }
  let val = 0; Object.entries(need).forEach(([k,q]) => val += q * RL(k).price);
  return { tier, n:t.n, dur:t.dur, need,
    pay: Math.round(val * t.mul * (1 + S.lvl*0.015) / 1000) * 1000,
    xp: Math.round(val * 4) };
}

/* ─── kamenické zakázky ─── */
function mtnOrderMake(seed) {
  const pool = MTNM.map(r => r.k).filter(k => capOf(k) > 0);
  if (!pool.length) return null;
  const rnd2 = n => { seed = (seed*1103515245 + 12345) & 0x7fffffff; return (seed>>>16) % n; };
  const size = ['min','mid','big'][rnd2(3)];
  const k = pool[rnd2(pool.length)];
  const r = MORDER[size];
  let q = r[0] + rnd2(r[1]-r[0]+1);
  q = Math.max(10, Math.min(q, Math.floor(mtnStoreCap()*0.8)));
  return { k, q, size,
    pay: Math.round(q * RL(k).price * MORDER_MUL * (1 + S.lvl*0.01) / 100) * 100,
    xp: Math.round(q * RL(k).price / 3) };
}
const mtnOrder = () => S.morder && S.morder.k ? S.morder : null;

/* turistika — rozhledny, sjezdovky a zubačka zvednou nájem všem chatám */
function tourBoost() {
  let b = 0;
  PIDS.forEach(id => { const D = defOf(id), p = S.plot[id];
    if (D && D.tour && p.done && plotOk(id))
      b += D.tour[Math.min(p.hl, D.tour.length) - 1]; });
  return b;
}
/* meteostanice zkrátí sněhové bouře */
function snowMul() {
  let m = 1;
  PIDS.forEach(id => { const D = defOf(id), p = S.plot[id];
    if (D && D.snowCut && p.done && plotOk(id))
      m = Math.min(m, D.snowCut[Math.min(p.hl, D.snowCut.length) - 1]); });
  return m;
}
/* horské dílny — výroba přímo ve stavbě */
const mtnWorks2 = id => { const D = defOf(id); return D && (D.makes || D.mines); };
function workLevel(id, key) { const D = defOf(id), p = S.plot[id];
  return D && D[key] ? D[key][Math.min(p.hl, D[key].length) - 1] : 0; }

/* ─── automatizace ─── */
function autoOf(key) {          // vrátí hodnotu podle úrovně postavené stavby
  let v = null;
  PIDS.forEach(id => { const D = defOf(id), p = S.plot[id];
    if (!D || !D[key] || !p.done || !plotOk(id)) return;
    v = D[key][Math.min(p.hl, D[key].length) - 1];
  });
  return v;
}
const autoMineMs = () => autoOf('autoMine');
const autoRentMs = () => autoOf('autoRent');
const autoFixMul = () => autoOf('autoFix');
const hasWorld = () => PIDS.some(id => { const D = defOf(id);
  return D && D.world && S.plot[id].done; });

/* přebytek výkonu se prodává do sítě */
const surplusMw = () => Math.max(0, (fueled() ? plantMw() : 0) + renewMw() - powerUse());
const surplusRate = () => surplusMw() * MW_SELL;

/* ─── statistiky ─── */
const ST = S.stats;
const bump = (k, n) => { S.stats[k] = (S.stats[k]||0) + (n===undefined?1:n); };
const bumpRes = (grp, k, n) => { const g = S.stats[grp];
  g[k] = (g[k]||0) + n; };
function statTotals() {
  const sum = o => Object.values(o).reduce((a,b)=>a+b,0);
  const doneB = PIDS.filter(id => S.plot[id].done).length;
  const rentMin = PIDS.reduce((a,id)=>a+houseRent(id),0);
  return {
    doneB, rentMin,
    mined: sum(S.stats.mined), made: sum(S.stats.made),
    earned: S.stats.earnedRent + S.stats.earnedOrders + S.stats.earnedShips + (S.stats.earnedMw||0),
    play: S.stats.play
  };
}
function bestBuilding() {
  let best = null, bv = 0;
  PIDS.forEach(id => { const r = houseRent(id); if (r > bv) { bv = r; best = id; } });
  return best ? { id:best, rent:bv } : null;
}

/* ─── ukládání ─── */
let saveT = 0;
function save() { S.t = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
function saveSoon() { const now = Date.now();
  if (now - saveT > 2000) { saveT = now; save(); } }
function wipe() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} location.reload(); }
function load() {
  let raw = null;
  try { raw = localStorage.getItem(SAVE_KEY); } catch (e) {}
  if (!raw) return 0;
  let d; try { d = JSON.parse(raw); } catch (e) { return 0; }
  if (!d || d.ver !== S.ver) return 0;
  ['lvl','xp','money','mowDone','skladLvl','t'].forEach(k => { if (d[k] !== undefined) S[k] = d[k]; });
  Object.assign(S.res, d.res||{}); Object.assign(S.first, d.first||{}); Object.assign(S.seen, d.seen||{});
  Object.assign(S.plats, d.plats||{}); Object.assign(S.owned, d.owned||{});
  Object.assign(S.plant, d.plant||{});
  Object.assign(S.pump, d.pump||{});
  Object.assign(S.iron, d.iron||{});
  if (Array.isArray(d.orders)) S.orders = d.orders;
  if (Array.isArray(d.active)) S.active = d.active;
  Object.assign(S.faults, d.faults||{});
  S.nextFault = d.nextFault || 0;
  if (Array.isArray(d.evs)) S.evs = d.evs;
  Object.assign(S.ships, d.ships||{});
  Object.assign(S.autoT, d.autoT||{});
  S.world = d.world||0; S.snow = d.snow||0; S.nextSnow = d.nextSnow||0;
  Object.assign(S.mbuy, d.mbuy||{});
  Object.assign(S.train, d.train||{});
  Object.assign(S.exp, d.exp||{});
  Object.assign(S.morder, d.morder||{});
  S.mseed = d.mseed || 1;
  if (d.stats) { Object.assign(S.stats, d.stats);
    S.stats.mined = d.stats.mined || {}; S.stats.made = d.stats.made || {}; }
  S.nextEv = d.nextEv || 0;
  S.oSeed = d.oSeed||0; S.oRefresh = d.oRefresh||0;
  if (d.rrLeft !== undefined) S.rrLeft = d.rrLeft;
  S.rrAt = d.rrAt || Date.now();
  PIDS.forEach(id => { if (d.plot && d.plot[id]) Object.assign(S.plot[id], d.plot[id]); });
  Object.keys(NODE_DEF).forEach(id => { if (d.nodes && d.nodes[id]) Object.assign(S.nodes[id], d.nodes[id]); });
  return Math.min(OFFLINE_MAX, Math.max(0, Date.now() - (d.t || Date.now())));
}

/* ─── doběh času, když byla hra zavřená ─── */
function catchUp(ms) {
  if (ms < 5000) return null;
  const rep = { ms, gained:{}, made:{}, rent:0, burned:0, outage:false };
  const now = Date.now();

  Object.keys(NODE_DEF).forEach(id => {
    const n = S.nodes[id], d = nodeDef(id);
    if (n.on && !noMine(id) && nodePowered(id)) {
      const tick = nodeTick(id);
      const add = Math.floor((n.tAcc + ms) / tick);
      n.tAcc = (n.tAcc + ms) % tick;
      const got = Math.max(0, Math.min(nodeCap(id) - n.buf, add));
      if (got > 0) { n.buf += got; rep.gained[d.res] = (rep.gained[d.res]||0) + got; }
      if (n.buf >= nodeCap(id)) { n.on = false; n.auto = true; }
    }
    const dur = makeDur(id);
    if (nodePowered(id)) nodeMakes(id).forEach(out => {
      let q = n.make[out] || 0; if (!q) return;
      const can = Math.floor(ms / dur);
      let done = 0;
      for (let i = 0; i < Math.min(can, q); i++) {
        if (S.res[out] >= capOf(out)) break;
        S.res[out]++; q--; done++;
      }
      n.make[out] = q;
      if (done) rep.made[out] = (rep.made[out]||0) + done;
      if (q > 0) n.mEnd[out] = now + dur;
    });
    if (n.uEnd && now >= n.uEnd) n.uEnd = 0;
  });

  rep.orders = 0;
  S.active.forEach(a => { if (now >= a.end) rep.orders++; });

  /* poruchy za zavřenou hru — mnohem vzácnější než při hraní */
  rep.faults = [];
  if (S.lvl >= FAULT_FROM_LVL) {
    let n = Math.floor(ms / FAULT_OFFLINE);
    if (Math.random() < (ms % FAULT_OFFLINE) / FAULT_OFFLINE) n++;
    n = Math.min(n, FAULT_OFFLINE_MAX);
    for (let i = 0; i < n; i++) { const f = newFault(); if (f) rep.faults.push(f); }
  }
  scheduleFault();

  const br = burnRate(), fk = fuelKey();
  if (br > 0 && S.res[fk] > 0) {
    const want = Math.floor(ms / br);
    const burned = Math.min(S.res[fk], want);
    S.res[fk] -= burned; rep.burned = burned; rep.fuel = fk;
    rep.outage = burned < want;
  }
  const live = powerMax() > 0 && (S.res[fuelKey()] > 0 || rep.burned > 0);

  PIDS.forEach(id => {
    const p = S.plot[id], D = defOf(id);
    if (p.bEnd && now >= p.bEnd) p.bEnd = 0;
    if (p.uEnd && now >= p.uEnd) p.uEnd = 0;
    if (!D || !p.done || !D.rent) return;
    if (!plotOk(id)) return;
    if (D.needPower && !live) return;
    const rc = houseRentCap(id), before = p.rent;
    p.rent = Math.min(rc, p.rent + houseRent(id) * (ms/60000));
    rep.rent += p.rent - before;
  });
  return rep;
}
