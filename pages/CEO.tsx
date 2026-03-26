
import React from 'react';

const CEO: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div className="relative group">
          <div className="bg-[#9d7bb0] w-full aspect-[4/5] rounded-[60px] overflow-hidden shadow-2xl relative">
            <img 
              src="https://media.licdn.com/dms/image/v2/C5103AQH_pP-U9_U0Xw/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1516246325510?e=1746057600&v=beta&t=O0xXW3j-Qf4p_j8fO8e9Z-kX_h3yW5X6X9X0X6X9X0X" 
              alt="Srividya Kannan" 
              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://picsum.photos/seed/srividya/800/1000";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-12">
               <p className="text-white text-lg font-medium italic">"Digital transformation is not just about technology; it's about the agility to evolve."</p>
            </div>
          </div>
          <div className="absolute -bottom-8 -left-8 bg-white p-8 rounded-3xl shadow-2xl border border-gray-50 max-w-xs">
            <h3 className="text-2xl font-bold text-gray-900">Srividya Kannan</h3>
            <p className="text-[#9d7bb0] font-bold tracking-wider uppercase text-xs mt-1">Founder & CEO, Avaali Solutions</p>
          </div>
        </div>

        <div className="space-y-10">
          <div className="space-y-4">
            <h4 className="text-[#4db6ac] font-black tracking-[0.2em] uppercase text-xs">The Visionary Behind Avagama AI</h4>
            <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
              Pioneering the Era of <span className="text-[#9d7bb0]">Agentic Intelligence</span>
            </h1>
          </div>

          <div className="prose prose-lg text-gray-600 space-y-6">
            <p className="leading-relaxed">
              Srividya Kannan is a distinguished leader in the global digital technology landscape, with over 24 years of profound experience. As the Founder and CEO of <strong>Avaali Solutions</strong>, she has successfully steered the company to become a premier partner for Fortune 1000 enterprises seeking complex digital transformation.
            </p>

            <p className="leading-relaxed">
              Prior to founding Avaali, Srividya held pivotal leadership roles at global giants like <strong>SAP, Wipro, and Oracle</strong>. Her expertise lies in crafting digital strategies that harmonize enterprise business processes with cutting-edge automation. She is widely recognized as a thought leader in Shared Services, Digital Supply Chain, and Enterprise Content Management.
            </p>

            <p className="leading-relaxed font-medium text-gray-900">
              With Avagama AI, Srividya is leading the charge into "Agentic Discovery," helping enterprises move beyond basic RPA into the world of autonomous, reasoning-capable AI agents that solve real business complexities.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-4">
            <div className="space-y-1">
              <span className="text-4xl font-black text-gray-900">24+</span>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Years of Expertise</p>
            </div>
            <div className="space-y-1">
              <span className="text-4xl font-black text-gray-900">Global</span>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Influence & Reach</p>
            </div>
          </div>

          <div className="flex gap-6 pt-6">
            <a href="https://in.linkedin.com/in/srividya-kannan-avaali" target="_blank" rel="noopener noreferrer" className="bg-[#0077b5] text-white px-8 py-4 rounded-2xl flex items-center gap-3 hover:shadow-lg hover:shadow-blue-200 transition-all font-bold">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              Connect with Srividya
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CEO;
