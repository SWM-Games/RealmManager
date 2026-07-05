# Buildings: per-tier caps + Infirmary buff — design

*Spec date: 2026-07-05. Outcome of the "Buildings as a system" roadmap review.*

## Problem

All 11 buildings are wired and useful, but they are permanent one-time buys
totalling ~17,300g across a campaign. Because gold plateaus at 80–95k, by
mid-game every building is an eventual auto-buy with no opportunity cost — the
only real decision is build order, and the genuine tension is front-loaded into
Iron/Bronze. Separately, the **Infirmary** ("heal 1 week faster") is the
weakest pick: marginal, and dominated by the Recovery Lodge at the same tier.

## Goals

1. Restore a genuine either/or to buildings via a **per-tier build cap**, so the
   player commits to an identity at each tier rather than owning everything.
2. Buff **Infirmary** so its tier becomes a real 1-of-2 choice against the
   Recovery Lodge.
3. Preserve the sim-calibrated economy targets (bankruptcy ~1–3%, gold plateau
   80–95k, platinum around season 7–9).

Non-goals: upkeep/maintenance costs, a build-order guidance UI, any change to
the other nine buildings' effects.

## Design

### 1. Per-tier build cap

Fixed build slots per tier:

| Tier | Buildings available | Slots |
|---|---|---|
| Iron | Barracks, Tavern | 1 |
| Bronze | Infirmary, Recovery Lodge | 1 |
| Silver | Training Grounds, Talent Network, Trading Post | 2 |
| Gold | Grand Bazaar, Observatory | 1 |
| Platinum | Elite Sanctum, Hall of Legends | 1 |

Total buildable: **6 of 11**.

- Slot counts live in a new constant `TIER_BUILD_SLOTS = { iron:1, bronze:1,
  silver:2, gold:1, platinum:1 }`.
- The number built in a tier is *derived* from `buildings.filter(b =>
  b.tierRequired===tier && b.built).length`. No new per-building save field.
- `buildBuilding(b)` gains a guard: refuse if `builtInTier(b.tierRequired) >=
  effectiveCap(b.tierRequired)` (see grandfathering). This is defence-in-depth
  in addition to the UI gate.

### 2. Demolish & rebuild

- A `demolishBuilding(b)` action sets that building's `built` back to `false`.
  **No gold refund.** Adds a log line.
- Rebuilding costs full price via the normal `buildBuilding` path.
- Bazaar/Sanctum spawn their market heroes on *build*; demolishing does not
  remove already-spawned heroes and rebuilding re-triggers the spawn. Accepted —
  minor and not exploitable for meaningful gold (heroes still cost their price).
- Confirmation: demolish is behind a confirm step in the UI (it destroys sunk
  gold), matching the game's other destructive actions.

### 3. Infirmary buff

Infirmary becomes the durability pillar:

- **−30% injury chance** for the player's heroes, applied in
  `buildRaidSimulation`'s injury roll: after the existing trait multipliers,
  `if (hasInfirmary) chance *= 0.70;` (`hasInfirmary` derived from the
  `buildings` arg, mirroring `hasBarracks`).
- **Keeps** the existing 1-week-faster healing (`applyRaidResult`, the
  `injuryWeeks = Math.max(1, injuryWeeks-1)` branch — unchanged).

Recovery Lodge is unchanged (fatigue/rotation pillar).

### 4. Existing saves — grandfather

Saves may already have more than the cap built in a tier. The effective cap is
`max(builtInTier, TIER_BUILD_SLOTS[tier])`:

- Nothing is demolished on load; players keep what they built.
- In an over-cap tier the player simply can't build *more* (already at/over cap),
  and if they demolish down to the slot count the normal cap takes over.
- No migration code required beyond the `effectiveCap` helper; the buildings
  array already persists with `built` flags.
- **"Barracks pre-built" legacy boon**: this boon starts a run with Barracks
  built, which now occupies the single Iron slot. That is intended and
  consistent — the player has spent their Iron pick on Barracks and would need
  to demolish it to build Tavern instead. No special-casing needed.

### 5. UI (Town tab)

- Each tier group shows a slot counter, e.g. **"Bronze · 1 of 1 built"** (or
  "2 of 2" grandfathered).
- Unbuilt buildings in a full tier: replace the Build button with a muted
  "Slot full — demolish to swap" note instead of the affordability button.
- Built buildings gain a small "Demolish" control (with confirm).
- Locked-tier cards unchanged (already show "Promote to [tier]").

### 6. Balance sim mirror (`scripts/balance-sim.mjs`)

- The AI build loop (currently "buy the first unbuilt affordable building with a
  1500g buffer") must respect `TIER_BUILD_SLOTS`: skip a candidate if its tier
  is already at the slot cap. Give the AI a simple priority order per tier so it
  picks sensible buildings (e.g. Iron→barracks, Bronze→lodge, Silver→trading+
  trainyard, Gold→observatory, Platinum→legends) rather than array order.
- Mirror the Infirmary injury-chance cut: in the injury roll, apply
  `ch *= 0.70` when `built.has("infirmary")` (in addition to the existing
  injuryWeeks reduction).
- Re-run `npm run sim`. Confirm bankruptcy ~1–3%, gold plateau 80–95k, platinum
  ~season 7–9. If capping to 6 buildings makes the run too hard, tune (in order
  of preference): the AI's building priority, then the Infirmary factor, then a
  slot count.

### 7. Tests (`src/engine.test.jsx`)

- `buildBuilding` respects the per-tier cap (build two Iron buildings → second
  refused; grandfathered save with 2 Iron built is left intact).
- `demolishBuilding` frees a slot so a different same-tier building can be built.
- Infirmary reduces injury rate: over N simulated raids with fatigued heroes,
  injuries-with-Infirmary < injuries-without (statistical, tolerance-banded like
  the existing calibration tests).

## Risks

- **Difficulty drift**: 6 buildings < 11 buildings of help → harder campaign.
  Mitigated by the sim re-run and tuning order above.
- **Feel-bad on grandfathered saves**: none — nothing is removed.
- **Demolish griefing own economy**: no refund means demolishing is purely a
  cost; not exploitable.
