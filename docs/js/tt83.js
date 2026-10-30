// Màn "Chỉ số TT 83": ước tính Tiêu chuẩn 6 (6.1, 6.2.1, 6.2.2) từ bài đã có trên HEMIS + số liệu xin phòng khác (lưu trên máy theo năm).
import { esc, norm, num, nf, n2, fmtTime, matchDM, LV } from './core.js';
import { downloadXlsx } from './xlsx.js';
import { icon, pill, screenHtml, blk, tabsHtml, empty, toast, regBlk, createBtn, $ } from './ui.js';
import * as S from './store.js';
import { D, loadHemis } from './data.js';
import { guide } from './huongdan.js';

const CY = new Date().getFullYear();
const YEARS = [CY + 1, CY, CY - 1, CY - 2];
let root, yr = String(S.pref('tt83.year', CY)), inp = {}, ready = false, tab = 'all', err = '', tried = false, saveT = 0;
if (!YEARS.includes(+yr)) yr = String(CY);

const opt = k => inp[k] !== false;   // hai o tick mac dinh bat
const v = id => num(inp[id]);
const GV = [['gDH', 'Giảng viên trình độ đại học', 0.5], ['gThS', 'Giảng viên trình độ thạc sĩ', 0.75], ['gTS', 'Giảng viên trình độ tiến sĩ', 1], ['gPGS', 'Giảng viên chức danh phó giáo sư', 1], ['gGS', 'Giảng viên chức danh giáo sư', 1]];
const COLS = ['SV chính quy', 'SV kết hợp', 'SV từ xa', 'Học viên CH', 'NCS'];
const GL = { P1: 'P1 (trong nước)', P2: 'P2 (WoS/Scopus)', no: 'Không tính' };

const loadInp = async () => { ready = false; inp = (await S.get('tc6.' + yr)) || {}; ready = true; };
const saveSoon = () => {
  if (!ready) return;
  const y = yr, data = JSON.parse(JSON.stringify(inp));
  clearTimeout(saveT); saveT = setTimeout(() => S.set('tc6.' + y, data), 250);
};

/* ---- Phan loai bai HEMIS nam Y thanh P1 / P2 / khong tinh (nho lai ket qua, chi tinh lai khi doi nam, o tick hoac du lieu) ---- */
let memo = null, memoKey = '';
const classify = () => {
  const H = D.hemis, Y = +yr, ky = opt('ky');
  const key = [yr, ky, H.at, D.scan ? D.scan.at : 0, D.stats ? D.stats.at : 0].join('|');
  if (memo && key === memoKey) return memo;
  /* ngay cong bo lay tu bai da quet / da tai thong ke (HEMIS khong co ngay) */
  const dates = {};
  if (D.stats) D.stats.arts.forEach(a => { if (a.d) dates[norm(a.t)] = a.d; });
  if (D.scan) D.scan.recs.forEach(r => { if (r.d) dates[norm(r.t)] = r.d; });
  const seen = new Set(), rows = [];
  let p1 = 0, p2 = 0, p1dm = 0, p1near = 0, p1hd = 0, noDate = 0, no = 0, p2j = 0, p2k = 0;
  H.list.filter(x => +x.naM_CONG_BO === Y).forEach(x => {
    const k = norm(x.teN_BAI_BAO); if (k.length > 5 && seen.has(k)) return; seen.add(k);
    const qt = x.taP_CHI_QUOC_TE, tn = x.taP_CHI_TRONG_NUOC;
    let g, dmName = '', nodate = false;
    if (qt === '01' || qt === '02') { g = 'P2'; if (x.phaN_LOAI === 2) p2k++; else p2j++; }
    else if (tn === '03' || tn === '04') { g = ky ? 'P2' : 'no'; if (ky) p2k++; }
    else {
      /* Tu nam 2026 (TT 83): tinh bai tap chi thuoc danh muc Bo KH&CN; bai thuoc danh muc HDGSNN chi tinh neu cong bo den 30/9/2026 */
      const d = dates[k], after = d ? d > '2026-09-30' : false;
      const dm = (Y >= 2026 && x.phaN_LOAI === 1 && x.teN_TAP_CHI) ? matchDM(x.teN_TAP_CHI) : { lv: 'no' };
      if (dm.lv !== 'no') { g = 'P1'; p1dm++; if (dm.lv === 'near') { p1near++; dmName = dm.name; } }
      else if (tn === '01' && !after) { g = 'P1'; p1hd++; if (!d && Y >= 2026) { noDate++; nodate = true; } }
      else g = 'no';
    }
    if (g === 'P2') p2++; else if (g === 'P1') p1++; else no++;
    rows.push({ x, g, dmName, nodate });
  });
  memoKey = key; memo = { rows, p1, p2, p1dm, p1near, p1hd, noDate, no, p2j, p2k };
  return memo;
};

