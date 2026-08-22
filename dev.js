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
