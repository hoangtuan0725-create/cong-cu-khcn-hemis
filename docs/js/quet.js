// Màn "Quét & kiểm tra": quét năm báo cáo trên KHCN, báo bài thiếu trường, so tên tạp chí với danh mục Bộ KH&CN.
import { esc, norm, MAP, QM, matchDM, shortType, vnDate, fmtTime, toISO, downloadCsv } from './core.js';
import { icon, pill, screenHtml, blk, tabsHtml, steps, empty, ask, toast, $ } from './ui.js';
import * as B from './bridge.js';
import { D, scan } from './data.js';
import { guide } from './huongdan.js';

let root, tab = 'must', err = '';
const Y = new Date().getFullYear();
let yr = String(Y), f = '01/01/' + Y, t = '31/12/' + Y;

/* Kiem tra tung bai: miss = thieu truong bat buoc, soft = nen bo sung, dmName = ten chuan neu ten tap chi gan dung */
export const check = recs => recs.map(r => {
  const m = MAP(r.l), k = norm(r.t), miss = [], soft = []; let dm = null, dmName = '';
  if (!r.d) miss.push('Thiếu ngày công bố');
  if (!m) miss.push('Không rõ loại bài');
  if (!r.j) miss.push('Thiếu tên tạp chí'); else if (norm(r.j) === k) miss.push('Tên tạp chí trùng tên bài');
  if (m && m.wos && !QM[r.q]) soft.push('Thiếu xếp hạng Q');
  if (m && m.p === 1 && !r.vol && !r.iss) soft.push('Thiếu tập/số');
  if (!r.pg) soft.push('Thiếu số trang');
  if (m && m.p === 1 && !m.wos && r.j && norm(r.j) !== k) {
    dm = matchDM(r.j).lv;
    if (dm === 'near') { dmName = matchDM(r.j).name; soft.push('Tên tạp chí gần đúng'); }
    else if (dm === 'no' && String(r.d) > '2026-09-30') soft.push('Không có trong danh mục Bộ KH&CN, sau 30/9/2026 sẽ không được tính');
  }
  return { r, miss, soft, dm, dmName };
});

const html = () => screenHtml({
  title: 'Quét & kiểm tra',
  acts: '<label class="sel">Năm báo cáo <select data-yr>' + [Y + 1, Y, Y - 1, Y - 2, Y - 3].map(y => '<option value="' + y + '">' + y + '</option>').join('') + '<option value="">Tự chọn ngày</option></select></label>' +
    '<span class="sel" data-range><label for="q-f" class="sr">Từ ngày</label><input id="q-f" data-f placeholder="dd/mm/yyyy"> – <label for="q-t" class="sr">Đến ngày</label><input id="q-t" data-t placeholder="dd/mm/yyyy"></span>' +
    '<button class="btn" data-scan>' + icon('refresh') + '<span>Quét</span></button>',
  foot: true
});

