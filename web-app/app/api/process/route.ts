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

    console.log('🔍 Flask response:', data);

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // ✅ Generate documentId
    const documentId = data.documentId || randomUUID();

    // 🔥 FIX: Flexible chunk handling
    let chunks = data.chunks;

    // Fallback if Flask only returns text
    if (!chunks && data.text) {
      console.log('⚠️ No chunks from backend, creating fallback chunk');

      chunks = [
        {
          chunkId: 0,
          text: data.text,
        },
      ];
    }

    // Final validation
    if (!chunks || chunks.length === 0) {
      return NextResponse.json(
        {
          error:
            'Processing backend did not return usable data (no chunks or text)',
        },
        { status: 500 }
      );
    }

    // ✅ Save document
    saveDocument(documentId, chunks);

    console.log('✅ Saved document:', documentId);

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