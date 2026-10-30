// Bộ lọc dùng chung cho Bảng tổng hợp và Danh sách bài (bảng trượt phải "Bộ lọc").
import { norm, esc, toISO } from './core.js';
import { icon, drawer, closeDrawer, el } from './ui.js';
import { pref, setPref } from './store.js';
import { emit } from './data.js';

/* Truong loc: [id, ten, ham lay gia tri, kieu hien thi: 'chip' (it gia tri) | 'list' (nhieu gia tri, co o tim)] */
export const FIELDS = [
  ['y', 'Năm', a => a.y || '(không rõ)', 'chip'], ['khoa', 'Khoa / đơn vị', a => a.authors.filter(x => x.tlu).map(x => x.khoa), 'list'], ['bm', 'Bộ môn', a => a.authors.filter(x => x.tlu).map(x => x.bm), 'list'],
  ['l', 'Loại công bố', a => a.l, 'list'], ['grp', 'Nhóm chỉ số TT 83', a => a.grp, 'chip'], ['q', 'Xếp hạng Q', a => a.q, 'chip'],
  ['st', 'Trạng thái duyệt', a => a.st, 'chip'], ['nc', 'Áp dụng tính', a => a.nc, 'chip'], ['dm', 'Danh mục Bộ KH&CN', a => a.dm, 'chip'],
  ['hd', 'Ngành HĐCD', a => a.hd, 'list'], ['ht', 'Loại hỗ trợ kinh phí', a => a.ht, 'list'], ['j', 'Tạp chí / hội nghị', a => a.j, 'list']
];
export const ROLES = [['any', 'Bất kỳ', 'Bất kỳ vai trò (như KHCN)'], ['first', 'Thứ nhất', 'Tác giả thứ nhất'], ['corr', 'Liên hệ', 'Tác giả liên hệ'], ['fc', 'TN hoặc LH', 'Thứ nhất hoặc liên hệ'], ['fandc', 'TN và LH', 'Thứ nhất và liên hệ'], ['co', 'Chỉ đồng TG', 'Chỉ đồng tác giả']];
const RL = Object.fromEntries(ROLES.map(r => [r[0], r[2]]));
const SCAL = [['cb', 'Cán bộ'], ['kw', 'Từ khoá'], ['d1', 'Từ ngày'], ['d2', 'Đến ngày'], ['iff', 'IF ≥'], ['hp', 'Điểm HĐCD ≥'], ['nt', 'Số TG trong trường'], ['ex', 'TG ngoài trường'], ['lre', 'Loại có chữ']];
const NT = { '1': '1 người', '2-3': '2–3 người', '4+': 'từ 4 người' }, EX = { y: 'Có', n: 'Không' };

export const roleOK = (a, r) => r === 'any' || (r === 'first' && a.first) || (r === 'corr' && a.corr) || (r === 'fc' && (a.first || a.corr)) || (r === 'fandc' && a.first && a.corr) || (r === 'co' && !a.first && !a.corr);

