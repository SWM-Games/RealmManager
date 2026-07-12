// Realm Manager balance simulation — faithful port of the CURRENT formulas in
// src/App.jsx. Re-run this whenever balance knobs change: `npm run sim`.
//
// Models: hero gen/growth/aging, results-based Form, exchange-engine battles
// (series prob === phase chance, so a single Bernoulli is exact), firing spec
// penalties, position-based tribute against a modeled weekly league table,
// level-priced market, injury floor, economy, hiring/selling, promotion.
// Ignores (small or player-choice): traits, race synergy (see SYNERGY opt),
// events, legendary challenges, mentors, leader bonuses.
"use strict";

const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// ── constants (keep in sync with src/App.jsx) ───────────────────────
const XP_PER_LEVEL = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000, 5200, 6600, 8200, 10000, 12000];
const MAX_LEVEL = 15;
const xpForLevel = (l) => XP_PER_LEVEL[Math.min(l, MAX_LEVEL)];
const levelFromXp = (xp) => { let l = 0; for (let i = 1; i <= MAX_LEVEL; i++) { if (xp >= XP_PER_LEVEL[i]) l = i; else break; } return l; };

const COMBAT = ["Strength", "Agility", "Endurance", "Accuracy", "Defense", "Magic Power", "Magic Resist"];
const MENTAL = ["Tactics", "Composure", "Leadership", "Determination", "Adaptability"];
const SOCIAL = ["Charisma", "Negotiation", "Intimidation", "Reputation"];
const ALL_STATS = [...COMBAT, ...MENTAL, ...SOCIAL, "Potential", "Form"];
const PHYSICAL = ["Strength", "Agility", "Endurance", "Accuracy", "Defense", "Magic Power"];
// growHeroStats now includes Magic Resist (un-frozen in the audit)
const GROW_STATS = [...PHYSICAL, "Magic Resist", ...MENTAL, "Charisma", "Negotiation", "Intimidation"];

// NEW tribute/xp values
const TIERS = {
  iron:     { powerMin: 67,  powerMax: 105, difficulty: 1, tributeBase: 170, xpRange: [20, 32] },
  bronze:   { powerMin: 93,  powerMax: 147, difficulty: 2, tributeBase: 225, xpRange: [26, 40] },
  silver:   { powerMin: 127, powerMax: 199, difficulty: 3, tributeBase: 325, xpRange: [32, 48] },
  gold:     { powerMin: 167, powerMax: 262, difficulty: 4, tributeBase: 465, xpRange: [36, 70] },
  platinum: { powerMin: 207, powerMax: 325, difficulty: 5, tributeBase: 625, xpRange: [45, 85] },
};
const TIER_ORDER = ["iron", "bronze", "silver", "gold", "platinum"];
// Modest position swing so tier dominates placement (mirror of src/App.jsx)
const TIER_POSITION_BONUS = [80, 58, 42, 28, 16, 6, 0, 0];
const weeklyRankIncome = (tid, position) => TIERS[tid].tributeBase + (TIER_POSITION_BONUS[Math.max(0, (position || 8) - 1)] || 0);

// Transfer-fee scale (Football-Manager-style): a hero's signing fee should be a
// real multiple of their annual wage, not a rounding error. Pre-scale the fee was
// ~11-15% of annual salary; this lifts a standard hero to ~1x annual wage and a
// star to several times it. Applied to every hero value origin. Keep in sync with
// src/App.jsx TRANSFER_FEE_SCALE.
const TRANSFER_FEE_SCALE = 6;

const TIER_POT = {
  iron:     { standard: [30, 48], premium: [42, 58], elite: null },
  bronze:   { standard: [38, 56], premium: [50, 66], elite: null },
  silver:   { standard: [48, 68], premium: [60, 76], elite: [68, 80] },
  gold:     { standard: [62, 82], premium: [72, 88], elite: [80, 92] },
  platinum: { standard: [78, 95], premium: [86, 99], elite: [92, 99] },
};
const SEASON_LEN = 42;

