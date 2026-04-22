import fs from 'fs';
import path from 'path';
import { embedText } from './llm';

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
 * Load document from Vercel temp storage
 */
function loadDocument(documentId: string): Chunk[] {
  const filePath = path.join('/tmp', 'processed', `${documentId}.json`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Document not found: ${documentId}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(content);

  // Handle BOTH formats safely
  if (Array.isArray(parsed)) {
    return parsed.map((c: any) => ({
      id: c.chunkId ?? c.id,
      text: c.text,
      embedding: c.embedding,
    }));
  }

  if (parsed.chunks) {
    return parsed.chunks;
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
  const chunks = loadDocument(documentId);

  if (!chunks || chunks.length === 0) {
    return [];
  }

  // 🔥 If NO embeddings → fallback (important)
  const hasEmbeddings = chunks[0].embedding && chunks[0].embedding.length > 0;

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
  const chunks = loadDocument(documentId);

  const chunkMap = new Map(chunks.map((c) => [c.id, c]));

  return chunkIds
    .map((id) => chunkMap.get(id))
    .filter((chunk) => chunk !== undefined)
    .map((chunk) => ({ id: chunk!.id, text: chunk!.text }));
}