// import React from 'react';
// import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// import userEvent from '@testing-library/user-event';
// import QAChat from './QAChat';
// import * as tokenTracking from '@/lib/token-tracking';

// // Mock fetch
// global.fetch = jest.fn();

// // Mock token tracking
// jest.mock('@/lib/token-tracking', () => ({
//   getRemainingQuota: jest.fn(() => ({
//     questionsRemaining: 20,
//     pdfsRemaining: 5,
//     tokensUsed: 0,
//   })),
// }));

// describe('QAChat Component', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//     (tokenTracking.getRemainingQuota as jest.Mock).mockReturnValue({
//       questionsRemaining: 20,
//       pdfsRemaining: 5,
//       tokensUsed: 0,
//     });
//   });

//   it('renders chat interface', () => {
//     render(<QAChat documentId="test-id" />);
    
//     expect(screen.getByPlaceholderText('Ask a question...')).toBeInTheDocument();
//     expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
//   });

//   it('displays initial message', () => {
//     render(<QAChat documentId="test-id" />);
    
//     expect(screen.getByText('Ask a question about the document...')).toBeInTheDocument();
//   });

//   it('displays token usage and quota', () => {
//     render(<QAChat documentId="test-id" />);
    
//     expect(screen.getByText(/Tokens used:/)).toBeInTheDocument();
//     expect(screen.getByText(/Questions remaining:/)).toBeInTheDocument();
//   });

//   it('sends question and displays answer', async () => {
//     (global.fetch as jest.Mock).mockResolvedValueOnce({
//       json: async () => ({
//         answer: 'This is the answer.',
//         sources: [{ chunkId: 0, text: 'Source text' }],
//         tokensUsed: 100,
//       }),
//       status: 200,
//     });

//     render(<QAChat documentId="test-id" />);

//     const input = screen.getByPlaceholderText('Ask a question...');
//     const button = screen.getByRole('button', { name: /send/i });

//     await userEvent.type(input, 'What is AI?');
//     fireEvent.click(button);

//     await waitFor(() => {
//       expect(screen.getByText('What is AI?')).toBeInTheDocument();
//     });

//     await waitFor(() => {
//       expect(screen.getByText('This is the answer.')).toBeInTheDocument();
//     });
//   });

//   it('disables send button while loading', async () => {
//     (global.fetch as jest.Mock).mockImplementationOnce(
//       () => new Promise((resolve) => setTimeout(() => resolve({
//         json: async () => ({ answer: 'Answer', sources: [] }),
//         status: 200,
//       }), 100))
//     );

//     render(<QAChat documentId="test-id" />);

//     const input = screen.getByPlaceholderText('Ask a question...');
//     const button = screen.getByRole('button', { name: /send/i });

//     await userEvent.type(input, 'Question?');
//     fireEvent.click(button);

//     // Button should be disabled while loading
//     expect(button).toBeDisabled();
//   });

//   it('shows rate limit error when no questions remain', async () => {
//     (tokenTracking.getRemainingQuota as jest.Mock).mockReturnValue({
//       questionsRemaining: 0,
//       pdfsRemaining: 5,
//       tokensUsed: 500,
//     });

//     render(<QAChat documentId="test-id" />);

//     const input = screen.getByPlaceholderText('Ask a question...');
//     const button = screen.getByRole('button', { name: /send/i });

//     await userEvent.type(input, 'Question?');
//     fireEvent.click(button);

//     // Should not have called fetch since rate limit was reached
//     expect(global.fetch).not.toHaveBeenCalled();
//     expect(screen.getByText('Question limit reached for this session')).toBeInTheDocument();
//   });

//   it('handles API rate limit error (429)', async () => {
//     (global.fetch as jest.Mock).mockResolvedValueOnce({
//       json: async () => ({
//         error: 'Rate limit exceeded: Maximum 20 questions per session',
//       }),
//       status: 429,
//     });

//     render(<QAChat documentId="test-id" />);

//     const input = screen.getByPlaceholderText('Ask a question...');
//     const button = screen.getByRole('button', { name: /send/i });

//     await userEvent.type(input, 'Question?');
//     fireEvent.click(button);

//     await waitFor(() => {
//       // Should have multiple matches (header + message), which is fine
//       expect(screen.getAllByText(/Rate limit exceeded/)).toHaveLength(2);
//     });
//   });
// });
