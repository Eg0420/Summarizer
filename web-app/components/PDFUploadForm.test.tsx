import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PDFUploadForm from './PDFUploadForm';

describe('PDFUploadForm', () => {
  it('renders upload form with file input', () => {
    render(<PDFUploadForm />);
    
    const input = screen.getByRole('button', { name: /upload/i });
    expect(input).toBeInTheDocument();
  });

  it('displays drag-and-drop area', () => {
    render(<PDFUploadForm />);
    
    const dropArea = screen.getByText(/drag and drop/i);
    expect(dropArea).toBeInTheDocument();
  });

  it('has file input that accepts PDF only', () => {
    render(<PDFUploadForm />);
    
    const fileInput = screen.getByRole('button', { name: /upload/i }).closest('form')?.querySelector('input[type="file"]');
    expect(fileInput).toHaveAttribute('accept', '.pdf');
  });

  it('displays form title', () => {
    render(<PDFUploadForm />);
    
    const title = screen.getByText(/upload pdf/i);
    expect(title).toBeInTheDocument();
  });
});
