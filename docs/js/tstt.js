// Đẩy lên HEMIS · Tài sản trí tuệ (KHCN_GIAI_PHAP_SANG_CHE_DON_VI: sáng chế, giải pháp hữu ích).
// Hai nguồn ghép theo số bằng (chuẩn hoá: chỉ giữ chữ và số), Excel ưu tiên cho từng trường:
//  A. Excel SHTT của phòng (nhập từ máy, lưu IndexedDB 'tt.excel'): sheet Bang_DQSC (sáng chế), Bang_GPHI, Bang_sangche_QT (bằng quốc tế).
//  B. KHCN, Hoạt động khác: loại 4 (sáng chế), loại 6 (giải pháp hữu ích).
// Chỉ thêm và sửa; công cụ KHÔNG BAO GIỜ xoá tài sản trí tuệ trên HEMIS.
//
// GIẢ ĐỊNH VỀ HTML KHCN (chưa thử với dữ liệu thật):
//  - /KhoaHocKhac/ToanBoKhoaHocKhac?page=N&currentFilter=&loai=4|6&from=&target=&iprivate=false&tt=0&chutri=&diachi=null&khoa=&nopoint=null:
//    mỗi bản ghi là một <tr> có <td>, id lấy từ ShowDeTails('id') (hoặc hàm Show...( id ) khác) trong ondblclick/onclick/HTML của dòng.
//    Trang vượt quá cuối trả bảng không có dòng (hoặc lặp lại trang cuối). Phân trang không ổn định: quét 2 lượt (3 nếu còn id mới).
//  - POST /KhoaHocKhac/DetailsKhoaHocKhac (form id) trả các cặp <dt>/<dd>. Khoá dt so khớp theo norm(): Tên (tên sáng chế/giải pháp/bằng...),
//    Số bằng (hoặc Số văn bằng, Mã số, Số đăng ký), Số đơn, Ngày nộp đơn, Số QĐ (hoặc Số quyết định), Ngày cấp (dd/mm/yyyy), Năm cấp,
//    Chủ bằng (hoặc Chủ sở hữu), Tác giả, Nơi cấp. Thiếu trường nào thì để trống, không đoán.
//  - Không tải file bằng.
import { esc, norm, vnDate, pad, sleep, pool, DV, fmtTime } from './core.js';
import { downloadXlsx } from './xlsx.js';
import { readXlsx } from './docxlsx.js';
import { icon, pill, blk, tabsHtml, empty, ask, info, toast, regBlk } from './ui.js';
import * as B from './bridge.js';
import * as S from './store.js';
import { D, emit, loadHemis, HEMIS_BASE } from './data.js';
import { pref, setPref } from './store.js';

const ENT = 'KHCN_GIAI_PHAP_SANG_CHE_DON_VI', API = HEMIS_BASE + ENT, MAXR = 500, CY = new Date().getFullYear();
const LOAI = { '01': 'Sáng chế', '02': 'Giải pháp hữu ích' };
const FM = { so: 'sO_BANG', loai: 'loaI_GIAI_PHAP', ten: 'teN_GIAI_PHAP', don: 'sO_DON', ngayDon: 'ngaY_NOP_DON', qd: 'quyeT_DINH_CAP_BANG', ngay: 'ngaY_CAP', nam: 'naM_DUOC_CAP_BANG', chu: 'chU_BANG', tg: 'taC_GIA_SANG_CHE', noiCap: 'tO_CHUC_CAP_BANG' };
const FL = { so: 'Số bằng', loai: 'Loại', ten: 'Tên', don: 'Số đơn', ngayDon: 'Ngày nộp đơn', qd: 'Số QĐ', ngay: 'Ngày cấp', nam: 'Năm cấp', chu: 'Chủ bằng', tg: 'Tác giả', noiCap: 'Nơi cấp' };
const CMP = ['so', 'loai', 'ten', 'don', 'ngayDon', 'qd', 'ngay', 'nam', 'chu', 'tg', 'noiCap'];
const FIELDS = ['so', 'loai', 'ten', 'don', 'ngayDon', 'qd', 'ngay', 'nam', 'chu', 'dia', 'tg', 'noiCap'];
const TABS = { them: 'Thêm', sua: 'Sửa', boqua: 'Bỏ qua', khop: 'Đã khớp' };
const CUC = 'Cục Sở hữu trí tuệ';

