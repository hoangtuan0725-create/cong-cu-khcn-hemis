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
const khcn = (url, form) => {
  const u = new URL(url), p = u.pathname;
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
const writes = [];
const hemis = (method, p, data) => {
  if (p.endsWith('/GetData')) { const pg = data.pageInfo.page, ps = data.pageInfo.pageSize; return { status: 200, text: JSON.stringify({ success: true, data: hem.slice((pg - 1) * ps, pg * ps) }) }; }
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
    if (msg.type === 'ping') return { ok: true, data: { ver: '2.0.0', tabs: { khcn: true, hemis: true } } };
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
  if (fs.existsSync(path.join(__dirname, 'gia-lap-hemis.js'))) await require('./gia-lap-hemis.js')({ pg, APP, shot, idle, ok, writes, hem, errs });

  console.log('LỖI TRANG:', errs.length ? errs : 'không có');
  console.log('Ảnh chụp ở:', OUT);
  await br.close();
  process.exit(errs.length ? 1 : 0);
})();
