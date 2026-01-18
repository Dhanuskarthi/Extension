/**
 * QORVA - Speech-to-Text
 * Handles speech recognition using Web Speech API
 */

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
  readonly resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export interface STTOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: Error) => void;
  onEnd?: () => void;
}

class SpeechToText {
  private recognition: SpeechRecognitionInstance | null = null;
  private isListening = false;
  private options: STTOptions = {};

  constructor() {
    // Check if speech recognition is supported
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('[QORVA] Speech recognition not supported');
    }
  }

  /**
   * Start speech recognition
   */
  start(options: STTOptions = {}): void {
    if (this.isListening) {
      this.stop();
    }
    
    this.options = options;
    
    try {
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionClass) {
        throw new Error('Speech recognition not supported');
      }
      
      this.recognition = new SpeechRecognitionClass();
      
      this.recognition.continuous = options.continuous ?? true;
      this.recognition.interimResults = options.interimResults ?? true;
      this.recognition.lang = options.language || 'vi-VN';
      
      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const results = event.results;
        const lastResult = results[results.length - 1];
        const transcript = lastResult[0].transcript;
        const isFinal = lastResult.isFinal;
        
        this.options.onResult?.(transcript, isFinal);
      };
      
      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('[QORVA] STT error:', event.error);
        this.options.onError?.(new Error(event.error));
      };
      
      this.recognition.onend = () => {
        this.isListening = false;
        this.options.onEnd?.();
        
        // Restart if continuous
        if (this.options.continuous && this.recognition) {
          try {
            this.recognition.start();
            this.isListening = true;
          } catch {
            // Might be aborted, ignore
          }
        }
      };
      
      this.recognition.start();
      this.isListening = true;
      console.log('[QORVA] STT started');
    } catch (error) {
      this.options.onError?.(error instanceof Error ? error : new Error('STT failed'));
    }
  }

  /**
   * Stop speech recognition
   */
  stop(): void {
    if (this.recognition) {
      this.recognition.abort();
      this.recognition = null;
    }
    this.isListening = false;
    console.log('[QORVA] STT stopped');
  }

  /**
   * Check if currently listening
   */
  isActive(): boolean {
    return this.isListening;
  }

  /**
   * Check if speech recognition is supported
   */
  static isSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }
}

// Export singleton
export const stt = new SpeechToText();
