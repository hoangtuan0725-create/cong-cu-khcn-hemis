// Nói chuyện với tiện ích Chrome (cầu nối). Tiện ích chạy lệnh trong tab KHCN/HEMIS đang đăng nhập rồi trả kết quả.
let seq = 0;
const pend = new Map();
window.addEventListener('message', e => {
  if (e.source !== window || !e.data || e.data.t2h !== 'res') return;
  const p = pend.get(e.data.id); if (!p) return;
  pend.delete(e.data.id); clearTimeout(p.t); p.res(e.data.res);
});
const call = (msg, ms) => new Promise(res => {
  const id = ++seq;
  const t = setTimeout(() => { pend.delete(id); res({ ok: false, err: 'NOEXT' }); }, ms || 300000);
  pend.set(id, { res, t });
  window.postMessage({ t2h: 'req', id, msg }, location.origin);
});

export class BridgeError extends Error { constructor(msg, code) { super(msg); this.code = code; } }
const NOEXT = 'Chưa có tiện ích "Công cụ KHCN TLU → HEMIS" bản 2.0 trở lên. Hãy cài tiện ích rồi tải lại trang này (F5).';

let extOk = null;
const need = async () => { if (extOk) return; const p = await ping(); if (!p) throw new BridgeError(NOEXT, 'noext'); };
const run = async msg => {
  await need();
  const r = await call(msg);
  if (!r || r.err === 'NOEXT') { extOk = null; throw new BridgeError(NOEXT, 'noext'); }
  if (!r.ok) throw new BridgeError(r.err || 'Lỗi không rõ');
  return r.data;
};

/* Kiem tra tien ich: tra ve { ver, tabs: { khcn, hemis } } hoac null */
export const ping = async () => {
  const r = await call({ type: 'ping' }, 2500);
  extOk = r && r.ok ? r.data : null;
  return extOk;
};

/* Lay trang KHCN (GET, hoac POST form) va tra ve Document */
export const khcn = async (path, form) => {
  const r = await run({ type: 'khcn', path, form: form || null });
  if (/login_form/.test(r.text) || r.status === 401 || r.status === 403) throw new BridgeError('Phiên đăng nhập KHCN đã hết. Mở tab khcn.tlu.edu.vn, đăng nhập lại rồi bấm Tải lại.', 'login-khcn');
  if (r.status >= 400) throw new BridgeError('KHCN báo lỗi ' + r.status + ' khi lấy ' + path.split('?')[0]);
  return new DOMParser().parseFromString(r.text, 'text/html');
};

/* Goi API HEMIS, tra ve JSON */
export const hemis = async (method, path, data) => {
  const r = await run({ type: 'hemis', method, path, data: data == null ? null : data });
  if (r.status === 401) throw new BridgeError('Hết phiên đăng nhập HEMIS. Mở tab hemis-cms.moet.gov.vn, đăng nhập (hoặc bấm F5) rồi thử lại.', 'login-hemis');
  let j = null; try { j = JSON.parse(r.text); } catch (e) {}
  if (r.status >= 400 || !j || j.success === false) throw new BridgeError((j && (j.message || j.error)) || ('HEMIS báo lỗi ' + r.status));
  return j;
};

export const openEdit = (id, name) => run({ type: 'openEdit', id, name: name || '' });
export const openSite = site => run({ type: 'openSite', site });
export const isLogin = e => e && /^login-/.test(e.code);
