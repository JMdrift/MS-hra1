/* ═══════════ ikony surovin ═══════════ */
const ICON = {
  log: c => `<path d="M3 9h13a3.5 3.5 0 010 7H3z" fill="${c}"/>
    <ellipse cx="3" cy="12.5" rx="2.2" ry="3.5" fill="${c}" opacity=".65"/>
    <ellipse cx="3" cy="12.5" rx="1" ry="1.6" fill="#000" opacity=".3"/>
    <path d="M9 9v7M13 9v7" stroke="#000" stroke-opacity=".22" stroke-width="1"/>`,
  rock: c => `<path d="M4 17l2-7 5-3 6 3 2 7z" fill="${c}"/>
    <path d="M11 7l6 3 2 7-8-3z" fill="#000" opacity=".2"/>
    <path d="M6 10l5 4-7 3z" fill="#fff" opacity=".14"/>`,
  wheat: c => `<path d="M12 20V8" stroke="${c}" stroke-width="1.6"/>
    <path d="M12 8c-3 0-4.5 1.6-4.5 3.6C10 11.6 12 10.4 12 8zM12 8c3 0 4.5 1.6 4.5 3.6C14 11.6 12 10.4 12 8z" fill="${c}"/>
    <path d="M12 13c-3 0-4.5 1.6-4.5 3.6C10 16.6 12 15.4 12 13zM12 13c3 0 4.5 1.6 4.5 3.6C14 16.6 12 15.4 12 13z" fill="${c}" opacity=".75"/>
    <path d="M12 5.5c-1.6 0-2.6 1-2.6 2.4C10.8 7.9 12 7 12 5.5zM12 5.5c1.6 0 2.6 1 2.6 2.4C13.2 7.9 12 7 12 5.5z" fill="${c}"/>`,
  clay: c => `<rect x="3" y="13" width="8" height="5" rx="1" fill="${c}"/>
    <rect x="12" y="13" width="8" height="5" rx="1" fill="${c}" opacity=".78"/>
    <rect x="7" y="7" width="8" height="5" rx="1" fill="${c}" opacity=".9"/>`,
  plank: c => `<rect x="2" y="7" width="20" height="4" rx="1" fill="${c}"/>
    <rect x="2" y="13" width="20" height="4" rx="1" fill="${c}" opacity=".75"/>
    <path d="M8 7v4M15 7v4M6 13v4M13 13v4" stroke="#000" stroke-opacity=".2" stroke-width="1"/>`,
  gravel: c => `<circle cx="7" cy="15" r="3.4" fill="${c}"/>
    <circle cx="14.5" cy="16" r="2.6" fill="${c}" opacity=".8"/>
    <circle cx="11.5" cy="9.5" r="3" fill="${c}" opacity=".9"/>
    <circle cx="17.5" cy="10.5" r="2.1" fill="${c}" opacity=".7"/>`,
  brick: c => `<rect x="3" y="6" width="18" height="5" rx=".8" fill="${c}"/>
    <rect x="3" y="13" width="18" height="5" rx=".8" fill="${c}" opacity=".82"/>
    <path d="M10 6v5M16 6v5M7 13v5M14 13v5" stroke="#000" stroke-opacity=".25" stroke-width="1"/>`,
  bale: c => `<circle cx="12" cy="12" r="8" fill="${c}"/>
    <circle cx="12" cy="12" r="5" fill="none" stroke="#000" stroke-opacity=".2" stroke-width="1.2"/>
    <circle cx="12" cy="12" r="2" fill="none" stroke="#000" stroke-opacity=".2" stroke-width="1.2"/>
    <path d="M4 12h16" stroke="#000" stroke-opacity=".16" stroke-width="1"/>`,
  coal: c => `<path d="M5 16l2-5 4-2 5 2 3 5-2 3H7z" fill="${c}"/>
    <path d="M11 9l5 2 3 5-6-1z" fill="#fff" opacity=".14"/>
    <path d="M7 11l4 4-6 1z" fill="#fff" opacity=".08"/>`,
  power: c => `<path d="M13 2L4 14h6l-1 8 9-12h-6z" fill="${c}"/>`,
  beam: c => `<rect x="2" y="9" width="20" height="6" rx="1" fill="${c}"/>
    <path d="M2 9l4-3h16l-4 3z" fill="${c}" opacity=".6"/>
    <path d="M8 9v6M15 9v6" stroke="#000" stroke-opacity=".22" stroke-width="1"/>`,
  pave: c => `<rect x="3" y="4" width="8" height="7" rx="1" fill="${c}"/>
    <rect x="13" y="4" width="8" height="7" rx="1" fill="${c}" opacity=".8"/>
    <rect x="3" y="13" width="8" height="7" rx="1" fill="${c}" opacity=".85"/>
    <rect x="13" y="13" width="8" height="7" rx="1" fill="${c}" opacity=".7"/>`,
  tileM: c => `<path d="M4 8h16v4H4zM4 14h16v4H4z" fill="${c}"/>
    <path d="M9 8v4M15 8v4M6 14v4M12 14v4M18 14v4" stroke="#000" stroke-opacity=".24" stroke-width="1"/>
    <path d="M4 6h16" stroke="${c}" stroke-width="2"/>`,
  insul: c => `<path d="M4 6h16v12H4z" fill="${c}"/>
    <path d="M4 9c3 0 3 2 6 2s3-2 6-2 3 2 4 2M4 13c3 0 3 2 6 2s3-2 6-2 3 2 4 2"
      stroke="#000" stroke-opacity=".2" stroke-width="1.2" fill="none"/>`,
  drop: c => `<path d="M12 3c4 5 6.5 8 6.5 11a6.5 6.5 0 01-13 0C5.5 11 8 8 12 3z" fill="${c}"/>
    <path d="M9 14a3 3 0 003 3" stroke="#fff" stroke-opacity=".45" stroke-width="1.4" fill="none"/>`,
  uran: c => `<circle cx="12" cy="12" r="2.6" fill="${c}"/>
    <g fill="${c}" opacity=".85">
      <path d="M12 12L4.5 7.5a9 9 0 014.2-2.4z"/>
      <path d="M12 12l7.5-4.5a9 9 0 011.3 4.7z"/>
      <path d="M12 12l0 8.6a9 9 0 01-4.4-1.2z"/>
    </g>`,
  ore: c => `<path d="M4 16l2.5-6L12 7l6 3 2 6-2.5 3H6z" fill="${c}"/>
    <path d="M12 7l6 3 2 6-7-3z" fill="#000" opacity=".22"/>
    <circle cx="9" cy="13" r="1.4" fill="#E9A63C" opacity=".8"/>
    <circle cx="14" cy="15" r="1.1" fill="#E9A63C" opacity=".6"/>`,
  rebar: c => `<path d="M3 8h18M3 13h18M3 18h18" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M5 6.6l1.6 2.8M11 6.6l1.6 2.8M17 6.6l1.6 2.8M5 11.6l1.6 2.8M11 11.6l1.6 2.8M17 11.6l1.6 2.8"
      stroke="${c}" stroke-opacity=".55" stroke-width="1.2"/>`,
  beamI: c => `<path d="M4 4h16v3H14v10h6v3H4v-3h6V7H4z" fill="${c}"/>
    <path d="M4 4h16v3H14v10h6v3H4v-3h6V7H4z" fill="#000" opacity=".12" transform="translate(0,1)"/>`,
  alert: c => `<path d="M12 3l9.5 17H2.5z" fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M12 9v5" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="12" cy="17.2" r="1.2" fill="${c}"/>`,
  granite: c => `<path d="M3 15l3-7 6-3 7 4 2 7-4 3H6z" fill="${c}"/>
    <path d="M12 5l7 4 2 7-6-4z" fill="#000" opacity=".2"/>
    <path d="M6 8l6 5-6 2z" fill="#fff" opacity=".14"/>`,
  slate2: c => `<path d="M3 8h8l-1 4H2zM13 6h8l-1 4h-8zM5 14h8l-1 4H4zM15 12h7l-1 4h-7z" fill="${c}"/>`,
  quartz: c => `<path d="M12 2l5 6-5 14-5-14z" fill="${c}"/>
    <path d="M12 2l5 6-5 14z" fill="#000" opacity=".18"/>
    <path d="M7 8h10" stroke="#fff" stroke-opacity=".3" stroke-width="1"/>`,
  block: c => `<rect x="3" y="6" width="8" height="5" fill="${c}"/><rect x="13" y="6" width="8" height="5" fill="${c}" opacity=".85"/>
    <rect x="3" y="13" width="8" height="5" fill="${c}" opacity=".9"/><rect x="13" y="13" width="8" height="5" fill="${c}" opacity=".75"/>`,
  shingle: c => `<path d="M2 9l5-4 5 4-5 4zM12 9l5-4 5 4-5 4z" fill="${c}"/>
    <path d="M7 15l5-4 5 4-5 4z" fill="${c}" opacity=".8"/>`,
  pane: c => `<rect x="4" y="3" width="16" height="18" fill="${c}" opacity=".5"/>
    <rect x="4" y="3" width="16" height="18" fill="none" stroke="${c}" stroke-width="1.6"/>
    <path d="M12 3v18M4 12h16" stroke="${c}" stroke-width="1.2"/>
    <path d="M6 6l4 4" stroke="#fff" stroke-opacity=".4" stroke-width="1.4"/>`,
  coin: c => `<circle cx="12" cy="12" r="8" fill="${c}"/>
    <circle cx="12" cy="12" r="5.4" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="1.3"/>
    <path d="M12 8.6v6.8M10.2 10.2h3.4M10.2 13.8h3.4" stroke="#000" stroke-opacity=".3" stroke-width="1.2"/>`
};

function icon(name, color, size) {
  const s = size || 18, f = ICON[name];
  if (!f) return '';
  return `<svg viewBox="0 0 24 24" width="${s}" height="${s}" style="display:block">${f(color||'#ccc')}</svg>`;
}
const resIcon = (k, size) => { const r = RL(k); return r ? icon(r.ic, r.c, size) : ''; };
