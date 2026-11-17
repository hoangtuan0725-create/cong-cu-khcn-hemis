// Đẩy lên HEMIS · Bài báo: so bài đã quét trên KHCN với HEMIS; tab Thêm / Sửa / Chưa duyệt / Trùng / Bỏ qua / Đã khớp.
// Gộp màn "Đẩy" và "Rà soát bài đã có" cũ. Ghi lên HEMIS (thêm, sửa) chỉ chạy sau khi xác nhận; không xoá bài nào.
import { esc, norm, MAP, QM, QN, DMQT, DMTN, matchDM, vnDate, fmtTime, shortType, sleep, DV } from './core.js';
import { downloadXlsx } from './xlsx.js';
import { icon, pill, blk, tabsHtml, empty, ask, info, toast, regBlk } from './ui.js';
import * as B from './bridge.js';
import { D, loadHemis, HEMIS_API } from './data.js';
import { setting } from './caidat.js';

const MAXR = 500;
let tab = 'them', run = null, ctx = null;
const off = new Set();     // bai "Them" bi bo tick (mac dinh tick het)
const ticks = new Map();   // id HEMIS -> tick/bo tick o tab Sua (mac dinh tick bai sai loai/Q)
const done = new Map();    // khoa bai (them) hoac id HEMIS (sua) -> { ok, code } | { err }

/* bai chua duyet chi duoc them khi Cai dat cho phep */
const canAdd = s => s === 'new' || s === 'nc' || (s === 'un' && !setting('chiDuyet'));

/* ---- Ghep bai KHCN voi HEMIS. st: new | nc | un | have | ok (vua them) | dup | bad ---- */
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
    const x = { r, k, m, y, st, why, warn, hid: hx ? hx.id : '', code: hx ? hx.mA_BAI_BAO : '', err: '' };
    const d = done.get(k); if (d && canAdd(st)) { if (d.ok) { x.st = 'ok'; x.code = d.code; } else x.err = d.err; }
    return x;
  }).sort((a, b) => String(a.r.d || '').localeCompare(String(b.r.d || '')));
};

/* ---- Bai da co tren HEMIS nhung ghi khac KHCN (loai, Q, nam, ten tap chi) + bai trung tren HEMIS ---- */
const desc = (p, qt, tn, q) => (p === 1 ? 'Tạp chí' : p === 2 ? 'Kỷ yếu' : '?') + ' · ' + (DMQT[qt] || DMTN[tn] || 'chưa chọn') + (QN[q] ? ' · ' + QN[q] : '');
const compare = () => {
  const S = D.scan, H = D.hemis; if (!S || !H) return { fixes: [], flags: [] };
  const byKey = {}; S.recs.forEach(r => { byKey[norm(r.t)] = r; });
  const fixes = [], flags = [], cnt = {};
  H.list.forEach(x => { const k = norm(x.teN_BAI_BAO); if (k.length > 5) (cnt[k] = cnt[k] || []).push(x); });
  Object.values(cnt).filter(v => v.length > 1).forEach(v => flags.push({ code: v.map(x => x.mA_BAI_BAO).join(', '), t: v[0].teN_BAI_BAO, why: 'Bị nhập trùng ' + v.length + ' lần trên HEMIS (sẽ bị đếm thừa). Xoá bớt bằng tay trên HEMIS; công cụ không tự xoá.' }));
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
    fixes.push({ x, r, id: x.id, want, y: yDiff ? +y : null, clsDiff, yDiff, jDiff,
      from: (clsDiff ? [desc(x.phaN_LOAI, x.taP_CHI_QUOC_TE, x.taP_CHI_TRONG_NUOC, x.xeP_HANG_Q)] : []).concat(yDiff ? ['Năm ' + x.naM_CONG_BO] : [], jDiff ? ['Tạp chí: ' + (x.teN_TAP_CHI || '(trống)')] : []),
      to: (clsDiff ? [desc(want.phaN_LOAI, want.taP_CHI_QUOC_TE, want.taP_CHI_TRONG_NUOC, want.xeP_HANG_Q)] : []).concat(yDiff ? ['Năm ' + y] : [], jDiff ? ['Tạp chí: ' + r.j.trim()] : []) });
  });
  return { fixes, flags };
};
/* bai lech nam de anh/chi tu quyet nen mac dinh khong tick */
const fixOn = f => !fixed(f) && (ticks.has(f.id) ? ticks.get(f.id) : f.clsDiff || f.jDiff);
const fixed = f => !!(done.get(f.id) && done.get(f.id).ok);

