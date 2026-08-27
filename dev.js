/* ═══════════ testovací stavy ═══════════
   Načte hru v pokročilé fázi, ať se nemusí hrát od nuly.
   Vypnutí: smaž řádek <script src="dev.js"> v index.html.          */
/* vyčistí všechno, ať po předchozí hře nezůstanou stavby navíc */
function wipeState() {
  S.lvl = 1; S.xp = 0; S.money = 0; S.mowDone = false; S.skladLvl = 0;
  ALL.forEach(r => S.res[r.k] = 0);
  S.first = {}; S.seen = {};
  S.plats = { 0:true }; S.owned = { p1:true };
  PIDS.forEach(id => S.plot[id] = newPlot());
  Object.keys(NODE_DEF).forEach(id => S.nodes[id] = newNode());
  S.plant = { turb:1, cool:1, nuke:0, blok:1 };
  S.pump = { lvl:1 }; S.iron = { lvl:0 };
  S.orders = []; S.active = []; S.oSeed = 0; S.oRefresh = 0;
  S.rrLeft = REROLL_MAX; S.rrAt = Date.now();
}

const SCENARIOS = {
  faze3: {
    name:'Fáze 3 — LVL 88, město před nádražím',
    desc:'Rozvinuté město, elektrárna na maximu, obě lodě. Nádraží zbývá dostavět.',
    apply(){
      wipeState();
      S.lvl = 88; S.xp = LVL[87] + 300000; S.money = 50000000; S.skladLvl = SKLAD_UP.length - 1;
      PLATFORMS.forEach(p => { if (p.id < MTN_FIRST) S.plats[p.id] = true; });

      /* stanice — čtyři základní na maximu, uhlí a železo o stupeň níž */
      Object.keys(NODE_DEF).forEach(id => { const n = S.nodes[id], d = nodeDef(id);
        if ((d.plat||0) >= MTN_FIRST) { n.lvl = 0; return; }
        const c = stChain(id);
        n.lvl = c.length;
        n.ph = 0; n.on = true; n.buf = 0; n.make = {}; n.autoOut = {};
        (c[n.lvl-1].makes||[]).forEach(m => { n.make[m] = 0; n.autoOut[m] = true; });
      });

      /* sítě */
      S.plant = { turb:4, cool:7, nuke:1, blok:5 };
      S.pump  = { lvl:5 };
      S.iron  = { lvl:IRON_STORE.levels.length };

      /* přirozený vývoj: většina hotová, něco o stupeň níž, pár parcel prázdných */
      const skip = { s6:1, v4:1, h4:1, sk4:1, c5:1, c7:1, w5:1, t2:1, t4:1, a4:1 };
      const lower = { h3:1, l4:1, m1:1, v3:1, s5:1, hp2:1, c3:1, r10:1 };
      let i = 0;
      PIDS.forEach(id => { const P = PARC[id];
        if (P.plat >= MTN_FIRST) return;
        if (skip[id]) return;                       // tyhle zůstanou nekoupené
        S.owned[id] = true;
        const st = S.plot[id];
        if (P.accept) { const key = P.accept[0], B = BUILDINGS[key];
          st.key = key; st.phase = B.ph.length; st.done = true;
          const maxHl = B.up ? B.up.length + 1 : 1;
          st.hl = lower[id] ? Math.max(1, maxHl-1) : (i++ % 5 === 0 ? Math.max(1, maxHl-1) : maxHl);
          st.vr = (i * 7) % B.vars.length;
        } else { const D = specialDef(id);
          if (D) { st.phase = D.ph.length; st.done = true; st.hl = 1; }
          else { st.phase = 1; st.done = true; }
        }
      });
      /* nádraží už stojí — hory jsou otevřené */
      S.owned.t1 = true;
      Object.assign(S.plot.t1, { key:'nadrazi', phase:BUILDINGS.nadrazi.ph.length, done:true, hl:1 });
      S.plats[MTN_FIRST] = true;   // v horách začínáš koncovou stanicí
      syncPlatforms();
      /* v horách se začíná od nuly */
      MTN.forEach(r => S.res[r.k] = 0);

      /* voda musí stačit — všechna čerpadla i úpravna postavené */
      PIDS.forEach(id => { if (isPumpSt(id)) { S.owned[id] = true;
        Object.assign(S.plot[id], { phase:1, done:true, off:0 }); } });
      /* obnovitelné zdroje na maximu — větrníky i vodní elektrárna */
      PIDS.forEach(id => { const P = PARC[id];
        if (P.plat >= MTN_FIRST || !P.accept) return;
        const B = BUILDINGS[P.accept[0]];
        if (!B || !B.gen) return;
        S.owned[id] = true;
        Object.assign(S.plot[id], { key:P.accept[0], phase:B.ph.length,
          done:true, off:0, hl:B.up ? B.up.length + 1 : 1 });
      });
      /* co se nevejde do sítě, zůstane odpojené */
      PIDS.forEach(id => { const D = defOf(id);
        if (!D || !S.plot[id].done) return;
        if (D.wdraw && waterFree() < 0) S.plot[id].off = 1; });
      PIDS.forEach(id => { const D = defOf(id);
        if (!D || !S.plot[id].done) return;
        if (D.draw && powerFree() < 0) S.plot[id].off = 1; });

      /* úkoly: vše hotové až po nádraží */
      S.mowDone = true;
      S.seen.order1 = 1; S.seen.voy = 1; S.seen.train = 1;
      tufts.forEach(t => t.alive = false);

      /* suroviny skoro plné, ať je z čeho stavět */
      ALL.forEach(r => { const c = capOf(r.k); if (c > 0) S.res[r.k] = Math.round(c * .8); });

      IRON.forEach(r => S.res[r.k] = Math.round(ironCap() * .8));

      refreshOrders(true);
    }
  },
  faze2: {
    name:'Fáze 2 — LVL 62, rozjeté město',
    desc:'Jaderná elektrárna, vodojem, železárny, lunapark. Vše na vyšších úrovních.',
    apply(){
      SCENARIOS.faze1.apply();
      S.lvl = 62; S.xp = LVL[61] + 5000; S.money = 2000000; S.skladLvl = 4;
      ALL.forEach(r => S.res[r.k] = Math.round(SKLAD_UP[S.skladLvl].cap * .7));
      [5,6,7,8].forEach(i => { S.plats[i] = true;
        PIDS.forEach(id => { if (PARC[id].plat === i && PARC[id].free) S.owned[id] = true; }); });
      S.plant = { turb:4, cool:5, nuke:1, blok:3 };
      Object.assign(S.plot.w1, { phase:PUMP.ph.length, done:true }); S.pump = { lvl:3 };
      S.owned.w2 = true; Object.assign(S.plot.w2, { phase:1, done:true });
      S.owned.f2 = false; Object.assign(S.plot.f2, { phase:0, done:false });
      S.iron = { lvl:0 };
      IRON.forEach(r => S.res[r.k] = 0);
      S.nodes.uhli.lvl = 5; S.nodes.uhli.make = { uran:0 }; S.nodes.uhli.autoOut = { uran:true };
      S.nodes.ruda.lvl = 0; S.nodes.ruda.ph = 0; S.nodes.ruda.on = false; S.nodes.ruda.buf = 0;
      S.nodes.hut.lvl = 0; S.nodes.hut.ph = 0; S.nodes.hut.make = {}; S.nodes.hut.autoOut = {};
      const done = (id, key, vr, hl) => { S.owned[id] = true;
        const p = S.plot[id]; p.key = key; p.vr = vr||0; p.hl = hl||1;
        p.phase = BUILDINGS[key].ph.length; p.done = true; };
      done('s2','cinzak',1,1);
      done('sk1','stanek',0,1);
      refreshOrders(true);
    }
  },
  faze1: {
    name:'Fáze 1 — LVL 40, rozehrané město',
    desc:'Domovský pozemek, sídliště, předměstí i obchodní zóna. Elektrárna 4 turbíny, 2 věže.',
    apply(){
      wipeState();
      S.lvl = 40; S.xp = LVL[39] + 2000; S.money = 342765;
      S.mowDone = true; S.skladLvl = 2;
      Object.assign(S.res, { drevo:34, kamen:24, slama:90, hlina:56, uhli:108,
        prkno:41, sterk:55, cihla:46, balik:30, tram:12, dlazba:16, obklad:14, izolace:10 });
      ALL.forEach(r => S.first[r.k] = 1);
      [1,2,3,4].forEach(i => { S.plats[i] = true;
        PIDS.forEach(id => { if (PARC[id].plat === i && PARC[id].free) S.owned[id] = true; }); });

      const done = (id, key, vr, hl) => { S.owned[id] = true;
        const p = S.plot[id]; p.key = key; p.vr = vr||0; p.hl = hl||1;
        p.phase = (BUILDINGS[key]||PLANT).ph.length; p.done = true; p.rent = 0; };
      done('p1','chatka',0,1);
      done('p2','sklad',0,1);
      done('p3','dvur',1,2);
      done('p4','dum',0,1);
      done('p5','dum',2,1);
      S.owned.e1 = true;
      Object.assign(S.plot.e1, { phase:PLANT.ph.length, done:true });
      S.plant = { turb:4, cool:2, nuke:0, blok:1 };
      done('s1','cinzak',0,1);
      done('v1','vila',0,1);
      done('k1','park',0,1);
      done('k2','park',1,2);
      done('o1','obchodak',0,1);

      Object.keys(NODE_DEF).forEach(id => { const n = S.nodes[id];
        const k = nodeDef(id).kind;
        if (k === 'iron' || k === 'smelt') { n.lvl = 0; return; }
        if ((nodeDef(id).plat||0) >= MTN_FIRST) { n.lvl = 0; return; }
        n.lvl = k === 'coal' ? 3 : 4; n.ph = 0; n.on = true; n.buf = 0;
        n.make = {}; n.mEnd = {}; n.autoOut = {};
        stChain(id)[n.lvl-1].makes.forEach(m => { n.make[m] = 0; n.autoOut[m] = true; }); });
      S.seen.order1 = 1; S.orders = []; S.active = []; S.rrLeft = REROLL_MAX;
      refreshOrders(true);
    }
  }
};

