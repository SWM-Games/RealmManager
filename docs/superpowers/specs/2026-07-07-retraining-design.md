# Retraining (class change) + strict role→lane mapping — design

Date: 2026-07-07 · Status: approved-pending-review · Owner: playtest feedback

## Problem

1. Position labels/filters use a stat-based "best lane", so a Skirmisher-native
   hero (Ranger/Rogue) can display and filter as Vanguard. Even after the
   normalisation fix this happens for genuine stat outliers, and playtesting
   confirms it reads as a bug, not a feature.
2. There is no way to act on that signal: a hero whose attributes clearly
   favour another lane is stuck with their role's +10% ideal bonus pointing at
   the wrong lane.

The two problems cancel out: make the labels/filters strictly role-derived,
and turn the stat signal into a **retraining** prompt instead.

## Part 1 — strict role→lane mapping

- Squad position pills, the position filter, and the bench "Best" label become
  pure role→lane (Warrior/Paladin→Vanguard, Ranger/Rogue→Skirmisher,
  Mage/Cleric→Arbiter). This matches the Hire tab, which already maps by role.
- `bestPositionFor(hero)` (App.jsx ~1930) is retained but repurposed: it no
  longer feeds labels/filters. When its result differs from the hero's natural
  lane (the existing >5% weight-normalised margin), the hero is a **retrain
  candidate**.
- Retrain candidates get a small marker on the Squad hero card and a callout in
  the hero detail panel linking to the Retraining section. No marker anywhere
  if the Training Grounds is not built (the mechanic doesn't exist yet for
  that save — avoid advertising a locked feature ambiently; the Guide can
  mention it).
- Update the `bestPositionFor` regression tests: natural-lane mapping stays
  (the function's margin behaviour is unchanged); tests asserting the *filter*
  distribution are replaced by role-mapping trivial checks or dropped.

## Part 2 — Retraining mechanic

**Unlock:** requires the Training Grounds building (`trainyard`, silver tier,
1200g — currently grants bench XP). Its description gains a line.

**Where:** new "Retraining" section in the hero detail panel (below Squad
Leader section), always visible for owned heroes when the Trainyard is built;
shows role options with cost, or the reason the hero is ineligible.

**Choice:** player picks a specific target role from either non-native lane
(e.g. Rogue → Warrior, Paladin, Mage or Cleric). Roles within the native lane
(Rogue→Ranger) are excluded — no lane change, no point. The UI sorts/flags the
lane `bestPositionFor` recommends.

**Cost:** `Math.max(100, Math.floor(0.40 * hero.value))` gold, paid up front.
Non-refundable.

**Duration:** 4 weeks out of action, reusing the `awayWeeks` machinery
(hero shows as Away, cannot be fielded, existing filters/dimming apply).

**Eligibility (all must hold):**
- Training Grounds built
- hero owned, not retired, not injured, not already away (listing state is
  untouched — a listed hero may retrain, and bids resolve normally while
  they're away)
- `contractWeeksLeft > 4` (cannot pay for a course they won't finish)
- has not retrained this season (`retrainedSeason !== season`)
- player can afford the cost

**Flow:**
1. Confirm dialog (window.confirm, matching Release's pattern) stating cost,
   4-week absence, and once-per-season limit.
2. On confirm: deduct gold; set `awayWeeks: 4`, `retraining: { toRole }`,
   `retrainedSeason: season`; log entry.
3. Weekly tick: the existing away countdown in `applyRaidResult` (~8328)
   decrements. When it reaches 0 **and** `h.retraining` is set: apply
   `role = retraining.toRole`, clear `retraining`, +8 morale ("new lease on
   life"), log + chronicle entry. The event-return branch (`pendingEvent`)
   is independent — retraining heroes have no `pendingEvent`, so the two
   return paths cannot collide.
4. If the hero is the Squad Leader they may retrain (they're away, so leader
   bonuses are simply inactive — existing behaviour).

**Edge cases:**
- Contract expires mid-retrain: impossible by eligibility (`>4` weeks) except
  via early termination paths (release/sale). Release of a retraining hero is
  allowed (money already spent — player's call). Sale: bids resolve normally;
  a sold retraining hero just leaves (rival gets them as-is, `retraining`
  field is dropped on transfer like other transient state).
- Season rollover mid-retrain: `awayWeeks` persists across seasons already;
  the course simply completes next season. `retrainedSeason` refers to the
  season the course *started*.
- Save/load: heroes are persisted wholesale in the save blob, so
  `retraining`/`retrainedSeason` persist automatically. All reads are
  optional-chained; no migration needed (absent field = never retrained).

**Balance note (CLAUDE.md rule 1):** no combat formulas change. The gain is
redirecting the existing +10% ideal bonus and pairing eligibility, priced at
40% of value + 4 fielded-weeks of opportunity cost + the once-per-season cap.
The balance sim does not model player retraining decisions, so
`scripts/balance-sim.mjs` is untouched. If a future sim adds roster agency,
revisit.

## Tests (engine.test.jsx)

- Eligibility matrix: injured / away / short contract / same-season repeat /
  insufficient-gold each block the start (pure helper `canRetrain(hero, gold,
  season, buildings)` extracted so it's testable).
- Completion: hero with `awayWeeks:1, retraining:{toRole:"Warrior"}` comes back
  a Warrior with retraining cleared (exercised through the weekly tick helper
  if extractable, else through a crafted-save integration check).
- `bestPositionFor` margin behaviour unchanged (existing tests stand).

## Out of scope

- Stat changes on retrain (stats carry as-is — that's the premise).
- Retraining market/rival heroes.
- Sim modelling of retraining.
