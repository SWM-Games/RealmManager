# Home screen, loading splash & Legacy/Realm terminology — design

Date: 2026-07-11 · Status: approved

## Problem

The app has no front door. `App()` parses the save in a `useMemo` and either
dumps the player straight into the game mid-week or shows `SetupScreen`. There
is no loading state (the IM Fell font pops in after first paint — FOUC), no
place to see your meta-progress, and no deliberate "continue vs start fresh"
moment. Terminology is muddled: the in-game "New Realm" button erases
*everything* (including achievements and NG+ history) while "Abandon Run" ends
the playthrough but keeps them — so "Realm" means both "this playthrough" and
"your whole account" depending on which button you're near.

## Decisions (made with the user)

1. **Single save slot.** Home screen shows Continue + New Realm; no slot list.
   The home screen abstracts the storage, so multi-slot can come later without
   redesign.
2. **Terminology: Legacy / Realm.** Your LEGACY is the persistent account
   (achievements, boons, conquest count — the `realm_manager_ng_plus` blob,
   plus future game modes). Each REALM is one playthrough (the
   `realm_manager_v2` blob). Matches existing in-game language ("Begin Your
   Legacy", `LegacyCeremony`).
3. **Loading screen is a real gate, not theatre.** It holds only until fonts
   and the save are ready (~0.3–1s), never an artificial minimum.

## Design

### Boot sequence

Top-level `screen` state in `App()`: `boot → home → setup → game`.

- **boot**: splash renders immediately using system-safe styling (it cannot
  depend on the fonts it is waiting for). Masthead: coronet glyph, "Realm
  Manager", "FANTASY SQUAD SIMULATOR", a thin brass progress rule. Gate:
  `Promise.race([document.fonts.ready, 2.5s timeout])` — the save parse is
  synchronous and already done. If `document.fonts.check()` says the display
  face is already cached at mount, skip the splash entirely (no flash on warm
  reloads). Brief fade into home.
- **home**: see below.
- **setup**: the existing `SetupScreen`, unchanged internally.
- **game**: the existing game render, unchanged.

The Google Fonts `<link>` moves out of `App`/`SetupScreen` renders into
`index.html` so the fetch starts before React parses. (The links inside
component renders are removed; they were also duplicated.)

Initial `screen` resolution on mount:

| Condition | Goes to |
| --- | --- |
| `sessionStorage` intent flag `rm_intent=new` present | `setup` (flag consumed) |
| save exists (`saved.townName`) | `boot` → `home` |
| no save | `boot` → `home` (first-run variant) |

### Home screen

Parchment card, printed-matter rules (Fell ≥14px only, no emoji, `Glyph`
marks, ≤3px corners):

- **Continue — {townName}** (only when a save exists): letterpress block in
  the realm's saved colour; second line `tier · Season N, Week W · gold`.
  All read from the parsed save blob. Tap → `screen="game"` — state was
  already initialized from the save exactly as today.
- **Found a New Realm**: primary style when no save exists, secondary when
  one does. With no save → `screen="setup"`. With a save → inline confirm
  ("Your current realm will be abandoned. Your Legacy — achievements and
  boons — is kept.") → `clearSave()` + set `rm_intent=new` +
  `window.location.reload()`. The reload reuses the proven restart pattern so
  none of the ~60 `useState(saved…)` initializers leak stale state.
- **Legacy strip** (only when `ng.wins > 0` or earned boons exist): thin
  ruled section — "YOUR LEGACY · N conquests · M boons earned · Realm #K
  awaits". First-run players see a clean masthead with just the New Realm
  block.

### Terminology sweep

| Site | Today | Becomes |
| --- | --- | --- |
| Ledger `NewGameButton` (erases save + NG+) | "New Realm" | **"Erase Legacy"** — oxblood danger styling; copy lists achievements/boons/history as casualties |
| Ledger `AbandonButton` | "Abandon Run" | **"Abandon Realm"** — copy: "preserved in your Legacy" |
| Status pill | `Run #N` | `Realm #N` |
| Setup NG+ banner | "New Legacy — Run #N" | "Your Legacy — Realm #N" |
| `LegacyCeremony` restart | clearSave + reload → setup-via-absent-save | same, plus `rm_intent=new` so the boot goes straight to setup (player already chose to start anew; home would be a redundant tap) |
| Guide / Ledger prose | "runs" | swept to Legacy/Realm usage |

### Out of scope / unchanged

Save format (zero new fields — the intent flag is transient sessionStorage),
engine and balance sim, `SetupScreen` internals, single-file `App.jsx` (new
components live there; `main.jsx` keeps only the ErrorBoundary), multi-slot
saves, cloud sync.

## Error handling

- Fonts CDN down/offline: the 2.5s race timeout proceeds with fallback serif.
- Corrupt save: `loadGame()` already returns `null` → first-run home variant.
- Intent flag with a still-present save (shouldn't happen): flag is consumed
  and ignored; normal home flow.

## Testing

Engine suite untouched (no engine changes). Verification is browser-driven:
cold boot (splash → home), warm reload (splash skipped), Continue resumes
mid-week state, New-Realm-with-save confirm + Legacy survives into setup
boons, first-run flow, Erase Legacy wipes both blobs. `npm test` must still
pass 47/47; no new lint `no-undef`.
