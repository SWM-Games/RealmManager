// Engine tests — the pure combat/economy core of Realm Manager.
// Run with `npm test`. The statistical tests use large N and generous
// tolerances so they are deterministic in practice.
import { describe, it, expect } from "vitest";
import {
  generateHero, buildRaidSimulation, calcFormationRating, calcPositionScore,
  calcSpecPenalty, growHeroStats, calcTierPosition, weeklyRankIncome,
  applyHealScar, calcMatchScore, generateTierTowns, generateScheduledOpponent,
  managerTaunt, generateRivalRoster, rivalAskingPrice, ENEMY_ABILITIES, checkAbility,
  TIERS, TIER_ORDER, TIER_POSITION_BONUS, POS_KEYS, MAX_LEVEL,
  TIER_BUILD_SLOTS, builtInTier, buildingCapReached,
  BUILDINGS, migrateBuildings,
  bestPositionFor, PHYSICAL_STATS, generateStartingSquad,
  canRetrain, retrainCost, naturalLaneFor, RETRAIN_WEEKS,
  legendMoraleBonus, realmSummary,
} from "./App.jsx";

// ── fixtures ────────────────────────────────────────────────────────────────
function makeFormation(tierId = "iron") {
  const roles = { Vanguard: ["Warrior", "Paladin"], Skirmisher: ["Ranger", "Rogue"], Arbiter: ["Mage", "Cleric"] };
  const f = {};
  let id = 1;
  POS_KEYS.forEach((pos) => {
    f[pos] = roles[pos].map((role) => generateHero(id++, false, false, false, role, null, tierId));
  });
  return f;
}
function makeEnemy(power, overrides = {}) {
  return { name: "Testholm", power, difficulty: 1, tierId: "iron", abilities: [], specialisation: null, ...overrides };
}
const noBuildings = [];

// ── exchange engine calibration ─────────────────────────────────────────────
describe("exchange engine", () => {
  it("series outcome matches per-lane phase chance (calibration is exact)", () => {
    // One fixed formation vs one fixed enemy; phase chances are deterministic
    // given scores, so observed lane win rates must converge to them.
    const formation = makeFormation();
    const enemy = makeEnemy(90);
    const N = 8000;
    const laneWins = { Vanguard: 0, Skirmisher: 0, Arbiter: 0 };
    let chances = null;
    for (let i = 0; i < N; i++) {
      const sim = buildRaidSimulation(formation, enemy, noBuildings, 1);
      chances = sim.phaseWinChances;
      POS_KEYS.forEach((p) => { if (sim.phaseRolls[p]) laneWins[p]++; });
    }
    POS_KEYS.forEach((p) => {
      const observed = laneWins[p] / N;
      // 8000 trials → 3σ ≈ 1.7pp; allow 2.5pp
      expect(Math.abs(observed - chances[p])).toBeLessThan(0.025);
    });
  });

  it("lane series scores are consistent with the lane verdict", () => {
    const formation = makeFormation();
    const enemy = makeEnemy(90);
    for (let i = 0; i < 200; i++) {
      const sim = buildRaidSimulation(formation, enemy, noBuildings, 1);
      POS_KEYS.forEach((p) => {
        const lb = sim.laneBattle[p];
        expect(lb.wins + lb.losses).toBeLessThanOrEqual(5);
        expect(Math.max(lb.wins, lb.losses)).toBe(3); // first to 3 clinches
        expect(lb.wins === 3).toBe(sim.phaseRolls[p]);
        lb.beats.forEach((b) => {
          expect(typeof b.text).toBe("string");
          expect(b.text.length).toBeGreaterThan(0);
        });
      });
    }
  });

  it("battle is won iff 2+ lanes are won, and winChance is within [0,1]", () => {
    const formation = makeFormation();
    const enemy = makeEnemy(90);
    for (let i = 0; i < 200; i++) {
      const sim = buildRaidSimulation(formation, enemy, noBuildings, 1);
      const lanesWon = POS_KEYS.filter((p) => sim.phaseRolls[p]).length;
      expect(sim.won).toBe(lanesWon >= 2);
      expect(sim.winChance).toBeGreaterThan(0);
      expect(sim.winChance).toBeLessThan(1);
    }
  });

  it("phase chances respect the cap and floor", () => {
    const formation = makeFormation();
    const weakEnemy = makeEnemy(10);
    const monsterEnemy = makeEnemy(2000, { difficulty: 5 });
    const simEasy = buildRaidSimulation(formation, weakEnemy, noBuildings, 1);
    const simHard = buildRaidSimulation(formation, monsterEnemy, noBuildings, 1);
    POS_KEYS.forEach((p) => {
      expect(simEasy.phaseWinChances[p]).toBeLessThanOrEqual(0.85);
      expect(simHard.phaseWinChances[p]).toBeGreaterThanOrEqual(0.15);
    });
  });
});

