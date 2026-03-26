
import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="bg-avagama-gradient min-h-screen">
      <section className="max-w-7xl mx-auto px-6 pt-12 md:pt-20 pb-20 md:pb-32 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 md:space-y-8 text-center lg:text-left">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-[1.1] text-gray-900 tracking-tighter">
            <span className="text-[#a26da8]">Avagama</span><span className="bg-gradient-to-r from-[#a26da8] via-[#a26da8] to-[#6fcbbd] bg-clip-text text-transparent ml-[2px]">.AI</span><br />
            <span className="text-gray-400">Agentic</span> Process<br />
            Evaluation.
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
            Helping enterprises evaluate and prioritize business processes using AI-driven insights, risk analysis, and intelligent decision making.
          </p>
          <div className="space-y-4 md:space-y-5 pt-4 flex flex-col items-center lg:items-start">
            <div className="flex items-center gap-4">
              <div className="bg-[#a26da8] p-2 rounded-xl text-white shadow-lg shadow-purple-100 shrink-0">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"></path></svg>
              </div>
              <span className="text-gray-700 font-bold text-xs md:text-sm text-left">AI-Powered process evaluation</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-[#a26da8] p-2 rounded-xl text-white shadow-lg shadow-purple-100 shrink-0">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path></svg>
              </div>
              <span className="text-gray-700 font-bold text-xs md:text-sm text-left">Automation & augmentation readiness scoring</span>
            </div>
          </div>
          <div className="pt-6 md:pt-8">
            <Link to="/register" className="bg-[#a26da8] text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl text-base md:text-lg font-black hover:bg-[#8b5a93] shadow-2xl shadow-purple-200 transition-all inline-block hover:-translate-y-1 uppercase tracking-widest text-xs md:text-sm">
              Build your roadmap
            </Link>
          </div>
        </div>
        
        <div className="relative mt-12 lg:mt-0">
          <div className="bg-white p-10 rounded-[60px] shadow-2xl border border-white relative z-10">
            <img src="https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop" alt="Agentic AI Visualization" className="rounded-[40px] shadow-sm w-full h-auto object-cover aspect-[5/4]" referrerPolicy="no-referrer" />
          </div>
          <div className="absolute -top-12 -right-12 w-80 h-80 bg-teal-100/40 rounded-full blur-3xl opacity-50 -z-0"></div>
          <div className="absolute -bottom-12 -left-12 w-80 h-80 bg-purple-100/40 rounded-full blur-3xl opacity-50 -z-0"></div>
        </div>
      </section>

      <section className="bg-white py-32 border-t border-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-4xl font-black text-gray-900">Architected for Intelligent Scale</h2>
            <p className="text-gray-500 font-medium">Unified platform standards for the future of enterprise automation.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {[
              { title: 'Agentic Discovery', desc: 'Identify high-potential agentic use cases by domain or company structure.', icon: '🔍' },
              { title: 'Process Evaluation', desc: 'Rigorous assessment across 10 critical operational dimensions.', icon: '📊' },
              { title: 'Fit & Scoring', desc: 'Quantified fit for RPA, Agentic AI, and Augmented AI workflows.', icon: '🎯' },
              { title: 'Evaluation Dashboard', desc: 'Real-time visibility for strategic roadmap and decision-making.', icon: '🖥️' }
            ].map((item, idx) => (
              <div key={idx} className="p-8 border border-gray-50 rounded-[40px] hover:shadow-2xl hover:border-transparent transition-all group bg-gray-50/30 hover:bg-white">
                <div className="text-4xl mb-6 transition-transform group-hover:scale-110 duration-500">{item.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
