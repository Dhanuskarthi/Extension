/**
 * QORVA - Intent Detection
 * Detects questions in transcripts
 */

const QUESTION_PATTERNS_VI = [
  /^(gì|sao|là gì|thế nào|tại sao|bao nhiêu|khi nào|ở đâu|ai|nào)\??$/i,
  /(là gì|như thế nào|thế nào|tại sao|vì sao|bao nhiêu|khi nào|ở đâu|cho ai|của ai)\??/i,
  /^(hãy|cho biết|giải thích|định nghĩa|mô tả|liệt kê)/i,
  /(câu hỏi|trả lời|đáp án)/i,
  /\?$/,
];

const QUESTION_PATTERNS_EN = [
  /^(what|how|why|when|where|who|which|whose|whom)\s/i,
  /\?$/,
  /^(can|could|would|should|is|are|was|were|do|does|did|have|has|had)\s.*\?/i,
  /^(explain|describe|define|list|name|give)\s/i,
  /(tell me|let me know|inform me)/i,
];

export interface IntentResult {
  isQuestion: boolean;
  confidence: number;
  language: 'vi' | 'en';
  text: string;
}

/**
 * Detect if transcript contains a question
 */
export function detectQuestion(transcript: string): IntentResult {
  const text = transcript.trim();
  
  if (text.length < 5) {
    return { isQuestion: false, confidence: 0, language: 'vi', text };
  }
  
  // Detect language
  const language = detectLanguage(text);
  
  // Get patterns based on language
  const patterns = language === 'vi' ? QUESTION_PATTERNS_VI : QUESTION_PATTERNS_EN;
  
  // Check patterns
  let matchCount = 0;
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      matchCount++;
    }
  }
  
  // Calculate confidence
  const confidence = Math.min(matchCount / patterns.length * 2, 1);
  const isQuestion = confidence > 0.2 || text.endsWith('?');
  
  return {
    isQuestion,
    confidence,
    language,
    text,
  };
}

/**
 * Detect language of text
 */
function detectLanguage(text: string): 'vi' | 'en' {
  const viPattern = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
  return viPattern.test(text) ? 'vi' : 'en';
}

/**
 * Extract the most likely question from a transcript
 */
export function extractQuestion(transcript: string): string | null {
  const sentences = transcript.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  
  // Find sentences that are questions
  const questions: { text: string; confidence: number }[] = [];
  
  for (const sentence of sentences) {
    const result = detectQuestion(sentence);
    if (result.isQuestion) {
      questions.push({ text: sentence, confidence: result.confidence });
    }
  }
  
  // Return the highest confidence question
  if (questions.length > 0) {
    questions.sort((a, b) => b.confidence - a.confidence);
    return questions[0].text;
  }
  
  // If no clear question, check if the whole transcript is a question
  if (transcript.endsWith('?') || transcript.length < 100) {
    return transcript;
  }
  
  // Return the last sentence as it's most likely the question
  return sentences[sentences.length - 1] || null;
}

/**
 * Check if transcript is asking for help/answer
 */
export function isHelpRequest(transcript: string): boolean {
  const helpPatterns = [
    /giúp (tôi|mình|em)/i,
    /help me/i,
    /trả lời/i,
    /đáp án/i,
    /answer/i,
    /cho (tôi|mình|em) biết/i,
  ];
  
  return helpPatterns.some(pattern => pattern.test(transcript));
}
