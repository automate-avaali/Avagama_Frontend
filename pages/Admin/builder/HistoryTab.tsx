
import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';
import AgentMessage from '../../../components/AgentMessage';
import { GuardrailNote, tagLabel } from './GuardrailNote';
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
import toast from '../../../components/studio/notify';

interface HistoryTabProps {
  agentId: string;
  refreshKey?: number;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ agentId, refreshKey }) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (agentId !== 'new') fetchSessions();
  }, [agentId, refreshKey]);

  useEffect(() => {
    // If a session is currently selected, refresh its messages too
    const currentId = selectedSession?._id || selectedSession?.session_id;
    if (currentId && refreshKey && refreshKey > 0) {
      fetchMessages(currentId);
    }
  }, [refreshKey]);

  const fetchSessions = async () => {
    if (sessions.length === 0) setLoading(true);
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
    if (messages.length === 0) setLoadingMessages(true);
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

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    const sessionId = confirmDeleteId;
    
    try {
      // Optimistic update
      setSessions(prev => prev.filter(s => (s._id || s.session_id) !== sessionId));
      
      await apiService.standalone.agents.conversations.delete(agentId, sessionId);
      toast.success('Log entry deleted');
      
      const currentSelectedId = selectedSession?._id || selectedSession?.session_id;
      if (currentSelectedId === sessionId) {
        setSelectedSession(null);
        setMessages([]);
      }
    } catch (error) {
      toast.error('Failed to delete log');
      fetchSessions(); // Revert list on error
    } finally {
      setConfirmDeleteId(null);
    }
  };

  if (agentId === 'new') {
    return (
      <div className="py-14 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4">
          <MessageSquare size={32} />
        </div>
        <h3 className="text-[18px] font-semibold text-slate-900 mb-2">No History Yet</h3>
        <p className="text-slate-500 font-medium max-w-sm">Conversation logs will appear here once users begin interacting with your agent.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row h-[700px] border border-slate-200 rounded-xl overflow-hidden bg-white animate-fadeIn">
        {/* Session List */}
        <div className="w-full lg:w-96 border-r border-slate-100 flex flex-col bg-slate-50/30">
           <div className="p-6 border-b border-slate-100 bg-white">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Conversation Logs</h3>
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                 <input 
                  type="text" 
                  placeholder="Filter by session ID..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg text-[12.5px] font-normal text-slate-900 focus:ring-2 focus:ring-purple-100 transition-all font-mono outline-none focus:border-[#a26da8]"
                 />
              </div>
           </div>

           <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-10">
                   <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                </div>
              ) : sessions.length > 0 ? (
                sessions.map((s, i) => (
                  <div 
                    key={s._id || s.session_id} 
                    onClick={() => fetchMessages(s._id || s.session_id)}
                    className={`p-6 border-b border-slate-100 cursor-pointer transition-all ${
                      (selectedSession?._id || selectedSession?.session_id) === (s._id || s.session_id) ? 'bg-white shadow-sm border-l-4 border-l-[#a26da8]' : 'hover:bg-white/50'
                    }`}
                  >
                     <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-green-500" />
                           <span className="text-[12.5px] font-semibold text-slate-900 font-mono truncate max-w-[120px]">{s._id || s.session_id}</span>
                        </div>
                        <span className="text-[11.5px] font-semibold text-slate-500">{new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                     </div>
                     <p className="text-[13px] font-medium text-slate-500 line-clamp-1 mb-3">{s.last_message || s.lastMessage || `Conversation - ${i + 1}`}</p>
                     <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                           {s.tags?.map((t: string) => (
                             <span key={t} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[11px] font-semibold rounded">{tagLabel(t)}</span>
                           ))}
                        </div>
                        <span className="text-[11.5px] font-semibold text-[#a26da8] bg-purple-50 px-2 py-0.5 rounded">{s.message_count} msgs</span>
                     </div>
                  </div>
                ))
              ) : (
                <div className="py-14 text-center px-4">
                   <p className="text-[12.5px] font-semibold text-slate-500 leading-loose">No active user telemetry records found.</p>
                </div>
              )}
           </div>
        </div>

        {/* Message View */}
        <div className="flex-1 flex flex-col bg-white">
           {selectedSession ? (
             <>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
                         <User size={20} />
                      </div>
                      <div>
                         <h4 className="text-[13px] font-semibold text-slate-900">Session Details</h4>
                         <p className="text-[12.5px] font-medium text-slate-500 font-mono">{selectedSession._id || selectedSession.session_id}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                      <button onClick={() => setConfirmDeleteId(selectedSession._id || selectedSession.session_id)} className="p-3 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                         <Trash2 size={18} />
                      </button>
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/20 space-y-8">
                   {loadingMessages ? (
                      <div className="flex flex-col items-center justify-center h-full gap-4">
                         <Loader2 className="w-8 h-8 text-purple-100 animate-spin" />
                         <span className="text-[11.5px] font-semibold text-slate-400">Reconstructing History...</span>
                      </div>
                   ) : (
                     messages.map((m, idx) => (
                       <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div className={`flex items-start gap-4 max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                             <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                               m.role === 'user' ? 'bg-slate-900 text-white' : 'bg-[#a26da8] text-white shadow-sm'
                             }`}>
                                {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                             </div>
                             <div className={`p-5 rounded-lg text-sm font-medium leading-relaxed break-words ${
                               m.role === 'user'
                               ? 'bg-slate-100 text-slate-900 rounded-tr-none'
                               : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none shadow-sm'
                             }`}>
                                {m.role === 'user' ? (
                                  <span className="whitespace-pre-wrap">{m.content}</span>
                                ) : (
                                  <AgentMessage content={m.content} citations={m.citations} />
                                )}
                             </div>
                          </div>
                          <div className="mx-12 max-w-[80%]">
                             <GuardrailNote
                               guardrails={m.role === 'assistant' ? m.guardrail : undefined}
                               piiTypes={m.role !== 'assistant' && m.pii_detected ? m.pii_types : undefined}
                               piiAction={m.role !== 'assistant' ? messages[idx + 1]?.guardrail?.pii?.action : undefined}
                               align={m.role === 'user' ? 'right' : 'left'}
                             />
                          </div>
                          <span className="text-[11.5px] font-medium text-slate-400 mt-2 mx-12">
                             {new Date(m.ts || m.createdAt || selectedSession.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                       </div>
                     ))
                   )}
                </div>
             </>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-5">
                   <MessageSquare size={32} />
                </div>
                <h4 className="text-[18px] font-semibold text-slate-900 mb-2">Select a session</h4>
                <p className="text-sm font-medium text-slate-500 max-w-xs leading-relaxed">Choose a conversation record from the sidebar to inspect the full transcript and agent decision chain.</p>
             </div>
           )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-lg flex items-center justify-center mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-[18px] font-semibold text-slate-900 mb-2">Delete Log?</h3>
            <p className="text-sm font-medium text-slate-500 leading-relaxed mb-5">
              Are you sure you want to permanently delete this conversation history? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 bg-slate-50 text-slate-500 rounded-lg text-[12.5px] font-semibold hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-[12.5px] font-semibold hover:bg-red-600 transition-all shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HistoryTab;
