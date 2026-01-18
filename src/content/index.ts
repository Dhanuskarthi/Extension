/**
 * QORVA - Content Script Entry Point
 */

import type { Config, QuizAnswer, AudioQAResponse } from '../shared/types';
import { MSG_TYPES } from '../shared/constants';
import { isBlacklisted } from '../shared/utils';
import { quizDetector, type DetectedQuestion } from './quiz/detector';
import { selectAnswer } from './quiz/selector';
import { submitQuiz, areAllQuestionsAnswered } from './quiz/submitter';
import { overlayManager } from './overlay/overlay';
import { audioCapture } from './audio/capture';
import { stt } from './audio/stt';
import { detectQuestion, extractQuestion } from './audio/intent';

class QorvaContentScript {
  private config: Config | null = null;
  private processedQuestions: Set<string> = new Set();
  private audioEnabled = false;

  /**
   * Initialize content script
   */
  async init(): Promise<void> {
    console.log('[QORVA] Content script initializing...');
    
    // Get config
    await this.loadConfig();
    
    // Check blacklist
    if (this.config && isBlacklisted(window.location.href, this.config.blacklistDomains)) {
      console.log('[QORVA] Domain is blacklisted, skipping');
      return;
    }
    
    // Initialize overlay
    overlayManager.init();
    
    // Start quiz detection if enabled
    if (this.config?.quiz.auto) {
      this.startQuizDetection();
    }
    
    // Start audio if enabled
    if (this.config?.audio.enabled) {
      this.startAudioQA();
    }
    
    // Listen for messages
    this.setupMessageListener();
    
    console.log('[QORVA] Content script initialized');
  }

