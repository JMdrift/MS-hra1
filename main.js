/* ═══════════ herní logika ═══════════ */
const has = n => Object.entries(n).every(([k,v]) => S.res[k] >= v);
const pay = n => Object.entries(n).forEach(([k,v]) => S.res[k] -= v);
const nUp = l => Object.keys(NODE_DEF).filter(id => S.nodes[id].lvl >= l
  && nodeDef(id).kind !== 'coal').length;

function canBuy(id) {
  const p = PARC[id];
  if (isOwned(id) || !visible(id)) return false;
  if (p.reqLvl && S.lvl < p.reqLvl) return false;
  if (p.after && !S.plot[p.after].done) return false;
  return true;
}
function buyParcel(id) {
  const p = PARC[id];
  if (!canBuy(id)) { toast('Zatím nedostupné'); return; }
  if (S.money < p.cost) { toast('Chybí '+fmt(p.cost-S.money)); return; }
  S.money -= p.cost; S.owned[id] = true; addXP(20);
  renderTop(); toast(p.name+' je tvoje'); renderDetail(); save();
}
function addXP(n) {
  S.xp += n;
  while (S.lvl < MAXLVL && S.xp >= LVL[S.lvl]) { S.lvl++; onLevel(S.lvl); }
  renderTop(); renderQuest();
}
function questReward() { return Math.round(120 + S.lvl*S.lvl*2.5); }
/* dorovná level podle XP — po rozšíření tabulky levelů v nové verzi hry */
function syncLevel() {
  let gained = 0;
  while (S.lvl < MAXLVL && S.xp >= LVL[S.lvl]) { S.lvl++; gained++; onLevel(S.lvl); }
  if (gained) {
    renderTop(); renderQuest(); save();
    deferred.push({ kick:'Postup', tone:'ok',
      title: gained > 1 ? `Postoupil jsi o ${gained} úrovní` : 'Nová úroveň',
      desc:`Měl jsi nasbíráno víc zkušeností, než kam sahala tabulka. Teď jsi na <b>LVL ${S.lvl}</b>.`,
      lines:[['Zkušenosti', fmtN(S.xp)+' XP'],
             ['Další úroveň', S.lvl<MAXLVL ? fmtN(LVL[S.lvl]-S.xp)+' XP' : 'jsi na maximu']] });
  }
}
/* otevře všechny oblasti, na které už hráč má level —
   ošetří i případ, kdy oblast přibyla až v nové verzi hry */
function syncPlatforms() {
  /* bez nádraží hory neexistují — ošetří i staré uložené hry */
  if (!hasWorld()) {
    PLATFORMS.forEach(pl => { if (pl.mtn) delete S.plats[pl.id]; });
    if (S.world === 1) { S.world = 0; WB = worldBounds(); }
  }
  PLATFORMS.forEach(pl => {
    if (pl.soon) return;                       // zatím se jen připravuje
    if (pl.mtn && !hasWorld()) return;         // do hor až po nádraží
    if (pl.id && S.lvl >= pl.reqLvl && !platOpen(pl.id)) openPlatform(pl.id);
  });
}
function onLevel(l) {
  syncPlatforms();
  const un = UNLOCKS.filter(u => u.lv === l);
  if (un.length) showEvent({ once:'lvl'+l, kick:'Nová úroveň', tone:'am', title:'LVL '+l,
    desc: un.length>1?'Odemklo se několik věcí.':'Něco nového se odemklo.',
    lines: un.map(u=>[u.t,u.d]), flash:`LVL ${l} — něco se odemklo` });
  else toast('LVL '+l);
  renderRes(); save();
}

/* ─── sběr ─── */
function collect(id, quiet) {
  const n = S.nodes[id], d = nodeDef(id);
  const room = capOf(d.res) - S.res[d.res], take = Math.min(room, n.buf);
  if (take <= 0) { if (!quiet) toast(isIron(d.res) && !ironBuilt()
    ? 'Ruda nemá kam — postav rudný sklad' : 'Sklad je plný — '+RL(d.res).l.toLowerCase());
    return 0; }
  S.res[d.res] += take; n.buf -= take; bumpRes('mined', d.res, take);
  if (n.auto && n.buf < nodeCap(id)) { n.auto = false; n.on = true; n.tAcc = 0; }
  let g = take*XPC;
  if (!S.first[d.res]) { S.first[d.res] = 1; g += XPFIRST; }
  const c = iso(d.gx+1, d.gy+1, 55);
  floats.push({ x:c.x, y:c.y, t:`+${take} · +${g} XP`, life:1.1, c:C.green });
  addXP(g); renderRes(); save();
  return take;
}
function collectRent() {
  let t = 0;
  PIDS.forEach(id => { const D = defOf(id), st = S.plot[id];
    if (!D || !st.done || !D.rent) return;
    const a = Math.floor(st.rent); if (a < 1) return; st.rent -= a; t += a; });
  if (t > 0) { S.money += t; bump('earnedRent', t); renderTop(); save(); }
  return t;
}
const rentReady = () => { let t=0; PIDS.forEach(id => { const D=defOf(id), st=S.plot[id];
  if (D && st.done && D.rent) t += Math.floor(st.rent); }); return t; };

/* ─── stavba ─── */
function startPhase(id) {
  const st = S.plot[id];
  if (st.bEnd || st.done) return;
  if (isPumpSt(id)) {
    const mw = pstOf(id,'mw'), nd = pstNeed(id), du = pstOf(id,'dur');
    if (powerFree() < mw) { toast(`Chybí ${mw-powerFree()} MW`); return; }
    if (!has(nd)) { toast('Chybí: '+missTxt(nd)); return; }
    pay(nd); st.bEnd = Date.now()+du; st.bDur = du;
    renderRes(); renderDetail(); save(); return;
  }
  const sp = specialDef(id), D = sp || defOf(id);
  if (!D) return;
  const mtn = PARC[id].plat >= MTN_FIRST;
  if (mtn) {
    if (D.mdraw && st.phase === 0 && mPowerFree() < D.mdraw[0]) {
      toast(`V horách chybí ${D.mdraw[0]-mPowerFree()} MW — postav elektrárnu na potoce`); return; }
  } else if (powerFree() < 0) { toast(`Síť je přetížená o ${-powerFree()} MW — něco odpoj`); return; }
  if (!mtn && waterFree() < 0) { toast(`Vody chybí ${-waterFree()} m³ — něco odpoj`); return; }
  if (!mtn && D.needPower && st.phase === 0 && powerFree() < D.draw[0]) {
    toast(`Chybí ${D.draw[0]-powerFree()} MW · volné jsou ${powerFree()} z ${powerMax()} MW`); return; }
  if (D.needWater && st.phase === 0 && waterFree() < D.wdraw[0]) {
    toast(`Chybí ${D.wdraw[0]-waterFree()} m³ vody — posil vodojem`); return; }
  if (isPump(id) && st.phase === 0 && powerFree() < PUMP.levels[0].mw) {
    toast(`Chybí ${PUMP.levels[0].mw-powerFree()} MW — vodojem jede na proud`); return; }
  if (sp && st.phase === 0 && S.money < sp.cost) { toast('Chybí '+fmt(sp.cost-S.money)); return; }
  const need = sp ? D.ph[st.phase].need : phaseNeed(id, st.phase);
  if (!has(need)) { toast('Chybí: '+missTxt(need)); return; }
  if (sp && st.phase === 0) S.money -= sp.cost;
  pay(need); st.bEnd = Date.now()+D.dur; st.bDur = D.dur;
  renderTop(); renderRes(); renderDetail(); save();
}
function finishPhase(id) {
  const st = S.plot[id];
  if (isPumpSt(id)) { st.bEnd = 0; st.done = true; st.phase = 1; addXP(pstOf(id,'xp'));
    showEvent({ kick:'Hotovo', tone:'ok', title:PARC[id].name, desc:'Přidala vodu do sítě.',
      lines:[['Voda',`+${pstOf(id,'water')} m³ · celkem ${waterMax()} m³`],
             ['Odběr proudu',`+${pstOf(id,'mw')} MW`]] });
    renderTop(); renderRes(); renderDetail(); save(); return; }
  const sp = specialDef(id), plant = isPlant(id), D = sp || defOf(id);
  if (!D || st.done) { st.bEnd = 0; return; }
  const p = D.ph[st.phase];
  st.bEnd = 0; st.phase++; addXP(p.xp);
  const c = iso(PARC[id].gx+1, PARC[id].gy+1, 55);
  floats.push({ x:c.x, y:c.y, t:`+${p.xp} XP`, life:1.3, c:C.amber });
  if (st.phase >= D.ph.length) {
    st.done = true; bump('built');
    /* když mezitím došel výkon nebo voda, stavba se dokončí, ale zůstane odpojená */
    if (!sp && D && (D.draw || D.wdraw)) {
      const need = D.draw ? D.draw[0] : 0, needW = D.wdraw ? D.wdraw[0] : 0;
      if (powerFree() < need || waterFree() < needW) {
        st.off = 1;
        showEvent({ kick:'Nedostatek', tone:'am', title:D.name+' stojí, ale nejede',
          desc:'Než jsi dostavěl, ubyl v síti výkon. Stavba je hotová, ale <b>odpojená</b>.',
          lines:[['Potřebuje', need?`${need} MW`+(needW?` a ${needW} m³`:''):`${needW} m³`],
                 ['Volné', `${powerFree()} MW · ${waterFree()} m³`],
                 ['Co s tím','Odpoj něco jiného, nebo posil elektrárnu a připoj ji zpět']] });
      }
    }
    if (isPump(id)) {
      showEvent({ once:'pump', kick:'Voda teče', tone:'sk', title:'Vodojem běží',
        desc:`Dává ${waterMax()} m³ a bere ${PUMP.levels[0].mw} MW z elektrárny.`,
        lines:[['K čemu','Vylepšení vil, činžáků, obchoďáku a druhé chladicí věže'],
               ['Hotely','Lázeňská čtvrť se otevře na LVL 52 — hotel chce vodu hned'],
               ['Rozšíření','Vodojem LVL 2 a čerpací stanice přidají další m³']] });
    } else if (isPumpSt(id)) {
      showEvent({ kick:'Hotovo', tone:'ok', title:PARC[id].name, desc:'Přidala vodu do sítě.',
        lines:[['Voda',`+${pstOf(id,'water')} m³`],['Odběr proudu',`+${pstOf(id,'mw')} MW`]] });
    } else if (plant) {
      showEvent({ once:'plant', kick:'Síť je pod proudem', tone:'sk', title:'Elektrárna běží',
        desc:`Dává ${powerMax()} MW. Každá budova na proud si z toho ukrojí svůj díl.`,
        lines:[['Palivo',`1 uhlí za ${(burnRate()/1000)|0} s — bez uhlí síť zhasne`],
               ['Turbíny','Přidáním turbíny zvýšíš výkon, ale chce to chladicí věž'],
               ['Činžák','20 MW za kus, takže dva se do 50 MW vejdou']] });
    } else {
      if (D.money) S.money += D.money;
      if (D.store) { S.skladLvl = 1;
        showEvent({ once:'sklad', flash:'Sklad je hotový', kick:'Nová možnost', tone:'ok',
          title:'Sklad stojí', desc:'Od teď máš kam ukládat.',
          lines:[['Kapacita',`${SKLAD_UP[1].cap} ks od každé suroviny místo 20`],
                 ['Obchod','V záložce Obchod suroviny prodáš i dokoupíš'],
                 ['Stanice','Můžeš vylepšit všechny čtyři těžební stanice']] });
      } else {
        showEvent({ flash:D.name+' je hotový', kick:'Hotovo', tone:'ok', title:D.name+' stojí',
          desc:'Stavba je dokončená.',
          lines:[ D.money?['Odměna',fmt(D.money)]:null,
                  D.needPower?['Odběr',`${D.draw[0]} MW · volných zbývá ${powerFree()} MW`]:null,
                  D.rent?['Nájem',`${fmt(D.rent)}/min do stropu ${fmt(D.rentCap)}`]:null,
                  D.park?['Efekt',`Vilám na předměstí zvedne nájem o ${Math.round(D.boost[0]*100)} %`]:null
                ].filter(Boolean) });
      }
    }
    renderTop(); renderRes();
  } else toast(p.n+' hotová');
  renderRes(); renderDetail(); save();
}

