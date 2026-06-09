<div align="center">

<img src="public/icons/icon-128.png" width="128" alt="siuuuuu Logo">

# ⚡ siuuuuu Extension

**AI-Powered Quiz Automation & Voice Q&A for Chrome — Developed by Dhanuskarthi**

[![Manifest V3](https://img.shields.io/badge/manifest-v3-blue?style=for-the-badge)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)


[English](README.md) 

[✨ Features](#-features) • [🚀 Quick Start](#-quick-start) • [📚 Documentation](#-documentation) • [🤝 Author](#-author)

</div>

---

## 🎯 Overview

siuuuuu is a powerful Chrome extension that leverages AI to provide **instant quiz answers** and **voice-based Q&A**. Built with modern web technologies and designed for speed, privacy, and ease of use.

### Why siuuuuu?

- 🚀 **Lightning Fast** - Instant answer detection and selection
- 🎨 **Premium UI** - Modern, glassmorphic overlay with dark/light themes and custom fonts (Outfit & Inter)
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

### 🎨 Premium UI/UX

- **Compact Overlay** - Non-intrusive glassmorphic answer cards
- **Theme Support** - Dark, Light, and System themes built with modern CSS variables
- **Smooth Animations** - Fade-in/out and dynamic transitions
- **Error Handling** - Rate limiting and auto-dismiss errors
- **Explanation Toggle** - Show/hide detailed explanations

---


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

## 🤝 Author

Developed and maintained with ❤️ by **Dhanuskarthi**.
