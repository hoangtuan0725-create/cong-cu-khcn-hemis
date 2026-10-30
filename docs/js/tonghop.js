// Màn "Bảng tổng hợp": bảng nhiều tầng (hàng tối đa 3 cấp, cột tối đa 2 cấp), bảng một chiều, mục tự chọn (mẫu).
import { esc, norm, toISO, vnDate, fmtTime, tsv, n2 } from './core.js';
import { downloadXlsx } from './xlsx.js';
import { icon, screenHtml, blk, empty, ask, toast, popover, drawer, copy, regBlk, createBtn, $ } from './ui.js';
import { pref, setPref } from './store.js';
import { D, loadStats } from './data.js';
import { guide } from './huongdan.js';
import { FIELDS, comp, artOK, aOK, needA, roleOK, descSpec, filter, setSpec, filterBtn, chipsHtml, bindChips, openFilter } from './loc.js';

/* ---- Mau muc tu chon ---- */
const TPL0 = [
  { name: 'Tổng số bài' },
  { name: 'WoS/Scopus', sets: { grp: ['WoS/Scopus'] } },
  { name: 'WoS/Scopus Q1', sets: { grp: ['WoS/Scopus'], q: ['Q1'] } },
  { name: 'WoS/Scopus Q2', sets: { grp: ['WoS/Scopus'], q: ['Q2'] } },
  { name: 'WoS/Scopus Q3', sets: { grp: ['WoS/Scopus'], q: ['Q3'] } },
  { name: 'WoS/Scopus Q4', sets: { grp: ['WoS/Scopus'], q: ['Q4'] } },
  { name: 'Trong nước được tính', sets: { grp: ['Trong nước được tính'] } },
  { name: 'Có TG thứ nhất thuộc đơn vị', role: 'first' },
  { name: 'Có TG liên hệ thuộc đơn vị', role: 'corr' },
  { name: 'Có tác giả ngoài trường', ex: 'y' }
];
const BUILTIN = { 'Bộ chỉ số WoS, Q, vai trò tác giả (mẫu có sẵn)': TPL0 };
const B0 = Object.keys(BUILTIN)[0];
const clone = o => JSON.parse(JSON.stringify(o));
const tplAll = () => Object.assign({}, BUILTIN, pref('mau', {}));

/* Chieu: [id, ten, 1 = theo tac gia / 0 = theo bai / 2 = muc tu chon, ham lay gia tri] */
const VT = ['TG thứ nhất', 'TG liên hệ', 'Đồng tác giả'];
let LM = {};
const DIMS = [
  ['khoa', 'Khoa / đơn vị', 1, (a, x) => [x.khoa]], ['bm', 'Bộ môn', 1, (a, x) => [x.bm]], ['cb', 'Cán bộ', 1, (a, x) => [x.n + (x.u ? ' <' + x.u + '>' : '')]],
  ['vt', 'Vai trò tác giả', 1, (a, x) => { const r = []; if (x.first) r.push(VT[0]); if (x.corr) r.push(VT[1]); if (!r.length) r.push(VT[2]); return r; }],
  ['y', 'Năm', 0, a => [String(a.y || '(không rõ)')]], ['l', 'Loại công bố', 0, a => [LM[norm(a.l)] || a.l || '(không rõ)']], ['grp', 'Nhóm chỉ số TT 83', 0, a => [a.grp]], ['q', 'Xếp hạng Q', 0, a => [a.q]],
  ['st', 'Trạng thái duyệt', 0, a => [a.st]], ['nc', 'Áp dụng tính', 0, a => [a.nc]], ['dm', 'Danh mục Bộ KH&CN', 0, a => [a.dm]], ['hd', 'Ngành HĐCD', 0, a => [a.hd]], ['ht', 'Loại hỗ trợ kinh phí', 0, a => [a.ht]], ['j', 'Tạp chí / hội nghị', 0, a => [a.j]],
  ['tpl', 'Mục tự chọn (mẫu)', 2, null]
];
const DMf = id => DIMS.find(d => d[0] === id);
const MS = [['n', 'Số bài'], ['gio', 'Giờ KH'], ['tien', 'Tiền hỗ trợ (đ)'], ['hdp', 'Điểm HĐCD'], ['ifa', 'IF trung bình']];
const CM = [['whole', 'Mỗi đơn vị có tác giả tính 1 bài (như KHCN)'], ['frT', 'Chia đều theo tác giả trong trường'], ['frA', 'Chia đều theo tổng số tác giả']];
const PRE = [
  ['Khoa × (Năm → 14 loại)', { rows: ['khoa'], cols: ['y', 'l'] }], ['Khoa → Bộ môn × (Năm → 14 loại)', { rows: ['khoa', 'bm'], cols: ['y', 'l'] }],
  ['Khoa → Bộ môn → Cán bộ × Năm', { rows: ['khoa', 'bm', 'cb'], cols: ['y'] }], ['Khoa × (Năm → Vai trò tác giả)', { rows: ['khoa'], cols: ['y', 'vt'] }],
  ['Khoa × (Năm → Q)', { rows: ['khoa'], cols: ['y', 'q'] }], ['14 loại × Năm', { rows: ['l'], cols: ['y'] }], ['Khoa × Năm: số bài, giờ KH, tiền', { rows: ['khoa'], cols: ['y'], ms: ['n', 'gio', 'tien'] }],
  ['Khoa × (Năm → Mục tự chọn)', { rows: ['khoa'], cols: ['y', 'tpl'] }]
];
/* Moi bang mot bo loc rieng */
const FP = filter('tonghop'), F1 = filter('mot');
const PV0 = { rows: ['khoa'], cols: ['y', 'l'], ms: ['n'], tot: true, yF: 0, yT: 0, cm: 'whole', sort: 'name', hz: false };
const PV = Object.assign({ rows: ['khoa'], cols: ['y', 'l'], ms: ['n'], tot: true, yF: 0, yT: 0, cm: 'whole', sort: 'name', hz: false, tpl: B0, tc: clone(TPL0) }, pref('pv', {}));
const savePV = () => setPref('pv', PV);
const S1 = String.fromCharCode(31), S2 = String.fromCharCode(30), TOT = 'Tổng';
const cart = arrs => arrs.reduce((acc, vs) => { const o = []; acc.forEach(p => vs.forEach(v => o.push(p.concat([v])))); return o; }, [[]]);
let LR = null, CL = new Set(), CLsig = '', PVL = [], PVX = null, root, err = '';
const Y = new Date().getFullYear();

