// Đẩy lên HEMIS · Đề tài (KHCN_NHIEM_VU_KHCN): quét đề tài các cấp trên KHCN, cộng đề tài cơ sở nhập từ QĐ giao và nhập tay,
// so với HEMIS rồi hiện tab Thêm / Sửa / Xoá / Đã khớp. Ghi lên HEMIS chỉ chạy sau khi xác nhận; xoá thì sao lưu JSON trước.
//
// GIẢ ĐỊNH VỀ HTML KHCN (chưa thử với dữ liệu thật):
//  - /Home/ToanBoDeTai?...&cap={mã}: mỗi đề tài là một <tr> có <td>; id lấy từ ShowDeTails('id') trong ondblclick/onclick/HTML của dòng
//    (hoặc data-id); "Đã phê duyệt" nằm ngay trong chữ của dòng. Trang vượt quá cuối trả bảng không có dòng (hoặc lặp lại trang cuối).
//  - /Home/DetailsDeTai (form id) trả các cặp <dt>/<dd>: Tên đề tài, Mã số, Tổng kinh phí, Thời gian bắt đầu/kết thúc (một hoặc hai ngày
//    dd/mm/yyyy), Trạng thái (có "Đã nghiệm thu: dd/mm/yyyy" khi đã nghiệm thu), Đơn vị chủ trì, Chủ nhiệm. Khoá dt so khớp theo norm().
//  - Thứ tự dòng trong /Home/ToanBoDeTai đổi giữa các lần tải: quét từng cấp 2 lượt (lượt 3 nếu lượt 2 còn id mới), gộp theo id.
//
// ĐỊNH DẠNG NHẬP DANH SÁCH (JSON): { "tay": [ { "ma", "ten", "cn", "cap":"02", "quan":"11", "bd":"dd/mm/yyyy", "kt":"dd/mm/yyyy",
//   "kp":số, "nguon":"01", "tt":"04", "lv":"02", "loai":"02", "tam":true|false } ], "loaitru": [ "mã đề tài", ... ] }
import { esc, norm, vnDate, toISO, nf, pad, sleep, pool, DV, fmtTime } from './core.js';
import { downloadXlsx } from './xlsx.js';
import { icon, pill, blk, tabsHtml, empty, ask, info, toast, regBlk, drawer, closeDrawer, popover } from './ui.js';
import * as B from './bridge.js';
import * as S from './store.js';
import { D, emit, loadNv, HEMIS_BASE } from './data.js';
import { pref, setPref } from './store.js';

const API = HEMIS_BASE + 'KHCN_NHIEM_VU_KHCN', MAXR = 500, TODAY = new Date().toISOString().slice(0, 10), CY = new Date().getFullYear();
const CAP = { '01': 'Quốc gia', '02': 'Bộ', '03': 'Tỉnh/TP', '04': 'Cơ sở', '05': 'Khác' };
const TT = { '01': 'Hoàn thành', '02': 'Đã NT cơ sở, gửi Bộ', '03': 'Đang hoàn thiện NT', '04': 'Đang thực hiện', '05': 'Dừng', '06': 'Không hoàn thành' };
const NGUON = { '01': 'NSNN', '02': 'Tổ chức chủ trì', '03': 'Khác' };
const LV = { '01': 'Tự nhiên', '02': 'Kỹ thuật và CN', '03': 'Y dược', '04': 'Nông nghiệp', '05': 'Nhân văn', '06': 'Giáo dục', '07': 'Xã hội', '08': 'Khác' };
const LOAI = { '01': 'Chương trình', '02': 'Đề tài', '03': 'Đề án', '04': 'Dự án SXTN', '05': 'Dự án tạp chí', '06': 'Duy tu', '07': 'TCNLNC', '08': 'Khác' };
/* [mã, tên, biểu thức tìm trong tên đề tài (đã norm)] */
const QUAN = [['04', 'Bộ Công thương', 'congthuong'], ['05', 'Bộ GD&ĐT', 'giaoduc'], ['08', 'Bộ KH&CN', 'khoahocvacongnghe'], ['11', 'Bộ NN&PTNT (nay Bộ NN&MT)', 'nongnghiep|nnptnt'], ['15', 'Bộ TN&MT', 'tainguyen'],
  ['19', 'Bộ Xây dựng', 'xaydung'], ['23', 'Nước ngoài', ''], ['24', 'Ngân hàng NN', 'nganhang'], ['31', 'UBND tỉnh Bà Rịa - Vũng Tàu', 'bariavungtau|vungtau'], ['59', 'UBND tỉnh Lâm Đồng', 'lamdong'],
  ['67', 'UBND tỉnh Quảng Ninh', 'quangninh'], ['84', 'UBND TP Hải Phòng', 'haiphong'], ['90', 'UBND tỉnh Ninh Bình', 'ninhbinh'], ['91', 'Khác', '']];
const qName = c => { const m = QUAN.find(x => x[0] === c); return m ? c + ' ' + m[1] : c || ''; };
/* mã cấp trên KHCN -> [cấp HEMIS, chủ quản ('' = phải chọn), nguồn KP] */
const CAPS = { 2: ['02', '19', '01'], 3: ['02', '11', '01'], 35: ['01', '08', '01'], 36: ['01', '08', '01'], 37: ['01', '08', '01'], 38: ['01', '08', '01'], 40: ['02', '15', '01'], 41: ['02', '', '01'], 42: ['03', '', '01'], 51: ['02', '05', '01'], 52: ['02', '', '01'], 68: ['02', '04', '01'], 69: ['05', '91', '03'] };
const DOT = { td: ['Trọng điểm', 18, 120000000, '02'], cs: ['Cơ sở', 12, 13200000, '02'], ird: ['IRD', 12, 45000000, '03'] };
const FM = { ma: 'mA_NHIEM_VU', ten: 'teN_NHIEM_VU', cap: 'phaN_CAP_NHIEM_VU', loai: 'phaN_LOAI_NHIEM_VU', quan: 'cO_QUAN_CHU_QUAN', cn: 'nguoI_CHU_TRI', bd: 'tG_BAT_DAU', kt: 'tG_KET_THUC', kp: 'tonG_KINH_PHI', nguon: 'nguoN_KINH_PHI', tt: 'tinH_TRANG_NV' };
const FL = { ma: 'Mã', ten: 'Tên', cap: 'Cấp', loai: 'Phân loại', quan: 'Chủ quản', cn: 'Chủ nhiệm', bd: 'Bắt đầu', kt: 'Kết thúc', kp: 'Kinh phí', nguon: 'Nguồn KP', tt: 'Tình trạng' };
const TABS = { them: 'Thêm', sua: 'Sửa', xoa: 'Xoá', khop: 'Đã khớp' };

