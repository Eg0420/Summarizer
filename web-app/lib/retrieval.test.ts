import { cosineSimilarity, retrieveRelevantChunks } from './retrieval';
import fs from 'fs';

jest.mock('fs');

jest.mock('./llm', () => ({
  embedText: jest.fn(async (text: string) => {
    if (text === 'What about neural networks?') {
      return [0.15, 0.25, 0.35];
    }
    return [0.1, 0.2, 0.3];
  }),
}));

describe('Retrieval Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('cosineSimilarity', () => {
    it('computes similarity between two vectors', () => {
      expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1.0);
      expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBeCloseTo(0.0);
    });

    it('handles identical vectors', () => {
      const vec = [0.5, 0.5, 0.5];
      expect(cosineSimilarity(vec, vec)).toBeCloseTo(1.0);
    });

    it('handles orthogonal vectors', () => {
      expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0.0);
    });
  });

  describe('retrieveRelevantChunks', () => {
    it('retrieves top K similar chunks (with embeddings)', async () => {
      const mockChunks = [
        { id: 0, text: 'Neural networks are powerful.', embedding: [0.1, 0.2, 0.3] },
        { id: 1, text: 'Deep learning requires data.', embedding: [0.2, 0.3, 0.4] },
        { id: 2, text: 'Python is a programming language.', embedding: [0.9, 0.8, 0.7] },
      ];

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockChunks));

      const result = await retrieveRelevantChunks(
        'test-id',
        'What about neural networks?',
        2
      );

      expect(result).toHaveLength(2);
      expect(result[0].similarity).toBeGreaterThanOrEqual(result[1].similarity);
    });

    it('returns fewer results if K exceeds available chunks', async () => {
      const mockChunks = [
        { id: 0, text: 'Only chunk.', embedding: [0.1, 0.2] },
      ];

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockChunks));

      const result = await retrieveRelevantChunks('test-id', 'Question?', 10);

      expect(result).toHaveLength(1);
    });

    it('falls back when embeddings are missing', async () => {
      const mockChunks = [
        { chunkId: 0, text: 'Chunk without embedding' },
        { chunkId: 1, text: 'Another chunk without embedding' },
      ];

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockChunks));

      const result = await retrieveRelevantChunks('test-id', 'Question?', 2);

      expect(result).toHaveLength(2);
      expect(result[0].similarity).toBe(0);
    });

    it('throws error if document not found', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(
        retrieveRelevantChunks('nonexistent-id', 'Question?', 5)
      ).rejects.toThrow(/Document not found/);
    });

    it('supports object format with chunks field', async () => {
      const mockDocument = {
        documentId: 'test-id',
        chunks: [
          { id: 0, text: 'Chunk A', embedding: [0.1, 0.2, 0.3] },
        ],
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockDocument));

      const result = await retrieveRelevantChunks('test-id', 'Question?', 1);

      expect(result).toHaveLength(1);
      expect(result[0].chunkId).toBe(0);
    });
  });
});