const scr = {
  id: 'quet', title: 'Quét & kiểm tra', icon: 'scan', group: 1, busy: ['scan'], on: ['scan'],
  badge: () => { if (!D.scan) return null; const n = check(D.scan.recs).filter(x => x.miss.length).length; return n ? { n, label: n + ' bài thiếu bắt buộc' } : null; },
  init(el) {
    root = el; el.innerHTML = html();
    if (D.scan) { f = vnDate(D.scan.f); t = vnDate(D.scan.t); yr = D.scan.f.slice(5) === '01-01' && D.scan.t.slice(5) === '12-31' && D.scan.f.slice(0, 4) === D.scan.t.slice(0, 4) ? D.scan.f.slice(0, 4) : ''; }
    const ys = $('[data-yr]', el), fi = $('[data-f]', el), ti = $('[data-t]', el);
    ys.value = yr; fi.value = f; ti.value = t;
    ys.onchange = () => { yr = ys.value; if (yr) { fi.value = '01/01/' + yr; ti.value = '31/12/' + yr; } };
    [fi, ti].forEach(i => i.oninput = () => { ys.value = ''; yr = ''; });
    $('[data-scan]', el).onclick = run;
    el.addEventListener('click', async e => {
      const tb = e.target.closest('[data-tab]'); if (tb) { tab = tb.dataset.tab; scr.render(); return; }
      const ed = e.target.closest('[data-edit]');
      if (ed) { try { await B.openEdit(ed.dataset.edit, ed.dataset.name); } catch (x) { fail(x); } return; }
      if (e.target.closest('[data-csv]')) csv();
      if (e.target.closest('[data-next]')) next();
      if (e.target.closest('[data-run]')) run();
    });
  },
  render() {
    const body = $('[data-body]', root), foot = $('[data-foot]', root), sub = $('[data-sub]', root);
    const S = D.scan;
    $('[data-scan] span', root).textContent = S ? 'Quét lại' : 'Quét';
    $('[data-scan]', root).classList.toggle('pri', !S);
    const errHtml = err ? '<div class="note err" role="alert">' + icon('alert') + '<div>' + esc(err) + '</div></div>' : '';
    if (!S) {
      sub.textContent = 'Tìm bài thiếu thông tin trước khi đẩy lên HEMIS';
      body.innerHTML = errHtml + steps(1) + '<div class="card">' + empty('scan', 'Chưa quét dữ liệu', 'Chọn năm báo cáo (Thông tư 83 tính theo năm 01/01 – 31/12, chốt ngày 31/12) rồi bấm Quét. Công cụ đọc dữ liệu trên KHCN bằng phiên đăng nhập của anh/chị.', '<button class="btn pri" data-run>' + icon('scan') + 'Quét ngay</button>') + '</div>';
      foot.innerHTML = '<span class="muted">Chưa có dữ liệu quét.</span>'; return;
    }
    const all = check(S.recs), must = all.filter(x => x.miss.length), near = all.filter(x => x.dmName), soft = all.filter(x => !x.miss.length && x.soft.length && !x.dmName), softAll = all.filter(x => !x.miss.length && x.soft.length);
    const dmC = { ok: 0, near: 0, no: 0 }; all.forEach(x => { if (x.dm) dmC[x.dm]++; });
    const okN = all.length - must.length - softAll.length;
    sub.textContent = all.length.toLocaleString('vi-VN') + ' bài · ' + vnDate(S.f) + ' – ' + vnDate(S.t) + ' · dữ liệu quét lúc ' + fmtTime(S.at);
    const L = { must, near, soft, all }[tab] || must;
    const row = x => {
      const r = x.r, iss = x.miss.map(m => pill('err', m)).join(' ') + x.soft.map(m => pill('warn', m)).join(' ') || pill('ok', 'Đủ thông tin');
      const act = r.id ? '<button class="lnk" data-edit="' + esc(r.id) + '" data-name="' + esc(x.dmName) + '">' + (x.dmName ? 'Sửa (điền sẵn tên)' : 'Sửa trên KHCN') + icon('ext') + '</button>' : '<span class="muted small">Không có mã bài</span>';
      return '<tr><td class="t"><b>' + esc(r.t) + '</b><div class="muted">' + esc(r.j || '(chưa có tên tạp chí)') + '</div></td><td title="' + esc(r.l) + '">' + esc(shortType(r.l)) + '</td><td class="nowrap">' + esc(r.d ? vnDate(r.d) : '—') + '</td><td>' + iss + (x.dmName ? '<div class="muted small" style="margin-top:4px">' + icon('right') + ' ' + esc(x.dmName) + '</div>' : '') + '</td><td class="num nowrap">' + act + '</td></tr>';
    };
    const MAXR = 500;
    body.innerHTML = errHtml + steps(must.length ? 2 : 3) +
      blk('quet.tongquan', 'Tổng quan', '<div class="stats">' +
        '<div class="card stat"><div class="k">Tổng số bài</div><div class="v">' + all.length.toLocaleString('vi-VN') + '</div><div class="h">' + vnDate(S.f) + ' – ' + vnDate(S.t) + '</div></div>' +
        '<div class="card stat ok"><div class="k">' + icon('check') + 'Đủ thông tin</div><div class="v">' + okN.toLocaleString('vi-VN') + '</div><div class="h">Sẵn sàng đẩy</div></div>' +
        '<div class="card stat' + (must.length ? ' err' : '') + '"><div class="k">' + icon('alert') + 'Thiếu bắt buộc</div><div class="v">' + must.length + '</div><div class="h">Phải sửa trước khi đẩy</div></div>' +
        '<div class="card stat warn"><div class="k">' + icon('info') + 'Nên bổ sung</div><div class="v">' + softAll.length + '</div><div class="h">Q, tập/số, trang, tên tạp chí</div></div></div>' +
        '<div class="note" style="margin:12px 0 0">' + icon('info') + '<div>Tạp chí trong nước so với Danh mục tạp chí đạt tiêu chuẩn của Bộ KH&amp;CN (QĐ 2244/QĐ-BKHCN): <b>' + dmC.ok + '</b> bài đúng tên · <b>' + dmC.near + '</b> bài tên gần đúng (nên sửa tên trên KHCN) · <b>' + dmC.no + '</b> bài không tìm thấy trong danh mục.</div></div>', { card: false }) +
      blk('quet.bang', 'Danh sách bài', '<div class="tw"><table class="tbl"><thead><tr><th style="width:40%">Bài báo</th><th>Loại</th><th>Ngày</th><th>Vấn đề</th><th class="num"><span class="sr">Thao tác</span></th></tr></thead><tbody>' +
        (L.length ? L.slice(0, MAXR).map(row).join('') : '<tr><td colspan="5">' + empty('check', 'Không có bài nào trong mục này', '') + '</td></tr>') + '</tbody></table></div>' +
        (L.length > MAXR ? '<div class="more">Đang hiện ' + MAXR + '/' + L.length + ' bài. Bấm “Tải danh sách cần sửa” để lấy đủ.</div>' : ''),
        { headHtml: tabsHtml([['must', 'Thiếu bắt buộc (' + must.length + ')'], ['near', 'Tên tạp chí gần đúng (' + near.length + ')'], ['soft', 'Nên bổ sung (' + soft.length + ')'], ['all', 'Tất cả (' + all.length + ')']], tab) });
    foot.innerHTML = (must.length ? '<span><b style="color:var(--err)">Còn ' + must.length + ' bài thiếu bắt buộc.</b> <span class="muted">Sửa trên KHCN xong bấm Quét lại.</span></span>' : '<span><b style="color:var(--ok)">' + icon('check') + ' Không còn bài thiếu bắt buộc.</b> <span class="muted">Sang HEMIS để đẩy một lần.</span></span>') +
      '<div class="sp"></div><button class="btn" data-csv' + (must.length + softAll.length ? '' : ' disabled') + '>' + icon('dl') + 'Tải danh sách cần sửa</button>' +
      '<button class="btn pri" data-next' + (must.length ? ' aria-disabled="true"' : '') + '>Sang HEMIS' + icon('right') + '</button>';
  }
};
export default scr;

