# Home Screen, Loading Splash & Legacy/Realm Terminology Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the app a front door — a font-gated loading splash, a home screen with Continue / Found a New Realm / Legacy strip — and sweep terminology so Legacy = persistent account, Realm = one playthrough.

**Architecture:** A `screen` state machine (`boot → home → setup → game`) at the top of `App()` in `src/App.jsx` (single-file design preserved). New-realm-with-existing-save restarts via the proven `clearSave() + reload` pattern, carried through a transient `sessionStorage` intent flag so the reload lands directly in setup. Fonts move to `index.html` so the splash can gate on `document.fonts.ready`.

**Tech Stack:** React 18 (hooks, no router), Vite, vitest for the engine suite. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-07-11-home-loading-legacy-design.md`

**Read first:** `CLAUDE.md` (art direction rule 4 — no emoji, Fell ≥14px only, corners ≤3px; PowerShell commit rule 7). The live game is `src/App.jsx` (~10.7k lines).

---

### Task 1: Move Google Fonts to index.html

The font `<link>` currently loads inside `App`'s render (line ~9362) and again inside `SetupScreen` (line ~7153). A pre-game splash can't gate on fonts that only start loading after the game mounts.

**Files:**
- Modify: `index.html`
- Modify: `src/App.jsx` (two `<link>` removals)

- [ ] **Step 1: Add the font links to `index.html`**

In `index.html`, add inside `<head>` after the `<title>` line:

```html
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=IM+Fell+English+SC:wght@400;500;700;900&family=Alegreya+Sans:wght@300;400;500;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

(Note the URL-encoded `+` in family names — the in-JSX versions use literal spaces, which browsers tolerated but are non-canonical.)

- [ ] **Step 2: Remove both in-render `<link>` tags from `src/App.jsx`**

Delete this line from the `SetupScreen` render (~line 7153):

```jsx
      <link href="https://fonts.googleapis.com/css2?family=IM Fell English SC:wght@400;500;700;900&family=Alegreya Sans:wght@300;400;500;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet"/>
```

Delete the identical line from the main game render (~line 9362, just after `<InjectCSS/>`).

- [ ] **Step 3: Verify tests still pass**

Run: `npm test`
Expected: 47 passed.

- [ ] **Step 4: Commit**

Use a here-string (PowerShell rule — no double quotes in `-m`), or bash heredoc:

```bash
git add index.html src/App.jsx
git commit -F - <<'EOF'
Fonts: load from index.html, not component renders

The font <link> lived inside App and SetupScreen renders, so nothing
could gate on font readiness before the game mounted. index.html starts
the fetch before React parses; the boot splash (next commits) races
document.fonts.ready.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
```

---

### Task 2: `realmSummary` helper (TDD)

Pure exported function that formats the Continue block's data from a parsed save blob. Testable in the engine suite.

**Files:**
- Modify: `src/App.jsx` (add export near `loadGame`, ~line 7041)
- Test: `src/engine.test.jsx`

- [ ] **Step 1: Write the failing tests**

In `src/engine.test.jsx`, add `realmSummary` to the existing `from "./App.jsx"` import list, and append at the end of the file:

