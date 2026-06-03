
import React from 'react';
import { AgentChannel } from '../../../types/standalone';
import { Globe, MessageSquare, Share2, ExternalLink, Copy, QrCode, Rocket, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ChannelsTabProps {
  channels: AgentChannel[];
  agentId: string;
  slug: string;
  shareToken?: string;
  deployment?: {
    is_deployed: boolean;
    slug: string;
    public_url: string;
    deployed_at: string;
    undeployed_at?: string | null;
    deploy_count: number;
    chat_count: number;
    last_chat_at?: string;
  };
  onToggle: (type: AgentChannel['type']) => void;
  onDeploy: (slug?: string) => Promise<void>;
  onUndeploy: () => Promise<void>;
}

const CHANNELS = [
  { type: 'web', name: 'Web Widget', icon: <Globe size={20} />, desc: 'Embed on your website as a chat bubble or full page.' },
  { type: 'whatsapp', name: 'WhatsApp Business', icon: <MessageSquare size={20} />, desc: 'Connect to Official WhatsApp Business API.' },
  { type: 'instagram', name: 'Instagram DM', icon: <MessageSquare size={20} />, desc: 'Automate support on your Instagram Business profile.' },
  { type: 'slack', name: 'Slack Bot', icon: <MessageSquare size={20} />, desc: 'Direct internal tool for company-wide productivity.' }
];

const ChannelsTab: React.FC<ChannelsTabProps> = ({ 
  channels, 
  agentId, 
  slug, 
  shareToken, 
  deployment, 
  onToggle,
  onDeploy,
  onUndeploy
}) => {
  const getChannel = (type: string) => channels.find(c => c.type === type);
  const [isDeploying, setIsDeploying] = React.useState(false);
  const [isConfirmingUndeploy, setIsConfirmingUndeploy] = React.useState(false);
  const [customSlug, setCustomSlug] = React.useState('');
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const copyShareLink = (urlToCopy?: string) => {
    const url = urlToCopy || deployment?.public_url || `${window.location.origin}/chat/${slug}${shareToken ? `?token=${shareToken}` : ''}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied!');
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      await onDeploy(customSlug || undefined);
    } finally {
      setIsDeploying(false);
    }
  };

  const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/;

  return (
    <div className="space-y-12 animate-fadeIn pb-10">
      {/* Share & Deployment Section */}
      <section className="space-y-6">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#a26da8]">
               <Share2 size={20} />
            </div>
            <div>
               <h3 className="text-lg font-black text-gray-900 tracking-tight">Public Access & Deployment</h3>
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Control how users interact with your agent</p>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Share Link Card */}
            <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm flex flex-col justify-between group hover:border-purple-100 transition-all">
               <div>
                  <div className="flex justify-between items-start mb-6">
                     <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-purple-100 group-hover:text-[#a26da8] transition-all">
                        <Share2 size={24} />
                     </div>
                     <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${shareToken ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {shareToken ? 'Published' : 'Draft'}
                     </span>
                  </div>
                  <h4 className="text-base font-black text-gray-900 mb-2">Shareable Preview Link</h4>
                  <p className="text-xs font-medium text-gray-500 leading-relaxed mb-6">Standard ephemeral test link for internal sharing and quick feedback.</p>
                  
                  <div className="space-y-4">
                     <div className="relative">
                        <input 
                           readOnly 
                           value={`${window.location.origin}/chat/${slug}${shareToken ? `?token=${shareToken}` : ''}`}
                           className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-xs font-mono text-gray-600 outline-none pr-12"
                        />
                        <button 
                           onClick={() => copyShareLink()}
                           className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-900 transition-all"
                        >
                           <Copy size={16} />
                        </button>
                     </div>
                  </div>
               </div>

               <div className="mt-8 flex gap-3">
                  <button 
                     onClick={() => window.open(`/chat/${slug}${shareToken ? `?token=${shareToken}` : ''}`, '_blank')}
                     className="flex-1 py-4 bg-gray-50 text-gray-900 rounded-[20px] font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                  >
                     <ExternalLink size={14} />
                     Preview Link
                  </button>
               </div>
            </div>

            {/* Production Deployment Card */}
            <div className={`rounded-[32px] p-8 border transition-all duration-500 flex flex-col justify-between ${
               deployment?.is_deployed 
               ? 'bg-white border-green-100 shadow-2xl shadow-green-50' 
               : 'bg-white border-gray-100 shadow-sm'
            }`}>
               <div>
                  <div className="flex justify-between items-start mb-6">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                        deployment?.is_deployed ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'
                     }`}>
                        <Rocket size={24} />
                     </div>
                     <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        deployment?.is_deployed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                     }`}>
                        {deployment?.is_deployed ? '● Deployed to Production' : 'Not Deployed'}
                     </span>
                  </div>
                  
                  <h4 className="text-base font-black text-gray-900 mb-2">Deploy Agent</h4>
                  <p className="text-xs font-medium text-gray-500 leading-relaxed mb-6">
                     {deployment?.is_deployed 
                        ? 'Your agent index is live at a stable, slug-based production URL.' 
                        : 'Mint a stable production URL for your agent on our enterprise-grade infrastructure.'}
                  </p>

                  {deployment?.is_deployed ? (
                     <div className="space-y-4 animate-fadeIn">
                        <div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Production Slug</p>
                           <p className="text-xs font-mono font-bold text-gray-900 bg-gray-50 px-4 py-3 rounded-xl inline-block">{deployment.slug}</p>
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Public Chat URL</p>
                           <div className="relative">
                              <input 
                                 readOnly 
                                 value={deployment.public_url}
                                 className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-xs font-mono text-gray-600 outline-none pr-12"
                              />
                              <button 
                                 onClick={() => copyShareLink(deployment.public_url)}
                                 className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-900 transition-all"
                              >
                                 <Copy size={16} />
                              </button>
                           </div>
                        </div>
                        <div className="flex items-center gap-6 pt-2">
                           <div>
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Deployed At</p>
                              <p className="text-[10px] font-bold text-gray-600">{new Date(deployment.deployed_at).toLocaleDateString()} · {new Date(deployment.deployed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                           </div>
                           <div>
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Chats</p>
                              <p className="text-[10px] font-bold text-gray-600">{deployment.chat_count || 0}</p>
                           </div>
                        </div>
                     </div>
                  ) : (
                     <div className="space-y-6">
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                           <button 
                              onClick={() => setShowAdvanced(!showAdvanced)}
                              className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-all"
                           >
                              {showAdvanced ? '▼ Hide Advanced Options' : '▶ Advanced Deployment Options'}
                           </button>
                           {showAdvanced && (
                              <div className="mt-4 space-y-4 animate-fadeIn">
                                 <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Custom Deployment Slug</label>
                                    <input 
                                       placeholder="e.g. dental-clinic-bot (optional)"
                                       value={customSlug}
                                       onChange={(e) => setCustomSlug(e.target.value.toLowerCase())}
                                       className="w-full p-4 bg-white border border-gray-100 rounded-xl text-xs font-mono text-gray-600 focus:border-[#a26da8] outline-none transition-all"
                                    />
                                    <p className="text-[9px] font-medium text-gray-400 mt-2">2-64 chars. Lowercase letters, digits, and hyphens only.</p>
                                 </div>
                              </div>
                           )}
                        </div>
                        <button 
                           onClick={handleDeploy}
                           disabled={isDeploying || (customSlug && !SLUG_RE.test(customSlug))}
                           className="w-full py-5 bg-gray-900 text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-3"
                        >
                           {isDeploying ? <Loader2 size={18} className="animate-spin" /> : <Rocket size={18} />}
                           {isDeploying ? 'Deploying...' : 'Deploy Agent'}
                        </button>
                     </div>
                  )}
               </div>

               {deployment?.is_deployed && (
                  <div className="mt-8 flex gap-3 pt-6 border-t border-gray-50">
                     <button 
                        onClick={() => window.open(deployment.public_url.replace('/chat', '/info'), '_blank')}
                        className="flex-1 py-3.5 bg-gray-50 text-gray-900 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-gray-100 transition-all"
                     >
                        Check Endpoints
                     </button>
                     <button 
                        onClick={() => {
                          if (isConfirmingUndeploy) {
                            onUndeploy();
                            setIsConfirmingUndeploy(false);
                          } else {
                            setIsConfirmingUndeploy(true);
                          }
                        }}
                        className={`px-6 py-3.5 border rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${
                          isConfirmingUndeploy 
                          ? 'bg-red-500 border-red-500 text-white hover:bg-red-600' 
                          : 'bg-white border-red-50 text-red-400 hover:bg-red-50 hover:text-red-500'
                        }`}
                        onMouseLeave={() => setIsConfirmingUndeploy(false)}
                     >
                        {isConfirmingUndeploy ? 'Confirm Undeploy?' : 'Undeploy'}
                     </button>
                  </div>
               )}
            </div>
         </div>
      </section>

      <div className="h-px bg-gray-50" />

      {/* Omnichannel Section */}
      <section className="space-y-8">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#4db6ac]">
               <Globe size={20} />
            </div>
            <div>
               <h3 className="text-lg font-black text-gray-900 tracking-tight">Channel Connectivity</h3>
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Publish your agent across multiple platforms</p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {CHANNELS.map(ch => {
              const active = getChannel(ch.type)?.enabled;
              return (
                <div key={ch.type} className={`group p-8 rounded-[40px] border transition-all duration-300 ${active ? 'bg-white border-[#a26da8] shadow-2xl shadow-purple-100' : 'bg-white border-gray-100'}`}>
                   <div className="flex justify-between items-start mb-8">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${active ? 'bg-purple-100 text-[#a26da8]' : 'bg-gray-50 text-gray-400'}`}>
                         {ch.icon}
                      </div>
                      <button 
                        onClick={() => onToggle(ch.type as any)}
                        className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                          active 
                          ? 'bg-[#a26da8] text-white shadow-lg shadow-purple-200' 
                          : 'bg-white border border-gray-100 text-gray-400 hover:text-gray-900'
                        }`}
                      >
                         {active ? 'Enabled' : 'Configure'}
                      </button>
                   </div>
                   <h4 className="text-base font-black text-gray-900 mb-2 truncate">{ch.name}</h4>
                   <p className="text-xs font-medium text-gray-500 leading-relaxed mb-6">{ch.desc}</p>
                   
                   {active && (
                     <div className="flex items-center gap-2 pt-6 border-t border-gray-50 text-[10px] font-black text-[#a26da8] uppercase tracking-tight">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Live Connection Established
                     </div>
                   )}
                </div>
              );
            })}
         </div>
      </section>
    </div>
  );
};

export default ChannelsTab;
