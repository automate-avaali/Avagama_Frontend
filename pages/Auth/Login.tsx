
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { useCortex } from '../../context/CortexContext';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { refreshCredits } = useCortex();

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiService.auth.login({ email, password });
      
      if (response?.success) {
        if (response.isApproved === false) {
           setError('Signup successful. Await admin approval to access your workspace.');
           setLoading(false);
           return;
        }

        const token = response.token;
        if (token) {
          sessionStorage.setItem("token", token);
          
          const userInfo = {
            firstName: email.split('@')[0],
            role: response.role || 'USER_ROLE',
            credits: response.credits || 0,
            organization: response.organization || null,
            department: response.department || null,
            email: email
          };
          
          sessionStorage.setItem("user", JSON.stringify(userInfo));

          await refreshCredits();
          onLogin();
          navigate("/dashboard");
        } else {
          setError("Login failed. No token received.");
        }
      } else {
        setError(response?.message || "Access denied. Please check your credentials.");
      }
    } catch (err: any) {
      setError(err.message || "Access denied. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col lg:flex-row bg-[#fcfdff]">
      {/* Left Branding Side */}
      <div className="lg:w-[45%] p-12 lg:p-24 flex flex-col justify-center bg-[#f8f9ff]">
        <div className="space-y-8 max-w-xl">
          <h1 className="text-7xl font-bold text-gray-900 tracking-tight">
            Avagama.ai
          </h1>
          <h2 className="text-4xl font-semibold leading-tight text-gray-800">
            <span className="text-[#a26da8]">AI-powered</span>{" "}
            <span className="text-[#6fcbbd]">process</span> evaluation for your
            enterprise
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed mt-6">
            Helps enterprises evaluate and prioritize business processes using
            AI-driven insights, risk analysis and intelligent decision making.
          </p>

          <div className="space-y-6 mt-12">
            {[
              {
                text: "AI-Powered process evaluation",
                icon: "M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z",
                color: "bg-[#a26da8]",
              },
              {
                text: "Automation & augmentations readiness scoring",
                icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                color: "bg-[#a26da8]",
              },
              {
                text: "Enterprise-grade security & compliance",
                icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
                color: "bg-[#6fcbbd]",
              },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-5">
                <div
                  className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center text-white shadow-lg`}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d={item.icon}
                    />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form Side */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white lg:bg-transparent">
        <div className="w-full max-w-lg bg-white rounded-[24px] p-12 shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-gray-100">
          <div className="flex bg-gray-50 p-1.5 rounded-2xl mb-12">
            <button className="flex-1 text-center py-2.5 text-sm font-bold bg-white rounded-xl shadow-sm text-gray-800">
              Sign in
            </button>
            <Link
              to="/register"
              className="flex-1 text-center py-2.5 text-sm font-medium text-gray-400 hover:text-gray-600 transition-all"
            >
              Sign up
            </Link>
          </div>

          <div className="space-y-2 mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Welcome back!</h2>
            <p className="text-gray-400 font-medium">
              Sign in with your Avagama.ai account
            </p>
          </div>

          {error && (
            <div className={`mb-6 p-4 rounded-xl text-sm font-bold border ${error.includes('approval') ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-white focus:border-[#a26da8] focus:ring-1 focus:ring-[#a26da8] outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="*********"
                  className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-white focus:border-[#a26da8] focus:ring-1 focus:ring-[#a26da8] outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.956 9.956 0 012.042-3.368M6.223 6.223A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.978 9.978 0 01-4.132 5.226M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-[#a26da8] font-medium hover:underline"
                >
                  Forget Password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${loading ? "bg-gray-300" : "bg-[#d1b1d1] hover:opacity-90"} text-white font-bold py-4 rounded-xl transition-all shadow-md mt-4 flex items-center justify-center gap-2`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                "Access your workspace"
              )}
            </button>
          </form>

          <div className="mt-16 text-center text-sm text-gray-400 font-medium">
            Powered by Avaali | © 2026, All Rights Reserved
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
