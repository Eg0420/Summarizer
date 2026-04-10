import { readAndSummarizeDocument } from './document-service';
import fs from 'fs';
import path from 'path';

jest.mock('fs');
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
      filename: 'test.pdf',
      chunks: [
        { id: 0, text: 'First paragraph about machine learning.' },
        { id: 1, text: 'Second paragraph about neural networks.' },
      ],
    };

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(
      JSON.stringify(mockDocument)
    );

    const result = await readAndSummarizeDocument('test-id');

    expect(result.documentId).toBe('test-id');
    expect(result.filename).toBe('test.pdf');
    expect(result.summary).toBeTruthy();
    expect(result.tokensUsed).toBeGreaterThan(0);
  });

  it('throws error if document not found', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    await expect(readAndSummarizeDocument('nonexistent-id')).rejects.toThrow(
      'Document not found'
    );
  });

  it('loads a document from the legacy pythonservice data directory', async () => {
    const mockDocument = {
      documentId: 'legacy-id',
      filename: 'legacy.pdf',
      chunks: [{ id: 0, text: 'Legacy document content.' }],
    };

    (fs.existsSync as jest.Mock).mockImplementation((filePath: string) =>
      filePath.includes('pythonservice')
    );
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockDocument));

    const result = await readAndSummarizeDocument('legacy-id');

    expect(result.filename).toBe('legacy.pdf');
    expect(fs.readFileSync).toHaveBeenCalledWith(
      expect.stringContaining('pythonservice'),
      'utf-8'
    );
  });
});
