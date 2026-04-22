import { answerQuestion as answerQuestionImpl } from './qa-service';
import { retrieveRelevantChunks } from './retrieval';

jest.mock('./retrieval');

jest.mock('./llm', () => ({
  answerQuestion: jest.fn(async (question: string, context: string[]) => ({
    answer: `Answer to "${question}"`,
    tokensUsed: 150,
  })),
}));

describe('QA Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retrieves relevant chunks and generates answer', async () => {
    (retrieveRelevantChunks as jest.Mock).mockResolvedValue([
      { chunkId: 0, text: 'Machine learning is...', similarity: 0.9 },
      { chunkId: 1, text: 'Neural networks use...', similarity: 0.85 },
    ]);

    const result = await answerQuestionImpl(
      'test-id',
      'What is machine learning?'
    );

    expect(retrieveRelevantChunks).toHaveBeenCalledWith(
      'test-id',
      'What is machine learning?',
      expect.any(Number)
    );

    expect(result.answer).toBe('Answer to "What is machine learning?"');
    expect(result.tokensUsed).toBe(150);

    expect(result.sources).toEqual([
      { chunkId: 0, text: 'Machine learning is...' },
      { chunkId: 1, text: 'Neural networks use...' },
    ]);
  });

  it('handles retrieval failure gracefully', async () => {
    (retrieveRelevantChunks as jest.Mock).mockRejectedValue(
      new Error('Document not found')
    );

    const result = await answerQuestionImpl(
      'nonexistent-id',
      'Question?'
    );

    // 🔥 UPDATED EXPECTATION
    expect(result.answer).toMatch(/DEBUG ERROR/i);
    expect(result.sources).toEqual([]);
    expect(result.tokensUsed).toBe(0);
  });

  it('handles empty question gracefully', async () => {
    const result = await answerQuestionImpl('test-id', '');

    expect(result.answer).toBe('Please provide a question.');
    expect(result.sources).toEqual([]);
    expect(result.tokensUsed).toBe(0);

    expect(retrieveRelevantChunks).not.toHaveBeenCalled();
  });

  it('handles no relevant chunks found', async () => {
    (retrieveRelevantChunks as jest.Mock).mockResolvedValue([]);

    const result = await answerQuestionImpl(
      'test-id',
      'Unrelated question'
    );

    expect(result.answer).toMatch(/No relevant information/i);
    expect(result.sources).toEqual([]);
    expect(result.tokensUsed).toBe(0);
  });
});