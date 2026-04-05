import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';

interface OrgHistoryProps {
  refreshTrigger: number;
}

const OrgHistory: React.FC<OrgHistoryProps> = ({ refreshTrigger: parentRefreshTrigger }) => {
  console.log("OrgHistory rendered with refreshTrigger:", parentRefreshTrigger);
  const [creditRequests, setCreditRequests] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [transferRequests, setTransferRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [credits, joins, transfers] = await Promise.all([
          apiService.org.getCreditRequests(),
          apiService.org.getJoinRequests(),
          apiService.org.getTransferRequests()
        ]);
        if (credits?.success) {
          console.log("Credit Requests:", credits.data);
          setCreditRequests(credits.data);
        }
        if (joins?.success) {
          console.log("Join Requests:", joins.data);
          setJoinRequests(joins.data);
        }
        if (transfers?.success) {
          console.log("Transfer Requests:", transfers.data);
          setTransferRequests(transfers.data);
        }
      } catch (err) {
        console.error("Failed to fetch history data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [parentRefreshTrigger, localRefreshTrigger]);

  if (loading) return <div className="p-6 text-center">Loading history...</div>;

  return (
    <div className="p-6 space-y-8">
      <button 
        onClick={() => { console.log("Manual refresh"); setLocalRefreshTrigger(prev => prev + 1); }}
        className="px-4 py-2 bg-[#a26da8] text-white font-bold rounded-xl hover:bg-[#8e5c94] transition-colors text-sm"
      >
        Refresh History
      </button>

      {/* 1. Department Credit Requests Table */}
      <section>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Department Credit Requests</h3>
        <div className="overflow-x-auto border border-gray-100 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Department</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Amount Requested</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Reason</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Initiated By</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Request Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Processed Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {creditRequests.map((req: any) => (
                <tr key={req._id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{req.department?.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{req.amount}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{req.reason}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{req.requestedBy?.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{new Date(req.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{req.status}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{req.processedAt ? new Date(req.processedAt).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. Join/Invite Requests Table */}
      <section>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Join/Invite Requests</h3>
        <div className="overflow-x-auto border border-gray-100 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Invited User</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Target Dept</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Invited By</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Request Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Processed Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {joinRequests.map((req: any) => (
                <tr key={req._id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{req.invitedEmail}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{req.targetDepartment?.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{req.requestedBy?.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{new Date(req.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{req.status}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{req.processedAt ? new Date(req.processedAt).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Transfer Requests Table */}
      <section>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Transfer Requests</h3>
        <div className="overflow-x-auto border border-gray-100 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Employee</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Current Dept</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Destination Dept</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Request Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Processed Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transferRequests.map((req: any) => (
                <tr key={req._id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{req.user?.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{req.fromDepartment?.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{req.toDepartment?.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{req.status}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{new Date(req.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{req.processedAt ? new Date(req.processedAt).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default OrgHistory;
