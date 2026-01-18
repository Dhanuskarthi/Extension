# ⚡ QORVA Extension

**[English](README.md) | [Tiếng Việt](README.vi.md)**

AI-powered Chrome extension for **instant quiz answers** and **voice-based Q&A**. Supports Moodle, Google Forms, Canvas, and more.

---

## ✨ Features

### 🎯 Quiz Automation
- **Auto-detect** questions on any quiz platform
- **Multi-platform** support: Moodle, Canvas LMS, Google Forms, Study4, Blackboard
- **Intelligent answer selection** with human-like delays
- **Next page navigation** auto-detection
- **Answer caching** to reduce API calls

### 🎤 Voice QA (Realtime)
- **Speech-to-Text** question detection
- **AI-powered** instant answers
- **Text-to-Speech** response playback
- **Push-to-talk** hotkey support (Alt+Space)

### 🎨 Customization
- **Dark/Light/System** theme support
- **Compact overlay** with minimal distraction
- **Custom accent colors** (PRO)
- **Explanation toggle** for detailed answers

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Extension
```bash
npm run build
```

### 3. Load in Chrome
1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist` folder

### 4. Configure API Key
1. Click the QORVA extension icon
2. Go to **Options**
3. Enter your **Gemini API key** ([Get free key](https://makersuite.google.com/app/apikey))
4. Save settings

---

## 🛠️ Development

```bash
# Start dev server with hot reload
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Production build
npm run build
```

---

## 📁 Project Structure

```
qorva-extension/
├── src/
│   ├── background/       # Service worker & API routing
│   ├── content/          # Content scripts & overlay
│   │   ├── quiz/         # Quiz detection, selection, submit
│   │   ├── audio/        # Voice capture & STT
│   │   └── overlay/      # UI overlay manager
│   ├── options/          # Settings page
│   ├── popup/            # Extension popup
│   └── shared/           # Types, constants, utilities
├── public/               # Static assets
├── manifest.json         # Extension manifest (MV3)
└── vite.config.ts        # Build configuration
```

---

## 🔧 Supported Platforms

| Platform | Detection | Auto-Select | Status |
|----------|-----------|-------------|--------|
| Moodle LMS | ✅ | ✅ | Tested |
| Google Forms | ✅ | ✅ | Tested |
| Study4.com | ✅ | ✅ | Tested |
| Canvas LMS | ✅ | ✅ | Tested |
| Blackboard | ✅ | ✅ | Beta |

---

## 🤖 AI Providers

| Provider | Free Tier | Recommended Model |
|----------|-----------|-------------------|
| **Gemini** | ✅ 250 req/day | `gemini-2.5-flash` |
| OpenAI | ❌ | `gpt-4o-mini` |
| Claude | ❌ | `claude-3-haiku` |

---

## ⚙️ Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| Auto-detect | `ON` | Automatically detect quiz questions |
| Auto-submit | `OFF` | Submit quiz when all answered |
| Show explanation | `OFF` | Display answer explanation |
| Cache TTL | `24h` | Answer cache duration |
| Click delay | `50-200ms` | Human-like selection delay |

---

## 🔐 Privacy

- ❌ No data collection
- ❌ No tracking or analytics
- ✅ API keys stored locally
- ✅ All processing done client-side

---

## 📄 License

MIT License © 2024 [Nguyen Vu](https://github.com/iamnguyenvu)

---

<p align="center">
  <strong>⭐ Star this repo if QORVA helped you!</strong>
</p>
