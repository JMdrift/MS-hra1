/* ═══════════ UI ═══════════ */
const $ = id => document.getElementById(id);
const sheet=$('sheet'), sbody=$('sheetBody'), detail=$('detail'), dbody=$('detailBody');
const back=$('back'), hintbar=$('hintbar'), banner=$('banner'), bcard=$('bcard');

let openedAt=0, bannerAt=0, lastScreen=null;
const opn = (h, key) => {
  const box = sheet.querySelector('#sheetIn');
  const keep = key && key === lastScreen;
  const pos = keep ? box.scrollTop : 0;
  sbody.innerHTML = h;
  sheet.classList.add('on');
  openedAt = Date.now();
  lastScreen = key || null;
  box.scrollTop = pos;
};
const cls = () => { sheet.classList.remove('on'); lastScreen = null; };
sheet.addEventListener('click', e => {
  if (Date.now()-openedAt < 450) return;
  if (e.target===sheet || e.target.dataset.close!==undefined) cls(); });

/* hlášky se skládají pod sebe, nejstarší mizí první */
const TOAST_MAX = 3;
function toast(t) {
  const wrap = $('toast');
  const last = wrap.lastElementChild;
  if (last && last.dataset.msg === t) {          // stejná hláška hned po sobě
    const n = (+last.dataset.n || 1) + 1;
    last.dataset.n = n;
    last.textContent = t + '  ×' + n;
    clearTimeout(+last.dataset.tm);
    last.dataset.tm = setTimeout(() => last.remove(), 2400);
    return;
  }
  const el = document.createElement('div');
  el.className = 'tmsg';
  el.dataset.msg = t;
  el.textContent = t;
  wrap.appendChild(el);
  while (wrap.children.length > TOAST_MAX) wrap.firstElementChild.remove();
  el.dataset.tm = setTimeout(() => el.remove(), 2400);
}

/* ─── oznámení ─── */
let evQ=[], evOpen=false, deferred=[];
function showEvent(e) {
  if (e.once) { if (S.seen[e.once]) return; S.seen[e.once]=1; }
  if (MODE.v==='detail') { deferred.push(e); if (e.flash) toast(e.flash); return; }
  evQ.push(e); if (!evOpen) nextEvent();
}
function nextEvent() {
  if (!evQ.length) { evOpen=false; banner.classList.remove('on'); return; }
  evOpen=true; const e=evQ.shift();
  bcard.innerHTML = `<div class="bkick ${e.tone||'am'}">${e.kick}</div>
    <div class="btitle">${e.title}</div>
    ${e.desc?`<div class="bdesc">${e.desc}</div>`:''}
    ${e.lines&&e.lines.length?`<div class="blist">${e.lines.map(l=>
      `<div class="bli"><em>${l[0]}</em><span>${l[1]}</span></div>`).join('')}</div>`:''}
    <button class="btn" id="bok">${e.ok||'Pokračovat'}</button>`;
  banner.classList.add('on'); bannerAt=Date.now();
  $('bok').onclick = () => { banner.classList.remove('on');
    if (e.go) { try { e.go(); } catch (err) {} }
    setTimeout(nextEvent,140); };
}
banner.addEventListener('click', e => { if (Date.now()-bannerAt<450) return;
  if (e.target===banner) { banner.classList.remove('on'); setTimeout(nextEvent,140); } });
function flushDeferred() { if (!deferred.length) return;
  evQ.push(...deferred); deferred=[]; setTimeout(()=>{ if(!evOpen) nextEvent(); },260); }

/* ─── kousky ─── */
const capBar = (v,max,cl) =>
  `<div class="cap ${v>=max?'full':''}"><i style="width:${Math.min(100,v/max*100)}%;${cl?'background:'+cl:''}"></i></div>`;
const needTxt = n => Object.entries(n).map(([k,v]) =>
  `<span class="mt ${getRes(k)>=v?'':'no'}">${resIcon(k,12)}${v}× ${RL(k).l.toLowerCase()}</span>`).join('');
const missTxt = n => Object.entries(n).filter(([k,v])=>getRes(k)<v)
  .map(([k,v])=>`${v-getRes(k)}× ${RL(k).l.toLowerCase()}`).join(', ');
const stripHTML = (arr,ph) => `<div class="strip">${arr.map((x,i)=>
  `<div class="chip ${i<ph?'done':i===ph?'now':''}">${i<ph?'✓':i+1}</div>`).join('')}</div>`;
const timeLeft = t => Math.max(0,(t-Date.now())/1000).toFixed(0)+' s';
const progBar = (end,dur,id) => {
  const p = Math.max(0,Math.min(100,(1-(end-Date.now())/(dur||1))*100));
  return `<div class="pbar"><i id="${id||'bfill'}" style="width:${p}%"></i></div>`;
};

/* ─── HUD ─── */
function resPill(r) {
  const v = getRes(r.k), c = capOf(r.k), full = c > 0 && v >= c;
  return `<div class="res ${full?'full':''}" title="${r.l}">
    ${icon(r.ic,r.c,14)}<div class="n">${v}</div>
    <div class="bar" style="width:${c?Math.min(100,v/c*100):0}%"></div></div>`;
}
function renderRes() {
  const showMat  = anyFactory();
  const showHigh = ALL.some(r=>r.tier===2 && getRes(r.k)>0)
    || Object.keys(NODE_DEF).some(id=>S.nodes[id].lvl>=4);
  const showIron = ironBuilt() || S.nodes.ruda.lvl>0 || S.nodes.hut.lvl>0
    || IRON.some(r=>getRes(r.k)>0);
  /* horské suroviny se objeví v liště všude — ve městě i v horách —
     jakmile je hráč začne mít nebo hory otevře */
  const showMtn = mtnOpen() || MTN.some(r=>getRes(r.k)>0);
  const vis = { 0:true, 1:showMat, 2:showHigh, 3:showIron, 4:showMtn };
  /* v horách navíc vidíš vždy všechno městské — hodí se to na stavbu */
  const list = inMtn() ? [...RES, ...MAT, ...HIGH, ...IRON, ...MTN] : ALL.filter(r => vis[r.tier]);
  $('resrow').innerHTML =
    `<div class="res capinfo"><div class="cl">max</div><div class="n">${cap()}</div></div>`
    + list.map(resPill).join('')
    + `<div class="res hintend">›</div>`;
  /* v horách má síť vlastní čísla — město sem proud neposílá */
  const pw = $('pwbox');
  const pMax = inMtn() ? mPowerMax() : powerMax();
  if (pMax > 0) { pw.style.display='flex';
    const free = inMtn() ? mPowerFree() : powerFree();
    const max = pMax;
    const ren = inMtn() ? 0 : renewMw();
    const use = inMtn() ? mPowerUse() : powerUse();
    const gp = Math.max(0, Math.min(100, ren/max*100));      // podíl bez paliva
    const up = Math.max(0, Math.min(100, use/max*100));      // kde je odběr
    const live = inMtn() ? mtnLive() : gridLive();
    pw.className = 'moneybox brk pw' + (live?'':' off') + (free<=0?' low':'');
    pw.innerHTML = `<b>${shortN(free)}</b><span class="cur">z ${shortN(max)}</span>
      ${ren>0?`<span class="spl"><i class="gr" style="width:${gp.toFixed(1)}%"></i>` +
        `<i class="mk" style="left:${up.toFixed(1)}%"></i></span>`:''}`;
    pw.onclick = () => { if (!inMtn()) gridSheet(); };
  } else pw.style.display='none';

  /* voda existuje jen ve městě */
  const wb = $('wbox');
  if (!inMtn() && waterMax() > 0) { wb.style.display='flex';
    const wf = waterFree();
    wb.className = 'moneybox brk pw wt' + (waterLive()?'':' off') + (wf<=0?' low':'');
    wb.innerHTML = `<b>${shortN(wf)}</b><span class="cur">z ${shortN(waterMax())}</span>`;
    wb.onclick = () => waterSheet();
  } else wb.style.display='none';

}

function renewSheet() {
  const ren = renewMw(), pl = plantMw();
  opn(`<div class="st">Obnovitelné zdroje<span class="tag ok">bez paliva</span></div>
    <div class="ss">Větrné a vodní elektrárny dávají <b style="color:var(--leaf)">${ren} MW</b>.
      <b>Tenhle výkon už je započítaný</b> v celkových ${powerMax()} MW nahoře — není to nic navíc.
      Jeho výhoda je jinde: <b>nepotřebuje palivo</b>, takže i kdyby elektrárně došlo uhlí
      nebo uran, těchto ${ren} MW poteče dál a město úplně nezhasne.</div>
    <div class="rw"><div class="ric">${icon('power',C.amber,20)}</div>
      <div class="rt"><b>Volný výkon</b><i>${powerFree()} MW z celkových ${powerMax()} MW</i>
      ${capBar(powerUse(),Math.max(1,powerMax()),powerFree()<=0?'var(--red)':'var(--amber)')}</div></div>
    <div class="rw"><div class="ric">${icon('power',C.green,20)}</div>
      <div class="rt"><b>Bez paliva</b><i>${ren} MW z toho jede vždycky</i>
      ${capBar(ren,Math.max(1,powerMax()),'var(--leaf)')}</div></div>
    <div class="rw"><div class="ric">${icon(isNuke()?'uran':'coal',C.amber,20)}</div>
      <div class="rt"><b>Na palivo</b><i>elektrárna ${pl} MW${
        fueled()?'':' · <b class="no">stojí, došlo palivo</b>'}</i></div></div>
    ${PIDS.filter(id=>{const D=defOf(id);return D&&D.gen&&S.plot[id].done;}).map(id=>{
      const D=defOf(id), st=S.plot[id];
      return `<div class="rw"><div class="ric"><div class="sw" style="background:${styleOf(id).wall}"></div></div>
        <div class="rt"><b>${D.name} <span class="tag sky">LVL ${st.hl}</span>${
          isBroken('p:'+id)?'<span class="tag" style="color:var(--red);border-color:var(--red)">závada</span>':''}</b>
        <i>${D.gen[Math.min(st.hl,D.gen.length)-1]} MW · nájem ${fmt(houseRent(id))}/min</i></div></div>`;}).join('')}
    <button class="btn g" data-close>Zavřít</button>`, 'obnov');
}
function waterSheet() {
  const use=waterUse(), max=waterMax();
  opn(`<div class="st">Vodovodní síť ${waterLive()?'<span class="tag ok">v provozu</span>'
      :'<span class="tag" style="color:var(--red);border-color:var(--red)">bez proudu</span>'}</div>
    <div class="ss">Voda je potřeba na <b>vylepšení</b> vil, činžáků a obchoďáku,
      na druhou chladicí věž a na hotely. Vodojem sám jede na proud.</div>
    <div class="rw"><div class="ric">${icon('drop',C.sky,20)}</div>
      <div class="rt"><b>Volná voda ${max-use} m³</b><i>vyrábíš ${max} m³, odebíráš ${use} m³</i>
      ${capBar(use,Math.max(1,max),use>max?'var(--red)':'var(--sky)')}</div></div>
    <div class="rw"><div class="ric">${icon('power',C.amber,20)}</div>
      <div class="rt"><b>Spotřeba proudu</b><i>vodojem a čerpadla berou ${pumpPower()} MW</i></div></div>
    ${PIDS.filter(id=>{const D=defOf(id);return D&&D.wdraw&&S.plot[id].done&&wdrawOf(id)>0;}).map(id=>{
      const D=defOf(id);
      return `<div class="rw"><div class="ric"><div class="sw" style="background:${styleOf(id).wall}"></div></div>
        <div class="rt"><b>${D.name} <span class="tag sky">LVL ${S.plot[id].hl}</span></b>
        <i>odběr ${wdrawOf(id)} m³</i></div></div>`;}).join('')}
    <button class="btn g" data-close>Zavřít</button>`, 'voda');
}
function renderTop() {
  $('lvl').textContent = S.lvl;
  $('money').textContent = shortN(S.money);
  const need = LVL[S.lvl]!==undefined?LVL[S.lvl]:LVL[MAXLVL-1], prev = LVL[S.lvl-1]||0;
  $('xpfill').style.width = (S.lvl>=MAXLVL?100:Math.max(0,(S.xp-prev)/(need-prev)*100))+'%';
  $('xptxt').textContent = S.lvl>=MAXLVL ? shortN(S.xp) : `${shortN(S.xp)} / ${shortN(need)}`;
}
let lastQ = null;
function renderWorld() {
  const el = $('worldbtn');
  if (!el) return;
  /* dokud se hory připravují, tlačítko vůbec nesvítí */
  const show = (inMtn() || (hasWorld() && mtnOpen())) && MODE.v === 'map'
    && !sheet.classList.contains('on') && !banner.classList.contains('on');
  el.style.display = show ? 'flex' : 'none';
  el.className = inMtn() ? 'mtn' : '';
}
function gotoWorld(w) {
  if (w === 1 && !mtnOpen()) {          // není kam jet — hory ještě nejsou
    syncPlatforms();
    if (!mtnOpen()) { toast('Horský kraj se otevře, až dostavíš nádraží'); return; }
  }
  S.world = w; save();
  /* nejdřív zavřít panely — jinak by nám vrátily starou kameru */
  cls(); closeParcel();
  WB = worldBounds();
  MODE = { v:'map' }; ZU = 1;
  /* v horách na koncovou stanici, ve městě na domovský pozemek */
  const pl = PLAT(w ? MTN_FIRST : 0);
  const cx = pl.ox + 6.5, cy = pl.oy + 6.5, sc = Z();
  panX = -(cx-cy)*(TW/2)*sc;
  panY = -(cx+cy)*(TH/2)*sc + (H*.46 - cy0);
  clampPan();
  renderRes(); renderTop(); renderQuest(); draw();
  toast(w ? 'Horský kraj' : 'Zpátky ve městě');
}
function worldSheet() {
  if (!mtnOpen() && !hasWorld()) {
    opn(`<div class="st">Horský kraj<span class="tag sky">připravujeme</span></div>
      <div class="ss">Nádraží stojí a vlaky jsou připravené. Za hřebenem se dodělává
        <b>horský kraj</b> — nová krajina s vlastní sítí, těžbou a sezónami.</div>
      <div class="bli"><em>Co tam bude</em><span>lomy ve skále, lanovky, přehrada v údolí</span></div>
      <div class="bli"><em>Peníze</em><span>platí v obou světech</span></div>
      <div class="bli"><em>Suroviny</em><span>horské se musí vytěžit na místě, městské přivézt vlakem</span></div>
      <div class="ss" style="margin-top:8px">Otevře se v příští verzi. Zatím si užij město.</div>
      <button class="btn g" data-close>Zavřít</button>`, 'svet');
    return;
  }
  if (mtnOpen()) {
    opn(`<div class="st">Kam se podíváš?</div>
      <div class="ss">Obě části běží zároveň — město vyrábí dál, i když jsi v horách.</div>
      <div class="rw"><div class="ric">${icon('brick',C.brick,20)}</div>
        <div class="rt"><b>Město</b><i>${PIDS.filter(i=>PARC[i].plat<MTN_FIRST&&S.plot[i].done).length} staveb
          · nájem ${fmt(PIDS.filter(i=>PARC[i].plat<MTN_FIRST).reduce((a,i)=>a+houseRent(i),0))}/min</i></div>
        <div class="ra"><button class="mini${inMtn()?'':' o'}" id="gocity">Do města</button></div></div>
      <div class="rw"><div class="ric">${icon('granite','#9A8E86',20)}</div>
        <div class="rt"><b>Horský kraj</b><i>${PIDS.filter(i=>PARC[i].plat>=MTN_FIRST&&S.plot[i].done).length} staveb
          · síť ${mPowerUse()} z ${mPowerMax()} MW${snowing()?' · <b class="no">sněží</b>':''}</i></div>
        <div class="ra"><button class="mini${inMtn()?' o':''}" id="gomtn">Do hor</button></div></div>
      <button class="btn g" data-close>Zavřít</button>`, 'svet');
    $('gocity').onclick = () => gotoWorld(0);
    $('gomtn').onclick  = () => gotoWorld(1);
    return;
  }
  opn(`<div class="st">Cesta do hor<span class="tag sky">připravuje se</span></div>
    <div class="ss">Nádraží stojí a vlaky jsou připravené. Za hřebenem začíná
      <b>horský kraj</b> — nová krajina, kde je všechno dražší a začíná se od píky.</div>
    <div class="bli"><em>Proč nádraží</em><span>bez něj se do hor nedostaneš</span></div>
    <div class="bli"><em>Proč automatizace</em><span>město musí běžet samo, než odjedeš</span></div>
    <div class="bli"><em>Co tam bude</em><span>lomy ve skále, lanovky, přehrada v údolí</span></div>
    <div class="ss" style="margin-top:8px">Krajina se dodělává — do hry přibude
      v příští verzi. Nádraží a řídicí centrum jsou příprava na ni.</div>
    <button class="btn g" data-close>Zavřít</button>`, 'svet');
}
function renderSeason() {
  const el = $('seabar');
  if (!el) return;
  if (!mtnOpen() || !inMtn() || !seasonMatters()) { el.classList.remove('on'); return; }
  const S2 = season();
  el.classList.add('on');
  el.style.background = S2.c;
  el.textContent = `${S2.n.toUpperCase()} · ${S2.d} · ${Math.ceil(seasonLeft()/60000)} min`;
}
function renderFest() {
  const el = $('festbar');
  if (!el) return;
  const e = S.evs.find(x => x.t === 'fest' && Date.now() < x.end);
  if (!e) { el.classList.remove('on'); return; }
  el.classList.add('on');
  const left = Math.max(0, e.end - Date.now());
  el.textContent = `FESTIVAL · dvojnásobný nájem v lunaparku · ${Math.ceil(left/1000)} s`;
}
function renderQuest() {
  const q = quest();
  $('qTitle').textContent = q.t; $('qDesc').textContent = q.d; $('qProg').textContent = q.p;
  if (lastQ === null) { lastQ = q.t; return; }
  if (q.t !== lastQ) {
    const rew = questReward();
    S.money += rew; renderTop(); save();
    showEvent({ flash:`Úkol splněn · +${fmt(rew)}`, kick:'Úkol splněn', tone:'ok', title:lastQ,
      desc:'Odměna připsána.',
      lines:[['Odměna',fmt(rew)],['Teď',q.t],['Jak',q.d]], ok:'Jdu na to' });
    lastQ = q.t;
  }
}
$('quest').onclick = () => { const q = quest(); if (q.go) q.go(); };

