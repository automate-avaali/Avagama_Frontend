import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, Lock, Zap } from 'lucide-react';
import { AGENT_SOLUTIONS, AgentSolution } from './agentSolutionsData';

const SolutionCard: React.FC<{ solution: AgentSolution; index: number }> = ({ solution, index }) => {
  const navigate = useNavigate();
  const isLive = solution.status === 'live';

  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      onClick={() => isLive && navigate(`/agent-solutions/${solution.id}`)}
      disabled={!isLive}
      className={`group relative text-left bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm flex flex-col h-full transition-all duration-500 ${
        isLive
          ? 'hover:shadow-2xl hover:shadow-purple-100/50 hover:border-purple-200 cursor-pointer'
          : 'opacity-70 cursor-not-allowed'
      }`}
    >
      {/* status pill */}
      <div className="flex justify-between items-start mb-6">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform duration-500"
          style={{ background: `linear-gradient(135deg, ${solution.accentFrom}1a, ${solution.accentTo}1a)` }}
        >
          {solution.emoji}
        </div>
        {isLive ? (
          <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-green-50 text-green-600 flex items-center gap-1">
            <Zap size={10} /> Live
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-gray-100 text-gray-400 flex items-center gap-1">
            <Lock size={10} /> Coming Soon
          </span>
        )}
      </div>

      <span className="text-[9px] font-black text-[#a26da8] uppercase tracking-[0.2em] mb-2">{solution.category}</span>
      <h3 className={`text-xl font-black text-gray-900 mb-2 transition-colors ${isLive ? 'group-hover:text-[#a26da8]' : ''}`}>
        {solution.name}
      </h3>
      <p className="text-sm font-medium text-gray-500 leading-relaxed line-clamp-3">{solution.description}</p>

      <div className="mt-auto pt-6 flex items-center justify-between border-t border-gray-50 mt-6">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          {isLive ? 'Interactive tutorial' : 'In development'}
        </span>
        {isLive && (
          <span className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 text-[#a26da8] rounded-2xl text-[10px] font-black uppercase tracking-widest group-hover:bg-[#a26da8] group-hover:text-white transition-all">
            Start <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        )}
      </div>
    </motion.button>
  );
};

const AgentSolutions: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#fafafa]">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-100 shadow-sm mb-6">
            <Sparkles size={14} className="text-[#a26da8]" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Agent Solutions</span>
          </div>
          <h1 className="text-[38px] md:text-[46px] font-black text-gray-900 tracking-tight leading-[1.05] max-w-3xl">
            Production-grade AI agents you can{' '}
            <span className="bg-gradient-to-r from-[#a26da8] to-[#6fcbbd] bg-clip-text text-transparent">try in minutes</span>.
          </h1>
          <p className="text-gray-500 font-medium mt-4 max-w-2xl text-[15px] leading-relaxed">
            Each solution ships with a guided, interactive tutorial and ready-made sample data — so you can experience
            exactly what the agent does before you deploy it into your own workflows.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {AGENT_SOLUTIONS.map((solution, i) => (
            <SolutionCard key={solution.id} solution={solution} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgentSolutions;
