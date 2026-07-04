# Battle Simulation Redesign — Plan

The current battle is three independent Bernoulli rolls (one per lane, sigmoid of lane score vs enemy share, 2-of-3 wins) resolved instantly in `buildRaidSimulation` ([src/App.jsx:3227](src/App.jsx)), then *revealed* by `RaidSimulationModal` ([src/App.jsx:3430](src/App.jsx)) as countdown → three checkmarks → banner. The problem isn't the math — the sim-verified balance curve is healthy — it's that the player watches three coin flips land.

Two paths, not mutually exclusive. **They share a presentation layer, so Option B is not throwaway work if A comes later.**

---

## Option B — Visual only: a "match replay" of the existing rolls (recommended first)

**Math unchanged. Zero balance risk. ~1 session of work.**

The key insight: `buildPhaseEvents` ([src/App.jsx:2825](src/App.jsx)) already generates the best writing in the game — hero-specific beats (the Berserker overextending, the Night Vision ambush, weak-link stumbles, pairing callouts) — and it's effectively unseen behind the "Show Details" collapse. Football Manager's 2D match view is exactly this pattern: a *visualization sampled to be consistent with an already-resolved outcome*.

### What it looks like
Replace the checkmark reveal with an auto-playing **beat timeline** per lane:

1. **Lane banner** slides in (Vanguard first), both sides' hero chips visible — yours on the left with avatars/names, an enemy rank of silhouette chips on the right (generated from the opponent's power share + specialisation icon; no new data needed).
2. **A momentum bar** sits between them. 3–5 beats play out per lane, ~700ms each: a beat = one line of `buildPhaseEvents` prose + a chip animation (attacker lunges via CSS transform, defender flashes) + the momentum bar swinging.
3. **Beat sampling rule** (the whole trick): beats are drawn so the momentum ends on the side the roll already decided, with the *path* shaped by the phase win chance. Lane won at 78% → mostly positive beats, momentum walks right. Lane won at 22% → negative beats, then a late surge ("Cira finds the gap no one saw") — upsets *feel* like upsets. Lane lost at 75% → dominance, then collapse beat.
4. **Interjections**: named injury beat when it happened in that lane ("Jace takes the hit — something cracks"), grudge-manager taunt between lanes 1 and 2, ability trigger beats ("Arcane Suppression washes over the rear line").
5. **Lane verdict stamp** (WON/LOST) → next lane → outcome banner (the new AGAINST ALL ODDS / A ROUT copy).
6. **Tap anywhere to fast-forward** — non-negotiable on mobile; second tap skips to outcome.

### Implementation shape
- New pure function `buildBattleScript(simulation)` — consumes `phaseWinChances`, `phaseRolls`, `positionScores`, `injuries`, `abilityResults`, the `buildPhaseEvents` output; returns `[{lane, beats:[{text, actorId, side, momentumDelta, kind}], verdict}]`.
- `RaidSimulationModal` becomes a player for that script (one `useEffect` timer, one momentum state). All changes confined to the modal + the script builder.
- Weakness to accept: it's theatre. Perceptive players may sense it. FM has shipped this successfully for 20 years.

---

## Option A — Mechanical: exchange-based lane combat ("micro-rounds")

**Changes what a battle *is*, makes individual stats legible, calibratable to preserve balance. ~2 sessions.**

### A1 — Lane exchanges (the version I'd actually build)
Each lane resolves as a **best-of-5 series of exchanges** instead of one roll. An exchange is one hero acting against the enemy lane:

- **Who acts**: alternate primary/support hero (already computed in `calcPositionScore`).
- **Exchange resolution**: attacker rolls vs enemy share with noise; outcome ∈ {crit, hit, blocked, faltered}. Stats gain concrete jobs:
  - **Accuracy** → crit chance (a crit wins the exchange outright)
  - **Agility** → chance to void a lost exchange (dodge)
  - **Defense / Magic Resist** → downgrade enemy crits to hits
  - **Leadership / Composure** → *rally*: after losing an exchange, chance the next one gets a bonus (comeback mechanic — this is what makes watching worth it)
  - **Determination** → tiebreaker in drawn series
  - Traits hook naturally: Berserker crits harder when the lane is behind; Coward's falter chance doubles when the series is 0–2; Glass Cannon crits more, gets injured on lost exchanges.
- **THE calibration trick (what keeps this safe)**: pick the per-exchange win probability `p` such that P(win ≥3 of 5) equals the current sigmoid phase chance. That's a closed-form lookup (invert the binomial). The macro balance curve — the thing the 300-run simulation validated — is *provably unchanged*; only variance texture and attribution change.
- **Attribution byproducts**: injuries land on the hero who lost the deciding exchange (feeds the named-injury system with a real cause), Form swings can key off personal exchange record instead of lane result, star-performer selection becomes real instead of sampled.
- **Persisted output unchanged**: `won`, `phasesWon`, gold/XP/injury pipeline all keep their shapes — the weekly economy is untouched.
- Presentation: **exactly Option B's timeline**, except beats are real events instead of sampled ones. Build B first, swap the script source later.

### A2 — Full auto-battler (6v6 units, HP, initiative) — not recommended now
Generate 6 enemy units from town power + manager archetype, initiative by Agility, damage Strength/Magic Power vs Defense/Magic Resist, morale breaks, positional targeting. Honest assessment: this rebalances the entire game (every stat, trait, tier power band, injury rate re-tuned from scratch), invalidates the verified curve, roughly quadruples battle code, and turns a management game into a tactics game — the fun moves from *preparation* (squad building, counters, rotation) to *execution*, which the player doesn't even control in an auto-battler. Only worth it if the game's identity is meant to pivot. Park it.

---

## Recommendation & sequence

1. **Ship B now** — biggest feel-per-effort win in the codebase, zero balance risk, and the script-player UI is reusable.
2. **Then A1** — mechanically meaningful, stat-legible, balance-neutral by construction.
3. **A2 only on a deliberate identity pivot.**

One extra nudge either way: whatever plays in the modal should also produce a 2–3 line **"match report"** appended to the log/chronicle, so the drama persists after the modal closes.
