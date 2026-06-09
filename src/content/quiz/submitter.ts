/**
 * QORVA - Quiz Submit Handler
 * Handles auto-submit functionality
 */

import { QUIZ_SELECTORS } from '../../shared/constants';
import { sleep, normalizeText } from '../../shared/utils';

export interface SubmitResult {
  success: boolean;
  buttonFound: boolean;
  error?: string;
}

/**
 * Find and click submit button
 */
export async function submitQuiz(container?: HTMLElement): Promise<SubmitResult> {
  const searchRoot = container || document.body;
  
  // Find submit button
  const submitButton = findSubmitButton(searchRoot);
  
  if (!submitButton) {
    return {
      success: false,
      buttonFound: false,
      error: 'No submit button found',
    };
  }
  
  try {
    // Check if button is enabled
    if (submitButton.hasAttribute('disabled') || 
        submitButton.classList.contains('disabled')) {
      return {
        success: false,
        buttonFound: true,
        error: 'Submit button is disabled',
      };
    }
    
    // Highlight button briefly before clicking
    highlightButton(submitButton);
    await sleep(300);
    
    // Click the button
    submitButton.click();
    
    // Also dispatch events in case click doesn't work
    submitButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    
    return {
      success: true,
      buttonFound: true,
    };
  } catch (error) {
    return {
      success: false,
      buttonFound: true,
      error: error instanceof Error ? error.message : 'Submit failed',
    };
  }
}

/**
 * Find submit button in container
 */
/**
 * Helper to determine if a button is a back/previous/return button
 */
function isBackButton(button: HTMLElement): boolean {
  const backKeywords = ['back', 'prev', 'quay lai', 'truoc', 'return'];
  
  const text = normalizeText(button.textContent || '');
  const id = normalizeText(button.id || '');
  const className = normalizeText(button.className || '');
  const name = normalizeText(button.getAttribute('name') || '');
  const ariaLabel = normalizeText(button.getAttribute('aria-label') || '');
  
  const combined = `${text} ${id} ${className} ${name} ${ariaLabel}`;
  
  return backKeywords.some(keyword => combined.includes(keyword));
}

/**
 * Find submit button in container
 */
function findSubmitButton(root: HTMLElement): HTMLElement | null {
  // Try specific selectors first
  for (const selector of QUIZ_SELECTORS.submit) {
    const buttons = root.querySelectorAll<HTMLElement>(selector);
    for (const button of buttons) {
      if (isValidSubmitButton(button) && !isBackButton(button)) {
        // If it's a generic [role="button"], require positive keywords to avoid clicking unrelated components
        if (selector === '[role="button"]') {
          const text = normalizeText(button.textContent || '');
          const positiveKeywords = ['next', 'submit', 'tiep', 'nop', 'continue', 'gui', 'xac nhan', 'hoan thanh', 'finish', 'done'];
          if (!positiveKeywords.some(keyword => text.includes(keyword))) {
            continue;
          }
        }
        return button;
      }
    }
  }
  
  // Try finding by text content
  const buttons = root.querySelectorAll<HTMLElement>(
    'button, input[type="submit"], [role="button"], a.btn'
  );
  
  const submitTexts = [
    'submit', 'nộp', 'hoàn thành', 'finish', 'done', 'complete',
    'gửi', 'xác nhận', 'confirm', 'next', 'tiếp tục'
  ];
  
  for (const button of buttons) {
    const text = button.textContent?.toLowerCase().trim() || '';
    if (submitTexts.some(t => text.includes(t))) {
      if (isValidSubmitButton(button) && !isBackButton(button)) {
        return button;
      }
    }
  }
  
  return null;
}

/**
 * Check if button is valid for submit
 */
function isValidSubmitButton(button: HTMLElement): boolean {
  // Check visibility
  const style = window.getComputedStyle(button);
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }
  
  // Check if it's actually interactive
  if (button.hasAttribute('disabled')) {
    return false;
  }
  
  // Check dimensions
  const rect = button.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) {
    return false;
  }
  
  return true;
}

/**
 * Highlight button before clicking
 */
function highlightButton(button: HTMLElement): void {
  const originalOutline = button.style.outline;
  const originalOutlineOffset = button.style.outlineOffset;
  
  button.style.outline = '3px solid #FF9800';
  button.style.outlineOffset = '2px';
  
  setTimeout(() => {
    button.style.outline = originalOutline;
    button.style.outlineOffset = originalOutlineOffset;
  }, 1000);
}

/**
 * Check if all questions are answered
 */
