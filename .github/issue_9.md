## Parent PRD

See PRD.md

## What to build

Write end-to-end integration tests that exercise the full Upload → Process → Ask flow. Use a small, deterministic test PDF (~2KB). Verify that text extraction, chunking, embedding generation, summary creation, and question answering all work together correctly.

Refer to sections: Testing Decisions > What Makes a Good Test, Testing Decisions > Modules to Test

## Acceptance criteria

- [ ] Create small test PDF with known, deterministic content (e.g., 3-5 paragraphs)
- [ ] Test uploads PDF to Python service via /api/process
- [ ] Verify chunks are created and stored in /data/gold
- [ ] Verify embeddings are generated and persisted
- [ ] Test /api/summarize generates a meaningful summary
- [ ] Test /api/ask with multiple questions on known content
- [ ] Verify retrieved chunks are relevant to questions
- [ ] Verify answers are factually correct based on PDF content
- [ ] Test error scenarios: missing documentId, malformed PDF, exceeds size limit
- [ ] Test rate limiting is enforced correctly
- [ ] Token usage is tracked and displayed
- [ ] All tests pass with real OpenAI API calls (mock for CI if cost-prohibitive)

## Blocked by

#8 (Token tracking & rate limiting)

## User stories addressed

All user stories (covers entire flow)
