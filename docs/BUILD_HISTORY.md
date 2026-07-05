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
