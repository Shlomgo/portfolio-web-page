from pathlib import Path

p = Path('index.html')
s = p.read_text()

start_marker = '  <section class="comparison-section">'
start = s.find(start_marker)
if start < 0:
    raise SystemExit('comparison section not found')
end = s.find('  </section>', start)
if end < 0:
    raise SystemExit('comparison section end not found')
end += len('  </section>')

replacement = r'''  <section class="comparison-section">
    <details class="comparison-details">
      <summary class="comparison-summary">
        <span>Illustrative rental CAGR vs. S&amp;P 500</span>
        <span class="comparison-summary-chevron" aria-hidden="true">⌄</span>
      </summary>

      <div class="comparison-content">
        <p class="comparison-sub">How modeled rental returns compare with a 9% illustrative stock-market benchmark over time.</p>

        <div class="comparison-legend" aria-hidden="true">
          <span class="comparison-legend-item"><span class="comparison-legend-line rental"></span>Modeled rental CAGR (reinvesting cash flow)</span>
          <span class="comparison-legend-item"><span class="comparison-legend-line benchmark"></span>S&amp;P 500 benchmark (9% annually)</span>
        </div>

        <div class="curve-wrap comparison-curve">
          <svg viewBox="0 0 760 330" width="100%" height="330" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="cagrChartTitle cagrChartDesc">
            <title id="cagrChartTitle">Illustrative modeled rental CAGR compared with a 9 percent S&amp;P 500 benchmark</title>
            <desc id="cagrChartDesc">The modeled rental CAGR declines from about 22 percent at year one to about 12 percent at year twenty. A gray dashed S&amp;P 500 benchmark remains at 9 percent.</desc>

            <g stroke="#2b2f34" stroke-width="1">
              <line x1="86" y1="34" x2="724" y2="34"/>
              <line x1="86" y1="76" x2="724" y2="76"/>
              <line x1="86" y1="118" x2="724" y2="118"/>
              <line x1="86" y1="160" x2="724" y2="160"/>
              <line x1="86" y1="202" x2="724" y2="202"/>
              <line x1="86" y1="244" x2="724" y2="244"/>
            </g>

            <line x1="86" y1="34" x2="86" y2="244" stroke="#62666b" stroke-width="1"/>
            <line x1="86" y1="244" x2="724" y2="244" stroke="#62666b" stroke-width="1"/>

            <g fill="#a8a6a0" font-family="IBM Plex Mono" font-size="10" text-anchor="end">
              <text x="72" y="38">25%</text>
              <text x="72" y="80">20%</text>
              <text x="72" y="122">15%</text>
              <text x="72" y="164">10%</text>
              <text x="72" y="206">5%</text>
              <text x="72" y="248">0%</text>
            </g>

            <g stroke="#62666b" stroke-width="1">
              <line x1="86" y1="244" x2="86" y2="250"/>
              <line x1="220" y1="244" x2="220" y2="250"/>
              <line x1="388" y1="244" x2="388" y2="250"/>
              <line x1="556" y1="244" x2="556" y2="250"/>
              <line x1="724" y1="244" x2="724" y2="250"/>
            </g>
            <g fill="#a8a6a0" font-family="IBM Plex Mono" font-size="10" text-anchor="middle">
              <text x="86" y="267">1</text>
              <text x="220" y="267">5</text>
              <text x="388" y="267">10</text>
              <text x="556" y="267">15</text>
              <text x="724" y="267">20</text>
            </g>

            <text x="405" y="300" fill="#a8a6a0" font-family="IBM Plex Sans" font-size="11" text-anchor="middle">Holding period (years)</text>
            <text x="20" y="139" fill="#a8a6a0" font-family="IBM Plex Sans" font-size="11" text-anchor="middle" transform="rotate(-90 20 139)">Compound annual growth rate (CAGR)</text>

            <line x1="86" y1="168.4" x2="724" y2="168.4" stroke="#a8a6a0" stroke-width="2" stroke-dasharray="8,7"/>
            <text x="708" y="187" fill="#c5c3bd" font-family="IBM Plex Mono" font-size="10" text-anchor="end">S&amp;P 500 benchmark · 9%</text>
            <text x="724" y="164" fill="#f5f4f0" font-family="IBM Plex Mono" font-size="11" text-anchor="end">9%</text>

            <path d="M 86 59 C 185 88, 302 112, 420 128 C 530 141, 626 144, 724 143" fill="none" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
            <circle cx="86" cy="59" r="4" fill="#38bdf8"/>
            <circle cx="724" cy="143" r="4" fill="#38bdf8"/>

            <text x="99" y="51" fill="#38bdf8" font-family="IBM Plex Mono" font-size="11">22%</text>
            <text x="724" y="132" fill="#38bdf8" font-family="IBM Plex Mono" font-size="11" text-anchor="end">12%</text>
          </svg>
        </div>

        <div class="comparison-explainer">
          <h3>What this chart shows</h3>
          <p>This is an illustrative comparison of <strong>compound annual growth rate (CAGR)</strong> over different holding periods.</p>
          <p><strong>Blue solid line:</strong> the modeled rental-property strategy. It begins at the current modeled return level and declines over longer holding periods as leverage contributes less to percentage returns while investor equity grows.</p>
          <p><strong>Gray dashed line:</strong> an illustrative 9% annual S&amp;P 500 total-return benchmark with dividends reinvested.</p>
          <p>CAGR answers: “What constant annual return would compound the starting investment to the ending value over this holding period?”</p>
          <p>Both sides assume returns are reinvested and compounded rather than spent.</p>
          <p>The 9% S&amp;P 500 figure is a benchmark for illustration, <strong>not a prediction</strong>. The rental line is also a model, not a guaranteed future return.</p>

          <h3>Why the rental percentage declines</h3>
          <p>Early in a leveraged real-estate investment, a relatively small amount of investor cash controls a much larger asset. As the mortgage is paid down and equity grows, the same dollar change in property value represents a smaller percentage return on the investor's growing equity.</p>
          <p>That does not necessarily mean the property is performing worse. It means leverage is providing less of a percentage-return boost.</p>
        </div>
      </div>
    </details>
  </section>'''

