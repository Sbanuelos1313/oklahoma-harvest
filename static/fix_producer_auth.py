import re, os

f = r'C:\dev\ChronosAI\Software_applications\oklahoma-harvest\static\producer.html'
c = open(f, 'r', encoding='utf-8').read()
print(f'File size: {len(c.encode("utf-8"))} bytes')

# ── Step 1: Fix auth-wrap CSS to match app.html exactly ──
c = re.sub(
    r'\.auth-wrap\{[^}]+\}',
    '.auth-wrap { min-height:100vh; background:#C8A87A; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:36px 22px; position:relative; overflow:hidden; }',
    c, count=1
)
print('1. auth-wrap CSS fixed')

# ── Step 2: Add auth-logo-wrap CSS if missing ──
if '.auth-logo-wrap' not in c[:c.find('<body')]:
    c = c.replace('</style>',
        '.auth-logo-wrap { position:relative; z-index:1; text-align:center; margin-bottom:28px; }\n'
        '.auth-logo-img { position:relative; z-index:1; width:68px; height:68px; border-radius:50%; overflow:hidden; border:2px solid var(--wheat); margin:0 auto 11px; }\n'
        '.auth-logo-img img { width:100%; height:100%; object-fit:cover; }\n'
        '.auth-brand { position:relative; z-index:1; font-family:"Satisfy",cursive; font-size:26px; color:var(--earth); margin-bottom:4px; }\n'
        '.auth-sub { position:relative; z-index:1; font-size:11px; color:var(--text-mid); text-transform:uppercase; letter-spacing:1.5px; }\n'
        '</style>', 1)
    print('2. auth-logo-wrap CSS added')
else:
    print('2. auth-logo-wrap CSS already present')

# ── Step 3: Fix all auth-* CSS rules that have z-index issues ──
for rule, replacement in [
    ('.auth-logo{text-align:center;margin-bottom:22px;}',
     '.auth-logo { position:relative; z-index:1; text-align:center; margin-bottom:22px; }'),
    ('.auth-logo-img{width:64px;height:64px;border-radius:50%;overflow:hidden;border:2px solid var(--wheat);margin:0 auto 10px;}',
     '.auth-logo-img { position:relative; z-index:1; width:68px; height:68px; border-radius:50%; overflow:hidden; border:2px solid var(--wheat); margin:0 auto 11px; }'),
    ('.auth-card{position:relative;z-index:1;background:var(--parchment);border-radius:22px;padding:28px 22px;width:100%;max-width:400px;}',
     '.auth-card { position:relative; z-index:1; background:var(--parchment); border-radius:22px; padding:28px 22px; width:100%; max-width:400px; }'),
]:
    if rule in c:
        c = c.replace(rule, replacement, 1)
        print(f'3. Fixed: {rule[:40]}')

# ── Step 4: Replace auth-logo inside auth-card with auth-logo-wrap above card ──
# Find authScreen
auth_idx = c.find('id="authScreen"')
auth_wrap_idx = c.find('<div class="auth-wrap">', auth_idx)
card_idx = c.find('<div class="auth-card"', auth_wrap_idx)

# Check if auth-logo is INSIDE auth-card (wrong) or before it (right)
logo_idx = c.find('<div class="auth-logo"', auth_wrap_idx)
logo_in_card = logo_idx > card_idx
print(f'4. auth-logo inside auth-card (needs fixing): {logo_in_card}')

if logo_in_card:
    # Get the logo HTML
    logo_end = c.find('</div>', c.find('</div>', c.find('</div>', logo_idx) + 1) + 1) + 6
    logo_html = c[logo_idx:logo_end]
    logo_clean = re.sub(r'base64,[A-Za-z0-9+/=]{30,}', 'base64,...', logo_html)
    print(f'   Logo HTML: {logo_clean[:150]}')
    
    # Build auth-logo-wrap version
    logo_b64_match = re.search(r'src="(data:image/png;base64,[^"]+)"', logo_html)
    if logo_b64_match:
        logo_b64 = logo_b64_match.group(1)
        new_logo_wrap = f'''<div class="auth-logo-wrap">
      <div class="auth-logo-img"><img src="{logo_b64}" alt="From Our Place"></div>
      <div class="auth-brand">From Our Place</div>
      <div class="auth-sub">Producer Portal</div>
    </div>
    '''
        # Remove logo from inside card, add before card
        c = c[:logo_idx] + c[logo_end:]  # remove from card
        # Re-find card position after removal
        card_idx2 = c.find('<div class="auth-card"', c.find('id="authScreen"'))
        c = c[:card_idx2] + new_logo_wrap + c[card_idx2:]
        print('   Moved auth-logo above auth-card ✓')

# ── Step 5: Ensure auth-bg-svg CSS exists ──
if '.auth-bg-svg' not in c[:c.find('<body')]:
    c = c.replace('</style>', '.auth-bg-svg { position:absolute; inset:0; width:100%; height:100%; z-index:0; }\n</style>', 1)
    print('5. auth-bg-svg CSS added')
else:
    print('5. auth-bg-svg CSS already present')

# ── Verify ──
print('\nVerification:')
auth_section = c[c.find('id="authScreen"'):c.find('id="setupScreen"')]
print(f'  auth-logo-wrap in authScreen: {"auth-logo-wrap" in auth_section}')
print(f'  auth-bg-svg in authScreen: {"auth-bg-svg" in auth_section}')
print(f'  setupScreen present: {"id=\"setupScreen\"" in c}')
print(f'  producerApp present: {"id=\"producerApp\"" in c}')
print(f'  doLogin present: {"function doLogin" in c}')

open(f, 'w', encoding='utf-8').write(c)
print(f'\nWritten! Size: {os.path.getsize(f)} bytes')
