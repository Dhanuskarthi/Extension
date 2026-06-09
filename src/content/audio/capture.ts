/**
 * QORVA - Audio Capture
 * Handles audio capture from microphone
 */

export type AudioCaptureSource = 'mic' | 'system';

export interface AudioCaptureOptions {
  source: AudioCaptureSource;
  sampleRate?: number;
  onAudioData?: (data: Float32Array) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: (audioBlob: Blob) => void;
  onError?: (error: Error) => void;
}

class AudioCapture {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private isCapturing = false;
  private options: AudioCaptureOptions | null = null;

  /**
   * Start capturing audio
   */
  async start(options: AudioCaptureOptions): Promise<void> {
    if (this.isCapturing) {
      await this.stop();
    }
    
    this.options = options;
    
    try {
      if (options.source === 'mic') {
        await this.startMicCapture();
      } else {
        // System audio requires offscreen document
        await this.requestSystemAudio();
      }
      
      this.isCapturing = true;
      console.log(`[QORVA] Audio capture started: ${options.source}`);
    } catch (error) {
      this.options?.onError?.(error instanceof Error ? error : new Error('Failed to start capture'));
      throw error;
    }
  }

  /**
   * Stop capturing
   */
  async stop(): Promise<void> {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.stop();
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.audioContext?.state !== 'closed') {
      await this.audioContext?.close();
      this.audioContext = null;
    }
    
    this.analyser = null;
    this.isCapturing = false;
    console.log('[QORVA] Audio capture stopped');
  }

  /**
   * Start microphone capture
   */
  private async startMicCapture(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: this.options?.sampleRate || 16000,
      },
    });
    
    await this.setupAudioProcessing(this.stream);
  }

  /**
   * Request system audio via offscreen document
   */
  private async requestSystemAudio(): Promise<void> {
    // Send message to background to create offscreen document
    const response = await chrome.runtime.sendMessage({
      type: 'OFFSCREEN_AUDIO_CAPTURE',
      payload: { action: 'start' },
    });
    
    if (!response?.ok) {
      throw new Error('Failed to capture system audio');
    }
    
    // For system audio, we'll receive data via messaging
    console.log('[QORVA] System audio capture requested');
  }

  /**
   * Setup audio processing pipeline
   */
  private async setupAudioProcessing(stream: MediaStream): Promise<void> {
    this.audioContext = new AudioContext({
      sampleRate: this.options?.sampleRate || 16000,
    });
    
    const source = this.audioContext.createMediaStreamSource(stream);
    
    // Create analyser for visualization/VAD
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    source.connect(this.analyser);
    
    // Setup MediaRecorder for recording
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
    });
    
    const chunks: Blob[] = [];
    
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };
    
    this.mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      this.options?.onSpeechEnd?.(blob);
      chunks.length = 0;
    };
    
    // Start audio level monitoring
    this.startAudioMonitoring();
  }

  /**
   * Start audio level monitoring for VAD
   */
  private startAudioMonitoring(): void {
    if (!this.analyser || !this.audioContext) return;
    
    const dataArray = new Float32Array(this.analyser.frequencyBinCount);
    let isSpeaking = false;
    const silenceThreshold = -50; // dB
    let silenceFrames = 0;
    const maxSilenceFrames = 30; // ~500ms at 60fps
    
    const monitor = () => {
      if (!this.isCapturing || !this.analyser) return;
      
      this.analyser.getFloatTimeDomainData(dataArray);
      
      // Calculate RMS
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const db = 20 * Math.log10(rms);
      
      // Pass data to callback
      this.options?.onAudioData?.(dataArray);
      
      // Simple VAD
      if (db > silenceThreshold) {
        silenceFrames = 0;
        if (!isSpeaking) {
          isSpeaking = true;
          this.options?.onSpeechStart?.();
          if (this.mediaRecorder?.state === 'inactive') {
            this.mediaRecorder.start();
          }
        }
      } else {
        silenceFrames++;
        if (isSpeaking && silenceFrames > maxSilenceFrames) {
          isSpeaking = false;
          if (this.mediaRecorder?.state === 'recording') {
            this.mediaRecorder.stop();
          }
        }
      }
      
      requestAnimationFrame(monitor);
    };
    
    monitor();
  }

  /**
   * Start recording
   */
  startRecording(): void {
    if (this.mediaRecorder?.state === 'inactive') {
      this.mediaRecorder.start();
      this.options?.onSpeechStart?.();
    }
  }

  /**
   * Stop recording
   */
  stopRecording(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.stop();
    }
  }

  /**
   * Check if currently capturing
   */
  isActive(): boolean {
    return this.isCapturing;
  }

  /**
   * Get audio level (0-1)
   */
  getAudioLevel(): number {
    if (!this.analyser) return 0;
    
    const dataArray = new Float32Array(this.analyser.frequencyBinCount);
    this.analyser.getFloatTimeDomainData(dataArray);
    
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    
    return Math.sqrt(sum / dataArray.length);
  }
  /**
   * Record and transcribe using Whisper
   */
  async recordAndTranscribe(durationMs: number = 10000): Promise<string | null> {
    return new Promise((resolve) => {
      const chunks: Blob[] = [];
      
      (async () => {
        try {
          await this.start({
            source: 'mic',
            sampleRate: 16000,
            onSpeechEnd: async (blob) => {
              chunks.push(blob);
            },
            onError: (error) => {
              console.error('[QORVA] Recording error:', error);
              resolve(null);
            }
          });
          
          // Start recording immediately
          this.startRecording();
          
          // Stop after duration
          setTimeout(async () => {
            try {
              this.stopRecording();
              await this.stop();
              
              if (chunks.length === 0) {
                resolve(null);
                return;
              }
              
              // Combine chunks and transcribe
              const audioBlob = new Blob(chunks, { type: 'audio/webm' });
              const transcript = await this.transcribeBlob(audioBlob);
              resolve(transcript);
            } catch (err) {
              console.error('[QORVA] Stop/transcribe error:', err);
              resolve(null);
            }
          }, durationMs);
          
        } catch (error) {
          console.error('[QORVA] Record and transcribe failed:', error);
          resolve(null);
        }
      })();
    });
  }

  /**
   * Transcribe audio blob using Whisper
   */
  async transcribeBlob(blob: Blob): Promise<string | null> {
    try {
      // Convert blob to array buffer
      const arrayBuffer = await blob.arrayBuffer();
      
      // Create audio context to decode
      const audioContext = new AudioContext({ sampleRate: 16000 });
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const audioData = audioBuffer.getChannelData(0);
      
      await audioContext.close();
      
      // Use Whisper to transcribe
      const { transcribeFromBuffer } = await import('./whisper');
      const result = await transcribeFromBuffer(audioData);
      
      return result?.text || null;
    } catch (error) {
      console.error('[QORVA] Blob transcription failed:', error);
      return null;
    }
  }
}

// Export singleton
export const audioCapture = new AudioCapture();
