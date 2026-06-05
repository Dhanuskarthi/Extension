<div align="center">

<img src="public/icons/icon-128.png" width="128" alt="QORVA Logo">

# ⚡ QORVA Extension

**AI-Powered Quiz Automation & Voice Q&A for Chrome**

[![Manifest V3](https://img.shields.io/badge/manifest-v3-blue?style=for-the-badge)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)

[English](README.md) 

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

### 🔧 Supported Platforms

| Platform | Question Detection | Auto-Select | Submit Detection | Status |
|----------|-------------------|-------------|------------------|--------|
| **Moodle LMS** | ✅ | ✅ | ✅ | Fully Tested |
| **Google Forms** | ✅ | ✅ | ✅ | Fully Tested |
| **Study4.com** | ✅ | ✅ | ✅ | Fully Tested |
| **Canvas LMS** | ✅ | ✅ | ✅ | Fully Tested |
| **Blackboard** | ✅ | ✅ | ⚠️ | Beta |


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

</div>
