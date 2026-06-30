/**
 * QORVA - Overlay Manager
 * Manages non-invasive UI overlays with error rate limiting
 */

import type { QuizCardData, AudioCardData } from '../../shared/types';
import { quizDetector } from '../quiz/detector';

// Error tracking for rate limiting
interface ErrorState {
  lastError: string;
  count: number;
  lastTime: number;
}

class OverlayManager {
  private container: HTMLElement | null = null;
  private transcribeContainer: HTMLElement | null = null;
  private quizCards: Map<string, HTMLElement> = new Map();
  private audioCard: HTMLElement | null = null;
  private errorState: ErrorState = { lastError: '', count: 0, lastTime: 0 };
  private maxErrorsShown = 1;
  private errorDismissTimeout = 5000;
  private controlWidget: HTMLElement | null = null;
  private settingsModal: HTMLElement | null = null;

  /**
   * Initialize overlay containers (main on right, transcribe on left)
   */
  init(): void {
    if (this.container) return;
    
    // Main container (right side for quiz cards)
    this.container = document.createElement('div');
    this.container.id = 'qorva-overlay-container';
    this.container.setAttribute('aria-live', 'polite');
    
    // Transcribe container (left side for transcription results)
    this.transcribeContainer = document.createElement('div');
    this.transcribeContainer.id = 'qorva-transcribe-container';
    
    this.injectStyles();
    document.body.appendChild(this.container);
    document.body.appendChild(this.transcribeContainer);
    
    console.log('[QORVA] Overlay manager initialized');
  }

  /**
   * Show quiz answer card
   */
  showQuizCard(id: string, data: QuizCardData): void {
    this.init();
    
    // Rate limit error modals
    if (data.status === 'error' && !this.shouldShowError(data.errorMessage || '')) {
      return;
    }
    
    let card = this.quizCards.get(id);
    
    if (!card) {
      card = this.createQuizCard(id);
      this.quizCards.set(id, card);
      this.container!.appendChild(card);
    }
    
    this.updateQuizCard(card, data);
    
    // Auto-dismiss error cards
    if (data.status === 'error') {
      setTimeout(() => this.removeQuizCard(id), this.errorDismissTimeout);
    }
  }

  /**
   * Check if error should be shown (rate limiting)
   */
  private shouldShowError(error: string): boolean {
    const now = Date.now();
    const isApiError = error.toLowerCase().includes('api') || 
                       error.toLowerCase().includes('key') ||
                       error.toLowerCase().includes('model');
    
    if (isApiError) {
      if (this.errorState.lastError === error && now - this.errorState.lastTime < 30000) {
        this.errorState.count++;
        if (this.errorState.count > this.maxErrorsShown) {
          return false;
        }
      } else {
        this.errorState = { lastError: error, count: 1, lastTime: now };
      }
    }
    return true;
  }

  /**
   * Remove quiz card (instant for fast close)
   */
  removeQuizCard(id: string): void {
    const card = this.quizCards.get(id);
    if (card) {
      card.remove();
      this.quizCards.delete(id);
    }
  }

