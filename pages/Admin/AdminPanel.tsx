
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const role = (user.role || '').toString().trim().toUpperCase();
        
        if (role === 'TENANT_ADMIN') {
          navigate('/admin/system', { replace: true });
        } else if (role === 'SUPER_ADMIN_ROLE') {
          navigate('/admin/org', { replace: true });
        } else if (role === 'ADMIN_ROLE') {
          navigate('/admin/dept', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } catch (e) {
        navigate('/login', { replace: true });
      }
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#a26da8]/20 border-t-[#a26da8] rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium animate-pulse">Redirecting to Admin Console...</p>
      </div>
    </div>
  );
};

export default AdminPanel;
