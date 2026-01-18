# QORVA - Chrome Extension

Quiz Automation & Audio Realtime QA Extension for Chrome (Manifest V3).

## Features

### 📝 Quiz Automation Engine
- Auto-detect quiz questions on any webpage
- LLM-powered answer analysis (Gemini/OpenAI/Claude)
- Auto-select correct answers with configurable delay
- Optional auto-submit when all questions answered
- Works with radio buttons, checkboxes, and custom quiz formats

### 🎤 Audio Realtime QA Engine
- Capture system audio or microphone input
- Speech-to-text recognition
- Question detection in audio streams
- Real-time LLM responses with TTS
- Push-to-talk support (Alt+Space)

## Installation

### Development
```bash
# Install dependencies
npm install

# Run development build with HMR
npm run dev
```

### Load in Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/` folder

### Production Build
```bash
npm run build
```

## Configuration

1. Click the QORVA extension icon
2. Go to Options (⚙️)
3. Enter your LLM API key:
   - **Gemini** (Free tier): [Get API Key](https://makersuite.google.com/app/apikey)
   - **OpenAI** (Paid): [Get API Key](https://platform.openai.com/api-keys)
   - **Claude** (Paid): [Get API Key](https://console.anthropic.com/)

## Usage

### Quiz Mode
1. Navigate to any quiz page
2. QORVA will automatically detect questions
3. Answers appear in overlay cards
4. Click to auto-select or let QORVA do it automatically

### Audio QA Mode
1. Enable Audio QA in Options
2. Press **Alt+Space** (push-to-talk) or enable continuous listening
3. Ask your question
4. Get real-time answers via overlay and TTS

## Project Structure

```
src/
├── background/       # Service Worker
│   ├── index.ts
│   ├── config-manager.ts
│   ├── llm-router.ts
│   ├── message-handler.ts
│   └── cache-manager.ts
├── content/          # Content Scripts
│   ├── index.ts
│   ├── quiz/
│   │   ├── detector.ts
│   │   ├── parser.ts
│   │   ├── selector.ts
│   │   └── submitter.ts
│   ├── audio/
│   │   ├── capture.ts
│   │   ├── stt.ts
│   │   └── intent.ts
│   └── overlay/
│       └── overlay.ts
├── offscreen/        # Offscreen Document (Audio)
├── options/          # Options Page
├── popup/            # Extension Popup
├── shared/           # Shared Types & Utils
└── styles/           # Overlay CSS
```

## Permissions

- `storage`: Save configuration
- `activeTab`, `scripting`: Access current page
- `offscreen`, `tabCapture`: System audio capture
- `clipboardWrite`: Copy answers

## Tech Stack

- TypeScript
- Vite + @crxjs/vite-plugin
- Chrome Extension Manifest V3
- Web Speech API

## License

MIT
