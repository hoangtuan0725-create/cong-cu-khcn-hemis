# Công cụ KHCN TLU → HEMIS — tài liệu bàn giao cho Claude Code

Bàn giao ngày 30/10/2026 từ Claude (Cowork); cập nhật cùng ngày sau khi chuyển sang trang web + tiện ích cầu nối. Bổ sung theo "Bàn giao Claude Code lần 2" (17/11/2026, file nằm trên máy Tuấn: Documents › Công cụ KHCN HEMIS; không đưa vào kho vì có tên người và số liệu nội bộ). Người dùng: **Tuấn** (CV. Nguyễn Hoàng Tuấn, Phòng KHCN&HTQT – P9, Trường Đại học Thủy lợi).

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

Từ 30/10/2026 công cụ là **trang web tĩnh trên GitHub Pages** (phương án 1 Tuấn đã chọn), cộng một **tiện ích Chrome nhỏ làm cầu nối**. Bản cũ (lớp phủ `src/tool.js`, cập nhật qua Google Drive) đã bỏ khỏi kho; xem lịch sử git nếu cần.

| Đường dẫn | Nội dung |
|---|---|
| `docs/` | Trang công cụ, đăng tại `https://hoangtuan0725-create.github.io/cong-cu-khcn-hemis/` (Pages lấy từ nhánh `main`, thư mục `/docs`). ES modules, không thư viện. |
| `docs/js/app.js` | Khung: menu trái, chuyển màn theo `#quet`, `#tonghop`, `#danhsach`, `#day`, `#rasoat`, `#tt83`; trạng thái tiện ích ở chân menu. Hợp đồng màn hình: `{ id, title, icon, group, busy, on, badge, init(el), render() }`. |
| `docs/js/core.js` | Nghiệp vụ dùng chung: `MAP` (ghép loại KHCN → HEMIS), so tên tạp chí với danh mục Bộ KH&CN (`matchDM`), `grpOf`, `LV`, định dạng số/ngày, xuất CSV. `danhmuc.js`: 341 tạp chí QĐ 2244. |
| `docs/js/bridge.js` | Gọi tiện ích qua `window.postMessage`: `khcn(path, form)` trả Document, `hemis(method, path, data)` trả JSON, `openEdit(id, tênTạpChí)`. |
| `docs/js/data.js` | Tải dữ liệu KHCN (quét năm, thống kê nhiều năm kèm chi tiết tác giả) và HEMIS; lưu IndexedDB (`store.js`), phát sự kiện `scan`, `stats`, `hemis`, `filter`, `busy`. |
| `docs/js/ui.js`, `docs/app.css` | Thành phần giao diện và design tokens theo mẫu đã duyệt (`thiết kế/`): khối thu gọn `blk()` (nhớ trạng thái), bảng trượt phải `drawer()` (đóng bằng X, Esc, bấm ra ngoài), hộp thoại `ask()`, `toast()`, `popover()`, biểu tượng SVG Lucide `icon()`. |
| `docs/js/loc.js` | Bộ lọc: **mỗi bảng một bộ lọc riêng** (`filter('tonghop')`, `filter('mot')`, `filter('danhsach')`), bảng trượt "Bộ lọc", nhãn điều kiện có nút X. |
| `docs/js/xlsx.js` | Xuất file .xlsx thật, không thư viện: tiêu đề đậm, cố định tiêu đề, cột tự rộng (tối đa 60, chữ dài tự xuống dòng), số để dạng số, ô gộp, dòng tổng. |
| `docs/js/caidat.js` | Màn Cài đặt (cuối menu trái): tuỳ chọn dùng chung, lưu localStorage `t2h.cd.*`; đọc bằng `setting(khoá)`, đổi thì phát sự kiện `settings`. **Tuỳ chọn không hiện trên màn làm việc, gom hết vào đây** (Tuấn yêu cầu 17/11). |
| `docs/js/quet.js`, `tonghop.js`, `danhsach.js`, `day.js`, `rasoat.js`, `tt83.js` | Sáu màn: Quét & kiểm tra, Bảng tổng hợp (nhiều tầng, bảng một chiều, mục tự chọn), Danh sách bài, Đẩy lên HEMIS, Rà soát bài đã có, Chỉ số TT 83. |
| `docs/tien-ich-khcn-hemis.zip` | Tiện ích đóng gói để người dùng tải từ trang. Tạo lại bằng `python3 "đóng gói tiện ích.py"` mỗi khi sửa `extension/`. |
| `extension/` | Tiện ích MV3 bản 2.0.0. `bridge.js` (content script, chỉ chạy trên trang công cụ) chuyển yêu cầu tới `background.js`; background tìm hoặc mở ngầm tab KHCN/HEMIS rồi chạy `fetch` trong tab đó bằng `chrome.scripting.executeScript` (dùng cookie KHCN và `localStorage.access_token` của HEMIS). Chỉ nhận lệnh từ trang công cụ; HEMIS chỉ cho GET/POST/PUT trên `/gwdev/`. Bấm biểu tượng tiện ích = mở trang công cụ ở tab mới. |
| `thiết kế/` | Mẫu giao diện Tuấn đã duyệt (HTML + ảnh Mẫu 1–9; Mẫu 7–9: khối thu gọn, đóng, tạo lại). |
| `tài liệu/` | TT 83/2026 (trích), danh mục tạp chí Bộ KH&CN 2026 (JSON), tên tạp chí mẫu. |
| `kiểm thử/gia-lap.test.js` | Playwright: phục vụ `docs/` tại địa chỉ Pages thật, giả lập tiện ích, KHCN (400 bài) và HEMIS (GetData, POST, PUT, DetailWithPermission). Chạy: `node "kiểm thử/gia-lap.test.js"`; ảnh chụp lưu ở thư mục tạm (biến `ANH`). `gia-lap-hemis.js`: các bước cho màn HEMIS và Danh sách. |

