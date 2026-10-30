// Thành phần giao diện dùng chung: biểu tượng, khối thu gọn, bảng trượt phải, hộp thoại, thông báo nhanh.
import { esc } from './core.js';
import { pref, setPref } from './store.js';

/* Bieu tuong SVG kieu Lucide (sprite trong index.html) */
export const icon = (n, cls) => '<svg class="ic' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + n + '"/></svg>';
export const el = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
export const $ = (sel, root) => (root || document).querySelector(sel);
export const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];

/* Nhan trang thai: luon co bieu tuong + chu */
const PI = { ok: 'check', warn: 'info', err: 'alert', info: 'info', mut: '' };
export const pill = (kind, text, ic) => { const i = ic === undefined ? PI[kind] : ic; return '<span class="pill ' + kind + '">' + (i ? icon(i) : '') + esc(text) + '</span>'; };

/* Khung mot man hinh: thanh tren (tieu de, tom tat, nut) + than + chan (nut chinh) */
export const screenHtml = ({ title, sub, acts, foot }) =>
  '<div class="top"><button class="btn icon menu-btn" data-act="menu" aria-label="Mở menu">' + icon('menu') + '</button><div><h1>' + esc(title) + '</h1><p data-sub>' + (sub || '') + '</p></div><div class="acts">' + (acts || '') + '</div></div>' +
  '<div class="busy" data-busy hidden><span class="spin" aria-hidden="true"></span><span data-busytxt></span></div>' +
  '<div class="body" data-body></div>' + (foot ? '<div class="foot" data-foot></div>' : '');

/* ---- Khoi ket qua ----
   Moi ket qua (bang hoac khong phai bang) nam trong mot khoi co o goc phai: nut Excel, nut — thu gon (chi an,
   giu nguyen bo loc), nut X dong han (bo bo loc va cach sap xep cua khoi do).
   Man hinh dang ky khoi bang regBlk(id, { scr, title, kind, close(), xlsx(), reopen(), render() }):
   kind 'table' = bang co the tao lai bang nut "Tao bang"; dong roi thi nho ca lan mo sau.
   kind 'info'  = ket qua khong phai bang (o so tong quan...); dong roi thi hien lai khi tai/quet lai du lieu.
   o (tuy chon cua blk): def (mac dinh thu gon), head/headHtml/tools (noi dung dau khoi), pad (them le trong),
   fixed (khoi nhap lieu/cau hinh: chi thu gon, khong dong, khong xuat Excel) */
