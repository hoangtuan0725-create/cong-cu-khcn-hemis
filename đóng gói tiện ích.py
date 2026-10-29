# Đóng gói thư mục extension/ thành docs/tien-ich-khcn-hemis.zip (trang công cụ cho tải về).
# Chạy lại mỗi khi sửa tiện ích: python3 "đóng gói tiện ích.py"
import zipfile, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
with zipfile.ZipFile('docs/tien-ich-khcn-hemis.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for f in sorted(os.listdir('extension')):
        z.write(os.path.join('extension', f), 'Tiện ích KHCN HEMIS/' + f)
print('Đã đóng gói', len(z.namelist()), 'file')
