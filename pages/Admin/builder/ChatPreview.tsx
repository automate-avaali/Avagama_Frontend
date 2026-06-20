
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Minimize2, Maximize2, RotateCcw, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { apiService } from '../../../services/api';
import toast from 'react-hot-toast';

interface Message {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface ChatPreviewProps {
  agentId: string;
  status: string;
  isDirty?: boolean;
  onTurnComplete?: () => void;
}

const ChatPreview: React.FC<ChatPreviewProps> = ({ agentId, status, isDirty, onTurnComplete }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(`agent_chat_${agentId}`);
    if (saved && agentId !== 'new') {
      setSessionId(saved);
      fetchHistory(saved);
    } else {
      setMessages([]);
      setSessionId(null);
      setInput('');
      setLoading(false);
    }
  }, [agentId]);

  const fetchHistory = async (sid: string) => {
    setLoading(true);
    try {
      const response = await apiService.standalone.agents.conversations.get(agentId, sid);
      if (response.success && response.data.messages) {
        setMessages(response.data.messages.map((m: any) => ({
          role: m.role === 'assistant' ? 'bot' : 'user',
          content: m.content,
          timestamp: new Date(m.ts || m.createdAt)
        })));
      }
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading || !agentId || agentId === 'new' || isDirty) {
      if (agentId === 'new' || isDirty) toast.error('Save the agent first to test chat');
      return;
    }

    const userMsg: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await apiService.standalone.agents.testChat(agentId, { 
        message: input, 
        session_id: sessionId 
      });

      if (response.success) {
        const botMsg: Message = {
          role: 'bot',
          content: response.data.reply,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMsg]);
        if (response.data.session_id) {
          setSessionId(response.data.session_id);
          localStorage.setItem(`agent_chat_${agentId}`, response.data.session_id);
        }
        // Trigger spontaneous update for tools/actions usage
        onTurnComplete?.();
      }
    } catch (error) {
      toast.error('Failed to get a response from the agent');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setSessionId(null);
    localStorage.removeItem(`agent_chat_${agentId}`);
    toast.success('Chat history cleared');
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-28 w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-50 group"
        title="Open Agent Preview"
      >
        <Bot size={28} className="group-hover:rotate-12 transition-transform" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#a26da8] rounded-full border-2 border-white animate-pulse" />
      </button>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        height: isMinimized ? '80px' : '600px',
        width: isMinimized ? '300px' : '450px'
      }}
      className="fixed bottom-8 right-28 bg-white rounded-[32px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden z-50 transition-all duration-300"
    >
      {/* Header */}
      <div className={`shrink-0 px-6 py-4 flex items-center justify-between border-b border-gray-50 bg-white ${isMinimized ? 'h-full' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-[#a26da8]">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Agent Preview</h3>
            <p className="text-[9px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
              <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
              Live Simulation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isMinimized && (
            <button 
              onClick={handleReset}
              className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
              title="Reset Conversation"
            >
              <RotateCcw size={16} />
            </button>
          )}
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
            title={isMinimized ? "Expand Preview" : "Minimize Preview"}
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
            title="Close Preview"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      {!isMinimized && (
        <>
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#fafafa]"
          >
            {(isDirty || agentId === 'new') ? (
              <div className="h-full flex flex-col items-center justify-center space-y-6 animate-fadeIn py-10">
                 <div className="w-20 h-20 bg-purple-50 rounded-[28px] flex items-center justify-center text-[#a26da8] shadow-sm ring-4 ring-white">
                    <Save size={32} className="opacity-80" />
                 </div>
                 <div className="text-center space-y-2 px-6">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Save first to test</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose max-w-[220px] mx-auto">
                      You have unsaved configuration changes. Please save your progress to test the updated agent logic.
                    </p>
                 </div>
               </div>
            ) : messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-40 grayscale mt-10">
                <Bot size={48} className="mb-4 text-gray-300" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center max-w-[200px] leading-loose">
                  Start a conversation to test your agent logic
                </p>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div 
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${
                    msg.role === 'user' ? 'bg-gray-900 text-white' : 'bg-white text-[#a26da8] border border-purple-50'
                  }`}>
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className={`px-5 py-3.5 rounded-2xl text-[11px] font-bold leading-relaxed shadow-sm break-words whitespace-pre-wrap ${
                    msg.role === 'user' 
                    ? 'bg-gray-900 text-white rounded-tr-none' 
                    : 'bg-white text-gray-600 border border-gray-50 rounded-tl-none'
                  }`}>
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <div className="max-w-none overflow-x-auto">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            table: ({node, ...props}) => (
                              <div className="my-4 overflow-x-auto rounded-xl border border-gray-100 min-w-full">
                                <table className="min-w-full border-collapse" {...props} />
                              </div>
                            ),
                            thead: ({node, ...props}) => <thead className="bg-gray-50/50" {...props} />,
                            th: ({node, ...props}) => <th className="px-3 py-2 text-left border-b border-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-400 whitespace-nowrap" {...props} />,
                            td: ({node, ...props}) => <td className="px-3 py-2 border-b border-gray-50 text-[10px] font-bold text-gray-600" {...props} />,
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0 break-words" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-black text-gray-900" {...props} />,
                            em: ({node, ...props}) => <strong className="font-black text-gray-900" {...props} />,
                            a: ({node, ...props}) => <a className="text-[#a26da8] hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc ml-4 space-y-1 my-2" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal ml-4 space-y-1 my-2" {...props} />,
                            li: ({node, ...props}) => <li className="pl-1 break-words" {...props} />,
                            hr: ({node, ...props}) => <hr className="my-4 border-gray-100" {...props} />,
                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-purple-100 pl-4 py-1 my-4 italic text-gray-400" {...props} />
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start animate-fadeIn">
                <div className="flex gap-3 max-w-[85%] flex-row">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-white text-[#a26da8] border border-purple-50 flex items-center justify-center">
                    <Loader2 size={14} className="animate-spin" />
                  </div>
                  <div className="px-5 py-3.5 bg-white border border-gray-50 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <span className="w-1 h-1 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1 h-1 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1 h-1 bg-gray-300 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-6 bg-white border-t border-gray-50">
            <form 
              onSubmit={handleSend}
              className="relative"
            >
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isDirty || agentId === 'new' ? "Please save to test..." : "Type your message..."}
                disabled={agentId === 'new' || isDirty}
                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-[11px] font-bold text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-purple-100 transition-all pr-14"
              />
              <button 
                type="submit"
                disabled={!input.trim() || loading || agentId === 'new' || isDirty}
                className="absolute right-2 top-2 w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-gray-200"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default ChatPreview;
