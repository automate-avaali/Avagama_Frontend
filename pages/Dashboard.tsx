
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { apiService } from '../services/api';
import { useCortex } from '../context/CortexContext';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { credits, refreshCredits } = useCortex();

  useEffect(() => {
    // Get user info from storage
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user data");
      }
    }

    const fetchDashboardData = async () => {
      try {
        const res = await apiService.evaluations.getDashboard();
        if (res.success) {
          setStats(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
    refreshCredits();
  }, []);

  const formatDisplayName = (userData: any) => {
    if (!userData) return 'Leader';
    const rawName = [userData.firstName, userData.lastName].filter(Boolean).join('.') || 'Leader';
    return rawName.split(/\./).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('.');
  };

  const displayName = formatDisplayName(user);

  if (loading) {
    return (
      <div className="p-8 space-y-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 border-4 border-purple-50 border-t-[#9d7bb0] rounded-full animate-spin mx-auto"></div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Synchronizing Intelligence...</p>
        </div>
      </div>
    );
  }

  const dashboardData = stats || {
    totalCompleted: 0,
    avgAutomationScore: 0,
    domainUseCases: 0,
    companyUseCases: 0,
    totalUseCasesFound: 0,
    totalIdentifiedAssets: 0,
    trends: [
      { name: 'Jan', completed: 12, companyDiscovery: 5, domainDiscovery: 8 },
      { name: 'Feb', completed: 19, companyDiscovery: 8, domainDiscovery: 12 },
      { name: 'Mar', completed: 15, companyDiscovery: 12, domainDiscovery: 9 },
      { name: 'Apr', completed: 22, companyDiscovery: 15, domainDiscovery: 14 }
    ],
    technologyDistribution: [
      { name: 'Agentic AI', value: 45 },
      { name: 'RPA', value: 25 },
      { name: 'Augment AI', value: 20 },
      { name: 'Transformation', value: 10 }
    ]
  };

  const chartData = dashboardData.companyTrends || dashboardData.domainTrends 
    ? dashboardData.trends.map((t: any) => ({
        ...t,
        companyDiscovery: dashboardData.companyTrends?.find((ct: any) => ct.name === t.name)?.completed || 0,
        domainDiscovery: dashboardData.domainTrends?.find((dt: any) => dt.name === t.name)?.completed || 0
      }))
    : dashboardData.trends;

  const discoverySourceData = [
    { name: 'By Company', value: dashboardData.companyUseCases || 1, color: '#9d7bb0' },
    { name: 'By Domain', value: dashboardData.domainUseCases || 1, color: '#4db6ac' }
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 bg-[#fcfdff] min-h-screen">
      {/* Top Navigation / Breadcrumb */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Intelligence Dashboard</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className={`px-4 py-2 rounded-xl border shadow-sm flex items-center gap-3 transition-all ${credits <= 5 ? 'bg-red-50 border-red-100 animate-pulse' : 'bg-white border-gray-100'}`}>
            <span className={`w-2 h-2 rounded-full ${credits <= 5 ? 'bg-red-500' : 'bg-[#9d7bb0]'}`}></span>
            <span className={`text-xs font-black uppercase tracking-wider ${credits <= 5 ? 'text-red-600' : 'text-gray-600'}`}>
              AI Credits: {credits}
            </span>
            {credits <= 5 && <span className="text-[8px] font-black text-red-400 uppercase">(Low)</span>}
          </div>
          <div className="px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
             <span className="text-xs font-black text-gray-600 uppercase tracking-wider">Live Metrics</span>
          </div>
        </div>
      </div>

      {/* Hero Welcome */}
      <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-100 p-6 md:p-12 rounded-[32px] md:rounded-[48px] shadow-sm relative overflow-hidden">
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-4xl font-black text-gray-900 leading-tight">
                Hi <span className="text-[#9d7bb0]">{displayName}</span>, <br className="hidden md:block" />
                Welcome to Avagama
              </h2>
              <p className="text-gray-500 font-medium max-w-2xl text-sm md:text-lg leading-relaxed">
                Discover automation opportunities, evaluate business processes, and unlock AI-powered automation for your enterprise.
              </p>
            </div>
            <div className="pt-2">
              <p className="text-gray-600 font-bold text-sm md:text-base flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#4db6ac]"></span>
                Our Automation Discovery engine has successfully mapped <span className="text-[#9d7bb0] px-2 py-0.5 bg-purple-50 rounded-lg">{dashboardData.totalIdentifiedAssets || 0}</span> strategic AI assets across your functional domains and organizational structures.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/evaluate" className="bg-[#9d7bb0] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-100 hover:scale-105 transition-all text-center">
              Start New Evaluation
            </Link>
            <Link to="/discovery/company" className="bg-white text-gray-900 border border-gray-100 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-gray-50 transition-all text-center">
              Discover Use Cases
            </Link>
          </div>
        </div>
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-[60%] md:w-[40%] h-full flex items-center justify-center opacity-10 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="0.5" strokeDasharray="5 5" />
            <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="1" />
            <path d="M50 10V90M10 50H90" stroke="currentColor" strokeWidth="0.2" />
          </svg>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        {[
          { label: 'Processes Evaluated', value: dashboardData.totalCompleted, icon: '📊', color: 'bg-blue-50 text-blue-600' },
          { label: 'Avg. Automation Readiness', value: `${dashboardData.avgAutomationScore}%`, icon: '⚙️', color: 'bg-purple-50 text-purple-600' },
          { label: 'Discovery: By Domain', value: dashboardData.domainUseCases, icon: '🌐', color: 'bg-teal-50 text-[#4db6ac]' },
          { label: 'Discovery: By Company', value: dashboardData.companyUseCases, icon: '🏢', color: 'bg-orange-50 text-orange-600' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className={`w-10 h-10 md:w-12 md:h-12 ${stat.color} rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-xl mb-4 md:mb-6 shadow-sm`}>
              {stat.icon}
            </div>
            <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="text-3xl md:text-4xl font-black text-gray-900">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Analytics Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        
        {/* Growth & Discovery Trends */}
        <div className="lg:col-span-8 bg-white p-6 md:p-10 rounded-[32px] md:rounded-[48px] border border-gray-100 shadow-sm space-y-8 md:space-y-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-50 pb-6 gap-4">
            <div className="space-y-1">
               <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Enterprise Roadmap Growth</h3>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tracking Multi-Stream Progress</p>
            </div>
            <div className="flex flex-wrap gap-3 md:gap-4">
               <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase">
                  <span className="w-2 h-2 rounded-full bg-[#9d7bb0]"></span> Process Evaluations
               </div>
               <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase">
                  <span className="w-2 h-2 rounded-full bg-[#4db6ac]"></span> Use Case Discovery
               </div>
            </div>
          </div>
          
          <div className="h-[300px] md:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fontWeight: 900, fill: '#9ca3af'}} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fontWeight: 900, fill: '#9ca3af'}} 
                />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold'}}
                />
                <Line 
                  name="Evaluations" 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#9d7bb0" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#9d7bb0', strokeWidth: 0 }} 
                  activeDot={{ r: 6, strokeWidth: 0 }} 
                />
                <Line 
                  name="Domain Discovery" 
                  type="monotone" 
                  dataKey="domainDiscovery" 
                  stroke="#4db6ac" 
                  strokeWidth={2} 
                  strokeDasharray="5 5" 
                  dot={{ r: 3, fill: '#4db6ac', strokeWidth: 0 }} 
                />
                <Line 
                  name="Company Discovery" 
                  type="monotone" 
                  dataKey="companyDiscovery" 
                  stroke="#f43f5e" 
                  strokeWidth={2} 
                  strokeDasharray="5 5" 
                  dot={{ r: 3, fill: '#f43f5e', strokeWidth: 0 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Discovery Focus Pie */}
        <div className="lg:col-span-4 bg-gray-900 p-8 md:p-10 rounded-[32px] md:rounded-[48px] shadow-2xl space-y-6 md:space-y-8 flex flex-col justify-between overflow-hidden relative">
          <div className="relative z-10">
            <h3 className="text-lg md:text-xl font-black text-white tracking-tight">Strategic Discovery Split</h3>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Sourcing Methodology Distribution</p>
          </div>
          
          <div className="h-[200px] md:h-[250px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={discoverySourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {discoverySourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', backgroundColor: '#fff', fontSize: '10px'}}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3 md:space-y-4 relative z-10">
            {discoverySourceData.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-white/5 p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/10">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}}></span>
                  <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">{item.name}</span>
                </div>
                <span className="text-base md:text-lg font-black text-white">{item.value}</span>
              </div>
            ))}
          </div>
          
          {/* Subtle Glow Background */}
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none"></div>
        </div>

        {/* Technology Distribution */}
        <div className="lg:col-span-12 bg-white p-6 md:p-12 rounded-[32px] md:rounded-[56px] border border-gray-100 shadow-sm space-y-8 md:space-y-10">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <h3 className="text-xl md:text-2xl font-black text-gray-900">Current Technology Stack</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recommended fitment profile across all evaluations</p>
              </div>
              <div className="px-5 py-2 bg-gray-50 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest border border-gray-100">
                Total Weighted Matrix
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-center">
              <div className="h-[300px] md:h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.technologyDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fontWeight: 900, fill: '#4b5563'}} 
                      width={100} 
                    />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontSize: '10px'}} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                        {dashboardData.technologyDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#9d7bb0' : '#4db6ac'} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-6">
                  <div className="p-6 md:p-8 bg-purple-50/50 rounded-[32px] md:rounded-[40px] border border-purple-100/50 space-y-4">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">🚀</div>
                       <h4 className="text-xs md:text-sm font-black text-gray-900 uppercase tracking-wide">Strategic Recommendation</h4>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 leading-relaxed font-medium">
                      {dashboardData.strategicInsights?.recommendation || (
                        <>
                          Based on your current "Agentic AI" focus ({dashboardData.technologyDistribution.find((t: any) => t.name === 'Agentic AI')?.value || 0}%), 
                          the roadmap suggests prioritizing cross-functional discovery in <span className="text-[#9d7bb0] font-bold">Finance</span> and <span className="text-[#4db6ac] font-bold">Supply Chain</span> domains 
                          for maximum compute yield.
                        </>
                      )}
                    </p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100 flex flex-col gap-1">
                       <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Compute Efficiency</span>
                       <span className="text-lg md:text-xl font-black text-gray-900">{dashboardData.strategicInsights?.computeEfficiency || '98.4%'}</span>
                    </div>
                    <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100 flex flex-col gap-1">
                       <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Risk Mitigation</span>
                       <span className="text-lg md:text-xl font-black text-gray-900">{dashboardData.strategicInsights?.riskMitigation || 'Active'}</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