/* ---- Cong thuc TT 83 (giu nguyen ban cu) ---- */
const compute = () => {
  const Y = +yr, coTS = opt('ts'), C = classify();
  const p3 = v('p3'), p4 = v('p4'), P = C.p1 + 2 * C.p2 + 3 * p3 + 5 * p4;
  const gd = GV.reduce((s, g) => s + v(g[0]) * g[2], 0), GQD = v('gQD') || gd;
  let N = 0, sTC = 0, sBB = 0, nLV = 0;
  const Ms = LV.map((l, i) => {
    const a = [0, 1, 2, 3, 4].map(c => v('m' + i + '_' + c)), M = a[0] + 0.8 * a[1] + 0.5 * a[2] + 1.5 * a[3] + 2 * a[4];
    N += M; sTC += M * l[1]; sBB += M * l[2]; if (M) nLV++; return M;
  });
  const KTC = N ? sTC / N : 1, KBB = N ? sBB / N : 1;
  const r = [0, 1, 2].map(i => v('r' + i)), k1 = [0, 1, 2].map(i => v('k' + i)), has61 = r.every(x => x > 0);
  const T61 = has61 ? (k1[0] / r[0] + k1[1] / r[1] + k1[2] / r[2]) / 3 * KTC : null;
  const thr621 = coTS ? 0.6 : 0.3, T621 = GQD ? P / GQD : null, T622 = GQD ? C.p2 * KBB / GQD : null;
  const gap621 = T621 != null && T621 < thr621 ? Math.ceil(thr621 * GQD - P) : 0;
  const gap622 = T622 != null && T622 < 0.3 ? Math.ceil(0.3 * GQD / KBB - C.p2) : 0;
  return Object.assign({ Y, coTS, p3, p4, P, gd, GQD, N, nLV, Ms, KTC, KBB, has61, T61, T621, T622, thr621, gap621, gap622 }, C);
};

/* ---- Ve cac phan thay doi khi go so ---- */
const meter = (val, thr, applies) => {
  if (val == null) return '<div class="meter" aria-hidden="true"></div>';
  const w = Math.min(100, Math.max(0, val / (thr / 0.6) * 100));
  return '<div class="meter" aria-hidden="true"><span class="' + (!applies ? '' : val >= thr ? 'ok' : 'err') + '" style="width:' + w.toFixed(1) + '%"></span>' + (applies ? '<i class="thr"></i>' : '') + '</div>';
};
const status = (val, thr, applies) => val == null ? pill('mut', 'Thiếu số liệu', 'info') : !applies ? pill('mut', 'Không áp dụng', 'info') : val >= thr ? pill('ok', 'Đạt') : pill('err', 'Chưa đạt');
const kpi = (title, val, txt, thr, applies, note) => '<div class="card kpi"><div class="kh"><h3>' + title + '</h3>' + status(val, thr, applies) + '</div>' +
  '<div class="big' + (val == null ? ' muted' : '') + '">' + (val == null ? '—' : txt) + '</div>' + meter(val, thr, applies) + '<div class="muted small">' + esc(note) + '</div></div>';