// ── growth ──────────────────────────────────────────────────────────────────
describe("growHeroStats", () => {
  it("gets within a few points of Potential by MAX_LEVEL (pre-audit bug left ~30-point gaps)", () => {
    for (let trial = 0; trial < 30; trial++) {
      let hero = generateHero(1, false, false, false, "Warrior", null, "platinum");
      const pot = hero.stats.Potential;
      for (let lv = hero.level + 1; lv <= MAX_LEVEL; lv++) {
        hero = { ...hero, stats: growHeroStats(hero, lv, noBuildings), level: lv };
      }
      // The final level closes any remaining gap — Potential is exact at 15
      ["Strength", "Magic Resist", "Tactics", "Charisma"].forEach((s) => {
        expect(hero.stats[s]).toBe(pot);
      });
    }
  });

  it("never exceeds Potential", () => {
    let hero = generateHero(1, false, false, false, null, null, "iron");
    const pot = hero.stats.Potential;
    for (let lv = hero.level + 1; lv <= MAX_LEVEL; lv++) {
      hero = { ...hero, stats: growHeroStats(hero, lv, noBuildings), level: lv };
      ["Strength", "Agility", "Magic Resist"].forEach((s) => {
        expect(hero.stats[s]).toBeLessThanOrEqual(pot);
      });
    }
  });
});

// ── specialisations ─────────────────────────────────────────────────────────
describe("calcSpecPenalty", () => {
  const spec = { counter: "Arbiter", penalty: 0.14, injuryBonus: 0, reason: "test" };

  it("fires when the counter lane is empty", () => {
    const f = makeFormation();
    f.Arbiter = [null, null];
    expect(calcSpecPenalty(spec, f)).not.toBeNull();
  });

  it("does not fire when the counter lane pulls its weight", () => {
    const f = makeFormation();
    // Arbiter staffed with proper Mage+Cleric — comparable to other lanes
    const pen = calcSpecPenalty(spec, f);
    // With a balanced formation the counter lane is ≥80% of avg almost always;
    // assert on the actual computed relation rather than assuming
    const laneScore = (pos) => calcPositionScore((f[pos] || []).filter(Boolean), pos).score;
    const avg = POS_KEYS.reduce((a, p) => a + laneScore(p), 0) / POS_KEYS.length;
    if (laneScore("Arbiter") >= avg * 0.8) expect(pen).toBeNull();
    else expect(pen).not.toBeNull();
  });

  it("returns null for no spec", () => {
    expect(calcSpecPenalty(null, makeFormation())).toBeNull();
  });
});

// ── economy ─────────────────────────────────────────────────────────────────
describe("weeklyRankIncome", () => {
  it("pays the position gradient on top of tier base", () => {
    expect(weeklyRankIncome("iron", 1)).toBe(TIERS.iron.tributeBase + TIER_POSITION_BONUS[0]);
    expect(weeklyRankIncome("iron", 8)).toBe(TIERS.iron.tributeBase);
    expect(weeklyRankIncome("platinum", 1)).toBe(TIERS.platinum.tributeBase + TIER_POSITION_BONUS[0]);
  });
  it("defaults to bottom-rank income when position is missing", () => {
    expect(weeklyRankIncome("iron", undefined)).toBe(TIERS.iron.tributeBase);
  });
  it("income strictly increases with rank within a tier", () => {
    for (let pos = 1; pos < 5; pos++) {
      expect(weeklyRankIncome("gold", pos)).toBeGreaterThan(weeklyRankIncome("gold", pos + 1));
    }
  });
});

describe("calcTierPosition", () => {
  it("counts only towns with strictly more wins (player wins ties)", () => {
    const table = { A: { wins: 5 }, B: { wins: 3 }, C: { wins: 3 } };
    expect(calcTierPosition(3, 0.5, table, [])).toBe(2);
    expect(calcTierPosition(6, 0.9, table, [])).toBe(1);
    expect(calcTierPosition(0, 0, table, [])).toBe(4);
  });
  it("handles an empty table", () => {
    expect(calcTierPosition(0, 0, {}, [])).toBe(4);
  });
});

