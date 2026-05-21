f = 'C:/dev/ChronosAI/Software_applications/oklahoma-harvest/static/producer.html'
c = open(f, 'r', encoding='utf-8').read()

import re

# Fix 1: Add img constraint to nav-logo
old = '.nav-logo{width:34px;height:34px;border-radius:50%;overflow:hidden;border:1.5px solid var(--wheat);flex-shrink:0;}'
new = '.nav-logo{width:34px;height:34px;border-radius:50%;overflow:hidden;border:1.5px solid var(--wheat);flex-shrink:0;}.nav-logo img{width:34px;height:34px;object-fit:cover;display:block;}'

if old in c:
    c = c.replace(old, new, 1)
    print('Fix 1: nav-logo img size constrained')
else:
    print('Fix 1: not found')

# Fix 2: The dark area is the top-nav with background:var(--earth)
# The top-nav is 54px but BEFORE the botanical bg-svg was added to top-nav
# Check if top-nav has the botanical bg-image
top_nav = re.search(r'\.top-nav\{[^}]+\}', c)
print('top-nav has botanical:', 'background-image' in (top_nav.group(0) if top_nav else ''))
print('top-nav CSS (first 150):', top_nav.group(0)[:150] if top_nav else 'not found')

# Fix 3: The REAL issue - the setupScreen's top-nav logo img has no class constraint
# Find the actual img tag in the setupScreen nav
setup_nav_idx = c.find('id="setupScreen"')
setup_nav_end = c.find('</nav>', setup_nav_idx) + 6
setup_nav = c[setup_nav_idx:setup_nav_end]
# Strip base64 for display
print('\nSetup nav (no base64):')
print(re.sub(r'base64,[A-Za-z0-9+/=]{50,}', 'base64,...', setup_nav)[:400])

import os
open(f, 'w', encoding='utf-8').write(c)
print(f'\nWritten! Size: {os.path.getsize(f)} bytes')
