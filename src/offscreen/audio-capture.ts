/**
 * QORVA - Offscreen Document for Audio Capture
 * Used for capturing system audio in MV3
 */

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'OFFSCREEN_AUDIO_CAPTURE') {
    handleAudioCapture(message.payload)
      .then(result => sendResponse({ ok: true, data: result }))
      .catch(error => sendResponse({ ok: false, error: error.message }));
    return true;
  }
});

interface CapturePayload {
  action: 'start' | 'stop';
}

let mediaStream: MediaStream | null = null;
let mediaRecorder: MediaRecorder | null = null;

/**
 * Handle audio capture commands
 */
async function handleAudioCapture(payload: CapturePayload): Promise<unknown> {
  switch (payload.action) {
    case 'start':
      return startCapture();
    case 'stop':
      return stopCapture();
    default:
      throw new Error(`Unknown action: ${payload.action}`);
  }
}

/**
 * Start capturing audio
 */
async function startCapture(): Promise<{ status: string }> {
  if (mediaStream) {
    return { status: 'already_capturing' };
  }
  
  try {
    // Request tab audio capture
    // Note: This requires tabCapture permission and user gesture
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    
    // Setup MediaRecorder
    mediaRecorder = new MediaRecorder(mediaStream, {
      mimeType: 'audio/webm;codecs=opus',
    });
    
    const chunks: Blob[] = [];
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      // Send audio data back to background/content
      chrome.runtime.sendMessage({
        type: 'AUDIO_DATA',
        payload: { blob: URL.createObjectURL(blob) },
      });
    };
    
    mediaRecorder.start(1000); // Capture in 1-second chunks
    
    console.log('[QORVA Offscreen] Audio capture started');
    return { status: 'started' };
  } catch (error) {
    console.error('[QORVA Offscreen] Failed to start capture:', error);
    throw error;
  }
}

/**
 * Stop capturing audio
 */
function stopCapture(): { status: string } {
  if (mediaRecorder?.state === 'recording') {
    mediaRecorder.stop();
  }
  
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  
  mediaRecorder = null;
  
  console.log('[QORVA Offscreen] Audio capture stopped');
  return { status: 'stopped' };
}

console.log('[QORVA] Offscreen document loaded');
