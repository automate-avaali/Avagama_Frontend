import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const OAuthHandler: React.FC = () => {
  const [searchParams] = useSearchParams();
  const oauthParam = searchParams.get('oauth');
  const result = searchParams.get('oauth_result');
  const error = searchParams.get('oauth_error');

  useEffect(() => {
    if (oauthParam === 'callback' && window.opener) {
      // Notify parent window
      window.opener.postMessage({
        type: 'OAUTH_COMPLETED',
        result,
        error
      }, window.location.origin);

      // Auto-close after a delay
      const timer = setTimeout(() => {
        window.close();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [oauthParam, result, error]);

  // If this is reached normally (not as a callback popup)
  if (oauthParam !== 'callback') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[32px] p-10 border border-gray-100 shadow-xl text-center">
          <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-[#a26da8] mx-auto mb-6">
            <Loader2 className="animate-spin" size={32} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Redirecting...</h2>
          <p className="text-gray-500 font-medium tracking-tight">Please wait while we take you to the tools dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full animate-fadeIn">
        {result === 'success' ? (
          <div className="bg-white rounded-[40px] p-12 border border-green-100 shadow-2xl shadow-green-900/5 text-center">
            <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center text-green-500 mx-auto mb-8">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Connected!</h2>
            <p className="text-gray-500 font-bold tracking-tight uppercase text-[10px]">Your account was linked successfully</p>
            <p className="text-gray-400 text-xs mt-6 font-medium">This window will close automatically.</p>
          </div>
        ) : (
          <div className="bg-white rounded-[40px] p-12 border border-red-100 shadow-2xl shadow-red-900/5 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-8">
              <XCircle size={40} />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Failed</h2>
            <p className="text-red-500 font-black tracking-tight uppercase text-[10px] mb-4">Connection Attempt Error</p>
            <p className="text-gray-500 font-medium text-sm bg-gray-50 p-4 rounded-2xl border border-gray-100">
              {error || 'An unexpected error occurred during authentication.'}
            </p>
            <p className="text-gray-400 text-xs mt-8 font-medium">This window will close automatically.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuthHandler;