function startHouseUp(id) {
  /* zvednutí hráze zatopí, co je pod novou hladinou — nájemníky je nutné vyplatit */
  {
    const D0 = defOf(id), st0 = S.plot[id];
    if (D0 && D0.flood && !st0.uEnd) {
      const nx = D0.flood[Math.min(st0.hl+1, D0.flood.length)-1];
      const list = willFlood(nx);
      if (list.length) {
        const bill = floodBill(list);
        if (S.money < bill) {
          toast(`Nejdřív vyplať ${list.length} staveb pod hladinou — chybí ${fmt(bill-S.money)}`);
          showEvent({ kick:'Zatopení', tone:'am', title:'Pod vodou skončí '+list.length+' staveb',
            desc:'Než hráz zvedneš, musíš majitele vyplatit. Teprve pak se údolí zatopí.',
            lines:list.slice(0,5).map(x=>[PARC[x].name, fmt(floodPayout(x))])
              .concat([['Celkem', fmt(bill)],['Máš', fmt(S.money)]]) });
          return;
        }
        S.money -= bill;
        list.forEach(x => { S.owned[x] = false; S.plot[x] = newPlot(); });
        toast(`Vyplaceno ${list.length} staveb za ${fmt(bill)}`);
        showEvent({ kick:'Vyplaceno', tone:'ok', title:'Údolí se vyklidilo',
          desc:`Majitelé dostali zaplaceno a stavby zmizely pod hladinou.`,
          lines:[['Staveb', String(list.length)],['Zaplaceno', fmt(bill)]] });
        renderTop(); renderRes();
      }
    }
  }
  const st = S.plot[id], up = nextHouseUp(id), D = defOf(id);
  if (!D || !up || st.uEnd) return;
  if (S.lvl < up.reqLvl) { toast('Potřebuješ LVL '+up.reqLvl); return; }
  const mtn = PARC[id].plat >= MTN_FIRST;
  if (mtn) {
    if (D.mdraw && st.phase === 0 && mPowerFree() < D.mdraw[0]) {
      toast(`V horách chybí ${D.mdraw[0]-mPowerFree()} MW — postav elektrárnu na potoce`); return; }
  } else if (powerFree() < 0) { toast(`Síť je přetížená o ${-powerFree()} MW — něco odpoj`); return; }
  if (D.draw && D.draw[st.hl]) { const extra = D.draw[st.hl]-D.draw[st.hl-1];
    if (powerFree() < extra) {
      toast(`Chybí ${extra-powerFree()} MW · volné jsou ${powerFree()} z ${powerMax()} MW`); return; } }
  if (D.wdraw && D.wdraw[st.hl]) { const wx = D.wdraw[st.hl]-D.wdraw[st.hl-1];
    if (wx > 0 && waterFree() < wx) {
      toast(`Chybí ${wx-waterFree()} m³ vody — ${pumpBuilt()?'posil vodojem':'postav vodojem'}`); return; } }
  if (S.money < up.cost) { toast('Chybí '+fmt(up.cost-S.money)); return; }
  if (!has(up.need)) { toast('Chybí: '+missTxt(up.need)); return; }
  S.money -= up.cost; pay(up.need); st.uEnd = Date.now()+up.dur; st.uDur = up.dur;
  renderTop(); renderRes(); renderDetail(); save();
}
function finishHouseUp(id) {
  const st = S.plot[id], D = defOf(id), up = D.up[st.hl-1];
  st.uEnd = 0; st.hl++; addXP(up.xp); bump('upgrades');
  const lines = D.city ? [['Bonus městu',`+${Math.round(D.city[Math.min(st.hl,D.city.length)-1]*100)} % nájmu`],
      ['Celkem',`+${Math.round(cityBoost()*100)} % v celém městě`]]
    : D.office ? [['Zakázky',`${orderSlots()} najednou`]]
    : D.park ? [['Efekt',`Nájem vilám +${Math.round(D.boost[Math.min(st.hl,D.boost.length)-1]*100)} %`]]
    : [['Nájem',`${fmt(houseRent(id))}/min`]];
  showEvent({ kick:'Vylepšeno', tone:'ok', title:`${D.name} LVL ${st.hl}`, desc:up.label, lines });
  renderDetail(); save();
}
function startIronUp() {
  const id = ironStoreId(), st = S.plot[id], nx = nextIronLvl();
  if (!st || !st.done || st.uEnd || !nx) return;
  if (S.lvl < nx.reqLvl) { toast('Potřebuješ LVL '+nx.reqLvl); return; }
  if (S.money < nx.cost) { toast('Chybí '+fmt(nx.cost-S.money)); return; }
  if (!has(nx.need)) { toast('Chybí: '+missTxt(nx.need)); return; }
  S.money -= nx.cost; pay(nx.need);
  st.uEnd = Date.now()+nx.dur; st.uDur = nx.dur; st.upKind = 'iron';
  renderTop(); renderRes(); renderDetail(); save();
}
function finishIronUp(id) {
  const st = S.plot[id], nx = nextIronLvl();
  st.uEnd = 0; st.upKind = null; S.iron.lvl++; addXP(nx.xp||0);
  showEvent({ kick:'Vylepšeno', tone:'ok', title:'Rudný sklad LVL '+S.iron.lvl,
    desc:'Hala se zvětšila.', lines:[['Kapacita',`${ironCap()} ks rudy, roxorů i traverz`]] });
  renderRes(); renderDetail(); save();
}

