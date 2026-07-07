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
  console.log(`[QORVA] parseQuestion: Scanning container <${container.tagName.toLowerCase()}> class="${container.className}" id="${container.id}"`);
  console.log('[QORVA] parseQuestion: Container HTML:', container.outerHTML);
  
  // Extract question text
  const questionText = extractQuestionText(container);
  console.log(`[QORVA] parseQuestion: Extracted text (len=${questionText?.length || 0}): "${questionText}"`);
  if (!questionText || questionText.length < 5) {
    console.log('[QORVA] parseQuestion: Text too short or empty, skipping');
    return null;
  }
  
  // Extract choices
  const choices = extractChoices(container);
  console.log(`[QORVA] parseQuestion: Extracted choices (${choices.length}):`, choices);
  if (choices.length < 2) {
    console.log('[QORVA] parseQuestion: Less than 2 choices found, skipping');
    return null;
  }
  
  // Determine if multiple answers allowed
  const allowMultiple = detectMultipleChoice(container);
  
  // Detect language
  const lang = detectLanguage(questionText);
  
  // Detect audio/image context (for TOEIC listening questions)
  const context = detectAudioContext(container);
  
  return {
    id: container.getAttribute('data-qorva-id') || generateId('q'),
    text: questionText,
    choices,
    allowMultiple,
    meta: {
      lang,
      source: 'auto',
      hasAudioContext: context.hasAudio,
      audioUrl: context.audioUrl,
      hasImageContext: context.hasImage,
      imageUrl: context.imageUrl,
    },
  };
}

/**
 * Detect if question has audio context (TOEIC listening)
 */
function detectAudioContext(container: HTMLElement): { hasAudio: boolean; audioUrl?: string; hasImage?: boolean; imageUrl?: string } {
  // Check for audio in parent question-group-wrapper
  const questionGroup = container.closest('.question-group-wrapper');
  if (!questionGroup) {
    return { hasAudio: false };
  }
  
  const result: { hasAudio: boolean; audioUrl?: string; hasImage?: boolean; imageUrl?: string } = { hasAudio: false };
  
  // Look for audio element in context
  const audioSelectors = [
    '.context-audio audio source',
    '.context-audio source',
    'audio source',
    '.plyr audio source',
  ];
  
  for (const selector of audioSelectors) {
    const source = questionGroup.querySelector<HTMLSourceElement>(selector);
    if (source?.src) {
      result.hasAudio = true;
      result.audioUrl = source.src;
      break;
    }
  }
  
  // Check for audio element directly
  if (!result.hasAudio) {
    const audioEl = questionGroup.querySelector<HTMLAudioElement>('audio');
    if (audioEl?.src) {
      result.hasAudio = true;
      result.audioUrl = audioEl.src;
    }
  }
  
  // Look for image in context (for questions with graphics/tables)
  const imageSelectors = [
    '.context-image img',
    '.context-content img',
    'img.lazyel',
    'img[data-src]',
  ];
  
  for (const selector of imageSelectors) {
    const img = questionGroup.querySelector<HTMLImageElement>(selector);
    if (img?.src && !img.src.includes('data:')) {
      result.hasImage = true;
      result.imageUrl = img.src;
      break;
    }
  }
  
  return result;
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
  console.log(`[QORVA] extractChoices: Found ${elements.length} elements matching choices selector inside container`);
  
  for (const element of elements) {
    // Skip if it's a question text element
    if (isQuestionTextElement(element)) {
      console.log('[QORVA] extractChoices: Sibling matches question text selector, skipping');
      continue;
    }
    
    // Get choice text
    const text = extractChoiceText(element);
    const normalized = normalizeText(text);
    console.log(`[QORVA] extractChoices: Candidate element <${element.tagName.toLowerCase()}> class="${element.className}" -> text: "${text}"`);
    
    // Skip empty or duplicates
    if (!text || text.length < 1) {
      console.log('[QORVA] extractChoices: Candidate is empty, skipping');
      continue;
    }
    if (seen.has(normalized)) {
      console.log('[QORVA] extractChoices: Candidate is duplicate, skipping');
      continue;
    }
    
    // Skip if text is too long (probably not a choice)
    if (text.length > 500) {
      console.log('[QORVA] extractChoices: Candidate text too long (>500), skipping');
      continue;
    }
    
    seen.add(normalized);
    choices.push(text.trim());
  }
  
  // If no choices found, try finding inputs and their labels
  if (choices.length < 2) {
    console.log('[QORVA] extractChoices: Found <2 choices, falling back to input scan');
    const inputChoices = extractChoicesFromInputs(container);
    console.log('[QORVA] extractChoices: Input scan returned choices:', inputChoices);
    return inputChoices;
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
    .replace(/^\s*\d+[.):]?\s*/, '') // Remove leading question number
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Clean choice text
 */
function cleanChoiceText(text: string): string {
  return text
    .replace(/^[A-Za-z][.):]?\s*/, '') // Remove leading letter (A. B. C.)
    .replace(/^\d+[.):]?\s*/, '') // Remove leading number
    .replace(/\s+/g, ' ')
    .trim();
}
