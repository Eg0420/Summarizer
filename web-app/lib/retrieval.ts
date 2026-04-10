import fs from 'fs';
import path from 'path';
import { embedText } from './llm';

const DATA_GOLD_DIR = process.env.DATA_GOLD_DIR || path.join(process.cwd(), '..', 'data', 'gold');

interface Chunk {
  id: number;
  text: string;
  embedding: number[];
}

interface Document {
  documentId: string;
  chunks: Chunk[];
}

interface RetrievalResult {
  chunkId: number;
  text: string;
  similarity: number;
}

/**
 * Compute cosine similarity between two vectors
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have same length');
  }

  const dotProduct = vec1.reduce((sum, a, i) => sum + a * vec2[i], 0);
  const magnitude1 = Math.sqrt(vec1.reduce((sum, a) => sum + a * a, 0));
  const magnitude2 = Math.sqrt(vec2.reduce((sum, a) => sum + a * a, 0));

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Load document from /data/gold
 */
function loadDocument(documentId: string): Document {
  const filePath = path.join(DATA_GOLD_DIR, `${documentId}.json`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Document not found: ${documentId}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Retrieve top K chunks most similar to the query
 */
export async function retrieveRelevantChunks(
  documentId: string,
  query: string,
  k: number = 5
): Promise<RetrievalResult[]> {
  // Load document
  const document = loadDocument(documentId);

  // Embed the query
  const queryEmbedding = await embedText(query);

  // Compute similarity scores
  const similarities = document.chunks.map((chunk) => ({
    chunkId: chunk.id,
    text: chunk.text,
    similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  // Sort by similarity descending and take top K
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
  const document = loadDocument(documentId);
  const chunkMap = new Map(document.chunks.map((c) => [c.id, c]));

  return chunkIds
    .map((id) => chunkMap.get(id))
    .filter((chunk) => chunk !== undefined)
    .map((chunk) => ({ id: chunk!.id, text: chunk!.text }));
}
