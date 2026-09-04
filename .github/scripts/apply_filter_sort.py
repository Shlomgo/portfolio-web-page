from pathlib import Path
import re

path = Path('index.html')
s = path.read_text(encoding='utf-8')

# Replace the old always-visible State / Status / Sort-by strip with one compact dropdown.
controls_pattern = re.compile(r'\n  <div class="controls">.*?\n  </div>\n\n  <div class="desktop-table">', re.S)
new_controls = r'''
  <div class="filter-toolbar">
    <details class="filter-dropdown" id="filterDropdown">
      <summary class="filter-trigger" aria-label="Filter properties">
        <svg class="filter-trigger-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M3 4h14l-5.4 6.2v4.7l-3.2 1.6v-6.3L3 4Z"></path>
        </svg>
        <span>Filter properties</span>
        <span class="filter-active-count" id="filterActiveCount" hidden>0</span>
        <span class="filter-caret" aria-hidden="true">⌄</span>
      </summary>

      <div class="filter-panel" role="group" aria-label="Property filters">
        <div class="filter-panel-grid">
          <fieldset class="filter-section filter-state-section">
            <legend>State</legend>
            <div class="filter-check-list" id="stateFilterOptions"></div>
          </fieldset>

          <fieldset class="filter-section filter-status-section">
            <legend>Status</legend>
            <div class="filter-check-list" id="statusFilterOptions"></div>
          </fieldset>

          <fieldset class="filter-section">
            <legend>Price range</legend>
            <div class="filter-range-row">
              <label><span>Min</span><input class="filter-input" id="filterPriceMin" type="number" min="0" step="1000" inputmode="numeric" placeholder="$"></label>
              <label><span>Max</span><input class="filter-input" id="filterPriceMax" type="number" min="0" step="1000" inputmode="numeric" placeholder="$"></label>
            </div>
          </fieldset>

          <fieldset class="filter-section">
            <legend>Cash flow / mo</legend>
            <div class="filter-range-row">
              <label><span>Min</span><input class="filter-input" id="filterCashMin" type="number" step="25" inputmode="numeric" placeholder="$"></label>
              <label><span>Max</span><input class="filter-input" id="filterCashMax" type="number" step="25" inputmode="numeric" placeholder="$"></label>
            </div>
          </fieldset>

          <fieldset class="filter-section">
            <legend>Modeled return</legend>
            <div class="filter-range-row">
              <label><span>Min</span><input class="filter-input" id="filterReturnMin" type="number" step="0.5" inputmode="decimal" placeholder="%"></label>
              <label><span>Max</span><input class="filter-input" id="filterReturnMax" type="number" step="0.5" inputmode="decimal" placeholder="%"></label>
            </div>
          </fieldset>
        </div>

        <div class="filter-panel-actions">
          <button type="button" class="filter-clear" id="clearFilters">Clear filters</button>
          <button type="button" class="filter-apply" id="applyFilters">Apply filters</button>
        </div>
      </div>
    </details>
    <div class="count-note" id="countNote"></div>
  </div>

  <div class="desktop-table">'''
s, n = controls_pattern.subn(new_controls, s, count=1)
if n != 1:
    raise SystemExit(f'Expected to replace one controls block, replaced {n}.')

