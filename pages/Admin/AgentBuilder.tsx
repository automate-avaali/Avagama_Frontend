import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import { apiService } from '../../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  Save, 
  MessageSquare, 
  Settings, 
  History, 
  Send, 
  Paperclip, 
  RefreshCw, 
  ChevronRight,
  User,
  BrainCircuit,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  Clock,
  RotateCcw,
  Copy,
  Terminal,
  Info,
  Sparkles,
  ShieldAlert,
  Zap,
  Wrench,
  Layout,
  Plus,
  Play,
  Cloud,
  ExternalLink,
  Trash2,
  Sliders,
  Eye,
  FileUp
} from 'lucide-react';

interface Agent {
  _id: string;
  name: string;
  description: string;
  system_prompt: string;
  model: string;
  temperature: number;
  top_p: number;
  version: number;
  active_version: number;
  status: string;
  provider: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  file?: string;
}

interface HistoryItem {
  version: number;
  system_prompt: string;
  feedback: string;
  is_active: boolean;
}

const AgentBuilder: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  
  const type = queryParams.get('type');
  const entityId = queryParams.get('entityId');
  const usecaseId = queryParams.get('usecaseId');
  const agentId = queryParams.get('agentId');

  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [feedback, setFeedback] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeDimension, setActiveDimension] = useState(0);
  const [rightPanel, setRightPanel] = useState<'chat' | 'history' | 'none'>('chat');

  const initializedParamsRef = useRef<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBack = () => {
    if (type === 'evaluation') {
      navigate(`/results/${entityId}`);
    } else if (type === 'company' || type === 'domain') {
      navigate(`/discovery/detail/${entityId}?type=${type}`);
    } else {
      navigate(-1);
    }
  };

  const dimensions = [
    { name: "Decision intensity", icon: "M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2", color: "text-teal-400 bg-teal-50 border-teal-100" },
    { name: "Process volume", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "text-blue-400 bg-blue-50 border-blue-100" },
    { name: "Data structure", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", color: "text-purple-400 bg-purple-50 border-purple-100" },
    { name: "Process frequency", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-pink-400 bg-pink-50 border-pink-100" },
    { name: "Context awareness", icon: "M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-indigo-400 bg-indigo-50 border-indigo-100" },
    { name: "Risk tolerance", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", color: "text-rose-400 bg-rose-50 border-rose-100" },
    { name: "Exception handling", icon: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-orange-400 bg-orange-50 border-orange-100" },
    { name: "Compliance sensitivity", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", color: "text-violet-400 bg-violet-50 border-violet-100" },
    { name: "Knowledge intensity", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", color: "text-emerald-400 bg-emerald-50 border-emerald-100" },
    { name: "Orchestration complexity", icon: "M11 4a2 2 0 114 0v1a2 2 0 11-4 0V4zM4 11a2 2 0 114 0v1a2 2 0 11-4 0v-1zm10 0a2 2 0 114 0v1a2 2 0 11-4 0v-1z", color: "text-cyan-400 bg-cyan-50 border-cyan-100" },
  ];

  useEffect(() => {
    const currentParams = `${type}-${entityId}-${usecaseId}-${agentId}`;
    if (initializedParamsRef.current === currentParams) return;

    if (!type || !entityId || !usecaseId) {
      setError('Missing required parameters (type, entityId, usecaseId)');
      setLoading(false);
      return;
    }

    initializedParamsRef.current = currentParams;
    createOrFetchAgents();
  }, [type, entityId, usecaseId, agentId]);

  useEffect(() => {
    let interval: number;
    if (loading) {
      interval = window.setInterval(() => {
        setActiveDimension((prev) => (prev + 1) % 10);
      }, 800);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const createOrFetchAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      if (agentId) {
        const res = await apiService.agents.get(agentId);
        if (res.success && res.agent) {
          setAgents([res.agent]);
          setSelectedAgent(res.agent);
        } else {
          setError(res.message || 'Failed to fetch agent details.');
        }
      } else {
        const res = await apiService.agents.create({ 
          type: type as any, 
          entityId: entityId as string, 
          usecaseId: usecaseId as string 
        });
        if (res.success && res.agents && res.agents.length > 0) {
          setAgents(res.agents);
          setSelectedAgent(res.agents[0]);
        } else {
          setError(res.message || 'No agents were returned from the server.');
        }
      }
    } catch (err: any) {
      console.error('Error creating agents:', err);
      setError(err.message || 'Failed to initialize agents.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputMessage.trim() && !selectedFile) || !selectedAgent || isChatting) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
      file: selectedFile?.name
    };

    setChatMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    const currentFile = selectedFile;
    setInputMessage('');
    setSelectedFile(null);
    setIsChatting(true);

    try {
      const res = await apiService.agents.chat(selectedAgent._id, currentInput, currentFile || undefined);
      const assistantMessage: Message = {
        role: 'assistant',
        content: res.response.response,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${err.message || 'Something went wrong while chatting.'}`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleRegenerate = async () => {
    if (!selectedAgent || !feedback.trim() || isRegenerating) return;

    setIsRegenerating(true);
    try {
      const res = await apiService.agents.regenerate(selectedAgent._id, feedback);
      if (res.success) {
        setSelectedAgent(res.agent);
        setAgents(prev => prev.map(a => a._id === res.agent._id ? res.agent : a));
        setFeedback('');
        if (rightPanel === 'history') fetchHistory();
        toast.success('Agent instructions refined');
      }
    } catch (err: any) {
      console.error('Regenerate error:', err);
      toast.error(`Failed to regenerate: ${err.message}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  const fetchHistory = async () => {
    if (!selectedAgent) return;
    setLoadingHistory(true);
    try {
      const res = await apiService.agents.getHistory(selectedAgent._id);
      if (res.success) {
        setHistory(res.history);
      }
    } catch (err: any) {
      console.error('History error:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRollback = async (version: number) => {
    if (!selectedAgent || isRollingBack) return;
    setIsRollingBack(true);
    const toastId = toast.loading(`Rolling back to v${version}...`);
    try {
      const res = await apiService.agents.rollback(selectedAgent._id, version);
      if (res.success && res.agent) {
        setSelectedAgent(res.agent);
        setAgents(prev => prev.map(a => a._id === res.agent._id ? res.agent : a));
        setChatMessages([]);
        setRightPanel('chat');
        toast.success(`Rolled back to v${version}`, { id: toastId });
        // Refresh history to update active state
        fetchHistory();
      } else {
        // Fallback to full refresh if response doesn't have agent
        initializedParamsRef.current = null;
        await createOrFetchAgents();
        setRightPanel('chat');
        toast.success(`Rolled back to v${version}`, { id: toastId });
      }
    } catch (err: any) {
      console.error('Rollback error:', err);
      toast.error(`Failed to rollback: ${err.message}`, { id: toastId });
    } finally {
      setIsRollingBack(false);
    }
  };

  const formatSystemPrompt = (text: string) => {
    if (!text) return '';
    
    // Main section headers
    const mainKeys = [
      'ROLE:', 'OBJECTIVE:', 'INPUT:', 'PROCESS:', 'CONSTRAINTS:', 'OUTPUT:', 
      'INSTRUCTIONS:', 'GUIDELINES:', 'EXAMPLES:', 'FORMAT:', 'CONTEXT:'
    ];
    
    // Sub-points and steps
    const subKeys = [
      'Step \\d+[:\\s-]*', 'Point \\d+[:\\s-]*', '\\d+\\.\\s'
    ];

    let formatted = text;

    // 1. Format main keys with double newlines
    mainKeys.forEach(key => {
      const regex = new RegExp(`\\s*(${key})`, 'g');
      formatted = formatted.replace(regex, '\n\n$1');
    });

    // 2. "After Step 1 - let the Point continue" -> Remove newlines immediately after sub-keys
    subKeys.forEach(key => {
      const regex = new RegExp(`(${key})\\s*\\n+`, 'g');
      formatted = formatted.replace(regex, '$1 ');
    });

    // 3. Format sub keys with single newlines, but only if they don't already have one
    subKeys.forEach(key => {
      // For "Step", "Point", and numbered points "1. ", we want a new line before them
      const regex = new RegExp(`([^\\n])(${key})`, 'g');
      formatted = formatted.replace(regex, '$1\n$2');
    });

    // Clean up multiple newlines
    formatted = formatted.replace(/\n{3,}/g, '\n\n').trim();

    return formatted;
  };

  const renderHighlightedPrompt = (text: string) => {
    const formatted = formatSystemPrompt(text);
    
    const mainKeysRegex = /(ROLE:|OBJECTIVE:|INPUT:|PROCESS:|CONSTRAINTS:|OUTPUT:|INSTRUCTIONS:|GUIDELINES:|EXAMPLES:|FORMAT:|CONTEXT:)/g;
    const subKeysRegex = /(Step \d+[:\s-]*|Point \d+[:\s-]*|\d+\.\s)/g;
    const boldRegex = /(\*\*.*?\*\*)/g;
    
    const combinedRegex = /(ROLE:|OBJECTIVE:|INPUT:|PROCESS:|CONSTRAINTS:|OUTPUT:|INSTRUCTIONS:|GUIDELINES:|EXAMPLES:|FORMAT:|CONTEXT:|Step \d+[:\s-]*|Point \d+[:\s-]*|\d+\.\s|\*\*.*?\*\*)/g;
    
    const parts = formatted.split(combinedRegex);

    return parts.map((part, i) => {
      if (!part) return null;

      // Check if it's a main key
      mainKeysRegex.lastIndex = 0;
      if (mainKeysRegex.test(part)) {
        return (
          <span key={i} className="text-[#a26da8] font-black uppercase tracking-wider block mt-8 mb-4 border-l-4 border-[#a26da8] pl-4 bg-[#a26da8]/5 py-2.5 rounded-r-xl shadow-sm">
            {part}
          </span>
        );
      }

      // Check if it's a sub key
      subKeysRegex.lastIndex = 0;
      if (subKeysRegex.test(part)) {
        return (
          <span key={i} className="text-gray-900 font-bold inline">
            {part}
          </span>
        );
      }

      // Check if it's bold text
      boldRegex.lastIndex = 0;
      if (boldRegex.test(part)) {
        return (
          <span key={i} className="font-black text-gray-900 inline">
            {part.replace(/\*\*/g, '')}
          </span>
        );
      }

      // Don't render just newlines as spans to avoid extra spacing
      if (part.trim() === '' && (part.includes('\n'))) {
        return part;
      }
      
      return (
        <span key={i} className="text-slate-600 leading-relaxed inline">
          {part}
        </span>
      );
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const renderMessageContent = (content: string) => {
    if (content.startsWith('Error in LLM generation:')) {
      const jsonMatch = content.match(/\{.*\}/);
      let errorMessage = content;
      if (jsonMatch) {
        try {
          const errorData = JSON.parse(jsonMatch[0]);
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
        } catch (e) {}
      }
      return (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3 items-start">
          <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-red-900">Generation Error</p>
            <p className="text-xs text-red-700 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      );
    }
    return (
      <div className="text-[14px] leading-relaxed font-medium text-gray-800 prose prose-sm max-w-none prose-strong:font-black prose-strong:text-gray-900 prose-ul:list-disc prose-ul:ml-4 prose-li:mt-1">
        <ReactMarkdown
          components={{
            strong: ({node, ...props}) => <strong className="font-black text-gray-900" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc ml-4 my-2" {...props} />,
            li: ({node, ...props}) => <li className="mt-1" {...props} />,
            p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  if (loading) {
    return createPortal(
      <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center p-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#a26da8]/5 via-white to-amber-50/10" />
        
        {/* Animated background patterns */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(#a26da8 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative w-full max-w-[700px] aspect-square flex items-center justify-center">
          {/* Central Core */}
          <div className="text-center z-10 relative">
             <motion.div 
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="relative mb-8 inline-block"
             >
               <div className="w-32 h-32 bg-white rounded-[40px] shadow-2xl border border-[#a26da8]/10 flex items-center justify-center relative z-10 overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-br from-[#a26da8]/10 to-transparent animate-pulse" />
                 <BrainCircuit className="w-16 h-16 text-[#a26da8] relative z-20" />
               </div>
               
               {/* Floating Sparkles */}
               <motion.div 
                 animate={{ y: [0, -10, 0], rotate: [0, 15, 0] }}
                 transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                 className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-2xl shadow-xl border border-gray-100 flex items-center justify-center z-20"
               >
                 <Sparkles className="w-6 h-6 text-amber-500" />
               </motion.div>

               {/* Orbital Rings */}
               <div className="absolute inset-[-20px] border border-[#a26da8]/10 rounded-full animate-[spin_10s_linear_infinite]" />
               <div className="absolute inset-[-40px] border border-[#a26da8]/5 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
             </motion.div>

             <div className="space-y-3">
               <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">
                 {agentId ? 'OPENING AGENT BUILDER' : 'CREATING AGENTS'}
               </h2>
               {!agentId && (
                 <div className="flex items-center justify-center gap-3">
                   <div className="h-[1px] w-12 bg-gray-200" />
                   <p className="text-xl font-bold text-[#a26da8] tracking-[0.2em] uppercase">FOR YOU</p>
                   <div className="h-[1px] w-12 bg-gray-200" />
                 </div>
               )}
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] animate-pulse mt-4">Synchronizing Neural Repository</p>
             </div>
          </div>

          {/* Outer Dimensions Orbit */}
          {dimensions.map((dim, i) => {
            const angle = (i * 36) * (Math.PI / 180);
            const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
            const radius = isMobile ? 140 : 260;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const isActive = i === activeDimension;
            
            return (
              <motion.div 
                key={i}
                initial={false}
                animate={{ 
                  x, 
                  y,
                  opacity: isActive ? 1 : 0.3,
                  scale: isActive ? 1.1 : 0.9,
                }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                className="absolute flex flex-col items-center gap-3"
              >
                <div className={`w-16 h-16 rounded-3xl border-2 flex items-center justify-center shadow-xl transition-all duration-500 ${dim.color} ${isActive ? 'ring-4 ring-[#a26da8]/10 -translate-y-2' : ''}`}>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={dim.icon} />
                  </svg>
                </div>
                <p className={`text-[9px] font-black uppercase tracking-tighter text-center max-w-[90px] leading-tight transition-colors ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                  {dim.name}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>,
      document.body
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <button onClick={() => navigate(-1)} className="w-full py-4 bg-[#a26da8] text-white font-bold rounded-2xl hover:bg-[#8e5c94] transition-all">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="min-h-16 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 sm:py-0 shrink-0 bg-white z-20 gap-4">
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-[1px] bg-gray-200 mx-1 sm:mx-2" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-lg font-black text-gray-900 tracking-tight uppercase truncate">{selectedAgent?.name || 'Agent Builder'}</h1>
              <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border border-green-100 flex items-center gap-1 shrink-0">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">
              {type} • {usecaseId?.slice(-6)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
          <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
            {agents.map((agent, idx) => (
              <button
                key={agent._id}
                onClick={() => {
                  setSelectedAgent(agent);
                  setChatMessages([]);
                }}
                className={`px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
                  selectedAgent?._id === agent._id ? 'bg-white text-[#a26da8] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Agent {idx + 1}
              </button>
            ))}
          </div>
          <div className="h-6 w-[1px] bg-gray-200 mx-1 sm:mx-2 shrink-0" />
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => setRightPanel(rightPanel === 'chat' ? 'none' : 'chat')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
                rightPanel === 'chat' ? 'bg-[#a26da8] text-white shadow-lg shadow-[#a26da8]/20' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Test
            </button>
            <button 
              onClick={() => {
                setRightPanel(rightPanel === 'history' ? 'none' : 'history');
                if (rightPanel !== 'history') fetchHistory();
              }}
              className={`p-2 rounded-xl transition-all ${rightPanel === 'history' ? 'bg-[#a26da8] text-white' : 'hover:bg-gray-100 text-gray-500'}`}
              title="Version History"
            >
              <History className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-gray-900 text-white rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-black/10">
              <Cloud className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Deploy
            </button>
          </div>
        </div>
      </header>

      <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar: Configuration */}
        <aside className="w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col bg-white overflow-y-auto custom-scrollbar shrink-0 max-h-[40vh] lg:max-h-none">
          <div className="p-6 sm:p-8 space-y-8 sm:space-y-10">
            <section>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 sm:mb-6">Agent Identity</label>
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 uppercase mb-2 ml-1">Name</label>
                  <input 
                    type="text" 
                    value={selectedAgent?.name || ''} 
                    readOnly
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-xs font-bold text-gray-900 focus:bg-white transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 uppercase mb-2 ml-1">Description</label>
                  <textarea 
                    value={selectedAgent?.description || ''} 
                    readOnly
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-xs font-medium text-gray-600 h-24 sm:h-32 resize-none focus:bg-white transition-all shadow-sm leading-relaxed"
                  />
                </div>
              </div>
            </section>

            <section className="pt-6 sm:pt-8 border-t border-gray-50">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Neural Refinement</label>
                <Sparkles className="w-4 h-4 text-[#a26da8]" />
              </div>
              <textarea 
                placeholder="Describe how to improve this agent's behavior..."
                className="w-full h-40 sm:h-56 bg-gray-50 border border-gray-100 rounded-[24px] sm:rounded-[32px] p-4 sm:p-6 text-xs font-medium text-gray-700 leading-relaxed focus:bg-white focus:ring-8 focus:ring-[#a26da8]/5 focus:border-[#a26da8] transition-all resize-none shadow-sm"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
              <button 
                onClick={handleRegenerate}
                disabled={!feedback.trim() || isRegenerating}
                className="w-full mt-4 sm:mt-6 py-4 sm:py-5 bg-[#a26da8] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#8e5c94] transition-all shadow-xl shadow-[#a26da8]/20 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
              >
                {isRegenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Regenerate Instructions
              </button>
            </section>
          </div>
        </aside>

        {/* Main Content: System Prompt Editor */}
        <main className="flex-grow flex flex-col bg-[#fcfcfd] overflow-hidden min-h-0">
          <div className="flex-grow flex flex-col p-4 sm:p-8 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#a26da8]/5 flex items-center justify-center">
                  <Terminal className="w-4 h-4 sm:w-5 sm:h-5 text-[#a26da8]" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-lg font-black text-gray-900 uppercase tracking-tight">System Prompt</h2>
                  <p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">Core Neural Instructions</p>
                </div>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <span className="text-[8px] sm:text-[10px] font-black text-gray-400 bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:xl border border-gray-100 shadow-sm">
                  {(selectedAgent?.system_prompt || '').length} Characters
                </span>
                <button 
                  onClick={() => copyToClipboard(selectedAgent?.system_prompt || '')}
                  className="p-2 sm:p-2.5 bg-white border border-gray-100 rounded-lg sm:rounded-xl shadow-sm text-gray-400 hover:text-[#a26da8] transition-all"
                  title="Copy Prompt"
                >
                  <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            <div className="flex-grow relative group min-h-0">
              <div className="w-full h-full bg-white border border-gray-100 rounded-[24px] sm:rounded-[32px] p-6 sm:p-10 text-[12px] sm:text-[14px] font-mono leading-relaxed overflow-y-auto custom-scrollbar shadow-2xl shadow-[#a26da8]/5">
                <div className="max-w-4xl mx-auto whitespace-pre-wrap">
                  {renderHighlightedPrompt(selectedAgent?.system_prompt || '')}
                </div>
              </div>
              <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 flex items-center gap-2 bg-white/90 backdrop-blur px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full border border-gray-100 shadow-2xl opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all transform translate-y-0 sm:translate-y-2 sm:group-hover:translate-y-0">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest">v{selectedAgent?.version || 1} Active Neural State</span>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 flex items-center gap-3 sm:gap-4 text-[8px] sm:text-[10px] font-medium text-gray-400 leading-relaxed max-w-2xl">
              <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <p>The system prompt defines the agent's identity, behavior, and constraints. Use the Neural Refinement tool in the sidebar to modify these instructions through natural language feedback.</p>
            </div>
          </div>
        </main>

        {/* Right Sidebar: Chat / History */}
        <AnimatePresence mode="wait">
          {rightPanel !== 'none' && (
            <motion.aside 
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 200 }}
              className="fixed inset-0 lg:relative lg:w-[550px] lg:inset-auto border-l border-gray-100 bg-white shadow-2xl z-[30] flex flex-col overflow-hidden shrink-0"
            >
              {rightPanel === 'history' ? (
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <History className="w-5 h-5 text-[#a26da8]" />
                      Version History
                    </h2>
                    <button onClick={() => setRightPanel('none')} className="p-2 hover:bg-gray-100 rounded-xl">
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                  <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {loadingHistory ? (
                      <div className="flex flex-col items-center justify-center h-full py-20">
                        <div className="w-12 h-12 border-4 border-[#a26da8]/10 border-t-[#a26da8] rounded-full animate-spin mb-4" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Retrieving History...</p>
                      </div>
                    ) : history.length > 0 ? (
                      history.map((item, idx) => {
                        const displayFeedback = idx < history.length - 1 ? history[idx + 1].feedback : 'Initial version';
                        return (
                          <div key={item.version} className="bg-gray-50 rounded-3xl p-6 border border-gray-100 relative group transition-all hover:shadow-md">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <span className="bg-white px-3 py-1 rounded-full text-xs font-bold text-[#a26da8] shadow-sm border border-gray-100">v{item.version}</span>
                                {item.is_active && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-green-200">Active</span>}
                              </div>
                              {!item.is_active && (
                                <button 
                                  onClick={() => handleRollback(item.version)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#a26da8]/10 text-[#a26da8] rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-[#a26da8] hover:text-white transition-all shadow-sm"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  Rollback
                                </button>
                              )}
                            </div>
                            <div className="space-y-4">
                              <div className="bg-white/50 rounded-2xl p-4 border border-gray-100">
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Feedback</label>
                                <p className="text-sm text-gray-700 italic font-medium leading-relaxed">{displayFeedback}</p>
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Prompt Snippet</label>
                                <div className="bg-white rounded-2xl p-6 text-[11px] font-mono leading-relaxed border border-gray-100 shadow-sm max-h-60 overflow-y-auto custom-scrollbar">
                                  {renderHighlightedPrompt(item.system_prompt)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-20 text-gray-400">
                        <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No version history available yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Play className="w-5 h-5 text-[#a26da8]" />
                      Test Agent
                    </h2>
                    <button onClick={() => setRightPanel('none')} className="p-2 hover:bg-gray-100 rounded-xl">
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                  <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center px-4">
                        <div className="relative mb-8">
                          <div className="w-20 h-20 bg-[#a26da8]/10 rounded-[28px] flex items-center justify-center relative z-10 overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#a26da8]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <BrainCircuit className="w-10 h-10 text-[#a26da8] relative z-20" />
                          </div>
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-xl shadow-lg border border-gray-100 flex items-center justify-center animate-bounce">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                          </div>
                          <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-[#a26da8]/5 rounded-full blur-xl animate-pulse" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-3 uppercase tracking-tight">Neural Core Ready</h3>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-[280px]">
                          Your agent is configured and ready for validation. Send a message or upload a document to begin testing.
                        </p>
                      </div>
                    ) : (
                      chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-3 sm:gap-4 ${msg.role === 'assistant' ? 'bg-gray-50 -mx-4 sm:-mx-6 px-4 sm:px-6 py-6 sm:py-8 border-y border-gray-100/50' : ''}`}>
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl shrink-0 flex items-center justify-center relative ${msg.role === 'user' ? 'bg-gray-100 text-gray-500' : 'bg-[#a26da8] text-white shadow-lg shadow-[#a26da8]/20'}`}>
                            {msg.role === 'user' ? <User className="w-4 h-4 sm:w-5 sm:h-5" /> : (
                              <>
                                <BrainCircuit className="w-5 h-5" />
                                <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-amber-300" />
                              </>
                            )}
                          </div>
                          <div className="flex-grow space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{msg.role === 'user' ? 'You' : selectedAgent?.name}</span>
                            </div>
                            {msg.file && (
                              <div className="flex items-center gap-2 bg-white/50 border border-gray-100 rounded-lg px-3 py-1.5 w-fit mb-2">
                                <FileText className="w-3 h-3 text-[#a26da8]" />
                                <span className="text-[10px] font-bold text-gray-600">{msg.file}</span>
                              </div>
                            )}
                            {renderMessageContent(msg.content)}
                          </div>
                        </div>
                      ))
                    )}
                    {isChatting && (
                      <div className="flex gap-3 sm:gap-4 py-4 sm:py-6">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl shrink-0 flex items-center justify-center bg-[#a26da8] text-white shadow-lg shadow-[#a26da8]/20 relative">
                          <BrainCircuit className="w-4 h-4 sm:w-5 sm:h-5" />
                          <Sparkles className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 h-3 text-amber-300 animate-pulse" />
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-gray-100">
                          <div className="w-1.5 h-1.5 bg-[#a26da8] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1.5 h-1.5 bg-[#a26da8] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-1.5 h-1.5 bg-[#a26da8] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-4 sm:p-6 border-t border-gray-100 space-y-3 sm:space-y-4">
                    {selectedFile && (
                      <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#a26da8]" />
                          <span className="text-[10px] sm:text-[11px] font-bold text-gray-700 truncate max-w-[150px] sm:max-w-[200px]">{selectedFile.name}</span>
                        </div>
                        <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                          <X className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    )}
                    <form onSubmit={handleSendMessage} className="relative flex items-center gap-2 sm:gap-3">
                      <input 
                        type="file"
                        key={selectedFile ? 'has-file' : 'no-file'}
                        ref={fileInputRef}
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setSelectedFile(file);
                        }}
                      />
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all border ${
                          selectedFile 
                            ? 'bg-[#a26da8] text-white border-[#a26da8] shadow-lg shadow-[#a26da8]/20' 
                            : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-[#a26da8] hover:bg-white'
                        }`}
                        title="Upload Document (PDF, DOC, DOCX)"
                      >
                        <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <div className="relative flex-grow">
                        <input 
                          type="text"
                          placeholder={selectedFile ? "Add a message..." : "Type a message..."}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-[11px] sm:text-xs font-medium focus:bg-white focus:ring-8 focus:ring-[#a26da8]/5 focus:border-[#a26da8] transition-all pr-12 sm:pr-14 shadow-sm"
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                        />
                        <button 
                          type="submit"
                          disabled={(!inputMessage.trim() && !selectedFile) || isChatting}
                          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 text-[#a26da8] hover:bg-[#a26da8]/10 rounded-lg sm:rounded-xl transition-all disabled:opacity-50 active:scale-90"
                        >
                          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AgentBuilder;
