import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Puzzle, 
  Settings, 
  Terminal, 
  BarChart3, 
  Building2, 
  History,
  Search,
  Plus,
  MoreHorizontal,
  X,
  Trash2,
  Check,
  User as UserIcon,
  ChevronRight
} from 'lucide-react';
import { apiService } from '../../services/api';
import { AdminMeta } from '../../types/admin-console';
import toast from 'react-hot-toast';
import BlueprintGallery from './console/BlueprintGallery';
import SolutionsLab from './console/SolutionsLab';
import AuditLogs from './console/AuditLogs';

const AdminConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'agents' | 'solutions' | 'api' | 'overview' | 'orgs' | 'audit'>('agents');
  const [userRole, setUserRole] = useState('');
  const [meta, setMeta] = useState<AdminMeta | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    setUserRole(user.role);
    fetchMeta();
  }, []);

  const fetchMeta = async () => {
    try {
      setLoadingMeta(true);
      const response = await apiService.adminConsole.getMeta();
      if (response.success) {
        setMeta(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch admin meta:', error);
    } finally {
      setLoadingMeta(false);
    }
  };

  const menuItems = [
    { id: 'agents', label: 'Agent Blueprints', icon: Puzzle, group: 'Manage' },
    { id: 'solutions', label: 'Solutions Lab', icon: Settings, group: 'Manage' },
    { id: 'api', label: 'Backend / API', icon: Terminal, group: 'Manage' },
    { id: 'overview', label: 'Overview', icon: BarChart3, group: 'Platform', disabled: true },
    { id: 'orgs', label: 'Organizations', icon: Building2, group: 'Platform', disabled: true },
    { id: 'audit', label: 'Audit Log', icon: History, group: 'Platform' },
  ];

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-[#f6f7f9]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0e0b1a] text-[#c9c4d6] flex flex-col p-4 shrink-0 border-r border-[#211c33]">
        <div className="flex items-center gap-3 px-2 py-4 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-purple-900/50">A</div>
          <div>
            <h2 className="text-white font-black text-sm tracking-tight">AVAGAMA AI</h2>
            <span className="text-[10px] text-[#9a93ad] font-black uppercase tracking-widest">Admin Console</span>
          </div>
        </div>

        {['Manage', 'Platform'].map(group => (
          <div key={group} className="mb-6">
            <h3 className="text-[10px] font-black text-[#6b6480] uppercase tracking-[0.2em] px-4 mb-3">{group}</h3>
            <nav className="flex flex-col gap-1">
              {menuItems.filter(item => item.group === group).map(item => (
                <button
                  key={item.id}
                  onClick={() => !item.disabled && setActiveTab(item.id as any)}
                  disabled={item.disabled}
                  className={`group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all text-xs font-black uppercase tracking-widest ${activeTab === item.id ? 'bg-gradient-to-br from-[#6d28d9] to-[#4c1d95] text-white shadow-xl shadow-purple-900/30' : item.disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#1c1730] hover:text-white'}`}
                >
                  <item.icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${activeTab === item.id ? 'text-white' : 'text-[#6b6480] group-hover:text-white'}`} />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        ))}

        <div className="mt-auto pt-6 border-t border-[#211c33]">
           <div className="bg-[#1c1730] rounded-2xl p-4 border border-[#2d2645]">
             <p className="text-[9px] text-[#6b6480] font-black uppercase tracking-[0.2em] mb-2 leading-relaxed">System Status</p>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" />
                <span className="text-[10px] font-black text-white tracking-widest uppercase">Admin Active</span>
             </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0 relative z-10">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search blueprints, solutions, audit logs..."
              className="w-full bg-[#f6f7f9] border border-gray-100 rounded-xl py-2.5 pl-11 pr-4 text-xs font-bold outline-none focus:border-purple-200 transition-all uppercase tracking-widest placeholder:normal-case placeholder:font-medium placeholder:tracking-normal"
            />
          </div>
          <div className="flex items-center gap-6">
             <div className="flex flex-col items-end">
                <span className="px-3 py-1 bg-[#f3effe] text-[#4c1d95] rounded-lg text-[9px] font-black tracking-[0.1em] uppercase shadow-sm border border-purple-50">{userRole || 'TENANT_ADMIN'}</span>
             </div>
             <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
                <div className="text-right">
                   <p className="text-xs font-black text-gray-900 leading-none">Admin User</p>
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Avagama AI</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#4c1d95] flex items-center justify-center text-white font-black text-sm shadow-lg shadow-purple-100">AU</div>
             </div>
          </div>
        </header>

        <main className="p-10 overflow-auto bg-[#fbfbfe] flex-1">
          {activeTab === 'agents' && <BlueprintGallery meta={meta} />}
          {activeTab === 'solutions' && <SolutionsLab meta={meta} />}
          {activeTab === 'audit' && <AuditLogs />}
          
          {activeTab === 'api' && (
            <div className="max-w-4xl animate-fadeIn">
               <h1 className="text-[32px] font-black text-gray-900 tracking-tight mb-2">Backend / API</h1>
               <p className="text-gray-500 font-medium mb-10 leading-relaxed">Administrative endpoints for managing global blueprints and multi-agent solutions.</p>
               
               <div className="space-y-10">
                  <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                       <Puzzle className="w-32 h-32" />
                    </div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                       <span className="w-8 h-8 rounded-xl bg-purple-50 text-[#6d28d9] flex items-center justify-center"><Puzzle className="w-4 h-4" /></span>
                       Agent Blueprints
                    </h3>
                    <div className="bg-[#0e0b1a] rounded-[24px] p-8 font-mono text-[11px] text-[#d6d1e6] space-y-4 overflow-x-auto shadow-inner">
                       <div className="flex items-center gap-4 pb-4 border-b border-[#211c33]">
                         <span className="bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-lg font-black tracking-widest text-[9px]">POST</span>
                         <span className="tracking-tight">/api/v4/admin/agent-blueprints</span>
                         <span className="text-[#6b6480] ml-auto">Create new expert blueprint</span>
                       </div>
                       <div className="flex items-center gap-4 pb-4 border-b border-[#211c33]">
                         <span className="bg-teal-500/20 text-teal-400 px-2.5 py-1 rounded-lg font-black tracking-widest text-[9px]">GET</span>
                         <span className="tracking-tight">/api/v4/admin/agent-blueprints</span>
                         <span className="text-[#6b6480] ml-auto">List with advanced filtering</span>
                       </div>
                       <div className="flex items-center gap-4">
                         <span className="bg-red-500/20 text-red-400 px-2.5 py-1 rounded-lg font-black tracking-widest text-[9px]">DELETE</span>
                         <span className="tracking-tight">/api/v4/admin/agent-blueprints/:id</span>
                         <span className="text-[#6b6480] ml-auto">Revoke global availability</span>
                       </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                       <Settings className="w-32 h-32" />
                    </div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                       <span className="w-8 h-8 rounded-xl bg-purple-50 text-[#6d28d9] flex items-center justify-center"><Settings className="w-4 h-4" /></span>
                       Solutions Lab
                    </h3>
                    <div className="bg-[#0e0b1a] rounded-[24px] p-8 font-mono text-[11px] text-[#d6d1e6] space-y-4 overflow-x-auto shadow-inner">
                       <div className="flex items-center gap-4 pb-4 border-b border-[#211c33]">
                         <span className="bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-lg font-black tracking-widest text-[9px]">POST</span>
                         <span className="tracking-tight">/api/v4/admin/solutions</span>
                         <span className="text-[#6b6480] ml-auto">Register complex workflow</span>
                       </div>
                       <div className="flex items-center gap-4">
                         <span className="bg-teal-500/20 text-teal-400 px-2.5 py-1 rounded-lg font-black tracking-widest text-[9px]">GET</span>
                         <span className="tracking-tight">/api/v4/admin/solutions</span>
                         <span className="text-[#6b6480] ml-auto">Fetch solution templates</span>
                       </div>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminConsole;
