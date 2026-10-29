// Màn "Đẩy lên HEMIS": so bài đã quét trên KHCN với bài đã có trên HEMIS, đẩy các bài chưa có (một lần, có xác nhận).
import { esc, norm, MAP, QM, vnDate, fmtTime, shortType, downloadCsv, sleep, DV } from './core.js';
import { icon, pill, screenHtml, blk, tabsHtml, steps, empty, ask, info, toast, $ } from './ui.js';
import * as B from './bridge.js';
import { D, loadHemis, HEMIS_API } from './data.js';
import { guide } from './huongdan.js';

const MAXR = 500;
let root, tab = 'new', err = '', tried = false;
const off = new Set();      // khoa bai bo tick (mac dinh moi bai deu duoc tick)
const done = new Map();     // khoa bai -> { ok, code } hoac { err }: ket qua lan day gan nhat
let run = null;             // { on, ok, bad, total, msg } khi dang day hoac vua day xong

const canTick = s => s === 'new' || s === 'nc' || s === 'un';

/* Ghep bai KHCN voi bai da co tren HEMIS. st: new (se day) | nc (da duyet nhung khong ap dung tinh) | un (chua phe duyet) | have | ok (vua day) | dup | bad */
const build = () => {
  const S = D.scan, H = D.hemis; if (!S || !H) return [];
  const have = new Map(); H.list.forEach(x => { const k = norm(x.teN_BAI_BAO); if (k.length > 5 && !have.has(k)) have.set(k, x); });
  const seen = new Set();
  return S.recs.map(r => {
    const k = norm(r.t), m = MAP(r.l), y = r.y ? String(r.y) : '', hx = have.get(k);
    let st, why = '';
    if (hx) st = 'have'; else if (seen.has(k)) st = 'dup'; else if (!m || !y) { st = 'bad'; why = !m ? 'Không rõ loại bài' : 'Thiếu ngày công bố'; }
    else if (!r.ap) st = 'un'; else if (r.nc || m.info) st = 'nc'; else st = 'new';
    seen.add(k);
    const warn = [];
    if (m && m.wos && !QM[r.q]) warn.push('Thiếu xếp hạng Q');
    if (m && m.info) warn.push('Bài thông tin, không phải bài báo');
    if (r.j && norm(r.j) === k) warn.push('Tên tạp chí trùng tên bài');
    if (!r.j) warn.push('Thiếu tên tạp chí');
    if (m && m.tn && m.tn !== '03' && String(r.d || '') > '2026-09-30') warn.push('Sau 30/9/2026: chỉ được tính nếu tạp chí thuộc danh mục Bộ KH&CN');
    return withDone({ r, k, m, y, st, why, warn, code: hx ? hx.mA_BAI_BAO : '', err: '' });
  }).sort((a, b) => String(a.r.d || '').localeCompare(String(b.r.d || '')));
};
const withDone = x => { const d = done.get(x.k); if (d && d.ok && canTick(x.st)) { x.st = 'ok'; x.code = d.code; } else if (d && d.err && canTick(x.st)) x.err = d.err; return x; };

const inTab = (x, t) => t === 'new' ? canTick(x.st) : t === 'warn' ? canTick(x.st) && x.warn.length > 0 : t === 'have' ? x.st === 'have' || x.st === 'ok' : x.st === 'dup' || x.st === 'bad';
const selN = items => items.filter(x => canTick(x.st) && !off.has(x.k)).length;

const khcnPill = r => (r.ap ? pill('ok', 'Đã duyệt') : r.cs ? pill('warn', 'Cần sửa') : pill('mut', 'Chưa duyệt', 'info')) + (r.nc ? pill('mut', 'Không tính', 'info') : '');
const resHtml = x => {
  if (x.err) return pill('err', x.err);
  if (x.st === 'ok') return pill('ok', 'Đã đẩy · ' + x.code);
  if (x.st === 'have') return pill('ok', 'Đã có' + (x.code ? ' · ' + x.code : ''));
  if (x.st === 'dup') return pill('warn', 'Trùng tên trong KHCN');
  if (x.st === 'bad') return pill('err', x.why);
  return x.warn.length ? x.warn.map(w => pill('warn', w)).join(' ') : '<span class="muted">Chờ đẩy</span>';
};
const row = (x, tick) => {
  const r = x.r;
  return '<tr data-k="' + esc(x.k) + '">' + (tick ? '<td class="ck">' + (canTick(x.st) ? '<input type="checkbox" data-ck="' + esc(x.k) + '" aria-label="Chọn bài này"' + (off.has(x.k) ? '' : ' checked') + (run && run.on ? ' disabled' : '') + '>' : '') + '</td>' : '') +
    '<td class="t"><b>' + esc(r.t) + '</b><div class="muted">' + esc(r.j || '(chưa có tên tạp chí)') + '</div></td><td title="' + esc(r.l) + '">' + esc(shortType(r.l)) + '</td><td>' + (QM[r.q] ? esc(r.q) : '<span class="muted">—</span>') + '</td>' +
    '<td class="nowrap">' + esc(r.d ? vnDate(r.d) : '—') + '</td><td>' + khcnPill(r) + '</td><td data-res>' + resHtml(x) + '</td></tr>';
};

