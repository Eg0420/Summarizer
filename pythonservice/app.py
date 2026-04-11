from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import uuid
import tempfile
from werkzeug.utils import secure_filename
from etl_pipeline import process_pdf_to_embeddings

app = Flask(__name__)
CORS(app)

app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB max
ALLOWED_EXTENSIONS = {'pdf'}

# Data directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_DIR = os.path.dirname(BASE_DIR)
DATA_DIRS = {
    'raw': os.environ.get('DATA_RAW_DIR', os.path.join(REPO_DIR, 'data', 'raw')),
    'processed': os.environ.get('DATA_PROCESSED_DIR', os.path.join(REPO_DIR, 'data', 'processed')),
    'gold': os.environ.get('DATA_GOLD_DIR', os.path.join(REPO_DIR, 'data', 'gold')),
}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ✅ FIX 1: Support BOTH routes (tests + frontend)
@app.route('/api/process', methods=['POST'])
@app.route('/api/summarize', methods=['POST'])
def process_pdf():
    """Receive PDF file, process it, and return metadata."""

    # ✅ FIX 2: Better validation (avoids 500 errors)
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files.get('file')

    if file is None or file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'File must be PDF'}), 400

    try:
        filename = secure_filename(file.filename)
        doc_id = str(uuid.uuid4())

        # ✅ FIX 3: Safe temp file handling
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name

        # Process PDF
        result = process_pdf_to_embeddings(
            pdf_path=tmp_path,
            doc_id=doc_id,
            data_dirs=DATA_DIRS,
            original_filename=filename
        )

        # Clean up temp file
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

        return jsonify(result), 200

    except Exception as e:
        # ✅ FIX 4: Better error visibility for debugging
        print("ERROR:", str(e))
        return jsonify({'error': f'Processing failed: {str(e)}'}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'}), 200


if __name__ == '__main__':
    app.run(debug=True, port=5000)