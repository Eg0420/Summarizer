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

    // Rate limit check
    if (quota.questionsRemaining <= 0) {
      setError('Question limit reached for this session');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isUser: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/qa', {
        method: 'POST',
        body: JSON.stringify({
          documentId,
          question: input,
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
    } catch (err) {
      setError('Something went wrong.');
    } finally {
      setLoading(false);

      const quota = tokenTracking.getRemainingQuota();
      setTokensUsed(quota.tokensUsed);
      setQuestionsRemaining(quota.questionsRemaining);
    }
  };

  return (
    <div>
      <h2>Ask a question about the document...</h2>

      {/* Messages */}
      <div>
        {messages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.isUser ? 'You: ' : 'Bot: '}</strong>
            {msg.text}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && <div>{error}</div>}

      {/* Input */}
      <input
        placeholder="Ask a question..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button onClick={handleSend} disabled={loading}>
        Send
      </button>

      {/* Stats */}
      <div>Tokens used: {tokensUsed}</div>
      <div>Questions remaining: {questionsRemaining}</div>
    </div>
  );
};

export default QAChat;