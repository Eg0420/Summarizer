## Parent PRD

See PRD.md

## What to build

Write integration tests specifically for the Ask Question flow. Pre-load a test PDF in /data/gold with known content. Ask multiple questions (varying in specificity and complexity). Verify that chunk retrieval is accurate and answers are correct.

Refer to sections: Testing Decisions > Modules to Test (Ask Question Flow)

## Acceptance criteria

- [ ] Pre-process a small test PDF and store chunks + embeddings in /data/gold
- [ ] Test simple factual question (e.g., "What is the main topic?")
- [ ] Test complex question requiring multi-chunk context
- [ ] Test question with no answer in document (verify graceful handling)
- [ ] Verify top 5 retrieved chunks are semantically relevant
- [ ] Verify answers are accurate and cite correct chunks
- [ ] Test edge cases: very long questions, special characters, numerical queries
- [ ] Measure retrieval accuracy (cosine similarity works correctly)
- [ ] Verify answer quality (factually correct, not hallucinating)
- [ ] Load test with 50+ questions on same document (verify performance)

## Blocked by

#3 (ETL pipeline)
#7 (Q&A API)

## User stories addressed

- User story 3: Ask about specific data points
- User story 6: Chat-like Q&A
- User story 7: Relevant quotes in answers
- User story 13: Cite which part of PDF was used
