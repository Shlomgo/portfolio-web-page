from pathlib import Path
import re

path = Path("index.html")
s = path.read_text()

if "2026-09-04 requested payoff/table refinements" in s:
    raise SystemExit("Requested refinements are already present")

legend_pattern = re.compile(
    r'\n  <div class="legend-row">\n'
    r'.*?Formula — hover or tap ƒx beside a calculated field</span>\n'
    r'  </div>\n'
    r'  <p class="click-hint">Click any blue Appreciation box in the table below to see exactly how that number breaks down for that property\.</p>\n',
    re.S,
)
s, n = legend_pattern.subn("\n", s, count=1)
if n != 1:
    raise SystemExit(f"Expected to remove one old legend/click-hint block; found {n}")

old_scroll = '  <p class="table-scroll-hint">Scroll horizontally to see all columns →</p>\n'
if s.count(old_scroll) != 1:
    raise SystemExit(f"Expected one horizontal-scroll hint; found {s.count(old_scroll)}")
s = s.replace(old_scroll, "", 1)

old_subtitle = '              <div class="payoff-subtitle">3 real levers add up to the modeled return</div>\n'
new_subtitle = '''              <div class="payoff-subtitle">3 real levers add up to the modeled return</div>
              <div class="payoff-inline-legend">
                <span class="legend-swatch"><span class="legend-dot actual"></span> Operating figures — actual for closed properties, underwritten for pipeline properties</span>
                <span class="legend-swatch"><span class="legend-dot predicted"></span> Forecast — appreciation assumption, not guaranteed</span>
              </div>
'''
if s.count(old_subtitle) != 1:
    raise SystemExit(f"Expected one payoff subtitle; found {s.count(old_subtitle)}")
s = s.replace(old_subtitle, new_subtitle, 1)

old_appreciation = '              <span class="payoff-card-copy">Forecast — 3% ×<br>3.33× leverage</span>\n'
new_appreciation = '              <span class="payoff-card-copy">Forecast — 3% annual ×<br>3.33× leverage</span>\n'
if s.count(old_appreciation) != 1:
    raise SystemExit(f"Expected one appreciation callout line; found {s.count(old_appreciation)}")
s = s.replace(old_appreciation, new_appreciation, 1)

css = r'''

/* ===== 2026-09-04 requested payoff/table refinements ===== */
/* Put the operating/forecast key directly between the payoff subtitle and cards. */
thead .payoff-intro-row > th:first-child{grid-column:1 / 13;}
thead .payoff-intro-row > th:last-child{display:none;}
.payoff-inline-legend{
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  gap:5px 24px;
  margin-top:8px;
  max-width:100%;
  font-family:'IBM Plex Mono',monospace;
  font-size:10.5px;
  line-height:1.35;
  color:var(--text-secondary);
}
.payoff-inline-legend .legend-swatch{gap:7px;}
.payoff-inline-legend .legend-dot{width:9px;height:9px;}

/* Let each callout begin slightly left of its data column while keeping its arrow
   centered over the data below. The appreciation card is intentionally a little
   shorter on the right than the other three. */
.payoff-card{
  width:calc(100% - 1px);
  margin-left:-4px;
  margin-right:0;
}
.payoff-card .payoff-arrow{left:calc(50% + 5px);}
.payoff-card.appreciation{width:calc(100% - 10px);}
.payoff-card.appreciation .payoff-arrow{left:calc(50% + 9px);}
.payoff-card.appreciation .payoff-op{right:-24px;}

/* Show the same + + = relationship on every desktop data row. */
tbody tr.data-row td.cash-return-col,
tbody tr.data-row td.principal-return-col,
tbody tr.data-row td.appreciation-col{position:relative;}
tbody tr.data-row td.cash-return-col::after,
tbody tr.data-row td.principal-return-col::after,
tbody tr.data-row td.appreciation-col::after{
  position:absolute;
  right:-8px;
  top:50%;
  transform:translateY(-50%);
  z-index:4;
  width:16px;
  height:16px;
  display:flex;
  align-items:center;
  justify-content:center;
  border:1px solid var(--status-border);
  border-radius:50%;
  background:var(--bg);
  color:var(--text-secondary);
  font-family:'IBM Plex Mono',monospace;
  font-size:10px;
  line-height:1;
  pointer-events:none;
}
tbody tr.data-row td.cash-return-col::after,
tbody tr.data-row td.principal-return-col::after{content:'+';}
tbody tr.data-row td.appreciation-col::after{content:'=';}
tbody tr.data-row td.principal-return-col,
tbody tr.data-row td.appreciation-col,
tbody tr.data-row td.modeled-return-col{padding-left:13px;}

/* Center the status treatment inside its column. */
tbody tr.data-row td.status-cell{text-align:center;}
tbody tr.data-row td.status-cell .property-page-link{
  margin-left:auto;
  margin-right:auto;
}

/* Property-page links use the exact amber/gold used by the Open Book mark. */
.property-page-link,
.mp-property-page-link{color:#E1B85F;}
.property-page-link:hover,
.mp-property-page-link:hover{color:#F0CF82;}
'''

style_close = "\n</style>"
if s.count(style_close) != 1:
    raise SystemExit(f"Expected one closing style tag; found {s.count(style_close)}")
s = s.replace(style_close, css + style_close, 1)

path.write_text(s)
