import { retrieveRelevantChunks } from './retrieval';
import { answerQuestion as callLLM } from './llm';

interface QAResult {
  answer: string;
  sources: Array<{
    chunkId: number;
    text: string;
  }>;
  tokensUsed: number;
}

/**
 * Answer a question about a document using RAG
 */
export async function answerQuestion(
  documentId: string,
  question: string,
  k: number = 5
): Promise<QAResult> {
  if (!question.trim()) {
    return {
      answer: 'Please provide a question.',
      sources: [],
      tokensUsed: 0,
    };
  }

  // Retrieve relevant chunks
  const relevantChunks = await retrieveRelevantChunks(documentId, question, k);

  // Extract chunk texts for context
  const contextChunks = relevantChunks.map((chunk) => chunk.text);

  // Call LLM to generate answer
  const { answer, tokensUsed } = await callLLM(question, contextChunks);

  // Return answer with source citations
  return {
    answer,
    sources: relevantChunks.map((chunk) => ({
      chunkId: chunk.chunkId,
      text: chunk.text,
    })),
    tokensUsed,
  };
}
