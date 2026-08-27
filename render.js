/* ═══════════ izometrické vykreslování ═══════════ */
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
let W=0, H=0, DPR=1, Zfit=1, ZU=1, panX=0, panY=0, cx0=0, cy0=0, pulse=0;
const TW=104, TH=52, EL=9;
let MODE = { v:'map' };
let floats = [], upHit = {}, platHit = {};
let vign = null, vignW = 0, vignH = 0;

const HOME = { cx:6.5, cy:6.5 };
function centerCam() { cx0 = W/2; cy0 = H/2 - (HOME.cx+HOME.cy)*(TH/2)*Z(); }
function resize() {
  DPR = Math.min(devicePixelRatio || 1, 2);
  const r = cv.getBoundingClientRect(); W = r.width; H = r.height;
  cv.width = W*DPR; cv.height = H*DPR; ctx.setTransform(DPR,0,0,DPR,0,0);
  Zfit = Math.min(W*0.94/(13*TW), H*0.80/(13*TH));
  centerCam();
  if (MODE.v === 'detail') focusOn(PARC[MODE.id], spanOf(MODE.id)); else clampPan();
}
const Z = () => Zfit*ZU;
let ZADD = 0;
const iso = (gx,gy,z) => ({ x: cx0+panX+(gx-gy)*(TW/2)*Z(),
  y: cy0+panY+(gx+gy)*(TH/2)*Z()-((z||0)+ZADD)*Z() });

function worldBounds() {
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  PLATFORMS.filter(p => !!p.mtn === (S.world===1)).forEach(p => {
    x0=Math.min(x0,p.ox); y0=Math.min(y0,p.oy);
    x1=Math.max(x1,p.ox+PSZ); y1=Math.max(y1,p.oy+PSZ); });
  return {x0,x1,y0,y1};
}
let WB = worldBounds();
function clampPan() {
  if (MODE.v !== 'map') return;
  const s = Z();
  let minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9;
  [[WB.x0,WB.y0],[WB.x1,WB.y0],[WB.x1,WB.y1],[WB.x0,WB.y1]].forEach(([gx,gy])=>{
    const px = cx0+(gx-gy)*(TW/2)*s, py = cy0+(gx+gy)*(TH/2)*s;
    minX=Math.min(minX,px); maxX=Math.max(maxX,px);
    minY=Math.min(minY,py); maxY=Math.max(maxY,py); });
  const mx = W*0.45, my = H*0.42;
  panX = Math.max(mx-maxX, Math.min(W-mx-minX, panX));
  panY = Math.max(my-maxY, Math.min(H-my-minY, panY));
}
function setZoom(z, ax, ay) {
  const o = Z(), oc = cy0; ZU = Math.max(.42, Math.min(4, z)); const n = Z();
  if (ax !== undefined) { const k = n/o-1; panX -= (ax-cx0-panX)*k; panY -= (ay-cy0-panY)*k; }
  centerCam(); panY += oc-cy0; clampPan();
}
function focusOn(p, sp) {
  sp = sp || 2;
  ZU = Math.min(4, Math.max(1.4, Math.min(W/((sp+2.2)*TW*Zfit), H/((sp+4.4)*TH*Zfit))));
  centerCam();
  const s = Z(), gc = p.gx+sp/2, gr = p.gy+sp/2;
  panX = -(gc-gr)*(TW/2)*s;
  panY = -(gc+gr)*(TH/2)*s + (H*.36-cy0);
}

/* ─── primitiva ─── */
function sh(hex,f) { const n = parseInt(hex.slice(1),16);
  return `rgb(${Math.min(255,((n>>16)&255)*f)|0},${Math.min(255,((n>>8)&255)*f)|0},${Math.min(255,(n&255)*f)|0})`; }
function poly(p,fill) { ctx.beginPath(); ctx.moveTo(p[0].x,p[0].y);
  for (let i=1;i<p.length;i++) ctx.lineTo(p[i].x,p[i].y);
  ctx.closePath(); ctx.fillStyle=fill; ctx.fill(); }
const TOP=1.16, LFT=.58, RGT=.84;
function box(gx,gy,w,d,z0,z1,col,noTop) {
  const Cc=iso(gx+w,gy+d,z1);
  const C0=iso(gx+w,gy+d,z0),D0=iso(gx,gy+d,z0),B0=iso(gx+w,gy,z0);
  const D=iso(gx,gy+d,z1); poly([D,Cc,C0,D0],sh(col,LFT));
  const B=iso(gx+w,gy,z1); poly([Cc,B,B0,C0],sh(col,RGT));
  if (!noTop) { const A=iso(gx,gy,z1); poly([A,B,Cc,D],sh(col,TOP)); }
}
function pyr(gx,gy,w,d,z0,z1,col) {
  const c=[iso(gx,gy,z0),iso(gx+w,gy,z0),iso(gx+w,gy+d,z0),iso(gx,gy+d,z0)], ap=iso(gx+w/2,gy+d/2,z1);
  poly([c[0],c[1],ap],sh(col,TOP)); poly([c[1],c[2],ap],sh(col,RGT));
  poly([c[2],c[3],ap],sh(col,LFT)); poly([c[3],c[0],ap],sh(col,.98));
}
function gableR(gx,gy,w,d,z0,z1,col) {
  const rA=iso(gx,gy+d/2,z1), rB=iso(gx+w,gy+d/2,z1);
  const a=iso(gx,gy,z0),b=iso(gx+w,gy,z0),c=iso(gx+w,gy+d,z0),e=iso(gx,gy+d,z0);
  poly([a,b,rB,rA],sh(col,TOP)); poly([e,c,rB,rA],sh(col,LFT));
  poly([a,rA,e],sh(col,.94)); poly([b,rB,c],sh(col,RGT));
}
/* měkký kontaktní stín pod stavbou */
function shadow(gx,gy,w,d) { const s=Z(), c=iso(gx+w/2,gy+d/2,0);
  ctx.save(); ctx.translate(c.x,c.y); ctx.scale(1,.5);
  ctx.beginPath(); ctx.arc(0,0,Math.max(w,d)*TW*.34*s,0,7);
  ctx.fillStyle='rgba(8,14,8,.34)'; ctx.fill(); ctx.restore(); }
/* vržený stín — světlo přichází zleva shora, stín padá doprava dolů */
function castShadow(gx,gy,w,d,h) {
  const k = Math.min(h/70, 1.1) * 0.9;
  const a = iso(gx,     gy,     0), b = iso(gx+w, gy,     0);
  const c = iso(gx+w+k*.9, gy+d+k*.5, 0), e = iso(gx+k*.9, gy+d+k*.5, 0);
  ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
  ctx.lineTo(c.x,c.y); ctx.lineTo(e.x,e.y); ctx.closePath();
  ctx.fillStyle = 'rgba(8,14,10,.3)'; ctx.fill();
}
const rnd = (x,y) => { const s = Math.sin(x*127.1+y*311.7)*43758.5453; return s-Math.floor(s); };
const ASPHALT_LVL = 50;
/* směr silnice na každém poli — vodorovná, svislá, nebo křižovatka */
const ROAD_DIR = (() => {
  const road = new Set();
  PLATFORMS.forEach(pl => { const m = MAPS[pl.id];
    for (let y=0;y<PSZ;y++) for (let x=0;x<PSZ;x++)
      if (m[y][x] === 'R') road.add((pl.ox+x)+','+(pl.oy+y)); });
  const dir = {};
  road.forEach(k => {
    const [x,y] = k.split(',').map(Number);
    const h = road.has((x-1)+','+y) || road.has((x+1)+','+y);
    const v = road.has(x+','+(y-1)) || road.has(x+','+(y+1));
    dir[k] = (h && v) ? 'x' : h ? 'h' : v ? 'v' : 'x';
  });
  return dir;
})();
function water(gx,gy,hz,plain) {
  hz = hz||0; const T = EL-4+hz;
  if (plain) {                      // levná verze pro širé moře mimo dohled
    poly([iso(gx,gy,T),iso(gx+1,gy,T),iso(gx+1,gy+1,T),iso(gx,gy+1,T)], '#345F76');
    return;
  }
  const t = pulse/60 + (gx+gy)*.4;
  box(gx,gy,1,1,0,T,'#2E4E60');
  poly([iso(gx,gy,T),iso(gx+1,gy,T),iso(gx+1,gy+1,T),iso(gx,gy+1,T)],
       sh('#3E6E86', 1.02+Math.sin(t)*.06));
  ctx.strokeStyle = 'rgba(190,220,232,.16)'; ctx.lineWidth = 1.4*Z();
  for (let i=0;i<2;i++) { const o = .3+i*.34+Math.sin(t+i)*.05;
    const a = iso(gx+.1,gy+o,T), b = iso(gx+.9,gy+o-.1,T);
    ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
}
function tile(gx,gy,col,road,hz) { hz = hz||0; const v = rnd(gx,gy)*.14-.07;
  if (col === TCOL.W || col === TCOL.V) { water(gx,gy,hz); return; }
  const paved = road && S.lvl >= ASPHALT_LVL;
  const c = paved ? '#4A4E52' : col;
  const T = EL + hz;
  box(gx,gy,1,1,0,T,c,true);
  poly([iso(gx,gy,T),iso(gx+1,gy,T),iso(gx+1,gy+1,T),iso(gx,gy+1,T)], sh(c,TOP+v));
  if (!paved && !road) {   // drobné skvrny, ať plocha není jednolitá
    const r2 = rnd(gx*3.1, gy*1.7);
    if (r2 > .55) { const ox = .12+r2*.5, oy = .18+rnd(gy,gx)*.5, sz = .16+r2*.22;
      poly([iso(gx+ox,gy+oy,T),iso(gx+ox+sz,gy+oy,T),
            iso(gx+ox+sz,gy+oy+sz,T),iso(gx+ox,gy+oy+sz,T)], sh(c, TOP+v+(r2>.8?.09:-.07))); }
  }
  if (paved) {   // vodorovné značení — vždy ve směru jízdy
    const dir = ROAD_DIR[gx+','+gy];
    const M = 'rgba(226,222,196,.55)';
    const dash = (x0,y0,x1,y1) => poly([iso(gx+x0,gy+y0,T),iso(gx+x1,gy+y0,T),
                                        iso(gx+x1,gy+y1,T),iso(gx+x0,gy+y1,T)], M);
    if (dir === 'v') { dash(.44,.14,.56,.4); dash(.44,.6,.56,.86); }
    else if (dir === 'h') { dash(.14,.44,.4,.56); dash(.6,.44,.86,.56); }
    /* na křižovatce se nečáruje */
  } }
function smoke(gx,gy,z) { const t = pulse/26;
  for (let i=0;i<3;i++) { const p = iso(gx,gy,z+6+i*9+((t+i)%3)*3);
    ctx.beginPath(); ctx.arc(p.x+Math.sin(t+i)*4*Z(), p.y, (3+i*1.6)*Z(), 0, 7);
    ctx.fillStyle = `rgba(220,225,215,${.22-i*.06})`; ctx.fill(); } }

/* ─── dekorace ─── */
function tree(gx,gy,v){ shadow(gx+.18,gy+.18,.64,.64);
  box(gx+.44,gy+.44,.13,.13,EL,EL+10+v*4,C.woodD);
  const h=EL+26+v*12;
  pyr(gx+.14,gy+.14,.72,.72,EL+8,h, v>.6?C.leaf3:v>.3?C.leaf2:C.leaf1);
  if(v>.45) pyr(gx+.24,gy+.24,.52,.52,h-9,h+9, v>.6?C.leaf3:C.leaf1); }
function rock(gx,gy,v){ shadow(gx+.24,gy+.26,.5,.46);
  box(gx+.22,gy+.24,.44,.42,EL,EL+7+v*5,C.stone);
  box(gx+.46,gy+.16,.26,.26,EL,EL+12+v*6,C.stoneD); }
function wheatT(gx,gy,v){ shadow(gx+.2,gy+.2,.6,.6);
  for(let i=0;i<4;i++){const o=i*.19; box(gx+.16+o,gy+.2+o*.6,.12,.12,EL,EL+10+v*5, i%2?C.wheat:sh(C.wheat,.9));} }
function clayT(gx,gy,v){ shadow(gx+.2,gy+.2,.6,.6);
  box(gx+.18,gy+.18,.52,.52,EL-3,EL+2,sh(C.clay,.85));
  box(gx+.42,gy+.4,.28,.28,EL+2,EL+8+v*4,C.clay); }
function bushT(gx,gy){ shadow(gx+.3,gy+.3,.4,.4); pyr(gx+.3,gy+.3,.4,.4,EL,EL+13,C.leaf2); }
function stumpT(gx,gy){ shadow(gx+.34,gy+.34,.32,.32); box(gx+.36,gy+.36,.28,.28,EL,EL+7,C.woodD); }
function hutT(gx,gy,v){ shadow(gx+.28,gy+.3,.46,.42);
  box(gx+.28,gy+.3,.44,.38,EL,EL+11,'#7C8A6E');
  box(gx+.26,gy+.28,.48,.42,EL+11,EL+13,C.slate); }
function crateT(gx,gy,v){ shadow(gx+.3,gy+.32,.4,.36);
  box(gx+.3,gy+.34,.34,.3,EL,EL+8,C.wood);
  if(v>.93) box(gx+.36,gy+.4,.24,.2,EL+8,EL+15,sh(C.wood,.88)); }
function barrelT(gx,gy,v){ shadow(gx+.34,gy+.34,.34,.32);
  box(gx+.36,gy+.38,.22,.22,EL,EL+10,v>.9?'#8A5A3E':'#4E6A46');
  box(gx+.6,gy+.34,.18,.18,EL,EL+8,'#6E736F'); }
function reedT(gx,gy,v){
  const sw = Math.sin(pulse/34 + gx*1.7 + gy*.9) * .04;
  for (let i=0;i<5;i++) {
    const ox = .2+((i*37)%10)/22, oy = .22+((i*53)%10)/22, h = 9+((i*29)%7);
    box(gx+ox, gy+oy, .05, .05, EL-2, EL+h, i%2 ? '#6E8A4C' : '#5E7A42');
    box(gx+ox+sw, gy+oy+sw*.6, .05, .05, EL+h, EL+h+4, '#8A7A4A');
  }
}
function lampT(gx,gy,off,d){
  const horiz = d && d.horiz, arm = (d && d.arm) || 1;
  const px = horiz ? gx+.44 : gx+(off||.5);
  const py = horiz ? gy+(off||.5) : gy+.44;
  shadow(px-.02,py-.02,.16,.16);
  box(px, py, .08, .08, EL, EL+24, C.steel);
  /* výložník nad vozovku */
  const R = .5;
  if (horiz) box(px+.02, py + (arm>0 ? .08 : -R), .04, R-.06, EL+22, EL+24, C.steel);
  else       box(px + (arm>0 ? .08 : -R), py+.02, R-.06, .04, EL+22, EL+24, C.steel);
  const hx = horiz ? px : px + arm*(R-.08), hy = horiz ? py + arm*(R-.08) : py;
  box(hx-.03, hy-.03, .14, .14, EL+21, EL+23, '#F0E7C2');
  if (S.lvl >= ASPHALT_LVL) {   // po setmění svítí
    const c = iso(hx+.04, hy+.04, EL+21);
    ctx.beginPath(); ctx.arc(c.x, c.y, 5*Z(), 0, 7);
    ctx.fillStyle = 'rgba(244,232,180,.13)'; ctx.fill();
  }
}
const DRAW = { tree, rock, wheat:wheatT, clay:clayT, bush:bushT, stump:stumpT,
  hut:hutT, crate:crateT, barrel:barrelT, lamp:lampT, reed:reedT };

/* ─── obytné stavby ─── */
function house(gx,gy,ph,st,big,hl,sp) {
  sp = (sp||2)/2;
  if (ph>=3) castShadow(gx+.1,gy+.1,1.8*sp,1.8*sp, big?60:44);
  const o = big ? {i:.08*sp,w:1.84*sp,H:44*sp,R:34*sp} : {i:.24*sp,w:1.52*sp,H:34*sp,R:26*sp};
  const x=gx+o.i, y=gy+o.i, w=o.w;
  if (ph>=1) { shadow(gx+.1,gy+.1,1.8*sp,1.8*sp);
    [[0,0],[1,0],[0,1],[1,1]].forEach(p=>box(x+p[0]*(w-.26),y+p[1]*(w-.26),.26,.26,EL,EL+7,C.stone)); }
  if (ph>=2) {
    [[0,0],[1,0],[0,1],[1,1]].forEach(p=>box(x+.03+p[0]*(w-.2),y+.03+p[1]*(w-.2),.15,.15,EL+7,EL+o.H,C.woodD));
    box(x,y,w,.1,EL+o.H-6,EL+o.H,C.woodD); box(x,y+w-.1,w,.1,EL+o.H-6,EL+o.H,C.woodD); }
  if (ph>=3) {
    box(x,y,w,w,EL+7,EL+o.H,st.wall);
    poly([iso(x+w*.34,y+w,EL+o.H*.62),iso(x+w*.62,y+w,EL+o.H*.62),
          iso(x+w*.62,y+w,EL+8),iso(x+w*.34,y+w,EL+8)], sh(st.wall,.34));
    poly([iso(x+w,y+w*.3,EL+o.H*.74),iso(x+w,y+w*.62,EL+o.H*.74),
          iso(x+w,y+w*.62,EL+o.H*.42),iso(x+w,y+w*.3,EL+o.H*.42)], sh(st.wall,.42)); }
  const topZ = EL+o.H + (hl>=3 ? o.H*.62 : 0);
  if (ph>=3 && hl>=3) box(x+.03,y+.03,w-.06,w-.06,EL+o.H,topZ,sh(st.wall,1.06));
  if (ph>=4) {
    ctx.strokeStyle = sh(C.woodD,1.1); ctx.lineWidth = 2.2*Z();
    const cor=[iso(x-.08,y-.08,topZ),iso(x+w+.08,y-.08,topZ),iso(x+w+.08,y+w+.08,topZ),iso(x-.08,y+w+.08,topZ)];
    const ap = iso(x+w/2,y+w/2,topZ+o.R);
    cor.forEach(p=>{ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(ap.x,ap.y);ctx.stroke();});
    ctx.beginPath(); ctx.moveTo(cor[0].x,cor[0].y); cor.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));
    ctx.closePath(); ctx.stroke(); }
  if (ph>=5) {
    if (st.roofT==='gable') gableR(x-.1,y-.1,w+.2,w+.2,topZ,topZ+o.R,st.roof);
    else pyr(x-.1,y-.1,w+.2,w+.2,topZ,topZ+o.R,st.roof);
    if (st.chim||hl>=3) { box(x+w*.7,y+w*.16,.18,.18,topZ+o.R*.4,topZ+o.R+9,C.brick);
      smoke(x+w*.79,y+w*.25,topZ+o.R+9); } }
  if (ph>=6) { box(x-.16,y+w*.3,.16,w*.44,EL+7,EL+9,C.woodD);
    box(x-.14,y+w*.32,.1,.1,EL+9,EL+o.H*.8,C.woodD);
    box(x-.14,y+w*.62,.1,.1,EL+9,EL+o.H*.8,C.woodD); }
  if (ph>=5 && hl>=2) {
    box(x+w,y+w*.24,.52,w*.5,EL,EL+o.H*.62,sh(st.wall,.92));
    gableR(x+w-.06,y+w*.18,.64,w*.62,EL+o.H*.62,EL+o.H*.62+14,st.roof); }
}
function warehouse(gx,gy,ph,st,lvl) {
  house(gx,gy,ph,st,false,1,2);
  if (ph<5) return;
  if (lvl>=2) { box(gx+1.72,gy+.5,.42,.8,EL,EL+26,sh(st.wall,.9));
    gableR(gx+1.66,gy+.44,.54,.92,EL+26,EL+35,st.roof); }
  if (lvl>=3) { box(gx-.3,gy+.5,.5,.5,EL,EL+46,C.concrete);
    pyr(gx-.36,gy+.44,.62,.62,EL+46,EL+55,C.slate); }
  if (lvl>=4) { box(gx-.3,gy+1.1,.44,.44,EL,EL+38,sh(C.concrete,.9));
    pyr(gx-.35,gy+1.05,.54,.54,EL+38,EL+45,C.slate); }
  if (lvl>=5) { box(gx+.2,gy+1.8,1.4,.3,EL,EL+5,C.woodD);
    box(gx+.5,gy+1.85,.3,.2,EL+5,EL+16,C.steel); }
}
function apartment(gx,gy,ph,hl,st,sp) {
  sp = sp||2; const k = sp/2;
  if (ph>=3) castShadow(gx+.1,gy+.1,1.8*k,1.8*k, 40+18*Math.max(1,hl));
  const x=gx+.16*k, y=gy+.16*k, w=(1.68)*k;
  const floors = 2 + Math.max(0,hl-1), fh = 22*k, baseH = EL+6;
  if (ph>=1) { shadow(gx+.08,gy+.08,1.86*k,1.86*k); box(x-.06,y-.06,w+.12,w+.12,0,EL+5,C.concrete); }
  if (ph>=2) box(x,y,w,w,EL+5,baseH+fh,st.wall);
  const shown = Math.min(floors, Math.max(0, ph-2));
  for (let f=0; f<shown; f++) {
    const z0 = baseH+fh*f, z1 = baseH+fh*(f+1);
    box(x,y,w,w,z0,z1, f%2?sh(st.wall,1.05):st.wall);
    for (let i=0;i<3;i++) {
      const wy = y+w*(.16+i*.28);
      poly([iso(x+w,wy,z1-5*k),iso(x+w,wy+w*.15,z1-5*k),
            iso(x+w,wy+w*.15,z0+5*k),iso(x+w,wy,z0+5*k)],
        gridLive()?'rgba(240,220,160,.5)':'rgba(60,66,58,.6)');
    }
  }
  const topZ = baseH+fh*Math.max(1,shown);
  if (ph>=5) { pyr(x-.1,y-.1,w+.2,w+.2,topZ,topZ+16*k,st.roof);
    if (st.chim) box(x+w*.66,y+w*.12,.16,.16,topZ+6,topZ+26,C.brick); }
  if (ph>=6) { box(x-.18,y+w*.34,.18,w*.36,EL+5,EL+7,C.woodD);
    const c = iso(x-.05,y+w*.5,EL+16);
    ctx.beginPath(); ctx.arc(c.x,c.y,3.4*Z(),0,7);
    ctx.fillStyle = gridLive()?C.green:C.red; ctx.fill(); }
}
function villa(gx,gy,ph,hl,st,sp) {
  sp = sp||3;
  if (ph>=3) castShadow(gx+.2,gy+.2,sp-.4,sp-.4, 60); const w = sp-0.5, x = gx+.25, y = gy+.25;
  if (ph>=1) { shadow(gx+.15,gy+.15,sp-.3,sp-.3); box(x,y,w,w,0,EL+5,C.concrete); }
  if (ph>=2) box(x+.1,y+.1,w-.2,w*.62,EL+5,EL+32,st.wall);
  if (ph>=3) box(x+.1,y+w*.66,w-.2,w*.28,EL+5,EL+24,sh(st.wall,.94));
  if (ph>=4) { box(x+.1,y+.1,w-.2,w*.62,EL+32,EL+54,sh(st.wall,1.05));
    for (let i=0;i<4;i++) poly([iso(x+w-.1,y+.3+i*(w*.14),EL+50),iso(x+w-.1,y+.4+i*(w*.14),EL+50),
      iso(x+w-.1,y+.4+i*(w*.14),EL+36),iso(x+w-.1,y+.3+i*(w*.14),EL+36)],'rgba(240,230,190,.55)'); }
  if (ph>=5) { box(x-.1,y+w*.2,.22,w*.5,EL+5,EL+7,C.stone);
    for (let i=0;i<3;i++) box(x-.06,y+w*.24+i*(w*.18),.12,.12,EL+7,EL+30,C.plaster); }
  if (ph>=6) {
    pyr(x,y,w,w*.72,EL+54,EL+54+18,st.roof);
    gableR(x+.02,y+w*.64,w-.04,w*.32,EL+24,EL+34,st.roof);
    if (st.chim) box(x+w*.72,y+w*.16,.18,.18,EL+58,EL+76,C.brick);
    if (hl>=2) { box(x+w*.06,y+w*.98,w*.5,.5,EL+5,EL+7,C.glass);
      box(x+w*.62,y+w*.98,.4,.4,EL+5,EL+18,sh(st.wall,.9)); }
    if (hl>=3) { box(x+w,y+.2,.6,w*.5,EL+5,EL+40,sh(st.wall,1.02));
      pyr(x+w-.06,y+.14,.72,w*.6,EL+40,EL+52,st.roof); }
    const c = iso(x+.05,y+w*.45,EL+16);
    ctx.beginPath(); ctx.arc(c.x,c.y,3.4*Z(),0,7);
    ctx.fillStyle = gridLive()?C.green:C.red; ctx.fill();
  }
}
function parkB(gx,gy,ph,hl,st,sp) {
  sp = sp||2; const w = sp-.3, x = gx+.15, y = gy+.15;
  if (ph>=1) { shadow(gx+.1,gy+.1,sp-.2,sp-.2); box(x,y,w,w,0,EL+2,st.wall); }
  if (ph>=2) { const t = w/5;
    for (let i=0;i<3;i++) box(x+.1,y+t*(i*1.6+.5),w-.2,.16,EL+2,EL+3,'#C6B徐'.slice(0,7)==='#C6B徐'?'#C7B98A':'#C7B98A'); }
  if (ph>=3) { const pts=[[.2,.25],[.72,.3],[.35,.72],[.78,.74],[.5,.48]];
    pts.forEach((p,i)=>{ box(x+w*p[0],y+w*p[1],.12,.12,EL+2,EL+9+i*2,C.woodD);
      pyr(x+w*p[0]-.16,y+w*p[1]-.16,.44,.44,EL+8+i*2,EL+22+i*3, i%2?C.leaf1:C.leaf2); }); }
  if (ph>=4) { for (let i=0;i<3;i++) { const bx=x+w*(.2+i*.28), by=y+w*.88;
      box(bx,by,.3,.1,EL+2,EL+5,C.woodD); box(bx,by,.06,.16,EL+5,EL+9,C.woodD); }
    for (let i=0;i<=4;i++) { const t=i/4;
      box(x+t*w,y-.04,.07,.07,EL+2,EL+9,C.woodD); box(x-.04,y+t*w,.07,.07,EL+2,EL+9,C.woodD); } }
  if (ph>=4 && hl>=2) { box(x+w*.14,y+w*.12,.5,.4,EL+2,EL+8,'#C4763F');
    box(x+w*.2,y+w*.16,.1,.1,EL+8,EL+22,C.steel);
    box(x+w*.16,y+w*.14,.42,.1,EL+22,EL+24,'#C4763F'); }
  if (ph>=4 && hl>=3) { box(x+w*.6,y+w*.55,.62,.5,EL+1,EL+3,C.glass);
    [[0,0],[1,0],[0,1],[1,1]].forEach(q=>box(x+w*.62+q[0]*.5,y+w*.57+q[1]*.4,.08,.08,EL+3,EL+20,C.woodD));
    pyr(x+w*.56,y+w*.51,.74,.62,EL+20,EL+30,C.tile); }
}
function mall(gx,gy,ph,hl,st,sp) {
  sp = sp||4;
  if (ph>=3) castShadow(gx+.2,gy+.2,sp-.4,sp-.4, 70); const w = sp-.4, x = gx+.2, y = gy+.2;
  if (ph>=1) { shadow(gx+.1,gy+.1,sp-.2,sp-.2); box(x,y,w,w,0,EL+5,C.asphalt); }
  if (ph>=2) [[0,0],[1,0],[0,1],[1,1]].forEach(p=>
    box(x+.2+p[0]*(w-.6),y+.2+p[1]*(w-.6),.22,.22,EL+5,EL+46,C.steel));
  if (ph>=3) box(x+.1,y+.1,w-.2,w-.2,EL+5,EL+38,st.wall);
  if (ph>=4) { for (let i=0;i<5;i++)
      poly([iso(x+w-.1,y+.4+i*(w*.16),EL+34),iso(x+w-.1,y+.5+i*(w*.16),EL+34),
            iso(x+w-.1,y+.5+i*(w*.16),EL+12),iso(x+w-.1,y+.4+i*(w*.16),EL+12)],'rgba(190,225,240,.5)');
    box(x+.1,y+.1,w-.2,w-.2,EL+38,EL+42,sh(st.wall,.8)); }
  if (ph>=5) { const f = hl>=2 ? 2 : 1;
    for (let i=0;i<f;i++) box(x+.3,y+.3,w-.6,w-.6,EL+42+i*22,EL+62+i*22,sh(st.wall,1.04)); }
  if (ph>=6) {
    const topZ = EL+62+(hl>=2?22:0);
    box(x+.24,y+.24,w-.48,w-.48,topZ,topZ+4,C.slate);
    box(x+w*.2,y+w*.2,.4,.4,topZ+4,topZ+16,C.steel);
    box(x+w*.62,y+w*.24,.34,.34,topZ+4,topZ+13,C.steel);
    box(x-.16,y+w*.36,.28,w*.3,EL+5,EL+8,C.concrete);
    if (hl>=3) box(x+w+.05,y+.3,.7,w-.6,0,EL+30,sh(C.concrete,.86));
    const c = iso(x+.05,y+w*.5,EL+20);
    ctx.beginPath(); ctx.arc(c.x,c.y,4*Z(),0,7);
    ctx.fillStyle = gridLive()?C.green:C.red; ctx.fill();
  }
}