const STAGE_ORDER = ["prospect", "rising", "peak", "fading", "veteran"];
const STAGE_WEEKS = { prospect: 84, rising: 84, peak: 126, fading: 126, veteran: 84 };
const TOTAL_CAREER = 504;
function stageToCareerWeek(stage, progress) { let w = 0; for (const s of STAGE_ORDER) { if (s === stage) return Math.round(w + (progress / 100) * STAGE_WEEKS[s]); w += STAGE_WEEKS[s]; } return TOTAL_CAREER; }
function careerWeekToStage(tw) { let rem = Math.max(0, Math.min(TOTAL_CAREER, tw)); for (const s of STAGE_ORDER) { const sw = STAGE_WEEKS[s]; if (rem < sw || s === "veteran") return { stage: s, stageProgress: Math.min(100, (rem / sw) * 100) }; rem -= sw; } return { stage: "veteran", stageProgress: 100 }; }

// NEW: Vanguard includes Intimidation 0.06
const POSITION_WEIGHTS = {
  Vanguard:   { Strength: .28, Endurance: .22, Defense: .20, Determination: .08, Intimidation: .06, Composure: .04, Agility: .04, Accuracy: .02, Leadership: .02, Adaptability: .01, Tactics: .01, "Magic Power": .01, "Magic Resist": .01 },
  Skirmisher: { Agility: .28, Accuracy: .24, Adaptability: .14, Determination: .08, Composure: .06, Strength: .04, Endurance: .03, Defense: .02, Leadership: .02, Tactics: .02, "Magic Power": .01, "Magic Resist": 0 },
  Arbiter:    { Tactics: .24, "Magic Power": .20, "Magic Resist": .14, Leadership: .12, Composure: .08, Adaptability: .06, Accuracy: .04, Determination: .04, Agility: .02, Endurance: .02, Defense: .01, Strength: .01 },
};
const POS_KEYS = ["Vanguard", "Skirmisher", "Arbiter"];
const IDEAL = { Vanguard: ["Warrior", "Paladin"], Skirmisher: ["Ranger", "Rogue"], Arbiter: ["Mage", "Cleric"] };
const ROLES = ["Warrior", "Ranger", "Mage", "Rogue", "Cleric", "Paladin"];
const RACES = ["Human", "Elf", "Dwarf", "Half-Orc", "Gnome", "Tiefling", "Dragonborn"];
const STAGE_MULT = { prospect: 1.0, rising: 1.0, peak: 1.05, fading: 0.95, veteran: 0.90 };

// Specialisations now FIRE when the counter lane is weak (< 80% of avg lane)
const SPECS = [
  { counter: "Skirmisher", penalty: 0.12, injuryBonus: 0.08 },
  { counter: "Vanguard",   penalty: 0.10, injuryBonus: 0.00 },
  { counter: "Arbiter",    penalty: 0.14, injuryBonus: 0.00 },
  { counter: "Skirmisher", penalty: 0.10, injuryBonus: 0.12 },
  { counter: "Vanguard",   penalty: 0.08, injuryBonus: 0.00 },
  { counter: "Arbiter",    penalty: 0.16, injuryBonus: 0.00 },
];

const PHASE_CAP = 0.85, PHASE_FLOOR = 0.15; // NEW cap

function fatigueMult(f) { return Math.max(0.55, 1.0 - (f / 100) * 0.45); }

function calcHeroCombatScore(h, pos) {
  const w = POSITION_WEIGHTS[pos];
  let s = 0;
  for (const [st, wt] of Object.entries(w)) s += (h.stats[st] || 0) * wt;
  if (IDEAL[pos].includes(h.role)) s *= 1.10;
  const formMult = 0.6 + ((h.stats.Form || 5) / 10) * 0.4;
  s *= formMult;
  const morale = Math.min(100, Math.max(0, h.morale ?? 70));
  s *= 0.6 + (morale / 100) * 0.4;
  s *= fatigueMult(h.fatigue ?? 0);
  s *= STAGE_MULT[h.stage || "peak"] ?? 1.0;
  return s;
}
function calcPositionScore(hs, pos) {
  const v = hs.filter(Boolean);
  if (!v.length) return 0;
  const sc = v.map((h) => calcHeroCombatScore(h, pos)).sort((a, b) => b - a);
  if (sc.length === 1) return sc[0];
  let s = sc[0] * 1.25 + sc[1] * 0.75;
  s *= 1.05; // approx avg role/race pairing bonus for reasonable squads
  return s;
}

