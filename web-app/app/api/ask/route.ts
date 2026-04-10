import { NextRequest, NextResponse } from 'next/server';
import { answerQuestion } from '@/lib/qa-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentId, question } = body;

    if (!documentId || !question) {
      return NextResponse.json(
        { error: 'documentId and question are required' },
        { status: 400 }
      );
    }

    const result = await answerQuestion(documentId, question);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: error.message },
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
