f = 'C:/dev/ChronosAI/Software_applications/oklahoma-harvest/static/producer.html'
c = open(f, 'r', encoding='utf-8').read()

import re

style_match = re.search(r'<style>(.*?)</style>', c, re.DOTALL)
if style_match:
    style = style_match.group(1)
    print(f'Style block size: {len(style)} chars')
    
    setup_rules = re.findall(r'\.setup[^{]*\{[^}]+\}', style)
    print(f'Setup CSS rules: {len(setup_rules)}')
    
    form_inp = re.search(r'\.form-inp\s*\{[^}]+\}', style)
    print(f'form-inp CSS: {"FOUND" if form_inp else "MISSING"}')
    
    form_lbl = re.search(r'\.form-lbl\s*\{[^}]+\}', style)
    print(f'form-lbl CSS: {"FOUND" if form_lbl else "MISSING"}')
    
    submit_btn = re.search(r'\.submit-btn\s*\{[^}]+\}', style)
    print(f'submit-btn CSS: {"FOUND" if submit_btn else "MISSING"}')
    
    nav_css = re.search(r'\.top-nav\{[^}]+\}', style)
    print(f'top-nav CSS: {"FOUND" if nav_css else "MISSING"}')
else:
    print('NO STYLE BLOCK FOUND!')

print(f'\nFile size: {len(c)} bytes')
print(f'Style tag count: {c.count("<style>")}')
print(f'Style closing count: {c.count("</style>")}')
