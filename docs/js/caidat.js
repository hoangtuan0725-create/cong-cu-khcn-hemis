// Màn "Cài đặt": các tuỳ chọn dùng chung, lưu trên máy (không hiện trên màn làm việc).
import { esc } from './core.js';
import { screenHtml, $ } from './ui.js';
import { pref, setPref } from './store.js';
import { emit } from './data.js';

/* [khoa, nhom, ten, giai thich, mac dinh] */
const OPTS = [
  ['chiDuyet', 'Đẩy lên HEMIS', 'Chỉ đẩy bài đã phê duyệt trên KHCN', 'Bỏ tick để đẩy cả bài chưa duyệt, cần sửa', true],
  ['coTS', 'Chỉ số TT 83', 'Trường có đào tạo tiến sĩ', 'Ngưỡng 6.2.1 là 0,6 (không có thì 0,3); áp dụng 6.1 và 6.2.2', true],
  ['kyYeu', 'Chỉ số TT 83', 'Tính kỷ yếu ISI/Scopus là bài WoS/Scopus', 'Chỉ đổi số ước tính trên công cụ, không đổi gì trên HEMIS', true]
];
export const setting = k => pref('cd.' + k, OPTS.find(o => o[0] === k)[4]);

let root;
const scr = {
  id: 'caidat', title: 'Cài đặt', icon: 'settings', group: 3,
  init(el) {
    root = el;
    el.innerHTML = screenHtml({ title: 'Cài đặt' });
    $('[data-sub]', el).textContent = 'Lưu trên máy này, dùng cho mọi lần mở';
    el.addEventListener('change', e => { const c = e.target.closest('[data-cd]'); if (!c) return; setPref('cd.' + c.dataset.cd, c.checked); emit('settings'); });
  },
  render() {
    const groups = [...new Set(OPTS.map(o => o[1]))];
    $('[data-body]', root).innerHTML = '<div class="setlist">' + groups.map(g => '<section class="card"><div class="card-h"><b>' + esc(g) + '</b></div><div class="card-b setgrp">' +
      OPTS.filter(o => o[1] === g).map(([k, , t, h]) => '<label class="setrow"><input type="checkbox" data-cd="' + k + '"' + (setting(k) ? ' checked' : '') + '><span><b>' + esc(t) + '</b><span class="muted small">' + esc(h) + '</span></span></label>').join('') +
      '</div></section>').join('') + '</div>';
  }
};
export default scr;
