<div align="center">

<img src="public/icons/icon-128.png" width="128" alt="QORVA Logo">

# ⚡ QORVA Extension

**Extension Chrome Hỗ Trợ AI - Trả Lời Tự Động & Hỏi Đáp Giọng Nói**

[![Manifest V3](https://img.shields.io/badge/manifest-v3-blue?style=for-the-badge)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)

**[English](README.md) • [Tiếng Việt](README.vi.md)**

[✨ Tính Năng](#-tính-năng) • [🚀 Bắt Đầu](#-bắt-đầu-nhanh) • [📚 Tài Liệu](#-tài-liệu) • [🤝 Tác Giả](#-tác-giả)

</div>

---

## 🎯 Tổng Quan

QORVA là extension Chrome mạnh mẽ sử dụng AI để cung cấp **trả lời tự động bài trắc nghiệm** và **hỏi đáp bằng giọng nói**. Được xây dựng với công nghệ web hiện đại, tập trung vào tốc độ, quyền riêng tư và dễ sử dụng.

### Tại Sao Chọn QORVA?

- 🚀 **Cực Nhanh** - Phát hiện và chọn đáp án tức thì
- 🎨 **Giao Diện Đẹp** - Overlay hiện đại, gọn nhẹ với dark/light theme
- 🔒 **Bảo Mật** - Không thu thập dữ liệu, xử lý hoàn toàn client-side
- 💰 **Miễn Phí** - Hoạt động với Gemini API free (250 req/ngày)
- 🌐 **Đa Nền Tảng** - Hỗ trợ Moodle, Google Forms, Canvas, Study4...

---

## ✨ Tính Năng

### 🎯 Tự Động Trắc Nghiệm Thông Minh

- **Tự Động Phát Hiện** - Tìm câu hỏi trên mọi nền tảng quiz
- **Chọn Thông Minh** - Click đáp án với độ trễ giống người (50-200ms)
- **Hỗ Trợ Nhiều Trang** - Tự động chuyển trang trong bài thi
- **Cache Đáp Án** - Giảm số lần gọi API với cache 24 giờ
- **Clamp Index** - Tránh lỗi index vượt quá số đáp án

### 🎤 Hỏi Đáp Giọng Nói

- **Push-to-Talk** - Truy cập nhanh với phím tắt `Alt+Space`
- **Nhận Diện Giọng Nói** - Powered by Web Speech API
- **AI Trả Lời** - Câu trả lời tức thì từ Gemini/OpenAI/Claude
- **Đọc Đáp Án** - Tùy chọn phát âm thanh câu trả lời

### 🎨 Giao Diện Hiện Đại

- **Overlay Gọn Nhẹ** - Card đáp án không làm phiền
- **Hỗ Trợ Theme** - Dark, Light và System theme
- **Animation Mượt** - Fade-in/out với 0.25s transitions
- **Xử Lý Lỗi** - Rate limiting và tự động đóng lỗi
- **Toggle Giải Thích** - Hiện/ẩn giải thích chi tiết

---

## 🚀 Bắt Đầu Nhanh

### Yêu Cầu

- Node.js 16+ và npm
- Chrome browser với Developer Mode đã bật

### Cài Đặt

```bash
# Clone repository
git clone https://github.com/iamnguyenvu/qorva-extension.git
cd qorva-extension

# Cài đặt dependencies
npm install

# Build extension
npm run build
```

### Load Extension

1. Mở `chrome://extensions/` trong Chrome
2. Bật **Developer mode** (toggle góc phải trên)
3. Click **Load unpacked**
4. Chọn thư mục `dist` từ project

### Cấu Hình

1. Click icon QORVA extension trên thanh công cụ Chrome
2. Vào **Options**
3. Nhập **Gemini API Key** ([Lấy key miễn phí](https://makersuite.google.com/app/apikey))
4. Tùy chỉnh cài đặt theo nhu cầu
5. Click **Lưu**

---

## 📚 Tài Liệu

### 🛠️ Development

```bash
# Chạy development server với hot reload
npm run dev

# Kiểm tra TypeScript type
npm run typecheck

# Lint code với ESLint
npm run lint

# Build production
npm run build
```

### 📁 Cấu Trúc Project

```
qorva-extension/
├── src/
│   ├── background/          # Service worker & API routing
│   │   ├── index.ts        # Entry point chính
│   │   ├── llm-router.ts   # Routing LLM API (Gemini/OpenAI/Claude)
│   │   ├── config-manager.ts  # Quản lý Chrome storage
│   │   └── cache-manager.ts   # Cache câu trả lời với TTL
│   ├── content/            # Content scripts
│   │   ├── index.ts       # Entry point content script
│   │   ├── quiz/          # Tự động hóa quiz
│   │   │   ├── detector.ts   # Scan DOM với MutationObserver
│   │   │   ├── parser.ts     # Trích xuất câu hỏi/đáp án
│   │   │   ├── selector.ts   # Logic chọn tự động
│   │   │   └── submitter.ts  # Phát hiện nút submit
│   │   ├── audio/         # Voice capture & STT
│   │   └── overlay/       # Quản lý UI overlay
│   ├── options/           # Trang cài đặt
│   ├── popup/             # Extension popup
│   └── shared/            # Types & utilities dùng chung
├── public/                # Static assets
├── manifest.json         # Chrome Extension Manifest V3
└── vite.config.ts        # Cấu hình build Vite
```

### 🔧 Nền Tảng Hỗ Trợ

| Nền Tảng | Phát Hiện Câu Hỏi | Auto-Select | Phát Hiện Submit | Trạng Thái |
|----------|-------------------|-------------|------------------|------------|
| **Moodle LMS** | ✅ | ✅ | ✅ | Đã Test Đầy Đủ |
| **Google Forms** | ✅ | ✅ | ✅ | Đã Test Đầy Đủ |
| **Study4.com** | ✅ | ✅ | ✅ | Đã Test Đầy Đủ |
| **Canvas LMS** | ✅ | ✅ | ✅ | Đã Test Đầy Đủ |
| **Blackboard** | ✅ | ✅ | ⚠️ | Beta |

### 🤖 Cấu Hình AI Provider

| Provider | Free Tier | Model Đề Xuất | Cần API Key |
|----------|-----------|---------------|-------------|
| **Google Gemini** ⭐ | ✅ 250 requests/ngày | `gemini-2.5-flash` | [Lấy Key](https://makersuite.google.com/app/apikey) |
| **OpenAI** | ❌ Trả phí | `gpt-4o-mini` | [Lấy Key](https://platform.openai.com/api-keys) |
| **Anthropic Claude** | ❌ Trả phí | `claude-3-haiku` | [Lấy Key](https://console.anthropic.com/) |

### ⚙️ Tham Khảo Cài Đặt

| Cài Đặt | Mặc Định | Mô Tả |
|---------|----------|-------|
| **Auto-detect** | `BẬT` | Tự động phát hiện câu hỏi khi load trang |
| **Auto-submit** | `TẮT` | Tự động submit khi trả lời hết câu hỏi |
| **Show explanation** | `TẮT` | Hiển thị giải thích chi tiết với đáp án |
| **Cache TTL** | `24 giờ` | Thời gian lưu cache trước khi refresh |
| **Click delay** | `50-200ms` | Độ trễ ngẫu nhiên giữa các click (giống người) |
| **Theme** | `System` | Giao diện (Dark/Light/System) |

---

## 🔒 Quyền Riêng Tư & Bảo Mật

- ✅ **Không Thu Thập Dữ Liệu** - Zero telemetry hay analytics
- ✅ **Chỉ Lưu Local** - API keys lưu trong Chrome secure storage
- ✅ **Xử Lý Client-Side** - Tất cả tính toán ở local
- ✅ **Không Tracking** - Không có analytics hay cookies bên thứ 3
- ✅ **Mã Nguồn Mở** - Hoàn toàn minh bạch, tự kiểm tra code

---

## 🐛 Các Lỗi Đã Sửa

Tất cả lỗi chính đã được khắc phục trong phiên bản mới nhất:

- ✅ ~~Modal thông báo trùng lặp~~ - Đã fix với global initialization guard
- ✅ ~~Trả về đáp án E cho câu 4 đáp án~~ - Đã fix với index clamping
- ✅ ~~Chọn sai đáp án (C thay vì B)~~ - Đã fix thứ tự parser choice
- ✅ ~~MutationObserver vòng lặp vô tận~~ - Đã fix loại trừ overlay container

---

## 📊 Hiệu Năng

- **Bundle Size**: 29.68 KB (gzipped: 9.48 KB)
- **Build Time**: ~400ms
- **Memory Usage**: <10 MB
- **API Latency**: 200-800ms (tùy provider)

---

## 🤝 Tác Giả

<div align="center">

**Nguyễn Vũ**

[![GitHub](https://img.shields.io/badge/GitHub-iamnguyenvu-181717?style=for-the-badge&logo=github)](https://github.com/iamnguyenvu)
[![Email](https://img.shields.io/badge/Email-iamgnuyenvu.gm@gmail.com-D14836?style=for-the-badge&logo=gmail)](mailto:iamgnuyenvu.gm@gmail.com)

</div>

---

## 📄 Giấy Phép

Dự án này được cấp phép theo MIT License - xem file [LICENSE](LICENSE) để biết chi tiết.

```
MIT License

Copyright (c) 2024 Nguyen Vu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions...
```

---

<div align="center">

### ⭐ Star repo này nếu QORVA hữu ích cho bạn!

**Made with ❤️ by [Nguyen Vu](https://github.com/iamnguyenvu)**

</div>