Lưu trữ trên máy người dùng (IndexedDB của trang công cụ): `data.scan`, `data.stats`, `data.hemis`, `data.loai`, `khcn.detail` (chi tiết tác giả, giữ lâu dài), `khcn.users` (cán bộ theo bộ môn, 7 ngày), `tc6.{năm}` (số liệu nhập tay TT 83). localStorage `t2h.*`: tuỳ chọn nhỏ (khối thu gọn, cấu hình bảng tổng hợp, mẫu mục tự chọn, bộ lọc, khoảng ngày).

Đã thử với tiện ích thật (Chromium, KHCN/HEMIS giả): mở ngầm tab, gửi cookie/token, chặn đường dẫn lạ. **Chưa thử với dữ liệu thật.**

## 3. Việc cần làm tiếp

### 3.1. Đã xong: tab riêng toàn màn hình (phương án 1)
Còn lại cho Tuấn: để kho **Public**, bật GitHub Pages (Settings → Pages → Branch `main`, thư mục `/docs`), gỡ tiện ích 1.x, cài tiện ích 2.0 từ trang.

### 3.2. Đã xong: giao diện theo mẫu
Hai màn chưa có mẫu (Danh sách bài, Rà soát bài đã có) làm cùng kiểu; Tuấn chưa duyệt.

### 3.2b. Đã xong: khối thu gọn / đóng / xuất Excel (Tuấn duyệt Mẫu 7–9 ngày 30/10/2026)
- Mọi kết quả (bảng và không phải bảng) nằm trong khối; góc phải có 3 biểu tượng: xuất Excel (.xlsx, chỉ biểu tượng, không chữ), **—** thu gọn (chỉ ẩn, giữ bộ lọc; khi thu gọn đổi thành □), **X** đóng hẳn (bỏ bộ lọc, tab, tick, cách sắp xếp của khối).
- Bảng đã đóng: tạo lại bằng nút "Tạo bảng" ở thanh trên (bảng có bộ lọc thì mở bảng Bộ lọc, Áp dụng mới hiện). Khối không phải bảng (kind `info`) hiện lại khi quét hoặc tải lại dữ liệu. Khối nhập liệu/cấu hình (`fixed`) chỉ thu gọn.
- Đăng ký khối: `regBlk(id, { scr, title, kind, close, xlsx, reopen, render })` trong `init` của màn.

### 3.3. Dữ liệu đã quét
Đã làm: mở lên hiện ngay dữ liệu lần trước, nút Tải lại, lưu IndexedDB; Bảng tổng hợp tự cập nhật ngầm nếu dữ liệu cũ hơn 1 giờ. Chưa làm: tự làm mới chi tiết tác giả của bài bị sửa trên KHCN.

