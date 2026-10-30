// Màn "Rà soát bài đã có": so bài đã có trên HEMIS với KHCN, sửa loại / Q / năm / tên tạp chí (có xác nhận), nêu bài trùng để xem bằng tay.
import { esc, norm, MAP, QM, QN, DMQT, DMTN, matchDM, vnDate, fmtTime, sleep } from './core.js';
import { downloadXlsx } from './xlsx.js';
import { icon, pill, screenHtml, blk, tabsHtml, empty, ask, info, toast, regBlk, createBtn, $ } from './ui.js';
import * as B from './bridge.js';
import { D, loadHemis, HEMIS_API } from './data.js';
import { guide } from './huongdan.js';

const MAXR = 500;
let root, tab = 'all', err = '', tried = false;
const ticks = new Map();   // id bai HEMIS -> true/false (nguoi dung tick/bo tick); mac dinh tick bai sai loai/Q
const done = new Map();    // id bai HEMIS -> { ok } hoac { err }
let run = null;            // { on, ok, bad, total, msg }

const desc = (p, qt, tn, q) => (p === 1 ? 'Tạp chí' : p === 2 ? 'Kỷ yếu' : '?') + ' · ' + (DMQT[qt] || DMTN[tn] || 'chưa chọn') + (QN[q] ? ' · ' + QN[q] : '');

/* So tung bai tren HEMIS voi bai cung ten tren KHCN */
const compute = () => {
  const S = D.scan, H = D.hemis; if (!S || !H) return null;
  const byKey = {}; S.recs.forEach(r => { byKey[norm(r.t)] = r; });
  const fixes = [], flags = [], cnt = {};
  H.list.forEach(x => { const k = norm(x.teN_BAI_BAO); if (k.length > 5) (cnt[k] = cnt[k] || []).push(x); });
  Object.values(cnt).filter(v => v.length > 1).forEach(v => flags.push({ code: v.map(x => x.mA_BAI_BAO).join(', '), t: v[0].teN_BAI_BAO, why: 'Bài bị nhập trùng ' + v.length + ' lần trên HEMIS (sẽ bị đếm thừa). Cần xoá bớt bằng tay trên HEMIS; công cụ không tự xoá.' }));
  H.list.forEach(x => {
    const r = byKey[norm(x.teN_BAI_BAO)]; if (!r) return;
    const m = MAP(r.l); if (!m) return;
    const want = { phaN_LOAI: m.p, taP_CHI_QUOC_TE: m.qt || null, taP_CHI_TRONG_NUOC: m.tn || null, xeP_HANG_Q: QM[r.q] || x.xeP_HANG_Q || null };
    const y = r.y ? String(r.y) : '';
    const clsDiff = x.phaN_LOAI !== want.phaN_LOAI || (x.taP_CHI_QUOC_TE || null) !== want.taP_CHI_QUOC_TE || (x.taP_CHI_TRONG_NUOC || null) !== want.taP_CHI_TRONG_NUOC || (x.xeP_HANG_Q || null) !== want.xeP_HANG_Q;
    const yDiff = !!y && String(x.naM_CONG_BO) !== y;
    /* dong bo ten tap chi: chi khi ten tren KHCN da dung ten trong danh muc Bo KH&CN */
    const jDiff = m.p === 1 && !m.wos && !!r.j && (x.teN_TAP_CHI || '').trim() !== r.j.trim() && matchDM(r.j).lv === 'ok';
    if (jDiff) want.teN_TAP_CHI = r.j.trim();
    if (!(clsDiff || yDiff || jDiff)) return;
    fixes.push({
      x, r, id: x.id, want, y: yDiff ? +y : null, clsDiff, yDiff, jDiff, cls: clsDiff || jDiff,
      from: (clsDiff ? [desc(x.phaN_LOAI, x.taP_CHI_QUOC_TE, x.taP_CHI_TRONG_NUOC, x.xeP_HANG_Q)] : []).concat(yDiff ? ['Năm ' + x.naM_CONG_BO] : [], jDiff ? ['Tạp chí: ' + (x.teN_TAP_CHI || '(trống)')] : []),
      to: (clsDiff ? [desc(want.phaN_LOAI, want.taP_CHI_QUOC_TE, want.taP_CHI_TRONG_NUOC, want.xeP_HANG_Q)] : []).concat(yDiff ? ['Năm ' + y] : [], jDiff ? ['Tạp chí: ' + r.j.trim()] : [])
    });
  });
  return { fixes, flags };
};

