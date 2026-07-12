# Squad filters — summary row + drawer (design)

Date: 2026-07-12 · Status: approved (option D of four mocked directions;
drawer + many-filters states mocked and reviewed at 375px in night mode)

## Problem

The three-row chrome shipped in the previous rethink still eats too much
mobile space in practice: on a real roster (four races at 2+, one named
Dragonborn) the race chips split over two rows with a stranded `Other` on a
third, the sort row is mostly dead space, and the whole zone runs ~4 roomy
rows before the first card. Player verdict: "classes split over two rows,
then only a tiny section for choosable filters. lots of dead space."

## Design — one row of chrome, everything in an inline drawer

### Summary row (always visible)

`[Filters ▾] [Sort: X ▾] ……… N SHOWN`

- **Filters chip** label rule (mock-verified — two names already wrapped the
  row, so): 0 active → `Filters ▾` · exactly 1 → `Filters: {Name} ▾` ·
  2+ → `Filters (n) ▾`. Name is the value (position, race, role, stage
  label, status) or the quoted search text truncated to 8 chars. Chip inks
  when anything is active or the drawer is open (▴ when open).
- **Sort chip**: the existing overlay-select, unchanged options.
- Active filters counted across position · race · search · role · stage ·
  status (sort is a view preference, not a filter).

### Drawer (inline, pushes cards down — no overlay/sheet pattern)

Brass panel (~340px at 375px), three kicker-labelled sections:

- **POSITION** — the full-name count pills (wrapping allowed inside).
- **RACE** — the existing synergy-chip logic unchanged (All + 2-plus-hero
  chips count-sorted + `Other ▾` overlay-select for singletons).
- **REFINE** — search input (full width), Role / Stage / Status selects as
  equal thirds; a non-default select inks (brass border + text).
- Footer: `Clear all` (resets all six filters, leaves sort) · `Done`
  (closes; filters already applied live as tapped).

Drawer height is constant: active states ink existing controls, nothing is
added or grows. Worst case the race row wraps once, inside the drawer.

## Unchanged

Filter state shape and the `filtered` memo; sort options; save format
(drawer open-state is component state, not persisted); the Hire tab market
bar (explicit follow-up decision — see PR notes); desktop gets the same
design for consistency.

## Testing

Engine suite untouched. Browser at 375px + desktop: chrome is exactly one
row closed; drawer opens/closes; label progression `Filters ▾` →
`Filters: Vanguard ▾` → `Filters (2+) ▾` with no row wrap at any count;
live filtering from drawer taps; select inking; Clear all; no horizontal
overflow anywhere.
