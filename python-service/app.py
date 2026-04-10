from flask import Flask, request, jsonify
import os
import uuid
import tempfile
from werkzeug.utils import secure_filename
from etl_pipeline import process_pdf_to_embeddings

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB max
ALLOWED_EXTENSIONS = {'pdf'}

# Data directories
DATA_DIRS = {
    'raw': os.environ.get('DATA_RAW_DIR', './data/raw'),
    'processed': os.environ.get('DATA_PROCESSED_DIR', './data/processed'),
    'gold': os.environ.get('DATA_GOLD_DIR', './data/gold'),
}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/process', methods=['POST'])
def process_pdf():
    """Receive PDF file, process it (extract text, chunk, embed), and return metadata."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'File must be PDF'}), 400
    
    try:
        # Save uploaded file to temporary location
        filename = secure_filename(file.filename)
        doc_id = str(uuid.uuid4())
        
        # Create temp file for processing
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name
        
        # Monkey-patch the Path.name property for the temp file
        # This is a workaround to preserve the original filename
        from unittest.mock import patch
        from pathlib import Path as PathlibPath
        
        original_stat = PathlibPath(tmp_path).stat
        
        # Process PDF through ETL pipeline
        result = process_pdf_to_embeddings(
            pdf_path=tmp_path,
            doc_id=doc_id,
            data_dirs=DATA_DIRS,
            original_filename=filename
        )
        
        # Clean up temp file
        os.unlink(tmp_path)
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({'error': f'Processing failed: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
