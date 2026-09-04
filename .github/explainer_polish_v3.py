from pathlib import Path

path = Path('index.html')
s = path.read_text(encoding='utf-8')
marker = '/* ===== 2026-09-04 approved explainer polish v3 ===== */'
if marker in s:
    print('Explainer polish v3 already applied; nothing to do.')
    raise SystemExit(0)

replacements = {
    '<span class="payoff-card-copy">Actual — money<br>in your account<br>monthly</span>':
        '<span class="payoff-card-copy">Money left in your<br>account each month</span>',
    '<span class="payoff-card-name">Principal<br>(loan debt)</span>':
        '<span class="payoff-card-name">Principal (loan debt)</span>',
    '<span class="payoff-card-copy">Actual — tenant<br>pays down your<br>loan debt</span>':
        '<span class="payoff-card-copy">Tenant pays down your<br>loan debt<br><span class="payoff-card-note">(in addition to interest owed)</span></span>',
    '<span class="payoff-card-copy">Forecast — 3% annual ×<br>3.33× leverage</span>':
        '<span class="payoff-card-copy">Increase in property value<br>over time (e.g. 3%/yr,<br>amplified by using a mortgage)</span>',
    '<span class="payoff-card-copy">Cash flow + principal +<br>appreciation</span>':
        '<span class="payoff-card-copy">The 3 components<br>combined</span>',
    'Operating figures — actual for closed properties, underwritten for pipeline properties':
        'Operating — actual when closed, underwritten when pipeline',
}
for old, new in replacements.items():
    assert old in s, f'Missing expected text: {old}'
    s = s.replace(old, new, 1)

arrow_svg = '''    <svg class="payoff-guide-arrows" viewBox="0 0 1316 176" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <marker id="payoffArrowGreen" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="var(--actual-primary)"></path>
        </marker>
        <marker id="payoffArrowBlue" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="var(--forecast-primary)"></path>
        </marker>
        <marker id="payoffArrowHybrid" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="#43d8c9"></path>
        </marker>
      </defs>
      <line class="payoff-guide-line cash-guide" x1="730" y1="120" x2="816" y2="169" marker-end="url(#payoffArrowGreen)"></line>
      <line class="payoff-guide-line principal-guide" x1="930" y1="120" x2="948" y2="169" marker-end="url(#payoffArrowGreen)"></line>
      <line class="payoff-guide-line appreciation-guide" x1="1084" y1="120" x2="1084" y2="169" marker-end="url(#payoffArrowBlue)"></line>
      <line class="payoff-guide-line modeled-guide" x1="1242" y1="120" x2="1242" y2="169" marker-end="url(#payoffArrowHybrid)"></line>
    </svg>\n'''
needle = '    </div>\n  </th>\n</tr>\n<tr class="column-header-row">'
assert needle in s, 'Could not find payoff equation shell closing point'
s = s.replace(needle, '    </div>\n' + arrow_svg + '  </th>\n</tr>\n<tr class="column-header-row">', 1)

css = r'''

/* ===== 2026-09-04 approved explainer polish v3 ===== */
/* The explainer is intentionally independent from the table-column grid. This lets
   the equation stay compact while four explicit guide arrows terminate at the exact
   centers of Cash Flow, Principal, Appreciation, and Modeled Return. */
.desktop-table{
  --table-columns:24px 124px 52px 128px 86px 90px 146px 114px 104px 28px 104px 28px 112px 28px 148px;
  --table-width:1316px;
}
.table-wrap > table col.appreciation-col{width:112px;}
.table-wrap > table col.modeled-return-col{width:148px;}
th.appreciation-col,td.appreciation-col{width:112px;}
th.modeled-return-col,td.modeled-return-col{width:148px;}
.table-wrap > table{margin-right:18px;}

thead .payoff-box-row > .payoff-equation-shell{
  position:relative;
  height:176px;
  padding:0 !important;
  overflow:visible !important;
}
.payoff-equation-grid{
  position:relative !important;
  display:block !important;
  width:var(--table-width) !important;
  height:176px !important;
  overflow:visible !important;
}
.payoff-equation-grid > *{grid-row:auto !important;grid-column:auto !important;}
.payoff-equation-grid > .payoff-copy-cell{
  position:absolute;
  left:5px;
  top:4px;
  width:555px;
  min-height:112px;
  display:flex;
  align-items:flex-start;
  padding:4px 28px 0 0 !important;
  box-sizing:border-box;
}
.payoff-copy{max-width:540px;}
.payoff-inline-legend{
  margin-top:9px;
  gap:4px 20px;
  font-size:9.8px;
  color:rgba(168,166,160,.72) !important;
}
.payoff-inline-legend .legend-swatch{opacity:.82;}

/* Compact equation placement from the approved mockup. The boxes no longer have
   to sit directly over their data columns because the arrows make the mapping explicit. */
.payoff-equation-grid > .payoff-card,
.payoff-equation-grid > .payoff-card.appreciation{
  position:absolute !important;
  top:0;
  height:120px;
  min-height:120px;
  margin:0 !important;
  padding:10px 10px 11px;
  box-sizing:border-box;
  border-radius:7px;
  z-index:3;
}
.payoff-grid-cash{left:600px;width:132px !important;}
.payoff-grid-principal{left:778px;width:154px !important;}
.payoff-grid-appreciation{left:976px;width:142px !important;}
.payoff-grid-modeled{left:1162px;width:148px !important;}
.payoff-card-name{line-height:1.18;}
.payoff-card-copy{margin-top:6px;line-height:1.34;}
.payoff-card-note{font-size:9.4px;color:var(--actual-secondary);white-space:nowrap;}

.payoff-equation-grid > .payoff-equation-operator{
  position:absolute !important;
  top:0;
  width:28px;
  height:120px;
  padding:0 !important;
  margin:0 !important;
  display:flex !important;
  align-items:center;
  justify-content:center;
  z-index:4;
}
.payoff-grid-op1{left:742px;}
.payoff-grid-op2{left:940px;}
.payoff-grid-op3{left:1126px;}
.payoff-equation-operator .equation-op{
  width:26px;
  height:26px;
  font-size:18px;
}
.payoff-equation-operator .equation-op.equal::after{font-size:18px;}

/* Exactly four arrows. The first two originate at the lower-right edge of their
   boxes and travel diagonally to the correct labels. Appreciation and Modeled
   Return are already nearly aligned, so their arrows are vertical. */
.payoff-equation-grid .payoff-arrow{display:none !important;}
.payoff-guide-arrows{
  position:absolute;
  left:0;
  top:0;
  width:var(--table-width);
  height:176px;
  overflow:visible;
  pointer-events:none;
  z-index:2;
}
.payoff-guide-line{
  fill:none;
  stroke-width:2.2;
  stroke-linecap:round;
  vector-effect:non-scaling-stroke;
}
.cash-guide,.principal-guide{stroke:var(--actual-primary);}
.appreciation-guide{stroke:var(--forecast-primary);}
.modeled-guide{stroke:#43d8c9;}
'''
assert '\n</style>' in s, 'Could not find closing style tag'
s = s.replace('\n</style>', css + '\n</style>', 1)

assert marker in s
assert s.count('payoff-guide-line ') == 4
assert 'Money left in your<br>account each month' in s
assert '(in addition to interest owed)' in s
assert 'amplified by using a mortgage' in s
assert 'The 3 components<br>combined' in s

path.write_text(s, encoding='utf-8')
print('Explainer polish v3 applied successfully')