// ── injuries & scars ────────────────────────────────────────────────────────
describe("applyHealScar", () => {
  const injured = () => ({
    name: "Test Hero", traits: [], morale: 70,
    stats: { Strength: 40, Agility: 40, Endurance: 40, Accuracy: 40, Defense: 40, "Magic Power": 40, "Magic Resist": 40, Potential: 60 },
    injury: { name: "Cracked ribs", from: "Testholm", week: 3 },
    injuryHistory: [],
  });

  it("clears the injury and archives it in history", () => {
    const healed = applyHealScar(injured(), () => {});
    expect(healed.injury).toBeNull();
    expect(healed.injuryHistory[0].name).toBe("Cracked ribs");
  });

  it("caps history at 3 entries", () => {
    const h = injured();
    h.injuryHistory = [{ name: "a" }, { name: "b" }, { name: "c" }];
    const healed = applyHealScar(h, () => {});
    expect(healed.injuryHistory.length).toBe(3);
    expect(healed.injuryHistory[0].name).toBe("Cracked ribs");
  });

  it("scars at roughly the design rate and never raises stats", () => {
    let scars = 0;
    for (let i = 0; i < 2000; i++) {
      const before = injured();
      const healed = applyHealScar(before, () => {});
      const statDropped = Object.keys(before.stats).some((s) => healed.stats[s] < before.stats[s]);
      const traitGained = healed.traits.length > before.traits.length;
      if (statDropped || traitGained) scars++;
      Object.keys(before.stats).forEach((s) => {
        expect(healed.stats[s]).toBeLessThanOrEqual(before.stats[s]);
      });
    }
    const rate = scars / 2000;
    expect(rate).toBeGreaterThan(0.10); // target 15%
    expect(rate).toBeLessThan(0.20);
  });
});

// ── events ──────────────────────────────────────────────────────────────────
describe("calcMatchScore trait chemistry", () => {
  const hero = (traits) => ({
    traits,
    stats: { Strength: 50, Endurance: 50, Agility: 50, Accuracy: 50 },
  });
  const arenaEvent = { theme: "arena", stats: ["Strength", "Endurance"] };

  it("a Coward scores worse than a Brave hero on the same arena event", () => {
    const brave = calcMatchScore(hero(["Brave"]), arenaEvent);
    const coward = calcMatchScore(hero(["Coward"]), arenaEvent);
    const neutral = calcMatchScore(hero([]), arenaEvent);
    expect(brave).toBeGreaterThan(neutral);
    expect(coward).toBeLessThan(neutral);
  });

  it("never returns a non-positive score", () => {
    const cursedCoward = hero(["Coward"]);
    cursedCoward.stats = { Strength: 1, Endurance: 1 };
    expect(calcMatchScore(cursedCoward, arenaEvent)).toBeGreaterThan(0);
  });
});

// ── league & rivals ─────────────────────────────────────────────────────────
describe("towns and rivals", () => {
  it("every generated town has a manager and a grudge book", () => {
    const towns = generateTierTowns("iron");
    expect(towns.length).toBe(7);
    towns.forEach((t) => {
      expect(t.manager?.name).toBeTruthy();
      expect(t.h2h).toEqual({ wins: 0, losses: 0 });
    });
  });

  it("scheduled opponents carry fog state and a truthful power band", () => {
    const towns = generateTierTowns("bronze");
    for (let i = 0; i < 50; i++) {
      const opp = generateScheduledOpponent(1, {}, towns, "bronze");
      expect(opp.scouted).toBe(false);
      expect(opp.powerBand[0]).toBeLessThanOrEqual(opp.power);
      expect(opp.powerBand[1]).toBeGreaterThanOrEqual(opp.power);
    }
  });

  it("manager taunts track the head-to-head record", () => {
    const manager = { name: "Serra Vayne", archetype: "schemer", title: "the Schemer" };
    const ahead = managerTaunt(manager, { wins: 0, losses: 3 });
    const behind = managerTaunt(manager, { wins: 3, losses: 0 });
    const even = managerTaunt(manager, { wins: 1, losses: 1 });
    expect(ahead).not.toBe(behind);
    expect(even).not.toBe(ahead);
  });
});