### 3.4. Kế hoạch từ bàn giao lần 2 (Tuấn duyệt thứ tự 17/11/2026)
Từ 30/10 đến 17/11, Cowork làm thẳng trên HEMIS bằng JavaScript dán vào tab (đẩy bài 2026, tài sản trí tuệ, đề tài; xoá dữ liệu trước 2026 sau khi sao lưu). Việc của Claude Code là đưa các chức năng đó vào app. **HEMIS không tự tính 6.1/6.2** (Cowork đã kiểm tra 13/11), app phải tự tính.
1. **Đợt 1 (xong 17/11):** Cài đặt "Chỉ đẩy bài đã phê duyệt" (mặc định bật; bài chưa duyệt ở tab "Chưa duyệt"); TT 83 lấy P3 giải pháp hữu ích và P4 sáng chế từ phân hệ Tài sản trí tuệ HEMIS theo năm cấp bằng, chỉ sách nhập tay; hai tuỳ chọn TT 83 chuyển vào Cài đặt. Mẫu 10–12.
2. **Đợt 2:** Sao lưu HEMIS (3 phân hệ, chi tiết đầy đủ qua DetailWithPermission) thành file JSON; Khôi phục từ file.
3. **Đợt 3:** màn Đề tài (KHCN_NHIEM_VU_KHCN): quét đề tài các cấp trên KHCN (theo từng cấp, 2–3 lượt), so với HEMIS ra bảng THÊM/SỬA/XOÁ có tick, nhập tay, nhập đề tài cấp cơ sở từ QĐ giao theo đợt, thống kê cấp × chủ quản × tình trạng; nhớ danh sách ngoại lệ/loại trừ (Tuấn nhập trong app, không ghi vào mã). Cần tiện ích 2.1 cho phép DELETE.
4. **Đợt 4:** màn Tài sản trí tuệ: quét KHCN loại 4/6 + nhập Excel SHTT của phòng, cảnh báo, đẩy/sửa.
5. **Đợt 5:** xoá theo năm/phân hệ (bắt buộc sao lưu trước); hiện số đếm của app cạnh Bàn làm việc HEMIS.
Mỗi màn mới phải có mẫu cho Tuấn duyệt; giữ giao diện **gọn, tối giản**.

### 3.5. Kiểm thử

- Chạy `node "kiểm thử/gia-lap.test.js"` sau mỗi thay đổi; xem ảnh chụp.
- **Chưa thử với dữ liệu thật:** toàn bộ trang mới qua tiện ích thật; bảng tổng hợp nhiều tầng; việc đọc 14 loại công bố từ trang KHCN; định dạng cột Giờ KH và Tiền hỗ trợ (đang đọc giờ kiểu `12,5`, tiền bỏ hết dấu chấm/phẩy).

## 4. Nghiệp vụ (đã chốt với Tuấn)

