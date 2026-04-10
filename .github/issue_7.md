## Parent PRD

See PRD.md

## What to build

Implement POST /api/ask endpoint in Next.js that orchestrates the Q&A flow: retrieves relevant chunks via the retrieval engine, calls OpenAI with chunks as context, returns answer with source citations. Also implement the React chat UI component for asking follow-up questions.

Refer to sections: Architecture > LLM Pipeline, Implementation Decisions > LLM Pipeline

## Acceptance criteria

- [ ] POST /api/ask accepts { documentId, question }
- [ ] Calls retrieval engine to get top 5 relevant chunks
- [ ] Passes question + chunk context to OpenAI (gpt-4-turbo or similar)
- [ ] LLM instructed to cite which chunks were used
- [ ] Returns { answer: "...", sources: [{chunkId, text}], tokensUsed: N }
- [ ] Response time < 5 seconds per question
- [ ] React chat component displays Q&A in conversation format
- [ ] Users can ask multiple follow-up questions on same document
- [ ] Chat messages persisted per session (not across page reloads)
- [ ] Error handling for failed LLM calls

## Blocked by

#6 (Retrieval engine)
#2 (Next.js project setup)

## User stories addressed

- User story 6: Chat-like Q&A interface
- User story 7: Relevant quotes in answers
- User story 13: Cite which part of PDF was used
- User story 17: Fast response times for Q&A (<5 seconds)
