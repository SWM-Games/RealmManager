# Realm Manager — Current State

*A systems reference. Accurate as of 2026-07, including the post-overhaul
review pass (Squad Leader, game-speed removal, the special events, the
buildings rework, and the Guide-tab accuracy pass) and the season-2 playtest
pass (event-return crash + five bug fixes, FM-scaled transfer fees, and the
economy rebalance). See `docs/ROADMAP.md` for the review ledger.*

Realm Manager is a Football-Manager-style fantasy squad sim: run a realm's
mercenary company through a five-tier league (Iron → Bronze → Silver → Gold →
Platinum), one battle per week, 42-week seasons, top-2 promote / bottom-2
relegate. Win condition: finish 1st in Platinum. NG+ "Legacy Boons" persist
across runs. The entire game lives in `src/App.jsx`.

## The weekly loop

Set formation (Tactics) → optionally scout the opponent → fight (Battle) →
weekly resolution (`applyRaidResult`: gold, XP, fatigue, morale, Form,
injuries, contracts, aging, market, league sim, events) → repeat. Tactics has
two saveable formation presets; loading one skips heroes who are currently away
or injured (`deserializeFormation(…, skipUnavailable)`) so an ineligible hero
isn't silently fielded — and `startBattle` re-validates the lineup at send time.

## Combat

- **Three lanes** (Vanguard / Skirmisher / Arbiter), two heroes each. Lane
  score = position-weighted stat sum × role fit × form × morale × fatigue ×
  career stage, primary×1.25 + support×0.75, × role/race pairing, × per-lane
  race-synergy multiplier (`laneMults` — asymmetric by design: a Dwarf wall is
  ×1.32 Vanguard / ×0.92 Skirmisher).
- **Phase chance** = sigmoid(lane score vs enemy power/3), capped [0.15, 0.85].
- **Exchange engine**: each lane resolves as a first-to-3 series (max 5). The
  per-exchange probability is binomial-inverted from the phase chance, so the
  series win rate EXACTLY equals the phase chance (test-enforced). Stats dress
  the exchanges — Accuracy→crits, Leadership→rallies, Coward→falters — and
  injuries attach to the exchange where they happened. Win 2 of 3 lanes.
- **Replay**: animated dispatch column (beat feed, momentum bar, manager taunt
  interjection, tap-to-skip) ending in a rubber-stamp verdict. A one-line match
  report persists in the log (`VAN 3–2 · SKI 2–3 · ARB 1–3`).
- **Specialisations** (35% of opponents, biased by manager archetype): enemy
  power +8–16% unless the counter lane holds ≥80% of your average lane score.
- **Enemy abilities** (bronze+, 1–2 per town): stat checks against lane/squad
  averages with empirically tuned thresholds (pass ≈ p65 of a tier-calibrated
  squad; soft ≈ p30). Effects: fatigue, morale, injury/gold/XP multipliers.

## Heroes

- 7 races, 6 roles, 18 stats (combat / mental / social / hidden). Potential is
  hidden until ~8–10 fielded weeks (Observatory reveals market buckets).
- **Growth**: level-ups close the gap to Potential (`gapPerLevel`); the final
  level (15) closes it exactly. Magic Resist grows like everything else.
- **Form (1–10)**: results-driven — your lane won → +0.4–0.8; lost → −0.05–0.35
  (asymmetric to prevent death spirals), sharpened by personal exchange record.
  Bench drifts toward neutral 5. Multiplies combat 0.6–1.0 and transfer bids.
- **Injuries**: fatigue-driven with a small floor on losses; carry a name and
  an origin ("Cracked ribs — vs Coalwatch, Wk 12"); healing has a 15% scar
  chance (permanent stat dent, or rarely Resilient/Iron Will earned).
- **Career**: prospect→rising→peak→fading→veteran over 504 weeks, stat decay in
  decline, retirement with mentorship handoff.
- **Traits** (18): combat multipliers, fatigue/morale modifiers, contract
  behaviors (Stubborn blocks counters, Hot-headed walks on rejection), and
  event chemistry (see Events). Cursed = −5% power but +15% XP.
- **Squad Leader**: one hero can be appointed leader (`squadLeaderId`, persisted
  + auto-cleared on release/sale/retirement). Bonuses apply *only when the leader
  is in the fielded formation*. Score = 50% career progress + 50% tenure
  (`weeksInSquad`/400), so the strongest leaders are long-serving Fading/Veteran
  heroes — deliberate: it gives aging heroes a non-combat role. Multiplier 1.0→
  1.75 drives +4–7 morale/wk to raiders, ×1.04–1.07 XP, and 25–44% less morale
  loss on defeat. Surfaced by a coronet glyph on hero cards, the detail panel,
  and a "Leader" stat-bar pill. NB: it's a set-and-forget appointment; the only
  live decision is whether to field a declining hero for the bonus.
