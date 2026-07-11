# Roadmap & Review Ledger

## Reviewed and healthy (July 2026 overhaul)

Week-end resolution path · balance economy (sim-calibrated) · battle engine
(exchange series, calibration test-enforced) · specialisations · enemy
abilities (probe + regression guard) · Form & attributes-in-combat · injuries
& scars · events (content + correspondence presentation) · buying / selling /
scouting / rival rosters · rival managers & grudges · race synergies ·
contracts & negotiation · NG+/achievements/boons pipeline (traced clean) ·
save/load fields · art direction & legibility · Squad Leader system ·
Wandering Master / The Challenge / Emissary · buildings (per-tier caps +
Infirmary) · Guide tab accuracy · season-2 economy (FM transfer fees,
tier-scaled building costs, tribute swing, loss purse) · event-return path.

## Not yet reviewed — in priority order

_(none — all systems reviewed)_

## Resolved

- **Front door + Legacy/Realm terminology** — the app now boots through a
  font-gated splash (`document.fonts.ready` raced against 2.5s; skipped when
  the display face is cached) into a home screen: Continue (letterpress block
  in the realm colour via test-locked `realmSummary`), Found a New Realm
  (confirm-guarded when a save exists; restarts via clearSave + a
  sessionStorage intent flag + reload so the next boot lands in setup), and a
  Legacy strip (conquests · boons · next realm number). Terminology split:
  LEGACY = the persistent account (achievements, boons, conquest count — the
  NG+ blob), REALM = one playthrough. The Ledger's everything-eraser (was
  confusingly "New Realm") is now "Erase Legacy"; "Abandon Run" → "Abandon
  Realm"; achievement/boon copy swept. Fonts moved to index.html (three
  in-render <link> copies removed, one with a divergent URL). Autosave now
  gates on setupDone — it used to write a junk townName:"" blob 400ms after
  every boot spent on home/setup, which would have left debris after Erase
  Legacy. Single save slot retained by design; the home screen abstracts
  storage so multi-slot can come later. Spec:
  `docs/superpowers/specs/2026-07-11-home-loading-legacy-design.md`.

- **Retirement / mentorship flow (reviewed + fixed)** — traced end to end. The
  core loop was sound (veteran-end retirement trigger, ceremony, squad morale
  lift, Squad Leader unassign, "Legend Retires" achievement), but five defects
  surfaced. **Hall of Legends was dead** — the 18k Platinum building filtered
  `updatedHeroes` for `h.retired`, but retirees are stripped from `heroes` the
  week they retire (and this year's aren't aged until later in the same pass),
  so the filter was always empty (the rule #2 "shipped dead, never probed"
  pattern the buildings review missed). Fixed with a persisted `retiredLegends`
  roll (level frozen at retirement) feeding a pure, test-locked
  `legendMoraleBonus`. **Benched mentees never levelled** — the bench mentor
  path added XP but skipped `levelFromXp`/`growHeroStats`, so level, stats and
  value froze until the hero next played (unlike the played path and Training
  Grounds); now recomputed silently. **Duplicate mentee** — the same hero could
  be picked to mentor two simultaneous retirees but `mentorBonus` is one slot,
  silently dropping one; the modal now excludes already-chosen mentees.
  **`retirees` wasn't persisted** — a reload mid-ceremony lost the assignment;
  added to the save blob + autosave deps (and loaded via `saved?.retirees`).
  Plus an emoji-sweep empty `<span>` in the mentor card → `Glyph`. Engine suite
  42 → 47 (new Hall of Legends morale guard). Sim unaffected (it explicitly
  models neither mentors nor the Legends morale effect).

