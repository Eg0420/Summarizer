import { summarizeChunks } from './llm';
import { loadDocument } from './document-storage';

interface Chunk {
  id: number;
  text: string;
  embedding?: number[];
  tokenCount?: number;
}

/**
 * Normalize document format (handles multiple structures)
 */
function normalizeChunks(raw: any): Chunk[] {
  if (Array.isArray(raw)) {
    return raw.map((c: any) => ({
      id: c.chunkId ?? c.id,
      text: c.text,
      embedding: c.embedding,
      tokenCount: c.tokenCount,
    }));
  }

  if (raw.chunks) {
    return raw.chunks.map((c: any) => ({
      id: c.id ?? c.chunkId,
      text: c.text,
      embedding: c.embedding,
      tokenCount: c.tokenCount,
    }));
  }

  throw new Error('Invalid document format');
}

/**
 * Read document and generate summary
 */
export async function readAndSummarizeDocument(documentId: string) {
  // ✅ Load from centralized storage
  const raw = loadDocument(documentId);
  const chunks = normalizeChunks(raw);

  if (!chunks || chunks.length === 0) {
    throw new Error('No chunks found for document');
  }

  // ✅ Concatenate all chunk text
  const allChunksText = chunks.map((chunk) => chunk.text).join('\n\n');

  // ✅ Call LLM
  const { summary, tokensUsed } = await summarizeChunks(allChunksText);

  return {
    documentId,
    summary,
    tokensUsed,
  };
}