const isOn = f => ticks.has(f.id) ? ticks.get(f.id) : f.cls;
const fixed = f => !!(done.get(f.id) && done.get(f.id).ok);
const selN = fixes => fixes.filter(f => !fixed(f) && isOn(f)).length;
const inTab = (f, t) => t === 'cls' ? f.clsDiff : t === 'year' ? f.yDiff : t === 'jn' ? f.jDiff : true;

const resHtml = f => {
  const d = done.get(f.id);
  if (d && d.ok) return pill('ok', 'Đã sửa');
  if (d && d.err) return pill('err', d.err);
  return (f.clsDiff ? pill('err', 'Sai loại / Q') : '') + (f.yDiff ? pill('warn', 'Lệch năm') : '') + (f.jDiff ? pill('info', 'Tên tạp chí') : '');
};
const lines = a => a.map(s => '<div>' + esc(s) + '</div>').join('');
const row = f => '<tr data-id="' + esc(f.id) + '"><td class="ck"><input type="checkbox" data-ck="' + esc(f.id) + '" aria-label="Chọn bài này"' + (isOn(f) && !fixed(f) ? ' checked' : '') + (fixed(f) || (run && run.on) ? ' disabled' : '') + '></td>' +
  '<td class="nowrap">' + esc(f.x.mA_BAI_BAO) + '</td><td class="t"><b>' + esc(f.x.teN_BAI_BAO) + '</b><div class="muted">KHCN: ' + esc(f.r.l) + '</div></td>' +
  '<td class="was">' + lines(f.from) + '</td><td class="will">' + lines(f.to) + '</td><td data-res>' + resHtml(f) + '</td></tr>';

const html = () => screenHtml({
  title: 'Rà soát bài đã có',
  acts: '<button class="btn" data-reload>' + icon('refresh') + '<span>Tải lại từ HEMIS</span></button><button class="btn" data-csv>' + icon('dl') + '<span>Tải danh sách</span></button>' + createBtn('rasoat'),
  foot: true
});

const footHtml = fixes => {
  const n = selN(fixes), going = run && run.on;
  const pct = run && run.total ? Math.round((run.ok + run.bad) / run.total * 100) : 0;
  return '<span>' + (going ? '<b>' + run.total + ' bài</b> đang sửa' : '<b>' + n + ' bài</b> đã chọn') + '</span>' + (run ? '<span class="muted">· ' + esc(run.msg) + '</span>' : '') + '<div class="sp"></div>' +
    (run ? '<div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><span class="' + (!going && run.bad ? 'err' : !going ? 'ok' : '') + '" style="width:' + Math.max(pct, going ? 1 : 0) + '%"></span></div>' : '') +
    '<button class="btn pri" data-fix' + (!n || going ? ' disabled' : '') + '>' + icon('edit') + '<span>' + (going ? 'Đang sửa…' : 'Sửa ' + n + ' bài trên HEMIS') + '</span></button>';
};