- **Season-2 playtest pass (PR #17)** — a second human play (reached S2) found a
  crash and five bugs, all fixed: the event-return crash (unguarded `pendingEvent`
  deref that stranded and re-crashed the hero every week) + a double stat-grow
  alongside it; offers arriving for heroes away on events; the event modal not
  showing the tested attribute; the Dominion board pre-filled with W/L at season
  start (enemy sim ran after `endSeason` zeroed the table); away/injured heroes
  still sendable into combat (`startBattle` now re-validates); and team names
  carrying across tiers (league now regenerates from the destination tier's pool).
  Plus a balance pass: **FM-scaled transfer fees** (`TRANSFER_FEE_SCALE`=6, save
  v1→v2 migration), **tier-scaled building costs**, a **compressed tribute swing**
  (tier now dominates position), and a **lighter loss purse** — together pulling
  the gold plateau down from ~80–100k to a declining ~20–75k endgame. Sim bands
  held (bankruptcy 0–2%, platinum ~S8). Added a `?dev` starting-tier picker to
  skip Iron in playtests. Engine suite 32 → 42. Supersedes the buildings note
  below re: the gold plateau.
- **Game-speed vestige (removed)** — a quicker game mode was once concepted
  but abandoned; the rebalancing cost outweighed the benefit. All plumbing is
  gone: `GAME_SPEEDS`, module-level `ACTIVE_SPEED`, the xp/age/rank multipliers,
  the `speed` state + `setSpeed` in SetupScreen, and the `gameSpeed` save field.
  `SEASON_LENGTH()` is now a plain `const SEASON_LENGTH = 42`. Old saves still
  load (the stale `gameSpeed` field is simply ignored).
- **Wandering Master / The Challenge / Emissary (reviewed)** — mechanics are
  sound. The Emissary modal was the only real gap: it predated the
  correspondence style (a banned `linear-gradient` header + a dead 42px icon
  slot). Rebuilt as a sealed letter matching every other dispatch. Also cleared
  the empty post-emoji-sweep icon spans in the Challenge banner, the
  legendary-challenger banner, and the Wandering Master modal, and wired
  `declineChallenge` to read its −8 penalty from the def instead of a magic
  number.
- **Buildings as a system (reviewed + reworked)** — all 11 were wired and
  useful, but permanent one-time buys with no late-game opportunity cost. Added
  a per-tier build cap (1/1/2/1/1 = 6 of 11) with demolish-and-rebuild (no
  refund), buffed the weakest pick — Infirmary (−30% injury chance, keeps faster
  healing) — so Bronze is a real 1-of-2, reworked the now-impossible "Full House"
  achievement to "fill every build slot", and added a load migration so building
  definition edits reach existing saves (grandfathering over-cap saves). Sim
  re-run: platinum-endgame win back in band; the gold-tier grind and a higher
  gold plateau are the accepted cost of fewer buildings.
- **Guide tab accuracy (reviewed)** — read all eight sections against the live
  game. Two real inaccuracies fixed: the Buildings section never mentioned the
  per-tier build cap + demolish (now explained up front), and Objectives &
  Events wrongly said events "fire when a hero has the required stats" (they're
  timer-based from season 2 with no stat gate; stats set success odds, not
  eligibility). Minor: trait combat range +5–7% → +3–7% (Blessed is +3%), the
  morale-decay floor of 40 called out, and a build-slots tip added. Everything
  else (phase cap, +10%/+7% placement, fatigue/morale numbers, contract 1–4
  seasons, Form-9 +17%, Fading 60%) verified accurate.

## Design ideas parked (speced, not started)

- **Rivals poach back** — the buyout logic pointed at the player's squad
  (raises the stakes of listing heroes; machinery exists from rival rosters).
- **Poached-hero grudges** — a bought-out hero carries a grudge vs their old
  town, surfacing in battle dispatches.
- **Battle plan A2** — full 6v6 auto-battler (see BATTLE_SIM_PLAN.md).
  Explicitly parked: it would rebalance the entire game and shift the fun from
  preparation to execution.
- **Hero bonds/feuds** (lane partners forming relationships), **injury-origin
  revenge framing**, **log glyphs** (the log is pure typography since the emoji
  sweep — could take small ink marks per entry type).

## Technical debt

- ~89 legacy lint errors (unused vars, react-hooks purity) — clearing them
  lets CI lint go blocking.
- 570KB single JS chunk — code-splitting would help older phones.
- `applyRaidResult` (~600 lines of setState cascade) works and is guarded, but
  a pure-function week-resolver would make edge cases unit-testable.
- Accessibility has never been audited (tap targets, contrast, focus states).
- `deploy.yml` removed in favor of Vercel, but GitHub Pages is still enabled and
  fires a redundant `github-pages` deployment on every push to `main` (confirmed
  on the latest merges). Disable Pages in repo Settings to stop the wasted runs.
