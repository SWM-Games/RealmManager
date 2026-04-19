import { useState, useMemo, useEffect, useRef } from "react";

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

// Global responsive CSS — injected once, handles all breakpoints
const RESPONSIVE_CSS = `
  * { box-sizing: border-box; }
  html { font-size: 16px; }
  button, select, input { touch-action: manipulation; }

  /* ── LAYOUT SHELL ── */
  .rm-shell { display: flex; min-height: 100vh; }

  /* ── SIDEBAR (desktop) ── */
  .rm-sidebar {
    width: 220px; flex-shrink: 0;
    position: fixed; top: 0; left: 0; height: 100vh;
    background: rgba(0,0,0,0.6);
    border-right: 1px solid rgba(120,200,255,0.1);
    backdrop-filter: blur(16px);
    display: flex; flex-direction: column;
    z-index: 50; overflow-y: auto;
  }
  .rm-sidebar-logo {
    padding: 20px 18px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .rm-sidebar-stats {
    padding: 12px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    display: flex; flex-direction: column; gap: 6px;
  }
  .rm-stat-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 5px 8px; border-radius: 7px;
    background: rgba(255,255,255,0.03);
  }
  .rm-stat-label { font-size: 10px; color: #555; }
  .rm-stat-value { font-size: 13px; font-weight: 700; }
  .rm-sidebar-nav {
    padding: 10px 10px; display: flex; flex-direction: column; gap: 2px; flex: 1;
  }
  .rm-nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 8px; border: none;
    cursor: pointer; font-family: 'Cinzel', serif; font-size: 12px;
    background: transparent; color: #555;
    transition: background 0.15s, color 0.15s;
    text-align: left; width: 100%; position: relative;
    white-space: nowrap;
  }
  .rm-nav-item:hover { background: rgba(255,255,255,0.04); color: #888; }
  .rm-nav-item.active { background: rgba(120,200,255,0.12); color: #78c8ff; }
  .rm-nav-item.active .rm-nav-icon-wrap { color: #78c8ff; }
  .rm-nav-icon-wrap { font-size: 15px; width: 20px; text-align: center; flex-shrink: 0; }
  .rm-nav-badge {
    position: absolute; top: 7px; right: 10px;
    width: 7px; height: 7px; border-radius: 50%; background: #ff9f43;
  }

  /* ── CONTENT AREA (desktop) ── */
  .rm-content {
    margin-left: 220px;
    flex: 1; min-width: 0;
  }
  .rm-main {
    padding: 20px 24px;
  }
  /* Detail panel offset */
  .rm-main-shifted { padding-right: 360px; }

  /* ── MOBILE TOP BAR ── */
  .rm-topbar { display: none; }

  /* ── MOBILE BOTTOM NAV ── */
  .rm-bottom-nav { display: none; }

  /* ── MOBILE OVERRIDES ── */
  @media (max-width: 640px) {
    .rm-sidebar { display: none; }
    .rm-content { margin-left: 0; }
    .rm-main { padding: 12px 12px 80px; }
    .rm-main-shifted { padding-right: 12px; }

    /* Top bar */
    .rm-topbar {
      display: flex; align-items: center; justify-content: space-between;
      position: sticky; top: 0; z-index: 50;
      background: rgba(0,0,0,0.7); backdrop-filter: blur(14px);
      border-bottom: 1px solid rgba(120,200,255,0.1);
      padding: 8px 14px; gap: 8px;
    }
    .rm-topbar-title {
      font-family: 'Cinzel', serif; font-weight: 900; font-size: 14px;
      background: linear-gradient(135deg,#ffd966,#ff9f43);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      white-space: nowrap;
    }
    .rm-topbar-chips { display: flex; gap: 5px; overflow-x: auto; scrollbar-width: none; }
    .rm-topbar-chips::-webkit-scrollbar { display: none; }
    .rm-topbar-chip {
      flex-shrink: 0; text-align: center;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
      border-radius: 6px; padding: 3px 8px;
    }
    .rm-topbar-chip-label { font-size: 7px; color: #444; }
    .rm-topbar-chip-value { font-size: 11px; font-weight: 700; }

    /* Bottom nav — 5 tabs, Battle is the hero */
    .rm-bottom-nav {
      display: flex;
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
      background: rgba(6,6,16,0.97); backdrop-filter: blur(16px);
      border-top: 1px solid rgba(120,200,255,0.1);
      padding-bottom: max(6px, env(safe-area-inset-bottom));
      gap: 0;
    }
    .rm-bottom-nav-item {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 2px;
      padding: 8px 2px 6px; border: none; cursor: pointer;
      background: transparent; color: #555;
      font-family: 'Lato', sans-serif;
      transition: color 0.15s; position: relative;
      min-height: 56px;
    }
    .rm-bottom-nav-item.active { color: #78c8ff; }
    .rm-bottom-nav-item .rm-bnav-icon { font-size: 20px; line-height: 1; }
    .rm-bottom-nav-item .rm-bnav-label { font-size: 9px; font-weight: 600; letter-spacing: 0.3px; }
    /* Battle centre button — taller, visually distinct */
    .rm-bottom-nav-item.battle-btn {
      flex: 1.4;
      padding: 4px 2px 6px;
    }
    .rm-bnav-battle-pill {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      width: 52px; height: 38px; border-radius: 14px;
      background: rgba(255,100,100,0.12); border: 1px solid rgba(255,100,100,0.2);
      transition: background 0.15s, border 0.15s;
      gap: 1px;
    }
    .rm-bottom-nav-item.battle-btn.active .rm-bnav-battle-pill {
      background: rgba(255,100,100,0.2); border-color: rgba(255,100,100,0.45);
    }
    .rm-bottom-nav-item.battle-btn .rm-bnav-icon { font-size: 22px; }
    .rm-bottom-nav-badge {
      position: absolute; top: 6px; right: calc(50% - 16px);
      width: 7px; height: 7px; border-radius: 50%; background: #ff9f43;
    }
    /* More overlay */
    .rm-more-overlay {
      position: fixed; bottom: 56px; left: 0; right: 0; z-index: 49;
      background: rgba(6,6,16,0.97); backdrop-filter: blur(16px);
      border-top: 1px solid rgba(120,200,255,0.12);
      padding: 12px 16px; display: flex; gap: 8px;
    }
    .rm-more-item {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;
      padding: 10px 4px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06);
      background: rgba(255,255,255,0.03); cursor: pointer; color: #666;
      font-family: 'Lato', sans-serif; font-size: 9px; font-weight: 600;
      transition: background 0.15s;
    }
    .rm-more-item.active { color: #78c8ff; background: rgba(120,200,255,0.08); border-color: rgba(120,200,255,0.2); }
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
  .rm-detail-panel {
    position: fixed; top: 0; right: 0; width: 340px; height: 100vh;
    overflow-y: auto; z-index: 100;
  }
  @media (max-width: 640px) {
    .rm-detail-panel { width: 100vw !important; left: 0 !important; overflow-y: hidden !important; }
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
    .rm-dominion-right { order: -1; }
  }

  /* ── FILTER BAR ── */
  .rm-filter-bar { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  @media (max-width: 640px) {
    .rm-filter-bar { flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 6px; }
    .rm-filter-bar::-webkit-scrollbar { display: none; }
    .rm-filter-bar select { flex-shrink: 0; min-width: 90px; font-size: 12px; }
    .rm-filter-bar input { flex-shrink: 0; min-width: 130px; font-size: 12px; }
    .rm-filter-bar span { flex-shrink: 0; }
  }

  /* ── BENCH GRID ── */
  @media (max-width: 640px) {
    .rm-bench-grid { grid-template-columns: repeat(2, 1fr) !important; }
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
const ROLE_ICONS = { Warrior:"⚔️",Ranger:"🏹",Mage:"🔮",Rogue:"🗡️",Cleric:"✨",Paladin:"🛡️" };
const RACE_ICONS = { Human:"👤",Elf:"🧝",Dwarf:"⛏️","Half-Orc":"💪",Gnome:"🔧",Tiefling:"😈",Dragonborn:"🐉" };

// ── LIFE STAGE SYSTEM ─────────────────────────────────────────────────────
// Heroes progress through 5 stages over a 12-season (504-week) career.
// No numeric age — players see stage name + progress % only.
// All races have identical career length. Race affects style (future), not duration.

const STAGE_ORDER = ["prospect","rising","peak","fading","veteran"];

const STAGE_DEFS = {
  prospect: { id:"prospect", label:"Prospect", icon:"🌱", color:"#a78bfa", weeks:84,  progressPerWeek:100/84  },
  rising:   { id:"rising",   label:"Rising",   icon:"📈", color:"#78c8ff", weeks:84,  progressPerWeek:100/84  },
  peak:     { id:"peak",     label:"Peak",      icon:"⚡", color:"#a8ff78", weeks:126, progressPerWeek:100/126 },
  fading:   { id:"fading",   label:"Fading",    icon:"📉", color:"#ffd966", weeks:126, progressPerWeek:100/126 },
  veteran:  { id:"veteran",  label:"Veteran",   icon:"🕯️", color:"#ff9f43", weeks:84,  progressPerWeek:100/84  },
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
function agePhaseLabel(p){ return {prospect:"🌱 Prospect",rising:"📈 Rising",peak:"⚡ Peak",fading:"📉 Fading",veteran:"🕯️ Veteran"}[p]||p; }
function agePhaseColor(p){ return {prospect:"#a78bfa",rising:"#78c8ff",peak:"#a8ff78",fading:"#ffd966",veteran:"#ff9f43"}[p]||"#888"; }

// Recalculate a hero's market value based on current stats and level.
function calcHeroValue(hero) {
  const ALL_STAT_KEYS = Object.values(STAT_GROUPS).flat();
  const statVals = ALL_STAT_KEYS.map(s=>hero.stats[s]||0);
  const avg = statVals.reduce((a,b)=>a+b,0)/statVals.length;
  const tier = hero.marketTier;
  const base = Math.floor(avg * 7 * (1 + (hero.level||0) * 0.32));
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
const PHYSICAL_STATS = ["Strength","Agility","Endurance","Accuracy","Defense","Magic Power"];
const MENTAL_STATS   = ["Tactics","Composure","Leadership","Determination","Adaptability"];

const STAT_GROUPS = {
  Combat:["Strength","Agility","Endurance","Accuracy","Defense","Magic Power","Magic Resist"],
  Mental:["Tactics","Composure","Leadership","Determination","Adaptability"],
  Social:["Charisma","Negotiation","Intimidation","Reputation"],
  Hidden:["Potential","Form"],
};
const ALL_STATS = Object.values(STAT_GROUPS).flat();
const XP_PER_LEVEL = [0,100,250,450,700,1000,1400,1900,2500,3200,4000,5200,6600,8200,10000,12000];
const MAX_LEVEL = 15;

// ─── HAPPINESS SYSTEM ────────────────────────────────────────────────────────
//
// Happiness (0–100) is SEPARATE from morale:
//   morale    = combat readiness, fluctuates with wins/losses
//   happiness = loyalty/satisfaction, driven by management decisions
//
// Low happiness causes:  -15% stat contribution per tier below 50, morale drain, eventual walkout
// High happiness causes:  +10% stat bonus, XP boost, clutch factor increase


function moraleLabel(m){
  if(m>=80) return {label:"😄 High",       color:"#a8ff78"};
  if(m>=60) return {label:"😐 Stable",     color:"#78c8ff"};
  if(m>=40) return {label:"😟 Low",        color:"#ffd966"};
  if(m>=20) return {label:"😠 Very Low",   color:"#ff9f43"};
  return           {label:"🤬 Critical",   color:"#ff4444"};
}

function potentialBucket(potential) {
  if(potential >= 83) return { label:"Elite",  color:"#ffd966", icon:"⭐" };
  if(potential >= 66) return { label:"High",   color:"#a8ff78", icon:"🔼" };
  if(potential >= 41) return { label:"Medium", color:"#78c8ff", icon:"➡️" };
  return                     { label:"Low",    color:"#ff9f43", icon:"🔽" };
}

// ─── CONTRACT DEMAND ENGINE ──────────────────────────────────────────────────

// Calculates what a hero will demand on renewal
function calcDemand(hero) {
  const phase = agePhase(hero);
  const avgCombat = STAT_GROUPS.Combat.reduce((a,s)=>a+hero.stats[s],0)/STAT_GROUPS.Combat.length;
  const avgMental = STAT_GROUPS.Mental.reduce((a,s)=>a+hero.stats[s],0)/STAT_GROUPS.Mental.length;
  const avgStats  = (avgCombat*0.6 + avgMental*0.4);

  // Base: steeper scaling so high-level peak heroes are genuinely expensive
  let base = Math.floor(avgStats * (0.9 + hero.level * 0.12));

  // Phase modifier — declining/veteran heroes know their value is dropping
  const phaseMult = {prospect:0.80, rising:0.95, peak:1.30, fading:0.75, veteran:0.55}[phase] ?? 1.0;
  base = Math.floor(base * phaseMult);

  if(hero.traits?.includes("Greedy"))    base = Math.floor(base * 1.30);
  if(hero.traits?.includes("Loyal"))     base = Math.floor(base * 0.80);
  if(hero.traits?.includes("Inspiring")) base = Math.floor(base * 1.10);
  if(hero.traits?.includes("Stubborn"))  base = Math.floor(base * 1.15);
  if(hero.traits?.includes("Coward"))    base = Math.floor(base * 0.90);

  if(hero.morale < 40) base = Math.floor(base * (1 + (40 - hero.morale) / 100));

  const negStat = hero.stats["Negotiation"] || 0;
  if(negStat > 20) {
    // High Negotiation heroes know their worth — they demand more
    const negPremium = Math.min(0.20, (negStat - 20) / 79 * 0.20);
    base = Math.floor(base * (1 + negPremium));
  }

  // High Negotiation heroes prefer shorter contracts — they keep options open
  const negYearsReduction = negStat > 40 ? 1 : 0;
  const years = Math.max(1, (phase==="peak"||phase==="rising" ? rand(2,4) : rand(1,2)) - negYearsReduction);

  // Fading and veteran heroes: demand can be below current salary
  // (they're grateful for the work — but they'll take a pay cut)
  // Peak/prime: always at least their current salary (they have options)
  const minSalary = ["fading","veteran"].includes(phase)
    ? Math.floor(hero.salary * 0.7)  // happy to take 30% less than current
    : hero.salary;                    // won't accept less than what they have

  return { salary: Math.max(minSalary, base), years, negStat };
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
    icon:"⚔️",
    flavour:"The underground circuit asks no questions. It pays in blood and gold.",
    stats:["Strength","Endurance"],
    heroesNeeded:1,
    awayWeeks:[2,2],
    commitment:"low",
    reward:{ goldRange:[450,700], traitChance:"Brave" },
    rewardDesc:"900–1,400g + Brave trait chance",
  },
  {
    id:"grand_colosseum",
    theme:"arena",
    title:"The Grand Colosseum",
    icon:"🏟️",
    flavour:"The crown's arena. To fight here is to be remembered.",
    stats:["Strength","Agility","Composure"],
    heroesNeeded:1,
    awayWeeks:[3,3],
    commitment:"medium",
    reward:{ goldRange:[900,1400], xp:"large" },
    rewardDesc:"1,800–2,800g + large XP",
  },
  {
    id:"gauntlet_of_blades",
    theme:"arena",
    title:"The Gauntlet of Blades",
    icon:"🗡️",
    flavour:"The Gauntlet doesn't care who you are. It only cares whether you can still stand at the end.",
    stats:["Agility","Defense"],
    heroesNeeded:2,
    awayWeeks:[3,3],
    commitment:"high",
    reward:{ goldRange:[1200,1800], xp:"medium", xpBoth:true },
    rewardDesc:"2,400–3,600g + XP to both",
  },
  {
    id:"beast_pits",
    theme:"arena",
    title:"The Beast Pits",
    icon:"🐺",
    flavour:"Something old and hungry lives beneath the arena. They want to see if you're faster.",
    stats:["Agility","Determination"],
    heroesNeeded:1,
    awayWeeks:[2,2],
    commitment:"low",
    reward:{ goldRange:[350,550], traitChance:"Resilient" },
    rewardDesc:"700–1,100g + Resilient trait chance",
  },
  {
    id:"champions_invitation",
    theme:"arena",
    title:"The Champion's Invitation",
    icon:"🎖️",
    flavour:"A reigning champion has named your warrior specifically. Refusing is its own kind of cowardice.",
    stats:["Strength","Intimidation"],
    heroesNeeded:1,
    awayWeeks:[3,3],
    commitment:"medium",
    reward:{ goldRange:[600,1000], traitChance:"Berserker", traitChanceAlt:"Brave" },
    rewardDesc:"1,200–2,000g + Berserker or Brave trait chance",
  },

  // ── THE WILDS ─────────────────────────────────────────────────────────────
  {
    id:"unmapped_passes",
    theme:"wilds",
    title:"The Unmapped Passes",
    icon:"🏔️",
    flavour:"The cartographers will pay well. The mountains will take what they're owed.",
    stats:["Endurance","Determination"],
    heroesNeeded:2,
    awayWeeks:[4,4],
    commitment:"high",
    reward:{ goldRange:[1400,2100], xp:"medium", xpBoth:true, traitChance:"Resilient", traitChanceAlt:"Iron Will", traitBoth:true },
    rewardDesc:"2,800–4,200g + XP + Resilient/Iron Will trait chance to both",
  },
  {
    id:"hunters_wage",
    theme:"wilds",
    title:"The Hunter's Wage",
    icon:"🏹",
    flavour:"Something is hunting the trade roads. The villages pooled what little they have.",
    stats:["Accuracy","Agility"],
    heroesNeeded:1,
    awayWeeks:[2,2],
    commitment:"low",
    reward:{ goldRange:[400,650], xp:"small" },
    rewardDesc:"800–1,300g + XP",
  },
  {
    id:"frozen_expedition",
    theme:"wilds",
    title:"The Frozen Expedition",
    icon:"❄️",
    flavour:"No one maps the northern wastes willingly. The pay reflects that.",
    stats:["Endurance","Adaptability"],
    heroesNeeded:2,
    awayWeeks:[4,4],
    commitment:"high",
    reward:{ goldRange:[1400,2100], xp:"medium", xpBoth:true, statBoost:"Determination", statBoostBoth:true },
    rewardDesc:"2,800–4,200g + XP + Determination boost to both",
  },
  {
    id:"dragons_shadow",
    theme:"wilds",
    title:"The Dragon's Shadow",
    icon:"🐲",
    flavour:"Scholars need escort into the deep mountains. The shadows up there move wrong.",
    stats:["Magic Resist","Determination"],
    heroesNeeded:1,
    awayWeeks:[3,3],
    commitment:"medium",
    reward:{ goldRange:[600,1000], statBoost:"Magic Resist", xp:"small" },
    rewardDesc:"1,200–2,000g + Magic Resist boost + XP",
  },
  {
    id:"cursed_ruin",
    theme:"wilds",
    title:"The Cursed Ruin",
    icon:"🏛️",
    flavour:"Treasure hunters found something they couldn't bring back alone. Or wouldn't.",
    stats:["Determination","Adaptability"],
    heroesNeeded:1,
    awayWeeks:[2,2],
    commitment:"low",
    reward:{ goldRange:[350,700] },
    rewardDesc:"700–1,400g",
  },

  // ── THE COURTS ────────────────────────────────────────────────────────────
  {
    id:"high_council_seat",
    theme:"courts",
    title:"The High Council Seat",
    icon:"👑",
    flavour:"A seat at the council is worth more than a battlefield. The right voice can move armies.",
    stats:["Leadership","Charisma"],
    heroesNeeded:1,
    awayWeeks:[3,3],
    commitment:"medium",
    reward:{ goldRange:[600,1000], statBoost:"Leadership", xp:"small" },
    rewardDesc:"1,200–2,000g + Leadership boost + XP",
  },
  {
    id:"trade_dispute",
    theme:"courts",
    title:"The Trade Dispute",
    icon:"⚖️",
    flavour:"Two merchant houses stand at the edge of open conflict. One clever arbitrator could end it.",
    stats:["Negotiation","Charisma"],
    heroesNeeded:1,
    awayWeeks:[2,2],
    commitment:"low",
    reward:{ goldRange:[600,950] },
    rewardDesc:"1,200–1,900g",
  },
  {
    id:"hostage_negotiation",
    theme:"courts",
    title:"The Hostage Negotiation",
    icon:"📜",
    flavour:"A noble's heir has been taken. The family wants them back quietly. No soldiers.",
    stats:["Negotiation","Composure"],
    heroesNeeded:1,
    awayWeeks:[3,3],
    commitment:"medium",
    reward:{ goldRange:[1000,1500] },
    rewardDesc:"2,000–3,000g",
  },
  {
    id:"warlords_banquet",
    theme:"courts",
    title:"The Warlord's Banquet",
    icon:"🍖",
    flavour:"Powerful men invite you to their table for one reason — to decide if you're a threat or an opportunity.",
    stats:["Intimidation","Composure"],
    heroesNeeded:1,
    awayWeeks:[2,2],
    commitment:"low",
    reward:{ goldRange:[350,550], statBoost:"Intimidation" },
    rewardDesc:"700–1,100g + Intimidation boost",
  },
  {
    id:"royal_address",
    theme:"courts",
    title:"The Royal Address",
    icon:"🏰",
    flavour:"The crown requires a representative of exceptional bearing to tour the outer provinces.",
    stats:["Charisma","Leadership","Reputation"],
    heroesNeeded:1,
    awayWeeks:[4,4],
    commitment:"medium",
    reward:{ goldRange:[800,1300], statBoost:"Charisma", xp:"small" },
    rewardDesc:"1,600–2,600g + Charisma boost + XP",
  },

  // ── THE ARCANE ────────────────────────────────────────────────────────────
  {
    id:"arcane_guild_trial",
    theme:"arcane",
    title:"The Arcane Guild Trial",
    icon:"🔮",
    flavour:"The Guild admits only those who can demonstrate true mastery. The test is not gentle.",
    stats:["Magic Power","Magic Resist"],
    heroesNeeded:1,
    awayWeeks:[2,2],
    commitment:"low",
    reward:{ goldRange:[350,700], xp:"large", traitChance:"Tactician" },
    rewardDesc:"700–1,400g + large XP + Tactician trait chance",
  },
  {
    id:"plague_ward",
    theme:"arcane",
    title:"The Plague Ward",
    icon:"⚕️",
    flavour:"The illness is spreading. A healer of real power is the only hope these people have.",
    stats:["Magic Resist","Composure"],
    heroesNeeded:1,
    awayWeeks:[2,2],
    commitment:"low",
    reward:{ goldRange:[350,700], xp:"small", healFatigue:true },
    rewardDesc:"700–1,400g + XP + fatigue fully recovered on return",
  },
  {
    id:"oracles_chamber",
    theme:"arcane",
    title:"The Oracle's Chamber",
    icon:"🌙",
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
    icon:"📚",
    flavour:"The scholars need protection. The archive needs cataloguing. Neither task is safe.",
    stats:["Magic Resist","Tactics"],
    heroesNeeded:2,
    awayWeeks:[4,4],
    commitment:"high",
    reward:{ goldRange:[1400,2100], statBoost:"Magic Resist", statBoostBoth:true, xp:"medium", xpBoth:true },
    rewardDesc:"2,800–4,200g + Magic Resist boost to both + XP to both",
  },
  {
    id:"sealed_circle",
    theme:"arcane",
    title:"The Sealed Circle",
    icon:"⭕",
    flavour:"Something was contained here long ago. The seal is weakening. Someone with real power needs to reinforce it.",
    stats:["Magic Power","Magic Resist"],
    heroesNeeded:2,
    awayWeeks:[3,3],
    commitment:"high",
    reward:{ goldRange:[1000,1600], xp:"medium", xpBoth:true, traitChance:"Blessed", traitBoth:true },
    rewardDesc:"2,000–3,200g + XP to both + Blessed trait chance",
  },

  // ── THE SHADOWS ───────────────────────────────────────────────────────────
  {
    id:"shadow_vault",
    theme:"shadows",
    title:"The Shadow Vault",
    icon:"🗝️",
    flavour:"The map showed a sealed chamber. The guild wants what's inside. You want a cut.",
    stats:["Agility","Determination"],
    heroesNeeded:1,
    awayWeeks:[2,2],
    commitment:"low",
    reward:{ goldRange:[350,700] },
    rewardDesc:"700–1,400g",
  },
  {
    id:"marked_target",
    theme:"shadows",
    title:"The Marked Target",
    icon:"🎯",
    flavour:"Someone important has made powerful enemies. Your hero has been given a name and a purse.",
    stats:["Determination","Adaptability"],
    heroesNeeded:1,
    awayWeeks:[3,3],
    commitment:"medium",
    reward:{ goldRange:[600,1000] },
    rewardDesc:"1,200–2,000g",
  },
  {
    id:"spys_gambit",
    theme:"shadows",
    title:"The Spy's Gambit",
    icon:"👁️",
    flavour:"The crown's shadow network needs someone who can disappear into a foreign court and return with answers.",
    stats:["Charisma","Reputation"],
    heroesNeeded:1,
    awayWeeks:[3,3],
    commitment:"medium",
    reward:{ goldRange:[500,800], statBoost:"Reputation" },
    rewardDesc:"1,000–1,600g + Reputation boost",
  },
  {
    id:"cult_unmasking",
    theme:"shadows",
    title:"The Cult Unmasking",
    icon:"🌑",
    flavour:"They're hiding in plain sight. Finding them requires patience and nerve. Two minds are safer than one.",
    stats:["Adaptability","Composure"],
    heroesNeeded:2,
    awayWeeks:[3,3],
    commitment:"high",
    reward:{ goldRange:[1000,1600], xp:"medium", xpBoth:true },
    rewardDesc:"2,000–3,200g + XP to both",
  },
  {
    id:"underworld_exchange",
    theme:"shadows",
    title:"The Underworld Exchange",
    icon:"💰",
    flavour:"An anonymous client. An anonymous package. Anonymous gold. Ask no questions.",
    stats:["Negotiation","Agility"],
    heroesNeeded:1,
    awayWeeks:[2,2],
    commitment:"low",
    reward:{ goldRange:[600,1000] },
    rewardDesc:"1,200–2,000g",
  },
];

const SPECIAL_EVENTS = [
  {
    id:"wandering_master",
    title:"The Wandering Master",
    icon:"🧙",
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
    icon:"⚔️",
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

function calcRelativeStars(opponentPower, tierId) {
  const tier = TIERS[tierId];
  if(!tier) return 3;
  const { powerMin, powerMax } = tier;
  const position = (opponentPower - powerMin) / Math.max(1, powerMax - powerMin);
  const clamped = Math.min(1, Math.max(0, position));
  return clamped < 0.2 ? 1 : clamped < 0.4 ? 2 : clamped < 0.6 ? 3 : clamped < 0.8 ? 4 : 5;
}

function renderStars(stars) {
  return "★".repeat(stars) + "☆".repeat(5 - stars);
}

function starsColor(stars) {
  return stars <= 2 ? "#a8ff78" : stars === 3 ? "#ffd966" : stars === 4 ? "#ff9f43" : "#ff7878";
}

function calcMatchScore(hero, eventDef) {
  const stats = eventDef.stats || [];
  if(!stats.length) return 1.0;
  const heroAvg = stats.reduce((a,s) => a + (hero.stats[s]||0), 0) / stats.length;
  const reqAvg  = stats.reduce((a,s) => a + (EVENT_STAT_MIDPOINTS[s]||50), 0) / stats.length;
  return reqAvg > 0 ? heroAvg / reqAvg : 1.0;
}

function getEventConfidence(matchScore) {
  if(matchScore >= 1.15) return { label:"Strong",   color:"#a8ff78", icon:"🟢" };
  if(matchScore >= 0.75) return { label:"Possible",  color:"#ffd966", icon:"🟡" };
  return                        { label:"Longshot",  color:"#ff7878", icon:"🔴" };
}

// Fluid success probability — hidden from player, drives outcome roll
function calcEventSuccessChance(matchScore) {
  const success = Math.min(0.82, Math.max(0.10, matchScore * 0.58));
  const failure = Math.min(0.65, Math.max(0.05, (1 - matchScore) * 0.65));
  const partial = Math.max(0.05, 1 - success - failure);
  return { success, partial, failure };
}

function getAvailableHeroes(heroes) {
  return heroes.filter(h => !h.injured && !h.retired && !(h.awayWeeks > 0));
}

function generateRandomEvent(heroes, week) {
  const available = getAvailableHeroes(heroes);
  if(!available.length) return null;
  // All events are always candidates — no qualification gate
  const template = pick(RANDOM_EVENTS);
  const gold = template.reward.goldRange
    ? rand(...template.reward.goldRange)
    : 0;
  return { ...template, gold, week, id:`${template.id}_${week}` };
}
// Heroes accumulate fatigue (0–100) from raiding. High fatigue reduces combat
// score and increases injury risk. Bench rest recovers fatigue each week.
// Endurance stat slows fatigue gain; Infirmary building speeds recovery.

const GAME_SPEEDS = {
  swift: {
    id:           "swift",
    label:        "Swift Campaign",
    tagline:      "Rank up faster, shorter seasons",
    seasonLength: 21,
    rankStep:     2,
    xpMult:       1.5,
    ageMult:      2,
  },
  standard: {
    id:           "standard",
    label:        "Grand Dynasty",
    tagline:      "The full manager experience",
    seasonLength: 42,
    rankStep:     1,
    xpMult:       1.0,
    ageMult:      1,
  },
};

// Active game speed — read from save, defaults to standard
// All time-sensitive constants reference this rather than raw values
let ACTIVE_SPEED = GAME_SPEEDS.standard; // overwritten after save load
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
    icon:     "🏆",
    check:    ()=>true, // always awarded on Legacy Ceremony
    boon: {
      id:     "iron_dynasty",
      name:   "Conqueror's Coffers",
      desc:   "Begin the run with +1,000g — a generous war chest.",
      icon:   "💰",
      apply:  (state)=>({...state, gold: (state.gold||4000)+1000 }),
    },
  },
  {
    id:       "undefeated",
    name:     "Undefeated Season",
    desc:     "Win a full season with zero losses",
    icon:     "🛡️",
    check:    (data)=>data.trophies.some(t=>t.losses===0),
    boon: {
      id:     "undefeated",
      name:   "Battle-Hardened Squad",
      desc:   "All starting heroes begin with +10 morale.",
      icon:   "⚔️",
      apply:  (state)=>({...state, heroes: state.heroes.map(h=>({...h,morale:Math.min(100,h.morale+10)}))}),
    },
  },
  {
    id:       "full_house",
    name:     "Full House",
    desc:     "Construct all 10 buildings in one run",
    icon:     "🏰",
    check:    (data)=>data.buildings.every(b=>b.built),
    boon: {
      id:     "full_house",
      name:   "Pre-Built Barracks",
      desc:   "Start the run with the Barracks already constructed.",
      icon:   "🏗️",
      apply:  (state)=>({...state, buildings: state.buildings.map(b=>b.id==="barracks"?{...b,built:true}:b)}),
    },
  },
  {
    id:       "legend_retires",
    name:     "Legend Retires",
    desc:     "Have a hero reach Level 13 and retire in the same run",
    icon:     "🌟",
    check:    (data)=>data.retiredMax13,
    boon: {
      id:     "legend_retires",
      name:   "Veteran Recruit",
      desc:   "One starting hero begins at Level 3 with boosted stats.",
      icon:   "⭐",
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
    icon:     "📈",
    check:    (data)=>data.everPromoted,
    boon: {
      id:     "first_promotion",
      name:   "Seasoned Scout",
      desc:   "The starting market includes one guaranteed Peak-stage hero — battle-ready from day one.",
      icon:   "🔭",
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
    desc:     "Accumulate 100,000g at any point in a run",
    icon:     "🏦",
    check:    (data)=>data.peakGold>=100000,
    boon: {
      id:     "golden_vault",
      name:   "Long-Term Deals",
      desc:   "All starting heroes have double contract length — fewer renewals to manage early.",
      icon:   "📜",
      apply:  (state)=>({...state, heroes: state.heroes.map(h=>({...h, contractWeeksLeft:(h.contractWeeksLeft||24)*2}))}),
    },
  },
  {
    id:       "ability_scout",
    name:     "Ability Scout",
    desc:     "Successfully mitigate 100 enemy abilities in a run",
    icon:     "🛡️",
    check:    (data)=>(data.abilitiesMitigated||0)>=100,
    boon: {
      id:     "ability_scout",
      name:   "Battle-Sharp",
      desc:   "All starting heroes begin with Form 8/10 — already in good shape.",
      icon:   "⚡",
      apply:  (state)=>({...state, heroes: state.heroes.map(h=>({...h, stats:{...h.stats, Form:Math.max(h.stats.Form||5, 8)}}))}),
    },
  },
  {
    id:       "transfer_king",
    name:     "Transfer King",
    desc:     "Sell 15 heroes in a single run",
    icon:     "🔄",
    check:    (data)=>(data.heroesSold||0)>=15,
    boon: {
      id:     "transfer_king",
      name:   "Well-Rounded Roster",
      desc:   "Starting squad has guaranteed role coverage — one Warrior, one Ranger, one Mage, one Cleric, one Rogue, one Paladin.",
      icon:   "🎯",
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
    desc:     "Win raids with 3 different race synergies active in one run",
    icon:     "✨",
    check:    (data)=>Object.keys(data.raceSynergyUsage||{}).length>=3,
    boon: {
      id:     "synergy_master",
      name:   "United Bloodline",
      desc:   "Choose your starting squad's race — all 8 starting heroes share the same race.",
      icon:   "🧬",
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

function generateStartingSquad() {
  const squad = [];

  // ── STAR HERO (slot 0) ────────────────────────────────────────────────────
  // Always early-to-mid Peak — their best years just beginning
  const star = generateHero(0);
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
  starStats.Form = rand(4,7);
  const starTraits = pickN(TRAITS, rand(2,3));
  const starAvg = Object.values(starStats).reduce((a,b)=>a+b,0)/ALL_STATS.length;
  const starContract = rand(1,3);
  squad.push({
    ...star,
    stage: starStage,
    stageProgress: starProgress,
    stats: starStats,
    traits: starTraits,
    value: Math.max(80, Math.floor(starAvg * 7 * (1 + 0 * 0.32) + rand(-20,20))),
    salary: Math.floor(starAvg*rand(13,16)/10),
    contractYears: starContract,
    contractWeeks: starContract*WEEKS_PER_CONTRACT_YEAR,
    contractWeeksLeft: starContract*WEEKS_PER_CONTRACT_YEAR,
    foundling: true,
  });

  // ── GUARANTEED ROLE COVERAGE (slots 1–3) ─────────────────────────────────
  // One hero per key position so the player can always field a basic formation.
  // ── GUARANTEED ROLE COVERAGE (slots 1–3) ─────────────────────────────────
  // Rising to early Peak — capable but developing
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
    stats.Form = rand(3,7);
    squad.push({...h, stage, stageProgress, stats});
  });

  // ── RANDOM NORMAL HEROES (slots 4–7) ─────────────────────────────────────
  // Prospect to early Rising — raw but varied
  for(let i=4; i<8; i++){
    const h = generateHero(i);
    const isSolid = Math.random() < 0.25;
    const pot = isSolid ? rand(48,60) : rand(35,50);
    const cw = isSolid
      ? stageToCareerWeek("rising", rand(0, 50))
      : stageToCareerWeek("prospect", rand(30, 90));
    const { stage, stageProgress } = careerWeekToStage(cw);
    const stats = {...h.stats, Potential: pot};
    ALL_STATS.forEach(s => {
      if(["Potential","Form"].includes(s)) return;
      const lo = Math.max(10, Math.floor(pot*0.25));
      const hi = Math.max(lo, Math.floor(pot*0.50));
      stats[s] = Math.max(10, Math.min(pot, rand(lo,hi)));
    });
    stats.Form = rand(3,7);
    squad.push({...h, stage, stageProgress, stats});
  }

  // ── FODDER (slots 8–9) ────────────────────────────────────────────────────
  // Prospect — clearly throwaway
  for(let i=8; i<10; i++){
    const h = generateHero(Date.now()+i);
    const fodderPot = rand(18, 30);
    const cw = stageToCareerWeek("prospect", rand(10, 60));
    const { stage, stageProgress } = careerWeekToStage(cw);
    const fodderStats = {...h.stats, Potential: fodderPot};
    ALL_STATS.forEach(s => {
      if(["Potential","Form"].includes(s)) return;
      fodderStats[s] = Math.max(10, Math.min(fodderPot, Math.floor(fodderPot*rand(25,50)/100)));
    });
    fodderStats.Form = rand(2,5);
    const fodderAvg = Object.values(fodderStats).reduce((a,b)=>a+b,0)/ALL_STATS.length;
    squad.push({
      ...h,
      stage, stageProgress,
      stats: fodderStats,
      traits: pickN(TRAITS, 1),
      salary: Math.floor(fodderAvg*rand(11,14)/10),
      value: Math.max(30, Math.floor(fodderAvg*4 + rand(-10,10))),
      contractYears: 1,
      contractWeeks: WEEKS_PER_CONTRACT_YEAR,
      contractWeeksLeft: WEEKS_PER_CONTRACT_YEAR,
      fodder: true,
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
const FATIGUE_WARN = 70;            // yellow warning threshold
const FATIGUE_CRITICAL = 88;        // red — major penalty + injury risk spike

// Fatigue multiplier on combat score: 0 fatigue = 1.0, 100 = 0.55
function fatigueMult(fatigue) {
  return Math.max(0.55, 1.0 - (fatigue / 100) * 0.45);
}

function fatigueLabel(f) {
  if (f <= 30) return { label:"Fresh",    color:"#a8ff78" };
  if (f <= 55) return { label:"Tired",    color:"#ffd966" };
  if (f <= FATIGUE_WARN) return { label:"Fatigued",color:"#ff9f43" };
  if (f <= FATIGUE_CRITICAL) return { label:"Exhausted",color:"#ff7878" };
  return                     { label:"Burned Out",color:"#ff4444" };
}

const POSITIONS = {
  Vanguard:   { label:"Vanguard",   subtitle:"Frontline breakers",  icon:"🗡️", color:"#ff7878", slots:2, ideal:["Warrior","Paladin","Half-Orc","Dwarf"],        penalty:["Mage","Bard"],     primaryStats:["Strength","Endurance","Defense","Intimidation"],               desc:"Heavy melee. Warriors & Paladins thrive. Mages & Bards suffer severe penalties." },
  Skirmisher: { label:"Skirmisher", subtitle:"Flankers & ambushers", icon:"🏹", color:"#ffd966", slots:2, ideal:["Ranger","Rogue","Elf","Tiefling"],             penalty:["Paladin","Cleric"], primaryStats:["Agility","Accuracy","Determination","Adaptability"],           desc:"Fast flankers. Rangers & Rogues excel. Heavy armour is sluggish here." },
  Arbiter:    { label:"Arbiter",    subtitle:"Command & support",    icon:"✨", color:"#78c8ff", slots:2, ideal:["Mage","Cleric","Gnome","Dragonborn"],   penalty:["Warrior"],         primaryStats:["Magic Power","Magic Resist","Tactics","Leadership","Composure"], desc:"Rear command. Mages & Clerics dominate. Brutes have no place here." },
};
const POS_KEYS = Object.keys(POSITIONS);

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

// Race pairing bonuses — applied within a position, stacks with role pairing.
// Position-agnostic: race chemistry is about the heroes, not the lane.
// Calibrated to contribute ~×1.04 max toward the ×1.5 total tactical ceiling.
const RACE_PAIRINGS = [
  // Compatible pairs
  { races:["Dwarf","Half-Orc"],   mult:1.03 },
  { races:["Human","Elf"],        mult:1.03 },
  { races:["Gnome","Tiefling"],   mult:1.04 },
  { races:["Human","Dragonborn"], mult:1.02 },
  { races:["Dwarf","Gnome"],      mult:1.03 },
  { races:["Elf","Tiefling"],     mult:1.02 },
  // Friction pairs
  { races:["Elf","Half-Orc"],     mult:0.97 },
  { races:["Elf","Dragonborn"],   mult:0.98 },
  { races:["Gnome","Half-Orc"],   mult:0.98 },
];
const SAME_RACE_BONUS = 1.04; // same race unity — slightly less than best compatible

// Calculate position score for 1 or 2 heroes.
// With 2 heroes: primary (higher score) ×1.25, support ×0.75, then role pairing bonus, then race pairing bonus.
// Returns { score, primaryHero, supportHero, pairingMult, raceMult }
function calcPositionScore(heroes, pos) {
  const valid = (heroes||[]).filter(Boolean);
  if(valid.length === 0) return { score:0, primaryHero:null, supportHero:null, pairingMult:1.0, raceMult:1.0 };

  const scored = valid.map(h => ({ h, s:calcHeroCombatScore(h, pos) }))
                       .sort((a,b) => b.s - a.s);

  let score, primaryHero, supportHero, pairingMult = 1.0, raceMult = 1.0;

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

    // Race pairing bonus
    if(primaryHero.race === supportHero.race) {
      raceMult = SAME_RACE_BONUS;
    } else {
      const races = [primaryHero.race, supportHero.race].sort();
      const racePairing = RACE_PAIRINGS.find(p =>
        [...p.races].sort().join() === races.join()
      );
      if(racePairing) raceMult = racePairing.mult;
    }
    score *= raceMult;
  }

  return { score, primaryHero, supportHero, pairingMult, raceMult };
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
    Strength:        0.30,
    Endurance:       0.23,
    Defense:         0.21,
    Determination:   0.09,
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

// Returns a single combat score for one hero in a given position.
function calcHeroCombatScore(hero, pos) {
  const traits = hero.traits || [];
  const weights = (pos && POSITION_WEIGHTS[pos]) ? POSITION_WEIGHTS[pos] : POSITION_WEIGHTS.Vanguard;

  // Position-weighted stat sum
  let score = 0;
  Object.entries(weights).forEach(([stat, weight]) => {
    let w = weight;
    if(stat === "Accuracy" && traits.includes("Eagle Eye")) w *= 2;
    if(stat === "Composure" && traits.includes("Calm"))     w *= 2;
    score += (hero.stats[stat] || 0) * w;
  });

  // Ideal role: small +10% bonus for being in your natural position.
  // No penalty for wrong role — the weights already punish it naturally.
  if(pos && POSITIONS[pos]) {
    const pd = POSITIONS[pos];
    const isIdeal = pd.ideal.includes(hero.role) || pd.ideal.includes(hero.race);
    if(isIdeal) score *= 1.10;
  }

  // ── TRAIT COMBAT MODIFIERS ──────────────────────────────────────────────
  if(traits.includes("Berserker"))  score *= pos === "Vanguard"    ? 1.20 : 0.95;
  if(traits.includes("Glass Cannon")) score *= 1.25;
  if(traits.includes("Tactician"))  score *= pos === "Arbiter"     ? 1.15 : 1.0;
  if(traits.includes("Swift"))      score *= pos === "Skirmisher"  ? 1.15 : 1.0;
  if(traits.includes("Blessed"))    score *= 1.05;
  if(traits.includes("Cursed"))     score *= 0.90;

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

function analyseFormation(formation){
  // Race synergy — the only formation-wide multiplier now.
  // Role/race pairings are handled per-position in calcPositionScore.
  const raceSynergy = calcRaceSynergy(formation);
  const mult = raceSynergy ? Math.min(1.5, raceSynergy.ratingMult) : 1.0;

  const heroMods={};
  POS_KEYS.forEach(pos=>{
    const pd=POSITIONS[pos];
    (formation[pos]||[]).forEach(h=>{
      if(!h)return;
      const isIdeal=pd.ideal.includes(h.role)||pd.ideal.includes(h.race);
      const isPenalty=pd.penalty.includes(h.role);
      heroMods[h.id]={
        fit: isIdeal?"ideal":isPenalty?"penalty":"neutral",
        statMult: isIdeal?1.10:1.0,
        label: isIdeal?"Natural Fit ✓":isPenalty?"Wrong Position ✗":"Neutral",
      };
    });
  });
  return {active:[], positive:[], negative:[], mult, heroMods, raceSynergy};
}

function calcFormationRating(formation){
  const analysis=analyseFormation(formation);
  let total=0, count=0;
  POS_KEYS.forEach(pos=>{
    (formation[pos]||[]).forEach(h=>{
      if(!h)return;
      total+=calcHeroCombatScore(h,pos);
      count++;
    });
  });
  const base=count>0?total/count:0;
  const effective=base*analysis.mult;
  return {raw:Math.round(base), effective:Math.round(effective), analysis};
}

// ─── WIN CHANCE ENGINE ────────────────────────────────────────────────────────
// Sigmoid ratio: winChance = 1 / (1 + (enemyPower / yourEffective)^k)
// k=2.5 gives a moderately steep curve:
//   Equal (50 vs 50) → 50%    |  2× stronger → ~83%   |  0.5× → ~17%
//   3× stronger → ~91%        |  10× stronger → ~99%  |  10× weaker → ~1%
// Enemy power anchored to match the new hero stat scale.

// ─── TIERED LEAGUE SYSTEM ────────────────────────────────────────────────────
// 5 tiers: Iron → Bronze → Silver → Gold → Platinum
// 8 teams per tier (player + 7 AI). Top 2 promote, bottom 2 relegate each season.
// AI teams regenerated on promotion/relegation. Power randomised each new season.

const TIERS = {
  iron:     { id:"iron",     name:"Iron",     icon:"⚙️",  color:"#9ca3af", powerMin:67,  powerMax:105, difficulty:1, tributeBase:105, xpRange:[20,32] },
  bronze:   { id:"bronze",   name:"Bronze",   icon:"🥉",  color:"#cd7f32", powerMin:93,  powerMax:147, difficulty:2, tributeBase:145, xpRange:[26,40] },
  silver:   { id:"silver",   name:"Silver",   icon:"🥈",  color:"#c0c0c0", powerMin:127, powerMax:199, difficulty:3, tributeBase:240, xpRange:[32,48] },
  gold:     { id:"gold",     name:"Gold",     icon:"🥇",  color:"#ffd966", powerMin:167, powerMax:262, difficulty:4, tributeBase:350, xpRange:[36,56] },
  platinum: { id:"platinum", name:"Platinum", icon:"💎",  color:"#a78bfa", powerMin:207, powerMax:325, difficulty:5, tributeBase:495, xpRange:[40,64] },
};
const TIER_ORDER = ["iron","bronze","silver","gold","platinum"];

// Tribute = tierBase + position bonus (1st gets most, 8th gets base)
// Position bonus scales: 1st +280g, 2nd +200g, 3rd +140g, 4th +80g, 5th-8th +0g
const TIER_POSITION_BONUS = [0, 0, 0, 0, 0, 0, 0, 0]; // flat tribute — no position bonus

function tierTribute(tierId, position) {
  const tier = TIERS[tierId] || TIERS.iron;
  return tier.tributeBase + (TIER_POSITION_BONUS[Math.max(0, position-1)] || 0);
}

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
    "Aurelian","The Crowned Keep","Glorymere","Imperion","Brightcrown",
    "The Gilded Fort","Conquestholm","The Grand Bastion","Valorwall","Kingsreach",
  ],
  platinum: [
    "The Eternal Court","Obsidian Peak","Sovereignty","The Void Throne","Celestia",
    "The Black Citadel","Apex","The Diamond Hold","Dominus","Exalted Keep",
    "The Platinum Crown","Zenith","The Last Bastion","Ascendancy","The Final Hold",
  ],
};

// Generate 7 AI towns for a given tier with randomised power
function generateTierTowns(tierId, existingNames=[]) {
  const tier = TIERS[tierId] || TIERS.iron;
  const pool = [...TIER_NAME_POOLS[tierId]].filter(n => !existingNames.includes(n));
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 7).map(name => ({
    name,
    tierId,
    power: rand(tier.powerMin, tier.powerMax),
    difficulty: tier.difficulty,
    wins: 0,
    losses: 0,
    abilities: assignTownAbilities(tierId),
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

const RACE_SYNERGIES = [
  // ── MONO-RACE: all 6 raiding heroes of same race ───────────────────────────
  {
    id:"mono_elf",    type:"mono",   race:"Elf",
    name:"Elven Unity",      icon:"🌿", color:"#86efac",
    ratingMult:1.10, winBonus:0.05,
    desc:"6 Elves — precision and speed at their peak. Dominant Skirmishers but fragile Vanguard.",
    flavour:"The elves moved as one, silent and devastating.",
    check: h => h.filter(x=>x.race==="Elf").length>=6,
  },
  {
    id:"mono_dwarf",  type:"mono",   race:"Dwarf",
    name:"Dwarven Phalanx",  icon:"⛏️", color:"#fbbf24",
    ratingMult:1.11, winBonus:0.05,
    desc:"6 Dwarves — unbreakable iron wall. Vanguard is near-impenetrable, Skirmishers suffer.",
    flavour:"The Dwarven phalanx ground forward — nothing stopped it.",
    check: h => h.filter(x=>x.race==="Dwarf").length>=6,
  },
  {
    id:"mono_human",  type:"mono",   race:"Human",
    name:"Human Resolve",    icon:"🛡️", color:"#93c5fd",
    ratingMult:1.09, winBonus:0.04,
    desc:"6 Humans — adaptable and resilient. No soft spots, steady across all positions.",
    flavour:"Human tenacity — they just wouldn't quit.",
    check: h => h.filter(x=>x.race==="Human").length>=6,
  },
  {
    id:"mono_halforc",type:"mono",   race:"Half-Orc",
    name:"Orcish Rampage",   icon:"💢", color:"#f87171",
    ratingMult:1.12, winBonus:0.06,
    desc:"6 Half-Orcs — terrifying raw aggression. Shatters frontlines but has no subtlety.",
    flavour:"The Half-Orc charge shook the earth.",
    check: h => h.filter(x=>x.race==="Half-Orc").length>=6,
  },
  {
    id:"mono_tiefling",type:"mono",  race:"Tiefling",
    name:"Infernal Pact",    icon:"😈", color:"#c084fc",
    ratingMult:1.10, winBonus:0.05,
    desc:"6 Tieflings — dark power and guile. Arbiters are supercharged, physical roles thin.",
    flavour:"Infernal energy surged through the Tiefling ranks.",
    check: h => h.filter(x=>x.race==="Tiefling").length>=6,
  },
  {
    id:"mono_gnome",  type:"mono",   race:"Gnome",
    name:"Gnomish Ingenuity", icon:"⚙️", color:"#67e8f9",
    ratingMult:1.09, winBonus:0.04,
    desc:"6 Gnomes — brilliant command and magic. Vanguard is paper-thin.",
    flavour:"Gnomish tactics outsmarted every counter.",
    check: h => h.filter(x=>x.race==="Gnome").length>=6,
  },
  {
    id:"mono_dragonborn",type:"mono",race:"Dragonborn",
    name:"Draconic Might",   icon:"🐉", color:"#fb923c",
    ratingMult:1.12, winBonus:0.06,
    desc:"6 Dragonborn — overwhelming presence and raw power across the board.",
    flavour:"Draconic fire swept the field.",
    check: h => h.filter(x=>x.race==="Dragonborn").length>=6,
  },

  // ── FULL RAINBOW: all 6 raiding heroes of different races ──────────────────
  {
    id:"rainbow",     type:"rainbow",
    name:"Band of Nations",  icon:"🌈", color:"#f0e6d3",
    ratingMult:1.08, winBonus:0.04,
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
    name:"Shadow Pact",      icon:"🌑", color:"#a78bfa",
    ratingMult:1.05, winBonus:0.03,
    desc:"3+ Elves & 3+ Tieflings — dark and swift. Skirmishers and Arbiters reach peak form.",
    flavour:"Shadow and moonlight — an eerie, deadly combination.",
    check: h => h.filter(x=>x.race==="Elf").length>=3 && h.filter(x=>x.race==="Tiefling").length>=3,
  },
  {
    id:"pact_dwarf_halforc", type:"duo",
    name:"Iron Warbond",     icon:"⚒️", color:"#fbbf24",
    ratingMult:1.06, winBonus:0.03,
    desc:"3+ Dwarves & 3+ Half-Orcs — unstoppable Vanguard. The two toughest frontline races.",
    flavour:"Nothing breaches a wall of iron and fury.",
    check: h => h.filter(x=>x.race==="Dwarf").length>=3 && h.filter(x=>x.race==="Half-Orc").length>=3,
  },
  {
    id:"pact_gnome_tiefling",type:"duo",
    name:"Arcane Covenant",  icon:"🔮", color:"#c084fc",
    ratingMult:1.05, winBonus:0.03,
    desc:"3+ Gnomes & 3+ Tieflings — devastating magical command. Arbiter rating skyrockets.",
    flavour:"Arcane intellect fused with infernal power.",
    check: h => h.filter(x=>x.race==="Gnome").length>=3 && h.filter(x=>x.race==="Tiefling").length>=3,
  },
  {
    id:"pact_human_elf",     type:"duo",
    name:"Elder Alliance",   icon:"🤝", color:"#86efac",
    ratingMult:1.05, winBonus:0.02,
    desc:"3+ Humans & 3+ Elves — balanced and reliable. No weaknesses, strong across all positions.",
    flavour:"The oldest alliance — still unbroken.",
    check: h => h.filter(x=>x.race==="Human").length>=3 && h.filter(x=>x.race==="Elf").length>=3,
  },
  {
    id:"pact_dragonborn_halforc",type:"duo",
    name:"Warbeast Pact",    icon:"🐉", color:"#fb923c",
    ratingMult:1.06, winBonus:0.03,
    desc:"3+ Dragonborn & 3+ Half-Orcs — terrifying physical dominance front-to-back.",
    flavour:"Scale and muscle — a wall of living violence.",
    check: h => h.filter(x=>x.race==="Dragonborn").length>=3 && h.filter(x=>x.race==="Half-Orc").length>=3,
  },
  {
    id:"pact_human_dwarf",   type:"duo",
    name:"Order's Vow",      icon:"⚖️", color:"#93c5fd",
    ratingMult:1.05, winBonus:0.02,
    desc:"3+ Humans & 3+ Dwarves — disciplined and dependable. Excellent Vanguard and morale.",
    flavour:"Law and stone — a foundation nothing shakes.",
    check: h => h.filter(x=>x.race==="Human").length>=3 && h.filter(x=>x.race==="Dwarf").length>=3,
  },
];

// Only one race synergy can be active at a time — pick the strongest if multiple match.
// (e.g. can't have both Mono-Elf and Band of Nations)
function calcRaceSynergy(formation) {
  const allHeroes = POS_KEYS.flatMap(p=>(formation[p]||[]).filter(Boolean));
  if(allHeroes.length < 3) return null;

  const matches = RACE_SYNERGIES.filter(s=>s.check(allHeroes));
  if(!matches.length) return null;

  // If rainbow qualifies, also check if a mono beats it — pick highest winBonus
  return matches.reduce((best,s)=>s.winBonus>best.winBonus?s:best, matches[0]);
}

const BUILDINGS = [
  // ── IRON ─────────────────────────────────────────────────────────────────────
  { id:"barracks",  name:"Barracks",         icon:"🏰", cost:1200, tierRequired:"iron",     desc:"Heroes gain +20% XP from raids." },
  { id:"tavern",    name:"Tavern",            icon:"🍺", cost:1000, tierRequired:"iron",     desc:"All heroes +3 morale each week." },
  // ── BRONZE ───────────────────────────────────────────────────────────────────
  { id:"infirmary", name:"Infirmary",         icon:"⚕️",  cost:1000, tierRequired:"bronze",   desc:"Injuries heal 1 week faster." },
  { id:"lodge",     name:"Recovery Lodge",    icon:"🛖", cost:1100, tierRequired:"bronze",   desc:"Bench heroes recover fatigue 60% faster." },
  // ── SILVER ───────────────────────────────────────────────────────────────────
  { id:"trainyard", name:"Training Grounds",  icon:"🎯", cost:1200, tierRequired:"silver",   desc:"Bench heroes earn 20% of that week's battle XP." },
  { id:"network",   name:"Talent Network",    icon:"🔭", cost:1400, tierRequired:"silver",   desc:"Market refreshes every 3 weeks instead of every 6." },
  // ── GOLD ─────────────────────────────────────────────────────────────────────
  { id:"bazaar",    name:"Grand Bazaar",      icon:"🏪", cost:1800, tierRequired:"gold",     desc:"Unlocks premium heroes in the market." },
  { id:"trading",   name:"Trading Post",      icon:"💰", cost:1600, tierRequired:"gold",     desc:"Listed heroes sell at 120% value and attract bids 50% more often." },
  // ── PLATINUM ─────────────────────────────────────────────────────────────────
  { id:"sanctum",   name:"Elite Sanctum",     icon:"💎", cost:2200, tierRequired:"platinum", desc:"Unlocks elite heroes in the market." },
  { id:"legends",   name:"Hall of Legends",   icon:"🏛️", cost:2000, tierRequired:"platinum", desc:"Each retired hero adds weekly morale to your squad, scaled by their level. Cap: +20/week." },
];

const TRAITS = ["Berserker","Tactician","Swift","Resilient","Cursed","Blessed","Coward","Brave","Greedy","Loyal","Hot-headed","Calm","Inspiring","Stubborn","Lucky","Unlucky","Night Vision","Eagle Eye","Iron Will","Glass Cannon"];

const TRAIT_EFFECTS = {
  "Berserker":    {color:"#ff7878", desc:"+20% power in Vanguard · +50% injury risk on defeat"},
  "Tactician":    {color:"#78c8ff", desc:"+15% power in Arbiter"},
  "Swift":        {color:"#a8ff78", desc:"+15% power in Skirmisher · −25% fatigue gain"},
  "Resilient":    {color:"#a8ff78", desc:"−30% fatigue gain · −50% injury risk"},
  "Glass Cannon": {color:"#ff9f43", desc:"+25% power · 2× injury risk"},
  "Blessed":      {color:"#ffd966", desc:"+5% power · extra form recovery"},
  "Cursed":       {color:"#c084fc", desc:"−10% power · random form drain each week"},
  "Brave":        {color:"#a8ff78", desc:"No morale loss on defeat · squad departure hit halved"},
  "Iron Will":    {color:"#78c8ff", desc:"Morale floor at 50 in combat · never walks out"},
  "Eagle Eye":    {color:"#ffd966", desc:"Accuracy counts double in combat score"},
  "Calm":         {color:"#78c8ff", desc:"Composure counts double · −40% squad morale swings"},
  "Night Vision": {color:"#c084fc", desc:"+8% win chance when your team is the underdog"},
  "Lucky":        {color:"#a8ff78", desc:"15% chance to flip a defeat into a win"},
  "Unlucky":      {color:"#ff7878", desc:"15% chance to flip a win into a defeat"},
  "Loyal":        {color:"#a8ff78", desc:"−20% contract demands · less likely to walk out"},
  "Greedy":       {color:"#ff9f43", desc:"+30% contract demands"},
  "Hot-headed":   {color:"#ff7878", desc:"Walks out immediately if contract rejected"},
  "Stubborn":     {color:"#ffd966", desc:"+15% contract demands · won't negotiate down"},
  "Coward":       {color:"#888",    desc:"Reduced morale swings (good and bad)"},
  "Inspiring":    {color:"#ffd966", desc:"Squad gets extra morale boost on this hero's retirement"},
};
const FIRST_NAMES = ["Aldric","Sylas","Mira","Thorin","Zara","Fenix","Lyra","Brom","Elowen","Kazim","Vex","Nyla","Dorn","Seraphel","Grix","Isolde","Tavar","Rynn","Caelum","Vesper","Oryn","Sable","Cress","Baelin","Wren"];
const LAST_NAMES  = ["Ironforge","Dawnwhisper","Ashveil","Stoneback","Emberthorn","Coldwater","Grimshaw","Silverwood","Blackthorn","Nighthollow","Voidmantle","Crestfall","Duskbane","Emberveil","Stormcrow"];

// ─── UTILS ────────────────────────────────────────────────────────────────────

function rand(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function pickN(arr,n){ const s=[...arr];const o=[];for(let i=0;i<n;i++){const x=Math.floor(Math.random()*s.length);o.push(s.splice(x,1)[0]);}return o; }
function xpForLevel(l){ return XP_PER_LEVEL[Math.min(l,MAX_LEVEL)] ?? XP_PER_LEVEL[MAX_LEVEL]; }
function levelFromXp(xp){ let l=0; for(let i=1;i<=MAX_LEVEL;i++){ if(xp>=XP_PER_LEVEL[i]) l=i; else break; } return l; }

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
const DEFAULT_TOWN_COLOR = "#ffd966";
const TOWN_COLORS = [
  { label:"Gold",    value:"#ffd966" },
  { label:"Emerald", value:"#a8ff78" },
  { label:"Sapphire",value:"#78c8ff" },
  { label:"Crimson", value:"#ff7878" },
  { label:"Violet",  value:"#a78bfa" },
  { label:"Amber",   value:"#ff9f43" },
  { label:"Silver",  value:"#c0c0c0" },
  { label:"Rose",    value:"#ff6eb4" },
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
function calcSpecPenalty(spec, formation) {
  if(!spec) return null;
  const counterPos = spec.counter;
  const counterHeroes = (formation[counterPos]||[]).filter(Boolean);
  // Countered if at least 1 hero in the counter position
  if(counterHeroes.length >= 1) return null;
  return { penalty: spec.penalty, reason: spec.reason, injuryBonus: spec.injuryBonus || 0 };
}

// Derives current table position from wins/losses vs league table
function calcTierPosition(wins, winRate, leagueTable, tierEnemyTowns) {
  if(!leagueTable || leagueTable.length === 0) return 4;
  // Sort table by wins descending, count how many are ahead of the player
  const sorted = [...leagueTable].sort((a,b) => b.wins - a.wins);
  const playerIdx = sorted.findIndex(t => t.isPlayer);
  return playerIdx >= 0 ? playerIdx + 1 : 4;
}

// Weekly tribute income — now flat per tier (no position bonus)
function weeklyRankIncome(tierId, position) {
  const tier = TIERS[tierId] || TIERS.iron;
  return tier.tributeBase;
}

const WEEKS_PER_CONTRACT_YEAR = 12;
const ROSTER_CAP = 12; // max heroes on squad at any time

function generateHero(id,forSale=false,premium=false,elite=false,forcedRole=null,forcedRace=null,tierId="iron"){
  const RACES = ["Human","Elf","Dwarf","Half-Orc","Gnome","Tiefling","Dragonborn"];
  const race=forcedRace||pick(RACES), role=forcedRole||pick(ROLES);
  const potential=rollPotential(premium,elite,tierId);

  // Determine stage/progress from market tier window
  const mktTier = elite?"elite":premium?"premium":"standard";
  const win = MARKET_STAGE_WINDOWS[mktTier];
  const careerWk = randomCareerWeekInWindow(win.stage, win.minPct, win.maxStage, win.maxPct);
  const { stage, stageProgress } = careerWeekToStage(careerWk);

  const stats={};
  ALL_STATS.forEach(s=>{
    if(s==="Potential"){stats[s]=potential;return;}
    if(["Form"].includes(s))return;
    const potCap=Math.max(10,potential);
    const lo=Math.max(10,Math.floor(potential*0.25));
    const hi=Math.max(lo,Math.floor(potential*0.50));
    let base=rand(lo,hi);
    // Peak heroes arrive more developed — they've had seasons of experience
    if(stage==="peak")   base=Math.min(potCap,base+rand(5,12));
    if(stage==="fading") base=Math.max(10,base-rand(2,6));
    if(stage==="veteran")base=Math.max(10,base-rand(5,12));
    stats[s]=Math.max(10,Math.min(potCap,base));
  });
  stats.Form=rand(3,10);
  const traits=pickN(TRAITS,rand(1,3));
  const avgStat=Object.values(stats).reduce((a,b)=>a+b,0)/ALL_STATS.length;
  const salary=Math.floor(avgStat*rand(13,16)/10);
  const potBonus=Math.max(0,stats.Potential-50)*5;
  const baseValue=Math.floor(avgStat * 7 * (1 + 0 * 0.32) + potBonus*0.3 + rand(-30,30));
  const valueMult = elite ? rand(22,28)/10 : premium ? rand(15,20)/10 : forSale ? rand(10,12)/10 : 1;
  // Contract length appropriate to career stage — veterans don't sign 4-year deals
  const STAGE_CONTRACT_MAX = {prospect:3, rising:4, peak:4, fading:2, veteran:1};
  const maxYears = STAGE_CONTRACT_MAX[stage] || 3;
  const contractYears = rand(1, maxYears);
  const contractWeeks = contractYears * WEEKS_PER_CONTRACT_YEAR;

  // Level based on career stage — heroes arrive with appropriate experience
  const STAGE_LEVEL_RANGES = {
    prospect:[0,2], rising:[2,6], peak:[6,10], fading:[8,12], veteran:[10,14],
  };
  const [lvMin,lvMax] = STAGE_LEVEL_RANGES[stage]||[0,2];
  const tierLvBonus = elite?rand(2,3):premium?rand(1,2):0;
  const heroLevel = Math.min(MAX_LEVEL, rand(lvMin,lvMax)+tierLvBonus);
  const heroXP = xpForLevel(heroLevel);
  // Standard Prospect level 0s are free — unproven and pre-career
  const isFreeProsepct = !elite && !premium && stage === "prospect" && heroLevel === 0;
  const value = isFreeProsepct ? 0 : Math.max(100,Math.floor(baseValue*valueMult));

  return {
    id, name:`${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`, race, role,
    stage, stageProgress,
    stats, traits, salary, value, morale:rand(55,100),
        contractYears, contractWeeks, contractWeeksLeft:contractWeeks,
    xp:heroXP, level:heroLevel, injured:false, injuryWeeks:0, retired:false,
    fatigue:0, weeksUnplayed:0, weeksInSquad:0, weeksInFormation:0,
    potentialRevealed:false,
    negotiationPending:false, negotiationIgnoredWeeks:0,
    marketTier: mktTier,
    mentorBonus: null,
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
    icon:"🖤",
    power:460,
    difficulty:6,
    flavour:"Ancient, merciless, and undefeated in living memory.",
    treasury:0,
    specialisation:null,
    goldReward:3500,
  },
  {
    name:"The Eternal Court",
    icon:"👁️",
    power:430,
    difficulty:6,
    flavour:"They have watched every battle you've fought. They know your tactics.",
    treasury:0,
    specialisation:null,
    goldReward:3200,
  },
  {
    name:"The Ashen Legion",
    icon:"🔥",
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
  icon:        "⚔️",
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

const ENEMY_ABILITIES = [
  {
    id:'crushing_assault',   name:'Crushing Assault',         icon:'⚒️',
    stat:'Defense',          scope:'vanguard',
    desc:'Their frontline hits with bone-shattering force.',
    softDesc: (t)=>`Vanguard heroes: +20% injury chance on defeat.`,
    hardDesc: (t)=>`Vanguard heroes: +40% injury chance, +10 fatigue.`,
    softEffect: { injuryMult:{pos:'Vanguard',mult:1.20} },
    hardEffect: { injuryMult:{pos:'Vanguard',mult:1.40}, fatigue:{pos:'Vanguard',amt:10} },
    thresholds: { bronze:{pass:37,soft:28}, silver:{pass:48,soft:36}, gold:{pass:64,soft:48}, platinum:{pass:78,soft:58} },
  },
  {
    id:'war_of_attrition',   name:'War of Attrition',         icon:'⏳',
    stat:'Endurance',        scope:'squad',
    desc:'A grinding fight that drains every hero.',
    softDesc: (t)=>`All raiding heroes: +10 fatigue.`,
    hardDesc: (t)=>`All raiding heroes: +20 fatigue, −8 morale each.`,
    softEffect: { fatigue:{pos:'all',amt:10} },
    hardEffect: { fatigue:{pos:'all',amt:20}, morale:{pos:'all',amt:-8} },
    thresholds: { bronze:{pass:32,soft:24}, silver:{pass:43,soft:32}, gold:{pass:56,soft:42}, platinum:{pass:69,soft:52} },
  },
  {
    id:'flanking_blitz',     name:'Flanking Blitz',           icon:'💨',
    stat:'Agility',          scope:'skirmisher',
    desc:'Lightning flankers overwhelm slow Skirmishers.',
    softDesc: (t)=>`Skirmisher heroes: +12 fatigue.`,
    hardDesc: (t)=>`Skirmisher heroes: +22 fatigue, −10 morale each.`,
    softEffect: { fatigue:{pos:'Skirmisher',amt:12} },
    hardEffect: { fatigue:{pos:'Skirmisher',amt:22}, morale:{pos:'Skirmisher',amt:-10} },
    thresholds: { bronze:{pass:37,soft:28}, silver:{pass:48,soft:36}, gold:{pass:64,soft:48}, platinum:{pass:78,soft:58} },
  },
  {
    id:'sniper_fire',        name:'Sniper Fire',              icon:'🎯',
    stat:'Accuracy',         scope:'skirmisher',
    desc:'Their marksmen pick off your flankers with cold precision.',
    softDesc: (t)=>`Skirmisher heroes: +25% injury chance.`,
    hardDesc: (t)=>`Skirmisher heroes: +50% injury chance, +8 fatigue.`,
    softEffect: { injuryMult:{pos:'Skirmisher',mult:1.25} },
    hardEffect: { injuryMult:{pos:'Skirmisher',mult:1.50}, fatigue:{pos:'Skirmisher',amt:8} },
    thresholds: { bronze:{pass:37,soft:28}, silver:{pass:48,soft:36}, gold:{pass:64,soft:48}, platinum:{pass:78,soft:58} },
  },
  {
    id:'brute_force',        name:'Brute Force',              icon:'💪',
    stat:'Strength',         scope:'vanguard',
    desc:'Overwhelming aggression that steamrolls weak fronts.',
    softDesc: (t)=>`Gold reward −20%.`,
    hardDesc: (t)=>`Gold reward −40%, Vanguard heroes: +10 fatigue.`,
    softEffect: { goldMult:0.80 },
    hardEffect: { goldMult:0.60, fatigue:{pos:'Vanguard',amt:10} },
    thresholds: { bronze:{pass:37,soft:28}, silver:{pass:48,soft:36}, gold:{pass:64,soft:48}, platinum:{pass:78,soft:58} },
  },
  {
    id:'arcane_suppression', name:'Arcane Suppression',       icon:'🔮',
    stat:'Magic Resist',     scope:'arbiter',
    desc:'Their mages suppress your command and control.',
    softDesc: (t)=>`Arbiter heroes: −10 morale, +8 fatigue.`,
    hardDesc: (t)=>`All heroes: −12 morale, Arbiter heroes: +15 fatigue.`,
    softEffect: { morale:{pos:'Arbiter',amt:-10}, fatigue:{pos:'Arbiter',amt:8} },
    hardEffect: { morale:{pos:'all',amt:-12}, fatigue:{pos:'Arbiter',amt:15} },
    thresholds: { bronze:{pass:37,soft:28}, silver:{pass:48,soft:36}, gold:{pass:64,soft:48}, platinum:{pass:78,soft:58} },
  },
  {
    id:'dark_ritual',        name:'Dark Ritual',              icon:'🌑',
    stat:'Magic Power',      scope:'arbiter',
    desc:'A dark ritual empowers their forces.',
    softDesc: (t)=>`All heroes: −8 morale.`,
    hardDesc: (t)=>`All heroes: −15 morale, +20% injury chance.`,
    softEffect: { morale:{pos:'all',amt:-8} },
    hardEffect: { morale:{pos:'all',amt:-15}, injuryMult:{pos:'all',mult:1.20} },
    thresholds: { bronze:{pass:37,soft:28}, silver:{pass:48,soft:36}, gold:{pass:64,soft:48}, platinum:{pass:78,soft:58} },
  },
  {
    id:'psychological_warfare', name:'Psychological Warfare', icon:'🧠',
    stat:'Composure',        scope:'squad',
    desc:'Mind games rattle your heroes before the fight.',
    softDesc: (t)=>`All heroes: −10 morale.`,
    hardDesc: (t)=>`All heroes: −20 morale.`,
    softEffect: { morale:{pos:'all',amt:-10} },
    hardEffect: { morale:{pos:'all',amt:-20} },
    thresholds: { bronze:{pass:32,soft:24}, silver:{pass:43,soft:32}, gold:{pass:56,soft:42}, platinum:{pass:69,soft:52} },
  },
  {
    id:'disrupt_command',    name:'Disrupt Chain of Command', icon:'📜',
    stat:'Leadership',       scope:'squad',
    desc:'They target your leaders — coordination crumbles.',
    softDesc: (t)=>`All heroes: −25% XP this battle.`,
    hardDesc: (t)=>`All heroes: −50% XP, −10 morale each.`,
    softEffect: { xpMult:0.75 },
    hardEffect: { xpMult:0.50, morale:{pos:'all',amt:-10} },
    thresholds: { bronze:{pass:32,soft:24}, silver:{pass:43,soft:32}, gold:{pass:56,soft:42}, platinum:{pass:69,soft:52} },
  },
  {
    id:'iron_will_test',     name:'Iron Will Test',           icon:'⚖️',
    stat:'Determination',    scope:'squad',
    desc:'A brutal encounter that shatters those lacking conviction.',
    softDesc: (t)=>`Raiding heroes: −8 morale on defeat.`,
    hardDesc: (t)=>`Raiding heroes: −15 morale.`,
    softEffect: { morale:{pos:'all',amt:-8} },
    hardEffect: { morale:{pos:'all',amt:-15} },
    thresholds: { bronze:{pass:32,soft:24}, silver:{pass:43,soft:32}, gold:{pass:56,soft:42}, platinum:{pass:69,soft:52} },
  },
  {
    id:'guerrilla_tactics',  name:'Guerrilla Tactics',        icon:'🌿',
    stat:'Adaptability',     scope:'squad',
    desc:'Unpredictable tactics confuse rigid formations.',
    softDesc: (t)=>`+15% injury chance across all heroes.`,
    hardDesc: (t)=>`+25% injury chance, all heroes: +8 fatigue.`,
    softEffect: { injuryMult:{pos:'all',mult:1.15} },
    hardEffect: { injuryMult:{pos:'all',mult:1.25}, fatigue:{pos:'all',amt:8} },
    thresholds: { bronze:{pass:32,soft:24}, silver:{pass:43,soft:32}, gold:{pass:56,soft:42}, platinum:{pass:69,soft:52} },
  },
  {
    id:'terror_tactics',     name:'Terror Tactics',           icon:'😱',
    stat:'Intimidation',     scope:'squad',
    desc:'Their fearsome reputation breaks the weak-willed.',
    softDesc: (t)=>`All heroes: −12 morale.`,
    hardDesc: (t)=>`All heroes: −20 morale.`,
    softEffect: { morale:{pos:'all',amt:-12} },
    hardEffect: { morale:{pos:'all',amt:-20} },
    thresholds: { bronze:{pass:32,soft:24}, silver:{pass:43,soft:32}, gold:{pass:56,soft:42}, platinum:{pass:69,soft:52} },
  },
  {
    id:'tactical_trap',      name:'Tactical Trap',            icon:'🪤',
    stat:'Tactics',          scope:'squad',
    desc:'A clever battlefield trap — only awareness avoids it.',
    softDesc: (t)=>`All heroes: +10 fatigue.`,
    hardDesc: (t)=>`All heroes: +18 fatigue, +20% injury chance.`,
    softEffect: { fatigue:{pos:'all',amt:10} },
    hardEffect: { fatigue:{pos:'all',amt:18}, injuryMult:{pos:'all',mult:1.20} },
    thresholds: { bronze:{pass:32,soft:24}, silver:{pass:43,soft:32}, gold:{pass:56,soft:42}, platinum:{pass:69,soft:52} },
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

// Check ability outcome for a given formation + heroes
// Returns 'pass', 'soft', or 'hard'
function checkAbility(ability, formation, tierId) {
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

// Apply ability secondary effects to heroes after raid
function applyAbilityEffects(ability, outcome, formation, heroes) {
  if(outcome === 'pass') return heroes;
  const effects = outcome === 'soft' ? ability.softEffect : ability.hardEffect;
  const posHeroIds = (pos) => new Set((formation[pos]||[]).filter(Boolean).map(h=>h.id));
  const allIds = new Set([...posHeroIds('Vanguard'),...posHeroIds('Skirmisher'),...posHeroIds('Arbiter')]);

  return heroes.map(h => {
    const inPos = (pos) => posHeroIds(pos).has(h.id);
    const isRaiding = allIds.has(h.id);
    if(!isRaiding) return h;

    let updated = {...h};

    // Fatigue
    if(effects.fatigue) {
      const {pos,amt} = effects.fatigue;
      if(pos==='all' || inPos(pos)) {
        updated = {...updated, fatigue: Math.min(100, (updated.fatigue||0)+amt)};
      }
    }
    // Morale
    if(effects.morale) {
      const {pos,amt} = effects.morale;
      if(pos==='all' || inPos(pos)) {
        updated = {...updated, morale: Math.max(0, Math.min(100, (updated.morale||0)+amt))};
      }
    }
    return updated;
  });
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
      if(decayed > 0) declineNote = `📉 ${hero.name} shows signs of fading (${decayed} stats declined)`;
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
      declineNote = `🕯️ ${hero.name} is fighting against time...`;
    }
    // Retire only at natural end of veteran stage
    if(finalProgress >= 100) retired = true;
  }

  if(declineNote) events.push({text:declineNote, type:hero.stage==="veteran"?"danger":"warning", heroId:hero.id});
  if(retired) events.push({text:`🎖️ ${hero.name} has retired. A legend leaves the field.`, type:"danger", heroId:hero.id, retired:true});

  return { hero:{...hero, stage:newStage, stageProgress:finalProgress, stats:newStats, morale:newMorale, retired}, events };
}

// ─── RAID SIMULATION ENGINE ───────────────────────────────────────────────────
// Builds a full scripted play-by-play that resolves over ~30 seconds.
// Outcome is pre-determined; events are generated from actual hero stats.
// Returns: { phases, finalResult, weakLinks }

const PHASE_DEFS = [
  { id:"approach",  label:"Approach",        icon:"🌑", pos:null,          duration:5500 },
  { id:"vanguard",  label:"Vanguard Clash",   icon:"🗡️", pos:"Vanguard",    duration:7000 },
  { id:"skirmish",  label:"Skirmisher Strike",icon:"🏹", pos:"Skirmisher",  duration:7000 },
  { id:"arbiter",   label:"Arbiter Command",  icon:"✨", pos:"Arbiter",     duration:6500 },
  { id:"resolution",label:"Resolution",       icon:"⚔️", pos:null,          duration:5000 },
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
      const pen = analysis.specPenalty;
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
      good(`${analysis.raceSynergy.icon} ${analysis.raceSynergy.name}: ${analysis.raceSynergy.flavour}`);
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

    // Lucky trait surprise
    const lucky = flankers.find(h=>h.traits?.includes("Lucky"));
    if(lucky && Math.random()<0.3){
      if(phaseWon) good(`${lucky.name}'s luck holds again — a fortunate bounce in the flanking movement.`);
    }

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
        `🏆 ${enemy.name} is overcome! The battle is a triumph.`,
        `🏆 Victory against ${enemy.name}. The realm grows stronger.`,
        `🏆 ${enemy.name} falls. Another chapter written.`,
        `🏆 The battle is yours. ${enemy.name} couldn't match you today.`,
      ];
      good(pickLine(victoryLines));
    } else {
      const defeatLines = [
        `💀 ${enemy.name} repels your forces. A costly defeat.`,
        `💀 Defeat. ${enemy.name} proved too strong today.`,
        `💀 The battle is lost. ${enemy.name} holds their ground.`,
        `💀 Sent home empty-handed. ${enemy.name} wins this one.`,
      ];
      bad(pickLine(defeatLines));
    }
  }

  return events;
}

// Weak link analysis: surfaces specific heroes who dragged down the team
function analyseWeakLinks(formation, analysis) {
  const links = [];
  POS_KEYS.forEach(pos => {
    const pd = POSITIONS[pos];
    (formation[pos]||[]).forEach(h => {
      if(!h) return;
      const mod = analysis.heroMods[h.id];
      const issues = [];

      if(mod?.fit === "penalty") {
        issues.push({ severity:"warning", reason:`Off-position — ${h.role} in ${pos} (better fit: ${pd.ideal.filter(x=>ROLES.includes(x)).join(", ")})`, stat:"Position", impact:-15 });
      }
      if(h.stats.Form < 4) {
        issues.push({ severity:"warning", reason:`Very low Form (${h.stats.Form}/10) — underperforming`, stat:"Form", impact:-15 });
      }
      if(h.morale < 40) {
        issues.push({ severity:"warning", reason:`Low morale (${h.morale}%) — not fighting at full effort`, stat:"Morale", impact:-12 });
      }
      if(h.morale < 40) {
        issues.push({ severity:"warning", reason:`Low morale (${h.morale}) — performance suffering`, stat:"Morale", impact:-10 });
      }
      if(h.injured) {
        issues.push({ severity:"critical", reason:`Carrying an injury — effectiveness heavily compromised`, stat:"Injury", impact:-25 });
      }
      // Check primary stat fit
      const primaryAvg = pd.primaryStats.reduce((a,s)=>a+(h.stats[s]||0),0)/pd.primaryStats.length;
      if(primaryAvg < 35 && mod?.fit !== "penalty") {
        issues.push({ severity:"warning", reason:`Low primary stats for this position (avg ${Math.round(primaryAvg)})`, stat:"Stats", impact:-10 });
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

function buildRaidSimulation(formation, enemy, buildings, playerRank, ngPlus=null) {
  const allHeroes = POS_KEYS.flatMap(p=>(formation[p]||[]).filter(Boolean));
  if(!allHeroes.length) return null;

  const {effective, analysis} = calcFormationRating(formation);
  const hasBarracks = buildings.find(b=>b.id==="barracks"&&b.built);

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
  const nightBonus = nightVisionHero && effective < enemy.power ? 0.08 : 0;

  // ── PER-PHASE WIN CHANCES ────────────────────────────────────────────────────
  // Each of the 3 position phases (Vanguard, Skirmisher, Arbiter) gets its own
  // win chance derived from the heroes in that position vs a positional enemy share.
  // Winning 2 of 3 phases = winning the battle.
  //
  // Phase win chance: sigmoid of (posScore / posEnemyShare), capped 0.20–0.80.
  // Cap 0.80 → max overall win ~90% (dominant). Floor 0.20 → min ~10% (miracle).
  // This preserves the DnD Nat 1/20 feel while making each position matter.

  const PHASE_WIN_CAP   = 0.77;
  const PHASE_WIN_FLOOR = 0.27;
  const k = 2.0;

  // Enemy power is split equally across 3 positions
  const posEnemyShare = adjustedEnemyPower / 3;

  // Formation synergy multiplier — now applied to actual phase outcomes, not just display.
  // analysis.mult includes all active SYNERGIES ratingMults and race synergy ratingMult.
  // Capped at 1.5 to match our calibrated tactical ceiling.
  const synergyMult = Math.min(1.5, Math.max(0.3, analysis.mult));

  const phaseWinChances = {};
  const positionScores = {};
  POS_KEYS.forEach(pos => {
    const posHeroes = (formation[pos]||[]).filter(Boolean);
    const { score, primaryHero, supportHero, pairingMult, raceMult } = calcPositionScore(posHeroes, pos);
    // Apply formation-wide synergy multiplier to position score
    const effectiveScore = score * synergyMult;
    positionScores[pos] = { score, effectiveScore, primaryHero, supportHero, pairingMult, raceMult };
    const ratio     = effectiveScore > 0 ? posEnemyShare / effectiveScore : 999;
    const rawChance = 1 / (1 + Math.pow(ratio, k));
    phaseWinChances[pos] = Math.min(PHASE_WIN_CAP, Math.max(PHASE_WIN_FLOOR, rawChance + nightBonus));
  });

  // Roll each position phase
  const phaseRolls = {};
  POS_KEYS.forEach(pos => {
    phaseRolls[pos] = Math.random() < phaseWinChances[pos];
  });

  // 2-of-3 majority determines the battle outcome
  const phasesWon = POS_KEYS.filter(pos => phaseRolls[pos]).length;
  let won = phasesWon >= 2;

  // Overall win chance (for display) = P(win 2+ of 3) from individual phase chances
  const pa = phaseWinChances["Vanguard"], pb = phaseWinChances["Skirmisher"], pc = phaseWinChances["Arbiter"];
  const overallWinChance = pa*pb*pc + pa*pb*(1-pc) + pa*(1-pb)*pc + (1-pa)*pb*pc;

  // Lucky: 15% chance to flip a loss into a win (wins one extra phase)
  const luckyHero = allHeroes.find(h=>h.traits?.includes("Lucky"));
  if(!won && luckyHero && Math.random() < 0.15) {
    won = true;
  }
  // Unlucky: 15% chance to flip a win into a loss
  const unluckyHero = allHeroes.find(h=>h.traits?.includes("Unlucky"));
  if(won && unluckyHero && Math.random() < 0.15) {
    won = false;
  }

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
  let heroXP = Math.round(rand(xpMin, xpMax) * (hasBarracks?1.2:1) * ACTIVE_SPEED.xpMult);
  let goldSwing = won ? rand(300,700)+enemy.difficulty*120 : 0;

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
    const fatigueFactor = fat < 40  ? 0.0
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
    const injured = Math.random() < chance;
    if(injured) injuryCount++;
    return injured;
  }).map(h => h.id);

  // Win swing computed once; loss swing is per-hero (scales with individual morale)
  const moraleSwing = won ? rand(6,10) : 0;
  const weakLinks = analyseWeakLinks(formation, analysis);

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
  if(analysis.raceSynergy&&won) summaryEvents.push(`${analysis.raceSynergy.icon} ${analysis.raceSynergy.name}: ${analysis.raceSynergy.flavour}`);
  if(injuries.length) summaryEvents.push(`🩸 ${injuries.length} hero(es) injured.`);
  if(hasBarracks) summaryEvents.push("🏰 Barracks: +20% XP");
  if(specPenalty) summaryEvents.push(`⚠️ ${enemy.specialisation.label}: ${specPenalty.reason} (enemy power +${Math.round(specPenalty.penalty*100)}%)`);
  if(!specPenalty && enemy.specialisation) summaryEvents.push(`✅ Countered ${enemy.specialisation.label} — no power penalty`);
  abilityResults.forEach(({ability,outcome})=>{
    if(outcome==='pass') return;
    const effects = outcome==='soft' ? ability.softEffect : ability.hardEffect;
    const effectText = outcome==='soft' ? ability.softDesc() : ability.hardDesc();
    summaryEvents.push(`${ability.icon} ${ability.name}: ${effectText}`);
  });
  if(nightVisionHero&&nightBonus>0) summaryEvents.push(`🌑 ${nightVisionHero.name}'s Night Vision shone in the darkness!`);
  if(won) allHeroes.filter(h=>h.traits?.includes("Berserker")&&POS_KEYS.find(p=>(formation[p]||[]).some(x=>x?.id===h.id))==="Vanguard")
    .forEach(h=>summaryEvents.push(`⚡ ${h.name} went berserk — unstoppable in the vanguard!`));

  return {
    phases: phaseResults,
    won, goldSwing:Math.round(goldSwing), heroXP, injuries, moraleSwing,
    events: summaryEvents, winChance: overallWinChance, effective, analysis, allHeroes, weakLinks,
    specPenalty, adjustedEnemyPower, starPerformer, topWeakLink,
    phaseWinChances, phaseRolls, positionScores,
    abilityResults,
    enemy: enemy.name, enemyDiff: enemy.difficulty,
  };
}

// ─── RAID SIMULATION MODAL ────────────────────────────────────────────────────

function RaidSimulationModal({ simulation, enemy, onComplete }) {
  const [stage, setStage]         = useState("countdown"); // countdown → vanguard → skirmisher → arbiter → outcome → done
  const [revealed, setRevealed]   = useState([]);           // which lanes are revealed
  const [showOutcome, setShowOutcome] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Staggered reveal sequence
  useEffect(() => {
    if(!simulation) return;
    const timers = [];
    // Short countdown before first lane
    timers.push(setTimeout(()=>{ setStage("vanguard");   setRevealed(["Vanguard"]); }, 900));
    timers.push(setTimeout(()=>{ setStage("skirmisher"); setRevealed(r=>[...r,"Skirmisher"]); }, 1700));
    timers.push(setTimeout(()=>{ setStage("arbiter");    setRevealed(r=>[...r,"Arbiter"]); }, 2500));
    timers.push(setTimeout(()=>{ setStage("outcome");    setShowOutcome(true); }, 3400));
    timers.push(setTimeout(()=>{ setStage("done"); }, 3800));
    return () => timers.forEach(clearTimeout);
  }, [simulation]);

  if(!simulation) return null;

  const won = simulation.won;
  const outcomeCol = won ? "#a8ff78" : "#ff7878";
  const injuredHeroes = simulation.allHeroes?.filter(h => simulation.injuries?.includes(h.id)) || [];

  const LANES = [
    { pos:"Vanguard",   icon:"🗡️", color:"#ff7878" },
    { pos:"Skirmisher", icon:"🏹", color:"#ffd966" },
    { pos:"Arbiter",    icon:"✨", color:"#78c8ff" },
  ];

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(12px)"}}>
      <div style={{width:"min(520px,96vw)",background:"linear-gradient(160deg,#0c0c1e,#12102a)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,overflow:"hidden",boxShadow:"0 0 80px rgba(0,0,0,0.6)"}}>

        {/* Header */}
        <div style={{padding:"14px 18px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",alignItems:"center",gap:10,background:"rgba(0,0,0,0.3)"}}>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:15,color:"#f0e6d3"}}>⚔️ {enemy.name}</div>
            <div style={{fontSize:9,color:"#666",marginTop:1}}>Enemy Power {enemy.power} · {Math.round(simulation.winChance*100)}% projected</div>
          </div>
          {stage === "countdown" && (
            <div style={{fontSize:11,color:"#888",fontStyle:"italic"}}>Engaging…</div>
          )}
        </div>

        {/* Three lane reveal */}
        <div style={{display:"flex",gap:8,padding:"20px 18px 16px"}}>
          {LANES.map(({pos,icon,color}) => {
            const isRevealed = revealed.includes(pos);
            const phaseResult = simulation.phases?.find(p=>p.pos===pos);
            const phaseWon = phaseResult?.won;
            const ps = simulation.positionScores?.[pos];
            const heroes = simulation.allHeroes?.filter(h=>
              simulation.phases?.find(p=>p.pos===pos) &&
              Object.keys(simulation.positionScores||{}).includes(pos)
            );

            // Get heroes in this position
            const posHeroes = [ps?.primaryHero, ps?.supportHero].filter(Boolean);
            const laneCol = !isRevealed ? "#333" : phaseWon ? "#a8ff78" : "#ff7878";
            const laneBg  = !isRevealed ? "rgba(255,255,255,0.02)" : phaseWon ? "rgba(168,255,120,0.06)" : "rgba(255,100,100,0.06)";
            const laneBorder = !isRevealed ? "rgba(255,255,255,0.06)" : phaseWon ? "rgba(168,255,120,0.25)" : "rgba(255,100,100,0.25)";

            return (
              <div key={pos} style={{flex:1,borderRadius:10,border:`1px solid ${laneBorder}`,background:laneBg,padding:"12px 10px",textAlign:"center",transition:"all 0.4s ease",transform:isRevealed?"translateY(0)":"translateY(4px)",opacity:isRevealed?1:0.4}}>
                {/* Position label */}
                <div style={{fontSize:9,color:isRevealed?color:"#555",fontWeight:700,letterSpacing:1,marginBottom:6,fontFamily:"'Cinzel',serif"}}>{icon} {pos.toUpperCase()}</div>

                {/* Outcome symbol */}
                <div style={{fontSize:28,marginBottom:6,transition:"all 0.3s",transform:isRevealed?"scale(1)":"scale(0.5)"}}>
                  {!isRevealed ? "⋯" : phaseWon ? "✓" : "✗"}
                </div>

                {/* Result label */}
                <div style={{fontSize:11,fontWeight:700,color:laneCol,marginBottom:8,fontFamily:"'Cinzel',serif"}}>
                  {!isRevealed ? "—" : phaseWon ? "WON" : "LOST"}
                </div>

                {/* Hero names */}
                {posHeroes.length > 0 && (
                  <div style={{borderTop:`1px solid ${laneBorder}`,paddingTop:6,display:"flex",flexDirection:"column",gap:2}}>
                    {posHeroes.map((h,i)=>(
                      <div key={h.id} style={{fontSize:8,color:isRevealed?"#aaa":"#555",display:"flex",alignItems:"center",gap:3,justifyContent:"center"}}>
                        <span style={{fontSize:9}}>{RACE_ICONS[h.race]}</span>
                        <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:60}}>{h.name.split(" ")[0]}</span>
                        {i===0&&ps?.pairingMult>1&&<span style={{color:"#ffd966",fontSize:8}}>✦</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Outcome card */}
        <div style={{padding:"0 18px 16px",transition:"all 0.5s",opacity:showOutcome?1:0,transform:showOutcome?"translateY(0)":"translateY(12px)"}}>
          <div style={{borderRadius:12,border:`1px solid ${outcomeCol}33`,background:`${outcomeCol}08`,padding:"14px 16px"}}>

            {/* Result */}
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <div style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:20,color:outcomeCol}}>
                {won ? "🏆 VICTORY" : "💀 DEFEAT"}
              </div>
              <div style={{flex:1}}/>
              {/* Phase summary pips */}
              <div style={{display:"flex",gap:4}}>
                {LANES.map(({pos})=>{
                  const pw = simulation.phases?.find(p=>p.pos===pos)?.won;
                  return <div key={pos} style={{width:8,height:8,borderRadius:"50%",background:pw?"#a8ff78":"#ff7878"}}/>;
                })}
              </div>
            </div>

            {/* Stats row */}
            <div style={{display:"flex",gap:10,marginBottom:injuredHeroes.length>0?10:0}}>
              {won && (
                <div style={{flex:1,padding:"8px 10px",borderRadius:8,background:"rgba(255,215,0,0.06)",border:"1px solid rgba(255,215,0,0.15)",textAlign:"center"}}>
                  <div style={{fontSize:9,color:"#888",marginBottom:2}}>Gold</div>
                  <div style={{fontSize:16,fontWeight:700,color:"#ffd966"}}>+{simulation.goldSwing?.toLocaleString()}g</div>
                </div>
              )}
              <div style={{flex:1,padding:"8px 10px",borderRadius:8,background:"rgba(167,139,250,0.06)",border:"1px solid rgba(167,139,250,0.15)",textAlign:"center"}}>
                <div style={{fontSize:9,color:"#888",marginBottom:2}}>XP</div>
                <div style={{fontSize:16,fontWeight:700,color:"#a78bfa"}}>+{simulation.heroXP}</div>
              </div>
              {simulation.abilityResults?.some(r=>r.outcome!=="pass")&&(
                <div style={{flex:1,padding:"8px 10px",borderRadius:8,background:"rgba(255,159,67,0.06)",border:"1px solid rgba(255,159,67,0.2)",textAlign:"center"}}>
                  <div style={{fontSize:9,color:"#888",marginBottom:2}}>Ability</div>
                  <div style={{fontSize:11,fontWeight:700,color:"#ff9f43"}}>⚠️ Effect</div>
                </div>
              )}
            </div>

            {/* Injuries */}
            {injuredHeroes.length > 0 && (
              <div style={{padding:"8px 10px",borderRadius:8,background:"rgba(255,100,100,0.06)",border:"1px solid rgba(255,100,100,0.2)"}}>
                <div style={{fontSize:10,fontWeight:700,color:"#ff7878",marginBottom:3}}>🩸 Injured</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {injuredHeroes.map(h=>(
                    <div key={h.id} style={{fontSize:9,color:"#ff9f43",padding:"2px 6px",borderRadius:5,background:"rgba(255,100,100,0.1)",border:"1px solid rgba(255,100,100,0.2)"}}>
                      {RACE_ICONS[h.race]} {h.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Details section (opt-in) */}
        {showDetails && (
          <div style={{borderTop:"1px solid rgba(255,255,255,0.05)",padding:"12px 18px",maxHeight:220,overflowY:"auto"}}>
            {/* Phase breakdown */}
            <div style={{fontSize:10,color:"#888",fontWeight:700,letterSpacing:1,marginBottom:8}}>PHASE BREAKDOWN</div>
            {LANES.map(({pos,icon,color})=>{
              const phaseResult = simulation.phases?.find(p=>p.pos===pos);
              const ps = simulation.positionScores?.[pos];
              const phaseWon = phaseResult?.won;
              const wc = simulation.phaseWinChances?.[pos];
              return(
                <div key={pos} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,padding:"6px 8px",borderRadius:7,background:"rgba(255,255,255,0.02)",border:`1px solid ${phaseWon?"rgba(168,255,120,0.1)":"rgba(255,100,100,0.1)"}`}}>
                  <span style={{fontSize:11}}>{icon}</span>
                  <span style={{fontSize:10,fontWeight:700,color,flex:1,fontFamily:"'Cinzel',serif"}}>{pos}</span>
                  {ps?.pairingMult>1&&<span style={{fontSize:9,color:"#ffd966"}}>✦</span>}
                  <span style={{fontSize:9,color:"#888"}}>{wc?Math.round(wc*100)+"% win chance":""}</span>
                  <span style={{fontSize:10,fontWeight:700,color:phaseWon?"#a8ff78":"#ff7878"}}>{phaseWon?"✓ Won":"✗ Lost"}</span>
                </div>
              );
            })}

            {/* Ability effects */}
            {simulation.abilityResults?.some(r=>r.outcome!=="pass")&&(
              <div style={{marginTop:10}}>
                <div style={{fontSize:10,color:"#888",fontWeight:700,letterSpacing:1,marginBottom:6}}>ABILITY EFFECTS</div>
                {simulation.abilityResults.filter(r=>r.outcome!=="pass").map(({ability,outcome},i)=>(
                  <div key={i} style={{fontSize:9,color:"#ff9f43",marginBottom:3}}>
                    {ability.icon} {ability.name} — {outcome==="soft"?ability.softDesc():ability.hardDesc()}
                  </div>
                ))}
              </div>
            )}

            {/* Race synergy */}
            {simulation.analysis?.raceSynergy&&(
              <div style={{marginTop:10,fontSize:9,color:simulation.analysis.raceSynergy.color}}>
                {simulation.analysis.raceSynergy.icon} {simulation.analysis.raceSynergy.name} (×{simulation.analysis.raceSynergy.ratingMult}) active
              </div>
            )}

            {/* Weak links */}
            {simulation.weakLinks?.length>0&&(
              <div style={{marginTop:10}}>
                <div style={{fontSize:10,color:"#ffd966",fontWeight:700,letterSpacing:1,marginBottom:6}}>⚠️ WEAK LINKS</div>
                {simulation.weakLinks.slice(0,3).map((link,i)=>(
                  <div key={i} style={{fontSize:9,color:"#bbb",marginBottom:3}}>
                    {RACE_ICONS[link.hero.race]} {link.hero.name} — {link.issues[0]?.reason}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{padding:"12px 18px",borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(0,0,0,0.2)"}}>
          {stage==="done"?(
            <>
              <button onClick={()=>setShowDetails(d=>!d)} style={{padding:"7px 14px",borderRadius:7,border:"1px solid rgba(255,255,255,0.1)",cursor:"pointer",background:"rgba(255,255,255,0.04)",color:"#888",fontSize:11,fontFamily:"'Cinzel',serif"}}>
                {showDetails?"Hide Details":"Show Details"}
              </button>
              <button onClick={onComplete} style={{padding:"9px 24px",borderRadius:8,border:"none",cursor:"pointer",background:`linear-gradient(135deg,${won?"#a8ff78,#78c8ff":"#ff9f43,#ffd966"})`,color:"#0d0d1a",fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:13}}>
                Continue →
              </button>
            </>
          ):(
            <div style={{fontSize:11,color:"#888",fontStyle:"italic"}}>Resolving…</div>
          )}
        </div>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function StatBar({label,value,prev,max=99,highlight,dimmed}){
  const pct=(value/max)*100, gain=prev!==undefined?value-prev:0;
  const col=dimmed?"#555":value>=80?"#a8ff78":value>=60?"#78c8ff":value>=40?"#ffd966":"#ff7878";
  return(
    <div style={{marginBottom:5,opacity:dimmed?0.45:1}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:2}}>
        <span style={{color:highlight?"#ffd966":"#bbb"}}>{label}</span>
        <span style={{display:"flex",gap:5,alignItems:"center"}}>
          {gain!==0&&<span style={{fontSize:9,color:gain>0?"#a8ff78":"#ff7878",fontWeight:700}}>{gain>0?"+":""}{gain}</span>}
          <span style={{fontWeight:700,color:col}}>{value}</span>
        </span>
      </div>
      <div style={{height:4,background:"#12122a",borderRadius:2,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background:col,borderRadius:2,transition:"width 0.5s"}}/>
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
        <span style={{color:"#a78bfa"}}>⭐ Lv {level}{level<MAX_LEVEL?` · ${cur}/${need} XP`:" · MAX (Lv15)"}</span>
        <span style={{color:"#999",fontSize:9}}>{xp} XP</span>
      </div>
      <div style={{height:4,background:"#12122a",borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#7c3aed,#a78bfa)",borderRadius:3,transition:"width 0.5s"}}/>
      </div>
    </div>
  );
}

function ContractBar({hero}){
  const total=hero.contractYears*WEEKS_PER_CONTRACT_YEAR;
  const left=hero.contractWeeksLeft||0;
  const pct=Math.max(0,(left/total)*100);
  const col=left<=WEEKS_PER_CONTRACT_YEAR?"#ff7878":left<=WEEKS_PER_CONTRACT_YEAR*2?"#ffd966":"#a8ff78";
  const yearsLeft=(left/WEEKS_PER_CONTRACT_YEAR).toFixed(1);
  return(
    <div style={{marginBottom:6}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:2}}>
        <span style={{color:col}}>📜 Contract: {yearsLeft}s left</span>
        {hero.negotiationPending&&<span style={{fontSize:9,color:"#ff9f43",fontWeight:700,animation:"pulse 1s infinite"}}>⚠️ RENEWAL PENDING</span>}
      </div>
      <div style={{height:4,background:"#12122a",borderRadius:2,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${col}88,${col})`,borderRadius:2,transition:"width 0.5s"}}/>
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
  const stageCols = { prospect:"#a78bfa", rising:"#78c8ff", peak:"#a8ff78", fading:"#ffd966", veteran:"#ff9f43" };

  return(
    <div style={{marginBottom:6}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:2}}>
        <span style={{color:phaseCol,fontWeight:600}}>{agePhaseLabel(stage)}</span>
        <span style={{color:"#999",fontSize:9}}>{progress}% through stage · {(((TOTAL_CAREER_WEEKS - careerWk)/42)).toFixed(1)}s remaining</span>
      </div>
      {/* Full career bar with coloured stage segments */}
      <div style={{height:5,background:"#12122a",borderRadius:3,overflow:"hidden",position:"relative",display:"flex"}}>
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
              borderRight: "1px solid rgba(0,0,0,0.3)",
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
  const {season, wins, losses, tier, topSynergy, newlyEarned=[], allBoons=[], chronicle} = data;
  const winPct = Math.round(wins/(wins+losses)*100);

  const narrativeParts = [];
  if(chronicle){
    const c = chronicle;
    narrativeParts.push(`In ${c.totalSeasons} season${c.totalSeasons>1?"s":""}, ${townName} climbed from Iron to conquer the Platinum League.`);
    if(c.totalRaids>0) narrativeParts.push(`You won ${c.totalWins} of ${c.totalRaids} raids across the campaign.`);
    if(c.builtCount>0) narrativeParts.push(`${c.builtCount} building${c.builtCount>1?"s were":"was"} constructed to strengthen your realm.`);
    if(c.biggestUpset) narrativeParts.push(`Your greatest upset came against ${c.biggestUpset.enemy} at just ${Math.round(c.biggestUpset.winChance*100)}% win chance in Season ${c.biggestUpset.season}.`);
    if(c.longestStreak?.count>=3) narrativeParts.push(`A ${c.longestStreak.count}-battle winning streak in Season ${c.longestStreak.season} will be remembered.`);
  }

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(10px)",overflowY:"auto",padding:"16px 0"}}>
      <div style={{background:"linear-gradient(160deg,#0a0a1c,#1a1030,#0a1020)",border:"1px solid rgba(255,215,0,0.4)",borderRadius:16,maxWidth:520,width:"92%",overflow:"hidden",boxShadow:"0 0 60px rgba(255,215,0,0.1)"}}>

        {/* Header */}
        <div style={{padding:"28px 28px 18px",textAlign:"center",background:"linear-gradient(180deg,rgba(255,215,0,0.08),transparent)"}}>
          <div style={{fontSize:40,marginBottom:8}}>🏆</div>
          <div style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:22,color:"#ffd966",marginBottom:4}}>
            A Legend is Born
          </div>
          <div style={{fontSize:13,color:"#888"}}>{townName} has conquered the Platinum League</div>
        </div>

        <div style={{padding:"0 24px 24px"}}>
          {/* Season stats */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
            {[
              ["Seasons played", season, "#f0e6d3"],
              ["Win rate", `${winPct}% · ${wins}W/${losses}L`, "#a8ff78"],
            ].map(([label,val,col])=>(
              <div key={label} style={{padding:"10px 8px",borderRadius:9,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",textAlign:"center"}}>
                <div style={{fontSize:11,fontWeight:700,color:col}}>{val}</div>
                <div style={{fontSize:9,color:"#999",marginTop:2}}>{label}</div>
              </div>
            ))}
          </div>

          {topSynergy&&(
            <div style={{padding:"10px 14px",borderRadius:9,background:`${topSynergy.color}10`,border:`1px solid ${topSynergy.color}30`,marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:20}}>{topSynergy.icon}</span>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:topSynergy.color}}>Signature: {topSynergy.name}</div>
                <div style={{fontSize:9,color:"#999"}}>Your most-used formation synergy</div>
              </div>
            </div>
          )}

          {/* Final Chronicle */}
          {narrativeParts.length>0&&(
            <div style={{padding:"12px 14px",borderRadius:9,background:"rgba(255,215,0,0.04)",border:"1px solid rgba(255,215,0,0.15)",marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:700,color:"#ffd966",marginBottom:8,fontFamily:"'Cinzel',serif",letterSpacing:0.5}}>📜 THE CHRONICLE OF {townName.toUpperCase()}</div>
              {narrativeParts.map((p,i)=>(
                <p key={i} style={{margin:"0 0 5px",fontSize:11,color:"#888",lineHeight:1.6}}>{p}</p>
              ))}
              {chronicle?.starPlayer&&(
                <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid rgba(255,215,0,0.1)",display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:16}}>{RACE_ICONS[chronicle.starPlayer.race]||"⚔️"}</span>
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:"#f0e6d3"}}>{chronicle.starPlayer.name}</div>
                    <div style={{fontSize:9,color:"#999"}}>{chronicle.starPlayer.role} · {chronicle.starPlayer.pos} · PWR {chronicle.starPlayer.pwr} · Lv {chronicle.starPlayer.level} — your finest warrior</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Achievements earned */}
          {newlyEarned.length>0&&(
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:700,color:"#ffd966",marginBottom:8,letterSpacing:0.5}}>🏅 ACHIEVEMENTS EARNED</div>
              {newlyEarned.map(id=>{
                const a=ACHIEVEMENTS.find(x=>x.id===id);
                if(!a) return null;
                return(
                  <div key={id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:8,background:"rgba(255,215,0,0.06)",border:"1px solid rgba(255,215,0,0.2)",marginBottom:5}}>
                    <span style={{fontSize:18}}>{a.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,fontWeight:700,color:"#ffd966"}}>{a.name}</div>
                      <div style={{fontSize:9,color:"#999"}}>{a.boon?.desc||""}</div>
                    </div>
                    <span style={{fontSize:9,color:"#a8ff78",background:"rgba(168,255,120,0.1)",padding:"2px 7px",borderRadius:6}}>Unlocked</span>
                  </div>
                );
              })}
            </div>
          )}

          {allBoons.length>0&&(
            <div style={{padding:"10px 14px",borderRadius:9,background:"rgba(120,200,255,0.05)",border:"1px solid rgba(120,200,255,0.2)",marginBottom:16,fontSize:10,color:"#78c8ff"}}>
              🎖️ <b>{allBoons.length} game option{allBoons.length>1?"s":""}</b> unlocked — available when starting your next campaign.
            </div>
          )}

          <div style={{display:"flex",gap:10}}>
            <button onClick={onPlayOn}
              style={{flex:1,padding:"11px 0",borderRadius:8,border:"1px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.04)",color:"#888",cursor:"pointer",fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:12}}>
              Continue Playing
            </button>
            <button onClick={()=>onNewLegacy(allBoons)}
              style={{flex:2,padding:"11px 0",borderRadius:8,border:"none",background:"linear-gradient(135deg,#ff9f43,#ffd966)",color:"#0d0d1a",cursor:"pointer",fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:12}}>
              ⚔️ Begin New Campaign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeeklySummary({summary, onDismiss, townColor}){
  if(!summary) return null;
  const {won,enemy,enemyDiff,enemyPower,playerTier:summaryTier,winChance,goldGain,wages,tribute,heroXP,levelUps,injuries,exhausted,nextOpp,week,topWeakLink,effective,adjustedEnemyPower,phaseWinChances,phaseRolls} = summary;
  const netGold = goldGain - wages + tribute;
  const netCol = netGold>=0?"#a8ff78":"#ff7878";
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
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)"}}>
      <div style={{width:"min(440px,92vw)",maxHeight:"90vh",overflowY:"auto",background:"linear-gradient(160deg,#0c0c1e,#12102a)",border:`1px solid ${won?"rgba(168,255,120,0.3)":"rgba(255,100,100,0.25)"}`,borderRadius:14,overflow:"hidden",boxShadow:`0 0 60px ${won?"rgba(168,255,120,0.07)":"rgba(255,100,100,0.07)"}`}}>

        {/* Outcome banner */}
        <div style={{padding:"14px 20px",background:won?"rgba(168,255,120,0.08)":"rgba(255,100,100,0.08)",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:18,color:won?"#a8ff78":"#ff7878"}}>
                {won?"⚔️ VICTORY":"💀 DEFEAT"}
                {isMiracle&&<span style={{fontSize:11,color:"#ffd966",marginLeft:8,fontFamily:"'Lato',sans-serif",fontWeight:700}}>✨ MIRACLE!</span>}
                {!isMiracle&&isUpset&&<span style={{fontSize:11,color:"#ffd966",marginLeft:8,fontFamily:"'Lato',sans-serif",fontWeight:700}}>⚡ UPSET!</span>}
                {isShock&&<span style={{fontSize:11,color:"#ff9f43",marginLeft:8,fontFamily:"'Lato',sans-serif",fontWeight:700}}>😱 SHOCK LOSS</span>}
                {isDominant&&<span style={{fontSize:11,color:"#78c8ff",marginLeft:8,fontFamily:"'Lato',sans-serif",fontWeight:700}}>💪 DOMINANT</span>}
              </div>
              <div style={{fontSize:11,color:"#888",marginTop:2}}>vs {enemy} <span style={{color:diffStarCol}}>{diffStars}</span> · Week {week}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:9,color:"#999"}}>Overall win chance</div>
              <div style={{fontSize:16,fontWeight:700,color:won?"#a8ff78":"#ff9f43"}}>{Math.round(winChance*100)}%</div>
              {adjustedEnemyPower&&effective&&(
                <div style={{fontSize:9,color:"#888"}}>{effective} vs {adjustedEnemyPower}</div>
              )}
            </div>
          </div>
        </div>

        <div style={{padding:"14px 20px"}}>

          {/* Phase breakdown — the heart of the debrief */}
          {phaseWinChances&&phaseRolls&&(
            <div style={{marginBottom:14}}>
              <div style={{fontSize:9,color:"#888",fontWeight:700,letterSpacing:1,marginBottom:6}}>PHASE BREAKDOWN</div>
              <div style={{display:"flex",gap:6}}>
                {[
                  {pos:"Vanguard",   icon:"🗡️", label:"VAN"},
                  {pos:"Skirmisher", icon:"🏹", label:"SKR"},
                  {pos:"Arbiter",    icon:"✨", label:"ARB"},
                ].map(({pos,icon,label})=>{
                  const pWon = phaseRolls[pos];
                  const pChance = phaseWinChances[pos];
                  const col = pWon?"#a8ff78":"#ff7878";
                  return(
                    <div key={pos} style={{flex:1,padding:"9px 8px",borderRadius:9,
                      background:pWon?"rgba(168,255,120,0.07)":"rgba(255,100,100,0.07)",
                      border:`1px solid ${pWon?"rgba(168,255,120,0.25)":"rgba(255,100,100,0.2)"}`,
                      textAlign:"center"}}>
                      <div style={{fontSize:14,marginBottom:3}}>{icon}</div>
                      <div style={{fontSize:9,color:"#999",marginBottom:2}}>{label}</div>
                      <div style={{fontSize:13,fontWeight:900,color:col}}>{pWon?"✓":"✗"}</div>
                      <div style={{fontSize:9,color:"#888",marginTop:2}}>{Math.round(pChance*100)}% chance</div>
                    </div>
                  );
                })}
              </div>
              <div style={{fontSize:9,color:"#888",marginTop:5,textAlign:"center"}}>
                {POS_KEYS.filter(p=>phaseRolls[p]).length}/3 phases won · 2+ needed for victory
              </div>
            </div>
          )}

          {/* Weak Link */}
          {topWeakLink&&(
            <div style={{padding:"9px 10px",borderRadius:8,background:"rgba(255,100,100,0.05)",border:"1px solid rgba(255,100,100,0.18)",marginBottom:8}}>
              <div style={{fontSize:9,color:"#ff7878",fontWeight:700,marginBottom:3}}>⚠️ WEAK LINK</div>
              <div style={{fontSize:11,fontWeight:700,color:"#f0e6d3",fontFamily:"'Cinzel',serif"}}>{topWeakLink.hero.name}</div>
              <div style={{fontSize:9,color:"#999"}}>{topWeakLink.issues[0]?.reason.slice(0,40)}</div>
            </div>
          )}

          {/* Stats grid */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            {[
              ["💰 Battle reward",  goldGain>0?`+${goldGain.toLocaleString()}g`:"—",          goldGain>0?"#a8ff78":"#555"],
              ["💸 Wages",        `-${wages.toLocaleString()}g`,                             "#ff9f43"],
              ["👑 Tribute",      `+${tribute.toLocaleString()}g`,                          "#ffd966"],
              ["📊 Net gold",     `${netGold>=0?"+":""}${netGold.toLocaleString()}g`,        netCol],
              ["⭐ XP earned",    `+${heroXP} per raider`,                                  "#78c8ff"],
              ["📈 Level-ups",    levelUps.length ? levelUps.map(l=>l.name).join(", ") : "—","#a78bfa"],
            ].map(([label,val,col])=>(
              <div key={label} style={{padding:"8px 10px",background:"rgba(255,255,255,0.025)",borderRadius:7}}>
                <div style={{fontSize:9,color:"#888",marginBottom:2}}>{label}</div>
                <div style={{fontSize:12,fontWeight:700,color:col,wordBreak:"break-word"}}>{val}</div>
              </div>
            ))}
          </div>

          {/* Alerts */}
          {(injuries.length>0||exhausted.length>0)&&(
            <div style={{marginBottom:12}}>
              {injuries.length>0&&(
                <div style={{padding:"7px 10px",borderRadius:7,background:"rgba(255,100,100,0.07)",border:"1px solid rgba(255,100,100,0.2)",marginBottom:5,fontSize:11,color:"#ff9f43"}}>
                  🩸 Injured: {injuries.join(", ")}
                </div>
              )}
              {exhausted.length>0&&(
                <div style={{padding:"7px 10px",borderRadius:7,background:"rgba(255,100,100,0.06)",border:"1px solid rgba(255,80,80,0.15)",fontSize:11,color:"#ff7878"}}>
                  ⚡ Burned out: {exhausted.join(", ")} — rest them urgently
                </div>
              )}
            </div>
          )}

          {/* Next opponent preview */}
          {nextOpp&&(
            <div style={{padding:"9px 12px",borderRadius:8,background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.07)",marginBottom:12}}>
              <div style={{fontSize:9,color:"#888",marginBottom:3}}>NEXT WEEK</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:"#f0e6d3",fontFamily:"'Cinzel',serif"}}>{nextOpp.name}</div>
                  <div style={{fontSize:10,color:"#888"}}><span style={{color:starsColor(nextOppStars)}}>{nextDiffStars}</span> · Power {nextOpp.power}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:9,color:"#999"}}>{nextOpp.specialisation?.label}</div>
                </div>
              </div>
            </div>
          )}

          <button onClick={onDismiss}
            style={{width:"100%",padding:"11px 0",borderRadius:8,border:"none",cursor:"pointer",
              background:`linear-gradient(135deg,${townColor}cc,${townColor}88)`,
              color:"#0d0d1a",fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:13}}>
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── RANDOM EVENT MODAL ──────────────────────────────────────────────────────

function RandomEventModal({event, heroes, onAccept, onDecline}){
  const [selected,setSelected]=useState([]);
  if(!event)return null;

  // ── EMISSARY EVENT: special render — no hero selection ────────────────────
  if(event.isEmissary){
    const lc=event.challenger;
    return(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:250,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(10px)"}}>
        <div style={{width:"min(500px,92vw)",background:"linear-gradient(160deg,#0a0a1c,#1a0a0a,#0a0a1c)",border:"1px solid rgba(255,100,100,0.4)",borderRadius:14,overflow:"hidden",boxShadow:"0 0 80px rgba(255,50,50,0.1)"}}>

          {/* Dramatic header */}
          <div style={{padding:"24px 24px 16px",textAlign:"center",background:"linear-gradient(180deg,rgba(255,50,50,0.1),transparent)"}}>
            <div style={{fontSize:42,marginBottom:8}}>{lc.icon}</div>
            <div style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:20,color:"#ff7878",marginBottom:4}}>A Legendary Challenge</div>
            <div style={{fontSize:13,color:"#888"}}>An emissary has arrived</div>
          </div>

          <div style={{padding:"0 24px 24px"}}>
            {/* Challenger card */}
            <div style={{padding:"14px 16px",borderRadius:10,background:"rgba(255,100,100,0.06)",border:"1px solid rgba(255,100,100,0.25)",marginBottom:16}}>
              <div style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:17,color:"#f0e6d3",marginBottom:4}}>{lc.name}</div>
              <div style={{fontSize:11,color:"#999",fontStyle:"italic",marginBottom:10}}>"{lc.flavour}"</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {[
                  ["⚔️ Power",lc.power,"#ff7878"],
                  ["💰 Reward",`${lc.goldReward?.toLocaleString()||"?"}g`,"#ffd966"],
                ].map(([label,val,col])=>(
                  <div key={label} style={{textAlign:"center",padding:"8px 4px",borderRadius:7,background:"rgba(0,0,0,0.25)"}}>
                    <div style={{fontSize:9,color:"#888",marginBottom:2}}>{label}</div>
                    <div style={{fontSize:13,fontWeight:700,color:col}}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{fontSize:11,color:"#999",marginBottom:14,lineHeight:1.6,textAlign:"center"}}>
              This is an <b style={{color:"#f0e6d3"}}>exhibition match</b> — no rank penalty if you lose.<br/>
              Win and claim legendary gold and renown. Lose with your honour intact.
            </div>

            {/* Specialisation warning if set */}
            {lc.specialisation&&(
              <div style={{padding:"8px 12px",borderRadius:8,background:"rgba(255,100,100,0.05)",border:"1px solid rgba(255,100,100,0.15)",marginBottom:14,fontSize:10,color:"#888"}}>
                {lc.specialisation.icon} They fight with <b style={{color:"#ff9f43"}}>{lc.specialisation.label}</b> — prepare your counter accordingly.
              </div>
            )}

            <div style={{display:"flex",gap:10}}>
              <button onClick={onDecline}
                style={{flex:1,padding:"11px 0",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.03)",color:"#888",cursor:"pointer",fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:11}}>
                Decline with Honour
              </button>
              <button onClick={()=>onAccept(event,[])}
                style={{flex:2,padding:"11px 0",borderRadius:8,border:"none",background:"linear-gradient(135deg,#cc2222,#ff4444)",color:"#fff",cursor:"pointer",fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:13}}>
                ⚔️ Accept the Challenge
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
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:250,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)"}}>
      <div style={{width:"min(560px,95vw)",maxHeight:"88vh",background:"linear-gradient(160deg,#0c0c1e,#12102a)",border:"1px solid rgba(255,215,0,0.3)",borderRadius:14,overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 0 60px rgba(255,215,0,0.08)"}}>

        {/* Header */}
        <div style={{padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,0.06)",background:"rgba(0,0,0,0.3)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <span style={{fontSize:26}}>{event.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:16,color:"#ffd966"}}>{event.title}</div>
              <div style={{fontSize:10,color:"#999",textTransform:"capitalize"}}>{event.theme} · {event.awayWeeks[0]} week{event.awayWeeks[0]>1?"s":""} away · {event.heroesNeeded} hero{event.heroesNeeded>1?"es":""}</div>
            </div>
            {selectionConfidence&&(
              <div style={{padding:"4px 10px",borderRadius:7,background:`${selectionConfidence.color}18`,border:`1px solid ${selectionConfidence.color}44`,fontSize:11,fontWeight:700,color:selectionConfidence.color}}>
                {selectionConfidence.icon} {selectionConfidence.label}
              </div>
            )}
          </div>
          <div style={{fontSize:11,color:"#aaa",lineHeight:1.6,fontStyle:"italic"}}>"{event.flavour}"</div>
        </div>

        {/* Reward */}
        <div style={{padding:"10px 20px",borderBottom:"1px solid rgba(255,255,255,0.05)",background:"rgba(168,255,120,0.04)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:10,color:"#a8ff78",fontWeight:700}}>🎁 SUCCESS REWARD</div>
            <div style={{fontSize:12,fontWeight:700,color:"#a8ff78"}}>{event.rewardDesc}</div>
          </div>
          <div style={{fontSize:9,color:"#888",marginTop:3}}>Partial success earns 50% reward · Outcome resolves on return</div>
        </div>

        {/* Hero selection */}
        <div style={{flex:1,overflowY:"auto",padding:"12px 20px"}}>
          <div style={{fontSize:10,color:"#999",fontWeight:700,marginBottom:8,letterSpacing:1}}>
            SELECT {event.heroesNeeded} HERO{event.heroesNeeded>1?"ES":""} — {available.length} available
          </div>
          {available.length===0&&(
            <div style={{fontSize:12,color:"#999",padding:12}}>No available heroes right now — all are injured, away, or retired.</div>
          )}
          {sortedHeroes.map(h=>{
            const isSelected = selected.find(x=>x.id===h.id);
            const matchScore = calcMatchScore(h, event);
            const confidence = getEventConfidence(matchScore);
            const {label:fl, color:fc} = fatigueLabel(h.fatigue||0);
            return(
              <div key={h.id} onClick={()=>toggleHero(h)}
                style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:9,marginBottom:5,cursor:"pointer",
                  background:isSelected?"rgba(168,255,120,0.08)":"rgba(255,255,255,0.03)",
                  border:`1px solid ${isSelected?"rgba(168,255,120,0.4)":"rgba(255,255,255,0.07)"}`,transition:"all 0.15s"}}>
                <span style={{fontSize:20}}>{RACE_ICONS[h.race]}</span>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:13,color:"#f0e6d3"}}>{h.name}</div>
                  <div style={{display:"flex",gap:8,fontSize:10,color:"#888",flexWrap:"wrap",marginTop:2}}>
                    <span>{h.role} · Lv {h.level}</span>
                    <span style={{color:fc}}>{fl} fatigue</span>
                    <span style={{color:confidence.color,fontWeight:700}}>{confidence.icon} {confidence.label}</span>
                  </div>
                </div>
                {isSelected&&<div style={{fontSize:14,color:"#a8ff78",fontWeight:700}}>✓</div>}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{padding:"12px 20px",borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",gap:8,background:"rgba(0,0,0,0.2)"}}>
          <button onClick={()=>canAccept&&onAccept(event,selected)} disabled={!canAccept}
            style={{flex:2,padding:"11px 0",borderRadius:8,border:"none",cursor:canAccept?"pointer":"not-allowed",
              background:canAccept?"linear-gradient(135deg,#a8ff78,#48c774)":"#1a1a2a",
              color:canAccept?"#0d0d1a":"#444",fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:13}}>
            {canAccept?`✓ Send ${selected.map(h=>h.name).join(" & ")}`:`Select ${event.heroesNeeded} hero${event.heroesNeeded>1?"es":""}`}
          </button>
          <button onClick={onDecline}
            style={{flex:1,padding:"11px 0",borderRadius:8,border:"1px solid rgba(255,100,100,0.3)",cursor:"pointer",
              background:"rgba(255,100,100,0.08)",color:"#ff7878",fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:12}}>
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
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:260,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)",padding:"16px"}}>
      <div style={{width:"min(520px,95vw)",maxHeight:"88vh",background:"linear-gradient(160deg,#0c0c1e,#1a102a)",border:"1px solid rgba(167,139,250,0.4)",borderRadius:14,overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 0 60px rgba(167,139,250,0.1)"}}>

        {/* Header */}
        <div style={{padding:"20px 22px 14px",borderBottom:"1px solid rgba(255,255,255,0.06)",background:"rgba(0,0,0,0.3)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
            <span style={{fontSize:28}}>{event.icon}</span>
            <div>
              <div style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:16,color:"#a78bfa"}}>{event.title}</div>
              <div style={{fontSize:10,color:"#888"}}>Cost: {event.cost}g · Choose a hero to receive training</div>
            </div>
          </div>
          <div style={{fontSize:11,color:"#aaa",fontStyle:"italic",lineHeight:1.6}}>"{event.flavour}"</div>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"14px 22px"}}>
          {/* Hero selection */}
          <div style={{fontSize:10,color:"#999",fontWeight:700,marginBottom:8,letterSpacing:1}}>CHOOSE A HERO</div>
          {available.map(h=>{
            const isSel = selectedHero?.id===h.id;
            return(
              <div key={h.id} onClick={()=>setSelectedHero(h)}
                style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:9,
                  marginBottom:5,cursor:"pointer",transition:"all 0.15s",
                  background:isSel?"rgba(167,139,250,0.1)":"rgba(255,255,255,0.03)",
                  border:`1px solid ${isSel?"rgba(167,139,250,0.4)":"rgba(255,255,255,0.07)"}`}}>
                <span style={{fontSize:20}}>{RACE_ICONS[h.race]}</span>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:13,color:"#f0e6d3"}}>{h.name}</div>
                  <div style={{fontSize:10,color:"#888"}}>{h.role} · Lv {h.level}</div>
                </div>
                {isSel&&<div style={{fontSize:14,color:"#a78bfa",fontWeight:700}}>✓</div>}
              </div>
            );
          })}

          {/* Stat selection */}
          {selectedHero&&(
            <>
              <div style={{fontSize:10,color:"#999",fontWeight:700,margin:"14px 0 8px",letterSpacing:1}}>CHOOSE A STAT TO BOOST</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {CHOOSABLE_STATS.map(s=>{
                  const isSel = selectedStat===s;
                  return(
                    <button key={s} onClick={()=>setSelectedStat(s)}
                      style={{padding:"5px 10px",borderRadius:7,border:`1px solid ${isSel?"rgba(167,139,250,0.5)":"rgba(255,255,255,0.1)"}`,
                        background:isSel?"rgba(167,139,250,0.15)":"rgba(255,255,255,0.04)",
                        color:isSel?"#a78bfa":"#888",cursor:"pointer",fontSize:10,fontWeight:isSel?700:400}}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div style={{padding:"12px 22px",borderTop:"1px solid rgba(255,255,255,0.05)",background:"rgba(0,0,0,0.2)"}}>
          {!canAfford&&<div style={{fontSize:10,color:"#ff7878",marginBottom:8}}>⚠️ Not enough gold ({gold}g / {event.cost}g required)</div>}
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>canAccept&&onAccept(selectedHero, selectedStat)} disabled={!canAccept}
              style={{flex:2,padding:"11px 0",borderRadius:8,border:"none",
                cursor:canAccept?"pointer":"not-allowed",
                background:canAccept?"linear-gradient(135deg,#a78bfa,#7c3aed)":"#1a1a2a",
                color:canAccept?"#fff":"#444",fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:12}}>
              {canAccept?`✓ Pay ${event.cost}g & Train ${selectedHero?.name}`:"Select hero & stat"}
            </button>
            <button onClick={onDecline}
              style={{flex:1,padding:"11px 0",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",
                cursor:"pointer",background:"rgba(255,255,255,0.03)",color:"#888",
                fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:11}}>
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroCard({hero,selected,onClick,compact,showBuy,onBuy,canAfford,rosterFull,draggable,onDragStart,isListed,hasBid,isLeader,showHiddenStats}){
  // Use best-position combat score as the displayed power figure
  const power = Math.round(Math.max(...POS_KEYS.map(p=>calcHeroCombatScore(hero,p))));
  const avgMental=Math.round(STAT_GROUPS.Mental.reduce((a,s)=>a+hero.stats[s],0)/STAT_GROUPS.Mental.length);
  const phase=agePhase(hero);
  const {label:hLabel,color:hColor}=moraleLabel(hero.morale);
  const contractUrgent=(hero.contractWeeksLeft||0)<=WEEKS_PER_CONTRACT_YEAR;
  return(
    <div onClick={onClick} draggable={draggable} onDragStart={onDragStart}
      style={{background:selected?"rgba(120,200,255,0.09)":"rgba(255,255,255,0.025)",
              border:`1px solid ${selected?"#78c8ff":hasBid?"rgba(255,215,0,0.5)":hero.negotiationPending?"rgba(255,159,67,0.5)":contractUrgent?"rgba(255,100,100,0.3)":hero.injured?"rgba(255,100,100,0.3)":"rgba(255,255,255,0.07)"}`,
              borderRadius:10,padding:compact?"9px 12px":13,cursor:draggable?"grab":"pointer",transition:"border 0.2s",marginBottom:5}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:compact?0:7}}>
        <span style={{fontSize:compact?17:21}}>{RACE_ICONS[hero.race]}</span>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:compact?12:14,color:"#f0e6d3",fontFamily:"'Cinzel',serif"}}>
            {hero.name}
            {hero.injured&&<span style={{fontSize:9,color:"#ff7878",marginLeft:4}}>🩸</span>}
            {hero.negotiationPending&&<span style={{fontSize:9,color:"#ff9f43",marginLeft:4}}>📜</span>}
            {isLeader&&<span style={{fontSize:9,color:"#ffd966",marginLeft:4}}>👑</span>}
            {hero.foundling&&showHiddenStats&&<span style={{fontSize:9,color:"#a78bfa",marginLeft:4}}>✨</span>}
            {hero.fodder&&<span style={{fontSize:9,color:"#888",marginLeft:4}}>⚙️</span>}
            {isListed&&<span style={{fontSize:9,color:"#ffd966",marginLeft:4}}>🏷️</span>}
            {hasBid&&<span style={{fontSize:9,color:"#a8ff78",marginLeft:4}}>💰</span>}
            {(hero.awayWeeks||0)>0&&<span style={{fontSize:9,color:"#78c8ff",marginLeft:4}}>✈️{hero.awayWeeks}w</span>}
          </div>
          <div style={{fontSize:10,color:"#888"}}>{hero.race} {ROLE_ICONS[hero.role]} {hero.role} · Lv {hero.level}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:10,color:agePhaseColor(phase),fontWeight:600}}>{agePhaseLabel(phase)}</div>
          <div style={{fontSize:9,color:hColor}}>{hLabel}</div>
        </div>
      </div>
      {!compact&&(<>
        <AgeBar hero={hero}/>
        
        <ContractBar hero={hero}/>
        <XPBar xp={hero.xp} level={hero.level}/>
        <div style={{display:"flex",gap:6,marginBottom:7}}>
          {[["⚔️","PWR",power],["🧠","MNT",avgMental],["💛","MRL",hero.morale]].map(([ic,l,v])=>(
            <div key={l} style={{flex:1,background:"rgba(0,0,0,0.25)",borderRadius:6,padding:"4px 0",textAlign:"center"}}>
              <div style={{fontSize:9,color:"#999"}}>{ic} {l}</div>
              <div style={{fontSize:14,fontWeight:700,color:v>=40?"#a8ff78":v>=25?"#78c8ff":"#ffd966"}}>{l==="MRL"?v:Math.round(v)}</div>
            </div>
          ))}
          <div style={{flex:1,background:"rgba(0,0,0,0.25)",borderRadius:6,padding:"4px 0",textAlign:"center"}}>
            <div style={{fontSize:9,color:"#999"}}>⚡ FAT</div>
            <div style={{fontSize:14,fontWeight:700,color:fatigueLabel(hero.fatigue||0).color}}>{hero.fatigue||0}</div>
          </div>
        </div>
        {(hero.awayWeeks||0)>0&&(
          <div style={{padding:"5px 8px",borderRadius:6,background:"rgba(120,200,255,0.08)",border:"1px solid rgba(120,200,255,0.2)",fontSize:10,color:"#78c8ff",marginBottom:6}}>
            ✈️ Away on mission: "{hero.awayEvent}" — returns in {hero.awayWeeks} week{hero.awayWeeks>1?"s":""}
          </div>
        )}
        <div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:7}}>
          {hero.traits.map(t=><span key={t} style={{fontSize:9,background:"rgba(167,139,250,0.1)",color:"#a78bfa",padding:"2px 7px",borderRadius:10,border:"1px solid rgba(167,139,250,0.18)"}}>{t}</span>)}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#999"}}>
          <span>💰 {hero.salary}g/wk</span>
          <span style={{color:"#ffd966"}}>⚖️ {hero.value.toLocaleString()}g</span>
        </div>
      </>)}
      {showBuy&&<button onClick={e=>{e.stopPropagation();onBuy(hero);}} disabled={!canAfford||rosterFull} style={{marginTop:8,width:"100%",padding:"6px 0",borderRadius:6,border:"none",cursor:(canAfford&&!rosterFull)?"pointer":"not-allowed",background:(canAfford&&!rosterFull)?"linear-gradient(135deg,#ffd966,#ff9f43)":"#1e1e30",color:(canAfford&&!rosterFull)?"#0d0d1a":"#444",fontWeight:700,fontSize:11,fontFamily:"'Cinzel',serif"}}>{rosterFull?"🚫 Roster Full":canAfford?hero.value===0?"🆓 Sign Free":(`⚔️ Sign for ${hero.value.toLocaleString()}g`):"💸 Can't Afford"}</button>}
    </div>
  );
}

function HeroDetail({hero,prevStats,onClose,onRelease,onEarlyRenew,isListed,onToggleListed,heroBids,onAcceptBid,onDeclineBid,showHiddenStats,isLeader,onSetLeader}){
  const [tab,setTab]=useState("Combat");
  if(!hero)return null;
  const phase=agePhase(hero);
  const declining=["fading","veteran"].includes(phase);
  const {label:hLabel,color:hColor}=moraleLabel(hero.morale);
  const demand=calcDemand(hero);
  return(
    <div className="rm-detail-panel" style={{background:"linear-gradient(180deg,#09091a,#0e0e20)",borderLeft:"1px solid rgba(120,200,255,0.12)",padding:0,boxSizing:"border-box"}}>
      {/* Sticky header — always visible even when scrolled */}
      <div className="rm-detail-header" style={{position:"sticky",top:0,zIndex:10,background:"rgba(9,9,26,0.97)",borderBottom:"1px solid rgba(255,255,255,0.07)",padding:"12px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",backdropFilter:"blur(10px)"}}>
        <span style={{fontFamily:"'Cinzel',serif",color:"#f0e6d3",fontSize:14,fontWeight:700}}>
          {hero.name}{isListed&&<span style={{fontSize:9,color:"#ffd966",marginLeft:7,background:"rgba(255,215,0,0.12)",padding:"1px 6px",borderRadius:8,border:"1px solid rgba(255,215,0,0.2)"}}>🏷️ Listed</span>}
        </span>
        <button onClick={onClose} className="rm-detail-close" style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",color:"#ccc",fontSize:12,cursor:"pointer",borderRadius:7,padding:"6px 14px",fontFamily:"'Lato',sans-serif",fontWeight:700,lineHeight:1}}>✕ Close</button>
      </div>
      <div style={{padding:18,overflowY:"auto",height:"calc(100% - 49px)"}}>

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
              <span style={{color:fColor,fontWeight:600}}>⚡ {fLabel}</span>
              <span style={{color:"#999",fontSize:9}}>{fat}/100 fatigue</span>
            </div>
            <div style={{height:4,background:"#12122a",borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${pct}%`,background:fColor,borderRadius:2,transition:"width 0.5s"}}/>
            </div>
            {fat>=FATIGUE_WARN&&<div style={{fontSize:9,color:fColor,marginTop:2}}>⚠️ {fat>=FATIGUE_CRITICAL?"Combat effectiveness severely reduced — rest urgently":"Combat effectiveness reduced — consider resting"}</div>}
          </div>
        );
      })()}

      {/* Away on mission */}
      {(hero.awayWeeks||0)>0&&(
        <div style={{padding:"7px 10px",borderRadius:7,background:"rgba(120,200,255,0.07)",border:"1px solid rgba(120,200,255,0.2)",marginBottom:10,fontSize:10,color:"#78c8ff"}}>
          ✈️ Away: "{hero.awayEvent}" — returns in {hero.awayWeeks} week{hero.awayWeeks>1?"s":""}
        </div>
      )}

      {/* Mentor bonus */}
      {hero.mentorBonus&&hero.mentorBonus.weeksLeft>0&&(
        <div style={{padding:"7px 10px",borderRadius:7,background:"rgba(255,159,67,0.07)",border:"1px solid rgba(255,159,67,0.25)",marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14}}>🎖️</span>
          <div style={{flex:1}}>
            <div style={{fontSize:10,fontWeight:700,color:"#ff9f43"}}>Mentored by {hero.mentorBonus.mentorName}</div>
            <div style={{fontSize:9,color:"#888"}}>+{hero.mentorBonus.xpPerWeek} XP/week · {hero.mentorBonus.weeksLeft} weeks remaining</div>
          </div>
          <div style={{fontSize:12,fontWeight:700,color:"#ffd966"}}>+{hero.mentorBonus.xpPerWeek} XP/wk</div>
        </div>
      )}

      {/* Active offers */}
      {heroBids&&heroBids.length>0&&(
        <div style={{marginBottom:10}}>
          {heroBids.map(bid=>(
            <div key={bid.id} style={{padding:"10px 12px",borderRadius:8,background:"rgba(255,215,0,0.06)",border:"1px solid rgba(255,215,0,0.25)",marginBottom:6}}>
              <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:12,color:"#ffd966",marginBottom:3}}>💰 Bid from {bid.town}</div>
              <div style={{fontSize:13,fontWeight:900,color:"#a8ff78",marginBottom:2}}>{bid.offer.toLocaleString()}g <span style={{fontSize:10,color:"#999",fontWeight:400}}>({bid.pctOfValue}% of market value)</span></div>
              <div style={{fontSize:10,color:"#888",marginBottom:8}}>Interested in: {bid.reason}</div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>onAcceptBid(bid)} style={{flex:1,padding:"7px 0",borderRadius:6,border:"none",cursor:"pointer",background:"linear-gradient(135deg,#a8ff78,#48c774)",color:"#0d0d1a",fontWeight:700,fontSize:11,fontFamily:"'Cinzel',serif"}}>✓ Accept {bid.offer.toLocaleString()}g</button>
                <button onClick={()=>onDeclineBid(bid)} style={{flex:1,padding:"7px 0",borderRadius:6,border:"1px solid rgba(255,100,100,0.25)",cursor:"pointer",background:"rgba(255,100,100,0.07)",color:"#ff7878",fontWeight:700,fontSize:11,fontFamily:"'Cinzel',serif"}}>✗ Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Morale breakdown */}
      <div style={{padding:"8px 10px",borderRadius:7,background:`${hColor}10`,border:`1px solid ${hColor}25`,marginBottom:10,fontSize:10,color:hColor}}>
        <strong>{hLabel}</strong>
        {hero.morale>=80&&" — Squad spirit is high. Performing at their best."}
        {hero.morale>=60&&hero.morale<80&&" — Morale is stable. No major concerns."}
        {hero.morale>=40&&hero.morale<60&&" — Morale is slipping. Address it soon."}
        {hero.morale>=20&&hero.morale<40&&" — Actively unhappy. Performance suffering."}
        {hero.morale<20&&" — On the verge of walking out. Act now."}
        {hero.weeksUnplayed>0&&` Benched ${hero.weeksUnplayed} week(s).`}
      </div>

      {/* Contract forecast */}
      <div style={{padding:"8px 10px",borderRadius:7,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",marginBottom:10,fontSize:10,color:"#888"}}>
        <div style={{fontWeight:700,color:"#ffd966",marginBottom:3}}>📜 Contract Forecast</div>
        <div>Current salary: <b style={{color:"#f0e6d3"}}>{hero.salary}g/wk</b></div>
        <div>Estimated renewal demand: <b style={{color:"#ff9f43"}}>{demand.salary}g/wk</b> · {demand.years}s</div>
        {hero.traits?.includes("Greedy")&&<div style={{color:"#ff7878",marginTop:2}}>⚠️ Greedy trait: +30% demand</div>}
        {hero.traits?.includes("Loyal")&&<div style={{color:"#a8ff78",marginTop:2}}>✓ Loyal trait: –20% demand</div>}
        {hero.traits?.includes("Stubborn")&&<div style={{color:"#ffd966",marginTop:2}}>⚠️ Stubborn: won't negotiate down</div>}
        {}
        {(hero.stats["Negotiation"]||0)>30&&(()=>{
          const negStat=hero.stats["Negotiation"]||0;
          const premium=Math.round(Math.min(20,(negStat-20)/79*20));
          const shorterContract = negStat > 40;
          return <div style={{color:"#ff9f43",marginTop:2}}>🤝 Negotiation {negStat}: +{premium}% salary demand{shorterContract?" · prefers short contracts":""}</div>;
        })()}
        {(hero.stats["Reputation"]||0)>30&&(()=>{
          const repStat=hero.stats["Reputation"]||0;
          const bidBonus=Math.round((repStat-20)/79*10);
          return <div style={{color:"#78c8ff",marginTop:2}}>⭐ Reputation {repStat}: offers up to +{bidBonus}% value</div>;
        })()}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:10}}>
        {hero.traits.map(t=>{
          const te=TRAIT_EFFECTS[t];
          const col=te?.color||"#a78bfa";
          return(
            <div key={t} style={{padding:"5px 9px",borderRadius:8,background:`${col}12`,border:`1px solid ${col}30`,display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
              <span style={{fontSize:11,fontWeight:700,color:col,fontFamily:"'Cinzel',serif"}}>{t}</span>
              {te?.desc&&<span style={{fontSize:9,color:"#888",textAlign:"right",flex:1}}>{te.desc}</span>}
            </div>
          );
        })}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:10}}>
        {[["Race",`${RACE_ICONS[hero.race]} ${hero.race}`],["Role",`${ROLE_ICONS[hero.role]} ${hero.role}`],
          ["Stage",`${agePhaseLabel(phase)} ${Math.round(hero.stageProgress||0)}%`],["Level",`⭐ ${hero.level}`],
          ["Salary",`${hero.salary}g/wk`],["Value",`${hero.value.toLocaleString()}g`],
          ["Morale",`${hero.morale}%`],["Status",hero.injured?`🩸 ${hero.injuryWeeks}wks`:"✅ Fit"],
        ].map(([k,v])=>(
          <div key={k} style={{background:"rgba(255,255,255,0.03)",borderRadius:6,padding:"5px 8px"}}>
            <div style={{fontSize:9,color:"#888",marginBottom:1}}>{k}</div>
            <div style={{fontSize:11,fontWeight:700,color:"#f0e6d3"}}>{v}</div>
          </div>
        ))}
      </div>

      {/* Form & Reputation — bid drivers */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:10}}>
        {(()=>{
          const form = hero.stats.Form || 5;
          const rep  = hero.stats.Reputation || 0;
          const formCol = form>=8?"#a8ff78":form>=6?"#ffd966":form<4?"#ff7878":"#888";
          const repCol  = rep>=60?"#a8ff78":rep>=30?"#ffd966":"#888";
          const formLabel = form>=9?"In the form of their life":form>=7?"Good form":form>=5?"Average form":form>=3?"Poor form":"Out of form";
          const repLabel  = rep>=70?"Renowned":rep>=50?"Well known":rep>=30?"Building reputation":"Unknown";
          return(<>
            <div style={{background:"rgba(255,255,255,0.03)",borderRadius:6,padding:"7px 8px",border:`1px solid ${formCol}22`}}>
              <div style={{fontSize:9,color:"#888",marginBottom:3}}>📈 Form (offer premium)</div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{flex:1,height:4,background:"rgba(255,255,255,0.06)",borderRadius:2}}>
                  <div style={{width:`${form*10}%`,height:"100%",background:formCol,borderRadius:2,transition:"width 0.3s"}}/>
                </div>
                <span style={{fontSize:10,fontWeight:700,color:formCol}}>{form.toFixed(1)}/10</span>
              </div>
              <div style={{fontSize:9,color:formCol,marginTop:2}}>{formLabel}</div>
              {form>=7&&<div style={{fontSize:8,color:"#888",marginTop:1}}>+{Math.round(((form-7)/3)*25)}% offer premium</div>}
              {form<4&&<div style={{fontSize:8,color:"#ff9f43",marginTop:1}}>−10% bid discount</div>}
            </div>
            <div style={{background:"rgba(255,255,255,0.03)",borderRadius:6,padding:"7px 8px",border:`1px solid ${repCol}22`}}>
              <div style={{fontSize:9,color:"#888",marginBottom:3}}>👁️ Reputation (scout interest)</div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{flex:1,height:4,background:"rgba(255,255,255,0.06)",borderRadius:2}}>
                  <div style={{width:`${rep}%`,height:"100%",background:repCol,borderRadius:2,transition:"width 0.3s"}}/>
                </div>
                <span style={{fontSize:10,fontWeight:700,color:repCol}}>{Math.round(rep)}</span>
              </div>
              <div style={{fontSize:9,color:repCol,marginTop:2}}>{repLabel}</div>
              <div style={{fontSize:8,color:"#888",marginTop:1}}>+0.4 per battle</div>
            </div>
          </>);
        })()}
      </div>
      {declining&&<div style={{padding:"7px 10px",borderRadius:7,background:"rgba(255,100,100,0.07)",border:"1px solid rgba(255,100,100,0.2)",marginBottom:10,fontSize:10,color:"#ff9f43"}}>⚠️ {agePhaseLabel(phase)} — consider moving to Arbiter where mental stats carry.</div>}

      {/* Career arc guidance — sell window signal */}
      {(()=>{
        const careerWk = stageToCareerWeek(hero.stage||"peak", hero.stageProgress||0);
        const weeksLeft = Math.max(0, TOTAL_CAREER_WEEKS - careerWk);
        const seasonsLeft = (weeksLeft / 42).toFixed(1);
        const bidFreq = {prospect:0.8,rising:0.9,peak:1.0,fading:0.3,veteran:0.12}[phase]??1.0;
        const bidQual = {prospect:"90%",rising:"95%",peak:"full value",fading:"60%",veteran:"38%"}[phase];
        const isApproachingFade = phase==="peak" && (hero.stageProgress||0) > 70;

        const arcConfig = {
          prospect: { col:"#a78bfa", icon:"🌱", title:"Prospect — Developing", advice:"Play regularly to build Form and Reputation. Value grows quickly with levels.", action:null },
          rising:   { col:"#78c8ff", icon:"📈", title:"Rising — Good Investment Window", advice:"Stats growing fast. Bids are strong. A few more levels and this hero peaks.", action:null },
          peak:     { col:"#a8ff78", icon:"⚡", title:"Peak — Prime Selling Window", advice:isApproachingFade?"Late Peak — Fading stage approaching. Sell now for best return.":"Bids are highest and most frequent here. Form 8+ attracts above-market offers.", action:isApproachingFade?"⚠️ Sell window closing — list soon.":"Consider listing if you have a replacement ready." },
          fading:   { col:"#ffd966", icon:"📉", title:"Fading — Hard to Sell", advice:"Bids are rare (30% base chance) at ~60% of value. Stats declining weekly.", action:"Squad Leader role extracts remaining value — let contract expire naturally." },
          veteran:  { col:"#ff9f43", icon:"🕯️", title:"Veteran — Effectively Unsellable", advice:"Bids very rare (12% chance) at 38% of value. Retirement approaching.", action:"Keep for Squad Leader bonus and mentorship on retirement." },
        }[phase]||{col:"#888",icon:"?",title:"Unknown",advice:"",action:null};

        return(
          <div style={{padding:"9px 11px",borderRadius:8,background:`${arcConfig.col}0d`,border:`1px solid ${arcConfig.col}30`,marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}>
              <span style={{fontSize:14}}>{arcConfig.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:700,color:arcConfig.col,fontFamily:"'Cinzel',serif"}}>{arcConfig.title}</div>
                <div style={{fontSize:9,color:"#888",marginTop:1}}>{seasonsLeft}s until retirement · Bids: {Math.round(bidFreq*100)}% chance · Quality: {bidQual}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:9,color:"#888"}}>Value</div>
                <div style={{fontSize:13,fontWeight:700,color:arcConfig.col}}>{hero.value.toLocaleString()}g</div>
              </div>
            </div>
            <div style={{fontSize:10,color:"#888",lineHeight:1.5,marginBottom:arcConfig.action?5:0}}>{arcConfig.advice}</div>
            {arcConfig.action&&(
              <div style={{fontSize:10,fontWeight:700,color:arcConfig.col,padding:"4px 8px",borderRadius:5,background:`${arcConfig.col}14`,marginTop:3}}>
                💡 {arcConfig.action}
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
              style={{flex:1,minWidth:55,padding:"5px 0",borderRadius:5,border:isLocked?"1px solid rgba(255,255,255,0.06)":"none",
                cursor:isLocked?"default":"pointer",fontSize:9,
                background:isActive?"rgba(120,200,255,0.15)":isLocked?"rgba(255,255,255,0.02)":"rgba(255,255,255,0.04)",
                color:isActive?"#78c8ff":isLocked?"#333":"#666",
                fontWeight:isActive?700:400,
              }}>
              {isLocked ? "🔒 Hidden" : g}
            </button>
          );
        })}
      </div>
      {tab==="Hidden"&&!showHiddenStats ? null :
        tab==="Hidden" ? (
          <div>
            {/* Potential — bucket until revealed, exact with showHiddenStats */}
            <div style={{marginBottom:8,padding:"8px 10px",borderRadius:7,background:"rgba(255,215,0,0.05)",border:"1px solid rgba(255,215,0,0.15)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <span style={{fontSize:11,color:"#ffd966",fontWeight:700}}>Potential</span>
                {hero.potentialRevealed ? (()=>{
                  const b = potentialBucket(hero.stats.Potential);
                  return(
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:11,fontWeight:700,color:b.color}}>{b.icon} {b.label}</span>
                      {showHiddenStats&&<span style={{fontSize:10,color:"#888"}}>({hero.stats.Potential})</span>}
                    </div>
                  );
                })() : (
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:10,color:"#888"}}>⏳ Unknown</span>
                    <span style={{fontSize:9,color:"#555"}}>{Math.max(0,8-(hero.weeksInFormation||0))}+ raids to reveal</span>
                  </div>
                )}
              </div>
              {!hero.potentialRevealed&&(
                <div style={{height:3,borderRadius:2,background:"#12122a",overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${Math.min(100,((hero.weeksInFormation||0)/9)*100)}%`,background:"linear-gradient(90deg,#7c3aed,#ffd966)",borderRadius:2,transition:"width 0.5s"}}/>
                </div>
              )}
            </div>
            {/* Form */}
            <StatBar label="Form" value={hero.stats.Form} prev={prevStats?.Form}/>
          </div>
        ) :
        STAT_GROUPS[tab].map(s=>(
          <StatBar key={s} label={s} value={hero.stats[s]} prev={prevStats?.[s]}
            highlight={s==="Potential"}
            dimmed={declining&&PHYSICAL_STATS.includes(s)}/>
        ))
      }

      {/* Squad Leader */}
      {(()=>{
        const score=calcLeaderScore(hero);
        const mult=calcLeaderMult(hero);
        const lb=calcLeaderBonuses(hero);
        const scorePct=Math.round(score*100);
        const col=isLeader?"#ffd966":score>0.5?"#78c8ff":"#555";
        return(
          <div style={{marginBottom:10,padding:"10px 12px",borderRadius:8,
            background:isLeader?"rgba(255,215,0,0.07)":"rgba(255,255,255,0.03)",
            border:`1px solid ${isLeader?"rgba(255,215,0,0.3)":"rgba(255,255,255,0.07)"}`}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <span style={{fontSize:14}}>👑</span>
              <div style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:700,color:isLeader?"#ffd966":"#888",fontFamily:"'Cinzel',serif"}}>
                  {isLeader?"Squad Leader":"Squad Leader Candidate"}
                </div>
                <div style={{fontSize:9,color:"#999"}}>
                  Leadership score: {scorePct}% · ×{mult.toFixed(2)} bonus
                  <span style={{marginLeft:6,color:"#888"}}>
                    ({Math.round((hero.weeksInSquad||0))} wks in squad · {agePhaseLabel(phase)} {Math.round(hero.stageProgress||0)}%)
                  </span>
                </div>
              </div>
            </div>
            {/* Bonus breakdown */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4,marginBottom:8}}>
              {[
                ["⚔️ Morale/wk",`+${lb.moralePerWeek}`,"#a8ff78"],
                ["⭐ XP mult",`×${lb.xpMult.toFixed(2)}`,"#78c8ff"],
                ["🛡️ Defeat",`−${lb.defeatMoralePct}%`,"#ffd966"],
              ].map(([label,val,c])=>(
                <div key={label} style={{padding:"4px 6px",borderRadius:5,background:"rgba(0,0,0,0.2)",textAlign:"center"}}>
                  <div style={{fontSize:8,color:"#888"}}>{label}</div>
                  <div style={{fontSize:11,fontWeight:700,color:c}}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:9,color:"#888",marginBottom:6}}>Bonuses apply only when in formation</div>
            <button onClick={onSetLeader}
              style={{width:"100%",padding:"6px 0",borderRadius:6,border:`1px solid ${isLeader?"rgba(255,215,0,0.4)":"rgba(255,255,255,0.12)"}`,
                cursor:"pointer",background:isLeader?"rgba(255,215,0,0.1)":"rgba(255,255,255,0.04)",
                color:isLeader?"#ffd966":"#888",fontWeight:700,fontSize:10,fontFamily:"'Cinzel',serif"}}>
              {isLeader?"👑 Remove as Squad Leader":"👑 Appoint as Squad Leader"}
            </button>
          </div>
        );
      })()}

      {/* Transfer / release buttons */}
      <div style={{marginTop:10,display:"flex",gap:6,flexWrap:"wrap"}}>
        {onToggleListed&&(
          <button onClick={()=>onToggleListed(hero)} style={{flex:1,padding:"7px 0",borderRadius:6,border:`1px solid ${isListed?"rgba(255,215,0,0.4)":"rgba(255,255,255,0.15)"}`,background:isListed?"rgba(255,215,0,0.1)":"rgba(255,255,255,0.04)",color:isListed?"#ffd966":"#888",cursor:"pointer",fontWeight:700,fontSize:11,fontFamily:"'Cinzel',serif"}}>
            {isListed?"🏷️ Unlist":"🏷️ List for Sale"}
          </button>
        )}
        {/* Early renewal — available within 2 seasons of expiry, not already pending */}
        {onEarlyRenew && !hero.negotiationPending && (hero.contractWeeksLeft||0) > 0 && (hero.contractWeeksLeft||0) <= WEEKS_PER_CONTRACT_YEAR*2 && (
          <button onClick={()=>onEarlyRenew(hero)} style={{flex:1,padding:"7px 0",borderRadius:6,border:"1px solid rgba(120,200,255,0.3)",background:"rgba(120,200,255,0.07)",color:"#78c8ff",cursor:"pointer",fontWeight:700,fontSize:11,fontFamily:"'Cinzel',serif"}}>
            📋 Renew Early
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
        }} style={{flex:1,padding:"7px 0",borderRadius:6,border:"1px solid rgba(255,100,100,0.25)",background:"rgba(255,100,100,0.08)",color:"#ff7878",cursor:"pointer",fontWeight:700,fontSize:11,fontFamily:"'Cinzel',serif"}}>🚪 Release</button>
      </div>
      </div>{/* end scroll wrapper */}
    </div>
  );
}

// ─── NEGOTIATION MODAL ───────────────────────────────────────────────────────

function NegotiationModal({pending, gold, onAccept, onCounter, onReject}){
  if(!pending||pending.length===0)return null;
  const hero=pending[0]; // handle one at a time
  const demand=calcDemand(hero);
  const canAffordWeekly=gold>demand.salary*4; // rough check
  const {color:hColor}=moraleLabel(hero.morale);
  const counterSalary=Math.floor(demand.salary*0.85);
  const counterYears=Math.max(1,demand.years-1);

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)"}}>
      <div className="rm-neg-modal" style={{background:"linear-gradient(160deg,#0e0e22,#15102a)",border:"1px solid rgba(255,159,67,0.35)",borderRadius:14,padding:28,maxWidth:500,width:"92%",boxShadow:"0 0 60px rgba(255,159,67,0.12)"}}>
        <div style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:18,color:"#ffd966",marginBottom:4}}>📜 Contract Negotiation</div>
        <div style={{fontSize:11,color:"#888",marginBottom:18}}>{hero.name} is seeking a new contract.</div>

        <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:18,padding:"12px 14px",background:"rgba(255,255,255,0.03)",borderRadius:10,border:"1px solid rgba(255,255,255,0.07)"}}>
          <span style={{fontSize:28}}>{RACE_ICONS[hero.race]}</span>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:14,color:"#f0e6d3"}}>{hero.name}</div>
            <div style={{fontSize:11,color:"#999"}}>{hero.race} {ROLE_ICONS[hero.role]} {hero.role} · Level {hero.level} · {agePhaseLabel(agePhase(hero))}</div>
            <div style={{fontSize:10,color:hColor,marginTop:2}}>{moraleLabel(hero.morale).label}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:3,marginTop:4}}>
              {hero.traits.map(t=><span key={t} style={{fontSize:9,background:"rgba(167,139,250,0.1)",color:"#a78bfa",padding:"1px 6px",borderRadius:8}}>{t}</span>)}
            </div>
          </div>
        </div>

        <div style={{marginBottom:18}}>
          <div style={{fontSize:12,color:"#888",marginBottom:10}}>Their demand:</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[["Current salary",`${hero.salary}g/wk`],["Demanded salary",`${demand.salary}g/wk`,demand.salary>hero.salary?"#ff9f43":"#a8ff78"],
              ["Contract length",`${demand.years} year${demand.years>1?"s":""}`],["Season cost",`${demand.salary*WEEKS_PER_CONTRACT_YEAR*demand.years}g`]
            ].map(([k,v,c="#f0e6d3"])=>(
              <div key={k} style={{background:"rgba(255,255,255,0.03)",borderRadius:7,padding:"8px 10px",border:"1px solid rgba(255,255,255,0.07)"}}>
                <div style={{fontSize:9,color:"#999",marginBottom:2}}>{k}</div>
                <div style={{fontSize:14,fontWeight:700,color:c}}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {hero.traits?.includes("Greedy")&&<div style={{fontSize:10,color:"#ff7878",background:"rgba(255,100,100,0.07)",padding:"6px 10px",borderRadius:6,marginBottom:10}}>⚠️ Greedy: demands are inflated. They won't accept anything far below this.</div>}
        {hero.traits?.includes("Loyal")&&<div style={{fontSize:10,color:"#a8ff78",background:"rgba(168,255,120,0.07)",padding:"6px 10px",borderRadius:6,marginBottom:10}}>✓ Loyal: will accept a reasonable counter-offer without walking out.</div>}
        {hero.traits?.includes("Hot-headed")&&<div style={{fontSize:10,color:"#ff9f43",background:"rgba(255,159,67,0.07)",padding:"6px 10px",borderRadius:6,marginBottom:10}}>⚠️ Hot-headed: reject this and they leave immediately — no second chance.</div>}
        {}

        <div className="rm-neg-buttons" style={{display:"flex",gap:8}}>
          <button onClick={()=>onAccept(hero,demand)} style={{flex:1,padding:"10px 0",borderRadius:8,border:"none",cursor:"pointer",background:"linear-gradient(135deg,#a8ff78,#48c774)",color:"#0d0d1a",fontWeight:700,fontSize:12,fontFamily:"'Cinzel',serif"}}>
            ✓ Accept<br/><span style={{fontSize:9,fontWeight:400}}>{demand.salary}g/wk · {demand.years}s</span>
          </button>
          {!hero.traits?.includes("Stubborn")&&(
            <button onClick={()=>onCounter(hero,{salary:counterSalary,years:counterYears})} style={{flex:1,padding:"10px 0",borderRadius:8,border:"1px solid rgba(255,159,67,0.4)",cursor:"pointer",background:"rgba(255,159,67,0.1)",color:"#ff9f43",fontWeight:700,fontSize:12,fontFamily:"'Cinzel',serif"}}>
              ↔ Counter<br/><span style={{fontSize:9,fontWeight:400}}>{counterSalary}g/wk · {counterYears}yr</span>
            </button>
          )}
          <button onClick={()=>onReject(hero)} style={{flex:1,padding:"10px 0",borderRadius:8,border:"1px solid rgba(255,100,100,0.3)",cursor:"pointer",background:"rgba(255,100,100,0.08)",color:"#ff7878",fontWeight:700,fontSize:12,fontFamily:"'Cinzel',serif"}}>
            ✗ Reject<br/><span style={{fontSize:9,fontWeight:400}}>–10 morale</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── RETIREMENT MODAL ────────────────────────────────────────────────────────

function RetirementModal({retirees, heroes, formation, onDismiss}){
  const [step, setStep]       = useState(0);      // index into retirees array
  const [mentees, setMentees] = useState({});      // retiredId → menteeId

  if(!retirees||retirees.length===0)return null;

  const retiree = retirees[step];
  const isLast  = step >= retirees.length - 1;

  // Find which position the retiree held
  const retiredPos = POS_KEYS.find(p=>(formation[p]||[]).some(h=>h&&h.id===retiree.id));
  // Eligible mentees: active heroes, sorted by same position first, then lowest level
  const eligible = heroes
    .filter(h=>!h.retired && h.id!==retiree.id)
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
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:210,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)"}}>
      <div style={{background:"linear-gradient(160deg,#0e0e22,#1a1030)",border:"1px solid rgba(255,159,67,0.35)",borderRadius:14,padding:0,maxWidth:520,width:"92%",maxHeight:"88vh",overflow:"hidden",display:"flex",flexDirection:"column"}}>

        {/* Header */}
        <div style={{padding:"20px 24px 14px",textAlign:"center",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
          <div style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:18,color:"#ffd966",marginBottom:3}}>🎖️ Retirement Ceremony</div>
          {retirees.length>1&&<div style={{fontSize:10,color:"#999"}}>{step+1} of {retirees.length}</div>}
        </div>

        {/* Retiree card */}
        <div style={{padding:"14px 20px 10px"}}>
          <div style={{background:"rgba(255,159,67,0.06)",borderRadius:10,padding:"12px 14px",border:"1px solid rgba(255,159,67,0.2)",marginBottom:14}}>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <span style={{fontSize:28}}>{RACE_ICONS[retiree.race]}</span>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:15,color:"#f0e6d3"}}>{retiree.name}</div>
                <div style={{fontSize:11,color:"#999"}}>{retiree.race} {ROLE_ICONS[retiree.role]} {retiree.role} · {agePhaseLabel(agePhase(retiree))} · Level {retiree.level}</div>
                <div style={{fontSize:10,color:"#a78bfa",marginTop:2}}>{retiree.traits.join(", ")}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:16,fontWeight:900,color:"#a8ff78"}}>{pwr} PWR</div>
                <div style={{fontSize:10,color:"#999"}}>{retiree.xp.toLocaleString()} XP</div>
              </div>
            </div>
          </div>

          {/* Mentee selection */}
          <div style={{fontSize:11,color:"#888",marginBottom:8}}>
            <span style={{fontFamily:"'Cinzel',serif",fontWeight:700,color:"#ffd966"}}>Choose a Mentee</span>
            <span style={{marginLeft:6}}>— {retiree.name} will pass on their wisdom, granting +10 XP/week for a full season.</span>
          </div>
          {retiredPos&&<div style={{fontSize:9,color:"#999",marginBottom:8}}>Heroes from {retiredPos} are shown first — same position means more relevant experience.</div>}
        </div>

        {/* Mentee list */}
        <div style={{flex:1,overflowY:"auto",padding:"0 20px 12px"}}>
          {/* Skip option */}
          <div onClick={()=>setMentees(m=>({...m,[retiree.id]:null}))}
            style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,marginBottom:6,cursor:"pointer",
              background:chosenMenteeId===null?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.02)",
              border:`1px solid ${chosenMenteeId===null?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.06)"}`}}>
            <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${chosenMenteeId===null?"#fff":"#333"}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              {chosenMenteeId===null&&<div style={{width:8,height:8,borderRadius:"50%",background:"#fff"}}/>}
            </div>
            <div style={{fontSize:10,color:"#999",fontStyle:"italic"}}>No mentee — let their legacy rest</div>
          </div>

          {eligible.map(h=>{
            const isSelected = chosenMenteeId===h.id;
            const pos = POS_KEYS.find(p=>(formation[p]||[]).some(x=>x&&x.id===h.id));
            const isSamePos = pos===retiredPos;
            const pwr = Math.round(calcHeroCombatScore(h, pos||"Vanguard"));
            return(
              <div key={h.id} onClick={()=>setMentees(m=>({...m,[retiree.id]:h.id}))}
                style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:9,marginBottom:5,cursor:"pointer",
                  background:isSelected?"rgba(255,215,0,0.08)":"rgba(255,255,255,0.025)",
                  border:`1px solid ${isSelected?"rgba(255,215,0,0.4)":isSamePos?"rgba(255,255,255,0.1)":"rgba(255,255,255,0.05)"}`,
                  transition:"all 0.15s"}}>
                <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${isSelected?"#ffd966":"#333"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {isSelected&&<div style={{width:8,height:8,borderRadius:"50%",background:"#ffd966"}}/>}
                </div>
                <span style={{fontSize:18}}>{RACE_ICONS[h.race]}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:12,color:"#f0e6d3"}}>{h.name}</div>
                  <div style={{fontSize:9,color:"#999"}}>{h.role} · Lv {h.level} · {pos?pos:"bench"}{isSamePos&&<span style={{color:"#a8ff78",marginLeft:4}}>★ Same position</span>}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#78c8ff"}}>{pwr} PWR</div>
                  <div style={{fontSize:9,color:"#999"}}>+10 XP/wk</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div style={{padding:"12px 20px",borderTop:"1px solid rgba(255,255,255,0.06)",background:"rgba(0,0,0,0.2)"}}>
          <button onClick={handleNext}
            disabled={!(retiree.id in mentees)}
            style={{width:"100%",padding:"12px 0",borderRadius:8,border:"none",
              cursor:(retiree.id in mentees)?"pointer":"not-allowed",
              background:(retiree.id in mentees)?"linear-gradient(135deg,#ff9f43,#ffd966)":"#1a1a2a",
              color:(retiree.id in mentees)?"#0d0d1a":"#444",
              fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:13}}>
            {isLast
              ? (chosenMenteeId ? `✦ Farewell — ${heroes.find(h=>h.id===chosenMenteeId)?.name} will carry the torch` : "✦ Farewell, Hero")
              : "Next Retiree →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TACTICS TAB ─────────────────────────────────────────────────────────────

function TacticsTab({heroes,formation,setFormation}){
  // pickerOpen = { pos, slotIdx } | null
  const [pickerOpen,setPickerOpen]=useState(null);
  const [pickerSort,setPickerSort]=useState("fit"); // fit | name | combat | level

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
  const placed=POS_KEYS.reduce((a,p)=>(formation[p]||[]).filter(Boolean).length+a,0);

  // Build picker hero list for the open slot
  const pickerHeroes=useMemo(()=>{
    if(!pickerOpen) return [];
    const pd=POSITIONS[pickerOpen.pos];
    // Include all non-retired, non-injured heroes (injured shown but disabled)
    const list=heroes.filter(h=>!h.retired).map(h=>{
      const isIdeal  =pd.ideal.includes(h.role)||pd.ideal.includes(h.race);
      const isPenalty=pd.penalty.includes(h.role);
      const fit      =isIdeal?"ideal":isPenalty?"penalty":"neutral";
      const fitScore =isIdeal?0:isPenalty?2:1;
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

  const fitColor=f=>f==="ideal"?"#a8ff78":f==="penalty"?"#ff7878":"#888";
  const fitLabel=f=>f==="ideal"?"✓ Perfect fit":f==="penalty"?"✗ Wrong position":"– Neutral";

  return(
    <div className="rm-tactics-grid" style={{display:"grid",gridTemplateColumns:"1fr 330px",gap:18}}>
      <div>
        {/* Header row */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:14}}>⚔️ Formation Board</div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontSize:11,color:"#888"}}>{placed}/6 assigned</span>
            <button onClick={clearAll} style={{fontSize:10,padding:"4px 10px",borderRadius:5,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:"#999",cursor:"pointer"}}>Clear all</button>
          </div>
        </div>

        {/* Rating summary */}
        <div style={{marginBottom:12,padding:"9px 13px",background:"rgba(255,255,255,0.02)",borderRadius:8,border:"1px solid rgba(255,255,255,0.06)",display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
          {[["BASE",raw,"#78c8ff"],["→",null,"#333"],["EFFECTIVE",effective,effective>raw?"#a8ff78":effective<raw?"#ff7878":"#78c8ff"]].map(([l,v,c],i)=>(
            v===null?<div key={i} style={{color:c,fontSize:18}}>→</div>:
            <div key={l} style={{textAlign:"center"}}><div style={{fontSize:8,color:"#888"}}>{l}</div><div style={{fontSize:20,fontWeight:700,color:c}}>{v}</div></div>
          ))}
          <div style={{flex:1}}/>
          {analysis.raceSynergy&&<div style={{fontSize:10,color:analysis.raceSynergy.color,background:`${analysis.raceSynergy.color}14`,padding:"3px 8px",borderRadius:6,border:`1px solid ${analysis.raceSynergy.color}33`}}>{analysis.raceSynergy.icon} {analysis.raceSynergy.name}</div>}
        </div>

        {/* Active race synergy inline */}
        {analysis.raceSynergy&&(
          <div className="rm-tactics-active-summary" style={{marginBottom:10}}>
            <div style={{padding:"7px 10px",borderRadius:7,background:`${analysis.raceSynergy.color}10`,border:`1px solid ${analysis.raceSynergy.color}33`}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:11}}>{analysis.raceSynergy.icon}</span>
                <span style={{fontSize:11,fontWeight:700,color:analysis.raceSynergy.color,fontFamily:"'Cinzel',serif",flex:1}}>{analysis.raceSynergy.name}</span>
                <span style={{fontSize:9,fontWeight:700,color:analysis.raceSynergy.color}}>×{analysis.raceSynergy.ratingMult}</span>
              </div>
              <div style={{fontSize:9,color:"#888",marginTop:2,lineHeight:1.4}}>{analysis.raceSynergy.desc}</div>
            </div>
          </div>
        )}

        {/* Position lanes */}
        {POS_KEYS.map(pos=>{
          const pd=POSITIONS[pos];
          const slots=formation[pos]||[null,null];
          return(
            <div key={pos} style={{marginBottom:9,padding:"10px 12px",background:"rgba(255,255,255,0.02)",borderRadius:9,border:"1px solid rgba(255,255,255,0.06)"}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8}}>
                <span style={{fontSize:18}}>{pd.icon}</span>
                <div>
                  <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:12,color:pd.color}}>{pd.label}</div>
                  <div style={{fontSize:9,color:"#888"}}>{pd.subtitle}</div>
                </div>
                <div className="rm-pos-desc" style={{marginLeft:"auto",fontSize:9,color:"#888",maxWidth:190,textAlign:"right"}}>{pd.desc}</div>
              </div>
              <div className="rm-formation-slots" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                {[0,1].map(slotIdx=>{
                  const h=slots[slotIdx];
                  const fit=h?analysis.heroMods[h.id]:null;
                  const fc=fit?.fit==="ideal"?"#a8ff78":fit?.fit==="penalty"?"#ff7878":"rgba(255,255,255,0.12)";
                  const isPickerTarget=pickerOpen?.pos===pos&&pickerOpen?.slotIdx===slotIdx;
                  return(
                    <div key={slotIdx}>
                      {h?(
                        <div onClick={()=>setPickerOpen({pos,slotIdx})}
                          style={{display:"flex",alignItems:"center",gap:6,background:isPickerTarget?"rgba(120,200,255,0.12)":"rgba(255,255,255,0.04)",borderRadius:7,padding:"8px 10px",border:`1px solid ${isPickerTarget?"#78c8ff":fc}`,cursor:"pointer",position:"relative",transition:"border 0.15s"}}>
                          <span style={{fontSize:16}}>{RACE_ICONS[h.race]}</span>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:11,fontWeight:700,fontFamily:"'Cinzel',serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.name}</div>
                            <div style={{fontSize:9,color:"#999"}}>{ROLE_ICONS[h.role]} {h.role} · Lv {h.level}</div>
                          </div>
                          <div style={{fontSize:9,color:fc,fontWeight:700,flexShrink:0}}>{fit?.fit==="ideal"?"✓":fit?.fit==="penalty"?"✗":"–"}</div>
                        </div>
                      ):(
                        <button onClick={()=>setPickerOpen({pos,slotIdx})}
                          style={{width:"100%",height:52,borderRadius:7,border:`2px dashed ${isPickerTarget?pd.color:pd.color+"44"}`,display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontSize:11,color:isPickerTarget?pd.color:"#888",background:isPickerTarget?`${pd.color}0a`:"transparent",cursor:"pointer",transition:"all 0.15s",fontFamily:"'Lato',sans-serif"}}>
                          <span style={{fontSize:16}}>+</span> Assign hero
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{marginTop:6,fontSize:9,color:"#888"}}>
                <span style={{color:"#a8ff7866"}}>✓ {pd.ideal.join(", ")}</span>
                <span style={{marginLeft:8,color:"#ff787866"}}>✗ {pd.penalty.join(", ")}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right: race composition panel */}
      <div className="rm-tactics-synergy-panel">
        <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:13,color:"#f0e6d3",marginBottom:10}}>🧬 Race Composition</div>
        <div style={{fontSize:10,color:"#888",marginBottom:10,lineHeight:1.5}}>Field 6 of the same race for a mono bonus, all different for rainbow, or 3+3 of two races for a duo pact. Only the strongest active bonus applies.</div>

        {/* Active race synergy */}
        {analysis.raceSynergy?(
          <div style={{padding:"10px 12px",borderRadius:9,marginBottom:10,background:`${analysis.raceSynergy.color}15`,border:`1px solid ${analysis.raceSynergy.color}44`}}>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
              <span style={{fontSize:16}}>{analysis.raceSynergy.icon}</span>
              <span style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:12,color:analysis.raceSynergy.color}}>{analysis.raceSynergy.name}</span>
              <span style={{fontSize:9,padding:"1px 6px",borderRadius:8,background:`${analysis.raceSynergy.color}22`,color:analysis.raceSynergy.color,marginLeft:"auto"}}>✓ ACTIVE</span>
            </div>
            <div style={{fontSize:10,color:"#aaa",lineHeight:1.4}}>{analysis.raceSynergy.desc}</div>
            <div style={{fontSize:10,fontWeight:700,marginTop:3,color:analysis.raceSynergy.color}}>×{analysis.raceSynergy.ratingMult} to all phase win chances</div>
          </div>
        ):(
          <div style={{marginBottom:10,padding:"8px 10px",borderRadius:8,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",fontSize:10,color:"#888",textAlign:"center"}}>
            No race composition bonus active
          </div>
        )}

        <div style={{fontSize:9,color:"#999",fontWeight:700,letterSpacing:1,marginBottom:4}}>MONO-RACE (6 same)</div>
        {RACE_SYNERGIES.filter(s=>s.type==="mono").map(s=>(
          <div key={s.id} style={{padding:"5px 9px",borderRadius:7,marginBottom:3,background:"rgba(255,255,255,0.02)",border:`1px solid ${analysis.raceSynergy?.id===s.id?s.color+"66":"rgba(255,255,255,0.05)"}`,opacity:analysis.raceSynergy?.id===s.id?1:0.45,transition:"all 0.3s"}}>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <span>{s.icon}</span>
              <span style={{fontSize:10,fontWeight:700,color:analysis.raceSynergy?.id===s.id?s.color:"#888"}}>{s.name}</span>
              <span style={{fontSize:9,color:"#999",marginLeft:"auto"}}>×{s.ratingMult}</span>
            </div>
          </div>
        ))}

        <div style={{fontSize:9,color:"#999",fontWeight:700,letterSpacing:1,marginBottom:4,marginTop:8}}>RAINBOW (all 6 different)</div>
        {RACE_SYNERGIES.filter(s=>s.type==="rainbow").map(s=>(
          <div key={s.id} style={{padding:"5px 9px",borderRadius:7,marginBottom:3,background:"rgba(255,255,255,0.02)",border:`1px solid ${analysis.raceSynergy?.id===s.id?s.color+"66":"rgba(255,255,255,0.05)"}`,opacity:analysis.raceSynergy?.id===s.id?1:0.45,transition:"all 0.3s"}}>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <span>{s.icon}</span>
              <span style={{fontSize:10,fontWeight:700,color:analysis.raceSynergy?.id===s.id?s.color:"#888"}}>{s.name}</span>
              <span style={{fontSize:9,color:"#999",marginLeft:"auto"}}>×{s.ratingMult}</span>
            </div>
          </div>
        ))}

        <div style={{fontSize:9,color:"#999",fontWeight:700,letterSpacing:1,marginBottom:4,marginTop:8}}>DUO PACTS (3+ each)</div>
        {RACE_SYNERGIES.filter(s=>s.type==="duo").map(s=>(
          <div key={s.id} style={{padding:"5px 9px",borderRadius:7,marginBottom:3,background:"rgba(255,255,255,0.02)",border:`1px solid ${analysis.raceSynergy?.id===s.id?s.color+"66":"rgba(255,255,255,0.05)"}`,opacity:analysis.raceSynergy?.id===s.id?1:0.45,transition:"all 0.3s"}}>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <span>{s.icon}</span>
              <span style={{fontSize:10,fontWeight:700,color:analysis.raceSynergy?.id===s.id?s.color:"#888"}}>{s.name}</span>
              <span style={{fontSize:9,color:"#999",marginLeft:"auto"}}>×{s.ratingMult}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── SLOT PICKER MODAL ── */}
      {pickerOpen&&(()=>{
        const pd=POSITIONS[pickerOpen.pos];
        const currentHero=(formation[pickerOpen.pos]||[])[pickerOpen.slotIdx];
        return(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:150,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)"}}
            onClick={()=>setPickerOpen(null)}>
            <div onClick={e=>e.stopPropagation()}
              style={{background:"linear-gradient(160deg,#0c0c1e,#12102a)",border:`1px solid ${pd.color}44`,borderRadius:14,width:"min(540px,96vw)",maxHeight:"80vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:`0 0 40px ${pd.color}18`}}>

              {/* Picker header */}
              <div style={{padding:"14px 18px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                <span style={{fontSize:20}}>{pd.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:14,color:pd.color}}>{pd.label} — Slot {pickerOpen.slotIdx+1}</div>
                  <div style={{fontSize:10,color:"#999"}}>{pd.subtitle} · Ideal: {pd.ideal.filter(x=>ROLES.includes(x)).join(", ")}</div>
                </div>
                <button onClick={()=>setPickerOpen(null)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#aaa",fontSize:12,cursor:"pointer",borderRadius:6,padding:"5px 12px"}}>✕ Close</button>
              </div>

              {/* Sort controls + clear option */}
              <div style={{padding:"8px 18px",borderBottom:"1px solid rgba(255,255,255,0.04)",display:"flex",gap:6,alignItems:"center",flexShrink:0,flexWrap:"wrap"}}>
                <span style={{fontSize:10,color:"#999",marginRight:2}}>Sort:</span>
                {[["fit","Best fit"],["combat","Combat"],["level","Level"],["name","Name"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setPickerSort(v)} style={{fontSize:10,padding:"3px 9px",borderRadius:5,border:"none",cursor:"pointer",background:pickerSort===v?"rgba(120,200,255,0.18)":"rgba(255,255,255,0.05)",color:pickerSort===v?"#78c8ff":"#666",fontWeight:pickerSort===v?700:400}}>
                    {l}
                  </button>
                ))}
                {currentHero&&(
                  <button onClick={()=>remove(pickerOpen.pos,pickerOpen.slotIdx)}
                    style={{marginLeft:"auto",fontSize:10,padding:"3px 10px",borderRadius:5,border:"1px solid rgba(255,100,100,0.3)",cursor:"pointer",background:"rgba(255,100,100,0.08)",color:"#ff7878"}}>
                    ✕ Remove {currentHero.name}
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
                        display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:9,marginBottom:5,
                        background:isCurrentlyHere?"rgba(120,200,255,0.1)":h.injured?"rgba(255,255,255,0.01)":"rgba(255,255,255,0.03)",
                        border:`1px solid ${isCurrentlyHere?"#78c8ff":(h.awayWeeks||0)>0?"rgba(120,200,255,0.3)":fc+"33"}`,
                        cursor:h.injured||(h.awayWeeks||0)>0?"not-allowed":"pointer",
                        opacity:h.injured||(h.awayWeeks||0)>0?0.45:1,
                        transition:"background 0.15s,border 0.15s",
                      }}>
                      <span style={{fontSize:20,flexShrink:0}}>{RACE_ICONS[h.race]}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                          <span style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:13,color:"#f0e6d3"}}>{h.name}</span>
                          {h.injured&&<span style={{fontSize:9,color:"#ff7878",background:"rgba(255,100,100,0.12)",padding:"1px 5px",borderRadius:6}}>🩸 Injured {h.injuryWeeks}wk</span>}
                          {isCurrentlyHere&&<span style={{fontSize:9,color:"#78c8ff",background:"rgba(120,200,255,0.12)",padding:"1px 5px",borderRadius:6}}>Current</span>}
                          {movedFrom&&<span style={{fontSize:9,color:"#ffd966",background:"rgba(255,215,0,0.08)",padding:"1px 5px",borderRadius:6}}>Moves from {movedFrom}</span>}
                          {(h.awayWeeks||0)>0&&<span style={{fontSize:9,color:"#78c8ff",background:"rgba(120,200,255,0.12)",padding:"1px 5px",borderRadius:6}}>✈️ Away {h.awayWeeks}w</span>}
                          {(h.fatigue||0)>=FATIGUE_WARN&&<span style={{fontSize:9,color:fatigueLabel(h.fatigue).color,background:"rgba(255,100,100,0.08)",padding:"1px 5px",borderRadius:6}}>⚡ {fatigueLabel(h.fatigue).label}</span>}
                        </div>
                        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                          <span style={{fontSize:10,color:"#888"}}>{ROLE_ICONS[h.role]} {h.role}</span>
                          <span style={{fontSize:10,color:"#999"}}>{h.race}</span>
                          <span style={{fontSize:10,color:agePhaseColor(phase)}}>{agePhaseLabel(phase)}</span>
                          <span style={{fontSize:10,color:hColor}}>{hLabel}</span>
                          <span style={{fontSize:10,color:"#999"}}>Lv {h.level}</span>
                        </div>
                        <div style={{display:"flex",gap:8,marginTop:3,flexWrap:"wrap"}}>
                          {pd.primaryStats.slice(0,3).map(s=>(
                            <span key={s} style={{fontSize:9,color:h.stats[s]>=70?"#a8ff78":h.stats[s]>=50?"#78c8ff":"#888"}}>
                              {s.replace(" ","·")} {h.stats[s]}
                            </span>
                          ))}
                          <span style={{fontSize:9,color:"#999"}}>Morale {h.morale}%</span>
                        </div>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div style={{fontSize:11,fontWeight:700,color:fc}}>{fitLabel(fit)}</div>
                        <div style={{fontSize:10,color:"#999",marginTop:2}}>~{Math.round(primaryAvg)} primary avg</div>
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

function DominionTab({season,seasonWeek,trophies,weeklyIncome,playerTier,tierPosition,tierEnemyTowns,townName,townColor,formRating,leagueTable,playerRecord,matchLog,hallOfFame}){

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
  const seasonPct = Math.round((seasonWeek/SEASON_LENGTH())*100);
  const isPlatinum = playerTier==="platinum";
  const isIron = playerTier==="iron";
  const nextTierId = TIER_ORDER[Math.min(TIER_ORDER.length-1, TIER_ORDER.indexOf(playerTier)+1)];
  const nextTier = TIERS[nextTierId];

  return(
    <div className="rm-dominion-grid" style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:20}}>

      {/* LEFT: Standings */}
      <div>
        {/* Season progress */}
        <div style={{marginBottom:16,padding:"12px 16px",background:"rgba(255,255,255,0.02)",borderRadius:10,border:`1px solid ${currentTier.color}30`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div>
              <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:14,color:currentTier.color}}>
                {currentTier.icon} {currentTier.name} League · Season {season}
              </div>
              <div style={{fontSize:10,color:"#999"}}>Week {seasonWeek} of {SEASON_LENGTH()} · {SEASON_LENGTH()-seasonWeek} remaining · {isPlatinum?"Finish 1st to win the campaign":"Top 2 promote · Bottom 2 relegate"}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:10,color:"#999"}}>Position</div>
              <div style={{fontSize:26,fontWeight:900,fontFamily:"'Cinzel',serif",color:playerPos<=2?"#a8ff78":playerPos>=7?"#ff7878":"#f0e6d3"}}>
                {playerPos}{['st','nd','rd'][playerPos-1]||'th'}
              </div>
            </div>
          </div>
          <div style={{height:6,background:"#12122a",borderRadius:3,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${seasonPct}%`,background:`linear-gradient(90deg,${currentTier.color}99,${currentTier.color})`,borderRadius:3,transition:"width 0.5s"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#888",marginTop:3}}>
            <span>Season start</span><span>Season end — promotion/relegation decided</span>
          </div>
        </div>

        {/* Zone key */}
        <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
          {[["#a8ff78", isPlatinum?"🏆 1st — Win condition":"🔼 Top 2 — Promote"],
            ["#888","3rd–6th — Safe"],
            ["#ff7878","🔽 7th–8th — Relegate"+(isIron?" (floor)":"")]
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
            <div key={h} style={{fontSize:9,color:"#888",fontWeight:700,letterSpacing:0.5,textAlign:h==="Town"?"left":"center"}}>{h}</div>
          ))}
        </div>

        {allTowns.map((t,i)=>{
          const pos=i+1;
          const isPromo=pos<=2;
          const isRele=pos>=7;
          const zoneBg=isPromo?"rgba(168,255,120,0.04)":isRele?"rgba(255,120,120,0.04)":"rgba(255,255,255,0.02)";
          const zoneBorder=isPromo?"rgba(168,255,120,0.15)":isRele?"rgba(255,120,120,0.15)":"rgba(255,255,255,0.06)";
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
              borderRadius:9,
            }}>
              <div style={{textAlign:"center"}}>
                <span style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:12,
                  color:isPromo?"#a8ff78":isRele?"#ff7878":"#888"}}>
                  {pos}
                </span>
              </div>
              <div style={{minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <span style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:11,
                    color:isYou?townColor:"#f0e6d3",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {t.name}
                  </span>
                  {isYou&&<span style={{fontSize:8,color:townColor,background:`${townColor}18`,padding:"1px 5px",borderRadius:6,flexShrink:0}}>YOU</span>}
                </div>
                {!isYou&&<div style={{fontSize:9,color:"#888"}}>Power ~{Math.round(leagueTable?.[t.name]?.power||t.power||0)}</div>}
              </div>
              <div style={{textAlign:"center",fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:13,color:"#a8ff78"}}>{t.wins}</div>
              <div style={{textAlign:"center",fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:13,color:"#ff7878"}}>{t.losses}</div>
              <div style={{textAlign:"center",fontSize:11,fontWeight:700,color:t.winPct>=0.6?"#a8ff78":t.winPct>=0.4?"#ffd966":"#ff9f43"}}>{winPctStr}</div>
              <div style={{textAlign:"center",fontSize:10,fontWeight:700,color:"#a8ff78"}}>{tribute}g</div>
            </div>
          );
        })}
      </div>

      {/* RIGHT: Income + win chance + match feed + trophies */}
      <div className="rm-dominion-right">
        {/* Tribute */}
        <div style={{marginBottom:14,padding:"14px 16px",background:"rgba(255,255,255,0.03)",borderRadius:10,border:`1px solid ${currentTier.color}33`}}>
          <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:13,color:currentTier.color,marginBottom:10}}>
            {currentTier.icon} Tribute Income
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:8}}>
            <div>
              <div style={{fontSize:10,color:"#999",marginBottom:2}}>{currentTier.name} · Position {playerPos} of 8</div>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:28,fontWeight:900,color:"#a8ff78",lineHeight:1}}>{weeklyIncome.toLocaleString()}g</div>
              <div style={{fontSize:10,color:"#999",marginTop:2}}>per week</div>
            </div>
            {!isPlatinum&&(
              <div style={{textAlign:"right",padding:"6px 10px",background:"rgba(168,255,120,0.06)",borderRadius:7,border:"1px solid rgba(168,255,120,0.15)"}}>
                <div style={{fontSize:9,color:"#a8ff78",marginBottom:1}}>Promote to {nextTier?.name}</div>
                <div style={{fontSize:12,fontWeight:700,color:"#a8ff78"}}>+{Math.max(0,(nextTier?.tributeBase||0)-currentTier.tributeBase)}g/wk base</div>
              </div>
            )}
          </div>
        </div>

        {/* Win chance */}
        <div style={{marginBottom:14}}>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:10,color:"#999",marginBottom:8,fontWeight:700,letterSpacing:1}}>WIN CHANCE vs DIFFICULTY</div>
          {[1,2,3,4,5].map(diff=>{
            const wc=calcWinChance(formRating||30,diff);
            const wcBoosted=calcWinChance((formRating||30)*1.4,diff);
            const col=wc>=0.6?"#a8ff78":wc>=0.40?"#ffd966":wc>=0.25?"#ff9f43":"#ff7878";
            const label=["Easy","Moderate","Hard","Very Hard","Elite"][diff-1];
            const isTierDiff=diff===currentTier.difficulty;
            return(
              <div key={diff} style={{padding:"6px 10px",borderRadius:7,marginBottom:3,
                background:isTierDiff?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.02)",
                border:isTierDiff?`1px solid ${currentTier.color}33`:"1px solid rgba(255,255,255,0.05)"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:10,color:isTierDiff?currentTier.color:"#888",flex:1,fontWeight:isTierDiff?700:400}}>{label} {"★".repeat(diff)}{isTierDiff?" ← current":""}</span>
                  <span style={{fontSize:12,fontWeight:700,color:col}}>{Math.round(wc*100)}%</span>
                  <span style={{fontSize:9,color:"#999"}}>+syn: {Math.round(wcBoosted*100)}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent match results */}
        {matchLog&&matchLog.length>0&&(
          <div style={{marginBottom:14}}>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:10,color:"#999",marginBottom:8,fontWeight:700,letterSpacing:1}}>RECENT RESULTS</div>
            {matchLog.slice(0,8).map((r,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",borderRadius:6,marginBottom:3,background:"rgba(255,255,255,0.02)"}}>
                <span style={{fontSize:9,color:"#888",minWidth:28}}>Wk{r.week}</span>
                <span style={{fontSize:10,color:r.homeWon?"#a8ff78":"#555",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.home}</span>
                <span style={{fontSize:9,color:"#999"}}>vs</span>
                <span style={{fontSize:10,color:r.homeWon?"#555":"#a8ff78",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textAlign:"right"}}>{r.away}</span>
              </div>
            ))}
          </div>
        )}

        {/* Past season trophies */}
        {trophies.length>0&&(
          <div style={{marginTop:4}}>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:10,color:"#999",marginBottom:8,fontWeight:700,letterSpacing:1}}>SEASON TROPHIES</div>
            {trophies.map((t,i)=>(
              <div key={i} style={{padding:"8px 12px",borderRadius:8,marginBottom:5,background:"rgba(255,215,0,0.04)",border:"1px solid rgba(255,215,0,0.12)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:12,color:"#ffd966"}}>Season {t.season}</span>
                  <span style={{fontSize:12,fontWeight:700,color:t.rank===1?"#ffd966":t.rank<=3?"#78c8ff":"#888"}}>#{t.rank} of {t.totalTowns}</span>
                </div>
                {t.wins!=null&&<div style={{fontSize:10,color:"#999",marginTop:2}}>{t.wins}W / {t.losses}L · {t.tier}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Hall of Fame */}
        {hallOfFame&&Object.keys(hallOfFame).length>0&&(
          <div style={{marginTop:16}}>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:10,color:"#999",marginBottom:8,fontWeight:700,letterSpacing:1}}>🏛️ HALL OF FAME</div>

            {/* Star Player */}
            {hallOfFame.starPlayer&&(
              <div style={{padding:"10px 12px",borderRadius:9,background:"rgba(167,139,250,0.06)",border:"1px solid rgba(167,139,250,0.2)",marginBottom:6}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:18}}>{RACE_ICONS[hallOfFame.starPlayer.race]||"⚔️"}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#a78bfa",fontFamily:"'Cinzel',serif"}}>🌟 Star Player</div>
                    <div style={{fontSize:12,fontWeight:700,color:"#f0e6d3"}}>{hallOfFame.starPlayer.name}</div>
                    <div style={{fontSize:9,color:"#999"}}>{hallOfFame.starPlayer.race} {hallOfFame.starPlayer.role} · Lv {hallOfFame.starPlayer.level} · {hallOfFame.starPlayer.pos}</div>
                    {hallOfFame.starPlayer.traits?.length>0&&<div style={{fontSize:9,color:"#888",marginTop:1}}>{hallOfFame.starPlayer.traits.join(", ")}</div>}
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:20,fontWeight:900,color:"#a78bfa"}}>{hallOfFame.starPlayer.pwr}</div>
                    <div style={{fontSize:8,color:"#999"}}>PWR</div>
                  </div>
                </div>
              </div>
            )}

            {/* Records row */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}>
              {hallOfFame.bestSeason&&(
                <div style={{padding:"8px 10px",borderRadius:8,background:"rgba(168,255,120,0.05)",border:"1px solid rgba(168,255,120,0.15)"}}>
                  <div style={{fontSize:9,color:"#a8ff78",fontWeight:700,marginBottom:2}}>📈 Best Season</div>
                  <div style={{fontSize:14,fontWeight:900,color:"#f0e6d3"}}>{hallOfFame.bestSeason.wins}W</div>
                  <div style={{fontSize:9,color:"#999"}}>S{hallOfFame.bestSeason.season} · {hallOfFame.bestSeason.losses}L</div>
                </div>
              )}
              {hallOfFame.longestStreak&&(
                <div style={{padding:"8px 10px",borderRadius:8,background:"rgba(120,200,255,0.05)",border:"1px solid rgba(120,200,255,0.15)"}}>
                  <div style={{fontSize:9,color:"#78c8ff",fontWeight:700,marginBottom:2}}>🔥 Longest Streak</div>
                  <div style={{fontSize:14,fontWeight:900,color:"#f0e6d3"}}>{hallOfFame.longestStreak.count}</div>
                  <div style={{fontSize:9,color:"#999"}}>consecutive wins · S{hallOfFame.longestStreak.season}</div>
                </div>
              )}
              {hallOfFame.biggestUpset&&(
                <div style={{padding:"8px 10px",borderRadius:8,background:"rgba(255,159,67,0.05)",border:"1px solid rgba(255,159,67,0.15)"}}>
                  <div style={{fontSize:9,color:"#ff9f43",fontWeight:700,marginBottom:2}}>⚡ Biggest Upset</div>
                  <div style={{fontSize:14,fontWeight:900,color:"#f0e6d3"}}>{Math.round(hallOfFame.biggestUpset.winChance*100)}%</div>
                  <div style={{fontSize:9,color:"#999"}}>vs {hallOfFame.biggestUpset.enemy} · S{hallOfFame.biggestUpset.season}</div>
                </div>
              )}
              {hallOfFame.longestStreak&&(
                <div style={{padding:"8px 10px",borderRadius:8,background:"rgba(255,215,0,0.05)",border:"1px solid rgba(255,215,0,0.15)"}}>
                  <div style={{fontSize:9,color:"#ffd966",fontWeight:700,marginBottom:2}}>⚜️ Highest Tier</div>
                  <div style={{fontSize:11,fontWeight:700,color:"#ffd966",fontFamily:"'Cinzel',serif"}}>
                    {(()=>{const highestTier=trophies.reduce((best,t)=>{const ti=TIER_ORDER.indexOf(t.tier||"iron");return ti>TIER_ORDER.indexOf(best)? (t.tier||"iron"):best;},"iron");return `${TIERS[highestTier]?.icon} ${TIERS[highestTier]?.name}`;})()}
                  </div>
                  <div style={{fontSize:9,color:"#999"}}>best tier reached</div>
                </div>
              )}
              {(hallOfFame.buildingsBuilt||0)>0&&(
                <div style={{padding:"8px 10px",borderRadius:8,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)"}}>
                  <div style={{fontSize:9,color:"#888",fontWeight:700,marginBottom:2}}>🏰 Builder</div>
                  <div style={{fontSize:14,fontWeight:900,color:"#f0e6d3"}}>{hallOfFame.buildingsBuilt}</div>
                  <div style={{fontSize:9,color:"#999"}}>of {BUILDINGS.length} buildings constructed</div>
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

function deserializeFormation(saved, heroes) {
  const out = {};
  POS_KEYS.forEach(p => {
    out[p] = (saved[p] || [null, null]).map(id =>
      id === null ? null : heroes.find(h => h.id === id) || null
    );
  });
  return out;
}

function saveGame(state) {
  try {
    const blob = {
      v: 1,
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
      leagueTable: state.leagueTable,
      playerRecord: state.playerRecord,
      matchLog: state.matchLog,
      activeEvent: state.activeEvent,
      showHiddenStats: state.showHiddenStats,
      signDiscount: state.signDiscount,
      gameSpeed: state.gameSpeed,
      squadLeaderId: state.squadLeaderId,
      raceSynergyUsage: state.raceSynergyUsage,
      hallOfFame: state.hallOfFame,
      currentStreak: state.currentStreak,
      legendaryChallenger: state.legendaryChallenger,
      emissaryFiredThisSeason: state.emissaryFiredThisSeason,
      hintDismissed: state.hintDismissed,
      bankruptcyWeeks: state.bankruptcyWeeks,
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
    if (!blob || blob.v !== 1) return null;
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

// ─── SETUP SCREEN ────────────────────────────────────────────────────────────

function SetupScreen({ onComplete }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(TOWN_COLORS[0].value);
  const [speed, setSpeed] = useState("standard");
  const [nameError, setNameError] = useState(false);
  const [step, setStep] = useState("setup"); // "setup" | "boons"
  const [selectedBoons, setSelectedBoons] = useState(new Set());
  const ng = loadNGPlus();
  const availableBoons = ng?.earnedBoons ?? [];

  const handleStart = () => {
    const trimmed = name.trim();
    if (!trimmed) { setNameError(true); return; }
    if (availableBoons.length > 0) {
      setStep("boons");
    } else {
      onComplete(trimmed, color, speed, []);
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
      <div style={{position:"fixed",inset:0,background:"linear-gradient(145deg,#060610,#0a0a1c,#060d14)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,fontFamily:"'Lato',sans-serif",overflowY:"auto",padding:"16px 0"}}>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Lato:wght@300;400;700&display=swap" rel="stylesheet"/>
        <div style={{width:"min(520px,92vw)",padding:"32px 28px",background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,215,0,0.2)",borderRadius:16}}>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:28,marginBottom:6}}>🏅</div>
            <div style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:18,color:"#ffd966",marginBottom:4}}>Legacy Boons</div>
            <div style={{fontSize:11,color:"#999"}}>Choose which boons to activate this run. Each can be used once. You can choose none for a clean start.</div>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
            {uniqueBoonIds.map(id => {
              const a = ACHIEVEMENTS.find(x=>x.id===id);
              if(!a) return null;
              const isSelected = selectedBoons.has(id);
              const count = boonCounts[id];
              return(
                <div key={id} onClick={()=>toggleBoon(id)}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,cursor:"pointer",
                    background:isSelected?"rgba(255,215,0,0.07)":"rgba(255,255,255,0.03)",
                    border:`1px solid ${isSelected?"rgba(255,215,0,0.4)":"rgba(255,255,255,0.08)"}`,
                    transition:"all 0.15s"}}>
                  <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${isSelected?"#ffd966":"#444"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {isSelected&&<div style={{width:8,height:8,borderRadius:"50%",background:"#ffd966"}}/>}
                  </div>
                  <span style={{fontSize:22,flexShrink:0}}>{a.boon.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:700,color:isSelected?"#ffd966":"#f0e6d3",fontFamily:"'Cinzel',serif"}}>
                      {a.boon.name}
                      {count>1&&<span style={{fontSize:9,color:"#ff9f43",marginLeft:6}}>×{count}</span>}
                    </div>
                    <div style={{fontSize:10,color:"#999",marginTop:2}}>{a.boon.desc}</div>
                  </div>
                  <span style={{fontSize:9,color:"#888",flexShrink:0}}>{a.icon} {a.name}</span>
                </div>
              );
            })}
          </div>

          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>onComplete(name.trim(), color, speed, [])}
              style={{flex:1,padding:"11px 0",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.03)",color:"#888",cursor:"pointer",fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:11}}>
              No Boons
            </button>
            <button onClick={()=>onComplete(name.trim(), color, speed, [...selectedBoons])}
              style={{flex:2,padding:"11px 0",borderRadius:8,border:"none",cursor:"pointer",
                background:selectedBoons.size>0?"linear-gradient(135deg,#ff9f43,#ffd966)":"rgba(255,255,255,0.06)",
                color:selectedBoons.size>0?"#0d0d1a":"#555",
                fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:12}}>
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
      background:"linear-gradient(145deg,#060610 0%,#0a0a1c 60%,#060d14 100%)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:300, fontFamily:"'Lato',sans-serif", overflowY:"auto",
      padding:"16px 0",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Lato:wght@300;400;700&display=swap" rel="stylesheet"/>
      <div style={{
        width:"min(480px,92vw)", padding:"36px 32px",
        background:"rgba(255,255,255,0.025)",
        border:"1px solid rgba(255,255,255,0.08)",
        borderRadius:16,
      }}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:10}}>
          <div style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:26,background:"linear-gradient(135deg,#ffd966,#ff9f43)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4}}>
            ⚔️ REALM MANAGER
          </div>
          <div style={{fontSize:10,color:"#999",letterSpacing:2,marginBottom:12}}>FANTASY SQUAD SIMULATOR</div>
          <div style={{fontSize:12,color:"#888",lineHeight:1.6,maxWidth:340,margin:"0 auto 16px"}}>
            Build a dynasty of heroes. Send them on raids. Watch them rise, peak, and retire as legends. Climb from Iron to Platinum — or fall trying.
          </div>
          {/* Three pillars */}
          <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:4}}>
            {[
              {icon:"⚔️", label:"Battle", sub:"Win fights, earn gold"},
              {icon:"🧑", label:"Manage", sub:"Sign, rest, rotate"},
              {icon:"🏆", label:"Conquer", sub:"Reach Rank #1"},
            ].map(({icon,label,sub})=>(
              <div key={label} style={{flex:1,padding:"8px 6px",borderRadius:8,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",textAlign:"center"}}>
                <div style={{fontSize:16,marginBottom:3}}>{icon}</div>
                <div style={{fontSize:10,fontWeight:700,color:"#f0e6d3",fontFamily:"'Cinzel',serif"}}>{label}</div>
                <div style={{fontSize:8,color:"#888",marginTop:1}}>{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{height:1,background:"rgba(255,255,255,0.06)",marginBottom:20}}/>

        {/* NG+ returning champion notice */}
        {ng?.wins>0&&(
          <div style={{marginBottom:20,padding:"10px 14px",borderRadius:9,background:"rgba(255,159,67,0.08)",border:"1px solid rgba(255,159,67,0.3)"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#ff9f43",marginBottom:3}}>⚡ New Legacy — Run #{ng.wins+1}</div>
            <div style={{fontSize:10,color:"#888",lineHeight:1.5}}>
              You've conquered the realm {ng.wins} time{ng.wins>1?"s":""}. Your unlocked game options are available below.
            </div>
          </div>
        )}

        {/* Town name */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,color:"#888",marginBottom:7,letterSpacing:1}}>REALM NAME</div>
          <input
            value={name}
            onChange={e=>{setName(e.target.value);setNameError(false);}}
            onKeyDown={e=>e.key==="Enter"&&handleStart()}
            placeholder="e.g. Ironveil, The Black Keep…"
            maxLength={28}
            style={{
              width:"100%", padding:"10px 14px", borderRadius:8,
              background:"rgba(255,255,255,0.06)",
              border:`1px solid ${nameError?"#ff7878":"rgba(255,255,255,0.12)"}`,
              color:"#f0e6d3", fontSize:15, outline:"none",
              fontFamily:"'Lato',sans-serif", boxSizing:"border-box",
            }}
          />
          {nameError&&<div style={{fontSize:10,color:"#ff7878",marginTop:4}}>Please name your realm before continuing.</div>}
        </div>

        {/* Colour picker */}
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,color:"#888",marginBottom:10,letterSpacing:1}}>REALM COLOUR</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {TOWN_COLORS.map(c=>(
              <button key={c.value} onClick={()=>setColor(c.value)}
                style={{
                  display:"flex",alignItems:"center",gap:7,
                  padding:"7px 12px", borderRadius:8, border:"none", cursor:"pointer",
                  background:color===c.value?`${c.value}22`:"rgba(255,255,255,0.04)",
                  outline:`2px solid ${color===c.value?c.value:"transparent"}`,
                  transition:"all 0.15s",
                }}>
                <div style={{width:12,height:12,borderRadius:"50%",background:c.value,flexShrink:0}}/>
                <span style={{fontSize:11,color:color===c.value?c.value:"#777",fontWeight:color===c.value?700:400}}>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Campaign length */}
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,color:"#888",marginBottom:10,letterSpacing:1}}>CAMPAIGN SPEED</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {Object.values(GAME_SPEEDS).map(s=>{
              const isSelected=speed===s.id;
              const details = s.id==="swift"
                ? ["26 weeks/season","±2 ranks/season","1.5× XP & Renown","Heroes age faster"]
                : ["52 weeks/season","±1 rank/season","Standard XP & Renown","Authentic career length"];
              return(
                <button key={s.id} onClick={()=>setSpeed(s.id)}
                  style={{
                    padding:"12px 14px", borderRadius:10, border:`1px solid ${isSelected?"rgba(255,215,0,0.4)":"rgba(255,255,255,0.08)"}`,
                    background:isSelected?"rgba(255,215,0,0.07)":"rgba(255,255,255,0.03)",
                    cursor:"pointer", textAlign:"left", transition:"all 0.15s",
                  }}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <div style={{width:14,height:14,borderRadius:"50%",border:`2px solid ${isSelected?"#ffd966":"#444"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {isSelected&&<div style={{width:6,height:6,borderRadius:"50%",background:"#ffd966"}}/>}
                    </div>
                    <span style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:13,color:isSelected?"#ffd966":"#888"}}>{s.label}</span>
                    <span style={{fontSize:10,color:isSelected?"#ff9f43":"#555",marginLeft:4}}>{s.tagline}</span>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",paddingLeft:22}}>
                    {details.map(d=>(
                      <span key={d} style={{fontSize:9,color:isSelected?"#777":"#444",background:"rgba(255,255,255,0.04)",padding:"2px 7px",borderRadius:6}}>{d}</span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview */}
        <div style={{
          padding:"12px 14px", borderRadius:8, marginBottom:24,
          background:`${color}0d`, border:`1px solid ${color}33`,
        }}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:color,flexShrink:0,boxShadow:`0 0 8px ${color}88`}}/>
            <div>
              <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:14,color:color}}>
                {name.trim()||"Your Realm"}
              </div>
              <div style={{fontSize:9,color:"#999",marginTop:1}}>Rank #9 of 9 · Season 1 · {GAME_SPEEDS[speed].label} · 10 heroes, 4,000g</div>
            </div>
          </div>
        </div>

        <button onClick={handleStart}
          style={{
            width:"100%", padding:"13px 0", borderRadius:9,
            border:"none", cursor:"pointer",
            background:`linear-gradient(135deg,${color},${color}aa)`,
            color:"#0d0d1a", fontFamily:"'Cinzel',serif",
            fontWeight:900, fontSize:15, letterSpacing:1,
          }}>
          Begin Your Legacy
        </button>
      </div>
    </div>
  );
}

function AbandonButton({onAbandon}){
  const [confirming,setConfirming]=useState(false);
  if(confirming) return(
    <div style={{display:"flex",flexDirection:"column",gap:6,padding:"10px 12px",borderRadius:8,background:"rgba(255,159,67,0.06)",border:"1px solid rgba(255,159,67,0.2)"}}>
      <div style={{fontSize:10,color:"#ff9f43",fontWeight:700}}>Abandon this campaign?</div>
      <div style={{fontSize:9,color:"#aaa",lineHeight:1.5}}>
        Your run ends here. Achievements earned so far<br/>
        and all boons are preserved for your next run.
      </div>
      <div style={{display:"flex",gap:6}}>
        <button onClick={()=>{setConfirming(false);onAbandon();}}
          style={{fontSize:10,padding:"4px 10px",borderRadius:6,border:"none",background:"#ff9f43",color:"#0d0d1a",cursor:"pointer",fontWeight:700,fontFamily:"'Cinzel',serif"}}>
          Yes, abandon
        </button>
        <button onClick={()=>setConfirming(false)}
          style={{fontSize:10,padding:"4px 10px",borderRadius:6,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:"#888",cursor:"pointer"}}>
          Cancel
        </button>
      </div>
    </div>
  );
  return(
    <button onClick={()=>setConfirming(true)}
      style={{fontSize:10,padding:"5px 12px",borderRadius:6,border:"1px solid rgba(255,159,67,0.3)",background:"rgba(255,159,67,0.07)",color:"#ff9f43",cursor:"pointer",fontFamily:"'Cinzel',serif"}}>
      Abandon
    </button>
  );
}

function NewGameButton(){
  const [confirming,setConfirming]=useState(false);
  if(confirming) return(
    <div style={{display:"flex",flexDirection:"column",gap:6,padding:"10px 12px",borderRadius:8,background:"rgba(255,100,100,0.06)",border:"1px solid rgba(255,100,100,0.2)"}}>
      <div style={{fontSize:10,color:"#ff7878",fontWeight:700}}>⚠️ This will erase everything:</div>
      <div style={{fontSize:9,color:"#aaa",lineHeight:1.5}}>
        • Current run progress and gold<br/>
        • All earned achievements and boons<br/>
        • NG+ legacy history<br/>
        This cannot be undone.
      </div>
      <div style={{display:"flex",gap:6}}>
        <button onClick={()=>{clearSave();clearNGPlus();window.location.reload();}}
          style={{fontSize:10,padding:"4px 10px",borderRadius:6,border:"none",background:"#ff7878",color:"#0d0d1a",cursor:"pointer",fontWeight:700,fontFamily:"'Cinzel',serif"}}>
          Yes, reset everything
        </button>
        <button onClick={()=>setConfirming(false)}
          style={{fontSize:10,padding:"4px 10px",borderRadius:6,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:"#888",cursor:"pointer"}}>
          Cancel
        </button>
      </div>
    </div>
  );
  return(
    <button onClick={()=>setConfirming(true)}
      style={{fontSize:10,padding:"5px 12px",borderRadius:6,border:"1px solid rgba(255,100,100,0.3)",background:"rgba(255,100,100,0.07)",color:"#ff7878",cursor:"pointer",fontFamily:"'Cinzel',serif"}}>
      New Game
    </button>
  );
}

function GuideTab(){
  const [openSection,setOpenSection]=useState(null);
  const toggle=(id)=>setOpenSection(s=>s===id?null:id);
  const Section=({id,icon,title,children})=>(
    <div style={{marginBottom:8,borderRadius:9,overflow:"hidden",border:"1px solid rgba(255,255,255,0.07)"}}>
      <button onClick={()=>toggle(id)}
        style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"11px 14px",
          background:openSection===id?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.02)",
          border:"none",cursor:"pointer",textAlign:"left"}}>
        <span style={{fontSize:16}}>{icon}</span>
        <span style={{flex:1,fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:12,color:"#f0e6d3"}}>{title}</span>
        <span style={{fontSize:12,color:"#888"}}>{openSection===id?"▼":"▶"}</span>
      </button>
      {openSection===id&&(
        <div style={{padding:"12px 16px",background:"rgba(0,0,0,0.2)",fontSize:11,color:"#888",lineHeight:1.7}}>
          {children}
        </div>
      )}
    </div>
  );
  return(
    <div style={{maxWidth:640}}>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:15,fontWeight:700,color:"#78c8ff",marginBottom:14}}>📖 How to Play</div>

      <Section id="loop" icon="⚔️" title="The Core Loop">
        <p style={{margin:"0 0 8px"}}>Each week you <b style={{color:"#f0e6d3"}}>set your formation</b>, <b style={{color:"#f0e6d3"}}>launch a battle</b>, and manage the aftermath. Win raids to earn gold. Use gold to sign heroes, build your town, and develop your squad.</p>
        <p style={{margin:"0 0 8px"}}>A season is <b style={{color:"#f0e6d3"}}>{SEASON_LENGTH()} weeks</b>. At the end of each season, the <b style={{color:"#ffd966"}}>top 2 teams promote</b> to the next league tier and the <b style={{color:"#ff7878"}}>bottom 2 relegate</b>.</p>
        <p style={{margin:0}}>You win by <b style={{color:"#ffd966"}}>finishing 1st in the Platinum League</b>. The path is Iron → Bronze → Silver → Gold → Platinum.</p>
      </Section>

      <Section id="league" icon="🏆" title="League Tiers & Promotion">
        <p style={{margin:"0 0 8px"}}>There are 5 tiers — each with 8 teams (you + 7 AI). Opponents are generated fresh for each tier and their power is <b style={{color:"#f0e6d3"}}>randomised each season</b>, so the same team may be easy one season and dangerous the next.</p>
        {[
          ["⚙️ Iron",    "Entry level. Tavern & Barracks unlock here."],
          ["🥉 Bronze",  "Infirmary & Recovery Lodge unlock on arrival."],
          ["🥈 Silver",  "Training Grounds & Talent Network unlock on arrival."],
          ["🥇 Gold",    "Grand Bazaar unlocks — premium heroes available in market."],
          ["💎 Platinum","Elite heroes available. Finish 1st to win the campaign."],
        ].map(([t,d])=>(
          <span key={t} style={{display:"block",marginBottom:4}}>
            <b style={{color:"#ffd966"}}>{t}</b> — <span style={{color:"#888"}}>{d}</span>
          </span>
        ))}
        <p style={{margin:"8px 0 0"}}>A <b style={{color:"#a8ff78"}}>500g promotion bonus</b> is paid when you move up to help with the transition.</p>
      </Section>

      <Section id="formation" icon="🎯" title="Formation & Positions">
        <p style={{margin:"0 0 8px"}}>Your formation has three lanes — <b style={{color:"#ff7878"}}>Vanguard</b> (front, 2 slots), <b style={{color:"#ffd966"}}>Skirmisher</b> (flank, 2 slots), <b style={{color:"#78c8ff"}}>Arbiter</b> (command, 2 slots). You can field 1–6 heroes.</p>
        <p style={{margin:"0 0 8px"}}>Each position has <b style={{color:"#a8ff78"}}>ideal roles and races</b> that earn a bonus — and <b style={{color:"#ff7878"}}>penalty roles</b> that hurt. A Warrior or Half-Orc in Vanguard is ideal. An Elf or Tiefling in Skirmisher excels. A Mage in Vanguard is a liability.</p>
        <p style={{margin:0}}>You win a battle by <b style={{color:"#ffd966"}}>winning 2 of 3 phases</b>. Each phase is won by your heroes' combined score in that lane vs the enemy's power share. Win chance is capped at 80% and floored at 20% — there's always risk.</p>
      </Section>

      <Section id="heroes" icon="🧑" title="Hero Management">
        <p style={{margin:"0 0 6px"}}><b style={{color:"#ff9f43"}}>Fatigue</b> builds each battle and recovers on the bench. Above 88%, heroes underperform and risk injury. Rotate your squad to manage it.</p>
        <p style={{margin:"0 0 6px"}}><b style={{color:"#ffd966"}}>Happiness</b> affects stats and contract demands. Win raids, renew contracts on time, and don't bench heroes for too long.</p>
        <p style={{margin:"0 0 6px"}}><b style={{color:"#a78bfa"}}>Morale</b> is short-term combat readiness. Wins raise it, losses lower it. Iron Will heroes are immune to morale loss.</p>
        <p style={{margin:0}}><b style={{color:"#78c8ff"}}>Contracts</b> expire after 1–4 seasons. Expired heroes demand renewal — accept, counter-offer, or risk them walking out.</p>
      </Section>

      <Section id="economy" icon="💰" title="Hero Economy — Buy, Develop, Sell">
        <p style={{margin:"0 0 8px"}}>Heroes grow in value as they level up. A raw Lv0 prospect costs ~300g. The same hero developed to Lv6 is worth ~1,400g — and a good bid can push that further.</p>
        <p style={{margin:"0 0 8px"}}><b style={{color:"#a8ff78"}}>Form</b> grows with battle appearances (+0.3–0.8 per battle) and decays slowly on the bench. A hero in Form 9 commands a <b style={{color:"#a8ff78"}}>+17% offer premium</b>.</p>
        <p style={{margin:"0 0 8px"}}><b style={{color:"#78c8ff"}}>Reputation</b> grows with every battle (+0.4) and never decays. High Reputation increases bid frequency and quality — scouts remember who they've watched.</p>
        <p style={{margin:0}}>The <b style={{color:"#ffd966"}}>Career Arc</b> panel in each hero's detail view tells you exactly when to sell — Peak is the sweet spot, Prime is fading, Declining means offers dry up fast.</p>
      </Section>

      <Section id="synergies" icon="✨" title="Synergies & Penalties">
        <p style={{margin:"0 0 8px"}}>Certain role combinations in the right positions trigger <b style={{color:"#a8ff78"}}>positive synergies</b> — formation rating boosts and win chance bonuses. Warrior + Paladin in Vanguard = Iron Wall. Mage + Bard in Arbiter = Arcane Chorus.</p>
        <p style={{margin:0}}>Wrong roles trigger <b style={{color:"#ff7878"}}>penalties</b> — a Mage in Vanguard (Chaos Front) dramatically reduces your rating. Check the Tactics tab — the ACTIVE NOW panel shows exactly what's firing before you battle.</p>
      </Section>

      <Section id="objectives" icon="📋" title="Season Objectives & Events">
        <p style={{margin:"0 0 8px"}}>Each season you get <b style={{color:"#78c8ff"}}>3 random objectives</b> from a pool of 40. Complete them mid-season for gameplay buffs — XP boosts, morale bonuses, fatigue reductions, enemy power debuffs.</p>
        <p style={{margin:0}}><b style={{color:"#a78bfa"}}>Random events</b> fire every ~3 weeks when a hero meets the stat requirements. Sending heroes on events earns gold, XP, and stat boosts — but they're away for 2–4 weeks. Accept most of them — event gold is the second-biggest income source in early seasons.</p>
      </Section>

      <Section id="tips" icon="💡" title="Tips & Tricks">
        {[
          "Rest fatigued heroes before big raids — above 88% fatigue they lose 40% effectiveness and risk injury.",
          "Counter your opponent's specialisation (shown in the Battle tab) to neutralise their power bonus.",
          "A Fading hero still has value as Squad Leader — their tenure scales morale and XP bonuses for the whole squad.",
          "Sell heroes at Peak or Prime — once they hit Declining, offers drop to 60% of value and become rare.",
          "Form and Reputation both show as progress bars in the hero detail — watch them to time your sales.",
          "Accept the Legendary Challenge (Gold tier+) for exhibition gold — no league impact if you lose.",
          "Objectives are visible in the Battle tab before you fight — adjust your formation to hit them.",
          "The phase breakdown in the debrief shows exactly which lane lost you the battle. That's where to invest.",
          "Events are underused by most players — ~9,000g per season in event gold if you accept 60% of them.",
          "Promotion to a new tier unlocks buildings immediately — check the Town tab after every promotion.",
        ].map((tip,i)=>(
          <p key={i} style={{margin:"0 0 6px",paddingLeft:12,borderLeft:"2px solid rgba(120,200,255,0.2)"}}>💡 {tip}</p>
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
  const [townColor,setTownColor]     = useState(saved?.townColor ?? DEFAULT_TOWN_COLOR);
  const [setupDone,setSetupDone]     = useState(!!(saved?.townName));
  const [gameSpeed,setGameSpeed]     = useState(()=>{
    const s = saved?.gameSpeed ?? "standard";
    ACTIVE_SPEED = GAME_SPEEDS[s] ?? GAME_SPEEDS.standard;
    return s;
  });

  const handleSetupComplete = (name, color, speed, selectedBoons=[]) => {
    setTownName(name);
    setTownColor(color);
    ACTIVE_SPEED = GAME_SPEEDS[speed] ?? GAME_SPEEDS.standard;
    setGameSpeed(speed);
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
    setSetupDone(true);
  };

  const [gold,setGold]               = useState(saved?.gold ?? 2500);
  const [week,setWeek]               = useState(saved?.week ?? 1);
  // Migrate any legacy Bard heroes to Cleric — Bard removed in favour of 6-class system
  const migrateBards = (hs) => hs.map(h => h.role === "Bard" ? {...h, role:"Cleric"} : h);
  const [heroes,setHeroes] = useState(()=> migrateBards(saved?.heroes ?? generateStartingSquad()));
  const [buildings,setBuildings]     = useState(()=> saved?.buildings ?? BUILDINGS.map(b=>({...b,built:false})));
  const [formation,setFormation]     = useState(()=>{
    if(saved?.formation && saved?.heroes) return deserializeFormation(saved.formation, saved.heroes);
    return {Vanguard:[null,null],Skirmisher:[null,null],Arbiter:[null,null]};
  });
  const [detailHero,setDetailHero]   = useState(null);
  const [prevStats,setPrevStats]     = useState(null);
  const [tab,setTab]                 = useState("Squad");
  const [market,setMarket] = useState(()=> migrateBards(saved?.market ?? Array.from({length:12},(_,i)=>generateHero(1000+i,true,false,false,null,null,"iron"))));
  const [log,setLog] = useState(()=>{
    if(saved?.log) return saved.log;
    const entries = [{week:0,text:"Your realm awaits. Keep your heroes happy and their contracts fresh.",type:"info"}];
    const starHero = (saved?.heroes ?? generateStartingSquad()).find(h=>h.foundling);
    if(starHero){
      entries.unshift({week:0,text:`🌟 ${starHero.name} has joined your ranks — scouts whisper of extraordinary potential.`,type:"success"});
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
  const [filter,setFilter]           = useState({role:"All",race:"All",sortBy:"Value",search:"",status:"All",phase:"All"});
  const [marketFilter,setMarketFilter] = useState({role:"All",stage:"All",sortBy:"Value"});
  const [retirees,setRetirees]       = useState([]);
  const [negotiationQueue,setNegotiationQueue] = useState(saved?.negotiationQueue ?? []);
  const [season,setSeason]               = useState(saved?.season ?? 1);
  const [seasonWeek,setSeasonWeek]       = useState(saved?.seasonWeek ?? 0);
  const [trophies,setTrophies]           = useState(saved?.trophies ?? []);

  // ── TIER LEAGUE STATE ──────────────────────────────────────────────────────
  const [playerTier,setPlayerTier]       = useState(saved?.playerTier ?? "iron");
  const [tierPosition,setTierPosition]   = useState(saved?.tierPosition ?? 8); // 1=top, 8=bottom
  const [tierEnemyTowns,setTierEnemyTowns] = useState(()=>{
    if(saved?.tierEnemyTowns) return saved.tierEnemyTowns;
    return generateTierTowns("iron");
  });
  const [leagueTable,setLeagueTable]     = useState(()=>{
    if(saved?.leagueTable) return saved.leagueTable;
    const t={};
    generateTierTowns("iron").forEach(e=>{ t[e.name]={wins:0,losses:0,power:e.power}; });
    return t;
  });
  const [activeSimulation,setActiveSimulation] = useState(null);
  const [pendingRaidEnemy,setPendingRaidEnemy] = useState(null);
  const [scheduledOpponent,setScheduledOpponent] = useState(saved?.scheduledOpponent ?? null);
  const [playerRecord,setPlayerRecord]         = useState(saved?.playerRecord ?? {wins:0,losses:0});
  const [matchLog,setMatchLog]                 = useState(saved?.matchLog ?? []);
  const [activeEvent,setActiveEvent]           = useState(saved?.activeEvent ?? null);
  const [showHiddenStats,setShowHiddenStats]   = useState(saved?.showHiddenStats ?? false);
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
  const [signDiscount,setSignDiscount]         = useState(saved?.signDiscount ?? 0); // 0–1 discount on next signing // pending random event // recent enemy-vs-enemy results
  const [listedHeroIds,setListedHeroIds]       = useState(()=>new Set(saved?.listedHeroIds ?? []));
  const [transferBids,setTransferBids]         = useState(saved?.transferBids ?? []);

  const addLog=(text,type="info")=>setLog(l=>[{week,text,type},...l.slice(0,79)]);

  // Generate first scheduled opponent on mount (only if no save)
  useEffect(()=>{
    if(!saved?.scheduledOpponent){
      setScheduledOpponent(generateScheduledOpponent(1, {}, tierEnemyTowns, playerTier));
    }
  },[]);

  // ── AUTO-SAVE after any meaningful state change ───────────────────────────
  useEffect(()=>{
    // Debounce slightly so rapid state updates don't thrash localStorage
    const t = setTimeout(()=>{
      saveGame({gold,week,heroes,buildings,formation,market,log,
                lastWeekFinances, seasonFinances, pendingEventReturns,
                wanderingMasterLastSeason, pendingChallenge, nextEventWeek,
                season,seasonWeek,trophies,
                playerTier,tierPosition,tierEnemyTowns,
                scheduledOpponent,negotiationQueue,
                townName,townColor,
                listedHeroIds:[...listedHeroIds],transferBids,
                leagueTable,playerRecord,matchLog,activeEvent,showHiddenStats,
                signDiscount,gameSpeed,squadLeaderId,
                hallOfFame,currentStreak,legendaryChallenger,emissaryFiredThisSeason,hintDismissed,raceSynergyUsage,bankruptcyWeeks});
    }, 400);
    return ()=>clearTimeout(t);
  },[gold,week,heroes,buildings,formation,market,log,season,
     seasonWeek,trophies,playerTier,tierPosition,tierEnemyTowns,scheduledOpponent,negotiationQueue,townName,townColor,listedHeroIds,transferBids,leagueTable,playerRecord,matchLog,activeEvent,showHiddenStats,signDiscount,gameSpeed,squadLeaderId,raceSynergyUsage,hallOfFame,currentStreak,legendaryChallenger,emissaryFiredThisSeason,hintDismissed,bankruptcyWeeks]);

  // ── CONTRACT NEGOTIATION HANDLERS ─────────────────────────────────────────
  const handleAccept=(hero,demand)=>{
    setHeroes(hs=>hs.map(h=>h.id!==hero.id?h:{
      ...h, salary:demand.salary, contractYears:demand.years,
      contractWeeks:demand.years*WEEKS_PER_CONTRACT_YEAR,
      contractWeeksLeft:demand.years*WEEKS_PER_CONTRACT_YEAR,
      negotiationPending:false, negotiationIgnoredWeeks:0,
      morale:Math.min(100,h.morale+20),
    }));
    setNegotiationQueue(q=>q.slice(1));
    addLog(`✅ Signed ${hero.name}: ${demand.salary}g/wk for ${demand.years}s.`,"success");
  };

  const handleCounter=(hero,counter)=>{
    // Hero accepts counter if Loyal, or if happiness > 50, or random chance
    const accepts=hero.traits?.includes("Loyal")||(hero.morale>50&&Math.random()<0.6);
    if(accepts){
      setHeroes(hs=>hs.map(h=>h.id!==hero.id?h:{
        ...h, salary:counter.salary, contractYears:counter.years,
        contractWeeks:counter.years*WEEKS_PER_CONTRACT_YEAR,
        contractWeeksLeft:counter.years*WEEKS_PER_CONTRACT_YEAR,
        negotiationPending:false, negotiationIgnoredWeeks:0,
        morale:Math.min(100,h.morale+10),
      }));
      setNegotiationQueue(q=>q.slice(1));
      addLog(`🤝 ${hero.name} accepted the counter-offer: ${counter.salary}g/wk for ${counter.years}s.`,"success");
    } else {
      setHeroes(hs=>hs.map(h=>h.id!==hero.id?h:{
        ...h, morale:Math.max(10,h.morale-15),
        negotiationIgnoredWeeks:(h.negotiationIgnoredWeeks||0)+1,
      }));
      setNegotiationQueue(q=>q.slice(1));
      addLog(`😠 ${hero.name} rejected the counter-offer. Morale taking a hit.`,"warning");
    }
  };

  const handleReject=(hero)=>{
    const hotHeaded=hero.traits?.includes("Hot-headed");
    if(hotHeaded){
      // Immediate walkout
      setHeroes(hs=>hs.filter(h=>h.id!==hero.id));
      setFormation(f=>{const nf={};POS_KEYS.forEach(p=>{nf[p]=(f[p]||[]).map(h=>h&&h.id===hero.id?null:h);});return nf;});
      addLog(`🤬 ${hero.name} (Hot-headed) walked out immediately after contract rejection!`,"danger");
      if(squadLeaderId===hero.id) setSquadLeaderId(null);
    } else {
      setHeroes(hs=>hs.map(h=>h.id!==hero.id?h:{
        ...h, morale:Math.max(10,h.morale-18),
        negotiationPending:true, negotiationIgnoredWeeks:(h.negotiationIgnoredWeeks||0)+1,
      }));
      addLog(`😤 ${hero.name} rejected. Very unhappy. Contract dispute ongoing.`,"danger");
    }
    setNegotiationQueue(q=>q.slice(1));
  };

  const initiateEarlyRenewal = (hero) => {
    // Only available within 2 seasons of expiry and when not already pending
    if(hero.negotiationPending) return;
    if((hero.contractWeeksLeft||0) > WEEKS_PER_CONTRACT_YEAR * 2) return;
    setHeroes(hs=>hs.map(h=>h.id!==hero.id?h:{...h, negotiationPending:true, negotiationIgnoredWeeks:0}));
    addLog(`📋 ${hero.name} called in for early contract talks.`,"info");
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
      addLog(`🤝 ${h.name} departed at contract end. Mutual parting — no morale impact.`,"info");
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
      addLog(`🚪 ${h.name} was let go. The squad barely noticed.`,"info");
    } else {
      addLog(`🚪 ${h.name} (Lv ${h.level}, ${h.weeksInSquad||0} weeks) was released. Squad morale −${totalPenalty}.`,"danger");
      if(totalPenalty>=25) addLog(`💔 The squad is devastated. This will take weeks to recover.`,"danger");
      else if(totalPenalty>=15) addLog(`😟 The squad is shaken. Morale will take time to recover.`,"warning");
      if(posName){
        const samePos=affected.filter(r=>(formation[posName]||[]).some(x=>x&&x.id===r.id));
        if(samePos.length>0) addLog(`💔 ${samePos.map(x=>x.name).join(", ")} are hit hardest — same position, lost a teammate.`,"warning");
      }
    }
  };

  const buyHero=h=>{
    if(heroes.filter(x=>!x.retired).length>=ROSTER_CAP){
      addLog(`⚠️ Roster full (${ROSTER_CAP} heroes). Release or sell a hero first.`,"warning");
      return;
    }
    const discountedValue=signDiscount>0?Math.round(h.value*(1-signDiscount)):h.value;
    if(gold<discountedValue)return;
    const hasBazaar=buildings.find(b=>b.id==="bazaar"&&b.built);
    const hasSanctum=buildings.find(b=>b.id==="sanctum"&&b.built);
    const isElite   = !!(hasSanctum);
    const isPremium = hasBazaar || ["gold","platinum"].includes(playerTier);
    let nh={...h,id:Date.now()};
    setGold(g=>g-discountedValue);
    setSeasonFinances(prev=>({...prev, signingCosts:prev.signingCosts+discountedValue}));
    if(signDiscount>0){
      addLog(`🏷️ Objective discount applied: ${Math.round(signDiscount*100)}% off!`,"success");
      setSignDiscount(0);
    }
    setHeroes(hs=>[...hs,nh]);
    setMarket(m=>{
      const next=m.filter(x=>x.id!==h.id);
      if(hasBazaar&&Math.random()<0.5) return[...next,generateHero(Date.now()+1,true,isPremium,isElite&&Math.random()<0.3,null,null,playerTier)];
      return next;
    });
    addLog(`Signed ${h.name} for ${discountedValue.toLocaleString()}g!`,"success");
    // Complete sign_hero objective
  };

  const buildBuilding=b=>{
    if(gold<b.cost)return;
    if(playerRenown<(b.renownRequired||0))return;
    setGold(g=>g-b.cost);
    setBuildings(bs=>bs.map(x=>x.id===b.id?{...x,built:true}:x));
    addLog(`🏗️ ${b.name} constructed!`,"success");
    setHallOfFame(prev=>({...prev, buildingsBuilt:(prev.buildingsBuilt||0)+1}));
    // Bazaar: spawn premium (not elite) heroes — elite reserved for Elite Sanctum
    if(b.id==="bazaar"){
      setMarket(m=>[...m,...Array.from({length:3},(_,i)=>generateHero(Date.now()+i,true,true,false,null,null,playerTier))]);
      addLog("🏪 Grand Bazaar: premium heroes arrived!","success");
    }
    // Elite Sanctum: spawn elite heroes immediately + flag market for future elite spawns
    if(b.id==="sanctum"){
      setMarket(m=>[...m,...Array.from({length:2},(_,i)=>generateHero(Date.now()+i,true,true,true,null,null,playerTier))]);
      addLog("💎 Elite Sanctum: elite heroes have arrived seeking a worthy realm!","success");
    }
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

  const generateBids=(currentHeroes,currentWeek,listed)=>{
    const bidding=[];
    currentHeroes.forEach(h=>{
      if(h.injured||h.retired) return;
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
      const offer = Math.round(h.value * pct);

      const town=pick(ENEMY_TOWNS);

      const combatScore=calcHeroCombatScore(h,"Vanguard");
      const reasons=[];
      if(h.stats.Form>=8) reasons.push("exceptional form");
      if(h.stats.Form>=9) reasons.push("in the form of their life");
      if(h.stats.Potential>=70) reasons.push("high potential");
      if(combatScore>=40) reasons.push("strong combat rating");
      if(agePhase(h)==="peak"||agePhase(h)==="rising") reasons.push("strong career stage");
      if(h.level>=6) reasons.push(`Lv ${h.level} experience`);
      if(repStat>=60) reasons.push("renowned across the realm");
      if(isListed) reasons.push("listed for transfer");
      const reason=reasons.length?reasons.slice(0,2).join(" & "):"scouted your roster";

      bidding.push({
        id:`bid_${h.id}_${currentWeek}`,
        heroId:h.id,
        heroName:h.name,
        town:town.name,
        offer,
        marketValue:h.value,
        pctOfValue:Math.round(pct*100),
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
    addLog(`💰 ${h.name} transferred to ${bid.town} for ${bid.offer.toLocaleString()}g!`,"success");
    addLog(`The squad wishes them well. Minor morale dip — better than a walkout.`,"info");
    // Complete sell_hero objective
  };

  const declineBid=(bid)=>{
    setTransferBids(prev=>prev.filter(b=>b.id!==bid.id));
    addLog(`❌ Declined ${bid.town}'s offer for ${bid.heroName}.`,"info");
  };

  // ── EVENT OUTCOME RESOLUTION ──────────────────────────────────────────────
  // Called when a hero returns from an event. Rolls success/partial/fail,
  // applies rewards or consequences, returns a notification object.

  const NEGATIVE_TRAITS = ["Cursed","Coward","Greedy","Hot-headed","Stubborn","Unlucky","Glass Cannon"];
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
    const matchScore = calcMatchScore(hero, eventDef);
    const { success, partial, failure } = calcEventSuccessChance(matchScore);
    const roll = Math.random();
    let outcome, notifications=[], heroUpdates={};

    if(roll < success) {
      outcome = "success";
      // Gold reward
      if(eventDef.reward.goldRange) {
        const gold = rand(...eventDef.reward.goldRange);
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
        const gold = Math.round(rand(...eventDef.reward.goldRange) * 0.5);
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

    return { outcome, heroUpdates, notifications, goldGain: heroUpdates._goldGain||0 };
  };

  const acceptEvent=(event, selectedHeroes)=>{
    if(event.isEmissary){
      setLegendaryChallenger(event.challenger);
      setActiveEvent(null);
      addLog(`⚔️ Challenge accepted! ${event.challenger.name} will face you next battle.`,"success");
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
    addLog(`✨ ${names} departed for "${event.title}" — away ${awayWeeks} week${awayWeeks>1?"s":""}.`,"success");
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
    addLog(`🧙 ${hero.name} trained with the Wandering Master. +${boostAmount} ${stat}!`, "success");
    setWanderingMasterLastSeason(season);
    setActiveWanderingMaster(null);
  };

  const declineWanderingMaster = () => {
    addLog(`🧙 The Wandering Master departs. Another time.`, "info");
    setActiveWanderingMaster(null);
  };

  const declineChallenge = () => {
    setHeroes(hs => hs.map(h => ({...h, morale: Math.max(10, (h.morale||70) - 8)})));
    setPendingChallenge(null);
    addLog(`😔 The challenge was declined. The squad's spirit wavers. (−8 morale to all)`, "warning");
  };

  const declineEvent=()=>{
    addLog(`❌ Declined: "${activeEvent?.title}"`, "info");
    setActiveEvent(null);
  };

  // ── SEASON OBJECTIVES ─────────────────────────────────────────────────────

;

  const startBattle=()=>{
    const opponent = legendaryChallenger || scheduledOpponent;
    if(!opponent){addLog("No opponent scheduled this week!","danger");return;}
    const placed=POS_KEYS.flatMap(p=>(formation[p]||[]).filter(Boolean));
    if(placed.length<3){addLog("Assign at least 3 heroes in Tactics!","danger");return;}

    // Apply challenge modifier if active
    let battleOpponent = opponent;
    if(pendingChallenge && !legendaryChallenger){
      const boostedPower = Math.round((opponent.power||100) * pendingChallenge.opponentPowerMult);
      battleOpponent = {...opponent, power:boostedPower, _challengeRewardMult:pendingChallenge.rewardMult};
      setPendingChallenge(null);
      addLog(`⚔️ The Challenge is active — opponent ${Math.round((pendingChallenge.opponentPowerMult-1)*100)}% stronger, rewards doubled!`,"warning");
    }

    const sim=buildRaidSimulation(formation,battleOpponent,buildings,TIERS[playerTier]?.difficulty??1,ngPlus);
    if(!sim)return;
    setActiveSimulation(sim);
    setPendingRaidEnemy(battleOpponent);
  };

  // ── SKIP WEEK — pay wages, no raid ────────────────────────────────────────
  // ── RAID: PHASE 2 — apply outcome after simulation completes ──────────────
  const applyRaidResult=()=>{
    try {
    const result=activeSimulation;
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
        setGold(g=>g+(lc.goldReward||3000));
        addLog(`🏆 LEGENDARY VICTORY! You defeated ${lc.name}! +${(lc.goldReward||3000).toLocaleString()}g`,"success");
        setHallOfFame(prev=>({...prev, legendaryWins:(prev.legendaryWins||0)+1, lastLegendaryVictory:{name:lc.name,season,week:week+1}}));
      } else {
        addLog(`💀 Defeat against ${raidEnemy.name}. A legendary loss — but no rank penalty. Learn and return stronger.`,"warning");
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
      if(rewardMult > 1 && result.won) addLog(`🎖️ Challenge victory! Rewards ×${rewardMult} — +${finalGoldSwing.toLocaleString()}g`,"success");
      setGold(g=>Math.max(0,g+finalGoldSwing));
      result.goldSwing = finalGoldSwing;
      result.events.forEach(e=>addLog(e,result.won?"success":"danger"));
      if(rewardMult === 1) addLog(`Gold ${result.goldSwing>=0?"+":""}${result.goldSwing.toLocaleString()}g`,result.won?"success":"warning");
    }

    const newLevelUps=[]; const snapshots={};
    const raidedIds=new Set(result.allHeroes.map(h=>h.id));
    const formationIds=new Set(POS_KEYS.flatMap(p=>(formation[p]||[]).filter(Boolean).map(h=>h.id)));

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
        let injured=h.injured||result.injuries.includes(h.id);
        let injuryWeeks=injured?(result.injuries.includes(h.id)?rand(1,4):Math.max(0,h.injuryWeeks-1)):0;
        if(buildings.find(b=>b.id==="infirmary"&&b.built)&&injuryWeeks>0)injuryWeeks=Math.max(1,injuryWeeks-1);
        if(injuryWeeks===0)injured=false;
        let xpGain=result.heroXP;
        if(h.morale>=80)xpGain=Math.round(xpGain*1.1);
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
          if(newMentorBonus.weeksLeft===0){addLog(`🎖️ ${h.name}'s mentorship from ${newMentorBonus.mentorName} has ended.`,"info");newMentorBonus=null;}
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

        // Form grows with play — scouts notice heroes in form
        // Reputation grows with appearances — the market learns who you are
        const formGain = (Math.random() * 0.5) + 0.3; // 0.3–0.8 per raid
        const newForm = Math.min(10, (cursedStats.Form||5) + formGain);
        // Injury knocks Form — coming back rusty
        const postInjuryForm = (injured && result.injuries.includes(h.id))
          ? Math.max(1, newForm - 1.0)
          : newForm;
        const newRep = Math.min(99, (cursedStats.Reputation||0) + (result.won ? 0.5 : 0.2));
        const grownStats = {...cursedStats, Form: Math.round(postInjuryForm * 10) / 10, Reputation: Math.round(newRep * 10) / 10};

        // Increment formation weeks and check potential reveal (8-10 weeks of active play)
        const newWeeksInFormation = (h.weeksInFormation||0) + 1;
        const revealThreshold = 8 + Math.floor(Math.random()*3); // 8-10 weeks
        const potentialRevealed = h.potentialRevealed || newWeeksInFormation >= revealThreshold;

        return{...h,xp:newXP,level:newLv,value:updatedValue,stats:grownStats,morale:Math.min(100,Math.max(0,h.morale+totalMoraleSwing)),injured,injuryWeeks,weeksUnplayed:0,fatigue:newFatigue,mentorBonus:newMentorBonus,weeksInSquad:(h.weeksInSquad||0)+1,weeksInFormation:newWeeksInFormation,potentialRevealed};
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
              // Resolve outcome — store in pendingEventReturns for banner display
              const resolution = resolveEventOutcome(h, pendingEvent);
              // Apply gold gain
              if(resolution.goldGain>0) setGold(g=>g+resolution.goldGain);
              // Apply hero updates from resolution
              const u = resolution.heroUpdates;
              if(u.stats)       h = {...h, stats: u.stats};
              if(u.traits)      h = {...h, traits: u.traits};
              if(u.xp!=null)    { const newXP=u.xp; const newLv=Math.min(MAX_LEVEL,levelFromXp(newXP)); const newStats=newLv>h.level?growHeroStats({...h,level:h.level},newLv,buildings):h.stats; h={...h,xp:newXP,level:newLv,stats:{...h.stats,...newStats},value:calcHeroValue({...h,level:newLv})}; }
              if(u.morale!=null)   h = {...h, morale: u.morale};
              if(u.fatigue!=null)  h = {...h, fatigue: u.fatigue};
              if(u.injured)        h = {...h, injured:true, injuryWeeks:u.injuryWeeks||1};
              setPendingEventReturns(prev=>[...prev, {
                id: `${h.id}_${Date.now()}`,
                heroName: h.name,
                heroIcon: RACE_ICONS[h.race]||"⚔️",
                eventTitle: pendingEvent.title,
                eventTheme: pendingEvent.theme,
                outcome: resolution.outcome,
                notifications: resolution.notifications,
                goldGain: resolution.goldGain,
                pendingStatChoice: u._pendingStatChoice||false,
                heroId: h.id,
              }]);
              pendingEvent = null;
            } else {
              addLog(`🏠 ${h.name} returned from "${h.awayEvent}".`,"success");
            }
          }
        }

        // Mentor bonus — applies even on bench (wisdom transcends the battlefield)
        let newMentorBonus=h.mentorBonus;
        let mentorXP=0;
        if(newMentorBonus&&newMentorBonus.weeksLeft>0){
          mentorXP=newMentorBonus.xpPerWeek;
          newMentorBonus={...newMentorBonus,weeksLeft:newMentorBonus.weeksLeft-1};
          if(newMentorBonus.weeksLeft===0){addLog(`🎖️ ${h.name}'s mentorship from ${newMentorBonus.mentorName} has ended.`,"info");newMentorBonus=null;}
        }

        // Form decays on bench — injured heroes decay faster (rust + physical setback)
        // Reputation decays slowly on bench — out of sight, out of mind
        const formDecay = h.injured ? 0.40 : 0.15;
        const benchForm = Math.max(1, (h.stats.Form||5) - formDecay);
        const benchRep  = Math.max(0, (h.stats.Reputation||0) - 0.1);
        const benchStats = h.traits?.includes("Cursed") && Math.random()<0.4
          ? {...h.stats, Form: Math.max(1, h.stats.Form - rand(1,2)), Reputation: benchRep}
          : {...h.stats, Form: Math.round(benchForm * 10) / 10, Reputation: Math.round(benchRep * 10) / 10};

        // Bench morale: decay -0.5/week (soft floor 40), -1 for bench, -1 extra after 4 weeks
        const benchDecay = h.morale > 40 ? -0.5 : 0;
        const benchMoraleDelta = benchDecay + moraleDelta + (newWeeksUnplayed > 4 ? -1 : 0);
        const newMorale = Math.min(100, Math.max(0, h.morale + benchMoraleDelta));

        return{...h,
          morale: newMorale,
          weeksUnplayed:newWeeksUnplayed,
          fatigue:newFatigue,awayWeeks,awayEvent,pendingEvent,
          xp: mentorXP>0 ? h.xp+mentorXP : h.xp,
          mentorBonus:newMentorBonus,
          weeksInSquad:(h.weeksInSquad||0)+1,
          weeksInFormation: h.weeksInFormation||0, // doesn't increment on bench
          potentialRevealed: h.potentialRevealed||false,
          stats: benchStats,
        };
      }
    });

    if(buildings.find(b=>b.id==="tavern"&&b.built)){
      updatedHeroes=updatedHeroes.map(h=>({...h,morale:Math.min(100,h.morale+3)}));
      addLog("🍺 Tavern: +3 morale to all heroes","info");
    }

    // Hall of Legends — retired heroes contribute morale based on level at retirement
    // Each retiree contributes 1 + floor(level/3) morale/week, capped at +20 total
    if(buildings.find(b=>b.id==="legends"&&b.built)){
      const retirees = updatedHeroes.filter(h=>h.retired);
      if(retirees.length>0){
        const legendBonus = Math.min(20, retirees.reduce((sum,h)=>sum+(1+Math.floor((h.level||0)/3)),0));
        if(legendBonus>0){
          updatedHeroes=updatedHeroes.map(h=>h.retired?h:{...h,morale:Math.min(100,h.morale+legendBonus)});
          addLog(`🏛️ Hall of Legends: +${legendBonus} morale from ${retirees.length} retired hero${retirees.length>1?"es":""}`, "info");
        }
      }
    }

    // Squad Leader morale bonus — applies to all formation heroes if leader is in formation
    const leader=squadLeaderId?updatedHeroes.find(h=>h.id===squadLeaderId):null;
    const leaderInFormation=leader&&raidedIds.has(leader.id);
    if(leaderInFormation){
      const lb=calcLeaderBonuses(leader);
      updatedHeroes=updatedHeroes.map(h=>{
        if(!raidedIds.has(h.id)) return h;
        return {...h, morale:Math.min(100,h.morale+lb.moralePerWeek)};
      });
      addLog(`👑 ${leader.name} (Squad Leader): +${lb.moralePerWeek} morale to all raiders`,"info");
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
      addLog(`🎯 Training Grounds: bench heroes earned ${benchXP} XP`,"info");
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
      addLog(`🏪 The mercenary pool has refreshed — ${hasNetwork?"Talent Network":"new faces"} arrive.`,"info");
    }

    updatedHeroes=updatedHeroes.map(h=>{
      const wLeft=Math.max(0,(h.contractWeeksLeft||0)-1);
      let negotiationPending=h.negotiationPending, negotiationIgnoredWeeks=h.negotiationIgnoredWeeks||0;
      if(wLeft===0&&!negotiationPending){negotiationPending=true;negotiationIgnoredWeeks=0;addLog(`📜 ${h.name}'s contract has expired! Renewal required.`,"warning");}
      if(wLeft===1&&!negotiationPending){addLog(`⚠️ ${h.name}'s contract expires next week — prepare for renewal.`,"warning");}
      if(wLeft===6&&!negotiationPending){addLog(`⏰ ${h.name}'s contract expires in 6 weeks.`,"info");}
      if(negotiationPending&&wLeft===0){negotiationIgnoredWeeks++;if(negotiationIgnoredWeeks>=3){return{...h,contractWeeksLeft:0,negotiationPending,negotiationIgnoredWeeks,morale:Math.max(0,h.morale-15)};}}
      return{...h,contractWeeksLeft:wLeft,negotiationPending,negotiationIgnoredWeeks};
    });

    const walkouts=updatedHeroes.filter(h=>{
      if(h.contractWeeksLeft!==0) return false;
      if(h.retired) return false;
      if(h.traits?.includes("Iron Will")) return false;
      if(h.morale>=20) return false;
      // Weekly walkout chance scales from 0% at morale 20 down to 35% at morale 0
      const baseChance = Math.pow((20 - h.morale) / 20, 1.5) * 0.35;
      const chance = h.traits?.includes("Loyal") ? baseChance * 0.15
        : h.traits?.includes("Hot-headed") ? Math.min(0.95, baseChance * 2.5)
        : baseChance;
      return Math.random() < chance;
    });
    walkouts.forEach(h=>{
      addLog(`🤬 ${h.name} walked out! The squad is rattled.`,"danger");
      updatedHeroes=applySquadMoraleEvent(updatedHeroes.filter(x=>x.id!==h.id),h,formation,"walkout");
      setFormation(f=>{const nf={};POS_KEYS.forEach(p=>{nf[p]=(f[p]||[]).map(x=>x&&x.id===h.id?null:x);});return nf;});
      if(squadLeaderId===h.id) setSquadLeaderId(null);
    });

    updatedHeroes=updatedHeroes.map(h=>{
      if(!h.injured||raidedIds.has(h.id))return h;
      const wks=Math.max(0,h.injuryWeeks-1);
      return{...h,injuryWeeks:wks,injured:wks>0};
    });

    const newRetirees=[];
    const aged=updatedHeroes.map(h=>{
      if(h.retired)return h;
      const{hero:nh,events}=ageHero(h,buildings);
      events.forEach(e=>{addLog(e.text,e.type);if(e.retired)newRetirees.push(nh);});
      return nh;
    });

    const newNeg=aged.filter(h=>h.negotiationPending&&!negotiationQueue.find(x=>x.id===h.id));
    if(newNeg.length>0)setNegotiationQueue(q=>[...q,...newNeg.filter(x=>!q.find(y=>y.id===x.id))]);

    if(newRetirees.length>0){
      setFormation(f=>{const nf={};const retiredIds=new Set(newRetirees.map(r=>r.id));POS_KEYS.forEach(p=>{nf[p]=(f[p]||[]).map(h=>h&&retiredIds.has(h.id)?null:h);});return nf;});
      // Retirement morale boost for remaining squad
      let retirementAged=aged.filter(h=>!h.retired);
      newRetirees.forEach(r=>{
        retirementAged=applySquadMoraleEvent(retirementAged,r,formation,"retire");
        addLog(`🎖️ The squad celebrates ${r.name}'s retirement. Morale lifted!`,"success");
      });
      aged.splice(0,aged.length,...aged.map(h=>retirementAged.find(x=>x.id===h.id)||h));
      setRetirees(newRetirees);
      if(newRetirees.some(r=>r.id===squadLeaderId)) setSquadLeaderId(null);
    }

    if(newLevelUps.length){setLevelUps(newLevelUps);newLevelUps.forEach(e=>addLog(`⭐ ${e.name} → Level ${e.newLv}! (${e.gained} stats grew)`,"success"));if(Object.keys(snapshots).length)setPrevStats(snapshots);}
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
    addLog(`💸 Weekly wages: ${wages.toLocaleString()}g`,"warning");

    // Bankruptcy grace period — if gold can't cover wages, start/advance counter
    const tributeAmount=weeklyRankIncome(playerTier, tierPosition);
    setGold(g=>g+tributeAmount);
    addLog(`${TIERS[playerTier]?.icon||'👑'} ${TIERS[playerTier]?.name||'Iron'} tribute: +${tributeAmount.toLocaleString()}g/wk`,"success");

    // Check bankruptcy after tribute (give tribute a chance to help)
    const goldAfterAll = Math.max(0, goldAfterWages) + tributeAmount;
    if(goldAfterAll <= 0){
      const newBankruptcyWeeks = bankruptcyWeeks + 1;
      setBankruptcyWeeks(newBankruptcyWeeks);
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
        setLegacyCeremony({ season, wins:playerWins, losses:playerLosses,
          tier: playerTier, defeat:true, defeatReason:"bankruptcy",
          newlyEarned, allBoons,
          chronicle:{ totalRaids:trophies.reduce((a,t)=>(t.wins||0)+(t.losses||0),0)+playerWins+playerLosses,
            totalWins:trophies.reduce((a,t)=>a+(t.wins||0),0)+playerWins,
            totalSeasons:season, builtCount:buildings.filter(b=>b.built).length,
            totalWeeks:week },
        });
        addLog("💀 The realm has fallen into ruin. The campaign is over.","danger");
      } else {
        const weeksLeft = 3 - newBankruptcyWeeks;
        const urgency = weeksLeft === 2 ? "⚠️" : "🚨";
        addLog(`${urgency} The realm's coffers are empty! ${weeksLeft} week${weeksLeft>1?"s":""} until the campaign ends. Sell heroes, win battles, or generate income.`, "danger");
      }
    } else if(bankruptcyWeeks > 0){
      // Recovered — reset counter
      setBankruptcyWeeks(0);
      addLog("✅ Finances stabilised — bankruptcy warning lifted.","success");
    }

    // Record this week's finances for the Ledger tab
    const weekFinances = { week:week+1, tribute:tributeAmount, wages, raidGold:result.goldSwing, eventGold:0, signingCosts:0, netGold:tributeAmount - wages + result.goldSwing, wasRaid:true };
    setLastWeekFinances(weekFinances);
    setSeasonFinances(prev=>({ tribute:prev.tribute+tributeAmount, raidGold:prev.raidGold+(result.goldSwing||0), wages:prev.wages+wages, eventGold:prev.eventGold, signingCosts:prev.signingCosts }));



    const newSeasonWeek=seasonWeek+1;
    if(newSeasonWeek>=SEASON_LENGTH()){
      endSeason();
    } else {
      setSeasonWeek(newSeasonWeek);
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
        addLog(`⚔️ Legendary challenge received from ${fullChallenger.name}! Check the Battle tab.`,"success");
      }
      else if(!pendingChallenge && Math.random()<0.20){
        const challenge = SPECIAL_EVENTS.find(e=>e.id==="the_challenge");
        setPendingChallenge({ opponentPowerMult: challenge.opponentPowerMult, rewardMult: challenge.rewardMult });
        addLog(`⚔️ "${challenge.title}" — a formal challenge arrives. Check the Battle tab.`,"info");
      }
      else if((season - wanderingMasterLastSeason) >= 2 && Math.random()<0.15){
        setActiveWanderingMaster(SPECIAL_EVENTS.find(e=>e.id==="wandering_master"));
        addLog(`🧙 A wandering master has arrived at your gates! Check the Squad tab.`,"info");
      }
      else if(!pendingChallenge){
        const availableHeroes=heroes.filter(h=>!h.retired&&!(h.awayWeeks>0)&&!h.injured);
        const ev=generateRandomEvent(availableHeroes,week+1);
        if(ev){
          setActiveEvent(ev);
          addLog(`📣 "${ev.title}" — check the Battle tab!`,"info");
        }
      }
    }

    // Track player W/L record — legendary raids are exhibition matches, no leaderboard impact
    if(!isLegendary){
      setPlayerRecord(r=>({wins:r.wins+(result.won?1:0),losses:r.losses+(result.won?0:1)}));
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

    // Simulate enemy-vs-enemy matches this week (skip for legendary — they're outside normal schedule)
    if(!isLegendary){
      setLeagueTable(prev=>{
        const {updated,results}=simulateEnemyWeek(week+1,raidEnemy.name,prev,tierEnemyTowns);
        if(results.length) setMatchLog(ml=>[...results.map(r=>({...r,week:week+1})),...ml.slice(0,19)]);
        return updated;
      });
    }

    // Generate offers every ~4 weeks
    if((week+1)%4===0){
      const newBids=generateBids(heroes,week+1,listedHeroIds);
      if(newBids.length){
        setTransferBids(prev=>{
          const fresh=prev.filter(b=>b.week>=week-1);
          const existingHeroIds=new Set(fresh.map(b=>b.heroId));
          const dedupedNew=newBids.filter(b=>!existingHeroIds.has(b.heroId));
          return [...fresh,...dedupedNew];
        });
        addLog(`📨 ${newBids.length} offer${newBids.length>1?"s":""} received! Check the Hire tab.`,"success");
      }
    }

    const nextOpp = generateScheduledOpponent(seasonWeek + 2, leagueTable, tierEnemyTowns, playerTier);
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
      addLog(`⚠️ Error applying results: ${err.message}. Check console.`, "danger");
      // Still advance the week so the game isn't stuck
      setWeek(w=>w+1);
      setSeasonWeek(sw=>sw+1);
    }
  };

  // ── SEASON END — tiered promotion/relegation ──────────────────────────────
  const endSeason=()=>{
    const playerWins = playerRecord.wins;
    const playerLosses = playerRecord.losses;
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
      const totalRaids = trophies.reduce((a,t)=>(t.wins||0)+(t.losses||0),0)+playerWins+playerLosses;
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
    // Top 2 AI promote out, bottom 2 relegate out, rest stay but power refreshes
    const sortedAI = standings.filter(t=>!t.isPlayer);
    const promotedOut = sortedAI.slice(0,2).map(t=>t.name); // top 2 AI leave
    const relegatedOut = sortedAI.slice(-2).map(t=>t.name); // bottom 2 AI leave
    const staying = (tierEnemyTowns||[]).filter(t=>!promotedOut.includes(t.name)&&!relegatedOut.includes(t.name));

    // Refresh power of staying teams
    const refreshedStaying = staying.map(t=>({...t, wins:0, losses:0, power:rand(newTier.powerMin, newTier.powerMax)}));

    // Generate replacements: 2 from tier above (promoted in from below), 2 from tier below (relegated from above)
    const existingNames = refreshedStaying.map(t=>t.name);
    const tierBelow = TIER_ORDER[Math.max(0, newTierIdx-1)];
    const tierAbove = TIER_ORDER[Math.min(TIER_ORDER.length-1, newTierIdx+1)];
    const newFromBelow = generateTierTowns(tierBelow, existingNames).slice(0,2).map(t=>({...t,tierId:newTierId,power:rand(newTier.powerMin,Math.round(newTier.powerMin*1.3))}));
    const newFromAbove = generateTierTowns(tierAbove, [...existingNames,...newFromBelow.map(t=>t.name)]).slice(0,2).map(t=>({...t,tierId:newTierId,power:rand(Math.round(newTier.powerMax*0.7),newTier.powerMax)}));
    const newTierTowns = [...refreshedStaying, ...newFromBelow, ...newFromAbove].slice(0,7);

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
    const movementMsg = movement==="promoted"?`🎉 PROMOTED to ${TIERS[newTierId].name}!`:
                        movement==="relegated"?`📉 Relegated to ${TIERS[newTierId].name}.`:
                        movement==="relegated_floor"?`⚠️ Finished bottom of Iron — no lower to go.`:
                        `✅ Held position in ${TIERS[playerTier].name} (${finalPosition}${['st','nd','rd'][finalPosition-1]||'th'})`;
    addLog(`🏆 Season ${season} ended! ${movementMsg} — ${playerWins}W/${playerLosses}L`,"success");

    // ── PROMOTION BONUS ───────────────────────────────────────────────────
    if(movement==="promoted"){
      setGold(g=>g+500);
      addLog(`💰 Promotion bonus: +500g to ease the transition.`,"success");
      // Promotion excitement — all heroes get a morale lift going into the new tier
      setHeroes(hs=>hs.map(h=>h.retired?h:{...h, morale:Math.max(h.morale, 75)}));
      addLog(`🎉 The squad's spirits are high — everyone starts the new tier with at least 75 morale.`,"success");
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
      addLog(`🏪 The mercenary pool has refreshed with ${TIERS[newTierId].name}-tier talent.`,"info");
    }

    // Generate first opponent for new season
    setScheduledOpponent(generateScheduledOpponent(1, newLeagueTable, newTierTowns, newTierId));
  };

  const filtered=useMemo(()=>{
    let h=[...heroes];
    if(filter.role!=="All")h=h.filter(x=>x.role===filter.role);
    if(filter.race!=="All")h=h.filter(x=>x.race===filter.race);
    if(filter.status==="Fit")h=h.filter(x=>!x.injured);
    if(filter.status==="Injured")h=h.filter(x=>x.injured);
    if(filter.status==="Unhappy")h=h.filter(x=>x.morale<50);
    if(filter.status==="Contract")h=h.filter(x=>(x.contractWeeksLeft||0)<=WEEKS_PER_CONTRACT_YEAR*2);
    if(filter.phase!=="All")h=h.filter(x=>agePhase(x)===filter.phase);
    if(filter.search)h=h.filter(x=>x.name.toLowerCase().includes(filter.search.toLowerCase())||(x.traits||[]).some(t=>t.toLowerCase().includes(filter.search.toLowerCase())));
    const sorts={Value:x=>-x.value,Potential:x=>-x.stats.Potential,Level:x=>-x.level,XP:x=>-x.xp,Stage:x=>stageToCareerWeek(x.stage||"peak",x.stageProgress||0),Morale:x=>x.morale,Contract:x=>(x.contractWeeksLeft||0),Combat:x=>-(STAT_GROUPS.Combat.reduce((a,s)=>a+x.stats[s],0)/STAT_GROUPS.Combat.length),Salary:x=>x.salary};
    if(sorts[filter.sortBy])h.sort((a,b)=>sorts[filter.sortBy](a)-sorts[filter.sortBy](b));
    return h;
  },[heroes,filter]);

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
    { id:"Squad",    icon:"⚔️", label:"Squad",    badge: unhappyCount>0||contractAlerts>0||contractWarnings>0||pendingEventReturns.length>0 },
    { id:"Tactics",  icon:"🎯", label:"Tactics",  badge: false },
    { id:"Battle",   icon:"⚔️", label:"Battle",   badge: !!activeEvent },
    { id:"Dominion", icon:"⚜️", label:"Dominion", badge: false },
    { id:"Town",     icon:"🏰", label:"Town",     badge: false },
    { id:"Hire",     icon:"🤝", label:"Hire",     badge: transferBids.length>0 },
    { id:"Ledger",    icon:"📒", label:"Ledger",   badge: false },
    { id:"Guide",    icon:"📖", label:"Guide",    badge: false },
  ];
  const IS={background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:6,color:"#f0e6d3",padding:"5px 9px",fontSize:11,outline:"none"};
  const STAT_ROWS = [
    ["Gold",          gold.toLocaleString()+"g",                                                         gold<0?"#ff7878":"#ffd966"],
    ["Week",          `${week} · S${season} Wk${seasonWeek}`,                                           "#f0e6d3"],
    ["League",        `${currentTier.icon} ${currentTier.name} · ${currentTierPosition}${['st','nd','rd'][currentTierPosition-1]||'th'} of 8`, currentTier.color],
    ["Tribute",       `+${weeklyRankIncome(playerTier, currentTierPosition).toLocaleString()}g/wk`,     "#a8ff78"],
    ["Mode",          GAME_SPEEDS[gameSpeed]?.label ?? "Grand Dynasty",                                  "#888"],
    ...(ngPlus?.wins ? [["Campaign",`⚔️ Run #${ngPlus.wins+1} · ${ngPlus.earnedBoons?.length||0} options unlocked`,"#ff9f43"]] : []),
    ...(squadLeaderId&&heroes.find(h=>h.id===squadLeaderId) ? [["Leader",`👑 ${heroes.find(h=>h.id===squadLeaderId).name.split(" ")[0]} · ${Math.round(calcLeaderScore(heroes.find(h=>h.id===squadLeaderId))*100)}%`,"#ffd966"]] : []),
    ["Formation",     `${placed}/6 · Rating ${formRating}`,                                             "#78c8ff"],
    ["Wages",         `${wages.toLocaleString()}g/wk`,                                                  "#ff9f43"],
    ["Squad",         `${heroes.filter(h=>!h.retired).length}/${ROSTER_CAP} heroes`,                    heroes.filter(h=>!h.retired).length>=ROSTER_CAP?"#ff9f43":"#f0e6d3"],
    ...(unhappyCount>0   ? [["Unhappy",  `${unhappyCount} hero${unhappyCount>1?"es":""}`, "#ffd966"]] : []),
    ...(contractAlerts>0 ? [["Contracts",`${contractAlerts} expired`,                    "#ff9f43"]] : []),
    ...(contractWarnings>0?[["Expiring", `${contractWarnings} this week`,                "#ffd966"]] : []),
  ];

  if(!setupDone){
    return <SetupScreen onComplete={handleSetupComplete}/>;
  }

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(145deg,#060610 0%,#0a0a1c 60%,#060d14 100%)",color:"#f0e6d3",fontFamily:"'Lato',sans-serif"}}>
      <InjectCSS/>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Lato:wght@300;400;700&display=swap" rel="stylesheet"/>
      <div style={{position:"fixed",inset:0,backgroundImage:"radial-gradient(1px 1px at 12% 20%,rgba(255,255,255,0.18) 0%,transparent 100%),radial-gradient(1px 1px at 68% 50%,rgba(255,255,255,0.13) 0%,transparent 100%),radial-gradient(1px 1px at 38% 78%,rgba(255,255,255,0.1) 0%,transparent 100%)",pointerEvents:"none"}}/>

      <RetirementModal retirees={retirees} heroes={heroes.filter(h=>!h.retired)} formation={formation}
        onDismiss={(mentees)=>{
          if(mentees&&Object.keys(mentees).length>0){
            setHeroes(hs=>hs.map(h=>{
              // Check if this hero was chosen as a mentee
              const retiredId=Object.keys(mentees).find(rid=>mentees[rid]===h.id);
              if(!retiredId) return h;
              const retiree=retirees.find(r=>r.id===retiredId);
              if(!retiree) return h;
              addLog(`🎖️ ${h.name} will be mentored by ${retiree.name} — +10 XP/week for a season.`,"success");
              return {...h, mentorBonus:{mentorName:retiree.name,xpPerWeek:10,weeksLeft:SEASON_LENGTH()}};
            }));
          }
          setRetirees([]);
        }}/>
      <NegotiationModal pending={negotiationQueue} gold={gold} onAccept={handleAccept} onCounter={handleCounter} onReject={handleReject}/>
      {activeSimulation&&<RaidSimulationModal simulation={activeSimulation} enemy={pendingRaidEnemy} onComplete={applyRaidResult}/>}
      {weekSummary&&!activeSimulation&&<WeeklySummary summary={weekSummary} onDismiss={()=>setWeekSummary(null)} townColor={townColor}/>}

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
            window.location.reload();
          }}
        />
      )}
      {activeEvent&&<RandomEventModal event={activeEvent} heroes={heroes} onAccept={acceptEvent} onDecline={declineEvent}/>}
      {activeWanderingMaster&&<WanderingMasterModal event={activeWanderingMaster} heroes={heroes} gold={gold} onAccept={acceptWanderingMaster} onDecline={declineWanderingMaster}/>}

      {/* ── DESKTOP SIDEBAR ── */}
      <div className="rm-sidebar">
        <div className="rm-sidebar-logo">
          <div style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:14,background:"linear-gradient(135deg,#ffd966,#ff9f43)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4,letterSpacing:1}}>⚔️ REALM MANAGER</div>
          <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:16,color:townColor,marginBottom:2}}>{townName}</div>
          <div style={{fontSize:9,color:"#888",letterSpacing:2}}>FANTASY SQUAD SIMULATOR</div>
        </div>
        <div className="rm-sidebar-stats">
          {STAT_ROWS.map(([l,v,c])=>(
            <div key={l} className="rm-stat-row">
              <span className="rm-stat-label">{l}</span>
              <span className="rm-stat-value" style={{color:c}}>{v}</span>
            </div>
          ))}
        </div>

        {signDiscount>0&&<div style={{padding:"6px 10px",fontSize:8,color:"#ffd966",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>🏷️ Next signing: {Math.round(signDiscount*100)}% off</div>}

        <nav className="rm-sidebar-nav">
          {NAV_ITEMS.map(({id,icon,label,badge})=>(
            <button key={id}
              className={`rm-nav-item${tab===id?" active":""}`}
              onClick={()=>setTab(id)}
              style={tab===id?{background:`${townColor}18`,color:townColor}:{}}>
              <span className="rm-nav-icon-wrap">{icon}</span>
              <span>{label}</span>
              {badge&&<span className="rm-nav-badge"/>}
            </button>
          ))}
        </nav>
      </div>

      {/* ── MOBILE TOP BAR ── */}
      <div className="rm-topbar">
        <span className="rm-topbar-title" style={{color:townColor}}>{townName}</span>
        <div className="rm-topbar-chips">
          {[["Gold",gold.toLocaleString()+"g","#ffd966"],[`${currentTier.icon} ${currentTier.name}`,`${currentTierPosition}${['st','nd','rd'][currentTierPosition-1]||'th'}`,currentTier.color],["Tribute",`+${weeklyRankIncome(playerTier,currentTierPosition).toLocaleString()}g`,"#a8ff78"],["Wages",wages+"g","#ff9f43"],["Week",week,"#f0e6d3"]].map(([l,v,c])=>(
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
          <div style={{marginBottom:12,padding:"10px 14px",borderRadius:9,
            background:bankruptcyWeeks>=2?"rgba(255,100,100,0.1)":"rgba(255,159,67,0.08)",
            border:`1px solid ${bankruptcyWeeks>=2?"rgba(255,100,100,0.4)":"rgba(255,159,67,0.3)"}`,
            display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:18}}>{bankruptcyWeeks>=2?"🚨":"⚠️"}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:11,fontWeight:700,color:bankruptcyWeeks>=2?"#ff7878":"#ff9f43",fontFamily:"'Cinzel',serif"}}>
                {bankruptcyWeeks>=2?"FINAL WARNING — ":"BANKRUPTCY WARNING — "}
                {3-bankruptcyWeeks} week{3-bankruptcyWeeks>1?"s":""} remaining
              </div>
              <div style={{fontSize:9,color:"#aaa",marginTop:2}}>
                The realm cannot meet its wage bill. Sell heroes, win raids, or the campaign ends.
              </div>
            </div>
          </div>
        )}

        {/* SQUAD */}
        {tab==="Squad"&&(
          <div>

            {/* Getting Started hint — shown once on week 1 with empty formation, hidden after first win */}
            {!hintDismissed && !ngPlus?.wins && week<=1 && placed===0 && (
              <div style={{marginBottom:14,padding:"14px 16px",borderRadius:10,
                background:"rgba(120,200,255,0.06)",border:"1px solid rgba(120,200,255,0.2)",
                position:"relative"}}>
                <button onClick={()=>setHintDismissed(true)}
                  style={{position:"absolute",top:8,right:10,background:"none",border:"none",
                    cursor:"pointer",color:"#888",fontSize:16,lineHeight:1}}>×</button>
                <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:12,color:"#78c8ff",marginBottom:10}}>
                  ⚔️ Welcome to Realm Manager
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {[
                    {step:"1", label:"Set your formation", sub:"Tactics tab → drag heroes into Vanguard, Skirmisher & Arbiter slots", tab:"Tactics", col:"#a8ff78"},
                    {step:"2", label:"Launch a battle",      sub:"Battle tab → review your opponent, check win chance, then fight",       tab:"Battle",    col:"#ffd966"},
                    {step:"3", label:"Manage your squad",  sub:"Keep heroes happy, renew contracts, watch fatigue after raids",        tab:"Squad",   col:"#a78bfa"},
                  ].map(({step,label,sub,tab:target,col})=>(
                    <div key={step} onClick={()=>setTab(target)}
                      style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",
                        borderRadius:7,background:"rgba(255,255,255,0.03)",
                        border:"1px solid rgba(255,255,255,0.07)",cursor:"pointer",
                        transition:"background 0.15s"}}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.06)"}
                      onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}>
                      <div style={{width:22,height:22,borderRadius:"50%",background:`${col}22`,
                        border:`1px solid ${col}55`,display:"flex",alignItems:"center",
                        justifyContent:"center",flexShrink:0}}>
                        <span style={{fontSize:10,fontWeight:700,color:col}}>{step}</span>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11,fontWeight:700,color:col}}>{label}</div>
                        <div style={{fontSize:9,color:"#999",marginTop:1}}>{sub}</div>
                      </div>
                      <span style={{fontSize:10,color:"#888"}}>→</span>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <button onClick={()=>{setTab("Guide");setHintDismissed(true);}}
                    style={{background:"none",border:"none",cursor:"pointer",color:"#78c8ff",fontSize:10,padding:0,textDecoration:"underline"}}>
                    📖 Full How to Play guide
                  </button>
                  <span style={{fontSize:9,color:"#888"}}>Dismiss with ×</span>
                </div>
              </div>
            )}
            {(unhappyCount>0||contractAlerts>0||contractWarnings>0)&&(
              <div style={{marginBottom:12,padding:"10px 14px",background:"rgba(255,159,67,0.07)",borderRadius:9,border:"1px solid rgba(255,159,67,0.2)",display:"flex",gap:16,flexWrap:"wrap",fontSize:11}}>
                {contractAlerts>0&&<span style={{color:"#ff9f43"}}>📜 {contractAlerts} contract{contractAlerts>1?"s":""} expired — renewal required</span>}
                {contractWarnings>0&&<span style={{color:"#ffd966"}}>⏰ {contractWarnings} contract{contractWarnings>1?"s":""} expiring this week — prepare gold</span>}
                {unhappyCount>0&&<span style={{color:"#ffd966"}}>😟 {unhappyCount} low morale</span>}
              </div>
            )}

            {/* ── WANDERING MASTER BANNER ──────────────────────────────── */}
            {activeWanderingMaster&&(
              <div style={{marginBottom:10,padding:"12px 14px",borderRadius:10,
                background:"rgba(167,139,250,0.07)",border:"1px solid rgba(167,139,250,0.35)",
                display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:22}}>🧙</span>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:12,color:"#a78bfa"}}>
                    The Wandering Master has arrived
                  </div>
                  <div style={{fontSize:10,color:"#aaa",marginTop:2}}>
                    For {activeWanderingMaster.cost}g, they will train one of your heroes — permanently raising a stat of your choice beyond their natural ceiling.
                  </div>
                </div>
                <button onClick={()=>setActiveWanderingMaster(SPECIAL_EVENTS.find(e=>e.id==="wandering_master"))}
                  style={{padding:"7px 12px",borderRadius:7,border:"none",cursor:"pointer",
                    background:"rgba(167,139,250,0.2)",color:"#a78bfa",
                    fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:10,whiteSpace:"nowrap"}}>
                  Meet them →
                </button>
              </div>
            )}

            {/* ── EVENT RETURN BANNERS ───────────────────────────────────── */}
            {pendingEventReturns.map(ret=>{
              const outcomeColor = ret.outcome==="success" ? "#a8ff78" : ret.outcome==="partial" ? "#ffd966" : "#ff7878";
              const outcomeIcon  = ret.outcome==="success" ? "✅" : ret.outcome==="partial" ? "🟡" : "❌";
              const outcomeLbl   = ret.outcome==="success" ? "Success" : ret.outcome==="partial" ? "Partial" : "Failed";
              const themeIcons   = { arena:"⚔️", wilds:"🌿", courts:"👑", arcane:"🔮", shadows:"🌑" };
              return(
                <div key={ret.id} style={{marginBottom:10,padding:"12px 14px",borderRadius:10,
                  background:`${outcomeColor}0d`,border:`1px solid ${outcomeColor}33`,
                  position:"relative"}}>
                  <button onClick={()=>setPendingEventReturns(prev=>prev.filter(r=>r.id!==ret.id))}
                    style={{position:"absolute",top:8,right:10,background:"none",border:"none",
                      cursor:"pointer",color:"#888",fontSize:16,lineHeight:1}}>×</button>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    <span style={{fontSize:18}}>{ret.heroIcon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:12,color:"#f0e6d3"}}>
                        {ret.heroName} has returned
                      </div>
                      <div style={{fontSize:10,color:"#888"}}>
                        {themeIcons[ret.eventTheme]||"✨"} {ret.eventTitle}
                      </div>
                    </div>
                    <div style={{padding:"3px 8px",borderRadius:6,background:`${outcomeColor}18`,
                      border:`1px solid ${outcomeColor}44`,fontSize:10,fontWeight:700,color:outcomeColor}}>
                      {outcomeIcon} {outcomeLbl}
                    </div>
                  </div>
                  {ret.goldGain>0&&(
                    <div style={{fontSize:11,color:"#ffd966",marginBottom:4}}>
                      💰 +{ret.goldGain.toLocaleString()}g
                    </div>
                  )}
                  {ret.notifications.length>0&&(
                    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                      {ret.notifications.map((n,i)=>(
                        <span key={i} style={{fontSize:10,color:outcomeColor,
                          background:`${outcomeColor}10`,padding:"2px 7px",borderRadius:5,
                          border:`1px solid ${outcomeColor}30`}}>
                          {n}
                        </span>
                      ))}
                    </div>
                  )}
                  {ret.outcome==="failure"&&ret.notifications.length===0&&(
                    <div style={{fontSize:10,color:"#888"}}>Returned empty-handed. No lasting harm done.</div>
                  )}
                  {ret.pendingStatChoice&&(
                    <div style={{marginTop:8}}>
                      <div style={{fontSize:10,color:"#a78bfa",fontWeight:700,marginBottom:5}}>
                        🔮 Choose a stat to boost:
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
                            addLog(`🔮 Oracle's gift: ${ret.heroName} +${actual} ${s}!`,"success");
                            setPendingEventReturns(prev=>prev.map(r=>r.id===ret.id?{...r,pendingStatChoice:false,notifications:[...r.notifications,`+${actual} ${s}`]}:r));
                          }}
                            style={{padding:"3px 8px",borderRadius:6,border:"1px solid rgba(167,139,250,0.3)",
                              background:"rgba(167,139,250,0.08)",color:"#a78bfa",cursor:"pointer",fontSize:9}}>
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
                <div style={{marginBottom:12,borderRadius:9,overflow:"hidden",border:`1px solid ${rs.color}33`}}>
                  <div style={{padding:"8px 12px",background:`${rs.color}0a`,borderBottom:`1px solid ${rs.color}22`,display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:14}}>{rs.icon}</span>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:11,fontWeight:700,color:rs.color}}>{rs.name}</div>
                    <div style={{fontSize:9,color:"#a8ff78",marginLeft:"auto"}}>✓ Active · ×{rs.ratingMult}</div>
                  </div>
                </div>
              );
            })()}
            <div className="rm-filter-bar" style={{marginBottom:12}}>
              <input placeholder="Search name/trait…" value={filter.search} onChange={e=>setFilter(f=>({...f,search:e.target.value}))} style={{...IS,width:155,minWidth:0,maxWidth:"100%"}}/>
              <select value={filter.role} onChange={e=>setFilter(f=>({...f,role:e.target.value}))} style={IS}><option>All</option>{ROLES.map(r=><option key={r}>{r}</option>)}</select>
              <select value={filter.race} onChange={e=>setFilter(f=>({...f,race:e.target.value}))} style={IS}><option>All</option>{["Human","Elf","Dwarf","Half-Orc","Gnome","Tiefling","Dragonborn"].map(r=><option key={r}>{r}</option>)}</select>
              <select value={filter.phase} onChange={e=>setFilter(f=>({...f,phase:e.target.value}))} style={IS}><option value="All">All Stages</option>{["prospect","rising","peak","fading","veteran"].map(p=><option key={p} value={p}>{agePhaseLabel(p)}</option>)}</select>
              <select value={filter.status} onChange={e=>setFilter(f=>({...f,status:e.target.value}))} style={IS}>{["All","Fit","Injured","Unhappy","Contract"].map(v=><option key={v}>{v}</option>)}</select>
              <select value={filter.sortBy} onChange={e=>setFilter(f=>({...f,sortBy:e.target.value}))} style={IS}>
                {["Value","Level","XP","Stage","Morale","Contract","Combat","Salary",...(showHiddenStats?["Potential"]:[])].map(s=><option key={s}>{s}</option>)}
              </select>
              <span style={{fontSize:10,color:"#888",flexShrink:0}}>{filtered.length} shown</span>
            </div>
            <div className="rm-card-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:7}}>
              {filtered.map(h=><HeroCard key={h.id} hero={h} selected={false} isListed={listedHeroIds.has(h.id)} hasBid={transferBids.some(b=>b.heroId===h.id)} isLeader={squadLeaderId===h.id} showHiddenStats={showHiddenStats} onClick={()=>{setDetailHero(h);setPrevStats(null);}}/>)}
            </div>
          </div>
        )}

        {/* TACTICS */}
        {tab==="Tactics"&&<TacticsTab heroes={heroes} formation={formation} setFormation={setFormation}/>}

        {/* DOMINION */}
        {tab==="Dominion"&&<DominionTab season={season} seasonWeek={seasonWeek} trophies={trophies} weeklyIncome={weeklyRankIncome(playerTier,currentTierPosition)} playerTier={playerTier} tierPosition={currentTierPosition} tierEnemyTowns={tierEnemyTowns} townName={townName} townColor={townColor} formRating={formRating} leagueTable={leagueTable} playerRecord={playerRecord} matchLog={matchLog} hallOfFame={hallOfFame}/>}

        {/* RAID */}
        {tab==="Battle"&&(
          <div className="rm-two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>

            {/* ── THE CHALLENGE BANNER ───────────────────────────────────── */}
            {pendingChallenge&&(
              <div style={{gridColumn:"1/-1",marginBottom:4,padding:"14px 16px",borderRadius:10,
                background:"rgba(255,159,67,0.07)",border:"1px solid rgba(255,159,67,0.35)",
                display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <span style={{fontSize:24}}>⚔️</span>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:13,color:"#ff9f43",marginBottom:2}}>
                    A Formal Challenge
                  </div>
                  <div style={{fontSize:11,color:"#aaa",lineHeight:1.5}}>
                    A rival lord demands satisfaction. Accept and face a stronger opponent — but the gold and XP on offer are double. Decline and your squad's nerve will be tested.
                  </div>
                  <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap",fontSize:10}}>
                    <span style={{color:"#ff7878"}}>⚠️ Opponent +{Math.round((pendingChallenge.opponentPowerMult-1)*100)}% stronger</span>
                    <span style={{color:"#a8ff78"}}>💰 Rewards ×{pendingChallenge.rewardMult}</span>
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  <button onClick={startBattle}
                    style={{padding:"8px 16px",borderRadius:7,border:"none",cursor:"pointer",
                      background:"linear-gradient(135deg,#ff9f43,#ffd966)",color:"#0d0d1a",
                      fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:11,whiteSpace:"nowrap"}}>
                    ⚔️ Accept
                  </button>
                  <button onClick={declineChallenge}
                    style={{padding:"8px 16px",borderRadius:7,border:"1px solid rgba(255,255,255,0.12)",
                      cursor:"pointer",background:"rgba(255,255,255,0.03)",color:"#888",
                      fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:11,whiteSpace:"nowrap"}}>
                    Decline
                  </button>
                </div>
              </div>
            )}

            {/* LEFT: Visual formation preview */}
            <div>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:13,color:"#a78bfa",marginBottom:10,fontWeight:700}}>Your Formation</div>
              {placed===0&&<div style={{padding:12,background:"rgba(255,100,100,0.07)",borderRadius:9,border:"1px solid rgba(255,100,100,0.2)",fontSize:12,color:"#ff7878",marginBottom:10}}>⚠️ No heroes assigned. Set formation in <strong>Tactics</strong> first.</div>}

              {/* 3-lane visual */}
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:10}}>
                {POS_KEYS.map(pos=>{
                  const pd=POSITIONS[pos];
                  const assigned=(formation[pos]||[]).filter(Boolean);
                  // Specialisation check for this position
                  const spec=scheduledOpponent?.specialisation;
                  const specPen=spec?calcSpecPenalty(spec,formation):null;
                  const posWarning=specPen&&(
                    (spec.id==="heavy_vanguard"&&pos==="Vanguard")||
                    (spec.id==="swift_flankers"&&pos==="Skirmisher")||
                    (spec.id==="arcane_command"&&pos==="Arbiter")||
                    (spec.id==="berserker_rush")||
                    (spec.id==="iron_defence")
                  );
                  return(
                    <div key={pos} style={{borderRadius:10,overflow:"hidden",border:`1px solid ${posWarning?"rgba(255,159,67,0.4)":pd.color+"33"}`,background:posWarning?"rgba(255,159,67,0.04)":"rgba(255,255,255,0.02)"}}>
                      {/* Position header */}
                      {(()=>{
                        const ps = calcPositionScore(assigned, pos);
                        const hasPairing = ps.pairingMult > 1.0 || ps.raceMult !== 1.0;
                        const hasBonus = ps.pairingMult > 1.0 || ps.raceMult > 1.0;
                        const pwrCol = ps.score>=60?"#a8ff78":ps.score>=35?"#78c8ff":ps.score>0?"#ffd966":"#555";
                        return(
                          <div style={{padding:"6px 10px",background:`${pd.color}14`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                            <span style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:11,color:pd.color}}>{pd.icon} {pd.label}</span>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              {ps.primaryHero&&<span style={{fontSize:8,color:"#a8ff78"}}>▲{ps.primaryHero.name.split(" ")[0]}</span>}
                              {ps.supportHero&&<span style={{fontSize:8,color:"#888"}}>▼{ps.supportHero.name.split(" ")[0]}</span>}
                              {assigned.length>0&&<span style={{fontSize:10,fontWeight:700,color:pwrCol}}>PWR {Math.round(ps.score)}{hasBonus?" ✦":hasPairing?" ✗":""}</span>}
                              {posWarning&&<span style={{fontSize:9,color:"#ff9f43"}}>⚠️ Spec</span>}
                              {!posWarning&&spec&&<span style={{fontSize:9,color:"#a8ff78"}}>✓</span>}
                            </div>
                          </div>
                        );
                      })()}
                      {/* Hero chips */}
                      <div style={{padding:"6px 8px",display:"flex",gap:6,flexWrap:"wrap"}}>
                        {assigned.length===0?(
                          <div style={{fontSize:10,color:"#888",padding:"4px 0"}}>Empty slot</div>
                        ):assigned.map(h=>{
                          const fit=formAnalysis.heroMods[h.id];
                          const fitCol=fit?.fit==="ideal"?"#a8ff78":fit?.fit==="penalty"?"#ff7878":"#888";
                          const pwr=Math.round(calcHeroCombatScore(h,pos));
                          const {color:fatCol}=fatigueLabel(h.fatigue||0);
                          const pwrCol=pwr>=40?"#a8ff78":pwr>=25?"#78c8ff":"#ffd966";
                          return(
                            <div key={h.id} style={{flex:1,minWidth:0,padding:"7px 9px",borderRadius:8,background:"rgba(0,0,0,0.3)",border:`1px solid ${fitCol}33`}}>
                              <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
                                <span style={{fontSize:15}}>{RACE_ICONS[h.race]}</span>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontSize:11,fontWeight:700,fontFamily:"'Cinzel',serif",color:"#f0e6d3",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.name}</div>
                                  <div style={{fontSize:9,color:"#999"}}>{h.role} · Lv {h.level}</div>
                                </div>
                              </div>
                              <div style={{display:"flex",gap:4}}>
                                <div style={{flex:1,background:"rgba(255,255,255,0.04)",borderRadius:4,padding:"3px 0",textAlign:"center"}}>
                                  <div style={{fontSize:8,color:"#888"}}>PWR</div>
                                  <div style={{fontSize:13,fontWeight:900,color:pwrCol,lineHeight:1}}>{pwr}</div>
                                </div>
                                <div style={{flex:1,background:"rgba(255,255,255,0.04)",borderRadius:4,padding:"3px 0",textAlign:"center"}}>
                                  <div style={{fontSize:8,color:"#888"}}>FAT</div>
                                  <div style={{fontSize:13,fontWeight:900,color:fatCol,lineHeight:1}}>{h.fatigue||0}</div>
                                </div>
                                <div style={{flex:1,background:"rgba(255,255,255,0.04)",borderRadius:4,padding:"3px 0",textAlign:"center"}}>
                                  <div style={{fontSize:8,color:fitCol}}>FIT</div>
                                  <div style={{fontSize:9,fontWeight:700,color:fitCol,lineHeight:1.2}}>{fit?.fit==="ideal"?"✓":fit?.fit==="penalty"?"✗":"—"}</div>
                                </div>
                              </div>
                              {h.injured&&<div style={{fontSize:8,color:"#ff7878",marginTop:3}}>🩸 Injured</div>}
                              {(h.fatigue||0)>=FATIGUE_WARN&&<div style={{fontSize:8,color:fatCol,marginTop:3}}>⚡ {fatigueLabel(h.fatigue||0).label}</div>}
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
                <div style={{padding:"9px 12px",background:"rgba(255,255,255,0.02)",borderRadius:9,border:"1px solid rgba(255,255,255,0.06)"}}>
                  <div style={{fontSize:10,fontWeight:700,color:"#f0e6d3",marginBottom:4,fontFamily:"'Cinzel',serif"}}>Active Synergies</div>
                  {formAnalysis.active.map(s=><div key={s.id} style={{fontSize:10,color:s.negative?"#ff7878":"#a8ff78",marginBottom:2}}>{s.icon} {s.name} ×{s.ratingMult}</div>)}
                  <div style={{marginTop:5,fontSize:12,fontWeight:700,color:"#78c8ff"}}>⚡ Effective Rating: {formRating}</div>
                </div>
              )}
              {formAnalysis.active.length===0&&placed>0&&(
                <div style={{padding:"9px 12px",background:"rgba(255,255,255,0.02)",borderRadius:9,border:"1px solid rgba(255,255,255,0.06)"}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#78c8ff"}}>⚡ Effective Rating: {formRating}</div>
                  <div style={{fontSize:10,color:"#888",marginTop:2}}>No synergies active</div>
                </div>
              )}
            </div>

            {/* RIGHT: This week's scheduled opponent */}
            <div>
              {/* Active event banner */}
              {activeEvent&&(
                <div style={{padding:"12px 14px",borderRadius:10,background:"rgba(255,215,0,0.07)",border:"1px solid rgba(255,215,0,0.3)",marginBottom:14,cursor:"pointer"}}
                  onClick={()=>{}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <span style={{fontSize:20}}>{activeEvent.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:12,color:"#ffd966"}}>✨ Special Event Available</div>
                      <div style={{fontSize:11,color:"#f0e6d3"}}>{activeEvent.title}</div>
                    </div>
                    <div style={{fontSize:10,color:"#a8ff78",fontWeight:700}}>{activeEvent.rewardDesc}</div>
                  </div>
                  <div style={{fontSize:10,color:"#888",marginBottom:8}}>{activeEvent.desc}</div>
                  <div style={{fontSize:10,color:"#999"}}>Requires: {activeEvent.requires.map(r=>`${r.stat} ≥ ${r.min}`).join(" + ")} · {activeEvent.heroesNeeded} hero{activeEvent.heroesNeeded>1?"es":""}</div>
                  <div style={{marginTop:8,padding:"6px 10px",borderRadius:6,background:"rgba(255,215,0,0.1)",border:"1px solid rgba(255,215,0,0.2)",fontSize:10,color:"#ffd966",textAlign:"center",fontWeight:700}}>
                    ↑ The event modal opened automatically — check above this screen
                  </div>
                </div>
              )}

              <div style={{fontFamily:"'Cinzel',serif",fontSize:13,color:legendaryChallenger?"#ff7878":"#ff9f43",marginBottom:10,fontWeight:700}}>
                {legendaryChallenger?"⚔️ Legendary Challenge":"This Week's Opponent"}
              </div>

              {/* Legendary challenger banner */}
              {legendaryChallenger&&(
                <div style={{padding:"12px 14px",borderRadius:10,background:"rgba(255,50,50,0.07)",border:"1px solid rgba(255,100,100,0.35)",marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                    <span style={{fontSize:26}}>{legendaryChallenger.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:15,color:"#ff7878"}}>{legendaryChallenger.name}</div>
                      <div style={{fontSize:10,color:"#888"}}>Power {legendaryChallenger.power} · {"★".repeat(6)} · Legendary</div>
                    </div>
                  </div>
                  <div style={{fontSize:10,color:"#999",fontStyle:"italic",marginBottom:8}}>"{legendaryChallenger.flavour}"</div>
                  <div style={{display:"flex",gap:8}}>
                    <div style={{flex:1,padding:"6px 8px",borderRadius:6,background:"rgba(255,215,0,0.06)",border:"1px solid rgba(255,215,0,0.15)",textAlign:"center"}}>
                      <div style={{fontSize:9,color:"#888"}}>Win reward</div>
                      <div style={{fontSize:13,fontWeight:700,color:"#ffd966"}}>{legendaryChallenger.goldReward?.toLocaleString()}g</div>
                    </div>
                    <div style={{flex:1,padding:"6px 8px",borderRadius:6,background:"rgba(167,139,250,0.06)",border:"1px solid rgba(167,139,250,0.15)",textAlign:"center"}}>
                      <div style={{fontSize:9,color:"#888"}}>Renown</div>
                      <div style={{fontSize:13,fontWeight:700,color:"#a78bfa"}}>+{legendaryChallenger.renownReward}</div>
                    </div>
                    <div style={{flex:1,padding:"6px 8px",borderRadius:6,background:"rgba(255,100,100,0.06)",border:"1px solid rgba(255,100,100,0.15)",textAlign:"center"}}>
                      <div style={{fontSize:9,color:"#888"}}>Rank impact</div>
                      <div style={{fontSize:11,fontWeight:700,color:"#a8ff78"}}>Exhibition</div>
                    </div>
                  </div>
                </div>
              )}

              {scheduledOpponent?(()=>{
                const opp=scheduledOpponent;
                const spec=opp.specialisation;
                const pen=calcSpecPenalty(spec,formation);
                const adjPower = pen
                  ? Math.round(opp.power*(1+pen.penalty))
                  : Math.round(opp.power);
                const posShare = adjPower/3;
                const k=2.0;
                const PCAP=0.77, PFLOOR=0.27;
                const posChances={};
                const posScoresPreview={};
                const previewSynergyMult = Math.min(1.5, Math.max(0.3, formAnalysis.mult));
                POS_KEYS.forEach(pos=>{
                  const posHeroes=(formation[pos]||[]).filter(Boolean);
                  const ps = calcPositionScore(posHeroes, pos);
                  posScoresPreview[pos] = ps;
                  const effectiveScore = ps.score * previewSynergyMult;
                  const ratio=effectiveScore>0?posShare/effectiveScore:999;
                  const raw=1/(1+Math.pow(ratio,k));
                  posChances[pos]=Math.min(PCAP,Math.max(PFLOOR,placed>=3?raw:PFLOOR));
                });
                const pa=posChances.Vanguard,pb=posChances.Skirmisher,pc=posChances.Arbiter;
                const overallWC=pa*pb*pc+pa*pb*(1-pc)+pa*(1-pb)*pc+(1-pa)*pb*pc;
                const wcCol=overallWC>=0.6?"#a8ff78":overallWC>=0.45?"#ffd966":overallWC>=0.25?"#ff9f43":"#ff7878";
                const oppStars = calcRelativeStars(opp.power, playerTier);
                const oppStarCol = starsColor(oppStars);
                return(
                  <>
                    {/* Opponent card */}
                    <div style={{padding:"14px 16px",background:"rgba(255,159,67,0.06)",borderRadius:10,border:"1px solid rgba(255,159,67,0.25)",marginBottom:12}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                        <span style={{fontSize:28}}>{spec.icon}</span>
                        <div style={{flex:1}}>
                          <div style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:16,color:"#f0e6d3"}}>{opp.name}</div>
                          <div style={{fontSize:10,color:oppStarCol}}>{renderStars(oppStars)}
                            <span style={{color:"#888",marginLeft:6}}>Power {opp.power}</span>
                          </div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:22,fontWeight:900,color:wcCol}}>{Math.round(overallWC*100)}%</div>
                          <div style={{fontSize:9,color:"#999"}}>overall win</div>
                        </div>
                      </div>

                      {/* Per-phase win chances + position power */}
                      <div style={{display:"flex",gap:5,marginBottom:10}}>
                        {[
                          {pos:"Vanguard",   icon:"🗡️",label:"VAN"},
                          {pos:"Skirmisher", icon:"🏹",label:"SKR"},
                          {pos:"Arbiter",    icon:"✨",label:"ARB"},
                        ].map(({pos,icon,label})=>{
                          const p=posChances[pos];
                          const ps=posScoresPreview[pos];
                          const col=p>=0.65?"#a8ff78":p>=0.45?"#ffd966":p>=0.30?"#ff9f43":"#ff7878";
                          const hasPairing = ps.pairingMult > 1.0 || ps.raceMult !== 1.0;
                          const hasBonus = ps.pairingMult > 1.0 || ps.raceMult > 1.0;
                          return(
                            <div key={pos} style={{flex:1,padding:"6px 4px",borderRadius:7,background:"rgba(255,255,255,0.03)",border:`1px solid ${col}33`,textAlign:"center"}}>
                              <div style={{fontSize:10}}>{icon}{hasBonus?" ✦":hasPairing?" ✗":""}</div>
                              <div style={{fontSize:9,color:"#999"}}>{label}</div>
                              <div style={{fontSize:12,fontWeight:700,color:col}}>{Math.round(p*100)}%</div>
                              {ps.primaryHero&&<div style={{fontSize:7,color:"#a8ff78",marginTop:2}}>▲ {ps.primaryHero.name.split(" ")[0]}</div>}
                              {ps.supportHero&&<div style={{fontSize:7,color:"#888",marginTop:0}}>▼ {ps.supportHero.name.split(" ")[0]}</div>}
                            </div>
                          );
                        })}
                      </div>
                      <div style={{fontSize:9,color:"#888",textAlign:"center",marginBottom:10}}>Win 2 of 3 phases to win the battle</div>

                      {/* Specialisation */}
                      {(()=>{
                        const penCol=pen?"#ff9f43":"#a8ff78";
                        return(
                          <div style={{padding:"8px 10px",background:"rgba(255,255,255,0.04)",borderRadius:7,border:`1px solid ${penCol}33`,marginBottom:8}}>
                            <div style={{fontSize:10,fontWeight:700,color:diffCol,marginBottom:3}}>{spec.icon} {spec.label}</div>
                            <div style={{fontSize:10,color:"#888",lineHeight:1.5,marginBottom:5}}>{spec.desc}</div>
                            {pen?(
                              <div style={{padding:"5px 8px",borderRadius:6,background:"rgba(255,100,100,0.08)",border:"1px solid rgba(255,100,100,0.2)"}}>
                                <div style={{fontSize:10,color:"#ff9f43",fontWeight:700}}>⚠️ Not countered — Enemy power +{Math.round(pen.penalty*100)}%</div>
                                <div style={{fontSize:9,color:"#888",marginTop:2}}>{pen.reason}</div>
                                <div style={{fontSize:9,color:"#78c8ff",marginTop:2}}>Fix: {spec.counter}</div>
                              </div>
                            ):(
                              <div style={{padding:"5px 8px",borderRadius:6,background:"rgba(168,255,120,0.07)",border:"1px solid rgba(168,255,120,0.2)"}}>
                                <div style={{fontSize:10,color:"#a8ff78",fontWeight:700}}>✓ Countered — No power penalty</div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Enemy abilities */}
                      {(opp.abilities||[]).length>0&&(
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
                            const outcomeCol = outcome==='pass'?'#a8ff78':outcome==='soft'?'#ff9f43':'#ff7878';
                            const outcomeLabel = outcome==='pass'?'✓ Mitigated':outcome==='soft'?'⚠️ Partial':'✗ Full effect';
                            const effectText = outcome==='pass'?'No effect.':outcome==='soft'?ability.softDesc():ability.hardDesc();
                            return(
                              <div key={ability.id} style={{padding:"8px 10px",background:"rgba(255,255,255,0.03)",borderRadius:7,border:`1px solid ${outcomeCol}33`,marginBottom:6}}>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                                  <span style={{fontSize:10,fontWeight:700,color:"#f0e6d3"}}>{ability.icon} {ability.name}</span>
                                  <span style={{fontSize:9,fontWeight:700,color:outcomeCol}}>{outcomeLabel}</span>
                                </div>
                                <div style={{fontSize:9,color:"#888",marginBottom:4}}>{ability.desc}</div>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                  <div style={{fontSize:9,color:"#999"}}>
                                    Checks <b style={{color:"#78c8ff"}}>{ability.stat}</b>
                                    {' '}({ability.scope==='squad'?'squad avg':ability.scope+' avg'})
                                    {' — '}your avg: <b style={{color:outcomeCol}}>{avg}</b>
                                    {' / '}pass: <b style={{color:"#a8ff78"}}>{t.pass}</b>
                                  </div>
                                </div>
                                {outcome!=='pass'&&(
                                  <div style={{marginTop:4,padding:"4px 6px",borderRadius:5,background:`${outcomeCol}10`,border:`1px solid ${outcomeCol}33`}}>
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
                        <div style={{flex:1,background:"rgba(255,215,0,0.06)",borderRadius:6,padding:"6px 8px",border:"1px solid rgba(255,215,0,0.12)"}}>
                          <div style={{fontSize:9,color:"#888"}}>Win reward</div>
                          <div style={{fontSize:13,fontWeight:700,color:"#ffd966"}}>+{opp.goldReward}g</div>
                        </div>
                        <div style={{flex:1,background:"rgba(167,139,250,0.06)",borderRadius:6,padding:"6px 8px",border:"1px solid rgba(167,139,250,0.12)"}}>
                          <div style={{fontSize:9,color:"#888"}}>Renown</div>
                          <div style={{fontSize:13,fontWeight:700,color:"#a78bfa"}}>+{opp.renownReward}</div>
                        </div>
                        <div style={{flex:1,background:"rgba(255,100,100,0.05)",borderRadius:6,padding:"6px 8px",border:"1px solid rgba(255,100,100,0.1)"}}>
                          <div style={{fontSize:9,color:"#888"}}>Loss</div>
                          <div style={{fontSize:13,fontWeight:700,color:"#888"}}>+0g</div>
                        </div>
                      </div>
                    </div>

                    {/* Formation vs opponent summary */}
                    {(()=>{
                      const pen=calcSpecPenalty(spec,formation);
                      const adjPow=pen?Math.round(opp.power*(1+pen.penalty)):opp.power;
                      const wcAdj=calcWinChance(placed>=3?formRating:0,opp.difficulty,adjPow);
                      const wcAdjCol=wcAdj>=0.6?"#a8ff78":wcAdj>=0.45?"#ffd966":wcAdj>=0.25?"#ff9f43":"#ff7878";
                      return(
                        <div style={{padding:10,background:"rgba(167,139,250,0.05)",borderRadius:8,border:"1px solid rgba(167,139,250,0.1)",marginBottom:10}}>
                          <div style={{fontSize:11,color:"#a78bfa",marginBottom:4}}>📊 Match Preview</div>
                          <div style={{fontSize:11,color:"#999"}}>
                            Rating <b style={{color:"#78c8ff"}}>{formRating}</b> vs {pen?<><b style={{color:"#ff9f43"}}>{adjPow}</b><span style={{fontSize:9,color:"#888"}}> (base {opp.power} +{Math.round(pen.penalty*100)}%)</span></>:<b style={{color:diffCol}}>{opp.power}</b>}
                          </div>
                          <div style={{fontSize:12,fontWeight:700,color:wcAdjCol,marginTop:3}}>{Math.round(wcAdj*100)}% win chance{pen?" (with spec penalty)":""}</div>
                          {formAnalysis.positive.length>0&&<div style={{fontSize:10,color:"#a8ff78",marginTop:2}}>✓ {formAnalysis.positive.map(s=>s.name).join(", ")}</div>}
                          {formAnalysis.negative.length>0&&<div style={{fontSize:10,color:"#ff7878",marginTop:2}}>⚠️ {formAnalysis.negative.map(s=>s.name).join(", ")}</div>}
                          {formAnalysis.raceSynergy&&<div style={{fontSize:10,marginTop:2}}><span style={{color:formAnalysis.raceSynergy.color}}>{formAnalysis.raceSynergy.icon} {formAnalysis.raceSynergy.name}</span><span style={{color:"#999"}}> ×{formAnalysis.raceSynergy.ratingMult}</span></div>}
                          <div style={{fontSize:10,color:"#888",marginTop:2}}>Wages due: {wages}g · Tribute: +{weeklyRankIncome(playerTier,currentTierPosition)}g</div>
                        </div>
                      );
                    })()}

                    <button onClick={startBattle} style={{width:"100%",padding:"13px 0",borderRadius:7,border:"none",cursor:"pointer",background:"linear-gradient(135deg,#ff9f43,#ffd966)",color:"#0d0d1a",fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:14}}>⚔️ GO TO BATTLE</button>

                    {missionResult&&(
                      <div style={{marginTop:10,padding:"8px 12px",background:"rgba(255,255,255,0.02)",borderRadius:9,border:"1px solid rgba(255,255,255,0.06)",fontSize:10,color:"#999"}}>
                        <span style={{color:missionResult.won?"#a8ff78":"#ff7878",fontWeight:700,marginRight:8}}>{missionResult.won?"🏆 Last battle: Victory":"💀 Last battle: Defeat"}</span>
                        {missionResult.goldSwing>=0?"+":""}{missionResult.goldSwing.toLocaleString()}g · +{missionResult.heroXP} XP{levelUps.length>0&&` · ${levelUps.length} level-up(s)`}
                      </div>
                    )}
                  </>
                );
              })():(
                <div style={{fontSize:12,color:"#888",padding:14}}>Loading this week's opponent…</div>
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
            <div style={{marginBottom:18,padding:"14px 16px",background:"rgba(255,255,255,0.02)",borderRadius:10,border:`1px solid ${currentTier.color}22`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div>
                  <div style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:15,color:currentTier.color}}>{currentTier.icon} {currentTier.name} League</div>
                  <div style={{fontSize:10,color:"#999",marginTop:2}}>Buildings unlock as you promote through tiers</div>
                </div>
                {nextTierData&&(
                  <div style={{textAlign:"right",padding:"6px 10px",background:"rgba(255,255,255,0.03)",borderRadius:7,border:"1px solid rgba(255,255,255,0.07)"}}>
                    <div style={{fontSize:9,color:"#888",marginBottom:2}}>Promote to {nextTierData.icon} {nextTierData.name} to unlock</div>
                    <div style={{fontSize:10,color:nextTierData.color,fontWeight:700}}>
                      {BUILDINGS.filter(b=>b.tierRequired===nextTierId).map(b=>b.name).join(", ")||"Elite heroes"}
                    </div>
                  </div>
                )}
                {!nextTierData&&<div style={{fontSize:10,color:currentTier.color}}>✨ All buildings unlocked</div>}
              </div>
              <div style={{display:"flex",gap:4,marginTop:8,flexWrap:"wrap"}}>
                {TIER_ORDER.map(tid=>{
                  const t=TIERS[tid];
                  const reached=TIER_ORDER.indexOf(tid)<=tierIdx;
                  return(
                    <div key={tid} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:6,
                      background:reached?`${t.color}18`:"rgba(255,255,255,0.02)",
                      border:`1px solid ${reached?t.color+"44":"rgba(255,255,255,0.06)"}`}}>
                      <span style={{fontSize:10}}>{t.icon}</span>
                      <span style={{fontSize:9,color:reached?t.color:"#888",fontWeight:reached?700:400}}>{t.name}</span>
                      {reached&&<span style={{fontSize:8,color:t.color}}>✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Buildings grouped by tier */}
            <div style={{marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:14,fontWeight:700,color:"#a8ff78"}}>🏰 Town Upgrades</div>
              <div style={{fontSize:11,color:"#888"}}>Treasury: <b style={{color:"#ffd966"}}>{gold.toLocaleString()}g</b></div>
            </div>

            <div className="rm-card-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:9}}>
              {buildings.map(b=>{
                const bTierIdx = TIER_ORDER.indexOf(b.tierRequired||"iron");
                const unlocked = bTierIdx <= tierIdx;
                const canAfford = gold >= b.cost;
                const bTier = TIERS[b.tierRequired||"iron"];
                return(
                  <div key={b.id} style={{
                    background:b.built?"rgba(168,255,120,0.05)":unlocked?"rgba(255,255,255,0.025)":"rgba(255,255,255,0.01)",
                    border:`1px solid ${b.built?"rgba(168,255,120,0.18)":unlocked?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.03)"}`,
                    borderRadius:9,padding:13,opacity:unlocked?1:0.55,
                    position:"relative",overflow:"hidden",
                  }}>
                    {!unlocked&&(
                      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.55)",zIndex:2,borderRadius:9,gap:4}}>
                        <div style={{fontSize:20}}>🔒</div>
                        <div style={{fontSize:10,color:"#888",fontFamily:"'Cinzel',serif",textAlign:"center",padding:"0 16px"}}>
                          Promote to {bTier?.icon} {bTier?.name||"higher tier"}
                        </div>
                      </div>
                    )}
                    <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:7}}>
                      <span style={{fontSize:24}}>{b.icon}</span>
                      <div>
                        <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:12,color:b.built?"#a8ff78":"#f0e6d3"}}>{b.name}</div>
                        <div style={{fontSize:10,color:b.built?"#a8ff78":"#ffd966"}}>{b.built?"✅ Constructed":`${b.cost.toLocaleString()}g`}</div>
                      </div>
                    </div>
                    <div style={{fontSize:11,color:"#999",marginBottom:9,lineHeight:1.5}}>{b.desc}</div>
                    {!b.built&&unlocked&&(
                      <button onClick={()=>buildBuilding(b)} disabled={!canAfford}
                        style={{width:"100%",padding:"6px 0",borderRadius:5,border:"none",
                          cursor:canAfford?"pointer":"not-allowed",
                          background:canAfford?"linear-gradient(135deg,#a8ff78,#48c774)":"#1a1a2a",
                          color:canAfford?"#0d0d1a":"#444",fontWeight:700,fontSize:11,fontFamily:"'Cinzel',serif"}}>
                        {canAfford?`🏗️ Build for ${b.cost.toLocaleString()}g`:"💸 Need More Gold"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Elite market unlock status */}
            <div style={{marginTop:18,padding:"12px 14px",borderRadius:9,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)"}}>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:12,fontWeight:700,color:"#888",marginBottom:8}}>⭐ Market Hero Tiers</div>
              {[
                {label:"Standard Heroes",  desc:"Always available",               tierReq:"iron",     icon:"🧑"},
                {label:"Premium Heroes",   desc:"Grand Bazaar — Gold tier+",      tierReq:"gold",     icon:"⭐"},
                {label:"Elite Heroes",     desc:"Pot 85+ — Platinum tier only",   tierReq:"platinum", icon:"💎"},
              ].map(({label,desc,tierReq,icon})=>{
                const unlocked = TIER_ORDER.indexOf(playerTier) >= TIER_ORDER.indexOf(tierReq);
                return(
                  <div key={label} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                    <span style={{fontSize:16}}>{icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,fontWeight:700,color:unlocked?"#f0e6d3":"#888"}}>{label}</div>
                      <div style={{fontSize:9,color:"#888"}}>{desc}</div>
                    </div>
                    <div style={{fontSize:10,fontWeight:700,color:unlocked?"#a8ff78":"#888"}}>{unlocked?"✓ Unlocked":"🔒 Locked"}</div>
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
                  <div style={{fontFamily:"'Cinzel',serif",fontSize:16,fontWeight:900,color:"#a8ff78"}}>💰 Offers</div>
                  <div style={{fontSize:11,color:"#999"}}>{transferBids.length} offer{transferBids.length>1?"s":""} waiting · expire after 2 weeks</div>
                  <div style={{flex:1}}/>
                  <div style={{fontSize:11,color:"#ffd966",fontWeight:700}}>Treasury: {gold.toLocaleString()}g</div>
                </div>

                {/* Full-width bid cards */}
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {transferBids.map(bid=>{
                    const hero=heroes.find(h=>h.id===bid.heroId);
                    if(!hero) return null;
                    const aboveValue=bid.offer>bid.marketValue;
                    const weeksAgo=Math.max(0,(week||0)-bid.week);
                    const weeksLeft=Math.max(0,2-weeksAgo);
                    const urgentExpiry=weeksLeft<=1;
                    const phase=agePhase(hero);
                    const pwr=Math.round(Math.max(...POS_KEYS.map(p=>calcHeroCombatScore(hero,p))));
                    return(
                      <div key={bid.id} style={{
                        borderRadius:12,overflow:"hidden",
                        border:`1px solid ${aboveValue?"rgba(168,255,120,0.4)":urgentExpiry?"rgba(255,100,100,0.35)":"rgba(168,255,120,0.2)"}`,
                        background:aboveValue?"rgba(168,255,120,0.05)":"rgba(255,255,255,0.02)",
                        boxShadow:aboveValue?"0 0 24px rgba(168,255,120,0.06)":"none",
                      }}>
                        {/* Above-market banner */}
                        {aboveValue&&(
                          <div style={{padding:"5px 16px",background:"linear-gradient(90deg,rgba(168,255,120,0.15),rgba(168,255,120,0.05))",borderBottom:"1px solid rgba(168,255,120,0.2)",display:"flex",alignItems:"center",gap:8}}>
                            <span style={{fontSize:12}}>🔥</span>
                            <span style={{fontSize:11,fontWeight:700,color:"#a8ff78"}}>Above Market Value — {bid.pctOfValue}% of {bid.marketValue.toLocaleString()}g</span>
                          </div>
                        )}

                        <div style={{padding:"14px 16px"}}>
                          <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>

                            {/* Hero info */}
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                                <span style={{fontSize:24}}>{RACE_ICONS[hero.race]}</span>
                                <div>
                                  <div style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:15,color:"#f0e6d3"}}>{hero.name}</div>
                                  <div style={{fontSize:10,color:"#888"}}>{hero.race} {ROLE_ICONS[hero.role]} {hero.role} · Lv {hero.level} · {agePhaseLabel(phase)}</div>
                                </div>
                                {bid.isListed&&<span style={{fontSize:9,color:"#ffd966",background:"rgba(255,215,0,0.12)",padding:"2px 7px",borderRadius:8,border:"1px solid rgba(255,215,0,0.2)"}}>🏷️ Listed</span>}
                              </div>

                              {/* Mini stats */}
                              <div style={{display:"flex",gap:6,marginBottom:8}}>
                                {[["⚔️ PWR",pwr,pwr>=40?"#a8ff78":pwr>=25?"#78c8ff":"#ffd966"],
                                  ["💛 MRL",hero.morale,hero.morale>=70?"#a8ff78":hero.morale>=50?"#ffd966":"#ff9f43"],
                                  ["⚡ FAT",hero.fatigue||0,fatigueLabel(hero.fatigue||0).color],
                                ].map(([label,val,col])=>(
                                  <div key={label} style={{padding:"4px 8px",borderRadius:6,background:"rgba(0,0,0,0.25)"}}>
                                    <span style={{fontSize:9,color:"#999"}}>{label} </span>
                                    <span style={{fontSize:12,fontWeight:700,color:col}}>{val}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Scout reasoning */}
                              <div style={{fontSize:10,color:"#888",fontStyle:"italic"}}>"{bid.town} scouted: {bid.reason}"</div>
                            </div>

                            {/* Offer + actions */}
                            <div style={{flexShrink:0,textAlign:"right",minWidth:140}}>
                              <div style={{fontSize:28,fontWeight:900,color:"#a8ff78",fontFamily:"'Cinzel',serif",lineHeight:1}}>{bid.offer.toLocaleString()}g</div>
                              {!aboveValue&&<div style={{fontSize:10,color:"#999",marginBottom:4}}>{bid.pctOfValue}% of market value</div>}
                              <div style={{fontSize:10,color:urgentExpiry?"#ff7878":"#555",marginBottom:10}}>
                                {urgentExpiry?"⚠️ Expires this week":"Expires in "+weeksLeft+" week"+(weeksLeft!==1?"s":"")}
                              </div>
                              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                                <button onClick={()=>acceptBid(bid)}
                                  style={{padding:"10px 16px",borderRadius:8,border:"none",cursor:"pointer",
                                    background:"linear-gradient(135deg,#a8ff78,#48c774)",
                                    color:"#0d0d1a",fontWeight:900,fontSize:13,fontFamily:"'Cinzel',serif",
                                    whiteSpace:"nowrap"}}>
                                  ✓ Accept {bid.offer.toLocaleString()}g
                                </button>
                                <div style={{display:"flex",gap:5}}>
                                  <button onClick={()=>{setDetailHero(hero);setPrevStats(null);}}
                                    style={{flex:1,padding:"6px 0",borderRadius:6,border:"1px solid rgba(255,255,255,0.1)",cursor:"pointer",background:"rgba(255,255,255,0.04)",color:"#888",fontSize:10,fontFamily:"'Cinzel',serif"}}>
                                    View Hero
                                  </button>
                                  <button onClick={()=>declineBid(bid)}
                                    style={{flex:1,padding:"6px 0",borderRadius:6,border:"1px solid rgba(255,100,100,0.25)",cursor:"pointer",background:"rgba(255,100,100,0.07)",color:"#ff7878",fontSize:10,fontFamily:"'Cinzel',serif"}}>
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

            {/* ══ FREE AGENT MARKET ════════════════════════════════════════ */}
            <div style={{borderTop:transferBids.length>0?"1px solid rgba(255,255,255,0.06)":"none",paddingTop:transferBids.length>0?20:0}}>
              {/* Header with roster count */}
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:13,fontWeight:700,color:"#ffd966"}}>🏪 Free Agent Market</div>
                <span style={{fontSize:11,color:"#888"}}>Treasury: <b style={{color:"#ffd966"}}>{gold.toLocaleString()}g</b></span>
                {/* Roster count — prominent when near cap */}
                {(()=>{
                  const rCount=heroes.filter(x=>!x.retired).length;
                  const full=rCount>=ROSTER_CAP;
                  return(
                    <span style={{fontSize:10,fontWeight:700,
                      color:full?"#ff9f43":rCount>=ROSTER_CAP-2?"#ffd966":"#555",
                      background:full?"rgba(255,159,67,0.1)":"rgba(255,255,255,0.04)",
                      padding:"2px 8px",borderRadius:8,
                      border:`1px solid ${full?"rgba(255,159,67,0.3)":"rgba(255,255,255,0.08)"}`}}>
                      {full?"🚫":"👥"} {rCount}/{ROSTER_CAP} roster
                    </span>
                  );
                })()}
                {buildings.find(b=>b.id==="bazaar"&&b.built)&&(
                  <span style={{fontSize:10,color:"#a8ff78",background:"rgba(168,255,120,0.08)",padding:"2px 8px",borderRadius:10,border:"1px solid rgba(168,255,120,0.18)"}}>🏪 Bazaar Active</span>
                )}
                <span style={{fontSize:10,color:"#555",marginLeft:"auto"}}>
                  {(()=>{
                    const hasNetwork=buildings.find(b=>b.id==="network"&&b.built);
                    const interval=hasNetwork?3:6;
                    const weeksLeft=interval-(week%interval)||interval;
                    return `🔄 Refreshes in ${weeksLeft} week${weeksLeft!==1?"s":""}`;
                  })()}
                </span>
              </div>

              {/* Market filter bar */}
              <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
                <select value={marketFilter.role} onChange={e=>setMarketFilter(f=>({...f,role:e.target.value}))} style={{fontSize:10,padding:"4px 8px",borderRadius:6,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"#aaa",cursor:"pointer"}}>
                  <option>All</option>{ROLES.map(r=><option key={r}>{r}</option>)}
                </select>
                <select value={marketFilter.stage} onChange={e=>setMarketFilter(f=>({...f,stage:e.target.value}))} style={{fontSize:10,padding:"4px 8px",borderRadius:6,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"#aaa",cursor:"pointer"}}>
                  <option value="All">All Stages</option>
                  {["prospect","rising","peak","fading","veteran"].map(s=><option key={s} value={s}>{agePhaseLabel(s)}</option>)}
                </select>
                <select value={marketFilter.sortBy} onChange={e=>setMarketFilter(f=>({...f,sortBy:e.target.value}))} style={{fontSize:10,padding:"4px 8px",borderRadius:6,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"#aaa",cursor:"pointer"}}>
                  {["Value","Combat","Salary","Level","Stage"].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>

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
                      <div style={{padding:"8px 12px",borderRadius:8,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",fontSize:10,color:"#888",display:"flex",alignItems:"center",gap:8}}>
                        <span>🔒</span><span>{premiumCount} premium hero{premiumCount>1?"es":""} hidden — build Grand Bazaar (Gold tier) to access</span>
                      </div>
                    )}
                    {!hasSanctum&&eliteCount>0&&(
                      <div style={{padding:"8px 12px",borderRadius:8,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",fontSize:10,color:"#888",display:"flex",alignItems:"center",gap:8}}>
                        <span>🔒</span><span>{eliteCount} elite hero{eliteCount>1?"es":""} hidden — build Elite Sanctum (Platinum tier) to access</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="rm-card-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:7}}>
                {(()=>{
                  const hasBazaar=buildings.find(b=>b.id==="bazaar"&&b.built);
                  const hasSanctum=buildings.find(b=>b.id==="sanctum"&&b.built);
                  const mSorts={Value:h=>-h.value,Combat:h=>-Math.max(...POS_KEYS.map(p=>calcHeroCombatScore(h,p))),Salary:h=>h.salary,Level:h=>-h.level,Stage:h=>stageToCareerWeek(h.stage||"prospect",h.stageProgress||0)};
                  const filtered = market
                    .filter(h=>{
                      if(h.marketTier==="elite") return !!hasSanctum;
                      if(h.marketTier==="premium") return !!hasBazaar;
                      return true;
                    })
                    .filter(h=>marketFilter.role==="All"||h.role===marketFilter.role)
                    .filter(h=>marketFilter.stage==="All"||h.stage===marketFilter.stage)
                    .sort((a,b)=>(mSorts[marketFilter.sortBy]||mSorts.Value)(a)-(mSorts[marketFilter.sortBy]||mSorts.Value)(b));
                  if(filtered.length===0) return <div style={{color:"#888",fontSize:13,padding:8}}>No heroes match your filters.</div>;
                  return filtered.map(h=>(
                    <div key={h.id}>
                      <HeroCard hero={h} selected={detailHero?.id===h.id}
                        onClick={()=>setDetailHero(h)} showBuy
                        canAfford={gold>=(signDiscount>0?Math.round(h.value*(1-signDiscount)):h.value)}
                        rosterFull={heroes.filter(x=>!x.retired).length>=ROSTER_CAP}
                        onBuy={buyHero}/>
                    </div>
                  ));
                })()}
              </div>

              {/* Listed heroes — below the fold, low visual weight */}
              {listedHeroIds.size>0&&(
                <div style={{marginTop:20,paddingTop:16,borderTop:"1px solid rgba(255,255,255,0.04)"}}>
                  <div style={{fontSize:11,color:"#999",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                    <span>🏷️ Your Listed Heroes</span>
                    <span style={{fontSize:10,color:"#888"}}>— awaiting bids (next cycle in ~{4-(week%4)} weeks)</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:7}}>
                    {heroes.filter(h=>listedHeroIds.has(h.id)).map(h=>(
                      <HeroCard key={h.id} hero={h} selected={detailHero?.id===h.id}
                        isListed hasBid={transferBids.some(b=>b.heroId===h.id)}
                        onClick={()=>{setDetailHero(h);setPrevStats(null);}}/>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* LOG */}
        {tab==="Ledger"&&(()=>{
          const f = lastWeekFinances;
          const sf = seasonFinances;
          const weekNet = f ? f.netGold : null;
          const seasonNet = sf ? (sf.tribute + sf.raidGold + sf.eventGold) - sf.wages - sf.signingCosts : 0;
          const col = n => n >= 0 ? "#a8ff78" : "#ff7878";
          const g = n => (n>=0?"+":"")+n.toLocaleString()+"g";
          const row = (label, val, valCol, sub) => (
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
              <div>
                <div style={{fontSize:11,color:"#f0e6d3"}}>{label}</div>
                {sub&&<div style={{fontSize:9,color:"#888",marginTop:1}}>{sub}</div>}
              </div>
              <div style={{fontSize:13,fontWeight:700,color:valCol}}>{val}</div>
            </div>
          );
          return(
          <div style={{maxWidth:500}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:15,fontWeight:700,color:"#ffd966"}}>📒 Ledger</div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:10,color:"#888"}}>✓ Auto-saved</span>
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
                  setLegacyCeremony({ season, wins:playerWins, losses:playerLosses,
                    tier:playerTier, defeat:true, defeatReason:"abandon",
                    newlyEarned, allBoons,
                    chronicle:{ totalRaids:trophies.reduce((a,t)=>(t.wins||0)+(t.losses||0),0)+playerWins+playerLosses,
                      totalWins:trophies.reduce((a,t)=>a+(t.wins||0),0)+playerWins,
                      totalSeasons:season, builtCount:buildings.filter(b=>b.built).length,
                      totalWeeks:week },
                  });
                }}/>
                <NewGameButton/>
              </div>
            </div>

            {/* Persistence note */}
            <div style={{marginBottom:14,padding:"8px 12px",borderRadius:8,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)"}}>
              <div style={{fontSize:10,color:"#888",lineHeight:1.5}}>
                💾 <strong style={{color:"#aaa"}}>Save data is stored in your browser.</strong> Progress and earned boons persist across runs on this device and browser. Clearing browser data or switching devices will reset your save. There is no cloud sync.
              </div>
            </div>

            {/* Last week */}
            <div style={{marginBottom:16,padding:"14px 16px",background:"rgba(255,255,255,0.03)",borderRadius:10,border:"1px solid rgba(255,255,255,0.08)"}}>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:11,fontWeight:700,color:"#888",marginBottom:10,letterSpacing:0.5}}>
                LAST WEEK {f?`(Week ${f.week})`:""}
              </div>
              {!f&&<div style={{fontSize:11,color:"#888"}}>No activity recorded yet — complete a battle or skip a week.</div>}
              {f&&<>
                {row("⚔️ Battle earnings",  f.raidGold>0?"+"+f.raidGold.toLocaleString()+"g":"—",  f.raidGold>0?"#a8ff78":"#888")}
                {row("👑 Tribute",          "+"+f.tribute.toLocaleString()+"g",                           "#78c8ff", `${currentTier.icon} ${currentTier.name} · position ${currentTierPosition}`)}
                {row("💸 Wages",            "−"+f.wages.toLocaleString()+"g",                             "#ff9f43", `${heroes.filter(h=>!h.retired).length} heroes on contract`)}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:10,marginTop:4}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#f0e6d3",fontFamily:"'Cinzel',serif"}}>Net</div>
                  <div style={{fontSize:16,fontWeight:900,color:col(weekNet),fontFamily:"'Cinzel',serif"}}>{g(weekNet)}</div>
                </div>
              </>}
            </div>

            {/* Season to date */}
            <div style={{marginBottom:16,padding:"14px 16px",background:"rgba(255,255,255,0.03)",borderRadius:10,border:"1px solid rgba(255,255,255,0.08)"}}>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:11,fontWeight:700,color:"#888",marginBottom:10,letterSpacing:0.5}}>
                SEASON {season} TO DATE
              </div>
              {row("⚔️ Battle earnings",  sf.raidGold>0?"+"+sf.raidGold.toLocaleString()+"g":"—",  "#a8ff78")}
              {row("👑 Tribute",          "+"+sf.tribute.toLocaleString()+"g",                         "#78c8ff")}
              {sf.eventGold>0&&row("✨ Event gold",   "+"+sf.eventGold.toLocaleString()+"g",           "#a78bfa")}
              {row("💸 Wages",            "−"+sf.wages.toLocaleString()+"g",                           "#ff9f43")}
              {sf.signingCosts>0&&row("🤝 Signings",  "−"+sf.signingCosts.toLocaleString()+"g",        "#ff7878", "hero acquisition costs")}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:10,marginTop:4}}>
                <div style={{fontSize:12,fontWeight:700,color:"#f0e6d3",fontFamily:"'Cinzel',serif"}}>Season net</div>
                <div style={{fontSize:16,fontWeight:900,color:col(seasonNet),fontFamily:"'Cinzel',serif"}}>{g(seasonNet)}</div>
              </div>
            </div>

            {/* Treasury */}
            <div style={{marginBottom:24,padding:"12px 16px",background:`${townColor}0d`,borderRadius:10,border:`1px solid ${townColor}33`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:11,fontWeight:700,color:townColor}}>💰 Treasury</div>
              <div style={{fontSize:22,fontWeight:900,color:townColor,fontFamily:"'Cinzel',serif"}}>{gold.toLocaleString()}g</div>
            </div>

            {/* Realm Settings */}
            <div style={{padding:"14px 16px",background:"rgba(255,255,255,0.025)",borderRadius:10,border:"1px solid rgba(255,255,255,0.07)"}}>
              <div style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:12,color:"#888",marginBottom:12,letterSpacing:1}}>⚙️ REALM SETTINGS</div>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:10,color:"#999",marginBottom:5}}>Realm name</div>
                <div style={{display:"flex",gap:6}}>
                  <input defaultValue={townName} id="realm-name-input" maxLength={28}
                    style={{flex:1,padding:"7px 10px",borderRadius:6,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#f0e6d3",fontSize:12,outline:"none",fontFamily:"'Lato',sans-serif"}}/>
                  <button onClick={()=>{const v=document.getElementById("realm-name-input").value.trim();if(v)setTownName(v);}}
                    style={{padding:"7px 14px",borderRadius:6,border:"none",cursor:"pointer",background:`${townColor}22`,color:townColor,fontSize:11,fontWeight:700,fontFamily:"'Cinzel',serif"}}>
                    Save
                  </button>
                </div>
              </div>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:10,color:"#999",marginBottom:6}}>Realm colour</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {TOWN_COLORS.map(c=>(
                    <button key={c.value} onClick={()=>setTownColor(c.value)}
                      style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:6,border:"none",cursor:"pointer",
                        background:townColor===c.value?`${c.value}22`:"rgba(255,255,255,0.04)",
                        outline:`2px solid ${townColor===c.value?c.value:"transparent"}`,transition:"all 0.15s"}}>
                      <div style={{width:9,height:9,borderRadius:"50%",background:c.value}}/>
                      <span style={{fontSize:10,color:townColor===c.value?c.value:"#888",fontWeight:townColor===c.value?700:400}}>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{paddingTop:12,borderTop:"1px solid rgba(255,255,255,0.05)"}}>
                <div style={{fontSize:10,color:"#999",marginBottom:8}}>Scouting Intelligence</div>
                <div style={{padding:"10px 12px",borderRadius:8,background:showHiddenStats?"rgba(120,200,255,0.06)":"rgba(255,255,255,0.03)",border:`1px solid ${showHiddenStats?"rgba(120,200,255,0.2)":"rgba(255,255,255,0.07)"}`,transition:"all 0.2s"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,fontWeight:700,color:showHiddenStats?"#78c8ff":"#888",marginBottom:3}}>
                        {showHiddenStats?"👁️ Omniscient Mode":"🔒 Blind Scouting"}
                      </div>
                      <div style={{fontSize:10,color:"#999",lineHeight:1.5}}>
                        {showHiddenStats
                          ?"Hidden stats visible. You see all."
                          :"Hidden stats concealed. Judge heroes by their deeds."}
                      </div>
                    </div>
                    <button onClick={()=>setShowHiddenStats(v=>!v)}
                      style={{flexShrink:0,padding:"7px 14px",borderRadius:6,border:`1px solid ${showHiddenStats?"rgba(120,200,255,0.3)":"rgba(255,255,255,0.12)"}`,cursor:"pointer",
                        background:showHiddenStats?"rgba(120,200,255,0.12)":"rgba(255,255,255,0.05)",
                        color:showHiddenStats?"#78c8ff":"#888",fontSize:10,fontWeight:700,fontFamily:"'Cinzel',serif",whiteSpace:"nowrap"}}>
                      {showHiddenStats?"Hide Stats":"Reveal Stats"}
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
            {id:"Dominion",icon:"⚜️",label:"Dominion"},
            {id:"Town",    icon:"🏰",label:"Town"},
            {id:"Ledger",   icon:"📒",label:"Ledger"},
            {id:"Guide",   icon:"📖",label:"Guide"},
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
              <span className="rm-bnav-icon">{icon}</span>
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
              <span className="rm-bnav-icon">{icon}</span>
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
              <div className="rm-bnav-battle-pill" style={isActive?{background:"rgba(255,100,100,0.22)",borderColor:"rgba(255,100,100,0.5)"}:{}}>
                <span className="rm-bnav-icon" style={{color:isActive?"#ff9f43":"#666"}}>{icon}</span>
                <span className="rm-bnav-label" style={{color:isActive?"#ff9f43":"#555"}}>{label}</span>
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
              <span className="rm-bnav-icon">{icon}</span>
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
        />
      )}
    </div>
  );
}
