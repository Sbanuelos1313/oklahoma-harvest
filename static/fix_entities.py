#!/usr/bin/env python3
import re, sys, os

def process_run(run):
    entities = re.findall(r'&#x([0-9A-Fa-f]{1,2});', run)
    bytes_list = [int(h, 16) for h in entities]
    if all(b <= 0x7F for b in bytes_list):
        return run
    try:
        return ''.join(f'&#x{ord(c):X};' if ord(c) > 0x7F else c
                       for c in bytes(bytes_list).decode('utf-8'))
    except:
        result = ''
        j = 0
        while j < len(bytes_list):
            b = bytes_list[j]
            for width, lo in [(4, 0xF0), (3, 0xE0), (2, 0xC0)]:
                if b >= lo and j + width - 1 < len(bytes_list):
                    seq = bytes_list[j:j+width]
                    if all(0x80 <= x <= 0xBF for x in seq[1:]):
                        try:
                            ch = bytes(seq).decode('utf-8')
                            result += f'&#x{ord(ch):X};'
                            j += width
                            break
                        except:
                            pass
            else:
                result += f'&#x{b:X};' if b > 0x7F else chr(b)
                j += 1
        return result

def fix_file(fname):
    if not os.path.exists(fname):
        print(f"  SKIP: {fname} not found"); return
    with open(fname, 'rb') as f:
        raw = f.read()
    if raw.startswith(b'\xef\xbb\xbf'):
        raw = raw[3:]
        print(f"  Stripped BOM from {fname}")
    try:
        content = raw.decode('utf-8')
    except:
        content = raw.decode('latin-1')
    # Entity-encode any raw non-ASCII first
    pre = ''.join(f'&#x{ord(c):X};' if ord(c) > 0x7F else c for c in content)
    # Reassemble byte-level entity runs into proper codepoint entities
    fixed = re.compile(r'((?:&#x[0-9A-Fa-f]{1,2};)+)').sub(
        lambda m: process_run(m.group(1)), pre)
    old_bad = len(re.findall(r'&#x[0-9A-Fa-f]{1,2};', pre))
    new_bad = len(re.findall(r'&#x[0-9A-Fa-f]{1,2};', fixed))
    good    = len(re.findall(r'&#x[0-9A-Fa-f]{3,};',  fixed))
    with open(fname, 'w', encoding='ascii', errors='xmlcharrefreplace') as f:
        f.write(fixed)
    print(f"  OK: {fname}  byte-entities {old_bad}->{new_bad}  proper-entities {good}")

files = sys.argv[1:] if len(sys.argv) > 1 else ['index.html','app.html','producer.html','admin.html']
print("Fixing From Our Place HTML files...")
for f in files:
    fix_file(f)
print("\nDone. Now:\n  cd ..\n  git add static\\*.html\n  git commit -m \"Fix emoji encoding\"\n  git push origin main")
