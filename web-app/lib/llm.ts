/**
 * LLM utilities for summarization and Q&A (REAL OpenAI Implementation)
 */

import OpenAI from 'openai';
import { trackTokenUsage } from './token-tracking';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface LLMResult {
  summary?: string;
  answer?: string;
  tokensUsed: number;
}

/**
 * Embed text using OpenAI API
 */
export async function embedText(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  const tokensUsed = response.usage?.total_tokens || estimateTokenCount(text);
  trackTokenUsage('embedding', tokensUsed);

  return response.data[0].embedding;
}

/**
 * Generate a summary from concatenated chunks using OpenAI
 */
export async function summarizeChunks(
  text: string
): Promise<{ summary: string; tokensUsed: number }> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `
You are a helpful assistant that summarizes documents clearly and concisely.
Focus on key ideas, main points, and conclusions.
        `,
      },
      {
        role: 'user',
        content: `Summarize the following document:\n\n${text}`,
      },
    ],
  });

  const summary = response.choices[0].message.content || 'No summary generated.';
  const tokensUsed =
    response.usage?.total_tokens || estimateTokenCount(text);

  trackTokenUsage('completion', tokensUsed);

  return { summary, tokensUsed };
}

/**
 * Generate an answer for a question using RAG
 */
export async function answerQuestion(
  question: string,
  contextChunks: string[]
): Promise<{ answer: string; tokensUsed: number }> {
  const context = contextChunks.join('\n\n');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `
You are a document-based question answering assistant.

RULES:
- Answer ONLY using the provided context
- If the answer is not found, say: "I couldn't find this in the document"
- Be concise and clear
- Cite sources like (Chunk 1), (Chunk 3) when possible
        `,
      },
      {
        role: 'user',
        content: `Context:\n${context}\n\nQuestion: ${question}`,
      },
    ],
  });

  const answer =
    response.choices[0].message.content || 'No answer generated.';
  const tokensUsed =
    response.usage?.total_tokens || estimateTokenCount(question + context);

  trackTokenUsage('completion', tokensUsed);

  return { answer, tokensUsed };
}

/**
 * Rough token count estimate (fallback only)
 */
function estimateTokenCount(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.ceil(words * 1.3);
}