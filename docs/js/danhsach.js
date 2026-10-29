// Màn "Danh sách bài": danh sách bài báo sau bộ lọc chung, tìm nhanh theo tên bài / tạp chí, tải Excel.
import { esc, norm, vnDate, fmtTime, downloadCsv } from './core.js';
import { icon, pill, screenHtml, blk, empty, toast, $ } from './ui.js';
import { D } from './data.js';
import { L, comp, artOK, openFilter, chipsHtml, bindChips, nConds } from './loc.js';

const MAXR = 500;
let root, q = '', timer = 0;

const html = () => screenHtml({
  title: 'Danh sách bài',
  acts: '<label class="sel" for="ds-q">' + icon('search') + '<span class="sr">Tìm nhanh</span><input id="ds-q" data-q type="search" placeholder="Tìm tên bài hoặc tạp chí" autocomplete="off"></label>' +
    '<button class="btn" data-filter>' + icon('filter') + '<span>Bộ lọc</span></button>',
  foot: true
});

/* Cac bai sau bo loc chung va o tim nhanh */
const pick = () => {
  const c = comp(L.spec), k = norm(q);
  return D.stats.arts.filter(a => artOK(a, c) && (!k || norm(a.t + ' ' + a.j).includes(k)));
};

const stPill = a => {
  const s = a.st === 'Đã phê duyệt' ? pill('ok', 'Đã duyệt') : a.st === 'Cần chỉnh sửa' ? pill('warn', 'Cần sửa') : pill('mut', 'Chưa duyệt', 'info');
  return s + (a.nc === 'Không áp dụng tính' ? pill('mut', 'Không tính', 'info') : '');
};
const marks = x => (x.first ? '<span class="au-tn" title="Tác giả thứ nhất">TN</span>' : '') + (x.corr ? '<span class="au-lh" title="Tác giả liên hệ">LH</span>' : '');
const authors = a => a.authors.map(x => x.tlu
  ? '<span title="' + esc(x.bm + ' – ' + x.khoa) + '">' + esc(x.n) + '</span>' + marks(x) + ' <span class="muted small">(' + esc(x.khoa) + ')</span>'
  : '<span class="au-ext">' + esc(x.n) + '</span>' + marks(x)).join(', ');

const row = a => '<tr><td class="t"><b>' + esc(a.t) + '</b><div class="muted">' + esc(a.j || '(chưa có tên tạp chí)') + '</div></td>' +
  '<td class="small">' + esc(a.l) + '</td><td class="small">' + esc(a.grp) + '</td><td>' + (/^Q\d/.test(a.q) ? esc(a.q) : '<span class="muted">—</span>') + '</td>' +
  '<td class="nowrap">' + esc(a.d ? vnDate(a.d) : '—') + '</td><td class="au">' + authors(a) + '</td><td>' + stPill(a) + '</td></tr>';

