## Parent PRD

See PRD.md

## What to build

Implement the core retrieval engine as a library/module in Next.js. Load embeddings from /data/gold, perform cosine similarity search on incoming queries, and return the top 5 most relevant chunks. This is the foundation for the Q&A system.

Refer to sections: Architecture > Retrieval-Augmented Generation (RAG), Implementation Decisions > RAG Pipeline

## Acceptance criteria

- [ ] Loads chunks + embeddings from /data/gold/{documentId}.json
- [ ] Embeds user query using OpenAI embedding API
- [ ] Computes cosine similarity between query embedding and chunk embeddings
- [ ] Returns top 5 most relevant chunks with similarity scores
- [ ] Handles missing document gracefully
- [ ] Response time < 1 second for retrieval
- [ ] Unit tests verify cosine similarity correctness
- [ ] Works with variable chunk counts (100s to 1000s)

## Blocked by

#3 (ETL pipeline)

## User stories addressed

- User story 3: Ask questions about specific data
- User story 6: Chat-like Q&A interface
- User story 7: Relevant quotes in answers
- User story 13: Cite which part of PDF was used
