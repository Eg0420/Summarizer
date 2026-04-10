/**
 * API rate limiting middleware
 * Enforces rate limits on API endpoints
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkAndEnforceRateLimit } from './token-tracking';

/**
 * Higher-order function to wrap API routes with rate limiting
 */
export function withRateLimit(action: 'question' | 'pdf_upload') {
  return function middleware(handler: (req: NextRequest) => Promise<NextResponse>) {
    return async (req: NextRequest) => {
      try {
        checkAndEnforceRateLimit(action);
        return await handler(req);
      } catch (error) {
        if ((error as Error).message.includes('Rate limit exceeded')) {
          return NextResponse.json(
            { error: (error as Error).message },
            { status: 429 } // Too Many Requests
          );
        }
        throw error;
      }
    };
  };
}