function startSkladUp() {
  const nx = SKLAD_UP[S.skladLvl+1];
  const id = PIDS.find(x => { const D = defOf(x); return D && D.store && S.plot[x].done; });
  if (!nx || !id) return;
  const st = S.plot[id];
  if (st.uEnd) return;
  if (S.lvl < nx.reqLvl) { toast('Potřebuješ LVL '+nx.reqLvl); return; }
  if (S.money < nx.cost) { toast('Chybí '+fmt(nx.cost-S.money)); return; }
  if (!has(nx.need)) { toast('Chybí: '+missTxt(nx.need)); return; }
  S.money -= nx.cost; pay(nx.need); st.uEnd = Date.now()+16000; st.uDur = 16000; st.upKind = 'sklad';
  renderTop(); renderRes(); renderDetail(); save();
}
function finishSkladUp(id) {
  const st = S.plot[id], nx = SKLAD_UP[S.skladLvl+1];
  st.uEnd = 0; st.upKind = null; S.skladLvl++; addXP(nx.xp||0);
  showEvent({ kick:'Vylepšeno', tone:'ok', title:'Sklad LVL '+S.skladLvl,
    desc:'Sklad se zvětšil i navenek.', lines:[['Kapacita',`${cap()} ks od každé suroviny`]] });
  renderRes(); renderDetail(); save();
}
/* elektrárna */
function startPlantUp(kind) {
  const st = S.plot.e1;
  if (!st || !st.done || st.uEnd) return;
  let u = null;
  if (kind === 'turb') { u = nextTurbine();
    if (!turbineAllowed()) { toast(`Nejdřív postav ${u?u.cool:''}. chladicí věž`); return; } }
  else if (kind === 'cool') u = nextCooling();
  else if (kind === 'nuke') { u = PLANT.nuclear;
    if (!nukeReady()) { toast('Nejdřív osaď všechny turbíny a postav 3 chladicí věže'); return; } }
  else if (kind === 'blok') { u = nextBlock();
    if (!blockAllowed()) { toast(`Nejdřív postav ${u?u.cool:''}. chladicí věž`); return; } }
  if (!u) return;
  if (S.lvl < u.reqLvl) { toast('Potřebuješ LVL '+u.reqLvl); return; }
  if ((u.water||0) > 0) {
    const had = kind==='cool' ? (PLANT.cooling[S.plant.cool-1].water||0)
              : kind==='blok' ? (PLANT.blocks[S.plant.blok-1].water||0) : 0;
    const extra = u.water - had;
    if (extra > 0 && waterFree() < extra) {
      toast(`Chybí ${extra-waterFree()} m³ vody — ${pumpBuilt()?'posil vodojem':'postav vodojem'}`); return; } }
  if (S.money < u.cost) { toast('Chybí '+fmt(u.cost-S.money)); return; }
  if (!has(u.need)) { toast('Chybí: '+missTxt(u.need)); return; }
  S.money -= u.cost; pay(u.need);
  st.uEnd = Date.now()+u.dur; st.uDur = u.dur; st.upKind = kind;
  renderTop(); renderRes(); renderDetail(); save();
}
function finishPlantUp() {
  const st = S.plot.e1, kind = st.upKind;
  st.uEnd = 0; st.upKind = null;
  if (kind === 'turb') { const u = nextTurbine(); S.plant.turb++; addXP(u.xp);
    showEvent({ kick:'Vylepšeno', tone:'sk', title:`Elektrárna ${powerMax()} MW`,
      desc:'Turbína je osazená.',
      lines:[['Výkon',`${powerMax()} MW · volných ${powerFree()} MW`],
             ['Palivo',`1 ${RL(fuelKey()).l.toLowerCase()} za ${(burnRate()/1000)|0} s`]] }); }
  else if (kind === 'cool') { const u = nextCooling(); S.plant.cool++; addXP(u.xp);
    showEvent({ kick:'Vylepšeno', tone:'sk', title:`Chladicí věž ${S.plant.cool}`,
      desc:'Stojí vedle areálu a odvádí teplo.',
      lines:[['Odemyká', isNuke()?`blok ${S.plant.blok+1} reaktoru`:`turbínu ${S.plant.turb+1}`]] }); }
  else if (kind === 'nuke') { S.plant.nuke = 1; S.plant.blok = 1; addXP(PLANT.nuclear.xp);
    showEvent({ once:'nuke', kick:'Přestavba hotová', tone:'sk', title:'Jaderná elektrárna',
      desc:'Kotelnu nahradil reaktor. Turbíny zůstaly — pohání je pára z reaktoru.',
      lines:[['Výkon',`${powerMax()} MW místo ${turbMw()} MW`],
             ['Palivo',`uran místo uhlí · 1 kus za ${(burnRate()/1000)|0} s`],
             ['Uhlí','pořád ho potřebuješ — v kombinátu se z něj uran vyrábí'],
             ['Bloky',`druhý od LVL ${PLANT.blocks[1].reqLvl}, třetí od LVL ${PLANT.blocks[2].reqLvl}`]] }); }
  else if (kind === 'blok') { const u = nextBlock(); S.plant.blok++; addXP(u.xp);
    showEvent({ kick:'Vylepšeno', tone:'sk', title:`Reaktor — blok ${S.plant.blok}`,
      desc:'Nový blok je v provozu.',
      lines:[['Výkon',`${powerMax()} MW · volných ${powerFree()} MW`],
             ['Palivo',`1 uran za ${(burnRate()/1000)|0} s`]] }); }
  renderTop(); renderRes(); renderDetail(); save();
}

/* vodojem */
function startPumpUp() {
  const st = S.plot.w1;
  if (!st || !st.done || st.uEnd) return;
  const u = nextPumpLvl(); if (!u) return;
  if (S.lvl < u.reqLvl) { toast('Potřebuješ LVL '+u.reqLvl); return; }
  const extraMw = u.mw - PUMP.levels[S.pump.lvl-1].mw;
  if (powerFree() < extraMw) { toast(`Chybí ${extraMw-powerFree()} MW — posil elektrárnu`); return; }
  if (S.money < u.cost) { toast('Chybí '+fmt(u.cost-S.money)); return; }
  if (!has(u.need)) { toast('Chybí: '+missTxt(u.need)); return; }
  S.money -= u.cost; pay(u.need);
  st.uEnd = Date.now()+u.dur; st.uDur = u.dur; st.upKind = 'pump';
  renderTop(); renderRes(); renderDetail(); save();
}
function finishPumpUp() {
  const st = S.plot.w1, u = nextPumpLvl();
  st.uEnd = 0; st.upKind = null; S.pump.lvl++; addXP(u.xp);
  showEvent({ kick:'Vylepšeno', tone:'sk', title:'Vodojem LVL '+S.pump.lvl,
    desc:'Nádrž se zvětšila.',
    lines:[['Voda',`${waterMax()} m³ · volných ${waterFree()} m³`],
           ['Odběr proudu',`${pumpPower()} MW`]] });
  renderTop(); renderRes(); renderDetail(); save();
}

/* stanice */
function startNodePhase(id) {
  const n = S.nodes[id], u = nextStUp(id);
  if (!u || n.uEnd) return;
  const cur = u.ph[n.ph];
  if (n.ph === 0 && S.money < u.cost) { toast('Chybí '+fmt(u.cost-S.money)); return; }
  if (n.ph === 0) { const extra = (u.mw||0) - nodeMw(id);
    if (extra > 0 && powerFree() < extra) {
      toast(`Chybí ${extra-powerFree()} MW — posil elektrárnu`); return; } }
  if (!has(cur.need)) { toast('Chybí: '+missTxt(cur.need)); return; }
  if (n.ph === 0) S.money -= u.cost;
  pay(cur.need); n.uEnd = Date.now()+u.dur; n.uDur = u.dur;
  renderTop(); renderRes(); upgradeSheet(id); save();
}
function finishNodePhase(id) {
  const n = S.nodes[id], u = nextStUp(id), cur = u.ph[n.ph];
  n.uEnd = 0; n.ph++; addXP(cur.xp);
  if (n.ph >= u.ph.length) {
    n.ph = 0; n.lvl++; addXP(u.done); cls();
    const newOut = u.makes.filter(m => !(m in n.make));
    newOut.forEach(m => { n.make[m] = 0; n.mEnd[m] = 0; });
    if (newOut.length) {
      showEvent({ kick:'Nová výroba', tone:'sk', title:u.name,
        desc:`Stanice teď kromě těžby vyrábí ${newOut.map(m=>RL(m).l.toLowerCase()).join(' a ')}.`,
        lines:[['Fronta',`až ${u.queue} kusů najednou`],
               ['Rychlost',`1 kus za ${(makeDur(id)/1000).toFixed(1)} s`],
               ['Kde','Záložka Výroba dole v menu — jde zapnout automat']] });
    } else {
      showEvent({ kick:'Vylepšeno', tone:'ok', title:u.name, desc:'Stanice je na vyšší úrovni.',
        lines:[['Kapacita',`${u.cap} ks`],['Rychlost',`${(nodeTick(id)/1000).toFixed(2)} s na kus`]] });
    }
  } else { toast(cur.n+' hotová · těžba zrychlena'); upgradeSheet(id); }
  renderTop(); renderRes(); save();
}
function toggleGrid(id) {
  if (!canUnplug(id)) return;
  const st = S.plot[id], D = defOf(id);
  if (st.off) {
    const need = D.draw[Math.min(st.hl,D.draw.length)-1];
    if (powerFree() < need) {
      toast(`Chybí ${need-powerFree()} MW · volné jsou ${powerFree()} z ${powerMax()} MW`); return; }
    const w = D.wdraw ? D.wdraw[Math.min(st.hl,D.wdraw.length)-1] : 0;
    if (w > 0 && waterFree() < w) { toast(`Chybí ${w-waterFree()} m³ vody`); return; }
    st.off = 0; toast(D.name+' je zpátky v síti');
  } else { st.off = 1; st.rent = 0; toast(D.name+' odpojen — nevydělává, ale uvolnil výkon'); }
  renderTop(); renderRes(); renderDetail(); save();
}

