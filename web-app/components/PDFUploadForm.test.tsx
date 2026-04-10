import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PDFUploadForm from './PDFUploadForm';

describe('PDFUploadForm', () => {
  it('has file input that accepts PDF only', () => {
    render(<PDFUploadForm />);
    
    const fileInput = screen.getByTestId('pdf-file-input');
    expect(fileInput).toHaveAttribute('accept', '.pdf');
  });

  it('renders the drop zone for selecting a PDF', () => {
    render(<PDFUploadForm />);
    
    expect(screen.getByTestId('pdf-drop-zone')).toBeInTheDocument();
  });
});