// ── enemy abilities ─────────────────────────────────────────────────────────
// Regression guard for the auto-fail bug: thresholds must stay COUNTERABLE.
// A tier-calibrated squad should mitigate sometimes and get punished sometimes;
// if any ability becomes automatic in either direction, this fails.
describe("enemy ability thresholds", () => {
  it("every ability is winnable and losable by a tier-appropriate squad", () => {
    const N = 150;
    for (const tier of ["bronze", "gold", "platinum"]) {
      for (const ability of ENEMY_ABILITIES) {
        let pass = 0, hard = 0;
        for (let i = 0; i < N; i++) {
          const [town] = generateTierTowns(tier);
          const roster = generateRivalRoster(town, tier);
          const formation = { Vanguard: roster.slice(0, 2), Skirmisher: roster.slice(2, 4), Arbiter: roster.slice(4, 6) };
          const outcome = checkAbility(ability, formation, tier);
          if (outcome === "pass") pass++;
          if (outcome === "hard") hard++;
        }
        const passRate = pass / N, hardRate = hard / N;
        // generic squads: neither auto-mitigate nor auto-suffer
        expect(passRate, `${ability.id}@${tier} pass rate`).toBeLessThan(0.90);
        expect(hardRate, `${ability.id}@${tier} hard rate`).toBeLessThan(0.75);
        expect(passRate + (N - pass - hard) / N, `${ability.id}@${tier} mitigation reachable`).toBeGreaterThan(0.20);
      }
    }
  });
});

// ── rival rosters & poaching ────────────────────────────────────────────────
describe("generateRivalRoster", () => {
  it("produces six lane-covering notables calibrated to the town's power", () => {
    for (let trial = 0; trial < 20; trial++) {
      const [town] = generateTierTowns("silver");
      const roster = generateRivalRoster(town, "silver");
      expect(roster.length).toBe(6);
      // two heroes per lane, ideal roles
      expect(roster.filter((h) => ["Warrior", "Paladin"].includes(h.role)).length).toBe(2);
      expect(roster.filter((h) => ["Ranger", "Rogue"].includes(h.role)).length).toBe(2);
      expect(roster.filter((h) => ["Mage", "Cleric"].includes(h.role)).length).toBe(2);
      // lanes sum near the power the player has been fighting
      const formation = {
        Vanguard: roster.slice(0, 2), Skirmisher: roster.slice(2, 4), Arbiter: roster.slice(4, 6),
      };
      const total = POS_KEYS.reduce((a, p) => a + calcPositionScore(formation[p], p).score, 0);
      expect(total).toBeGreaterThan(town.power * 0.55);
      expect(total).toBeLessThan(town.power * 1.75);
      // stats stay legal and Potential covers them
      roster.forEach((h) => {
        expect(h.stats.Potential).toBeLessThanOrEqual(99);
        expect(h.stats.Strength).toBeLessThanOrEqual(h.stats.Potential);
        expect(h.value).toBeGreaterThan(0);
      });
    }
  });
});

describe("rivalAskingPrice", () => {
  const town = (arch, h2h = { wins: 0, losses: 0 }) => ({
    manager: { name: "T", archetype: arch, title: "t" }, h2h, power: 100,
  });
  const hero = () => {
    const h = generateHero(1, false, false, false, "Warrior", null, "bronze");
    return h;
  };

  it("always demands a premium over base value", () => {
    for (let i = 0; i < 30; i++) {
      const h = hero();
      expect(rivalAskingPrice(town("butcher"), h)).toBeGreaterThan(h.value);
    }
  });
  it("gamblers sell cheaper than schemers", () => {
    const h = hero();
    expect(rivalAskingPrice(town("gambler"), h)).toBeLessThan(rivalAskingPrice(town("schemer"), h));
  });
  it("beating a rival raises their asking price (nobody sells cheap to their tormentor)", () => {
    const h = hero();
    const neutral = rivalAskingPrice(town("butcher", { wins: 0, losses: 0 }), h);
    const tormented = rivalAskingPrice(town("butcher", { wins: 4, losses: 0 }), h);
    expect(tormented).toBeGreaterThan(neutral);
  });
  it("the talisman costs dearly", () => {
    const h = hero();
    expect(rivalAskingPrice(town("butcher"), h, true))
      .toBeGreaterThan(rivalAskingPrice(town("butcher"), h, false));
  });
});

