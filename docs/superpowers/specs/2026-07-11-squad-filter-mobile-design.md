# Squad screen filters — mobile rethink (design)

Date: 2026-07-11 · Status: approved (option D chosen from five mocked options)

## Problem

On a 375px phone the Squad tab stacks ~5–6 rows of filter chrome before the
first hero card: a Position pill row that wraps to 2 lines, a Race pill row
(8 text pills with counts) that wraps to 3 lines, and a secondary bar
(search + Role/Stage/Status/Sort selects + "N shown") that on mobile becomes
a horizontal scroll strip with the scrollbar deliberately hidden — so
Stage/Status/Sort literally scroll off the page with zero affordance they
exist. Filters can be invisibly active.

User's stated usage hierarchy: Position (most) → Race → sort by
power/contract → everything else rarely.

## Design — three fixed rows, nothing hidden, nothing sideways

Same structure at every width; the mobile-only `.rm-filter-bar` scroll hack
is no longer used by the Squad tab (the CSS stays — the Hire tab market bar
still uses it; that screen is a follow-up, out of scope here).

The "Position"/"Race" kicker labels are dropped — icons and counts
self-explain, and the labels cost a wrapped line on mobile.

### Row 1 — Position pills (full names)

`All 12 · Vanguard 4 · Skirmisher 4 · Arbiter 4` — full names confirmed to
fit one line at 375px with compact mobile padding (~5px 8px, 10px font).
Behavior unchanged.

### Row 2 — Race synergy chips (option D)

- A chip per race with **≥2 heroes**, sorted by count descending:
  `[glyph] Dwarf 3`. Tap to filter; active chip inks solid
  (`pa-pill.active` treatment). `All N` chip leads the row.
- Races with 0–1 heroes collapse into an **`Other N ▾` native select**
  (N = total heroes in singleton races) listing those races with counts.
  Selecting one filters to it and the control renders active
  (`Other: Gnome ▾`, inked).
- Self-healing edges: if the active race drops below 2 (hero sold/retired),
  its chip disappears but the filter stays valid — the Other control shows
  it active. If a race listed in Other reaches 2+, it graduates to a chip.
- Rationale: races with multiples are the only ones worth filtering for
  (duo pacts need pairs, mono lineups need 6) — the row doubles as roster
  intelligence: what synergies are within reach. Typically 2–4 chips = one
  line.

### Row 3 — Sort + disclosure + count

- `Sort: Combat ▾` — native select styled as a chip (options unchanged:
  Value, Level, XP, Stage, Morale, Contract, Combat, Fatigue, Salary,
  Potential when `showHiddenStats`).
- `More filters ▾` — disclosure toggle. Badge shows the count of
  **non-default hidden filters** (search text, Role, Stage, Status):
  `More filters (2) ▴` when open/active, inked when any are active.
- `N SHOWN` right-aligned kicker.

### More-filters panel (collapsed by default)

Brass-tinted panel containing: search input (full width), Role / Stage /
Status selects (equal thirds), and a **Clear all filters** link that resets
position, race, search, role, stage and status to defaults (sort is a view
preference, not a filter — untouched).

## Out of scope / unchanged

Hero card grid, detail panel, filter/sort semantics, the `filtered` memo
logic (only the controls change), Hire-tab market filter bar (follow-up),
save format (filter state was never persisted).

## Error handling / edges

- Roster of 12 all-singletons (7 races × ≤1): row 2 renders `All` + `Other`
  only — still one line, still complete.
- Active hidden filter + collapsed panel: the badge is the guarantee
  nothing filters invisibly; Clear all is one tap away.
- 375px with all seven races at 2+: chips wrap to a second line — accepted
  (rare, composition-driven, still less than today's three).

## Testing

Engine suite: none of the pure engine exports change. Verification is
browser-driven at 375px and desktop: row counts, no horizontal overflow
anywhere on the tab, chip threshold behavior (sell a hero → chip moves to
Other while filter stays active), badge counts, Clear all, market tab
unaffected. `npm test` green; no new lint `no-undef`.
