import fs from 'fs';
import path from 'path';
import { summarizeChunks } from './llm';

const DATA_GOLD_DIR = process.env.DATA_GOLD_DIR || path.join(process.cwd(), '..', '..', 'data', 'gold');

interface DocumentData {
  documentId: string;
  filename: string;
  chunks: Array<{
    id: number;
    text: string;
    embedding?: number[];
    tokenCount?: number;
  }>;
}

/**
 * Load document from /data/gold
 */
function loadDocument(documentId: string): DocumentData {
  const filePath = path.join(DATA_GOLD_DIR, `${documentId}.json`);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Document not found: ${documentId}`);
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Read document and generate summary
 */
export async function readAndSummarizeDocument(documentId: string) {
  const document = loadDocument(documentId);
  
  // Concatenate all chunk text
  const allChunksText = document.chunks
    .map((chunk) => chunk.text)
    .join('\n\n');
  
  // Call LLM to summarize
  const { summary, tokensUsed } = await summarizeChunks(allChunksText);
  
  return {
    documentId,
    filename: document.filename,
    summary,
    tokensUsed,
  };
}
