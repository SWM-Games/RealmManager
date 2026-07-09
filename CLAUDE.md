# CLAUDE.md — Realm Manager

Working rules for AI-assisted sessions on this repo. Read before touching anything.

## The one thing you must know

**The live game is `src/App.jsx`** (~10,700 lines, single file by design).
A stale root-level copy (`realm-manager.jsx`) once trapped an entire audit into
editing dead code; it has been deleted. If you ever see a second large JSX file,
check `src/main.jsx` imports before believing it.

## Commands

```
npm run dev      # vite dev server on :5173 (.claude/launch.json has a config)
npm test         # 32-test engine suite — MUST pass before any commit
npm run sim      # balance simulation: 300 campaigns x 10 seasons (~30s)
npm run build    # production build (dist/ is gitignored, never commit it)
npm run lint     # carries ~89 known legacy errors (unused vars, hook purity);
                 # CI lint is non-blocking — do not add NEW no-undef errors
```

## Non-negotiable working rules

1. **Balance numbers are simulation-calibrated.** If you touch tribute, XP
   ranges, growth, Form, win/loss gold, injury rates, transfer fees, building
   costs or the phase cap, update the mirrored formulas in
   `scripts/balance-sim.mjs` and re-run `npm run sim`. Healthy targets: week-1
   win ~50%, season-1 40–50%, late-game 60–75%, bankruptcy low single digits,
   platinum around season 7–9.
   (Note 1: the per-tier building cap intentionally trades a few points of
   late-game win rate — the sim shows platinum-endgame win ~59–66%. That drift
   is the accepted opportunity-cost of the cap, not a regression to "fix".)
   (Note 2: the 2026-07 economy pass deliberately drained the late-game gold
   pile. `TRANSFER_FEE_SCALE` (=6) made signings a real FM-style cost, building
   costs now scale steeply by tier (iron ~1.4–1.8k → platinum 18–22k), and the
   tribute position swing was compressed so TIER dominates POSITION. Combined,
   the gold plateau moved from ~80–100k down to a ~20–75k range that DECLINES
   in the endgame under spend pressure. That is the intended shape — do NOT
   "restore" the old 80–95k plateau. Watch instead that bankruptcy stays ≤~3%
   and platinum-endgame gold p10 doesn't fall through the floor.)
2. **Stat-gated mechanics must be probed, not guessed.** Three systems shipped
   dead because thresholds were written by feel (specialisations never fired,
   Potential was unreachable, all 13 enemy abilities auto-failed). The house
   method: generate tier-calibrated squads via `generateRivalRoster`, measure
   the real distribution, set thresholds at ~p65/p30, and add a regression test
   that enforces the counterable band (see "enemy ability thresholds" in
   `src/engine.test.jsx`).
3. **The exchange engine must stay balance-neutral.** Lane series probabilities
   are inverted from phase chances (`invertBest3of5` in `buildRaidSimulation`);
   a statistical test enforces calibration. Stats/traits may dress exchanges
   (crits, rallies, falters) but must never shift the lane win probability —
   that would double-count stats already in the lane score.
4. **Art direction is "printed matter" — no exceptions.**
   - Inks only: parchment `#E9E1CE`/`#EFE7D3`, iron-gall `#23201A`, oxblood
     `#7E2D26`, verdigris `#40614F`, brass `#8A6D3B`, ultramarine `#3C5A78`,
     plum `#5F4B66`. No gradients, no glows, no lavender, no neon.
   - Type: IM Fell English SC at **display sizes only (≥14px)**; Alegreya Sans
     for everything ≤13px. It's a display face — tiny Fell is illegible.
   - **No emoji anywhere in the UI.** Icons come from the `Glyph` component
     (38 engraved stroke marks, `GLYPH_PATHS`). Typographic marks are fine
     (★ ✓ ✗ ⊕ ⊖ → ·). A sweep removed ~1,500 emoji chars; don't reintroduce.
   - Corners ≤3px, verdicts are `.rm-stamp` rubber stamps, buttons are solid
     letterpress blocks.
5. **Save compatibility:** every new hero/town/state field needs a guard or a
   load-time migration (patterns: `migrateTownColor`; `migrateBuildings` rebuilds
   each building from the current `BUILDINGS` def carrying over only `built`, so
   definition edits reach old saves; town manager backfill in the `tierEnemyTowns`
   initializer). Static data persisted in a save blob (like building `desc`/`cost`)
   freezes at save time — refresh it from code on load. New state must be added to
   BOTH `saveGame`'s blob AND the autosave call/deps in the same commit.
6. **`applyRaidResult` is the most dangerous function in the codebase** — a
   ~600-line weekly-resolution cascade where most historical crashes lived.
   Its catch block must always leave a playable state (clears modal, advances
   week, fresh opponent). Test edge intersections with crafted localStorage
   saves (seasonWeek 41 finales, bankruptcy weeks, expired contracts).
7. **PowerShell commit messages:** embedded double quotes split git -m
   arguments on this machine. Use single-quoted here-strings with no `"` chars,
   or `--body-file` for gh.

## Deploy

**Vercel is the deployment** — it builds from source on every push, with
preview deployments per PR. GitHub Actions `ci.yml` runs tests + build on PRs.
There is no Pages deploy; `dist/` is never committed. `gh` CLI is installed
(portable, `%LOCALAPPDATA%\Programs\gh\bin`) and authenticated.

## Docs

- `docs/CURRENT_STATE.md` — systems reference (mechanics, formulas, files)
- `docs/BUILD_HISTORY.md` — the 2026-07 overhaul, commit by commit
- `docs/ROADMAP.md` — reviewed-vs-open ledger and next candidates
- `BATTLE_SIM_PLAN.md` — original battle engine design doc (A1 shipped)