/* bai tren HEMIS (cung khoang nam da quet) khong khop bai nao tren KHCN: bai thu, bai la, bai nhap tay ngoai KHCN */
const lone = () => {
  const S = D.scan, H = D.hemis; if (!S || !H) return [];
  const keys = new Set(S.recs.map(r => norm(r.t))), y0 = +S.f.slice(0, 4), y1 = +S.t.slice(0, 4);
  return H.list.filter(x => +x.naM_CONG_BO >= y0 && +x.naM_CONG_BO <= y1 && !keys.has(norm(x.teN_BAI_BAO)));
};
const all = () => { const L = build(), C = compare(), fx = new Set(C.fixes.map(f => f.id)); return { L, C, lone: lone(), khop: L.filter(x => (x.st === 'have' && !fx.has(x.hid)) || x.st === 'ok') }; };
const TABS = { them: 'Thêm', sua: 'Sửa', chua: 'Chưa duyệt', trung: 'Trùng trên HEMIS', lone: 'Chỉ có trên HEMIS', boqua: 'Bỏ qua', khop: 'Đã khớp' };
const pick = (A, t) => t === 'them' ? A.L.filter(x => canAdd(x.st)) : t === 'sua' ? A.C.fixes : t === 'chua' ? A.L.filter(x => x.st === 'un') : t === 'trung' ? A.C.flags : t === 'lone' ? A.lone : t === 'boqua' ? A.L.filter(x => x.st === 'dup' || x.st === 'bad') : A.khop;
const nSel = A => ({ a: A.L.filter(x => canAdd(x.st) && !off.has(x.k)).length, s: A.C.fixes.filter(fixOn).length });