/* ─── detail parcely ─── */
let pickSel = {}, pickVar = {};
function openParcel(id) {
  MODE = { v:'detail', id }; focusOn(PARC[id], spanOf(id));
  back.classList.add('on'); detail.classList.add('on'); hintbar.style.display='none';
  renderDetail();
}
function closeParcel() {
  MODE = { v:'map' }; ZU = 1;
  /* zpátky na střed právě zobrazeného světa, ne na nulu */
  const pl = PLAT(inMtn() ? MTN_FIRST : 0), sc0 = Z();
  const cx = pl.ox + 6.5, cy = pl.oy + 6.5;
  panX = -(cx-cy)*(TW/2)*sc0;
  panY = -(cx+cy)*(TH/2)*sc0 + (H*.46 - cy0);
  back.classList.remove('on'); detail.classList.remove('on');
  resize();
  panX = -(cx-cy)*(TW/2)*Z();
  panY = -(cx+cy)*(TH/2)*Z() + (H*.46 - cy0);
  clampPan();
  back.classList.remove('on'); detail.classList.remove('on'); hintbar.style.display='';
  flushDeferred();
}
back.onclick = closeParcel;
function renderDetail() { if (MODE.v!=='detail') return;
  const pos = detail.scrollTop;
  dbody.innerHTML = parcelHTML(MODE.id); bindDetail();
  detail.scrollTop = pos; }

function pickHTML(id) {
  const list = PARC[id].accept.filter(k => S.lvl >= (BUILDINGS[k].reqLvl||1));
  if (!list.length) return `<div class="st">${PARC[id].name}</div>
    <div class="ss">Stavba pro tuhle parcelu se odemkne později.</div>`;
  if (!pickSel[id] || list.indexOf(pickSel[id])<0) pickSel[id] = list[0];
  const key = pickSel[id], B = BUILDINGS[key];
  if (pickVar[id] === undefined || pickVar[id] >= B.vars.length) pickVar[id] = 0;
  const vr = pickVar[id], v = B.vars[vr];
  const tot = {}; B.ph.forEach(x => Object.entries(mixNeed(x.need, v.mix))
    .forEach(([r,q]) => tot[r] = (tot[r]||0)+q));
  return `<div class="st">${B.name} — vyber provedení</div>
    <div class="ss">${WHY[key]||'Ťukni na provedení, nad parcelou uvidíš, jak bude vypadat.'}</div>
    <div class="ss nx">${B.rent?`Nájem ${fmt(B.rent)}/min`:'Sama nevydělává'}${
      B.draw?` · odběr ${B.draw[0]} MW`:''}${B.mdraw?` · odběr ${B.mdraw[0]} MW`:''}${
      B.mgen?` · dává ${B.mgen[0]} MW`:''}${B.wdraw&&B.wdraw[0]?` · ${B.wdraw[0]} m³ vody`:''}
      · ${B.ph.length} fází</div>
    ${list.length>1 ? `<div class="tabs">${list.map(k=>
      `<div class="tab ${k===key?'sel':''}" data-pk="${k}" data-pid="${id}">${BUILDINGS[k].name}</div>`).join('')}</div>`:''}
    <div class="tabs">${B.vars.map((x,i)=>
      `<div class="tab ${i===vr?'sel':''}" data-pv="${i}" data-pid="${id}">${x.n}</div>`).join('')}</div>
    <div class="mats">${Object.entries(tot).map(([r,q])=>
      `<span class="mt ${getRes(r)>=q?'':'no'}">${resIcon(r,12)}${q}× ${RL(r).l.toLowerCase()}</span>`).join('')}</div>
    <div class="ss">${B.ph.length} fází po ${(B.dur/1000)|0} s${B.money?` · odměna ${fmt(B.money)}`:''}${
      B.rent?` · <b style="color:var(--leaf)">nájem ${fmt(B.rent)}/min</b>`:''}${
      B.draw?` · odběr ${B.draw[0]} MW`:''}</div>
    ${B.needPower&&powerFree()<B.draw[0]?`<div class="ss"><b class="no">Nemáš dost volného výkonu.</b>
      Potřebuješ ${B.draw[0]} MW, volných je ${powerFree()} MW.</div>`:''}
    <button class="btn" id="confirmPick" data-pid="${id}" ${
      B.needPower&&powerFree()<B.draw[0]?'disabled':''}>Zvolit a začít stavět</button>`;
}

function faultBar(key, name) {
  const f = faultOf(key), c = repairCost(key);
  if (f && f.fix) return `<div class="fault"><div class="ft"><b>${name}</b>
      <i>Hasiči jsou na cestě. Jakmile dorazí, stavba naskočí.</i></div>
    ${progBar(f.fix, f.dur||REPAIR_DRIVE, 'fixfill')}</div>`;
  return `<div class="fault"><div class="ft"><b>${name}</b>
      <i>Stavba je mimo provoz. Zaplať opravu a přijedou hasiči.</i></div>
    <button class="btn go" id="fix" data-k="${key}" ${S.money<c?'disabled':''}>Zavolat hasiče za ${fmt(c)}</button></div>`;
}
/* proč tuhle parcelu vůbec kupovat */
function whyHTML(id) {
  const p = PARC[id];
  const keys = p.plant ? ['plant'] : p.pump ? ['pump'] : p.pumpst ? ['pumpst']
    : p.ironStore ? ['iron'] : p.port ? [p.port] : null;
  if (keys) return `<div class="whyb">${keys.map(k=>`<b>${WHY_SPECIAL[k]}</b>`).join('')}</div>`;
  const acc = p.accept || [];
  if (!acc.length) return '';
  return `<div class="whyb">${acc.map(k => { const B = BUILDINGS[k];
    return `<div class="whyr"><em>${B.name}</em><span>${WHY[k]||''}</span>
      <i>${B.rent?`nájem ${fmt(B.rent)}/min`:'nevydělává'}${
        B.draw?` · ${B.draw[0]} MW`:''}${B.mdraw?` · ${B.mdraw[0]} MW`:''}${
        B.mgen?` · dává ${B.mgen[0]} MW`:''}${B.wdraw&&B.wdraw[0]?` · ${B.wdraw[0]} m³`:''}</i></div>`;
    }).join('')}</div>`;
}
function parcelHTML(id) {
  const p = PARC[id], st = S.plot[id];
  if (isOwned(id) && isBroken('p:'+id))
    return `<div class="st">${isPlant(id)?(isNuke()?'Jaderná elektrárna':'Elektrárna')
      :isPump(id)?'Vodojem':isIronStore(id)?'Rudný sklad'
      :(defOf(id)?defOf(id).name:p.name)}<span class="tag"
      style="color:var(--red);border-color:var(--red)">závada</span></div>
      ${faultBar('p:'+id, faultOf('p:'+id).n)}`;
  if (!isOwned(id)) {
    const lvOk = !p.reqLvl || S.lvl >= p.reqLvl, ok = lvOk && canBuy(id);
    return `<div class="st">${p.name}</div>
      <div class="ss">${!lvOk ? `Odemkne se na <b>LVL ${p.reqLvl}</b>.`
        : !canBuy(id) ? lockTxt(id) : 'Volná parcela, připravená ke stavbě.'}</div>
      ${whyHTML(id)}
      <button class="btn" id="buy" ${!ok||S.money<p.cost?'disabled':''}>Koupit za ${fmt(p.cost)}</button>
      ${ok&&S.money<p.cost?`<div class="ss" style="margin:6px 0 0">Chybí ${fmt(p.cost-S.money)}.</div>`:''}`;
  }
  if (id==='p1' && !S.mowDone) {
    const d = 40-mowLeftN();
    return `<div class="st">${p.name}</div>
      <div class="ss">Zarostlá parcela. <b>Přejeď prstem po trávě.</b></div>
      ${capBar(d,40)}<div class="ss" style="margin-top:4px">Posekáno ${d} ze 40 trsů</div>`;
  }
  if (isPlant(id)) return plantHTML(id);
  if (isPump(id)) return pumpHTML(id);
  if (isPort(id)) return portHTML(id);
  if (isIronStore(id)) return ironHTML(id);
  if (isPumpSt(id)) return pumpStHTML(id);
  const D = defOf(id);
  if (!D) return pickHTML(id);
  if (st.bEnd) {
    const cur = D.ph[st.phase];
    return `<div class="st">${D.name}<span class="tag sky">staví se</span></div>
      ${stripHTML(D.ph,st.phase)}
      <div class="now-line"><b>${cur.n}</b></div>
      ${progBar(st.bEnd, st.bDur||D.dur)}`;
  }
  if (st.done) return doneHTML(id,D,st);
  const cur = D.ph[st.phase], need = phaseNeed(id, st.phase);
  return `<div class="st">${D.name}<span class="tag">fáze ${st.phase+1} / ${D.ph.length}</span></div>
    ${stripHTML(D.ph,st.phase)}
    <div class="now-line"><b>${cur.n}</b><span>${(D.dur/1000)|0} s · +${cur.xp} XP</span></div>
    <div class="mats">${needTxt(need)}</div>
    ${D.rent?`<div class="ss">Po dokončení: nájem <b style="color:var(--leaf)">${fmt(D.rent)}/min</b>${
      D.draw?` · odběr ${D.draw[0]} MW`:''}</div>`:''}
    <button class="btn" id="bd">Postavit fázi</button>
    ${st.phase===0?`<button class="btn g" id="reselect">Změnit provedení</button>`:''}`;
}
function lockTxt(id) { const p = PARC[id];
  if (p.after) return `Na prodej bude, až dokončíš ${PARC[p.after].name.toLowerCase()}.`;
  return 'Zatím nedostupné.'; }

