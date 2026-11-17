// Các bước kiểm thử cho màn Danh sách bài, Đẩy lên HEMIS, Rà soát, Chỉ số TT 83 và giao diện điện thoại.
// Được gia-lap.test.js gọi sau bước Bảng tổng hợp (lúc đó D.scan là năm 2025, D.stats là 2021–2026).
const fs = require('fs'), os = require('os'), path = require('path'), { execFileSync } = require('child_process');
module.exports = async ({ pg, APP, shot, idle, ok, writes, hem, nv, dts, dtIn }) => {
  const S = s => '[data-scr="' + s + '"]';
  const OUT = process.env.ANH || path.join(os.tmpdir(), 'anh-kiem-thu');
  /* bam nut Excel o goc khoi, luu file va mo bang openpyxl: co dong, cot A du rong */
  const xl = async (id, label) => {
    const [dl] = await Promise.all([pg.waitForEvent('download', { timeout: 15000 }), pg.click('[data-xlsx="' + id + '"]')]);
    const f = path.join(OUT, 'xlsx ' + id + '.xlsx'); await dl.saveAs(f);
    let r; try { r = JSON.parse(execFileSync('python3', ['-I', '-c', `
import sys, json, openpyxl
wb = openpyxl.load_workbook(sys.argv[1]); ws = wb.worksheets[0]
longest = max([len(str(c.value)) for c in ws['A'] if c.value is not None] or [0])
nums = sum(1 for row in ws.iter_rows(min_row=2) for c in row if isinstance(c.value, (int, float)))
print(json.dumps({'sheets': wb.sheetnames, 'rows': ws.max_row, 'w': ws.column_dimensions['A'].width or 0, 'longest': longest, 'nums': nums}))`, f]).toString()); } catch (e) { r = null; }
    ok(r && r.rows >= 2, label + ': file .xlsx mở được bằng openpyxl, có dòng (' + (r ? r.rows + ' dòng, trang ' + r.sheets.join('/') : 'lỗi') + ')');
    ok(r && r.w >= Math.min(60, r.longest), label + ': cột A đủ rộng (' + (r ? r.w + ' so với chữ dài nhất ' + r.longest : '?') + ')');
    return r;
  };

  /* ---------- 0. Khối: thu gọn, đóng, tạo lại (Bảng tổng hợp) ---------- */
  console.log('5. Khối thu gọn, đóng, tạo lại');
  await pg.goto(APP + '#tonghop'); await pg.waitForSelector('[data-blk="th.pivot"]');
  await pg.click(S('tonghop') + ' [data-filter="tonghop"]'); await pg.waitForSelector('.drawer');
  await pg.locator('.drawer button[data-f="grp"]').first().click(); await pg.click('.drawer [data-apply]'); await pg.waitForTimeout(400);
  const chips = () => pg.locator('[data-blk="th.pivot"] .chip').count();
  ok(await chips() >= 1, 'đặt 1 điều kiện lọc cho Bảng tổng hợp');
  await pg.click('[data-collapse="th.pivot"]');
  ok(await pg.locator('[data-blk="th.pivot"].collapsed').count() === 1, 'bấm — thì khối thu gọn');
  await pg.click('[data-collapse="th.pivot"]');
  ok(await pg.locator('[data-blk="th.pivot"]:not(.collapsed)').count() === 1 && await chips() >= 1, 'bấm lại thì khối mở và bộ lọc vẫn còn');
  await xl('th.pivot', 'Bảng tổng hợp');
  await pg.click('[data-close="th.pivot"]'); await pg.waitForTimeout(400);
  ok(await pg.locator('[data-blk="th.pivot"]').count() === 0, 'bấm X thì khối biến mất');
  ok(await pg.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('t2h.loc.tonghop') || '{}')).length === 0), 'bộ lọc loc.tonghop đã rỗng sau khi đóng');
  await shot('12 Khối đã đóng');
  await pg.click(S('tonghop') + ' [data-create="tonghop"]'); await pg.waitForSelector('.pop [data-mk="th.pivot"]');
  await pg.click('.pop [data-mk="th.pivot"]'); await pg.waitForSelector('.drawer');
  await pg.click('.drawer [data-apply]'); await pg.waitForSelector('[data-blk="th.pivot"]', { timeout: 5000 });
  ok(await pg.locator('[data-blk="th.pivot"]').count() === 1, 'Tạo bảng, chọn Bảng tổng hợp nhiều tầng, Áp dụng thì khối hiện lại');
  await shot('13 Khối tạo lại');
  const posts = () => writes.filter(w => w[0] === 'POST');
  const puts = () => writes.filter(w => w[0] === 'PUT');
  const untickAll = async scr => { const all = pg.locator(S(scr) + ' [data-all]'); await all.setChecked(true); await all.setChecked(false); };

  /* ---------- 1. Danh sách bài ---------- */
  console.log('6. Danh sách bài');
  await pg.goto(APP + '#danhsach'); await pg.waitForSelector(S('danhsach') + ' tbody tr');
  const n0 = await pg.locator(S('danhsach') + ' tbody tr').count();
  ok(n0 > 20, 'danh sách có dòng (' + n0 + ')');
  await shot('6 Danh sách bài');
  await xl('ds.bang', 'Danh sách bài');
  await pg.fill(S('danhsach') + ' [data-q]', 'hồ chứa'); await pg.waitForTimeout(600);
  const n1 = await pg.locator(S('danhsach') + ' tbody tr').count();
  ok(n1 > 0 && n1 < n0, 'gõ tìm "hồ chứa" thì số dòng giảm (' + n0 + ' xuống ' + n1 + ')');
  await pg.fill(S('danhsach') + ' [data-q]', ''); await pg.waitForTimeout(600);
  ok(await pg.locator(S('danhsach') + ' tbody tr').count() === n0, 'xoá ô tìm thì số dòng trở lại');
  await pg.click(S('danhsach') + ' [data-filter]'); await pg.waitForSelector('.drawer');
  await pg.locator('.drawer details[data-g="khoa"] summary').click();
  await pg.locator('.drawer input[type=checkbox][data-f="khoa"]').first().check();
  await pg.click('.drawer [data-apply]'); await pg.waitForTimeout(400);
  ok(await pg.locator(S('danhsach') + ' .chip').count() >= 1, 'chọn 1 khoa và Áp dụng thì hiện nhãn điều kiện');
  const n2 = await pg.locator(S('danhsach') + ' tbody tr').count();
  ok(n2 > 0 && n2 < n0, 'lọc theo khoa làm số dòng giảm (' + n2 + ')');
  await pg.locator(S('danhsach') + ' [data-unf]:not([data-unf="*"])').first().click(); await pg.waitForTimeout(400);
  ok(await pg.locator(S('danhsach') + ' .chip').count() === 0, 'bấm X trên nhãn thì bỏ lọc');
  ok(await pg.locator(S('danhsach') + ' tbody tr').count() === n0, 'bỏ lọc thì số dòng trở lại');

  /* ---------- 2. Đẩy lên HEMIS: Bài báo ---------- */
  console.log('7. Đẩy lên HEMIS · Bài báo');
  const day = async () => { await pg.goto(APP + '#day'); await pg.waitForSelector(S('day') + ' [data-kind="baibao"]'); await pg.click(S('day') + ' [data-kind="baibao"]'); await pg.waitForSelector(S('day') + ' tbody tr[data-k]'); };
  await day();
  await shot('7 Đẩy lên HEMIS');
  await xl('bb.bang', 'Đẩy lên HEMIS');
  const total = await pg.locator(S('day') + ' [data-ck]').count();
  ok(total >= 3, 'có ít nhất 3 bài sẽ thêm (' + total + ')');
  /* mac dinh (Cai dat) chi day bai da duyet: bai chua duyet nam o tab rieng, khong tick duoc */
  await pg.click(S('day') + ' [data-tab="chua"]');
  const nChua = await pg.locator(S('day') + ' tbody tr[data-k]').count();
  ok(nChua > 0 && await pg.locator(S('day') + ' [data-ck]').count() === 0, 'tab Chưa duyệt có ' + nChua + ' bài, không có ô tick');
  await pg.goto(APP + '#caidat'); await pg.waitForSelector('[data-cd="chiDuyet"]'); await shot('14 Cài đặt');
  await pg.uncheck('[data-cd="chiDuyet"]');
  await day();
  const total2 = await pg.locator(S('day') + ' [data-ck]').count();
  ok(total2 > total && !(await pg.locator(S('day') + ' [data-tab="chua"]').count()), 'bỏ tick trong Cài đặt thì bài chưa duyệt vào danh sách thêm (' + total + ' lên ' + total2 + ')');
  await pg.goto(APP + '#caidat'); await pg.waitForSelector('[data-cd="chiDuyet"]'); await pg.check('[data-cd="chiDuyet"]');
  await day();
  ok(await pg.locator(S('day') + ' [data-ck]').count() === total, 'bật lại thì về ' + total + ' bài');
  await pg.click(S('day') + ' [data-tab="sua"]'); await untickAll('day'); await pg.click(S('day') + ' [data-tab="them"]');
  await untickAll('day');
  ok(/\b0 thay đổi/.test(await pg.locator(S('day') + ' [data-foot]').innerText()), 'bỏ tick hết thì chân màn báo 0 thay đổi');
  const keys = [];
  for (let i = 0; i < 3; i++) { const c = pg.locator(S('day') + ' [data-ck]').nth(i); await c.check(); keys.push(await c.getAttribute('data-ck')); }
  ok(/\b3 thay đổi/.test(await pg.locator(S('day') + ' [data-foot]').innerText()), 'tick 3 bài thì chân màn báo 3 thay đổi');
  const had = new Set(hem.map(x => x.mA_BAI_BAO)), p0 = posts().length;
  await pg.click(S('day') + ' [data-run]'); await pg.waitForSelector('dialog[open]');
  await pg.click('dialog[open] button[value=ok]');
  await pg.waitForFunction(() => /Xong/.test(document.querySelector('[data-scr="day"] [data-foot]').textContent), null, { timeout: 30000 });
  const np = posts().slice(p0);
  ok(np.length === 3, 'có đúng 3 lệnh POST (' + np.length + ')');
  const codes = np.map(w => w[1]);
  ok(codes.every(c => /^BBKH2025-\d+$/.test(c)), 'mã dạng BBKH2025-số (' + codes.join(', ') + ')');
  const nums = codes.map(c => +c.split('-')[1]);
  ok(nums[1] === nums[0] + 1 && nums[2] === nums[1] + 1, 'ba mã liên tiếp');
  ok(codes.every(c => !had.has(c)), 'không trùng mã đã có');
  await pg.click(S('day') + ' [data-tab="khop"]');
  let inHave = 0; for (const k of keys) inHave += await pg.locator(S('day') + ' tr[data-k="' + k + '"]').count();
  ok(inHave === 3, 'cả 3 bài vừa thêm nằm trong tab Đã khớp');
  await shot('8 Đẩy xong');
  /* bam Chay roi Huy: khong co POST moi */
  await pg.click(S('day') + ' [data-tab="them"]');
  const c1 = pg.locator(S('day') + ' [data-ck]').first(); await c1.check();
  const p1 = posts().length;
  await pg.click(S('day') + ' [data-run]'); await pg.waitForSelector('dialog[open]');
  await pg.click('dialog[open] button[value=no]'); await pg.waitForTimeout(500);
  ok(posts().length === p1, 'bấm Chạy rồi Huỷ thì không có POST mới');
  await c1.uncheck();

  /* ---------- 3. Sửa bài đã có (tab Sửa, trước đây là màn Rà soát) ---------- */
  console.log('8. Bài báo · tab Sửa');
  await pg.click(S('day') + ' [data-tab="sua"]'); await pg.waitForSelector(S('day') + ' tbody tr[data-id]');
  const nfix = await pg.locator(S('day') + ' tbody tr[data-id]').count();
  ok(nfix > 2, 'tab Sửa có bài cần sửa (' + nfix + ')');
  await pg.click(S('day') + ' [data-tab="trung"]');
  ok((await pg.locator('[data-blk="bb.bang"]').innerText()).includes('BBKH2025-999'), 'tab Trùng trên HEMIS có BBKH2025-999');
  await pg.click(S('day') + ' [data-tab="sua"]');
  await shot('9 Rà soát');
  await untickAll('day');
  const rows = [];
  for (let i = 0; i < 2; i++) {
    const tr = pg.locator(S('day') + ' tbody tr[data-id]').nth(i); await tr.locator('[data-ck]').check();
    const id = await tr.getAttribute('data-id');
    rows.push({ id, l: (await tr.locator('td.t .muted').innerText()).replace(/^KHCN:\s*/, ''), to: await tr.locator('td.will').innerText(), before: JSON.stringify(hem.find(x => x.id === id)) });
  }
  ok(/\b2 thay đổi/.test(await pg.locator(S('day') + ' [data-foot]').innerText()), 'tick 2 bài thì chân màn báo 2 thay đổi');
  const u0 = puts().length;
  await pg.click(S('day') + ' [data-run]'); await pg.waitForSelector('dialog[open]');
  await pg.click('dialog[open] button[value=ok]');
  while (puts().length < u0 + 2) await pg.waitForTimeout(100);
  await pg.waitForFunction(() => { const t = document.querySelector('[data-scr="day"] [data-foot]').textContent; return /Xong/.test(t) && !/Đang chạy/.test(t); }, null, { timeout: 30000 });
  const nu = puts().slice(u0); 
  ok(nu.length === 2 && rows.every(r => nu.some(w => w[1] === r.id)), 'có đúng 2 lệnh PUT cho 2 bài đã tick');
  for (const r of rows) {
    const h = hem.find(x => x.id === r.id), was = JSON.parse(r.before), l = r.l;
    const exp = /SCIE/.test(l) ? { p: 1, qt: '01' } : /SCOPUS/i.test(l) ? { p: 1, qt: '02' } : /GSNN/.test(l) ? { p: 1, tn: '01' } : /ISI hoặc Scopus/.test(l) ? { p: 2, tn: '03' } : { p: 2, tn: '06' };
    const q = (r.to.match(/Q([1-4])/) || [])[1], yy = (r.to.match(/Năm (\d{4})/) || [])[1];
    ok(h.phaN_LOAI === exp.p && (h.taP_CHI_QUOC_TE || null) === (exp.qt || null) && (h.taP_CHI_TRONG_NUOC || null) === (exp.tn || null), 'bài ' + r.id + ' đổi đúng loại (' + l + ')');
    ok((h.xeP_HANG_Q || null) === (q ? '0' + q : (was.xeP_HANG_Q || null)), 'bài ' + r.id + ' đổi đúng xếp hạng Q');
    ok(+h.naM_CONG_BO === (yy ? +yy : was.naM_CONG_BO), 'bài ' + r.id + ' đúng năm công bố');
    ok(h.teN_BAI_BAO === was.teN_BAI_BAO && h.mA_BAI_BAO === was.mA_BAI_BAO, 'bài ' + r.id + ' giữ nguyên tên và mã');
  }
  await shot('9b Rà soát sau khi sửa');

  /* ---------- Đề tài ---------- */
  console.log('8b. Đề tài');
  const D = S('day'), nvw = k => writes.filter(w => w[0] === k), cnt = async t => { await pg.click(D + ' [data-tab="' + t + '"]'); return pg.locator(D + ' [data-blk="dt.bang"] tbody tr[data-ck], ' + D + ' [data-blk="dt.bang"] tbody tr:has(td.nowrap)').count(); };
  await pg.goto(APP + '#day'); await pg.waitForSelector(D + ' [data-kind="detai"]'); await pg.click(D + ' [data-kind="detai"]');
  await pg.waitForSelector(D + ' [data-dt-scan]'); await pg.selectOption(D + ' [data-dt-yr]', '2026');
  await pg.click(D + ' [data-dt-scan]'); await pg.waitForTimeout(300); await idle();
  await pg.waitForFunction(() => /KHCN \d+/.test(document.querySelector('[data-scr="day"] [data-sub]').textContent), null, { timeout: 30000 });
  const expect = dts.filter(d => dtIn(d, '2026')).length, got = +((await pg.locator(D + ' [data-sub]').innerText()).match(/KHCN (\d+)/) || [])[1];
  ok(got === expect, 'quét đủ đề tài đã phê duyệt dính năm 2026, không sót dù thứ tự dòng đổi giữa các lượt (' + got + '/' + expect + ')');
  await xl('dt.bang', 'Đề tài');
  /* chon UBND tinh cho de tai chua xac dinh duoc chu quan */
  await pg.click(D + ' [data-tab="them"]');
  const pk = pg.locator(D + ' button.warnbtn').first();
  ok(await pk.count() === 1 && await pk.locator('xpath=ancestor::tr//input[@type="checkbox"]').isDisabled(), 'đề tài chưa rõ chủ quản hiện nút vàng và chưa tick được');
  const need0 = await pg.locator(D + ' button.warnbtn').count();
  await pg.locator(D + ' tr:has-text("xâm nhập mặn") button.warnbtn').click(); await pg.waitForSelector('.pk [data-q]');
  await pg.fill('.pk [data-q]', 'lâm'); await pg.click('.pk [data-v="59"]'); await pg.waitForTimeout(300);
  ok(await pg.locator(D + ' button.warnbtn').count() === need0 - 1, 'chọn UBND tỉnh Lâm Đồng thì nút vàng mất và đề tài tick được (' + need0 + ' còn ' + (need0 - 1) + ')');
  /* nhap QD 3 dong */
  await pg.click(D + ' [data-qd]'); await pg.waitForSelector('.drawer [data-f="tsv"]');
  await pg.selectOption('.drawer [data-f="dot"]', 'cs'); await pg.fill('.drawer [data-f="thuoc"]', 'Đề tài cơ sở 2026, QĐ số 1/QĐ-ĐHTL'); await pg.fill('.drawer [data-f="bd"]', '01/03/2026');
  await pg.fill('.drawer [data-f="tsv"]', 'CS2026-T1\tNghiên cứu thử một\tTS. A\tKhoa Công trình\nCS2026-T2\tNghiên cứu thử hai\tTS. B\tKhoa Kinh tế và Quản lý\nCS2026-T3\tNghiên cứu thử ba\tTS. C\tKhoa CNTT');
  ok(/Đọc được 3 đề tài/.test(await pg.locator('.drawer [data-cnt]').innerText()), 'dán 3 dòng thì đọc được 3 đề tài');
  await shot('16b Nhập đề tài từ QĐ'); await pg.click('.drawer [data-ok]'); await pg.waitForTimeout(400);
  ok(/3 từ QĐ giao/.test(await pg.locator(D + ' [data-blk="dt.ngoai"]').innerText()), 'khối ngoài KHCN ghi 3 đề tài từ QĐ giao');
  /* nhap tay 1 (ma tam) */
  await pg.click(D + ' [data-tay]'); await pg.waitForSelector('.drawer [data-f="ten"]');
  await pg.fill('.drawer [data-f="ten"]', 'Đề tài nhập tay thử'); await pg.fill('.drawer [data-f="ma"]', 'TAY-01'); await pg.fill('.drawer [data-f="cn"]', 'TS. Tay'); await pg.fill('.drawer [data-f="bd"]', '01/01/2026'); await pg.check('.drawer [data-f="tam"]');
  await pg.click('.drawer [data-ok]'); await pg.waitForTimeout(400);
  ok(await pg.locator(D + ' tr:has-text("TAY-01") .pill:has-text("Mã tạm")').count() === 1, 'đề tài nhập tay hiện nhãn Mã tạm');
  /* loai tru 1 */
  const ne0 = await pg.locator(D + ' [data-excl]').count();
  await pg.locator(D + ' tr:has(td:text-is("KHCN")) [data-excl]').first().click(); await pg.waitForTimeout(300);
  ok(await pg.locator(D + ' [data-excl]').count() === ne0 - 1, 'bấm Loại trừ thì dòng rời tab Thêm');
  ok(/1 mã loại trừ/.test(await pg.locator(D + ' [data-blk="dt.ngoai"]').innerText()), 'khối ngoài KHCN ghi 1 mã loại trừ');
  ok(await pg.locator(D + ' tr:has-text("CS2026-T1")').count() === 1 && await pg.locator(D + ' tr:has-text("TAY-01")').count() === 1, 'đề tài QĐ giao và nhập tay có trong tab Thêm');
  ok(await pg.locator(D + ' .tabs').innerText().then(t => /Sửa \(1\)/.test(t) && /Xoá \(1\)/.test(t) && /Đã khớp \(1\)/.test(t)), 'tab Sửa 1, Xoá 1, Đã khớp 1; đề tài cơ sở cũ không bị đề xuất xoá');
  /* tab Xoa: mac dinh khong tick; tick 1 dong */
  await pg.click(D + ' [data-tab="xoa"]');
  ok(await pg.locator(D + ' tbody tr[data-ck], ' + D + ' tbody input[data-ck]:checked').count() === 0, 'tab Xoá không tick sẵn dòng nào');
  await pg.locator(D + ' tbody input[data-ck]').first().check();
  await pg.click(D + ' [data-tab="them"]'); await shot('16 Đề tài');
  const foot = await pg.locator(D + ' [data-foot]').innerText(), nA = +foot.match(/thêm (\d+)/)[1], nS = +foot.match(/sửa (\d+)/)[1], nX = +foot.match(/xoá (\d+)/)[1];
  ok(nA > 20 && nS === 1 && nX === 1, 'chân màn: thêm ' + nA + ', sửa ' + nS + ', xoá ' + nX);
  const w0 = writes.length;
  await pg.click(D + ' [data-run]'); await pg.waitForSelector('dialog[open]');
  ok(/xoá 1/.test(await pg.locator('dialog[open] .db').innerText()), 'hộp xác nhận nêu số thêm / sửa / xoá');
  await pg.click('dialog[open] button[value=no]'); await pg.waitForTimeout(300);
  ok(writes.length === w0, 'bấm Chạy rồi Huỷ thì không ghi gì');
  await pg.click(D + ' [data-run]'); await pg.waitForSelector('dialog[open]'); await pg.click('dialog[open] button[value=ok]');
  await pg.waitForFunction(() => /Xong/.test(document.querySelector('[data-scr="day"] [data-foot]').textContent), null, { timeout: 90000 });
  const W = writes.slice(w0), iDl = W.findIndex(w => w[0] === 'DOWNLOAD' && /^Sao lưu đề tài/.test(w[1])), iDel = W.findIndex(w => w[0] === 'NV-DELETE');
  ok(W.filter(w => w[0] === 'NV-POST').length === nA && W.filter(w => w[0] === 'NV-PUT').length === nS && W.filter(w => w[0] === 'NV-DELETE').length === nX, 'đúng số lệnh POST ' + nA + ', PUT ' + nS + ', DELETE ' + nX);
  ok(iDl >= 0 && iDel > iDl, 'file sao lưu được tải trước lệnh DELETE đầu tiên');
  const bj = JSON.parse(require('fs').readFileSync((process.env.ANH || require('os').tmpdir() + '/anh-kiem-thu') + '/Sao lưu đề tài kiểm thử.json', 'utf8'));
  ok(bj && bj.KHCN_NHIEM_VU_KHCN.length === 1 && bj.KHCN_NHIEM_VU_KHCN[0].mA_NHIEM_VU === 'OLD-1', 'file sao lưu chứa bản ghi OLD-1 đầy đủ');
  ok(!nv.some(x => x.mA_NHIEM_VU === 'OLD-1') && nv.some(x => x.mA_NHIEM_VU === 'CS-OLD-1'), 'OLD-1 đã xoá, đề tài cơ sở cũ còn nguyên');
  const q1 = nv.find(x => x.mA_NHIEM_VU === 'CS2026-T1'), t1 = nv.find(x => x.mA_NHIEM_VU === 'TAY-01'), pv = nv.find(x => x.teN_NHIEM_VU.includes('xâm nhập mặn'));
  ok(q1 && q1.phaN_CAP_NHIEM_VU === '04' && q1.cO_QUAN_CHU_QUAN === '11' && q1.tG_KET_THUC.slice(0, 10) === '2027-03-01' && q1.tonG_KINH_PHI === 13200000, 'đề tài QĐ: cấp 04, chủ quản 11, 12 tháng, 13.200.000');
  ok(t1 && t1.phaN_LOAI_NHIEM_VU === '02' && pv && pv.phaN_CAP_NHIEM_VU === '03' && pv.cO_QUAN_CHU_QUAN === '59', 'đề tài nhập tay và đề tài tỉnh (chọn Lâm Đồng) ghi đúng');
  ok(nv.find(x => x.mA_NHIEM_VU === 'DT3-0').tonG_KINH_PHI === dts.find(d => d.ma === 'DT3-0').kp, 'đề tài sửa: kinh phí đã khớp KHCN');
  await shot('16c Đề tài sau khi chạy');

  /* ---------- 4. Chỉ số TT 83 ---------- */
  console.log('9. Chỉ số TT 83');
  await pg.goto(APP + '#tt83'); await pg.waitForSelector(S('tt83') + ' .kpi');
  await pg.selectOption(S('tt83') + ' [data-yr]', '2025'); await pg.waitForSelector(S('tt83') + ' [data-in="gQD"]'); await pg.waitForTimeout(400);
  await shot('10 Chỉ số TT83');
  await xl('tt83.sanpham', 'Chỉ số TT 83');
  await pg.fill(S('tt83') + ' [data-in="gQD"]', '500'); await pg.waitForTimeout(300);
  const kpi1 = (await pg.locator(S('tt83') + ' .kpi .big').first().innerText()).trim();
  ok(/\d/.test(kpi1), 'nhập GQĐ = 500 thì KPI 6.2.1 hiện số (' + kpi1 + ')');
  await pg.waitForTimeout(800);
  await pg.reload(); await pg.goto(APP + '#quet'); await pg.goto(APP + '#tt83');
  await pg.waitForFunction(() => { const i = document.querySelector('[data-scr="tt83"] [data-in="gQD"]'); return i && i.value === '500'; }, null, { timeout: 15000 }).catch(() => {});
  ok(await pg.locator(S('tt83') + ' [data-in="gQD"]').inputValue() === '500', 'tải lại trang, ô GQĐ vẫn là 500');
  ok(await pg.locator(S('tt83') + ' [data-yr]').inputValue() === '2025', 'năm 2025 vẫn được nhớ');
  await pg.selectOption(S('tt83') + ' [data-yr]', '2026'); await pg.waitForSelector(S('tt83') + ' [data-v="gp"]'); await pg.waitForTimeout(300);
  const gp = (await pg.locator(S('tt83') + ' [data-v="gp"]').innerText()).trim(), p4 = (await pg.locator(S('tt83') + ' [data-v="p4"]').innerText()).trim();
  ok(gp === '3' && p4 === '2', 'năm 2026: P3 giải pháp hữu ích = ' + gp + ', P4 sáng chế = ' + p4 + ' (lấy từ HEMIS, đúng 3 và 2)');
  ok(!(await pg.locator(S('tt83') + ' [data-opt]').count()), 'không còn ô tuỳ chọn trên màn TT 83');
  await shot('15 TT83 P3 P4 từ HEMIS');

  /* ---------- 5. Điện thoại ---------- */
  console.log('10. Điện thoại 390px');
  await pg.setViewportSize({ width: 390, height: 844 });
  await pg.goto(APP + '#quet'); await pg.waitForSelector(S('quet') + ' .top'); await pg.waitForTimeout(400);
  const sw = await pg.evaluate(() => document.documentElement.scrollWidth);
  ok(sw <= 391, 'màn Quét không cuộn ngang toàn trang (scrollWidth ' + sw + ')');
  await shot('11 Điện thoại');
  await pg.setViewportSize({ width: 1440, height: 900 });
};
