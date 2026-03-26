
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const Support: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is Avagama AI?",
      answer: "Avagama AI is a strategic enterprise platform designed to help organizations discover, evaluate, and implement AI use cases. We use advanced LLMs and agentic reasoning to map your business processes to the most impactful AI solutions."
    },
    {
      question: "How does the AI Discovery process work?",
      answer: "You can discover AI opportunities in two ways: Company Discovery (analyzing a specific organization's public data and strategic goals) or Domain Discovery (exploring industry-specific functional areas). Our AI agents crawl relevant data to suggest high-ROI use cases tailored to your context."
    },
    {
      question: "How do I interpret the 2x2 Strategic Quadrant?",
      answer: "The Strategic Quadrant plots your evaluated use cases on a Gartner-style 2x2 matrix. Quick Wins (Top Left) are high value and high feasibility. Strategic Bets (Top Right) are high value but require more investment. Tactical Gains (Bottom Left) build momentum with lower effort, while Low Priority (Bottom Right) items should be deferred."
    },
    {
      question: "What is the 'Avagama Enterprise LLM'?",
      answer: "The Avagama Enterprise LLM is our specialized engine optimized for business process analysis. It balances reasoning depth with operational speed to provide precise diagnostic scores and implementation roadmaps for your enterprise use cases."
    },
    {
      question: "How do I use the 'Ask Avagama' feature?",
      answer: "Ask Avagama is your interactive AI strategist. You can find the 'Ask Avagama' button on any evaluation result or discovery report. Use it to ask deep-dive questions about implementation steps, risk mitigation, or to brainstorm alternative scenarios based on the generated analysis."
    },
    {
      question: "What is the difference between ChatGPT and Avagama?",
      answer: "While ChatGPT is a general-purpose conversational AI, Avagama is a specialized enterprise-grade strategic engine. Avagama doesn't just chat; it performs multi-dimensional process evaluations, maps strategic feasibility, and generates actionable implementation roadmaps. It is context-aware of enterprise constraints, ROI metrics, and specific industry domains, providing structured strategic output rather than just text responses."
    },
    {
      question: "Can I evaluate my own custom business processes?",
      answer: "Yes! Use the 'New Evaluation' feature to describe any business process. Our AI will analyze it across 10 critical dimensions—including volume, complexity, and risk—to provide a detailed automation and feasibility score."
    },
    {
      question: "What kind of recommendations does the platform provide?",
      answer: "For every use case, we provide a functional execution roadmap, recommended LLM configurations, fitment types (e.g., Agentic AI, RPA), and a detailed reasoning matrix explaining the benefit scores across multiple business axes."
    },
    {
      question: "How can I export my strategic analysis?",
      answer: "You can export any strategic analysis or evaluation report by using the 'Print PDF' feature available on the Strategic Quadrant page. This generates a clean, board-ready document optimized for stakeholder presentations."
    },
    {
      question: "Is my data secure?",
      answer: "Security is our top priority. We use enterprise-grade encryption and do not use your proprietary evaluation data to train our base models. For more details, please refer to our Privacy Policy."
    }
  ];

  const features = [
    {
      title: "AI Discovery",
      icon: "🔭",
      desc: "Uncover high-impact AI opportunities through deep company and domain analysis."
    },
    {
      title: "Process Evaluation",
      icon: "📊",
      desc: "Quantify the ROI of automating specific business processes with precision scoring."
    },
    {
      title: "Strategic Quadrant",
      icon: "💎",
      desc: "Visualize your AI roadmap to prioritize implementation based on value and effort."
    },
    {
      title: "Avagama Chat",
      icon: "🧠",
      desc: "Interact with our specialized AI agent to dive deeper into any use case or roadmap."
    }
  ];

  return (
    <div className="bg-[#fcfdff] min-h-screen pb-24">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-100 py-20 md:py-32 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="max-w-3xl space-y-6">
            <h4 className="text-[10px] font-black text-[#9d7bb0] uppercase tracking-[0.4em]">Support Center</h4>
            <h1 className="text-4xl md:text-7xl font-black text-gray-900 tracking-tighter leading-[0.9]">
              How can we help you <span className="text-gray-200">scale?</span>
            </h1>
            <p className="text-lg text-gray-500 font-medium leading-relaxed max-w-xl">
              Everything you need to know about the Avagama AI platform. From discovery to implementation roadmaps.
            </p>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-purple-50/50 to-transparent pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#9d7bb0]/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-8 -mt-12 relative z-20">
        {/* Feature Guide Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl shadow-purple-100/20 space-y-4 hover:translate-y-[-4px] transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl shadow-sm">
                {f.icon}
              </div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">{f.title}</h3>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-24 grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* FAQ Section */}
          <div className="lg:col-span-7 space-y-10">
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">Frequently Asked Questions</h2>
              <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Quick answers to common inquiries</p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-white rounded-3xl border border-gray-100 overflow-hidden transition-all">
                  <button 
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-black text-gray-800 uppercase tracking-tight">{faq.question}</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border border-gray-100 transition-transform duration-300 ${activeFaq === i ? 'rotate-180 bg-[#9d7bb0] text-white border-[#9d7bb0]' : 'text-gray-400'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </button>
                  <AnimatePresence>
                    {activeFaq === i && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <div className="px-8 pb-8 text-sm text-gray-500 font-medium leading-relaxed border-t border-gray-50 pt-4">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Support Card */}
          <div className="lg:col-span-5">
            <div className="sticky top-32 bg-gray-900 rounded-[48px] p-10 md:p-14 text-white space-y-8 overflow-hidden relative">
              <div className="relative z-10 space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl">
                  ✉️
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-tight">Still need help?</h3>
                  <p className="text-white/60 text-sm font-medium leading-relaxed">
                    Our technical support team is available to assist with enterprise integrations and custom roadmap queries.
                  </p>
                </div>
                
                <div className="pt-4 space-y-4">
                  <a href="mailto:support@avagama.ai" className="block w-full bg-white text-gray-900 py-4 rounded-2xl text-center font-black uppercase text-xs tracking-widest hover:bg-gray-100 transition-all shadow-xl shadow-black/20">
                    Email Support
                  </a>
                  <p className="text-center text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
                    Typical response time: &lt; 4 hours
                  </p>
                </div>
              </div>

              {/* Decorative background circle */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#9d7bb0]/20 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
