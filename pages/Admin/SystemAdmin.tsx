import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { useCortex } from '../../context/CortexContext';

const SystemAdmin: React.FC = () => {
  const { refreshCredits } = useCortex();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [usersData, setUsersData] = useState<any[]>([]);
  const [creditRequestsData, setCreditRequestsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'organizations' | 'users' | 'requests' | 'history'>('organizations');
  const [historyData, setHistoryData] = useState<any[]>([]);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal States
  const [planModal, setPlanModal] = useState<{ isOpen: boolean; orgId: string; plan: string; validityDays: number }>({ isOpen: false, orgId: '', plan: 'FREE', validityDays: 30 });
  const [creditsModal, setCreditsModal] = useState<{ isOpen: boolean; orgId: string; amount: number | '' }>({ isOpen: false, orgId: '', amount: '' });
  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; requestId: string; reason: string }>({ isOpen: false, requestId: '', reason: '' });
  const [onboardEnterpriseModal, setOnboardEnterpriseModal] = useState<{ isOpen: boolean; companyName: string; email: string; password: string; plan: string; validityDays: number; initialCredits: number }>({ isOpen: false, companyName: '', email: '', password: '', plan: 'FREE', validityDays: 30, initialCredits: 0 });
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
    isDangerous?: boolean;
    confirmText?: string;
  }>({ isOpen: false, title: '', message: '', action: async () => {} });
  const [isConfirming, setIsConfirming] = useState(false);

  // Search & Pagination States
  const [orgSearch, setOrgSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [orgPage, setOrgPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [requestPage, setRequestPage] = useState(1);
  const itemsPerPage = 10;

  const getPlanBadgeStyle = (plan: string) => {
    switch (plan?.toUpperCase()) {
      case 'FREE': return 'bg-gray-50 text-gray-600';
      case 'BASIC': return 'bg-blue-50 text-blue-600';
      case 'PRO': return 'bg-indigo-50 text-indigo-600';
      case 'ENTERPRISE': return 'bg-purple-50 text-[#a26da8]';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message: message || (type === 'success' ? 'Operation successful' : 'An error occurred'), type });
    setTimeout(() => setToast(null), 3000);
    if (type === 'success') {
      window.dispatchEvent(new Event('userProfileUpdated'));
    }
  };

  const fetchDashboard = async () => {
    try {
      const response = await apiService.system.getDashboard();
      if (response?.success && response?.data) {
        setDashboardData(response.data);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiService.system.getUsers();
      if (response?.success && response?.data) {
        setUsersData(response.data);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchCreditRequests = async () => {
    try {
      const response = await apiService.system.getCreditRequests();
      if (response?.success && response?.data) {
        setCreditRequestsData(response.data);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchCreditRequestsHistory = async () => {
    try {
      const response = await apiService.system.getCreditRequestsHistory();
      if (response?.success && response?.data) {
        setHistoryData(response.data);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchDashboard(), fetchUsers(), fetchCreditRequests(), fetchCreditRequestsHistory()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleOnboardEnterprise = async () => {
    if (!onboardEnterpriseModal.companyName || !onboardEnterpriseModal.email || !onboardEnterpriseModal.password) {
      showToast('Company Name, Email, and Password are required', 'error');
      return;
    }
    setIsConfirming(true);
    try {
      const res = await apiService.system.onboardEnterprise({
        companyName: onboardEnterpriseModal.companyName,
        email: onboardEnterpriseModal.email,
        password: onboardEnterpriseModal.password,
        plan: onboardEnterpriseModal.plan,
        validityDays: Number(onboardEnterpriseModal.validityDays),
        initialCredits: Number(onboardEnterpriseModal.initialCredits)
      });
      setOnboardEnterpriseModal({ isOpen: false, companyName: '', email: '', password: '', plan: 'FREE', validityDays: 30, initialCredits: 0 });
      showToast(res.message, 'success');
      loadAllData();
    } catch (err: any) {
      setOnboardEnterpriseModal({ isOpen: false, companyName: '', email: '', password: '', plan: 'FREE', validityDays: 30, initialCredits: 0 });
      showToast(err.message, 'error');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleAssignPlan = async () => {
    setIsConfirming(true);
    try {
      const res = await apiService.system.assignPlan(planModal.orgId, { plan: planModal.plan, validityDays: planModal.validityDays });
      setPlanModal({ ...planModal, isOpen: false });
      showToast(res.message, 'success');
      setTimeout(() => {
        refreshCredits();
      }, 1000);
      loadAllData();
    } catch (err: any) {
      setPlanModal({ ...planModal, isOpen: false });
      showToast(err.message, 'error');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleAssignCredits = async () => {
    if (!creditsModal.amount || creditsModal.amount <= 0) {
      showToast('Amount must be greater than 0', 'error');
      return;
    }
    setIsConfirming(true);
    try {
      const res = await apiService.system.assignCredits(creditsModal.orgId, { amount: Number(creditsModal.amount) });
      setCreditsModal({ ...creditsModal, isOpen: false });
      showToast(res.message, 'success');
      setTimeout(() => {
        refreshCredits();
      }, 1000);
      loadAllData();
    } catch (err: any) {
      setCreditsModal({ ...creditsModal, isOpen: false });
      showToast(err.message, 'error');
    } finally {
      setIsConfirming(false);
    }
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

  const handleApproveUser = (userId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Approve User',
      message: 'Are you sure you want to approve this user?',
      confirmText: 'Approve',
      action: async () => {
        try {
          const res = await apiService.system.approveUser(userId);
          loadAllData();
          showToast(res.message, 'success');
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  const handleToggleOrganizationStatus = (orgId: string, currentStatus: boolean) => {
    setConfirmModal({
      isOpen: true,
      title: currentStatus ? 'Suspend Organization' : 'Activate Organization',
      message: `Are you sure you want to ${currentStatus ? 'suspend' : 'activate'} this organization?`,
      confirmText: currentStatus ? 'Suspend' : 'Activate',
      isDangerous: currentStatus,
      action: async () => {
        try {
          const res = await apiService.system.toggleOrganizationStatus(orgId);
          loadAllData();
          showToast(res.message, 'success');
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  const handleDeleteOrganization = (orgId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Organization',
      message: 'WARNING: You are about to permanently delete this entire Organization and all associated user accounts. This cannot be undone. Are you absolutely sure?',
      confirmText: 'Delete Organization',
      isDangerous: true,
      action: async () => {
        try {
          const res = await apiService.system.deleteOrganization(orgId);
          loadAllData();
          showToast(res.message, 'success');
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  const handleToggleUserStatus = (userId: string, currentStatus: boolean) => {
    setConfirmModal({
      isOpen: true,
      title: currentStatus ? 'Deactivate User' : 'Activate User',
      message: `Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`,
      confirmText: currentStatus ? 'Deactivate' : 'Activate',
      isDangerous: currentStatus,
      action: async () => {
        try {
          const res = await apiService.system.toggleUserStatus(userId);
          loadAllData();
          showToast(res.message, 'success');
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  const handleDeleteUser = (userId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete User',
      message: 'Are you sure you want to delete this user? This action cannot be undone.',
      confirmText: 'Delete User',
      isDangerous: true,
      action: async () => {
        try {
          const res = await apiService.system.deleteUser(userId);
          loadAllData();
          showToast(res.message, 'success');
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  const handleApproveRequest = (requestId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Approve Request',
      message: 'Are you sure you want to approve this credit request?',
      confirmText: 'Approve',
      action: async () => {
        try {
          const res = await apiService.system.approveCreditRequest(requestId);
          loadAllData();
          setTimeout(() => {
            refreshCredits();
          }, 1000);
          showToast(res.message, 'success');
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  const handleRejectRequest = async () => {
    setIsConfirming(true);
    try {
      const res = await apiService.system.rejectCreditRequest(rejectModal.requestId, { reason: rejectModal.reason });
      setRejectModal({ ...rejectModal, isOpen: false });
      showToast(res.message, 'success');
      setTimeout(() => {
        refreshCredits();
      }, 1000);
      loadAllData();
    } catch (err: any) {
      setRejectModal({ ...rejectModal, isOpen: false });
      showToast(err.message, 'error');
    } finally {
      setIsConfirming(false);
    }
  };

  // Computed Data
  const filteredOrgs = (dashboardData?.organizations || []).filter((org: any) => 
    org.name?.toLowerCase().includes(orgSearch.toLowerCase())
  );
  const paginatedOrgs = filteredOrgs.slice((orgPage - 1) * itemsPerPage, orgPage * itemsPerPage);
  const totalOrgPages = Math.max(1, Math.ceil(filteredOrgs.length / itemsPerPage));

  const filteredUsers = usersData.filter((user: any) => 
    user.email?.toLowerCase().includes(userSearch.toLowerCase())
  );
  const paginatedUsers = filteredUsers.slice((userPage - 1) * itemsPerPage, userPage * itemsPerPage);
  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));

  const paginatedRequests = creditRequestsData.slice((requestPage - 1) * itemsPerPage, requestPage * itemsPerPage);
  const totalRequestPages = Math.max(1, Math.ceil(creditRequestsData.length / itemsPerPage));

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-[#fcfdff] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#a26da8]/30 border-t-[#a26da8] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfdff] p-4 md:p-8 relative">
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

      {/* Modals */}
      {onboardEnterpriseModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-900">Onboard New User</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-2">CREATE AND CONFIGURE A NEW ENTERPRISE ACCOUNT</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">COMPANY NAME</label>
                <input 
                  type="text"
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-gray-900 font-bold focus:ring-2 focus:ring-[#a26da8] outline-none"
                  placeholder="Acme Corp"
                  value={onboardEnterpriseModal.companyName}
                  onChange={(e) => setOnboardEnterpriseModal({ ...onboardEnterpriseModal, companyName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">EMAIL ADDRESS</label>
                <input 
                  type="email"
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-gray-900 font-bold focus:ring-2 focus:ring-[#a26da8] outline-none"
                  placeholder="user@acme.com"
                  value={onboardEnterpriseModal.email}
                  onChange={(e) => setOnboardEnterpriseModal({ ...onboardEnterpriseModal, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">INITIAL PASSWORD</label>
                <input 
                  type="password"
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-gray-900 font-bold focus:ring-2 focus:ring-[#a26da8] outline-none"
                  placeholder="********"
                  value={onboardEnterpriseModal.password}
                  onChange={(e) => setOnboardEnterpriseModal({ ...onboardEnterpriseModal, password: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">PLAN TYPE</label>
                <div className="grid grid-cols-2 gap-2">
                  {['FREE', 'BASIC', 'PRO', 'ENTERPRISE'].map(plan => {
                    const isSelected = onboardEnterpriseModal.plan === plan;
                    let colors = '';
                    if (plan === 'FREE') colors = isSelected ? 'bg-gray-50 border-gray-400 text-gray-800' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200';
                    if (plan === 'BASIC') colors = isSelected ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-gray-100 text-gray-500 hover:border-blue-200';
                    if (plan === 'PRO') colors = isSelected ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'bg-white border-gray-100 text-gray-500 hover:border-indigo-200';
                    if (plan === 'ENTERPRISE') colors = isSelected ? 'bg-purple-50 border-[#a26da8] text-[#a26da8]' : 'bg-white border-gray-100 text-gray-500 hover:border-purple-200';
                    return (
                      <button
                        key={plan}
                        onClick={() => setOnboardEnterpriseModal({ ...onboardEnterpriseModal, plan })}
                        className={`p-3 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center ${colors}`}
                      >
                        {plan}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">VALIDITY (DAYS)</label>
                <input 
                  type="number"
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-gray-900 font-bold focus:ring-2 focus:ring-[#a26da8] outline-none"
                  placeholder="30"
                  value={onboardEnterpriseModal.validityDays}
                  onChange={(e) => setOnboardEnterpriseModal({ ...onboardEnterpriseModal, validityDays: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">INITIAL CREDITS</label>
                <input 
                  type="number"
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-gray-900 font-bold focus:ring-2 focus:ring-[#a26da8] outline-none"
                  placeholder="1000"
                  value={onboardEnterpriseModal.initialCredits}
                  onChange={(e) => setOnboardEnterpriseModal({ ...onboardEnterpriseModal, initialCredits: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex justify-between gap-4 mt-8">
              <button 
                onClick={() => setOnboardEnterpriseModal({ ...onboardEnterpriseModal, isOpen: false })} 
                disabled={isConfirming}
                className="px-6 py-4 text-gray-500 font-bold hover:bg-gray-100 rounded-2xl disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleOnboardEnterprise} 
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
      )}

      {planModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Change Plan</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Select Plan</label>
                <div className="grid grid-cols-2 gap-3">
                  {['FREE', 'BASIC', 'PRO', 'ENTERPRISE'].map((plan) => {
                    const isSelected = planModal.plan === plan;
                    let colors = '';
                    if (plan === 'FREE') colors = isSelected ? 'bg-gray-50 border-gray-400 text-gray-800' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200';
                    if (plan === 'BASIC') colors = isSelected ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-gray-100 text-gray-500 hover:border-blue-200';
                    if (plan === 'PRO') colors = isSelected ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'bg-white border-gray-100 text-gray-500 hover:border-indigo-200';
                    if (plan === 'ENTERPRISE') colors = isSelected ? 'bg-purple-50 border-[#a26da8] text-[#a26da8]' : 'bg-white border-gray-100 text-gray-500 hover:border-purple-200';
                    
                    return (
                      <button
                        key={plan}
                        onClick={() => setPlanModal({ ...planModal, plan })}
                        className={`p-3 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center ${colors}`}
                      >
                        {plan}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Validity (Days)</label>
                <input 
                  type="number" 
                  className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#a26da8] outline-none transition-shadow"
                  value={planModal.validityDays}
                  onChange={(e) => setPlanModal({ ...planModal, validityDays: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setPlanModal({ ...planModal, isOpen: false })} 
                  disabled={isConfirming}
                  className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-xl disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAssignPlan} 
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
                    'Save Plan'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {creditsModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Inject Credits</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Amount</label>
                <input 
                  type="number" 
                  min="1"
                  className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#a26da8] outline-none"
                  placeholder="Enter amount"
                  value={creditsModal.amount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setCreditsModal({ ...creditsModal, amount: '' });
                    } else {
                      const num = parseInt(val);
                      if (!isNaN(num)) {
                        setCreditsModal({ ...creditsModal, amount: num });
                      }
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setCreditsModal({ ...creditsModal, isOpen: false })} 
                  disabled={isConfirming}
                  className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-xl disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAssignCredits} 
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
                    'Inject Credits'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {rejectModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Reject Request</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Reason</label>
                <textarea 
                  className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#a26da8] outline-none"
                  rows={3}
                  value={rejectModal.reason}
                  onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setRejectModal({ ...rejectModal, isOpen: false })} 
                  disabled={isConfirming}
                  className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-xl disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRejectRequest} 
                  disabled={isConfirming}
                  className="px-4 py-2 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 flex items-center gap-2 disabled:opacity-50"
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
                    'Reject'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Administration</h1>
            <p className="text-gray-500 mt-2">Overview of all organizations and system-wide metrics.</p>
          </div>
          <button 
            onClick={() => setOnboardEnterpriseModal({ isOpen: true, companyName: '', email: '', password: '', plan: 'FREE', validityDays: 30, initialCredits: 0 })}
            className="px-4 py-2 bg-[#a26da8] text-white font-bold rounded-xl hover:bg-[#8e5c94] transition-colors shadow-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Onboard Enterprise
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Organizations</span>
            <span className="text-3xl font-black text-gray-900">{dashboardData?.totalOrganizations || 0}</span>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Users</span>
            <span className="text-3xl font-black text-gray-900">{dashboardData?.totalUsers || 0}</span>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Approvals</span>
            <span className={`text-3xl font-black ${dashboardData?.pendingOrgApprovals > 0 ? 'text-amber-500' : 'text-gray-900'}`}>
              {dashboardData?.pendingOrgApprovals || 0}
            </span>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total System Credits</span>
            <span className="text-3xl font-black text-gray-900">
              {dashboardData?.credits?.totalAllocated?.toLocaleString() || 0}
            </span>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Credit Requests</span>
            <span className="text-3xl font-black text-gray-900">{dashboardData?.pendingCreditRequests || 0}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button 
            onClick={() => setActiveTab('organizations')}
            className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'organizations' ? 'bg-[#a26da8] text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
          >
            Organizations
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'users' ? 'bg-[#a26da8] text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
          >
            Global Users
          </button>
          <button 
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'requests' ? 'bg-[#a26da8] text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
          >
            Credit Requests
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
          
          {activeTab === 'organizations' && (
            <div className="flex flex-col">
              <div className="p-4 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
                <div className="relative w-full max-w-md">
                  <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input 
                    type="text" 
                    placeholder="Search organizations by name..." 
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#a26da8] outline-none"
                    value={orgSearch}
                    onChange={(e) => { setOrgSearch(e.target.value); setOrgPage(1); }}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Organization</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Plan</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Total Credits</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                        Extra Credit Pool
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Total Accounts</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Credits Held by Users</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedOrgs.map((org: any) => (
                      <tr key={org._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900">{org.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-bold rounded-lg uppercase tracking-wide ${getPlanBadgeStyle(org.plan)}`}>
                          {org.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-700">{org.totalCredits?.toLocaleString() || 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-700">{org.unallocatedCredits?.toLocaleString() || 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-700">{org.userCount || 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-700">{org.userCredits?.toLocaleString() || 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        {!org.isApproved ? (
                          <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wide bg-amber-50 text-amber-600">
                            PENDING APPROVAL
                          </span>
                        ) : (
                          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wide ${
                            org.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                          }`}>
                            {org.isActive ? 'ACTIVE' : 'SUSPENDED'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {org.isApproved && (
                            <button 
                              onClick={() => handleToggleOrganizationStatus(org._id, org.isActive)}
                              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${org.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                              title={org.isActive ? 'Suspend Organization' : 'Activate Organization'}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${org.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                          )}
                          <button 
                            onClick={() => setPlanModal({ isOpen: true, orgId: org._id, plan: org.plan || 'FREE', validityDays: 30 })}
                            className="px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-xs font-bold transition-colors"
                          >
                            Change Plan
                          </button>
                          <button 
                            onClick={() => setCreditsModal({ isOpen: true, orgId: org._id, amount: 0 })}
                            className="px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-xs font-bold transition-colors"
                          >
                            Inject Credits
                          </button>
                          <button 
                            onClick={() => handleDeleteOrganization(org._id)}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete Organization"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedOrgs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500 font-medium">
                        No organizations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalOrgPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                <span className="text-sm text-gray-500 font-medium">
                  Showing {(orgPage - 1) * itemsPerPage + 1} to {Math.min(orgPage * itemsPerPage, filteredOrgs.length)} of {filteredOrgs.length}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setOrgPage(p => Math.max(1, p - 1))}
                    disabled={orgPage === 1}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => setOrgPage(p => Math.min(totalOrgPages, p + 1))}
                    disabled={orgPage === totalOrgPages}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

          {activeTab === 'users' && (
            <div className="flex flex-col">
              <div className="p-4 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
                <div className="relative w-full max-w-md">
                  <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input 
                    type="text" 
                    placeholder="Search users by email..." 
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#a26da8] outline-none"
                    value={userSearch}
                    onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Email</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Role</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Organization</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Wallet</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedUsers.map((user: any) => (
                      <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900">{user.email}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-lg uppercase tracking-wide">
                          {user.role?.replace('_ROLE', '').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-700">{user.organization?.name || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-700">{user.credits?.toLocaleString() || 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        {user.organization && user.organization.isActive === false ? (
                          <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wide bg-slate-100 text-slate-700">
                            ORG SUSPENDED
                          </span>
                        ) : !user.isApproved ? (
                          <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wide bg-amber-50 text-amber-600">
                            PENDING
                          </span>
                        ) : (
                          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wide ${
                            user.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                          }`}>
                            {user.isActive ? 'ACTIVE' : 'SUSPENDED'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {user.isApproved && (
                            <button 
                              onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                              disabled={user.organization && user.organization.isActive === false}
                              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${user.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                              title={user.isActive ? 'Deactivate User' : 'Activate User'}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${user.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                          )}
                          
                          {!user.isApproved && (
                            <button 
                              onClick={() => handleApproveUser(user._id)}
                              className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              title="Approve User"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                            </button>
                          )}
                          
                          <button 
                            onClick={() => handleDeleteUser(user._id)}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title={!user.isApproved ? "Reject & Delete User" : "Delete User"}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalUserPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                <span className="text-sm text-gray-500 font-medium">
                  Showing {(userPage - 1) * itemsPerPage + 1} to {Math.min(userPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setUserPage(p => Math.max(1, p - 1))}
                    disabled={userPage === 1}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => setUserPage(p => Math.min(totalUserPages, p + 1))}
                    disabled={userPage === totalUserPages}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

          {activeTab === 'requests' && (
            <div className="flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Organization</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Requested By</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Amount</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Reason</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedRequests.map((request: any) => (
                      <tr key={request._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900">{request.organization?.name || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-700">{request.requestedBy?.email || 'Unknown'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-black text-gray-900">{request.amount?.toLocaleString() || 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{request.reason || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wide ${
                          request.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                          request.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {request.status === 'pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleApproveRequest(request._id)}
                              className="px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-xs font-bold transition-colors"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => setRejectModal({ isOpen: true, requestId: request._id, reason: '' })}
                              className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {paginatedRequests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">
                        No credit requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalRequestPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                <span className="text-sm text-gray-500 font-medium">
                  Showing {(requestPage - 1) * itemsPerPage + 1} to {Math.min(requestPage * itemsPerPage, creditRequestsData.length)} of {creditRequestsData.length}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setRequestPage(p => Math.max(1, p - 1))}
                    disabled={requestPage === 1}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => setRequestPage(p => Math.min(totalRequestPages, p + 1))}
                    disabled={requestPage === totalRequestPages}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Organization</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Amount</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Reason</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Requested By</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Request Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Action Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Action By</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Rejection Note</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {historyData.map((request: any) => (
                    <tr key={request._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{request.organization?.name || 'N/A'}</td>
                      <td className="px-6 py-4 font-black text-gray-900">{request.amount?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{request.reason || '-'}</td>
                      <td className="px-6 py-4 font-semibold text-gray-700">{request.requestedBy?.email || 'Unknown'}</td>
                      <td className="px-6 py-4 text-gray-700">{new Date(request.createdAt).toLocaleDateString('en-US')}</td>
                      <td className="px-6 py-4 text-gray-700">{request.processedAt ? new Date(request.processedAt).toLocaleDateString('en-US') : 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-700">{request.processedBy?.email || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {request.status === 'rejected' ? request.rejectionReason || '-' : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wide ${
                          request.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {historyData.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-500 font-medium">
                        No credit request history found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        </div>
      </div>
    </div>
  );
};

export default SystemAdmin;
