# Build History — The Full Audit Overhaul (July 2026, PR #5)

A single sustained session took the game from "crashes on week end, looks
AI-generated" to the current state. Chronological, with commit hashes.

## Act I — the audit (`1585ca5`)

Three parallel audits (dead references, balance simulation, design review)
were run against the codebase. Mid-audit discovery: all three had been
targeting a **stale root copy** (`realm-manager.jsx`) — the live game is
`src/App.jsx`. Everything was re-verified and applied to the live file.

**Game-breaking fixes:** Battle-tab white-screen whenever an event was active
(`activeEvent.requires` never exists — the cause of reported week-end
freezes); defeat ceremonies crashing on undefined vars (the game could never
end); bankruptcy mathematically unreachable; formation holding stale hero
snapshots (combat never saw fatigue/injuries/level-ups); the season finale
excluded from standings and leaking into the next season; six state fields
missing from saves; phantom league towns on fresh starts.

**Balance retune (from a 300-run sim of the old formulas):** position-based
tribute, reachable Potential, un-frozen Magic Resist, phase cap 0.77→0.85,
specialisations made to actually fire (they were disarmed by one hero in the
counter lane — dead content), level-priced market (killed a 3.7× flip
arbitrage), injury floor on losses, Cursed +15% XP.

**Design systems:** rival managers with archetypes and a persistent grudge
book; asymmetric per-lane race synergies; results-driven Form; trait-reactive
events; named injuries with scar-on-heal; scouting fog with paid reports; the
season Chronicle; title-race run-in callouts; epithet hero names; flavor pass.

**Battle engine:** lanes as first-to-3 exchange series, binomial-inverted so
the balance curve is provably unchanged (Monte Carlo verified); animated
replay with beat feed, momentum bars and tap-to-skip.

## Act II — housekeeping (`24b4d2b`, `d915022`)

Deleted the stale root file. A review sweep found all 24 event reward
descriptions advertised **double** the actual payout (stale text from an old
rebalance), fixed a React state mutation, and traced the NG+/achievements
pipeline clean.

## Act III — hardening (`15c887c`)

The retune had never been re-simulated as a whole. Porting the sim to the new
formulas (`scripts/balance-sim.mjs`, now permanent) exposed a **41% bankruptcy
rate** from two compounding feedback loops (results-Form + position-tribute).
Fixes: the loss purse, asymmetric Form cooling, tribute trim — final curve
healthy. Also: bankruptcy×season-finale collision guard, crash-recovery
guarantee in `applyRaidResult`, the vitest engine suite, GitHub Actions CI,
and Potential made exact at max level.

## Act IV — the art direction (`55986aa`, `1fdaa3f`, `d1b9ac1`)

Research into documented "AI-slop UI" tells found the game hit nearly every
one. The "printed matter" direction was proposed via mockup and shipped in
four phases: the ink remap (dark glass → parchment + six inks), period type +
letterpress rules (IM Fell English SC + Alegreya Sans, squared corners, solid
buttons), 37 hand-drawn engraved glyphs replacing the emoji icon system, and
rubber-stamp verdicts + dispatch-column replay + printed zone rules.

## Act V — systems deepening (`1ae8251`, `6161479`, `fd2fde5`, `b7b5bef`)

- **Events as correspondence:** five named senders with voices, seals and
  inks; 45 return dispatches; the event modal as a letter.
- **Rival rosters:** every town keeps six power-calibrated notables you can
  scout and buy out (archetype pricing, grudge surcharge, talisman premium,
  seller weakening, once a season) — plus the late-game gold sink the sim
  said was missing.
- **Enemy abilities:** an empirical probe proved all 13 abilities auto-failed
  at every tier (thresholds 1.5–1.9× reachable values — the third system found
  dead behind a plausible UI). Retuned to measured p65/p30 marks with a
  regression test enforcing the counterable band.
- **Contracts:** the last untraced core loop; five defects fixed (ghost queue
  entries, stale demands, double-counted dispute weeks, unreachable ignore
  mechanic → "Decide Later" option, dead-feeling early renewal).

## Act VI — the at-desk review (`f7c9be7`, `e5d9d8b`)

First human play of the overhaul surfaced three legibility issues, all fixed:
legacy saves kept dark-era neon town colors (now migrate to ink equivalents,
self-healing); IM Fell applied at chip sizes was illegible (size-split: 161
inline + 7 CSS swaps to Alegreya Sans ≤13px); ~1,500 emoji characters still in
strings (swept, keeping typographic marks). Final polish: sidebar crest glyph
and retiring the original purple-gradient lightning-bolt favicon — the last
surviving AI-slop artifact.

