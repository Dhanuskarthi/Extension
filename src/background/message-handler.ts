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
import { licenseManager } from './license-manager';

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
    
    case MSG_TYPES.LLM_ANALYZE_IMAGE:
      return handleImageAnalysis(message.payload as { imageUrl: string });
    
    case MSG_TYPES.CFG_GET:
      return handleConfigGet();
    
    case MSG_TYPES.CFG_SET:
      return handleConfigSet(message.payload as Partial<Config>);
    
    case MSG_TYPES.STATUS_GET:
      return handleStatusGet();
    
    case MSG_TYPES.LICENSE_CHECK:
      return handleLicenseCheck();
    
    case MSG_TYPES.LICENSE_INCREMENT:
      return handleLicenseIncrement();
    
    case MSG_TYPES.LICENSE_ACTIVATE:
      return handleLicenseActivate(message.payload as { licenseKey: string });
    
    case MSG_TYPES.LICENSE_DEACTIVATE:
      return handleLicenseDeactivate();
    
    case MSG_TYPES.LICENSE_STATS:
      return handleLicenseStats();
    
    case 'OPEN_OPTIONS':
      chrome.runtime.openOptionsPage();
      return { ok: true };
    
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
 * Handle image analysis request
 */
async function handleImageAnalysis(
  payload: { imageUrl: string }
): Promise<MessageResponse> {
  const result = await llmRouter.analyzeImage(payload.imageUrl);
  
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

/**
 * Handle license check request
 */
async function handleLicenseCheck(): Promise<MessageResponse> {
  const result = await licenseManager.canMakeRequest();
  return { ok: result.allowed, error: result.reason };
}

/**
 * Handle license increment request
 */
async function handleLicenseIncrement(): Promise<MessageResponse> {
  await licenseManager.incrementUsage();
  return { ok: true };
}

/**
 * Handle license activation request
 */
async function handleLicenseActivate(
  payload: { licenseKey: string }
): Promise<MessageResponse> {
  const result = await licenseManager.activatePro(payload.licenseKey);
  return { ok: result.success, error: result.error };
}

/**
 * Handle license deactivation request
 */
async function handleLicenseDeactivate(): Promise<MessageResponse> {
  await licenseManager.deactivatePro();
  return { ok: true };
}

/**
 * Handle license stats request
 */
async function handleLicenseStats(): Promise<MessageResponse> {
  const stats = await licenseManager.getUsageStats();
  return { ok: true, data: stats };
}