const kpisHtml = R => {
  const ts = R.coTS ? 'có đào tạo tiến sĩ' : 'không đào tạo tiến sĩ';
  const need = R.GQD ? '' : ' · Cần GQĐ (Phòng Tổ chức cán bộ)';
  const klv = R.N ? '' : ' · KLV tạm = 1 (chưa có số người học)';
  return kpi('6.2.1 Sản phẩm KHCN / GV quy đổi', R.T621, R.T621 == null ? '' : nf(R.T621, 3), R.thr621, true,
      'Yêu cầu ≥ ' + String(R.thr621).replace('.', ',') + ' (' + ts + ')' + (R.gap621 ? ' · còn thiếu ' + R.gap621 + ' sản phẩm quy đổi (khoảng ' + Math.ceil(R.gap621 / 2) + ' bài WoS/Scopus hoặc ' + R.gap621 + ' bài trong nước)' : '') + need) +
    kpi('6.2.2 WoS/Scopus × KLV / GV quy đổi', R.T622, R.T622 == null ? '' : nf(R.T622, 3), 0.3, R.coTS,
      (R.coTS ? 'Yêu cầu ≥ 0,3' + (R.gap622 ? ' · còn thiếu khoảng ' + R.gap622 + ' bài WoS/Scopus' : '') : 'Không áp dụng (không đào tạo tiến sĩ)') + need + klv) +
    kpi('6.1 Tỷ trọng thu KHCN &amp; ĐMST', R.T61, R.T61 == null ? '' : nf(R.T61 * 100, 2) + '%', 0.05, R.coTS,
      (R.coTS ? 'Yêu cầu ≥ 5%' : 'Không áp dụng (không đào tạo tiến sĩ)') + (R.has61 ? '' : ' · Cần R, R1 của 3 năm (Phòng Tài chính – Kế toán)') + klv);
};

const put = (key, val, plain) => { const e = root.querySelector('[data-v="' + key + '"]'); if (!e) return; e.textContent = plain ? val : nf(val, 0); if (!plain) e.classList.toggle('z', !val); };
const paint = R => {
  const kp = $('[data-kpis]', root); if (kp) kp.innerHTML = kpisHtml(R);
  put('p1', R.p1); put('p1q', R.p1); put('p2', R.p2); put('p2q', 2 * R.p2); put('p3q', 3 * R.p3); put('p4q', 5 * R.p4);
  put('P', n2(R.P), true);
  put('pnote', (R.Y >= 2026 ? 'P1: ' + R.p1dm + ' bài trên tạp chí thuộc danh mục Bộ KH&CN' + (R.p1near ? ' (' + R.p1near + ' bài tên tạp chí gần đúng, nên sửa tên)' : '') + ' · ' + R.p1hd + ' bài theo danh mục HĐGSNN công bố đến 30/9/2026' + (R.noDate ? ' (' + R.noDate + ' bài chưa có ngày công bố vì chưa quét KHCN, tạm tính theo HĐGSNN)' : '') + '. ' : 'P1: bài trong nước theo danh mục HĐGSNN. ') +
    'P2: tạp chí ' + R.p2j + ', kỷ yếu ' + R.p2k + '. Không được tính: ' + R.no + ' bài (tạp chí quốc tế khác, trong nước không thuộc danh mục).', true);
  put('gqd', R.GQD ? n2(R.GQD) : '(chưa có)', true);
  R.Ms.forEach((M, i) => put('m' + i, M ? nf(M, 1) : '', true));
  put('N', R.N ? nf(R.N, 1) : '', true); put('ktc', 'KLV ' + nf(R.KTC, 3), true); put('kbb', 'KLV ' + nf(R.KBB, 3), true);
  put('lvsum', R.nLV ? 'Đã nhập ' + R.nLV + ' lĩnh vực · KLV kinh phí ' + nf(R.KTC, 2) + ' · KLV công bố ' + nf(R.KBB, 2) : 'Chưa nhập số người học (mở khối bên dưới để điền) · KLV tạm lấy bằng 1', true);
  put('foot', 'Năm ' + R.Y + ' · Tổng P = ' + n2(R.P) + (R.GQD ? ' · GQĐ = ' + n2(R.GQD) : ' · chưa có GQĐ'), true);
};

