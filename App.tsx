
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import Dashboard from './pages/Dashboard';
import Evaluations from './pages/Evaluations';
import EvaluateProcess from './pages/EvaluateProcess';
import Results from './pages/Results';
import Compare from './pages/Compare';
import Quadrant from './pages/Quadrant';
import About from './pages/About';
import Support from './pages/Support';
// import Demo from './pages/Demo';
import GuidedTour from './pages/GuidedTour';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import CEO from './pages/CEO';
import Pricing from './pages/Pricing';
import CompanyDiscovery from './pages/Discovery/CompanyDiscovery';
import DomainDiscovery from './pages/Discovery/DomainDiscovery';
import DiscoveryDetail from './pages/Discovery/DiscoveryDetail';
import AdminPanel from './pages/Admin/AdminPanel';
import Navigation from './components/Navigation';

import { CortexProvider } from './context/CortexContext';
import CortexChatModal from './components/Cortex/CortexChatModal';
import GlobalCortexSearch from './components/Cortex/GlobalCortexSearch';
import AskPdfModal from './components/Cortex/AskPdfModal';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!sessionStorage.getItem('token'));

  return (
    <CortexProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navigation isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <About />} />
              <Route path="/support" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Support />} />
{/* <Route path="/demo" element={<Demo />} /> */}
              <Route path="/guided-tour" element={<GuidedTour />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              // <Route path="/ceo" element={<CEO />} />
              <Route path="/pricing" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Pricing />} />
              <Route path="/contact" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Support />} />
              <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Authenticated Routes */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/evaluations" element={<Evaluations />} />
              <Route path="/evaluate" element={<EvaluateProcess />} />
              <Route path="/results/:id" element={<Results />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/quadrant" element={<Quadrant />} />
              
              {/* New Discovery Routes */}
              <Route path="/discovery/company" element={<CompanyDiscovery />} />
              <Route path="/discovery/domain" element={<DomainDiscovery />} />
              <Route path="/discovery/detail/:id" element={<DiscoveryDetail />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminPanel />} />
            </Routes>
          </main>
          
          <footer className="bg-white border-t border-gray-100 py-10">
            <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center">
                <div className="flex items-start">
                  <img
                    src="/Avagama.AI_Logo.jpg"
                    alt="Avagama AI"
                    className="h-6 object-contain"
                  />
                  <span className="text-[8px] text-gray-400 relative -top-1 ml-[2px]">
                    TM
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-400 font-medium">© 2026 Avagama.ai Powered by Avaali. All Rights Reserved.</p>
              <div className="flex gap-8">
                <Link to="/privacy" className="text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">Terms of Service</Link>
              </div>
            </div>
          </footer>
        </div>
        {isAuthenticated && (
          <>
            <CortexChatModal />
            <GlobalCortexSearch />
            <AskPdfModal />
          </>
        )}
      </Router>
    </CortexProvider>
  );
};

export default App;
