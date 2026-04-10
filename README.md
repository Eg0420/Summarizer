# PDF Summarizer with RAG Q&A

A full-stack application that allows users to upload PDF documents, generate summaries, and ask questions using Retrieval-Augmented Generation (RAG).

## Features

- 📄 **PDF Upload & Processing**: Extract text from PDF documents and chunk them for analysis
- 🤖 **AI-Powered Summarization**: Generate concise summaries using OpenAI GPT models
- ❓ **Interactive Q&A**: Ask questions about uploaded documents with context-aware answers
- 🔒 **Rate Limiting**: Built-in token tracking and usage limits
- 🧪 **Comprehensive Testing**: 57 total tests covering unit and integration scenarios
- 🚀 **CI/CD Ready**: Automated testing and deployment pipelines

## Architecture

### Backend (Python/Flask)
- **ETL Pipeline**: PDF text extraction, chunking, and embedding generation
- **API Endpoints**: Document processing and Q&A services
- **Data Storage**: JSON-based document storage in `/data/gold`

### Frontend (Next.js/React)
- **Modern UI**: Responsive web interface for document upload and Q&A
- **Real-time Chat**: Interactive question-answering interface
- **Token Tracking**: Live usage monitoring and rate limit display

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- OpenAI API key (for LLM features)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Eg0420/Summarizer.git
   cd Summarizer
   ```

2. **Set up Python service**
   ```bash
   cd python-service
   pip install -r requirements.txt
   python app.py
   ```

3. **Set up Next.js app** (in another terminal)
   ```bash
   cd web-app
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Testing

### Run All Tests
```bash
# Python tests
cd python-service && python -m pytest

# Next.js tests
cd web-app && npm test

# Integration tests
cd web-app && npm run test -- __tests__/integration-*.test.ts
```

### Test Coverage
- **Python Service**: 12 tests (ETL pipeline, API endpoints, integration)
- **Next.js App**: 45 tests (components, utilities, API routes, integration)
- **Total**: 57 tests with comprehensive coverage

## CI/CD

This project uses GitHub Actions for automated testing and deployment:

### Workflows
- **CI/CD Pipeline** (`ci-cd.yml`): Runs tests for both services on every push/PR
- **Python Deploy** (`python-deploy.yml`): Builds and prepares Python service for deployment
- **Next.js Deploy** (`nextjs-deploy.yml`): Builds Next.js app for Vercel deployment
- **Security** (`security.yml`): Weekly security scanning and vulnerability checks

### Deployment Targets
- **Frontend**: Vercel (recommended)
- **Backend**: Railway, Render, or Fly.io

## Project Structure

```
Summarizer/
├── .github/
│   └── workflows/          # GitHub Actions CI/CD
├── python-service/         # Flask backend
│   ├── app.py             # Main Flask application
│   ├── etl_pipeline.py    # PDF processing pipeline
│   ├── test_*.py          # Unit tests
│   ├── requirements.txt   # Python dependencies
│   └── Dockerfile         # Container configuration
├── web-app/               # Next.js frontend
│   ├── app/               # Next.js app router
│   ├── components/        # React components
│   ├── lib/               # Utilities and services
│   ├── __tests__/         # Integration tests
│   └── package.json       # Node dependencies
├── data/                  # Document storage
│   ├── raw/              # Original PDFs
│   ├── processed/        # Text chunks
│   └── gold/             # Chunks + embeddings
└── PRD.md                # Product requirements
```

## API Documentation

### Python Service Endpoints

- `POST /api/process` - Upload and process PDF
- `GET /health` - Health check

### Next.js API Routes

- `POST /api/summarize` - Generate document summary
- `POST /api/ask` - Ask questions about documents

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure CI passes
5. Submit a pull request

## License

MIT License - see LICENSE file for details