/* události na mapě */
function triggerEvent() {
  const e = newEvent();
  scheduleEvent();
  if (!e) return;
  save();
  if (e.t === 'fest') {
    toast('Festival v lunaparku — dvojnásobný nájem');
    showEvent({ kick:'Festival', tone:'ok', title:'Festival v lunaparku',
      desc:'Do města se sjeli návštěvníci. Atrakce vydělávají <b>dvojnásobek</b>.',
      lines:[['Jak dlouho',`${(FEST_LIFE/60000)|0} minut`],
             ['Nezapomeň','vybrat nájem dřív, než dojde strop']] });
  } else {
    const ev = S.evs[S.evs.length-1];
    const pl = PLATFORMS.find(p => ev.gx>=p.ox && ev.gx<p.ox+PSZ && ev.gy>=p.oy && ev.gy<p.oy+PSZ);
    toast('Ztracený náklad — ' + (pl?pl.name.toLowerCase():'na mapě'));
    showEvent({ kick:'Nález', tone:'ok', title:'Ztracený náklad',
      desc:'Někdo tu nechal bednu. Ťukni na ni a je tvoje.',
      lines:[['Kde', pl ? pl.name : 'na mapě'],
             ['Do kdy', `${(CARGO_LIFE/60000).toFixed(1)} minuty, pak si ji odvezou`]],
      ok:'Ukázat na mapě',
      go:()=>{ closeParcel(); cls();
        ZU = Math.max(ZU, 1.6);
        const s2 = Z();
        panX = -((ev.gx+.5)-(ev.gy+.5))*(TW/2)*s2;
        panY = -((ev.gx+.5)+(ev.gy+.5))*(TH/2)*s2 + (H*.4-cy0);
        clampPan(); } });
  }
}
function grabEvent(i) {
  const e = S.evs[i];
  if (!e || e.t !== 'cargo') return;
  bump('cargo');
  if (e.money) { S.money += e.money; toast('Ztracený náklad · +'+fmt(e.money)); }
  else { const room = capOf(e.res) - S.res[e.res], q = Math.min(e.q, room);
    if (q < 1) { toast(`Bedna počká — ${RL(e.res).l.toLowerCase()} máš plné`); return; }
    S.res[e.res] += q;
    toast(q < e.q
      ? `Ztracený náklad · +${q}× ${RL(e.res).l.toLowerCase()} (zbytek se nevešel)`
      : `Ztracený náklad · +${q}× ${RL(e.res).l.toLowerCase()}`); }
  addXP(20 + S.lvl * 4);
  S.evs.splice(i,1);
  renderTop(); renderRes(); save();
}

/* přístav */
function startVoyage(kind, tier) {
  if (voyage(kind)) { toast('Loď je na moři'); return; }
  if (!portBuilt(kind)) return;
  const o = kind === 'cargo' ? cargoOffer(tier, Date.now()) : cruiseOffer(tier);
  if (!o) { toast('Zatím nemáš co naložit'); return; }
  if (o.need && !has(o.need)) { toast('Chybí: '+missTxt(o.need)); return; }
  if (o.need) pay(o.need);
  S.ships[kind] = Object.assign({}, o, { end: Date.now()+o.dur });
  toast((kind==='cargo'?'Nákladní':'Výletní') + ' loď vyplula');
  showEvent({ kick:'Loď vyplula', tone:'sk',
    title: (kind==='cargo'?'Nákladní':'Výletní') + ' loď — ' + o.n,
    desc:'Vrátí se za ' + Math.round(o.dur/60000) + ' minut. Plaví se, i když hru zavřeš.',
    lines:[['Odměna',fmt(o.pay)],['Zkušenosti',fmtN(o.xp)+' XP'],
           o.need?['Naloženo',Object.entries(o.need).map(([k,q])=>`${q}× ${RL(k).l.toLowerCase()}`).join(' · ')]:null
          ].filter(Boolean) });
  renderRes(); save();
}
function claimVoyage(kind) {
  const v = voyage(kind);
  if (!v || Date.now() < v.end) return;
  S.money += v.pay; addXP(v.xp); S.seen.voy = 1;
  bump('voyages'); bump('earnedShips', v.pay);
  delete S.ships[kind];
  toast('Loď připlula · +'+fmt(v.pay));
  showEvent({ kick:'Loď je zpátky', tone:'ok',
    title:(kind==='cargo'?'Nákladní':'Výletní')+' loď připlula', desc:v.n,
    lines:[['Výdělek',fmt(v.pay)],['Zkušenosti',fmtN(v.xp)+' XP']] });
  renderTop(); save();
}

/* vývoz do města */
function startExport(tier) {
  if (exportRun()) { toast('Souprava je na cestě'); return; }
  const o = exportOffer(tier, Date.now());
  if (!o) { toast('Nemáš co vyvézt'); return; }
  if (!has(o.need)) { toast('Chybí: '+missTxt(o.need)); return; }
  pay(o.need);
  S.exp = Object.assign({}, o, { end: Date.now()+o.dur });
  toast('Vlak s nákladem odjel do města');
  showEvent({ kick:'Vývoz', tone:'sk', title:'Souprava odjela — '+o.n,
    desc:'Město za horský kámen platí prémii. Vrátí se za '+Math.round(o.dur/60000)+' minut.',
    lines:[['Odměna',fmt(o.pay)],['Zkušenosti',fmtN(o.xp)+' XP'],
           ['Naloženo',Object.entries(o.need).map(([k,q])=>`${q}× ${RL(k).l.toLowerCase()}`).join(' · ')]] });
  renderRes(); save();
}
function claimExport() {
  const e = exportRun();
  if (!e || Date.now() < e.end) return;
  S.money += e.pay; addXP(e.xp); bump('earnedShips', e.pay); bump('voyages');
  S.exp = {};
  toast('Vlak se vrátil · +'+fmt(e.pay));
  showEvent({ kick:'Zpátky', tone:'ok', title:'Souprava je zpět', desc:e.n,
    lines:[['Výdělek',fmt(e.pay)],['Zkušenosti',fmtN(e.xp)+' XP']] });
  renderTop(); save();
}
/* kamenické zakázky */
function mtnOrderRefresh(force) {
  if (!force && mtnOrder()) return;
  const o = mtnOrderMake(S.mseed = (S.mseed*16807) % 2147483647);
  S.morder = o || {};
  save();
}
function mtnOrderDeliver() {
  const o = mtnOrder(); if (!o) return;
  if ((S.res[o.k]||0) < o.q) { toast('Chybí '+(o.q-(S.res[o.k]||0))+'× '+RL(o.k).l.toLowerCase()); return; }
  S.res[o.k] -= o.q; S.money += o.pay; addXP(o.xp);
  bump('orders'); bump('earnedOrders', o.pay);
  toast('Hotovo · +'+fmt(o.pay));
  mtnOrderRefresh(true);
  renderTop(); renderRes(); save();
}

/* vlak z města */
function trainQueue(n) {
  const id = trainId(); if (!id || !S.plot[id].done) return;
  const room = trainCap() - S.train.q;
  const add = Math.min(n, room);
  if (add < 1) { toast('Souprava je plná'); return; }
  S.train.q += add;
  if (!S.train.end) S.train.end = Date.now() + TRAIN.dur;
  toast(`Naloženo ${add} · souprava veze ${S.train.q}`);
  save();
}
function trainArrive() {
  const id = trainId(); if (!id) return;
  const n = S.train.q; S.train.q = 0; S.train.end = 0;
  if (n > 0) { S.plot[id].mload = (S.plot[id].mload||0) + n;
    toast('Vlak přijel · ' + n + ' beden ke složení'); save(); }
  if (S.train.auto) trainQueue(trainCap());
}
function trainUnload() {
  const id = trainId(); if (!id) return;
  const load = S.plot[id].mload || 0;
  if (load < 1) return;
  /* rozdělí náklad mezi základní suroviny, kolik se vejde */
  const pool = [...RES, ...MAT, ...HIGH].map(r=>r.k);
  let left = load, got = 0;
  pool.forEach(k => { if (left < 1) return;
    const room = capOf(k) - S.res[k];
    const take = Math.min(room, Math.ceil(load / pool.length) + 4, left);
    if (take > 0) { S.res[k] += take; left -= take; got += take; } });
  S.plot[id].mload = left;
  toast(got ? `Složeno ${got} surovin` + (left?` · ${left} zbývá`:'') : 'Sklady jsou plné');
  renderRes(); renderDetail(); save();
}

/* počasí v horách */
function snowStart() {
  S.snow = Date.now() + SNOW_LEN * snowMul();
  S.nextSnow = Date.now() + SNOW_MIN + Math.random()*(SNOW_MAX-SNOW_MIN);
  save();
  toast('Sněhová bouře — horská těžba stojí');
  showEvent({ kick:'Sněhová bouře', tone:'sk', title:'V horách sněží',
    desc:'Lanovky stojí a v lomech se netěží, dokud bouře nepřejde.',
    lines:[['Trvá',`${(SNOW_LEN/60000)|0} minuty`],
           ['Můžeš','odklidit sníh dřív — ťukni na cedulku nad horami']] });
}
function snowClear() {
  if (!snowing()) return;
  S.snow = 0; toast('Sníh odklizen'); save();
}

/* poruchy */
function triggerFault() {
  const f = newFault();
  scheduleFault();
  if (!f) return;
  save();
  toast(f.title + ' — ' + f.name.toLowerCase());
  showEvent({ kick:'Závada', tone:'am', title:f.title,
    desc:`<b>${f.name}.</b> Stavba je mimo provoz, dokud ji neopravíš.`,
    lines:[['Oprava',fmt(f.cost)],['Kde','Ťukni na stavbu na mapě — má nad sebou vykřičník']],
    ok:'Rozumím' });
}
function faultPos(key) {
  const id = key.slice(2);
  if (key[0] === 'n') { const d = NODE_DEF[id]; return d ? [d.gx, d.gy] : null; }
  const p = PARC[id]; return p ? [p.gx, p.gy] : null;
}
function repair(key) {
  const f = S.faults[key];
  if (!f || f.fix) return;
  const c = repairCost(key);
  if (S.money < c) { toast('Chybí '+fmt(c-S.money)); return; }
  S.money -= c;
  f.fix = Date.now() + REPAIR_DRIVE;
  f.dur = REPAIR_DRIVE;
  const pos = faultPos(key);
  if (pos) spawnFire(pos[0], pos[1], REPAIR_DRIVE);
  toast('Hasiči vyjeli · zaplaceno '+fmt(c));
  renderTop(); renderRes(); renderDetail(); save();
}
function finishRepairs() {
  const now = Date.now();
  Object.keys(S.faults).forEach(k => { const f = S.faults[k];
    if (f.fix && now >= f.fix) { delete S.faults[k]; bump('repairs');
      toast('Opraveno — ' + f.n.toLowerCase());
      renderTop(); renderRes(); renderDetail(); save(); } });
}

