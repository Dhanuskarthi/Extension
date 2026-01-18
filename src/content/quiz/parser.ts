/**
 * QORVA - Quiz Parser
 * Parses DOM elements into normalized QuizQuestion structure
 */

import { QUIZ_SELECTORS } from '../../shared/constants';
import { generateId, normalizeText } from '../../shared/utils';
import type { QuizQuestion } from '../../shared/types';

/**
 * Parse a question container element into QuizQuestion
 */
export function parseQuestion(container: HTMLElement): QuizQuestion | null {
  // Extract question text
  const questionText = extractQuestionText(container);
  if (!questionText || questionText.length < 5) {
    return null;
  }
  
  // Extract choices
  const choices = extractChoices(container);
  if (choices.length < 2) {
    return null;
  }
  
  // Determine if multiple answers allowed
  const allowMultiple = detectMultipleChoice(container);
  
  // Detect language
  const lang = detectLanguage(questionText);
  
  return {
    id: container.getAttribute('data-qorva-id') || generateId('q'),
    text: questionText,
    choices,
    allowMultiple,
    meta: {
      lang,
      source: 'auto',
    },
  };
}

/**
 * Extract question text from container
 */
function extractQuestionText(container: HTMLElement): string {
  // Try specific selectors first
  for (const selector of QUIZ_SELECTORS.questionText) {
    const element = container.querySelector<HTMLElement>(selector);
    if (element) {
      const text = cleanQuestionText(element.textContent || '');
      if (text.length > 5) {
        return text;
      }
    }
  }
  
  // Fallback: find first text node or text before choices
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const text = node.textContent?.trim() || '';
        // Skip empty or too short text
        if (text.length < 10) return NodeFilter.FILTER_SKIP;
        // Skip if parent is likely a choice
        const parent = node.parentElement;
        if (parent && isChoiceElement(parent)) return NodeFilter.FILTER_SKIP;
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );
  
  const firstText = walker.nextNode();
  if (firstText?.textContent) {
    return cleanQuestionText(firstText.textContent);
  }
  
  return '';
}

/**
 * Extract choices from container
 */
function extractChoices(container: HTMLElement): string[] {
  const choices: string[] = [];
  const seen = new Set<string>();
  
  // Find all potential choice elements
  const choiceSelector = QUIZ_SELECTORS.choices.join(', ');
  const elements = container.querySelectorAll<HTMLElement>(choiceSelector);
  
  for (const element of elements) {
    // Skip if it's a question text element
    if (isQuestionTextElement(element)) continue;
    
    // Get choice text
    const text = extractChoiceText(element);
    const normalized = normalizeText(text);
    
    // Skip empty or duplicates
    if (!text || text.length < 1 || seen.has(normalized)) continue;
    
    // Skip if text is too long (probably not a choice)
    if (text.length > 500) continue;
    
    seen.add(normalized);
    choices.push(text.trim());
  }
  
  // If no choices found, try finding inputs and their labels
  if (choices.length < 2) {
    return extractChoicesFromInputs(container);
  }
  
  return choices;
}

/**
 * Extract choices from radio/checkbox inputs
 */
function extractChoicesFromInputs(container: HTMLElement): string[] {
  const choices: string[] = [];
  const inputs = container.querySelectorAll<HTMLInputElement>(
    'input[type="radio"], input[type="checkbox"]'
  );
  
  for (const input of inputs) {
    // Skip hidden, sr-only, or "clear choice" inputs
    if (input.classList.contains('sr-only') ||
        input.classList.contains('hidden') ||
        input.hasAttribute('aria-hidden') ||
        input.value === '-1' ||
        input.id.includes('answer-1')) {
      continue;
    }
    
    const label = findInputLabel(input);
    if (label) {
      const text = cleanChoiceText(label.textContent || '');
      if (text && text.length > 0 && !choices.includes(text)) {
        choices.push(text);
      }
    }
  }
  
  return choices;
}

/**
 * Find label for an input element
 */
export function findInputLabel(input: HTMLInputElement): HTMLLabelElement | null {
  // Try label with 'for' attribute
  if (input.id) {
    const label = document.querySelector<HTMLLabelElement>(`label[for="${input.id}"]`);
    if (label) return label;
  }
  
  // Try parent label
  const parentLabel = input.closest('label');
  if (parentLabel) return parentLabel as HTMLLabelElement;
  
  // Try next sibling label
  const nextSibling = input.nextElementSibling;
  if (nextSibling?.tagName === 'LABEL') {
    return nextSibling as HTMLLabelElement;
  }
  
  // Try to find nearby label
  const parent = input.parentElement;
  if (parent) {
    const labels = parent.querySelectorAll('label');
    for (const label of labels) {
      if (!label.hasAttribute('for') || label.getAttribute('for') === input.id) {
        return label;
      }
    }
  }
  
  return null;
}

/**
 * Extract text from a choice element
 */
function extractChoiceText(element: HTMLElement): string {
  // If it's a label, get its text content
  if (element.tagName === 'LABEL') {
    // Exclude input elements from text
    const clone = element.cloneNode(true) as HTMLElement;
    const inputs = clone.querySelectorAll('input');
    inputs.forEach(input => input.remove());
    return cleanChoiceText(clone.textContent || '');
  }
  
  // For other elements, get text content
  return cleanChoiceText(element.textContent || '');
}

/**
 * Detect if container has multiple choice (checkbox) questions
 */
function detectMultipleChoice(container: HTMLElement): boolean {
  const checkboxes = container.querySelectorAll('input[type="checkbox"]');
  
  // If there are checkboxes, it's likely multiple choice
  if (checkboxes.length > 0) {
    return true;
  }
  
  // Check for multiple-select indicators
  const text = container.textContent?.toLowerCase() || '';
  if (
    text.includes('chọn nhiều') ||
    text.includes('select all') ||
    text.includes('multiple') ||
    text.includes('all that apply')
  ) {
    return true;
  }
  
  return false;
}

/**
 * Detect language of text
 */
function detectLanguage(text: string): 'vi' | 'en' {
  // Simple heuristic: check for Vietnamese diacritics
  const viPattern = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
  if (viPattern.test(text)) {
    return 'vi';
  }
  return 'en';
}

/**
 * Check if element is a question text element
 */
function isQuestionTextElement(element: HTMLElement): boolean {
  const questionTextSelector = QUIZ_SELECTORS.questionText.join(', ');
  return element.matches(questionTextSelector);
}

/**
 * Check if element is a choice element
 */
function isChoiceElement(element: HTMLElement): boolean {
  const choiceSelector = QUIZ_SELECTORS.choices.join(', ');
  return element.matches(choiceSelector) || 
         element.closest(choiceSelector) !== null;
}

/**
 * Clean question text
 */
function cleanQuestionText(text: string): string {
  return text
    .replace(/^\s*\d+[\.\)\:]?\s*/, '') // Remove leading question number
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Clean choice text
 */
function cleanChoiceText(text: string): string {
  return text
    .replace(/^[A-Za-z][\.\)\:]?\s*/, '') // Remove leading letter (A. B. C.)
    .replace(/^\d+[\.\)\:]?\s*/, '') // Remove leading number
    .replace(/\s+/g, ' ')
    .trim();
}
