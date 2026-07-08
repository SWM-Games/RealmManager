# Retraining + Strict Role→Lane Mapping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Position filters/labels become strictly role-derived, and heroes whose stats favour another lane can retrain to a role in that lane (40% of value, 4 weeks away, once per season, requires Training Grounds).

**Architecture:** Everything lives in `src/App.jsx` (single-file by repo design) + `src/engine.test.jsx`. Pure helpers (`canRetrain`, `retrainCost`, `naturalLaneFor`) are exported for tests; the mechanic reuses the existing `awayWeeks` countdown in `applyRaidResult`'s bench branch for the 4-week absence and completion.

**Tech Stack:** React 18 (inline styles, Parchment Codex art rules — no emoji, marks from ★ ✓ ✗ ⊕ ⊖ → · only), Vitest.

**Spec:** `docs/superpowers/specs/2026-07-07-retraining-design.md`

**Repo rules that bind this plan:** `npm test` must pass before every commit. No combat formula changes (no balance-sim rerun needed). PowerShell: commit messages via single-quoted here-strings, no `"` chars.

---

### Task 1: Pure helpers + eligibility tests

**Files:**
- Modify: `src/App.jsx` — insert directly after the `bestPositionFor` function (search for `export function bestPositionFor`)
- Test: `src/engine.test.jsx`

- [ ] **Step 1: Write the failing tests** — append to `src/engine.test.jsx` (and add `canRetrain, retrainCost, naturalLaneFor, RETRAIN_WEEKS` to the existing import block from `./App.jsx`):

```js
// ── retraining ───────────────────────────────────────────────────────────────
describe("retraining eligibility", () => {
  const trainyard = [{ id: "trainyard", tierRequired: "silver", built: true }];
  const mkHero = (over = {}) => ({
    ...generateHero(1, false, false, false, "Rogue", null, "iron"),
    injured: false, awayWeeks: 0, retired: false,
    contractWeeksLeft: 42, value: 1000, ...over,
  });

  it("natural lane derives from role", () => {
    expect(naturalLaneFor("Warrior")).toBe("Vanguard");
    expect(naturalLaneFor("Paladin")).toBe("Vanguard");
    expect(naturalLaneFor("Ranger")).toBe("Skirmisher");
    expect(naturalLaneFor("Rogue")).toBe("Skirmisher");
    expect(naturalLaneFor("Mage")).toBe("Arbiter");
    expect(naturalLaneFor("Cleric")).toBe("Arbiter");
  });

  it("cost is 40% of value with a 100g floor", () => {
    expect(retrainCost(mkHero({ value: 1000 }))).toBe(400);
    expect(retrainCost(mkHero({ value: 0 }))).toBe(100);
  });

  it("allows an eligible hero", () => {
    expect(canRetrain(mkHero(), 5000, 1, trainyard).ok).toBe(true);
  });

  it("blocks every ineligible state", () => {
    const cases = [
      [mkHero(), 5000, 1, []],                                       // no trainyard
      [mkHero({ injured: true }), 5000, 1, trainyard],               // injured
      [mkHero({ awayWeeks: 2 }), 5000, 1, trainyard],                // away
      [mkHero({ retired: true }), 5000, 1, trainyard],               // retired
      [mkHero({ contractWeeksLeft: RETRAIN_WEEKS }), 5000, 1, trainyard], // short contract
      [mkHero({ retrainedSeason: 1 }), 5000, 1, trainyard],          // same season
      [mkHero({ value: 1000 }), 399, 1, trainyard],                  // can't afford
    ];
    cases.forEach(([h, gold, season, b]) => {
      const r = canRetrain(h, gold, season, b);
      expect(r.ok).toBe(false);
      expect(r.reason).toBeTruthy();
    });
  });

  it("allows a repeat retrain in a later season", () => {
    expect(canRetrain(mkHero({ retrainedSeason: 1 }), 5000, 2, trainyard).ok).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx vitest run src/engine.test.jsx -t retraining`