// ── hero generation ─────────────────────────────────────────────────
let NEXT_ID = 1;
function makeHeroBase(pot, stage, progress, statLoFrac, statHiFrac, level, role, extra) {
  const stats = {};
  for (const s of ALL_STATS) {
    if (s === "Potential") { stats[s] = pot; continue; }
    if (s === "Form") continue;
    const lo = Math.max(10, Math.floor(pot * statLoFrac));
    const hi = Math.max(lo, Math.floor(pot * statHiFrac));
    stats[s] = Math.max(10, Math.min(pot, rand(lo, hi) + (extra || 0)));
  }
  stats.Form = rand(3, 7);
  const avg = Object.values(stats).reduce((a, b) => a + b, 0) / ALL_STATS.length;
  return {
    id: NEXT_ID++, role: role || pick(ROLES), race: pick(RACES), stats,
    stage, stageProgress: progress, level, xp: xpForLevel(level),
    morale: rand(55, 85), fatigue: 0, injured: false, injuryWeeks: 0, retired: false,
    salary: Math.floor(avg * rand(13, 16) / 10 + level * rand(6, 10)),
    value: Math.max(100, Math.floor(avg * 7 * TRANSFER_FEE_SCALE)),
    contractWeeksLeft: rand(1, 3) * 42, weeksUnplayed: 0, fodder: false, marketTier: "standard",
  };
}
function generateStartingSquad() {
  const squad = [];
  const starPot = rand(65, 80);
  squad.push(makeHeroBase(starPot, "peak", rand(5, 35), 0.25, 0.50, 2, null, rand(1, 3)));
  const gr = [pick(["Warrior", "Paladin"]), pick(["Ranger", "Rogue"]), pick(["Mage", "Cleric"])];
  for (const r of gr) squad.push(makeHeroBase(rand(38, 52), "rising", rand(10, 70), 0.25, 0.50, 1, r));
  for (let i = 0; i < 4; i++) { const h = makeHeroBase(rand(35, 55), "prospect", rand(20, 80), 0.25, 0.45, 0); h.stats.Form = rand(2, 6); squad.push(h); }
  for (let i = 0; i < 2; i++) { const h = makeHeroBase(rand(18, 30), "prospect", rand(10, 60), 0.25, 0.50, 0); h.stats.Form = rand(2, 5); h.fodder = true; squad.push(h); }
  return squad;
}
const MARKET_WIN = { standard: ["prospect", 0, "rising", 30], premium: ["prospect", 50, "peak", 0], elite: ["rising", 0, "peak", 30] };
const STAGE_LVL = { prospect: [0, 2], rising: [2, 6], peak: [6, 10], fading: [8, 12], veteran: [10, 14] };
function generateMarketHero(tierId, premium, elite) {
  const ranges = TIER_POT[tierId];
  const range = elite && ranges.elite ? ranges.elite : premium ? ranges.premium : ranges.standard;
  const pot = rand(range[0], range[1]);
  const mt = elite ? "elite" : premium ? "premium" : "standard";
  const [ms, mp, xs, xp2] = MARKET_WIN[mt];
  const cw = rand(stageToCareerWeek(ms, mp), Math.max(stageToCareerWeek(ms, mp), stageToCareerWeek(xs, xp2)));
  const { stage, stageProgress } = careerWeekToStage(cw);
  const stats = {};
  for (const s of ALL_STATS) {
    if (s === "Potential") { stats[s] = pot; continue; }
    if (s === "Form") continue;
    let base = rand(Math.max(10, Math.floor(pot * 0.25)), Math.max(10, Math.floor(pot * 0.5)));
    if (stage === "peak") base = Math.min(pot, base + rand(5, 12));
    stats[s] = Math.max(10, Math.min(pot, base));
  }
  stats.Form = rand(5, 9);
  const avg = Object.values(stats).reduce((a, b) => a + b, 0) / ALL_STATS.length;
  const [lvMin, lvMax] = STAGE_LVL[stage];
  const tierLvBonus = elite ? rand(2, 3) : premium ? rand(1, 2) : 0;
  const level = Math.min(MAX_LEVEL, rand(lvMin, lvMax) + tierLvBonus);
  const potBonus = Math.max(0, pot - 50) * 5;
  // NEW: price includes the level term (arbitrage fix)
  const baseValue = Math.floor((avg * 7 * (1 + level * 0.32) + potBonus * 0.3) * TRANSFER_FEE_SCALE + rand(-30, 30));
  const valueMult = elite ? rand(22, 28) / 10 : premium ? rand(15, 20) / 10 : rand(10, 12) / 10;
  const isFree = !elite && !premium && stage === "prospect" && level === 0;
  const value = isFree ? 0 : Math.max(100, Math.floor(baseValue * valueMult));
  return {
    id: NEXT_ID++, role: pick(ROLES), race: pick(RACES), stats, stage, stageProgress,
    level, xp: xpForLevel(level), morale: rand(55, 100), fatigue: 0, injured: false, injuryWeeks: 0, retired: false,
    salary: Math.floor(avg * rand(13, 16) / 10 + level * rand(6, 10)),
    value, contractWeeksLeft: rand(1, 3) * 42, weeksUnplayed: 0,
    fodder: false, marketTier: mt,
  };
}
function calcHeroValue(h) {
  const vals = ALL_STATS.map((s) => h.stats[s] || 0);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const base = Math.floor(avg * 7 * (1 + (h.level || 0) * 0.32) * TRANSFER_FEE_SCALE);
  const mult = h.marketTier === "elite" ? rand(22, 28) / 10 : h.marketTier === "premium" ? rand(15, 20) / 10 : 1;
  return Math.max(100, Math.floor(base * mult));
}
// NEW: gap-closing growth
function growHeroStats(h, newLevel, hasBarracks) {
  const pot = h.stats.Potential || 50;
  const lg = newLevel - (h.level || 0);
  for (const s of GROW_STATS) {
    const cur = h.stats[s] || 10;
    if (cur >= pot) continue;
    const levelsLeft = Math.max(1, MAX_LEVEL - newLevel + 1);
    const gapPerLevel = Math.ceil((pot - cur) / levelsLeft);
    const maxGain = Math.max(hasBarracks ? 4 : 3, gapPerLevel);
    h.stats[s] = Math.min(pot, cur + (newLevel >= MAX_LEVEL ? (pot - cur) : lg * rand(1, maxGain)));
  }
}
function calcDemand(h) {
  const phase = h.stage || "peak";
  const avgC = COMBAT.reduce((a, s) => a + h.stats[s], 0) / COMBAT.length;
  const avgM = MENTAL.reduce((a, s) => a + h.stats[s], 0) / MENTAL.length;
  let base = Math.floor((avgC * 0.6 + avgM * 0.4) * (0.9 + h.level * 0.12));
  base = Math.floor(base * ({ prospect: 0.80, rising: 0.95, peak: 1.30, fading: 0.75, veteran: 0.55 }[phase] ?? 1));
  if (h.morale < 40) base = Math.floor(base * (1 + (40 - h.morale) / 100));
  const neg = h.stats.Negotiation || 0;
  if (neg > 20) base = Math.floor(base * (1 + Math.min(0.20, (neg - 20) / 79 * 0.20)));
  const minSalary = ["fading", "veteran"].includes(phase) ? Math.floor(h.salary * 0.7) : h.salary;
  return Math.max(minSalary, base);
}
function ageHeroWeekly(h) {
  const weekly = (1 / STAGE_WEEKS[h.stage]) * 100;
  h.stageProgress = Math.min(100, h.stageProgress + weekly);
  if (h.stageProgress >= 100) {
    const i = STAGE_ORDER.indexOf(h.stage);
    if (h.stage === "veteran") { h.retired = true; return; }
    if (i < STAGE_ORDER.length - 1) { h.stage = STAGE_ORDER[i + 1]; h.stageProgress = 0; }
  }
  if (h.stage === "fading" && Math.random() < 3 / 100) {
    const dr = 0.3 + (h.stageProgress / 100) * 0.5;
    for (const s of PHYSICAL) if (Math.random() < 0.3 + dr * 0.4) h.stats[s] = Math.max(10, h.stats[s] - rand(1, Math.ceil(dr * 4)));
    for (const s of MENTAL) if (Math.random() < 0.1) h.stats[s] = Math.max(10, h.stats[s] - rand(1, 2));
    if (Math.random() < 0.4) h.stats.Form = Math.max(1, h.stats.Form - 1);
  }
  if (h.stage === "veteran" && Math.random() < 4 / 100) {
    for (const s of PHYSICAL) if (Math.random() < 0.65) h.stats[s] = Math.max(10, h.stats[s] - rand(2, 5));
    for (const s of MENTAL) if (Math.random() < 0.25) h.stats[s] = Math.max(10, h.stats[s] - rand(1, 3));
    h.morale = Math.max(30, h.morale - rand(2, 6));
  }
}