```jsx
// ── Home screen realm summary ────────────────────────────────────────────────
describe("realmSummary", () => {
  it("returns null when there is no save or no town name", () => {
    expect(realmSummary(null)).toBe(null);
    expect(realmSummary({})).toBe(null);
    expect(realmSummary({ gold: 500 })).toBe(null);
  });

  it("formats tier, season, week and gold from the blob", () => {
    const s = realmSummary({ townName: "Ironveil", townColor: "#3C5A78", playerTier: "silver", season: 3, seasonWeek: 12, gold: 14200 });
    expect(s.name).toBe("Ironveil");
    expect(s.color).toBe("#3C5A78");
    expect(s.line).toBe("Silver · Season 3, Week 12 · 14,200g");
  });

  it("falls back safely on a sparse blob", () => {
    const s = realmSummary({ townName: "Duskhollow" });
    expect(s.color).toBe("#8A6D3B");
    expect(s.line).toBe("Iron · Season 1, Week 1 · 0g");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL — `realmSummary` is not exported.

- [ ] **Step 3: Implement**

In `src/App.jsx`, directly after the `clearSave()` function (~line 7045), add:

```jsx
// Formats the home screen's Continue block from a parsed save blob.
// Pure + exported so the engine suite can lock the shape.
export function realmSummary(saved) {
  if (!saved || !saved.townName) return null;
  const tierName = TIERS[saved.playerTier]?.name ?? "Iron";
  return {
    name: saved.townName,
    color: saved.townColor || "#8A6D3B",
    line: `${tierName} · Season ${saved.season ?? 1}, Week ${saved.seasonWeek ?? 1} · ${(saved.gold ?? 0).toLocaleString()}g`,
  };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test`
Expected: 50 passed.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx src/engine.test.jsx
git commit -F - <<'EOF'
Home: realmSummary helper for the Continue block (test-locked)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
```

---

### Task 3: Boot splash + screen state machine

**Files:**
- Modify: `src/App.jsx` — new `BootSplash` component (before `SetupScreen`, ~line 7047); `screen` state + boot effect + intent helpers in `App()` (~line 7477); replace the `if(!setupDone)` return (~line 9355).

- [ ] **Step 1: Add intent-flag + font helpers and `BootSplash`**

In `src/App.jsx`, just above the `// ─── SETUP SCREEN ───` banner (~line 7047), add:

```jsx
// ─── BOOT ────────────────────────────────────────────────────────────────────
// Transient handoff for "start a new realm": set before the reload, consumed
// on the next boot so the player lands directly in setup. sessionStorage, not
// part of any save blob.
const INTENT_KEY = "rm_intent";
function consumeIntent() {
  try {
    const v = sessionStorage.getItem(INTENT_KEY);
    if (v) sessionStorage.removeItem(INTENT_KEY);
    return v;
  } catch { return null; }
}
function requestNewRealm() {
  clearSave(); // the Legacy blob (NG+) is untouched
  try { sessionStorage.setItem(INTENT_KEY, "new"); } catch { /* private mode */ }
  window.location.reload();
}

const DISPLAY_FONT_SPEC = '900 16px "IM Fell English SC"';
function displayFontReady() {
  try { return document.fonts.check(DISPLAY_FONT_SPEC); } catch { return true; }
}

// Splash while fonts load. Styled with fallback faces on purpose — it renders
// before the display font it is waiting for.
function BootSplash() {
  return (
    <div style={{position:"fixed",inset:0,background:"#E9E1CE",zIndex:400,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <style>{`@keyframes rmBootSweep{0%{transform:translateX(-120%)}100%{transform:translateX(320%)}}`}</style>
      <Glyph id="leader" size={34} color="#8A6D3B"/>
      <div style={{fontFamily:"'IM Fell English SC',Georgia,serif",fontWeight:900,fontSize:22,color:"#23201A",letterSpacing:1,marginTop:10}}>Realm Manager</div>
      <div style={{fontFamily:"'Alegreya Sans',system-ui,sans-serif",fontSize:10,letterSpacing:2,color:"#6E6350",marginTop:3}}>FANTASY SQUAD SIMULATOR</div>
      <div style={{width:120,height:2,background:"rgba(60,52,38,0.15)",borderRadius:1,marginTop:22,overflow:"hidden"}}>
        <div style={{width:"40%",height:"100%",background:"#8A6D3B",animation:"rmBootSweep 1.1s linear infinite"}}/>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add `screen` state to `App()`**

Next to `const [setupDone,setSetupDone] = useState(!!(saved?.townName));` (~line 7477), add:

```jsx
  // Front door: boot (font gate) → home → setup|game. The intent flag lands a
  // post-reload "new realm" boot directly in setup; a warm boot with cached
  // fonts skips the splash.
  const [screen,setScreen] = useState(()=>{
    if(consumeIntent()==="new" && !saved?.townName) return "setup";
    return displayFontReady() ? "home" : "boot";
  });

  useEffect(()=>{
    if(screen!=="boot") return;
    let done=false;
    const finish=()=>{ if(!done){ done=true; setScreen("home"); } };
    const t=setTimeout(finish, 2500); // fonts CDN down/offline → proceed with fallback faces
    try { document.fonts.ready.then(finish); } catch { finish(); }
    return ()=>clearTimeout(t);
  },[screen]);
```

- [ ] **Step 3: Route screens in the render**

Replace (~line 9355):

```jsx
  if(!setupDone){
    return <SetupScreen onComplete={handleSetupComplete}/>;
  }
```

with:

```jsx
  if(screen==="boot"){
    return <BootSplash/>;
  }
  if(screen==="home"){
    return <HomeScreen saved={saved} onContinue={()=>setScreen("game")} onNewRealm={()=>{
      if(saved?.townName) requestNewRealm();   // reload → intent flag → setup, fresh initializers
      else setScreen("setup");                  // nothing to clear — no reload needed
    }}/>;
  }
  if(screen==="setup"||!setupDone){
    return <SetupScreen onComplete={handleSetupComplete}/>;
  }
```

(`HomeScreen` arrives in Task 4 — the two tasks are committed together if the intermediate state won't build; otherwise stub nothing, implement Task 4 first in the same working session and commit once. Preferred: implement Tasks 3 and 4 back-to-back, single commit at the end of Task 4.)

- [ ] **Step 4: Make setup completion enter the game**

At the end of `handleSetupComplete` (~line 7479, after its existing `setSetupDone(true)`-equivalent state writes — find the function body and append as the last line):

```jsx
    setScreen("game");
```

If `handleSetupComplete` does not currently call `setSetupDone(true)`, verify how `setupDone` becomes true in that flow and leave that mechanism intact — only add the `setScreen("game")`.

---

### Task 4: Home screen

**Files:**
- Modify: `src/App.jsx` — new `HomeScreen` component directly after `BootSplash`.

- [ ] **Step 1: Implement `HomeScreen`**

```jsx
function HomeScreen({saved,onContinue,onNewRealm}){
  const [confirming,setConfirming]=useState(false);
  const ng=loadNGPlus();
  const summary=realmSummary(saved);
  const wins=ng?.wins??0;
  const boons=(ng?.earnedBoons??[]).length;
  const hasLegacy=wins>0||boons>0;
  return(
    <div style={{position:"fixed",inset:0,background:"#E9E1CE",zIndex:390,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 16px",overflowY:"auto",fontFamily:"'Alegreya Sans',sans-serif"}}>
      {/* paper grain, matching the in-game backdrop */}
      <div style={{position:"fixed",inset:0,backgroundImage:"radial-gradient(1px 1px at 12% 20%,rgba(60,52,38,0.10) 0%,transparent 100%),radial-gradient(1px 1px at 68% 50%,rgba(60,52,38,0.08) 0%,transparent 100%),radial-gradient(1px 1px at 38% 78%,rgba(60,52,38,0.07) 0%,transparent 100%)",pointerEvents:"none"}}/>
      <div style={{width:"min(340px,92vw)",textAlign:"center"}}>
        <Glyph id="leader" size={30} color="#8A6D3B"/>
        <div style={{fontFamily:"'IM Fell English SC',serif",fontWeight:900,fontSize:26,color:"#23201A",letterSpacing:1,marginTop:8}}>Realm Manager</div>
        <div style={{fontSize:10,letterSpacing:2,color:"#6E6350",marginTop:2,marginBottom:26}}>FANTASY SQUAD SIMULATOR</div>

        {summary&&(
          <button onClick={onContinue}
            style={{display:"block",width:"100%",padding:"13px 16px",borderRadius:3,border:"none",cursor:"pointer",background:summary.color,color:"#F0E8D5",textAlign:"left",marginBottom:10}}>
            <div style={{fontFamily:"'IM Fell English SC',serif",fontWeight:900,fontSize:15,letterSpacing:0.5}}>Continue — {summary.name}</div>
            <div style={{fontSize:10,opacity:0.85,marginTop:3,fontFamily:"'Alegreya Sans',sans-serif"}}>{summary.line}</div>
          </button>
        )}

        {!confirming?(
          <button onClick={()=>{ summary?setConfirming(true):onNewRealm(); }}
            style={{display:"block",width:"100%",padding:summary?"11px 16px":"13px 16px",borderRadius:3,cursor:"pointer",
              border:summary?"1px solid rgba(60,52,38,0.28)":"none",
              background:summary?"rgba(60,52,38,0.07)":"#8A6D3B",
              color:summary?"#4A4335":"#F0E8D5",
              fontFamily:summary?"'Alegreya Sans',sans-serif":"'IM Fell English SC',serif",
              fontWeight:summary?700:900,fontSize:summary?12:15,letterSpacing:summary?0:1}}>
            Found a New Realm
          </button>
        ):(
          <div style={{padding:"12px 14px",borderRadius:3,background:"rgba(154,91,43,0.09)",border:"1px solid rgba(154,91,43,0.3)",textAlign:"left"}}>
            <div style={{fontSize:11,color:"#9A5B2B",fontWeight:700,marginBottom:4}}>Abandon {summary.name}?</div>
            <div style={{fontSize:10,color:"#4A4335",lineHeight:1.5,marginBottom:8}}>
              Your current realm will be abandoned. Your Legacy — achievements and boons — is kept.
            </div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={onNewRealm}
                style={{fontSize:11,padding:"6px 12px",borderRadius:3,border:"none",background:"#9A5B2B",color:"#F0E8D5",cursor:"pointer",fontWeight:700,fontFamily:"'Alegreya Sans',sans-serif"}}>
                Found a New Realm
              </button>
              <button onClick={()=>setConfirming(false)}
                style={{fontSize:11,padding:"6px 12px",borderRadius:3,border:"1px solid rgba(60,52,38,0.22)",background:"rgba(60,52,38,0.072)",color:"#6E6350",cursor:"pointer"}}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {hasLegacy&&(
          <div style={{borderTop:"1px solid rgba(60,52,38,0.15)",marginTop:26,paddingTop:12}}>
            <div style={{fontSize:9,letterSpacing:2,color:"#8A6D3B",fontWeight:700}}>YOUR LEGACY</div>
            <div style={{fontSize:10,color:"#6E6350",marginTop:4}}>
              {wins} conquest{wins===1?"":"s"} · {boons} boon{boons===1?"":"s"} earned · Realm #{wins+1} awaits
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build + tests**

Run: `npm test && npm run build`
Expected: 50 passed; build succeeds.

- [ ] **Step 3: Lint gate**

Run: `npm run lint 2>&1 | grep -c "no-undef"`
Expected: `0`.

- [ ] **Step 4: Commit Tasks 3+4 together**

```bash
git add src/App.jsx
git commit -F - <<'EOF'
Boot flow: font-gated splash + home screen (Continue / New Realm / Legacy)

App gains a screen state machine (boot -> home -> setup -> game). The
splash gates on document.fonts.ready with a 2.5s offline fallback and is
skipped when the display face is already cached. Home shows a Continue
letterpress block in the realm colour (via realmSummary), Found a New
Realm (confirm-guarded when a save exists; restarts through the proven
clearSave+reload pattern with a sessionStorage intent flag so the next
boot lands in setup), and a Legacy strip (conquests + boons).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
```

---

### Task 5: Legacy/Realm terminology sweep

**Files:**
- Modify: `src/App.jsx` — `NewGameButton` (~7317), `AbandonButton` (~7288), status pill (~9346), setup NG+ banner (~7189), `LegacyCeremony` restart (~9393 and button copy ~4477), Ledger persistence note (~10865), `SetupScreen` CTA (~7281), Guide prose (grep).

- [ ] **Step 1: `NewGameButton` → "Erase Legacy"**

Replace label and copy (keep oxblood `#7E2D26` styling as-is):
- Trigger button text `New Realm` → `Erase Legacy`
- Heading `This will erase everything:` → `This will erase your Legacy:`
- Bullets → `• The current realm — progress and gold<br/>• All earned achievements and boons<br/>• Your conquest history<br/>This cannot be undone.`
- Confirm button `Yes, start New Realm` → `Yes, erase everything`

- [ ] **Step 2: `AbandonButton` → "Abandon Realm"**

- Trigger button text `Abandon Run` → `Abandon Realm`
- Heading `Abandon this run?` → `Abandon this realm?`
- Body → `Your realm falls. Achievements and boons earned<br/>so far are preserved in your Legacy.`
- Confirm button `Yes, abandon run` → `Yes, abandon realm`

- [ ] **Step 3: Status pill**

~line 9346: `[["Run",`#${ngPlus.wins+1}`,"#8A6D3B"]]` → `[["Realm",`#${ngPlus.wins+1}`,"#8A6D3B"]]`

- [ ] **Step 4: Setup NG+ banner**

~line 7191: `New Legacy — Run #{ng.wins+1}` → `Your Legacy — Realm #{ng.wins+1}`. Body sentence `You've conquered the realm N time(s). Your unlocked game options are available below.` → `N conquest{s} to your name. Boons from your Legacy are available below.`

- [ ] **Step 5: `LegacyCeremony` restart routes through the intent flag**

In `onNewLegacy` (~line 9393), replace the trailing:

```jsx
            clearSave();
            window.location.reload();
```

with:

```jsx
            clearSave();
            try { sessionStorage.setItem(INTENT_KEY, "new"); } catch { /* private mode */ }
            window.location.reload();
```

And the ceremony button (~line 4477): `Begin New Campaign` → `Found a New Realm`.

- [ ] **Step 6: Remaining prose**

- Ledger persistence note (~10865): `Progress and earned boons persist across runs on this device` → `Progress and your Legacy's earned boons persist across realms on this device`
- `SetupScreen` CTA (~7281): `Begin Your Legacy` → `Found the Realm`
- Run `grep -n "\brun\b\|\bRun\b" src/App.jsx` over Guide/Ledger string literals and sweep any remaining player-facing "run" meaning a playthrough to "realm" (skip code identifiers and non-playthrough uses like "long run").

- [ ] **Step 7: Tests + lint**

Run: `npm test` → 50 passed. `npm run lint 2>&1 | grep -c "no-undef"` → 0.

- [ ] **Step 8: Commit**

```bash
git add src/App.jsx
git commit -F - <<'EOF'
Terminology: Legacy (account) vs Realm (playthrough)

Erase Legacy (was the everything-eraser confusingly named New Realm),
Abandon Realm (was Abandon Run), Realm #N status pill, Your Legacy
setup banner, ceremony restart goes straight to setup via the intent
flag, Found the Realm setup CTA, prose sweep.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
```

---

### Task 6: Browser verification, docs, PR

**Files:**
- Modify: `docs/ROADMAP.md`, `docs/BUILD_HISTORY.md`, `docs/CURRENT_STATE.md`

- [ ] **Step 1: Drive the flows in the preview browser**

Start the dev server (`preview_start` with the launch.json config). Verify, using localStorage manipulation via `javascript_tool` where needed:

1. **First run** (`localStorage.clear()` then reload): splash (or skip) → home shows masthead + primary "Found a New Realm", no Continue, no Legacy strip → tap → SetupScreen → complete setup → in game.
2. **Warm reload with save**: home shows Continue block with correct name/colour/tier/season/week/gold → Continue → game resumes mid-week (week/gold intact).
3. **New realm with save**: home → Found a New Realm → confirm copy mentions Legacy kept → after reload lands directly in SetupScreen (no home bounce); NG+ blob still present in localStorage.
4. **Seed NG+** (`localStorage.setItem("realm_manager_ng_plus", JSON.stringify({wins:2, earnedBoons:["a","b","c","d","e"]}))`, clear save, reload): Legacy strip reads "2 conquests · 5 boons earned · Realm #3 awaits"; setup shows "Your Legacy — Realm #3" banner.
5. **Erase Legacy** (in game → Ledger): confirm copy; after erase both localStorage keys are gone; reload lands on first-run home.
6. Screenshot the splash and home for the PR.

Fix anything broken (read source, edit, re-verify) before proceeding.

- [ ] **Step 2: Update docs**

- `docs/ROADMAP.md`: add a Resolved entry (home screen + splash + terminology, spec link).
- `docs/BUILD_HISTORY.md`: append a section describing the front door + terminology sweep.
- `docs/CURRENT_STATE.md`: add a short "Boot flow" note (screen machine, intent flag, fonts in index.html) and update any "run" terminology.

- [ ] **Step 3: Final gates**

Run: `npm test` (50 passed), `npm run build` (succeeds), lint no-undef count 0.

- [ ] **Step 4: Commit docs + push + PR**

```bash
git add docs/
git commit -F - <<'EOF'
Docs: record the home screen / Legacy terminology work

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
git push -u origin claude/home-screen-legacy
gh pr create --title "Home screen, loading splash, Legacy/Realm terminology" --body-file <body file per repo rule> --base main
```

PR body: summary table of the four pieces (splash, home, restart flow, terminology), verification evidence (screenshots), test counts. End with the Claude Code attribution line.

---

## Self-review notes

- Spec coverage: boot gate (T1+T3), home screen incl. first-run/confirm/Legacy strip (T4), terminology table incl. ceremony + prose (T5), error handling (timeout in T3 Step 2; corrupt save → `realmSummary` null → first-run variant, T2), testing section (T2 unit tests + T6 browser matrix). No gaps found.
- `INTENT_KEY`/`requestNewRealm`/`displayFontReady` defined in T3 Step 1 and referenced in T3 Step 3 and T5 Step 5 — names consistent.
- `realmSummary` colour fallback `#8A6D3B` matches T2 test expectation.
