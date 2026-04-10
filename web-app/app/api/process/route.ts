import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const DEFAULT_PYTHON_API_URL = 'http://127.0.0.1:5000';

function getPythonApiUrl() {
  return process.env.PYTHON_API_URL || DEFAULT_PYTHON_API_URL;
}

export async function POST(req: NextRequest) {
  if (process.env.VERCEL && !process.env.PYTHON_API_URL) {
    return NextResponse.json(
      { error: 'PDF processing backend is not configured. Set PYTHON_API_URL in Vercel.' },
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

    const outboundForm = new FormData();
    outboundForm.append('file', file, file.name);

    const response = await fetch(`${getPythonApiUrl()}/api/process`, {
      method: 'POST',
      body: outboundForm,
    });

    const data = await response.json();
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