css = r'''

/* ===== 2026-09-04 compact dropdown filtering + clickable column sorting ===== */
.filter-toolbar{
  position:relative;
  z-index:70;
  display:flex;
  align-items:center;
  gap:14px;
  min-height:42px;
  margin:2px 0 16px;
  padding:0 0 12px;
  border-bottom:1px solid var(--status-border);
}
.filter-toolbar .count-note{
  margin-left:auto;
  align-self:center;
  padding:0;
}
.filter-dropdown{position:relative;}
.filter-dropdown > summary{
  list-style:none;
  display:inline-flex;
  align-items:center;
  gap:8px;
  min-height:36px;
  padding:7px 11px;
  border:1px solid var(--status-border);
  border-radius:4px;
  background:transparent;
  color:var(--text-primary);
  font-family:'IBM Plex Sans',sans-serif;
  font-size:12.5px;
  font-weight:500;
  line-height:1;
  cursor:pointer;
  user-select:none;
  transition:border-color .12s ease,background .12s ease;
}
.filter-dropdown > summary::-webkit-details-marker{display:none;}
.filter-dropdown > summary::marker{display:none;content:'';}
.filter-dropdown > summary:hover,
.filter-dropdown[open] > summary{
  border-color:rgba(168,166,160,.72);
  background:rgba(168,166,160,.045);
}
.filter-trigger-icon{
  width:15px;
  height:15px;
  fill:none;
  stroke:currentColor;
  stroke-width:1.4;
  stroke-linejoin:round;
}
.filter-caret{
  color:var(--text-secondary);
  font-family:'IBM Plex Mono',monospace;
  font-size:12px;
  transform:translateY(-1px);
  transition:transform .12s ease;
}
.filter-dropdown[open] .filter-caret{transform:rotate(180deg) translateY(1px);}
.filter-active-count{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-width:18px;
  height:18px;
  padding:0 5px;
  border:1px solid rgba(225,184,95,.58);
  border-radius:100px;
  background:rgba(225,184,95,.09);
  color:#E1B85F;
  font-family:'IBM Plex Mono',monospace;
  font-size:9.5px;
  font-weight:600;
}
.filter-active-count[hidden]{display:none;}
.filter-panel{
  position:absolute;
  top:calc(100% + 8px);
  left:0;
  width:min(720px,calc(100vw - 64px));
  padding:16px;
  border:1px solid var(--status-border);
  border-radius:4px;
  background:#171a1f;
  box-shadow:0 18px 45px rgba(0,0,0,.42);
  z-index:120;
}
.filter-panel-grid{
  display:grid;
  grid-template-columns:1.15fr 1.15fr 1fr;
  gap:16px 20px;
  align-items:start;
}
.filter-section{
  min-width:0;
  margin:0;
  padding:0;
  border:0;
}
.filter-section legend{
  width:100%;
  margin:0 0 8px;
  padding:0;
  color:var(--text-secondary);
  font-family:'IBM Plex Mono',monospace;
  font-size:9.5px;
  font-weight:500;
  letter-spacing:.09em;
  text-transform:uppercase;
}
.filter-state-section{grid-row:span 2;}
.filter-status-section{grid-row:span 2;}
.filter-check-list{
  display:grid;
  gap:6px;
  max-height:170px;
  overflow:auto;
  padding-right:4px;
}
.filter-check{
  display:flex;
  align-items:flex-start;
  gap:7px;
  color:var(--text-primary);
  font-family:'IBM Plex Sans',sans-serif;
  font-size:12px;
  line-height:1.3;
  cursor:pointer;
}
.filter-check input{
  margin:1px 0 0;
  accent-color:var(--text-secondary);
  cursor:pointer;
  flex:0 0 auto;
}
.filter-check.recommended span{color:#E1B85F;}
.filter-range-row{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:8px;
}
.filter-range-row label{display:block;min-width:0;}
.filter-range-row label > span{
  display:block;
  margin-bottom:4px;
  color:var(--text-secondary);
  font-family:'IBM Plex Mono',monospace;
  font-size:9px;
}
.filter-input{
  width:100%;
  min-width:0;
  height:34px;
  padding:6px 8px;
  border:1px solid var(--status-border);
  border-radius:3px;
  outline:none;
  background:var(--bg);
  color:var(--text-primary);
  font-family:'IBM Plex Mono',monospace;
  font-size:11.5px;
}
.filter-input:focus{border-color:var(--text-secondary);}
.filter-input::placeholder{color:rgba(168,166,160,.52);}
.filter-panel-actions{
  display:flex;
  align-items:center;
  justify-content:flex-end;
  gap:10px;
  margin-top:16px;
  padding-top:12px;
  border-top:1px solid var(--status-border);
}
.filter-clear,
.filter-apply{
  min-height:34px;
  padding:7px 12px;
  border-radius:3px;
  font-family:'IBM Plex Sans',sans-serif;
  font-size:11.5px;
  font-weight:500;
  cursor:pointer;
}
.filter-clear{
  border:1px solid transparent;
  background:transparent;
  color:var(--text-secondary);
}
.filter-clear:hover{color:var(--text-primary);}
.filter-apply{
  border:1px solid #E1B85F;
  background:#E1B85F;
  color:#14171c;
}
.filter-apply:hover{background:#F0CF82;border-color:#F0CF82;}

thead th.sortable .th-title-row{
  cursor:pointer;
  user-select:none;
}
thead th.sortable .th-title-row::after{
  content:'↕';
  display:inline-block;
  margin-left:1px;
  color:var(--text-secondary);
  font-size:9px;
  line-height:1;
  opacity:0;
  transition:opacity .12s ease,color .12s ease;
}
thead th.sortable:hover .th-title-row::after{opacity:.58;}
thead th.sortable[data-sort-direction="asc"] .th-title-row::after{
  content:'↑';
  opacity:1;
  color:var(--text-primary);
}
thead th.sortable[data-sort-direction="desc"] .th-title-row::after{
  content:'↓';
  opacity:1;
  color:var(--text-primary);
}
thead th.sortable:focus-visible{
  outline:1px solid var(--text-secondary);
  outline-offset:-2px;
}
.sticky-table-header{pointer-events:auto;}

@media (max-width:900px){
  .filter-panel-grid{grid-template-columns:1fr 1fr;}
  .filter-state-section,.filter-status-section{grid-row:auto;}
}
@media (max-width:760px){
  .filter-toolbar{
    align-items:center;
    margin-bottom:12px;
  }
  .filter-toolbar .count-note{
    width:auto;
    margin-left:auto;
    order:0;
    padding:0;
    text-align:right;
  }
  .filter-panel{
    width:calc(100vw - 32px);
    max-width:none;
    padding:14px;
  }
  .filter-panel-grid{grid-template-columns:1fr;gap:15px;}
  .filter-check-list{max-height:none;}
}
@media (max-width:520px){
  .filter-toolbar{gap:8px;}
  .filter-dropdown > summary{padding-left:9px;padding-right:9px;}
  .filter-toolbar .count-note{font-size:10.5px;}
}
'''
style_marker = '\n</style>\n<script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js"></script>'
if style_marker not in s:
    raise SystemExit('Could not find end-of-style marker.')
