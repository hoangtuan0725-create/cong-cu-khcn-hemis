// Màn "Đẩy lên HEMIS": một chỗ cho mọi loại dữ liệu (Bài báo · Đề tài · Tài sản trí tuệ).
// Mỗi loại là một mô-đun: { id, title, on, busy, badge(), acts(), sub(), init(ctx), onClick(e), onChange(e), onInput(e), render(body), foot() }.
import { esc } from './core.js';
import { icon, screenHtml, empty, toast, createBtn, $ } from './ui.js';
import { pref, setPref } from './store.js';
import { D, loadHemis } from './data.js';
import { guide } from './huongdan.js';
import baibao from './baibao.js';
import detai from './detai.js';
import tstt from './tstt.js';

const KINDS = [baibao, detai, tstt];
let root, cur = KINDS.find(k => k.id === pref('day.kind', 'baibao')) || baibao, err = '', tried = false;

const K = () => cur;
const ctx = {
  get root() { return root; },
  render: () => scr.render(),
  syncFoot: () => { const f = $('[data-foot]', root); if (f) f.innerHTML = K().foot(); },
  reload: async () => { err = ''; try { await loadHemis(); toast('Đã lấy lại dữ liệu từ HEMIS'); } catch (x) { ctx.fail(x); } },
  fail: (x, quiet) => { if (x.code === 'noext' && !quiet) guide(); err = x.message; toast(x.message, 'err'); scr.render(); }
};

const scr = {
  id: 'day', title: 'Đẩy lên HEMIS', icon: 'up', group: 2, busy: ['hemis', 'detai'], on: ['scan', 'hemis', 'settings', 'detai'],
  badge: () => { const n = KINDS.reduce((s, k) => s + (k.badge() || 0), 0); return n ? { n, label: n + ' thay đổi chờ chạy', info: true } : null; },
  init(el) {
    root = el; el.innerHTML = screenHtml({ title: 'Đẩy lên HEMIS', foot: true });
    $('.top', el).insertAdjacentHTML('afterend', '<div class="kinds" role="tablist" aria-label="Loại dữ liệu"></div>');
    KINDS.forEach(k => k.init && k.init(ctx));
    el.addEventListener('click', e => {
      const k = e.target.closest('[data-kind]'); if (k) { cur = KINDS.find(x => x.id === k.dataset.kind); setPref('day.kind', cur.id); err = ''; scr.render(); return; }
      const g = e.target.closest('[data-goto]'); if (g) { location.hash = '#' + g.dataset.goto; return; }
      if (K().onClick) K().onClick(e);
    });
    el.addEventListener('change', e => { if (K().onChange) K().onChange(e); });
    el.addEventListener('input', e => { if (K().onInput) K().onInput(e); });
  },
  render() {
    if (!D.hemis && !tried && !D.busy.hemis) { tried = true; loadHemis().catch(x => ctx.fail(x, true)); }
    $('.kinds', root).innerHTML = KINDS.map(k => '<button class="tab" role="tab" data-kind="' + k.id + '" aria-selected="' + (k === cur) + '">' + esc(k.title) + '</button>').join('');
    $('.acts', root).innerHTML = K().acts() + createBtn('day.' + cur.id);
    $('[data-sub]', root).textContent = K().sub();
    const body = $('[data-body]', root);
    K().render(body);
    if (err) body.insertAdjacentHTML('afterbegin', '<div class="note err" role="alert">' + icon('alert') + '<div>' + esc(err) + '</div></div>');
    const f = K().foot(), fe = $('[data-foot]', root);
    fe.innerHTML = f; fe.hidden = !f;
  }
};
export default scr;