// ── formation rating ────────────────────────────────────────────────────────
describe("calcFormationRating", () => {
  it("applies per-lane synergy multipliers to the effective rating", () => {
    const f = makeFormation();
    const { raw, effective, analysis } = calcFormationRating(f);
    expect(raw).toBeGreaterThan(0);
    // No race synergy in a random formation most of the time → laneMults 1.0
    if (!analysis.raceSynergy) expect(effective).toBe(raw);
  });
});

// ── building tier caps ──────────────────────────────────────────────────────
describe("building tier caps", () => {
  it("caps builds per tier and grandfathers over-cap saves", () => {
    const oneIron = [
      { id: "barracks", tierRequired: "iron", built: true },
      { id: "tavern", tierRequired: "iron", built: false },
    ];
    expect(builtInTier(oneIron, "iron")).toBe(1);
    expect(buildingCapReached(oneIron, "iron")).toBe(true); // iron slots = 1

    const emptyIron = [{ id: "barracks", tierRequired: "iron", built: false }];
    expect(buildingCapReached(emptyIron, "iron")).toBe(false);

    const silver = [
      { id: "trainyard", tierRequired: "silver", built: true },
      { id: "network", tierRequired: "silver", built: false },
      { id: "trading", tierRequired: "silver", built: false },
    ];
    expect(buildingCapReached(silver, "silver")).toBe(false); // 1 < 2
    silver[1].built = true;
    expect(buildingCapReached(silver, "silver")).toBe(true); // 2 >= 2

    // grandfathered: 2 built in a 1-slot tier still reports full (can't add more)
    const grandfathered = [
      { id: "barracks", tierRequired: "iron", built: true },
      { id: "tavern", tierRequired: "iron", built: true },
    ];
    expect(buildingCapReached(grandfathered, "iron")).toBe(true);
    expect(TIER_BUILD_SLOTS.silver).toBe(2);
  });
});

// ── infirmary injury reduction ───────────────────────────────────────────────
describe("Infirmary injury reduction", () => {
  it("cuts injuries roughly 30% vs no infirmary", () => {
    const enemy = makeEnemy(90);
    const infirmary = [{ id: "infirmary", tierRequired: "bronze", built: true }];
    // Moderate fatigue + large N keeps injuries below the 2-per-raid cap, so the
    // per-hero -30% shows through in the count (a saturated cap would mask it).
    const N = 2000;
    const countInjuries = (buildings) => {
      let total = 0;
      for (let i = 0; i < N; i++) {
        const f = makeFormation("iron");
        POS_KEYS.forEach(p => f[p].forEach(h => { h.fatigue = 60; }));
        const sim = buildRaidSimulation(f, enemy, buildings, 1);
        total += sim?.injuries?.length || 0;
      }
      return total;
    };
    const base = countInjuries(noBuildings);
    const withInf = countInjuries(infirmary);
    expect(base).toBeGreaterThan(0);
    // expect ~0.70x; allow a generous band for RNG
    expect(withInf).toBeLessThan(base * 0.85);
    expect(withInf).toBeGreaterThan(base * 0.50);
  });
});

describe("migrateBuildings", () => {
  it("refreshes static fields from BUILDINGS while preserving built flags", () => {
    // simulate an old save: stale desc + a couple built
    const oldSave = BUILDINGS.map(b => ({
      ...b,
      desc: "STALE OLD DESCRIPTION",
      built: b.id === "barracks" || b.id === "infirmary",
    }));
    const migrated = migrateBuildings(oldSave);
    // same set of buildings, in BUILDINGS order
    expect(migrated.map(b => b.id)).toEqual(BUILDINGS.map(b => b.id));
    // static fields come from current BUILDINGS, not the stale save
    const infDef = BUILDINGS.find(b => b.id === "infirmary");
    const infMig = migrated.find(b => b.id === "infirmary");
    expect(infMig.desc).toBe(infDef.desc);
    expect(infMig.desc).not.toBe("STALE OLD DESCRIPTION");
    // built flags preserved
    expect(infMig.built).toBe(true);
    expect(migrated.find(b => b.id === "barracks").built).toBe(true);
    expect(migrated.find(b => b.id === "tavern").built).toBe(false);
    // missing save -> all unbuilt, full definition set
    const fresh = migrateBuildings(undefined);
    expect(fresh.length).toBe(BUILDINGS.length);
    expect(fresh.every(b => b.built === false)).toBe(true);
    // a building absent from the save defaults to built:false
    const partial = [{ id: "barracks", built: true }];
    const m2 = migrateBuildings(partial);
    expect(m2.find(b => b.id === "barracks").built).toBe(true);
    expect(m2.find(b => b.id === "tavern").built).toBe(false);
  });
});

