import { answerQuestion as answerQuestionImpl } from './qa-service';
import { retrieveRelevantChunks } from './retrieval';
import fs from 'fs';

jest.mock('./retrieval');
jest.mock('fs');
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

    const result = await answerQuestionImpl('test-id', 'What is machine learning?');

    expect(result.answer).toBeTruthy();
    expect(result.tokensUsed).toBeGreaterThan(0);
    expect(result.sources).toBeDefined();
    expect(result.sources.length).toBeGreaterThan(0);
  });

  it('returns error if document not found', async () => {
    (retrieveRelevantChunks as jest.Mock).mockRejectedValue(
      new Error('Document not found')
    );

    await expect(
      answerQuestionImpl('nonexistent-id', 'Question?')
    ).rejects.toThrow();
  });

  it('handles empty query gracefully', async () => {
    (retrieveRelevantChunks as jest.Mock).mockResolvedValue([]);

    const result = await answerQuestionImpl('test-id', '');

    expect(result).toBeDefined();
  });
});
