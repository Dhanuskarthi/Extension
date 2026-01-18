<div align="center">

<img src="public/icons/icon-128.png" width="128" alt="QORVA Logo">

# ⚡ QORVA Extension

**AI-Powered Quiz Automation & Voice Q&A for Chrome**

[![Manifest V3](https://img.shields.io/badge/manifest-v3-blue?style=for-the-badge)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)

**[English](README.md) • [Tiếng Việt](README.vi.md)**

[✨ Features](#-features) • [🚀 Quick Start](#-quick-start) • [📚 Documentation](#-documentation) • [🤝 Contributing](#-author)

</div>

---

## 🎯 Overview

QORVA is a powerful Chrome extension that leverages AI to provide **instant quiz answers** and **voice-based Q&A**. Built with modern web technologies and designed for speed, privacy, and ease of use.

### Why QORVA?

- 🚀 **Lightning Fast** - Instant answer detection and selection
- 🎨 **Beautiful UI** - Modern, compact overlay with dark/light themes
- 🔒 **Privacy First** - No data collection, all processing client-side
- 💰 **Free to Use** - Works with free Gemini API (250 req/day)
- 🌐 **Multi-Platform** - Supports Moodle, Google Forms, Canvas, Study4, and more

---

## ✨ Features

### 🎯 Smart Quiz Automation

- **Auto-Detection** - Automatically finds questions on any quiz platform
- **Intelligent Selection** - Clicks answers with human-like delays (50-200ms)
- **Multi-Page Support** - Handles next-page navigation automatically
- **Answer Caching** - Reduces API calls with 24-hour TTL cache
- **Index Clamping** - Prevents out-of-bounds answer errors

### 🎤 Voice Q&A

- **Push-to-Talk** - Quick access with `Alt+Space` hotkey
- **Speech-to-Text** - Powered by Web Speech API
- **AI Responses** - Instant answers from Gemini/OpenAI/Claude
- **Text-to-Speech** - Optional audio playback of answers

### 🎨 Modern UI/UX

- **Compact Overlay** - Non-intrusive answer cards
- **Theme Support** - Dark, Light, and System themes
- **Smooth Animations** - Fade-in/out with 0.25s transitions
- **Error Handling** - Rate limiting and auto-dismiss errors
- **Explanation Toggle** - Show/hide detailed explanations

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Chrome browser with Developer Mode enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/iamnguyenvu/qorva-extension.git
cd qorva-extension

# Install dependencies
npm install

# Build the extension
npm run build
```

### Load Extension

1. Open `chrome://extensions/` in Chrome
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `dist` folder from the project

### Configuration

1. Click the QORVA extension icon in Chrome toolbar
2. Navigate to **Options**
3. Enter your **Gemini API Key** ([Get free key](https://makersuite.google.com/app/apikey))
4. Customize settings as needed
5. Click **Save**

---

## 📚 Documentation

### 🛠️ Development

```bash
# Start development server with hot reload
npm run dev

# Run TypeScript type checking
npm run typecheck

# Lint code with ESLint
npm run lint

# Build for production
npm run build
```

### 📁 Project Structure

```
qorva-extension/
├── src/
│   ├── background/          # Service worker & API routing
│   │   ├── index.ts        # Main entry point
│   │   ├── llm-router.ts   # LLM API routing (Gemini/OpenAI/Claude)
│   │   ├── config-manager.ts  # Chrome storage management
│   │   └── cache-manager.ts   # Answer caching with TTL
│   ├── content/            # Content scripts
│   │   ├── index.ts       # Content script entry
│   │   ├── quiz/          # Quiz automation
│   │   │   ├── detector.ts   # DOM scanning with MutationObserver
│   │   │   ├── parser.ts     # Question/choice extraction
│   │   │   ├── selector.ts   # Auto-selection logic
│   │   │   └── submitter.ts  # Submit button detection
│   │   ├── audio/         # Voice capture & STT
│   │   └── overlay/       # UI overlay manager
│   ├── options/           # Settings page
│   ├── popup/             # Extension popup
│   └── shared/            # Shared types & utilities
├── public/                # Static assets
├── manifest.json         # Chrome Extension Manifest V3
└── vite.config.ts        # Vite build configuration
```

### 🔧 Supported Platforms

| Platform | Question Detection | Auto-Select | Submit Detection | Status |
|----------|-------------------|-------------|------------------|--------|
| **Moodle LMS** | ✅ | ✅ | ✅ | Fully Tested |
| **Google Forms** | ✅ | ✅ | ✅ | Fully Tested |
| **Study4.com** | ✅ | ✅ | ✅ | Fully Tested |
| **Canvas LMS** | ✅ | ✅ | ✅ | Fully Tested |
| **Blackboard** | ✅ | ✅ | ⚠️ | Beta |

### 🤖 AI Provider Configuration

| Provider | Free Tier | Recommended Model | API Key Required |
|----------|-----------|-------------------|------------------|
| **Google Gemini** ⭐ | ✅ 250 requests/day | `gemini-2.5-flash` | [Get Key](https://makersuite.google.com/app/apikey) |
| **OpenAI** | ❌ Paid only | `gpt-4o-mini` | [Get Key](https://platform.openai.com/api-keys) |
| **Anthropic Claude** | ❌ Paid only | `claude-3-haiku` | [Get Key](https://console.anthropic.com/) |

### ⚙️ Settings Reference

| Setting | Default | Description |
|---------|---------|-------------|
| **Auto-detect** | `ON` | Automatically detect quiz questions on page load |
| **Auto-submit** | `OFF` | Submit quiz when all questions are answered |
| **Show explanation** | `OFF` | Display detailed explanation with answers |
| **Cache TTL** | `24 hours` | How long to cache answers before refresh |
| **Click delay** | `50-200ms` | Random delay between clicks (human-like) |
| **Theme** | `System` | UI theme (Dark/Light/System) |

---

## 🔒 Privacy & Security

- ✅ **No Data Collection** - Zero telemetry or analytics
- ✅ **Local Storage Only** - API keys stored in Chrome's secure storage
- ✅ **Client-Side Processing** - All computation happens locally
- ✅ **No External Tracking** - No third-party analytics or cookies
- ✅ **Open Source** - Full transparency, audit the code yourself

---

## 🐛 Known Issues & Fixes

All major issues have been resolved in the latest version:

- ✅ ~~Duplicate modal notifications~~ - Fixed with global initialization guard
- ✅ ~~Answer index E for 4-choice questions~~ - Fixed with index clamping
- ✅ ~~Wrong answer selection (C instead of B)~~ - Fixed parser choice order
- ✅ ~~MutationObserver infinite loop~~ - Fixed overlay container exclusion

---

## 📊 Performance

- **Bundle Size**: 29.68 KB (gzipped: 9.48 KB)
- **Build Time**: ~400ms
- **Memory Usage**: <10 MB
- **API Latency**: 200-800ms (depends on provider)

---

## 🤝 Author

<div align="center">

**Nguyen Vu**

[![GitHub](https://img.shields.io/badge/GitHub-iamnguyenvu-181717?style=for-the-badge&logo=github)](https://github.com/iamnguyenvu)
[![Email](https://img.shields.io/badge/Email-iamgnuyenvu.gm@gmail.com-D14836?style=for-the-badge&logo=gmail)](mailto:iamgnuyenvu.gm@gmail.com)

</div>

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

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

### ⭐ Star this repo if QORVA helped you!

**Made with ❤️ by [Nguyen Vu](https://github.com/iamnguyenvu)**

</div>
