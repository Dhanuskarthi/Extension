/**
 * QORVA - Message Handler
 * Handles chrome.runtime message passing
 */

import type {
  Message,
  MessageResponse,
  QuizQuestion,
  Config,
} from '../shared/types';
import { MSG_TYPES } from '../shared/constants';
import { configManager } from './config-manager';
import { llmRouter } from './llm-router';
import { cacheManager } from './cache-manager';

/**
 * Setup message listener
 */
export function setupMessageHandler(): void {
  chrome.runtime.onMessage.addListener(
    (
      message: Message,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response: MessageResponse) => void
    ) => {
      handleMessage(message)
        .then(sendResponse)
        .catch(error => {
          sendResponse({
            ok: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        });
      
      // Return true to indicate async response
      return true;
    }
  );
}

/**
 * Handle incoming message
 */
async function handleMessage(message: Message): Promise<MessageResponse> {
  switch (message.type) {
    case MSG_TYPES.LLM_ANSWER_QUIZ:
      return handleQuizAnswer(message.payload as QuizQuestion);
    
    case MSG_TYPES.LLM_ANSWER_AUDIO:
      return handleAudioAnswer(message.payload as { transcript: string });
    
    case MSG_TYPES.CFG_GET:
      return handleConfigGet();
    
    case MSG_TYPES.CFG_SET:
      return handleConfigSet(message.payload as Partial<Config>);
    
    case MSG_TYPES.STATUS_GET:
      return handleStatusGet();
    
    default:
      return { ok: false, error: `Unknown message type: ${message.type}` };
  }
}

/**
 * Handle quiz answer request
 */
async function handleQuizAnswer(
  question: QuizQuestion
): Promise<MessageResponse> {
  // Check cache first
  const cached = await cacheManager.getQuizAnswer(question);
  if (cached) {
    return { ok: true, data: cached };
  }
  
  // Call LLM
  const result = await llmRouter.answerQuiz(question);
  
  if (!result.success) {
    return {
      ok: false,
      error: result.error,
    };
  }
  
  // Cache the answer
  if (result.data) {
    await cacheManager.setQuizAnswer(question, result.data);
  }
  
  return { ok: true, data: result.data };
}

/**
 * Handle audio answer request
 */
async function handleAudioAnswer(
  payload: { transcript: string }
): Promise<MessageResponse> {
  const result = await llmRouter.answerAudio(payload.transcript);
  
  if (!result.success) {
    return {
      ok: false,
      error: result.error,
    };
  }
  
  return { ok: true, data: result.data };
}

/**
 * Handle config get request
 */
async function handleConfigGet(): Promise<MessageResponse> {
  const config = await configManager.get();
  return { ok: true, data: config };
}

/**
 * Handle config set request
 */
async function handleConfigSet(
  updates: Partial<Config>
): Promise<MessageResponse> {
  try {
    await configManager.set(updates);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to save config',
    };
  }
}

/**
 * Handle status get request
 */
async function handleStatusGet(): Promise<MessageResponse> {
  const config = await configManager.get();
  const llmStatus = llmRouter.getStatus();
  const hasApiKey = await configManager.isApiKeyConfigured();
  
  return {
    ok: true,
    data: {
      provider: config.llm.provider,
      hasApiKey,
      quizAuto: config.quiz.auto,
      audioEnabled: config.audio.enabled,
      llmQueue: llmStatus,
    },
  };
}