Expected: FAIL — `canRetrain` / `naturalLaneFor` / `retrainCost` / `RETRAIN_WEEKS` not exported.

- [ ] **Step 3: Implement the helpers** — insert into `src/App.jsx` immediately after the closing brace of `bestPositionFor`:

```js
// ─── RETRAINING ──────────────────────────────────────────────────────────────
// A hero whose stats favour another lane can change role: 40% of value,
// RETRAIN_WEEKS out of action (reuses the awayWeeks machinery), once per
// season, gated behind the Training Grounds. Stats/level/traits carry as-is —
// the stats are the justification, not the reward. See
// docs/superpowers/specs/2026-07-07-retraining-design.md.
export const RETRAIN_WEEKS = 4;
const RETRAIN_COST_PCT = 0.40;
const RETRAIN_RETURN_MORALE = 8;

export function naturalLaneFor(role){
  return POS_KEYS.find(p => POSITIONS[p].ideal.includes(role)) || POS_KEYS[0];
}

export function retrainCost(hero){
  return Math.max(100, Math.floor((hero.value || 0) * RETRAIN_COST_PCT));
}

// Returns {ok, reason} — reason is player-facing copy for the detail panel.
export function canRetrain(hero, gold, season, buildings){
  if(!buildings?.some(b => b.id === "trainyard" && b.built))
    return { ok:false, reason:"Requires the Training Grounds" };
  if(!hero || hero.retired)            return { ok:false, reason:"Not available" };
  if(hero.injured)                     return { ok:false, reason:"Cannot retrain while injured" };
  if((hero.awayWeeks || 0) > 0)        return { ok:false, reason:"Away from the realm" };
  if((hero.contractWeeksLeft || 0) <= RETRAIN_WEEKS)
    return { ok:false, reason:`Contract too short — needs more than ${RETRAIN_WEEKS} weeks left` };
  if(hero.retrainedSeason === season)  return { ok:false, reason:"Already retrained this season" };
  if(gold < retrainCost(hero))
    return { ok:false, reason:`Costs ${retrainCost(hero).toLocaleString()}g — not enough gold` };
  return { ok:true, reason:null };
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `npm test` — Expected: all pass (37 existing + 5 new).

- [ ] **Step 5: Commit** (PowerShell here-string, no `"`):

```powershell
git add src/App.jsx src/engine.test.jsx
git commit -m @'
Retraining helpers: canRetrain / retrainCost / naturalLaneFor + tests
'@
```

---

### Task 2: Strict role→lane mapping for filters, pills, bench label

**Files:**
- Modify: `src/App.jsx` — three call sites, all currently calling `bestPositionFor`

- [ ] **Step 1: Squad position filter.** Find `const bestPosFor=(hero,cache)=>` (~line 9020s). Replace the whole cached helper AND its filter use with direct role mapping:

Replace:
```js
  const bestPosFor=(hero,cache)=>{
    if(cache&&cache.has(hero.id)) return cache.get(hero.id);
    const best=bestPositionFor(hero);
    if(cache) cache.set(hero.id,best);
    return best;
  };
```
with:
```js
  // Position filter/pills are strictly role-derived (a Rogue is a Skirmisher,
  // always) — stat-based lane signals live in the Retraining mechanic instead.
```
and inside `filtered`, replace:
```js
      h=h.filter(x=>bestPosFor(x,bestCache)===filter.position);
```
with:
```js
      h=h.filter(x=>naturalLaneFor(x.role)===filter.position);
```
Also delete the now-unused `const bestCache=new Map();` line at the top of the `filtered` useMemo.

- [ ] **Step 2: Position pill counts.** Find `heroes.filter(h=>bestPositionFor(h)===p).length` (~line 9440s) and replace with `heroes.filter(h=>naturalLaneFor(h.role)===p).length`.

- [ ] **Step 3: Bench label (Tactics).** Find `const bestPos = bestPositionFor(h);` in the bench map (~line 6280s). Replace that line and keep the colour lookup:

