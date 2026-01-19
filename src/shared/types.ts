/**
 * QORVA - Shared TypeScript Types
 */

// ============ LLM Provider Types ============

export type LLMProvider = 'gemini' | 'openai' | 'claude';

export interface LLMProviderConfig {
  apiKey: string;
  model: string;
  baseURL?: string;
}

export interface LLMConfig {
  provider: LLMProvider;
  gemini: LLMProviderConfig;
  openai: LLMProviderConfig;
  claude: LLMProviderConfig;
}

// ============ Quiz Types ============

export interface QuizQuestion {
  id: string;
  text: string;
  choices: string[];
  allowMultiple: boolean;
  meta?: {
    lang?: 'vi' | 'en';
    source?: 'auto' | 'manual';
  };
}

export interface QuizAnswer {
  answer_index: number | number[];
  explanation: string;
}

export interface QuizConfig {
  auto: boolean;
  autoSubmit: boolean;
  delayMin: number;
  delayMax: number;
}

// ============ Audio Types ============

export type AudioSource = 'system' | 'mic' | 'both';

export interface AudioQARequest {
  transcript: string;
  context?: string;
}

export interface AudioQAResponse {
  answer: string;
  explanation?: string;
}

export interface AudioConfig {
  enabled: boolean;
  source: AudioSource;
  tts: boolean;
  ttsVoice: string;
  volume: number;
  pushToTalk: string;
  autoCopy: boolean;
  autoSend: boolean;
}

// ============ Cache Types ============

export interface CacheConfig {
  enabled: boolean;
  ttlHours: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// ============ Config Types ============

export interface UIConfig {
  theme: 'dark' | 'light' | 'system';
  accentColor: string;
  textColor: string;
  showExplanation: boolean;
}

export interface Config {
  llm: LLMConfig;
  quiz: QuizConfig;
  audio: AudioConfig;
  cache: CacheConfig;
  ui: UIConfig;
  blacklistDomains: string[];
}

// ============ Message Types ============

export type MessageType =
  | 'LLM_ANSWER_QUIZ'
  | 'LLM_ANSWER_AUDIO'
  | 'CFG_GET'
  | 'CFG_SET'
  | 'STATUS_GET'
  | 'OFFSCREEN_AUDIO_CAPTURE';

export interface Message<T = unknown> {
  type: MessageType;
  payload?: T;
}

export interface MessageResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

// ============ UI Types ============

export interface OverlayPosition {
  x: number;
  y: number;
}

export interface QuizCardData {
  question: QuizQuestion;
  answer: QuizAnswer;
  status: 'loading' | 'success' | 'error';
  errorMessage?: string;
}

export interface AudioCardData {
  transcript: string;
  answer?: AudioQAResponse;
  status: 'listening' | 'processing' | 'ready' | 'error';
  errorMessage?: string;
}

// ============ LLM Request Types ============

export interface LLMQuizRequest {
  question: QuizQuestion;
}

export interface LLMResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  retryable?: boolean;
}
