(async () => {
  const DV = '452d0027-e4c1-44d1-9efb-befb8db8840d';
  const HEMIS_PAGE = 'https://hemis-cms.moet.gov.vn/nckh/khcn-bai-bao-khoa-hoc';
  const KEY = 'TLU2HEMIS:';
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/[^\p{L}\p{N}]/gu, '');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const old = document.getElementById('tlu2hemis'); if (old) old.remove();
  const box = document.createElement('div');
  box.id = 'tlu2hemis';
  box.style.cssText = 'position:fixed;inset:20px;z-index:2147483647;background:#fff;color:#222;border:3px solid #0b6bcb;border-radius:10px;box-shadow:0 8px 40px rgba(0,0,0,.4);font:14px/1.5 Arial,sans-serif;display:flex;flex-direction:column;overflow:hidden';
  document.body.appendChild(box);
  const B = 'padding:8px 16px;border:0;border-radius:6px;font-size:15px;font-weight:bold;cursor:pointer;margin:4px';
  const T2H_VER = window.__T2H_VER || '2026.10.28.2';
  const T2H_SRC = window.__T2H_SRC || 'dấu trang';
  const verTxt = 'Phiên bản ' + T2H_VER + (T2H_SRC === 'online' ? ' · mới nhất' : T2H_SRC === 'cache' ? ' · bản lưu (chưa tải được bản mới)' : T2H_SRC === 'kèm theo' ? ' · bản kèm theo (chưa tải được bản mới)' : '');
  const head = t => '<div style="background:#0b6bcb;color:#fff;padding:10px 16px;font-size:17px;font-weight:bold;display:flex;justify-content:space-between;align-items:center">' + t + '<span><span style="font-size:12px;font-weight:normal;opacity:.85;margin-right:14px">' + verTxt + '</span><span id="t2hX" style="cursor:pointer">✕ Đóng</span></span></div>';
  const bindClose = () => { box.querySelector('#t2hX').onclick = () => box.remove(); };
  const pad = n => String(n).padStart(2, '0');
  const toISO = s => { const m = String(s).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); return m ? m[3] + '-' + pad(m[2]) + '-' + pad(m[1]) : null; };


  /* Quy tac ghep loai: p = phan loai (1 tap chi, 2 ky yeu); qt = tap chi quoc te; tn = tap chi trong nuoc */
  const MAP = l => {
    if (/SCIE|SSCI|^Tạp chí ISI/.test(l)) return { p: 1, qt: '01', wos: 1 };
    if (/^Tạp chí SCOPUS/i.test(l)) return { p: 1, qt: '02', wos: 1 };
    if (/quốc tế khác|SPECIAL/i.test(l)) return { p: 1, qt: '04' };
    if (/hội đồng chức danh GSNN/i.test(l)) return { p: 1, tn: '01' };
    if (/Bài thông tin/i.test(l)) return { p: 1, tn: '02', info: 1 };
    if (/Thủy lợi và Môi trường/i.test(l)) return { p: 1, tn: '01' };
    if (/ISI hoặc Scopus/i.test(l)) return { p: 2, tn: '03' };
    if (/thường niên/i.test(l)) return { p: 2, tn: '01' };
    if (/kỷ yếu|Báo cáo học thuật/i.test(l)) return { p: 2, tn: '06' };
    return null;
  };
  const QM = { Q1: '01', Q2: '02', Q3: '03', Q4: '04' };
  /* Danh muc tap chi dat tieu chuan khoa hoc Viet Nam nam 2026 (QD 2244/QD-BKHCN) */
  const DMKHCN = "VIETNAM JOURNAL OF MATHEMATICS\nVIETNAM JOURNAL OF EARTH SCIENCES\nVIETNAM JOURNAL OF CHEMISTRY\nVIETNAM JOURNAL OF SCIENCE AND TECHNOLOGY\nADVANCES IN NATURAL SCIENCES: NANOSCIENCE AND NANOTECHNOLOGY\nACTA MATHEMATICA VIETNAMICA\nJOURNAL OF SCIENCE: ADVANCED MATERIALS AND DEVICES\nBIOMEDICAL RESEARCH AND THERAPY\nJOURNAL OF INNOVATION AND SUSTAINABLE DEVELOPMENT\nINTERNATIONAL JOURNAL OF KNOWLEDGE AND SYSTEM SCIENCE\nEAI ENDORSED TRANSACTION ON INDUSTRIAL NETWORKS AND INTELLIGENT SYSTEMS\nJOURNAL OF ECONOMICS AND DEVELOPMENT\nJOURNAL OF ASIAN BUSINESS AND ECONOMIC STUDIES\nJOURNAL OF SCIENCE AND TRANSPORT TECHNOLOGY\nVIETNAM JOURNAL OF COMPUTER SCIENCE\nJOURNAL OF INFORMATION AND TELECOMMUNICATION\nTẠP CHÍ CỘNG SẢN|TẠP CHÍ CỘNG SẢN - CHUYÊN ĐỀ|XÂY DỰNG ĐẢNG\nTẠP CHÍ CỘNG SẢN ĐIỆN TỬ\nTẠP CHÍ LÝ LUẬN, PHÊ BÌNH VĂN HỌC, NGHỆ THUẬT\nTẠP CHÍ LÝ LUẬN CHÍNH TRỊ|KỲ POLITICAL THEORY\nTẠP CHÍ ĐIỆN TỬ LÝ LUẬN CHÍNH TRỊ\nTẠP CHÍ KINH TẾ VÀ QUẢN LÝ\nTẠP CHÍ LÝ LUẬN CHÍNH TRỊ VÀ TRUYỀN THÔNG|KỲ LÝ LUẬN CHÍNH TRỊ VÀ TRUYỀN THÔNG - MỘT SỐ VẤN ĐỀ LÝ LUẬN CHÍNH TRỊ VÀ TRUYỀN THÔNG TRONG THỰC TIỄN NGHIÊN CỨU VÀ ĐÀO TẠO|KỲ LÝ LUẬN CHÍNH TRỊ VÀ TRUYỀN THÔNG TIẾNG ANH\nTẠP CHÍ ĐIỆN TỬ LÝ LUẬN CHÍNH TRỊ VÀ TRUYỀN THÔNG|TẠP CHÍ ĐIỆN TỬ LÝ LUẬN CHÍNH TRỊ VÀ TRUYỀN THÔNG (TIẾNG VIỆT)|TẠP CHÍ ĐIỆN TỬ LÝ LUẬN CHÍNH TRỊ VÀ TRUYỀN THÔNG (TIẾNG ANH)\nTẠP CHÍ GIÁO DỤC LÝ LUẬN|KỲ JOURNAL OF THEORETICAL EDUCATION\nTẠP CHÍ KHOA HỌC CHÍNH TRỊ\nTẠP CHÍ SINH HOẠT LÝ LUẬN\nTẠP CHÍ THÔNG TIN KHOA HỌC CHÍNH TRỊ\nTẠP CHÍ QUẢN LÝ NHÀ NƯỚC|KỲ STATE MANAGEMENT REVIEW\nTẠP CHÍ ĐIỆN TỬ QUẢN LÝ NHÀ NƯỚC\nTẠP CHÍ CHỦ NGHĨA XÃ HỘI - LÝ LUẬN VÀ THỰC TIỄN\nTẠP CHÍ NGHIÊN CỨU HỒ CHÍ MINH\nTẠP CHÍ LÃNH ĐẠO VÀ CHÍNH SÁCH\nTẠP CHÍ LỊCH SỬ ĐẢNG\nTẠP CHÍ ĐIỆN TỬ LỊCH SỬ ĐẢNG\nTẠP CHÍ PHÁP LUẬT VỀ QUYỀN CON NGƯỜI|KỲ VIETNAM JOURNAL OF HUMAN RIGHT LAW|KỲ TẠP CHÍ PHÁP LUẬT VỀ QUYỀN CON NGƯỜI - CHUYÊN ĐỀ\nTẠP CHÍ THÔNG TIN KHOA HỌC LÝ LUẬN CHÍNH TRỊ|KỲ TẠP CHÍ THÔNG TIN KHOA HỌC LÝ LUẬN CHÍNH TRỊ - NHỮNG VẤN ĐỀ LÝ LUẬN (PHỤC VỤ LÃNH ĐẠO)\nTẠP CHÍ TRIẾT HỌC VÀ ĐỜI SỐNG\nTẠP CHÍ NGHIÊN CỨU VĂN HÓA VÀ PHÁT TRIỂN\nVIETNAM JOURNAL OF MECHANICS\nVIETNAM JOURNAL OF BIOTECHNOLOGY\nJOURNAL OF COMPUTER SCIENCE AND CYBERNERTICS\nVIETNAM JOURNAL OF MARINE SCIENCE AND TECHNOLOGY\nACADEMIA JOURNAL OF BIOLOGY\nCOMMUNICATIONS IN PHYSICS (CIP JOURNAL)\nTẠP CHÍ KHOA HỌC XÃ HỘI VIỆT NAM|KỲ VIETNAM SOCIAL SCIENCES REVIEW\nTẠP CHÍ NHÂN LỰC KHOA HỌC XÃ HỘI\nTẠP CHÍ DÂN TỘC HỌC VÀ TÔN GIÁO HỌC|KỲ JOURNAL OF ANTHROPOLOGY AND RELIGIOUS STUDIES\nTẠP CHÍ ĐỊA LÝ NHÂN VĂN VÀ PHÁT TRIỂN BỀN VỮNG|KỲ TẠP CHÍ ĐỊA LÝ NHÂN VĂN VÀ PHÁT TRIỂN BỀN VỮNG: NGHIÊN CỨU ĐỊA LÝ NHÂN VĂN|KỲ TẠP CHÍ ĐỊA LÝ NHÂN VĂN VÀ PHÁT TRIỂN BỀN VỮNG: PHÁT TRIỂN BỀN VỮNG VÙNG\nTẠP CHÍ KHẢO CỔ HỌC|KỲ VIETNAM ARCHAEOLOGY REVIEW\nTẠP CHÍ KHOA HỌC XÃ HỘI THÀNH PHỐ HỒ CHÍ MINH\nTẠP CHÍ KHOA HỌC XÃ HỘI MIỀN TRUNG\nTẠP CHÍ NGHIÊN CỨU KINH TẾ|KỲ TẠP CHÍ NGHIÊN CỨU KINH TẾ - NHỮNG VẤN ĐỀ KINH TẾ VÀ CHÍNH TRỊ THẾ GIỚI|KỲ VIETNAM'S SOCIO-ECONOMIC DEVELOPMENT\nTẠP CHÍ NGHIÊN CỨU CHÂU Á - THÁI BÌNH DƯƠNG\nTẠP CHÍ NGHIÊN CỨU CHÂU ÂU VÀ CHÂU MỸ|KỲ JOURNAL OF EUROPEAN AND AMERICAN STUDIES\nTẠP CHÍ NGHIÊN CỨU CON NGƯỜI, GIA ĐÌNH VÀ GIỚI|KỲ JOURNAL OF HUMAN FAMILY AND GENDER STUDIES\nTẠP CHÍ HÁN NÔM\nTẠP CHÍ NGHIÊN CỨU Á - PHI|KỲ VIETNAM JOURNAL OF ASIAN - AFRICAN STUDIES\nTẠP CHÍ NGHIÊN CỨU VĂN HOÁ VIỆT NAM\nTẠP CHÍ NGÔN NGỮ|KỲ TỪ ĐIỂN HỌC VÀ BÁCH KHOA THƯ\nTẠP CHÍ NHÀ NƯỚC VÀ PHÁP LUẬT\nTẠP CHÍ NGHIÊN CỨU LỊCH SỬ\nTẠP CHÍ THÔNG TIN KHOA HỌC XÃ HỘI|KỲ SOCIAL SCIENCES INFORMATION REVIEW\nTẠP CHÍ TRIẾT HỌC|KỲ VIETNAMESE JOURNAL OF PHILOSOPHY\nTẠP CHÍ NGHIÊN CỨU VĂN HỌC\nTẠP CHÍ XÃ HỘI HỌC VÀ TÂM LÝ HỌC|KỲ TẠP CHÍ XÃ HỘI HỌC VÀ TÂM LÝ HỌC - XÃ HỘI HỌC|KỲ TẠP CHÍ XÃ HỘI HỌC VÀ TÂM LÝ HỌC - TÂM LÝ HỌC|KỲ VIETNAM JOURNAL OF SOCIOLOGY AND PSYCHOLOGY\nTẠP CHÍ CHÍNH TRỊ VÀ PHÁT TRIỂN\nTẠP CHÍ THANH NIÊN: NGHIÊN CỨU KHOA HỌC THANH NIÊN\nTẠP CHÍ KHOA HỌC, HỌC VIỆN PHỤ NŨ VIỆT NAM\nTẠP CHÍ KHOA HỌC KIỂM SÁT\nTẠP CHÍ TÒA ÁN NHÂN DÂN\nTẠP CHÍ NGHIÊN CỨU LẬP PHÁP\nTẠP CHÍ NGHIÊN CỨU KHOA HỌC KIỂM TOÁN\nTẠP CHÍ NGÂN HÀNG\nTẠP CHÍ KINH TẾ - LUẬT VÀ NGÂN HÀNG|KỲ JOURNAL OF ECONOMIC AND BANKING STUDIES\nTẠP CHÍ KINH TẾ VÀ NGÂN HÀNG CHÂU Á|KỲ ASIAN JOURNAL OF ECONOMICS AND BANKING\nTẠP CHÍ NGHỆ THUẬT QUÂN SỰ VIỆT NAM\nTẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ TRONG LĨNH VỰC AN TOÀN THÔNG TIN\nTẠP CHÍ Y DƯỢC THỰC HÀNH 175\nTẠP CHÍ QUÂN SỰ QUỐC PHÒNG\nGIÁO DỤC LÝ LUẬN CHÍNH TRỊ QUÂN SỰ\nTẠP CHÍ NGHIÊN CỨU KHOA HỌC HẬU CẦN QUÂN SỰ\nTẠP CHÍ KHOA HỌC VÀ KỸ THUẬT\nTẠP CHÍ NGHIÊN CỨU CHIẾN THUẬT - CHIẾN DỊCH\nTẠP CHÍ Y DƯỢC HỌC QUÂN SỰ|KỲ JOURNAL OF MILITARY PHARMACO-MEDICINE\nTẠP CHÍ QUỐC PHÒNG TOÀN DÂN\nTẠP CHÍ CÔNG NGHIỆP QUỐC PHÒNG VÀ KINH TẾ\nTẠP CHÍ HẬU CẦN - KỸ THUẬT\nTẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ NHIỆT ĐỚI|KỲ JOURNAL OF TROPICAL SCIENCE AND ENGINEERING\nTẠP CHÍ LỊCH SỬ QUÂN SỰ\nTẠP CHÍ NGHIÊN CỨU KHOA HỌC VÀ CÔNG NGHỆ QUÂN SỰ\nKHOA HỌC TÌNH BÁO QUỐC PHÒNG\nTẠP CHÍ Y DƯỢC LÂM SÀNG 108\nTẠP CHÍ QUAN HỆ QUỐC PHÒNG\nTẠP CHÍ Y HỌC QUÂN SỰ\nTẠP CHÍ Y HỌC THẢM HỌA VÀ BỎNG\nTẠP CHÍ CÔNG AN NHÂN DÂN\nTẠP CHÍ ĐIỆN TỬ CÔNG AN NHÂN DÂN\nTẠP CHÍ CẢNH SÁT NHÂN DÂN\nTẠP CHÍ AN NINH NHÂN DÂN\nJOURNAL OF PEOPLE'S SECURITY\nTẠP CHÍ KHOA HỌC GIÁO DỤC CẢNH SÁT NHÂN DÂN\nTẠP CHÍ LÝ LUẬN CHÍNH TRỊ CÔNG AN NHÂN DÂN\nTẠP CHÍ KHOA HỌC VÀ GIÁO DỤC AN NINH\nTẠP CHÍ KHOA HỌC VÀ HUẤN LUYỆN TÌNH BÁO\nTẠP CHÍ PHÒNG CHÁY VÀ CHỮA CHÁY\nTẠP CHÍ PHÒNG CHÁY VÀ CHỮA CHÁY ĐIỆN TỬ\nTẠP CHÍ KHOA HỌC KỸ THUẬT - HẬU CẦN\nTẠP CHÍ NGHIÊN CỨU QUỐC TẾ\nTẠP CHÍ TỔ CHỨC NHÀ NƯỚC VÀ LAO ĐỘNG\nTẠP CHÍ NGUỒN NHÂN LỰC VÀ AN SINH XÃ HỘI\nTẠP CHÍ DÂN CHỦ VÀ PHÁP LUẬT\nTẠP CHÍ NGHỀ LUẬT\nTẠP CHÍ LUẬT HỌC|KỲ JOURNAL OF LEGAL STUDIES\nTẠP CHÍ KINH TẾ-TÀI CHÍNH|KỲ VIETNAM ECONOMIC & FINANCE REVIEW\nTẠP CHÍ KINH TẾ - TÀI CHÍNH ONLINE\nTẠP CHÍ NGHIÊN CỨU TÀI CHÍNH KẾ TOÁN|KỲ JOURNAL OF FINANCE & ACCOUNTING RESEARCH\nTẠP CHÍ KHOA HỌC TÀI CHÍNH KẾ TOÁN\nTẠP CHÍ NGHIÊN CỨU TÀI CHÍNH - MARKETING|KỲ JOURNAL OF FINACE - MARKETING RESEARCH\nTẠP CHÍ TÀI CHÍNH - QUẢN TRỊ KINH DOANH\nTẠP CHÍ CÔNG THƯƠNG\nNGHIÊN CỨU CÔNG NGHIỆP VÀ THƯƠNG MẠI\nTẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ TRƯỜNG ĐẠI HỌC CÔNG NGHIỆP HÀ NỘI|KỲ TẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ TRƯỜNG ĐẠI HỌC CÔNG NGHIỆP HÀ NỘI (TẠP CHÍ IN)|KỲ HANOI UNIVERSITY OF INDUSTRY JOURNAL OF SCIENCE AND TECHNOLOGY\nTẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ TRƯỜNG ĐẠI HỌC CÔNG NGHIỆP (TẠP CHÍ ĐIỆN TỬ)\nTẠP CHÍ ĐIỆN TỬ KHOA HỌC VÀ CÔNG NGHỆ QUI\nTẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ - TRƯỜNG ĐẠI HỌC CÔNG NGHIỆP THÀNH PHỐ HỒ CHÍ MINH\nTẠP CHÍ KHOA HỌC ĐẠI HỌC CÔNG THƯƠNG\nTẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ NĂNG LƯỢNG\nTẠP CHÍ KHOA HỌC & CÔNG NGHỆ\nTẠP CHÍ NGHIÊN CỨU KHOA HỌC - ĐẠI HỌC SAO ĐỎ\nTẠP CHÍ NÔNG NGHIỆP VÀ MÔI TRƯỜNG|KỲ VIETNAM JOURNAL OF AGRICULTURE AND ENVIRONMENT\nTẠP CHÍ KHOA HỌC NÔNG NGHIỆP VIỆT NAM|KỲ VIETNAM JOURNAL OF AGRICULTURAL SCIENCES\nTẠP CHÍ BẢO VỆ THỰC VẬT\nTẠP CHÍ MÔI TRƯỜNG|KỲ TẠP CHÍ MÔI TRƯỜNG - CHUYÊN ĐỀ KHOA HỌC-CÔNG NGHỆ|KỲ JOURNAL OF ENVIRONMNET\nTẠP CHÍ ĐỊA CHẤT|KỲ JOURNAL OF GEOLOGY\nTẠP CHÍ KHOA HỌC BIẾN ĐỔI KHÍ HẬU\nTẠP CHÍ KHOA HỌC LÂM NGHIỆP\nTẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ NÔNG NGHIỆP VIỆT NAM\nTẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ THỦY LỢI\nTẠP CHÍ NGHỀ CÁ SÔNG CỬU LONG\nTẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ LÂM NGHIỆP|KỲ JOURNAL OF FORESTRY SCIENCE AND TECHNOLOGY\nTẠP CHÍ KHOA HỌC TÀI NGUYÊN VÀ MÔI TRƯỜNG|KỲ JOURNAL OF SCIENCE ON NATURAL RESOURCES AND ENVIRONMENT\nTẠP CHÍ KHOA HỌC KỸ THUẬT THỦY LỢI VÀ MÔI TRƯỜNG|KỲ JOURNAL OF WATER RESOURCES AND ENVIRONMENT ENGINEERING\nTẠP CHÍ XÂY DỰNG\nTẠP CHÍ XÂY DỰNG VÀ ĐÔ THỊ\nTẠP CHÍ KHOA HỌC CÔNG NGHỆ HÀNG KHÔNG\nTẠP CHÍ KIẾN TRÚC VIỆT NAM\nTẠP CHÍ KINH TẾ XÂY DỰNG\nTẠP CHÍ QUY HOẠCH XÂY DỰNG\nTẠP CHÍ VẬT LIỆU VÀ XÂY DỰNG|KỲ JOURNAL OF MATERIALS AND CONSTRUCTION\nTẠP CHÍ ĐIỆN TỬ KHOA HỌC VÀ CÔNG NGHỆ GIAO THÔNG\nTẠP CHÍ KHOA HỌC CÔNG NGHỆ GIAO THÔNG VẬN TẢI\nTẠP CHÍ KHOA HỌC CÔNG NGHỆ HÀNG HẢI\nTẠP CHÍ KHOA HỌC KIẾN TRÚC VÀ XÂY DỰNG|KỲ SCIENCE JOURNAL OF ARCHITECTURE AND CONSTRUCTION\nTẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ TRƯỜNG ĐẠI HỌC XÂY DỰNG MIỀN TÂY\nTẠP CHÍ VĂN HÓA NGHỆ THUẬT\nTẠP CHÍ VĂN HOÁ, THỂ THAO VÀ DU LỊCH|KỲ TẠP CHÍ VĂN HOÁ, THỂ THAO VÀ DU LỊCH - VĂN HÓA HỌC|KỲ TẠP CHÍ VĂN HOÁ, THỂ THAO VÀ DU LỊCH - KHOA HỌC THỂ THAO\nTẠP CHÍ NGHIÊN CỨU MỸ THUẬT\nTẠP CHÍ KHOA HỌC VÀ ĐÀO TẠO THỂ THAO\nTẠP CHÍ KHOA HỌC ĐÀO TẠO VÀ HUẤN LUYỆN THỂ THAO\nTẠP CHÍ KHOA HỌC VÀ ĐÀO TẠO THỂ DỤC THỂ THAO\nTẠP CHÍ NGHIÊN CỨU VĂN HÓA\nTẠP CHÍ VĂN HÓA VÀ NGUỒN LỰC\nTẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ VIỆT NAM|KỲ TẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ VIỆT NAM BẢN B|KỲ VIETNAM JOURNAL OF SCIENCE, TECHNOLOGY AND ENGINEERING|KỲ VMOST JOURNAL OF SOCIAL SCIENCES AND HUMANITIES|JOURNAL ON INFORMATION TECHNOLOGIES & COMMUNICATIONS|CHUYÊN SAN CÁC CÔNG TRÌNH NGHIÊN CỨU, PHÁT TRIỂN VÀ ỨNG DỤNG CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG|TẠP CHÍ CHÍNH SÁCH VÀ QUẢN LÝ KHOA HỌC VÀ CÔNG NGHỆ\nTẠP CHÍ THÔNG TIN VÀ TƯ LIỆU\nTẠP CHÍ GIÁO DỤC|KỲ VIETNAM JOURNAL OF EDUCATION\nTẠP CHÍ QUẢN LÝ GIÁO DỤC\nTẠP CHÍ KHOA HỌC GIÁO DỤC VIỆT NAM|KỲ VIETNAM JOURNAL OF EDUCATIONAL SCIENCES\nTẠP CHÍ KHOA HỌC ĐẠI HỌC QUỐC GIA HÀ NỘI|KỲ TẠP CHÍ KHOA HỌC ĐẠI HỌC QUỐC GIA HÀ NỘI: CÁC KHOA HỌC TRÁI ĐẤT VÀ MÔI TRƯỜNG|KỲ TẠP CHÍ KHOA HỌC ĐẠI HỌC QUỐC GIA HÀ NỘI: TOÁN - LÝ|KỲ TẠP CHÍ KHOA HỌC ĐẠI HỌC QUỐC GIA HÀ NỘI: KHOA HỌC TỰ NHIÊN VÀ CÔNG NGHỆ|KỲ TẠP CHÍ KHOA HỌC ĐẠI HỌC QUỐC GIA HÀ NỘI: CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG|KỲ TẠP CHÍ KHOA HỌC ĐẠI HỌC QUỐC GIA HÀ NỘI: NGHIÊN CỨU CHÍNH SÁCH VÀ QUẢN LÝ|KỲ TẠP CHÍ KHOA HỌC ĐẠI HỌC QUỐC GIA HÀ NỘI: KHOA HỌC Y DƯỢC|KỲ TẠP CHÍ KHOA HỌC ĐẠI HỌC QUỐC GIA HÀ NỘI: LUẬT HỌC|KỲ TẠP CHÍ KHOA HỌC ĐẠI HỌC QUỐC GIA HÀ NỘI: CÔNG NGHỆ THÔNG TIN - TRUYỀN THÔNG\nTẠP CHÍ NGHIÊN CỨU NƯỚC NGOÀI\nTẠP CHÍ KHOA HỌC XÃ HỘI VÀ NHÂN VĂN|KỲ VNU JOURNAL OF SOCIAL SCIENCES AND HUMANITIES\nTẠP CHÍ KINH TẾ VÀ KINH DOANH\nTẠP CHÍ ĐẠI HỌC QUỐC GIA THÀNH PHỐ HỒ CHÍ MINH|KỲ VNUHCM JOURNAL OF SCIENCES AND TECHNOLOGY DEVELOPMENT|KỲ VNUHCM JOURNAL OF ENGINEERING AND TECHNOLOGY|KỲ VNUHCM JOURNAL OF ADVANCED RESEARCH IN NATURAL SCIENCES|KỲ VNUHCM JOURNAL OF ENVIRONMENT AND EARTH SCIENCES|KỲ VNUHCM JOURNAL OF HEALTH SCIENCES|KỲ VNUHCM JOURNAL OF SOCIAL SCIENCES AND HUMANITIES|KỲ VNUHCM JOURNAL OF ECONOMICS, BUSINESS AND LAW\nTẠP CHÍ KHOA HỌC QUỐC TẾ AGU|KỲ AGU INTERNATIONAL JOURNAL OF SCIENCES\nTẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ ĐẠI HỌC THÁI NGUYÊN|KỲ TẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ ĐẠI HỌC THÁI NGUYÊN: KHOA HỌC NÔNG NGHIỆP - LÂM NGHIỆP - Y DƯỢC|KỲ TẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ ĐẠI HỌC THÁI NGUYÊN: KHOA HỌC TỰ NHIÊN - KỸ THUẬT - CÔNG NGHỆ|KỲ TẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ ĐẠI HỌC THÁI NGUYÊN: KHOA HỌC XÃ HỘI - NHÂN VĂN - KINH TẾ|KỲ TẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ ĐẠI HỌC THÁI NGUYÊN: KHOA HỌC GIÁO DỤC|KỲ TẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ ĐẠI HỌC THÁI NGUYÊN: CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG\nTẠP CHÍ KINH TẾ VÀ QUẢN TRỊ KINH DOANH\nTẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ Y DƯỢC|KỲ JOURNAL OF SCIENCE AND TECHNOLOGY IN MEDICINE AND PHARMACY\nTẠP CHÍ KHOA HỌC ĐẠI HỌC HUẾ|TẠP CHÍ KHOA HỌC ĐẠI HỌC HUẾ: CHUYÊN SAN KHOA HỌC XÃ HỘI VÀ NHÂN VĂN|TẠP CHÍ KHOA HỌC ĐẠI HỌC HUẾ: CHUYÊN SAN KHOA HỌC TỰ NHIÊN|TẠP CHÍ KHOA HỌC ĐẠI HỌC HUẾ: CHUYÊN SAN KỸ THUẬT VÀ CÔNG NGHỆ|TẠP CHÍ KHOA HỌC ĐẠI HỌC HUẾ: CHUYÊN SAN NÔNG NGHIỆP VÀ PHÁT TRIỂN NÔNG THÔN|TẠP CHÍ KHOA HỌC ĐẠI HỌC HUẾ: KINH TẾ VÀ PHÁT TRIỂN\nTẠP CHÍ KHOA HỌC QUẢN LÝ VÀ KINH TẾ|KỲ HUE JOURNAL OF ECONOMICS AND MANAGEMENT\nPHÁP LUẬT VÀ THỰC TIỄN\nTẠP CHÍ KHOA HỌC NGÔN NGỮ VÀ VĂN HÓA\nTẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ NÔNG NGHIỆP\nTẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ TRƯỜNG ĐẠI HỌC KHOA HỌC|KỲ TẠP CHÍ KHOA HỌC CÔNG NGHỆ TRƯỜNG ĐẠI HỌC KHOA HỌC: TOÁN - CÔNG NGHỆ THÔNG TIN - VẬT LÝ - KIẾN TRÚC|KỲ TẠP CHÍ KHOA HỌC CÔNG NGHỆ TRƯỜNG ĐẠI HỌC KHOA HỌC: HÓA - SINH - KHOA HỌC TRÁI ĐẤT|KỲ TẠP CHÍ KHOA HỌC CÔNG NGHỆ TRƯỜNG ĐẠI HỌC KHOA HỌC: VĂN - SỬ - TRIẾT HỌC\nTẠP CHÍ KHOA HỌC VÀ GIÁO DỤC|KỲ TẠP CHÍ KHOA HỌC VÀ GIÁO DỤC: KHOA HỌC GIÁO DỤC|KỲ TẠP CHÍ KHOA HỌC VÀ GIÁO DỤC: SỐ ĐẶC BIỆT\nTẠP CHÍ Y DƯỢC HUẾ|KỲ HUE JOURNAL OF MEDICINE AND PHARMACY\nTẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ ĐẠI HỌC ĐÀ NẴNG\nTẠP CHÍ KHOA HỌC KINH TẾ\nTẠP CHÍ KHOA HỌC XÃ HỘI, NHÂN VĂN VÀ GIÁO DỤC\nTẠP CHÍ KHOA HỌC ĐẠI HỌC CẦN THƠ|KỲ CTU JOURNAL OF INNOVATION AND STUSTAINABLE DEVELOPMENT\nTẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ|KỲ JOURNAL OF SCIENCES AND TECHNOLOGY – ENGINEERING AND TECHNOLOGY FOR SUSTAINABLE DEVELOPMENT|KỲ JOURNAL OF SCIENCES AND TECHNOLOGY – SMART SYSTEMS AND DEVICES\nTẠP CHÍ KINH TẾ VÀ PHÁT TRIỂN\nTẠP CHÍ NGHIÊN CỨU KINH TẾ VÀ KINH DOANH CHÂU Á\nTẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ - ĐẠI HỌC NGUYỄN TẤT THÀNH\nTẠP CHÍ KHOA HỌC QUẢN LÝ GIÁO DỤC\nTẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ - TRƯỜNG ĐẠI HỌC BÌNH DƯƠNG\nTẠP CHÍ KHOA HỌC GIÁO DỤC KỸ THUẬT|KỲ JOURNAL OF TECHNICAL EDUCATION SCIENCE\nTẠP CHÍ KHOA HỌC ĐẠI HỌC CỬU LONG|KỲ MEKONG UNIVERSITY SCIENTIFIC JOURNAL\nTẠP CHÍ KHOA HỌC ĐẠI HỌC ĐÀ LẠT\nTẠP CHÍ KHOA HỌC ĐẠI HỌC ĐÔNG Á\nTẠP CHÍ KHOA HỌC, CÔNG NGHỆ VÀ PHÁT TRIỂN\nTẠP CHÍ KHOA HỌC ĐẠI HỌC ĐỒNG THÁP|KỲ TẠP CHÍ KHOA HỌC ĐẠI HỌC ĐỒNG THÁP - CHUYÊN SAN KHOA HỌC XÃ HỘI VÀ NHÂN VĂN|KỲ DONG THAP UNIVERSITY JOURNAL OF SCIENCE - SOCIAL SCIENCES AND HUMANITIES ISSUE|KỲ TẠP CHÍ KHOA HỌC ĐẠI HỌC ĐỒNG THÁP - CHUYÊN SAN KHOA HỌC TỰ NHIÊN|KỲ DONG THAP UNIVERSITY JOURNAL OF SCIENCE - NATURAL SCIENCES ISSUE\nTẠP CHÍ KHOA HỌC GIAO THÔNG VẬN TẢI|KỲ TRANSPORT AND COMMUNICATIONS SCIENCE JOURNAL\nTẠP CHÍ KHOA HỌC NGOẠI NGỮ\nTẠP CHÍ KHOA HỌC KINH DOANH VÀ CÔNG NGHỆ\nTẠP CHÍ KINH TẾ - CÔNG NGHIỆP\nTẠP CHÍ PHÁT TRIỂN VÀ HỘI NHẬP\nTẠP CHÍ KHOA HỌC LẠC HỒNG\nTẠP CHÍ KHOA HỌC PHÁP LÝ VIỆT NAM\nTẠP CHÍ KHOA HỌC KỸ THUẬT MỎ - ĐỊA CHẤT|KỲ JOURNAL OF MINING AND EARTH SCIENCES\nTẠP CHÍ KHOA HỌC TRƯỜNG ĐẠI HỌC MỞ HÀ NỘI\nTẠP CHÍ KHOA HỌC ĐẠI HỌC MỞ THÀNH PHỐ HỒ CHÍ MINH|KỲ HCMCOU JOURNAL OF SCIENCE: ADVANCES IN COMPUTATIONAL STRUCTURES|KỲ TẠP CHÍ KHOA HỌC ĐẠI HỌC MỞ THÀNH PHỐ HỒ CHÍ MINH: KINH TẾ VÀ QUẢN TRỊ KINH DOANH|KỲ TẠP CHÍ KHOA HỌC ĐẠI HỌC MỞ THÀNH PHỐ HỒ CHÍ MINH: KỸ THUẬT VÀ CÔNG NGHỆ|KỲ TẠP CHÍ KHOA HỌC ĐẠI HỌC MỞ THÀNH PHỐ HỒ CHÍ MINH: KHOA HỌC XÃ HỘI|KỲ HO CHI MINH CITY OPEN UNIVERSITY JOURNAL OF SCIENCE: ECONOMICS AND BUSINESS ADMINISTRATION|KỲ HO CHI MINH CITY OPEN UNIVERSITY JOURNAL OF SCIENCE: SOCIAL SCIENCES|KỲ HO CHI MINH CITY OPEN UNIVERSITY JOURNAL OF SCIENCE: ENGINEERING AND TECHNOLOGY\nTẠP CHÍ KHOA HỌC VÀ KINH TẾ PHÁT TRIỂN|KỲ JOURNAL OF SCIENCE AND DEVELOPMENT ECONOMICS\nTẠP CHÍ KHOA HỌC HUFLIT|KỲ HUFLIT JOURNAL OF SCIENCE\nTẠP CHÍ QUẢN LÝ VÀ KINH TẾ QUỐC TẾ|KỲ JOURNAL OF INTERNATIONAL ECONOMICS AND MANAGEMENT\nTẠP CHÍ KHOA HỌC - CÔNG NGHỆ THỦY SẢN\nTẠP CHÍ NÔNG NGHIỆP VÀ PHÁT TRIỂN|KỲ THE JOURNAL OF AGRICULTURE AND DEVELOPMENT\nTẠP CHÍ KHOA HỌC TRƯỜNG ĐẠI HỌC PHAN THIẾT\nTẠP CHÍ KHOA HỌC TRƯỜNG ĐẠI HỌC QUY NHƠN\nTẠP CHÍ KHOA HỌC TRƯỜNG ĐẠI HỌC SƯ PHẠM HÀ NỘI\nTẠP CHÍ KHOA HỌC TRƯỜNG ĐẠI HỌC SƯ PHẠM HÀ NỘI 2\nTẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ ỨNG DỤNG\nTẠP CHÍ GIÁO DỤC NGHỆ THUẬT\nTẠP CHÍ KHOA HỌC TRƯỜNG ĐẠI HỌC SƯ PHẠM THÀNH PHỐ HỒ CHÍ MINH\nTẠP CHÍ KHOA HỌC GIÁO DỤC THỂ CHẤT VÀ THỂ THAO TRƯỜNG HỌC\nTẠP CHÍ KHOA HỌC TÀI CHÍNH - NGÂN HÀNG\nTẠP CHÍ KHOA HỌC TRƯỜNG ĐẠI HỌC TÂY BẮC\nTẠP CHÍ NGHIÊN CỨU KHOA HỌC VÀ PHÁT TRIỂN KINH TẾ\nTẠP CHÍ KHOA HỌC TÂY NGUYÊN\nTẠP CHÍ KHOA HỌC THĂNG LONG\nTẠP CHÍ NGHIÊN CỨU KHOA HỌC VÀ PHÁT TRIỂN\nTẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ TRƯỜNG ĐẠI HỌC THÀNH ĐÔNG\nTẠP CHÍ KHOA HỌC THƯƠNG MẠI|KỲ JOURNAL OF TRADE SCIENCE\nTẠP CHÍ KHOA HỌC CÔNG NGHỆ XÂY DỰNG|KỲ JOURNAL OF SCIENCE AND TECHNOLOGY IN CIVIL ENGINEERING\nTẠP CHÍ KHOA HỌC TRƯỜNG ĐẠI HỌC VINH|KỲ TẠP CHÍ KHOA HỌC TRƯỜNG ĐẠI HỌC VINH - SERIES A KHOA HỌC TỰ NHIÊN, KỸ THUẬT VÀ CÔNG NGHỆ|KỲ TẠP CHÍ KHOA HỌC TRƯỜNG ĐẠI HỌC VINH - SERIES B KHOA HỌC XÃ HỘI VÀ NHÂN VĂN|KỲ TẠP CHÍ KHOA HỌC TRƯỜNG ĐẠI HỌC VINH - SERIES C KHOA HỌC VÀ CÔNG NGHỆ GIÁO DỤC\nTẠP CHÍ Y HỌC LÂM SÀNG\nTẠP CHÍ CHÂM CỨU VIỆT NAM\nTẠP CHÍ SỨC KHOẺ VÀ LÃO HOÁ|KỲ JOURNAL OF HEALTH AND AGING\nTẠP CHÍ Y HỌC LÂM SÀNG BỆNH VIỆN TRUNG ƯƠNG HUẾ|KỲ JOURNAL OF CLINICAL MEDICINE HUE CENTRAL HOSPITAL\nTẠP CHÍ Y DƯỢC CỔ TRUYỀN VIỆT NAM\nTẠP CHÍ DƯỢC LIỆU|KỲ JOURNAL OF MEDICINAL MATERIALS\nTẠP CHÍ KHOA HỌC KIỂM ĐỊNH VẮC XIN VÀ SINH PHẨM Y TẾ\nTẠP CHÍ KIỂM NGHIỆM VÀ AN TOÀN THỰC PHẨM|KỲ VIETNAM JOURNAL OF FOOD CONTROL\nTẠP CHỈ KIỂM NGHIỆM DƯỢC VÀ MỸ PHẨM|KỲ JOURNAL OF PHARMACEUTICAL AND COSMETIC CONTROL\nTẠP CHÍ Y HỌC THÀNH PHỐ HỒ CHÍ MINH|KỲ TẠP CHÍ Y HỌC THÀNH PHỐ HỒ CHÍ MINH - DƯỢC HỌC|KỲ TẠP CHÍ Y HỌC THÀNH PHỐ HỒ CHÍ MINH - MEDPHARMRES\nTẠP CHÍ KHOA HỌC ĐIỀU DƯỠNG\nTẠP CHÍ NGHIÊN CỨU DƯỢC VÀ THÔNG TIN THUỐC\nTẠP CHÍ Y DƯỢC HỌC CẦN THƠ|KỲ CAN THO JOURNAL OF MEDICINE AND PHARMACY\nTẠP CHÍ KHOA HỌC SỨC KHỎE|KỲ JOURNAL OF HEALTH SCIENCE\nTẠP CHÍ Y DƯỢC THÁI BÌNH\nTẠP CHÍ NGHIÊN CỨU Y HỌC\nTẠP CHÍ KHOA HỌC NGHIÊN CỨU SỨC KHỎE VÀ PHÁT TRIỂN|KỲ JOURNAL OF HEALTH AND DEVELOPMENT STUDIES\nTẠP CHI KHOA HỌC TRƯỜNG ĐẠI HỌC HẢI PHÒNG|KỲ TẠP CHI KHOA HỌC TRƯỜNG ĐẠI HỌC HẢI PHÒNG - KHOA HỌC - KINH TẾ - KỸ THUẬT - CÔNG NGHỆ|KỲ TẠP CHI KHOA HỌC TRƯỜNG ĐẠI HỌC HẢI PHÒNG - KHOA HỌC - GIÁO DỤC - XÃ HỘI - NHÂN VĂN|KỲ HAIPHONG UNIVERSITY JOURNAL OF SCIENCE - SPECIAL ISSUE\nTẠP CHÍ NGHIÊN CỨU VÀ PHÁT TRIỂN\nTẠP CHÍ KHOA HỌC TRƯỜNG ĐẠI HỌC BẠC LIÊU\nTẠP CHÍ KHOA HỌC TRƯỜNG ĐẠI HỌC PHÚ YÊN\nTẠP CHÍ KHOA HỌC - ĐẠI HỌC ĐỒNG NAI\nTẠP CHÍ KHOA HỌC TRƯỜNG ĐẠI HỌC HÀ TĨNH\nTẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ TRƯỜNG ĐẠI HỌC HẢI DƯƠNG\nTẠP CHÍ KHOA HỌC ĐẠI HỌC KHÁNH HÒA\nTẠP CHÍ KHOA HỌC TRƯỜNG ĐẠI HỌC NGHỆ AN\nTẠP CHÍ KHOA HỌC TRƯỜNG ĐẠI HỌC HOA LƯ\nTẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ TRƯỜNG ĐẠI HỌC HÙNG VƯƠNG\nTẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ TRƯỜNG ĐẠI HỌC PHẠM VĂN ĐỒNG\nTẠP CHÍ KHOA HỌC ĐẠI HỌC HẠ LONG\nTẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ ĐẠI HỌC QUẢNG BÌNH\nTẠP CHÍ KHOA HỌC TRƯỜNG ĐẠI HỌC HỒNG ĐỨC|KỲ TẠP CHÍ KHOA HỌC TRƯỜNG ĐẠI HỌC HỒNG ĐỨC – KHOA HỌC GIÁO DỤC VÀ QUẢN LÝ|KỲ TẠP CHÍ KHOA HỌC TRƯỜNG ĐẠI HỌC HỒNG ĐỨC - KHOA HỌC TỰ NHIÊN, KỸ THUẬT VÀ CÔNG NGHỆ|KỲ TẠP CHÍ KHOA HỌC TRƯỜNG ĐẠI HỌC HỒNG ĐỨC - KHOA HỌC XÃ HỘI VÀ NHÂN VĂN|KỲ TẠP CHÍ KHOA HỌC TRƯỜNG ĐẠI HỌC HỒNG ĐỨC - KINH TẾ - QUẢN TRỊ KINH DOANH, CHÍNH TRỊ VÀ PHÁP LUẬT|KỲ TẠP CHÍ KHOA HỌC TRƯỜNG ĐẠI HỌC HỒNG ĐỨC - KHOA HỌC NÔNG - LÂM - NGƯ NGHIỆP|KỲ HONG DUC UNIVERSITY JOURNAL OF SCIENCE\nTẠP CHÍ KHOA HỌC, TRƯỜNG ĐẠI HỌC VĂN HÓA, THỂ THAO VÀ DU LỊCH THANH HÓA\nTẠP CHÍ KHOA HỌC TRƯỜNG ĐẠI HỌC TÂN TRÀO\nTẠP CHÍ KHOA HỌC TRƯỜNG ĐẠI HỌC TRÀ VINH\nTẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ CẦN THƠ\nTẠP CHÍ KHOA HỌC TRƯỜNG ĐẠI HỌC QUẢNG NAM\nTẠP CHÍ KHOA HỌC - TRƯỜNG ĐẠI HỌC THỦ ĐÔ HÀ NỘI|KỲ TẠP CHÍ KHOA HỌC - TRƯỜNG ĐẠI HỌC THỦ ĐÔ HÀ NỘI: KHOA HỌC TỰ NHIÊN VÀ CÔNG NGHỆ|KỲ TẠP CHÍ KHOA HỌC - TRƯỜNG ĐẠI HỌC THỦ ĐÔ HÀ NỘI: KHOA HỌC XÃ HỘI VÀ GIÁO DỤC\nTẠP CHÍ KHOA HỌC PHÁT TRIỂN NHÂN LỰC\nTẠP CHÍ KHOA HỌC TRƯỜNG ĐẠI HỌC SÀI GÒN\nTẠP CHÍ KHOA HỌC ĐẠI HỌC THỦ DẦU MỘT\nTẠP CHÍ ĐIỆN TỬ: THU DAU MOT UNIVERSITY JOURNAL OF SCIENCE ONLINE\nTẠP CHÍ Y DƯỢC HỌC PHẠM NGỌC THẠCH\nTẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ ĐẠI HỌC DUY TÂN|KỲ DTU JOURNAL OF SCIENE AND TECHNOLOGY\nTẠP CHÍ KHOA HỌC VÀ QUẢN LÝ CÔNG NGHỆ\nTẠP CHÍ KHOA HỌC ĐẠI HỌC GIA ĐỊNH\nTẠP CHÍ KHOA HỌC VÀ CÔNG NGHỆ TRƯỜNG ĐẠI HỌC HÒA BÌNH\nTẠP CHÍ KHOA HỌC TRƯỜNG ĐẠI HỌC HOA SEN\nTẠP CHÍ KHOA HỌC TRƯỜNG ĐẠI HỌC QUỐC TẾ HỒNG BÀNG|KỲ HONG BANG INTERNATIONAL UNIVERSITY JOURNAL OF SCIENCE\nTẠP CHÍ KHOA HỌC TRƯỜNG ĐẠI HỌC TÂN TẠO\nTẠP CHÍ KHOA HỌC ĐẠI HỌC VĂN HIẾN|KỲ JOURNAL OF SCIENCE VAN HIEN UNIVERSITY\nTẠP CHÍ KHOA HỌC ĐẠI HỌC VĂN LANG\nTẠP CHÍ KHOA HỌC YERSIN\nTẠP CHÍ ĐIỆN TỬ CÔNG NGHỆ TIÊN TIẾN VÀ TÍNH TOÁN\nTẠP CHÍ LUẬT SƯ VIỆT NAM\nTẠP CHÍ GIÁO DỤC VÀ XÃ HỘI\nTẠP CHÍ CƠ KHÍ VIỆT NAM\nTẠP CHÍ NGƯỜI XÂY DỰNG\nTẠP CHÍ Y HỌC CỘNG ĐỒNG|KỲ VIETNAM JOURNAL OF COMMUNITY MEDICINE\nTẠP CHÍ ĐIỆN TỬ VIỆT NAM HỘI NHẬP\nTẠP CHÍ TRUYỀN THỐNG VÀ PHÁT TRIỂN\nTẠP CHÍ PHÁP LÝ\nTẠP CHÍ PHÁP LUẬT VÀ PHÁT TRIỂN\nTẠP CHÍ ĐIỆN TỬ PHÁP LUẬT VÀ PHÁT TRIỂN\nTẠP CHÍ KINH TẾ VÀ LAO ĐỘNG\nTẠP CHÍ KINH TẾ CHÂU Á - THÁI BÌNH DƯƠNG\nTẠP CHÍ ĐIỀU DƯỠNG VIỆT NAM\nTẠP CHÍ KẾ TOÁN VÀ KIỂM TOÁN\nTẠP CHÍ THỊ TRƯỜNG TÀI CHÍNH TIỀN TỆ\nTẠP CHÍ THIẾT BỊ GIÁO DỤC\nTẠP CHÍ KHOA HỌC KỸ THUẬT CHĂN NUÔI\nTAP CHÍ CÔNG NGHIỆP NÔNG THÔN\nTẠP CHÍ GIÁO CHỨC VIỆT NAM\nTẠP CHÍ DA LIỄU HỌC VIỆT NAM\nTẠP CHÍ ĐIỆN QUANG VÀ Y HỌC HẠT NHÂN VIỆT NAM\nTẠP CHÍ DINH DƯỠNG VÀ THỰC PHẨM|KỲ VIETNAM JOURNAL OF NUTRITION AND FOOD\nTẠP CHÍ XÚC TÁC VÀ HẤP PHỤ VIỆT NAM\nTẠP CHÍ KHOA HỌC ĐẤT\nTẠP CHÍ CẦU ĐƯỜNG VIỆT NAM\nTẠP CHÍ LUYỆN KIM VÀ KHOA HỌC VẬT LIỆU\nTẠP CHÍ PHÂN TÍCH HÓA - LÝ VÀ SINH HỌC\nTẠP CHÍ KHOA HỌC KỸ THUẬT THÚ Y\nTẠP CHÍ KHOA HỌC TIÊU HÓA VIỆT NAM\nTẠP CHÍ CÔNG NGHIỆP MỎ\nTẠP CHÍ KIẾN TRÚC\nTẠP CHÍ NGOẠI KHOA VÀ PHẪU THUẬT NỘI SOI VIỆT NAM\nTẠP CHÍ SỨC KHỎE NỘI TIẾT\nTẠP CHÍ NHÃN KHOA VIỆT NAM\nTẠP CHÍ NHI KHOA\nTẠP CHÍ NỘI TIẾT - ĐÁI THÁO ĐƯỜNG|KỲ JOURNAL OF DIABETES AND ENDOCRINOLOGY\nTẠP CHÍ PHẪU THUẬT TIM MẠCH VÀ LỒNG NGỰC VIỆT NAM\nTẠP CHÍ PHỤ SẢN|KỲ VIENAMESE JOURNAL OF OBSTETRIC AND GYNECOLOGY\nTẠP CHÍ QUY HOẠCH ĐÔ THỊ\nTẠP CHÍ RĂNG HÀM MẶT VIỆT NAM\nTẠP CHÍ SINH LÝ HỌC VIỆT NAM\nTẠP CHÍ TAI MŨI HỌNG\nTẠP CHÍ TÂM LÝ HỌC VIỆT NAM\nTẠP CHÍ THẦN KINH HỌC VIỆT NAM\nTẠP CHÍ TIM MẠCH HỌC VIỆT NAM\nTẠP CHÍ TRẮC ĐỊA - BẢN ĐỒ\nTẠP CHÍ TRUYỀN NHIỄM VIỆT NAM\nTẠP CHÍ ĐO LƯỜNG, ĐIỀU KHIỂN VÀ TỰ ĐỘNG HÓA\nTẠP CHÍ UNG THƯ HỌC VIỆT NAM\nTẠP CHÍ NGUỒN SÁNG DÂN GIAN\nREV JOURNAL ON ELECTRONICS AND COMMUNICATIONS\nTẠP CHÍ Y HỌC DỰ PHÒNG|KỲ VIETNAM JOURNAL OF PREVENTIVE MEDICINE\nTẠP CHÍ Y TẾ CÔNG CỘNG|KỲ VIETNAM JOURNAL OF PUBLIC HEALTH".split('\n').map(x => x.split('|'));
  const nkey = s => String(s || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/&/g, ' va ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/^(ky |tap chi |tao chi )+/, '').replace(/^(ky |tap chi )+/, '');
  const kclean = k => k.replace(/\b(p |e )?issn\b.*$/, '').replace(/\b(so|no|vol|volume|tap|thang|issue|quyen)\s*\d.*$/, '').replace(/\b(19|20)\d{2}\b.*$/, '').replace(/\bso tieng (viet|anh)\b/g, '').replace(/\btieng (viet|anh)\b/g, '').replace(/\bban (in|dien tu)\b/g, '').replace(/\s+/g, ' ').trim();
  const DMSTOP = new Set('tap chi ky khoa hoc va cong nghe ky thuat truong dai journal of science and technology the research viet nam vietnam international so ban dien tu online university review studies in on for'.split(' '));
  const dtok = s => new Set(s.split(' ').filter(w => w.length > 1 && !DMSTOP.has(w)));
  const DMIDX = (() => { const m = new Map(); DMKHCN.forEach((names, i) => names.forEach(n => { const k = nkey(n.replace(/\([^)]*\)/g, ' ')); [k, kclean(k)].forEach(x => { if (x && !m.has(x)) m.set(x, i); }); })); return m; })();
  const bigr = s => { const a = new Map(); for (let i = 0; i < s.length - 1; i++) { const g = s.substr(i, 2); a.set(g, (a.get(g) || 0) + 1); } return a; };
  const dice = (a, b) => { if (a.length < 2 || b.length < 2) return 0; const A = bigr(a), Bm = bigr(b); let n = 0; A.forEach((v, g) => { n += Math.min(v, Bm.get(g) || 0); }); return 2 * n / (a.length + b.length - 2); };
  const jac = (A, Bs) => { if (!A.size || !Bs.size) return 0; let n = 0; A.forEach(x => { if (Bs.has(x)) n++; }); return n / (A.size + Bs.size - n); };
  const DMCACHE = new Map();
  /* ket qua so khop ten tap chi voi Danh muc Bo KH&CN: lv = ok (dung ten) | near (gan dung, can sua ten) | no (khong thuoc danh muc) */
  const matchDM = j => {
    if (DMCACHE.has(j)) return DMCACHE.get(j);
    const raw = nkey(j); let res = { lv: 'no', name: '' };
    if (raw) {
      if (DMIDX.has(raw)) res = { lv: 'ok', name: DMKHCN[DMIDX.get(raw)][0] };
      else {
        const c = kclean(nkey(String(j).replace(/\([^)]*\)/g, ' ')));
        if (DMIDX.has(c)) res = { lv: 'near', name: DMKHCN[DMIDX.get(c)][0] };
        else {
          const D1 = dtok(c); let best = null, bs = 0;
          if (D1.size) DMIDX.forEach((i, k) => {
            const jj = jac(D1, dtok(k)); if (jj < 0.5) return;
            let sc = 0;
            if (k.length >= 12 && c.includes(k) && c.length - k.length <= 40) sc = 0.9 + k.length / 1000;
            else if (c.length >= 12 && k.includes(c) && k.length - c.length <= 20) sc = 0.88 + c.length / 1000;
            else { const d = dice(c, k); if (d >= 0.8) sc = d; }
            sc = sc ? sc + jj / 100 : 0;
            if (sc > bs) { bs = sc; best = i; }
          });
          if (best != null) res = { lv: 'near', name: DMKHCN[best][0] };
        }
      }
    }
    DMCACHE.set(j, res); return res;
  };

  /* ===== TAB THONG KE DU LIEU KHCN (bo loc nhieu truong) ===== */
  const khcnStatsTab = root => {
    if (!document.getElementById('t2kCss')) {
      const st = document.createElement('style'); st.id = 't2kCss';
      st.textContent = '#tlu2hemis .t2k-ms{position:relative;display:inline-block;margin:3px}#tlu2hemis .t2k-ms>button{padding:5px 9px;border:1px solid #bbb;border-radius:6px;background:#fff;cursor:pointer;font-size:13px;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#tlu2hemis .t2k-ms.on>button{background:#e8f0fb;border-color:#0b6bcb;color:#0b6bcb;font-weight:bold}#tlu2hemis .t2k-p{position:absolute;z-index:10;top:32px;left:0;background:#fff;border:1px solid #999;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.25);padding:6px;width:340px;max-height:340px;display:flex;flex-direction:column}#tlu2hemis .t2k-p .o{overflow:auto;flex:1;font-size:13px}#tlu2hemis .t2k-p label{display:block;padding:2px 4px;cursor:pointer}#tlu2hemis .t2k-p label:hover{background:#f0f4fa}#tlu2hemis .t2k-t{border-collapse:collapse;font-size:13px;width:100%}#tlu2hemis .t2k-t th,#tlu2hemis .t2k-t td{border:1px solid #ddd;padding:3px 6px;vertical-align:top}#tlu2hemis .t2k-t th{background:#eef3fb;position:sticky;top:0}#tlu2hemis .t2k-box{border:1px solid #dde3ee;border-radius:8px;padding:8px 10px;margin:8px 0;background:#fafcff}#tlu2hemis .t2k-sb{font-weight:bold;color:#0b6bcb;margin:4px 0}';
      document.head.appendChild(st);
    }
    const now = new Date();
    root.innerHTML = '<div class="t2k-box"><b>Dữ liệu cần thống kê:</b> từ ngày <input id="kF" value="01/01/' + (now.getFullYear() - 1) + '" style="width:110px;padding:3px"> đến ngày <input id="kT" value="31/12/' + now.getFullYear() + '" style="width:110px;padding:3px"> ' +
      '<button id="kLoad" style="' + B + ';background:#0b6bcb;color:#fff">Tải dữ liệu KHCN</button> <label><input type="checkbox" id="kFresh"> Tải lại toàn bộ chi tiết (bỏ dữ liệu đã lưu)</label>' +
      '<div style="margin-top:4px">Chọn nhanh (bấm là tải luôn): ' + [['Năm nay', 0], ['3 năm gần nhất', 2], ['5 năm gần nhất', 4], ['Từ 2021 đến nay', 2021]].map(q => '<button type="button" data-q="' + q[1] + '" style="padding:3px 10px;border:1px solid #0b6bcb;border-radius:6px;background:#fff;color:#0b6bcb;cursor:pointer;margin:2px">' + q[0] + '</button>').join('') + ' <span style="color:#888;font-size:12px">Lần đầu tải nhiều năm mất vài phút; các lần sau công cụ tự tải lại khoảng ngày cũ và nhanh hơn nhiều.</span></div>' +
      '<div id="kMsg" style="color:#0b6bcb;margin-top:4px"></div></div><div id="kMain"></div>';
    const msg = root.querySelector('#kMsg'), main = root.querySelector('#kMain');
    let A = [];
    const parseList = s => String(s || '').split(/[,;]\s*/).map(x => x.trim()).filter(Boolean).map(x => { const m = x.match(/^(.*?)\s*<([^>]+)>\s*$/); return m ? { n: m[1].trim(), u: m[2].trim() } : { n: x, u: '' }; });
    const lsGet = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
    const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
    const get = async (u, body) => { const h = await fetch(u, body ? { method: 'POST', body: new URLSearchParams(body), credentials: 'include' } : { credentials: 'include', cache: 'no-store' }).then(r => r.text()); if (/login_form/.test(h)) throw new Error('Phiên đăng nhập KHCN đã hết. Hãy đăng nhập lại rồi bấm nút bookmark.'); return new DOMParser().parseFromString(h, 'text/html'); };
    /* danh sach loai cong bo dung nhu o chon "Tat ca moi loai cong bo" tren KHCN */
    let LOAI = lsGet('T2K_LOAI');
    const pickLoai = doc => { const s = [...doc.querySelectorAll('select')].find(x => x.options.length > 3 && /loại công bố/i.test((x.options[0] || {}).text || '')); return s ? [...s.options].slice(1).map(o => o.text.trim()).filter(Boolean) : null; };
    const loadLoai = async () => { let L = pickLoai(document); if (!L) { for (const u of ['/', '/CongBo', '/CongBo/Index']) { try { L = pickLoai(await get(u)); } catch (e) {} if (L) break; } } if (L && L.length) { LOAI = L; lsSet('T2K_LOAI', L); } };
    const pool = async (items, n, fn) => { let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; await fn(items[k], k); } })); };
    const grpOf = (m, j, d, y) => {
      if (!m) return 'Không rõ loại';
      if (m.wos || (m.p === 2 && (m.tn === '03' || m.tn === '04'))) return 'WoS/Scopus';
      const after = d ? d > '2026-09-30' : false;
      if (y >= 2026 && m.p === 1 && j && matchDM(j).lv !== 'no') return 'Trong nước được tính';
      if (m.tn === '01' && !after) return 'Trong nước được tính';
      return 'Không được tính';
    };
    root.querySelector('#kLoad').onclick = async () => {
      const f = toISO(root.querySelector('#kF').value), t = toISO(root.querySelector('#kT').value);
      if (!f || !t) { msg.textContent = 'Ngày chưa đúng dạng ngày/tháng/năm'; return; }
      const fresh = root.querySelector('#kFresh').checked;
      lsSet('T2K_RANGE', [root.querySelector('#kF').value, root.querySelector('#kT').value]);
      try {
        msg.textContent = '1/4 Đang lấy danh sách bài báo...';
        const d = await get('/TrichXuatCongBo?from=' + f + '&target=' + t);
        const rows = [...d.querySelectorAll('table tr')].slice(1).map(r => [...r.children].map(c => c.innerText.trim().replace(/\s+/g, ' ')));
        await loadLoai();
        const xd = np => get('/CongBo/XuatDuLieu?page=1&currentFilter=&from=' + f + '&target=' + t + '&curprivate=false&loai=null&diachi=null&khoa=&nopoint=' + np);
        const titles = doc => new Set([...doc.querySelectorAll('table tr')].slice(1).map(r => norm(r.children[1] ? r.children[1].innerText : '')));
        msg.textContent = '2/4 Đang lấy trạng thái phê duyệt...';
        const all = await xd('null'), ap = titles(await xd('1')), cs = titles(await xd('2')), nc = titles(await xd('true'));
        const ids = {}; [...all.querySelectorAll('table tr')].slice(1).forEach(r => { const m = (r.getAttribute('ondblclick') || r.innerHTML).match(/ShowDeTails\('(\d+)'/); if (m && r.children[1]) ids[norm(r.children[1].innerText)] = m[1]; });
        let um = lsGet('T2K_USERMAP');
        if (fresh || !um || Date.now() - um.t > 7 * 864e5) {
          msg.textContent = '3/4 Đang lấy danh sách cán bộ theo bộ môn...';
          const dc = await get('/admin/Users/GetDiaChi', { searchdiachi: '' });
          const units = [...dc.querySelectorAll('tr')].slice(1).map(r => { const td = r.querySelectorAll('td'); const m = r.innerHTML.match(/EditDiaChi\/(\d+)/); return td.length > 2 && m ? { id: m[1], bm: td[1].innerText.trim(), khoa: td[2].innerText.trim() } : null; }).filter(Boolean);
          const map = {};
          await pool(units, 6, async un => { const x = await get('/admin/Users/GetUserInDiaChi?dc=' + un.id, { id: un.id }); [...x.querySelectorAll('tr')].slice(1).forEach(r => { const td = r.querySelectorAll('td'); if (td.length > 2) { const u = td[2].innerText.trim(); const low = k => /Ban Giám hiệu|Hội đồng Trường|Văn phòng Đảng|công đoàn|Đoàn thanh niên/i.test(k); if (u && (!map[u] || (low(map[u][1]) && !low(un.khoa)))) map[u] = [un.bm, un.khoa]; } }); });
          um = { t: Date.now(), map }; lsSet('T2K_USERMAP', um);
        }
        const det = (fresh ? null : lsGet('T2K_DETAIL')) || {};
        const need = [...new Set(Object.values(ids))].filter(id => !det[id]);
        let done = 0;
        await pool(need, 6, async id => {
          const x = await get('/CongBo/DetailsCongBo', { id });
          const dd = {}; x.querySelectorAll('dt').forEach(dt => { const v = dt.nextElementSibling; if (v && v.tagName === 'DD') dd[dt.innerText.trim()] = v.innerText.trim().replace(/\s+/g, ' '); });
          det[id] = { f: (x.getElementById('listchutri') || {}).innerText || dd['TG thứ nhất'] || '', c: (x.getElementById('chiutrachnhiem') || {}).innerText || dd['TG chịu trách nhiệm'] || '', o: (x.getElementById('listthamgia') || {}).innerText || dd['Đồng tác giả'] || '', hd: dd['Tên HĐCD'] || '', ht: dd['Loại hỗ trợ kinh phí'] || '', nxb: dd['Nhà xuất bản'] || '' };
          done++; if (done % 20 === 0) msg.textContent = '4/4 Đang lấy chi tiết tác giả: ' + done + '/' + need.length + ' bài...';
        });
        lsSet('T2K_DETAIL', det);
        const M = um.map, seen = new Set();
        A = rows.map(r => {
          const k = norm(r[5]); if (!r[5] || seen.has(k)) return null; seen.add(k);
          const id = ids[k] || '', D = det[id] || {}, m = MAP(r[7] || ''), di = toISO(r[11]), y = di ? +di.slice(0, 4) : 0;
          const firsts = parseList(D.f), corrs = parseList(D.c), cos = parseList(D.o);
          const key = a => a.u ? 'u:' + a.u.toLowerCase() : 'n:' + norm(a.n);
          const byK = new Map();
          const add = (a, role) => { const kk = key(a); if (!kk || kk === 'n:') return; let x = byK.get(kk); if (!x) { x = { n: a.n, u: a.u, first: false, corr: false }; byK.set(kk, x); } if (a.u && !x.u) x.u = a.u; if (role) x[role] = true; };
          parseList(r[1]).forEach(a => add(a)); firsts.forEach(a => add(a, 'first')); corrs.forEach(a => add(a, 'corr')); cos.forEach(a => add(a));
          const authors = [...byK.values()].map(a => { const mm = a.u ? M[a.u] || M[a.u.toLowerCase()] : null; return Object.assign(a, { tlu: !!a.u, bm: a.u ? (mm ? mm[0] : '(chưa rõ bộ môn)') : '', khoa: a.u ? (mm ? mm[1] : '(chưa rõ đơn vị)') : '' }); });
          return { id, t: r[5], j: r[6], l: r[7], q: r[8] && r[8] !== 'NONE' ? r[8] : 'Không có Q', iff: parseFloat(String(r[9]).replace(',', '.')) || 0, hdp: parseFloat(String(r[10]).replace(',', '.')) || 0, d: di, y, gio: r[12], tien: r[13], vol: r[14], iss: r[15], pg: r[16],
            st: ap.has(k) ? 'Đã phê duyệt' : (cs.has(k) ? 'Cần chỉnh sửa' : 'Chưa phê duyệt'), nc: nc.has(k) ? 'Không áp dụng tính' : 'Áp dụng tính', hd: D.hd || '(không ghi)', ht: D.ht || '(không ghi)', grp: grpOf(m, r[6], di, y), dm: m && m.p === 1 && !m.wos ? ({ ok: 'Đúng tên', near: 'Tên gần đúng', no: 'Không có trong danh mục' })[matchDM(r[6]).lv] : 'Không áp dụng (WoS/Scopus, kỷ yếu)', authors, nTlu: authors.filter(a => a.tlu).length, nAll: authors.length };
        }).filter(Boolean);
        msg.textContent = 'Đã tải ' + A.length + ' bài (' + need.length + ' bài lấy chi tiết mới, còn lại dùng dữ liệu đã lưu). Đơn vị của cán bộ lấy theo bộ môn hiện tại trên KHCN.';
        PV.yF = +f.slice(0, 4); PV.yT = +t.slice(0, 4);
        render();
      } catch (e) { msg.textContent = 'Lỗi: ' + e.message; }
    };

    /* ---- Bo loc ---- */
    const S = {};
    const msHtml = (id, label) => '<div class="t2k-ms" data-id="' + id + '"><button type="button">' + label + ': Tất cả ▾</button></div>';
    const uniq = (arr, f) => { const c = new Map(); arr.forEach(a => new Set([].concat(f(a)).map(String)).forEach(v => { if (v !== '' && v != null) c.set(v, (c.get(v) || 0) + 1); })); return [...c.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]), 'vi')); };
    const FIELDS = [
      ['y', 'Năm', a => a.y], ['l', 'Loại công bố', a => a.l], ['grp', 'Nhóm chỉ số (TT 83)', a => a.grp], ['q', 'Xếp hạng Q', a => a.q],
      ['st', 'Trạng thái duyệt', a => a.st], ['nc', 'Áp dụng tính', a => a.nc], ['dm', 'Danh mục Bộ KH&CN', a => a.dm],
      ['khoa', 'Khoa / đơn vị', a => a.authors.filter(x => x.tlu).map(x => x.khoa)], ['bm', 'Bộ môn', a => a.authors.filter(x => x.tlu).map(x => x.bm)],
      ['hd', 'Ngành HĐCD', a => a.hd], ['ht', 'Loại hỗ trợ kinh phí', a => a.ht], ['j', 'Tạp chí / hội nghị', a => a.j]
    ];
    const ROLES = [['any', 'Bất kỳ vai trò (như hệ thống KHCN)'], ['first', 'Tác giả thứ nhất'], ['corr', 'Tác giả liên hệ'], ['fc', 'Thứ nhất HOẶC liên hệ'], ['fandc', 'Thứ nhất VÀ liên hệ'], ['co', 'Chỉ đồng tác giả']];
    const roleOK = (a, r) => r === 'any' || (r === 'first' && a.first) || (r === 'corr' && a.corr) || (r === 'fc' && (a.first || a.corr)) || (r === 'fandc' && a.first && a.corr) || (r === 'co' && !a.first && !a.corr);
    /* ---- Bang tong hop nhieu chieu / nhieu tang (hang 3 cap x cot 2 cap x so lieu) ---- */
    const TPL0 = [
      { name: 'Tổng số bài' },
      { name: 'WoS/Scopus', sets: { grp: ['WoS/Scopus'] } },
      { name: 'WoS/Scopus Q1', sets: { grp: ['WoS/Scopus'], q: ['Q1'] } },
      { name: 'WoS/Scopus Q2', sets: { grp: ['WoS/Scopus'], q: ['Q2'] } },
      { name: 'WoS/Scopus Q3', sets: { grp: ['WoS/Scopus'], q: ['Q3'] } },
      { name: 'WoS/Scopus Q4', sets: { grp: ['WoS/Scopus'], q: ['Q4'] } },
      { name: 'Trong nước được tính', sets: { grp: ['Trong nước được tính'] } },
      { name: 'Có TG thứ nhất thuộc đơn vị', role: 'first' },
      { name: 'Có TG liên hệ thuộc đơn vị', role: 'corr' },
      { name: 'Có tác giả ngoài trường', ex: 'y' }
    ];
    const BUILTIN = { 'Bộ chỉ số WoS, Q, vai trò tác giả (mẫu có sẵn)': TPL0 };
    const B0 = Object.keys(BUILTIN)[0];
    const clone = o => JSON.parse(JSON.stringify(o));
    const tplAll = () => Object.assign({}, BUILTIN, lsGet('T2K_TPL') || {});
    const RL = Object.fromEntries(ROLES);
    const descSpec = s => {
      const p = [];
      Object.entries(s.sets || {}).forEach(([id, v]) => { if (v && v.length) { const F = FIELDS.find(f => f[0] === id); p.push((F ? F[1] : id) + ': ' + v.join(' / ')); } });
      if (s.lre) p.push('Loại có chữ: ' + s.lre); if (s.cb) p.push('Cán bộ: ' + s.cb); if (s.kw) p.push('Từ khoá: ' + s.kw);
      if (s.d1 || s.d2) p.push('Ngày: ' + (s.d1 || '…') + ' – ' + (s.d2 || '…')); if (s.iff) p.push('IF ≥ ' + s.iff); if (s.hp) p.push('Điểm HĐCD ≥ ' + s.hp);
      if (s.nt) p.push('Số TG trong trường: ' + s.nt); if (s.ex) p.push(s.ex === 'y' ? 'Có TG ngoài trường' : 'Không có TG ngoài trường');
      if (s.role && s.role !== 'any') p.push('Vai trò: ' + RL[s.role]);
      return p.join('; ') || 'Tất cả bài';
    };
    /* doc dieu kien dang chon o muc 1 */
    const curSpec = () => {
      const v = id => (main.querySelector(id) || { value: '' }).value.trim(), sp = {}, sets = {};
      FIELDS.forEach(f => { if (S[f[0]] && S[f[0]].size) sets[f[0]] = [...S[f[0]]]; });
      if (Object.keys(sets).length) sp.sets = sets;
      [['cb', '#kCB'], ['kw', '#kKW'], ['d1', '#kD1'], ['d2', '#kD2'], ['iff', '#kIF'], ['hp', '#kHP'], ['nt', '#kNT'], ['ex', '#kEX']].forEach(([k, id]) => { if (v(id)) sp[k] = v(id); });
      const r = (main.querySelector('input[name=kRole]:checked') || {}).value; if (r && r !== 'any') sp.role = r;
      return sp;
    };
    const comp = s => { s = s || {}; let re = null; try { re = s.lre ? new RegExp(s.lre, 'i') : null; } catch (e) {} return { name: s.name || '', sets: s.sets || {}, cbs: String(s.cb || '').split(',').map(x => norm(x)).filter(Boolean), kw: norm(s.kw || ''), d1: toISO(s.d1 || ''), d2: toISO(s.d2 || ''), iff: parseFloat(String(s.iff || '').replace(',', '.')) || 0, hp: parseFloat(String(s.hp || '').replace(',', '.')) || 0, nt: s.nt || '', ex: s.ex || '', role: s.role || 'any', re }; };
    const AUF = new Set(['khoa', 'bm']);
    const has = (c, id) => c.sets[id] && c.sets[id].length;
    const aOK = (x, c) => x.tlu && (!has(c, 'khoa') || c.sets.khoa.includes(x.khoa)) && (!has(c, 'bm') || c.sets.bm.includes(x.bm)) && (!c.cbs.length || c.cbs.some(q => norm(x.n).includes(q) || norm(x.u) === q)) && roleOK(x, c.role);
    const needA = c => has(c, 'khoa') || has(c, 'bm') || c.cbs.length || c.role !== 'any';
    const artOK = (a, c) => {
      for (const id in c.sets) { if (AUF.has(id) || !has(c, id)) continue; const F = FIELDS.find(f => f[0] === id); if (F && ![].concat(F[2](a)).map(String).some(x => c.sets[id].includes(x))) return false; }
      if (c.re && !c.re.test(a.l || '')) return false;
      if (c.kw && !norm(a.t + ' ' + a.j).includes(c.kw)) return false;
      if (c.d1 && (!a.d || a.d < c.d1)) return false; if (c.d2 && (!a.d || a.d > c.d2)) return false;
      if (c.iff && a.iff < c.iff) return false; if (c.hp && a.hdp < c.hp) return false;
      if (c.nt === '1' && a.nTlu !== 1) return false; if (c.nt === '2-3' && (a.nTlu < 2 || a.nTlu > 3)) return false; if (c.nt === '4+' && a.nTlu < 4) return false;
      if (c.ex) { const e = a.authors.some(x => !x.tlu); if (c.ex === 'y' && !e) return false; if (c.ex === 'n' && e) return false; }
      if (needA(c) && !a.authors.some(x => aOK(x, c))) return false;
      return true;
    };
    /* cac chieu: [id, ten, 1 = theo tac gia / 0 = theo bai / 2 = muc tu chon, ham lay gia tri] */
    const VT = ['TG thứ nhất', 'TG liên hệ', 'Đồng tác giả'];
    let LM = {};
    const DIMS = [
      ['khoa', 'Khoa / đơn vị', 1, (a, x) => [x.khoa]], ['bm', 'Bộ môn', 1, (a, x) => [x.bm]], ['cb', 'Cán bộ', 1, (a, x) => [x.n + (x.u ? ' <' + x.u + '>' : '')]],
      ['vt', 'Vai trò tác giả', 1, (a, x) => { const r = []; if (x.first) r.push(VT[0]); if (x.corr) r.push(VT[1]); if (!r.length) r.push(VT[2]); return r; }],
      ['y', 'Năm', 0, a => [String(a.y || '(không rõ)')]], ['l', 'Loại công bố', 0, a => [LM[norm(a.l)] || a.l || '(không rõ)']], ['grp', 'Nhóm chỉ số (TT 83)', 0, a => [a.grp]], ['q', 'Xếp hạng Q', 0, a => [a.q]],
      ['st', 'Trạng thái duyệt', 0, a => [a.st]], ['nc', 'Áp dụng tính', 0, a => [a.nc]], ['dm', 'Danh mục Bộ KH&CN', 0, a => [a.dm]], ['hd', 'Ngành HĐCD', 0, a => [a.hd]], ['ht', 'Loại hỗ trợ kinh phí', 0, a => [a.ht]], ['j', 'Tạp chí / hội nghị', 0, a => [a.j]],
      ['tpl', 'Mục tự chọn (mẫu)', 2, null]
    ];
    const DMf = id => DIMS.find(d => d[0] === id);
    const MS = [['n', 'Số bài'], ['gio', 'Giờ KH'], ['tien', 'Tiền hỗ trợ (đ)'], ['hdp', 'Điểm HĐCD'], ['ifa', 'IF trung bình']];
    const PVK = 'T2K_PV2';
    const PV = Object.assign({ rows: ['khoa'], cols: ['y', 'l'], ms: ['n'], tot: true, yF: 0, yT: 0, cm: 'whole', glob: true, sort: 'name', hz: false, tpl: B0, tc: clone(TPL0) }, lsGet(PVK) || {});
    const S1 = String.fromCharCode(31), S2 = String.fromCharCode(30), TOT = 'Tổng';
    const cart = arrs => arrs.reduce((acc, vs) => { const o = []; acc.forEach(p => vs.forEach(v => o.push(p.concat([v])))); return o; }, [[]]);
    let LR = null, CL = new Set(), CLsig = '';
    const pvRead = () => {
      const g = id => main.querySelector(id); if (!g('#pvR1')) return false;
      const uq = a => a.filter((v, i) => v && a.indexOf(v) === i);
      PV.rows = uq([g('#pvR1').value, g('#pvR2').value, g('#pvR3').value]); if (!PV.rows.length) PV.rows = ['khoa'];
      PV.cols = uq([g('#pvC1').value, g('#pvC2').value]).filter(v => !PV.rows.includes(v));
      PV.ms = MS.map(m => m[0]).filter(m => g('#pvMs_' + m).checked); if (!PV.ms.length) PV.ms = ['n'];
      PV.yF = +g('#pvYF').value || PV.yF; PV.yT = +g('#pvYT').value || PV.yT;
      PV.tot = g('#pvTot').checked; PV.cm = g('#pvM').value; PV.sort = g('#pvO').value; PV.glob = g('#pvG').checked; PV.hz = g('#pvHZ').checked;
      g('#pvTpl').style.display = PV.rows.concat(PV.cols).includes('tpl') ? '' : 'none';
      lsSet(PVK, PV); return true;
    };
    const pvCalc = () => {
      LM = {}; (LOAI || []).forEach(o => { LM[norm(o)] = o; });
      const G = comp(PV.glob ? curSpec() : {});
      const y0 = Math.min(PV.yF, PV.yT), y1 = Math.max(PV.yF, PV.yT);
      const base = A.filter(a => a.y >= y0 && a.y <= y1 && artOK(a, G));
      const tcs = (PV.tc || []).map(comp);
      const rD = PV.rows.map(DMf).filter(Boolean), cD = PV.cols.map(DMf).filter(Boolean);
      const au = rD.concat(cD).some(d => d[2] === 1);
      const val = (d, a, x) => d[2] === 2 ? tcs.filter(c => artOK(a, c) && (!x || !needA(c) || aOK(x, c))).map(c => c.name) : d[3](a, x);
      const M = new Map();
      const add = (k, w, a, ai) => { let c = M.get(k); if (!c) { c = { n: 0, gio: 0, tien: 0, hdp: 0, ifs: 0, ifn: 0, ids: [], last: -1 }; M.set(k, c); } c.n += w; c.gio += w * a.gioN; c.tien += w * a.tienN; c.hdp += w * a.hdp; if (a.iff > 0) { c.ifs += w * a.iff; c.ifn += w; } if (c.last !== ai) { c.ids.push(ai); c.last = ai; } };
      base.forEach((a, ai) => {
        if (a.gioN == null) { a.gioN = parseFloat(String(a.gio || '').replace(/\s/g, '').replace(',', '.')) || 0; a.tienN = +String(a.tien || '').replace(/[^\d]/g, '') || 0; }
        const units = au ? a.authors.filter(x => aOK(x, G)) : [null]; if (!units.length) return;
        const den = !au ? 0 : PV.cm === 'frT' ? a.nTlu : PV.cm === 'frA' ? a.nAll : 0;
        const done = new Set();
        units.forEach(x => {
          const rv = rD.map(d => val(d, a, x)), cv = cD.map(d => val(d, a, x));
          if (rv.some(v => !v.length) || cv.some(v => !v.length)) return;
          const rps = cart(rv); let cps = cart(cv);
          if (PV.tot && cD.length) cps = cps.concat(cart([[TOT]].concat(cv.slice(1))));
          const keys = new Set();
          rps.forEach(rp => { for (let k = 0; k <= rp.length; k++) { const pre = rp.slice(0, k).join(S1); cps.forEach(cp => keys.add(pre + S2 + cp.join(S1))); } });
          keys.forEach(k => { if (den) add(k, 1 / den, a, ai); else if (!done.has(k)) { done.add(k); add(k, 1, a, ai); } });
        });
      });
      const rows = new Map(), cvals = cD.map(() => new Set());
      M.forEach((c, k) => { const i = k.indexOf(S2), rk = k.slice(0, i), ck = k.slice(i + 1); if (!rows.has(rk)) rows.set(rk, rk ? rk.split(S1) : []); if (ck) ck.split(S1).forEach((v, j) => { if (v !== TOT) cvals[j].add(v); }); });
      const ord = (d, set) => { const id = d[0]; let o = [...set];
        if (id === 'l' && LOAI && LOAI.length) o = LOAI.concat(o.filter(v => !LOAI.includes(v)));
        else if (id === 'vt') o = VT.filter(v => set.has(v));
        else if (id === 'tpl') o = tcs.map(c => c.name).filter((v, i, s) => v && s.indexOf(v) === i);
        else o.sort((p, q) => String(p).localeCompare(String(q), 'vi', { numeric: true }));
        return o; };
      const lv = cD.map((d, i) => ord(d, cvals[i])); if (PV.tot && cD.length) lv[0] = lv[0].concat([TOT]);
      let leaves = cart(lv);
      if (PV.hz) leaves = leaves.filter(p => { const c = M.get(S2 + p.join(S1)); return c && c.n > 0; });
      const kids = new Map(); rows.forEach((p, rk) => { if (!p.length) return; const par = p.slice(0, -1).join(S1); if (!kids.has(par)) kids.set(par, []); kids.get(par).push(rk); });
      const tot = rk => { let s = 0; leaves.forEach(lp => { const c = M.get(rk + S2 + lp.join(S1)); if (c && lp[0] !== TOT) s += c.n; }); return s; };
      const flat = [];
      const walk = (par, lvl) => { const ks = kids.get(par) || []; const d = rD[lvl];
        if (PV.sort === 'total') { const t = new Map(ks.map(k => [k, tot(k)])); ks.sort((p, q) => t.get(q) - t.get(p)); }
        else { const o = ord(d, new Set(ks.map(k => rows.get(k)[lvl]))); ks.sort((p, q) => o.indexOf(rows.get(p)[lvl]) - o.indexOf(rows.get(q)[lvl])); }
        ks.forEach(k => { flat.push({ rk: k, p: rows.get(k), lvl, hk: kids.has(k) }); if (kids.has(k)) walk(k, lvl + 1); }); };
      walk('', 0);
      const sig = PV.rows.join('|');
      if (sig !== CLsig) { CLsig = sig; CL = new Set(rD.length >= 3 ? flat.filter(f => f.lvl === 1).map(f => f.rk) : []); }
      LR = { M, base, rD, cD, leaves, flat, au };
    };
    const mval = (m, c) => !c ? 0 : m === 'ifa' ? (c.ifn ? c.ifs / c.ifn : 0) : c[m];
    const fmtV = (m, v) => m === 'tien' ? Math.round(v).toLocaleString('vi-VN') : m === 'ifa' ? v.toFixed(3).replace('.', ',') : Number.isInteger(v) ? String(v) : (Math.round(v * 100) / 100).toString().replace('.', ',');
    const pvRender = () => {
      const out = main.querySelector('#pvOut'), info = main.querySelector('#pvInfo'); if (!LR) return;
      const { M, rD, cD, leaves, flat, au, base } = LR, ms = PV.ms, msN = MS.filter(m => ms.includes(m[0]));
      const cells = []; leaves.forEach((lp, li) => msN.forEach(m => cells.push({ lp, li, m: m[0], ml: m[1] })));
      const hR = cD.length + (msN.length > 1 || !cD.length ? 1 : 0);
      const th = (t, cs, rs, st) => '<th style="position:static;min-width:70px' + (st || '') + '"' + (cs > 1 ? ' colspan="' + cs + '"' : '') + (rs > 1 ? ' rowspan="' + rs + '"' : '') + '>' + esc(t) + '</th>';
      const rl = rD.map(d => d[1]).join(' → ');
      let h = '<table class="t2k-t" style="width:auto"><tr>' + th(rl, 1, hR, ';position:sticky;left:0;z-index:2;min-width:220px');
      const hdrL = [];
      for (let i = 0; i < cD.length; i++) {
        if (i) h += '<tr>';
        const lineT = [];
        for (let j = 0; j < cells.length;) { const key = cells[j].lp.slice(0, i + 1).join(S1); let k = j; while (k < cells.length && cells[k].lp.slice(0, i + 1).join(S1) === key) k++; h += th(cells[j].lp[i], k - j); lineT.push(cells[j].lp[i]); for (let z = j + 1; z < k; z++) lineT.push(''); j = k; }
        h += '</tr>'; hdrL.push(lineT);
      }
      if (msN.length > 1 || !cD.length) { if (cD.length) h += '<tr>'; h += cells.map(c => th(c.ml)).join('') + '</tr>'; hdrL.push(cells.map(c => c.ml)); }
      const lvN = Math.max(1, rD.length);
      const lines = hdrL.map((l, i) => (i === 0 ? rD.map(d => d[1]).concat(new Array(lvN - rD.length).fill('')) : new Array(lvN).fill('')).concat(l));
      const rowCells = rk => cells.map(c => mval(c.m, M.get(rk + S2 + c.lp.join(S1))));
      const vis = []; const hid = new Set();
      flat.forEach((f, fi) => { const par = f.p.slice(0, -1).join(S1); if (hid.has(par) || CL.has(par) && f.lvl > 0) { hid.add(f.rk); return; } vis.push(fi); });
      const body = [];
      const tdRow = (label, rk, fi, lvl, hk, open, isTot) => {
        const v = rowCells(rk);
        return '<tr' + (isTot ? ' style="font-weight:bold;background:#f3eefb"' : lvl < rD.length - 1 ? ' style="font-weight:bold;background:#fbf9ff"' : '') + '><td style="position:sticky;left:0;background:' + (isTot ? '#f3eefb' : '#fff') + ';padding-left:' + (6 + lvl * 18) + 'px;white-space:nowrap"' + (hk ? ' data-t="' + fi + '"' : '') + '>' + (hk ? '<span style="cursor:pointer;color:#6a3fb5">' + (open ? '▾' : '▸') + '</span> ' : '') + esc(label) + '</td>' +
          v.map((x, ci) => '<td data-r="' + fi + '" data-c="' + ci + '" style="text-align:right;cursor:pointer">' + (x ? fmtV(cells[ci].m, x) : '<span style="color:#ccc">0</span>') + '</td>').join('') + '</tr>';
      };
      vis.slice(0, 3000).forEach(fi => { const f = flat[fi]; body.push(tdRow(f.p[f.lvl], f.rk, fi, f.lvl, f.hk, !CL.has(f.rk), false)); });
      body.push(tdRow(au ? 'TOÀN TRƯỜNG (mỗi bài tính 1 lần)' : 'TỔNG (mỗi bài tính 1 lần)', '', -1, 0, false, false, true));
      out.innerHTML = h + body.join('') + '</table>' + (vis.length > 3000 ? '<div style="color:#c60">Chỉ hiện 3000 dòng đầu, bấm "Tải Excel" để lấy đủ.</div>' : '');
      flat.forEach(f => { const r = new Array(lvN).fill(''); r[f.lvl] = f.p[f.lvl]; for (let i = 0; i < f.lvl; i++) r[i] = f.p[i]; lines.push(r.concat(rowCells(f.rk).map((x, ci) => fmtV(cells[ci].m, x)))); });
      lines.push([au ? 'TOÀN TRƯỜNG (mỗi bài tính 1 lần)' : 'TỔNG (mỗi bài tính 1 lần)'].concat(new Array(lvN - 1).fill('')).concat(rowCells('').map((x, ci) => fmtV(cells[ci].m, x))));
      PVL = lines; LR.cells = cells;
      info.innerHTML = '<b>' + flat.length.toLocaleString('vi-VN') + ' dòng × ' + cells.length + ' cột = ' + (flat.length * cells.length).toLocaleString('vi-VN') + ' số liệu</b>, tính từ ' + base.length + ' bài (năm ' + Math.min(PV.yF, PV.yT) + '–' + Math.max(PV.yF, PV.yT) + '). Bấm vào một ô số để xem danh sách bài trong ô đó; bấm ▸ ▾ để mở/thu gọn.' +
        (PV.cols.includes('l') ? (LOAI && LOAI.length ? ' Cột loại công bố theo đúng ' + LOAI.length + ' loại trên KHCN.' : ' <span style="color:#c60">Chưa đọc được danh sách loại công bố của KHCN nên chỉ hiện loại có bài.</span>') : '') +
        (au && PV.cm === 'whole' ? ' <span style="color:#888">Bài có tác giả ở nhiều đơn vị được tính cho mỗi đơn vị, nên cộng các dòng con có thể lớn hơn dòng cha.</span>' : '') + (PV.glob && Object.keys(curSpec()).length ? ' <span style="color:#c60">Đang áp dụng thêm bộ lọc ở mục 1.</span>' : '');
    };
    let PVL = [];
    const pv = () => { if (!pvRead()) return; pvCalc(); pvRender(); };
    const pvHtml = () => {
      const sb = 'padding:4px 10px;border:1px solid #6a3fb5;border-radius:6px;background:#fff;color:#6a3fb5;cursor:pointer;margin:2px;font-weight:bold;font-size:13px';
      const sel = (id, none) => '<select id="' + id + '" style="padding:3px">' + (none ? '<option value="">(không)</option>' : '') + DIMS.map(d => '<option value="' + d[0] + '">' + d[1] + '</option>').join('') + '</select>';
      const P = [[1, 'Khoa × (Năm → 14 loại công bố)'], [2, 'Khoa → Bộ môn × (Năm → 14 loại)'], [3, 'Khoa → Bộ môn → Cán bộ × Năm'], [4, 'Khoa × (Năm → Vai trò tác giả)'], [5, 'Khoa × (Năm → Q)'], [6, '14 loại công bố × Năm'], [7, 'Khoa × Năm: số bài, giờ KH, tiền']];
      return '<div class="t2k-box" style="border-color:#c9b8ea;background:#fbf9ff"><div class="t2k-sb" style="color:#6a3fb5">2. Bảng tổng hợp nhiều tầng: xem toàn bộ số liệu trong 1 bảng</div>' +
        '<div>Mẫu nhanh (1 lần bấm): ' + P.map((p, i) => '<button type="button" data-pre="' + p[0] + '" style="' + sb + (i ? '' : ';background:#6a3fb5;color:#fff') + '">' + p[1] + '</button>').join('') + '</div>' +
        '<div style="margin-top:6px"><b>Hàng:</b> ' + sel('pvR1') + ' → ' + sel('pvR2', 1) + ' → ' + sel('pvR3', 1) + ' &nbsp; <b>Cột:</b> ' + sel('pvC1', 1) + ' → ' + sel('pvC2', 1) + ' <label><input type="checkbox" id="pvTot"> Thêm cột Tổng</label></div>' +
        '<div style="margin-top:4px"><b>Số liệu trong ô:</b> ' + MS.map(m => '<label style="margin-right:8px"><input type="checkbox" id="pvMs_' + m[0] + '"> ' + m[1] + '</label>').join('') + ' · <b>Năm</b> từ <select id="pvYF"></select> đến <select id="pvYT"></select></div>' +
        '<div style="margin-top:4px">Cách tính: <select id="pvM" style="padding:3px"><option value="whole">Mỗi đơn vị có tác giả tính 1 bài (như KHCN)</option><option value="frT">Chia đều theo tác giả trong trường</option><option value="frA">Chia đều theo tổng số tác giả</option></select> · ' +
        'Xếp dòng: <select id="pvO" style="padding:3px"><option value="name">Theo tên / thứ tự KHCN</option><option value="total">Nhiều bài trước</option></select> · <label><input type="checkbox" id="pvHZ"> Ẩn cột toàn số 0</label> · <label><input type="checkbox" id="pvG"> Áp dụng thêm bộ lọc ở mục 1</label></div>' +
        '<div id="pvTpl" style="margin-top:6px;border-top:1px dashed #c9b8ea;padding-top:6px">Mục tự chọn – mẫu: <select id="pvTS" style="padding:3px;max-width:320px"></select> <button type="button" id="pvSave" style="' + sb + '">Lưu mẫu</button><button type="button" id="pvDel" style="' + sb + '">Xoá mẫu</button><button type="button" id="pvExp" style="' + sb + '">Gửi mẫu cho đồng nghiệp</button><button type="button" id="pvImp" style="' + sb + '">Nhận mẫu</button>' +
        '<div id="pvChips" style="margin:4px 0"></div><button type="button" id="pvAdd" style="' + sb + ';background:#6a3fb5;color:#fff">＋ Thêm mục = điều kiện đang chọn ở mục 1</button> <span style="color:#888;font-size:12px">Chọn điều kiện ở mục 1 → bấm nút này → đặt tên. Bấm tên mục để đổi tên, ◀ ▶ đổi chỗ, ✕ bỏ.</span></div>' +
        '<div style="margin-top:6px"><button type="button" id="pvCopy" style="' + B + ';background:#6a3fb5;color:#fff">Sao chép bảng (dán thẳng vào Excel)</button><button type="button" id="pvCsv" style="' + B + ';background:#eee">Tải Excel</button><button type="button" id="pvOpen" style="' + sb + '">Mở hết các dòng</button><button type="button" id="pvFold" style="' + sb + '">Thu gọn về cấp 1</button> <span id="pvMsg" style="color:#1a8f3c;font-weight:bold"></span></div>' +
        '<div id="pvInfo" style="margin:4px 0;font-size:13px"></div><div id="pvOut" style="max-height:600px;overflow:auto"></div><div id="pvDrill"></div></div>';
    };
    const pvInit = () => {
      const g = id => main.querySelector(id);
      const ys = [...new Set(A.map(a => a.y).filter(Boolean))].sort((a, b) => a - b);
      const y0 = ys[0] || new Date().getFullYear(), y1 = ys[ys.length - 1] || y0;
      if (!PV.yF || PV.yF < y0 || PV.yF > y1) PV.yF = y0; if (!PV.yT || PV.yT > y1 || PV.yT < y0) PV.yT = y1;
      const yo = v => (ys.length ? ys : [y0]).map(y => '<option' + (y === v ? ' selected' : '') + '>' + y + '</option>').join('');
      g('#pvYF').innerHTML = yo(PV.yF); g('#pvYT').innerHTML = yo(PV.yT);
      ['pvR1', 'pvR2', 'pvR3'].forEach((id, i) => { g('#' + id).value = PV.rows[i] || ''; }); ['pvC1', 'pvC2'].forEach((id, i) => { g('#' + id).value = PV.cols[i] || ''; });
      MS.forEach(m => { g('#pvMs_' + m[0]).checked = PV.ms.includes(m[0]); });
      g('#pvTot').checked = PV.tot; g('#pvM').value = PV.cm; g('#pvO').value = PV.sort; g('#pvG').checked = PV.glob; g('#pvHZ').checked = PV.hz;
      const tplSel = () => { const T = tplAll(); g('#pvTS').innerHTML = Object.keys(T).map(n => '<option' + (n === PV.tpl ? ' selected' : '') + '>' + esc(n) + '</option>').join('') + (T[PV.tpl] ? '' : '<option selected>' + esc(PV.tpl || '(chưa lưu)') + '</option>'); };
      const chips = () => { g('#pvChips').innerHTML = (PV.tc || []).map((c, i) => '<span style="display:inline-block;border:1px solid #c9b8ea;background:#f3eefb;border-radius:12px;padding:2px 8px;margin:2px;font-size:12px" title="' + esc(descSpec(c)) + '"><b>' + (i + 1) + '.</b> <span data-k="ren" data-i="' + i + '" style="cursor:pointer;text-decoration:underline dotted">' + esc(c.name) + '</span> <span data-k="l" data-i="' + i + '" style="cursor:pointer;color:#888">◀</span><span data-k="r" data-i="' + i + '" style="cursor:pointer;color:#888">▶</span> <span data-k="x" data-i="' + i + '" style="cursor:pointer;color:#c00">✕</span></span>').join('') || '<span style="color:#888">Chưa có mục nào.</span>'; };
      const changed = () => { if (PV.tpl && !/ \(đã sửa\)$/.test(PV.tpl)) PV.tpl += ' (đã sửa)'; tplSel(); chips(); pv(); };
      tplSel(); chips();
      g('#pvChips').onclick = e => {
        const t = e.target.closest('[data-k]'); if (!t) return; const i = +t.dataset.i, k = t.dataset.k, C = PV.tc = (PV.tc || []).slice();
        if (k === 'x') C.splice(i, 1); else if (k === 'l') { if (!i) return; [C[i - 1], C[i]] = [C[i], C[i - 1]]; } else if (k === 'r') { if (i >= C.length - 1) return; [C[i + 1], C[i]] = [C[i], C[i + 1]]; }
        else if (k === 'ren') { const n = prompt('Tên mục:', C[i].name); if (!n) return; C[i] = Object.assign({}, C[i], { name: n }); }
        changed();
      };
      g('#pvTS').onchange = e => { const T = tplAll(), n = e.target.value; if (T[n]) { PV.tpl = n; PV.tc = clone(T[n]); } chips(); };
      g('#pvSave').onclick = () => { const n = prompt('Đặt tên mẫu (lưu trên máy này):', String(PV.tpl || '').replace(/ \(đã sửa\)$/, '').replace(/ \(mẫu có sẵn\)$/, ' – của tôi')); if (!n) return; if (BUILTIN[n]) { alert('Trùng tên mẫu có sẵn, hãy đặt tên khác.'); return; } const T = lsGet('T2K_TPL') || {}; T[n] = PV.tc; lsSet('T2K_TPL', T); PV.tpl = n; tplSel(); pv(); g('#pvMsg').textContent = '✓ Đã lưu mẫu "' + n + '"'; };
      g('#pvDel').onclick = () => { const T = lsGet('T2K_TPL') || {}; if (!T[PV.tpl]) { alert('Chỉ xoá được mẫu do mình lưu.'); return; } if (!confirm('Xoá mẫu "' + PV.tpl + '"?')) return; delete T[PV.tpl]; lsSet('T2K_TPL', T); PV.tpl = B0; PV.tc = clone(TPL0); tplSel(); chips(); pv(); };
      g('#pvExp').onclick = async () => { const s = 'T2KMAU:' + JSON.stringify({ n: String(PV.tpl || 'Mẫu').replace(/ \(đã sửa\)$/, ''), c: PV.tc }); try { await navigator.clipboard.writeText(s); g('#pvMsg').textContent = '✓ Đã sao chép mẫu. Dán (Ctrl+V) vào Zalo/email gửi đồng nghiệp; người nhận bấm "Nhận mẫu" rồi dán vào.'; } catch (e) { prompt('Sao chép đoạn này gửi đồng nghiệp:', s); } };
      g('#pvImp').onclick = () => { const s = prompt('Dán mẫu nhận được (bắt đầu bằng T2KMAU:)'); if (!s) return; try { const o = JSON.parse(s.trim().replace(/^T2KMAU:/, '')); if (!Array.isArray(o.c)) throw 0; const T = lsGet('T2K_TPL') || {}; let n = o.n || 'Mẫu nhận được'; if (BUILTIN[n]) n += ' (nhận)'; T[n] = o.c; lsSet('T2K_TPL', T); PV.tpl = n; PV.tc = o.c; tplSel(); chips(); pv(); g('#pvMsg').textContent = '✓ Đã nhận mẫu "' + n + '"'; } catch (e) { alert('Mẫu không đúng định dạng.'); } };
      g('#pvAdd').onclick = () => { const sp = curSpec(), d = descSpec(sp); const n = prompt('Tên mục mới.\nĐiều kiện: ' + d, d.length > 70 ? '' : d); if (!n) return; sp.name = n; PV.tc = (PV.tc || []).concat([sp]); if (!PV.rows.concat(PV.cols).includes('tpl')) { PV.cols = ['y', 'tpl']; g('#pvC1').value = 'y'; g('#pvC2').value = 'tpl'; } g('#kReset').click(); changed(); };
      g('#pvCopy').onclick = async () => { const t = PVL.map(l => l.map(c => String(c == null ? '' : c).replace(/[\t\r\n]+/g, ' ')).join('\t')).join('\r\n'); try { await navigator.clipboard.writeText(t); g('#pvMsg').textContent = '✓ Đã sao chép ' + PVL.length + ' dòng. Mở Excel → bấm ô A1 → Ctrl+V.'; } catch (e) { alert('Trình duyệt chặn sao chép, hãy bấm "Tải Excel".'); } };
      g('#pvCsv').onclick = () => dl('Bảng tổng hợp KHCN', PVL);
      g('#pvOpen').onclick = () => { CL = new Set(); pvRender(); };
      g('#pvFold').onclick = () => { if (LR) CL = new Set(LR.flat.filter(f => f.lvl === 0 && f.hk).map(f => f.rk)); pvRender(); };
      g('#pvOut').onclick = e => {
        const t = e.target.closest('[data-t]'); if (t && LR) { const f = LR.flat[+t.dataset.t]; if (CL.has(f.rk)) CL.delete(f.rk); else CL.add(f.rk); pvRender(); return; }
        const c = e.target.closest('td[data-c]'); if (!c || !LR || !LR.cells) return;
        const fi = +c.dataset.r, cell = LR.cells[+c.dataset.c], f = fi >= 0 ? LR.flat[fi] : null, rk = f ? f.rk : '';
        const x = LR.M.get(rk + S2 + cell.lp.join(S1)); const L = x ? x.ids.map(i => LR.base[i]) : [];
        const title = (f ? f.p.join(' → ') : 'Toàn trường') + (cell.lp.length ? ' · ' + cell.lp.join(' · ') : '');
        const rowsD = [['Tên bài', 'Tạp chí / hội nghị', 'Loại công bố', 'Q', 'Ngày', 'Tác giả', 'Giờ KH', 'Tiền hỗ trợ', 'Trạng thái']].concat(L.map(a => [a.t, a.j, a.l, a.q, a.d ? a.d.split('-').reverse().join('/') : '', a.authors.map(z => z.n + (z.first ? '¹' : '') + (z.corr ? '✉' : '') + (z.tlu ? ' (' + z.khoa + ')' : '')).join(', '), a.gio, a.tien, a.st]));
        const D = g('#pvDrill');
        D.innerHTML = '<div class="t2k-box"><div class="t2k-sb" style="color:#6a3fb5">Bài trong ô: ' + esc(title) + ' – ' + L.length + ' bài <button type="button" id="pvDcsv" style="' + B + ';background:#eee">Tải Excel</button><button type="button" id="pvDx" style="' + B + ';background:#eee">Đóng</button></div><div style="max-height:360px;overflow:auto"><table class="t2k-t"><tr>' + rowsD[0].map(z => '<th>' + esc(z) + '</th>').join('') + '</tr>' + rowsD.slice(1, 501).map(r => '<tr>' + r.map(z => '<td>' + esc(z) + '</td>').join('') + '</tr>').join('') + '</table></div></div>';
        D.querySelector('#pvDcsv').onclick = () => dl('Bài trong ô ' + title.slice(0, 60), rowsD);
        D.querySelector('#pvDx').onclick = () => { D.innerHTML = ''; };
        D.scrollIntoView({ block: 'nearest' });
      };
      const PRE = { 1: { rows: ['khoa'], cols: ['y', 'l'] }, 2: { rows: ['khoa', 'bm'], cols: ['y', 'l'] }, 3: { rows: ['khoa', 'bm', 'cb'], cols: ['y'] }, 4: { rows: ['khoa'], cols: ['y', 'vt'] }, 5: { rows: ['khoa'], cols: ['y', 'q'] }, 6: { rows: ['l'], cols: ['y'] }, 7: { rows: ['khoa'], cols: ['y'], ms: ['n', 'gio', 'tien'] } };
      main.querySelectorAll('[data-pre]').forEach(b => b.onclick = () => { Object.assign(PV, clone(PRE[b.dataset.pre]), { tot: true }); pvInit(); pv(); g('#pvOut').scrollIntoView({ block: 'nearest' }); });
    };
    const render = () => {
      main.innerHTML = '<div class="t2k-box"><div class="t2k-sb">1. Lọc bài báo (chọn nhiều trường cùng lúc; trong một trường chọn nhiều giá trị = HOẶC, giữa các trường = VÀ)</div>' +
        FIELDS.map(f => msHtml(f[0], f[1])).join('') +
        '<div style="margin-top:6px">Cán bộ (tên hoặc tài khoản, cách nhau dấu phẩy): <input id="kCB" style="width:260px;padding:3px"> Từ khoá trong tên bài/tạp chí: <input id="kKW" style="width:200px;padding:3px"></div>' +
        '<div style="margin-top:6px">Ngày công bố từ <input id="kD1" placeholder="dd/mm/yyyy" style="width:100px;padding:3px"> đến <input id="kD2" placeholder="dd/mm/yyyy" style="width:100px;padding:3px"> · IF ≥ <input id="kIF" style="width:50px;padding:3px"> · Điểm HĐCD ≥ <input id="kHP" style="width:50px;padding:3px"> · Số tác giả trong trường: <select id="kNT"><option value="">Tất cả</option><option value="1">1 người</option><option value="2-3">2–3 người</option><option value="4+">từ 4 người</option></select> · Có tác giả ngoài trường: <select id="kEX"><option value="">Tất cả</option><option value="y">Có</option><option value="n">Không</option></select></div>' +
        '<div style="margin-top:8px"><b>Vai trò của tác giả thuộc khoa/bộ môn/cán bộ đã chọn:</b> ' + ROLES.map((r, i) => '<label style="margin-right:10px"><input type="radio" name="kRole" value="' + r[0] + '"' + (i ? '' : ' checked') + '> ' + r[1] + '</label>').join('') + '</div>' +
        '<div style="color:#888;font-size:12px">Ví dụ: chọn Khoa Cơ khí + "Tác giả liên hệ" = các bài có tác giả liên hệ thuộc Khoa Cơ khí. Không chọn khoa nào + "Tác giả thứ nhất" = các bài có tác giả thứ nhất là người của Trường.</div>' +
        '<button id="kReset" style="' + B + ';background:#eee">Xoá hết bộ lọc</button></div>' + pvHtml() +
        '<div class="t2k-box"><div class="t2k-sb">3. Bảng thống kê một chiều</div>Nhóm theo: <select id="kGB" style="padding:3px"><option value="khoa">Khoa / đơn vị</option><option value="bm">Bộ môn</option><option value="cb">Cán bộ</option><option value="l">Loại công bố</option><option value="grp">Nhóm chỉ số</option><option value="y">Năm</option><option value="j">Tạp chí</option><option value="q">Xếp hạng Q</option><option value="hd">Ngành HĐCD</option><option value="st">Trạng thái duyệt</option></select> ' +
        'Cách tính khi nhóm theo khoa/bộ môn/cán bộ: <select id="kCM" style="padding:3px"><option value="whole">Mỗi đơn vị có tác giả được tính 1 bài (như hệ thống KHCN)</option><option value="frT">Chia đều theo số tác giả trong trường</option><option value="frA">Chia đều theo tổng số tác giả (kể cả ngoài trường)</option></select> ' +
        '<button id="kCsv1" style="' + B + ';background:#eee">Tải bảng thống kê (Excel)</button><button id="kCsv2" style="' + B + ';background:#eee">Tải danh sách bài (Excel)</button>' +
        '<div id="kSum" style="margin:6px 0;font-weight:bold"></div><div style="max-height:420px;overflow:auto"><table class="t2k-t" id="kTab"></table></div></div>' +
        '<div class="t2k-box"><div class="t2k-sb">4. Danh sách bài báo sau khi lọc</div><div style="color:#888;font-size:12px">¹ = tác giả thứ nhất · ✉ = tác giả liên hệ · chữ xám = tác giả ngoài trường hoặc không có tài khoản KHCN</div><div style="max-height:520px;overflow:auto"><table class="t2k-t" id="kList"></table></div></div>';
      FIELDS.forEach(f => { S[f[0]] = new Set(); });
      main.querySelectorAll('.t2k-ms').forEach(w => {
        const id = w.dataset.id, F = FIELDS.find(f => f[0] === id), btn = w.querySelector('button');
        btn.onclick = e => {
          e.stopPropagation();
          const open = w.querySelector('.t2k-p'); main.querySelectorAll('.t2k-p').forEach(p => p.remove()); if (open) return;
          const opts = uniq(A, F[2]);
          const p = document.createElement('div'); p.className = 't2k-p';
          p.innerHTML = '<input placeholder="Tìm..." style="padding:4px;margin-bottom:4px"><div class="o">' + opts.map(([v, c]) => '<label><input type="checkbox" value="' + esc(v) + '"' + (S[id].has(String(v)) ? ' checked' : '') + '> ' + esc(v) + ' <span style="color:#888">(' + c + ')</span></label>').join('') + '</div><div style="margin-top:4px"><button type="button" data-a="all">Chọn hết</button> <button type="button" data-a="none">Bỏ chọn</button> <button type="button" data-a="ok" style="float:right">Xong</button></div>';
          p.onclick = ev => ev.stopPropagation();
          p.querySelector('input').oninput = ev => { const q = norm(ev.target.value); p.querySelectorAll('.o label').forEach(l => { l.style.display = norm(l.textContent).includes(q) ? '' : 'none'; }); };
          p.addEventListener('change', ev => { if (ev.target.type === 'checkbox') { ev.target.checked ? S[id].add(ev.target.value) : S[id].delete(ev.target.value); upd(); } });
          p.querySelectorAll('button[data-a]').forEach(b => b.onclick = () => { const a = b.dataset.a; if (a === 'ok') { p.remove(); return; } p.querySelectorAll('.o label').forEach(l => { if (l.style.display === 'none') return; const c = l.querySelector('input'); c.checked = a === 'all'; c.checked ? S[id].add(c.value) : S[id].delete(c.value); }); upd(); });
          w.appendChild(p);
        };
      });
      document.addEventListener('click', () => main.querySelectorAll('.t2k-p').forEach(p => p.remove()));
      main.addEventListener('input', e => { if (e.target.closest('.t2k-p')) return; upd(); });
      main.addEventListener('change', e => { if (e.target.closest('.t2k-p')) return; upd(); });
      main.querySelector('#kReset').onclick = () => { FIELDS.forEach(f => S[f[0]].clear()); main.querySelectorAll('#kCB,#kKW,#kD1,#kD2,#kIF,#kHP').forEach(i => i.value = ''); main.querySelector('#kNT').value = ''; main.querySelector('#kEX').value = ''; main.querySelector('input[name=kRole][value=any]').checked = true; upd(); };
      main.querySelector('#kCsv1').onclick = () => dl('Thống kê KHCN', LAST.tab);
      main.querySelector('#kCsv2').onclick = () => dl('Danh sách bài báo KHCN', LAST.list);
      pvInit();
      upd();
    };
    let LAST = { tab: [], list: [] };
    const dl = (name, lines) => { const q = s => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"'; const csv = String.fromCharCode(65279) + lines.map(l => l.map(q).join(',')).join('\r\n'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = name + ' ' + new Date().toISOString().slice(0, 10) + '.csv'; document.body.appendChild(a); a.click(); a.remove(); };
    const upd = () => {
      const v = id => main.querySelector(id).value.trim();
      main.querySelectorAll('.t2k-ms').forEach(w => { const id = w.dataset.id, F = FIELDS.find(f => f[0] === id), n = S[id].size; w.classList.toggle('on', n > 0); w.querySelector('button').textContent = F[1] + ': ' + (n ? (n === 1 ? [...S[id]][0] : n + ' mục') : 'Tất cả') + ' ▾'; });
      const role = (main.querySelector('input[name=kRole]:checked') || {}).value || 'any';
      const cbs = v('#kCB').split(',').map(s => norm(s)).filter(Boolean), kw = norm(v('#kKW'));
      const d1 = toISO(v('#kD1')), d2 = toISO(v('#kD2')), iff = parseFloat(v('#kIF').replace(',', '.')) || 0, hp = parseFloat(v('#kHP').replace(',', '.')) || 0, nt = v('#kNT'), ex = v('#kEX');
      const unitSel = S.khoa.size || S.bm.size || cbs.length;
      const authorOK = a => a.tlu && (!S.khoa.size || S.khoa.has(a.khoa)) && (!S.bm.size || S.bm.has(a.bm)) && (!cbs.length || cbs.some(c => norm(a.n).includes(c) || norm(a.u) === c)) && roleOK(a, role);
      const simple = ['y', 'l', 'grp', 'q', 'st', 'nc', 'dm', 'hd', 'ht', 'j'].filter(id => S[id].size).map(id => [id, FIELDS.find(f => f[0] === id)[2]]);
      const L = A.filter(a => {
        for (const [id, fn] of simple) { if (!S[id].has(String(fn(a)))) return false; }
        if (kw && !norm(a.t + ' ' + a.j).includes(kw)) return false;
        if (d1 && (!a.d || a.d < d1)) return false; if (d2 && (!a.d || a.d > d2)) return false;
        if (iff && a.iff < iff) return false; if (hp && a.hdp < hp) return false;
        if (nt === '1' && a.nTlu !== 1) return false; if (nt === '2-3' && (a.nTlu < 2 || a.nTlu > 3)) return false; if (nt === '4+' && a.nTlu < 4) return false;
        const ext = a.authors.some(x => !x.tlu); if (ex === 'y' && !ext) return false; if (ex === 'n' && ext) return false;
        if ((unitSel || role !== 'any') && !a.authors.some(authorOK)) return false;
        return true;
      });
      const gb = v('#kGB'), cm = v('#kCM');
      const COLS = ['WoS/Scopus', 'Trong nước được tính', 'Không được tính', 'Không rõ loại'];
      const T = new Map();
      const addT = (key, a, w) => { let r = T.get(key); if (!r) { r = { tot: 0, c: {}, q: {} }; T.set(key, r); } r.tot += w; r.c[a.grp] = (r.c[a.grp] || 0) + w; if (a.grp === 'WoS/Scopus' && /^Q\d/.test(a.q)) r.q[a.q] = (r.q[a.q] || 0) + w; };
      L.forEach(a => {
        if (gb === 'khoa' || gb === 'bm' || gb === 'cb') {
          const kf = x => gb === 'khoa' ? x.khoa : gb === 'bm' ? x.bm + ' (' + x.khoa + ')' : x.n + (x.u ? ' <' + x.u + '>' : '') + ' – ' + x.khoa;
          const qual = a.authors.filter(authorOK);
          if (cm === 'whole') new Set(qual.map(kf)).forEach(k => addT(k, a, 1));
          else {
            const den = cm === 'frT' ? a.authors.filter(x => x.tlu && roleOK(x, role)).length : a.authors.filter(x => roleOK(x, role)).length;
            if (den) qual.forEach(x => addT(kf(x), a, 1 / den));
          }
        } else addT(String(FIELDS.find(f => f[0] === gb) ? FIELDS.find(f => f[0] === gb)[2](a) : ''), a, 1);
      });
      const f2 = n => Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ',');
      const rowsT = [...T.entries()].sort((x, y) => y[1].tot - x[1].tot);
      const hdr = [main.querySelector('#kGB').selectedOptions[0].text, 'Tổng', 'WoS/Scopus', 'trong đó Q1', 'Q2', 'Q3', 'Q4', 'Trong nước được tính', 'Không được tính'];
      const tab = [hdr].concat(rowsT.map(([k, r]) => [k, r.tot, r.c['WoS/Scopus'] || 0, r.q.Q1 || 0, r.q.Q2 || 0, r.q.Q3 || 0, r.q.Q4 || 0, r.c['Trong nước được tính'] || 0, (r.c['Không được tính'] || 0) + (r.c['Không rõ loại'] || 0)]));
      main.querySelector('#kTab').innerHTML = '<tr>' + hdr.map(h => '<th>' + esc(h) + '</th>').join('') + '</tr>' + tab.slice(1).map(r => '<tr>' + r.map((c, i) => '<td' + (i ? ' style="text-align:right"' : '') + '>' + esc(i ? f2(c) : c) + '</td>').join('') + '</tr>').join('');
      const sumUnits = rowsT.reduce((s, r) => s + r[1].tot, 0);
      main.querySelector('#kSum').innerHTML = 'Số bài sau khi lọc (không trùng): <span style="color:#0b6bcb">' + L.length + '</span> · WoS/Scopus: ' + L.filter(a => a.grp === 'WoS/Scopus').length + ' · Trong nước được tính: ' + L.filter(a => a.grp === 'Trong nước được tính').length +
        ((gb === 'khoa' || gb === 'bm' || gb === 'cb') && cm === 'whole' && sumUnits > L.length ? '<div style="font-weight:normal;color:#c60">Cộng các dòng = ' + f2(sumUnits) + ' > ' + L.length + ' vì một bài có tác giả ở nhiều đơn vị được tính cho mỗi đơn vị.</div>' : '');
      const au = a => a.authors.map(x => x.tlu ? '<span title="' + esc(x.bm + ' – ' + x.khoa) + '">' + esc(x.n) + (x.first ? '¹' : '') + (x.corr ? '✉' : '') + ' <span style="color:#6a3fb5">(' + esc(x.khoa) + ')</span></span>' : '<span style="color:#999">' + esc(x.n) + (x.first ? '¹' : '') + (x.corr ? '✉' : '') + '</span>').join(', ');
      main.querySelector('#kList').innerHTML = '<tr><th>#</th><th>Tên bài</th><th>Tạp chí / hội nghị</th><th>Loại</th><th>Nhóm</th><th>Q</th><th>Ngày</th><th>Tác giả</th><th>Trạng thái</th></tr>' +
        L.slice(0, 400).map((a, i) => '<tr><td>' + (i + 1) + '</td><td>' + esc(a.t) + '</td><td>' + esc(a.j) + '</td><td>' + esc(a.l) + '</td><td>' + esc(a.grp) + '</td><td>' + esc(a.q) + '</td><td style="white-space:nowrap">' + esc(a.d ? a.d.split('-').reverse().join('/') : '') + '</td><td>' + au(a) + '</td><td>' + esc(a.st) + '</td></tr>').join('') +
        (L.length > 400 ? '<tr><td colspan="9" style="color:#888">Chỉ hiện 400 bài đầu. Bấm "Tải danh sách bài" để lấy đủ ' + L.length + ' bài.</td></tr>' : '');
      const nm = x => x.n + (x.first ? ' [TG thứ nhất]' : '') + (x.corr ? ' [TG liên hệ]' : '') + (x.tlu ? ' (' + x.bm + ' – ' + x.khoa + ')' : ' (ngoài trường)');
      LAST = { tab, list: [['Tên bài', 'Tạp chí / hội nghị', 'Loại công bố', 'Nhóm chỉ số', 'Q', 'IF', 'Điểm HĐCD', 'Ngành HĐCD', 'Ngày công bố', 'Tập', 'Kỳ', 'Trang', 'Tác giả', 'Khoa có tác giả', 'Trạng thái', 'Áp dụng tính', 'Danh mục Bộ KH&CN', 'Loại hỗ trợ kinh phí', 'Giờ khoa học', 'Tiền hỗ trợ']].concat(L.map(a => [a.t, a.j, a.l, a.grp, a.q, a.iff || '', a.hdp || '', a.hd, a.d ? a.d.split('-').reverse().join('/') : '', a.vol, a.iss, a.pg, a.authors.map(nm).join('; '), [...new Set(a.authors.filter(x => x.tlu).map(x => x.khoa))].join('; '), a.st, a.nc, a.dm, a.ht, a.gio, a.tien])) };
      pv();
    };
    root.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { const q = +b.dataset.q, Y = new Date().getFullYear(), y0 = q >= 2000 ? q : Y - q; root.querySelector('#kF').value = '01/01/' + y0; root.querySelector('#kT').value = '31/12/' + Y; root.querySelector('#kLoad').click(); });
    const rg = lsGet('T2K_RANGE'); if (rg && rg[0]) { root.querySelector('#kF').value = rg[0]; root.querySelector('#kT').value = rg[1]; root.querySelector('#kLoad').click(); }
  };

  /* ===== BUOC 1: o trang KHCN TLU ===== */
  if (location.hostname === 'khcn.tlu.edu.vn') {
    const now = new Date();
    box.innerHTML = head('Công cụ KHCN TLU → HEMIS') +
      '<div style="display:flex;gap:4px;padding:6px 10px 0;background:#eef3fb;border-bottom:1px solid #cdd8ea"><button id="tb1" style="' + B + ';margin:0;border-radius:6px 6px 0 0;background:#fff;color:#0b6bcb">① Quét & đẩy lên HEMIS</button><button id="tb2" style="' + B + ';margin:0;border-radius:6px 6px 0 0;background:transparent;color:#555">② Thống kê dữ liệu KHCN</button></div>' +
      '<div id="t2hK" style="padding:12px 16px;overflow:auto;flex:1;display:none"></div>' +
      '<div id="t2hB1" style="padding:20px;overflow:auto;flex:1">' +
      '<p>Năm báo cáo: <select id="t2hYr" style="font-size:16px;padding:4px">' + [now.getFullYear() + 1, now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2, now.getFullYear() - 3].map(y => '<option value="' + y + '"' + (y === now.getFullYear() ? ' selected' : '') + '>Năm ' + y + '</option>').join('') + '<option value="">Tự chọn ngày</option></select> ' +
      '<span style="color:#555">Thông tư 83 tính số bài theo <b>năm báo cáo, từ 01/01 đến 31/12</b> (số liệu chốt ngày 31/12). Nên quét trọn năm.</span></p>' +
      '<p>Từ ngày <input id="t2hF" value="01/01/' + now.getFullYear() + '" style="font-size:16px;width:130px;padding:4px"> ' +
      'đến ngày <input id="t2hT" value="31/12/' + now.getFullYear() + '" style="font-size:16px;width:130px;padding:4px"> ' +
      '<button id="t2hGo" style="' + B + ';background:#0b6bcb;color:#fff">Quét dữ liệu</button></p>' +
      '<p id="t2hMsg" style="color:#0b6bcb"></p><div id="t2hRes"></div></div>';
    bindClose();
    const tb1 = box.querySelector('#tb1'), tb2 = box.querySelector('#tb2'), pK = box.querySelector('#t2hK'), pB = box.querySelector('#t2hB1'); let kInit = false;
    const tab = n => { pB.style.display = n === 1 ? '' : 'none'; pK.style.display = n === 2 ? '' : 'none'; [tb1, tb2].forEach((b, i) => { b.style.background = i + 1 === n ? '#fff' : 'transparent'; b.style.color = i + 1 === n ? '#0b6bcb' : '#555'; }); if (n === 2 && !kInit) { kInit = true; khcnStatsTab(pK); } };
    tb1.onclick = () => tab(1); tb2.onclick = () => tab(2);
    const msg = box.querySelector('#t2hMsg'), res = box.querySelector('#t2hRes');
    let recs = [];
    const scan = async () => {
      res.innerHTML = ''; msg.style.color = '#0b6bcb';
      const f = toISO(box.querySelector('#t2hF').value), t = toISO(box.querySelector('#t2hT').value);
      if (!f || !t) { msg.style.color = 'red'; msg.textContent = 'Ngày chưa đúng dạng ngày/tháng/năm'; return; }
      msg.textContent = 'Đang quét dữ liệu, vui lòng đợi...';
      const get = async u => { const h = await fetch(u, { credentials: 'include', cache: 'no-store' }).then(r => r.text()); if (/login_form/.test(h)) throw new Error('Phiên đăng nhập KHCN đã hết. Hãy đăng nhập lại rồi bấm nút bookmark.'); return new DOMParser().parseFromString(h, 'text/html'); };
      const xuat = np => get('/CongBo/XuatDuLieu?page=1&currentFilter=&from=' + f + '&target=' + t + '&curprivate=false&loai=null&diachi=null&khoa=&nopoint=' + np);
      const titles = d => new Set([...d.querySelectorAll('table tr')].slice(1).map(r => norm(r.children[1] ? r.children[1].innerText : '')));
      try {
        const d = await get('/TrichXuatCongBo?from=' + f + '&target=' + t);
        const rows = [...d.querySelectorAll('table tr')].slice(1).map(r => [...r.children].map(c => c.innerText.trim().replace(/\s+/g, ' ')));
        if (!rows.length) { msg.style.color = 'red'; msg.textContent = 'Không có bài nào trong khoảng ngày này.'; return; }
        msg.textContent = 'Đang kiểm tra trạng thái và các trường thông tin...';
        const all = await xuat('null'), ok = titles(await xuat('1')), noCount = titles(await xuat('true'));
        const ids = {}; [...all.querySelectorAll('table tr')].slice(1).forEach(r => { const m = (r.getAttribute('ondblclick') || r.innerHTML).match(/ShowDeTails\('(\d+)'/); if (m && r.children[1]) ids[norm(r.children[1].innerText)] = m[1]; });
        recs = rows.map(r => { const k = norm(r[5]); return { t: r[5], j: r[6], l: r[7], q: r[8], d: r[11], v: r[14], i: r[15], pg: r[16], ap: ok.has(k) ? 1 : 0, nc: noCount.has(k) ? 1 : 0, id: ids[k] || '' }; }).filter(r => r.t);
        const issues = [];
        recs.forEach(r => {
          const m = MAP(r.l || ''), k = norm(r.t), miss = [], soft = [];
          if (!toISO(r.d)) miss.push('Ngày công bố');
          if (!m) miss.push('Loại bài báo (không nhận ra)');
          if (!r.j) miss.push('Tên tạp chí/hội nghị'); else if (norm(r.j) === k) miss.push('Tên tạp chí đang ghi trùng tên bài');
          if (m && m.wos && !QM[r.q]) soft.push('Xếp hạng Q');
          if (m && m.p === 1 && !r.v && !r.i) soft.push('Tập/Số (Vol/Issue)');
          if (!r.pg) soft.push('Số trang');
          if (m && m.p === 1 && !m.wos && r.j && norm(r.j) !== k) {
            const dm = matchDM(r.j); r.dm = dm.lv;
            if (dm.lv === 'near') { r.dmName = dm.name; soft.push('Tên tạp chí chưa đúng danh mục Bộ KH&CN, sửa thành: ' + dm.name); }
            else if (dm.lv === 'no' && String(toISO(r.d)) > '2026-09-30') soft.push('Không tìm thấy tạp chí trong danh mục Bộ KH&CN: bài sau 30/9/2026 sẽ không được tính (kiểm tra lại tên)');
          }
          if (miss.length || soft.length) issues.push({ r, miss, soft });
        });
        issues.sort((a, b) => b.miss.length - a.miss.length);
        const nMust = issues.filter(x => x.miss.length).length, nSoft = issues.length - nMust;
        const dmC = { ok: 0, near: 0, no: 0 }; recs.forEach(r => { if (r.dm) dmC[r.dm]++; });
        const nOK = recs.length - issues.length;
        msg.textContent = '';
        res.innerHTML =
          '<div style="font-size:16px;margin:6px 0">Quét được <b>' + recs.length + '</b> bài: <b style="color:#1a8f3c">' + nOK + ' bài đủ hết</b> · <b style="color:#c00">' + nMust + ' bài thiếu trường BẮT BUỘC</b> (phải sửa) · <b style="color:#c60">' + nSoft + ' bài thiếu trường nên có</b> (Q, tập/số, trang).</div>' +
          '<div style="margin:4px 0 8px;color:#333">Tạp chí trong nước, so với <b>Danh mục tạp chí đạt tiêu chuẩn của Bộ KH&CN</b> (QĐ 2244/QĐ-BKHCN): <b style="color:#1a8f3c">' + dmC.ok + ' bài đúng tên</b> · <b style="color:#c60">' + dmC.near + ' bài tên gần đúng</b> (cần sửa tên trên KHCN) · <b style="color:#888">' + dmC.no + ' bài không tìm thấy trong danh mục</b>.</div>' +
          (issues.length ? '<div style="background:#fff8e6;border:1px solid #f1d58a;border-radius:8px;padding:10px;margin:8px 0">Bấm <b>Sửa</b> để mở bài trên KHCN (tab mới), bổ sung xong quay lại đây bấm <b>Quét lại</b>. Sửa hết trường bắt buộc thì mới sang HEMIS được; trường nên có thì bổ sung được bao nhiêu tốt bấy nhiêu. Sau đó đẩy 1 lần.</div>' : '<div style="color:#1a8f3c;font-weight:bold;margin:8px 0">Tất cả bài đã đủ thông tin.</div>') +
          '<div><button id="t2hRe" style="' + B + ';background:#eee">↻ Quét lại</button>' +
          '<button id="t2hCsv1" style="' + B + ';background:#eee"' + (issues.length ? '' : ' disabled') + '>Tải danh sách cần sửa (Excel)</button>' +
          '<button id="t2hNext" style="' + B + ';background:#1a8f3c;color:#fff">Sang HEMIS →</button>' +
          (nMust ? '<label style="margin-left:8px"><input type="checkbox" id="t2hForce"> Vẫn sang HEMIS dù còn ' + nMust + ' bài thiếu trường bắt buộc</label>' : '') + '</div>' +
          (issues.length ? '<table style="border-collapse:collapse;width:100%;margin-top:10px;font-size:13px"><tr style="background:#fde8e8">' +
            ['', 'Tên bài báo', 'Tạp chí/Hội nghị', 'Loại (KHCN)', 'Ngày', 'Thiếu – bắt buộc', 'Thiếu – nên có'].map(h => '<th style="padding:4px;border:1px solid #ccc">' + h + '</th>').join('') + '</tr>' +
            issues.map(x => '<tr><td style="border:1px solid #ddd;white-space:nowrap">' + (x.r.id ? '<a class="t2hEd" data-fix="' + esc(x.r.dmName || '') + '" href="/CongBo/EditCongBo/' + x.r.id + '?toantruong=true" target="_blank" style="color:#0b6bcb;font-weight:bold">' + (x.r.dmName ? 'Sửa (điền sẵn tên)' : 'Sửa') + '</a>' : '') + '</td><td style="border:1px solid #ddd">' + esc(x.r.t) + '</td><td style="border:1px solid #ddd">' + esc(x.r.j) + '</td><td style="border:1px solid #ddd">' + esc(x.r.l) + '</td><td style="border:1px solid #ddd;white-space:nowrap">' + esc(x.r.d) + '</td><td style="border:1px solid #ddd;color:#c00;font-weight:bold">' + esc(x.miss.join('; ')) + '</td><td style="border:1px solid #ddd;color:#c60">' + esc(x.soft.join('; ')) + '</td></tr>').join('') + '</table>' : '');
        res.querySelector('#t2hRe').onclick = scan;
        /* Bam Sua voi bai co ten gan dung: mo trang sua tren KHCN va dien san ten tap chi chuan */
        res.querySelectorAll('a.t2hEd').forEach(a => {
          const name = a.dataset.fix; if (!name) return;
          a.onclick = e => {
            e.preventDefault();
            const w = window.open(a.href, '_blank'); if (!w) { location.href = a.href; return; }
            let n = 0;
            const t = setInterval(() => {
              n++;
              try {
                const inp = w.document && w.document.readyState === 'complete' && w.document.getElementById('tentapchi');
                if (inp) {
                  clearInterval(t);
                  inp.value = name; inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true }));
                  inp.style.background = '#fff3b0'; inp.style.outline = '3px solid #f0a000'; inp.scrollIntoView({ block: 'center' });
                  const note = w.document.createElement('div');
                  note.textContent = 'Tên tạp chí đã được điền sẵn theo danh mục Bộ KH&CN. Kiểm tra lại rồi bấm "Ghi lại".';
                  note.style.cssText = 'color:#b35c00;font-weight:bold;margin:4px 0';
                  inp.parentNode.insertBefore(note, inp.nextSibling);
                }
              } catch (err) {}
              if (n > 150) clearInterval(t);
            }, 200);
          };
        });
        res.querySelector('#t2hCsv1').onclick = () => {
          const q = s => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
          const csv = String.fromCharCode(65279) + ['Tên bài báo,Tạp chí/Hội nghị,Loại,Ngày công bố,Thiếu bắt buộc,Thiếu nên có,Link sửa trên KHCN'].concat(issues.map(x => [x.r.t, x.r.j, x.r.l, x.r.d, x.miss.join('; '), x.soft.join('; '), x.r.id ? location.origin + '/CongBo/EditCongBo/' + x.r.id + '?toantruong=true' : ''].map(q).join(','))).join('\r\n');
          const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
          a.download = 'Bài báo cần bổ sung ' + new Date().toISOString().slice(0, 10) + '.csv'; document.body.appendChild(a); a.click(); a.remove();
        };
        res.querySelector('#t2hNext').onclick = () => {
          const fc = res.querySelector('#t2hForce');
          if (nMust && !(fc && fc.checked)) { alert('Còn ' + nMust + ' bài thiếu trường bắt buộc. Hãy sửa rồi bấm "Quét lại", hoặc tick ô "Vẫn sang HEMIS".'); return; }
          window.name = KEY + JSON.stringify(recs);
          msg.textContent = 'Đang chuyển sang HEMIS... Khi trang HEMIS hiện ra, bấm nút bookmark lần nữa.';
          setTimeout(() => { location.href = HEMIS_PAGE; }, 800);
        };
      } catch (e) { msg.style.color = 'red'; msg.textContent = 'Lỗi: ' + e.message; }
    };
    box.querySelector('#t2hGo').onclick = scan;
    box.querySelector('#t2hYr').onchange = e => { const y = e.target.value; if (y) { box.querySelector('#t2hF').value = '01/01/' + y; box.querySelector('#t2hT').value = '31/12/' + y; } };
    ['#t2hF', '#t2hT'].forEach(q => box.querySelector(q).addEventListener('input', () => { box.querySelector('#t2hYr').value = ''; }));
    return;
  }

  /* ===== BUOC 2: o trang HEMIS ===== */
  if (location.hostname !== 'hemis-cms.moet.gov.vn') {
    box.innerHTML = head('Công cụ đẩy bài báo') + '<div style="padding:20px">Hãy mở trang <b>khcn.tlu.edu.vn</b> (đã đăng nhập) rồi bấm nút này.</div>';
    bindClose(); return;
  }
  if (window.name.startsWith(KEY)) { try { localStorage.setItem('TLU2HEMIS_DATA', window.name.slice(KEY.length)); } catch (e) {} window.name = ''; }
  let recs = null; try { recs = JSON.parse(localStorage.getItem('TLU2HEMIS_DATA') || 'null'); } catch (e) {}
  const noRecs = !recs || !recs.length; if (noRecs) recs = [];
  box.innerHTML = head(noRecs ? 'Thống kê chỉ số Chuẩn CSGDĐH' : 'Bước 2/2 – Đẩy lên HEMIS') + '<div id="t2hBody" style="padding:16px;overflow:auto;flex:1">Đang so sánh với dữ liệu đã có trên HEMIS...</div>';
  bindClose();
  const body = box.querySelector('#t2hBody');
  const H = () => ({ 'Authorization': 'Bearer ' + localStorage.getItem('access_token'), 'Content-Type': 'application/json', 'PortalAlias': location.origin });
  const api = async (url, data) => {
    const r = await fetch(url, { method: 'POST', headers: H(), body: JSON.stringify(data) });
    if (r.status === 401) throw new Error('Hết phiên đăng nhập HEMIS. Bấm F5 tải lại trang rồi bấm nút bookmark lần nữa.');
    const j = await r.json().catch(() => null);
    if (!r.ok || !j || j.success === false) throw new Error((j && (j.message || j.error)) || ('Mã lỗi ' + r.status));
    return j;
  };


  let existing = [];
  try {
    for (let p = 1; p <= 50; p++) {
      const j = await api('/gwdev/nckh/v5/KHCN_BAI_BAO_KHOA_HOC/GetData', { filters: [{ valueIsField: false, filters: [], stringCompareOption: 0, field: 'doN_VI_ID', operator: 'eq', value: JSON.stringify(DV) }], sorts: [], includes: [], pageInfo: { page: p, pageSize: 200 } });
      existing.push(...(j.data || []));
      if (!j.data || j.data.length < 200) break;
    }
  } catch (e) { body.innerHTML = '<p style="color:red;font-size:16px">' + esc(e.message) + '</p>'; return; }

  /* ===== PHAN 3: THONG KE CHI SO TIEU CHUAN 6 (TT 83/2026) ===== */
  const LV = [['Khoa học giáo dục và đào tạo giáo viên', 2, 1.5], ['Nghệ thuật', 2, 2], ['Nhân văn', 2, 2], ['Khoa học xã hội và hành vi', 2, 1.5], ['Báo chí và thông tin', 2, 1.5], ['Kinh doanh và quản lý', 2, 1.5], ['Pháp luật', 2, 1.5], ['Khoa học sự sống', 1.5, 1], ['Khoa học tự nhiên', 1.5, 1], ['Toán và thống kê', 1.5, 1], ['Máy tính và công nghệ thông tin', 1, 1], ['Công nghệ kỹ thuật', 1, 1], ['Kỹ thuật', 1, 1], ['Sản xuất và chế biến', 1, 1], ['Kiến trúc và xây dựng', 1.5, 1], ['Nông, lâm nghiệp và thủy sản', 1.5, 1.5], ['Thú y', 1.5, 1.5], ['Sức khỏe', 1, 1], ['Dịch vụ xã hội', 2, 2], ['Du lịch, khách sạn, thể thao và dịch vụ cá nhân', 2, 2], ['Dịch vụ vận tải', 2, 2], ['Môi trường và bảo vệ môi trường', 1.5, 1.5], ['An ninh, quốc phòng', 1, 2], ['Lĩnh vực khác', 1, 1]];
  const statsSection = () => {
    const sec = document.createElement('div');
    sec.id = 't2hStats';
    sec.style.cssText = 'margin-top:28px;border-top:3px solid #6a3fb5;padding-top:12px';
    const num = v => { let t = String(v == null ? '' : v).replace(/\s/g, ''); if (!t) return 0; if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.'); else if (!/^\d+\.\d{1,2}$/.test(t)) t = t.replace(/\./g, ''); const n = parseFloat(t); return isNaN(n) ? 0 : n; };
    const fmt = (v, d = 2) => (isFinite(v) ? v : 0).toLocaleString('vi-VN', { maximumFractionDigits: d, minimumFractionDigits: d });
    const thisYear = new Date().getFullYear();
    const inp = (id, w) => '<input id="' + id + '" style="width:' + (w || 90) + 'px;padding:3px;text-align:right;border:1px solid #bbb;border-radius:4px;background:#fffbe6">';
    const td = 'border:1px solid #ddd;padding:3px 6px';
    sec.innerHTML = '<div style="font-size:17px;font-weight:bold;color:#6a3fb5">Thống kê chỉ số Tiêu chuẩn 6 – Chuẩn CSGDĐH (Thông tư 83/2026/TT-BGDĐT)</div>' +
      '<div style="color:#555;margin:4px 0 10px">Phần <b>tím</b> do P9 tự tính từ dữ liệu bài báo trên HEMIS. Ô <b style="background:#fffbe6">vàng</b> là số liệu xin của phòng khác. Số liệu ô vàng được lưu lại trên máy này cho lần sau.</div>' +
      '<div>Năm báo cáo (01/01 – 31/12): <select id="sY" style="font-size:15px;padding:3px">' + [thisYear + 1, thisYear, thisYear - 1, thisYear - 2].map(y => '<option' + (y === thisYear ? ' selected' : '') + '>' + y + '</option>').join('') + '</select> ' +
      '<label style="margin-left:12px"><input type="checkbox" id="sTS" checked> Trường có đào tạo tiến sĩ</label>' +
      '<label style="margin-left:12px"><input type="checkbox" id="sKY" checked> Tính kỷ yếu ISI/Scopus là bài WoS/Scopus</label>' +
      '<div style="color:#888;font-size:12px;margin-top:4px">Các ô tick chỉ thay đổi con số ước tính trên công cụ này, không thay đổi gì trên HEMIS. Bộ sẽ tự tính từ dữ liệu HEMIS.</div>' +
      '<button id="sRe" style="' + B + ';background:#eee">↻ Lấy lại số liệu từ HEMIS</button><button id="sCsv" style="' + B + ';background:#eee">Tải bảng thống kê (Excel)</button></div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:16px;margin-top:10px">' +
      '<div style="flex:1;min-width:320px"><div style="font-weight:bold;margin-bottom:4px">Bảng 6A – Sản phẩm KHCN (P9)</div><table style="border-collapse:collapse;width:100%;font-size:13px" id="s6A"></table>' +
      '<div style="font-weight:bold;margin:12px 0 4px">Bảng 6C – Giảng viên quy đổi GQĐ (Phòng Tổ chức cán bộ)</div><table style="border-collapse:collapse;font-size:13px">' +
      [['gDH', 'Giảng viên trình độ đại học', 0.5], ['gThS', 'Giảng viên trình độ thạc sĩ', 0.75], ['gTS', 'Giảng viên trình độ tiến sĩ', 1], ['gPGS', 'Giảng viên chức danh phó giáo sư', 1], ['gGS', 'Giảng viên chức danh giáo sư', 1]].map(g => '<tr><td style="' + td + '">' + g[1] + '</td><td style="' + td + '">× ' + g[2] + '</td><td style="' + td + '">' + inp(g[0]) + '</td></tr>').join('') +
      '<tr><td style="' + td + '"><b>Hoặc nhập thẳng GQĐ</b> (nếu phòng TCCB đã tính sẵn)</td><td style="' + td + '"></td><td style="' + td + '">' + inp('gQD') + '</td></tr>' +
      '<tr><td style="' + td + '"><b>GQĐ dùng để tính</b></td><td style="' + td + '"></td><td style="' + td + ';font-weight:bold" id="sGQD"></td></tr></table>' +
      '<div style="font-weight:bold;margin:12px 0 4px">Sách chuyên khảo, bằng sáng chế (nếu có, trong năm báo cáo)</div><table style="border-collapse:collapse;font-size:13px">' +
      '<tr><td style="' + td + '">P3: Sách chuyên khảo + bằng độc quyền giải pháp hữu ích</td><td style="' + td + '">' + inp('p3') + '</td></tr>' +
      '<tr><td style="' + td + '">P4: Bằng độc quyền sáng chế</td><td style="' + td + '">' + inp('p4') + '</td></tr></table>' +
      '<div style="color:#888;font-size:12px">Hiện trên HEMIS, mục Sách và Tài sản trí tuệ của trường chưa có dữ liệu nên phải nhập tay.</div>' +
      '<div style="font-weight:bold;margin:12px 0 4px">Bảng 6B – Thu KHCN (Phòng Tài chính – Kế toán), đơn vị đồng</div><table style="border-collapse:collapse;font-size:13px"><tr style="background:#f3eefb"><th style="' + td + '"></th><th style="' + td + '" class="yN"></th><th style="' + td + '" class="yN1"></th><th style="' + td + '" class="yN2"></th></tr>' +
      '<tr><td style="' + td + '">R: Tổng thu hoạt động</td><td style="' + td + '">' + inp('r0', 130) + '</td><td style="' + td + '">' + inp('r1', 130) + '</td><td style="' + td + '">' + inp('r2', 130) + '</td></tr>' +
      '<tr><td style="' + td + '">R1: Thu từ KHCN & ĐMST</td><td style="' + td + '">' + inp('k0', 130) + '</td><td style="' + td + '">' + inp('k1', 130) + '</td><td style="' + td + '">' + inp('k2', 130) + '</td></tr></table></div>' +
      '<div style="flex:1;min-width:420px"><div style="font-weight:bold;margin-bottom:4px">Số người học theo lĩnh vực (Phòng Đào tạo) – để tính hệ số KLV</div>' +
      '<div style="color:#888;font-size:12px;margin-bottom:4px">Chỉ điền các lĩnh vực trường có đào tạo. M = SVCQ×1 + Kết hợp×0,8 + Từ xa×0,5 + HVCH×1,5 + NCS×2.</div>' +
      '<table style="border-collapse:collapse;font-size:12px"><tr style="background:#f3eefb">' + ['Lĩnh vực', 'SV chính quy', 'SV kết hợp', 'SV từ xa', 'Học viên CH', 'NCS', 'M', 'KTC', 'KBB'].map(h => '<th style="' + td + '">' + h + '</th>').join('') + '</tr>' +
      LV.map((l, i) => '<tr><td style="' + td + '">' + l[0] + '</td>' + [0, 1, 2, 3, 4].map(c => '<td style="' + td + '">' + inp('m' + i + '_' + c, 62) + '</td>').join('') + '<td style="' + td + '" id="mM' + i + '"></td><td style="' + td + '">' + l[1] + '</td><td style="' + td + '">' + l[2] + '</td></tr>').join('') +
      '<tr><td style="' + td + '"><b>Tổng N</b></td><td colspan="5" style="' + td + '"></td><td style="' + td + ';font-weight:bold" id="mN"></td><td style="' + td + ';font-weight:bold" id="kTC"></td><td style="' + td + ';font-weight:bold" id="kBB"></td></tr></table>' +
      '<div style="color:#888;font-size:12px">Dòng cuối: KLV (kinh phí) dùng cho 6.1 và KLV (công bố) dùng cho 6.2.2. Chưa điền người học thì KLV tạm lấy bằng 1.</div></div></div>' +
      '<div style="font-weight:bold;margin:14px 0 4px;font-size:16px">Kết quả</div><table style="border-collapse:collapse;width:100%;font-size:14px" id="sRes"></table>';
    let A = existing;
    const key = () => 'TLU2HEMIS_TC6_' + sec.querySelector('#sY').value;
    const ids = () => [...sec.querySelectorAll('input:not([type=checkbox])')].map(e => e.id);
    const save = () => { try { const o = {}; ids().forEach(i => o[i] = sec.querySelector('#' + i).value); localStorage.setItem(key(), JSON.stringify(o)); } catch (e) {} };
    const load = () => { let o = {}; try { o = JSON.parse(localStorage.getItem(key()) || '{}'); } catch (e) {} ids().forEach(i => { sec.querySelector('#' + i).value = o[i] || ''; }); };
    let last = null;
    const calc = () => {
      const Y = +sec.querySelector('#sY').value, coTS = sec.querySelector('#sTS').checked, ky = sec.querySelector('#sKY').checked;
      sec.querySelector('.yN').textContent = 'Năm ' + Y; sec.querySelector('.yN1').textContent = 'Năm ' + (Y - 1); sec.querySelector('.yN2').textContent = 'Năm ' + (Y - 2);
      const dates = {}; (recs || []).forEach(r => { dates[norm(r.t)] = toISO(r.d); });
      const seenT = new Set(), rows = [];
      let p1 = 0, p2 = 0, p1dm = 0, p1near = 0, p1hd = 0, noDate = 0, no = 0, p2j = 0, p2k = 0;
      A.filter(x => +x.naM_CONG_BO === Y).forEach(x => {
        x._dmName = ''; const k = norm(x.teN_BAI_BAO); if (k.length > 5 && seenT.has(k)) return; seenT.add(k);
        const qt = x.taP_CHI_QUOC_TE, tn = x.taP_CHI_TRONG_NUOC;
        let g;
        if (qt === '01' || qt === '02') { g = 'P2'; if (x.phaN_LOAI === 2) p2k++; else p2j++; }
        else if (tn === '03' || tn === '04') { g = ky ? 'P2' : 'no'; if (ky) p2k++; }
        else {
          /* Tu nam 2026 (TT 83): tinh bai tap chi thuoc danh muc Bo KH&CN; bai thuoc danh muc HDGSNN chi tinh neu cong bo den 30/9/2026 */
          const d = dates[k], after = d ? d > '2026-09-30' : false;
          const dm = (Y >= 2026 && x.phaN_LOAI === 1 && x.teN_TAP_CHI) ? matchDM(x.teN_TAP_CHI) : { lv: 'no' };
          if (dm.lv !== 'no') { g = 'P1'; p1dm++; if (dm.lv === 'near') { p1near++; x._dmName = dm.name; } }
          else if (tn === '01' && !after) { g = 'P1'; p1hd++; if (!d && Y >= 2026) noDate++; }
          else g = 'no';
        }
        if (g === 'P2') p2++; else if (g === 'P1') p1++; else if (g === 'no') no++;
        rows.push({ x, g });
      });
      const p3 = num(sec.querySelector('#p3').value), p4 = num(sec.querySelector('#p4').value);
      const P = p1 + 2 * p2 + 3 * p3 + 5 * p4;
      const gd = [['gDH', 0.5], ['gThS', 0.75], ['gTS', 1], ['gPGS', 1], ['gGS', 1]].reduce((s, g) => s + num(sec.querySelector('#' + g[0]).value) * g[1], 0);
      const GQD = num(sec.querySelector('#gQD').value) || gd;
      sec.querySelector('#sGQD').textContent = GQD ? fmt(GQD) : '(chưa có)';
      let N = 0, sTC = 0, sBB = 0;
      LV.forEach((l, i) => { const v = [0, 1, 2, 3, 4].map(c => num(sec.querySelector('#m' + i + '_' + c).value)); const M = v[0] + 0.8 * v[1] + 0.5 * v[2] + 1.5 * v[3] + 2 * v[4]; sec.querySelector('#mM' + i).textContent = M ? fmt(M, 1) : ''; N += M; sTC += M * l[1]; sBB += M * l[2]; });
      const KTC = N ? sTC / N : 1, KBB = N ? sBB / N : 1;
      sec.querySelector('#mN').textContent = N ? fmt(N, 1) : ''; sec.querySelector('#kTC').textContent = 'KLV ' + fmt(KTC, 3); sec.querySelector('#kBB').textContent = 'KLV ' + fmt(KBB, 3);
      const r = [0, 1, 2].map(i => num(sec.querySelector('#r' + i).value)), k1 = [0, 1, 2].map(i => num(sec.querySelector('#k' + i).value));
      const has61 = r.every(v => v > 0);
      const T61 = has61 ? (k1[0] / r[0] + k1[1] / r[1] + k1[2] / r[2]) / 3 * KTC : null;
      const T621 = GQD ? P / GQD : null, thr621 = coTS ? 0.6 : 0.3;
      const T622 = GQD ? p2 * KBB / GQD : null;
      const td2 = 'border:1px solid #ccc;padding:5px 8px';
      sec.querySelector('#s6A').innerHTML = '<tr style="background:#f3eefb"><th style="' + td + '">Nhóm sản phẩm (năm ' + Y + ')</th><th style="' + td + '">Số lượng</th><th style="' + td + '">Hệ số</th><th style="' + td + '">Quy đổi</th></tr>' +
        '<tr><td style="' + td + '">P1: Bài báo trong nước được công nhận, không thuộc WoS/Scopus' + (Y >= 2026 ? ' (danh mục Bộ KH&CN; HĐGSNN đến 30/9/2026)' : ' (danh mục HĐGSNN)') + '</td><td style="' + td + ';color:#6a3fb5;font-weight:bold">' + p1 + '</td><td style="' + td + '">1</td><td style="' + td + '">' + p1 + '</td></tr>' +
        (Y >= 2026 ? '<tr><td style="' + td + ';color:#555" colspan="4">Trong đó: ' + p1dm + ' bài trên tạp chí thuộc danh mục Bộ KH&CN' + (p1near ? ' (<b style="color:#c60">' + p1near + ' bài tên tạp chí gần đúng, nên sửa tên</b>)' : '') + ' · ' + p1hd + ' bài theo danh mục HĐGSNN, công bố đến 30/9/2026' + (noDate ? ' · <span style="color:#c60">' + noDate + ' bài chưa có ngày công bố (chưa quét KHCN) nên tạm tính theo HĐGSNN</span>' : '') + '</td></tr>' : '') +
        '<tr><td style="' + td + '">P2: Bài WoS/Scopus (tạp chí ' + p2j + ', kỷ yếu ' + p2k + ')</td><td style="' + td + ';color:#6a3fb5;font-weight:bold">' + p2 + '</td><td style="' + td + '">2</td><td style="' + td + '">' + 2 * p2 + '</td></tr>' +
        '<tr><td style="' + td + '">P3: Sách chuyên khảo + giải pháp hữu ích</td><td style="' + td + '">' + p3 + '</td><td style="' + td + '">3</td><td style="' + td + '">' + 3 * p3 + '</td></tr>' +
        '<tr><td style="' + td + '">P4: Bằng sáng chế</td><td style="' + td + '">' + p4 + '</td><td style="' + td + '">5</td><td style="' + td + '">' + 5 * p4 + '</td></tr>' +
        '<tr style="font-weight:bold"><td style="' + td + '">TỔNG P</td><td style="' + td + '"></td><td style="' + td + '"></td><td style="' + td + '">' + fmt(P, 0) + '</td></tr>' +
        '<tr><td style="' + td + ';color:#888" colspan="4">Bài trên HEMIS năm ' + Y + ' không được tính (tạp chí quốc tế khác, trong nước không thuộc danh mục): ' + no + ' bài</td></tr>';
      const st = (v, t, pct) => v == null ? '<span style="color:#888">Chưa đủ số liệu</span>' : (v >= t ? '<b style="color:#1a8f3c">ĐẠT</b>' : '<b style="color:#c00">CHƯA ĐẠT</b>');
      const gap621 = T621 != null && T621 < thr621 ? Math.ceil(thr621 * GQD - P) : 0;
      const gap622 = T622 != null && T622 < 0.3 ? Math.ceil(0.3 * GQD / KBB - p2) : 0;
      sec.querySelector('#sRes').innerHTML = '<tr style="background:#f3eefb"><th style="' + td2 + '">Chỉ số</th><th style="' + td2 + '">Yêu cầu</th><th style="' + td2 + '">Thực tế</th><th style="' + td2 + '">Kết quả</th><th style="' + td2 + '">Ghi chú</th></tr>' +
        '<tr><td style="' + td2 + '">6.1 Tỷ trọng thu KHCN & ĐMST (TB 3 năm × KLV)</td><td style="' + td2 + '">' + (coTS ? '≥ 5%' : 'Không áp dụng') + '</td><td style="' + td2 + '">' + (T61 == null ? '' : fmt(T61 * 100) + '%') + '</td><td style="' + td2 + '">' + (coTS ? st(T61, 0.05) : '') + '</td><td style="' + td2 + '">' + (has61 ? '' : 'Cần R, R1 của 3 năm (Phòng TC-KT)') + '</td></tr>' +
        '<tr><td style="' + td2 + '">6.2.1 Sản phẩm KHCN quy đổi / giảng viên quy đổi</td><td style="' + td2 + '">≥ ' + String(thr621).replace('.', ',') + '</td><td style="' + td2 + '">' + (T621 == null ? '' : fmt(T621, 3)) + '</td><td style="' + td2 + '">' + st(T621, thr621) + '</td><td style="' + td2 + '">' + (GQD ? (gap621 ? 'Còn thiếu ' + gap621 + ' sản phẩm quy đổi (≈ ' + Math.ceil(gap621 / 2) + ' bài WoS/Scopus hoặc ' + gap621 + ' bài trong nước)' : '') : 'Cần GQĐ (Phòng TCCB)') + '</td></tr>' +
        '<tr><td style="' + td2 + '">6.2.2 Công bố WoS/Scopus × KLV / giảng viên quy đổi</td><td style="' + td2 + '">' + (coTS ? '≥ 0,3' : 'Không áp dụng') + '</td><td style="' + td2 + '">' + (T622 == null ? '' : fmt(T622, 3)) + '</td><td style="' + td2 + '">' + (coTS ? st(T622, 0.3) : '') + '</td><td style="' + td2 + '">' + (GQD ? (gap622 && coTS ? 'Còn thiếu khoảng ' + gap622 + ' bài WoS/Scopus' : '') + (N ? '' : ' KLV tạm = 1 (chưa có số người học)') : 'Cần GQĐ (Phòng TCCB)') + '</td></tr>';
      last = { Y, p1, p2, p3, p4, P, GQD, KTC, KBB, N, T61, T621, T622, rows, p1dm, p1near, p1hd, no };
      save();
    };
    sec.addEventListener('input', calc); sec.addEventListener('change', e => { if (e.target.id === 'sY') load(); calc(); });
    sec.querySelector('#sRe').onclick = async () => {
      const b = sec.querySelector('#sRe'); b.textContent = 'Đang lấy...';
      try { const all = []; for (let p = 1; p <= 50; p++) { const j = await api('/gwdev/nckh/v5/KHCN_BAI_BAO_KHOA_HOC/GetData', { filters: [{ valueIsField: false, filters: [], stringCompareOption: 0, field: 'doN_VI_ID', operator: 'eq', value: JSON.stringify(DV) }], sorts: [], includes: [], pageInfo: { page: p, pageSize: 200 } }); all.push(...(j.data || [])); if (!j.data || j.data.length < 200) break; } A = all; calc(); b.textContent = '↻ Lấy lại số liệu từ HEMIS'; }
      catch (e) { b.textContent = '↻ Lấy lại số liệu từ HEMIS'; alert(e.message); }
    };
    sec.querySelector('#sCsv').onclick = () => {
      if (!last) return; const L = last, q = s => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
      const lines = [['THỐNG KÊ TIÊU CHUẨN 6 – NĂM ' + L.Y], [], ['Bảng 6A', 'Số lượng', 'Hệ số', 'Quy đổi'], ['P1 Bài báo trong nước được công nhận', L.p1, 1, L.p1], ['P2 Bài WoS/Scopus', L.p2, 2, 2 * L.p2], ['P3 Sách chuyên khảo + GPHI', L.p3, 3, 3 * L.p3], ['P4 Bằng sáng chế', L.p4, 5, 5 * L.p4], ['Tổng P', '', '', L.P], [],
        ['GQĐ', L.GQD], ['KLV (kinh phí)', L.KTC], ['KLV (công bố)', L.KBB], [], ['6.1', L.T61 == null ? '' : L.T61], ['6.2.1', L.T621 == null ? '' : L.T621], ['6.2.2', L.T622 == null ? '' : L.T622], [],
        ['DANH SÁCH BÀI BÁO NĂM ' + L.Y + ' TRÊN HEMIS'], ['Mã HEMIS', 'Tên bài báo', 'Tạp chí', 'Được tính vào', 'Ghi chú']].concat(L.rows.map(r => [r.x.mA_BAI_BAO, r.x.teN_BAI_BAO, r.x.teN_TAP_CHI, { P1: 'P1 (trong nước)', P2: 'P2 (WoS/Scopus)', no: 'Không tính' }[r.g], r.x._dmName ? 'Tên tạp chí nên sửa thành: ' + r.x._dmName : '']));
      const csv = String.fromCharCode(65279) + lines.map(l => l.map(q).join(',')).join('\r\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      a.download = 'Thống kê chỉ số TC6 năm ' + L.Y + '.csv'; document.body.appendChild(a); a.click(); a.remove();
    };
    load(); calc();
    return sec;
  };

  if (noRecs) {
    body.innerHTML = '<div style="background:#f3eefb;border-radius:8px;padding:10px">Chưa có dữ liệu quét từ KHCN nên chỉ hiện <b>thống kê theo dữ liệu đang có trên HEMIS</b>. Muốn đẩy bài: vào <b>khcn.tlu.edu.vn</b>, bấm nút bookmark.</div>';
    body.appendChild(statsSection()); return;
  }

  const have = new Set(existing.map(x => norm(x.teN_BAI_BAO)).filter(k => k.length > 5));
  const maxNo = {};
  existing.forEach(x => { const m = String(x.mA_BAI_BAO || '').match(/^BBKH(\d{4})-(\d+)$/); if (m) maxNo[m[1]] = Math.max(maxNo[m[1]] || 0, +m[2]); });
  const seen = new Set();
  /* st: new (se day) | nc (da duyet nhung khong ap dung tinh) | un (chua phe duyet) | have | dup | bad */
  const list = recs.map(r => {
    const k = norm(r.t), m = MAP(r.l || ''), y = (String(r.d).match(/(\d{4})$/) || [])[1];
    let st;
    if (have.has(k)) st = 'have'; else if (seen.has(k)) st = 'dup'; else if (!m || !y) st = 'bad';
    else if (!r.ap) st = 'un'; else if (r.nc || m.info) st = 'nc'; else st = 'new';
    seen.add(k);
    const warn = [];
    if (m && m.wos && !QM[r.q]) warn.push('Thiếu xếp hạng Q');
    if (m && m.info) warn.push('Bài thông tin, không phải bài báo');
    if (r.j && norm(r.j) === k) warn.push('Tên tạp chí bị nhập trùng tên bài');
    if (!r.j) warn.push('Thiếu tên tạp chí');
    if (m && m.tn && m.tn !== '03' && String(toISO(r.d)) > '2026-09-30') warn.push('Bài trong nước công bố sau 30/9/2026 (ngày ký TT 83): chỉ được tính nếu tạp chí thuộc Danh mục tạp chí đạt tiêu chuẩn của Bộ KH&CN');
    return Object.assign({}, r, { m, y, st, warn: warn.join('; ') });
  }).sort((a, b) => String(toISO(a.d)).localeCompare(String(toISO(b.d))));

  const C = s => list.filter(r => r.st === s).length;
  const LBL = {
    new: '<b style="color:#0b6bcb">Sẽ đẩy</b>',
    nc: '<b style="color:#0b6bcb">Sẽ đẩy</b> <span style="color:#888">(KHCN: không áp dụng tính)</span>',
    un: '<b style="color:#0b6bcb">Sẽ đẩy</b> <span style="color:#888">(KHCN: chưa phê duyệt)</span>',
    have: '<span style="color:#888">Đã có trên HEMIS</span>',
    dup: '<span style="color:#888">Trùng trong KHCN</span>',
    bad: '<span style="color:#c00">Không rõ loại/ngày</span>'
  };
  const canTick = s => s === 'new' || s === 'nc' || s === 'un';
  body.innerHTML =
    '<div style="font-size:16px;margin-bottom:6px">Lấy được <b>' + list.length + '</b> bài. <b style="color:#0b6bcb">Sẽ đẩy: ' + (C('new') + C('un') + C('nc')) + '</b> bài chưa có trên HEMIS (đã duyệt ' + C('new') + ', chưa duyệt ' + C('un') + ', không áp dụng tính ' + C('nc') + ').</div>' +
    '<div style="margin-bottom:8px;color:#555">Bỏ qua: đã có trên HEMIS ' + C('have') + ' · trùng ' + C('dup') + ' · lỗi loại ' + C('bad') + '. ' +
    'Có cảnh báo: ' + list.filter(r => r.warn && canTick(r.st)).length + ' bài (xem cột Cảnh báo).</div>' +
    '<div><button id="t2hPush" style="' + B + ';background:#1a8f3c;color:#fff"></button>' +
    '<button id="t2hCsv" style="' + B + ';background:#eee">Tải bảng kết quả (Excel)</button>' +
    '<span id="t2hProg" style="margin-left:10px;font-weight:bold"></span></div>' +
    '<table style="border-collapse:collapse;width:100%;margin-top:10px;font-size:13px"><tr style="background:#e8f0fb">' +
    ['<input type="checkbox" id="t2hAll">', 'Mã HEMIS', 'Tên bài báo', 'Tạp chí', 'Loại (KHCN)', 'Q', 'Ngày', 'Tình trạng', 'Cảnh báo'].map(h => '<th style="padding:4px;border:1px solid #ccc">' + h + '</th>').join('') + '</tr>' +
    list.map((r, i) => '<tr><td style="border:1px solid #ddd;text-align:center">' + (canTick(r.st) ? '<input type="checkbox" class="t2hC" data-i="' + i + '"' + ' checked' + '>' : '') + '</td>' +
      '<td style="border:1px solid #ddd;white-space:nowrap" id="t2hK' + i + '"></td><td style="border:1px solid #ddd">' + esc(r.t) + '</td><td style="border:1px solid #ddd">' + esc(r.j) + '</td>' +
      '<td style="border:1px solid #ddd">' + esc(r.l) + '</td><td style="border:1px solid #ddd">' + esc(r.q === 'NONE' ? '' : r.q) + '</td><td style="border:1px solid #ddd;white-space:nowrap">' + esc(r.d) + '</td>' +
      '<td style="border:1px solid #ddd" id="t2hS' + i + '">' + LBL[r.st] + '</td><td style="border:1px solid #ddd;color:#c60">' + esc(r.warn) + '</td></tr>').join('') + '</table>';

  const boxes = () => [...body.querySelectorAll('.t2hC')];
  const btn = body.querySelector('#t2hPush'), prog = body.querySelector('#t2hProg');
  const refresh = () => { const n = boxes().filter(c => c.checked && !c.disabled).length; btn.textContent = 'Đẩy ' + n + ' bài đã tick lên HEMIS'; btn.disabled = !n; btn.style.opacity = n ? 1 : .5; };
  refresh();
  body.querySelector('#t2hAll').onchange = e => { boxes().forEach(c => { if (!c.disabled) c.checked = e.target.checked; }); refresh(); };
  body.addEventListener('change', e => { if (e.target.classList.contains('t2hC')) refresh(); });

  body.querySelector('#t2hCsv').onclick = () => {
    const txt = { new: 'Chưa đẩy', nc: 'Không áp dụng tính', un: 'Chưa phê duyệt', have: 'Đã có trên HEMIS', dup: 'Trùng trong KHCN', bad: 'Không rõ loại/ngày', ok: 'Đã đẩy thành công', err: 'Lỗi' };
    const q = s => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
    const csv = String.fromCharCode(65279) + ['Mã HEMIS,Tên bài báo,Tạp chí,Loại,Q,Ngày công bố,Tình trạng,Cảnh báo,Ghi chú lỗi'].concat(list.map(r => [r.code, r.t, r.j, r.l, r.q, r.d, txt[r.st], r.warn, r.err].map(q).join(','))).join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'Kết quả đẩy HEMIS ' + new Date().toISOString().slice(0, 10) + '.csv'; document.body.appendChild(a); a.click(); a.remove();
  };

  btn.onclick = async () => {
    const todo = boxes().filter(c => c.checked && !c.disabled).map(c => +c.dataset.i);
    if (!todo.length || !confirm('Đẩy ' + todo.length + ' bài lên HEMIS?' )) return;
    btn.disabled = true; let ok = 0, bad = 0;
    for (const i of todo) {
      const r = list[i], cell = body.querySelector('#t2hS' + i), cb = body.querySelector('.t2hC[data-i="' + i + '"]');
      maxNo[r.y] = (maxNo[r.y] || 0) + 1; r.code = 'BBKH' + r.y + '-' + maxNo[r.y];
      const vol = r.v ? (r.i ? r.v + '(' + r.i + ')' : r.v) : (r.i || '');
      const rec = { id: crypto.randomUUID(), doN_VI_ID: DV, mA_BAI_BAO: r.code, teN_BAI_BAO: r.t, teN_TAP_CHI: r.j || '', naM_CONG_BO: +r.y, phaN_LOAI: r.m.p, isBuildIn: false, isBuildInAll: false };
      if (vol) rec.taP_SO = vol;
      if (r.pg) rec.trang = r.pg;
      if (r.m.qt) rec.taP_CHI_QUOC_TE = r.m.qt;
      if (r.m.tn) rec.taP_CHI_TRONG_NUOC = r.m.tn;
      if (QM[r.q]) rec.xeP_HANG_Q = QM[r.q];
      try {
        await api('/gwdev/nckh/v5/KHCN_BAI_BAO_KHOA_HOC', rec);
        r.st = 'ok'; ok++; cell.innerHTML = '<b style="color:#1a8f3c">✓ Đã đẩy</b>';
        body.querySelector('#t2hK' + i).textContent = r.code;
      } catch (e) {
        maxNo[r.y]--; r.code = '';
        r.st = 'err'; r.err = e.message; bad++; cell.innerHTML = '<b style="color:red">✗ ' + esc(e.message) + '</b>';
        if (/Hết phiên/.test(e.message)) { prog.textContent = e.message; break; }
      }
      if (cb) { cb.checked = false; cb.disabled = true; }
      prog.textContent = 'Đã xử lý ' + (ok + bad) + '/' + todo.length + ' – thành công ' + ok + ', lỗi ' + bad;
      await new Promise(s => setTimeout(s, 150));
    }
    prog.textContent = 'XONG: thành công ' + ok + ', lỗi ' + bad + '. Bấm "Tải bảng kết quả" để lưu lại.';
    refresh();
  };

  /* ===== PHAN 2: RA SOAT BAI DA CO TREN HEMIS ===== */
  const byKey = {}; recs.forEach(r => { byKey[norm(r.t)] = r; });
  const QN = { '01': 'Q1', '02': 'Q2', '03': 'Q3', '04': 'Q4' };
  const DMQT = { '01': 'QT: Web of Science', '02': 'QT: Scopus', '03': 'QT: ACI', '04': 'QT: Khác' };
  const DMTN = { '01': 'TN: HĐGSNN tính điểm', '02': 'TN: HĐGSNN không tính', '03': 'TN: Web of Science', '04': 'TN: Scopus', '05': 'TN: ACI', '06': 'TN: Khác' };
  const desc = (p, qt, tn, q) => (p === 1 ? 'Tạp chí' : p === 2 ? 'Kỷ yếu' : '?') + ' · ' + (DMQT[qt] || DMTN[tn] || 'chưa chọn') + (QN[q] ? ' · ' + QN[q] : '');
  const fixes = [], flags = [];
  const cntT = {}; existing.forEach(x => { const k = norm(x.teN_BAI_BAO); if (k.length > 5) (cntT[k] = cntT[k] || []).push(x.mA_BAI_BAO); });
  Object.values(cntT).filter(v => v.length > 1).forEach(v => flags.push({ code: v.join(', '), t: existing.find(x => x.mA_BAI_BAO === v[0]).teN_BAI_BAO, why: 'Bài bị nhập trùng ' + v.length + ' lần trên HEMIS (sẽ bị đếm thừa) – xóa bớt bằng tay trên HEMIS' }));
  existing.forEach(x => {
    const r = byKey[norm(x.teN_BAI_BAO)]; if (!r) return;
    const m = MAP(r.l || ''); if (!m) return;
    const want = { phaN_LOAI: m.p, taP_CHI_QUOC_TE: m.qt || null, taP_CHI_TRONG_NUOC: m.tn || null, xeP_HANG_Q: QM[r.q] || x.xeP_HANG_Q || null };
    const y = (String(r.d).match(/(\d{4})$/) || [])[1];
    const clsDiff = x.phaN_LOAI !== want.phaN_LOAI || (x.taP_CHI_QUOC_TE || null) !== want.taP_CHI_QUOC_TE || (x.taP_CHI_TRONG_NUOC || null) !== want.taP_CHI_TRONG_NUOC || (x.xeP_HANG_Q || null) !== want.xeP_HANG_Q;
    const yDiff = y && String(x.naM_CONG_BO) !== y;
    /* dong bo ten tap chi: chi khi ten tren KHCN da dung ten trong danh muc Bo KH&CN */
    const jDiff = m.p === 1 && !m.wos && r.j && (x.teN_TAP_CHI || '').trim() !== r.j.trim() && matchDM(r.j).lv === 'ok';
    if (jDiff) want.teN_TAP_CHI = r.j.trim();
    if (clsDiff || yDiff || jDiff) fixes.push({ x, want, y: yDiff ? +y : null, cls: clsDiff || jDiff, r, from: desc(x.phaN_LOAI, x.taP_CHI_QUOC_TE, x.taP_CHI_TRONG_NUOC, x.xeP_HANG_Q) + ' · năm ' + x.naM_CONG_BO + (jDiff ? ' · tạp chí: ' + (x.teN_TAP_CHI || '(trống)') : ''), to: desc(want.phaN_LOAI, want.taP_CHI_QUOC_TE, want.taP_CHI_TRONG_NUOC, want.xeP_HANG_Q) + ' · năm ' + (yDiff ? y : x.naM_CONG_BO) + (jDiff ? ' · tạp chí: ' + r.j.trim() : '') });
  });
  const sec = document.createElement('div');
  sec.style.cssText = 'margin-top:28px;border-top:3px solid #0b6bcb;padding-top:12px';
  sec.innerHTML = '<div style="font-size:17px;font-weight:bold;color:#0b6bcb">Rà soát bài ĐÃ CÓ trên HEMIS (để Bộ thống kê đúng)</div>' +
    '<div style="margin:6px 0;color:#555">So với KHCN: <b>' + fixes.length + '</b> bài bị ghi sai loại tạp chí / Q / năm / tên tạp chí. Đã tick sẵn các bài sai loại hoặc Q. Bài chỉ lệch năm để bạn tự quyết (thường do bài online năm trước, in năm sau).</div>' +
    '<div><button id="t2hFix" style="' + B + ';background:#c96a00;color:#fff"></button><span id="t2hFixP" style="margin-left:10px;font-weight:bold"></span></div>' +
    '<table style="border-collapse:collapse;width:100%;margin-top:8px;font-size:13px"><tr style="background:#fdf0e0">' +
    ['', 'Mã HEMIS', 'Tên bài báo', 'Loại (KHCN)', 'Đang ghi trên HEMIS', 'Sẽ sửa thành', 'Kết quả'].map(h => '<th style="padding:4px;border:1px solid #ccc">' + h + '</th>').join('') + '</tr>' +
    fixes.map((f, i) => '<tr><td style="border:1px solid #ddd;text-align:center"><input type="checkbox" class="t2hF" data-i="' + i + '"' + (f.cls ? ' checked' : '') + '></td><td style="border:1px solid #ddd;white-space:nowrap">' + esc(f.x.mA_BAI_BAO) + '</td><td style="border:1px solid #ddd">' + esc(f.x.teN_BAI_BAO) + '</td><td style="border:1px solid #ddd">' + esc(f.r.l) + '</td><td style="border:1px solid #ddd;color:#c00">' + esc(f.from) + '</td><td style="border:1px solid #ddd;color:#1a8f3c">' + esc(f.to) + '</td><td style="border:1px solid #ddd" id="t2hFS' + i + '"></td></tr>').join('') + '</table>' +
    '<div style="font-size:16px;font-weight:bold;margin-top:20px;color:#c00">Cần xem bằng tay (' + flags.length + ')</div>' +
    '<table style="border-collapse:collapse;width:100%;margin-top:6px;font-size:13px"><tr style="background:#fde8e8"><th style="border:1px solid #ccc">Mã HEMIS</th><th style="border:1px solid #ccc">Tên bài báo</th><th style="border:1px solid #ccc">Vấn đề</th></tr>' +
    flags.map(f => '<tr><td style="border:1px solid #ddd">' + esc(f.code) + '</td><td style="border:1px solid #ddd">' + esc(f.t) + '</td><td style="border:1px solid #ddd">' + esc(f.why) + '</td></tr>').join('') + '</table>';
  body.appendChild(sec);
  const fb = sec.querySelector('#t2hFix'), fp = sec.querySelector('#t2hFixP');
  const fboxes = () => [...sec.querySelectorAll('.t2hF')];
  const frefresh = () => { const n = fboxes().filter(c => c.checked && !c.disabled).length; fb.textContent = 'Sửa ' + n + ' bài đã tick trên HEMIS'; fb.disabled = !n; fb.style.opacity = n ? 1 : .5; };
  frefresh(); sec.addEventListener('change', frefresh);
  fb.onclick = async () => {
    const todo = fboxes().filter(c => c.checked && !c.disabled).map(c => +c.dataset.i);
    if (!todo.length || !confirm('Sửa ' + todo.length + ' bài đã có trên HEMIS theo dữ liệu KHCN?')) return;
    fb.disabled = true; let ok = 0, bad = 0;
    for (const i of todo) {
      const f = fixes[i], cell = sec.querySelector('#t2hFS' + i), cb = sec.querySelector('.t2hF[data-i="' + i + '"]');
      try {
        const g = await fetch('/gwdev/nckh/v5/KHCN_BAI_BAO_KHOA_HOC/DetailWithPermission/' + f.x.id + '?pid=00000000-0000-0000-0000-000000000000', { headers: H() });
        if (g.status === 401) throw new Error('Hết phiên đăng nhập HEMIS. Bấm F5 rồi bấm nút bookmark lại.');
        const d = (await g.json()).data; if (!d) throw new Error('Không đọc được bài');
        Object.assign(d, f.want); if (f.y) d.naM_CONG_BO = f.y;
        const r = await fetch('/gwdev/nckh/v5/KHCN_BAI_BAO_KHOA_HOC/' + f.x.id, { method: 'PUT', headers: H(), body: JSON.stringify(d) });
        const j = await r.json().catch(() => null);
        if (!r.ok || !j || j.success === false) throw new Error((j && (j.message || j.error)) || ('Mã lỗi ' + r.status));
        ok++; cell.innerHTML = '<b style="color:#1a8f3c">✓ Đã sửa</b>';
      } catch (e) { bad++; cell.innerHTML = '<b style="color:red">✗ ' + esc(e.message) + '</b>'; if (/Hết phiên/.test(e.message)) break; }
      if (cb) { cb.checked = false; cb.disabled = true; }
      fp.textContent = 'Đã xử lý ' + (ok + bad) + '/' + todo.length + ' – sửa được ' + ok + ', lỗi ' + bad;
      await new Promise(s => setTimeout(s, 150));
    }
    fp.textContent = 'XONG: sửa được ' + ok + ', lỗi ' + bad;
    frefresh();
  };
  body.appendChild(statsSection());
  const jump = document.createElement('div');
  jump.innerHTML = '<button style="' + B + ';background:#6a3fb5;color:#fff">Xem thống kê chỉ số Chuẩn CSGDĐH ↓</button> <span style="color:#888">Đẩy và sửa xong thì bấm “↻ Lấy lại số liệu từ HEMIS” trong phần thống kê.</span>';
  jump.querySelector('button').onclick = () => body.querySelector('#t2hStats').scrollIntoView({ behavior: 'smooth' });
  body.insertBefore(jump, body.firstChild);
})();
