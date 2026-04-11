// 'use client';

// import React, { useState, useRef, useEffect } from 'react';
// import { getRemainingQuota } from '@/lib/token-tracking';

// interface Message {
//   id: string;
//   role: 'user' | 'assistant';
//   content: string;
//   sources?: Array<{ chunkId: number; text: string }>;
// }

// export default function QAChat({ documentId }: { documentId: string }) {
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [input, setInput] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [tokensUsed, setTokensUsed] = useState(0);
//   const [questionsRemaining, setQuestionsRemaining] = useState(20);
//   const [rateLimitError, setRateLimitError] = useState('');
//   const endRef = useRef<HTMLDivElement>(null);

//   // Update quota display
//   useEffect(() => {
//     const quota = getRemainingQuota();
//     setTokensUsed(quota.tokensUsed);
//     setQuestionsRemaining(quota.questionsRemaining);
//   }, [messages]);

//   const scrollToBottom = () => {
//     if (endRef.current?.scrollIntoView) {
//       endRef.current.scrollIntoView({ behavior: 'smooth' });
//     }
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!input.trim() || loading) return;

//     // Check if rate limit will be exceeded
//     if (questionsRemaining <= 0) {
//       setRateLimitError('Question limit reached for this session');
//       return;
//     }

//     setRateLimitError('');

//     const userMessage: Message = {
//       id: Date.now().toString(),
//       role: 'user',
//       content: input,
//     };

//     setMessages((prev) => [...prev, userMessage]);
//     setInput('');
//     setLoading(true);

//     try {
//       const response = await fetch('/api/ask', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           documentId,
//           question: input,
//         }),
//       });

//       const data = await response.json();

//       if (response.status === 429) {
//         setRateLimitError(data.error || 'Rate limit exceeded');
//       }

//       const assistantMessage: Message = {
//         id: (Date.now() + 1).toString(),
//         role: 'assistant',
//         content: data.answer || data.error || 'Error generating answer',
//         sources: data.sources,
//       };

//       setMessages((prev) => [...prev, assistantMessage]);
//     } catch (error) {
//       const errorMessage: Message = {
//         id: (Date.now() + 1).toString(),
//         role: 'assistant',
//         content: 'Error connecting to server',
//       };
//       setMessages((prev) => [...prev, errorMessage]);
//     } finally {
//       setLoading(false);
//       // Update quota after request
//       const quota = getRemainingQuota();
//       setTokensUsed(quota.tokensUsed);
//       setQuestionsRemaining(quota.questionsRemaining);
//     }
//   };

//   return (
//     <div className="flex flex-col h-full border rounded-lg bg-white">
//       {/* Token usage header */}
//       <div className="bg-gray-50 border-b px-4 py-3 text-xs">
//         <div className="flex justify-between">
//           <span>Tokens used: <strong>{tokensUsed}</strong></span>
//           <span>Questions remaining: <strong>{questionsRemaining}</strong></span>
//         </div>
//         {rateLimitError && (
//           <div className="mt-2 text-red-600 font-semibold">
//             {rateLimitError}
//           </div>
//         )}
//       </div>

//       {/* Messages container */}
//       <div className="flex-1 overflow-y-auto p-4 space-y-4">
//         {messages.length === 0 && (
//           <div className="text-center text-gray-400 mt-8">
//             Ask a question about the document...
//           </div>
//         )}
//         {messages.map((msg) => (
//           <div
//             key={msg.id}
//             className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
//           >
//             <div
//               className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
//                 msg.role === 'user'
//                   ? 'bg-blue-600 text-white'
//                   : 'bg-gray-200 text-gray-900'
//               }`}
//             >
//               <p className="text-sm">{msg.content}</p>
//               {msg.sources && msg.sources.length > 0 && (
//                 <div className="mt-2 text-xs opacity-75">
//                   <p className="font-semibold">Sources:</p>
//                   {msg.sources.map((source) => (
//                     <p key={source.chunkId} className="truncate">
//                       Chunk {source.chunkId}: {source.text.substring(0, 50)}...
//                     </p>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         ))}
//         {loading && (
//           <div className="flex justify-start">
//             <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg">
//               <p className="text-sm">Thinking...</p>
//             </div>
//           </div>
//         )}
//         <div ref={endRef} />
//       </div>

//       {/* Input form */}
//       <form onSubmit={handleSubmit} className="border-t p-4 flex gap-2">
//         <input
//           type="text"
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           placeholder="Ask a question..."
//           disabled={loading}
//           className="flex-1 px-3 py-2 border rounded-lg outline-none disabled:bg-gray-100"
//         />
//         <button
//           type="submit"
//           disabled={loading || !input.trim()}
//           className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
//         >
//           Send
//         </button>
//       </form>
//     </div>
//   );
// }
