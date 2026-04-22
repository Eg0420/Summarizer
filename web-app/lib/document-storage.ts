import fs from 'fs';
import path from 'path';

/**
 * Base directory for storing processed documents (Vercel-compatible)
 */
const BASE_DIR = '/tmp/processed';

/**
 * Ensure the directory exists
 */
function ensureDirectoryExists() {
  if (!fs.existsSync(BASE_DIR)) {
    fs.mkdirSync(BASE_DIR, { recursive: true });
  }
}

/**
 * Resolve the full file path for a document
 */
export function resolveDocumentPath(documentId: string): string {
  const filePath = path.join(BASE_DIR, `${documentId}.json`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Document not found: ${documentId}`);
  }

  return filePath;
}

/**
 * Save document chunks to storage
 */
export function saveDocument(documentId: string, data: any) {
  ensureDirectoryExists();

  const filePath = path.join(BASE_DIR, `${documentId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  console.log(`✅ Document saved: ${filePath}`);
}

/**
 * Load document from storage
 */
export function loadDocument(documentId: string) {
  const filePath = resolveDocumentPath(documentId);

  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}