/* ---- Khung man hinh ---- */
const html = () => screenHtml({
  title: 'Chỉ số TT 83 – Tiêu chuẩn 6',
  acts: '<label class="sel">Năm báo cáo <select data-yr aria-label="Năm báo cáo">' + YEARS.map(y => '<option value="' + y + '">' + y + '</option>').join('') + '</select></label>' +
    '<button class="btn" data-reload>' + icon('refresh') + '<span>Lấy lại từ HEMIS</span></button>' + createBtn('tt83'),
  foot: true
});

const cin = (id, cls, label) => '<input class="inp num cell-in' + (cls ? ' ' + cls : '') + '" inputmode="decimal" autocomplete="off" data-in="' + id + '" value="' + esc(inp[id] || '') + '" aria-label="' + esc(label) + '">';
const row = r => '<tr><td class="nowrap">' + esc(r.x.mA_BAI_BAO) + '</td><td class="t"><b>' + esc(r.x.teN_BAI_BAO) + '</b><div class="muted">' + esc(r.x.teN_TAP_CHI || '(chưa có tên tạp chí)') + '</div></td><td>' +
  (r.g === 'P1' ? pill('ok', 'P1 trong nước') : r.g === 'P2' ? pill('info', 'P2 WoS/Scopus', 'check') : pill('mut', 'Không tính', 'info')) + '</td><td class="small">' +
  (r.dmName ? 'Tên tạp chí nên sửa thành: ' + esc(r.dmName) : r.nodate ? 'Chưa có ngày công bố, tạm tính theo HĐGSNN' : '') + '</td></tr>';

