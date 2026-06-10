#!/usr/bin/env python3
import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix broken UTF-8 sequences
fixes = [
    ('в"Ђ', '–'),
    ('вЂ"', '—'),
    ('вЂ¦', '…'),
    ('вњ•', '✕'),
    ('рџ"„', '📄'),
    ('В·', '·'),
    ('в†'', '↑'),
    ('в†"', '↓'),
    ('в†'', '→'),
]

for broken, fixed in fixes:
    content = content.replace(broken, fixed)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('✓ Fixed broken characters')
