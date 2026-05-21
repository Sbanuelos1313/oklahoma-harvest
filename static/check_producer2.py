f = 'C:/dev/ChronosAI/Software_applications/oklahoma-harvest/static/producer.html'
c = open(f, 'r', encoding='utf-8').read()

import re

# Check screen default states
for screen in ['authScreen', 'setupScreen', 'producerApp']:
    tag = re.search(rf'id="{screen}"[^>]*>', c)
    print(f'{screen}: {tag.group(0) if tag else "NOT FOUND"}')

# Check showApp function
show_app = re.search(r'function showApp\(\)(.*?)(?=\nfunction |\nasync function )', c, re.DOTALL)
print('\nshowApp():')
print(show_app.group(0)[:400] if show_app else 'NOT FOUND')

# Check the producerApp HTML opening - what's inside it
app_idx = c.find('id="producerApp"')
snippet = c[app_idx:app_idx+300]
snippet = re.sub(r'base64,[A-Za-z0-9+/=]{30,}', 'base64,...', snippet)
print('\nproducerApp opening:')
print(snippet)

# Check setupScreen - is it inside producerApp or separate?
setup_idx = c.find('id="setupScreen"')
prod_app_idx = c.find('id="producerApp"')
print(f'\nsetupScreen at: {setup_idx}')
print(f'producerApp at: {prod_app_idx}')
print(f'setupScreen is INSIDE producerApp: {setup_idx > prod_app_idx}')
