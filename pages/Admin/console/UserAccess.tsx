import React, { useEffect, useMemo, useState } from 'react';
import { apiService } from '../../../services/api';
import {
  ShieldCheck,
  Search,
  Check,
  Loader2,
  Save,
  Users as UsersIcon,
  Bot,
  Lock,
  RefreshCw,
  Info,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// UserAccess — TENANT_ADMIN screen to grant/revoke feature access and restrict
// which agents a user can see (Feature-Based Access Control). Purely additive:
// reuses the existing read-only user/agent lists and the new /permissions APIs.
// ---------------------------------------------------------------------------

interface FeatureItem { key: string; label: string; }
interface OrgUser { _id: string; email: string; role?: string; organization?: { name?: string }; }
interface AgentItem { _id: string; name?: string; slug?: string; }

// Short helper descriptions for the known feature keys (falls back to the label).
const FEATURE_DESCRIPTIONS: Record<string, string> = {
  processEvaluation: 'AI Discovery — Process Evaluation',
  company: 'AI Discovery — Company',
  domain: 'AI Discovery — Domain',
  agents: 'Agents section (Builder, Playground & Solutions)',
  agentPlayground: 'Agent Playground',
  agentSolutions: 'Agent Solutions',
  orchestration: 'Workflow Orchestration',
};

type Mode = 'all' | 'restricted';

const UserAccess: React.FC = () => {
  const role = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem('user') || '{}').role || ''; } catch { return ''; }
  }, []);

  const [users, setUsers] = useState<OrgUser[]>([]);
  const [catalog, setCatalog] = useState<FeatureItem[]>([]);
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  const [userSearch, setUserSearch] = useState('');
  const [agentSearch, setAgentSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<OrgUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);

  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [mode, setMode] = useState<Mode>('all');
  const [allowedAgentIds, setAllowedAgentIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (role !== 'TENANT_ADMIN') return;
    (async () => {
      setLoadingLists(true);
      const [usersRes, catRes, agentsRes] = await Promise.allSettled([
        apiService.system.getUsers(),
        apiService.permissions.features(),
        apiService.standalone.agents.list(),
      ]);

      if (usersRes.status === 'fulfilled') {
        const d = usersRes.value?.data;
        setUsers(Array.isArray(d) ? d : []);
      }
      if (catRes.status === 'fulfilled') {
        const d = catRes.value?.data;
        setCatalog(Array.isArray(d) ? d : []);
      }
      if (agentsRes.status === 'fulfilled') {
        const v = agentsRes.value;
        const d = Array.isArray(v?.data) ? v.data : Array.isArray(v?.agents) ? v.agents : Array.isArray(v) ? v : [];
        setAgents(d);
      }
      setLoadingLists(false);
    })();
  }, [role]);

  const selectUser = async (u: OrgUser) => {
    setSelectedUser(u);
    setLoadingUser(true);
    try {
      const res = await apiService.permissions.getUser(u._id);
      const eff = res?.data?.effective || {};
      setIsAdminUser(!!eff.isAdmin);
      // Prefill toggles from the effective permissions (fills defaults for unset keys).
      const fx: Record<string, boolean> = {};
      (catalog.length ? catalog : []).forEach(f => {
        fx[f.key] = eff.features ? eff.features[f.key] !== false : true;
      });
      // Cover any effective keys not present in the catalog too.
      Object.entries(eff.features || {}).forEach(([k, v]) => { fx[k] = v !== false; });
      setFeatures(fx);
      const acc = eff.agentAccess || {};
      setMode(acc.mode === 'restricted' ? 'restricted' : 'all');
      setAllowedAgentIds(Array.isArray(acc.allowedAgentIds) ? acc.allowedAgentIds.map(String) : []);
    } catch (e: any) {
      showToast(e?.message || 'Failed to load this user’s permissions', 'error');
      setSelectedUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const toggleFeature = (key: string) => setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleAgent = (id: string) =>
    setAllowedAgentIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const save = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const payload = {
        features,
        agentAccess: {
          mode,
          allowedAgentIds: mode === 'restricted' ? allowedAgentIds : [],
        },
      };
      const res = await apiService.permissions.updateUser(selectedUser._id, payload);
      // Re-sync from the server’s effective result to confirm the change stuck.
      const eff = res?.data?.effective;
      if (eff) {
        setIsAdminUser(!!eff.isAdmin);
        if (eff.agentAccess) {
          setMode(eff.agentAccess.mode === 'restricted' ? 'restricted' : 'all');
          setAllowedAgentIds(Array.isArray(eff.agentAccess.allowedAgentIds) ? eff.agentAccess.allowedAgentIds.map(String) : []);
        }
      }
      showToast('Permissions updated', 'success');
    } catch (e: any) {
      showToast(e?.message || 'Failed to update permissions', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (role !== 'TENANT_ADMIN') {
    return (
      <div className="min-h-screen bg-[#fcfdff] flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-gray-900">Not authorized</h3>
          <p className="text-sm text-gray-500 mt-1">Only a Tenant Admin can manage user access.</p>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(u => (u.email || '').toLowerCase().includes(userSearch.toLowerCase()));
  const filteredAgents = agents.filter(a =>
    (a.name || a.slug || '').toLowerCase().includes(agentSearch.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#fcfdff] p-4 md:p-8 relative">
      {toast && (
        <div className="fixed top-24 right-6 z-[10000] animate-slideIn">
          <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border-l-4 bg-white ${toast.type === 'success' ? 'border-green-500' : 'border-red-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {toast.type === 'success' ? <Check className="w-5 h-5" /> : <Info className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{toast.type}</p>
              <p className="font-bold text-sm text-gray-900">{toast.message}</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#a26da8] to-[#8e5a94] text-white flex items-center justify-center shadow-lg shadow-purple-100 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">User Access</h1>
            <p className="text-gray-500 mt-1">Grant features and restrict agents per user. Users with nothing set keep full access.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users list */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col lg:h-[640px]">
            <div className="p-4 border-b border-gray-100 bg-gray-50/40">
              <div className="flex items-center gap-2 mb-3">
                <UsersIcon className="w-4 h-4 text-[#a26da8]" />
                <span className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Users</span>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by email…"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-200 transition-all"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loadingLists ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-gray-200 animate-spin" /></div>
              ) : filteredUsers.length === 0 ? (
                <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest py-12">No users found</p>
              ) : (
                filteredUsers.map(u => (
                  <button
                    key={u._id}
                    onClick={() => selectUser(u)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-all ${selectedUser?._id === u._id ? 'bg-purple-50/60 border-l-4 border-l-[#a26da8]' : 'hover:bg-gray-50'}`}
                  >
                    <p className="text-sm font-bold text-gray-900 truncate">{u.email}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{(u.role || 'USER_ROLE').replace('_ROLE', '').replace('_', ' ')}</span>
                      {u.organization?.name && <span className="text-[9px] font-bold text-gray-300 truncate">· {u.organization.name}</span>}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Editor */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col lg:h-[640px]">
            {!selectedUser ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-200 mb-6">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-1">Select a user</h3>
                <p className="text-sm text-gray-400 max-w-xs">Choose a user on the left to view and edit which features and agents they can access.</p>
              </div>
            ) : loadingUser ? (
              <div className="flex-1 flex items-center justify-center"><Loader2 className="w-7 h-7 text-purple-200 animate-spin" /></div>
            ) : (
              <>
                <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-gray-900 truncate">{selectedUser.email}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{(selectedUser.role || 'USER_ROLE').replace('_ROLE', '').replace('_', ' ')}</p>
                  </div>
                  <button
                    onClick={save}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#a26da8] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#8e5a94] transition-all shadow-lg shadow-purple-100 disabled:opacity-50 shrink-0"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-8">
                  {isAdminUser && (
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                      <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-xs font-medium text-amber-700 leading-relaxed">
                        This user is an admin and <b>bypasses all restrictions</b> — feature and agent limits set here won’t affect what they can see.
                      </p>
                    </div>
                  )}

                  {/* Features */}
                  <section>
                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Feature Access</h4>
                    <div className="space-y-2">
                      {(catalog.length ? catalog : Object.keys(features).map(k => ({ key: k, label: k }))).map(f => {
                        const on = features[f.key] !== false;
                        return (
                          <div key={f.key} className="flex items-center justify-between gap-4 p-3.5 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900">{f.label}</p>
                              <p className="text-[11px] text-gray-400">{FEATURE_DESCRIPTIONS[f.key] || f.key}</p>
                            </div>
                            <button
                              onClick={() => toggleFeature(f.key)}
                              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${on ? 'bg-[#a26da8]' : 'bg-gray-200'}`}
                              title={on ? 'Allowed' : 'Denied'}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Agent access */}
                  <section>
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Agent Access</h4>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Restrict to specific agents</span>
                        <button
                          onClick={() => setMode(m => (m === 'restricted' ? 'all' : 'restricted'))}
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${mode === 'restricted' ? 'bg-[#a26da8]' : 'bg-gray-200'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${mode === 'restricted' ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </label>
                    </div>

                    {mode === 'all' ? (
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <Bot className="w-4 h-4 text-gray-400 shrink-0" />
                        <p className="text-xs font-medium text-gray-500">This user can access <b>all agents</b>. Turn on the toggle to limit them to a chosen set.</p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="p-3 border-b border-gray-100 bg-gray-50/40 flex items-center justify-between gap-3">
                          <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search agents…"
                              value={agentSearch}
                              onChange={e => setAgentSearch(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-200 transition-all"
                            />
                          </div>
                          <span className="text-[10px] font-black text-[#a26da8] uppercase tracking-widest bg-purple-50 px-2.5 py-1 rounded-lg shrink-0">{allowedAgentIds.length} selected</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                          {loadingLists ? (
                            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-gray-200 animate-spin" /></div>
                          ) : filteredAgents.length === 0 ? (
                            <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest py-10">No agents found</p>
                          ) : (
                            filteredAgents.map(a => {
                              const id = String(a._id);
                              const checked = allowedAgentIds.includes(id);
                              return (
                                <button
                                  key={id}
                                  onClick={() => toggleAgent(id)}
                                  className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-all text-left"
                                >
                                  <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${checked ? 'bg-[#a26da8] border-[#a26da8] text-white' : 'border-gray-300 text-transparent'}`}>
                                    <Check className="w-3.5 h-3.5" />
                                  </span>
                                  <span className="text-sm font-bold text-gray-800 truncate">{a.name || a.slug || id}</span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </section>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAccess;
