
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { apiService } from '../../services/api';
import { StandaloneAgent } from '../../types/standalone';
import ChatPreview from './builder/ChatPreview';
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Settings, 
  ExternalLink, 
  Trash2, 
  MoreVertical,
  Activity,
  Copy,
  LayoutGrid,
  List,
  Sparkles,
  BookOpen,
  Zap,
  Globe,
  Bot
} from 'lucide-react';
import toast from '../../components/studio/notify';

const StandaloneAgents: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<StandaloneAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft'>('all');
  const [testingAgentId, setTestingAgentId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, [activeTab]);

  // The list API is paginated (default 20 per page). Load every page (100 at a time) so the
  // list — and the search box, which filters it — covers ALL agents, not just the first page.
  const fetchAllPages = async (status?: 'published' | 'draft'): Promise<any[]> => {
    const out: any[] = [];
    const seen = new Set<string>();
    for (let page = 1; page <= 50; page++) {
      const res = await apiService.standalone.agents.list({ ...(status ? { status } : {}), page, limit: 100 });
      const rows: any[] = Array.isArray(res?.data) ? res.data : [];
      let added = 0;
      rows.forEach(a => { const id = String(a?._id); if (id && !seen.has(id)) { seen.add(id); out.push(a); added++; } });
      const total = typeof res?.total === 'number' ? res.total : undefined;
      // Stop at the last page, at the reported total, or if a page brings nothing new (server ignores paging).
      if (rows.length < 100 || added === 0 || (total !== undefined && out.length >= total)) break;
    }
    return out;
  };

  const fetchAgents = async () => {
    setLoading(true);
    try {
      if (activeTab === 'all') {
        // "All" must include published AND draft. Merge the default list with an
        // explicit published + draft fetch so no status is hidden, whatever the
        // default (no-status) response returns. Additive only — dedupe by _id.
        const results = await Promise.allSettled([
          fetchAllPages(),
          fetchAllPages('published'),
          fetchAllPages('draft'),
        ]);
        if (results.every(r => r.status === 'rejected')) throw (results[0] as PromiseRejectedResult).reason;
        const toArr = (r: PromiseSettledResult<any[]>): any[] => (r.status === 'fulfilled' ? r.value : []);
        const seen = new Set<string>();
        const merged = results.flatMap(toArr).filter((a: any) => {
          const id = String(a?._id);
          if (!id || seen.has(id)) return false;
          seen.add(id);
          return true;
        });
        setAgents(merged);
      } else {
        setAgents(await fetchAllPages(activeTab));
      }
    } catch (error: any) {
      toast.error('Failed to load agents');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const response = await apiService.standalone.agents.delete(id);
      if (response.success) {
        toast.success('Agent deleted');
        setConfirmDeleteId(null);
        fetchAgents();
      }
    } catch (error) {
      toast.error('Failed to delete agent');
    } finally {
      setIsDeleting(false);
    }
  };

  const q = searchQuery.trim().toLowerCase();
  const filteredAgents = agents.filter(agent =>
    !q ||
    (agent.name || '').toLowerCase().includes(q) ||
    (agent.description || '').toLowerCase().includes(q)
  );

  return (
    <div className="min-h-screen bg-[#fafafa] pt-8 pb-20">
      <div className="max-w-[1600px] mx-auto px-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#a26da8] to-[#6fcbbd] flex items-center justify-center text-white">
                <LayoutGrid size={20} />
              </div>
              <h1 className="text-[26px] font-semibold text-slate-900">Agent Builder</h1>
            </div>
            <p className="text-slate-500 font-medium">Build, deploy and manage your custom AI agents for any channel.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              to="/admin/standalone/marketplace"
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium text-[13px] hover:border-purple-200 hover:text-[#a26da8] transition-all shadow-sm"
            >
              <Sparkles size={16} />
              Browse Blueprints
            </Link>
            <button 
              onClick={() => navigate('/admin/standalone/builder/new')}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg font-semibold text-[13px] hover:bg-black transition-all shadow-sm"
            >
              <Plus size={18} />
              Create New Agent
            </button>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            {(['all', 'published', 'draft'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 rounded-lg text-[12.5px] font-semibold capitalize transition-all ${
                  activeTab === tab 
                  ? 'bg-purple-50 text-[#a26da8]' 
                  : 'text-slate-500 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab} Agents
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 flex-1 max-w-2xl px-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#a26da8] transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search your agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-normal text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-purple-100 transition-all outline-none focus:border-[#a26da8]"
              />
            </div>

            <div className="flex items-center p-1 bg-slate-50 rounded-lg">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#a26da8]' : 'text-slate-500 hover:text-slate-600'}`}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-[#a26da8]' : 'text-slate-500 hover:text-slate-600'}`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
             <div className="w-12 h-12 border-4 border-purple-100 border-t-[#a26da8] rounded-full animate-spin" />
             <p className="text-slate-500 text-[13px] font-semibold animate-pulse">Loading agents…</p>
          </div>
        ) : filteredAgents.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
              {filteredAgents.map((agent) => (
                <AgentCard key={agent._id} agent={agent} onDelete={setConfirmDeleteId} onTest={setTestingAgentId} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-4 text-[12.5px] font-semibold text-slate-500">Agent Info</th>
                    <th className="px-5 py-4 text-[12.5px] font-semibold text-slate-500">Status</th>
                    <th className="px-5 py-4 text-[12.5px] font-semibold text-slate-500">Capability</th>
                    <th className="px-5 py-4 text-[12.5px] font-semibold text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAgents.map((agent) => (
                    <AgentRow key={agent._id} agent={agent} onDelete={setConfirmDeleteId} onTest={setTestingAgentId} />
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 border-dashed py-32 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-full bg-purple-50 flex items-center justify-center text-[#a26da8] mb-5">
              <LayoutGrid size={40} />
            </div>
            {q ? (
              <>
                <h3 className="text-[20px] font-semibold text-slate-900 mb-2">No agents match “{searchQuery.trim()}”</h3>
                <p className="text-slate-500 max-w-sm mx-auto font-medium mb-10">Searched {agents.length} {activeTab === 'all' ? '' : `${activeTab} `}agent{agents.length === 1 ? '' : 's'} by name and description.</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg font-semibold text-[13px] hover:bg-slate-50 transition-all"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <h3 className="text-[20px] font-semibold text-slate-900 mb-2">No Agents Found</h3>
                <p className="text-slate-500 max-w-sm mx-auto font-medium mb-10">Start building your first autonomous AI agent by using a blueprint or starting from scratch.</p>
                <button 
                  onClick={() => navigate('/admin/standalone/builder/new')}
                  className="px-6 py-3 bg-slate-900 text-white rounded-lg font-semibold text-[13px] hover:bg-black transition-all shadow-sm"
                >
                  Create your first agent
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {testingAgentId && (
        <ChatPreview 
          agentId={testingAgentId} 
          agentName={agents.find(a => a._id === testingAgentId)?.name || 'Agent Preview'}
          status={agents.find(a => a._id === testingAgentId)?.status || 'draft'}
          isDirty={false}
        />
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setConfirmDeleteId(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-xl shadow-2xl border border-slate-200 p-6 max-w-md w-full overflow-hidden"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-50 rounded-lg flex items-center justify-center mb-4">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                
                <h3 className="text-[18px] font-semibold text-slate-900 mb-3">Delete Agent?</h3>
                <p className="text-slate-500 font-medium leading-relaxed mb-5">
                  Are you sure you want to delete this agent? This action cannot be undone and all associated data will be permanently removed.
                </p>
                <div className="flex flex-col w-full gap-3">
                  <button 
                    onClick={() => handleDelete(confirmDeleteId)}
                    disabled={isDeleting}
                    className="w-full py-2.5 bg-red-600 text-white text-[12.5px] font-semibold rounded-xl hover:bg-red-700 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Confirm Deletion'
                    )}
                  </button>
                  <button 
                    onClick={() => setConfirmDeleteId(null)}
                    disabled={isDeleting}
                    className="w-full py-2.5 bg-slate-100 text-slate-500 text-[12.5px] font-semibold rounded-xl hover:bg-slate-200 transition-all disabled:opacity-50"
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

const AgentCard: React.FC<{ agent: StandaloneAgent, onDelete: (id: string) => void, onTest?: (id: string) => void }> = ({ agent, onDelete, onTest }) => {
  const navigate = useNavigate();
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(`/admin/standalone/builder/${agent._id}`)}
      className="group relative bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:border-purple-200 transition-all transition-shadow duration-500 flex flex-col h-full cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-purple-50 to-teal-50 flex items-center justify-center text-[20px] group-hover:scale-110 transition-transform duration-500">
           {agent.name.charAt(0)}
        </div>
        <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-full text-[11.5px] font-semibold capitalize ${
            agent.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'
            }`}>
            {agent.status}
            </span>
            <div className="flex items-center gap-1.5 text-slate-500">
               <Activity size={12} className="animate-pulse text-purple-400" />
               <span className="text-[11.5px] font-semibold">{agent.chat_count} Chats</span>
            </div>
        </div>
      </div>

      <div className="mb-5">
        <h3 className="text-[18px] font-semibold text-slate-900 mb-2 group-hover:text-[#a26da8] transition-colors">
          {agent.name}
        </h3>
        <p className="text-sm font-medium text-slate-500 line-clamp-2 leading-relaxed">{agent.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-slate-50/50 rounded-lg flex flex-col gap-1">
           <div className="flex items-center gap-1.5 text-slate-500">
             <BookOpen size={10} />
             <span className="text-[11px] font-semibold">Knowledge</span>
           </div>
           <p className="text-[13px] font-semibold text-slate-900">{agent.knowledge_summary?.source_count || 0} Sources</p>
        </div>
        <div className="p-3 bg-slate-50/50 rounded-lg flex flex-col gap-1">
           <div className="flex items-center gap-1.5 text-slate-500">
             <Zap size={10} />
             <span className="text-[11px] font-semibold">Memory</span>
           </div>
           <p className="text-[13px] font-semibold text-slate-900">Adaptive</p>
        </div>
      </div>

      <div className="mt-auto pt-6 flex items-center justify-between border-t border-slate-100">
        <div className="flex items-center gap-1">
           {agent.channels?.filter(c => c.enabled).map(c => (
              <div key={c.type} className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500">
                 <Globe size={12} />
              </div>
           ))}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(agent._id);
            }}
            className="p-3 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          >
            <Trash2 size={16} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onTest?.(agent._id);
            }}
            className="p-3 text-slate-500 hover:text-[#a26da8] hover:bg-purple-50 rounded-lg transition-all"
            title="Test Chat"
          >
            <Bot size={18} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/standalone/builder/${agent._id}`);
            }}
            className="flex items-center gap-2 px-5 py-3 bg-purple-50 text-[#a26da8] rounded-lg text-[12.5px] font-semibold hover:bg-[#a26da8] hover:text-white transition-all"
          >
            Manage
            <Settings size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const AgentRow: React.FC<{ agent: StandaloneAgent, onDelete: (id: string) => void, onTest?: (id: string) => void }> = ({ agent, onDelete, onTest }) => {
  const navigate = useNavigate();
  return (
    <tr 
      onClick={() => navigate(`/admin/standalone/builder/${agent._id}`)}
      className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
    >
      <td className="px-5 py-3">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-50 to-teal-50 flex items-center justify-center text-slate-700 font-medium">
            {agent.name.charAt(0)}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-0.5 group-hover:text-[#a26da8] transition-colors">{agent.name}</h4>
            <p className="text-[12.5px] font-medium text-slate-500">{agent.slug}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3">
        <span className={`px-3 py-1 rounded-full text-[11.5px] font-semibold capitalize ${
          agent.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'
        }`}>
          {agent.status}
        </span>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-2 text-[13px] font-medium text-slate-600">
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:border-purple-200 transition-colors">
            <BookOpen size={14} className="text-[#a26da8]" />
          </div>
          {agent.knowledge_summary?.source_count || 0} Knowledge Sources
        </div>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center justify-end gap-3">
          <div className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl gap-3">
             <div className="flex flex-col items-end">
                <span className="text-[11.5px] font-semibold text-slate-900 leading-none">{agent.chat_count}</span>
                <span className="text-[11px] font-medium text-slate-500">Messages</span>
             </div>
             <Activity size={14} className="text-green-500 animate-pulse" />
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onTest?.(agent._id);
            }}
            className="p-3 text-slate-500 hover:text-[#a26da8] hover:bg-purple-100 rounded-xl transition-all"
            title="Test Chat"
          >
            <Bot size={18} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/standalone/builder/${agent._id}`);
            }}
            className="p-3 text-slate-500 hover:text-[#a26da8] hover:bg-purple-100 rounded-xl transition-all"
          >
            <Settings size={18} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(agent._id);
            }}
            className="p-3 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default StandaloneAgents;
