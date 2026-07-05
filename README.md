# Realm Manager

Fantasy squad simulator in the Football Manager tradition: run a realm's
mercenary squad through a five-tier league (Iron → Platinum), one battle a
week. Hire and develop heroes, set your formation, manage form, fatigue,
contracts and grudges — and win the Platinum title.

The whole game lives in [`src/App.jsx`](src/App.jsx).

## Development

```
npm install
npm run dev      # dev server on :5173
npm test         # engine test suite (combat calibration, growth, economy)
npm run sim      # balance simulation — 300 campaigns × 10 seasons
npm run build    # production build to dist/
npm run lint     # eslint (carries known pre-existing style warnings)
```

### Balance changes

Combat and economy numbers are calibrated by simulation. If you touch tribute,
XP ranges, growth, form, win-gold or the phase cap, update the mirrored
formulas in [`scripts/balance-sim.mjs`](scripts/balance-sim.mjs) and re-run
`npm run sim`. Healthy targets: week-1 win chance ~50%, season-1 40–50%,
late-game 60–75%, bankruptcy rate low single digits, platinum reached around
season 7–9.

### Tests

`src/engine.test.jsx` covers the pure engine: exchange-series calibration
(lane outcomes must match phase odds — the battle engine is provably neutral),
growth reaching Potential, spec counters, tribute gradients, injury scars, and
event trait chemistry. The week-resolution path inside the `App` component is
exercised by browser smoke tests, not unit tests.

## Deployment

**Vercel** builds and deploys from source on every push to `main`, with a
preview deployment per pull request. GitHub Actions
([`ci.yml`](.github/workflows/ci.yml)) runs the test suite and a production
build on every PR.

`dist/` is not committed; the build uses relative asset paths (`base: './'`)
so it works at any mount point.

## Documentation

- [`CLAUDE.md`](CLAUDE.md) — working rules for AI-assisted sessions
- [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) — systems reference
- [`docs/BUILD_HISTORY.md`](docs/BUILD_HISTORY.md) — the 2026-07 overhaul story
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — review ledger and next candidates
