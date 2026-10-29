// Tự cập nhật: mỗi lần bấm nút, tiện ích xem thư mục Google Drive của P9,
// lấy bản mã có số phiên bản cao nhất. Không tải được → dùng bản lưu lần trước → bản kèm theo.
const HOSTS = ['khcn.tlu.edu.vn', 'hemis-cms.moet.gov.vn'];
const FOLDER_ID = '19wg1m-BAa75ZNDEmh6_v3kpd1SWZNMos';

const valid = c => typeof c === 'string' && c.trimStart().startsWith('(async') && c.trimEnd().endsWith('})();') && c.includes('tlu2hemis') && c.length > 20000;
const dec = s => s.replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(+d))
  .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const vnum = v => v.split('.').map(Number);
const vcmp = (a, b) => { const x = vnum(a), y = vnum(b); for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d; } return 0; };

async function tget(url, ms) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms || 8000);
  try { const r = await fetch(url, { cache: 'no-store', signal: ctl.signal }); if (!r.ok) throw new Error(r.status); return await r.text(); }
  finally { clearTimeout(t); }
}

// Đọc danh sách file trong thư mục Drive (thư mục để "Anyone with the link")
async function newest() {
  const h = await tget('https://drive.google.com/embeddedfolderview?id=' + FOLDER_ID + '&t=' + Date.now());
  const files = [];
  h.split(/class="flip-entry"/).slice(1).forEach(ch => {
    const id = (ch.match(/\/file\/d\/([\w-]{20,})/) || ch.match(/entry-([\w-]{20,})/) || [])[1];
    const nm = (ch.match(/flip-entry-title">([^<]*)</) || ch.match(/aria-label="([^"]*)"/) || [])[1];
    if (id && nm) files.push({ id, name: dec(nm).trim() });
  });
  // Moi phan (i trong n) lay ban co so phien ban cao nhat -> lan sau chi can tai len phan nao thay doi
  const byN = {};
  for (const f of files) {
    if (!/\.js$/i.test(f.name)) continue;
    const v = (f.name.match(/(\d{4}\.\d{1,2}\.\d{1,2}(?:\.\d+)?)/) || [])[1]; if (!v) continue;
    const p = f.name.match(/phần\s*(\d+)\s*trên\s*(\d+)/i) || [0, 1, 1];
    const n = +p[2], i = +p[1], g = byN[n] = byN[n] || { n, parts: {}, ver: {}, top: '0' };
    if (!g.ver[i] || vcmp(v, g.ver[i]) > 0) { g.ver[i] = v; g.parts[i] = f.id; }
    if (vcmp(v, g.top) > 0) g.top = v;
  }
  const ok = Object.values(byN).filter(g => Array.from({ length: g.n }, (_, i) => g.parts[i + 1]).every(Boolean)).sort((a, b) => vcmp(b.top, a.top));
  if (!ok[0]) return null;
  const g = ok[0]; g.v = g.top; g.key = Array.from({ length: g.n }, (_, i) => g.parts[i + 1]).join(',');
  return g;
}

async function getCode() {
  const st = await chrome.storage.local.get(['code', 'ver', 'key']);
  try {
    const g = await newest();
    if (g) {
      if (st.key === g.key && valid(st.code)) return { code: st.code, src: 'online', ver: st.ver };
      const ids = Array.from({ length: g.n }, (_, i) => g.parts[i + 1]);
      const txt = await Promise.all(ids.map(id => tget('https://drive.google.com/uc?export=download&id=' + id + '&t=' + Date.now(), 15000)));
      const c = txt.join('');
      if (valid(c)) { await chrome.storage.local.set({ code: c, ver: g.v, key: g.key, at: Date.now() }); return { code: c, src: 'online', ver: g.v }; }
    }
  } catch (e) {}
  if (valid(st.code)) return { code: st.code, src: 'cache', ver: st.ver };
  const r = await fetch(chrome.runtime.getURL('tool.js'));
  return { code: await r.text(), src: 'kèm theo' };
}

chrome.action.onClicked.addListener(async tab => {
  let host = ''; try { host = new URL(tab.url || '').hostname; } catch (e) {}
  if (!HOSTS.includes(host)) { chrome.tabs.create({ url: 'https://khcn.tlu.edu.vn/' }); return; }
  const { code, src, ver } = await getCode();
  await chrome.scripting.executeScript({
    target: { tabId: tab.id }, world: 'MAIN', args: [code, src, ver || ''],
    func: (c, s, v) => { window.__T2H_SRC = s; window.__T2H_VER = v || undefined; const el = document.createElement('script'); el.textContent = c; (document.head || document.documentElement).appendChild(el); el.remove(); }
  });
});
