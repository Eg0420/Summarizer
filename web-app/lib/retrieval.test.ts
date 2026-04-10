import { cosineSimilarity, retrieveRelevantChunks } from './retrieval';
import fs from 'fs';

jest.mock('fs');
jest.mock('./llm', () => ({
  embedText: jest.fn(async (text: string) => {
    // Mock embedding that matches the test data dimensions
    if (text === 'What about neural networks?') {
      return [0.15, 0.25, 0.35]; // Similar to chunks 0-1
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
      const vec1 = [1, 0, 0];
      const vec2 = [1, 0, 0];
      const vec3 = [0, 1, 0];

      expect(cosineSimilarity(vec1, vec2)).toBeCloseTo(1.0);
      expect(cosineSimilarity(vec1, vec3)).toBeCloseTo(0.0);
    });

    it('handles identical vectors', () => {
      const vec = [0.5, 0.5, 0.5];
      expect(cosineSimilarity(vec, vec)).toBeCloseTo(1.0);
    });

    it('handles orthogonal vectors', () => {
      const vec1 = [1, 0];
      const vec2 = [0, 1];
      expect(cosineSimilarity(vec1, vec2)).toBeCloseTo(0.0);
    });
  });

  describe('retrieveRelevantChunks', () => {
    it('retrieves top K similar chunks', async () => {
      const mockDocument = {
        documentId: 'test-id',
        chunks: [
          { id: 0, text: 'Neural networks are powerful.', embedding: [0.1, 0.2, 0.3] },
          { id: 1, text: 'Deep learning requires data.', embedding: [0.2, 0.3, 0.4] },
          { id: 2, text: 'Python is a programming language.', embedding: [0.9, 0.8, 0.7] },
        ],
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockDocument));

      const result = await retrieveRelevantChunks('test-id', 'What about neural networks?', 2);

      expect(result).toHaveLength(2);
      // Verify all results have required fields
      expect(result[0].chunkId).toBeDefined();
      expect(result[0].text).toBeDefined();
      expect(result[0].similarity).toBeDefined();
      // Verify sorted by similarity
      expect(result[0].similarity).toBeGreaterThanOrEqual(result[1].similarity);
    });

    it('returns fewer results if K exceeds available chunks', async () => {
      const mockDocument = {
        documentId: 'test-id',
        chunks: [
          { id: 0, text: 'First chunk.', embedding: [0.1, 0.2] },
        ],
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockDocument));

      const mockEmbedText = jest.requireMock('./llm').embedText;
      mockEmbedText.mockResolvedValue([0.1, 0.2]); // Match dimensions

      const result = await retrieveRelevantChunks('test-id', 'Question?', 10);

      expect(result).toHaveLength(1);
    });

    it('throws error if document not found', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(
        retrieveRelevantChunks('nonexistent-id', 'Question?', 5)
      ).rejects.toThrow();
    });

    it('loads chunks from the legacy pythonservice data directory', async () => {
      const mockDocument = {
        documentId: 'legacy-id',
        chunks: [
          { id: 0, text: 'Legacy chunk.', embedding: [0.1, 0.2, 0.3] },
        ],
      };
      const mockEmbedText = jest.requireMock('./llm').embedText;

      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) =>
        filePath.includes('pythonservice')
      );
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockDocument));
      mockEmbedText.mockResolvedValue([0.1, 0.2, 0.3]);

      const result = await retrieveRelevantChunks('legacy-id', 'Question?', 1);

      expect(result).toHaveLength(1);
      expect(fs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('pythonservice'),
        'utf-8'
      );
    });
  });
});
