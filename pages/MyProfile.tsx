
import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { motion } from 'motion/react';

const MyProfile: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiService.auth.getMe();
        if (res.success) {
          setProfile(res.data);
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfdff] flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 border-4 border-purple-50 border-t-[#a26da8] rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Loading Profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfdff] pb-20">
      <div className="bg-white border-b border-gray-100 px-10 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-purple-50 text-[#a26da8] px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase">
              User Profile
            </div>
            <h1 className="text-5xl font-black text-gray-900 tracking-tighter leading-none">
              My <span className="text-[#a26da8]">Profile</span>
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-10 mt-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-12 rounded-[48px] border border-gray-100 shadow-sm space-y-12"
        >
          <div className="flex items-center gap-8">
            <div className="w-24 h-24 rounded-[32px] bg-purple-50 text-[#a26da8] flex items-center justify-center text-4xl font-black shadow-inner">
              {profile?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-gray-900">{profile?.email}</h2>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-gray-50 text-gray-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-gray-100">
                  {profile?.role}
                </span>
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${profile?.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                  {profile?.isActive ? 'Active' : 'Suspended'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 bg-gray-50 rounded-[32px] border border-gray-100 space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Credit Balance</h3>
              <div className="space-y-2">
                <p className="text-4xl font-black text-gray-900">{profile?.credits?.toLocaleString()}</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Including {profile?.bonusCredits?.toLocaleString()} Bonus Credits
                </p>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Consumed</p>
                  <p className="text-xl font-black text-gray-900">{profile?.totalCreditsUsed?.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-gray-50 rounded-[32px] border border-gray-100 space-y-6">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Organization</h3>
                <div className="space-y-1">
                  <p className="text-xl font-black text-gray-900">{profile?.organization?.name}</p>
                  <p className="text-xs font-bold text-[#a26da8] uppercase tracking-widest">Plan: {profile?.organization?.plan}</p>
                </div>
              </div>
              <div className="pt-6 border-t border-gray-200 space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Department</h3>
                <div className="space-y-1">
                  <p className="text-xl font-black text-gray-900">{profile?.department?.name}</p>
                  {profile?.department?.isDefault && (
                    <span className="text-[8px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded uppercase font-black">Default</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100">
              {error}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MyProfile;
