## Parent PRD

See PRD.md

## What to build

Implement automatic summary generation in Next.js as a separate POST /api/summarize endpoint. This endpoint loads chunks from /data/gold for a given documentId, concatenates the most relevant chunks, and calls OpenAI to generate a cohesive summary. Return the summary to the frontend for display.

Refer to sections: Architecture > Next.js Frontend & API, Implementation Decisions > RAG Pipeline (summary variant)

## Acceptance criteria

- [ ] POST /api/summarize endpoint accepts { documentId }
- [ ] Loads document chunks from /data/gold/{documentId}.json
- [ ] Concatenates all or top chunks (keep under OpenAI token limit)
- [ ] Calls OpenAI GPT (e.g., gpt-4-turbo) with summarization prompt
- [ ] Returns { summary: "...", tokensUsed: N }
- [ ] Handles missing documents gracefully
- [ ] Response time < 10 seconds
- [ ] Stores summary metadata in /data/gold for reuse
- [ ] Called automatically after upload completes

## Blocked by

#3 (ETL pipeline)
#2 (Next.js project setup)

## User stories addressed

- User story 2: See auto-generated summary immediately
- User story 16: Fast response times for summaries (<10 seconds)