/* společný blok vylepšení */
function upBlock(id, D, st, label) {
  const up = nextHouseUp(id);
  if (st.uEnd) return `<div class="now-line" style="margin-top:7px"><b>Rozšíření</b></div>${progBar(st.uEnd,st.uDur||1)}`;
  if (!up) return `<div class="ss" style="margin-top:8px">Na maximální úrovni.</div>`;
  const lvOk = S.lvl >= up.reqLvl;
  return `<div class="now-line" style="margin-top:8px"><b>${up.label}</b>
      <span>${label(up)}${lvOk?'':` · <b class="no">od LVL ${up.reqLvl}</b>`}</span></div>
    <div class="mats">${needTxt(up.need)}<span class="mt">${fmt(up.cost)}</span></div>
    <button class="btn" id="hu" ${lvOk?'':'disabled'}>Rozšířit</button>`;
}
function doneHTML(id,D,st) {
  let h = `<div class="st">${D.name}${st.hl>1?`<span class="tag sky">LVL ${st.hl}</span>`:''}<span class="tag ok">hotovo</span></div>`;
  if (D.store) {
    const nx = SKLAD_UP[S.skladLvl+1];
    h += `<div class="ss">Uskladníš <b>${cap()} ks</b> od každé suroviny.
      Přehled a obchodování najdeš v záložce Obchod.</div>`;
    if (st.uEnd) h += `<div class="now-line"><b>Rozšíření skladu</b></div>${progBar(st.uEnd,st.uDur||1)}`;
    else if (nx) { const lvOk = S.lvl >= nx.reqLvl;
      h += `<div class="now-line"><b>Sklad LVL ${S.skladLvl+1}</b>
        <span>${nx.cap} ks · ${fmt(nx.cost)}${lvOk?'':` · <b class="no">od LVL ${nx.reqLvl}</b>`}</span></div>
        <div class="mats">${needTxt(nx.need)}</div>
        <button class="btn" id="su" ${lvOk?'':'disabled'}>Rozšířit sklad</button>`; }
    else h += `<div class="ss">Sklad je na maximální úrovni.</div>`;
    return h;
  }
  if (D.office) {
    const act = S.active.length, sl = orderSlots();
    h += `<div class="ss">Odsud bereš <b>zakázky</b> — objednávky na materiál,
      které platí mnohem líp než obchod.</div>
      <div class="rw"><div class="ric">${icon('coin',C.amber,20)}</div>
        <div class="rt"><b>Zakázky</b><i>${act} rozpracované z ${sl} možných</i>
        ${capBar(act,Math.max(1,sl),'var(--amber)')}</div>
        <div class="ra"><button class="mini" id="goOrd">Otevřít</button></div></div>`;
    const up = nextHouseUp(id);
    if (st.uEnd) h += `<div class="now-line" style="margin-top:7px"><b>Přístavba</b></div>${progBar(st.uEnd,st.uDur||1)}`;
    else if (up) { const lvOk = S.lvl >= up.reqLvl;
      h += `<div class="now-line" style="margin-top:8px"><b>${up.label}</b>
        <span>${sl} → ${sl+1} zakázky najednou${lvOk?'':` · <b class="no">od LVL ${up.reqLvl}</b>`}</span></div>
        <div class="mats">${needTxt(up.need)}<span class="mt">${fmt(up.cost)}</span></div>
        <button class="btn" id="hu" ${lvOk?'':'disabled'}>Přistavět</button>`; }
    else h += `<div class="ss">Dvůr je na maximální úrovni.</div>`;
    return h;
  }
  if (D.mtnStore) {
    h += `<div class="ss">Horské suroviny se do městských skladů nevejdou —
      patří jen sem. Tahle hala pojme <b>${D.mtnStore[Math.min(st.hl,D.mtnStore.length)-1]} ks</b>
      od každé, dohromady s ostatními <b>${mtnStoreCap()} ks</b>.</div>
      ${MTN.map(r=>`<div class="rw"><div class="ric">${icon(r.ic,r.c,20)}</div>
        <div class="rt"><b>${r.l}</b><i>${getRes(r.k)} / ${mtnStoreCap()} ks</i>
        ${capBar(getRes(r.k),Math.max(1,mtnStoreCap()))}</div></div>`).join('')}`;
    return h + upBlock(id, D, st, u => `${D.mtnStore[Math.min(st.hl,D.mtnStore.length)-1]} → ${
      D.mtnStore[Math.min(st.hl+1,D.mtnStore.length)-1]} ks`);
  }
  if (D.mgen) {
    const g = D.mgen[Math.min(st.hl,D.mgen.length)-1];
    h += `<div class="ss">Dodává <b style="color:var(--amber)">${g} MW</b> do <b>horské sítě</b>.
      Proud z města sem nedosáhne — hory si musí vystačit samy.</div>
      <div class="rw"><div class="ric">${icon('power',C.amber,20)}</div>
        <div class="rt"><b>Horská síť</b><i>odběr ${mPowerUse()} z ${mPowerMax()} MW</i>
        ${capBar(mPowerUse(),Math.max(1,mPowerMax()),mPowerFree()<0?'var(--red)':'var(--amber)')}</div></div>`;
    if (D.flood) { const nx = D.flood[Math.min(st.hl+1,D.flood.length)-1];
      const list = willFlood(nx);
      if (nx > 0) h += `<div class="ss">Po zvednutí hráze <b>stoupne hladina</b> a zatopí horní údolí.${
        list.length?` Pod vodou skončí <b class="no">${list.length} staveb</b> — musíš je vyplatit za <b>${fmt(floodBill(list))}</b>.`:''}</div>`; }
    return h + upBlock(id, D, st, () => `${g} → ${D.mgen[Math.min(st.hl+1,D.mgen.length)-1]} MW`);
  }
  if (D.cable) {
    h += `<div class="ss">Lanovka spojuje horské platformy — místo silnic.
      Bere <b>${D.mdraw[Math.min(st.hl,D.mdraw.length)-1]} MW</b> z horské sítě.</div>`;
    return h + upBlock(id, D, st, () => `${D.mdraw[Math.min(st.hl,D.mdraw.length)-1]} → ${
      D.mdraw[Math.min(st.hl+1,D.mdraw.length)-1]} MW`);
  }
  if (D.autoMine || D.autoRent || D.autoFix) {
    const i = Math.min(st.hl, (D.autoMine||D.autoRent||D.autoFix).length) - 1;
    const txt = D.autoMine ? `Sveze suroviny ze všech městských stanic <b>každých ${(D.autoMine[i]/1000)|0} s</b>.`
      : D.autoRent ? `Vybere nájem ze všech městských budov <b>každých ${(D.autoRent[i]/1000)|0} s</b>
        a sama vyzvedne <b>hotové zakázky</b>.`
      : `Opraví každou městskou poruchu sama, ale za <b>${D.autoFix[i].toFixed(1)}× cenu</b> běžné opravy.`;
    h += st.off
      ? `<div class="ss"><b class="no">Odpojeno od sítě — teď nic nesbírá ani nevybírá.</b>
          Zapojí se sama zpátky, jakmile bude v síti volné místo, nebo to zkus ručně.</div>`
      : `<div class="ss">${txt} Nemusíš na nic klikat.</div>`;
    /* diagnostika — ať je vidět přesně, co brání automatice, ne jen že nefunguje */
    const brk = isBroken('p:'+id);
    const nowT = Date.now();
    const lastKey = D.autoMine ? 'mine' : D.autoRent ? 'rent' : null;
    const last = lastKey ? (S.autoT[lastKey]||0) : null;
    const period = D.autoMine ? D.autoMine[i] : D.autoRent ? D.autoRent[i] : null;
    h += `<div class="ss nx" style="margin-top:6px;opacity:.75">
      Stav: ${st.done?'postaveno':'staví se'} · ${st.off?'odpojeno':'v síti'} · ${brk?'porouchané':'v pořádku'}
      ${period?` · poslední sběr před ${Math.round((nowT-last)/1000)} s, spustí se po ${Math.round(period/1000)} s`:''}
      </div>
      <button class="mini o" id="forceAuto" style="margin-top:6px">Spustit hned na zkoušku</button>`;
    const up = nextHouseUp(id);
    if (st.uEnd) h += `<div class="now-line" style="margin-top:7px"><b>Rozšíření</b></div>${progBar(st.uEnd,st.uDur||1)}`;
    else if (up) { const lvOk = S.lvl >= up.reqLvl;
      const arr = D.autoMine||D.autoRent||D.autoFix;
      const nv = arr[Math.min(st.hl+1, arr.length)-1];
      h += `<div class="now-line" style="margin-top:8px"><b>${up.label}</b>
        <span>${D.autoFix ? `${arr[i].toFixed(1)}× → ${nv.toFixed(1)}×`
          : `${(arr[i]/1000)|0} s → ${(nv/1000)|0} s`}${lvOk?'':` · <b class="no">od LVL ${up.reqLvl}</b>`}</span></div>
        <div class="mats">${needTxt(up.need)}<span class="mt">${fmt(up.cost)}</span></div>
        <button class="btn" id="hu" ${lvOk?'':'disabled'}>Rozšířit</button>`; }
    else h += `<div class="ss">Na maximální úrovni.</div>`;
    return h;
  }
  if (D.city) {
    const b = D.city[Math.min(st.hl,D.city.length)-1];
    h += `<div class="ss">Sama nevydělává ani korunu. Zato zvedá nájem
      <b>všem stavbám ve městě</b> o <b style="color:var(--leaf)">${Math.round(b*100)} %</b> —
      i těm, které máš dávno postavené.</div>
      <div class="rw"><div class="ric">${icon('coin',C.amber,20)}</div>
        <div class="rt"><b>Historické stavby dohromady</b>
        <i>+${Math.round(cityBoost()*100)} % nájmu v celém městě</i>
        ${capBar(cityBoost(),0.8,'var(--leaf)')}</div></div>`;
    const up = nextHouseUp(id);
    if (st.uEnd) h += `<div class="now-line" style="margin-top:7px"><b>Přestavba</b></div>${progBar(st.uEnd,st.uDur||1)}`;
    else if (up) { const lvOk = S.lvl >= up.reqLvl;
      h += `<div class="now-line" style="margin-top:8px"><b>${up.label}</b>
        <span>${Math.round(b*100)} → ${Math.round(D.city[Math.min(st.hl+1,D.city.length)-1]*100)} %${
          lvOk?'':` · <b class="no">od LVL ${up.reqLvl}</b>`}</span></div>
        <div class="mats">${needTxt(up.need)}<span class="mt">${fmt(up.cost)}</span></div>
        <button class="btn" id="hu" ${lvOk?'':'disabled'}>Přestavět</button>`; }
    else h += `<div class="ss">Na maximální úrovni.</div>`;
    return h;
  }
  if (D.gen) {
    const g = D.gen[Math.min(st.hl,D.gen.length)-1];
    h += `<div class="ss">Dodává <b style="color:var(--amber)">${g} MW</b> do sítě
      a <b>nepotřebuje palivo</b>. Točí se, i když elektrárně dojde uhlí.</div>
      <div class="rw"><div class="ric">${icon('power',C.amber,20)}</div>
        <div class="rt"><b>Obnovitelné zdroje</b><i>celkem ${renewMw()} MW z ${powerMax()} MW v síti</i>
        ${capBar(renewMw(),Math.max(1,powerMax()),'var(--leaf)')}</div></div>`;
    const up = nextHouseUp(id);
    if (st.uEnd) h += `<div class="now-line" style="margin-top:7px"><b>Vylepšení</b></div>${progBar(st.uEnd,st.uDur||1)}`;
    else if (up) { const lvOk = S.lvl >= up.reqLvl;
      h += `<div class="now-line" style="margin-top:8px"><b>${up.label}</b>
        <span>${g} → ${D.gen[Math.min(st.hl+1,D.gen.length)-1]} MW${
          lvOk?'':` · <b class="no">od LVL ${up.reqLvl}</b>`}</span></div>
        <div class="mats">${needTxt(up.need)}<span class="mt">${fmt(up.cost)}</span></div>
        <button class="btn" id="hu" ${lvOk?'':'disabled'}>Vylepšit</button>`; }
    else h += `<div class="ss">Na maximální úrovni.</div>`;
    return h;
  }
  if (D.park) {
    h += `<div class="ss">Zvyšuje nájem všech vil na předměstí o
      <b style="color:var(--leaf)">${Math.round(D.boost[Math.min(st.hl,D.boost.length)-1]*100)} %</b>.</div>`;
  } else {
    const r = houseRent(id), rc = houseRentCap(id);
    h += `<div class="ss">${D.needPower?`Odběr <b style="color:var(--amber)">${drawOf(id)} MW</b>${
      wdrawOf(id)?` · ${wdrawOf(id)} m³ vody`:''}${
      st.off?' · <b class="no">odpojeno od sítě</b>':gridLive()?'':' · <b class="no">bez proudu nevydělává</b>'}<br>`:''}
      Nájem <b style="color:var(--leaf)">${fmt(r)}/min</b> do stropu ${fmt(rc)}.${
        D.sea?` <b style="color:${season().c}">${season().n} ×${D.sea[seasonIdx()]}</b>`:''}${
        festMul(PARC[id].plat)>1?' <b style="color:var(--amber)">Festival — dvojnásobek!</b>':''}</div>
      ${capBar(st.rent,rc)}
      <div class="ss" style="margin-top:4px">Nastřádáno ${fmt(st.rent)}</div>
      <button class="btn go" id="rent" ${st.rent<1?'disabled':''}>Vybrat nájem ${fmt(st.rent)}</button>
      ${canUnplug(id)?`<button class="btn g" id="unplug">${st.off
        ? `Připojit k síti (${drawOf(id)} MW)` : 'Odpojit od sítě a uvolnit '+drawOf(id)+' MW'}</button>`:''}`;
  }
  const up = nextHouseUp(id);
  if (st.uEnd) h += `<div class="now-line" style="margin-top:7px"><b>Vylepšení</b></div>${progBar(st.uEnd,st.uDur||1)}`;
  else if (up) { const lvOk = S.lvl >= up.reqLvl;
    h += `<div class="now-line" style="margin-top:8px"><b>${up.label}</b>
      <span>LVL ${st.hl} → ${st.hl+1}${up.rentMul?` · nájem ${fmt(Math.round(D.rent*up.rentMul))}/min`:''}${
        lvOk?'':` · <b class="no">od LVL ${up.reqLvl}</b>`}</span></div>
      <div class="mats">${needTxt(up.need)}<span class="mt">${fmt(up.cost)}</span></div>
      <button class="btn" id="hu" ${lvOk?'':'disabled'}>Vylepšit</button>`; }
  return h;
}