// ── one campaign run ────────────────────────────────────────────────
function runCampaign(NSEASONS, opts) {
  const track = [];
  let heroes = generateStartingSquad();
  let gold = 2500, week = 0, tierIdx = 0, seasonWins = 0, seasonLosses = 0;
  let debtWeeks = 0, maxDebtStreak = 0, bankruptAt = null;
  const built = new Set();
  // [id, cost, tierIdx] — ordered so the strongest modeled pick per tier comes
  // first; the slot caps below stop the AI buying a tier's weaker buildings.
  const BUILD_ORDER = [["barracks",1800,0],["tavern",1400,0],["lodge",3500,1],["infirmary",4000,1],["trainyard",6000,2],["network",7000,2],["trading",8000,2],["bazaar",14000,3],["scouts",18000,3],["sanctum",22000,4],["legends",18000,4]];
  const TIER_SLOTS = [1,1,2,1,1];          // iron, bronze, silver, gold, platinum
  const builtPerTier = [0,0,0,0,0];
  let towns = [];
  const promoteWeeks = [];

  for (let s = 0; s < NSEASONS; s++) {
    const tid = TIER_ORDER[tierIdx]; const T = TIERS[tid];
    seasonWins = 0; seasonLosses = 0;
    towns = Array.from({ length: 7 }, () => ({ power: rand(T.powerMin, T.powerMax), wins: 0, losses: 0 }));
    for (let sw = 0; sw < SEASON_LEN; sw++) {
      week++;
      const active = heroes.filter((h) => !h.retired);
      // formation: greedy best 2 per lane, prefer fatigue<70
      const avail = active.filter((h) => !h.injured);
      const pool = [...avail].sort((a, b) => (a.fatigue || 0) - (b.fatigue || 0));
      const used = new Set(); const formation = {};
      for (const pos of POS_KEYS) {
        const ranked = pool.filter((h) => !used.has(h.id)).map((h) => ({ h, s: calcHeroCombatScore(h, pos) * ((h.fatigue || 0) > 70 ? 0.8 : 1) })).sort((a, b) => b.s - a.s);
        formation[pos] = ranked.slice(0, 2).map((x) => x.h);
        formation[pos].forEach((h) => used.add(h.id));
      }
      const fielded = POS_KEYS.flatMap((p) => formation[p]);

      // enemy: random town; spec 35% of the time, fires if counter lane weak
      const oppIdx = rand(0, towns.length - 1);
      let oppPower = towns[oppIdx].power;
      const laneScores = {};
      const synergyMult = opts.synergy || 1.0;
      for (const pos of POS_KEYS) laneScores[pos] = calcPositionScore(formation[pos], pos) * synergyMult;
      const avgLane = POS_KEYS.reduce((a, p) => a + laneScores[p], 0) / 3;
      let specInjuryBonus = 0;
      if (Math.random() < 0.35) {
        const spec = pick(SPECS);
        if (avgLane > 0 && laneScores[spec.counter] < avgLane * 0.8) {
          oppPower = Math.round(oppPower * (1 + spec.penalty));
          specInjuryBonus = spec.injuryBonus;
        }
      }

      let rating = 0; const phaseChance = {}; const laneRoll = {};
      const share = oppPower / 3;
      for (const pos of POS_KEYS) {
        const sc = laneScores[pos];
        rating += sc;
        const ratio = sc > 0 ? share / sc : 999;
        phaseChance[pos] = Math.min(PHASE_CAP, Math.max(PHASE_FLOOR, 1 / (1 + ratio * ratio)));
        laneRoll[pos] = Math.random() < phaseChance[pos]; // exchange series prob === phase chance
      }
      const pa = phaseChance.Vanguard, pb = phaseChance.Skirmisher, pc = phaseChance.Arbiter;
      const overallWC = pa * pb * pc + pa * pb * (1 - pc) + pa * (1 - pb) * pc + (1 - pa) * pb * pc;
      const won = POS_KEYS.filter((p) => laneRoll[p]).length >= 2;
      if (won) seasonWins++; else seasonLosses++;

      // league table: opponent mirrors the player result; other 6 pair off power-weighted
      towns[oppIdx][won ? "losses" : "wins"]++;
      const others = towns.filter((_, i) => i !== oppIdx).sort(() => Math.random() - 0.5);
      for (let i = 0; i + 1 < others.length; i += 2) {
        const home = others[i], away = others[i + 1];
        const homeWon = Math.random() < 0.30 + (home.power / (home.power + away.power)) * 0.40;
        (homeWon ? home : away).wins++; (homeWon ? away : home).losses++;
      }
      const positionNow = towns.filter((t) => t.wins > seasonWins).length + 1;

      // rewards — losers collect a small purse too (no week is worth zero)
      const hasBarracks = built.has("barracks");
      const heroXP = Math.round(rand(...T.xpRange) * (hasBarracks ? 1.2 : 1));
      gold += won ? rand(300, 700) + T.difficulty * 100 : rand(50, 110) + T.difficulty * 25;

      // injuries (fatigue-driven + NEW floor on losses, cap 2)
      let injCount = 0;
      for (const h of fielded) {
        if (injCount >= 2) break;
        const f = h.fatigue || 0;
        const ff = f < 40 ? (won ? 0 : 0.015) : f < 70 ? ((f - 40) / 30) * 0.08 : f < 88 ? 0.08 + ((f - 70) / 18) * 0.12 : 0.20 + ((f - 88) / 12) * 0.15;
        let ch = Math.min(0.60, ff * (won ? 1 : 2)) + (!won ? specInjuryBonus : 0);
        if (built.has("infirmary")) ch *= 0.70; // Infirmary: -30% injury chance
        if (Math.random() < ch) { h.injured = true; h.injuryWeeks = rand(1, 4); if (built.has("infirmary")) h.injuryWeeks = Math.max(1, h.injuryWeeks - 1); injCount++; }
      }

      // hero updates
      const winSwing = won ? rand(6, 10) : 0;
      for (const h of active) {
        const inRaid = fielded.includes(h);
        if (inRaid) {
          const ef = Math.max(0.5, 1 - ((h.stats.Endurance || 30) - 30) / 140);
          h.fatigue = Math.min(100, (h.fatigue || 0) + Math.round(18 * ef * rand(8, 12) / 10));
          let xg = heroXP; if (h.morale >= 80) xg = Math.round(xg * 1.1);
          h.xp += xg;
          const nl = Math.min(MAX_LEVEL, levelFromXp(h.xp));
          if (nl > h.level) { growHeroStats(h, nl, hasBarracks); h.level = nl; h.value = calcHeroValue(h); }
          let ms;
          if (!won) { const lm = 0.4 + (h.morale / 100) * 0.8; ms = -Math.round(rand(6, 10) * lm); }
          else ms = winSwing;
          const decay = h.morale > 40 ? -0.5 : 0;
          h.morale = Math.min(100, Math.max(0, h.morale + ms + decay));
          // NEW Form: results-based — heat fast, cool slower (avoids death spiral)
          const myLane = POS_KEYS.find((p) => formation[p].includes(h));
          const laneWon = myLane ? laneRoll[myLane] : won;
          const fg = laneWon ? Math.random() * 0.4 + 0.4 : -(Math.random() * 0.3 + 0.05);
          h.stats.Form = Math.min(10, Math.max(1, (h.stats.Form || 5) + fg));
          h.weeksUnplayed = 0;
        } else {
          const rec = Math.round(25 * (built.has("lodge") ? 1.6 : 1));
          h.fatigue = Math.max(0, (h.fatigue || 0) - rec);
          h.weeksUnplayed++;
          const decay = h.morale > 40 ? -0.5 : 0;
          h.morale = Math.min(100, Math.max(0, h.morale + decay - 1 + (h.weeksUnplayed > 4 ? -1 : 0)));
          // NEW bench Form: drift toward 5
          const cf = h.stats.Form || 5;
          h.stats.Form = h.injured ? Math.max(1, cf - 0.40) : cf > 5 ? Math.max(5, cf - 0.20) : cf < 5 ? Math.min(5, cf + 0.20) : cf;
          if (h.injured) { h.injuryWeeks--; if (h.injuryWeeks <= 0) h.injured = false; }
          if (built.has("trainyard")) { h.xp += Math.max(1, Math.round(heroXP * 0.20)); const nl = Math.min(MAX_LEVEL, levelFromXp(h.xp)); if (nl > h.level) { growHeroStats(h, nl, hasBarracks); h.level = nl; h.value = calcHeroValue(h); } }
        }
        if (built.has("tavern")) h.morale = Math.min(100, h.morale + 3);
        h.contractWeeksLeft = Math.max(0, h.contractWeeksLeft - 1);
        if (h.contractWeeksLeft === 0) {
          if (h.fodder || (h.stage === "veteran" && h.level < 8)) { h.retired = true; }
          // Renewal at 93% of the ask — the one-concession norm under the
          // haggle-sitting negotiation (2026-07 rework); +15 morale matches
          // handleSign in src/App.jsx.
          else { const d = calcDemand(h); h.salary = Math.round(d * 0.93); h.contractWeeksLeft = rand(1, 3) * 42; h.morale = Math.min(100, h.morale + 15); }
        }
        ageHeroWeekly(h);
      }
      heroes = heroes.filter((h) => !h.retired);

      // wages & tribute (NEW: position-based)
      const wages = heroes.reduce((a, h) => a + h.salary, 0);
      gold -= wages;
      gold += weeklyRankIncome(tid, positionNow);
      if (gold <= 0) { debtWeeks++; maxDebtStreak = Math.max(maxDebtStreak, debtWeeks); if (debtWeeks >= 3 && bankruptAt === null) bankruptAt = week; }
      else debtWeeks = 0;

      // selling: every 4 wks, surplus heroes may get bids
      if (opts.selling && week % 4 === 0) {
        const surplus = [...heroes].sort((a, b) => bestScore(b) - bestScore(a)).slice(8);
        for (const h of surplus) {
          const phase = h.stage;
          const freq = { prospect: 0.8, rising: 0.9, peak: 1.0, fading: 0.3, veteran: 0.12 }[phase] ?? 1;
          if (Math.random() < 0.60 * freq) {
            const vmult = { prospect: 0.90, rising: 0.95, peak: 1.0, fading: 0.60, veteran: 0.38 }[phase] ?? 1;
            const pct = (0.80 + Math.random() * 0.35) * vmult;
            const offer = Math.round(h.value * pct);
            if (offer >= 0.7 * h.value || phase === "fading" || phase === "veteran") { gold += offer; h.retired = true; }
          }
        }
        heroes = heroes.filter((h) => !h.retired);
      }

      // buildings — respect per-tier slot caps (build the priority pick first)
      for (const [bid, cost, reqTier] of BUILD_ORDER) {
        if (built.has(bid)) continue;
        if (builtPerTier[reqTier] >= TIER_SLOTS[reqTier]) continue;
        if (tierIdx >= reqTier && gold > cost + 1500) { built.add(bid); builtPerTier[reqTier]++; gold -= cost; break; }
      }
      // hiring: refresh every 6 weeks (3 w/ network), sign best upgrade
      const interval = built.has("network") ? 3 : 6;
      if (week % interval === 0) {
        const isPrem = built.has("bazaar") || tierIdx >= 3;
        const isElit = built.has("sanctum");
        const mkt = Array.from({ length: 12 }, () => generateMarketHero(tid, isPrem && Math.random() < 0.35, isElit && Math.random() < 0.20));
        mkt.sort((a, b) => b.stats.Potential - a.stats.Potential);
        for (const cand of mkt) {
          if (heroes.length >= 12) {
            const worst = [...heroes].sort((a, b) => a.stats.Potential - b.stats.Potential)[0];
            if (cand.stats.Potential > worst.stats.Potential + 12 && gold > cand.value + 2000) {
              if (opts.selling) gold += Math.round(worst.value * 0.7);
              heroes = heroes.filter((x) => x !== worst);
            } else continue;
          }
          if (gold > cand.value + 2000 && (cand.stats.Potential > percentileWorstPot(heroes) + 5 || cand.value === 0)) {
            gold -= cand.value; heroes.push(cand);
            break;
          }
        }
      }
      track.push({ week, tierIdx, rating: Math.round(rating), oppPower, wc: overallWC, gold, squadN: heroes.length, wages, positionNow });
    }
    // season end: position from the modeled table
    const finalPos = towns.filter((t) => t.wins > seasonWins).length + 1;
    if (finalPos <= 2 && tierIdx < 4) { tierIdx++; gold += 500; promoteWeeks.push(week); heroes.forEach((h) => { h.morale = Math.max(h.morale, 75); }); }
    else if (finalPos >= 7 && tierIdx > 0) { tierIdx--; }
  }
  return { track, promoteWeeks, bankruptAt, maxDebtStreak, finalTier: tierIdx };
}
function bestScore(h) { return Math.max(...POS_KEYS.map((p) => calcHeroCombatScore(h, p))); }
function percentileWorstPot(hs) { const p = hs.map((h) => h.stats.Potential).sort((a, b) => a - b); return p[Math.floor(p.length * 0.25)] || 40; }