const html = () => screenHtml({
  title: 'Đẩy lên HEMIS',
  acts: '<button class="btn" data-reload>' + icon('refresh') + '<span>Tải lại từ HEMIS</span></button><button class="btn" data-csv>' + icon('dl') + '<span>Tải kết quả</span></button>',
  foot: true
});

const footHtml = items => {
  const n = selN(items), going = run && run.on;
  const pct = run && run.total ? Math.round((run.ok + run.bad) / run.total * 100) : 0;
  return '<span>' + (going ? '<b>' + run.total + ' bài</b> đang đẩy' : '<b>' + n + ' bài</b> đã chọn') + '</span>' +
    (run ? '<span class="muted">· ' + esc(run.msg) + '</span>' : '') + '<div class="sp"></div>' +
    (run ? '<div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><span class="' + (!going && run.bad ? 'err' : !going ? 'ok' : '') + '" style="width:' + Math.max(pct, going ? 1 : 0) + '%"></span></div>' : '') +
    '<button class="btn pri" data-push' + (!n || going ? ' disabled' : '') + '>' + icon('up') + '<span>' + (going ? 'Đang đẩy…' : 'Đẩy ' + n + ' bài lên HEMIS') + '</span></button>';
};

const scr = {
  id: 'day', title: 'Đẩy lên HEMIS', icon: 'up', group: 2, busy: ['hemis'], on: ['scan', 'hemis'],
  badge: () => { if (!D.scan || !D.hemis) return null; const n = build().filter(x => canTick(x.st)).length; return n ? { n, label: n + ' bài chưa có trên HEMIS', info: true } : null; },
  init(el) {
    root = el; el.innerHTML = html();
    el.addEventListener('click', async e => {
      const tb = e.target.closest('[data-tab]'); if (tb) { tab = tb.dataset.tab; scr.render(); return; }
      if (e.target.closest('[data-goto]')) { location.hash = '#' + e.target.closest('[data-goto]').dataset.goto; return; }
      if (e.target.closest('[data-reload]')) { await reload(); return; }
      if (e.target.closest('[data-csv]')) csv();
      if (e.target.closest('[data-push]')) push();
    });
    el.addEventListener('change', e => {
      const ck = e.target.closest('[data-ck]'), all = e.target.closest('[data-all]');
      if (ck) { if (ck.checked) off.delete(ck.dataset.ck); else off.add(ck.dataset.ck); }
      else if (all) { build().filter(x => inTab(x, tab) && canTick(x.st)).forEach(x => { if (all.checked) off.delete(x.k); else off.add(x.k); }); el.querySelectorAll('[data-ck]').forEach(c => { c.checked = all.checked; }); }
      else return;
      syncFoot();
    });
  },
  render() {
    if (!D.hemis && !tried && !D.busy.hemis) { tried = true; loadHemis().catch(x => fail(x, true)); }
    const body = $('[data-body]', root), foot = $('[data-foot]', root), sub = $('[data-sub]', root);
    const S = D.scan, H = D.hemis;
    $('[data-reload]', root).disabled = !!(run && run.on);
    const errHtml = err ? '<div class="note err" role="alert">' + icon('alert') + '<div>' + esc(err) + '</div></div>' : '';
    if (!S) {
      sub.textContent = 'Cần quét dữ liệu KHCN trước khi đẩy';
      body.innerHTML = errHtml + steps(1) + '<div class="card">' + empty('scan', 'Chưa có dữ liệu quét', 'Hãy quét năm báo cáo trên KHCN và sửa các bài thiếu thông tin, rồi quay lại đây để đẩy một lần.', '<button class="btn pri" data-goto="quet">' + icon('scan') + 'Sang Quét &amp; kiểm tra</button>') + '</div>';
      foot.innerHTML = '<span class="muted">Chưa có dữ liệu quét từ KHCN.</span>'; return;
    }
    if (!H) {
      sub.textContent = 'Đang so với bài đã có trên HEMIS';
      body.innerHTML = errHtml + steps(3) + '<div class="card">' + empty('refresh', D.busy.hemis ? 'Đang lấy danh sách bài trên HEMIS…' : 'Chưa có dữ liệu HEMIS', 'Công cụ cần biết Trường đã có những bài nào trên HEMIS để chỉ đẩy các bài còn thiếu. Anh/chị cần đăng nhập HEMIS trên Chrome.', D.busy.hemis ? '' : '<button class="btn pri" data-reload>' + icon('refresh') + 'Lấy từ HEMIS</button>') + '</div>';
      foot.innerHTML = '<span class="muted">Chưa có dữ liệu HEMIS để so sánh.</span>'; return;
    }
    const all = build();
    const c = t => all.filter(x => inTab(x, t)).length, ns = s => all.filter(x => x.st === s).length;
    const L = all.filter(x => inTab(x, tab)), tick = tab === 'new' || tab === 'warn';
    sub.textContent = 'So với ' + H.list.length.toLocaleString('vi-VN') + ' bài đã có trên HEMIS của Trường · lấy lúc ' + fmtTime(H.at);
    body.innerHTML = errHtml + steps(3) +
      blk('day.tongquan', 'Tổng quan', '<div class="stats">' +
        '<div class="card stat pri"><div class="k">' + icon('up') + 'Sẽ đẩy</div><div class="v">' + c('new').toLocaleString('vi-VN') + '</div><div class="h">Đã duyệt ' + ns('new') + ' · chưa duyệt ' + ns('un') + ' · không tính ' + ns('nc') + '</div></div>' +
        '<div class="card stat"><div class="k">' + icon('check') + 'Đã có trên HEMIS</div><div class="v">' + c('have').toLocaleString('vi-VN') + '</div><div class="h">Bỏ qua</div></div>' +
        '<div class="card stat warn"><div class="k">' + icon('info') + 'Có cảnh báo</div><div class="v">' + c('warn') + '</div><div class="h">Vẫn đẩy được, nên xem</div></div>' +
        '<div class="card stat' + (c('skip') ? ' err' : '') + '"><div class="k">' + icon('alert') + 'Trùng hoặc lỗi loại</div><div class="v">' + c('skip') + '</div><div class="h">Không đẩy (trùng ' + ns('dup') + ' · lỗi loại/ngày ' + ns('bad') + ')</div></div></div>', { card: false }) +
      blk('day.bang', 'Danh sách bài', '<div class="tw"><table class="tbl"><thead><tr>' + (tick ? '<th class="ck"><input type="checkbox" data-all aria-label="Chọn tất cả bài trong mục này"' + (L.some(x => canTick(x.st) && off.has(x.k)) ? '' : ' checked') + (run && run.on ? ' disabled' : '') + '></th>' : '') +
        '<th class="wt">Bài báo</th><th>Loại</th><th>Q</th><th>Ngày</th><th>Tình trạng KHCN</th><th>Kết quả</th></tr></thead><tbody>' +
        (L.length ? L.slice(0, MAXR).map(x => row(x, tick)).join('') : '<tr><td colspan="' + (tick ? 7 : 6) + '">' + empty('check', 'Không có bài nào trong mục này', '') + '</td></tr>') + '</tbody></table></div>' +
        (L.length > MAXR ? '<div class="more">Đang hiện ' + MAXR + '/' + L.length + ' bài. Bài nào được tick đều sẽ được đẩy, kể cả bài chưa hiện ở đây.</div>' : ''),
        { headHtml: tabsHtml([['new', 'Sẽ đẩy (' + c('new') + ')'], ['warn', 'Có cảnh báo (' + c('warn') + ')'], ['have', 'Đã có (' + c('have') + ')'], ['skip', 'Bỏ qua (' + c('skip') + ')']], tab) });
    foot.innerHTML = footHtml(all);
  }
};
export default scr;

