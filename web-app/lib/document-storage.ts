import fs from 'fs';
import path from 'path';

function uniquePaths(paths: string[]) {
  return [...new Set(paths)];
}

export function getGoldDataDirectories() {
  const configuredDir = process.env.DATA_GOLD_DIR;

  return uniquePaths(
    [
      configuredDir,
      path.join(process.cwd(), '..', 'data', 'gold'),
      path.join(process.cwd(), '..', 'pythonservice', 'data', 'gold'),
    ].filter((dir): dir is string => Boolean(dir))
  );
}

export function resolveDocumentPath(documentId: string) {
  const fileName = `${documentId}.json`;

  for (const directory of getGoldDataDirectories()) {
    const candidatePath = path.join(directory, fileName);
    if (fs.existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  throw new Error(`Document not found: ${documentId}`);
}
