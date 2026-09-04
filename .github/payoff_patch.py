from pathlib import Path
import re

path = Path('index.html')
s = path.read_text(encoding='utf-8')
marker = '/* ===== 2026-09-04 user-approved payoff equation layout ===== */'

if marker in s:
    print('Approved payoff layout is already present; nothing to do.')
    raise SystemExit(0)

# Replace the old stacked intro + card rows with the selected one-row equation layout.
payoff_pattern = re.compile(
    r'<tr class="payoff-intro-row">.*?<tr class="column-header-row">',
    re.S,
)
payoff_replacement = '''
<tr class="payoff-box-row user-approved-payoff-row">
  <th class="payoff-copy-cell" colspan="8">
    <div class="payoff-copy">
      <div class="payoff-title">How this kind of real estate pays you</div>
      <div class="payoff-subtitle">3 real levers add up to the modeled return.</div>
      <div class="payoff-inline-legend">
        <span class="legend-swatch"><span class="legend-dot actual"></span> Operating figures — actual for closed properties, underwritten for pipeline properties</span>
        <span class="legend-swatch"><span class="legend-dot predicted"></span> Forecast — appreciation assumption, not guaranteed</span>
      </div>
    </div>
  </th>
  <th class="cash-return-col">
    <div class="payoff-card cash">
      <span class="payoff-card-name">Cash flow</span>
      <span class="payoff-card-copy">Actual — money<br>in your account<br>monthly</span>
      <span class="payoff-arrow" aria-hidden="true"></span>
    </div>
  </th>
  <th class="equation-operator-col payoff-equation-operator op-one" aria-hidden="true"><span class="equation-op plus">+</span></th>
  <th class="principal-return-col">
    <div class="payoff-card principal">
      <span class="payoff-card-name">Principal<br>(loan debt)</span>
      <span class="payoff-card-copy">Actual — tenant<br>pays down your<br>loan debt</span>
      <span class="payoff-arrow" aria-hidden="true"></span>
    </div>
  </th>
  <th class="equation-operator-col payoff-equation-operator op-two" aria-hidden="true"><span class="equation-op plus">+</span></th>
  <th class="appreciation-col">
    <div class="payoff-card appreciation">
      <span class="payoff-card-name">Appreciation</span>
      <span class="payoff-card-copy">Forecast — 3% annual ×<br>3.33× leverage</span>
      <span class="payoff-arrow" aria-hidden="true"></span>
    </div>
  </th>
  <th class="equation-operator-col payoff-equation-operator op-three" aria-hidden="true"><span class="equation-op equal">=</span></th>
  <th class="modeled-return-col">
    <div class="payoff-card modeled">
      <span class="payoff-card-name">Modeled return</span>
      <span class="payoff-card-copy">Cash flow + principal +<br>appreciation</span>
      <span class="payoff-arrow" aria-hidden="true"></span>
    </div>
  </th>
</tr>
<tr class="column-header-row">'''
s, count = payoff_pattern.subn(payoff_replacement, s, count=1)
assert count == 1, 'Could not replace payoff explainer rows'

# Give +, +, and = their own real columns.
old_colgroup = '<col class="chevron-col"><col class="status-col"><col class="id-col"><col class="state-col">\n        <col class="price-col"><col class="down-col"><col class="invested-col"><col class="rent-col">\n        <col class="cash-return-col"><col class="principal-return-col"><col class="appreciation-col"><col class="modeled-return-col">'
new_colgroup = '<col class="chevron-col"><col class="status-col"><col class="id-col"><col class="state-col">\n        <col class="price-col"><col class="down-col"><col class="invested-col"><col class="rent-col">\n        <col class="cash-return-col"><col class="equation-operator-col"><col class="principal-return-col"><col class="equation-operator-col"><col class="appreciation-col"><col class="equation-operator-col"><col class="modeled-return-col">'
assert old_colgroup in s, 'Expected desktop colgroup was not found'
s = s.replace(old_colgroup, new_colgroup, 1)

