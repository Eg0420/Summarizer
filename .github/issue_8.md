## Parent PRD

See PRD.md

## What to build

Implement token usage tracking across all LLM calls (embeddings, summarization, Q&A) and enforce rate limiting per session (max 20 questions, max 5 PDFs). Display running token usage total in the UI with cost indicator.

Refer to sections: Implementation Decisions > Rate Limiting & Cost Control

## Acceptance criteria

- [ ] Log tokens used for every OpenAI call (embeddings, gpt-4 calls)
- [ ] Track total tokens per session in memory or local storage
- [ ] Enforce rate limit: max 5 PDF uploads per session
- [ ] Enforce rate limit: max 20 questions per session
- [ ] Return 429 status with clear message when limits exceeded
- [ ] UI displays total tokens used so far
- [ ] UI shows estimated cost (e.g., "~$0.05 used")
- [ ] Clear session limits before page reload (session-based, not persistent)
- [ ] Log rate limit violations to console for debugging

## Blocked by

#7 (Q&A API)

## User stories addressed

- User story 9: See how many API tokens have been used
- User story 11: Know if rate limits have been hit
