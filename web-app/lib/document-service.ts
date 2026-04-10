import fs from 'fs';
import { summarizeChunks } from './llm';
import { resolveDocumentPath } from './document-storage';

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
  const filePath = resolveDocumentPath(documentId);
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
