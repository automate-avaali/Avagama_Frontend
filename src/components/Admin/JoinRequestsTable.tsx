import React from 'react';

interface JoinRequest {
  _id: string;
  invitedEmail: string;
  status: string;
  createdAt: string;
  processedAt?: string;
  targetDepartment: { name: string };
  requestedBy: { email: string };
}

interface Props {
  requests: JoinRequest[];
}

const JoinRequestsTable: React.FC<Props> = ({ requests }) => {
  return (
    <div className="overflow-x-auto border border-gray-100 rounded-2xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50/50">
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Invited Email</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Target Department</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Requested By</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Request Date</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Status</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Processed Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {requests.map((req) => (
            <tr key={req._id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">{req.invitedEmail}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{req.targetDepartment?.name || 'N/A'}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{req.requestedBy?.email || 'N/A'}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{new Date(req.createdAt).toLocaleDateString()}</td>
              <td className="px-6 py-4 text-sm font-bold text-gray-900 uppercase">{req.status}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{req.processedAt ? new Date(req.processedAt).toLocaleDateString() : 'N/A'}</td>
            </tr>
          ))}
          {requests.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-gray-500 font-medium">No join/invite requests found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default JoinRequestsTable;
