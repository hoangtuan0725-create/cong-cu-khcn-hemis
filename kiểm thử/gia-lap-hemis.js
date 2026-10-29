// Các bước kiểm thử cho màn Danh sách bài, Đẩy lên HEMIS, Rà soát, Chỉ số TT 83 và giao diện điện thoại.
// Được gia-lap.test.js gọi sau bước Bảng tổng hợp (lúc đó D.scan là năm 2025, D.stats là 2021–2026).
module.exports = async ({ pg, APP, shot, idle, ok, writes, hem }) => {
  const S = s => '[data-scr="' + s + '"]';
  const posts = () => writes.filter(w => w[0] === 'POST');
  const puts = () => writes.filter(w => w[0] === 'PUT');
  const untickAll = async scr => { const all = pg.locator(S(scr) + ' [data-all]'); await all.setChecked(true); await all.setChecked(false); };

  /* ---------- 1. Danh sách bài ---------- */
  console.log('6. Danh sách bài');
  await pg.goto(APP + '#danhsach'); await pg.waitForSelector(S('danhsach') + ' tbody tr');
  const n0 = await pg.locator(S('danhsach') + ' tbody tr').count();
  ok(n0 > 20, 'danh sách có dòng (' + n0 + ')');
  await shot('6 Danh sách bài');
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

  /* ---------- 2. Đẩy lên HEMIS ---------- */
  console.log('7. Đẩy lên HEMIS');
  await pg.goto(APP + '#day'); await pg.waitForSelector(S('day') + ' tbody tr[data-k]');
  await shot('7 Đẩy lên HEMIS');
  const total = await pg.locator(S('day') + ' [data-ck]').count();
  ok(total >= 3, 'có ít nhất 3 bài sẽ đẩy (' + total + ')');
  await untickAll('day');
  ok(/0 bài/.test(await pg.locator(S('day') + ' [data-foot]').innerText()), 'bỏ tick hết thì chân màn báo 0 bài');
  const keys = [];
  for (let i = 0; i < 3; i++) { const c = pg.locator(S('day') + ' [data-ck]').nth(i); await c.check(); keys.push(await c.getAttribute('data-ck')); }
  ok(/3 bài/.test(await pg.locator(S('day') + ' [data-foot]').innerText()), 'tick 3 bài thì chân màn báo 3 bài');
  const had = new Set(hem.map(x => x.mA_BAI_BAO)), p0 = posts().length;
  await pg.click(S('day') + ' [data-push]'); await pg.waitForSelector('dialog[open]');
  await pg.click('dialog[open] button[value=ok]');
  await pg.waitForFunction(() => /Xong/.test(document.querySelector('[data-scr="day"] [data-foot]').textContent), null, { timeout: 30000 });
  const np = posts().slice(p0);
  ok(np.length === 3, 'có đúng 3 lệnh POST (' + np.length + ')');
  const codes = np.map(w => w[1]);
  ok(codes.every(c => /^BBKH2025-\d+$/.test(c)), 'mã dạng BBKH2025-số (' + codes.join(', ') + ')');
  const nums = codes.map(c => +c.split('-')[1]);
  ok(nums[1] === nums[0] + 1 && nums[2] === nums[1] + 1, 'ba mã liên tiếp');
  ok(codes.every(c => !had.has(c)), 'không trùng mã đã có');
  await pg.click(S('day') + ' [data-tab="have"]');
  let inHave = 0; for (const k of keys) inHave += await pg.locator(S('day') + ' tr[data-k="' + k + '"]').count();
  ok(inHave === 3, 'cả 3 bài vừa đẩy nằm trong tab Đã có');
  await shot('8 Đẩy xong');
  /* bam Day roi Huy: khong co POST moi */
  await pg.click(S('day') + ' [data-tab="new"]');
  await pg.locator(S('day') + ' [data-ck]').first().check();
  const p1 = posts().length;
  await pg.click(S('day') + ' [data-push]'); await pg.waitForSelector('dialog[open]');
  await pg.click('dialog[open] button[value=no]'); await pg.waitForTimeout(500);
  ok(posts().length === p1, 'bấm Đẩy rồi Huỷ thì không có POST mới');

  /* ---------- 3. Rà soát ---------- */
  console.log('8. Rà soát bài đã có');
  await pg.goto(APP + '#rasoat'); await pg.waitForSelector(S('rasoat') + ' tbody tr[data-id]');
  const nfix = await pg.locator(S('rasoat') + ' tbody tr[data-id]').count();
  ok(nfix > 2, 'có bài cần sửa (' + nfix + ')');
  ok((await pg.locator('[data-blk="rasoat.tay"]').innerText()).includes('BBKH2025-999'), 'có bài trùng trên HEMIS (BBKH2025-999)');
  await shot('9 Rà soát');
  await untickAll('rasoat');
  await pg.click(S('rasoat') + ' [data-tab="cls"]');
  const rows = [];
  for (let i = 0; i < 2; i++) {
    const tr = pg.locator(S('rasoat') + ' tbody tr[data-id]').nth(i); await tr.locator('[data-ck]').check();
    const id = await tr.getAttribute('data-id');
    rows.push({ id, l: (await tr.locator('td.t .muted').innerText()).replace(/^KHCN:\s*/, ''), to: await tr.locator('td.will').innerText(), before: JSON.stringify(hem.find(x => x.id === id)) });
  }
  ok(/2 bài/.test(await pg.locator(S('rasoat') + ' [data-foot]').innerText()), 'tick 2 bài thì chân màn báo 2 bài');
  const u0 = puts().length;
  await pg.click(S('rasoat') + ' [data-fix]'); await pg.waitForSelector('dialog[open]');
  await pg.click('dialog[open] button[value=ok]');
  await pg.waitForFunction(() => /Xong/.test(document.querySelector('[data-scr="rasoat"] [data-foot]').textContent), null, { timeout: 30000 });
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

  /* ---------- 4. Chỉ số TT 83 ---------- */
  console.log('9. Chỉ số TT 83');
  await pg.goto(APP + '#tt83'); await pg.waitForSelector(S('tt83') + ' .kpi');
  await pg.selectOption(S('tt83') + ' [data-yr]', '2025'); await pg.waitForSelector(S('tt83') + ' [data-in="gQD"]'); await pg.waitForTimeout(400);
  await shot('10 Chỉ số TT83');
  await pg.fill(S('tt83') + ' [data-in="gQD"]', '500'); await pg.waitForTimeout(300);
  const kpi1 = (await pg.locator(S('tt83') + ' .kpi .big').first().innerText()).trim();
  ok(/\d/.test(kpi1), 'nhập GQĐ = 500 thì KPI 6.2.1 hiện số (' + kpi1 + ')');
  await pg.waitForTimeout(800);
  await pg.reload(); await pg.goto(APP + '#quet'); await pg.goto(APP + '#tt83');
  await pg.waitForFunction(() => { const i = document.querySelector('[data-scr="tt83"] [data-in="gQD"]'); return i && i.value === '500'; }, null, { timeout: 15000 }).catch(() => {});
  ok(await pg.locator(S('tt83') + ' [data-in="gQD"]').inputValue() === '500', 'tải lại trang, ô GQĐ vẫn là 500');
  ok(await pg.locator(S('tt83') + ' [data-yr]').inputValue() === '2025', 'năm 2025 vẫn được nhớ');

  /* ---------- 5. Điện thoại ---------- */
  console.log('10. Điện thoại 390px');
  await pg.setViewportSize({ width: 390, height: 844 });
  await pg.goto(APP + '#quet'); await pg.waitForSelector(S('quet') + ' .top'); await pg.waitForTimeout(400);
  const sw = await pg.evaluate(() => document.documentElement.scrollWidth);
  ok(sw <= 391, 'màn Quét không cuộn ngang toàn trang (scrollWidth ' + sw + ')');
  await shot('11 Điện thoại');
  await pg.setViewportSize({ width: 1440, height: 900 });
};
