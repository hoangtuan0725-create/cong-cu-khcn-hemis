# Chia tool.js thanh cac phan theo moc co dinh; so voi ban da dang (published/) de biet phan nao doi
import sys, os, json, hashlib
MARK = ['  const DMKHCN = ', '  const nkey = ', '  /* ===== TAB THONG KE DU LIEU KHCN', '    /* ---- Bang tong hop nhieu chieu', '    const render = () => {',
        '  /* ===== BUOC 1: o trang KHCN TLU', '  /* ===== BUOC 2: o trang HEMIS', '  /* ===== PHAN 3: THONG KE CHI SO', '  /* ===== PHAN 2: RA SOAT BAI DA CO']
s = open('tool.js', encoding='utf-8').read()
cut = [0]
for m in MARK:
    i = s.find('\n' + m, cut[-1]); assert i > 0, m; cut.append(i + 1)
cut.append(len(s))
parts = [s[cut[k]:cut[k + 1]] for k in range(len(cut) - 1)]
assert ''.join(parts) == s
os.makedirs('parts2', exist_ok=True)
pub = json.load(open('published.json')) if os.path.exists('published.json') else {}
for i, p in enumerate(parts, 1):
    open('parts2/%d.js' % i, 'w', encoding='utf-8').write(p)
    h = hashlib.md5(p.encode()).hexdigest()
    print(i, len(p.encode()), 'GIONG' if pub.get(str(i), {}).get('md5') == h else 'DOI', h)
print('n =', len(parts))