/* ─── elektrárna: turbíny + chladicí věže ─── */
function powerPlant(gx,gy,ph,sp) {
  sp = sp || 3;
  if (ph>=3) castShadow(gx+.1,gy+.1,sp-.2,sp-.2, 80);
  const x=gx+.08, y=gy+.08, w=sp-.16;
  const live = gridLive(), nuke = isNuke();
  if (ph>=1) { shadow(gx+.05,gy+.05,sp-.1,sp-.1); box(x,y,w,w,0,EL+4,C.asphalt); }
  if (ph>=2) [[0,0],[1,0],[0,1],[1,1]].forEach(p=>
    box(x+.1+p[0]*(w-.42),y+.1+p[1]*(w-.42),.22,.22,EL+4,EL+52,C.steel));
  if (ph>=3) box(x+.06,y+.06,w*.54,w-.12,EL+4,EL+46,C.concrete);
  if (ph>=4) { box(x+w*.6,y+.06,w*.36,w*.5,EL+4,EL+34,sh(C.concrete,.92));
    for(let i=0;i<3;i++) box(x+w*.64,y+.2+i*(w*.14),w*.28,.18,EL+34,EL+38,C.steel); }
  if (ph>=5) {
    if (nuke) {   // reaktorová kupole místo komínů
      box(x+w*.06,y+w*.06,w*.46,w*.46,EL+46,EL+62,sh(C.concrete,1.02));
      pyr(x+w*.02,y+w*.02,w*.54,w*.54,EL+62,EL+92,sh(C.concrete,1.1));
      if (S.plant.blok>=2) { box(x+w*.58,y+w*.06,w*.34,w*.34,EL+46,EL+58,C.concrete);
        pyr(x+w*.55,y+w*.03,w*.4,w*.4,EL+58,EL+78,sh(C.concrete,1.06)); }
      if (S.plant.blok>=3) { box(x+w*.3,y+w*.56,w*.3,w*.3,EL+46,EL+56,C.concrete);
        pyr(x+w*.27,y+w*.53,w*.36,w*.36,EL+56,EL+74,sh(C.concrete,1.04)); }
    } else {
      const t = plantBuilt() ? S.plant.turb : 1;
      for (let i=0;i<Math.min(t,4);i++) {
        const cx2 = x+w*.1+ (i%2)*w*.22, cy2 = y+w*.12 + ((i/2)|0)*w*.3;
        const hgt = EL+46+50;
        box(cx2,cy2,.3,.3,EL+46,hgt,sh(C.concrete,.86));
        if (live) smoke(cx2+.15,cy2+.15,hgt);
      }
    } }
  if (ph>=6) {
    gableR(x-.04,y-.04,w*.58,w+.08,EL+46,EL+56,C.slate);
    const cl = plantBuilt() ? S.plant.cool : 1;
    for (let i=0;i<Math.min(cl,3);i++) {
      const cx2 = x+w*.62+ i*w*.2, cy2 = y+w*.62;
      box(cx2,cy2,.46,.46,EL+4,EL+30,sh(C.concrete,.8));
      pyr(cx2-.04,cy2-.04,.54,.54,EL+30,EL+40,sh(C.concrete,.7));
      if (live) smoke(cx2+.23,cy2+.23,EL+40);
    }
    for(let i=0;i<4;i++) box(x+w*.62+i*.26,y+w-.3,.12,.12,EL+4,EL+26,C.steel);
    if (nuke) {   // varovné pruhy a plot areálu
      for (let i=0;i<=3;i++) { const t2=i/3;
        box(x-.1+t2*(w+.2),y-.1,.08,.08,EL+4,EL+16,'#7FC24A');
        box(x-.1,y-.1+t2*(w+.2),.08,.08,EL+4,EL+16,'#7FC24A'); } }
    const c = iso(x+w*.84,y+w*.5,EL+40);
    ctx.beginPath(); ctx.arc(c.x,c.y,4.5*Z(),0,7);
    ctx.fillStyle = live?(nuke?'#7FC24A':C.green):C.red; ctx.fill();
  }
}

/* ─── chladicí věž ─── */
const COOL_PROF = (() => {
  /* hyperbolický profil: široká pata, úzký pas, mírně rozšířená koruna */
  const n = 16, H = 142, out = [];
  for (let i = 0; i < n; i++) {
    const t0 = i/n, t1 = (i+1)/n;
    const r = t => { const waist = 0.70;
      const d = (t - waist) / (t < waist ? waist : (1-waist));
      return 0.30 + (t < waist ? 0.30*d*d : 0.10*d*d); };
    out.push([1 - r(t0), 14 + H*t0, 14 + H*t1]);
  }
  return out;
})();
function coolTower(gx,gy) {
  const live = gridLive();
  castShadow(gx+.2,gy+.2,1.6,1.6, 120);
  shadow(gx+.05,gy+.05,1.9,1.9);
  box(gx+.1,gy+.1,1.8,1.8,0,EL+3,C.asphalt);
  [[0,0],[1,0],[0,1],[1,1]].forEach(p =>
    box(gx+.3+p[0]*1.1,gy+.3+p[1]*1.1,.18,.18,EL+3,EL+16,sh(C.concrete,.66)));
  COOL_PROF.forEach((seg,i) => {
    const ins = seg[0], w = 2 - ins*2;
    box(gx+ins, gy+ins, w, w, EL+seg[1], EL+seg[2], sh(C.concrete, 1.02 - i*0.012));
  });
  const t = COOL_PROF[COOL_PROF.length-1], ins = t[0];
  box(gx+ins-.04, gy+ins-.04, 2-(ins-.04)*2, 2-(ins-.04)*2, EL+t[2], EL+t[2]+4, sh(C.concrete,.72));
  /* naznačený otvor v koruně */
  const o = ins+.14, z = EL+t[2]+4;
  poly([iso(gx+o,gy+o,z),iso(gx+2-o,gy+o,z),iso(gx+2-o,gy+2-o,z),iso(gx+o,gy+2-o,z)],
       sh(C.concrete,.34));
  if (live) {
    const cx2 = gx+1, cy2 = gy+1, tt = pulse/36;
    for (let i=0;i<4;i++) {
      const p = iso(cx2, cy2, EL+t[2]+10+i*13+((tt+i)%3)*5);
      ctx.beginPath(); ctx.arc(p.x+Math.sin(tt+i*1.3)*5*Z(), p.y, (8+i*3)*Z(), 0, 7);
      ctx.fillStyle = `rgba(228,234,228,${.19-i*.04})`; ctx.fill();
    }
  }
}

