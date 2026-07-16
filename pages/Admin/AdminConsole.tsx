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
    { id: 'audit', label: 'Audit Log', icon: History, group: 'Platform' },
  ];

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-[#fafafa]">
      {/* Sidebar */}
      <aside className="w-64 bg-white text-gray-500 flex flex-col p-4 shrink-0 border-r border-gray-100">
        <div className="pt-4" />

        {['Manage', 'Platform'].map(group => (
          <div key={group} className="mb-6">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-4 mb-3">{group}</h3>
            <nav className="flex flex-col gap-1">
              {menuItems.filter(item => item.group === group).map(item => (
                <button
                  key={item.id}
                  onClick={() => !item.disabled && setActiveTab(item.id as any)}
                  disabled={item.disabled}
                  className={`group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all text-xs font-black uppercase tracking-widest ${activeTab === item.id ? 'bg-gradient-to-br from-[#a26da8] to-[#8e5a94] text-white shadow-lg shadow-purple-100' : item.disabled ? 'opacity-40 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  <item.icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${activeTab === item.id ? 'text-white' : 'text-gray-400 group-hover:text-[#a26da8]'}`} />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        ))}

        <div className="mt-auto pt-6 border-t border-gray-100">
           <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
             <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] mb-2 leading-relaxed">System Status</p>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" />
                <span className="text-[10px] font-black text-gray-900 tracking-widest uppercase">Admin Active</span>
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
        </header>

        <main className="p-10 overflow-auto bg-[#fbfbfe] flex-1">
          {activeTab === 'agents' && <BlueprintGallery meta={meta} />}
          {activeTab === 'solutions' && <SolutionsLab meta={meta} />}
          {activeTab === 'audit' && <AuditLogs />}
        </main>
      </div>
    </div>
  );
};

export default AdminConsole;
