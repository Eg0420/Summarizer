import { embedText } from './llm';
import { loadDocument } from './document-storage';

interface Chunk {
  id: number;
  text: string;
  embedding?: number[];
}

interface RetrievalResult {
  chunkId: number;
  text: string;
  similarity: number;
}

/**
 * Compute cosine similarity
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) return 0;

  const dotProduct = vec1.reduce((sum, a, i) => sum + a * vec2[i], 0);
  const magnitude1 = Math.sqrt(vec1.reduce((sum, a) => sum + a * a, 0));
  const magnitude2 = Math.sqrt(vec2.reduce((sum, a) => sum + a * a, 0));

  if (magnitude1 === 0 || magnitude2 === 0) return 0;

  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Normalize chunk format (handles multiple input formats)
 */
function normalizeChunks(raw: any): Chunk[] {
  if (Array.isArray(raw)) {
    return raw.map((c: any) => ({
      id: c.chunkId ?? c.id,
      text: c.text,
      embedding: c.embedding,
    }));
  }

  if (raw.chunks) {
    return raw.chunks.map((c: any) => ({
      id: c.id ?? c.chunkId,
      text: c.text,
      embedding: c.embedding,
    }));
  }

  throw new Error('Invalid document format');
}

/**
 * Retrieve top K chunks
 */
export async function retrieveRelevantChunks(
  documentId: string,
  query: string,
  k: number = 5
): Promise<RetrievalResult[]> {
  // ✅ Load from centralized storage
  const raw = loadDocument(documentId);
  const chunks = normalizeChunks(raw);

  if (!chunks || chunks.length === 0) {
    return [];
  }

  // 🔥 Fallback if embeddings missing
  const hasEmbeddings =
    chunks[0].embedding && chunks[0].embedding.length > 0;

  if (!hasEmbeddings) {
    console.log('⚠️ No embeddings found, using fallback retrieval');

    return chunks.slice(0, k).map((chunk) => ({
      chunkId: chunk.id,
      text: chunk.text,
      similarity: 0,
    }));
  }

  // ✅ Embed query
  const queryEmbedding = await embedText(query);

  // ✅ Compute similarity
  const similarities = chunks.map((chunk) => ({
    chunkId: chunk.id,
    text: chunk.text,
    similarity: cosineSimilarity(queryEmbedding, chunk.embedding!),
  }));

  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);
}

/**
 * Retrieve chunks by IDs
 */
export function getChunksByIds(
  documentId: string,
  chunkIds: number[]
): { id: number; text: string }[] {
  const raw = loadDocument(documentId);
  const chunks = normalizeChunks(raw);

  const chunkMap = new Map(chunks.map((c) => [c.id, c]));

  return chunkIds
    .map((id) => chunkMap.get(id))
    .filter((chunk) => chunk !== undefined)
    .map((chunk) => ({
      id: chunk!.id,
      text: chunk!.text,
    }));
}