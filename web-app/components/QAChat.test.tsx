/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as tokenTracking from '../lib/token-tracking';
import QAChat from './QAChat';

// Mock fetch
global.fetch = jest.fn();

// Mock token tracking
jest.mock('../lib/token-tracking', () => ({
  getRemainingQuota: jest.fn(() => ({
    questionsRemaining: 20,
    pdfsRemaining: 5,
    tokensUsed: 0,
  })),
}));

describe('QAChat Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (tokenTracking.getRemainingQuota as jest.Mock).mockReturnValue({
      questionsRemaining: 20,
      pdfsRemaining: 5,
      tokensUsed: 0,
    });
  });

  it('renders chat interface', () => {
    render(<QAChat documentId="test-id" />);
    
    expect(screen.getByPlaceholderText('Ask a question...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('displays initial message', () => {
    render(<QAChat documentId="test-id" />);
    
    expect(
      screen.getByText('Ask a question about the document...')
    ).toBeInTheDocument();
  });

  it('displays token usage and quota', () => {
    render(<QAChat documentId="test-id" />);
    
    expect(screen.getByText(/Tokens used:/)).toBeInTheDocument();
    expect(screen.getByText(/Questions remaining:/)).toBeInTheDocument();
  });

  it('sends question and displays answer', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
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
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('What is AI?')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('This is the answer.')).toBeInTheDocument();
    });
  });

  it('disables send button while loading', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                status: 200,
                json: async () => ({
                  answer: 'Answer',
                  sources: [],
                }),
              }),
            100
          )
        )
    );

    render(<QAChat documentId="test-id" />);

    const input = screen.getByPlaceholderText('Ask a question...');
    const button = screen.getByRole('button', { name: /send/i });

    await userEvent.type(input, 'Question?');
    await userEvent.click(button);

    expect(button).toBeDisabled();
  });

  it('shows rate limit error when no questions remain', async () => {
    (tokenTracking.getRemainingQuota as jest.Mock).mockReturnValue({
      questionsRemaining: 0,
      pdfsRemaining: 5,
      tokensUsed: 500,
    });

    render(<QAChat documentId="test-id" />);

    const input = screen.getByPlaceholderText('Ask a question...');
    const button = screen.getByRole('button', { name: /send/i });

    await userEvent.type(input, 'Question?');
    await userEvent.click(button);

    expect(global.fetch).not.toHaveBeenCalled();

    expect(
      screen.getByText('Question limit reached for this session')
    ).toBeInTheDocument();
  });

  it('handles API rate limit error (429)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({
        error: 'Rate limit exceeded: Maximum 20 questions per session',
      }),
    });

    render(<QAChat documentId="test-id" />);

    const input = screen.getByPlaceholderText('Ask a question...');
    const button = screen.getByRole('button', { name: /send/i });

    await userEvent.type(input, 'Question?');
    await userEvent.click(button);

    // Should have multiple matches (header + message), which is fine
    await waitFor(() => {
      expect(screen.getAllByText(/Rate limit exceeded/i).length).toBeGreaterThanOrEqual(1);
    });
  });
});