import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { saveDocument } from '@/lib/document-storage';

export const runtime = 'nodejs';

const DEFAULT_PYTHON_API_URL = 'http://127.0.0.1:5000';

function getPythonApiUrl() {
  return process.env.PYTHON_API_URL || DEFAULT_PYTHON_API_URL;
}

export async function POST(req: NextRequest) {
  if (process.env.VERCEL && !process.env.PYTHON_API_URL) {
    return NextResponse.json(
      { error: 'PDF processing backend is not configured.' },
      { status: 503 }
    );
  }

  try {
    const incomingForm = await req.formData();
    const file = incomingForm.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'PDF file is required' },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'File must be PDF' },
        { status: 400 }
      );
    }

    // ✅ Convert file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const outboundForm = new FormData();
    outboundForm.append(
      'file',
      new Blob([buffer], { type: 'application/pdf' }),
      file.name
    );

    // ✅ Call Flask backend
    const response = await fetch(`${getPythonApiUrl()}/api/process`, {
      method: 'POST',
      body: outboundForm,
    });

    let data;
    try {
      data = await response.json();
    } catch {
      data = { error: 'Invalid response from backend' };
    }

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // ✅ Generate documentId
    const documentId = data.documentId || randomUUID();

    // ✅ Extract chunks
    const chunks = data.chunks || [];

    if (!chunks || chunks.length === 0) {
      return NextResponse.json(
        { error: 'No chunks returned from processing backend' },
        { status: 500 }
      );
    }

    // 🔥 SAVE DOCUMENT (CLEAN + CENTRALIZED)
    saveDocument(documentId, chunks);

    console.log('✅ Saved document:', documentId);

    // ✅ Return response
    return NextResponse.json({
      documentId,
      filename: file.name,
      summary: data.summary || 'Summary not available',
      chunkCount: chunks.length,
      textLength: data.textLength || 0,
    });

  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown processing error';

    return NextResponse.json(
      { error: `Could not process PDF: ${message}` },
      { status: 502 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}