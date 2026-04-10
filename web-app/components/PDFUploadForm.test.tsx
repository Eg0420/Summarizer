import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PDFUploadForm from './PDFUploadForm';

global.fetch = jest.fn();

describe('PDFUploadForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has file input that accepts PDF only', () => {
    render(<PDFUploadForm />);
    
    const fileInput = screen.getByTestId('pdf-file-input');
    expect(fileInput).toHaveAttribute('accept', '.pdf');
  });

  it('renders the drop zone for selecting a PDF', () => {
    render(<PDFUploadForm />);
    
    expect(screen.getByTestId('pdf-drop-zone')).toBeInTheDocument();
  });

  it('shows the selected PDF filename', async () => {
    const user = userEvent.setup();
    render(<PDFUploadForm />);

    const file = new File(['test pdf'], 'sample.pdf', { type: 'application/pdf' });
    await user.upload(screen.getByTestId('pdf-file-input'), file);

    expect(screen.getByTestId('selected-file')).toHaveTextContent('sample.pdf');
  });

  it('processes a selected PDF and displays the summary', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          documentId: 'doc-123',
          filename: 'sample.pdf',
          textLength: 120,
          chunkCount: 2,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          documentId: 'doc-123',
          filename: 'sample.pdf',
          summary: 'Document Summary: Hello from the PDF.',
          tokensUsed: 12,
        }),
      });

    render(<PDFUploadForm />);

    const file = new File(['test pdf'], 'sample.pdf', { type: 'application/pdf' });
    await user.upload(screen.getByTestId('pdf-file-input'), file);
    await user.click(screen.getByRole('button', { name: 'Process PDF' }));

    expect(await screen.findByTestId('summary')).toHaveTextContent(
      'Document Summary: Hello from the PDF.'
    );
    expect(screen.getByPlaceholderText('Ask a question...')).toBeInTheDocument();
  });
});