## Verification discipline

Every change was verified in a live browser (desktop + 375px mobile) before
commit; balance changes re-simulated; stat-gated mechanics probed empirically;
edge cases forced with crafted localStorage saves; 29 engine tests + CI gate
regressions. Three systems were found "dead behind a plausible UI"
(specialisations, Potential, abilities) — hence the standing rule: **probe,
don't guess** (see CLAUDE.md).

# Post-Overhaul Review Pass (July 2026, PRs #6–#11)

The overhaul left a `docs/ROADMAP.md` ledger of unreviewed systems. This pass
worked through them one PR at a time — each reviewed against the live game,
fixed, verified, and merged.

- **Squad Leader (#6):** the system was mechanically sound and save-safe, but
  its hero-card badge was an empty `<span>` left by the emoji sweep — invisible,
  so the game never taught that the role existed. Added a 38th engraved glyph (a
  coronet) and surfaced it on cards + the detail panel.
- **Game-speed vestige removed (#7):** a quicker game mode was concepted then
  abandoned; the multi-speed plumbing (`GAME_SPEEDS`, `ACTIVE_SPEED`, xp/age/rank
  multipliers, `setSpeed`, the `gameSpeed` save field) was deleted rather than
  finished. `SEASON_LENGTH()` became a plain `const`.
- **Wandering Master / The Challenge / Emissary (#8):** mechanics sound; the
  Emissary modal was the lone gap — a pre-correspondence design with a banned
  gradient header. Rebuilt as a sealed letter matching every other dispatch;
  cleared leftover empty icon spans; wired the Challenge's decline penalty to
  its def instead of a magic number.
- **Buildings reworked (#10):** all 11 were wired, but permanent one-time buys
  with no late-game opportunity cost. Added a per-tier build cap (1/1/2/1/1 = 6
  of 11) with demolish-and-rebuild (no refund), buffed the weakest pick —
  Infirmary (−30% injury chance) — to make Bronze a real 1-of-2, and re-simmed
  (endgame win eased a few points, the accepted cost of fewer buildings). Review
  surfaced two latent bugs: the "Full House" achievement was now unreachable
  (reworked to "fill every slot"), and building `desc`/`cost` were frozen in
  saves (added `migrateBuildings` to refresh definitions from code on load,
  grandfathering over-cap saves). Built subagent-driven: fresh agent per task,
  two-stage spec + code-quality review each.
- **Guide-tab accuracy (#11):** read all eight sections against the live game.
  Fixed two real inaccuracies (the Buildings section never mentioned the cap;
  Objectives & Events wrongly implied a stat gate on event eligibility) plus
  minor number corrections.

Engine suite grew 29 → 32 (building tier caps, `migrateBuildings`, Infirmary
injury-rate). Only **Retirement / mentorship** remains unreviewed.

# Season-2 Playtest Pass (July 2026, PR #17)

A second human playtest (reaching season 2, week ~5) surfaced a crash, five
bugs, and three economy notes. Fixed and rebalanced in one pass, all
sim-verified.

**Bug fixes (`b31f404`):**
- **Event-return crash** — `resolveEventOutcome` dereferenced a returning hero's
  `pendingEvent.reward`/`.theme`/`returnLines[outcome]` unguarded. The throw was
  swallowed by `applyRaidResult`'s catch but hero state never committed, so the
  same hero re-resolved and re-crashed every subsequent week. Hardened the inputs
  and the empty-`returnLines` `.replace`. Found a second bug alongside it: the
  weekly away-tick re-grew stats from the old level after resolution had already
  grown them (double-count) — now carries the resolved xp/level/value through.
- **Offers for away heroes** — `generateBids` excluded only injured/retired; now
  also `awayWeeks>0`, matching every other away check.
- **Event tested-attribute hidden** — the pick-heroes modal never showed which
  stats gated the outcome; now renders `· tests Strength + Endurance`.
- **Dominion board pre-filled W/L at season start** — the enemy-vs-enemy sim block
  ran after `endSeason` had zeroed the new table, re-stamping a week of results;
  gated it with `!seasonEnding` (matching the player-record update above it).
- **Away/injured heroes into combat** — only the picker UI blocked them;
  `startBattle` now re-validates the lineup (preset-load, save reload, and the
  weekly re-sync could reintroduce one).
- **Team names carried across tiers** — on promotion/relegation the league is now
  drawn fresh from the destination tier's own name pool instead of reusing the
  previous tier's teams.

**FM-style transfer fees (`f310495`):** signing fees ran ~11–15% of a hero's
annual wage — trivial, so gold had no market sink. `TRANSFER_FEE_SCALE` (=6) at
every value origin lifts fees to FM proportions (prospect ~0.7×, starter ~1.3×,
elite ~4×+ annual wage). `value` is the single market currency, so buy/sell/bid
scale together. Save schema bumped v1→v2 with a migration that scales every
persisted value ×6 (free heroes stay free).

**Economy pass (`6924d44`):** building costs scaled steeply by tier (were a flat
~1–2.8k → iron 1.4–1.8k, bronze 3.5–4k, silver 6–8k, gold 14–18k, platinum
18–22k); the tribute position swing compressed (`280→0` became `80→0`) with bases
lifted so average income per tier is ~neutral but **tier now dominates position**
(the playtest flagged 1st-in-Iron out-earning mid-Bronze — a lower division
paying more); loss purse trimmed ~15%. Combined, the late-game gold pile drops
from ~80–100k to a ~20–75k range that declines under endgame spend pressure —
buildings and star signings are real sinks now. Sim holds the bands: bankruptcy
0–2%, win rates in range, platinum ~S8. CLAUDE.md rule 1 updated so it isn't
later "restored" as a regression.

**Dev playtest tool (`f9f0cbe`):** a `?dev`-gated starting-tier picker on the
setup screen — begin a fresh campaign in any tier (skip Iron, where the loop is
settled) with a 20,000g stipend. Invisible without the flag; new games start in
Iron as before.

Engine suite grew 32 → 42. **Retirement / mentorship** was the last unreviewed
core system — now reviewed and fixed in #22 (below), leaving no core system
unreviewed.

### Follow-ups from the ongoing playtest (PRs #18–#21)

- **Crash reporter (#18):** wrapped `<App/>` in an `ErrorBoundary` (see
  `src/main.jsx`). A render-phase throw now shows a readable card with the error
  and a "Copy report" button (bundling error + save as JSON) instead of a blank
  page — essential on mobile, where there's no console. Doubles as the diagnostic
  that cracked the next bug.
- **Event-return crash, the real fix (#19):** the "Continue after battle → blank
  screen" crash was a closure over a mutated `let`. The away-return tick passed
  `setPendingEventReturns` a functional updater reading `pendingEvent.title`, then
  set `pendingEvent = null` on the next line; React runs the updater deferred, by
  which point the `let` is null → uncaught render throw. (PR #17's
  `resolveEventOutcome` hardening had aimed at the wrong function.) Fixed by
  snapshotting the event and building the banner object synchronously. Diagnosed
  by reproducing the reporter's actual save in a byte-exact local rebuild of the
  shipped bundle.
- **Events: stats + tiering (#20):** the picker now shows each candidate's
  tested-stat values (colour-coded), and event difficulty is tier-scaled
  (`TIER_EVENT_REQ` → `reqScale`) so low-tier squads aren't a Longshot on
  everything.
- **Preset skip (#21):** loading a formation preset no longer re-fields away or
  injured heroes (`deserializeFormation(…, skipUnavailable=true)`); the slot is
  left empty and the log reports how many were dropped.

### Retirement / mentorship review (PR #22)

The last unreviewed core system, traced end to end. The core loop was sound
(veteran-end retirement trigger, ceremony, squad morale lift, Squad Leader
unassign, "Legend Retires" achievement); five defects fixed:

- **Hall of Legends was dead.** The 18k Platinum building filtered
  `updatedHeroes` for `h.retired`, but retirees are stripped from `heroes` the
  week they retire, and this season's aren't aged until later in the *same*
  `applyRaidResult` pass — so the filter was always empty and the building did
  nothing. Classic rule-2 "shipped dead, never probed" (the buildings review's
  "all 11 wired and useful" was wrong here). Fixed with a persisted
  `retiredLegends` roll (level frozen at retirement) feeding a pure, exported
  `legendMoraleBonus` — now regression-locked in `engine.test.jsx`. Legends join
  the roll the week after they retire.
- **Benched mentees never levelled.** The bench mentor path added `+10 XP/wk`
  but skipped `levelFromXp`/`growHeroStats`, so level, stats and value froze
  until the hero next played (unlike the played path and Training Grounds) —
  worst for the developing prospects mentorship targets. Now recomputed on the
  bench, silently (matching the Training Grounds bench-XP precedent).
- **Duplicate mentee.** The same hero could be assigned to mentor two
  simultaneous retirees, but `mentorBonus` is a single slot, so one mentorship
  was silently dropped. The ceremony modal now excludes already-chosen mentees.
- **`retirees` wasn't persisted.** Autosave fires the instant a hero retires
  (heroes changes), writing a blob without `retirees`, so a reload mid-ceremony
  lost the mentorship assignment (the retiree already gone from the roster).
  Added `retirees` + `retiredLegends` to the save blob and autosave deps, loaded
  via `saved?.retirees` / `saved?.retiredLegends`.
- **Cosmetic:** an emoji-sweep empty `<span>` in the mentor-bonus card → a
  `nav_guide` Glyph.

Engine suite 42 → 47 (Hall of Legends morale guard). Sim untouched — it models
neither mentors nor the Legends morale effect, so rule 1 needs no mirror.

### The front door: splash, home screen, Legacy/Realm terminology

The app finally has an entrance. Previously `App()` parsed the save in a
`useMemo` and either dumped the player into the game mid-week or showed
SetupScreen, with the IM Fell font popping in after first paint.

- **Boot splash:** a `screen` state machine (`boot → home → setup → game`) at
  the top of `App()`. The splash plays every boot: the coronet glyph inks
  itself in via stroke-dash (~1.4s) while the masthead settles, held to a
  1.6s minimum and gated on `document.fonts.ready` up to a 2.5s offline cap.
  (It originally skipped when fonts were cached; once the ink-draw animation
  landed, always-play was the point — reduced-motion users skip the hold.)
  The Google Fonts `<link>` moved to `index.html` — it had been living inside
  App and SetupScreen renders in three copies, one with a divergent URL
  missing most weights, so nothing could ever have gated on it.
- **Home screen:** Continue (letterpress block in the realm colour; line
  formatted by the test-locked `realmSummary`), Found a New Realm
  (confirm-guarded when a save exists — restarts via `clearSave()` + a
  `sessionStorage` intent flag + reload, reusing the proven full-reload
  pattern so none of the ~60 `useState(saved…)` initializers leak stale
  state), and a Legacy strip (conquests · boons · next realm number).
- **Terminology:** LEGACY = the persistent account (achievements, boons,
  conquest count — the NG+ blob); REALM = one playthrough. The Ledger's
  everything-eraser (confusingly labelled "New Realm") is now **Erase
  Legacy**; "Abandon Run" → **Abandon Realm**; status pill "Run #N" →
  "Realm #N"; setup banner "New Legacy — Run #N" → "Your Legacy — Realm #N";
  the LegacyCeremony restart routes through the intent flag (straight to
  setup, no home bounce) and its CTA reads "Found a New Realm"; achievement/
  boon descriptions swept run → realm. In-fiction military "campaign" wording
  kept deliberately.
- **Autosave gate:** the mount-time autosave used to write a junk blob with
  `townName: ""` 400ms after every boot spent on home/setup — pre-existing,
  but it would have left debris after Erase Legacy. Now gated on `setupDone`.

Engine suite 47 → 50 (`realmSummary`). All six boot flows verified in the
browser (first run, warm reload, continue, new-realm-with-save + Legacy
survival, NG+ banner/boons, erase-everything leaves storage clean).

### Squad filters + Dominion order — the mobile rethink

A phone playtest flagged two things: Squad-tab filters "drop off the page"
(the mobile secondary bar was a horizontal scroll strip with the scrollbar
deliberately hidden — Stage/Status/Sort invisible, and silently active
filters had no indicator) and the rest "take up too much space" (the race
pill row alone wrapped to three lines). Rebuilt to the user's stated usage
hierarchy (Position → Race → power/contract sort → rest rarely), option D
of five mocked directions:

- **Three fixed rows at every width.** Full-name position pills (compact
  metrics under 640px keep one line at 375px); **race synergy chips** —
  only races with 2+ heroes, count-sorted, glyph + name + count, so the row
  doubles as which-synergies-are-in-reach intelligence; singletons live in
  an `Other ▾` overlay-select (pill look, native picker) that self-heals as
  the roster changes, zero-count races excluded; and `Sort: X ▾` +
  `More ▾` disclosure (search/Role/Stage/Status + Clear all) whose badge
  counts active hidden filters — the guarantee nothing filters invisibly.
- **Dominion:** deleted the mobile `order:-1` that stacked the entire
  sidebar (tribute, results, chronicle, trophies) above the league table.
  The full 8-town table now fits the first viewport at 375px.

The `filtered` memo and filter semantics are untouched — only the controls
changed. Hire-tab market bar (same old pattern) left as a follow-up.
Verified live at 375px and desktop: row counts, no horizontal overflow,
chip/Other/badge/Clear-all interactions, table-first Dominion.