/* ---- Ve bang ---- */
const going = () => !!(run && run.on);
const khcnPill = r => (r.ap ? pill('ok', 'Đã duyệt') : r.cs ? pill('warn', 'Cần sửa') : pill('mut', 'Chưa duyệt', 'info')) + (r.nc ? pill('mut', 'Không tính', 'info') : '');
const res = x => {
  if (x.err) return pill('err', x.err);
  if (x.st === 'ok') return pill('ok', 'Đã thêm · ' + x.code);
  if (x.st === 'have') return pill('ok', 'Đã có · ' + x.code);
  if (x.st === 'dup') return pill('warn', 'Trùng tên trong KHCN');
  if (x.st === 'bad') return pill('err', x.why);
  return x.warn.length ? x.warn.map(w => pill('warn', w)).join(' ') : '<span class="muted">Chờ thêm</span>';
};
const fixRes = f => { const d = done.get(f.id); if (d && d.ok) return pill('ok', 'Đã sửa'); if (d && d.err) return pill('err', d.err); return (f.clsDiff ? pill('err', 'Sai loại / Q') : '') + (f.yDiff ? pill('warn', 'Lệch năm') : '') + (f.jDiff ? pill('info', 'Tên tạp chí') : ''); };
const ck = (key, on, dis) => '<td class="ck"><input type="checkbox" data-ck="' + esc(key) + '" aria-label="Chọn"' + (on ? ' checked' : '') + (dis || going() ? ' disabled' : '') + '></td>';
const lines = a => a.map(s => '<div>' + esc(s) + '</div>').join('');
const table = (A, t) => {
  const L = pick(A, t), more = L.length > MAXR ? '<div class="more">Đang hiện ' + MAXR + '/' + L.length + '. Mục được tick đều sẽ chạy, kể cả mục chưa hiện ở đây. Bấm biểu tượng Excel để xem đủ.</div>' : '';
  const none = n => '<tr><td colspan="' + n + '">' + empty('check', 'Không có mục nào', '') + '</td></tr>';
  if (t === 'sua') return '<div class="tw"><table class="tbl"><thead><tr><th class="ck"><input type="checkbox" data-all aria-label="Chọn tất cả"' + (L.some(f => !fixed(f) && !fixOn(f)) ? '' : ' checked') + (going() ? ' disabled' : '') + '></th><th>Mã HEMIS</th><th class="wt">Bài báo</th><th>Đang ghi trên HEMIS</th><th>Sẽ sửa thành</th><th>Vấn đề</th></tr></thead><tbody>' +
    (L.length ? L.slice(0, MAXR).map(f => '<tr data-id="' + esc(f.id) + '">' + ck(f.id, fixOn(f), fixed(f)) + '<td class="nowrap">' + esc(f.x.mA_BAI_BAO) + '</td><td class="t"><b>' + esc(f.x.teN_BAI_BAO) + '</b><div class="muted">KHCN: ' + esc(f.r.l) + '</div></td><td class="was">' + lines(f.from) + '</td><td class="will">' + lines(f.to) + '</td><td data-res>' + fixRes(f) + '</td></tr>').join('') : none(6)) + '</tbody></table></div>' + more +
    '<div class="more">Bài chỉ lệch năm không tick sẵn (thường do đăng online năm trước, in năm sau). Chỉ sửa, không xoá bài nào.</div>';
  if (t === 'trung') return '<div class="tw"><table class="tbl"><thead><tr><th>Mã HEMIS</th><th class="wt">Bài báo</th><th>Vấn đề</th></tr></thead><tbody>' +
    (L.length ? L.map(f => '<tr><td class="nowrap">' + esc(f.code) + '</td><td class="t"><b>' + esc(f.t) + '</b></td><td>' + esc(f.why) + '</td></tr>').join('') : none(3)) + '</tbody></table></div>';
  if (t === 'lone') return '<div class="tw"><table class="tbl"><thead><tr><th>Mã HEMIS</th><th class="wt">Bài báo</th><th>Năm</th></tr></thead><tbody>' +
    (L.length ? L.slice(0, MAXR).map(x => '<tr><td class="nowrap">' + esc(x.mA_BAI_BAO) + '</td><td class="t"><b>' + esc(x.teN_BAI_BAO) + '</b><div class="muted">' + esc(x.teN_TAP_CHI || '') + '</div></td><td>' + esc(x.naM_CONG_BO) + '</td></tr>').join('') : none(3)) + '</tbody></table></div>' + more +
    '<div class="more">Bài trên HEMIS (cùng khoảng năm đã quét) không khớp tên bài nào trên KHCN: có thể là bài thử, bài nhập tay hoặc tên đã bị sửa. Công cụ không tự xoá; kiểm tra và xử lý trên HEMIS.</div>';
  const tick = t === 'them';
  return '<div class="tw"><table class="tbl"><thead><tr>' + (tick ? '<th class="ck"><input type="checkbox" data-all aria-label="Chọn tất cả"' + (L.some(x => off.has(x.k)) ? '' : ' checked') + (going() ? ' disabled' : '') + '></th>' : '') + '<th class="wt">Bài báo</th><th>Loại</th><th>Q</th><th>Ngày</th><th>Tình trạng KHCN</th><th>Kết quả</th></tr></thead><tbody>' +
    (L.length ? L.slice(0, MAXR).map(x => '<tr data-k="' + esc(x.k) + '">' + (tick ? ck(x.k, !off.has(x.k), x.st === 'ok') : '') + '<td class="t"><b>' + esc(x.r.t) + '</b><div class="muted">' + esc(x.r.j || '(chưa có tên tạp chí)') + '</div></td><td title="' + esc(x.r.l) + '">' + esc(shortType(x.r.l)) + '</td><td>' + (QM[x.r.q] ? esc(x.r.q) : '<span class="muted">—</span>') + '</td><td class="nowrap">' + esc(x.r.d ? vnDate(x.r.d) : '—') + '</td><td>' + khcnPill(x.r) + '</td><td data-res>' + res(x) + '</td></tr>').join('') : none(tick ? 7 : 6)) + '</tbody></table></div>' + more;
};

