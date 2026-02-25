import re

with open('server/index.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    for i, line in enumerate(lines):
        if 'startDramaticReveal' in line:
            print(f"{i+1}: {line.strip()}")
