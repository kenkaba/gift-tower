#!/usr/bin/env python3
"""index.html + styles.css + game.js を1枚のHTMLにまとめる。assets/ の画像は data URI で埋め込む（Artifact / 1ファイル配布用）"""
import re, base64, mimetypes, os, sys
root = os.path.dirname(os.path.abspath(__file__))
html = open(os.path.join(root, 'index.html'), encoding='utf-8').read()
css = open(os.path.join(root, 'styles.css'), encoding='utf-8').read()
js = open(os.path.join(root, 'game.js'), encoding='utf-8').read()
def inline(m):
    path = m.group(1)
    fp = os.path.join(root, path)
    if not os.path.exists(fp): return m.group(0)
    mime = mimetypes.guess_type(fp)[0] or 'application/octet-stream'
    data = base64.b64encode(open(fp, 'rb').read()).decode()
    return f"'data:{mime};base64,{data}'"
js = re.sub(r"'(assets/[^']+)'", inline, js)
body = re.search(r'<body[^>]*>(.*)</body>', html, re.S).group(1)
body = re.sub(r'<script src="\./game\.js[^"]*"></script>', '', body)
fonts = re.search(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com[^>]*>', html).group(0)
title = re.search(r'<title>(.*?)</title>', html).group(1)
out = f"<title>{title}</title>\n{fonts}\n<style>\n{css}\n</style>\n{body}\n<script>\ndocument.body.classList.add('is-title');\n{js}\n</script>\n"
dest = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, 'dist.html')
open(dest, 'w', encoding='utf-8').write(out)
print(dest, len(out))