/* zakázky */
function orderDone(a) {
  toast('Zakázka hotová — vyzvedni odměnu');
  showEvent({ kick:'Zakázka dokončena', tone:'ok', title:a.client,
    desc:`${a.name} zakázka je hotová. Odběratel čeká, až si přijdeš pro peníze.`,
    lines:[['Odměna',fmt(a.pay)],['Zkušenosti',fmtN(a.xp)+' XP'],
           ['Dodáno',Object.entries(a.need).map(([k,v])=>`${v}× ${RL(k).l.toLowerCase()}`).join(' · ')]],
    ok:'Vyzvednout odměnu', go:()=>claimAllDone() });
  save();
}
function claimAllDone() {
  const now = Date.now();
  let money = 0, xp = 0, n = 0;
  for (let i = S.active.length-1; i >= 0; i--) {
    const a = S.active[i];
    if (now < a.end) continue;
    money += a.pay; xp += a.xp; n++; bump('orders'); bump('earnedOrders', a.pay);
    S.active.splice(i,1);
  }
  if (!n) return;
  S.money += money; addXP(xp); S.seen.order1 = 1;
  toast(`Vyzvednuto ${fmt(money)}`);
  renderTop(); save();
}

function takeOrder(i) {
  const o = S.orders[i];
  if (!o) return;
  if (S.active.length >= orderSlots()) { toast('Víc zakázek najednou nezvládneš'); return; }
  if (!has(o.need)) { toast('Chybí: '+missTxt(o.need)); return; }
  pay(o.need);
  S.active.push(Object.assign({}, o, { end: Date.now()+o.dur }));
  S.orders.splice(i,1); refreshOrders(true);
  toast('Zakázka přijata — materiál odvezen'); renderRes(); save();
}
function claimOrder(i) {
  const a = S.active[i];
  if (!a || Date.now() < a.end) return;
  S.money += a.pay; addXP(a.xp); S.seen.order1 = 1;
  S.active.splice(i,1);
  toast(`Zakázka splněna · +${fmt(a.pay)}`);
  showEvent({ kick:'Zakázka splněna', tone:'ok', title:a.client,
    desc:'Odběratel zaplatil.', lines:[['Odměna',fmt(a.pay)],['Zkušenosti',fmtN(a.xp)+' XP']] });
  renderTop(); save();
}


/* výroba */
function enqueue(id, out, amt, quiet) {
  const n = S.nodes[id], qmax = nodeQueueMax(id);
  const used = Object.values(n.make).reduce((a,b)=>a+b,0);
  const room = qmax - used, rec = recipeOf(out), can = canMake(out);
  const q = Math.min(amt, room, can);
  if (q < 1) { if (!quiet) toast(room<1?'Fronta je plná':'Chybí '+recipeTxt(out)); return 0; }
  Object.entries(rec).forEach(([k,v]) => S.res[k] -= q*v);
  if (!(n.make[out]||0)) n.mEnd[out] = Date.now()+makeDur(id);
  n.make[out] = (n.make[out]||0) + q;
  renderRes(); save(); return q;
}

/* ═══════════ vstup ═══════════ */
const stage = $('stage');
const pts = new Map();
let pinchD=0, pinchZ=1, moved=0, downT=0, lastP=null, mowing=false;
const rel = e => { const r = cv.getBoundingClientRect(); return { x:e.clientX-r.left, y:e.clientY-r.top }; };
stage.addEventListener('pointerdown', e => {
  if (e.target.closest('#detail')||e.target.closest('.fab')||e.target.closest('#zoomwrap')) return;
  pts.set(e.pointerId, rel(e)); moved=0; downT=Date.now(); lastP=rel(e);
  mowing = (MODE.v==='detail' && MODE.id==='p1' && !S.mowDone);
  if (pts.size===2) { const a=[...pts.values()];
    pinchD = Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y); pinchZ = ZU; }
});
stage.addEventListener('pointermove', e => {
  if (!pts.has(e.pointerId)) return;
  const p = rel(e);
  if (pts.size===2) { pts.set(e.pointerId,p); const a=[...pts.values()];
    const d = Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);
    if (pinchD>4) setZoom(pinchZ*(d/pinchD),(a[0].x+a[1].x)/2,(a[0].y+a[1].y)/2);
    moved = 99; return; }
  const dx=p.x-lastP.x, dy=p.y-lastP.y; moved += Math.abs(dx)+Math.abs(dy);
  if (mowing) mow(p); else { panX+=dx; panY+=dy; clampPan(); }
  lastP=p; pts.set(e.pointerId,p);
});
function up(e) { if (!pts.has(e.pointerId)) return;
  const p = pts.get(e.pointerId); pts.delete(e.pointerId);
  if (pts.size===0 && moved<10 && Date.now()-downT<450 && !mowing) tap(p);
  mowing = false; }
stage.addEventListener('pointerup', up);
stage.addEventListener('pointercancel', up);
$('zin').onclick = () => setZoom(ZU*1.35, W/2, H/2);
$('zout').onclick = () => setZoom(ZU/1.35, W/2, H/2);
$('collectAll').onclick = () => {
  let got = 0, full = [];
  Object.keys(NODE_DEF).forEach(id => {
    const n = S.nodes[id]; if (n.buf < 1) return;
    const take = collect(id, true);
    if (take > 0) got += take; else full.push(RL(nodeDef(id).res).l.toLowerCase());
  });
  const r = collectRent();
  const bits = [];
  if (got) bits.push('sebráno ' + got + ' surovin');
  if (r > 0) bits.push('nájem ' + fmt(r));
  if (bits.length) toast(bits.join(' · '));
  if (full.length) toast('Sklad je plný — ' + [...new Set(full)].join(', '));
};
const hitBox = (gx,gy,span,p) => { const c = iso(gx+span/2,gy+span/2,0), s = Z();
  return Math.abs(p.x-c.x)/(span*TW*s*.5) + Math.abs(p.y-c.y)/(span*TH*s*.5) < 1.05; };
const nearPill = (b,p) => b && Math.abs(p.x-b.x) < b.w/2+6 && Math.abs(p.y-b.y) < b.h/2+8;
function tap(p) {
  if (MODE.v !== 'map') return;
  for (let i = 0; i < S.evs.length; i++) { const e = S.evs[i];
    if (e.t !== 'cargo') continue;
    if (hitBox(e.gx, e.gy, 1, p)) { grabEvent(i); return; } }
  for (const id in upHit) if (nearPill(upHit[id],p)) { upgradeSheet(id); return; }
  for (const i in platHit) if (nearPill(platHit[i],p)) { platformSheet(+i); return; }
  for (const id in NODE_DEF) {
    const d = nodeDef(id);
    if (d.plat && !platOpen(d.plat)) continue;
    if (hitBox(d.gx,d.gy,2,p)) {
      const n = S.nodes[id];
      if (isBroken('n:'+id)) { upgradeSheet(id); return; }
      if (n.uEnd) { upgradeSheet(id); return; }
      if (n.buf > 0) { collect(id); return; }
      if (noMine(id)) { upgradeSheet(id); return; }
      if (n.lvl < 1) { upgradeSheet(id); return; }
      n.on = !n.on; n.tAcc = 0;
      toast(n.on ? nodeName(id)+' těží' : 'Těžba zastavena'); save(); return;
    }
  }
  for (const id of PIDS) { if (!visible(id)) continue;
    if (hitBox(PARC[id].gx,PARC[id].gy,spanOf(id),p)) { openParcel(id); return; } }
}
function mow(p) {
  let h = 0;
  tufts.forEach(t => { if (!t.alive) return;
    const c = iso(t.x,t.y,EL);
    if (Math.hypot(c.x-p.x,(c.y-t.h*Z()/2)-p.y) < 30*Z()) { t.alive=false; h++; } });
  if (h) { renderDetail();
    if (!mowLeftN()) { S.mowDone = true; addXP(XPMOW);
      toast('+25 XP · parcela je vyčištěná'); renderDetail(); save(); } }
}

