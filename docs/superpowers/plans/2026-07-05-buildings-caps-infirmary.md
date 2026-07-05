# Buildings Per-Tier Caps + Infirmary Buff — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-tier build cap (6 of 11 buildable) with demolish-and-rebuild, and buff Infirmary (−30% injury chance) so its tier is a real 1-of-2.

**Architecture:** A pure, exported cap helper (`buildingCapReached`) drives both the purchase guard and the Town-tab UI. Demolish flips `built:false` (no refund). Infirmary applies a 0.70 multiplier in the existing injury roll in `buildRaidSimulation`. The balance sim mirrors the cap (AI builds a competent 6) and re-runs.

**Tech Stack:** React (single-file `src/App.jsx`), Vitest (`src/engine.test.jsx`), Node balance harness (`scripts/balance-sim.mjs`).

**Spec:** `docs/superpowers/specs/2026-07-05-buildings-caps-infirmary-design.md`

---

### Task 1: Cap constant + pure helpers (with tests)

**Files:**
- Modify: `src/App.jsx` (after the `BUILDINGS` array, currently ending line 2292)
- Test: `src/engine.test.jsx`

- [ ] **Step 1: Write the failing test**

Add to `src/engine.test.jsx` — first extend the import on lines 5–11 to include the three new symbols:

```js
import {
  generateHero, buildRaidSimulation, calcFormationRating, calcPositionScore,
  calcSpecPenalty, growHeroStats, calcTierPosition, weeklyRankIncome,
  applyHealScar, calcMatchScore, generateTierTowns, generateScheduledOpponent,
  managerTaunt, generateRivalRoster, rivalAskingPrice, ENEMY_ABILITIES, checkAbility,
  TIERS, TIER_ORDER, TIER_POSITION_BONUS, POS_KEYS, MAX_LEVEL,
  TIER_BUILD_SLOTS, builtInTier, buildingCapReached,
} from "./App.jsx";
```

Then add this describe block at the end of the file:

```js
describe("building tier caps", () => {
  it("caps builds per tier and grandfathers over-cap saves", () => {
    const oneIron = [
      { id: "barracks", tierRequired: "iron", built: true },
      { id: "tavern", tierRequired: "iron", built: false },
    ];
    expect(builtInTier(oneIron, "iron")).toBe(1);
    expect(buildingCapReached(oneIron, "iron")).toBe(true); // iron slots = 1

    const emptyIron = [{ id: "barracks", tierRequired: "iron", built: false }];
    expect(buildingCapReached(emptyIron, "iron")).toBe(false);

    const silver = [
      { id: "trainyard", tierRequired: "silver", built: true },
      { id: "network", tierRequired: "silver", built: false },
      { id: "trading", tierRequired: "silver", built: false },
    ];
    expect(buildingCapReached(silver, "silver")).toBe(false); // 1 < 2
    silver[1].built = true;
    expect(buildingCapReached(silver, "silver")).toBe(true); // 2 >= 2

    // grandfathered: 2 built in a 1-slot tier still reports full (can't add more)
    const grandfathered = [
      { id: "barracks", tierRequired: "iron", built: true },
      { id: "tavern", tierRequired: "iron", built: true },
    ];
    expect(buildingCapReached(grandfathered, "iron")).toBe(true);
    expect(TIER_BUILD_SLOTS.silver).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `TIER_BUILD_SLOTS`/`builtInTier`/`buildingCapReached` are not exported (import undefined).

- [ ] **Step 3: Add the constant and helpers**

In `src/App.jsx`, immediately after the `BUILDINGS` array closing `];` (line 2292), insert:

```js
// Per-tier build slots — you may construct only this many buildings per tier,
// which forces an either/or. Grandfathered saves may already exceed these; the
// cap only prevents building MORE (see buildingCapReached), never demolishes.
export const TIER_BUILD_SLOTS = { iron: 1, bronze: 1, silver: 2, gold: 1, platinum: 1 };