let ctx = null, tab = 'them', yr = String(pref('dt.year', CY)), run = null, loaded = false, tried = false;
let qd = [], tay = [], loaitru = [], chon = {}, tmp = {};
const sel = new Map(), done = new Map();
const going = () => !!(run && run.on);
const save = () => Promise.all([S.set('nv.qd', qd), S.set('nv.tay', tay), S.set('nv.loaitru', loaitru), S.set('nv.chon', chon)]);
const itemKey = (ma, ten) => norm(ma) || 't:' + norm(ten);
const exKey = s => /^t:/.test(s) ? s : norm(s);
const d10 = v => String(v || '').slice(0, 10);
const isoAll = s => [...String(s || '').matchAll(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g)].map(m => m[3] + '-' + pad(m[2]) + '-' + pad(m[1]));
const mY = iso => iso ? iso.slice(5, 7) + '/' + iso.slice(0, 4) : '…';
const addMonths = (iso, n) => { const [y, m, d] = iso.split('-').map(Number), t = new Date(Date.UTC(y, m - 1 + n, 1)), last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate(); return t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(Math.min(d, last)); };
const busyD = txt => { if (txt) D.busy.detai = txt; else delete D.busy.detai; emit('busy', 'detai'); };
const netErr = e => !B.isLogin(e) && /fetch|network|ERR_|kết nối|timeout/i.test(String(e && e.message));
/* lệnh HEMIS/KHCN: lỗi mạng thì thử lại 1 lần sau 2 giây */
const retry = async fn => { try { return await fn(); } catch (e) { if (!netErr(e)) throw e; await sleep(2000); return fn(); } };
const hem = (m, p, d) => retry(() => B.hemis(m, p, d));
const download = (name, text) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); };
const lvGuess = khoa => { const k = norm(khoa); return /kinhte|quanly|luat/.test(k) ? '07' : /ngoaingu|chinhtri|nhanvan/.test(k) ? '05' : /nongnghiep/.test(k) ? '04' : /giaoduc|suphamn/.test(k) ? '06' : /yduoc|suckhoe/.test(k) ? '03' : /toan|vatly|hoahoc|conban/.test(k) ? '01' : '02'; };

