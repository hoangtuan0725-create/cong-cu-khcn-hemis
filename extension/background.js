// Cầu nối giữa trang công cụ và hai hệ thống KHCN, HEMIS.
// Lệnh fetch chạy bên trong một tab KHCN/HEMIS đang đăng nhập, nên dùng đúng cookie và token của người dùng.
// Tiện ích không lưu, không gửi dữ liệu đi đâu khác; không đọc hay lưu mật khẩu.
const APP = 'https://hoangtuan0725-create.github.io/cong-cu-khcn-hemis/';
const SITES = {
  khcn: { origin: 'https://khcn.tlu.edu.vn', home: 'https://khcn.tlu.edu.vn/' },
  hemis: { origin: 'https://hemis-cms.moet.gov.vn', home: 'https://hemis-cms.moet.gov.vn/nckh/khcn-bai-bao-khoa-hoc' }
};

chrome.action.onClicked.addListener(() => chrome.tabs.create({ url: APP }));

const waitLoaded = tabId => new Promise(res => {
  const done = () => { chrome.tabs.onUpdated.removeListener(fn); clearTimeout(t); res(); };
  const fn = (id, info) => { if (id === tabId && info.status === 'complete') done(); };
  const t = setTimeout(done, 30000);
  chrome.tabs.onUpdated.addListener(fn);
  chrome.tabs.get(tabId).then(tb => { if (tb.status === 'complete') done(); }).catch(done);
});

// Tìm tab của site; chưa có thì mở ngầm một tab (không chuyển sang tab đó)
async function siteTab(site, open) {
  const S = SITES[site];
  const tabs = await chrome.tabs.query({ url: S.origin + '/*' });
  let tab = tabs.find(t => !t.discarded && t.status === 'complete') || tabs.find(t => !t.discarded) || tabs[0];
  if (tab && tab.discarded) { await chrome.tabs.reload(tab.id); }
  if (!tab) { if (!open) return null; tab = await chrome.tabs.create({ url: S.home, active: false }); }
  await waitLoaded(tab.id);
  return tab;
}

async function runIn(site, func, args) {
  let lastErr;
  for (let k = 0; k < 2; k++) {
    const tab = await siteTab(site, true);
    try {
      const [r] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func, args });
      return r.result;
    } catch (e) { lastErr = e; await chrome.tabs.reload(tab.id); await waitLoaded(tab.id); }
  }
  throw lastErr;
}

// --- các hàm chạy trong tab KHCN/HEMIS ---
async function khcnFetch(path, form) {
  const r = await fetch(path, form ? { method: 'POST', body: new URLSearchParams(form), credentials: 'include' } : { credentials: 'include', cache: 'no-store' });
  return { status: r.status, text: await r.text() };
}
async function hemisFetch(path, method, data) {
  const tok = localStorage.getItem('access_token');
  if (!tok) return { status: 401, text: '' };
  const r = await fetch(path, { method, headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json', PortalAlias: location.origin }, body: data == null ? undefined : JSON.stringify(data) });
  return { status: r.status, text: await r.text() };
}
function fillJournal(name) {
  let n = 0;
  const t = setInterval(() => {
    const inp = document.getElementById('tentapchi');
    if (inp) {
      clearInterval(t);
      inp.value = name; inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true }));
      inp.style.background = '#FEF3C7'; inp.style.outline = '3px solid #B45309'; inp.scrollIntoView({ block: 'center' });
      const note = document.createElement('div');
      note.textContent = 'Tên tạp chí đã được điền sẵn theo danh mục Bộ KH&CN. Kiểm tra lại rồi bấm "Ghi lại".';
      note.style.cssText = 'color:#B45309;font-weight:bold;margin:4px 0';
      inp.parentNode.insertBefore(note, inp.nextSibling);
    }
    if (++n > 100) clearInterval(t);
  }, 200);
}

const okPath = p => typeof p === 'string' && p.startsWith('/') && !p.startsWith('//');

async function handle(msg) {
  switch (msg && msg.type) {
    case 'ping': {
      const st = {};
      for (const s of Object.keys(SITES)) st[s] = !!(await siteTab(s, false));
      return { ver: chrome.runtime.getManifest().version, tabs: st };
    }
    case 'khcn':
      if (!okPath(msg.path)) throw new Error('Đường dẫn không hợp lệ');
      return runIn('khcn', khcnFetch, [msg.path, msg.form || null]);
    case 'hemis':
      if (!okPath(msg.path) || !msg.path.startsWith('/gwdev/')) throw new Error('Đường dẫn không hợp lệ');
      if (!['GET', 'POST', 'PUT'].includes(msg.method)) throw new Error('Lệnh không hợp lệ');
      return runIn('hemis', hemisFetch, [msg.path, msg.method, msg.data == null ? null : msg.data]);
    case 'openEdit': {
      if (!/^\d+$/.test(String(msg.id))) throw new Error('Mã bài không hợp lệ');
      const tab = await chrome.tabs.create({ url: SITES.khcn.origin + '/CongBo/EditCongBo/' + msg.id + '?toantruong=true' });
      if (msg.name) { await waitLoaded(tab.id); await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: fillJournal, args: [String(msg.name)] }); }
      return true;
    }
    case 'openSite':
      if (!SITES[msg.site]) throw new Error('Không rõ trang');
      await chrome.tabs.create({ url: SITES[msg.site].home });
      return true;
  }
  throw new Error('Lệnh không hợp lệ');
}

chrome.runtime.onMessage.addListener((msg, sender, send) => {
  // chỉ nhận lệnh từ trang công cụ
  if (!sender.url || !sender.url.startsWith(APP)) return false;
  handle(msg).then(data => send({ ok: true, data }), e => send({ ok: false, err: String(e && e.message || e) }));
  return true;
});
