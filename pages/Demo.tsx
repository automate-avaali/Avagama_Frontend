import React, { useEffect } from 'react';

const Demo: React.FC = () => {
  useEffect(() => {
    // Dynamically load the ScreenPal player script
    const script = document.createElement('script');
    script.src = "https://go.screenpal.com/player/appearance/cOnTqNn0Lim";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup script when component unmounts
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="bg-[#fcfdff] min-h-screen pb-24">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100 py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-[#9d7bb0]/10 text-[#9d7bb0] px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.3em] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9d7bb0] animate-pulse"></span>
            Platform Walkthrough
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter leading-tight">
            See Avagama AI <br className="hidden md:block" />
            <span className="text-[#4db6ac]">In Action</span>
          </h1>
          <p className="text-gray-500 font-medium max-w-2xl mx-auto text-sm md:text-lg leading-relaxed">
            Discover how our enterprise-grade platform transforms unstructured processes into actionable, high-ROI automation roadmaps in minutes.
          </p>
        </div>
      </div>

      {/* Video Section */}
      <div className="max-w-5xl mx-auto px-6 mt-12 md:mt-16">
        <div className="bg-white p-4 md:p-8 rounded-[32px] md:rounded-[48px] border border-gray-100 shadow-2xl shadow-gray-200/50">
          <div className="rounded-[24px] md:rounded-[32px] overflow-hidden bg-gray-900 relative border border-gray-100">
            {/* ScreenPal Embed */}
            <div 
              className="sp-embed-player" 
              data-id="cOnTqNn0Lim" 
              data-aspect-ratio="1.777778" 
              data-padding-top="56.250000%" 
              style={{ position: 'relative', width: '100%', paddingTop: '56.250000%', height: 0 }}
            >
              <iframe 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }} 
                scrolling="no" 
                src="https://go.screenpal.com/player/cOnTqNn0Lim?ff=1&ahc=1&dcc=1&tl=1&bg=transparent&share=1&download=1&embed=1&cl=1" 
                allowFullScreen={true}
                title="Avagama AI Platform Demo"
              ></iframe>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-5xl mx-auto px-6 mt-20 md:mt-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4 hover:-translate-y-1 transition-transform duration-300">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#9d7bb0] flex items-center justify-center text-2xl shadow-sm">
              🔍
            </div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">AI Discovery</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Instantly identify high-value automation opportunities across your company or specific industry domains.
            </p>
          </div>
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4 hover:-translate-y-1 transition-transform duration-300">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#4db6ac] flex items-center justify-center text-2xl shadow-sm">
              ⚙️
            </div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Deep Evaluation</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Analyze processes across 10 critical dimensions to determine exact automation readiness and complexity.
            </p>
          </div>
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4 hover:-translate-y-1 transition-transform duration-300">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center text-2xl shadow-sm">
              📊
            </div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Strategic Quadrant</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Generate comprehensive, board-ready reports and actionable roadmaps to guide your transformation journey.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Demo;
