/**
 * QORVA - Constants and Default Values
 */

import type { Config } from './types';

// ============ Message Types ============

export const MSG_TYPES = {
  LLM_ANSWER_QUIZ: 'LLM_ANSWER_QUIZ',
  LLM_ANSWER_AUDIO: 'LLM_ANSWER_AUDIO',
  LLM_ANALYZE_IMAGE: 'LLM_ANALYZE_IMAGE',
  CFG_GET: 'CFG_GET',
  CFG_SET: 'CFG_SET',
  STATUS_GET: 'STATUS_GET',
  OFFSCREEN_AUDIO_CAPTURE: 'OFFSCREEN_AUDIO_CAPTURE',
  LICENSE_CHECK: 'LICENSE_CHECK',
  LICENSE_INCREMENT: 'LICENSE_INCREMENT',
  LICENSE_ACTIVATE: 'LICENSE_ACTIVATE',
  LICENSE_DEACTIVATE: 'LICENSE_DEACTIVATE',
  LICENSE_STATS: 'LICENSE_STATS',
} as const;

// ============ Supported Languages ============

export const SUPPORTED_LANGUAGES = [
  { code: 'vi', name: 'Tiếng Việt', free: true },
  { code: 'th', name: 'ไทย', free: false },
  { code: 'es', name: 'Español', free: false },
  { code: 'zh', name: '中文', free: false },
  { code: 'ja', name: '日本語', free: false },
  { code: 'ko', name: '한국어', free: false },
  { code: 'fr', name: 'Français', free: false },
  { code: 'id', name: 'Bahasa Indonesia', free: false },
] as const;

// ============ Default Configuration ============

export const DEFAULT_CONFIG: Config = {
  llm: {
    provider: 'gemini',
    gemini: {
      apiKey: '',
      model: 'gemini-2.5-flash',
    },
    openai: {
      apiKey: '',
      model: 'gpt-4o-mini',
      baseURL: 'https://api.openai.com/v1',
    },
    claude: {
      apiKey: '',
      model: 'claude-3-haiku-20240307',
    },
  },
  quiz: {
    auto: true,
    autoSubmit: false,
    delayMin: 50,
    delayMax: 200,
  },
  audio: {
    enabled: false,
    source: 'system',
    tts: true,
    ttsVoice: 'Female-Primary',
    volume: 0.5,
    pushToTalk: 'Alt+Space',
    autoCopy: false,
    autoSend: false,
  },
  cache: {
    enabled: true,
    ttlHours: 24,
  },
  ui: {
    theme: 'system',
    accentColor: '#a78bfa',
    textColor: '#ffffff',
    showExplanation: false,
    modalPosition: 'top-right',
    translation: {
      enabled: false,
      language: 'vi',
      scope: 'answer', // FREE tier default
    },
  },
  pro: {
    isPro: false,
    devMode: false, // Production mode - enforces limits
    dailyLimit: 10, // Free tier: 10 questions/day
    usedToday: 0,
    lastResetDate: new Date().toDateString(),
  },
  blacklistDomains: [],
};

// ============ DOM Selectors ============

