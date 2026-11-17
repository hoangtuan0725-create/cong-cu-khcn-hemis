// Kiểm thử trang công cụ với KHCN và HEMIS giả lập. Chạy: node "kiểm thử/gia-lap.test.js"
// Trang docs/ được phục vụ tại địa chỉ GitHub Pages thật (chặn lại bằng Playwright); tiện ích cầu nối được giả lập
// bằng một đoạn mã nghe postMessage giống extension/bridge.js + background.js.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
const APP = 'https://hoangtuan0725-create.github.io/cong-cu-khcn-hemis/';
const DOCS = path.join(__dirname, '..', 'docs');
const OUT = process.env.ANH || path.join(os.tmpdir(), 'anh-kiem-thu');
fs.mkdirSync(OUT, { recursive: true });

/* ---- Du lieu KHCN gia ---- */
const KH = ['Khoa Công trình', 'Khoa Cơ khí', 'Khoa Kinh tế và Quản lý', 'Khoa CNTT'];
const LO = ['Tạp chí SCIE', 'Tạp chí SCOPUS', 'Tạp chí trong danh mục hội đồng chức danh GSNN', 'Kỷ yếu hội nghị ISI hoặc Scopus', 'Kỷ yếu hội nghị quốc gia'];
let seed = 7; const R = n => { seed = (seed * 9301 + 49297) % 233280; return Math.floor(seed / 233280 * n); };
const users = []; KH.forEach((k, i) => { for (let j = 0; j < 5; j++) users.push({ u: 'u' + i + j, n: 'GV ' + i + j, k, bm: 'BM ' + i + (j % 2) }); });
const JN = ['Water Resources Management', 'Journal of Hydrology', 'Tạp chí Khoa học Kỹ thuật Thủy lợi và Môi trường', 'Tap chi Khoa hoc ky thuat Thuy loi va MT', 'Ocean Engineering'];
const arts = [];
for (let i = 0; i < 400; i++) {
  const a = [users[R(20)], users[R(20)]], l = LO[R(5)], y = 2021 + R(6);
  arts.push({ id: 1000 + i, t: 'Bài báo số ' + i + ' về ' + ['hồ chứa', 'đê biển', 'dòng chảy', 'bê tông'][R(4)], j: l.includes('GSNN') ? JN[2 + R(2)] : i % 37 === 0 ? '' : JN[R(5) % 2 ? 0 : 4], l, q: l.includes('SC') && R(5) ? 'Q' + (1 + R(4)) : 'NONE', d: i % 53 === 0 ? '' : (1 + R(27)) + '/' + (1 + R(12)) + '/' + y, a, ext: R(3) === 0, pg: R(6) ? '1-9' : '', gio: R(2) ? '12,5' : '20', tien: R(2) ? '5.000.000' : '0' });
}
const page = b => '<html><body>' + b + '</body></html>';
const tr = cells => '<tr>' + cells.map(c => '<td>' + String(c).replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</td>').join('') + '</tr>';
const toISO = s => { const m = String(s).match(/^(\d+)\/(\d+)\/(\d{4})$/); return m ? m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0') : ''; };
const inRange = (a, u) => { const d = toISO(a.d), f = u.searchParams.get('from'), t = u.searchParams.get('target'); return !d || (d >= f && d <= t); };
/* de tai cac cap: j=0 dang lam (dinh nam 2026), j=1 da xong 2025 (khong dinh), j=2 bat dau 2026, j=3 chua phe duyet; them 1 de tai nghiem thu 2026 */
const dtPass = {}; const dts = []; const SHUF = a => a.map(x => [Math.random(), x]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
[2, 3, 35, 36, 37, 38, 40, 41, 42, 51, 52, 68, 69, 1, 39].forEach(cap => { for (let j = 0; j < 4; j++) {
  const n = dts.length, bd = ['2025-01-01', '2024-01-01', '2026-03-01', '2026-02-01'][j], kt = ['2027-06-30', '2025-12-31', '2028-03-01', '2027-02-01'][j];
  dts.push({ id: 9000 + n, cap, ma: 'DT' + cap + '-' + j, ten: 'Đề tài cấp mã ' + cap + ' số ' + j + (cap === 42 && j === 0 ? ' tại tỉnh Lâm Đồng' : cap === 42 && j === 2 ? ' xâm nhập mặn ven biển' : ' về công trình ' + n), cn: 'TS. Nguyễn Văn ' + j, ap: j !== 3, bd, kt, nt: '', kp: 1000000 * (n % 7 + 1) });
} });
dts.push({ id: 9900, cap: 2, ma: 'DT2-NT', ten: 'Đề tài đã nghiệm thu năm 2026 về đê', cn: 'TS. Trần Văn B', ap: true, bd: '2023-01-01', kt: '2025-06-30', nt: '2026-02-05', kp: 5000000 });
const DTCAPS = [2, 3, 35, 36, 37, 38, 40, 41, 42, 51, 52, 68, 69];
const dtIn = (d, y) => d.ap && DTCAPS.includes(d.cap) && (d.nt ? d.nt.slice(0, 4) === y : d.bd <= y + '-12-31' && d.kt >= y + '-01-01');
const vnD = iso => iso.split('-').reverse().join('/');
const khcn = (url, form) => {
  const u = new URL(url), p = u.pathname;
  if (p === '/Home/ToanBoDeTai') { const cap = +u.searchParams.get('cap'), pg = +u.searchParams.get('page'); if (pg === 1) dtPass[cap] = (dtPass[cap] || 0) + 1; const first = dtPass[cap] === 1, B0 = dts.filter(d => d.cap === cap), L = dtPass[cap] % 2 === 0 ? B0.slice().reverse() : B0; /* lượt 1: từ trang 2 trở đi lệch một dòng (đề tài ở ranh giới bị sót), lượt sau đầy đủ */ const off = first && pg > 1 ? 1 : 0; return '<table><tr><th>Mã</th></tr>' + L.slice((pg - 1) * 3 + off, pg * 3 + off).map(d => '<tr ondblclick="ShowDeTails(\'' + d.id + '\')"><td>' + d.ma + '</td><td>' + d.ten + '</td><td>' + (d.ap ? 'Đã phê duyệt' : 'Chưa phê duyệt') + '</td><td>' + vnD(d.bd) + '</td><td>' + vnD(d.kt) + '</td></tr>').join('') + '</table>'; }
  if (p === '/Home/DetailsDeTai') { const d = dts.find(x => x.id === +form.id); return '<dl><dt>Cấp</dt><dd>Cấp ' + d.cap + '</dd><dt>Tên đề tài</dt><dd>' + d.ten + '</dd><dt>Tổng kinh phí</dt><dd>' + d.kp.toLocaleString('vi-VN') + ' đ</dd><dt>Thời gian bắt đầu/kết thúc</dt><dd>' + vnD(d.bd) + ' - ' + vnD(d.kt) + '</dd><dt>Trạng thái</dt><dd>' + (d.nt ? 'Đã nghiệm thu: ' + vnD(d.nt) : 'Chưa nghiệm thu') + '</dd><dt>Mã số</dt><dd>' + d.ma + '</dd><dt>Đơn vị chủ trì</dt><dd>Khoa Công trình</dd><dt>Chủ nhiệm</dt><dd>' + d.cn + '</dd></dl>'; }
  if (p === '/KhoaHocKhac/ToanBoKhoaHocKhac') { const lo = +u.searchParams.get('loai'), pg = +u.searchParams.get('page'); if (pg === 1) ttPass[lo] = (ttPass[lo] || 0) + 1; const first = ttPass[lo] === 1, B0 = tts.filter(d => d.loai === lo), off = first && pg > 1 ? 1 : 0; /* lượt 1: từ trang 2 lệch một dòng, lượt sau đầy đủ */ return '<table><tr><th>h</th></tr>' + B0.slice((pg - 1) * 3 + off, pg * 3 + off).map(d => '<tr ondblclick="ShowDeTails(\'' + d.id + '\')"><td>' + d.ten + '</td></tr>').join('') + '</table>'; }
  if (p === '/KhoaHocKhac/DetailsKhoaHocKhac') { const d = tts.find(x => x.id === +form.id); return '<dl><dt>Tên sáng chế</dt><dd>' + d.ten + '</dd><dt>Số bằng</dt><dd>' + d.so + '</dd><dt>Ngày cấp</dt><dd>' + d.ngay + '</dd><dt>Chủ bằng</dt><dd>' + d.chu + '</dd><dt>Tác giả</dt><dd>' + d.tg + '</dd></dl>'; }
  if (p === '/TrichXuatCongBo') return '<table><tr><th>h</th></tr>' + arts.filter(a => inRange(a, u)).map(a => tr(['1', a.a.map(x => x.n + '<' + x.u + '>').join(', ') + (a.ext ? ', Ext Author' : ''), '', '', '', a.t, a.j, a.l, a.q, '1,2', '1', a.d, a.gio, a.tien, '1', '2', a.pg])).join('') + '</table>';
  if (p === '/CongBo/XuatDuLieu') { const np = u.searchParams.get('nopoint'); const A = arts.filter(a => inRange(a, u)); const L = np === 'null' ? A : np === '1' ? A.filter(a => a.id % 3) : np === '2' ? A.filter(a => a.id % 3 === 0 && a.id % 2) : np === 'true' ? A.filter(a => a.id % 11 === 0) : []; return '<table><tr><th>h</th></tr>' + L.map(a => '<tr ondblclick="ShowDeTails(\'' + a.id + '\')"><td>1</td><td>' + a.t + '</td></tr>').join('') + '</table>'; }
  const bms = [...new Set(users.map(x => x.bm + '|' + x.k))];
  if (p === '/admin/Users/GetDiaChi') return '<table><tr><th>h</th></tr>' + bms.map((x, i) => '<tr><td>' + i + '</td><td>' + x.split('|')[0] + '</td><td>' + x.split('|')[1] + '</td><td><a href="/EditDiaChi/' + i + '">e</a></td></tr>').join('') + '</table>';
  if (p === '/admin/Users/GetUserInDiaChi') { const k = bms[+u.searchParams.get('dc')]; return '<table><tr><th>h</th></tr>' + users.filter(x => x.bm + '|' + x.k === k).map(x => tr(['1', x.n, x.u])).join('') + '</table>'; }
  if (p === '/CongBo/DetailsCongBo') { const a = arts.find(x => x.id === +form.id); return '<div id="listchutri">' + a.a[0].n + '&lt;' + a.a[0].u + '&gt;</div><div id="chiutrachnhiem">' + a.a[1].n + '&lt;' + a.a[1].u + '&gt;</div><div id="listthamgia"></div><dl><dt>Tên HĐCD</dt><dd>Thủy lợi</dd><dt>Loại hỗ trợ kinh phí</dt><dd>Hỗ trợ ' + (a.id % 2 ? 'A' : 'B') + '</dd></dl>'; }
  return '<select><option>Tất cả mọi loại công bố</option>' + LO.concat(['Tạp chí SSCI', 'Tạp chí quốc tế khác', 'Bài thông tin', 'Kỷ yếu Hội nghị KH thường niên', 'Báo cáo học thuật', 'Tạp chí ISI', 'Special issue', 'Tạp chí Thủy lợi và Môi trường', 'Loại khác']).map(x => '<option>' + x + '</option>').join('') + '</select>';
};

/* ---- HEMIS gia: luu trong bo nho ---- */
const hem = [];
arts.filter(a => a.id % 4 === 0 && a.d).forEach((a, i) => hem.push({ id: 'h' + i, doN_VI_ID: '452d0027-e4c1-44d1-9efb-befb8db8840d', mA_BAI_BAO: 'BBKH' + toISO(a.d).slice(0, 4) + '-' + (i + 1), teN_BAI_BAO: a.t, teN_TAP_CHI: a.j, naM_CONG_BO: +toISO(a.d).slice(0, 4) + (i % 9 === 0 ? 1 : 0), phaN_LOAI: 1, taP_CHI_QUOC_TE: i % 5 === 0 ? '04' : '01', xeP_HANG_Q: null }));
hem.push(Object.assign({}, hem[0], { id: 'hdup', mA_BAI_BAO: 'BBKH2025-999' }));
/* tai san tri tue gia: 01 sang che, 02 giai phap huu ich */
const tstt = [['01', 2026], ['01', 2026], ['02', 2026], ['02', 2026], ['02', 2026], ['02', 2025]].map(([l, y], i) => ({ id: 't' + i, mA_GIAI_PHAP: String(5000 + i), loaI_GIAI_PHAP: l, naM_DUOC_CAP_BANG: y }));
/* Tai san tri tue: 1 bang da khop hoan toan voi Excel gia (so 70005) */
tstt.push({ id: 'tK', doN_VI_ID: '452d0027-e4c1-44d1-9efb-befb8db8840d', mA_GIAI_PHAP: '70005', sO_BANG: '70005', loaI_GIAI_PHAP: '01', teN_GIAI_PHAP: 'Bằng khớp thử', sO_DON: '1-2025-0001', ngaY_NOP_DON: '2025-12-01T00:00:00', quyeT_DINH_CAP_BANG: '123/QĐ-SHTT', ngaY_CAP: '2026-01-20T00:00:00', naM_DUOC_CAP_BANG: 2026, chU_BANG: 'Trường Đại học Thủy lợi', taC_GIA_SANG_CHE: 'Lê Thử A, Lê Thử B', tO_CHUC_CAP_BANG: 'Cục Sở hữu trí tuệ' });
/* KHCN gia: Hoat dong khac loai 4 (sang che) va loai 6 (giai phap huu ich); du lieu bia */
const tts = [
  { id: 7001, loai: 4, ten: 'Thiết bị thử nghiệm số một', so: '70001', ngay: '15/03/2026', chu: 'Trường Đại học Thủy lợi', tg: 'Nguyễn Văn Thử' },
  { id: 7002, loai: 4, ten: 'Thiết bị đo thử (bằng nước ngoài)', so: 'CN 2026001', ngay: '20/08/2026', chu: 'Công ty Thử X', tg: 'Phạm Thử (TLU)' },
  { id: 7003, loai: 4, ten: 'Giáo trình thử nghiệm', so: '', ngay: '', chu: '', tg: 'Hà Thử' },
  { id: 7004, loai: 4, ten: 'Chương trình máy tính thử', so: '90001', ngay: '01/03/2026', chu: 'Trường Đại học Thủy lợi', tg: 'Hà Thử' },
  { id: 7101, loai: 6, ten: 'Giải pháp hữu ích thử một', so: '8001', ngay: '11/11/2026', chu: 'Trường Đại học Thủy lợi', tg: 'Phạm Thử A, Phạm Thử B' },
  { id: 7102, loai: 6, ten: 'Giải pháp KHCN riêng', so: '8100', ngay: '02/02/2026', chu: 'Trường Đại học Thủy lợi', tg: 'Hà Thử' }
];
const ttPass = {};
/* nhiem vu KHCN gia tren HEMIS: 1 khop, 1 lech kinh phi (sua), 1 ngoai pham vi (xoa), 1 cap co so (khong bao gio de xuat xoa) */
const nvOf = (d, o) => Object.assign({ id: 'n' + d.id, doN_VI_ID: '452d0027-e4c1-44d1-9efb-befb8db8840d', mA_NHIEM_VU: d.ma, teN_NHIEM_VU: d.ten, phaN_CAP_NHIEM_VU: '02', phaN_LOAI_NHIEM_VU: '02', cO_QUAN_CHU_QUAN: '19', nguoI_CHU_TRI: d.cn, tG_BAT_DAU: d.bd + 'T00:00:00', tG_KET_THUC: d.kt + 'T00:00:00', tonG_KINH_PHI: d.kp, nguoN_KINH_PHI: '01', tinH_TRANG_NV: '04' }, o);
const nv = [nvOf(dts.find(d => d.ma === 'DT2-0')), nvOf(dts.find(d => d.ma === 'DT3-0'), { cO_QUAN_CHU_QUAN: '11', tonG_KINH_PHI: 1 }),
  { id: 'nOLD1', mA_NHIEM_VU: 'OLD-1', teN_NHIEM_VU: 'Đề tài cũ ngoài phạm vi', phaN_CAP_NHIEM_VU: '02', cO_QUAN_CHU_QUAN: '11', tG_BAT_DAU: '2020-01-01T00:00:00', nguoI_CHU_TRI: 'TS. Cũ', tonG_KINH_PHI: 5 }, { id: 'nCS1', mA_NHIEM_VU: 'CS-OLD-1', teN_NHIEM_VU: 'Đề tài cơ sở từ QĐ cũ', phaN_CAP_NHIEM_VU: '04', cO_QUAN_CHU_QUAN: '11', tG_BAT_DAU: '2025-01-01T00:00:00' }];
const writes = [];
const hemis = (method, p, data) => {
  if (p.endsWith('/GetData')) { const src = p.includes('KHCN_GIAI_PHAP_SANG_CHE_DON_VI') ? tstt : p.includes('KHCN_NHIEM_VU_KHCN') ? nv : hem, pg = data.pageInfo.page, ps = data.pageInfo.pageSize; return { status: 200, text: JSON.stringify({ success: true, data: src.slice((pg - 1) * ps, pg * ps) }) }; }
  if (p.includes('KHCN_NHIEM_VU_KHCN')) {
    const m = p.match(/\/DetailWithPermission\/([^?]+)/); if (m) return { status: 200, text: JSON.stringify({ success: true, data: Object.assign({}, nv.find(x => x.id === m[1])) }) };
    if (method === 'POST') { writes.push(['NV-POST', data.mA_NHIEM_VU]); nv.push(data); return { status: 200, text: JSON.stringify({ success: true }) }; }
    const id = p.split('/').pop(), i = nv.findIndex(x => x.id === id);
    if (method === 'PUT') { writes.push(['NV-PUT', id]); nv[i] = data; return { status: 200, text: JSON.stringify({ success: true }) }; }
    if (method === 'DELETE') { writes.push(['NV-DELETE', id]); if (i >= 0) nv.splice(i, 1); return { status: 200, text: JSON.stringify({ success: true }) }; }
  }
  if (p.includes('KHCN_GIAI_PHAP_SANG_CHE_DON_VI')) {
    const m = p.match(/\/DetailWithPermission\/([^?]+)/); if (m) return { status: 200, text: JSON.stringify({ success: true, data: Object.assign({}, tstt.find(x => x.id === m[1])) }) };
    if (method === 'POST') { writes.push(['TT-POST', data.mA_GIAI_PHAP]); tstt.push(data); return { status: 200, text: JSON.stringify({ success: true }) }; }
    const id = p.split('/').pop(), i = tstt.findIndex(x => x.id === id);
    if (method === 'PUT') { writes.push(['TT-PUT', id]); tstt[i] = data; return { status: 200, text: JSON.stringify({ success: true }) }; }
    if (method === 'DELETE') { writes.push(['TT-DELETE', id]); return { status: 200, text: JSON.stringify({ success: true }) }; }
  }
  const m = p.match(/\/DetailWithPermission\/([^?]+)/); if (m) return { status: 200, text: JSON.stringify({ success: true, data: Object.assign({}, hem.find(x => x.id === m[1])) }) };
  if (method === 'POST') { writes.push(['POST', data.mA_BAI_BAO]); hem.push(data); return { status: 200, text: JSON.stringify({ success: true }) }; }
  if (method === 'PUT') { const id = p.split('/').pop(), i = hem.findIndex(x => x.id === id); writes.push(['PUT', id]); hem[i] = data; return { status: 200, text: JSON.stringify({ success: true }) }; }
  return { status: 404, text: '' };
};

(async () => {
  const br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  await ctx.route(APP + '**', r => {
    let f = new URL(r.request().url()).pathname.replace('/cong-cu-khcn-hemis/', '') || 'index.html';
    const fp = path.join(DOCS, decodeURIComponent(f));
    if (!fs.existsSync(fp)) return r.fulfill({ status: 404, body: '' });
    const ct = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.zip': 'application/zip' }[path.extname(fp)] || 'application/octet-stream';
    r.fulfill({ body: fs.readFileSync(fp), contentType: ct + '; charset=utf-8' });
  });
  /* gia lap tien ich: tra loi postMessage cua trang */
  await ctx.exposeBinding('__ext', (src, msg) => {
    if (msg.type === 'ping') return { ok: true, data: { ver: '2.1.0', tabs: { khcn: true, hemis: true } } };
    if (msg.type === 'khcn') return { ok: true, data: { status: 200, text: page(khcn('https://khcn.tlu.edu.vn' + msg.path, msg.form || {})) } };
    if (msg.type === 'hemis') return { ok: true, data: hemis(msg.method, msg.path, msg.data) };
    if (msg.type === 'openEdit') { writes.push(['openEdit', msg.id, msg.name]); return { ok: true, data: true }; }
    return { ok: false, err: 'Lệnh không hợp lệ' };
  });
  await ctx.addInitScript(() => {
    window.addEventListener('message', async e => {
      if (e.source !== window || !e.data || e.data.t2h !== 'req') return;
      const res = await window.__ext(e.data.msg);
      window.postMessage({ t2h: 'res', id: e.data.id, res }, location.origin);
    });
  });
  const pg = await ctx.newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  /* tai ve: ghi nhan thu tu so voi lenh ghi HEMIS; file sao luu de tai nhan ra qua noi dung (Playwright bao ten blob la "download") */
  let nDl = 0;
  pg.on('download', async d => { const e = ['DOWNLOAD', d.suggestedFilename()]; writes.push(e); const f = path.join(OUT, 'tải xuống ' + (++nDl)); await d.saveAs(f); if (fs.readFileSync(f).slice(0, 60).toString().includes('KHCN_NHIEM_VU_KHCN')) { e[1] = 'Sao lưu đề tài trước khi xoá (kiểm thử).json'; fs.copyFileSync(f, path.join(OUT, 'Sao lưu đề tài kiểm thử.json')); } });
  const shot = async n => { await pg.waitForTimeout(300); await pg.screenshot({ path: path.join(OUT, n + '.png') }); };
  const idle = () => pg.waitForFunction(() => [...document.querySelectorAll('[data-busy]')].every(b => b.hidden), null, { timeout: 120000 });
  const ok = (c, m) => { if (!c) { errs.push('SAI: ' + m); console.log('  SAI:', m); } else console.log('  đúng:', m); };

  console.log('1. Quét & kiểm tra');
  await pg.goto(APP + '#quet'); await pg.waitForSelector('[data-scr="quet"] [data-yr]');
  await pg.selectOption('[data-scr="quet"] [data-yr]', '2025');
  await pg.click('[data-scr="quet"] [data-scan]'); await pg.waitForTimeout(300); await idle();
  ok(await pg.locator('[data-scr="quet"] .stat').count() === 4, 'có 4 thẻ tổng quan');
  await shot('1 Quét và kiểm tra');
  await pg.click('[data-scr="quet"] [data-tab="near"]'); await shot('1b Tên tạp chí gần đúng');
  const ed = pg.locator('[data-scr="quet"] [data-edit]').first(); if (await ed.count()) { await ed.click(); await pg.waitForTimeout(200); ok(writes.some(w => w[0] === 'openEdit'), 'bấm Sửa gọi mở trang sửa KHCN'); }

  console.log('2. Bảng tổng hợp');
  await pg.goto(APP + '#tonghop'); await pg.waitForSelector('[data-scr="tonghop"] [data-q0]');
  await pg.click('[data-scr="tonghop"] [data-q0="2021"]'); await pg.waitForTimeout(300); await idle();
  await pg.waitForSelector('[data-scr="tonghop"] table.pv');
  ok(await pg.locator('[data-scr="tonghop"] table.pv tbody tr').count() > 3, 'bảng tổng hợp có dòng');
  await shot('2 Bảng tổng hợp');
  await pg.selectOption('[data-scr="tonghop"] [data-pre]', '1'); await pg.waitForTimeout(300);
  await pg.locator('[data-scr="tonghop"] td.cell[tabindex]').first().click();
  await pg.waitForSelector('.drawer'); await shot('3 Bấm vào ô số');
  await pg.keyboard.press('Escape'); ok(!(await pg.locator('.drawer').count()), 'Esc đóng bảng trượt');
  await pg.click('[data-scr="tonghop"] [data-filter="tonghop"]'); await pg.waitForSelector('.drawer');
  await pg.locator('.drawer button[data-f="grp"]').first().click();
  await pg.locator('.drawer [data-role="corr"]').click(); await shot('4 Bộ lọc mở');
  await pg.click('.drawer [data-apply]'); await pg.waitForTimeout(300);
  ok(await pg.locator('[data-scr="tonghop"] .chip').count() >= 2, 'nhãn điều kiện lọc hiện ra');
  await shot('5 Bảng tổng hợp có lọc');
  await pg.click('[data-scr="tonghop"] [data-blk="th.pivot"] [data-collapse]');
  ok(await pg.locator('[data-blk="th.pivot"].collapsed').count() === 1, 'thu gọn được khối bảng');
  await pg.click('[data-scr="tonghop"] [data-blk="th.pivot"] [data-collapse]');
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'https://hoangtuan0725-create.github.io' });
  await pg.click('[data-scr="tonghop"] [data-copy]'); await pg.waitForTimeout(200);
  const clip = await pg.evaluate(() => navigator.clipboard.readText());
  ok(clip.split('\r\n').length > 3, 'sao chép bảng dán Excel được (' + clip.split('\r\n').length + ' dòng)');
  await pg.click('[data-unf="*"]');

  /* cac buoc cho man HEMIS / Danh sach them o duoi */
  if (fs.existsSync(path.join(__dirname, 'gia-lap-hemis.js'))) await require('./gia-lap-hemis.js')({ pg, APP, shot, idle, ok, writes, hem, errs, nv, dts, dtIn, tstt, OUT });

  console.log('LỖI TRANG:', errs.length ? errs : 'không có');
  console.log('Ảnh chụp ở:', OUT);
  await br.close();
  process.exit(errs.length ? 1 : 0);
})();
