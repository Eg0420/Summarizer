'use client';

import React, { useState } from 'react';

export default function PDFUploadForm() {
  const [isDragging, setIsDragging] = useState(false);

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
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-center text-gray-900">
            Upload PDF
          </h1>
          <p className="mt-2 text-center text-gray-600">
            Upload a PDF to get started
          </p>
        </div>

        <form className="space-y-6">
          <div
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
                type="file"
                accept=".pdf"
                className="hidden"
              />
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Upload File
              </button>
            </label>
          </div>
        </form>
      </div>
    </div>
  );
}