const syncFoot = () => { const foot = $('[data-foot]', root); if (foot && D.hemis && D.scan) foot.innerHTML = footHtml(build()); };
const fail = (x, quiet) => { if (x.code === 'noext' && !quiet) guide(); err = x.message; toast(x.message, 'err'); scr.render(); };

async function reload() {
  err = '';
  try { await loadHemis(); toast('Đã lấy lại danh sách bài trên HEMIS'); } catch (x) { fail(x); }
}

function csv() {
  if (!D.scan || !D.hemis) { toast('Chưa có dữ liệu để tải.', 'err'); return; }
  const txt = { new: 'Chưa đẩy', nc: 'Không áp dụng tính (chưa đẩy)', un: 'Chưa phê duyệt (chưa đẩy)', have: 'Đã có trên HEMIS', ok: 'Đã đẩy thành công', dup: 'Trùng trong KHCN', bad: 'Không rõ loại/ngày' };
  downloadCsv('Kết quả đẩy HEMIS', [['Mã HEMIS', 'Tên bài báo', 'Tạp chí', 'Loại', 'Q', 'Ngày công bố', 'Tình trạng', 'Cảnh báo', 'Ghi chú lỗi']]
    .concat(build().map(x => [x.code, x.r.t, x.r.j, x.r.l, x.r.q === 'NONE' ? '' : x.r.q, x.r.dRaw, x.err ? 'Lỗi' : txt[x.st], x.warn.join('; '), x.err || x.why])));
}