export function builtInTier(buildings, tier) {
  return (buildings || []).filter(b => b.tierRequired === tier && b.built).length;
}
export function buildingCapReached(buildings, tier) {
  return builtInTier(buildings, tier) >= (TIER_BUILD_SLOTS[tier] ?? 99);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS — all tests including the new "building tier caps" block (30 tests total).

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx src/engine.test.jsx
git commit -m "Buildings: add per-tier slot cap constant and pure helpers"
```

---

### Task 2: Enforce the cap in buildBuilding + add demolishBuilding

**Files:**
- Modify: `src/App.jsx` — `buildBuilding` (line 7640) and add `demolishBuilding` after it

- [ ] **Step 1: Add the cap guard to buildBuilding**

Replace the opening of `buildBuilding` (line 7640–7642):

```js
  const buildBuilding=b=>{
    if(gold<b.cost)return;
    setGold(g=>g-b.cost);
```

with:

```js
  const buildBuilding=b=>{
    if(gold<b.cost)return;
    if(buildingCapReached(buildings, b.tierRequired)) return; // tier slot full
    setGold(g=>g-b.cost);
```

- [ ] **Step 2: Add demolishBuilding**

Immediately after the `buildBuilding` function's closing `};` (line 7656), insert:

```js
  const demolishBuilding=b=>{
    setBuildings(bs=>bs.map(x=>x.id===b.id?{...x,built:false}:x));
    addLog(`${b.name} demolished. The slot is free — the gold is not refunded.`,"warning");
  };
```

- [ ] **Step 3: Add the demolish-confirm UI state**

Find the Town-tab confirm-style states near the other `useState` declarations in `App()`. Add this line alongside them (e.g. right after the `const [buildings,setBuildings]` line, 7255):

```js
  const [confirmDemolishId,setConfirmDemolishId] = useState(null);
```

- [ ] **Step 4: Verify it compiles**

Run: `npm run build`
Expected: `✓ built in …ms` (no errors). (`buildBuilding`/`demolishBuilding` are React closures — behavior is verified in the browser in Task 4.)

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "Buildings: enforce tier cap in buildBuilding, add demolishBuilding"
```

---

### Task 3: Infirmary −30% injury chance (with test)

**Files:**
- Modify: `src/App.jsx` — `buildRaidSimulation` (derive `hasInfirmary` near line 3448; apply in injury roll near line 3613)
- Test: `src/engine.test.jsx`

- [ ] **Step 1: Write the failing test**

Add this describe block to `src/engine.test.jsx`:

```js
describe("Infirmary injury reduction", () => {
  it("cuts injuries roughly 30% vs no infirmary", () => {
    const enemy = makeEnemy(300); // strong -> frequent losses -> injuries
    const infirmary = [{ id: "infirmary", tierRequired: "bronze", built: true }];
    const N = 600;
    const countInjuries = (buildings) => {
      let total = 0;
      for (let i = 0; i < N; i++) {
        const f = makeFormation("iron");
        // fatigue everyone so injury chance is meaningful
        POS_KEYS.forEach(p => f[p].forEach(h => { h.fatigue = 92; }));
        const sim = buildRaidSimulation(f, enemy, buildings, 1);
        total += sim?.injuries?.length || 0;
      }
      return total;
    };
    const base = countInjuries(noBuildings);
    const withInf = countInjuries(infirmary);
    expect(base).toBeGreaterThan(0);
    // expect ~0.70x; allow a generous band for RNG
    expect(withInf).toBeLessThan(base * 0.85);
    expect(withInf).toBeGreaterThan(base * 0.50);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — with no infirmary effect wired, `withInf` ≈ `base`, so `withInf < base*0.85` fails.

- [ ] **Step 3: Derive hasInfirmary**

In `buildRaidSimulation`, after line 3448 (`const hasBarracks = …`), add:

```js
  const hasInfirmary = buildings.find(b=>b.id==="infirmary"&&b.built);
```

- [ ] **Step 4: Apply the reduction in the injury roll**

In the injury `.filter(...)` callback, the trait modifiers end at line 3613 (`if(h.traits?.includes("Resilient")) chance *= 0.5;`). Immediately after that line, add:

```js
    if(hasInfirmary)                            chance *= 0.70; // Infirmary: -30% injury chance
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS (31 tests total).

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx src/engine.test.jsx
git commit -m "Infirmary: -30% injury chance (durability pillar), with test"
```

---

### Task 4: Town-tab UI — slot summary, demolish, slot-full note, span cleanup

**Files:**
- Modify: `src/App.jsx` — Town tab building section (lines ~9882–9948)

- [ ] **Step 1: Add a per-tier slot summary line**

After the "Town Upgrades" header row (which ends at line 9886, the `</div>` after the Treasury span), insert this summary line:

```jsx
            <div style={{fontSize:10,color:"#6E6350",marginBottom:10,fontFamily:"'Alegreya Sans',sans-serif"}}>
              Build slots per tier:{" "}
              {TIER_ORDER.filter(t=>TIER_ORDER.indexOf(t)<=tierIdx).map((t,i)=>(
                <span key={t}>
                  {i>0&&" · "}
                  <b style={{color:"#8A6D3B"}}>{TIERS[t]?.name||t}</b> {builtInTier(buildings,t)}/{TIER_BUILD_SLOTS[t]}
                </span>
              ))}
            </div>
```

- [ ] **Step 2: Remove the leftover empty span in the locked-building card**

If not already removed, delete the empty `<span style={{fontSize:16}}></span>` inside the locked-building "Promote to …" box (was line ~9914). The box should contain only the "Promote to <TierIcon…> <b>…</b>" span. (This may already be gone in the working tree from the review pass — if so, skip.)

- [ ] **Step 3: Replace the built/unbuilt action block**

The current card renders the Build button only when `!b.built` (lines 9936–9944). Replace that block:

```jsx
                    {!b.built&&(
                      <button onClick={()=>buildBuilding(b)} disabled={!canAfford}
                        style={{width:"100%",padding:"6px 0",borderRadius:3,border:"none",
                          cursor:canAfford?"pointer":"not-allowed",
                          background:canAfford?"#40614F":"#E4DAC2",
                          color:canAfford?"#F0E8D5":"#95896F",fontWeight:700,fontSize:11,fontFamily:"'Alegreya Sans',sans-serif"}}>
                        {canAfford?`Build for ${b.cost.toLocaleString()}g`:"Need More Gold"}
                      </button>
                    )}
```

with this (adds the slot-full note for unbuilt cards, and a demolish/confirm control for built cards):

```jsx
                    {!b.built&&!buildingCapReached(buildings,b.tierRequired)&&(
                      <button onClick={()=>buildBuilding(b)} disabled={!canAfford}
                        style={{width:"100%",padding:"6px 0",borderRadius:3,border:"none",
                          cursor:canAfford?"pointer":"not-allowed",
                          background:canAfford?"#40614F":"#E4DAC2",
                          color:canAfford?"#F0E8D5":"#95896F",fontWeight:700,fontSize:11,fontFamily:"'Alegreya Sans',sans-serif"}}>
                        {canAfford?`Build for ${b.cost.toLocaleString()}g`:"Need More Gold"}
                      </button>
                    )}
                    {!b.built&&buildingCapReached(buildings,b.tierRequired)&&(
                      <div style={{width:"100%",padding:"6px 0",borderRadius:3,textAlign:"center",
                        background:"rgba(60,52,38,0.045)",border:"1px dashed rgba(60,52,38,0.2)",
                        color:"#8A7F68",fontWeight:700,fontSize:10,fontFamily:"'Alegreya Sans',sans-serif"}}>
                        Slot full — demolish to swap
                      </div>
                    )}
                    {b.built&&confirmDemolishId!==b.id&&(
                      <button onClick={()=>setConfirmDemolishId(b.id)}
                        style={{width:"100%",padding:"5px 0",borderRadius:3,border:"1px solid rgba(126,45,38,0.35)",
                          cursor:"pointer",background:"transparent",color:"#7E2D26",
                          fontWeight:700,fontSize:10,fontFamily:"'Alegreya Sans',sans-serif"}}>
                        Demolish
                      </button>
                    )}
                    {b.built&&confirmDemolishId===b.id&&(
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={()=>{demolishBuilding(b);setConfirmDemolishId(null);}}
                          style={{flex:1,padding:"5px 0",borderRadius:3,border:"none",cursor:"pointer",
                            background:"#7E2D26",color:"#F0E8D5",fontWeight:700,fontSize:10,fontFamily:"'Alegreya Sans',sans-serif"}}>
                          Confirm — no refund
                        </button>
                        <button onClick={()=>setConfirmDemolishId(null)}
                          style={{flex:1,padding:"5px 0",borderRadius:3,border:"1px solid rgba(60,52,38,0.22)",cursor:"pointer",
                            background:"rgba(60,52,38,0.054)",color:"#6E6350",fontWeight:700,fontSize:10,fontFamily:"'Alegreya Sans',sans-serif"}}>
                          Cancel
                        </button>
                      </div>
                    )}
```

- [ ] **Step 4: Verify in the browser**

Run the dev server (preview_start "dev"). On the Town tab:
- The slot summary line shows e.g. "Iron 0/1 · Bronze 0/1 …" (Iron only, if in Iron tier).
- Build one Iron building; the other Iron building's card now shows "Slot full — demolish to swap"; summary shows "Iron 1/1".
- Click Demolish on the built one → Confirm/Cancel appear → Confirm frees the slot; the other becomes buildable again.
- Check `preview_console_logs` (level error) → none.

Verify via `preview_eval` reading `document.body.innerText` for "Slot full", and by clicking through (the earlier session used `preview_eval` to click buttons found by text).

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "Town tab: slot summary, demolish (with confirm), slot-full note"
```

---

### Task 5: Balance-sim mirror + re-run

**Files:**
- Modify: `scripts/balance-sim.mjs` — `BUILD_ORDER`/build loop (lines 233–234, 378–381) and injury roll (lines 307–308)

- [ ] **Step 1: Add slot caps and a competent priority order**

Replace `BUILD_ORDER` (line 234) with a priority-ordered list (strong pick first per tier) and add the slot table. The build loop will fill each tier's slots with its highest-priority buildings:

```js
  const built = new Set();
  // [id, cost, tierIdx] — ordered so the strongest modeled pick per tier comes
  // first; slot caps below stop the AI buying a tier's weaker buildings.
  const BUILD_ORDER = [["barracks",1200,0],["tavern",1000,0],["lodge",1100,1],["infirmary",1000,1],["trading",1600,2],["trainyard",1200,2],["network",1400,2],["bazaar",1800,3],["scouts",2800,3],["sanctum",2200,4],["legends",2000,4]];
  const TIER_SLOTS = [1,1,2,1,1];          // iron, bronze, silver, gold, platinum
  const builtPerTier = [0,0,0,0,0];
```

- [ ] **Step 2: Enforce the cap in the build loop**

Replace the build loop (lines 378–381):

```js
      // buildings
      for (const [bid, cost, reqTier] of BUILD_ORDER) {
        if (!built.has(bid) && tierIdx >= reqTier && gold > cost + 1500) { built.add(bid); gold -= cost; break; }
      }
```

with:

```js
      // buildings — respect per-tier slot caps (build the priority pick first)
      for (const [bid, cost, reqTier] of BUILD_ORDER) {
        if (built.has(bid)) continue;
        if (builtPerTier[reqTier] >= TIER_SLOTS[reqTier]) continue;
        if (tierIdx >= reqTier && gold > cost + 1500) { built.add(bid); builtPerTier[reqTier]++; gold -= cost; break; }
      }
```

- [ ] **Step 3: Mirror the Infirmary injury cut**

Replace the injury-chance line (307–308):

```js
        let ch = Math.min(0.60, ff * (won ? 1 : 2)) + (!won ? specInjuryBonus : 0);
        if (Math.random() < ch) { h.injured = true; h.injuryWeeks = rand(1, 4); if (built.has("infirmary")) h.injuryWeeks = Math.max(1, h.injuryWeeks - 1); injCount++; }
```

with:

```js
        let ch = Math.min(0.60, ff * (won ? 1 : 2)) + (!won ? specInjuryBonus : 0);
        if (built.has("infirmary")) ch *= 0.70; // Infirmary: -30% injury chance
        if (Math.random() < ch) { h.injured = true; h.injuryWeeks = rand(1, 4); if (built.has("infirmary")) h.injuryWeeks = Math.max(1, h.injuryWeeks - 1); injCount++; }
```

(Note: with the priority order above the AI takes `lodge` in the Bronze slot, so `infirmary` rarely gets built in-sim — this mirror keeps the two engines consistent regardless.)

- [ ] **Step 4: Run the sim and read the targets**

Run: `npm run sim`
Expected: completes (~30s) and prints per-season lines + a bankruptcy summary. Confirm against CLAUDE.md targets:
- Week-1 win ~50%, season-1 40–50%, late-game 60–75%.
- Bankruptcy low single digits (~1–3%).
- Platinum around season 7–9; gold plateau ~80–95k.

- [ ] **Step 5: Tune if needed**

If bankruptcy rises above ~3% or platinum slips past season 9 (the 6-building cap makes the run harder): adjust in this order and re-run `npm run sim` after each change — (a) the BUILD_ORDER priority (e.g. prefer `trading` income at Silver), (b) the Infirmary factor (0.70 → 0.75), (c) a slot count (e.g. Silver 2 → 3). Keep `TIER_BUILD_SLOTS` in `src/App.jsx` and `TIER_SLOTS` here in sync if a slot count changes. If targets already hold, make no change.

- [ ] **Step 6: Commit**

```bash
git add scripts/balance-sim.mjs
git commit -m "balance-sim: mirror per-tier build caps + Infirmary injury cut; re-run"
```

---

### Task 6: Docs — mark reviewed, describe the mechanic

**Files:**
- Modify: `docs/ROADMAP.md`, `docs/CURRENT_STATE.md`

- [ ] **Step 1: Move Buildings to Resolved in ROADMAP**

In `docs/ROADMAP.md`, remove the "Buildings as a system" item from "Not yet reviewed", renumber the remaining items, add "buildings (per-tier caps)" to the "Reviewed and healthy" line, and add a Resolved entry:

```markdown
- **Buildings as a system (reviewed + reworked)** — all 11 were wired and
  useful, but permanent one-time buys with no late-game opportunity cost. Added
  a per-tier build cap (1/1/2/1/1 = 6 of 11) with demolish-and-rebuild (no
  refund), and buffed the weakest pick, Infirmary (−30% injury chance, keeps
  faster healing), so Bronze is a real 1-of-2. Existing saves grandfathered.
  Sim re-run to confirm the economy targets still hold.
```

- [ ] **Step 2: Add a Buildings note to CURRENT_STATE**

In `docs/CURRENT_STATE.md`, after the "Markets" section, add:

```markdown
## Buildings

11 buildings across the five tiers, but only a capped number are buildable per
tier (`TIER_BUILD_SLOTS` = Iron 1 / Bronze 1 / Silver 2 / Gold 1 / Platinum 1 =
6 of 11), so each tier is an either/or. Demolishing frees a slot but refunds no
gold; rebuilding pays full price. Effects: Barracks +20% battle XP · Tavern +3
morale/wk · Infirmary −30% injury chance + heal 1 wk faster · Recovery Lodge
bench fatigue recovery +60% · Training Grounds bench +20% battle XP · Talent
Network market refresh 3 wks · Trading Post listed heroes 120% value & +50%
bids · Grand Bazaar premium market · Observatory potential buckets + free
scouting · Elite Sanctum elite market · Hall of Legends retired-hero morale
(cap +20/wk). Saves from before the cap are grandfathered (nothing demolished).
```

- [ ] **Step 3: Commit**

```bash
git add docs/ROADMAP.md docs/CURRENT_STATE.md
git commit -m "Docs: buildings review — per-tier caps + Infirmary buff"
```

---

### Task 7: Full verification pass

- [ ] **Step 1: Tests + build green**

Run: `npm test` → Expected: all pass (31 tests).
Run: `npm run build` → Expected: `✓ built in …ms`.

- [ ] **Step 2: Browser smoke test**

Dev server up; play a few weeks / use a crafted save to confirm: build cap enforced, demolish frees a slot, slot summary accurate, no console errors. Grandfather check: inject a save with 2 Iron buildings `built:true`, reload, confirm both remain and neither Iron card offers Build.

- [ ] **Step 3: Open the PR**

Write the PR body to a scratch file first (avoids shell-quoting issues), then:

```bash
git push -u origin review/building-caps
# write body to a temp file, e.g. $TMP/pr-buildings.md, then:
gh pr create --base main --head review/building-caps \
  --title "Buildings: per-tier caps + Infirmary buff" \
  --body-file /tmp/pr-buildings.md
```
