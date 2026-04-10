/**
 * Token tracking and rate limiting for the summarizer application
 * Tracks all LLM token usage and enforces per-session limits
 */

interface SessionUsage {
  totalTokens: number;
  embeddingTokens: number;
  completionTokens: number;
  questionsAsked: number;
  pdfsUploaded: number;
  timestamp: number;
}

interface RateQuota {
  questionsRemaining: number;
  pdfsRemaining: number;
  tokensUsed: number;
}

const LIMITS = {
  MAX_QUESTIONS_PER_SESSION: 20,
  MAX_PDFS_PER_SESSION: 5,
  MAX_TOKENS_PER_SESSION: 100000,
};

const SESSION_KEY = 'summarizer_session_usage';

function getSessionStorage(): SessionUsage {
  try {
    if (typeof sessionStorage !== 'undefined') {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    }
  } catch (e) {
    console.warn('Session storage not available, using memory fallback');
  }

  // Fallback to memory (for testing and older browsers)
  return {
    totalTokens: 0,
    embeddingTokens: 0,
    completionTokens: 0,
    questionsAsked: 0,
    pdfsUploaded: 0,
    timestamp: Date.now(),
  };
}

function saveSessionStorage(usage: SessionUsage): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(usage));
    }
  } catch (e) {
    console.warn('Could not save to session storage:', e);
  }
}

/**
 * Track token usage by type (embeddings, completions)
 */
export function trackTokenUsage(type: 'embedding' | 'completion', tokens: number): void {
  const usage = getSessionStorage();

  usage.totalTokens += tokens;
  if (type === 'embedding') {
    usage.embeddingTokens += tokens;
  } else if (type === 'completion') {
    usage.completionTokens += tokens;
  }

  saveSessionStorage(usage);
}

/**
 * Get current session usage
 */
export function getSessionUsage(): SessionUsage {
  return getSessionStorage();
}

/**
 * Check rate limits and increment counters
 * Throws error if limit exceeded
 */
export function checkAndEnforceRateLimit(action: 'question' | 'pdf_upload'): void {
  const usage = getSessionStorage();

  if (action === 'question') {
    if (usage.questionsAsked >= LIMITS.MAX_QUESTIONS_PER_SESSION) {
      throw new Error(
        `Rate limit exceeded: Maximum ${LIMITS.MAX_QUESTIONS_PER_SESSION} questions per session`
      );
    }
    usage.questionsAsked += 1;
  } else if (action === 'pdf_upload') {
    if (usage.pdfsUploaded >= LIMITS.MAX_PDFS_PER_SESSION) {
      throw new Error(
        `Rate limit exceeded: Maximum ${LIMITS.MAX_PDFS_PER_SESSION} PDFs per session`
      );
    }
    usage.pdfsUploaded += 1;
  }

  saveSessionStorage(usage);
}

/**
 * Get remaining quota for the session
 */
export function getRemainingQuota(): RateQuota {
  const usage = getSessionStorage();

  return {
    questionsRemaining: Math.max(0, LIMITS.MAX_QUESTIONS_PER_SESSION - usage.questionsAsked),
    pdfsRemaining: Math.max(0, LIMITS.MAX_PDFS_PER_SESSION - usage.pdfsUploaded),
    tokensUsed: usage.totalTokens,
  };
}

/**
 * Reset session (called on page reload or explicit user action)
 */
export function resetSession(): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(SESSION_KEY);
    }
  } catch (e) {
    console.warn('Could not reset session:', e);
  }
}
