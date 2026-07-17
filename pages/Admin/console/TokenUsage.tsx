import React, { useState, useEffect } from 'react';
import {
  Coins,
  Users,
  Activity,
  DollarSign,
  RefreshCw,
  X,
  Loader2,
  TrendingUp,
  Layers,
  Clock
} from 'lucide-react';
import { apiService } from '../../../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

const nf = new Intl.NumberFormat('en-US');
const fmt = (n: number) => nf.format(Math.round(n || 0));
const compact = (n: number) => {
  n = n || 0;
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(Math.round(n));
};
const rangeParams = (days: number) => {
  const to = new Date(); // now — full timestamp so TODAY's activity is included (date-only "to" = midnight = excludes today)
  const from = new Date();
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);
  return { from: from.toISOString(), to: to.toISOString() };
};
const timeAgo = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const RANGES = [
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: '90 Days', days: 90 },
];

const TokenUsage: React.FC = () => {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);

  const [activeOnly, setActiveOnly] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [days, activeOnly]);

  const fetchAll = async () => {
    setLoading(true);
    const params: any = { ...rangeParams(days), _: Date.now() };
    try {
      const [sumRes, userRes, tsRes] = await Promise.all([
        apiService.adminConsole.usage.summary(params),
        apiService.adminConsole.usage.byUser({ ...params, sort: 'tokens', order: 'desc', page: 1, limit: 200, ...(activeOnly ? { active: true } : {}) }),
        apiService.adminConsole.usage.timeseries(params),
      ]);
      if (sumRes.success) setSummary(sumRes.data);
      if (userRes.success) setUsers(userRes.data || []);
      if (tsRes.success) setSeries(tsRes.data || []);
    } catch (e: any) {
      toast.error(e?.message ? `Usage: ${e.message}` : 'Failed to load token usage');
    } finally {
      setLoading(false);
    }
  };

  const openUser = async (userId: string) => {
    setSelectedUserId(userId);
    setUserDetail(null);
    setLoadingUser(true);
    try {
      const res = await apiService.adminConsole.usage.user(userId, { ...rangeParams(days), _: Date.now() });
      if (res.success) setUserDetail(res.data);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load user usage');
    } finally {
      setLoadingUser(false);
    }
  };

  const totals = summary?.totals || {};
  const byModule: any[] = summary?.by_module || [];
  const maxModuleTokens = Math.max(1, ...byModule.map(m => m.total_tokens || 0));
  const maxSeries = Math.max(1, ...series.map(s => s.total_tokens || 0));
  const maxUserTokens = Math.max(1, ...users.map(u => u.total_tokens || 0));

  const kpis = [
    { label: 'Total Tokens', value: fmt(totals.total_tokens || 0), sub: compact(totals.total_tokens || 0), icon: Coins, grad: 'from-[#a26da8] to-[#8e5a94]' },
    { label: 'Active Users', value: `${totals.active_users ?? 0}`, sub: `of ${totals.total_users_in_scope ?? 0} in scope`, icon: Users, grad: 'from-[#6fcbbd] to-[#4db6ac]' },
    { label: 'Interactions', value: fmt(totals.interactions || 0), sub: 'runs & evaluations', icon: Activity, grad: 'from-[#6ea8fe] to-[#4c8dff]' },
    { label: 'Cost (USD)', value: `$${(totals.cost_usd || 0).toFixed(2)}`, sub: 'Agent Builder only', icon: DollarSign, grad: 'from-[#7ee0c0] to-[#16a34a]' },
  ];

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-[32px] font-black text-gray-900 tracking-tight">Token Usage</h1>
          <p className="text-gray-500 font-medium mt-1">Consumption across every Avagama module and user, platform-wide (all organizations) — for monitoring &amp; billing.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-white border border-gray-100 rounded-2xl shadow-sm">
            {RANGES.map(r => (
              <button
                key={r.days}
                onClick={() => setDays(r.days)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${days === r.days ? 'bg-[#a26da8] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button onClick={fetchAll} className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-[#a26da8] hover:border-purple-200 transition-all shadow-sm">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => <div key={i} className="bg-white border border-gray-100 rounded-[28px] h-32 animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpis.map(k => (
              <div key={k.label} className="bg-white border border-gray-100 rounded-[28px] p-6 shadow-sm relative overflow-hidden">
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${k.grad} flex items-center justify-center text-white shadow-sm mb-4`}>
                  <k.icon size={18} />
                </div>
                <div className="text-3xl font-black text-gray-900 tracking-tight leading-none">{k.value}</div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">{k.label}</div>
                <div className="text-[10px] font-medium text-gray-400 mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Tokens by module */}
            <div className="bg-white border border-gray-100 rounded-[28px] p-7 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Layers size={16} className="text-[#a26da8]" />
                <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.15em]">Tokens by Module</h3>
              </div>
              <div className="space-y-4">
                {byModule.length === 0 && <p className="text-xs text-gray-400 font-medium py-6 text-center">No usage in this range.</p>}
                {byModule.map(m => {
                  const tracked = m.tracked !== false;
                  const pct = tracked ? Math.max(2, ((m.total_tokens || 0) / maxModuleTokens) * 100) : 0;
                  return (
                    <div key={m.key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-black text-gray-700 uppercase tracking-wider">{m.label}</span>
                        {tracked ? (
                          <span className="text-[11px] font-black text-gray-900">{fmt(m.total_tokens || 0)} <span className="text-gray-400 font-bold">tok</span></span>
                        ) : (
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{m.count || 0} messages</span>
                        )}
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        {tracked
                          ? <div className="h-full rounded-full bg-gradient-to-r from-[#a26da8] to-[#6fcbbd]" style={{ width: `${pct}%` }} />
                          : <div className="h-full rounded-full bg-gray-200" style={{ width: '100%' }} />}
                      </div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{m.count || 0} {m.unit || 'runs'} · {m.active_users || 0} users</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Usage over time */}
            <div className="bg-white border border-gray-100 rounded-[28px] p-7 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp size={16} className="text-[#6fcbbd]" />
                <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.15em]">Tokens Over Time</h3>
              </div>
              {series.length === 0 ? (
                <p className="text-xs text-gray-400 font-medium py-6 text-center">No activity in this range.</p>
              ) : (
                <div className="flex items-end gap-2 h-48 overflow-x-auto custom-scrollbar pb-2">
                  {series.map((d, i) => {
                    const h = Math.max(4, ((d.total_tokens || 0) / maxSeries) * 160);
                    return (
                      <div key={i} className="flex flex-col items-center gap-2 shrink-0 group" style={{ width: 34 }}>
                        <div className="text-[8px] font-black text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">{compact(d.total_tokens || 0)}</div>
                        <div
                          className="w-6 rounded-t-lg bg-gradient-to-t from-[#a26da8] to-[#6fcbbd] hover:from-[#8e5a94] transition-all"
                          style={{ height: h }}
                          title={`${d.date}: ${fmt(d.total_tokens || 0)} tokens · ${d.count || 0} runs`}
                        />
                        <div className="text-[7.5px] font-bold text-gray-400 -rotate-45 origin-center whitespace-nowrap mt-1">{(d.date || '').slice(5)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* User leaderboard */}
          <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
            <div className="px-7 py-5 border-b border-gray-50 flex items-center gap-2">
              <Users size={16} className="text-[#a26da8]" />
              <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.15em]">User Leaderboard</h3>
              <button
                onClick={() => setActiveOnly(a => !a)}
                className={`ml-auto px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeOnly ? 'bg-[#a26da8] text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                title={activeOnly ? 'Showing only users with usage' : 'Showing all signed-in users'}
              >
                {activeOnly ? 'Active only' : 'All users'}
              </button>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{users.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-7 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">User</th>
                    <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tokens</th>
                    <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden md:table-cell">Share</th>
                    <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Interactions</th>
                    <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden lg:table-cell">Cost</th>
                    <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden lg:table-cell">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.length === 0 ? (
                    <tr><td colSpan={6} className="px-7 py-16 text-center text-gray-400 text-sm font-medium">No user activity in this range.</td></tr>
                  ) : users.map(u => (
                    <tr key={u.user_id} onClick={() => openUser(u.user_id)} className="hover:bg-purple-50/30 transition-colors cursor-pointer group">
                      <td className="px-7 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-50 to-teal-50 flex items-center justify-center text-gray-700 font-black text-xs">
                            {(u.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-black text-gray-900 truncate group-hover:text-[#a26da8] transition-colors">{u.email}</div>
                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{u.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs font-black text-gray-900">{fmt(u.total_tokens || 0)}</td>
                      <td className="px-4 py-4 hidden md:table-cell w-40">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-[#a26da8] to-[#6fcbbd]" style={{ width: `${Math.max(3, ((u.total_tokens || 0) / maxUserTokens) * 100)}%` }} />
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-gray-600">{fmt(u.interactions || 0)}</td>
                      <td className="px-4 py-4 text-xs font-bold text-gray-600 hidden lg:table-cell">${(u.cost_usd || 0).toFixed(2)}</td>
                      <td className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden lg:table-cell">{timeAgo(u.last_active)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* User drill-down drawer */}
      <AnimatePresence>
        {selectedUserId && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedUserId(null)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-[110] flex flex-col rounded-l-[28px] overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                <div className="min-w-0">
                  <h2 className="text-lg font-black text-gray-900 truncate">{userDetail?.user?.email || 'User usage'}</h2>
                  <p className="text-xs font-black text-[#a26da8] uppercase tracking-widest mt-1">{userDetail?.user?.role || 'Drill-down'}</p>
                </div>
                <button onClick={() => setSelectedUserId(null)} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-gray-900 transition-all"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-auto p-8 bg-[#fbfbfe] space-y-6">
                {loadingUser || !userDetail ? (
                  <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-[#a26da8]" size={28} /></div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white border border-gray-100 rounded-2xl p-4">
                        <div className="text-xl font-black text-gray-900">{compact(userDetail.totals?.total_tokens || 0)}</div>
                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Tokens</div>
                      </div>
                      <div className="bg-white border border-gray-100 rounded-2xl p-4">
                        <div className="text-xl font-black text-gray-900">{fmt(userDetail.totals?.interactions || 0)}</div>
                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Interactions</div>
                      </div>
                      <div className="bg-white border border-gray-100 rounded-2xl p-4">
                        <div className="text-xl font-black text-gray-900">${(userDetail.totals?.cost_usd || 0).toFixed(2)}</div>
                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Cost</div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-[24px] p-6">
                      <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.15em] mb-4 flex items-center gap-2"><Layers size={14} className="text-[#a26da8]" /> Per-Module</h3>
                      {(() => {
                        const mods = (userDetail.by_module || []).filter((m: any) => (m.total_tokens || 0) > 0 || (m.count || 0) > 0);
                        const maxM = Math.max(1, ...mods.map((m: any) => m.total_tokens || 0));
                        if (mods.length === 0) return <p className="text-xs text-gray-400 font-medium">No module usage.</p>;
                        return (
                          <div className="space-y-3">
                            {mods.map((m: any) => (
                              <div key={m.key}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] font-black text-gray-700 uppercase tracking-wider">{m.label}</span>
                                  <span className="text-[10px] font-black text-gray-900">{m.tracked !== false ? `${fmt(m.total_tokens || 0)} tok` : `${m.count || 0} msgs`}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full bg-gradient-to-r from-[#a26da8] to-[#6fcbbd]" style={{ width: `${m.tracked !== false ? Math.max(3, ((m.total_tokens || 0) / maxM) * 100) : 0}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="bg-white border border-gray-100 rounded-[24px] p-6">
                      <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.15em] mb-4 flex items-center gap-2"><Clock size={14} className="text-[#6fcbbd]" /> Daily Activity</h3>
                      {(() => {
                        const ts = userDetail.timeseries || [];
                        const maxT = Math.max(1, ...ts.map((d: any) => d.total_tokens || 0));
                        if (ts.length === 0) return <p className="text-xs text-gray-400 font-medium">No daily activity.</p>;
                        return (
                          <div className="flex items-end gap-1.5 h-32 overflow-x-auto custom-scrollbar">
                            {ts.map((d: any, i: number) => (
                              <div key={i} className="flex flex-col items-center gap-1 shrink-0" style={{ width: 26 }}>
                                <div className="w-4 rounded-t bg-gradient-to-t from-[#a26da8] to-[#6fcbbd]" style={{ height: Math.max(3, ((d.total_tokens || 0) / maxT) * 100) }} title={`${d.date}: ${fmt(d.total_tokens || 0)} tokens`} />
                                <div className="text-[7px] font-bold text-gray-400 whitespace-nowrap">{(d.date || '').slice(5)}</div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TokenUsage;
