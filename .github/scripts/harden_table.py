from pathlib import Path

p = Path("index.html")
s = p.read_text()

old = '<tbody id="tableBody"></tbody>'
new = '<tbody id="tableBody"><tr class="table-message-row"><td colspan="15"><div class="table-load-message">Loading properties…</div></td></tr></tbody>'
assert s.count(old) == 1, f"Expected one empty table body, found {s.count(old)}"
s = s.replace(old, new, 1)

old = '<div id="mobilePropertyList" class="mobile-property-list"></div>'
new = '<div id="mobilePropertyList" class="mobile-property-list"><div class="mobile-load-message">Loading properties…</div></div>'
assert s.count(old) == 1, f"Expected one mobile property list, found {s.count(old)}"
s = s.replace(old, new, 1)

css = '''

/* ===== Table loading resilience + unclipped click popups ===== */
.table-message-row td{
  height:72px;
  padding:18px 8px;
  border-bottom:1px solid var(--status-border);
}
.table-load-message,
.mobile-load-message{
  color:var(--text-secondary);
  font-family:'IBM Plex Mono',monospace;
  font-size:11.5px;
  letter-spacing:.01em;
}
.mobile-load-message{
  padding:20px 2px;
  border-top:1px solid var(--status-border);
  border-bottom:1px solid var(--status-border);
}
.table-load-message.is-error,
.mobile-load-message.is-error{color:#d6b77a;}
.info-dot.clicked-open .tip,
.fx-dot.clicked-open .tip{z-index:9999;}
'''
if '/* ===== Table loading resilience + unclipped click popups ===== */' not in s:
    s = s.replace('</style>', css + '\n</style>', 1)

old_listener = '''document.addEventListener("click", (e)=>{
  if(e.target.closest(".tip")){ e.stopPropagation(); return; }
  const dot = e.target.closest(".info-dot, .fx-dot");
  document.querySelectorAll(".info-dot.open, .fx-dot.open").forEach(el=>{ if(el!==dot) el.classList.remove("open"); });
  if(dot){
    e.stopPropagation();
    dot.classList.toggle("open");
  }
});'''
new_listener = '''function resetClickedTip(dot){
  if(!dot) return;
  dot.classList.remove("clicked-open");
  const tip = dot.querySelector(".tip");
  if(!tip) return;
  ["position","left","top","right","bottom","transform","zIndex"].forEach(prop=> tip.style[prop] = "");
}

function positionClickedTip(dot){
  const tip = dot && dot.querySelector(".tip");
  if(!tip) return;
  dot.classList.add("clicked-open");
  tip.style.position = "fixed";
  tip.style.left = "16px";
  tip.style.top = "16px";
  tip.style.right = "auto";
  tip.style.bottom = "auto";
  tip.style.transform = "none";
  tip.style.zIndex = "9999";

  requestAnimationFrame(()=>{
    if(!dot.classList.contains("open")) return;
    const anchor = dot.getBoundingClientRect();
    const box = tip.getBoundingClientRect();
    const gap = 8;
    const edge = 12;
    let left = anchor.left + anchor.width/2 - box.width/2;
    left = Math.max(edge, Math.min(left, window.innerWidth - box.width - edge));
    let top = anchor.bottom + gap;
    if(top + box.height > window.innerHeight - edge){
      top = anchor.top - box.height - gap;
    }
    top = Math.max(edge, Math.min(top, window.innerHeight - box.height - edge));
    tip.style.left = `${Math.round(left)}px`;
    tip.style.top = `${Math.round(top)}px`;
  });
}

document.addEventListener("click", (e)=>{
  if(e.target.closest(".tip")){ e.stopPropagation(); return; }
  const dot = e.target.closest(".info-dot, .fx-dot");
  document.querySelectorAll(".info-dot.open, .fx-dot.open").forEach(el=>{
    if(el!==dot){ el.classList.remove("open"); resetClickedTip(el); }
  });
  if(dot){
    e.stopPropagation();
    const opening = !dot.classList.contains("open");
    dot.classList.toggle("open", opening);
    if(opening) positionClickedTip(dot);
    else resetClickedTip(dot);
  }
});

window.addEventListener("resize", ()=>{
  document.querySelectorAll(".info-dot.open.clicked-open, .fx-dot.open.clicked-open").forEach(positionClickedTip);
});'''
assert s.count(old_listener) == 1, f"Expected one tooltip listener, found {s.count(old_listener)}"
s = s.replace(old_listener, new_listener, 1)

marker = '// ===== LOAD DATA FROM GOOGLE SHEETS, THEN BUILD THE PAGE =====\nfunction loadData(){'
helper = '''// ===== LOAD DATA FROM GOOGLE SHEETS, THEN BUILD THE PAGE =====
function showDataLoadError(){
  const body = document.getElementById("tableBody");
  if(body){
    body.innerHTML = '<tr class="table-message-row"><td colspan="15"><div class="table-load-message is-error">Could not load property data. Please refresh the page.</div></td></tr>';
  }
  const mobile = document.getElementById("mobilePropertyList");
  if(mobile){
    mobile.innerHTML = '<div class="mobile-load-message is-error">Could not load property data. Please refresh the page.</div>';
  }
  const count = document.getElementById("countNote");
  if(count) count.textContent = "Property data unavailable";
}

function loadData(){'''
assert s.count(marker) == 1, f"Expected one loadData marker, found {s.count(marker)}"
s = s.replace(marker, helper, 1)

old_start = '''function loadData(){
  const wrap = document.querySelector(".table-wrap");
  Papa.parse(SHEET_CSV_URL, {'''
new_start = '''function loadData(){
  const wrap = document.querySelector(".table-wrap");
  if(!window.Papa || typeof window.Papa.parse !== "function"){
    console.error("Papa Parse did not load.");
    showDataLoadError();
    return;
  }
  Papa.parse(SHEET_CSV_URL, {'''
assert s.count(old_start) == 1, f"Expected one loadData start, found {s.count(old_start)}"
s = s.replace(old_start, new_start, 1)

old_error = '''      if(wrap){
        wrap.innerHTML = '<p style="color:#38bdf8;font-family:monospace;">Could not load data from the Google Sheet. Check that SHEET_CSV_URL is set correctly and the sheet is published to the web.</p>';
      }
      if(stickyHeaderState.initialized){'''
new_error = '''      showDataLoadError();
      if(stickyHeaderState.initialized){'''
assert s.count(old_error) == 1, f"Expected one sheet error handler, found {s.count(old_error)}"
s = s.replace(old_error, new_error, 1)

p.write_text(s)
print("Patched index.html")
