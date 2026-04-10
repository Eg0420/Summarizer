# Product Requirements Document: PDF Summarizer

## Problem Statement

Users frequently receive long PDF documents but need quick insights without reading the entire document. They also need the ability to ask specific questions about PDF content and receive contextual answers. Currently, there's no unified web interface that combines automatic summarization with interactive question-answering for PDFs.

## Solution

Build a web application where users can upload PDF files and receive:
1. An automatic summary of the document's key points
2. An interactive Q&A interface to ask specific questions about the document's content

The solution uses a Retrieval-Augmented Generation (RAG) pipeline powered by OpenAI embeddings and LLM calls. A Python ETL service handles PDF extraction, chunking, and embedding generation, while a Next.js web app provides the user interface and orchestrates the Q&A flow.

## User Stories

1. As a researcher, I want to upload a PDF research paper, so that I can quickly understand its main findings without reading 20+ pages
2. As a student, I want to see an auto-generated summary immediately after upload, so that I can decide if the PDF is relevant to my work
3. As a business analyst, I want to ask questions about a PDF's specific data points, so that I can extract insights without manual searching
4. As a user, I want to upload a PDF via a simple web interface, so that I don't need to install any software
5. As a user, I want to see the summary displayed clearly on the same page, so that I can review it without navigation
6. As a user, I want to ask follow-up questions in a chat-like interface, so that I can have a conversational experience
7. As a user, I want relevant quotes from the PDF included in answers, so that I can verify the accuracy of the response
8. As a user, I want the system to remember my uploaded PDF, so that I can ask multiple questions without re-uploading
9. As a budget-conscious user, I want to see how many API tokens have been used, so that I understand the cost impact
10. As a power user, I want to upload multiple PDFs in sequence, so that I can summarize a batch of documents
11. As a user concerned about limits, I want to know if I've hit rate limits, so that I can adjust my usage
12. As a user, I want clear error messages when PDF upload fails, so that I know what went wrong
13. As a user, I want the Q&A system to cite which part of the PDF it used, so that I can trust the answer
14. As a user, I want to export the summary as text, so that I can save it for later reference
15. As a user, I want the app to work on mobile browsers, so that I can use it on any device
16. As a user, I want fast response times for summaries (<10 seconds), so that the experience feels responsive
17. As a user, I want fast response times for Q&A (<5 seconds per question), so that I can ask questions fluidly
18. As a developer, I want the Python ETL service to handle PDFs up to 10MB, so that most real-world documents are supported
19. As a developer, I want clear error logs when embeddings fail, so that I can debug issues
20. As a user, I want the app to be free to try before committing, so that I can evaluate the tool

## Implementation Decisions

### Architecture

- **Frontend:** Next.js with React and TypeScript running on Vercel
- **Backend:** Python service (separate from Next.js) running on Railway/Render/Fly
- **LLM Provider:** OpenAI (for embeddings and text completion)
- **Storage:** JSON-backed file system with three directories:
  - `/data/raw` → Original uploaded PDFs
  - `/data/processed` → Cleaned text chunks
  - `/data/gold` → Chunks + embeddings (used by the Q&A app)

### Python ETL Service

The Python service handles:
1. **PDF Parsing:** Use PyMuPDF to extract text from uploaded PDFs
2. **Text Chunking:** Split extracted text into 500-token fixed-size chunks with 100-token overlap
3. **Embedding Generation:** Call OpenAI embedding API (model: `text-embedding-3-small`) to generate embeddings
4. **Persistence:** Save original PDF to `/data/raw`, cleaned chunks to `/data/processed`, and chunks + embeddings to `/data/gold` as JSON

The service exposes an HTTP API endpoint:
- `POST /api/upload` → Receives a PDF file → returns document metadata + summary

### Next.js Frontend & API

- **Upload API** (`/api/upload`): Accept PDF file → forward to Python service → orchestrate summary generation → return summary to frontend
- **Retrieval Engine:** Load embeddings from `/data/gold` → perform cosine similarity search for incoming queries
- **QA API** (`/api/ask`): Accept document ID + question → retrieve top K relevant chunks → call OpenAI to generate answer → return answer with citations
- **Frontend UI:**
  - Single-page upload form with drag-and-drop
  - Summary display section showing auto-generated summary
  - Chat-like Q&A interface for asking follow-up questions
  - Token usage tracker visible in the UI
  - Error messages for upload failures and rate limiting

### Chunking Strategy

- Fixed 500-token chunks with 100-token overlap to preserve semantic cohesion
- Token counting done via OpenAI tiktoken library

