from pathlib import Path
import re

path = Path('index.html')
s = path.read_text(encoding='utf-8')
marker = '/* ===== 2026-09-04 payoff layout correction v2 ===== */'
if marker in s:
    print('v2 correction already present')
    raise SystemExit(0)

pattern = re.compile(
    r'<tr class="payoff-box-row user-approved-payoff-row">.*?<tr class="column-header-row">',
    re.S,
)
replacement = '''<tr class="payoff-box-row user-approved-payoff-row">
  <th colspan="15" class="payoff-equation-shell">
    <div class="payoff-equation-grid">
      <div class="payoff-copy-cell">
        <div class="payoff-copy">
          <div class="payoff-title">How this kind of real estate pays you</div>
          <div class="payoff-subtitle">3 real levers add up to the modeled return.</div>
          <div class="payoff-inline-legend">
            <span class="legend-swatch"><span class="legend-dot actual"></span> Operating figures — actual for closed properties, underwritten for pipeline properties</span>
            <span class="legend-swatch"><span class="legend-dot predicted"></span> Forecast — appreciation assumption, not guaranteed</span>
          </div>
        </div>
      </div>

      <div class="payoff-card cash payoff-grid-cash">
        <span class="payoff-card-name">Cash flow</span>
        <span class="payoff-card-copy">Actual — money<br>in your account<br>monthly</span>
        <span class="payoff-arrow" aria-hidden="true"></span>
      </div>

      <div class="payoff-equation-operator payoff-grid-op1" aria-hidden="true">
        <span class="equation-op plus">+</span>
      </div>

      <div class="payoff-card principal payoff-grid-principal">
        <span class="payoff-card-name">Principal<br>(loan debt)</span>
        <span class="payoff-card-copy">Actual — tenant<br>pays down your<br>loan debt</span>
        <span class="payoff-arrow" aria-hidden="true"></span>
      </div>

      <div class="payoff-equation-operator payoff-grid-op2" aria-hidden="true">
        <span class="equation-op plus">+</span>
      </div>

      <div class="payoff-card appreciation payoff-grid-appreciation">
        <span class="payoff-card-name">Appreciation</span>
        <span class="payoff-card-copy">Forecast — 3% annual ×<br>3.33× leverage</span>
        <span class="payoff-arrow" aria-hidden="true"></span>
      </div>

      <div class="payoff-equation-operator payoff-grid-op3" aria-hidden="true">
        <span class="equation-op equal">=</span>
      </div>

      <div class="payoff-card modeled payoff-grid-modeled">
        <span class="payoff-card-name">Modeled return</span>
        <span class="payoff-card-copy">Cash flow + principal +<br>appreciation</span>
        <span class="payoff-arrow" aria-hidden="true"></span>
      </div>
    </div>
  </th>
</tr>
<tr class="column-header-row">'''

s, count = pattern.subn(replacement, s, count=1)
assert count == 1, 'Could not locate the current payoff header row'

css = r'''

/* ===== 2026-09-04 payoff layout correction v2 ===== */
/* Keep the real table rows as table rows. The explainer equation gets its own
   internal grid instead of turning a <tr> into a CSS grid, which caused the
   browser to stack the cells diagonally. */
thead .payoff-box-row,
thead .column-header-row{
  display:table-row !important;
  width:auto !important;
  grid-template-columns:none !important;
}
thead .payoff-box-row > th,
thead .column-header-row > th{
  display:table-cell !important;
}
thead .payoff-box-row > .payoff-equation-shell{
  padding:0 0 22px !important;
  border-bottom:0 !important;
  overflow:visible !important;
}
.payoff-equation-grid{
  display:grid;
  grid-template-columns:var(--table-columns);
  grid-template-rows:auto;
  width:var(--table-width);
  align-items:start;
  overflow:visible;
}
.payoff-equation-grid > *{grid-row:1;}
.payoff-equation-grid > .payoff-copy-cell{
  grid-column:1 / 9;
  min-height:96px;
  display:flex;
  align-items:center;
  padding:0 28px 0 5px !important;
}
.payoff-grid-cash{grid-column:9;}
.payoff-grid-op1{grid-column:10;}
.payoff-grid-principal{grid-column:11;}
.payoff-grid-op2{grid-column:12;}
.payoff-grid-appreciation{grid-column:13;}
.payoff-grid-op3{grid-column:14;}
.payoff-grid-modeled{grid-column:15;}

/* All four cards live on the same baseline and each arrow is the exact center
   of the data column beneath it. */
.payoff-equation-grid > .payoff-card,
.payoff-equation-grid > .payoff-card.appreciation{
  width:calc(100% - 8px);
  min-height:96px;
  margin:0 4px;
  padding:9px 7px 10px;
  align-self:start;
}
.payoff-equation-grid .payoff-arrow,
.payoff-equation-grid .payoff-card.appreciation .payoff-arrow{
  left:50% !important;
  transform:translateX(-50%) !important;
  bottom:-17px;
}
.payoff-equation-grid > .payoff-equation-operator{
  height:96px;
  padding:0 !important;
  margin:0 !important;
  display:flex !important;
  align-items:center;
  justify-content:center;
  align-self:start;
}

/* The hybrid box should read like the modeled-return cells, not like a bright
   gradient tile. The fill is deliberately dark; only the tint and outline move
   from green on the left to blue on the right. */
.payoff-card.modeled,
.tr-wrap{
  border:1px solid transparent !important;
  background:
    linear-gradient(90deg,#172019 0%,#171e1b 46%,#151d20 54%,#142029 100%) padding-box,
    linear-gradient(90deg,rgba(74,222,128,.88),rgba(56,189,248,.88)) border-box !important;
  box-shadow:none !important;
}
.payoff-card.modeled .payoff-card-name,
.tr-num{color:var(--text-primary) !important;}
.payoff-card.modeled .payoff-card-copy{color:var(--text-secondary) !important;}

/* Keep the row operators as real table cells and center the symbol within the
   dedicated gap column. */
tbody td.equation-operator-cell{
  display:table-cell !important;
  padding:0 !important;
  text-align:center !important;
  vertical-align:middle !important;
}

/* Bright green + signs. The equals sign itself and its ring are both hybrid. */
.equation-op.plus{
  color:var(--actual-primary) !important;
  border-color:rgba(74,222,128,.92) !important;
}
.equation-op.equal{
  color:transparent !important;
  font-size:0 !important;
  border:1px solid transparent !important;
  background:
    linear-gradient(var(--bg),var(--bg)) padding-box,
    linear-gradient(90deg,var(--actual-primary),var(--forecast-primary)) border-box !important;
}
.equation-op.equal::after{
  content:'=';
  font-family:'IBM Plex Mono',monospace;
  font-size:14px;
  font-weight:600;
  line-height:1;
  background:linear-gradient(90deg,var(--actual-primary),var(--forecast-primary));
  -webkit-background-clip:text;
  background-clip:text;
  color:transparent;
}
.payoff-equation-operator .equation-op.equal::after{font-size:17px;}
'''

s = s.replace('\n</style>', css + '\n</style>', 1)

assert marker in s
assert 'class="payoff-equation-grid"' in s
assert 'colspan="15" class="payoff-equation-shell"' in s
assert 'display:table-row !important;' in s

path.write_text(s, encoding='utf-8')
print('payoff layout correction v2 applied')