- Bài báo: **mặc định chỉ đẩy bài đã phê duyệt** (đợt 2026 Tuấn làm vậy; đổi trong Cài đặt). **Không đẩy tác giả**, không đẩy file bài (form HEMIS không có ô file, DOI, tác giả).
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
- Lấy danh sách: body GetData **phải đúng dạng** `{filters:[{valueIsField:false,filters:[],stringCompareOption:0,field:"doN_VI_ID",operator:"eq",value:"\"<id>\""}],sorts:[],includes:[],pageInfo:{page,pageSize}}`; dạng `{filter,skip,take}` bị bỏ qua (trả 15 bản ghi toàn quốc).
- Thêm `POST /{Thực thể}` (kèm `doN_VI_ID`, `isBuildIn:false`, `isBuildInAll:false`); sửa: DetailWithPermission rồi `PUT`; xoá `DELETE /{Thực thể}/{id}` (tiện ích 2.0 chưa cho phép).
- Thực thể: `KHCN_BAI_BAO_KHOA_HOC`, `KHCN_GIAI_PHAP_SANG_CHE_DON_VI` (mA_GIAI_PHAP = số bằng; loaI_GIAI_PHAP 01 sáng chế, 02 GPHI…; sO_BANG, ngaY_CAP, naM_DUOC_CAP_BANG, chU_BANG, taC_GIA_SANG_CHE…), `KHCN_NHIEM_VU_KHCN` (mA_NHIEM_VU, teN_NHIEM_VU, phaN_CAP_NHIEM_VU, phaN_LOAI_NHIEM_VU, cO_QUAN_CHU_QUAN, cO_QUAN_CHU_TRI, nguoI_CHU_TRI, tG_BAT_DAU, tG_KET_THUC, tonG_KINH_PHI, nguoN_KINH_PHI, tinH_TRANG_NV, linH_VUC_NCKH, thuoC_NHIEM_VU; bắt buộc: mã, cấp, tên, phân loại, ngày bắt đầu). Sách: chưa có dữ liệu.
- Mã nhiệm vụ: cấp 01 Quốc gia, 02 Bộ, 03 Tỉnh, 04 Cơ sở, 05 Khác; phân loại 02 Đề tài; nguồn KP 01 NSNN, 02 Tổ chức chủ trì, 03 Khác; tình trạng 01 Hoàn thành, 03 Đang hoàn thiện NT cơ sở, 04 Đang thực hiện…; chủ quản (DM_CO_QUAN_CHU_QUAN): 08 Bộ KH&CN, 11 Bộ NN&PTNT, 15 Bộ TN&MT, 24 Ngân hàng NN, 91 Khác, UBND tỉnh theo mã tỉnh; chưa có mục "Bộ NN&MT" (gốc TN&MT chọn 15, gốc NN chọn 11).
- Bàn làm việc: `GET KHCN_DOT_BAO_CAO/getDataDashboard/{loại}/{đơn vị}/2034/{ngày}` (13 tài sản trí tuệ, 14 sách); ô tài sản trí tuệ đang = 0 dù có dữ liệu (chưa rõ).
- HEMIS không có trường "ngày sửa"; từng báo `ERR_CONNECTION_RESET` sau khoảng 1.000 lệnh liên tục: giới hạn tốc độ, thử lại.

KHCN (bổ sung):
- Đề tài: `/Home/ToanBoDeTai?page=N&currentFilter=&cap={mã}&from=&target=&iprivate=false&tt=0&chutri=&diachi=null&khoa=&nopoint=null`; chi tiết `POST /Home/DetailsDeTai` (form `id`). **Phân trang không ổn định** (lật trang toàn bộ từng sót khoảng 70 đề tài): lọc theo từng cấp, quét 2–3 lượt, gộp theo id. Kiểm tra tương tự cho XuatDuLieu và KhoaHocKhac.
- Tình trạng: có "Đã nghiệm thu:" → 01 (không so /nghiệm thu/ vì "Chưa nghiệm thu" cũng khớp); đang làm → 04; quá hạn chưa nghiệm thu → 03.
- Tài sản trí tuệ: `/KhoaHocKhac/ToanBoKhoaHocKhac?...&loai=4` (sáng chế), `loai=6` (GPHI); chi tiết `POST /KhoaHocKhac/DetailsKhoaHocKhac`; file `/KhoaHocKhac/Download/{id}?FileUrl=…`. Excel SHTT của phòng đủ trường hơn nhưng ô ngày kiểu date có ngày ≤ 12 bị đảo ngày/tháng.
- Đề tài: chỉ lấy "Đã phê duyệt" dính năm báo cáo; bỏ cấp cơ sở (lấy từ QĐ giao), nhiệm vụ (63, 64, 75), tiêu chuẩn (43), dự án (66), điều tra cơ bản (39). Cấp cơ sở/trọng điểm/IRD đều là cấp 04, phân loại 02, chủ quản 11.

## 6. Cập nhật công cụ

- Sửa trang: sửa `docs/`, chạy kiểm thử, gộp vào `main`. GitHub Pages tự đăng lại sau 1–2 phút; người dùng chỉ cần F5. Nhớ tăng `APP_VER` trong `docs/js/core.js`.
- Sửa tiện ích (`extension/`): tăng `version` trong `manifest.json`, chạy `python3 "đóng gói tiện ích.py"`, rồi người dùng tải zip mới và cài lại (Load unpacked) hoặc bấm Reload trong `chrome://extensions`. Hạn chế sửa tiện ích; logic để ở trang.
- Kho để Public: không đưa dữ liệu bài báo, số liệu nội bộ, mật khẩu, token vào kho.

## 7. Còn chưa rõ

- Bộ GD&ĐT sẽ hướng dẫn kê khai bài thuộc danh mục Bộ KH&CN trên HEMIS ra sao, khi nào thêm lựa chọn mới.
- Có cần ký số dữ liệu HEMIS không.