let ctx = null, tab = 'them', yr = String(pref('tt.year', CY)), run = null, loaded = false, excel = null, memo = null;
const sel = new Map(), done = new Map();
const going = () => !!(run && run.on);
const inval = () => { memo = null; };
const txt = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
const lines = s => String(s == null ? '' : s).split(/\r?\n/).map(txt).filter(Boolean);
const d10 = v => String(v || '').slice(0, 10);
const isoAll = s => [...String(s || '').matchAll(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g)].map(m => m[3] + '-' + pad(m[2]) + '-' + pad(m[1]));
const netErr = e => !B.isLogin(e) && /fetch|network|ERR_|kết nối|timeout/i.test(String(e && e.message));
/* lệnh HEMIS/KHCN: lỗi mạng thì thử lại 1 lần sau 2 giây */
const retry = async fn => { try { return await fn(); } catch (e) { if (!netErr(e)) throw e; await sleep(2000); return fn(); } };
const hem = (m, p, d) => retry(() => B.hemis(m, p, d));
const busyT = txt => { if (txt) D.busy.detai = txt; else delete D.busy.detai; emit('busy', 'detai'); };   // dùng chung dòng "đang làm" với Đề tài
const validSo = s => { const t = txt(s); return /\d/.test(t) && norm(t).length >= 3 && !/đơn|ký số|chưa (có|cấp)/i.test(t); };
const isTlu = s => /dhtl|thuyloi|truongdaihocthuyloi/.test(norm(s)) || /\btlu\b/i.test(String(s));
const NOT_PATENT = /(^|[^\p{L}])(bản quyền|quyền tác giả|tác phẩm|chương trình máy tính|giáo trình|sách|chuyên khảo|nhãn hiệu)(?![\p{L}])/iu;

/* ================= Nguồn A: Excel SHTT ================= */
/* Ô ngày kiểu Excel có ngày <= 12 đã bị đảo ngày/tháng: ngày thật = tháng ghi trong ô, tháng thật = ngày. Ô chữ dd/mm/yyyy đọc đúng như chữ. */
const dateOf = c => {
  if (!c) return { iso: '' };
  if (c.t === 'd') return c.d <= 12 && c.d !== c.m ? { iso: c.y + '-' + pad(c.d) + '-' + pad(c.m), swapped: true } : { iso: c.v };
  const s = String(c.v), m = s.match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})/), m2 = s.match(/^\d{4}-\d{2}-\d{2}/);
  return { iso: m ? m[3] + '-' + pad(m[2]) + '-' + pad(m[1]) : m2 ? m2[0] : '' };
};
const SKIP_SHEET = /^(tk|thongke|chapnhan|don|copyright|banquyen|sohuu)/;
function parseSheets(sheets) {
  const rows = [], list = [], ignored = []; let nSwap = 0;
  for (const sh of sheets) {
    const nm = norm(sh.name); let hi = -1, hdr = null;
    if (!SKIP_SHEET.test(nm)) for (let i = 0; i < Math.min(12, sh.rows.length); i++) {
      const h = (sh.rows[i] || []).map(c => c ? norm(c.v) : '');
      if (h.includes('sobang') || (h.includes('maso') && h.some(x => /^tensangche/.test(x)))) { hi = i; hdr = h; break; }
    }
    if (hi < 0) { ignored.push(sh.name); continue; }
    const qt = !hdr.includes('sobang'), kind = qt ? 'qt' : /gphi|giaiphap|huuich/.test(nm) ? 'gp' : 'sc', n0 = rows.length;
    const col = (...res) => { for (const re of res) { const i = hdr.findIndex(x => re.test(x)); if (i >= 0) return i; } return -1; };
    const C = { so: col(/^sobang$/, /^maso$/), don: col(/^sodon$/), ngayDon: col(/^ngaynopdon/), qd: col(/^soqd/, /^soquyetdinh/), ngay: col(/^ngaycap/), nam: col(/^namcap/), ten: col(/^ten(?!tacgia)/), chu: col(/^chubang/), dia: col(/^diachi/), tg: col(/^tacgia/), noiCap: col(/^noicap/) };
    for (let r = hi + 1; r < sh.rows.length; r++) {
      const cells = sh.rows[r] || [], get = i => i >= 0 && cells[i] ? cells[i] : null, str = i => { const c = get(i); return !c ? '' : c.t === 'd' ? vnDate(c.v) : String(c.v); };
      let so = txt(str(C.so)), ngayQt = '';
      if (qt) { const raw = str(C.so); so = txt((raw.match(/m[ãa]\s*s[ốo]\s*:?\s*([^\n]+)/i) || [])[1] || lines(raw)[0] || ''); ngayQt = (raw.match(/cấp ngày\s*(\d{1,2}\/\d{1,2}\/\d{4})/i) || [])[1] || ''; }
      const ten = txt(str(C.ten)); if (!so && !ten) continue;
      const warn = [], nd = qt ? { iso: isoAll(ngayQt)[0] || '' } : dateOf(get(C.ngay)), dd = dateOf(get(C.ngayDon)), nam = +(str(C.nam).match(/\d{4}/) || [])[0] || 0;
      if (nd.swapped || dd.swapped) { warn.push('Đã đổi lại ngày/tháng, kiểm tra'); nSwap++; }
      if (nd.iso && nam && +nd.iso.slice(0, 4) !== nam) warn.push('Năm cấp lệch: ngày cấp ' + nd.iso.slice(0, 4) + ', cột Năm cấp ' + nam);
      rows.push({ src: 'Excel', kind, qt, loai: kind === 'gp' ? '02' : '01', so, don: txt(str(C.don)), ngayDon: dd.iso, qd: txt(str(C.qd)), ngay: nd.iso, nam: nam || (nd.iso ? +nd.iso.slice(0, 4) : 0), ten,
        chu: lines(str(C.chu)).join('\n'), dia: txt(str(C.dia)), tg: lines(str(C.tg)).join(', '), noiCap: txt(str(C.noiCap)), warn, sheet: sh.name, row: r + 1 });
    }
    list.push({ name: sh.name, kind, n: rows.length - n0 });
  }
  return { rows, list, ignored, nSwap };
}
async function nhapExcel(file) {
  let sh; try { sh = await readXlsx(file); } catch (x) { toast('Không đọc được file Excel: ' + x.message, 'err'); return; }
  const p = parseSheets(sh);
  if (!p.list.length) { toast('Không thấy trang Bang_DQSC, Bang_GPHI hay Bang_sangche_QT (cần dòng tiêu đề có chữ "Số bằng" hoặc "Mã số").', 'err'); return; }
  excel = { name: file.name, at: Date.now(), rows: p.rows, sheets: p.list, ignored: p.ignored, nSwap: p.nSwap };
  await S.set('tt.excel', excel); inval(); done.clear(); sel.clear(); tab = 'them';
  toast('Đã đọc ' + p.rows.length + ' dòng từ ' + p.list.length + ' trang' + (p.nSwap ? '; đã đổi lại ngày/tháng ở ' + p.nSwap + ' dòng, xem cột Lưu ý' : '') + '.', p.nSwap ? 'err' : undefined);
  ctx.render();
}

