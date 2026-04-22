'use client';

import { useState } from 'react';
import PDFUploadForm from '@/components/PDFUploadForm';
import QAChat from '@/components/QAChat';

export default function Home() {
  const [documentId, setDocumentId] = useState<string | null>(null);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        PDF Summarizer + Q&A
      </h1>

      {/* Upload */}
      <PDFUploadForm onUploadSuccess={setDocumentId} />

      {/* Chat appears AFTER upload */}
      {documentId && (
        <div className="mt-6">
          <QAChat documentId={documentId} />
        </div>
      )}
    </main>
  );
}