/* ─── stanice ─── */
function stDeck(d, lvl) {
  const size = [1.9,2.4,2.7,3.0,3.3,3.6][lvl] || 1.9, o = (2-size)/2;
  const g = d.gx+o, y = d.gy+o;
  const base = { saw:C.dirt, quarry:C.quarry, field:C.meadow, pit:C.clay,
    coal:'#4A4640', uran:'#3E4A38', iron:'#5A4A42',
    granite:'#8A8078', slateq:'#4E545C', quartz:'#7C8894' }[d.kind] || C.dirt;
  box(g,y,size,size,0,EL-1,sh(base,.72));
  poly([iso(g,y,EL-1),iso(g+size,y,EL-1),iso(g+size,y+size,EL-1),iso(g,y+size,EL-1)], sh(base,1.06));
  const r=.1;
  box(g,y,size,r,EL-1,EL+2,C.stoneD); box(g,y+size-r,size,r,EL-1,EL+2,C.stoneD);
  box(g,y,r,size,EL-1,EL+2,C.stoneD); box(g+size-r,y,r,size,EL-1,EL+2,C.stoneD);
  return { g, y, size };
}
function station(id) {
  const d = nodeDef(id), n = S.nodes[id], lv = n.lvl;
  const D = stDeck(d, lv), g = D.g, y = D.y, sz = D.size;
  shadow(d.gx+.1, d.gy+.1, 1.8, 1.8);
  const hall = (ox,oy,w2,h2,col,roof) => { box(g+sz*ox,y+sz*oy,w2,h2,EL+1,EL+24,col);
    gableR(g+sz*ox-.05,y+sz*oy-.05,w2+.1,h2+.1,EL+24,EL+34,roof); };
  if (d.kind === 'saw') {
    for (let i=0;i<3;i++) box(g+.22,y+.3+i*.26,sz*.36,.2,EL+1,EL+10, i%2?C.log:sh(C.log,.88));
    if (lv>=1) {
      [[0,0],[1,0],[0,1],[1,1]].forEach(p=>box(g+sz*.44+p[0]*sz*.4,y+sz*.1+p[1]*sz*.34,.12,.12,EL+1,EL+27,C.woodD));
      gableR(g+sz*.38,y+sz*.04,sz*.58,sz*.5,EL+27,EL+40, lv>=2?C.tile:'#6E8A52');
      const c = iso(g+sz*.66,y+sz*.26,EL+15);
      ctx.beginPath(); ctx.arc(c.x,c.y,6*Z(),0,7); ctx.fillStyle='#B9BEB8'; ctx.fill(); }
    if (lv>=2) { box(g+sz*.08,y+sz*.66,.46,.4,EL+1,EL+24,C.brick);
      box(g+sz*.14,y+sz*.72,.18,.18,EL+24,EL+44,sh(C.brick,.8)); smoke(g+sz*.23,y+sz*.81,EL+44); }
    if (lv>=3) hall(.56,.6,.7,.6,C.concrete,C.slate);
    if (lv>=4) hall(.06,.06,.5,.44,C.steel,C.slate);
    if (lv>=5) { box(g+sz*.58,y+sz*.06,.4,.4,EL+1,EL+40,C.steel);
      pyr(g+sz*.56,y+sz*.04,.46,.46,EL+40,EL+50,C.slate); }
  } else if (d.kind === 'quarry') {
    box(g+.28,y+.28,sz-.56,sz-.56,EL-6,EL-1,sh(C.quarry,.62));
    box(g+.5,y+.5,.42,.42,EL-6,EL+6,C.stone);
    box(g+sz-1.0,y+sz-.9,.36,.36,EL-6,EL+3,C.stoneD);
    if (lv>=1) { const px=g+sz*.42, py=y+sz*.42;
      [[0,0],[1,0],[0,1],[1,1]].forEach(p=>box(px+p[0]*.6,py+p[1]*.6,.11,.11,EL+1,EL+30,C.woodD));
      box(px-.06,py-.06,.82,.11,EL+30,EL+35,C.woodD);
      box(g+sz*.06,y+sz*.08,.56,.4,EL+1,EL+16,'#7C8A6E');
      box(g+sz*.04,y+sz*.06,.62,.44,EL+16,EL+18,C.slate); }
    if (lv>=2) { box(g+sz*.06,y+sz*.64,.5,.46,EL+1,EL+22,C.stoneD);
      pyr(g+sz*.03,y+sz*.61,.6,.54,EL+22,EL+30,'#4E5450');
      box(g+sz*.13,y+sz*.74,.16,.16,EL+28,EL+46,'#4E5450'); smoke(g+sz*.21,y+sz*.82,EL+46); }
    if (lv>=3) { box(g+sz*.42,y+sz*.06,1.0,.16,EL+8,EL+12,C.stoneD); }
    if (lv>=4) hall(.56,.62,.66,.56,C.steel,C.slate);
    if (lv>=5) { box(g+sz*.68,y+sz*.14,.44,.44,EL+1,EL+22,'#8A6E3E');
      box(g+sz*.76,y+sz*.22,.16,.16,EL+22,EL+36,C.woodD); }
  } else if (d.kind === 'field') {
    const rows = [3,5,6,7,8,9][lv] || 3;
    for (let i=0;i<rows;i++) box(g+.22,y+.26+i*((sz-.5)/rows),sz-.44,.13,EL,EL+9, i%2?C.wheat:sh(C.wheat,.9));
    if (lv>=1) { const mx=g+sz-.6, my=y+.22;
      box(mx,my,.18,.18,EL,EL+34,C.woodD);
      const c = iso(mx+.09,my+.09,EL+34);
      ctx.strokeStyle = sh(C.woodD,1.25); ctx.lineWidth = 2.6*Z();
      for (let a=0;a<4;a++) { const an = a*Math.PI/2 + (S.nodes[id].on ? pulse/20 : pulse/320);
        ctx.beginPath(); ctx.moveTo(c.x,c.y);
        ctx.lineTo(c.x+Math.cos(an)*16*Z(), c.y+Math.sin(an)*16*Z()*.85); ctx.stroke(); } }
    if (lv>=2) hall(.06,.66,.6,.5,C.wood,C.tile);
    if (lv>=3) { box(g+sz-.75,y+sz-.75,.44,.44,EL,EL+38,C.concrete);
      pyr(g+sz-.8,y+sz-.8,.54,.54,EL+38,EL+46,C.slate); }
    if (lv>=4) hall(.58,.06,.6,.5,C.steel,C.slate);
    if (lv>=5) { box(g+sz*.06,y+sz*.06,.42,.42,EL,EL+34,C.concrete);
      pyr(g+sz*.04,y+sz*.04,.5,.5,EL+34,EL+42,C.slate); }
  } else if (d.kind === 'pit') {
    box(g+.26,y+.26,sz-.52,sz-.52,EL-7,EL-1,sh(C.clay,.66));
    box(g+.5,y+.5,sz-1.0,sz-1.0,EL-7,EL-4,sh(C.clay,.82));
    for (let i=0;i<3;i++) box(g+.6+i*.34,y+.7,.26,.46,EL-4,EL-1,C.clay);
    if (lv>=1) { const px=g+sz-.8, py=y+.3;
      box(px,py,.13,.13,EL,EL+28,C.woodD); box(px-.5,py,.63,.1,EL+24,EL+28,C.woodD); }
    if (lv>=2) { box(g+sz*.1,y+sz*.56,.66,.54,EL,EL+22,C.brick);
      pyr(g+sz*.07,y+sz*.53,.76,.62,EL+22,EL+34,sh(C.brick,.78));
      box(g+sz*.22,y+sz*.66,.18,.18,EL+30,EL+50,sh(C.brick,.66)); smoke(g+sz*.31,y+sz*.75,EL+50); }
    if (lv>=3) { box(g+sz*.56,y+sz*.56,.6,.5,EL,EL+20,sh(C.brick,.9));
      pyr(g+sz*.53,y+sz*.53,.7,.58,EL+20,EL+30,sh(C.brick,.72)); }
    if (lv>=4) hall(.06,.06,.5,.44,C.steel,C.slate);
    if (lv>=5) { box(g+sz*.6,y+sz*.08,.42,.42,EL,EL+34,C.concrete);
      pyr(g+sz*.58,y+sz*.06,.5,.5,EL+34,EL+44,C.slate); }
  } else if (d.kind === 'granite' || d.kind === 'slateq' || d.kind === 'quartz') {
    const col = d.kind==='granite' ? '#9A8E86' : d.kind==='slateq' ? '#5E6470' : '#C6CEDA';
    box(g+.26,y+.26,sz-.52,sz-.52,EL-8,EL-1,sh(col,.6));
    for (let i=0;i<4;i++) box(g+.45+ (i%2)*.5, y+.5+((i/2)|0)*.5, .3,.3, EL-1, EL+5+i*3, col);
    if (lv>=1) {
      if (d.kind==='quartz') {                  // portál štoly
        box(g+sz*.5,y+sz*.1,.7,.5,EL-1,EL+26,'#5A5F67');
        poly([iso(g+sz*.62,y+sz*.6,EL+18),iso(g+sz*.82,y+sz*.6,EL+18),
              iso(g+sz*.82,y+sz*.6,EL),iso(g+sz*.62,y+sz*.6,EL)],'rgba(16,18,22,.85)');
      } else {
        [[0,0],[1,0],[0,1],[1,1]].forEach(p2=>box(g+sz*.5+p2[0]*.5,y+sz*.14+p2[1]*.5,.13,.13,EL,EL+34,C.steel));
        box(g+sz*.48,y+sz*.12,.76,.76,EL+34,EL+38,C.steel);
      }
      box(g+sz*.06,y+sz*.6,.6,.44,EL-1,EL+18,'#8A6E4A');
      gableR(g+sz*.03,y+sz*.57,.68,.5,EL+18,EL+26,'#5E6470');
    }
    if (lv>=2) { box(g+sz*.56,y+sz*.62,.62,.5,EL-1,EL+24,'#8E959C');
      gableR(g+sz*.53,y+sz*.59,.7,.58,EL+24,EL+32,'#4E545C');
      box(g+sz*.14,y+sz*.34,.9,.14,EL+8,EL+13,C.steel); }
    if (lv>=3) { box(g+sz*.08,y+sz*.06,.5,.44,EL-1,EL+32,C.concrete);
      pyr(g+sz*.05,y+sz*.03,.58,.5,EL+32,EL+42,'#4E545C'); }
  } else if (d.kind === 'iron') {
    box(g+.3,y+.3,sz-.6,sz-.6,EL-9,EL-1,'#5A4A42');
    for (let i=0;i<3;i++) box(g+.5+i*.4,y+.6,.32,.32,EL-1,EL+7+i*3,'#8C6A5A');
    if (lv>=1) {
      [[0,0],[1,0],[0,1],[1,1]].forEach(p=>box(g+sz*.5+p[0]*.52,y+sz*.12+p[1]*.52,.14,.14,EL,EL+42,C.steel));
      box(g+sz*.48,y+sz*.1,.8,.8,EL+42,EL+47,C.steel);
      const c = iso(g+sz*.5+.32,y+sz*.12+.32,EL+50);
      ctx.beginPath(); ctx.arc(c.x,c.y,7*Z(),0,7);
      ctx.strokeStyle=C.steel; ctx.lineWidth=2.6*Z(); ctx.stroke();
      box(g+sz*.08,y+sz*.6,.62,.46,EL-1,EL+16,'#7C8A6E');
      box(g+sz*.06,y+sz*.58,.68,.5,EL+16,EL+18,C.slate); }
    if (lv>=2) { box(g+sz*.56,y+sz*.6,.66,.54,EL-1,EL+24,'#6E736F');
      gableR(g+sz*.52,y+sz*.56,.78,.62,EL+24,EL+34,C.slate);
      box(g+sz*.14,y+sz*.32,1.0,.16,EL+10,EL+15,C.steel); }
    if (lv>=3) { box(g+sz*.06,y+sz*.06,.56,.48,EL-1,EL+32,'#8A6E3E');
      pyr(g+sz*.04,y+sz*.04,.62,.54,EL+32,EL+42,C.slate); }
  } else if (d.kind === 'smelt') {
    box(g+.2,y+.2,sz-.4,sz-.4,0,EL,C.asphalt);
    if (lv>=1) {
      box(g+sz*.1,y+sz*.14,.9,.7,EL,EL+34,'#6E736F');
      gableR(g+sz*.06,y+sz*.1,.98,.78,EL+34,EL+46,C.slate);
      box(g+sz*.62,y+sz*.2,.36,.36,EL,EL+30,C.brick);
      box(g+sz*.68,y+sz*.26,.22,.22,EL+30,EL+62,sh(C.brick,.8));
      if ((S.nodes[id].make.roxor||0)>0) smoke(g+sz*.79,y+sz*.37,EL+62);
      const c = iso(g+sz*.3,y+sz*.9,EL+10);
      ctx.beginPath(); ctx.arc(c.x,c.y,5*Z(),0,7);
      ctx.fillStyle = (S.nodes[id].make.roxor||S.nodes[id].make.traverza)?'#E3743C':'#4E4640'; ctx.fill(); }
    if (lv>=2) { box(g+sz*.12,y+sz*.62,.8,.5,EL,EL+26,C.steel);
      gableR(g+sz*.08,y+sz*.58,.88,.58,EL+26,EL+36,C.slate);
      box(g+sz*.66,y+sz*.66,.3,.3,EL,EL+44,sh(C.brick,.9)); }
    if (lv>=3) { box(g+sz*.66,y+sz*.06,.44,.4,EL,EL+40,C.concrete);
      pyr(g+sz*.63,y+sz*.03,.5,.46,EL+40,EL+52,C.slate);
      for (let i=0;i<3;i++) box(g+sz*.2+i*.3,y+sz*.02,.18,.18,EL,EL+12,'#8C6A5A'); }
  } else {   // uhlí
    box(g+.3,y+.3,sz-.6,sz-.6,EL-8,EL-1,'#2E3134');
    for (let i=0;i<3;i++) box(g+.5+i*.4,y+.6,.32,.32,EL-1,EL+6+i*3,C.coal);
    if (lv>=1) {
      [[0,0],[1,0],[0,1],[1,1]].forEach(p=>box(g+sz*.48+p[0]*.48,y+sz*.14+p[1]*.48,.12,.12,EL,EL+38,C.steel));
      box(g+sz*.46,y+sz*.12,.72,.72,EL+38,EL+42,C.steel);
      const c = iso(g+sz*.48+.3,y+sz*.14+.3,EL+44);
      ctx.beginPath(); ctx.arc(c.x,c.y,6*Z(),0,7);
      ctx.strokeStyle=C.steel; ctx.lineWidth=2.4*Z(); ctx.stroke();
      box(g+sz*.1,y+sz*.58,.56,.4,EL-1,EL+14,'#7C8A6E');
      box(g+sz*.08,y+sz*.56,.62,.44,EL+14,EL+16,C.slate); }
    if (lv>=2) { hall(.56,.58,.58,.48,sh(C.steel,.8),C.slate);
      box(g+sz*.18,y+sz*.3,.9,.14,EL+10,EL+14,C.steel); }
    if (lv>=3) { box(g+sz*.08,y+sz*.08,.5,.44,EL-1,EL+26,'#8A6E3E');
      box(g+sz*.16,y+sz*.16,.16,.16,EL+26,EL+40,C.woodD); }
    if (lv>=4) {   // úpravna uranu — zelené stínění a nádrže
      box(g+sz*.56,y+sz*.1,.6,.5,EL-1,EL+24,'#4E6A46');
      gableR(g+sz*.52,y+sz*.06,.7,.58,EL+24,EL+34,'#3E5438');
      box(g+sz*.62,y+sz*.66,.3,.3,EL-1,EL+20,'#7FC24A');
      box(g+sz*.6,y+sz*.64,.34,.34,EL+20,EL+23,'#5E8A3E');
      const c = iso(g+sz*.77,y+sz*.81,EL+26);
      ctx.beginPath(); ctx.arc(c.x,c.y,4*Z(),0,7);
      ctx.fillStyle = (S.nodes[id].make.uran||0)>0 ? '#7FC24A' : '#3E5438'; ctx.fill(); }
    if (lv>=5) { box(g+sz*.1,y+sz*.1,.44,.44,EL-1,EL+34,C.concrete);
      pyr(g+sz*.08,y+sz*.08,.5,.5,EL+34,EL+44,'#4E6A46'); }
  }
}

/* ─── oplocení průmyslových areálů ───
   Dílek se kreslí zvlášť, aby se správně řadil za budovy.
   Mezi dvěma sousedními oplocenými platformami se plot nekreslí —
   areály se spojí v jeden.                                            */
const FENCED = [1, 5, 7];
function fenceTileSet() {
  const set = new Set();
  FENCED.forEach(i => { if (!platOpen(i)) return;
    const pl = PLAT(i);
    for (let y=0;y<PSZ;y++) for (let x=0;x<PSZ;x++) set.add((pl.ox+x)+','+(pl.oy+y));
  });
  return set;
}
function fencePiece(gx, gy, dir, col) {
  const horiz = dir === 'h';
  const L = 1.0, T = .12;                       // délka dílku a tloušťka
  const px = gx, py = gy;
  const w = horiz ? L : T, dp = horiz ? T : L;
  /* sokl */
  box(px, py, w, dp, EL, EL+4, sh(C.concrete,.62));
  /* výplň — plný panel, aby byl plot čitelný i z dálky */
  box(px+(horiz?0:.03), py+(horiz?.03:0), horiz?w:T*.5, horiz?T*.5:dp, EL+4, EL+17, sh(col,.78));
  /* sloupky na koncích a uprostřed */
  [0, .5, 1].forEach(t => {
    const sx = px + (horiz ? t*(L-T) : 0), sy = py + (horiz ? 0 : t*(L-T));
    box(sx, sy, T, T, EL, EL+21, sh(C.concrete,.9));
    box(sx-.01, sy-.01, T+.02, T+.02, EL+21, EL+23, col);
  });
  /* horní vzpěra */
  box(px+(horiz?0:.02), py+(horiz?.02:0), horiz?w:T*.6, horiz?T*.6:dp, EL+17, EL+20, col);
}
function platFence(pl) {
  const m = MAPS[pl.id], inside = FENCE_TILES, out = [];
  const free = (x,y) => !inside.has(x+','+y);      // za plotem už není jiný areál
  for (let x=0;x<PSZ;x++) {
    const gx = pl.ox+x;
    if (m[0][x] !== 'R' && free(gx, pl.oy-1))         out.push([gx, pl.oy-0.12, 'h']);
    if (m[PSZ-1][x] !== 'R' && free(gx, pl.oy+PSZ))   out.push([gx, pl.oy+PSZ, 'h']);
  }
  for (let y=0;y<PSZ;y++) {
    const gy = pl.oy+y;
    if (m[y][0] !== 'R' && free(pl.ox-1, gy))         out.push([pl.ox-0.12, gy, 'v']);
    if (m[y][PSZ-1] !== 'R' && free(pl.ox+PSZ, gy))   out.push([pl.ox+PSZ, gy, 'v']);
  }
  return out;
}
let FENCE_TILES = new Set();

function emptyPlot(gx,gy,sp) {
  sp = sp || 2; const w = sp-.2;
  box(gx+.1,gy+.1,w,w,0,EL-2,sh(C.dirt,.95));
  const n = sp*2;
  for (let i=0;i<=n;i++) { const t=i/n;
    box(gx+.06+t*w,gy+.02,.09,.09,EL,EL+11,C.woodD);
    box(gx+.02,gy+.06+t*w,.09,.09,EL,EL+11,C.woodD); }
}

/* ─── popisky ─── */
function pill(gx,gy,span,txt,bg,fg,size,lift) {
  const c = iso(gx+span/2,gy+span/2,0), y = c.y-(span*TH/2)*Z()-(lift||5);
  ctx.font = `700 ${size}px Inter,system-ui,sans-serif`;
  const w = ctx.measureText(txt).width+11, h = size+8;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(c.x-w/2+1.5,y-h+2,w,h);
  ctx.fillStyle = bg; ctx.fillRect(c.x-w/2,y-h,w,h);
  ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 1; ctx.strokeRect(c.x-w/2,y-h,w,h);
  ctx.fillStyle = fg; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(txt,c.x,y-h/2+.5);
  return { x:c.x, y:y-h/2, w, h };
}
function progPill(gx,gy,span,label,frac,step) {
  const c = iso(gx+span/2,gy+span/2,0), y = c.y-(span*TH/2)*Z()-5;
  ctx.font = '700 9px Inter,system-ui,sans-serif';
  const lw = ctx.measureText(label).width;
  ctx.font = '700 8px Inter,system-ui,sans-serif';
  const sw = step ? ctx.measureText(step).width : 0;
  const w = Math.max(84, lw+16, sw+16), h = step ? 33 : 24;
  const x = c.x-w/2, ty = y-h;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x+1.5,ty+2,w,h);
  ctx.fillStyle = 'rgba(10,14,12,.94)'; ctx.fillRect(x,ty,w,h);
  ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1; ctx.strokeRect(x,ty,w,h);
  ctx.textAlign='center'; ctx.textBaseline='middle';
  if (step) { ctx.font='700 8px Inter,system-ui,sans-serif'; ctx.fillStyle=C.sky;
    ctx.fillText(step, c.x, ty+7); }
  ctx.font = '700 9px Inter,system-ui,sans-serif'; ctx.fillStyle = '#DCE3D6';
  ctx.fillText(label, c.x, ty+(step?18:8));
  const bx = x+4, by = ty+h-9, bw = w-8, bh = 5;
  ctx.fillStyle = '#050806'; ctx.fillRect(bx,by,bw,bh);
  ctx.fillStyle = C.sky; ctx.fillRect(bx,by,bw*Math.max(0,Math.min(1,frac)),bh);
  return { x:c.x, y:ty+h/2, w, h };
}
function faultMark(gx,gy,span) {
  const c = iso(gx+span/2,gy+span/2,0), y = c.y-(span*TH/2)*Z()-6;
  const pu = .55+.45*Math.abs(Math.sin(pulse/18)), r = 12;
  ctx.beginPath(); ctx.arc(c.x,y-r,r,0,7);
  ctx.fillStyle = 'rgba(30,10,8,.94)'; ctx.fill();
  ctx.strokeStyle = C.red; ctx.lineWidth = 2; ctx.globalAlpha = pu; ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = C.red; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.font = '800 15px Inter,system-ui,sans-serif';
  ctx.fillText('!', c.x, y-r+.5);
  return { x:c.x, y:y-r, w:r*2, h:r*2 };
}
function lockMark(gx,gy,span,col,lv,sym) {
  const c = iso(gx+span/2,gy+span/2,0), y = c.y-(span*TH/2)*Z()-6, r = 9;
  ctx.beginPath(); ctx.arc(c.x,y-r,r,0,7);
  ctx.fillStyle = 'rgba(14,18,16,.92)'; ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.fillStyle = col; ctx.textAlign='center'; ctx.textBaseline='middle';
  if (lv) { ctx.font='700 8px Inter,system-ui,sans-serif'; ctx.fillText(lv, c.x, y-r+.5); }
  else if (sym) { ctx.font='800 11px Inter,system-ui,sans-serif'; ctx.fillText(sym, c.x, y-r+.5); }
  else { ctx.lineWidth=1.5; ctx.strokeRect(c.x-3, y-r-0.4, 6, 5.4);
    ctx.beginPath(); ctx.arc(c.x, y-r-0.4, 2.2, Math.PI, 0); ctx.stroke(); }
}
function ring(gx,gy,span) {
  const c = iso(gx+span/2,gy+span/2,0), r = (.62+.06*Math.sin(pulse/16))*span*TW*Z()*.5;
  ctx.save(); ctx.translate(c.x,c.y); ctx.scale(1,.5); ctx.beginPath(); ctx.arc(0,0,r,0,7);
  ctx.strokeStyle = C.amber; ctx.lineWidth = 3*Z(); ctx.globalAlpha = .5+.25*Math.sin(pulse/16);
  ctx.stroke(); ctx.restore(); ctx.globalAlpha = 1;
}

/* ═══════════ ŽIVOT NA MAPĚ ═══════════
   Není to simulace dopravy — je to divadlo. Auta jezdí po silnicích,
   lidé chodí kolem obydlí, při poruše přijedou hasiči.               */
let agents = [];
const AG_MAX = 26;
const CAR_COL = ['#C4503C','#4E6E92','#C9B25A','#7C8A6E','#9A6BA0','#C4763F','#D6D9D2','#5A6470'];

function platAt(gx,gy) {
  for (const pl of PLATFORMS) {
    if (!platOpen(pl.id)) continue;
    if (gx>=pl.ox && gx<pl.ox+PSZ && gy>=pl.oy && gy<pl.oy+PSZ) return pl;
  }
  return null;
}
function charAt(gx,gy) {
  const pl = platAt(gx,gy);
  if (!pl) return null;
  return MAPS[pl.id][Math.floor(gy)-pl.oy][Math.floor(gx)-pl.ox];
}
const isRoad = (gx,gy) => charAt(gx,gy) === 'R';

