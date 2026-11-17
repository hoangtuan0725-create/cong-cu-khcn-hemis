// Hướng dẫn cài / cập nhật tiện ích cầu nối
import { icon, drawer } from './ui.js';

/* Ban tien ich toi thieu trang can. Chi tang khi bat buoc phai doi tien ich (rat hiem: moi chuc nang moi nam o trang). */
export const MIN_EXT = '2.1.0';
export const oldExt = v => { const a = String(v || '0').split('.').map(Number), b = MIN_EXT.split('.').map(Number); for (let i = 0; i < 3; i++) { if ((a[i] || 0) !== b[i]) return (a[i] || 0) < b[i]; } return false; };

export const update = v => drawer({
  title: 'Cập nhật tiện ích', wide: true,
  body: '<p>Máy này đang dùng tiện ích bản <b>' + v + '</b>, trang cần bản <b>' + MIN_EXT + '</b> trở lên. Chỉ làm một lần:</p>' +
    '<ol style="padding-left:20px;line-height:1.9">' +
    '<li><a href="tien-ich-khcn-hemis.zip" download="Tiện ích KHCN HEMIS.zip">Tải tiện ích mới (file zip)</a>, giải nén <b>đè lên thư mục tiện ích cũ</b> (chọn Replace khi được hỏi).</li>' +
    '<li>Mở <b>chrome://extensions</b>, ở ô “Công cụ KHCN TLU → HEMIS” bấm nút <b>Reload</b> (mũi tên tròn).</li>' +
    '<li>Quay lại trang này, bấm <b>F5</b>.</li></ol>' +
    '<div class="note">' + icon('info') + '<div>Các lần cập nhật công cụ khác chỉ cần F5, không phải làm lại bước này.</div></div>'
});

export const guide = () => drawer({
  title: 'Cài tiện ích cầu nối', wide: true,
  body: '<p>Trang này cần tiện ích Chrome <b>“Công cụ KHCN TLU → HEMIS”</b> để đọc dữ liệu KHCN và HEMIS bằng phiên đăng nhập của anh/chị. Tiện ích không lưu mật khẩu và không gửi dữ liệu đi nơi khác.</p>' +
    '<ol style="padding-left:20px;line-height:1.9">' +
    '<li><a href="tien-ich-khcn-hemis.zip" download="Tiện ích KHCN HEMIS.zip">Tải tiện ích (file zip)</a>, rồi giải nén ra một thư mục (bấm chuột phải → <b>Extract All</b>).</li>' +
    '<li>Mở Chrome, gõ vào thanh địa chỉ: <b>chrome://extensions</b></li>' +
    '<li>Nếu đang có bản cũ “Công cụ KHCN TLU → HEMIS” 1.x: bấm <b>Remove</b> để gỡ.</li>' +
    '<li>Bật <b>Developer mode</b> (góc trên bên phải).</li>' +
    '<li>Bấm <b>Load unpacked</b> → chọn thư mục vừa giải nén.</li>' +
    '<li>Quay lại trang này, bấm <b>F5</b>.</li></ol>' +
    '<div class="note">' + icon('info') + '<div>Từ nay bấm biểu tượng tiện ích trên thanh Chrome là mở công cụ thành một tab riêng. Muốn mở nhiều màn cùng lúc thì mở thêm tab (chuột giữa vào mục menu). Khi cần lấy dữ liệu, công cụ dùng tab KHCN/HEMIS đang mở; chưa có thì tự mở ngầm, anh/chị chỉ cần đăng nhập.</div></div>'
});