/* ===== Tinh bang tong hop (giu nguyen cach tinh cua ban cu) ===== */
const pvCalc = () => {
  const A = D.stats.arts, LOAI = D.loai || [];
  LM = {}; LOAI.forEach(o => { LM[norm(o)] = o; });
  const G = comp(FP.spec);
  const y0 = Math.min(PV.yF, PV.yT), y1 = Math.max(PV.yF, PV.yT);
  const base = A.filter(a => a.y >= y0 && a.y <= y1 && artOK(a, G));
  const tcs = (PV.tc || []).map(comp);
  const rD = PV.rows.map(DMf).filter(Boolean), cD = PV.cols.map(DMf).filter(Boolean);
  const au = rD.concat(cD).some(d => d[2] === 1);
  const val = (d, a, x) => d[2] === 2 ? tcs.filter(c => artOK(a, c) && (!x || !needA(c) || aOK(x, c))).map(c => c.name) : d[3](a, x);
  const M = new Map();
  const add = (k, w, a, ai) => { let c = M.get(k); if (!c) { c = { n: 0, gio: 0, tien: 0, hdp: 0, ifs: 0, ifn: 0, ids: [], last: -1 }; M.set(k, c); } c.n += w; c.gio += w * a.gioN; c.tien += w * a.tienN; c.hdp += w * a.hdp; if (a.iff > 0) { c.ifs += w * a.iff; c.ifn += w; } if (c.last !== ai) { c.ids.push(ai); c.last = ai; } };
  base.forEach((a, ai) => {
    const units = au ? a.authors.filter(x => aOK(x, G)) : [null]; if (!units.length) return;
    const den = !au ? 0 : PV.cm === 'frT' ? a.nTlu : PV.cm === 'frA' ? a.nAll : 0;
    const done = new Set();
    units.forEach(x => {
      const rv = rD.map(d => val(d, a, x)), cv = cD.map(d => val(d, a, x));
      if (rv.some(v => !v.length) || cv.some(v => !v.length)) return;
      const rps = cart(rv); let cps = cart(cv);
      if (PV.tot && cD.length) cps = cps.concat(cart([[TOT]].concat(cv.slice(1))));
      const keys = new Set();
      rps.forEach(rp => { for (let k = 0; k <= rp.length; k++) { const pre = rp.slice(0, k).join(S1); cps.forEach(cp => keys.add(pre + S2 + cp.join(S1))); } });
      keys.forEach(k => { if (den) add(k, 1 / den, a, ai); else if (!done.has(k)) { done.add(k); add(k, 1, a, ai); } });
    });
  });
  const rows = new Map(), cvals = cD.map(() => new Set());
  M.forEach((c, k) => { const i = k.indexOf(S2), rk = k.slice(0, i), ck = k.slice(i + 1); if (!rows.has(rk)) rows.set(rk, rk ? rk.split(S1) : []); if (ck) ck.split(S1).forEach((v, j) => { if (v !== TOT) cvals[j].add(v); }); });
  const ord = (d, set) => { const id = d[0]; let o = [...set];
    if (id === 'l' && LOAI.length) o = LOAI.concat(o.filter(v => !LOAI.includes(v)));
    else if (id === 'vt') o = VT.filter(v => set.has(v));
    else if (id === 'tpl') o = tcs.map(c => c.name).filter((v, i, s) => v && s.indexOf(v) === i);
    else o.sort((p, q) => String(p).localeCompare(String(q), 'vi', { numeric: true }));
    return o; };
  const lv = cD.map((d, i) => ord(d, cvals[i])); if (PV.tot && cD.length) lv[0] = lv[0].concat([TOT]);
  let leaves = cart(lv);
  if (PV.hz) leaves = leaves.filter(p => { const c = M.get(S2 + p.join(S1)); return c && c.n > 0; });
  const kids = new Map(); rows.forEach((p, rk) => { if (!p.length) return; const par = p.slice(0, -1).join(S1); if (!kids.has(par)) kids.set(par, []); kids.get(par).push(rk); });
  const tot = rk => { let s = 0; leaves.forEach(lp => { const c = M.get(rk + S2 + lp.join(S1)); if (c && lp[0] !== TOT) s += c.n; }); return s; };
  const flat = [];
  const walk = (par, lvl) => { const ks = kids.get(par) || []; const d = rD[lvl];
    if (PV.sort === 'total') { const t = new Map(ks.map(k => [k, tot(k)])); ks.sort((p, q) => t.get(q) - t.get(p)); }
    else { const o = ord(d, new Set(ks.map(k => rows.get(k)[lvl]))); ks.sort((p, q) => o.indexOf(rows.get(p)[lvl]) - o.indexOf(rows.get(q)[lvl])); }
    ks.forEach(k => { flat.push({ rk: k, p: rows.get(k), lvl, hk: kids.has(k) }); if (kids.has(k)) walk(k, lvl + 1); }); };
  walk('', 0);
  /* doi cach chia hang: mac dinh mo cap 1, thu gon cap 2 khi co 3 cap */
  const sig = PV.rows.join('|');
  if (sig !== CLsig) { CLsig = sig; CL = new Set(rD.length >= 3 ? flat.filter(f => f.lvl === 1).map(f => f.rk) : []); }
  LR = { M, base, rD, cD, leaves, flat, au };
};
const mval = (m, c) => !c ? 0 : m === 'ifa' ? (c.ifn ? c.ifs / c.ifn : 0) : c[m];
const fmtV = (m, v) => m === 'tien' ? Math.round(v).toLocaleString('vi-VN') : m === 'ifa' ? v.toFixed(3).replace('.', ',') : n2(v);

