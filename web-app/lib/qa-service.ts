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
  try {
    // ✅ Handle empty question
    if (!question.trim()) {
      return {
        answer: 'Please provide a question.',
        sources: [],
        tokensUsed: 0,
      };
    }

    // ✅ Retrieve relevant chunks
    const relevantChunks = await retrieveRelevantChunks(
      documentId,
      question,
      k
    );

    // ✅ Handle no results (prevents hallucination)
    if (!relevantChunks || relevantChunks.length === 0) {
      return {
        answer: 'No relevant information found in the document.',
        sources: [],
        tokensUsed: 0,
      };
    }

    // ✅ Format context (VERY IMPORTANT)
    const MAX_CHARS = 3000;
    let totalLength = 0;
    const contextChunks: string[] = [];

    for (const chunk of relevantChunks) {
      const formatted = `Chunk ${chunk.chunkId}:\n${chunk.text}`;

      if (totalLength + formatted.length > MAX_CHARS) break;

      contextChunks.push(formatted);
      totalLength += formatted.length;
    }

    // ✅ Call LLM
    const { answer, tokensUsed } = await callLLM(
      question,
      contextChunks
    );

    // ✅ Optional: filter hallucinated fallback
    if (answer.toLowerCase().includes("i couldn't find")) {
      return {
        answer: 'This information is not available in the document.',
        sources: [],
        tokensUsed,
      };
    }

    // ✅ Return structured response
    return {
      answer,
      sources: relevantChunks.map((chunk) => ({
        chunkId: chunk.chunkId,
        text: chunk.text,
      })),
      tokensUsed,
    };
  } catch (error) {
    console.error('QA Service Error:', error);

    return {
      answer: 'Something went wrong while processing your question.',
      sources: [],
      tokensUsed: 0,
    };
  }
}