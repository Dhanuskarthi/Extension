/**
 * QORVA - Quiz DOM Detector
 * Scans DOM for quiz questions using MutationObserver
 */

import { QUIZ_SELECTORS, PERFORMANCE } from '../../shared/constants';
import { generateId } from '../../shared/utils';
import { parseQuestion } from './parser';
import type { QuizQuestion } from '../../shared/types';

export interface DetectedQuestion {
  id: string;
  element: HTMLElement;
  question: QuizQuestion;
}

type QuestionCallback = (questions: DetectedQuestion[]) => void;

class QuizDetector {
  private observer: MutationObserver | null = null;
  private detectedQuestions: Map<string, DetectedQuestion> = new Map();
  private processedElements: WeakSet<Element> = new WeakSet();
  private reportedQuestions: Set<string> = new Set(); // Track reported to avoid duplicates
  private callback: QuestionCallback | null = null;
  private isActive = false;

  /**
   * Start detecting quiz questions
   */
  start(callback: QuestionCallback): void {
    if (this.isActive) return;
    
    this.callback = callback;
    this.isActive = true;
    
    // Initial scan
    this.scanDOM();
    
    // Setup MutationObserver with debounced handler
    let debounceTimeout: ReturnType<typeof setTimeout> | null = null;
    
    this.observer = new MutationObserver((mutations) => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      debounceTimeout = setTimeout(() => {
        this.handleMutations(mutations);
        debounceTimeout = null;
      }, PERFORMANCE.domScanDebounce);
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-question', 'hidden', 'style'],
    });
    
    console.log('[QORVA] Quiz detector started');
  }

  /**
   * Stop detecting
   */
  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.isActive = false;
    this.detectedQuestions.clear();
    this.processedElements = new WeakSet();
    console.log('[QORVA] Quiz detector stopped');
  }

  /**
   * Get currently detected questions
   */
  getQuestions(): DetectedQuestion[] {
    return Array.from(this.detectedQuestions.values());
  }

  /**
   * Handle DOM mutations
   */
  private handleMutations(mutations: MutationRecord[]): void {
    let hasNewQuestions = false;
    
    for (const mutation of mutations) {
      // SKIP mutations in overlay container (prevents infinite loop)
      const target = mutation.target as HTMLElement;
      if (target.closest('#qorva-overlay-container') || 
          target.id === 'qorva-overlay-container') {
        continue;
      }
      
      // Check added nodes
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) {
          // Skip overlay nodes
          if (node.closest('#qorva-overlay-container')) continue;
          
          const questions = this.scanElement(node);
          if (questions.length > 0) {
            hasNewQuestions = true;
          }
        }
      }
      
      // Check if a question container was modified
      if (mutation.type === 'attributes' && mutation.target instanceof HTMLElement) {
        const questions = this.scanElement(mutation.target);
        if (questions.length > 0) {
          hasNewQuestions = true;
        }
      }
    }
    
    if (hasNewQuestions && this.callback) {
      // Only pass questions that haven't been reported yet
      const newQuestions = this.getQuestions().filter(q => !this.reportedQuestions.has(q.id));
      if (newQuestions.length > 0) {
        newQuestions.forEach(q => this.reportedQuestions.add(q.id));
        this.callback(newQuestions);
      }
    }
  }

  /**
   * Scan entire DOM for questions
   */
  private scanDOM(): void {
    const containerSelector = QUIZ_SELECTORS.containers.join(', ');
    const containers = document.querySelectorAll<HTMLElement>(containerSelector);
    
    let foundNew = false;
    
    for (const container of containers) {
      const questions = this.scanElement(container);
      if (questions.length > 0) {
        foundNew = true;
      }
    }
    
    // Also try scanning from body if no containers found
    if (this.detectedQuestions.size === 0) {
      this.scanForQuestions(document.body);
    }
    
    if (foundNew && this.callback) {
      // Only pass questions that haven't been reported yet
      const newQuestions = this.getQuestions().filter(q => !this.reportedQuestions.has(q.id));
      if (newQuestions.length > 0) {
        newQuestions.forEach(q => this.reportedQuestions.add(q.id));
        this.callback(newQuestions);
      }
    }
  }

  /**
   * Scan a specific element for questions
   */
  private scanElement(element: HTMLElement): DetectedQuestion[] {
    const questions: DetectedQuestion[] = [];
    
    // Check if element itself is a question container
    if (this.isQuestionContainer(element)) {
      const parsed = this.processQuestionContainer(element);
      if (parsed) {
        questions.push(parsed);
      }
    }
    
    // Scan children
    const containerSelector = QUIZ_SELECTORS.containers.join(', ');
    const containers = element.querySelectorAll<HTMLElement>(containerSelector);
    
    for (const container of containers) {
      const parsed = this.processQuestionContainer(container);
      if (parsed) {
        questions.push(parsed);
      }
    }
    
    return questions;
  }

  /**
   * Scan for questions without explicit containers
   */
  private scanForQuestions(root: HTMLElement): void {
    // Look for elements that might be questions without explicit containers
    const potentialQuestions = root.querySelectorAll<HTMLElement>(
      'form, fieldset, [role="group"], .quiz, .test, .exam'
    );
    
    for (const element of potentialQuestions) {
      if (!this.processedElements.has(element)) {
        const parsed = this.processQuestionContainer(element);
        if (parsed) {
          this.detectedQuestions.set(parsed.id, parsed);
        }
      }
    }
  }

  /**
   * Check if element is a question container
   */
  private isQuestionContainer(element: HTMLElement): boolean {
    const containerSelector = QUIZ_SELECTORS.containers.join(', ');
    return element.matches(containerSelector);
  }

  /**
   * Process a question container element
   */
  private processQuestionContainer(element: HTMLElement): DetectedQuestion | null {
    // Skip if already processed
    if (this.processedElements.has(element)) {
      return null;
    }
    
    // Check if already has qorva ID (scanned before via different path)
    const existingId = element.getAttribute('data-qorva-id');
    if (existingId && this.detectedQuestions.has(existingId)) {
      // Already detected, skip
      this.processedElements.add(element);
      return null;
    }
    
    // Try to parse the question
    const question = parseQuestion(element);
    
    if (!question) {
      return null;
    }
    
    // Mark as processed
    this.processedElements.add(element);
    
    // Generate stable ID - prioritize existing markers
    const id = existingId ||
               element.getAttribute('data-question-id') || 
               element.id || 
               generateId('q');
    
    // Mark element with stable ID immediately
    element.setAttribute('data-qorva-id', id);
    
    const detected: DetectedQuestion = {
      id,
      element,
      question,
    };
    
    this.detectedQuestions.set(id, detected);
    
    return detected;
  }

  /**
   * Check if detector is currently active
   */
  isRunning(): boolean {
    return this.isActive;
  }

  /**
   * Force rescan of DOM
   */
  rescan(): void {
    this.processedElements = new WeakSet();
    this.detectedQuestions.clear();
    this.scanDOM();
  }
}

// Export singleton instance
export const quizDetector = new QuizDetector();
