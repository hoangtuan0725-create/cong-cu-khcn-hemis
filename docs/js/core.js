// Hàm dùng chung và quy tắc nghiệp vụ (giữ nguyên từ bản cũ)
import { DMKHCN } from './danhmuc.js';

export const DV = '452d0027-e4c1-44d1-9efb-befb8db8840d';
export const APP_VER = '2026.10.30';

export const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/[^\p{L}\p{N}]/gu, '');
export const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const pad = n => String(n).padStart(2, '0');
export const toISO = s => { const m = String(s || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); return m ? m[3] + '-' + pad(m[2]) + '-' + pad(m[1]) : null; };
export const vnDate = iso => iso ? iso.split('-').reverse().join('/') : '';
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const fmtTime = t => { const d = new Date(t); return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ' ngày ' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1); };
export const nf = (v, d = 0) => (isFinite(v) ? v : 0).toLocaleString('vi-VN', { maximumFractionDigits: d, minimumFractionDigits: d });
export const n2 = v => Number.isInteger(v) ? v.toLocaleString('vi-VN') : (Math.round(v * 100) / 100).toLocaleString('vi-VN');
/* doc so kieu Viet Nam: 1.234.567 hoac 12,5 */
export const num = v => { let t = String(v == null ? '' : v).replace(/\s/g, ''); if (!t) return 0; if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.'); else if (!/^\d+\.\d{1,2}$/.test(t)) t = t.replace(/\./g, ''); const n = parseFloat(t); return isNaN(n) ? 0 : n; };

export const pool = async (items, n, fn) => { let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; await fn(items[k], k); } })); };

/* Tai file CSV mo duoc bang Excel (co BOM UTF-8) */
export const downloadCsv = (name, lines) => {
  const q = s => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
  const csv = String.fromCharCode(65279) + lines.map(l => l.map(q).join(',')).join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = name + ' ' + new Date().toISOString().slice(0, 10) + '.csv'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
};
export const tsv = lines => lines.map(l => l.map(c => String(c == null ? '' : c).replace(/[\t\r\n]+/g, ' ')).join('\t')).join('\r\n');

/* Quy tac ghep loai KHCN -> HEMIS: p = phan loai (1 tap chi, 2 ky yeu); qt = tap chi quoc te; tn = tap chi trong nuoc */
export const MAP = l => {
  l = String(l || '');
  if (/SCIE|SSCI|^Tạp chí ISI/.test(l)) return { p: 1, qt: '01', wos: 1 };
  if (/^Tạp chí SCOPUS/i.test(l)) return { p: 1, qt: '02', wos: 1 };
  if (/quốc tế khác|SPECIAL/i.test(l)) return { p: 1, qt: '04' };
  if (/hội đồng chức danh GSNN/i.test(l)) return { p: 1, tn: '01' };
  if (/Bài thông tin/i.test(l)) return { p: 1, tn: '02', info: 1 };
  if (/Thủy lợi và Môi trường/i.test(l)) return { p: 1, tn: '01' };
  if (/ISI hoặc Scopus/i.test(l)) return { p: 2, tn: '03' };
  if (/thường niên/i.test(l)) return { p: 2, tn: '01' };
  if (/kỷ yếu|Báo cáo học thuật/i.test(l)) return { p: 2, tn: '06' };
  return null;
};
export const QM = { Q1: '01', Q2: '02', Q3: '03', Q4: '04' };
export const QN = { '01': 'Q1', '02': 'Q2', '03': 'Q3', '04': 'Q4' };
export const DMQT = { '01': 'QT: Web of Science', '02': 'QT: Scopus', '03': 'QT: ACI', '04': 'QT: Khác' };
export const DMTN = { '01': 'TN: HĐGSNN tính điểm', '02': 'TN: HĐGSNN không tính', '03': 'TN: Web of Science', '04': 'TN: Scopus', '05': 'TN: ACI', '06': 'TN: Khác' };
export const shortType = l => { const m = MAP(l); if (!m) return 'Không rõ'; if (m.qt === '01') return 'WoS'; if (m.qt === '02') return 'Scopus'; if (m.qt) return 'Quốc tế khác'; if (m.info) return 'Bài thông tin'; return m.p === 2 ? 'Kỷ yếu' : 'Trong nước'; };