const pvTable = () => {
  const { M, rD, cD, leaves, flat, au, base } = LR, msN = MS.filter(m => PV.ms.includes(m[0]));
  const cells = []; leaves.forEach(lp => msN.forEach(m => cells.push({ lp, m: m[0], ml: m[1] })));
  const hR = cD.length + (msN.length > 1 || !cD.length ? 1 : 0);
  const th = (t, cs, rs, cls) => '<th class="' + (cls || 'num') + '"' + (cs > 1 ? ' colspan="' + cs + '"' : '') + (rs > 1 ? ' rowspan="' + rs + '"' : '') + '>' + esc(t) + '</th>';
  let h = '<table class="tbl pv"><thead><tr>' + th(rD.map(d => d[1]).join(' → '), 1, hR, 'stick');
  const hdrL = [];
  for (let i = 0; i < cD.length; i++) {
    if (i) h += '<tr>';
    const lineT = [];
    for (let j = 0; j < cells.length;) { const key = cells[j].lp.slice(0, i + 1).join(S1); let k = j; while (k < cells.length && cells[k].lp.slice(0, i + 1).join(S1) === key) k++; h += th(cells[j].lp[i], k - j, 1, (k - j > 1 ? 'grp' : 'num') + ' bl'); lineT.push(cells[j].lp[i]); for (let z = j + 1; z < k; z++) lineT.push(''); j = k; }
    h += '</tr>'; hdrL.push(lineT);
  }
  if (msN.length > 1 || !cD.length) { if (cD.length) h += '<tr>'; h += cells.map(c => th(c.ml)).join('') + '</tr>'; hdrL.push(cells.map(c => c.ml)); }
  h += '</thead><tbody>';
  const lvN = Math.max(1, rD.length);
  /* o gop cho file Excel: nhom cot o cac dong tieu de, nhan hang o dong dau */
  const merges = [], cl = i => { let t = ''; i++; while (i) { const m = (i - 1) % 26; t = String.fromCharCode(65 + m) + t; i = (i - 1 - m) / 26; } return t; };
  hdrL.forEach((l, r) => { for (let j = 0; j < l.length;) { let k = j + 1; while (k < l.length && l[k] === '' && r < cD.length) k++; if (k - j > 1) merges.push(cl(lvN + j) + (r + 1) + ':' + cl(lvN + k - 1) + (r + 1)); j = k; } });
  if (hdrL.length > 1) for (let c = 0; c < lvN; c++) merges.push(cl(c) + '1:' + cl(c) + hdrL.length);
  const lines = hdrL.map((l, i) => (i === 0 ? rD.map(d => d[1]).concat(new Array(lvN - rD.length).fill('')) : new Array(lvN).fill('')).concat(l));
  const rowCells = rk => cells.map(c => mval(c.m, M.get(rk + S2 + c.lp.join(S1))));
  const vis = [], hid = new Set();
  flat.forEach((f, fi) => { const par = f.p.slice(0, -1).join(S1); if (hid.has(par) || (CL.has(par) && f.lvl > 0)) { hid.add(f.rk); return; } vis.push(fi); });
  const totLab = au ? 'Toàn trường' : 'Tổng';
  const tdRow = (label, rk, fi, lvl, hk, open, isTot) => {
    const v = rowCells(rk);
    const cls = isTot ? 'tot' : lvl < rD.length - 1 ? 'sub' : '';
    return '<tr' + (cls ? ' class="' + cls + '"' : '') + '><td class="stick lab" style="padding-left:' + (10 + lvl * 20) + 'px">' +
      (hk ? '<button class="tog" data-t="' + fi + '" aria-expanded="' + open + '" aria-label="' + (open ? 'Thu gọn ' : 'Mở ') + esc(label) + '">' + icon(open ? 'down' : 'right') + '</button>' : '') + esc(label) + (isTot ? ' <span class="muted" style="font-weight:400">(mỗi bài tính 1 lần)</span>' : '') + '</td>' +
      v.map((x, ci) => '<td class="num cell' + (x ? '' : ' z') + (ci && cells[ci].lp[0] !== cells[ci - 1].lp[0] ? ' bl' : '') + '" data-r="' + fi + '" data-c="' + ci + '"' + (x ? ' tabindex="0"' : '') + '>' + (x ? fmtV(cells[ci].m, x) : '0') + '</td>').join('') + '</tr>';
  };
  const MAXR = 3000;
  h += vis.slice(0, MAXR).map(fi => { const f = flat[fi]; return tdRow(f.p[f.lvl], f.rk, fi, f.lvl, f.hk, !CL.has(f.rk), false); }).join('') + tdRow(totLab, '', -1, 0, false, false, true) + '</tbody></table>';
  flat.forEach(f => { const r = new Array(lvN).fill(''); for (let i = 0; i <= f.lvl; i++) r[i] = f.p[i]; lines.push(r.concat(rowCells(f.rk).map((x, ci) => fmtV(cells[ci].m, x)))); });
  lines.push([totLab + ' (mỗi bài tính 1 lần)'].concat(new Array(lvN - 1).fill('')).concat(rowCells('').map((x, ci) => fmtV(cells[ci].m, x))));
  const rnd = (m, v) => m === 'tien' ? Math.round(v) : m === 'ifa' ? Math.round(v * 1000) / 1000 : Math.round(v * 100) / 100;
  const xrows = lines.slice(0, hdrL.length).concat(flat.map(f => { const r = new Array(lvN).fill(''); for (let i = 0; i <= f.lvl; i++) r[i] = f.p[i]; return r.concat(rowCells(f.rk).map((v, ci) => rnd(cells[ci].m, v))); }));
  xrows.push([totLab + ' (mỗi bài tính 1 lần)'].concat(new Array(lvN - 1).fill('')).concat(rowCells('').map((v, ci) => rnd(cells[ci].m, v))));
  PVX = { name: 'Bảng tổng hợp', rows: xrows, head: hdrL.length, freezeCols: lvN, merges, totals: [xrows.length - 1] };
  PVL = lines; LR.cells = cells;
  const notes = [];
  if (PV.cols.includes('l') || PV.rows.includes('l')) notes.push(D.loai && D.loai.length ? 'Loại công bố theo đúng ' + D.loai.length + ' loại trên KHCN.' : 'Chưa đọc được danh sách loại công bố của KHCN nên chỉ hiện loại có bài.');
  if (au && PV.cm === 'whole') notes.push('Bài có tác giả ở nhiều đơn vị được tính cho mỗi đơn vị, nên cộng các dòng con có thể lớn hơn dòng cha.');
  const info = '<span><b>' + flat.length.toLocaleString('vi-VN') + ' dòng × ' + cells.length + ' cột</b> · tính từ ' + base.length.toLocaleString('vi-VN') + ' bài, năm ' + Math.min(PV.yF, PV.yT) + '–' + Math.max(PV.yF, PV.yT) + '</span>' +
    (rD.length > 1 ? '<button class="lnk" data-open-all>Mở hết các dòng</button><button class="lnk" data-fold>Thu gọn về cấp 1</button>' : '') + (notes.length ? '<span>' + esc(notes.join(' ')) + '</span>' : '');
  return { table: h + (vis.length > MAXR ? '<div class="more">Chỉ hiện ' + MAXR + ' dòng đầu. Bấm Excel để lấy đủ.</div>' : ''), info };
};

