
import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { apiService } from '../services/api';

interface NavigationProps {
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
}

const Navigation: React.FC<NavigationProps> = ({ isAuthenticated, setIsAuthenticated }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [initial, setInitial] = useState('U');
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState('USER_ROLE');
  const [profileData, setProfileData] = useState<any>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showConsumption, setShowConsumption] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [showDiscoveryMenu, setShowDiscoveryMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const fetchMe = async () => {
      if (isAuthenticated) {
        try {
          const response = await apiService.auth.getMe();
          if (response?.success && response?.data) {
            setUserRole(response.data.role || 'USER_ROLE');
            setProfileData(response.data);
          } else {
            throw new Error("Invalid response");
          }
        } catch (error) {
          console.error("Failed to fetch /api/me", error);
          const storedUser = sessionStorage.getItem('user');
          if (storedUser) {
            try {
              const user = JSON.parse(storedUser);
              setUserRole(user.role || 'USER_ROLE');
              setProfileData(user);
            } catch (e) {}
          }
        }
      }
    };
    fetchMe();

    const handleProfileUpdate = () => {
      fetchMe();
    };

    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
    };
  }, [isAuthenticated, location.pathname]);

  useEffect(() => {
    const checkUser = () => {
      if (isAuthenticated) {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            if (user.firstName) {
              setInitial(user.firstName.charAt(0).toUpperCase());
            }
            // Flexible check for admin role
            const userRole = (user.role || '').toString().trim().toUpperCase();
            setIsAdmin(userRole === 'ADMIN_ROLE' || userRole === 'ADMIN' || user.isAdmin === true);
          } catch (e) {
            console.error("Failed to parse user data");
          }
        }
      } else {
        setIsAdmin(false);
        setInitial('U');
      }
    };

    checkUser();
    
    // Also listen for storage events in case of multi-tab or manual updates
    window.addEventListener('storage', checkUser);
    
    return () => {
      window.removeEventListener('storage', checkUser);
      if (dropdownTimeoutRef.current) {
        window.clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, [isAuthenticated, location.pathname]); // Added location.pathname to re-check on navigation just in case

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate('/');
  };

  const openDropdown = () => {
    if (dropdownTimeoutRef.current) {
      window.clearTimeout(dropdownTimeoutRef.current);
    }
    setShowDiscoveryMenu(true);
  };

  const closeDropdown = () => {
    dropdownTimeoutRef.current = window.setTimeout(() => {
      setShowDiscoveryMenu(false);
    }, 400); // 400ms delay to give user time to move mouse into the menu
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'TENANT_ADMIN': return 'System Administrator';
      case 'SUPER_ADMIN_ROLE': return 'Organization Admin';
      case 'ADMIN_ROLE': return 'Department Admin';
      case 'USER_ROLE': return 'Standard User';
      default: return 'Standard User';
    }
  };

 const Logo = () => (
    <div className="flex items-center">
      <img
        src="/Avagama.AI_Logo.jpg"
        alt="Avagama AI"
        className="h-10 object-contain"
      />
      <span className="text-[8px] text-gray-400 relative -top-3 ml-[2px]">
                    TM
                  </span>
    </div>
  );

  return (
    <>
      <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-gray-50 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-4 md:px-10 py-4 md:py-5 flex items-center justify-between gap-4">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center transition-opacity hover:opacity-80 relative z-[120] shrink-0">
            <Logo />
          </Link>

        {/* Center: Desktop Navigation */}
        {!isAuthPage && (
          <div className="hidden lg:flex items-center justify-center flex-1 gap-8 xl:gap-12">
            {!isAuthenticated ? (
              <>
                <Link to="/about" className="text-sm font-bold tracking-wide text-gray-500 hover:text-gray-900 transition-colors uppercase">About</Link>
                {/* <Link to="/pricing" className="text-sm font-bold tracking-wide text-gray-500 hover:text-gray-900 transition-colors uppercase">Pricing</Link> */}
                <Link to="/support" className="text-sm font-bold tracking-wide text-gray-500 hover:text-gray-900 transition-colors uppercase">Help & Support</Link>
{/* <Link to="/demo" className="text-sm font-bold tracking-wide text-gray-500 hover:text-gray-900 transition-colors uppercase">Demo</Link> */}
                <Link to="/guided-tour" className="text-sm font-bold tracking-wide text-gray-500 hover:text-gray-900 transition-colors uppercase">Guided Tour</Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className={`text-sm font-bold tracking-wide transition-colors ${location.pathname === '/dashboard' ? 'text-[#a26da8]' : 'text-gray-500 hover:text-gray-900'}`}>DASHBOARD</Link>
                
                {/* Discovery Dropdown */}
                <div 
                  className="relative group"
                  onMouseEnter={openDropdown}
                  onMouseLeave={closeDropdown}
                >
                  <button className={`text-sm font-bold tracking-wide flex items-center gap-1 transition-colors ${location.pathname.includes('/discovery') ? 'text-[#a26da8]' : 'text-gray-500 hover:text-gray-900'}`}>
                    AI DISCOVERY
                    <svg className={`w-4 h-4 transition-transform duration-300 ${showDiscoveryMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  
                  {showDiscoveryMenu && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 pt-2 w-56 bg-transparent z-[60]">
                      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 overflow-hidden animate-fadeIn">
                        <Link 
                          to="/discovery/company" 
                          className="flex items-center gap-3 px-5 py-3 text-xs font-bold text-gray-600 hover:bg-purple-50 hover:text-[#a26da8] transition-all"
                          onClick={() => setShowDiscoveryMenu(false)}
                        >
                          <span className="w-2 h-2 rounded-full bg-[#a26da8]"></span>
                          Company Focus
                        </Link>
                        <Link 
                          to="/discovery/domain" 
                          className="flex items-center gap-3 px-5 py-3 text-xs font-bold text-gray-600 hover:bg-teal-50 hover:text-[#4db6ac] transition-all"
                          onClick={() => setShowDiscoveryMenu(false)}
                        >
                          <span className="w-2 h-2 rounded-full bg-[#4db6ac]"></span>
                          Domain Focus
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                <Link to="/evaluations" className={`text-sm font-bold tracking-wide transition-colors ${location.pathname === '/evaluations' ? 'text-[#a26da8]' : 'text-gray-500 hover:text-gray-900'}`}>MY EVALUATIONS</Link>
                
                {userRole === 'TENANT_ADMIN' && (
                  <Link to="/admin/system" className={`text-sm font-bold tracking-wide transition-colors ${location.pathname.includes('/admin/system') ? 'text-[#a26da8]' : 'text-gray-500 hover:text-gray-900'}`}>SYSTEM ADMIN</Link>
                )}
                {userRole === 'SUPER_ADMIN_ROLE' && (
                  <Link to="/admin/org" className={`text-sm font-bold tracking-wide transition-colors ${location.pathname.includes('/admin/org') ? 'text-[#a26da8]' : 'text-gray-500 hover:text-gray-900'}`}>ORG ADMIN</Link>
                )}
                {(userRole === 'ADMIN_ROLE' || userRole === 'SUPER_ADMIN_ROLE') && (
                  <Link to="/admin/dept" className={`text-sm font-bold tracking-wide transition-colors ${location.pathname.includes('/admin/dept') ? 'text-[#a26da8]' : 'text-gray-500 hover:text-gray-900'}`}>DEPT ADMIN</Link>
                )}
              </>
            )}
          </div>
        )}

        {/* Right: Actions & Hamburger */}
        <div className="flex items-center gap-3 md:gap-6 shrink-0 relative z-[120]">
          {isAuthPage ? (
            <button 
              onClick={() => navigate('/support')}
              className="hidden md:flex items-center gap-2 text-[#a26da8] font-bold text-sm cursor-pointer hover:opacity-80 transition-opacity"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              Help & Support
            </button>
          ) : isAuthenticated ? (
            <div className="flex items-center gap-3 md:gap-5">
              <div 
                className="relative group"
                ref={profileMenuRef}
              >
                <div 
                  className="w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-gradient-to-br from-[#a26da8] to-[#6fcbbd] flex items-center justify-center text-white font-black shadow-lg text-sm md:text-base shrink-0 cursor-pointer"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                >
                  {initial}
                </div>
                
                {showProfileMenu && profileData && (
                  <div className="absolute top-full right-0 mt-2 w-[300px] sm:w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 sm:p-6 animate-fadeIn z-[60] origin-top-right">
                    <div className="flex flex-col gap-4">
                      <div className="border-b border-gray-100 pb-4">
                        <h3 className="text-lg font-bold text-gray-900 truncate">{profileData.email}</h3>
                        <p className="text-sm font-medium text-gray-500 mt-1">{getRoleLabel(profileData.role)}</p>
                      </div>
                      
                      <div className="flex flex-col gap-3 py-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Company Name</span>
                          <span className="text-sm font-semibold text-gray-800">{profileData.organization?.name || 'System Level'}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Plan</span>
                          {profileData.organization?.plan ? (
                            <span className="px-2.5 py-1 bg-purple-50 text-[#a26da8] text-xs font-bold rounded-lg uppercase tracking-wide">
                              {profileData.organization.plan}
                            </span>
                          ) : (
                            <span className="text-sm font-semibold text-gray-800">N/A</span>
                          )}
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Department</span>
                          <span className="text-sm font-semibold text-gray-800">{profileData.department?.name || 'System Level'}</span>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold text-gray-500">Base Plan Pack</span>
                          <span className="text-xs font-black text-gray-900">{(profileData.credits || 0) - (profileData.bonusCredits || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold text-gray-500">Extra Credits Allocated</span>
                          <span className="text-xs font-black text-green-600">+{profileData.bonusCredits || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold text-gray-500">Total Personal Credits</span>
                          <span className="text-xs font-black text-gray-900">{profileData.credits || 0}</span>
                        </div>
                        
                        {/* Accordion Toggle */}
                        <div className="mt-1 border-t border-gray-200 pt-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setShowConsumption(!showConsumption); }}
                            className="text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wider w-full text-left flex justify-between items-center"
                          >
                            View Consumption Details
                            <span className={`transform transition-transform ${showConsumption ? 'rotate-180' : ''}`}>▼</span>
                          </button>
                        </div>

                        <AnimatePresence>
                          {showConsumption && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden flex flex-col gap-2 pt-2"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] font-bold text-gray-500">Total Credits Consumed</span>
                                <span className="text-xs font-black text-gray-900">{profileData.totalCreditsUsed || 0}</span>
                              </div>
                              
                              {/* Progress Slider */}
                              <div className="flex flex-col gap-1">
                                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      ((profileData.totalCreditsUsed || 0) / (profileData.credits || 1)) * 100 > 90 ? 'bg-red-500' :
                                      ((profileData.totalCreditsUsed || 0) / (profileData.credits || 1)) * 100 > 75 ? 'bg-orange-500' :
                                      'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(((profileData.totalCreditsUsed || 0) / (profileData.credits || 1)) * 100, 100)}%` }}
                                  />
                                </div>
                                <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase">
                                  <span>0</span>
                                  <span>{profileData.credits || 0} MAX</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={handleLogout} className="hidden md:block p-2 text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-4">
              <Link to="/login" className="text-sm font-bold text-gray-500 hover:text-gray-900 px-4 py-2">LOG IN</Link>
              <Link to="/register" className="bg-gray-900 text-white px-7 py-3 rounded-2xl text-xs font-black tracking-widest uppercase hover:bg-black transition-all shadow-xl shadow-gray-100">
                Get Started
              </Link>
            </div>
          )}

          {/* Hamburger Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden w-11 h-11 flex items-center justify-center bg-purple-50/50 rounded-xl text-gray-900 transition-all active:scale-95"
            aria-label="Toggle menu"
          >
            <div className="w-5 flex flex-col gap-1.5">
              <motion.span 
                animate={isMobileMenuOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="w-full h-0.5 bg-gray-800 rounded-full origin-center"
              />
              <motion.span 
                animate={isMobileMenuOpen ? { opacity: 0, x: -10 } : { opacity: 1, x: 0 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
                className="w-3/4 h-0.5 bg-gray-800 rounded-full"
              />
              <motion.span 
                animate={isMobileMenuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="w-full h-0.5 bg-gray-800 rounded-full origin-center"
              />
            </div>
          </button>
        </div>
      </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
            className="fixed inset-0 z-[160] bg-white lg:hidden flex flex-col"
          >
            {/* Mobile Header (Inside Overlay) */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-gray-50 bg-white sticky top-0">
                <Logo />
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-11 h-11 flex items-center justify-center bg-gray-50 rounded-xl text-gray-900"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-10 flex flex-col">
                <motion.div 
                  initial="closed"
                  animate="open"
                  variants={{
                    open: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
                    closed: { transition: { staggerChildren: 0.05, staggerDirection: -1 } }
                  }}
                  className="flex flex-col gap-8"
                >
                  {!isAuthenticated ? (
                    <>
                      <div className="flex flex-col gap-6">
                        {['About', /* 'Pricing', */ 'Support', /* 'Demo', */ 'Guided Tour']
                          .map((item) => (
                          <motion.div
                            key={item}
                            variants={{
                              open: { opacity: 1, x: 0 },
                              closed: { opacity: 0, x: 20 }
                            }}
                          >
                            <Link 
                              to={`/${item.toLowerCase().replace(' ', '-').replace('&-', '')}`} 
                              className="text-3xl font-black text-gray-900 uppercase tracking-tighter hover:text-[#a26da8] transition-colors"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              {item === 'Support' ? 'Help & Support' : item}
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                      
                      <motion.div 
                        variants={{
                          open: { opacity: 1, y: 0 },
                          closed: { opacity: 0, y: 20 }
                        }}
                        className="mt-12 space-y-4"
                      >
                        <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block text-center text-lg font-bold text-gray-500 hover:text-[#a26da8] py-4">LOG IN</Link>
                        <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="block bg-gray-900 text-white py-6 rounded-[28px] text-center font-black uppercase tracking-widest shadow-xl shadow-gray-100 hover:bg-black transition-all">
                          Get Started
                        </Link>
                      </motion.div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col gap-8">
                        <motion.div variants={{ open: { opacity: 1, x: 0 }, closed: { opacity: 0, x: 20 } }}>
                          <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="text-3xl font-black text-gray-900 uppercase tracking-tighter hover:text-[#a26da8] transition-colors">Dashboard</Link>
                        </motion.div>

                        <motion.div variants={{ open: { opacity: 1, x: 0 }, closed: { opacity: 0, x: 20 } }} className="space-y-6">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Strategic Discovery</p>
                          <div className="grid grid-cols-1 gap-3">
                            <Link to="/discovery/company" onClick={() => setIsMobileMenuOpen(false)} className="group bg-purple-50/50 p-5 rounded-[24px] border border-purple-100/50 flex items-center justify-between transition-all hover:bg-purple-50">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm text-base">🏢</div>
                                <span className="font-black text-gray-900 text-xs uppercase tracking-tight">Company Analysis</span>
                              </div>
                              <svg className="w-4 h-4 text-[#a26da8] transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </Link>
                            <Link to="/discovery/domain" onClick={() => setIsMobileMenuOpen(false)} className="group bg-teal-50/50 p-4 rounded-[24px] border border-teal-100/50 flex items-center justify-between transition-all hover:bg-teal-50">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm text-base">🌐</div>
                                <span className="font-black text-gray-900 text-xs uppercase tracking-tight">Industry Domain</span>
                              </div>
                              <svg className="w-4 h-4 text-[#4db6ac] transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </Link>
                          </div>
                        </motion.div>

                        <motion.div variants={{ open: { opacity: 1, x: 0 }, closed: { opacity: 0, x: 20 } }}>
                          <Link to="/evaluations" onClick={() => setIsMobileMenuOpen(false)} className="text-3xl font-black text-gray-900 uppercase tracking-tighter hover:text-[#a26da8] transition-colors">Evaluations</Link>
                        </motion.div>

                        <motion.div variants={{ open: { opacity: 1, x: 0 }, closed: { opacity: 0, x: 20 } }}>
                          <Link to="/support" onClick={() => setIsMobileMenuOpen(false)} className="text-3xl font-black text-gray-900 uppercase tracking-tighter hover:text-[#a26da8] transition-colors">Support</Link>
                        </motion.div>

                        {/* <motion.div variants={{ open: { opacity: 1, x: 0 }, closed: { opacity: 0, x: 20 } }}>
                          <Link to="/demo" onClick={() => setIsMobileMenuOpen(false)} className="text-3xl font-black text-gray-900 uppercase tracking-tighter hover:text-[#a26da8] transition-colors">Demo</Link>
                        </motion.div> */}

                        {userRole === 'TENANT_ADMIN' && (
                          <motion.div variants={{ open: { opacity: 1, x: 0 }, closed: { opacity: 0, x: 20 } }}>
                            <Link to="/admin/system" onClick={() => setIsMobileMenuOpen(false)} className="text-3xl font-black text-gray-900 uppercase tracking-tighter hover:text-[#a26da8] transition-colors">System Admin</Link>
                          </motion.div>
                        )}
                        {userRole === 'SUPER_ADMIN_ROLE' && (
                          <motion.div variants={{ open: { opacity: 1, x: 0 }, closed: { opacity: 0, x: 20 } }}>
                            <Link to="/admin/org" onClick={() => setIsMobileMenuOpen(false)} className="text-3xl font-black text-gray-900 uppercase tracking-tighter hover:text-[#a26da8] transition-colors">Org Admin</Link>
                          </motion.div>
                        )}
                        {(userRole === 'ADMIN_ROLE' || userRole === 'SUPER_ADMIN_ROLE') && (
                          <motion.div variants={{ open: { opacity: 1, x: 0 }, closed: { opacity: 0, x: 20 } }}>
                            <Link to="/admin/dept" onClick={() => setIsMobileMenuOpen(false)} className="text-3xl font-black text-gray-900 uppercase tracking-tighter hover:text-[#a26da8] transition-colors">Dept Admin</Link>
                          </motion.div>
                        )}
                      </div>

                      <motion.div 
                        variants={{ open: { opacity: 1, y: 0 }, closed: { opacity: 0, y: 20 } }}
                        className="mt-auto pt-10 border-t border-gray-50"
                      >
                        <button 
                          onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                          className="w-full flex items-center justify-center gap-4 bg-red-50 text-red-500 py-5 rounded-[24px] font-black uppercase tracking-widest text-sm hover:bg-red-100 transition-all"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                          Sign Out
                        </button>
                      </motion.div>
                    </>
                  )}
                </motion.div>
              </div>

              {/* Decorative background element */}
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-br from-[#a26da8]/5 to-[#6fcbbd]/5 rounded-full -mr-32 -mb-32 blur-3xl pointer-events-none" />
            </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navigation;