/* ================= Quét KHCN ================= */
const listUrl = (cap, p) => '/Home/ToanBoDeTai?page=' + p + '&currentFilter=&cap=' + cap + '&from=&target=&iprivate=false&tt=0&chutri=&diachi=null&khoa=&nopoint=null';
const parseRows = doc => [...doc.querySelectorAll('tr')].filter(tr => tr.querySelector('td')).map(tr => {
  const h = (tr.getAttribute('ondblclick') || '') + (tr.getAttribute('onclick') || '') + tr.innerHTML;
  const m = h.match(/ShowDeTails\(\s*['"]?(\d+)/) || (tr.getAttribute('data-id') || '').match(/(\d+)/) || h.match(/DeTai[^"'\s>]*?[\/=](\d+)/);
  const text = tr.textContent.replace(/\s+/g, ' ').trim();
  return m ? { id: m[1], ap: /Đã phê duyệt/i.test(text) } : null;
}).filter(Boolean);
async function scanCap(cap, seen) {
  let prev = '';
  for (let p = 1; p <= 80; p++) {
    const rows = parseRows(await retry(() => B.khcn(listUrl(cap, p))));
    const sig = rows.map(r => r.id).join(',');
    if (!rows.length || sig === prev) break;
    prev = sig; rows.forEach(r => { const o = seen.get(r.id); seen.set(r.id, { cap, ap: r.ap || (o && o.ap) }); });
  }
}
const parseDetail = doc => {
  const dd = {}; doc.querySelectorAll('dt').forEach(dt => { const v = dt.nextElementSibling; if (v && v.tagName === 'DD') dd[norm(dt.textContent)] = v.textContent.replace(/\s+/g, ' ').trim(); });
  /* thu lan luot tung mau, mau dau co uu tien (tranh "Ten" bat nham ten khac, "Kinh phi" bat nham "Nguon kinh phi") */
  const g = (...res) => { for (const re of res) { const k = Object.keys(dd).find(x => re.test(x)); if (k) return dd[k]; } return ''; };
  let t = isoAll(g(/^thoigian/)); if (t.length < 2) t = [isoAll(g(/batdau/))[0], isoAll(g(/ketthuc/))[0]];
  const tt = g(/trangthai/), nm = tt.match(/Đã nghiệm thu\s*:\s*(\d{1,2}\/\d{1,2}\/\d{4})?/i);
  const ten = g(/^tendetai$/, /^tendetai/, /^tennhiemvu/, /^ten$/);
  return { ma: g(/^maso$/, /^maso/, /^manhiemvu/, /^madetai/), ten, cn: g(/^chunhiem/, /chunhiem/), dv: g(/donvichutri|coquanchutri/), kp: +g(/^tongkinhphi/, /^kinhphi/).replace(/[^\d]/g, '') || 0, bd: t[0] || '', kt: t[1] || '',
    nt: nm && nm[1] ? isoAll(nm[1])[0] : '', done: !!nm, hint: [ten, g(/donvichutri|coquanchutri/), g(/dathang/), g(/^cap/)].join(' ') };
};
/* dinh nam: dang thuc hien trong nam, hoac ket thuc / nghiem thu trong nam. Da nghiem thu thi lay ngay nghiem thu lam ngay ket thuc
   (nghiem thu som truoc nam bao cao thi khong tinh du han ghi sang nam sau) */
const inYear = (r, y) => { const lo = y + '-01-01', hi = y + '-12-31', end = r.nt || r.kt; if (!r.bd && !end) return false; return (!r.bd || r.bd <= hi) && (!end || end >= lo); };
async function quet() {
  if (D.busy.detai) return;
  const y = yr, seen = new Map(); let fresh = 0;
  try {
    for (let pass = 1; pass <= 3; pass++) {
      const before = seen.size; let n = 0;
      await pool(Object.keys(CAPS), 3, async cap => { await scanCap(cap, seen); busyD('Đang quét đề tài KHCN, lượt ' + pass + ': ' + (++n) + '/' + Object.keys(CAPS).length + ' cấp, ' + seen.size + ' đề tài…'); });
      fresh = seen.size - before;
      if (pass >= 2 && !fresh) break;
    }
    const ap = [...seen.entries()].filter(([, v]) => v.ap); let k = 0, bad = 0; const rows = [];
    await pool(ap, 4, async ([id, v]) => {
      try { const r = parseDetail(await retry(() => B.khcn('/Home/DetailsDeTai', { id }))); if (r.ten) { r.id = id; r.cap = v.cap; if (inYear(r, y)) rows.push(r); } else bad++; } catch (e) { if (B.isLogin(e)) throw e; bad++; }
      busyD('Đang đọc chi tiết đề tài đã phê duyệt: ' + (++k) + '/' + ap.length + '…');
    });
    D.detai = { y: +y, at: Date.now(), rows: rows.sort((a, b) => a.id - b.id) };
    await S.set('data.detai', D.detai); emit('detai');
    toast('Quét xong: ' + rows.length + ' đề tài đã phê duyệt dính năm ' + y + (bad ? ', ' + bad + ' đề tài không đọc được' : '') + '.', bad ? 'err' : undefined);
    if (fresh) toast('Lượt quét cuối vẫn còn đề tài mới, có thể còn sót. Nên bấm Quét lại.', 'err');
  } catch (x) { ctx.fail(x); } finally { busyD(); }
}

/* ================= Ghép dữ liệu ================= */
const guess = (text, from) => { const t = norm(text), L = QUAN.filter(m => m[2] && new RegExp(m[2]).test(t)); return from ? L.filter(m => from(m[0])) : L; };
const status = (done_, kt) => done_ ? '01' : kt && kt < TODAY ? '03' : '04';
const mk = o => { o.k = itemKey(o.ma, o.ten); const c = chon[o.k] || tmp[o.k]; if (c) o.quan = c; o.needPick = !o.quan; return o; };
const fromKhcn = r => {
  const m = CAPS[r.cap] || ['05', '', '01'], sug = guess(r.hint, c => m[0] === '03' ? +c >= 30 && c !== '91' : +c < 30 && c !== '23');
  const it = { src: 'KHCN', ma: r.ma, ten: r.ten, cn: r.cn, cap: m[0], loai: '02', quan: m[1] || (sug.length === 1 ? sug[0][0] : ''), nguon: m[2], bd: r.bd, kt: r.kt, kp: r.kp, tt: status(r.done, r.kt), lv: '02', thuoc: '', hint: r.hint, id: r.id, cmp: ['ma', 'ten', 'cap', 'loai', 'quan', 'cn', 'bd', 'kt', 'kp', 'nguon', 'tt'] };
  /* KHCN thieu ma thi KHONG tu dat ma (Cowork tung tu dat): bao do, khong tick duoc; nhap tay de tai do kem ma that hoac ma tam */
  it.noMa = !r.ma;
  const w = []; if (!r.bd || !r.kt) w.push('Thiếu ngày bắt đầu hoặc kết thúc'); else if (r.kt < r.bd) w.push('Kết thúc trước bắt đầu'); else if (addMonths(r.bd, 60) < r.kt) w.push('Kéo dài hơn 5 năm');
  it.warn = w; return mk(it);
};
const fromQd = q => mk({ src: 'QĐ giao', ma: q.ma, ten: q.ten, cn: q.cn, cap: '04', loai: '02', quan: '11', nguon: q.nguon, bd: q.bd, kt: q.kt, kp: q.kp, tt: status(false, q.kt), lv: q.lv, thuoc: q.thuoc, warn: [], cmp: ['ma', 'ten', 'cap', 'loai', 'quan', 'bd', 'kt', 'kp', 'nguon'] });
const fromTay = t => mk({ src: 'Nhập tay', ma: t.ma, ten: t.ten, cn: t.cn, cap: t.cap, loai: t.loai || '02', quan: t.quan, nguon: t.nguon, bd: t.bd, kt: t.kt, kp: t.kp, tt: t.tt, lv: t.lv, thuoc: '', tam: !!t.tam, warn: t.kt && t.bd && t.kt < t.bd ? ['Kết thúc trước bắt đầu'] : [], cmp: Object.keys(FM) });
const wantAll = () => {
  const ex = new Set(loaitru.map(exKey)), out = [], seen = new Set(), names = new Set(), Dt = D.detai && D.detai.y === +yr ? D.detai : null;
  [...tay.map(fromTay), ...qd.map(fromQd), ...(Dt ? Dt.rows.map(fromKhcn) : [])].forEach(it => { if (ex.has(it.k) || seen.has(it.k) || (it.ten.length > 5 && names.has(norm(it.ten)))) return; seen.add(it.k); names.add(norm(it.ten)); out.push(it); });
  return out;
};
const cur = h => ({ ma: h.mA_NHIEM_VU, ten: h.teN_NHIEM_VU, cap: h.phaN_CAP_NHIEM_VU, loai: h.phaN_LOAI_NHIEM_VU, quan: h.cO_QUAN_CHU_QUAN, cn: h.nguoI_CHU_TRI, bd: d10(h.tG_BAT_DAU), kt: d10(h.tG_KET_THUC), kp: +h.tonG_KINH_PHI || 0, nguon: h.nguoN_KINH_PHI, tt: h.tinH_TRANG_NV });
const shown = (f, v) => f === 'cap' ? (CAP[v] || v) : f === 'quan' ? qName(v) : f === 'tt' ? (TT[v] || v) : f === 'nguon' ? (NGUON[v] || v) : f === 'loai' ? (LOAI[v] || v) : f === 'bd' || f === 'kt' ? vnDate(v) : f === 'kp' ? nf(v) : String(v == null ? '' : v);
const compute = () => {
  if (!D.nv) return null;
  const H = D.nv.list, byMa = new Map(), byTen = new Map(), used = new Set(), rows = [], W = wantAll(), ex = new Set(loaitru.map(exKey));
  H.forEach(h => { const a = norm(h.mA_NHIEM_VU), b = norm(h.teN_NHIEM_VU); if (a && !byMa.has(a)) byMa.set(a, h); if (b.length > 5 && !byTen.has(b)) byTen.set(b, h); });
  W.forEach(it => {
    const h = byMa.get(norm(it.ma)) || (it.ten.length > 5 ? byTen.get(norm(it.ten)) : null);
    if (!h) { rows.push({ k: 'a:' + it.k, act: 'them', it }); return; }
    if (used.has(h.id)) return; used.add(h.id);
    const c = cur(h), diffs = it.cmp.filter(f => it[f] !== '' && it[f] != null && it[f] !== 0 && String(c[f] == null ? '' : c[f]).trim() !== String(it[f]).trim());
    rows.push(diffs.length ? { k: 's:' + h.id, act: 'sua', it, h, diffs, c } : { k: 'h:' + h.id, act: 'khop', it, h });
  });
  const Dt = D.detai && D.detai.y === +yr;
  H.forEach(h => {
    if (used.has(h.id)) return;
    const exd = ex.has(exKey(h.mA_NHIEM_VU)) || ex.has('t:' + norm(h.teN_NHIEM_VU));
    if (exd) rows.push({ k: 'x:' + h.id, act: 'xoa', h, why: 'Thuộc danh sách loại trừ' });
    else if (h.phaN_CAP_NHIEM_VU !== '04' && Dt) rows.push({ k: 'x:' + h.id, act: 'xoa', h, why: 'Không có trong KHCN đã phê duyệt dính năm ' + yr });
  });
  return { rows, W };
};
const canTick = r => !(r.act === 'khop' || (r.act === 'them' && (r.it.needPick || r.it.noMa || !r.it.ten)) || (done.get(r.k) && done.get(r.k).ok));
const isOn = r => canTick(r) && (sel.has(r.k) ? sel.get(r.k) : r.act !== 'xoa');
const rec = it => ({ id: crypto.randomUUID(), doN_VI_ID: DV, mA_NHIEM_VU: it.ma, teN_NHIEM_VU: it.ten, phaN_CAP_NHIEM_VU: it.cap, phaN_LOAI_NHIEM_VU: it.loai, cO_QUAN_CHU_QUAN: it.quan, cO_QUAN_CHU_TRI: 'Trường Đại học Thủy lợi', nguoI_CHU_TRI: it.cn,
  tG_BAT_DAU: it.bd ? it.bd + 'T00:00:00' : null, tG_KET_THUC: it.kt ? it.kt + 'T00:00:00' : null, tonG_KINH_PHI: it.kp, nguoN_KINH_PHI: it.nguon, tinH_TRANG_NV: it.tt, linH_VUC_NCKH: it.lv, thuoC_NHIEM_VU: it.thuoc || '', isBuildIn: false, isBuildInAll: false });

/* ================= Bảng ================= */
const tab_ = C => C.rows.filter(r => r.act === tab);
const quanCell = it => {
  const lbl = CAP[it.cap] ? it.cap + ' ' + CAP[it.cap] : it.cap;
  if (it.needPick) return esc(lbl) + ' · <button class="btn sm warnbtn" data-pick="' + esc(it.k) + '">' + icon('info') + (it.cap === '03' ? 'Chọn UBND tỉnh' : 'Chọn cơ quan chủ quản') + '</button>';
  return esc(lbl + ' · ' + qName(it.quan)) + (it.src === 'KHCN' ? ' <button class="lnk" data-pick="' + esc(it.k) + '" aria-label="Đổi cơ quan chủ quản">Đổi</button>' : '');
};
const ttPill = c => pill(c === '01' ? 'ok' : c === '04' ? 'info' : c === '03' ? 'warn' : 'mut', TT[c] || c || '—', c === '01' || c === '04' || c === '03' ? undefined : 'info');
const warns = it => (!it.ten ? pill('err', 'Thiếu tên đề tài') : '') + (it.noMa ? pill('err', 'Thiếu mã trên KHCN: bổ sung trên KHCN hoặc nhập tay') : '') + (it.warn || []).map(w => pill('warn', w)).join('') + (it.tam ? pill('warn', 'Mã tạm') : '');
const resCell = r => { const d = done.get(r.k); if (d) return d.ok ? pill('ok', 'Đã xong') : pill('err', d.err); return r.act === 'them' ? '<button class="lnk" data-excl="' + esc(r.it.k) + '">Loại trừ</button>' : ''; };
const ck = r => '<td class="ck"><input type="checkbox" data-ck="' + esc(r.k) + '" aria-label="Chọn"' + (isOn(r) ? ' checked' : '') + (!canTick(r) || going() ? ' disabled' : '') + '></td>';
const nameCell = (it, h) => '<td class="t"><b>' + esc(it ? it.ten : h.teN_NHIEM_VU) + '</b><div class="muted">' + esc(it ? it.cn : h.nguoI_CHU_TRI) + '</div>' + (it ? warns(it) : '') + '</td>';
const rowHtml = r => {
  const it = r.it, h = r.h, ma = esc(it ? it.ma : h.mA_NHIEM_VU);
  if (r.act === 'xoa') return '<tr>' + ck(r) + '<td class="nowrap">' + ma + '</td>' + nameCell(null, h) + '<td>' + esc((CAP[h.phaN_CAP_NHIEM_VU] || '') + ' · ' + qName(h.cO_QUAN_CHU_QUAN)) + '</td><td>' + pill('warn', r.why) + '</td><td>' + resCell(r) + '</td></tr>';
  const time = mY(it.bd) + ' – ' + mY(it.kt);
  if (r.act === 'sua') return '<tr>' + ck(r) + '<td class="nowrap">' + ma + '</td>' + nameCell(it, h) + '<td>' + r.diffs.map(f => '<div><span class="muted">' + FL[f] + ':</span> <span class="was">' + esc(shown(f, r.c[f]) || '(trống)') + '</span> ' + icon('right') + ' <span class="will">' + esc(shown(f, it[f])) + '</span></div>').join('') + '</td><td>' + esc(it.src) + '</td><td>' + resCell(r) + '</td></tr>';
  return '<tr>' + (r.act === 'them' ? ck(r) : '') + '<td class="nowrap">' + ma + '</td>' + nameCell(it, h) + '<td>' + quanCell(it) + '</td><td class="nowrap">' + time + '</td><td class="nowrap">' + ttPill(it.tt) + '</td><td>' + esc(it.src) + '</td>' + (r.act === 'them' ? '<td>' + resCell(r) + '</td>' : '') + '</tr>';
};
const HEAD = { them: ['', 'Mã', 'Đề tài', 'Cấp · chủ quản', 'Thời gian', 'Tình trạng', 'Nguồn', 'Kết quả'], sua: ['', 'Mã', 'Đề tài', 'Thay đổi', 'Nguồn', 'Kết quả'], xoa: ['', 'Mã', 'Đề tài', 'Cấp · chủ quản', 'Lý do', 'Kết quả'], khop: ['Mã', 'Đề tài', 'Cấp · chủ quản', 'Thời gian', 'Tình trạng', 'Nguồn'] };
const table = C => {
  const L = tab_(C), H = HEAD[tab];
  const th = H.map((t, i) => i === 0 && t === '' ? '<th class="ck"><input type="checkbox" data-all aria-label="Chọn tất cả"' + (L.some(r => canTick(r) && !isOn(r)) ? '' : ' checked') + (going() ? ' disabled' : '') + '></th>' : '<th' + (t === 'Đề tài' ? ' class="wt"' : '') + '>' + t + '</th>').join('');
  return '<div class="tw"><table class="tbl"><thead><tr>' + th + '</tr></thead><tbody>' + (L.length ? L.slice(0, MAXR).map(rowHtml).join('') : '<tr><td colspan="' + H.length + '">' + empty('check', 'Không có mục nào', '') + '</td></tr>') + '</tbody></table></div>' +
    (L.length > MAXR ? '<div class="more">Đang hiện ' + MAXR + '/' + L.length + '. Mục được tick đều sẽ chạy. Bấm biểu tượng Excel để xem đủ.</div>' : '') +
    (tab === 'xoa' ? '<div class="more">Mục Xoá không tick sẵn. Trước khi xoá, công cụ tải về file sao lưu JSON. Đề tài cấp cơ sở chỉ bị đề xuất xoá khi nằm trong danh sách loại trừ.</div>' : '');
};
const statTable = C => {
  const rows = new Map(); C.W.forEach(it => { const k = it.cap + '|' + (it.quan || ''); const r = rows.get(k) || { cap: it.cap, quan: it.quan, n: {} }; r.n[it.tt] = (r.n[it.tt] || 0) + 1; rows.set(k, r); });
  const L = [...rows.values()].sort((a, b) => (a.cap + a.quan).localeCompare(b.cap + b.quan)), cs = Object.keys(TT).filter(c => L.some(r => r.n[c])), sum = r => cs.reduce((s, c) => s + (r.n[c] || 0), 0);
  return { L, cs, sum };
};
const statHtml = C => {
  const { L, cs, sum } = statTable(C), cell = v => '<td class="num' + (v ? '' : ' z') + '">' + (v || 0) + '</td>';
  return '<div class="tw"><table class="tbl"><thead><tr><th>Cấp</th><th>Cơ quan chủ quản</th>' + cs.map(c => '<th class="num">' + esc(TT[c]) + '</th>').join('') + '<th class="num">Tổng</th></tr></thead><tbody>' +
    (L.length ? L.map(r => '<tr><td>' + esc(r.cap + ' ' + (CAP[r.cap] || '')) + '</td><td>' + (r.quan ? esc(qName(r.quan)) : '<span class="muted">(chưa chọn)</span>') + '</td>' + cs.map(c => cell(r.n[c])).join('') + cell(sum(r)) + '</tr>').join('') +
      '<tr class="tot"><td colspan="2">Tổng</td>' + cs.map(c => cell(L.reduce((s, r) => s + (r.n[c] || 0), 0))).join('') + cell(L.reduce((s, r) => s + sum(r), 0)) + '</tr>' : '<tr><td colspan="9">' + empty('table', 'Chưa có đề tài trong phạm vi', '') + '</td></tr>') + '</tbody></table></div>';
};
const nTay = () => tay.length, thuocs = () => [...new Set(qd.map(q => q.thuoc))];
const ngoaiHtml = () => {
  const chip = (id, label) => '<span class="tplitem"><span class="nm">' + esc(label) + '</span><button data-rm="' + esc(id) + '" aria-label="Bỏ ' + esc(label) + '">' + icon('x') + '</button></span>';
  const L = thuocs().map(t => chip('qd:' + t, (t || '(không ghi đợt)') + ' · ' + qd.filter(q => q.thuoc === t).length + ' đề tài')).concat(tay.map(t => chip('tay:' + t.k, t.ma + (t.tam ? ' (mã tạm)' : ''))), loaitru.map(m => chip('lt:' + m, 'Loại trừ ' + m.replace(/^t:/, ''))));
  return '<div class="card-b">' + (L.length ? '<div class="chips">' + L.join('') + '</div>' : '<span class="muted">Chưa có đề tài nhập thêm hay mã loại trừ. Đề tài ở đây được lưu trên máy này, lần đồng bộ sau không bị xoá.</span>') + '</div>';
};

/* ================= Xuất Excel ================= */
const xHead = ['Mã', 'Tên đề tài', 'Chủ nhiệm', 'Cấp', 'Cơ quan chủ quản', 'Bắt đầu', 'Kết thúc', 'Kinh phí (đồng)', 'Tình trạng', 'Nguồn', 'Thay đổi / lý do'];
const xRow = r => { const it = r.it, h = r.h ? cur(r.h) : null, o = it || (h && { ma: h.ma, ten: h.ten, cn: h.cn, cap: h.cap, quan: h.quan, bd: h.bd, kt: h.kt, kp: h.kp, tt: h.tt, src: 'HEMIS' });
  return [o.ma, o.ten, o.cn, CAP[o.cap] || o.cap, qName(o.quan), vnDate(o.bd), vnDate(o.kt), o.kp || '', TT[o.tt] || o.tt, o.src, r.act === 'sua' ? r.diffs.map(f => FL[f] + ': ' + shown(f, r.c[f]) + ' -> ' + shown(f, it[f])).join('; ') : r.act === 'xoa' ? r.why : (it && it.warn ? it.warn.join('; ') : '')]; };
const xBang = () => { const C = compute(); if (C) downloadXlsx('Đẩy HEMIS đề tài ' + TABS[tab], { name: TABS[tab], head: 1, freezeCols: 1, rows: [xHead].concat(tab_(C).map(xRow)) }); };
const xTk = () => { const C = compute(); if (!C) return; const { L, cs, sum } = statTable(C); downloadXlsx('Thống kê đề tài ' + yr, { name: 'Thống kê', head: 1, totals: [L.length + 1], rows: [['Cấp', 'Cơ quan chủ quản'].concat(cs.map(c => TT[c]), ['Tổng'])].concat(L.map(r => [CAP[r.cap] || r.cap, r.quan ? qName(r.quan) : '(chưa chọn)'].concat(cs.map(c => r.n[c] || 0), [sum(r)])), [['Tổng', ''].concat(cs.map(c => L.reduce((s, r) => s + (r.n[c] || 0), 0)), [L.reduce((s, r) => s + sum(r), 0)])]) }); };

/* ================= Hộp chọn, biểu mẫu ================= */
function pick(btn) {
  const k = btn.dataset.pick, it = wantAll().find(x => x.k === k); if (!it) return;
  const sug = guess(it.hint || it.ten), p = popover(btn, '<div class="pk"><input class="inp" data-q placeholder="Gõ vài chữ tên tỉnh hoặc bộ…" aria-label="Tìm cơ quan chủ quản"><div data-list></div><label class="chk"><input type="checkbox" data-rem checked>Nhớ cho đề tài này, lần sau không hỏi lại</label></div>');
  const list = p.el.querySelector('[data-list]'), b = m => '<button class="btn ghost pkb" data-v="' + m[0] + '"><span>' + esc(m[1]) + '</span><span class="muted small">' + m[0] + '</span></button>';
  /* danh muc day du (93 muc) chua doc duoc tu HEMIS: go so de dung thang ma HEMIS (xem o "Co quan chu quan" tren form HEMIS) */
  const draw = q => { const f = norm(q), num = /^\d{1,3}$/.test(String(q).trim()) ? String(q).trim().padStart(2, '0') : '';
    list.innerHTML = (!f && sug.length ? '<div class="pkh">Gợi ý theo tên đề tài</div>' + sug.map(b).join('') : '') + '<div class="pkh">Danh mục cơ quan chủ quản đã biết</div>' + QUAN.filter(m => !f || norm(m[1]).includes(f) || m[0].includes(f)).map(b).join('') +
      (num && !QUAN.some(m => m[0] === num) ? b([num, 'Dùng mã HEMIS ' + num]) : '') + (!num ? '<div class="pkh">Tỉnh khác: gõ mã số của tỉnh trên HEMIS</div>' : ''); };
  draw(''); p.el.querySelector('[data-q]').addEventListener('input', e => draw(e.target.value));
  p.el.addEventListener('click', async e => {
    const v = e.target.closest('[data-v]'); if (!v) return;
    if (p.el.querySelector('[data-rem]').checked) { chon[k] = v.dataset.v; await save(); } else tmp[k] = v.dataset.v;
    p.close(); ctx.render();
  });
}
const sel_ = (f, o, v) => '<select class="inp" data-f="' + f + '">' + Object.entries(o).map(([c, t]) => '<option value="' + c + '"' + (c === v ? ' selected' : '') + '>' + c + ' ' + t + '</option>').join('') + '</select>';
const field = (label, inner, cls) => '<div class="fl' + (cls ? ' ' + cls : '') + '"><label>' + label + '</label>' + inner + '</div>';
const inp = (f, ph, v) => '<input class="inp" data-f="' + f + '" placeholder="' + (ph || '') + '" value="' + esc(v || '') + '">';
const val = (dr, f) => { const e = dr.querySelector('[data-f="' + f + '"]'); return e ? (e.type === 'checkbox' ? e.checked : e.value.trim()) : ''; };
const foot2 = ok => '<button class="btn" data-cancel>Huỷ</button><button class="btn pri" data-ok>' + ok + '</button>';

function formQd() {
  const body = '<div class="fgrid2">' + field('Loại đợt <span class="muted small">(Trọng điểm, Cơ sở, IRD: tự điền thời gian, kinh phí, nguồn)</span>', '<select class="inp" data-f="dot">' + Object.entries(DOT).map(([k, d]) => '<option value="' + k + '">' + d[0] + '</option>').join('') + '</select>', 'span2') +
    field('Thuộc nhiệm vụ (tên đợt, số QĐ)', inp('thuoc', 'Đề tài cơ sở 2026, QĐ số …/QĐ-ĐHTL'), 'span2') + field('Ngày bắt đầu', inp('bd', 'dd/mm/yyyy')) + field('Số tháng', inp('th', '', '12')) +
    field('Kinh phí mỗi đề tài (đồng)', inp('kp', '', '13.200.000')) + field('Nguồn kinh phí', sel_('nguon', NGUON, '02')) +
    field('Dán bảng từ Excel: Mã · Tên đề tài · Chủ nhiệm · Khoa', '<textarea class="inp" data-f="tsv" rows="6" placeholder="CS2026-01&#9;Nghiên cứu …&#9;TS. …&#9;Khoa Công trình"></textarea><div class="hint" data-cnt></div>', 'span2') + '</div>';
  const dr = drawer({ title: 'Nhập đề tài từ QĐ giao', body, foot: foot2('Thêm đề tài vào danh sách') });
  const parse = () => String(val(dr, 'tsv') === '' ? '' : dr.querySelector('[data-f="tsv"]').value).split(/\r?\n/).map(l => l.split(/\t| {2,}/).map(c => c.trim())).filter(c => c[0] && c[1] && norm(c[0]) !== 'ma');
  const upd = () => { const n = parse().length; dr.querySelector('[data-cnt]').textContent = 'Đọc được ' + n + ' đề tài. Lĩnh vực đoán theo khoa, sửa được ở bước sau.'; dr.querySelector('[data-ok]').textContent = n ? 'Thêm ' + n + ' đề tài vào danh sách' : 'Thêm đề tài vào danh sách'; };
  const dotSet = () => { const d = DOT[val(dr, 'dot')]; dr.querySelector('[data-f="th"]').value = d[1]; dr.querySelector('[data-f="kp"]').value = nf(d[2]); dr.querySelector('[data-f="nguon"]').value = d[3]; };
  dr.querySelector('[data-f="dot"]').addEventListener('change', dotSet); dr.querySelector('[data-f="tsv"]').addEventListener('input', upd); dotSet(); upd();
  dr.addEventListener('click', async e => {
    if (e.target.closest('[data-cancel]')) return closeDrawer();
    if (!e.target.closest('[data-ok]')) return;
    const bd = toISO(val(dr, 'bd')), th = +val(dr, 'th'), kp = +String(val(dr, 'kp')).replace(/[^\d]/g, ''), L = parse();
    if (!bd || !th || !L.length) { toast('Cần ngày bắt đầu đúng dạng dd/mm/yyyy, số tháng và ít nhất một đề tài.', 'err'); return; }
    const have = new Set(qd.map(q => norm(q.ma)));
    L.forEach(c => { if (!have.has(norm(c[0]))) qd.push({ ma: c[0], ten: c[1], cn: c[2] || '', khoa: c[3] || '', bd, kt: addMonths(bd, th), kp, nguon: val(dr, 'nguon'), thuoc: val(dr, 'thuoc'), lv: lvGuess(c[3]) }); });
    await save(); closeDrawer(); toast('Đã thêm ' + L.length + ' đề tài vào danh sách.'); ctx.render();
  });
}
function formTay() {
  const body = '<div class="fgrid2">' + field('Tên đề tài', inp('ten'), 'span2') + field('Mã nhiệm vụ', inp('ma')) + field('Chủ nhiệm', inp('cn')) + field('Cấp', sel_('cap', CAP, '02')) + field('Cơ quan chủ quản', '<select class="inp" data-f="quan">' + QUAN.map(m => '<option value="' + m[0] + '"' + (m[0] === '11' ? ' selected' : '') + '>' + m[0] + ' ' + esc(m[1]) + '</option>').join('') + '</select>') +
    field('Ngày bắt đầu', inp('bd', 'dd/mm/yyyy')) + field('Ngày kết thúc', inp('kt', 'dd/mm/yyyy')) + field('Tổng kinh phí (đồng)', inp('kp')) + field('Nguồn kinh phí', sel_('nguon', NGUON, '01')) + field('Tình trạng', sel_('tt', TT, '04')) + field('Lĩnh vực', sel_('lv', LV, '02')) +
    field('Phân loại', sel_('loai', LOAI, '02')) + field('Cơ quan chủ trì', '<div class="inp">Trường Đại học Thủy lợi</div>') +
    '<label class="chk span2"><input type="checkbox" data-f="tam">Mã tạm (chờ mã thật): công cụ sẽ nhắc ở mọi bảng cho tới khi đổi mã</label></div>';
  const dr = drawer({ title: 'Thêm đề tài nhập tay', body, foot: foot2('Lưu') });
  dr.addEventListener('click', async e => {
    if (e.target.closest('[data-cancel]')) return closeDrawer();
    if (!e.target.closest('[data-ok]')) return;
    const t = { ten: val(dr, 'ten'), ma: val(dr, 'ma'), cn: val(dr, 'cn'), cap: val(dr, 'cap'), quan: val(dr, 'quan'), bd: toISO(val(dr, 'bd')), kt: toISO(val(dr, 'kt')) || '', kp: +String(val(dr, 'kp')).replace(/[^\d]/g, ''), nguon: val(dr, 'nguon'), tt: val(dr, 'tt'), lv: val(dr, 'lv'), loai: val(dr, 'loai'), tam: val(dr, 'tam') };
    if (!t.ten || !t.ma || !t.bd) { toast('Cần tên đề tài, mã nhiệm vụ và ngày bắt đầu (dd/mm/yyyy).', 'err'); return; }
    t.k = itemKey(t.ma, t.ten); tay = tay.filter(x => x.k !== t.k).concat(t); await save(); closeDrawer(); toast('Đã lưu đề tài nhập tay.'); ctx.render();
  });
}
function formJson() {
  const dr = drawer({ title: 'Nhập danh sách (JSON)', body: '<p class="muted small">Định dạng: <code>{"tay":[{"ma","ten","cn","cap":"02","quan":"11","bd":"dd/mm/yyyy","kt":"dd/mm/yyyy","kp":0,"nguon":"01","tt":"04","lv":"02","tam":false}],"loaitru":["mã đề tài"]}</code></p><textarea class="inp" data-f="js" rows="12" aria-label="JSON"></textarea>', foot: foot2('Nhập') });
  dr.addEventListener('click', async e => {
    if (e.target.closest('[data-cancel]')) return closeDrawer();
    if (!e.target.closest('[data-ok]')) return;
    let j; try { j = JSON.parse(val(dr, 'js')); } catch (x) { toast('Không đọc được JSON: ' + x.message, 'err'); return; }
    const iso = s => /^\d{4}-/.test(s) ? s : toISO(s) || '';
    (j.tay || []).forEach(t => { if (!t.ma) return; t.ten = t.ten || ''; const o = { cap: '02', quan: '11', nguon: '01', tt: '04', lv: '02', loai: '02', kp: 0, cn: '', tam: false, ...t, bd: iso(t.bd), kt: iso(t.kt) }; o.k = itemKey(o.ma, o.ten); tay = tay.filter(x => x.k !== o.k).concat(o); });
    (j.loaitru || []).forEach(m => { if (m && !loaitru.some(x => exKey(x) === exKey(m))) loaitru.push(m); });
    await save(); closeDrawer(); ctx.render();
  });
}

/* ================= Chạy ================= */
async function runAll() {
  if (going()) return;
  const C0 = compute(); if (!C0) return;
  const keys = new Set(C0.rows.filter(isOn).map(r => r.k)), n = keys.size; if (!n) return;
  const c0 = a => C0.rows.filter(r => keys.has(r.k) && r.act === a).length;
  if (!await ask({ title: 'Chạy ' + n + ' thay đổi trên HEMIS?', text: 'Thêm ' + c0('them') + ' đề tài, sửa ' + c0('sua') + ', xoá ' + c0('xoa') + '.\n' + (c0('xoa') ? 'Trước khi xoá, công cụ tải về file sao lưu (JSON) các đề tài sắp xoá.\n' : '') + 'Trước khi chạy, công cụ lấy lại danh sách đề tài trên HEMIS.', ok: 'Chạy ' + n + ' thay đổi', cancel: 'Chưa chạy', danger: c0('xoa') > 0 })) return;
  run = { on: true, ok: 0, bad: 0, total: n, msg: 'Đang kiểm tra lại HEMIS…' }; ctx.render();
  let stop = null;
  try { while (D.busy.hemis) await sleep(300); await loadNv(); } catch (x) { run = null; ctx.render(); ctx.fail(x); return; }
  const rows = compute().rows.filter(r => keys.has(r.k) && r.act !== 'khop'), dels = rows.filter(r => r.act === 'xoa');
  run.total = rows.length;
  const step = () => { run.msg = 'Đã chạy ' + (run.ok + run.bad) + '/' + run.total; ctx.syncFoot(); };
  let skipDel = false;
  if (dels.length) {
    run.msg = 'Đang sao lưu ' + dels.length + ' đề tài sắp xoá…'; ctx.syncFoot();
    try {
      const full = []; for (const r of dels) { const g = await hem('GET', API + '/DetailWithPermission/' + r.h.id + '?pid=00000000-0000-0000-0000-000000000000'); if (!g.data) throw new Error('Không đọc được đề tài ' + r.h.mA_NHIEM_VU); full.push(g.data); await sleep(150); }
      download('Sao lưu đề tài trước khi xoá ' + TODAY + '.json', JSON.stringify({ KHCN_NHIEM_VU_KHCN: full }, null, 1));
    } catch (e) { if (B.isLogin(e)) stop = e; skipDel = true; toast('Không sao lưu được nên chưa xoá đề tài nào: ' + e.message, 'err'); }
  }
  for (const r of stop ? [] : rows) {
    if (r.act === 'xoa' && skipDel) { run.total--; continue; }
    try {
      if (r.act === 'them') await hem('POST', API, rec(r.it));
      else if (r.act === 'sua') { const g = await hem('GET', API + '/DetailWithPermission/' + r.h.id + '?pid=00000000-0000-0000-0000-000000000000'), d = g.data; if (!d) throw new Error('Không đọc được đề tài trên HEMIS'); r.diffs.forEach(f => { d[FM[f]] = f === 'bd' || f === 'kt' ? r.it[f] + 'T00:00:00' : r.it[f]; }); await hem('PUT', API + '/' + r.h.id, d); }
      else await hem('DELETE', API + '/' + r.h.id);
      done.set(r.k, { ok: true }); run.ok++;
    } catch (e) { done.set(r.k, { err: e.message }); run.bad++; if (B.isLogin(e)) stop = e; }
    step(); if (stop) break; await sleep(150);
  }
  run.on = false; run.msg = (stop ? 'Dừng giữa chừng: ' : 'Xong: ') + 'thành công ' + run.ok + ', lỗi ' + run.bad;
  if (!stop) { try { await loadNv(); } catch (e) { /* bấm Tải lại */ } }
  ctx.render();
  if (stop) await info('Dừng vì hết phiên đăng nhập', stop.message + '\nĐã chạy được ' + run.ok + ' thay đổi. Đăng nhập lại rồi bấm Chạy tiếp.');
  else toast('Xong ' + run.ok + ' thay đổi' + (run.bad ? ', ' + run.bad + ' lỗi' : '') + '.', run.bad ? 'err' : undefined);
}

/* ================= Giao diện: một loại dữ liệu trong màn "Đẩy lên HEMIS" ================= */
const nPend = C => C ? C.rows.filter(r => r.act === 'them' && canTick(r) || r.act === 'sua' && canTick(r)).length : 0;
export default {
  id: 'detai', title: 'Đề tài', on: ['detai', 'hemis', 'settings'], busy: ['hemis', 'detai'],
  badge: () => nPend(compute()),
  acts: () => '<label class="sel">Năm báo cáo <select data-dt-yr aria-label="Năm báo cáo">' + [CY + 1, CY, CY - 1, CY - 2].map(y => '<option' + (String(y) === yr ? ' selected' : '') + '>' + y + '</option>').join('') + '</select></label><button class="btn" data-dt-scan>' + icon('refresh') + 'Quét lại</button>',
  sub() {
    if (!D.nv) return 'Đề tài · đang so với HEMIS';
    const W = wantAll(), c = s => W.filter(x => x.src === s).length, Dt = D.detai && D.detai.y === +yr;
    return W.length + ' đề tài trong phạm vi năm ' + yr + ' (KHCN ' + c('KHCN') + ' · QĐ giao ' + c('QĐ giao') + ' · nhập tay ' + c('Nhập tay') + ')' + (Dt ? ' · quét lúc ' + fmtTime(D.detai.at) : ' · chưa quét KHCN năm ' + yr);
  },
  init(c) {
    ctx = c;
    regBlk('dt.bang', { scr: 'day.detai', title: 'Đề tài', render: c.render, xlsx: xBang, close: () => { tab = 'them'; sel.clear(); } });
    regBlk('dt.tk', { scr: 'day.detai', title: 'Thống kê đề tài', render: c.render, xlsx: xTk });
    Promise.all([S.get('nv.qd'), S.get('nv.tay'), S.get('nv.loaitru'), S.get('nv.chon'), S.get('data.detai'), S.get('data.nv')]).then(([a, b, l, ch, dt, nv]) => {
      qd = a || []; tay = b || []; loaitru = l || []; chon = ch || {}; if (!D.detai && dt) D.detai = dt; if (!D.nv && nv) D.nv = nv; loaded = true; c.render();
    });
  },
  async onClick(e) {
    const t = e.target.closest('[data-tab]'); if (t) { tab = t.dataset.tab; ctx.render(); return; }
    if (e.target.closest('[data-dt-scan]')) { quet(); return; }
    if (e.target.closest('[data-run]')) { runAll(); return; }
    if (e.target.closest('[data-reload]')) { try { await loadNv(); } catch (x) { ctx.fail(x); } return; }
    const pk = e.target.closest('[data-pick]'); if (pk) { pick(pk); return; }
    const ex = e.target.closest('[data-excl]'); if (ex) { loaitru.push(ex.dataset.excl); await save(); ctx.render(); return; }
    const rm = e.target.closest('[data-rm]');
    if (rm) {
      const [kind, ...r] = rm.dataset.rm.split(':'), id = r.join(':');
      if (!await ask({ title: 'Bỏ khỏi danh sách trên máy?', text: 'Chỉ bỏ khỏi danh sách lưu trong công cụ, không xoá gì trên HEMIS.', ok: 'Bỏ', cancel: 'Giữ lại' })) return;
      if (kind === 'qd') qd = qd.filter(q => q.thuoc !== id); else if (kind === 'tay') tay = tay.filter(x => x.k !== id); else loaitru = loaitru.filter(m => m !== id);
      await save(); ctx.render(); return;
    }
    if (e.target.closest('[data-qd]')) formQd(); else if (e.target.closest('[data-tay]')) formTay(); else if (e.target.closest('[data-json]')) formJson();
  },
  onChange(e) {
    const y = e.target.closest('[data-dt-yr]'); if (y) { yr = y.value; setPref('dt.year', +yr); sel.clear(); ctx.render(); return; }
    const c = e.target.closest('[data-ck]'), a = e.target.closest('[data-all]'), C = compute(); if (!C) return;
    if (c) sel.set(c.dataset.ck, c.checked); else if (a) tab_(C).forEach(r => { if (canTick(r)) sel.set(r.k, a.checked); }); else return;
    if (a) ctx.root.querySelectorAll('[data-ck]:not(:disabled)').forEach(x => { x.checked = a.checked; });
    ctx.syncFoot();
  },
  render(body) {
    if (!loaded) { body.innerHTML = ''; return; }
    if (!D.nv && !tried && !D.busy.hemis) { tried = true; loadNv().catch(x => ctx.fail(x, true)); }
    const C = compute(), Dt = D.detai && D.detai.y === +yr;
    let h = '';
    if (!C) h += '<div class="card">' + empty('refresh', D.busy.hemis ? 'Đang lấy danh sách đề tài trên HEMIS…' : 'Chưa có dữ liệu HEMIS', 'Anh/chị cần đăng nhập HEMIS trên Chrome.', D.busy.hemis ? '' : '<button class="btn pri" data-reload>' + icon('refresh') + 'Lấy từ HEMIS</button>') + '</div>';
    else {
      if (!Dt) h += '<div class="note">' + icon('info') + '<div>Chưa quét đề tài trên KHCN cho năm ' + yr + '. Bấm “Quét lại” để quét; trong lúc chưa quét, bảng chỉ có đề tài nhập từ QĐ và nhập tay, và mục Xoá để trống.</div></div>';
      const c = a => C.rows.filter(r => r.act === a).length;
      h += blk('dt.bang', 'Đề tài', table(C), { headHtml: tabsHtml(Object.keys(TABS).map(k => [k, TABS[k] + ' (' + c(k) + ')']), tab) }) + blk('dt.tk', 'Thống kê', statHtml(C), { def: true, head: '<span class="muted small">cấp × cơ quan chủ quản × tình trạng</span>' });
    }
    h += blk('dt.ngoai', 'Đề tài ngoài KHCN và loại trừ', ngoaiHtml(), { fixed: true, head: '<span class="muted small">' + qd.length + ' từ QĐ giao · ' + nTay() + ' nhập tay · ' + loaitru.length + ' mã loại trừ</span>',
      tools: '<button class="btn sm" data-qd>' + icon('plus') + 'Nhập từ QĐ</button><button class="btn sm" data-tay>' + icon('plus') + 'Nhập tay</button><button class="btn sm" data-json>' + icon('plus') + 'Nhập danh sách (JSON)</button>' });
    body.innerHTML = h;
    const xb = body.querySelector('[data-close="dt.bang"]'); if (xb && going()) xb.disabled = true;
    const sc = ctx.root.querySelector('[data-dt-scan]'); if (sc) sc.disabled = !!D.busy.detai;
  },
  foot() {
    const C = compute(); if (!C) return '';
    const on = C.rows.filter(isOn), a = on.filter(r => r.act === 'them').length, s = on.filter(r => r.act === 'sua').length, x = on.filter(r => r.act === 'xoa').length, n = a + s + x, g = going(), pct = run && run.total ? Math.round((run.ok + run.bad) / run.total * 100) : 0;
    return '<span><b>' + n + ' thay đổi</b> đã chọn <span class="muted">· thêm ' + a + ' · sửa ' + s + ' · xoá ' + x + '</span></span>' + (run ? '<span class="muted">· ' + esc(run.msg) + '</span>' : '') + '<div class="sp"></div>' +
      (run ? '<div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><span class="' + (!g && run.bad ? 'err' : !g ? 'ok' : '') + '" style="width:' + Math.max(pct, g ? 1 : 0) + '%"></span></div>' : '') +
      '<button class="btn pri" data-run' + (!n || g ? ' disabled' : '') + '>' + icon('up') + (g ? 'Đang chạy…' : 'Chạy ' + n + ' thay đổi trên HEMIS') + '</button>';
  }
};