# Add blank cells to the visible column header so the header uses the same 15-column geometry.
header_insertions = [
    (
        '<th class="principal-return-col">\n            <span class="th-title-row">Principal',
        '<th class="equation-operator-col" aria-hidden="true"></th>\n          <th class="principal-return-col">\n            <span class="th-title-row">Principal',
    ),
    (
        '<th class="th-predicted appreciation-col">\n            <span class="th-title-row">Appreciation*',
        '<th class="equation-operator-col" aria-hidden="true"></th>\n          <th class="th-predicted appreciation-col">\n            <span class="th-title-row">Appreciation*',
    ),
    (
        '<th class="modeled-return-col">\n            <span class="th-title-row">Modeled Return',
        '<th class="equation-operator-col" aria-hidden="true"></th>\n          <th class="modeled-return-col">\n            <span class="th-title-row">Modeled Return',
    ),
]
for old, new in header_insertions:
    assert old in s, f'Expected column header fragment not found: {old[:55]}'
    s = s.replace(old, new, 1)

# Add the same + + = relationship to every generated property row.
row_insertions = [
    (
        '      <td class="principal-return-col">\n        <div class="return-pair">',
        '      <td class="equation-operator-col equation-operator-cell" aria-hidden="true"><span class="equation-op plus">+</span></td>\n      <td class="principal-return-col">\n        <div class="return-pair">',
    ),
    (
        '      <td class="appreciation-col">\n        <div class="predicted-cell">',
        '      <td class="equation-operator-col equation-operator-cell" aria-hidden="true"><span class="equation-op plus">+</span></td>\n      <td class="appreciation-col">\n        <div class="predicted-cell">',
    ),
    (
        '      <td class="modeled-return-col">\n        <div class="tr-wrap">',
        '      <td class="equation-operator-col equation-operator-cell" aria-hidden="true"><span class="equation-op equal">=</span></td>\n      <td class="modeled-return-col">\n        <div class="tr-wrap">',
    ),
]
for old, new in row_insertions:
    assert old in s, f'Expected generated-row fragment not found: {old[:55]}'
    s = s.replace(old, new, 1)

# Expanded detail rows span all 15 columns after the operator columns are added.
s = s.replace('colspan="12"', 'colspan="15"')

