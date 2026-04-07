import React, { useEffect, useState } from 'react';
import { useCortex } from '../../context/CortexContext';

// Local API helper to avoid modifying api.ts
const BASE_URL = 'https://avagama-backend-ckm9.onrender.com/api';
const getHeaders = (isJson = true) => {
  const token = sessionStorage.getItem('token');
  return {
    ...(isJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const handleResponse = async (response: Response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error: any = new Error(data.message || data.error || `Server Error: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
};

const deptApi = {
  getDashboard: async () => {
    const response = await fetch(`${BASE_URL}/dept/dashboard`, { headers: getHeaders() });
    return handleResponse(response);
  },
  getUsers: async () => {
    const response = await fetch(`${BASE_URL}/dept/users`, { headers: getHeaders() });
    return handleResponse(response);
  },
  onboardUser: async (data: { email: string; password: string }) => {
    const response = await fetch(`${BASE_URL}/dept/onboard`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  requestCredits: async (data: { amount: number, reason: string }) => {
    const response = await fetch(`${BASE_URL}/dept/credits/request`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  assignCredits: async (userId: string, data: { amount: number }) => {
    const response = await fetch(`${BASE_URL}/dept/credits/assign/${userId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  returnCredits: async (userId: string, data: { amount: number }) => {
    const response = await fetch(`${BASE_URL}/dept/credits/return/${userId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  getDepartments: async () => {
    const response = await fetch(`${BASE_URL}/dept/departments`, { headers: getHeaders() });
    return handleResponse(response);
  },
  transferRequest: async (data: { userId: string, toDepartmentId: string }) => {
    const response = await fetch(`${BASE_URL}/dept/transfer-request`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  removeUser: async (userId: string) => {
    const response = await fetch(`${BASE_URL}/dept/users/${userId}/remove`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return handleResponse(response);
  },
  getDefaultUsers: async () => {
    const response = await fetch(`${BASE_URL}/dept/users/default`, { headers: getHeaders() });
    return handleResponse(response);
  },
  addUser: async (userId: string) => {
    const response = await fetch(`${BASE_URL}/dept/users/${userId}/add`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return handleResponse(response);
  },
  getInvites: async () => {
    const response = await fetch(`${BASE_URL}/dept/invites`, { headers: getHeaders() });
    return handleResponse(response);
  },
  getInvitesHistory: async () => {
    const response = await fetch(`${BASE_URL}/dept/invites/history`, { headers: getHeaders() });
    return handleResponse(response);
  },
  getTransferRequests: async () => {
    const response = await fetch(`${BASE_URL}/dept/transfer-requests`, { headers: getHeaders() });
    return handleResponse(response);
  },
  getTransferRequestsHistory: async () => {
    const response = await fetch(`${BASE_URL}/dept/transfer-requests/history`, { headers: getHeaders() });
    return handleResponse(response);
  }
};

const DeptAdminDashboard: React.FC = () => {
  const { refreshCredits } = useCortex();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [usersData, setUsersData] = useState<any[]>([]);
  const [defaultUsers, setDefaultUsers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [invitesHistory, setInvitesHistory] = useState<any[]>([]);
  const [transferRequests, setTransferRequests] = useState<any[]>([]);
  const [transferRequestsHistory, setTransferRequestsHistory] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'roster' | 'networking' | 'history'>('roster');

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal States
  const [onboardUserModal, setOnboardUserModal] = useState<{ isOpen: boolean; email: string; password: string }>({ isOpen: false, email: '', password: '' });
  const [requestBudgetModal, setRequestBudgetModal] = useState<{ isOpen: boolean; amount: number | ''; reason: string }>({ isOpen: false, amount: '', reason: '' });
  const [assignCreditsModal, setAssignCreditsModal] = useState<{ isOpen: boolean; userId: string; userEmail: string; amount: number | '' }>({ isOpen: false, userId: '', userEmail: '', amount: '' });
  const [revokeCreditsModal, setRevokeCreditsModal] = useState<{ isOpen: boolean; userId: string; userEmail: string; amount: number | '' }>({ isOpen: false, userId: '', userEmail: '', amount: '' });
  const [transferModal, setTransferModal] = useState<{ isOpen: boolean; userId: string; userEmail: string; toDepartmentId: string }>({ isOpen: false, userId: '', userEmail: '', toDepartmentId: '' });
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
    isDangerous?: boolean;
    confirmText?: string;
  }>({ isOpen: false, title: '', message: '', action: async () => {} });
  const [isConfirming, setIsConfirming] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message: message || (type === 'success' ? 'Operation successful' : 'An error occurred'), type });
    setTimeout(() => setToast(null), 3000);
    if (type === 'success') {
      window.dispatchEvent(new Event('userProfileUpdated'));
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [dash, users, defUsers, invs, invsHist, trans, transHist, depts] = await Promise.all([
        deptApi.getDashboard(),
        deptApi.getUsers(),
        deptApi.getDefaultUsers(),
        deptApi.getInvites(),
        deptApi.getInvitesHistory(),
        deptApi.getTransferRequests(),
        deptApi.getTransferRequestsHistory(),
        deptApi.getDepartments()
      ]);
      setDashboardData(dash.data);
      setUsersData(users.data);
      setDefaultUsers(defUsers.data);
      setInvites(invs.data);
      setInvitesHistory(invsHist.data);
      setTransferRequests(trans.data);
      setTransferRequestsHistory(transHist.data);
      setDepartments(depts.data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleOnboardUser = async () => {
    if (!onboardUserModal.email.trim() || !onboardUserModal.password.trim()) {
      showToast('Email and password are required', 'error');
      return;
    }
    setIsConfirming(true);
    try {
      const res = await deptApi.onboardUser({ email: onboardUserModal.email, password: onboardUserModal.password });
      setOnboardUserModal({ isOpen: false, email: '', password: '' });
      showToast(res.message, 'success');
      loadAllData();
    } catch (err: any) {
      setOnboardUserModal({ isOpen: false, email: '', password: '' });
      showToast(err.message, 'error');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRequestBudget = async () => {
    if (!requestBudgetModal.amount || requestBudgetModal.amount <= 0) {
      showToast('Amount must be greater than 0', 'error');
      return;
    }
    setIsConfirming(true);
    try {
      const res = await deptApi.requestCredits({ amount: Number(requestBudgetModal.amount), reason: requestBudgetModal.reason });
      setRequestBudgetModal({ isOpen: false, amount: '', reason: '' });
      showToast(res.message, 'success');
      setTimeout(() => {
        refreshCredits();
      }, 1000);
      loadAllData();
    } catch (err: any) {
      setRequestBudgetModal({ isOpen: false, amount: '', reason: '' });
      showToast(err.message, 'error');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleAssignCredits = async () => {
    if (!assignCreditsModal.amount || assignCreditsModal.amount <= 0) {
      showToast('Amount must be greater than 0', 'error');
      return;
    }
    setIsConfirming(true);
    try {
      const res = await deptApi.assignCredits(assignCreditsModal.userId, { amount: Number(assignCreditsModal.amount) });
      setAssignCreditsModal({ isOpen: false, userId: '', userEmail: '', amount: '' });
      showToast(res.message, 'success');
      setTimeout(() => {
        refreshCredits();
      }, 1000);
      loadAllData();
    } catch (err: any) {
      setAssignCreditsModal({ isOpen: false, userId: '', userEmail: '', amount: '' });
      showToast(err.message, 'error');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRevokeCredits = async () => {
    if (!revokeCreditsModal.amount || revokeCreditsModal.amount <= 0) {
      showToast('Amount must be greater than 0', 'error');
      return;
    }
    setIsConfirming(true);
    try {
      const res = await deptApi.returnCredits(revokeCreditsModal.userId, { amount: Number(revokeCreditsModal.amount) });
      setRevokeCreditsModal({ isOpen: false, userId: '', userEmail: '', amount: '' });
      showToast(res.message, 'success');
      setTimeout(() => {
        refreshCredits();
      }, 1000);
      loadAllData();
    } catch (err: any) {
      setRevokeCreditsModal({ isOpen: false, userId: '', userEmail: '', amount: '' });
      showToast(err.message, 'error');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleTransferUser = async () => {
    if (!transferModal.toDepartmentId) {
      showToast('Please select a target department', 'error');
      return;
    }
    setIsConfirming(true);
    try {
      const res = await deptApi.transferRequest({ userId: transferModal.userId, toDepartmentId: transferModal.toDepartmentId });
      setTransferModal({ isOpen: false, userId: '', userEmail: '', toDepartmentId: '' });
      showToast(res.message, 'success');
      loadAllData();
    } catch (err: any) {
      setTransferModal({ isOpen: false, userId: '', userEmail: '', toDepartmentId: '' });
      showToast(err.message, 'error');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRemoveUser = (userId: string, email: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove User',
      message: `Are you sure you want to remove ${email} from this department? They will be moved back to the default organization pool.`,
      confirmText: 'Remove',
      isDangerous: true,
      action: async () => {
        try {
          const res = await deptApi.removeUser(userId);
          showToast(res.message, 'success');
          loadAllData();
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  const handleAddDefaultUser = (userId: string, email: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Add User',
      message: `Add ${email} to your department roster?`,
      confirmText: 'Add',
      action: async () => {
        try {
          const res = await deptApi.addUser(userId);
          showToast(res.message, 'success');
          loadAllData();
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  const executeConfirmAction = async () => {
    setIsConfirming(true);
    const action = confirmModal.action;
    try {
      await action();
    } finally {
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      setIsConfirming(false);
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#a26da8]/20 border-t-[#a26da8] rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">Loading Department Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-10">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 right-6 z-[10000] animate-slideIn">
          <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border-l-4 ${
            toast.type === 'success' 
              ? 'bg-white border-green-500 text-gray-900' 
              : 'bg-white border-red-500 text-gray-900'
          }`}>
            {toast.type === 'success' ? (
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{toast.type}</p>
              <p className="font-bold text-sm">{toast.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Onboard User Modal */}
      {onboardUserModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-900">Onboard New User</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-2">CREATE AND CONFIGURE A NEW USER ACCOUNT</p>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">EMAIL ADDRESS</label>
                <input 
                  type="email"
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-gray-900 font-bold focus:ring-2 focus:ring-[#a26da8] outline-none"
                  placeholder="user@company.com"
                  value={onboardUserModal.email}
                  onChange={(e) => setOnboardUserModal({ ...onboardUserModal, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">INITIAL PASSWORD</label>
                <input 
                  type="password"
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-gray-900 font-bold focus:ring-2 focus:ring-[#a26da8] outline-none"
                  placeholder="********"
                  value={onboardUserModal.password}
                  onChange={(e) => setOnboardUserModal({ ...onboardUserModal, password: e.target.value })}
                />
              </div>
              <div className="flex justify-between gap-4 mt-8">
                <button 
                  onClick={() => setOnboardUserModal({ ...onboardUserModal, isOpen: false })} 
                  disabled={isConfirming}
                  className="px-6 py-4 text-gray-500 font-bold hover:bg-gray-100 rounded-2xl disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleOnboardUser} 
                  disabled={isConfirming}
                  className="flex-1 py-4 bg-[#a26da8] text-white font-bold rounded-2xl hover:bg-[#8e5c94] flex items-center justify-center gap-2 disabled:opacity-50 transition-colors uppercase tracking-wider text-sm"
                >
                  {isConfirming ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Working...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                      Complete Onboarding
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Budget Modal */}
      {requestBudgetModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Request Org for Credits</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Amount</label>
                <input 
                  type="number"
                  min="1"
                  className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#a26da8] outline-none"
                  placeholder="Enter amount"
                  value={requestBudgetModal.amount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setRequestBudgetModal({ ...requestBudgetModal, amount: '' });
                    } else {
                      const num = parseInt(val);
                      if (!isNaN(num)) {
                        setRequestBudgetModal({ ...requestBudgetModal, amount: num });
                      }
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Reason</label>
                <textarea 
                  className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#a26da8] outline-none h-24 resize-none"
                  placeholder="Why do you need these credits?"
                  value={requestBudgetModal.reason}
                  onChange={(e) => setRequestBudgetModal({ ...requestBudgetModal, reason: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setRequestBudgetModal({ ...requestBudgetModal, isOpen: false })} 
                  disabled={isConfirming}
                  className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-xl disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRequestBudget} 
                  disabled={isConfirming}
                  className="px-4 py-2 bg-[#a26da8] text-white font-bold rounded-xl hover:bg-[#8e5c94] flex items-center gap-2 disabled:opacity-50"
                >
                  {isConfirming ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Working...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Credits Modal */}
      {assignCreditsModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Assign Credits</h3>
            <p className="text-sm text-gray-500 mb-4">Assigning credits to <span className="font-bold text-gray-900">{assignCreditsModal.userEmail}</span></p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Amount</label>
                <input 
                  type="number"
                  min="1"
                  className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#a26da8] outline-none"
                  placeholder="Enter amount"
                  value={assignCreditsModal.amount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setAssignCreditsModal({ ...assignCreditsModal, amount: '' });
                    } else {
                      const num = parseInt(val);
                      if (!isNaN(num)) {
                        setAssignCreditsModal({ ...assignCreditsModal, amount: num });
                      }
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setAssignCreditsModal({ ...assignCreditsModal, isOpen: false })} 
                  disabled={isConfirming}
                  className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-xl disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAssignCredits} 
                  disabled={isConfirming}
                  className="px-4 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                >
                  {isConfirming ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Working...
                    </>
                  ) : (
                    'Assign'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Credits Modal */}
      {revokeCreditsModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-gray-900 text-red-600">Revoke Credits</h3>
            <p className="text-sm text-gray-500 mb-4">Revoking credits from <span className="font-bold text-gray-900">{revokeCreditsModal.userEmail}</span></p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Amount to Revoke</label>
                <input 
                  type="number"
                  min="1"
                  className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="Enter amount"
                  value={revokeCreditsModal.amount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setRevokeCreditsModal({ ...revokeCreditsModal, amount: '' });
                    } else {
                      const num = parseInt(val);
                      if (!isNaN(num)) {
                        setRevokeCreditsModal({ ...revokeCreditsModal, amount: num });
                      }
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setRevokeCreditsModal({ ...revokeCreditsModal, isOpen: false })} 
                  disabled={isConfirming}
                  className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-xl disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRevokeCredits} 
                  disabled={isConfirming}
                  className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
                >
                  {isConfirming ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Working...
                    </>
                  ) : (
                    'Revoke'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer User Modal */}
      {transferModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Transfer User</h3>
            <p className="text-sm text-gray-500 mb-4">Transferring <span className="font-bold text-gray-900">{transferModal.userEmail}</span> to another department.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Target Department</label>
                <select 
                  className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#a26da8] outline-none bg-white"
                  value={transferModal.toDepartmentId}
                  onChange={(e) => setTransferModal({ ...transferModal, toDepartmentId: e.target.value })}
                >
                  <option value="" disabled>Select a department</option>
                  {departments.map((dept: any) => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setTransferModal({ ...transferModal, isOpen: false })} 
                  disabled={isConfirming}
                  className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-xl disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleTransferUser} 
                  disabled={isConfirming}
                  className="px-4 py-2 bg-[#a26da8] text-white font-bold rounded-xl hover:bg-[#8e5c94] flex items-center gap-2 disabled:opacity-50"
                >
                  {isConfirming ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Working...
                    </>
                  ) : (
                    'Submit Transfer'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className={`text-xl font-bold mb-4 ${confirmModal.isDangerous ? 'text-red-600' : 'text-gray-900'}`}>{confirmModal.title}</h3>
            <p className="text-gray-600 mb-6">{confirmModal.message}</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} 
                disabled={isConfirming}
                className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-xl disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={executeConfirmAction} 
                disabled={isConfirming}
                className={`px-4 py-2 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-50 ${confirmModal.isDangerous ? 'bg-red-600 hover:bg-red-700' : 'bg-[#a26da8] hover:bg-[#8e5c94]'}`}
              >
                {isConfirming ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Working...
                  </>
                ) : (
                  confirmModal.confirmText || 'Confirm'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Department: {dashboardData?.department?.name}</h1>
            <p className="text-gray-500 mt-2">Manage your team roster, budgets, and requests.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setOnboardUserModal({ isOpen: true, email: '', password: '' })}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
              Onboard User
            </button>
            <button 
              onClick={() => setRequestBudgetModal({ isOpen: true, amount: 0, reason: '' })}
              className="px-4 py-2 bg-[#a26da8] text-white font-bold rounded-xl hover:bg-[#8e5c94] transition-all shadow-md flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Request Org for Credits
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Members</p>
            <h3 className="text-3xl font-black text-gray-900 mt-1">{dashboardData?.memberCount || 0}</h3>
          </div>
          
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Dept Credit pool</p>
            <h3 className="text-3xl font-black text-gray-900 mt-1">{dashboardData?.credits?.totalAllocated?.toLocaleString() || 0}</h3>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Credits distributed</p>
            <h3 className="text-3xl font-black text-gray-900 mt-1">{dashboardData?.credits?.assignedToUsers?.toLocaleString() || 0}</h3>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Unallocated Dept Credit pool</p>
            <h3 className="text-3xl font-black text-gray-900 mt-1">{dashboardData?.credits?.free?.toLocaleString() || 0}</h3>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setActiveTab('roster')}
            className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'roster' ? 'bg-[#a26da8] text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
          >
            Members
          </button>
          <button 
            onClick={() => setActiveTab('networking')}
            className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'networking' ? 'bg-[#a26da8] text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
          >
            Networking & Requests
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'history' ? 'bg-[#a26da8] text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
          >
            History
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {activeTab === 'roster' && (
            <div className="flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Email</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Role</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Available Credits</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Lifetime Spend</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {usersData.map((user: any) => (
                      <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-900">{user.email}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-full uppercase tracking-wide">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-700">{(user.credits).toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-700">{user.totalCreditsUsed?.toLocaleString() || 0}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => setAssignCreditsModal({ isOpen: true, userId: user._id, userEmail: user.email, amount: 0 })}
                              className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              title="Assign Credits"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            </button>
                            <button 
                              onClick={() => setRevokeCreditsModal({ isOpen: true, userId: user._id, userEmail: user.email, amount: 0 })}
                              className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Revoke Credits"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                            </button>
                            <button 
                              onClick={() => setTransferModal({ isOpen: true, userId: user._id, userEmail: user.email, toDepartmentId: '' })}
                              className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Transfer User"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            </button>
                            <button 
                              onClick={() => handleRemoveUser(user._id, user.email)}
                              className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Remove User"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {usersData.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium">No members in this department yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'networking' && (
            <div className="flex flex-col p-6 space-y-8">
              {/* Unassigned Users */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Unassigned Organization Users</h3>
                <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Email</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Role</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {defaultUsers.map((user: any) => (
                        <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900">{user.email}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-md uppercase tracking-wide">
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleAddDefaultUser(user._id, user.email)}
                              className="p-2 bg-[#a26da8]/10 text-[#a26da8] hover:bg-[#a26da8]/20 rounded-lg transition-colors"
                              title="Add to Department"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {defaultUsers.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-gray-500 font-medium">No unassigned users found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pending Invites */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Pending Sent Invites</h3>
                <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Invited Email</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {invites.map((inv: any) => (
                        <tr key={inv._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900">{inv.invitedEmail}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-yellow-50 text-yellow-600 text-[10px] font-bold rounded-full uppercase tracking-wide">
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {invites.length === 0 && (
                        <tr>
                          <td colSpan={2} className="px-6 py-8 text-center text-gray-500 font-medium">No pending invites.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transfer Requests */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">My Transfer Requests</h3>
                <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">User Email</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Target Dept</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {transferRequests.map((req: any) => (
                        <tr key={req._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900">{req.user?.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-700 font-semibold">{req.toDepartment?.name}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full uppercase tracking-wide">
                              {req.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {transferRequests.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-gray-500 font-medium">No active transfer requests.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="flex flex-col p-6 space-y-8">
              {/* Sent Invites History */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Sent Invites History</h3>
                <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Invited Email</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Target Dept</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Request Date</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Action Date</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Action By</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {invitesHistory.map((invite: any) => (
                        <tr key={invite._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900">{invite.invitedEmail}</td>
                          <td className="px-6 py-4 text-gray-700">{invite.targetDepartment?.name}</td>
                          <td className="px-6 py-4 text-gray-700">{new Date(invite.createdAt).toLocaleDateString('en-US')}</td>
                          <td className="px-6 py-4 text-gray-700">{invite.processedAt ? new Date(invite.processedAt).toLocaleDateString('en-US') : 'N/A'}</td>
                          <td className="px-6 py-4 text-gray-700">{invite.processedBy?.email || 'N/A'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wide ${invite.status === 'approved' ? 'bg-green-100 text-green-700' : invite.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                              {invite.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {invitesHistory.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">No invite history.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* My Transfer Requests History */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">My Transfer Requests History</h3>
                <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Employee Email</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Destination Dept</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Request Date</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Action Date</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Action By</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {transferRequestsHistory.map((req: any) => (
                        <tr key={req._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900">{req.user?.email}</td>
                          <td className="px-6 py-4 text-gray-700">{req.toDepartment?.name}</td>
                          <td className="px-6 py-4 text-gray-700">{new Date(req.createdAt).toLocaleDateString('en-US')}</td>
                          <td className="px-6 py-4 text-gray-700">{req.processedAt ? new Date(req.processedAt).toLocaleDateString('en-US') : 'N/A'}</td>
                          <td className="px-6 py-4 text-gray-700">{req.processedBy?.email || 'N/A'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wide ${req.status === 'approved' ? 'bg-green-100 text-green-700' : req.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                              {req.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {transferRequestsHistory.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">No transfer request history.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeptAdminDashboard;