// ── hero id hygiene ──────────────────────────────────────────────────────────
// Hero ids flow through truthiness checks (leader lookups, serialized-preset
// slot counts), so id 0 reads as "empty slot" / "no leader". The star foundling
// once shipped with id 0 — a fielded foundling made saved presets show 5/6 and
// an appointed foundling-leader silently gave no bonuses.
describe("starting squad ids", () => {
  it("never issues a falsy hero id", () => {
    // (uniqueness isn't asserted: slots 4-7 draw Date.now()+i+rand ids whose
    // ranges overlap, so rare collisions are a separate pre-existing issue)
    for (let i = 0; i < 50; i++) {
      generateStartingSquad().forEach(h => expect(h.id).toBeTruthy());
    }
  });
});

// ── scheduled opponent rotation ──────────────────────────────────────────────
// Playtest: "next week's opponent is always the same one". With ~7 rival towns
// a uniform pick repeats back-to-back every few weeks; generateScheduledOpponent
// must exclude the just-fought town (excludeName) unless it's the only town.
describe("scheduled opponent rotation", () => {
  it("never schedules the just-fought town back-to-back", () => {
    const towns = generateTierTowns("iron");
    const exclude = towns[0].name;
    for (let i = 0; i < 300; i++) {
      const opp = generateScheduledOpponent(1, {}, towns, "iron", exclude);
      expect(opp.name).not.toBe(exclude);
    }
  });
  it("still returns a match when the excluded town is the only one", () => {
    const towns = generateTierTowns("iron").slice(0, 1);
    const opp = generateScheduledOpponent(1, {}, towns, "iron", towns[0].name);
    expect(opp?.name).toBe(towns[0].name);
  });
});

// ── best-position mapping ────────────────────────────────────────────────────
// The Squad tab's "Best" label / position pills / filter use bestPositionFor.
// Raw cross-lane score comparisons are biased (unequal lane weight sums) and
// noisy (stat generation is role-agnostic) — the probe showed ~40% of Rangers
// labelled Vanguard/Arbiter. bestPositionFor normalises by lane weight sum and
// only lets another lane displace the natural lane on a >5% margin. Measured:
// 92–96% natural-lane mapping, and 97.6% of physically-halved Warriors still
// flip off Vanguard (the real signal the label exists to surface).
describe("bestPositionFor", () => {
  const IDEAL = {
    Warrior: "Vanguard", Paladin: "Vanguard",
    Ranger: "Skirmisher", Rogue: "Skirmisher",
    Mage: "Arbiter", Cleric: "Arbiter",
  };
  it("maps the large majority of every role to its natural lane", () => {
    const N = 600;
    Object.entries(IDEAL).forEach(([role, lane]) => {
      let hit = 0;
      for (let i = 0; i < N; i++) {
        if (bestPositionFor(generateHero(i, false, false, false, role, null, "silver")) === lane) hit++;
      }
      // measured 92–96%; 85% floor leaves RNG room without letting the old
      // ~60% Skirmisher regression back in
      expect(hit / N, `${role} → ${lane}`).toBeGreaterThan(0.85);
    });
  });
  it("still flips a physically decayed hero off their natural lane", () => {
    const N = 300;
    let flips = 0;
    for (let i = 0; i < N; i++) {
      const h = generateHero(i, false, false, false, "Warrior", null, "silver");
      PHYSICAL_STATS.forEach(s => { h.stats[s] = Math.max(10, Math.round(h.stats[s] * 0.5)); });
      if (bestPositionFor(h) !== "Vanguard") flips++;
    }
    // measured 97.6% — the margin must not be so wide it hides real decay
    expect(flips / N).toBeGreaterThan(0.80);
  });
});

