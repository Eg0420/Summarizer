/**
 * Token tracking and rate limiting
 */

interface Usage {
  totalTokens: number;
  embeddingTokens: number;
  completionTokens: number;
}

let usage: Usage = {
  totalTokens: 0,
  embeddingTokens: 0,
  completionTokens: 0,
};

let questionCount = 0;
let pdfUploadCount = 0;

const LIMITS = {
  questions: 20,
  pdfUploads: 5,
};

/**
 * Track token usage
 */
export function trackTokenUsage(
  type: 'embedding' | 'completion',
  tokens: number
) {
  if (type === 'embedding') {
    usage.embeddingTokens += tokens;
  } else {
    usage.completionTokens += tokens;
  }

  usage.totalTokens += tokens;
}

/**
 * Get session usage
 */
export function getSessionUsage() {
  return { ...usage };
}

/**
 * Enforce rate limits
 */
export function checkAndEnforceRateLimit(
  type: 'question' | 'pdf_upload'
) {
  if (type === 'question') {
    if (questionCount >= LIMITS.questions) {
      throw new Error('Rate limit exceeded');
    }
    questionCount++;
  }

  if (type === 'pdf_upload') {
    if (pdfUploadCount >= LIMITS.pdfUploads) {
      throw new Error('Rate limit exceeded');
    }
    pdfUploadCount++;
  }
}

/**
 * Get remaining quota
 */
export function getRemainingQuota() {
  return {
    questionsRemaining: LIMITS.questions - questionCount,
    pdfsRemaining: LIMITS.pdfUploads - pdfUploadCount,
    tokensUsed: usage.totalTokens,
  };
}

/**
 * Reset state (IMPORTANT for tests)
 */
export function resetUsage() {
  usage = {
    totalTokens: 0,
    embeddingTokens: 0,
    completionTokens: 0,
  };
  questionCount = 0;
  pdfUploadCount = 0;
}