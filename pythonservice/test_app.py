import pytest
from io import BytesIO
import os

# ✅ Disable AI for tests
os.environ["USE_AI"] = "false"

from app import app


@pytest.fixture
def client():
    """Create a Flask test client."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def create_minimal_pdf():
    """Generate a minimal valid PDF in memory."""
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
(Hello World) Tj
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
0000000378 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
474
%%EOF"""
    return BytesIO(pdf_content)


class TestPDFProcessing:

    def test_upload_pdf_returns_200(self, client):
        pdf_file = create_minimal_pdf()

        response = client.post(
            '/api/summarize',
            data={'file': (pdf_file, 'test.pdf')},
            content_type='multipart/form-data'
        )

        assert response.status_code == 200
        data = response.get_json()

        assert data['documentId'] is not None
        assert data['filename'] == 'test.pdf'
        assert data['textLength'] > 0
        assert data['chunkCount'] > 0

        # ✅ NEW: ensure summary exists
        assert 'summary' in data


    def test_reject_non_pdf_file(self, client):
        text_file = BytesIO(b"This is not a PDF")

        response = client.post(
            '/api/summarize',
            data={'file': (text_file, 'test.txt')},
            content_type='multipart/form-data'
        )

        assert response.status_code == 400
        assert 'error' in response.get_json()


    def test_reject_missing_file(self, client):
        response = client.post(
            '/api/summarize',
            content_type='multipart/form-data'
        )

        assert response.status_code == 400
        assert 'error' in response.get_json()


    def test_health_check(self, client):
        response = client.get('/health')

        assert response.status_code == 200
        assert response.get_json()['status'] == 'healthy'