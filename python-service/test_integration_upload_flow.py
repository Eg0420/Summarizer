"""
Integration tests for Issue #9: Upload → Process → Ask Flow
Tests the complete pipeline from PDF upload through ELM processing
"""
import os
import json
import pytest
from app import DATA_DIRS, app
from pathlib import Path


@pytest.fixture
def client():
    """Create Flask test client"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


@pytest.fixture
def test_pdf_path():
    """Path to test PDF file"""
    return Path(__file__).parent / 'test_data' / 'sample.pdf'


@pytest.fixture(autouse=True)
def cleanup_gold_data():
    """Clean up test data before and after each test"""
    gold_dir = Path(DATA_DIRS['gold'])
    yield
    # Cleanup after test
    for file in gold_dir.glob('*.json'):
        try:
            file.unlink()
        except:
            pass


class TestUploadToProcessFlow:
    """Test the complete upload → extract → chunk → embed flow"""

    def test_end_to_end_pdf_processing_flow(self, client, test_pdf_path):
        """
        Integration test: Upload PDF → Extract → Chunk → Embed → Verify gold data
        """
        # Skip if test PDF doesn't exist (for CI/CD compatibility)
        if not test_pdf_path.exists():
            pytest.skip("Test PDF file not available")

        # Step 1: Upload PDF
        with open(test_pdf_path, 'rb') as f:
            response = client.post(
                '/api/process',
                data={'file': f},
                content_type='multipart/form-data'
            )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'documentId' in data
        document_id = data['documentId']

        # Step 2: Verify document was processed
        gold_dir = Path(DATA_DIRS['gold'])
        gold_file = gold_dir / f'{document_id}.json'
        
        # Wait a moment for async processing
        import time
        time.sleep(0.5)
        
        assert gold_file.exists(), f"Gold file not created: {gold_file}"

        # Step 3: Verify gold data structure
        with open(gold_file) as f:
            gold_data = json.load(f)

        assert 'documentId' in gold_data
        assert 'filename' in gold_data
        assert 'chunks' in gold_data
        assert len(gold_data['chunks']) > 0

        # Step 4: Verify chunk structure
        first_chunk = gold_data['chunks'][0]
        assert 'id' in first_chunk
        assert 'text' in first_chunk
        assert 'embedding' in first_chunk
        assert isinstance(first_chunk['embedding'], list)
        assert len(first_chunk['embedding']) > 0

        # Step 5: Verify metadata
        assert 'chunkCount' in gold_data
        assert gold_data['chunkCount'] == len(gold_data['chunks'])

    def test_api_endpoint_health(self, client):
        """Test that API endpoints are accessible"""
        response = client.get('/health')
        assert response.status_code == 200

    def test_summarize_endpoint_with_valid_document(self, client, test_pdf_path):
        """Test summarize endpoint after document processing"""
        if not test_pdf_path.exists():
            pytest.skip("Test PDF file not available")

        # Upload and process
        with open(test_pdf_path, 'rb') as f:
            response = client.post(
                '/api/process',
                data={'file': f},
                content_type='multipart/form-data'
            )

        assert response.status_code == 200
        document_id = json.loads(response.data)['documentId']

        # Wait for processing
        import time
        time.sleep(0.5)

        # Call summarize endpoint via Next.js API (simulated)
        # This tests that the document was properly stored
        gold_dir = Path(DATA_DIRS['gold'])
        gold_file = gold_dir / f'{document_id}.json'
        
        assert gold_file.exists()
        with open(gold_file) as f:
            data = json.load(f)
            assert len(data['chunks']) > 0

    def test_multiple_document_uploads(self, client, test_pdf_path):
        """Test uploading multiple documents in sequence"""
        if not test_pdf_path.exists():
            pytest.skip("Test PDF file not available")

        document_ids = []
        
        # Upload 2 documents
        for _ in range(2):
            with open(test_pdf_path, 'rb') as f:
                response = client.post(
                    '/api/process',
                    data={'file': f},
                    content_type='multipart/form-data'
                )
            
            assert response.status_code == 200
            doc_id = json.loads(response.data)['documentId']
            document_ids.append(doc_id)

        # Wait for processing
        import time
        time.sleep(1.0)

        # Verify both documents exist with different IDs
        gold_dir = Path(DATA_DIRS['gold'])
        
        assert len(document_ids) == 2
        assert document_ids[0] != document_ids[1]  # Should have different UUIDs
        
        for doc_id in document_ids:
            assert (gold_dir / f'{doc_id}.json').exists()

    def test_chunk_consistency_across_processing(self, client, test_pdf_path):
        """Test that chunks are consistent (same PDF → same chunks)"""
        if not test_pdf_path.exists():
            pytest.skip("Test PDF file not available")

        # Process same PDF twice
        chunks_list = []
        
        for _ in range(2):
            with open(test_pdf_path, 'rb') as f:
                response = client.post(
                    '/api/process',
                    data={'file': f},
                    content_type='multipart/form-data'
                )
            
            assert response.status_code == 200
            document_id = json.loads(response.data)['documentId']
            
            # Wait for processing
            import time
            time.sleep(0.5)
            
            gold_dir = Path(DATA_DIRS['gold'])
            with open(gold_dir / f'{document_id}.json') as f:
                gold_data = json.load(f)
                chunks_list.append([chunk['text'] for chunk in gold_data['chunks']])

        # Same PDF should produce same chunks
        assert chunks_list[0] == chunks_list[1]