/* ---- Xuat Excel ---- */
const TXT = { new: 'Chưa thêm', nc: 'Không áp dụng tính (chưa thêm)', un: 'Chưa phê duyệt', have: 'Đã có trên HEMIS', ok: 'Đã thêm', dup: 'Trùng trong KHCN', bad: 'Không rõ loại/ngày' };
const xlsx = () => {
  const A = all(), L = pick(A, tab), name = TABS[tab];
  let rows;
  if (tab === 'sua') rows = [['Mã HEMIS', 'Tên bài báo', 'Loại (KHCN)', 'Đang ghi trên HEMIS', 'Sẽ sửa thành', 'Kết quả']].concat(L.map(f => { const d = done.get(f.id); return [f.x.mA_BAI_BAO, f.x.teN_BAI_BAO, f.r.l, f.from.join(' | '), f.to.join(' | '), d ? (d.ok ? 'Đã sửa' : 'Lỗi: ' + d.err) : '']; }));
  else if (tab === 'trung') rows = [['Mã HEMIS', 'Tên bài báo', 'Vấn đề']].concat(L.map(f => [f.code, f.t, f.why]));
  else if (tab === 'lone') rows = [['Mã HEMIS', 'Tên bài báo', 'Tạp chí', 'Năm']].concat(L.map(x => [x.mA_BAI_BAO, x.teN_BAI_BAO, x.teN_TAP_CHI, +x.naM_CONG_BO || '']));
  else rows = [['Mã HEMIS', 'Tên bài báo', 'Tạp chí', 'Loại', 'Q', 'Ngày công bố', 'Tình trạng KHCN', 'Tình trạng', 'Cảnh báo']].concat(L.map(x => [x.code, x.r.t, x.r.j, x.r.l, QM[x.r.q] ? x.r.q : '', x.r.dRaw, x.r.st, x.err ? 'Lỗi: ' + x.err : TXT[x.st], x.warn.join('; ')]));
  downloadXlsx('Đẩy HEMIS bài báo ' + name, { name, head: 1, freezeCols: 1, rows });
};

