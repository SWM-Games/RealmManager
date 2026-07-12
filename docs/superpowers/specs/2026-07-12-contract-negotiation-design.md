# Contract negotiation rework — design

Date: 2026-07-12 · Status: approved (three mockup iterations with the user)

## Problems (verified in code)

1. **A failed counter costs a week.** Counters resolve instantly only on
   acceptance (Loyal, or morale>50 + a hidden 60% roll). On rejection the hero
   leaves the queue still `negotiationPending` and only re-queues at the next
   weekly tick — every failed round = one week + −15 morale.
2. **Demands never move.** `calcDemand` is stateless: salary is deterministic
   off stats/phase, so it returns identical (or, after the reject morale-hit
   pushes morale <40, *higher*) every round. Years are re-rolled `rand()` per
   modal open. There is no concession model — "same wage, fewer years".
3. **Expired contracts are limbo.** The hero plays on at full salary
   indefinitely, −15 morale/week after 3 ignored weeks, with a hidden walkout
   roll under 20 morale. Nothing explains the rules.
4. ~~Suspected sim bug~~ — **verified false alarm**: the sim has its own
   `calcDemand` (returns a plain number), so `h.salary = d` is correct there.
   Baseline re-run 2026-07-12 confirms healthy bands (bankruptcy 1–3%,
   platinum ~S8, declining endgame gold).

## Decisions (user)

- **Haggle sitting with a willingness gauge** — everything resolves in one
  sitting.
- **Hard walkout** when patience runs out — refuse their Final Terms and they
  never re-sign.
- **Hard deadline at expiry** — the sitting fires that week; no deal by
  week's end and they depart.
