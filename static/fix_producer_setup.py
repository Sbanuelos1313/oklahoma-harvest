f = 'C:/dev/ChronosAI/Software_applications/oklahoma-harvest/static/producer.html'
c = open(f, 'r', encoding='utf-8').read()

# Fix 1: Constrain nav-logo img size
old_nav_logo = '.nav-logo{width:34px;height:34px;border-radius:50%;overflow:hidden;border:1.5px solid var(--wheat);}'
new_nav_logo = '.nav-logo{width:34px;height:34px;border-radius:50%;overflow:hidden;border:1.5px solid var(--wheat);flex-shrink:0;}.nav-logo img{width:100%;height:100%;object-fit:cover;display:block;}'

if old_nav_logo in c:
    c = c.replace(old_nav_logo, new_nav_logo, 1)
    print('Fix 1: nav-logo img constrained')
else:
    print('Fix 1: pattern not found, trying alternate')
    # Check what's there
    import re
    nav = re.search(r'\.nav-logo\{[^}]+\}', c)
    print('Current:', nav.group(0) if nav else 'not found')

# Fix 2: The dark background is the top-nav rendering too tall
# The setupScreen top-nav background is var(--earth) which is dark brown
# and the logo img is expanding the nav height before CSS loads
# Add explicit height to top-nav and ensure body bg shows through

# Fix top-nav height explicitly
import re
top_nav_css = re.search(r'\.top-nav\{[^}]+\}', c)
if top_nav_css:
    old_tn = top_nav_css.group(0)
    if 'height:54px' not in old_tn:
        new_tn = old_tn.replace('.top-nav{', '.top-nav{height:54px;max-height:54px;')
        c = c.replace(old_tn, new_tn, 1)
        print('Fix 2: top-nav height fixed')
    else:
        print('Fix 2: top-nav already has height:54px')

# Fix 3: Make body background cream (not earth)
body_css = re.search(r'body\{[^}]+\}', c)
if body_css:
    print('Current body CSS:', body_css.group(0))
    if '#C8A87A' in body_css.group(0) or 'earth' in body_css.group(0):
        c = re.sub(r'(body\{[^}]*?)background\s*:\s*[^;}\s]+', r'\1background:var(--cream)', c)
        print('Fix 3: body background set to cream')
    else:
        print('Fix 3: body background already OK:', re.search(r'background[^;]+', body_css.group(0)).group(0))

# Verify
body_final = re.search(r'body\{[^}]+\}', c)
print('\nFinal body CSS:', body_final.group(0) if body_final else 'not found')

import os
open(f, 'w', encoding='utf-8').write(c)
print(f'Written! Size: {os.path.getsize(f)} bytes')
