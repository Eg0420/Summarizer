from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import uuid
import tempfile
from werkzeug.utils import secure_filename
from etl_pipeline import process_pdf_to_embeddings
from PyPDF2 import PdfReader
from openai import OpenAI

app = Flask(__name__)
CORS(app)

# ✅ OpenAI client (safe init)
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {'pdf'}

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_DIR = os.path.dirname(BASE_DIR)
DATA_DIRS = {
    'raw': os.environ.get('DATA_RAW_DIR', os.path.join(REPO_DIR, 'data', 'raw')),
    'processed': os.environ.get('DATA_PROCESSED_DIR', os.path.join(REPO_DIR, 'data', 'processed')),
    'gold': os.environ.get('DATA_GOLD_DIR', os.path.join(REPO_DIR, 'data', 'gold')),
}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/api/process', methods=['POST'])
@app.route('/api/summarize', methods=['POST'])
def process_pdf():

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

        # Save temp file
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

        print("DEBUG RESULT:", result)

        # 🔥 SUMMARY LOGIC (AI + fallback)
        try:
            reader = PdfReader(tmp_path)
            full_text = ""

            for page in reader.pages:
                full_text += page.extract_text() or ""

            if not full_text:
                summary = "No text extracted from PDF"

            else:
                # ✅ Check if we should use AI
                use_ai = os.environ.get("USE_AI", "true").lower() == "true"

                if use_ai and client:
                    # 🔥 AI summary
                    trimmed_text = full_text[:3000]

                    response = client.chat.completions.create(
                        model="gpt-4o-mini",
                        messages=[
                            {
                                "role": "system",
                                "content": "You are a helpful assistant that summarizes documents clearly and concisely."
                            },
                            {
                                "role": "user",
                                "content": f"Summarize this document:\n\n{trimmed_text}"
                            }
                        ],
                        max_tokens=150
                    )

                    summary = response.choices[0].message.content.strip()

                else:
                    # ✅ Fallback (used in tests)
                    sentences = full_text.split(". ")
                    summary = ". ".join(sentences[:2]).strip()

                    if not summary.endswith("."):
                        summary += "."

        except Exception as e:
            print("SUMMARY ERROR:", str(e))
            summary = "Summary generation failed"

        # Delete temp file
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

        return jsonify({
            **result,
            "summary": summary
        }), 200

    except Exception as e:
        print("ERROR:", str(e))
        return jsonify({'error': f'Processing failed: {str(e)}'}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'}), 200


if __name__ == '__main__':
    app.run(debug=True, port=5000)