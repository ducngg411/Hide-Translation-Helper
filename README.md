# Hide Translation Helper - Chrome Extension

## 📖 Mô tả
Extension giúp ẩn định nghĩa tiếng Anh khi học từ vựng, chỉ hiển thị khi bạn cần xem.

## ✨ Tính năng
- ✅ Tự động ẩn phần định nghĩa tiếng Anh (phần sau dấu `=`)
- 👁️ Thêm nút toggle để hiện/ẩn định nghĩa cho từng từ
- 🔄 Có thể bật/tắt toàn bộ extension qua popup
- 🎯 Mặc định ẩn định nghĩa để tập trung học từ vựng

## 🚀 Cách cài đặt

### Bước 1: Tải extension
1. Tải toàn bộ thư mục `hideTranslateExt` về máy
2. Hoặc clone repository này

### Bước 2: Tạo icon (nếu cần)
Extension yêu cầu các icon PNG. Bạn có thể:
- Sử dụng tool online như https://cloudconvert.com/svg-to-png để convert file `icons/icon.svg` thành các kích thước:
  - icon16.png (16x16)
  - icon32.png (32x32)
  - icon48.png (48x48)
  - icon128.png (128x128)
- Hoặc tự tạo icon riêng với các kích thước trên

Đặt các file PNG vào thư mục `icons/`

### Bước 3: Cài đặt vào Chrome
1. Mở Chrome và truy cập `chrome://extensions/`
2. Bật chế độ **Developer mode** (góc trên bên phải)
3. Click **Load unpacked**
4. Chọn thư mục `hideTranslateExt`
5. Extension sẽ xuất hiện trong danh sách

## 📝 Cách sử dụng

### Trên trang web:
- Định nghĩa sẽ tự động được ẩn
- Click vào icon 👁️ bên cạnh từ tiếng Việt để xem định nghĩa
- Click lại để ẩn định nghĩa

### Từ popup extension:
- Click vào icon extension trên thanh toolbar
- Bật/tắt extension bằng toggle switch
- Trang web sẽ tự động reload khi thay đổi

## 🎯 Định dạng hỗ trợ
Extension hoạt động với các thẻ có định dạng:
```html
<div class="prewrap mb-2">
  từ tiếng Việt = định nghĩa tiếng Anh
</div>
```

## 🛠️ Công nghệ sử dụng
- Manifest V3
- Vanilla JavaScript
- Chrome Storage API
- MutationObserver (theo dõi thay đổi DOM)

## 📄 Cấu trúc thư mục
```
hideTranslateExt/
├── manifest.json          # Cấu hình extension
├── content.js            # Script xử lý trang web
├── content.css           # Style cho các element
├── popup.html            # Giao diện popup
├── popup.js              # Logic popup
├── icons/                # Thư mục chứa icon
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # File hướng dẫn này
```

## 🐛 Troubleshooting
- **Extension không hoạt động**: Kiểm tra xem đã bật extension trong popup chưa
- **Icon không hiển thị**: Đảm bảo đã tạo đủ 4 file icon PNG với đúng kích thước
- **Định nghĩa không bị ẩn**: Kiểm tra định dạng HTML có đúng với định dạng mẫu không

## 💡 Tips
- Extension hoạt động trên tất cả các trang web
- Trạng thái bật/tắt được lưu và đồng bộ giữa các thiết bị Chrome
- Nút toggle có hiệu ứng hover và click mượt mà

## 📧 Hỗ trợ
Nếu gặp vấn đề, hãy kiểm tra Console trong Developer Tools (F12) để xem lỗi.

---
Made with ❤️ for language learners
