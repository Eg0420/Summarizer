import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QAChat from './QAChat';

// Mock fetch
global.fetch = jest.fn();

describe('QAChat Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders chat interface', () => {
    render(<QAChat documentId="test-id" />);
    
    expect(screen.getByPlaceholderText('Ask a question...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('displays initial message', () => {
    render(<QAChat documentId="test-id" />);
    
    expect(screen.getByText('Ask a question about the document...')).toBeInTheDocument();
  });

  it('sends question and displays answer', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        answer: 'This is the answer.',
        sources: [{ chunkId: 0, text: 'Source text' }],
        tokensUsed: 100,
      }),
    });

    render(<QAChat documentId="test-id" />);

    const input = screen.getByPlaceholderText('Ask a question...');
    const button = screen.getByRole('button', { name: /send/i });

    await userEvent.type(input, 'What is AI?');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('What is AI?')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('This is the answer.')).toBeInTheDocument();
    });
  });

  it('disables send button while loading', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({
        json: async () => ({ answer: 'Answer', sources: [] }),
      }), 100))
    );

    render(<QAChat documentId="test-id" />);

    const input = screen.getByPlaceholderText('Ask a question...');
    const button = screen.getByRole('button', { name: /send/i });

    await userEvent.type(input, 'Question?');
    fireEvent.click(button);

    // Button should be disabled while loading
    expect(button).toBeDisabled();
  });
});
