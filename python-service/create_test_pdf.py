"""
Create a test PDF file for integration testing
"""
import fitz  # PyMuPDF
from pathlib import Path

def create_test_pdf():
    """Create a simple test PDF with some text content"""
    test_data_dir = Path(__file__).parent / 'test_data'
    test_data_dir.mkdir(exist_ok=True)
    
    pdf_path = test_data_dir / 'sample.pdf'
    
    # Create a new PDF
    doc = fitz.open()
    
    # Add pages with text
    pages_content = [
        "Artificial Intelligence and Machine Learning Introduction\n\n"
        "Artificial Intelligence (AI) is a field of computer science that aims to create intelligent machines. "
        "These machines can perform tasks that typically require human intelligence, such as learning from experience, "
        "recognizing patterns, and understanding language.",
        
        "Machine Learning Overview\n\n"
        "Machine learning is a subset of artificial intelligence that focuses on learning from data without being explicitly programmed. "
        "Machine learning algorithms build mathematical models based on sample data, known as training data, "
        "to make predictions or decisions without being directly instructed to perform the tasks.",
        
        "Deep Learning and Neural Networks\n\n"
        "Deep learning uses artificial neural networks with many layers (hence 'deep') to process data. "
        "These neural networks are inspired by biological neural networks in animal brains and are composed of interconnected neurons. "
        "Deep learning has revolutionized fields such as computer vision, natural language processing, and speech recognition.",
    ]
    
    for page_num, text in enumerate(pages_content):
        page = doc.new_page()
        page.insert_text((10, 10), text, fontsize=12)
    
    # Save the PDF
    doc.save(str(pdf_path))
    doc.close()
    
    print(f"Test PDF created at: {pdf_path}")
    return pdf_path

if __name__ == '__main__':
    create_test_pdf()
