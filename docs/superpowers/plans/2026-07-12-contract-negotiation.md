# Contract Negotiation Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the week-per-round counter loop with a one-sitting haggle (live willingness gauge, hidden worded patience, deterministic concessions), hard walkout on spent patience, and a hard deadline at contract expiry.

**Architecture:** Pure negotiation functions exported from `src/App.jsx` (test-locked in the engine suite); a rebuilt `NegotiationModal` holding per-sitting state locally; weekly-resolution changes in `applyRaidResult`'s contract section; a corrected + re-mirrored `scripts/balance-sim.mjs`.

**Tech Stack:** React 18, vitest, existing sim harness. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-07-12-contract-negotiation-design.md` (read it fully first — formulas, zones, and copy rules live there).

---

### Task 1: Fix the sim renewal bug + re-baseline

**Files:** `scripts/balance-sim.mjs` (~line 362)

- [ ] Step 1: `h.salary = d;` → `h.salary = d.salary;`
- [ ] Step 2: `npm run sim` — record the corrected baseline bands (bankruptcy, win rates, gold percentiles) in the commit message. Expect bankruptcy to move; that's the truth surfacing, not a regression.
- [ ] Step 3: Commit (`Sim: renewals assigned the calcDemand object as salary`).

### Task 2: Engine functions (TDD)

**Files:** `src/App.jsx` (next to `calcDemand`), `src/engine.test.jsx`

- [ ] Step 1: Write failing tests — import `negotiationProfile, negotiationWillingness, negotiationRespond` and assert the spec's calibration list (meet-ask signs; 0.9×D haggles at morale 70; ≤0.7×D insults; Loyal +patience/+concession; Greedy 0.95×original floor; Stubborn patience 1 + zero concession; Hot-headed +1 patience cost; patience clamps 1–4; determinism: same inputs → identical outputs twice; years deterministic from phase).
- [ ] Step 2: `npm test` → fails (not exported).
- [ ] Step 3: Implement per the spec's formulas; change `calcDemand`'s `years` to `negotiationProfile(hero).prefYears`.
- [ ] Step 4: `npm test` → all pass. Commit.

### Task 3: Modal + handlers

**Files:** `src/App.jsx` — `NegotiationModal` (~5610), handlers (~7906), hero card notice (~4309 "RENEWAL PENDING"), `handleReject`/`handleDelay` call sites.

- [ ] Step 1: Rebuild `NegotiationModal` per the approved v3 mockup: willingness bar (three labelled zones, solid ink fill), worded mood line, ask/current cells ("came down from Xg" once concessions happen), salary/years steppers, total, verdict line, buttons `Make Offer / Meet Ask / End Talks / Postpone (pre-expiry only)`. Final Terms mode when patience is out. Session state via `useState` keyed on hero id (`useEffect` reset on id change).
- [ ] Step 2: Replace handlers: `onSign(hero,{salary,years})` (morale +15); `onCollapse(hero)` (sets `refusesToSign`, morale −10, Hot-headed with weeks left leaves immediately via the existing release machinery); `onPostpone` (−4 morale, requeue next week). Delete the 60%-roll counter path and `handleReject`.
- [ ] Step 3: Hero card: `RENEWAL PENDING` stays for pending; `refusesToSign` shows `DEPARTING · Nw` (or "this week" at 0), oxblood.
- [ ] Step 4: Gates (`npm test`, build, lint) + commit.

### Task 4: Weekly resolution changes

**Files:** `src/App.jsx` — contract tick (~8893), walkouts block (~8689), `newNeg` queueing (~8949), `initiateEarlyRenewal` (~7959).

- [ ] Step 1: Contract tick — remove the ≥3-ignored-weeks −15 stew branch; expired heroes stay pending (deadline handled below).
- [ ] Step 2: Departures — after the contract tick, heroes with `refusesToSign && contractWeeksLeft<=0` leave: filter from roster, clear formation slots, Squad Leader unassign, negotiation queue prune, log + chronicle ("X's contract lapsed; they took their leave"). Mutual parting — no squad morale event.
- [ ] Step 3: The expiry deadline — a hero whose contract is expired and who is STILL `negotiationPending` at the end of the resolution week departs the same way (the sitting offered no postpone, so this only fires if the player force-closed the modal / new save edge). Exclude `refusesToSign` heroes from `newNeg` and `initiateEarlyRenewal`.
- [ ] Step 4: Delete the morale<20 random-walkout block for expired contracts (superseded); keep general walkout machinery for other callers if shared — verify with grep before deleting.
- [ ] Step 5: Gates + crafted-save edge test (rule 6): localStorage save with an expired-contract hero + `refusesToSign`, resolve a week in the browser, confirm clean departure and playable state. Commit.

### Task 5: Sim mirror + re-run

**Files:** `scripts/balance-sim.mjs`

- [ ] Step 1: Renewal branch → `h.salary = Math.round(d.salary * 0.93);` with a comment tying 0.93 to the one-concession norm.
- [ ] Step 2: `npm run sim`; compare to Task 1 baseline; bands per spec (bankruptcy ≤~3%, declining endgame gold). Tune only if broken; record numbers in commit.

### Task 6: Guide + copy sweep

- [ ] Step 1: Rewrite Guide Contracts/Morale paragraphs (~7553): the sitting, willingness, mood, concessions, hard deadline; delete the low-morale-expired-walkout sentence.
- [ ] Step 2: Sweep negotiation strings for jargon (no "tick"; worded mood terms). Gates + commit.

### Task 7: Browser verification + docs + PR

- [ ] Step 1: Drive at 375px per the spec's testing matrix (full haggle→concession→sign; insult→mood shift; patience out→Final Terms→refuse→departure notice→gone at week end; expired = no postpone; pre-expiry postpone works; Stubborn straight to Final Terms).
- [ ] Step 2: ROADMAP (resolve the old contracts review note's UX caveat) + BUILD_HISTORY section + CURRENT_STATE contracts paragraph.
- [ ] Step 3: Final gates, push `claude/contract-negotiation`, PR with sim band table + screenshots.

## Self-review

Spec coverage: sitting/gauge/mood (T3), pure functions + calibration (T2), walkout + deadline + departures (T4), sim bug + mirror (T1/T5), guide/copy (T6), verification (T7). Names consistent: `negotiationProfile/Willingness/Respond`, `refusesToSign`, `prefYears`. No placeholders — formulas live in the spec, referenced not duplicated.
