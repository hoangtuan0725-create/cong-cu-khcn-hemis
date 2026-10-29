// Lấy dữ liệu từ KHCN và HEMIS (qua tiện ích), giữ trong bộ nhớ và lưu lại trên máy.
import { norm, toISO, MAP, matchDM, grpOf, pool, DV } from './core.js';
import * as B from './bridge.js';
import * as S from './store.js';

/* ---- su kien don gian: man hinh dang ky de ve lai khi du lieu doi ---- */
const subs = {};
export const on = (ev, fn) => { (subs[ev] = subs[ev] || []).push(fn); };
export const emit = (ev, x) => (subs[ev] || []).forEach(fn => { try { fn(x); } catch (e) { console.error(e); } });

/* Du lieu dang dung (dong bo voi IndexedDB) */
export const D = {
  scan: null,   // { f, t, at, recs }  ket qua quet nam bao cao
  stats: null,  // { f, t, at, arts, nNew } du lieu thong ke nhieu nam
  loai: null,   // 14 loai cong bo theo dung thu tu KHCN
  hemis: null,  // { at, list } bai bao cua Truong tren HEMIS
  busy: {}      // viec dang chay: { scan: 'Dang ...' }
};
export const loadCache = async () => {
  const [scan, stats, loai, hemis] = await Promise.all(['scan', 'stats', 'loai', 'hemis'].map(k => S.get('data.' + k)));
  Object.assign(D, { scan: scan || null, stats: stats || null, loai: loai || null, hemis: hemis || null });
};
const busy = (k, txt) => { if (txt) D.busy[k] = txt; else delete D.busy[k]; emit('busy', k); };

/* ===================== KHCN ===================== */
const rowsOf = doc => [...doc.querySelectorAll('table tr')].slice(1);
const cellTxt = c => c.innerText.trim().replace(/\s+/g, ' ');
const parseList = s => String(s || '').split(/[,;]\s*/).map(x => x.trim()).filter(Boolean).map(x => { const m = x.match(/^(.*?)\s*<([^>]+)>\s*$/); return m ? { n: m[1].trim(), u: m[2].trim() } : { n: x, u: '' }; });