/* kolik ruchu si město zaslouží */
function trafficWanted() {
  let cars = 0, peds = 0;
  PIDS.forEach(id => { const D = defOf(id), st = S.plot[id];
    if (!D || !st.done || st.off || isBroken('p:'+id)) return;
    if (D.name === 'Obchodní centrum' || D.name === 'Parkoviště') cars += 2;
    else if (D.name === 'Mrakodrap') { cars += 3; peds += 2; }
    else if (D.name === 'Hotel') { cars += 1; peds += 2; }
    else if (D.needPower && D.rent) { cars += 1; peds += 2; }
    else if (D.rent) peds += 1;
    if (D.name === 'Aquapark' || D.name === 'Horská dráha' || D.name === 'Kolotoč') peds += 3;
  });
  return { cars: Math.min(cars, 12), peds: Math.min(peds, 14) };
}
function spawnCar() {
  const open = PLATFORMS.filter(p => platOpen(p.id));
  if (!open.length) return;
  const pl = open[Math.floor(Math.random()*open.length)], m = MAPS[pl.id];
  const lines = [];
  for (let i=0;i<PSZ;i++) {
    if (m[i][0]==='R' && m[i][PSZ-1]==='R') lines.push({h:true, i});
    if (m[0][i]==='R' && m[PSZ-1][i]==='R') lines.push({h:false, i});
  }
  if (!lines.length) return;
  const L = lines[Math.floor(Math.random()*lines.length)];
  const back = Math.random() < .5, sp = .012 + Math.random()*.012;
  const lane = back ? .62 : .24;
  const col = CAR_COL[Math.floor(Math.random()*8)];
  agents.push(L.h
    ? { t:'car', x: back ? pl.ox+PSZ-.2 : pl.ox+.2, y: pl.oy+L.i+lane,
        dx: back ? -sp : sp, dy:0, life:1, c:col,
        x0:pl.ox-.5, x1:pl.ox+PSZ+.5, y0:pl.oy-.5, y1:pl.oy+PSZ+.5 }
    : { t:'car', x: pl.ox+L.i+lane, y: back ? pl.oy+PSZ-.2 : pl.oy+.2,
        dx:0, dy: back ? -sp : sp, life:1, c:col,
        x0:pl.ox-.5, x1:pl.ox+PSZ+.5, y0:pl.oy-.5, y1:pl.oy+PSZ+.5 });
}
function spawnPed() {
  const homes = PIDS.filter(id => { const D = defOf(id), st = S.plot[id];
    return D && D.rent && st.done && !st.off && !isBroken('p:'+id); });
  if (!homes.length) return;
  const id = homes[Math.floor(Math.random()*homes.length)];
  const p = PARC[id], sp = spanOf(id);
  const a = Math.random()*Math.PI*2;
  agents.push({ t:'ped', x: p.gx+sp/2+Math.cos(a)*(sp/2+.6), y: p.gy+sp/2+Math.sin(a)*(sp/2+.6),
    dx: Math.cos(a+1.6)*.006, dy: Math.sin(a+1.6)*.006, life:1,
    c: ['#D8CBB0','#C4503C','#4E6E92','#8FA45C','#C9B25A'][Math.floor(Math.random()*5)],
    ttl: 400+Math.random()*500 });
}
/* ─── hasiči jezdí po silnici ─── */
const ROADS = new Set(Object.keys(ROAD_DIR));
const RK = (x,y) => x+','+y;
/* nejbližší silnice k budově */
function nearestRoad(gx, gy) {
  let best = null, bd = 1e9;
  for (let r=0;r<=5;r++) for (let dx=-r;dx<=r;dx++) for (let dy=-r;dy<=r;dy++) {
    const x = gx+dx, y = gy+dy;
    if (!ROADS.has(RK(x,y))) continue;
    const d = dx*dx+dy*dy;
    if (d < bd) { bd = d; best = [x,y]; }
  }
  return best;
}
/* cesta po silnicích: od vzdáleného místa až k cíli */
function roadPath(tx, ty, want) {
  const start = RK(tx,ty);
  const prev = { [start]: null }, q = [[tx,ty]];
  let far = [tx,ty], depth = { [start]: 0 }, maxD = 0;
  while (q.length) {
    const [x,y] = q.shift(), d = depth[RK(x,y)];
    if (d > maxD) { maxD = d; far = [x,y]; }
    if (d >= want) break;
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy]) => {
      const nx = x+dx, ny = y+dy, k = RK(nx,ny);
      if (!ROADS.has(k) || prev[k] !== undefined) return;
      prev[k] = [x,y]; depth[k] = d+1; q.push([nx,ny]);
    });
  }
  const path = [];
  let cur = far;
  while (cur) { path.push(cur); cur = prev[RK(cur[0],cur[1])]; }
  return path;                       // od vzdáleného bodu k cíli
}
function spawnFire(gx, gy, ms) {
  agents = agents.filter(a => a.t !== 'fire');
  const near = nearestRoad(gx, gy);
  if (!near) return;                 // bez silnice hasiči nedojedou
  const path = roadPath(near[0], near[1], 14);
  if (path.length < 2) return;
  const pts = path.map(p => [p[0]+.5, p[1]+.5]);
  let len = 0;
  for (let i=1;i<pts.length;i++) len += Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]);
  const frames = Math.max(24, Math.round((ms||6000)/32));
  agents.push({ t:'fire', x:pts[0][0], y:pts[0][1], pts, i:0,
    sp: len/frames, dx:0, dy:0, life:1, ttl:frames+260 });
}
/* posun po trase */
function stepFire(a) {
  if (a.i >= a.pts.length-1) { a.dx = a.dy = 0; return; }
  const n = a.pts[a.i+1];
  const dx = n[0]-a.x, dy = n[1]-a.y, d = Math.hypot(dx,dy);
  if (d <= a.sp) { a.x = n[0]; a.y = n[1]; a.i++; a.dx = dx; a.dy = dy; return; }
  a.dx = dx/d*a.sp; a.dy = dy/d*a.sp;
  a.x += a.dx; a.y += a.dy;
}
function stepAgents() {
  const w = trafficWanted();
  const cars = agents.filter(a=>a.t==='car').length;
  const peds = agents.filter(a=>a.t==='ped').length;
  if (cars < w.cars && Math.random() < .06) spawnCar();
  if (peds < w.peds && Math.random() < .05) spawnPed();
  agents.forEach(a => {
    if (a.t==='fire') { stepFire(a); if (a.ttl !== undefined) { a.ttl--; if (a.ttl<0) a.life=0; } return; }
    a.x += a.dx; a.y += a.dy;
    if (a.ttl !== undefined) { a.ttl--; if (a.ttl < 0) a.life = 0; }
    if (a.t==='ped') { if (Math.random()<.02) { const an=Math.random()*Math.PI*2;
      a.dx=Math.cos(an)*.006; a.dy=Math.sin(an)*.006; }
      const c = charAt(a.x, a.y); if (c === 'W' || c === 'V' || c === null) a.life = 0; }
    if (a.t==='car') {           // auto nesmí sjet z platformy ani na vodu
      if (a.x < a.x0 || a.x > a.x1 || a.y < a.y0 || a.y > a.y1) a.life = 0;
      else { const c = charAt(a.x, a.y); if (c === 'W' || c === 'V' || c === null) a.life = 0; }
    }
    if (a.x < WB.x0-3 || a.x > WB.x1+3 || a.y < WB.y0-3 || a.y > WB.y1+3) a.life = 0;
  });
  if (agents.length > AG_MAX) agents.splice(0, agents.length-AG_MAX);
  agents = agents.filter(a => a.life > 0);
}
function drawCar(a) {
  const horiz = Math.abs(a.dx) > Math.abs(a.dy);
  shadow(a.x-.16,a.y-.12,.32,.24);
  box(a.x-(horiz?.2:.11), a.y-(horiz?.11:.2), horiz?.4:.22, horiz?.22:.4, EL, EL+7, a.c);
  box(a.x-(horiz?.09:.07), a.y-(horiz?.07:.09), horiz?.18:.14, horiz?.14:.18, EL+7, EL+11, sh(a.c,.72));
}
function drawPed(a) {
  const p = iso(a.x, a.y, EL);
  ctx.fillStyle = 'rgba(10,16,8,.3)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y, 3.4*Z(), 1.7*Z(), 0, 0, 7); ctx.fill();
  box(a.x-.05, a.y-.05, .1, .1, EL, EL+8, a.c);
  box(a.x-.045, a.y-.045, .09, .09, EL+8, EL+11, '#C9A88A');
}
function drawFire(a) {
  const horiz = Math.abs(a.dx) >= Math.abs(a.dy);
  shadow(a.x-.22,a.y-.14,.44,.28);
  box(a.x-(horiz?.28:.14), a.y-(horiz?.14:.28), horiz?.56:.28, horiz?.28:.56, EL, EL+9, '#C4302C');
  box(a.x-(horiz?.12:.1), a.y-(horiz?.1:.12), horiz?.24:.2, horiz?.2:.24, EL+9, EL+15, '#8E2320');
  const c = iso(a.x, a.y, EL+17);
  ctx.beginPath(); ctx.arc(c.x,c.y,3.2*Z(),0,7);
  ctx.fillStyle = pulse%24<12 ? '#E3423C' : '#4E6E92'; ctx.fill();
}
const AG_DRAW = { car:drawCar, ped:drawPed, fire:drawFire };

/* ─── zóny a dekorace ─── */
const PARCEL_TILES = new Set();
PIDS.forEach(id => { const p = PARC[id], sp = spanOf(id);
  for (let y=p.gy-1;y<=p.gy+sp;y++) for (let x=p.gx-1;x<=p.gx+sp;x++) PARCEL_TILES.add(x+','+y); });
const stationZone = (x,y) => Object.values(NODE_DEF).some(d =>
  x>=d.gx-1 && x<=d.gx+2 && y>=d.gy-1 && y<=d.gy+2);
const inZone = (x,y) => stationZone(x,y) && !PARCEL_TILES.has(x+','+y);

const DECO = [];
/* lampy stojí u kraje silnice, ne náhodně v trávě */
function placeLamps(occupied) {
  const road = new Set();
  PLATFORMS.forEach(pl => { const m = MAPS[pl.id];
    for (let y=0;y<PSZ;y++) for (let x=0;x<PSZ;x++)
      if (m[y][x] === 'R') road.add((pl.ox+x)+','+(pl.oy+y)); });
  const isR = (x,y) => road.has(x+','+y);
  road.forEach(k => {
    const [x,y] = k.split(',').map(Number);
    const h = isR(x-1,y) || isR(x+1,y), v = isR(x,y-1) || isR(x,y+1);
    if (h && v) return;                       // na křižovatce ne
    if (h) {                                   // vodorovná — lampy nad a pod
      if ((x % 3) !== 0) return;
      [[y-1, .82], [y+1, .12]].forEach(([ny, off]) => {
        if (isR(x,ny) || occupied.has(x+','+ny) || !insidePlat(x,ny)) return;
        DECO.push({ x, y:ny, t:'lamp', v:off, arm: off > .5 ? -1 : 1, horiz:true });
      });
    } else if (v) {                            // svislá — lampy vlevo a vpravo
      if ((y % 3) !== 0) return;
      [[x-1, .82], [x+1, .12]].forEach(([nx, off]) => {
        if (isR(nx,y) || occupied.has(nx+','+y) || !insidePlat(nx,y)) return;
        DECO.push({ x:nx, y, t:'lamp', v:off, arm: off > .5 ? -1 : 1, horiz:false });
      });
    }
  });
}
function insidePlat(x,y) {
  const pl = PLATFORMS.find(p => x>=p.ox && x<p.ox+PSZ && y>=p.oy && y<p.oy+PSZ);
  if (!pl) return false;
  const c = MAPS[pl.id][y-pl.oy][x-pl.ox];
  return c !== 'W';               // do vody se lampa nestaví
}
(function () {
  const occupied = new Set();
  PIDS.forEach(id => { const p = PARC[id], sp = spanOf(id);
    for (let y=p.gy-1;y<=p.gy+sp;y++) for (let x=p.gx-1;x<=p.gx+sp;x++) occupied.add(x+','+y); });
  Object.values(NODE_DEF).forEach(d => {
    for (let y=d.gy-2;y<=d.gy+3;y++) for (let x=d.gx-2;x<=d.gx+3;x++) occupied.add(x+','+y); });
  COOL_SPOTS.forEach(c => { for (let y=c[1]-1;y<=c[1]+2;y++) for (let x=c[0]-1;x<=c[0]+2;x++) occupied.add(x+','+y); });
  PLATFORMS.forEach(pl => {
    const m = MAPS[pl.id];
    for (let y=0;y<PSZ;y++) for (let x=0;x<PSZ;x++) {
      const gx=x+pl.ox, gy=y+pl.oy, c=m[y][x], r=rnd(gx,gy);
      if (c==='R' || c==='W' || occupied.has(gx+','+gy)) continue;
      if (pl.id === 0) {
        if (c==='f') DECO.push({x:gx,y:gy,t:'tree',v:r});
        else if (c==='S') DECO.push({x:gx,y:gy,t:'rock',v:r});
        else if (c==='m') DECO.push({x:gx,y:gy,t:'wheat',v:r});
        else if (c==='h') DECO.push({x:gx,y:gy,t:'clay',v:r});
        else if (r>.9) DECO.push({x:gx,y:gy,t:r>.95?'bush':'stump',v:r});
      } else if (c==='D') {           // betonové plochy — technika, ne zeleň
        if (r>.86) DECO.push({x:gx,y:gy,t:r>.95?'hut':r>.91?'crate':'barrel',v:r});
      } else if (c==='B') {           // břeh — jen rákosí a keře, žádné stromy
        if (r>.62) DECO.push({x:gx,y:gy,t:r>.86?'bush':'reed',v:r});
      } else {                        // trávníky
        if (r>.72) DECO.push({x:gx,y:gy,t:r>.93?'bush':'tree',v:r});
      }
    }
  });
  placeLamps(occupied);
})();

let tufts = [];
for (let i=0;i<40;i++) tufts.push({
  x:PARC.p1.gx+.15+Math.random()*1.7, y:PARC.p1.gy+.15+Math.random()*1.7,
  h:9+Math.random()*10, w:3+Math.random()*3,
  c:Math.random()<.35?'#9DAC55':'#87994B', alive:true });
const mowLeftN = () => tufts.filter(t=>t.alive).length;

const inSel = (x,y,id) => { const p = PARC[id], sp = spanOf(id);
  return x>=p.gx-1 && x<p.gx+sp+1 && y>=p.gy-1 && y<p.gy+sp+1; };

