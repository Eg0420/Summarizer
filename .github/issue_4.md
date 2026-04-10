## Parent PRD

See PRD.md

## What to build

Set up a Next.js project on Vercel with a React-based upload form. The form should accept PDF files via drag-and-drop or file picker, and call the Python ETL service's POST /api/process endpoint. Display confirmation when upload is received.

Refer to sections: Architecture > Next.js Frontend & API, User Stories 4, 5, 12, 15

## Acceptance criteria

- [ ] Next.js project scaffolded with TypeScript and Tailwind CSS
- [ ] React upload form with drag-and-drop UI
- [ ] File input validation (PDF only, max 10MB)
- [ ] Form submits to Python /api/process endpoint
- [ ] Displays loading state during upload
- [ ] Shows error message if upload fails
- [ ] Displays confirmation/summary after successful upload
- [ ] Responsive design works on mobile browsers
- [ ] Ready to deploy on Vercel

## Blocked by

None - can start immediately

## User stories addressed

- User story 4: Upload via web interface
- User story 5: See summary immediately
- User story 12: Clear error messages
- User story 15: Works on mobile browsers