/* Danh sach bai va trang thai duyet trong khoang ngay (f, t dang yyyy-mm-dd) */
const fetchList = async (f, t, say) => {
  say('Đang lấy danh sách bài báo…');
  const d = await B.khcn('/TrichXuatCongBo?from=' + f + '&target=' + t);
  const rows = rowsOf(d).map(r => [...r.children].map(cellTxt));
  const xd = np => B.khcn('/CongBo/XuatDuLieu?page=1&currentFilter=&from=' + f + '&target=' + t + '&curprivate=false&loai=null&diachi=null&khoa=&nopoint=' + np);
  const titles = doc => new Set(rowsOf(doc).map(r => norm(r.children[1] ? r.children[1].innerText : '')));
  say('Đang lấy trạng thái phê duyệt…');
  const [all, ap, cs, nc] = await Promise.all(['null', '1', '2', 'true'].map(xd));
  const A = titles(ap), C = titles(cs), N = titles(nc);
  const ids = {};
  rowsOf(all).forEach(r => { const m = (r.getAttribute('ondblclick') || r.innerHTML).match(/ShowDeTails\('(\d+)'/); if (m && r.children[1]) ids[norm(r.children[1].innerText)] = m[1]; });
  return rows.filter(r => r[5]).map(r => {
    const k = norm(r[5]), d = toISO(r[11]);
    return {
      id: ids[k] || '', t: r[5], j: r[6] || '', l: r[7] || '', q: r[8] || '', iff: parseFloat(String(r[9]).replace(',', '.')) || 0, hdp: parseFloat(String(r[10]).replace(',', '.')) || 0,
      dRaw: r[11] || '', d, y: d ? +d.slice(0, 4) : 0, gio: r[12] || '', tien: r[13] || '', vol: r[14] || '', iss: r[15] || '', pg: r[16] || '', au: r[1] || '',
      ap: A.has(k), cs: C.has(k), nc: N.has(k), st: A.has(k) ? 'Đã phê duyệt' : C.has(k) ? 'Cần chỉnh sửa' : 'Chưa phê duyệt'
    };
  });
};

/* 14 loai cong bo dung nhu o chon "Tat ca moi loai cong bo" tren KHCN */
const pickLoai = doc => { const s = [...doc.querySelectorAll('select')].find(x => x.options.length > 3 && /loại công bố/i.test((x.options[0] || {}).text || '')); return s ? [...s.options].slice(1).map(o => o.text.trim()).filter(Boolean) : null; };
const loadLoai = async () => {
  for (const u of ['/', '/CongBo', '/CongBo/Index']) {
    let L = null; try { L = pickLoai(await B.khcn(u)); } catch (e) { if (B.isLogin(e)) throw e; }
    if (L && L.length) { D.loai = L; await S.set('data.loai', L); return; }
  }
};

/* Quet nam bao cao (man Quet & kiem tra) */
export const scan = async (f, t) => {
  if (D.busy.scan) return;
  try {
    const recs = await fetchList(f, t, s => busy('scan', s));
    D.scan = { f, t, at: Date.now(), recs };
    await S.set('data.scan', D.scan);
    emit('scan');
  } finally { busy('scan'); }
};

/* Can bo theo bo mon: luu 7 ngay */
const loadUsers = async (fresh, say) => {
  let um = await S.get('khcn.users');
  if (!fresh && um && Date.now() - um.t < 7 * 864e5) return um.map;
  say('Đang lấy danh sách cán bộ theo bộ môn…');
  const dc = await B.khcn('/admin/Users/GetDiaChi', { searchdiachi: '' });
  const units = [...dc.querySelectorAll('tr')].slice(1).map(r => { const td = r.querySelectorAll('td'); const m = r.innerHTML.match(/EditDiaChi\/(\d+)/); return td.length > 2 && m ? { id: m[1], bm: td[1].innerText.trim(), khoa: td[2].innerText.trim() } : null; }).filter(Boolean);
  /* can bo thuoc nhieu don vi: uu tien don vi chuyen mon hon Ban Giam hieu, doan the */
  const low = k => /Ban Giám hiệu|Hội đồng Trường|Văn phòng Đảng|công đoàn|Đoàn thanh niên/i.test(k);
  const map = {};
  await pool(units, 6, async un => {
    const x = await B.khcn('/admin/Users/GetUserInDiaChi?dc=' + un.id, { id: un.id });
    [...x.querySelectorAll('tr')].slice(1).forEach(r => { const td = r.querySelectorAll('td'); if (td.length > 2) { const u = td[2].innerText.trim(); if (u && (!map[u] || (low(map[u][1]) && !low(un.khoa)))) map[u] = [un.bm, un.khoa]; } });
  });
  await S.set('khcn.users', { t: Date.now(), map });
  return map;
};

/* Tai du lieu thong ke trong khoang ngay (man Bang tong hop, Danh sach bai) */
export const loadStats = async (f, t, fresh) => {
  if (D.busy.stats) return;
  const say = s => busy('stats', s);
  try {
    const recs = await fetchList(f, t, say);
    say('Đang đọc 14 loại công bố…');
    await loadLoai();
    const M = await loadUsers(fresh, say);
    const det = (fresh ? null : await S.get('khcn.detail')) || {};
    const need = [...new Set(recs.map(r => r.id).filter(id => id && !det[id]))];
    let done = 0;
    say('Đang lấy chi tiết tác giả: 0/' + need.length + ' bài…');
    await pool(need, 6, async id => {
      const x = await B.khcn('/CongBo/DetailsCongBo', { id });
      const dd = {}; x.querySelectorAll('dt').forEach(dt => { const v = dt.nextElementSibling; if (v && v.tagName === 'DD') dd[dt.innerText.trim()] = v.innerText.trim().replace(/\s+/g, ' '); });
      det[id] = { f: (x.getElementById('listchutri') || {}).innerText || dd['TG thứ nhất'] || '', c: (x.getElementById('chiutrachnhiem') || {}).innerText || dd['TG chịu trách nhiệm'] || '', o: (x.getElementById('listthamgia') || {}).innerText || dd['Đồng tác giả'] || '', hd: dd['Tên HĐCD'] || '', ht: dd['Loại hỗ trợ kinh phí'] || '', nxb: dd['Nhà xuất bản'] || '' };
      done++; if (done % 10 === 0) say('Đang lấy chi tiết tác giả: ' + done + '/' + need.length + ' bài…');
      if (done % 100 === 0) await S.set('khcn.detail', det);
    });
    await S.set('khcn.detail', det);
    const seen = new Set();
    const arts = recs.map(r => {
      const k = norm(r.t); if (seen.has(k)) return null; seen.add(k);
      const Dt = det[r.id] || {}, m = MAP(r.l);
      const key = a => a.u ? 'u:' + a.u.toLowerCase() : 'n:' + norm(a.n);
      const byK = new Map();
      const add = (a, role) => { const kk = key(a); if (!kk || kk === 'n:') return; let x = byK.get(kk); if (!x) { x = { n: a.n, u: a.u, first: false, corr: false }; byK.set(kk, x); } if (a.u && !x.u) x.u = a.u; if (role) x[role] = true; };
      parseList(r.au).forEach(a => add(a)); parseList(Dt.f).forEach(a => add(a, 'first')); parseList(Dt.c).forEach(a => add(a, 'corr')); parseList(Dt.o).forEach(a => add(a));
      const authors = [...byK.values()].map(a => { const mm = a.u ? M[a.u] || M[a.u.toLowerCase()] : null; return Object.assign(a, { tlu: !!a.u, bm: a.u ? (mm ? mm[0] : '(chưa rõ bộ môn)') : '', khoa: a.u ? (mm ? mm[1] : '(chưa rõ đơn vị)') : '' }); });
      return {
        id: r.id, t: r.t, j: r.j, l: r.l, q: r.q && r.q !== 'NONE' ? r.q : 'Không có Q', iff: r.iff, hdp: r.hdp, d: r.d, y: r.y, gio: r.gio, tien: r.tien, vol: r.vol, iss: r.iss, pg: r.pg,
        /* Gio KH doc kieu 12,5; tien bo het dau cham/phay (chua thu voi du lieu that) */
        gioN: parseFloat(String(r.gio).replace(/\s/g, '').replace(',', '.')) || 0, tienN: +String(r.tien).replace(/[^\d]/g, '') || 0,
        st: r.st, nc: r.nc ? 'Không áp dụng tính' : 'Áp dụng tính', hd: Dt.hd || '(không ghi)', ht: Dt.ht || '(không ghi)', grp: grpOf(m, r.j, r.d, r.y),
        dm: m && m.p === 1 && !m.wos ? ({ ok: 'Đúng tên', near: 'Tên gần đúng', no: 'Không có trong danh mục' })[matchDM(r.j).lv] : 'Không áp dụng (WoS/Scopus, kỷ yếu)',
        authors, nTlu: authors.filter(a => a.tlu).length, nAll: authors.length
      };
    }).filter(Boolean);
    D.stats = { f, t, at: Date.now(), arts, nNew: need.length };
    await S.set('data.stats', D.stats);
    emit('stats');
  } finally { busy('stats'); }
};

/* ===================== HEMIS ===================== */
export const HEMIS_API = '/gwdev/nckh/v5/KHCN_BAI_BAO_KHOA_HOC';
export const loadHemis = async () => {
  if (D.busy.hemis) return D.hemis;
  try {
    busy('hemis', 'Đang lấy bài báo của Trường trên HEMIS…');
    const all = [];
    for (let p = 1; p <= 50; p++) {
      const j = await B.hemis('POST', HEMIS_API + '/GetData', { filters: [{ valueIsField: false, filters: [], stringCompareOption: 0, field: 'doN_VI_ID', operator: 'eq', value: JSON.stringify(DV) }], sorts: [], includes: [], pageInfo: { page: p, pageSize: 200 } });
      all.push(...(j.data || []));
      busy('hemis', 'Đang lấy bài báo của Trường trên HEMIS: ' + all.length + ' bài…');
      if (!j.data || j.data.length < 200) break;
    }
    D.hemis = { at: Date.now(), list: all };
    await S.set('data.hemis', D.hemis);
    emit('hemis');
    return D.hemis;
  } finally { busy('hemis'); }
};