- **Retraining** (class change): gated behind the Training Grounds. A hero can
  change role to either non-native lane (`startRetraining` →
  `retraining:{toRole}` + `awayWeeks:4`; completion in `applyRaidResult`'s
  bench-branch away tick — role swaps, +8 morale, chronicle entry). Cost 40%
  of value (100g floor, `retrainCost`), once per hero per season
  (`retrainedSeason`), needs >4 contract weeks; eligibility in `canRetrain`
  (exported, tested). Stats/level/traits carry as-is. Position pills/filters/
  bench labels are strictly role-derived (`naturalLaneFor`); the stat-based
  `bestPositionFor` signal now only feeds the ⊕ retrain-candidate marker on
  Squad cards and the suggested lane in the detail panel's Retraining section.
  Spec: `docs/superpowers/specs/2026-07-07-retraining-design.md`.

## The league world

- **7 rival towns per tier**, each with power, a **named manager** (6
  archetypes with spec-signature biases and record-aware taunts), a persistent
  **head-to-head grudge book**, and 1–2 abilities.
- League table simulated weekly: your opponent inherits the inverse of your
  result; other towns pair off with power-weighted outcomes.
- **Tribute** = tier base (170/225/325/465/625) + a modest position bonus
  (80/58/42/28/16/6/0/0). The swing is deliberately small so TIER dominates
  POSITION — promotion is the big income jump, placement only a nudge (1st in
  Iron 250 < 3rd in Bronze 267). Win gold = rand(300,700)+difficulty×100; losses
  pay a small purse (rand(50,110)+difficulty×25) — the anti-death-spiral valve,
  trimmed ~15% in the season-2 pass.
- Season end: top-2 promote, bottom-2 relegate, AI towns rotate, rosters and
  squad reports expire.

## Markets

- **Free agents**: 12, refresh every 6 weeks (3 with Talent Network); prices
  include the level term (no flip arbitrage); premium/elite gated by buildings.
- **Transfer fees are Football-Manager-scaled** (`TRANSFER_FEE_SCALE`=6, applied
  at every value origin): a signing costs a real multiple of the hero's annual
  wage — raw prospect ~0.7×, solid starter ~1.3×, elite star ~4×+ — not the old
  ~11–15% rounding error. `value` is the single market currency (buy cost, sale
  income, rival bids), so all move together. Save schema v2 migrates old saves ×6.
- **Rival rosters (FM-style poaching)**: every town keeps six notables (two per
  lane) generated on first scout and calibrated so their lanes sum to the
  town's power. Squad reports cost 40×difficulty+40 (halved by Observatory).
  Asking price = value × archetype multiplier (Gambler 1.15 … Schemer 1.5)
  + grudge surcharge + talisman premium (+0.5). Buying drops the seller's
  power ~8%; one sale per town per season.
- **Selling**: rival bids arrive every ~4 weeks (form/reputation/listing
  drive frequency and price; Trading Post boosts both).
- **Scouting fog** (toggleable): opponent power shown as a rumor band, odds
  hidden until a paid scout report; Observatory makes reports free.

## Buildings

11 buildings across the five tiers, but only a capped number are buildable per
tier (`TIER_BUILD_SLOTS` = Iron 1 / Bronze 1 / Silver 2 / Gold 1 / Platinum 1 =
6 of 11), so each tier is an either/or. Costs scale steeply by tier (Iron
~1.4–1.8k → Bronze ~3.5–4k → Silver 6–8k → Gold 14–18k → Platinum 18–22k) so
each is a genuine multi-week save, not pocket change. Demolishing frees a slot
but refunds no gold; rebuilding pays full price. Effects: Barracks +20% battle XP · Tavern +3
morale/wk · Infirmary −30% injury chance + heal 1 wk faster · Recovery Lodge
bench fatigue recovery +60% · Training Grounds bench +20% battle XP · Talent
Network market refresh every 3 wks · Trading Post listed heroes 120% value &
+50% bids · Grand Bazaar premium market · Observatory potential buckets + free
scouting · Elite Sanctum elite market · Hall of Legends retired-hero morale (cap
+20/wk). Building definitions are refreshed from code on load (`migrateBuildings`)
and pre-cap saves are grandfathered (nothing demolished).