/* ═══════════ smyčka ═══════════ */
let burnAcc = 0, outageWarned = false;
setInterval(() => {
  const now = Date.now();
  Object.keys(NODE_DEF).forEach(id => {
    const n = S.nodes[id], d = nodeDef(id);
    if (n.on && !noMine(id) && nodePowered(id) && nodeOk(id)) { const tick = nodeTick(id); n.tAcc += 160;
      while (n.tAcc >= tick) { n.tAcc -= tick;
        if (n.buf < nodeCap(id)) n.buf++;
        if (n.buf >= nodeCap(id)) { n.on = false; n.auto = true;
          toast(nodeName(id)+' je plná — sesbírej suroviny'); break; } } }
    const dur = makeDur(id);
    if (nodePowered(id) && nodeOk(id)) nodeMakes(id).forEach(out => {
      if ((n.make[out]||0) > 0 && now >= (n.mEnd[out]||0)) {
        if (S.res[out] < capOf(out)) { S.res[out]++; n.make[out]--; bumpRes('made', out, 1); renderRes();
          if (n.make[out] > 0) n.mEnd[out] = now+dur; }
        else n.mEnd[out] = now+2000;
      }
    });
    nodeMakes(id).forEach(out => {
      if (!autoOn(id,out)) return;
      if ((n.make[out]||0) > 0) return;
      enqueue(id, out, 5, true);
    });
    if (n.uEnd && now >= n.uEnd) finishNodePhase(id);
  });

  const br = burnRate(), fk = fuelKey();
  if (br > 0) {
    burnAcc += 160;
    while (burnAcc >= br) { burnAcc -= br;
      if (S.res[fk] > 0) { S.res[fk]--; renderRes(); }
      else { if (!outageWarned) { outageWarned = true;
          toast(`Elektrárně došlo ${fk==='uran'?'palivo — vyrob uran':'uhlí'}`); } break; } }
    if (S.res[fk] > 0) outageWarned = false;
  }
  const live = gridLive();

  PIDS.forEach(id => {
    const st = S.plot[id], D = defOf(id);
    if (st.bEnd && now >= st.bEnd) finishPhase(id);
    else if (st.uEnd && now >= st.uEnd) {
      if (isIronStore(id)) finishIronUp(id);
      else if (isPump(id)) finishPumpUp();
      else if (isPlant(id)) finishPlantUp();
      else if (D && D.store) finishSkladUp(id);
      else finishHouseUp(id);
    }
    if (D && st.done && D.rent) {
      if (!plotOk(id)) return;
      if (D.needPower && !live) return;
      st.rent = Math.min(houseRentCap(id), st.rent + houseRent(id)*(160/60000));
    }
  });

  const anyBuf = Object.keys(NODE_DEF).some(id => S.nodes[id].buf > 0);
  const rr = rentReady();
  const ca = $('collectAll');
  ca.classList.toggle('on', (anyBuf||rr>0) && MODE.v === 'map');
  if (anyBuf||rr>0) ca.textContent = (rr>0 && !anyBuf) ? `VYBRAT NÁJEM ${fmtN(rr)} ${CUR}` : 'SEBRAT VŠE';
  $('hintbar').style.visibility = ((anyBuf||rr>0) && MODE.v==='map') ? 'hidden' : 'visible';
  back.textContent = deferred.length ? `← MAPA (${deferred.length})` : '← MAPA';
  document.querySelector('[data-s="vyroba"]').classList.toggle('dot',
    Object.keys(NODE_DEF).some(id => nodeMakes(id).some(o =>
      (S.nodes[id].make[o]||0) === 0 && !autoOn(id,o))));

  const exf = $('exfill'), exr = exportRun();
  if (exf && exr) exf.style.width = Math.max(0,Math.min(100,(1-(exr.end-now)/exr.dur)*100))+'%';
  document.querySelectorAll('.exbar').forEach(el => { const e = exportRun(); if (!e) return;
    el.style.width = Math.max(0,Math.min(100,(1-(e.end-now)/e.dur)*100))+'%'; });
  document.querySelectorAll('.vfill').forEach(el => {
    const v = voyage(el.dataset.k); if (!v) return;
    el.style.width = Math.max(0,Math.min(100,(1-(v.end-now)/v.dur)*100))+'%'; });
  const vf = $('voyfill');
  if (vf && MODE.v === 'detail' && isPort(MODE.id)) {
    const v = voyage(PARC[MODE.id].port);
    if (v) { vf.style.width = Math.max(0,Math.min(100,(1-(v.end-now)/v.dur)*100))+'%';
      if (now >= v.end) renderDetail(); }
  }
  const ff = $('fixfill');
  if (ff) { const k = Object.keys(S.faults).find(x=>S.faults[x].fix);
    if (k) { const f = S.faults[k];
      ff.style.width = Math.max(0,Math.min(100,(1-(f.fix-now)/(f.dur||REPAIR_DRIVE))*100))+'%'; } }
  const bf = $('bfill');
  if (bf && MODE.v === 'detail') {
    const st = S.plot[MODE.id];
    const e = st.bEnd || st.uEnd, dur = st.bEnd ? st.bDur : st.uDur;
    if (e && dur) bf.style.width = Math.max(0,Math.min(100,(1-(e-now)/dur)*100))+'%';
    else renderDetail();
  }
  const nf = $('nfill');
  if (nf) { const on = Object.keys(NODE_DEF).find(i=>S.nodes[i].uEnd);
    if (on) { const n = S.nodes[on];
      nf.style.width = Math.max(0,Math.min(100,(1-(n.uEnd-now)/(n.uDur||1))*100))+'%'; } }
  S.active.forEach((a,i) => {
    if (now >= a.end && !a.rung) { a.rung = 1; orderDone(a, i); }
  });
  document.querySelectorAll('.ofill').forEach(el => {
    const end = +el.dataset.end, dur = +el.dataset.dur;
    el.style.width = Math.max(0,Math.min(100,(1-(end-now)/dur)*100))+'%'; });
  const zb = document.querySelector('[data-s="zakazky"]');
  if (zb) zb.classList.toggle('dot', hasOffice() &&
    (S.active.some(a=>now>=a.end) || (S.active.length<orderSlots() && S.orders.some(o=>has(o.need)))));
  finishRepairs();
  if (S.train.end && now >= S.train.end) trainArrive();
  if (mtnOpen() && !mtnOrder()) mtnOrderRefresh();
  if (mtnOpen()) {
    if (!S.nextSnow) S.nextSnow = now + SNOW_MIN + Math.random()*(SNOW_MAX-SNOW_MIN);
    else if (!snowing() && now >= S.nextSnow) snowStart();
  }
  /* automatika — dispečink, správa, údržba */
  const am = autoMineMs();
  if (am && now - (S.autoT.mine||0) >= am) { S.autoT.mine = now;
    let got = 0;
    Object.keys(NODE_DEF).forEach(id => { if (S.nodes[id].buf > 0) got += collect(id, true) || 0; });
    if (got) toast('Dispečink svezl ' + got + ' surovin');
  }
  /* správcovská firma vyzvedne i hotové zakázky */
  if (autoRentMs() && S.active.some(a => now >= a.end)) claimAllDone();
  const ar = autoRentMs();
  if (ar && now - (S.autoT.rent||0) >= ar) { S.autoT.rent = now;
    const r = collectRent();
    if (r > 0) toast('Správa vybrala nájem ' + fmt(r));
  }
  const af = autoFixMul();
  if (af) Object.keys(S.faults).forEach(k => { const f = S.faults[k];
    if (f.fix) return;
    const c = Math.round(repairCost(k) * af);
    if (S.money < c) return;
    S.money -= c; f.fix = now + REPAIR_DRIVE; f.dur = REPAIR_DRIVE;
    const pos = faultPos(k); if (pos) spawnFire(pos[0], pos[1], REPAIR_DRIVE);
    toast('Údržba vyjela · ' + fmt(c)); renderTop();
  });
  /* události na mapě */
  pruneEvents();
  if (S.lvl >= EV_FROM_LVL) {
    if (!S.nextEv) scheduleEvent();
    else if (now >= S.nextEv) triggerEvent();
  }
  /* náhodná porucha */
  if (S.lvl >= FAULT_FROM_LVL) {
    if (!S.nextFault) scheduleFault();
    else if (now >= S.nextFault) triggerFault();
  }
  const fb = document.querySelector('[data-s="stavby"]');
  if (fb) fb.classList.toggle('dot', faultCount() > 0);
  const rb = $('rent');
  if (rb && MODE.v === 'detail') { const st = S.plot[MODE.id];
    rb.textContent = 'Vybrat nájem '+fmt(st.rent); rb.disabled = st.rent < 1; }
  /* přebytečný výkon se prodává do sítě */
  const sr = surplusRate();
  if (sr > 0) { S.money += sr * (160/60000); bump('earnedMw', sr*(160/60000)); }
  bump('play', 160);
  saveSoon();
}, 160);

setInterval(renderQuest, 900);
setInterval(renderFest, 500);
setInterval(renderSeason, 500);
setInterval(renderWorld, 1000);
$('worldbtn').onclick = () => worldSheet();
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
addEventListener('pagehide', save);
addEventListener('blur', save);

/* ═══════════ úkoly ═══════════ */
/* Tabulka se prochází shora dolů, aktivní je první nesplněný krok.
   Když hráč něco udělá mimo pořadí, krok se sám přeskočí.            */
const Tg = (id, sp) => { const p = PARC[id]; return [p.gx, p.gy, sp || spanOf(id)]; };
const Tn = id => [NODE_DEF[id].gx, NODE_DEF[id].gy, 2];
const nodeAt = l => Object.keys(NODE_DEF).find(id =>
  ['saw','quarry','field','pit'].indexOf(nodeDef(id).kind) >= 0 && S.nodes[id].lvl === l);
const bDone = id => S.plot[id] && S.plot[id].done;
const bPh = id => { const D = defOf(id) || specialDef(id); return D ? `${S.plot[id].phase} / ${D.ph.length}` : ''; };
const money = () => shortN(S.money) + ' ' + CUR;

/* pomocné generátory kroků */
const qLevel = (lv, what) => ({ id:'lv'+lv, done:()=>S.lvl>=lv,
  t:'Dostaň se na LVL '+lv, d:what, p:()=>'LVL '+S.lvl, go:()=>scrRozvoj() });
const qBuy = (id, note) => ({ id:'buy'+id, done:()=>isOwned(id) || !visible(id),
  t:()=>`Kup ${PARC[id].name} — ${fmt(PARC[id].cost)}`, d:note,
  p:money, target:()=>Tg(id), go:()=>openParcel(id) });
const qBuild = (id, title, note) => ({ id:'b'+id, done:()=>bDone(id),
  t:title, d:note, p:()=>bPh(id), target:()=>Tg(id), go:()=>openParcel(id) });