css = r'''

/* ===== 2026-09-04 user-approved payoff equation layout ===== */
/* Dedicated equation columns make every + and = sit exactly halfway between
   the values it connects, with no overlap or ambiguous ownership. */
.desktop-table{
  --table-columns:24px 124px 52px 128px 86px 90px 146px 114px 104px 28px 104px 28px 124px 28px 136px;
  --table-width:1316px;
}
.table-wrap > table col.cash-return-col{width:104px;}
.table-wrap > table col.principal-return-col{width:104px;}
.table-wrap > table col.appreciation-col{width:124px;}
.table-wrap > table col.modeled-return-col{width:136px;}
.table-wrap > table col.equation-operator-col{width:28px;}
th.cash-return-col,td.cash-return-col{width:104px;}
th.principal-return-col,td.principal-return-col{width:104px;}
th.appreciation-col,td.appreciation-col{width:124px;}
th.modeled-return-col,td.modeled-return-col{width:136px;}
th.equation-operator-col,td.equation-operator-col{width:28px;min-width:28px;max-width:28px;}

thead .payoff-box-row,
thead .column-header-row{
  display:grid;
  grid-template-columns:var(--table-columns);
  width:var(--table-width);
}
thead .payoff-box-row > .payoff-copy-cell{grid-column:1 / 9;}
thead .payoff-box-row > .cash-return-col{grid-column:9;}
thead .payoff-box-row > .op-one{grid-column:10;}
thead .payoff-box-row > .principal-return-col{grid-column:11;}
thead .payoff-box-row > .op-two{grid-column:12;}
thead .payoff-box-row > .appreciation-col{grid-column:13;}
thead .payoff-box-row > .op-three{grid-column:14;}
thead .payoff-box-row > .modeled-return-col{grid-column:15;}

thead .payoff-box-row th{
  position:relative;
  padding:0 0 20px;
  vertical-align:top;
  border-bottom:0;
  text-transform:none;
  letter-spacing:normal;
  overflow:visible;
}
.payoff-copy-cell{
  display:flex;
  align-items:center;
  padding:0 24px 20px 5px !important;
}
.payoff-copy{max-width:610px;}
.payoff-title{font-size:16px;line-height:1.25;font-weight:600;color:var(--text-primary);}
.payoff-subtitle{margin-top:4px;font-size:12.5px;line-height:1.35;color:var(--text-primary);}
.payoff-inline-legend{margin-top:9px;gap:4px 22px;font-size:10px;line-height:1.4;}

/* Cards and arrows are centered on the data columns beneath them. */
.payoff-card,
.payoff-card.appreciation{
  width:calc(100% - 8px);
  min-height:96px;
  margin:0 4px;
  padding:9px 7px 10px;
  border-radius:7px;
}
.payoff-card .payoff-arrow,
.payoff-card.appreciation .payoff-arrow{
  left:50%;
  bottom:-17px;
  width:10px;
  height:6px;
  transform:translateX(-50%);
  border:0;
  background:currentColor;
  clip-path:polygon(0 0,100% 0,50% 100%);
}
.payoff-card.cash .payoff-arrow,
.payoff-card.principal .payoff-arrow{color:var(--actual-primary);}
.payoff-card.appreciation .payoff-arrow{color:var(--forecast-primary);}
.payoff-card.modeled .payoff-arrow{
  color:transparent;
  background:linear-gradient(90deg,var(--actual-primary),var(--forecast-primary));
}

/* The top Modeled return box and every Modeled return value box share the same
   restrained green-to-blue fill and outline. There is deliberately no glow. */
.payoff-card.modeled,
.tr-wrap{
  border:1px solid transparent;
  background:
    linear-gradient(90deg,rgba(74,222,128,.060) 0%,rgba(74,222,128,.025) 44%,rgba(56,189,248,.025) 56%,rgba(56,189,248,.060) 100%) padding-box,
    linear-gradient(90deg,rgba(74,222,128,.82),rgba(56,189,248,.82)) border-box;
  box-shadow:none;
}
.payoff-card.modeled .payoff-card-name{color:var(--text-primary);}
.payoff-card.modeled .payoff-card-copy{color:var(--text-secondary);}
.tr-wrap{
  width:100%;
  gap:3px;
  padding:6px 8px 7px;
  border-radius:7px;
}
.tr-modeled-label{display:none;}
.tr-bar{width:100%;height:5px;margin-top:2px;}

/* Bright green + signs; a green/blue hybrid = sign. */
.payoff-equation-operator,
.equation-operator-cell{
  padding:0 !important;
  display:flex;
  align-items:center;
  justify-content:center;
  text-align:center;
}
.payoff-equation-operator{padding-bottom:20px !important;}
.equation-op{
  width:21px;
  height:21px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  border-radius:50%;
  background:var(--bg);
  font-family:'IBM Plex Mono',monospace;
  font-size:14px;
  font-weight:600;
  line-height:1;
  box-sizing:border-box;
}
.payoff-equation-operator .equation-op{width:24px;height:24px;font-size:17px;}
.equation-op.plus{
  color:var(--actual-primary);
  border:1px solid rgba(74,222,128,.82);
}
.equation-op.equal{
  color:#78dff0;
  border:1px solid transparent;
  background:
    linear-gradient(var(--bg),var(--bg)) padding-box,
    linear-gradient(135deg,var(--actual-primary),var(--forecast-primary)) border-box;
}

/* Retire the old floating pseudo-operators now that the signs have real columns. */
tbody tr.data-row td.cash-return-col::after,
tbody tr.data-row td.principal-return-col::after,
tbody tr.data-row td.appreciation-col::after{content:none !important;display:none !important;}
tbody tr.data-row td.principal-return-col,
tbody tr.data-row td.appreciation-col,
tbody tr.data-row td.modeled-return-col{padding-left:5px;}
tbody tr.data-row td.modeled-return-col{padding:7px 4px;}
tbody tr.data-row td.equation-operator-cell{border-bottom:1px solid rgba(58,63,71,.6);}
'''
s = s.replace('\n</style>', css + '\n</style>', 1)

# Sanity checks before the workflow commits anything to main.
assert marker in s
assert s.count('<col class="equation-operator-col">') == 3
assert 'colspan="12"' not in s
assert s.count('equation-operator-cell') >= 4
assert 'Cash flow + principal +<br>appreciation' in s
assert '--table-width:1316px;' in s

path.write_text(s, encoding='utf-8')
print('index.html patched successfully')