const scr = {
  id: 'tt83', title: 'Chỉ số TT 83', icon: 'gauge', group: 2, busy: ['hemis'], on: ['hemis', 'scan', 'stats'],
  init(el) {
    root = el; el.innerHTML = html();
    regBlk('tt83.kpi', { scr: 'tt83', kind: 'info', title: 'Kết quả ước tính', render: () => scr.render(), xlsx: xKpi });
    regBlk('tt83.sanpham', { scr: 'tt83', title: 'Sản phẩm KHCN trong năm', render: () => scr.render(), xlsx: xSp });
    regBlk('tt83.ds', { scr: 'tt83', title: 'Danh sách bài được tính', render: () => scr.render(), xlsx: () => xDs(tab), close: () => { tab = 'all'; } });
    const ys = $('[data-yr]', el); ys.value = yr;
    ys.onchange = async () => { yr = ys.value; S.setPref('tt83.year', +yr); tab = 'all'; await loadInp(); scr.render(); };
    el.addEventListener('input', e => {
      const t = e.target.closest('[data-in]'); if (!t || !D.hemis) return;
      inp[t.dataset.in] = t.value; saveSoon(); paint(compute());
    });
    el.addEventListener('change', e => {
      const o = e.target.closest('[data-opt]'); if (!o) return;
      inp[o.dataset.opt] = o.checked; saveSoon(); scr.render();
    });
    el.addEventListener('click', async e => {
      const tb = e.target.closest('[data-tab]'); if (tb) { tab = tb.dataset.tab; scr.render(); return; }
      if (e.target.closest('[data-reload]')) { await reload(); return; }
      if (e.target.closest('[data-csv]')) xAll();
    });
    loadInp().then(() => scr.render());
  },
  render() {
    if (!D.hemis && !tried && !D.busy.hemis) { tried = true; loadHemis().catch(x => fail(x, true)); }
    const body = $('[data-body]', root), foot = $('[data-foot]', root), sub = $('[data-sub]', root), H = D.hemis;
    $('[data-yr]', root).value = yr;
    const errHtml = err ? '<div class="note err" role="alert">' + icon('alert') + '<div>' + esc(err) + '</div></div>' : '';
    if (!H) {
      sub.textContent = 'Tính từ bài báo của Trường trên HEMIS · năm báo cáo ' + yr;
      body.innerHTML = errHtml + '<div class="card">' + empty('gauge', D.busy.hemis ? 'Đang lấy danh sách bài trên HEMIS…' : 'Chưa có dữ liệu HEMIS', 'Chỉ số được tính từ bài báo của Trường đang có trên HEMIS. Anh/chị cần đăng nhập HEMIS trên Chrome.', D.busy.hemis ? '' : '<button class="btn pri" data-reload>' + icon('refresh') + 'Lấy từ HEMIS</button>') + '</div>';
      foot.innerHTML = '<span class="muted">Chưa có dữ liệu HEMIS.</span>'; return;
    }
    const R = compute(), Y = R.Y;
    const L = tab === 'all' ? R.rows : R.rows.filter(r => r.g === tab), MAXR = 500;
    const cnt = g => R.rows.filter(r => r.g === g).length;
    sub.textContent = 'Tính từ ' + H.list.length.toLocaleString('vi-VN') + ' bài trên HEMIS (lấy lúc ' + fmtTime(H.at) + ') · năm báo cáo ' + Y + ' (01/01 – 31/12)';
    const tbl = (head, rows) => '<div class="tw"><table class="tbl"><thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
    body.innerHTML = errHtml +
      blk('tt83.tuychon', 'Tuỳ chọn tính', '<div class="toolbar"><label class="chk"><input type="checkbox" data-opt="ts"' + (opt('ts') ? ' checked' : '') + '>Trường có đào tạo tiến sĩ</label>' +
        '<label class="chk"><input type="checkbox" data-opt="ky"' + (opt('ky') ? ' checked' : '') + '>Tính kỷ yếu ISI/Scopus là bài WoS/Scopus</label></div>' +
        '<div class="more">Các ô tick chỉ đổi con số ước tính trên công cụ này, không đổi gì trên HEMIS. Số liệu anh/chị nhập bên dưới được lưu trên máy này, theo từng năm.</div>', { fixed: true }) +
      blk('tt83.kpi', 'Kết quả ước tính', '<div class="stats c3" data-kpis></div>', { pad: true }) +
      '<div class="grid2">' +
      blk('tt83.sanpham', 'Sản phẩm KHCN năm ' + Y, tbl('<th>Nhóm</th><th class="num">Số lượng</th><th class="num">Hệ số</th><th class="num">Quy đổi</th>',
        '<tr><td>P1 Bài trong nước được công nhận</td><td class="num" data-v="p1"></td><td class="num">1</td><td class="num" data-v="p1q"></td></tr>' +
        '<tr><td>P2 Bài WoS/Scopus</td><td class="num" data-v="p2"></td><td class="num">2</td><td class="num" data-v="p2q"></td></tr>' +
        '<tr><td>P3 Sách chuyên khảo + giải pháp hữu ích ' + pill('mut', 'nhập tay', 'edit') + '</td><td class="num">' + cin('p3', '', 'Số sách chuyên khảo và giải pháp hữu ích') + '</td><td class="num">3</td><td class="num" data-v="p3q"></td></tr>' +
        '<tr><td>P4 Bằng sáng chế ' + pill('mut', 'nhập tay', 'edit') + '</td><td class="num">' + cin('p4', '', 'Số bằng độc quyền sáng chế') + '</td><td class="num">5</td><td class="num" data-v="p4q"></td></tr>' +
        '<tr class="tot"><td>Tổng P</td><td></td><td></td><td class="num" data-v="P"></td></tr>') +
        '<div class="more" data-v="pnote"></div><div class="more">Trên HEMIS, mục Sách và Sáng chế của Trường hiện chưa có dữ liệu nên P3, P4 phải nhập tay (trong năm báo cáo).</div>', { tools: '<span class="muted small">tự tính từ HEMIS</span>' }) +
      blk('tt83.phongkhac', 'Số liệu xin phòng khác', '<div class="more">Giảng viên quy đổi GQĐ (Phòng Tổ chức cán bộ)</div>' +
        tbl('<th>Trình độ / chức danh</th><th class="num">Hệ số</th><th class="num">Số người</th>',
          GV.map(g => '<tr><td>' + g[1] + '</td><td class="num">× ' + String(g[2]).replace('.', ',') + '</td><td class="num">' + cin(g[0], '', 'Số ' + g[1].toLowerCase()) + '</td></tr>').join('') +
          '<tr><td><b>Hoặc nhập thẳng GQĐ</b> (nếu phòng đã tính sẵn)</td><td></td><td class="num">' + cin('gQD', '', 'GQĐ do phòng Tổ chức cán bộ tính sẵn') + '</td></tr>' +
          '<tr class="tot"><td>GQĐ dùng để tính</td><td></td><td class="num" data-v="gqd"></td></tr>') +
        '<div class="more">Thu hoạt động R và thu KHCN, ĐMST R1, 3 năm, đơn vị đồng (Phòng Tài chính – Kế toán)</div>' +
        tbl('<th></th><th class="num">Năm ' + Y + '</th><th class="num">Năm ' + (Y - 1) + '</th><th class="num">Năm ' + (Y - 2) + '</th>',
          '<tr><td>R: Tổng thu hoạt động</td>' + [0, 1, 2].map(i => '<td class="num">' + cin('r' + i, 'w', 'R năm ' + (Y - i)) + '</td>').join('') + '</tr>' +
          '<tr><td>R1: Thu từ KHCN và ĐMST</td>' + [0, 1, 2].map(i => '<td class="num">' + cin('k' + i, 'w', 'R1 năm ' + (Y - i)) + '</td>').join('') + '</tr>') +
        '<div class="more">Người học theo lĩnh vực (Phòng Đào tạo): <b data-v="lvsum"></b></div>', { tools: '<span class="muted small">tự lưu trên máy</span>', fixed: true }) +
      '</div>' +
      blk('tt83.nguoihoc', 'Người học theo lĩnh vực (Phòng Đào tạo), để tính hệ số KLV',
        '<div class="more">Chỉ điền các lĩnh vực trường có đào tạo. M = SV chính quy × 1 + SV kết hợp × 0,8 + SV từ xa × 0,5 + học viên cao học × 1,5 + NCS × 2. KLV (kinh phí) dùng cho 6.1, KLV (công bố) dùng cho 6.2.2.</div>' +
        tbl('<th>Lĩnh vực</th>' + COLS.map(c => '<th class="num">' + c + '</th>').join('') + '<th class="num">M</th><th class="num">Hệ số KTC</th><th class="num">Hệ số KBB</th>',
          LV.map((l, i) => '<tr><td>' + esc(l[0]) + '</td>' + [0, 1, 2, 3, 4].map(c => '<td class="num">' + cin('m' + i + '_' + c, '', COLS[c] + ', ' + l[0]) + '</td>').join('') + '<td class="num" data-v="m' + i + '"></td><td class="num">' + nf(l[1], 1) + '</td><td class="num">' + nf(l[2], 1) + '</td></tr>').join('') +
          '<tr class="tot"><td>Tổng N</td><td colspan="5"></td><td class="num" data-v="N"></td><td class="num" data-v="ktc"></td><td class="num" data-v="kbb"></td></tr>'), { def: true, fixed: true }) +
      blk('tt83.ds', 'Danh sách bài được tính năm ' + Y, tbl('<th>Mã HEMIS</th><th class="wt">Bài báo</th><th>Được tính vào</th><th>Ghi chú</th>',
        L.length ? L.slice(0, MAXR).map(row).join('') : '<tr><td colspan="4">' + empty('check', 'Không có bài nào trong mục này', '') + '</td></tr>') +
        (L.length > MAXR ? '<div class="more">Đang hiện ' + MAXR + '/' + L.length + ' bài. Bấm Excel ở góc bảng để lấy đủ.</div>' : ''),
        { def: true, headHtml: tabsHtml([['all', 'Tất cả (' + R.rows.length + ')'], ['P1', 'P1 (' + cnt('P1') + ')'], ['P2', 'P2 (' + cnt('P2') + ')'], ['no', 'Không tính (' + cnt('no') + ')']], tab) });
    foot.innerHTML = '<span data-v="foot"></span><div class="sp"></div><button class="btn pri" data-csv>' + icon('dl') + 'Tải Excel</button>';
    paint(R);
  }
};
export default scr;

