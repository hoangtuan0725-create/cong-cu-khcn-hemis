// Khung ứng dụng: menu trái, chuyển màn theo địa chỉ (#quet, #tonghop…), trạng thái tiện ích.
import { APP_VER, esc } from './core.js';
import { icon, el, $, reopenInfo } from './ui.js';
import { guide } from './huongdan.js';
import * as B from './bridge.js';
import { D, on, loadCache } from './data.js';
import quet from './quet.js';
import tonghop from './tonghop.js';
import danhsach from './danhsach.js';
import day from './day.js';
import rasoat from './rasoat.js';
import tt83 from './tt83.js';

/* Moi man hinh: { id, title, icon, group (1 KHCN, 2 HEMIS), busy: [khoa D.busy], on: [su kien du lieu], badge(), init(root), render() } */
const SCREENS = [quet, tonghop, danhsach, day, rasoat, tt83];
const main = $('#main'), appEl = $('#app');
const roots = {};
let curId = null;

const navHtml = s => { const b = s.badge ? s.badge() : null; return '<a href="#' + s.id + '" data-id="' + s.id + '">' + icon(s.icon) + '<span>' + esc(s.title) + '</span>' + (b ? '<span class="cnt' + (b.info ? ' info' : '') + '" aria-label="' + esc(b.label || '') + '">' + b.n + '</span>' : '') + '</a>'; };
const drawNav = () => {
  $('#nav1').innerHTML = SCREENS.filter(s => s.group === 1).map(navHtml).join('');
  $('#nav2').innerHTML = SCREENS.filter(s => s.group === 2).map(navHtml).join('');
  document.querySelectorAll('.nav a').forEach(a => { if (a.dataset.id === curId) a.setAttribute('aria-current', 'page'); });
};

const syncBusy = s => {
  const r = roots[s.id]; if (!r || !r.inited) return;
  const k = (s.busy || []).find(k => D.busy[k]);
  const b = r.el.querySelector('[data-busy]'); if (!b) return;
  b.hidden = !k; b.querySelector('[data-busytxt]').textContent = k ? D.busy[k] : '';
};

const show = id => {
  const s = SCREENS.find(x => x.id === id) || SCREENS[0];
  curId = s.id;
  Object.values(roots).forEach(r => { r.el.hidden = true; });
  let r = roots[s.id];
  if (!r) { r = roots[s.id] = { el: el('<section class="scr" data-scr="' + s.id + '"></section>'), inited: false, dirty: true }; main.appendChild(r.el); }
  r.el.hidden = false;
  if (!r.inited) { r.inited = true; s.init(r.el); }
  if (r.dirty || s.alwaysRender) { r.dirty = false; s.render(); }
  syncBusy(s);
  document.title = s.title + ' · Công cụ KHCN → HEMIS';
  appEl.classList.remove('nav-open');
  drawNav();
};

/* Du lieu doi: ve lai man dang mo, danh dau cac man khac de ve lai khi mo */
['scan', 'stats', 'hemis', 'filter'].forEach(ev => on(ev, () => {
  if (ev !== 'filter') reopenInfo();
  SCREENS.forEach(s => { if (!(s.on || []).includes(ev)) return; const r = roots[s.id]; if (!r) return; if (s.id === curId) s.render(); else r.dirty = true; });
  drawNav();
}));
on('busy', () => SCREENS.forEach(syncBusy));

document.addEventListener('click', e => { if (e.target.closest('[data-act="menu"]')) appEl.classList.toggle('nav-open'); });
window.addEventListener('hashchange', () => show(location.hash.slice(1)));

/* ---- Tien ich cau noi ---- */
const drawFoot = p => {
  const ext = p ? '<div class="row"><span class="dot ok" aria-hidden="true"></span>Tiện ích: <b>bản ' + esc(p.ver) + '</b></div>' : '<div class="row"><span class="dot err" aria-hidden="true"></span><b>Chưa có tiện ích</b></div><button class="lnk" data-act="guide">Cách cài</button>';
  const tab = (n, k) => p ? '<div class="row"><span class="dot' + (p.tabs[k] ? ' ok' : '') + '" aria-hidden="true"></span>' + n + ': ' + (p.tabs[k] ? 'đang mở' : 'chưa mở (tự mở khi cần)') + '</div>' : '';
  $('#sfoot').innerHTML = ext + tab('Tab KHCN', 'khcn') + tab('Tab HEMIS', 'hemis') + '<div style="margin-top:4px">Phiên bản ' + APP_VER + '</div>';
};
document.addEventListener('click', e => { if (e.target.closest('[data-act="guide"]')) guide(); });
const check = async () => { const p = await B.ping(); drawFoot(p); return p; };
window.addEventListener('focus', check);

(async () => {
  drawFoot(null);
  await loadCache();
  show(location.hash.slice(1));
  const p = await check();
  if (!p) guide();
})();
