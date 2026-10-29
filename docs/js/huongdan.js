// Hướng dẫn cài tiện ích cầu nối
import { icon, drawer } from './ui.js';

export const guide = () => drawer({
  title: 'Cài tiện ích cầu nối', wide: true,
  body: '<p>Trang này cần tiện ích Chrome <b>“Công cụ KHCN TLU → HEMIS” bản 2.0</b> để đọc dữ liệu KHCN và HEMIS bằng phiên đăng nhập của anh/chị. Tiện ích không lưu mật khẩu và không gửi dữ liệu đi nơi khác.</p>' +
    '<ol style="padding-left:20px;line-height:1.9">' +
    '<li><a href="tien-ich-khcn-hemis.zip" download="Tiện ích KHCN HEMIS.zip">Tải tiện ích (file zip)</a>, rồi giải nén ra một thư mục (bấm chuột phải → <b>Extract All</b>).</li>' +
    '<li>Mở Chrome, gõ vào thanh địa chỉ: <b>chrome://extensions</b></li>' +
    '<li>Nếu đang có bản cũ “Công cụ KHCN TLU → HEMIS” 1.x: bấm <b>Remove</b> để gỡ.</li>' +
    '<li>Bật <b>Developer mode</b> (góc trên bên phải).</li>' +
    '<li>Bấm <b>Load unpacked</b> → chọn thư mục vừa giải nén.</li>' +
    '<li>Quay lại trang này, bấm <b>F5</b>.</li></ol>' +
    '<div class="note">' + icon('info') + '<div>Từ nay bấm biểu tượng tiện ích trên thanh Chrome là mở công cụ thành một tab riêng. Muốn mở nhiều màn cùng lúc thì mở thêm tab (chuột giữa vào mục menu). Khi cần lấy dữ liệu, công cụ dùng tab KHCN/HEMIS đang mở; chưa có thì tự mở ngầm, anh/chị chỉ cần đăng nhập.</div></div>'
});
