# Công cụ KHCN TLU → HEMIS — tài liệu bàn giao cho Claude Code

Bàn giao ngày 30/10/2026 từ Claude (Cowork). Người dùng: **Tuấn** (CV. Nguyễn Hoàng Tuấn, Phòng KHCN&HTQT – P9, Trường Đại học Thủy lợi).

## 0. Cách làm việc với Tuấn (bắt buộc)

- Trả lời **tiếng Việt**, ngắn gọn, giải thích dễ hiểu (Tuấn không có nền tảng CNTT). Tên nút Chrome giữ tiếng Anh (Tuấn dùng Chrome tiếng Anh). Chỉ báo tiến độ ngắn, Tuấn quan tâm kết quả.
- **Việc gì chưa rõ thì hỏi trước khi làm** (Tuấn đã phàn nàn khi Claude tự đoán rồi làm sai hướng). Khi hỏi, đưa sẵn phương án khuyên dùng.
- File xuất ra cho Tuấn: **tên tiếng Việt có dấu, không dùng dấu gạch dưới**. (File mã bắt buộc tên cố định như `manifest.json`, `CLAUDE.md` thì giữ.)
- **Không bao giờ gõ/lưu mật khẩu**; Tuấn tự đăng nhập KHCN và HEMIS. Không ghi mật khẩu vào mã, file hay log.
- Thao tác ghi hàng loạt lên HEMIS/KHCN (đẩy bài, sửa bài) phải có bước xác nhận của người dùng. Không tự xoá bản ghi.
- Mọi thay đổi giao diện: làm **ảnh/HTML mẫu cho Tuấn duyệt trước**, rồi mới sửa công cụ thật.

## 1. Mục tiêu

Đưa dữ liệu bài báo khoa học của Trường từ hệ thống KHCN của phòng (`https://khcn.tlu.edu.vn`) lên hệ thống HEMIS của Bộ GD&ĐT (`https://hemis-cms.moet.gov.vn`) nhanh, đúng và đủ, không nhập Excel/thủ công; đồng thời thống kê dữ liệu KHCN và ước tính chỉ số Tiêu chuẩn 6 của Chuẩn cơ sở GDĐH (Thông tư 83/2026/TT-BGDĐT). HEMIS là nguồn Bộ dùng để đánh giá, nên phân loại trên HEMIS phải đúng.

## 2. Hiện trạng mã (thư mục này)

| Đường dẫn | Nội dung |
|---|---|
| `src/tool.js` | Toàn bộ công cụ: một IIFE ~135 KB, chèn vào trang KHCN hoặc HEMIS, vẽ một lớp phủ toàn màn hình (`#tlu2hemis`). Không dùng thư viện. |
| `extension/` | Tiện ích Chrome MV3 bản 1.2.0. `background.js`: khi bấm biểu tượng, tải mã mới nhất từ thư mục Google Drive, ghép các phần, lưu `chrome.storage.local`, rồi chèn vào trang (world MAIN). Không tải được thì dùng bản lưu, rồi `tool.js` kèm theo. |
| `publish/` | `split.py` (chia tool.js thành 10 phần theo mốc cố định, so md5 với `published.json` để biết phần nào đổi), `published.json` (id file Drive + phiên bản từng phần), `build.py` + `installer_template.html` (tạo trang cài đặt có bookmarklet). |
| `thiết kế/` | Giao diện mới đã được Tuấn duyệt: `Mẫu giao diện.html` (mở với `#scan`, `#pivot`, `#pivot+filter`, `#pivot+drill`, `#push`, `#tc6`) và 6 ảnh PNG; gợi ý hệ thống thiết kế từ skill ui-ux-pro-max. |
| `tài liệu/` | Văn bản TT 83/2026 (trích), danh mục 341 tạp chí đạt chuẩn của Bộ KH&CN 2026 (QĐ 2244/QĐ-BKHCN) dạng JSON, tên tạp chí mẫu để thử so khớp. |
| `kiểm thử/khcn-gia-lap.test.js` | Thử bằng Playwright với trang KHCN giả lập (400 bài ngẫu nhiên, 4 khoa, đủ các endpoint). Chạy: `node "kiểm thử/khcn-gia-lap.test.js"` (cần `playwright`). |

