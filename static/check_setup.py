f = 'C:/dev/ChronosAI/Software_applications/oklahoma-harvest/static/producer.html'
c = open(f, 'r', encoding='utf-8').read()
import re

# Get full setupScreen HTML
setup_idx = c.find('id="setupScreen"')
# Find closing - walk divs
pos = setup_idx; depth = 0
while pos < len(c):
    no = c.find('<div', pos+1)
    nc = c.find('</div>', pos+1)
    if no != -1 and no < nc:
        depth += 1; pos = no
    else:
        depth -= 1; pos = nc
        if depth < 0:
            setup_end = nc + 6; break

setup_html = c[setup_idx:setup_end]
setup_html_clean = re.sub(r'base64,[A-Za-z0-9+/=]{30,}', 'base64,...', setup_html)
print(f'setupScreen length: {len(setup_html)} chars')
print('\nFirst 1500 chars:')
print(setup_html_clean[:1500])