/* ─── elektrárna ─── */
function plantHTML(id) {
  const st = S.plot[id];
  if (!st.done) {
    if (st.phase === 0 && !st.bEnd)
      return `<div class="st">Elektrárna</div>
        <div class="ss">Dá proud celému městu. Postavíš ji v šesti fázích, vstupní náklady
          <b>${fmt(PLANT.cost)}</b>.</div>
        <div class="mats">${needTxt(PLANT.ph[0].need)}<span class="mt">${fmt(PLANT.cost)}</span></div>
        <div class="ss">Výkon LVL 1: <b style="color:var(--amber)">${PLANT.turbine[0].mw} MW</b>
          · spálí 1 uhlí za ${(PLANT.burnBase/1000)|0} s</div>
        <button class="btn" id="bd">Zaplatit a postavit základy</button>`;
    if (st.bEnd) {
      const cur = PLANT.ph[st.phase];
      return `<div class="st">Elektrárna<span class="tag sky">staví se</span></div>
        ${stripHTML(PLANT.ph,st.phase)}
        <div class="now-line"><b>${cur.n}</b></div>
        ${progBar(st.bEnd, st.bDur||PLANT.dur)}`;
    }
    const cur = PLANT.ph[st.phase];
    return `<div class="st">Elektrárna<span class="tag">fáze ${st.phase+1} / 6</span></div>
      ${stripHTML(PLANT.ph,st.phase)}
      <div class="now-line"><b>${cur.n}</b><span>${(PLANT.dur/1000)|0} s · +${cur.xp} XP</span></div>
      <div class="mats">${needTxt(cur.need)}</div>
      <button class="btn" id="bd">Postavit fázi</button>`;
  }
  const cl = S.plant.cool, nuke = isNuke();
  const nt = nextTurbine(), nc = nextCooling(), nb = nextBlock();
  let h = `<div class="st">${nuke?'Jaderná elektrárna':'Elektrárna'}
      <span class="tag sky">${nuke?`${S.plant.blok}. blok`:`${S.plant.turb} turbín${S.plant.turb>1?'y':'a'}`}</span>
      <span class="tag">${cl} věž${cl>1?'e':''}</span></div>
    <div class="ss">Dává <b style="color:var(--amber)">${powerMax()} MW</b>,
      spálí 1 ${RL(fuelKey()).l.toLowerCase()} za ${(burnRate()/1000)|0} s. Odběr sítě ${powerUse()} MW.</div>
    ${capBar(powerUse(), Math.max(1,powerMax()), powerUse()>powerMax()?'var(--red)':'var(--amber)')}
    <div class="ss" style="margin-top:4px">${RL(fuelKey()).l} ve skladu: ${S.res[fuelKey()]} ks${
      burnRate()&&S.res[fuelKey()]?` · vydrží ${Math.round(S.res[fuelKey()]*burnRate()/60000)} min`
      :' · <b class="no">došlo</b>'}</div>`;
  if (st.uEnd) {
    const lbl = { turb:'Montáž turbíny', cool:'Stavba chladicí věže',
                  nuke:'Přestavba na jádro', blok:'Stavba reaktorového bloku' }[st.upKind] || 'Vylepšení';
    h += `<div class="now-line" style="margin-top:8px"><b>${lbl}</b></div>
      ${progBar(st.uEnd,st.uDur||1)}`;
    return h;
  }
  if (!nuke && nt) {
    const ok = turbineAllowed() && S.lvl >= nt.reqLvl;
    h += `<div class="now-line" style="margin-top:9px"><b>Turbína ${S.plant.turb+1}</b>
      <span>${powerMax()} → ${nt.mw} MW${S.lvl<nt.reqLvl?` · <b class="no">od LVL ${nt.reqLvl}</b>`:''}</span></div>
      <div class="mats">${needTxt(nt.need)}<span class="mt">${fmt(nt.cost)}</span></div>
      ${!turbineAllowed()&&S.lvl>=nt.reqLvl?`<div class="ss"><b class="no">Chybí chlazení.</b>
        Potřebuješ ${nt.cool}. chladicí věž.</div>`:''}
      <button class="btn" id="turb" ${ok?'':'disabled'}>Postavit turbínu</button>`;
  }
  if (!nuke && !nt) {
    const nu = PLANT.nuclear, ok = nukeReady() && S.lvl >= nu.reqLvl;
    h += `<div class="now-line" style="margin-top:9px"><b>${nu.label}</b>
      <span>${powerMax()} → ${powerMax()+PLANT.blocks[0].mw} MW${
        S.lvl<nu.reqLvl?` · <b class="no">od LVL ${nu.reqLvl}</b>`:''}</span></div>
      <div class="ss">Kotelnu nahradí reaktor, turbíny zůstanou. Palivem bude <b>uran</b>,
        který vyrábí uhelný důl od LVL 4.</div>
      <div class="mats">${needTxt(nu.need)}<span class="mt">${fmt(nu.cost)}</span></div>
      ${!nukeReady()&&S.lvl>=nu.reqLvl?`<div class="ss"><b class="no">Potřebuješ ${nu.cool} chladicí věže.</b></div>`:''}
      <button class="btn" id="nuke" ${ok?'':'disabled'}>Přestavět na jádro</button>`;
  }
  if (nuke && nb) {
    const ok = blockAllowed() && S.lvl >= nb.reqLvl;
    h += `<div class="now-line" style="margin-top:9px"><b>Reaktorový blok ${S.plant.blok+1}</b>
      <span>${powerMax()} → ${turbMw()+nb.mw} MW${S.lvl<nb.reqLvl?` · <b class="no">od LVL ${nb.reqLvl}</b>`:''}</span></div>
      <div class="mats">${needTxt(nb.need)}<span class="mt">${fmt(nb.cost)}</span>${
        nb.water?`<span class="mt ${waterFree()>=nb.water?'':'no'}">${icon('drop',C.sky,12)}${nb.water} m³ vody</span>`:''}</div>
      ${!blockAllowed()&&S.lvl>=nb.reqLvl?`<div class="ss"><b class="no">Potřebuješ ${nb.cool}. chladicí věž.</b></div>`:''}
      <button class="btn" id="blok" ${ok?'':'disabled'}>Postavit blok</button>`;
  }
  if (nc) {
    const ok = S.lvl >= nc.reqLvl;
    h += `<div class="now-line" style="margin-top:9px"><b>Chladicí věž ${cl+1}</b>
      <span>postaví se vedle areálu${ok?'':` · <b class="no">od LVL ${nc.reqLvl}</b>`}</span></div>
      <div class="mats">${needTxt(nc.need)}<span class="mt">${fmt(nc.cost)}</span>${
        nc.water?`<span class="mt ${waterFree()>=nc.water?'':'no'}">${icon('drop',C.sky,12)}${nc.water} m³ vody</span>`:''}</div>
      <button class="btn g" id="cool" ${ok?'':'disabled'}>Postavit chladicí věž</button>`;
  }
  return h;
}
function pumpHTML(id) {
  const st = S.plot[id];
  if (!st.done) {
    if (st.bEnd) { const cur = PUMP.ph[st.phase];
      return `<div class="st">Vodojem<span class="tag sky">staví se</span></div>
        ${stripHTML(PUMP.ph,st.phase)}<div class="now-line"><b>${cur.n}</b></div>
        ${progBar(st.bEnd, st.bDur||PUMP.dur)}`; }
    const cur = PUMP.ph[st.phase];
    return `<div class="st">Vodojem<span class="tag">fáze ${st.phase+1} / ${PUMP.ph.length}</span></div>
      ${st.phase===0?`<div class="ss">Dá vodu na vylepšení staveb i na chlazení elektrárny.
        Vstupní náklady <b>${fmt(PUMP.cost)}</b>, sám ubere <b>${PUMP.levels[0].mw} MW</b>.</div>`:''}
      ${stripHTML(PUMP.ph,st.phase)}
      <div class="now-line"><b>${cur.n}</b><span>${(PUMP.dur/1000)|0} s · +${cur.xp} XP</span></div>
      <div class="mats">${needTxt(cur.need)}${st.phase===0?`<span class="mt">${fmt(PUMP.cost)}</span>`:''}</div>
      ${st.phase===0&&powerFree()<PUMP.levels[0].mw?`<div class="ss"><b class="no">Chybí ${
        PUMP.levels[0].mw-powerFree()} MW.</b> Vodojem jede na proud.</div>`:''}
      <button class="btn" id="bd">${st.phase===0?'Zaplatit a postavit':'Postavit fázi'}</button>`;
  }
  const u = nextPumpLvl();
  let h = `<div class="st">Vodojem<span class="tag sky">LVL ${S.pump.lvl}</span></div>
    <div class="ss">Dává <b style="color:var(--sky)">${waterMax()} m³</b>, odběr sítě ${waterUse()} m³.
      Bere ${pumpPower()} MW z elektrárny.</div>
    ${capBar(waterUse(), Math.max(1,waterMax()), waterUse()>waterMax()?'var(--red)':'var(--sky)')}`;
  if (st.uEnd) { h += `<div class="now-line" style="margin-top:8px"><b>Zvětšení nádrže</b></div>
    ${progBar(st.uEnd,st.uDur||1)}`; return h; }
  if (u) { const lvOk = S.lvl >= u.reqLvl;
    h += `<div class="now-line" style="margin-top:9px"><b>Vodojem LVL ${S.pump.lvl+1}</b>
      <span>${waterMax()} → ${waterMax()-PUMP.levels[S.pump.lvl-1].water+u.water} m³ · proud ${
        PUMP.levels[S.pump.lvl-1].mw} → ${u.mw} MW${lvOk?'':` · <b class="no">od LVL ${u.reqLvl}</b>`}</span></div>
      <div class="mats">${needTxt(u.need)}<span class="mt">${fmt(u.cost)}</span></div>
      <button class="btn" id="pu" ${lvOk?'':'disabled'}>Zvětšit nádrž</button>`;
  } else h += `<div class="ss" style="margin-top:8px">Nádrž je na maximu. Další vodu přidají čerpací stanice.</div>`;
  return h;
}
function ironHTML(id) {
  const st = S.plot[id];
  if (!st.done) {
    if (st.bEnd) { const cur = IRON_STORE.ph[st.phase];
      return `<div class="st">Rudný sklad<span class="tag sky">staví se</span></div>
        ${stripHTML(IRON_STORE.ph,st.phase)}<div class="now-line"><b>${cur.n}</b></div>
        ${progBar(st.bEnd, st.bDur||IRON_STORE.dur)}`; }
    const cur = IRON_STORE.ph[st.phase];
    return `<div class="st">Rudný sklad<span class="tag">fáze ${st.phase+1} / ${IRON_STORE.ph.length}</span></div>
      ${st.phase===0?`<div class="ss">Ruda, roxory ani traverzy se do běžného skladu nevejdou —
        potřebují vlastní halu. Vstupní náklady <b>${fmt(IRON_STORE.cost)}</b>.</div>`:''}
      ${stripHTML(IRON_STORE.ph,st.phase)}
      <div class="now-line"><b>${cur.n}</b><span>${(IRON_STORE.dur/1000)|0} s · +${fmtN(cur.xp)} XP</span></div>
      <div class="mats">${needTxt(cur.need)}${st.phase===0?`<span class="mt">${fmt(IRON_STORE.cost)}</span>`:''}</div>
      <button class="btn" id="bd">${st.phase===0?'Zaplatit a postavit':'Postavit fázi'}</button>`;
  }
  const nx = nextIronLvl();
  let h = `<div class="st">Rudný sklad<span class="tag sky">LVL ${S.iron.lvl}</span></div>
    <div class="ss">Pojme <b>${ironCap()} ks</b> od rudy, roxorů i traverz.</div>
    ${IRON.map(r=>`<div class="rw"><div class="ric">${icon(r.ic,r.c,20)}</div>
      <div class="rt"><b>${r.l}</b><i>${getRes(r.k)} / ${ironCap()} ks</i>
      ${capBar(getRes(r.k),ironCap())}</div></div>`).join('')}`;
  if (st.uEnd) return h + `<div class="now-line" style="margin-top:8px"><b>Rozšíření haly</b></div>
    ${progBar(st.uEnd,st.uDur||1)}`;
  if (nx) { const lvOk = S.lvl >= nx.reqLvl;
    h += `<div class="now-line" style="margin-top:9px"><b>Rudný sklad LVL ${S.iron.lvl+1}</b>
      <span>${ironCap()} → ${nx.cap} ks${lvOk?'':` · <b class="no">od LVL ${nx.reqLvl}</b>`}</span></div>
      <div class="mats">${needTxt(nx.need)}<span class="mt">${fmt(nx.cost)}</span></div>
      <button class="btn" id="iu" ${lvOk?'':'disabled'}>Rozšířit halu</button>`;
  } else h += `<div class="ss" style="margin-top:8px">Hala je na maximální úrovni.</div>`;
  return h;
}
function portHTML(id) {
  const kind = PARC[id].port, P = PORT[kind], st = S.plot[id], B = P.build;
  if (!st.done) {
    if (st.bEnd) { const cur = B.ph[st.phase];
      return `<div class="st">${PARC[id].name}<span class="tag sky">staví se</span></div>
        ${stripHTML(B.ph,st.phase)}<div class="now-line"><b>${cur.n}</b></div>
        ${progBar(st.bEnd, st.bDur||B.dur)}`; }
    const cur = B.ph[st.phase];
    return `<div class="st">${PARC[id].name}<span class="tag">fáze ${st.phase+1} / ${B.ph.length}</span></div>
      ${st.phase===0?`<div class="ss">Odsud vypluje <b>${P.name.toLowerCase()}</b>.
        Vstupní náklady <b>${fmt(B.cost)}</b>.</div>`:''}
      ${stripHTML(B.ph,st.phase)}
      <div class="now-line"><b>${cur.n}</b><span>${(B.dur/1000)|0} s · +${fmtN(cur.xp)} XP</span></div>
      <div class="mats">${needTxt(cur.need)}${st.phase===0?`<span class="mt">${fmt(B.cost)}</span>`:''}</div>
      <button class="btn" id="bd">${st.phase===0?'Zaplatit a postavit':'Postavit fázi'}</button>`;
  }
  const v = voyage(kind);
  let h = `<div class="st">${P.name}${v?'<span class="tag sky">na moři</span>':'<span class="tag ok">v přístavu</span>'}</div>`;
  if (v) {
    h += `<div class="ss">${v.n} — vrátí se za ${Math.max(0,Math.ceil((v.end-Date.now())/60000))} min.</div>
      ${progBar(v.end, v.dur, 'voyfill')}
      ${Date.now()>=v.end?`<button class="btn go" id="voyget">Vyzvednout ${fmt(v.pay)}</button>`:''}`;
    return h;
  }
  h += `<div class="ss">${kind==='cargo'
    ? 'Nalož materiál a pošli loď na moře. Čím delší plavba, tím větší náklad i výdělek.'
    : 'Vyprav loď na výlet. Nepotřebuje žádný materiál — vydělá si sama.'}</div>`;
  P.tiers.forEach((t,i) => {
    const o = kind==='cargo' ? cargoOffer(i, i*7919+S.lvl) : cruiseOffer(i);
    if (!o) return;
    const can = !o.need || has(o.need);
    h += `<div class="rw col"><div class="rwtop">
        <div class="ric">${icon(kind==='cargo'?'beamI':'coin',kind==='cargo'?'#9CA3AA':C.amber,20)}</div>
        <div class="rt"><b>${t.n} <span class="tag">${Math.round(t.dur/60000)} min</span></b>
          <i>+${fmtN(o.xp)} XP</i></div>
        <div class="ra"><b class="pay">${fmt(o.pay)}</b></div></div>
      ${o.need?`<div class="mats">${needTxt(o.need)}</div>`:''}
      <div class="ordbtn"><button class="mini" data-voy="${kind}" data-t="${i}" ${
        can?'':'disabled'}>${can?P.label:'Chybí materiál'}</button></div></div>`;
  });
  return h;
}
function pumpStHTML(id) {
  const st = S.plot[id];
  if (!st.done) {
    if (st.bEnd) return `<div class="st">${PARC[id].name}<span class="tag sky">staví se</span></div>
      ${progBar(st.bEnd, st.bDur||PUMPST.dur)}`;
    return `<div class="st">${PARC[id].name}</div>
      <div class="ss">Přidá <b style="color:var(--sky)">${pstOf(id,'water')} m³</b> vody,
        ale ubere <b>${pstOf(id,'mw')} MW</b> proudu.</div>
      <div class="mats">${needTxt(pstNeed(id))}</div>
      ${powerFree()<pstOf(id,'mw')?`<div class="ss"><b class="no">Chybí ${
        pstOf(id,'mw')-powerFree()} MW.</b></div>`:''}
      <button class="btn" id="bd">Postavit</button>`;
  }
  return `<div class="st">${PARC[id].name}<span class="tag ok">hotovo</span></div>
    <div class="ss">Dodává ${pstOf(id,'water')} m³ vody a bere ${pstOf(id,'mw')} MW.</div>`;
}
function gridSheet() {
  const use=powerUse(), max=powerMax(), live=gridLive(), br=burnRate();
  const ren=renewMw(), pl=plantMw();
  opn(`<div class="st">Elektrická síť ${live?'<span class="tag ok">v provozu</span>'
      :'<span class="tag" style="color:var(--red);border-color:var(--red)">bez uhlí</span>'}</div>
    <div class="ss">${max>0&&use>=max?'<b class="no">Síť je na maximu.</b> Když potřebuješ výkon na novou stavbu, můžeš nějakou budovu dočasně <b>odpojit od sítě</b> — přestane vydělávat, ale uvolní své MW.<br>':''}${
      live?'Elektrárna hoří a napájí připojené budovy.'
      : max>0?'<b class="no">Došlo uhlí — budovy na proud nevydělávají.</b> Sesbírej uhlí v dole.'
      :'Zatím nemáš elektrárnu.'}</div>
    <div class="rw col"><div class="rwtop">
      <div class="ric">${icon('power',C.amber,20)}</div>
      <div class="rt"><b>Volný výkon ${max-use} MW</b>
        <i>vyrábíš ${max} MW, odebíráš ${use} MW — elektrárna i obnovitelné se sčítají</i></div></div>
      <div class="split">
        <i class="gr" style="flex:${Math.max(ren,0.001)}"><span>${ren} MW bez paliva</span></i>
        <i class="am" style="flex:${Math.max(pl,0.001)}"><span>${pl} MW z paliva</span></i>
        <b class="mk" style="left:${Math.min(100,use/Math.max(1,max)*100)}%"></b>
      </div>
      <div class="ss" style="margin:6px 0 0">Všechno je jeden společný výkon.
        Zelená část poteče, i když dojde palivo — v tu chvíli klesne strop na
        <b style="color:var(--leaf)">${ren} MW</b>${use>ren?` a budeš muset něco odpojit`:', což ti teď stačí'}.</div>
    </div>
    <div class="rw"><div class="ric">${icon(isNuke()?'uran':'coal',isNuke()?'#7FC24A':'#5A6066',20)}</div>
      <div class="rt"><b>Palivo — ${RL(fuelKey()).l.toLowerCase()}</b>
      <i>zásoba ${S.res[fuelKey()]} ks${br?` · spotřeba ${(60000/br).toFixed(1)} ks/min`:''}</i>
      <i class="nx">${br&&S.res[fuelKey()]?`vydrží ${Math.round(S.res[fuelKey()]*br/60000)} min`:'—'}</i></div></div>
    ${Object.keys(NODE_DEF).filter(id=>nodeMw(id)>0).map(id=>
      `<div class="rw"><div class="ric">${icon(RL(nodeDef(id).res).ic,RL(nodeDef(id).res).c,20)}</div>
        <div class="rt"><b>${nodeName(id)} <span class="tag sky">LVL ${S.nodes[id].lvl}</span></b>
        <i>odběr ${nodeMw(id)} MW</i></div></div>`).join('')}
    ${PIDS.filter(id=>{const D=defOf(id);return D&&D.draw&&S.plot[id].done;}).map(id=>{
      const D=defOf(id);
      return `<div class="rw"><div class="ric"><div class="sw" style="background:${styleOf(id).wall}"></div></div>
        <div class="rt"><b>${D.name} <span class="tag sky">LVL ${S.plot[id].hl}</span>${
          isOff(id)?'<span class="tag" style="color:var(--red);border-color:var(--red)">odpojeno</span>':''}</b>
        <i>odběr ${drawOf(id)} MW · nájem ${fmt(houseRent(id))}/min</i></div>
        <div class="ra"><button class="mini o" data-un="${id}">${isOff(id)?'Připojit':'Odpojit'}</button></div></div>`;}).join('')}
    <button class="btn g" data-close>Zavřít</button>`);
}