// ── run batches ─────────────────────────────────────────────────────
function median(a) { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; }
function pctile(a, p) { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length * p)]; }

function batch(label, opts, NRUNS, NSEASONS) {
  const runs = [];
  for (let i = 0; i < NRUNS; i++) runs.push(runCampaign(NSEASONS, opts));
  console.log(`\n===== ${label} (${NRUNS} runs x ${NSEASONS} seasons) =====`);
  const w1wc = runs.map((r) => r.track[0].wc), w1r = runs.map((r) => r.track[0].rating);
  console.log(`Week 1: median rating ${median(w1r)} (p5 ${pctile(w1r, 0.05)}, p95 ${pctile(w1r, 0.95)}), median win chance ${(median(w1wc) * 100).toFixed(0)}% (p5 ${(pctile(w1wc, 0.05) * 100).toFixed(0)}%, p95 ${(pctile(w1wc, 0.95) * 100).toFixed(0)}%)`);
  for (let s = 0; s < NSEASONS; s++) {
    const lo = s * SEASON_LEN, hi = lo + SEASON_LEN;
    const wcs = [], ratings = [], golds = [], tiers = [], opps = [], poss = [];
    for (const r of runs) {
      const seg = r.track.slice(lo, hi);
      if (!seg.length) continue;
      wcs.push(seg.reduce((a, t) => a + t.wc, 0) / seg.length);
      ratings.push(seg[seg.length - 1].rating);
      golds.push(seg[seg.length - 1].gold);
      tiers.push(seg[0].tierIdx);
      opps.push(seg.reduce((a, t) => a + t.oppPower, 0) / seg.length);
      poss.push(seg[seg.length - 1].positionNow);
    }
    console.log(`S${String(s + 1).padStart(2)}: tier ${TIER_ORDER[Math.round(median(tiers))].padEnd(8)} medWC ${(median(wcs) * 100).toFixed(0)}%  rating(end) ${median(ratings)}  oppPwr(avg) ${Math.round(median(opps))}  pos(end) ${median(poss)}  gold(end) med ${median(golds)} p10 ${pctile(golds, 0.10)}`);
  }
  const firstPromo = runs.map((r) => r.promoteWeeks[0] ?? Infinity);
  const reached = (t) => runs.filter((r) => r.finalTier >= t).length / runs.length;
  console.log(`First promotion week: median ${median(firstPromo) === Infinity ? "never" : median(firstPromo)} | %runs reaching bronze ${Math.round(reached(1) * 100)}%, silver ${Math.round(reached(2) * 100)}%, gold ${Math.round(reached(3) * 100)}%, platinum ${Math.round(reached(4) * 100)}%`);
  const bank = runs.filter((r) => r.bankruptAt !== null);
  console.log(`Bankruptcy (3wk debt) hit in ${Math.round(bank.length / runs.length * 100)}% of runs${bank.length ? `, median week ${median(bank.map((r) => r.bankruptAt))}` : ""}`);
}

batch("BASE (current formulas, no race synergy)", { selling: true, synergy: 1.0 }, 300, 10);
batch("OPTIMIZED (race synergy ~1.10 maintained)", { selling: true, synergy: 1.10 }, 300, 10);
