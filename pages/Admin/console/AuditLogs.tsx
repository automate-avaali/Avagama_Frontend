import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Shield, 
  Activity,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { apiService } from '../../../services/api';
import { AdminAuditLog } from '../../../types/admin-console';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // The audit endpoint filters by resource/action/page (no free-text search),
      // so we fetch the page and filter it client-side below.
      const response = await apiService.adminConsole.audit.list({ page });
      if (response.success) {
        setLogs(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch logs:', error);
      toast.error(error?.message ? `Audit: ${error.message}` : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const q = search.trim().toLowerCase();
  const visibleLogs = q
    ? logs.filter(l =>
        [l.actor_email, l.action, l.resource, l.resource_name]
          .some(v => (v || '').toString().toLowerCase().includes(q)))
    : logs;

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-[32px] font-black text-gray-900 tracking-tight">Audit Log</h1>
          <p className="text-gray-500 font-medium mt-1">Immutable record of all administrative actions within the console.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-gray-100 text-gray-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:border-purple-200 transition-all flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by actor, action or resource..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#f6f7f9] border-none rounded-xl py-3 pl-11 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-100 transition-all"
            />
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Page</span>
                <div className="flex items-center gap-1">
                   <button onClick={() => setPage(p => Math.max(1, p - 1))} className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                   <span className="w-8 text-center text-xs font-black">{page}</span>
                   <button onClick={() => setPage(p => p + 1)} className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors"><ChevronRight className="w-4 h-4" /></button>
                </div>
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="bg-gray-50/50">
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actor</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Resource</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Details</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {loading ? (
                    [1, 2, 3, 4, 5].map(i => (
                      <tr key={i} className="animate-pulse">
                         <td colSpan={6} className="px-8 py-6 h-16 bg-gray-50/20" />
                      </tr>
                    ))
                 ) : visibleLogs.length > 0 ? (
                    visibleLogs.map(log => (
                       <tr key={log._id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-8 py-5 whitespace-nowrap">
                             <div className="text-xs font-bold text-gray-900">{format(new Date(log.createdAt), 'MMM dd, yyyy')}</div>
                             <div className="text-[10px] font-medium text-gray-400">{format(new Date(log.createdAt), 'HH:mm:ss')}</div>
                          </td>
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#f5f0fa] text-[#8e5a94] flex items-center justify-center text-[10px] font-black">
                                   {log.actor_email.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                   <div className="text-xs font-black text-gray-900">{log.actor_email}</div>
                                   <div className="text-[9px] font-black text-[#a26da8] uppercase tracking-widest">{log.actor_role}</div>
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-5">
                             <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{log.action}</span>
                          </td>
                          <td className="px-8 py-5">
                             <div className="text-xs font-bold text-gray-900">{log.resource_name}</div>
                             <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{log.resource}</div>
                          </td>
                          <td className="px-8 py-5">
                             <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${log.status === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                {log.status === 'success' ? <Shield className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                                {log.status}
                             </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                             <button className="p-2 text-gray-300 hover:text-gray-900 transition-colors">
                                <ArrowUpRight className="w-5 h-5" />
                             </button>
                          </td>
                       </tr>
                    ))
                 ) : (
                    <tr>
                       <td colSpan={6} className="px-8 py-20 text-center">
                          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                             <ClipboardList className="w-8 h-8 text-gray-200" />
                          </div>
                          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No log entries found</p>
                       </td>
                    </tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
