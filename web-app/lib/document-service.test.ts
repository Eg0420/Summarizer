import { readAndSummarizeDocument } from './document-service';
import { loadDocument } from './document-storage';

jest.mock('./document-storage');
jest.mock('./llm', () => ({
  summarizeChunks: jest.fn(async (text: string) => ({
    summary: 'This is a summary of the document',
    tokensUsed: 100,
  })),
}));

describe('document-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads document and generates summary', async () => {
    const mockDocument = {
      documentId: 'test-id',
      chunks: [
        { id: 0, text: 'First paragraph about machine learning.' },
        { id: 1, text: 'Second paragraph about neural networks.' },
      ],
    };

    (loadDocument as jest.Mock).mockReturnValue(mockDocument);

    const result = await readAndSummarizeDocument('test-id');

    expect(result.documentId).toBe('test-id');
    expect(result.summary).toBeTruthy();
    expect(result.tokensUsed).toBeGreaterThan(0);
  });

  it('throws error if document not found', async () => {
    (loadDocument as jest.Mock).mockImplementation(() => {
      throw new Error('Document not found');
    });

    await expect(
      readAndSummarizeDocument('nonexistent-id')
    ).rejects.toThrow('Document not found');
  });

  it('handles empty chunks gracefully', async () => {
    (loadDocument as jest.Mock).mockReturnValue({
      documentId: 'test-id',
      chunks: [],
    });

    await expect(
      readAndSummarizeDocument('test-id')
    ).rejects.toThrow('No chunks found');
  });
});