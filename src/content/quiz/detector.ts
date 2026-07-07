/**
 * QORVA - Quiz DOM Detector
 * Scans DOM for quiz questions using MutationObserver
 */

import { QUIZ_SELECTORS, PERFORMANCE } from '../../shared/constants';
import { generateId, hashString } from '../../shared/utils';
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
      characterData: true,
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
    const containersToScan = new Set<HTMLElement>();
    
    for (const mutation of mutations) {
      const target = mutation.target as HTMLElement;
      
      // SKIP mutations in overlay container (prevents infinite loop)
      if (target.closest?.('#qorva-overlay-container') || 
          target.id === 'qorva-overlay-container') {
        continue;
      }
      
      // Traverse up to find all matching parent question containers for any changes (childList, attributes, characterData)
      const containerSelector = QUIZ_SELECTORS.containers.join(', ');
      let current: HTMLElement | null = target.nodeType === Node.ELEMENT_NODE ? (target as HTMLElement) : target.parentElement;
      while (current && current !== document.body) {
        if (current.matches && current.matches(containerSelector)) {
          containersToScan.add(current);
        }
        current = current.parentElement;
      }
      
      // Also check newly added HTML elements specifically
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            if (node.closest('#qorva-overlay-container')) continue;
            
            const questions = this.scanElement(node);
            if (questions.length > 0) {
              hasNewQuestions = true;
            }
          }
        }
      }
    }
    
    // Scan all unique containers identified by in-place mutation updates
    for (const container of containersToScan) {
      const questions = this.scanElement(container);
      if (questions.length > 0) {
        hasNewQuestions = true;
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
    console.log('[QORVA] scanDOM: Starting DOM scan...');
    const containerSelector = QUIZ_SELECTORS.containers.join(', ');
    const containers = document.querySelectorAll<HTMLElement>(containerSelector);
    console.log(`[QORVA] scanDOM: Found ${containers.length} potential container element matches`);
    
    let foundNew = false;
    
    for (const container of containers) {
      const questions = this.scanElement(container);
      if (questions.length > 0) {
        foundNew = true;
      }
    }
    
    // Also try scanning from body if no containers found
    if (this.detectedQuestions.size === 0) {
      console.log('[QORVA] scanDOM: No explicit containers found, scanning from body fallback');
      this.scanForQuestions(document.body);
    }
    console.log(`[QORVA] scanDOM: Total detected questions in cache: ${this.detectedQuestions.size}`);
    
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
    // Check if this element is INSIDE an already-detected question
    const parentQuestion = element.closest('[data-qorva-id]');
    if (parentQuestion && parentQuestion !== element) {
      return null;
    }
    
    // Check if this element CONTAINS an already-detected question
    const childQuestion = element.querySelector('[data-qorva-id]');
    if (childQuestion) {
      return null;
    }
    
    // Try to parse the question
    const question = parseQuestion(element);
    
    if (!question) {
      return null;
    }
    
    // Compute content hash to support dynamic updates on SPA quizzes
    const contentString = `${question.text}|${question.choices.join('|')}`;
    const hash = hashString(contentString);
    const existingHash = element.getAttribute('data-qorva-hash');
    const existingId = element.getAttribute('data-qorva-id');

    if (existingHash === hash && existingId && this.detectedQuestions.has(existingId)) {
      this.processedElements.add(element);
      return null;
    }
    
    // If the hash changed (or it's a new question), clean up the previous question association
    if (existingId) {
      this.detectedQuestions.delete(existingId);
      this.reportedQuestions.delete(existingId);
    }
    
    // Generate new stable ID
    const id = generateId('q');
    
    // Mark element with new stable ID and hash immediately
    element.setAttribute('data-qorva-id', id);
    element.setAttribute('data-qorva-hash', hash);
    
    const detected: DetectedQuestion = {
      id,
      element,
      question,
    };
    
    this.detectedQuestions.set(id, detected);
    this.processedElements.add(element);
    
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