function waterTower(gx,gy,ph,lvl,sp) {
  sp = sp||3;
  if (ph>=3) castShadow(gx+.2,gy+.2,sp-.4,sp-.4, 90); const w = sp-.5, x = gx+.25, y = gy+.25;
  const live = waterLive();
  if (ph>=1) { shadow(gx+.15,gy+.15,sp-.3,sp-.3); box(x,y,w,w,0,EL+4,C.asphalt); }
  if (ph>=2) box(x+w*.1,y+w*.1,w*.5,w*.5,EL+4,EL+16,C.concrete);
  if (ph>=3) [[0,0],[1,0],[0,1],[1,1]].forEach(p=>
    box(x+w*.12+p[0]*w*.38,y+w*.12+p[1]*w*.38,.16,.16,EL+16,EL+54,C.steel));
  if (ph>=4) { box(x+w*.62,y+w*.14,w*.3,w*.3,EL+4,EL+18,sh(C.concrete,.9));
    box(x+w*.66,y+w*.5,w*.24,.16,EL+8,EL+12,C.steel); }
  if (ph>=5) { // nádrž
    const tz = EL+54, r = w*.62;
    box(x+w*.04,y+w*.04,r,r,tz,tz+26,C.sky==='#77AEC9'?'#8FB6C6':C.sky);
    pyr(x+w*.01,y+w*.01,r+.06,r+.06,tz+26,tz+38,C.slate);
    for (let i=0;i<3;i++) box(x+w*.06,y+w*.08+i*(r*.3),r-.08,.06,tz+8+i*7,tz+9+i*7,sh('#8FB6C6',.75)); }
  if (ph>=6) {
    if (lvl>=2) { box(x+w*.58,y+w*.56,w*.34,w*.34,EL+4,EL+34,'#8FB6C6');
      pyr(x+w*.55,y+w*.53,w*.4,w*.4,EL+34,EL+44,C.slate); }
    if (lvl>=3) { box(x+w*.06,y+w*.66,w*.3,w*.28,EL+4,EL+30,'#8FB6C6');
      pyr(x+w*.03,y+w*.63,w*.36,w*.34,EL+30,EL+38,C.slate); }
    box(x-.14,y+w*.4,.24,w*.24,EL+4,EL+7,C.concrete);
    const c = iso(x+.02,y+w*.5,EL+18);
    ctx.beginPath(); ctx.arc(c.x,c.y,4*Z(),0,7);
    ctx.fillStyle = live?C.sky:C.red; ctx.fill();
  }
}
function ironHall(gx,gy,ph,lvl,sp) {
  sp = sp||3;
  if (ph>=2) castShadow(gx+.2,gy+.2,sp-.4,sp-.4, 40); const w = sp-.4, x = gx+.2, y = gy+.2;
  if (ph>=1) { shadow(gx+.15,gy+.15,sp-.3,sp-.3); box(x,y,w,w,0,EL+3,C.asphalt); }
  if (ph>=2) { box(x+.06,y+.06,w-.12,w*.62,EL+3,EL+26,'#8E959C');
    for (let i=0;i<4;i++) box(x+.1+i*(w*.22),y+.04,.1,.1,EL+3,EL+28,C.steel); }
  if (ph>=3) {
    gableR(x+.02,y+.02,w-.04,w*.7,EL+26,EL+38,C.slate);
    poly([iso(x+w-.06,y+w*.2,EL+22),iso(x+w-.06,y+w*.5,EL+22),
          iso(x+w-.06,y+w*.5,EL+5),iso(x+w-.06,y+w*.2,EL+5)], 'rgba(28,26,24,.6)');
    const heaps = Math.min(3, Math.max(1, lvl));
    for (let i=0;i<heaps;i++) {
      const hx = x+.14+i*(w*.3), hy = y+w*.76;
      box(hx,hy,.42,.34,EL+3,EL+9+i*3,'#8C6A5A');
      box(hx+.1,hy+.06,.24,.2,EL+9+i*3,EL+14+i*3,sh('#8C6A5A',.86)); }
    if (lvl>=2) { box(x+w*.62,y+.06,w*.32,w*.5,EL+3,EL+30,'#7E8890');
      gableR(x+w*.59,y+.03,w*.38,w*.56,EL+30,EL+40,C.slate); }
    if (lvl>=3) { box(x-.16,y+w*.3,.3,w*.3,EL+3,EL+6,C.concrete);
      box(x+w*.2,y+w*.36,.5,.16,EL+3,EL+8,'#9CA3AA'); }
    if (lvl>=4) { box(x+w*.06,y+w*.06,.34,.34,EL+3,EL+44,C.steel);
      box(x+w*.02,y+w*.02,.42,.42,EL+44,EL+48,C.slate); }
  }
}
function portB(gx,gy,ph,kind,sp) {
  sp = sp||4; const w = sp-.4, x = gx+.2, y = gy+.2;
  if (ph>=1) { shadow(gx+.15,gy+.15,sp-.3,sp-.3); box(x,y,w,w,0,EL+5,C.asphalt); }
  if (kind === 'cargo') {
    if (ph>=2) for (let i=0;i<3;i++) box(x+w*.06,y+w*(.1+i*.3),w*.5,w*.22,EL+5,EL+20,
      ['#C4503C','#4E6E92','#8FA45C'][i]);
    if (ph>=3) { for (let i=0;i<2;i++) {
        const px = x+w*(.62+i*.2);
        box(px,y+w*.1,.16,.16,EL+5,EL+52,C.steel);
        box(px,y+w*.7,.16,.16,EL+5,EL+52,C.steel);
        box(px-.02,y+w*.08,.2,w*.66,EL+52,EL+58,C.steel);
        box(px+.02,y+w*.06,.1,.5,EL+44,EL+50,'#C9B25A'); } }
    if (ph>=4) for (let i=0;i<4;i++) box(x+w*(.08+ (i%2)*.26), y+w*(.1+ ((i/2)|0)*.3),
      w*.22, w*.2, EL+20, EL+34, ['#8E959C','#C4763F','#4E6E92','#8FA45C'][i]);
    if (ph>=5) { box(x+w*.06,y+w*.86,w*.5,w*.14,EL+5,EL+26,C.concrete);
      gableR(x+w*.03,y+w*.83,w*.56,w*.2,EL+26,EL+34,C.slate); }
  } else {
    if (ph>=2) box(x+w*.1,y+w*.1,w*.6,w*.5,EL+5,EL+30,'#DCD2BC');
    if (ph>=3) { box(x+w*.1,y+w*.1,w*.6,w*.5,EL+30,EL+46,'#E4DCC6');
      for (let i=0;i<3;i++) poly([iso(x+w*.7,y+w*(.14+i*.16),EL+42),iso(x+w*.7,y+w*(.22+i*.16),EL+42),
        iso(x+w*.7,y+w*(.22+i*.16),EL+34),iso(x+w*.7,y+w*(.14+i*.16),EL+34)],'rgba(200,232,240,.55)'); }
    if (ph>=4) { pyr(x+w*.06,y+w*.06,w*.68,w*.58,EL+46,EL+58,'#4E7A8C');
      box(x+w*.36,y+w*.68,.12,.12,EL+5,EL+40,C.steel);
      box(x+w*.3,y+w*.66,.3,.18,EL+34,EL+40,'#C4503C'); }
  }
}
/* lodě u mola */
function ship(gx, gy, kind, away, prog) {
  const off = away ? Math.min(1, prog*2.2) * 9 : 0;      // vyplouvá na východ
  const x = gx + off, y = gy - off*.15;
  if (away && prog > 0.5) return;                        // za obzorem
  const L = kind==='cargo' ? 3.0 : 2.4, Wd = kind==='cargo' ? 1.0 : .8;
  ctx.save(); ctx.globalAlpha = away ? Math.max(0, 1-prog*2.2) : 1;
  shadow(x, y, L, Wd);
  box(x, y, L, Wd, EL-6, EL+2, kind==='cargo' ? '#3A4E5E' : '#E4DCC6');
  box(x+.1, y+.08, L-.2, Wd-.16, EL+2, EL+5, kind==='cargo' ? '#4E6478' : '#F0EADA');
  if (kind === 'cargo') {
    box(x+L-.9, y+.1, .8, Wd-.2, EL+5, EL+16, '#8E959C');
    for (let i=0;i<4;i++) box(x+.25+i*.42, y+.16, .34, Wd-.32, EL+5, EL+11,
      ['#C4503C','#4E6E92','#8FA45C','#C4763F'][i]);
    box(x+L-.55, y+Wd*.4, .16, .16, EL+16, EL+26, '#C4302C');
  } else {
    box(x+.3, y+.12, L-.8, Wd-.24, EL+5, EL+13, '#F4F0E4');
    box(x+.5, y+.18, L-1.3, Wd-.36, EL+13, EL+20, '#FBF8EE');
    box(x+L-.7, y+Wd*.35, .18, .18, EL+20, EL+30, '#3C7C9A');
    for (let i=0;i<5;i++) box(x+.4+i*.32, y+.06, .12, .06, EL+7, EL+9, '#4E7A8C');
  }
  ctx.restore();
}
function pumpStation(gx,gy,done,sp) {
  sp = sp||2; const w = sp-.4, x = gx+.2, y = gy+.2;
  shadow(gx+.1,gy+.1,sp-.2,sp-.2);
  box(x,y,w,w,0,EL+3,C.asphalt);
  if (!done) return;
  box(x+w*.12,y+w*.12,w*.5,w*.44,EL+3,EL+20,C.steel);
  gableR(x+w*.08,y+w*.08,w*.58,w*.52,EL+20,EL+28,C.slate);
  box(x+w*.7,y+w*.2,.22,.22,EL+3,EL+26,'#8FB6C6');
  box(x+w*.16,y+w*.7,w*.6,.16,EL+3,EL+8,'#8FB6C6');
  const c = iso(x+w*.8,y+w*.55,EL+14);
  ctx.beginPath(); ctx.arc(c.x,c.y,3.4*Z(),0,7);
  ctx.fillStyle = waterLive()?C.sky:C.red; ctx.fill();
}
function drawBuilding(k) {
  if (!inThisWorld(PLAT(PARC[k].plat))) return;   // cizí svět se nekreslí
  const D = defOf(k), st = S.plot[k], p = PARC[k], sp = spanOf(k);
  if (isPump(k)) {
    if (st.phase < 1) { emptyPlot(p.gx,p.gy,sp); return; }
    waterTower(p.gx,p.gy,st.phase,S.pump.lvl,sp); return;
  }
  if (isIronStore(k)) {
    if (st.phase < 1) { emptyPlot(p.gx,p.gy,sp); return; }
    ironHall(p.gx,p.gy,st.phase,S.iron.lvl,sp); return;
  }
  if (isPort(k)) {
    if (st.phase < 1) { emptyPlot(p.gx,p.gy,sp); return; }
    portB(p.gx,p.gy,st.phase,PARC[k].port,sp); return;
  }
  if (isPumpSt(k)) {
    if (!isOwned(k)) { emptyPlot(p.gx,p.gy,sp); return; }
    pumpStation(p.gx,p.gy,st.done,sp); return;
  }
  if (isPlant(k)) {
    if (st.phase < 1) { emptyPlot(p.gx,p.gy,sp); return; }
    powerPlant(p.gx,p.gy,st.phase,sp); return;
  }
  if (!isOwned(k) || !D || st.phase < 1) {
    emptyPlot(p.gx,p.gy,sp);
    const prev = (MODE.v==='detail' && MODE.id===k && isOwned(k) && !D && pickSel[k])
      ? BUILDINGS[pickSel[k]] : null;
    if (prev) { ctx.save(); ctx.globalAlpha = .5+.13*Math.sin(pulse/20);
      const vs = prev.vars[pickVar[k]||0].style;
      drawByKind(prev, p.gx, p.gy, prev.ph.length, 1, vs, sp);
      ctx.restore(); }
    return;
  }
  drawByKind(D, p.gx, p.gy, st.phase, st.hl, styleOf(k), sp);
}
function yard(gx,gy,ph,hl,st,sp) {
  sp = sp||3; const w = sp-.5, x = gx+.25, y = gy+.25;
  if (ph>=1) { shadow(gx+.15,gy+.15,sp-.3,sp-.3); box(x,y,w,w,0,EL+3,C.asphalt);
    for (let i=0;i<3;i++) box(x+.15,y+w*.62+i*.2,w-.3,.1,EL+3,EL+4,sh(C.asphalt,1.3)); }
  if (ph>=2) { for (let i=0;i<3;i++) box(x+.2+i*.42,y+.2,.34,w*.42,EL+3,EL+11+i*4,
      [C.log,C.stone,C.wheat][i]); }
  if (ph>=3) { box(x+w*.5,y+w*.5,w*.44,w*.4,EL+3,EL+26,st.wall);
    if (st.roofT==='gable') gableR(x+w*.46,y+w*.46,w*.52,w*.48,EL+26,EL+36,st.roof);
    else pyr(x+w*.46,y+w*.46,w*.52,w*.48,EL+26,EL+36,st.roof);
    poly([iso(x+w*.5,y+w*.9,EL+20),iso(x+w*.66,y+w*.9,EL+20),
          iso(x+w*.66,y+w*.9,EL+5),iso(x+w*.5,y+w*.9,EL+5)], sh(st.wall,.34));
    if (st.chim) box(x+w*.82,y+w*.56,.16,.16,EL+30,EL+44,C.brick); }
  if (ph>=4) { box(x+w*.06,y+w*.86,w*.36,.16,EL+3,EL+8,C.steel);
    box(x+w*.06,y+w*.84,.12,.12,EL+8,EL+26,C.steel);
    box(x+w*.02,y+w*.8,.5,.1,EL+26,EL+28,C.steel);
    for (let i=0;i<=3;i++) { const t=i/3;
      box(x-.06+t*w,y-.06,.1,.1,EL+3,EL+13,C.woodD);
      box(x-.06,y-.06+t*w,.1,.1,EL+3,EL+13,C.woodD); }
    if (hl>=2) { box(x+w*.06,y+w*.16,.5,.44,EL+3,EL+22,sh(st.wall,.95));
      gableR(x+w*.02,y+w*.12,.6,.54,EL+22,EL+30,st.roof); }
    if (hl>=3) { box(x+w*.62,y+w*.06,.44,.36,EL+3,EL+30,C.concrete);
      pyr(x+w*.6,y+w*.04,.5,.42,EL+30,EL+38,C.slate); } }
}
function parking(gx,gy,ph,hl,st,sp) {
  sp = sp||3; const w = sp-.3, x = gx+.15, y = gy+.15;
  if (ph>=1) { shadow(gx+.1,gy+.1,sp-.2,sp-.2); box(x,y,w,w,0,EL+3,sh(st.wall,.85)); }
  if (ph>=2) { box(x+.06,y+.06,w-.12,w-.12,EL+3,EL+4,st.wall);
    for (let i=0;i<5;i++) box(x+.12,y+.2+i*(w*.18),w-.24,.05,EL+4,EL+5,'#E4E2D6'); }
  if (ph>=3) { const cars=[['#B04A3C',.2,.24],['#4E6E92',.2,.42],['#C9B25A',.2,.6],
      ['#7C8A6E',w*.55,.3],['#9A6BA0',w*.55,.5],['#C4763F',w*.55,.7]];
    cars.forEach((c,i)=>{ if (i > (hl>=2?5:3)) return;
      box(x+c[1],y+c[2]*w*.9,.52,.3,EL+4,EL+11,c[0]);
      box(x+c[1]+.1,y+c[2]*w*.9+.03,.3,.24,EL+11,EL+15,sh(c[0],.72)); }); }
  if (ph>=4) {
    for (let i=0;i<4;i++) { const px = x+(i%2)*(w-.2)+.08, py = y+((i/2)|0)*(w-.2)+.08;
      box(px,py,.1,.1,EL+4,EL+30,C.steel);
      box(px-.06,py-.06,.22,.22,EL+30,EL+33,'#F0E7C2'); }
    box(x-.14,y+w*.36,.16,w*.26,EL+3,EL+6,C.concrete);
    box(x-.1,y+w*.34,.1,.1,EL+6,EL+18,C.steel);
    box(x-.1,y+w*.34,.1,.5,EL+15,EL+17,'#D9584A');
    if (hl>=3) { box(x,y,w,w,EL+34,EL+38,sh(st.wall,1.1));
      [[0,0],[1,0],[0,1],[1,1]].forEach(p=>box(x+.1+p[0]*(w-.3),y+.1+p[1]*(w-.3),.16,.16,EL+4,EL+34,C.concrete));
      for (let i=0;i<3;i++) box(x+.3+i*(w*.28),y+.3,.5,.3,EL+38,EL+45,['#8A9AA8','#B04A3C','#C9B25A'][i]); }
  }
}
function stall(gx,gy,ph,hl,st,sp) {
  sp = sp||2; const w = sp-.6, x = gx+.3, y = gy+.3;
  if (ph>=1) { shadow(gx+.2,gy+.2,sp-.4,sp-.4); box(x-.1,y-.1,w+.2,w+.2,0,EL+3,sh(C.asphalt,1.1)); }
  if (ph>=2) { box(x,y,w,w*.72,EL+3,EL+22,st.wall);
    poly([iso(x+w,y+w*.12,EL+18),iso(x+w,y+w*.6,EL+18),
          iso(x+w,y+w*.6,EL+9),iso(x+w,y+w*.12,EL+9)], 'rgba(30,26,20,.55)'); }
  if (ph>=3) {
    if (st.roofT==='gable') gableR(x-.12,y-.12,w+.24,w*.72+.24,EL+22,EL+31,st.roof);
    else pyr(x-.12,y-.12,w+.24,w*.72+.24,EL+22,EL+31,st.roof);
    if (st.chim) box(x+w*.72,y+w*.1,.12,.12,EL+27,EL+38,C.brick);
    /* markýza a stolky */
    box(x+w,y+w*.06,.42,w*.62,EL+19,EL+20,st.roof);
    box(x+w+.36,y+w*.08,.07,.07,EL+3,EL+20,C.steel);
    box(x+w+.36,y+w*.58,.07,.07,EL+3,EL+20,C.steel);
    if (hl>=2) { for (let i=0;i<2;i++) {
        box(x+w+.06+i*.28,y+w*.82,.2,.2,EL+3,EL+9,'#D8D2C0');
        box(x+w+.12+i*.28,y+w*.88,.07,.07,EL+9,EL+11,'#B0AA98'); } }
    if (hl>=3) { box(x-.42,y,.38,w*.7,EL+3,EL+18,sh(st.wall,.9));
      gableR(x-.48,y-.06,.5,w*.82,EL+18,EL+25,st.roof); }
  }
}
function carousel(gx,gy,ph,hl,st,sp) {
  sp = sp||2; const w = sp-.5, x = gx+.25, y = gy+.25, cx = x+w/2, cy = y+w/2;
  if (ph>=1) { shadow(gx+.15,gy+.15,sp-.3,sp-.3); box(x,y,w,w,0,EL+4,C.concrete); }
  if (ph>=2) box(cx-.1,cy-.1,.2,.2,EL+4,EL+30,C.steel);
  if (ph>=3) {
    const r = w*.42, n = 6, spin = gridLive() ? pulse/40 : 0;
    for (let i=0;i<n;i++) { const a = spin + i*Math.PI*2/n;
      const px = cx + Math.cos(a)*r - .11, py = cy + Math.sin(a)*r - .11;
      box(px,py,.22,.22,EL+8,EL+18, i%2?st.wall:sh(st.wall,1.15)); }
    pyr(x+.02,y+.02,w-.04,w-.04,EL+30,EL+44,st.roof);
  }
  if (ph>=4) {
    const r2 = w*.5;
    for (let i=0;i<8;i++) { const a = i*Math.PI/4;
      const px = cx + Math.cos(a)*r2 - .04, py = cy + Math.sin(a)*r2 - .04;
      box(px,py,.08,.08,EL+4,EL+9, gridLive()?'#F0E7C2':'#5A5F58'); }
    if (hl>=2) { box(x-.02,y-.02,w+.04,.08,EL+44,EL+48,st.roof);
      box(x-.02,y+w-.06,w+.04,.08,EL+44,EL+48,st.roof); }
    if (hl>=3) { pyr(x+.14,y+.14,w-.28,w-.28,EL+44,EL+58,sh(st.roof,1.1)); }
  }
}
/* trať se s vylepšením mění: základ → smyčka → prodloužená dráha */
function coasterTrack(x, y, w, hl) {
  const base = hl >= 3
    ? [[.1,.1,62],[.42,.05,86],[.78,.12,52],[.92,.42,74],[.72,.78,40],
       [.38,.92,58],[.06,.7,44],[.2,.38,92]]
    : [[.1,.1,54],[.5,.06,72],[.86,.2,44],[.9,.62,64],[.5,.9,36],[.08,.62,50],[.3,.45,80]];
  const sup = base.map(p => [x+w*p[0], y+w*p[1], p[2]]);
  const pts = base.map(p => [x+w*p[0]+.07, y+w*p[1]+.07, EL+p[2]]);
  if (hl >= 2) {                       // svislá smyčka mezi prvním a druhým kopcem
    const a = pts[1], b = pts[2];
    const dx = b[0]-a[0], dy = b[1]-a[1], d = Math.hypot(dx,dy) || 1;
    const ux = dx/d, uy = dy/d;
    const mx = (a[0]+b[0])/2, my = (a[1]+b[1])/2, mz = (a[2]+b[2])/2;
    const loop = [];
    for (let i=1;i<=14;i++) { const t = i/14*Math.PI*2;
      loop.push([ mx + ux*.55*Math.sin(t), my + uy*.55*Math.sin(t),
                  mz + 30*(1-Math.cos(t)) ]); }
    pts.splice(2, 0, ...loop);
  }
  return { pts, sup };
}
function coaster(gx,gy,ph,hl,st,sp) {
  sp = sp||4; const w = sp-.4, x = gx+.2, y = gy+.2;
  if (ph>=1) { shadow(gx+.15,gy+.15,sp-.3,sp-.3); box(x,y,w,w,0,EL+3,sh(C.grass,.9)); }
  const T = coasterTrack(x, y, w, ph>=5 ? hl : 1);
  if (ph>=2) T.sup.forEach(p => box(p[0],p[1],.14,.14,EL+3,EL+p[2],C.steel));
  if (ph>=3) {
    const rail = (z, col, lw) => {
      ctx.strokeStyle = col; ctx.lineWidth = lw*Z(); ctx.lineJoin = 'round';
      ctx.beginPath();
      T.pts.concat([T.pts[0]]).forEach((p,i) => { const q = iso(p[0],p[1],p[2]+z);
        i ? ctx.lineTo(q.x,q.y) : ctx.moveTo(q.x,q.y); });
      ctx.stroke();
    };
    rail(-6, sh(st.wall,.62), 1.6);
    rail(0,  st.wall, 3.2);
  }
  if (ph>=4) { box(x+w*.2,y+w*.72,w*.34,w*.2,EL+3,EL+20,st.roof);
    gableR(x+w*.17,y+w*.69,w*.4,w*.26,EL+20,EL+30,sh(st.roof,.85));
    if (gridLive()) {
      const n = T.pts.length, t = (pulse/(260 + (hl>=3?90:0))) % 1;
      for (let c=0;c<2+(hl>=3?1:0);c++) {
        const tc = (t - c*0.014 + 1) % 1;
        const sc = tc*n, i0 = Math.floor(sc), g = sc-i0;
        const q0 = T.pts[i0], q1 = T.pts[(i0+1)%n];
        const e = g*g*(3-2*g);
        const px = q0[0]+(q1[0]-q0[0])*e, py = q0[1]+(q1[1]-q0[1])*e,
              pz = q0[2]+(q1[2]-q0[2])*e;
        box(px-.1,py-.1,.2,.2,pz,pz+9, c===0?'#E3423C':c===1?'#A8302C':'#7C2320');
      }
    } }
  if (ph>=5) {
    for (let i=0;i<=4;i++) { const t2=i/4;
      box(x-.06+t2*w,y-.06,.08,.08,EL+3,EL+12,C.woodD);
      box(x-.06,y-.06+t2*w,.08,.08,EL+3,EL+12,C.woodD); }
    if (hl>=2) {   // servisní plošina u smyčky
      box(x+w*.56,y+w*.06,.3,.3,EL+3,EL+26,C.steel);
      box(x+w*.54,y+w*.04,.34,.34,EL+26,EL+29,C.slate); }
    if (hl>=3) {   // druhá nástupní hala
      box(x+w*.04,y+w*.5,w*.24,w*.2,EL+3,EL+18,sh(st.roof,.9));
      gableR(x+w*.01,y+w*.47,w*.3,w*.26,EL+18,EL+26,st.roof); }
  }
}
function aqua(gx,gy,ph,hl,st,sp) {
  sp = sp||4; const w = sp-.4, x = gx+.2, y = gy+.2;
  const live = waterLive();
  if (ph>=1) { shadow(gx+.15,gy+.15,sp-.3,sp-.3); box(x,y,w,w,0,EL+3,'#C9C2AE'); }
  if (ph>=2) { box(x+w*.06,y+w*.06,w*.5,w*.42,EL-2,EL+2, live?'#4FA0B8':'#5E6A68');
    box(x+w*.62,y+w*.1,w*.3,w*.28,EL-2,EL+2, live?'#63B4C6':'#5E6A68'); }
  if (ph>=3) { box(x+w*.08,y+w*.58,w*.44,w*.34,EL+3,EL+26,st.wall);
    gableR(x+w*.05,y+w*.55,w*.5,w*.4,EL+26,EL+36,st.roof); }
  if (ph>=4) {
    for (let i=0;i<3;i++) { const px = x+w*(.62+i*.11), py = y+w*.5;
      box(px,py,.12,.12,EL+3,EL+34+i*8,C.steel); }
    ctx.strokeStyle = live?'#7FD0E0':'#5E6A68'; ctx.lineWidth = 4*Z();
    const a=iso(x+w*.68,y+w*.54,EL+52), b=iso(x+w*.3,y+w*.3,EL+4);
    ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.quadraticCurveTo(a.x-20*Z(),b.y-20*Z(),b.x,b.y); ctx.stroke();
  }
  if (ph>=5) {
    for (let i=0;i<4;i++) box(x+w*(.12+i*.1),y+w*.44,.16,.1,EL+3,EL+6,'#E6E0CC');
    for (let i=0;i<=4;i++) { const t2=i/4;
      box(x-.06+t2*w,y-.06,.08,.08,EL+3,EL+12,'#9AA3A0');
      box(x-.06,y-.06+t2*w,.08,.08,EL+3,EL+12,'#9AA3A0'); }
    if (hl>=2) { box(x+w*.56,y+w*.62,w*.36,w*.3,EL+3,EL+30,sh(st.wall,.94));
      pyr(x+w*.53,y+w*.59,w*.42,w*.36,EL+30,EL+42,st.roof); }
    if (hl>=3) { box(x+w*.06,y+w*.06,w*.5,w*.42,EL+3,EL+40,sh(st.wall,1.05));
      pyr(x+w*.02,y+w*.02,w*.58,w*.5,EL+40,EL+56,st.roof); }
  }
}
function tower(gx,gy,ph,hl,st,sp) {
  sp = sp||4;
  if (ph>=5) castShadow(gx+.35,gy+.35,sp-.7,sp-.7, 130); const w = sp-.7, x = gx+.35, y = gy+.35;
  const floors = Math.max(0, ph-4), fh = 15;
  if (ph>=1) { shadow(gx+.2,gy+.2,sp-.4,sp-.4); box(gx+.2,gy+.2,sp-.4,sp-.4,0,EL+4,C.asphalt); }
  if (ph>=2) box(x-.1,y-.1,w+.2,w+.2,EL+4,EL+10,C.concrete);
  if (ph>=3) [[0,0],[1,0],[0,1],[1,1]].forEach(p=>
    box(x+p[0]*(w-.2),y+p[1]*(w-.2),.2,.2,EL+10,EL+26,C.steel));
  if (ph>=4) box(x+w*.36,y+w*.36,w*.28,w*.28,EL+10,EL+26+floors*fh,sh(C.concrete,.9));
  for (let f=0; f<Math.min(floors,16); f++) {
    const z0 = EL+26+f*fh, z1 = z0+fh;
    box(x,y,w,w,z0,z1, f%2?sh(st.wall,1.04):st.wall);
    if (f%2===0) for (let i=0;i<3;i++) {
      const wy = y+w*(.14+i*.28);
      poly([iso(x+w,wy,z1-3),iso(x+w,wy+w*.16,z1-3),
            iso(x+w,wy+w*.16,z0+3),iso(x+w,wy,z0+3)],
        gridLive()?'rgba(206,232,240,.55)':'rgba(60,66,58,.6)');
    }
  }
  const topZ = EL+26+Math.min(floors,16)*fh;
  if (ph>=18) { box(x+.06,y+.06,w-.12,w-.12,topZ,topZ+8,sh(st.roof,1.05));
    box(x+w*.3,y+w*.3,w*.4,w*.4,topZ+8,topZ+16,C.steel);
    box(x+w*.46,y+w*.46,.12,.12,topZ+16,topZ+42,C.steel);
    const c = iso(x+w*.52,y+w*.52,topZ+44);
    ctx.beginPath(); ctx.arc(c.x,c.y,3.4*Z(),0,7);
    ctx.fillStyle = pulse%60<30 ? '#E3423C' : '#5A2622'; ctx.fill(); }
  if (ph>=20) { box(gx+.24,gy+.24,.5,sp-.5,EL+4,EL+14,sh(st.wall,.9));
    for (let i=0;i<=3;i++) box(gx+.3+i*.5,gy+sp-.6,.14,.14,EL+4,EL+16,C.steel); }
}
function windmill(gx,gy,ph,hl,st,sp) {
  sp = sp||2;
  if (ph>=2) castShadow(gx+.6,gy+.6,.8,.8, 100); const cx = gx+sp/2, cy = gy+sp/2;
  const H = [64, 84, 108][Math.min(hl,3)-1] || 64;
  const R = [22, 28, 36][Math.min(hl,3)-1] || 22;
  if (ph>=1) { shadow(gx+.5,gy+.5,sp-1,sp-1);
    box(cx-.42,cy-.42,.84,.84,0,EL+5,sh(C.concrete,.8)); }
  if (ph>=2) { for (let i=0;i<5;i++) {
      const t = i/5, w = .3-t*.14;
      box(cx-w/2, cy-w/2, w, w, EL+5+t*H, EL+5+(t+.2)*H, sh(st.wall, 1-i*.02)); } }
  if (ph>=3) { box(cx-.2,cy-.16,.44,.32,EL+5+H,EL+5+H+11,sh(st.wall,.92));
    box(cx+.2,cy-.06,.14,.14,EL+5+H+2,EL+5+H+8,st.roof); }
  if (ph>=4) {
    const c = iso(cx+.28, cy, EL+11+H);
    const spin = gridLive() ? pulse/26 : pulse/300;
    ctx.strokeStyle = st.wall; ctx.lineWidth = 4.5*Z();
    ctx.lineCap = 'round';
    for (let a=0;a<3;a++) { const an = spin + a*Math.PI*2/3;
      ctx.beginPath(); ctx.moveTo(c.x,c.y);
      ctx.lineTo(c.x+Math.cos(an)*R*Z(), c.y+Math.sin(an)*R*Z()*.9); ctx.stroke(); }
    ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.arc(c.x,c.y,3.4*Z(),0,7); ctx.fillStyle = st.roof; ctx.fill();
    if (hl>=2) { const b = iso(cx-.36,cy-.36,EL+5);
      ctx.beginPath(); ctx.arc(b.x,b.y,2.6*Z(),0,7);
      ctx.fillStyle = gridLive()?'#E3423C':'#5A2622'; ctx.fill(); }
  }
}
function dam(gx,gy,ph,hl,st,sp) {
  sp = sp||4; const w = sp-.2, x = gx+.1, y = gy+.1;
  const live = gridLive();
  if (ph>=1) { shadow(gx+.1,gy+.1,sp-.2,sp-.2);
    box(x,y,w,w*.3,0,EL+2,sh(C.concrete,.6)); }
  if (ph>=2) box(x,y+w*.3,w,w*.16,0,EL+16,sh(st.wall,.86));
  if (ph>=3) { box(x,y+w*.3,w,w*.22,0,EL+34,st.wall);
    for (let i=0;i<6;i++) box(x+.2+i*(w*.14),y+w*.28,.14,.14,EL+34,EL+40,sh(st.wall,.7)); }
  if (ph>=4) { box(x+w*.62,y+w*.56,w*.32,w*.26,EL+2,EL+24,sh(st.wall,.94));
    gableR(x+w*.59,y+w*.53,w*.38,w*.32,EL+24,EL+34,st.roof); }
  if (ph>=5) {
    const n = Math.min(hl+1, 3);
    for (let i=0;i<n;i++) { const px = x+w*(.1+i*.18), py = y+w*.58;
      box(px,py,.36,.36,EL+2,EL+14,C.steel);
      const c = iso(px+.18,py+.18,EL+16);
      ctx.beginPath(); ctx.arc(c.x,c.y,5*Z(),0,7);
      ctx.fillStyle = live?'#7FC24A':'#4E5450'; ctx.fill(); } }
  if (ph>=6) {
    box(x,y+w*.3,w,.1,EL+34,EL+38,C.slate);
    for (let i=0;i<=6;i++) box(x+i*(w/6),y+w*.29,.08,.08,EL+38,EL+46,C.steel);
    /* přepad vody */
    if (live) for (let i=0;i<3;i++) {
      const px = x+w*(.22+i*.26), pz = EL+2;
      poly([iso(px,y+w*.52,EL+30),iso(px+.3,y+w*.52,EL+30),
            iso(px+.3,y+w*.58,pz),iso(px,y+w*.58,pz)], 'rgba(190,225,235,.42)'); }
    if (hl>=3) { box(x+w*.06,y+w*.06,w*.24,w*.2,EL+2,EL+30,sh(st.wall,1.05));
      pyr(x+w*.03,y+w*.03,w*.3,w*.26,EL+30,EL+42,st.roof); }
  }
}
function townHall(gx,gy,ph,hl,st,sp) {
  sp = sp||3; const w = sp-.6, x = gx+.3, y = gy+.3;
  if (ph>=1) { shadow(gx+.2,gy+.2,sp-.4,sp-.4); box(x-.1,y-.1,w+.2,w+.2,0,EL+5,'#B9AE96'); }
  if (ph>=2) box(x,y,w,w*.8,EL+5,EL+34,st.wall);
  if (ph>=3) { box(x,y,w,w*.8,EL+34,EL+50,sh(st.wall,1.05));
    for (let i=0;i<4;i++) poly([iso(x+w,y+w*(.1+i*.18),EL+46),iso(x+w,y+w*(.2+i*.18),EL+46),
      iso(x+w,y+w*(.2+i*.18),EL+36),iso(x+w,y+w*(.1+i*.18),EL+36)],'rgba(240,228,190,.5)'); }
  if (ph>=4) { box(x+w*.36,y+w*.24,w*.3,w*.3,EL+50,EL+50+(hl>=2?44:30),sh(st.wall,1.1));
    pyr(x+w*.32,y+w*.2,w*.38,w*.38,EL+50+(hl>=2?44:30),EL+50+(hl>=2?66:46),st.roof);
    if (hl>=2) { const c = iso(x+w*.51,y+w*.39,EL+80);
      ctx.beginPath(); ctx.arc(c.x,c.y,5.5*Z(),0,7);
      ctx.fillStyle='#F0E7C2'; ctx.fill();
      ctx.strokeStyle='#3A3730'; ctx.lineWidth=1.4*Z();
      const an=(pulse/900)%(Math.PI*2);
      ctx.beginPath(); ctx.moveTo(c.x,c.y);
      ctx.lineTo(c.x+Math.cos(an)*4*Z(), c.y+Math.sin(an)*3.4*Z()); ctx.stroke(); } }
  if (ph>=5) {
    if (st.roofT==='gable') gableR(x-.08,y-.08,w+.16,w*.8+.16,EL+50,EL+64,st.roof);
    else pyr(x-.08,y-.08,w+.16,w*.8+.16,EL+50,EL+64,st.roof);
    for (let i=0;i<4;i++) box(x+w*(.1+i*.24),y+w*.86,.14,.14,EL+5,EL+28,'#CFC6AE');
    box(x+w*.06,y+w*.84,w*.88,.12,EL+28,EL+32,sh(st.wall,.92));
    if (hl>=3) { box(x+w,y+w*.1,w*.34,w*.6,EL+5,EL+40,sh(st.wall,.96));
      pyr(x+w-.04,y+w*.06,w*.42,w*.68,EL+40,EL+52,st.roof); }
  }
}
function church(gx,gy,ph,hl,st,sp) {
  sp = sp||3; const w = sp-.7, x = gx+.35, y = gy+.5;
  if (ph>=1) { shadow(gx+.2,gy+.2,sp-.4,sp-.4); box(x-.1,y-.1,w+.2,w*.7+.2,0,EL+4,'#B9AE96'); }
  if (ph>=2) box(x,y,w,w*.62,EL+4,EL+34,st.wall);
  if (ph>=3) gableR(x-.08,y-.08,w+.16,w*.62+.16,EL+34,EL+52,st.roof);
  if (ph>=4) { const tw = w*.32;
    box(x+w*.06,y-w*.42,tw,tw,EL+4,EL+62+(hl>=2?24:0),st.wall);
    pyr(x+w*.02,y-w*.46,tw+.1,tw+.1,EL+62+(hl>=2?24:0),EL+86+(hl>=2?30:0),st.roof);
    box(x+w*.2,y-w*.3,.06,.06,EL+86+(hl>=2?30:0),EL+96+(hl>=2?30:0),'#C9B25A');
    box(x+w*.14,y-w*.3,.2,.06,EL+91+(hl>=2?30:0),EL+93+(hl>=2?30:0),'#C9B25A'); }
  if (ph>=5) {
    for (let i=0;i<3;i++) poly([iso(x+w,y+w*(.08+i*.18),EL+30),iso(x+w,y+w*(.16+i*.18),EL+30),
      iso(x+w,y+w*(.16+i*.18),EL+12),iso(x+w,y+w*(.08+i*.18),EL+12)],
      hl>=3?'rgba(200,120,90,.6)':'rgba(240,228,190,.45)');
    if (hl>=3) { box(x+w*.3,y+w*.66,w*.4,.5,EL+4,EL+7,'#9C9484');
      for (let i=0;i<3;i++) box(x+w*.34+i*.28,y+w*.72,.1,.1,EL+7,EL+18,'#8E938F'); }
  }
}
function museum(gx,gy,ph,hl,st,sp) {
  sp = sp||3; const w = sp-.5, x = gx+.25, y = gy+.25;
  if (ph>=1) { shadow(gx+.2,gy+.2,sp-.4,sp-.4); box(x,y,w,w,0,EL+8,'#CFC6AE'); }
  if (ph>=2) box(x+.1,y+.1,w-.2,w-.2,EL+8,EL+34,st.wall);
  if (ph>=3) { for (let i=0;i<5;i++) {
      const px = x+.14+i*((w-.36)/4);
      box(px,y+.06,.16,.16,EL+8,EL+40,'#E4DCC6');
      box(px-.02,y+.04,.2,.2,EL+40,EL+43,'#D6CDB6'); } }
  if (ph>=4) { box(x+.06,y+.02,w-.12,.14,EL+43,EL+48,sh(st.wall,1.08));
    pyr(x+.02,y-.02,w-.04,.34,EL+48,EL+58,st.roof); }
  if (ph>=5) {
    if (st.roofT==='gable') gableR(x+.06,y+.16,w-.12,w-.3,EL+34,EL+46,st.roof);
    else pyr(x+.06,y+.16,w-.12,w-.3,EL+34,EL+46,st.roof);
    for (let i=0;i<3;i++) box(x+w*.18+i*(w*.28),y+w-.16,.16,.12,EL+8,EL+11,'#B9AE96');
    if (hl>=2) { box(x+w,y+.2,w*.3,w*.5,EL+8,EL+30,sh(st.wall,.95));
      pyr(x+w-.04,y+.16,w*.38,w*.58,EL+30,EL+40,st.roof); }
    if (hl>=3) { box(x-.34,y+.24,.3,w*.5,EL+8,EL+26,sh(st.wall,.9));
      pyr(x-.38,y+.2,.38,w*.58,EL+26,EL+36,st.roof); }
  }
}
/* úzký vysoký dům se štítem do ulice */
function burgher(gx,gy,ph,hl,st,sp) {
  sp = sp||2; const w = sp-.7, x = gx+.35, y = gy+.3;
  const floors = 2 + Math.max(0, hl-1), fh = 20;
  if (ph>=1) { shadow(gx+.2,gy+.2,sp-.4,sp-.4); box(x-.08,y-.08,w+.16,w+.16,0,EL+6,'#B9AE96'); }
  if (ph>=2) box(x,y,w,w,EL+6,EL+26,sh(st.wall,.95));
  for (let f=1; f<Math.min(floors, ph-1); f++) {
    const z0 = EL+6+f*fh, z1 = z0+fh;
    box(x,y,w,w,z0,z1, f%2 ? st.wall : sh(st.wall,1.04));
    for (let i=0;i<2;i++) {
      const wy = y+w*(.2+i*.38);
      poly([iso(x+w,wy,z1-5),iso(x+w,wy+w*.22,z1-5),
            iso(x+w,wy+w*.22,z0+5),iso(x+w,wy,z0+5)],
        gridLive()?'rgba(244,228,186,.5)':'rgba(60,66,58,.55)');
    }
    if (st.wall === '#E0D6BE') {          // hrázdění
      ctx.strokeStyle = 'rgba(90,70,48,.5)'; ctx.lineWidth = 1.5*Z();
      [z0+4, z1-4].forEach(z => { const a=iso(x+w,y+.04,z), b=iso(x+w,y+w-.04,z);
        ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); });
    }
  }
  const topZ = EL+6+Math.max(1,Math.min(floors, ph-1))*fh;
  if (ph>=4) {
    poly([iso(x+w*.36,y+w,EL+22),iso(x+w*.64,y+w,EL+22),
          iso(x+w*.64,y+w,EL+7),iso(x+w*.36,y+w,EL+7)], sh(st.wall,.34));
    box(x+w*.32,y+w-.04,w*.36,.1,EL+22,EL+25,st.roof);
  }
  if (ph>=5) {
    gableR(x-.1,y-.1,w+.2,w+.2,topZ,topZ+26,st.roof);
    if (st.chim) { box(x+w*.72,y+w*.14,.16,.16,topZ+8,topZ+34,C.brick);
      if (gridLive()) smoke(x+w*.8,y+w*.22,topZ+34); }
    if (hl>=2) box(x-.16,y+w*.28,.18,w*.4,topZ-fh,topZ-4,sh(st.wall,1.06));
    if (hl>=3) { box(x+w,y+w*.1,.5,w*.8,EL+6,EL+6+fh,sh(st.wall,.92));
      gableR(x+w-.04,y+w*.06,.6,w*.88,EL+6+fh,EL+6+fh+14,st.roof); }
  }
}
/* horský sklad — dřevěná hala ve svahu */
function mtnStore(gx,gy,ph,hl,st,sp) {
  sp = sp||3; const w = sp-.5, x = gx+.25, y = gy+.25;
  if (ph>=1) { shadow(gx+.2,gy+.2,sp-.4,sp-.4); box(x,y,w,w,0,EL+6,'#6E6A62'); }
  if (ph>=2) for (let i=0;i<4;i++) box(x+.1+i*((w-.3)/3),y+.1,.16,.16,EL+6,EL+16,'#8A7A5E');
  if (ph>=3) { box(x+.06,y+.06,w-.12,w*.72,EL+6,EL+30,st.wall);
    poly([iso(x+w-.06,y+w*.2,EL+26),iso(x+w-.06,y+w*.5,EL+26),
          iso(x+w-.06,y+w*.5,EL+8),iso(x+w-.06,y+w*.2,EL+8)],'rgba(28,26,24,.55)'); }
  if (ph>=4) {
    gableR(x+.02,y+.02,w-.04,w*.78,EL+30,EL+44,st.roof);
    for (let i=0;i<Math.min(hl,4);i++)
      box(x+.14+i*(w*.22),y+w*.82,.3,.26,EL+6,EL+12+i*3,i%2?'#9AA0A6':'#6E7684');
    if (hl>=2) { box(x+w,y+w*.1,w*.3,w*.55,EL+6,EL+24,sh(st.wall,.94));
      gableR(x+w-.04,y+w*.06,w*.38,w*.63,EL+24,EL+34,st.roof); }
    if (hl>=3) { box(x-.3,y+w*.2,.3,w*.5,EL+6,EL+22,sh(st.wall,.9)); }
    if (hl>=4) { box(x+w*.2,y-.3,w*.5,.3,EL+6,EL+9,'#6E6A62'); }
  }
}
/* jez a strojovna na potoce */
function mtnHydro(gx,gy,ph,hl,st,sp) {
  sp = sp||3; const w = sp-.4, x = gx+.2, y = gy+.2;
  const live = mtnLive();
  if (ph>=1) { shadow(gx+.15,gy+.15,sp-.3,sp-.3); box(x,y,w,w*.3,0,EL+4,'#6E6A62'); }
  if (ph>=2) { box(x,y+w*.3,w,w*.18,0,EL+22,st.wall);
    for (let i=0;i<5;i++) box(x+.16+i*(w*.17),y+w*.28,.12,.12,EL+22,EL+27,sh(st.wall,.8)); }
  if (ph>=3) { box(x+w*.6,y+w*.55,w*.34,w*.3,EL+4,EL+24,sh(st.wall,.95));
    gableR(x+w*.57,y+w*.52,w*.4,w*.36,EL+24,EL+34,st.roof); }
  if (ph>=4) {
    for (let i=0;i<Math.min(hl,4);i++) {
      const px = x+w*(.08+i*.14), py = y+w*.58;
      box(px,py,.26,.26,EL+4,EL+16,C.steel);
      const c = iso(px+.13,py+.13,EL+18);
      ctx.beginPath(); ctx.arc(c.x,c.y,4*Z(),0,7);
      ctx.fillStyle = live?'#7FC24A':'#4E5450'; ctx.fill(); }
    if (live) for (let i=0;i<3;i++)
      poly([iso(x+w*(.2+i*.26),y+w*.48,EL+18),iso(x+w*(.2+i*.26)+.26,y+w*.48,EL+18),
            iso(x+w*(.2+i*.26)+.26,y+w*.54,EL+2),iso(x+w*(.2+i*.26),y+w*.54,EL+2)],
        'rgba(190,225,235,.45)');
  }
}
/* lanovka — stožár s lanem a vozíkem */
function cableway(gx,gy,ph,hl,st,sp) {
  sp = sp||2; const cx = gx+sp/2, cy = gy+sp/2;
  const Hh = [70, 92, 118][Math.min(hl,3)-1] || 70;
  if (ph>=1) { shadow(gx+.5,gy+.5,sp-1,sp-1); box(cx-.4,cy-.4,.8,.8,0,EL+5,C.concrete); }
  if (ph>=2) { [[0,0],[1,0],[0,1],[1,1]].forEach(p=>
      box(cx-.26+p[0]*.42,cy-.26+p[1]*.42,.12,.12,EL+5,EL+Hh,st.wall));
    box(cx-.3,cy-.3,.72,.72,EL+Hh,EL+Hh+6,sh(st.wall,.9)); }
  if (ph>=3) {
    ctx.strokeStyle = '#5A6068'; ctx.lineWidth = 2*Z();
    const a = iso(cx,cy,EL+Hh+4), b = iso(cx+6.5,cy+6.5,EL+Hh-20);
    ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
    const c2 = iso(cx-6.5,cy-6.5,EL+Hh-20);
    ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(c2.x,c2.y); ctx.stroke();
  }
  if (ph>=4) {
    box(cx-.34,cy-.34,.8,.8,EL+Hh+6,EL+Hh+14,st.roof);
    if (mtnWorks()) {
      const t = (pulse/220)%1;
      for (let i=0;i<2;i++) {
        const tt = (t+i*.5)%1, d2 = -6.5 + tt*13;
        const px = cx+d2, py = cy+d2, pz = EL+Hh-20+Math.abs(6.5-Math.abs(d2))*3;
        box(px-.12,py-.12,.26,.26,pz-9,pz,'#C4503C');
      }
    }
    if (hl>=3) { box(cx+.5,cy+.5,.5,.5,EL+5,EL+22,sh(st.wall,.92));
      pyr(cx+.46,cy+.46,.58,.58,EL+22,EL+30,st.roof); }
  }
}
/* horská chata — srub s kamennou podezdívkou */
function chalet(gx,gy,ph,hl,st,sp) {
  sp = sp||2; const w = sp-.5, x = gx+.25, y = gy+.25;
  if (ph>=1) { shadow(gx+.2,gy+.2,sp-.4,sp-.4); box(x-.06,y-.06,w+.12,w+.12,0,EL+6,'#7C7468'); }
  if (ph>=2) box(x,y,w,w,EL+6,EL+16,'#9A9490');
  if (ph>=3) { box(x,y,w,w,EL+16,EL+34,st.wall);
    ctx.strokeStyle='rgba(60,44,28,.35)'; ctx.lineWidth=1.3*Z();
    [EL+22,EL+28].forEach(z=>{ const a=iso(x+w,y+.04,z), b=iso(x+w,y+w-.04,z);
      ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }); }
  if (ph>=4) {
    gableR(x-.16,y-.16,w+.32,w+.32,EL+34,EL+34+(hl>=2?30:24),st.roof);
    if (st.chim) { box(x+w*.72,y+w*.14,.18,.18,EL+40,EL+62,'#8E938F');
      if (mtnWorks()) smoke(x+w*.81,y+w*.23,EL+62); } }
  if (ph>=5) {
    for (let i=0;i<2;i++) poly([iso(x+w,y+w*(.18+i*.34),EL+30),iso(x+w,y+w*(.34+i*.34),EL+30),
      iso(x+w,y+w*(.34+i*.34),EL+20),iso(x+w,y+w*(.18+i*.34),EL+20)],
      mtnWorks()?'rgba(246,226,168,.55)':'rgba(60,66,58,.5)');
    box(x-.2,y+w*.3,.22,w*.4,EL+6,EL+9,'#8A6E4A');
    if (hl>=2) { box(x+w,y+w*.2,.42,w*.55,EL+6,EL+24,sh(st.wall,.94));
      gableR(x+w-.06,y+w*.14,.54,w*.67,EL+24,EL+34,st.roof); }
    if (hl>=3) { box(x+w*.1,y+w+.02,w*.7,.42,EL+6,EL+9,'#A8D0DC'); }
  }
}
/* ─── hlavní nádraží ───
   kolejiště, nástupiště, ocelová hala, výpravní budova s hodinami
   a vlak, který přijíždí a zase odjíždí                              */