/* Bien dieu kien (spec) thanh dang tinh nhanh */
export const comp = s => { s = s || {}; let re = null; try { re = s.lre ? new RegExp(s.lre, 'i') : null; } catch (e) {} return { name: s.name || '', sets: s.sets || {}, cbs: String(s.cb || '').split(',').map(x => norm(x)).filter(Boolean), kw: norm(s.kw || ''), d1: toISO(s.d1 || ''), d2: toISO(s.d2 || ''), iff: parseFloat(String(s.iff || '').replace(',', '.')) || 0, hp: parseFloat(String(s.hp || '').replace(',', '.')) || 0, nt: s.nt || '', ex: s.ex || '', role: s.role || 'any', re }; };
const AUF = new Set(['khoa', 'bm']);
const has = (c, id) => c.sets[id] && c.sets[id].length;
/* tac gia x thoa dieu kien ve don vi / can bo / vai tro */
export const aOK = (x, c) => x.tlu && (!has(c, 'khoa') || c.sets.khoa.includes(x.khoa)) && (!has(c, 'bm') || c.sets.bm.includes(x.bm)) && (!c.cbs.length || c.cbs.some(q => norm(x.n).includes(q) || norm(x.u) === q)) && roleOK(x, c.role);
export const needA = c => has(c, 'khoa') || has(c, 'bm') || c.cbs.length || c.role !== 'any';
export const artOK = (a, c) => {
  for (const id in c.sets) { if (AUF.has(id) || !has(c, id)) continue; const F = FIELDS.find(f => f[0] === id); if (F && ![].concat(F[2](a)).map(String).some(x => c.sets[id].includes(x))) return false; }
  if (c.re && !c.re.test(a.l || '')) return false;
  if (c.kw && !norm(a.t + ' ' + a.j).includes(c.kw)) return false;
  if (c.d1 && (!a.d || a.d < c.d1)) return false; if (c.d2 && (!a.d || a.d > c.d2)) return false;
  if (c.iff && a.iff < c.iff) return false; if (c.hp && a.hdp < c.hp) return false;
  if (c.nt === '1' && a.nTlu !== 1) return false; if (c.nt === '2-3' && (a.nTlu < 2 || a.nTlu > 3)) return false; if (c.nt === '4+' && a.nTlu < 4) return false;
  if (c.ex) { const e = a.authors.some(x => !x.tlu); if (c.ex === 'y' && !e) return false; if (c.ex === 'n' && e) return false; }
  if (needA(c) && !a.authors.some(x => aOK(x, c))) return false;
  return true;
};

/* Cac dieu kien dang ap dung, de hien thanh nhan co nut X: [[khoa, nhan]] */
export const conds = s => {
  const p = [];
  Object.entries(s.sets || {}).forEach(([id, v]) => { if (v && v.length) { const F = FIELDS.find(f => f[0] === id); p.push(['sets:' + id, (F ? F[1] : id) + ': ' + v.join(' / ')]); } });
  SCAL.forEach(([k, n]) => { if (s[k]) p.push([k, n + ': ' + (k === 'nt' ? NT[s[k]] : k === 'ex' ? EX[s[k]] : s[k])]); });
  if (s.role && s.role !== 'any') p.push(['role', 'Vai trò: ' + RL[s.role]]);
  return p;
};
export const descSpec = s => conds(s).map(c => c[1]).join('; ') || 'Tất cả bài';
export const nConds = s => conds(s).length;
export const dropCond = (s, key) => { s = JSON.parse(JSON.stringify(s || {})); if (key.startsWith('sets:')) delete s.sets[key.slice(5)]; else delete s[key]; if (s.sets && !Object.keys(s.sets).length) delete s.sets; return s; };

/* Moi bang mot bo loc rieng, luu tren may: F = filter('tonghop') */
const FS = {};
export const filter = key => FS[key] || (FS[key] = { key, spec: pref('loc.' + key, {}) });
export const setSpec = (F, s) => { F.spec = s || {}; if (!F.temp) setPref('loc.' + F.key, F.spec); emit('filter', F.key); };
/* Nut "Bo loc (n)" va hang nhan dieu kien cua mot bang */
export const filterBtn = F => { const n = nConds(F.spec); return '<button class="btn' + (n ? ' on' : '') + '" data-filter="' + F.key + '">' + icon('filter') + 'Bộ lọc' + (n ? ' <span class="badge" aria-label="' + n + ' điều kiện">' + n + '</span>' : '') + '</button>'; };
export const chipsHtml = F => { const c = conds(F.spec); return c.length ? '<div class="chips">' + c.map(([k, t]) => '<span class="chip"><span>' + esc(t) + '</span><button data-unf="' + esc(k) + '" data-fk="' + F.key + '" aria-label="Bỏ điều kiện ' + esc(t) + '">' + icon('x') + '</button></span>').join('') + '<button class="lnk" data-unf="*" data-fk="' + F.key + '">Xoá lọc</button></div>' : ''; };
/* gan su kien cho nhan: goi trong man hinh */
export const bindChips = root => root.addEventListener('click', e => { const b = e.target.closest('[data-unf]'); if (!b) return; const F = filter(b.dataset.fk); setSpec(F, b.dataset.unf === '*' ? {} : dropCond(F.spec, b.dataset.unf)); });