const fail = (x, quiet) => { if (x.code === 'noext' && !quiet) guide(); err = x.message; toast(x.message, 'err'); scr.render(); };
async function reload() {
  err = '';
  try { await loadHemis(); toast('Đã lấy lại danh sách bài trên HEMIS'); } catch (x) { fail(x); }
}

/* ---- Xuat Excel (day du; so de dang so) ---- */
const KQ = (v, thr, ap) => v == null ? 'Thiếu số liệu' : !ap ? 'Không áp dụng' : v >= thr ? 'Đạt' : 'Chưa đạt';
const GLN = { all: 'Tất cả', P1: 'P1', P2: 'P2', no: 'Không tính' };
const shKpi = R => ({ name: 'Chỉ số', head: 1, rows: [['Chỉ số', 'Yêu cầu (≥)', 'Thực tế', 'Đơn vị', 'Kết quả'],
  ['6.1 Tỷ trọng thu KHCN và ĐMST (trung bình 3 năm × KLV kinh phí)', R.coTS ? 5 : '', R.T61 == null ? '' : R.T61 * 100, '%', KQ(R.T61, 0.05, R.coTS)],
  ['6.2.1 Sản phẩm KHCN quy đổi / giảng viên quy đổi', R.thr621, R.T621 == null ? '' : R.T621, 'tỷ số', KQ(R.T621, R.thr621, true)],
  ['6.2.2 Bài WoS/Scopus × KLV công bố / giảng viên quy đổi', R.coTS ? 0.3 : '', R.T622 == null ? '' : R.T622, 'tỷ số', KQ(R.T622, 0.3, R.coTS)],
  ['GQĐ (giảng viên quy đổi)', '', R.GQD || '', 'người', ''], ['KLV kinh phí', '', R.KTC, 'hệ số', ''], ['KLV công bố', '', R.KBB, 'hệ số', '']] });