function bindDetail() {
  const q = id => $(id);
  dbody.querySelectorAll('[data-pk]').forEach(el => el.onclick = () => {
    pickSel[el.dataset.pid] = el.dataset.pk; pickVar[el.dataset.pid] = 0; renderDetail(); });
  dbody.querySelectorAll('[data-pv]').forEach(el => el.onclick = () => {
    pickVar[el.dataset.pid] = +el.dataset.pv; renderDetail(); });
  if (q('confirmPick')) q('confirmPick').onclick = () => {
    const id = q('confirmPick').dataset.pid;
    S.plot[id].key = pickSel[id]; S.plot[id].vr = pickVar[id]||0; save();
    toast(BUILDINGS[pickSel[id]].name+' — provedení '+BUILDINGS[pickSel[id]].vars[S.plot[id].vr].n.toLowerCase());
    renderDetail(); renderQuest(); };
  if (q('reselect')) q('reselect').onclick = () => { S.plot[MODE.id].key = null; renderDetail(); };
  if (q('buy'))  q('buy').onclick  = () => buyParcel(MODE.id);
  if (q('bd'))   q('bd').onclick   = () => startPhase(MODE.id);
  if (q('rent')) q('rent').onclick = () => { const st = S.plot[MODE.id], a = Math.floor(st.rent);
    if (a < 1) return; S.money += a; st.rent -= a; bump('earnedRent', a);
    toast('Nájem +'+fmt(a)); renderTop(); renderDetail(); save(); };
  if (q('su'))   q('su').onclick   = () => startSkladUp();
  if (q('hu'))   q('hu').onclick   = () => startHouseUp(MODE.id);
  if (q('goOrd')) q('goOrd').onclick = () => { closeParcel(); scrZakazky(); };
  if (q('unplug')) q('unplug').onclick = () => toggleGrid(MODE.id);
  if (q('fix')) q('fix').onclick = () => repair(q('fix').dataset.k);
  if (q('forceAuto')) q('forceAuto').onclick = () => { forceAutoRun(MODE.id); renderDetail(); };
  if (q('voyget')) q('voyget').onclick = () => { claimVoyage(PARC[MODE.id].port); renderDetail(); };
  dbody.querySelectorAll('[data-voy]').forEach(b => b.onclick = () => {
    startVoyage(b.dataset.voy, +b.dataset.t); renderDetail(); });
  if (q('pu'))   q('pu').onclick   = () => startPumpUp();
  if (q('iu'))   q('iu').onclick   = () => startIronUp();
  if (q('blok')) q('blok').onclick = () => startPlantUp('blok');
  if (q('nuke')) q('nuke').onclick = () => startPlantUp('nuke');
  if (q('turb')) q('turb').onclick = () => startPlantUp('turb');
  if (q('cool')) q('cool').onclick = () => startPlantUp('cool');
}

/* ─── panel stanice / závodu ─── */
function upgradeSheet(id) {
  const d = nodeDef(id);
  if (d.plat && !platOpen(d.plat)) {              // sem se ještě nedá dojet
    opn(`<div class="st">${d.base}<span class="tag sky">zamčeno</span></div>
      <div class="ss">Tahle část hor ještě není otevřená. Nejdřív musíš otevřít
        platformu, na které tahle stanice stojí.</div>
      <button class="btn g" data-close>Zavřít</button>`, 'lockst');
    return;
  }
  const n = S.nodes[id], u = nextStUp(id), R = RL(d.res);
  const mine = !noMine(id);
  const title = n.lvl ? nodeName(id) : (mine ? d.base : 'Staveniště — ' + stChain(id)[0].name);

  if (isBroken('n:'+id)) {
    opn(`<div class="st">${nodeName(id)}<span class="tag"
        style="color:var(--red);border-color:var(--red)">závada</span></div>
      ${faultBar('n:'+id, faultOf('n:'+id).n)}
      <button class="btn g" data-close>Zavřít</button>`, 'node'+id);
    const b = $('fix'); if (b) b.onclick = () => { repair('n:'+id); upgradeSheet(id); };
    return;
  }
  let h = `<div class="st">${title}
    ${n.lvl?`<span class="tag sky">LVL ${n.lvl}</span>`:'<span class="tag">nepostaveno</span>'}
    ${n.on&&mine&&nodePowered(id)?'<span class="tag run">těží</span>':''}
    ${nodeMw(id)&&!gridLive()?'<span class="tag" style="color:var(--red);border-color:var(--red)">bez proudu</span>':''}</div>`;
  if (nodeMw(id)) h += `<div class="ss">Odběr <b style="color:var(--amber)">${nodeMw(id)} MW</b>${
    gridLive()?'':' · <b class="no">síť stojí, provoz je zastavený</b>'}</div>`;

  if (mine) {
    h += `<div class="rw"><div class="ric">${icon(R.ic,R.c,20)}</div>
      <div class="rt"><b>${R.l}</b><i>${n.buf} / ${nodeCap(id)} ks · ${(nodeTick(id)/1000).toFixed(2)} s na kus</i>
      ${capBar(n.buf,nodeCap(id))}</div>
      <div class="ra"><button class="mini" id="ncol" ${n.buf<1?'disabled':''}>Sebrat</button></div></div>`;
  }
  if (nodeMakes(id).length) {
    const used = Object.values(n.make).reduce((a,b)=>a+b,0);
    h += `<div class="rw"><div class="ric">${icon(RL(nodeMakes(id)[0]).ic,RL(nodeMakes(id)[0]).c,20)}</div>
      <div class="rt"><b>Výroba</b><i>${nodeMakes(id).map(m=>RL(m).l.toLowerCase()).join(', ')}
        · fronta ${used} / ${nodeQueueMax(id)} · 1 kus za ${(makeDur(id)/1000).toFixed(1)} s</i></div>
      <div class="ra"><button class="mini o" id="nprod">Otevřít</button></div></div>`;
  } else if (!mine && !n.lvl) {
    h += `<div class="ss">Hutní závod nic netěží — <b>vyrábí z rudy</b>, kterou naveze železný důl.
      Postavíš ho po fázích jako každou jinou stavbu.</div>`;
  }

  if (n.uEnd) {
    h += `<div class="now-line" style="margin-top:8px"><b>${u.ph[n.ph].n}</b>
        <span>fáze ${n.ph+1} / 3</span></div>
      ${stripHTML(u.ph,n.ph)}${progBar(n.uEnd, n.uDur||u.dur, 'nfill')}`;
    opn(h + `<button class="btn g" data-close>Zavřít</button>`, 'node'+id);
    bindNode(id); return;
  }

  if (!u) {
    h += `<div class="ss" style="margin-top:8px">Nejvyšší úroveň — dál to nejde.</div>`;
  } else if (S.lvl < u.reqLvl) {
    h += `<div class="now-line" style="margin-top:9px"><b>${u.name}</b>
        <span><b class="no">od LVL ${u.reqLvl}</b></span></div>
      <div class="ss">${nextStepInfo(id,u)}</div>`;
  } else {
    const cur = u.ph[n.ph];
    const now = mine ? nodeTick(id) : 0;
    const nxt = mine ? Math.round(d.base_tick * u.mul * Math.pow(0.96, n.ph+1)) : 0;
    h += `<div class="now-line" style="margin-top:9px"><b>${n.lvl?nodeName(id)+' → ':''}${u.name}</b>
        <span>${(u.dur/1000)|0} s · +${fmtN(cur.xp)} XP</span></div>
      <div class="ss">${nextStepInfo(id,u)}</div>
      ${stripHTML(u.ph,n.ph)}
      <div class="now-line"><b>${cur.n}</b></div>
      <div class="mats">${needTxt(cur.need)}${n.ph===0?`<span class="mt">${fmt(u.cost)}</span>`:''}</div>
      ${mine?`<div class="ss">Těžba ${(now/1000).toFixed(2)} s → <b style="color:var(--leaf)">${(nxt/1000).toFixed(2)} s</b> na kus</div>`:''}
      <button class="btn" id="nu">${n.ph===0
        ? (n.lvl?`Zaplatit ${fmt(u.cost)} a začít`:`Zaplatit ${fmt(u.cost)} a postavit`)
        : 'Postavit fázi'}</button>`;
  }
  opn(h + `<button class="btn g" data-close>Zavřít</button>`, 'node'+id);
  bindNode(id);
}
function nextStepInfo(id, u) {
  const n = S.nodes[id];
  const newOut = u.makes.filter(m => nodeMakes(id).indexOf(m) < 0);
  const bits = [];
  if (newOut.length) bits.push(`<b style="color:var(--sky)">nově vyrábí ${
    newOut.map(m=>RL(m).l.toLowerCase()).join(' a ')}</b> (${newOut.map(m=>recipeTxt(m)).join(', ')})`);
  if (!noMine(id)) bits.push(`kapacita ${nodeCap(id)} → ${u.cap} ks`);
  if (u.queue) bits.push(`fronta výroby ${u.queue} kusů`);
  if ((u.mw||0) > nodeMw(id)) bits.push(`odběr ${nodeMw(id)} → ${u.mw} MW`);
  return bits.join(' · ');
}
function bindNode(id) {
  const q = i => $(i);
  if (q('nu'))    q('nu').onclick    = () => startNodePhase(id);
  if (q('ncol'))  q('ncol').onclick  = () => { collect(id); upgradeSheet(id); };
  if (q('nprod')) q('nprod').onclick = () => { cls(); scrVyroba(); };
}