s = s.replace(style_marker, css + style_marker, 1)

# Replace old chip controls + select sorting logic with dropdown filtering + header sorting.
js_pattern = re.compile(r'let activeStates = new Set\(\);.*?\nfunction detailReceiptLinesHTML\(d\)\{', re.S)
new_js = r'''let activeStates = new Set();
let activeStatuses = new Set(["closed","under_contract","proposed"]);
let filterRanges = {
  minPrice:null,
  maxPrice:null,
  minCash:null,
  maxCash:null,
  minReturn:null,
  maxReturn:null
};

const FILTER_STATUS_CODES = ["proposed","under_contract","closed"];
const STATUS_SORT_ORDER = {proposed:0, under_contract:1, closed:2};
let sortKey = "status";
let sortDirection = "asc";

function makeFilterCheckbox(container, kind, value, labelText, checked, recommended=false){
  const label = document.createElement("label");
  label.className = "filter-check" + (recommended ? " recommended" : "");

  const input = document.createElement("input");
  input.type = "checkbox";
  input.value = value;
  input.dataset.filterKind = kind;
  input.checked = checked;

  const text = document.createElement("span");
  text.textContent = labelText;

  label.appendChild(input);
  label.appendChild(text);
  container.appendChild(label);
}

function readNullableNumber(id){
  const el = document.getElementById(id);
  if(!el) return null;
  const raw = el.value.trim();
  if(raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function writeNullableNumber(id, value){
  const el = document.getElementById(id);
  if(el) el.value = value === null || value === undefined ? "" : String(value);
}

function syncFilterPanel(){
  document.querySelectorAll('#stateFilterOptions input[type="checkbox"]').forEach(input=>{
    input.checked = activeStates.has(input.value);
  });
  document.querySelectorAll('#statusFilterOptions input[type="checkbox"]').forEach(input=>{
    input.checked = activeStatuses.has(input.value);
  });

  writeNullableNumber("filterPriceMin", filterRanges.minPrice);
  writeNullableNumber("filterPriceMax", filterRanges.maxPrice);
  writeNullableNumber("filterCashMin", filterRanges.minCash);
  writeNullableNumber("filterCashMax", filterRanges.maxCash);
  writeNullableNumber("filterReturnMin", filterRanges.minReturn);
  writeNullableNumber("filterReturnMax", filterRanges.maxReturn);
}

function activeFilterCategoryCount(){
  const allStateCount = new Set(DATA.map(d=>d.state)).size;
  let count = 0;
  if(activeStates.size !== allStateCount) count += 1;
  if(activeStatuses.size !== FILTER_STATUS_CODES.length) count += 1;
  if(filterRanges.minPrice !== null || filterRanges.maxPrice !== null) count += 1;
  if(filterRanges.minCash !== null || filterRanges.maxCash !== null) count += 1;
  if(filterRanges.minReturn !== null || filterRanges.maxReturn !== null) count += 1;
  return count;
}

function updateFilterButtonState(){
  const badge = document.getElementById("filterActiveCount");
  if(!badge) return;
  const count = activeFilterCategoryCount();
  badge.textContent = String(count);
  badge.hidden = count === 0;
}

function applyFiltersFromPanel(){
  activeStates = new Set(
    [...document.querySelectorAll('#stateFilterOptions input[type="checkbox"]:checked')].map(input=>input.value)
  );
  activeStatuses = new Set(
    [...document.querySelectorAll('#statusFilterOptions input[type="checkbox"]:checked')].map(input=>input.value)
  );

  filterRanges = {
    minPrice:readNullableNumber("filterPriceMin"),
    maxPrice:readNullableNumber("filterPriceMax"),
    minCash:readNullableNumber("filterCashMin"),
    maxCash:readNullableNumber("filterCashMax"),
    minReturn:readNullableNumber("filterReturnMin"),
    maxReturn:readNullableNumber("filterReturnMax")
  };

  render();
  const dropdown = document.getElementById("filterDropdown");
  if(dropdown) dropdown.open = false;
}

function clearAllFilters(){
  activeStates = new Set(DATA.map(d=>d.state));
  activeStatuses = new Set(FILTER_STATUS_CODES);
  filterRanges = {
    minPrice:null,
    maxPrice:null,
    minCash:null,
    maxCash:null,
    minReturn:null,
    maxReturn:null
  };
  syncFilterPanel();
  render();
}

function buildFilterControls(){
  const stateWrap = document.getElementById("stateFilterOptions");
  const statusWrap = document.getElementById("statusFilterOptions");
  if(!stateWrap || !statusWrap) return;

  stateWrap.innerHTML = "";
  statusWrap.innerHTML = "";

  [...new Set(DATA.map(d=>d.state))]
    .sort((a,b)=>a.localeCompare(b))
    .forEach(state=> makeFilterCheckbox(stateWrap,"state",state,state,activeStates.has(state)));

  FILTER_STATUS_CODES.forEach(status=>{
    makeFilterCheckbox(
      statusWrap,
      "status",
      status,
      STATUS_LABEL[status],
      activeStatuses.has(status),
      status === "proposed"
    );
  });

  syncFilterPanel();
  updateFilterButtonState();

  const applyBtn = document.getElementById("applyFilters");
  const clearBtn = document.getElementById("clearFilters");
  const dropdown = document.getElementById("filterDropdown");
  const panel = dropdown ? dropdown.querySelector(".filter-panel") : null;

  if(applyBtn && !applyBtn.dataset.wired){
    applyBtn.dataset.wired = "true";
    applyBtn.addEventListener("click", applyFiltersFromPanel);
  }
  if(clearBtn && !clearBtn.dataset.wired){
    clearBtn.dataset.wired = "true";
    clearBtn.addEventListener("click", clearAllFilters);
  }
  if(panel && !panel.dataset.wired){
    panel.dataset.wired = "true";
    panel.addEventListener("keydown", e=>{
      if(e.key === "Enter" && e.target.matches(".filter-input")){
        e.preventDefault();
        applyFiltersFromPanel();
      }
    });
  }
  if(dropdown && !dropdown.dataset.wired){
    dropdown.dataset.wired = "true";
    dropdown.addEventListener("keydown", e=>{
      if(e.key === "Escape"){
        dropdown.open = false;
        const summary = dropdown.querySelector("summary");
        if(summary) summary.focus();
      }
    });
    document.addEventListener("click", e=>{
      if(dropdown.open && !dropdown.contains(e.target)) dropdown.open = false;
    });
  }
}

function matchesFilters(d){
  if(!activeStates.has(d.state) || !activeStatuses.has(d.status)) return false;
  if(filterRanges.minPrice !== null && d.price < filterRanges.minPrice) return false;
  if(filterRanges.maxPrice !== null && d.price > filterRanges.maxPrice) return false;
  if(filterRanges.minCash !== null && d.cashflow < filterRanges.minCash) return false;
  if(filterRanges.maxCash !== null && d.cashflow > filterRanges.maxCash) return false;
  if(filterRanges.minReturn !== null && d.totalReturn < filterRanges.minReturn) return false;
  if(filterRanges.maxReturn !== null && d.totalReturn > filterRanges.maxReturn) return false;
  return true;
}

function sortRows(rows){
  const direction = sortDirection === "asc" ? 1 : -1;

  return [...rows].sort((a,b)=>{
    let cmp = 0;

    if(sortKey === "status"){
      cmp = (STATUS_SORT_ORDER[a.status] ?? 99) - (STATUS_SORT_ORDER[b.status] ?? 99);
      if(cmp !== 0) return cmp * direction;
      return String(b.date||"").localeCompare(String(a.date||""));
    }

    if(sortKey === "id" || sortKey === "state"){
      cmp = String(a[sortKey]||"").localeCompare(String(b[sortKey]||""), undefined, {numeric:true});
    } else {
      const av = Number(a[sortKey]);
      const bv = Number(b[sortKey]);
      const aFinite = Number.isFinite(av);
      const bFinite = Number.isFinite(bv);
      if(!aFinite && !bFinite) cmp = 0;
      else if(!aFinite) return 1;
      else if(!bFinite) return -1;
      else cmp = av - bv;
    }

    if(cmp === 0) return String(b.date||"").localeCompare(String(a.date||""));
    return cmp * direction;
  });
}

function updateSortIndicators(){
  document.querySelectorAll('.desktop-table th.sortable').forEach(th=>{
    const active = th.dataset.sortKey === sortKey;
    th.dataset.sortDirection = active ? sortDirection : "";
    th.setAttribute("aria-sort", active ? (sortDirection === "asc" ? "ascending" : "descending") : "none");
  });
}

function activateHeaderSort(key){
  if(!key) return;
  if(sortKey === key){
    sortDirection = sortDirection === "asc" ? "desc" : "asc";
  } else {
    sortKey = key;
    sortDirection = "asc";
  }
  render();
}

function initSortableHeaders(){
  const header = document.querySelector('.column-header-row');
  const desktop = document.querySelector('.desktop-table');
  if(!header || !desktop) return;

  const specs = [
    ["status-col","status"],
    ["id-col","id"],
    ["state-col","state"],
    ["price-col","price"],
    ["down-col","down"],
    ["invested-col","invested"],
    ["rent-col","rent"],
    ["cash-return-col","cashflow"],
    ["principal-return-col","principal"],
    ["appreciation-col","apprContribution"],
    ["modeled-return-col","totalReturn"]
  ];

  specs.forEach(([className,key])=>{
    const th = header.querySelector(`th.${className}`);
    if(!th) return;
    th.classList.add("sortable");
    th.dataset.sortKey = key;
    th.dataset.sortDirection = "";
    th.setAttribute("tabindex","0");
    th.setAttribute("aria-sort","none");
  });

  updateSortIndicators();

  desktop.addEventListener("click", e=>{
    if(e.target.closest(".info-dot, .fx-dot")) return;
    const th = e.target.closest("th.sortable");
    if(!th || !desktop.contains(th)) return;
    activateHeaderSort(th.dataset.sortKey);
  });

  desktop.addEventListener("keydown", e=>{
    if(e.target.closest(".info-dot, .fx-dot")) return;
    const th = e.target.closest("th.sortable");
    if(!th || !desktop.contains(th)) return;
    if(e.key === "Enter" || e.key === " "){
      e.preventDefault();
      activateHeaderSort(th.dataset.sortKey);
    }
  });
}

function detailReceiptLinesHTML(d){'''
s, n = js_pattern.subn(new_js, s, count=1)
if n != 1:
    raise SystemExit(f'Expected to replace one filter/sort JS block, replaced {n}.')