  /**
   * Load configuration
   */
  private async loadConfig(): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({ type: MSG_TYPES.CFG_GET });
      if (response?.ok) {
        this.config = response.data;
      }
    } catch (error) {
      console.error('[QORVA] Failed to load config:', error);
    }
  }

  /**
   * Setup message listener
   */
  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      switch (message.type) {
        case 'PUSH_TO_TALK':
          this.handlePushToTalk();
          sendResponse({ ok: true });
          break;
        
        case 'CONFIG_UPDATED':
          this.loadConfig().then(() => {
            this.handleConfigUpdate();
          });
          sendResponse({ ok: true });
          break;
        
        case 'TOGGLE_QUIZ':
          this.toggleQuizDetection();
          sendResponse({ ok: true });
          break;
        
        case 'TOGGLE_AUDIO':
          this.toggleAudioQA();
          sendResponse({ ok: true });
          break;
      }
      return true;
    });
  }

  /**
   * Start quiz detection
   */
  private startQuizDetection(): void {
    quizDetector.start(this.handleQuestionsDetected.bind(this));
  }

  /**
   * Handle detected questions
   */
  private async handleQuestionsDetected(questions: DetectedQuestion[]): Promise<void> {
    // Filter out already processed questions FIRST synchronously
    const newQuestions = questions.filter(({ id }) => !this.processedQuestions.has(id));
    
    // Mark ALL as processed IMMEDIATELY to prevent race conditions
    for (const { id } of newQuestions) {
      this.processedQuestions.add(id);
    }
    
    console.log(`[QORVA] Processing ${newQuestions.length} new questions`);
    
    for (const { id, element, question } of newQuestions) {
      // Show loading overlay
      overlayManager.showQuizCard(id, {
        question,
        answer: { answer_index: 0, explanation: '' },
        status: 'loading',
      });
      
      try {
        // Send to background for LLM processing
        const response = await chrome.runtime.sendMessage({
          type: MSG_TYPES.LLM_ANSWER_QUIZ,
          payload: question,
        });
        
        if (response?.ok && response.data) {
          const answer = response.data as QuizAnswer;
          
          // Update overlay
          overlayManager.showQuizCard(id, {
            question,
            answer,
            status: 'success',
          });
          
          // Auto-select if enabled
          if (this.config?.quiz.auto) {
            const result = await selectAnswer(element, answer, this.config.quiz);
            
            if (!result.success) {
              console.warn('[QORVA] Auto-select failed:', result.error);
              overlayManager.showToast('Auto-select failed: ' + result.error);
            }
          }
          
          // Auto-submit if enabled and all questions answered
          if (this.config?.quiz.autoSubmit && areAllQuestionsAnswered()) {
            const submitResult = await submitQuiz();
            if (submitResult.success) {
              overlayManager.showToast('Quiz submitted!');
            }
          }
        } else {
          overlayManager.showQuizCard(id, {
            question,
            answer: { answer_index: 0, explanation: '' },
            status: 'error',
            errorMessage: response?.error || 'Failed to get answer',
          });
        }
      } catch (error) {
        overlayManager.showQuizCard(id, {
          question,
          answer: { answer_index: 0, explanation: '' },
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Start audio QA
   */
  private async startAudioQA(): Promise<void> {
    if (!this.config?.audio.enabled || this.audioEnabled) return;
    
    try {
      // Start speech recognition
      stt.start({
        language: 'vi-VN',
        continuous: true,
        interimResults: true,
        onResult: (transcript, isFinal) => {
          if (isFinal) {
            this.handleTranscript(transcript);
          }
        },
        onError: (error) => {
          console.error('[QORVA] STT error:', error);
          overlayManager.showToast('Speech recognition error');
        },
      });
      
      this.audioEnabled = true;
      console.log('[QORVA] Audio QA started');
    } catch (error) {
      console.error('[QORVA] Failed to start audio QA:', error);
    }
  }

  /**
   * Handle transcript from STT
   */
  private async handleTranscript(transcript: string): Promise<void> {
    const intent = detectQuestion(transcript);
    
    if (!intent.isQuestion) {
      return; // Not a question, ignore
    }
    
    const question = extractQuestion(transcript) || transcript;
    
    // Show audio card
    overlayManager.showAudioCard({
      transcript: question,
      status: 'processing',
    });
    
    try {
      // Send to LLM
      const response = await chrome.runtime.sendMessage({
        type: MSG_TYPES.LLM_ANSWER_AUDIO,
        payload: { transcript: question },
      });
      
      if (response?.ok && response.data) {
        const answer = response.data as AudioQAResponse;
        
        overlayManager.showAudioCard({
          transcript: question,
          answer,
          status: 'ready',
        });
        
        // TTS if enabled
        if (this.config?.audio.tts) {
          const utterance = new SpeechSynthesisUtterance(answer.answer);
          utterance.lang = 'vi-VN';
          utterance.volume = this.config.audio.volume;
          speechSynthesis.speak(utterance);
        }
        
        // Auto-copy if enabled
        if (this.config?.audio.autoCopy) {
          await navigator.clipboard.writeText(answer.answer);
          overlayManager.showToast('Copied to clipboard');
        }
      } else {
        overlayManager.showAudioCard({
          transcript: question,
          status: 'error',
          errorMessage: response?.error || 'Failed to get answer',
        });
      }
    } catch (error) {
      overlayManager.showAudioCard({
        transcript: question,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle push-to-talk command
   */
  private handlePushToTalk(): void {
    if (!this.config?.audio.enabled) return;
    
    overlayManager.showAudioCard({
      transcript: '',
      status: 'listening',
    });
    
    // Start recording
    audioCapture.start({
      source: 'mic',
      onSpeechEnd: async (blob) => {
        // For push-to-talk, we use the blob with STT
        // This would need a server-side STT or different approach
        // For now, we rely on continuous STT
        console.log('[QORVA] Push-to-talk recording ended, blob size:', blob.size);
      },
    });
  }

  /**
   * Handle config update
   */
  private handleConfigUpdate(): void {
    if (this.config?.quiz.auto && !quizDetector.isRunning()) {
      this.startQuizDetection();
    } else if (!this.config?.quiz.auto && quizDetector.isRunning()) {
      quizDetector.stop();
    }
    
    if (this.config?.audio.enabled && !this.audioEnabled) {
      this.startAudioQA();
    } else if (!this.config?.audio.enabled && this.audioEnabled) {
      stt.stop();
      audioCapture.stop();
      this.audioEnabled = false;
    }
  }

  /**
   * Toggle quiz detection
   */
  private toggleQuizDetection(): void {
    if (quizDetector.isRunning()) {
      quizDetector.stop();
    } else {
      this.startQuizDetection();
    }
  }

  /**
   * Toggle audio QA
   */
  private toggleAudioQA(): void {
    if (this.audioEnabled) {
      stt.stop();
      audioCapture.stop();
      overlayManager.hideAudioCard();
      this.audioEnabled = false;
    } else {
      this.startAudioQA();
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    quizDetector.stop();
    stt.stop();
    audioCapture.stop();
    overlayManager.destroy();
  }
}

// Initialize
const qorva = new QorvaContentScript();

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => qorva.init());
} else {
  qorva.init();
}

// Cleanup on unload
window.addEventListener('beforeunload', () => qorva.destroy());
