import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { useCortex } from '../../context/CortexContext';

const OrgAdminDashboard: React.FC = () => {
  const { refreshCredits } = useCortex();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [departmentsData, setDepartmentsData] = useState<any[]>([]);
  const [usersData, setUsersData] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [transferRequests, setTransferRequests] = useState<any[]>([]);
  const [creditRequests, setCreditRequests] = useState<any[]>([]);
  const [pendingSentSystemRequests, setPendingSentSystemRequests] = useState<any[]>([]);
  const [sentSystemRequestsHistory, setSentSystemRequestsHistory] = useState<any[]>([]);
  const [joinRequestsHistory, setJoinRequestsHistory] = useState<any[]>([]);
  const [transferRequestsHistory, setTransferRequestsHistory] = useState<any[]>([]);
  const [creditRequestsHistory, setCreditRequestsHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'departments' | 'members' | 'requests' | 'history'>('departments');

  // Current User
  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal States
  const [createDeptModal, setCreateDeptModal] = useState<{ isOpen: boolean; name: string }>({ isOpen: false, name: '' });
  const [allocateModal, setAllocateModal] = useState<{ isOpen: boolean; deptId: string; deptName: string; amount: number | '' }>({ isOpen: false, deptId: '', deptName: '', amount: '' });
  const [revokeModal, setRevokeModal] = useState<{ isOpen: boolean; deptId: string; deptName: string; amount: number | '' }>({ isOpen: false, deptId: '', deptName: '', amount: '' });
  const [moveUserModal, setMoveUserModal] = useState<{ isOpen: boolean; userId: string; departmentId: string }>({ isOpen: false, userId: '', departmentId: '' });
  const [onboardUserModal, setOnboardUserModal] = useState<{ isOpen: boolean; email: string; password: string; role: string }>({ isOpen: false, email: '', password: '', role: 'USER_ROLE' });
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
  const [deptSearch, setDeptSearch] = useState('');
  const [deptPage, setDeptPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const itemsPerPage = 10;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message: message || (type === 'success' ? 'Operation successful' : 'An error occurred'), type });
    setTimeout(() => setToast(null), 3000);
    if (type === 'success') {
      window.dispatchEvent(new Event('userProfileUpdated'));
    }
  };

  const [orgName, setOrgName] = useState<string>('');

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.organization?.name) {
          setOrgName(user.organization.name);
        }
      } catch (e) {}
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await apiService.org.getDashboard();
      if (response?.success && response?.data) {
        setDashboardData(response.data);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await apiService.org.getDepartments();
      if (response?.success && response?.data) {
        setDepartmentsData(response.data);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiService.org.getUsers();
      if (response?.success && response?.data) {
        setUsersData(response.data);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchJoinRequests = async () => {
    try {
      const response = await apiService.org.getJoinRequests();
      if (response?.success && response?.data) {
        setJoinRequests(response.data);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchTransferRequests = async () => {
    try {
      const response = await apiService.org.getTransferRequests();
      if (response?.success && response?.data) {
        setTransferRequests(response.data);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchCreditRequests = async () => {
    try {
      const response = await apiService.org.getCreditRequests();
      if (response?.success && response?.data) {
        setCreditRequests(response.data);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchJoinRequestsHistory = async () => {
    try {
      const response = await apiService.org.getJoinRequestsHistory();
      if (response?.success && response?.data) {
        setJoinRequestsHistory(response.data);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchTransferRequestsHistory = async () => {
    try {
      const response = await apiService.org.getTransferRequestsHistory();
      if (response?.success && response?.data) {
        setTransferRequestsHistory(response.data);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchCreditRequestsHistory = async () => {
    try {
      const response = await apiService.org.getCreditRequestsHistory();
      if (response?.success && response?.data) {
        setCreditRequestsHistory(response.data);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchPendingSentSystemRequests = async () => {
    try {
      const response = await apiService.org.getPendingSentSystemRequests();
      if (response?.success && response?.data) {
        setPendingSentSystemRequests(response.data);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchSentSystemRequestsHistory = async () => {
    try {
      const response = await apiService.org.getSentSystemRequestsHistory();
      if (response?.success && response?.data) {
        setSentSystemRequestsHistory(response.data);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchDashboardData(),
      fetchDepartments(),
      fetchUsers(),
      fetchJoinRequests(),
      fetchTransferRequests(),
      fetchCreditRequests(),
      fetchJoinRequestsHistory(),
      fetchTransferRequestsHistory(),
      fetchCreditRequestsHistory(),
      fetchPendingSentSystemRequests(),
      fetchSentSystemRequestsHistory()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleCreateDepartment = async () => {
    if (!createDeptModal.name.trim()) {
      showToast('Department name is required', 'error');
      return;
    }
    setIsConfirming(true);
    try {
      const res = await apiService.org.createDepartment({ name: createDeptModal.name });
      setCreateDeptModal({ isOpen: false, name: '' });
      showToast(res.message, 'success');
      loadAllData();
    } catch (err: any) {
      setCreateDeptModal({ isOpen: false, name: '' });
      showToast(err.message, 'error');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDeleteDepartment = (deptId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Department',
      message: 'Are you sure you want to delete this department? It must have 0 users.',
      confirmText: 'Delete Department',
      isDangerous: true,
      action: async () => {
        try {
          const res = await apiService.org.deleteDepartment(deptId);
          loadAllData();
          showToast(res.message, 'success');
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  const handleAllocateCredits = async () => {
    if (!allocateModal.amount || allocateModal.amount <= 0) {
      showToast('Amount must be greater than 0', 'error');
      return;
    }
    setIsConfirming(true);
    try {
      const res = await apiService.org.allocateCredits({ departmentId: allocateModal.deptId, amount: Number(allocateModal.amount) });
      setAllocateModal({ isOpen: false, deptId: '', deptName: '', amount: '' });
      showToast(res.message, 'success');
      refreshCredits();
      loadAllData();
    } catch (err: any) {
      setAllocateModal({ isOpen: false, deptId: '', deptName: '', amount: '' });
      showToast(err.message, 'error');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRevokeCredits = async () => {
    if (!revokeModal.amount || revokeModal.amount <= 0) {
      showToast('Amount must be greater than 0', 'error');
      return;
    }
    setIsConfirming(true);
    try {
      const res = await apiService.org.returnCredits({ departmentId: revokeModal.deptId, amount: Number(revokeModal.amount) });
      setRevokeModal({ isOpen: false, deptId: '', deptName: '', amount: '' });
      showToast(res.message, 'success');
      refreshCredits();
      loadAllData();
    } catch (err: any) {
      setRevokeModal({ isOpen: false, deptId: '', deptName: '', amount: '' });
      showToast(err.message, 'error');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleOnboardUser = async () => {
    if (!onboardUserModal.email || !onboardUserModal.password || !onboardUserModal.role) {
      showToast('Email, password, and role are required', 'error');
      return;
    }
    setIsConfirming(true);
    try {
      const res = await apiService.org.onboardUser({ email: onboardUserModal.email, password: onboardUserModal.password, role: onboardUserModal.role });
      setOnboardUserModal({ isOpen: false, email: '', password: '', role: 'USER_ROLE' });
      showToast(res.message, 'success');
      loadAllData();
    } catch (err: any) {
      setOnboardUserModal({ isOpen: false, email: '', password: '', role: 'USER_ROLE' });
      showToast(err.message, 'error');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleMakeOrgAdmin = (userId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Promote to Co-Organization Admin',
      message: 'Are you sure you want to promote this user to Co-Organization Admin?',
      confirmText: 'Promote',
      action: async () => {
        try {
          const res = await apiService.org.makeOrgAdmin(userId);
          loadAllData();
          showToast(res.message, 'success');
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  const handleRemoveOrgAdmin = (userId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Revoke Organization Admin privileges',
      message: 'Revoke Organization Admin privileges?',
      confirmText: 'Revoke',
      isDangerous: true,
      action: async () => {
        try {
          const res = await apiService.org.removeOrgAdmin(userId);
          loadAllData();
          showToast(res.message, 'success');
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

  const handleApproveUser = (userId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Approve User',
      message: 'Are you sure you want to approve this user?',
      confirmText: 'Approve',
      action: async () => {
        try {
          const res = await apiService.org.approveUser(userId);
          loadAllData();
          showToast(res.message, 'success');
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  const handleRejectUser = (userId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reject User',
      message: 'Are you sure you want to reject and remove this user?',
      confirmText: 'Reject',
      isDangerous: true,
      action: async () => {
        try {
          const res = await apiService.org.removeUser(userId);
          loadAllData();
          showToast(res.message, 'success');
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  const handleRemoveUser = (userId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove User',
      message: 'Are you sure you want to remove this user from the organization?',
      confirmText: 'Remove',
      isDangerous: true,
      action: async () => {
        try {
          const res = await apiService.org.removeUser(userId);
          loadAllData();
          showToast(res.message, 'success');
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  const handlePromoteUser = (userId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Promote User',
      message: 'Are you sure you want to promote this user to Department Admin?',
      confirmText: 'Promote',
      action: async () => {
        try {
          const res = await apiService.org.promoteUser(userId);
          loadAllData();
          showToast(res.message, 'success');
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  const handleDemoteUser = (userId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Demote User',
      message: 'Are you sure you want to demote this user to Standard User?',
      confirmText: 'Demote',
      isDangerous: true,
      action: async () => {
        try {
          const res = await apiService.org.demoteUser(userId);
          loadAllData();
          showToast(res.message, 'success');
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  const handleApproveJoinRequest = (reqId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Approve Join Request',
      message: 'Are you sure you want to approve this join request?',
      confirmText: 'Approve',
      action: async () => {
        try {
          const res = await apiService.org.approveJoinRequest(reqId);
          loadAllData();
          showToast(res.message, 'success');
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  const handleRejectJoinRequest = (reqId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reject Join Request',
      message: 'Are you sure you want to reject this join request?',
      confirmText: 'Reject',
      isDangerous: true,
      action: async () => {
        try {
          const res = await apiService.org.rejectJoinRequest(reqId);
          loadAllData();
          showToast(res.message, 'success');
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  const handleApproveTransferRequest = (reqId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Approve Transfer Request',
      message: 'Are you sure you want to approve this transfer request?',
      confirmText: 'Approve',
      action: async () => {
        try {
          const res = await apiService.org.approveTransferRequest(reqId);
          loadAllData();
          showToast(res.message, 'success');
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  const handleRejectTransferRequest = (reqId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reject Transfer Request',
      message: 'Are you sure you want to reject this transfer request?',
      confirmText: 'Reject',
      isDangerous: true,
      action: async () => {
        try {
          const res = await apiService.org.rejectTransferRequest(reqId);
          loadAllData();
          showToast(res.message, 'success');
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  const handleApproveCreditRequest = (reqId: string, amount: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Approve Credit Request',
      message: `Moves ${amount} from Org Wallet to Dept Wallet. Are you sure?`,
      confirmText: 'Approve',
      action: async () => {
        try {
          const res = await apiService.org.approveCreditRequest(reqId);
          loadAllData();
          refreshCredits();
          showToast(res.message, 'success');
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  const handleRejectCreditRequest = (reqId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reject Credit Request',
      message: 'Are you sure you want to reject this credit request?',
      confirmText: 'Reject',
      isDangerous: true,
      action: async () => {
        try {
          const res = await apiService.org.rejectCreditRequest(reqId);
          loadAllData();
          refreshCredits();
          showToast(res.message, 'success');
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  const handleMoveUser = async () => {
    if (!moveUserModal.departmentId) {
      showToast('Please select a department', 'error');
      return;
    }
    setIsConfirming(true);
    try {
      const res = await apiService.org.moveUser(moveUserModal.userId, { departmentId: moveUserModal.departmentId });
      setMoveUserModal({ isOpen: false, userId: '', departmentId: '' });
      showToast(res.message, 'success');
      loadAllData();
    } catch (err: any) {
      setMoveUserModal({ isOpen: false, userId: '', departmentId: '' });
      showToast(err.message, 'error');
    } finally {
      setIsConfirming(false);
    }
  };

  const [requestSystemCreditsModal, setRequestSystemCreditsModal] = useState<{ isOpen: boolean; amount: number | ''; reason: string }>({ isOpen: false, amount: '', reason: '' });

  const handleRequestSystemCredits = async () => {
    if (!requestSystemCreditsModal.amount || requestSystemCreditsModal.amount <= 0) {
      showToast('Amount must be greater than 0', 'error');
      return;
    }
    if (!requestSystemCreditsModal.reason.trim()) {
      showToast('Reason is required', 'error');
      return;
    }
    setIsConfirming(true);
    try {
      const res = await apiService.org.requestSystemCredits({ amount: Number(requestSystemCreditsModal.amount), reason: requestSystemCreditsModal.reason });
      setRequestSystemCreditsModal({ isOpen: false, amount: '', reason: '' });
      showToast(res.message, 'success');
      refreshCredits();
      loadAllData();
    } catch (err: any) {
      setRequestSystemCreditsModal({ isOpen: false, amount: '', reason: '' });
      showToast(err.message, 'error');
    } finally {
      setIsConfirming(false);
    }
  };

  // Computed Data
  const filteredDepts = departmentsData.filter((dept: any) => 
    dept.name?.toLowerCase().includes(deptSearch.toLowerCase())
  );

  const totalDeptPages = Math.ceil(filteredDepts.length / itemsPerPage);
  const paginatedDepts = filteredDepts.slice((deptPage - 1) * itemsPerPage, deptPage * itemsPerPage);

  const filteredUsers = usersData.filter((user: any) => 
    user.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const totalUserPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((userPage - 1) * itemsPerPage, userPage * itemsPerPage);

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#a26da8]/20 border-t-[#a26da8] rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">Loading Organization Data...</p>
        </div>
      </div>
    );
  }

  const pendingExternal = dashboardData?.pendingUserApprovals || 0;
  const pendingInternal = (dashboardData?.pendingJoinRequests || 0) + 
                          (dashboardData?.pendingTransferRequests || 0) + 
                          (dashboardData?.pendingDeptCreditRequests || 0);

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

      {/* Create Department Modal */}
      {createDeptModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Create Department</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Department Name</label>
                <input 
                  type="text"
                  className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#a26da8] outline-none"
                  placeholder="e.g. Marketing"
                  value={createDeptModal.name}
                  onChange={(e) => setCreateDeptModal({ ...createDeptModal, name: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setCreateDeptModal({ ...createDeptModal, isOpen: false })} 
                  disabled={isConfirming}
                  className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-xl disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateDepartment} 
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
                    'Create'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Allocate Credits Modal */}
      {allocateModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Allocate Credits</h3>
            <p className="text-gray-600 mb-4">How many credits to allocate to {allocateModal.deptName}?</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Amount</label>
                <input 
                  type="number"
                  min="1"
                  className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#a26da8] outline-none"
                  placeholder="e.g. 1000"
                  value={allocateModal.amount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setAllocateModal({ ...allocateModal, amount: '' });
                    } else {
                      const num = parseInt(val);
                      if (!isNaN(num)) {
                        setAllocateModal({ ...allocateModal, amount: num });
                      }
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setAllocateModal({ ...allocateModal, isOpen: false })} 
                  disabled={isConfirming}
                  className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-xl disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAllocateCredits} 
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
                    'Allocate'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Credits Modal */}
      {revokeModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Revoke Credits</h3>
            <p className="text-gray-600 mb-4">How many unused credits to return from {revokeModal.deptName} to the Org Wallet?</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Amount</label>
                <input 
                  type="number"
                  min="1"
                  className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#a26da8] outline-none"
                  placeholder="e.g. 500"
                  value={revokeModal.amount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setRevokeModal({ ...revokeModal, amount: '' });
                    } else {
                      const num = parseInt(val);
                      if (!isNaN(num)) {
                        setRevokeModal({ ...revokeModal, amount: num });
                      }
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setRevokeModal({ ...revokeModal, isOpen: false })} 
                  disabled={isConfirming}
                  className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-xl disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRevokeCredits} 
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
                    'Revoke'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Move User Modal */}
      {moveUserModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Move User to Department</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Select Department</label>
                <select 
                  className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#a26da8] outline-none"
                  value={moveUserModal.departmentId}
                  onChange={(e) => setMoveUserModal({ ...moveUserModal, departmentId: e.target.value })}
                >
                  <option value="">Select a department...</option>
                  {departmentsData.map(dept => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setMoveUserModal({ ...moveUserModal, isOpen: false })} 
                  disabled={isConfirming}
                  className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-xl disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleMoveUser} 
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
                    'Move User'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request System Credits Modal */}
      {requestSystemCreditsModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Request System Credits</h3>
            <p className="text-gray-600 mb-4">Request additional credits for your organization from the System Admin.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Amount</label>
                <input 
                  type="number"
                  min="1"
                  className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#a26da8] outline-none"
                  placeholder="e.g. 5000"
                  value={requestSystemCreditsModal.amount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setRequestSystemCreditsModal({ ...requestSystemCreditsModal, amount: '' });
                    } else {
                      const num = parseInt(val);
                      if (!isNaN(num)) {
                        setRequestSystemCreditsModal({ ...requestSystemCreditsModal, amount: num });
                      }
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Reason</label>
                <input 
                  type="text"
                  className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#a26da8] outline-none"
                  placeholder="e.g. Expanding logic limits."
                  value={requestSystemCreditsModal.reason}
                  onChange={(e) => setRequestSystemCreditsModal({ ...requestSystemCreditsModal, reason: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setRequestSystemCreditsModal({ ...requestSystemCreditsModal, isOpen: false })} 
                  disabled={isConfirming}
                  className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-xl disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRequestSystemCredits} 
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
                    'Request'
                  )}
                </button>
              </div>
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
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">ROLE</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setOnboardUserModal({ ...onboardUserModal, role: 'USER_ROLE' })}
                    className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all ${onboardUserModal.role === 'USER_ROLE' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500 shadow-sm' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                  >
                    User
                  </button>
                  <button
                    onClick={() => setOnboardUserModal({ ...onboardUserModal, role: 'ADMIN_ROLE' })}
                    className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all ${onboardUserModal.role === 'ADMIN_ROLE' ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-500 shadow-sm' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                  >
                    Admin
                  </button>
                </div>
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{orgName ? `${orgName} Administration` : 'Organization Administration'}</h1>
          <p className="text-gray-500 mt-2">Overview of your organization, departments, and members.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Members</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">{dashboardData?.totalUsers || 0}</h3>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Departments</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">{dashboardData?.departments?.length || 0}</h3>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Unallocated ORG Credit pool</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">{dashboardData?.credits?.totalFree?.toLocaleString() || 0}</h3>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Credits allocated to departments</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">{dashboardData?.credits?.totalGivenToDepts?.toLocaleString() || 0}</h3>
            </div>
          </div>
        </div>

        {/* Alert Banners */}
        <div className="space-y-3">
          {pendingExternal > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3 animate-slideIn">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
              </div>
              <p className="text-sm font-bold text-blue-900">
                You have {pendingExternal} User Sign-ups waiting to be approved into the Organization. Please review them in the Requests tab.
              </p>
            </div>
          )}
          {pendingInternal > 0 && (
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center gap-3 animate-slideIn">
              <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              </div>
              <p className="text-sm font-bold text-orange-900">
                You have {pendingInternal} Department Approvals (Invites, Transfers, or Budgets) pending review. Please check the Requests tab.
              </p>
            </div>
          )}
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setActiveTab('departments')}
            className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'departments' ? 'bg-[#a26da8] text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
          >
            Departments
          </button>
          <button 
            onClick={() => setActiveTab('members')}
            className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'members' ? 'bg-[#a26da8] text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
          >
            Members
          </button>
          <button 
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'requests' ? 'bg-[#a26da8] text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
          >
            Requests
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
          
          {activeTab === 'departments' && (
            <div className="flex flex-col">
              <div className="p-4 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
                <div className="relative w-full max-w-md">
                  <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input 
                    type="text" 
                    placeholder="Search departments by name..." 
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#a26da8] outline-none"
                    value={deptSearch}
                    onChange={(e) => { setDeptSearch(e.target.value); setDeptPage(1); }}
                  />
                </div>
                <button 
                  onClick={() => setCreateDeptModal({ isOpen: true, name: '' })}
                  className="px-4 py-2 bg-[#a26da8] text-white font-bold rounded-xl hover:bg-[#8e5c94] transition-colors text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  Create Department
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Department Name</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Members</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Total Dept Credit pool</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Total credits held by users</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Total Credits Consumed</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedDepts.map((dept: any) => (
                      <tr key={dept._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{dept.name}</span>
                          {dept.isDefault && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-md uppercase tracking-wide">
                              DEFAULT
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-700">{dept.userCount || 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-700">{dept.allocatedCredits?.toLocaleString() || 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-700">{dept.usersHeldCredits?.toLocaleString() || 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-700">{dept.totalConsumed?.toLocaleString() || 0}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setAllocateModal({ isOpen: true, deptId: dept._id, deptName: dept.name, amount: 0 })}
                            className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                            title="Allocate Credits"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                          </button>
                          <button 
                            onClick={() => setRevokeModal({ isOpen: true, deptId: dept._id, deptName: dept.name, amount: 0 })}
                            className="p-2 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                            title="Revoke Credits"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                          </button>
                          {!dept.isDefault && (
                            <button 
                              onClick={() => handleDeleteDepartment(dept._id)}
                              className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Delete Department"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedDepts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">
                        No departments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalDeptPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                <span className="text-sm text-gray-500 font-medium">
                  Showing {(deptPage - 1) * itemsPerPage + 1} to {Math.min(deptPage * itemsPerPage, filteredDepts.length)} of {filteredDepts.length}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setDeptPage(p => Math.max(1, p - 1))}
                    disabled={deptPage === 1}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => setDeptPage(p => Math.min(totalDeptPages, p + 1))}
                    disabled={deptPage === totalDeptPages}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
              <div className="relative w-full max-w-md">
                <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input 
                  type="text" 
                  placeholder="Search members by email..." 
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#a26da8] outline-none"
                  value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                />
              </div>
              <button 
                onClick={() => setOnboardUserModal({ isOpen: true, email: '', password: '', role: 'USER_ROLE' })}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                Onboard User
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Member Email</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Account Role</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Department</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Available Credits</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Credits Spent</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedUsers.map((user: any) => (
                    <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{user.email}</span>
                          {!user.isApproved ? (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-md uppercase tracking-wide">
                              PENDING
                            </span>
                          ) : !user.isActive ? (
                            <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-md uppercase tracking-wide">
                              SUSPENDED
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{user.role?.replace('_ROLE', '').replace('_', ' ')}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{user.department?.name || 'Not Assigned'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-700">{((user.credits || 0) + (user.bonusCredits || 0)).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-700">{user.totalCreditsUsed?.toLocaleString() || 0}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!user.isApproved ? (
                            <>
                              <button 
                                onClick={() => handleApproveUser(user._id)}
                                className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                title="Approve User"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                              </button>
                              <button 
                                onClick={() => handleRejectUser(user._id)}
                                className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Reject User"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => setMoveUserModal({ isOpen: true, userId: user._id, departmentId: user.department?._id || '' })}
                                className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Move Department"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                              </button>
                              
                              {currentUser._id !== user._id && (
                                <>
                                  {(user.role === 'USER_ROLE' || user.role === 'ADMIN_ROLE') && (
                                    <button 
                                      onClick={() => handleMakeOrgAdmin(user._id)}
                                      className="p-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                                      title="Promote to Co-Organization Admin"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                    </button>
                                  )}
                                  {user.role === 'SUPER_ADMIN_ROLE' && (
                                    <button 
                                      onClick={() => handleRemoveOrgAdmin(user._id)}
                                      className="p-2 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors"
                                      title="Revoke Organization Admin privileges"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    </button>
                                  )}
                                  {user.role === 'USER_ROLE' && (
                                    <button 
                                      onClick={() => handlePromoteUser(user._id)}
                                      className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                                      title="Promote to Dept Admin"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                    </button>
                                  )}
                                  {user.role === 'ADMIN_ROLE' && (
                                    <button 
                                      onClick={() => handleDemoteUser(user._id)}
                                      className="p-2 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                                      title="Demote to Standard User"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => handleRemoveUser(user._id)}
                                    className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                    title="Remove User"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">
                        No members found.
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
          <div className="flex flex-col p-6 space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Pending Sent System Requests</h2>
              <button 
                onClick={() => setRequestSystemCreditsModal({ isOpen: true, amount: 0, reason: '' })}
                className="px-4 py-2 bg-[#a26da8] text-white font-bold rounded-xl hover:bg-[#8e5c94] transition-colors text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                Request System Credits
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-100 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Amount Requested</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Reason</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Requested By</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Request Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pendingSentSystemRequests.map((req: any) => (
                    <tr key={req._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{req.amount?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{req.reason}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{req.requestedBy?.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{new Date(req.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-yellow-100 text-yellow-700">
                          Pending
                        </span>
                      </td>
                    </tr>
                  ))}
                  {pendingSentSystemRequests.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500 font-medium">No pending system requests.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Pending Requests</h2>
            </div>

            {/* Organic Signups */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">User Join Requests (Organic Signups)</h3>
              <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">User Email</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Requested At</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {joinRequests.filter((req: any) => req.source === 'user_signup').map((req: any) => (
                      <tr key={req._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{req.invitedEmail}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{new Date(req.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleApproveJoinRequest(req._id)}
                              className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                            </button>
                            <button 
                              onClick={() => handleRejectJoinRequest(req._id)}
                              className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {joinRequests.filter((req: any) => req.source === 'user_signup').length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-gray-500 font-medium">No pending organic signups.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Join Requests from Departments */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Join Requests from Departments</h3>
              <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Invited Email</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Target Department</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Requested By</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {joinRequests.filter((req: any) => req.source === 'onboarded').map((req: any) => (
                      <tr key={req._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{req.invitedEmail}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{req.targetDepartment?.name || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{req.requestedBy?.email || 'N/A'}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleApproveJoinRequest(req._id)}
                              className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                            </button>
                            <button 
                              onClick={() => handleRejectJoinRequest(req._id)}
                              className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {joinRequests.filter((req: any) => req.source === 'onboarded').length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500 font-medium">No pending join requests from departments.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Transfer Requests */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Department Transfer Requests</h3>
              <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">User Email</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Transfer</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {transferRequests.map((req: any) => (
                      <tr key={req._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{req.user?.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {req.fromDepartment?.name || 'None'} <span className="text-gray-400 mx-2">&rarr;</span> {req.toDepartment?.name || 'None'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleApproveTransferRequest(req._id)}
                              className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                            </button>
                            <button 
                              onClick={() => handleRejectTransferRequest(req._id)}
                              className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {transferRequests.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-gray-500 font-medium">No pending transfer requests.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Credit Requests */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Department Credit Requests</h3>
              <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Department</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Amount</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Reason</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Requested By</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {creditRequests.map((req: any) => (
                      <tr key={req._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{req.department?.name}</td>
                        <td className="px-6 py-4 font-semibold text-gray-700">{req.amount?.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{req.reason}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{req.requestedBy?.email}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleApproveCreditRequest(req._id, req.amount)}
                              className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                            </button>
                            <button 
                              onClick={() => handleRejectCreditRequest(req._id)}
                              className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {creditRequests.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500 font-medium">No pending credit requests.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="flex flex-col p-6 space-y-12">
            {/* Sent System Requests History */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Sent System Requests</h3>
              <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Amount Requested</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Reason</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Requested By</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Request Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Action Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Action By</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {sentSystemRequestsHistory.map((req: any) => (
                      <tr key={req._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{req.amount?.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{req.reason}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{req.requestedBy?.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{new Date(req.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{req.processedAt ? new Date(req.processedAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{req.processedBy?.email || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {sentSystemRequestsHistory.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500 font-medium">No sent system request history.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Join Requests History */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Join Requests History</h3>
              <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Invited User</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Source</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Target Dept</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Invited By</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Request Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Action Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Action By</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {joinRequestsHistory.map((req: any) => (
                      <tr key={req._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{req.invitedEmail}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${req.source === 'user_signup' ? 'bg-blue-100 text-blue-700' : req.source === 'onboarded' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                            {req.source === 'user_signup' ? 'User Signup' : req.source === 'onboarded' ? 'Onboarded' : req.source || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{req.targetDepartment?.name || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{req.requestedBy?.email || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{new Date(req.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{new Date(req.processedAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{req.processedBy?.email || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {joinRequestsHistory.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-gray-500 font-medium">No join request history.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Transfer Requests History */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Transfer Requests History</h3>
              <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Employee</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Current Dept</th>
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
                        <td className="px-6 py-4 text-sm text-gray-700">{req.fromDepartment?.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{req.toDepartment?.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{new Date(req.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{new Date(req.processedAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{req.processedBy?.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {transferRequestsHistory.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500 font-medium">No transfer request history.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Credit Requests History */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Credit Requests History</h3>
              <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Requesting Dept</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Amount</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Reason</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Requested By</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Request Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Action Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Action By</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {creditRequestsHistory.map((req: any) => (
                      <tr key={req._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{req.department?.name}</td>
                        <td className="px-6 py-4 font-semibold text-gray-700">{req.amount?.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{req.reason}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{req.requestedBy?.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{new Date(req.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{new Date(req.processedAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{req.processedBy?.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {creditRequestsHistory.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-gray-500 font-medium">No credit request history.</td>
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

export default OrgAdminDashboard;
