import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const DEFAULT_PYTHON_API_URL = 'http://127.0.0.1:5000';

function getPythonApiUrl() {
  return process.env.PYTHON_API_URL || DEFAULT_PYTHON_API_URL;
}

export async function POST(req: NextRequest) {
  // 🚫 Prevent missing backend in production
  if (process.env.VERCEL && !process.env.PYTHON_API_URL) {
    return NextResponse.json(
      { error: 'PDF processing backend is not configured. Set PYTHON_API_URL in Vercel.' },
      { status: 503 }
    );
  }

  try {
    // ✅ Read incoming form data
    const incomingForm = await req.formData();
    const file = incomingForm.get('file');

    // ✅ Validate file
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

    // 🔥 CRITICAL FIX: Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 🔥 Recreate proper multipart/form-data
    const outboundForm = new FormData();
    outboundForm.append(
      'file',
      new Blob([buffer], { type: 'application/pdf' }),
      file.name
    );

    // ✅ Send to Flask backend
    const response = await fetch(`${getPythonApiUrl()}/api/process`, {
      method: 'POST',
      body: outboundForm,
    });

    // Handle non-JSON safely
    let data;
    try {
      data = await response.json();
    } catch {
      data = { error: 'Invalid response from backend' };
    }

    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown processing error';

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