// ── retraining ───────────────────────────────────────────────────────────────
describe("retraining eligibility", () => {
  const trainyard = [{ id: "trainyard", tierRequired: "silver", built: true }];
  const mkHero = (over = {}) => ({
    ...generateHero(1, false, false, false, "Rogue", null, "iron"),
    injured: false, awayWeeks: 0, retired: false,
    contractWeeksLeft: 42, value: 1000, ...over,
  });

  it("natural lane derives from role", () => {
    expect(naturalLaneFor("Warrior")).toBe("Vanguard");
    expect(naturalLaneFor("Paladin")).toBe("Vanguard");
    expect(naturalLaneFor("Ranger")).toBe("Skirmisher");
    expect(naturalLaneFor("Rogue")).toBe("Skirmisher");
    expect(naturalLaneFor("Mage")).toBe("Arbiter");
    expect(naturalLaneFor("Cleric")).toBe("Arbiter");
  });

  it("cost is 40% of value with a 100g floor", () => {
    expect(retrainCost(mkHero({ value: 1000 }))).toBe(400);
    expect(retrainCost(mkHero({ value: 0 }))).toBe(100);
  });

  it("allows an eligible hero", () => {
    expect(canRetrain(mkHero(), 5000, 1, trainyard).ok).toBe(true);
  });

  it("blocks every ineligible state", () => {
    const cases = [
      [mkHero(), 5000, 1, []],                                       // no trainyard
      [mkHero({ injured: true }), 5000, 1, trainyard],               // injured
      [mkHero({ awayWeeks: 2 }), 5000, 1, trainyard],                // away
      [mkHero({ retired: true }), 5000, 1, trainyard],               // retired
      [mkHero({ contractWeeksLeft: RETRAIN_WEEKS }), 5000, 1, trainyard], // short contract
      [mkHero({ retrainedSeason: 1 }), 5000, 1, trainyard],          // same season
      [mkHero({ value: 1000 }), 399, 1, trainyard],                  // can't afford
    ];
    cases.forEach(([h, gold, season, b]) => {
      const r = canRetrain(h, gold, season, b);
      expect(r.ok).toBe(false);
      expect(r.reason).toBeTruthy();
    });
  });

  it("allows a repeat retrain in a later season", () => {
    expect(canRetrain(mkHero({ retrainedSeason: 1 }), 5000, 2, trainyard).ok).toBe(true);
  });
});

// ── Hall of Legends morale ────────────────────────────────────────────────────
// Regression guard: this mechanic shipped dead once (retirees were dropped from
// the roster before the bonus read it), so lock the shape — non-empty roll must
// give a positive, level-scaled, capped bonus.
describe("Hall of Legends morale", () => {
  it("empty or missing roll gives no bonus", () => {
    expect(legendMoraleBonus([])).toBe(0);
    expect(legendMoraleBonus(undefined)).toBe(0);
    expect(legendMoraleBonus(null)).toBe(0);
  });

  it("a single legend gives at least +1, scaling with level", () => {
    expect(legendMoraleBonus([{ level: 0 }])).toBe(1);      // 1 + floor(0/3)
    expect(legendMoraleBonus([{ level: 6 }])).toBe(3);      // 1 + floor(6/3)
    expect(legendMoraleBonus([{ level: 12 }])).toBe(5);     // 1 + floor(12/3)
  });

  it("multiple legends accumulate", () => {
    expect(legendMoraleBonus([{ level: 3 }, { level: 3 }])).toBe(4); // (1+1)+(1+1)
  });

  it("caps at +20 no matter how many legends retire", () => {
    const many = Array.from({ length: 20 }, () => ({ level: 15 })); // 6 each → 120 raw
    expect(legendMoraleBonus(many)).toBe(20);
  });

  it("tolerates a missing level field", () => {
    expect(legendMoraleBonus([{}])).toBe(1);
  });
});

// ── Home screen realm summary ─────────────────────────────────────────────────
describe("realmSummary", () => {
  it("returns null when there is no save or no town name", () => {
    expect(realmSummary(null)).toBe(null);
    expect(realmSummary({})).toBe(null);
    expect(realmSummary({ gold: 500 })).toBe(null);
  });

  it("formats tier, season, week and gold from the blob", () => {
    const s = realmSummary({ townName: "Ironveil", townColor: "#3C5A78", playerTier: "silver", season: 3, seasonWeek: 12, gold: 14200 });
    expect(s.name).toBe("Ironveil");
    expect(s.color).toBe("#3C5A78");
    expect(s.line).toBe("Silver · Season 3, Week 12 · 14,200g");
  });

  it("falls back safely on a sparse blob", () => {
    const s = realmSummary({ townName: "Duskhollow" });
    expect(s.color).toBe("#8A6D3B");
    expect(s.line).toBe("Iron · Season 1, Week 1 · 0g");
  });
});
