
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
  Search,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  X,
  Calendar,
  Mail,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ToolsTabProps {
  agentId: string;
  refreshKey?: number;
}

const TOOL_TYPES = [
  { id: 'builtin', name: 'Built-in Utilities', icon: <Box size={24} />, desc: 'Core tools like Math, Search, and Time' },
  { id: 'zapier', name: 'Zapier Hub', icon: <Zap size={24} />, desc: 'Connect to 6,000+ external apps' },
  { id: 'mcp', name: 'MCP Connector', icon: <Puzzle size={24} />, desc: 'Model Context Protocol server integration' },
  { id: 'webhook', name: 'Custom Webhooks', icon: <Globe size={24} />, desc: 'Native API integrations via JSON-REST' }
];

const ToolsTab: React.FC<ToolsTabProps> = ({ agentId, refreshKey }) => {
  const [tools, setTools] = useState<StandaloneTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [configuringTool, setConfiguringTool] = useState<Partial<StandaloneTool> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  useEffect(() => {
    if (agentId !== 'new') {
      fetchTools();
      fetchCatalog();
    }
  }, [agentId, refreshKey]);

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

  const handleSaveTool = async () => {
    if (!configuringTool) return;

    // Validation for Slack
    if (configuringTool.name?.toLowerCase().includes('slack')) {
      if (!configuringTool.name) {
        toast.error('Tool name is required');
        return;
      }
      if ((configuringTool.description?.length || 0) < 30) {
        toast.error('Description must be at least 30 characters to help the LLM');
        return;
      }
      if (!configuringTool.config?.extras?.webhook_url?.startsWith('https://hooks.slack.com/')) {
        toast.error('Webhook URL must start with https://hooks.slack.com/');
        return;
      }
    } else {
      // Basic validation for other tools
      if (!configuringTool.name) {
        toast.error('Tool name is required');
        return;
      }
    }

    setIsSaving(true);
    try {
      if (configuringTool._id) {
        await apiService.standalone.agents.tools.update(agentId, configuringTool._id, configuringTool);
        toast.success('Tool updated');
      } else {
        await apiService.standalone.agents.tools.attach(agentId, configuringTool as any);
        toast.success('Tool attached');
      }
      setConfiguringTool(null);
      setShowCatalog(false);
      fetchTools();
    } catch (error) {
      toast.error('Failed to save tool configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectOAuth = async (tool: StandaloneTool) => {
    const provider = (tool.name.toLowerCase().includes('google') || tool.name.toLowerCase().includes('gmail')) ? 'google' : 'microsoft';
    setIsConnecting(tool._id);
    
    try {
      const response = await apiService.standalone.agents.tools.getOAuthUrl(agentId, tool._id, provider as any);
      if (response.success && response.data.auth_url) {
        const popup = window.open(response.data.auth_url, 'oauth_popup', 'width=600,height=700');
        
        if (!popup) {
          toast.error('Popup blocked! Please allow popups for this site.');
          setIsConnecting(null);
          return;
        }

        // Add message listener for the popup
        const messageHandler = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          if (event.data?.type === 'OAUTH_COMPLETED') {
            const { result, error: oauthError } = event.data;
            if (result === 'success') {
              toast.success('Account connected successfully');
              fetchTools();
            } else {
              toast.error(oauthError || 'Connection failed');
            }
            window.removeEventListener('message', messageHandler);
          }
        };

        window.addEventListener('message', messageHandler);

        const pollTimer = setInterval(async () => {
          if (popup.closed) {
            clearInterval(pollTimer);
            setIsConnecting(null);
            fetchTools();
            window.removeEventListener('message', messageHandler);
          }
        }, 1000);
      }
    } catch (error) {
      toast.error('Failed to initiate OAuth flow');
      setIsConnecting(null);
    }
  };

  const handleDisconnectOAuth = async (tool: StandaloneTool) => {
    if (!window.confirm(`Disconnect ${tool.name}? Documents and calendar access will be revoked.`)) return;
    
    try {
      await apiService.standalone.agents.tools.disconnectOAuth(agentId, tool._id);
      toast.success('Account disconnected');
      fetchTools();
    } catch (error) {
      toast.error('Failed to disconnect account');
    }
  };

  const handleAttachQuick = async (tc: any) => {
    if (tc.isSlack) {
      openSlackConfig();
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        type: tc.type,
        name: tc.name,
        description: tc.desc,
        enabled: true
      };
      await apiService.standalone.agents.tools.attach(agentId, payload);
      toast.success(`${tc.name} attached`);
      setShowCatalog(false);
      fetchTools();
    } catch (error) {
      toast.error('Failed to attach tool');
    } finally {
      setIsSaving(false);
    }
  };

  const openToolConfig = (existing?: StandaloneTool) => {
    if (existing) {
      if (existing.name.toLowerCase().includes('slack')) {
        setConfiguringTool({
          ...existing,
          name: existing.name || 'Post to Slack',
          description: existing.description || 'Notify the support team when the customer escalates, asks for human help, or reports an issue requiring follow-up. Do not use for routine questions.',
          config: {
            ...existing.config,
            extras: {
              webhook_url: existing.config?.extras?.webhook_url || '',
              default_channel: existing.config?.extras?.default_channel || '#support'
            }
          }
        });
      } else {
        setConfiguringTool(existing);
      }
    } else {
      // This path is usually handled by handleAttachQuick for non-slack
      setConfiguringTool({
        type: 'builtin',
        enabled: true
      });
    }
  };

  const openSlackConfig = () => {
    setConfiguringTool({
      type: 'builtin',
      name: 'Post to Slack',
      description: 'Notify the support team when the customer escalates, asks for human help, or reports an issue requiring follow-up. Do not use for routine questions.',
      config: {
        extras: {
          webhook_url: '',
          default_channel: '#support'
        }
      },
      enabled: true
    });
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

  const isSlackTool = configuringTool?.name?.toLowerCase().includes('slack');
  const isOAuthTool = configuringTool?.name?.toLowerCase().includes('google') || 
                      configuringTool?.name?.toLowerCase().includes('outlook') || 
                      configuringTool?.name?.toLowerCase().includes('gmail');

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
                {[
                  { name: 'Google Calendar', type: 'builtin', icon: <Calendar size={14} />, desc: 'Manage schedule and book meetings.' },
                  { name: 'Gmail', type: 'builtin', icon: <Mail size={14} />, desc: 'Read and search emails (read-only).' },
                  { name: 'Outlook Calendar', type: 'builtin', icon: <Calendar size={14} />, desc: 'Microsoft 365 calendar management.' },
                  { name: 'Outlook Mail', type: 'builtin', icon: <Mail size={14} />, desc: 'Microsoft 365 mail access (read-only).' },
                  { name: 'Post to Slack', type: 'builtin', icon: <MessageSquare size={14} />, desc: 'Send notifications to your team on escalation.', isSlack: true },
                  ...(catalog.length > 0 ? catalog.filter((c: any) => c.name !== 'Calendar' && c.name !== 'Email') : [
                    { name: 'Google Search', type: 'builtin', icon: <Search size={14} />, desc: 'Grounded web search for real-time fact checking.' },
                    { name: 'Financial Math', type: 'builtin', icon: <Lock size={14} />, desc: 'High-precision currency and math processing.' },
                    { name: 'JSON Parser', type: 'builtin', icon: <Box size={14} />, desc: 'Structural data extraction from unstructured chat.' }
                  ])
                ].map((tc: any, idx) => (
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
                     <button 
                       onClick={() => handleAttachQuick(tc)}
                       className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#a26da8] transition-all shadow-lg shadow-gray-100"
                     >
                       Attach
                     </button>
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
              <div key={tool._id} className="group flex flex-col md:flex-row items-start md:items-center justify-between p-7 bg-white border border-gray-100 rounded-[32px] hover:border-[#a26da8] hover:shadow-2xl hover:shadow-purple-50 transition-all duration-300">
                 <div className="flex items-center gap-6 flex-1">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${tool.enabled ? 'bg-purple-100 text-[#a26da8]' : 'bg-gray-100 text-gray-400'}`}>
                       {tool.name.toLowerCase().includes('slack') ? <MessageSquare size={24} /> : 
                        tool.name.toLowerCase().includes('calendar') ? <Calendar size={24} /> :
                        tool.name.toLowerCase().includes('mail') || tool.name.toLowerCase().includes('gmail') ? <Mail size={24} /> :
                        tool.type === 'zapier' ? <Zap size={24} /> : tool.type === 'mcp' ? <Puzzle size={24} /> : <Box size={24} />}
                    </div>
                    <div className="flex-1">
                       <div className="flex items-center gap-3">
                          <h5 className="text-sm font-black text-gray-900 uppercase tracking-tight">{tool.name}</h5>
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                            tool.status === 'connected' ? 'bg-green-50 text-green-600' : 
                            tool.status === 'error' ? 'bg-red-50 text-red-600' : 
                            'bg-gray-100 text-gray-400'
                          }`}>
                            <div className={`w-1 h-1 rounded-full ${
                              tool.status === 'connected' ? 'bg-green-500' : 
                              tool.status === 'error' ? 'bg-red-500' : 
                              'bg-gray-400'
                            }`} />
                            {tool.status || (tool.enabled ? 'connected' : 'disconnected')}
                          </div>
                          {tool.config?.auth?.connected_email && (
                            <span className="text-[10px] font-bold text-[#a26da8] truncate max-w-[150px]">
                              {tool.config.auth.connected_email}
                            </span>
                          )}
                       </div>
                       <p className="text-[10px] font-medium text-gray-400 mt-1 line-clamp-1 max-w-md">{tool.description}</p>
                    </div>
                 </div>

                 <div className="flex items-center gap-8 mt-4 md:mt-0">
                    {/* Connection Buttons for OAuth tools */}
                    {(tool.name.toLowerCase().includes('google') || tool.name.toLowerCase().includes('outlook') || tool.name.toLowerCase().includes('gmail')) && (
                      <div className="flex items-center gap-2">
                        {tool.status === 'connected' ? (
                          <>
                            <button 
                              onClick={() => handleConnectOAuth(tool)}
                              className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2"
                            >
                              <RefreshCw size={12} className={isConnecting === tool._id ? 'animate-spin' : ''} />
                              Re-connect
                            </button>
                            <button 
                              onClick={() => handleDisconnectOAuth(tool)}
                              className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                            >
                              Disconnect
                            </button>
                          </>
                        ) : (
                          <button 
                            onClick={() => handleConnectOAuth(tool)}
                            disabled={isConnecting === tool._id}
                            className="px-5 py-2.5 bg-[#a26da8] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#8e5a94] transition-all shadow-lg shadow-purple-50 flex items-center gap-2"
                          >
                            {isConnecting === tool._id ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />}
                            Connect {(tool.name.toLowerCase().includes('google') || tool.name.toLowerCase().includes('gmail')) ? 'Google' : 'Microsoft'}
                          </button>
                        )}
                      </div>
                    )}

                    <div className="text-right hidden lg:block">
                       <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Usage</p>
                       <p className="text-xs font-black text-gray-900">Fired {tool.run_count || 0} times</p>
                    </div>

                    {tool.last_error && tool.status === 'error' && (
                      <div className="p-2 bg-red-50 text-red-500 rounded-lg group/error relative">
                        <AlertCircle size={16} />
                        <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 text-white text-[8px] font-medium rounded-lg opacity-0 group-hover/error:opacity-100 transition-opacity pointer-events-none">
                          {tool.last_error}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                       <button 
                        onClick={() => openToolConfig(tool)}
                        className="p-3 text-gray-300 hover:text-[#a26da8] hover:bg-purple-50 rounded-xl transition-all"
                       >
                         <Settings size={18} />
                       </button>
                       <button 
                        onClick={() => handleToggle(tool._id)}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                          tool.enabled ? 'bg-purple-50 text-[#a26da8] hover:bg-purple-100' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                        }`}
                       >
                         {tool.enabled ? 'Enabled' : 'Disabled'}
                       </button>
                       <button 
                        onClick={() => handleDelete(tool._id)}
                        className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                       >
                         <Trash2 size={18} />
                       </button>
                    </div>
                 </div>
              </div>
            ))
          ) : (
            <div className="py-24 border-2 border-dashed border-gray-100 rounded-[40px] flex flex-col items-center justify-center text-center">
               <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-200 mb-6">
                  <Puzzle size={28} />
               </div>
               <h3 className="text-sm font-black text-gray-900 mb-2">No tools yet.</h3>
               <p className="font-medium text-gray-400 text-xs max-w-xs leading-relaxed">
                 Tools let your agent take actions during a conversation — for example, post to Slack when a customer escalates.
               </p>
               <button 
                onClick={() => setShowCatalog(true)}
                className="mt-8 px-8 py-3 bg-[#a26da8] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#8e5a94] transition-all shadow-lg shadow-purple-100"
               >
                 + Add Tool
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

      {/* Configuration Modal */}
      {configuringTool && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setConfiguringTool(null)} />
          <div className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
             <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-[#a26da8]">
                      {isSlackTool ? <MessageSquare size={24} /> : 
                       isOAuthTool ? (configuringTool.name?.toLowerCase().includes('calendar') ? <Calendar size={24} /> : <Mail size={24} />) :
                       <Box size={24} />}
                   </div>
                   <div>
                      <h4 className="text-lg font-black text-gray-900">
                        {isSlackTool ? 'Configure Slack' : 
                         isOAuthTool ? `Configure ${configuringTool.name}` :
                         'Configure Tool'}
                      </h4>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {isSlackTool ? 'Built-in Notification Tool' : 
                         isOAuthTool ? 'OAuth-Backed Powerup' :
                         'Agent Extension'}
                      </p>
                   </div>
                </div>
                <button onClick={() => setConfiguringTool(null)} className="p-2 text-gray-300 hover:text-gray-900 transition-colors">
                   <X size={24} />
                </button>
             </div>

             <div className="p-8 space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tool Name</label>
                   <input 
                    type="text"
                    value={configuringTool.name || ''}
                    onChange={(e) => setConfiguringTool({...configuringTool, name: e.target.value})}
                    placeholder="Enter tool name..."
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-purple-100 transition-all"
                   />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description (LLM Guidance)</label>
                   <textarea 
                    value={configuringTool.description || ''}
                    onChange={(e) => setConfiguringTool({...configuringTool, description: e.target.value})}
                    placeholder="Explain when the agent should use this tool..."
                    rows={3}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-purple-100 transition-all resize-none"
                   />
                   <p className="text-[9px] font-bold text-gray-400 px-1"> Describe triggers precisely. {isSlackTool && 'Min 30 chars.'}</p>
                </div>

                {isSlackTool && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Webhook URL</label>
                      <input 
                        type="text"
                        value={configuringTool.config?.extras?.webhook_url || ''}
                        onChange={(e) => setConfiguringTool({
                          ...configuringTool, 
                          config: { 
                            ...configuringTool.config, 
                            extras: { ...configuringTool.config?.extras, webhook_url: e.target.value } 
                          }
                        })}
                        placeholder="https://hooks.slack.com/services/..."
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-[10px] font-mono focus:ring-2 focus:ring-purple-100 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Default Channel</label>
                      <input 
                        type="text"
                        value={configuringTool.config?.extras?.default_channel || ''}
                        onChange={(e) => setConfiguringTool({
                          ...configuringTool, 
                          config: { 
                            ...configuringTool.config, 
                            extras: { ...configuringTool.config?.extras, default_channel: e.target.value } 
                          }
                        })}
                        placeholder="#support"
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-purple-100 transition-all"
                      />
                    </div>
                  </div>
                )}

                {isSlackTool && (
                  <div className="p-4 bg-blue-50 rounded-2xl flex gap-3">
                     <Link2 className="text-blue-500 shrink-0" size={18} />
                     <p className="text-[10px] font-medium text-blue-700 leading-relaxed">
                       Need a Webhook? Create one at <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer" className="font-black underline hover:text-blue-900">api.slack.com</a>. Webhooks are bound to a specific workspace channel.
                     </p>
                  </div>
                )}

                {isOAuthTool && configuringTool.status !== 'connected' && (
                  <div className="p-6 bg-purple-50 rounded-[30px] border border-purple-100">
                    <div className="flex gap-4">
                      <div className="p-3 bg-white rounded-2xl text-[#a26da8] shadow-sm">
                        <Lock size={20} />
                      </div>
                      <div>
                        <h5 className="text-sm font-black text-gray-900 uppercase">Auth Required</h5>
                        <p className="text-xs font-medium text-gray-500 mt-1">This tool requires secure connection to your {(configuringTool.name?.toLowerCase().includes('google') || configuringTool.name?.toLowerCase().includes('gmail')) ? 'Google' : 'Microsoft'} account via OAuth.</p>
                      </div>
                    </div>
                  </div>
                )}
             </div>

             <div className="p-8 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <button 
                    onClick={() => setConfiguringTool({...configuringTool, enabled: !configuringTool.enabled})}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      configuringTool.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                    }`}
                   >
                     {configuringTool.enabled ? <CheckCircle2 size={14} /> : <X size={14} />}
                     {configuringTool.enabled ? 'Enabled' : 'Disabled'}
                   </button>
                </div>
                <div className="flex items-center gap-4">
                   <button 
                    onClick={() => setConfiguringTool(null)}
                    className="px-6 py-3 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-all"
                   >
                     Cancel
                   </button>
                   <button 
                    onClick={handleSaveTool}
                    disabled={isSaving}
                    className="px-10 py-4 bg-gray-900 text-white rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200 disabled:opacity-50 flex items-center gap-2"
                   >
                     {isSaving && <Loader2 size={14} className="animate-spin" />}
                     {configuringTool._id ? 'Update Tool' : 'Attach Tool'}
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolsTab;