/* ---- Bang truot "Bo loc" ---- */
const uniq = (arr, f) => { const c = new Map(); arr.forEach(a => new Set([].concat(f(a)).map(String)).forEach(v => { if (v !== '' && v != null) c.set(v, (c.get(v) || 0) + 1); })); return [...c.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]), 'vi', { numeric: true })); };
/* F: bo loc cua bang; arts: danh sach bai; extra: { saveAs: fn(spec) } = che do tao "muc tu chon" (nut Luu lam muc moi),
   onApply: goi sau khi bam Ap dung (dung de tao lai bang da dong) */
export const openFilter = (F, arts, extra = {}) => {
  let s = JSON.parse(JSON.stringify(F.spec || {})); s.sets = s.sets || {};
  const sel = id => new Set(s.sets[id] || []);
  const body = el('<div></div>');
  const fieldHtml = ([id, name, fn, kind]) => {
    const opts = uniq(arts, fn), S = sel(id);
    if (kind === 'chip' && opts.length <= 12) return '<div class="fl"><div class="lbl">' + esc(name) + '</div><div class="chips">' + opts.map(([v, c]) => '<button class="chip opt" data-f="' + id + '" data-v="' + esc(v) + '" aria-pressed="' + S.has(v) + '">' + esc(v) + ' <span class="muted">' + c + '</span></button>').join('') + '</div></div>';
    return '<details class="fgrp" data-g="' + id + '"><summary>' + esc(name) + '<span class="v' + (S.size ? ' on' : '') + '">' + (S.size ? esc(S.size === 1 ? [...S][0] : S.size + ' mục') : 'Tất cả') + '</span>' + icon('down') + '</summary><div class="fgb"><input class="inp" placeholder="Tìm…" aria-label="Tìm trong ' + esc(name) + '" data-find><div class="optlist">' + opts.map(([v, c]) => '<label><input type="checkbox" data-f="' + id + '" value="' + esc(v) + '"' + (S.has(v) ? ' checked' : '') + '><span>' + esc(v) + '</span><span class="c">' + c + '</span></label>').join('') + '</div><div style="display:flex;gap:8px;margin-top:6px"><button class="btn sm" data-all="' + id + '">Chọn hết</button><button class="btn sm" data-none="' + id + '">Bỏ chọn</button></div></div></details>';
  };
  const inp = (k, label, ph) => '<div class="fl"><label for="lf-' + k + '">' + label + '</label><input class="inp" id="lf-' + k + '" data-k="' + k + '" placeholder="' + (ph || '') + '" value="' + esc(s[k] || '') + '"></div>';
  const opt = (k, label, o) => '<div class="fl"><label for="lf-' + k + '">' + label + '</label><select class="inp" id="lf-' + k + '" data-k="' + k + '"><option value="">Tất cả</option>' + Object.entries(o).map(([v, t]) => '<option value="' + v + '"' + (s[k] === v ? ' selected' : '') + '>' + t + '</option>').join('') + '</select></div>';
  body.innerHTML =
    FIELDS.filter(f => ['khoa', 'bm', 'l'].includes(f[0])).map(fieldHtml).join('') +
    FIELDS.filter(f => ['grp', 'st', 'q', 'y'].includes(f[0])).map(fieldHtml).join('') +
    '<div class="fl"><div class="lbl">Vai trò của tác giả thuộc khoa / bộ môn / cán bộ đã chọn</div><div class="seg g3" role="group" aria-label="Vai trò tác giả">' + ROLES.map(r => '<button data-role="' + r[0] + '" title="' + r[2] + '" aria-pressed="' + ((s.role || 'any') === r[0]) + '">' + r[1] + '</button>').join('') + '</div><div class="hint">Ví dụ: chọn Khoa Cơ khí + Liên hệ = bài có tác giả liên hệ thuộc Khoa Cơ khí. Không chọn khoa + Thứ nhất = bài có tác giả thứ nhất là người của Trường.</div></div>' +
    inp('cb', 'Cán bộ (tên hoặc tài khoản, cách nhau dấu phẩy)', 'Tên hoặc tài khoản…') + inp('kw', 'Từ khoá trong tên bài / tạp chí', 'Ví dụ: hồ chứa') +
    '<details class="fgrp"' + (['d1', 'd2', 'iff', 'hp', 'nt', 'ex'].some(k => s[k]) || ['nc', 'dm', 'hd', 'ht', 'j'].some(k => (s.sets[k] || []).length) ? ' open' : '') + '><summary>Thêm điều kiện' + icon('down') + '</summary><div class="fgb">' +
    FIELDS.filter(f => ['nc', 'dm', 'hd', 'ht', 'j'].includes(f[0])).map(fieldHtml).join('') +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 10px">' + inp('d1', 'Ngày công bố từ', 'dd/mm/yyyy') + inp('d2', 'đến', 'dd/mm/yyyy') + inp('iff', 'IF ≥') + inp('hp', 'Điểm HĐCD ≥') + '</div>' +
    opt('nt', 'Số tác giả trong trường', NT) + opt('ex', 'Có tác giả ngoài trường', EX) + '</div></details>';
  const cnt = () => { const c = comp(s); return arts.filter(a => artOK(a, c)).length; };
  const foot = extra.saveAs ? '<button class="btn" data-clear>Xoá hết</button><button class="btn pri" data-save>' + icon('plus') + 'Lưu làm mục mới · <span data-n></span> bài</button>' : '<button class="btn" data-clear>Xoá hết</button><button class="btn pri" data-apply>Áp dụng · <span data-n></span> bài</button>';
  const dr = drawer({ title: extra.saveAs ? 'Điều kiện cho mục mới' : 'Bộ lọc' + (extra.title ? ': ' + extra.title : ''), body, foot });
  const upd = () => { dr.querySelector('[data-n]').textContent = cnt().toLocaleString('vi-VN'); };
  const setVals = (id, vals) => { if (vals.length) s.sets[id] = vals; else delete s.sets[id]; const g = body.querySelector('details[data-g="' + id + '"] summary .v'); if (g) { g.textContent = vals.length ? (vals.length === 1 ? vals[0] : vals.length + ' mục') : 'Tất cả'; g.classList.toggle('on', !!vals.length); } upd(); };
  body.addEventListener('change', e => {
    const t = e.target;
    if (t.type === 'checkbox' && t.dataset.f) { const id = t.dataset.f; setVals(id, [...body.querySelectorAll('input[data-f="' + id + '"]:checked')].map(x => x.value)); }
    else if (t.dataset.k) { if (t.value.trim()) s[t.dataset.k] = t.value.trim(); else delete s[t.dataset.k]; upd(); }
  });
  body.addEventListener('input', e => {
    const t = e.target;
    if (t.matches('[data-find]')) { const q = norm(t.value); t.parentNode.querySelectorAll('.optlist label').forEach(l => { l.hidden = !norm(l.textContent).includes(q); }); }
    else if (t.dataset.k && t.tagName === 'INPUT') { if (t.value.trim()) s[t.dataset.k] = t.value.trim(); else delete s[t.dataset.k]; upd(); }
  });
  body.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.f) { b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); const id = b.dataset.f; setVals(id, [...body.querySelectorAll('button[data-f="' + id + '"][aria-pressed="true"]')].map(x => x.dataset.v)); }
    else if (b.dataset.role) { s.role = b.dataset.role; if (s.role === 'any') delete s.role; body.querySelectorAll('[data-role]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); upd(); }
    else if (b.dataset.all || b.dataset.none) { const id = b.dataset.all || b.dataset.none; body.querySelectorAll('input[data-f="' + id + '"]').forEach(c => { if (!c.closest('label').hidden) c.checked = !!b.dataset.all; }); setVals(id, [...body.querySelectorAll('input[data-f="' + id + '"]:checked')].map(x => x.value)); }
  });
  const clean = () => { if (!Object.keys(s.sets).length) delete s.sets; return s; };
  dr.addEventListener('click', async e => {
    if (e.target.closest('[data-apply]')) { setSpec(F, clean()); closeDrawer(); if (extra.onApply) extra.onApply(); }
    else if (e.target.closest('[data-clear]')) { closeDrawer(); if (!extra.saveAs) setSpec(F, {}); else F.spec = {}; openFilter(F, arts, extra); }
    else if (e.target.closest('[data-save]')) { const sp = clean(); if (await extra.saveAs(sp)) closeDrawer(); else s.sets = s.sets || {}; }
  });
  upd();
};
