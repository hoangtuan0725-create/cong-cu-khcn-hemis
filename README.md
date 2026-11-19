# Công cụ KHCN TLU → HEMIS

Công cụ của Phòng KHCN&HTQT, Trường Đại học Thủy lợi: kiểm tra dữ liệu bài báo trên hệ thống KHCN của Trường, đẩy lên HEMIS của Bộ GD&ĐT, thống kê dữ liệu KHCN và ước tính chỉ số Tiêu chuẩn 6 (Thông tư 83/2026/TT-BGDĐT).

**Mở công cụ:** https://hoangtuan0725-create.github.io/cong-cu-khcn-hemis/

## Cài đặt (một lần)

Hướng dẫn có ảnh: [Hướng dẫn cài đặt.pdf](docs/Hướng%20dẫn%20cài%20đặt.pdf) (cũng mở được từ trang công cụ, nút **Cách cài**).

1. Mở trang công cụ, bấm **Cách cài** → **Tải tiện ích**, giải nén (Extract All). Để thư mục ở chỗ cố định, không xoá.
2. Chrome → `chrome://extensions` → bật **Developer mode** → **Load unpacked** → chọn thư mục `Tiện ích KHCN HEMIS` (có `manifest.json`).
3. Tải lại trang công cụ (F5). Chân menu trái hiện "Tiện ích: bản 2.1.0".

Cập nhật công cụ: chỉ cần F5. Khi trang báo tiện ích cần cập nhật (rất hiếm): tải zip mới, giải nén đè chỗ cũ, bấm Reload ở `chrome://extensions`, F5.

Tiện ích chỉ làm cầu nối: công cụ dùng phiên đăng nhập KHCN và HEMIS sẵn có trên Chrome của người dùng. Không lưu mật khẩu; dữ liệu chỉ đi giữa trình duyệt và hai hệ thống, không qua máy chủ nào khác.

## Cấu trúc

- `docs/`: trang công cụ (GitHub Pages).
- `extension/`: tiện ích Chrome cầu nối.
- `kiểm thử/`: kiểm thử với KHCN, HEMIS giả lập.
- `thiết kế/`, `tài liệu/`: mẫu giao diện, văn bản tham khảo.

Tài liệu kỹ thuật: `CLAUDE.md`.