/* ================= Nguồn B: quét KHCN ================= */
const listUrl = (loai, p) => '/KhoaHocKhac/ToanBoKhoaHocKhac?page=' + p + '&currentFilter=&loai=' + loai + '&from=&target=&iprivate=false&tt=0&chutri=&diachi=null&khoa=&nopoint=null';
const parseRows = doc => [...doc.querySelectorAll('tr')].filter(tr => tr.querySelector('td')).map(tr => {
  const h = (tr.getAttribute('ondblclick') || '') + (tr.getAttribute('onclick') || '') + tr.innerHTML;
  const m = h.match(/Show\w*\(\s*['"]?(\d+)/) || (tr.getAttribute('data-id') || '').match(/(\d+)/);
  return m ? m[1] : null;
}).filter(Boolean);
async function scanLoai(loai, seen) {
  let prev = '';
  for (let p = 1; p <= 80; p++) {
    const ids = parseRows(await retry(() => B.khcn(listUrl(loai, p)))), sig = ids.join(',');
    if (!ids.length || sig === prev) break;
    prev = sig; ids.forEach(id => seen.set(id, loai));
  }
}
const parseDetail = (doc, loai) => {
  const dd = {}; doc.querySelectorAll('dt').forEach(dt => { const v = dt.nextElementSibling; if (v && v.tagName === 'DD') dd[norm(dt.textContent)] = v.textContent.replace(/\s+/g, ' ').trim(); });
  const g = (...res) => { for (const re of res) { const k = Object.keys(dd).find(x => re.test(x)); if (k) return dd[k]; } return ''; };
  const ngay = isoAll(g(/^ngaycap/))[0] || '', nam = +(g(/^namcap/).match(/\d{4}/) || [])[0] || (ngay ? +ngay.slice(0, 4) : 0);
  return { src: 'KHCN', qt: false, loai: loai === 6 ? '02' : '01', so: g(/^sobang/, /^sovanbang/, /^maso/, /^sodangky/), ten: g(/^ten(sangche|giaiphap|bang|khoahoc|cong|hoatdong)/, /^ten$/, /^ten/), don: g(/^sodon/), ngayDon: isoAll(g(/^ngaynop/))[0] || '',
    qd: g(/^soqd/, /^soquyetdinh/), ngay, nam, chu: g(/^chubang/, /^chusohuu/), dia: '', tg: g(/^tacgia/, /^nhomtacgia/), noiCap: g(/^noicap/, /^coquancap/, /^tochuccap/), warn: [] };
};
async function quet() {
  if (D.busy.detai) return;
  const seen = new Map(); let fresh = 0;
  try {
    for (let pass = 1; pass <= 3; pass++) {
      const before = seen.size;
      for (const l of [4, 6]) { await scanLoai(l, seen); busyT('Đang quét tài sản trí tuệ KHCN, lượt ' + pass + ': ' + seen.size + ' bản ghi…'); }
      fresh = seen.size - before;
      if (pass >= 2 && !fresh) break;
    }
    const ids = [...seen.entries()]; let k = 0, bad = 0; const rows = [];
    await pool(ids, 4, async ([id, loai]) => {
      try { const r = parseDetail(await retry(() => B.khcn('/KhoaHocKhac/DetailsKhoaHocKhac', { id })), loai); if (r.ten || r.so) { r.id = id; rows.push(r); } else bad++; } catch (e) { if (B.isLogin(e)) throw e; bad++; }
      busyT('Đang đọc chi tiết tài sản trí tuệ: ' + (++k) + '/' + ids.length + '…');
    });
    D.tstt = { at: Date.now(), rows: rows.sort((a, b) => a.id - b.id) };
    await S.set('data.tstt', D.tstt); inval(); done.clear();
    toast('Quét xong: ' + rows.length + ' bản ghi tài sản trí tuệ' + (bad ? ', ' + bad + ' bản ghi không đọc được' : '') + '.', bad ? 'err' : undefined);
    if (fresh) toast('Lượt quét cuối vẫn còn bản ghi mới, có thể còn sót. Nên bấm Quét lại.', 'err');
  } catch (x) { ctx.fail(x); } finally { busyT(); ctx.render(); }
}

/* ================= Ghép dữ liệu ================= */
function merged() {
  const ex = excel ? excel.rows : [], kh = D.tstt ? D.tstt.rows : [], both = !!(excel && D.tstt), groups = new Map(), list = [];
  [...ex, ...kh].forEach(r => {
    const k = validSo(r.so) ? norm(r.so) : '';
    if (!k) { list.push({ k: '', parts: [r] }); return; }
    let x = groups.get(k); if (!x) { x = { k, parts: [] }; groups.set(k, x); list.push(x); }
    x.parts.push(r);
  });
  const items = list.map((x, i) => {
    const it = { k: x.k || 'x' + i, key: x.k, parts: x.parts, warn: [], skip: '', noTick: false };
    FIELDS.forEach(f => { const p = x.parts.find(q => q[f]); it[f] = p ? p[f] : (f === 'nam' ? 0 : ''); });
    it.qt = x.parts.some(p => p.qt); it.src = [...new Set(x.parts.map(p => p.src))].join(' + ');
    if (!it.noiCap && !it.qt && /^\d+$/.test(norm(it.so))) it.noiCap = CUC;
    x.parts.forEach(p => p.warn.forEach(w => { if (!it.warn.includes(w)) it.warn.push(w); }));
    const e = x.parts.find(p => p.src === 'Excel'), h = x.parts.find(p => p.src === 'KHCN');
    if (e && h && e.ngay && h.ngay && e.ngay !== h.ngay) it.warn.push('Ngày cấp khác nhau: Excel ' + vnDate(e.ngay) + ', KHCN ' + vnDate(h.ngay));
    if (both && x.key && !(e && h)) it.warn.push(e ? 'Có trong Excel, KHCN chưa có' : 'Có ở KHCN, không có trong Excel');
    if (!it.skip) {
      const dh = /đơn|ký số/i.test(it.so);
      if (!x.key) it.skip = dh ? 'Đơn chưa thành bằng (chưa có số bằng)' : h && !e ? 'Chưa có số bằng. KHCN có thể nhập nhầm loại' : 'Chưa có số bằng';
      else if (!e && NOT_PATENT.test(it.ten + ' ' + it.so)) it.skip = 'Tên cho thấy không phải bằng. KHCN có thể nhập nhầm loại';
    }
    return it;
  });
  /* tên trùng với bằng khác (cùng tên chuẩn hoá, khác số bằng) */
  const byTen = new Map(); items.forEach(it => { const t = norm(it.ten); if (t.length > 5 && it.key) (byTen.get(t) || byTen.set(t, []).get(t)).push(it); });
  byTen.forEach(L => { if (L.length > 1) L.forEach(it => it.warn.push('Tên trùng với bằng ' + L.filter(o => o !== it).slice(0, 2).map(o => o.so).join(', '))); });
  items.forEach(it => {
    if (it.skip) return;
    if (!it.ten) it.warn.push('Thiếu tên');
    if (!it.ngay) it.warn.push('Thiếu ngày cấp');
    const own = it.chu + ' ' + it.dia;
    if (txt(own)) { if (!isTlu(own)) { it.warn.push('Chủ bằng không phải TLU'); it.noTick = true; } } else if (!it.qt) it.warn.push('Thiếu chủ bằng');
    if (lines(it.chu).length >= 2 && !it.tg && !lines(it.chu).some(isTlu)) it.warn.push('Cột Chủ bằng có nhiều tên người mà cột Tác giả trống, có thể lệch cột');
  });
  return items;
}
const cur = h => ({ so: h.sO_BANG, loai: h.loaI_GIAI_PHAP, ten: h.teN_GIAI_PHAP, don: h.sO_DON, ngayDon: d10(h.ngaY_NOP_DON), qd: h.quyeT_DINH_CAP_BANG, ngay: d10(h.ngaY_CAP), nam: h.naM_DUOC_CAP_BANG, chu: h.chU_BANG, tg: h.taC_GIA_SANG_CHE, noiCap: h.tO_CHUC_CAP_BANG });
const same = (f, a, b) => { a = a == null ? '' : a; b = b == null ? '' : b; return ['so', 'ten', 'chu', 'tg', 'noiCap'].includes(f) ? norm(a) === norm(b) : String(a).trim() === String(b).trim(); };
const shown = (f, v) => f === 'loai' ? (LOAI[v] || v) : f === 'ngay' || f === 'ngayDon' ? vnDate(v) : String(v == null ? '' : v);
const compute = () => {
  const H = D.hemis && D.hemis.sc; if (!H) return null;
  if (memo && memo.h === H && memo.y === yr) return memo.C;
  const byMa = new Map(), bySo = new Map(), used = new Set(), rows = [], Y = +yr;
  H.forEach(h => { const a = norm(h.mA_GIAI_PHAP), b = norm(h.sO_BANG); if (a && !byMa.has(a)) byMa.set(a, h); if (b && !bySo.has(b)) bySo.set(b, h); });
  const items = merged(); let n = 0;
  items.forEach(it => {
    if (!it.skip && !it.nam) it.skip = 'Thiếu năm cấp';
    if (!it.skip && it.nam !== Y) it.skip = 'Ngoài năm ' + yr + ' (cấp năm ' + it.nam + ')';
    if (it.skip) { rows.push({ k: 'b:' + it.k, act: 'boqua', it, why: it.skip }); return; }
    n++;
    const h = byMa.get(it.key) || bySo.get(it.key);
    if (!h) { rows.push({ k: 'a:' + it.k, act: 'them', it }); return; }
    if (used.has(h.id)) return; used.add(h.id);
    const c = cur(h), diffs = CMP.filter(f => it[f] !== '' && it[f] != null && it[f] !== 0 && !same(f, c[f], it[f]));
    rows.push(diffs.length ? { k: 's:' + h.id, act: 'sua', it, h, diffs, c } : { k: 'h:' + h.id, act: 'khop', it, h });
  });
  rows.sort((a, b) => String(a.it.ngay).localeCompare(String(b.it.ngay)) || String(a.it.so).localeCompare(String(b.it.so)));
  const C = { rows, n, nSc: rows.filter(r => r.act !== 'boqua' && r.it.loai === '01').length, nGp: rows.filter(r => r.act !== 'boqua' && r.it.loai === '02').length, nHemis: H.filter(h => +h.naM_DUOC_CAP_BANG === Y).length };
  memo = { h: H, y: yr, C }; return C;
};
const canTick = r => (r.act === 'them' || r.act === 'sua') && !!r.it.ten && !(done.get(r.k) && done.get(r.k).ok);
const isOn = r => canTick(r) && (sel.has(r.k) ? sel.get(r.k) : !r.it.noTick);
const rec = it => ({ id: crypto.randomUUID(), doN_VI_ID: DV, mA_GIAI_PHAP: txt(it.so), loaI_GIAI_PHAP: it.loai, teN_GIAI_PHAP: it.ten, sO_BANG: txt(it.so), sO_DON: it.don, ngaY_NOP_DON: it.ngayDon ? it.ngayDon + 'T00:00:00' : null, quyeT_DINH_CAP_BANG: it.qd,
  ngaY_CAP: it.ngay ? it.ngay + 'T00:00:00' : null, naM_DUOC_CAP_BANG: it.nam, chU_BANG: it.chu, taC_GIA_SANG_CHE: it.tg, tO_CHUC_CAP_BANG: it.noiCap, isBuildIn: false, isBuildInAll: false });
const val = (f, v) => f === 'ngay' || f === 'ngayDon' ? v + 'T00:00:00' : f === 'so' ? txt(v) : v;

/* ================= Bảng ================= */
const tab_ = C => C.rows.filter(r => r.act === tab);
const pills = (it, extra) => (extra || '') + (it.warn || []).map(w => pill(/^Thiếu tên$/.test(w) ? 'err' : 'warn', w)).join('');
const resCell = r => { const d = done.get(r.k); return d ? (d.ok ? pill('ok', 'Đã xong') : pill('err', d.err)) : ''; };
const ck = r => '<td class="ck"><input type="checkbox" data-ck="' + esc(r.k) + '" aria-label="Chọn"' + (isOn(r) ? ' checked' : '') + (!canTick(r) || going() ? ' disabled' : '') + '></td>';
const nameCell = it => '<td class="t"><b>' + esc(it.ten || '(không có tên)') + '</b><div class="muted">' + esc('Chủ bằng: ' + (lines(it.chu).join(', ') || '—') + ' · Tác giả: ' + (it.tg || '—')) + '</div></td>';
const rowHtml = r => {
  const it = r.it, so = '<td class="nowrap">' + esc(it.so || '—') + '</td>', nm = nameCell(it), lo = '<td>' + pill('info', LOAI[it.loai] || it.loai, undefined) + '</td>';
  if (r.act === 'boqua') return '<tr data-k="' + esc(r.k) + '">' + so + nm + '<td class="nowrap">' + esc(it.src) + '</td><td>' + pill('mut', r.why, 'info') + '</td></tr>';
  if (r.act === 'sua') return '<tr data-k="' + esc(r.k) + '">' + ck(r) + so + nm + '<td>' + r.diffs.map(f => '<div><span class="muted">' + FL[f] + ':</span> <span class="was">' + esc(shown(f, r.c[f]) || '(trống)') + '</span> ' + icon('right') + ' <span class="will">' + esc(shown(f, it[f])) + '</span></div>').join('') + '</td><td class="nowrap">' + esc(it.src) + '</td><td>' + pills(it, resCell(r)) + '</td></tr>';
  return '<tr data-k="' + esc(r.k) + '">' + (r.act === 'them' ? ck(r) : '') + so + nm + lo + '<td class="nowrap">' + vnDate(it.ngay) + '</td><td class="nowrap">' + esc(it.src) + '</td><td>' + pills(it, resCell(r)) + '</td></tr>';
};
const HEAD = { them: ['', 'Số bằng', 'Giải pháp', 'Loại', 'Ngày cấp', 'Nguồn', 'Lưu ý'], sua: ['', 'Số bằng', 'Giải pháp', 'Thay đổi', 'Nguồn', 'Lưu ý'], boqua: ['Số bằng', 'Giải pháp', 'Nguồn', 'Lý do'], khop: ['Số bằng', 'Giải pháp', 'Loại', 'Ngày cấp', 'Nguồn', 'Lưu ý'] };
const table = C => {
  const L = tab_(C), H = HEAD[tab];
  const th = H.map((t, i) => i === 0 && t === '' ? '<th class="ck"><input type="checkbox" data-all aria-label="Chọn tất cả"' + (L.some(r => canTick(r) && !isOn(r)) ? '' : ' checked') + (going() ? ' disabled' : '') + '></th>' : '<th' + (t === 'Giải pháp' ? ' style="width:40%"' : '') + '>' + t + '</th>').join('');
  return '<div class="tw"><table class="tbl"><thead><tr>' + th + '</tr></thead><tbody>' + (L.length ? L.slice(0, MAXR).map(rowHtml).join('') : '<tr><td colspan="' + H.length + '">' + empty('check', 'Không có mục nào', '') + '</td></tr>') + '</tbody></table></div>' +
    (L.length > MAXR ? '<div class="more">Đang hiện ' + MAXR + '/' + L.length + '. Mục được tick đều sẽ chạy. Bấm biểu tượng Excel để xem đủ.</div>' : '') +
    (tab === 'them' ? '<div class="more">Mục có lưu ý “Chủ bằng không phải TLU” không tick sẵn. Công cụ không xoá tài sản trí tuệ trên HEMIS.</div>' : '');
};
const nguonHtml = () => '<div class="card-b">' + (excel ? '<div>Excel SHTT: <b>' + esc(excel.name) + '</b>, nhập lúc ' + fmtTime(excel.at) + '. Đã đọc ' + excel.sheets.map(s => esc(s.name) + ' (' + s.n + ')').join(', ') + (excel.ignored.length ? '. Bỏ qua: ' + excel.ignored.map(esc).join(', ') : '') + '. <button class="lnk" data-tt-rm>Bỏ file đã nhập</button></div>' : '<div class="muted">Chưa nhập file Excel SHTT. File lưu trên máy này, lần sau mở lại vẫn còn.</div>') +
  '<div style="margin-top:6px">KHCN: ' + (D.tstt ? D.tstt.rows.length + ' bản ghi, quét lúc ' + fmtTime(D.tstt.at) : '<span class="muted">chưa quét, bấm Quét lại</span>') + '</div></div>';

/* ================= Xuất Excel ================= */
const xHead = ['Số bằng', 'Tên', 'Loại', 'Chủ bằng', 'Tác giả', 'Số đơn', 'Ngày nộp đơn', 'Số QĐ', 'Ngày cấp', 'Năm cấp', 'Nơi cấp', 'Nguồn', 'Thay đổi / lý do / lưu ý'];
const xRow = r => { const it = r.it; return [it.so, it.ten, LOAI[it.loai] || it.loai, lines(it.chu).join(', '), it.tg, it.don, vnDate(it.ngayDon), it.qd, vnDate(it.ngay), it.nam || '', it.noiCap, it.src,
  r.act === 'sua' ? r.diffs.map(f => FL[f] + ': ' + shown(f, r.c[f]) + ' -> ' + shown(f, it[f])).join('; ') : r.act === 'boqua' ? r.why : it.warn.join('; ')]; };
const xBang = () => { const C = compute(); if (C) downloadXlsx('Đẩy HEMIS tài sản trí tuệ ' + yr + ' ' + TABS[tab], { name: TABS[tab], head: 1, freezeCols: 1, rows: [xHead].concat(tab_(C).map(xRow)) }); };

/* ================= Chạy ================= */
async function runAll() {
  if (going()) return;
  const C0 = compute(); if (!C0) return;
  const keys = new Set(C0.rows.filter(isOn).map(r => r.k)), n = keys.size; if (!n) return;
  const c0 = a => C0.rows.filter(r => keys.has(r.k) && r.act === a).length;
  if (!await ask({ title: 'Chạy ' + n + ' thay đổi trên HEMIS?', text: 'Thêm ' + c0('them') + ' tài sản trí tuệ, sửa ' + c0('sua') + '. Không có xoá.\nTrước khi chạy, công cụ lấy lại danh sách trên HEMIS.', ok: 'Chạy ' + n + ' thay đổi', cancel: 'Chưa chạy' })) return;
  run = { on: true, ok: 0, bad: 0, total: n, msg: 'Đang kiểm tra lại HEMIS…' }; ctx.render();
  let stop = null;
  try { while (D.busy.hemis) await sleep(300); await loadHemis(); inval(); } catch (x) { run = null; ctx.render(); ctx.fail(x); return; }
  const C1 = compute(), rows = C1 ? C1.rows.filter(r => keys.has(r.k) && (r.act === 'them' || r.act === 'sua')) : [];
  run.total = rows.length;
  for (const r of rows) {
    try {
      if (r.act === 'them') await hem('POST', API, rec(r.it));
      else { const g = await hem('GET', API + '/DetailWithPermission/' + r.h.id + '?pid=00000000-0000-0000-0000-000000000000'), d = g.data; if (!d) throw new Error('Không đọc được bản ghi trên HEMIS'); r.diffs.forEach(f => { d[FM[f]] = val(f, r.it[f]); }); await hem('PUT', API + '/' + r.h.id, d); }
      done.set(r.k, { ok: true }); run.ok++;
    } catch (e) { done.set(r.k, { err: e.message }); run.bad++; if (B.isLogin(e)) stop = e; }
    run.msg = 'Đã chạy ' + (run.ok + run.bad) + '/' + run.total; ctx.syncFoot();
    if (stop) break; await sleep(150);
  }
  run.on = false; run.msg = (stop ? 'Dừng giữa chừng: ' : 'Xong: ') + 'thành công ' + run.ok + ', lỗi ' + run.bad;
  if (!stop) { try { await loadHemis(); } catch (e) { /* bấm Tải lại */ } }
  inval(); ctx.render();
  if (stop) await info('Dừng vì hết phiên đăng nhập', stop.message + '\nĐã chạy được ' + run.ok + ' thay đổi. Đăng nhập lại rồi bấm Chạy tiếp.');
  else toast('Xong ' + run.ok + ' thay đổi' + (run.bad ? ', ' + run.bad + ' lỗi' : '') + '.', run.bad ? 'err' : undefined);
}

/* ================= Giao diện: một loại dữ liệu trong màn "Đẩy lên HEMIS" ================= */
const nPend = C => C ? C.rows.filter(canTick).length : 0;
export default {
  id: 'tstt', title: 'Tài sản trí tuệ', on: ['hemis', 'settings'], busy: ['hemis', 'detai'],
  badge: () => nPend(compute()),
  acts: () => '<label class="sel">Năm cấp bằng <select data-tt-yr aria-label="Năm cấp bằng">' + [CY + 1, CY, CY - 1, CY - 2].map(y => '<option' + (String(y) === yr ? ' selected' : '') + '>' + y + '</option>').join('') + '</select></label><button class="btn" data-tt-scan>' + icon('refresh') + 'Quét lại</button>',
  sub() {
    const C = compute(); if (!C) return 'Tài sản trí tuệ · đang so với HEMIS';
    if (!excel && !D.tstt) return 'Tài sản trí tuệ · chưa có nguồn: bấm Quét lại (KHCN) hoặc Nhập Excel SHTT';
    return 'Tài sản trí tuệ cấp bằng năm ' + yr + ': ' + C.n + ' bằng (' + C.nSc + ' sáng chế, ' + C.nGp + ' giải pháp hữu ích) · HEMIS có ' + C.nHemis;
  },
  init(c) {
    ctx = c;
    regBlk('tt.bang', { scr: 'day.tstt', title: 'Tài sản trí tuệ', render: c.render, xlsx: xBang, close: () => { tab = 'them'; sel.clear(); } });
    regBlk('tt.nguon', { scr: 'day.tstt', title: 'Nguồn dữ liệu', kind: 'info', render: c.render });
    Promise.all([S.get('tt.excel'), S.get('data.tstt')]).then(([e, k]) => { excel = e || null; if (!D.tstt && k) D.tstt = k; loaded = true; inval(); c.render(); });
  },
  async onClick(e) {
    const t = e.target.closest('[data-tab]'); if (t) { tab = t.dataset.tab; ctx.render(); return; }
    if (e.target.closest('[data-tt-scan]')) { quet(); return; }
    if (e.target.closest('[data-run]')) { runAll(); return; }
    if (e.target.closest('[data-reload]')) { await ctx.reload(); return; }
    if (e.target.closest('[data-tt-pick]')) { const f = ctx.root.querySelector('[data-tt-file]'); if (f) f.click(); return; }
    if (e.target.closest('[data-tt-rm]')) {
      if (!await ask({ title: 'Bỏ file Excel đã nhập?', text: 'Chỉ bỏ bản đã đọc lưu trên máy này, không xoá gì trên HEMIS.', ok: 'Bỏ', cancel: 'Giữ lại' })) return;
      excel = null; await S.del('tt.excel'); inval(); ctx.render();
    }
  },
  async onChange(e) {
    const f = e.target.closest('[data-tt-file]'); if (f) { const file = f.files && f.files[0]; f.value = ''; if (file) await nhapExcel(file); return; }
    const y = e.target.closest('[data-tt-yr]'); if (y) { yr = y.value; setPref('tt.year', +yr); sel.clear(); inval(); ctx.render(); return; }
    const c = e.target.closest('[data-ck]'), a = e.target.closest('[data-all]'), C = compute(); if (!C) return;
    if (c) sel.set(c.dataset.ck, c.checked); else if (a) tab_(C).forEach(r => { if (canTick(r)) sel.set(r.k, a.checked); }); else return;
    if (a) ctx.root.querySelectorAll('[data-ck]:not(:disabled)').forEach(x => { x.checked = a.checked; });
    ctx.syncFoot();
  },
  render(body) {
    if (!loaded) { body.innerHTML = ''; return; }
    const C = compute();
    let h = '';
    if (!C) h += '<div class="card">' + empty('refresh', D.busy.hemis ? 'Đang lấy tài sản trí tuệ trên HEMIS…' : 'Chưa có dữ liệu tài sản trí tuệ từ HEMIS', 'Anh/chị cần đăng nhập HEMIS trên Chrome.', D.busy.hemis ? '' : '<button class="btn pri" data-reload>' + icon('refresh') + 'Lấy từ HEMIS</button>') + '</div>';
    else {
      const c = a => C.rows.filter(r => r.act === a).length;
      h += blk('tt.bang', 'Tài sản trí tuệ', table(C), { headHtml: tabsHtml(Object.keys(TABS).map(k => [k, TABS[k] + ' (' + c(k) + ')']), tab) });
    }
    h += blk('tt.nguon', 'Nguồn dữ liệu', nguonHtml(), { fixed: true, def: true, head: '<span class="muted small" style="margin-left:8px">KHCN: ' + (D.tstt ? D.tstt.rows.length + ' bản ghi (sáng chế, GPHI) quét lúc ' + fmtTime(D.tstt.at) : 'chưa quét') + ' · Excel SHTT: ' + (excel ? esc(excel.name) + ', ' + excel.rows.length + ' dòng' : 'chưa nhập') + '</span>',
      tools: '<button class="btn sm" data-tt-pick>' + icon('plus') + 'Nhập Excel SHTT</button><input type="file" hidden data-tt-file accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" aria-label="Chọn file Excel SHTT">' });
    body.innerHTML = h;
    const xb = body.querySelector('[data-close="tt.bang"]'); if (xb && going()) xb.disabled = true;
    const sc = ctx.root.querySelector('[data-tt-scan]'); if (sc) sc.disabled = !!D.busy.detai;
  },
  foot() {
    const C = compute(); if (!C) return '';
    const on = C.rows.filter(isOn), a = on.filter(r => r.act === 'them').length, s = on.filter(r => r.act === 'sua').length, n = a + s, g = going(), pct = run && run.total ? Math.round((run.ok + run.bad) / run.total * 100) : 0;
    return '<span><b>' + n + ' thay đổi</b> đã chọn <span class="muted">· thêm ' + a + ' · sửa ' + s + '</span></span>' + (run ? '<span class="muted">· ' + esc(run.msg) + '</span>' : '') + '<div class="sp"></div>' +
      (run ? '<div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><span class="' + (!g && run.bad ? 'err' : !g ? 'ok' : '') + '" style="width:' + Math.max(pct, g ? 1 : 0) + '%"></span></div>' : '') +
      '<button class="btn pri" data-run' + (!n || g ? ' disabled' : '') + '>' + icon('up') + (g ? 'Đang chạy…' : 'Chạy ' + n + ' thay đổi trên HEMIS') + '</button>';
  }
};