/* ===== So khop ten tap chi voi Danh muc Bo KH&CN ===== */
const nkey = s => String(s || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/&/g, ' va ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/^(ky |tap chi |tao chi )+/, '').replace(/^(ky |tap chi )+/, '');
const kclean = k => k.replace(/\b(p |e )?issn\b.*$/, '').replace(/\b(so|no|vol|volume|tap|thang|issue|quyen)\s*\d.*$/, '').replace(/\b(19|20)\d{2}\b.*$/, '').replace(/\bso tieng (viet|anh)\b/g, '').replace(/\btieng (viet|anh)\b/g, '').replace(/\bban (in|dien tu)\b/g, '').replace(/\s+/g, ' ').trim();
const DMSTOP = new Set('tap chi ky khoa hoc va cong nghe ky thuat truong dai journal of science and technology the research viet nam vietnam international so ban dien tu online university review studies in on for'.split(' '));
const dtok = s => new Set(s.split(' ').filter(w => w.length > 1 && !DMSTOP.has(w)));
const DMIDX = (() => { const m = new Map(); DMKHCN.forEach((names, i) => names.forEach(n => { const k = nkey(n.replace(/\([^)]*\)/g, ' ')); [k, kclean(k)].forEach(x => { if (x && !m.has(x)) m.set(x, i); }); })); return m; })();
const bigr = s => { const a = new Map(); for (let i = 0; i < s.length - 1; i++) { const g = s.substr(i, 2); a.set(g, (a.get(g) || 0) + 1); } return a; };
const dice = (a, b) => { if (a.length < 2 || b.length < 2) return 0; const A = bigr(a), Bm = bigr(b); let n = 0; A.forEach((v, g) => { n += Math.min(v, Bm.get(g) || 0); }); return 2 * n / (a.length + b.length - 2); };
const jac = (A, Bs) => { if (!A.size || !Bs.size) return 0; let n = 0; A.forEach(x => { if (Bs.has(x)) n++; }); return n / (A.size + Bs.size - n); };
const DMCACHE = new Map();
/* lv = ok (dung ten) | near (gan dung, can sua ten) | no (khong thuoc danh muc) */
export const matchDM = j => {
  if (DMCACHE.has(j)) return DMCACHE.get(j);
  const raw = nkey(j); let res = { lv: 'no', name: '' };
  if (raw) {
    if (DMIDX.has(raw)) res = { lv: 'ok', name: DMKHCN[DMIDX.get(raw)][0] };
    else {
      const c = kclean(nkey(String(j).replace(/\([^)]*\)/g, ' ')));
      if (DMIDX.has(c)) res = { lv: 'near', name: DMKHCN[DMIDX.get(c)][0] };
      else {
        const D1 = dtok(c); let best = null, bs = 0;
        if (D1.size) DMIDX.forEach((i, k) => {
          const jj = jac(D1, dtok(k)); if (jj < 0.5) return;
          let sc = 0;
          if (k.length >= 12 && c.includes(k) && c.length - k.length <= 40) sc = 0.9 + k.length / 1000;
          else if (c.length >= 12 && k.includes(c) && k.length - c.length <= 20) sc = 0.88 + c.length / 1000;
          else { const d = dice(c, k); if (d >= 0.8) sc = d; }
          sc = sc ? sc + jj / 100 : 0;
          if (sc > bs) { bs = sc; best = i; }
        });
        if (best != null) res = { lv: 'near', name: DMKHCN[best][0] };
      }
    }
  }
  DMCACHE.set(j, res); return res;
};

/* Nhom chi so TT 83 cua mot bai tren KHCN */
export const grpOf = (m, j, d, y) => {
  if (!m) return 'Không rõ loại';
  if (m.wos || (m.p === 2 && (m.tn === '03' || m.tn === '04'))) return 'WoS/Scopus';
  const after = d ? d > '2026-09-30' : false;
  if (y >= 2026 && m.p === 1 && j && matchDM(j).lv !== 'no') return 'Trong nước được tính';
  if (m.tn === '01' && !after) return 'Trong nước được tính';
  return 'Không được tính';
};

/* He so linh vuc (TT 83): [ten, KTC (kinh phi), KBB (cong bo)] */
export const LV = [['Khoa học giáo dục và đào tạo giáo viên', 2, 1.5], ['Nghệ thuật', 2, 2], ['Nhân văn', 2, 2], ['Khoa học xã hội và hành vi', 2, 1.5], ['Báo chí và thông tin', 2, 1.5], ['Kinh doanh và quản lý', 2, 1.5], ['Pháp luật', 2, 1.5], ['Khoa học sự sống', 1.5, 1], ['Khoa học tự nhiên', 1.5, 1], ['Toán và thống kê', 1.5, 1], ['Máy tính và công nghệ thông tin', 1, 1], ['Công nghệ kỹ thuật', 1, 1], ['Kỹ thuật', 1, 1], ['Sản xuất và chế biến', 1, 1], ['Kiến trúc và xây dựng', 1.5, 1], ['Nông, lâm nghiệp và thủy sản', 1.5, 1.5], ['Thú y', 1.5, 1.5], ['Sức khỏe', 1, 1], ['Dịch vụ xã hội', 2, 2], ['Du lịch, khách sạn, thể thao và dịch vụ cá nhân', 2, 2], ['Dịch vụ vận tải', 2, 2], ['Môi trường và bảo vệ môi trường', 1.5, 1.5], ['An ninh, quốc phòng', 1, 2], ['Lĩnh vực khác', 1, 1]];