const scr = {
  id: 'rasoat', title: 'Rà soát bài đã có', icon: 'check', group: 2, busy: ['hemis'], on: ['scan', 'hemis'],
  badge: () => { const C = compute(); const n = C ? C.fixes.filter(f => !fixed(f) && f.clsDiff).length : 0; return n ? { n, label: n + ' bài sai loại hoặc Q' } : null; },
  init(el) {
    root = el; el.innerHTML = html();
    regBlk('rasoat.tongquan', { scr: 'rasoat', kind: 'info', title: 'Tổng quan', render: () => scr.render(), xlsx: xTong });
    regBlk('rasoat.bang', { scr: 'rasoat', title: 'Bài cần sửa', render: () => scr.render(), xlsx: () => xBang(tab), close: () => { tab = 'all'; ticks.clear(); } });
    regBlk('rasoat.tay', { scr: 'rasoat', title: 'Bài trùng trên HEMIS, cần xem bằng tay', render: () => scr.render(), xlsx: xTay });
    el.addEventListener('click', async e => {
      const tb = e.target.closest('[data-tab]'); if (tb) { tab = tb.dataset.tab; scr.render(); return; }
      if (e.target.closest('[data-goto]')) { location.hash = '#' + e.target.closest('[data-goto]').dataset.goto; return; }
      if (e.target.closest('[data-reload]')) { await reload(); return; }
      if (e.target.closest('[data-csv]')) csv();
      if (e.target.closest('[data-fix]')) fix();
    });
    el.addEventListener('change', e => {
      const ck = e.target.closest('[data-ck]'), all = e.target.closest('[data-all]'), C = compute(); if (!C) return;
      if (ck) ticks.set(ck.dataset.ck, ck.checked);
      else if (all) { C.fixes.filter(f => inTab(f, tab) && !fixed(f)).forEach(f => ticks.set(f.id, all.checked)); el.querySelectorAll('[data-ck]:not(:disabled)').forEach(c => { c.checked = all.checked; }); }
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
      sub.textContent = 'Cần dữ liệu quét từ KHCN để so sánh';
      body.innerHTML = errHtml + '<div class="card">' + empty('scan', 'Chưa có dữ liệu quét', 'Màn này so bài đã có trên HEMIS với dữ liệu KHCN. Hãy quét năm báo cáo trên KHCN trước.', '<button class="btn pri" data-goto="quet">' + icon('scan') + 'Sang Quét &amp; kiểm tra</button>') + '</div>';
      foot.innerHTML = '<span class="muted">Chưa có dữ liệu quét từ KHCN.</span>'; return;
    }
    if (!H) {
      sub.textContent = 'Đang lấy bài đã có trên HEMIS';
      body.innerHTML = errHtml + '<div class="card">' + empty('refresh', D.busy.hemis ? 'Đang lấy danh sách bài trên HEMIS…' : 'Chưa có dữ liệu HEMIS', 'Anh/chị cần đăng nhập HEMIS trên Chrome để công cụ đọc được danh sách bài của Trường.', D.busy.hemis ? '' : '<button class="btn pri" data-reload>' + icon('refresh') + 'Lấy từ HEMIS</button>') + '</div>';
      foot.innerHTML = '<span class="muted">Chưa có dữ liệu HEMIS.</span>'; return;
    }
    const { fixes, flags } = compute();
    const L = fixes.filter(f => inTab(f, tab));
    const c = t => fixes.filter(f => inTab(f, t)).length;
    sub.textContent = H.list.length.toLocaleString('vi-VN') + ' bài trên HEMIS, so với ' + S.recs.length.toLocaleString('vi-VN') + ' bài KHCN quét (' + vnDate(S.f) + ' – ' + vnDate(S.t) + ') · HEMIS lấy lúc ' + fmtTime(H.at);
    body.innerHTML = errHtml +
      blk('rasoat.tongquan', 'Tổng quan', '<div class="note">' + icon('info') + '<div>Đã tick sẵn các bài sai loại, Q hoặc tên tạp chí. Bài chỉ lệch năm để anh/chị tự quyết (thường do bài đăng online năm trước, in năm sau). Công cụ chỉ sửa bài, không xoá bản ghi nào.</div></div><div class="stats">' +
        '<div class="card stat' + (c('cls') ? ' err' : '') + '"><div class="k">' + icon('alert') + 'Sai loại hoặc Q</div><div class="v">' + c('cls') + '</div><div class="h">Ảnh hưởng chỉ số Bộ tính</div></div>' +
        '<div class="card stat warn"><div class="k">' + icon('calendar') + 'Lệch năm</div><div class="v">' + c('year') + '</div><div class="h">Năm trên HEMIS khác KHCN</div></div>' +
        '<div class="card stat pri"><div class="k">' + icon('edit') + 'Tên tạp chí</div><div class="v">' + c('jn') + '</div><div class="h">Đồng bộ theo tên chuẩn Bộ KH&amp;CN</div></div>' +
        '<div class="card stat' + (flags.length ? ' warn' : '') + '"><div class="k">' + icon('copy') + 'Trùng trên HEMIS</div><div class="v">' + flags.length + '</div><div class="h">Cần xem bằng tay</div></div></div>', { pad: true }) +
      blk('rasoat.bang', 'Bài cần sửa', '<div class="tw"><table class="tbl"><thead><tr><th class="ck"><input type="checkbox" data-all aria-label="Chọn tất cả bài trong mục này"' + (L.some(f => !fixed(f) && !isOn(f)) ? '' : ' checked') + (run && run.on ? ' disabled' : '') + '></th>' +
        '<th>Mã HEMIS</th><th class="wt">Bài báo</th><th>Đang ghi trên HEMIS</th><th>Sẽ sửa thành</th><th>Vấn đề / kết quả</th></tr></thead><tbody>' +
        (L.length ? L.slice(0, MAXR).map(row).join('') : '<tr><td colspan="6">' + empty('check', 'Không có bài nào cần sửa trong mục này', '') + '</td></tr>') + '</tbody></table></div>' +
        (L.length > MAXR ? '<div class="more">Đang hiện ' + MAXR + '/' + L.length + ' bài. Bài nào được tick đều sẽ được sửa, kể cả bài chưa hiện ở đây.</div>' : ''),
        { headHtml: tabsHtml([['all', 'Tất cả (' + c('all') + ')'], ['cls', 'Sai loại / Q (' + c('cls') + ')'], ['year', 'Lệch năm (' + c('year') + ')'], ['jn', 'Tên tạp chí (' + c('jn') + ')']], tab) }) +
      blk('rasoat.tay', 'Cần xem bằng tay (' + flags.length + ')', '<div class="tw"><table class="tbl"><thead><tr><th>Mã HEMIS</th><th class="wt">Bài báo</th><th>Vấn đề</th></tr></thead><tbody>' +
        (flags.length ? flags.map(f => '<tr><td class="nowrap">' + esc(f.code) + '</td><td class="t"><b>' + esc(f.t) + '</b></td><td>' + pill('warn', 'Trùng') + ' ' + esc(f.why) + '</td></tr>').join('') : '<tr><td colspan="3">' + empty('check', 'Không có bài trùng trên HEMIS', '') + '</td></tr>') + '</tbody></table></div>');
    if (!body.querySelector('[data-blk]')) body.insertAdjacentHTML('beforeend', '<div class="card">' + empty('table', 'Các khối đang đóng', 'Bấm “Tạo bảng” ở trên để tạo lại bảng, hoặc tải lại từ HEMIS để hiện lại phần Tổng quan.', '') + '</div>');
    /* dang sua: khong cho dong bang */
    const xb = body.querySelector('[data-close="rasoat.bang"]'); if (xb && run && run.on) { xb.disabled = true; xb.title = 'Đang sửa, chưa đóng được'; }
    foot.innerHTML = footHtml(fixes);
  }
};
export default scr;

const syncFoot = () => { const foot = $('[data-foot]', root), C = compute(); if (foot && C) foot.innerHTML = footHtml(C.fixes); };
const fail = (x, quiet) => { if (x.code === 'noext' && !quiet) guide(); err = x.message; toast(x.message, 'err'); scr.render(); };

async function reload() {
  err = '';
  try { await loadHemis(); toast('Đã lấy lại danh sách bài trên HEMIS'); } catch (x) { fail(x); }
}

/* ---- Xuat Excel (day du, khong gioi han 500 dong) ---- */
const kinds = f => [f.clsDiff ? 'Sai loại/Q' : '', f.yDiff ? 'Lệch năm' : '', f.jDiff ? 'Tên tạp chí' : ''].filter(Boolean).join('; ');
const fixSheet = fixes => ({ name: 'Bài cần sửa', head: 1, freezeCols: 2, rows: [['Mã HEMIS', 'Tên bài báo', 'Loại (KHCN)', 'Đang ghi trên HEMIS', 'Sẽ sửa thành', 'Vấn đề', 'Kết quả']]
  .concat(fixes.map(f => { const d = done.get(f.id); return [f.x.mA_BAI_BAO, f.x.teN_BAI_BAO, f.r.l, f.from.join(' | '), f.to.join(' | '), kinds(f), d ? (d.ok ? 'Đã sửa' : 'Lỗi: ' + d.err) : '']; })) });
const flagSheet = flags => ({ name: 'Bài trùng', head: 1, rows: [['Mã HEMIS', 'Tên bài báo', 'Vấn đề']].concat(flags.map(f => [f.code, f.t, f.why])) });
const TABN = { all: 'Tất cả', cls: 'Sai loại hoặc Q', year: 'Lệch năm', jn: 'Tên tạp chí' };
function csv() {
  const C = compute(); if (!C) { toast('Chưa có dữ liệu để tải.', 'err'); return; }
  downloadXlsx('Rà soát bài đã có trên HEMIS', [fixSheet(C.fixes), flagSheet(C.flags)]);
}
function xBang(t) { const C = compute(); if (C) downloadXlsx('Rà soát bài cần sửa ' + TABN[t], Object.assign(fixSheet(C.fixes.filter(f => inTab(f, t))), { name: TABN[t] })); }
function xTay() { const C = compute(); if (C) downloadXlsx('Rà soát bài trùng trên HEMIS', flagSheet(C.flags)); }
function xTong() {
  const C = compute(); if (!C) return;
  const c = t => C.fixes.filter(f => inTab(f, t)).length;
  downloadXlsx('Rà soát tổng quan', { name: 'Tổng quan', rows: [['Chỉ tiêu', 'Số bài'], ['Sai loại hoặc Q', c('cls')], ['Lệch năm', c('year')], ['Tên tạp chí cần đồng bộ', c('jn')], ['Trùng trên HEMIS (xem bằng tay)', C.flags.length]] });
}

async function fix() {
  if (run && run.on) return;
  const C = compute(); if (!C) return;
  const todo = C.fixes.filter(f => !fixed(f) && isOn(f));
  if (!todo.length) return;
  const ok = await ask({ title: 'Sửa ' + todo.length + ' bài trên HEMIS?', text: 'Công cụ sẽ cập nhật ' + todo.length + ' bài đã có trên HEMIS theo dữ liệu KHCN (loại tạp chí/kỷ yếu, xếp hạng Q, năm công bố hoặc tên tạp chí, tuỳ bài).\nKhông xoá bản ghi nào. Nên bấm “Tải danh sách” trước để lưu lại giá trị cũ.', ok: 'Sửa ' + todo.length + ' bài', cancel: 'Chưa sửa' });
  if (!ok) return;
  run = { on: true, ok: 0, bad: 0, total: todo.length, msg: 'Đang sửa…' }; err = '';
  scr.render();
  let stop = null;
  for (const f of todo) {
    try {
      const g = await B.hemis('GET', HEMIS_API + '/DetailWithPermission/' + f.id + '?pid=00000000-0000-0000-0000-000000000000');
      const d = g.data; if (!d) throw new Error('Không đọc được bài trên HEMIS');
      Object.assign(d, f.want); if (f.y) d.naM_CONG_BO = f.y;
      await B.hemis('PUT', HEMIS_API + '/' + f.id, d);
      done.set(f.id, { ok: true }); run.ok++;
    } catch (e) { done.set(f.id, { err: e.message }); run.bad++; if (B.isLogin(e)) stop = e; }
    run.msg = 'Đã xử lý ' + (run.ok + run.bad) + '/' + run.total;
    paintRow(f); syncFoot();
    if (stop) break;
    await sleep(150);
  }
  run.on = false;
  run.msg = (stop ? 'Dừng giữa chừng: ' : 'Xong: ') + 'sửa được ' + run.ok + ', lỗi ' + run.bad;
  if (!stop) { try { await loadHemis(); } catch (e) { /* de nguoi dung bam Tai lai */ } }
  scr.render();
  if (stop) await info('Dừng sửa vì hết phiên đăng nhập', stop.message + '\nĐã sửa được ' + run.ok + ' bài trước khi dừng. Đăng nhập lại rồi bấm Sửa tiếp.');
  else toast('Đã sửa ' + run.ok + ' bài' + (run.bad ? ', ' + run.bad + ' bài lỗi' : '') + ' trên HEMIS.', run.bad ? 'err' : undefined);
}

/* Cap nhat nhanh mot dong trong luc dang sua */
function paintRow(f) {
  const tr = root.querySelector('tr[data-id="' + CSS.escape(f.id) + '"]'); if (!tr) return;
  const c = tr.querySelector('[data-res]'); if (c) c.innerHTML = resHtml(f);
  const ck = tr.querySelector('[data-ck]'); if (ck && fixed(f)) { ck.checked = false; ck.disabled = true; }
}