export function areAllQuestionsAnswered(container?: HTMLElement): boolean {
  const searchRoot = container || document.body;
  
  // Find all question containers
  const containerSelector = QUIZ_SELECTORS.containers.join(', ');
  const questions = searchRoot.querySelectorAll<HTMLElement>(containerSelector);
  
  if (questions.length === 0) {
    // Try finding inputs directly
    const inputs = searchRoot.querySelectorAll<HTMLInputElement>(
      'input[type="radio"], input[type="checkbox"]'
    );
    
    if (inputs.length === 0) return true; // No inputs found
    
    // Group inputs by name
    const groups = new Map<string, HTMLInputElement[]>();
    for (const input of inputs) {
      const name = input.name || 'default';
      if (!groups.has(name)) {
        groups.set(name, []);
      }
      groups.get(name)!.push(input);
    }
    
    // Check if each group has at least one checked
    for (const [, group] of groups) {
      if (!group.some(input => input.checked)) {
        return false;
      }
    }
    
    return true;
  }
  
  // Check each question container
  for (const question of questions) {
    const inputs = question.querySelectorAll<HTMLInputElement>(
      'input[type="radio"], input[type="checkbox"]'
    );
    
    if (inputs.length > 0) {
      const hasChecked = Array.from(inputs).some(input => input.checked);
      if (!hasChecked) return false;
    }
  }
  
  return true;
}

/**
 * Get count of answered/total questions
 */
export function getQuestionProgress(container?: HTMLElement): { answered: number; total: number } {
  const searchRoot = container || document.body;
  
  // Find all question containers
  const containerSelector = QUIZ_SELECTORS.containers.join(', ');
  const questions = searchRoot.querySelectorAll<HTMLElement>(containerSelector);
  
  let total = 0;
  let answered = 0;
  
  for (const question of questions) {
    const inputs = question.querySelectorAll<HTMLInputElement>(
      'input[type="radio"], input[type="checkbox"]'
    );
    
    if (inputs.length > 0) {
      total++;
      if (Array.from(inputs).some(input => input.checked)) {
        answered++;
      }
    }
  }
  
  return { answered, total };
}

/**
 * Find next page button (distinct from submit)
 */
export function findNextPageButton(container?: HTMLElement): HTMLElement | null {
  const searchRoot = container || document.body;
  
  // Try specific selectors
  for (const selector of QUIZ_SELECTORS.nextPage) {
    try {
      const buttons = searchRoot.querySelectorAll<HTMLElement>(selector);
      for (const button of buttons) {
        if (isValidSubmitButton(button) && !isSubmitButton(button) && !isBackButton(button)) {
          return button;
        }
      }
    } catch {
      // Invalid selector, skip
    }
  }
  
  // Try finding by text content
  const buttons = searchRoot.querySelectorAll<HTMLElement>(
    'button, input[type="button"], a.btn, [role="button"]'
  );
  
  const nextTexts = ['next', 'tiếp', 'next page', 'trang tiếp', '→', '»'];
  const submitTexts = ['submit', 'nộp', 'hoàn thành', 'finish', 'gửi bài'];
  
  for (const button of buttons) {
    const text = button.textContent?.toLowerCase().trim() || '';
    const value = (button as HTMLInputElement).value?.toLowerCase() || '';
    const combined = text + ' ' + value;
    
    // Must match next but NOT submit
    const isNext = nextTexts.some(t => combined.includes(t));
    const isSubmit = submitTexts.some(t => combined.includes(t));
    
    if (isNext && !isSubmit && isValidSubmitButton(button) && !isBackButton(button)) {
      return button;
    }
  }
  
  return null;
}

/**
 * Check if button is a submit button (not navigation)
 */
function isSubmitButton(button: HTMLElement): boolean {
  const text = button.textContent?.toLowerCase().trim() || '';
  const type = (button as HTMLInputElement).type || '';
  
  const submitIndicators = ['submit', 'nộp', 'hoàn thành', 'finish', 'gửi bài', 'kết thúc'];
  
  if (type === 'submit') return true;
  if (button.classList.contains('submit') || button.classList.contains('btn-submit')) return true;
  
  return submitIndicators.some(t => text.includes(t));
}

/**
 * Navigate to next page
 */
export async function goNextPage(container?: HTMLElement): Promise<SubmitResult> {
  const nextButton = findNextPageButton(container);
  
  if (!nextButton) {
    return {
      success: false,
      buttonFound: false,
      error: 'No next page button found',
    };
  }
  
  try {
    highlightButton(nextButton);
    await sleep(200);
    
    nextButton.click();
    nextButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    
    return {
      success: true,
      buttonFound: true,
    };
  } catch (error) {
    return {
      success: false,
      buttonFound: true,
      error: error instanceof Error ? error.message : 'Navigation failed',
    };
  }
}

