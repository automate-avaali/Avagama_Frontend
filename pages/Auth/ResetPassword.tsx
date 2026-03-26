
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../../services/api';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('token');
    if (t) {
      setToken(t);
    } else {
      setError('Invalid or expired reset token. Please request a new one.');
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await apiService.auth.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col lg:flex-row bg-[#fcfdff]">
      <div className="lg:w-[45%] p-12 lg:p-24 flex flex-col justify-center bg-[#f8f9ff]">
        <div className="space-y-8 max-w-xl">
          <h1 className="text-7xl font-bold text-gray-900 tracking-tight">Avagama.ai</h1>
          <h2 className="text-4xl font-semibold leading-tight text-gray-800">
            Set your <span className="text-[#a26da8]">new</span> password.
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed mt-6">
            Create a strong, secure password to regain access to your enterprise process evaluation workspace.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-white lg:bg-transparent">
        <div className="w-full max-w-lg bg-white rounded-[24px] p-12 shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-gray-100">
          <div className="space-y-2 mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Reset Password</h2>
            <p className="text-gray-400 font-medium">Secure your account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
              {error}
            </div>
          )}

          {success ? (
            <div className="p-6 bg-green-50 border border-green-100 rounded-2xl text-center animate-fadeIn">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="font-bold text-green-800 text-lg mb-2">Password Reset Successful</h3>
              <p className="text-green-600 text-sm">Your password has been updated. Redirecting you to sign in...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="*********"
                    className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-white focus:border-[#a26da8] focus:ring-1 focus:ring-[#a26da8] outline-none transition-all"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.956 9.956 0 012.042-3.368M6.223 6.223A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.978 9.978 0 01-4.132 5.226M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="*********"
                  className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-white focus:border-[#a26da8] focus:ring-1 focus:ring-[#a26da8] outline-none transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !token}
                className={`w-full ${loading || !token ? "bg-gray-300" : "bg-[#d1b1d1] hover:opacity-90"} text-white font-bold py-4 rounded-xl transition-all shadow-md mt-4 flex items-center justify-center gap-2`}
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Reset Password"}
              </button>
            </form>
          )}

          <div className="mt-16 text-center text-sm text-gray-400 font-medium">
            Powered by Avaali | © 2026, All Rights Reserved
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
