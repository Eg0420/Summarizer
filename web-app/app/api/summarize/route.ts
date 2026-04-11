import { NextRequest, NextResponse } from 'next/server';
import { readAndSummarizeDocument } from '@/lib/document-service';

export async function POST(req: NextRequest) {
  try {
    // ✅ Safe JSON parsing
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const documentId = body?.documentId;

    // ✅ Strong validation
    if (!documentId || typeof documentId !== 'string' || documentId.trim() === '') {
      return NextResponse.json(
        { error: 'Valid documentId is required' },
        { status: 400 }
      );
    }

    // ✅ Call your service
    const result = await readAndSummarizeDocument(documentId);

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // ✅ Better error detection
    if (message.toLowerCase().includes('not found')) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    console.error('Summarize error:', message);

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}