const scr = {
  id: 'danhsach', title: 'Danh sách bài', icon: 'list', group: 1, busy: ['stats'], on: ['stats', 'filter'],
  init(el) {
    root = el; el.innerHTML = html();
    bindChips(el);
    const qi = $('[data-q]', el);
    qi.value = q;
    qi.oninput = () => { clearTimeout(timer); timer = setTimeout(() => { q = qi.value; scr.render(); }, 200); };
    el.addEventListener('click', e => {
      if (e.target.closest('[data-filter]')) { if (D.stats) openFilter(D.stats.arts); else toast('Chưa có dữ liệu. Hãy tải dữ liệu ở màn Bảng tổng hợp trước.', 'err'); return; }
      if (e.target.closest('[data-csv]')) csv();
      if (e.target.closest('[data-goto]')) location.hash = '#' + e.target.closest('[data-goto]').dataset.goto;
    });
  },
  render() {
    const body = $('[data-body]', root), foot = $('[data-foot]', root), sub = $('[data-sub]', root), fb = $('[data-filter]', root);
    const S = D.stats, n = nConds(L.spec);
    fb.classList.toggle('on', n > 0);
    fb.innerHTML = icon('filter') + '<span>Bộ lọc</span>' + (n ? '<span class="badge" aria-label="' + n + ' điều kiện">' + n + '</span>' : '');
    if (!S) {
      sub.textContent = 'Xem từng bài sau khi lọc theo khoa, bộ môn, loại, năm…';
      body.innerHTML = '<div class="card">' + empty('table', 'Chưa có dữ liệu', 'Danh sách bài dùng chung dữ liệu với màn Bảng tổng hợp. Hãy sang đó chọn khoảng ngày và bấm tải dữ liệu.', '<button class="btn pri" data-goto="tonghop">' + icon('table') + 'Sang Bảng tổng hợp</button>') + '</div>';
      foot.innerHTML = '<span class="muted">Chưa có dữ liệu để hiển thị.</span>'; return;
    }
    const L1 = pick();
    sub.textContent = L1.length.toLocaleString('vi-VN') + '/' + S.arts.length.toLocaleString('vi-VN') + ' bài · ' + vnDate(S.f) + ' – ' + vnDate(S.t) + ' · dữ liệu lúc ' + fmtTime(S.at);
    const chips = chipsHtml();
    body.innerHTML = blk('ds.bang', 'Danh sách bài báo', (chips ? '<div class="chipbar">' + chips + '</div>' : '') +
      '<div class="more">TN = tác giả thứ nhất, LH = tác giả liên hệ. Chữ xám = tác giả ngoài trường hoặc không có tài khoản KHCN.</div>' +
      '<div class="tw"><table class="tbl"><thead><tr><th style="width:34%">Bài báo</th><th>Loại</th><th>Nhóm</th><th>Q</th><th>Ngày</th><th>Tác giả</th><th>Trạng thái</th></tr></thead><tbody>' +
      (L1.length ? L1.slice(0, MAXR).map(row).join('') : '<tr><td colspan="7">' + empty('search', 'Không có bài nào', 'Thử bỏ bớt điều kiện lọc hoặc đổi từ khoá tìm.') + '</td></tr>') + '</tbody></table></div>' +
      (L1.length > MAXR ? '<div class="more">Đang hiện ' + MAXR + '/' + L1.length.toLocaleString('vi-VN') + ' bài. Bấm “Tải Excel” để lấy đủ.</div>' : ''),
      { head: '<span class="muted small">' + L1.length.toLocaleString('vi-VN') + ' bài</span>' });
    foot.innerHTML = '<span>Đang hiện <b>' + Math.min(L1.length, MAXR).toLocaleString('vi-VN') + '</b>/' + L1.length.toLocaleString('vi-VN') + ' bài</span><div class="sp"></div>' +
      '<button class="btn pri" data-csv' + (L1.length ? '' : ' disabled') + '>' + icon('dl') + 'Tải Excel</button>';
  }
};
export default scr;

function csv() {
  if (!D.stats) return;
  const L1 = pick();
  const nm = x => x.n + (x.first ? ' [TG thứ nhất]' : '') + (x.corr ? ' [TG liên hệ]' : '') + (x.tlu ? ' (' + x.bm + ' – ' + x.khoa + ')' : ' (ngoài trường)');
  downloadCsv('Danh sách bài báo KHCN', [['Tên bài', 'Tạp chí / hội nghị', 'Loại công bố', 'Nhóm chỉ số', 'Q', 'IF', 'Điểm HĐCD', 'Ngành HĐCD', 'Ngày công bố', 'Tập', 'Kỳ', 'Trang', 'Tác giả', 'Khoa có tác giả', 'Trạng thái', 'Áp dụng tính', 'Danh mục Bộ KH&CN', 'Loại hỗ trợ kinh phí', 'Giờ khoa học', 'Tiền hỗ trợ']]
    .concat(L1.map(a => [a.t, a.j, a.l, a.grp, a.q, a.iff || '', a.hdp || '', a.hd, a.d ? vnDate(a.d) : '', a.vol, a.iss, a.pg, a.authors.map(nm).join('; '), [...new Set(a.authors.filter(x => x.tlu).map(x => x.khoa))].join('; '), a.st, a.nc, a.dm, a.ht, a.gio, a.tien])));
}
