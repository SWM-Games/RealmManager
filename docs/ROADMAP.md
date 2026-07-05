# Roadmap & Review Ledger

## Reviewed and healthy (July 2026 overhaul)

Week-end resolution path · balance economy (sim-calibrated) · battle engine
(exchange series, calibration test-enforced) · specialisations · enemy
abilities (probe + regression guard) · Form & attributes-in-combat · injuries
& scars · events (content + correspondence presentation) · buying / selling /
scouting / rival rosters · rival managers & grudges · race synergies ·
contracts & negotiation · NG+/achievements/boons pipeline (traced clean) ·
save/load fields · art direction & legibility · Squad Leader system.

## Not yet reviewed — in priority order

1. **Game-speed vestige** — `GAME_SPEEDS` contains exactly one speed, yet full
   multi-speed plumbing survives (module-level `ACTIVE_SPEED`, xp/age/rank
   multipliers, a dead `setSpeed` in SetupScreen, speed persisted in saves).
   Either finish the feature or delete the plumbing.
2. **Wandering Master / The Challenge / Emissary** — mechanics unreviewed;
   modals still predate the correspondence style (the Emissary is literally an
   emissary — it should be a letter with a seal).
3. **Buildings as a system** — are all 11 worth building? Any strictly
   dominant/dead picks? Build-order strategy depth.
4. **Guide tab full accuracy pass** — individual numbers were synced as they
   changed, but nobody has read all eight sections against the current game.
5. **Retirement / mentorship flow** — never reviewed end to end.

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
- `deploy.yml` removed in favor of Vercel; the repo's GitHub Pages setting (if
  still enabled) can be disabled in Settings to stop redundant build runs.