function railStation(gx, gy, ph, hl, stl, sp) {
  sp = sp || 4;
  const x = gx + .15, y = gy + .15, w = sp - .3;
  const TR = [y + w*.30, y + w*.52];          // dvě koleje
  const live = gridLive();

  if (ph >= 1) {                               // násep a štěrkové lože
    shadow(gx+.1, gy+.1, sp-.2, sp-.2);
    box(x, y, w, w, 0, EL+4, '#6E6A62');
    box(x, y + w*.24, w, w*.36, EL+4, EL+7, '#8A8378');
  }
  if (ph >= 2) {                               // koleje s pražci
    TR.forEach(ty => {
      for (let i = 0; i < 14; i++)
        box(x + .1 + i*(w-.2)/14, ty - .09, (w-.2)/18, .34, EL+7, EL+9, C.woodD);
      box(x + .06, ty - .04, w - .12, .07, EL+9, EL+11.5, '#9AA0A6');
      box(x + .06, ty + .19, w - .12, .07, EL+9, EL+11.5, '#9AA0A6');
    });
    /* výhybka na kraji */
    box(x + w*.72, TR[0] + .1, w*.22, .07, EL+9, EL+11.5, '#8A9098');
  }
  if (ph >= 3) {                               // nástupiště mezi kolejemi
    box(x + .06, TR[0] + .3, w - .12, .2, EL+7, EL+13, '#BFC3BC');
    box(x + .06, TR[0] + .3, w - .12, .05, EL+13, EL+14, '#8E948C');
    for (let i = 0; i < 5; i++) {               // lampy na nástupišti
      const lx = x + .3 + i*(w-.6)/4;
      box(lx, TR[0] + .37, .07, .07, EL+13, EL+30, C.steel);
      box(lx - .03, TR[0] + .34, .13, .13, EL+30, EL+33, live ? '#F4E8B4' : '#5A5F58');
    }
  }
  if (ph >= 4) {                               // ocelová hala nad kolejemi
    const y0 = y + w*.18, y1 = y + w*.68, ym = (y0+y1)/2;
    const hBase = EL+14, hRidge = EL+52;
    /* sloupy po obou stranách */
    [y0, y1].forEach(py => { for (let i2 = 0; i2 < 5; i2++)
      box(x + .12 + i2*(w-.36)/4, py - .06, .14, .14, EL+7, hBase, C.steel); });
    /* prosklená sedlová střecha — dvě plochy */
    const g1 = live ? 'rgba(206,234,244,.52)' : 'rgba(126,140,148,.58)';
    const g2 = live ? 'rgba(168,204,220,.52)' : 'rgba(98,110,118,.58)';
    poly([iso(x+.04, y0, hBase), iso(x+w-.04, y0, hBase),
          iso(x+w-.04, ym, hRidge), iso(x+.04, ym, hRidge)], g1);
    poly([iso(x+.04, ym, hRidge), iso(x+w-.04, ym, hRidge),
          iso(x+w-.04, y1, hBase), iso(x+.04, y1, hBase)], g2);
    /* čelo haly */
    poly([iso(x+.04, y0, hBase), iso(x+.04, ym, hRidge), iso(x+.04, y1, hBase)],
      live ? 'rgba(214,236,244,.5)' : 'rgba(90,102,110,.6)');
    poly([iso(x+w-.04, y0, hBase), iso(x+w-.04, ym, hRidge), iso(x+w-.04, y1, hBase)],
      'rgba(40,48,52,.5)');
    /* ocelové vazníky */
    for (let i2 = 0; i2 <= 4; i2++) {
      const px = x + .08 + i2*(w-.16)/4;
      ctx.strokeStyle = '#C6CCD2'; ctx.lineWidth = 2.4*Z();
      const a = iso(px, y0, hBase), b2 = iso(px, ym, hRidge), c2 = iso(px, y1, hBase);
      ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b2.x,b2.y); ctx.lineTo(c2.x,c2.y); ctx.stroke();
    }
    /* hřebenová vaznice a okapy */
    box(x+.02, ym-.05, w-.04, .1, hRidge, hRidge+4, '#D2D8DE');
    box(x+.02, y0-.05, w-.04, .1, hBase, hBase+4, '#B4BAC2');
    box(x+.02, y1-.05, w-.04, .1, hBase, hBase+4, '#B4BAC2');
  }
  if (ph >= 5) {                               // výpravní budova — arkáda a rizalit
    const bx = x, by = y + w*.76, bw = w, bd = w*.24;
    /* sokl */
    box(bx-.04, by-.04, bw+.08, bd+.08, EL+4, EL+11, '#B8AE96');
    /* přízemí s arkádou */
    box(bx, by, bw, bd, EL+11, EL+30, stl.wall);
    for (let i2 = 0; i2 < 7; i2++) {
      const ax = bx + .18 + i2*(bw-.5)/7;
      poly([iso(ax, by, EL+28), iso(ax+.26, by, EL+28),
            iso(ax+.26, by, EL+13), iso(ax, by, EL+13)],
        live ? 'rgba(246,232,182,.55)' : 'rgba(52,58,54,.6)');
      box(ax+.26, by-.05, .07, .1, EL+11, EL+30, sh(stl.wall,1.1));
    }
    /* patro */
    box(bx, by, bw, bd, EL+30, EL+48, sh(stl.wall, 1.05));
    for (let i2 = 0; i2 < 7; i2++) {
      const ax = bx + .2 + i2*(bw-.5)/7;
      poly([iso(ax, by, EL+45), iso(ax+.22, by, EL+45),
            iso(ax+.22, by, EL+34), iso(ax, by, EL+34)],
        live ? 'rgba(240,226,176,.5)' : 'rgba(52,58,54,.55)');
    }
    /* římsa a střecha */
    box(bx-.07, by-.07, bw+.14, bd+.14, EL+48, EL+53, sh(stl.wall,.86));
    if (stl.roofT === 'gable') gableR(bx-.05, by-.05, bw+.1, bd+.1, EL+53, EL+70, stl.roof);
    else pyr(bx-.05, by-.05, bw+.1, bd+.1, EL+53, EL+70, stl.roof);
    /* střední rizalit s hodinami */
    const rx = bx + bw*.38;
    box(rx, by-.1, bw*.24, bd+.2, EL+11, EL+62, sh(stl.wall,1.1));
    box(rx-.05, by-.15, bw*.24+.1, bd+.3, EL+62, EL+67, sh(stl.wall,.88));
    pyr(rx-.05, by-.15, bw*.24+.1, bd+.3, EL+67, EL+84, stl.roof);
    const cc = iso(rx + bw*.12, by-.1, EL+52);
    ctx.beginPath(); ctx.arc(cc.x, cc.y, 8*Z(), 0, 7);
    ctx.fillStyle = '#F4EDD6'; ctx.fill();
    ctx.strokeStyle = '#2E2B26'; ctx.lineWidth = 1.6*Z(); ctx.stroke();
    const an = (pulse/700) % (Math.PI*2);
    ctx.beginPath(); ctx.moveTo(cc.x, cc.y);
    ctx.lineTo(cc.x + Math.cos(an)*5*Z(), cc.y + Math.sin(an)*4*Z()); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cc.x, cc.y);
    ctx.lineTo(cc.x + Math.cos(an*12)*3.4*Z(), cc.y + Math.sin(an*12)*2.7*Z()); ctx.stroke();
    /* markýza nad vchodem */
    box(rx-.12, by+bd, bw*.24+.24, .28, EL+24, EL+27, C.slate);
    box(rx-.06, by+bd+.24, .08, .08, EL+11, EL+24, C.steel);
    box(rx+bw*.22, by+bd+.24, .08, .08, EL+11, EL+24, C.steel);
    if (stl.chim) { box(bx + bw*.06, by + bd*.3, .18, .18, EL+56, EL+76, C.brick);
      if (live) smoke(bx + bw*.14, by + bd*.38, EL+76); }
  }
  if (ph >= 6) {                               // hodinová věž na rohu
    const tx = x + w*.82, ty2 = y + w*.74, tw = w*.2, td = w*.2;
    box(tx, ty2, tw, td, EL+4, EL+96, '#E2D6BA');
    for (let i2 = 0; i2 < 3; i2++)
      poly([iso(tx, ty2 + td*.2, EL+40+i2*18), iso(tx, ty2 + td*.8, EL+40+i2*18),
            iso(tx, ty2 + td*.8, EL+30+i2*18), iso(tx, ty2 + td*.2, EL+30+i2*18)],
        live ? 'rgba(246,232,182,.5)' : 'rgba(52,58,54,.55)');
    box(tx-.06, ty2-.06, tw+.12, td+.12, EL+96, EL+103, '#CFC1A2');
    pyr(tx-.1, ty2-.1, tw+.2, td+.2, EL+103, EL+128, '#4E5A66');
    box(tx + tw*.42, ty2 + td*.42, .09, .09, EL+128, EL+142, C.steel);
    const c2 = iso(tx, ty2 + td*.5, EL+86);
    ctx.beginPath(); ctx.arc(c2.x, c2.y, 6.5*Z(), 0, 7);
    ctx.fillStyle = '#F4EDD6'; ctx.fill();
    ctx.strokeStyle = '#2E2B26'; ctx.lineWidth = 1.4*Z(); ctx.stroke();
    /* schodiště k budově */
    for (let i2 = 0; i2 < 3; i2++)
      box(x + w*.36 - i2*.06, y + w - .02 + i2*.09, w*.28 + i2*.12, .1, EL+4, EL+10-i2*2, '#C2B9A2');
  }
  /* vlak — přijede, chvíli stojí a zase odjede */
  if (ph >= 4) {
    const cyc = 2600, t = (pulse % cyc) / cyc;
    let px;
    if (t < .3)      px = -1.2 + (t/.3) * (w*.32 + 1.2);          // příjezd
    else if (t < .62) px = w*.32;                                  // stojí
    else             px = w*.32 + ((t-.62)/.38) * (w + 1.6);       // odjezd
    const lx = x + px, ly = TR[0] - .02;
    if (lx > x - 1.4 && lx < x + w + 1.6) {
      /* lokomotiva */
      box(lx, ly, .8, .3, EL+11, EL+24, '#2E3A44');
      box(lx + .5, ly + .03, .3, .24, EL+24, EL+31, '#3E4A54');
      box(lx + .08, ly + .08, .16, .16, EL+24, EL+36, '#4A5058');
      if (live && t < .62) smoke(lx + .16, ly + .16, EL+36);
      const hl2 = iso(lx, ly + .15, EL+16);
      ctx.beginPath(); ctx.arc(hl2.x, hl2.y, 2.6*Z(), 0, 7);
      ctx.fillStyle = live ? '#F6E8A8' : '#4E5450'; ctx.fill();
      /* vagony */
      for (let i = 1; i <= 3; i++) {
        const vx = lx - i*.95;
        if (vx < x - 1.4) continue;
        box(vx, ly, .82, .3, EL+11, EL+26, i % 2 ? '#7C5A3C' : '#6E4E34');
        for (let k = 0; k < 3; k++)
          poly([iso(vx + .14 + k*.22, ly, EL+23), iso(vx + .3 + k*.22, ly, EL+23),
                iso(vx + .3 + k*.22, ly, EL+16), iso(vx + .14 + k*.22, ly, EL+16)],
            live ? 'rgba(244,232,180,.55)' : 'rgba(60,66,58,.5)');
        box(vx - .04, ly - .02, .9, .34, EL+26, EL+28, '#4E4A44');
      }
    }
  }
}
/* dispečink — velín s radarem a anténami */
function control(gx,gy,ph,hl,stl,sp) {
  sp = sp||3; const w = sp-.5, x = gx+.25, y = gy+.25;
  const live = gridLive();
  if (ph>=1) { shadow(gx+.2,gy+.2,sp-.4,sp-.4); box(x-.06,y-.06,w+.12,w+.12,0,EL+7,C.asphalt); }
  if (ph>=2) { box(x,y,w,w*.6,EL+7,EL+30,stl.wall);
    for (let i=0;i<4;i++) poly([iso(x+w,y+w*(.06+i*.14),EL+26),iso(x+w,y+w*(.14+i*.14),EL+26),
      iso(x+w,y+w*(.14+i*.14),EL+12),iso(x+w,y+w*(.06+i*.14),EL+12)],
      live?'rgba(206,232,240,.5)':'rgba(56,62,58,.6)'); }
  if (ph>=3) {                                  // válcová věž velínu
    const cx = x+w*.66, cy2 = y+w*.68, r = w*.2;
    box(cx-r/2, cy2-r/2, r, r, EL+7, EL+52+(hl>=2?16:0), sh(stl.wall,.94));
    box(cx-r/2-.1, cy2-r/2-.1, r+.2, r+.2, EL+52+(hl>=2?16:0), EL+62+(hl>=2?16:0), sh(stl.wall,1.1));
    for (let i=0;i<4;i++) { const a=i*Math.PI/2;
      poly([iso(cx-r/2, cy2-r/2+r*.2, EL+60+(hl>=2?16:0)),
            iso(cx-r/2, cy2-r/2+r*.8, EL+60+(hl>=2?16:0)),
            iso(cx-r/2, cy2-r/2+r*.8, EL+54+(hl>=2?16:0)),
            iso(cx-r/2, cy2-r/2+r*.2, EL+54+(hl>=2?16:0))],
        live?'rgba(214,238,246,.55)':'rgba(56,62,58,.6)'); }
  }
  if (ph>=4) { box(x+.06,y+w*.62,w*.5,w*.3,EL+7,EL+22,sh(stl.wall,.88));
    box(x+.02,y+w*.58,w*.58,w*.38,EL+22,EL+26,C.slate);
    for (let i=0;i<3;i++) box(x+.18+i*.36,y+w*.7,.24,.16,EL+26,EL+30,'#C4763F'); }
  if (ph>=5) {
    /* radar, který se otáčí */
    const rx = x+w*.66, ry = y+w*.68, rz = EL+64+(hl>=2?16:0);
    box(rx-.05, ry-.05, .1, .1, rz, rz+12, C.steel);
    const c = iso(rx, ry, rz+14), spin = live ? pulse/34 : 0;
    ctx.strokeStyle = '#C6CCD2'; ctx.lineWidth = 3*Z();
    ctx.beginPath(); ctx.moveTo(c.x - Math.cos(spin)*11*Z(), c.y - Math.sin(spin)*8*Z());
    ctx.lineTo(c.x + Math.cos(spin)*11*Z(), c.y + Math.sin(spin)*8*Z()); ctx.stroke();
    /* anténní stožár */
    box(x+.1, y+.1, .1, .1, EL+7, EL+70, C.steel);
    const t = iso(x+.15, y+.15, EL+72);
    ctx.beginPath(); ctx.arc(t.x, t.y, 3*Z(), 0, 7);
    ctx.fillStyle = pulse%50<25 ? '#E3423C' : '#5A2622'; ctx.fill();
    if (hl>=3) { box(x-.3,y+w*.2,.3,w*.4,EL+7,EL+24,sh(stl.wall,.9));
      box(x-.34,y+w*.16,.38,w*.48,EL+24,EL+27,C.slate); }
  }
}
/* správcovská firma — prosklená kancelářská budova */
function office(gx,gy,ph,hl,stl,sp) {
  sp = sp||3; const w = sp-.6, x = gx+.3, y = gy+.3;
  const live = gridLive(), fl = 3 + Math.max(0,hl-1), fh = 17;
  if (ph>=1) { shadow(gx+.2,gy+.2,sp-.4,sp-.4); box(x-.12,y-.12,w+.24,w+.24,0,EL+8,C.concrete); }
  if (ph>=2) box(x+w*.06,y+w*.06,w*.88,w*.88,EL+8,EL+18,sh(stl.wall,.8));
  for (let f=0; f<Math.min(fl, ph-2); f++) {
    const z0 = EL+18+f*fh, z1 = z0+fh;
    box(x,y,w,w,z0,z1, f%2 ? stl.wall : sh(stl.wall,1.05));
    for (let i=0;i<4;i++) {
      const wy = y+w*(.08+i*.22);
      poly([iso(x+w,wy,z1-4), iso(x+w,wy+w*.14,z1-4),
            iso(x+w,wy+w*.14,z0+4), iso(x+w,wy,z0+4)],
        live ? 'rgba(206,232,240,.55)' : 'rgba(56,62,58,.55)');
    }
    box(x-.03,y-.03,w+.06,.06,z1-3,z1,sh(stl.wall,.7));
  }
  const top = EL+18+Math.max(1,Math.min(fl, ph-2))*fh;
  if (ph>=4) { box(x+.05,y+.05,w-.1,w-.1,top,top+7,stl.roof);
    box(x+w*.3,y+w*.3,w*.4,w*.4,top+7,top+15,C.steel);
    box(x+w*.46,y+w*.46,.1,.1,top+15,top+34,C.steel);
    const c = iso(x+w*.51,y+w*.51,top+36);
    ctx.beginPath(); ctx.arc(c.x,c.y,3*Z(),0,7);
    ctx.fillStyle = pulse%60<30 ? '#E3423C' : '#5A2622'; ctx.fill(); }
  if (ph>=5) {
    box(x-.28, y+w*.28, .34, w*.44, EL+8, EL+26, C.glass);
    box(x-.32, y+w*.24, .42, w*.52, EL+26, EL+29, stl.roof);
    for (let i=0;i<3;i++) box(x+w*.18+i*(w*.3), y+w+.06, .16,.16, EL+8, EL+13, '#8FA45C');
    if (hl>=3) box(x+w+.02, y+w*.2, .3, w*.6, EL+8, EL+18+fh, sh(stl.wall,.95));
  }
}
/* údržbářská četa — garáže s otevřenými vraty a vozy */
function depot(gx,gy,ph,hl,stl,sp) {
  sp = sp||2; const w = sp-.3, x = gx+.15, y = gy+.15;
  const live = gridLive();
  if (ph>=1) { shadow(gx+.1,gy+.1,sp-.2,sp-.2); box(x,y,w,w,0,EL+6,C.asphalt);
    for (let i=0;i<3;i++) box(x+.18+i*(w-.44)/2, y+w-.34, .26,.06, EL+6,EL+7,'#D8D2BE'); }
  if (ph>=2) { box(x+.04,y+.04,w-.08,w*.62,EL+6,EL+30,stl.wall);
    for (let i=0;i<3;i++) {                       // vrata
      const gxp = x+.16+i*(w-.42)/2;
      poly([iso(gxp, y+w*.66, EL+27), iso(gxp+.32, y+w*.66, EL+27),
            iso(gxp+.32, y+w*.66, EL+8), iso(gxp, y+w*.66, EL+8)], 'rgba(24,28,26,.82)');
      box(gxp-.02, y+w*.64, .36, .05, EL+27, EL+31, sh(stl.wall,1.12));
    } }
  if (ph>=3) { gableR(x,y,w,w*.7,EL+30,EL+44,stl.roof);
    box(x+w*.1, y+w*.02, .12,.12, EL+44, EL+58, C.steel);
    const c = iso(x+w*.15, y+w*.07, EL+60);
    ctx.beginPath(); ctx.arc(c.x,c.y,3.2*Z(),0,7);
    ctx.fillStyle = pulse%40<20 ? '#E3423C' : '#4E6E92'; ctx.fill(); }
  if (ph>=4) {
    /* hasičské vozy před garáží */
    for (let i=0;i<Math.min(2+ (hl>=2?1:0), 3); i++) {
      const vx = x+.14+i*(w-.4)/2, vy = y+w*.78;
      box(vx, vy, .34, .18, EL+6, EL+13, '#C4302C');
      box(vx+.06, vy+.02, .14, .14, EL+13, EL+18, '#8E2320');
      const l = iso(vx+.3, vy+.09, EL+15);
      ctx.beginPath(); ctx.arc(l.x,l.y,2*Z(),0,7);
      ctx.fillStyle = live ? '#F6E8A8' : '#4E5450'; ctx.fill();
    }
    if (hl>=3) { box(x+w+.02, y+.1, .34, w*.5, EL+6, EL+24, sh(stl.wall,.92));
      gableR(x+w-.02, y+.06, .42, w*.58, EL+24, EL+34, stl.roof); }
  }
}
function drawByKind(D, gx, gy, ph, hl, st, sp) {
  if (D.name === 'Hlavní nádraží') return railStation(gx,gy,ph,hl,st,sp);
  if (D.name === 'Dispečink těžby') return control(gx,gy,ph,hl,st,sp);
  if (D.name === 'Správcovská firma') return office(gx,gy,ph,hl,st,sp);
  if (D.name === 'Údržbářská četa') return depot(gx,gy,ph,hl,st,sp);
  if (D.mtnStore) return mtnStore(gx,gy,ph,hl,st,sp);
  if (D.mgen)     return mtnHydro(gx,gy,ph,hl,st,sp);
  if (D.cable)    return cableway(gx,gy,ph,hl,st,sp);
  if (D.name === 'Horská chata') return chalet(gx,gy,ph,hl,st,sp);
  if (D.name === 'Měšťanský dům') return burgher(gx,gy,ph,hl,st,sp);
  if (D.name === 'Radnice') return townHall(gx,gy,ph,hl,st,sp);
  if (D.name === 'Kostel') return church(gx,gy,ph,hl,st,sp);
  if (D.name === 'Muzeum') return museum(gx,gy,ph,hl,st,sp);
  if (D.name === 'Větrná elektrárna') return windmill(gx,gy,ph,hl,st,sp);
  if (D.name === 'Vodní elektrárna') return dam(gx,gy,ph,hl,st,sp);
  if (D.name === 'Kolotoč') return carousel(gx,gy,ph,hl,st,sp);
  if (D.name === 'Horská dráha') return coaster(gx,gy,ph,hl,st,sp);
  if (D.name === 'Aquapark') return aqua(gx,gy,ph,hl,st,sp);
  if (D.name === 'Mrakodrap') return tower(gx,gy,ph,hl,st,sp);
  if (D.name === 'Parkoviště') return parking(gx,gy,ph,hl,st,sp);
  if (D.name === 'Stánek') return stall(gx,gy,ph,hl,st,sp);
  if (D.office) yard(gx,gy,ph,hl,st,sp);
  else if (D.store) warehouse(gx,gy,ph,st,S.skladLvl);
  else if (D.park) parkB(gx,gy,ph,hl,st,sp);
  else if (D.name === 'Obchodní centrum') mall(gx,gy,ph,hl,st,sp);
  else if (D.name === 'Vila') villa(gx,gy,ph,hl,st,sp);
  else if (D.name === 'Činžák') apartment(gx,gy,ph,hl,st,sp);
  else house(gx,gy,ph,st,D.big,hl,sp);
}

