
import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { motion, AnimatePresence } from 'motion/react';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'onboard'>('dashboard');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  
  // Form states
  const [planForm, setPlanForm] = useState({ plan: 'BASIC', validityDays: 30, credits: 1000 });
  const [creditAmount, setCreditAmount] = useState(0);

  // Onboarding form state
  const [onboardForm, setOnboardForm] = useState({
    companyName: '',
    email: '',
    password: '',
    plan: 'BASIC',
    credits: 1000,
    validityDays: 30
  });
  const [onboardLoading, setOnboardLoading] = useState(false);
  const [onboardMessage, setOnboardMessage] = useState({ type: '', text: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        apiService.admin.getUsers(),
        apiService.admin.getDashboard()
      ]);
      
      if (usersRes.success) setUsers(usersRes.data);
      if (statsRes.success) setStats(statsRes.data);
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const res = await apiService.admin.approveUser(id);
      if (res.success) fetchData();
    } catch (err: any) {
      setAdminError(err.message || "Failed to approve user");
    }
  };

  const handleToggleAdmin = async (user: any) => {
    try {
      const res = user.role === 'ADMIN_ROLE' 
        ? await apiService.admin.revokeAdmin(user._id)
        : await apiService.admin.grantAdmin(user._id);
      if (res.success) fetchData();
    } catch (err: any) {
      setAdminError(err.message || "Failed to update admin role");
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await apiService.admin.toggleStatus(id);
      if (res.success) fetchData();
    } catch (err: any) {
      setAdminError(err.message || "Failed to toggle status");
    }
  };

  const handleAssignPlan = async () => {
    if (!selectedUser) return;
    try {
      const res = await apiService.admin.assignPlan(selectedUser._id, planForm);
      if (res.success) {
        fetchData();
        setShowPlanModal(false);
      }
    } catch (err: any) {
      setAdminError(err.message || "Failed to assign plan");
    }
  };

  const handleAdjustCredits = async () => {
    if (!selectedUser) return;
    try {
      const res = await apiService.admin.adjustCredits(selectedUser._id, creditAmount);
      if (res.success) {
        fetchData();
        setShowCreditModal(false);
      }
    } catch (err: any) {
      setAdminError(err.message || "Failed to adjust credits");
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await apiService.admin.deleteUser(userToDelete._id);
      fetchData();
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err: any) {
      console.error("Delete user error:", err);
      setAdminError(`Failed to delete user: ${err.message || 'Unknown error'}`);
      setShowDeleteModal(false);
    }
  };

  const handleDeleteUser = (user: any) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardLoading(true);
    setOnboardMessage({ type: '', text: '' });

    try {
      // 1. Create the user using signup endpoint
      const signupRes = await apiService.auth.register({
        companyName: onboardForm.companyName,
        email: onboardForm.email,
        password: onboardForm.password,
        reenterPassword: onboardForm.password
      });

      if (!signupRes.success) {
        throw new Error(signupRes.message || "Signup failed");
      }

      // We need the user ID to assign plan and credits. 
      // Usually signup might return the user object or we might need to find them in the list.
      // Let's refresh users list to find the new user
      const usersRes = await apiService.admin.getUsers();
      const newUser = usersRes.data.find((u: any) => u.email === onboardForm.email);

      if (newUser) {
        // 2. Approve the user immediately
        await apiService.admin.approveUser(newUser._id);

        // 3. Assign Plan
        await apiService.admin.assignPlan(newUser._id, {
          plan: onboardForm.plan,
          validityDays: onboardForm.validityDays,
          credits: onboardForm.credits
        });

        setOnboardMessage({ type: 'success', text: 'User onboarded successfully!' });
        setOnboardForm({
          companyName: '',
          email: '',
          password: '',
          plan: 'BASIC',
          credits: 1000,
          validityDays: 30
        });
        fetchData();
      } else {
        setOnboardMessage({ type: 'warning', text: 'User created but needs manual plan assignment.' });
      }
    } catch (err: any) {
      setOnboardMessage({ type: 'error', text: err.message || 'Onboarding failed' });
    } finally {
      setOnboardLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color }: any) => (
    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-6">
      <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-2xl shadow-sm`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-3xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  );

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-[#fcfdff] flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 border-4 border-purple-50 border-t-[#a26da8] rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Accessing Admin Console...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfdff] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-10 py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-purple-50 text-[#a26da8] px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#a26da8] animate-pulse"></span>
              System Administrator
            </div>
            <h1 className="text-5xl font-black text-gray-900 tracking-tighter leading-none">
              Control <span className="text-[#a26da8]">Center</span>
            </h1>
          </div>
          
          <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-white text-[#a26da8] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-white text-[#a26da8] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              User Management
            </button>
            <button 
              onClick={() => setActiveTab('onboard')}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'onboard' ? 'bg-white text-[#a26da8] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Onboard User
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-10 mt-12">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard title="Total Users" value={stats?.totalUsers || 0} icon="👥" color="bg-blue-50 text-blue-500" />
                <StatCard title="Active Sessions" value={stats?.activeUsers || 0} icon="⚡" color="bg-emerald-50 text-emerald-500" />
                <StatCard title="Pending Approvals" value={stats?.pendingApprovals || 0} icon="⏳" color="bg-orange-50 text-orange-500" />
                <StatCard title="Total Credits" value={stats?.totalCredits?.toLocaleString() || 0} icon="💎" color="bg-purple-50 text-[#a26da8]" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Recent Activity</h3>
                  <div className="space-y-6">
                    {stats?.recentActivity?.map((act: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg">
                          {act.type === 'LOGIN' ? '🔑' : act.type === 'EVAL' ? '🤖' : '📝'}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900">{act.message}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">{new Date(act.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    )) || (
                      <p className="text-center text-gray-400 text-xs font-bold uppercase py-10">No recent activity</p>
                    )}
                  </div>
                </div>

                <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">System Status</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">API Health</p>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-lg font-black text-gray-900">Operational</span>
                      </div>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Database</p>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-lg font-black text-gray-900">Connected</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'users' ? (
            <motion.div 
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">User</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Plan</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Credits</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#a26da8] flex items-center justify-center font-black">
                              {user.firstName?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{user.firstName} {user.lastName}</p>
                              <p className="text-xs text-gray-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${user.role === 'ADMIN_ROLE' ? 'bg-purple-50 text-[#a26da8]' : 'bg-gray-50 text-gray-400'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-xs font-bold text-gray-600">{user.plan || 'FREE'}</span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-xs font-black text-gray-900">{user.credits?.toLocaleString() || 0}</span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                              {user.isActive ? 'Active' : 'Suspended'}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex justify-end gap-2">
                            {!user.isApproved && (
                              <button 
                                onClick={() => handleApprove(user._id)}
                                className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                                title="Approve User"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                            )}
                            <button 
                              onClick={() => { setSelectedUser(user); setShowPlanModal(true); }}
                              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                              title="Assign Plan"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => { setSelectedUser(user); setShowCreditModal(true); }}
                              className="p-2 bg-purple-50 text-[#a26da8] rounded-lg hover:bg-purple-100 transition-colors"
                              title="Adjust Credits"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => handleToggleAdmin(user)}
                              className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors"
                              title={user.role === 'ADMIN_ROLE' ? 'Revoke Admin' : 'Grant Admin'}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => handleToggleStatus(user._id)}
                              className={`p-2 rounded-lg transition-colors ${user.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                              title={user.isActive ? 'Suspend' : 'Activate'}
                            >
                              {user.isActive ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user)}
                              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                              title="Delete User"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="onboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto"
            >
              <div className="bg-white p-12 rounded-[48px] border border-gray-100 shadow-sm space-y-10">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-black text-gray-900">Onboard New User</h2>
                  <p className="text-gray-400 font-medium uppercase text-[10px] tracking-widest">Create and configure a new enterprise account</p>
                </div>

                {onboardMessage.text && (
                  <div className={`p-4 rounded-2xl text-xs font-bold border ${onboardMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : onboardMessage.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                    {onboardMessage.text}
                  </div>
                )}

                <form onSubmit={handleOnboardSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Company Name</label>
                      <input 
                        type="text"
                        required
                        value={onboardForm.companyName}
                        onChange={(e) => setOnboardForm({...onboardForm, companyName: e.target.value})}
                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none font-bold text-gray-800 focus:bg-white focus:border-[#a26da8] transition-all"
                        placeholder="Acme Corp"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Email Address</label>
                      <input 
                        type="email"
                        required
                        value={onboardForm.email}
                        onChange={(e) => setOnboardForm({...onboardForm, email: e.target.value})}
                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none font-bold text-gray-800 focus:bg-white focus:border-[#a26da8] transition-all"
                        placeholder="user@acme.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Initial Password</label>
                      <input 
                        type="password"
                        required
                        value={onboardForm.password}
                        onChange={(e) => setOnboardForm({...onboardForm, password: e.target.value})}
                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none font-bold text-gray-800 focus:bg-white focus:border-[#a26da8] transition-all"
                        placeholder="********"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Plan Type</label>
                      <select 
                        value={onboardForm.plan}
                        onChange={(e) => setOnboardForm({...onboardForm, plan: e.target.value})}
                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none font-bold text-gray-800 focus:bg-white focus:border-[#a26da8] transition-all"
                      >
                        <option value="FREE">FREE</option>
                        <option value="BASIC">BASIC</option>
                        <option value="PRO">PRO</option>
                        <option value="ENTERPRISE">ENTERPRISE</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Validity (Days)</label>
                      <input 
                        type="number"
                        required
                        value={onboardForm.validityDays}
                        onChange={(e) => setOnboardForm({...onboardForm, validityDays: Number(e.target.value)})}
                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none font-bold text-gray-800 focus:bg-white focus:border-[#a26da8] transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Initial Credits</label>
                      <input 
                        type="number"
                        required
                        value={onboardForm.credits}
                        onChange={(e) => setOnboardForm({...onboardForm, credits: Number(e.target.value)})}
                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none font-bold text-gray-800 focus:bg-white focus:border-[#a26da8] transition-all"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={onboardLoading}
                    className="w-full py-5 bg-[#a26da8] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-purple-100 hover:bg-[#8b6aa1] transition-all disabled:bg-gray-200 flex items-center justify-center gap-3"
                  >
                    {onboardLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        Complete Onboarding
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-md z-[999] flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[40px] p-12 max-w-md w-full shadow-2xl space-y-8"
          >
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-gray-900">Assign License</h3>
              <p className="text-sm text-gray-400 font-medium">Updating plan for {selectedUser?.firstName}</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Plan Type</label>
                <select 
                  value={planForm.plan}
                  onChange={(e) => setPlanForm({...planForm, plan: e.target.value})}
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none font-bold text-gray-800 focus:bg-white focus:border-[#a26da8] transition-all"
                >
                  <option value="FREE">FREE</option>
                  <option value="BASIC">BASIC</option>
                  <option value="PRO">PRO</option>
                  <option value="ENTERPRISE">ENTERPRISE</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Validity (Days)</label>
                  <input 
                    type="number"
                    value={planForm.validityDays}
                    onChange={(e) => setPlanForm({...planForm, validityDays: Number(e.target.value)})}
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none font-bold text-gray-800 focus:bg-white focus:border-[#a26da8] transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Initial Credits</label>
                  <input 
                    type="number"
                    value={planForm.credits}
                    onChange={(e) => setPlanForm({...planForm, credits: Number(e.target.value)})}
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none font-bold text-gray-800 focus:bg-white focus:border-[#a26da8] transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={() => setShowPlanModal(false)} className="flex-1 py-4 border-2 border-gray-100 rounded-2xl font-black text-gray-400 hover:bg-gray-50 transition-colors uppercase text-[10px] tracking-widest">Cancel</button>
              <button onClick={handleAssignPlan} className="flex-1 py-4 bg-[#a26da8] text-white rounded-2xl font-black hover:bg-[#8b6aa1] shadow-xl shadow-purple-100 transition-all uppercase text-[10px] tracking-widest">Assign Plan</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Credit Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-md z-[999] flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[40px] p-12 max-w-md w-full shadow-2xl space-y-8"
          >
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-gray-900">Adjust Credits</h3>
              <p className="text-sm text-gray-400 font-medium">Use negative values to deduct</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Amount</label>
              <input 
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(Number(e.target.value))}
                placeholder="e.g. 500 or -200"
                className="w-full px-8 py-6 rounded-3xl bg-gray-50 border border-gray-100 outline-none font-black text-2xl text-center text-gray-800 focus:bg-white focus:border-[#a26da8] transition-all"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={() => setShowCreditModal(false)} className="flex-1 py-4 border-2 border-gray-100 rounded-2xl font-black text-gray-400 hover:bg-gray-50 transition-colors uppercase text-[10px] tracking-widest">Cancel</button>
              <button onClick={handleAdjustCredits} className="flex-1 py-4 bg-[#a26da8] text-white rounded-2xl font-black hover:bg-[#8b6aa1] shadow-xl shadow-purple-100 transition-all uppercase text-[10px] tracking-widest">Update Credits</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-md z-[999] flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[40px] p-12 max-w-md w-full shadow-2xl space-y-8"
          >
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mx-auto">
                ⚠️
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-gray-900">Confirm Deletion</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  Are you sure you want to delete <span className="font-bold text-gray-900">{userToDelete?.email}</span>? 
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => { setShowDeleteModal(false); setUserToDelete(null); }} 
                className="flex-1 py-4 border-2 border-gray-100 rounded-2xl font-black text-gray-400 hover:bg-gray-50 transition-colors uppercase text-[10px] tracking-widest"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete} 
                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black hover:bg-red-600 shadow-xl shadow-red-100 transition-all uppercase text-[10px] tracking-widest"
              >
                Delete User
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Error Toast */}
      {adminError && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[150]">
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gray-900 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10"
          >
            <span className="text-red-400 font-black">ERROR</span>
            <span className="text-sm font-medium">{adminError}</span>
            <button 
              onClick={() => setAdminError(null)}
              className="ml-4 p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
