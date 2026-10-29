const { chromium } = require('playwright'); const fs = require('fs');
const KH = ['Khoa Công trình', 'Khoa Cơ khí', 'Khoa Kinh tế', 'Khoa CNTT'], LO = ['Tạp chí SCIE', 'Tạp chí SCOPUS', 'Tạp chí trong danh mục hội đồng chức danh GSNN', 'Kỷ yếu hội nghị ISI hoặc Scopus', 'Kỷ yếu hội nghị quốc gia'];
let seed = 7; const R = n => { seed = (seed * 9301 + 49297) % 233280; return Math.floor(seed / 233280 * n); };
const users = []; KH.forEach((k, i) => { for (let j = 0; j < 5; j++) users.push({ u: 'u' + i + j, n: 'GV ' + i + j, k, bm: 'BM ' + i + (j % 2) }); });
const arts = []; for (let i = 0; i < 400; i++) { const a = [users[R(20)], users[R(20)]]; const l = LO[R(5)]; arts.push({ id: 1000 + i, t: 'Bai bao so ' + i, j: l.includes('GSNN') ? 'Tạp chí Khoa học Kỹ thuật Thủy lợi và Môi trường' : 'Journal ' + R(9), l, q: l.includes('SC') ? 'Q' + (1 + R(4)) : 'NONE', d: (1 + R(27)) + '/' + (1 + R(12)) + '/' + (2021 + R(6)), a, ext: R(3) === 0 }); }
const page = (b) => '<html><body>' + b + '</body></html>';
(async () => {
  const br = await chromium.launch(); const ctx = await br.newContext({ viewport: { width: 1500, height: 1000 } });
  await ctx.route('https://khcn.tlu.edu.vn/**', async r => {
    const u = new URL(r.request().url()), p = u.pathname; let b = '';
    if (p === '/TrichXuatCongBo') b = '<table><tr><th>h</th></tr>' + arts.map(a => '<tr>' + ['1', a.a.map(x => x.n + '<' + x.u + '>').join(', ') + (a.ext ? ', Ext Author' : ''), '', '', '', a.t, a.j, a.l, a.q, '1,2', '1', a.d, '', '', '1', '2', '3-9'].map(c => '<td>' + c.replace(/</g, '&lt;') + '</td>').join('') + '</tr>').join('') + '</table>';
    else if (p === '/CongBo/XuatDuLieu') { const np = u.searchParams.get('nopoint'); const L = np === 'null' ? arts : np === '1' ? arts.filter(a => a.id % 3) : []; b = '<table><tr><th>h</th></tr>' + L.map(a => '<tr ondblclick="ShowDeTails(\'' + a.id + '\')"><td>1</td><td>' + a.t + '</td></tr>').join('') + '</table>'; }
    else if (p === '/admin/Users/GetDiaChi') { const bms = [...new Set(users.map(x => x.bm + '|' + x.k))]; b = '<table><tr><th>h</th></tr>' + bms.map((x, i) => '<tr><td>' + i + '</td><td>' + x.split('|')[0] + '</td><td>' + x.split('|')[1] + '</td><td><a href="/EditDiaChi/' + i + '">e</a></td></tr>').join('') + '</table>'; }
    else if (p === '/admin/Users/GetUserInDiaChi') { const bms = [...new Set(users.map(x => x.bm + '|' + x.k))]; const k = bms[+u.searchParams.get('dc')]; b = '<table><tr><th>h</th></tr>' + users.filter(x => x.bm + '|' + x.k === k).map(x => '<tr><td>1</td><td>' + x.n + '</td><td>' + x.u + '</td></tr>').join('') + '</table>'; }
    else if (p === '/CongBo/DetailsCongBo') { const id = +new URLSearchParams(r.request().postData()).get('id'); const a = arts.find(x => x.id === id); b = '<div id="listchutri">' + a.a[0].n + '&lt;' + a.a[0].u + '&gt;</div><div id="chiutrachnhiem">' + a.a[1].n + '&lt;' + a.a[1].u + '&gt;</div><div id="listthamgia"></div><dl><dt>Tên HĐCD</dt><dd>Thủy lợi</dd></dl>'; }
    else b = '<select><option>Tất cả mọi loại công bố</option>' + LO.concat(['Loại A','Loại B','Loại C','Loại D','Loại E','Loại F','Loại G','Loại H','Loại I']).map(x => '<option>' + x + '</option>').join('') + '</select>';
    await r.fulfill({ body: page(b), contentType: 'text/html; charset=utf-8' });
  });
  const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('https://khcn.tlu.edu.vn/');
  await pg.addScriptTag({ content: fs.readFileSync('' + require('path').join(__dirname, '..', 'src', 'tool.js') + '', 'utf8') });
  await pg.click('#tb2'); await pg.waitForTimeout(300);
  await pg.evaluate(()=>localStorage.clear()); await pg.click('button[data-q="2021"]');
  await pg.waitForFunction(() => /Đã tải/.test(document.querySelector('#kMsg').textContent), null, { timeout: 60000 });
  await pg.waitForTimeout(500);
  console.log(await pg.evaluate(() => document.querySelector('#kMsg').textContent));
  console.log(await pg.evaluate(() => document.querySelector('#pvInfo').innerText));
  const el = await pg.$('#pvOut'); await pg.evaluate(() => document.querySelector('#pvOut').scrollIntoView());
  await pg.screenshot({ path: require('path').join(require('os').tmpdir(), 'a.png') });
  console.log(await pg.evaluate(() => [...document.querySelectorAll('#pvOut tr')[1].children].length));
  // preset 2 + sep layout
  await pg.click('button[data-pre="2"]'); await pg.selectOption('#pvL', 'sep'); await pg.waitForTimeout(300);
  console.log(await pg.evaluate(() => document.querySelector('#pvInfo').innerText));
  await pg.screenshot({ path: require('path').join(require('os').tmpdir(), 'b.png') });
  // add custom column via filter: grp WoS + role corr
  await pg.click('button[data-pre="1"]');
  await pg.evaluate(() => { document.querySelector('input[name=kRole][value=corr]').checked = true; document.querySelector('input[name=kRole][value=corr]').dispatchEvent(new Event('change', { bubbles: true })); });
  pg.on('dialog', d => d.accept('Bài có TG liên hệ (test)'));
  await pg.click('#pvAdd'); await pg.waitForTimeout(300);
  console.log(await pg.evaluate(() => document.querySelector('#pvChips').innerText.slice(-80)));
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  await pg.click('#pvCopy'); await pg.waitForTimeout(200);
  const clip = await pg.evaluate(() => navigator.clipboard.readText());
  console.log(clip.split('\r\n').slice(0, 4).join('\n').slice(0, 600));
  console.log('ERR', errs);
  await br.close();
})();
