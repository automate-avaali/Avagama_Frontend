import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BrainCircuit, Sparkles, History, MessageSquare, AlertCircle, Trash2, X, AlertTriangle } from 'lucide-react';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';

interface Agent {
  _id: string;
  name: string;
  description: string;
  version: number;
  status: string;
  lyzr_agent_id: string;
}

export const AgentsList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const PremiumLoader = ({ size = "w-4 h-4" }: { size?: string }) => (
    <div className={`relative ${size}`}>
      <motion.div
        className="absolute inset-0 border-2 border-current border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-0 border-2 border-current opacity-20 rounded-full"
      />
    </div>
  );

  const type = searchParams.get('type');
  const entityId = searchParams.get('entityId');
  const usecaseId = searchParams.get('usecaseId');

  useEffect(() => {
    fetchAgents();
  }, [type, entityId, usecaseId]);

  const fetchAgents = async () => {
    if (!type || !entityId) {
      setError('Missing required parameters');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.agents.list({
        type,
        entityId,
        usecaseId: usecaseId || undefined
      });
      
      console.log('[AgentsList] Raw response:', response);
      
      // Handle different response structures gracefully
      const agentsList = response.agents || response.data || (Array.isArray(response) ? response : []);
      const isSuccess = response.success || Array.isArray(response) || response.status === 'success';

      if (isSuccess) {
        console.log('[AgentsList] Extracted agents:', agentsList);
        setAgents(agentsList);
      } else {
        setError(response.message || 'Failed to fetch agents');
      }
    } catch (err: any) {
      console.error('Error fetching agents:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (type === 'evaluation') {
      navigate(`/results/${entityId}`);
    } else {
      navigate(`/discovery/detail/${entityId}?type=${type}`);
    }
  };

  const handleDelete = async (agentId: string) => {
    console.log('[AgentsList] handleDelete initiated for:', agentId);
    try {
      setDeletingId(agentId);
      const response = await apiService.agents.delete(agentId);
      console.log('[AgentsList] Delete response:', response);
      if (response.success || response.status === 'success') {
        toast.success('Agent deleted successfully');
        await fetchAgents();
      } else {
        toast.error(response.message || 'Failed to delete agent');
      }
    } catch (err: any) {
      console.error('[AgentsList] Error deleting agent:', err);
      toast.error(err.message || 'An unexpected error occurred');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-8">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-purple-50 rounded-full"></div>
          <div className="w-20 h-20 border-4 border-t-[#9d7bb0] rounded-full animate-spin absolute top-0 left-0"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <BrainCircuit className="w-8 h-8 text-[#9d7bb0] animate-pulse" />
            <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-amber-400 animate-pulse" />
          </div>
        </div>
        <div className="space-y-2 text-center">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-[0.3em]">Synchronizing Agents</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">Accessing Neural Repository...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd]">
      <header className="h-16 border-b border-gray-100 flex items-center justify-between px-8 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-black text-gray-900 uppercase tracking-widest">View Agents</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
              {agents.length} Agent{agents.length !== 1 ? 's' : ''} Found
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        {error ? (
          <div className="bg-red-50 border border-red-100 rounded-3xl p-8 text-center max-w-2xl mx-auto">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-black text-red-900 mb-2 uppercase tracking-tight">Error Loading Agents</h3>
            <p className="text-red-600 font-medium mb-6">{error}</p>
            <button 
              onClick={fetchAgents}
              className="px-6 py-2.5 bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all"
            >
              Try Again
            </button>
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-100 rounded-[40px] shadow-sm max-w-2xl mx-auto">
            <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center mb-8 mx-auto relative">
              <BrainCircuit className="w-12 h-12 text-gray-300" />
              <Sparkles className="absolute top-4 right-4 w-5 h-5 text-gray-200" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">No Agents Found</h3>
            <p className="text-gray-500 font-medium mb-8 max-w-xs mx-auto">
              No agents have been created for this use case yet.
            </p>
            <button 
              onClick={() => navigate(`/admin/agent-builder?type=${type}&entityId=${entityId}${usecaseId ? `&usecaseId=${usecaseId}` : ''}`)}
              className="px-8 py-3 bg-[#a26da8] text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-[#8e5c94] transition-all shadow-lg shadow-[#a26da8]/20"
            >
              Create Agent
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {agents.map((agent) => (
              <div 
                key={agent._id}
                className="group bg-white border border-gray-100 rounded-[40px] p-8 shadow-sm hover:shadow-xl hover:border-[#a26da8]/20 transition-all duration-500 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6">
                  <span className="bg-[#a26da8]/5 text-[#a26da8] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    v{agent.version}
                  </span>
                </div>

                <div className="w-16 h-16 bg-[#a26da8]/5 rounded-[24px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 relative">
                  <BrainCircuit className="w-8 h-8 text-[#a26da8]" />
                  <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <h3 className="text-xl font-black text-gray-900 mb-3 tracking-tight group-hover:text-[#a26da8] transition-colors">
                  {agent.name}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-8 font-medium line-clamp-3">
                  {agent.description}
                </p>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      const id = agent._id || (agent as any).id;
                      navigate(`/admin/agent-builder?type=${type}&entityId=${entityId}${usecaseId ? `&usecaseId=${usecaseId}` : ''}&agentId=${id}`);
                    }}
                    className="flex-grow flex items-center justify-center gap-2 px-6 py-3 bg-[#a26da8] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#8e5c94] transition-all shadow-lg shadow-[#a26da8]/10"
                  >
                    <MessageSquare className="w-3.5 h-3.5 pointer-events-none" />
                    Open Builder
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const id = agent._id || (agent as any).id;
                      console.log('[AgentsList] Confirm delete for ID:', id);
                      setConfirmDeleteId(id);
                    }}
                    disabled={deletingId === (agent._id || (agent as any).id)}
                    className="p-3 bg-red-50 text-red-400 rounded-2xl hover:bg-red-100 hover:text-red-600 transition-all disabled:opacity-50 relative z-20"
                  >
                    {deletingId === (agent._id || (agent as any).id) ? (
                      <PremiumLoader />
                    ) : (
                      <Trash2 className="w-4 h-4 pointer-events-none" />
                    )}
                  </button>
                  <button className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 hover:text-gray-600 transition-all">
                    <History className="w-4 h-4 pointer-events-none" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !deletingId && setConfirmDeleteId(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[32px] shadow-2xl border border-gray-100 p-8 md:p-10 max-w-md w-full overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6">
                <button 
                  onClick={() => setConfirmDeleteId(null)}
                  disabled={!!deletingId}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                
                <h3 className="text-xl font-black text-gray-900 mb-3 tracking-tight uppercase">Delete Agent?</h3>
                <p className="text-gray-500 font-medium leading-relaxed mb-8">
                  Are you sure you want to delete this agent? This action cannot be undone and all data will be lost.
                </p>

                <div className="flex flex-col w-full gap-3">
                  <button 
                    onClick={() => handleDelete(confirmDeleteId)}
                    disabled={!!deletingId}
                    className="w-full py-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {deletingId ? (
                      <>
                        <PremiumLoader size="w-3 h-3" />
                        Deleting...
                      </>
                    ) : (
                      'Confirm Deletion'
                    )}
                  </button>
                  <button 
                    onClick={() => setConfirmDeleteId(null)}
                    disabled={!!deletingId}
                    className="w-full py-4 bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgentsList;
