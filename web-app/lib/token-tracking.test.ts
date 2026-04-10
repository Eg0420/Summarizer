import {
  trackTokenUsage,
  getRemainingQuota,
  checkAndEnforceRateLimit,
  getSessionUsage,
} from './token-tracking';

describe('Token Tracking & Rate Limiting', () => {
  beforeEach(() => {
    // Clear sessionStorage
    jest.clearAllMocks();
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
  });

  describe('trackTokenUsage', () => {
    it('tracks tokens used for embeddings', () => {
      trackTokenUsage('embedding', 100);
      
      const usage = getSessionUsage();
      expect(usage.totalTokens).toBe(100);
      expect(usage.embeddingTokens).toBe(100);
    });

    it('tracks tokens used for completions', () => {
      trackTokenUsage('completion', 150);
      
      const usage = getSessionUsage();
      expect(usage.totalTokens).toBe(150);
      expect(usage.completionTokens).toBe(150);
    });

    it('accumulates token usage', () => {
      trackTokenUsage('embedding', 100);
      trackTokenUsage('completion', 150);
      
      const usage = getSessionUsage();
      expect(usage.totalTokens).toBe(250);
      expect(usage.embeddingTokens).toBe(100);
      expect(usage.completionTokens).toBe(150);
    });
  });

  describe('checkAndEnforceRateLimit', () => {
    it('allows operations within limits', () => {
      for (let i = 0; i < 5; i++) {
        expect(() => checkAndEnforceRateLimit('question')).not.toThrow();
      }
    });

    it('throws error when question limit exceeded', () => {
      for (let i = 0; i < 20; i++) {
        checkAndEnforceRateLimit('question');
      }
      
      expect(() => checkAndEnforceRateLimit('question')).toThrow('Rate limit exceeded');
    });

    it('throws error when PDF limit exceeded', () => {
      for (let i = 0; i < 5; i++) {
        checkAndEnforceRateLimit('pdf_upload');
      }
      
      expect(() => checkAndEnforceRateLimit('pdf_upload')).toThrow('Rate limit exceeded');
    });

    it('tracks different types separately', () => {
      for (let i = 0; i < 5; i++) {
        checkAndEnforceRateLimit('pdf_upload');
      }
      
      // Questions should still work
      for (let i = 0; i < 20; i++) {
        checkAndEnforceRateLimit('question');
      }
      
      expect(() => checkAndEnforceRateLimit('question')).toThrow();
      expect(() => checkAndEnforceRateLimit('pdf_upload')).toThrow();
    });
  });

  describe('getRemainingQuota', () => {
    it('returns initial quota', () => {
      const quota = getRemainingQuota();
      expect(quota.questionsRemaining).toBe(20);
      expect(quota.pdfsRemaining).toBe(5);
    });

    it('decreases as operations are performed', () => {
      checkAndEnforceRateLimit('question');
      checkAndEnforceRateLimit('pdf_upload');
      
      const quota = getRemainingQuota();
      expect(quota.questionsRemaining).toBe(19);
      expect(quota.pdfsRemaining).toBe(4);
    });
  });
});
