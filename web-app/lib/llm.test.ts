jest.mock('openai', () => {
  return {
    __esModule: true, // 🔥 IMPORTANT
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: 'Mocked response',
                },
              },
            ],
          }),
        },
      },
      embeddings: {
        create: jest.fn().mockResolvedValue({
          data: [{ embedding: Array(1536).fill(0.5) }],
        }),
      },
    })),
  };
});
import { summarizeChunks, answerQuestion } from './llm';

describe('LLM utilities', () => {
  describe('summarizeChunks', () => {
    it('generates summary from text', async () => {
      const text = 'This is a document about machine learning. It discusses neural networks and deep learning techniques.';
      
      const result = await summarizeChunks(text);
      
      expect(result.summary).toBeTruthy();
      expect(result.summary.length).toBeGreaterThan(10);
      expect(result.tokensUsed).toBeGreaterThan(0);
    });

    it('handles empty text', async () => {
      const result = await summarizeChunks('');
      
      expect(result.summary).toBeTruthy();
      expect(result.tokensUsed).toBeGreaterThan(0);
    });

    it('token count increases with text length', async () => {
      const shortText = 'Brief text.';
      const longText = 'This is a much longer piece of text with many more words. '.repeat(10);
      
      const shortResult = await summarizeChunks(shortText);
      const longResult = await summarizeChunks(longText);
      
      expect(longResult.tokensUsed).toBeGreaterThan(shortResult.tokensUsed);
    });
  });

  describe('answerQuestion', () => {
    it('generates answer based on context', async () => {
      const question = 'What is machine learning?';
      const context = [
        'Machine learning is a subset of artificial intelligence.',
        'It enables systems to learn from data.',
      ];
      
      const result = await answerQuestion(question, context);
      
      expect(result.answer).toBeTruthy();
      expect(result.tokensUsed).toBeGreaterThan(0);
    });

    it('handles empty context', async () => {
      const question = 'What is AI?';
      const context: string[] = [];
      
      const result = await answerQuestion(question, context);
      
      expect(result.answer).toBeTruthy();
      expect(result.tokensUsed).toBeGreaterThan(0);
    });
  });
});
