
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { useCortex } from '../../context/CortexContext';
import { apiService } from '../../services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const CortexChatModal: React.FC = () => {
  const { isChatOpen, activeChat, closeChat } = useCortex();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const markdownStyles = `
    .markdown-body {
      font-size: 14px;
      line-height: 1.6;
    }
    .markdown-body p { margin-bottom: 12px; }
    .markdown-body p:last-child { margin-bottom: 0; }
    .markdown-body strong { font-weight: 900; color: inherit; }
    .markdown-body ul, .markdown-body ol { margin-bottom: 12px; padding-left: 20px; }
    .markdown-body li { margin-bottom: 4px; }
    .markdown-body h1, .markdown-body h2, .markdown-body h3 { 
      font-weight: 800; 
      margin-top: 16px; 
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: 12px;
    }
  `;

  useEffect(() => {
    if (isChatOpen && activeChat) {
      fetchHistory();
    } else {
      setMessages([]);
    }
  }, [isChatOpen, activeChat]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchHistory = async () => {
    if (!activeChat) return;
    setFetchingHistory(true);
    try {
      const res = await apiService.ai.getUsecaseChat(
        activeChat.sourceType,
        activeChat.documentId,
        activeChat.usecaseId
      );
      if (res.success && Array.isArray(res.messages)) {
        setMessages(res.messages);
      }
    } catch (err) {
      console.error("Failed to fetch chat history", err);
    } finally {
      setFetchingHistory(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeChat || loading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await apiService.ai.askUsecase({
        question: userMessage.content,
        sourceType: activeChat.sourceType,
        documentId: activeChat.documentId,
        usecaseId: activeChat.usecaseId
      });

      if (res.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: res.answer }]);
      }
    } catch (err: any) {
      console.error("Failed to send message", err);
      if (err.status === 404) {
        alert("the usecase id was not found");
      }
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error processing your request. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isChatOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8">
          <style>{markdownStyles}</style>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeChat}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl h-full md:h-[80vh] bg-white rounded-none md:rounded-[40px] shadow-2xl flex flex-col overflow-hidden border border-gray-100"
          >
            {/* Header */}
            <div className="p-4 md:p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-[#9d7bb0] to-[#8b6aa1] text-white flex items-center justify-center shadow-lg shadow-purple-100">
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base md:text-lg font-black text-gray-900 tracking-tight">Ask Avagama</h3>
                  <p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate max-w-[150px] md:max-w-[200px]">
                    {activeChat?.title || 'Scoped Assistant'}
                  </p>
                </div>
              </div>
              <button 
                onClick={closeChat}
                className="w-8 h-8 md:w-10 md:h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6 scroll-smooth"
            >
              {fetchingHistory ? (
                <div className="h-full flex items-center justify-center">
                  <div className="w-8 h-8 border-3 border-purple-50 border-t-purple-400 rounded-full animate-spin"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                  <div className="text-3xl md:text-4xl">💬</div>
                  <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-gray-400">No conversation history</p>
                  <p className="text-[9px] md:text-[10px] max-w-[200px]">Ask me anything about this specific use case.</p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div 
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[90%] md:max-w-[85%] p-4 md:p-5 rounded-[20px] md:rounded-[24px] text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-[#9d7bb0] text-white rounded-tr-none shadow-lg shadow-purple-100' 
                        : 'bg-gray-50 text-gray-700 border border-gray-100 rounded-tl-none'
                    }`}>
                      <div className="markdown-body">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-50 p-4 md:p-5 rounded-[20px] md:rounded-[24px] rounded-tl-none border border-gray-100 flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 md:p-8 bg-white border-t border-gray-50">
              <form onSubmit={handleSend} className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about this use case..."
                  className="w-full pl-5 md:pl-6 pr-14 md:pr-16 py-3 md:py-4 bg-gray-50 border border-gray-100 rounded-[16px] md:rounded-[20px] outline-none focus:border-[#9d7bb0] focus:bg-white transition-all text-sm font-medium"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="absolute right-1.5 md:right-2 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-[#9d7bb0] text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-purple-100 hover:bg-[#8b6aa1] transition-all disabled:bg-gray-200 disabled:shadow-none"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9-7-9-7V19z" />
                  </svg>
                </button>
              </form>
              <p className="text-[8px] md:text-[9px] text-center text-gray-400 mt-3 md:mt-4 font-bold uppercase tracking-widest">
                Powered by Avagama AI
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CortexChatModal;
