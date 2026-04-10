'use client';

import React, { useRef, useState } from 'react';
import QAChat from './QAChat';

interface ProcessResult {
  documentId: string;
  filename: string;
  textLength: number;
  chunkCount: number;
}

interface SummaryResult {
  documentId: string;
  filename: string;
  summary: string;
  tokensUsed: number;
}

export default function PDFUploadForm() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null);
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files.item(0);
    if (file) {
      handleSelectedFile(file);
    }
  };

  const handleSelectedFile = (file: File) => {
    setError('');
    setProcessResult(null);
    setSummaryResult(null);

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setSelectedFile(null);
      setError('Please choose a PDF file.');
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setError('Choose a PDF before uploading.');
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const processResponse = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });
      const processed = await processResponse.json();

      if (!processResponse.ok) {
        throw new Error(processed.error || 'PDF processing failed');
      }

      setProcessResult(processed);

      const summaryResponse = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: processed.documentId }),
      });
      const summary = await summaryResponse.json();

      if (!summaryResponse.ok) {
        throw new Error(summary.error || 'Summary generation failed');
      }

      setSummaryResult(summary);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-3xl w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-center text-gray-900">
            Upload PDF
          </h1>
          <p className="mt-2 text-center text-gray-600">
            Upload a PDF to get started
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div
            data-testid="pdf-drop-zone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <p className="text-gray-700 font-medium">
              Drag and drop your PDF here
            </p>
            <p className="text-sm text-gray-500 mt-2">or</p>
            <label className="mt-4 inline-block">
              <input
                ref={fileInputRef}
                data-testid="pdf-file-input"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.item(0);
                  if (file) {
                    handleSelectedFile(file);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Upload File
              </button>
            </label>
          </div>

          {selectedFile && (
            <p className="text-sm text-gray-700" data-testid="selected-file">
              Selected: <strong>{selectedFile.name}</strong>
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600 font-semibold" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!selectedFile || isUploading}
            className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
          >
            {isUploading ? 'Processing...' : 'Process PDF'}
          </button>
        </form>

        {processResult && summaryResult && (
          <section className="space-y-6">
            <div className="border rounded-lg bg-white p-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {summaryResult.filename}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {processResult.chunkCount} chunks, {processResult.textLength} characters
              </p>
              <p className="mt-4 text-gray-800" data-testid="summary">
                {summaryResult.summary}
              </p>
            </div>

            <div className="h-96">
              <QAChat documentId={summaryResult.documentId} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