```js
                  const bestPos = naturalLaneFor(h.role);
```
And in the same bench row, change the kicker text `<div className="pa-kicker">Best</div>` to `<div className="pa-kicker">Lane</div>` (the label is now the natural lane, not a recommendation).

- [ ] **Step 4: Run tests + eyeball**

Run: `npm test` — Expected: all pass (the `bestPositionFor` describe block tests the function itself, which is unchanged and still used by Task 5's candidate marker).

- [ ] **Step 5: Commit**

```powershell
git add src/App.jsx
git commit -m @'
Position filters, pills and bench label are strictly role-derived
'@
```

---

### Task 3: startRetraining handler + Retraining section in HeroDetail

**Files:**
- Modify: `src/App.jsx` — main component (handler + HeroDetail invocation ~line 10846) and the `HeroDetail` component (~line 5090)

- [ ] **Step 1: Handler in the main component.** Insert next to `savePreset`/`loadPreset` (~line 7800):

```js
  const startRetraining=(hero,toRole)=>{
    const chk=canRetrain(hero,gold,season,buildings);
    if(!chk.ok){addLog(chk.reason,"warning");return;}
    const cost=retrainCost(hero);
    if(!window.confirm(`Retrain ${hero.name} as a ${toRole}?\n\nCost: ${cost.toLocaleString()}g\nOut of action for ${RETRAIN_WEEKS} weeks.\nOnce per hero per season.`)) return;
    setGold(g=>g-cost);
    setHeroes(hs=>hs.map(h=>h.id===hero.id?{...h,awayWeeks:RETRAIN_WEEKS,retraining:{toRole},retrainedSeason:season}:h));
    setFormation(f=>{const nf={};POS_KEYS.forEach(p=>{nf[p]=(f[p]||[]).map(x=>x&&x.id===hero.id?null:x);});return nf;});
    addLog(`${hero.name} departs for the Training Grounds — retraining as ${toRole} (${cost.toLocaleString()}g, back in ${RETRAIN_WEEKS} weeks).`,"info");
  };
```

- [ ] **Step 2: Pass props to HeroDetail.** At the `<HeroDetail` invocation (~line 10847), add after `onSetLeader={...}`:

```jsx
          onRetrain={startRetraining}
          retrainGold={gold}
          retrainSeason={season}
          retrainBuildings={buildings}
```

- [ ] **Step 3: Render the section.** In `HeroDetail`, add the new props to the destructure:

```js
function HeroDetail({hero,prevStats,onClose,onRelease,onEarlyRenew,isListed,onToggleListed,heroBids,onAcceptBid,onDeclineBid,showHiddenStats,isLeader,onSetLeader,isOwned=true,onRetrain,retrainGold,retrainSeason,retrainBuildings}){
```

Then insert the section immediately BEFORE the `{/* Transfer / release buttons — only for heroes you actually own */}` comment:

```jsx
      {/* Retraining — change role to a lane the stats now favour */}
      {isOwned&&onRetrain&&(()=>{
        const trainyardBuilt=retrainBuildings?.some(b=>b.id==="trainyard"&&b.built);
        if(!trainyardBuilt) return null;
        const homeLane=naturalLaneFor(hero.role);
        if(hero.retraining){
          return(
            <div style={{marginTop:14,padding:"12px 14px",borderRadius:3,background:"rgba(60,90,120,0.09)",border:"1px solid rgba(60,90,120,0.3)"}}>
              <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:11,color:"#3C5A78",letterSpacing:0.5,textTransform:"uppercase"}}>Retraining</div>
              <div style={{fontSize:10,color:"#4A4335",marginTop:4}}>
                Away at the Training Grounds — returns as a <b>{hero.retraining.toRole}</b> in {hero.awayWeeks} week{hero.awayWeeks!==1?"s":""}.
              </div>
            </div>
          );
        }
        const chk=canRetrain(hero,retrainGold,retrainSeason,retrainBuildings);
        const suggested=bestPositionFor(hero);
        const options=POS_KEYS.filter(p=>p!==homeLane).flatMap(p=>POSITIONS[p].ideal.map(role=>({role,lane:p})));
        return(
          <div style={{marginTop:14,padding:"12px 14px",borderRadius:3,background:"rgba(60,52,38,0.036)",border:"1px solid rgba(60,52,38,0.144)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:8}}>
              <div style={{fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:11,color:"#6E6350",letterSpacing:0.5,textTransform:"uppercase"}}>Retraining</div>
              <div style={{fontSize:10,fontWeight:700,color:"#77653F"}}>{retrainCost(hero).toLocaleString()}g · {RETRAIN_WEEKS}w away</div>
            </div>
            {suggested!==homeLane&&(
              <div style={{fontSize:10,color:"#40614F",marginTop:4}}>⊕ Stats favour the {suggested} lane — a strong candidate.</div>
            )}
            {!chk.ok&&<div style={{fontSize:10,color:"#9A5B2B",marginTop:4}}>{chk.reason}</div>}
            {chk.ok&&(
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
                {options.map(({role,lane})=>(
                  <button key={role} onClick={()=>onRetrain(hero,role)}
                    style={{flex:"1 1 40%",padding:"7px 0",borderRadius:3,cursor:"pointer",
                      border:`1px solid ${lane===suggested?"rgba(64,97,79,0.55)":"rgba(60,52,38,0.264)"}`,
                      background:lane===suggested?"rgba(64,97,79,0.09)":"rgba(60,52,38,0.054)",
                      color:lane===suggested?"#40614F":"#4A4335",
                      fontFamily:"'Alegreya Sans',sans-serif",fontWeight:700,fontSize:10}}>
                    → {role}<span style={{fontWeight:500,opacity:0.75}}> · {lane}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })()}
```

- [ ] **Step 4: Run tests + manual check**

Run: `npm test` — Expected: pass. Then in the dev preview: hero detail shows the section only when a Trainyard exists (inject `{id:"trainyard",built:true}` into the save's buildings to check both states).

- [ ] **Step 5: Commit**

```powershell
git add src/App.jsx
git commit -m @'
Retraining UI in hero detail + startRetraining handler
'@
```

---

### Task 4: Completion in the weekly away tick

**Files:**
- Modify: `src/App.jsx` — `applyRaidResult` bench branch, the `if(awayWeeks<=0){` block (~line 8333; anchor on `addLog(`${h.name} returned from`)

- [ ] **Step 1: Add the retraining return branch.** The block currently reads:

```js
          if(awayWeeks<=0){
            awayEvent=null;
            if(pendingEvent){
              // ... event resolution (unchanged) ...
              pendingEvent = null;
            } else {
              addLog(`${h.name} returned from "${h.awayEvent}".`,"success");
            }
          }
```

Change the trailing `else` into a retraining-aware chain (retraining heroes never have a `pendingEvent`, so the branches are mutually exclusive):

```js
            } else if(h.retraining){
              // Retraining complete — role changes, stats carry as-is
              const toRole=h.retraining.toRole;
              h={...h, role:toRole, retraining:null, morale:Math.min(100,(h.morale||70)+RETRAIN_RETURN_MORALE)};
              addLog(`${h.name} returns from the Training Grounds a ${toRole} — new lease on life (+${RETRAIN_RETURN_MORALE} morale).`,"success");
              addChronicle(`${h.name} retrained as a ${toRole}.`);
            } else {
              addLog(`${h.name} returned from "${h.awayEvent}".`,"success");
            }
```

Note: the reassigned `h` flows into the bench `return{...h, ...}` below, so `role` and cleared `retraining` persist; the bench-morale computation lower down reads the bumped `h.morale`.

- [ ] **Step 2: Run tests**

Run: `npm test` — Expected: pass (no engine test covers this branch directly; it's exercised in Task 7's playthrough).

- [ ] **Step 3: Commit**

```powershell
git add src/App.jsx
git commit -m @'
Retraining completes via the weekly away tick: role change + morale
'@
```

---

### Task 5: Retrain-candidate marker on Squad hero cards

**Files:**
- Modify: `src/App.jsx` — `HeroCard` component (~line 4900, anchor on `isLeader&&<span title="Squad Leader"`) and the Squad list map (anchor on `filtered.map(h=><HeroCard`)

- [ ] **Step 1: Add the prop to HeroCard.** Add `retrainCandidate` to the `HeroCard` destructure, and render next to the leader glyph (both name-row variants if compact/full both show it — match the `isLeader` pattern):

```jsx
            {retrainCandidate&&<span title="Stats favour another lane — see Retraining in their profile" style={{marginLeft:4,fontSize:10,color:"#40614F",fontWeight:700}}>⊕</span>}
```

- [ ] **Step 2: Compute + pass it in the Squad map.** Above the `filtered.map(...)` line add:

```js
              const trainyardBuilt=buildings.some(b=>b.id==="trainyard"&&b.built);
```
(if that scope can't take a statement, compute inline). Then in the map, add to the `<HeroCard ...>` props:

```jsx
retrainCandidate={trainyardBuilt&&!h.retraining&&bestPositionFor(h)!==naturalLaneFor(h.role)}
```

No marker when the Trainyard isn't built (spec: don't advertise a locked feature ambiently).

- [ ] **Step 3: Run tests + commit**

Run: `npm test` — Expected: pass.

```powershell
git add src/App.jsx
git commit -m @'
Retrain-candidate marker on Squad hero cards
'@
```

---

### Task 6: Training Grounds description + Guide line

**Files:**
- Modify: `src/App.jsx` — BUILDINGS entry (~line 2323) and the Guide tab copy (anchor on `Specialisation` paragraphs, ~line 7250s)

- [ ] **Step 1: Building description.** Change the `trainyard` desc to:

```js
  { id:"trainyard", name:"Training Grounds",  icon:"", cost:1200, tierRequired:"silver",   desc:"Nobody watches from the fence here. Bench heroes earn 20% of that week's battle XP, and heroes can retrain to a new class." },
```

(Save-compat: `migrateBuildings` refreshes `desc` from code on load — old saves pick this up automatically.)

- [ ] **Step 2: Guide mention.** In the Guide tab's tips/army section (near the existing `"Squad Leader bonus scales with tenure..."` tip string), add one tip string:

```js
          "Build the Training Grounds to retrain a hero whose stats favour another lane — 40% of their value, 4 weeks away, once per season.",
```

- [ ] **Step 3: Run tests + commit**

```powershell
git add src/App.jsx
git commit -m @'
Training Grounds description + Guide tip for retraining
'@
```

---

### Task 7: End-to-end verification + docs

**Files:**
- Modify: `docs/CURRENT_STATE.md` (systems reference — add a Retraining paragraph next to the Squad Leader one)

- [ ] **Step 1: Full suite + build.** `npm test` (expect 42 passing) then `npm run build` (clean).

- [ ] **Step 2: Preview playthrough** (dev server, mobile viewport):
  1. Inject a built trainyard into the localStorage save's `buildings`; reload.
  2. Open a Rogue's detail → Retraining section shows 4 role options with cost; suggested lane highlighted if `bestPositionFor` differs.
  3. Start a retrain (confirm dialog) → gold drops, hero shows Away, removed from formation, log line present.
  4. Fight 4 battles (tap-through) → hero returns with the new role, +8 morale, log + chronicle entries; card/pills/filters show the hero under the NEW lane.
  5. Try to retrain again same season → blocked with reason.
  6. Reload mid-retrain → state persists (heroes serialize wholesale).

- [ ] **Step 3: Update `docs/CURRENT_STATE.md`** with a short Retraining paragraph (mechanic, costs, gate, once-per-season, completion path in applyRaidResult).

- [ ] **Step 4: Commit + PR**

```powershell
git add docs/CURRENT_STATE.md
git commit -m @'
Docs: retraining system reference
'@
```

Then push the branch and open a PR to main (body via --body-file). Merge only on user approval.