const qNode = (nid, lvl, title, note) => ({ id:'n'+nid+lvl, done:()=>S.nodes[nid].lvl>=lvl,
  t:title, d:note, p:()=>`${S.nodes[nid].ph} / 3`, target:()=>Tn(nid),
  go:()=>upgradeSheet(nid) });
const qPlant = (key, val, title, note) => ({ id:'p'+key+val, done:()=>S.plant[key]>=val,
  t:title, d:note, p:()=>`${S.plant.turb} T / ${S.plant.cool} V`,
  target:()=>Tg('e1'), go:()=>openParcel('e1') });
const qPump = (lvl, title, note) => ({ id:'pump'+lvl, done:()=>S.pump.lvl>=lvl,
  t:title, d:note, p:()=>`${waterUse()} / ${waterMax()} m³`,
  target:()=>Tg('w1'), go:()=>openParcel('w1') });
const qPlat = i => ({ id:'plat'+i, done:()=>platOpen(i),
  t:'Dostaň se na LVL '+PLAT(i).reqLvl,
  d:'Zdarma se otevře '+PLAT(i).name.toLowerCase(),
  p:()=>'LVL '+S.lvl, go:()=>platformSheet(i) });

const QUESTS = [
  { id:'mow', done:()=>S.mowDone, t:'Poseč trávu na parcele 1',
    d:'Ťukni na parcelu a přejeď prstem', p:()=>`${40-mowLeftN()} / 40`,
    target:()=>Tg('p1'), go:()=>openParcel('p1') },
  { id:'pick1', done:()=>!!defOf('p1'), t:'Vyber si první chatku',
    d:'Tři provedení, každé chce jiný materiál', p:()=>'',
    target:()=>Tg('p1'), go:()=>openParcel('p1') },
  { id:'mine', done:()=>Object.keys(NODE_DEF).some(i=>S.nodes[i].on) || bDone('p1'),
    t:'Spusť těžbu na stanicích', d:'Ťukni na les, lom, louku i hliniště v rozích pozemku',
    p:()=>'', go:()=>scrStavby() },
  qBuild('p1','Postav chatku','Suroviny sesbíráš ťuknutím na stanici'),
  qBuy('p2','Místo na sklad'),
  qLevel(5,'Sklad se odemkne na LVL 5'),
  qBuild('p2','Postav sklad','Kapacita 20 → 60 ks a otevře se obchod'),
  qLevel(6,'Odemkne stavební dvůr a s ním zakázky'),
  qBuy('p3','Místo na stavební dvůr'),
  qBuild('p3','Postav stavební dvůr','Odemkne zakázky — hlavní zdroj peněz'),
  { id:'ord1', done:()=>!!S.seen.order1, t:'Vyřiď první zakázku',
    d:'Odevzdej materiál a počkej na peníze', p:()=>'',
    target:()=>Tg('p3'), go:()=>scrZakazky() },
  { id:'st1', done:()=>nUp(1)>=4, t:'Vylepši všechny čtyři stanice',
    d:'Kapacita 10 → 30 a rychlejší těžba', p:()=>`${nUp(1)} / 4`,
    target:()=>{const n=nodeAt(0);return n?Tn(n):null;},
    go:()=>{const n=nodeAt(0);n?upgradeSheet(n):scrRozvoj();} },
  qLevel(15,'Odemkne rodinný dům a výrobu materiálu'),
  { id:'st2', done:()=>nUp(2)>=4, t:'Vylepši stanice na LVL 2',
    d:'Teprve pak vyrobí prkna, štěrk, cihly a balíky', p:()=>`${nUp(2)} / 4`,
    target:()=>{const n=nodeAt(1);return n?Tn(n):null;},
    go:()=>{const n=nodeAt(1);n?upgradeSheet(n):scrVyroba();} },
  qBuy('p4','Místo na rodinný dům'),
  qBuild('p4','Postav rodinný dům','Šest fází ze základních surovin'),
  qPlat(1),
  qNode('uhli',1,'Otevři uhelný důl','Bez uhlí elektrárna nevyrábí proud'),
  qBuild('e1','Postav elektrárnu','Šest fází · dá 50 MW do sítě'),
  qPlat(2),
  qBuy('s1','Místo na první činžák'),
  qBuild('s1','Postav činžák','Odběr 20 MW · nájem '+fmt(BUILDINGS.cinzak.rent)+'/min'),
  qPlant('turb',2,'Přidej druhou turbínu','Elektrárna 50 → 110 MW'),
  qPlat(3),
  qBuy('v1','Místo na první vilu'),
  qBuild('v1','Postav vilu','Chce trámy, obklady, izolaci i dlažbu'),
  qBuild('k1','Postav park','Zvedne nájem všem vilám na předměstí'),
  qPlant('cool',2,'Postav druhou chladicí věž','Bez ní neutáhneš třetí turbínu'),
  qPlant('turb',3,'Přidej třetí turbínu','Elektrárna 110 → 190 MW'),
  qPlat(4),
  qBuy('sk1','Malý stánek, rychlá návratnost'),
  qBuild('sk1','Postav stánek','Levná stavba s dobrým poměrem'),
  qBuy('o1','Místo na obchodní centrum'),
  qBuild('o1','Postav obchodní centrum','Velká stavba · odběr 160 MW'),
  qPlant('cool',3,'Postav třetí chladicí věž','Podmínka pro přestavbu na jádro'),
  qPlant('turb',4,'Přidej čtvrtou turbínu','Elektrárna 190 → 300 MW, strop uhlí'),
  qNode('uhli',4,'Rozšiř důl na těžební kombinát','Z uhlí začne vyrábět uran'),
  qPlat(5),
  qBuild('w1','Postav vodojem','Voda je potřeba na vylepšení staveb i chlazení'),
  { id:'nuke', done:()=>isNuke(), t:'Přestav elektrárnu na jádro',
    d:'+400 MW · palivem bude uran', p:()=>`${S.plant.turb} T / ${S.plant.cool} V`,
    target:()=>Tg('e1'), go:()=>openParcel('e1') },
  qPlat(7),
  qBuild('f2','Postav rudný sklad','Ruda se do běžného skladu nevejde'),
  qNode('ruda',1,'Otevři železný důl','Ruda je základ pro roxory i traverzy'),
  qNode('hut',1,'Postav hutní závod','Z rudy vyrobí roxory'),
  qPlant('cool',4,'Postav čtvrtou chladicí věž','Podmínka pro druhý blok reaktoru'),
  qPlant('blok',2,'Postav druhý blok reaktoru','Výkon 400 → 850 MW · 80 m³ vody'),
  qPlat(6),
  qBuy('h1','Místo na první hotel'),
  qBuild('h1','Postav hotel','Vysoký nájem · chce proud i vodu'),
  qNode('uhli',5,'Rozšiř důl na uranový kombinát','Nejrychlejší výroba uranu'),
  { id:'pumpst', done:()=>bDone('w2'), t:'Postav čerpací stanici',
    d:'Přidá 220 m³ vody do sítě', p:()=>`${waterUse()} / ${waterMax()} m³`,
    target:()=>Tg('w2'), go:()=>openParcel('w2') },
  qPlant('cool',5,'Postav pátou chladicí věž','Podmínka pro třetí blok reaktoru'),
  qPlant('blok',3,'Postav třetí blok reaktoru','Výkon 850 → 1600 MW'),
  qPump(3,'Zvětši vodojem na LVL 3','Kapacita 320 → 600 m³'),
  { id:'iron2', done:()=>S.iron.lvl>=2, t:'Rozšiř rudný sklad',
    d:'Kapacita 60 → 140 ks', p:()=>`${ironCap()} ks`,
    target:()=>Tg('f2'), go:()=>openParcel('f2') },
  qNode('hut',2,'Rozšiř huť na ocelárnu','Přidá výrobu traverz'),
  qPlat(8),
  { id:'w6', done:()=>bDone('w6') || S.lvl<60, t:'Postav úpravnu vody',
    d:'Velký zdroj · přidá 520 m³ do sítě', p:()=>`${waterUse()} / ${waterMax()} m³`,
    target:()=>Tg('w6'), go:()=>openParcel('w6') },
  qBuy('f3','Místo na expediční halu'),
  qBuild('f3','Postav expediční halu','Odbyt oceli přímo v areálu'),
  qBuy('l1','Místo na první atrakci'),
  qBuild('l1','Postav kolotoč','První atrakce · nájem '+fmt(BUILDINGS.kolotoc.rent)+'/min'),
  qBuy('l5','Stánky u vstupu do lunaparku'),
  qBuild('l5','Postav stánek u vstupu','Levná stavba, rychle se vrátí'),
  qBuy('l2','Místo na druhý kolotoč'),
  qBuild('l2','Postav druhý kolotoč','Jiné provedení než ten první'),
  qBuy('l3','Místo na horskou dráhu'),
  qBuild('l3','Postav horskou dráhu','Velká atrakce · odběr 180 MW'),
  qBuy('l6','Parkoviště u lunaparku'),
  qBuild('l6','Postav parkoviště','Návštěvníci se musí kam vejít'),
  qBuy('l4','Místo na aquapark'),
  qBuild('l4','Postav aquapark','Spolyká 260 m³ vody'),
  { id:'lupg', done:()=>S.plot.l1.hl>=2 || S.plot.l3.hl>=2,
    t:'Vylepši některou atrakci', d:'Vyšší úroveň znamená výrazně vyšší nájem',
    p:()=>`${['l1','l2','l3','l4'].filter(i=>S.plot[i].hl>=2).length} / 4`,
    target:()=>Tg('l1'), go:()=>openParcel('l1') },
  qPlant('cool',6,'Postav šestou chladicí věž','Podmínka pro čtvrtý blok'),
  qPlant('blok',4,'Postav čtvrtý blok reaktoru','Výkon 1600 → 2800 MW'),
  qPlat(11),
  qBuy('c1','Místo na radnici'),
  qBuild('c1','Postav radnici','+7 % nájmu všem stavbám ve městě'),
  qBuy('c2','Místo na kostel'),
  qBuild('c2','Postav kostel','+5 % nájmu všem stavbám'),
  qBuy('c4','Místo na měšťanský dům'),
  qBuild('c4','Postav měšťanský dům','+4 % nájmu všem stavbám ve městě'),
  qBuy('c3','Místo na muzeum'),
  qBuild('c3','Postav muzeum','+8 % nájmu všem stavbám'),
  qPlat(10),
  qBuy('d2','Místo na první větrník'),
  qBuild('d2','Postav větrnou elektrárnu','120 MW bez paliva'),
  qBuy('d1','Místo na hráz'),
  qBuild('d1','Postav vodní elektrárnu','600 MW z řeky · šest fází'),
  qPlat(9),
  qBuy('m1','Místo pod první mrakodrap'),
  qBuild('m1','Postav mrakodrap','Dvacet fází · stovky traverz'),
  qPump(4,'Zvětši vodojem na LVL 4','Kapacita 600 → 1200 m³'),
  { id:'iron3', done:()=>S.iron.lvl>=3, t:'Rozšiř rudný sklad na LVL 3',
    d:'Kapacita 140 → 280 ks', p:()=>`${ironCap()} ks`,
    target:()=>Tg('f2'), go:()=>openParcel('f2') },
  qNode('ruda',3,'Rozšiř důl na rudný kombinát','Nejvyšší těžba rudy'),
  qNode('hut',3,'Rozšiř huť na hutní kombinát','Největší fronta výroby oceli'),
  qPlant('cool',7,'Postav sedmou chladicí věž','Podmínka pro pátý blok'),
  qBuy('m2','Místo pod druhý mrakodrap'),
  qBuild('m2','Postav druhý mrakodrap','Ještě dražší než první'),
  qPlant('blok',5,'Postav pátý blok reaktoru','Výkon 2800 → 4600 MW'),
  qPump(5,'Zvětši vodojem na LVL 5','Kapacita 1200 → 2400 m³'),
  { id:'sklad6', done:()=>S.skladLvl>=6, t:'Rozšiř sklad na LVL 6',
    d:'Kapacita 420 → 640 ks · na mrakodrapy to jinak nestačí', p:()=>`${cap()} ks`,
    target:()=>{const id=PIDS.find(x=>{const D=defOf(x);return D&&D.store;});return id?Tg(id):null;},
    go:()=>{const id=PIDS.find(x=>{const D=defOf(x);return D&&D.store;}); if(id) openParcel(id);} },
  { id:'iron4', done:()=>S.iron.lvl>=4, t:'Rozšiř rudný sklad na LVL 4',
    d:'Kapacita 280 → 520 ks traverz', p:()=>`${ironCap()} ks`,
    target:()=>Tg('f2'), go:()=>openParcel('f2') },
  { id:'sklad7', done:()=>S.skladLvl>=7, t:'Rozšiř sklad na LVL 7',
    d:'Kapacita 640 → 950 ks', p:()=>`${cap()} ks`,
    target:()=>{const id=PIDS.find(x=>{const D=defOf(x);return D&&D.store;});return id?Tg(id):null;},
    go:()=>{const id=PIDS.find(x=>{const D=defOf(x);return D&&D.store;}); if(id) openParcel(id);} },
  { id:'iron5', done:()=>S.iron.lvl>=5, t:'Rozšiř rudný sklad na LVL 5',
    d:'Kapacita 520 → 820 ks · na druhý mrakodrap', p:()=>`${ironCap()} ks`,
    target:()=>Tg('f2'), go:()=>openParcel('f2') },
  qPlat(12),
  qBuild('hp1','Postav nákladní přístav','Velké zakázky pro nákladní loď'),
  { id:'voy1', done:()=>!!S.seen.voy, t:'Vyprav nákladní loď',
    d:'Naložíš materiál a loď se vrátí s penězi', p:()=>'',
    target:()=>Tg('hp1'), go:()=>scrZakazky() },
  qBuild('hp2','Postav cestovní kancelář','Výletní loď nepotřebuje materiál'),

  /* ─── závěr prvního města ─── */
  { id:'nadrazi', done:()=>!platOpen(13) || bDone('t1'),
    t:'Postav hlavní nádraží', d:'Nevydělá ani korunu — otevře cestu z města ven',
    p:()=>bPh('t1'), target:()=>Tg('t1'), go:()=>openParcel('t1') },
  { id:'svet', done:()=>!hasWorld() || !!S.seen.svet,
    t:'Objev novou lokaci', d:'Tlačítko SVĚT vlevo dole tě vezme za hřeben',
    p:()=>'', go:()=>{ S.seen.svet = 1; save(); worldSheet(); } },
  /* ─── horský kraj ─── */
  { id:'mtn0', done:()=>mtnOpen(), t:'Objev horský kraj',
    d:'Tlačítko SVĚT vlevo dole tě vezme za hřeben',
    p:()=>'', go:()=>{ syncPlatforms(); worldSheet(); } },
  qBuild('m1','Postav nádražní sklad','Sem bude vozit vlak z města'),
  { id:'train1', done:()=>!!S.seen.train || !trainBuilt(),
    t:'Přivez první náklad z města', d:'Nalož soupravu a za tři minuty ji tu složíš',
    p:()=>`${S.train.q} beden`, target:()=>Tg('m1'), go:()=>openParcel('m1') },
  qBuy('m2','Místo na horský sklad'),
  qBuild('m2','Postav horský sklad','Bez něj nemáš kam dávat žulu'),
  qPlat(23),
  qBuy('n1','Místo na jez'),
  qBuild('n1','Postav horskou elektrárnu','Hory mají vlastní síť — proud z města sem nedosáhne'),
  qPlat(21),
  qNode('zula',1,'Otevři žulový lom','První horská surovina'),
  qBuy('m4','Místo na lanovku'),
  qBuild('m4','Postav lanovku','V horách nahrazuje silnice'),
  qPlat(24),
  qBuy('n4','Místo na první chatu'),
  qBuild('n4','Postav horskou chatu','Konečně vlastní příjem v horách'),
  qPlat(22),
  qNode('bridl',1,'Otevři břidlicovou stěnu','Tabule na střechy chat'),
  qPlat(25),
  qNode('krem',1,'Otevři křemennou štolu','Sklo do oken'),
  { id:'konec', done:()=>false,
    t:'Rozvíjej hory i město',
    d:'Obě části běží zároveň — přepínej je tlačítkem vlevo dole',
    p:()=>'LVL '+S.lvl, go:()=>scrRozvoj() }
];