/* ===== Bang mot chieu ===== */
const GB = [['khoa', 'Khoa / đơn vị'], ['bm', 'Bộ môn'], ['cb', 'Cán bộ'], ['l', 'Loại công bố'], ['grp', 'Nhóm chỉ số'], ['y', 'Năm'], ['j', 'Tạp chí'], ['q', 'Xếp hạng Q'], ['hd', 'Ngành HĐCD'], ['st', 'Trạng thái duyệt']];
const one = { gb: pref('mot.gb', 'khoa'), cm: pref('mot.cm', 'whole'), lines: [] };
const oneHtml = () => {
  const G = comp(F1.spec), role = G.role;
  const Ls = D.stats.arts.filter(a => artOK(a, G));
  const gb = one.gb, cm = one.cm, T = new Map();
  const addT = (key, a, w) => { let r = T.get(key); if (!r) { r = { tot: 0, c: {}, q: {} }; T.set(key, r); } r.tot += w; r.c[a.grp] = (r.c[a.grp] || 0) + w; if (a.grp === 'WoS/Scopus' && /^Q\d/.test(a.q)) r.q[a.q] = (r.q[a.q] || 0) + w; };
  Ls.forEach(a => {
    if (gb === 'khoa' || gb === 'bm' || gb === 'cb') {
      const kf = x => gb === 'khoa' ? x.khoa : gb === 'bm' ? x.bm + ' (' + x.khoa + ')' : x.n + (x.u ? ' <' + x.u + '>' : '') + ' – ' + x.khoa;
      const qual = a.authors.filter(x => aOK(x, G));
      if (cm === 'whole') new Set(qual.map(kf)).forEach(k => addT(k, a, 1));
      else { const den = cm === 'frT' ? a.authors.filter(x => x.tlu && roleOK(x, role)).length : a.authors.filter(x => roleOK(x, role)).length; if (den) qual.forEach(x => addT(kf(x), a, 1 / den)); }
    } else { const F = FIELDS.find(f => f[0] === gb); addT(String(F ? F[2](a) : ''), a, 1); }
  });
  const rowsT = [...T.entries()].sort((x, y) => y[1].tot - x[1].tot);
  const hdr = [GB.find(g => g[0] === gb)[1], 'Tổng', 'WoS/Scopus', 'trong đó Q1', 'Q2', 'Q3', 'Q4', 'Trong nước được tính', 'Không được tính'];
  const tab = rowsT.map(([k, r]) => [k, r.tot, r.c['WoS/Scopus'] || 0, r.q.Q1 || 0, r.q.Q2 || 0, r.q.Q3 || 0, r.q.Q4 || 0, r.c['Trong nước được tính'] || 0, (r.c['Không được tính'] || 0) + (r.c['Không rõ loại'] || 0)]);
  one.lines = [hdr].concat(tab.map(r => [r[0]].concat(r.slice(1).map(v => Math.round(v * 100) / 100))));
  const sumU = rowsT.reduce((s, r) => s + r[1].tot, 0);
  const sel = (k, list, cur) => '<label class="sel">' + (k === 'gb' ? 'Nhóm theo' : 'Cách tính') + ' <select data-one="' + k + '">' + list.map(([v, t]) => '<option value="' + v + '"' + (v === cur ? ' selected' : '') + '>' + esc(t) + '</option>').join('') + '</select></label>';
  const ch = chipsHtml(F1);
  return '<div class="toolbar">' + sel('gb', GB, gb) + (['khoa', 'bm', 'cb'].includes(gb) ? sel('cm', CM, cm) : '') + filterBtn(F1) + '</div>' + (ch ? '<div class="chipbar">' + ch + '</div>' : '') +
    '<div class="pvinfo"><span><b>' + Ls.length.toLocaleString('vi-VN') + '</b> bài sau khi lọc · WoS/Scopus ' + Ls.filter(a => a.grp === 'WoS/Scopus').length + ' · Trong nước được tính ' + Ls.filter(a => a.grp === 'Trong nước được tính').length + '</span>' +
    (['khoa', 'bm', 'cb'].includes(gb) && cm === 'whole' && sumU > Ls.length ? '<span>Cộng các dòng = ' + n2(sumU) + ' lớn hơn ' + Ls.length + ' vì một bài có tác giả ở nhiều đơn vị được tính cho mỗi đơn vị.</span>' : '') + '</div>' +
    '<div class="tw" style="max-height:480px"><table class="tbl"><thead><tr>' + hdr.map((x, i) => '<th' + (i ? ' class="num"' : '') + '>' + esc(x) + '</th>').join('') + '</tr></thead><tbody>' +
    tab.slice(0, 2000).map(r => '<tr><td>' + esc(r[0]) + '</td>' + r.slice(1).map(v => '<td class="num' + (v ? '' : ' z') + '">' + n2(v) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
};

/* ===== Muc tu chon (mau) ===== */
const tplHtml = () => {
  const T = tplAll();
  return '<div class="toolbar"><label class="sel">Mẫu <select data-tpls>' + Object.keys(T).map(n => '<option' + (n === PV.tpl ? ' selected' : '') + '>' + esc(n) + '</option>').join('') + (T[PV.tpl] ? '' : '<option selected>' + esc(PV.tpl || '(chưa lưu)') + '</option>') + '</select></label>' +
    '<button class="btn sm" data-tpl="save">' + icon('save') + 'Lưu mẫu</button><button class="btn sm" data-tpl="del">' + icon('trash') + 'Xoá mẫu</button><button class="btn sm" data-tpl="exp">' + icon('share') + 'Gửi mẫu cho đồng nghiệp</button><button class="btn sm" data-tpl="imp">' + icon('dl') + 'Nhận mẫu</button></div>' +
    '<div class="card-b"><div class="chips">' + ((PV.tc || []).map((c, i) => '<span class="tplitem" title="' + esc(descSpec(c)) + '"><b>' + (i + 1) + '.</b><button class="nm" data-ti="ren" data-i="' + i + '" title="Đổi tên">' + esc(c.name) + '</button><button data-ti="l" data-i="' + i + '" aria-label="Chuyển sang trái">' + icon('left') + '</button><button data-ti="r" data-i="' + i + '" aria-label="Chuyển sang phải">' + icon('right') + '</button><button data-ti="x" data-i="' + i + '" aria-label="Bỏ mục ' + esc(c.name) + '">' + icon('x') + '</button></span>').join('') || '<span class="muted">Chưa có mục nào.</span>') + '</div>' +
    '<div style="margin-top:12px;display:flex;gap:12px;align-items:center;flex-wrap:wrap"><button class="btn sm pri" data-tpl="add">' + icon('plus') + 'Thêm mục</button><span class="muted small">Bấm Thêm mục → chọn điều kiện trong bảng Bộ lọc → bấm “Lưu làm mục mới” rồi đặt tên. Bấm tên mục để đổi tên.</span></div></div>';
};
const tplChanged = () => { if (PV.tpl && !/ \(đã sửa\)$/.test(PV.tpl)) PV.tpl += ' (đã sửa)'; savePV(); scr.render(); };
const addItem = async sp => {
  const d = descSpec(sp);
  const n = await ask({ title: 'Tên mục mới', text: 'Điều kiện: ' + d, input: 'Tên mục', value: d.length > 70 ? '' : d, ok: 'Thêm' });
  if (!n) return false;
  sp = clone(sp); sp.name = n; PV.tc = (PV.tc || []).concat([sp]);
  if (!PV.rows.concat(PV.cols).includes('tpl')) PV.cols = ['y', 'tpl'];
  tplChanged(); toast('Đã thêm mục “' + n + '”'); return true;
};
const tplAct = async k => {
  const P = pref('mau', {});
  if (k === 'add') openFilter({ key: 'moi', spec: {}, temp: true }, D.stats.arts, { saveAs: addItem });
  else if (k === 'save') {
    const n = await ask({ title: 'Lưu mẫu', text: 'Mẫu được lưu trên máy này.', input: 'Tên mẫu', value: String(PV.tpl || '').replace(/ \(đã sửa\)$/, '').replace(/ \(mẫu có sẵn\)$/, ' – của tôi'), ok: 'Lưu' });
    if (!n) return; if (BUILTIN[n]) { toast('Trùng tên mẫu có sẵn, hãy đặt tên khác.', 'err'); return; }
    P[n] = PV.tc; setPref('mau', P); PV.tpl = n; savePV(); scr.render(); toast('Đã lưu mẫu “' + n + '”');
  } else if (k === 'del') {
    if (!P[PV.tpl]) { toast('Chỉ xoá được mẫu do mình lưu.', 'err'); return; }
    if (!await ask({ title: 'Xoá mẫu?', text: 'Xoá mẫu “' + PV.tpl + '” khỏi máy này.', ok: 'Xoá', danger: true })) return;
    delete P[PV.tpl]; setPref('mau', P); PV.tpl = B0; PV.tc = clone(TPL0); savePV(); scr.render();
  } else if (k === 'exp') {
    copy('T2KMAU:' + JSON.stringify({ n: String(PV.tpl || 'Mẫu').replace(/ \(đã sửa\)$/, ''), c: PV.tc }), 'Đã sao chép mẫu. Dán (Ctrl+V) vào Zalo/email gửi đồng nghiệp; người nhận bấm “Nhận mẫu” rồi dán vào.');
  } else if (k === 'imp') {
    const s = await ask({ title: 'Nhận mẫu', text: 'Dán mẫu nhận được (bắt đầu bằng T2KMAU:)', input: 'T2KMAU:…', ok: 'Nhận' });
    if (!s) return;
    try { const o = JSON.parse(s.trim().replace(/^T2KMAU:/, '')); if (!Array.isArray(o.c)) throw 0; let n = o.n || 'Mẫu nhận được'; if (BUILTIN[n]) n += ' (nhận)'; P[n] = o.c; setPref('mau', P); PV.tpl = n; PV.tc = o.c; savePV(); scr.render(); toast('Đã nhận mẫu “' + n + '”'); }
    catch (e) { toast('Mẫu không đúng định dạng.', 'err'); }
  }
};

/* ===== Xem bai trong mot o ===== */
const auHtml = a => a.authors.map(x => '<span class="' + (x.tlu ? '' : 'au-ext') + '"' + (x.tlu ? ' title="' + esc(x.bm + ' – ' + x.khoa) + '"' : '') + '>' + esc(x.n) + (x.first ? '<span class="au-tn">TN</span>' : '') + (x.corr ? '<span class="au-lh">LH</span>' : '') + '</span>').join(', ');
export const drill = (title, list) => {
  const rows = [['Tên bài', 'Tạp chí / hội nghị', 'Loại công bố', 'Q', 'Ngày', 'Tác giả', 'Giờ KH', 'Tiền hỗ trợ', 'Trạng thái']].concat(list.map(a => [a.t, a.j, a.l, a.q, vnDate(a.d), a.authors.map(z => z.n + (z.first ? ' [TG thứ nhất]' : '') + (z.corr ? ' [TG liên hệ]' : '') + (z.tlu ? ' (' + z.khoa + ')' : '')).join(', '), a.gio, a.tien, a.st]));
  const dr = drawer({
    title, wide: true, flush: true, sub: list.length + ' bài · TN = tác giả thứ nhất, LH = tác giả liên hệ, chữ xám = ngoài trường',
    head: '<button class="cbtn" data-dcsv title="Xuất Excel" aria-label="Xuất Excel">' + icon('sheet') + '</button>',
    body: '<table class="tbl"><thead><tr><th>Bài báo</th><th>Q</th><th>Ngày</th><th>Trạng thái</th></tr></thead><tbody>' + list.slice(0, 500).map(a => '<tr><td class="t"><b>' + esc(a.t) + '</b><div class="muted">' + esc(a.j) + ' · ' + auHtml(a) + '</div></td><td class="nowrap">' + esc(a.q === 'Không có Q' ? '—' : a.q) + '</td><td class="nowrap">' + esc(vnDate(a.d)) + '</td><td class="nowrap">' + esc(a.st) + '</td></tr>').join('') + '</tbody></table>' + (list.length > 500 ? '<div class="more">Đang hiện 500/' + list.length + ' bài. Bấm Excel để lấy đủ.</div>' : '')
  });
  dr.querySelector('[data-dcsv]').onclick = () => downloadXlsx('Bài trong ô ' + title.slice(0, 60), { name: 'Danh sách bài', rows });
};

/* ===== Khoang du lieu ===== */
const rangePop = btn => {
  const r = pref('range', null) || ['01/01/' + (Y - 1), '31/12/' + Y];
  const p = popover(btn, '<div style="width:300px"><div class="fl"><div class="lbl">Chọn nhanh</div><div class="chips">' + [['Năm nay', 0], ['3 năm gần nhất', 2], ['5 năm gần nhất', 4], ['Từ 2021 đến nay', 2021]].map(q => '<button class="chip opt" data-q="' + q[1] + '">' + q[0] + '</button>').join('') + '</div></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div class="fl"><label for="r-f">Từ ngày</label><input class="inp" id="r-f" value="' + esc(r[0]) + '"></div><div class="fl"><label for="r-t">Đến ngày</label><input class="inp" id="r-t" value="' + esc(r[1]) + '"></div></div>' +
    '<label class="chk"><input type="checkbox" id="r-fresh">Lấy lại toàn bộ chi tiết tác giả</label><div class="muted small" style="margin:4px 0 10px">Lần đầu tải nhiều năm mất vài phút; các lần sau nhanh vì chi tiết đã lưu trên máy.</div><button class="btn pri" style="width:100%" data-go>' + icon('dl') + 'Tải dữ liệu</button></div>');
  p.el.addEventListener('click', e => {
    const q = e.target.closest('[data-q]');
    if (q) { const v = +q.dataset.q; p.el.querySelector('#r-f').value = '01/01/' + (v >= 2000 ? v : Y - v); p.el.querySelector('#r-t').value = '31/12/' + Y; }
    if (q || e.target.closest('[data-go]')) { const a = p.el.querySelector('#r-f').value.trim(), b = p.el.querySelector('#r-t').value.trim(), fr = p.el.querySelector('#r-fresh').checked; p.close(); load(a, b, fr); }
  });
};
async function load(a, b, fresh) {
  const fa = toISO(a), fb = toISO(b);
  if (!fa || !fb) { toast('Ngày chưa đúng dạng ngày/tháng/năm', 'err'); return; }
  setPref('range', [a, b]); err = '';
  try { await loadStats(fa, fb, fresh); toast('Đã tải ' + D.stats.arts.length.toLocaleString('vi-VN') + ' bài (' + D.stats.nNew + ' bài lấy chi tiết mới)'); }
  catch (x) { if (x.code === 'noext') guide(); err = x.message; toast(x.message, 'err'); scr.render(); }
}

/* ===== Ve man hinh ===== */
const dimSel = (k, i, none) => { const v = (k === 'r' ? PV.rows : PV.cols)[i] || ''; return '<select data-dim="' + k + i + '" aria-label="' + (k === 'r' ? 'Hàng' : 'Cột') + ' cấp ' + (i + 1) + '">' + (none ? '<option value="">(không)</option>' : '') + DIMS.map(d => '<option value="' + d[0] + '"' + (d[0] === v ? ' selected' : '') + '>' + d[1] + '</option>').join('') + '</select>'; };
const pivotTools = ys => {
  const pre = PRE.findIndex(p => JSON.stringify(p[1].rows) === JSON.stringify(PV.rows) && JSON.stringify(p[1].cols) === JSON.stringify(PV.cols));
  const yo = v => ys.map(y => '<option' + (y === v ? ' selected' : '') + '>' + y + '</option>').join('');
  return '<label class="sel">Mẫu <select data-pre><option value="">(tự chọn)</option>' + PRE.map((p, i) => '<option value="' + i + '"' + (i === pre ? ' selected' : '') + '>' + esc(p[0]) + '</option>').join('') + '</select></label>' +
    '<span class="sel">Hàng <span class="selrow">' + dimSel('r', 0) + icon('right') + dimSel('r', 1, 1) + icon('right') + dimSel('r', 2, 1) + '</span></span>' +
    '<span class="sel">Cột <span class="selrow">' + dimSel('c', 0, 1) + icon('right') + dimSel('c', 1, 1) + '</span></span>' +
    '<button class="sel" data-ms>Số liệu <b>' + esc(MS.filter(m => PV.ms.includes(m[0])).map(m => m[1]).join(', ')) + '</b>' + icon('down') + '</button>' +
    '<span class="sel">Năm <select data-yf aria-label="Từ năm">' + yo(PV.yF) + '</select>–<select data-yt aria-label="Đến năm">' + yo(PV.yT) + '</select></span>' +
    '<button class="sel" data-opt>Tuỳ chọn' + icon('settings') + '</button>' +
    filterBtn(FP);
};

const scr = {
  id: 'tonghop', title: 'Bảng tổng hợp', icon: 'table', group: 1, busy: ['stats'], on: ['stats', 'filter'],
  init(el) {
    root = el;
    el.innerHTML = screenHtml({ title: 'Bảng tổng hợp', acts: '<button class="btn" data-range>' + icon('calendar') + 'Khoảng dữ liệu</button><button class="btn" data-reload>' + icon('refresh') + 'Tải lại</button>' + createBtn('tonghop') + '<button class="btn pri" data-copy>' + icon('copy') + 'Sao chép bảng</button>' });
    regBlk('th.pivot', {
      scr: 'tonghop', title: 'Bảng tổng hợp nhiều tầng', render: () => scr.render(),
      xlsx: () => { if (PVX) downloadXlsx('Bảng tổng hợp KHCN', PVX); },
      close: () => { setSpec(FP, {}); Object.assign(PV, clone(PV0)); savePV(); CL = new Set(); CLsig = ''; PVX = null; PVL = []; },
      reopen: done => D.stats && openFilter(FP, D.stats.arts, { title: 'Bảng tổng hợp nhiều tầng', onApply: done })
    });
    regBlk('th.mot', {
      scr: 'tonghop', title: 'Bảng một chiều', render: () => scr.render(),
      xlsx: () => downloadXlsx('Thống kê KHCN một chiều', { name: 'Bảng một chiều', rows: one.lines, head: 1 }),
      close: () => { setSpec(F1, {}); one.gb = 'khoa'; one.cm = 'whole'; setPref('mot.gb', 'khoa'); setPref('mot.cm', 'whole'); },
      reopen: done => D.stats && openFilter(F1, D.stats.arts, { title: 'Bảng một chiều', onApply: done })
    });
    bindChips(el);
    el.addEventListener('change', e => {
      const t = e.target;
      if (t.matches('[data-pre]')) { if (t.value === '') return; Object.assign(PV, clone(PRE[+t.value][1]), { tot: true }); if (!PRE[+t.value][1].ms) PV.ms = PV.ms.length ? PV.ms : ['n']; savePV(); scr.render(); }
      else if (t.matches('[data-dim]')) {
        const v = k => $('[data-dim="' + k + '"]', el).value, uq = a => a.filter((x, i) => x && a.indexOf(x) === i);
        PV.rows = uq([v('r0'), v('r1'), v('r2')]); if (!PV.rows.length) PV.rows = ['khoa'];
        PV.cols = uq([v('c0'), v('c1')]).filter(x => !PV.rows.includes(x)); savePV(); scr.render();
      } else if (t.matches('[data-yf], [data-yt]')) { PV.yF = +$('[data-yf]', el).value; PV.yT = +$('[data-yt]', el).value; savePV(); scr.render(); }
      else if (t.matches('[data-tpls]')) { const T = tplAll(); if (T[t.value]) { PV.tpl = t.value; PV.tc = clone(T[t.value]); savePV(); scr.render(); } }
      else if (t.matches('[data-one]')) { one[t.dataset.one] = t.value; setPref('mot.' + t.dataset.one, t.value); const b = $('[data-blk="th.mot"] .blk-b', el); b.innerHTML = oneHtml(); }
    });
    el.addEventListener('click', async e => {
      const t = e.target;
      if (t.closest('[data-range]')) return rangePop(t.closest('[data-range]'));
      if (t.closest('[data-reload]')) { const r = pref('range', null); return r ? load(r[0], r[1], false) : rangePop($('[data-range]', el)); }
      if (t.closest('[data-q0]')) { const v = +t.closest('[data-q0]').dataset.q0; return load('01/01/' + (v >= 2000 ? v : Y - v), '31/12/' + Y, false); }
      if (!D.stats) return;
      if (t.closest('[data-copy]')) return PVL.length ? copy(tsv(PVL), 'Đã sao chép ' + PVL.length + ' dòng. Mở Excel, bấm ô A1 rồi Ctrl+V.') : toast('Bảng tổng hợp đang đóng. Bấm Tạo bảng để tạo lại.', 'err');
      const fb = t.closest('[data-filter]');
      if (fb) return openFilter(filter(fb.dataset.filter), D.stats.arts, { title: fb.dataset.filter === 'mot' ? 'Bảng một chiều' : 'Bảng tổng hợp nhiều tầng' });
      if (t.closest('[data-tpl]')) return tplAct(t.closest('[data-tpl]').dataset.tpl);
      const ti = t.closest('[data-ti]');
      if (ti) {
        const i = +ti.dataset.i, k = ti.dataset.ti, C = PV.tc = (PV.tc || []).slice();
        if (k === 'x') C.splice(i, 1); else if (k === 'l') { if (!i) return; [C[i - 1], C[i]] = [C[i], C[i - 1]]; } else if (k === 'r') { if (i >= C.length - 1) return; [C[i + 1], C[i]] = [C[i], C[i + 1]]; }
        else if (k === 'ren') { const n = await ask({ title: 'Đổi tên mục', input: 'Tên mục', value: C[i].name, ok: 'Đổi tên' }); if (!n) return; C[i] = Object.assign({}, C[i], { name: n }); }
        return tplChanged();
      }
      if (t.closest('[data-ms]')) {
        const p = popover(t.closest('[data-ms]'), '<div>' + MS.map(m => '<label class="chk" style="display:flex"><input type="checkbox" value="' + m[0] + '"' + (PV.ms.includes(m[0]) ? ' checked' : '') + '>' + m[1] + '</label>').join('') + '</div>');
        p.el.addEventListener('change', () => { PV.ms = [...p.el.querySelectorAll('input:checked')].map(x => x.value); if (!PV.ms.length) PV.ms = ['n']; savePV(); renderPivot(); $('[data-ms] b', el).textContent = MS.filter(m => PV.ms.includes(m[0])).map(m => m[1]).join(', '); });
        return;
      }
      if (t.closest('[data-opt]')) {
        const p = popover(t.closest('[data-opt]'), '<div style="width:320px"><label class="chk" style="display:flex"><input type="checkbox" data-o="tot"' + (PV.tot ? ' checked' : '') + '>Thêm cột Tổng</label><label class="chk" style="display:flex"><input type="checkbox" data-o="hz"' + (PV.hz ? ' checked' : '') + '>Ẩn cột toàn số 0</label>' +
          '<div class="fl" style="margin-top:8px"><label for="o-cm">Cách tính khi chia theo khoa/bộ môn/cán bộ</label><select class="inp" id="o-cm" data-o="cm">' + CM.map(c => '<option value="' + c[0] + '"' + (PV.cm === c[0] ? ' selected' : '') + '>' + c[1] + '</option>').join('') + '</select></div>' +
          '<div class="fl"><label for="o-sort">Xếp dòng</label><select class="inp" id="o-sort" data-o="sort"><option value="name"' + (PV.sort === 'name' ? ' selected' : '') + '>Theo tên / thứ tự KHCN</option><option value="total"' + (PV.sort === 'total' ? ' selected' : '') + '>Nhiều bài trước</option></select></div></div>');
        p.el.addEventListener('change', e2 => { const o = e2.target.dataset.o; PV[o] = e2.target.type === 'checkbox' ? e2.target.checked : e2.target.value; savePV(); renderPivot(); });
        return;
      }
      const tg = t.closest('[data-t]');
      if (tg && LR) { const f = LR.flat[+tg.dataset.t]; if (CL.has(f.rk)) CL.delete(f.rk); else CL.add(f.rk); return renderPivot(false); }
      if (t.closest('[data-open-all]')) { CL = new Set(); return renderPivot(false); }
      if (t.closest('[data-fold]') && LR) { CL = new Set(LR.flat.filter(f => f.lvl === 0 && f.hk).map(f => f.rk)); return renderPivot(false); }
      const c = t.closest('td[data-c]'); if (c) openCell(c);
    });
    el.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('td[data-c]')) openCell(e.target); });
    /* mo lan dau: du lieu cu qua 1 gio thi tu cap nhat ngam */
    const r = pref('range', null);
    if (D.stats && r && Date.now() - D.stats.at > 3600e3) setTimeout(() => load(r[0], r[1], false), 300);
  },
  render() {
    const body = $('[data-body]', root), sub = $('[data-sub]', root);
    const errHtml = err ? '<div class="note err" role="alert">' + icon('alert') + '<div>' + esc(err) + '</div></div>' : '';
    if (!D.stats) {
      sub.textContent = 'Thống kê dữ liệu KHCN theo khoa, bộ môn, loại công bố, năm';
      body.innerHTML = errHtml + '<div class="card">' + empty('table', 'Chưa có dữ liệu thống kê', 'Chọn khoảng thời gian để tải dữ liệu từ KHCN. Lần đầu tải nhiều năm mất vài phút; dữ liệu được lưu lại trên máy cho lần sau.', '<div class="chips" style="justify-content:center">' + [['Năm nay', 0], ['3 năm gần nhất', 2], ['5 năm gần nhất', 4], ['Từ 2021 đến nay', 2021]].map(q => '<button class="btn" data-q0="' + q[1] + '">' + q[0] + '</button>').join('') + '</div>') + '</div>';
      return;
    }
    const S = D.stats;
    sub.textContent = S.arts.length.toLocaleString('vi-VN') + ' bài · ' + vnDate(S.f) + ' – ' + vnDate(S.t) + ' · dữ liệu lúc ' + fmtTime(S.at);
    const ys = [...new Set(S.arts.map(a => a.y).filter(Boolean))].sort((a, b) => a - b);
    const y0 = ys[0] || Y, y1 = ys[ys.length - 1] || y0;
    if (!PV.yF || PV.yF < y0 || PV.yF > y1) PV.yF = y0; if (!PV.yT || PV.yT > y1 || PV.yT < y0) PV.yT = y1;
    const useTpl = PV.rows.concat(PV.cols).includes('tpl');
    body.innerHTML = errHtml +
      blk('th.pivot', 'Bảng tổng hợp nhiều tầng', '<div class="toolbar">' + pivotTools(ys.length ? ys : [y0]) + '</div><div class="chipbar" data-chips></div><div class="pvinfo" data-pvinfo></div><div class="tw" data-pvout></div>',
        { tools: '<span class="muted small">Bấm vào số để xem danh sách bài</span>' }) +
      (useTpl ? blk('th.tpl', 'Mục tự chọn (mẫu)', tplHtml(), { fixed: true }) : '') +
      blk('th.mot', 'Bảng một chiều', oneHtml(), { def: true });
    if (!body.querySelector('[data-blk="th.pivot"], [data-blk="th.mot"]')) body.insertAdjacentHTML('beforeend', '<div class="card">' + empty('table', 'Các bảng đang đóng', 'Bấm “Tạo bảng” ở trên để tạo lại bảng, rồi chọn điều kiện lọc.', '') + '</div>');
    renderPivot();
  }
};
export default scr;

function renderPivot(recalc = true) {
  const out = $('[data-pvout]', root); if (!out || !D.stats) { PVL = []; PVX = null; return; }
  const ch = $('[data-chips]', root); const c = chipsHtml(FP); ch.innerHTML = c; ch.hidden = !c;
  if (recalc) pvCalc();
  const r = pvTable(); out.innerHTML = r.table; $('[data-pvinfo]', root).innerHTML = r.info;
}
function openCell(c) {
  if (!LR || !LR.cells) return;
  const fi = +c.dataset.r, cell = LR.cells[+c.dataset.c], f = fi >= 0 ? LR.flat[fi] : null, rk = f ? f.rk : '';
  const x = LR.M.get(rk + S2 + cell.lp.join(S1)); const list = x ? x.ids.map(i => LR.base[i]) : [];
  if (!list.length) return;
  drill((f ? f.p.join(' → ') : 'Toàn trường') + (cell.lp.length ? ' · ' + cell.lp.join(' · ') : ''), list);
}