const fail = x => { if (x.code === 'noext') guide(); err = x.message; toast(x.message, 'err'); scr.render(); };
async function run() {
  const fi = $('[data-f]', root).value, ti = $('[data-t]', root).value, a = toISO(fi), b = toISO(ti);
  if (!a || !b) { toast('Ngày chưa đúng dạng ngày/tháng/năm', 'err'); return; }
  if (a > b) { toast('Ngày bắt đầu sau ngày kết thúc', 'err'); return; }
  err = '';
  try { await scan(a, b); if (!D.scan.recs.length) toast('Không có bài nào trong khoảng ngày này.', 'err'); tab = 'must'; }
  catch (x) { fail(x); }
}
function csv() {
  const L = check(D.scan.recs).filter(x => x.miss.length || x.soft.length);
  downloadCsv('Bài báo cần bổ sung', [['Tên bài báo', 'Tạp chí/Hội nghị', 'Loại', 'Ngày công bố', 'Thiếu bắt buộc', 'Nên bổ sung', 'Tên tạp chí chuẩn (danh mục Bộ KH&CN)', 'Link sửa trên KHCN']].concat(L.map(x => [x.r.t, x.r.j, x.r.l, x.r.dRaw, x.miss.join('; '), x.soft.join('; '), x.dmName, x.r.id ? 'https://khcn.tlu.edu.vn/CongBo/EditCongBo/' + x.r.id + '?toantruong=true' : ''])));
}
async function next() {
  const n = check(D.scan.recs).filter(x => x.miss.length).length;
  if (n && !await ask({ title: 'Vẫn sang HEMIS?', text: 'Còn ' + n + ' bài thiếu trường bắt buộc. Những bài này sẽ không đẩy được hoặc bị ghi sai trên HEMIS.\nNên sửa trên KHCN rồi bấm Quét lại.', ok: 'Vẫn sang HEMIS', cancel: 'Ở lại sửa' })) return;
  location.hash = '#day';
}