/* ─── obrazovky ─── */
const swatch = c => `<div class="sw" style="background:${c}"></div>`;
function scrStavby() {
  const rows = PIDS.filter(visible).map(id => {
    const p = PARC[id], D = defOf(id), st = S.plot[id];
    const nm = isPlant(id) ? (isNuke()?'Jaderná elektrárna':'Elektrárna') : isPump(id) ? 'Vodojem'
      : isIronStore(id) ? 'Rudný sklad' : isPort(id) ? PORT[PARC[id].port].name
      : isPumpSt(id) ? PARC[id].name : (D ? D.name : 'Volná parcela');
    const col = isPlant(id) ? (isNuke()?'#7FC24A':C.concrete) : isPump(id) ? C.sky
      : isIronStore(id) ? '#8C6A5A' : isPort(id) ? '#3A4E5E'
      : isPumpSt(id) ? C.steel : (D ? styleOf(id).wall : C.dirt);
    let sub;
    if (!isOwned(id)) sub = (p.reqLvl&&S.lvl<p.reqLvl) ? `odemkne se na LVL ${p.reqLvl}` : `nekoupeno · ${fmt(p.cost)}`;
    else if (st.bEnd) sub = 'staví se…';
    else if (st.done && D && D.gen) sub = `${D.gen[Math.min(st.hl,D.gen.length)-1]} MW do sítě`;
    else if (st.done) sub = isPlant(id) ? `${powerMax()} MW`
      : isPump(id) ? `${waterMax()} m³`
      : isPort(id) ? (voyage(PARC[id].port) ? 'na moři' : 'v přístavu')
      : isIronStore(id) ? `${ironCap()} ks železa`
      : isPumpSt(id) ? `+${pstOf(id,'water')} m³`
      : (D.store ? `${cap()} ks na surovinu`
      : D.park ? `+${Math.round(D.boost[Math.min(st.hl,D.boost.length)-1]*100)} % nájmu vilám`
      : `nájem ${fmt(houseRent(id))}/min`);
    else if (D || specialDef(id)) sub = isPumpSt(id) ? 'nepostaveno'
      : `fáze ${st.phase} / ${(specialDef(id)||D).ph.length}`;
    else sub = 'čeká na výběr stavby';
    return `<div class="rw ${isOwned(id)?'':'lock'}"><div class="ric">${swatch(col)}</div>
      <div class="rt"><b>${nm} ${st.done?'<span class="tag ok">hotovo</span>':''}</b>
      <i>${PLAT(p.plat).name} · ${sub}</i></div>
      <div class="ra"><button class="mini" data-p="${id}">Otevřít</button></div></div>`;
  }).join('');
  const fx = Object.keys(S.faults);
  opn(`<div class="st">Stavby${fx.length?`<span class="tag"
      style="color:var(--red);border-color:var(--red)">${fx.length} závad${fx.length>1?'y':'a'}</span>`:''}</div>
    ${fx.length?`<div class="ss">Rozbité stavby nefungují. Oprav je a poběží dál.</div>
      ${fx.map(k=>{const id=k.slice(2), isN=k[0]==='n';
        const nm = isN?nodeName(id):(isPlant(id)?'Elektrárna':isPump(id)?'Vodojem'
          :isIronStore(id)?'Rudný sklad':(defOf(id)?defOf(id).name:PARC[id].name));
        return `<div class="rw brk"><div class="ric">${icon('alert',C.red,20)}</div>
          <div class="rt"><b>${nm}</b><i>${S.faults[k].n}</i></div>
          <div class="ra">${S.faults[k].fix?'<span class="tag sky">jedou</span>'
            :`<button class="mini" data-fix="${k}" ${
              S.money<repairCost(k)?'disabled':''}>${fmt(repairCost(k))}</button>`}</div></div>`;}).join('')}
      <div class="st sub">Vše ostatní</div>`:''}
    <div class="ss">Ťukni na řádek — otevře se ta parcela.</div>${rows}
    <div class="st sub">Těžební stanice</div>
    ${Object.keys(NODE_DEF).filter(id=>!nodeDef(id).plat||platOpen(nodeDef(id).plat)).map(id=>{
      const n = S.nodes[id], d = nodeDef(id), R = RL(d.res), u = nextStUp(id);
      return `<div class="rw"><div class="ric">${icon(R.ic,R.c,20)}</div>
        <div class="rt"><b>${nodeName(id)} ${n.lvl?`<span class="tag sky">LVL ${n.lvl}</span>`:''}
          ${n.on&&!noMine(id)?'<span class="tag run">těží</span>':''}</b>
        <i>${noMine(id)?(nodeMakes(id).length?'vyrábí '+nodeMakes(id).map(m=>RL(m).l.toLowerCase()).join(', '):'zatím nepostaveno')
          :`${R.l} · ${n.buf} / ${nodeCap(id)} ks · ${(nodeTick(id)/1000).toFixed(2)} s/ks`}</i>
        ${noMine(id)?'':capBar(n.buf,nodeCap(id))}${u?`<i class="nx">↑ ${u.name} · od LVL ${u.reqLvl}</i>`:''}</div>
        <div class="ra"><button class="mini ${canUpgradeNode(id)?'':'o'}" data-u="${id}">${
          n.ph?`${n.ph}/3`:n.lvl?'Vylepšit':'Postavit'}</button></div></div>`;}).join('')}
    <button class="btn g" data-close>Zavřít</button>`, 'stavby');
  bindRows();
  sbody.querySelectorAll('[data-fix]').forEach(b=>b.onclick=()=>{ repair(b.dataset.fix); scrStavby(); });
}
function bindRows() {
  sbody.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{cls();openParcel(b.dataset.p);});
  sbody.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>upgradeSheet(b.dataset.u));
  sbody.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>platformSheet(+b.dataset.x));
}

function scrVyroba() {
  const facts = Object.keys(NODE_DEF).filter(id => nodeMakes(id).length > 0);
  if (!facts.length) {
    opn(`<div class="st">Výroba</div>
      <div class="ss">Zpracované materiály — prkna, štěrk, cihly a balíky — potřebuješ na lepší stavby
      a prodávají se několikanásobně dráž než surovina. Vyrábět je začnou těžební stanice,
      až je <b>vylepšíš na LVL 2</b>.</div>
      ${Object.keys(NODE_DEF).filter(id=>['saw','quarry','field','pit'].indexOf(nodeDef(id).kind)>=0).map(id=>{
        const n=S.nodes[id], c=stChain(id)[1], O=RL(c.makes[0]);
        const can = n.lvl===1 && S.lvl>=c.reqLvl;
        return `<div class="rw ${can?'':'lock'}"><div class="ric">${icon(O.ic,O.c,20)}</div>
          <div class="rt"><b>${c.name} → ${O.l}</b>
          <i>${recipeTxt(c.makes[0])} → 1 ks · prodej ${fmt(O.price)}/ks</i>
          <i class="nx">${n.lvl<1?'nejdřív vylepši stanici na LVL 1':can?`k dispozici · ${fmt(c.cost)}`:`od LVL ${c.reqLvl}`}</i></div>
          <div class="ra">${can?`<button class="mini" data-u="${id}">Vylepšit</button>`:''}</div></div>`;}).join('')}
      <button class="btn g" data-close>Zavřít</button>`, 'vyroba');
    bindRows(); return;
  }
  opn(`<div class="st">Výroba</div>
    <div class="ss">Fabriky mění suroviny na stavební materiál.
      Automat jde zapnout zvlášť pro každý výrobek — pak si frontu doplňuje sám.</div>
    ${facts.map(id=>{
      const n=S.nodes[id], d=nodeDef(id), dur=makeDur(id), qmax=nodeQueueMax(id);
      const used = Object.values(n.make).reduce((a,b)=>a+b,0);
      return `<div class="rw col"><div class="rwtop">
        <div class="ric">${icon(RL(d.res).ic,RL(d.res).c,20)}</div>
        <div class="rt"><b>${nodeName(id)} <span class="tag sky">LVL ${n.lvl}</span></b>
          <i>1 kus za ${(dur/1000).toFixed(1)} s · fronta ${used} / ${qmax} (společná)</i>
          ${capBar(used,qmax,'var(--sky)')}</div>
        <div class="ra"><button class="mini ${nodeMakes(id).every(o=>autoOn(id,o))?'':'o'}"
          data-auto="${id}">Automat vše</button></div></div>
        ${nodeMakes(id).map(out=>{
          const O=RL(out), q=n.make[out]||0;
          const canN = canMake(out), room = qmax-used;
          const prog = q>0 ? Math.max(0,Math.min(1,1-((n.mEnd[out]||0)-Date.now())/dur)) : 0;
          const au = autoOn(id,out);
          return `<div class="mkrow">
            <div class="mkhead">${icon(O.ic,O.c,16)}<b>${O.l}</b>
              <span>${recipeTxt(out)} → 1 ks</span>
              <span class="mkq">${q}× <s>/ ${qmax}</s></span></div>
            <div class="pbar sm"><i style="width:${prog*100}%"></i></div>
            <div class="mkbtn">
              <button class="mini ${au?'':'o'}" data-au1="${id}" data-o="${out}">${
                au?'Automat ✓':'Automat'}</button>
              <button class="mini o" data-mk="${id}" data-o="${out}" data-a="5" ${canN<5||room<5?'disabled':''}>+5</button>
              <button class="mini" data-mk="${id}" data-o="${out}" data-a="max" ${canN<1||room<1?'disabled':''}>+${Math.min(canN,room)}</button>
            </div></div>`;}).join('')}
      </div>`;}).join('')}
    <button class="btn g" data-close>Zavřít</button>`, 'vyroba');
  sbody.querySelectorAll('[data-auto]').forEach(b=>b.onclick=()=>{
    const id = b.dataset.auto, n = S.nodes[id];
    const all = nodeMakes(id).every(o=>autoOn(id,o));
    n.autoMake = !all; n.autoOut = {};
    nodeMakes(id).forEach(o => n.autoOut[o] = !all);
    toast(!all?'Automat zapnutý na všechno':'Automat vypnutý'); save(); scrVyroba(); });
  sbody.querySelectorAll('[data-au1]').forEach(b=>b.onclick=()=>{
    const id = b.dataset.au1, out = b.dataset.o, n = S.nodes[id];
    if (!n.autoOut) n.autoOut = {};
    n.autoOut[out] = !autoOn(id,out);
    toast(`${RL(out).l} — automat ${n.autoOut[out]?'zapnutý':'vypnutý'}`); save(); scrVyroba(); });
  sbody.querySelectorAll('[data-mk]').forEach(b=>b.onclick=()=>{
    enqueue(b.dataset.mk, b.dataset.o, b.dataset.a==='max'?9999:5); scrVyroba(); });
}

function scrObchodMtn() {
  /* stejný způsob prodeje jako ve městě — jen horské suroviny jdou koupit
     teprve poté, co je hráč umí sám vytěžit nebo vyrobit */
  const list = [...RES, ...MAT, ...HIGH, ...MTN.filter(r => mtnBuyable(r.k))];
  const locked = MTN.filter(r => !mtnBuyable(r.k));
  opn(`<div class="st">Obchod v horách</div>
    <div class="ss">Ceny jsou stejné jako ve městě, jen horské suroviny stojí víc —
      jsou vzácnější.</div>
    <div class="sellhead"><span>Surovina</span><span>Prodat · Koupit</span></div>
    ${list.map(r => { const buy = mtnPrice(r.k), c = capOf(r.k);
      return `<div class="rw"><div class="ric">${icon(r.ic,r.c,20)}</div>
        <div class="rt"><b>${r.l}</b><i>${getRes(r.k)} / ${c} ks</i></div>
        <div class="ra sellb">
          <button class="mini o" data-sell="${r.k}" ${getRes(r.k)<10?'disabled':''}>${fmt(r.price*10)}</button>
          <button class="mini" data-buy="${r.k}" ${
            S.money<buy*10||getRes(r.k)+10>c?'disabled':''}>${fmt(buy*10)}</button>
        </div></div>`; }).join('')}
    ${locked.length ? `<div class="ss" style="margin-top:8px">Až je budeš umět těžit:
      ${locked.map(r=>r.l.toLowerCase()).join(', ')}.</div>` : ''}
    <button class="btn g" data-close>Zavřít</button>`, 'obchodM');
  bindShop();
}
function scrObchod() {
  const showIron = ironBuilt() || S.nodes.ruda.lvl>0 || S.nodes.hut.lvl>0
    || IRON.some(r=>getRes(r.k)>0);
  if (inMtn()) return scrObchodMtn();
  const list = ALL.filter(r => r.tier===0 || (r.tier===1&&anyFactory())
    || (r.tier===2 && (getRes(r.k)>0 || Object.keys(NODE_DEF).some(i=>S.nodes[i].lvl>=4)))
    || (r.tier===3 && showIron));
  opn(`<div class="st">Obchod</div>
    <div class="ss">Prodávej přebytky, dokup, co ti chybí. Nákup je dražší než výkup —
      pohodlí za peníze.</div>
    <div class="sellhead"><span>Surovina</span><span>Prodat · Koupit</span></div>
    ${list.map(r=>{
      const buy = inMtn() ? mtnPrice(r.k) : Math.round(r.price*BUY_MUL);
      return `<div class="rw"><div class="ric">${icon(r.ic,r.c,20)}</div>
        <div class="rt"><b>${r.l} <span class="tag">${fmt(r.price)} / ${fmt(buy)}</span></b>
        <i>${getRes(r.k)} / ${capOf(r.k)} ks</i>${capBar(getRes(r.k),Math.max(1,capOf(r.k)))}</div>
        <div class="ra">
          <button class="mini o" data-sell="${r.k}" data-a="10" ${getRes(r.k)<10?'disabled':''}>−10</button>
          <button class="mini o" data-sell="${r.k}" data-a="all" ${getRes(r.k)<1?'disabled':''}>vše</button>
          <button class="mini" data-buy="${r.k}" data-a="10" ${
            S.money<buy*10||getRes(r.k)+10>capOf(r.k)?'disabled':''}>+10</button>
        </div></div>`;}).join('')}
    <button class="btn g" data-close>Zavřít</button>`, 'obchod');
  bindShop();
}
function bindShop() {
  sbody.querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>{
    const k=b.dataset.sell, r=RL(k), a=b.dataset.a==='all'?getRes(k):Math.min(10,getRes(k));
    if (a<1) return; setRes(k, getRes(k)-a); S.money+=a*r.price; bump('sold', a);
    toast(`Prodáno ${a}× ${r.l.toLowerCase()} za ${fmt(a*r.price)}`);
    renderTop(); renderRes(); scrObchod(); save(); });
  sbody.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{
    const k=b.dataset.buy, r=RL(k), price=Math.round(r.price*BUY_MUL);
    const a=Math.min(10, capOf(k)-getRes(k), Math.floor(S.money/price));
    if (a<1) { toast('Nemáš peníze nebo místo ve skladu'); return; }
    setRes(k, getRes(k)+a); S.money-=a*price; bump('bought', a);
    toast(`Koupeno ${a}× ${r.l.toLowerCase()} za ${fmt(a*price)}`);
    renderTop(); renderRes(); scrObchod(); save(); });
}

