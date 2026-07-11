# Squad Filters + Dominion Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Squad tab's filter chrome as three fixed rows (full-name position pills, race synergy chips, sort + badged More-filters disclosure) and put the Dominion standings table first on mobile.

**Architecture:** All changes live in `src/App.jsx` (single-file design). The `filtered` memo and filter state shape are untouched — only the controls that write `filter` change. The Dominion fix is deleting one CSS rule.

**Tech Stack:** React 18, existing `pa-pill`/`pa-kicker` CSS, `Glyph` marks. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-07-11-squad-filter-mobile-design.md`

---

### Task 1: Dominion — standings first on mobile

**Files:**
- Modify: `src/App.jsx` (~line 380, RESPONSIVE_CSS)

- [ ] **Step 1: Delete the sidebar order flip**

Remove the line `.rm-dominion-right { order: -1; }` from the `@media (max-width: 640px)` block (keep `.rm-dominion-grid { grid-template-columns: 1fr !important; }`).

- [ ] **Step 2: Tests + commit**

Run `npm test` (50 passed), commit: `Dominion: standings table first on mobile`.

---

### Task 2: Squad filter rows rebuild

**Files:**
- Modify: `src/App.jsx` — the Squad tab filter JSX (~lines 9895–9941: position row, race row, `rm-filter-bar` row) and a small CSS addition for compact mobile pills.

- [ ] **Step 1: Add `moreFiltersOpen` state**

Next to the existing `filter` state (~line 7757): `const [moreFiltersOpen,setMoreFiltersOpen] = useState(false);`

- [ ] **Step 2: Replace the three filter blocks with the new structure**

Replace everything from the `{/* POSITION pill row */}` comment through the closing `</div>` of the `rm-filter-bar` row with:

```jsx
            {/* Row 1 — position pills, full names, one line at 375px */}
            <div className="rm-sq-row" style={{display:"flex",gap:5,marginBottom:6,alignItems:"center"}}>
              {["All",...POS_KEYS].map(p=>{
                const count = p==="All" ? heroes.length : heroes.filter(h=>naturalLaneFor(h.role)===p).length;
                return(
                  <button key={p} className={`pa-pill${filter.position===p?" active":""}`} onClick={()=>setFilter(f=>({...f,position:p}))}>
                    {p}<span className="ct">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Row 2 — race synergy chips: races with 2+ heroes get a chip
                (the only ones worth filtering for — pacts need multiples);
                singletons collapse into the Other select. Doubles as roster
                intelligence: which synergies are within reach. */}
            {(()=>{
              const RACES_LIST = ["Human","Elf","Dwarf","Half-Orc","Gnome","Tiefling","Dragonborn"];
              const counts = Object.fromEntries(RACES_LIST.map(r=>[r,heroes.filter(h=>h.race===r).length]));
              const chipRaces  = RACES_LIST.filter(r=>counts[r]>=2).sort((a,b)=>counts[b]-counts[a]);
              const otherRaces = RACES_LIST.filter(r=>counts[r]<2);
              const otherCount = otherRaces.reduce((a,r)=>a+counts[r],0);
              const otherActive = otherRaces.includes(filter.race);
              return(
                <div className="rm-sq-row" style={{display:"flex",gap:5,marginBottom:6,alignItems:"center",flexWrap:"wrap"}}>
                  <button className={`pa-pill${filter.race==="All"?" active":""}`} onClick={()=>setFilter(f=>({...f,race:"All"}))}>
                    All<span className="ct">{heroes.length}</span>
                  </button>
                  {chipRaces.map(r=>(
                    <button key={r} className={`pa-pill${filter.race===r?" active":""}`} title={r} onClick={()=>setFilter(f=>({...f,race:r}))}
                      style={{display:"inline-flex",alignItems:"center",gap:4}}>
                      <HeroAvatar race={r} size={13}/>{r}<span className="ct">{counts[r]}</span>
                    </button>
                  ))}
                  {otherRaces.length>0&&(
                    <select value={otherActive?filter.race:""} onChange={e=>{ if(e.target.value) setFilter(f=>({...f,race:e.target.value})); }}
                      className={`pa-pill${otherActive?" active":""}`} style={{cursor:"pointer"}}>
                      <option value="" disabled>{`Other ${otherCount}`}</option>
                      {otherRaces.map(r=><option key={r} value={r}>{`${r} (${counts[r]})`}</option>)}
                    </select>
                  )}
                </div>
              );
            })()}

            {/* Row 3 — sort chip + badged disclosure + shown count */}
            {(()=>{
              const hiddenActive = (filter.search.trim()?1:0)+(filter.role!=="All"?1:0)+(filter.phase!=="All"?1:0)+(filter.status!=="All"?1:0);
              return(
                <>
                  <div className="rm-sq-row" style={{display:"flex",gap:5,marginBottom:moreFiltersOpen?6:14,alignItems:"center"}}>
                    <select value={filter.sortBy} onChange={e=>setFilter(f=>({...f,sortBy:e.target.value}))} className="pa-pill" style={{cursor:"pointer"}}>
                      {["Value","Level","XP","Stage","Morale","Contract","Combat","Fatigue","Salary",...(showHiddenStats?["Potential"]:[])].map(s=><option key={s} value={s}>{`Sort: ${s}`}</option>)}
                    </select>
                    <button className={`pa-pill${hiddenActive>0?" active":""}`} onClick={()=>setMoreFiltersOpen(o=>!o)}>
                      More filters{hiddenActive>0?` (${hiddenActive})`:""} {moreFiltersOpen?"▴":"▾"}
                    </button>
                    <span className="pa-kicker" style={{marginLeft:"auto",flexShrink:0,letterSpacing:1.5}}>{filtered.length} shown</span>
                  </div>
                  {moreFiltersOpen&&(
                    <div style={{marginBottom:14,padding:"10px 12px",borderRadius:3,background:"rgba(138,109,59,0.07)",border:"1px solid rgba(138,109,59,0.3)"}}>
                      <input placeholder="Search name/trait…" value={filter.search} onChange={e=>setFilter(f=>({...f,search:e.target.value}))}
                        style={{...IS,width:"100%",boxSizing:"border-box",marginBottom:7}}/>
                      <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
                        <select value={filter.role} onChange={e=>setFilter(f=>({...f,role:e.target.value}))} style={{...IS,flex:1,minWidth:90}}><option value="All">All Roles</option>{ROLES.map(r=><option key={r} value={r}>{r}</option>)}</select>
                        <select value={filter.phase} onChange={e=>setFilter(f=>({...f,phase:e.target.value}))} style={{...IS,flex:1,minWidth:90}}><option value="All">All Stages</option>{["prospect","rising","peak","fading","veteran"].map(p=><option key={p} value={p}>{agePhaseLabel(p)}</option>)}</select>
                        <select value={filter.status} onChange={e=>setFilter(f=>({...f,status:e.target.value}))} style={{...IS,flex:1,minWidth:90}}><option value="All">All Statuses</option>{["Fit","Injured","Away","Unhappy","Renewing"].map(v=><option key={v} value={v}>{v}</option>)}</select>
                      </div>
                      <button onClick={()=>setFilter(f=>({...f,position:"All",race:"All",search:"",role:"All",phase:"All",status:"All"}))}
                        style={{background:"none",border:"none",cursor:"pointer",color:"#7E2D26",fontSize:11,padding:0,textDecoration:"underline",fontFamily:"'Alegreya Sans',sans-serif"}}>
                        Clear all filters
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
```

Notes: the `Other` select's `pa-pill` class needs select-friendly overrides — verify appearance; add `appearance:"none"` via inline style if the native chrome fights the pill look. Sort keeps its full option list; `value` must remain the bare sort key (the option label carries the `Sort:` prefix), which works because option `value` attrs are set explicitly.

- [ ] **Step 3: Compact pill CSS for ≤640px**

In `RESPONSIVE_CSS`, add to the existing mobile block (or a new one):

```css
  @media (max-width: 640px) {
    .rm-sq-row .pa-pill { padding: 5px 8px; font-size: 10px; }
    .rm-sq-row { gap: 4px !important; }
  }
```

Check the `.pa-pill` base definition first (~line 99) and mirror its box model; ensure `select.pa-pill` renders acceptably in both breakpoints.

- [ ] **Step 4: Tests + lint + build**

`npm test` → 50 passed. `npm run build` → clean. Lint: no new `no-undef`.

- [ ] **Step 5: Commit**

`Squad: three-row filter chrome (synergy chips, badged disclosure)`.

---

### Task 3: Browser verification (375px + desktop)

- [ ] **Step 1: Drive at 375px** (resize_window mobile preset)

1. Squad tab: exactly 3 filter rows; position row single-line with full names; no horizontal overflow (`document.body.scrollWidth <= window.innerWidth`).
2. Race chips: seed/verify vs actual roster counts; tap a chip → filters + inks; singletons in Other select; picking one filters and inks the select.
3. More filters: open → panel; set Status=Injured → badge `(1)`; collapse → badge persists; Clear all resets everything and card list returns to full.
4. Dominion tab: standings table is the first block; sidebar follows.

- [ ] **Step 2: Desktop spot-check** (resize desktop preset)

Same three rows, roomier; Dominion two-column unchanged (table top-left).

- [ ] **Step 3: Fix anything broken, re-verify.**

---

### Task 4: Docs + PR

- [ ] **Step 1:** ROADMAP resolved entry + BUILD_HISTORY section (squad filter rethink + dominion order). CURRENT_STATE has no filter-layout prose to correct — skim to confirm.
- [ ] **Step 2:** Final gates (`npm test`, build, lint), commit docs, push `claude/squad-screen-mobile`, `gh pr create` with before/after description and verification notes.

---

## Self-review notes

- Spec coverage: 3 rows (T2 step 2), full-name pills (row 1), 2+ threshold + Other select + self-healing edges (row 2 code derives from live `heroes` every render, so demotion/graduation is automatic; active-race-below-2 keeps `filter.race` and the select shows it active via `otherActive`), badge counts hidden four only, Clear all resets filters not sort, Dominion order (T1), testing matrix (T3). All covered.
- Names consistent: `moreFiltersOpen`, `rm-sq-row`, existing `filter` keys (`position/race/search/role/phase/status/sortBy`) — matched to the state shape at line 7757.
- Kicker labels dropped per spec (no `Position`/`Race` spans in new markup).