Các chức năng hiện có:

- **Trên KHCN, tab ① Quét & đẩy:** chọn năm báo cáo (01/01–31/12), quét, báo bài thiếu trường bắt buộc / nên có, so tên tạp chí với danh mục Bộ KH&CN (đúng / gần đúng / không có). Nút "Sửa (điền sẵn tên)" mở trang sửa KHCN và điền tên chuẩn vào ô `#tentapchi`. Sau đó chuyển dữ liệu sang HEMIS qua `window.name`.
- **Trên KHCN, tab ② Thống kê:**
  - tải dữ liệu theo khoảng ngày, có nút chọn nhanh và tự tải lại khoảng cũ;
  - bộ lọc nhiều trường kèm vai trò tác giả;
  - **bảng tổng hợp nhiều tầng**: hàng tối đa 3 cấp, cột tối đa 2 cấp; số liệu gồm số bài, giờ KH, tiền hỗ trợ, điểm HĐCD, IF trung bình; đủ 14 loại công bố theo đúng ô "Tất cả mọi loại công bố" của KHCN; bấm ô số để xem bài; sao chép dán Excel; mẫu nhanh;
  - bảng một chiều và danh sách bài.
- **Trên HEMIS:**
  - đẩy bài chưa có (mọi trạng thái duyệt);
  - rà soát bài đã có, sửa loại / Q / năm / tên tạp chí bằng PUT;
  - thống kê Tiêu chuẩn 6 (6.1, 6.2.1, 6.2.2), có ô nhập số liệu xin từ phòng khác, lưu localStorage theo năm.

## 3. Việc cần làm tiếp (theo thứ tự)

### 3.1. Chuyển công cụ ra "tab riêng toàn màn hình" (Tuấn đã chọn)

Tuấn không thích lớp phủ trong trang vì bị bó hẹp. Muốn: bấm nút là mở công cụ thành **một tab riêng như một website**, to hết màn hình, kéo ra cửa sổ riêng được, mở nhiều tab, zoom được. Vẫn dùng phiên đăng nhập KHCN/HEMIS sẵn có và vẫn tự cập nhật.

Ràng buộc kỹ thuật cần cân nhắc:

- Trang web thường không đọc được KHCN/HEMIS (CORS và cookie), nên vẫn cần extension làm cầu nối.
- **MV3 cấm trang của extension chạy mã tải từ xa** (không eval, không script ngoài). Vì vậy cơ chế tự cập nhật qua Drive hiện nay **không dùng được** nếu đưa giao diện vào `chrome-extension://…/app.html`.
- Cookie KHCN khi gọi từ trang extension: cần thử thực tế xem có gửi kèm không (SameSite). Phương án chắc ăn là chạy lệnh `fetch` bên trong một tab KHCN/HEMIS bằng `chrome.scripting.executeScript` rồi trả kết quả về.
- HEMIS dùng `Authorization: Bearer <localStorage.access_token>` của trang hemis-cms, cộng header `PortalAlias: https://hemis-cms.moet.gov.vn`. Chỉ lấy được token từ một tab HEMIS đang đăng nhập.

Các phương án (trình bày cho Tuấn chọn trước khi làm):

1. **Giao diện là trang web tĩnh** (ví dụ GitHub Pages của Tuấn), extension nhỏ chỉ làm cầu nối (`externally_connectable`, nhận yêu cầu từ trang, chạy fetch trong tab KHCN/HEMIS rồi trả dữ liệu).
   - Ưu điểm: tự cập nhật bằng cách cập nhật trang web; một giao diện dùng chung cho cả KHCN và HEMIS (không phải chuyển trang). Dữ liệu chỉ đi giữa trình duyệt người dùng và hai hệ thống, không qua máy chủ nào khác.
   - Nhược điểm: cần nơi đăng trang (mã công khai nhưng không chứa dữ liệu hay mật khẩu).