function scrRozvoj() {
  const UL = UNLOCKS;
  const nxt = UL.find(u => u.lv > S.lvl);
  const rows = [];
  PIDS.filter(visible).forEach(id => {
    const p = PARC[id], D = defOf(id), st = S.plot[id];
    if (!isOwned(id)) { rows.push({ ic:swatch(C.dirt), n:p.name, lv:'—',
      s:(p.reqLvl&&S.lvl<p.reqLvl)?`odemkne se na LVL ${p.reqLvl}`:`nekoupeno · ${fmt(p.cost)}`,
      btn:canBuy(id)?['Otevřít','p',id]:null }); return; }
    if (isPort(id)) { const k = PARC[id].port, v = voyage(k);
      rows.push({ ic:swatch('#3A4E5E'), n:PORT[k].name,
        lv: st.done?(v?'na moři':'v přístavu'):'staví se',
        s: st.done?(v?`${v.n} · ${Math.max(0,Math.ceil((v.end-Date.now())/60000))} min`:'čeká na náklad')
          :`fáze ${st.phase} / ${PORT[k].build.ph.length}`,
        btn:['Otevřít','p',id] }); return; }
    if (isIronStore(id)) { rows.push({ ic:swatch('#8C6A5A'), n:'Rudný sklad',
      lv: st.done?`LVL ${S.iron.lvl}`:'staví se',
      s: st.done?`${ironCap()} ks rudy, roxorů i traverz`:`fáze ${st.phase} / ${IRON_STORE.ph.length}`,
      next: st.done&&nextIronLvl()?`LVL ${S.iron.lvl+1} · od LVL ${nextIronLvl().reqLvl} · ${fmt(nextIronLvl().cost)}`:null,
      btn:['Otevřít','p',id] }); return; }
    if (isPump(id)) { rows.push({ ic:swatch(C.sky), n:'Vodojem',
      lv: st.done?`LVL ${S.pump.lvl}`:'staví se',
      s: st.done?`${waterMax()} m³ · odběr ${waterUse()} m³`:`fáze ${st.phase} / 6`,
      next: st.done&&nextPumpLvl()?`Vodojem LVL ${S.pump.lvl+1} · od LVL ${nextPumpLvl().reqLvl}`:null,
      btn:['Otevřít','p',id] }); return; }
    if (isPumpSt(id)) { rows.push({ ic:swatch(C.steel), n:PARC[id].name,
      lv: st.done?'hotovo':'—',
      s: st.done?`+${pstOf(id,'water')} m³ · −${pstOf(id,'mw')} MW`:'nepostaveno',
      btn:['Otevřít','p',id] }); return; }
    if (isPlant(id)) {
      const nx = !st.done ? null
        : isNuke() ? (nextBlock() ? `Blok ${S.plant.blok+1} · od LVL ${nextBlock().reqLvl}` : null)
        : nextTurbine() ? `Turbína ${S.plant.turb+1} · od LVL ${nextTurbine().reqLvl}`
        : `${PLANT.nuclear.label} · od LVL ${PLANT.nuclear.reqLvl}`;
      rows.push({ ic:swatch(isNuke()?'#7FC24A':C.concrete),
        n: isNuke()?'Jaderná elektrárna':'Elektrárna',
        lv: st.done?(isNuke()?`${S.plant.blok}. blok / ${S.plant.cool} V`:`${S.plant.turb} T / ${S.plant.cool} V`):'staví se',
        s: st.done?`${powerMax()} MW · odběr ${powerUse()} MW`:`fáze ${st.phase} / 6`,
        next: nx, btn:['Otevřít','p',id] }); return; }
    if (!D) { rows.push({ ic:swatch(C.dirt), n:p.name, lv:'—', s:'čeká na výběr stavby',
      btn:['Otevřít','p',id] }); return; }
    const up = D.store ? SKLAD_UP[S.skladLvl+1] : nextHouseUp(id);
    rows.push({ ic:swatch(styleOf(id).wall), n:D.name,
      lv: st.done?`LVL ${D.store?S.skladLvl:st.hl}`:`fáze ${st.phase}/${D.ph.length}`,
      s: st.done && st.off ? 'odpojeno od sítě'
        : st.done && D.city ? `+${Math.round(D.city[Math.min(st.hl,D.city.length)-1]*100)} % nájmu městu`
        : st.done && D.gen ? `${D.gen[Math.min(st.hl,D.gen.length)-1]} MW do sítě`
        : st.done ? (D.store?`${cap()} ks na surovinu`
        : D.park?`+${Math.round(D.boost[Math.min(st.hl,D.boost.length)-1]*100)} % nájmu vilám`
        : `nájem ${fmt(houseRent(id))}/min`) : PLAT(p.plat).name,
      next: st.done&&up ? `${up.label||('Sklad LVL '+(S.skladLvl+1))} · od LVL ${up.reqLvl} · ${fmt(up.cost)}` : null,
      btn:['Otevřít','p',id] });
  });
  Object.keys(NODE_DEF).filter(id=>!nodeDef(id).plat||platOpen(nodeDef(id).plat)).forEach(id => {
    const n=S.nodes[id], d=nodeDef(id), u=nextStUp(id);
    rows.push({ ic:icon(RL(d.res).ic,RL(d.res).c,20), n:nodeName(id),
      lv:n.lvl?`LVL ${n.lvl}`:'základ',
      s: noMine(id) ? (nodeMakes(id).length?`vyrábí ${nodeMakes(id).map(m=>RL(m).l.toLowerCase()).join(', ')}`:'nepostaveno')
        : `${RL(d.res).l.toLowerCase()} · ${nodeCap(id)} ks · ${(nodeTick(id)/1000).toFixed(2)} s/ks`
        + (nodeMakes(id).length?` · vyrábí ${nodeMakes(id).map(m=>RL(m).l.toLowerCase()).join(', ')}`:''),
      next: u?`${u.name} · od LVL ${u.reqLvl} · ${fmt(u.cost)}`:null,
      btn: [n.lvl?'Vylepšit':'Postavit','u',id] });
  });
  PLATFORMS.forEach(pl => { if (pl.id===0 || platOpen(pl.id)) return;
    rows.push({ ic:swatch(C.dirt), n:pl.name, lv:'zamčeno', s:'další část mapy',
      next:`otevře se zdarma na LVL ${pl.reqLvl}`, btn:['Detail','x',''+pl.id] }); });

  opn(`<div class="st">Rozvoj</div>
    <div class="ss">Co máš, na jaké je to úrovni a kdy to půjde vylepšit.</div>
    ${rows.map(r=>`<div class="rw"><div class="ric">${r.ic}</div>
      <div class="rt"><b>${r.n} <span class="tag ${String(r.lv).indexOf('LVL')===0?'sky':''}">${r.lv}</span></b>
        <i>${r.s}</i>${r.next?`<i class="nx">↑ ${r.next}</i>`:''}</div>
      <div class="ra">${r.btn?`<button class="mini" data-${r.btn[1]}="${r.btn[2]}">${r.btn[0]}</button>`:''}</div></div>`).join('')}
    <div class="st sub">Co se kdy odemkne</div>
    ${nxt?`<div class="ss">Do LVL ${nxt.lv} zbývá ${fmtN(Math.max(0,LVL[nxt.lv-1]-S.xp))} XP.</div>`
      :`<div class="ss">Všechno je odemčené.</div>`}
    <div class="tl">${UL.map(u=>{
      const done=S.lvl>=u.lv, now=!done&&nxt&&u.lv===nxt.lv;
      return `<div class="tli ${done?'done':now?'now':''}"><div class="dot">${done?'✓':''}</div>
        <div class="lv">LVL ${u.lv}</div><div class="un">${u.t}</div><div class="xr">${u.d}</div></div>`;}).join('')}</div>
    <button class="btn g" data-close>Zavřít</button>`, 'rozvoj');
  bindRows();
}

/* ─── zakázky ─── */
const tierCol = t => t==='fast'?C.leaf2 : t==='mid'?C.amber : C.sky;
function orderCard(o, i) {
  const can = has(o.need), full = S.active.length >= orderSlots();
  return `<div class="rw col ord ${o.tier}">
    <div class="rwtop">
      <div class="ric" style="border-color:${tierCol(o.tier)}">
        <div class="sw" style="background:${tierCol(o.tier)}"></div></div>
      <div class="rt"><b>${o.name} zakázka <span class="tag">${
        o.dur<60000?`${(o.dur/1000)|0} s`:`${Math.round(o.dur/60000)} min`}</span></b>
        <i>${o.client}</i></div>
      <div class="ra"><b class="pay">${fmt(o.pay)}</b></div>
    </div>
    <div class="mats">${needTxt(o.need)}</div>
    <div class="ordbtn">
      <button class="mini o" data-roll="${i}" ${rerollLeft()>0?'':'disabled'}>Jiná</button>
      <button class="mini" data-take="${i}" ${can&&!full?'':'disabled'}>${
        full?'Máš plno':can?'Přijmout':'Chybí materiál'}</button>
    </div></div>`;
}
function activeCard(a, i) {
  const left = Math.max(0, a.end-Date.now()), done = left <= 0;
  return `<div class="rw col ord ${a.tier}">
    <div class="rwtop">
      <div class="ric" style="border-color:${tierCol(a.tier)}">
        <div class="sw" style="background:${tierCol(a.tier)}"></div></div>
      <div class="rt"><b>${a.name} zakázka ${done?'<span class="tag ok">hotovo</span>':''}</b>
        <i>${a.client} · ${Object.entries(a.need).map(([k,v])=>`${v}× ${RL(k).l.toLowerCase()}`).join(' · ')}</i></div>
      <div class="ra"><b class="pay">${fmt(a.pay)}</b></div>
    </div>
    ${done ? `<button class="btn go" data-claim="${i}">Vyzvednout ${fmt(a.pay)} a ${fmtN(a.xp)} XP</button>`
      : `<div class="pbar sm"><i class="ofill" data-end="${a.end}" data-dur="${a.dur}"
           style="width:${(1-left/a.dur)*100}%"></i></div>`}
  </div>`;
}
const ordersDone = () => S.active.filter(a => Date.now() >= a.end).length;
function scrZakazky() {
  if (!hasOffice()) {
    opn(`<div class="st">Zakázky</div>
      <div class="ss">Lidé kolem shánějí materiál a zaplatí za něj <b>mnohem líp než obchod</b>.
      Abys mohl zakázky brát, potřebuješ <b>Stavební dvůr</b> — postavíš ho na parcele 4 od LVL 8.</div>
      <div class="bli"><em>Rychlá</em><span>malá dodávka, hotovo do minuty</span></div>
      <div class="bli"><em>Střední</em><span>víc materiálu, čtyři minuty</span></div>
      <div class="bli"><em>Velká</em><span>velká dodávka, čtvrt hodiny — a nejvyšší odměna</span></div>
      <div class="ss" style="margin-top:8px">Materiál se odečte hned při přijetí. Zakázka pak běží
      sama, i když hru zavřeš.</div>
      <button class="btn g" data-close>Zavřít</button>`, 'zakazky');
    return;
  }
  refreshOrders();
  const rl = rerollLeft(), ri = rerollIn();
  opn(`<div class="st">Zakázky <span class="tag">${S.active.length} / ${orderSlots()}</span>
      <span class="tag ${rl?'ok':''}">výměny ${rl} / ${REROLL_MAX}</span></div>
    <div class="ss">Materiál odevzdáš hned, peníze dostaneš po uplynutí času.
      Zakázka běží, i když hru zavřeš. <b>Lodě se do limitu nepočítají.</b>${rl<REROLL_MAX
        ? ` Další výměna za ${Math.ceil(ri/60000)} min.` : ''}</div>
    ${['cargo','cruise'].filter(portBuilt).map(k=>{
      const v = voyage(k), P = PORT[k], id = portId(k);
      return `<div class="rw"><div class="ric">${icon(k==='cargo'?'beamI':'coin',
          k==='cargo'?'#9CA3AA':C.amber,20)}</div>
        <div class="rt"><b>${P.name} ${v?(Date.now()>=v.end
            ?'<span class="tag ok">připlula</span>':'<span class="tag sky">na moři</span>')
          :'<span class="tag">v přístavu</span>'}</b>
        <i>${v?`${v.n} · ${Date.now()>=v.end?'čeká na vyzvednutí':Math.ceil((v.end-Date.now())/60000)+' min'}`
          :'čeká na náklad'}</i>
        ${v?`<div class="pbar sm"><i class="vfill" data-k="${k}" style="width:${
          Math.max(0,Math.min(100,(1-(v.end-Date.now())/v.dur)*100))}%"></i></div>`:''}</div>
        <div class="ra"><button class="mini" data-p="${id}">Otevřít</button></div></div>`;}).join('')}
    ${ordersDone() ? `<button class="btn go" id="claimAll">Vyzvednout vše (${ordersDone()})</button>` : ''}
    ${S.active.length ? `<div class="st sub">Rozpracované</div>${S.active.map(activeCard).join('')}` : ''}
    <div class="st sub">Nabídka</div>
    ${S.orders.map(orderCard).join('')}
    <button class="btn g" data-close>Zavřít</button>`, 'zakazky');
  sbody.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{cls();openParcel(b.dataset.p);});
  const ca = $('claimAll'); if (ca) ca.onclick = () => { claimAllDone(); scrZakazky(); };
  sbody.querySelectorAll('[data-take]').forEach(b=>b.onclick=()=>{ takeOrder(+b.dataset.take); scrZakazky(); });
  sbody.querySelectorAll('[data-roll]').forEach(b=>b.onclick=()=>{
    if (!rerollOrder(+b.dataset.roll)) { toast('Výměny došly — další za '+Math.ceil(rerollIn()/60000)+' min'); return; }
    save(); scrZakazky(); });
  sbody.querySelectorAll('[data-claim]').forEach(b=>b.onclick=()=>{ claimOrder(+b.dataset.claim); scrZakazky(); });
}

