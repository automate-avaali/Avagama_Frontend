
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../services/api';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiService.auth.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset.');
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
            Account <span className="text-[#a26da8]">recovery</span> made simple.
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed mt-6">
            Enter your email address and we'll send you a secure link to reset your workspace access.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-white lg:bg-transparent">
        <div className="w-full max-w-lg bg-white rounded-[24px] p-12 shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-gray-100">
          <div className="space-y-2 mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Forgot password?</h2>
            <p className="text-gray-400 font-medium">Reset your secure access</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
              {error}
            </div>
          )}

          {success ? (
            <div className="space-y-8 animate-fadeIn">
              <div className="p-6 bg-green-50 border border-green-100 rounded-2xl text-center">
                <div className="text-4xl mb-4">📧</div>
                <h3 className="font-bold text-green-800 text-lg mb-2">Check your inbox</h3>
                <p className="text-green-600 text-sm">We've sent a recovery link to <strong>{email}</strong>. Please check your email to continue.</p>
              </div>
              <Link to="/login" className="block w-full text-center py-4 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-black transition-all uppercase text-xs tracking-widest">
                Back to Sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-white focus:border-[#a26da8] focus:ring-1 focus:ring-[#a26da8] outline-none transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full ${loading ? "bg-gray-300" : "bg-[#d1b1d1] hover:opacity-90"} text-white font-bold py-4 rounded-xl transition-all shadow-md mt-4 flex items-center justify-center gap-2`}
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Send reset link"}
              </button>

              <div className="text-center pt-4">
                <Link to="/login" className="text-sm text-gray-400 font-bold hover:text-[#a26da8] transition-colors">
                  Nevermind, I remember it.
                </Link>
              </div>
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

export default ForgotPassword;
