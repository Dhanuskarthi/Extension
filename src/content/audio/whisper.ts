/**
 * QORVA - Whisper Transcription Module
 * Uses @xenova/transformers to run Whisper model in browser
 * Zero-cost, local speech-to-text
 */

import { pipeline, type Pipeline } from '@xenova/transformers';

// Types
interface TranscriptionResult {
  text: string;
  chunks?: Array<{ text: string; timestamp: [number, number] }>;
}

interface TranscriptionProgress {
  status: 'loading' | 'ready' | 'transcribing' | 'complete' | 'error';
  progress?: number;
  message?: string;
}

type ProgressCallback = (progress: TranscriptionProgress) => void;

// Singleton instance
let whisperPipeline: Pipeline | null = null;
let isLoading = false;
let loadPromise: Promise<Pipeline> | null = null;

// Model configuration - using tiny model for speed and size
const MODEL_NAME = 'Xenova/whisper-tiny';

/**
 * Initialize the Whisper pipeline
 * Downloads model on first use (~40MB)
 */
export async function initWhisper(onProgress?: ProgressCallback): Promise<boolean> {
  if (whisperPipeline) {
    onProgress?.({ status: 'ready', message: 'Model already loaded' });
    return true;
  }
  
  if (isLoading && loadPromise) {
    await loadPromise;
    return whisperPipeline !== null;
  }
  
  isLoading = true;
  onProgress?.({ status: 'loading', progress: 0, message: 'Loading Whisper model...' });
  
  try {
    loadPromise = pipeline('automatic-speech-recognition', MODEL_NAME, {
      progress_callback: (data: { progress?: number; status?: string }) => {
        if (data.progress) {
          onProgress?.({ 
            status: 'loading', 
            progress: Math.round(data.progress),
            message: `Downloading model: ${Math.round(data.progress)}%`
          });
        }
      }
    });
    
    whisperPipeline = await loadPromise;
    onProgress?.({ status: 'ready', progress: 100, message: 'Model loaded' });
    console.log('[QORVA] Whisper model loaded successfully');
    return true;
  } catch (error) {
    console.error('[QORVA] Failed to load Whisper model:', error);
    onProgress?.({ 
      status: 'error', 
      message: `Failed to load model: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    return false;
  } finally {
    isLoading = false;
    loadPromise = null;
  }
}

/**
 * Transcribe audio from URL
 */
export async function transcribeFromUrl(
  audioUrl: string, 
  onProgress?: ProgressCallback
): Promise<TranscriptionResult | null> {
  // Ensure model is loaded
  if (!whisperPipeline) {
    const loaded = await initWhisper(onProgress);
    if (!loaded) {
      return null;
    }
  }
  
  try {
    onProgress?.({ status: 'transcribing', message: 'Fetching audio...' });
    
    // Fetch audio file
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    onProgress?.({ status: 'transcribing', message: 'Converting audio...' });
    
    // Convert to AudioBuffer using Web Audio API
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Get float32 data from first channel
    const audioData = audioBuffer.getChannelData(0);
    
    onProgress?.({ status: 'transcribing', message: 'Transcribing...' });
    
    // Run transcription
    const result = await whisperPipeline!(audioData, {
      chunk_length_s: 30,
      stride_length_s: 5,
      language: 'english',
      task: 'transcribe',
      return_timestamps: true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;
    
    onProgress?.({ status: 'complete', message: 'Transcription complete' });
    
    // Clean up audio context
    await audioContext.close();
    
    return {
      text: result.text || '',
      chunks: result.chunks || []
    };
  } catch (error) {
    console.error('[QORVA] Transcription failed:', error);
    onProgress?.({ 
      status: 'error', 
      message: `Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    return null;
  }
}

/**
 * Transcribe audio from AudioBuffer
 */
export async function transcribeFromBuffer(
  audioData: Float32Array,
  onProgress?: ProgressCallback
): Promise<TranscriptionResult | null> {
  // Ensure model is loaded
  if (!whisperPipeline) {
    const loaded = await initWhisper(onProgress);
    if (!loaded) {
      return null;
    }
  }
  
  try {
    onProgress?.({ status: 'transcribing', message: 'Transcribing...' });
    
    // Run transcription  
    const result = await whisperPipeline!(audioData, {
      chunk_length_s: 30,
      stride_length_s: 5,
      language: 'english',
      task: 'transcribe',
      return_timestamps: true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;
    
    onProgress?.({ status: 'complete', message: 'Transcription complete' });
    
    return {
      text: result.text || '',
      chunks: result.chunks || []
    };
  } catch (error) {
    console.error('[QORVA] Transcription failed:', error);
    onProgress?.({ 
      status: 'error', 
      message: `Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    return null;
  }
}

/**
 * Check if Whisper is ready
 */
export function isWhisperReady(): boolean {
  return whisperPipeline !== null;
}

/**
 * Get current model status
 */
export function getWhisperStatus(): 'unloaded' | 'loading' | 'ready' {
  if (whisperPipeline) return 'ready';
  if (isLoading) return 'loading';
  return 'unloaded';
}