const colKey = id => 'col.' + id;
const H = {};
const infoClosed = new Set();
export const regBlk = (id, h) => { H[id] = Object.assign({ kind: 'table' }, h); };
export const isCollapsed = (id, def) => pref(colKey(id), !!def);
export const isClosed = id => infoClosed.has(id) || pref('dong.' + id, false);
export const openBlk = id => { infoClosed.delete(id); setPref('dong.' + id, false); setPref(colKey(id), false); };
export const reopenInfo = () => infoClosed.clear();
export const blk = (id, title, inner, o = {}) => {
  if (!o.fixed && isClosed(id)) return '';
  const c = isCollapsed(id, o.def) ? ' collapsed' : '', h = H[id] || {};
  const ctl = (!o.fixed && h.xlsx ? '<button class="cbtn" data-xlsx="' + id + '" title="Xuất Excel" aria-label="Xuất Excel ' + esc(title) + '">' + icon('sheet') + '</button>' : '') +
    '<button class="cbtn" data-collapse="' + id + '" aria-expanded="' + !c + '" title="' + (c ? 'Mở rộng' : 'Thu gọn') + '" aria-label="' + (c ? 'Mở rộng ' : 'Thu gọn ') + esc(title) + '">' + icon(c ? 'square' : 'minus') + '</button>' +
    (o.fixed ? '' : '<button class="cbtn" data-close="' + id + '" title="Đóng" aria-label="Đóng ' + esc(title) + '">' + icon('x') + '</button>');
  return '<section class="card blk' + c + '" data-blk="' + id + '"><div class="card-h">' + (o.headHtml || '<b>' + esc(title) + '</b>') + (o.head || '') + '<div class="sp"></div>' + (o.tools || '') + '<span class="bctl">' + ctl + '</span></div><div class="blk-b">' + (o.pad ? '<div class="card-b">' + inner + '</div>' : inner) + '</div></section>';
};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-collapse]');
  if (b) {
    const box = b.closest('.blk'), on = !box.classList.contains('collapsed');
    box.classList.toggle('collapsed', on); setPref(colKey(b.dataset.collapse), on);
    b.setAttribute('aria-expanded', String(!on)); b.title = on ? 'Mở rộng' : 'Thu gọn'; b.innerHTML = icon(on ? 'square' : 'minus');
    return;
  }
  const x = e.target.closest('[data-close]');
  if (x) {
    const id = x.dataset.close, h = H[id] || {};
    if (h.kind === 'info') infoClosed.add(id); else setPref('dong.' + id, true);
    setPref(colKey(id), false);
    if (h.close) h.close();
    if (h.render) h.render(); else { const box = x.closest('.blk'); if (box) box.remove(); }
    return;
  }
  const xl = e.target.closest('[data-xlsx]');
  if (xl && H[xl.dataset.xlsx] && H[xl.dataset.xlsx].xlsx) { H[xl.dataset.xlsx].xlsx(); return; }
  const cr = e.target.closest('[data-create]');
  if (cr) createMenu(cr);
});
/* Nut "Tao bang" tren thanh tren cua man hinh: tao lai bang da dong (o trang thai moi) */
export const createBtn = scr => '<button class="btn" data-create="' + scr + '" aria-haspopup="true">' + icon('plus') + 'Tạo bảng' + icon('down') + '</button>';
const createMenu = btn => {
  const list = Object.entries(H).filter(([, h]) => h.scr === btn.dataset.create && h.kind === 'table');
  const p = popover(btn, '<div style="width:300px"><div class="muted small" style="padding:4px 8px 8px">Chọn bảng để tạo lại. Bảng mở ra ở trạng thái mới' + (list.some(([, h]) => h.reopen) ? ', kèm bảng Bộ lọc để lọc lại' : '') + '.</div>' +
    list.map(([id, h]) => { const cl = isClosed(id); return '<button class="btn ghost" style="width:100%;justify-content:flex-start" data-mk="' + id + '"' + (cl ? '' : ' disabled') + '>' + icon('table') + esc(h.title) + (cl ? '' : ' (đang mở)') + '</button>'; }).join('') + '</div>');
  p.el.addEventListener('click', e => {
    const m = e.target.closest('[data-mk]'); if (!m) return;
    const h = H[m.dataset.mk]; p.close();
    if (h.reopen) h.reopen(() => { openBlk(m.dataset.mk); h.render && h.render(); });
    else { openBlk(m.dataset.mk); h.render && h.render(); }
  });
};

/* Tab trong the: list = [[key, nhan]] */
export const tabsHtml = (list, cur) => '<div class="tabs" role="tablist">' + list.map(([k, t]) => '<button class="tab" role="tab" data-tab="' + k + '" aria-selected="' + (k === cur) + '">' + esc(t) + '</button>').join('') + '</div>';

/* Cac buoc Quet KHCN -> Sua bai thieu -> Day HEMIS; now = buoc dang lam (1..3) */
export const steps = now => '<div class="steps" aria-label="Các bước">' + ['Quét KHCN', 'Sửa bài thiếu', 'Đẩy lên HEMIS'].map((t, i) => {
  const k = i + 1, cls = k < now ? 'done' : k === now ? 'now' : '';
  return (i ? '<div class="bar"></div>' : '') + '<div class="st ' + cls + '"' + (k === now ? ' aria-current="step"' : '') + '><i>' + (k < now ? icon('check') : k) + '</i>' + t + '</div>';
}).join('') + '</div>';

export const empty = (ic, title, text, act) => '<div class="empty">' + icon(ic) + '<h3>' + esc(title) + '</h3><p>' + text + '</p>' + (act || '') + '</div>';