function quest() {
  for (const q of QUESTS) {
    let ok = false;
    try { ok = q.done(); } catch (e) { ok = true; }
    if (ok) continue;
    const val = v => typeof v === 'function' ? v() : v;
    return { id:q.id, t:val(q.t), d:val(q.d), p:val(q.p) || '',
             target: q.target ? val(q.target) : null, go: q.go || null };
  }
  return { id:'end', t:'Rozvíjej město', d:'Kupuj parcely, stavěj a vylepšuj',
           p:'LVL '+S.lvl, target:null, go:()=>scrRozvoj() };
}

/* ═══════════ start ═══════════ */
new ResizeObserver(resize).observe(stage);
const away = load();
syncLevel();
syncPlatforms();
WB = worldBounds();
resize(); renderRes(); renderTop(); renderQuest(); draw();
if (!S.nextFault) scheduleFault();

const rep = catchUp(away);
if (rep) {
  const mins = Math.round(rep.ms/60000), lines = [];
  Object.entries(rep.gained).forEach(([k,v]) => lines.push(['+'+v, RL(k).l+' na stanici']));
  Object.entries(rep.made).forEach(([k,v]) => lines.push(['+'+v, RL(k).l+' z výroby']));
  if (rep.burned) lines.push(['−'+rep.burned, (rep.fuel==='uran'?'uranu':'uhlí')+' spálila elektrárna']);
  if (rep.outage) lines.push(['Pozor','elektrárně došlo uhlí, budovy na proud stály']);
  if (rep.rent >= 1) lines.push([fmt(rep.rent),'nájem čeká na vybrání']);
  if (rep.orders) lines.push([rep.orders+'×','hotová zakázka čeká na vyzvednutí']);
  if (rep.faults && rep.faults.length) rep.faults.forEach(f =>
    lines.push(['Závada', `${f.title} — ${f.name.toLowerCase()} · oprava ${fmt(f.cost)}`]));
  if (lines.length) showEvent({ kick:'Než ses vrátil', tone:'ok',
    title: mins < 60 ? `${mins} minut práce` : `${(mins/60).toFixed(1)} hodiny práce`,
    desc:'Stanice, výrobny i nájem běžely dál.', lines, ok:'Sebrat' });
  renderRes(); renderTop();
} else if (!S.mowDone) {
  setTimeout(() => showEvent({ once:'intro', kick:'Jak se to hraje', tone:'am',
    title:'Vítej na svém pozemku', desc:'Všechno se točí kolem tří kroků.',
    lines:[['1','Ťukni na těžební stanici v rohu pozemku a spusť těžbu'],
           ['2','Až se nad ní objeví oranžové číslo, ťukni znovu a sesbíráš'],
           ['3','Ťukni na parcelu a postav z toho stavbu, fázi po fázi']],
    ok:'Rozumím' }), 700);
}
