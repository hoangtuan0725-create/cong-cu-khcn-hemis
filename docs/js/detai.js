// Tạm: Sonnet thay bằng bản đầy đủ.
import { empty } from './ui.js';
export default { id: 'detai', title: 'Đề tài', on: [], busy: [], badge: () => 0, acts: () => '', sub: () => 'Đề tài', render: b => { b.innerHTML = '<div class="card">' + empty('info', 'Đang làm', '') + '</div>'; }, foot: () => '' };