const PLAT_INFO = {
  1:{ teaser:'Další část mapy. Co v ní bude, uvidíš, až se otevře.',
      desc:'Průmyslová zóna. Otevřeš tu <b>uhelný důl</b> a postavíš <b>elektrárnu</b>, která dá proud celému městu.',
      lines:[['Důl','těží uhlí, později z něj vyrábí i uran'],
             ['Elektrárna','turbíny, chladicí věže a nakonec přestavba na jádro']] },
  2:{ teaser:'Další část mapy. Co v ní bude, uvidíš, až se otevře.',
      desc:'Sídliště. Šest parcel pro <b>činžáky</b> — vysoký nájem, ale potřebují proud.',
      lines:[['Činžák','odběr 20 MW, nájem '+fmt(BUILDINGS.cinzak.rent)+'/min'],
             ['Provedení','cihlový, panelový nebo omítaný']] },
  3:{ teaser:'Další část mapy. Co v ní bude, uvidíš, až se otevře.',
      desc:'Předměstí. Velké <b>vily</b> a <b>parky</b>, které zvednou nájem všem vilám kolem.',
      lines:[['Vila','3 × 3 pole, odběr 45 MW, nájem '+fmt(BUILDINGS.vila.rent)+'/min'],
             ['Park','zvedne nájem vilám o 15 až 50 %'],
             ['Materiál','trámy, dlažba, obklady a izolace z kombinátů']] },
  5:{ teaser:'Další část mapy. Co v ní bude, uvidíš, až se otevře.',
      desc:'Vodárna. <b>Vodojem</b> dodá vodu, kterou potřebuješ na vylepšení vil, činžáků a obchoďáku.',
      lines:[['Vodojem','150 m³ na začátek, dá se zvětšit na 600'],
             ['Pozor','sám jede na proud — ubere 40 MW elektrárně'],
             ['Čerpací stanice','každá přidá 120 m³ navíc']] },
  7:{ teaser:'Další část mapy. Co v ní bude, uvidíš, až se otevře.',
      desc:'Železárny. <b>Železný důl</b> těží rudu, <b>hutní závod</b> z ní dělá roxory a později traverzy.',
      lines:[['Ruda','základ pro všechnu ocel'],
             ['Roxory','výztuž do betonu · 3 rudy za kus'],
             ['Traverzy','nosníky pro mrakodrapy · 9 rud za kus']] },
  8:{ teaser:'Další část mapy. Co v ní bude, uvidíš, až se otevře.',
      desc:'Lunapark. Kolotoče, horská dráha a aquapark — nejzábavnější a nejžravější stavby ve hře.',
      lines:[['Atrakce','nájem od '+fmt(BUILDINGS.kolotoc.rent)+' do '+fmt(BUILDINGS.aquapark.rent)+'/min'],
             ['Proud','horská dráha 180 MW, aquapark 220 MW'],
             ['Voda','vodní atrakce spolykají i 260 m³']] },
  11:{ teaser:'Další část mapy. Co v ní bude, uvidíš, až se otevře.',
      desc:'Staré město. Radnice, kostel a muzeum <b>zvednou nájem všem stavbám ve městě</b> — i těm, které máš dávno postavené.',
      lines:[['Nic nevydělá','historické stavby nemají nájem — jen zvedají cizí'],
             ['Radnice','+7 %, po vylepšení až +18 %'],
             ['Kostel','+5 %, až +14 %'],
             ['Muzeum','+8 %, až +21 %'],
             ['Měšťanské domy','+4 % za kus, dva na náměstí'],
             ['Dohromady','až +75 % nájmu v celém městě']] },
  13:{ teaser:'Další část mapy. Co v ní bude, uvidíš, až se otevře.',
      desc:'Nádraží. Odsud povede cesta <b>za hranice města</b> — do hor.',
      lines:[['Hlavní nádraží','šest fází, největší stavba ve městě'],
             ['Nájem',fmt(BUILDINGS.nadrazi.rent)+'/min z nádražní haly'],
             ['Až bude stát','objeví se tlačítko pro cestu do nové krajiny']] },
  14:{ teaser:'Další část mapy. Co v ní bude, uvidíš, až se otevře.',
      desc:'Řídicí centrum. Odsud se město začne <b>obsluhovat samo</b>.',
      lines:[['Dispečink těžby','sveze suroviny ze stanic za tebe'],
             ['Správcovská firma','vybere nájem ze všech budov'],
             ['Údržbářská četa','opraví poruchy sama, ale za příplatek'],
             ['Proč','abys mohl odejít do hor a město běželo dál']] },
  12:{ teaser:'Další část mapy. Co v ní bude, uvidíš, až se otevře.',
      desc:'Přístav u moře, kam ústí řeka. Kotví tu <b>nákladní</b> a <b>výletní loď</b>.',
      lines:[['Nákladní loď','naložíš materiál, vypluje na 30 až 90 minut a vrátí se s balíkem peněz'],
             ['Výletní loď','nepotřebuje nic, vydělá míň, ale je zpátky za 20 až 60 minut'],
             ['Plavba běží','i když hru zavřeš']] },
  20:{ teaser:'Za hřebenem. Dostaneš se tam, až postavíš nádraží.',
      desc:'Koncová stanice. Sem přijíždí vlak z města — jediné spojení s civilizací.',
      lines:[['Nádražní sklad','naložíš v městě, složíš tady'],
             ['Horský sklad','žula a spol. se do městských skladů nevejdou'],
             ['Pozor','hory mají vlastní síť, proud z města sem nedosáhne']] },
  21:{ teaser:'Za hřebenem.', desc:'Žulový lom. První horská surovina — žula a z ní kvádry.',
      lines:[['Žula','základ všeho, co v horách postavíš'],
             ['Kvádry','3 žuly za kus, na základy chat']] },
  22:{ teaser:'Za hřebenem.', desc:'Břidlicová stěna. Tabule na střechy.',
      lines:[['Břidlice','láme se ze stěny'],['Tabule','3 břidlice za kus']] },
  23:{ teaser:'Za hřebenem.', desc:'Horský potok. Jediný zdroj proudu v horách.',
      lines:[['Jez','40 MW na začátek, po rozšíření 520'],
             ['Bez něj','nic v horách nefunguje']] },
  24:{ teaser:'Za hřebenem.', desc:'Horská osada. Chaty, které konečně vydělávají.',
      lines:[['Chata',fmt(BUILDINGS.mtChata.rent)+'/min'],['Čtyři parcely','a lanovka k nim']] },
  25:{ teaser:'Za hřebenem.', desc:'Křemenná štola. Sklo do oken.',
      lines:[['Křemen','těží se pod zemí'],['Sklo','4 křemeny za kus']] },
  10:{ teaser:'Další část mapy. Co v ní bude, uvidíš, až se otevře.',
      desc:'Přehrada. Řeka, hráz a větrný hřeben — <b>proud bez paliva</b>.',
      lines:[['Větrníky','120 MW za kus, dá se vylepšit na 320'],
             ['Vodní elektrárna','600 MW z hráze, až 1 600 MW'],
             ['Výhoda','točí se dál, i když elektrárně dojde uhlí']] },
  9:{ teaser:'Další část mapy. Co v ní bude, uvidíš, až se otevře.',
      desc:'Obchodní čtvrť. Dva <b>mrakodrapy</b> — kanceláře velkých firem a luxusní byty.',
      lines:[['Dvacet fází','hodina stavby na jeden mrakodrap'],
             ['Traverzy','stovky kusů z hutního kombinátu'],
             ['Nájem',fmt(BUILDINGS.mrakodrap.rent)+'/min za věž']] },
  6:{ teaser:'Další část mapy. Co v ní bude, uvidíš, až se otevře.',
      desc:'Lázeňská čtvrť. Čtyři parcely pro <b>hotely</b> — nejvyšší nájem ve hře.',
      lines:[['Hotel','nájem '+fmt(BUILDINGS.hotel.rent)+'/min'],
             ['Odběr','70 MW proudu a 60 m³ vody hned na první úrovni'],
             ['Provedení','lázeňský, moderní nebo horský']] },
  4:{ teaser:'Další část mapy. Co v ní bude, uvidíš, až se otevře.',
      desc:'Obchodní zóna. Jedna obrovská stavba — <b>obchodní centrum</b>.',
      lines:[['Odběr','160 MW — bez pořádné elektrárny to nerozsvítíš'],
             ['Nájem',fmt(BUILDINGS.obchodak.rent)+'/min'],
             ['Materiál','všechno, co umíš vyrobit']] }
};
function platformSheet(i) {
  const p = PLAT(i), op = platOpen(i);
  if (p.req && !op && !gateDone(p.req)) {
    const gn = gateName(p.req), gp = gatePlat(p.req);
    opn(`<div class="st">${p.name}<span class="tag sky">zamčeno</span></div>
      <div class="ss">Tahle část hor se otevře, až postavíš
        <b>${gn}</b>${PLAT(gp)?` na platformě ${PLAT(gp).name}`:''}.</div>
      <div class="bli"><em>Potřebuješ</em><span>${gn}</span></div>
      <div class="bli"><em>Úroveň</em><span>LVL ${p.reqLvl}${S.lvl>=p.reqLvl?' — máš':''}</span></div>
      <button class="btn g" data-close>Zavřít</button>`, 'plat'+i);
    return;
  }
  const I = PLAT_INFO[i] || { teaser:'Další část mapy.', desc:'Další část mapy.', lines:[] };
  if (p.soon && !op) {
    opn(`<div class="st">${p.name}<span class="tag sky">připravujeme</span></div>
      <div class="ss">${I.desc}</div>
      ${I.lines.map(l=>`<div class="bli"><em>${l[0]}</em><span>${l[1]}</span></div>`).join('')}
      <div class="ss" style="margin-top:8px">Tahle část se ještě dodělává —
        přibude do hry v příští verzi spolu s horským krajem.</div>
      <button class="btn g" data-close>Zavřít</button>`, 'plat'+i);
    return;
  }
  opn(`<div class="st">${p.name}${op?'<span class="tag ok">otevřeno</span>':''}</div>
    <div class="ss">${op ? I.desc : I.teaser}</div>
    ${(op ? I.lines : [['Zdarma','Otevře se sama na LVL '+p.reqLvl]]).map(l=>
      `<div class="bli"><em>${l[0]}</em><span>${l[1]}</span></div>`).join('')}
    ${op?'':`<div class="ss" style="margin-top:8px">Zbývá ${
      fmtN(Math.max(0,LVL[p.reqLvl-1]-S.xp))} XP.</div>`}
    <button class="btn g" data-close>Zavřít</button>`);
}
function openPlatform(i) {
  if (platOpen(i)) return;
  const p = PLAT(i), I = PLAT_INFO[i] || { lines:[] };
  S.plats[i] = true;
  PIDS.forEach(id => { if (PARC[id].plat === i && PARC[id].free) S.owned[id] = true; });
  renderRes(); save();
  showEvent({ once:'plat'+i, kick:'Nová oblast', tone:'ok', title:p.name,
    desc:'Otevřela se ti nová část mapy — zdarma.', lines:I.lines });
}

/* ─── statistiky města ─── */
const dur = ms => { const m = Math.floor(ms/60000);
  if (m < 60) return m + ' min';
  const h = Math.floor(m/60);
  return h < 24 ? `${h} h ${m%60} min` : `${Math.floor(h/24)} d ${h%24} h`; };
function scrStat() {
  const T = statTotals(), st = S.stats, best = bestBuilding();
  const row = (ic, col, n, v, sub) =>
    `<div class="rw"><div class="ric">${icon(ic,col,20)}</div>
      <div class="rt"><b>${n}</b><i>${v}</i>${sub?`<i class="nx">${sub}</i>`:''}</div></div>`;
  const top = o => Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,4)
    .map(([k,v]) => `<span class="mt">${resIcon(k,12)}${fmtN(v)}</span>`).join('') || '<span class="mt">zatím nic</span>';

  opn(`<div class="st">Statistiky města</div>
    <div class="ss">Co všechno tvoje město za tu dobu stihlo.</div>

    <div class="st sub">Město</div>
    ${row('coin',C.amber,'Nájem', fmt(T.rentMin)+' za minutu',
      cityBoost()>0?`z toho +${Math.round(cityBoost()*100)} % díky starému městu`:null)}
    ${row('plank',C.wood,'Hotové stavby', T.doneB+' z '+PIDS.length+' parcel',
      `${PLATFORMS.filter(p=>platOpen(p.id)).length} z ${PLATFORMS.length} oblastí otevřeno`)}
    ${best?row('brick',C.brick,'Nejvýdělečnější',
      (defOf(best.id)?defOf(best.id).name:PARC[best.id].name)+' — '+fmt(best.rent)+'/min'):''}
    ${row('power',C.amber,'Síť', `${powerUse()} z ${powerMax()} MW · ${waterUse()} z ${waterMax()} m³`,
      renewMw()?`${renewMw()} MW bez paliva`:null)}

    <div class="st sub">Suroviny</div>
    ${row('rock',C.stone,'Vytěženo', fmtN(T.mined)+' kusů')}
    <div class="mats">${top(st.mined)}</div>
    ${row('gravel','#A6ABA5','Vyrobeno', fmtN(T.made)+' kusů')}
    <div class="mats">${top(st.made)}</div>
    ${row('coin',C.amber,'Obchod', `prodáno ${fmtN(st.sold)} · koupeno ${fmtN(st.bought)}`)}

    <div class="st sub">Vydělané peníze</div>
    ${row('power',C.green,'Prodej proudu', fmt(st.earnedMw||0),
      surplusMw()?`teď ${surplusMw()} MW za ${fmt(surplusRate())}/min`:null)}
    ${row('coin',C.green,'Celkem', fmt(T.earned),
      `nájem ${fmt(st.earnedRent)} · zakázky ${fmt(st.earnedOrders)}${
        st.earnedShips?` · lodě ${fmt(st.earnedShips)}`:''}`)}
    ${row('plank',C.wood,'Zakázky', fmtN(st.orders)+' splněných'
      + (st.voyages?` · ${fmtN(st.voyages)} plaveb`:''))}

    <div class="st sub">Stavění a údržba</div>
    ${row('brick',C.brick,'Postaveno', fmtN(st.built)+' staveb · '+fmtN(st.upgrades)+' vylepšení')}
    ${row('alert',C.red,'Poruchy', fmtN(st.repairs)+' oprav')}
    ${row('coin',C.amber,'Nálezy', fmtN(st.cargo)+' beden')}
    ${row('power',C.sky,'Odehráno', dur(st.play), 'LVL '+S.lvl+' · '+fmtN(S.xp)+' XP')}

    <button class="btn g" data-close>Zavřít</button>`, 'stat');
}

/* ─── restart ─── */
$('logo').onclick = () => {
  opn(`<div class="st">Moje stavba</div>
    <button class="btn" id="gostat">Statistiky města</button>
    <div class="st sub">Začít znovu</div>
    <div class="ss">Smaže celý postup — level, peníze, stavby i suroviny. Nejde to vrátit.
      Pro potvrzení napiš <b>RESTART</b>.</div>
    <input class="inp" id="rw" placeholder="RESTART" autocapitalize="characters">
    <button class="btn" id="rgo" style="background:var(--red);color:#fff">Smazat a začít znovu</button>
    <button class="btn g" data-close>Zrušit</button>
    <div class="verline">${GAME_VER}</div>`);
  $('gostat').onclick = () => scrStat();
  $('rgo').onclick = () => {
    if (($('rw').value||'').trim().toUpperCase() !== 'RESTART') { toast('Napiš RESTART'); return; }
    wipe(); };
};

/* ─── navigace ─── */
document.querySelectorAll('#nav button').forEach(b => b.onclick = () => {
  const s = b.dataset.s;
  document.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('on',x===b));
  if (s === 'mapa') { cls(); closeParcel(); return; }
  ({ stavby:scrStavby, rozvoj:scrRozvoj, vyroba:scrVyroba, obchod:scrObchod,
     zakazky:scrZakazky })[s]();
  setTimeout(()=>document.querySelectorAll('#nav button')
    .forEach(x=>x.classList.toggle('on', x.dataset.s==='mapa')), 350);
});
