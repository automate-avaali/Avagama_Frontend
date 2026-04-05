import React from 'react';

interface CreditRequest {
  _id: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
  processedAt?: string;
  department: { name: string };
  requestedBy: { email: string };
}

interface Props {
  requests: CreditRequest[];
}

const CreditRequestsTable: React.FC<Props> = ({ requests }) => {
  return (
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
          {requests.map((req) => (
            <tr key={req._id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">{req.department.name}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{req.amount.toLocaleString()}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{req.reason}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{req.requestedBy.email}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{new Date(req.createdAt).toLocaleDateString()}</td>
              <td className="px-6 py-4 text-sm font-bold text-gray-900 uppercase">{req.status}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{req.processedAt ? new Date(req.processedAt).toLocaleDateString() : 'N/A'}</td>
            </tr>
          ))}
          {requests.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-gray-500 font-medium">No credit requests found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CreditRequestsTable;