const shSp = R => ({ name: 'Sản phẩm', head: 1, totals: [5], rows: [['Nhóm sản phẩm năm ' + R.Y, 'Số lượng', 'Hệ số', 'Quy đổi'],
  ['P1 Bài trong nước được công nhận', R.p1, 1, R.p1], ['P2 Bài WoS/Scopus', R.p2, 2, 2 * R.p2], ['P3 Sách chuyên khảo + giải pháp hữu ích', R.p3, 3, 3 * R.p3], ['P4 Bằng sáng chế', R.p4, 5, 5 * R.p4], ['Tổng P', '', '', R.P]] });
const shDs = (R, g) => ({ name: GLN[g] === 'Tất cả' ? 'Danh sách bài' : 'Bài ' + GLN[g], head: 1, freezeCols: 1, rows: [['Mã HEMIS', 'Tên bài báo', 'Tạp chí', 'Được tính vào', 'Ghi chú']]
  .concat(R.rows.filter(r => g === 'all' || r.g === g).map(r => [r.x.mA_BAI_BAO, r.x.teN_BAI_BAO, r.x.teN_TAP_CHI, GL[r.g], r.dmName ? 'Tên tạp chí nên sửa thành: ' + r.dmName : r.nodate ? 'Chưa có ngày công bố, tạm tính theo HĐGSNN' : ''])) });
const withR = fn => { if (!D.hemis) { toast('Chưa có dữ liệu HEMIS để tải.', 'err'); return; } fn(compute()); };
const xKpi = () => withR(R => downloadXlsx('Chỉ số TT 83 năm ' + R.Y, shKpi(R)));
const xSp = () => withR(R => downloadXlsx('Sản phẩm KHCN năm ' + R.Y, shSp(R)));
const xDs = g => withR(R => downloadXlsx('Bài được tính TT 83 năm ' + R.Y + ' ' + GLN[g], shDs(R, g)));
const xAll = () => withR(R => downloadXlsx('Thống kê chỉ số TT 83 năm ' + R.Y, [shKpi(R), shSp(R), shDs(R, 'all')]));