/* ---- Chay: them roi sua, sau khi xac nhan ---- */
async function runAll() {
  if (going()) return;
  const A0 = all(), addKeys = new Set(A0.L.filter(x => canAdd(x.st) && !off.has(x.k)).map(x => x.k)), fixIds = new Set(A0.C.fixes.filter(fixOn).map(f => f.id));
  const n = addKeys.size + fixIds.size; if (!n) return;
  if (!await ask({ title: 'Chạy ' + n + ' thay đổi trên HEMIS?', text: 'Thêm ' + addKeys.size + ' bài mới, sửa ' + fixIds.size + ' bài đã có (loại, Q, năm, tên tạp chí theo KHCN).\nKhông đẩy tác giả, không xoá bài nào. Trước khi chạy, công cụ lấy lại danh sách trên HEMIS để bỏ qua bài nay đã có.', ok: 'Chạy ' + n + ' thay đổi', cancel: 'Chưa chạy' })) return;
  run = { on: true, ok: 0, bad: 0, total: n, msg: 'Đang kiểm tra lại HEMIS…' }; ctx.render();
  let stop = null;
  try { while (D.busy.hemis) await sleep(300); await loadHemis(); } catch (x) { run = null; ctx.render(); ctx.fail(x); return; }
  const A = all(), adds = A.L.filter(x => canAdd(x.st) && addKeys.has(x.k)), fxs = A.C.fixes.filter(f => fixIds.has(f.id) && !fixed(f));
  if (adds.length < addKeys.size) toast((addKeys.size - adds.length) + ' bài nay đã có trên HEMIS nên được bỏ qua.');
  run.total = adds.length + fxs.length;
  const step = () => { run.msg = 'Đã chạy ' + (run.ok + run.bad) + '/' + run.total; ctx.syncFoot(); };
  /* ma bai: BBKH{nam}-{so tiep theo} */
  const maxNo = {};
  D.hemis.list.forEach(x => { const m = String(x.mA_BAI_BAO || '').match(/^BBKH(\d{4})-(\d+)$/); if (m) maxNo[m[1]] = Math.max(maxNo[m[1]] || 0, +m[2]); });
  for (const x of adds) {
    const r = x.r, y = x.y; maxNo[y] = (maxNo[y] || 0) + 1;
    const code = 'BBKH' + y + '-' + maxNo[y], vol = r.vol ? (r.iss ? r.vol + '(' + r.iss + ')' : r.vol) : (r.iss || '');
    const rec = { id: crypto.randomUUID(), doN_VI_ID: DV, mA_BAI_BAO: code, teN_BAI_BAO: r.t, teN_TAP_CHI: r.j || '', naM_CONG_BO: +y, phaN_LOAI: x.m.p, isBuildIn: false, isBuildInAll: false };
    if (vol) rec.taP_SO = vol; if (r.pg) rec.trang = r.pg;
    if (x.m.qt) rec.taP_CHI_QUOC_TE = x.m.qt; if (x.m.tn) rec.taP_CHI_TRONG_NUOC = x.m.tn; if (QM[r.q]) rec.xeP_HANG_Q = QM[r.q];
    try { await B.hemis('POST', HEMIS_API, rec); done.set(x.k, { ok: true, code }); run.ok++; }
    catch (e) { maxNo[y]--; done.set(x.k, { err: e.message }); run.bad++; if (B.isLogin(e)) stop = e; }
    step(); if (stop) break; await sleep(150);
  }
  for (const f of stop ? [] : fxs) {
    try {
      const g = await B.hemis('GET', HEMIS_API + '/DetailWithPermission/' + f.id + '?pid=00000000-0000-0000-0000-000000000000');
      const d = g.data; if (!d) throw new Error('Không đọc được bài trên HEMIS');
      Object.assign(d, f.want); if (f.y) d.naM_CONG_BO = f.y;
      await B.hemis('PUT', HEMIS_API + '/' + f.id, d);
      done.set(f.id, { ok: true }); run.ok++;
    } catch (e) { done.set(f.id, { err: e.message }); run.bad++; if (B.isLogin(e)) stop = e; }
    step(); if (stop) break; await sleep(150);
  }
  run.on = false;
  run.msg = (stop ? 'Dừng giữa chừng: ' : 'Xong: ') + 'thành công ' + run.ok + ', lỗi ' + run.bad;
  if (!stop) { try { await loadHemis(); } catch (e) { /* bam Tai lai tu HEMIS */ } }
  ctx.render();
  if (stop) await info('Dừng vì hết phiên đăng nhập', stop.message + '\nĐã chạy được ' + run.ok + ' thay đổi. Đăng nhập lại rồi bấm Chạy tiếp: bài đã có sẽ được bỏ qua.');
  else toast('Xong ' + run.ok + ' thay đổi' + (run.bad ? ', ' + run.bad + ' lỗi' : '') + '.', run.bad ? 'err' : undefined);
}