## Events

Fire every 4–8 weeks from season 2. Every event is **correspondence from a
named sender** — five themes, five voices, five wax seals (Mad Herod Vance /
Warden-Captain Brask / Lady Amaranthe Veil / Magister Hollowquill / an
unsigned hand). Heroes are chosen by stat match ± trait×theme chemistry
(Coward −20% in the arena; Greedy skims 15% of event gold, flagged in the
picker). **Difficulty is tier-scaled** (`TIER_EVENT_REQ`, stamped as `reqScale`
at generation): the flat stat midpoints are silver-calibrated, so the bar eases
at low tiers and rises at high ones — a hero strong in the tested stats is
Possible/Strong at any tier while a weak or off-stat pick is a Longshot. The
picker shows each candidate's **tested-stat values** (colour-coded) alongside
the confidence verdict, so choices reward diverse stat spreads. Returns arrive
as dispatches written in the sender's voice with a Delivered / In Part / Undone
stamp. Specials (mutually exclusive on the weekly
roll): the **Emissary** (gold/platinum, once/season — an opt-in diff-6
exhibition, now rendered as a sealed letter matching the rest of the
correspondence), **The Challenge** (Battle-tab banner — next battle +30% enemy
power, ×2 rewards, or decline for −8 squad morale), and the **Wandering Master**
(2-season cooldown — pay 200g to raise one hero's stat past its ceiling).

## Contracts

calcDemand scales with combat/mental averages, level, career phase, morale and
Negotiation. Expiry → negotiation queue → modal (live hero data): Accept /
Counter (hidden for Stubborn) / Reject (Hot-headed walks instantly) / **Decide
Later** (−6 morale, dispute clock ticks). Three disputed weeks → −15 morale/wk;
morale <20 with expired contract → walkout risk. Early renewal available within
two seasons of expiry and opens talks immediately.

## Economy guardrails (sim-verified)

Week 1 ≈ 50% win chance; season 1 challenging (40–49%); late game 60–75%;
bankruptcy (~3 weeks at ≤0 gold = campaign over) is a 0–2% tail; platinum title
around season 8. The season-2 economy pass deliberately drained the late-game
gold pile: FM-scaled transfer fees, steeply tier-scaled building costs, a
compressed tribute swing and a lighter loss purse together moved the gold
plateau down from ~80–100k to a ~20–75k range that DECLINES in the endgame under
spend pressure — buildings and star signings are now meaningful sinks. This is
the intended shape (do NOT "restore" the old plateau); watch instead that
bankruptcy stays ≤~3% and platinum-endgame gold p10 holds off the floor. The
per-tier building cap still trims total player power a touch (platinum-endgame
win ~59–66%), the accepted cost of only 6 of 11 buildings.

## Art direction — "printed matter"

Parchment + six printer's inks, IM Fell English SC (display ≥14px only) +
Alegreya Sans, 38 engraved stroke glyphs (`Glyph` / `GLYPH_PATHS`) instead of
emoji, letterpress panels (≤3px corners, no gradients/glows), rubber-stamp
verdicts (`.rm-stamp`), dashed promotion/relegation rules in the standings,
gazette-style Chronicle. Legacy dark-era saves self-heal their town color.

## Testing & tooling

- `src/engine.test.jsx` — 42 tests: exchange-series calibration (statistical),
  ability-threshold counterability (regression guard), growth-to-Potential,
  spec counters, tribute gradient, scars, trait chemistry, rival roster
  calibration and pricing, building tier caps, `migrateBuildings`, and the
  Infirmary injury-rate reduction.
- `scripts/balance-sim.mjs` — the balance harness; keep it in sync with
  formula changes (tribute, transfer fees, building costs, loss purse) and re-run.
- **Dev playtest flag**: append `?dev` to the URL to reveal a starting-tier
  picker on the setup screen — begin a fresh campaign in any tier (skip Iron)
  with a 20,000g stipend. Gated behind the flag (`DEV_MODE`); invisible in
  normal play.
- **Crash reporter**: `<App/>` is wrapped in an `ErrorBoundary` (`src/main.jsx`).
  A render-phase throw shows a readable card with the error + a "Copy report"
  button (error + save as JSON) instead of a blank page — the practical way to
  get a repro off a mobile device, where there's no console.
- CI (`.github/workflows/ci.yml`) on every PR; Vercel builds and previews
  every push; `dist/` untracked.
