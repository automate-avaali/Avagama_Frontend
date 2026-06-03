
import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';
import { StandaloneTool } from '../../../types/standalone';
import { 
  Puzzle, 
  Plus, 
  Trash2, 
  Settings, 
  Link2, 
  Globe, 
  Box, 
  Zap,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  Loader2,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ToolsTabProps {
  agentId: string;
}

const TOOL_TYPES = [
  { id: 'builtin', name: 'Built-in Utilities', icon: <Box size={24} />, desc: 'Core tools like Math, Search, and Time' },
  { id: 'zapier', name: 'Zapier Hub', icon: <Zap size={24} />, desc: 'Connect to 6,000+ external apps' },
  { id: 'mcp', name: 'MCP Connector', icon: <Puzzle size={24} />, desc: 'Model Context Protocol server integration' },
  { id: 'webhook', name: 'Custom Webhooks', icon: <Globe size={24} />, desc: 'Native API integrations via JSON-REST' }
];

const ToolsTab: React.FC<ToolsTabProps> = ({ agentId }) => {
  const [tools, setTools] = useState<StandaloneTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalog, setCatalog] = useState<any[]>([]);

  useEffect(() => {
    if (agentId !== 'new') {
      fetchTools();
      fetchCatalog();
    }
  }, [agentId]);

  const fetchTools = async () => {
    try {
      const response = await apiService.standalone.agents.tools.list(agentId);
      if (response.success) setTools(response.data);
    } catch (error) {
      toast.error('Failed to load active tools');
    } finally {
      setLoading(false);
    }
  };

  const fetchCatalog = async () => {
    try {
      const response = await apiService.standalone.tools.getCatalog();
      if (response.success) setCatalog(response.data);
    } catch (error) {}
  };

  const handleToggle = async (id: string) => {
    try {
      await apiService.standalone.agents.tools.toggle(agentId, id);
      fetchTools();
    } catch (error) {
      toast.error('Failed to toggle tool');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.standalone.agents.tools.delete(agentId, id);
      toast.success('Tool detached');
      fetchTools();
    } catch (error) {
      toast.error('Failed to remove tool');
    }
  };

  if (agentId === 'new') {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-6">
          <Puzzle size={32} />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">Save Agent First</h3>
        <p className="text-gray-500 font-medium max-w-sm">Agent blueprints must be instantiated before tools can be logically attached.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fadeIn pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
           <h3 className="text-lg font-black text-gray-900">Functional Tools</h3>
           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Equip your agent with technical capabilities</p>
        </div>

        <button 
          onClick={() => setShowCatalog(!showCatalog)}
          className="flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200"
        >
          {showCatalog ? 'Back to Config' : 'Browse Tool Catalog'}
          {showCatalog ? <Settings size={18} /> : <ArrowUpRight size={18} />}
        </button>
      </div>

      {showCatalog ? (
        <div className="space-y-10 animate-slideDown">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TOOL_TYPES.map(type => (
              <div key={type.id} className="bg-white border border-gray-100 p-8 rounded-[40px] hover:border-[#a26da8] hover:shadow-2xl hover:shadow-purple-50 transition-all group flex flex-col items-center text-center cursor-pointer">
                 <div className="w-20 h-20 rounded-[30px] bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-purple-50 group-hover:text-[#a26da8] transition-all mb-6">
                    {type.icon}
                 </div>
                 <h4 className="text-sm font-black text-gray-900 mb-2 uppercase tracking-tight">{type.name}</h4>
                 <p className="text-xs font-medium text-gray-500 leading-relaxed">{type.desc}</p>
              </div>
            ))}
          </div>

          <div className="space-y-6">
             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Available Built-in Powerups</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
               {(catalog.length > 0 ? catalog : [
                 { name: 'Google Search', type: 'builtin', icon: <Search size={14} />, desc: 'Grounded web search for real-time fact checking.' },
                 { name: 'Financial Math', type: 'builtin', icon: <Lock size={14} />, desc: 'High-precision currency and math processing.' },
                 { name: 'JSON Parser', type: 'builtin', icon: <Box size={14} />, desc: 'Structural data extraction from unstructured chat.' }
               ]).map((tc, idx) => (
                 <div key={idx} className="p-6 bg-white border border-gray-100 rounded-[32px] flex items-center justify-between group hover:border-[#a26da8] transition-all">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#a26da8]">
                          {tc.icon}
                       </div>
                       <div>
                          <h5 className="text-xs font-black text-gray-900 group-hover:text-[#a26da8] transition-colors">{tc.name}</h5>
                          <p className="text-[10px] font-medium text-gray-500 lowercase">{tc.desc}</p>
                       </div>
                    </div>
                    <button className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#a26da8] transition-all shadow-lg shadow-gray-100">Attach</button>
                 </div>
               ))}
             </div>
          </div>
        </div>
      ) : (
        /* Active Tools List */
        <div className="space-y-6">
          {loading ? (
             <div className="flex justify-center py-20">
               <Loader2 className="w-8 h-8 text-gray-200 animate-spin" />
             </div>
          ) : tools.length > 0 ? (
            tools.map((tool) => (
              <div key={tool._id} className="group flex items-center justify-between p-8 bg-white border border-gray-100 rounded-[32px] hover:border-[#a26da8] hover:shadow-2xl hover:shadow-purple-50 transition-all">
                 <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${tool.enabled ? 'bg-purple-50 text-[#a26da8]' : 'bg-gray-100 text-gray-400'}`}>
                       {tool.type === 'zapier' ? <Zap size={24} /> : tool.type === 'mcp' ? <Puzzle size={24} /> : <Box size={24} />}
                    </div>
                    <div>
                       <div className="flex items-center gap-3">
                          <h5 className="text-sm font-black text-gray-900">{tool.name}</h5>
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${tool.enabled ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                            {tool.enabled ? 'active' : 'disabled'}
                          </span>
                       </div>
                       <p className="text-xs font-medium text-gray-400 mt-1">{tool.type} connection verified</p>
                    </div>
                 </div>

                 <div className="flex items-center gap-3">
                    <button 
                     onClick={() => handleToggle(tool._id)}
                     className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-gray-50 transition-all ${
                       tool.enabled ? 'text-[#a26da8] hover:bg-purple-50' : 'text-gray-400 hover:bg-gray-100'
                     }`}
                    >
                      {tool.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button 
                     onClick={() => handleDelete(tool._id)}
                     className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                 </div>
              </div>
            ))
          ) : (
            <div className="py-24 border-2 border-dashed border-gray-100 rounded-[40px] flex flex-col items-center justify-center text-center">
               <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-200 mb-6">
                  <Puzzle size={28} />
               </div>
               <p className="font-black text-gray-400 text-xs uppercase tracking-[0.2em]">Equip your agents with external superpowers.</p>
               <button 
                onClick={() => setShowCatalog(true)}
                className="mt-8 text-[11px] font-black text-[#a26da8] uppercase tracking-widest hover:underline"
               >
                 Open Tool Catalog
               </button>
            </div>
          )}
        </div>
      )}

      {/* Integration Banner */}
      {!showCatalog && (
        <div className="p-10 bg-slate-900 rounded-[40px] text-white flex items-center justify-between overflow-hidden relative">
           <div className="relative z-10">
              <h4 className="text-xl font-black mb-2 tracking-tight">Expand with Zapier & MCP</h4>
              <p className="text-sm font-medium text-slate-400 max-w-sm">Connect your AI agents to thousands of triggers across the workspace cloud ecosystem.</p>
           </div>
           <button className="relative z-10 px-10 py-5 bg-white text-slate-900 rounded-[24px] font-black text-[11px] uppercase tracking-widest hover:bg-purple-100 transition-all shadow-2xl">Connect Hub</button>
           <div className="absolute top-0 right-0 p-4 translate-x-1/2 -translate-y-1/2 opacity-10">
              <Zap size={200} />
           </div>
        </div>
      )}
    </div>
  );
};

export default ToolsTab;