- **Patience is hidden** — a worded mood, never a count ("a visible counter
  means there's no reason not to haggle the maximum every time"). Erosion
  varies by offer quality and trait, so remaining rounds are unknowable.
- **Copy rules:** no engine jargon ("tick" → "when the week ends"); worded
  statements over abstract icon meters (patience pips rejected).

## The sitting (new NegotiationModal)

Per-hero session state (in-modal, not persisted; a reload restarts the
sitting fresh): `{ originalDemand, currentDemand, patienceLeft, rounds }`.

- **Willingness gauge** — the one precise instrument. Recomputes live as the
  player adjusts the offer steppers. Three labelled zones: *insulting · would
  haggle · would sign*.
- **Mood line** — worded patience: *listening → growing restless → final
  terms*. Never numeric.
- **Offer steppers:** salary (steps of ~2.5% of demand, rounded to 5g) and
  years (1–4). Total cost line. Verdict line names the zone.
- **Buttons:** `Make Offer` · `Meet Ask` (signs at current demand) ·
  `End Talks` (= they never re-sign; consequence stated inline) ·
  `Postpone Talks (−4 morale)` — only while the contract has weeks left;
  gone once expired (the deadline).
- **Trait cards** stay qualitative: Loyal "patient at the table, concedes
  generously"; Greedy "barely moves"; Stubborn "take it or leave it";
  Hot-headed "quick to take offence".

## Mechanics (pure, exported, test-locked)

- `negotiationProfile(hero)` → `{ patience, prefYears, concession }`
  - patience: 3, +1 Loyal, −1 Hot-headed, −1 if morale<40; Stubborn ⇒ 1;
    clamp 1–4.
  - prefYears (replaces calcDemand's random years): peak/rising 3,
    prospect 2, fading 2, veteran 1; Negotiation>40 −1; min 1.
  - concession c: clamp(0.15–0.6, 0.35 + (morale−50)/400 + Loyal +0.10,
    Greedy −0.25); Stubborn ⇒ 0.
- `negotiationWillingness(hero, demand, offer)` → 0–100:
  `50 + 50×clamp01((S − 0.7D)/(0.3D)) − 8×|Y − prefYears| + (morale−60)/4
  + Loyal 8 − Greedy 8 − (Negotiation>40 ? 6 : 0)`, clamped 0–100.
  Zones: ≥85 signs · 45–84 haggles · <45 insulting.
- `negotiationRespond(hero, sessionDemand, originalDemand, offer, patienceLeft)`
  → deterministic `{ outcome, newDemand, patienceCost, moraleDelta }`:
  - **sign** (W≥85): terms = offer.
  - **haggle** (45–84): patienceCost 1 (+1 more if Hot-headed);
    `newSalary = D − (D−S)×c`, floored at 0.95×originalDemand for Greedy and
    at calcDemand's minSalary rules; years move 1 step toward offer if
    within ±1 of prefYears.
  - **insulted** (<45): patienceCost 2 (+1 Hot-headed), moraleDelta −5, no
    concession.
  - patienceLeft ≤ 0 after cost ⇒ **Final Terms**: sign-or-refuse at
    `currentDemand`. Refuse ⇒ `refusesToSign`.
- `calcDemand` keeps its salary formula (sim-relevant, unchanged) but years
  become `prefYears` (deterministic) — kills the re-roll confusion.

Calibration per CLAUDE.md rule 2: probed with `generateRivalRoster`-style
tier-calibrated heroes, and regression tests assert the bands are alive:
meeting the ask always signs; 0.9×D lands in the haggle zone for an
average-morale hero (not insulting); ≤0.7×D insults; Greedy's floor holds;
Stubborn goes straight to Final Terms; patience clamps 1–4.

## Consequences & the weekly cycle

- **Sign:** morale +15, contract set, queue advances. Log line.
- **Refuse Final Terms / End Talks:** hero gains `refusesToSign: true`
  (new field, falsy-default → save-safe), morale −10, permanently excluded
  from re-queueing and early renewal. Card shows a worded departure notice
  ("Departing — 4 weeks" / "Departing when the week ends"). Still sellable.
  Hot-headed heroes with weeks remaining leave immediately instead.
- **Departure:** at the weekly resolution, `refusesToSign` heroes with
  `contractWeeksLeft ≤ 0` leave — mutual-parting morale rules (no squad
  penalty), log + chronicle entries, formation slot cleared, Squad Leader
  unassigned if applicable.
- **Postpone:** −4 morale, re-queues next week (unchanged scheduling), only
  while weeks remain.
- **Removed:** the hidden 60% counter roll; random years; the −15/week stew
  loop for ignored expired contracts; the morale<20 random walkout for
  expired heroes (superseded by deterministic departures).
- Old saves mid-dispute load cleanly: pending heroes get the new sitting;
  already-expired ones face the deadline that week (postpone unavailable).

## Balance (rule 1)

- Baseline recorded 2026-07-12 (pre-change): bankruptcy 1%/3%
  (baseline/optimized strategies), platinum ~S8, endgame gold declining
  26–54k median.
- Mirror the new outcome: sim renews at `round(d × 0.93)` (one decent
  concession — the achievable norm), keeping contract length rand(1–3)
  seasons. Re-run `npm run sim`; watch bankruptcy ≤~3% and the declining
  20–75k endgame gold shape. Tune the 0.93 factor only if bands break.

## Guide & copy sweep

Rewrite the Guide's Contracts/Morale paragraphs (negotiation sitting, mood,
hard deadline, no more low-morale walkout for expired heroes) and sweep all
negotiation log/UI strings for the copy rules above.

## Out of scope

Transfer bids/offers (separate system), wage budgets, agent fees, multi-hero
bulk renewals.

## Testing

New engine tests for profile/willingness/respond (bands, traits, floors,
determinism, patience clamp). Browser verification: full sitting drive at
375px (haggle → concession visible → sign; insult → mood shift; patience out
→ Final Terms → refuse → departure notice → hero gone at week end; expired
hero has no postpone; postpone still works pre-expiry). Sim re-run with
bands recorded in the PR.
