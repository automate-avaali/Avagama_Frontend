import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ChevronRight,
  ChevronLeft,
  Menu
} from 'lucide-react';
import { apiService } from '../../services/api';
import { AdminMeta } from '../../types/admin-console';
import toast from 'react-hot-toast';
import BlueprintGallery from './console/BlueprintGallery';
import SolutionsLab from './console/SolutionsLab';
import AuditLogs from './console/AuditLogs';
import TokenUsage from './console/TokenUsage';
import SystemAdmin from './SystemAdmin';

const AdminConsole: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'agents' | 'solutions' | 'api' | 'overview' | 'orgs' | 'audit' | 'usage' | 'system'>('agents');
  const [userRole, setUserRole] = useState('');
  const [meta, setMeta] = useState<AdminMeta | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // Collapsible sidebar (desktop rail) + off-canvas drawer (mobile) — mirrors Orchestration.
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem('adminConsoleSidebarCollapsed') === '1'; } catch { return false; }
  });
  const toggleSidebar = () => setSidebarCollapsed(prev => {
    const next = !prev;
    try { localStorage.setItem('adminConsoleSidebarCollapsed', next ? '1' : '0'); } catch {}
    return next;
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const apply = () => { setIsDesktop(mq.matches); if (mq.matches) setMobileSidebarOpen(false); };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  const railCollapsed = isDesktop && sidebarCollapsed;

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

  const menuItems: { id: string; label: string; icon: any; group: string; disabled?: boolean }[] = [
    { id: 'agents', label: 'Agent Blueprints', icon: Puzzle, group: 'Manage' },
    { id: 'solutions', label: 'Solutions Lab', icon: Settings, group: 'Manage' },
    { id: 'audit', label: 'Audit Log', icon: History, group: 'Platform' },
    { id: 'usage', label: 'Token Usage', icon: BarChart3, group: 'Platform' },
  ];

  const adminNav: { label: string; icon: any; show: boolean; tab?: 'system'; to?: string }[] = [
    { label: 'System Admin', tab: 'system' as const, show: userRole === 'TENANT_ADMIN', icon: Terminal },
    { label: 'Org Admin', to: '/admin/org', show: userRole === 'SUPER_ADMIN_ROLE', icon: Building2 },
    { label: 'Dept Admin', to: '/admin/dept', show: userRole === 'ADMIN_ROLE' || userRole === 'SUPER_ADMIN_ROLE', icon: UserIcon },
  ].filter(i => i.show);

  return (
    <div className="flex flex-1 min-h-[520px] bg-[#fafafa] relative overflow-hidden">
      {/* Mobile drawer backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar — off-canvas drawer on mobile, collapsible rail on desktop */}
      <aside
        className={`bg-white text-gray-500 flex flex-col shrink-0 border-r border-gray-100 transition-[width,transform] duration-300 ease-in-out
          fixed inset-y-0 left-0 z-[65] w-64 shadow-2xl
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:z-auto lg:translate-x-0 lg:shadow-none ${railCollapsed ? 'lg:w-[76px]' : 'lg:w-64'}`}
      >
        {/* Header + collapse (desktop) / close (mobile) */}
        <div className={`h-16 shrink-0 border-b border-gray-100 flex items-center bg-white ${railCollapsed ? 'lg:justify-center lg:px-0' : ''} justify-between px-5`}>
          {!railCollapsed && <span className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em]">Admin Console</span>}
          <button
            onClick={toggleSidebar}
            title={railCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex w-9 h-9 rounded-xl items-center justify-center text-gray-400 hover:text-[#a26da8] hover:bg-purple-50 transition-all shrink-0"
          >
            {railCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            title="Close menu"
            className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#a26da8] hover:bg-purple-50 transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable nav */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
          {['Manage', 'Platform'].map(group => (
            <div key={group} className="mb-6">
              {railCollapsed
                ? <div className="mx-2 mb-2 border-t border-gray-100" />
                : <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-4 mb-3">{group}</h3>}
              <nav className="flex flex-col gap-1">
                {menuItems.filter(item => item.group === group).map(item => (
                  <button
                    key={item.id}
                    onClick={() => { if (!item.disabled) { setActiveTab(item.id as any); setMobileSidebarOpen(false); } }}
                    disabled={item.disabled}
                    title={railCollapsed ? item.label : undefined}
                    className={`group flex items-center gap-3 rounded-2xl transition-all text-xs font-black uppercase tracking-widest ${railCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3.5'} ${activeTab === item.id ? 'bg-gradient-to-br from-[#a26da8] to-[#8e5a94] text-white shadow-lg shadow-purple-100' : item.disabled ? 'opacity-40 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                  >
                    <item.icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === item.id ? 'text-white' : 'text-gray-400 group-hover:text-[#a26da8]'}`} />
                    {!railCollapsed && item.label}
                  </button>
                ))}
              </nav>
            </div>
          ))}

          {/* Administration — System Admin opens INSIDE the console (keeps this sidebar);
              Org/Dept Admin navigate to their pages. Each entry keeps its exact original
              role-gating — no access changes, only placement. */}
          {adminNav.length > 0 && (
            <div className="mb-6">
              {railCollapsed
                ? <div className="mx-2 mb-2 border-t border-gray-100" />
                : <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-4 mb-3">Administration</h3>}
              <nav className="flex flex-col gap-1">
                {adminNav.map(item => {
                  const active = !!item.tab && activeTab === item.tab;
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        if (item.tab) setActiveTab(item.tab);
                        else if (item.to) navigate(item.to);
                        setMobileSidebarOpen(false);
                      }}
                      title={railCollapsed ? item.label : undefined}
                      className={`group flex items-center gap-3 rounded-2xl transition-all text-xs font-black uppercase tracking-widest ${railCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3.5'} ${active ? 'bg-gradient-to-br from-[#a26da8] to-[#8e5a94] text-white shadow-lg shadow-purple-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                      <item.icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-gray-400 group-hover:text-[#a26da8]'}`} />
                      {!railCollapsed && item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar — opens the sidebar drawer */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white shrink-0">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            title="Open menu"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-[#a26da8] hover:bg-purple-50 border border-gray-200 transition-all shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em]">Admin Console</span>
        </div>

        {activeTab !== 'system' && (
          <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 shrink-0 relative z-10">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search blueprints, solutions, audit logs..."
                className="w-full bg-[#f6f7f9] border border-gray-100 rounded-xl py-2.5 pl-11 pr-4 text-xs font-bold outline-none focus:border-purple-200 transition-all uppercase tracking-widest placeholder:normal-case placeholder:font-medium placeholder:tracking-normal"
              />
            </div>
          </header>
        )}

        <main className={`overflow-auto bg-[#fbfbfe] flex-1 ${activeTab === 'system' ? '' : 'p-4 md:p-10'}`}>
          {activeTab === 'agents' && <BlueprintGallery meta={meta} />}
          {activeTab === 'solutions' && <SolutionsLab meta={meta} />}
          {activeTab === 'audit' && <AuditLogs />}
          {activeTab === 'usage' && <TokenUsage />}
          {activeTab === 'system' && <SystemAdmin />}
        </main>
      </div>
    </div>
  );
};

export default AdminConsole;
