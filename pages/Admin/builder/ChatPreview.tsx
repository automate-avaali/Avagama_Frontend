
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Minimize2, Maximize2, RotateCcw, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiService } from '../../../services/api';
import toast from '../../../components/studio/notify';
import AgentMessage from '../../../components/AgentMessage';
import { GuardrailNote } from './GuardrailNote';

interface Message {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  citations?: any[];
  guardrails?: any;      // reply: what the AI Guardrails did (contract F.7)
  piiTypes?: string[];   // user message: personal data found in it
  piiAction?: string;    // mask | flag
}

interface ChatPreviewProps {
  agentId: string;
  agentName: string;
  status: string;
  isDirty?: boolean;
  onTurnComplete?: () => void;
}

const ChatPreview: React.FC<ChatPreviewProps> = ({ agentId, agentName, status, isDirty, onTurnComplete }) => {
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
        const raw = response.data.messages;
        setMessages(raw.map((m: any, i: number) => ({
          role: m.role === 'assistant' ? 'bot' : 'user',
          content: m.content,
          citations: m.citations,
          timestamp: new Date(m.ts || m.createdAt),
          guardrails: m.role === 'assistant' ? m.guardrail : undefined,
          piiTypes: m.role !== 'assistant' && m.pii_detected ? m.pii_types : undefined,
          piiAction: m.role !== 'assistant' ? raw[i + 1]?.guardrail?.pii?.action : undefined
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
          citations: response.data.citations,
          timestamp: new Date(),
          guardrails: response.data.guardrails
        };
        const pii = response.data.guardrails?.pii;
        setMessages(prev => {
          const next = [...prev];
          // Personal data was found in the message just sent — note it on that user message.
          if (pii?.detected?.length) {
            for (let i = next.length - 1; i >= 0; i--) {
              if (next[i].role === 'user') { next[i] = { ...next[i], piiTypes: pii.detected, piiAction: pii.action }; break; }
            }
          }
          return [...next, botMsg];
        });
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
        className="fixed bottom-8 right-28 w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all z-50 group"
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
        height: isMinimized ? '80px' : '640px',
        width: isMinimized ? '300px' : '500px'
      }}
      className="fixed bottom-8 right-28 bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col overflow-hidden z-50 transition-all duration-300"
    >
      {/* Header */}
      <div className={`shrink-0 px-4 py-2.5 flex items-center justify-between border-b border-slate-100 bg-white ${isMinimized ? 'h-full' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-[#a26da8]">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-slate-900">{agentName || 'Agent Preview'}</h3>
            <p className="text-[11.5px] font-semibold text-green-500 flex items-center gap-1.5 mt-0.5">
              <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
              Live Simulation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isMinimized && (
            <button 
              onClick={handleReset}
              className="p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-200"
              title="Reset Conversation"
            >
              <RotateCcw size={16} />
            </button>
          )}
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-200"
            title={isMinimized ? "Expand Preview" : "Minimize Preview"}
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-200"
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
            className="flex-1 overflow-y-auto p-4 space-y-5 bg-slate-50/60"
          >
            {(isDirty || agentId === 'new') ? (
              <div className="h-full flex flex-col items-center justify-center space-y-6 animate-fadeIn py-10">
                 <div className="w-20 h-20 bg-purple-50 rounded-xl flex items-center justify-center text-[#a26da8] shadow-sm ring-4 ring-white">
                    <Save size={32} className="opacity-80" />
                 </div>
                 <div className="text-center space-y-2 px-4">
                    <h4 className="text-sm font-semibold text-slate-900">Save first to test</h4>
                    <p className="text-[12.5px] font-medium text-slate-500 leading-loose max-w-[220px] mx-auto">
                      You have unsaved configuration changes. Please save your progress to test the updated agent logic.
                    </p>
                 </div>
               </div>
            ) : messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-[#a26da8]">
                  <Bot size={24} />
                </div>
                <p className="text-[13.5px] font-semibold text-slate-800">Start a conversation</p>
                <p className="mt-1 max-w-[260px] text-[12.5px] text-slate-500">Ask a question to test how your agent answers with its saved configuration.</p>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div 
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2.5 ${msg.role === 'user' ? 'max-w-[85%] flex-row-reverse' : 'max-w-[94%] flex-row'}`}>
                  <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${
                    msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white text-[#a26da8] border border-purple-50'
                  }`}>
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className="min-w-0">
                    <div className={`px-4 py-3 rounded-lg text-[13.5px] leading-relaxed break-words ${
                      msg.role === 'user'
                      ? 'bg-slate-900 text-white rounded-tr-none whitespace-pre-wrap'
                      : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none shadow-sm [&_strong]:!font-semibold [&_strong]:!text-slate-900 [&_li]:!my-0.5'
                    }`}>
                      {msg.role === 'user' ? (
                        msg.content
                      ) : (
                        <AgentMessage content={msg.content} citations={msg.citations} />
                      )}
                    </div>
                    <GuardrailNote guardrails={msg.guardrails} piiTypes={msg.piiTypes} piiAction={msg.piiAction} align={msg.role === 'user' ? 'right' : 'left'} />
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
                  <div className="px-5 py-2.5 bg-white border border-slate-100 rounded-lg rounded-tl-none flex items-center gap-2">
                    <span className="w-1 h-1 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1 h-1 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1 h-1 bg-slate-300 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={handleSend}
              className={`flex items-center gap-2 rounded-lg border pl-3 pr-1.5 py-1.5 transition-colors focus-within:border-[#a26da8] focus-within:ring-2 focus-within:ring-purple-100 ${
                agentId === 'new' || isDirty ? 'border-slate-200 bg-slate-50' : 'border-slate-300 bg-white'
              }`}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isDirty || agentId === 'new' ? "Please save to test..." : "Type your message..."}
                disabled={agentId === 'new' || isDirty}
                className="min-w-0 flex-1 border-0 bg-transparent py-1.5 text-[13.5px] text-slate-900 placeholder:text-slate-400 outline-none focus:ring-0 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading || agentId === 'new' || isDirty}
                title="Send"
                aria-label="Send message"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#a26da8] text-white transition-colors hover:bg-[#8e5a94] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
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
