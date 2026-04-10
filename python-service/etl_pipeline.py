"""
ETL Pipeline: Extract, Transform, Load PDF content into embeddings and chunks.
"""
import json
import uuid
from pathlib import Path
from typing import Dict, List, Any
import fitz  # PyMuPDF

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from PDF using PyMuPDF."""
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    except Exception as e:
        raise ValueError(f"Failed to extract text from PDF: {e}")

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 100) -> List[str]:
    """
    Split text into chunks with overlap.
    
    Args:
        text: Text to chunk
        chunk_size: Target size for each chunk (in words)
        overlap: Number of overlapping words between chunks
    
    Returns:
        List of text chunks
    """
    words = text.split()
    chunks = []
    
    if len(words) <= chunk_size:
        return [text]
    
    i = 0
    while i < len(words):
        # Take chunk_size words
        chunk_words = words[i:i + chunk_size]
        chunk_text = ' '.join(chunk_words)
        chunks.append(chunk_text)
        
        # Move forward by (chunk_size - overlap)
        i += chunk_size - overlap
    
    return chunks

def generate_openai_embeddings(text: str, model: str = "text-embedding-3-small") -> List[float]:
    """
    Generate embeddings using OpenAI API.
    
    Args:
        text: Text to embed
        model: OpenAI model to use
    
    Returns:
        List of floats representing the embedding
    """
    # Placeholder: In real implementation, call OpenAI API
    # For now, return a dummy embedding
    import hashlib
    
    # Generate deterministic fake embedding based on text hash
    hash_val = hashlib.md5(text.encode()).hexdigest()
    embedding = [float(int(hash_val[i:i+2], 16)) / 256.0 for i in range(0, 8, 2)]
    # Pad to 1536 dimensions (actual embedding size)
    while len(embedding) < 1536:
        embedding.extend(embedding[:min(4, 1536 - len(embedding))])
    return embedding[:1536]

def process_pdf_to_embeddings(
    pdf_path: str,
    doc_id: str,
    data_dirs: Dict[str, str],
    original_filename: str = None
) -> Dict[str, Any]:
    """
    Process a PDF file end-to-end: extract → chunk → embed → store.
    
    Args:
        pdf_path: Path to PDF file
        doc_id: Document ID (UUID)
        data_dirs: Dictionary with 'raw', 'processed', 'gold' directory paths
        original_filename: Original filename (if processing from temp file)
    
    Returns:
        Dictionary with processing results including documentId, chunkCount, etc.
    """
    # Verify PDF exists
    if not Path(pdf_path).exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")
    
    # Use provided filename or get from path
    filename = original_filename or Path(pdf_path).name
    
    # Step 1: Extract text
    raw_text = extract_text_from_pdf(pdf_path)
    text_length = len(raw_text)
    
    # Step 2: Chunk text
    chunks = chunk_text(text=raw_text, chunk_size=500, overlap=100)
    
    # Step 3: Generate embeddings for each chunk
    chunks_with_embeddings = []
    for i, chunk_text_content in enumerate(chunks):
        embedding = generate_openai_embeddings(chunk_text_content)
        chunks_with_embeddings.append({
            'id': i,
            'text': chunk_text_content,
            'embedding': embedding,
            'tokenCount': len(chunk_text_content.split())  # Rough estimate
        })
    
    # Step 4: Save processed text to /data/processed
    processed_dir = Path(data_dirs['processed'])
    processed_dir.mkdir(parents=True, exist_ok=True)
    processed_file = processed_dir / f"{doc_id}_chunks.txt"
    with open(processed_file, 'w') as f:
        for chunk in chunks_with_embeddings:
            f.write(f"--- Chunk {chunk['id']} ---\n{chunk['text']}\n\n")
    
    # Step 5: Save chunks + embeddings to /data/gold
    gold_dir = Path(data_dirs['gold'])
    gold_dir.mkdir(parents=True, exist_ok=True)
    gold_file = gold_dir / f"{doc_id}.json"
    
    document_data = {
        'documentId': doc_id,
        'filename': filename,
        'uploadedAt': str(Path(pdf_path).stat().st_mtime),
        'textLength': text_length,
        'chunkCount': len(chunks_with_embeddings),
        'chunks': chunks_with_embeddings
    }
    
    with open(gold_file, 'w') as f:
        json.dump(document_data, f, indent=2)
    
    # Copy PDF to /data/raw
    raw_dir = Path(data_dirs['raw'])
    raw_dir.mkdir(parents=True, exist_ok=True)
    raw_file = raw_dir / filename
    with open(pdf_path, 'rb') as src:
        with open(raw_file, 'wb') as dst:
            dst.write(src.read())
    
    return {
        'documentId': doc_id,
        'filename': filename,
        'textLength': text_length,
        'chunkCount': len(chunks_with_embeddings),
    }
