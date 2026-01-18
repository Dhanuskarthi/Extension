/**
 * QORVA - Quiz Answer Selector
 * Auto-selects answers based on LLM response
 */

import type { QuizAnswer, QuizConfig } from '../../shared/types';
import { QUIZ_SELECTORS } from '../../shared/constants';
import { normalizeText, randomDelay, sleep } from '../../shared/utils';
import { findInputLabel } from './parser';

export interface SelectResult {
  success: boolean;
  selectedIndices: number[];
  error?: string;
}

/**
 * Select answers in a question container
 */
export async function selectAnswer(
  container: HTMLElement,
  answer: QuizAnswer,
  config: QuizConfig
): Promise<SelectResult> {
  // Get all choice elements FIRST to know the valid range
  const choices = getChoiceElements(container);
  
  if (choices.length === 0) {
    return {
      success: false,
      selectedIndices: [],
      error: 'No choice elements found',
    };
  }
  
  // Get indices and CLAMP to valid range
  let indices = Array.isArray(answer.answer_index) 
    ? answer.answer_index 
    : [answer.answer_index];
  
  // Clamp each index to valid range [0, choices.length-1]
  indices = indices.map(i => {
    if (typeof i !== 'number' || isNaN(i)) return 0;
    if (i < 0) return 0;
    if (i >= choices.length) return choices.length - 1; // CLAMP instead of skip!
    return i;
  });
  
  // Remove duplicates
  indices = [...new Set(indices)];
  
  const selectedIndices: number[] = [];
  const errors: string[] = [];
  
  for (const index of indices) {
    // Add delay between selections
    if (selectedIndices.length > 0) {
      await sleep(randomDelay(config.delayMin, config.delayMax));
    }
    
    const choice = choices[index];
    const result = await selectChoice(choice);
    
    if (result.success) {
      selectedIndices.push(index);
    } else {
      errors.push(result.error || `Failed to select index ${index}`);
    }
  }
  
  return {
    success: selectedIndices.length > 0,
    selectedIndices,
    error: errors.length > 0 ? errors.join('; ') : undefined,
  };
}

/**
 * Get all choice elements in a container
 */
function getChoiceElements(container: HTMLElement): ChoiceElement[] {
  const choices: ChoiceElement[] = [];
  
  // First try to find input elements (radio/checkbox)
  const inputs = container.querySelectorAll<HTMLInputElement>(
    'input[type="radio"], input[type="checkbox"]'
  );
  
  if (inputs.length > 0) {
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
      choices.push({
        input,
        label: label || undefined,
        text: label?.textContent?.trim() || '',
      });
    }
    return choices;
  }
  
  // Fallback: find label or option elements
  const choiceSelector = QUIZ_SELECTORS.choices.join(', ');
  const elements = container.querySelectorAll<HTMLElement>(choiceSelector);
  
  for (const element of elements) {
    // Skip if it's part of question text
    if (isQuestionTextElement(element)) continue;
    
    const text = element.textContent?.trim() || '';
    if (text.length < 1 || text.length > 500) continue;
    
    // Find associated input if any
    const input = element.querySelector<HTMLInputElement>('input') ||
                  (element.tagName === 'LABEL' && element.getAttribute('for') 
                    ? document.getElementById(element.getAttribute('for')!) as HTMLInputElement
                    : null);
    
    choices.push({
      input: input || undefined,
      label: element.tagName === 'LABEL' ? element as HTMLLabelElement : undefined,
      element,
      text,
    });
  }
  
  return choices;
}

interface ChoiceElement {
  input?: HTMLInputElement;
  label?: HTMLLabelElement;
  element?: HTMLElement;
  text: string;
}

/**
 * Select a single choice
 */
async function selectChoice(choice: ChoiceElement): Promise<{ success: boolean; error?: string }> {
  try {
    // Strategy 1: Click on label (preferred)
    if (choice.label) {
      choice.label.click();
      
      // Verify selection
      if (choice.input && choice.input.checked) {
        highlightSelected(choice.label);
        return { success: true };
      }
    }
    
    // Strategy 2: Click on input
    if (choice.input) {
      choice.input.click();
      
      if (choice.input.checked) {
        highlightSelected(choice.input);
        return { success: true };
      }
      
      // Strategy 3: Directly set checked and dispatch events
      choice.input.checked = true;
      dispatchInputEvents(choice.input);
      
      if (choice.input.checked) {
        highlightSelected(choice.input);
        return { success: true };
      }
    }
    
    // Strategy 4: Click on element if exists
    if (choice.element && choice.element !== choice.label) {
      choice.element.click();
      await sleep(50);
      
      // Check if any input inside got selected
      const innerInput = choice.element.querySelector<HTMLInputElement>('input');
      if (innerInput?.checked) {
        highlightSelected(choice.element);
        return { success: true };
      }
    }
    
    return { success: false, error: 'All selection strategies failed' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Selection error',
    };
  }
}

/**
 * Dispatch input and change events
 */
function dispatchInputEvents(element: HTMLElement): void {
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

/**
 * Add visual highlight to selected element
 */
function highlightSelected(element: HTMLElement): void {
  element.setAttribute('data-qorva-selected', 'true');
  element.style.outline = '2px solid #4CAF50';
  element.style.outlineOffset = '2px';
  
  // Remove highlight after 2 seconds
  setTimeout(() => {
    element.style.outline = '';
    element.style.outlineOffset = '';
  }, 2000);
}

/**
 * Check if element is a question text element
 */
function isQuestionTextElement(element: HTMLElement): boolean {
  const questionTextSelector = QUIZ_SELECTORS.questionText.join(', ');
  return element.matches(questionTextSelector);
}

/**
 * Select answer by text matching (fallback)
 */
export async function selectAnswerByText(
  container: HTMLElement,
  answerTexts: string[],
  config: QuizConfig
): Promise<SelectResult> {
  const choices = getChoiceElements(container);
  const selectedIndices: number[] = [];
  
  for (const answerText of answerTexts) {
    const normalizedAnswer = normalizeText(answerText);
    
    // Find matching choice
    const matchIndex = choices.findIndex(choice => {
      const normalizedChoice = normalizeText(choice.text);
      return (
        normalizedChoice === normalizedAnswer ||
        normalizedChoice.includes(normalizedAnswer) ||
        normalizedAnswer.includes(normalizedChoice)
      );
    });
    
    if (matchIndex >= 0) {
      // Add delay between selections
      if (selectedIndices.length > 0) {
        await sleep(randomDelay(config.delayMin, config.delayMax));
      }
      
      const result = await selectChoice(choices[matchIndex]);
      if (result.success) {
        selectedIndices.push(matchIndex);
      }
    }
  }
  
  return {
    success: selectedIndices.length === answerTexts.length,
    selectedIndices,
    error: selectedIndices.length === 0 ? 'No matching choices found' : undefined,
  };
}
