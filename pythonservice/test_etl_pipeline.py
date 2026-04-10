import pytest
import json
import os
import uuid
from pathlib import Path
from unittest.mock import patch, MagicMock
import sys

# Add the app module to path
sys.path.insert(0, os.path.dirname(__file__))

from etl_pipeline import process_pdf_to_embeddings

@pytest.fixture
def test_pdf_path(tmp_path):
    """Create a minimal test PDF file."""
    pdf_content = b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< >>
stream
BT
/F1 12 Tf
100 700 Td
(This is a test document.) Tj
100 680 Td
(It contains important information about testing.) Tj
100 660 Td
(The purpose is to verify PDF processing works correctly.) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000279 00000 n
0000000430 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
520
%%EOF"""
    
    pdf_file = tmp_path / "test.pdf"
    pdf_file.write_bytes(pdf_content)
    return str(pdf_file)

@pytest.fixture
def data_dirs(tmp_path):
    """Create temporary data directories."""
    raw_dir = tmp_path / "raw"
    processed_dir = tmp_path / "processed"
    gold_dir = tmp_path / "gold"
    
    raw_dir.mkdir()
    processed_dir.mkdir()
    gold_dir.mkdir()
    
    return {
        'raw': str(raw_dir),
        'processed': str(processed_dir),
        'gold': str(gold_dir),
    }

class TestETLPipeline:
    """Test suite for ETL pipeline."""
    
    @patch('etl_pipeline.generate_openai_embeddings')
    def test_process_pdf_generates_chunks_and_embeddings(self, mock_embeddings, test_pdf_path, data_dirs):
        """Test that PDF is processed into chunks with embeddings."""
        # Mock OpenAI embeddings
        mock_embeddings.return_value = [0.1, 0.2, 0.3, 0.4, 0.5]
        
        # Process the PDF
        doc_id = str(uuid.uuid4())
        result = process_pdf_to_embeddings(
            pdf_path=test_pdf_path,
            doc_id=doc_id,
            data_dirs=data_dirs
        )
        
        # Verify result contains expected fields
        assert result['documentId'] == doc_id
        assert result['filename'] == 'test.pdf'
        assert result['textLength'] > 0
        assert 'chunkCount' in result
        assert result['chunkCount'] > 0
        
        # Verify chunks + embeddings saved to /data/gold
        gold_file = Path(data_dirs['gold']) / f"{doc_id}.json"
        assert gold_file.exists(), f"Gold file not created at {gold_file}"
        
        with open(gold_file, 'r') as f:
            data = json.load(f)
        
        assert data['documentId'] == doc_id
        assert 'chunks' in data
        assert len(data['chunks']) > 0
        assert all('text' in chunk and 'embedding' in chunk for chunk in data['chunks'])
        
        # Verify processed text saved
        processed_file = Path(data_dirs['processed']) / f"{doc_id}_chunks.txt"
        assert processed_file.exists(), f"Processed file not created at {processed_file}"
    
    def test_chunking_with_overlap(self):
        """Test that chunking uses 500-token chunks with 100-token overlap."""
        from etl_pipeline import chunk_text
        
        # Create a long text (simulate 1000 tokens)
        long_text = "word " * 1000  # ~1000 words
        
        chunks = chunk_text(long_text, chunk_size=500, overlap=100)
        
        # Verify chunks
        assert len(chunks) > 1
        assert all(len(chunk) > 0 for chunk in chunks)
        
        # Verify overlap (adjacent chunks should share content)
        for i in range(len(chunks) - 1):
            # Simple check: chunks should overlap in content
            assert chunks[i][-50:] in chunks[i+1] or len(chunks[i]) < 500
    
    def test_reject_invalid_pdf(self, data_dirs):
        """Test that invalid PDFs are rejected gracefully."""
        from etl_pipeline import process_pdf_to_embeddings
        
        # Try to process a non-existent file
        with pytest.raises(FileNotFoundError):
            process_pdf_to_embeddings(
                pdf_path="/nonexistent/file.pdf",
                doc_id=str(uuid.uuid4()),
                data_dirs=data_dirs
            )
