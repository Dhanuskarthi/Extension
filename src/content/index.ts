/**
 * QORVA - Content Script Entry Point
 * Single initialization with global guard
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

// Global guard - prevent multiple initializations
declare global {
  interface Window {
    __QORVA_INITIALIZED__?: boolean;
  }
}

if (window.__QORVA_INITIALIZED__) {
  console.log('[QORVA] Already initialized, skipping');
} else {
  window.__QORVA_INITIALIZED__ = true;

  class QorvaContentScript {
    private config: Config | null = null;
    private processedQuestions: Set<string> = new Set();
    private processingQuestions: Set<string> = new Set(); // Currently processing
    private audioEnabled = false;

    /**
     * Initialize content script
     */
    async init(): Promise<void> {
      console.log('[QORVA] Content script initializing...');
      
      await this.loadConfig();
      
      if (this.config && isBlacklisted(window.location.href, this.config.blacklistDomains)) {
        console.log('[QORVA] Domain is blacklisted, skipping');
        return;
      }
      
      overlayManager.init();
      
      if (this.config?.quiz.auto) {
        this.startQuizDetection();
      }
      
      if (this.config?.audio.enabled) {
        this.startAudioQA();
      }
      
      this.setupMessageListener();
      
      console.log('[QORVA] Content script initialized');
    }

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

    private startQuizDetection(): void {
      quizDetector.start(this.handleQuestionsDetected.bind(this));
    }

    /**
     * Handle detected questions - with strict deduplication
     */
    private async handleQuestionsDetected(questions: DetectedQuestion[]): Promise<void> {
      for (const { id, element, question } of questions) {
        // STRICT CHECK: skip if already processed OR currently processing
        if (this.processedQuestions.has(id) || this.processingQuestions.has(id)) {
          continue;
        }
        
        // Mark as currently processing (sync, before any async)
        this.processingQuestions.add(id);
        
        console.log(`[QORVA] Processing question: ${id}`);
        
        // Show loading overlay
        overlayManager.showQuizCard(id, {
          question,
          answer: { answer_index: 0, explanation: '' },
          status: 'loading',
        });
        
        try {
          const response = await chrome.runtime.sendMessage({
            type: MSG_TYPES.LLM_ANSWER_QUIZ,
            payload: question,
          });
          
          // Mark as fully processed
          this.processedQuestions.add(id);
          
          if (response?.ok && response.data) {
            const answer = response.data as QuizAnswer;
            
            overlayManager.showQuizCard(id, {
              question,
              answer,
              status: 'success',
            });
            
            if (this.config?.quiz.auto) {
              const result = await selectAnswer(element, answer, this.config.quiz);
              
              if (!result.success) {
                console.warn('[QORVA] Auto-select failed:', result.error);
              }
            }
            
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
          // Mark as processed even on error
          this.processedQuestions.add(id);
          
          overlayManager.showQuizCard(id, {
            question,
            answer: { answer_index: 0, explanation: '' },
            status: 'error',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          });
        } finally {
          // Remove from processing set
          this.processingQuestions.delete(id);
        }
      }
    }

    private async startAudioQA(): Promise<void> {
      if (!this.config?.audio.enabled || this.audioEnabled) return;
      
      try {
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
          },
        });
        
        this.audioEnabled = true;
        console.log('[QORVA] Audio QA started');
      } catch (error) {
        console.error('[QORVA] Failed to start audio QA:', error);
      }
    }

    private async handleTranscript(transcript: string): Promise<void> {
      if (!detectQuestion(transcript)) return;
      
      overlayManager.showAudioCard({
        transcript,
        status: 'processing',
      });
      
      try {
        const questionText = extractQuestion(transcript);
        
        const response = await chrome.runtime.sendMessage({
          type: MSG_TYPES.LLM_ANSWER_AUDIO,
          payload: { transcript: questionText },
        });
        
        if (response?.ok && response.data) {
          const audioAnswer = response.data as AudioQAResponse;
          
          overlayManager.showAudioCard({
            transcript,
            answer: audioAnswer,
            status: 'ready',
          });
          
          if (this.config?.audio.tts) {
            const utterance = new SpeechSynthesisUtterance(audioAnswer.answer);
            utterance.lang = 'vi-VN';
            utterance.volume = this.config.audio.volume;
            speechSynthesis.speak(utterance);
          }
          
          if (this.config?.audio.autoCopy) {
            navigator.clipboard.writeText(audioAnswer.answer).catch(() => {});
          }
        } else {
          overlayManager.showAudioCard({
            transcript,
            status: 'error',
            errorMessage: response?.error || 'Failed to get answer',
          });
        }
      } catch (error) {
        overlayManager.showAudioCard({
          transcript,
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    private toggleQuizDetection(): void {
      if (quizDetector.isRunning()) {
        quizDetector.stop();
        overlayManager.showToast('Quiz automation OFF');
      } else {
        this.startQuizDetection();
        overlayManager.showToast('Quiz automation ON');
      }
    }

    private toggleAudioQA(): void {
      if (this.audioEnabled) {
        stt.stop();
        audioCapture.stop();
        this.audioEnabled = false;
        overlayManager.showToast('Audio QA OFF');
      } else {
        this.startAudioQA();
        overlayManager.showToast('Audio QA ON');
      }
    }

    private handlePushToTalk(): void {
      if (!this.audioEnabled) {
        this.startAudioQA();
      }
      overlayManager.showAudioCard({ transcript: '', status: 'listening' });
    }

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

    destroy(): void {
      quizDetector.stop();
      stt.stop();
      audioCapture.stop();
      overlayManager.destroy();
    }
  }

  // Initialize
  const qorva = new QorvaContentScript();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => qorva.init());
  } else {
    qorva.init();
  }

  window.addEventListener('beforeunload', () => qorva.destroy());
}
