## Parent PRD

See PRD.md

## What to build

Create a basic Flask or FastAPI server that exposes an HTTP endpoint for receiving PDFs from Next.js. The service should accept POST requests and be ready to process PDF files in the next iteration.

Refer to section: Architecture > Python ETL Service

## Acceptance criteria

- [ ] Python service (Flask/FastAPI) initialized and runnable locally
- [ ] POST /api/process endpoint accepts multipart/form-data with PDF file
- [ ] Endpoint returns 200 with placeholder response (e.g., { "status": "received" })
- [ ] Service can be called from Next.js backend via HTTP
- [ ] Basic error handling for invalid requests
- [ ] Deployment ready for Railway/Render/Fly

## Blocked by

None - can start immediately

## User stories addressed

Infrastructure; no direct user stories.