2. **Mở tab mới ở chính tên miền KHCN/HEMIS** (một đường dẫn bất kỳ của site) rồi chèn công cụ phủ kín tab. Giữ nguyên cơ chế Drive, ít sửa nhất. Nhược điểm: hai giao diện tách theo site, chuyển dữ liệu giữa hai site qua `chrome.storage`.
3. **Giao diện nằm trong extension** (`app.html`); cập nhật bằng Chrome Web Store (Unlisted, phí 5 USD, chờ duyệt) hoặc gửi lại zip.

Khuyên dùng: phương án 1 nếu Tuấn chấp nhận đăng trang web. Phải hỏi Tuấn trước.

### 3.2. Làm lại giao diện theo mẫu đã duyệt (`thiết kế/`)

- Sáng, tối giản, một màu nhấn xanh dương `#1D4ED8`. Xanh lá / vàng / đỏ chỉ cho trạng thái, **luôn kèm biểu tượng + chữ**. Font hệ thống "Segoe UI", Roboto, Arial (có tiếng Việt). Bảng dày dữ liệu: chữ bảng 13px, số canh phải, `tabular-nums`, số 0 làm mờ.
- **Thanh menu trái**, mỗi màn một việc:
  - trên KHCN: Quét & kiểm tra, Bảng tổng hợp, Danh sách bài;
  - trên HEMIS: Đẩy lên HEMIS, Rà soát bài đã có, Chỉ số TT 83;
  - mục không dùng được ở site đang mở thì làm mờ (với phương án 1 thì dùng được hết).
- Thanh trên của từng màn: tiêu đề, một dòng tóm tắt, nút hành động. Nút hành động chính nằm cố định ở chân màn hình (Sang HEMIS, Đẩy N bài).
- Bước 1 → 2 → 3 (Quét KHCN → Sửa bài thiếu → Đẩy HEMIS) hiển thị như stepper.
- Bộ lọc gập vào nút "Bộ lọc (n)", mở thành **bảng trượt bên phải**. Điều kiện đang áp dụng hiện thành nhãn có ✕; nhãn phải xuống dòng được, không cắt mất.
- **Yêu cầu riêng của Tuấn: mọi khối đều thu gọn hoặc đóng được.**
  - Mỗi khối (tổng quan, bảng, bảng một chiều…) có nút ▴ thu gọn; nhớ trạng thái thu gọn qua các lần mở.
  - Danh sách bài khi bấm ô số mở ở bảng trượt phải, đóng bằng ✕, bấm ra ngoài hoặc Esc. Không để danh sách dính lại cuối trang như bản cũ.
  - Dòng khoa/bộ môn mở và thu gọn được.
- Không dùng emoji hay ký tự làm biểu tượng (bản cũ dùng ① ② ✕ ▾ ¹ ✉); dùng SVG kiểu Lucide. Có focus khi dùng bàn phím, độ tương phản ≥ 4.5:1, ô bấm cao tối thiểu 32–36px.
- Bỏ inline style rải rác; dùng CSS variables (design tokens) trong một stylesheet.

### 3.3. Dữ liệu đã quét: hôm sau mở lại có phải quét lại không? (Tuấn hỏi)

Hiện nay:

- Chi tiết tác giả từng bài lưu vĩnh viễn (`localStorage.T2K_DETAIL`).
- Danh sách cán bộ theo bộ môn lưu 7 ngày (`T2K_USERMAP`).
- Danh sách 14 loại công bố lưu lại (`T2K_LOAI`).
- **Danh sách bài và trạng thái duyệt luôn tải lại** mỗi lần mở tab Thống kê (tự tải khoảng ngày lần trước, nhanh vì chi tiết đã có).
- Tab Quét thì bấm mới quét.