/* ---- Bang truot phai: dong bang nut X, Esc hoac bam ra ngoai ---- */
let cur = null;
export const closeDrawer = () => { if (!cur) return; const c = cur; cur = null; c.scrim.remove(); c.dr.remove(); document.removeEventListener('keydown', c.key, true); if (c.onClose) c.onClose(); if (c.ret && c.ret.focus) c.ret.focus(); };
export const drawer = ({ title, sub, body, foot, wide, flush, onClose, head }) => {
  closeDrawer();
  const scrim = el('<div class="scrim"></div>');
  const dr = el('<aside class="drawer' + (wide ? ' wide' : '') + '" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><div class="dh"><div><h2>' + esc(title) + '</h2>' + (sub ? '<div class="muted small">' + sub + '</div>' : '') + '</div><div class="sp"></div>' + (head || '') + '<button class="btn icon sm" data-x aria-label="Đóng">' + icon('x') + '</button></div><div class="db' + (flush ? ' flush' : '') + '"></div>' + (foot ? '<div class="df">' + foot + '</div>' : '') + '</aside>');
  const db = dr.querySelector('.db');
  if (typeof body === 'string') db.innerHTML = body; else if (body) db.appendChild(body);
  const key = e => { if (e.key === 'Escape' && !document.querySelector('dialog[open]')) { e.preventDefault(); closeDrawer(); } };
  cur = { scrim, dr, key, onClose, ret: document.activeElement };
  scrim.onclick = closeDrawer; dr.querySelector('[data-x]').onclick = closeDrawer;
  document.addEventListener('keydown', key, true);
  document.body.append(scrim, dr);
  (dr.querySelector('.db input, .db select, .db button') || dr.querySelector('[data-x]')).focus();
  return dr;
};

/* ---- Hop thoai xac nhan / nhap chu (thay confirm, prompt) ---- */
export const ask = ({ title, text, ok = 'Đồng ý', cancel = 'Huỷ', danger, input, value, html }) => new Promise(res => {
  const d = el('<dialog class="dlg"><form method="dialog"><div class="dh">' + esc(title) + '</div><div class="db">' + (html || esc(text || '')) + (input ? '<input class="inp" name="v" aria-label="' + esc(input) + '" placeholder="' + esc(input) + '">' : '') + '</div><div class="df">' + (cancel ? '<button class="btn" value="no" type="submit">' + esc(cancel) + '</button>' : '') + '<button class="btn ' + (danger ? 'danger' : 'pri') + '" value="ok" type="submit">' + esc(ok) + '</button></div></form></dialog>');
  document.body.appendChild(d);
  const inp = d.querySelector('input'); if (inp) inp.value = value || '';
  d.addEventListener('close', () => { const v = d.returnValue === 'ok' ? (inp ? inp.value.trim() : true) : (inp ? null : false); d.remove(); res(v); });
  d.showModal(); if (inp) { inp.focus(); inp.select(); }
});
export const info = (title, text) => ask({ title, text, ok: 'Đã hiểu', cancel: '' });

/* ---- Thong bao nhanh ---- */
let toasts = null;
export const toast = (text, kind) => {
  if (!toasts) { toasts = el('<div class="toasts" role="status" aria-live="polite"></div>'); document.body.appendChild(toasts); }
  const t = el('<div class="toast' + (kind === 'err' ? ' err' : '') + '">' + icon(kind === 'err' ? 'alert' : 'check') + '<span></span></div>');
  t.querySelector('span').textContent = text; toasts.appendChild(t);
  setTimeout(() => t.remove(), kind === 'err' ? 6000 : 3500);
};

/* ---- Menu nho mo duoi mot nut; dong khi bam ra ngoai hoac Esc ---- */
export const popover = (btn, content) => {
  document.querySelectorAll('.pop').forEach(p => p.remove());
  const p = el('<div class="pop" role="dialog"></div>');
  if (typeof content === 'string') p.innerHTML = content; else p.appendChild(content);
  document.body.appendChild(p);
  const r = btn.getBoundingClientRect();
  p.style.top = (r.bottom + window.scrollY + 4) + 'px';
  p.style.left = Math.max(8, Math.min(r.left, window.innerWidth - p.offsetWidth - 8)) + 'px';
  const close = () => { p.remove(); document.removeEventListener('mousedown', out, true); document.removeEventListener('keydown', key, true); btn.focus(); };
  const out = e => { if (!p.contains(e.target) && !btn.contains(e.target)) close(); };
  const key = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  setTimeout(() => { document.addEventListener('mousedown', out, true); document.addEventListener('keydown', key, true); });
  const f = p.querySelector('input, select, button'); if (f) f.focus();
  return { el: p, close };
};

/* Hien dong "dang lam" cua mot man hinh */
export const setBusy = (root, txt) => { const b = root.querySelector('[data-busy]'); if (!b) return; b.hidden = !txt; b.querySelector('[data-busytxt]').textContent = txt || ''; };

/* Sao chep chu vao bo nho tam */
export const copy = async (text, okMsg) => { try { await navigator.clipboard.writeText(text); toast(okMsg || 'Đã sao chép'); return true; } catch (e) { toast('Trình duyệt chặn sao chép. Hãy dùng nút Excel.', 'err'); return false; } };