### Retrieval-Augmented Generation (RAG)

- User question is embedded using the same OpenAI API
- Find top 5 most similar chunks via cosine similarity over stored embeddings
- Pass question + top chunks as context to OpenAI GPT model for answer generation
- Model should cite which chunks were used (source attribution)

### Rate Limiting & Cost Control

- Per-session rate limiting: Max 20 questions per session, max 5 PDFs per session
- Token usage tracking: Log tokens used for embeddings and completions
- Display running total in UI to help users monitor costs

### MVP Scope: Initial Features

1. **Upload → Process → Ask Flow:**
   - User uploads PDF via web form
   - Python service extracts text, chunks it, generates embeddings
   - Backend stores in `/data/gold`
   - Frontend calls summarization API
   - Auto-generated summary displays
   
2. **Ask Question Flow:**
   - User asks a question in chat interface
   - Backend retrieves relevant chunks via embedding similarity
   - OpenAI generates contextual answer
   - Answer displays with relevant chunk citations

## Implementation Decisions (Technical Details)

### Python ETL Service Interface

```
POST /api/upload
Body: multipart/form-data with PDF file
Response: {
  "documentId": "uuid",
  "filename": "document.pdf",
  "textLength": 5000,
  "chunkCount": 12,
  "summary": "Auto-generated summary text..."
}
```

### Next.js API Routes

```
POST /api/ask
Body: {
  "documentId": "uuid",
  "question": "What are the main findings?"
}
Response: {
  "answer": "The main findings are...",
  "sources": [
    {"chunkId": 0, "text": "relevant excerpt..."},
    {"chunkId": 3, "text": "relevant excerpt..."}
  ],
  "tokensUsed": 150
}
```

### Document Metadata Schema (stored in `/data/gold`)

```json
{
  "documentId": "uuid",
  "filename": "document.pdf",
  "uploadedAt": "2026-04-09T10:30:00Z",
  "summary": "...",
  "chunks": [
    {
      "id": 0,
      "text": "...",
      "embedding": [0.1, 0.2, ..., 0.5],
      "tokenCount": 500
    }
  ]
}
```

## Testing Decisions

### What Makes a Good Test

Tests should verify **external behavior** of modules and flows, not internal implementation:
- A good test uploads a real PDF and verifies the summary is generated
- A bad test mocks the embedding API; instead, tests should use a small example PDF with deterministic content
- Tests should validate end-to-end flows, not individual utility functions

### Modules to Test

1. **Upload → Process → Ask Flow (Integration Test):**
   - Upload a small test PDF
   - Verify Python service extracts text correctly
   - Verify chunks are stored in `/data/gold`
   - Verify embeddings are generated
   - Ask a question about known content in the PDF
   - Verify the retrieved chunks are relevant
   - Verify the generated answer is accurate

2. **Ask Question Flow (Integration Test):**
   - Use a pre-processed PDF in `/data/gold`
   - Ask multiple questions with different specificity levels
   - Verify retrieval accuracy (top chunks are relevant)
   - Verify answer quality and citations

### Test Infrastructure

- Use pytest for Python ETL service tests
- Use Jest for Next.js API tests
- Use a small, deterministic test PDF (~2KB) with known content for reproducibility
- Mock OpenAI API calls in unit tests; use real API in integration tests (with cost tracking)
- Store test results and token usage logs for cost analysis

## Out of Scope

- **User authentication:** Multi-user support deferred to v2
- **Multiple PDFs per user:** Initial MVP handles one PDF at a time
- **OCR support:** Scanned/image-based PDFs are out of scope
- **Advanced features:** Export to Word, PDF annotation, collaboration, etc.
- **Mobile app:** Web-only in MVP; mobile optimization is secondary
- **Custom LLM models:** OpenAI only; other providers deferred
- **Cached embeddings across sessions:** Embeddings generated per upload; no persistent cache across browser sessions
- **Search across multiple documents:** Single-document Q&A only

## Further Notes

- **Cost Monitoring:** OpenAI embedding and completion costs must be visible and trackable to users
- **Error Handling:** Clear, user-friendly messages for:
  - PDF parsing failures (unsupported format, corrupted file)
  - Python service unreachable
  - OpenAI API rate limits or failures
  - Rate limiting (session quota exceeded)
- **Performance Target:** Summaries in <10 seconds, Q&A in <5 seconds
- **Security:** Validate PDF file size and type before processing; sanitize user inputs
- **Data Retention:** PDFs and embeddings persist in `/data/gold` until manually deleted by user or server restart (no auto-cleanup in MVP)
