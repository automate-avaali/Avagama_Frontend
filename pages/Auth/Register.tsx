
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    password: '',
    reenterPassword: '' 
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showReenterPassword, setShowReenterPassword] = useState(false);
  
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.reenterPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const licenseAssignedAt = new Date().toISOString();
      const licenseExpiry = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days from now

      const response = await apiService.auth.register({
        companyName: formData.companyName,
        email: formData.email,
        password: formData.password,
        reenterPassword: formData.reenterPassword,
        licenseAssignedAt,
        licenseExpiry
      });
      
      setSuccess(response.message || 'Signup successful. Await admin approval.');
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col lg:flex-row bg-[#fcfdff] overflow-hidden">
      {/* Left Column: Content */}
      <div className="lg:w-[45%] bg-[#f8f9ff] p-12 lg:p-24 flex flex-col justify-center border-r border-gray-50">
        <div className="space-y-6 max-w-xl">
          <h1 className="text-7xl font-bold text-gray-900 tracking-tight">
            Avagama.ai
          </h1>
          <h2 className="text-4xl font-semibold leading-tight text-gray-800">
            <span className="text-[#a26da8]">AI-powered</span> <span className="text-[#6fcbbd]">process</span> evaluation for your enterprise
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed mt-6">
            Helps enterprises evaluate and prioritize business processes using AI-driven insights, risk analysis and intelligent decision making.
          </p>

          <div className="space-y-6 mt-12">
            {[
              { text: 'AI-Powered process evaluation', icon: 'M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z', color: 'bg-[#a26da8]' },
              { text: 'Automation & augmentations readiness scoring', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-[#a26da8]' },
              { text: 'Enterprise-grade security & compliance', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', color: 'bg-[#6fcbbd]' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-5">
                <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Form Card */}
      <div className="flex-1 bg-white relative flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-[24px] p-12 shadow-[0_10px_50px_rgba(0,0,0,0.05)] border border-gray-100 my-8">
            {/* Custom Tabs */}
            <div className="flex bg-gray-50 p-1.5 rounded-2xl mb-12">
              <Link to="/login" className="flex-1 text-center py-2.5 text-sm font-medium text-gray-400 hover:text-gray-600 transition-all">Sign in</Link>
              <button className="flex-1 text-center py-2.5 text-sm font-bold bg-white rounded-xl shadow-sm text-gray-800 transition-all">Sign up</button>
            </div>

            <div className="space-y-2 mb-10">
              <h2 className="text-3xl font-bold text-gray-900">Get started!</h2>
              <p className="text-gray-400 font-medium">Create your Avagama.ai account</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-xl text-sm font-bold border border-green-100">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Company Name</label>
                <input 
                  name="companyName"
                  type="text" 
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="Company Inc." 
                  className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-white focus:border-[#a26da8] focus:ring-1 focus:ring-[#a26da8] outline-none transition-all placeholder:text-gray-300"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Email address</label>
                <input 
                  name="email"
                  type="email" 
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@company.com" 
                  className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-white focus:border-[#a26da8] focus:ring-1 focus:ring-[#a26da8] outline-none transition-all placeholder:text-gray-300"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">
                  Enter password
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="*********"
                    className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-white focus:border-[#a26da8] focus:ring-1 focus:ring-[#a26da8] outline-none transition-all placeholder:text-gray-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.956 9.956 0 012.042-3.368M6.223 6.223A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.978 9.978 0 01-4.132 5.226M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">
                  Re-enter password
                </label>
                <div className="relative">
                  <input
                    name="reenterPassword"
                    type={showReenterPassword ? "text" : "password"}
                    value={formData.reenterPassword}
                    onChange={handleInputChange}
                    placeholder="*********"
                    className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-white focus:border-[#a26da8] focus:ring-1 focus:ring-[#a26da8] outline-none transition-all placeholder:text-gray-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowReenterPassword((prev) => !prev)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showReenterPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.956 9.956 0 012.042-3.368M6.223 6.223A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.978 9.978 0 01-4.132 5.226M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className={`w-full ${loading ? 'bg-gray-300' : 'bg-[#d1b1d1] hover:opacity-90'} text-white font-bold py-4 rounded-xl transition-all shadow-md mt-6 flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : 'Create your workspace'}
              </button>
            </form>
          </div>
          
          <div className="pb-12 text-center">
            <p className="text-sm text-gray-400 font-medium">
              Powered by Avaali | © 2026, All Rights Reserved
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
