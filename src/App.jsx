import { useState, useMemo, useEffect, useRef, Fragment } from "react";

// ─── RESPONSIVE HOOK ─────────────────────────────────────────────────────────
function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return mobile;
}

// ─── ESCAPE KEY HOOK ─────────────────────────────────────────────────────────
// Calls onEscape when Escape is pressed. Pass enabled=false to skip (e.g. when
// a higher-priority modal is open). Modals/panels opt in individually so we
// don't need a global listener that has to know overlay z-order.
function useEscapeKey(onEscape, enabled = true) {
  useEffect(() => {
    if (!enabled || typeof onEscape !== "function") return;
    const handler = (e) => { if (e.key === "Escape") onEscape(e); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onEscape, enabled]);
}

// Global responsive CSS — injected once, handles all breakpoints
const RESPONSIVE_CSS = `
  * { box-sizing: border-box; }
  html { font-size: 16px; }
  button, select, input { touch-action: manipulation; }

  /* ── PARCHMENT CODEX DESIGN TOKENS ─────────────────────────────────────
     Gold-on-near-black palette; hairline borders; sharp corners on cards
     (only buttons round to 4px); three-family type system (IM Fell English SC display,
     Alegreya Sans numerals, Alegreya Sans body). */
  :root {
    --pa-bg: #E9E1CE;
    --pa-bg-deep: #E9E1CE;
    --pa-panel-soft: rgba(138,109,59,0.04);
    --pa-panel-warm: rgba(138,109,59,0.06);
    --pa-border-faint: rgba(138,109,59,0.15);
    --pa-border-soft: rgba(138,109,59,0.27);
    --pa-border-strong: rgba(138,109,59,0.55);
    --pa-gold: #8A6D3B;
    --pa-gold-light: #8A6D3B;
    --pa-gold-soft: #77653F;
    --pa-parchment: #3A3427;
    --pa-parchment-bright: #2A251C;
    --pa-muted: #77653F;
    --pa-muted-deep: #77653F;
    --pa-muted-darker: #C9BA98;
    --pa-surface-tile: #E4D9BF;
    --pa-success: #4A6B45;
    --pa-danger: #7E2D26;
    --pa-info: #4A6178;
    --pa-vanguard: #7E2D26;
    --pa-skirmisher: #8A6D3B;
    --pa-arbiter: #4A6178;
  }

  /* ── NIGHT MODE ────────────────────────────────────────────────────────
     The art is flat inks on paper — no photos, no gradients — so a root-level
     colour inversion reads as the same printed matter on dark leather. Applied
     to <html> specifically: a filter on any lower element would turn it into
     the containing block for position:fixed children (detail panel, bottom
     nav, modals) and break their anchoring. Verified fixed elements survive
     the html-level filter. The html background is set explicitly so overscroll
     inverts with the page instead of flashing white. */
  html { background: #E9E1CE; }
  html[data-theme="night"] { filter: invert(0.93) hue-rotate(180deg); }

  /* Page background dot-pattern lift */
  body::before {
    content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.04;
    background-image:
      radial-gradient(circle at 20% 30%, var(--pa-gold) 0, transparent 40%),
      radial-gradient(circle at 80% 70%, var(--pa-gold) 0, transparent 40%);
  }

  /* Dropdown option contrast — native <option> elements inherit OS colours by
     default, which renders cream-on-white on light-theme systems. Force a
     dark background + light text so the option list stays readable when the
     select is open (supported on Chromium 119+, Firefox, modern Safari). */
  select option { background: #EDE4CE; color: var(--pa-parchment); }
  select option:checked, select option:hover { background: #E4D9BF; color: var(--pa-gold); }

  /* ── Parchment Codex utility classes ──────────────────────────────────
     pa-h1: IM Fell English SC 30/700, +1 letter, line-height 1
     pa-rule: 60×1px gold rule
     pa-sub: IM Fell English SC 10/500 +2 letter uppercase muted */
  .pa-h1 { font-family:'IM Fell English SC',serif; font-weight:700; font-size:30px; color:var(--pa-parchment); letter-spacing:1px; line-height:1; margin:0; }
  .pa-rule { width:60px; height:1px; background:var(--pa-gold); margin:14px 0 10px; }
  .pa-sub { font-family: 'Alegreya Sans', sans-serif; font-weight:500; font-size:10px; letter-spacing:2px; color:var(--pa-muted); text-transform:uppercase; }
  .pa-kicker { font-family: 'Alegreya Sans', sans-serif; font-weight:700; font-size:9px; letter-spacing:2px; color:var(--pa-muted-deep); text-transform:uppercase; line-height:1; }
  .pa-num { font-family:'Alegreya Sans',sans-serif; font-variant-numeric:tabular-nums; line-height:1; }

  /* Filter pills — used in Squad position filter */
  .pa-pill {
    font-family: 'Alegreya Sans', sans-serif; font-weight:600; font-size:10px; letter-spacing:1.5px;
    text-transform:uppercase; padding:7px 14px; border-radius:0; cursor:pointer;
    border:1px solid rgba(138,109,59,0.33); background:transparent; color:var(--pa-muted);
    transition:border-color 0.15s, color 0.15s; display:inline-flex; align-items:center; gap:7px;
    /* uniform height whether the pill holds text only or a 13px glyph */
    min-height:29px; box-sizing:border-box;
  }
  .pa-pill:hover { color:var(--pa-parchment-bright); border-color:rgba(138,109,59,0.55); }
  .pa-pill.active { color:var(--pa-bg); background:var(--pa-gold); border-color:var(--pa-gold); }
  .pa-pill .ct { font-family:'Alegreya Sans',sans-serif; letter-spacing:0; opacity:0.85; font-weight:600; }

  /* Alert strip — left gold rule, no background, gold numerals + IM Fell English SC desc */
  .pa-alert {
    margin-bottom:24px; padding:14px 18px; background:transparent;
    border-left:2px solid var(--pa-gold);
    display:flex; gap:24px; flex-wrap:wrap;
    font-family: 'Alegreya Sans', sans-serif; font-weight:600; font-size:10px;
    letter-spacing:1.5px; text-transform:uppercase; color:var(--pa-gold-soft);
  }
  .pa-alert .num { font-family:'Alegreya Sans',sans-serif; color:var(--pa-gold); font-weight:700; font-size:13px; letter-spacing:0; margin-right:4px; text-transform:none; }

  /* Buttons — Alegreya Sans body type, sharp 4px corners */
  .pa-primary {
    font-family:'Alegreya Sans',sans-serif; font-weight:700; font-size:12px; letter-spacing:0.3px;
    padding:11px 22px; background:var(--pa-gold); color:var(--pa-bg);
    border:none; border-radius:4px; cursor:pointer; display:inline-flex; align-items:center; gap:8px;
    transition: background 0.15s;
  }
  .pa-primary:hover { background:var(--pa-gold-light); }
  .pa-primary:disabled { background:#D5C8A9; color:#C9BA98; cursor:not-allowed; }
  .pa-secondary {
    font-family:'Alegreya Sans',sans-serif; font-weight:500; font-size:12px;
    padding:10px 16px; background:transparent; color:var(--pa-muted-deep);
    border:1px solid rgba(138,109,59,0.375); border-radius:4px; cursor:pointer;
    display:inline-flex; align-items:center; gap:7px;
    transition: color 0.15s, border-color 0.15s;
  }
  .pa-secondary:hover { color:var(--pa-parchment); border-color:rgba(138,109,59,0.55); }

  /* Card grid for Squad */
  .pa-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(330px,1fr)); gap:12px; }
  @media (max-width: 640px) {
    .pa-grid { grid-template-columns: 1fr; }
  }

  /* ── VERDICT STAMPS — rotated, ink-rough, stamped down ── */
  .rm-stamp {
    display: inline-block; padding: 3px 14px 2px;
    border: 3px double #40614F; color: #40614F; border-radius: 3px;
    font-family: 'IM Fell English SC', serif; letter-spacing: .16em;
    transform: rotate(-3deg);
    opacity: .88; mix-blend-mode: multiply;
  }
  .rm-stamp-loss { border-color: #7E2D26; color: #7E2D26; transform: rotate(2.5deg); }
  @media (prefers-reduced-motion: no-preference) {
    .rm-stamp { animation: rmStampIn .38s cubic-bezier(.2,1.6,.4,1) both; }
    .rm-stamp-loss { animation: rmStampInLoss .38s cubic-bezier(.2,1.6,.4,1) both; }
    @keyframes rmStampIn { from { transform: rotate(-3deg) scale(1.7); opacity: 0; } to { transform: rotate(-3deg) scale(1); opacity: .88; } }
    @keyframes rmStampInLoss { from { transform: rotate(2.5deg) scale(1.7); opacity: 0; } to { transform: rotate(2.5deg) scale(1); opacity: .88; } }
  }

  /* ── LAYOUT SHELL ── */
  .rm-shell { display: flex; min-height: 100vh; }

  /* ── SIDEBAR — Parchment Codex ── */
  .rm-sidebar {
    width: 240px; flex-shrink: 0;
    position: fixed; top: 0; left: 0; height: 100vh;
    background: #E9E1CE;
    border-right: 1px solid rgba(138,109,59,0.21);
    display: flex; flex-direction: column;
    z-index: 50; overflow-y: auto;
  }
  .rm-sidebar-logo {
    padding: 22px 20px 18px;
    border-bottom: 1px solid rgba(138,109,59,0.21);
  }
  .rm-sidebar-stats {
    padding: 8px 0;
    border-bottom: 1px solid rgba(138,109,59,0.21);
    display: flex; flex-direction: column; gap: 0;
  }
  .rm-stat-row {
    display: flex; align-items: center; gap: 10px;
    padding: 7px 20px; border-radius: 0;
    background: transparent;
    border-top: 1px solid rgba(138,109,59,0.075);
  }
  .rm-stat-row:first-child { border-top: none; }
  .rm-stat-label {
    font-family: 'Alegreya Sans', sans-serif; font-size: 10px;
    letter-spacing: 1.5px; color: #77653F; text-transform: uppercase;
    flex: 1; font-weight: 600;
  }
  .rm-stat-value {
    font-family: 'Alegreya Sans', sans-serif;
    font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums;
  }
  .rm-sidebar-nav {
    padding: 14px 10px; display: flex; flex-direction: column; gap: 1px; flex: 1;
  }
  .rm-nav-kicker {
    font-family: 'Alegreya Sans', sans-serif; font-size: 9px; color: #77653F;
    letter-spacing: 2.5px; padding: 0 10px 8px; text-transform: uppercase; font-weight: 700;
  }
  .rm-nav-item {
    display: flex; align-items: center; gap: 12px;
    padding: 11px 12px; border: none; border-left: 2px solid transparent;
    cursor: pointer; font-family: 'Alegreya Sans', sans-serif; font-size: 12px;
    background: transparent; color: #77653F;
    transition: background 0.15s, color 0.15s;
    text-align: left; width: 100%; position: relative;
    white-space: nowrap; letter-spacing: 1px; font-weight: 500;
  }
  .rm-nav-item:hover { color: #3A3427; }
  .rm-nav-item.active {
    background: rgba(138,109,59,0.15);
    border-left: 2px solid #8A6D3B;
    color: #2A251C; font-weight: 700;
  }
  .rm-nav-item.active .rm-nav-icon-wrap { color: #8A6D3B; }
  .rm-nav-icon-wrap { font-size: 15px; width: 20px; text-align: center; flex-shrink: 0; color: #77653F; }
  .rm-nav-badge {
    width: 5px; height: 5px; border-radius: 50%; background: #8A6D3B;
    position: static; margin-left: auto;
  }

  /* ── CONTENT AREA (desktop) ── */
  .rm-content {
    margin-left: 240px;
    flex: 1; min-width: 0;
  }
  .rm-main {
    padding: 28px 36px;
    transition: padding 0.2s;
  }
  /* Detail panel offset */
  .rm-main-shifted { padding-right: 380px; }

  /* ── MOBILE TOP BAR ── */
  .rm-topbar { display: none; }

  /* ── MOBILE BOTTOM NAV ── */
  .rm-bottom-nav { display: none; }

  /* ── MOBILE OVERRIDES ── */
  @media (max-width: 640px) {
    .rm-sidebar { display: none; }
    .rm-content { margin-left: 0; }
    .rm-main { padding: 12px 12px 80px; overflow-x: hidden; }
    .rm-main-shifted { padding-right: 12px; }

    /* Top bar */
    .rm-topbar {
      display: flex; align-items: center; justify-content: space-between;
      position: sticky; top: 0; z-index: 50;
      background: #E9E1CE;
      border-bottom: 2px solid #23201A;
      padding: 8px 14px; gap: 8px;
    }
    .rm-topbar-title {
      font-family: 'IM Fell English SC', serif; font-weight: 900; font-size: 14px;
      color: #23201A;
      white-space: nowrap;
    }
    .rm-topbar-chips { display: flex; gap: 5px; overflow-x: auto; scrollbar-width: none; }
    .rm-topbar-chips::-webkit-scrollbar { display: none; }
    .rm-topbar-chip {
      flex-shrink: 0; text-align: center;
      background: rgba(60,52,38,0.072); border: 1px solid rgba(60,52,38,0.108);
      border-radius: 3px; padding: 3px 8px;
    }
    .rm-topbar-chip-label { font-size: 7px; color: #95896F; }
    .rm-topbar-chip-value { font-size: 11px; font-weight: 700; }

    /* Bottom nav — 5 tabs, Battle is the hero */
    .rm-bottom-nav {
      display: flex;
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
      background: rgba(237,228,206,0.97); backdrop-filter: blur(16px);
      border-top: 1px solid rgba(60,90,120,0.15);
      padding-bottom: max(6px, env(safe-area-inset-bottom));
      gap: 0;
    }
    .rm-bottom-nav-item {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 2px;
      padding: 8px 2px 6px; border: none; cursor: pointer;
      background: transparent; color: #8A7F68;
      font-family: 'Alegreya Sans', sans-serif;
      transition: color 0.15s; position: relative;
      min-height: 56px;
    }
    .rm-bottom-nav-item.active { color: #3C5A78; }
    .rm-bottom-nav-item .rm-bnav-icon { font-size: 20px; line-height: 1; }
    .rm-bottom-nav-item .rm-bnav-label { font-size: 9px; font-weight: 600; letter-spacing: 0.3px; }
    /* Battle centre button — taller, visually distinct */
    .rm-bottom-nav-item.battle-btn {
      flex: 1.4;
      padding: 4px 2px 6px;
    }
    .rm-bnav-battle-pill {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      width: 52px; height: 38px; border-radius: 3px;
      background: rgba(126,45,38,0.18); border: 1px solid rgba(126,45,38,0.3);
      transition: background 0.15s, border 0.15s;
      gap: 1px;
    }
    .rm-bottom-nav-item.battle-btn.active .rm-bnav-battle-pill {
      background: rgba(126,45,38,0.3); border-color: rgba(126,45,38,0.55);
    }
    .rm-bottom-nav-item.battle-btn .rm-bnav-icon { font-size: 22px; }
    .rm-bottom-nav-badge {
      position: absolute; top: 6px; right: calc(50% - 16px);
      width: 7px; height: 7px; border-radius: 50%; background: #9A5B2B;
    }
    /* More overlay */
    .rm-more-overlay {
      position: fixed; bottom: 56px; left: 0; right: 0; z-index: 49;
      background: rgba(237,228,206,0.97); backdrop-filter: blur(16px);
      border-top: 1px solid rgba(60,90,120,0.18);
      padding: 12px 16px; display: flex; gap: 8px;
    }
    .rm-more-item {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;
      padding: 10px 4px; border-radius: 3px; border: 1px solid rgba(60,52,38,0.108);
      background: rgba(60,52,38,0.054); cursor: pointer; color: #7A6F58;
      font-family: 'Alegreya Sans', sans-serif; font-size: 9px; font-weight: 600;
      transition: background 0.15s;
    }
    .rm-more-item.active { color: #3C5A78; background: rgba(60,90,120,0.12); border-color: rgba(60,90,120,0.3); }
    .rm-more-item .rm-more-icon { font-size: 20px; line-height: 1; }
  }

  /* ── TWO-COLUMN GRIDS ── */
  @media (max-width: 640px) {
    .rm-two-col { grid-template-columns: 1fr !important; }
  }

  /* ── HERO CARD GRIDS ── */
  @media (max-width: 640px) {
    .rm-card-grid { grid-template-columns: 1fr !important; }
  }

  /* ── DETAIL PANEL ── */
  /* z-index sits above every modal (max 250) so "View Hero" buttons inside
     modals can open the detail panel on top without closing the modal first. */
  .rm-detail-panel {
    position: fixed; top: 0; right: 0; width: 340px; height: 100vh;
    overflow-y: auto; z-index: 300;
  }
  @media (max-width: 640px) {
    /* 100dvh (where supported) keeps the sheet inside the *visible* viewport —
       with 100vh the bottom of the content hides behind mobile browser chrome. */
    .rm-detail-panel { width: 100vw !important; left: 0 !important; overflow-y: hidden !important; height: 100dvh; }
    .rm-detail-close { font-size: 14px !important; padding: 10px 20px !important; min-height: 44px !important; }
    .rm-detail-header { padding: 10px 16px !important; }
  }

  /* ── SIMULATION MODAL ── */
  @media (max-width: 640px) {
    .rm-sim-modal { width: 100vw !important; max-height: 100vh !important; height: 100vh; border-radius: 0 !important; }
    .rm-sim-phases { flex-wrap: wrap; }
  }

  /* ── NEGOTIATION MODAL ── */
  @media (max-width: 640px) {
    .rm-neg-modal { width: 96vw !important; padding: 18px !important; }
    .rm-neg-buttons { flex-direction: column !important; }
  }

  /* ── TACTICS ── */
  .rm-tactics-active-summary { display: none; } /* hidden on desktop — right panel shows it */
  @media (max-width: 640px) {
    .rm-tactics-grid { grid-template-columns: 1fr !important; }
    .rm-tactics-synergy-panel { display: none; }
    .rm-tactics-active-summary { display: flex; } /* visible on mobile */
    .rm-formation-slots { grid-template-columns: 1fr !important; }
    .rm-pos-desc { display: none; }
  }

  /* ── DOMINION ── */
  @media (max-width: 640px) {
    .rm-dominion-grid { grid-template-columns: 1fr !important; }
    /* Standings stay first — the table is the tab's most important content.
       (An order:-1 flip used to put the whole sidebar above it on mobile.) */
  }

  /* ── BENCH GRID ── */
  @media (max-width: 640px) {
    .rm-bench-grid { grid-template-columns: repeat(2, 1fr) !important; }
  }

  /* ── SQUAD FILTER ROWS ── */
  /* Compact pills so the full-name position row fits one line at 375px */
  @media (max-width: 640px) {
    .rm-sq-row { gap: 4px !important; }
    /* min-height matches the button touch-target rule below — the Sort and
       Other chips are spans (overlay-select pattern) and sat 11px shorter */
    .rm-sq-row .pa-pill { padding: 6px 7px; font-size: 9px; letter-spacing: 0.5px; gap: 4px; min-height: 36px; box-sizing: border-box; }
  }

  /* ── TOUCH TARGETS ── */
  @media (max-width: 640px) {
    button { min-height: 36px; }
    select, input { min-height: 34px; }
  }
`;

function InjectCSS() {
  return <style dangerouslySetInnerHTML={{ __html: RESPONSIVE_CSS }} />;
}

// ─── CORE DATA ────────────────────────────────────────────────────────────────

const ROLES = ["Warrior","Ranger","Mage","Rogue","Cleric","Paladin"];
const ROLE_ICONS = { Warrior:"",Ranger:"",Mage:"",Rogue:"",Cleric:"",Paladin:"" };

// ─── VISUAL CONFIG ────────────────────────────────────────────────────────────
// Single source of truth for visual identifiers.
// keys = file-safe names for your SVG/PNG assets.
// Structure: /public/icons/{category}/{key}.svg
//            /public/sprites/races/{key}.png  (hero portraits)
// Swap each category's return in the wrapper components below when assets ready.
const VISUAL_CONFIG = {
  // Hero portraits — raster sprites (PNG), 1 per race
  races: {
    Human:      { key:"human",      emoji:"" },
    Elf:        { key:"elf",        emoji:"" },
    Dwarf:      { key:"dwarf",      emoji:""  },
    "Half-Orc": { key:"half_orc",   emoji:"" },
    Gnome:      { key:"gnome",      emoji:"" },
    Tiefling:   { key:"tiefling",   emoji:"" },
    Dragonborn: { key:"dragonborn", emoji:"" },
  },
  // Role symbols — SVG icons
  roles: {
    Warrior: { key:"warrior", emoji:"" },
    Ranger:  { key:"ranger",  emoji:"" },
    Mage:    { key:"mage",    emoji:"" },
    Rogue:   { key:"rogue",   emoji:"" },
    Cleric:  { key:"cleric",  emoji:"" },
    Paladin: { key:"paladin", emoji:"" },
  },
  // Formation positions — SVG icons
  positions: {
    Vanguard:   { key:"vanguard",   emoji:"" },
    Skirmisher: { key:"skirmisher", emoji:"" },
    Arbiter:    { key:"arbiter",    emoji:"" },
  },
  // League tier badges — SVG icons
  tiers: {
    iron:     { key:"tier_iron",     emoji:""  },
    bronze:   { key:"tier_bronze",   emoji:"" },
    silver:   { key:"tier_silver",   emoji:"" },
    gold:     { key:"tier_gold",     emoji:"" },
    platinum: { key:"tier_platinum", emoji:"" },
  },
  // Town buildings — SVG icons
  buildings: {
    barracks:  { key:"barracks",  emoji:"" },
    tavern:    { key:"tavern",    emoji:"" },
    infirmary: { key:"infirmary", emoji:""  },
    lodge:     { key:"lodge",     emoji:"" },
    trainyard: { key:"trainyard", emoji:"" },
    network:   { key:"network",   emoji:"" },
    trading:   { key:"trading",   emoji:"" },
    bazaar:    { key:"bazaar",    emoji:"" },
    scouts:    { key:"scouts",    emoji:"" },
    sanctum:   { key:"sanctum",   emoji:"" },
    legends:   { key:"legends",   emoji:"" },
  },
  // Hero traits — SVG icons
  traits: {
    Berserker:    { key:"berserker",    emoji:"" },
    Tactician:    { key:"tactician",    emoji:"" },
    Swift:        { key:"swift",        emoji:"" },
    Resilient:    { key:"resilient",    emoji:"" },
    "Glass Cannon":{ key:"glass_cannon",emoji:"" },
    Blessed:      { key:"blessed",      emoji:"" },
    Cursed:       { key:"cursed",       emoji:"" },
    Brave:        { key:"brave",        emoji:"" },
    "Iron Will":  { key:"iron_will",    emoji:"" },
    "Eagle Eye":  { key:"eagle_eye",    emoji:"" },
    Calm:         { key:"calm",         emoji:"" },
    "Night Vision":{ key:"night_vision",emoji:"" },
    Loyal:        { key:"loyal",        emoji:"" },
    Greedy:       { key:"greedy",       emoji:"" },
    "Hot-headed": { key:"hot_headed",   emoji:"" },
    Stubborn:     { key:"stubborn",     emoji:"" },
    Coward:       { key:"coward",       emoji:"" },
    Inspiring:    { key:"inspiring",    emoji:"" },
  },
  // Race synergies — SVG icons (abstract concepts, not characters)
  synergies: {
    mono_elf:               { key:"syn_mono_elf",               emoji:"" },
    mono_dwarf:             { key:"syn_mono_dwarf",             emoji:""  },
    mono_human:             { key:"syn_mono_human",             emoji:"" },
    mono_halforc:           { key:"syn_mono_halforc",           emoji:"" },
    mono_tiefling:          { key:"syn_mono_tiefling",          emoji:"" },
    mono_gnome:             { key:"syn_mono_gnome",             emoji:""  },
    mono_dragonborn:        { key:"syn_mono_dragonborn",        emoji:"" },
    rainbow:                { key:"syn_rainbow",                emoji:"" },
    pact_elf_tiefling:      { key:"syn_pact_elf_tiefling",      emoji:"" },
    pact_dwarf_halforc:     { key:"syn_pact_dwarf_halforc",     emoji:""  },
    pact_gnome_tiefling:    { key:"syn_pact_gnome_tiefling",    emoji:"" },
    pact_human_elf:         { key:"syn_pact_human_elf",         emoji:"" },
    pact_dragonborn_halforc:{ key:"syn_pact_dragonborn_halforc",emoji:"" },
    pact_human_dwarf:       { key:"syn_pact_human_dwarf",       emoji:""  },
  },
  // Navigation tabs — SVG icons
  nav: {
    Squad:    { key:"nav_squad",    emoji:"" },
    Tactics:  { key:"nav_tactics",  emoji:"" },
    Battle:   { key:"nav_battle",   emoji:"" },
    Dominion: { key:"nav_dominion", emoji:"" },
    Town:     { key:"nav_town",     emoji:"" },
    Hire:     { key:"nav_hire",     emoji:"" },
    Ledger:   { key:"nav_ledger",   emoji:"" },
    Guide:    { key:"nav_guide",    emoji:"" },
  },
};

const RACE_ICONS = { Human:"",Elf:"",Dwarf:"","Half-Orc":"",Gnome:"",Tiefling:"",Dragonborn:"" };

// ── LIFE STAGE SYSTEM ─────────────────────────────────────────────────────
// Heroes progress through 5 stages over a 12-season (504-week) career.
// No numeric age — players see stage name + progress % only.
// All races have identical career length. Race affects style (future), not duration.

const STAGE_ORDER = ["prospect","rising","peak","fading","veteran"];

const STAGE_DEFS = {
  prospect: { id:"prospect", label:"Prospect", icon:"", color:"#5F4B66", weeks:84,  progressPerWeek:100/84  },
  rising:   { id:"rising",   label:"Rising",   icon:"", color:"#3C5A78", weeks:84,  progressPerWeek:100/84  },
  peak:     { id:"peak",     label:"Peak",      icon:"", color:"#40614F", weeks:126, progressPerWeek:100/126 },
  fading:   { id:"fading",   label:"Fading",    icon:"", color:"#8A6D3B", weeks:126, progressPerWeek:100/126 },
  veteran:  { id:"veteran",  label:"Veteran",   icon:"", color:"#9A5B2B", weeks:84,  progressPerWeek:100/84  },
};

const TOTAL_CAREER_WEEKS = Object.values(STAGE_DEFS).reduce((a,s)=>a+s.weeks,0); // 504

// Market hero stage windows by market tier (Option B, slid down 50%)
const MARKET_STAGE_WINDOWS = {
  standard: { stage:"prospect", minPct:0,  maxStage:"rising",  maxPct:30 },
  premium:  { stage:"prospect", minPct:50, maxStage:"peak",    maxPct:0  },
  elite:    { stage:"rising",   minPct:0,  maxStage:"peak",    maxPct:30 },
};

// Convert stage+progress to a total career week (0–504)
function stageToCareerWeek(stage, progress) {
  let weeks = 0;
  for(const s of STAGE_ORDER) {
    if(s === stage) return Math.round(weeks + (progress/100) * STAGE_DEFS[s].weeks);
    weeks += STAGE_DEFS[s].weeks;
  }
  return TOTAL_CAREER_WEEKS;
}

// Convert total career week back to stage+progress
function careerWeekToStage(totalWeeks) {
  let remaining = Math.max(0, Math.min(TOTAL_CAREER_WEEKS, totalWeeks));
  for(const s of STAGE_ORDER) {
    const sw = STAGE_DEFS[s].weeks;
    if(remaining < sw || s === "veteran") {
      const progress = Math.min(100, (remaining / sw) * 100);
      return { stage:s, stageProgress:Math.round(progress * 10) / 10 };
    }
    remaining -= sw;
  }
  return { stage:"veteran", stageProgress:100 };
}

// Generate a random career week within a stage window
function randomCareerWeekInWindow(minStage, minPct, maxStage, maxPct) {
  const minWeek = stageToCareerWeek(minStage, minPct);
  const maxWeek = stageToCareerWeek(maxStage, maxPct);
  return rand(minWeek, Math.max(minWeek, maxWeek));
}

function agePhase(hero) {
  return hero.stage || "peak";
}
function agePhaseLabel(p){ return {prospect:"Prospect",rising:"Rising",peak:"Peak",fading:"Fading",veteran:"Veteran"}[p]||p; }
function agePhaseColor(p){ return {prospect:"#5F4B66",rising:"#3C5A78",peak:"#40614F",fading:"#8A6D3B",veteran:"#9A5B2B"}[p]||"#6E6350"; }

// Transfer-fee scale (Football-Manager-style): a signing fee should be a real
// multiple of the hero's annual wage, not a rounding error. Pre-scale the fee ran
// ~11-15% of annual salary; this lifts a standard starter to ~1x annual wage, a raw
// prospect to ~0.7x, and an elite star to several times it. Applied to every hero
// value origin (calcHeroValue, generateHero, the starting star). MUST stay in sync
// with scripts/balance-sim.mjs TRANSFER_FEE_SCALE — re-run `npm run sim` if changed.
const TRANSFER_FEE_SCALE = 6;

// Recalculate a hero's market value based on current stats and level.
export function calcHeroValue(hero) {
  const ALL_STAT_KEYS = Object.values(STAT_GROUPS).flat();
  const statVals = ALL_STAT_KEYS.map(s=>hero.stats[s]||0);
  const avg = statVals.reduce((a,b)=>a+b,0)/statVals.length;
  const tier = hero.marketTier;
  const base = Math.floor(avg * 7 * (1 + (hero.level||0) * 0.32) * TRANSFER_FEE_SCALE);
  const mult = tier==="elite"?rand(22,28)/10 : tier==="premium"?rand(15,20)/10 : 1;
  return Math.max(100, Math.floor(base * mult));
}


const ROLE_GROWTH = {
  Warrior: ["Strength","Endurance","Defense","Intimidation"],
  Ranger:  ["Agility","Accuracy","Adaptability","Negotiation"],
  Mage:    ["Magic Power","Magic Resist","Tactics","Charisma"],
  Rogue:   ["Agility","Determination","Composure","Charisma"],
  Cleric:  ["Magic Resist","Leadership","Composure","Charisma"],
  Paladin: ["Defense","Endurance","Determination","Leadership"],
};

// Race growth profiles — hidden depth for min-maxers.
// Fast stats: +0.20 bonus to growth chance on level-up.
// Slow stats: -0.15 penalty to growth chance on level-up.
// Never shown in UI — discoverable through play.
const RACE_GROWTH = {
  Human:      { fast:["Adaptability","Leadership"],              slow:[] },
  Elf:        { fast:["Accuracy","Agility","Magic Power"],       slow:["Strength","Intimidation"] },
  Dwarf:      { fast:["Endurance","Defense","Magic Resist"],     slow:["Agility","Adaptability"] },
  "Half-Orc": { fast:["Strength","Intimidation","Determination"],slow:["Tactics","Magic Power"] },
  Gnome:      { fast:["Tactics","Magic Resist","Composure"],     slow:["Strength","Intimidation"] },
  Tiefling:   { fast:["Charisma","Determination","Magic Power"], slow:["Endurance","Defense"] },
  Dragonborn: { fast:["Strength","Leadership","Intimidation"],   slow:["Agility","Adaptability"] },
};
export const PHYSICAL_STATS = ["Strength","Agility","Endurance","Accuracy","Defense","Magic Power"];
const MENTAL_STATS   = ["Tactics","Composure","Leadership","Determination","Adaptability"];

const STAT_GROUPS = {
  Combat:["Strength","Agility","Endurance","Accuracy","Defense","Magic Power","Magic Resist"],
  Mental:["Tactics","Composure","Leadership","Determination","Adaptability"],
  Social:["Charisma","Negotiation","Intimidation","Reputation"],
  Hidden:["Potential","Form"],
};
const ALL_STATS = Object.values(STAT_GROUPS).flat();
const XP_PER_LEVEL = [0,100,250,450,700,1000,1400,1900,2500,3200,4000,5200,6600,8200,10000,12000];
export const MAX_LEVEL = 15;

// ─── HAPPINESS SYSTEM ────────────────────────────────────────────────────────
//
// Happiness (0–100) is SEPARATE from morale:
//   morale    = combat readiness, fluctuates with wins/losses
//   happiness = loyalty/satisfaction, driven by management decisions
//
// Low happiness causes: -15% stat contribution per tier below 50, morale drain,
// and harder contract talks (higher demands, less patience at the table)
// High happiness causes:  +10% stat bonus, XP boost, clutch factor increase


function moraleLabel(m){
  if(m>=80) return {label:"High",       color:"#40614F"};
  if(m>=60) return {label:"Stable",     color:"#3C5A78"};
  if(m>=40) return {label:"Low",        color:"#8A6D3B"};
  if(m>=20) return {label:"Very Low",   color:"#9A5B2B"};
  return           {label:"Critical",   color:"#8F2A1E"};
}

function potentialBucket(potential) {
  if(potential >= 83) return { label:"Elite",  color:"#8A6D3B", icon:"" };
  if(potential >= 66) return { label:"High",   color:"#40614F", icon:"" };
  if(potential >= 41) return { label:"Medium", color:"#3C5A78", icon:"" };
  return                     { label:"Low",    color:"#9A5B2B", icon:"" };
}

// ─── CONTRACT DEMAND ENGINE ──────────────────────────────────────────────────

// Calculates what a hero will demand on renewal
export function calcDemand(hero) {
  const phase = agePhase(hero);
  const avgCombat = STAT_GROUPS.Combat.reduce((a,s)=>a+hero.stats[s],0)/STAT_GROUPS.Combat.length;
  const avgMental = STAT_GROUPS.Mental.reduce((a,s)=>a+hero.stats[s],0)/STAT_GROUPS.Mental.length;
  const avgStats  = (avgCombat*0.6 + avgMental*0.4);

  // Base: steeper scaling so high-level peak heroes are genuinely expensive
  let base = Math.floor(avgStats * (0.9 + hero.level * 0.12));

  // Phase modifier — declining/veteran heroes know their value is dropping
  const phaseMult = {prospect:0.80, rising:0.95, peak:1.30, fading:0.75, veteran:0.55}[phase] ?? 1.0;
  base = Math.floor(base * phaseMult);

  if(hero.traits?.includes("Greedy"))    base = Math.floor(base * 1.20);
  if(hero.traits?.includes("Loyal"))     base = Math.floor(base * 0.88);
  // Inspiring has no contract premium — effect is purely morale-based
  if(hero.traits?.includes("Stubborn"))  base = Math.floor(base * 1.10);
  // Coward has no contract effect — effect is purely morale-based

  if(hero.morale < 40) base = Math.floor(base * (1 + (40 - hero.morale) / 100));

  const negStat = hero.stats["Negotiation"] || 0;
  if(negStat > 20) {
    // High Negotiation heroes know their worth — they demand more
    const negPremium = Math.min(0.20, (negStat - 20) / 79 * 0.20);
    base = Math.floor(base * (1 + negPremium));
  }

  // Preferred term is deterministic (was rand() re-rolled per modal open,
  // which read as the hero changing their mind for no reason)
  const years = negotiationPrefYears(hero);

  // Fading and veteran heroes: demand can be below current salary
  // (they're grateful for the work — but they'll take a pay cut)
  // Peak/prime: always at least their current salary (they have options)
  const minSalary = ["fading","veteran"].includes(phase)
    ? Math.floor(hero.salary * 0.7)  // happy to take 30% less than current
    : hero.salary;                    // won't accept less than what they have

  return { salary: Math.max(minSalary, base), years, negStat };
}

// ─── NEGOTIATION ENGINE ───────────────────────────────────────────────────────
// One-sitting haggle: the willingness gauge is the player's precise instrument,
// patience is a hidden budget worded as a mood. Everything here is DETERMINISTIC
// (no dice) so the gauge can be trusted and the bands can be regression-tested.

function negotiationPrefYears(hero) {
  const phase = agePhase(hero);
  const base = { prospect: 2, rising: 3, peak: 3, fading: 2, veteran: 1 }[phase] ?? 2;
  const negStat = hero.stats?.["Negotiation"] || 0;
  // High Negotiation heroes prefer shorter contracts — they keep options open
  return Math.max(1, base - (negStat > 40 ? 1 : 0));
}

export function negotiationProfile(hero) {
  let patience = 3;
  if (hero.traits?.includes("Loyal"))      patience += 1;
  if (hero.traits?.includes("Hot-headed")) patience -= 1;
  if (hero.morale < 40)                    patience -= 1;
  if (hero.traits?.includes("Stubborn"))   patience = 1; // take it or leave it
  patience = Math.max(1, Math.min(4, patience));

  // Concession rate: how far they move toward your offer per haggle round
  let concession = 0.35 + (hero.morale - 50) / 400;
  if (hero.traits?.includes("Loyal"))    concession += 0.10;
  if (hero.traits?.includes("Greedy"))   concession -= 0.25;
  concession = Math.max(0.15, Math.min(0.6, concession));
  if (hero.traits?.includes("Stubborn")) concession = 0;

  return { patience, prefYears: negotiationPrefYears(hero), concession };
}

// 0–100 willingness for a drafted offer against their current ask.
// ≥85 they sign · 45–84 they haggle · <45 it's insulting.
export const NEGOTIATION_SIGN_AT = 85;
export const NEGOTIATION_INSULT_BELOW = 45;
export function negotiationWillingness(hero, demand, offer) {
  const D = demand.salary, S = offer.salary;
  const prefYears = negotiationPrefYears(hero);
  // 40 base + 60-point sweep across 70%→100% of the ask: meeting it reads
  // ~100, 90% reads low-80s (haggle), at-or-under 70% reads under 45 (insult)
  const salaryPart = 60 * Math.max(0, Math.min(1, (S - 0.7 * D) / (0.3 * D)));
  let w = 40 + salaryPart
    - 8 * Math.abs((offer.years || 1) - prefYears)
    + (hero.morale - 60) / 4;
  if (hero.traits?.includes("Loyal"))  w += 8;
  if (hero.traits?.includes("Greedy")) w -= 8;
  if ((hero.stats?.["Negotiation"] || 0) > 40) w -= 6; // knows their worth
  return Math.max(0, Math.min(100, Math.round(w)));
}

// Deterministic response to an offer. sessionDemand = their current ask
// (concessions accumulate within the sitting); originalDemand anchors the
// Greedy floor. Returns the outcome, their (possibly conceded) new ask, the
// patience this round cost, and any morale sting.
export function negotiationRespond(hero, sessionDemand, originalDemand, offer, patienceLeft) {
  const w = negotiationWillingness(hero, sessionDemand, offer);
  const hotHeaded = hero.traits?.includes("Hot-headed");

  // Meeting (or beating) their own ask always signs — the Meet Ask button
  // must never bounce off trait penalties in the gauge
  if (offer.salary >= sessionDemand.salary && offer.years === sessionDemand.years) {
    return { outcome: "sign", newDemand: { ...sessionDemand }, patienceCost: 0, moraleDelta: 0, willingness: Math.max(w, NEGOTIATION_SIGN_AT) };
  }

  if (w >= NEGOTIATION_SIGN_AT) {
    return { outcome: "sign", newDemand: { ...sessionDemand }, patienceCost: 0, moraleDelta: 0, willingness: w };
  }

  if (w >= NEGOTIATION_INSULT_BELOW) {
    const { concession, prefYears } = negotiationProfile(hero);
    let newSalary = Math.round(sessionDemand.salary - (sessionDemand.salary - offer.salary) * concession);
    // The salary floors from calcDemand still bind
    const phase = agePhase(hero);
    const minSalary = ["fading","veteran"].includes(phase) ? Math.floor(hero.salary * 0.7) : hero.salary;
    newSalary = Math.max(minSalary, newSalary);
    if (hero.traits?.includes("Greedy")) newSalary = Math.max(newSalary, Math.floor(originalDemand.salary * 0.95));
    // Years: they'll move one step toward your term if it's within reach
    let newYears = sessionDemand.years;
    if (offer.years !== sessionDemand.years && Math.abs(offer.years - prefYears) <= 1) {
      newYears = sessionDemand.years + Math.sign(offer.years - sessionDemand.years);
    }
    return { outcome: "haggle", newDemand: { ...sessionDemand, salary: newSalary, years: newYears },
      patienceCost: 1 + (hotHeaded ? 1 : 0), moraleDelta: 0, willingness: w };
  }

  return { outcome: "insulted", newDemand: { ...sessionDemand },
    patienceCost: 2 + (hotHeaded ? 1 : 0), moraleDelta: -5, willingness: w };
}


// ─── SQUAD MORALE EVENTS ──────────────────────────────────────────────────────
// Called when a hero leaves (dismissed, walkout, or retirement).
// Returns updated heroes array with morale deltas applied.
//
// eventType: "dismiss" | "walkout" | "retire"
// Retirement is positive; dismissal and walkout are negative.
// Heroes in the same position as the departed feel it more.
// Traits modulate both the sender and the receivers.

function applySquadMoraleEvent(heroes, departed, formation, eventType) {
  const isRetirement = eventType === "retire";
  const isWalkout    = eventType === "walkout";

  // Find which position the departed hero occupied
  const departedPos = Object.keys(formation).find(p=>
    (formation[p]||[]).some(h=>h&&h.id===departed.id)
  );

  // Base morale swing per remaining hero
  const baseSwing = isRetirement ? rand(4,10) : isWalkout ? -rand(6,14) : -rand(3,8);

  // Inspiring hero retiring gives a bigger boost
  const inspiredBonus = isRetirement && departed.traits?.includes("Inspiring") ? rand(3,6) : 0;

  // High-level hero retiring is a bigger event
  const levelBonus = isRetirement ? Math.floor(departed.level * 0.8) : 0;

  const totalBase = baseSwing + inspiredBonus + levelBonus;

  return heroes.map(h => {
    if (h.id === departed.id) return h;

    let swing = totalBase;

    // Same-position teammates feel it more (positive or negative)
    const heroPos = Object.keys(formation).find(p=>
      (formation[p]||[]).some(x=>x&&x.id===h.id)
    );
    if (heroPos && heroPos === departedPos) {
      swing = Math.round(swing * 1.5);
    }

    // Trait modifiers on the receiver
    if (h.traits?.includes("Loyal"))      swing = Math.round(swing * (isRetirement ? 1.2 : 1.4));
    if (h.traits?.includes("Coward"))     swing = Math.round(swing * 0.5);
    if (h.traits?.includes("Inspiring"))  swing = Math.round(swing * 1.1);
    if (h.traits?.includes("Hot-headed") && !isRetirement) swing = Math.round(swing * 1.3);
    if (h.traits?.includes("Brave") && !isRetirement) swing = Math.round(swing * 0.5); // Brave: shrug off bad news
    if (h.traits?.includes("Calm"))       swing = Math.round(swing * 0.6); // Calm: emotionally stable

    const newMorale = Math.min(100, Math.max(5, h.morale + swing));
    return { ...h, morale: newMorale };
  });
}

// ─── RANDOM EVENTS ───────────────────────────────────────────────────────────
// Fires every ~3 weeks. Requires 1–2 heroes meeting a stat threshold.
// Accepting sends those heroes away for 2–4 weeks (fatigue + possible injury).
// Rewards: gold, XP, stat boost, rare trait, or renown.

const RANDOM_EVENTS = [

  // ── THE ARENA ─────────────────────────────────────────────────────────────
  {
    id:"ironblood_bout",
    theme:"arena",
    title:"The Ironblood Bout",
    icon:"",
    flavour:"The underground circuit asks no questions. It pays in blood and gold.",
    stats:["Strength","Endurance"],
    heroesNeeded:1,
    awayWeeks:[2,2],
    commitment:"low",
    reward:{ goldRange:[450,700], traitChance:"Brave" },
    rewardDesc:"450–700g + Brave trait chance",
  },
  {
    id:"grand_colosseum",
    theme:"arena",
    title:"The Grand Colosseum",
    icon:"",
    flavour:"The crown's arena. To fight here is to be remembered.",
    stats:["Strength","Agility","Composure"],
    heroesNeeded:1,
    awayWeeks:[3,3],
    commitment:"medium",
    reward:{ goldRange:[900,1400], xp:"large" },
    rewardDesc:"900–1,400g + large XP",
  },
  {
    id:"gauntlet_of_blades",
    theme:"arena",
    title:"The Gauntlet of Blades",
    icon:"",
    flavour:"The Gauntlet doesn't care who you are. It only cares whether you can still stand at the end.",
    stats:["Agility","Defense"],
    heroesNeeded:2,
    awayWeeks:[3,3],
    commitment:"high",
    reward:{ goldRange:[1200,1800], xp:"medium", xpBoth:true },
    rewardDesc:"1,200–1,800g + XP to both",
  },
  {
    id:"beast_pits",
    theme:"arena",
    title:"The Beast Pits",
    icon:"",
    flavour:"Something old and hungry lives beneath the arena. They want to see if you're faster.",
    stats:["Agility","Determination"],
    heroesNeeded:1,
    awayWeeks:[2,2],
    commitment:"low",
    reward:{ goldRange:[350,550], traitChance:"Resilient" },
    rewardDesc:"350–550g + Resilient trait chance",
  },
  {
    id:"champions_invitation",
    theme:"arena",
    title:"The Champion's Invitation",
    icon:"",
    flavour:"A reigning champion has named your warrior specifically. Refusing is its own kind of cowardice.",
    stats:["Strength","Intimidation"],
    heroesNeeded:1,
    awayWeeks:[3,3],
    commitment:"medium",
    reward:{ goldRange:[600,1000], traitChance:"Berserker", traitChanceAlt:"Brave" },
    rewardDesc:"600–1,000g + Berserker or Brave trait chance",
  },

  // ── THE WILDS ─────────────────────────────────────────────────────────────
  {
    id:"unmapped_passes",
    theme:"wilds",
    title:"The Unmapped Passes",
    icon:"",
    flavour:"The cartographers will pay well. The mountains will take what they're owed.",
    stats:["Endurance","Determination"],
    heroesNeeded:2,
    awayWeeks:[4,4],
    commitment:"high",
    reward:{ goldRange:[1400,2100], xp:"medium", xpBoth:true, traitChance:"Resilient", traitChanceAlt:"Iron Will", traitBoth:true },
    rewardDesc:"1,400–2,100g + XP + Resilient/Iron Will trait chance to both",
  },
  {
    id:"hunters_wage",
    theme:"wilds",
    title:"The Hunter's Wage",
    icon:"",
    flavour:"Something is hunting the trade roads. The villages pooled what little they have.",
    stats:["Accuracy","Agility"],
    heroesNeeded:1,
    awayWeeks:[2,2],
    commitment:"low",
    reward:{ goldRange:[400,650], xp:"small" },
    rewardDesc:"400–650g + XP",
  },
  {
    id:"frozen_expedition",
    theme:"wilds",
    title:"The Frozen Expedition",
    icon:"",
    flavour:"No one maps the northern wastes willingly. The pay reflects that.",
    stats:["Endurance","Adaptability"],
    heroesNeeded:2,
    awayWeeks:[4,4],
    commitment:"high",
    reward:{ goldRange:[1400,2100], xp:"medium", xpBoth:true, statBoost:"Determination", statBoostBoth:true },
    rewardDesc:"1,400–2,100g + XP + Determination boost to both",
  },
  {
    id:"dragons_shadow",
    theme:"wilds",
    title:"The Dragon's Shadow",
    icon:"",
    flavour:"Scholars need escort into the deep mountains. The shadows up there move wrong.",
    stats:["Magic Resist","Determination"],
    heroesNeeded:1,
    awayWeeks:[3,3],
    commitment:"medium",
    reward:{ goldRange:[600,1000], statBoost:"Magic Resist", xp:"small" },
    rewardDesc:"600–1,000g + Magic Resist boost + XP",
  },
  {
    id:"cursed_ruin",
    theme:"wilds",
    title:"The Cursed Ruin",
    icon:"",
    flavour:"Treasure hunters found something they couldn't bring back alone. Or wouldn't.",
    stats:["Determination","Adaptability"],
    heroesNeeded:1,
    awayWeeks:[2,2],
    commitment:"low",
    reward:{ goldRange:[350,700] },
    rewardDesc:"350–700g",
  },

  // ── THE COURTS ────────────────────────────────────────────────────────────
  {
    id:"high_council_seat",
    theme:"courts",
    title:"The High Council Seat",
    icon:"",
    flavour:"A seat at the council is worth more than a battlefield. The right voice can move armies.",
    stats:["Leadership","Charisma"],
    heroesNeeded:1,
    awayWeeks:[3,3],
    commitment:"medium",
    reward:{ goldRange:[600,1000], statBoost:"Leadership", xp:"small" },
    rewardDesc:"600–1,000g + Leadership boost + XP",
  },
  {
    id:"trade_dispute",
    theme:"courts",
    title:"The Trade Dispute",
    icon:"",
    flavour:"Two merchant houses stand at the edge of open conflict. One clever arbitrator could end it.",
    stats:["Negotiation","Charisma"],
    heroesNeeded:1,
    awayWeeks:[2,2],
    commitment:"low",
    reward:{ goldRange:[600,950] },
    rewardDesc:"600–950g",
  },
  {
    id:"hostage_negotiation",
    theme:"courts",
    title:"The Hostage Negotiation",
    icon:"",
    flavour:"A noble's heir has been taken. The family wants them back quietly. No soldiers.",
    stats:["Negotiation","Composure"],
    heroesNeeded:1,
    awayWeeks:[3,3],
    commitment:"medium",
    reward:{ goldRange:[1000,1500] },
    rewardDesc:"1,000–1,500g",
  },
  {
    id:"warlords_banquet",
    theme:"courts",
    title:"The Warlord's Banquet",
    icon:"",
    flavour:"Powerful men invite you to their table for one reason — to decide if you're a threat or an opportunity.",
    stats:["Intimidation","Composure"],
    heroesNeeded:1,
    awayWeeks:[2,2],
    commitment:"low",
    reward:{ goldRange:[350,550], statBoost:"Intimidation" },
    rewardDesc:"350–550g + Intimidation boost",
  },
  {
    id:"royal_address",
    theme:"courts",
    title:"The Royal Address",
    icon:"",
    flavour:"The crown requires a representative of exceptional bearing to tour the outer provinces.",
    stats:["Charisma","Leadership","Reputation"],
    heroesNeeded:1,
    awayWeeks:[4,4],
    commitment:"medium",
    reward:{ goldRange:[800,1300], statBoost:"Charisma", xp:"small" },
    rewardDesc:"800–1,300g + Charisma boost + XP",
  },

  // ── THE ARCANE ────────────────────────────────────────────────────────────
  {
    id:"arcane_guild_trial",
    theme:"arcane",
    title:"The Arcane Guild Trial",
    icon:"",
    flavour:"The Guild admits only those who can demonstrate true mastery. The test is not gentle.",
    stats:["Magic Power","Magic Resist"],
    heroesNeeded:1,
    awayWeeks:[2,2],
    commitment:"low",
    reward:{ goldRange:[350,700], xp:"large", traitChance:"Tactician" },
    rewardDesc:"350–700g + large XP + Tactician trait chance",
  },
  {
    id:"plague_ward",
    theme:"arcane",
    title:"The Plague Ward",
    icon:"",
    flavour:"The illness is spreading. A healer of real power is the only hope these people have.",
    stats:["Magic Resist","Composure"],
    heroesNeeded:1,
    awayWeeks:[2,2],
    commitment:"low",
    reward:{ goldRange:[350,700], xp:"small", healFatigue:true },
    rewardDesc:"350–700g + XP + fatigue fully recovered on return",
  },
  {
    id:"oracles_chamber",
    theme:"arcane",
    title:"The Oracle's Chamber",
    icon:"",
    flavour:"The Oracle grants audience rarely, and only to those whose minds are clear enough to receive what she offers.",
    stats:["Composure","Determination"],
    heroesNeeded:1,
    awayWeeks:[3,3],
    commitment:"medium",
    reward:{ statBoostChoice:true, xp:"small" },
    rewardDesc:"Player's choice stat boost + XP",
  },
  {
    id:"draconic_archive",
    theme:"arcane",
    title:"The Draconic Archive",
    icon:"",
    flavour:"The scholars need protection. The archive needs cataloguing. Neither task is safe.",
    stats:["Magic Resist","Tactics"],
    heroesNeeded:2,
    awayWeeks:[4,4],
    commitment:"high",
    reward:{ goldRange:[1400,2100], statBoost:"Magic Resist", statBoostBoth:true, xp:"medium", xpBoth:true },
    rewardDesc:"1,400–2,100g + Magic Resist boost to both + XP to both",
  },
  {
    id:"sealed_circle",
    theme:"arcane",
    title:"The Sealed Circle",
    icon:"",
    flavour:"Something was contained here long ago. The seal is weakening. Someone with real power needs to reinforce it.",
    stats:["Magic Power","Magic Resist"],
    heroesNeeded:2,
    awayWeeks:[3,3],
    commitment:"high",
    reward:{ goldRange:[1000,1600], xp:"medium", xpBoth:true, traitChance:"Blessed", traitBoth:true },
    rewardDesc:"1,000–1,600g + XP to both + Blessed trait chance",
  },

  // ── THE SHADOWS ───────────────────────────────────────────────────────────
  {
    id:"shadow_vault",
    theme:"shadows",
    title:"The Shadow Vault",
    icon:"",
    flavour:"The map showed a sealed chamber. The guild wants what's inside. You want a cut.",
    stats:["Agility","Determination"],
    heroesNeeded:1,
    awayWeeks:[2,2],
    commitment:"low",
    reward:{ goldRange:[350,700] },
    rewardDesc:"350–700g",
  },
  {
    id:"marked_target",
    theme:"shadows",
    title:"The Marked Target",
    icon:"",
    flavour:"Someone important has made powerful enemies. Your hero has been given a name and a purse.",
    stats:["Determination","Adaptability"],
    heroesNeeded:1,
    awayWeeks:[3,3],
    commitment:"medium",
    reward:{ goldRange:[600,1000] },
    rewardDesc:"600–1,000g",
  },
  {
    id:"spys_gambit",
    theme:"shadows",
    title:"The Spy's Gambit",
    icon:"",
    flavour:"The crown's shadow network needs someone who can disappear into a foreign court and return with answers.",
    stats:["Charisma","Reputation"],
    heroesNeeded:1,
    awayWeeks:[3,3],
    commitment:"medium",
    reward:{ goldRange:[500,800], statBoost:"Reputation" },
    rewardDesc:"500–800g + Reputation boost",
  },
  {
    id:"cult_unmasking",
    theme:"shadows",
    title:"The Cult Unmasking",
    icon:"",
    flavour:"They're hiding in plain sight. Finding them requires patience and nerve. Two minds are safer than one.",
    stats:["Adaptability","Composure"],
    heroesNeeded:2,
    awayWeeks:[3,3],
    commitment:"high",
    reward:{ goldRange:[1000,1600], xp:"medium", xpBoth:true },
    rewardDesc:"1,000–1,600g + XP to both",
  },
  {
    id:"underworld_exchange",
    theme:"shadows",
    title:"The Underworld Exchange",
    icon:"",
    flavour:"An anonymous client. An anonymous package. Anonymous gold. Ask no questions.",
    stats:["Negotiation","Agility"],
    heroesNeeded:1,
    awayWeeks:[2,2],
    commitment:"low",
    reward:{ goldRange:[600,1000] },
    rewardDesc:"600–1,000g",
  },
];

// ─── EVENT CORRESPONDENCE ────────────────────────────────────────────────────
// Every event theme is a SENDER with a voice, a seal, and an ink. Events arrive
// as letters; returns come back as dispatches written in the sender's hand.
const EVENT_THEMES = {
  arena: {
    label: "The Arena Circuit", ink: "#7E2D26", seal: "V",
    sender: "Mad Herod Vance", senderTitle: "Master of Games",
    salutation: "Steward — the crowd is hungry and the purse is real.",
    signoff: "Blood pays for blood,",
    returnLines: {
      success: [
        "The crowd chanted {hero}'s name until the torches burnt out. Enclosed: the purse, every coin of it.",
        "{hero} left the sand standing and the bookmakers weeping. A pleasure doing business.",
        "Three challengers, three verdicts. {hero} is welcome on my sand any day of any year.",
      ],
      partial: [
        "{hero} won ugly. The crowd wants beauty or blood, and got neither — half the purse enclosed.",
        "A draw, called on account of the surgeon. {hero} fought well enough to be paid something.",
        "The judges split. So does the purse. {hero} will want another go, I'd wager.",
      ],
      failure: [
        "The sand takes more than it gives. {hero} learned that the hard way. No purse.",
        "{hero} went down in the third exchange. The crowd loved it. You won't.",
        "I've seen worse debuts, but not this season. Send {hero} back when the bruises fade.",
      ],
    },
  },
  wilds: {
    label: "The Outer Roads", ink: "#40614F", seal: "W",
    sender: "Warden-Captain Brask", senderTitle: "of the Outer Roads",
    salutation: "Steward. Plain terms: the work is real and so is the danger.",
    signoff: "Keep your walls mended,",
    returnLines: {
      success: [
        "Contract fulfilled. {hero} did the work of three and complained less than one. Payment enclosed in full.",
        "The road is clear. What was hunting it isn't hunting anything anymore. {hero} has my respect — I don't give it often.",
        "{hero} read the country like a map and brought everyone home. Coin enclosed. Consider a standing arrangement.",
      ],
      partial: [
        "Job's half done. The other half retreated somewhere we don't follow. {hero} earned half the wage — enclosed.",
        "Weather turned. {hero} made the sensible call to come back alive. Partial payment, no hard feelings.",
        "We got what we came for, mostly. {hero} carried the worst of it. Half wage enclosed.",
      ],
      failure: [
        "The wilds won this one. {hero} comes back with nothing but the lesson. No wage. That's the contract.",
        "Turned back at the tree line. Whatever's in there wanted us to know it saw us. No payment.",
        "I'll be blunt: {hero} wasn't ready for that country. Few are. No coin changes hands.",
      ],
    },
  },
  courts: {
    label: "The Courts", ink: "#8A6D3B", seal: "A",
    sender: "Lady Amaranthe Veil", senderTitle: "Chancellor of Protocols",
    salutation: "To the Steward, with the court's fondest regard — and its usual conditions.",
    signoff: "Ever your servant in all things visible,",
    returnLines: {
      success: [
        "{hero} navigated the season's intrigues with a delicacy I confess I did not expect. The fee is enclosed, with a little extra discretion.",
        "The matter is resolved, the parties reconciled, and nobody important embarrassed. {hero} may return to you with the court's gratitude — and its gold.",
        "Consider every door in the capital now slightly more open. {hero} was, in a word, exquisite.",
      ],
      partial: [
        "A qualified success. The right people are pleased; the wrong people are merely not displeased. Half the agreed sum, as protocol demands.",
        "{hero} charmed half the table. Unfortunately the other half holds the treasury. Partial payment enclosed.",
        "The affair concluded without scandal, which at this court counts as achievement. A reduced fee, with apologies.",
      ],
      failure: [
        "I shall be gentle: the court found {hero} refreshing, the way one finds a draught refreshing in winter. No fee is payable.",
        "The negotiation collapsed over the fish course. These things happen. No payment, and we shall not speak of it again.",
        "{hero} told the truth at a state dinner. Admirable. Catastrophic, but admirable. No fee.",
      ],
    },
  },
  arcane: {
    label: "The Ninth Archive", ink: "#5F4B66", seal: "H",
    sender: "Magister Hollowquill", senderTitle: "Keeper of the Ninth Archive",
    salutation: "Steward — you will forgive the presumption; I knew you would read this before you opened it.",
    signoff: "In anticipation of what comes,",
    returnLines: {
      success: [
        "The working held. {hero} has seen things that will take a season to properly forget — the payment enclosed should ease the process.",
        "Precisely as foreseen. {hero} performed admirably, and the Archive is quietly in your debt. The coin is the loud part of our gratitude.",
        "Done, and well done. Tell {hero} the dreams stop after a fortnight. Usually.",
      ],
      partial: [
        "A partial binding. Sufficient, for now. {hero} is owed half the fee and all of my sympathy.",
        "The lesser outcome, though not the least. Enclosed: half payment, and my note that {hero} flinched only twice.",
        "We achieved what could be achieved. The rest was never achievable — I simply needed that confirmed. Half fee enclosed.",
      ],
      failure: [
        "The working failed. This, too, was one of the futures. {hero} bears no fault — the fault is structural, and old. No fee.",
        "Some doors decline to open, whatever key one sends. {hero} returns unpaid but — importantly — returns.",
        "I misread a sign. It happens once a decade and {hero} had the misfortune of being present for it. No payment; my apologies are enclosed instead.",
      ],
    },
  },
  shadows: {
    label: "No Return Address", ink: "#23201A", seal: "•",
    sender: "(unsigned)", senderTitle: "",
    salutation: "Read once. Burn after.",
    signoff: "",
    returnLines: {
      success: [
        "Done. Clean. The full amount, small coins, no questions either direction.",
        "Package delivered. Your {hero} asks fewer questions than most. We noticed. Payment in full.",
        "The matter is closed. If anyone asks, it never opened. Coin enclosed.",
      ],
      partial: [
        "Complications. Handled, but loudly. Half payment — the other half went to making it quiet again.",
        "The job changed midway. {hero} adapted. Half the agreed sum; the client is being difficult.",
        "Half done is how the client wants it left. Half paid is how they left it. Don't ask.",
      ],
      failure: [
        "The job went wrong. Not {hero}'s doing — someone talked. We're finding out who. No payment this time.",
        "Walk away from this one. {hero} was seen; being seen is the one unforgivable sin. Nothing enclosed.",
        "No coin. No explanation. The less {hero} remembers about this, the better for everyone.",
      ],
    },
  },
};

const SPECIAL_EVENTS = [
  {
    id:"wandering_master",
    title:"The Wandering Master",
    icon:"",
    flavour:"A legendary figure has arrived at your gates. For a modest fee, they offer to impart something that cannot be taught through ordinary training.",
    cost:200,
    type:"wandering_master",
    cooldownSeasons:2,
    reward:{ statBoostChoice:true },
    rewardDesc:"Player's choice stat boost to one hero (can exceed potential)",
  },
  {
    id:"the_challenge",
    title:"The Challenge",
    icon:"",
    flavour:"A rival lord has issued a formal challenge. The purse is generous. The opponent will not be.",
    type:"challenge",
    opponentPowerMult:1.30,
    rewardMult:2.0,
    declinePenalty:{ morale:-8 },
    rewardDesc:"100% higher gold and XP — opponent is 30% stronger",
  },
];


// ── EVENT QUALIFICATION — matchScore based, no hard gates ────────────────
// matchScore = hero's average across event stats / event's requirement midpoint
// Events have no minimum — all heroes can attempt any event
// Confidence label shown in UI, actual probability calculated fluidly

const EVENT_STAT_MIDPOINTS = {
  // Midpoint values representing a "typical" requirement for each stat
  // Used as the denominator when events don't have explicit minimums
  "Strength":55,"Agility":55,"Endurance":55,"Defense":50,
  "Magic Power":55,"Accuracy":52,"Magic Resist":50,
  "Tactics":52,"Composure":52,"Leadership":50,
  "Adaptability":50,"Determination":52,
  "Charisma":50,"Negotiation":48,"Intimidation":48,"Reputation":45,
};

// Event difficulty scales with the player's tier. The midpoints above are
// silver-calibrated (~50), so a low-tier squad would be a Longshot on every
// event. reqScale (= target/50, stamped on each generated event) eases the bar
// at low tiers and raises it at high tiers, so at any tier a hero *strong in the
// tested stats* is Possible/Strong while a weak or off-stat hero is a Longshot.
const TIER_EVENT_REQ = { iron: 32, bronze: 40, silver: 52, gold: 66, platinum: 80 };

function calcRelativeStars(opponentPower, tierId) {
  const tier = TIERS[tierId];
  if(!tier) return 3;
  const { powerMin, powerMax } = tier;
  const position = (opponentPower - powerMin) / Math.max(1, powerMax - powerMin);
  const clamped = Math.min(1, Math.max(0, position));
  return clamped < 0.2 ? 1 : clamped < 0.4 ? 2 : clamped < 0.6 ? 3 : clamped < 0.8 ? 4 : 5;
}

function renderStars(stars) {
  // Filled-only: contrast between filled and outline glyphs was too low to read
  // at display sizes. Difficulty now communicated purely by how many stars show.
  return "★".repeat(Math.max(0, Math.min(5, stars)));
}

function starsColor(stars) {
  return stars <= 2 ? "#40614F" : stars === 3 ? "#8A6D3B" : stars === 4 ? "#9A5B2B" : "#7E2D26";
}

// Trait × event-theme chemistry — who a hero IS changes what they're suited for.
// A Coward in the arena is a liability; a Cursed hero resonates with arcane work.
const EVENT_TRAIT_MODS = {
  arena:   { "Berserker":0.15, "Brave":0.10, "Glass Cannon":0.10, "Hot-headed":0.08, "Coward":-0.20 },
  wilds:   { "Night Vision":0.15, "Resilient":0.10, "Swift":0.08, "Glass Cannon":-0.10 },
  courts:  { "Inspiring":0.12, "Calm":0.10, "Greedy":0.08, "Hot-headed":-0.15, "Stubborn":-0.10 },
  arcane:  { "Blessed":0.12, "Iron Will":0.10, "Cursed":0.10, "Coward":-0.10 },
  shadows: { "Swift":0.12, "Night Vision":0.12, "Greedy":0.10, "Loyal":-0.08, "Brave":-0.05 },
};

function eventTraitMods(hero, eventDef) {
  const mods = EVENT_TRAIT_MODS[eventDef?.theme] || {};
  return (hero.traits||[]).filter(t=>mods[t]!==undefined).map(t=>({trait:t, mod:mods[t]}));
}

export function calcMatchScore(hero, eventDef) {
  const stats = eventDef.stats || [];
  if(!stats.length) return 1.0;
  // reqScale tracks the player's tier (stamped at generation). The flat midpoints
  // are silver-calibrated, so without scaling a low-tier squad is a Longshot on
  // everything. Scaling the bar to the tier keeps the "pick the right hero"
  // tension (a hero strong in the tested stats clears it; a weak one doesn't).
  const scale = eventDef.reqScale || 1;
  const heroAvg = stats.reduce((a,s) => a + (hero.stats[s]||0), 0) / stats.length;
  const reqAvg  = stats.reduce((a,s) => a + (EVENT_STAT_MIDPOINTS[s]||50)*scale, 0) / stats.length;
  let score = reqAvg > 0 ? heroAvg / reqAvg : 1.0;
  eventTraitMods(hero, eventDef).forEach(({mod})=>{ score += mod; });
  return Math.max(0.1, score);
}

function getEventConfidence(matchScore) {
  if(matchScore >= 1.15) return { label:"Strong",   color:"#40614F", icon:"" };
  if(matchScore >= 0.75) return { label:"Possible",  color:"#8A6D3B", icon:"" };
  return                        { label:"Longshot",  color:"#7E2D26", icon:"" };
}

// Fluid success probability — hidden from player, drives outcome roll
export function calcEventSuccessChance(matchScore) {
  const success = Math.min(0.82, Math.max(0.10, matchScore * 0.58));
  const failure = Math.min(0.65, Math.max(0.05, (1 - matchScore) * 0.65));
  const partial = Math.max(0.05, 1 - success - failure);
  return { success, partial, failure };
}

function getAvailableHeroes(heroes) {
  return heroes.filter(h => !h.injured && !h.retired && !(h.awayWeeks > 0));
}

function generateRandomEvent(heroes, week, playerTier="silver") {
  const available = getAvailableHeroes(heroes);
  if(!available.length) return null;
  // All events are always candidates — no qualification gate. Difficulty is
  // tier-scaled via reqScale so bronze events are winnable with the right hero.
  const template = pick(RANDOM_EVENTS);
  const gold = template.reward.goldRange
    ? rand(...template.reward.goldRange)
    : 0;
  const reqScale = (TIER_EVENT_REQ[playerTier] || 50) / 50;
  return { ...template, gold, week, reqScale, id:`${template.id}_${week}` };
}
// Heroes accumulate fatigue (0–100) from raiding. High fatigue reduces combat
// score and increases injury risk. Bench rest recovers fatigue each week.
// Endurance stat slows fatigue gain; Infirmary building speeds recovery.

// A season is 42 weeks. (A quicker game mode was once planned but abandoned —
// the rebalancing cost outweighed the benefit — so this is a fixed constant.)
const SEASON_LENGTH = 42;
// 3 objectives per season, randomly selected from this pool.
// All check against formation/raid data — no level gates.

// ─── ACHIEVEMENTS & LEGACY BOONS ─────────────────────────────────────────────
// Achievements are checked at Legacy Ceremony time.
// Each unlocks a boon that the player can optionally activate in future runs.


const ACHIEVEMENTS = [
  {
    id:       "iron_dynasty",
    name:     "Iron Dynasty",
    desc:     "Reach Rank #1 in Platinum — conquer the realm",
    icon:     "",
    check:    ()=>true, // always awarded on Legacy Ceremony
    boon: {
      id:     "iron_dynasty",
      name:   "Conqueror's Coffers",
      desc:   "Begin the realm with +1,000g — a generous war chest.",
      icon:   "",
      apply:  (state)=>({...state, gold: (state.gold||4000)+1000 }),
    },
  },
  {
    id:       "undefeated",
    name:     "Undefeated Season",
    desc:     "Win a full season with zero losses",
    icon:     "",
    check:    (data)=>data.trophies.some(t=>t.losses===0),
    boon: {
      id:     "undefeated",
      name:   "Battle-Hardened Squad",
      desc:   "All starting heroes begin with +10 morale.",
      icon:   "",
      apply:  (state)=>({...state, heroes: state.heroes.map(h=>({...h,morale:Math.min(100,h.morale+10)}))}),
    },
  },
  {
    id:       "full_house",
    name:     "Full House",
    desc:     "Fill every build slot in one realm",
    icon:     "",
    check:    (data)=>TIER_ORDER.every(t=>buildingCapReached(data.buildings, t)),
    boon: {
      id:     "full_house",
      name:   "Pre-Built Barracks",
      desc:   "Start the realm with the Barracks already constructed.",
      icon:   "",
      apply:  (state)=>({...state, buildings: state.buildings.map(b=>b.id==="barracks"?{...b,built:true}:b)}),
    },
  },
  {
    id:       "legend_retires",
    name:     "Legend Retires",
    desc:     "Have a hero reach Level 13 and retire in the same realm",
    icon:     "",
    check:    (data)=>data.retiredMax13,
    boon: {
      id:     "legend_retires",
      name:   "Veteran Recruit",
      desc:   "One starting hero begins at Level 3 with boosted stats.",
      icon:   "",
      apply:  (state)=>{
        const idx = state.heroes.findIndex(h=>h.level<3);
        if(idx===-1) return state;
        const h = state.heroes[idx];
        const newH = {...h, level:3, xp:450, stats: Object.fromEntries(Object.entries(h.stats).map(([k,v])=>k==="Potential"?[k,v]:[k,Math.min(v+8,h.stats.Potential||99)]))};
        const newHeroes = [...state.heroes]; newHeroes[idx]=newH;
        return {...state, heroes:newHeroes};
      },
    },
  },
  {
    id:       "first_promotion",
    name:     "On the Rise",
    desc:     "Earn your first promotion out of Iron tier",
    icon:     "",
    check:    (data)=>data.everPromoted,
    boon: {
      id:     "first_promotion",
      name:   "Seasoned Scout",
      desc:   "The starting market includes one guaranteed Peak-stage hero — battle-ready from day one.",
      icon:   "",
      apply:  (state)=>{
        // Replace one market hero with a Peak-stage hero
        if(!state.market||state.market.length===0) return state;
        const peakHero = generateHero(Date.now(), true, false, false, null, null, "iron");
        const { stage, stageProgress } = careerWeekToStage(stageToCareerWeek("peak", rand(10,50)));
        const peaked = {...peakHero, stage, stageProgress,
          stats: Object.fromEntries(Object.entries(peakHero.stats).map(([k,v])=>
            ["Potential","Form","Reputation"].includes(k)?[k,v]:[k,Math.min(peakHero.stats.Potential||50, v+rand(5,12))]
          ))
        };
        const newMarket = [...state.market]; newMarket[0] = peaked;
        return {...state, market: newMarket};
      },
    },
  },
  {
    id:       "golden_vault",
    name:     "Golden Vault",
    desc:     "Accumulate 100,000g at any point in a realm",
    icon:     "",
    check:    (data)=>data.peakGold>=100000,
    boon: {
      id:     "golden_vault",
      name:   "Long-Term Deals",
      desc:   "All starting heroes have double contract length — fewer renewals to manage early.",
      icon:   "",
      apply:  (state)=>({...state, heroes: state.heroes.map(h=>({...h, contractWeeksLeft:(h.contractWeeksLeft||24)*2}))}),
    },
  },
  {
    id:       "ability_scout",
    name:     "Ability Scout",
    desc:     "Successfully mitigate 100 enemy abilities in a realm",
    icon:     "",
    check:    (data)=>(data.abilitiesMitigated||0)>=100,
    boon: {
      id:     "ability_scout",
      name:   "Battle-Sharp",
      desc:   "All starting heroes begin with Form 8/10 — already in good shape.",
      icon:   "",
      apply:  (state)=>({...state, heroes: state.heroes.map(h=>({...h, stats:{...h.stats, Form:Math.max(h.stats.Form||5, 8)}}))}),
    },
  },
  {
    id:       "transfer_king",
    name:     "Banner Broker",
    desc:     "Send 15 heroes to serve rival banners in a single realm",
    icon:     "",
    check:    (data)=>(data.heroesSold||0)>=15,
    boon: {
      id:     "transfer_king",
      name:   "Well-Rounded Roster",
      desc:   "Starting squad has guaranteed role coverage — one Warrior, one Ranger, one Mage, one Cleric, one Rogue, one Paladin.",
      icon:   "",
      apply:  (state)=>{
        const roles = ["Warrior","Ranger","Mage","Cleric","Rogue","Paladin"];
        const newHeroes = state.heroes.map((h,i)=>i<roles.length?{...h,role:roles[i]}:h);
        return {...state, heroes:newHeroes};
      },
    },
  },
  {
    id:       "synergy_master",
    name:     "Synergy Master",
    desc:     "Win battles with 3 different race synergies active in one realm",
    icon:     "",
    check:    (data)=>Object.keys(data.raceSynergyUsage||{}).length>=3,
    boon: {
      id:     "synergy_master",
      name:   "United Bloodline",
      desc:   "Choose your starting squad's race — all 8 starting heroes share the same race.",
      icon:   "",
      apply:  (state)=>{
        // Pick the most common race in the starting squad and unify to it
        const raceCounts = {};
        state.heroes.forEach(h=>{ raceCounts[h.race]=(raceCounts[h.race]||0)+1; });
        const topRace = Object.entries(raceCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || "Human";
        return {...state, heroes: state.heroes.map(h=>({...h,race:topRace}))};
      },
    },
  },
];

function checkAchievements(data) {
  return ACHIEVEMENTS.filter(a => a.check(data)).map(a => a.id);
}
// Each new game guarantees one star prospect and occasionally a solid veteran.
// The rest are standard heroes. Creates a run hook without hand-holding.

export function generateStartingSquad() {
  const squad = [];

  // ── STAR HERO (slot 0) ────────────────────────────────────────────────────
  // Always early-to-mid Peak — their best years just beginning.
  // id 100, NOT 0: hero ids flow through truthiness checks in places
  // (leader lookups, serialized-preset counts) and id 0 reads as "empty".
  // Pre-fix saves may still carry an id-0 foundling, so those checks also
  // compare against null explicitly — keep both halves in place.
  const star = generateHero(100);
  const starPot = rand(65, 80);
  const starCareerWk = stageToCareerWeek("peak", rand(5, 35)); // early Peak
  const { stage: starStage, stageProgress: starProgress } = careerWeekToStage(starCareerWk);
  const starStats = {};
  ALL_STATS.forEach(s => {
    if(s==="Potential"){ starStats[s]=starPot; return; }
    if(["Form"].includes(s)) return;
    const lo = Math.max(10, Math.floor(starPot*0.25));
    const hi = Math.max(lo, Math.floor(starPot*0.50));
    starStats[s] = Math.min(starPot, rand(lo,hi)+rand(1,3));
  });
  starStats.Form = rand(5,8);
  const starTraits = pickTraits(rand(2,3));
  const starAvg = Object.values(starStats).reduce((a,b)=>a+b,0)/ALL_STATS.length;
  const starContract = rand(1,3);
  squad.push({
    ...star,
    stage: starStage,
    stageProgress: starProgress,
    stats: starStats,
    traits: starTraits,
    level: 2, xp: xpForLevel(2),
    value: Math.max(80, Math.floor(starAvg * 7 * (1 + 0 * 0.32) * TRANSFER_FEE_SCALE + rand(-20,20))),
    salary: Math.floor(starAvg*rand(13,16)/10),
    contractYears: starContract,
    contractWeeks: starContract*WEEKS_PER_CONTRACT_YEAR,
    contractWeeksLeft: starContract*WEEKS_PER_CONTRACT_YEAR,
    foundling: true,
    baseStats: {...starStats},
  });

  // ── GUARANTEED ROLE COVERAGE (slots 1–3) ─────────────────────────────────
  // Rising stage — capable but developing, capped at level 1
  const guaranteedRoles = [
    pick(["Warrior","Paladin"]),
    pick(["Ranger","Rogue"]),
    pick(["Mage","Cleric"]),
  ];
  guaranteedRoles.forEach((role, i) => {
    const h = generateHero(i+1, false, false, false, role);
    const pot = rand(38, 52);
    const cw = stageToCareerWeek("rising", rand(10, 70));
    const { stage, stageProgress } = careerWeekToStage(cw);
    const stats = {...h.stats, Potential: pot};
    ALL_STATS.forEach(s => {
      if(["Potential","Form"].includes(s)) return;
      const lo = Math.max(10, Math.floor(pot*0.25));
      const hi = Math.max(lo, Math.floor(pot*0.50));
      stats[s] = Math.max(10, Math.min(pot, rand(lo,hi)));
    });
    stats.Form = rand(4,7);
    squad.push({...h, stage, stageProgress, stats, level:1, xp:0, baseStats:{...stats}});
  });

  // ── RANDOM NORMAL HEROES (slots 4–7) ─────────────────────────────────────
  // Prospect — raw, unproven, level 0
  const RACES_LIST = ["Human","Elf","Dwarf","Half-Orc","Gnome","Tiefling","Dragonborn"];
  for(let i=4; i<8; i++){
    const pot = rand(35,55);
    const cw = stageToCareerWeek("prospect", rand(20, 80));
    const { stage, stageProgress } = careerWeekToStage(cw);
    const stats = {};
    ALL_STATS.forEach(s => {
      if(s==="Potential"){ stats[s]=pot; return; }
      if(s==="Form"){ return; }
      const lo = Math.max(10, Math.floor(pot*0.25));
      const hi = Math.max(lo, Math.floor(pot*0.45));
      stats[s] = Math.max(10, Math.min(pot, rand(lo,hi)));
    });
    stats.Form = rand(4,7);
    const avgStat = Object.values(stats).reduce((a,b)=>a+b,0)/ALL_STATS.length;
    squad.push({
      id: Date.now()+i+rand(0,9999),
      name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      race: pick(RACES_LIST), role: pick(ROLES),
      stage, stageProgress, stats,
      traits: pickTraits(rand(1,2)),
      level: 0, xp: 0,
      salary: Math.floor(avgStat*rand(11,14)/10),
      value: 0,
      morale: rand(65,85),
      contractYears: 1,
      contractWeeks: WEEKS_PER_CONTRACT_YEAR,
      contractWeeksLeft: WEEKS_PER_CONTRACT_YEAR,
      injured: false, injuryWeeks: 0, retired: false,
      fatigue: 0, weeksUnplayed: 0, weeksInSquad: 0,
      weeksInFormation: 0, potentialRevealed: false,
      negotiationPending: false, negotiationIgnoredWeeks: 0,
      marketTier: "standard", mentorBonus: null,
      baseStats: {...stats},
    });
  }

  // ── FODDER (slots 8–9) ────────────────────────────────────────────────────
  // Prospect — clearly throwaway, free to sign
  for(let i=8; i<10; i++){
    const fodderPot = rand(18, 30);
    const cw = stageToCareerWeek("prospect", rand(10, 60));
    const { stage, stageProgress } = careerWeekToStage(cw);
    const fodderStats = {};
    ALL_STATS.forEach(s => {
      if(s==="Potential"){ fodderStats[s]=fodderPot; return; }
      if(s==="Form"){ return; }
      fodderStats[s] = Math.max(10, Math.min(fodderPot, Math.floor(fodderPot*rand(25,50)/100)));
    });
    fodderStats.Form = rand(3,6);
    const fodderAvg = Object.values(fodderStats).reduce((a,b)=>a+b,0)/ALL_STATS.length;
    squad.push({
      id: Date.now()+i+100+rand(0,9999),
      name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      race: pick(RACES_LIST), role: pick(ROLES),
      stage, stageProgress,
      stats: fodderStats,
      traits: pickTraits(1),
      level: 0, xp: 0,
      salary: Math.floor(fodderAvg*rand(11,14)/10),
      value: 0,
      morale: rand(60,80),
      contractYears: 1,
      contractWeeks: WEEKS_PER_CONTRACT_YEAR,
      contractWeeksLeft: WEEKS_PER_CONTRACT_YEAR,
      injured: false, injuryWeeks: 0, retired: false,
      fatigue: 0, weeksUnplayed: 0, weeksInSquad: 0,
      weeksInFormation: 0, potentialRevealed: false,
      negotiationPending: false, negotiationIgnoredWeeks: 0,
      marketTier: "standard", mentorBonus: null,
      fodder: true,
      baseStats: {...fodderStats},
    });
  }

  return squad.map(h=>({...h, weeksInFormation:0, potentialRevealed:false}));
}

// One hero can be designated Squad Leader. Bonuses apply only when they are
// in the formation. Score is 50% age-based + 50% weeks-in-squad, capped at 1.0.
// leaderMult: 1.0 → 1.75 (max bonus at age + tenure both maxed)

function calcLeaderScore(hero) {
  // Career progress: how far through their 504-week career (0–1)
  const careerWk = stageToCareerWeek(hero.stage||"peak", hero.stageProgress||0);
  const careerPct = Math.min(1.0, careerWk / TOTAL_CAREER_WEEKS);
  const squadPct = Math.min(1.0, (hero.weeksInSquad||0) / 400);
  return (careerPct * 0.5) + (squadPct * 0.5);
}

function calcLeaderMult(hero) {
  return 1.0 + calcLeaderScore(hero) * 0.75;
}

// Returns the active bonuses if the given leader is in the formation this battle
function calcLeaderBonuses(leader) {
  if(!leader) return null;
  const mult = calcLeaderMult(leader);
  return {
    moralePerWeek:   Math.round(4 * mult),           // +4–7 morale/week to formation
    xpMult:          1 + (0.04 * mult),              // 1.04–1.07× XP to raiders
    defeatMoralePct: Math.round(25 * mult),          // 25–44% less morale loss on defeat
    score:           Math.round(calcLeaderScore(leader) * 100),
    mult:            Math.round(mult * 100) / 100,
  };
}
const FATIGUE_RECOVER_BASE = 25;    // base fatigue recovered per rest week
const FATIGUE_GAIN_BASE    = 18;    // base fatigue gained per battle (modified by Endurance)
const FATIGUE_WARN = 70;            // yellow warning threshold
const FATIGUE_CRITICAL = 88;        // red — major penalty + injury risk spike

// Fatigue multiplier on combat score: 0 fatigue = 1.0, 100 = 0.55
function fatigueMult(fatigue) {
  return Math.max(0.55, 1.0 - (fatigue / 100) * 0.45);
}

function fatigueLabel(f) {
  if (f <= 30) return { label:"Fresh",    color:"#40614F" };
  if (f <= 55) return { label:"Tired",    color:"#8A6D3B" };
  if (f <= FATIGUE_WARN) return { label:"Fatigued",color:"#9A5B2B" };
  if (f <= FATIGUE_CRITICAL) return { label:"Exhausted",color:"#7E2D26" };
  return                     { label:"Burned Out",color:"#8F2A1E" };
}

export const POSITIONS = {
  Vanguard:   { label:"Vanguard",   subtitle:"Frontline breakers",  icon:"", color:"#7E2D26", slots:2, ideal:["Warrior","Paladin"],        penalty:["Mage","Cleric"],   primaryStats:["Strength","Endurance","Defense","Intimidation"],               desc:"Heavy melee. Warriors & Paladins excel." },
  Skirmisher: { label:"Skirmisher", subtitle:"Flankers & ambushers", icon:"", color:"#8A6D3B", slots:2, ideal:["Ranger","Rogue"],             penalty:["Paladin","Cleric"], primaryStats:["Agility","Accuracy","Determination","Adaptability"],           desc:"Fast flankers. Rangers & Rogues excel here." },
  Arbiter:    { label:"Arbiter",    subtitle:"Command & support",    icon:"", color:"#3C5A78", slots:2, ideal:["Mage","Cleric"],           penalty:["Warrior"],         primaryStats:["Magic Power","Magic Resist","Tactics","Leadership","Composure"], desc:"Rear command. Mages & Clerics dominate here." },
};
export const POS_KEYS = Object.keys(POSITIONS);

// Position-level role pairing bonuses — applied when 2 heroes share a position.
// Calibrated to contribute ~×1.07 max toward the ×1.5 total tactical ceiling.
const POSITION_PAIRINGS = [
  { pos:"Vanguard",   roles:["Warrior","Paladin"], mult:1.07 },
  { pos:"Vanguard",   roles:["Warrior","Warrior"], mult:1.04 },
  { pos:"Vanguard",   roles:["Paladin","Paladin"], mult:1.05 },
  { pos:"Skirmisher", roles:["Ranger","Rogue"],    mult:1.07 },
  { pos:"Skirmisher", roles:["Ranger","Ranger"],   mult:1.04 },
  { pos:"Skirmisher", roles:["Rogue","Rogue"],     mult:1.05 },
  { pos:"Arbiter",    roles:["Mage","Cleric"],     mult:1.07 },
  { pos:"Arbiter",    roles:["Mage","Mage"],       mult:1.04 },
  { pos:"Arbiter",    roles:["Cleric","Cleric"],   mult:1.05 },
];

// Race chemistry lives in the formation-wide RACE_SYNERGIES (mono / rainbow / duo
// pacts). Per-lane race pairings were dropped — they double-counted against the
// formation-wide bonus and made the maths harder for players to predict.

// Calculate position score for 1 or 2 heroes.
// With 2 heroes: primary (higher score) ×1.25, support ×0.75, then role pairing bonus.
// Returns { score, primaryHero, supportHero, pairingMult }
export function calcPositionScore(heroes, pos) {
  const valid = (heroes||[]).filter(Boolean);
  if(valid.length === 0) return { score:0, primaryHero:null, supportHero:null, pairingMult:1.0 };

  const scored = valid.map(h => ({ h, s:calcHeroCombatScore(h, pos) }))
                       .sort((a,b) => b.s - a.s);

  let score, primaryHero, supportHero, pairingMult = 1.0;

  if(scored.length === 1) {
    score = scored[0].s;
    primaryHero = scored[0].h;
    supportHero = null;
  } else {
    primaryHero = scored[0].h;
    supportHero = scored[1].h;
    score = scored[0].s * 1.25 + scored[1].s * 0.75;

    // Role pairing bonus
    const roles = [primaryHero.role, supportHero.role].sort();
    const rolePairing = POSITION_PAIRINGS.find(p =>
      p.pos === pos &&
      [...p.roles].sort().join() === roles.join()
    );
    if(rolePairing) {
      pairingMult = rolePairing.mult;
      score *= pairingMult;
    }
  }

  return { score, primaryHero, supportHero, pairingMult };
}

// ─── COMBAT SCORE ENGINE ─────────────────────────────────────────────────────
// Explicit per-stat weights for combat contribution. Non-combat stats excluded.
// Weights intentionally don't sum to 1 — final score is a weighted sum * 100
// that naturally lands in a 20–90 range for typical heroes.
// Position fit, form, morale, and happiness are applied as multipliers.

// Position-specific stat weights — replaces flat COMBAT_WEIGHTS.
// Each position rewards the stats that actually matter in that lane.
// Stats that don't belong contribute near-zero — a Warrior's Strength
// genuinely matters in Vanguard but is nearly irrelevant in Arbiter.
const POSITION_WEIGHTS = {
  Vanguard: {
    Strength:        0.28,
    Endurance:       0.22,
    Defense:         0.20,
    Determination:   0.08,
    Intimidation:    0.06, // UI lists it as a primary Vanguard stat — now it actually fights
    Composure:       0.04,
    Agility:         0.04,
    Accuracy:        0.02,
    Leadership:      0.02,
    Adaptability:    0.01,
    Tactics:         0.01,
    "Magic Power":   0.01,
    "Magic Resist":  0.01,
  },
  Skirmisher: {
    Agility:         0.28,
    Accuracy:        0.24,
    Adaptability:    0.14,
    Determination:   0.08,
    Composure:       0.06,
    Strength:        0.04,
    Endurance:       0.03,
    Defense:         0.02,
    Leadership:      0.02,
    Tactics:         0.02,
    "Magic Power":   0.01,
    "Magic Resist":  0.00,
  },
  Arbiter: {
    Tactics:         0.24,
    "Magic Power":   0.20,
    "Magic Resist":  0.14,
    Leadership:      0.12,
    Composure:       0.08,
    Adaptability:    0.06,
    Accuracy:        0.04,
    Determination:   0.04,
    Agility:         0.02,
    Endurance:       0.02,
    Defense:         0.01,
    Strength:        0.01,
  },
};

// ─── NAMED INJURIES ──────────────────────────────────────────────────────────
// Injuries carry a name and an origin — "Cracked ribs, from the Coalwatch match".
// On healing there's a small chance of a scar: a permanent stat dent, or —
// rarely — a trait earned by fighting through it.
const INJURY_NAMES_BY_POS = {
  Vanguard:   ["Cracked ribs","Shield-arm fracture","Torn shoulder","Crushed gauntlet hand","Split brow"],
  Skirmisher: ["Twisted ankle","Torn hamstring","Arrow through the calf","Dislocated wrist","Bruised spine"],
  Arbiter:    ["Mana burn","Concussion","Seared palms","Ruptured focus","Backlash tremors"],
};
const INJURY_NAMES_ALL = Object.values(INJURY_NAMES_BY_POS).flat();

// ─── EXCHANGE BEAT TEXT ──────────────────────────────────────────────────────
// One line per exchange in the battle replay. {A} = acting hero's first name.
// Kinds: crit/hit/rally (won exchange) · blocked/falter (lost exchange).
const EXCHANGE_TEXT = {
  Vanguard: {
    crit:   ["{A} splits a shield clean in two","{A} drops their champion with a single blow","{A} breaks the line single-handed"],
    hit:    ["{A} grinds the line back a step","{A} holds the wall and answers hard","{A} trades blows and comes off better"],
    rally:  ["{A} bellows the line back into shape","{A} plants the standard — the wall reforms"],
    blocked:["Their front absorbs the push","{A} is shoved back behind the shields","The wall bends and barely holds"],
    falter: ["{A} hesitates at the worst moment","{A} loses footing in the crush"],
  },
  Skirmisher: {
    crit:   ["{A} finds the seam no one else saw","{A} takes their flag-bearer mid-stride","{A} turns the flank completely"],
    hit:    ["{A} darts in, cuts, and is gone","{A} wins the race to the ridge","{A} picks off a straggler"],
    rally:  ["{A} regroups the runners and goes again","{A} calls the second wave in low"],
    blocked:["Their outriders read the ambush","{A} is cut off and forced back","The flank closes before {A} arrives"],
    falter: ["{A} springs the trap too early","{A} loses the line in the smoke"],
  },
  Arbiter: {
    crit:   ["{A}'s casting cracks the sky open","{A} unmakes their ward with one gesture","{A} seizes command of the whole field"],
    hit:    ["{A} keeps the lines fed and standing","{A} counters spell for spell","{A} reads their play and answers"],
    rally:  ["{A} steadies the rear — orders land again","{A} rewrites the plan mid-battle"],
    blocked:["Their casters match every counter","{A}'s working fizzles against their wards","Command contested — no ground gained"],
    falter: ["{A}'s concentration snaps","{A} misreads the field entirely"],
  },
};

// Called when a hero's injury countdown reaches 0. 15% scar chance:
// ~a third of scars grant Resilient/Iron Will, the rest dent a physical stat.
export function applyHealScar(hero, addLog) {
  const injName = hero.injury?.name || "injury";
  const history = [ ...(hero.injury ? [hero.injury] : []), ...(hero.injuryHistory||[]) ].slice(0,3);
  let out = { ...hero, injury: null, injuryHistory: history };
  if(Math.random() < 0.15) {
    const traits = hero.traits||[];
    const scarTrait = ["Resilient","Iron Will"].find(t=>!traits.includes(t));
    if(scarTrait && traits.length < 3 && Math.random() < 0.35) {
      out = { ...out, traits: [...traits, scarTrait] };
      addLog?.(`${hero.name} returns from the ${injName.toLowerCase()} harder than before — gained ${scarTrait}.`,"success");
    } else {
      const stat = pick(PHYSICAL_STATS);
      const loss = rand(1,2);
      out = { ...out, stats: { ...out.stats, [stat]: Math.max(10, (out.stats[stat]||10) - loss) } };
      addLog?.(`${hero.name}'s ${injName.toLowerCase()} never fully healed — permanent −${loss} ${stat}.`,"warning");
    }
  }
  return out;
}

// Returns a single combat score for one hero in a given position.
export function calcHeroCombatScore(hero, pos) {
  const traits = hero.traits || [];
  const weights = (pos && POSITION_WEIGHTS[pos]) ? POSITION_WEIGHTS[pos] : POSITION_WEIGHTS.Vanguard;

  // Position-weighted stat sum
  let score = 0;
  Object.entries(weights).forEach(([stat, weight]) => {
    let w = weight;
    if(stat === "Accuracy" && traits.includes("Eagle Eye")) w *= 1.5;
    if(stat === "Composure" && traits.includes("Calm"))     w *= 1.5;
    score += (hero.stats[stat] || 0) * w;
  });

  // Ideal role: small +10% bonus for being in your natural position.
  // No penalty for wrong role — the weights already punish it naturally.
  if(pos && POSITIONS[pos]) {
    const pd = POSITIONS[pos];
    const isIdeal = pd.ideal.includes(hero.role);
    if(isIdeal) score *= 1.10;
  }

  // ── TRAIT COMBAT MODIFIERS ──────────────────────────────────────────────
  if(traits.includes("Berserker"))  score *= pos === "Vanguard"    ? 1.06 : 0.97;
  if(traits.includes("Glass Cannon")) score *= 1.07;
  if(traits.includes("Tactician"))  score *= pos === "Arbiter"     ? 1.05 : 1.0;
  if(traits.includes("Swift"))      score *= pos === "Skirmisher"  ? 1.05 : 1.0;
  if(traits.includes("Blessed"))    score *= 1.03;
  if(traits.includes("Cursed"))     score *= 0.95;

  // Form 1–10 → 0.6–1.0 multiplier
  const formMult = 0.6 + ((hero.stats["Form"] || 5) / 10) * 0.4;
  score *= formMult;

  // Morale 0–100 → 0.6–1.0 multiplier
  let morale = Math.min(100, Math.max(0, hero.morale || 70));
  if(traits.includes("Iron Will")) morale = Math.max(morale, 50);
  const moraleMult = 0.6 + (morale / 100) * 0.4;
  score *= moraleMult;

  // Happiness multiplier
  
  // Fatigue multiplier
  score *= fatigueMult(hero.fatigue ?? 0);

  // Stage combat modifier
  const stageCombatMult = {prospect:1.0, rising:1.0, peak:1.05, fading:0.95, veteran:0.90}[hero.stage||"peak"] ?? 1.0;
  score *= stageCombatMult;

  return score;
}

// The lane weight tables above are combat-calibrated and their sums are NOT
// equal (Vanguard 1.00, Skirmisher 0.94, Arbiter 0.98). Raw cross-lane score
// comparisons therefore systematically vote against Skirmisher — probe showed
// ~40% of Rangers/Rogues labelled Vanguard/Arbiter. Normalise by these sums
// whenever comparing a hero's score ACROSS lanes; never use them in combat.
const POSITION_WEIGHT_SUMS = Object.fromEntries(
  Object.entries(POSITION_WEIGHTS).map(([p,w]) => [p, Object.values(w).reduce((a,b)=>a+b,0)])
);

// Best lane for a hero — used by the Squad "Best" label, position pills and
// position filter. The hero's natural (ideal-role) lane wins unless another
// lane's weight-normalised score beats it by >5%: enough to keep generation
// noise from flipping the label, small enough that real signal (a fading
// hero whose physical stats have decayed toward Arbiter territory) shows.
export function bestPositionFor(hero){
  const norm = {};
  POS_KEYS.forEach(p => { norm[p] = calcHeroCombatScore(hero, p) / POSITION_WEIGHT_SUMS[p]; });
  const home = POS_KEYS.find(p => POSITIONS[p].ideal.includes(hero.role)) || POS_KEYS[0];
  let best = home;
  POS_KEYS.forEach(p => { if(norm[p] > norm[best] * 1.05) best = p; });
  return best;
}

// ─── RETRAINING ──────────────────────────────────────────────────────────────
// A hero whose stats favour another lane can change role: 40% of value,
// RETRAIN_WEEKS out of action (reuses the awayWeeks machinery), once per
// season, gated behind the Training Grounds. Stats/level/traits carry as-is —
// the stats are the justification, not the reward. See
// docs/superpowers/specs/2026-07-07-retraining-design.md.
export const RETRAIN_WEEKS = 4;
const RETRAIN_COST_PCT = 0.40;
const RETRAIN_RETURN_MORALE = 8;

export function naturalLaneFor(role){
  return POS_KEYS.find(p => POSITIONS[p].ideal.includes(role)) || POS_KEYS[0];
}

export function retrainCost(hero){
  return Math.max(100, Math.floor((hero.value || 0) * RETRAIN_COST_PCT));
}

// Returns {ok, reason} — reason is player-facing copy for the detail panel.
export function canRetrain(hero, gold, season, buildings){
  if(!buildings?.some(b => b.id === "trainyard" && b.built))
    return { ok:false, reason:"Requires the Training Grounds" };
  if(!hero || hero.retired)            return { ok:false, reason:"Not available" };
  if(hero.injured)                     return { ok:false, reason:"Cannot retrain while injured" };
  if((hero.awayWeeks || 0) > 0)        return { ok:false, reason:"Away from the realm" };
  if((hero.contractWeeksLeft || 0) <= RETRAIN_WEEKS)
    return { ok:false, reason:`Contract too short — needs more than ${RETRAIN_WEEKS} weeks left` };
  if(hero.retrainedSeason === season)  return { ok:false, reason:"Already retrained this season" };
  if(gold < retrainCost(hero))
    return { ok:false, reason:`Costs ${retrainCost(hero).toLocaleString()}g — not enough gold` };
  return { ok:true, reason:null };
}

export function analyseFormation(formation){
  // Race synergy — the only formation-wide multiplier now.
  // Role/race pairings are handled per-position in calcPositionScore.
  const raceSynergy = calcRaceSynergy(formation);
  const mult = raceSynergy ? Math.min(1.5, raceSynergy.ratingMult) : 1.0;
  // Per-lane synergy multipliers — race identities are asymmetric by design
  const laneMults = {};
  POS_KEYS.forEach(p=>{
    laneMults[p] = Math.min(1.5, Math.max(0.3, raceSynergy?.laneMults?.[p] ?? (raceSynergy?Math.min(1.5,raceSynergy.ratingMult):1.0)));
  });

  const heroMods={};
  POS_KEYS.forEach(pos=>{
    const pd=POSITIONS[pos];
    (formation[pos]||[]).forEach(h=>{
      if(!h)return;
      const isIdeal=pd.ideal.includes(h.role);
      heroMods[h.id]={
        fit: isIdeal?"ideal":"neutral",
        statMult: isIdeal?1.10:1.0,
        label: isIdeal?"Natural Fit ✓":"Neutral",
      };
    });
  });
  return {active:[], positive:[], negative:[], mult, laneMults, heroMods, raceSynergy};
}

export function calcFormationRating(formation){
  const analysis=analyseFormation(formation);
  // Sum position scores across all 3 lanes — this puts the rating on the same
  // scale as enemy total power (e.g. Iron 67-105), making comparisons intuitive.
  // calcPositionScore handles primary×1.25 + support×0.75 + role pairing bonuses.
  let raw=0, effective=0;
  POS_KEYS.forEach(pos=>{
    const posHeroes=(formation[pos]||[]).filter(Boolean);
    if(posHeroes.length===0) return;
    const {score}=calcPositionScore(posHeroes, pos);
    raw+=score;
    effective+=score*analysis.laneMults[pos];
  });
  return {raw:Math.round(raw), effective:Math.round(effective), analysis};
}

// ─── WIN CHANCE ENGINE ────────────────────────────────────────────────────────
// Sigmoid ratio: winChance = 1 / (1 + (enemyPower / yourEffective)^k)
// k=2.0 gives a moderately steep curve:
//   Equal (50 vs 50) → 50%    |  2× stronger → ~80%   |  0.5× → ~20%
// Enemy power anchored to match the new hero stat scale.

// ─── TIERED LEAGUE SYSTEM ────────────────────────────────────────────────────
// 5 tiers: Iron → Bronze → Silver → Gold → Platinum
// 8 teams per tier (player + 7 AI). Top 2 promote, bottom 2 relegate each season.
// AI teams regenerated on promotion/relegation. Power randomised each new season.

export const TIERS = {
  // tributeBase values are sim-calibrated (scripts/balance-sim.mjs) together
  // with the loss purse and position bonus — retune there before changing here
  iron:     { id:"iron",     name:"Iron",     icon:"",  color:"#6B665C", powerMin:67,  powerMax:105, difficulty:1, tributeBase:170, xpRange:[20,32] },
  bronze:   { id:"bronze",   name:"Bronze",   icon:"",  color:"#7D5A33", powerMin:93,  powerMax:147, difficulty:2, tributeBase:225, xpRange:[26,40] },
  silver:   { id:"silver",   name:"Silver",   icon:"",  color:"#7D7A70", powerMin:127, powerMax:199, difficulty:3, tributeBase:325, xpRange:[32,48] },
  gold:     { id:"gold",     name:"Gold",     icon:"",  color:"#8A6D3B", powerMin:167, powerMax:262, difficulty:4, tributeBase:465, xpRange:[36,70] },
  platinum: { id:"platinum", name:"Platinum", icon:"",  color:"#5F4B66", powerMin:207, powerMax:325, difficulty:5, tributeBase:625, xpRange:[45,85] },
};
export const TIER_ORDER = ["iron","bronze","silver","gold","platinum"];

// Tribute = tierBase + position bonus (1st gets most, 8th gets base).
// The swing is deliberately modest so TIER dominates POSITION: promotion is the big
// income reward, placement only a nudge. (A wide swing let 1st-in-Iron out-earn
// mid-table Bronze, which read as backwards — a lower division paying more.)
export const TIER_POSITION_BONUS = [80, 58, 42, 28, 16, 6, 0, 0];

// Name pools — 15 per tier, thematically distinct
const TIER_NAME_POOLS = {
  iron: [
    "The Ashen Pit","Mudwall","Greystone Keep","The Rusted Gate","Cinderhold",
    "Ironmere","Dustcliff","The Broken Tower","Ashgate","Slagmoor",
    "The Crumbled Fort","Grimhaven","Thornbarrow","The Iron Hollow","Coalwatch",
  ],
  bronze: [
    "Thornwall","Coppergate","The Rising Hold","Amberveil","Ironwrest",
    "Brasshaven","The Copper Crown","Boldmarch","Emberton","Stonepeak",
    "Redwater","The Bronze Keep","Cragmore","Dustspire","Harrowfield",
  ],
  silver: [
    "Silvermark","Crestholm","The White Bastion","Brightwall","Highwatch",
    "The Silver Lance","Forgehaven","Irongate","Goldenmere","Fairspire",
    "The Silver Hold","Stonecrest","Ashenvale","The Pale Tower","Millhaven",
  ],
  gold: [
    "Goldspire","Valdris","The Iron Throne","Crownhaven","The Golden Hold",
    "Aurelian","The Crowned Keep","Glorymere","The Debt of Kings","Brightcrown",
    "The Gilded Fort","Conquestholm","The Grand Bastion","Valorwall","Kingsreach",
  ],
  platinum: [
    "The Court of Broken Banners","Obsidian Peak","Ninth Reach","The Void Throne","Widow's Crown",
    "The Black Citadel","The Unforgiven See","The Diamond Hold","The Silent Concord","Exalted Keep",
    "The Platinum Crown","The Hall of First Blood","The Last Bastion","The Ashen Accord","The Final Hold",
  ],
};

// ─── RIVAL MANAGERS ──────────────────────────────────────────────────────────
// Every AI town is run by a named manager with an archetype. Archetypes bias
// which specialisation the town brings (learnable pattern), and their taunts
// track the head-to-head record — the league remembers you.
const MANAGER_ARCHETYPES = [
  { id:"butcher",     title:"the Butcher",     preferredSpecs:["siege","phalanx"],
    names:["Gorvek Hale","Bruna Kessel","Ram Ostler","Hadda Cleft"],
    taunts:{ ahead:"Your shieldwall splinters like kindling. It always has.",
             even:"Meat is meat. Line yours up.",
             behind:"Enjoy the wins. Bones remember." } },
  { id:"schemer",     title:"the Schemer",     preferredSpecs:["ambush","guerrilla"],
    names:["Serra Vayne","Fen Whisperlock","Odo the Quiet","Liss Marrow"],
    taunts:{ ahead:"You still haven't found where I hide the knives.",
             even:"I've read your formation. Twice.",
             behind:"A setback. The trap is patient." } },
  { id:"warlock",     title:"the Warlock",     preferredSpecs:["arcane","sorcery"],
    names:["Malachai Dren","Ysolde Nine-Candles","Corvin Ashe","Petra Vell"],
    taunts:{ ahead:"Your arbiters pray. Mine answer.",
             even:"Magic favours the prepared. Are you?",
             behind:"Every defeat teaches me a new rune." } },
  { id:"drillmaster", title:"the Drillmaster", preferredSpecs:["phalanx","siege"],
    names:["Marshal Krieg","Tova Ironlung","Sarn Halberd","Colm Redgrave"],
    taunts:{ ahead:"Discipline beats talent. Again, apparently.",
             even:"My lines don't break. Do yours?",
             behind:"We drill at dawn. You'll hear us." } },
  { id:"gambler",     title:"the Gambler",     preferredSpecs:[],
    names:["Silas Two-Coins","Marla Dice","Finn Weaver","Jack Copperfield"],
    taunts:{ ahead:"The dice love me this year.",
             even:"Coin's in the air. Call it.",
             behind:"Luck turns. Mine always does." } },
  { id:"zealot",      title:"the Zealot",      preferredSpecs:["sorcery","siege"],
    names:["Mother Cinder","Brand Ashvow","Sister Havoc","Aldous Flame"],
    taunts:{ ahead:"The fire finds the faithless first.",
             even:"Conviction is a weapon. Bring yours.",
             behind:"Martyrdom is just a longer game." } },
];

function pickManager(usedNames) {
  // Avoid two towns in the same league sharing a manager
  for (let attempt = 0; attempt < 12; attempt++) {
    const arch = pick(MANAGER_ARCHETYPES);
    const name = pick(arch.names);
    if (!usedNames || !usedNames.has(name)) {
      usedNames?.add(name);
      return { name, archetype: arch.id, title: arch.title };
    }
  }
  const arch = pick(MANAGER_ARCHETYPES);
  return { name: pick(arch.names), archetype: arch.id, title: arch.title };
}

export function managerTaunt(manager, h2h) {
  const arch = MANAGER_ARCHETYPES.find(a=>a.id===manager?.archetype);
  if(!arch) return null;
  const diff = (h2h?.losses||0) - (h2h?.wins||0); // their wins minus ours, from player POV
  return diff > 0 ? arch.taunts.ahead : diff < 0 ? arch.taunts.behind : arch.taunts.even;
}

// Generate 7 AI towns for a given tier with randomised power
export function generateTierTowns(tierId, existingNames=[]) {
  const tier = TIERS[tierId] || TIERS.iron;
  const pool = [...TIER_NAME_POOLS[tierId]].filter(n => !existingNames.includes(n));
  const shuffled = pool.sort(() => Math.random() - 0.5);
  const usedManagerNames = new Set();
  return shuffled.slice(0, 7).map(name => ({
    name,
    tierId,
    power: rand(tier.powerMin, tier.powerMax),
    difficulty: tier.difficulty,
    wins: 0,
    losses: 0,
    abilities: assignTownAbilities(tierId),
    manager: pickManager(usedManagerNames),
    h2h: { wins:0, losses:0 }, // player's record vs this town — persists across seasons
  }));
}

// Randomise power of existing AI towns within their tier range (new season refresh)
function refreshTierTownPowers(towns, tierId) {
  const tier = TIERS[tierId] || TIERS.iron;
  return towns.map(t => ({
    ...t,
    wins: 0,
    losses: 0,
    power: rand(tier.powerMin, tier.powerMax),
  }));
}

// Legacy ENEMY_POWER_TABLE kept for combat system compatibility
const ENEMY_POWER_TABLE = {
  1: 77,   // Iron midpoint
  2: 108,  // Bronze midpoint
  3: 147,  // Silver midpoint
  4: 193,  // Gold midpoint
  5: 240,  // Platinum midpoint
};


function calcWinChance(yourEffectiveRating, enemyDifficulty, enemyPowerOverride) {
  const k = 2.0;
  const enemyPower = enemyPowerOverride ?? ENEMY_POWER_TABLE[enemyDifficulty] ?? 47;
  if(yourEffectiveRating <= 0) return 0.03;
  const ratio = enemyPower / yourEffectiveRating;
  const raw = 1 / (1 + Math.pow(ratio, k));
  return Math.min(0.95, Math.max(0.03, raw));
}

// ─── RACE COMPOSITION BONUSES ────────────────────────────────────────────────
// Separate from role synergies. Applied multiplicatively on top.
// Three types: Mono-race, Full Rainbow, Duo Pact.

export const RACE_SYNERGIES = [
  // ── MONO-RACE: all 6 raiding heroes of same race ───────────────────────────
  {
    id:"mono_elf",    type:"mono",   race:"Elf",
    name:"The Long Watch",   icon:"", color:"#40614F",
    ratingMult:1.11, winBonus:0.05,
    laneMults:{Vanguard:0.94, Skirmisher:1.30, Arbiter:1.10},
    desc:"6 Elves — precision and speed at their peak. Dominant Skirmishers but fragile Vanguard.",
    flavour:"The elves moved as one, silent and devastating.",
    check: h => h.filter(x=>x.race==="Elf").length>=6,
  },
  {
    id:"mono_dwarf",  type:"mono",   race:"Dwarf",
    name:"Deep-Wall Doctrine", icon:"", color:"#8A6D3B",
    ratingMult:1.11, winBonus:0.05,
    laneMults:{Vanguard:1.32, Skirmisher:0.92, Arbiter:1.10},
    desc:"6 Dwarves — unbreakable iron wall. Vanguard is near-impenetrable, Skirmishers suffer.",
    flavour:"The Dwarven phalanx ground forward — nothing stopped it.",
    check: h => h.filter(x=>x.race==="Dwarf").length>=6,
  },
  {
    id:"mono_human",  type:"mono",   race:"Human",
    name:"The Mortal Wager", icon:"", color:"#3C5A78",
    ratingMult:1.11, winBonus:0.04,
    laneMults:{Vanguard:1.11, Skirmisher:1.11, Arbiter:1.11},
    desc:"6 Humans — adaptable and resilient. No soft spots, steady across all positions.",
    flavour:"Human tenacity — they just wouldn't quit.",
    check: h => h.filter(x=>x.race==="Human").length>=6,
  },
  {
    id:"mono_halforc",type:"mono",   race:"Half-Orc",
    name:"The Red Tide",     icon:"", color:"#7E2D26",
    ratingMult:1.11, winBonus:0.06,
    laneMults:{Vanguard:1.35, Skirmisher:1.12, Arbiter:0.90},
    desc:"6 Half-Orcs — terrifying raw aggression. Shatters frontlines but has no subtlety.",
    flavour:"The Half-Orc charge shook the earth.",
    check: h => h.filter(x=>x.race==="Half-Orc").length>=6,
  },
  {
    id:"mono_tiefling",type:"mono",  race:"Tiefling",
    name:"Infernal Pact",    icon:"", color:"#5F4B66",
    ratingMult:1.11, winBonus:0.05,
    laneMults:{Vanguard:0.92, Skirmisher:1.08, Arbiter:1.32},
    desc:"6 Tieflings — dark power and guile. Arbiters are supercharged, physical roles thin.",
    flavour:"Infernal energy surged through the Tiefling ranks.",
    check: h => h.filter(x=>x.race==="Tiefling").length>=6,
  },
  {
    id:"mono_gnome",  type:"mono",   race:"Gnome",
    name:"Cog-Court Logic",  icon:"", color:"#3E6B74",
    ratingMult:1.11, winBonus:0.04,
    laneMults:{Vanguard:0.85, Skirmisher:1.05, Arbiter:1.35},
    desc:"6 Gnomes — brilliant command and magic. Vanguard is paper-thin.",
    flavour:"Gnomish tactics outsmarted every counter.",
    check: h => h.filter(x=>x.race==="Gnome").length>=6,
  },
  {
    id:"mono_dragonborn",type:"mono",race:"Dragonborn",
    name:"The Old Fire",     icon:"", color:"#fb923c",
    ratingMult:1.11, winBonus:0.06,
    laneMults:{Vanguard:1.20, Skirmisher:1.12, Arbiter:1.05},
    desc:"6 Dragonborn — overwhelming presence and raw power across the board.",
    flavour:"Draconic fire swept the field.",
    check: h => h.filter(x=>x.race==="Dragonborn").length>=6,
  },

  // ── FULL RAINBOW: all 6 raiding heroes of different races ──────────────────
  {
    id:"rainbow",     type:"rainbow",
    name:"Band of Nations",  icon:"", color:"#23201A",
    ratingMult:1.08, winBonus:0.04,
    laneMults:{Vanguard:1.08, Skirmisher:1.08, Arbiter:1.08},
    desc:"All 6 heroes from different races — diverse strengths cover every weakness.",
    flavour:"United by purpose, not by blood — every weakness covered.",
    check: h => {
      if(h.length < 6) return false;
      const races = h.map(x=>x.race);
      return new Set(races).size === races.length; // all 6 different
    },
  },

  // ── DUO PACTS: 3+ of two specific races ────────────────────────────────────
  {
    id:"pact_elf_tiefling",  type:"duo",
    name:"Shadow Pact",      icon:"", color:"#5F4B66",
    ratingMult:1.05, winBonus:0.03,
    laneMults:{Vanguard:0.95, Skirmisher:1.15, Arbiter:1.12},
    desc:"3+ Elves & 3+ Tieflings — dark and swift. Skirmishers and Arbiters reach peak form.",
    flavour:"Shadow and moonlight — an eerie, deadly combination.",
    check: h => h.filter(x=>x.race==="Elf").length>=3 && h.filter(x=>x.race==="Tiefling").length>=3,
  },
  {
    id:"pact_dwarf_halforc", type:"duo",
    name:"Iron Warbond",     icon:"", color:"#8A6D3B",
    ratingMult:1.05, winBonus:0.03,
    laneMults:{Vanguard:1.22, Skirmisher:0.98, Arbiter:0.95},
    desc:"3+ Dwarves & 3+ Half-Orcs — unstoppable Vanguard. The two toughest frontline races.",
    flavour:"Nothing breaches a wall of iron and fury.",
    check: h => h.filter(x=>x.race==="Dwarf").length>=3 && h.filter(x=>x.race==="Half-Orc").length>=3,
  },
  {
    id:"pact_gnome_tiefling",type:"duo",
    name:"Arcane Covenant",  icon:"", color:"#5F4B66",
    ratingMult:1.05, winBonus:0.03,
    laneMults:{Vanguard:0.92, Skirmisher:1.00, Arbiter:1.25},
    desc:"3+ Gnomes & 3+ Tieflings — devastating magical command. Arbiter rating skyrockets.",
    flavour:"Arcane intellect fused with infernal power.",
    check: h => h.filter(x=>x.race==="Gnome").length>=3 && h.filter(x=>x.race==="Tiefling").length>=3,
  },
  {
    id:"pact_human_elf",     type:"duo",
    name:"Elder Alliance",   icon:"", color:"#40614F",
    ratingMult:1.05, winBonus:0.02,
    laneMults:{Vanguard:1.05, Skirmisher:1.08, Arbiter:1.03},
    desc:"3+ Humans & 3+ Elves — balanced and reliable. No weaknesses, strong across all positions.",
    flavour:"The oldest alliance — still unbroken.",
    check: h => h.filter(x=>x.race==="Human").length>=3 && h.filter(x=>x.race==="Elf").length>=3,
  },
  {
    id:"pact_dragonborn_halforc",type:"duo",
    name:"Warbeast Pact",    icon:"", color:"#fb923c",
    ratingMult:1.05, winBonus:0.03,
    laneMults:{Vanguard:1.18, Skirmisher:1.08, Arbiter:0.90},
    desc:"3+ Dragonborn & 3+ Half-Orcs — terrifying physical dominance front-to-back.",
    flavour:"Scale and muscle — a wall of living violence.",
    check: h => h.filter(x=>x.race==="Dragonborn").length>=3 && h.filter(x=>x.race==="Half-Orc").length>=3,
  },
  {
    id:"pact_human_dwarf",   type:"duo",
    name:"Order's Vow",      icon:"", color:"#3C5A78",
    ratingMult:1.05, winBonus:0.02,
    laneMults:{Vanguard:1.15, Skirmisher:1.00, Arbiter:1.02},
    desc:"3+ Humans & 3+ Dwarves — disciplined and dependable. Excellent Vanguard and morale.",
    flavour:"Law and stone — a foundation nothing shakes.",
    check: h => h.filter(x=>x.race==="Human").length>=3 && h.filter(x=>x.race==="Dwarf").length>=3,
  },
];

// Only one race synergy can be active at a time — pick the strongest if multiple match.
// (e.g. can't have both Mono-Elf and Band of Nations)
export function calcRaceSynergy(formation) {
  const allHeroes = POS_KEYS.flatMap(p=>(formation[p]||[]).filter(Boolean));
  if(allHeroes.length < 3) return null;

  const matches = RACE_SYNERGIES.filter(s=>s.check(allHeroes));
  if(!matches.length) return null;

  // If rainbow qualifies, also check if a mono beats it — pick highest winBonus
  return matches.reduce((best,s)=>s.winBonus>best.winBonus?s:best, matches[0]);
}

export const BUILDINGS = [
  // ── IRON ─────────────────────────────────────────────────────────────────────
  { id:"barracks",  name:"Barracks",         icon:"", cost:1800, tierRequired:"iron",     desc:"The drillmaster does not believe in rest. Heroes gain +20% XP from battles." },
  { id:"tavern",    name:"Tavern",            icon:"", cost:1400, tierRequired:"iron",     desc:"Bad ale, good company. All heroes +3 morale each week." },
  // ── BRONZE ───────────────────────────────────────────────────────────────────
  { id:"infirmary", name:"Infirmary",         icon:"",  cost:4000, tierRequired:"bronze",   desc:"Clean bandages, fewer prayers. Heroes suffer 30% fewer injuries, and injuries heal 1 week faster." },
  { id:"lodge",     name:"Recovery Lodge",    icon:"", cost:3500, tierRequired:"bronze",   desc:"Hot springs and enforced quiet. Bench heroes recover fatigue 60% faster." },
  // ── SILVER ───────────────────────────────────────────────────────────────────
  { id:"trainyard", name:"Training Grounds",  icon:"", cost:6000, tierRequired:"silver",   desc:"Nobody watches from the fence here. Bench heroes earn 20% of that week's battle XP, and heroes can retrain to a new class." },
  { id:"network",   name:"Talent Network",    icon:"", cost:7000, tierRequired:"silver",   desc:"Ears in every tavern in the realm. Market refreshes every 3 weeks instead of every 6." },
  { id:"trading",   name:"Trading Post",      icon:"", cost:8000, tierRequired:"silver",   desc:"Your merchants know what a hero is worth — and add a margin. Heroes open to offers sell at 120% value and attract bids 50% more often." },
  // ── GOLD ─────────────────────────────────────────────────────────────────────
  { id:"bazaar",    name:"Grand Bazaar",      icon:"", cost:14000, tierRequired:"gold",     desc:"Where ambition comes to be bought. Unlocks premium heroes in the market." },
  { id:"scouts",    name:"Observatory",     icon:"", cost:18000, tierRequired:"gold",     desc:"The stars talk, if you pay attention. Reveals potential bucket (Low/Med/High/Elite) for all heroes in the market before signing." },
  // ── PLATINUM ─────────────────────────────────────────────────────────────────
  { id:"sanctum",   name:"Elite Sanctum",     icon:"", cost:22000, tierRequired:"platinum", desc:"Legends don't answer letters. They answer this. Unlocks elite heroes in the market." },
  { id:"legends",   name:"Hall of Legends",   icon:"", cost:18000, tierRequired:"platinum", desc:"The old guard never really leaves. Each retired hero adds weekly morale to your squad, scaled by their level. Cap: +20/week." },
];

// Per-tier build slots — you may construct only this many buildings per tier,
// which forces an either/or. Grandfathered saves may already exceed these; the
// cap only prevents building MORE (see buildingCapReached), never demolishes.
export const TIER_BUILD_SLOTS = { iron: 1, bronze: 1, silver: 2, gold: 1, platinum: 1 };

export function builtInTier(buildings, tier) {
  return (buildings || []).filter(b => b.tierRequired === tier && b.built).length;
}
export function buildingCapReached(buildings, tier) {
  return builtInTier(buildings, tier) >= (TIER_BUILD_SLOTS[tier] ?? 99);
}

// Buildings persist in saves as full objects, so static fields (desc, cost,
// tierRequired…) would otherwise freeze at save time. Rebuild from the current
// BUILDINGS definitions, carrying over only each building's `built` flag.
export function migrateBuildings(savedBuildings) {
  const builtById = new Map((savedBuildings || []).map(b => [b.id, !!b.built]));
  return BUILDINGS.map(def => ({ ...def, built: builtById.get(def.id) ?? false }));
}

const TRAITS = ["Berserker","Tactician","Swift","Resilient","Cursed","Blessed","Coward","Brave","Greedy","Loyal","Hot-headed","Calm","Inspiring","Stubborn","Night Vision","Eagle Eye","Iron Will","Glass Cannon"];

const TRAIT_EFFECTS = {
  "Berserker":    {color:"#7E2D26", desc:"+6% power in Vanguard · +50% injury risk on defeat · bonus XP on wins"},
  "Tactician":    {color:"#3C5A78", desc:"+5% power in Arbiter position"},
  "Swift":        {color:"#40614F", desc:"+5% power in Skirmisher · −25% fatigue gain"},
  "Resilient":    {color:"#40614F", desc:"−30% fatigue gain · −50% injury risk"},
  "Glass Cannon": {color:"#9A5B2B", desc:"+7% power in all positions · 2× injury risk"},
  "Blessed":      {color:"#8A6D3B", desc:"+3% power"},
  "Cursed":       {color:"#5F4B66", desc:"−5% power · random form drain each week · +15% XP (suffering teaches)"},
  "Brave":        {color:"#40614F", desc:"Immune to morale loss on defeat"},
  "Iron Will":    {color:"#3C5A78", desc:"Morale floor at 50 during combat"},
  "Eagle Eye":    {color:"#8A6D3B", desc:"Accuracy weighted ×1.5 in combat score"},
  "Calm":         {color:"#3C5A78", desc:"Composure weighted ×1.5 in combat score"},
  "Night Vision": {color:"#5F4B66", desc:"+4% win chance when your team is the underdog"},
  "Loyal":        {color:"#40614F", desc:"−12% contract demands · patient and generous at the negotiating table"},
  "Greedy":       {color:"#9A5B2B", desc:"+20% contract salary demand"},
  "Hot-headed":   {color:"#7E2D26", desc:"Quick to take offence in contract talks · storms out on the spot if talks collapse"},
  "Stubborn":     {color:"#8A6D3B", desc:"+10% contract demand · won't accept counter-offers"},
  "Coward":       {color:"#6E6350",    desc:"Morale swings halved (good and bad)"},
  "Inspiring":    {color:"#8A6D3B", desc:"+10% morale swings for squad · bigger morale boost on retirement"},
};
const FIRST_NAMES = [
  "Aldric","Sylas","Mira","Thorin","Zara","Fenix","Lyra","Brom","Elowen","Kazim",
  "Vex","Nyla","Dorn","Seraphel","Grix","Isolde","Tavar","Rynn","Caelum","Vesper",
  "Oryn","Sable","Cress","Baelin","Wren","Ash","Cade","Dusk","Edda","Frey",
  "Gareth","Hale","Iris","Joss","Kael","Lorn","Maren","Nox","Orin","Petra",
  "Quinn","Rhett","Soren","Tess","Uvar","Vale","Wynn","Xan","Yael","Zell",
  "Adra","Bael","Cira","Drax","Evyn","Fyra","Gael","Holt","Iren","Jace",
  "Kira","Lund","Mael","Nell","Osric","Pryn","Raen","Skye","Tove","Ulric",
];
// ~10% of heroes carry an epithet earned somewhere off-page — a hint of a life
// before your realm. Purely cosmetic, entirely load-bearing for the fiction.
const EPITHETS = [
  "the Widow","Two-Coins","the Unbent","Half-Hanged","the Quiet","Marrow",
  "Oath-Breaker","the Lamplighter","Never-Bled","the Debt","Six-Fingers",
  "the Stray","Kettle","the Pilgrim","Last-Out-the-Gate","the Bell",
];
const LAST_NAMES = [
  "Ironforge","Dawnwhisper","Ashveil","Stoneback","Emberthorn","Coldwater",
  "Grimshaw","Silverwood","Blackthorn","Nighthollow","Voidmantle","Crestfall",
  "Duskbane","Emberveil","Stormcrow","Ashmark","Boldfield","Crownhelm",
  "Darkwater","Edgeborn","Farreach","Greymantle","Highwall","Ironveil",
  "Jadewing","Kettleborn","Lightfall","Moorwatch","Northguard","Oldstone",
  "Peakhollow","Quickblade","Ravenmark","Saltfire","Thornwall","Underhill",
  "Vaulthall","Wildmoor","Yearwood","Zephyrcroft",
];

// Pairs that should never appear on the same hero
const TRAIT_CONFLICTS = [
  ["Greedy","Loyal"],       // opposite contract disposition
  ["Brave","Coward"],       // opposite morale response
  ["Berserker","Calm"],     // aggression vs composure
  ["Glass Cannon","Resilient"], // opposite injury profile
  ["Hot-headed","Iron Will"],   // walkout behaviour contradicts
  ["Blessed","Cursed"],     // direct opposites
  ["Loyal","Stubborn"],     // both contract traits, contradictory disposition
  ["Loyal","Hot-headed"],   // calm vs volatile
  ["Iron Will","Hot-headed"], // redundant with existing but explicit
];

function pickTraits(n) {
  const pool = [...TRAITS];
  const chosen = [];
  let attempts = 0;
  while(chosen.length < n && pool.length > 0 && attempts < 50) {
    attempts++;
    const idx = Math.floor(Math.random() * pool.length);
    const candidate = pool[idx];
    pool.splice(idx, 1);
    // Check for conflicts with already-chosen traits
    const hasConflict = chosen.some(t =>
      TRAIT_CONFLICTS.some(pair =>
        (pair[0]===t && pair[1]===candidate) || (pair[1]===t && pair[0]===candidate)
      )
    );
    if(!hasConflict) chosen.push(candidate);
  }
  return chosen;
}

// ─── UTILS ────────────────────────────────────────────────────────────────────

function rand(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function pickN(arr,n){ const s=[...arr];const o=[];for(let i=0;i<n;i++){const x=Math.floor(Math.random()*s.length);o.push(s.splice(x,1)[0]);}return o; }
export function xpForLevel(l){ return XP_PER_LEVEL[Math.min(l,MAX_LEVEL)] ?? XP_PER_LEVEL[MAX_LEVEL]; }
export function levelFromXp(xp){ let l=0; for(let i=1;i<=MAX_LEVEL;i++){ if(xp>=XP_PER_LEVEL[i]) l=i; else break; } return l; }

// Bell-curve potential using Box-Muller transform.
// Mean ~50, SD ~15. Most heroes land 35-65.
// Reaching 85+ is genuinely rare (~5%). 95+ is lucky (<1%).
// Below 20 is equally rare — truly unlucky finds.
// premium=true shifts mean to ~72 with tighter spread (market/bazaar heroes).
// elite=true shifts mean to ~85 — only unlocked at Sovereign renown (10000+).
// Potential ranges gated by tier — higher-tier heroes won't sign for lower clubs.
// Standard market floor rises each tier. Elite/premium shift up proportionally.
// Heroes above the tier ceiling simply don't appear in the market.
const TIER_POT_RANGES = {
  iron:     { standard:[30,48], premium:[42,58], elite:null },
  bronze:   { standard:[38,56], premium:[50,66], elite:null },
  silver:   { standard:[48,68], premium:[60,76], elite:[68,80] },
  gold:     { standard:[62,82], premium:[72,88], elite:[80,92] },
  platinum: { standard:[78,95], premium:[86,99], elite:[92,99] },
};

function rollPotential(premium=false, elite=false, tierId="iron"){
  const ranges = TIER_POT_RANGES[tierId] || TIER_POT_RANGES.iron;
  const range = elite && ranges.elite
    ? ranges.elite
    : premium
    ? ranges.premium
    : ranges.standard;
  // Uniform roll within the tier-gated range
  return rand(range[0], range[1]);
}

// Contract weeks per year
const DEFAULT_TOWN_COLOR = "#8A6D3B";
// Saves from the dark-theme era carry neon town colors that vanish on
// parchment — map each legacy hex to its ink successor on load.
const LEGACY_TOWN_COLORS = {
  "#ffd966":"#8A6D3B", "#a8ff78":"#40614F", "#78c8ff":"#3C5A78", "#ff7878":"#7E2D26",
  "#c084fc":"#5F4B66", "#ff9f43":"#9A5B2B", "#c0c0c0":"#7D7A70", "#ff6eb4":"#8F4A63",
};
const migrateTownColor = (c) => LEGACY_TOWN_COLORS[(c||"").toLowerCase()] || c || DEFAULT_TOWN_COLOR;
const DEFAULT_TOWN_NAME  = "Your Realm";
const TOWN_COLORS = [
  { label:"Gold",    value:"#8A6D3B" },
  { label:"Emerald", value:"#40614F" },
  { label:"Sapphire",value:"#3C5A78" },
  { label:"Crimson", value:"#7E2D26" },
  { label:"Violet",  value:"#5F4B66" },
  { label:"Amber",   value:"#9A5B2B" },
  { label:"Silver",  value:"#7D7A70" },
  { label:"Rose",    value:"#8F4A63" },
];

// Enemy specialisations — apply a power penalty if the formation doesn't counter them
const SPECIALISATIONS = [
  { id:"guerrilla",  label:"Guerrilla Tactics",  counter:"Skirmisher", penalty:0.12, injuryBonus:0.08, reason:"Formation lacks Skirmisher depth to counter fast flankers" },
  { id:"siege",      label:"Siege Formation",    counter:"Vanguard",   penalty:0.10, injuryBonus:0.00, reason:"Heavy front line overwhelms a weak Vanguard" },
  { id:"arcane",     label:"Arcane Assault",     counter:"Arbiter",    penalty:0.14, injuryBonus:0.00, reason:"Magical barrage without Arbiter-level counterspell" },
  { id:"ambush",     label:"Ambush Predators",   counter:"Skirmisher", penalty:0.10, injuryBonus:0.12, reason:"Ambush tactics inflict extra injuries without agile counters" },
  { id:"phalanx",    label:"Phalanx",            counter:"Vanguard",   penalty:0.08, injuryBonus:0.00, reason:"Shield wall breaks an unprepared Vanguard" },
  { id:"sorcery",    label:"War Sorcery",        counter:"Arbiter",    penalty:0.16, injuryBonus:0.00, reason:"Sorcery unchecked by Arbiter power is devastating" },
];

// Returns penalty object if formation doesn't counter the specialisation, else null
// Countering takes strength, not mere presence: the counter lane must pull its
// weight (≥80% of the formation's average lane score) or the spec punishes it.
export function calcSpecPenalty(spec, formation) {
  if(!spec) return null;
  const laneScore = (pos)=>calcPositionScore((formation[pos]||[]).filter(Boolean), pos).score;
  const counterScore = laneScore(spec.counter);
  const avgScore = POS_KEYS.reduce((a,p)=>a+laneScore(p),0)/POS_KEYS.length;
  if(avgScore > 0 && counterScore >= avgScore * 0.8) return null;
  return { penalty: spec.penalty, reason: spec.reason, injuryBonus: spec.injuryBonus || 0 };
}

// Derives current table position from the league table (object keyed by town name)
export function calcTierPosition(wins, winRate, leagueTable, tierEnemyTowns) {
  if(!leagueTable || typeof leagueTable !== 'object') return 4;
  const entries = Object.entries(leagueTable);
  if(entries.length === 0) return 4;
  // Sort all entries by wins descending, player is the one marked isPlayer
  const sorted = entries
    .map(([name, data]) => ({name, ...data}))
    .sort((a,b) => b.wins - a.wins);
  const playerIdx = sorted.findIndex(t => t.isPlayer);
  // If player not in table yet, estimate from wins count
  if(playerIdx < 0) {
    const ahead = sorted.filter(t => t.wins > wins).length;
    return Math.min(8, ahead + 1);
  }
  return playerIdx + 1;
}

// Weekly tribute income — tier base + a modest league-position bonus (1st earns most)
export function weeklyRankIncome(tierId, position) {
  const tier = TIERS[tierId] || TIERS.iron;
  return tier.tributeBase + (TIER_POSITION_BONUS[Math.max(0, (position||8)-1)] || 0);
}

// ─── HERO STAT GROWTH ────────────────────────────────────────────────────────
// Called on level-up. Grows each non-hidden stat toward potential.
// Barracks building gives a small bonus to growth rolls.
export function growHeroStats(hero, newLevel, buildings) {
  const hasBarracks = buildings?.find(b=>b.id==="barracks"&&b.built);
  const potential = hero.stats.Potential || 50;
  const levelsGained = newLevel - (hero.level || 0);
  const newStats = {...hero.stats};
  PHYSICAL_STATS.concat(["Magic Resist"]).concat(MENTAL_STATS).concat(["Charisma","Negotiation","Intimidation","Reputation"]).forEach(s => {
    if(s === "Potential" || s === "Form" || s === "Reputation") return;
    const current = newStats[s] || 10;
    if(current >= potential) return; // already at cap
    // Growth scales with the remaining gap to Potential so high-potential heroes
    // can actually reach it (flat 1-3/level left ~30pt gaps pre-audit), and the
    // final level closes whatever remains — Potential is a promise, kept at 15.
    const levelsLeft = Math.max(1, MAX_LEVEL - newLevel + 1);
    const gapPerLevel = Math.ceil((potential - current) / levelsLeft);
    const maxGain = Math.max(hasBarracks ? 4 : 3, gapPerLevel);
    const gain = newLevel >= MAX_LEVEL ? (potential - current) : levelsGained * rand(1, maxGain);
    newStats[s] = Math.min(potential, current + gain);
  });
  return newStats;
}

// ─── LEAGUE SIMULATION ───────────────────────────────────────────────────────
// Simulates AI-vs-AI results for the week. The town that played the player this
// week is excluded (their outcome came from the player's battle). Remaining towns
// are paired up into head-to-head matches so total wins always equals total losses.
// Win probability is weighted by power (stronger usually wins, upsets still happen).
function simulateEnemyWeek(week, playerOpponentName, leagueTable, tierEnemyTowns) {
  if(!tierEnemyTowns || !leagueTable) return { updated: leagueTable || {}, results: [] };
  const updated = {...leagueTable};
  const results = [];

  const available = tierEnemyTowns.filter(t => t.name !== playerOpponentName);
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  const pairCount = Math.floor(shuffled.length / 2);

  for(let i = 0; i < pairCount; i++) {
    const home = shuffled[i * 2];
    const away = shuffled[i * 2 + 1];
    if(!updated[home.name]) updated[home.name] = {wins:0, losses:0, power:home.power};
    if(!updated[away.name]) updated[away.name] = {wins:0, losses:0, power:away.power};

    // Power-weighted win chance, compressed into 30-70% so upsets stay possible
    const ph = home.power || 100, pa = away.power || 100;
    const homeShare = ph / (ph + pa);
    const homeWinChance = 0.30 + homeShare * 0.40;
    const homeWon = Math.random() < homeWinChance;

    updated[home.name] = {
      ...updated[home.name],
      wins:   updated[home.name].wins   + (homeWon ? 1 : 0),
      losses: updated[home.name].losses + (homeWon ? 0 : 1),
    };
    updated[away.name] = {
      ...updated[away.name],
      wins:   updated[away.name].wins   + (homeWon ? 0 : 1),
      losses: updated[away.name].losses + (homeWon ? 1 : 0),
    };
    results.push({ home: home.name, away: away.name, homeWon });
  }

  return { updated, results };
}

// ─── SCHEDULED OPPONENT ──────────────────────────────────────────────────────
// Picks the next AI opponent from the league table for the scheduled match
export function generateScheduledOpponent(weekNum, leagueTable, tierEnemyTowns, tierId, excludeName = null) {
  if(!tierEnemyTowns || tierEnemyTowns.length === 0) return null;
  // Never schedule the town we just fought — with only ~7 rivals a uniform
  // pick repeats back-to-back every few weeks, which reads as a broken
  // schedule. (Guard on length so a 1-town list can still produce a match.)
  const pool = excludeName && tierEnemyTowns.length > 1
    ? tierEnemyTowns.filter(t => t.name !== excludeName)
    : tierEnemyTowns;
  const idx = Math.floor(Math.random() * pool.length);
  const town = pool[idx];
  const tier = TIERS[tierId] || TIERS.iron;
  // Gold reward mirrors buildRaidSimulation formula: rand(300,700) + difficulty*100
  const goldReward = rand(300,700) + tier.difficulty * 100;
  // Managers have a signature: 60% of the time their spec comes from their
  // archetype's preferred list — a pattern the player can learn and pre-counter
  let specialisation = null;
  if(Math.random() < 0.35){
    const arch = MANAGER_ARCHETYPES.find(a=>a.id===town.manager?.archetype);
    const preferred = arch?.preferredSpecs?.length
      ? SPECIALISATIONS.filter(s=>arch.preferredSpecs.includes(s.id)) : [];
    specialisation = (preferred.length && Math.random() < 0.6) ? pick(preferred) : pick(SPECIALISATIONS);
  }
  const power = town.power || rand(tier.powerMin, tier.powerMax);
  return {
    name:           town.name,
    power,
    // What the rumor mill knows before you scout: a band around the truth,
    // rolled once at generation so it doesn't wobble between renders
    powerBand:      [Math.max(10, power - rand(8, 18)), power + rand(8, 18)],
    scouted:        false,
    difficulty:     tier.difficulty,
    tierId,
    treasury:       rand(3000, 10000),
    specialisation,
    abilities:      town.abilities || [],
    manager:        town.manager || null,
    h2h:            town.h2h || { wins:0, losses:0 },
    goldReward,
  };
}

const WEEKS_PER_CONTRACT_YEAR = 42; // 1 contract season = 1 game season
const ROSTER_CAP = 12; // max heroes on squad at any time

// ─── RIVAL ROSTERS ───────────────────────────────────────────────────────────
// Every rival town keeps six notables — two per lane — generated when first
// scouted and calibrated so their three lanes sum to roughly the town's power.
// Rosters last one season (scouting is seasonal work) and each town will part
// with at most one hero per season.
export function generateRivalRoster(town, tierId) {
  const laneRoles = [["Warrior","Paladin"],["Ranger","Rogue"],["Mage","Cleric"]];
  const roster = laneRoles.flatMap((pair, li) =>
    pair.map((role, ri) => generateHero(
      Date.now() + li*100 + ri*10 + rand(0, 9) + rand(0, 999999),
      false, Math.random() < 0.30, false, role, null, tierId
    ))
  );
  // Calibrate combat weight to the town's power so a scouted squad IS the
  // power number you've been fighting, not a random second dice roll
  const formation = { Vanguard:[roster[0],roster[1]], Skirmisher:[roster[2],roster[3]], Arbiter:[roster[4],roster[5]] };
  const total = POS_KEYS.reduce((a, p) => a + calcPositionScore(formation[p], p).score, 0);
  const f = Math.min(1.6, Math.max(0.6, (town.power || 100) / Math.max(1, total)));
  return roster.map(h => {
    const stats = { ...h.stats };
    ALL_STATS.forEach(s => {
      if (s === "Potential" || s === "Form") return;
      stats[s] = Math.max(10, Math.min(99, Math.round((stats[s] || 10) * f)));
    });
    stats.Potential = Math.min(99, Math.max(stats.Potential || 50,
      ...PHYSICAL_STATS.map(s => stats[s] || 10)));
    const scaled = { ...h, stats, baseStats: { ...stats } };
    scaled.value = calcHeroValue(scaled);
    scaled.salary = Math.floor(scaled.salary * f);
    return scaled;
  });
}

// What a rival demands for one of their own: value plus a premium set by the
// manager's temperament, sweetened further if you've been beating them (nobody
// sells cheap to their tormentor), and a heavy talisman surcharge.
export function rivalAskingPrice(town, hero, isTalisman = false) {
  const base = Math.max(hero.value || 0, calcHeroValue(hero));
  const ARCH_MULT = { gambler: 1.15, butcher: 1.35, drillmaster: 1.35, warlock: 1.40, zealot: 1.45, schemer: 1.50 };
  let mult = ARCH_MULT[town.manager?.archetype] ?? 1.30;
  const grudge = Math.max(0, (town.h2h?.wins || 0) - (town.h2h?.losses || 0));
  mult += Math.min(0.20, grudge * 0.05);
  if (isTalisman) mult += 0.50;
  return Math.max(100, Math.round(base * mult / 10) * 10);
}

export function generateHero(id,forSale=false,premium=false,elite=false,forcedRole=null,forcedRace=null,tierId="iron"){
  const RACES = ["Human","Elf","Dwarf","Half-Orc","Gnome","Tiefling","Dragonborn"];
  const race=forcedRace||pick(RACES), role=forcedRole||pick(ROLES);
  const potential=rollPotential(premium,elite,tierId);

  // Determine stage/progress from market tier window
  const mktTier = elite?"elite":premium?"premium":"standard";
  const win = MARKET_STAGE_WINDOWS[mktTier];
  const careerWk = randomCareerWeekInWindow(win.stage, win.minPct, win.maxStage, win.maxPct);
  const { stage, stageProgress } = careerWeekToStage(careerWk);

  // Level first — stage sets the range, market tier boosts it
  const STAGE_LEVEL_RANGES = {
    prospect:[0,2], rising:[2,6], peak:[6,10], fading:[8,12], veteran:[10,14],
  };
  const [lvMin,lvMax] = STAGE_LEVEL_RANGES[stage]||[0,2];
  const tierLvBonus = elite?rand(2,3):premium?rand(1,2):0;
  const heroLevel = Math.min(MAX_LEVEL, rand(lvMin,lvMax)+tierLvBonus);
  const heroXP = xpForLevel(heroLevel);

  // Stats scale with both stage AND level — mirrors growHeroStats (2-3 per level toward potential)
  const stats={};
  ALL_STATS.forEach(s=>{
    if(s==="Potential"){stats[s]=potential;return;}
    if(["Form"].includes(s))return;
    const potCap=Math.max(10,potential);
    // Level-0 baseline: 25-40% of potential (a raw prospect)
    const lo=Math.max(10,Math.floor(potential*0.25));
    const hi=Math.max(lo,Math.floor(potential*0.40));
    let base=rand(lo,hi);
    // Per-level growth — same curve the hero would follow on organic level-ups
    base += heroLevel * rand(2, 3);
    // Late-career decay on top of earned stats
    if(stage==="fading") base=base-rand(2,6);
    if(stage==="veteran")base=base-rand(5,12);
    stats[s]=Math.max(10,Math.min(potCap,base));
  });
  stats.Form=rand(5,9);
  const traits=pickTraits(rand(1,3));
  const avgStat=Object.values(stats).reduce((a,b)=>a+b,0)/ALL_STATS.length;
  // Salary: base wage plus experience premium — a level 10 hero costs noticeably more than a level 0
  const salary=Math.floor(avgStat*rand(13,16)/10 + heroLevel*rand(6,10));
  const potBonus=Math.max(0,stats.Potential-50)*5;
  // Value: matches calcHeroValue's level multiplier + fee scale so recomputed value after level-up doesn't jump
  const baseValue=Math.floor((avgStat * 7 * (1 + heroLevel * 0.32) + potBonus*0.3) * TRANSFER_FEE_SCALE + rand(-30,30));
  const valueMult = elite ? rand(22,28)/10 : premium ? rand(15,20)/10 : forSale ? rand(10,12)/10 : 1;
  // Contract length appropriate to career stage — veterans don't sign 4-year deals
  const STAGE_CONTRACT_MAX = {prospect:3, rising:4, peak:4, fading:2, veteran:1};
  const maxYears = STAGE_CONTRACT_MAX[stage] || 3;
  const contractYears = rand(1, maxYears);
  const contractWeeks = contractYears * WEEKS_PER_CONTRACT_YEAR;

  // Standard Prospect level 0s are free — unproven and pre-career
  const isFreeProsepct = !elite && !premium && stage === "prospect" && heroLevel === 0;
  const value = isFreeProsepct ? 0 : Math.max(100,Math.floor(baseValue*valueMult));

  return {
    id, name:Math.random()<0.10?`${pick(FIRST_NAMES)} '${pick(EPITHETS)}' ${pick(LAST_NAMES)}`:`${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`, race, role,
    stage, stageProgress,
    stats, traits, salary, value, morale:rand(70,95),
        contractYears, contractWeeks, contractWeeksLeft:contractWeeks,
    xp:heroXP, level:heroLevel, injured:false, injuryWeeks:0, retired:false,
    fatigue:0, weeksUnplayed:0, weeksInSquad:0, weeksInFormation:0,
    potentialRevealed:false,
    negotiationPending:false, negotiationIgnoredWeeks:0,
    marketTier: mktTier,
    mentorBonus: null,
    baseStats: {...stats}, // snapshot at creation for growth tracking
  };
}

function generateEnemy(name,difficulty){
  const base=ENEMY_POWER_TABLE[difficulty]||30;
  return {name,power:Math.round(base+rand(-4,4)),treasury:rand(5000,20000),difficulty};
}
// ENEMY_TOWNS removed — replaced by tierEnemyTowns state (generated per tier)


// ─── LEGENDARY CHALLENGERS (difficulty 6 — opt-in only) ─────────────────────
// These never appear in normal schedule. Only arrive via the Emissary event
// when the player has reached Overlord renown. Each has a unique identity.
const LEGENDARY_CHALLENGERS = [
  {
    name:"The Obsidian Throne",
    icon:"",
    power:460,
    difficulty:6,
    flavour:"Ancient, merciless, and undefeated in living memory.",
    treasury:0,
    specialisation:null,
    goldReward:3500,
  },
  {
    name:"The Eternal Court",
    icon:"",
    power:430,
    difficulty:6,
    flavour:"They have watched every battle you've fought. They know your tactics.",
    treasury:0,
    specialisation:null,
    goldReward:3200,
  },
  {
    name:"The Ashen Legion",
    icon:"",
    power:490,
    difficulty:6,
    flavour:"Forged in conquest, hardened by a thousand campaigns.",
    treasury:0,
    specialisation:null,
    goldReward:4000,
  },
];

// The Emissary event — fires once per season when player hits Overlord renown.
// Does NOT send heroes away. Instead, accepts = next battle uses a diff-6 challenger.
const EMISSARY_EVENT = {
  id:          "legendary_emissary",
  isEmissary:  true,               // special flag — no hero selection needed
  title:       "A Legendary Challenge",
  icon:        "",
  heroesNeeded:0,
  requires:    [],
};

// ─── SCHEDULED OPPONENT SYSTEM ───────────────────────────────────────────────
// Each week a single opponent is scheduled — player cannot choose.
// Difficulty is weighted around the player's current rank with occasional upsets.

// ─── ENEMY ABILITIES ─────────────────────────────────────────────────────────
// Fixed per town, assigned at league generation. Visible before raid.
// Check specific stat averages — fail = secondary penalty (no win rate impact).
// Iron towns: no abilities. Bronze/Silver: 1. Gold/Platinum: 2.
// Thresholds are tier-scaled at assignment time via resolveAbilityThresholds().

export const ENEMY_ABILITIES = [
  {
    id:'crushing_assault',   name:'Crushing Assault',         icon:'',
    stat:'Defense',          scope:'vanguard',
    desc:'Their frontline hits with bone-shattering force.',
    softDesc: (t)=>`Vanguard heroes: +20% injury chance on defeat.`,
    hardDesc: (t)=>`Vanguard heroes: +40% injury chance, +10 fatigue.`,
    softEffect: { injuryMult:{pos:'Vanguard',mult:1.20} },
    hardEffect: { injuryMult:{pos:'Vanguard',mult:1.40}, fatigue:{pos:'Vanguard',amt:10} },
    thresholds: { bronze:{pass:23,soft:18}, silver:{pass:30,soft:24}, gold:{pass:40,soft:32}, platinum:{pass:50,soft:40} },
  },
  {
    id:'war_of_attrition',   name:'War of Attrition',         icon:'',
    stat:'Endurance',        scope:'squad',
    desc:'A grinding fight that drains every hero.',
    softDesc: (t)=>`All heroes in formation: +10 fatigue.`,
    hardDesc: (t)=>`All heroes in formation: +20 fatigue, −8 morale each.`,
    softEffect: { fatigue:{pos:'all',amt:10} },
    hardEffect: { fatigue:{pos:'all',amt:20}, morale:{pos:'all',amt:-8} },
    thresholds: { bronze:{pass:23,soft:18}, silver:{pass:30,soft:24}, gold:{pass:40,soft:32}, platinum:{pass:50,soft:40} },
  },
  {
    id:'flanking_blitz',     name:'Flanking Blitz',           icon:'',
    stat:'Agility',          scope:'skirmisher',
    desc:'Lightning flankers overwhelm slow Skirmishers.',
    softDesc: (t)=>`Skirmisher heroes: +12 fatigue.`,
    hardDesc: (t)=>`Skirmisher heroes: +22 fatigue, −10 morale each.`,
    softEffect: { fatigue:{pos:'Skirmisher',amt:12} },
    hardEffect: { fatigue:{pos:'Skirmisher',amt:22}, morale:{pos:'Skirmisher',amt:-10} },
    thresholds: { bronze:{pass:23,soft:18}, silver:{pass:30,soft:24}, gold:{pass:40,soft:32}, platinum:{pass:50,soft:40} },
  },
  {
    id:'sniper_fire',        name:'Sniper Fire',              icon:'',
    stat:'Accuracy',         scope:'skirmisher',
    desc:'Their marksmen pick off your flankers with cold precision.',
    softDesc: (t)=>`Skirmisher heroes: +25% injury chance.`,
    hardDesc: (t)=>`Skirmisher heroes: +50% injury chance, +8 fatigue.`,
    softEffect: { injuryMult:{pos:'Skirmisher',mult:1.25} },
    hardEffect: { injuryMult:{pos:'Skirmisher',mult:1.50}, fatigue:{pos:'Skirmisher',amt:8} },
    thresholds: { bronze:{pass:23,soft:18}, silver:{pass:30,soft:24}, gold:{pass:40,soft:32}, platinum:{pass:50,soft:40} },
  },
  {
    id:'brute_force',        name:'Brute Force',              icon:'',
    stat:'Strength',         scope:'vanguard',
    desc:'Overwhelming aggression that steamrolls weak fronts.',
    softDesc: (t)=>`Gold reward −20%.`,
    hardDesc: (t)=>`Gold reward −40%, Vanguard heroes: +10 fatigue.`,
    softEffect: { goldMult:0.80 },
    hardEffect: { goldMult:0.60, fatigue:{pos:'Vanguard',amt:10} },
    thresholds: { bronze:{pass:23,soft:18}, silver:{pass:30,soft:24}, gold:{pass:40,soft:32}, platinum:{pass:50,soft:40} },
  },
  {
    id:'arcane_suppression', name:'Arcane Suppression',       icon:'',
    stat:'Magic Resist',     scope:'arbiter',
    desc:'Their mages suppress your command and control.',
    softDesc: (t)=>`Arbiter heroes: −10 morale, +8 fatigue.`,
    hardDesc: (t)=>`All heroes: −12 morale, Arbiter heroes: +15 fatigue.`,
    softEffect: { morale:{pos:'Arbiter',amt:-10}, fatigue:{pos:'Arbiter',amt:8} },
    hardEffect: { morale:{pos:'all',amt:-12}, fatigue:{pos:'Arbiter',amt:15} },
    thresholds: { bronze:{pass:23,soft:18}, silver:{pass:30,soft:24}, gold:{pass:40,soft:32}, platinum:{pass:50,soft:40} },
  },
  {
    id:'dark_ritual',        name:'Dark Ritual',              icon:'',
    stat:'Magic Power',      scope:'arbiter',
    desc:'A dark ritual empowers their forces.',
    softDesc: (t)=>`All heroes: −8 morale.`,
    hardDesc: (t)=>`All heroes: −15 morale, +20% injury chance.`,
    softEffect: { morale:{pos:'all',amt:-8} },
    hardEffect: { morale:{pos:'all',amt:-15}, injuryMult:{pos:'all',mult:1.20} },
    thresholds: { bronze:{pass:23,soft:18}, silver:{pass:30,soft:24}, gold:{pass:40,soft:32}, platinum:{pass:50,soft:40} },
  },
  {
    id:'psychological_warfare', name:'Psychological Warfare', icon:'',
    stat:'Composure',        scope:'squad',
    desc:'Mind games rattle your heroes before the fight.',
    softDesc: (t)=>`All heroes: −10 morale.`,
    hardDesc: (t)=>`All heroes: −20 morale.`,
    softEffect: { morale:{pos:'all',amt:-10} },
    hardEffect: { morale:{pos:'all',amt:-20} },
    thresholds: { bronze:{pass:23,soft:18}, silver:{pass:30,soft:24}, gold:{pass:40,soft:32}, platinum:{pass:50,soft:40} },
  },
  {
    id:'disrupt_command',    name:'Disrupt Chain of Command', icon:'',
    stat:'Leadership',       scope:'squad',
    desc:'They target your leaders — coordination crumbles.',
    softDesc: (t)=>`All heroes: −25% XP this battle.`,
    hardDesc: (t)=>`All heroes: −50% XP, −10 morale each.`,
    softEffect: { xpMult:0.75 },
    hardEffect: { xpMult:0.50, morale:{pos:'all',amt:-10} },
    thresholds: { bronze:{pass:23,soft:18}, silver:{pass:30,soft:24}, gold:{pass:40,soft:32}, platinum:{pass:50,soft:40} },
  },
  {
    id:'iron_will_test',     name:'Iron Will Test',           icon:'',
    stat:'Determination',    scope:'squad',
    desc:'A brutal encounter that shatters those lacking conviction.',
    softDesc: (t)=>`Raiding heroes: −8 morale on defeat.`,
    hardDesc: (t)=>`Raiding heroes: −15 morale.`,
    softEffect: { morale:{pos:'all',amt:-8} },
    hardEffect: { morale:{pos:'all',amt:-15} },
    thresholds: { bronze:{pass:23,soft:18}, silver:{pass:30,soft:24}, gold:{pass:40,soft:32}, platinum:{pass:50,soft:40} },
  },
  {
    id:'guerrilla_tactics',  name:'Guerrilla Tactics',        icon:'',
    stat:'Adaptability',     scope:'squad',
    desc:'Unpredictable tactics confuse rigid formations.',
    softDesc: (t)=>`+15% injury chance across all heroes.`,
    hardDesc: (t)=>`+25% injury chance, all heroes: +8 fatigue.`,
    softEffect: { injuryMult:{pos:'all',mult:1.15} },
    hardEffect: { injuryMult:{pos:'all',mult:1.25}, fatigue:{pos:'all',amt:8} },
    thresholds: { bronze:{pass:23,soft:18}, silver:{pass:30,soft:24}, gold:{pass:40,soft:32}, platinum:{pass:50,soft:40} },
  },
  {
    id:'terror_tactics',     name:'Terror Tactics',           icon:'',
    stat:'Intimidation',     scope:'squad',
    desc:'Their fearsome reputation breaks the weak-willed.',
    softDesc: (t)=>`All heroes: −12 morale.`,
    hardDesc: (t)=>`All heroes: −20 morale.`,
    softEffect: { morale:{pos:'all',amt:-12} },
    hardEffect: { morale:{pos:'all',amt:-20} },
    thresholds: { bronze:{pass:23,soft:18}, silver:{pass:30,soft:24}, gold:{pass:40,soft:32}, platinum:{pass:50,soft:40} },
  },
  {
    id:'tactical_trap',      name:'Tactical Trap',            icon:'',
    stat:'Tactics',          scope:'squad',
    desc:'A clever battlefield trap — only awareness avoids it.',
    softDesc: (t)=>`All heroes: +10 fatigue.`,
    hardDesc: (t)=>`All heroes: +18 fatigue, +20% injury chance.`,
    softEffect: { fatigue:{pos:'all',amt:10} },
    hardEffect: { fatigue:{pos:'all',amt:18}, injuryMult:{pos:'all',mult:1.20} },
    thresholds: { bronze:{pass:23,soft:18}, silver:{pass:30,soft:24}, gold:{pass:40,soft:32}, platinum:{pass:50,soft:40} },
  },
];

// Bronze/Silver pool — physical and intuitive abilities for newer players
const ABILITY_POOL_BASIC = ['crushing_assault','war_of_attrition','flanking_blitz',
  'sniper_fire','brute_force','psychological_warfare','guerrilla_tactics','terror_tactics'];

// Assign fixed abilities to a town based on tier
function assignTownAbilities(tierId) {
  if(tierId === 'iron') return [];
  const isAdvanced = ['gold','platinum'].includes(tierId);
  const count = isAdvanced ? 2 : 1;
  const pool = isAdvanced
    ? ENEMY_ABILITIES.map(a=>a.id)
    : ABILITY_POOL_BASIC;
  const shuffled = [...pool].sort(()=>Math.random()-0.5);
  return shuffled.slice(0,count).map(id => ENEMY_ABILITIES.find(a=>a.id===id));
}

// Rehydrate ability objects after a save/load round-trip. softDesc and hardDesc
// are arrow functions on the canonical ENEMY_ABILITIES entries; JSON.stringify
// drops functions, so saved tierEnemyTowns / scheduledOpponent come back with
// stripped objects. Re-mapping by id restores the methods (and any other
// future fields), preventing white-screen render crashes on Bronze+ tiers.
function rehydrateAbility(a) {
  if(!a || !a.id) return a;
  const canonical = ENEMY_ABILITIES.find(x => x.id === a.id);
  return canonical || a;
}
function rehydrateTownAbilities(t) {
  if(!t) return t;
  return { ...t, abilities: (t.abilities || []).map(rehydrateAbility) };
}

// Check ability outcome for a given formation + heroes
// Returns 'pass', 'soft', or 'hard'
export function checkAbility(ability, formation, tierId) {
  const t = ability.thresholds[tierId] || ability.thresholds.bronze;
  const posHeroes = (pos) => (formation[pos]||[]).filter(Boolean);
  const allHeroes = [...posHeroes('Vanguard'),...posHeroes('Skirmisher'),...posHeroes('Arbiter')];

  let heroes;
  if(ability.scope === 'vanguard')    heroes = posHeroes('Vanguard');
  else if(ability.scope === 'skirmisher') heroes = posHeroes('Skirmisher');
  else if(ability.scope === 'arbiter')    heroes = posHeroes('Arbiter');
  else heroes = allHeroes;

  if(!heroes.length) return 'hard';
  const avg = heroes.reduce((s,h)=>s+(h.stats[ability.stat]||0),0) / heroes.length;
  if(avg >= t.pass) return 'pass';
  if(avg >= t.soft) return 'soft';
  return 'hard';
}


function weeklyChance(timesPerStage) {
  const avgStageWeeks = 100; // approximate weeks per stage
  return timesPerStage / avgStageWeeks;
}

function ageHero(hero, buildings) {
  const newStats = {...hero.stats};
  let newMorale = hero.morale;
  let newStage = hero.stage || "prospect";
  let finalProgress = hero.stageProgress || 0;
  let declineNote = null;
  let retired = false;
  const events = [];

  // Advance stage progress each week
  const stageDef = STAGE_DEFS[newStage];
  if(stageDef) {
    const weeklyPct = (1 / stageDef.weeks) * 100;
    finalProgress = Math.min(100, finalProgress + weeklyPct);
    // Transition to next stage
    if(finalProgress >= 100) {
      const idx = STAGE_ORDER.indexOf(newStage);
      if(idx >= 0 && idx < STAGE_ORDER.length - 1) {
        newStage = STAGE_ORDER[idx + 1];
        finalProgress = 0;
      }
    }
  }

  if(hero.stage === "fading") {
    // Stat decay — fires ~3x per fading stage
    if(Math.random() < weeklyChance(3)) {
      const progress01 = (hero.stageProgress||0) / 100;
      const dr = 0.3 + progress01 * 0.5; // escalates through fading
      let decayed = 0;
      PHYSICAL_STATS.forEach(s => {
        if(Math.random() < 0.3 + dr * 0.4) {
          newStats[s] = Math.max(10, newStats[s] - rand(1, Math.ceil(dr*4)));
          decayed++;
        }
      });
      MENTAL_STATS.forEach(s => {
        if(Math.random() < 0.1) newStats[s] = Math.max(10, newStats[s] - rand(1,2));
      });
      if(Math.random() < 0.4) newStats.Form = Math.max(1, newStats.Form - 1);
      if(decayed > 0) declineNote = pick([
        `${hero.name} is slowing — the younger ones are faster to the wall now, and they know it.`,
        `${hero.name} takes longer to warm up these days. The edge is dulling.`,
        `Time is collecting its debts from ${hero.name}.`,
      ]);
    }
  }

  if(hero.stage === "veteran") {
    // Rapid decay — fires ~4x per veteran stage
    if(Math.random() < weeklyChance(4)) {
      PHYSICAL_STATS.forEach(s => {
        if(Math.random() < 0.65) newStats[s] = Math.max(10, newStats[s] - rand(2,5));
      });
      MENTAL_STATS.forEach(s => {
        if(Math.random() < 0.25) newStats[s] = Math.max(10, newStats[s] - rand(1,3));
      });
      newStats.Form = Math.max(1, newStats.Form - rand(0,1));
      newMorale = Math.max(30, newMorale - rand(2,6));
      declineNote = `${hero.name} is fighting against time...`;
    }
    // Retire only at natural end of veteran stage
    if(finalProgress >= 100) retired = true;
  }

  if(declineNote) events.push({text:declineNote, type:hero.stage==="veteran"?"danger":"warning", heroId:hero.id});
  if(retired) events.push({text:`${hero.name} has retired. A legend leaves the field.`, type:"danger", heroId:hero.id, retired:true});

  return { hero:{...hero, stage:newStage, stageProgress:finalProgress, stats:newStats, morale:newMorale, retired}, events };
}

// Hall of Legends — retired heroes keep lifting squad morale from the sidelines.
// Each legend contributes 1 + floor(level/3) morale/week, capped at +20 total.
// Pure and exported so the mechanic is regression-locked (it once shipped dead:
// the roster dropped retirees before the bonus was read, so it always saw zero).
export function legendMoraleBonus(retiredLegends) {
  if(!retiredLegends || retiredLegends.length === 0) return 0;
  return Math.min(20, retiredLegends.reduce((sum, r) => sum + (1 + Math.floor((r.level || 0) / 3)), 0));
}

// ─── RAID SIMULATION ENGINE ───────────────────────────────────────────────────
// Builds a full scripted play-by-play that resolves over ~30 seconds.
// Outcome is pre-determined; events are generated from actual hero stats.
// Returns: { phases, finalResult, weakLinks }

const PHASE_DEFS = [
  { id:"approach",  label:"Approach",        icon:"", pos:null,          duration:5500 },
  { id:"vanguard",  label:"Vanguard Clash",   icon:"", pos:"Vanguard",    duration:7000 },
  { id:"skirmish",  label:"Skirmisher Strike",icon:"", pos:"Skirmisher",  duration:7000 },
  { id:"arbiter",   label:"Arbiter Command",  icon:"", pos:"Arbiter",     duration:6500 },
  { id:"resolution",label:"Resolution",       icon:"", pos:null,          duration:5000 },
];

// Event templates per phase — filled with real hero names/stats
function buildPhaseEvents(phaseId, phasePos, formation, enemy, analysis, won, phaseWon) {
  const heroes = phasePos ? (formation[phasePos]||[]).filter(Boolean) : POS_KEYS.flatMap(p=>(formation[p]||[]).filter(Boolean));
  const allHeroes = POS_KEYS.flatMap(p=>(formation[p]||[]).filter(Boolean));
  const events = [];

  const good = (text) => events.push({ text, type:"good" });
  const bad  = (text) => events.push({ text, type:"bad"  });
  const info = (text) => events.push({ text, type:"info" });
  const warn = (text) => events.push({ text, type:"warn" });

  // Variant pools — pick one at random
  const pickLine = (arr) => arr[Math.floor(Math.random()*arr.length)];

  if(phaseId === "approach") {
    const approachLines = [
      `Your squad marches on ${enemy.name}. Enemy power rated at ${enemy.power}.`,
      `${enemy.name} awaits. Power ${enemy.power} — the scouts don't look confident.`,
      `Formation locked. ${enemy.name} stands between you and victory.`,
      `The march begins. ${enemy.name} has been warned of your coming.`,
    ];
    info(pickLine(approachLines));

    const hasLeader = allHeroes.find(h=>["Paladin","Cleric"].includes(h.role));
    if(hasLeader){
      const leaderLines = [
        `${hasLeader.name} rallies the squad. Morale holds firm.`,
        `A word from ${hasLeader.name} steadies the nerves. The squad moves as one.`,
        `${hasLeader.name} leads the charge in spirit — the formation feels cohesive.`,
      ];
      good(pickLine(leaderLines));
    } else {
      const noLeaderLines = [
        "No natural leader in this group. Coordination already shaky.",
        "The squad advances without a unifying voice. It shows.",
        "Missing a leader — the formation looks uncertain before the first blow lands.",
      ];
      warn(pickLine(noLeaderLines));
    }

    // Enemy specialisation callout
    if(enemy.specialisation){
      const spec = enemy.specialisation;
      const pen = calcSpecPenalty(spec, formation);
      if(pen) warn(`${enemy.name} fights with ${spec.label}. Your formation doesn't counter it — enemy effective power is higher.`);
      else info(`${enemy.name} uses ${spec.label}. Your formation counters it effectively.`);
    }

    // Trait-specific approach callouts
    const inspiring = allHeroes.find(h=>h.traits?.includes("Inspiring"));
    if(inspiring) good(`${inspiring.name}'s presence alone lifts the squad. Inspiring heroes change the mood.`);
    const coward = allHeroes.find(h=>h.traits?.includes("Coward"));
    if(coward) warn(`${coward.name} looks pale. A Coward in the formation is a liability before the fight even starts.`);
    const hotHeaded = allHeroes.find(h=>h.traits?.includes("Hot-headed"));
    if(hotHeaded) info(`${hotHeaded.name} is already chomping at the bit — Hot-headed energy can cut both ways.`);

    const unhappy = allHeroes.filter(h=>h.morale<40);
    if(unhappy.length){
      const unhappyLines = [
        `${unhappy.map(h=>h.name).join(", ")} look${unhappy.length>1?"":"s"} disgruntled — morale is showing.`,
        `${unhappy[0].name} is fighting for a manager they don't trust. That's a problem.`,
        `Low morale in the ranks before the battle even begins. Sort it out.`,
      ];
      warn(pickLine(unhappyLines));
    }

    const injured = allHeroes.filter(h=>h.injured);
    if(injured.length){
      const injuryLines = [
        `${injured[0].name} is carrying an injury into this battle. Risky.`,
        `${injured[0].name} shouldn't be here — that injury isn't fully healed.`,
        `${injured[0].name} grits their teeth and takes the field. Brave or reckless.`,
      ];
      bad(pickLine(injuryLines));
    }

    // Fatigue warning
    const exhausted = allHeroes.filter(h=>(h.fatigue||0)>=80);
    if(exhausted.length) warn(`${exhausted.map(h=>h.name).join(", ")} ${exhausted.length>1?"are":"is"} running on empty — fatigue above 80%.`);

    // Race synergy flavour
    if(analysis.raceSynergy) {
      good(`${analysis.raceSynergy.name}: ${analysis.raceSynergy.flavour}`);
    }
  }

  if(phaseId === "vanguard") {
    const fighters = heroes.length ? heroes : allHeroes;
    const best = fighters.reduce((b,h)=>calcHeroCombatScore(h,"Vanguard")>(b?calcHeroCombatScore(b,"Vanguard"):0)?h:b, null);
    const worst = fighters.reduce((b,h)=>h.stats.Endurance<(b?.stats.Endurance||99)?h:b, null);

    if(best) {
      const pwr = Math.round(calcHeroCombatScore(best,"Vanguard"));
      const isHalfOrc = best.race==="Half-Orc";
      const isDragonborn = best.race==="Dragonborn";
      const isBerserker = best.traits?.includes("Berserker");
      const isVeteran = best.level>=7;
      const isProspect = best.level<=2;

      if(phaseWon){
        const winLines = isHalfOrc ? [
          `${best.name} (PWR ${pwr}) tears through the enemy front with Half-Orc fury.`,
          `${best.name} hits the line like a battering ram. The defenders scatter.`,
        ] : isBerserker ? [
          `${best.name} goes berserk — PWR ${pwr}, all restraint abandoned. Devastating.`,
          `Something breaks in ${best.name}. The Berserker takes over. The enemy breaks first.`,
        ] : isDragonborn ? [
          `${best.name} advances with draconic authority (PWR ${pwr}). The enemy hesitates.`,
          `The front line cracks under ${best.name}'s draconic presence. PWR ${pwr}.`,
        ] : isVeteran ? [
          `${best.name} (Lv ${best.level}, PWR ${pwr}) has done this a hundred times. Ice cold.`,
          `A veteran knowing exactly what to do. ${best.name} breaks the front effortlessly.`,
        ] : isProspect ? [
          `${best.name} (Lv ${best.level}) punches way above their level. A future star.`,
          `Young ${best.name} earns their stripes today — PWR ${pwr} against experienced defenders.`,
        ] : [
          `${best.name} (PWR ${pwr}, STR ${best.stats.Strength}) crashes through the enemy front.`,
          `${best.name} leads the charge with authority. The Vanguard advances.`,
          `The front line yields to ${best.name}'s pressure. PWR ${pwr} proving decisive.`,
        ];
        good(pickLine(winLines));
      } else {
        const lossLines = [
          `${best.name} (PWR ${pwr}) hits the line but ${enemy.name}'s defenders hold firm.`,
          `${best.name} pushes hard but the enemy front refuses to break.`,
          `Even ${best.name}'s best effort (PWR ${pwr}) isn't enough. The wall holds.`,
        ];
        bad(pickLine(lossLines));
      }
    }

    // Trait callouts
    const resilient = fighters.find(h=>h.traits?.includes("Resilient"));
    if(resilient && phaseWon) good(`${resilient.name}'s Resilience keeps them standing through the punishment.`);
    const berserkerLoss = fighters.find(h=>h.traits?.includes("Berserker"));
    if(berserkerLoss && !phaseWon) warn(`${berserkerLoss.name}'s berserker rage works against them — overextended and exposed.`);

    if(worst && worst.stats.Endurance < 45){
      const enduranceLines = [
        `${worst.name} is flagging — Endurance ${worst.stats.Endurance} too low for sustained frontline pressure.`,
        `${worst.name} is blowing hard. You can't sustain a front line without Endurance.`,
        `The weak link is clear: ${worst.name}'s stamina (${worst.stats.Endurance}) is failing the Vanguard.`,
      ];
      bad(pickLine(enduranceLines));
    }

    // High fatigue fighter
    const tiredFighter = fighters.find(h=>(h.fatigue||0)>=80);
    if(tiredFighter) warn(`${tiredFighter.name} is fighting on fumes (fatigue ${tiredFighter.fatigue}%). Output will suffer.`);

    const misfits = heroes.filter(h=>["Mage"].includes(h.role));
    if(misfits.length){
      const misfitLines = [
        `${misfits[0].name} (${misfits[0].role}) is completely out of position in the Vanguard.`,
        `A ${misfits[0].role} in the front line? ${misfits[0].name} is a liability here.`,
        `${misfits[0].name} doesn't belong at the front — this is going to hurt.`,
      ];
      bad(pickLine(misfitLines));
    }

    const lowMorale = fighters.find(h=>h.morale<40);
    if(lowMorale){
      const moraleLines = [
        `${lowMorale.name}'s morale is ${lowMorale.morale}% — barely fighting with intent.`,
        `${lowMorale.name} looks broken before the fight starts. Morale this low is a serious problem.`,
        `${lowMorale.name} is going through the motions. ${lowMorale.morale}% morale is the floor.`,
      ];
      warn(pickLine(moraleLines));
    }

    const finaleWin = [
      "Vanguard holds the line and advances.",
      "The front is ours. Vanguard phase secured.",
      "Enemy front crumbles. Vanguard dominates.",
    ];
    const finaleLoss = [
      "Vanguard is repelled. Ground lost.",
      "The front line breaks. Vanguard phase lost.",
      "Pushed back hard. The Vanguard couldn't hold.",
    ];
    if(phaseWon) good(pickLine(finaleWin)); else bad(pickLine(finaleLoss));
  }

  if(phaseId === "skirmish") {
    const flankers = heroes.length ? heroes : allHeroes;
    const best = flankers.reduce((b,h)=>calcHeroCombatScore(h,"Skirmisher")>(b?calcHeroCombatScore(b,"Skirmisher"):0)?h:b, null);


    const lowAcc = flankers.find(h=>h.stats.Accuracy<35);
    if(lowAcc){
      const accLines = [
        `${lowAcc.name}'s Accuracy (${lowAcc.stats.Accuracy}) is causing wasted strikes on the flank.`,
        `${lowAcc.name} can't find the mark — Accuracy ${lowAcc.stats.Accuracy} is a real problem here.`,
        `Missed opportunities from ${lowAcc.name}. You need better Accuracy in the Skirmisher role.`,
      ];
      warn(pickLine(accLines));
    }

    const finaleWin = [
      "Skirmishers secure the flank.",
      "The flank belongs to us. Skirmish phase won.",
      "Enemy flank cracked wide open.",
    ];
    const finaleLoss = [
      "Flanking attempt fails. Enemy holds.",
      "The flank is shut down. Skirmish phase lost.",
      "Turned back on the flank — costly failure.",
    ];
    if(phaseWon) good(pickLine(finaleWin)); else bad(pickLine(finaleLoss));
  }

  if(phaseId === "arbiter") {
    const commanders = heroes.length ? heroes : allHeroes;
    const best = commanders.reduce((b,h)=>calcHeroCombatScore(h,"Arbiter")>(b?calcHeroCombatScore(b,"Arbiter"):0)?h:b, null);
    const bestMagic = commanders.reduce((b,h)=>h.stats["Magic Power"]>(b?.stats["Magic Power"]||0)?h:b, null);

    if(best) {
      const pwr = Math.round(calcHeroCombatScore(best,"Arbiter"));
      const isMage = best.role==="Mage";
      const isCleric = best.role==="Cleric";
      const isGnome = best.race==="Gnome";
      const isVeteran = best.level>=7;
      const isTactician = best.traits?.includes("Tactician");

      if(phaseWon){
        const winLines = isTactician ? [
          `${best.name}'s Tactician instincts shine — the decisive call comes at exactly the right moment.`,
          `${best.name} sees three moves ahead. The Tactician trait turns a close call into control.`,
        ] : isMage ? [
          `${best.name} channels the field with arcane insight — command through magic.`,
          `${best.name}'s arcane perspective (PWR ${pwr}) reveals angles no one else can see.`,
        ] : isCleric ? [
          `${best.name} inspires through faith. The squad responds to divine command.`,
          `${best.name}'s blessing steadies the formation at the critical moment.`,
        ] : isGnome ? [
          `${best.name} (Gnome) reads the field with extraordinary clarity. Small but sharp.`,
          `Don't underestimate ${best.name} — Gnome tactical insight (PWR ${pwr}) is devastating.`,
        ] : isVeteran ? [
          `${best.name} (Lv ${best.level}) has commanded in tighter spots than this. No hesitation.`,
          `Experience counts. ${best.name} makes the right call when it matters most.`,
        ] : [
          `${best.name} (PWR ${pwr}, TAC ${best.stats.Tactics}) reads the field and issues the decisive command.`,
          `${best.name} spots the opening others missed. Command phase controlled.`,
          `Decisive and sharp — ${best.name}'s tactical read (PWR ${pwr}) turns the tide.`,
        ];
        good(pickLine(winLines));
      } else {
        const lossLines = [
          `${best.name} (PWR ${pwr}) struggles to adapt — command falters under pressure.`,
          `${best.name} issues the call too late. ${enemy.name}'s commander out-thinks them.`,
          `The field shifts too fast for ${best.name}. Command phase lost.`,
        ];
        bad(pickLine(lossLines));
      }
    }

    if(bestMagic && bestMagic.stats["Magic Power"]>60){
      if(phaseWon){
        const magicWinLines = [
          `${bestMagic.name} unleashes a devastating spell (MAG ${bestMagic.stats["Magic Power"]}). Reserves collapse.`,
          `${bestMagic.name}'s magic (${bestMagic.stats["Magic Power"]}) overwhelms the enemy command.`,
          `A spell from ${bestMagic.name} ends the argument. MAG ${bestMagic.stats["Magic Power"]} is too much to answer.`,
        ];
        good(pickLine(magicWinLines));
      } else {
        const magicLossLines = [
          `${bestMagic.name}'s spell is countered — ${enemy.name}'s Magic Resist holds.`,
          `The magic doesn't land. ${enemy.name} were prepared for it.`,
          `${bestMagic.name} reaches for the spell but ${enemy.name}'s resistance is formidable.`,
        ];
        bad(pickLine(magicLossLines));
      }
    }

    const brutes = heroes.filter(h=>["Warrior"].includes(h.role));
    if(brutes.length){
      const bruteLines = [
        `${brutes[0].name} brings no tactical value in the command role — dead weight here.`,
        `A Warrior in the Arbiter slot. ${brutes[0].name} doesn't know what they're supposed to do.`,
        `${brutes[0].name} is wasted in command. They belong at the front, not calling the shots.`,
      ];
      bad(pickLine(bruteLines));
    }

    const unhappyCmdr = commanders.find(h=>h.morale<40);
    if(unhappyCmdr){
      const unhappyLines = [
        `${unhappyCmdr.name} is disgruntled — a discontented commander undermines the formation.`,
        `You can't trust the command to ${unhappyCmdr.name} right now. Morale ${unhappyCmdr.morale}% is a liability.`,
        `${unhappyCmdr.name}'s sour attitude bleeds into every order they give.`,
      ];
      warn(pickLine(unhappyLines));
    }

    // Iron Will in command
    const ironWill = commanders.find(h=>h.traits?.includes("Iron Will"));
    if(ironWill) good(`${ironWill.name}'s Iron Will steadies the command under pressure.`);

    const finaleWin = [
      "Arbiter holds command. Formation responds.",
      "Command phase secured. The plan holds.",
      "The Arbiter reads it perfectly. Phase won.",
    ];
    const finaleLoss = [
      "Command breaks down under pressure.",
      "The command call comes too late. Arbiter phase lost.",
      "Formation loses shape. Arbiter phase fails.",
    ];
    if(phaseWon) good(pickLine(finaleWin)); else bad(pickLine(finaleLoss));
  }

  if(phaseId === "resolution") {
    const clutch = allHeroes.length > 0
      ? allHeroes.reduce((best,h)=>{
          const pos=POS_KEYS.find(p=>(formation[p]||[]).some(x=>x?.id===h.id))||"Vanguard";
          const score=calcHeroCombatScore(h,pos);
          return (!best||score>best.score)?{hero:h,score}:best;
        }, null)?.hero
      : null;
    const synStr = analysis.positive.map(s=>s.name).join(", ");
    const synWeak = analysis.negative.map(s=>s.name).join(", ");
    if(synStr) info(`Active synergies: ${synStr}.`);
    if(synWeak) warn(`Active penalties: ${synWeak}.`);
    if(clutch && Math.random()<0.35){
      const clutchWinLines = [
        `${clutch.name} delivers the decisive blow. A moment of brilliance.`,
        `${clutch.name} rises when it counts. The squad follows.`,
        `The battle is decided by one moment. ${clutch.name} makes it count.`,
      ];
      const clutchLossLines = [
        `${clutch.name} fought valiantly but it wasn't enough.`,
        `Even ${clutch.name}'s best couldn't turn the tide today.`,
        `${clutch.name} almost found a way. Almost.`,
      ];
      if(won) good(pickLine(clutchWinLines));
      else info(pickLine(clutchLossLines));
    }

    if(won){
      const victoryLines = [
        `${enemy.name} is overcome! The battle is a triumph.`,
        `Victory against ${enemy.name}. The realm grows stronger.`,
        `${enemy.name} falls. Another chapter written.`,
        `The battle is yours. ${enemy.name} couldn't match you today.`,
      ];
      good(pickLine(victoryLines));
    } else {
      const defeatLines = [
        `${enemy.name} repels your forces. A costly defeat.`,
        `Defeat. ${enemy.name} proved too strong today.`,
        `The battle is lost. ${enemy.name} holds their ground.`,
        `Sent home empty-handed. ${enemy.name} wins this one.`,
      ];
      bad(pickLine(defeatLines));
    }
  }

  return events;
}

// Weak link analysis: surfaces specific heroes who dragged down the team.
// tierId scales the "low primary stats" threshold — 25 avg is fine in Iron,
// not fine in Platinum — so the flag only fires when stats are weak for the
// tier the player is actually fighting in.
function analyseWeakLinks(formation, analysis, tierId) {
  const tier = TIERS[tierId] || TIERS.iron;
  // Iron=25, Bronze=35, Silver=45, Gold=55, Platinum=65 (difficulty-scaled)
  const weakStatThreshold = 15 + tier.difficulty * 10;
  const links = [];
  POS_KEYS.forEach(pos => {
    const pd = POSITIONS[pos];
    (formation[pos]||[]).forEach(h => {
      if(!h) return;
      const issues = [];

      if(h.stats.Form < 4) {
        issues.push({ severity:"warning", reason:`Very low Form (${h.stats.Form}/10) — underperforming`, stat:"Form", impact:-15 });
      }
      if(h.morale < 40) {
        issues.push({ severity:"warning", reason:`Low morale (${h.morale}%) — not fighting at full effort`, stat:"Morale", impact:-12 });
      }
      if(h.injured) {
        issues.push({ severity:"critical", reason:`Carrying an injury — effectiveness heavily compromised`, stat:"Injury", impact:-25 });
      }
      // Check primary stat fit — threshold scales with tier difficulty
      const primaryAvg = pd.primaryStats.reduce((a,s)=>a+(h.stats[s]||0),0)/pd.primaryStats.length;
      if(primaryAvg < weakStatThreshold) {
        issues.push({ severity:"warning", reason:`Low primary stats for ${tier.name} tier (avg ${Math.round(primaryAvg)} · ${weakStatThreshold}+ recommended)`, stat:"Stats", impact:-10 });
      }
      // Declining hero in physical position
      const phase = agePhase(h);
      if(["fading","veteran"].includes(phase) && pos !== "Arbiter") {
        issues.push({ severity:"info", reason:`${agePhaseLabel(phase)} hero in a physical role — consider moving to Arbiter`, stat:"Stage", impact:-8 });
      }

      if(issues.length > 0) {
        links.push({ hero:h, pos, issues, totalImpact: issues.reduce((a,i)=>a+i.impact,0) });
      }
    });
  });
  return links.sort((a,b) => a.totalImpact - b.totalImpact);
}

export function buildRaidSimulation(formation, enemy, buildings, playerRank, ngPlus=null) {
  const allHeroes = POS_KEYS.flatMap(p=>(formation[p]||[]).filter(Boolean));
  if(!allHeroes.length) return null;

  const {effective, analysis} = calcFormationRating(formation);
  const hasBarracks = buildings.find(b=>b.id==="barracks"&&b.built);
  const hasInfirmary = buildings.find(b=>b.id==="infirmary"&&b.built);

  // Specialisation penalty
  const specPenalty = calcSpecPenalty(enemy.specialisation, formation);
  let adjustedEnemyPower = specPenalty
    ? Math.round(enemy.power * (1 + specPenalty.penalty))
    : Math.round(enemy.power);

  // Active bonus: enemy_power_debuff from completed objective
  const debuff = null; // seasonal quests removed
  if(debuff) adjustedEnemyPower = Math.round(adjustedEnemyPower * (1 - debuff.value));

  const winChance = calcWinChance(effective, enemy.difficulty, adjustedEnemyPower);

  // Night Vision: underdog bonus applied to all phase chances
  const nightVisionHero = allHeroes.find(h=>h.traits?.includes("Night Vision"));
  const nightBonus = nightVisionHero && effective < enemy.power ? 0.04 : 0;

  // ── PER-PHASE WIN CHANCES ────────────────────────────────────────────────────
  // Each of the 3 position phases (Vanguard, Skirmisher, Arbiter) gets its own
  // win chance derived from the heroes in that position vs a positional enemy share.
  // Winning 2 of 3 phases = winning the battle.
  //
  // Phase win chance: sigmoid of (posScore / posEnemyShare), capped 0.20–0.80.
  // Cap 0.80 → max overall win ~90% (dominant). Floor 0.20 → min ~10% (miracle).
  // This preserves the DnD Nat 1/20 feel while making each position matter.

  const PHASE_WIN_CAP   = 0.85;
  const PHASE_WIN_FLOOR = 0.15;
  const k = 2.0;

  // Enemy power is split equally across 3 positions
  const posEnemyShare = adjustedEnemyPower / 3;

  // Per-lane synergy multipliers — a Dwarf wall boosts Vanguard and thins the
  // Skirmisher line; the race identity shows up in the phase odds themselves.
  const phaseWinChances = {};
  const positionScores = {};
  POS_KEYS.forEach(pos => {
    const posHeroes = (formation[pos]||[]).filter(Boolean);
    const { score, primaryHero, supportHero, pairingMult } = calcPositionScore(posHeroes, pos);
    const laneSynergyMult = analysis.laneMults?.[pos] ?? Math.min(1.5, Math.max(0.3, analysis.mult));
    const effectiveScore = score * laneSynergyMult;
    positionScores[pos] = { score, effectiveScore, primaryHero, supportHero, pairingMult };
    const ratio     = effectiveScore > 0 ? posEnemyShare / effectiveScore : 999;
    const rawChance = 1 / (1 + Math.pow(ratio, k));
    phaseWinChances[pos] = Math.min(PHASE_WIN_CAP, Math.max(PHASE_WIN_FLOOR, rawChance + nightBonus));
  });

  // ── EXCHANGE ENGINE ────────────────────────────────────────────────────
  // Each lane resolves as a first-to-3 series of exchanges (max 5). The
  // per-exchange probability q is derived from the lane's phase chance p so
  // that P(win the series at q) === p EXACTLY — the macro balance curve is
  // unchanged by construction. Exchanges add texture, drama and attribution.
  const invertBest3of5 = (p) => {
    const seriesProb = (q) => { const l=1-q; return 10*q*q*q*l*l + 5*Math.pow(q,4)*l + Math.pow(q,5); };
    let lo=0.001, hi=0.999;
    for(let i=0;i<30;i++){ const mid=(lo+hi)/2; if(seriesProb(mid)<p) lo=mid; else hi=mid; }
    return (lo+hi)/2;
  };

  const phaseRolls = {};
  const laneSequences = {};
  POS_KEYS.forEach(pos => {
    const q = invertBest3of5(phaseWinChances[pos]);
    const seq = Array.from({length:5}, () => Math.random() < q);
    laneSequences[pos] = seq;
    phaseRolls[pos] = seq.filter(Boolean).length >= 3;
  });

  // 2-of-3 majority determines the battle outcome
  const phasesWon = POS_KEYS.filter(pos => phaseRolls[pos]).length;
  let won = phasesWon >= 2;

  // Overall win chance (for display) = P(win 2+ of 3) from individual phase chances
  const pa = phaseWinChances["Vanguard"], pb = phaseWinChances["Skirmisher"], pc = phaseWinChances["Arbiter"];
  const overallWinChance = pa*pb*pc + pa*pb*(1-pc) + pa*(1-pb)*pc + (1-pa)*pb*pc;


  // Build phase results for simulation display
  const phaseResults = PHASE_DEFS.map(ph => {
    let phaseWon, phaseWinChance;
    if(ph.pos) {
      phaseWon       = phaseRolls[ph.pos];
      phaseWinChance = phaseWinChances[ph.pos];
    } else if(ph.id === "approach") {
      phaseWon       = Math.random() < Math.min(0.85, overallWinChance + 0.15);
      phaseWinChance = null;
    } else {
      // Resolution: always matches real outcome
      phaseWon       = won;
      phaseWinChance = null;
    }
    const events = buildPhaseEvents(ph.id, ph.pos, formation, enemy, analysis, won, phaseWon);
    return { ...ph, won:phaseWon, winChance:phaseWinChance, events };
  });
  phaseResults[phaseResults.length-1].won = won;

  // XP: explicit per-tier range, equal on win or loss — no penalty for fielding weaker heroes
  const tierData = Object.values(TIERS).find(t=>t.difficulty===playerRank) || TIERS.iron;
  const [xpMin, xpMax] = tierData.xpRange || [12, 20];
  let heroXP = Math.round(rand(xpMin, xpMax) * (hasBarracks?1.2:1));
  // Losers collect a small purse too — no week is worth zero. This is the
  // anti-death-spiral valve: a cold streak stays survivable (sim-calibrated).
  let goldSwing = won ? rand(300,700)+enemy.difficulty*100 : rand(50,110)+enemy.difficulty*25;

  // Resolve enemy abilities — check stat thresholds, collect effects
  const abilityResults = (enemy.abilities||[]).map(ability => {
    const outcome = checkAbility(ability, formation, enemy.tierId||'iron');
    return { ability, outcome };
  });

  // Gold and XP multipliers from ability effects
  let abilityGoldMult = 1.0;
  let abilityXpMult   = 1.0;
  abilityResults.forEach(({ability, outcome}) => {
    if(outcome === 'pass') return;
    const effects = outcome === 'soft' ? ability.softEffect : ability.hardEffect;
    if(effects.goldMult) abilityGoldMult *= effects.goldMult;
    if(effects.xpMult)   abilityXpMult   *= effects.xpMult;
  });

  heroXP    = Math.round(heroXP * abilityXpMult);
  goldSwing = Math.round(goldSwing * abilityGoldMult);

  // Injury calculation — fatigue is the primary driver.
  // Fresh heroes have near-zero injury risk. Exhausted heroes are genuinely fragile.
    // Cap at 2 injuries per raid — prevents catastrophic pile-ons from bad luck.
  const guerrillaInjuryBonus = specPenalty?.injuryBonus ?? 0;

  const abilityInjuryMultForHero = (h) => {
    let mult = 1.0;
    abilityResults.forEach(({ability, outcome}) => {
      if(outcome === 'pass') return;
      const effects = outcome === 'soft' ? ability.softEffect : ability.hardEffect;
      if(!effects.injuryMult) return;
      const {pos, mult: m} = effects.injuryMult;
      const heroPos = POS_KEYS.find(p=>(formation[p]||[]).some(x=>x?.id===h.id));
      if(pos === 'all' || heroPos === pos) mult *= m;
    });
    return mult;
  };

  // Shuffle heroes to randomise who gets capped injuries
  const shuffledHeroes = [...allHeroes].sort(()=>Math.random()-0.5);
  let injuryCount = 0;
  const injuries = shuffledHeroes.filter(h => {
    if(injuryCount >= 2) return false; // cap at 2 per raid
    const fat = h.fatigue || 0;
    // Fatigue-primary sigmoid curve
    // Floor of ~3% (after the 2× loss modifier) on a loss so fresh heroes
    // aren't invulnerable and injury traits always mean something.
    const fatigueFactor = fat < 40  ? (won ? 0.0 : 0.015)
      : fat < 70  ? ((fat-40)/30) * 0.08
      : fat < 88  ? 0.08 + ((fat-70)/18) * 0.12
      : 0.20 + ((fat-88)/12) * 0.15;
    // Defeat doubles risk; win is baseline
    const outcomeMod = won ? 1.0 : 2.0;
    // Ability and spec bonuses
    const abilityMult = abilityInjuryMultForHero(h);
    let chance = Math.min(0.60, fatigueFactor * outcomeMod * abilityMult);
    chance += (!won ? guerrillaInjuryBonus : 0);
    // Trait modifiers
    if(h.traits?.includes("Berserker") && !won) chance *= 1.5;
    if(h.traits?.includes("Glass Cannon"))      chance *= 2.0;
    if(h.traits?.includes("Resilient"))         chance *= 0.5;
    if(hasInfirmary)                            chance *= 0.70; // Infirmary: -30% injury chance
    const injured = Math.random() < chance;
    if(injured) injuryCount++;
    return injured;
  }).map(h => h.id);

  // ── DRESS EXCHANGES INTO BEATS ─────────────────────────────────────────
  // Win/loss of each exchange is already decided (calibrated above); this
  // pass decides WHO acted and what it looked like — crits from Accuracy,
  // rallies from Leadership, falters from Cowardice — attribution, not odds.
  const laneBattle = {};
  POS_KEYS.forEach(pos => {
    const seq = laneSequences[pos];
    const ps = positionScores[pos];
    const actors = [ps.primaryHero, ps.supportHero].filter(Boolean);
    const beats = [];
    let w=0, l=0;
    for(let i=0;i<seq.length;i++){
      const wonEx = seq[i];
      wonEx ? w++ : l++;
      const actor = actors.length ? (actors.length>1 && Math.random()<0.4 ? actors[1] : actors[0]) : null;
      let kind;
      if(wonEx){
        const prevLost = i>0 && !seq[i-1];
        const critChance = Math.min(0.5, (actor?.stats?.Accuracy||30)/160
          + (actor?.traits?.includes("Eagle Eye")?0.12:0)
          + (prevLost && actor?.traits?.includes("Berserker")?0.20:0));
        kind = prevLost && (actor?.stats?.Leadership||0)>=45 && Math.random()<0.5 ? "rally"
             : Math.random()<critChance ? "crit" : "hit";
      } else {
        kind = (actor?.traits?.includes("Coward") && Math.random()<0.4)
            || ((actor?.stats?.Composure||50)<30 && Math.random()<0.3) ? "falter" : "blocked";
      }
      const text = pick(EXCHANGE_TEXT[pos][kind]).replace(/\{A\}/g, actor ? actor.name.split(" ")[0].replace(/'/g,"") : "The line");
      beats.push({ won:wonEx, kind, actor:actor?.id??null, actorName:actor?actor.name.split(" ")[0]:null, actorRace:actor?.race??null, text });
      if(w===3 || l===3) break; // series clinched
    }
    // Attach injury markers to this lane's beats (visual attribution — the
    // injury roll itself is unchanged)
    actors.filter(h=>injuries.includes(h.id)).forEach(h=>{
      const lastLost = [...beats].reverse().find(b=>!b.won);
      const target = lastLost || beats[beats.length-1];
      if(target) target.injuryTo = h.name.split(" ")[0];
    });
    laneBattle[pos] = { beats, wins:beats.filter(b=>b.won).length, losses:beats.filter(b=>!b.won).length };
  });

  // Win swing computed once; loss swing is per-hero (scales with individual morale)
  const moraleSwing = won ? rand(6,10) : 0;
  const weakLinks = analyseWeakLinks(formation, analysis, enemy.tierId);

  // MVP: highest combat score hero in their position
  const starPerformer = allHeroes.reduce((best,h) => {
    const pos = POS_KEYS.find(p=>(formation[p]||[]).some(x=>x?.id===h.id));
    if(!pos) return best;
    const score = calcHeroCombatScore(h,pos);
    return (!best || score > best.score) ? {hero:h, pos, score:Math.round(score)} : best;
  }, null);

  // Top weak link: hero with most issues from analyseWeakLinks
  const topWeakLink = weakLinks.length > 0 ? weakLinks[0] : null;

  const summaryEvents = [];
  if(analysis.raceSynergy&&won) summaryEvents.push(`${analysis.raceSynergy.name}: ${analysis.raceSynergy.flavour}`);
  if(injuries.length) summaryEvents.push(`${injuries.length} hero(es) injured.`);
  if(hasBarracks) summaryEvents.push("Barracks: +20% XP");
  if(specPenalty) summaryEvents.push(`${enemy.specialisation.label}: ${specPenalty.reason} (enemy power +${Math.round(specPenalty.penalty*100)}%)`);
  if(!specPenalty && enemy.specialisation) summaryEvents.push(`Countered ${enemy.specialisation.label} — no power penalty`);
  abilityResults.forEach(({ability,outcome})=>{
    if(outcome==='pass') return;
    const effects = outcome==='soft' ? ability.softEffect : ability.hardEffect;
    const effectText = outcome==='soft' ? ability.softDesc() : ability.hardDesc();
    summaryEvents.push(`${ability.name}: ${effectText}`);
  });
  if(nightVisionHero&&nightBonus>0) summaryEvents.push(`${nightVisionHero.name}'s Night Vision shone in the darkness!`);
  if(won) allHeroes.filter(h=>h.traits?.includes("Berserker")&&POS_KEYS.find(p=>(formation[p]||[]).some(x=>x?.id===h.id))==="Vanguard")
    .forEach(h=>summaryEvents.push(`${h.name} went berserk — unstoppable in the vanguard!`));

  return {
    phases: phaseResults,
    won, goldSwing:Math.round(goldSwing), heroXP, injuries, moraleSwing,
    events: summaryEvents, winChance: overallWinChance, effective, analysis, allHeroes, weakLinks,
    specPenalty, adjustedEnemyPower, starPerformer, topWeakLink,
    phaseWinChances, phaseRolls, positionScores,
    laneBattle,
    abilityResults,
    enemy: enemy.name, enemyDiff: enemy.difficulty,
  };
}

// ─── RAID SIMULATION MODAL ────────────────────────────────────────────────────

const SIM_LANES = [
  { pos:"Vanguard",   icon:"", color:"#7E2D26" },
  { pos:"Skirmisher", icon:"", color:"#8A6D3B" },
  { pos:"Arbiter",    icon:"", color:"#3C5A78" },
];

function RaidSimulationModal({ simulation, enemy, onComplete }) {
  const [showDetails, setShowDetails] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [fast, setFast] = useState(false);

  // Flatten the exchange series into a playback script:
  // laneStart → beat… → verdict, per lane, then outcome.
  const steps = useMemo(()=>{
    if(!simulation) return [];
    const s=[];
    SIM_LANES.forEach((l,li)=>{
      s.push({type:"laneStart", lane:li});
      (simulation.laneBattle?.[l.pos]?.beats||[]).forEach((b,bi)=>s.push({type:"beat", lane:li, beat:bi}));
      s.push({type:"verdict", lane:li});
    });
    s.push({type:"outcome"});
    return s;
  },[simulation]);

  const done = steps.length===0 || stepIdx >= steps.length-1;

  useEffect(()=>{
    if(!simulation || done) return;
    const cur = steps[stepIdx];
    const delay = fast ? 220 : cur?.type==="laneStart" ? 750 : cur?.type==="verdict" ? 650 : 950;
    const t = setTimeout(()=>setStepIdx(i=>Math.min(steps.length-1, i+1)), delay);
    return ()=>clearTimeout(t);
  },[simulation, stepIdx, fast, steps, done]);

  if(!simulation) return null;

  const won = simulation.won;
  const outcomeCol = won ? "#40614F" : "#7E2D26";
  const injuredHeroes = simulation.allHeroes?.filter(h => simulation.injuries?.includes(h.id)) || [];

  // Tap once to speed up, tap again to jump to the verdict
  const skip = ()=>{ if(done) return; if(!fast) setFast(true); else setStepIdx(steps.length-1); };

  // Per-lane playback state derived from the step cursor
  const laneStates = SIM_LANES.map((l,li)=>{
    const startIdx   = steps.findIndex(s=>s.type==="laneStart"&&s.lane===li);
    const verdictIdx = steps.findIndex(s=>s.type==="verdict"&&s.lane===li);
    const beats = simulation.laneBattle?.[l.pos]?.beats||[];
    const visibleCount = beats.filter((b,bi)=>{
      const idx = steps.findIndex(s=>s.type==="beat"&&s.lane===li&&s.beat===bi);
      return idx>=0 && idx<=stepIdx;
    }).length;
    return {
      ...l,
      started:  startIdx>=0 && stepIdx>=startIdx,
      finished: verdictIdx>=0 && stepIdx>=verdictIdx,
      beats, visibleCount,
      won: simulation.phaseRolls?.[l.pos],
      series: simulation.laneBattle?.[l.pos],
      ps: simulation.positionScores?.[l.pos],
    };
  });
  const activeLane = laneStates.find(l=>l.started&&!l.finished);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(30,24,14,0.6)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(12px)"}}
      onClick={skip}>
      <div style={{width:"min(520px,96vw)",maxHeight:"92vh",overflowY:"auto",background:"#EFE7D3",border:"1px solid rgba(60,52,38,0.144)",borderRadius:3,overflow:"hidden auto",boxShadow:"0 2px 12px rgba(60,52,38,0.3)"}}>

        {/* Header */}
        <div style={{padding:"14px 18px",borderBottom:"1px solid rgba(60,52,38,0.09)",display:"flex",alignItems:"center",gap:10,background:"rgba(30,24,14,0.105)"}}>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'IM Fell English SC',serif",fontWeight:900,fontSize:15,color:"#23201A"}}>{enemy.name}</div>
            <div style={{fontSize:9,color:"#7A6F58",marginTop:1}}>Enemy Power {enemy.power} · {Math.round(simulation.winChance*100)}% projected</div>
          </div>
          {!done && (
            <div style={{fontSize:9,color:"#7A6F58",fontStyle:"italic"}}>{fast?"▸▸":"tap to speed up"}</div>
          )}
        </div>

        {/* Battle replay — lanes play out as exchange series */}
        <div style={{display:"flex",flexDirection:"column",gap:6,padding:"14px 18px 12px"}}>
          {laneStates.map((ls,li)=>{
            const isActive = activeLane?.pos===ls.pos && !done;
            const laneCol = !ls.started ? "#95896F" : (ls.finished||done) ? (ls.won?"#40614F":"#7E2D26") : ls.color;
            const shownBeats = (done?ls.beats:ls.beats.slice(0,ls.visibleCount));
            const w = shownBeats.filter(b=>b.won).length, lct = shownBeats.filter(b=>!b.won).length;
            // Momentum: walks with the shown beats, lands where the series landed
            const mom = shownBeats.reduce((a,b)=>a+(b.won?1:-1),0);
            const momPct = Math.max(10, Math.min(90, 50 + mom*13));
            const lastBeat = shownBeats[shownBeats.length-1];
            const posHeroes = [ls.ps?.primaryHero, ls.ps?.supportHero].filter(Boolean);

            // Compact row: pending, or already resolved
            if(!isActive || !(ls.started)){
              return (
                <div key={ls.pos} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 12px",borderRadius:3,
                  background:!ls.started?"rgba(60,52,38,0.036)":(ls.won?"rgba(64,97,79,0.075)":"rgba(126,45,38,0.075)"),
                  border:`1px solid ${!ls.started?"rgba(60,52,38,0.09)":(ls.won?"rgba(64,97,79,0.3)":"rgba(126,45,38,0.3)")}`,
                  opacity:!ls.started?0.45:1,transition:"all 0.3s"}}>
                  <PositionIcon position={ls.pos} size={12}/>
                  <span style={{fontSize:10,fontWeight:700,color:laneCol,fontFamily:"'Alegreya Sans',sans-serif",flex:1}}>{ls.pos.toUpperCase()}</span>
                  {(ls.finished||done)&&ls.series?(
                    <>
                      <span style={{fontSize:10,color:"#6E6350"}}>{ls.series.wins}–{ls.series.losses}</span>
                      <span style={{fontSize:10,fontWeight:700,color:ls.won?"#40614F":"#7E2D26"}}>{ls.won?"✓ WON":"✗ LOST"}</span>
                    </>
                  ):(
                    <span style={{fontSize:10,color:"#8A7F68"}}>…</span>
                  )}
                </div>
              );
            }

            // Active lane: the clash
            return (
              <div key={ls.pos} style={{borderRadius:3,border:`1px solid ${ls.color}44`,background:`${ls.color}08`,padding:"10px 12px",transition:"all 0.3s"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <PositionIcon position={ls.pos} size={13}/>
                  <span style={{fontSize:11,fontWeight:700,color:ls.color,fontFamily:"'Alegreya Sans',sans-serif",flex:1}}>{ls.pos.toUpperCase()}</span>
                  <span style={{fontSize:11,fontWeight:700,color:"#23201A"}}>{w}–{lct}</span>
                </div>

                {/* The clash: your heroes vs their banner */}
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <div style={{display:"flex",gap:5,flex:1}}>
                    {posHeroes.map(h=>{
                      const acting = lastBeat && lastBeat.actor===h.id;
                      return (
                        <div key={h.id}
                          style={{display:"flex",alignItems:"center",gap:4,padding:"4px 8px",borderRadius:3,
                            background:acting?`${ls.color}22`:"rgba(60,52,38,0.072)",
                            border:`1px solid ${acting?ls.color+"66":"rgba(60,52,38,0.144)"}`,
                            animation:acting?"rmLunge 0.5s ease":"none"}}>
                          <HeroAvatar race={h.race} size={13}/>
                          <span style={{fontSize:9,color:acting?"#23201A":"#6E6350",fontWeight:acting?700:400}}>{h.name.split(" ")[0]}</span>
                        </div>
                      );
                    })}
                  </div>
                  <span style={{fontSize:9,color:"#7A6F58"}}>vs</span>
                  <div style={{display:"flex",alignItems:"center",gap:4,padding:"4px 8px",borderRadius:3,background:"rgba(126,45,38,0.09)",border:"1px solid rgba(126,45,38,0.27)"}}>
                    <span style={{fontSize:11}}>{enemy.specialisation?.icon||""}</span>
                    <span style={{fontSize:9,color:"#8A5A44"}}>{enemy.name?.split(" ").slice(0,2).join(" ")}</span>
                  </div>
                </div>

                {/* Momentum bar */}
                <div style={{height:5,borderRadius:3,background:"rgba(126,45,38,0.375)",overflow:"hidden",marginBottom:8}}>
                  <div style={{height:"100%",width:`${momPct}%`,background:"#3C5A78",borderRadius:3,transition:"width 0.45s ease"}}/>
                </div>

                {/* Beat feed */}
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  {shownBeats.map((b,bi)=>(
                    <div key={bi} style={{fontSize:11,lineHeight:1.5,color:b.won?"#40614F":"#96473C",paddingLeft:14,textIndent:-14,animation:bi===shownBeats.length-1?"fadeIn 0.35s ease":"none"}}>
                      <span style={{color:b.won?"#40614F":"#7E2D26",fontWeight:700}}>{b.won?"⊕":"⊖"}</span>{" "}
                      {b.kind==="crit"&&<span style={{fontFamily:"'IM Fell English SC',serif",color:"#8A6D3B",fontWeight:700,letterSpacing:0.5}}>A Telling Blow — </span>}
                      {b.kind==="rally"&&<span style={{fontFamily:"'IM Fell English SC',serif",color:"#3C5A78",fontWeight:700,letterSpacing:0.5}}>The Rally — </span>}
                      {b.kind==="falter"&&<span style={{fontFamily:"'IM Fell English SC',serif",color:"#96473C",fontWeight:700,letterSpacing:0.5}}>A Faltering — </span>}
                      {b.text}
                      {b.injuryTo&&<div style={{color:"#7E2D26",fontSize:9.5,fontStyle:"italic",marginTop:1}}>— {b.injuryTo} is hurt in the exchange —</div>}
                    </div>
                  ))}
                </div>

                {/* Grudge interjection at the mid-battle lull */}
                {li===1&&enemy.manager&&shownBeats.length===0&&(
                  <div style={{fontSize:9,color:"#6E6350",fontStyle:"italic"}}>“{managerTaunt(enemy.manager, enemy.h2h)}” — {enemy.manager.name}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Outcome card */}
        <div style={{padding:"0 18px 16px",transition:"all 0.5s",opacity:done?1:0,transform:done?"translateY(0)":"translateY(12px)"}}>
          <div style={{borderRadius:3,border:`1px solid ${outcomeCol}33`,background:`${outcomeCol}08`,padding:"14px 16px"}}>

            {/* Result — stamped verdict; mounts on done so the stamp lands */}
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              {done&&(
                <span className={won?"rm-stamp":"rm-stamp rm-stamp-loss"} style={{fontSize:20}}>
                  {won?"Victory":"Defeat"}
                </span>
              )}
              <div style={{flex:1}}/>
              {/* Phase summary pips */}
              <div style={{display:"flex",gap:4}}>
                {SIM_LANES.map(({pos})=>{
                  const pw = simulation.phases?.find(p=>p.pos===pos)?.won;
                  return <div key={pos} style={{width:8,height:8,borderRadius:"50%",background:pw?"#40614F":"#7E2D26"}}/>;
                })}
              </div>
            </div>

            {/* Stats row */}
            <div style={{display:"flex",gap:10,marginBottom:injuredHeroes.length>0?10:0}}>
              {won && (
                <div style={{flex:1,padding:"8px 10px",borderRadius:3,background:"rgba(138,109,59,0.09)",border:"1px solid rgba(138,109,59,0.225)",textAlign:"center"}}>
                  <div style={{fontSize:9,color:"#6E6350",marginBottom:2}}>Gold</div>
                  <div style={{fontSize:16,fontWeight:700,color:"#8A6D3B"}}>+{simulation.goldSwing?.toLocaleString()}g</div>
                </div>
              )}
              <div style={{flex:1,padding:"8px 10px",borderRadius:3,background:"rgba(95,75,102,0.09)",border:"1px solid rgba(95,75,102,0.225)",textAlign:"center"}}>
                <div style={{fontSize:9,color:"#6E6350",marginBottom:2}}>XP</div>
                <div style={{fontSize:16,fontWeight:700,color:"#5F4B66"}}>+{simulation.heroXP}</div>
              </div>
              {simulation.abilityResults?.some(r=>r.outcome!=="pass")&&(
                <div style={{flex:1,padding:"8px 10px",borderRadius:3,background:"rgba(154,91,43,0.09)",border:"1px solid rgba(154,91,43,0.3)",textAlign:"center"}}>
                  <div style={{fontSize:9,color:"#6E6350",marginBottom:2}}>Ability</div>
                  <div style={{fontSize:11,fontWeight:700,color:"#9A5B2B"}}>Effect</div>
                </div>
              )}
            </div>

            {/* Injuries */}
            {injuredHeroes.length > 0 && (
              <div style={{padding:"8px 10px",borderRadius:3,background:"rgba(126,45,38,0.09)",border:"1px solid rgba(126,45,38,0.3)"}}>
                <div style={{fontSize:10,fontWeight:700,color:"#7E2D26",marginBottom:3}}>Injured</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {injuredHeroes.map(h=>(
                    <div key={h.id} style={{fontSize:9,color:"#9A5B2B",padding:"2px 6px",borderRadius:3,background:"rgba(126,45,38,0.15)",border:"1px solid rgba(126,45,38,0.3)"}}>
                      <HeroAvatar race={h.race} size={14}/> {h.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Details section (opt-in) */}
        {showDetails && (
          <div style={{borderTop:"1px solid rgba(60,52,38,0.09)",padding:"12px 18px",maxHeight:220,overflowY:"auto"}}>
            {/* Phase breakdown */}
            <div style={{fontSize:10,color:"#6E6350",fontWeight:700,letterSpacing:1,marginBottom:8}}>PHASE BREAKDOWN</div>
            {SIM_LANES.map(({pos,icon,color})=>{
              const phaseResult = simulation.phases?.find(p=>p.pos===pos);
              const ps = simulation.positionScores?.[pos];
              const phaseWon = phaseResult?.won;
              const wc = simulation.phaseWinChances?.[pos];
              return(
                <div key={pos} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,padding:"6px 8px",borderRadius:3,background:"rgba(60,52,38,0.036)",border:`1px solid ${phaseWon?"rgba(64,97,79,0.15)":"rgba(126,45,38,0.15)"}`}}>
                  <span style={{fontSize:11}}>{icon}</span>
                  <span style={{fontSize:10,fontWeight:700,color,flex:1,fontFamily:"'Alegreya Sans',sans-serif"}}>{pos}</span>
                  {ps?.pairingMult>1&&<span style={{fontSize:9,color:"#8A6D3B"}}></span>}
                  <span style={{fontSize:9,color:"#6E6350"}}>{wc?Math.round(wc*100)+"% win chance":""}</span>
                  <span style={{fontSize:10,fontWeight:700,color:phaseWon?"#40614F":"#7E2D26"}}>{phaseWon?"✓ Won":"✗ Lost"}</span>
                </div>
              );
            })}

            {/* Ability effects */}
            {simulation.abilityResults?.some(r=>r.outcome!=="pass")&&(
              <div style={{marginTop:10}}>
                <div style={{fontSize:10,color:"#6E6350",fontWeight:700,letterSpacing:1,marginBottom:6}}>ABILITY EFFECTS</div>
                {simulation.abilityResults.filter(r=>r.outcome!=="pass").map(({ability,outcome},i)=>(
                  <div key={i} style={{fontSize:9,color:"#9A5B2B",marginBottom:3}}>
                    {ability.name} — {outcome==="soft"?ability.softDesc():ability.hardDesc()}
                  </div>
                ))}
              </div>
            )}

            {/* Race synergy */}
            {simulation.analysis?.raceSynergy&&(
              <div style={{marginTop:10,fontSize:9,color:simulation.analysis.raceSynergy.color}}>
                {simulation.analysis.raceSynergy.name} (×{simulation.analysis.raceSynergy.ratingMult}) active
              </div>
            )}

            {/* Weak links */}
            {simulation.weakLinks?.length>0&&(
              <div style={{marginTop:10}}>
                <div style={{fontSize:10,color:"#8A6D3B",fontWeight:700,letterSpacing:1,marginBottom:6}}>WEAK LINKS</div>
                {simulation.weakLinks.slice(0,3).map((link,i)=>(
                  <div key={i} style={{fontSize:9,color:"#4A4335",marginBottom:3}}>
                    <HeroAvatar race={link.hero.race} size={13}/> {link.hero.name} — {link.issues[0]?.reason}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{padding:"12px 18px",borderTop:"1px solid rgba(60,52,38,0.09)",display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(30,24,14,0.07)"}}>
          {done?(
            <>
              <button onClick={(e)=>{e.stopPropagation();setShowDetails(d=>!d);}} style={{padding:"7px 14px",borderRadius:3,border:"1px solid rgba(60,52,38,0.22)",cursor:"pointer",background:"rgba(60,52,38,0.072)",color:"#6E6350",fontSize:11,fontFamily:"'Alegreya Sans',sans-serif"}}>
                {showDetails?"Hide Details":"Show Details"}
              </button>
              <button onClick={(e)=>{e.stopPropagation();onComplete();}} style={{padding:"9px 24px",borderRadius:3,border:"none",cursor:"pointer",background:`${won?"#40614F":"#9A5B2B"}`,color:"#F0E8D5",fontFamily:"'Alegreya Sans',sans-serif",fontWeight:900,fontSize:13}}>
                Continue →
              </button>
            </>
          ):(
            <div style={{fontSize:11,color:"#6E6350",fontStyle:"italic"}}>The battle unfolds…</div>
          )}
        </div>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
@keyframes rmLunge{0%{transform:translateX(0)}35%{transform:translateX(7px)}100%{transform:translateX(0)}}`}</style>
    </div>
  );
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

// ─── ICON / AVATAR COMPONENTS ────────────────────────────────────────────────
// Engraved single-ink stroke glyphs — one path per mark, 24×24 grid.
// Replaces the emoji icon system (and the old golden filled SVGs).

const GLYPH_PATHS = {
  // races — heraldic marks, not portraits
  race_human:      "M6 4h12v7c0 5-4 8-6 9-2-1-6-4-6-9z",
  race_elf:        "M5 19C5 10 12 4 20 4c0 9-7 15-15 15zM5 19c4-4 9-9 15-15",
  race_dwarf:      "M5 5h11v6H5zM10 11v10M16 6.5h4",
  race_half_orc:   "M5 19h14M8 19V9c0-3 1.5-5 1.5-5M16 19V9c0-3-1.5-5-1.5-5",
  race_gnome:      "M12 8.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 1 0 0-9M12 5v3.5M12 17.5V21M5 13h2.5M16.5 13H19M12 11.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 1 0 0-3",
  race_tiefling:   "M6 21c0-5 2.5-8 6-8s6 3 6 8M8 13C5 11 4 7 5 3c2 2 3.5 4.5 3.5 8M16 13c3-2 4-6 3-10-2 2-3.5 4.5-3.5 8",
  race_dragonborn: "M12 21c-3.5 0-6-2.5-6-6 0-4 3-5 3-9 2 2 3 3.5 3 5.5 1-1 2-3 2-5 3 3 4 5.5 4 8.5 0 3.5-2.5 6-6 6z",
  // roles
  role_warrior:  "M4 20L17 7M17 7l3-3M14 4l6 6M7 17l-3 3M5 15l4 4",
  role_ranger:   "M6 4c6 2 6 14 0 16M6 4v16M6 12h12M15 9l3 3-3 3",
  role_mage:     "M12 22V9M12 8.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 1 0 0 7M6 11l2.5 1.5M18 11l-2.5 1.5",
  role_rogue:    "M12 3L9.5 12h5zM12 12v9M9 15h6",
  role_cleric:   "M12 4v16M7 9h10M9 20h6",
  role_paladin:  "M6 4h12v7c0 5-4 8-6 9-2-1-6-4-6-9zM12 7v8M9 10.5h6",
  // positions
  pos_vanguard:   "M5 4l15 15M19 4L4 19M8 3L3 8M21 16l-5 5",
  pos_skirmisher: "M3 12h15M14 7l5 5-5 5M3 8v8",
  pos_arbiter:    "M6 21V3M6 4h12l-3 4 3 4H6",
  // tiers — chevrons climb, then coronets
  tier_iron:     "M6 15l6-5 6 5",
  tier_bronze:   "M6 12l6-5 6 5M6 17l6-5 6 5",
  tier_silver:   "M6 9.5l6-5 6 5M6 14.5l6-5 6 5M6 19.5l6-5 6 5",
  tier_gold:     "M5 18h14l1.5-9-4.5 3.5L12 6l-4 6.5L3.5 9zM5 21h14",
  tier_platinum: "M5 18h14l1.5-9-4.5 3.5L12 6l-4 6.5L3.5 9zM5 21h14M12 12.5l1 2h-2z",
  // nav
  nav_squad:    "M9 4.5a3 3 0 1 0 0 6 3 3 0 1 0 0-6M4 20c0-4 2-6.5 5-6.5s5 2.5 5 6.5M16.5 7a2.5 2.5 0 1 0 0 5M15 13.8c2.8.3 4.5 2.6 4.5 6.2",
  nav_tactics:  "M4 4h16v16H4zM4 12h16M12 4v16M8 8l2 2M16 14l-2 2",
  nav_battle:   "M5 4l15 15M19 4L4 19M8 3L3 8M21 16l-5 5",
  nav_dominion: "M7 3C4.5 8 4.5 14 8 19M17 3c2.5 5 2.5 11-1 16M7 7l-2.5-1M8 12l-3 0M17 7l2.5-1M16 12l3 0",
  nav_town:     "M6 21V9l-2 1V7l8-4 8 4v3l-2-1v12M10 21v-5h4v5",
  nav_hire:     "M20 4c-6 0-11 4-13 10l-3 6M6 15c3 1 6 0 8-2M4 20l3-6",
  nav_ledger:   "M4 5c3-1.5 5-1.5 8 0 3-1.5 5-1.5 8 0v14c-3-1.5-5-1.5-8 0-3-1.5-5-1.5-8 0zM12 5v14",
  nav_guide:    "M7 3h11v14c0 2-1 3-3 3H6c-1.8 0-2.8-2.6 0-3h9M7 3C5.5 3 5 4 5 5.5V17",
  // buildings
  bld_barracks:  "M5 21V8h3V5h2.5v3h3V5H16v3h3v13M10 21v-4h4v4",
  bld_tavern:    "M6 7h9v13H6zM15 10h3.5c1 0 1 5 0 5H15M6 7c1.5-2 7.5-2 9 0",
  bld_infirmary: "M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z",
  bld_lodge:     "M4 12l8-8 8 8M6 11v9h12v-9M9 20v-5h6v5",
  bld_trainyard: "M12 4a8 8 0 1 0 0 16 8 8 0 1 0 0-16M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 1 0 0-7M12 11a1 1 0 1 0 0 2 1 1 0 1 0 0-2",
  bld_network:   "M2 12c3-5 6.5-7 10-7s7 2 10 7c-3 5-6.5 7-10 7s-7-2-10-7zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 1 0 0-5",
  bld_trading:   "M12 3v18M5 6l7-2 7 2M5 6L2.5 12c0 2 5 2 5 0zM19 6l-2.5 6c0 2 5 2 5 0zM8 21h8",
  bld_bazaar:    "M3 20L12 5l9 15zM7.5 20L12 12l4.5 8M12 5V2l3 1-3 1.2",
  bld_scouts:    "M3 17l10-7 3 4.5L6 21zM13 10l3 4.5M18.5 4v4M16.5 6h4",
  bld_sanctum:   "M7 4h10l4 5-9 11L3 9zM3 9h18M7 4l5 5 5-5M12 20L7 9M12 20l5-11",
  bld_legends:   "M5 4h14M5 20h14M8 4v16M12 4v16M16 4v16M4 4h16",
  // status — squad leader's coronet
  leader:        "M5 17L7 9 9.5 12 12 7 14.5 12 17 9 19 17M5 17h14",
};

function Glyph({ id, size = 16, color = "#23201A", style }) {
  const d = GLYPH_PATHS[id];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="1.7" strokeLinecap="square" strokeLinejoin="miter"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}>
      <path d={d} />
    </svg>
  );
}

function HeroAvatar({ race, size=20 }) {
  const cfg = VISUAL_CONFIG.races[race];
  return <Glyph id={`race_${cfg?.key||"human"}`} size={size}/>;
}
function RoleIcon({ role, size=14 }) {
  const cfg = VISUAL_CONFIG.roles[role];
  return <Glyph id={`role_${cfg?.key||"warrior"}`} size={size}/>;
}
function PositionIcon({ position, size=16 }) {
  const cfg = VISUAL_CONFIG.positions[position];
  return <Glyph id={`pos_${cfg?.key||"vanguard"}`} size={size}/>;
}
function TierIcon({ tier, size=16 }) {
  const cfg = VISUAL_CONFIG.tiers[tier];
  return <Glyph id={cfg?.key||"tier_iron"} size={size}/>;
}
function BuildingIcon({ id, size=20 }) {
  const cfg = VISUAL_CONFIG.buildings[id];
  return <Glyph id={`bld_${cfg?.key||"barracks"}`} size={size}/>;
}
function NavIcon({ tab, size=18 }) {
  const cfg = VISUAL_CONFIG.nav[tab];
  return <Glyph id={cfg?.key||"nav_squad"} size={size}/>;
}

function StatBar({label,value,prev,base,max=99,highlight,dimmed}){
  const pct=(value/max)*100, gain=prev!==undefined?value-prev:0;
  const col=dimmed?"#8A7F68":value>=80?"#40614F":value>=60?"#3C5A78":value>=40?"#8A6D3B":"#7E2D26";
  const hasGrowth = base!==undefined && value > base;
  const basePct = base!==undefined ? (base/max)*100 : null;
  const growthPct = hasGrowth ? ((value-base)/max)*100 : 0;
  return(
    <div style={{marginBottom:5,opacity:dimmed?0.45:1}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:2}}>
        <span style={{color:highlight?"#8A6D3B":"#4A4335"}}>{label}</span>
        <span style={{display:"flex",gap:5,alignItems:"center"}}>
          {gain!==0&&!hasGrowth&&<span style={{fontSize:9,color:gain>0?"#40614F":"#7E2D26",fontWeight:700}}>{gain>0?"+":""}{gain}</span>}
          {hasGrowth&&<span style={{fontSize:9,color:"#40614F",fontWeight:700}}>+{value-base}</span>}
          <span style={{fontWeight:700,color:col}}>{value}</span>
        </span>
      </div>
      <div style={{height:4,background:"#DFD3B8",borderRadius:2,overflow:"hidden",position:"relative"}}>
        {basePct!==null ? (
          <>
            <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${basePct}%`,background:"#C9BA98",borderRadius:2}}/>
            {hasGrowth&&<div style={{position:"absolute",left:`${basePct}%`,top:0,height:"100%",width:`${growthPct}%`,background:"#40614F",borderRadius:2,transition:"width 0.5s"}}/>}
          </>
        ) : (
          <div style={{height:"100%",width:`${pct}%`,background:col,borderRadius:2,transition:"width 0.5s"}}/>
        )}
      </div>
    </div>
  );
}

function XPBar({xp,level}){
  const cur=xp-xpForLevel(level),need=xpForLevel(level+1)-xpForLevel(level);
  const pct=level>=MAX_LEVEL?100:Math.min(100,(cur/need)*100);
  return(
    <div style={{marginBottom:6}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:2}}>
        <span style={{color:"#5F4B66"}}>Lv {level}{level<MAX_LEVEL?` · ${cur}/${need} XP`:" · MAX (Lv15)"}</span>
        <span style={{color:"#6E6350",fontSize:9}}>{xp} XP</span>
      </div>
      <div style={{height:4,background:"#DFD3B8",borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background:"#5F4B66",borderRadius:3,transition:"width 0.5s"}}/>
      </div>
    </div>
  );
}

function ContractBar({hero}){
  const total=hero.contractYears*WEEKS_PER_CONTRACT_YEAR;
  const left=hero.contractWeeksLeft||0;
  const pct=Math.max(0,(left/total)*100);
  const col=left<=WEEKS_PER_CONTRACT_YEAR?"#7E2D26":left<=WEEKS_PER_CONTRACT_YEAR*2?"#8A6D3B":"#40614F";
  const seasonsLeft=(left/WEEKS_PER_CONTRACT_YEAR).toFixed(1);
  return(
    <div style={{marginBottom:6}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:2}}>
        <span style={{color:col}}>Contract: {seasonsLeft} season{parseFloat(seasonsLeft)!==1?"s":""} left</span>
        {hero.refusesToSign
          ? <span style={{fontSize:9,color:"#7E2D26",fontWeight:700}}>{(hero.contractWeeksLeft||0)<=0?"DEPARTING THIS WEEK":`DEPARTING · ${hero.contractWeeksLeft}W`}</span>
          : hero.negotiationPending&&<span style={{fontSize:9,color:"#9A5B2B",fontWeight:700,animation:"pulse 1s infinite"}}>RENEWAL PENDING</span>}
      </div>
      <div style={{height:4,background:"#DFD3B8",borderRadius:2,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background:`${col}`,borderRadius:2,transition:"width 0.5s"}}/>
      </div>
    </div>
  );
}

function AgeBar({hero}){
  const stage = hero.stage || "peak";
  const progress = Math.round(hero.stageProgress || 0);
  const phaseCol = agePhaseColor(stage);
  const careerWk = stageToCareerWeek(stage, progress);
  const careerPct = Math.min(100, (careerWk / TOTAL_CAREER_WEEKS) * 100);

  // Stage boundary markers as % of total career
  const stageBoundaries = [];
  let wk = 0;
  STAGE_ORDER.slice(0,-1).forEach(s => {
    wk += STAGE_DEFS[s].weeks;
    stageBoundaries.push((wk / TOTAL_CAREER_WEEKS) * 100);
  });

  // Colour bands per stage
  const stageCols = { prospect:"#5F4B66", rising:"#3C5A78", peak:"#40614F", fading:"#8A6D3B", veteran:"#9A5B2B" };

  return(
    <div style={{marginBottom:6}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:2}}>
        <span style={{color:phaseCol,fontWeight:600}}>{agePhaseLabel(stage)}</span>
        <span style={{color:"#6E6350",fontSize:9}}>{progress}% through stage · {(((TOTAL_CAREER_WEEKS - careerWk)/42)).toFixed(1)}s remaining</span>
      </div>
      {/* Full career bar with coloured stage segments */}
      <div style={{height:5,background:"#DFD3B8",borderRadius:3,overflow:"hidden",position:"relative",display:"flex"}}>
        {STAGE_ORDER.map(s => {
          const sw = STAGE_DEFS[s].weeks;
          const segPct = (sw / TOTAL_CAREER_WEEKS) * 100;
          const isActive = s === stage;
          const isPast = STAGE_ORDER.indexOf(s) < STAGE_ORDER.indexOf(stage);
          const alpha = isPast ? "88" : isActive ? "ff" : "22";
          return(
            <div key={s} style={{
              width:`${segPct}%`, height:"100%",
              background: stageCols[s] + alpha,
              borderRight: "1px solid rgba(30,24,14,0.105)",
              position:"relative",
              flexShrink:0,
            }}>
              {isActive && (
                <div style={{
                  position:"absolute", top:0, left:0,
                  width:`${progress}%`, height:"100%",
                  background: stageCols[s],
                  borderRadius: "0 2px 2px 0",
                }}/>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── WEEKLY SUMMARY ──────────────────────────────────────────────────────────

function LegacyCeremony({data, townName, townColor, onPlayOn, onNewLegacy}){
  if(!data) return null;
  const {season, wins, losses, tier, topSynergy, newlyEarned=[], allBoons=[], chronicle, defeat, defeatReason} = data;
  const winPct = (wins+losses)>0 ? Math.round(wins/(wins+losses)*100) : 0;

  const narrativeParts = [];
  if(chronicle){
    const c = chronicle;
    if(defeat){
      narrativeParts.push(defeatReason==="bankruptcy"
        ? `After ${c.totalSeasons} season${c.totalSeasons>1?"s":""}, the coffers of ${townName} ran dry and the banners came down.`
        : `After ${c.totalSeasons} season${c.totalSeasons>1?"s":""}, ${townName} laid down its arms and walked away from the campaign.`);
    } else {
      narrativeParts.push(`In ${c.totalSeasons} season${c.totalSeasons>1?"s":""}, ${townName} climbed from Iron to conquer the Platinum League.`);
    }
    if(c.totalRaids>0) narrativeParts.push(`You won ${c.totalWins} of ${c.totalRaids} battles across the campaign.`);
    if(c.builtCount>0) narrativeParts.push(`${c.builtCount} building${c.builtCount>1?"s were":"was"} constructed to strengthen your realm.`);
    if(c.biggestUpset) narrativeParts.push(`Your greatest upset came against ${c.biggestUpset.enemy} at just ${Math.round(c.biggestUpset.winChance*100)}% win chance in Season ${c.biggestUpset.season}.`);
    if(c.longestStreak?.count>=3) narrativeParts.push(`A ${c.longestStreak.count}-battle winning streak in Season ${c.longestStreak.season} will be remembered.`);
  }

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(30,24,14,0.6)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(10px)",overflowY:"auto",padding:"16px 0"}}>
      <div style={{background:"#E9E1CE",border:"1px solid rgba(138,109,59,0.55)",borderRadius:3,maxWidth:520,width:"92%",overflow:"hidden",boxShadow:"0 2px 12px rgba(60,52,38,0.3)"}}>

        {/* Header */}
        <div style={{padding:"28px 28px 18px",textAlign:"center",background:"linear-gradient(180deg,rgba(138,109,59,0.12),transparent)"}}>
          <div style={{fontSize:40,marginBottom:8}}>{defeat?"":""}</div>
          <div style={{fontFamily:"'IM Fell English SC',serif",fontWeight:900,fontSize:22,color:defeat?"#9A5B2B":"#8A6D3B",marginBottom:4}}>
            {defeat?"The Campaign Ends":"A Legend is Born"}
          </div>
          <div style={{fontSize:13,color:"#6E6350"}}>{defeat
            ? (defeatReason==="bankruptcy"?`${townName} has fallen into ruin`:`${townName} has abandoned the campaign`)
            : `${townName} has conquered the Platinum League`}</div>
        </div>

        <div style={{padding:"0 24px 24px"}}>
          {/* Season stats */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
            {[
              ["Seasons played", season, "#23201A"],
              ["Win rate", `${winPct}% · ${wins}W/${losses}L`, "#40614F"],
            ].map(([label,val,col])=>(
              <div key={label} style={{padding:"10px 8px",borderRadius:3,background:"rgba(60,52,38,0.072)",border:"1px solid rgba(60,52,38,0.144)",textAlign:"center"}}>
                <div style={{fontSize:11,fontWeight:700,color:col}}>{val}</div>
                <div style={{fontSize:9,color:"#6E6350",marginTop:2}}>{label}</div>
              </div>
            ))}
          </div>

          {topSynergy&&(
            <div style={{padding:"10px 14px",borderRadius:3,background:`${topSynergy.color}10`,border:`1px solid ${topSynergy.color}30`,marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:20}}>{topSynergy.icon}</span>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:topSynergy.color}}>Signature: {topSynergy.name}</div>
                <div style={{fontSize:9,color:"#6E6350"}}>Your most-used formation synergy</div>
              </div>
            </div>
          )}

          {/* Final Chronicle */}
          {narrativeParts.length>0&&(
            <div style={{padding:"12px 14px",borderRadius:3,background:"rgba(138,109,59,0.06)",border:"1px solid rgba(138,109,59,0.225)",marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:700,color:"#8A6D3B",marginBottom:8,fontFamily:"'Alegreya Sans',sans-serif",letterSpacing:0.5}}>THE CHRONICLE OF {townName.toUpperCase()}</div>
              {narrativeParts.map((p,i)=>(
                <p key={i} style={{margin:"0 0 5px",fontSize:11,color:"#6E6350",lineHeight:1.6}}>{p}</p>
              ))}
              {chronicle?.starPlayer&&(
                <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid rgba(138,109,59,0.15)",display:"flex",alignItems:"center",gap:8}}>
                  <HeroAvatar race={chronicle.starPlayer.race} size={16}/>
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:"#23201A"}}>{chronicle.starPlayer.name}</div>
                    <div style={{fontSize:9,color:"#6E6350"}}>{chronicle.starPlayer.role} · {chronicle.starPlayer.pos} · PWR {chronicle.starPlayer.pwr} · Lv {chronicle.starPlayer.level} — your finest warrior</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Achievements earned */}
          {newlyEarned.length>0&&(
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:700,color:"#8A6D3B",marginBottom:8,letterSpacing:0.5}}>ACHIEVEMENTS EARNED</div>
              {newlyEarned.map(id=>{
                const a=ACHIEVEMENTS.find(x=>x.id===id);
                if(!a) return null;
                return(
                  <div key={id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:3,background:"rgba(138,109,59,0.09)",border:"1px solid rgba(138,109,59,0.3)",marginBottom:5}}>
                    <span style={{fontSize:18}}>{a.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,fontWeight:700,color:"#8A6D3B"}}>{a.name}</div>
                      <div style={{fontSize:9,color:"#6E6350"}}>{a.boon?.desc||""}</div>
                    </div>
                    <span style={{fontSize:9,color:"#40614F",background:"rgba(64,97,79,0.15)",padding:"2px 7px",borderRadius:3}}>Unlocked</span>
                  </div>
                );
              })}
            </div>
          )}

          {allBoons.length>0&&(
            <div style={{padding:"10px 14px",borderRadius:3,background:"rgba(60,90,120,0.075)",border:"1px solid rgba(60,90,120,0.3)",marginBottom:16,fontSize:10,color:"#3C5A78"}}>
              <b>{allBoons.length} game option{allBoons.length>1?"s":""}</b> unlocked — available when founding your next realm.
            </div>
          )}

          <div style={{display:"flex",gap:10}}>
            <button onClick={onPlayOn}
              style={{flex:1,padding:"11px 0",borderRadius:3,border:"1px solid rgba(60,52,38,0.264)",background:"rgba(60,52,38,0.072)",color:"#6E6350",cursor:"pointer",fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:12}}>
              Continue Playing
            </button>
            <button onClick={()=>onNewLegacy(allBoons)}
              style={{flex:2,padding:"11px 0",borderRadius:3,border:"none",background:"#9A5B2B",color:"#F0E8D5",cursor:"pointer",fontFamily:"'Alegreya Sans',sans-serif",fontWeight:900,fontSize:12}}>
              Found a New Realm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeeklySummary({summary, onDismiss, townColor}){
  useEscapeKey(onDismiss, !!summary);
  if(!summary) return null;
  const {won,enemy,enemyDiff,enemyPower,playerTier:summaryTier,winChance,goldGain,wages,tribute,heroXP,levelUps,injuries,exhausted,nextOpp,week,topWeakLink,effective,adjustedEnemyPower,phaseWinChances,phaseRolls} = summary;
  const netGold = goldGain - wages + tribute;
  const netCol = netGold>=0?"#40614F":"#7E2D26";
  const oppStars = calcRelativeStars(enemyPower||0, summaryTier||"iron");
  const diffStars = renderStars(oppStars);
  const diffStarCol = starsColor(oppStars);
  const nextOppStars = nextOpp ? calcRelativeStars(nextOpp.power||0, summaryTier||"iron") : 0;
  const nextDiffStars = nextOpp ? renderStars(nextOppStars) : "";

  const isUpset    = won  && winChance < 0.30;
  const isMiracle  = won  && winChance < 0.15;
  const isDominant = won  && winChance > 0.85;
  const isShock    = !won && winChance > 0.75;

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(30,24,14,0.525)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)"}}>
      <div style={{width:"min(440px,92vw)",maxHeight:"90vh",overflowY:"auto",background:"#EFE7D3",border:`1px solid ${won?"rgba(64,97,79,0.45)":"rgba(126,45,38,0.375)"}`,borderRadius:3,overflow:"hidden",boxShadow:`0 0 60px ${won?"rgba(64,97,79,0.105)":"rgba(126,45,38,0.105)"}`}}>

        {/* Outcome banner */}
        <div style={{padding:"14px 20px",background:won?"rgba(64,97,79,0.12)":"rgba(126,45,38,0.12)",borderBottom:"1px solid rgba(60,52,38,0.108)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{marginBottom:3}}>
                <span className={won?"rm-stamp":"rm-stamp rm-stamp-loss"} style={{fontSize:15}}>
                  {isMiracle?"Against All Odds":isUpset?"Upset Victory":isDominant?"A Rout":isShock?"Stunned":won?"Victory":"Defeat"}
                </span>
              </div>
              <div style={{fontSize:10,color:won?"#40614F":"#9A5B2B",marginTop:1,fontStyle:"italic"}}>
                {isMiracle?"They'll sing about this one. Nobody gave you a chance.":
                 isUpset?"The bookmakers of the realm are in mourning.":
                 isDominant?"They came, they saw, they were escorted out.":
                 isShock?"You were meant to win this. The silence in camp says everyone knows it.":
                 won?"The banners fly a little higher tonight.":
                 "Lick the wounds, learn the lesson."}
              </div>
              <div style={{fontSize:11,color:"#6E6350",marginTop:2}}>vs {enemy} <span style={{color:diffStarCol}}>{diffStars}</span> · Week {week}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:9,color:"#6E6350"}}>Overall win chance</div>
              <div style={{fontSize:16,fontWeight:700,color:won?"#40614F":"#9A5B2B"}}>{Math.round(winChance*100)}%</div>
              {adjustedEnemyPower&&effective&&(
                <div style={{fontSize:9,color:"#6E6350"}}>{effective} vs {adjustedEnemyPower}</div>
              )}
            </div>
          </div>
        </div>

        <div style={{padding:"14px 20px"}}>

          {/* Phase breakdown — the heart of the debrief */}
          {phaseWinChances&&phaseRolls&&(
            <div style={{marginBottom:14}}>
              <div style={{fontSize:9,color:"#6E6350",fontWeight:700,letterSpacing:1,marginBottom:6}}>PHASE BREAKDOWN</div>
              <div style={{display:"flex",gap:6}}>
                {[
                  {pos:"Vanguard",   icon:"", label:"VAN"},
                  {pos:"Skirmisher", icon:"", label:"SKR"},
                  {pos:"Arbiter",    icon:"", label:"ARB"},
                ].map(({pos,icon,label})=>{
                  const pWon = phaseRolls[pos];
                  const pChance = phaseWinChances[pos];
                  const col = pWon?"#40614F":"#7E2D26";
                  return(
                    <div key={pos} style={{flex:1,padding:"9px 8px",borderRadius:3,
                      background:pWon?"rgba(64,97,79,0.105)":"rgba(126,45,38,0.105)",
                      border:`1px solid ${pWon?"rgba(64,97,79,0.375)":"rgba(126,45,38,0.3)"}`,
                      textAlign:"center"}}>
                      <div style={{marginBottom:3}}><PositionIcon position={pos} size={14}/></div>
                      <div style={{fontSize:9,color:"#6E6350",marginBottom:2}}>{label}</div>
                      <div style={{fontSize:13,fontWeight:900,color:col}}>{pWon?"✓":"✗"}</div>
                      <div style={{fontSize:9,color:"#6E6350",marginTop:2}}>{Math.round(pChance*100)}% chance</div>
                    </div>
                  );
                })}
              </div>
              <div style={{fontSize:9,color:"#6E6350",marginTop:5,textAlign:"center"}}>
                {POS_KEYS.filter(p=>phaseRolls[p]).length}/3 phases won · 2+ needed for victory
              </div>
            </div>
          )}

          {/* Weak Link */}
          {topWeakLink&&(
            <div style={{padding:"9px 10px",borderRadius:3,background:"rgba(126,45,38,0.075)",border:"1px solid rgba(126,45,38,0.27)",marginBottom:8}}>
              <div style={{fontSize:9,color:"#7E2D26",fontWeight:700,marginBottom:3}}>WEAK LINK</div>
              <div style={{fontSize:11,fontWeight:700,color:"#23201A",fontFamily:"'Alegreya Sans',sans-serif"}}>{topWeakLink.hero.name}</div>
              <div style={{fontSize:9,color:"#6E6350"}}>{topWeakLink.issues[0]?.reason.slice(0,40)}</div>
            </div>
          )}

          {/* Stats grid */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            {[
              ["Battle reward",  goldGain>0?`+${goldGain.toLocaleString()}g`:"—",          goldGain>0?"#40614F":"#8A7F68"],
              ["Wages",        `-${wages.toLocaleString()}g`,                             "#9A5B2B"],
              ["Tribute",      `+${tribute.toLocaleString()}g`,                          "#8A6D3B"],
              ["Net gold",     `${netGold>=0?"+":""}${netGold.toLocaleString()}g`,        netCol],
              ["XP earned",    `+${heroXP} per raider`,                                  "#3C5A78"],
              ["Level-ups",    levelUps.length ? levelUps.map(l=>l.name).join(", ") : "—","#5F4B66"],
            ].map(([label,val,col])=>(
              <div key={label} style={{padding:"8px 10px",background:"rgba(60,52,38,0.045)",borderRadius:3}}>
                <div style={{fontSize:9,color:"#6E6350",marginBottom:2}}>{label}</div>
                <div style={{fontSize:12,fontWeight:700,color:col,wordBreak:"break-word"}}>{val}</div>
              </div>
            ))}
          </div>

          {/* Alerts */}
          {(injuries.length>0||exhausted.length>0)&&(
            <div style={{marginBottom:12}}>
              {injuries.length>0&&(
                <div style={{padding:"7px 10px",borderRadius:3,background:"rgba(126,45,38,0.105)",border:"1px solid rgba(126,45,38,0.3)",marginBottom:5,fontSize:11,color:"#9A5B2B"}}>
                  Injured: {injuries.join(", ")}
                </div>
              )}
              {exhausted.length>0&&(
                <div style={{padding:"7px 10px",borderRadius:3,background:"rgba(126,45,38,0.09)",border:"1px solid rgba(126,45,38,0.22)",fontSize:11,color:"#7E2D26"}}>
                  Burned out: {exhausted.join(", ")} — rest them urgently
                </div>
              )}
            </div>
          )}

          {/* Next opponent preview */}
          {nextOpp&&(
            <div style={{padding:"9px 12px",borderRadius:3,background:"rgba(60,52,38,0.045)",border:"1px solid rgba(60,52,38,0.126)",marginBottom:12}}>
              <div style={{fontSize:9,color:"#6E6350",marginBottom:3}}>NEXT WEEK</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:"#23201A",fontFamily:"'Alegreya Sans',sans-serif"}}>{nextOpp.name}</div>
                  <div style={{fontSize:10,color:"#6E6350"}}><span style={{color:starsColor(nextOppStars)}}>{nextDiffStars}</span> · Power {nextOpp.power}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:9,color:"#6E6350"}}>{nextOpp.specialisation?.label}</div>
                </div>
              </div>
            </div>
          )}

          <button onClick={onDismiss}
            style={{width:"100%",padding:"11px 0",borderRadius:3,border:"none",cursor:"pointer",
              background:`${townColor}cc`,
              color:"#F0E8D5",fontFamily:"'Alegreya Sans',sans-serif",fontWeight:900,fontSize:13}}>
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── RANDOM EVENT MODAL ──────────────────────────────────────────────────────

function RandomEventModal({event, heroes, townName, onAccept, onDecline, onViewHero}){
  const [selected,setSelected]=useState([]);
  if(!event)return null;

  // ── EMISSARY EVENT: special render — no hero selection ────────────────────
  if(event.isEmissary){
    const lc=event.challenger;
    // The emissary arrives under seal — same correspondence treatment as every
    // other letter in the game. Ink is oxblood; the seal takes the challenger's
    // initial (dropping a leading "The").
    const ink="#7E2D26";
    const seal=(lc.name.replace(/^The\s+/i,"")[0]||"C").toUpperCase();
    return(
      <div style={{position:"fixed",inset:0,background:"rgba(30,24,14,0.6)",zIndex:250,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(10px)",padding:"16px"}}>
        <div style={{width:"min(500px,92vw)",maxHeight:"90vh",overflowY:"auto",background:"#EFE7D3",border:`1px solid ${ink}8c`,borderRadius:3,boxShadow:"0 2px 12px rgba(60,52,38,0.3)"}}>

          {/* The letter — an emissary arrives under seal */}
          <div style={{padding:"14px 20px 12px",borderBottom:`2px solid ${ink}`,background:`${ink}0c`,position:"relative"}}>
            <div style={{position:"absolute",top:12,right:16,width:38,height:38,borderRadius:"50%",
              background:ink,color:"#E9E1CE",display:"flex",alignItems:"center",justifyContent:"center",
              fontFamily:"'IM Fell English SC',serif",fontSize:19,fontWeight:700,transform:"rotate(-8deg)",
              boxShadow:`0 0 0 2.5px ${ink}55, 0 1px 3px rgba(30,24,14,0.35)`,opacity:0.92}}>
              {seal}
            </div>
            <div style={{fontSize:9,letterSpacing:2,color:"#6E6350",textTransform:"uppercase",marginBottom:2}}>
              By emissary · to the Steward of {townName||"the Realm"}
            </div>
            <div style={{fontFamily:"'IM Fell English SC',serif",fontWeight:900,fontSize:18,color:ink,paddingRight:48}}>A Legendary Challenge</div>
          </div>

          <div style={{padding:"16px 20px 20px"}}>
            <div style={{fontSize:12,color:"#4A4335",lineHeight:1.7,marginBottom:14}}>
              Steward — my liege <b style={{color:"#23201A"}}>{lc.name}</b> has marked your ascent, and would test it in person.
            </div>

            {/* the challenger's own words */}
            <div style={{padding:"12px 14px",borderRadius:3,background:`${ink}12`,borderLeft:`3px solid ${ink}`,marginBottom:14}}>
              <div style={{fontSize:12,color:"#4A4335",fontStyle:"italic",lineHeight:1.6}}>"{lc.flavour}"</div>
            </div>

            {/* terms */}
            <div style={{display:"flex",gap:8,marginBottom:14}}>
              {[
                ["Their Power",lc.power,ink],
                ["Purse on Victory",`${lc.goldReward?.toLocaleString()||"?"}g`,"#8A6D3B"],
              ].map(([label,val,col])=>(
                <div key={label} style={{flex:1,textAlign:"center",padding:"8px 4px",borderRadius:3,background:"rgba(30,24,14,0.06)",border:"1px solid rgba(60,52,38,0.12)"}}>
                  <div style={{fontSize:9,color:"#6E6350",marginBottom:2,letterSpacing:0.5}}>{label}</div>
                  <div style={{fontSize:14,fontWeight:700,color:col}}>{val}</div>
                </div>
              ))}
            </div>

            {/* Specialisation warning if set */}
            {lc.specialisation&&(
              <div style={{padding:"8px 12px",borderRadius:3,background:`${ink}0f`,border:`1px solid ${ink}3a`,marginBottom:14,fontSize:10,color:"#6E6350"}}>
                They give battle in the <b style={{color:"#9A5B2B"}}>{lc.specialisation.label}</b> style — prepare your counter accordingly.
              </div>
            )}

            <div style={{fontSize:11,color:"#6E6350",lineHeight:1.6,marginBottom:16}}>
              This is an <b style={{color:"#23201A"}}>exhibition</b> — your rank is safe whatever the outcome. Win for legendary gold and renown; lose with your honour intact.
            </div>

            <div style={{fontSize:11,color:"#6E6350",fontStyle:"italic",textAlign:"right",marginBottom:16}}>
              — borne on behalf of {lc.name}
            </div>

            <div style={{display:"flex",gap:10}}>
              <button onClick={onDecline}
                style={{flex:1,padding:"11px 0",borderRadius:3,border:"1px solid rgba(60,52,38,0.22)",background:"rgba(60,52,38,0.054)",color:"#6E6350",cursor:"pointer",fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:11}}>
                Decline with Honour
              </button>
              <button onClick={()=>onAccept(event,[])}
                style={{flex:2,padding:"11px 0",borderRadius:3,border:"none",background:ink,color:"#F5EEDC",cursor:"pointer",fontFamily:"'Alegreya Sans',sans-serif",fontWeight:900,fontSize:13}}>
                Accept the Challenge
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const available = getAvailableHeroes(heroes);
  const canAccept = selected.length >= event.heroesNeeded;

  const toggleHero=(h)=>{
    setSelected(prev=>{
      if(prev.find(x=>x.id===h.id)) return prev.filter(x=>x.id!==h.id);
      if(prev.length>=event.heroesNeeded) return [...prev.slice(1),h];
      return [...prev,h];
    });
  };

  // Sort heroes by matchScore descending so best fits appear first
  const sortedHeroes = [...available].sort((a,b) =>
    calcMatchScore(b, event) - calcMatchScore(a, event)
  );

  // Combined confidence for selected heroes (average matchScore)
  const selectionConfidence = selected.length > 0
    ? getEventConfidence(selected.reduce((a,h) => a + calcMatchScore(h,event), 0) / selected.length)
    : null;

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(30,24,14,0.574)",zIndex:250,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)"}}>
      <div style={{width:"min(560px,95vw)",maxHeight:"88vh",background:"#EFE7D3",border:"1px solid rgba(138,109,59,0.45)",borderRadius:3,overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 2px 12px rgba(60,52,38,0.3)"}}>

        {/* The letter — every event arrives from a sender, under their seal */}
        {(()=>{
          const th = EVENT_THEMES[event.theme] || EVENT_THEMES.arena;
          return(
            <div style={{padding:"14px 20px 12px",borderBottom:`2px solid ${th.ink}`,background:`${th.ink}0c`,position:"relative"}}>
              {/* wax seal */}
              <div style={{position:"absolute",top:12,right:16,width:38,height:38,borderRadius:"50%",
                background:th.ink,color:"#E9E1CE",display:"flex",alignItems:"center",justifyContent:"center",
                fontFamily:"'IM Fell English SC',serif",fontSize:19,fontWeight:700,transform:"rotate(-8deg)",
                boxShadow:`0 0 0 2.5px ${th.ink}55, 0 1px 3px rgba(30,24,14,0.35)`,opacity:0.92}}>
                {th.seal}
              </div>
              <div style={{fontSize:9,letterSpacing:2,color:"#6E6350",textTransform:"uppercase",marginBottom:2}}>
                By courier · to the Steward of {townName||"the Realm"}
              </div>
              <div style={{fontFamily:"'IM Fell English SC',serif",fontWeight:900,fontSize:18,color:th.ink,paddingRight:48}}>{event.title}</div>
              <div style={{fontSize:10,color:"#6E6350",marginBottom:8}}>{th.label} · {event.awayWeeks[0]} week{event.awayWeeks[0]>1?"s":""} away · {event.heroesNeeded} hero{event.heroesNeeded>1?"es":""}{event.stats?.length?` · tests ${event.stats.join(" + ")}`:""}</div>
              <div style={{fontSize:11.5,color:"#4A4335",lineHeight:1.65,fontStyle:"italic"}}>
                {th.salutation}
              </div>
              <div style={{fontSize:11.5,color:"#4A4335",lineHeight:1.65,fontStyle:"italic",marginTop:4}}>
                "{event.flavour}"
              </div>
              <div style={{textAlign:"right",marginTop:8}}>
                {th.signoff&&<div style={{fontSize:10,color:"#6E6350",fontStyle:"italic"}}>{th.signoff}</div>}
                <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:13,color:th.ink}}>
                  {th.sender}{th.senderTitle?<span style={{fontSize:10,color:"#6E6350"}}> · {th.senderTitle}</span>:null}
                </div>
              </div>
              {selectionConfidence&&(
                <div style={{position:"absolute",bottom:12,left:20,padding:"3px 9px",borderRadius:3,background:`${selectionConfidence.color}18`,border:`1px solid ${selectionConfidence.color}44`,fontSize:10,fontWeight:700,color:selectionConfidence.color}}>
                  {selectionConfidence.label}
                </div>
              )}
            </div>
          );
        })()}

        {/* Terms — the steward's assessment of the offer */}
        <div style={{padding:"10px 20px",borderBottom:"1px solid rgba(60,52,38,0.09)",background:"rgba(64,97,79,0.06)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:10,color:"#40614F",fontWeight:700,letterSpacing:1}}>TERMS, ON SUCCESS</div>
            <div style={{fontSize:12,fontWeight:700,color:"#40614F"}}>{event.rewardDesc}</div>
          </div>
          <div style={{fontSize:9,color:"#6E6350",marginTop:3}}>Partial success pays half · the outcome resolves on return</div>
        </div>

        {/* Hero selection */}
        <div style={{flex:1,overflowY:"auto",padding:"12px 20px"}}>
          <div style={{fontSize:10,color:"#6E6350",fontWeight:700,marginBottom:8,letterSpacing:1}}>
            SELECT {event.heroesNeeded} HERO{event.heroesNeeded>1?"ES":""} — {available.length} available
          </div>
          {available.length===0&&(
            <div style={{fontSize:12,color:"#6E6350",padding:12}}>No available heroes right now — all are injured, away, or retired.</div>
          )}
          {sortedHeroes.map(h=>{
            const isSelected = selected.find(x=>x.id===h.id);
            const matchScore = calcMatchScore(h, event);
            const confidence = getEventConfidence(matchScore);
            const {label:fl, color:fc} = fatigueLabel(h.fatigue||0);
            return(
              <div key={h.id} onClick={()=>toggleHero(h)}
                style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:3,marginBottom:5,cursor:"pointer",
                  background:isSelected?"rgba(64,97,79,0.12)":"rgba(60,52,38,0.054)",
                  border:`1px solid ${isSelected?"rgba(64,97,79,0.55)":"rgba(60,52,38,0.126)"}`,transition:"all 0.15s"}}>
                <HeroAvatar race={h.race} size={20}/>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:13,color:"#23201A"}}>{h.name}</div>
                  {/* Tested stats, per hero — so the player can pick on the actual numbers, not just the verdict */}
                  <div style={{display:"flex",gap:8,fontSize:10.5,flexWrap:"wrap",marginTop:2}}>
                    {(event.stats||[]).map(s=>{
                      const v=Math.round(h.stats[s]||0);
                      const col=v>=80?"#40614F":v>=60?"#3C5A78":v>=40?"#8A6D3B":"#7E2D26";
                      return <span key={s} style={{color:"#6E6350"}}>{s} <b style={{color:col,fontVariantNumeric:"tabular-nums"}}>{v}</b></span>;
                    })}
                  </div>
                  <div style={{display:"flex",gap:8,fontSize:10,color:"#6E6350",flexWrap:"wrap",marginTop:2}}>
                    <span>{h.role} · Lv {h.level}</span>
                    <span style={{color:fc}}>{fl} fatigue</span>
                    <span style={{color:confidence.color,fontWeight:700}}>{confidence.label}</span>
                    {eventTraitMods(h, event).map(({trait,mod})=>(
                      <span key={trait} style={{color:mod>0?"#40614F":"#9A5B2B",fontWeight:700}}>
                        {mod>0?"▲":"▼"} {trait}
                      </span>
                    ))}
                    {h.traits?.includes("Greedy")&&event.reward?.goldRange&&(
                      <span style={{color:"#9A5B2B"}}>will take a cut</span>
                    )}
                  </div>
                </div>
                {onViewHero&&(
                  <button onClick={(e)=>{e.stopPropagation();onViewHero(h);}}
                    title="Open full hero sheet"
                    style={{padding:"4px 8px",borderRadius:3,border:"1px solid rgba(60,90,120,0.45)",background:"rgba(60,90,120,0.12)",color:"#3C5A78",cursor:"pointer",fontSize:10,fontWeight:700,fontFamily:"'Alegreya Sans',sans-serif"}}>
                    View
                  </button>
                )}
                {isSelected&&<div style={{fontSize:14,color:"#40614F",fontWeight:700}}>✓</div>}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{padding:"12px 20px",borderTop:"1px solid rgba(60,52,38,0.09)",display:"flex",gap:8,background:"rgba(30,24,14,0.07)"}}>
          <button onClick={()=>canAccept&&onAccept(event,selected)} disabled={!canAccept}
            style={{flex:2,padding:"11px 0",borderRadius:3,border:"none",cursor:canAccept?"pointer":"not-allowed",
              background:canAccept?"#40614F":"#E4DAC2",
              color:canAccept?"#F0E8D5":"#95896F",fontFamily:"'Alegreya Sans',sans-serif",fontWeight:900,fontSize:13}}>
            {canAccept?`✓ Send ${selected.map(h=>h.name).join(" & ")}`:`Select ${event.heroesNeeded} hero${event.heroesNeeded>1?"es":""}`}
          </button>
          <button onClick={onDecline}
            style={{flex:1,padding:"11px 0",borderRadius:3,border:"1px solid rgba(126,45,38,0.45)",cursor:"pointer",
              background:"rgba(126,45,38,0.12)",color:"#7E2D26",fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:12}}>
            ✗ Decline
          </button>
        </div>
      </div>
    </div>
  );
}

function WanderingMasterModal({event, heroes, gold, onAccept, onDecline}){
  const [selectedHero, setSelectedHero] = useState(null);
  const [selectedStat, setSelectedStat] = useState(null);
  const available = heroes.filter(h=>!h.injured&&!h.retired&&!(h.awayWeeks>0));
  const canAfford = gold >= (event?.cost||200);
  const CHOOSABLE_STATS = [
    "Strength","Agility","Endurance","Defense","Magic Power","Accuracy",
    "Magic Resist","Tactics","Composure","Leadership","Adaptability",
    "Determination","Charisma","Negotiation","Intimidation",
  ];
  const canAccept = selectedHero && selectedStat && canAfford;
  if(!event) return null;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(30,24,14,0.595)",zIndex:260,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)",padding:"16px"}}>
      <div style={{width:"min(520px,95vw)",maxHeight:"88vh",background:"#EFE7D3",border:"1px solid rgba(95,75,102,0.55)",borderRadius:3,overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 2px 12px rgba(60,52,38,0.3)"}}>

        {/* Header */}
        <div style={{padding:"20px 22px 14px",borderBottom:"1px solid rgba(60,52,38,0.108)",background:"rgba(30,24,14,0.105)"}}>
          <div style={{marginBottom:6}}>
            <div style={{fontFamily:"'IM Fell English SC',serif",fontWeight:900,fontSize:16,color:"#5F4B66"}}>{event.title}</div>
            <div style={{fontSize:10,color:"#6E6350"}}>Cost: {event.cost}g · Choose a hero to receive training</div>
          </div>
          <div style={{fontSize:11,color:"#4A4335",fontStyle:"italic",lineHeight:1.6}}>"{event.flavour}"</div>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"14px 22px"}}>
          {/* Hero selection */}
          <div style={{fontSize:10,color:"#6E6350",fontWeight:700,marginBottom:8,letterSpacing:1}}>CHOOSE A HERO</div>
          {available.map(h=>{
            const isSel = selectedHero?.id===h.id;
            return(
              <div key={h.id} onClick={()=>setSelectedHero(h)}
                style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:3,
                  marginBottom:5,cursor:"pointer",transition:"all 0.15s",
                  background:isSel?"rgba(95,75,102,0.15)":"rgba(60,52,38,0.054)",
                  border:`1px solid ${isSel?"rgba(95,75,102,0.55)":"rgba(60,52,38,0.126)"}`}}>
                <HeroAvatar race={h.race} size={20}/>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:13,color:"#23201A"}}>{h.name}</div>
                  <div style={{fontSize:10,color:"#6E6350"}}>{h.role} · Lv {h.level}</div>
                </div>
                {isSel&&<div style={{fontSize:14,color:"#5F4B66",fontWeight:700}}>✓</div>}
              </div>
            );
          })}

          {/* Stat selection */}
          {selectedHero&&(
            <>
              <div style={{fontSize:10,color:"#6E6350",fontWeight:700,margin:"14px 0 8px",letterSpacing:1}}>CHOOSE A STAT TO BOOST</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {CHOOSABLE_STATS.map(s=>{
                  const isSel = selectedStat===s;
                  return(
                    <button key={s} onClick={()=>setSelectedStat(s)}
                      style={{padding:"5px 10px",borderRadius:3,border:`1px solid ${isSel?"rgba(95,75,102,0.55)":"rgba(60,52,38,0.22)"}`,
                        background:isSel?"rgba(95,75,102,0.225)":"rgba(60,52,38,0.072)",
                        color:isSel?"#5F4B66":"#6E6350",cursor:"pointer",fontSize:10,fontWeight:isSel?700:400}}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div style={{padding:"12px 22px",borderTop:"1px solid rgba(60,52,38,0.09)",background:"rgba(30,24,14,0.07)"}}>
          {!canAfford&&<div style={{fontSize:10,color:"#7E2D26",marginBottom:8}}>Not enough gold ({gold}g / {event.cost}g required)</div>}
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>canAccept&&onAccept(selectedHero, selectedStat)} disabled={!canAccept}
              style={{flex:2,padding:"11px 0",borderRadius:3,border:"none",
                cursor:canAccept?"pointer":"not-allowed",
                background:canAccept?"#5F4B66":"#E4DAC2",
                color:canAccept?"#F5EEDC":"#95896F",fontFamily:"'Alegreya Sans',sans-serif",fontWeight:900,fontSize:12}}>
              {canAccept?`✓ Pay ${event.cost}g & Train ${selectedHero?.name}`:"Select hero & stat"}
            </button>
            <button onClick={onDecline}
              style={{flex:1,padding:"11px 0",borderRadius:3,border:"1px solid rgba(60,52,38,0.22)",
                cursor:"pointer",background:"rgba(60,52,38,0.054)",color:"#6E6350",
                fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:11}}>
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Parchment Codex hero card.
// Maps to HeroCardC in the design handoff. Sharp-cornered (4px), hairline gold borders,
// boxed sections separated by faint dividers, IM Fell English SC labels + Alegreya Sans numerals.
function HeroCard({hero,selected,onClick,compact,showBuy,onBuy,canAfford,rosterFull,draggable,onDragStart,isListed,hasBid,isLeader,showHiddenStats,showScoutedPotential,retrainCandidate}){
  const power = Math.round(Math.max(...POS_KEYS.map(p=>calcHeroCombatScore(hero,p))));
  const avgMental=Math.round(STAT_GROUPS.Mental.reduce((a,s)=>a+hero.stats[s],0)/STAT_GROUPS.Mental.length);
  const phase=agePhase(hero);
  const stageColor = agePhaseColor(phase);
  const {label:hLabel,color:hColor}=moraleLabel(hero.morale);
  const contractUrgent=(hero.contractWeeksLeft||0)<=WEEKS_PER_CONTRACT_YEAR;
  const fatColor = (hero.fatigue||0) > 70 ? "#9A5B2B" : (hero.fatigue||0) > 40 ? "#8A6D3B" : "#4A6B45";
  const morColor = hero.morale > 70 ? "#4A6B45" : hero.morale > 40 ? "#8A6D3B" : "#9A5B2B";

  // Border priority: selected > hasBid > departing > negotiating > contract urgent / injured > faint
  const borderColor = selected ? "rgba(138,109,59,0.55)"
    : hasBid ? "rgba(74,107,69,0.45)"
    : hero.refusesToSign ? "rgba(126,45,38,0.45)"
    : hero.negotiationPending ? "rgba(138,109,59,0.55)"
    : contractUrgent ? "rgba(126,45,38,0.45)"
    : hero.injured ? "rgba(126,45,38,0.45)"
    : "rgba(138,109,59,0.27)";
  const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : null;
  const stages = ["prospect","rising","peak","fading","veteran"];
  const stageIdx = stages.indexOf(phase);
  const nextStage = stages[stageIdx + 1];
  const stagePctRaw = (hero.stageProgress || 0) / 100;
  const xpForCurrent = xpForLevel(hero.level);
  const xpForNext = xpForLevel(hero.level + 1);
  const xpPct = xpForNext > xpForCurrent ? Math.max(0, Math.min(1, (hero.xp - xpForCurrent) / (xpForNext - xpForCurrent))) : 1;
  const xpToLevel = Math.max(0, xpForNext - hero.xp);

  if(compact){
    return (
      <div onClick={onClick} draggable={draggable} onDragStart={onDragStart}
        style={{background:"#EDE4CE",border:`1px solid ${borderColor}`,borderRadius:3,padding:"10px 12px",cursor:draggable?"grab":"pointer",display:"flex",alignItems:"center",gap:10,marginBottom:5,fontFamily:"'Alegreya Sans',sans-serif"}}>
        <div style={{width:34,height:34,background:"#E4D9BF",border:"1px solid rgba(138,109,59,0.3)",borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <RoleIcon role={hero.role} size={20}/>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:12,color:"#3A3427",letterSpacing:0.3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
            {hero.name}
            {hero.injured&&<span style={{fontSize:9,color:"#7E2D26",marginLeft:4}}></span>}
            {isLeader&&<span title="Squad Leader" style={{marginLeft:4,display:"inline-flex"}}><Glyph id="leader" size={11} color="#8A6D3B"/></span>}
            {retrainCandidate&&<span title="Stats favour another lane — see Retraining in their profile" style={{marginLeft:4,fontSize:10,color:"#40614F",fontWeight:700}}>⊕</span>}
            {isListed&&<span style={{fontSize:9,color:"#8A6D3B",marginLeft:4}}></span>}
          </div>
          <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:9,color:"#77653F",letterSpacing:1.4,textTransform:"uppercase",marginTop:2}}>
            {hero.race} · {hero.role} · Lv <span style={{fontFamily:"'Alegreya Sans',sans-serif",color:"#8A6D3B",letterSpacing:0,fontWeight:600}}>{hero.level}</span>
          </div>
        </div>
      </div>
    );
  }

  return(
    <div onClick={onClick} draggable={draggable} onDragStart={onDragStart}
      role="button" tabIndex={onClick?0:-1}
      onKeyDown={onClick?(e)=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();onClick(e);}}:undefined}
      style={{textAlign:"left",display:"flex",flexDirection:"column",width:"100%",height:"100%",
              background:selected?"#E4D9BF":"#EDE4CE",
              border:`1px solid ${borderColor}`,borderRadius:3,padding:0,cursor:draggable?"grab":"pointer",
              fontFamily:"'Alegreya Sans',sans-serif",
              transition:"background 0.15s, border-color 0.15s, transform 0.12s",
              transform:selected?"translateY(-1px)":"none",
              marginBottom:0}}>
      {/* HEADER */}
      <div style={{padding:"14px 16px 12px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid rgba(138,109,59,0.15)"}}>
        <div style={{width:40,height:40,borderRadius:3,background:"#E4D9BF",border:"1px solid rgba(138,109,59,0.45)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <RoleIcon role={hero.role} size={24}/>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:"'IM Fell English SC',serif",fontWeight:700,fontSize:14,color:"#3A3427",letterSpacing:0.3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
            {hero.name}
            {hero.injured&&<span style={{fontSize:9,color:"#7E2D26",marginLeft:5}}></span>}
            {hero.refusesToSign
              ? <span style={{fontSize:8,color:"#7E2D26",marginLeft:5,fontWeight:700,letterSpacing:0.5}}>DEPARTING</span>
              : hero.negotiationPending&&<span style={{fontSize:8,color:"#8A6D3B",marginLeft:5,fontWeight:700,letterSpacing:0.5}}>RENEWING</span>}
            {isLeader&&<span title="Squad Leader" style={{marginLeft:5,display:"inline-flex"}}><Glyph id="leader" size={12} color="#8A6D3B"/></span>}
            {retrainCandidate&&<span title="Stats favour another lane — see Retraining in their profile" style={{marginLeft:5,fontSize:10,color:"#40614F",fontWeight:700}}>⊕</span>}
            {hero.foundling&&showHiddenStats&&<span style={{fontSize:9,color:"#5F4B66",marginLeft:5}}></span>}
            {hero.fodder&&<span style={{fontSize:9,color:"#77653F",marginLeft:5}}></span>}
            {isListed&&<span style={{fontSize:9,color:"#8A6D3B",marginLeft:5}} title="Open to offers"></span>}
            {hasBid&&<span style={{fontSize:9,color:"#4A6B45",marginLeft:5}}></span>}
            {(hero.awayWeeks||0)>0&&<span style={{fontSize:9,color:"#4A6178",marginLeft:5}}>{hero.awayWeeks}w</span>}
          </div>
          <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:10,color:"#77653F",marginTop:2,letterSpacing:1,textTransform:"uppercase",fontWeight:600}}>
            {hero.race} · {hero.role} · Lv <span style={{color:"#8A6D3B",fontFamily:"'Alegreya Sans',sans-serif",fontWeight:600,letterSpacing:0}}>{hero.level}</span>
          </div>
        </div>
        <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:9,fontWeight:700,padding:"3px 8px",borderRadius:3,letterSpacing:1.4,textTransform:"uppercase",color:stageColor,background:`${stageColor}14`,border:`1px solid ${stageColor}44`}}>
          {cap(phase)}
        </div>
      </div>

      {/* CAREER + XP STRIP */}
      <div style={{padding:"12px 16px",borderBottom:"1px solid rgba(138,109,59,0.15)",background:"rgba(138,109,59,0.04)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:9}}>
          <span style={{width:38,fontFamily:"'Alegreya Sans',sans-serif",fontSize:8,fontWeight:700,letterSpacing:1.2,color:"#77653F",textTransform:"uppercase"}}>Career</span>
          <div style={{flex:1,height:3,background:"#E4D9BF",borderRadius:1.5,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${Math.round(stagePctRaw*100)}%`,background:stageColor}}/>
          </div>
          <span style={{display:"inline-flex",alignItems:"center",gap:5,whiteSpace:"nowrap",justifyContent:"flex-end"}}>
            <span style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:9,fontWeight:700,color:stageColor,letterSpacing:1.2,textTransform:"uppercase"}}>{cap(phase)}</span>
            {nextStage && <>
              <span style={{color:"#C9BA98",fontSize:10}}>→</span>
              <span style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:9,fontWeight:500,color:"#9C8F73",letterSpacing:1.2,textTransform:"uppercase"}}>{cap(nextStage)}</span>
            </>}
          </span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{width:38,fontFamily:"'Alegreya Sans',sans-serif",fontSize:8,fontWeight:700,letterSpacing:1.2,color:"#77653F",textTransform:"uppercase"}}>XP</span>
          <div style={{flex:1,height:3,background:"#E4D9BF",borderRadius:1.5,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${Math.round(xpPct*100)}%`,background:"#8A6D3B"}}/>
          </div>
          <span style={{display:"inline-flex",alignItems:"center",gap:5,whiteSpace:"nowrap",justifyContent:"flex-end"}}>
            <span style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:10,color:"#8A6D3B",fontVariantNumeric:"tabular-nums"}}>{xpToLevel}</span>
            <span style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:9,fontWeight:700,color:"#77653F",letterSpacing:1.2,textTransform:"uppercase"}}>To Level</span>
          </span>
        </div>
      </div>

      {/* STATS — 4 cells */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:0}}>
        {[
          ["Power",   power,         "#4A6B45"],
          ["Mental",  avgMental,     "#5C6E7A"],
          ["Morale",  hero.morale,   morColor],
          ["Fatigue", hero.fatigue||0, fatColor],
        ].map(([label,val,color],i)=>(
          <div key={label} style={{padding:"10px 0 12px",textAlign:"center",borderLeft:i>0?"1px solid rgba(138,109,59,0.15)":"none"}}>
            <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:8,fontWeight:700,letterSpacing:1.3,textTransform:"uppercase",color:"#77653F",marginBottom:4}}>{label}</div>
            <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:600,fontSize:18,color,fontVariantNumeric:"tabular-nums",lineHeight:1}}>{val}</div>
          </div>
        ))}
      </div>

      {/* AWAY BANNER */}
      {(hero.awayWeeks||0)>0&&(
        <div style={{padding:"6px 14px",borderTop:"1px solid rgba(138,109,59,0.15)",background:"rgba(74,97,120,0.09)",fontSize:10,color:"#4A6178",fontFamily:"'Alegreya Sans',sans-serif",letterSpacing:1.2,textTransform:"uppercase"}}>
          Away · {hero.awayEvent} · {hero.awayWeeks}w
        </div>
      )}

      {/* TRAITS — chips have hover tooltips with the effect description */}
      <div style={{padding:"10px 14px",display:"flex",flexWrap:"wrap",gap:4,minHeight:hero.traits?.length?26:0,borderTop:"1px solid rgba(138,109,59,0.15)"}}>
        {hero.traits.slice(0,4).map(t=>{
          const eff = TRAIT_EFFECTS[t];
          return (
            <span key={t} title={eff?.desc||t}
              style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:9,fontWeight:600,padding:"3px 9px",borderRadius:2,background:"rgba(138,109,59,0.12)",color:"#8A6D3B",border:"1px solid rgba(138,109,59,0.375)",letterSpacing:1.2,textTransform:"uppercase",cursor:eff?.desc?"help":"default"}}>{t}</span>
          );
        })}
      </div>

      {/* SCOUTED / HIDDEN POTENTIAL */}
      {showHiddenStats&&(()=>{
        const b = potentialBucket(hero.stats.Potential);
        return (
          <div style={{padding:"6px 14px",borderTop:"1px solid rgba(138,109,59,0.15)",background:"rgba(138,109,59,0.06)",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:10}}>
            <span style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:8,fontWeight:700,letterSpacing:1.2,color:"#77653F",textTransform:"uppercase"}}>Potential</span>
            <span style={{fontFamily:"'IM Fell English SC',serif",fontWeight:700,color:b.color,letterSpacing:1.2,textTransform:"uppercase"}}>{b.label} <span style={{fontFamily:"'Alegreya Sans',sans-serif",color:"#77653F",fontWeight:500,letterSpacing:0,marginLeft:4}}>({hero.stats.Potential})</span></span>
          </div>
        );
      })()}
      {showScoutedPotential&&!showHiddenStats&&(()=>{
        const b = potentialBucket(hero.stats.Potential);
        return (
          <div style={{padding:"6px 14px",borderTop:"1px solid rgba(138,109,59,0.15)",background:"rgba(74,97,120,0.08)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:8,fontWeight:700,letterSpacing:1.2,color:"#4A6178",textTransform:"uppercase"}}>Scouted</span>
            <span style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:9,fontWeight:700,color:b.color,letterSpacing:1.2,textTransform:"uppercase"}}>{b.label}</span>
          </div>
        );
      })()}

      {/* FOOTER — wage / value (auto-margin pins it to the bottom so cards
          stay aligned in a stretch grid regardless of trait count). */}
      <div style={{marginTop:"auto",padding:"10px 16px",borderTop:"1px solid rgba(138,109,59,0.15)",background:"rgba(138,109,59,0.045)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",flexDirection:"column",gap:2}}>
          <span style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:8,fontWeight:700,letterSpacing:1.2,color:"#77653F",textTransform:"uppercase"}}>Wage / Week</span>
          <span style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:600,fontSize:13,color:"#77653F",fontVariantNumeric:"tabular-nums"}}>{hero.salary}g</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2}}>
          <span style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:8,fontWeight:700,letterSpacing:1.2,color:"#77653F",textTransform:"uppercase"}}>Market Value</span>
          <span style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:600,fontSize:13,color:"#8A6D3B",fontVariantNumeric:"tabular-nums"}}>{hero.value===0?(showBuy?"Unattached":"0g"):`${hero.value.toLocaleString()}g`}</span>
        </div>
      </div>

      {/* BUY BUTTON — only on market cards */}
      {showBuy&&(
        <div style={{padding:"10px 14px 12px",borderTop:"1px solid rgba(138,109,59,0.15)"}}>
          <button onClick={e=>{e.stopPropagation();onBuy(hero);}} disabled={!canAfford||rosterFull}
            style={{width:"100%",padding:"10px 0",borderRadius:4,border:"none",
              cursor:(canAfford&&!rosterFull)?"pointer":"not-allowed",
              background:(canAfford&&!rosterFull)?"#8A6D3B":"#D5C8A9",
              color:(canAfford&&!rosterFull)?"#E9E1CE":"#C9BA98",
              fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:12,letterSpacing:0.3}}>
            {rosterFull?"Roster Full":canAfford?(hero.value===0?"Sign · No fee":`Sign · ${hero.value.toLocaleString()}g`):"Insufficient Gold"}
          </button>
        </div>
      )}
    </div>
  );
}

function HeroDetail({hero,prevStats,onClose,onRelease,onEarlyRenew,isListed,onToggleListed,heroBids,onAcceptBid,onDeclineBid,showHiddenStats,isLeader,onSetLeader,isOwned=true,onRetrain,retrainGold,retrainSeason,retrainBuildings}){
  const [tab,setTab]=useState("Combat");
  useEscapeKey(onClose, !!onClose);
  if(!hero)return null;
  const phase=agePhase(hero);
  const declining=["fading","veteran"].includes(phase);
  const {label:hLabel,color:hColor}=moraleLabel(hero.morale);
  const demand=calcDemand(hero);
  return(
    <div className="rm-detail-panel" style={{width:380,background:"#E9E1CE",borderLeft:"1px solid rgba(138,109,59,0.21)",padding:0,boxSizing:"border-box",fontFamily:"'Alegreya Sans',sans-serif"}}>
      {/* Parchment Codex sticky header — avatar tile + name + meta + close */}
      <div className="rm-detail-header" style={{position:"sticky",top:0,zIndex:10,background:"#E9E1CE",borderBottom:"1px solid rgba(138,109,59,0.21)",padding:"18px 20px",display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:52,height:52,borderRadius:3,background:"#E4D9BF",border:"1px solid rgba(138,109,59,0.55)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <RoleIcon role={hero.role} size={32}/>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:"'IM Fell English SC',serif",fontWeight:700,fontSize:18,color:"#3A3427",letterSpacing:0.5,lineHeight:1.15,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
            {hero.name}
            {isListed&&<span style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:9,color:"#8A6D3B",marginLeft:8,background:"rgba(138,109,59,0.15)",padding:"2px 7px",borderRadius:2,border:"1px solid rgba(138,109,59,0.45)",letterSpacing:1.2,textTransform:"uppercase",verticalAlign:"middle"}}>Open to Offers</span>}
          </div>
          <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:10,color:"#77653F",marginTop:4,letterSpacing:1.2,textTransform:"uppercase"}}>
            {hero.race} · {hero.role} · Lv <span style={{color:"#8A6D3B",fontFamily:"'Alegreya Sans',sans-serif",letterSpacing:0,fontWeight:600}}>{hero.level}</span>
          </div>
        </div>
        <button onClick={onClose} className="rm-detail-close" aria-label="Close"
          style={{background:"rgba(60,52,38,0.072)",border:"1px solid rgba(60,52,38,0.264)",borderRadius:3,color:"#4A4335",fontSize:16,fontWeight:700,cursor:"pointer",padding:"6px 12px",display:"flex",alignItems:"center",lineHeight:1,flexShrink:0}}>✗</button>
      </div>
      <div style={{padding:18,overflowY:"auto",height:"calc(100% - 88px)"}}>

      <AgeBar hero={hero}/>
      
      <ContractBar hero={hero}/>
      <XPBar xp={hero.xp} level={hero.level}/>

      {/* Fatigue bar */}
      {(()=>{
        const fat=hero.fatigue||0;
        const {label:fLabel,color:fColor}=fatigueLabel(fat);
        const pct=fat;
        return(
          <div style={{marginBottom:6}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:2}}>
              <span style={{color:fColor,fontWeight:600}}>{fLabel}</span>
              <span style={{color:"#6E6350",fontSize:9}}>{fat}/100 fatigue</span>
            </div>
            <div style={{height:4,background:"#DFD3B8",borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${pct}%`,background:fColor,borderRadius:2,transition:"width 0.5s"}}/>
            </div>
            {fat>=FATIGUE_WARN&&<div style={{fontSize:9,color:fColor,marginTop:2}}>{fat>=FATIGUE_CRITICAL?"Combat effectiveness severely reduced — rest urgently":"Combat effectiveness reduced — consider resting"}</div>}
          </div>
        );
      })()}

      {/* Away on mission */}
      {(hero.awayWeeks||0)>0&&(
        <div style={{padding:"7px 10px",borderRadius:3,background:"rgba(60,90,120,0.105)",border:"1px solid rgba(60,90,120,0.3)",marginBottom:10,fontSize:10,color:"#3C5A78"}}>
          Away: "{hero.awayEvent}" — returns in {hero.awayWeeks} week{hero.awayWeeks>1?"s":""}
        </div>
      )}

      {/* Mentor bonus */}
      {hero.mentorBonus&&hero.mentorBonus.weeksLeft>0&&(
        <div style={{padding:"7px 10px",borderRadius:3,background:"rgba(154,91,43,0.105)",border:"1px solid rgba(154,91,43,0.375)",marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
          <Glyph id="nav_guide" size={14} color="#9A5B2B"/>
          <div style={{flex:1}}>
            <div style={{fontSize:10,fontWeight:700,color:"#9A5B2B"}}>Mentored by {hero.mentorBonus.mentorName}</div>
            <div style={{fontSize:9,color:"#6E6350"}}>+{hero.mentorBonus.xpPerWeek} XP/week · {hero.mentorBonus.weeksLeft} weeks remaining</div>
          </div>
          <div style={{fontSize:12,fontWeight:700,color:"#8A6D3B"}}>+{hero.mentorBonus.xpPerWeek} XP/wk</div>
        </div>
      )}

      {/* Active offers */}
      {heroBids&&heroBids.length>0&&(
        <div style={{marginBottom:10}}>
          {heroBids.map(bid=>(
            <div key={bid.id} style={{padding:"10px 12px",borderRadius:3,background:"rgba(138,109,59,0.09)",border:"1px solid rgba(138,109,59,0.375)",marginBottom:6}}>
              <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:12,color:"#8A6D3B",marginBottom:3}}>Bid from {bid.town}</div>
              <div style={{fontSize:13,fontWeight:900,color:"#40614F",marginBottom:2}}>{bid.offer.toLocaleString()}g <span style={{fontSize:10,color:"#6E6350",fontWeight:400}}>({bid.freeTransfer?"parting fee":`${bid.pctOfValue}% of market value`})</span></div>
              <div style={{fontSize:10,color:"#6E6350",marginBottom:8}}>Interested in: {bid.reason}</div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>onAcceptBid(bid)} style={{flex:1,padding:"7px 0",borderRadius:3,border:"none",cursor:"pointer",background:"#40614F",color:"#F0E8D5",fontWeight:700,fontSize:11,fontFamily:"'Alegreya Sans',sans-serif"}}>✓ Accept {bid.offer.toLocaleString()}g</button>
                <button onClick={()=>onDeclineBid(bid)} style={{flex:1,padding:"7px 0",borderRadius:3,border:"1px solid rgba(126,45,38,0.375)",cursor:"pointer",background:"rgba(126,45,38,0.105)",color:"#7E2D26",fontWeight:700,fontSize:11,fontFamily:"'Alegreya Sans',sans-serif"}}>✗ Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Morale breakdown */}
      <div style={{padding:"8px 10px",borderRadius:3,background:`${hColor}10`,border:`1px solid ${hColor}25`,marginBottom:10,fontSize:10,color:hColor}}>
        <strong>{hLabel}</strong>
        {hero.morale>=80&&" — Squad spirit is high. Performing at their best."}
        {hero.morale>=60&&hero.morale<80&&" — Morale is stable. No major concerns."}
        {hero.morale>=40&&hero.morale<60&&" — Morale is slipping. Address it soon."}
        {hero.morale>=20&&hero.morale<40&&" — Actively unhappy. Performance suffering."}
        {hero.morale<20&&" — On the verge of walking out. Act now."}
        {hero.weeksUnplayed>0&&` Benched ${hero.weeksUnplayed} week(s).`}
      </div>

      {/* Contract forecast */}
      <div style={{padding:"8px 10px",borderRadius:3,background:"rgba(60,52,38,0.054)",border:"1px solid rgba(60,52,38,0.144)",marginBottom:10,fontSize:10,color:"#6E6350"}}>
        <div style={{fontWeight:700,color:"#8A6D3B",marginBottom:3}}>Contract Forecast</div>
        <div>Current salary: <b style={{color:"#23201A"}}>{hero.salary}g/wk</b></div>
        <div>Estimated renewal demand: <b style={{color:"#9A5B2B"}}>{demand.salary}g/wk</b> · {demand.years}s</div>
        {hero.traits?.includes("Greedy")&&<div style={{color:"#7E2D26",marginTop:2}}>Greedy trait: +20% demand</div>}
        {hero.traits?.includes("Loyal")&&<div style={{color:"#40614F",marginTop:2}}>✓ Loyal trait: –12% demand</div>}
        {hero.traits?.includes("Stubborn")&&<div style={{color:"#8A6D3B",marginTop:2}}>Stubborn: won't negotiate down</div>}
        {}
        {(hero.stats["Negotiation"]||0)>30&&(()=>{
          const negStat=hero.stats["Negotiation"]||0;
          const premium=Math.round(Math.min(20,(negStat-20)/79*20));
          const shorterContract = negStat > 40;
          return <div style={{color:"#9A5B2B",marginTop:2}}>Negotiation {negStat}: +{premium}% salary demand{shorterContract?" · prefers short contracts":""}</div>;
        })()}
        {(hero.stats["Reputation"]||0)>30&&(()=>{
          const repStat=hero.stats["Reputation"]||0;
          const bidBonus=Math.round((repStat-20)/79*10);
          return <div style={{color:"#3C5A78",marginTop:2}}>Reputation {repStat}: offers up to +{bidBonus}% value</div>;
        })()}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:10}}>
        {hero.traits.map(t=>{
          const te=TRAIT_EFFECTS[t];
          const col=te?.color||"#5F4B66";
          return(
            <div key={t} style={{padding:"5px 9px",borderRadius:3,background:`${col}12`,border:`1px solid ${col}30`,display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
              <span style={{fontSize:11,fontWeight:700,color:col,fontFamily:"'Alegreya Sans',sans-serif"}}>{t}</span>
              {te?.desc&&<span style={{fontSize:9,color:"#6E6350",textAlign:"right",flex:1}}>{te.desc}</span>}
            </div>
          );
        })}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:10}}>
        {[["Race",`${RACE_ICONS[hero.race]} ${hero.race}`],["Role",`${ROLE_ICONS[hero.role]} ${hero.role}`],
          ["Stage",`${agePhaseLabel(phase)} ${Math.round(hero.stageProgress||0)}%`],["Level",`${hero.level}`],
          ["Salary",`${hero.salary}g/wk`],["Value",`${hero.value.toLocaleString()}g`],
          ["Morale",`${hero.morale}%`],["Status",hero.injured?`${hero.injury?.name||"Injured"} · ${hero.injuryWeeks}w`:"Fit"],
        ].map(([k,v])=>(
          <div key={k} style={{background:"rgba(60,52,38,0.054)",borderRadius:3,padding:"5px 8px"}}>
            <div style={{fontSize:9,color:"#6E6350",marginBottom:1}}>{k}</div>
            <div style={{fontSize:11,fontWeight:700,color:"#23201A"}}>{v}</div>
          </div>
        ))}
      </div>
      {(hero.injured&&hero.injury?.from)||hero.injuryHistory?.length?(
        <div style={{marginBottom:10,padding:"6px 10px",borderRadius:3,background:"rgba(126,45,38,0.09)",border:"1px solid rgba(126,45,38,0.225)",fontSize:9,color:"#6E6350",lineHeight:1.6}}>
          {hero.injured&&hero.injury?.from&&<div style={{color:"#7E2D26"}}>{hero.injury.name} — sustained against {hero.injury.from} (Wk {hero.injury.week})</div>}
          {hero.injuryHistory?.slice(0,3).map((inj,i)=>(
            <div key={i}>{inj.name}{inj.from?` — vs ${inj.from}`:""}{inj.week?` (Wk ${inj.week})`:""}</div>
          ))}
        </div>
      ):null}

      {/* Form & Reputation — bid drivers */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:10}}>
        {(()=>{
          const form = hero.stats.Form || 5;
          const rep  = hero.stats.Reputation || 0;
          const formCol = form>=8?"#40614F":form>=6?"#8A6D3B":form<4?"#7E2D26":"#6E6350";
          const repCol  = rep>=60?"#40614F":rep>=30?"#8A6D3B":"#6E6350";
          const formLabel = form>=9?"In the form of their life":form>=7?"Good form":form>=5?"Average form":form>=3?"Poor form":"Out of form";
          const repLabel  = rep>=70?"Renowned":rep>=50?"Well known":rep>=30?"Building reputation":"Unknown";
          return(<>
            <div style={{background:"rgba(60,52,38,0.054)",borderRadius:3,padding:"7px 8px",border:`1px solid ${formCol}22`}}>
              <div style={{fontSize:9,color:"#6E6350",marginBottom:3}}>Form (offer premium)</div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{flex:1,height:4,background:"rgba(60,52,38,0.108)",borderRadius:2}}>
                  <div style={{width:`${form*10}%`,height:"100%",background:formCol,borderRadius:2,transition:"width 0.3s"}}/>
                </div>
                <span style={{fontSize:10,fontWeight:700,color:formCol}}>{form.toFixed(1)}/10</span>
              </div>
              <div style={{fontSize:9,color:formCol,marginTop:2}}>{formLabel}</div>
              {form>=7&&<div style={{fontSize:8,color:"#6E6350",marginTop:1}}>+{Math.round(((form-7)/3)*25)}% offer premium</div>}
              {form<4&&<div style={{fontSize:8,color:"#9A5B2B",marginTop:1}}>−10% bid discount</div>}
            </div>
            <div style={{background:"rgba(60,52,38,0.054)",borderRadius:3,padding:"7px 8px",border:`1px solid ${repCol}22`}}>
              <div style={{fontSize:9,color:"#6E6350",marginBottom:3}}>Reputation (scout interest)</div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{flex:1,height:4,background:"rgba(60,52,38,0.108)",borderRadius:2}}>
                  <div style={{width:`${rep}%`,height:"100%",background:repCol,borderRadius:2,transition:"width 0.3s"}}/>
                </div>
                <span style={{fontSize:10,fontWeight:700,color:repCol}}>{Math.round(rep)}</span>
              </div>
              <div style={{fontSize:9,color:repCol,marginTop:2}}>{repLabel}</div>
              <div style={{fontSize:8,color:"#6E6350",marginTop:1}}>+0.4 per battle</div>
            </div>
          </>);
        })()}
      </div>
      {declining&&<div style={{padding:"7px 10px",borderRadius:3,background:"rgba(126,45,38,0.105)",border:"1px solid rgba(126,45,38,0.3)",marginBottom:10,fontSize:10,color:"#9A5B2B"}}>{agePhaseLabel(phase)} — consider moving to Arbiter where mental stats carry.</div>}

      {/* Career arc guidance — sell window signal */}
      {(()=>{
        const careerWk = stageToCareerWeek(hero.stage||"peak", hero.stageProgress||0);
        const weeksLeft = Math.max(0, TOTAL_CAREER_WEEKS - careerWk);
        const seasonsLeft = (weeksLeft / 42).toFixed(1);
        const bidFreq = {prospect:0.8,rising:0.9,peak:1.0,fading:0.3,veteran:0.12}[phase]??1.0;
        const bidQual = {prospect:"90%",rising:"95%",peak:"full value",fading:"60%",veteran:"38%"}[phase];
        const isApproachingFade = phase==="peak" && (hero.stageProgress||0) > 70;

        const arcConfig = {
          prospect: { col:"#5F4B66", icon:"", title:"Prospect — Developing", advice:"Play regularly to build Form and Reputation. Value grows quickly with levels.", action:null },
          rising:   { col:"#3C5A78", icon:"", title:"Rising — Good Investment Window", advice:"Stats growing fast. Bids are strong. A few more levels and this hero peaks.", action:null },
          peak:     { col:"#40614F", icon:"", title:"Peak — Prime Selling Window", advice:isApproachingFade?"Late Peak — Fading stage approaching. Sell now for best return.":"Bids are highest and most frequent here. Form 8+ attracts above-market offers.", action:isApproachingFade?"Sell window closing — list soon.":"Consider listing if you have a replacement ready." },
          fading:   { col:"#8A6D3B", icon:"", title:"Fading — Hard to Sell", advice:"Bids are rare (30% base chance) at ~60% of value. Stats declining weekly.", action:"Squad Leader role extracts remaining value — let contract expire naturally." },
          veteran:  { col:"#9A5B2B", icon:"", title:"Veteran — Effectively Unsellable", advice:"Bids very rare (12% chance) at 38% of value. Retirement approaching.", action:"Keep for Squad Leader bonus and mentorship on retirement." },
        }[phase]||{col:"#6E6350",icon:"?",title:"Unknown",advice:"",action:null};

        return(
          <div style={{padding:"9px 11px",borderRadius:3,background:`${arcConfig.col}0d`,border:`1px solid ${arcConfig.col}30`,marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}>
              <span style={{fontSize:14}}>{arcConfig.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:700,color:arcConfig.col,fontFamily:"'Alegreya Sans',sans-serif"}}>{arcConfig.title}</div>
                <div style={{fontSize:9,color:"#6E6350",marginTop:1}}>{seasonsLeft}s until retirement · Bids: {Math.round(bidFreq*100)}% chance · Quality: {bidQual}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:9,color:"#6E6350"}}>Value</div>
                <div style={{fontSize:13,fontWeight:700,color:arcConfig.col}}>{hero.value.toLocaleString()}g</div>
              </div>
            </div>
            <div style={{fontSize:10,color:"#6E6350",lineHeight:1.5,marginBottom:arcConfig.action?5:0}}>{arcConfig.advice}</div>
            {arcConfig.action&&(
              <div style={{fontSize:10,fontWeight:700,color:arcConfig.col,padding:"4px 8px",borderRadius:3,background:`${arcConfig.col}14`,marginTop:3}}>
                {arcConfig.action}
              </div>
            )}
          </div>
        );
      })()}
      <div style={{display:"flex",gap:3,marginBottom:10,flexWrap:"wrap"}}>
        {Object.keys(STAT_GROUPS).map(g=>{
          const isHidden = g === "Hidden";
          const isLocked = isHidden && !showHiddenStats;
          const isActive = tab === g;
          return (
            <button key={g} onClick={()=>!isLocked&&setTab(g)}
              style={{flex:1,minWidth:55,padding:"5px 0",borderRadius:3,border:isLocked?"1px solid rgba(60,52,38,0.108)":"none",
                cursor:isLocked?"default":"pointer",fontSize:9,
                background:isActive?"rgba(60,90,120,0.225)":isLocked?"rgba(60,52,38,0.036)":"rgba(60,52,38,0.072)",
                color:isActive?"#3C5A78":isLocked?"#A39781":"#7A6F58",
                fontWeight:isActive?700:400,
              }}>
              {isLocked ? "Hidden" : g}
            </button>
          );
        })}
      </div>
      {tab==="Hidden"&&!showHiddenStats ? null :
        tab==="Hidden" ? (
          <div>
            {/* Potential — bucket until revealed, exact with showHiddenStats */}
            <div style={{marginBottom:8,padding:"8px 10px",borderRadius:3,background:"rgba(138,109,59,0.075)",border:"1px solid rgba(138,109,59,0.225)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <span style={{fontSize:11,color:"#8A6D3B",fontWeight:700}}>Potential</span>
                {(hero.potentialRevealed || showHiddenStats) ? (()=>{
                  const b = potentialBucket(hero.stats.Potential);
                  return(
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:11,fontWeight:700,color:b.color}}>{b.label}</span>
                      {showHiddenStats&&<span style={{fontSize:10,color:"#6E6350"}}>({hero.stats.Potential})</span>}
                    </div>
                  );
                })() : (
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:10,color:"#6E6350"}}>Unknown</span>
                    <span style={{fontSize:9,color:"#8A7F68"}}>{Math.max(0,8-(hero.weeksInFormation||0))}+ battles to reveal</span>
                  </div>
                )}
              </div>
              {!hero.potentialRevealed&&(
                <div style={{height:3,borderRadius:2,background:"#DFD3B8",overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${Math.min(100,((hero.weeksInFormation||0)/9)*100)}%`,background:"#5F4B66",borderRadius:2,transition:"width 0.5s"}}/>
                </div>
              )}
            </div>
            {/* Form */}
            <StatBar label="Form" value={hero.stats.Form} prev={prevStats?.Form}/>
          </div>
        ) :
        STAT_GROUPS[tab].map(s=>(
          <StatBar key={s} label={s} value={hero.stats[s]} prev={prevStats?.[s]}
            base={hero.baseStats?.[s]}
            highlight={s==="Potential"}
            dimmed={declining&&PHYSICAL_STATS.includes(s)}/>
        ))
      }

      {/* Squad Leader — only for heroes you actually own */}
      {isOwned&&(()=>{
        const score=calcLeaderScore(hero);
        const mult=calcLeaderMult(hero);
        const lb=calcLeaderBonuses(hero);
        const scorePct=Math.round(score*100);
        const col=isLeader?"#8A6D3B":score>0.5?"#3C5A78":"#8A7F68";
        return(
          <div style={{marginBottom:10,padding:"10px 12px",borderRadius:3,
            background:isLeader?"rgba(138,109,59,0.105)":"rgba(60,52,38,0.054)",
            border:`1px solid ${isLeader?"rgba(138,109,59,0.45)":"rgba(60,52,38,0.126)"}`}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <Glyph id="leader" size={16} color={isLeader?"#8A6D3B":"#8A7F68"}/>
              <div style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:700,color:isLeader?"#8A6D3B":"#6E6350",fontFamily:"'Alegreya Sans',sans-serif"}}>
                  {isLeader?"Squad Leader":"Squad Leader Candidate"}
                </div>
                <div style={{fontSize:9,color:"#6E6350"}}>
                  Leadership score: {scorePct}% · ×{mult.toFixed(2)} bonus
                  <span style={{marginLeft:6,color:"#6E6350"}}>
                    ({Math.round((hero.weeksInSquad||0))} wks in squad · {agePhaseLabel(phase)} {Math.round(hero.stageProgress||0)}%)
                  </span>
                </div>
              </div>
            </div>
            {/* Bonus breakdown */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4,marginBottom:8}}>
              {[
                ["Morale/wk",`+${lb.moralePerWeek}`,"#40614F"],
                ["XP mult",`×${lb.xpMult.toFixed(2)}`,"#3C5A78"],
                ["Defeat",`−${lb.defeatMoralePct}%`,"#8A6D3B"],
              ].map(([label,val,c])=>(
                <div key={label} style={{padding:"4px 6px",borderRadius:3,background:"rgba(30,24,14,0.07)",textAlign:"center"}}>
                  <div style={{fontSize:8,color:"#6E6350"}}>{label}</div>
                  <div style={{fontSize:11,fontWeight:700,color:c}}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:9,color:"#6E6350",marginBottom:6}}>Bonuses apply only when in formation</div>
            <button onClick={onSetLeader}
              style={{width:"100%",padding:"6px 0",borderRadius:3,border:`1px solid ${isLeader?"rgba(138,109,59,0.55)":"rgba(60,52,38,0.264)"}`,
                cursor:"pointer",background:isLeader?"rgba(138,109,59,0.15)":"rgba(60,52,38,0.072)",
                color:isLeader?"#8A6D3B":"#6E6350",fontWeight:700,fontSize:10,fontFamily:"'Alegreya Sans',sans-serif"}}>
              {isLeader?"Remove as Squad Leader":"Appoint as Squad Leader"}
            </button>
          </div>
        );
      })()}

      {/* Retraining — change role to a lane the stats now favour */}
      {isOwned&&onRetrain&&(()=>{
        const trainyardBuilt=retrainBuildings?.some(b=>b.id==="trainyard"&&b.built);
        if(!trainyardBuilt) return null;
        const homeLane=naturalLaneFor(hero.role);
        if(hero.retraining){
          return(
            <div style={{marginTop:14,padding:"12px 14px",borderRadius:3,background:"rgba(60,90,120,0.09)",border:"1px solid rgba(60,90,120,0.3)"}}>
              <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:11,color:"#3C5A78",letterSpacing:0.5,textTransform:"uppercase"}}>Retraining</div>
              <div style={{fontSize:10,color:"#4A4335",marginTop:4}}>
                Away at the Training Grounds — returns as a <b>{hero.retraining.toRole}</b> in {hero.awayWeeks} week{hero.awayWeeks!==1?"s":""}.
              </div>
            </div>
          );
        }
        const chk=canRetrain(hero,retrainGold,retrainSeason,retrainBuildings);
        const suggested=bestPositionFor(hero);
        const options=POS_KEYS.filter(p=>p!==homeLane).flatMap(p=>POSITIONS[p].ideal.map(role=>({role,lane:p})));
        return(
          <div style={{marginTop:14,padding:"12px 14px",borderRadius:3,background:"rgba(60,52,38,0.036)",border:"1px solid rgba(60,52,38,0.144)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:8}}>
              <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:11,color:"#6E6350",letterSpacing:0.5,textTransform:"uppercase"}}>Retraining</div>
              <div style={{fontSize:10,fontWeight:700,color:"#77653F"}}>{retrainCost(hero).toLocaleString()}g · {RETRAIN_WEEKS}w away</div>
            </div>
            {suggested!==homeLane&&(
              <div style={{fontSize:10,color:"#40614F",marginTop:4}}>⊕ Stats favour the {suggested} lane — a strong candidate.</div>
            )}
            {!chk.ok&&<div style={{fontSize:10,color:"#9A5B2B",marginTop:4}}>{chk.reason}</div>}
            {chk.ok&&(
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
                {options.map(({role,lane})=>(
                  <button key={role} onClick={()=>onRetrain(hero,role)}
                    style={{flex:"1 1 40%",padding:"7px 0",borderRadius:3,cursor:"pointer",
                      border:`1px solid ${lane===suggested?"rgba(64,97,79,0.55)":"rgba(60,52,38,0.264)"}`,
                      background:lane===suggested?"rgba(64,97,79,0.09)":"rgba(60,52,38,0.054)",
                      color:lane===suggested?"#40614F":"#4A4335",
                      fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:10}}>
                    → {role}<span style={{fontWeight:500,opacity:0.75}}> · {lane}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Transfer / release buttons — only for heroes you actually own */}
      {isOwned&&(
      <div style={{marginTop:10,display:"flex",gap:6,flexWrap:"wrap"}}>
        {onToggleListed&&(
          <button onClick={()=>onToggleListed(hero)} style={{flex:1,padding:"7px 0",borderRadius:3,border:`1px solid ${isListed?"rgba(138,109,59,0.55)":"rgba(60,52,38,0.33)"}`,background:isListed?"rgba(138,109,59,0.15)":"rgba(60,52,38,0.072)",color:isListed?"#8A6D3B":"#6E6350",cursor:"pointer",fontWeight:700,fontSize:11,fontFamily:"'Alegreya Sans',sans-serif"}}>
            {isListed?"Close to Offers":"Open to Offers"}
          </button>
        )}
        {/* Early renewal — available within 2 seasons of expiry, not already pending */}
        {onEarlyRenew && !hero.negotiationPending && (hero.contractWeeksLeft||0) > 0 && (hero.contractWeeksLeft||0) <= WEEKS_PER_CONTRACT_YEAR*2 && (
          <button onClick={()=>onEarlyRenew(hero)} style={{flex:1,padding:"7px 0",borderRadius:3,border:"1px solid rgba(60,90,120,0.45)",background:"rgba(60,90,120,0.105)",color:"#3C5A78",cursor:"pointer",fontWeight:700,fontSize:11,fontFamily:"'Alegreya Sans',sans-serif"}}>
            Renew Early
          </button>
        )}
        <button onClick={()=>{
          const contractExpired = (hero.contractWeeksLeft||0) === 0;
          if(contractExpired){
            if(window.confirm(`Release ${hero.name}?\n\nContract has expired — no morale penalty.`)) onRelease(hero);
            return;
          }
          const tenureBonus=Math.floor((hero.weeksInSquad||0)/50)*5;
          const levelBonus=Math.max(0,(hero.level-4))*5;
          const inspiringBonus=hero.traits?.includes("Inspiring")?8:0;
          const leaderBonus=isLeader?5:0;
          const basePenalty=hero.fodder?3:15;
          const penalty=Math.min(40,basePenalty+tenureBonus+levelBonus+inspiringBonus+leaderBonus);
          const msg=hero.fodder
            ?`Release ${hero.name}? They'll barely be missed.`
            :`Release ${hero.name}?\n\nSquad morale penalty: −${penalty} to all heroes${penalty>=25?" (devastating)":penalty>=15?" (significant)":""}\n\nThis is a last resort. Consider selling them instead.`;
          if(window.confirm(msg)) onRelease(hero);
        }} style={{flex:1,padding:"7px 0",borderRadius:3,border:"1px solid rgba(126,45,38,0.375)",background:"rgba(126,45,38,0.12)",color:"#7E2D26",cursor:"pointer",fontWeight:700,fontSize:11,fontFamily:"'Alegreya Sans',sans-serif"}}>Release</button>
      </div>
      )}

      {/* Redundant escape at the end of the sheet — on mobile the panel is a
          full-screen overlay above the bottom nav, so a reader who scrolled to
          the bottom always has a way back without hunting for the header ✗. */}
      <button onClick={onClose}
        style={{width:"100%",marginTop:14,padding:"11px 0",borderRadius:3,border:"1px solid rgba(60,52,38,0.264)",cursor:"pointer",background:"rgba(60,52,38,0.072)",color:"#4A4335",fontWeight:700,fontSize:11,fontFamily:"'Alegreya Sans',sans-serif"}}>
        ✗ Close
      </button>
      </div>{/* end scroll wrapper */}
    </div>
  );
}

// ─── NEGOTIATION MODAL ───────────────────────────────────────────────────────

// One-sitting haggle. Session state (their current ask, remaining patience)
// lives here and resets per hero — deliberately NOT persisted: a reload
// restarts the sitting fresh. Patience is shown only as a worded mood, never
// a count (a visible counter would make max-haggling free). All responses
// come from the deterministic negotiationRespond engine.
function NegotiationModal({pending, heroes, onSign, onCollapse, onPostpone, onSting}){
  const first = pending && pending.length>0 ? pending[0] : null;
  // Resolve the LIVE hero — queue entries are snapshots from when they were
  // queued, and demands must reflect current level/morale/stats
  const hero = first ? ((heroes||[]).find(h=>h.id===first.id)||first) : null;

  const [session,setSession] = useState(null); // {heroId, originalDemand, demand, patienceLeft, patienceMax, offer, lastOutcome}
  useEffect(()=>{
    if(!hero) { setSession(null); return; }
    if(session?.heroId===hero.id) return;
    const d = calcDemand(hero);
    const prof = negotiationProfile(hero);
    setSession({ heroId:hero.id, originalDemand:d, demand:d, patienceLeft:prof.patience, patienceMax:prof.patience,
      offer:{salary:d.salary, years:d.years}, lastOutcome:null });
  },[hero?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if(!hero||!session||session.heroId!==hero.id) return null;

  const { demand, originalDemand, patienceLeft, offer } = session;
  const expired = (hero.contractWeeksLeft||0)<=0;
  const finalTerms = patienceLeft<=0;
  const {label:mLabel, color:hColor}=moraleLabel(hero.morale);
  const w = negotiationWillingness(hero, demand, offer);
  const zone = w>=NEGOTIATION_SIGN_AT ? "sign" : w>=NEGOTIATION_INSULT_BELOW ? "haggle" : "insult";
  const salaryStep = Math.max(5, Math.round(originalDemand.salary*0.025/5)*5);
  const conceded = demand.salary < originalDemand.salary;
  const departLine = expired ? "they depart when the week ends" : `they depart when their contract ends (${hero.contractWeeksLeft}w)`;

  const mood = patienceLeft>=3 ? `${hero.name.split(" ")[0]} is listening — open to fair terms.`
    : patienceLeft===2 ? "Engaged, but their patience is thinning."
    : patienceLeft===1 ? "Growing restless — another poor offer could end these talks."
    : "";

  const setOffer=(patch)=>setSession(s=>({...s, offer:{...s.offer, ...patch}}));
  const makeOffer=()=>{
    const r = negotiationRespond(hero, demand, originalDemand, offer, patienceLeft);
    if(r.outcome==="sign"){ onSign(hero, {salary:offer.salary, years:offer.years}); return; }
    if(r.moraleDelta) onSting(hero, r.moraleDelta);
    setSession(s=>({...s, demand:r.newDemand, patienceLeft:s.patienceLeft-r.patienceCost, lastOutcome:r.outcome}));
  };

  const verdict = zone==="sign" ? "They would sign these terms."
    : zone==="haggle" ? "They would haggle — expect them to come down."
    : "Insulting — offering this will sour the room.";

  const stepper=(label, value, onMinus, onPlus, display)=>(
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
      <span style={{fontSize:10,color:"#4A4335",width:52,flexShrink:0}}>{label}</span>
      <button onClick={onMinus} style={{width:30,height:30,border:"1px solid #A39781",borderRadius:3,background:"rgba(60,52,38,0.05)",color:"#4A4335",fontSize:14,cursor:"pointer",flexShrink:0}}>−</button>
      <div style={{flex:1,textAlign:"center",fontSize:13,fontWeight:700,color:"#23201A"}}>{display??value}</div>
      <button onClick={onPlus} style={{width:30,height:30,border:"1px solid #A39781",borderRadius:3,background:"rgba(60,52,38,0.05)",color:"#4A4335",fontSize:14,cursor:"pointer",flexShrink:0}}>+</button>
    </div>
  );

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(30,24,14,0.56)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)",overflowY:"auto",padding:"16px 0"}}>
      <div className="rm-neg-modal" style={{background:"#DFD3B8",border:"1px solid rgba(154,91,43,0.525)",borderRadius:3,padding:"22px 24px",maxWidth:500,width:"92%",boxShadow:"0 2px 12px rgba(60,52,38,0.3)",maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{fontFamily:"'IM Fell English SC',serif",fontWeight:900,fontSize:18,color:finalTerms?"#7E2D26":"#8A6D3B",marginBottom:4}}>{finalTerms?"Final Terms":"Contract Negotiation"}</div>
        <div style={{fontSize:11,color:"#6E6350",marginBottom:14}}>
          {hero.name} {expired
            ? <>— contract <b style={{color:"#7E2D26"}}>expired</b>. No deal this week and they depart.</>
            : <>seeks a new contract · expires in {hero.contractWeeksLeft}w</>}
        </div>

        <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:14,padding:"10px 12px",background:"rgba(60,52,38,0.054)",borderRadius:3,border:"1px solid rgba(60,52,38,0.126)"}}>
          <HeroAvatar race={hero.race} size={28}/>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'IM Fell English SC',serif",fontWeight:700,fontSize:14,color:"#23201A"}}>{hero.name}</div>
            <div style={{fontSize:11,color:"#6E6350"}}>{hero.race} <RoleIcon role={hero.role}/> {hero.role} · Level {hero.level} · {agePhaseLabel(agePhase(hero))} · <span style={{color:hColor}}>{mLabel} ({hero.morale})</span></div>
            <div style={{display:"flex",flexWrap:"wrap",gap:3,marginTop:4}}>
              {hero.traits.map(t=><span key={t} style={{fontSize:9,background:"rgba(95,75,102,0.15)",color:"#5F4B66",padding:"1px 6px",borderRadius:3}}>{t}</span>)}
            </div>
          </div>
        </div>

        {/* Willingness gauge — the player's one precise instrument */}
        <div style={{fontSize:9,letterSpacing:1.5,color:"#8A6D3B",fontWeight:700,marginBottom:4}}>WILLINGNESS TO SIGN</div>
        <div style={{height:10,background:"rgba(60,52,38,0.12)",border:"1px solid rgba(60,52,38,0.25)",borderRadius:2,position:"relative",marginBottom:3}}>
          <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${w}%`,background:zone==="sign"?"#40614F":zone==="haggle"?"#8A6D3B":"#7E2D26",transition:"width 0.25s"}}/>
          <div style={{position:"absolute",top:-2,bottom:-2,width:1,background:"#7E2D26",left:`${NEGOTIATION_SIGN_AT}%`}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:8,color:"#6E6350",marginBottom:10}}>
          <span>insulting</span><span>would haggle</span><span>would sign ›</span>
        </div>

        {/* Mood — worded patience, never a count */}
        {!finalTerms&&(
          <div style={{fontSize:11,color:patienceLeft===1?"#9A5B2B":"#4A4335",marginBottom:12,padding:"6px 9px",background:patienceLeft===1?"rgba(154,91,43,0.07)":"rgba(60,52,38,0.05)",borderRadius:3}}>
            {session.lastOutcome==="insulted"&&<b>That offer soured the room. </b>}{mood}
          </div>
        )}
        {finalTerms&&(
          <div style={{fontSize:11,color:"#7E2D26",marginBottom:12,padding:"7px 10px",background:"rgba(126,45,38,0.08)",border:"1px solid rgba(126,45,38,0.25)",borderRadius:3}}>
            Their patience is <b>spent</b> — this is their final offer. Refuse and they never re-sign: {departLine}.
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
          <div style={{background:"rgba(60,52,38,0.054)",borderRadius:3,padding:"8px 10px",border:"1px solid rgba(60,52,38,0.126)"}}>
            <div style={{fontSize:9,color:"#6E6350",marginBottom:2}}>{finalTerms?"FINAL OFFER":"THEIR ASK"}{conceded?` (came down from ${originalDemand.salary}g)`:""}</div>
            <div style={{fontSize:14,fontWeight:700,color:demand.salary>hero.salary?"#9A5B2B":"#40614F"}}>{demand.salary}g/wk · {demand.years}s</div>
          </div>
          <div style={{background:"rgba(60,52,38,0.054)",borderRadius:3,padding:"8px 10px",border:"1px solid rgba(60,52,38,0.126)"}}>
            <div style={{fontSize:9,color:"#6E6350",marginBottom:2}}>CURRENT</div>
            <div style={{fontSize:14,fontWeight:700,color:"#23201A"}}>{hero.salary}g/wk</div>
          </div>
        </div>

        {!finalTerms&&(
          <div style={{background:"rgba(138,109,59,0.08)",border:"1px solid rgba(138,109,59,0.35)",borderRadius:3,padding:"10px 12px",marginBottom:12}}>
            <div style={{fontSize:9,letterSpacing:1.5,color:"#8A6D3B",fontWeight:700,marginBottom:8}}>YOUR OFFER</div>
            {stepper("Salary", offer.salary,
              ()=>setOffer({salary:Math.max(salaryStep, offer.salary-salaryStep)}),
              ()=>setOffer({salary:offer.salary+salaryStep}),
              `${offer.salary}g/wk`)}
            {stepper("Length", offer.years,
              ()=>setOffer({years:Math.max(1, offer.years-1)}),
              ()=>setOffer({years:Math.min(4, offer.years+1)}),
              `${offer.years} season${offer.years>1?"s":""}`)}
            <div style={{fontSize:10,color:"#6E6350",textAlign:"center",marginTop:2}}>Total: {(offer.salary*WEEKS_PER_CONTRACT_YEAR*offer.years).toLocaleString()}g over {offer.years} season{offer.years>1?"s":""}</div>
            <div style={{fontSize:10,fontWeight:700,textAlign:"center",marginTop:3,color:zone==="sign"?"#40614F":zone==="haggle"?"#8A6D3B":"#7E2D26"}}>{verdict}</div>
          </div>
        )}

        {hero.traits?.includes("Loyal")&&<div style={{fontSize:10,color:"#40614F",background:"rgba(64,97,79,0.105)",padding:"6px 10px",borderRadius:3,marginBottom:8}}>✓ Loyal: patient at the table and concedes generously.</div>}
        {hero.traits?.includes("Greedy")&&<div style={{fontSize:10,color:"#7E2D26",background:"rgba(126,45,38,0.105)",padding:"6px 10px",borderRadius:3,marginBottom:8}}>Greedy: will barely move off their ask.</div>}
        {hero.traits?.includes("Stubborn")&&<div style={{fontSize:10,color:"#9A5B2B",background:"rgba(154,91,43,0.105)",padding:"6px 10px",borderRadius:3,marginBottom:8}}>Stubborn: take it or leave it — they won't haggle.</div>}
        {hero.traits?.includes("Hot-headed")&&<div style={{fontSize:10,color:"#9A5B2B",background:"rgba(154,91,43,0.105)",padding:"6px 10px",borderRadius:3,marginBottom:8}}>Hot-headed: quick to take offence at the table.</div>}

        {!finalTerms?(
          <>
            <div className="rm-neg-buttons" style={{display:"flex",gap:8,marginBottom:8}}>
              <button onClick={makeOffer} style={{flex:1.3,padding:"10px 0",borderRadius:3,border:"none",cursor:"pointer",background:"#8A6D3B",color:"#F0E8D5",fontWeight:900,fontSize:12,fontFamily:"'Alegreya Sans',sans-serif"}}>
                Make Offer<br/><span style={{fontSize:9,fontWeight:400}}>{offer.salary}g/wk · {offer.years}s</span>
              </button>
              <button onClick={()=>onSign(hero,{salary:demand.salary,years:demand.years})} style={{flex:1,padding:"10px 0",borderRadius:3,border:"none",cursor:"pointer",background:"#40614F",color:"#F0E8D5",fontWeight:700,fontSize:12,fontFamily:"'Alegreya Sans',sans-serif"}}>
                Meet Ask<br/><span style={{fontSize:9,fontWeight:400}}>{demand.salary}g/wk · {demand.years}s</span>
              </button>
            </div>
            <button onClick={()=>onCollapse(hero)}
              style={{width:"100%",padding:"8px 0",borderRadius:3,border:"1px solid rgba(126,45,38,0.45)",cursor:"pointer",background:"rgba(126,45,38,0.1)",color:"#7E2D26",fontWeight:700,fontSize:10,fontFamily:"'Alegreya Sans',sans-serif"}}>
              End Talks — they will never re-sign
            </button>
            {!expired&&(
              <button onClick={()=>onPostpone(hero)}
                style={{width:"100%",marginTop:8,padding:"7px 0",borderRadius:3,border:"1px solid rgba(60,52,38,0.22)",cursor:"pointer",background:"rgba(60,52,38,0.045)",color:"#6E6350",fontWeight:700,fontSize:10,fontFamily:"'Alegreya Sans',sans-serif"}}>
                Postpone Talks — they'll notice (−4 morale)
              </button>
            )}
          </>
        ):(
          <>
            <button onClick={()=>onSign(hero,{salary:demand.salary,years:demand.years})}
              style={{width:"100%",padding:"11px 0",borderRadius:3,border:"none",cursor:"pointer",background:"#40614F",color:"#F0E8D5",fontWeight:900,fontSize:13,fontFamily:"'Alegreya Sans',sans-serif",marginBottom:8}}>
              Sign Final Offer<br/><span style={{fontSize:9,fontWeight:400}}>{demand.salary}g/wk · {demand.years} season{demand.years>1?"s":""}</span>
            </button>
            <button onClick={()=>onCollapse(hero)}
              style={{width:"100%",padding:"8px 0",borderRadius:3,border:"1px solid rgba(126,45,38,0.45)",cursor:"pointer",background:"rgba(126,45,38,0.1)",color:"#7E2D26",fontWeight:700,fontSize:10,fontFamily:"'Alegreya Sans',sans-serif"}}>
              Refuse — {departLine} (still sellable until then)
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── NEW OFFERS MODAL ────────────────────────────────────────────────────────
// Fires right after new transfer bids arrive so the player can't miss them.
// Offers stay in `transferBids` even after the modal is dismissed, so the
// Hire tab remains the canonical place to review bids over their full window.

function NewOffersModal({ bids, heroes, onAccept, onDecline, onViewHero, onDismiss }) {
  useEscapeKey(onDismiss, !!(bids && bids.length));
  if (!bids || bids.length === 0) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(30,24,14,0.525)",zIndex:160,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)",padding:20}}
      onClick={onDismiss}>
      <div onClick={e=>e.stopPropagation()}
        style={{background:"#EFE7D3",border:"1px solid rgba(64,97,79,0.525)",borderRadius:3,width:"min(620px,96vw)",maxHeight:"85vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 2px 12px rgba(60,52,38,0.3)"}}>
        <div style={{padding:"14px 18px",borderBottom:"1px solid rgba(60,52,38,0.108)",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <span style={{fontSize:22}}></span>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'IM Fell English SC',serif",fontWeight:900,fontSize:15,color:"#40614F"}}>
              {bids.length===1?"A Rival Offer Arrives":`${bids.length} Offers from Rival Realms`}
            </div>
            <div style={{fontSize:10,color:"#6E6350"}}>Envoys ride in with pledges of gold for your heroes. Act now or review them later in the Hire tab.</div>
          </div>
        </div>
        <div style={{overflowY:"auto",padding:"12px 16px",flex:1,display:"flex",flexDirection:"column",gap:10}}>
          {bids.map(bid => {
            const hero = heroes.find(h=>h.id===bid.heroId);
            if (!hero) return null;
            const phase = agePhase(hero);
            const aboveValue = !bid.freeTransfer && bid.offer > bid.marketValue;
            return (
              <div key={bid.id}
                style={{borderRadius:3,overflow:"hidden",
                  border:`1px solid ${bid.freeTransfer?"rgba(95,75,102,0.45)":aboveValue?"rgba(64,97,79,0.55)":"rgba(64,97,79,0.3)"}`,
                  background:bid.freeTransfer?"rgba(95,75,102,0.075)":aboveValue?"rgba(64,97,79,0.075)":"rgba(60,52,38,0.045)"}}>
                {aboveValue&&(
                  <div style={{padding:"4px 12px",fontSize:10,color:"#40614F",fontWeight:700,background:"rgba(64,97,79,0.15)",borderBottom:"1px solid rgba(64,97,79,0.3)"}}>
                    Above Market Value
                  </div>
                )}
                {bid.freeTransfer&&(
                  <div style={{padding:"4px 12px",fontSize:10,color:"#5F4B66",fontWeight:700,background:"rgba(95,75,102,0.15)",borderBottom:"1px solid rgba(95,75,102,0.3)"}}>
                    Honourable Release — take the parting fee and skip the morale hit of a release
                  </div>
                )}
                <div style={{padding:"10px 12px",display:"flex",alignItems:"center",gap:10}}>
                  <HeroAvatar race={hero.race} size={20}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:12,color:"#23201A"}}>{hero.name}</div>
                    <div style={{fontSize:9,color:"#6E6350"}}>{hero.role} · Lv {hero.level} · {agePhaseLabel(phase)}</div>
                    <div style={{fontSize:9,color:"#6E6350",fontStyle:"italic",marginTop:2}}>"{bid.town} — {bid.reason}"</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:18,fontWeight:900,color:"#40614F",fontFamily:"'IM Fell English SC',serif",lineHeight:1}}>{bid.offer.toLocaleString()}g</div>
                    {!bid.freeTransfer && bid.pctOfValue!=null && <div style={{fontSize:9,color:"#6E6350"}}>{bid.pctOfValue}% of value</div>}
                  </div>
                </div>
                <div style={{padding:"0 12px 10px",display:"flex",gap:6}}>
                  <button onClick={()=>onAccept(bid)}
                    style={{flex:2,padding:"8px 0",borderRadius:3,border:"none",cursor:"pointer",background:"#40614F",color:"#F0E8D5",fontWeight:900,fontSize:11,fontFamily:"'Alegreya Sans',sans-serif"}}>
                    ✓ Accept {bid.offer.toLocaleString()}g
                  </button>
                  <button onClick={()=>onViewHero&&onViewHero(hero)}
                    style={{flex:1,padding:"8px 0",borderRadius:3,border:"1px solid rgba(60,90,120,0.375)",cursor:"pointer",background:"rgba(60,90,120,0.09)",color:"#3C5A78",fontWeight:700,fontSize:11,fontFamily:"'Alegreya Sans',sans-serif"}}>
                    View
                  </button>
                  <button onClick={()=>onDecline(bid)}
                    style={{flex:1,padding:"8px 0",borderRadius:3,border:"1px solid rgba(126,45,38,0.375)",cursor:"pointer",background:"rgba(126,45,38,0.105)",color:"#7E2D26",fontWeight:700,fontSize:11,fontFamily:"'Alegreya Sans',sans-serif"}}>
                    ✗ Decline
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{padding:"10px 16px",borderTop:"1px solid rgba(60,52,38,0.09)",flexShrink:0}}>
          <button onClick={onDismiss}
            style={{width:"100%",padding:"9px 0",borderRadius:3,border:"1px solid rgba(60,52,38,0.264)",cursor:"pointer",background:"rgba(60,52,38,0.072)",color:"#4A4335",fontWeight:700,fontSize:11,fontFamily:"'Alegreya Sans',sans-serif"}}>
            Decide later (offers stay in the Hire tab for 2 weeks)
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── RETIREMENT MODAL ────────────────────────────────────────────────────────

// ─── SEASON SUMMARY MODAL ────────────────────────────────────────────────────
// Fires at the end of every regular season (not Platinum championship or
// bankruptcy — those pipe into the Legacy Ceremony instead). Gives the player
// a retrospective: W/L, tier movement, hero progression, buildings, ledger.

function SeasonSummaryModal({ summary, onDismiss, townColor }) {
  useEscapeKey(onDismiss, !!summary);
  if (!summary) return null;
  const { season, wins, losses, tier, finalPosition, movement, newTier, levelUps, newSignings, departures, buildingsBuilt, finances } = summary;
  const tierMeta = TIERS[tier] || TIERS.iron;
  const newTierMeta = TIERS[newTier] || tierMeta;
  const totalIncome = (finances.tribute||0) + (finances.raidGold||0) + (finances.eventGold||0);
  const totalSpend  = (finances.wages||0) + (finances.signingCosts||0);
  const netGold     = totalIncome - totalSpend;
  const posLabel    = `${finalPosition}${['st','nd','rd'][finalPosition-1]||'th'}`;
  const movementConfig = {
    promoted:         {icon:"", label:`Promoted to ${newTierMeta.name}`, color:"#40614F"},
    relegated:        {icon:"", label:`Relegated to ${newTierMeta.name}`, color:"#9A5B2B"},
    relegated_floor:  {icon:"",  label:"Held at the Iron floor", color:"#9A5B2B"},
    safe:             {icon:"",  label:`Held position in ${tierMeta.name}`, color:"#3C5A78"},
  }[movement] || {icon:"", label:"Season complete", color:"#6E6350"};

  const ledgerRows = [
    ["Tribute",          finances.tribute||0,       "#3C5A78"],
    ["Battle winnings",   finances.raidGold||0,      (finances.raidGold||0)>=0?"#40614F":"#7E2D26"],
    (finances.eventGold||0) ? ["Events",            finances.eventGold,        "#5F4B66"] : null,
    ["Wages",            -(finances.wages||0),      "#9A5B2B"],
    (finances.signingCosts||0) ? ["Signings",       -(finances.signingCosts||0),"#7E2D26"] : null,
  ].filter(Boolean);

  const col = townColor || "#8A6D3B";

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(30,24,14,0.595)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)",padding:20}}>
      <div style={{width:"min(640px,96vw)",maxHeight:"90vh",background:"#EFE7D3",border:`1px solid ${col}44`,borderRadius:3,overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:`0 0 60px ${col}14`}}>
        {/* Header */}
        <div style={{padding:"18px 22px",textAlign:"center",background:"linear-gradient(180deg,rgba(60,52,38,0.054),transparent)",borderBottom:"1px solid rgba(60,52,38,0.108)"}}>
          <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:11,color:"#6E6350",letterSpacing:2,marginBottom:4}}>SEASON {season} · {tierMeta.icon} {tierMeta.name.toUpperCase()}</div>
          <div style={{fontFamily:"'IM Fell English SC',serif",fontWeight:900,fontSize:26,color:col,lineHeight:1,marginBottom:6}}>
            {wins}W · {losses}L · Finished {posLabel}
          </div>
          <div style={{fontSize:13,fontWeight:700,color:movementConfig.color,fontFamily:"'Alegreya Sans',sans-serif"}}>
            {movementConfig.label}
          </div>
        </div>

        <div style={{overflowY:"auto",padding:"16px 20px",flex:1}}>
          {/* Hero progression */}
          {(levelUps.length > 0 || newSignings.length > 0 || departures.length > 0) && (
            <div style={{marginBottom:16}}>
              <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:11,color:"#6E6350",fontWeight:700,letterSpacing:1,marginBottom:8}}>HERO PROGRESSION</div>
              {levelUps.length > 0 && (
                <div style={{marginBottom:8}}>
                  <div style={{fontSize:10,color:"#40614F",fontWeight:700,marginBottom:4}}>Level-ups · {levelUps.length}</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:4}}>
                    {levelUps.map((h,i) => (
                      <div key={i} style={{padding:"4px 8px",borderRadius:3,background:"rgba(64,97,79,0.075)",border:"1px solid rgba(64,97,79,0.225)",fontSize:11,color:"#23201A"}}>
                        {h.name} <span style={{color:"#6E6350"}}>L{h.oldLevel}→L{h.newLevel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {newSignings.length > 0 && (
                <div style={{marginBottom:8}}>
                  <div style={{fontSize:10,color:"#3C5A78",fontWeight:700,marginBottom:4}}>Signed this season · {newSignings.length}</div>
                  <div style={{fontSize:11,color:"#4A4335",lineHeight:1.5}}>{newSignings.map(h=>h.name).join(" · ")}</div>
                </div>
              )}
              {departures.length > 0 && (
                <div>
                  <div style={{fontSize:10,color:"#9A5B2B",fontWeight:700,marginBottom:4}}>Departed · {departures.length}</div>
                  <div style={{fontSize:11,color:"#4A4335",lineHeight:1.5}}>{departures.map(h=>h.name).join(" · ")}</div>
                </div>
              )}
            </div>
          )}

          {/* Buildings */}
          {buildingsBuilt.length > 0 && (
            <div style={{marginBottom:16}}>
              <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:11,color:"#6E6350",fontWeight:700,letterSpacing:1,marginBottom:8}}>TOWN UPGRADES</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:4}}>
                {buildingsBuilt.map(id => {
                  const b = BUILDINGS.find(x => x.id === id);
                  if (!b) return null;
                  return (
                    <div key={id} style={{padding:"6px 10px",borderRadius:3,background:"rgba(64,97,79,0.06)",border:"1px solid rgba(64,97,79,0.225)",display:"flex",alignItems:"center",gap:6}}>
                      <BuildingIcon id={b.id} size={14}/>
                      <span style={{fontSize:11,color:"#23201A",fontWeight:700}}>{b.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ledger */}
          <div style={{marginBottom:10}}>
            <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:11,color:"#6E6350",fontWeight:700,letterSpacing:1,marginBottom:8}}>LEDGER</div>
            <div style={{padding:"10px 12px",background:"rgba(60,52,38,0.036)",border:"1px solid rgba(60,52,38,0.108)",borderRadius:3}}>
              {ledgerRows.map(([label,val,c],i) => (
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:11,borderBottom:"1px solid rgba(60,52,38,0.072)"}}>
                  <span style={{color:"#23201A"}}>{label}</span>
                  <span style={{color:c,fontWeight:700}}>{val>=0?"+":""}{val.toLocaleString()}g</span>
                </div>
              ))}
              <div style={{display:"flex",justifyContent:"space-between",paddingTop:6,marginTop:2}}>
                <span style={{fontSize:12,fontWeight:700,color:"#23201A",fontFamily:"'Alegreya Sans',sans-serif"}}>Season net</span>
                <span style={{fontSize:14,fontWeight:900,color:netGold>=0?"#40614F":"#7E2D26",fontFamily:"'IM Fell English SC',serif"}}>
                  {netGold>=0?"+":""}{netGold.toLocaleString()}g
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{padding:"12px 20px",borderTop:"1px solid rgba(60,52,38,0.108)",background:"rgba(30,24,14,0.087)"}}>
          <button onClick={onDismiss}
            style={{width:"100%",padding:"11px 0",borderRadius:3,border:"none",cursor:"pointer",background:`${col}`,color:"#F0E8D5",fontFamily:"'IM Fell English SC',serif",fontWeight:900,fontSize:14}}>
            Begin Season {season + 1} →
          </button>
        </div>
      </div>
    </div>
  );
}

// Capture a lightweight snapshot at the start of a season — used to diff
// level-ups, signings, departures, and buildings built for the summary modal.
function captureSeasonSnapshot(heroes, buildings) {
  return {
    heroes: (heroes||[]).filter(h => !h.retired).map(h => ({ id: h.id, name: h.name, level: h.level })),
    built:  (buildings||[]).filter(b => b.built).map(b => b.id),
  };
}

function RetirementModal({retirees, heroes, formation, onDismiss}){
  const [step, setStep]       = useState(0);      // index into retirees array
  const [mentees, setMentees] = useState({});      // retiredId → menteeId

  if(!retirees||retirees.length===0)return null;

  const retiree = retirees[step];
  const isLast  = step >= retirees.length - 1;

  // Find which position the retiree held
  const retiredPos = POS_KEYS.find(p=>(formation[p]||[]).some(h=>h&&h.id===retiree.id));
  // Eligible mentees: active heroes, sorted by same position first, then lowest level.
  // Exclude anyone already picked for another retiree this ceremony — mentorBonus is
  // a single slot, so a double-assignment would silently drop one of the mentorships.
  const eligible = heroes
    .filter(h=>!h.retired && h.id!==retiree.id
      && !Object.entries(mentees).some(([rid,mid])=>mid===h.id && rid!==retiree.id))
    .sort((a,b)=>{
      const aPos = POS_KEYS.find(p=>(formation[p]||[]).some(x=>x&&x.id===a.id));
      const bPos = POS_KEYS.find(p=>(formation[p]||[]).some(x=>x&&x.id===b.id));
      const aSame = aPos===retiredPos ? -1 : 0;
      const bSame = bPos===retiredPos ? -1 : 0;
      if(aSame!==bSame)return aSame-bSame;
      return a.level-b.level; // prefer younger heroes
    });

  const chosenMenteeId = mentees[retiree.id];

  const handleNext = ()=>{
    if(isLast) onDismiss(mentees);
    else setStep(s=>s+1);
  };

  const pwr=Math.round(Math.max(...POS_KEYS.map(p=>calcHeroCombatScore(retiree,p))));

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(30,24,14,0.574)",zIndex:210,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)"}}>
      <div style={{background:"#DFD3B8",border:"1px solid rgba(154,91,43,0.525)",borderRadius:3,padding:0,maxWidth:520,width:"92%",maxHeight:"88vh",overflow:"hidden",display:"flex",flexDirection:"column"}}>

        {/* Header */}
        <div style={{padding:"20px 24px 14px",textAlign:"center",borderBottom:"1px solid rgba(60,52,38,0.108)"}}>
          <div style={{fontFamily:"'IM Fell English SC',serif",fontWeight:900,fontSize:18,color:"#8A6D3B",marginBottom:3}}>Retirement Ceremony</div>
          {retirees.length>1&&<div style={{fontSize:10,color:"#6E6350"}}>{step+1} of {retirees.length}</div>}
        </div>

        {/* Retiree card */}
        <div style={{padding:"14px 20px 10px"}}>
          <div style={{background:"rgba(154,91,43,0.09)",borderRadius:3,padding:"12px 14px",border:"1px solid rgba(154,91,43,0.3)",marginBottom:14}}>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <HeroAvatar race={retiree.race} size={28}/>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'IM Fell English SC',serif",fontWeight:900,fontSize:15,color:"#23201A"}}>{retiree.name}</div>
                <div style={{fontSize:11,color:"#6E6350"}}>{retiree.race} <RoleIcon role={retiree.role}/> {retiree.role} · {agePhaseLabel(agePhase(retiree))} · Level {retiree.level}</div>
                <div style={{fontSize:10,color:"#5F4B66",marginTop:2}}>{retiree.traits.join(", ")}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:16,fontWeight:900,color:"#40614F"}}>{pwr} PWR</div>
                <div style={{fontSize:10,color:"#6E6350"}}>{retiree.xp.toLocaleString()} XP</div>
              </div>
            </div>
          </div>

          {/* Mentee selection */}
          <div style={{fontSize:11,color:"#6E6350",marginBottom:8}}>
            <span style={{fontFamily:"'IM Fell English SC',serif",fontWeight:700,color:"#8A6D3B"}}>Choose a Mentee</span>
            <span style={{marginLeft:6}}>— {retiree.name} will pass on their wisdom, granting +10 XP/week for a full season.</span>
          </div>
          {retiredPos&&<div style={{fontSize:9,color:"#6E6350",marginBottom:8}}>Heroes from {retiredPos} are shown first — same position means more relevant experience.</div>}
        </div>

        {/* Mentee list */}
        <div style={{flex:1,overflowY:"auto",padding:"0 20px 12px"}}>
          {/* Skip option */}
          <div onClick={()=>setMentees(m=>({...m,[retiree.id]:null}))}
            style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:3,marginBottom:6,cursor:"pointer",
              background:chosenMenteeId===null?"rgba(60,52,38,0.108)":"rgba(60,52,38,0.036)",
              border:`1px solid ${chosenMenteeId===null?"rgba(60,52,38,0.44)":"rgba(60,52,38,0.108)"}`}}>
            <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${chosenMenteeId===null?"#F5EEDC":"#A39781"}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              {chosenMenteeId===null&&<div style={{width:8,height:8,borderRadius:"50%",background:"#F5EEDC"}}/>}
            </div>
            <div style={{fontSize:10,color:"#6E6350",fontStyle:"italic"}}>No mentee — let their legacy rest</div>
          </div>

          {eligible.map(h=>{
            const isSelected = chosenMenteeId===h.id;
            const pos = POS_KEYS.find(p=>(formation[p]||[]).some(x=>x&&x.id===h.id));
            const isSamePos = pos===retiredPos;
            const pwr = Math.round(calcHeroCombatScore(h, pos||"Vanguard"));
            return(
              <div key={h.id} onClick={()=>setMentees(m=>({...m,[retiree.id]:h.id}))}
                style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:3,marginBottom:5,cursor:"pointer",
                  background:isSelected?"rgba(138,109,59,0.12)":"rgba(60,52,38,0.045)",
                  border:`1px solid ${isSelected?"rgba(138,109,59,0.55)":isSamePos?"rgba(60,52,38,0.22)":"rgba(60,52,38,0.09)"}`,
                  transition:"all 0.15s"}}>
                <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${isSelected?"#8A6D3B":"#A39781"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {isSelected&&<div style={{width:8,height:8,borderRadius:"50%",background:"#8A6D3B"}}/>}
                </div>
                <HeroAvatar race={h.race} size={18}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:12,color:"#23201A"}}>{h.name}</div>
                  <div style={{fontSize:9,color:"#6E6350"}}>{h.role} · Lv {h.level} · {pos?pos:"bench"}{isSamePos&&<span style={{color:"#40614F",marginLeft:4}}>★ Same position</span>}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#3C5A78"}}>{pwr} PWR</div>
                  <div style={{fontSize:9,color:"#6E6350"}}>+10 XP/wk</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div style={{padding:"12px 20px",borderTop:"1px solid rgba(60,52,38,0.108)",background:"rgba(30,24,14,0.07)"}}>
          <button onClick={handleNext}
            disabled={!(retiree.id in mentees)}
            style={{width:"100%",padding:"12px 0",borderRadius:3,border:"none",
              cursor:(retiree.id in mentees)?"pointer":"not-allowed",
              background:(retiree.id in mentees)?"#9A5B2B":"#E4DAC2",
              color:(retiree.id in mentees)?"#F0E8D5":"#95896F",
              fontFamily:"'Alegreya Sans',sans-serif",fontWeight:900,fontSize:13}}>
            {isLast
              ? (chosenMenteeId ? `Farewell — ${heroes.find(h=>h.id===chosenMenteeId)?.name} will carry the torch` : "Farewell, Hero")
              : "Next Retiree →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TACTICS TAB ─────────────────────────────────────────────────────────────

function TacticsTab({heroes,formation,setFormation,formationPresets,onSavePreset,onLoadPreset,onClearPreset,squadLeaderId}){
  // pickerOpen = { pos, slotIdx } | null
  const [pickerOpen,setPickerOpen]=useState(null);
  const [pickerSort,setPickerSort]=useState("fit"); // fit | name | combat | level
  const [showBreakdown,setShowBreakdown]=useState(false);
  useEscapeKey(()=>setPickerOpen(null), !!pickerOpen);

  const {analysis,effective,raw}=calcFormationRating(formation);
  const assignedIds=new Set(POS_KEYS.flatMap(p=>(formation[p]||[]).filter(Boolean).map(h=>h.id)));

  const assign=(pos,slotIdx,hero)=>{
    // Remove hero from any existing slot first
    const nf={};
    POS_KEYS.forEach(p=>{nf[p]=(formation[p]||[]).map(h=>h&&h.id===hero.id?null:h);});
    const slots=[...(nf[pos]||[null,null])];
    slots[slotIdx]=hero;
    nf[pos]=slots;
    setFormation(nf);
    setPickerOpen(null);
  };

  const remove=(pos,slotIdx)=>{
    setFormation({...formation,[pos]:(formation[pos]||[]).map((h,i)=>i===slotIdx?null:h)});
    setPickerOpen(null);
  };

  const clearAll=()=>setFormation({Vanguard:[null,null],Skirmisher:[null,null],Arbiter:[null,null]});
  const benchInjured=()=>setFormation(POS_KEYS.reduce((acc,pos)=>{
    acc[pos]=(formation[pos]||[null,null]).map(h=>h&&h.injured?null:h);
    return acc;
  },{}));
  const placed=POS_KEYS.reduce((a,p)=>(formation[p]||[]).filter(Boolean).length+a,0);
  const injuredInFormation=POS_KEYS.reduce((a,p)=>(formation[p]||[]).filter(h=>h&&h.injured).length+a,0);

  // Build picker hero list for the open slot
  const pickerHeroes=useMemo(()=>{
    if(!pickerOpen) return [];
    const pd=POSITIONS[pickerOpen.pos];
    // Include all non-retired, non-injured heroes (injured shown but disabled)
    const list=heroes.filter(h=>!h.retired).map(h=>{
      const isIdeal  =pd.ideal.includes(h.role);
      const fit      =isIdeal?"ideal":"neutral";
      const fitScore =isIdeal?0:1;
      const primaryAvg=pd.primaryStats.reduce((a,s)=>a+(h.stats[s]||0),0)/pd.primaryStats.length;
      const alreadyHere=(formation[pickerOpen.pos]||[])[pickerOpen.slotIdx]?.id===h.id;
      // Is this hero in a *different* slot (will be moved, not copied)?
      const currentPos=POS_KEYS.find(p=>(formation[p]||[]).some(x=>x&&x.id===h.id));
      const currentSlot=currentPos?(formation[currentPos]||[]).findIndex(x=>x&&x.id===h.id):-1;
      return {hero:h,fit,fitScore,primaryAvg,alreadyHere,currentPos,currentSlot};
    });
    const sorts={
      fit:   (a,b)=>a.fitScore-b.fitScore||b.primaryAvg-a.primaryAvg,
      name:  (a,b)=>a.hero.name.localeCompare(b.hero.name),
      combat:(a,b)=>b.primaryAvg-a.primaryAvg,
      level: (a,b)=>b.hero.level-a.hero.level,
    };
    return list.sort(sorts[pickerSort]||sorts.fit);
  },[pickerOpen,heroes,formation,pickerSort]);

  const fitColor=f=>f==="ideal"?"#40614F":"#6E6350";
  const fitLabel=f=>f==="ideal"?"✓ Natural fit":"– Neutral";

  return(
    <div className="rm-tactics-grid" style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:32,alignItems:"flex-start"}}>
      <div>
        {/* Parchment Codex page header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:20,gap:14,flexWrap:"wrap"}}>
          <div>
            <h1 className="pa-h1">Tactics Board</h1>
            <div className="pa-rule"/>
            <div className="pa-sub">{placed} of 6 assigned · Drag heroes from the bench into a lane</div>
          </div>
          <div style={{display:"flex",gap:10}}>
            {injuredInFormation>0&&(
              <button className="pa-secondary" onClick={benchInjured}
                title="Move injured heroes to the bench so they can recover"
                style={{borderColor:"rgba(126,45,38,0.55)",color:"#7E2D26"}}>
                Bench Injured ({injuredInFormation})
              </button>
            )}
            <button className="pa-secondary" onClick={clearAll}>Clear All</button>
          </div>
        </div>

        {/* Benched leader warning — the leader's bonuses only fire when fielded,
            and this is the screen where that decision is made */}
        {(()=>{
          const leaderHero = squadLeaderId!=null ? heroes.find(h=>h.id===squadLeaderId&&!h.retired) : null;
          if(!leaderHero || assignedIds.has(leaderHero.id)) return null;
          return(
            <div style={{marginBottom:14,padding:"8px 12px",borderRadius:3,background:"rgba(154,91,43,0.09)",border:"1px solid rgba(154,91,43,0.36)",display:"flex",alignItems:"center",gap:8,fontSize:11,color:"#9A5B2B",fontFamily:"'Alegreya Sans',sans-serif"}}>
              <Glyph id="leader" size={13} color="#9A5B2B"/>
              <span><b>{leaderHero.name}</b> (Squad Leader) is on the bench — leader bonuses are inactive until fielded.</span>
            </div>
          );
        })()}

        {/* Formation presets — save up to 2 formations and rotate them back in */}
        {formationPresets&&(
          <div style={{marginBottom:24}}>
            <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:14,marginBottom:14}}>
              <div>
                <div className="pa-kicker" style={{marginBottom:6}}>Saved</div>
                <div style={{fontFamily:"'IM Fell English SC',serif",fontWeight:700,fontSize:14,color:"#3A3427",letterSpacing:1,textTransform:"uppercase"}}>Formation Presets</div>
              </div>
              <span className="pa-kicker">2 slots</span>
            </div>
            <div className="rm-two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[0,1].map(idx=>{
                const p=formationPresets[idx]||null;
                const counts=p?POS_KEYS.map(pp=>(p[pp]||[]).filter(id=>id!=null).length):[0,0,0];
                const total=counts.reduce((a,n)=>a+n,0);
                return(
                  <div key={idx} style={{
                    padding:"14px 16px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",
                    border:p?"1px solid rgba(138,109,59,0.375)":"1px dashed rgba(138,109,59,0.3)",
                    background:p?"rgba(138,109,59,0.06)":"transparent"}}>
                    <div style={{flex:1,minWidth:110}}>
                      <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:11,color:p?"#8A6D3B":"#C9BA98",letterSpacing:2,textTransform:"uppercase",marginBottom:3}}>
                        Preset {idx+1}
                      </div>
                      <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:10,color:p?"#77653F":"#C9BA98",fontVariantNumeric:"tabular-nums"}}>
                        {p?`${total}/6 · V${counts[0]} S${counts[1]} A${counts[2]}`:"No formation saved"}
                      </div>
                    </div>
                    {p&&(
                      <button onClick={()=>onLoadPreset(idx)} title="Load this preset"
                        style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:9,fontWeight:700,color:"#8A6D3B",letterSpacing:1.5,padding:"6px 12px",background:"transparent",border:"1px solid rgba(138,109,59,0.55)",cursor:"pointer",textTransform:"uppercase",borderRadius:0}}>↻ Load</button>
                    )}
                    <button onClick={()=>onSavePreset(idx)} title="Save current formation to this slot"
                      style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:9,fontWeight:700,color:"#77653F",letterSpacing:1.5,padding:"6px 12px",background:"transparent",border:"1px solid rgba(138,109,59,0.3)",cursor:"pointer",textTransform:"uppercase",borderRadius:0}}>{p?"Save":"Save Current"}</button>
                    {p&&(
                      <button onClick={()=>onClearPreset(idx)} title="Clear this preset"
                        style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:9,fontWeight:700,color:"#7E2D26",letterSpacing:1.5,padding:"6px 8px",background:"transparent",border:"1px solid rgba(126,45,38,0.45)",cursor:"pointer",textTransform:"uppercase",borderRadius:0}}>✗ Clear</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rating summary with expandable multiplier breakdown.
            Note on the maths: calcPositionScore bakes role-pairing bonuses
            into each lane's score, and calcFormationRating then multiplies
            by the formation-wide race synergy. So the `raw` value the
            function returns already includes role pairings, which made the
            displayed Net Modifier collapse to ×1.00 whenever there was no
            race synergy active — even if all three lanes had ideal pairings.
            We re-derive a true pre-bonus base here by stripping each lane's
            pairing multiplier back out, so the displayed maths
            (base × synergy × pairings = effective) actually adds up. */}
        {(()=>{
          const mults=[];
          if(analysis.raceSynergy) mults.push({label:analysis.raceSynergy.name,icon:analysis.raceSynergy.icon,mult:analysis.raceSynergy.ratingMult,col:analysis.raceSynergy.color});
          analysis.active.forEach(s=>mults.push({label:s.name,icon:s.icon,mult:s.ratingMult,col:s.negative?"#7E2D26":"#40614F"}));
          // Build a true pre-bonus base by undoing each lane's pairing
          // multiplier, while collecting active pairings for the breakdown.
          let truePreBonus = 0;
          POS_KEYS.forEach(pos=>{
            const heroes2=(formation[pos]||[]).filter(Boolean);
            if(heroes2.length===0) return;
            const ps=calcPositionScore(heroes2,pos);
            const lanePairing=ps.pairingMult||1.0;
            truePreBonus += ps.score / lanePairing;
            if(heroes2.length===2 && lanePairing>1.0){
              const sortedRoles=heroes2.map(h=>h.role).sort().join();
              const pp=POSITION_PAIRINGS.find(p=>p.pos===pos&&[...p.roles].sort().join()===sortedRoles);
              if(pp) mults.push({label:`${[...pp.roles].sort().join(" + ")} pairing`,icon:"",mult:pp.mult,col:"#4A6B45"});
            }
          });
          const trueBase = Math.round(truePreBonus);
          const netMult = trueBase>0 ? effective / trueBase : 1.0;
          const positive = effective >= trueBase;
          const delta = effective - trueBase;
          const LABEL={fontFamily:"'IM Fell English SC',serif",fontSize:9,fontWeight:700,color:"#77653F",letterSpacing:2,textTransform:"uppercase",lineHeight:1};
          const NUM={fontFamily:"'Alegreya Sans',sans-serif",fontSize:13,fontVariantNumeric:"tabular-nums",lineHeight:1};
          return(
            <div style={{marginBottom:24,border:"1px solid rgba(138,109,59,0.27)",background:"rgba(138,109,59,0.04)"}}>
              <button onClick={()=>setShowBreakdown(s=>!s)}
                style={{width:"100%",display:"flex",alignItems:"center",gap:18,padding:"16px 18px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left",color:"inherit",flexWrap:"wrap"}}>
                <span style={LABEL}>{placed} of 6</span>
                <span style={{width:1,height:14,background:"rgba(138,109,59,0.3)"}}/>
                <span style={LABEL}>Rating</span>
                <span style={{...NUM,fontWeight:500,color:"#77653F",textDecorationLine:trueBase!==effective?"line-through":"none",textDecorationColor:"rgba(119,101,63,0.45)"}}>{trueBase}</span>
                <span style={{...NUM,fontWeight:500,color:"#C9BA98"}}>→</span>
                <span style={{...NUM,fontWeight:700,color:"#3A3427"}}>{effective}</span>
                <span style={LABEL}>Effective Rating</span>
                <span style={{flex:1}}/>
                <span style={{...LABEL,color:"#8A6D3B",display:"inline-flex",alignItems:"center",gap:6}}>
                  {showBreakdown?"Hide breakdown":"Show breakdown"}
                  <span style={{fontSize:9,transform:showBreakdown?"rotate(180deg)":"none",transition:"transform 0.18s",display:"inline-block"}}>▾</span>
                </span>
              </button>
              {showBreakdown&&(
                <div style={{padding:"4px 18px 16px",borderTop:"1px solid rgba(138,109,59,0.18)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,height:36,borderBottom:"1px solid rgba(138,109,59,0.15)"}}>
                    <span style={{...LABEL,color:"#77653F",flex:1}}>Net Modifier</span>
                    <span style={{...NUM,fontWeight:700,color:positive?"#4A6B45":"#7E2D26"}}>
                      {positive?"+":""}{delta}
                      <span style={{color:"#77653F",fontWeight:500,marginLeft:8}}>×{netMult.toFixed(2)}</span>
                    </span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",columnGap:28}}>
                    {mults.length===0&&(
                      <div style={{...LABEL,color:"#C9BA98",height:32,display:"flex",alignItems:"center"}}>No synergy bonuses active</div>
                    )}
                    {mults.map((m,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:10,height:32}}>
                        <span style={{color:"#8A6D3B",fontSize:11,width:12,textAlign:"center",lineHeight:1}}>◈</span>
                        <span style={{...LABEL,color:"#77653F",flex:1}}>{m.label}</span>
                        <span style={{...NUM,fontWeight:700,color:m.mult>=1?"#4A6B45":"#7E2D26"}}>×{m.mult.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Active race synergy inline */}
        {analysis.raceSynergy&&(
          <div className="rm-tactics-active-summary" style={{marginBottom:10}}>
            <div style={{padding:"7px 10px",borderRadius:3,background:`${analysis.raceSynergy.color}10`,border:`1px solid ${analysis.raceSynergy.color}33`}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:11}}>{analysis.raceSynergy.icon}</span>
                <span style={{fontSize:11,fontWeight:700,color:analysis.raceSynergy.color,fontFamily:"'Alegreya Sans',sans-serif",flex:1}}>{analysis.raceSynergy.name}</span>
                <span style={{fontSize:9,fontWeight:700,color:analysis.raceSynergy.color}}>×{analysis.raceSynergy.ratingMult}</span>
              </div>
              <div style={{fontSize:9,color:"#6E6350",marginTop:2,lineHeight:1.4}}>{analysis.raceSynergy.desc}</div>
              {analysis.raceSynergy.laneMults&&(
                <div style={{display:"flex",gap:6,marginTop:5}}>
                  {POS_KEYS.map(p=>{
                    const lm=analysis.raceSynergy.laneMults[p];
                    const lmCol=lm>1.0?"#40614F":lm<1.0?"#9A5B2B":"#6E6350";
                    return <span key={p} style={{fontSize:8,fontWeight:700,color:lmCol,background:"rgba(60,52,38,0.072)",padding:"2px 6px",borderRadius:3,display:"inline-flex",alignItems:"center",gap:3}}><PositionIcon position={p} size={9}/> ×{lm.toFixed(2)}</span>;
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Position lanes — Parchment Codex */}
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:14,marginBottom:14}}>
          <div>
            <div className="pa-kicker" style={{marginBottom:6}}>Six Slots</div>
            <div style={{fontFamily:"'IM Fell English SC',serif",fontWeight:700,fontSize:14,color:"#3A3427",letterSpacing:1,textTransform:"uppercase"}}>Formation Lanes</div>
          </div>
        </div>
        {POS_KEYS.map(pos=>{
          const pd=POSITIONS[pos];
          const slots=formation[pos]||[null,null];
          const posHeroes=slots.filter(Boolean);
          const ps=posHeroes.length>0?calcPositionScore(posHeroes,pos):{score:0};
          const sortedRoles=posHeroes.map(h=>h.role).sort().join();
          const rolePairing=posHeroes.length===2
            ? POSITION_PAIRINGS.find(p=>p.pos===pos&&[...p.roles].sort().join()===sortedRoles)
            : null;
          return(
            <div key={pos} style={{marginBottom:14,border:"1px solid rgba(138,109,59,0.27)",background:"rgba(138,109,59,0.04)"}}>
              {/* Lane header */}
              <div style={{padding:"12px 16px",borderBottom:"1px solid rgba(138,109,59,0.18)",display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:36,height:36,border:`1px solid ${pd.color}55`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <PositionIcon position={pos} size={26}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:13,color:pd.color,letterSpacing:1.5,textTransform:"uppercase"}}>{pd.label}</div>
                  <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:9,fontWeight:500,color:"#77653F",letterSpacing:1.5,textTransform:"uppercase",marginTop:2,fontStyle:"italic"}}>{pd.subtitle}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div className="pa-kicker">Lane PWR</div>
                  <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:18,color:"#3A3427",fontVariantNumeric:"tabular-nums",lineHeight:1,marginTop:4}}>{posHeroes.length>0?Math.round(ps.score):"—"}</div>
                </div>
              </div>
              {/* Slots */}
              <div className="rm-formation-slots" style={{padding:14,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[0,1].map(slotIdx=>{
                  const h=slots[slotIdx];
                  const fit=h?(pd.ideal.includes(h.role)?"ideal":pd.penalty.includes(h.role)?"penalty":"neutral"):null;
                  const fitColor = fit==="ideal"?"#4A6B45":fit==="penalty"?"#7E2D26":"#77653F";
                  const isPickerTarget=pickerOpen?.pos===pos&&pickerOpen?.slotIdx===slotIdx;
                  if(!h) {
                    return(
                      <button key={slotIdx} onClick={()=>setPickerOpen({pos,slotIdx})}
                        style={{height:78,borderRadius:0,border:`1px dashed ${isPickerTarget?pd.color:pd.color+"55"}`,display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                          fontFamily:"'Alegreya Sans',sans-serif",fontSize:10,letterSpacing:2,textTransform:"uppercase",color:isPickerTarget?pd.color:"#77653F",
                          background:isPickerTarget?`${pd.color}0a`:"rgba(138,109,59,0.04)",cursor:"pointer",transition:"all 0.15s"}}>
                        <span style={{fontSize:14}}>+</span> Assign Hero
                      </button>
                    );
                  }
                  const stageColor=agePhaseColor(agePhase(h));
                  const fat=h.fatigue||0;
                  const {color:fatCol}=fatigueLabel(fat);
                  const slotBorderColor = h.injured
                    ? "rgba(126,45,38,0.55)"
                    : (isPickerTarget?"#8A6D3B":"rgba(138,109,59,0.27)");
                  const slotBorderStyle = h.injured ? "dashed" : "solid";
                  return(
                    <div key={slotIdx} onClick={()=>setPickerOpen({pos,slotIdx})}
                      style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",height:78,
                        background:isPickerTarget?"rgba(138,109,59,0.12)":h.injured?"rgba(126,45,38,0.075)":"rgba(138,109,59,0.045)",
                        border:`1px ${slotBorderStyle} ${slotBorderColor}`,
                        cursor:"pointer",position:"relative"}}>
                      <div style={{width:46,height:46,background:"#E4D9BF",border:"1px solid rgba(138,109,59,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <RoleIcon role={h.role} size={28}/>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:13,color:"#2A251C",letterSpacing:0.3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",display:"flex",alignItems:"center",gap:6}}>
                          <span style={{overflow:"hidden",textOverflow:"ellipsis"}}>{h.name}</span>
                          {h.id===squadLeaderId&&<span title="Squad Leader" style={{display:"inline-flex",flexShrink:0}}><Glyph id="leader" size={12} color="#8A6D3B"/></span>}
                          {h.injured&&<span style={{fontSize:9,fontWeight:700,color:"#7E2D26",background:"rgba(126,45,38,0.21)",padding:"1px 6px",borderRadius:3,letterSpacing:0.5,whiteSpace:"nowrap"}}>Injured {h.injuryWeeks}w</span>}
                        </div>
                        <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:9,fontWeight:500,color:"#77653F",letterSpacing:1.5,textTransform:"uppercase",marginTop:2}}>
                          {h.race} · {h.role} · <span style={{color:stageColor}}>{agePhase(h).charAt(0).toUpperCase()+agePhase(h).slice(1)}</span>
                        </div>
                        <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:10,fontWeight:600,color:"#77653F",marginTop:4,fontVariantNumeric:"tabular-nums"}}>
                          PWR <span style={{color:"#3A3427"}}>{Math.round(calcHeroCombatScore(h,pos))}</span>
                          <span style={{color:"#C9BA98",margin:"0 6px"}}>·</span>
                          LV <span style={{color:"#3A3427"}}>{h.level}</span>
                          <span style={{color:"#C9BA98",margin:"0 6px"}}>·</span>
                          FAT <span style={{color:fatCol}} title="Fatigue">{fat}</span>
                        </div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3,flexShrink:0}}>
                        <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:8,fontWeight:700,color:fitColor,letterSpacing:1.5,textTransform:"uppercase"}}>
                          {fit==="ideal"?"✓ Ideal":fit==="penalty"?"Penalty":"— Neutral"}
                        </div>
                        {h.injured&&(
                          <button onClick={e=>{e.stopPropagation();remove(pos,slotIdx);}}
                            title="Move to bench so the hero can recover"
                            style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:8,fontWeight:700,letterSpacing:1.2,padding:"3px 7px",background:"transparent",border:"1px solid rgba(126,45,38,0.55)",color:"#7E2D26",borderRadius:3,cursor:"pointer",textTransform:"uppercase"}}>
                            Bench
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Lane footer — pairing badge or ideal-roles hint */}
              <div style={{padding:"8px 16px",borderTop:"1px solid rgba(138,109,59,0.15)",display:"flex",alignItems:"center",gap:10}}>
                {rolePairing?(<>
                  <span style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:9,fontWeight:700,color:"#4A6B45",letterSpacing:1.5,textTransform:"uppercase"}}>
                    ◈ {[...rolePairing.roles].sort().join(" + ")} Pairing
                  </span>
                  <span style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:11,fontWeight:700,color:"#4A6B45",fontVariantNumeric:"tabular-nums"}}>×{rolePairing.mult.toFixed(2)}</span>
                </>):(
                  <span style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:9,color:"#77653F",letterSpacing:1,textTransform:"uppercase"}}>Ideal · <span style={{color:"#77653F"}}>{pd.ideal.join(", ")}</span></span>
                )}
                <span style={{flex:1}}/>
                {rolePairing&&(
                  <span style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:9,color:"#77653F",letterSpacing:1,textTransform:"uppercase"}}>Ideal · {pd.ideal.join(", ")}</span>
                )}
              </div>
            </div>
          );
        })}

        {/* Bench — Parchment Codex */}
        {(()=>{
          const bench=heroes.filter(h=>!h.retired&&!assignedIds.has(h.id));
          if(bench.length===0) return null;
          return(
            <div style={{marginTop:32}}>
              <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:14,marginBottom:14}}>
                <div>
                  <div className="pa-kicker" style={{marginBottom:6}}>{bench.length} {bench.length===1?"Hero":"Heroes"}</div>
                  <div style={{fontFamily:"'IM Fell English SC',serif",fontWeight:700,fontSize:14,color:"#3A3427",letterSpacing:1,textTransform:"uppercase"}}>The Bench</div>
                </div>
                <span className="pa-kicker">Not in Formation</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:10}}>
                {bench.map(h=>{
                  const dimmed=h.injured||(h.awayWeeks||0)>0;
                  const bestPos = naturalLaneFor(h.role);
                  const bestColor = POSITIONS[bestPos]?.color || "#77653F";
                  return(
                    <div key={h.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",border:"1px solid rgba(138,109,59,0.18)",background:"rgba(138,109,59,0.04)",opacity:dimmed?0.55:1}}>
                      <div style={{width:36,height:36,background:"#E4D9BF",border:"1px solid rgba(138,109,59,0.27)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <RoleIcon role={h.role} size={22}/>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:11,color:"#3A3427",letterSpacing:0.3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{h.name}</div>
                        <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:8,fontWeight:500,color:"#77653F",letterSpacing:1.5,textTransform:"uppercase",marginTop:2}}>
                          {h.race} · {h.role} · LV <span style={{fontFamily:"'Alegreya Sans',sans-serif",letterSpacing:0,fontWeight:600,color:"#77653F"}}>{h.level}</span>
                          {h.injured&&<span style={{color:"#7E2D26",marginLeft:6,fontFamily:"'Alegreya Sans',sans-serif",letterSpacing:0}}>{h.injuryWeeks}w</span>}
                          {(h.awayWeeks||0)>0&&<span style={{color:"#4A6178",marginLeft:6,fontFamily:"'Alegreya Sans',sans-serif",letterSpacing:0}}>{h.awayWeeks}w</span>}
                        </div>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div className="pa-kicker">Lane</div>
                        <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:9,fontWeight:700,color:bestColor,letterSpacing:1,textTransform:"uppercase",marginTop:3}}>{bestPos}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* RIGHT RAIL — Synergy & position guide (Parchment Codex) */}
      <div className="rm-tactics-synergy-panel">
        {(()=>{
          const HAIR = "1px solid rgba(138,109,59,0.27)";
          const allHeroes = POS_KEYS.flatMap(p => (formation[p]||[]).filter(Boolean));
          const races = {};
          allHeroes.forEach(h => { races[h.race] = (races[h.race] || 0) + 1; });
          const raceList = Object.entries(races).sort((a,b) => b[1]-a[1]);
          const rs = analysis.raceSynergy;
          // Collect rating multipliers from active synergy + role pairings
          const allMults = [];
          if(rs) allMults.push({label:rs.name, mult:rs.ratingMult, positive: rs.ratingMult>=1});
          POS_KEYS.forEach(pos=>{
            const heroes2=(formation[pos]||[]).filter(Boolean);
            if(heroes2.length===2){
              const sortedRoles=heroes2.map(h=>h.role).sort().join();
              const pp=POSITION_PAIRINGS.find(p=>p.pos===pos&&[...p.roles].sort().join()===sortedRoles);
              if(pp) allMults.push({label:`${[...pp.roles].sort().join(" + ")} pairing`, mult:pp.mult, positive:pp.mult>=1});
            }
          });
          return (
            <>
              {/* Active synergy card */}
              <div style={{border:HAIR,padding:18,marginBottom:18,background:rs?"rgba(138,109,59,0.06)":"rgba(138,109,59,0.04)"}}>
                <div className="pa-kicker" style={{marginBottom:8}}>Active Synergy</div>
                {rs?(<>
                  <div style={{fontFamily:"'IM Fell English SC',serif",fontWeight:700,fontSize:18,color:"#8A6D3B",letterSpacing:0.5,marginBottom:6}}>{rs.name}</div>
                  <div style={{width:30,height:1,background:"#8A6D3B",marginBottom:10}}/>
                  <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:11,color:"#77653F",lineHeight:1.55,marginBottom:14}}>{rs.desc}</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span className="pa-kicker">Rating Multiplier</span>
                    <span style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:18,color:"#4A6B45",fontVariantNumeric:"tabular-nums"}}>×{rs.ratingMult.toFixed(2)}</span>
                  </div>
                </>):(
                  <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:11,color:"#77653F",lineHeight:1.55,fontStyle:"italic"}}>
                    No race synergy active. Field 6 of the same race for a mono bonus, all different for rainbow, or 3+3 of two races for a duo pact.
                  </div>
                )}
              </div>

              {/* Race composition */}
              {raceList.length > 0 && (
                <div style={{border:HAIR,padding:18,marginBottom:18}}>
                  <div className="pa-kicker" style={{marginBottom:12}}>Race Composition</div>
                  {raceList.map(([race,n])=>(
                    <div key={race} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(138,109,59,0.12)"}}>
                      <span style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:11,fontWeight:500,color:"#3A3427",letterSpacing:0.5}}>{race}</span>
                      <span style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:11,fontWeight:600,color:"#77653F",fontVariantNumeric:"tabular-nums"}}>×{n}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Active rating multipliers */}
              {allMults.length > 0 && (
                <div style={{border:HAIR,padding:18,marginBottom:18}}>
                  <div className="pa-kicker" style={{marginBottom:6}}>Rating Multipliers</div>
                  {allMults.map((m,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:"1px solid rgba(138,109,59,0.12)"}}>
                      <span style={{color:"#8A6D3B",fontSize:11,width:12,textAlign:"center",lineHeight:1}}>◈</span>
                      <span style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:10,color:"#77653F",letterSpacing:1,textTransform:"uppercase",flex:1}}>{m.label}</span>
                      <span style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:11,fontWeight:700,color:m.positive?"#4A6B45":"#7E2D26",fontVariantNumeric:"tabular-nums"}}>×{m.mult.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Position guide */}
              <div style={{border:HAIR,padding:18}}>
                <div className="pa-kicker" style={{marginBottom:12}}>Position Guide</div>
                {POS_KEYS.map(pos=>{
                  const pd=POSITIONS[pos];
                  return(
                    <div key={pos} style={{marginBottom:14}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                        <PositionIcon position={pos} size={14}/>
                        <span style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:10,color:pd.color,letterSpacing:1.5,textTransform:"uppercase"}}>{pd.label}</span>
                      </div>
                      <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:9,color:"#77653F",letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>
                        Ideal · <span style={{color:"#77653F"}}>{pd.ideal.join(", ")}</span>
                      </div>
                      <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:9,color:"#77653F",letterSpacing:1,textTransform:"uppercase"}}>
                        Stats · <span style={{color:"#77653F"}}>{(pd.primaryStats||[]).slice(0,3).join(", ")}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}
      </div>

      {/* ── SLOT PICKER MODAL ── */}
      {pickerOpen&&(()=>{
        const pd=POSITIONS[pickerOpen.pos];
        const currentHero=(formation[pickerOpen.pos]||[])[pickerOpen.slotIdx];
        return(
          <div style={{position:"fixed",inset:0,background:"rgba(30,24,14,0.525)",zIndex:150,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)"}}
            onClick={()=>setPickerOpen(null)}>
            <div onClick={e=>e.stopPropagation()}
              style={{background:"#EFE7D3",border:`1px solid ${pd.color}44`,borderRadius:3,width:"min(540px,96vw)",maxHeight:"80vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:`0 0 40px ${pd.color}18`}}>

              {/* Picker header */}
              <div style={{padding:"14px 18px",borderBottom:"1px solid rgba(60,52,38,0.108)",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                <PositionIcon position={pickerOpen.pos} size={20}/>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'IM Fell English SC',serif",fontWeight:700,fontSize:14,color:pd.color}}>{pd.label} — Slot {pickerOpen.slotIdx+1}</div>
                  <div style={{fontSize:10,color:"#6E6350"}}>{pd.subtitle} · Ideal: {pd.ideal.filter(x=>ROLES.includes(x)).join(", ")}</div>
                </div>
                <button onClick={()=>setPickerOpen(null)} style={{background:"rgba(60,52,38,0.108)",border:"1px solid rgba(60,52,38,0.22)",color:"#4A4335",fontSize:12,cursor:"pointer",borderRadius:3,padding:"5px 12px"}}>Close</button>
              </div>

              {/* Sort controls + clear option */}
              <div style={{padding:"8px 18px",borderBottom:"1px solid rgba(60,52,38,0.072)",display:"flex",gap:6,alignItems:"center",flexShrink:0,flexWrap:"wrap"}}>
                <span style={{fontSize:10,color:"#6E6350",marginRight:2}}>Sort:</span>
                {[["fit","Best fit"],["combat","Combat"],["level","Level"],["name","Name"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setPickerSort(v)} style={{fontSize:10,padding:"3px 9px",borderRadius:3,border:"none",cursor:"pointer",background:pickerSort===v?"rgba(60,90,120,0.27)":"rgba(60,52,38,0.09)",color:pickerSort===v?"#3C5A78":"#7A6F58",fontWeight:pickerSort===v?700:400}}>
                    {l}
                  </button>
                ))}
                {currentHero&&(
                  <button onClick={()=>remove(pickerOpen.pos,pickerOpen.slotIdx)}
                    style={{marginLeft:"auto",fontSize:10,padding:"3px 10px",borderRadius:3,border:"1px solid rgba(126,45,38,0.45)",cursor:"pointer",background:"rgba(126,45,38,0.12)",color:"#7E2D26"}}>
                    Remove {currentHero.name}
                  </button>
                )}
              </div>

              {/* Hero list */}
              <div style={{overflowY:"auto",padding:"10px 14px",flex:1}}>
                {pickerHeroes.map(({hero:h,fit,primaryAvg,currentPos,currentSlot})=>{
                  const phase=agePhase(h);
                  const {label:hLabel,color:hColor}=moraleLabel(h.morale);
                  const isCurrentlyHere=(formation[pickerOpen.pos]||[])[pickerOpen.slotIdx]?.id===h.id;
                  const fc=fitColor(fit);
                  const movedFrom=currentPos&&!isCurrentlyHere?`${POSITIONS[currentPos].label} Slot ${currentSlot+1}`:"";
                  return(
                    <div key={h.id}
                      onClick={()=>h.injured||(h.awayWeeks||0)>0?null:assign(pickerOpen.pos,pickerOpen.slotIdx,h)}
                      style={{
                        display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:3,marginBottom:5,
                        background:isCurrentlyHere?"rgba(60,90,120,0.15)":h.injured?"rgba(60,52,38,0.03)":"rgba(60,52,38,0.054)",
                        border:`1px solid ${isCurrentlyHere?"#3C5A78":(h.awayWeeks||0)>0?"rgba(60,90,120,0.45)":fc+"33"}`,
                        cursor:h.injured||(h.awayWeeks||0)>0?"not-allowed":"pointer",
                        opacity:h.injured||(h.awayWeeks||0)>0?0.45:1,
                        transition:"background 0.15s,border 0.15s",
                      }}>
                      <HeroAvatar race={h.race} size={20}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                          <span style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:13,color:"#23201A"}}>{h.name}</span>
                          {h.injured&&<span style={{fontSize:9,color:"#7E2D26",background:"rgba(126,45,38,0.18)",padding:"1px 5px",borderRadius:3}}>Injured {h.injuryWeeks}wk</span>}
                          {isCurrentlyHere&&<span style={{fontSize:9,color:"#3C5A78",background:"rgba(60,90,120,0.18)",padding:"1px 5px",borderRadius:3}}>Current</span>}
                          {movedFrom&&<span style={{fontSize:9,color:"#8A6D3B",background:"rgba(138,109,59,0.12)",padding:"1px 5px",borderRadius:3}}>Moves from {movedFrom}</span>}
                          {(h.awayWeeks||0)>0&&<span style={{fontSize:9,color:"#3C5A78",background:"rgba(60,90,120,0.18)",padding:"1px 5px",borderRadius:3}}>Away {h.awayWeeks}w</span>}
                          {(h.fatigue||0)>=FATIGUE_WARN&&<span style={{fontSize:9,color:fatigueLabel(h.fatigue).color,background:"rgba(126,45,38,0.12)",padding:"1px 5px",borderRadius:3}}>{fatigueLabel(h.fatigue).label}</span>}
                        </div>
                        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                          <span style={{fontSize:10,color:"#6E6350"}}><RoleIcon role={h.role}/> {h.role}</span>
                          <span style={{fontSize:10,color:"#6E6350"}}>{h.race}</span>
                          <span style={{fontSize:10,color:agePhaseColor(phase)}}>{agePhaseLabel(phase)}</span>
                          <span style={{fontSize:10,color:hColor}}>{hLabel}</span>
                          <span style={{fontSize:10,color:"#6E6350"}}>Lv {h.level}</span>
                        </div>
                        <div style={{display:"flex",gap:8,marginTop:3,flexWrap:"wrap"}}>
                          {pd.primaryStats.slice(0,3).map(s=>(
                            <span key={s} style={{fontSize:9,color:h.stats[s]>=70?"#40614F":h.stats[s]>=50?"#3C5A78":"#6E6350"}}>
                              {s.replace(" ","·")} {h.stats[s]}
                            </span>
                          ))}
                          <span style={{fontSize:9,color:"#6E6350"}}>Morale {h.morale}%</span>
                          <span style={{fontSize:9,color:fatigueLabel(h.fatigue||0).color}}>Fatigue {h.fatigue||0}</span>
                        </div>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div style={{fontSize:11,fontWeight:700,color:fc}}>{fitLabel(fit)}</div>
                        <div style={{fontSize:10,color:"#6E6350",marginTop:2}}>~{Math.round(primaryAvg)} primary avg</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── DOMINION TAB ─────────────────────────────────────────────────────────────

function DominionTab({season,seasonWeek,trophies,weeklyIncome,playerTier,tierPosition,tierEnemyTowns,townName,townColor,formRating,leagueTable,playerRecord,matchLog,hallOfFame,chronicleEntries}){

  const currentTier = TIERS[playerTier] || TIERS.iron;
  const playerPlayed = (playerRecord?.wins||0) + (playerRecord?.losses||0);
  const playerWinPct = playerPlayed > 0 ? (playerRecord.wins/playerPlayed) : 0;

  const allTowns = [
    { name:townName||DEFAULT_TOWN_NAME, wins:playerRecord?.wins||0, losses:playerRecord?.losses||0, winPct:playerWinPct, isPlayer:true, power:0 },
    ...(tierEnemyTowns||[]).map(t=>{
      const rec=leagueTable?.[t.name]||{};
      const w=rec.wins||0, l=rec.losses||0;
      return {...t, wins:w, losses:l, winPct:(w+l)>0?w/(w+l):0, isPlayer:false};
    }),
  ].sort((a,b)=>b.wins-a.wins||b.winPct-a.winPct);

  const playerPos = allTowns.findIndex(t=>t.isPlayer)+1;
  const seasonPct = Math.round((seasonWeek/SEASON_LENGTH)*100);
  const isPlatinum = playerTier==="platinum";
  const isIron = playerTier==="iron";
  const nextTierId = TIER_ORDER[Math.min(TIER_ORDER.length-1, TIER_ORDER.indexOf(playerTier)+1)];
  const nextTier = TIERS[nextTierId];

  return(
    <div className="rm-dominion-grid" style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:20}}>

      {/* LEFT: Standings */}
      <div>
        {/* Season progress */}
        <div style={{marginBottom:16,padding:"12px 16px",background:"rgba(60,52,38,0.036)",borderRadius:3,border:`1px solid ${currentTier.color}30`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div>
              <div style={{fontFamily:"'IM Fell English SC',serif",fontWeight:700,fontSize:14,color:currentTier.color}}>
                <TierIcon tier={playerTier} size={14}/> {currentTier.name} League · Season {season}
              </div>
              <div style={{fontSize:10,color:"#6E6350"}}>Week {seasonWeek} of {SEASON_LENGTH} · {SEASON_LENGTH-seasonWeek} remaining · {isPlatinum?"Finish 1st to win the campaign":"Top 2 promote · Bottom 2 relegate"}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:10,color:"#6E6350"}}>Position</div>
              <div style={{fontSize:26,fontWeight:900,fontFamily:"'IM Fell English SC',serif",color:playerPos<=2?"#40614F":playerPos>=7?"#7E2D26":"#23201A"}}>
                {playerPos}{['st','nd','rd'][playerPos-1]||'th'}
              </div>
            </div>
          </div>
          <div style={{height:6,background:"#DFD3B8",borderRadius:3,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${seasonPct}%`,background:`${currentTier.color}`,borderRadius:3,transition:"width 0.5s"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#6E6350",marginTop:3}}>
            <span>Season start</span><span>Season end — promotion/relegation decided</span>
          </div>
          {/* Run-in pressure — the table becomes a story in the closing weeks */}
          {(()=>{
            const weeksLeft = SEASON_LENGTH-seasonWeek;
            if(weeksLeft>12||playerPlayed===0) return null;
            const pWins = playerRecord?.wins||0;
            let msg=null, col="#8A6D3B";
            if(playerPos<=2){
              const chaser = allTowns.find((t,i)=>i>=2&&!t.isPlayer);
              const cushion = chaser ? pWins-chaser.wins : 0;
              msg = isPlatinum&&playerPos===1
                ? `You hold the throne. ${chaser?`${chaser.name} sits ${cushion} win${cushion===1?"":"s"} back`:""} — ${weeksLeft} week${weeksLeft===1?"":"s"} to hold on.`
                : `Holding a promotion place${chaser?` — ${chaser.name} is ${cushion} win${cushion===1?"":"s"} behind`:""} with ${weeksLeft} to play.`;
              col="#40614F";
            } else if(playerPos>=7){
              const safe = allTowns[5];
              const gap = safe ? safe.wins-pWins : 0;
              msg = `Relegation zone — ${gap} win${gap===1?"":"s"} from safety with ${weeksLeft} to play. Every match matters now.`;
              col="#7E2D26";
            } else {
              const second = allTowns[1];
              const gap = second ? second.wins-pWins : 0;
              if(gap<=weeksLeft) msg = `${gap} win${gap===1?"":"s"} off ${isPlatinum?"the title":"promotion"} with ${weeksLeft} to play — the run-in starts now.`;
            }
            return msg ? (
              <div style={{marginTop:8,padding:"6px 10px",borderRadius:3,background:`${col}10`,border:`1px solid ${col}30`,fontSize:10,fontWeight:700,color:col}}>
                {msg}
              </div>
            ) : null;
          })()}
        </div>

        {/* Zone key */}
        <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
          {[["#40614F", isPlatinum?"1st — Win condition":"Top 2 — Promote"],
            ["#6E6350","3rd–6th — Safe"],
            ["#7E2D26","7th–8th — Relegate"+(isIron?" (floor)":"")]
          ].map(([c,l])=>(
            <span key={l} style={{fontSize:9,color:c,display:"flex",alignItems:"center",gap:4}}>
              <span style={{width:8,height:8,borderRadius:2,background:c,display:"inline-block",flexShrink:0}}/>
              {l}
            </span>
          ))}
        </div>

        {/* Standings header */}
        <div style={{display:"grid",gridTemplateColumns:"36px 1fr 32px 32px 48px 56px",gap:4,padding:"4px 12px",marginBottom:4}}>
          {["#","Town","W","L","Win%","Tribute"].map(h=>(
            <div key={h} style={{fontSize:9,color:"#6E6350",fontWeight:700,letterSpacing:0.5,textAlign:h==="Town"?"left":"center"}}>{h}</div>
          ))}
        </div>

        {allTowns.map((t,i)=>{
          const pos=i+1;
          const isPromo=pos<=2;
          const isRele=pos>=7;
          const zoneBg=isPromo?"rgba(64,97,79,0.06)":isRele?"rgba(126,45,38,0.06)":"rgba(60,52,38,0.036)";
          const zoneBorder=isPromo?"rgba(64,97,79,0.225)":isRele?"rgba(126,45,38,0.22)":"rgba(60,52,38,0.108)";
          const isYou=t.isPlayer;
          const played=t.wins+t.losses;
          const winPctStr=played>0?`${Math.round(t.winPct*100)}%`:"—";
          const tribute=weeklyRankIncome(playerTier, pos);
          return(
            <div key={t.name} style={{
              display:"grid",gridTemplateColumns:"36px 1fr 32px 32px 48px 56px",gap:4,
              alignItems:"center",padding:"8px 12px",marginBottom:3,
              background:isYou?`${townColor}12`:zoneBg,
              border:`1px solid ${isYou?`${townColor}44`:zoneBorder}`,
              borderRadius:3,
            }}>
              <div style={{textAlign:"center"}}>
                <span style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:900,fontSize:12,
                  color:isPromo?"#40614F":isRele?"#7E2D26":"#6E6350"}}>
                  {pos}
                </span>
              </div>
              <div style={{minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <span style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:11,
                    color:isYou?townColor:"#23201A",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {t.name}
                  </span>
                  {isYou&&<span style={{fontSize:8,color:townColor,background:`${townColor}18`,padding:"1px 5px",borderRadius:3,flexShrink:0}}>YOU</span>}
                </div>
                {!isYou&&<div style={{fontSize:9,color:"#6E6350",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {t.manager?`${t.manager.name} · `:""}Power ~{Math.round(leagueTable?.[t.name]?.power||t.power||0)}
                  {(t.h2h?.wins||t.h2h?.losses)?<span style={{color:(t.h2h.wins>=t.h2h.losses)?"#40614F":"#9A5B2B"}}> · {t.h2h.wins}–{t.h2h.losses} vs you</span>:null}
                </div>}
              </div>
              <div style={{textAlign:"center",fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:13,color:"#40614F"}}>{t.wins}</div>
              <div style={{textAlign:"center",fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:13,color:"#7E2D26"}}>{t.losses}</div>
              <div style={{textAlign:"center",fontSize:11,fontWeight:700,color:t.winPct>=0.6?"#40614F":t.winPct>=0.4?"#8A6D3B":"#9A5B2B"}}>{winPctStr}</div>
              <div style={{textAlign:"center",fontSize:10,fontWeight:700,color:"#40614F"}}>{tribute}g</div>
            </div>
          );
        }).flatMap((row,i)=>{
          // Printed rules mark the zones: dashed verdigris under 2nd (all above
          // go up), dashed oxblood under 6th (all below go down)
          const out=[row];
          if(i===1) out.push(<div key="promo-rule" style={{borderTop:"2px dashed #40614F",margin:"5px 6px 8px",opacity:0.7}}/>);
          if(i===5&&allTowns.length>=7) out.push(<div key="rele-rule" style={{borderTop:"2px dashed #7E2D26",margin:"5px 6px 8px",opacity:0.6}}/>);
          return out;
        })}
      </div>

      {/* RIGHT: Income + win chance + match feed + trophies */}
      <div className="rm-dominion-right">
        {/* Tribute */}
        <div style={{marginBottom:14,padding:"14px 16px",background:"rgba(60,52,38,0.054)",borderRadius:3,border:`1px solid ${currentTier.color}33`}}>
          <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:13,color:currentTier.color,marginBottom:10}}>
            <TierIcon tier={playerTier} size={13}/> Tribute Income
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:8}}>
            <div>
              <div style={{fontSize:10,color:"#6E6350",marginBottom:2}}>{currentTier.name} · base {currentTier.tributeBase}g + position bonus</div>
              <div style={{fontFamily:"'IM Fell English SC',serif",fontSize:28,fontWeight:900,color:"#40614F",lineHeight:1}}>{weeklyIncome.toLocaleString()}g</div>
              <div style={{fontSize:10,color:"#6E6350",marginTop:2}}>per week at {tierPosition}{['st','nd','rd'][tierPosition-1]||'th'} — climb the table, raise the tribute</div>
            </div>
            {!isPlatinum&&(
              <div style={{textAlign:"right",padding:"6px 10px",background:"rgba(64,97,79,0.09)",borderRadius:3,border:"1px solid rgba(64,97,79,0.225)"}}>
                <div style={{fontSize:9,color:"#40614F",marginBottom:1}}>Promote to {nextTier?.name}</div>
                <div style={{fontSize:12,fontWeight:700,color:"#40614F"}}>+{Math.max(0,(nextTier?.tributeBase||0)-currentTier.tributeBase)}g/wk on promotion</div>
              </div>
            )}
          </div>
        </div>


        {/* Recent match results */}
        {matchLog&&matchLog.length>0&&(
          <div style={{marginBottom:14}}>
            <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:10,color:"#6E6350",marginBottom:8,fontWeight:700,letterSpacing:1}}>RECENT RESULTS</div>
            {matchLog.slice(0,8).map((r,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",borderRadius:3,marginBottom:3,background:"rgba(60,52,38,0.036)"}}>
                <span style={{fontSize:9,color:"#6E6350",minWidth:28}}>Wk{r.week}</span>
                <span style={{fontSize:10,color:r.homeWon?"#40614F":"#8A7F68",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.home}</span>
                <span style={{fontSize:9,color:"#6E6350"}}>vs</span>
                <span style={{fontSize:10,color:r.homeWon?"#8A7F68":"#40614F",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textAlign:"right"}}>{r.away}</span>
              </div>
            ))}
          </div>
        )}

        {/* Season chronicle — the stories worth retelling */}
        {(chronicleEntries||[]).length>0&&(
          <div style={{marginBottom:14}}>
            <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:10,color:"#8A6D3B",marginBottom:8,fontWeight:700,letterSpacing:1}}>THE CHRONICLE</div>
            {(chronicleEntries||[]).slice(0,10).map((e,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:6,padding:"5px 8px",borderRadius:3,marginBottom:3,background:"rgba(138,109,59,0.05)",border:"1px solid rgba(138,109,59,0.12)"}}>
                <span style={{fontSize:8,color:"#6E6350",minWidth:34,marginTop:1}}>S{e.season}·W{e.week}</span>
                <span style={{fontSize:10,color:"#4A4335",lineHeight:1.4}}>{e.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Past season trophies */}
        {trophies.length>0&&(
          <div style={{marginTop:4}}>
            <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:10,color:"#6E6350",marginBottom:8,fontWeight:700,letterSpacing:1}}>SEASON TROPHIES</div>
            {trophies.map((t,i)=>(
              <div key={i} style={{padding:"8px 12px",borderRadius:3,marginBottom:5,background:"rgba(138,109,59,0.06)",border:"1px solid rgba(138,109,59,0.18)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:12,color:"#8A6D3B"}}>Season {t.season}</span>
                  <span style={{fontSize:12,fontWeight:700,color:t.rank===1?"#8A6D3B":t.rank<=3?"#3C5A78":"#6E6350"}}>#{t.rank} of {t.totalTowns}</span>
                </div>
                {t.wins!=null&&<div style={{fontSize:10,color:"#6E6350",marginTop:2}}>{t.wins}W / {t.losses}L · {t.tier}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Hall of Fame */}
        {hallOfFame&&Object.keys(hallOfFame).length>0&&(
          <div style={{marginTop:16}}>
            <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:10,color:"#6E6350",marginBottom:8,fontWeight:700,letterSpacing:1}}>HALL OF FAME</div>

            {/* Star Player */}
            {hallOfFame.starPlayer&&(
              <div style={{padding:"10px 12px",borderRadius:3,background:"rgba(95,75,102,0.09)",border:"1px solid rgba(95,75,102,0.3)",marginBottom:6}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <HeroAvatar race={hallOfFame.starPlayer.race} size={18}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#5F4B66",fontFamily:"'Alegreya Sans',sans-serif"}}>Star Player</div>
                    <div style={{fontSize:12,fontWeight:700,color:"#23201A"}}>{hallOfFame.starPlayer.name}</div>
                    <div style={{fontSize:9,color:"#6E6350"}}>{hallOfFame.starPlayer.race} {hallOfFame.starPlayer.role} · Lv {hallOfFame.starPlayer.level} · {hallOfFame.starPlayer.pos}</div>
                    {hallOfFame.starPlayer.traits?.length>0&&<div style={{fontSize:9,color:"#6E6350",marginTop:1}}>{hallOfFame.starPlayer.traits.join(", ")}</div>}
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:20,fontWeight:900,color:"#5F4B66"}}>{hallOfFame.starPlayer.pwr}</div>
                    <div style={{fontSize:8,color:"#6E6350"}}>PWR</div>
                  </div>
                </div>
              </div>
            )}

            {/* Records row */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}>
              {hallOfFame.bestSeason&&(
                <div style={{padding:"8px 10px",borderRadius:3,background:"rgba(64,97,79,0.075)",border:"1px solid rgba(64,97,79,0.225)"}}>
                  <div style={{fontSize:9,color:"#40614F",fontWeight:700,marginBottom:2}}>Best Season</div>
                  <div style={{fontSize:14,fontWeight:900,color:"#23201A"}}>{hallOfFame.bestSeason.wins}W</div>
                  <div style={{fontSize:9,color:"#6E6350"}}>S{hallOfFame.bestSeason.season} · {hallOfFame.bestSeason.losses}L</div>
                </div>
              )}
              {hallOfFame.longestStreak&&(
                <div style={{padding:"8px 10px",borderRadius:3,background:"rgba(60,90,120,0.075)",border:"1px solid rgba(60,90,120,0.225)"}}>
                  <div style={{fontSize:9,color:"#3C5A78",fontWeight:700,marginBottom:2}}>Longest Streak</div>
                  <div style={{fontSize:14,fontWeight:900,color:"#23201A"}}>{hallOfFame.longestStreak.count}</div>
                  <div style={{fontSize:9,color:"#6E6350"}}>consecutive wins · S{hallOfFame.longestStreak.season}</div>
                </div>
              )}
              {hallOfFame.biggestUpset&&(
                <div style={{padding:"8px 10px",borderRadius:3,background:"rgba(154,91,43,0.075)",border:"1px solid rgba(154,91,43,0.225)"}}>
                  <div style={{fontSize:9,color:"#9A5B2B",fontWeight:700,marginBottom:2}}>Biggest Upset</div>
                  <div style={{fontSize:14,fontWeight:900,color:"#23201A"}}>{Math.round(hallOfFame.biggestUpset.winChance*100)}%</div>
                  <div style={{fontSize:9,color:"#6E6350"}}>vs {hallOfFame.biggestUpset.enemy} · S{hallOfFame.biggestUpset.season}</div>
                </div>
              )}
              {hallOfFame.longestStreak&&(
                <div style={{padding:"8px 10px",borderRadius:3,background:"rgba(138,109,59,0.075)",border:"1px solid rgba(138,109,59,0.225)"}}>
                  <div style={{fontSize:9,color:"#8A6D3B",fontWeight:700,marginBottom:2}}>Highest Tier</div>
                  <div style={{fontSize:11,fontWeight:700,color:"#8A6D3B",fontFamily:"'Alegreya Sans',sans-serif"}}>
                    {(()=>{const highestTier=trophies.reduce((best,t)=>{const ti=TIER_ORDER.indexOf(t.tier||"iron");return ti>TIER_ORDER.indexOf(best)? (t.tier||"iron"):best;},"iron");return `${TIERS[highestTier]?.icon} ${TIERS[highestTier]?.name}`;})()}
                  </div>
                  <div style={{fontSize:9,color:"#6E6350"}}>best tier reached</div>
                </div>
              )}
              {(hallOfFame.buildingsBuilt||0)>0&&(
                <div style={{padding:"8px 10px",borderRadius:3,background:"rgba(60,52,38,0.054)",border:"1px solid rgba(60,52,38,0.144)"}}>
                  <div style={{fontSize:9,color:"#6E6350",fontWeight:700,marginBottom:2}}>Builder</div>
                  <div style={{fontSize:14,fontWeight:900,color:"#23201A"}}>{hallOfFame.buildingsBuilt}</div>
                  <div style={{fontSize:9,color:"#6E6350"}}>of {BUILDINGS.length} buildings constructed</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const SAVE_KEY    = "realm_manager_v2";
// Device display preference — deliberately NOT in the save blob: night mode
// follows the device (and its lighting), not the campaign, so it survives
// New Legacy resets and applies to every save on this browser.
const NIGHT_KEY   = "realm_manager_night";
const NG_PLUS_KEY = "realm_manager_ng_plus";

function loadNGPlus() {
  try { return JSON.parse(localStorage.getItem(NG_PLUS_KEY)||"null"); } catch { return null; }
}
function saveNGPlus(data) {
  try { localStorage.setItem(NG_PLUS_KEY, JSON.stringify(data)); } catch {}
}
function clearNGPlus() {
  localStorage.removeItem(NG_PLUS_KEY);
}

// Formation stores full hero objects in state but we only save IDs,
// then rehydrate after loading heroes.
function serializeFormation(formation) {
  const out = {};
  POS_KEYS.forEach(p => {
    out[p] = (formation[p] || []).map(h => h ? h.id : null);
  });
  return out;
}

function deserializeFormation(saved, heroes, skipUnavailable = false) {
  const out = {};
  POS_KEYS.forEach(p => {
    out[p] = (saved[p] || [null, null]).map(id => {
      if (id === null) return null;
      const h = heroes.find(hh => hh.id === id) || null;
      // When loading a preset, don't re-field heroes who are currently away or
      // injured — leave the slot empty so the player fills it, instead of quietly
      // seating an ineligible hero they then have to hunt down and remove.
      if (skipUnavailable && h && (h.injured || (h.awayWeeks || 0) > 0)) return null;
      return h;
    });
  });
  return out;
}

function saveGame(state) {
  try {
    const blob = {
      v: 2,
      gold: state.gold,
      week: state.week,
      heroes: state.heroes,
      buildings: state.buildings,
      formation: serializeFormation(state.formation),
      market: state.market,
      log: state.log.slice(0, 40),
      playerRenown: 0, // removed — kept for save compatibility only
      season: state.season,
      seasonWeek: state.seasonWeek,
      trophies: state.trophies,
      playerTier: state.playerTier,
      tierPosition: state.tierPosition,
      tierEnemyTowns: state.tierEnemyTowns,
      scheduledOpponent: state.scheduledOpponent,
      negotiationQueue: state.negotiationQueue,
      townName: state.townName,
      townColor: state.townColor,
      listedHeroIds: [...(state.listedHeroIds||[])],
      transferBids: state.transferBids,
      formationPresets: state.formationPresets,
      seasonStartSnapshot: state.seasonStartSnapshot,
      leagueTable: state.leagueTable,
      playerRecord: state.playerRecord,
      matchLog: state.matchLog,
      activeEvent: state.activeEvent,
      showHiddenStats: state.showHiddenStats,
      signDiscount: state.signDiscount,
      squadLeaderId: state.squadLeaderId,
      retiredLegends: state.retiredLegends,
      retirees: state.retirees,
      raceSynergyUsage: state.raceSynergyUsage,
      hallOfFame: state.hallOfFame,
      currentStreak: state.currentStreak,
      legendaryChallenger: state.legendaryChallenger,
      emissaryFiredThisSeason: state.emissaryFiredThisSeason,
      hintDismissed: state.hintDismissed,
      leaderHintDismissed: state.leaderHintDismissed,
      bankruptcyWeeks: state.bankruptcyWeeks,
      lastWeekFinances: state.lastWeekFinances,
      seasonFinances: state.seasonFinances,
      pendingEventReturns: state.pendingEventReturns,
      wanderingMasterLastSeason: state.wanderingMasterLastSeason,
      pendingChallenge: state.pendingChallenge,
      nextEventWeek: state.nextEventWeek,
      scoutingFog: state.scoutingFog,
      chronicleEntries: state.chronicleEntries,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(blob));
  } catch(e) {
    console.warn("Save failed:", e);
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const blob = JSON.parse(raw);
    if (!blob || (blob.v !== 1 && blob.v !== 2)) return null;
    // v1 → v2: transfer fees were scaled up (TRANSFER_FEE_SCALE). Stored values are
    // pre-scale, so multiply every persisted hero value to price old squads/market/
    // rivals consistently with the new market. Free heroes (value 0) stay free.
    if(blob.v === 1){
      const scaleVal = h => (h && h.value>0) ? {...h, value: Math.round(h.value*TRANSFER_FEE_SCALE)} : h;
      if(Array.isArray(blob.heroes)) blob.heroes = blob.heroes.map(scaleVal);
      if(Array.isArray(blob.market)) blob.market = blob.market.map(scaleVal);
      if(Array.isArray(blob.tierEnemyTowns)) blob.tierEnemyTowns = blob.tierEnemyTowns.map(t=> t&&Array.isArray(t.roster) ? {...t, roster: t.roster.map(scaleVal)} : t);
      if(blob.seasonStartSnapshot&&Array.isArray(blob.seasonStartSnapshot.heroes)) blob.seasonStartSnapshot = {...blob.seasonStartSnapshot, heroes: blob.seasonStartSnapshot.heroes.map(scaleVal)};
      if(Array.isArray(blob.transferBids)) blob.transferBids = blob.transferBids.map(b=> b&&b.offer>0 ? {...b, offer: Math.round(b.offer*TRANSFER_FEE_SCALE)} : b);
      blob.v = 2;
    }
    // Normalise heroes — ensure traits is always an array
    if(blob.heroes) blob.heroes = blob.heroes.map(h=>({...h, traits: Array.isArray(h.traits)?h.traits:[]}));
    return blob;
  } catch(e) {
    return null;
  }
}

function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}

// Formats the home screen's Continue block from a parsed save blob.
// Pure + exported so the engine suite can lock the shape.
export function realmSummary(saved) {
  if (!saved || !saved.townName) return null;
  const tierName = TIERS[saved.playerTier]?.name ?? "Iron";
  return {
    name: saved.townName,
    color: saved.townColor || "#8A6D3B",
    line: `${tierName} · Season ${saved.season ?? 1}, Week ${saved.seasonWeek ?? 1} · ${(saved.gold ?? 0).toLocaleString()}g`,
  };
}

// ─── BOOT ────────────────────────────────────────────────────────────────────
// Transient handoff for "start a new realm": set before the reload, consumed
// on the next boot so the player lands directly in setup. sessionStorage, not
// part of any save blob.
const INTENT_KEY = "rm_intent";
function consumeIntent() {
  try {
    const v = sessionStorage.getItem(INTENT_KEY);
    if (v) sessionStorage.removeItem(INTENT_KEY);
    return v;
  } catch { return null; }
}
function requestNewRealm() {
  clearSave(); // the Legacy blob (NG+) is untouched
  try { sessionStorage.setItem(INTENT_KEY, "new"); } catch { /* private mode */ }
  window.location.reload();
}

// The splash always plays: long enough for the coronet to finish inking
// (draw ends ~1.4s), short enough to stay out of the way. Reduced-motion
// users skip the artificial hold — for them it's a font gate only.
const BOOT_MIN_MS = 1600;
const BOOT_FONT_CAP_MS = 2500;
function prefersReducedMotion() {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
}

// Splash while fonts load. Styled with fallback faces on purpose — it renders
// before the display font it is waiting for. The coronet inks itself in
// (stroke-dash draw) while the press bar sweeps — printed-matter motion only:
// no gradients, no glows, and everything stills under prefers-reduced-motion.
function BootSplash() {
  return (
    <div style={{position:"fixed",inset:0,background:"#E9E1CE",zIndex:400,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <style>{`
        @keyframes rmBootSweep{0%{transform:translateX(-120%)}100%{transform:translateX(320%)}}
        @keyframes rmBootDraw{to{stroke-dashoffset:0}}
        @keyframes rmBootSettle{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @media (prefers-reduced-motion: reduce){.rm-boot-anim{animation:none !important;stroke-dashoffset:0 !important;opacity:1 !important;transform:none !important}}
      `}</style>
      <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke="#8A6D3B" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path className="rm-boot-anim" d={GLYPH_PATHS.leader}
          style={{strokeDasharray:70,strokeDashoffset:70,animation:"rmBootDraw 1.3s ease-out 0.1s forwards"}}/>
      </svg>
      <div className="rm-boot-anim" style={{fontFamily:"'IM Fell English SC',Georgia,serif",fontWeight:900,fontSize:22,color:"#23201A",letterSpacing:1,marginTop:10,opacity:0,animation:"rmBootSettle 0.6s ease-out 0.35s forwards"}}>Realm Manager</div>
      <div className="rm-boot-anim" style={{fontFamily:"'Alegreya Sans',system-ui,sans-serif",fontSize:10,letterSpacing:2,color:"#6E6350",marginTop:3,opacity:0,animation:"rmBootSettle 0.6s ease-out 0.55s forwards"}}>FANTASY SQUAD SIMULATOR</div>
      <div style={{width:120,height:2,background:"rgba(60,52,38,0.15)",borderRadius:1,marginTop:22,overflow:"hidden"}}>
        <div className="rm-boot-anim" style={{width:"40%",height:"100%",background:"#8A6D3B",animation:"rmBootSweep 1.1s linear infinite"}}/>
      </div>
    </div>
  );
}

// The front door. Continue resumes the saved realm; Found a New Realm starts
// over (confirm-guarded when a realm exists — the Legacy is always kept); the
// Legacy strip shows meta-progress that survives across realms.
function HomeScreen({saved,onContinue,onNewRealm}){
  const [confirming,setConfirming]=useState(false);
  const ng=loadNGPlus();
  const summary=realmSummary(saved);
  const wins=ng?.wins??0;
  const boons=(ng?.earnedBoons??[]).length;
  const hasLegacy=wins>0||boons>0;
  return(
    <div style={{position:"fixed",inset:0,background:"#E9E1CE",zIndex:390,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 16px",overflowY:"auto",fontFamily:"'Alegreya Sans',sans-serif"}}>
      {/* Entrance motion: the masthead presses in like a stamp, the blocks
          rise in staggered like laid type. Printed-matter rules hold — flat
          ink only — and everything stills under prefers-reduced-motion. */}
      <style>{`
        @keyframes rmHomeStamp{from{opacity:0;transform:scale(1.08)}60%{opacity:1;transform:scale(0.99)}to{opacity:1;transform:scale(1)}}
        @keyframes rmHomeRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .rm-home-stamp{animation:rmHomeStamp 0.5s ease-out both}
        .rm-home-rise{animation:rmHomeRise 0.45s ease-out both}
        @media (prefers-reduced-motion: reduce){.rm-home-stamp,.rm-home-rise{animation:none !important}}
      `}</style>
      {/* paper grain, matching the in-game backdrop */}
      <div style={{position:"fixed",inset:0,backgroundImage:"radial-gradient(1px 1px at 12% 20%,rgba(60,52,38,0.10) 0%,transparent 100%),radial-gradient(1px 1px at 68% 50%,rgba(60,52,38,0.08) 0%,transparent 100%),radial-gradient(1px 1px at 38% 78%,rgba(60,52,38,0.07) 0%,transparent 100%)",pointerEvents:"none"}}/>
      <div style={{width:"min(340px,92vw)",textAlign:"center"}}>
        <div className="rm-home-stamp">
          <Glyph id="leader" size={30} color="#8A6D3B"/>
          <div style={{fontFamily:"'IM Fell English SC',serif",fontWeight:900,fontSize:26,color:"#23201A",letterSpacing:1,marginTop:8}}>Realm Manager</div>
          <div style={{fontSize:10,letterSpacing:2,color:"#6E6350",marginTop:2,marginBottom:26}}>FANTASY SQUAD SIMULATOR</div>
        </div>

        {summary&&(
          <button onClick={onContinue} className="rm-home-rise"
            style={{display:"block",width:"100%",padding:"13px 16px",borderRadius:3,border:"none",cursor:"pointer",background:summary.color,color:"#F0E8D5",textAlign:"left",marginBottom:10,animationDelay:"0.2s"}}>
            <div style={{fontFamily:"'IM Fell English SC',serif",fontWeight:900,fontSize:15,letterSpacing:0.5}}>Continue — {summary.name}</div>
            <div style={{fontSize:10,opacity:0.85,marginTop:3,fontFamily:"'Alegreya Sans',sans-serif"}}>{summary.line}</div>
          </button>
        )}

        <div className="rm-home-rise" style={{animationDelay:summary?"0.32s":"0.2s"}}>
        {!confirming?(
          <button onClick={()=>{ summary?setConfirming(true):onNewRealm(); }}
            style={{display:"block",width:"100%",padding:summary?"11px 16px":"13px 16px",borderRadius:3,cursor:"pointer",
              border:summary?"1px solid rgba(60,52,38,0.28)":"none",
              background:summary?"rgba(60,52,38,0.07)":"#8A6D3B",
              color:summary?"#4A4335":"#F0E8D5",
              fontFamily:summary?"'Alegreya Sans',sans-serif":"'IM Fell English SC',serif",
              fontWeight:summary?700:900,fontSize:summary?12:15,letterSpacing:summary?0:1}}>
            Found a New Realm
          </button>
        ):(
          <div style={{padding:"12px 14px",borderRadius:3,background:"rgba(154,91,43,0.09)",border:"1px solid rgba(154,91,43,0.3)",textAlign:"left"}}>
            <div style={{fontSize:11,color:"#9A5B2B",fontWeight:700,marginBottom:4}}>Abandon {summary.name}?</div>
            <div style={{fontSize:10,color:"#4A4335",lineHeight:1.5,marginBottom:8}}>
              Your current realm will be abandoned. Your Legacy — achievements and boons — is kept.
            </div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={onNewRealm}
                style={{fontSize:11,padding:"6px 12px",borderRadius:3,border:"none",background:"#9A5B2B",color:"#F0E8D5",cursor:"pointer",fontWeight:700,fontFamily:"'Alegreya Sans',sans-serif"}}>
                Found a New Realm
              </button>
              <button onClick={()=>setConfirming(false)}
                style={{fontSize:11,padding:"6px 12px",borderRadius:3,border:"1px solid rgba(60,52,38,0.22)",background:"rgba(60,52,38,0.072)",color:"#6E6350",cursor:"pointer"}}>
                Cancel
              </button>
            </div>
          </div>
        )}
        </div>

        {hasLegacy&&(
          <div className="rm-home-rise" style={{borderTop:"1px solid rgba(60,52,38,0.15)",marginTop:26,paddingTop:12,animationDelay:"0.44s"}}>
            <div style={{fontSize:9,letterSpacing:2,color:"#8A6D3B",fontWeight:700}}>YOUR LEGACY</div>
            <div style={{fontSize:10,color:"#6E6350",marginTop:4}}>
              {wins} conquest{wins===1?"":"s"} · {boons} boon{boons===1?"":"s"} earned · Realm #{wins+1} awaits
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SETUP SCREEN ────────────────────────────────────────────────────────────

// Playtest gate: append ?dev to the URL to reveal testing controls (e.g. starting
// in a higher tier to skip straight to Bronze). Invisible in normal play; safe to
// ship because it only unlocks when the flag is present in the query string.
const DEV_MODE = (() => { try { return new URLSearchParams(window.location.search).has("dev"); } catch { return false; } })();

function SetupScreen({ onComplete }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(TOWN_COLORS[0].value);
  const [nameError, setNameError] = useState(false);
  const [step, setStep] = useState("setup"); // "setup" | "boons"
  const [selectedBoons, setSelectedBoons] = useState(new Set());
  const [startTier, setStartTier] = useState("iron"); // dev-only: which tier a new game starts in
  const ng = loadNGPlus();
  const availableBoons = ng?.earnedBoons ?? [];

  const handleStart = () => {
    const trimmed = name.trim();
    if (!trimmed) { setNameError(true); return; }
    if (availableBoons.length > 0) {
      setStep("boons");
    } else {
      onComplete(trimmed, color, [], startTier);
    }
  };

  const toggleBoon = (id) => {
    setSelectedBoons(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (step === "boons") {
    // Deduplicate for display but track counts
    const boonCounts = {};
    availableBoons.forEach(id => { boonCounts[id] = (boonCounts[id]||0)+1; });
    const uniqueBoonIds = Object.keys(boonCounts);

    return (
      <div style={{position:"fixed",inset:0,background:"#E9E1CE",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,fontFamily:"'Alegreya Sans',sans-serif",overflowY:"auto",padding:"16px 0"}}>
        <div style={{width:"min(520px,92vw)",padding:"32px 28px",background:"rgba(60,52,38,0.045)",border:"1px solid rgba(138,109,59,0.3)",borderRadius:3}}>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontFamily:"'IM Fell English SC',serif",fontWeight:900,fontSize:18,color:"#8A6D3B",marginBottom:4}}>Legacy Boons</div>
            <div style={{fontSize:11,color:"#6E6350"}}>Choose which boons to activate in this realm. Each can be used once. You can choose none for a clean start.</div>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
            {uniqueBoonIds.map(id => {
              const a = ACHIEVEMENTS.find(x=>x.id===id);
              if(!a) return null;
              const isSelected = selectedBoons.has(id);
              const count = boonCounts[id];
              return(
                <div key={id} onClick={()=>toggleBoon(id)}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:3,cursor:"pointer",
                    background:isSelected?"rgba(138,109,59,0.105)":"rgba(60,52,38,0.054)",
                    border:`1px solid ${isSelected?"rgba(138,109,59,0.55)":"rgba(60,52,38,0.144)"}`,
                    transition:"all 0.15s"}}>
                  <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${isSelected?"#8A6D3B":"#95896F"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {isSelected&&<div style={{width:8,height:8,borderRadius:"50%",background:"#8A6D3B"}}/>}
                  </div>
                  <span style={{fontSize:22,flexShrink:0}}>{a.boon.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:700,color:isSelected?"#8A6D3B":"#23201A",fontFamily:"'Alegreya Sans',sans-serif"}}>
                      {a.boon.name}
                      {count>1&&<span style={{fontSize:9,color:"#9A5B2B",marginLeft:6}}>×{count}</span>}
                    </div>
                    <div style={{fontSize:10,color:"#6E6350",marginTop:2}}>{a.boon.desc}</div>
                  </div>
                  <span style={{fontSize:9,color:"#6E6350",flexShrink:0}}>{a.icon} {a.name}</span>
                </div>
              );
            })}
          </div>

          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>onComplete(name.trim(), color, [], startTier)}
              style={{flex:1,padding:"11px 0",borderRadius:3,border:"1px solid rgba(60,52,38,0.22)",background:"rgba(60,52,38,0.054)",color:"#6E6350",cursor:"pointer",fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:11}}>
              No Boons
            </button>
            <button onClick={()=>onComplete(name.trim(), color, [...selectedBoons], startTier)}
              style={{flex:2,padding:"11px 0",borderRadius:3,border:"none",cursor:"pointer",
                background:selectedBoons.size>0?"#9A5B2B":"rgba(60,52,38,0.108)",
                color:selectedBoons.size>0?"#F0E8D5":"#8A7F68",
                fontFamily:"'Alegreya Sans',sans-serif",fontWeight:900,fontSize:12}}>
              {selectedBoons.size>0 ? `Begin with ${selectedBoons.size} Boon${selectedBoons.size>1?"s":""}` : "Begin without Boons"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position:"fixed", inset:0,
      background:"#E9E1CE",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:300, fontFamily:"'Alegreya Sans',sans-serif", overflowY:"auto",
      padding:"16px 0",
    }}>
      <div style={{
        width:"min(480px,92vw)", padding:"36px 32px",
        background:"rgba(60,52,38,0.045)",
        border:"1px solid rgba(60,52,38,0.144)",
        borderRadius:3,
      }}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:10}}>
          <div style={{fontFamily:"'IM Fell English SC',serif",fontWeight:900,fontSize:26,background:"#8A6D3B",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4}}>
            REALM MANAGER
          </div>
          <div style={{fontSize:10,color:"#6E6350",letterSpacing:2,marginBottom:12}}>FANTASY SQUAD SIMULATOR</div>
          <div style={{fontSize:12,color:"#6E6350",lineHeight:1.6,maxWidth:340,margin:"0 auto 16px"}}>
            Build a dynasty of heroes. Send them to battle. Watch them rise, peak, and retire as legends. Climb from Iron to Platinum — or fall trying.
          </div>
          {/* Three pillars */}
          <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:4}}>
            {[
              {icon:"", label:"Battle", sub:"Win fights, earn gold"},
              {icon:"", label:"Manage", sub:"Sign, rest, rotate"},
              {icon:"", label:"Conquer", sub:"Reach Rank #1"},
            ].map(({icon,label,sub})=>(
              <div key={label} style={{flex:1,padding:"8px 6px",borderRadius:3,background:"rgba(60,52,38,0.054)",border:"1px solid rgba(60,52,38,0.108)",textAlign:"center"}}>
                <div style={{fontSize:16,marginBottom:3}}>{icon}</div>
                <div style={{fontSize:10,fontWeight:700,color:"#23201A",fontFamily:"'Alegreya Sans',sans-serif"}}>{label}</div>
                <div style={{fontSize:8,color:"#6E6350",marginTop:1}}>{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{height:1,background:"rgba(60,52,38,0.108)",marginBottom:20}}/>

        {/* NG+ returning champion notice */}
        {ng?.wins>0&&(
          <div style={{marginBottom:20,padding:"10px 14px",borderRadius:3,background:"rgba(154,91,43,0.12)",border:"1px solid rgba(154,91,43,0.45)"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#9A5B2B",marginBottom:3}}>Your Legacy — Realm #{ng.wins+1}</div>
            <div style={{fontSize:10,color:"#6E6350",lineHeight:1.5}}>
              {ng.wins} conquest{ng.wins>1?"s":""} to your name. Boons from your Legacy are available below.
            </div>
          </div>
        )}

        {/* Town name */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,color:"#6E6350",marginBottom:7,letterSpacing:1}}>REALM NAME</div>
          <input
            value={name}
            onChange={e=>{setName(e.target.value);setNameError(false);}}
            onKeyDown={e=>e.key==="Enter"&&handleStart()}
            placeholder="e.g. Ironveil, The Black Keep…"
            maxLength={28}
            style={{
              width:"100%", padding:"10px 14px", borderRadius:3,
              background:"rgba(60,52,38,0.108)",
              border:`1px solid ${nameError?"#7E2D26":"rgba(60,52,38,0.264)"}`,
              color:"#23201A", fontSize:15, outline:"none",
              fontFamily:"'Alegreya Sans',sans-serif", boxSizing:"border-box",
            }}
          />
          {nameError&&<div style={{fontSize:10,color:"#7E2D26",marginTop:4}}>Please name your realm before continuing.</div>}
        </div>

        {/* Colour picker */}
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,color:"#6E6350",marginBottom:10,letterSpacing:1}}>REALM COLOUR</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {TOWN_COLORS.map(c=>(
              <button key={c.value} onClick={()=>setColor(c.value)}
                style={{
                  display:"flex",alignItems:"center",gap:7,
                  padding:"7px 12px", borderRadius:3, border:"none", cursor:"pointer",
                  background:color===c.value?`${c.value}22`:"rgba(60,52,38,0.072)",
                  outline:`2px solid ${color===c.value?c.value:"transparent"}`,
                  transition:"all 0.15s",
                }}>
                <div style={{width:12,height:12,borderRadius:"50%",background:c.value,flexShrink:0}}/>
                <span style={{fontSize:11,color:color===c.value?c.value:"#7A6F58",fontWeight:color===c.value?700:400}}>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dev-only: starting tier (playtest — skip straight to Bronze etc.) */}
        {DEV_MODE&&(
          <div style={{marginBottom:24,padding:"10px 14px",borderRadius:3,background:"rgba(154,91,43,0.10)",border:"1px dashed rgba(154,91,43,0.5)"}}>
            <div style={{fontSize:11,color:"#9A5B2B",fontWeight:700,letterSpacing:1,marginBottom:8}}>PLAYTEST · STARTING TIER</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {TIER_ORDER.map(tid=>(
                <button key={tid} onClick={()=>setStartTier(tid)}
                  style={{padding:"6px 12px",borderRadius:3,border:"none",cursor:"pointer",
                    background:startTier===tid?"#9A5B2B":"rgba(60,52,38,0.072)",
                    color:startTier===tid?"#F0E8D5":"#7A6F58",
                    fontFamily:"'Alegreya Sans',sans-serif",fontWeight:startTier===tid?700:400,fontSize:11}}>
                  {TIERS[tid].name}
                </button>
              ))}
            </div>
            {startTier!=="iron"&&<div style={{fontSize:9,color:"#6E6350",marginTop:6}}>Starts a fresh campaign seeded in {TIERS[startTier].name} with a 20,000g stipend to build a competitive squad.</div>}
          </div>
        )}

        {/* Preview */}
        <div style={{
          padding:"12px 14px", borderRadius:3, marginBottom:24,
          background:`${color}0d`, border:`1px solid ${color}33`,
        }}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:color,flexShrink:0,boxShadow:`0 0 8px ${color}88`}}/>
            <div>
              <div style={{fontFamily:"'IM Fell English SC',serif",fontWeight:700,fontSize:14,color:color}}>
                {name.trim()||"Your Realm"}
              </div>
              <div style={{fontSize:9,color:"#6E6350",marginTop:1}}>{DEV_MODE&&startTier!=="iron"?`${TIERS[startTier].name} · Season 1 · 10 heroes · 20,000g starting gold`:"Rank #9 of 9 · Season 1 · 10 heroes · 2,500g starting gold"}</div>
            </div>
          </div>
        </div>

        <button onClick={handleStart}
          style={{
            width:"100%", padding:"13px 0", borderRadius:3,
            border:"none", cursor:"pointer",
            background:`${color}`,
            color:"#F0E8D5", fontFamily:"'IM Fell English SC',serif",
            fontWeight:900, fontSize:15, letterSpacing:1,
          }}>
          Found the Realm
        </button>
      </div>
    </div>
  );
}

function AbandonButton({onAbandon}){
  const [confirming,setConfirming]=useState(false);
  if(confirming) return(
    <div style={{display:"flex",flexDirection:"column",gap:6,padding:"10px 12px",borderRadius:3,background:"rgba(154,91,43,0.09)",border:"1px solid rgba(154,91,43,0.3)"}}>
      <div style={{fontSize:10,color:"#9A5B2B",fontWeight:700}}>Abandon this realm?</div>
      <div style={{fontSize:9,color:"#4A4335",lineHeight:1.5}}>
        Your realm falls. Achievements and boons earned<br/>
        so far are preserved in your Legacy.
      </div>
      <div style={{display:"flex",gap:6}}>
        <button onClick={()=>{setConfirming(false);onAbandon();}}
          style={{fontSize:10,padding:"4px 10px",borderRadius:3,border:"none",background:"#9A5B2B",color:"#F0E8D5",cursor:"pointer",fontWeight:700,fontFamily:"'Alegreya Sans',sans-serif"}}>
          Yes, abandon realm
        </button>
        <button onClick={()=>setConfirming(false)}
          style={{fontSize:10,padding:"4px 10px",borderRadius:3,border:"1px solid rgba(60,52,38,0.22)",background:"rgba(60,52,38,0.072)",color:"#6E6350",cursor:"pointer"}}>
          Cancel
        </button>
      </div>
    </div>
  );
  return(
    <button onClick={()=>setConfirming(true)}
      style={{fontSize:10,padding:"5px 12px",borderRadius:3,border:"1px solid rgba(154,91,43,0.45)",background:"rgba(154,91,43,0.105)",color:"#9A5B2B",cursor:"pointer",fontFamily:"'Alegreya Sans',sans-serif"}}>
      Abandon Realm
    </button>
  );
}

function NewGameButton(){
  const [confirming,setConfirming]=useState(false);
  if(confirming) return(
    <div style={{display:"flex",flexDirection:"column",gap:6,padding:"10px 12px",borderRadius:3,background:"rgba(126,45,38,0.09)",border:"1px solid rgba(126,45,38,0.3)"}}>
      <div style={{fontSize:10,color:"#7E2D26",fontWeight:700}}>This will erase your Legacy:</div>
      <div style={{fontSize:9,color:"#4A4335",lineHeight:1.5}}>
        • The current realm — progress and gold<br/>
        • All earned achievements and boons<br/>
        • Your conquest history<br/>
        This cannot be undone.
      </div>
      <div style={{display:"flex",gap:6}}>
        <button onClick={()=>{clearSave();clearNGPlus();window.location.reload();}}
          style={{fontSize:10,padding:"4px 10px",borderRadius:3,border:"none",background:"#7E2D26",color:"#F0E8D5",cursor:"pointer",fontWeight:700,fontFamily:"'Alegreya Sans',sans-serif"}}>
          Yes, erase everything
        </button>
        <button onClick={()=>setConfirming(false)}
          style={{fontSize:10,padding:"4px 10px",borderRadius:3,border:"1px solid rgba(60,52,38,0.22)",background:"rgba(60,52,38,0.072)",color:"#6E6350",cursor:"pointer"}}>
          Cancel
        </button>
      </div>
    </div>
  );
  return(
    <button onClick={()=>setConfirming(true)}
      style={{fontSize:10,padding:"5px 12px",borderRadius:3,border:"1px solid rgba(126,45,38,0.45)",background:"rgba(126,45,38,0.105)",color:"#7E2D26",cursor:"pointer",fontFamily:"'Alegreya Sans',sans-serif"}}>
      Erase Legacy
    </button>
  );
}

function GuideTab(){
  const [openSection,setOpenSection]=useState(null);
  const toggle=(id)=>setOpenSection(s=>s===id?null:id);
  const Section=({id,icon,title,children})=>(
    <div style={{marginBottom:8,borderRadius:3,overflow:"hidden",border:"1px solid rgba(60,52,38,0.126)"}}>
      <button onClick={()=>toggle(id)}
        style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"11px 14px",
          background:openSection===id?"rgba(60,52,38,0.09)":"rgba(60,52,38,0.036)",
          border:"none",cursor:"pointer",textAlign:"left"}}>
        <span style={{fontSize:16}}>{icon}</span>
        <span style={{flex:1,fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:12,color:"#23201A"}}>{title}</span>
        <span style={{fontSize:12,color:"#6E6350"}}>{openSection===id?"▼":"▶"}</span>
      </button>
      {openSection===id&&(
        <div style={{padding:"12px 16px",background:"rgba(30,24,14,0.07)",fontSize:11,color:"#6E6350",lineHeight:1.7}}>
          {children}
        </div>
      )}
    </div>
  );
  return(
    <div style={{maxWidth:640}}>
      <div style={{fontFamily:"'IM Fell English SC',serif",fontSize:15,fontWeight:700,color:"#3C5A78",marginBottom:14}}>How to Play</div>

      <Section id="loop" icon="" title="The Core Loop">
        <p style={{margin:"0 0 8px"}}>Each week you <b style={{color:"#23201A"}}>set your formation</b>, <b style={{color:"#23201A"}}>fight a battle</b>, and manage the aftermath. Winning earns gold and XP. Use gold to sign heroes, build your town, and grow your squad.</p>
        <p style={{margin:"0 0 8px"}}>A season is <b style={{color:"#23201A"}}>{SEASON_LENGTH} weeks</b>. At the end of each season the <b style={{color:"#40614F"}}>top 2 teams promote</b> to the next tier and the <b style={{color:"#7E2D26"}}>bottom 2 relegate</b>. The 5 tiers are Iron → Bronze → Silver → Gold → Platinum.</p>
        <p style={{margin:0}}>You win by <b style={{color:"#8A6D3B"}}>finishing 1st in the Platinum League</b>. Each promotion unlocks new buildings and stronger heroes.</p>
      </Section>

      <Section id="battle" icon="" title="How Battles Work">
        <p style={{margin:"0 0 8px"}}>Every battle is decided across <b style={{color:"#23201A"}}>3 phases</b> — Vanguard, Skirmisher, and Arbiter. Win 2 of 3 phases to win the battle. Each phase compares your heroes' combined score in that lane against the enemy's power share for that position.</p>
        <p style={{margin:"0 0 8px"}}>Win chance per phase is <b style={{color:"#23201A"}}>capped at 85% and floored at 15%</b> — even a dominant squad can lose a phase, and an underdog can always steal one.</p>
        <p style={{margin:"0 0 8px"}}>Every battle pays: winners take the full purse, and <b style={{color:"#8A6D3B"}}>even defeats collect a small appearance fee</b> — a cold streak hurts, but it never starves you outright.</p>
        <p style={{margin:"0 0 8px"}}>Some opponents have a <b style={{color:"#9A5B2B"}}>Specialisation</b> — a tactical style that boosts their power unless your formation counters it. The Battle tab shows what spec they're running and whether you're countering it.</p>
        <p style={{margin:0}}>After a battle the <b style={{color:"#3C5A78"}}>debrief</b> shows exactly which phase you won or lost and why. Use it to identify your weak lane.</p>
      </Section>

      <Section id="formation" icon="" title="Formation & Positions">
        <p style={{margin:"0 0 8px"}}>Three positions, 2 slots each. <b style={{color:"#7E2D26"}}>Vanguard</b> — frontline brawlers (Warriors, Paladins). <b style={{color:"#8A6D3B"}}>Skirmisher</b> — flankers and ambushers (Rangers, Rogues). <b style={{color:"#3C5A78"}}>Arbiter</b> — rear command (Mages, Clerics).</p>
        <p style={{margin:"0 0 8px"}}>Placing the <b style={{color:"#40614F"}}>ideal role</b> in the right position gives +10% to that hero's combat score. Pairing two ideal roles together (e.g. Warrior + Paladin in Vanguard) gives a further +7% pairing bonus. These are shown in the Tactics tab multiplier breakdown.</p>
        <p style={{margin:"0 0 8px"}}><b style={{color:"#40614F"}}>Retraining</b> — with the Training Grounds built, a hero whose stats favour another lane (marked ⊕ on their card) can change class from their profile: 40% of their value, 4 weeks out of action, once per hero per season. Stats carry over; only the role changes.</p>
        <p style={{margin:"0 0 8px"}}><b style={{color:"#5F4B66"}}>Race synergies</b> are separate — they apply to your whole formation rating when you have 3+ of compatible races, or 6 of the same race. Check the Race Composition panel in Tactics.</p>
        <p style={{margin:0}}>The Tactics tab shows <b style={{color:"#3C5A78"}}>Base → Effective</b> rating with a full multiplier breakdown. Click "Breakdown" to see exactly what's boosting or hurting your rating.</p>
      </Section>

      <Section id="heroes" icon="" title="Hero Management">
        <p style={{margin:"0 0 8px"}}><b style={{color:"#9A5B2B"}}>Fatigue</b> builds every battle (+15–25) and recovers on the bench (-25/week). Above 88 fatigue heroes lose effectiveness and risk injury. Rotate your bench regularly — the Recovery Lodge speeds this up.</p>
        <p style={{margin:"0 0 8px"}}><b style={{color:"#5F4B66"}}>Morale</b> swings up on wins, down on losses, and drifts −0.5/week toward a floor of 40 (it won't passively fall below that). Low morale also hardens contract talks — an unhappy hero demands more and loses patience faster. The Tavern gives +3 morale/week to all heroes.</p>
        <p style={{margin:"0 0 8px"}}><b style={{color:"#3C5A78"}}>Contracts</b> last 1–4 seasons by career stage, with a warning 6 weeks before expiry and early renewal available within 2 seasons of it. Talks resolve in one sitting: their <b>willingness gauge</b> shows exactly how your offer lands, and each pushy offer wears their hidden patience — traits set the temperament (Loyal concedes generously, Greedy barely moves, Stubborn won't haggle at all, Hot-headed storms out). Run their patience dry and you'll face final terms: refuse those and they <b>never re-sign</b>, playing out the contract and departing. An expired contract is a hard deadline — settle terms that week or they leave. Releasing a hero at contract end costs no morale penalty.</p>
        <p style={{margin:0}}><b style={{color:"#8A6D3B"}}>Traits</b> give small bonuses and penalties — combat (+3–7%), fatigue, morale, or contract modifiers. Conflicting trait pairs are blocked at generation. Check the trait badge on any hero for exact effects.</p>
      </Section>

      <Section id="economy" icon="" title="Hero Economy — Sign, Develop, Sell">
        <p style={{margin:"0 0 8px"}}><b style={{color:"#40614F"}}>Level 0 Prospects</b> are free to sign. Develop them through battles to raise their level, Form, and Reputation — then sell at Peak for a significant profit. This is your primary income cycle.</p>
        <p style={{margin:"0 0 8px"}}><b style={{color:"#8A6D3B"}}>Potential</b> is hidden until a hero has played 8–10 battles. The Hidden stats tab shows a progress bar. Build the <b style={{color:"#3C5A78"}}>Observatory</b> (Gold tier) to see the potential bucket (Low/Med/High/Elite) before you even sign a market hero.</p>
        <p style={{margin:"0 0 8px"}}><b style={{color:"#40614F"}}>Form</b> (1–10) tracks results: heroes whose lane wins its phase run hot; heroes in losing lanes go cold. On the bench, Form drifts back toward 5 — rust dulls a sharp edge, rest steadies a shaken one. Form 9 adds a +17% premium to rival offers. <b style={{color:"#3C5A78"}}>Reputation</b> grows with every battle and never decays — it increases how often and how much rival scouts bid.</p>
        <p style={{margin:0}}>The <b style={{color:"#8A6D3B"}}>Career Arc</b> panel in each hero's detail shows exactly where they are: Prospect → Rising → Peak → Fading → Veteran. Sell at Peak. Once Fading, bids drop to 60% of value.</p>
      </Section>

      <Section id="buildings" icon="" title="Buildings">
        <p style={{margin:"0 0 8px"}}>Each tier unlocks buildings, but you can only construct a <b style={{color:"#23201A"}}>limited number per tier</b> — <b style={{color:"#8A6D3B"}}>1 Iron · 1 Bronze · 2 Silver · 1 Gold · 1 Platinum</b> (6 of 11). Every tier is an either/or, so pick the buildings that fit your strategy. You can <b style={{color:"#7E2D26"}}>demolish</b> one to free its slot, but the gold is not refunded and rebuilding costs full price.</p>
        {[
          ["Iron",    [["Barracks","Heroes earn +20% XP per battle."],["Tavern","All heroes +3 morale each week."]]],
          ["Bronze",  [["Infirmary","Heroes suffer 30% fewer injuries; injuries heal 1 week faster."],["Recovery Lodge","Bench heroes recover fatigue 60% faster."]]],
          ["Silver",  [["Training Grounds","Bench heroes earn 20% of that week's battle XP; unlocks Retraining (class change)."],["Talent Network","Market refreshes every 3 weeks instead of 6."],["Trading Post","Heroes open to offers sell at 120% value, bids 50% more frequent."]]],
          ["Gold",    [["Grand Bazaar","Unlocks premium heroes in the market."],["Observatory","Shows potential bucket for all market heroes before signing."]]],
          ["Platinum",[["Elite Sanctum","Unlocks elite heroes in the market."],["Hall of Legends","Each retired hero adds weekly morale, scaled by level (cap +20/wk)."]]],
        ].map(([tier,buildings])=>(
          <div key={tier} style={{marginBottom:8}}>
            <div style={{fontSize:10,color:"#8A6D3B",fontWeight:700,marginBottom:3}}>{tier}</div>
            {buildings.map(([name,desc])=>(
              <div key={name} style={{marginBottom:2,paddingLeft:8}}>
                <span style={{color:"#23201A"}}>{name}</span><span style={{color:"#6E6350"}}> — {desc}</span>
              </div>
            ))}
          </div>
        ))}
      </Section>

      <Section id="synergies" icon="" title="Race Synergies & Duo Pacts">
        <p style={{margin:"0 0 8px"}}>Race synergies boost your whole formation rating — they stack on top of role placement bonuses. Only one synergy can be active at a time (the best one).</p>
        {[
          ["Mono-Race","6 heroes of the same race. The strongest synergies — each race has a unique bonus and trade-off (e.g. 6 Dwarves = near-impenetrable Vanguard but weak Skirmishers)."],
          ["Rainbow","6 heroes all of different races. A balanced +5% bonus with no weaknesses."],
          ["Duo Pact","3+ of one race and 3+ of a compatible race (e.g. Dwarf + Half-Orc = Iron Warbond). Shown in the Tactics tab Race Composition panel with exact race requirements."],
        ].map(([name,desc])=>(
          <div key={name} style={{marginBottom:6,paddingLeft:8,borderLeft:"2px solid rgba(60,52,38,0.22)"}}>
            <span style={{color:"#40614F",fontWeight:700}}>{name}</span><span style={{color:"#6E6350"}}> — {desc}</span>
          </div>
        ))}
        <p style={{margin:"8px 0 0",color:"#6E6350"}}>Role pairings are separate from race synergies and apply at the position level. Both can be active simultaneously.</p>
      </Section>

      <Section id="objectives" icon="" title="Objectives & Events">
        <p style={{margin:"0 0 8px"}}>Each season you get <b style={{color:"#3C5A78"}}>3 objectives</b>. Complete them for gameplay buffs — XP boosts, morale bonuses, fatigue reductions. They're visible in the Battle tab before you fight so you can adapt your formation.</p>
        <p style={{margin:0}}><b style={{color:"#5F4B66"}}>Random events</b> begin in season 2 and arrive every 4–8 weeks — any hero can be sent, no stat requirement to trigger. A hero's stats set the <b style={{color:"#23201A"}}>chance of success</b>, not whether the event appears. Heroes sent away earn gold, XP, and stat bonuses — but miss battles for 2–4 weeks. Events are worth accepting in most cases and provide reliable supplementary income.</p>
      </Section>

      <Section id="tips" icon="" title="Tips & Common Mistakes">
        {[
          "Don't field heroes above 88 fatigue — they lose 40% effectiveness. Rotate before big matches.",
          "Release heroes at contract end, not mid-contract — no morale hit and no penalty.",
          "Potential is hidden for 8–10 battles. Don't sign long contracts until you know what you have.",
          "The phase breakdown in the battle debrief shows your weak lane — that's where to invest next.",
          "Counter the opponent's specialisation in the Battle tab — ignoring it gives them a free power boost.",
          "Sell heroes at Peak. A Fading hero at 60% value is often worth less than a free Prospect you develop.",
          "You can't build everything — each tier has limited build slots, so commit to the buildings that fit your strategy (demolishing refunds no gold).",
          "Build the Observatory before spending big on market signings — knowing the bucket prevents expensive mistakes.",
          "The Tactics multiplier breakdown shows every bonus active. Use it to understand exactly what's driving your rating.",
          "Squad Leader bonus scales with tenure — a long-serving Fading hero in that role still adds real value.",
          "Build the Training Grounds to retrain a hero whose stats favour another lane — 40% of their value, 4 weeks away, once per season.",
          "Check the Squad composition panel at the top of the Squad tab to spot race synergy opportunities.",
        ].map((tip,i)=>(
          <p key={i} style={{margin:"0 0 6px",paddingLeft:12,borderLeft:"2px solid rgba(60,90,120,0.3)"}}>{tip}</p>
        ))}
      </Section>
    </div>
  );
}

export default function App(){
  const isMobile = useIsMobile();

  // ── LOAD SAVE (once) ──────────────────────────────────────────────────────
  const saved = useMemo(() => loadGame(), []);

  const [townName,setTownName]       = useState(saved?.townName ?? "");
  const [townColor,setTownColor]     = useState(migrateTownColor(saved?.townColor));
  const [setupDone,setSetupDone]     = useState(!!(saved?.townName));

  // Front door: boot (splash) → home → setup|game. The intent flag lands a
  // post-reload "new realm" boot directly in setup; every other boot plays
  // the splash — held to BOOT_MIN_MS so the coronet finishes inking, gated
  // on fonts up to BOOT_FONT_CAP_MS (offline → proceed with fallback faces).
  const [screen,setScreen] = useState(()=>{
    if(consumeIntent()==="new" && !saved?.townName) return "setup";
    return "boot";
  });

  useEffect(()=>{
    if(screen!=="boot") return;
    let fontsDone=false, minDone=prefersReducedMotion(), finished=false;
    const tryFinish=()=>{ if(!finished && fontsDone && minDone){ finished=true; setScreen("home"); } };
    const tMin=setTimeout(()=>{ minDone=true; tryFinish(); }, BOOT_MIN_MS);
    const tCap=setTimeout(()=>{ fontsDone=true; tryFinish(); }, BOOT_FONT_CAP_MS);
    try { document.fonts.ready.then(()=>{ fontsDone=true; tryFinish(); }); } catch { fontsDone=true; tryFinish(); }
    return ()=>{ clearTimeout(tMin); clearTimeout(tCap); };
  },[screen]);

  const handleSetupComplete = (name, color, selectedBoons=[], startTier="iron") => {
    setTownName(name);
    setTownColor(color);
    // Apply selected boons
    if(selectedBoons.length>0){
      let state = {
        gold: 2500,
        heroes: generateStartingSquad(),
        buildings: BUILDINGS.map(b=>({...b,built:false})),
        market: Array.from({length:12},(_,i)=>generateHero(1000+i,true,false,false,null,null,"iron")),
      };
      selectedBoons.forEach(boonId=>{
        const a = ACHIEVEMENTS.find(x=>x.id===boonId);
        if(a?.boon?.apply) state = a.boon.apply(state);
      });
      setGold(state.gold);
      setHeroes(state.heroes);
      setBuildings(state.buildings);
      if(state.market) setMarket(state.market);
      // Remove used boons from ng_plus pool
      const ng = loadNGPlus();
      if(ng){
        const remaining = [...(ng.earnedBoons??[])];
        selectedBoons.forEach(id=>{
          const idx = remaining.indexOf(id);
          if(idx>-1) remaining.splice(idx,1);
        });
        saveNGPlus({...ng, earnedBoons:remaining});
      }
    }
    // Dev playtest: seed a fresh campaign directly into a higher tier so testing
    // can start where it's valuable (Bronze+) instead of grinding out Iron. Only
    // reachable via the ?dev URL flag. Overrides the tier-dependent state that the
    // useState initializers (and the mount effect that scheduled an Iron opponent)
    // set to Iron by default.
    if(DEV_MODE && startTier && startTier!=="iron"){
      const towns = generateTierTowns(startTier);
      const table = {};
      towns.forEach(e=>{ table[e.name]={wins:0,losses:0,power:e.power}; });
      setPlayerTier(startTier);
      setTierPosition(8);
      setTierEnemyTowns(towns);
      setLeagueTable(table);
      setMarket(Array.from({length:12},(_,i)=>generateHero(1000+i,true,false,false,null,null,startTier)));
      setGold(20000);
      setScheduledOpponent(generateScheduledOpponent(1, table, towns, startTier));
    }
    setSetupDone(true);
    setScreen("game");
  };

  const [gold,setGold]               = useState(saved?.gold ?? 2500);
  const [week,setWeek]               = useState(saved?.week ?? 1);
  // Migrate any legacy Bard heroes to Cleric — Bard removed in favour of 6-class system
  const migrateBards = (hs) => hs.map(h => h.role === "Bard" ? {...h, role:"Cleric"} : h);
  // Migrate any hero whose level doesn't match their xp (saves from before xpForLevel fix)
  const migrateLevels = (hs) => hs.map(h => {
    const correctLevel = Math.min(15, Math.max(0, typeof h.level==="number" ? h.level : 0));
    const correctXP = xpForLevel(correctLevel);
    return (h.xp==null||h.xp<correctXP) ? {...h, xp:correctXP} : h;
  });
  const [heroes,setHeroes] = useState(()=> migrateLevels(migrateBards(saved?.heroes ?? generateStartingSquad())));
  const [buildings,setBuildings]     = useState(()=> migrateBuildings(saved?.buildings));
  const [confirmDemolishId,setConfirmDemolishId] = useState(null);
  const [formation,setFormation]     = useState(()=>{
    if(saved?.formation && saved?.heroes) return deserializeFormation(saved.formation, heroes);
    return {Vanguard:[null,null],Skirmisher:[null,null],Arbiter:[null,null]};
  });
  // Formation slots hold hero object snapshots; heroes are replaced every week
  // (fatigue, injuries, XP, stat decay). Without this re-sync, combat and the
  // Battle tab read week-1 stats forever until a manual re-assign or reload.
  useEffect(()=>{
    setFormation(f=>{
      let changed=false;
      const nf={};
      POS_KEYS.forEach(p=>{
        nf[p]=(f[p]||[null,null]).map(slot=>{
          if(!slot) return null;
          const live=heroes.find(h=>h.id===slot.id)||null;
          if(live!==slot) changed=true;
          return live;
        });
      });
      return changed?nf:f;
    });
  },[heroes]);
  const [detailHero,setDetailHero]   = useState(null);
  const [prevStats,setPrevStats]     = useState(null);
  const [tab,setTab]                 = useState("Squad");
  const [market,setMarket] = useState(()=> migrateBards(saved?.market ?? Array.from({length:12},(_,i)=>generateHero(1000+i,true,false,false,null,null,"iron"))));
  const [log,setLog] = useState(()=>{
    if(saved?.log) return saved.log;
    const entries = [{week:0,text:"Your realm awaits. Keep your heroes happy and their contracts fresh.",type:"info"}];
    const starHero = (saved?.heroes ?? generateStartingSquad()).find(h=>h.foundling);
    if(starHero){
      entries.unshift({week:0,text:`${starHero.name} has joined your ranks — scouts whisper of extraordinary potential.`,type:"success"});
    }
    return entries;
  });
  const [lastWeekFinances,setLastWeekFinances] = useState(saved?.lastWeekFinances ?? null);
  // { week, tribute, wages, raidGold, eventGold, signingCosts, netGold, wasRaid, wasSkip }
  const [seasonFinances,setSeasonFinances] = useState(saved?.seasonFinances ?? { tribute:0, raidGold:0, wages:0, eventGold:0, signingCosts:0 });
  const [pendingEventReturns,setPendingEventReturns] = useState(saved?.pendingEventReturns ?? []);
  // [{ id, heroName, eventTitle, outcome, notifications, goldGain, pendingStatChoice }]
  const [wanderingMasterLastSeason,setWanderingMasterLastSeason] = useState(saved?.wanderingMasterLastSeason ?? -99);
  const [activeWanderingMaster,setActiveWanderingMaster] = useState(null);
  const [pendingChallenge,setPendingChallenge] = useState(saved?.pendingChallenge ?? null);
  const [nextEventWeek,setNextEventWeek] = useState(saved?.nextEventWeek ?? rand(4,8));
  // pendingChallenge: { opponentPowerMult, rewardMult } — active until next battle
  const [missionResult,setMissionResult] = useState(null);
  const [weekSummary,setWeekSummary]     = useState(null);
  const [levelUps,setLevelUps]       = useState([]);
  const [showMore,setShowMore] = useState(false);
  const [enemy,setEnemy]             = useState(null);
  const [filter,setFilter]           = useState({role:"All",race:"All",position:"All",sortBy:"Value",search:"",status:"All",phase:"All"});
  const [moreFiltersOpen,setMoreFiltersOpen] = useState(false);
  const [marketMoreOpen,setMarketMoreOpen] = useState(false);
  const [marketFilter,setMarketFilter] = useState({role:"All",race:"All",position:"All",stage:"All",sortBy:"Value"});
  const [retirees,setRetirees]       = useState(saved?.retirees ?? []);
  // Roll of the retired — persists their level-at-retirement so Hall of Legends
  // has something to read (the heroes array drops them the week they retire).
  const [retiredLegends,setRetiredLegends] = useState(saved?.retiredLegends ?? []);
  const [negotiationQueue,setNegotiationQueue] = useState(saved?.negotiationQueue ?? []);
  const [season,setSeason]               = useState(saved?.season ?? 1);
  const [seasonWeek,setSeasonWeek]       = useState(saved?.seasonWeek ?? 0);
  const [trophies,setTrophies]           = useState(saved?.trophies ?? []);

  // ── TIER LEAGUE STATE ──────────────────────────────────────────────────────
  const [playerTier,setPlayerTier]       = useState(saved?.playerTier ?? "iron");
  const [tierPosition,setTierPosition]   = useState(saved?.tierPosition ?? 8); // 1=top, 8=bottom
  const [tierEnemyTowns,setTierEnemyTowns] = useState(()=>{
    // Backfill managers/grudge records onto towns from older saves
    if(saved?.tierEnemyTowns) return saved.tierEnemyTowns.map(rehydrateTownAbilities).map(t=>({
      ...t, manager: t.manager||pickManager(), h2h: t.h2h||{wins:0,losses:0},
    }));
    return generateTierTowns("iron");
  });
  const [leagueTable,setLeagueTable]     = useState(()=>{
    if(saved?.leagueTable) return saved.leagueTable;
    // Must be built from the SAME towns as tierEnemyTowns — a second
    // generateTierTowns roll here used to seed the table with phantom towns
    const t={};
    tierEnemyTowns.forEach(e=>{ t[e.name]={wins:0,losses:0,power:e.power}; });
    return t;
  });
  const [activeSimulation,setActiveSimulation] = useState(null);
  const [pendingRaidEnemy,setPendingRaidEnemy] = useState(null);
  const [scheduledOpponent,setScheduledOpponent] = useState(saved?.scheduledOpponent ? rehydrateTownAbilities(saved.scheduledOpponent) : null);
  const [playerRecord,setPlayerRecord]         = useState(saved?.playerRecord ?? {wins:0,losses:0});
  // Filter out legacy match entries saved before the {home, away, homeWon} shape —
  // older saves stored {name, won} records which render as blank rows in the
  // Recent Results list. Drop them once on load; new entries use the new shape.
  const [matchLog,setMatchLog]                 = useState(()=>(saved?.matchLog??[]).filter(r=>r&&r.home&&r.away));
  const [activeEvent,setActiveEvent]           = useState(saved?.activeEvent ?? null);
  const [showHiddenStats,setShowHiddenStats]   = useState(saved?.showHiddenStats ?? false);
  const [scoutingFog,setScoutingFog]           = useState(saved?.scoutingFog ?? true); // hide enemy details until scouted
  const [chronicleEntries,setChronicleEntries] = useState(saved?.chronicleEntries ?? []); // season memory — the stories worth retelling
  const [squadLeaderId,setSquadLeaderId]       = useState(saved?.squadLeaderId ?? null);
  const [raceSynergyUsage,setRaceSynergyUsage] = useState(saved?.raceSynergyUsage ?? {}); // {raceSynergyId: count}
  const [ngPlus]                               = useState(()=>loadNGPlus()); // read-only during run
  const [legacyCeremony,setLegacyCeremony]     = useState(null); // fires when Rank 1 achieved or bankruptcy/abandon
  const [bankruptcyWeeks,setBankruptcyWeeks]   = useState(saved?.bankruptcyWeeks ?? 0); // 0–3 grace period counter
  const [hallOfFame,setHallOfFame]             = useState(saved?.hallOfFame ?? {});
  const [currentStreak,setCurrentStreak]       = useState(saved?.currentStreak ?? 0);
  const [legendaryChallenger,setLegendaryChallenger] = useState(saved?.legendaryChallenger ?? null); // set when player accepts emissary
  const [emissaryFiredThisSeason,setEmissaryFiredThisSeason] = useState(saved?.emissaryFiredThisSeason ?? false);
  const [hintDismissed,setHintDismissed]       = useState(saved?.hintDismissed ?? false);
  const [leaderHintDismissed,setLeaderHintDismissed] = useState(saved?.leaderHintDismissed ?? false);
  const [nightMode,setNightMode] = useState(()=>{try{return localStorage.getItem(NIGHT_KEY)==="1";}catch{return false;}});
  useEffect(()=>{
    if(nightMode) document.documentElement.dataset.theme="night";
    else document.documentElement.removeAttribute("data-theme");
    try{localStorage.setItem(NIGHT_KEY, nightMode?"1":"0");}catch{/* private browsing */}
  },[nightMode]);
  const [signDiscount,setSignDiscount]         = useState(saved?.signDiscount ?? 0); // 0–1 discount on next signing // pending random event // recent enemy-vs-enemy results
  const [activeBonuses,setActiveBonuses]       = useState(saved?.activeBonuses ?? []); // timed bonuses from events
  const [listedHeroIds,setListedHeroIds]       = useState(()=>new Set(saved?.listedHeroIds ?? []));
  const [transferBids,setTransferBids]         = useState(saved?.transferBids ?? []);
  const [formationPresets,setFormationPresets] = useState(saved?.formationPresets ?? [null,null]); // 2 slots for quick-swap formations
  const [seasonStartSnapshot,setSeasonStartSnapshot] = useState(saved?.seasonStartSnapshot ?? null); // diff target for the end-of-season summary
  const [seasonSummary,setSeasonSummary]         = useState(null); // set by endSeason; modal renders while set
  const [newOfferBids,setNewOfferBids]         = useState([]); // freshly-arrived bids for the pop-up modal

  const addLog=(text,type="info")=>setLog(l=>[{week,text,type},...l.slice(0,79)]);
  // Season chronicle — only the stories worth retelling (upsets, grudges,
  // injuries with names attached, promotions). Rendered in Dominion.
  const addChronicle=(text)=>setChronicleEntries(prev=>[{week:week+1,season,text},...prev].slice(0,40));

  // Generate first scheduled opponent on mount (only if no save)
  useEffect(()=>{
    if(!saved?.scheduledOpponent){
      setScheduledOpponent(generateScheduledOpponent(1, {}, tierEnemyTowns, playerTier));
    }
  },[]);

  // Seed the season snapshot once heroes are available (fresh new game OR
  // restored save that predates this feature). Fires at most once per run.
  useEffect(()=>{
    if(setupDone && !seasonStartSnapshot && heroes.length>0){
      setSeasonStartSnapshot(captureSeasonSnapshot(heroes, buildings));
    }
  },[setupDone, heroes.length]);

  // ── FORMATION SYNC — keep slot refs in sync with heroes state ─────────────
  // Formation slots hold hero objects by reference; when per-week updates
  // (fatigue, morale, injuries, level-ups) replace hero objects in `heroes`,
  // the formation copy goes stale. Re-map slots to the current hero by id so
  // displays (Tactics slots, Battle preview) and calculations (rating, battle)
  // always see up-to-date stats.
  useEffect(()=>{
    setFormation(f=>{
      const byId=new Map(heroes.map(h=>[h.id,h]));
      let changed=false;
      const nf={};
      POS_KEYS.forEach(p=>{
        nf[p]=(f[p]||[]).map(h=>{
          if(!h) return h;
          const fresh=byId.get(h.id);
          if(fresh && fresh!==h){changed=true;return fresh;}
          if(!fresh){changed=true;return null;} // hero was removed
          return h;
        });
      });
      return changed?nf:f;
    });
  },[heroes]);

  // ── AUTO-SAVE after any meaningful state change ───────────────────────────
  useEffect(()=>{
    // No realm founded yet (home/setup screens) → nothing worth saving. Without
    // this gate the mount-time autosave wrote a junk blob with townName:"" 400ms
    // after every boot — which made Erase Legacy leave debris behind.
    if(!setupDone) return;
    // Debounce slightly so rapid state updates don't thrash localStorage
    const t = setTimeout(()=>{
      saveGame({gold,week,heroes,buildings,formation,market,log,
                lastWeekFinances, seasonFinances, pendingEventReturns,
                wanderingMasterLastSeason, pendingChallenge, nextEventWeek,
                season,seasonWeek,trophies,
                playerTier,tierPosition,tierEnemyTowns,
                scheduledOpponent,negotiationQueue,
                townName,townColor,
                listedHeroIds:[...listedHeroIds],transferBids,formationPresets,seasonStartSnapshot,
                leagueTable,playerRecord,matchLog,activeEvent,showHiddenStats,scoutingFog,chronicleEntries,
                signDiscount,squadLeaderId,retiredLegends,retirees,
                hallOfFame,currentStreak,legendaryChallenger,emissaryFiredThisSeason,hintDismissed,leaderHintDismissed,raceSynergyUsage,bankruptcyWeeks});
    }, 400);
    return ()=>clearTimeout(t);
  },[setupDone,gold,week,heroes,buildings,formation,market,log,season,
     seasonWeek,trophies,playerTier,tierPosition,tierEnemyTowns,scheduledOpponent,negotiationQueue,townName,townColor,listedHeroIds,transferBids,formationPresets,seasonStartSnapshot,leagueTable,playerRecord,matchLog,activeEvent,showHiddenStats,scoutingFog,chronicleEntries,signDiscount,squadLeaderId,retiredLegends,retirees,raceSynergyUsage,hallOfFame,currentStreak,legendaryChallenger,emissaryFiredThisSeason,hintDismissed,leaderHintDismissed,bankruptcyWeeks]);

  // ── CONTRACT NEGOTIATION HANDLERS ─────────────────────────────────────────
  const handleSign=(hero,terms)=>{
    setHeroes(hs=>hs.map(h=>h.id!==hero.id?h:{
      ...h, salary:terms.salary, contractYears:terms.years,
      contractWeeks:terms.years*WEEKS_PER_CONTRACT_YEAR,
      contractWeeksLeft:terms.years*WEEKS_PER_CONTRACT_YEAR,
      negotiationPending:false, negotiationIgnoredWeeks:0,
      morale:Math.min(100,h.morale+15),
    }));
    setNegotiationQueue(q=>q.slice(1));
    addLog(`Signed ${hero.name}: ${terms.salary}g/wk for ${terms.years} season${terms.years>1?"s":""}.`,"success");
  };

  // An insulting offer at the table stings — the gauge reads live morale, so
  // the room visibly cools
  const handleNegotiationSting=(hero,delta)=>{
    setHeroes(hs=>hs.map(h=>h.id!==hero.id?h:{...h, morale:Math.max(10,h.morale+delta)}));
  };

  // Talks over for good: they will never re-sign. Hot-headed heroes with
  // weeks still on the contract storm out on the spot; everyone else plays
  // out their term (or, if already expired, departs when the week ends).
  const handleCollapse=(hero)=>{
    const hotHeaded=hero.traits?.includes("Hot-headed");
    if(hotHeaded&&(hero.contractWeeksLeft||0)>0){
      setHeroes(hs=>applySquadMoraleEvent(hs.filter(h=>h.id!==hero.id),hero,formation,"walkout"));
      setFormation(f=>{const nf={};POS_KEYS.forEach(p=>{nf[p]=(f[p]||[]).map(h=>h&&h.id===hero.id?null:h);});return nf;});
      if(squadLeaderId===hero.id) setSquadLeaderId(null);
      addLog(`${hero.name} (Hot-headed) stormed out of the talks and the realm in the same hour! The squad is rattled.`,"danger");
      addChronicle(`${hero.name} stormed out over a failed contract.`);
    } else {
      setHeroes(hs=>hs.map(h=>h.id!==hero.id?h:{
        ...h, refusesToSign:true, negotiationPending:false,
        morale:Math.max(10,h.morale-10),
      }));
      addLog((hero.contractWeeksLeft||0)<=0
        ? `${hero.name} will not re-sign. They depart when the week ends.`
        : `${hero.name} will not re-sign. They will see out the contract (${hero.contractWeeksLeft}w) and depart.`,"danger");
    }
    setNegotiationQueue(q=>q.filter(x=>x.id!==hero.id));
  };

  const initiateEarlyRenewal = (hero) => {
    // Only available within 2 seasons of expiry and when not already pending.
    // Collapsed talks are final — no reopening.
    if(hero.refusesToSign) return;
    if(hero.negotiationPending) return;
    if((hero.contractWeeksLeft||0) > WEEKS_PER_CONTRACT_YEAR * 2) return;
    setHeroes(hs=>hs.map(h=>h.id!==hero.id?h:{...h, negotiationPending:true, negotiationIgnoredWeeks:0}));
    // Queue immediately — the talks the player just asked for should open now,
    // not after the next battle's weekly tick
    setNegotiationQueue(q=>q.find(x=>x.id===hero.id)?q:[...q,{...hero, negotiationPending:true, negotiationIgnoredWeeks:0}]);
    addLog(`${hero.name} called in for early contract talks.`,"info");
  };

  const handlePostpone=(hero)=>{
    // Push the sitting to next week — only offered while the contract has
    // weeks left (expiry is a hard deadline)
    setHeroes(hs=>hs.map(h=>h.id!==hero.id?h:{
      ...h, morale:Math.max(10,h.morale-4),
      negotiationIgnoredWeeks:(h.negotiationIgnoredWeeks||0)+1,
    }));
    setNegotiationQueue(q=>q.slice(1));
    addLog(`${hero.name}'s contract talks postponed. They noticed.`,"info");
  };

  const releaseHero=h=>{
    const remaining=heroes.filter(x=>x.id!==h.id);
    const contractExpired = (h.contractWeeksLeft||0) === 0;

    if(contractExpired){
      // Contract expired — mutual parting, no morale penalty
      setHeroes(remaining);
      setFormation(f=>{const nf={};POS_KEYS.forEach(p=>{nf[p]=(f[p]||[]).map(x=>x&&x.id===h.id?null:x);});return nf;});
      setNegotiationQueue(q=>q.filter(x=>x.id!==h.id));
      if(squadLeaderId===h.id) setSquadLeaderId(null);
      setDetailHero(null);
      addLog(`${h.name} departed at contract end. Mutual parting — no morale impact.`,"info");
      return;
    }

    // Severity scales with tenure, level, and whether they were beloved
    // Base: -15 morale to all. Amplifiers: +5 per 50 weeks tenure, +5 per level above 4,
    // +8 if Inspiring trait (the squad really loved them), +5 if Squad Leader
    const tenureBonus    = Math.floor((h.weeksInSquad||0)/50)*5;
    const levelBonus     = Math.max(0,(h.level-4))*5;
    const inspiringBonus = h.traits?.includes("Inspiring") ? 8 : 0;
    const leaderBonus    = squadLeaderId===h.id ? 5 : 0;
    const basePenalty    = h.fodder ? 3 : 15; // fodder releases barely register
    const totalPenalty   = Math.min(40, basePenalty + tenureBonus + levelBonus + inspiringBonus + leaderBonus);

    // Apply morale hit — position-mates hit hardest (+5 extra)
    const posName = POS_KEYS.find(p=>(formation[p]||[]).some(x=>x&&x.id===h.id));
    const affected = remaining.map(r=>{
      const isSamePos = posName && (formation[posName]||[]).some(x=>x&&x.id===r.id);
      const swing = -(totalPenalty + (isSamePos?5:0));
      return {...r, morale:Math.min(100,Math.max(5,r.morale+swing))};
    });

    setHeroes(affected);
    setFormation(f=>{const nf={};POS_KEYS.forEach(p=>{nf[p]=(f[p]||[]).map(x=>x&&x.id===h.id?null:x);});return nf;});
    setNegotiationQueue(q=>q.filter(x=>x.id!==h.id));
    if(squadLeaderId===h.id) setSquadLeaderId(null);
    setDetailHero(null);

    if(h.fodder){
      addLog(`${h.name} was let go. The squad barely noticed.`,"info");
    } else {
      addLog(`${h.name} (Lv ${h.level}, ${h.weeksInSquad||0} weeks) was released. Squad morale −${totalPenalty}.`,"danger");
      if(totalPenalty>=25) addLog(`The squad is devastated. This will take weeks to recover.`,"danger");
      else if(totalPenalty>=15) addLog(`The squad is shaken. Morale will take time to recover.`,"warning");
      if(posName){
        const samePos=affected.filter(r=>(formation[posName]||[]).some(x=>x&&x.id===r.id));
        if(samePos.length>0) addLog(`${samePos.map(x=>x.name).join(", ")} are hit hardest — same position, lost a teammate.`,"warning");
      }
    }
  };

  const buyHero=h=>{
    if(heroes.filter(x=>!x.retired).length>=ROSTER_CAP){
      addLog(`Roster full (${ROSTER_CAP} heroes). Release or sell a hero first.`,"warning");
      return;
    }
    const discountedValue=signDiscount>0?Math.round(h.value*(1-signDiscount)):h.value;
    if(gold<discountedValue)return;
    const hasBazaar=buildings.find(b=>b.id==="bazaar"&&b.built);
    const hasSanctum=buildings.find(b=>b.id==="sanctum"&&b.built);
    const isElite   = !!(hasSanctum);
    const isPremium = hasBazaar || ["gold","platinum"].includes(playerTier);
    let nh={...h, id:Date.now(), baseStats: h.baseStats || {...h.stats}};
    // Unattached free signings get a real market value the moment they join the
    // squad — they've taken a banner now, no longer "Unattached".
    if(!nh.value || nh.value === 0) nh.value = calcHeroValue(nh);
    setGold(g=>g-discountedValue);
    setSeasonFinances(prev=>({...prev, signingCosts:prev.signingCosts+discountedValue}));
    if(signDiscount>0){
      addLog(`Objective discount applied: ${Math.round(signDiscount*100)}% off!`,"success");
      setSignDiscount(0);
    }
    setHeroes(hs=>[...hs,nh]);
    setMarket(m=>{
      const next=m.filter(x=>x.id!==h.id);
      if(hasBazaar&&Math.random()<0.5) return[...next,generateHero(Date.now()+1,true,isPremium,isElite&&Math.random()<0.3,null,null,playerTier)];
      return next;
    });
    const signLine = discountedValue===0
      ? `${h.name} signs for nothing but a bunk and a chance. A gamble on raw clay.`
      : h.marketTier==="elite"
      ? `The realm empties its vaults — ${h.name} signs for ${discountedValue.toLocaleString()}g. Now deliver.`
      : h.marketTier==="premium"
      ? `${h.name} signs for ${discountedValue.toLocaleString()}g. Pedigree costs.`
      : `Signed ${h.name} for ${discountedValue.toLocaleString()}g!`;
    addLog(signLine,"success");
    // Complete sign_hero objective
  };

  // ── RIVAL SQUADS: scout a town's notables, then buy one out ───────────────
  const scoutTownSquad=(townName)=>{
    const town=tierEnemyTowns.find(t=>t.name===townName);
    if(!town||town.squadScouted) return;
    const hasObservatory=buildings.find(b=>b.id==="scouts"&&b.built);
    const cost=Math.round((40*(TIERS[playerTier]?.difficulty||1)+40)*(hasObservatory?0.5:1));
    if(gold<cost){ addLog(`A squad report on ${townName} costs ${cost}g — the coffers can't cover it.`,"warning"); return; }
    setGold(g=>g-cost);
    setTierEnemyTowns(ts=>ts.map(t=>t.name===townName
      ? {...t, squadScouted:true, roster:(t.roster&&t.roster.length)?t.roster:generateRivalRoster(t, playerTier)}
      : t));
    addLog(`Squad report on ${townName} (−${cost}g) — six notables identified${hasObservatory?" (Observatory rate)":""}.`,"info");
  };

  const buyRivalHero=(townName, heroId)=>{
    const town=tierEnemyTowns.find(t=>t.name===townName);
    const hero=town?.roster?.find(h=>h.id===heroId);
    if(!town||!hero) return;
    if((town.soldThisSeason||0)>=1){
      addLog(`${town.manager?.name||townName} refuses — no realm sells twice in a season.`,"warning");
      return;
    }
    if(heroes.filter(x=>!x.retired).length>=ROSTER_CAP){
      addLog(`Roster full (${ROSTER_CAP} heroes). Release or sell a hero first.`,"warning");
      return;
    }
    const scores=town.roster.map(h=>Math.max(...POS_KEYS.map(p=>calcHeroCombatScore(h,p))));
    const isTalisman=Math.max(...scores)===Math.max(...POS_KEYS.map(p=>calcHeroCombatScore(hero,p)))&&town.roster.length>1;
    const price=rivalAskingPrice(town, hero, isTalisman);
    if(gold<price) return;
    setGold(g=>g-price);
    setSeasonFinances(prev=>({...prev, signingCosts:prev.signingCosts+price}));
    const nh={...hero, id:Date.now(), morale:75, fatigue:0, injured:false, injuryWeeks:0,
      weeksInSquad:0, weeksInFormation:0, weeksUnplayed:0, potentialRevealed:false,
      contractYears:2, contractWeeks:2*WEEKS_PER_CONTRACT_YEAR, contractWeeksLeft:2*WEEKS_PER_CONTRACT_YEAR,
      negotiationPending:false, negotiationIgnoredWeeks:0, mentorBonus:null,
      baseStats:hero.baseStats||{...hero.stats}, value:calcHeroValue(hero)};
    setHeroes(hs=>[...hs,nh]);
    // The seller is weakened — their power drops with their notable
    const newPower=Math.max(Math.round((TIERS[playerTier]?.powerMin||60)*0.85), town.power-Math.max(4,Math.round(town.power*0.08)));
    setTierEnemyTowns(ts=>ts.map(t=>t.name===townName
      ? {...t, roster:t.roster.filter(h=>h.id!==heroId), soldThisSeason:(t.soldThisSeason||0)+1, power:newPower}
      : t));
    setLeagueTable(prev=>prev[townName]?{...prev,[townName]:{...prev[townName],power:newPower}}:prev);
    addLog(`Poached ${hero.name} from ${townName} for ${price.toLocaleString()}g${town.manager?` — ${town.manager.name} will not forget this`:""}.`,"success");
    addChronicle(`${hero.name} bought out of ${townName} for ${price.toLocaleString()}g${isTalisman?" — their talisman, taken":""}.`);
  };

  const buildBuilding=b=>{
    if(gold<b.cost)return;
    if(buildingCapReached(buildings, b.tierRequired)) return; // tier slot full
    setGold(g=>g-b.cost);
    setBuildings(bs=>bs.map(x=>x.id===b.id?{...x,built:true}:x));
    addLog(`${b.name} constructed!`,"success");
    setHallOfFame(prev=>({...prev, buildingsBuilt:(prev.buildingsBuilt||0)+1}));
    // Bazaar: spawn premium (not elite) heroes — elite reserved for Elite Sanctum
    if(b.id==="bazaar"){
      setMarket(m=>[...m,...Array.from({length:3},(_,i)=>generateHero(Date.now()+i,true,true,false,null,null,playerTier))]);
      addLog("Grand Bazaar: premium heroes arrived!","success");
    }
    // Elite Sanctum: spawn elite heroes immediately + flag market for future elite spawns
    if(b.id==="sanctum"){
      setMarket(m=>[...m,...Array.from({length:2},(_,i)=>generateHero(Date.now()+i,true,true,true,null,null,playerTier))]);
      addLog("Elite Sanctum: elite heroes have arrived seeking a worthy realm!","success");
    }
  };

  const demolishBuilding=b=>{
    setBuildings(bs=>bs.map(x=>x.id===b.id?{...x,built:false}:x));
    addLog(`${b.name} demolished. The slot is free — the gold is not refunded.`,"warning");
  };

  // ── RAID: PHASE 1 — generate simulation and open modal ────────────────────
  // ── TRANSFER MARKET ───────────────────────────────────────────────────────

  const toggleListed=(h)=>{
    setListedHeroIds(prev=>{
      const next=new Set(prev);
      if(next.has(h.id)) next.delete(h.id);
      else next.add(h.id);
      return next;
    });
  };

  // Formation presets — store id maps; resolve to hero refs on load
  const savePreset=(idx)=>{
    const snap=serializeFormation(formation);
    setFormationPresets(prev=>{
      const next=[...prev];
      next[idx]=snap;
      return next;
    });
    addLog(`Saved current formation to Preset ${idx+1}.`,"info");
  };
  const loadPreset=(idx)=>{
    const p=formationPresets[idx];
    if(!p){addLog(`Preset ${idx+1} is empty.`,"warning");return;}
    // Count saved slots whose hero is now unavailable — they'll be left empty.
    const savedIds=POS_KEYS.flatMap(pos=>(p[pos]||[]).filter(id=>id!==null));
    const skipped=savedIds.filter(id=>{const h=heroes.find(hh=>hh.id===id);return h&&(h.injured||(h.awayWeeks||0)>0);}).length;
    setFormation(deserializeFormation(p,heroes,true));
    if(skipped>0) addLog(`↻ Loaded Preset ${idx+1} — ${skipped} unavailable hero${skipped>1?"es":""} (away/injured) left out; fill the empty slots.`,"warning");
    else addLog(`↻ Loaded Preset ${idx+1}.`,"success");
  };
  const clearPreset=(idx)=>{
    setFormationPresets(prev=>{
      const next=[...prev];
      next[idx]=null;
      return next;
    });
    addLog(`Preset ${idx+1} cleared.`,"info");
  };

  const startRetraining=(hero,toRole)=>{
    const chk=canRetrain(hero,gold,season,buildings);
    if(!chk.ok){addLog(chk.reason,"warning");return;}
    const cost=retrainCost(hero);
    if(!window.confirm(`Retrain ${hero.name} as a ${toRole}?\n\nCost: ${cost.toLocaleString()}g\nOut of action for ${RETRAIN_WEEKS} weeks.\nOnce per hero per season.`)) return;
    setGold(g=>g-cost);
    setHeroes(hs=>hs.map(h=>h.id===hero.id?{...h,awayWeeks:RETRAIN_WEEKS,retraining:{toRole},retrainedSeason:season}:h));
    setFormation(f=>{const nf={};POS_KEYS.forEach(p=>{nf[p]=(f[p]||[]).map(x=>x&&x.id===hero.id?null:x);});return nf;});
    addLog(`${hero.name} departs for the Training Grounds — retraining as ${toRole} (${cost.toLocaleString()}g, back in ${RETRAIN_WEEKS} weeks).`,"info");
  };

  const generateBids=(currentHeroes,currentWeek,listed)=>{
    const bidding=[];
    currentHeroes.forEach(h=>{
      if(h.injured||h.retired||(h.awayWeeks||0)>0) return; // away heroes (events/retraining) aren't on the market
      const isListed=listed.has(h.id);
      const phase=agePhase(h);

      // Bid frequency degrades sharply with age — declining heroes are hard to move
      const phaseFreqMult={prospect:0.8,rising:0.9,peak:1.0,fading:0.3,veteran:0.12}[phase]??1.0;

      // Reputation boosts bid probability
      const repStat = h.stats["Reputation"] || 0;
      const repChanceBonus = repStat > 30 ? (repStat - 30) / 69 * 0.20 : 0;

      // Trading Post: listed heroes attract bids 50% more often
      const tradingPost = buildings.find(b=>b.id==="trading"&&b.built);
      const tradingFreqMult = (tradingPost && isListed) ? 1.5 : 1.0;

      const baseChance = isListed ? 0.60 : 0.15;
      if(Math.random() > (baseChance + repChanceBonus) * phaseFreqMult * tradingFreqMult) return;

      // Bid quality degrades by phase — veteran heroes fetch a fraction of their value
      const phaseValueMult={prospect:0.90,rising:0.95,peak:1.0,fading:0.60,veteran:0.38}[phase]??1.0;
      const repBidBonus = repStat > 20 ? (repStat - 20) / 79 * 0.10 : 0;

      // Trading Post: listed heroes sell at 120% value
      const tradingValueMult = (tradingPost && isListed) ? 1.20 : 1.0;

      // Form premium: scouts pay above market for heroes visibly in form
      const form = h.stats.Form || 5;
      const formBidMult = form >= 7 ? 1 + ((form - 7) / 3) * 0.25
                        : form < 4  ? 0.90
                        : 1.0;

      const minPct = (isListed ? 0.80 : 0.65) * phaseValueMult * formBidMult * tradingValueMult;
      const maxPct = (isListed ? (1.15 + repBidBonus) : (0.95 + repBidBonus)) * phaseValueMult * formBidMult * tradingValueMult;
      const pct = Math.max(0.15, minPct + Math.random() * Math.max(0, maxPct - minPct));
      // Free-transfer fodder (value 0) still attracts nominal offers so the
      // player can move them for a small windfall instead of taking a
      // release morale hit.
      const freeTransfer = (h.value || 0) === 0;
      const offer = freeTransfer ? rand(80, 180) : Math.round(h.value * pct);

      // Bidders come from rival realms — the league towns are the natural pool
      const townPool = (tierEnemyTowns && tierEnemyTowns.length) ? tierEnemyTowns : [{name:"A Rival Realm"}];
      const town=pick(townPool);

      const combatScore=calcHeroCombatScore(h,"Vanguard");
      const reasons=[];
      if(h.stats.Form>=8) reasons.push("exceptional form");
      if(h.stats.Form>=9) reasons.push("in the form of their life");
      if(h.stats.Potential>=70) reasons.push("high potential");
      if(combatScore>=40) reasons.push("strong combat rating");
      if(agePhase(h)==="peak"||agePhase(h)==="rising") reasons.push("strong career stage");
      if(h.level>=6) reasons.push(`Lv ${h.level} experience`);
      if(repStat>=60) reasons.push("renowned across the realm");
      if(isListed) reasons.push("open to offers");
      const reason=reasons.length?reasons.slice(0,2).join(" & "):"scouted your roster";

      bidding.push({
        id:`bid_${h.id}_${currentWeek}`,
        heroId:h.id,
        heroName:h.name,
        town:town.name,
        offer,
        marketValue:h.value,
        // null for free-transfer heroes (value 0) — UI shows a different label instead of "X% of 0g"
        pctOfValue: freeTransfer ? null : Math.round(pct*100),
        freeTransfer,
        reason,
        week:currentWeek,
        isListed,
      });
    });
    return bidding;
  };

  const acceptBid=(bid)=>{
    const h=heroes.find(x=>x.id===bid.heroId);
    if(!h) return;
    setGold(g=>g+bid.offer);
    // Transfer morale hit: smaller than dismissal, framed positively
    // Heroes lose a teammate but know they moved on well — -1 to -4 per hero
    const remaining=heroes.filter(x=>x.id!==h.id);
    const affected=remaining.map(r=>{
      const swing=-(rand(1,4));
      return {...r, morale:Math.min(100,Math.max(5,r.morale+swing))};
    });
    setHeroes(affected);
    setFormation(f=>{const nf={};POS_KEYS.forEach(p=>{nf[p]=(f[p]||[]).map(x=>x&&x.id===h.id?null:x);});return nf;});
    setNegotiationQueue(q=>q.filter(x=>x.id!==h.id));
    setListedHeroIds(prev=>{const n=new Set(prev);n.delete(h.id);return n;});
    if(squadLeaderId===h.id) setSquadLeaderId(null);
    setTransferBids(prev=>prev.filter(b=>b.heroId!==h.id));
    setDetailHero(null);
    setHallOfFame(prev=>({...prev, heroesSold:(prev.heroesSold||0)+1}));
    addLog(`${h.name} took service with ${bid.town} for ${bid.offer.toLocaleString()}g!`,"success");
    addLog(`The squad wishes them well. Minor morale dip — better than a walkout.`,"info");
    // Complete sell_hero objective
  };

  const declineBid=(bid)=>{
    setTransferBids(prev=>prev.filter(b=>b.id!==bid.id));
    addLog(`Declined ${bid.town}'s offer for ${bid.heroName}.`,"info");
  };

  // ── EVENT OUTCOME RESOLUTION ──────────────────────────────────────────────
  // Called when a hero returns from an event. Rolls success/partial/fail,
  // applies rewards or consequences, returns a notification object.

  const NEGATIVE_TRAITS = ["Cursed","Coward","Greedy","Hot-headed","Stubborn","Glass Cannon"];
  const XP_VALUES = { small:80, medium:150, large:250 };
  const STAT_BOOST_AMOUNTS = { small:[1,3], medium:[2,4], large:[2,4] };

  // Failure consequence tables by commitment level
  const FAILURE_TABLES = {
    low:    [{type:"none",w:47},{type:"fatigue",w:20},{type:"morale",w:20},{type:"injury",w:8},{type:"trait",w:5}],
    medium: [{type:"none",w:44},{type:"fatigue",w:18},{type:"morale",w:18},{type:"injury",w:12},{type:"trait",w:8}],
    high:   [{type:"none",w:40},{type:"fatigue",w:17},{type:"morale",w:16},{type:"injury",w:15},{type:"trait",w:12}],
  };

  function rollWeighted(table) {
    const total = table.reduce((a,x)=>a+x.w,0);
    let r = Math.random()*total;
    for(const entry of table){ r-=entry.w; if(r<=0) return entry.type; }
    return table[table.length-1].type;
  }

  const resolveEventOutcome = (hero, eventDef) => {
    // Harden against malformed/legacy pendingEvent blobs restored from an older
    // save — missing reward/stats/theme once threw here and stranded the hero,
    // re-resolving (and re-crashing) every subsequent week.
    eventDef = { ...(eventDef||{}), reward:(eventDef&&eventDef.reward)||{}, stats:(eventDef&&eventDef.stats)||[] };
    const matchScore = calcMatchScore(hero, eventDef);
    const { success, partial, failure } = calcEventSuccessChance(matchScore);
    const roll = Math.random();
    let outcome, notifications=[], heroUpdates={};

    // Greedy heroes skim 15% of any event gold — a private cut, invoiced to no one
    const greedySkim = (gold) => {
      if(gold > 0 && hero.traits?.includes("Greedy")) {
        notifications.push(`skimmed ${Math.round(gold*0.15).toLocaleString()}g off the top (Greedy)`);
        return Math.round(gold * 0.85);
      }
      return gold;
    };

    if(roll < success) {
      outcome = "success";
      // Gold reward
      if(eventDef.reward.goldRange) {
        const gold = greedySkim(rand(...eventDef.reward.goldRange));
        heroUpdates._goldGain = gold;
      }
      // XP reward
      if(eventDef.reward.xp) {
        const xpAmt = XP_VALUES[eventDef.reward.xp] || 80;
        const newXP = (hero.xp||0) + xpAmt;
        const newLv = Math.min(MAX_LEVEL, levelFromXp(newXP));
        const newStats = newLv > hero.level ? growHeroStats({...hero,level:hero.level}, newLv, buildings) : hero.stats;
        heroUpdates.xp = newXP;
        heroUpdates.level = newLv;
        heroUpdates.stats = {...(heroUpdates.stats||hero.stats), ...newStats};
        heroUpdates.value = calcHeroValue({...hero,...heroUpdates});
        if(newLv > hero.level) notifications.push(`levelled up to Lv ${newLv}`);
      }
      // Stat boost — soft capped at potential+5 so events nudge past ceiling, not blow past it
      if(eventDef.reward.statBoost && !eventDef.reward.statBoostChoice) {
        const [lo,hi] = STAT_BOOST_AMOUNTS.medium;
        const amount = rand(lo,hi);
        const stat = eventDef.reward.statBoost;
        const current = (heroUpdates.stats||hero.stats)[stat]||0;
        const softCap = (hero.stats.Potential||99) + 5;
        const newVal = Math.min(softCap, current + amount);
        heroUpdates.stats = {...(heroUpdates.stats||hero.stats), [stat]: newVal};
        notifications.push(`+${newVal - current} ${stat}`);
      }
      // Oracle-style player choice — flagged for UI handling in Phase 4
      if(eventDef.reward.statBoostChoice) {
        heroUpdates._pendingStatChoice = true;
      }
      // Trait chance (30%)
      const traitToGrant = eventDef.reward.traitChanceAlt && Math.random()<0.5
        ? eventDef.reward.traitChanceAlt
        : eventDef.reward.traitChance;
      if(traitToGrant && Math.random() < 0.30) {
        const currentTraits = hero.traits||[];
        if(currentTraits.includes(traitToGrant)) {
          // Already has trait — convert to XP (150)
          heroUpdates.xp = (heroUpdates.xp || hero.xp||0) + 150;
          notifications.push(`+150 XP (already has ${traitToGrant})`);
        } else {
          heroUpdates.traits = [...currentTraits.slice(0,2), traitToGrant];
          notifications.push(`gained trait: ${traitToGrant}`);
        }
      }
      // Fatigue recovery
      if(eventDef.reward.healFatigue) {
        heroUpdates.fatigue = 0;
        notifications.push(`fatigue fully recovered`);
      }
      // Morale boost on success
      heroUpdates.morale = Math.min(100, (hero.morale||70) + 10);

    } else if(roll < success + partial) {
      outcome = "partial";
      // Half gold only
      if(eventDef.reward.goldRange) {
        const gold = greedySkim(Math.round(rand(...eventDef.reward.goldRange) * 0.5));
        heroUpdates._goldGain = gold;
      }

    } else {
      outcome = "failure";
      const commitment = eventDef.commitment || "low";
      const consequence = rollWeighted(FAILURE_TABLES[commitment]);
      switch(consequence) {
        case "fatigue":
          heroUpdates.fatigue = Math.min(100, (hero.fatigue||0) + 30);
          notifications.push(`returned exhausted (−30 fatigue)`);
          break;
        case "morale":
          heroUpdates.morale = Math.max(10, (hero.morale||70) - 15);
          notifications.push(`morale −15`);
          break;
        case "injury":
          heroUpdates.injured = true;
          heroUpdates.injuryWeeks = rand(1,2);
          notifications.push(`injured (${heroUpdates.injuryWeeks} week${heroUpdates.injuryWeeks>1?"s":""})`);
          break;
        case "trait": {
          const negTrait = pick(NEGATIVE_TRAITS);
          const currentTraits = hero.traits||[];
          if(currentTraits.includes(negTrait)) {
            // Already has negative trait — morale hit instead
            heroUpdates.morale = Math.max(10, (hero.morale||70) - 20);
            notifications.push(`shaken (morale −20)`);
          } else {
            heroUpdates.traits = [...currentTraits.slice(0,2), negTrait];
            notifications.push(`gained trait: ${negTrait}`);
          }
          break;
        }
        default:
          notifications.push(`returned empty-handed`);
      }
    }

    // The sender writes back — the return banner reads like a dispatch, not a receipt
    const themeDef = EVENT_THEMES[eventDef.theme];
    const report = themeDef
      ? (pick(themeDef.returnLines?.[outcome] || []) || "").replace(/\{hero\}/g, hero.name.split(" ")[0])
      : null;

    return { outcome, heroUpdates, notifications, goldGain: heroUpdates._goldGain||0, report };
  };

  const acceptEvent=(event, selectedHeroes)=>{
    if(event.isEmissary){
      setLegendaryChallenger(event.challenger);
      setActiveEvent(null);
      addLog(`Challenge accepted! ${event.challenger.name} will face you next battle.`,"success");
      return;
    }
    const awayWeeks = event.awayWeeks[0];
    const sentIds = new Set(selectedHeroes.map(h=>h.id));
    setHeroes(hs=>hs.map(h=>{
      if(!sentIds.has(h.id)) return h;
      return {
        ...h,
        awayWeeks,
        awayEvent: event.title,
        pendingEvent: event,
        fatigue: Math.min(100, (h.fatigue||0) + rand(15,30)),
      };
    }));
    const names = selectedHeroes.map(h=>h.name).join(" & ");
    addLog(`${names} departed for "${event.title}" — away ${awayWeeks} week${awayWeeks>1?"s":""}.`,"success");
    setActiveEvent(null);
    setFormation(f=>{const nf={};POS_KEYS.forEach(p=>{nf[p]=(f[p]||[]).map(h=>h&&sentIds.has(h.id)?null:h);});return nf;});
  };

  const acceptWanderingMaster = (hero, stat) => {
    if(gold < (activeWanderingMaster?.cost||200)) return;
    setGold(g => g - (activeWanderingMaster?.cost||200));
    const boostAmount = rand(2, 4);
    setHeroes(hs => hs.map(h => {
      if(h.id !== hero.id) return h;
      const currentVal = (h.stats[stat]||0);
      const softCap = (h.stats.Potential||99) + 5;
      const newVal = Math.min(softCap, currentVal + boostAmount);
      const actual = newVal - currentVal;
      return {...h, stats: {...h.stats, [stat]: newVal}, value: calcHeroValue({...h, stats:{...h.stats,[stat]:newVal}})};
    }));
    addLog(`${hero.name} trained with the Wandering Master. +${boostAmount} ${stat}!`, "success");
    setWanderingMasterLastSeason(season);
    setActiveWanderingMaster(null);
  };

  const declineWanderingMaster = () => {
    addLog(`The Wandering Master departs. Another time.`, "info");
    setActiveWanderingMaster(null);
  };

  const declineChallenge = () => {
    const penalty = SPECIAL_EVENTS.find(e=>e.id==="the_challenge")?.declinePenalty?.morale ?? -8;
    setHeroes(hs => hs.map(h => ({...h, morale: Math.max(10, (h.morale||70) + penalty)})));
    setPendingChallenge(null);
    addLog(`The challenge was declined. The squad's spirit wavers. (${penalty} morale to all)`, "warning");
  };

  const declineEvent=()=>{
    addLog(`Declined: "${activeEvent?.title}"`, "info");
    setActiveEvent(null);
  };

  // ── SEASON OBJECTIVES ─────────────────────────────────────────────────────

;

  const startBattle=()=>{
    try {
    const opponent = legendaryChallenger || scheduledOpponent;
    if(!opponent){addLog("No opponent scheduled this week!","danger");return;}
    const placed=POS_KEYS.flatMap(p=>(formation[p]||[]).filter(Boolean));
    if(placed.length<3){addLog("Assign at least 3 heroes in Tactics first!","danger");return;}
    // Re-validate eligibility at send time — the picker blocks away/injured heroes, but preset-load,
    // save reload, and the weekly formation re-sync can leave one in the lineup.
    const unavailable=placed.filter(h=>h.injured||(h.awayWeeks||0)>0);
    if(unavailable.length){addLog(`${unavailable.map(h=>h.name).join(", ")} ${unavailable.length>1?"are":"is"} unavailable (injured or away) — clear them from Tactics first.`,"danger");return;}

    // Apply challenge modifier if active
    let battleOpponent = opponent;
    if(pendingChallenge && !legendaryChallenger){
      const boostedPower = Math.round((opponent.power||100) * pendingChallenge.opponentPowerMult);
      battleOpponent = {...opponent, power:boostedPower, _challengeRewardMult:pendingChallenge.rewardMult};
      setPendingChallenge(null);
      addLog(`The Challenge is active — opponent ${Math.round((pendingChallenge.opponentPowerMult-1)*100)}% stronger, rewards doubled!`,"warning");
    }

    const sim=buildRaidSimulation(formation,battleOpponent,buildings,TIERS[playerTier]?.difficulty??1,ngPlus);
    if(!sim){addLog("Battle simulation failed — check formation.","danger");return;}
    setActiveSimulation(sim);
    setPendingRaidEnemy(battleOpponent);
    } catch(err) {
      console.error("startBattle error:", err);
      addLog(`Battle error: ${err?.message||"unknown"}. Try reassigning heroes in Tactics.`,"danger");
    }
  };

  // ── rest week — pay wages, no raid ────────────────────────────────────────
  // ── RAID: PHASE 2 — apply outcome after simulation completes ──────────────
  const applyRaidResult=()=>{
    try {
    // Shallow copy — this function reassigns result.goldSwing, and mutating a
    // React state object directly is a concurrent-rendering hazard
    const result=activeSimulation?{...activeSimulation}:null;
    const raidEnemy=pendingRaidEnemy;
    setActiveSimulation(null);
    setPendingRaidEnemy(null);
    if(!result||!raidEnemy)return;

    // Legendary challenger: special rewards + no rank impact + clear after raid
    const isLegendary = !!legendaryChallenger && legendaryChallenger.name===raidEnemy.name;
    if(isLegendary){
      setLegendaryChallenger(null);
      if(result.won){
        const lc=raidEnemy;
        setGold(g=>g+(lc.goldReward||3000));
        addLog(`LEGENDARY VICTORY! You defeated ${lc.name}! +${(lc.goldReward||3000).toLocaleString()}g`,"success");
        setHallOfFame(prev=>({...prev, legendaryWins:(prev.legendaryWins||0)+1, lastLegendaryVictory:{name:lc.name,season,week:week+1}}));
      } else {
        addLog(`Defeat against ${raidEnemy.name}. A legendary loss — but no rank penalty. Learn and return stronger.`,"warning");
      }
      // Legendary raids don't affect the leaderboard rank or normal schedule
      result.events.forEach(e=>addLog(e,result.won?"success":"danger"));
      // Still apply XP, morale, injuries — just skip gold swing and rank effects
      // Fall through to hero update logic below with goldSwing zeroed
      result.goldSwing = 0;
    } else {
      // Apply challenge reward multiplier if active
      const rewardMult = raidEnemy._challengeRewardMult || 1;
      const finalGoldSwing = Math.round(result.goldSwing * rewardMult);
      if(rewardMult > 1 && result.won) addLog(`Challenge victory! Rewards ×${rewardMult} — +${finalGoldSwing.toLocaleString()}g`,"success");
      setGold(g=>Math.max(0,g+finalGoldSwing));
      result.goldSwing = finalGoldSwing;
      result.events.forEach(e=>addLog(e,result.won?"success":"danger"));
      if(rewardMult === 1) addLog(`Gold ${result.goldSwing>=0?"+":""}${result.goldSwing.toLocaleString()}g`,result.won?"success":"warning");
    }

    const newLevelUps=[]; const snapshots={};
    const raidedIds=new Set(result.allHeroes.map(h=>h.id));
    const formationIds=new Set(POS_KEYS.flatMap(p=>(formation[p]||[]).filter(Boolean).map(h=>h.id)));

    // Must be declared BEFORE heroes.map() — callbacks close over these
    const fatiguePctBonus = 0; // placeholder for future recovery-rate buffs (e.g. items/boons)
    const leader=squadLeaderId!=null?heroes.find(h=>h.id===squadLeaderId):null;
    const leaderInFormation=leader&&raidedIds.has(leader.id);

    let updatedHeroes=heroes.map(h=>{
      const inRaid=raidedIds.has(h.id);
      let moraleDelta=0;
      if(!formationIds.has(h.id)) moraleDelta-=1;

      if(inRaid){
        // Fatigue: gain per raid, reduced by Endurance stat
        const enduranceFactor = Math.max(0.5, 1 - ((h.stats.Endurance||30) - 30) / 140);
        let fatigueGain = Math.round(FATIGUE_GAIN_BASE * enduranceFactor * rand(8,12)/10);
        if(h.traits?.includes("Swift"))    fatigueGain = Math.round(fatigueGain * 0.75);
        if(h.traits?.includes("Resilient"))fatigueGain = Math.round(fatigueGain * 0.70);

        // Apply ability fatigue effects
        const heroPos = POS_KEYS.find(p=>(formation[p]||[]).some(x=>x?.id===h.id));
        let abilityFatigueBonus = 0, abilityMoraleBonus = 0;
        (result.abilityResults||[]).forEach(({ability,outcome})=>{
          if(outcome==='pass') return;
          const effects = outcome==='soft' ? ability.softEffect : ability.hardEffect;
          if(effects.fatigue) {
            const {pos,amt} = effects.fatigue;
            if(pos==='all' || heroPos===pos) abilityFatigueBonus += amt;
          }
          if(effects.morale) {
            const {pos,amt} = effects.morale;
            if(pos==='all' || heroPos===pos) abilityMoraleBonus += amt;
          }
        });

        const newFatigue = Math.min(100, (h.fatigue||0) + fatigueGain + abilityFatigueBonus);

        // Extra injury risk when critically fatigued
        const newlyInjured = !h.injured && result.injuries.includes(h.id);
        let injured=h.injured||result.injuries.includes(h.id);
        let injuryWeeks=injured?(result.injuries.includes(h.id)?rand(1,4):Math.max(0,h.injuryWeeks-1)):0;
        if(buildings.find(b=>b.id==="infirmary"&&b.built)&&injuryWeeks>0)injuryWeeks=Math.max(1,injuryWeeks-1);
        const healedNow = h.injured && injuryWeeks===0;
        if(injuryWeeks===0)injured=false;
        let xpGain=result.heroXP;
        if(h.morale>=80)xpGain=Math.round(xpGain*1.1);
        // Cursed heroes learn from suffering — the curse takes, but it also teaches
        if(h.traits?.includes("Cursed"))xpGain=Math.round(xpGain*1.15);
        // Squad Leader XP bonus — applies when leader is in formation
        if(leaderInFormation){
          const lb=calcLeaderBonuses(leader);
          xpGain=Math.round(xpGain*lb.xpMult);
        }
        // Mentor bonus
        let newMentorBonus=h.mentorBonus;
        if(newMentorBonus&&newMentorBonus.weeksLeft>0){
          xpGain+=newMentorBonus.xpPerWeek;
          newMentorBonus={...newMentorBonus,weeksLeft:newMentorBonus.weeksLeft-1};
          if(newMentorBonus.weeksLeft===0){addLog(`${h.name}'s mentorship from ${newMentorBonus.mentorName} has ended.`,"info");newMentorBonus=null;}
        }
        const newXP=h.xp+xpGain, oldLv=h.level, newLv=Math.min(MAX_LEVEL,levelFromXp(newXP));
        let newStats=h.stats;
        if(newLv>oldLv){snapshots[h.id]={...h.stats};newStats=growHeroStats({...h,level:oldLv},newLv,buildings);const gained=Object.keys(newStats).filter(s=>newStats[s]>h.stats[s]).length;newLevelUps.push({name:h.name,oldLv,newLv,gained});}
        // Recalculate market value when hero levels up — value tracks development
        const updatedValue = newLv>oldLv ? calcHeroValue({...h,level:newLv,stats:newStats}) : h.value;
        // Brave: immune to morale loss on defeat
        // Squad Leader: dampens defeat morale swing for all raiders
        // Loss swing scales with current morale — high morale heroes feel defeats more
        let effectiveMoraleSwing;
        if(!result.won) {
          if(h.traits?.includes("Brave")) {
            effectiveMoraleSwing = 0;
          } else {
            const lossMult = 0.4 + (h.morale / 100) * 0.8;
            let lossSwing = -Math.round(rand(6,10) * lossMult);
            if(leaderInFormation) {
              const lb = calcLeaderBonuses(leader);
              lossSwing = Math.round(lossSwing * (1 - lb.defeatMoralePct/100));
            }
            effectiveMoraleSwing = lossSwing;
          }
        } else {
          effectiveMoraleSwing = result.moraleSwing; // win swing
        }

        // Natural decay: -0.5/week, soft floor at 40 (decay stops below 40)
        const decayAmount = h.morale > 40 ? -0.5 : 0;
        const totalMoraleSwing = effectiveMoraleSwing + abilityMoraleBonus + moraleDelta + decayAmount;
        const cursedStats = h.traits?.includes("Cursed") && Math.random()<0.4
          ? {...newStats, Form: Math.max(1, (newStats.Form||5) - rand(1,2))}
          : newStats;

        // Form tracks RESULTS, not attendance — your lane won, you run hot;
        // your lane lost, you go cold. Streaks emerge naturally.
        // Reputation grows with appearances — the market learns who you are
        const heroLane = POS_KEYS.find(p=>(formation[p]||[]).some(x=>x?.id===h.id));
        const laneWon = heroLane ? !!result.phaseRolls?.[heroLane] : result.won;
        // Personal exchange record sharpens the swing: the hero who carried a
        // losing lane cools less; the passenger in a winning lane heats less
        const personalBeats = (result.laneBattle?.[heroLane]?.beats||[]).filter(b=>b.actor===h.id);
        const personalNet = personalBeats.reduce((a,b)=>a+(b.won?1:-1),0);
        // Heat fast, cool slower — symmetric cooling created a form death
        // spiral for weak squads (sim-verified). Asymmetry keeps the streaks
        // without the doom loop.
        const formGain = (laneWon ? (Math.random()*0.4)+0.4 : -((Math.random()*0.3)+0.05))
          + Math.max(-0.2, Math.min(0.2, personalNet*0.1));
        const newForm = Math.min(10, Math.max(1, (cursedStats.Form||5) + formGain));
        // Injury knocks Form — coming back rusty
        const postInjuryForm = (injured && result.injuries.includes(h.id))
          ? Math.max(1, newForm - 1.0)
          : newForm;
        const newRep = Math.min(99, (cursedStats.Reputation||0) + (result.won ? 0.5 : 0.2));
        const grownStats = {...cursedStats, Form: Math.round(postInjuryForm * 10) / 10, Reputation: Math.round(newRep * 10) / 10};

        // Increment formation weeks and check potential reveal (8-10 weeks of active play).
        // Injured heroes don't accrue tenure — they fought hurt, treat the week as benched.
        const newWeeksInFormation = injured ? (h.weeksInFormation||0) : (h.weeksInFormation||0) + 1;
        const revealThreshold = 8 + Math.floor(Math.random()*3); // 8-10 weeks
        const potentialRevealed = h.potentialRevealed || newWeeksInFormation >= revealThreshold;

        let out={...h,xp:newXP,level:newLv,value:updatedValue,stats:grownStats,morale:Math.min(100,Math.max(0,h.morale+totalMoraleSwing)),injured,injuryWeeks,weeksUnplayed:0,fatigue:newFatigue,mentorBonus:newMentorBonus,weeksInSquad:(h.weeksInSquad||0)+1,weeksInFormation:newWeeksInFormation,potentialRevealed};
        if(newlyInjured){
          const injName = pick(INJURY_NAMES_BY_POS[heroPos]||INJURY_NAMES_ALL);
          out.injury = { name:injName, from:raidEnemy.name, week:week+1 };
          addLog(`${h.name} — ${injName.toLowerCase()}, courtesy of ${raidEnemy.name}. Out ~${injuryWeeks}w.`,"danger");
          addChronicle(`${h.name} — ${injName.toLowerCase()}, vs ${raidEnemy.name}.`);
        }
        if(healedNow) out = applyHealScar(out, addLog);
        return out;
      } else {
        // Bench: recover fatigue — Recovery Lodge speeds this up
        const hasLodge=buildings.find(b=>b.id==="lodge"&&b.built);
        const recoveryMult = (hasLodge?1.6:1.0) * (1 + fatiguePctBonus);
        const recoveryRate = Math.round(FATIGUE_RECOVER_BASE * recoveryMult);
        const newFatigue = Math.max(0, (h.fatigue||0) - recoveryRate);
        const newWeeksUnplayed=(h.weeksUnplayed||0)+1;

        // Tick away-heroes countdown — resolve event outcome on return
        let awayWeeks=h.awayWeeks||0;
        let awayEvent=h.awayEvent||null;
        let pendingEvent=h.pendingEvent||null;
        if(awayWeeks>0){
          awayWeeks=awayWeeks-1;
          if(awayWeeks<=0){
            awayEvent=null;
            if(pendingEvent){
              // Snapshot the event NOW: `pendingEvent` is a `let` that gets nulled at
              // the end of this block, and the setPendingEventReturns updater below runs
              // deferred (during React's render). Reading pendingEvent.title inside that
              // closure crashed — by the time it ran, the let was already null.
              const ev = pendingEvent;
              // Resolve outcome — store in pendingEventReturns for banner display
              const resolution = resolveEventOutcome(h, ev);
              // Apply gold gain
              if(resolution.goldGain>0) setGold(g=>g+resolution.goldGain);
              // Apply hero updates from resolution
              const u = resolution.heroUpdates;
              if(u.stats)       h = {...h, stats: u.stats};
              if(u.traits)      h = {...h, traits: u.traits};
              // resolveEventOutcome already grew stats (u.stats) and computed level/value —
              // just carry them through. (Re-growing here double-counted the level-up gains.)
              if(u.xp!=null)    { h = {...h, xp:u.xp, ...(u.level!=null?{level:u.level}:{}), ...(u.value!=null?{value:u.value}:{})}; }
              if(u.morale!=null)   h = {...h, morale: u.morale};
              if(u.fatigue!=null)  h = {...h, fatigue: u.fatigue};
              if(u.injured)        h = {...h, injured:true, injuryWeeks:u.injuryWeeks||1};
              // Build the banner object synchronously (ev is non-null here) so the
              // deferred updater closes over a stable object, not the mutated `let`.
              const returnBanner = {
                id: `${h.id}_${Date.now()}`,
                heroName: h.name,
                heroIcon: RACE_ICONS[h.race]||"",
                eventTitle: ev.title,
                eventTheme: ev.theme,
                outcome: resolution.outcome,
                notifications: resolution.notifications,
                goldGain: resolution.goldGain,
                report: resolution.report,
                pendingStatChoice: u._pendingStatChoice||false,
                heroId: h.id,
              };
              setPendingEventReturns(prev=>[...prev, returnBanner]);
              pendingEvent = null;
            } else if(h.retraining){
              // Retraining complete — role changes, stats carry as-is
              const toRole=h.retraining.toRole;
              h={...h, role:toRole, retraining:null, morale:Math.min(100,(h.morale||70)+RETRAIN_RETURN_MORALE)};
              addLog(`${h.name} returns from the Training Grounds a ${toRole} — new lease on life (+${RETRAIN_RETURN_MORALE} morale).`,"success");
              addChronicle(`${h.name} retrained as a ${toRole}.`);
            } else {
              addLog(`${h.name} returned from "${h.awayEvent}".`,"success");
            }
          }
        }

        // Mentor bonus — applies even on bench (wisdom transcends the battlefield)
        let newMentorBonus=h.mentorBonus;
        let mentorXP=0;
        if(newMentorBonus&&newMentorBonus.weeksLeft>0){
          mentorXP=newMentorBonus.xpPerWeek;
          newMentorBonus={...newMentorBonus,weeksLeft:newMentorBonus.weeksLeft-1};
          if(newMentorBonus.weeksLeft===0){addLog(`${h.name}'s mentorship from ${newMentorBonus.mentorName} has ended.`,"info");newMentorBonus=null;}
        }

        // Bench Form drifts toward neutral 5 — rust dulls a sharp edge, but rest
        // steadies a shaken one. (Decaying to 1 punished the very rotation the
        // fatigue system demands.) Injured heroes still lose form outright.
        const currentForm = h.stats.Form||5;
        const benchForm = h.injured ? Math.max(1, currentForm - 0.40)
          : currentForm > 5 ? Math.max(5, currentForm - 0.20)
          : currentForm < 5 ? Math.min(5, currentForm + 0.20)
          : currentForm;
        const benchRep  = Math.max(0, (h.stats.Reputation||0) - 0.1);
        const benchStats = h.traits?.includes("Cursed") && Math.random()<0.4
          ? {...h.stats, Form: Math.max(1, h.stats.Form - rand(1,2)), Reputation: benchRep}
          : {...h.stats, Form: Math.round(benchForm * 10) / 10, Reputation: Math.round(benchRep * 10) / 10};

        // Bench morale: decay -0.5/week (soft floor 40), -1 for bench, -1 extra after 4 weeks
        const benchDecay = h.morale > 40 ? -0.5 : 0;
        const benchMoraleDelta = benchDecay + moraleDelta + (newWeeksUnplayed > 4 ? -1 : 0);
        const newMorale = Math.min(100, Math.max(0, h.morale + benchMoraleDelta));

        // Mentor XP must level the mentee even while benched. The played path
        // folds it into the level-up calc; here the XP was piling up while level,
        // stats and value stayed frozen until the hero next played. Silent, like
        // the Training Grounds bench-XP path below. (mentorXP is 0 when there's
        // no active bonus, so unmentored bench heroes are untouched.)
        const benchXPTotal = h.xp + mentorXP;
        const benchNewLv   = mentorXP>0 ? Math.min(MAX_LEVEL, levelFromXp(benchXPTotal)) : h.level;
        let   benchFinalStats = benchStats;
        let   benchNewValue   = h.value;
        if(benchNewLv > h.level){
          benchFinalStats = growHeroStats({...h, stats: benchStats}, benchNewLv, buildings);
          benchNewValue   = calcHeroValue({...h, level:benchNewLv, stats:benchFinalStats});
        }
        return{...h,
          morale: newMorale,
          weeksUnplayed:newWeeksUnplayed,
          fatigue:newFatigue,awayWeeks,awayEvent,pendingEvent,
          xp: benchXPTotal,
          level: benchNewLv,
          value: benchNewValue,
          mentorBonus:newMentorBonus,
          weeksInSquad:(h.weeksInSquad||0)+1,
          weeksInFormation: h.weeksInFormation||0, // doesn't increment on bench
          potentialRevealed: h.potentialRevealed||false,
          stats: benchFinalStats,
        };
      }
    });

    if(buildings.find(b=>b.id==="tavern"&&b.built)){
      updatedHeroes=updatedHeroes.map(h=>({...h,morale:Math.min(100,h.morale+3)}));
      addLog("Tavern: +3 morale to all heroes","info");
    }

    // Hall of Legends — retired heroes contribute morale based on level at retirement.
    // Each legend contributes 1 + floor(level/3) morale/week, capped at +20 total.
    // Reads the persisted `retiredLegends` roll: retirees are stripped from `heroes`
    // the week they retire (updatedHeroes never holds them), and this year's retirees
    // aren't aged until later in this pass, so they join the roll from next week on.
    if(buildings.find(b=>b.id==="legends"&&b.built) && retiredLegends.length>0){
      const legendBonus = legendMoraleBonus(retiredLegends);
      if(legendBonus>0){
        updatedHeroes=updatedHeroes.map(h=>({...h,morale:Math.min(100,h.morale+legendBonus)}));
        addLog(`Hall of Legends: +${legendBonus} morale from ${retiredLegends.length} retired hero${retiredLegends.length>1?"es":""}`, "info");
      }
    }

    // Squad Leader morale bonus — applies to all formation heroes if leader is in formation
    if(leaderInFormation){
      const lb=calcLeaderBonuses(leader);
      updatedHeroes=updatedHeroes.map(h=>{
        if(!raidedIds.has(h.id)) return h;
        return {...h, morale:Math.min(100,h.morale+lb.moralePerWeek)};
      });
      addLog(`${leader.name} (Squad Leader): +${lb.moralePerWeek} morale to all raiders`,"info");
    }
    if(buildings.find(b=>b.id==="trainyard"&&b.built)){
      const benchXP = Math.max(1, Math.round(result.heroXP * 0.20));
      updatedHeroes=updatedHeroes.map(h=>{
        if(raidedIds.has(h.id))return h;
        const newXP=h.xp+benchXP,newLv=Math.min(MAX_LEVEL,levelFromXp(newXP));
        let newStats=h.stats;
        if(newLv>h.level)newStats=growHeroStats({...h},newLv,buildings);
        return{...h,xp:newXP,level:newLv,stats:newStats};
      });
      addLog(`Training Grounds: bench heroes earned ${benchXP} XP`,"info");
    }

    // Market refresh — full rotation every 6 weeks (3 with Talent Network)
    const hasNetwork = buildings.find(b=>b.id==="network"&&b.built);
    const hasSanctum = buildings.find(b=>b.id==="sanctum"&&b.built);
    const hasBazaar  = buildings.find(b=>b.id==="bazaar"&&b.built);
    const refreshInterval = hasNetwork ? 3 : 6;
    if((week+1) % refreshInterval === 0){
      const isPremium = hasBazaar || ["gold","platinum"].includes(playerTier);
      const isElite   = !!(hasSanctum);
      setMarket(Array.from({length:12},(_,i)=>{
        const isPrem = isPremium && Math.random()<0.35;
        const isElit = isElite   && Math.random()<0.20;
        return generateHero(Date.now()+i+7700, true, isPrem, isElit, null, null, playerTier);
      }));
      addLog(`The mercenary pool has refreshed — ${hasNetwork?"Talent Network":"new faces"} arrive.`,"info");
    }

    updatedHeroes=updatedHeroes.map(h=>{
      // A hero who spent this whole week expired-and-unsigned has hit the
      // hard deadline (the sitting offers no postpone once expired; this
      // backstop only fires if the player never resolved the modal)
      const wasExpiredAllWeek = h.negotiationPending && !h.refusesToSign && (h.contractWeeksLeft||0)===0;
      const wLeft=Math.max(0,(h.contractWeeksLeft||0)-1);
      let negotiationPending=h.negotiationPending, negotiationIgnoredWeeks=h.negotiationIgnoredWeeks||0;
      if(h.refusesToSign){
        return{...h,contractWeeksLeft:wLeft,negotiationPending:false,negotiationIgnoredWeeks};
      }
      if(wLeft===0&&!negotiationPending){negotiationPending=true;negotiationIgnoredWeeks=0;addLog(`${h.name}'s contract has expired — settle terms this week or they depart.`,"warning");}
      if(wLeft===1&&!negotiationPending){addLog(`${h.name}'s contract expires next week — prepare for renewal.`,"warning");}
      if(wLeft===6&&!negotiationPending){addLog(`${h.name}'s contract expires in 6 weeks.`,"info");}
      return{...h,contractWeeksLeft:wLeft,negotiationPending,negotiationIgnoredWeeks,...(wasExpiredAllWeek?{_deadline:true}:{})};
    });

    // Contract departures — deterministic, no dice. Two ways out: talks
    // collapsed (refusesToSign) and the contract has run down, or the hard
    // deadline backstop above. A lapsed contract is a mutual parting — no
    // squad morale ripple (unlike a walkout).
    const departures=updatedHeroes.filter(h=>!h.retired&&(
      (h.refusesToSign&&(h.contractWeeksLeft||0)<=0) || h._deadline
    ));
    departures.forEach(h=>{
      addLog(`${h.name}'s contract has lapsed. They gathered their things and took their leave.`,"danger");
      addChronicle(`${h.name} departed when their contract lapsed.`);
      updatedHeroes=updatedHeroes.filter(x=>x.id!==h.id);
      setFormation(f=>{const nf={};POS_KEYS.forEach(p=>{nf[p]=(f[p]||[]).map(x=>x&&x.id===h.id?null:x);});return nf;});
      setNegotiationQueue(q=>q.filter(x=>x.id!==h.id)); // no ghost negotiations
      setListedHeroIds(ids=>{const n=new Set(ids);n.delete(h.id);return n;});
      setTransferBids(bids=>bids.filter(b=>b.heroId!==h.id));
      if(squadLeaderId===h.id) setSquadLeaderId(null);
    });

    updatedHeroes=updatedHeroes.map(h=>{
      if(!h.injured||raidedIds.has(h.id))return h;
      const wks=Math.max(0,h.injuryWeeks-1);
      let nh={...h,injuryWeeks:wks,injured:wks>0};
      if(wks===0) nh=applyHealScar(nh, addLog);
      return nh;
    });

    const newRetirees=[];
    const aged=updatedHeroes.map(h=>{
      if(h.retired)return h;
      const{hero:nh,events}=ageHero(h,buildings);
      events.forEach(e=>{addLog(e.text,e.type);if(e.retired)newRetirees.push(nh);});
      return nh;
    });

    const newNeg=aged.filter(h=>h.negotiationPending&&!h.refusesToSign&&!negotiationQueue.find(x=>x.id===h.id));
    if(newNeg.length>0)setNegotiationQueue(q=>[...q,...newNeg.filter(x=>!q.find(y=>y.id===x.id))]);
    // Prune queue entries whose hero is gone (sold mid-week, walked, retired)
    const livingIds=new Set(aged.filter(h=>!h.retired).map(h=>h.id));
    setNegotiationQueue(q=>q.filter(x=>livingIds.has(x.id)));

    if(newRetirees.length>0){
      setFormation(f=>{const nf={};const retiredIds=new Set(newRetirees.map(r=>r.id));POS_KEYS.forEach(p=>{nf[p]=(f[p]||[]).map(h=>h&&retiredIds.has(h.id)?null:h);});return nf;});
      // Retirement morale boost for remaining squad
      let retirementAged=aged.filter(h=>!h.retired);
      newRetirees.forEach(r=>{
        retirementAged=applySquadMoraleEvent(retirementAged,r,formation,"retire");
        addLog(`The squad celebrates ${r.name}'s retirement. Morale lifted!`,"success");
      });
      aged.splice(0,aged.length,...aged.map(h=>retirementAged.find(x=>x.id===h.id)||h));
      setRetirees(newRetirees);
      // Enrol them on the Hall of Legends roll (level frozen at retirement)
      setRetiredLegends(prev=>[...prev, ...newRetirees.map(r=>({id:r.id,name:r.name,race:r.race,role:r.role,level:r.level}))]);
      if(newRetirees.some(r=>r.id===squadLeaderId)) setSquadLeaderId(null);
    }

    if(newLevelUps.length){setLevelUps(newLevelUps);newLevelUps.forEach(e=>addLog(`${e.name} → Level ${e.newLv}! (${e.gained} stats grew)`,"success"));if(Object.keys(snapshots).length)setPrevStats(snapshots);}
    else setLevelUps([]);

    // ── CHECK & COMPLETE RAID-TIME OBJECTIVES ─────────────────────────────
    // XP multipliers from objectives need to apply to heroes before setHeroes


    // Tick active bonuses down
    setActiveBonuses(prev=>prev.map(b=>({...b,weeksLeft:b.weeksLeft-1})).filter(b=>b.weeksLeft>0));

    setHeroes(aged.filter(h=>!h.retired));
    setMissionResult(result);

    const wages=aged.filter(h=>!h.retired).reduce((a,h)=>a+h.salary,0);
    const goldAfterWages = gold - wages;
    setGold(g=>g-wages); // allow negative — debt is visible
    const wageLine = pick([
      `Wages paid: ${wages.toLocaleString()}g. The steward counts twice; heroes count once.`,
      `Payday — ${wages.toLocaleString()}g lighter. Nobody thanked you.`,
      `Weekly wages: ${wages.toLocaleString()}g`,
      `The wage ledger closes at ${wages.toLocaleString()}g. Swords stay sharp, purses don't.`,
      `${wages.toLocaleString()}g in wages. Loyalty, invoiced weekly.`,
    ]);
    addLog(wageLine,"warning");

    // Bankruptcy grace period — if gold can't cover wages, start/advance counter.
    // Tribute pays by live table position — holding 1st is worth +280g/wk.
    const liveTierPosition = calcTierPosition(playerRecord.wins, playerRecord.wins/(Math.max(1,playerRecord.wins+playerRecord.losses)), leagueTable, tierEnemyTowns);
    const tributeAmount=weeklyRankIncome(playerTier, liveTierPosition);
    setGold(g=>g+tributeAmount);
    const tierIcon = TIERS[playerTier]?.icon||'', tierName = TIERS[playerTier]?.name||'Iron';
    const tributeLine = pick([
      `${tierName} tribute: +${tributeAmount.toLocaleString()}g/wk`,
      `${tierIcon} The ${tierName} League pays its dues: +${tributeAmount.toLocaleString()}g.`,
      `${tierIcon} Tribute carts arrive from the ${tierName} League: +${tributeAmount.toLocaleString()}g.`,
      `+${tributeAmount.toLocaleString()}g tribute — rank has its privileges.`,
    ]);
    addLog(tributeLine,"success");

    // Check bankruptcy after tribute (give tribute a chance to help)
    const goldAfterAll = goldAfterWages + tributeAmount;
    let campaignFell = false; // bankruptcy defeat this week — suppress season-end pageantry
    if(goldAfterAll <= 0){
      const newBankruptcyWeeks = bankruptcyWeeks + 1;
      setBankruptcyWeeks(newBankruptcyWeeks);
      campaignFell = newBankruptcyWeeks >= 3;
      // Morale hit — heroes know the realm is in trouble
      setHeroes(hs=>hs.map(h=>h.retired?h:{...h,morale:Math.max(10,h.morale-5)}));
      if(newBankruptcyWeeks >= 3){
        // Trigger defeat ceremony
        const achievementData = { trophies, buildings, raceSynergyUsage,
          retiredMax13: aged.some(h=>h.retired&&h.level>=13),
          everPromoted: trophies.some(t=>t.tier!=="iron"),
          peakGold: hallOfFame.peakGold||0,
          abilitiesMitigated: hallOfFame.abilitiesMitigated||0,
          heroesSold: hallOfFame.heroesSold||0,
        };
        const newlyEarned = checkAchievements(achievementData);
        const existingBoons = ngPlus?.earnedBoons ?? [];
        const allBoons = [...existingBoons, ...newlyEarned];
        const pWins = playerRecord.wins, pLosses = playerRecord.losses;
        setLegacyCeremony({ season, wins:pWins, losses:pLosses,
          tier: playerTier, defeat:true, defeatReason:"bankruptcy",
          newlyEarned, allBoons,
          chronicle:{ totalRaids:trophies.reduce((a,t)=>a+(t.wins||0)+(t.losses||0),0)+pWins+pLosses,
            totalWins:trophies.reduce((a,t)=>a+(t.wins||0),0)+pWins,
            totalSeasons:season, builtCount:buildings.filter(b=>b.built).length,
            totalWeeks:week },
        });
        addLog("The realm has fallen into ruin. The campaign is over.","danger");
      } else {
        const weeksLeft = 3 - newBankruptcyWeeks;
        const urgency = weeksLeft === 2 ? "" : "";
        addLog(`${urgency} The realm's coffers are empty! ${weeksLeft} week${weeksLeft>1?"s":""} until the campaign ends. Sell heroes, win battles, or generate income.`, "danger");
      }
    } else if(bankruptcyWeeks > 0){
      // Recovered — reset counter
      setBankruptcyWeeks(0);
      addLog("Finances stabilised — bankruptcy warning lifted.","success");
    }

    // Record this week's finances for the Ledger tab
    const weekFinances = { week:seasonWeek+1, tribute:tributeAmount, wages, raidGold:result.goldSwing, eventGold:0, signingCosts:0, netGold:tributeAmount - wages + result.goldSwing, wasRaid:true };
    setLastWeekFinances(weekFinances);
    setSeasonFinances(prev=>({ tribute:prev.tribute+tributeAmount, raidGold:prev.raidGold+(result.goldSwing||0), wages:prev.wages+wages, eventGold:prev.eventGold, signingCosts:prev.signingCosts }));



    // Fold this week's result into the record BEFORE season end so the final
    // battle counts toward standings (and doesn't leak into next season)
    const finalRecord = isLegendary ? playerRecord
      : { wins: playerRecord.wins + (result.won?1:0), losses: playerRecord.losses + (result.won?0:1) };
    const newSeasonWeek=seasonWeek+1;
    const seasonEnding = newSeasonWeek>=SEASON_LENGTH;
    if(seasonEnding && !campaignFell){
      // A bankruptcy defeat on the season's final week skips promotion pageantry —
      // endSeason would otherwise queue a second (victory-toned) ceremony over the defeat
      endSeason(finalRecord);
    } else {
      setSeasonWeek(seasonEnding ? seasonWeek : newSeasonWeek);
    }

    // Generate random event every ~3 weeks
    // ── EVENT TRIGGER: disabled Season 1, then 4–8 week random intervals ────
    const eventEligible = season > 1 && week >= nextEventWeek && !activeEvent;
    if(eventEligible){
      // Roll next event interval immediately so it's set regardless of what fires
      setNextEventWeek(week + rand(4,8));

      const inHighTier = playerTier==="gold" || playerTier==="platinum";
      if(inHighTier && !emissaryFiredThisSeason && !legendaryChallenger && Math.random()<0.4){
        const challenger = pick(LEGENDARY_CHALLENGERS);
        const spec = pick(SPECIALISATIONS.filter(s=>!s.negative));
        const fullChallenger = {...challenger, power:challenger.power+rand(-10,10), specialisation:spec};
        const emissaryEvent = {
          ...EMISSARY_EVENT,
          challenger: fullChallenger,
          desc: `An emissary from ${fullChallenger.name} arrives bearing a formal challenge.`,
          flavour: `"${fullChallenger.flavour}"`,
        };
        setActiveEvent(emissaryEvent);
        setEmissaryFiredThisSeason(true);
        addLog(`Legendary challenge received from ${fullChallenger.name}! Check the Battle tab.`,"success");
      }
      else if(!pendingChallenge && Math.random()<0.20){
        const challenge = SPECIAL_EVENTS.find(e=>e.id==="the_challenge");
        setPendingChallenge({ opponentPowerMult: challenge.opponentPowerMult, rewardMult: challenge.rewardMult });
        addLog(`"${challenge.title}" — a formal challenge arrives. Check the Battle tab.`,"info");
      }
      else if((season - wanderingMasterLastSeason) >= 2 && Math.random()<0.15){
        setActiveWanderingMaster(SPECIAL_EVENTS.find(e=>e.id==="wandering_master"));
        addLog(`A wandering master has arrived at your gates! Check the Squad tab.`,"info");
      }
      else if(!pendingChallenge){
        const availableHeroes=heroes.filter(h=>!h.retired&&!(h.awayWeeks>0)&&!h.injured);
        const ev=generateRandomEvent(availableHeroes,week+1,playerTier);
        if(ev){
          setActiveEvent(ev);
          addLog(`"${ev.title}" — check the Battle tab!`,"info");
        }
      }
    }

    // Track player W/L record — legendary raids are exhibition matches, no leaderboard impact.
    // Skip when the season just ended: endSeason consumed finalRecord and reset to 0-0.
    if(!isLegendary && !seasonEnding){
      setPlayerRecord(finalRecord);
    }

    // ── HALL OF FAME: update records ──────────────────────────────────────────
    // Streak tracking (legendary wins count toward streak)
    const newStreak = result.won ? currentStreak+1 : 0;
    setCurrentStreak(newStreak);

    // Check win_streak_3 objective
    if(result.won && newStreak>=3){
    }

    setHallOfFame(prev=>{
      const next={...prev};

      // Longest winning streak
      if(result.won && newStreak > (prev.longestStreak?.count||0)){
        next.longestStreak = {count:newStreak, season, week:week+1};
      }

      // Biggest upset: lowest win chance won
      if(result.won && result.winChance < (prev.biggestUpset?.winChance??1)){
        next.biggestUpset = {
          winChance: result.winChance,
          enemy: raidEnemy.name,
          week: week+1, season,
        };
      }

      // Star player: highest-PWR hero ever fielded
      if(result.starPerformer){
        const mvpPwr = result.starPerformer.score;
        if(mvpPwr > (prev.starPlayer?.pwr||0)){
          next.starPlayer = {
            name:   result.starPerformer.hero.name,
            race:   result.starPerformer.hero.race,
            role:   result.starPerformer.hero.role,
            traits: result.starPerformer.hero.traits,
            level:  result.starPerformer.hero.level,
            pos:    result.starPerformer.pos,
            pwr:    mvpPwr,
            week:   week+1, season,
          };
        }
      }

      // Track peak gold
      next.peakGold = Math.max(prev.peakGold||0, gold);

      // Track abilities mitigated (pass outcomes)
      const mitigated = (result.abilityResults||[]).filter(r=>r.outcome==='pass').length;
      if(mitigated>0) next.abilitiesMitigated = (prev.abilitiesMitigated||0) + mitigated;

      return next;
    });
    // Track race synergy usage for achievement tracking
    if(result.analysis?.raceSynergy){
      setRaceSynergyUsage(prev=>({...prev, [result.analysis.raceSynergy.id]:(prev[result.analysis.raceSynergy.id]||0)+1}));
    }

    // Simulate enemy-vs-enemy matches this week (skip for legendary — they're outside normal schedule).
    // Also record the player's match in the opponent's league row so their W/L tracks the actual outcome.
    // Skip on the season-ending week: endSeason has already zeroed the new league table, and running
    // the sim here would re-stamp a week of W/L onto the fresh standings (rivals showing games played
    // before the new season starts).
    if(!isLegendary && !seasonEnding){
      setLeagueTable(prev=>{
        const {updated,results}=simulateEnemyWeek(week+1,raidEnemy.name,prev,tierEnemyTowns);
        const oppRow=updated[raidEnemy.name]||{wins:0,losses:0,power:raidEnemy.power};
        updated[raidEnemy.name]={
          ...oppRow,
          wins:   oppRow.wins  +(result.won?0:1),
          losses: oppRow.losses+(result.won?1:0),
        };
        const playerMatch={home:townName,away:raidEnemy.name,homeWon:result.won,week:week+1,isPlayer:true};
        setMatchLog(ml=>[playerMatch,...results.map(r=>({...r,week:week+1})),...ml.slice(0,19)]);
        return updated;
      });
      // The Grudge Book: the rival remembers this result across seasons
      const rivalTown = tierEnemyTowns.find(t=>t.name===raidEnemy.name);
      const grudgeDiff = rivalTown ? (rivalTown.h2h?.losses||0)-(rivalTown.h2h?.wins||0) : 0;
      if(result.won && grudgeDiff>=2){
        addLog(`The grudge is settled — ${raidEnemy.name} finally falls${rivalTown?.manager?`. ${rivalTown.manager.name} will remember this`:""}.`,"success");
        addChronicle(`The grudge settled — ${raidEnemy.name} finally beaten after ${grudgeDiff} more losses than wins.`);
      } else if(!result.won && grudgeDiff>=2 && rivalTown?.manager){
        addLog(`${rivalTown.manager.name} of ${raidEnemy.name} has your number — that's ${grudgeDiff+1} more defeats than wins.`,"warning");
      }
      // Match report — the lane series persists after the modal closes
      if(result.laneBattle){
        const rep = POS_KEYS.map(p=>{
          const lb=result.laneBattle[p];
          return lb?`${p.slice(0,3).toUpperCase()} ${lb.wins}–${lb.losses}`:null;
        }).filter(Boolean).join(" · ");
        addLog(`Match report vs ${raidEnemy.name}: ${rep}`,"info");
      }
      // Chronicle: only results worth retelling
      const wc = result.winChance ?? 0.5;
      if(result.won && wc < 0.15)      addChronicle(`Against all odds — beat ${raidEnemy.name} at ${Math.round(wc*100)}%.`);
      else if(result.won && wc < 0.30) addChronicle(`Upset — ${raidEnemy.name} toppled at ${Math.round(wc*100)}%.`);
      else if(!result.won && wc > 0.75) addChronicle(`Shock — fell to ${raidEnemy.name} as ${Math.round(wc*100)}% favourites.`);
      setTierEnemyTowns(ts=>ts.map(t=>t.name===raidEnemy.name
        ? {...t, h2h:{ wins:(t.h2h?.wins||0)+(result.won?1:0), losses:(t.h2h?.losses||0)+(result.won?0:1) }}
        : t));
    }

    // Generate offers every ~4 weeks
    if((week+1)%4===0){
      const newBids=generateBids(heroes,week+1,listedHeroIds);
      if(newBids.length){
        // Dedupe against already-active bids so one hero can't have two concurrent offers
        const existingHeroIds=new Set(transferBids.filter(b=>b.week>=week-1).map(b=>b.heroId));
        const dedupedNew=newBids.filter(b=>!existingHeroIds.has(b.heroId));
        setTransferBids(prev=>{
          const fresh=prev.filter(b=>b.week>=week-1);
          return [...fresh,...dedupedNew];
        });
        if(dedupedNew.length){
          // Pop the modal with the freshly-arrived bids
          setNewOfferBids(dedupedNew);
          addLog(`${dedupedNew.length} offer${dedupedNew.length>1?"s":""} received!`,"success");
        }
      }
    }

    const nextOpp = generateScheduledOpponent(seasonWeek + 2, leagueTable, tierEnemyTowns, playerTier, raidEnemy.name);
    setScheduledOpponent(nextOpp);
    setWeek(w=>w+1);

    // Build week summary digest
    const injuredNames = result.injuries.map(id=>heroes.find(h=>h.id===id)?.name).filter(Boolean);
    const exhaustedNames = aged.filter(h=>!h.retired&&(h.fatigue||0)>=FATIGUE_CRITICAL).map(h=>h.name);
    setWeekSummary({
      won: result.won,
      enemy: raidEnemy.name,
      enemyDiff: raidEnemy.difficulty,
      enemyPower: raidEnemy.power,
      playerTier,
      winChance: result.winChance,
      goldGain: result.goldSwing,
      wages,
      tribute: tributeAmount,
      heroXP: result.heroXP,
      levelUps: newLevelUps,
      injuries: injuredNames,
      exhausted: exhaustedNames,
      nextOpp,
      renownGain: 0,
      week: week+1,
      starPerformer: result.starPerformer,
      topWeakLink: result.topWeakLink,
      effective: result.effective,
      adjustedEnemyPower: result.adjustedEnemyPower,
      phaseWinChances: result.phaseWinChances,
      phaseRolls: result.phaseRolls,
    });
    } catch(err) {
      console.error("applyRaidResult error:", err);
      addLog(`Error applying results: ${err.message}. Check console.`, "danger");
      // Recovery guarantee: whatever failed mid-function, leave a playable state —
      // week advances, no stuck modal, and next week has a fresh opponent.
      setWeek(w=>w+1);
      setSeasonWeek(sw=>sw+1);
      setActiveSimulation(null);
      setPendingRaidEnemy(null);
      // A legendary challenger normally clears after its raid; if we crashed
      // before that point it would pin every future week to the same opponent.
      setLegendaryChallenger(null);
      try {
        setScheduledOpponent(generateScheduledOpponent(seasonWeek+2, leagueTable, tierEnemyTowns, playerTier, pendingRaidEnemy?.name));
      } catch { /* keep the old opponent if even this fails */ }
    }
  };

  // ── SEASON END — tiered promotion/relegation ──────────────────────────────
  const endSeason=(finalRecord=playerRecord)=>{
    const playerWins = finalRecord.wins;
    const playerLosses = finalRecord.losses;
    const playerPlayed = playerWins + playerLosses;
    const playerWinPct = playerPlayed > 0 ? playerWins / playerPlayed : 0;

    // Build standings for current tier
    const standings = [
      { name: townName, wins: playerWins, losses: playerLosses, winPct: playerWinPct, isPlayer: true },
      ...(tierEnemyTowns||[]).map(t => {
        const rec = leagueTable[t.name] || {};
        const w = rec.wins||0, l = rec.losses||0;
        return { name: t.name, wins: w, losses: l, winPct:(w+l)>0?w/(w+l):0, isPlayer:false, power:t.power };
      }),
    ].sort((a,b) => b.wins - a.wins || b.winPct - a.winPct);

    const finalPosition = standings.findIndex(t=>t.isPlayer) + 1;
    const tierIdx = TIER_ORDER.indexOf(playerTier);
    const isTop2 = finalPosition <= 2;
    const isBottom2 = finalPosition >= 7;
    const isIron = playerTier === "iron";
    const isPlatinum = playerTier === "platinum";

    // ── WIN CONDITION: Top 2 in Platinum ──────────────────────────────────
    if(isPlatinum && finalPosition === 1){
      const topRaceSynergyId = Object.entries(raceSynergyUsage).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? null;
      const topSynergy = topRaceSynergyId ? RACE_SYNERGIES.find(s=>s.id===topRaceSynergyId) : null;
      const currentNG = ngPlus?.wins ?? 0;
      const startingIds = new Set((saved?.heroes??[]).slice(0,8).map(h=>h.id));
      const achievementData = {
        trophies, buildings, raceSynergyUsage,
        retiredMax13: heroes.some(h=>h.retired&&h.level>=13),
        everPromoted: trophies.some(t=>t.tier!=="iron"),
        peakGold: hallOfFame.peakGold||0,
        abilitiesMitigated: hallOfFame.abilitiesMitigated||0,
        heroesSold: hallOfFame.heroesSold||0,
      };
      const newlyEarned = checkAchievements(achievementData);
      const existingBoons = ngPlus?.earnedBoons ?? [];
      const allBoons = [...existingBoons, ...newlyEarned];
      const totalRaids = trophies.reduce((a,t)=>a+(t.wins||0)+(t.losses||0),0)+playerWins+playerLosses;
      const chronicle = { totalRaids, totalWins:trophies.reduce((a,t)=>a+(t.wins||0),0)+playerWins,
        totalSeasons:season, builtCount:buildings.filter(b=>b.built).length,
        totalWeeks:week, starPlayer:hallOfFame.starPlayer??null,
        biggestUpset:hallOfFame.biggestUpset??null, longestStreak:hallOfFame.longestStreak??null,
        renownPeak:null };
      setLegacyCeremony({ season, wins:playerWins, losses:playerLosses,
        tier:"Platinum Champion", topSynergy, ngWins:currentNG, newlyEarned, allBoons, chronicle,
        nextNG:{ wins:currentNG+1 },
      });
    }

    // ── DETERMINE NEW TIER ────────────────────────────────────────────────
    let newTierIdx = tierIdx;
    let movement = "safe";
    if(isTop2 && !isPlatinum){ newTierIdx = tierIdx + 1; movement = "promoted"; }
    else if(isBottom2 && !isIron){ newTierIdx = tierIdx - 1; movement = "relegated"; }
    else if(isBottom2 && isIron){ movement = "relegated_floor"; }
    const newTierId = TIER_ORDER[Math.max(0, Math.min(TIER_ORDER.length-1, newTierIdx))];
    const newTier = TIERS[newTierId];

    // ── GENERATE NEW TIER TOWNS ───────────────────────────────────────────
    const tierChanged = newTierIdx !== tierIdx;
    let newTierTowns;
    if(tierChanged){
      // Player promoted/relegated into a different tier — it's an entirely new league,
      // so draw a fresh set of 7 towns from the DESTINATION tier's own name pool.
      // (Carrying the old tier's teams over is what made bronze reuse iron names.)
      newTierTowns = generateTierTowns(newTierId, []).slice(0,7);
    } else {
      // Held position: top 2 AI promote out, bottom 2 relegate out, rest stay but power refreshes
      const sortedAI = standings.filter(t=>!t.isPlayer);
      const promotedOut = sortedAI.slice(0,2).map(t=>t.name); // top 2 AI leave
      const relegatedOut = sortedAI.slice(-2).map(t=>t.name); // bottom 2 AI leave
      const staying = (tierEnemyTowns||[]).filter(t=>!promotedOut.includes(t.name)&&!relegatedOut.includes(t.name));

      // Refresh power of staying teams; rosters and squad reports expire with
      // the season (scouting is seasonal work, and squads turn over)
      const refreshedStaying = staying.map(t=>({...t, wins:0, losses:0, power:rand(newTier.powerMin, newTier.powerMax), roster:undefined, squadScouted:false, soldThisSeason:0}));

      // Generate replacements: 2 from tier above (promoted in from below), 2 from tier below (relegated from above)
      const existingNames = refreshedStaying.map(t=>t.name);
      const tierBelow = TIER_ORDER[Math.max(0, newTierIdx-1)];
      const tierAbove = TIER_ORDER[Math.min(TIER_ORDER.length-1, newTierIdx+1)];
      const newFromBelow = generateTierTowns(tierBelow, existingNames).slice(0,2).map(t=>({...t,tierId:newTierId,power:rand(newTier.powerMin,Math.round(newTier.powerMin*1.3))}));
      const newFromAbove = generateTierTowns(tierAbove, [...existingNames,...newFromBelow.map(t=>t.name)]).slice(0,2).map(t=>({...t,tierId:newTierId,power:rand(Math.round(newTier.powerMax*0.7),newTier.powerMax)}));
      newTierTowns = [...refreshedStaying, ...newFromBelow, ...newFromAbove].slice(0,7);
    }

    // Build new league table
    const newLeagueTable = {};
    newTierTowns.forEach(t=>{ newLeagueTable[t.name]={wins:0,losses:0,power:t.power}; });

    // ── TROPHY + HoF ─────────────────────────────────────────────────────
    const trophy = { season, tier:playerTier, position:finalPosition,
      wins:playerWins, losses:playerLosses, movement, week };
    setTrophies(t=>[trophy,...t]);
    setHallOfFame(prev=>{
      const next={...prev};
      if(playerWins>(prev.bestSeason?.wins||0)||
        (playerWins===(prev.bestSeason?.wins||0)&&TIER_ORDER.indexOf(playerTier)>TIER_ORDER.indexOf(prev.bestSeason?.tier||"iron"))){
        next.bestSeason={season,wins:playerWins,losses:playerLosses,tier:playerTier,position:finalPosition};
      }
      return next;
    });

    // ── MOVEMENT LOG ─────────────────────────────────────────────────────
    const movementMsg = movement==="promoted"?`PROMOTED to ${TIERS[newTierId].name}!`:
                        movement==="relegated"?`Relegated to ${TIERS[newTierId].name}.`:
                        movement==="relegated_floor"?`Finished bottom of Iron — no lower to go.`:
                        `Held position in ${TIERS[playerTier].name} (${finalPosition}${['st','nd','rd'][finalPosition-1]||'th'})`;
    addLog(`Season ${season} ended! ${movementMsg} — ${playerWins}W/${playerLosses}L`,"success");
    addChronicle(movement==="promoted"?`Season ${season}: PROMOTED to ${TIERS[newTierId].name} (${playerWins}W/${playerLosses}L).`
      :movement==="relegated"?`Season ${season}: relegated to ${TIERS[newTierId].name} (${playerWins}W/${playerLosses}L).`
      :`Season ${season}: finished ${finalPosition}${['st','nd','rd'][finalPosition-1]||'th'} in ${TIERS[playerTier].name} (${playerWins}W/${playerLosses}L).`);

    // ── END-OF-SEASON SUMMARY ────────────────────────────────────────────
    // Skip when the legacy ceremony is taking over (Platinum champion).
    // Bankruptcy also routes to the legacy ceremony and never reaches endSeason.
    if(!(isPlatinum && finalPosition === 1)){
      const snapshot = seasonStartSnapshot || captureSeasonSnapshot(heroes, buildings);
      const currentBuilt = new Set(buildings.filter(b=>b.built).map(b=>b.id));
      const snapBuilt    = new Set(snapshot.built || []);
      const buildingsBuilt = [...currentBuilt].filter(id => !snapBuilt.has(id));
      const snapById = new Map((snapshot.heroes||[]).map(sh=>[sh.id,sh]));
      const currentIds = new Set(heroes.map(h=>h.id));
      const levelUps = heroes.reduce((acc,h)=>{
        const sh = snapById.get(h.id);
        if(sh && h.level > sh.level) acc.push({name:h.name, oldLevel:sh.level, newLevel:h.level});
        return acc;
      },[]);
      const newSignings = heroes.filter(h=>!snapById.has(h.id)).map(h=>({name:h.name, level:h.level}));
      const departures  = (snapshot.heroes||[]).filter(sh=>!currentIds.has(sh.id)).map(sh=>({name:sh.name}));
      setSeasonSummary({
        season, wins: playerWins, losses: playerLosses,
        tier: playerTier, finalPosition, movement, newTier: newTierId,
        levelUps, newSignings, departures, buildingsBuilt,
        finances: {...seasonFinances},
      });
    }

    // Capture a fresh snapshot for next season's diff
    setSeasonStartSnapshot(captureSeasonSnapshot(heroes, buildings));

    // ── PROMOTION BONUS ───────────────────────────────────────────────────
    if(movement==="promoted"){
      setGold(g=>g+500);
      addLog(`Promotion bonus: +500g to ease the transition.`,"success");
      // Promotion excitement — all heroes get a morale lift going into the new tier
      setHeroes(hs=>hs.map(h=>h.retired?h:{...h, morale:Math.max(h.morale, 75)}));
      addLog(`The squad's spirits are high — everyone starts the new tier with at least 75 morale.`,"success");
    }

    setCurrentStreak(0);
    setSeason(s=>s+1);
    setPlayerTier(newTierId);
    setTierPosition(8); // start at bottom of new tier
    setTierEnemyTowns(newTierTowns);
    setLeagueTable(newLeagueTable);
    setPlayerRecord({wins:0,losses:0});
    setMatchLog([]);
    setSeasonWeek(0);
    setSeasonFinances({tribute:0,raidGold:0,wages:0,eventGold:0,signingCosts:0});
    setNextEventWeek(rand(4,8));
    setSignDiscount(0);
    setEmissaryFiredThisSeason(false);

    // Refresh market with tier-appropriate talent on promotion/relegation
    if(movement === "promoted" || movement === "relegated") {
      const isNewElite   = newTierId === "platinum";
      const isNewPremium = ["gold","platinum"].includes(newTierId);
      setMarket(Array.from({length:12},(_,i) => {
        const isPrem = isNewPremium && Math.random() < 0.35;
        const isElit = isNewElite   && Math.random() < 0.20;
        return generateHero(Date.now()+i, true, isPrem, isElit, null, null, newTierId);
      }));
      addLog(`The mercenary pool has refreshed with ${TIERS[newTierId].name}-tier talent.`,"info");
    }

    // Generate first opponent for new season
    setScheduledOpponent(generateScheduledOpponent(1, newLeagueTable, newTierTowns, newTierId));
  };

  // Best position for a hero = the lane where they score highest. Cached per
  // filter pass via a Map so we don't recompute when sorting/filtering.
  // Position filter/pills are strictly role-derived (a Rogue is a Skirmisher,
  // always) — stat-based lane signals live in the Retraining mechanic instead.
  const filtered=useMemo(()=>{
    let h=[...heroes];
    if(filter.role!=="All")h=h.filter(x=>x.role===filter.role);
    if(filter.position!=="All"){
      h=h.filter(x=>naturalLaneFor(x.role)===filter.position);
    }
    if(filter.race!=="All")h=h.filter(x=>x.race===filter.race);
    if(filter.status==="Fit")h=h.filter(x=>!x.injured&&!(x.awayWeeks>0));
    if(filter.status==="Injured")h=h.filter(x=>x.injured);
    if(filter.status==="Away")h=h.filter(x=>(x.awayWeeks||0)>0);
    if(filter.status==="Unhappy")h=h.filter(x=>x.morale<50);
    if(filter.status==="Renewing")h=h.filter(x=>x.negotiationPending||(x.contractWeeksLeft||0)<=WEEKS_PER_CONTRACT_YEAR*2);
    // Legacy "Contract" alias kept so older saved filter state still works.
    if(filter.status==="Contract")h=h.filter(x=>(x.contractWeeksLeft||0)<=WEEKS_PER_CONTRACT_YEAR*2);
    if(filter.phase!=="All")h=h.filter(x=>agePhase(x)===filter.phase);
    if(filter.search)h=h.filter(x=>x.name.toLowerCase().includes(filter.search.toLowerCase())||(x.traits||[]).some(t=>t.toLowerCase().includes(filter.search.toLowerCase())));
    const sorts={Value:x=>-x.value,Potential:x=>-x.stats.Potential,Level:x=>-x.level,XP:x=>-x.xp,Stage:x=>stageToCareerWeek(x.stage||"peak",x.stageProgress||0),Morale:x=>x.morale,Contract:x=>(x.contractWeeksLeft||0),Combat:x=>-(STAT_GROUPS.Combat.reduce((a,s)=>a+x.stats[s],0)/STAT_GROUPS.Combat.length),Salary:x=>x.salary,Fatigue:x=>-(x.fatigue||0)};
    if(sorts[filter.sortBy])h.sort((a,b)=>sorts[filter.sortBy](a)-sorts[filter.sortBy](b));
    return h;
  },[heroes,filter]);

  // Market list after tier locks + filters + sort — shared by the Hire tab's
  // "N shown" count and the card grid so they can't drift apart
  const marketFiltered=useMemo(()=>{
    const hasBazaar=buildings.find(b=>b.id==="bazaar"&&b.built);
    const hasSanctum=buildings.find(b=>b.id==="sanctum"&&b.built);
    const mSorts={Value:h=>-h.value,Combat:h=>-Math.max(...POS_KEYS.map(p=>calcHeroCombatScore(h,p))),Salary:h=>h.salary,Level:h=>-h.level,Stage:h=>stageToCareerWeek(h.stage||"prospect",h.stageProgress||0),Potential:h=>-h.stats.Potential};
    return market
      .filter(h=>{
        if(h.marketTier==="elite") return !!hasSanctum;
        if(h.marketTier==="premium") return !!hasBazaar;
        return true;
      })
      .filter(h=>marketFilter.role==="All"||h.role===marketFilter.role)
      .filter(h=>marketFilter.race==="All"||h.race===marketFilter.race)
      // Position filter: show heroes whose role is the natural fit for that lane
      .filter(h=>marketFilter.position==="All"||(POSITIONS[marketFilter.position]?.ideal||[]).includes(h.role))
      .filter(h=>marketFilter.stage==="All"||h.stage===marketFilter.stage)
      .sort((a,b)=>(mSorts[marketFilter.sortBy]||mSorts.Value)(a)-(mSorts[marketFilter.sortBy]||mSorts.Value)(b));
  },[market,marketFilter,buildings]);

  const {effective:formRating,analysis:formAnalysis}=calcFormationRating(formation);
  const wages=heroes.reduce((a,h)=>a+h.salary,0);
  const builtN=buildings.filter(b=>b.built).length;
  const placed=POS_KEYS.reduce((a,p)=>(formation[p]||[]).filter(Boolean).length+a,0);
  const unhappyCount=heroes.filter(h=>h.morale<50).length;
  const contractAlerts=heroes.filter(h=>h.negotiationPending||(h.contractWeeksLeft||0)===0).length;
  const contractWarnings=heroes.filter(h=>!h.negotiationPending&&(h.contractWeeksLeft||0)>0&&(h.contractWeeksLeft||0)<=2).length;

  const currentTier = TIERS[playerTier] || TIERS.iron;
  const currentTierPosition = calcTierPosition(playerRecord.wins, playerRecord.wins/(Math.max(1,playerRecord.wins+playerRecord.losses)), leagueTable, tierEnemyTowns);
  const NAV_ITEMS = [
    { id:"Squad",    icon:"", label:"Squad",    badge: unhappyCount>0||contractAlerts>0||contractWarnings>0||pendingEventReturns.length>0 },
    { id:"Tactics",  icon:"", label:"Tactics",  badge: false },
    { id:"Battle",   icon:"", label:"Battle",   badge: !!activeEvent },
    { id:"Dominion", icon:"", label:"Dominion", badge: false },
    { id:"Town",     icon:"", label:"Town",     badge: false },
    { id:"Hire",     icon:"", label:"Hire",     badge: transferBids.length>0 },
    { id:"Ledger",    icon:"", label:"Ledger",   badge: false },
    { id:"Guide",    icon:"", label:"Guide",    badge: false },
  ];
  const IS={background:"rgba(138,109,59,0.06)",border:"1px solid rgba(138,109,59,0.3)",borderRadius:4,color:"#3A3427",padding:"6px 10px",fontSize:11,outline:"none",fontFamily:"'Alegreya Sans',sans-serif"};
  // Parchment Codex sidebar palette: gold accent for currency,
  // parchment for neutral, danger red for trouble, success green for income.
  const STAT_ROWS = [
    ["Gold",          gold.toLocaleString()+"g",                                                         gold<0?"#7E2D26":"#8A6D3B"],
    ["Tier",          `${currentTier.icon} ${currentTier.name}, ${currentTierPosition}${['st','nd','rd'][currentTierPosition-1]||'th'}`, "#3A3427"],
    ["Income",        `+${weeklyRankIncome(playerTier, currentTierPosition).toLocaleString()}g`,    "#4A6B45"],
    ["Wages",         `${wages.toLocaleString()}g`,                                                 "#77653F"],
    ["Week",          `${seasonWeek}`,                                                              "#3A3427"],
    ["Season",        `${season}`,                                                                  "#3A3427"],
    ...(ngPlus?.wins ? [["Realm",`#${ngPlus.wins+1}`,"#8A6D3B"]] : []),
    ...(squadLeaderId!=null&&heroes.find(h=>h.id===squadLeaderId) ? [["Leader",`${heroes.find(h=>h.id===squadLeaderId).name.split(" ")[0]}`,"#8A6D3B"]] : []),
    ["Formation",     `${placed}/6 · ${formRating}`,                                                "#77653F"],
    ["Squad",         `${heroes.filter(h=>!h.retired).length}/${ROSTER_CAP}`,                       heroes.filter(h=>!h.retired).length>=ROSTER_CAP?"#7E2D26":"#3A3427"],
    ...(unhappyCount>0   ? [["Unhappy",  `${unhappyCount}`, "#8A6D3B"]] : []),
    ...(contractAlerts>0 ? [["Expired",  `${contractAlerts}`,"#7E2D26"]] : []),
    ...(contractWarnings>0?[["Expiring", `${contractWarnings}`,"#8A6D3B"]] : []),
  ];

  if(screen==="boot"){
    return <BootSplash/>;
  }
  if(screen==="home"){
    return <HomeScreen saved={saved} onContinue={()=>setScreen("game")} onNewRealm={()=>{
      if(saved?.townName) requestNewRealm();   // reload → intent flag → setup, fresh initializers
      else setScreen("setup");                  // nothing to clear — no reload needed
    }}/>;
  }
  if(screen==="setup"||!setupDone){
    return <SetupScreen onComplete={handleSetupComplete}/>;
  }

  return(
    <div style={{minHeight:"100vh",background:"#E9E1CE",color:"#3A3427",fontFamily:"'Alegreya Sans',sans-serif"}}>
      <InjectCSS/>
      {/* was a starfield; now faint paper grain */}
      <div style={{position:"fixed",inset:0,backgroundImage:"radial-gradient(1px 1px at 12% 20%,rgba(60,52,38,0.10) 0%,transparent 100%),radial-gradient(1px 1px at 68% 50%,rgba(60,52,38,0.08) 0%,transparent 100%),radial-gradient(1px 1px at 38% 78%,rgba(60,52,38,0.07) 0%,transparent 100%)",pointerEvents:"none"}}/>

      <RetirementModal retirees={retirees} heroes={heroes.filter(h=>!h.retired)} formation={formation}
        onDismiss={(mentees)=>{
          if(mentees&&Object.keys(mentees).length>0){
            setHeroes(hs=>hs.map(h=>{
              // Check if this hero was chosen as a mentee
              const retiredId=Object.keys(mentees).find(rid=>mentees[rid]===h.id);
              if(!retiredId) return h;
              const retiree=retirees.find(r=>r.id===retiredId);
              if(!retiree) return h;
              addLog(`${h.name} will be mentored by ${retiree.name} — +10 XP/week for a season.`,"success");
              return {...h, mentorBonus:{mentorName:retiree.name,xpPerWeek:10,weeksLeft:SEASON_LENGTH}};
            }));
          }
          setRetirees([]);
        }}/>
      <NegotiationModal pending={negotiationQueue} heroes={heroes} onSign={handleSign} onCollapse={handleCollapse} onPostpone={handlePostpone} onSting={handleNegotiationSting}/>
      {activeSimulation&&<RaidSimulationModal simulation={activeSimulation} enemy={pendingRaidEnemy} onComplete={applyRaidResult}/>}
      {weekSummary&&!activeSimulation&&<WeeklySummary summary={weekSummary} onDismiss={()=>setWeekSummary(null)} townColor={townColor}/>}
      {seasonSummary&&!activeSimulation&&!legacyCeremony&&<SeasonSummaryModal summary={seasonSummary} onDismiss={()=>setSeasonSummary(null)} townColor={townColor}/>}

      {/* Legacy Ceremony — fires when player reaches Rank 1 */}
      {legacyCeremony&&(
        <LegacyCeremony
          data={legacyCeremony}
          townName={townName}
          townColor={townColor}
          onPlayOn={()=>setLegacyCeremony(null)}
          onNewLegacy={(allBoons)=>{
            const topRaceSynergyId=Object.entries(raceSynergyUsage).sort((a,b)=>b[1]-a[1])[0]?.[0]??null;
            // Victory increments wins; defeat/abandon preserves wins count
            const newWins = legacyCeremony.defeat ? (ngPlus?.wins??0) : (ngPlus?.wins??0)+1;
            saveNGPlus({
              wins: newWins,
              topRaceSynergyId,
              earnedBoons: allBoons,
            });
            clearSave();
            try { sessionStorage.setItem(INTENT_KEY, "new"); } catch { /* private mode */ }
            window.location.reload();
          }}
        />
      )}
      {activeEvent&&<RandomEventModal event={activeEvent} heroes={heroes} townName={townName} onAccept={acceptEvent} onDecline={declineEvent} onViewHero={(h)=>{setDetailHero(h);setPrevStats(null);}}/>}
      {activeWanderingMaster&&<WanderingMasterModal event={activeWanderingMaster} heroes={heroes} gold={gold} onAccept={acceptWanderingMaster} onDecline={declineWanderingMaster}/>}
      {newOfferBids.length>0&&(
        <NewOffersModal
          bids={newOfferBids}
          heroes={heroes}
          onAccept={(bid)=>{ acceptBid(bid); setNewOfferBids(prev=>prev.filter(b=>b.id!==bid.id)); }}
          onDecline={(bid)=>{ declineBid(bid); setNewOfferBids(prev=>prev.filter(b=>b.id!==bid.id)); }}
          onViewHero={(hero)=>{ setDetailHero(hero); setPrevStats(null); setNewOfferBids([]); }}
          onDismiss={()=>setNewOfferBids([])}
        />
      )}

      {/* ── DESKTOP SIDEBAR — Parchment Codex ── */}
      <div className="rm-sidebar">
        <div className="rm-sidebar-logo">
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <div style={{width:22,height:22,border:"1px solid rgba(138,109,59,0.55)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Glyph id="nav_battle" size={13} color="#8A6D3B"/>
            </div>
            <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:11,color:"#8A6D3B",letterSpacing:2.5}}>REALM MANAGER</div>
          </div>
          <div style={{fontFamily:"'IM Fell English SC',serif",fontWeight:400,fontSize:22,color:townColor||"#3A3427",letterSpacing:0.5,lineHeight:1.1}}>{townName}</div>
          <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:400,fontSize:9,color:"#77653F",letterSpacing:2,marginTop:4,fontStyle:"italic"}}>Season {season} · Week {seasonWeek}</div>
        </div>
        <div className="rm-sidebar-stats">
          {STAT_ROWS.map(([l,v,c])=>(
            <div key={l} className="rm-stat-row">
              <span className="rm-stat-label">{l}</span>
              <span className="rm-stat-value" style={{color:c}}>{v}</span>
            </div>
          ))}
        </div>

        {signDiscount>0&&<div style={{padding:"8px 20px",fontFamily:"'Alegreya Sans',sans-serif",fontSize:9,letterSpacing:1.5,textTransform:"uppercase",color:"#8A6D3B",borderBottom:"1px solid rgba(138,109,59,0.15)"}}>Next signing · {Math.round(signDiscount*100)}% off</div>}

        <nav className="rm-sidebar-nav">
          <div className="rm-nav-kicker">Council</div>
          {NAV_ITEMS.map(({id,icon,label,badge})=>(
            <button key={id}
              className={`rm-nav-item${tab===id?" active":""}`}
              onClick={()=>setTab(id)}>
              <span className="rm-nav-icon-wrap"><NavIcon tab={id} size={15}/></span>
              <span style={{flex:1}}>{label}</span>
              {badge&&<span className="rm-nav-badge"/>}
            </button>
          ))}
        </nav>
      </div>

      {/* ── MOBILE TOP BAR ── */}
      <div className="rm-topbar">
        <span className="rm-topbar-title" style={{color:townColor}}>{townName}</span>
        <div className="rm-topbar-chips">
          {[["Gold",gold.toLocaleString()+"g","#8A6D3B"],[`${currentTier.icon} ${currentTier.name}`,`${currentTierPosition}${['st','nd','rd'][currentTierPosition-1]||'th'}`,currentTier.color],["Tribute",`+${weeklyRankIncome(playerTier, currentTierPosition).toLocaleString()}g`,"#40614F"],["Wages",wages+"g","#9A5B2B"],["Week",seasonWeek,"#23201A"]].map(([l,v,c])=>(
            <div key={l} className="rm-topbar-chip">
              <div className="rm-topbar-chip-label">{l}</div>
              <div className="rm-topbar-chip-value" style={{color:c}}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <div className="rm-content">
        <div className={`rm-main${detailHero&&!isMobile?" rm-main-shifted":""}`} onClick={()=>showMore&&setShowMore(false)}>

        {/* Bankruptcy warning banner */}
        {bankruptcyWeeks>0&&(
          <div style={{marginBottom:12,padding:"10px 14px",borderRadius:3,
            background:bankruptcyWeeks>=2?"rgba(126,45,38,0.15)":"rgba(154,91,43,0.12)",
            border:`1px solid ${bankruptcyWeeks>=2?"rgba(126,45,38,0.55)":"rgba(154,91,43,0.45)"}`,
            display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:18}}>{bankruptcyWeeks>=2?"":""}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:11,fontWeight:700,color:bankruptcyWeeks>=2?"#7E2D26":"#9A5B2B",fontFamily:"'Alegreya Sans',sans-serif"}}>
                {bankruptcyWeeks>=2?"FINAL WARNING — ":"BANKRUPTCY WARNING — "}
                {3-bankruptcyWeeks} week{3-bankruptcyWeeks>1?"s":""} remaining
              </div>
              <div style={{fontSize:9,color:"#4A4335",marginTop:2}}>
                The realm cannot meet its wage bill. Sell heroes, win battles, or the campaign ends.
              </div>
            </div>
          </div>
        )}

        {/* SQUAD */}
        {tab==="Squad"&&(
          <div>

            {/* Parchment Codex page header */}
            {(()=>{
              const active = heroes.filter(h=>!h.retired);
              const fit = active.filter(h=>!h.injured && !(h.awayWeeks>0)).length;
              const fatigued = active.filter(h=>(h.fatigue||0)>=FATIGUE_WARN).length;
              return(
                <div style={{marginBottom:24}}>
                  <h1 className="pa-h1">The Roster</h1>
                  <div className="pa-rule"/>
                  <div className="pa-sub">{active.length} heroes under contract · {fit} fit{fatigued>0?` · ${fatigued} fatigued`:""}</div>
                </div>
              );
            })()}

            {/* Getting Started hint — shown once on week 1 with empty formation, hidden after first win */}
            {!hintDismissed && !ngPlus?.wins && week<=1 && placed===0 && (
              <div style={{marginBottom:14,padding:"14px 16px",borderRadius:3,
                background:"rgba(60,90,120,0.09)",border:"1px solid rgba(60,90,120,0.3)",
                position:"relative"}}>
                <button onClick={()=>setHintDismissed(true)}
                  style={{position:"absolute",top:8,right:10,background:"none",border:"none",
                    cursor:"pointer",color:"#6E6350",fontSize:16,lineHeight:1}}>×</button>
                <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:12,color:"#3C5A78",marginBottom:10}}>
                  Welcome to Realm Manager
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {[
                    {step:"1", label:"Set your formation", sub:"Tactics tab → drag heroes into Vanguard, Skirmisher & Arbiter slots", tab:"Tactics", col:"#40614F"},
                    {step:"2", label:"Launch a battle",      sub:"Battle tab → review your opponent, check win chance, then fight",       tab:"Battle",    col:"#8A6D3B"},
                    {step:"3", label:"Manage your squad",  sub:"Keep heroes happy, renew contracts, watch fatigue after battles",        tab:"Squad",   col:"#5F4B66"},
                  ].map(({step,label,sub,tab:target,col})=>(
                    <div key={step} onClick={()=>setTab(target)}
                      style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",
                        borderRadius:3,background:"rgba(60,52,38,0.054)",
                        border:"1px solid rgba(60,52,38,0.126)",cursor:"pointer",
                        transition:"background 0.15s"}}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(60,52,38,0.108)"}
                      onMouseLeave={e=>e.currentTarget.style.background="rgba(60,52,38,0.054)"}>
                      <div style={{width:22,height:22,borderRadius:"50%",background:`${col}22`,
                        border:`1px solid ${col}55`,display:"flex",alignItems:"center",
                        justifyContent:"center",flexShrink:0}}>
                        <span style={{fontSize:10,fontWeight:700,color:col}}>{step}</span>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11,fontWeight:700,color:col}}>{label}</div>
                        <div style={{fontSize:9,color:"#6E6350",marginTop:1}}>{sub}</div>
                      </div>
                      <span style={{fontSize:10,color:"#6E6350"}}>→</span>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <button onClick={()=>{setTab("Guide");setHintDismissed(true);}}
                    style={{background:"none",border:"none",cursor:"pointer",color:"#3C5A78",fontSize:10,padding:0,textDecoration:"underline"}}>
                    Full How to Play guide
                  </button>
                  <span style={{fontSize:9,color:"#6E6350"}}>Dismiss with ×</span>
                </div>
              </div>
            )}
            {(unhappyCount>0||contractAlerts>0||contractWarnings>0)&&(
              <div className="pa-alert">
                {contractAlerts>0&&<span><span className="num">{contractAlerts}</span> contract{contractAlerts>1?"s":""} expired</span>}
                {contractWarnings>0&&<span><span className="num">{contractWarnings}</span> contract{contractWarnings>1?"s":""} expiring this week</span>}
                {unhappyCount>0&&<span><span className="num">{unhappyCount}</span> low morale</span>}
              </div>
            )}

            {/* ── WANDERING MASTER BANNER ──────────────────────────────── */}
            {activeWanderingMaster&&(
              <div style={{marginBottom:10,padding:"12px 14px",borderRadius:3,
                background:"rgba(95,75,102,0.105)",border:"1px solid rgba(95,75,102,0.525)",
                display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:22}}></span>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:12,color:"#5F4B66"}}>
                    The Wandering Master has arrived
                  </div>
                  <div style={{fontSize:10,color:"#4A4335",marginTop:2}}>
                    For {activeWanderingMaster.cost}g, they will train one of your heroes — permanently raising a stat of your choice beyond their natural ceiling.
                  </div>
                </div>
                <button onClick={()=>setActiveWanderingMaster(SPECIAL_EVENTS.find(e=>e.id==="wandering_master"))}
                  style={{padding:"7px 12px",borderRadius:3,border:"none",cursor:"pointer",
                    background:"rgba(95,75,102,0.3)",color:"#5F4B66",
                    fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:10,whiteSpace:"nowrap"}}>
                  Meet them →
                </button>
              </div>
            )}

            {/* Squad Leader nudge — the mechanic hides behind a hero's profile,
                so surface it once the squad has a few weeks of tenure */}
            {!leaderHintDismissed && squadLeaderId==null && week>=3 && (
              <div style={{marginBottom:14,padding:"12px 14px",borderRadius:3,
                background:"rgba(138,109,59,0.075)",border:"1px solid rgba(138,109,59,0.33)",
                display:"flex",alignItems:"center",gap:10,position:"relative"}}>
                <Glyph id="leader" size={18} color="#8A6D3B"/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:12,color:"#8A6D3B"}}>
                    No Squad Leader appointed
                  </div>
                  <div style={{fontSize:10,color:"#4A4335",marginTop:2}}>
                    Open a hero's profile to appoint one — while fielded, a leader grants morale each week, bonus XP, and softer morale losses on defeat. Long-serving veterans make the strongest leaders.
                  </div>
                </div>
                <button onClick={()=>setLeaderHintDismissed(true)} aria-label="Dismiss"
                  style={{background:"none",border:"none",cursor:"pointer",color:"#77653F",fontSize:14,lineHeight:1,padding:6,flexShrink:0}}>✗</button>
              </div>
            )}

            {/* ── EVENT RETURN BANNERS ───────────────────────────────────── */}
            {pendingEventReturns.map(ret=>{
              const th = EVENT_THEMES[ret.eventTheme];
              const outcomeColor = ret.outcome==="success" ? "#40614F" : ret.outcome==="partial" ? "#8A6D3B" : "#7E2D26";
              const outcomeLbl   = ret.outcome==="success" ? "Delivered" : ret.outcome==="partial" ? "In Part" : "Undone";
              return(
                <div key={ret.id} style={{marginBottom:10,padding:"12px 14px",borderRadius:3,
                  background:`${(th?.ink||outcomeColor)}0a`,border:`1px solid ${(th?.ink||outcomeColor)}40`,
                  position:"relative"}}>
                  <button onClick={()=>setPendingEventReturns(prev=>prev.filter(r=>r.id!==ret.id))}
                    style={{position:"absolute",top:8,right:10,background:"none",border:"none",
                      cursor:"pointer",color:"#6E6350",fontSize:16,lineHeight:1}}>×</button>
                  <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:6}}>
                    {th&&(
                      <div style={{width:26,height:26,borderRadius:"50%",background:th.ink,color:"#E9E1CE",
                        display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                        fontFamily:"'Alegreya Sans',sans-serif",fontSize:13,transform:"rotate(-8deg)",opacity:0.9}}>
                        {th.seal}
                      </div>
                    )}
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:12,color:"#23201A"}}>
                        {ret.heroName} has returned
                      </div>
                      <div style={{fontSize:10,color:"#6E6350"}}>
                        {ret.eventTitle}{th?` · ${th.label}`:""}
                      </div>
                    </div>
                    <span className={ret.outcome==="failure"?"rm-stamp rm-stamp-loss":"rm-stamp"}
                      style={{fontSize:10,padding:"1px 8px 0",marginRight:14,
                        ...(ret.outcome==="partial"?{borderColor:"#8A6D3B",color:"#8A6D3B"}:{})}}>
                      {outcomeLbl}
                    </span>
                  </div>
                  {ret.report&&(
                    <div style={{fontSize:11,color:"#4A4335",fontStyle:"italic",lineHeight:1.55,marginBottom:6,
                      paddingLeft:10,borderLeft:`2px solid ${(th?.ink||outcomeColor)}55`}}>
                      "{ret.report}"
                      {th?.sender&&th.sender!=="(unsigned)"&&<span style={{color:"#6E6350"}}> — {th.sender}</span>}
                    </div>
                  )}
                  {ret.goldGain>0&&(
                    <div style={{fontSize:11,color:"#8A6D3B",marginBottom:4,fontWeight:700}}>
                      Enclosed: +{ret.goldGain.toLocaleString()}g
                    </div>
                  )}
                  {ret.notifications.length>0&&(
                    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                      {ret.notifications.map((n,i)=>(
                        <span key={i} style={{fontSize:10,color:outcomeColor,
                          background:`${outcomeColor}10`,padding:"2px 7px",borderRadius:3,
                          border:`1px solid ${outcomeColor}30`}}>
                          {n}
                        </span>
                      ))}
                    </div>
                  )}
                  {ret.outcome==="failure"&&ret.notifications.length===0&&!ret.report&&(
                    <div style={{fontSize:10,color:"#6E6350"}}>Returned empty-handed. No lasting harm done.</div>
                  )}
                  {ret.pendingStatChoice&&(
                    <div style={{marginTop:8}}>
                      <div style={{fontSize:10,color:"#5F4B66",fontWeight:700,marginBottom:5}}>
                        Choose a stat to boost:
                      </div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                        {["Strength","Agility","Endurance","Defense","Magic Power","Accuracy",
                          "Magic Resist","Tactics","Composure","Leadership","Adaptability",
                          "Determination","Charisma","Negotiation","Intimidation"].map(s=>(
                          <button key={s} onClick={()=>{
                            const hero = heroes.find(h=>h.id===ret.heroId);
                            const current = hero?.stats?.[s]||0;
                            const softCap = (hero?.stats?.Potential||99) + 5;
                            const boostAmt = rand(2,4);
                            const newVal = Math.min(softCap, current + boostAmt);
                            const actual = newVal - current;
                            setHeroes(hs=>hs.map(h=>h.id===ret.heroId
                              ? {...h, stats:{...h.stats,[s]:newVal}}
                              : h));
                            addLog(`Oracle's gift: ${ret.heroName} +${actual} ${s}!`,"success");
                            setPendingEventReturns(prev=>prev.map(r=>r.id===ret.id?{...r,pendingStatChoice:false,notifications:[...r.notifications,`+${actual} ${s}`]}:r));
                          }}
                            style={{padding:"3px 8px",borderRadius:3,border:"1px solid rgba(95,75,102,0.45)",
                              background:"rgba(95,75,102,0.12)",color:"#5F4B66",cursor:"pointer",fontSize:9}}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Race composition tip */}
            {(()=>{
              const rs = formAnalysis.raceSynergy;
              if(!rs) return null;
              return(
                <div style={{marginBottom:12,borderRadius:3,overflow:"hidden",border:`1px solid ${rs.color}33`}}>
                  <div style={{padding:"8px 12px",background:`${rs.color}0a`,borderBottom:`1px solid ${rs.color}22`,display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:14}}>{rs.icon}</span>
                    <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:11,fontWeight:700,color:rs.color}}>{rs.name}</div>
                    <div style={{fontSize:9,color:"#40614F",marginLeft:"auto"}}>✓ Active · ×{rs.ratingMult}</div>
                  </div>
                </div>
              );
            })()}

            {/* Row 1 — position pills, full names, one line at 375px */}
            <div className="rm-sq-row" style={{display:"flex",gap:5,marginBottom:6,alignItems:"center"}}>
              {["All",...POS_KEYS].map(p=>{
                const count = p==="All"
                  ? heroes.length
                  : heroes.filter(h=>naturalLaneFor(h.role)===p).length;
                const isActive = filter.position === p;
                return(
                  <button key={p} className={`pa-pill${isActive?" active":""}`} onClick={()=>setFilter(f=>({...f,position:p}))}>
                    {p}<span className="ct">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Row 2 — race synergy chips: races with 2+ heroes get a chip (the
                only ones worth filtering for — pacts need multiples); singletons
                collapse into the Other select. The row doubles as roster
                intelligence: which synergies are within reach. Derived from the
                live roster every render, so chips demote/graduate automatically. */}
            {(()=>{
              const RACES_LIST = ["Human","Elf","Dwarf","Half-Orc","Gnome","Tiefling","Dragonborn"];
              const counts = Object.fromEntries(RACES_LIST.map(r=>[r,heroes.filter(h=>h.race===r).length]));
              const chipRaces  = RACES_LIST.filter(r=>counts[r]>=2).sort((a,b)=>counts[b]-counts[a]);
              // Singletons only — a race with zero heroes is nothing to filter by
              const otherRaces = RACES_LIST.filter(r=>counts[r]===1);
              const otherCount = otherRaces.reduce((a,r)=>a+counts[r],0);
              const otherActive = otherRaces.includes(filter.race);
              return(
                <div className="rm-sq-row" style={{display:"flex",gap:5,marginBottom:6,alignItems:"center",flexWrap:"wrap"}}>
                  <button className={`pa-pill${filter.race==="All"?" active":""}`} onClick={()=>setFilter(f=>({...f,race:"All"}))}>
                    All<span className="ct">{heroes.length}</span>
                  </button>
                  {chipRaces.map(r=>(
                    <button key={r} className={`pa-pill${filter.race===r?" active":""}`} title={r} onClick={()=>setFilter(f=>({...f,race:r}))}>
                      <HeroAvatar race={r} size={13}/>{r}<span className="ct">{counts[r]}</span>
                    </button>
                  ))}
                  {otherRaces.length>0&&(
                    <span className={`pa-pill${otherActive?" active":""}`} style={{position:"relative"}}>
                      {otherActive?filter.race:"Other"}<span className="ct">{otherActive?"":otherCount}</span>{" ▾"}
                      <select value={otherActive?filter.race:""} onChange={e=>{ if(e.target.value) setFilter(f=>({...f,race:e.target.value})); }}
                        aria-label="Filter by other race"
                        style={{position:"absolute",inset:0,opacity:0,cursor:"pointer",width:"100%"}}>
                        <option value="" disabled>Other races</option>
                        {otherRaces.map(r=><option key={r} value={r}>{`${r} (${counts[r]})`}</option>)}
                      </select>
                    </span>
                  )}
                </div>
              );
            })()}

            {/* Row 3 — sort chip + badged More-filters disclosure + shown count.
                The badge is the guarantee that nothing filters the roster
                invisibly while the panel is collapsed. */}
            {(()=>{
              const hiddenActive = (filter.search.trim()?1:0)+(filter.role!=="All"?1:0)+(filter.phase!=="All"?1:0)+(filter.status!=="All"?1:0);
              return(
                <>
                  <div className="rm-sq-row" style={{display:"flex",gap:5,marginBottom:moreFiltersOpen?6:14,alignItems:"center"}}>
                    <span className="pa-pill" style={{position:"relative"}}>
                      {`Sort: ${filter.sortBy}`}{" ▾"}
                      <select value={filter.sortBy} onChange={e=>setFilter(f=>({...f,sortBy:e.target.value}))}
                        aria-label="Sort heroes by"
                        style={{position:"absolute",inset:0,opacity:0,cursor:"pointer",width:"100%"}}>
                        {["Value","Level","XP","Stage","Morale","Contract","Combat","Fatigue","Salary",...(showHiddenStats?["Potential"]:[])].map(s=><option key={s} value={s}>{s}</option>)}
                      </select>
                    </span>
                    <button className={`pa-pill${hiddenActive>0?" active":""}`} onClick={()=>setMoreFiltersOpen(o=>!o)}>
                      {`More${hiddenActive>0?` (${hiddenActive})`:""} ${moreFiltersOpen?"▴":"▾"}`}
                    </button>
                    <span className="pa-kicker" style={{marginLeft:"auto",flexShrink:0,letterSpacing:1.5}}>{filtered.length} shown</span>
                  </div>
                  {moreFiltersOpen&&(
                    <div style={{marginBottom:14,padding:"10px 12px",borderRadius:3,background:"rgba(138,109,59,0.07)",border:"1px solid rgba(138,109,59,0.3)"}}>
                      <input placeholder="Search name/trait…" value={filter.search} onChange={e=>setFilter(f=>({...f,search:e.target.value}))}
                        style={{...IS,width:"100%",boxSizing:"border-box",marginBottom:7}}/>
                      <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
                        <select value={filter.role} onChange={e=>setFilter(f=>({...f,role:e.target.value}))} style={{...IS,flex:1,minWidth:90}}><option value="All">All Roles</option>{ROLES.map(r=><option key={r} value={r}>{r}</option>)}</select>
                        <select value={filter.phase} onChange={e=>setFilter(f=>({...f,phase:e.target.value}))} style={{...IS,flex:1,minWidth:90}}><option value="All">All Stages</option>{["prospect","rising","peak","fading","veteran"].map(p=><option key={p} value={p}>{agePhaseLabel(p)}</option>)}</select>
                        <select value={filter.status} onChange={e=>setFilter(f=>({...f,status:e.target.value}))} style={{...IS,flex:1,minWidth:90}}><option value="All">All Statuses</option>{["Fit","Injured","Away","Unhappy","Renewing"].map(v=><option key={v} value={v}>{v}</option>)}</select>
                      </div>
                      <button onClick={()=>setFilter(f=>({...f,position:"All",race:"All",search:"",role:"All",phase:"All",status:"All"}))}
                        style={{background:"none",border:"none",cursor:"pointer",color:"#7E2D26",fontSize:11,padding:0,textDecoration:"underline",fontFamily:"'Alegreya Sans',sans-serif"}}>
                        Clear all filters
                      </button>
                    </div>
                  )}
                </>
              );
            })()}

            <div className="pa-grid">
              {filtered.map(h=><HeroCard key={h.id} hero={h} selected={detailHero?.id===h.id} isListed={listedHeroIds.has(h.id)} hasBid={transferBids.some(b=>b.heroId===h.id)} isLeader={squadLeaderId===h.id} showHiddenStats={showHiddenStats} retrainCandidate={buildings.some(b=>b.id==="trainyard"&&b.built)&&!h.retraining&&bestPositionFor(h)!==naturalLaneFor(h.role)} onClick={()=>{setDetailHero(h);setPrevStats(null);}}/>)}
            </div>
          </div>
        )}

        {/* TACTICS */}
        {tab==="Tactics"&&<TacticsTab heroes={heroes} formation={formation} setFormation={setFormation} formationPresets={formationPresets} onSavePreset={savePreset} onLoadPreset={loadPreset} onClearPreset={clearPreset} squadLeaderId={squadLeaderId}/>}

        {/* DOMINION */}
        {tab==="Dominion"&&<DominionTab season={season} seasonWeek={seasonWeek} trophies={trophies} weeklyIncome={weeklyRankIncome(playerTier, currentTierPosition)} playerTier={playerTier} tierPosition={currentTierPosition} tierEnemyTowns={tierEnemyTowns} townName={townName} townColor={townColor} formRating={formRating} leagueTable={leagueTable} playerRecord={playerRecord} matchLog={matchLog} hallOfFame={hallOfFame} chronicleEntries={chronicleEntries}/>}

        {/* BATTLE */}
        {tab==="Battle"&&(
          <div className="rm-two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>

            {/* ── THE CHALLENGE BANNER ───────────────────────────────────── */}
            {pendingChallenge&&(
              <div style={{gridColumn:"1/-1",marginBottom:4,padding:"14px 16px",borderRadius:3,
                background:"rgba(154,91,43,0.105)",border:"1px solid rgba(154,91,43,0.525)",
                display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:900,fontSize:13,color:"#9A5B2B",marginBottom:2}}>
                    A Formal Challenge
                  </div>
                  <div style={{fontSize:11,color:"#4A4335",lineHeight:1.5}}>
                    A rival lord demands satisfaction. Accept and face a stronger opponent — but the gold and XP on offer are double. Decline and your squad's nerve will be tested.
                  </div>
                  <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap",fontSize:10}}>
                    <span style={{color:"#7E2D26"}}>Opponent +{Math.round((pendingChallenge.opponentPowerMult-1)*100)}% stronger</span>
                    <span style={{color:"#40614F"}}>Rewards ×{pendingChallenge.rewardMult}</span>
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  <button onClick={startBattle}
                    style={{padding:"8px 16px",borderRadius:3,border:"none",cursor:"pointer",
                      background:"#9A5B2B",color:"#F0E8D5",
                      fontFamily:"'Alegreya Sans',sans-serif",fontWeight:900,fontSize:11,whiteSpace:"nowrap"}}>
                    Accept
                  </button>
                  <button onClick={declineChallenge}
                    style={{padding:"8px 16px",borderRadius:3,border:"1px solid rgba(60,52,38,0.264)",
                      cursor:"pointer",background:"rgba(60,52,38,0.054)",color:"#6E6350",
                      fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:11,whiteSpace:"nowrap"}}>
                    Decline
                  </button>
                </div>
              </div>
            )}

            {/* LEFT: Visual formation preview */}
            <div>
              <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:13,color:"#5F4B66",marginBottom:10,fontWeight:700}}>Your Formation</div>
              {placed===0&&<div style={{padding:12,background:"rgba(126,45,38,0.105)",borderRadius:3,border:"1px solid rgba(126,45,38,0.3)",fontSize:12,color:"#7E2D26",marginBottom:10}}>No heroes assigned. Set formation in <strong>Tactics</strong> first.</div>}

              {/* 3-lane visual */}
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:10}}>
                {POS_KEYS.map(pos=>{
                  const pd=POSITIONS[pos];
                  const assigned=(formation[pos]||[]).filter(Boolean);
                  // Specialisation check for this position
                  const spec=scheduledOpponent?.specialisation;
                  const specPen=spec?calcSpecPenalty(spec,formation):null;
                  const posWarning=specPen&&spec.counter===pos;
                  return(
                    <div key={pos} style={{borderRadius:3,overflow:"hidden",border:`1px solid ${posWarning?"rgba(154,91,43,0.55)":pd.color+"33"}`,background:posWarning?"rgba(154,91,43,0.06)":"rgba(60,52,38,0.036)"}}>
                      {/* Position header */}
                      {(()=>{
                        const ps = calcPositionScore(assigned, pos);
                        const hasPairing = ps.pairingMult > 1.0;
                        const hasBonus = ps.pairingMult > 1.0;
                        const pwrCol = ps.score>=60?"#40614F":ps.score>=35?"#3C5A78":ps.score>0?"#8A6D3B":"#8A7F68";
                        return(
                          <div style={{padding:"6px 10px",background:`${pd.color}14`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                            <span style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:11,color:pd.color}}>{pd.icon} {pd.label}</span>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              {ps.primaryHero&&<span style={{fontSize:8,color:"#40614F"}}>▲{ps.primaryHero.name.split(" ")[0]}</span>}
                              {ps.supportHero&&<span style={{fontSize:8,color:"#6E6350"}}>▼{ps.supportHero.name.split(" ")[0]}</span>}
                              {assigned.length>0&&<span style={{fontSize:10,fontWeight:700,color:pwrCol}}>PWR {Math.round(ps.score)}{hasBonus?" ":hasPairing?" ✗":""}</span>}
                              {posWarning&&<span style={{fontSize:9,color:"#9A5B2B"}}>Spec</span>}
                              {!posWarning&&spec&&<span style={{fontSize:9,color:"#40614F"}}>✓</span>}
                            </div>
                          </div>
                        );
                      })()}
                      {/* Hero chips */}
                      <div style={{padding:"6px 8px",display:"flex",gap:6,flexWrap:"wrap"}}>
                        {assigned.length===0?(
                          <div style={{fontSize:10,color:"#6E6350",padding:"4px 0"}}>Empty slot</div>
                        ):assigned.map(h=>{
                          const fit=formAnalysis.heroMods[h.id];
                          const fitCol=fit?.fit==="ideal"?"#40614F":"#6E6350";
                          const pwr=Math.round(calcHeroCombatScore(h,pos));
                          const {color:fatCol}=fatigueLabel(h.fatigue||0);
                          const pwrCol=pwr>=40?"#40614F":pwr>=25?"#3C5A78":"#8A6D3B";
                          return(
                            <div key={h.id} style={{flex:1,minWidth:0,padding:"7px 9px",borderRadius:3,background:"rgba(30,24,14,0.105)",border:`1px solid ${fitCol}33`}}>
                              <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
                                <HeroAvatar race={h.race} size={15}/>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontSize:11,fontWeight:700,fontFamily:"'Alegreya Sans',sans-serif",color:"#23201A",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.name}</div>
                                  <div style={{fontSize:9,color:"#6E6350"}}>{h.role} · Lv {h.level}</div>
                                </div>
                              </div>
                              <div style={{display:"flex",gap:4}}>
                                <div style={{flex:1,background:"rgba(60,52,38,0.072)",borderRadius:4,padding:"3px 0",textAlign:"center"}}>
                                  <div style={{fontSize:8,color:"#6E6350"}}>PWR</div>
                                  <div style={{fontSize:13,fontWeight:900,color:pwrCol,lineHeight:1}}>{pwr}</div>
                                </div>
                                <div style={{flex:1,background:"rgba(60,52,38,0.072)",borderRadius:4,padding:"3px 0",textAlign:"center"}}>
                                  <div style={{fontSize:8,color:"#6E6350"}}>FAT</div>
                                  <div style={{fontSize:13,fontWeight:900,color:fatCol,lineHeight:1}}>{h.fatigue||0}</div>
                                </div>
                                <div style={{flex:1,background:"rgba(60,52,38,0.072)",borderRadius:4,padding:"3px 0",textAlign:"center"}}>
                                  <div style={{fontSize:8,color:fitCol}}>FIT</div>
                                  <div style={{fontSize:9,fontWeight:700,color:fitCol,lineHeight:1.2}}>{fit?.fit==="ideal"?"✓":"—"}</div>
                                </div>
                              </div>
                              {h.injured&&<div style={{fontSize:8,color:"#7E2D26",marginTop:3}}>Injured</div>}
                              {(h.fatigue||0)>=FATIGUE_WARN&&<div style={{fontSize:8,color:fatCol,marginTop:3}}>{fatigueLabel(h.fatigue||0).label}</div>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Formation effects */}
              {formAnalysis.active.length>0&&(
                <div style={{padding:"9px 12px",background:"rgba(60,52,38,0.036)",borderRadius:3,border:"1px solid rgba(60,52,38,0.108)"}}>
                  <div style={{fontSize:10,fontWeight:700,color:"#23201A",marginBottom:4,fontFamily:"'Alegreya Sans',sans-serif"}}>Active Synergies</div>
                  {formAnalysis.active.map(s=><div key={s.id} style={{fontSize:10,color:s.negative?"#7E2D26":"#40614F",marginBottom:2}}>{s.icon} {s.name} ×{s.ratingMult}</div>)}
                  <div style={{marginTop:5,fontSize:12,fontWeight:700,color:"#3C5A78"}}>Formation Rating: {formRating}</div>
                </div>
              )}
              {formAnalysis.active.length===0&&placed>0&&(
                <div style={{padding:"9px 12px",background:"rgba(60,52,38,0.036)",borderRadius:3,border:"1px solid rgba(60,52,38,0.108)"}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#3C5A78"}}>Formation Rating: {formRating}</div>
                  <div style={{fontSize:10,color:"#6E6350",marginTop:2}}>No synergies active</div>
                </div>
              )}

              {/* Squad Leader status — the bonuses are invisible in combat, so
                  state them here where the battle decision is made */}
              {(()=>{
                const leaderHero = squadLeaderId!=null ? heroes.find(h=>h.id===squadLeaderId&&!h.retired) : null;
                if(!leaderHero) return null;
                const fieldedIds = new Set(POS_KEYS.flatMap(p=>(formation[p]||[]).filter(Boolean).map(h=>h.id)));
                const lb = calcLeaderBonuses(leaderHero);
                const fielded = fieldedIds.has(leaderHero.id);
                return fielded ? (
                  <div style={{marginTop:8,padding:"8px 12px",borderRadius:3,background:"rgba(138,109,59,0.075)",border:"1px solid rgba(138,109,59,0.33)",display:"flex",alignItems:"center",gap:8,fontSize:10,color:"#77653F"}}>
                    <Glyph id="leader" size={13} color="#8A6D3B"/>
                    <span><b style={{color:"#8A6D3B"}}>{leaderHero.name}</b> leads — +{lb.moralePerWeek} morale/wk to raiders · ×{lb.xpMult.toFixed(2)} XP · −{lb.defeatMoralePct}% morale loss on defeat</span>
                  </div>
                ) : (
                  <div style={{marginTop:8,padding:"8px 12px",borderRadius:3,background:"rgba(154,91,43,0.09)",border:"1px solid rgba(154,91,43,0.36)",display:"flex",alignItems:"center",gap:8,fontSize:10,color:"#9A5B2B"}}>
                    <Glyph id="leader" size={13} color="#9A5B2B"/>
                    <span><b>{leaderHero.name}</b> (Squad Leader) is not fielded — leader bonuses inactive this battle.</span>
                  </div>
                );
              })()}
            </div>

            {/* RIGHT: This week's scheduled opponent */}
            <div>
              {/* Active event banner — unopened correspondence */}
              {activeEvent&&(()=>{
                const th = EVENT_THEMES[activeEvent.theme];
                const ink = th?.ink||"#8A6D3B";
                return(
                <div style={{padding:"12px 14px",borderRadius:3,background:`${ink}0c`,border:`1px solid ${ink}55`,marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:4}}>
                    {th&&(
                      <div style={{width:26,height:26,borderRadius:"50%",background:ink,color:"#E9E1CE",
                        display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                        fontFamily:"'Alegreya Sans',sans-serif",fontSize:13,transform:"rotate(-8deg)",opacity:0.9}}>
                        {th.seal}
                      </div>
                    )}
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:12,color:ink}}>A Letter Awaits Reply</div>
                      <div style={{fontSize:11,color:"#23201A"}}>{activeEvent.title}{th?` — ${th.sender}`:""}</div>
                    </div>
                    <div style={{fontSize:10,color:"#40614F",fontWeight:700}}>{activeEvent.rewardDesc}</div>
                  </div>
                  <div style={{fontSize:10,color:"#6E6350"}}>Tests: {(activeEvent.stats||[]).join(" + ")} · {activeEvent.heroesNeeded} hero{activeEvent.heroesNeeded>1?"es":""}</div>
                  <div style={{marginTop:8,padding:"6px 10px",borderRadius:3,background:`${ink}14`,border:`1px solid ${ink}30`,fontSize:10,color:ink,textAlign:"center",fontWeight:700}}>
                    ↑ The letter is open above this screen
                  </div>
                </div>
                );
              })()}

              <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:13,color:legendaryChallenger?"#7E2D26":"#9A5B2B",marginBottom:10,fontWeight:700}}>
                {legendaryChallenger?"Legendary Challenge":"This Week's Opponent"}
              </div>

              {/* Legendary challenger banner */}
              {legendaryChallenger&&(
                <div style={{padding:"12px 14px",borderRadius:3,background:"rgba(143,42,30,0.105)",border:"1px solid rgba(126,45,38,0.525)",marginBottom:10}}>
                  <div style={{marginBottom:6}}>
                    <div style={{fontFamily:"'IM Fell English SC',serif",fontWeight:900,fontSize:15,color:"#7E2D26"}}>{legendaryChallenger.name}</div>
                    <div style={{fontSize:10,color:"#6E6350"}}>Power {legendaryChallenger.power} · {"★".repeat(6)} · Legendary</div>
                  </div>
                  <div style={{fontSize:10,color:"#6E6350",fontStyle:"italic",marginBottom:8}}>"{legendaryChallenger.flavour}"</div>
                  <div style={{display:"flex",gap:8}}>
                    <div style={{flex:1,padding:"6px 8px",borderRadius:3,background:"rgba(138,109,59,0.09)",border:"1px solid rgba(138,109,59,0.225)",textAlign:"center"}}>
                      <div style={{fontSize:9,color:"#6E6350"}}>Win reward</div>
                      <div style={{fontSize:13,fontWeight:700,color:"#8A6D3B"}}>{legendaryChallenger.goldReward?.toLocaleString()}g</div>
                    </div>
                    <div style={{flex:1,padding:"6px 8px",borderRadius:3,background:"rgba(126,45,38,0.09)",border:"1px solid rgba(126,45,38,0.225)",textAlign:"center"}}>
                      <div style={{fontSize:9,color:"#6E6350"}}>Rank impact</div>
                      <div style={{fontSize:11,fontWeight:700,color:"#40614F"}}>Exhibition</div>
                    </div>
                  </div>
                </div>
              )}

              {scheduledOpponent?(()=>{
                const opp=scheduledOpponent;
                // Scouting fog: until a scout reports, you know the rumor mill's
                // power band, the manager, and the stars — not the numbers.
                const fogged = scoutingFog && !opp.scouted;
                const fogBand = opp.powerBand ?? [Math.max(10,opp.power-12), opp.power+12];
                const hasObservatory = buildings.find(b=>b.id==="scouts"&&b.built);
                const scoutCost = hasObservatory ? 0 : 30*(TIERS[playerTier]?.difficulty||1)+20;
                const spec=opp.specialisation;
                const pen=calcSpecPenalty(spec,formation);
                const penCol=pen?"#9A5B2B":"#40614F";
                const adjPower = pen
                  ? Math.round(opp.power*(1+pen.penalty))
                  : Math.round(opp.power);
                const posShare = adjPower/3;
                const k=2.0;
                const PCAP=0.85, PFLOOR=0.15;
                const posChances={};
                const posScoresPreview={};
                POS_KEYS.forEach(pos=>{
                  const posHeroes=(formation[pos]||[]).filter(Boolean);
                  const ps = calcPositionScore(posHeroes, pos);
                  posScoresPreview[pos] = ps;
                  const previewLaneMult = formAnalysis.laneMults?.[pos] ?? Math.min(1.5, Math.max(0.3, formAnalysis.mult));
                  const effectiveScore = ps.score * previewLaneMult;
                  const ratio=effectiveScore>0?posShare/effectiveScore:999;
                  const raw=1/(1+Math.pow(ratio,k));
                  const posHeroesHere=(formation[pos]||[]).filter(Boolean);
                  posChances[pos]=Math.min(PCAP,Math.max(PFLOOR,posHeroesHere.length>0?raw:PFLOOR));
                });
                const pa=posChances.Vanguard,pb=posChances.Skirmisher,pc=posChances.Arbiter;
                const overallWC=pa*pb*pc+pa*pb*(1-pc)+pa*(1-pb)*pc+(1-pa)*pb*pc;
                const wcCol=overallWC>=0.6?"#40614F":overallWC>=0.45?"#8A6D3B":overallWC>=0.25?"#9A5B2B":"#7E2D26";
                const oppStars = calcRelativeStars(opp.power, playerTier);
                const oppStarCol = starsColor(oppStars);
                return(
                  <>
                    {/* Opponent card */}
                    <div style={{padding:"14px 16px",background:"rgba(154,91,43,0.09)",borderRadius:3,border:"1px solid rgba(154,91,43,0.375)",marginBottom:12}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                        <span style={{fontSize:28}}>{spec?.icon||""}</span>
                        <div style={{flex:1}}>
                          <div style={{fontFamily:"'IM Fell English SC',serif",fontWeight:900,fontSize:16,color:"#23201A"}}>{opp.name}</div>
                          <div style={{fontSize:10,color:oppStarCol}}>{renderStars(oppStars)}
                            <span style={{color:"#6E6350",marginLeft:6}}>{fogged?`Power ~${fogBand[0]}–${fogBand[1]}`:`Power ${opp.power}`}</span>
                          </div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:22,fontWeight:900,color:fogged?"#6E6350":wcCol}}>{fogged?"?":`${Math.round(overallWC*100)}%`}</div>
                          <div style={{fontSize:9,color:"#6E6350"}}>overall win</div>
                        </div>
                      </div>

                      {/* Rival manager + grudge book */}
                      {opp.manager&&(()=>{
                        const h2h=opp.h2h||{wins:0,losses:0};
                        const played=h2h.wins+h2h.losses;
                        const isGrudge=h2h.losses-h2h.wins>=2;
                        const taunt=managerTaunt(opp.manager,h2h);
                        return(
                          <div style={{padding:"8px 10px",borderRadius:3,background:isGrudge?"rgba(126,45,38,0.09)":"rgba(60,52,38,0.054)",border:`1px solid ${isGrudge?"rgba(126,45,38,0.375)":"rgba(60,52,38,0.126)"}`,marginBottom:10}}>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <span style={{fontSize:10,fontWeight:700,color:"#23201A"}}>{opp.manager.name}</span>
                              <span style={{fontSize:9,color:"#6E6350",fontStyle:"italic"}}>{opp.manager.title}</span>
                              {isGrudge&&<span style={{fontSize:8,fontWeight:700,color:"#7E2D26",background:"rgba(126,45,38,0.18)",padding:"1px 6px",borderRadius:3}}>GRUDGE MATCH</span>}
                              <span style={{marginLeft:"auto",fontSize:9,color:played>0?(h2h.wins>=h2h.losses?"#40614F":"#9A5B2B"):"#6E6350"}}>
                                {played>0?`H2H ${h2h.wins}W–${h2h.losses}L`:"first meeting"}
                              </span>
                            </div>
                            {taunt&&<div style={{fontSize:9,color:"#6E6350",fontStyle:"italic",marginTop:3}}>“{taunt}”</div>}
                          </div>
                        );
                      })()}

                      {/* Per-phase win chances + position power */}
                      <div style={{display:"flex",gap:5,marginBottom:10}}>
                        {[
                          {pos:"Vanguard",   icon:"",label:"VAN"},
                          {pos:"Skirmisher", icon:"",label:"SKR"},
                          {pos:"Arbiter",    icon:"",label:"ARB"},
                        ].map(({pos,icon,label})=>{
                          const p=posChances[pos];
                          const ps=posScoresPreview[pos];
                          const col=p>=0.65?"#40614F":p>=0.45?"#8A6D3B":p>=0.30?"#9A5B2B":"#7E2D26";
                          const hasPairing = ps.pairingMult > 1.0;
                          const hasBonus = ps.pairingMult > 1.0;
                          return(
                            <div key={pos} style={{flex:1,padding:"6px 4px",borderRadius:3,background:"rgba(60,52,38,0.054)",border:`1px solid ${fogged?"rgba(60,52,38,0.22)":col+"33"}`,textAlign:"center"}}>
                              <div style={{fontSize:10}}><PositionIcon position={pos} size={11}/>{!fogged&&(hasBonus?" ":hasPairing?" ✗":"")}</div>
                              <div style={{fontSize:9,color:"#6E6350"}}>{label}</div>
                              <div style={{fontSize:12,fontWeight:700,color:fogged?"#6E6350":col}}>{fogged?"?":`${Math.round(p*100)}%`}</div>
                              {ps.primaryHero&&<div style={{fontSize:7,color:"#40614F",marginTop:2}}>▲ {ps.primaryHero.name.split(" ")[0]}</div>}
                              {ps.supportHero&&<div style={{fontSize:7,color:"#6E6350",marginTop:0}}>▼ {ps.supportHero.name.split(" ")[0]}</div>}
                            </div>
                          );
                        })}
                      </div>
                      <div style={{fontSize:9,color:"#6E6350",textAlign:"center",marginBottom:10}}>Win 2 of 3 phases to win the battle</div>

                      {/* Scouting fog — the unknown, and the way to know it */}
                      {fogged&&(
                        <div style={{padding:"10px 12px",borderRadius:3,background:"rgba(60,90,120,0.075)",border:"1px dashed rgba(60,90,120,0.375)",marginBottom:8}}>
                          <div style={{fontSize:10,fontWeight:700,color:"#3C5A78",marginBottom:3}}>Doctrine unknown</div>
                          <div style={{fontSize:9,color:"#6E6350",lineHeight:1.5,marginBottom:8}}>
                            Their formation style and battle abilities are hidden. A scout report reveals exact power, win odds, specialisation and abilities.
                          </div>
                          <button onClick={()=>{
                              if(scoutCost>0){ if(gold<scoutCost) return; setGold(g=>g-scoutCost); }
                              setScheduledOpponent(o=>o?{...o,scouted:true}:o);
                              addLog(`Scout report on ${opp.name}${scoutCost>0?` (−${scoutCost}g)`:" — the Observatory sees all"}.`,"info");
                            }}
                            disabled={scoutCost>0&&gold<scoutCost}
                            style={{width:"100%",padding:"8px 0",borderRadius:3,border:"1px solid rgba(60,90,120,0.525)",
                              cursor:(scoutCost>0&&gold<scoutCost)?"not-allowed":"pointer",
                              background:(scoutCost>0&&gold<scoutCost)?"rgba(60,52,38,0.054)":"rgba(60,90,120,0.18)",
                              color:(scoutCost>0&&gold<scoutCost)?"#8A7F68":"#3C5A78",fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:11}}>
                            {scoutCost===0?"Observatory Report — Free":`Send Scout — ${scoutCost}g`}
                          </button>
                        </div>
                      )}

                      {/* Specialisation */}
                      {!fogged&&spec&&(()=>{
                        const penCol=pen?"#9A5B2B":"#40614F";
                        return(
                          <div style={{padding:"8px 10px",background:"rgba(60,52,38,0.072)",borderRadius:3,border:`1px solid ${penCol}33`,marginBottom:8}}>
                            <div style={{fontSize:10,fontWeight:700,color:penCol,marginBottom:3}}>{spec.icon} {spec.label}</div>
                            <div style={{fontSize:10,color:"#6E6350",lineHeight:1.5,marginBottom:5}}>{spec.desc}</div>
                            {pen?(
                              <div style={{padding:"5px 8px",borderRadius:3,background:"rgba(126,45,38,0.12)",border:"1px solid rgba(126,45,38,0.3)"}}>
                                <div style={{fontSize:10,color:"#9A5B2B",fontWeight:700}}>Not countered — Enemy power +{Math.round(pen.penalty*100)}%</div>
                                <div style={{fontSize:9,color:"#6E6350",marginTop:2}}>{pen.reason}</div>
                                <div style={{fontSize:9,color:"#3C5A78",marginTop:2}}>Fix: {spec.counter}</div>
                              </div>
                            ):(
                              <div style={{padding:"5px 8px",borderRadius:3,background:"rgba(64,97,79,0.105)",border:"1px solid rgba(64,97,79,0.3)"}}>
                                <div style={{fontSize:10,color:"#40614F",fontWeight:700}}>✓ Countered — No power penalty</div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Enemy abilities */}
                      {!fogged&&(opp.abilities||[]).length>0&&(
                        <div style={{marginBottom:8}}>
                          {(opp.abilities||[]).map(ability=>{
                            const tierId = opp.tierId||playerTier;
                            const t = ability.thresholds[tierId]||ability.thresholds.bronze;
                            const posHeroes = (pos) => (formation[pos]||[]).filter(Boolean);
                            const scopeHeroes =
                              ability.scope==='vanguard'   ? posHeroes('Vanguard') :
                              ability.scope==='skirmisher' ? posHeroes('Skirmisher') :
                              ability.scope==='arbiter'    ? posHeroes('Arbiter') :
                              [...posHeroes('Vanguard'),...posHeroes('Skirmisher'),...posHeroes('Arbiter')];
                            const avg = scopeHeroes.length
                              ? Math.round(scopeHeroes.reduce((s,h)=>s+(h.stats[ability.stat]||0),0)/scopeHeroes.length)
                              : 0;
                            const outcome = avg>=t.pass?'pass':avg>=t.soft?'soft':'hard';
                            const outcomeCol = outcome==='pass'?'#40614F':outcome==='soft'?'#9A5B2B':'#7E2D26';
                            const outcomeLabel = outcome==='pass'?'✓ Mitigated':outcome==='soft'?'Partial':'✗ Full effect';
                            const effectText = outcome==='pass'?'No effect.':outcome==='soft'?ability.softDesc():ability.hardDesc();
                            return(
                              <div key={ability.id} style={{padding:"8px 10px",background:"rgba(60,52,38,0.054)",borderRadius:3,border:`1px solid ${outcomeCol}33`,marginBottom:6}}>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                                  <span style={{fontSize:10,fontWeight:700,color:"#23201A"}}>{ability.name}</span>
                                  <span style={{fontSize:9,fontWeight:700,color:outcomeCol}}>{outcomeLabel}</span>
                                </div>
                                <div style={{fontSize:9,color:"#6E6350",marginBottom:4}}>{ability.desc}</div>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                  <div style={{fontSize:9,color:"#6E6350"}}>
                                    Checks <b style={{color:"#3C5A78"}}>{ability.stat}</b>
                                    {' '}({ability.scope==='squad'?'squad avg':ability.scope+' avg'})
                                    {' — '}your avg: <b style={{color:outcomeCol}}>{avg}</b>
                                    {' / '}pass: <b style={{color:"#40614F"}}>{t.pass}</b>
                                  </div>
                                </div>
                                {outcome!=='pass'&&(
                                  <div style={{marginTop:4,padding:"4px 6px",borderRadius:3,background:`${outcomeCol}10`,border:`1px solid ${outcomeCol}33`}}>
                                    <div style={{fontSize:9,color:outcomeCol}}>{effectText}</div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Rewards */}
                      <div style={{display:"flex",gap:8}}>
                        <div style={{flex:1,background:"rgba(138,109,59,0.09)",borderRadius:3,padding:"6px 8px",border:"1px solid rgba(138,109,59,0.18)"}}>
                          <div style={{fontSize:9,color:"#6E6350"}}>Win reward</div>
                          <div style={{fontSize:13,fontWeight:700,color:"#8A6D3B"}}>~{opp.goldReward?.toLocaleString()||"?"}g</div>
                        </div>

                      </div>
                    </div>

                    {/* Formation vs opponent summary */}
                    {(()=>{
                      const pen=calcSpecPenalty(spec,formation);
                      const adjPow=pen?Math.round(opp.power*(1+pen.penalty)):opp.power;
                      // Use the already-computed per-phase overall win chance — consistent with the phase display above
                      const wcAdjCol=overallWC>=0.6?"#40614F":overallWC>=0.45?"#8A6D3B":overallWC>=0.25?"#9A5B2B":"#7E2D26";
                      return(
                        <div style={{padding:10,background:"rgba(95,75,102,0.075)",borderRadius:3,border:"1px solid rgba(95,75,102,0.15)",marginBottom:10}}>
                          <div style={{fontSize:11,color:"#5F4B66",marginBottom:4}}>Match Preview</div>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div style={{fontSize:11,color:"#6E6350"}}>
                              {fogged
                                ? <span>Enemy power <b style={{color:"#6E6350"}}>~{fogBand[0]}–{fogBand[1]}</b><span style={{fontSize:9,color:"#6E6350"}}> (unscouted)</span></span>
                                : pen
                                ? <span>Enemy power <b style={{color:"#9A5B2B"}}>{adjPow}</b><span style={{fontSize:9,color:"#6E6350"}}> (base {opp.power} +{Math.round(pen.penalty*100)}% spec)</span></span>
                                : <span>Enemy power <b style={{color:penCol}}>{opp.power}</b></span>
                              }
                            </div>
                            <div style={{fontSize:15,fontWeight:700,color:fogged?"#6E6350":wcAdjCol}}>{fogged?"? win":`${Math.round(overallWC*100)}% win`}</div>
                          </div>
                          {formAnalysis.positive.length>0&&<div style={{fontSize:10,color:"#40614F",marginTop:2}}>✓ {formAnalysis.positive.map(s=>s.name).join(", ")}</div>}
                          {formAnalysis.negative.length>0&&<div style={{fontSize:10,color:"#7E2D26",marginTop:2}}>{formAnalysis.negative.map(s=>s.name).join(", ")}</div>}
                          {formAnalysis.raceSynergy&&<div style={{fontSize:10,marginTop:2}}><span style={{color:formAnalysis.raceSynergy.color}}>{formAnalysis.raceSynergy.icon} {formAnalysis.raceSynergy.name}</span><span style={{color:"#6E6350"}}> ×{formAnalysis.raceSynergy.ratingMult}</span></div>}
                          <div style={{fontSize:10,color:"#6E6350",marginTop:2}}>Wages due: {wages}g · Tribute: +{weeklyRankIncome(playerTier, currentTierPosition)}g</div>
                        </div>
                      );
                    })()}

                    {(()=>{
                      const placedCount=POS_KEYS.reduce((a,p)=>(formation[p]||[]).filter(Boolean).length+a,0);
                      const battleReady=placedCount>=3;
                      return(<>
                        <button onClick={startBattle} disabled={!battleReady}
                          title={battleReady?undefined:"Set at least 3 heroes in Tactics first"}
                          style={{width:"100%",padding:"13px 0",borderRadius:3,border:"none",
                            cursor:battleReady?"pointer":"not-allowed",
                            background:battleReady?"#9A5B2B":"#DCCFAF",
                            color:battleReady?"#F0E8D5":"#C9BA98",
                            fontFamily:"'IM Fell English SC',serif",fontWeight:900,fontSize:14,
                            opacity:battleReady?1:0.75}}>GO TO BATTLE</button>
                        {!battleReady&&<div style={{fontSize:10,color:"#9A5B2B",marginTop:6,textAlign:"center"}}>Assign at least 3 heroes in Tactics to fight</div>}
                      </>);
                    })()}

                    {missionResult&&(
                      <div style={{marginTop:10,padding:"8px 12px",background:"rgba(60,52,38,0.036)",borderRadius:3,border:"1px solid rgba(60,52,38,0.108)",fontSize:10,color:"#6E6350"}}>
                        <span style={{color:missionResult.won?"#40614F":"#7E2D26",fontWeight:700,marginRight:8}}>{missionResult.won?"Last battle: Victory":"Last battle: Defeat"}</span>
                        {missionResult.goldSwing>=0?"+":""}{missionResult.goldSwing.toLocaleString()}g · +{missionResult.heroXP} XP{levelUps.length>0&&` · ${levelUps.length} level-up(s)`}
                      </div>
                    )}
                  </>
                );
              })():(
                <div style={{fontSize:12,color:"#6E6350",padding:14}}>Loading this week's opponent…</div>
              )}
            </div>
          </div>
        )}

        {/* TOWN */}
        {tab==="Town"&&(()=>{
          const tierIdx = TIER_ORDER.indexOf(playerTier);
          const nextTierId = tierIdx < TIER_ORDER.length-1 ? TIER_ORDER[tierIdx+1] : null;
          const nextTierData = nextTierId ? TIERS[nextTierId] : null;
          const currentTierBuildings = BUILDINGS.filter(b=>b.tierRequired===playerTier);
          return(
          <div>
            {/* League tier progress header */}
            <div style={{marginBottom:18,padding:"14px 16px",background:"rgba(60,52,38,0.036)",borderRadius:3,border:`1px solid ${currentTier.color}22`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div>
                  <div style={{fontFamily:"'IM Fell English SC',serif",fontWeight:900,fontSize:15,color:currentTier.color}}>{currentTier.icon} {currentTier.name} League</div>
                  <div style={{fontSize:10,color:"#6E6350",marginTop:2}}>Buildings unlock as you promote through tiers</div>
                </div>
                {nextTierData&&(
                  <div style={{textAlign:"right",padding:"6px 10px",background:"rgba(60,52,38,0.054)",borderRadius:3,border:"1px solid rgba(60,52,38,0.126)"}}>
                    <div style={{fontSize:9,color:"#6E6350",marginBottom:2}}>Promote to {nextTierData.icon} {nextTierData.name} to unlock</div>
                    <div style={{fontSize:10,color:nextTierData.color,fontWeight:700}}>
                      {BUILDINGS.filter(b=>b.tierRequired===nextTierId).map(b=>b.name).join(", ")||"Elite heroes"}
                    </div>
                  </div>
                )}
                {!nextTierData&&<div style={{fontSize:10,color:currentTier.color}}>All buildings unlocked</div>}
              </div>
              <div style={{display:"flex",gap:4,marginTop:8,flexWrap:"wrap"}}>
                {TIER_ORDER.map(tid=>{
                  const t=TIERS[tid];
                  const reached=TIER_ORDER.indexOf(tid)<=tierIdx;
                  return(
                    <div key={tid} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:3,
                      background:reached?`${t.color}18`:"rgba(60,52,38,0.036)",
                      border:`1px solid ${reached?t.color+"44":"rgba(60,52,38,0.108)"}`}}>
                      <span style={{fontSize:10}}>{t.icon}</span>
                      <span style={{fontSize:9,color:reached?t.color:"#6E6350",fontWeight:reached?700:400}}>{t.name}</span>
                      {reached&&<span style={{fontSize:8,color:t.color}}>✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Buildings grouped by tier */}
            <div style={{marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontFamily:"'IM Fell English SC',serif",fontSize:14,fontWeight:700,color:"#40614F"}}>Town Upgrades</div>
              <div style={{fontSize:11,color:"#6E6350"}}>Treasury: <b style={{color:"#8A6D3B"}}>{gold.toLocaleString()}g</b></div>
            </div>

            <div style={{fontSize:10,color:"#6E6350",marginBottom:10,fontFamily:"'Alegreya Sans',sans-serif"}}>
              Build slots per tier:{" "}
              {TIER_ORDER.filter(t=>TIER_ORDER.indexOf(t)<=tierIdx).map((t,i)=>(
                <span key={t}>
                  {i>0&&" · "}
                  <b style={{color:"#8A6D3B"}}>{TIERS[t]?.name||t}</b> {builtInTier(buildings,t)}/{TIER_BUILD_SLOTS[t]}
                </span>
              ))}
            </div>

            <div className="rm-card-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:9}}>
              {buildings.map(b=>{
                const bTierIdx = TIER_ORDER.indexOf(b.tierRequired||"iron");
                const unlocked = bTierIdx <= tierIdx;
                const canAfford = gold >= b.cost;
                const bTier = TIERS[b.tierRequired||"iron"];
                if(!unlocked){
                  // Clean locked layout — no overlay, no bleed-through text
                  return(
                    <div key={b.id} style={{
                      background:"rgba(60,52,38,0.03)",
                      border:"1px dashed rgba(60,52,38,0.126)",
                      borderRadius:3,padding:13,
                    }}>
                      <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:8,opacity:0.55}}>
                        <BuildingIcon id={b.id} size={22}/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:12,color:"#6E6350"}}>{b.name}</div>
                          <div style={{fontSize:10,color:"#7A6F58"}}>{b.cost.toLocaleString()}g · locked</div>
                        </div>
                      </div>
                      <div style={{
                        padding:"10px 12px",borderRadius:3,
                        background:"rgba(60,52,38,0.036)",border:"1px solid rgba(60,52,38,0.108)",
                        display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                      }}>
                        <span style={{fontSize:10,color:"#6E6350",fontFamily:"'Alegreya Sans',sans-serif",textAlign:"center"}}>
                          Promote to <TierIcon tier={b.tierRequired} size={11}/> <b style={{color:bTier?.color||"#4A4335"}}>{bTier?.name||"higher tier"}</b>
                        </span>
                      </div>
                    </div>
                  );
                }
                return(
                  <div key={b.id} style={{
                    background:b.built?"rgba(64,97,79,0.075)":"rgba(60,52,38,0.045)",
                    border:`1px solid ${b.built?"rgba(64,97,79,0.27)":"rgba(60,52,38,0.126)"}`,
                    borderRadius:3,padding:13,
                  }}>
                    <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:7}}>
                      <BuildingIcon id={b.id} size={24}/>
                      <div>
                        <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:12,color:b.built?"#40614F":"#23201A"}}>{b.name}</div>
                        <div style={{fontSize:10,color:b.built?"#40614F":"#8A6D3B"}}>{b.built?"Constructed":`${b.cost.toLocaleString()}g`}</div>
                      </div>
                    </div>
                    <div style={{fontSize:11,color:"#6E6350",marginBottom:9,lineHeight:1.5}}>{b.desc}</div>
                    {!b.built&&!buildingCapReached(buildings,b.tierRequired)&&(
                      <button onClick={()=>buildBuilding(b)} disabled={!canAfford}
                        style={{width:"100%",padding:"6px 0",borderRadius:3,border:"none",
                          cursor:canAfford?"pointer":"not-allowed",
                          background:canAfford?"#40614F":"#E4DAC2",
                          color:canAfford?"#F0E8D5":"#95896F",fontWeight:700,fontSize:11,fontFamily:"'Alegreya Sans',sans-serif"}}>
                        {canAfford?`Build for ${b.cost.toLocaleString()}g`:"Need More Gold"}
                      </button>
                    )}
                    {!b.built&&buildingCapReached(buildings,b.tierRequired)&&(
                      <div style={{width:"100%",padding:"6px 0",borderRadius:3,textAlign:"center",
                        background:"rgba(60,52,38,0.045)",border:"1px dashed rgba(60,52,38,0.2)",
                        color:"#8A7F68",fontWeight:700,fontSize:10,fontFamily:"'Alegreya Sans',sans-serif"}}>
                        Slot full — demolish to swap
                      </div>
                    )}
                    {b.built&&confirmDemolishId!==b.id&&(
                      <button onClick={()=>setConfirmDemolishId(b.id)}
                        style={{width:"100%",padding:"5px 0",borderRadius:3,border:"1px solid rgba(126,45,38,0.35)",
                          cursor:"pointer",background:"transparent",color:"#7E2D26",
                          fontWeight:700,fontSize:10,fontFamily:"'Alegreya Sans',sans-serif"}}>
                        Demolish
                      </button>
                    )}
                    {b.built&&confirmDemolishId===b.id&&(
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={()=>{demolishBuilding(b);setConfirmDemolishId(null);}}
                          style={{flex:1,padding:"5px 0",borderRadius:3,border:"none",cursor:"pointer",
                            background:"#7E2D26",color:"#F0E8D5",fontWeight:700,fontSize:10,fontFamily:"'Alegreya Sans',sans-serif"}}>
                          Confirm — no refund
                        </button>
                        <button onClick={()=>setConfirmDemolishId(null)}
                          style={{flex:1,padding:"5px 0",borderRadius:3,border:"1px solid rgba(60,52,38,0.22)",cursor:"pointer",
                            background:"rgba(60,52,38,0.054)",color:"#6E6350",fontWeight:700,fontSize:10,fontFamily:"'Alegreya Sans',sans-serif"}}>
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Elite market unlock status */}
            <div style={{marginTop:18,padding:"12px 14px",borderRadius:3,background:"rgba(60,52,38,0.036)",border:"1px solid rgba(60,52,38,0.108)"}}>
              <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:12,fontWeight:700,color:"#6E6350",marginBottom:8}}>Market Hero Tiers</div>
              {[
                {label:"Standard Heroes",  desc:"Always available",               tierReq:"iron",     icon:""},
                {label:"Premium Heroes",   desc:"Grand Bazaar — Gold tier+",      tierReq:"gold",     icon:""},
                {label:"Elite Heroes",     desc:"Pot 85+ — Platinum tier only",   tierReq:"platinum", icon:""},
              ].map(({label,desc,tierReq,icon})=>{
                const unlocked = TIER_ORDER.indexOf(playerTier) >= TIER_ORDER.indexOf(tierReq);
                return(
                  <div key={label} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                    <span style={{fontSize:16}}>{icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,fontWeight:700,color:unlocked?"#23201A":"#6E6350"}}>{label}</div>
                      <div style={{fontSize:9,color:"#6E6350"}}>{desc}</div>
                    </div>
                    <div style={{fontSize:10,fontWeight:700,color:unlocked?"#40614F":"#6E6350"}}>{unlocked?"✓ Unlocked":"Locked"}</div>
                  </div>
                );
              })}
            </div>
          </div>
          );
        })()}

        {/* MARKET */}
        {tab==="Hire"&&(
          <div>

            {/* ══ TRANSFER BIDS — dominates when present ══════════════════ */}
            {transferBids.length>0&&(
              <div style={{marginBottom:28}}>
                {/* Section header with urgency */}
                <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:14}}>
                  <div style={{fontFamily:"'IM Fell English SC',serif",fontSize:16,fontWeight:900,color:"#40614F"}}>Offers</div>
                  <div style={{fontSize:11,color:"#6E6350"}}>{transferBids.length} offer{transferBids.length>1?"s":""} waiting · expire after 2 weeks</div>
                  <div style={{flex:1}}/>
                  <div style={{fontSize:11,color:"#8A6D3B",fontWeight:700}}>Treasury: {gold.toLocaleString()}g</div>
                </div>

                {/* Full-width bid cards */}
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {transferBids.map(bid=>{
                    const hero=heroes.find(h=>h.id===bid.heroId);
                    if(!hero) return null;
                    const aboveValue=!bid.freeTransfer && bid.offer>bid.marketValue;
                    const weeksAgo=Math.max(0,(week||0)-bid.week);
                    const weeksLeft=Math.max(0,2-weeksAgo);
                    const urgentExpiry=weeksLeft<=1;
                    const phase=agePhase(hero);
                    const pwr=Math.round(Math.max(...POS_KEYS.map(p=>calcHeroCombatScore(hero,p))));
                    return(
                      <div key={bid.id} style={{
                        borderRadius:3,overflow:"hidden",
                        border:`1px solid ${aboveValue?"rgba(64,97,79,0.55)":urgentExpiry?"rgba(126,45,38,0.525)":"rgba(64,97,79,0.3)"}`,
                        background:aboveValue?"rgba(64,97,79,0.075)":"rgba(60,52,38,0.036)",
                        boxShadow:aboveValue?"0 2px 12px rgba(60,52,38,0.3)":"none",
                      }}>
                        {/* Above-market banner */}
                        {aboveValue&&(
                          <div style={{padding:"5px 16px",background:"linear-gradient(90deg,rgba(64,97,79,0.225),rgba(64,97,79,0.075))",borderBottom:"1px solid rgba(64,97,79,0.3)",display:"flex",alignItems:"center",gap:8}}>
                            <span style={{fontSize:12}}></span>
                            <span style={{fontSize:11,fontWeight:700,color:"#40614F"}}>Above Market Value — {bid.pctOfValue}% of {bid.marketValue.toLocaleString()}g</span>
                          </div>
                        )}
                        {bid.freeTransfer&&(
                          <div style={{padding:"5px 16px",background:"linear-gradient(90deg,rgba(95,75,102,0.225),rgba(95,75,102,0.075))",borderBottom:"1px solid rgba(95,75,102,0.3)",display:"flex",alignItems:"center",gap:8}}>
                            <span style={{fontSize:12}}></span>
                            <span style={{fontSize:11,fontWeight:700,color:"#5F4B66"}}>Honourable Release — a rival will take them for a parting fee</span>
                          </div>
                        )}

                        <div style={{padding:"14px 16px"}}>
                          <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>

                            {/* Hero info */}
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                                <HeroAvatar race={hero.race} size={24}/>
                                <div>
                                  <div style={{fontFamily:"'IM Fell English SC',serif",fontWeight:900,fontSize:15,color:"#23201A"}}>{hero.name}</div>
                                  <div style={{fontSize:10,color:"#6E6350"}}>{hero.race} <RoleIcon role={hero.role}/> {hero.role} · Lv {hero.level} · {agePhaseLabel(phase)}</div>
                                </div>
                                {bid.isListed&&<span style={{fontSize:9,color:"#8A6D3B",background:"rgba(138,109,59,0.18)",padding:"2px 7px",borderRadius:3,border:"1px solid rgba(138,109,59,0.3)"}}>Open to Offers</span>}
                              </div>

                              {/* Mini stats */}
                              <div style={{display:"flex",gap:6,marginBottom:8}}>
                                {[["PWR",pwr,pwr>=40?"#40614F":pwr>=25?"#3C5A78":"#8A6D3B"],
                                  ["MRL",hero.morale,hero.morale>=70?"#40614F":hero.morale>=50?"#8A6D3B":"#9A5B2B"],
                                  ["FAT",hero.fatigue||0,fatigueLabel(hero.fatigue||0).color],
                                ].map(([label,val,col])=>(
                                  <div key={label} style={{padding:"4px 8px",borderRadius:3,background:"rgba(30,24,14,0.087)"}}>
                                    <span style={{fontSize:9,color:"#6E6350"}}>{label} </span>
                                    <span style={{fontSize:12,fontWeight:700,color:col}}>{val}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Scout reasoning */}
                              <div style={{fontSize:10,color:"#6E6350",fontStyle:"italic"}}>"{bid.town} scouted: {bid.reason}"</div>
                            </div>

                            {/* Offer + actions */}
                            <div style={{flexShrink:0,textAlign:"right",minWidth:140}}>
                              <div style={{fontSize:28,fontWeight:900,color:"#40614F",fontFamily:"'IM Fell English SC',serif",lineHeight:1}}>{bid.offer.toLocaleString()}g</div>
                              {bid.freeTransfer
                                ? <div style={{fontSize:10,color:"#5F4B66",marginBottom:4}}>Parting fee</div>
                                : !aboveValue && <div style={{fontSize:10,color:"#6E6350",marginBottom:4}}>{bid.pctOfValue}% of market value</div>}
                              <div style={{fontSize:10,color:urgentExpiry?"#7E2D26":"#8A7F68",marginBottom:10}}>
                                {urgentExpiry?"Expires this week":"Expires in "+weeksLeft+" week"+(weeksLeft!==1?"s":"")}
                              </div>
                              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                                <button onClick={()=>acceptBid(bid)}
                                  style={{padding:"10px 16px",borderRadius:3,border:"none",cursor:"pointer",
                                    background:"#40614F",
                                    color:"#F0E8D5",fontWeight:900,fontSize:13,fontFamily:"'Alegreya Sans',sans-serif",
                                    whiteSpace:"nowrap"}}>
                                  ✓ Accept {bid.offer.toLocaleString()}g
                                </button>
                                <div style={{display:"flex",gap:5}}>
                                  <button onClick={()=>{setDetailHero(hero);setPrevStats(null);}}
                                    style={{flex:1,padding:"6px 0",borderRadius:3,border:"1px solid rgba(60,52,38,0.22)",cursor:"pointer",background:"rgba(60,52,38,0.072)",color:"#6E6350",fontSize:10,fontFamily:"'Alegreya Sans',sans-serif"}}>
                                    View Hero
                                  </button>
                                  <button onClick={()=>declineBid(bid)}
                                    style={{flex:1,padding:"6px 0",borderRadius:3,border:"1px solid rgba(126,45,38,0.375)",cursor:"pointer",background:"rgba(126,45,38,0.105)",color:"#7E2D26",fontSize:10,fontFamily:"'Alegreya Sans',sans-serif"}}>
                                    ✗ Decline
                                  </button>
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══ RIVAL ROSTERS — scout a league rival, buy their notables ══ */}
            <div style={{marginBottom:28,borderTop:transferBids.length>0?"1px solid rgba(60,52,38,0.108)":"none",paddingTop:transferBids.length>0?20:0}}>
              <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:4,flexWrap:"wrap"}}>
                <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:13,fontWeight:700,color:"#3C5A78"}}>The Rival Rosters</div>
                <span style={{fontSize:10,color:"#6E6350"}}>every league rival keeps six notables — scout a squad, then buy one out of their banner</span>
              </div>
              <div style={{fontSize:9,color:"#6E6350",marginBottom:12,fontStyle:"italic"}}>Rivals sell at a premium set by their manager's temperament — and never more than once a season. Poaching weakens their power.</div>
              {(()=>{
                const hasObservatory=buildings.find(b=>b.id==="scouts"&&b.built);
                const scoutCost=Math.round((40*(TIERS[playerTier]?.difficulty||1)+40)*(hasObservatory?0.5:1));
                const rosterFull=heroes.filter(x=>!x.retired).length>=ROSTER_CAP;
                return (tierEnemyTowns||[]).map(t=>{
                  const scores=(t.roster||[]).map(h=>Math.max(...POS_KEYS.map(p=>calcHeroCombatScore(h,p))));
                  const talismanMax=scores.length?Math.max(...scores):0;
                  const sold=(t.soldThisSeason||0)>=1;
                  return(
                    <div key={t.name} style={{marginBottom:8,border:"1px solid rgba(60,90,120,0.3)",borderRadius:3,background:"rgba(60,90,120,0.045)",overflow:"hidden"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px"}}>
                        <div style={{flex:1,minWidth:0}}>
                          <span style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:12,color:"#23201A"}}>{t.name}</span>
                          <span style={{fontSize:10,color:"#6E6350",marginLeft:8,fontStyle:"italic"}}>{t.manager?`${t.manager.name}, ${t.manager.title}`:""}</span>
                          <span style={{fontSize:9,color:"#6E6350",marginLeft:8}}>Power ~{t.power}</span>
                          {sold&&<span style={{fontSize:8,fontWeight:700,color:"#9A5B2B",background:"rgba(154,91,43,0.15)",padding:"1px 6px",borderRadius:3,marginLeft:8}}>WILL NOT SELL AGAIN THIS SEASON</span>}
                        </div>
                        {!t.squadScouted?(
                          <button onClick={()=>scoutTownSquad(t.name)} disabled={gold<scoutCost}
                            style={{padding:"6px 14px",borderRadius:3,border:"1px solid rgba(60,90,120,0.5)",
                              cursor:gold<scoutCost?"not-allowed":"pointer",
                              background:gold<scoutCost?"rgba(60,52,38,0.054)":"rgba(60,90,120,0.15)",
                              color:gold<scoutCost?"#8A7F68":"#3C5A78",fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:10,whiteSpace:"nowrap"}}>
                            Scout Squad — {scoutCost}g
                          </button>
                        ):(
                          <span style={{fontSize:9,fontWeight:700,color:"#3C5A78",letterSpacing:1}}>SQUAD REPORT FILED</span>
                        )}
                      </div>
                      {t.squadScouted&&(t.roster||[]).length>0&&(
                        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:6,padding:"0 10px 10px"}}>
                          {t.roster.map(h=>{
                            const best=Math.max(...POS_KEYS.map(p=>calcHeroCombatScore(h,p)));
                            const isTal=scores.length>1&&best===talismanMax;
                            const price=rivalAskingPrice(t,h,isTal);
                            const cantBuy=sold||rosterFull||gold<price;
                            return(
                              <div key={h.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:3,
                                background:"rgba(60,52,38,0.045)",border:`1px solid ${isTal?"rgba(138,109,59,0.5)":"rgba(60,52,38,0.126)"}`}}>
                                <HeroAvatar race={h.race} size={18}/>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:11,color:"#23201A",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                                    {h.name}{isTal&&<span style={{fontSize:8,color:"#8A6D3B",marginLeft:5,letterSpacing:1}}>★ TALISMAN</span>}
                                  </div>
                                  <div style={{fontSize:9,color:"#6E6350"}}><RoleIcon role={h.role} size={10}/> {h.role} · Lv {h.level} · PWR {Math.round(best)}</div>
                                </div>
                                <div style={{textAlign:"right"}}>
                                  <div style={{fontSize:11,fontWeight:700,color:"#8A6D3B"}}>{price.toLocaleString()}g</div>
                                  <button onClick={()=>buyRivalHero(t.name,h.id)} disabled={cantBuy}
                                    style={{marginTop:2,padding:"3px 10px",borderRadius:3,border:"none",
                                      cursor:cantBuy?"not-allowed":"pointer",
                                      background:cantBuy?"rgba(60,52,38,0.12)":"#23201A",
                                      color:cantBuy?"#8A7F68":"#F5EEDC",fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:9}}>
                                    Make Offer
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {/* ══ FREE AGENT MARKET ════════════════════════════════════════ */}
            <div style={{borderTop:"1px solid rgba(60,52,38,0.108)",paddingTop:20}}>
              {/* Header with roster count */}
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
                <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:13,fontWeight:700,color:"#8A6D3B"}}>Heroes For Hire</div>
                <span style={{fontSize:11,color:"#6E6350"}}>Treasury: <b style={{color:"#8A6D3B"}}>{gold.toLocaleString()}g</b></span>
                {/* Roster count — prominent when near cap */}
                {(()=>{
                  const rCount=heroes.filter(x=>!x.retired).length;
                  const full=rCount>=ROSTER_CAP;
                  return(
                    <span style={{fontSize:10,fontWeight:700,
                      color:full?"#9A5B2B":rCount>=ROSTER_CAP-2?"#8A6D3B":"#8A7F68",
                      background:full?"rgba(154,91,43,0.15)":"rgba(60,52,38,0.072)",
                      padding:"2px 8px",borderRadius:3,
                      border:`1px solid ${full?"rgba(154,91,43,0.45)":"rgba(60,52,38,0.144)"}`}}>
                      {full?"":""} {rCount}/{ROSTER_CAP} roster
                    </span>
                  );
                })()}
                {buildings.find(b=>b.id==="bazaar"&&b.built)&&(
                  <span style={{fontSize:10,color:"#40614F",background:"rgba(64,97,79,0.12)",padding:"2px 8px",borderRadius:3,border:"1px solid rgba(64,97,79,0.27)"}}>Bazaar Active</span>
                )}
                {buildings.find(b=>b.id==="scouts"&&b.built)&&(
                  <span style={{fontSize:10,color:"#3C5A78",background:"rgba(60,90,120,0.12)",padding:"2px 8px",borderRadius:3,border:"1px solid rgba(60,90,120,0.27)"}}>Observatory Active</span>
                )}
                <span style={{fontSize:10,color:"#8A7F68",marginLeft:"auto"}}>
                  {(()=>{
                    const hasNetwork=buildings.find(b=>b.id==="network"&&b.built);
                    const interval=hasNetwork?3:6;
                    const weeksLeft=interval-(week%interval)||interval;
                    return `Refreshes in ${weeksLeft} week${weeksLeft!==1?"s":""}`;
                  })()}
                </span>
              </div>

              {/* Row 1 — position pills (same chrome as the Squad tab) */}
              <div className="rm-sq-row" style={{display:"flex",gap:5,marginBottom:6,alignItems:"center"}}>
                {["All",...POS_KEYS].map(p=>{
                  const count = p==="All"
                    ? market.length
                    : market.filter(h=>(POSITIONS[p]?.ideal||[]).includes(h.role)).length;
                  const isActive = marketFilter.position === p;
                  return(
                    <button key={p} className={`pa-pill${isActive?" active":""}`} onClick={()=>setMarketFilter(f=>({...f,position:p}))}>
                      {p}<span className="ct">{count}</span>
                    </button>
                  );
                })}
              </div>

              {/* Row 2 — race chips for races actually on offer this rotation
                  (no Other control: an absent race has nothing to filter) */}
              {(()=>{
                const RACES_LIST=["Human","Elf","Dwarf","Half-Orc","Gnome","Tiefling","Dragonborn"];
                const counts=Object.fromEntries(RACES_LIST.map(r=>[r,market.filter(h=>h.race===r).length]));
                const present=RACES_LIST.filter(r=>counts[r]>0).sort((a,b)=>counts[b]-counts[a]);
                return(
                  <div className="rm-sq-row" style={{display:"flex",gap:5,marginBottom:6,alignItems:"center",flexWrap:"wrap"}}>
                    <button className={`pa-pill${marketFilter.race==="All"?" active":""}`} onClick={()=>setMarketFilter(f=>({...f,race:"All"}))}>
                      All<span className="ct">{market.length}</span>
                    </button>
                    {present.map(r=>(
                      <button key={r} className={`pa-pill${marketFilter.race===r?" active":""}`} title={r} onClick={()=>setMarketFilter(f=>({...f,race:r}))}>
                        <HeroAvatar race={r} size={13}/>{r}<span className="ct">{counts[r]}</span>
                      </button>
                    ))}
                  </div>
                );
              })()}

              {/* Row 3 — sort chip + badged disclosure + shown count */}
              {(()=>{
                const hiddenActive=(marketFilter.role!=="All"?1:0)+(marketFilter.stage!=="All"?1:0);
                return(
                  <>
                    <div className="rm-sq-row" style={{display:"flex",gap:5,marginBottom:marketMoreOpen?6:12,alignItems:"center"}}>
                      <span className="pa-pill" style={{position:"relative"}}>
                        {`Sort: ${marketFilter.sortBy}`}{" ▾"}
                        <select value={marketFilter.sortBy} onChange={e=>setMarketFilter(f=>({...f,sortBy:e.target.value}))}
                          aria-label="Sort market by"
                          style={{position:"absolute",inset:0,opacity:0,cursor:"pointer",width:"100%"}}>
                          {["Value","Combat","Salary","Level","Stage",...(buildings.find(b=>b.id==="scouts"&&b.built)?["Potential"]:[])].map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                      </span>
                      <button className={`pa-pill${hiddenActive>0?" active":""}`} onClick={()=>setMarketMoreOpen(o=>!o)}>
                        {`More${hiddenActive>0?` (${hiddenActive})`:""} ${marketMoreOpen?"▴":"▾"}`}
                      </button>
                      <span className="pa-kicker" style={{marginLeft:"auto",flexShrink:0,letterSpacing:1.5}}>{marketFiltered.length} shown</span>
                    </div>
                    {marketMoreOpen&&(
                      <div style={{marginBottom:12,padding:"10px 12px",borderRadius:3,background:"rgba(138,109,59,0.07)",border:"1px solid rgba(138,109,59,0.3)"}}>
                        <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
                          <select value={marketFilter.role} onChange={e=>setMarketFilter(f=>({...f,role:e.target.value}))} style={{...IS,flex:1,minWidth:90}}>
                            <option value="All">All Roles</option>{ROLES.map(r=><option key={r} value={r}>{r}</option>)}
                          </select>
                          <select value={marketFilter.stage} onChange={e=>setMarketFilter(f=>({...f,stage:e.target.value}))} style={{...IS,flex:1,minWidth:90}}>
                            <option value="All">All Stages</option>
                            {["prospect","rising","peak","fading","veteran"].map(s=><option key={s} value={s}>{agePhaseLabel(s)}</option>)}
                          </select>
                        </div>
                        <button onClick={()=>setMarketFilter(f=>({...f,position:"All",race:"All",role:"All",stage:"All"}))}
                          style={{background:"none",border:"none",cursor:"pointer",color:"#7E2D26",fontSize:11,padding:0,textDecoration:"underline",fontFamily:"'Alegreya Sans',sans-serif"}}>
                          Clear all filters
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Locked tier callout */}
              {(()=>{
                const hasBazaar=buildings.find(b=>b.id==="bazaar"&&b.built);
                const hasSanctum=buildings.find(b=>b.id==="sanctum"&&b.built);
                const premiumCount=market.filter(h=>h.marketTier==="premium").length;
                const eliteCount=market.filter(h=>h.marketTier==="elite").length;
                if(hasBazaar&&hasSanctum) return null;
                return(
                  <div style={{marginBottom:12,display:"flex",flexDirection:"column",gap:4}}>
                    {!hasBazaar&&premiumCount>0&&(
                      <div style={{padding:"8px 12px",borderRadius:3,background:"rgba(60,52,38,0.036)",border:"1px solid rgba(60,52,38,0.126)",fontSize:10,color:"#6E6350"}}>
                        {premiumCount} premium hero{premiumCount>1?"es":""} hidden — build Grand Bazaar (Gold tier) to access
                      </div>
                    )}
                    {!hasSanctum&&eliteCount>0&&(
                      <div style={{padding:"8px 12px",borderRadius:3,background:"rgba(60,52,38,0.036)",border:"1px solid rgba(60,52,38,0.126)",fontSize:10,color:"#6E6350"}}>
                        {eliteCount} elite hero{eliteCount>1?"es":""} hidden — build Elite Sanctum (Platinum tier) to access
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="pa-grid">
                {(()=>{
                  const hasScouts=buildings.find(b=>b.id==="scouts"&&b.built);
                  if(marketFiltered.length===0) return <div style={{color:"#6E6350",fontSize:13,padding:8}}>No heroes match your filters.</div>;
                  return marketFiltered.map(h=>(
                    <div key={h.id}>
                      <HeroCard hero={h} selected={detailHero?.id===h.id}
                        onClick={()=>setDetailHero(h)} showBuy
                        canAfford={gold>=(signDiscount>0?Math.round(h.value*(1-signDiscount)):h.value)}
                        rosterFull={heroes.filter(x=>!x.retired).length>=ROSTER_CAP}
                        onBuy={buyHero}
                        showScoutedPotential={!!hasScouts}/>
                    </div>
                  ));
                })()}
              </div>

              {/* ══ YOUR SQUAD — list / renew / release without opening detail ══ */}
              <div style={{marginTop:20,paddingTop:16,borderTop:"1px solid rgba(60,52,38,0.072)"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
                  <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:13,fontWeight:700,color:"#3C5A78"}}>Your Squad</div>
                  <span style={{fontSize:10,color:"#6E6350"}}>
                    Quick actions — open to offers, renew contract, or release. Next rival-offer cycle in ~{4-(week%4)} week{4-(week%4)===1?"":"s"}.
                  </span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:7}}>
                  {heroes.filter(h=>!h.retired).map(h=>{
                    const listed = listedHeroIds.has(h.id);
                    const hasBid = transferBids.some(b=>b.heroId===h.id);
                    const weeksLeft = h.contractWeeksLeft||0;
                    const contractExpired = weeksLeft === 0;
                    const canRenew = !h.negotiationPending && !h.refusesToSign && weeksLeft > 0 && weeksLeft <= WEEKS_PER_CONTRACT_YEAR * 2;
                    return(
                      <div key={h.id} style={{padding:"8px 10px",borderRadius:3,
                        background:listed?"rgba(138,109,59,0.06)":hasBid?"rgba(64,97,79,0.06)":"rgba(60,52,38,0.045)",
                        border:`1px solid ${listed?"rgba(138,109,59,0.375)":hasBid?"rgba(64,97,79,0.375)":"rgba(60,52,38,0.108)"}`}}>
                        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}>
                          <HeroAvatar race={h.race} size={16}/>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:11,fontWeight:700,fontFamily:"'Alegreya Sans',sans-serif",color:"#23201A",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                              {h.name}
                              {listed&&<span style={{fontSize:8,color:"#8A6D3B",marginLeft:5,fontWeight:400}}>Open</span>}
                              {hasBid&&<span style={{fontSize:8,color:"#40614F",marginLeft:5,fontWeight:400}}>Offer</span>}
                            </div>
                            <div style={{fontSize:9,color:"#6E6350"}}>
                              <RoleIcon role={h.role}/> {h.role} · Lv {h.level} · {h.value.toLocaleString()}g
                            </div>
                          </div>
                        </div>
                        <div style={{fontSize:9,color:"#6E6350",marginBottom:6}}>
                          {contractExpired
                            ? <span style={{color:"#9A5B2B",fontWeight:700}}>Contract expired — renewal pending</span>
                            : h.negotiationPending
                              ? <span style={{color:"#3C5A78"}}>In negotiation · {weeksLeft}w on current deal</span>
                              : <>Contract {weeksLeft}w left · {h.salary}g/wk</>
                          }
                        </div>
                        <div style={{display:"flex",gap:4}}>
                          <button onClick={()=>toggleListed(h)}
                            style={{flex:1,padding:"5px 0",borderRadius:3,
                              border:`1px solid ${listed?"rgba(138,109,59,0.55)":"rgba(60,52,38,0.22)"}`,
                              cursor:"pointer",
                              background:listed?"rgba(138,109,59,0.18)":"rgba(60,52,38,0.072)",
                              color:listed?"#8A6D3B":"#6E6350",fontSize:9,fontWeight:700,fontFamily:"'Alegreya Sans',sans-serif"}}>
                            {listed?"✓ Open":"Open"}
                          </button>
                          <button onClick={()=>canRenew&&initiateEarlyRenewal(h)}
                            disabled={!canRenew}
                            title={h.negotiationPending?"Already in negotiation":canRenew?"Start contract talks":contractExpired?"Already expired":"Renew available within 2 seasons of expiry"}
                            style={{flex:1,padding:"5px 0",borderRadius:3,border:"1px solid rgba(60,90,120,0.3)",
                              cursor:canRenew?"pointer":"not-allowed",
                              background:"rgba(60,90,120,0.09)",
                              color:canRenew?"#3C5A78":"#8A7F68",
                              fontSize:9,fontWeight:700,fontFamily:"'Alegreya Sans',sans-serif",
                              opacity:canRenew?1:0.5}}>
                            Renew
                          </button>
                          <button onClick={()=>{
                            const msg=contractExpired
                              ? `Release ${h.name}? Contract expired — mutual parting, no morale hit.`
                              : `Release ${h.name}? Morale penalty will apply to the remaining squad.`;
                            if(window.confirm(msg)) releaseHero(h);
                          }}
                            style={{flex:1,padding:"5px 0",borderRadius:3,border:"1px solid rgba(126,45,38,0.3)",
                              cursor:"pointer",background:"rgba(126,45,38,0.075)",color:"#7E2D26",
                              fontSize:9,fontWeight:700,fontFamily:"'Alegreya Sans',sans-serif"}}>
                            Release
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* LOG */}
        {tab==="Ledger"&&(()=>{
          const f = lastWeekFinances;
          const sf = seasonFinances;
          const weekNet = f ? f.netGold : null;
          const seasonNet = sf ? (sf.tribute + sf.raidGold + sf.eventGold) - sf.wages - sf.signingCosts : 0;
          const col = n => n >= 0 ? "#40614F" : "#7E2D26";
          const g = n => (n>=0?"+":"")+n.toLocaleString()+"g";
          const row = (label, val, valCol, sub) => (
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid rgba(60,52,38,0.072)"}}>
              <div>
                <div style={{fontSize:11,color:"#23201A"}}>{label}</div>
                {sub&&<div style={{fontSize:9,color:"#6E6350",marginTop:1}}>{sub}</div>}
              </div>
              <div style={{fontSize:13,fontWeight:700,color:valCol}}>{val}</div>
            </div>
          );
          return(
          <div style={{maxWidth:500}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontFamily:"'IM Fell English SC',serif",fontSize:15,fontWeight:700,color:"#8A6D3B"}}>Ledger</div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:10,color:"#6E6350"}}>✓ Auto-saved</span>
                <AbandonButton onAbandon={()=>{
                  const achievementData = { trophies, buildings, raceSynergyUsage,
                    retiredMax13: heroes.some(h=>h.retired&&h.level>=13),
                    everPromoted: trophies.some(t=>t.tier!=="iron"),
                    peakGold: hallOfFame.peakGold||0,
                    abilitiesMitigated: hallOfFame.abilitiesMitigated||0,
                    heroesSold: hallOfFame.heroesSold||0,
                  };
                  const newlyEarned = checkAchievements(achievementData);
                  const existingBoons = ngPlus?.earnedBoons ?? [];
                  const allBoons = [...existingBoons, ...newlyEarned];
                  const pWins = playerRecord.wins, pLosses = playerRecord.losses;
                  setLegacyCeremony({ season, wins:pWins, losses:pLosses,
                    tier:playerTier, defeat:true, defeatReason:"abandon",
                    newlyEarned, allBoons,
                    chronicle:{ totalRaids:trophies.reduce((a,t)=>a+(t.wins||0)+(t.losses||0),0)+pWins+pLosses,
                      totalWins:trophies.reduce((a,t)=>a+(t.wins||0),0)+pWins,
                      totalSeasons:season, builtCount:buildings.filter(b=>b.built).length,
                      totalWeeks:week },
                  });
                }}/>
                <NewGameButton/>
              </div>
            </div>

            {/* Persistence note */}
            <div style={{marginBottom:14,padding:"8px 12px",borderRadius:3,background:"rgba(60,52,38,0.036)",border:"1px solid rgba(60,52,38,0.108)"}}>
              <div style={{fontSize:10,color:"#6E6350",lineHeight:1.5}}>
                <strong style={{color:"#4A4335"}}>Save data is stored in your browser.</strong> Progress and your Legacy's earned boons persist across realms on this device and browser. Clearing browser data or switching devices will reset your save. There is no cloud sync.
              </div>
            </div>

            {/* Display preference — device-level, not part of the campaign save */}
            <div style={{marginBottom:16,padding:"12px 14px",background:"rgba(60,52,38,0.054)",borderRadius:3,border:"1px solid rgba(60,52,38,0.144)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:11,fontWeight:700,color:"#6E6350",letterSpacing:0.5}}>NIGHT MODE</div>
                <div style={{fontSize:10,color:"#6E6350",marginTop:2}}>Darker page for evening play. A device setting — applies to every save on this browser.</div>
              </div>
              <button onClick={()=>setNightMode(v=>!v)}
                style={{padding:"8px 18px",borderRadius:3,border:"1px solid rgba(60,52,38,0.33)",cursor:"pointer",
                  background:nightMode?"#23201A":"rgba(60,52,38,0.072)",color:nightMode?"#F0E8D5":"#4A4335",
                  fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:11,letterSpacing:1.5,textTransform:"uppercase",flexShrink:0}}>
                {nightMode?"Night":"Day"}
              </button>
            </div>

            {/* Last week */}
            <div style={{marginBottom:16,padding:"14px 16px",background:"rgba(60,52,38,0.054)",borderRadius:3,border:"1px solid rgba(60,52,38,0.144)"}}>
              <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:11,fontWeight:700,color:"#6E6350",marginBottom:10,letterSpacing:0.5}}>
                LAST WEEK {f?`(Week ${f.week})`:""}
              </div>
              {!f&&<div style={{fontSize:11,color:"#6E6350"}}>No activity recorded yet — complete a battle or rest week.</div>}
              {f&&<>
                {row("Battle earnings",  f.raidGold>0?"+"+f.raidGold.toLocaleString()+"g":"—",  f.raidGold>0?"#40614F":"#6E6350")}
                {row("Tribute",          "+"+f.tribute.toLocaleString()+"g",                           "#3C5A78", `${currentTier.icon} ${currentTier.name} · flat per tier`)}
                {row("Wages",            "−"+f.wages.toLocaleString()+"g",                             "#9A5B2B", `${heroes.filter(h=>!h.retired).length} heroes on contract`)}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:10,marginTop:4}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#23201A",fontFamily:"'Alegreya Sans',sans-serif"}}>Net</div>
                  <div style={{fontSize:16,fontWeight:900,color:col(weekNet),fontFamily:"'IM Fell English SC',serif"}}>{g(weekNet)}</div>
                </div>
              </>}
            </div>

            {/* Season to date */}
            <div style={{marginBottom:16,padding:"14px 16px",background:"rgba(60,52,38,0.054)",borderRadius:3,border:"1px solid rgba(60,52,38,0.144)"}}>
              <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:11,fontWeight:700,color:"#6E6350",marginBottom:10,letterSpacing:0.5}}>
                SEASON {season} TO DATE
              </div>
              {row("Battle earnings",  sf.raidGold>0?"+"+sf.raidGold.toLocaleString()+"g":"—",  "#40614F")}
              {row("Tribute",          "+"+sf.tribute.toLocaleString()+"g",                         "#3C5A78")}
              {sf.eventGold>0&&row("Event gold",   "+"+sf.eventGold.toLocaleString()+"g",           "#5F4B66")}
              {row("Wages",            "−"+sf.wages.toLocaleString()+"g",                           "#9A5B2B")}
              {sf.signingCosts>0&&row("Signings",  "−"+sf.signingCosts.toLocaleString()+"g",        "#7E2D26", "hero acquisition costs")}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:10,marginTop:4}}>
                <div style={{fontSize:12,fontWeight:700,color:"#23201A",fontFamily:"'Alegreya Sans',sans-serif"}}>Season net</div>
                <div style={{fontSize:16,fontWeight:900,color:col(seasonNet),fontFamily:"'IM Fell English SC',serif"}}>{g(seasonNet)}</div>
              </div>
            </div>

            {/* Treasury */}
            <div style={{marginBottom:24,padding:"12px 16px",background:`${townColor}0d`,borderRadius:3,border:`1px solid ${townColor}33`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontSize:11,fontWeight:700,color:townColor}}>Treasury</div>
              <div style={{fontSize:22,fontWeight:900,color:townColor,fontFamily:"'IM Fell English SC',serif"}}>{gold.toLocaleString()}g</div>
            </div>

            {/* Realm Settings */}
            <div style={{padding:"14px 16px",background:"rgba(60,52,38,0.045)",borderRadius:3,border:"1px solid rgba(60,52,38,0.126)"}}>
              <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:12,color:"#6E6350",marginBottom:12,letterSpacing:1}}>REALM SETTINGS</div>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:10,color:"#6E6350",marginBottom:5}}>Realm name</div>
                <div style={{display:"flex",gap:6}}>
                  <input defaultValue={townName} id="realm-name-input" maxLength={28}
                    style={{flex:1,padding:"7px 10px",borderRadius:3,background:"rgba(60,52,38,0.108)",border:"1px solid rgba(60,52,38,0.22)",color:"#23201A",fontSize:12,outline:"none",fontFamily:"'Alegreya Sans',sans-serif"}}/>
                  <button onClick={()=>{const v=document.getElementById("realm-name-input").value.trim();if(v)setTownName(v);}}
                    style={{padding:"7px 14px",borderRadius:3,border:"none",cursor:"pointer",background:`${townColor}22`,color:townColor,fontSize:11,fontWeight:700,fontFamily:"'Alegreya Sans',sans-serif"}}>
                    Save
                  </button>
                </div>
              </div>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:10,color:"#6E6350",marginBottom:6}}>Realm colour</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {TOWN_COLORS.map(c=>(
                    <button key={c.value} onClick={()=>setTownColor(c.value)}
                      style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:3,border:"none",cursor:"pointer",
                        background:townColor===c.value?`${c.value}22`:"rgba(60,52,38,0.072)",
                        outline:`2px solid ${townColor===c.value?c.value:"transparent"}`,transition:"all 0.15s"}}>
                      <div style={{width:9,height:9,borderRadius:"50%",background:c.value}}/>
                      <span style={{fontSize:10,color:townColor===c.value?c.value:"#6E6350",fontWeight:townColor===c.value?700:400}}>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{paddingTop:12,borderTop:"1px solid rgba(60,52,38,0.09)"}}>
                <div style={{fontSize:10,color:"#6E6350",marginBottom:8}}>Scouting Intelligence</div>
                <div style={{padding:"10px 12px",borderRadius:3,background:showHiddenStats?"rgba(60,90,120,0.09)":"rgba(60,52,38,0.054)",border:`1px solid ${showHiddenStats?"rgba(60,90,120,0.3)":"rgba(60,52,38,0.126)"}`,transition:"all 0.2s"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,fontWeight:700,color:showHiddenStats?"#3C5A78":"#6E6350",marginBottom:3}}>
                        {showHiddenStats?"Omniscient Mode":"Blind Scouting"}
                      </div>
                      <div style={{fontSize:10,color:"#6E6350",lineHeight:1.5}}>
                        {showHiddenStats
                          ?"Hidden stats visible. You see all."
                          :"Hidden stats concealed. Judge heroes by their deeds."}
                      </div>
                    </div>
                    <button onClick={()=>setShowHiddenStats(v=>!v)}
                      style={{flexShrink:0,padding:"7px 14px",borderRadius:3,border:`1px solid ${showHiddenStats?"rgba(60,90,120,0.45)":"rgba(60,52,38,0.264)"}`,cursor:"pointer",
                        background:showHiddenStats?"rgba(60,90,120,0.18)":"rgba(60,52,38,0.09)",
                        color:showHiddenStats?"#3C5A78":"#6E6350",fontSize:10,fontWeight:700,fontFamily:"'Alegreya Sans',sans-serif",whiteSpace:"nowrap"}}>
                      {showHiddenStats?"Hide Stats":"Reveal Stats"}
                    </button>
                  </div>
                </div>
                <div style={{marginTop:8,padding:"10px 12px",borderRadius:3,background:scoutingFog?"rgba(60,90,120,0.09)":"rgba(60,52,38,0.054)",border:`1px solid ${scoutingFog?"rgba(60,90,120,0.3)":"rgba(60,52,38,0.126)"}`,transition:"all 0.2s"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,fontWeight:700,color:scoutingFog?"#3C5A78":"#6E6350",marginBottom:3}}>
                        {scoutingFog?"Fog of War":"Open Intelligence"}
                      </div>
                      <div style={{fontSize:10,color:"#6E6350",lineHeight:1.5}}>
                        {scoutingFog
                          ?"Opponent power, odds and abilities hidden until you send a scout. The Observatory makes reports free."
                          :"All opponent details visible before every battle."}
                      </div>
                    </div>
                    <button onClick={()=>setScoutingFog(v=>!v)}
                      style={{flexShrink:0,padding:"7px 14px",borderRadius:3,border:`1px solid ${scoutingFog?"rgba(60,90,120,0.45)":"rgba(60,52,38,0.264)"}`,cursor:"pointer",
                        background:scoutingFog?"rgba(60,90,120,0.18)":"rgba(60,52,38,0.09)",
                        color:scoutingFog?"#3C5A78":"#6E6350",fontSize:10,fontWeight:700,fontFamily:"'Alegreya Sans',sans-serif",whiteSpace:"nowrap"}}>
                      {scoutingFog?"Disable Fog":"Enable Fog"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          );
        })()}
        {tab==="Guide"&&<GuideTab/>}

        </div>{/* end rm-main */}
      </div>{/* end rm-content */}

      {/* ── MOBILE BOTTOM NAV ── */}
      {/* ── MOBILE BOTTOM NAV — 5 tabs ── */}
      {/* More overlay — shows when More tapped */}
      {showMore&&(
        <div className="rm-more-overlay" onClick={()=>setShowMore(false)}>
          {[
            {id:"Dominion",icon:"",label:"Dominion"},
            {id:"Town",    icon:"",label:"Town"},
            {id:"Ledger",   icon:"",label:"Ledger"},
            {id:"Guide",   icon:"",label:"Guide"},
          ].map(({id,icon,label})=>(
            <button key={id} className={`rm-more-item${tab===id?" active":""}`}
              style={tab===id?{color:townColor,background:`${townColor}14`,borderColor:`${townColor}33`}:{}}
              onClick={e=>{e.stopPropagation();setTab(id);setShowMore(false);}}>
              <span className="rm-more-icon">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}

      <nav className="rm-bottom-nav">
        {/* Squad */}
        {(()=>{
          const {id,icon,label,badge}=NAV_ITEMS[0];
          return(
            <button key={id} className={`rm-bottom-nav-item${tab===id?" active":""}`}
              onClick={()=>{setTab(id);setShowMore(false);}}
              style={tab===id?{color:townColor}:{}}>
              <span className="rm-bnav-icon"><NavIcon tab={id} size={20}/></span>
              <span className="rm-bnav-label">{label}</span>
              {badge&&<span className="rm-bottom-nav-badge"/>}
            </button>
          );
        })()}

        {/* Tactics */}
        {(()=>{
          const {id,icon,label,badge}=NAV_ITEMS[1];
          return(
            <button key={id} className={`rm-bottom-nav-item${tab===id?" active":""}`}
              onClick={()=>{setTab(id);setShowMore(false);}}
              style={tab===id?{color:townColor}:{}}>
              <span className="rm-bnav-icon"><NavIcon tab={id} size={20}/></span>
              <span className="rm-bnav-label">{label}</span>
              {badge&&<span className="rm-bottom-nav-badge"/>}
            </button>
          );
        })()}

        {/* Battle — centre hero button */}
        {(()=>{
          const {id,icon,label,badge}=NAV_ITEMS[2];
          const isActive=tab===id;
          return(
            <button key={id} className={`rm-bottom-nav-item battle-btn${isActive?" active":""}`}
              onClick={()=>{setTab(id);setShowMore(false);}}>
              <div className="rm-bnav-battle-pill" style={isActive?{background:"rgba(126,45,38,0.33)",borderColor:"rgba(126,45,38,0.55)"}:{}}>
                <span className="rm-bnav-icon" style={{color:isActive?"#9A5B2B":"#7A6F58"}}>{icon}</span>
                <span className="rm-bnav-label" style={{color:isActive?"#9A5B2B":"#8A7F68"}}>{label}</span>
              </div>
              {badge&&<span className="rm-bottom-nav-badge"/>}
            </button>
          );
        })()}

        {/* Market */}
        {(()=>{
          const {id,icon,label,badge}=NAV_ITEMS[5];
          return(
            <button key={id} className={`rm-bottom-nav-item${tab===id?" active":""}`}
              onClick={()=>{setTab(id);setShowMore(false);}}
              style={tab===id?{color:townColor}:{}}>
              <span className="rm-bnav-icon"><NavIcon tab={id} size={20}/></span>
              <span className="rm-bnav-label">{label}</span>
              {badge&&<span className="rm-bottom-nav-badge"/>}
            </button>
          );
        })()}

        {/* More ··· */}
        {(()=>{
          const moreActive=["Dominion","Town","Ledger","Guide"].includes(tab);
          const moreBadge=false;
          return(
            <button className={`rm-bottom-nav-item${moreActive||showMore?" active":""}`}
              onClick={()=>setShowMore(v=>!v)}
              style={moreActive||showMore?{color:townColor}:{}}>
              <span className="rm-bnav-icon" style={{fontSize:18,letterSpacing:2}}>···</span>
              <span className="rm-bnav-label">More</span>
            </button>
          );
        })()}
      </nav>

      {detailHero&&(
        <HeroDetail
          hero={heroes.find(h=>h.id===detailHero.id)||market.find(h=>h.id===detailHero.id)||detailHero}
          isOwned={!!heroes.find(h=>h.id===detailHero.id)}
          prevStats={prevStats?.[detailHero.id]}
          onClose={()=>setDetailHero(null)}
          onRelease={releaseHero}
          onEarlyRenew={initiateEarlyRenewal}
          isListed={listedHeroIds.has(detailHero?.id)}
          onToggleListed={toggleListed}
          heroBids={transferBids.filter(b=>b.heroId===detailHero?.id)}
          onAcceptBid={acceptBid}
          onDeclineBid={declineBid}
          showHiddenStats={showHiddenStats}
          isLeader={squadLeaderId===detailHero?.id}
          onSetLeader={()=>setSquadLeaderId(id=>id===detailHero?.id?null:detailHero?.id)}
          onRetrain={startRetraining}
          retrainGold={gold}
          retrainSeason={season}
          retrainBuildings={buildings}
        />
      )}
    </div>
  );
}
