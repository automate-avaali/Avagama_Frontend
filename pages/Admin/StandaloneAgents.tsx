
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
import toast from 'react-hot-toast';

const StandaloneAgents: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<StandaloneAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft'>('all');
  const [testingAgentId, setTestingAgentId] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, [activeTab]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (activeTab !== 'all') {
        params.status = activeTab;
      }
      const response = await apiService.standalone.agents.list(params);
      if (response.success) {
        setAgents(response.data);
      }
    } catch (error: any) {
      toast.error('Failed to load agents');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await apiService.standalone.agents.delete(id);
      if (response.success) {
        toast.success('Agent deleted');
        fetchAgents();
      }
    } catch (error) {
      toast.error('Failed to delete agent');
    }
  };

  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#fafafa] pt-8 pb-20">
      <div className="max-w-[1600px] mx-auto px-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#a26da8] to-[#6fcbbd] flex items-center justify-center text-white">
                <LayoutGrid size={20} />
              </div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Standalone Agents</h1>
            </div>
            <p className="text-gray-500 font-medium tracking-tight">Build, deploy and manage your custom AI agents for any channel.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              to="/admin/standalone/marketplace"
              className="flex items-center gap-2 px-6 py-3.5 bg-white border border-gray-100 rounded-[20px] text-gray-700 font-bold text-xs uppercase tracking-widest hover:border-purple-200 hover:text-[#a26da8] transition-all shadow-sm"
            >
              <Sparkles size={16} />
              Browse Blueprints
            </Link>
            <button 
              onClick={() => navigate('/admin/standalone/builder/new')}
              className="flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200"
            >
              <Plus size={18} />
              Create New Agent
            </button>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="bg-white rounded-[32px] border border-gray-100 p-4 mb-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            {(['all', 'published', 'draft'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab 
                  ? 'bg-purple-50 text-[#a26da8]' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab} Agents
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 flex-1 max-w-2xl px-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#a26da8] transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search your agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-[20px] text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-100 transition-all"
              />
            </div>

            <div className="flex items-center p-1 bg-gray-50 rounded-[20px]">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-2xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#a26da8]' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-2xl transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-[#a26da8]' : 'text-gray-400 hover:text-gray-600'}`}
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
             <p className="text-gray-400 text-xs font-black uppercase tracking-[0.2em] animate-pulse">Initializing Agent Nexus...</p>
          </div>
        ) : filteredAgents.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
              {filteredAgents.map((agent) => (
                <AgentCard key={agent._id} agent={agent} onDelete={handleDelete} onTest={setTestingAgentId} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Agent Info</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Capability</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredAgents.map((agent) => (
                    <AgentRow key={agent._id} agent={agent} onDelete={handleDelete} onTest={setTestingAgentId} />
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="bg-white rounded-[40px] border border-gray-100 border-dashed py-32 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-full bg-purple-50 flex items-center justify-center text-[#a26da8] mb-8">
              <LayoutGrid size={40} />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">No Agents Found</h3>
            <p className="text-gray-500 max-w-sm mx-auto font-medium mb-10">Start building your first autonomous AI agent by using a blueprint or starting from scratch.</p>
            <button 
              onClick={() => navigate('/admin/standalone/builder/new')}
              className="px-10 py-5 bg-gray-900 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-gray-200"
            >
              Construct First Agent
            </button>
          </div>
        )}
      </div>
      {testingAgentId && <ChatPreview agentId={testingAgentId} />}
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
      className="group relative bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm hover:shadow-2xl hover:shadow-purple-100/50 hover:border-purple-200 transition-all transition-shadow duration-500 flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-50 to-teal-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-500">
           {agent.name.charAt(0)}
        </div>
        <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
            agent.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
            }`}>
            {agent.status}
            </span>
            <div className="flex items-center gap-1.5 text-gray-400">
               <Activity size={12} className="animate-pulse text-purple-400" />
               <span className="text-[9px] font-black uppercase">{agent.chat_count} Chats</span>
            </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-black text-gray-900 mb-2 group-hover:text-[#a26da8] transition-colors">{agent.name}</h3>
        <p className="text-sm font-medium text-gray-500 line-clamp-2 leading-relaxed">{agent.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-gray-50/50 rounded-2xl flex flex-col gap-1">
           <div className="flex items-center gap-1.5 text-gray-400">
             <BookOpen size={10} />
             <span className="text-[8px] font-black uppercase tracking-widest">Knowledge</span>
           </div>
           <p className="text-xs font-black text-gray-900">{agent.knowledge_summary?.source_count || 0} Sources</p>
        </div>
        <div className="p-3 bg-gray-50/50 rounded-2xl flex flex-col gap-1">
           <div className="flex items-center gap-1.5 text-gray-400">
             <Zap size={10} />
             <span className="text-[8px] font-black uppercase tracking-widest">Memory</span>
           </div>
           <p className="text-xs font-black text-gray-900">Adaptive</p>
        </div>
      </div>

      <div className="mt-auto pt-6 flex items-center justify-between border-t border-gray-50">
        <div className="flex items-center gap-1">
           {agent.channels?.filter(c => c.enabled).map(c => (
              <div key={c.type} className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
                 <Globe size={12} />
              </div>
           ))}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onDelete(agent._id)}
            className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
          >
            <Trash2 size={16} />
          </button>
          <button 
            onClick={() => onTest?.(agent._id)}
            className="p-3 text-gray-400 hover:text-[#a26da8] hover:bg-purple-50 rounded-2xl transition-all"
            title="Test Chat"
          >
            <Bot size={18} />
          </button>
          <button 
            onClick={() => navigate(`/admin/standalone/builder/${agent._id}`)}
            className="flex items-center gap-2 px-5 py-3 bg-purple-50 text-[#a26da8] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#a26da8] hover:text-white transition-all"
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
    <tr className="group hover:bg-gray-50/80 transition-colors">
      <td className="px-8 py-5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-50 to-teal-50 flex items-center justify-center text-gray-700 font-bold">
            {agent.name.charAt(0)}
          </div>
          <div>
            <h4 className="text-sm font-black text-gray-900 mb-0.5">{agent.name}</h4>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{agent.slug}</p>
          </div>
        </div>
      </td>
      <td className="px-8 py-5">
        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
          agent.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
        }`}>
          {agent.status}
        </span>
      </td>
      <td className="px-8 py-5">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
          <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center group-hover:border-purple-200 transition-colors">
            <BookOpen size={14} className="text-[#a26da8]" />
          </div>
          {agent.knowledge_summary?.source_count || 0} Knowledge Sources
        </div>
      </td>
      <td className="px-8 py-5">
        <div className="flex items-center justify-end gap-3">
          <div className="flex items-center px-4 py-2 bg-white border border-gray-100 rounded-xl gap-3">
             <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-gray-900 uppercase leading-none">{agent.chat_count}</span>
                <span className="text-[7px] font-bold text-gray-400 uppercase tracking-tighter">Messages</span>
             </div>
             <Activity size={14} className="text-green-500 animate-pulse" />
          </div>
          <button 
            onClick={() => onTest?.(agent._id)}
            className="p-3 text-gray-400 hover:text-[#a26da8] hover:bg-purple-100 rounded-xl transition-all"
            title="Test Chat"
          >
            <Bot size={18} />
          </button>
          <button 
            onClick={() => navigate(`/admin/standalone/builder/${agent._id}`)}
            className="p-3 text-gray-400 hover:text-[#a26da8] hover:bg-purple-100 rounded-xl transition-all"
          >
            <Settings size={18} />
          </button>
          <button 
            onClick={() => onDelete(agent._id)}
            className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default StandaloneAgents;
