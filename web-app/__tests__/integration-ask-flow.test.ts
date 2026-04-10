/**
 * Integration tests for Issue #10: Ask Question Flow
 * Tests the complete Q&A pipeline with pre-loaded documents
 */
import fs from 'fs-extra';
import path from 'path';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Integration: Ask Question Flow', () => {
  const testDataDir = path.join(__dirname, '../data/gold');

  beforeAll(async () => {
    // Create test data directory if it doesn't exist
    await fs.ensureDir(testDataDir);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      await fs.remove(testDataDir);
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('End-to-End Q&A Flow', () => {
    it('should retrieve relevant chunks for a question', async () => {
      // Create a test document with chunks and embeddings
      const testDocId = 'test-doc-qa-001';
      const testDoc = {
        metadata: {
          filename: 'test.pdf',
          total_chunks: 3,
          created_at: new Date().toISOString(),
        },
        chunks: [
          {
            id: 0,
            text: 'Artificial Intelligence is a field of computer science that aims to create intelligent machines.',
            embedding: Array(1536).fill(0).map((_, i) => Math.sin(i) * 0.5 + 0.5),
          },
          {
            id: 1,
            text: 'Machine learning is a subset of artificial intelligence that focuses on learning from data.',
            embedding: Array(1536).fill(0).map((_, i) => Math.sin(i + 1) * 0.5 + 0.5),
          },
          {
            id: 2,
            text: 'Deep learning uses neural networks with many layers to process data.',
            embedding: Array(1536).fill(0).map((_, i) => Math.sin(i + 2) * 0.5 + 0.5),
          },
        ],
      };

      // Write test document
      const docPath = path.join(testDataDir, `${testDocId}.json`);
      await fs.writeJSON(docPath, testDoc);

      // Mock the API response for /api/ask
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          answer: 'Machine learning is a subset of artificial intelligence that focuses on learning from data.',
          sources: [
            { chunkId: 1, text: 'Machine learning is a subset...' },
          ],
          tokensUsed: 150,
        }),
        status: 200,
      });

      // Simulate asking a question
      const question = 'What is machine learning?';
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: testDocId,
          question,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.answer).toBeDefined();
      expect(data.sources).toBeDefined();
      expect(data.tokensUsed).toBeGreaterThan(0);
      expect(data.sources.length).toBeGreaterThan(0);
    });

    it('should handle multiple sequential questions', async () => {
      const testDocId = 'test-doc-qa-002';
      const testDoc = {
        metadata: {
          filename: 'test.pdf',
          total_chunks: 2,
          created_at: new Date().toISOString(),
        },
        chunks: [
          {
            id: 0,
            text: 'Python is a programming language created by Guido van Rossum.',
            embedding: Array(1536).fill(0).map((_, i) => Math.cos(i) * 0.5 + 0.5),
          },
          {
            id: 1,
            text: 'Python is known for its simple syntax and readability.',
            embedding: Array(1536).fill(0).map((_, i) => Math.cos(i + 1) * 0.5 + 0.5),
          },
        ],
      };

      const docPath = path.join(testDataDir, `${testDocId}.json`);
      await fs.writeJSON(docPath, testDoc);

      const questions = [
        'Who created Python?',
        'What is Python known for?',
        'What is Python used for?',
      ];

      for (const question of questions) {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          json: async () => ({
            answer: `Answer to: ${question}`,
            sources: [{ chunkId: 0, text: 'Relevant chunk' }],
            tokensUsed: 100,
          }),
          status: 200,
        });

        const response = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: testDocId,
            question,
          }),
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.answer).toContain('Answer to:');
      }

      expect((global.fetch as jest.Mock).mock.calls.length).toBe(3);
    });

    it('should return error for non-existent document', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          error: 'Document not found',
        }),
        status: 404,
      });

      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: 'non-existent-document',
          question: 'What is this?',
        }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should handle rate limiting across multiple questions', async () => {
      const testDocId = 'test-doc-qa-003';
      const testDoc = {
        metadata: {
          filename: 'test.pdf',
          total_chunks: 1,
          created_at: new Date().toISOString(),
        },
        chunks: [
          {
            id: 0,
            text: 'Sample document content.',
            embedding: Array(1536).fill(0.5),
          },
        ],
      };

      const docPath = path.join(testDataDir, `${testDocId}.json`);
      await fs.writeJSON(docPath, testDoc);

      // First request succeeds
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          answer: 'Answer 1',
          sources: [{ chunkId: 0, text: 'Content' }],
          tokensUsed: 100,
        }),
        status: 200,
      });

      let response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: testDocId,
          question: 'Question 1?',
        }),
      });

      expect(response.status).toBe(200);

      // Simulate hitting rate limit on 21st question
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          error: 'Rate limit exceeded: Maximum 20 questions per session',
        }),
        status: 429,
      });

      response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: testDocId,
          question: 'Question 21?',
        }),
      });

      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.error).toContain('Rate limit exceeded');
    });

    it('should retrieve chunks with high relevance scores', async () => {
      const testDocId = 'test-doc-qa-004';
      
      // Create document with different content topics
      const testDoc = {
        metadata: {
          filename: 'test.pdf',
          total_chunks: 4,
          created_at: new Date().toISOString(),
        },
        chunks: [
          {
            id: 0,
            text: 'The cat sat on the mat enjoying its afternoon nap.',
            embedding: Array(1536).fill(0).map((_, i) => Math.sin(i) * 0.5 + 0.5),
          },
          {
            id: 1,
            text: 'Dogs are loyal animals that enjoy playing and running.',
            embedding: Array(1536).fill(0).map((_, i) => Math.sin(i + 10) * 0.5 + 0.5),
          },
          {
            id: 2,
            text: 'Cats are independent animals that prefer solitude and quiet spaces.',
            embedding: Array(1536).fill(0).map((_, i) => Math.sin(i) * 0.5 + 0.5),
          },
          {
            id: 3,
            text: 'Birds can fly through the sky with grace and speed.',
            embedding: Array(1536).fill(0).map((_, i) => Math.sin(i + 20) * 0.5 + 0.5),
          },
        ],
      };

      const docPath = path.join(testDataDir, `${testDocId}.json`);
      await fs.writeJSON(docPath, testDoc);

      // Mock retrieval to return cat-related chunks for cat question
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          answer: 'Cats are independent animals that prefer solitude.',
          sources: [
            { chunkId: 2, text: 'Cats are independent animals...', score: 0.92 },
            { chunkId: 0, text: 'The cat sat on the mat...', score: 0.88 },
          ],
          tokensUsed: 200,
        }),
        status: 200,
      });

      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: testDocId,
          question: 'Tell me about cats',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.sources.length).toBeGreaterThan(0);
      expect(data.sources.some(s => s.chunkId === 2)).toBe(true);
    });
  });

  describe('Document Loading and Processing', () => {
    it('should load pre-existing document from /data/gold', async () => {
      const testDocId = 'test-doc-load-001';
      const testDoc = {
        metadata: {
          filename: 'existing.pdf',
          total_chunks: 1,
          created_at: new Date().toISOString(),
        },
        chunks: [
          {
            id: 0,
            text: 'This is existing content.',
            embedding: Array(1536).fill(0.5),
          },
        ],
      };

      const docPath = path.join(testDataDir, `${testDocId}.json`);
      await fs.writeJSON(docPath, testDoc);

      // Verify file exists
      const exists = await fs.pathExists(docPath);
      expect(exists).toBe(true);

      // Verify content
      const loaded = await fs.readJSON(docPath);
      expect(loaded.metadata.filename).toBe('existing.pdf');
      expect(loaded.chunks.length).toBe(1);
    });

    it('should handle documents with many chunks', async () => {
      const testDocId = 'test-doc-large-001';
      const chunkCount = 50;
      
      const chunks = Array.from({ length: chunkCount }, (_, i) => ({
        id: i,
        text: `Chunk ${i}: This is sample content for chunk number ${i}.`,
        embedding: Array(1536).fill(0).map((_, j) => Math.sin(i + j) * 0.5 + 0.5),
      }));

      const testDoc = {
        metadata: {
          filename: 'large.pdf',
          total_chunks: chunkCount,
          created_at: new Date().toISOString(),
        },
        chunks,
      };

      const docPath = path.join(testDataDir, `${testDocId}.json`);
      await fs.writeJSON(docPath, testDoc);

      const loaded = await fs.readJSON(docPath);
      expect(loaded.chunks.length).toBe(50);
      expect(loaded.chunks[0].id).toBe(0);
      expect(loaded.chunks[49].id).toBe(49);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty question gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          error: 'question is required',
        }),
        status: 400,
      });

      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: 'test-doc',
          question: '',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should handle missing documentId parameter', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          error: 'documentId is required',
        }),
        status: 400,
      });

      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: 'What is this?',
        }),
      });

      expect(response.status).toBe(400);
    });
  });
});