  /**
   * Show quota exhausted modal
   */
  showQuotaExhaustedModal(): void {
    this.init();
    if (!this.container) return;
    
    // Only show once per session
    if (document.querySelector('.qorva-quota-modal')) return;
    
    const modal = document.createElement('div');
    modal.className = 'qorva-card qorva-quota-modal';
    modal.innerHTML = `
      <div class="qorva-card-header">
        <span class="qorva-icon">⚠️</span>
        <span class="qorva-title" style="color: #f59e0b;">API Quota Exhausted</span>
        <button class="qorva-close" aria-label="Close">✕</button>
      </div>
      <div class="qorva-body" style="text-align: center;">
        <p style="margin: 0 0 12px; font-size: 12px; color: rgba(255,255,255,0.7);">
          All your API keys have reached their daily limit.
        </p>
        <div style="display: flex; gap: 8px; justify-content: center;">
          <button class="qorva-quota-settings" style="
            padding: 6px 12px;
            background: #a78bfa;
            border: none;
            border-radius: 6px;
            color: #fff;
            cursor: pointer;
            font-size: 11px;
          ">⚙️ Add More Keys</button>
          <button class="qorva-quota-dismiss" style="
            padding: 6px 12px;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 6px;
            color: #fff;
            cursor: pointer;
            font-size: 11px;
          ">Wait for Reset</button>
        </div>
        <p style="margin: 12px 0 0; font-size: 10px; color: rgba(255,255,255,0.4);">
          Free tier resets daily at midnight.
        </p>
      </div>
    `;
    
    this.container.appendChild(modal);
    
    // Animate in
    requestAnimationFrame(() => modal.classList.add('qorva-visible'));
    
    // Event listeners
    modal.querySelector('.qorva-close')?.addEventListener('click', () => modal.remove());
    modal.querySelector('.qorva-quota-dismiss')?.addEventListener('click', () => modal.remove());
    modal.querySelector('.qorva-quota-settings')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
      modal.remove();
    });
  }

  /**
   * Show transcribe result on left side
   */
  showTranscribeResult(questionId: string, transcript: string): void {
    this.init();
    if (!this.transcribeContainer) return;
    
    // Create transcribe card
    const card = document.createElement('div');
    card.className = 'qorva-transcribe-card';
    card.setAttribute('data-question-id', questionId);
    
    card.innerHTML = `
      <div class="qorva-transcribe-header">
        🎤 <span>Transcript</span>
        <button class="qorva-transcribe-close">✕</button>
      </div>
      <div class="qorva-transcribe-text">${transcript}</div>
    `;
    
    // Close button handler
    card.querySelector('.qorva-transcribe-close')?.addEventListener('click', () => {
      card.remove();
    });
    
    this.transcribeContainer.appendChild(card);
    
    // Animate in
    requestAnimationFrame(() => {
      card.classList.add('qorva-visible');
    });
    
    // Auto-dismiss after 30 seconds
    setTimeout(() => {
      if (card.parentElement) {
        card.remove();
      }
    }, 30000);
  }

  /**
   * Show audio QA card
   */
  showAudioCard(data: AudioCardData): void {
    this.init();
    
    if (!this.audioCard) {
      this.audioCard = this.createAudioCard();
      this.container!.appendChild(this.audioCard);
    }
    
    this.updateAudioCard(data);
  }

  /**
   * Hide audio card
   */
  hideAudioCard(): void {
    if (this.audioCard) {
      this.audioCard.classList.remove('qorva-visible');
    }
  }

  /**
   * Create quiz card element (compact design)
   */
  private createQuizCard(id: string): HTMLElement {
    const card = document.createElement('div');
    card.className = 'qorva-card qorva-quiz-card';
    card.setAttribute('data-card-id', id);
    
    // Extract question number from id (e.g., "question-wrapper-9283" -> "Q.9283")
    const match = id.match(/(\d+)$/);
    const questionNum = match ? `Q.${match[1]}` : 'Q';
    
    card.innerHTML = `
      <div class="qorva-card-header">
        <span class="qorva-icon">⚡</span>
        <span class="qorva-title">siuuuuu</span>
        <span class="qorva-question-num">${questionNum}</span>
        <button class="qorva-close" aria-label="Close">✕</button>
      </div>
      <div class="qorva-body">
        <div class="qorva-loader"></div>
      </div>
    `;
    
    card.querySelector('.qorva-close')?.addEventListener('click', () => {
      this.removeQuizCard(id);
    });
    
    return card;
  }

  /**
   * Update quiz card content
   */
  private updateQuizCard(card: HTMLElement, data: QuizCardData): void {
    const body = card.querySelector('.qorva-body');
    if (!body) return;
    
    if (data.status === 'loading') {
      body.innerHTML = `<div class="qorva-loader"></div>`;
    } else if (data.status === 'error') {
      const shortError = this.truncateError(data.errorMessage || 'Error');
      body.innerHTML = `<div class="qorva-error-msg">❌ ${shortError}</div>`;
    } else if (data.status === 'success' && data.answer) {
      const choicesCount = data.question.choices.length;
      
      // Get and CLAMP indices to valid range
      let indices = Array.isArray(data.answer.answer_index) 
        ? data.answer.answer_index 
        : [data.answer.answer_index];
      
      // Clamp each index to valid range [0, choicesCount-1]
      indices = indices.map(i => {
        if (typeof i !== 'number' || isNaN(i)) return 0;
        if (i < 0) return 0;
        if (i >= choicesCount) return choicesCount - 1; // Clamp to last valid index
        return i;
      });
      
      // Remove duplicates
      indices = [...new Set(indices)];
      
      const answers = indices.map(i => {
        const letter = String.fromCharCode(65 + i); // A, B, C, D...
        let choice = data.question.choices[i] || '';
        
        // Strip existing letter prefix (e.g., "A. ", "B. ") to avoid duplication
        choice = choice.replace(/^[A-Z]\.\s*/, '');
        
        // Truncate if too long
        if (choice.length > 60) {
          choice = choice.substring(0, 60);
        }
        
        return `<span class="qorva-badge">${letter}. ${choice}</span>`;
      }).join('');
      
      // Check if explanation exists
      const hasExplanation = data.answer.explanation && data.answer.explanation.length > 0;
      
      // Audio indicator and transcribe button for listening questions
      const hasAudio = data.question.meta?.hasAudioContext;
      const audioUrl = data.question.meta?.audioUrl;
      
      let audioSection = '';
      if (hasAudio && audioUrl) {
        audioSection = `
          <div class="qorva-audio-indicator">
            🎧 <small>Listening Question</small>
            <button class="qorva-transcribe-btn" data-audio-url="${audioUrl}">
              🎤 Transcribe
            </button>
          </div>
        `;
      } else if (hasAudio) {
        audioSection = '<div class="qorva-audio-indicator">🎧 <small>Listening</small></div>';
      }
      
      // Show explanation directly if it exists
      let explanationSection = '';
      if (hasExplanation) {
        explanationSection = `<p class="qorva-explanation">${data.answer.explanation}</p>`;
      }
      
      body.innerHTML = `
        ${audioSection}
        <div class="qorva-answers">${answers}</div>
        ${explanationSection}
      `;
      
      // Add transcribe button listener
      const transcribeBtn = body.querySelector('.qorva-transcribe-btn');
      if (transcribeBtn) {
        transcribeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const url = (transcribeBtn as HTMLElement).dataset.audioUrl;
          if (url) {
            this.handleTranscribeClick(url, data.question.id);
          }
        });
      }
    }
    
    card.classList.add('qorva-visible');
  }

  /**
   * Handle transcribe button click
   */
  private async handleTranscribeClick(audioUrl: string, questionId: string): Promise<void> {
    // Check PRO status first - Audio transcription is PRO-only
    try {
      const response = await chrome.runtime.sendMessage({ type: 'CFG_GET' });
      if (response?.ok && response.data) {
        const config = response.data;
        if (!config.pro?.isPro && !config.pro?.devMode) {
          this.showToast('🔒 Audio transcription requires PRO');
          // Show upgrade prompt
          chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
          return;
        }
      }
    } catch (error) {
      console.error('[QORVA] Failed to check PRO status:', error);
    }
    
    // Dynamic import to avoid loading Whisper until needed
    const { transcribeFromUrl, getWhisperStatus } = await import('../audio/whisper');
    
    const status = getWhisperStatus();
    
    if (status === 'unloaded') {
      this.showToast('🔄 Loading Whisper model... (First time: ~40MB download)');
    } else {
      this.showToast('🎤 Transcribing audio...');
    }
    
    console.log('[QORVA] Transcribe requested for:', audioUrl, 'Question:', questionId);
    
    const result = await transcribeFromUrl(audioUrl, (progress) => {
      if (progress.status === 'loading') {
        this.showToast(`📥 ${progress.message || 'Loading model...'}`);
      } else if (progress.status === 'transcribing') {
        this.showToast(`🎤 ${progress.message || 'Transcribing...'}`);
      } else if (progress.status === 'error') {
        this.showToast(`❌ ${progress.message || 'Transcription failed'}`);
      }
    });
    
    if (result && result.text) {
      console.log('[QORVA] Transcription result:', result.text);
      this.showToast('✅ Transcription complete!');
      
      // Store transcript for potential use in LLM query
      this.storeTranscript(questionId, result.text);
      
      // Show transcript in the left column
      this.showTranscribeResult(questionId, result.text);
    } else {
      this.showToast('❌ Transcription failed. Check console for details.');
    }
  }

  /**
   * Store transcript for question
   */
  private transcripts: Map<string, string> = new Map();
  
  private storeTranscript(questionId: string, transcript: string): void {
    this.transcripts.set(questionId, transcript);
    console.log('[QORVA] Transcript stored for question:', questionId);
  }

  /**
   * Get stored transcript
   */
  getTranscript(questionId: string): string | undefined {
    return this.transcripts.get(questionId);
  }

  /**
   * Truncate error message for compact display
   */
  private truncateError(error: string): string {
    if (error.length > 60) {
      return error.substring(0, 57) + '...';
    }
    return error;
  }

  /**
   * Create audio card element
   */
  private createAudioCard(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'qorva-card qorva-audio-card';
    
    card.innerHTML = `
      <div class="qorva-card-header">
        <span class="qorva-icon">🎤</span>
        <span class="qorva-title">Audio QA</span>
        <button class="qorva-close" aria-label="Close">✕</button>
      </div>
      <div class="qorva-body">
        <div class="qorva-transcript"></div>
        <div class="qorva-answer-section"></div>
      </div>
    `;
    
    card.querySelector('.qorva-close')?.addEventListener('click', () => {
      this.hideAudioCard();
    });
    
    return card;
  }

  /**
   * Update audio card content
   */
  private updateAudioCard(data: AudioCardData): void {
    if (!this.audioCard) return;
    
    const transcript = this.audioCard.querySelector('.qorva-transcript');
    const answerSection = this.audioCard.querySelector('.qorva-answer-section');
    
    if (transcript) {
      transcript.innerHTML = data.transcript 
        ? `<p class="qorva-transcript-text">"${data.transcript}"</p>`
        : '';
    }
    
    if (answerSection) {
      switch (data.status) {
        case 'listening':
          answerSection.innerHTML = `<span class="qorva-status">🎙️ Listening...</span>`;
          break;
        case 'processing':
          answerSection.innerHTML = `<div class="qorva-loader"></div>`;
          break;
        case 'ready':
          if (data.answer) {
            answerSection.innerHTML = `<div class="qorva-answer-text">${data.answer.answer}</div>`;
          }
          break;
        case 'error':
          answerSection.innerHTML = `<div class="qorva-error-msg">❌ ${data.errorMessage}</div>`;
          setTimeout(() => this.hideAudioCard(), this.errorDismissTimeout);
          break;
      }
    }
    
    this.audioCard.classList.add('qorva-visible');
  }

  /**
   * Show toast notification
   */
  showToast(message: string, duration = 2000): void {
    this.init();
    
    // Remove existing toasts
    this.container?.querySelectorAll('.qorva-toast').forEach(t => t.remove());
    
    const toast = document.createElement('div');
    toast.className = 'qorva-toast';
    toast.textContent = message;
    
    this.container!.appendChild(toast);
    
    requestAnimationFrame(() => {
      toast.classList.add('qorva-visible');
    });
    
    setTimeout(() => {
      toast.classList.remove('qorva-visible');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  /**
   * Inject overlay styles (compact, modern design)
   */
  private injectStyles(): void {
    if (document.getElementById('qorva-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'qorva-styles';
    style.textContent = `
      #qorva-overlay-container {
        position: fixed;
        top: 12px;
        right: 12px;
        bottom: 12px;
        z-index: 2147483647;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
        pointer-events: none;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 13px;
        overflow-y: auto;
        max-height: calc(100vh - 24px);
        padding-right: 2px;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.2) transparent;
      }
      
      #qorva-overlay-container::-webkit-scrollbar {
        width: 4px;
      }
      
      #qorva-overlay-container::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.2);
        border-radius: 2px;
      }
      
      #qorva-transcribe-container {
        position: fixed;
        top: 12px;
        left: 12px;
        bottom: 12px;
        z-index: 2147483646;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 13px;
        max-width: 350px;
        overflow-y: auto;
        max-height: calc(100vh - 24px);
      }
      
      .qorva-transcribe-card {
        pointer-events: auto;
        background: rgba(15, 25, 35, 0.95);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(100, 200, 255, 0.2);
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 100, 200, 0.2);
        padding: 12px;
        color: #fff;
        opacity: 0;
        transform: translateX(-12px);
        transition: all 0.25s ease;
      }
      
      .qorva-transcribe-card.qorva-visible {
        opacity: 1;
        transform: translateX(0);
      }
      
      .qorva-transcribe-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        font-weight: 600;
        font-size: 12px;
        color: #60a5fa;
      }
      
      .qorva-transcribe-text {
        font-size: 12px;
        line-height: 1.5;
        color: rgba(255, 255, 255, 0.9);
        max-height: 150px;
        overflow-y: auto;
      }
      
      .qorva-transcribe-close {
        margin-left: auto;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        cursor: pointer;
        font-size: 14px;
        padding: 2px 6px;
        border-radius: 4px;
      }
      
      .qorva-transcribe-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
      }
      
      .qorva-card {
        pointer-events: auto;
        background: rgba(15, 15, 25, 0.95);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 14px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
        min-width: 240px;
        max-width: 320px;
        opacity: 0;
        transform: translateX(12px) scale(0.95);
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        color: #fff;
        overflow: visible;
        flex-shrink: 0;
      }
      
      .qorva-card.qorva-visible {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
      
      .qorva-card-header {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 10px;
        background: rgba(255, 255, 255, 0.03);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }
      
      .qorva-icon { font-size: 14px; }
      
      .qorva-title {
        flex: 1;
        font-weight: 600;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #a78bfa;
      }
      
      .qorva-close {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.4);
        cursor: pointer;
        padding: 2px 6px;
        font-size: 12px;
        border-radius: 4px;
        transition: all 0.15s;
      }
      
      .qorva-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
      }
      
      .qorva-question-num {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.5);
        margin-left: auto;
        margin-right: 8px;
        font-weight: 500;
      }
      
      .qorva-body {
        padding: 10px;
        min-height: 32px;
        display: block;
      }
      
      .qorva-loader {
        width: 18px;
        height: 18px;
        border: 2px solid rgba(167, 139, 250, 0.2);
        border-top-color: #a78bfa;
        border-radius: 50%;
        animation: qorva-spin 0.7s linear infinite;
        margin: 4px auto;
      }
      
      @keyframes qorva-spin {
        to { transform: rotate(360deg); }
      }
      
      .qorva-answers {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .qorva-badge {
        display: block;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        padding: 6px 10px;
        border-radius: 6px;
        font-weight: 500;
        font-size: 12px;
        line-height: 1.3;
      }
      
      .qorva-error-msg {
        color: #f87171;
        font-size: 12px;
        text-align: center;
        padding: 4px;
      }
      
      .qorva-status {
        color: #4ade80;
        font-size: 12px;
      }

      .qorva-transcribe-btn  {
        border-radius: 6px;
      }
      
      .qorva-transcript-text {
        font-style: italic;
        color: rgba(255, 255, 255, 0.5);
        font-size: 11px;
        margin-bottom: 8px;
      }
      
      .qorva-answer-text {
        font-size: 13px;
        line-height: 1.5;
      }
      
      .qorva-explanation-wrapper {
        margin-top: 10px;
      }
      
      .qorva-explanation-toggle {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 8px 10px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        color: rgba(255, 255, 255, 0.7);
        font-size: 11px;
        cursor: pointer;
        transition: all 0.15s;
      }
      
      .qorva-explanation-toggle:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #ffffff;
      }
      
      .qorva-toggle-icon {
        font-size: 10px;
      }
      
      .qorva-explanation-content {
        overflow: hidden;
        transition: max-height 0.25s ease, opacity 0.2s ease;
      }
      
      .qorva-explanation-wrapper[data-collapsed="true"] .qorva-explanation-content {
        max-height: 0;
        opacity: 0;
      }
      
      .qorva-explanation-wrapper[data-collapsed="false"] .qorva-explanation-content {
        max-height: 500px;
        opacity: 1;
      }
      
      .qorva-explanation {
        color: #ffffff;
        font-size: 12px;
        line-height: 1.5;
        margin: 8px 0 0 0;
        padding: 10px 12px;
        background: #1e293b;
        border-radius: 6px;
        border: 1px solid #475569;
      }
      
      .qorva-explanation:empty {
        display: none;
      }
      
      .qorva-toast {
        position: fixed;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%) translateY(8px);
        background: rgba(15, 15, 25, 0.95);
        backdrop-filter: blur(12px);
        color: #fff;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 12px;
        opacity: 0;
        transition: all 0.2s ease;
        pointer-events: auto;
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      
      .qorva-toast.qorva-visible {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
      
      /* In-page Floating Control Widget */
      .qorva-control-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 2147483647;
        font-family: system-ui, -apple-system, sans-serif;
        pointer-events: auto;
      }
      
      .qorva-fab {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #fff;
        font-size: 20px;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        outline: none;
      }
      
      .qorva-fab:hover {
        transform: scale(1.08) rotate(15deg);
        box-shadow: 0 6px 20px rgba(139, 92, 246, 0.6);
      }
      
      .qorva-menu {
        position: absolute;
        bottom: 54px;
        right: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
        opacity: 0;
        transform: translateY(10px) scale(0.9);
        pointer-events: none;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        background: rgba(15, 15, 25, 0.95);
        backdrop-filter: blur(12px);
        padding: 8px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        min-width: 140px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      }
      
      .qorva-menu-open .qorva-menu {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }
      
      .qorva-menu-item {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.85);
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 12px;
        text-align: left;
        cursor: pointer;
        transition: all 0.15s ease;
        white-space: nowrap;
      }
      
      .qorva-menu-item:hover {
        background: rgba(255, 255, 255, 0.12);
        color: #fff;
        transform: translateX(-2px);
      }
      
      .qorva-menu-item.qorva-active {
        background: rgba(139, 92, 246, 0.2);
        border-color: rgba(139, 92, 246, 0.4);
        color: #c084fc;
        font-weight: 500;
      }
      
      /* In-page Settings Modal */
      .qorva-settings-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.25s ease;
        font-family: system-ui, -apple-system, sans-serif;
      }
      
      .qorva-settings-overlay.qorva-settings-open {
        opacity: 1;
        pointer-events: auto;
      }
      
      .qorva-settings-modal {
        background: rgba(20, 20, 30, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        display: flex;
        flex-direction: column;
        transform: translateY(20px) scale(0.95);
        transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        color: #fff;
        max-height: 85vh;
      }
      
      .qorva-settings-overlay.qorva-settings-open .qorva-settings-modal {
        transform: translateY(0) scale(1);
      }
      
      .qorva-settings-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 18px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      
      .qorva-settings-header h3 {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: #a78bfa;
      }
      
      .qorva-settings-close {
        background: none;
        border: none;
        color: rgba(255,255,255,0.4);
        font-size: 16px;
        cursor: pointer;
        padding: 4px;
        transition: color 0.15s;
      }
      
      .qorva-settings-close:hover {
        color: #fff;
      }
      
      .qorva-settings-body {
        padding: 18px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      
      .qorva-form-row {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      
      .qorva-form-row label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: rgba(255, 255, 255, 0.6);
        font-weight: 500;
      }
      
      .qorva-form-row input[type="text"],
      .qorva-form-row input[type="password"],
      .qorva-form-row select {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 8px;
        color: #fff;
        padding: 8px 10px;
        font-size: 13px;
        outline: none;
        transition: border-color 0.15s;
      }
      
      .qorva-form-row input:focus,
      .qorva-form-row select:focus {
        border-color: #a78bfa;
      }
      
      .qorva-checkbox-row label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        text-transform: none;
        color: rgba(255,255,255,0.85);
        cursor: pointer;
      }
      
      .qorva-checkbox-row input[type="checkbox"] {
        accent-color: #a78bfa;
        cursor: pointer;
      }
      
      .qorva-provider-section {
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 10px;
        padding: 10px;
        border: 1px dashed rgba(255, 255, 255, 0.08);
      }
      
      .qorva-hidden {
        display: none !important;
      }
      
      .qorva-settings-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 14px 18px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }
      
      .qorva-settings-btn-cancel {
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        color: #fff;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 12px;
        transition: background 0.15s;
      }
      
      .qorva-settings-btn-cancel:hover {
        background: rgba(255,255,255,0.1);
      }
      
      .qorva-settings-btn-save {
        background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
        border: none;
        color: #fff;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        transition: box-shadow 0.15s;
      }
      
      .qorva-settings-btn-save:hover {
        box-shadow: 0 0 12px rgba(139, 92, 246, 0.4);
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Create floating control widget for SEB dashboard
   */
  createControlWidget(): void {
    if (this.controlWidget) return;
    
    this.controlWidget = document.createElement('div');
    this.controlWidget.id = 'qorva-control-widget';
    this.controlWidget.className = 'qorva-control-widget';
    
    this.controlWidget.innerHTML = `
      <button class="qorva-fab" title="siuuuuu Control Panel">⚡</button>
      <div class="qorva-menu">
        <button class="qorva-menu-item qorva-btn-rescan" title="Rescan Questions">🔍 Rescan</button>
        <button class="qorva-menu-item qorva-btn-toggle-quiz" title="Toggle Auto-Click">📝 Quiz: ON</button>
        <button class="qorva-menu-item qorva-btn-toggle-audio" title="Toggle Voice QA">🎤 Voice: OFF</button>
        <button class="qorva-menu-item qorva-btn-settings" title="In-Page Settings">⚙️ Settings</button>
      </div>
    `;
    
    document.body.appendChild(this.controlWidget);
    
    const fab = this.controlWidget.querySelector('.qorva-fab') as HTMLElement;
    
    // Toggle menu visibility
    fab.addEventListener('click', (e) => {
      e.stopPropagation();
      this.controlWidget!.classList.toggle('qorva-menu-open');
    });
    
    // Dismiss menu when clicking outside
    document.addEventListener('click', () => {
      if (this.controlWidget) {
        this.controlWidget.classList.remove('qorva-menu-open');
      }
    });
    
    // Bind control panel actions
    this.controlWidget.querySelector('.qorva-btn-rescan')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showToast('🔍 Rescanning DOM...');
      quizDetector.rescan();
      this.controlWidget!.classList.remove('qorva-menu-open');
    });
    
    const toggleQuizBtn = this.controlWidget.querySelector('.qorva-btn-toggle-quiz') as HTMLButtonElement;
    const toggleAudioBtn = this.controlWidget.querySelector('.qorva-btn-toggle-audio') as HTMLButtonElement;
    
    this.updateWidgetStates();
    
    toggleQuizBtn?.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        const response = await chrome.runtime.sendMessage({ type: 'CFG_GET' });
        if (response?.ok && response.data) {
          const config = response.data;
          config.quiz.auto = !config.quiz.auto;
          await chrome.runtime.sendMessage({ type: 'CFG_SET', payload: config });
          this.showToast(`Quiz automation ${config.quiz.auto ? 'ON' : 'OFF'}`);
          this.updateWidgetStates();
        }
      } catch (err) {
        console.error(err);
      }
    });
    
    toggleAudioBtn?.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        const response = await chrome.runtime.sendMessage({ type: 'CFG_GET' });
        if (response?.ok && response.data) {
          const config = response.data;
          
          if (!config.pro?.isPro && !config.pro?.devMode && !config.audio.enabled) {
            this.showToast('🔒 Audio QA requires PRO');
            this.showInPageSettings();
            return;
          }
          
          config.audio.enabled = !config.audio.enabled;
          await chrome.runtime.sendMessage({ type: 'CFG_SET', payload: config });
          this.showToast(`Audio QA ${config.audio.enabled ? 'ON' : 'OFF'}`);
          this.updateWidgetStates();
        }
      } catch (err) {
        console.error(err);
      }
    });
    
    this.controlWidget.querySelector('.qorva-btn-settings')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showInPageSettings();
      this.controlWidget!.classList.remove('qorva-menu-open');
    });
  }

  /**
   * Update floating widget toggle button states
   */
  async updateWidgetStates(): Promise<void> {
    if (!this.controlWidget) return;
    try {
      const response = await chrome.runtime.sendMessage({ type: 'CFG_GET' });
      if (response?.ok && response.data) {
        const config = response.data;
        const toggleQuizBtn = this.controlWidget.querySelector('.qorva-btn-toggle-quiz');
        const toggleAudioBtn = this.controlWidget.querySelector('.qorva-btn-toggle-audio');
        
        if (toggleQuizBtn) {
          toggleQuizBtn.textContent = `📝 Quiz: ${config.quiz.auto ? 'ON' : 'OFF'}`;
          toggleQuizBtn.classList.toggle('qorva-active', config.quiz.auto);
        }
        
        if (toggleAudioBtn) {
          toggleAudioBtn.textContent = `🎤 Voice: ${config.audio.enabled ? 'ON' : 'OFF'}`;
          toggleAudioBtn.classList.toggle('qorva-active', config.audio.enabled);
        }
      }
    } catch (err) {
      console.error('[QORVA] Error updating widget states:', err);
    }
  }

  /**
   * Show settings modal inside the webpage DOM (SEB bypass support)
   */
  async showInPageSettings(): Promise<void> {
    this.init();
    
    if (this.settingsModal) {
      this.settingsModal.remove();
    }
    
    try {
      const response = await chrome.runtime.sendMessage({ type: 'CFG_GET' });
      if (!response?.ok || !response.data) {
        this.showToast('❌ Failed to load settings');
        return;
      }
      
      const config = response.data;
      
      this.settingsModal = document.createElement('div');
      this.settingsModal.id = 'qorva-inpage-settings';
      this.settingsModal.className = 'qorva-settings-overlay';
      
      const geminiKey = config.llm.gemini?.apiKey || '';
      const geminiModel = config.llm.gemini?.model || 'gemini-2.5-flash';
      const openaiKey = config.llm.openai?.apiKey || '';
      const openaiModel = config.llm.openai?.model || 'gpt-4o-mini';
      const claudeKey = config.llm.claude?.apiKey || '';
      const claudeModel = config.llm.claude?.model || 'claude-3-haiku-20240307';
      const groqKey = config.llm.groq?.apiKey || '';
      const groqModel = config.llm.groq?.model || 'llama-3.3-70b-versatile';
      
      this.settingsModal.innerHTML = `
        <div class="qorva-settings-modal">
          <div class="qorva-settings-header">
            <h3>🤖 siuuuuu Config Panel</h3>
            <button class="qorva-settings-close">✕</button>
          </div>
          <div class="qorva-settings-body">
            <div class="qorva-form-row">
              <label for="qorva-set-provider">AI Provider</label>
              <select id="qorva-set-provider">
                <option value="gemini" ${config.llm.provider === 'gemini' ? 'selected' : ''}>Gemini (Free)</option>
                <option value="openai" ${config.llm.provider === 'openai' ? 'selected' : ''}>OpenAI</option>
                <option value="claude" ${config.llm.provider === 'claude' ? 'selected' : ''}>Claude</option>
                <option value="groq" ${config.llm.provider === 'groq' ? 'selected' : ''}>Groq</option>
              </select>
            </div>
            
            <div id="qorva-set-gemini-section" class="qorva-provider-section">
              <div class="qorva-form-row">
                <label for="qorva-set-gemini-key">Gemini API Key</label>
                <input type="password" id="qorva-set-gemini-key" value="${geminiKey}" placeholder="AIzaSy...">
              </div>
              <div class="qorva-form-row">
                <label for="qorva-set-gemini-model">Gemini Model</label>
                <select id="qorva-set-gemini-model">
                  <option value="gemini-2.5-flash" ${geminiModel === 'gemini-2.5-flash' ? 'selected' : ''}>2.5 Flash</option>
                  <option value="gemini-2.5-flash-lite" ${geminiModel === 'gemini-2.5-flash-lite' ? 'selected' : ''}>2.5 Flash Lite</option>
                  <option value="gemini-2.0-flash" ${geminiModel === 'gemini-2.0-flash' ? 'selected' : ''}>2.0 Flash</option>
                  <option value="gemini-1.5-flash" ${geminiModel === 'gemini-1.5-flash' ? 'selected' : ''}>1.5 Flash</option>
                </select>
              </div>
            </div>
            
            <div id="qorva-set-openai-section" class="qorva-provider-section qorva-hidden">
              <div class="qorva-form-row">
                <label for="qorva-set-openai-key">OpenAI API Key</label>
                <input type="password" id="qorva-set-openai-key" value="${openaiKey}" placeholder="sk-...">
              </div>
              <div class="qorva-form-row">
                <label for="qorva-set-openai-model">OpenAI Model</label>
                <select id="qorva-set-openai-model">
                  <option value="gpt-4o-mini" ${openaiModel === 'gpt-4o-mini' ? 'selected' : ''}>GPT-4o Mini</option>
                  <option value="gpt-4o" ${openaiModel === 'gpt-4o' ? 'selected' : ''}>GPT-4o</option>
                </select>
              </div>
            </div>
            
            <div id="qorva-set-claude-section" class="qorva-provider-section qorva-hidden">
              <div class="qorva-form-row">
                <label for="qorva-set-claude-key">Claude API Key</label>
                <input type="password" id="qorva-set-claude-key" value="${claudeKey}" placeholder="sk-ant-...">
              </div>
              <div class="qorva-form-row">
                <label for="qorva-set-claude-model">Claude Model</label>
                <select id="qorva-set-claude-model">
                  <option value="claude-3-haiku-20240307" ${claudeModel === 'claude-3-haiku-20240307' ? 'selected' : ''}>Claude 3 Haiku</option>
                  <option value="claude-3-sonnet-20240229" ${claudeModel === 'claude-3-sonnet-20240229' ? 'selected' : ''}>Claude 3 Sonnet</option>
                </select>
              </div>
            </div>
            
            <div id="qorva-set-groq-section" class="qorva-provider-section qorva-hidden">
              <div class="qorva-form-row">
                <label for="qorva-set-groq-key">Groq API Key</label>
                <input type="password" id="qorva-set-groq-key" value="${groqKey}" placeholder="gsk_...">
              </div>
              <div class="qorva-form-row">
                <label for="qorva-set-groq-model">Groq Model</label>
                <select id="qorva-set-groq-model">
                  <option value="llama-3.3-70b-versatile" ${groqModel === 'llama-3.3-70b-versatile' ? 'selected' : ''}>Llama 3.3 70B</option>
                  <option value="llama-3.1-8b-instant" ${groqModel === 'llama-3.1-8b-instant' ? 'selected' : ''}>Llama 3.1 8B</option>
                  <option value="mixtral-8x7b-32768" ${groqModel === 'mixtral-8x7b-32768' ? 'selected' : ''}>Mixtral 8x7B</option>
                  <option value="gemma2-9b-it" ${groqModel === 'gemma2-9b-it' ? 'selected' : ''}>Gemma 2 9B</option>
                </select>
              </div>
            </div>
            
            <div class="qorva-form-row qorva-checkbox-row">
              <label>
                <input type="checkbox" id="qorva-set-quiz-auto" ${config.quiz.auto ? 'checked' : ''}>
                Auto-detect & answer questions
              </label>
            </div>
            
            <div class="qorva-form-row qorva-checkbox-row">
              <label>
                <input type="checkbox" id="qorva-set-audio-enabled" ${config.audio.enabled ? 'checked' : ''}>
                Enable Audio/Voice QA (PRO required)
              </label>
            </div>
            
            <div class="qorva-form-row qorva-checkbox-row">
              <label>
                <input type="checkbox" id="qorva-set-show-exp" ${config.ui.showExplanation ? 'checked' : ''}>
                Show explanations
              </label>
            </div>
          </div>
          
          <div class="qorva-settings-footer">
            <button class="qorva-settings-btn-cancel">Cancel</button>
            <button class="qorva-settings-btn-save">💾 Save Settings</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(this.settingsModal);
      
      const providerSelect = this.settingsModal.querySelector('#qorva-set-provider') as HTMLSelectElement;
      const sections = {
        gemini: this.settingsModal.querySelector('#qorva-set-gemini-section') as HTMLElement,
        openai: this.settingsModal.querySelector('#qorva-set-openai-section') as HTMLElement,
        claude: this.settingsModal.querySelector('#qorva-set-claude-section') as HTMLElement,
        groq: this.settingsModal.querySelector('#qorva-set-groq-section') as HTMLElement
      };
      
      const updateSections = (p: string) => {
        Object.entries(sections).forEach(([k, section]) => {
          if (section) {
            section.classList.toggle('qorva-hidden', k !== p);
          }
        });
      };
      
      providerSelect.addEventListener('change', () => {
        updateSections(providerSelect.value);
      });
      
      updateSections(config.llm.provider);
      
      this.settingsModal.querySelector('.qorva-settings-close')?.addEventListener('click', () => {
        this.settingsModal?.remove();
      });
      
      this.settingsModal.querySelector('.qorva-settings-btn-cancel')?.addEventListener('click', () => {
        this.settingsModal?.remove();
      });
      
      const saveBtn = this.settingsModal.querySelector('.qorva-settings-btn-save') as HTMLButtonElement;
      saveBtn.addEventListener('click', async () => {
        const p = providerSelect.value;
        const newConfig = {
          ...config,
          llm: {
            ...config.llm,
            provider: p,
            gemini: {
              ...config.llm.gemini,
              apiKey: (this.settingsModal!.querySelector('#qorva-set-gemini-key') as HTMLInputElement).value.trim(),
              model: (this.settingsModal!.querySelector('#qorva-set-gemini-model') as HTMLSelectElement).value
            },
            openai: {
              ...config.llm.openai,
              apiKey: (this.settingsModal!.querySelector('#qorva-set-openai-key') as HTMLInputElement).value.trim(),
              model: (this.settingsModal!.querySelector('#qorva-set-openai-model') as HTMLSelectElement).value
            },
            claude: {
              ...config.llm.claude,
              apiKey: (this.settingsModal!.querySelector('#qorva-set-claude-key') as HTMLInputElement).value.trim(),
              model: (this.settingsModal!.querySelector('#qorva-set-claude-model') as HTMLSelectElement).value
            },
            groq: {
              ...config.llm.groq,
              apiKey: (this.settingsModal!.querySelector('#qorva-set-groq-key') as HTMLInputElement).value.trim(),
              model: (this.settingsModal!.querySelector('#qorva-set-groq-model') as HTMLSelectElement).value
            }
          },
          quiz: {
            ...config.quiz,
            auto: (this.settingsModal!.querySelector('#qorva-set-quiz-auto') as HTMLInputElement).checked
          },
          audio: {
            ...config.audio,
            enabled: (this.settingsModal!.querySelector('#qorva-set-audio-enabled') as HTMLInputElement).checked
          },
          ui: {
            ...config.ui,
            showExplanation: (this.settingsModal!.querySelector('#qorva-set-show-exp') as HTMLInputElement).checked
          }
        };
        
        const activeKey = newConfig.llm[p].apiKey;
        if (!activeKey) {
          this.showToast(`❌ Please enter an API key for ${p}`);
          return;
        }
        
        const saveResponse = await chrome.runtime.sendMessage({ type: 'CFG_SET', payload: newConfig });
        if (saveResponse?.ok) {
          this.showToast('✅ Configuration saved successfully!');
          this.updateWidgetStates();
          this.settingsModal?.remove();
        } else {
          this.showToast(`❌ Save failed: ${saveResponse?.error || 'Unknown error'}`);
        }
      });
      
      requestAnimationFrame(() => {
        this.settingsModal?.classList.add('qorva-settings-open');
      });
      
    } catch (err) {
      console.error('[QORVA] Error showing in-page settings:', err);
      this.showToast('❌ Configuration panel error');
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.container?.remove();
    this.container = null;
    this.transcribeContainer?.remove();
    this.transcribeContainer = null;
    this.controlWidget?.remove();
    this.controlWidget = null;
    this.settingsModal?.remove();
    this.settingsModal = null;
    this.quizCards.clear();
    this.audioCard = null;
    document.getElementById('qorva-styles')?.remove();
  }

  /**
   * Reset error state
   */
  resetErrorState(): void {
    this.errorState = { lastError: '', count: 0, lastTime: 0 };
  }
}

// Export singleton instance
export const overlayManager = new OverlayManager();