Cần làm:

- Mở lên **hiện ngay dữ liệu lần trước** kèm dòng "dữ liệu lúc hh:mm ngày dd/mm", rồi tự cập nhật ngầm, có nút "Tải lại".
- Chuyển bộ nhớ sang **IndexedDB**: localStorage giới hạn ~5 MB, sẽ đầy khi dữ liệu nhiều năm.
- Chi tiết bài nên có cách làm mới: bài bị sửa trên KHCN thì chi tiết cũ không tự cập nhật. Có thể làm mới bài trong 60 ngày gần nhất, hoặc theo ngày sửa nếu KHCN có trường này.

### 3.4. Kiểm thử

- Giữ và mở rộng `kiểm thử/` (KHCN giả lập). Thêm HEMIS giả lập (GetData, POST, PUT, DetailWithPermission) trước khi chạy thật.
- **Chưa thử với dữ liệu thật:** bảng tổng hợp nhiều tầng; việc đọc 14 loại công bố từ trang KHCN; định dạng cột Giờ KH và Tiền hỗ trợ (đang đọc giờ kiểu `12,5`, tiền bỏ hết dấu chấm/phẩy); tải mã thật từ Drive (môi trường Cowork bị chặn drive.google.com).

## 4. Nghiệp vụ (đã chốt với Tuấn)

- Đẩy **mọi trạng thái** trên KHCN (đã duyệt, chưa duyệt, cần sửa, không áp dụng tính). **Không đẩy tác giả.**
- Quét và báo thiếu trường trước; sửa trên KHCN rồi quét lại, **đẩy một lần**, không đẩy lắt nhắt.
- Tên tạp chí sửa ở nguồn (KHCN); bản HEMIS đồng bộ theo KHCN.
- Kỷ yếu ISI/Scopus: giữ cách nhập năm 2025 (Kỷ yếu, TN 03). Kỷ yếu Hội nghị KH thường niên ĐHTL thuộc danh mục HĐGSNN ngành Thủy lợi → TN 01.
- Thống kê KHCN giữ cách tính của hệ thống: một bài tính cho **mọi đơn vị có tác giả**. Ngoài ra cho chọn chia đều theo tác giả trong trường hoặc theo tổng tác giả.
- Công cụ chỉ lo dữ liệu thuộc thẩm quyền P9; biến của phòng khác (GQĐ, thu KHCN, người học) nhập tay.
- Mã bài HEMIS: `BBKH{năm}-{số tiếp theo}`, gán lúc đẩy. Nhận diện trùng theo tên bài chuẩn hoá (bỏ dấu, chỉ giữ chữ và số, hỗ trợ Unicode).
- Đơn vị của cán bộ lấy theo bộ môn hiện tại trên KHCN. Cán bộ thuộc nhiều đơn vị thì ưu tiên đơn vị chuyên môn hơn Ban Giám hiệu, đoàn thể.

Quy tắc ghép loại KHCN → HEMIS (`MAP` trong tool.js):

| KHCN | phaN_LOAI | Tạp chí | Nhóm TT 83 |
|---|---|---|---|
| SCIE / SSCI / ISI | 1 | QT 01 (WoS) | P2 |
| SCOPUS | 1 | QT 02 | P2 |
| Quốc tế khác / Special issue | 1 | QT 04 | P1 nếu thuộc danh mục Bộ KH&CN, còn lại không tính |
| Danh mục HĐGSNN; KHKT Thủy lợi & MT | 1 | TN 01 | P1 |
| Bài thông tin | 1 | TN 02 | không tính |
| Kỷ yếu ISI hoặc Scopus | 2 | TN 03 | P2 |
| Kỷ yếu HNKH thường niên | 2 | TN 01 | P1 nếu công bố đến 30/9/2026 |
| Kỷ yếu khác, báo cáo học thuật | 2 | TN 06 | không tính |

Mã danh mục HEMIS:

- Tạp chí quốc tế: QT 01 WoS, 02 Scopus, 03 ACI, 04 Khác.
- Tạp chí trong nước: TN 01 HĐGSNN tính điểm, 02 không tính, 03 WoS, 04 Scopus, 05 ACI, 06 Khác.
- Xếp hạng Q: 01–04.

HEMIS chưa có lựa chọn "danh mục Bộ KH&CN"; tạm chọn TN 01 và chuẩn hoá tên tạp chí theo QĐ 2244.

Thông tư 83/2026 (ký 30/9/2026, hiệu lực 15/11/2026; năm dữ liệu đầu tiên 2026; tính theo năm 01/01–31/12, chốt 31/12):

- **6.2.1:** T = (P1 + 2·P2 + 3·P3 + 5·P4) / GQĐ; yêu cầu ≥ 0,6 nếu có đào tạo tiến sĩ, ≥ 0,3 nếu không.
  - P1 = bài trong nước đạt chuẩn Bộ KH&CN, không thuộc WoS/Scopus. Bài thuộc danh mục HĐGSNN chỉ được công nhận nếu công bố **đến 30/9/2026**.
  - P2 = WoS/Scopus; P3 = sách chuyên khảo + giải pháp hữu ích; P4 = bằng sáng chế.
- **6.2.2:** T = P2 × KLV(KBB) / GQĐ ≥ 0,3.
- **6.1:** T = trung bình 3 năm của (R1/R) × KLV(KTC) ≥ 5%.
- **GQĐ** (giảng viên quy đổi): ĐH 0,5; ThS 0,75; TS/PGS/GS 1.
- **Người học quy đổi** M = SV chính quy + 0,8·kết hợp + 0,5·từ xa + 1,5·HVCH + 2·NCS. Bảng hệ số KTC/KBB theo lĩnh vực nằm trong `LV` của tool.js.
- **1.3:** các trường bắt buộc trên HEMIS phải đủ 100%.

Kết quả rà soát ngày 27/10/2026, để tham khảo:

- HEMIS có 882 bài; năm 2025: P1 = 233, P2 = 283.
- Khoảng 591 bài đã duyệt chưa có trên HEMIS.
- Khoảng 99 bài cũ ghi sai loại; 10 bài lệch năm; 2 cặp trùng (BBKH2025-739/879, 150/182).

## 5. Đầu mối dữ liệu

KHCN (đăng nhập tài khoản admin, phiên cookie):

- `GET /TrichXuatCongBo?from=YYYY-MM-DD&target=YYYY-MM-DD`: bảng đủ cột theo thứ tự 0 STT, 1 tác giả (`Tên<username>`, cách nhau dấu phẩy), 2 đại diện, 3 đơn vị, 4 bộ môn, 5 tên bài, 6 tạp chí, 7 loại, 8 Q, 9 IF, 10 điểm HĐCD, 11 ngày dd/mm/yyyy, 12 giờ KH, 13 tiền, 14 tập, 15 số, 16 trang.
- `GET /CongBo/XuatDuLieu?page=1&currentFilter=&from=&target=&curprivate=false&loai=null&diachi=null&khoa=&nopoint=X`: X = `null` tất cả, `1` đã duyệt, `0` chưa duyệt, `2` cần sửa, `true` không áp dụng tính. ID bài nằm ở `<tr ondblclick="ShowDeTails('id')">`.
- `POST /CongBo/DetailsCongBo` (form `id`): `#listchutri` (TG thứ nhất), `#chiutrachnhiem` (TG liên hệ), `#listthamgia` (đồng tác giả); các dòng dt/dd: Tên HĐCD, Loại hỗ trợ kinh phí, Nhà xuất bản.
- `POST /admin/Users/GetDiaChi` (`searchdiachi=`): 113 bộ môn kèm khoa, id lấy từ `EditDiaChi/(\d+)`.
- `POST /admin/Users/GetUserInDiaChi?dc=id` (form `id`): cán bộ, cột 3 là tài khoản.
- Trang sửa bài: `/CongBo/EditCongBo/{id}?toantruong=true`, ô `#tentapchi`, nút "Ghi lại".
- Trang tìm kiếm công bố có ô chọn "Tất cả mọi loại công bố" (14 loại).
- Hết phiên đăng nhập: trang trả về có `login_form`.

