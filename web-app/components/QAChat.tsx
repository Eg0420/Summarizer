'use client';

import React, { useState, useEffect } from 'react';
import * as tokenTracking from '../lib/token-tracking';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

interface QAChatProps {
  documentId: string;
}

const QAChat = ({ documentId }: QAChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tokensUsed, setTokensUsed] = useState(0);
  const [questionsRemaining, setQuestionsRemaining] = useState(20);

  // Load quota info
  useEffect(() => {
    const quota = tokenTracking.getRemainingQuota();
    setTokensUsed(quota.tokensUsed);
    setQuestionsRemaining(quota.questionsRemaining);
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const quota = tokenTracking.getRemainingQuota();

    if (quota.questionsRemaining <= 0) {
      setError('Question limit reached for this session');
      return;
    }

    const question = input; // ✅ FIX: store before clearing

    const userMessage: Message = {
      id: Date.now().toString(),
      text: question,
      isUser: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/ask', { // ✅ FIXED ROUTE
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // ✅ IMPORTANT
        },
        body: JSON.stringify({
          documentId,
          question,
        }),
      });

      const data = await response.json();

      if (response.status === 429) {
        setError(data.error || 'Rate limit exceeded');
        return;
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.answer || 'No answer found.',
        isUser: false,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);

      const quota = tokenTracking.getRemainingQuota();
      setTokensUsed(quota.tokensUsed);
      setQuestionsRemaining(quota.questionsRemaining);
    }
  };

  return (
    <div className="mt-6 p-4 border rounded bg-white shadow">
      <h2 className="text-lg font-semibold mb-3">
        Ask a question about the document...
      </h2>

      {/* Messages */}
      <div className="space-y-2 max-h-60 overflow-y-auto mb-3">
        {messages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.isUser ? 'You: ' : 'Bot: '}</strong>
            {msg.text}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && <div className="text-red-500 mb-2">{error}</div>}

      {/* Input */}
      <input
        placeholder="Ask a question..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSend(); // ✅ ENTER SUPPORT
        }}
        className="w-full border p-2 mb-2"
      />

      <button
        onClick={handleSend}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {loading ? 'Thinking...' : 'Send'}
      </button>

      {/* Stats */}
      <div className="mt-3 text-sm text-gray-600">
        Tokens used: {tokensUsed}
      </div>
      <div className="text-sm text-gray-600">
        Questions remaining: {questionsRemaining}
      </div>
    </div>
  );
};

export default QAChat;