/* moře kolem celku platforem — svět nikam dál nepokračuje */
function seaFrame() {
  const ps = PLATFORMS.filter(inThisWorld);
  if (!ps.length) return;
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  ps.forEach(p=>{ x0=Math.min(x0,p.ox); x1=Math.max(x1,p.ox+PSZ);
                  y0=Math.min(y0,p.oy); y1=Math.max(y1,p.oy+PSZ); });
  const R = 4;
  const VT = visTiles(2);          // kreslí se jen to, co je vidět na obrazovce
  const ya = Math.max(Math.floor(VT.y0), y0-R), yb = Math.min(Math.ceil(VT.y1), y1+R);
  const xa = Math.max(Math.floor(VT.x0), x0-R), xb = Math.min(Math.ceil(VT.x1), x1+R);
  for (let y=ya;y<yb;y++) for (let x=xa;x<xb;x++) {
    if (x>=x0 && x<x1 && y>=y0 && y<y1) continue;
    const d = Math.max(x0-x, x-(x1-1), y0-y, y-(y1-1));
    if (d > R) continue;
    water(x,y, 0, d>1);           // dál od pobřeží: bez animovaných vlnek
  }
}
/* přehrada po vylepšení zatopí údolí — hladina roste s úrovní */
function floodZ() {
  let z = 0;
  PIDS.forEach(id => { const D = defOf(id), p = S.plot[id];
    if (D && D.mgen && D.flood && p.done && plotOk(id) && PARC[id].gy >= DAM_Y - 3)
      z = Math.max(z, D.flood[Math.min(p.hl, D.flood.length) - 1]); });
  return z;
}
/* leží tahle dlaždice v právě zobrazeném světě? */
function inWorldXY(gx, gy) {
  const pl = PLATFORMS.find(p => gx>=p.ox && gx<p.ox+PSZ && gy>=p.oy && gy<p.oy+PSZ);
  return pl ? inThisWorld(pl) : false;
}
/* kopec — horský kraj se zvedá k vrcholu */
function hillZ(gx, gy) {
  const pl = PLATFORMS.find(p => p.mtn && gx>=p.ox && gx<p.ox+PSZ && gy>=p.oy && gy<p.oy+PSZ);
  if (!pl) return 0;
  const peak = (px, py, r, top) => {
    const d = Math.hypot((gx-px)*0.92, (gy-py)*1.08) / r;
    return Math.pow(Math.max(0, 1-d), 1.5) * top;
  };
  /* dvě hory vpředu, vzadu je spojuje hřeben */
  const ridge = 150 * Math.exp(-Math.pow(gy-55, 2) / 30);
  let z = Math.max(peak(14, 77, 22, 360), peak(64, 77, 22, 340), ridge);

  /* údolí mezi horami — dno klesá od hřebene dopředu, tudy teče řeka */
  const vd = Math.min(1, Math.abs(gx - 39) / 8);
  const floor = Math.max(10, 120 - (gy - 56) * 3);
  if (vd < 1) z = floor + (z - floor) * (vd * vd);

  return Math.round(z + rnd(gx, gy) * 4);
}
/* dno údolí a jeho koryto */
const DAM_Y = 68;                          // profil, kde stojí hráz
const inValley = (gx, gy) => Math.abs(gx - 39) < 8 && gy > 56;
const riverBed = (gx, gy) => inValley(gx, gy) && Math.abs(gx - 39 - Math.sin(gy/7)*1.6) < 1.2;
/* těleso hráze — táhne se od jednoho svahu ke druhému */
function damBuilt() {
  return PIDS.some(id => { const D = defOf(id);
    return D && D.mgen && D.flood && S.plot[id].done && S.plot[id].hl >= 1
      && PARC[id].plat >= MTN_FIRST && PARC[id].gy >= DAM_Y - 3; });
}
function damCrest() {
  const fl = floodZ();
  return Math.max(96, fl + 16);
}
function damWall(gx) {
  const y = DAM_Y, base = hillZ(gx, y), top = damCrest();
  if (base >= top) return;
  const w = 2.2;
  box(gx, y - w/2, 1, w, base - 6, top, sh(C.concrete, .92));
  poly([iso(gx, y-w/2, top), iso(gx+1, y-w/2, top),
        iso(gx+1, y+w/2, top), iso(gx, y+w/2, top)], sh(C.concrete, 1.12));
  /* koruna se zábradlím */
  box(gx, y - w/2 - .04, 1, .1, top, top + 5, C.slate);
  box(gx, y + w/2 - .06, 1, .1, top, top + 5, C.slate);
  if ((gx & 1) === 0) { box(gx+.4, y-w/2, .1, .1, top+5, top+13, C.steel);
    box(gx+.4, y+w/2-.1, .1, .1, top+5, top+13, C.steel); }
  /* přepad, když je plno */
  if (floodZ() > 0 && (gx % 5) === 2) {
    poly([iso(gx+.2, y+w/2, top-6), iso(gx+.8, y+w/2, top-6),
          iso(gx+.8, y+w/2+.5, base), iso(gx+.2, y+w/2+.5, base)],
      'rgba(200,230,240,.42)');
  }
}
/* je dlaždice pod hladinou přehrady? zatápí se jen nad hrází */
function flooded(gx, gy) {
  const fl = floodZ();
  return fl > 0 && inValley(gx, gy) && gy < DAM_Y && hillZ(gx, gy) < fl;
}
/* viditelná oblast na obrazovce v herních souřadnicích — pro ořezávání kreslení */
function visTiles(margin) {
  const sc = Z(), kx = (TW/2)*sc, ky = (TH/2)*sc;
  const corners = [[0,0],[W,0],[0,H],[W,H]].map(([sx,sy]) => {
    const X = sx - cx0 - panX, Y = sy - cy0 - panY;
    return [ (X/kx + Y/ky)/2, (Y/ky - X/kx)/2 ];
  });
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  corners.forEach(([gx,gy]) => { x0=Math.min(x0,gx); x1=Math.max(x1,gx);
                                  y0=Math.min(y0,gy); y1=Math.max(y1,gy); });
  const m = margin || 6;
  return { x0:x0-m, x1:x1+m, y0:y0-m, y1:y1+m };
}
function drawWorld(only) {
  if (!only) {
    const VT = visTiles(3);
    PLATFORMS.forEach(pl => {
      if (!platOpen(pl.id) || !inThisWorld(pl)) return;
      if (pl.ox+PSZ < VT.x0 || pl.ox > VT.x1 || pl.oy+PSZ < VT.y0 || pl.oy > VT.y1) return;
      const m = MAPS[pl.id];
      const yA = Math.max(0, Math.floor(VT.y0-pl.oy)), yB = Math.min(PSZ, Math.ceil(VT.y1-pl.oy));
      const xA = Math.max(0, Math.floor(VT.x0-pl.ox)), xB = Math.min(PSZ, Math.ceil(VT.x1-pl.ox));
      for (let y=yA;y<yB;y++) for (let x=xA;x<xB;x++) {
        const gx=x+pl.ox, gy=y+pl.oy;
        if (inZone(gx,gy)) continue;
        const hz = hillZ(gx,gy);
        let ch = m[y][x];
        let thz = hz;
        if (pl.mtn) {
          if (flooded(gx,gy)) { ch = 'V'; thz = floodZ() - (EL-4); }   // hladina je rovná
          else if (riverBed(gx,gy)) ch = 'V';
          else if (ch !== 'V' && ch !== 'b')
            ch = hz > 215 ? 's' : hz > 145 ? 'K' : hz > 74 ? 'k'
               : (ch === 's' || ch === 'k' || ch === 'K') ? 'g' : ch;
        }
        tile(gx,gy,TCOL[ch]||C.grass, ch==='R', thz);
      }
    });
  } else {
    const p = PARC[only], pl = PLAT(p.plat), m = MAPS[p.plat];
    for (let y=-1;y<=PSZ;y++) for (let x=-1;x<=PSZ;x++) {
      const gx=x+pl.ox, gy=y+pl.oy;
      if (!inSel(gx,gy,only)) continue;
      const row = m[y], ch = (row && row[x]) || (p.plat===0?'.':'D');
      tile(gx,gy,TCOL[ch]||C.grass, ch==='R');
    }
  }
  const objs = [];
  const VT2 = visTiles(5);
  const onScreen = (gx,gy) => gx>=VT2.x0 && gx<=VT2.x1 && gy>=VT2.y0 && gy<=VT2.y1;
  if (!only) {
    DECO.forEach(d => { if (!inWorldXY(d.x,d.y) || !onScreen(d.x,d.y)) return;
      const hz = hillZ(d.x,d.y);
      if (hz > 165 && d.t !== 'rock') return;        // nad hranicí lesa už nic neroste
      if (flooded(d.x,d.y)) return;                  // co je pod hladinou, zmizelo
      objs.push({ z:d.x+d.y+.2, hz, f:()=>DRAW[d.t](d.x,d.y,d.v,d) }); });
    Object.keys(NODE_DEF).forEach(id => { const d = nodeDef(id);
      if (d.plat && !platOpen(d.plat)) return;
      if (!inWorldXY(d.gx,d.gy) || !onScreen(d.gx,d.gy)) return;
      objs.push({ z:d.gx+d.gy+1.4, f:()=>station(id) }); });
    if (plantBuilt() && !inMtn()) COOL_SPOTS.slice(0, S.plant.cool).forEach(sp =>
      objs.push({ z:sp[0]+sp[1]+1.4, f:()=>coolTower(sp[0],sp[1]) }));
    /* oplocení průmyslových areálů */
    FENCE_TILES = inMtn() ? new Set() : fenceTileSet();
    if (!inMtn()) [[1, isNuke()?'#7FC24A':'#A8B0A6'], [5, '#8FB6C6'], [7, '#C0A070']].forEach(([pi,col]) => {
      if (!platOpen(pi)) return;
      platFence(PLAT(pi)).forEach(f =>
        objs.push({ z:f[0]+f[1]+0.35, f:()=>fencePiece(f[0],f[1],f[2],col) }));
    });
  }
  if (!only || only === 'p1')
    tufts.forEach(t => { if (t.alive) objs.push({ z:t.x+t.y+.3, f:()=>{
      const p = iso(t.x,t.y,EL); ctx.fillStyle = t.c;
      ctx.fillRect(p.x-t.w/2*Z(), p.y-t.h*Z(), t.w*Z(), t.h*Z()); }}); });
  PIDS.forEach(k => { if (only && only !== k) return;
    if (!visible(k)) return;
    const p = PARC[k], sp = spanOf(k);
    if (!only && !onScreen(p.gx,p.gy)) return;
    objs.push({ z:p.gx+p.gy+sp*.75, hz:hillZ(p.gx,p.gy), f:()=>drawBuilding(k) }); });
  if (!only) agents.forEach(a => { if (!inWorldXY(Math.floor(a.x),Math.floor(a.y))) return;
    if (!onScreen(a.x,a.y)) return;
    objs.push({ z:a.x+a.y+.45, hz:hillZ(a.x,a.y), f:()=>AG_DRAW[a.t](a) }); });
  /* těleso hráze napříč celým údolím */
  if (!only && inMtn() && damBuilt())
    for (let gx = 30; gx <= 48; gx++) {
      if (hillZ(gx, DAM_Y) >= damCrest()) continue;
      const x = gx;
      objs.push({ z:x + DAM_Y + 1.2, f:()=>damWall(x) });
    }
  if (!only && platOpen(12) && !inMtn()) ['cargo','cruise'].forEach(kind => {
    if (!portBuilt(kind)) return;
    const v = voyage(kind);
    const prog = v ? Math.min(1, (Date.now()-(v.end-v.dur))/v.dur) : 0;
    const away = !!v && Date.now() < v.end;
    const bx = 58.4, by = kind==='cargo' ? 27.4 : 32.4;
    objs.push({ z:bx+by+1, f:()=>ship(bx,by,kind,away,away?prog:0) });
  });
  objs.sort((a,b)=>a.z-b.z).forEach(o=>o.f());
}

