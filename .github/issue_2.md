## Parent PRD

See PRD.md

## What to build

Implement the core ETL data pipeline: extract text from uploaded PDFs using PyMuPDF, chunk it into 500-token segments with 100-token overlap, generate OpenAI embeddings, and persistently store chunks + embeddings in /data/gold as JSON format.

Refer to sections: Architecture > Python ETL Service, Implementation Decisions > Chunking Strategy

## Acceptance criteria

- [ ] PyMuPDF text extraction handles PDFs up to 10MB
- [ ] Text is cleaned (remove extra whitespace, normalize formatting)
- [ ] Chunks are 500 tokens with 100-token overlap
- [ ] Token counting uses OpenAI tiktoken library
- [ ] OpenAI embedding API (text-embedding-3-small) generates embeddings for all chunks
- [ ] /data/gold/{documentId}.json stores chunks + embeddings with metadata
- [ ] Handles embedding generation failures gracefully
- [ ] Returns chunkCount and textLength in response
- [ ] Chunked text persisted to /data/processed for reference

## Blocked by

#1 (Python service skeleton)

## User stories addressed

- User story 1: Understand long documents
- User story 18: Handle PDFs up to 10MB
- User story 19: Clear error logs for embedding failures