export const QUIZ_SELECTORS = {
  // Question containers - ordered by specificity
  containers: [
    // Study4.com (TOEIC/IELTS)
    '.question-wrapper',
    '[data-qid]',
    
    // Google Forms
    '[data-item-id]',
    '.freebirdFormviewerViewItemsItemItem',
    '.Qr7Oae',
    
    // Moodle LMS
    '.que',
    '.qtext',
    '.formulation',
    
    // Canvas LMS
    '.question',
    '.question_holder',
    '.display_question',
    
    // Blackboard
    '.vtbegenerated',
    '.questionContent',
    
    // Generic patterns
    '[data-question]',
    '.quiz-item',
    '.mcq',
    '.question-card',
    '.quiz-question',
    '.test-question',
    '[role="group"]',
    'fieldset',
  ],

  // Question text
  questionText: [
    // Study4.com
    '.question-text',
    '.question-number',
    
    // Google Forms
    '.M7eMe',
    '.freebirdFormviewerComponentsQuestionBaseTitle',
    
    // Moodle
    '.qtext',
    
    // Generic
    '.prompt',
    '.title',
    'legend',
    'h2',
    'h3',
    'h4',
    '[role="heading"]',
    '.question-title',
    '.quiz-question-text',
  ],

  // Choice elements - INDIVIDUAL choice items only (not containers)
  choices: [
    // Study4.com / Bootstrap
    '.form-check',
    '.form-check-label',
    
    // Google Forms
    '.docssharedWizToggleLabeledContainer',
    '.nWQGrd',
    '.AB7Lab',
    
    // Moodle - individual choice rows (NOT .answer which is container!)
    '.r0',
    '.r1',
    '[data-region="answer-label"]',
    '.answernumber',
    
    // Generic
    'label',
    '.choice',
    '.option',
    '.answer-option',
    '.quiz-option',
    '[role="radio"]',
    '[role="checkbox"]',
    '[role="option"]',
    'li',
  ],

  // Submit buttons
  submit: [
    'button[type="submit"]',
    'input[type="submit"]',
    '[role="button"]',
    '.submit',
    '.finish',
    '.turn-in',
    '.nộp',
    '.hoàn-thành',
    '.btn-submit',
    '.submit-btn',
    '.check-answer',
    '.submit-answer',
    // Google Forms
    '.freebirdFormviewerViewNavigationSubmitButton',
  ],
  
  // Next page / navigation buttons (NOT submit)
  nextPage: [
    // Moodle
    '#mod_quiz-next-nav',
    '.mod_quiz-next-nav',
    '[name="next"]',
    'input[value="Next page"]',
    'input[value="Trang tiếp"]',
    // Generic
    '.next-btn',
    '.next-page',
    '.btn-next',
    'button:contains("Next")',
    'button:contains("Tiếp")',
    '[aria-label*="next"]',
    '[aria-label*="Next"]',
    // Study4
    '.next-question',
    '.btn-navigation-next',
  ],
};

// ============ LLM API Endpoints ============

export const LLM_ENDPOINTS = {
  gemini: 'https://generativelanguage.googleapis.com/v1/models',
  openai: 'https://api.openai.com/v1/chat/completions',
  claude: 'https://api.anthropic.com/v1/messages',
};

// ============ LLM Prompt Templates ============

export const PROMPTS = {
  quiz: `You are a quiz AI. Return ONLY valid JSON:
{"answer_index": <INTEGER>, "explanation": "<brief explanation>"{{#translate}}, "translation": {"answer": "<translated answer>", "explanation": "<translated explanation>"}{{/translate}}}

Question: {{question_text}}

Choices:
{{choices}}

IMPORTANT RULES:
- answer_index MUST be the NUMBER in parentheses before the correct choice
- If choices are (0), (1), (2), (3) then valid indices are 0, 1, 2, 3
- Return the NUMBER, not a letter
- DO NOT return text outside of JSON
{{#translate}}- Also translate the answer and explanation to {{language}}{{/translate}}`,

  audio: `Question: "{{transcript}}"
Answer briefly and accurately. Pure JSON only:
{"answer":"<answer>", "explanation":"<brief if needed>"}`,
};

// ============ Rate Limiting ============

export const RATE_LIMIT = {
  maxConcurrent: 5, // Allow more parallel requests for faster processing
  retryDelay: 500, // Reduced from 1500ms
  maxRetries: 2,
};

// ============ Performance ============

export const PERFORMANCE = {
  domScanDebounce: 100, // Reduced from 200ms for faster detection
  clickDelay: { min: 30, max: 100 }, // Faster auto-selection
  audioQATimeout: 3000, // ms
  quizSelectTimeout: 150, // Reduced from 300ms
};

// ============ Storage Keys ============

export const STORAGE_KEYS = {
  config: 'qorva_config',
  cache: 'qorva_cache',
};

// ============ Offscreen Reasons ============

export const OFFSCREEN_REASONS = {
  audioCapture: 'AUDIO_PLAYBACK' as chrome.offscreen.Reason,
};