HEMIS (tài khoản của Trường, đơn vị `doN_VI_ID = 452d0027-e4c1-44d1-9efb-befb8db8840d`):

- Header bắt buộc: `Authorization: Bearer <localStorage.access_token>`, `PortalAlias: <origin>`, `Content-Type: application/json`.
- `POST /gwdev/nckh/v5/KHCN_BAI_BAO_KHOA_HOC/GetData`: lọc theo `doN_VI_ID`, `pageInfo {page, pageSize: 200}`.
- `POST /gwdev/nckh/v5/KHCN_BAI_BAO_KHOA_HOC`: thêm bài. Các trường: `id` (uuid), `doN_VI_ID`, `mA_BAI_BAO`, `teN_BAI_BAO`, `teN_TAP_CHI`, `naM_CONG_BO`, `phaN_LOAI`, `taP_CHI_QUOC_TE` / `taP_CHI_TRONG_NUOC`, `xeP_HANG_Q`, `taP_SO`, `trang`.
- `GET /gwdev/nckh/v5/KHCN_BAI_BAO_KHOA_HOC/DetailWithPermission/{id}?pid=00000000-0000-0000-0000-000000000000`, sau đó `PUT /gwdev/nckh/v5/KHCN_BAI_BAO_KHOA_HOC/{id}` với bản đầy đủ.
- Mã 401 nghĩa là hết phiên: yêu cầu F5 trên tab HEMIS.
- Sách (KHCH_SACH_XUAT_BAN) và Sáng chế (KHCN_GIAI_PHAP_SANG_CHE_DON_VI) của Trường hiện trống.

## 6. Tự cập nhật hiện nay (Google Drive)

- Thư mục Drive của Tuấn: "Công cụ KHCN HEMIS - bản cập nhật" (id `19wg1m-BAa75ZNDEmh6_v3kpd1SWZNMos`), để Anyone with the link, Viewer.
- File tên `Mã công cụ KHCN HEMIS {phiên bản} phần {i} trên {n}.js`. Tiện ích đọc `https://drive.google.com/embeddedfolderview?id=…`; với mỗi phần lấy file có phiên bản cao nhất (cùng n), tải qua `uc?export=download&id=`, ghép lại, kiểm tra mở đầu `(async` và kết thúc `})();`.
- Đăng bản mới: sửa `src/tool.js` → `python3 publish/split.py` (in ra phần nào ĐỔI) → tải các phần đổi lên thư mục với số phiên bản mới → bỏ file cũ của phần đó vào thùng rác → cập nhật `published.json`. Đổi số phần n thì phải tải lại cả bộ.
- Trên Drive hiện nay: phần 2 là bản 2026.10.28; phần 1, 3, 6–10 là 2026.10.28.2; phần 4, 5 là 2026.10.28.3.
- Lưu ý: khi Claude (Cowork) tải lên qua kết nối Drive, chuỗi `\u` + 4 số hex bị đổi thành ký tự thật, nên mã nguồn tránh kiểu thoát này (dùng `\p{M}`, `String.fromCharCode`). Claude Code không có kết nối Drive: hoặc Tuấn tự tải lên (Drive → New → File upload), hoặc chuyển sang phương án ở mục 3.1.
- Nếu chọn phương án 1 ở mục 3.1 thì bỏ cơ chế Drive, cập nhật bằng cách đăng lại trang web.

## 7. Còn chưa rõ

- Bộ GD&ĐT sẽ hướng dẫn kê khai bài thuộc danh mục Bộ KH&CN trên HEMIS ra sao, khi nào thêm lựa chọn mới.
- Có cần ký số dữ liệu HEMIS không.