async function push() {
  if (run && run.on) return;
  const keys = new Set(build().filter(x => canTick(x.st) && !off.has(x.k)).map(x => x.k));
  if (!keys.size) return;
  const ok = await ask({ title: 'Đẩy ' + keys.size + ' bài lên HEMIS?', text: 'Công cụ sẽ thêm ' + keys.size + ' bài báo mới vào HEMIS của Trường (không đẩy tác giả, không xoá hay sửa bài nào đang có).\nTrước khi đẩy, công cụ lấy lại danh sách trên HEMIS để bỏ qua bài nay đã có.', ok: 'Đẩy ' + keys.size + ' bài', cancel: 'Chưa đẩy' });
  if (!ok) return;
  run = { on: true, ok: 0, bad: 0, total: keys.size, msg: 'Đang kiểm tra lại HEMIS…' }; err = '';
  scr.render();
  let stop = null;
  try {
    while (D.busy.hemis) await sleep(300);
    await loadHemis();
  } catch (x) { run = null; scr.render(); fail(x); return; }
  const cur = build().filter(x => canTick(x.st) && keys.has(x.k));
  if (cur.length < keys.size) toast((keys.size - cur.length) + ' bài nay đã có trên HEMIS nên được bỏ qua.');
  run.total = cur.length;
  /* ma bai: BBKH{nam}-{so tiep theo} */
  const maxNo = {};
  D.hemis.list.forEach(x => { const m = String(x.mA_BAI_BAO || '').match(/^BBKH(\d{4})-(\d+)$/); if (m) maxNo[m[1]] = Math.max(maxNo[m[1]] || 0, +m[2]); });
  for (const x of cur) {
    const r = x.r, y = x.y;
    run.msg = 'Đã đẩy ' + (run.ok + run.bad) + '/' + run.total;
    maxNo[y] = (maxNo[y] || 0) + 1;
    const code = 'BBKH' + y + '-' + maxNo[y];
    const vol = r.vol ? (r.iss ? r.vol + '(' + r.iss + ')' : r.vol) : (r.iss || '');
    const rec = { id: crypto.randomUUID(), doN_VI_ID: DV, mA_BAI_BAO: code, teN_BAI_BAO: r.t, teN_TAP_CHI: r.j || '', naM_CONG_BO: +y, phaN_LOAI: x.m.p, isBuildIn: false, isBuildInAll: false };
    if (vol) rec.taP_SO = vol;
    if (r.pg) rec.trang = r.pg;
    if (x.m.qt) rec.taP_CHI_QUOC_TE = x.m.qt;
    if (x.m.tn) rec.taP_CHI_TRONG_NUOC = x.m.tn;
    if (QM[r.q]) rec.xeP_HANG_Q = QM[r.q];
    try { await B.hemis('POST', HEMIS_API, rec); done.set(x.k, { ok: true, code }); run.ok++; }
    catch (e) { maxNo[y]--; done.set(x.k, { err: e.message }); run.bad++; if (B.isLogin(e)) stop = e; }
    paintRow(x);
    run.msg = 'Đã đẩy ' + (run.ok + run.bad) + '/' + run.total;
    syncFoot();
    if (stop) break;
    await sleep(150);
  }
  run.on = false;
  run.msg = (stop ? 'Dừng giữa chừng: ' : 'Xong: ') + 'thành công ' + run.ok + ', lỗi ' + run.bad;
  if (!stop) { try { await loadHemis(); } catch (e) { /* so lieu hien tai van dung, nguoi dung co the bam Tai lai */ } }
  scr.render();
  if (stop) await info('Dừng đẩy vì hết phiên đăng nhập', stop.message + '\nĐã đẩy được ' + run.ok + ' bài trước khi dừng. Đăng nhập lại rồi bấm Đẩy tiếp: bài đã có sẽ được bỏ qua.');
  else toast('Đã đẩy ' + run.ok + ' bài' + (run.bad ? ', ' + run.bad + ' bài lỗi' : '') + ' lên HEMIS.', run.bad ? 'err' : undefined);
}

/* Cap nhat nhanh mot dong trong luc dang day (khong ve lai ca bang) */
function paintRow(x) {
  const tr = root.querySelector('tr[data-k="' + CSS.escape(x.k) + '"]'); if (!tr) return;
  const y = withDone({ ...x, err: '' }), c = tr.querySelector('[data-res]');
  if (c) c.innerHTML = resHtml(y);
  const ck = tr.querySelector('[data-ck]'); if (ck && y.st === 'ok') { ck.checked = false; ck.disabled = true; }
}