function draw() {
  pulse++;
  ctx.clearRect(0,0,W,H);
  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#1E2820'); g.addColorStop(.55,'#151C16'); g.addColorStop(1,'#0A0E0B');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  upHit = {}; platHit = {};

  if (MODE.v === 'map') { if (pulse % 2 === 0) stepAgents();
    PLATFORMS.forEach(pl => {
      if (platOpen(pl.id) || !inThisWorld(pl)) return;
      const m = MAPS[pl.id];
      ctx.save(); ctx.globalAlpha=.12;
      for (let y=0;y<PSZ;y++) for (let x=0;x<PSZ;x++)
        tile(x+pl.ox,y+pl.oy, m[y][x]==='R'?C.road:C.grass, false);
      ctx.restore();
      const gate = pl.req && !gateDone(pl.req) ? { name: gateName(pl.req) } : null;
      const lbl = pl.soon
        ? (ZU>.9 ? `${pl.name.toUpperCase()} · PŘIPRAVUJEME` : 'BRZY')
        : gate
        ? (ZU>.9 ? `${pl.name.toUpperCase()} · ${gate.name.toUpperCase()}` : 'ZAMČENO')
        : (ZU>.9 ? `${pl.name.toUpperCase()} · LVL ${pl.reqLvl}` : `LVL ${pl.reqLvl}`);
      platHit[pl.id] = pill(pl.ox+5, pl.oy+5, 2, lbl,
        'rgba(14,18,16,.9)', pl.soon ? C.sky : '#9FAC96', 9, 5);
    });
    seaFrame();
    drawWorld(null);
    const q = quest(); if (q.target) ring(q.target[0], q.target[1], q.target[2]||2);
    /* události */
    S.evs.forEach(e => {
      if (e.t === 'cargo' && inWorldXY(e.gx,e.gy)) {
        const bob = Math.sin(pulse/16)*3;
        shadow(e.gx+.24,e.gy+.26,.52,.48);
        box(e.gx+.24,e.gy+.26,.5,.46,EL,EL+13,C.wood);
        box(e.gx+.3,e.gy+.32,.38,.34,EL+13,EL+16,sh(C.wood,.8));
        const c = iso(e.gx+.5,e.gy+.5,EL+30);
        ctx.beginPath(); ctx.arc(c.x, c.y-bob, 10,0,7);
        ctx.fillStyle='rgba(14,18,16,.9)'; ctx.fill();
        ctx.strokeStyle=C.amber; ctx.lineWidth=1.6; ctx.stroke();
        ctx.fillStyle=C.amber; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.font='800 12px Inter,system-ui,sans-serif'; ctx.fillText('?', c.x, c.y-bob+.5);
      }
    });
    const big = ZU > 1.2;

    Object.keys(NODE_DEF).forEach(id => {
      const d = nodeDef(id), n = S.nodes[id];
      if (d.plat && !platOpen(d.plat)) return;
      if (!inWorldXY(d.gx, d.gy)) return;          // stanice z druhého světa se nekreslí
      if (isBroken('n:'+id)) { faultMark(d.gx,d.gy,2); return; }
      if (n.uEnd) {
        const u = nextStUp(id);
        progPill(d.gx,d.gy,2, u.ph[n.ph].n, 1-(n.uEnd-Date.now())/(n.uDur||u.dur), (n.ph+1)+'/3');
      } else if (n.buf > 0) {
        pill(d.gx,d.gy,2, `+${n.buf}`, n.buf>=nodeCap(id)?C.red:C.amber, '#1B1305', 13, 6);
      } else if (big) {
        pill(d.gx,d.gy,2, nodeName(id)+((n.on&&!noMine(id))?' ●':''), 'rgba(14,18,16,.88)', (n.on&&!noMine(id))?C.green:'#B9C4AE', 9, 5);
      } else if (n.on && !noMine(id)) pill(d.gx,d.gy,2,'●','rgba(14,18,16,.88)',C.green,8,5);
      if (canUpgradeNode(id) && !n.uEnd)
        upHit[id] = pill(d.gx,d.gy,2, '↑ '+nextStUp(id).name, 'rgba(14,18,16,.94)', C.amber, 9,
          (n.buf>0||big)?26:19);
    });

    PIDS.forEach(k => {
      if (!visible(k)) return;
      const p = PARC[k], st = S.plot[k], D = defOf(k), sp = spanOf(k);
      const isTarget = q.target && q.target[0]===p.gx && q.target[1]===p.gy;
      if (isOwned(k) && isBroken('p:'+k)) { faultMark(p.gx,p.gy,sp); return; }
      if (!isOwned(k)) {
        const lvOk = !p.reqLvl || S.lvl >= p.reqLvl, avail = lvOk && canBuy(k);
        if (!big && !isTarget) lockMark(p.gx,p.gy,sp, avail&&S.money>=p.cost?C.amber:'#7C8578', !lvOk?p.reqLvl:0);
        else pill(p.gx,p.gy,sp, !lvOk?`LVL ${p.reqLvl}`:!canBuy(k)?'zamčeno':fmt(p.cost),
          avail&&S.money>=p.cost?C.amber:'rgba(14,18,16,.88)',
          avail&&S.money>=p.cost?'#1B1305':'#9FAC96', 9, 5);
      } else if (st.bEnd) {
        const def = specialDef(k) || D || { ph:[{n:'Stavba'}], dur:18000 };
        progPill(p.gx,p.gy,sp, def.ph[st.phase].n,
          1-(st.bEnd-Date.now())/(st.bDur||def.dur), (st.phase+1)+'/'+def.ph.length);
      } else if (st.uEnd) {
        progPill(p.gx,p.gy,sp, 'Vylepšení', 1-(st.uEnd-Date.now())/(st.uDur||1));
      } else if (isPlant(k)) {
        if (!st.done) { if (big||isTarget) pill(p.gx,p.gy,sp,'Elektrárna',C.amber,'#1B1305',9,5);
          else lockMark(p.gx,p.gy,sp,C.amber,0,'+'); }
        else if (big) pill(p.gx,p.gy,sp, `${powerUse()}/${powerMax()} MW`,
          'rgba(14,18,16,.88)', gridLive()?C.amber:C.red, 9, 5);
      } else if (isPort(k)) {
        const nm = PORT[PARC[k].port].name;
        if (!st.done) { if (big||isTarget) pill(p.gx,p.gy,sp,nm,C.amber,'#1B1305',9,5);
          else lockMark(p.gx,p.gy,sp,C.amber,0,'+'); }
        else { const v = voyage(PARC[k].port);
          if (v) progPill(p.gx,p.gy,sp, v.n, 1-(v.end-Date.now())/v.dur,
            Math.max(0,Math.ceil((v.end-Date.now())/60000))+' min');
          else if (big) pill(p.gx,p.gy,sp,'v přístavu','rgba(14,18,16,.88)','#9FAC96',9,5);
        }
      } else if (isIronStore(k)) {
        if (!st.done) { if (big||isTarget) pill(p.gx,p.gy,sp,'Rudný sklad',C.amber,'#1B1305',9,5);
          else lockMark(p.gx,p.gy,sp,C.amber,0,'+'); }
        else if (big) pill(p.gx,p.gy,sp, `${ironCap()} ks`, 'rgba(14,18,16,.88)', '#C0A88E', 9, 5);
      } else if (isPump(k)) {
        if (!st.done) { if (big||isTarget) pill(p.gx,p.gy,sp,'Vodojem',C.amber,'#1B1305',9,5);
          else lockMark(p.gx,p.gy,sp,C.amber,0,'+'); }
        else if (big) pill(p.gx,p.gy,sp, `${waterUse()}/${waterMax()} m³`,
          'rgba(14,18,16,.88)', waterLive()?C.sky:C.red, 9, 5);
      } else if (isPumpSt(k)) {
        if (!st.done && (big||isTarget)) pill(p.gx,p.gy,sp,'Čerpadlo',C.amber,'#1B1305',9,5);
        else if (!st.done) lockMark(p.gx,p.gy,sp,C.amber,0,'+');
      } else if (!D) {
        if (big||isTarget) pill(p.gx,p.gy,sp,'vyber stavbu',C.amber,'#1B1305',9,5);
        else lockMark(p.gx,p.gy,sp,C.amber,0,'+');
      } else if (st.done && st.off) {
        pill(p.gx,p.gy,sp, 'odpojeno', 'rgba(14,18,16,.9)', C.red, 9, 5);
      } else if (st.done && D.rent && st.rent>=1) {
        pill(p.gx,p.gy,sp, fmt(st.rent), C.green, '#132009', 10, 5);
      }
    });
  } else drawWorld(MODE.id);

  /* vinětace — okraje mírně potemní, střed vystoupí */
  if (!vign || vignW !== W || vignH !== H) {
    vignW = W; vignH = H; vign = null;
    try {
      const v = ctx.createRadialGradient(W/2, H*.46, Math.min(W,H)*.22,
                                         W/2, H*.46, Math.max(W,H)*.78);
      if (v && v.addColorStop) {
        v.addColorStop(0,  'rgba(0,0,0,0)');
        v.addColorStop(.62,'rgba(0,0,0,.10)');
        v.addColorStop(1,  'rgba(0,0,0,.34)');
        vign = v;
      }
    } catch (e) { vign = null; }
  }
  if (vign) { ctx.fillStyle = vign; ctx.fillRect(0,0,W,H); }

  floats = floats.filter(f => f.life > 0 && (f.w === undefined || f.w === S.world));
  floats.forEach(f => { f.life-=.013; f.y-=.8;
    ctx.globalAlpha = Math.max(0,Math.min(1,f.life));
    ctx.font = '800 13px "Bricolage Grotesque",system-ui,sans-serif';
    ctx.fillStyle = f.c; ctx.textAlign = 'center';
    ctx.fillText(f.t,f.x,f.y); ctx.globalAlpha = 1; });
  requestAnimationFrame(draw);
}