old_render = 'const rows = sortRows(DATA.filter(d=>activeStates.has(d.state) && activeStatuses.has(d.status)));'
new_render = 'const rows = sortRows(DATA.filter(matchesFilters));'
if old_render not in s:
    raise SystemExit('Could not find render filtering line.')
s = s.replace(old_render, new_render, 1)

old_count = 'document.getElementById("countNote").textContent = `Showing ${rows.length} of ${DATA.length} properties`;\n  renderMobile(rows);'
new_count = 'document.getElementById("countNote").textContent = `Showing ${rows.length} of ${DATA.length} properties`;\n  updateFilterButtonState();\n  updateSortIndicators();\n  renderMobile(rows);'
if old_count not in s:
    raise SystemExit('Could not find render count block.')
s = s.replace(old_count, new_count, 1)

if '      buildChips();' not in s:
    raise SystemExit('Could not find buildChips call.')
s = s.replace('      buildChips();', '      buildFilterControls();', 1)

old_init = 'initStickyTableHeader();\nloadData();'
new_init = 'initSortableHeaders();\ninitStickyTableHeader();\nloadData();'
if old_init not in s:
    raise SystemExit('Could not find initialization block.')
s = s.replace(old_init, new_init, 1)

# Verify the old controls are gone and the new behavior is present before writing.
assert 'id="filterDropdown"' in s
assert 'function initSortableHeaders' in s
assert 'DATA.filter(matchesFilters)' in s
assert 'id="sortSelect"' not in s
assert 'id="stateChips"' not in s

path.write_text(s, encoding='utf-8')