s = s[:start] + replacement + s[end:]

css_marker = '/* ===== Collapsible CAGR section ===== */'
if css_marker not in s:
    css = r'''

/* ===== Collapsible CAGR section ===== */
.comparison-section{
  padding-top:0;
}
.comparison-details{
  border-top:1px solid var(--status-border);
  border-bottom:1px solid var(--status-border);
}
.comparison-summary{
  list-style:none;
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:20px;
  padding:22px 0;
  color:var(--text-primary);
  font-family:'Cormorant Garamond',serif;
  font-size:30px;
  font-weight:600;
  line-height:1.05;
  user-select:none;
}
.comparison-summary::-webkit-details-marker{display:none;}
.comparison-summary-chevron{
  color:var(--text-secondary);
  font-family:'IBM Plex Sans',sans-serif;
  font-size:22px;
  transition:transform .18s ease;
  transform-origin:center;
}
.comparison-details[open] .comparison-summary-chevron{transform:rotate(180deg);}
.comparison-content{
  padding:0 0 30px;
}
.comparison-content .comparison-sub{
  margin-top:-4px;
  margin-bottom:18px;
}
.comparison-explainer{
  max-width:880px;
  margin:18px 0 0;
  padding-top:18px;
  border-top:1px solid var(--status-border);
  color:var(--text-secondary);
  font-family:'IBM Plex Sans',sans-serif;
  font-size:14px;
  line-height:1.55;
}
.comparison-explainer h3{
  margin:0 0 8px;
  color:var(--text-primary);
  font-size:14px;
  font-weight:600;
}
.comparison-explainer h3:not(:first-child){margin-top:22px;}
.comparison-explainer p{margin:0 0 10px;}
.comparison-explainer strong{color:var(--text-primary);font-weight:600;}
@media (max-width:640px){
  .comparison-summary{font-size:24px;padding:18px 0;}
  .comparison-content{padding-bottom:24px;}
  .comparison-explainer{font-size:13.5px;}
}
'''
    s = s.replace('</style>', css + '\n</style>', 1)

p.write_text(s)
print('Updated collapsible CAGR section')
