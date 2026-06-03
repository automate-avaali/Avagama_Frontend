
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { apiService } from '../../../services/api';
import { 
  MessageSquare, 
  Search, 
  Trash2, 
  Tag, 
  Clock, 
  User, 
  Bot, 
  ArrowRight, 
  Calendar,
  Filter,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface HistoryTabProps {
  agentId: string;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ agentId }) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    if (agentId !== 'new') fetchSessions();
  }, [agentId]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await apiService.standalone.agents.conversations.list(agentId);
      if (response.success) setSessions(response.data);
    } catch (error) {
      toast.error('Failed to load conversation logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    setLoadingMessages(true);
    try {
      const response = await apiService.standalone.agents.conversations.get(agentId, sessionId);
      if (response.success) {
        setSelectedSession(response.data);
        setMessages(response.data.messages || []);
      }
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    try {
      await apiService.standalone.agents.conversations.delete(agentId, sessionId);
      toast.success('Log entry deleted');
      if (selectedSession?._id === sessionId) {
        setSelectedSession(null);
        setMessages([]);
      }
      fetchSessions();
    } catch (error) {
      toast.error('Failed to delete log');
    }
  };

  if (agentId === 'new') {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-6">
          <MessageSquare size={32} />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">No History Yet</h3>
        <p className="text-gray-500 font-medium max-w-sm">Conversation logs will appear here once users begin interacting with your agent.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[700px] border border-gray-100 rounded-[40px] overflow-hidden bg-white animate-fadeIn">
      {/* Session List */}
      <div className="w-full lg:w-96 border-r border-gray-50 flex flex-col bg-gray-50/30">
         <div className="p-6 border-b border-gray-50 bg-white">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Conversation Logs</h3>
            <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
               <input 
                type="text" 
                placeholder="Filter by session ID..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-[10px] font-bold text-gray-900 focus:ring-2 focus:ring-purple-100 transition-all font-mono"
               />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-10">
                 <Loader2 className="w-6 h-6 text-gray-200 animate-spin" />
              </div>
            ) : sessions.length > 0 ? (
              sessions.map((s) => (
                <div 
                  key={s._id} 
                  onClick={() => fetchMessages(s._id || s.session_id)}
                  className={`p-6 border-b border-gray-50 cursor-pointer transition-all ${
                    (selectedSession?._id || selectedSession?.session_id) === (s._id || s.session_id) ? 'bg-white shadow-sm border-l-4 border-l-[#a26da8]' : 'hover:bg-white/50'
                  }`}
                >
                   <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-green-500" />
                         <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest font-mono truncate max-w-[120px]">{s._id || s.session_id}</span>
                      </div>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                   </div>
                   <p className="text-[11px] font-medium text-gray-500 line-clamp-1 mb-3">{s.last_message || s.lastMessage || 'Empty conversation'}</p>
                   <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                         {s.tags?.map((t: string) => (
                           <span key={t} className="px-1.5 py-0.5 bg-gray-100 text-gray-400 text-[8px] font-black uppercase rounded">{t}</span>
                         ))}
                      </div>
                      <span className="text-[9px] font-black text-[#a26da8] uppercase bg-purple-50 px-2 py-0.5 rounded">{s.message_count} msgs</span>
                   </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center px-6">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-loose">No active user telemetry records found.</p>
              </div>
            )}
         </div>
      </div>

      {/* Message View */}
      <div className="flex-1 flex flex-col bg-white">
         {selectedSession ? (
           <>
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                       <User size={20} />
                    </div>
                    <div>
                       <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Session Details</h4>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono italic">{selectedSession._id || selectedSession.session_id}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <button onClick={() => handleDelete(selectedSession._id || selectedSession.session_id)} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                       <Trash2 size={18} />
                    </button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 bg-gray-50/20 space-y-8">
                 {loadingMessages ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                       <Loader2 className="w-8 h-8 text-purple-100 animate-spin" />
                       <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Reconstructing History...</span>
                    </div>
                 ) : (
                   messages.map((m, idx) => (
                     <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`flex items-start gap-4 max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                             m.role === 'user' ? 'bg-gray-900 text-white' : 'bg-[#a26da8] text-white shadow-lg'
                           }`}>
                              {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                           </div>
                           <div className={`p-5 rounded-[24px] text-sm font-medium leading-relaxed break-words whitespace-pre-wrap ${
                             m.role === 'user' 
                             ? 'bg-gray-100 text-gray-900 rounded-tr-none' 
                             : 'bg-white border border-gray-100 text-gray-900 rounded-tl-none shadow-sm'
                           }`}>
                              {m.role === 'user' ? (
                                m.content
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
                                    {m.content}
                                  </ReactMarkdown>
                                </div>
                              )}
                           </div>
                        </div>
                        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-2 mx-12">
                           {new Date(m.ts || m.createdAt || selectedSession.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                     </div>
                   ))
                 )}
              </div>
           </>
         ) : (
           <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
              <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center text-gray-200 mb-8">
                 <MessageSquare size={32} />
              </div>
              <h4 className="text-xl font-black text-gray-900 mb-2">Select a session</h4>
              <p className="text-sm font-medium text-gray-400 max-w-xs leading-relaxed">Choose a conversation record from the sidebar to inspect the full transcript and agent decision chain.</p>
           </div>
         )}
      </div>
    </div>
  );
};

export default HistoryTab;
