from pathlib import Path

path = Path('index.html')
s = path.read_text(encoding='utf-8')
old = '''.payoff-equation-operator,
.equation-operator-cell{
  padding:0 !important;
  display:flex;
  align-items:center;
  justify-content:center;
  text-align:center;
}
.payoff-equation-operator{padding-bottom:20px !important;}'''
new = '''.payoff-equation-operator{
  padding:0 0 20px !important;
  display:flex;
  align-items:center;
  justify-content:center;
  text-align:center;
}
.equation-operator-cell{
  padding:0 !important;
  text-align:center;
  vertical-align:middle;
}
.equation-operator-cell .equation-op{vertical-align:middle;}'''

if new in s:
    print('Equation-cell layout hardening already present; nothing to do.')
    raise SystemExit(0)
assert old in s, 'Expected equation operator CSS block was not found'
s = s.replace(old, new, 1)
path.write_text(s, encoding='utf-8')
print('Equation-cell table layout hardened successfully')