/* ---- Giao dien: mot loai du lieu trong man "Day len HEMIS" ---- */
export default {
  id: 'baibao', title: 'Bài báo', on: ['scan', 'hemis', 'settings'], busy: ['hemis'],
  badge: () => { if (!D.scan || !D.hemis) return 0; const A = all(); return A.L.filter(x => canAdd(x.st)).length + A.C.fixes.filter(f => !fixed(f)).length; },
  acts: () => '<button class="btn" data-bb-reload>' + icon('refresh') + 'Tải lại từ HEMIS</button>',
  sub: () => !D.scan ? 'Bài báo · cần quét KHCN trước' : !D.hemis ? 'Bài báo · đang so với HEMIS' : 'Bài báo · KHCN quét ' + vnDate(D.scan.f) + ' – ' + vnDate(D.scan.t) + ' · ' + D.hemis.list.length.toLocaleString('vi-VN') + ' bài trên HEMIS, lấy lúc ' + fmtTime(D.hemis.at),
  init(c) {
    ctx = c;
    regBlk('bb.bang', { scr: 'day.baibao', title: 'Bài báo', render: c.render, xlsx, close: () => { tab = 'them'; off.clear(); ticks.clear(); } });
  },
  onClick(e) {
    const t = e.target.closest('[data-tab]'); if (t) { tab = t.dataset.tab; ctx.render(); return; }
    if (e.target.closest('[data-bb-reload]')) { ctx.reload(); return; }
    if (e.target.closest('[data-run]')) runAll();
  },
  onChange(e) {
    const c = e.target.closest('[data-ck]'), a = e.target.closest('[data-all]');
    if (tab === 'sua') { if (c) ticks.set(c.dataset.ck, c.checked); else if (a) compare().fixes.filter(f => !fixed(f)).forEach(f => ticks.set(f.id, a.checked)); else return; }
    else { if (c) { if (c.checked) off.delete(c.dataset.ck); else off.add(c.dataset.ck); } else if (a) pick(all(), 'them').forEach(x => { if (a.checked) off.delete(x.k); else off.add(x.k); }); else return; }
    if (a) ctx.root.querySelectorAll('[data-ck]:not(:disabled)').forEach(x => { x.checked = a.checked; });
    ctx.syncFoot();
  },
  render(body) {
    if (!D.scan) { body.innerHTML = '<div class="card">' + empty('scan', 'Chưa có dữ liệu quét', 'Hãy quét năm báo cáo trên KHCN và sửa các bài thiếu thông tin, rồi quay lại đây.', '<button class="btn pri" data-goto="quet">' + icon('scan') + 'Sang Quét &amp; kiểm tra</button>') + '</div>'; return; }
    if (!D.hemis) { body.innerHTML = '<div class="card">' + empty('refresh', D.busy.hemis ? 'Đang lấy danh sách bài trên HEMIS…' : 'Chưa có dữ liệu HEMIS', 'Anh/chị cần đăng nhập HEMIS trên Chrome.', D.busy.hemis ? '' : '<button class="btn pri" data-bb-reload>' + icon('refresh') + 'Lấy từ HEMIS</button>') + '</div>'; return; }
    const A = all(), c = t => pick(A, t).length;
    const list = [['them', 'Thêm'], ['sua', 'Sửa']].concat(setting('chiDuyet') ? [['chua', 'Chưa duyệt']] : [], c('trung') ? [['trung', 'Trùng trên HEMIS']] : [], c('lone') ? [['lone', 'Chỉ có trên HEMIS']] : [], c('boqua') ? [['boqua', 'Bỏ qua']] : [], [['khop', 'Đã khớp']]);
    if (!list.some(l => l[0] === tab)) tab = 'them';
    body.innerHTML = blk('bb.bang', 'Bài báo', table(A, tab), { headHtml: tabsHtml(list.map(([k, t]) => [k, t + ' (' + c(k) + ')']), tab) });
    const xb = body.querySelector('[data-close="bb.bang"]'); if (xb && going()) xb.disabled = true;
  },
  foot() {
    if (!D.scan || !D.hemis) return '';
    const s = nSel(all()), n = s.a + s.s, g = going(), pct = run && run.total ? Math.round((run.ok + run.bad) / run.total * 100) : 0;
    return '<span><b>' + n + ' thay đổi</b> đã chọn <span class="muted">· thêm ' + s.a + ' · sửa ' + s.s + '</span></span>' + (run ? '<span class="muted">· ' + esc(run.msg) + '</span>' : '') + '<div class="sp"></div>' +
      (run ? '<div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><span class="' + (!g && run.bad ? 'err' : !g ? 'ok' : '') + '" style="width:' + Math.max(pct, g ? 1 : 0) + '%"></span></div>' : '') +
      '<button class="btn pri" data-run' + (!n || g ? ' disabled' : '') + '>' + icon('up') + (g ? 'Đang chạy…' : 'Chạy ' + n + ' thay đổi trên HEMIS') + '</button>';
  }
};