function scrDev() {
  opn(`<div class="st">Testovací stavy</div>
    <div class="ss">Načte rozehranou hru, ať se nemusí začínat od nuly.
      <b>Přepíše celý postup</b> — co máš teď, se ztratí.</div>
    ${Object.entries(SCENARIOS).map(([k,sc]) =>
      `<div class="rw"><div class="ric"><div class="sw" style="background:${C.amber}"></div></div>
        <div class="rt"><b>${sc.name}</b><i>${sc.desc}</i></div>
        <div class="ra"><button class="mini" data-sc="${k}">Načíst</button></div></div>`).join('')}
    <div class="ss" style="margin-top:8px">Zpátky na čistý začátek se dostaneš tlačítkem
      <b>Začít znovu</b> v panelu pod logem.</div>
    <button class="btn g" data-close>Zavřít</button>`, 'dev');
  sbody.querySelectorAll('[data-sc]').forEach(b => b.onclick = () => {
    SCENARIOS[b.dataset.sc].apply();
    save(); cls();
    renderTop(); renderRes(); renderQuest(); renderDetail();
    toast('Testovací stav načten');
    setTimeout(()=>location.reload(), 400);
  });
}
/* tlačítko do panelu pod logem */
(function () {
  const orig = $('logo').onclick;
  $('logo').onclick = () => {
    orig();
    const b = document.createElement('button');
    b.className = 'btn g'; b.textContent = 'Načíst testovací stav';
    b.onclick = scrDev;
    sbody.appendChild(b);
  };
})();
