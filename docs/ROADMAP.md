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
Infirmary).

## Not yet reviewed — in priority order

1. **Guide tab full accuracy pass** — individual numbers were synced as they
   changed, but nobody has read all eight sections against the current game.
2. **Retirement / mentorship flow** — never reviewed end to end.

## Resolved

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
