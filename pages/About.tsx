
import React from 'react';
import { Link } from 'react-router-dom';

const About: React.FC = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-avagama-gradient py-24 px-6 border-b border-gray-100">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <h1 className="text-6xl font-black text-gray-900 leading-tight">
            The Future Of <span className="text-[#4db6ac]">Enterprise Automation</span> & Evaluation
          </h1>
          <p className="text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed">
            Unlock unmatched agentic intelligence to discover, evaluate, and scale high-impact automation workflows across your entire organization.
          </p>
        </div>
      </section>

      {/* The 10 Dimensions */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
            <h2 className="text-4xl font-bold">Evaluation across <span className="text-[#9d7bb0]">10 critical dimensions</span></h2>
            <p className="text-gray-600 text-lg">
              Most enterprises fail in automation because they ignore the underlying complexity. Avagama AI uses a Proprietary Framework to analyze your business workflows across these axes:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { name: 'Knowledge Intensity', desc: 'Subjective reasoning requirements' },
                { name: 'Decision Intensity', desc: 'Branching and decision logic depth' },
                { name: 'Data Structure', desc: 'Structured vs Unstructured inputs' },
                { name: 'Context Awareness', desc: 'Dependencies on external systems' },
                { name: 'Exception Handling', desc: 'Frequency of non-standard paths' },
                { name: 'Orchestration complexity', desc: 'Multi-system coordination' },
                { name: 'Process Volume', desc: 'Throughput requirements' },
                { name: 'Process Frequency', desc: 'Repetition intervals' },
                { name: 'Risk Tolerance', desc: 'Governance and control requirements' },
                { name: 'Compliance Sensitivity', desc: 'Regulatory and audit impact' }
              ].map((dim, i) => (
                <div key={i} className="flex gap-4 p-4 border border-gray-50 rounded-2xl bg-gray-50/30 group hover:bg-white hover:shadow-xl transition-all">
                  <div className="text-[#9d7bb0] font-black text-sm">{i + 1}.</div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm group-hover:text-[#9d7bb0]">{dim.name}</h4>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{dim.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-50 p-12 rounded-[60px] relative overflow-hidden">
             <div className="relative z-10 space-y-6">
                <div className="bg-white p-8 rounded-3xl shadow-xl space-y-4">
                   <div className="w-12 h-12 bg-teal-50 text-[#4db6ac] rounded-2xl flex items-center justify-center font-black">Agentic Dicovery</div>
                   <p className="text-gray-500 text-sm leading-relaxed">Our AI-powered agents don't just "calculate"; they reason through your process descriptions and SOPs to uncover hidden automation risks.</p>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-xl space-y-4 translate-x-12">
                   <div className="w-12 h-12 bg-purple-50 text-[#9d7bb0] rounded-2xl flex items-center justify-center font-black">Fit Scoring</div>
                  
                   <p className="text-gray-500 text-sm leading-relaxed">Quantify whether a process is better suited for RPA, Agentic AI, or Augmented AI based on the 10-dimension assessment.</p>
                </div>
             </div>
             <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-[#9d7bb0]/5 to-transparent"></div>
          </div>
        </div>
      </section>

      {/* End to End */}
      <section className="bg-gray-900 py-24 px-6 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-end mb-20 gap-8">
             <div className="space-y-4 max-w-2xl">
                <h2 className="text-5xl font-black">The End-to-End <br />Enterprise Journey</h2>
                <p className="text-gray-400 text-lg">From zero visibility to a prioritized automation roadmap in weeks, not months.</p>
             </div>
             <div className="flex gap-4">
                <div className="text-center p-6 bg-white/5 rounded-3xl border border-white/10 w-40">
                   <div className="text-3xl font-black mb-1 text-[#4db6ac]">10x</div>
                   <div className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Faster Evaluation</div>
                </div>
                <div className="text-center p-6 bg-white/5 rounded-3xl border border-white/10 w-40">
                   <div className="text-3xl font-black mb-1 text-[#9d7bb0]">100%</div>
                   <div className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Risk Mapping</div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
             {[
               { title: 'Ingest', desc: 'Upload SOPs and process metadata.' },
               { title: 'Discover', desc: 'AI Powered Agents map the workflow.' },
               { title: 'Score', desc: 'Dimensions are quantified and weighted.' },
               { title: 'Decide', desc: 'Strategy team receives prioritized roadmap.' }
             ].map((step, i) => (
               <div key={i} className="p-8 bg-white/5 rounded-[40px] border border-white/10 space-y-4 hover:bg-white/10 transition-all cursor-default">
                  <div className="text-4xl font-black text-white/10">{i + 1}</div>
                  <h4 className="text-xl font-bold">{step.title}</h4>
                  <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-32 px-6 text-center">
         <div className="max-w-2xl mx-auto space-y-10">
            <h2 className="text-4xl font-bold">Ready to discover your <span className="text-[#9d7bb0]">Agentic Roadmap?</span></h2>
            <div className="flex justify-center gap-6">
               <Link to="/login" className="bg-[#9d7bb0] text-white px-10 py-5 rounded-2xl font-black shadow-2xl shadow-purple-200 hover:scale-105 transition-all inline-block">Get Started Now</Link>
               <Link to="/pricing" className="border-2 border-gray-100 px-10 py-5 rounded-2xl font-black hover:bg-gray-50 transition-all inline-block">View Pricing</Link>
            </div>
         </div>
      </section>
    </div>
  );
};

export default About;
