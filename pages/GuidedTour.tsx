import React from 'react';

const GuidedTour: React.FC = () => {
  const tours = [
    {
      id: 'evaluations',
      title: 'Process Evaluations',
      description: 'Learn how to evaluate and score your business processes for AI automation readiness across 10 critical dimensions.',
      embedUrl: 'https://app.supademo.com/embed/cmm3152rf0604q1brznevbt8r?embed_v=2&utm_source=embed',
      titleAttr: 'Sign in and start an AI evaluation',
      badge: 'Core Feature',
      color: 'purple'
    },
    {
      id: 'company-discovery',
      title: 'Discover By Company',
      description: 'Explore how to uncover high-value AI opportunities specific to your organization\'s unique structure and strategic goals.',
      embedUrl: 'https://app.supademo.com/embed/cmm31o7qy06o2q1brab28gxbi?embed_v=2&utm_source=embed',
      titleAttr: 'Log in and explore AI Discovery opportunities',
      badge: 'Strategic',
      color: 'teal'
    },
    {
      id: 'domain-discovery',
      title: 'Domain Specific Discovery',
      description: 'Navigate industry-specific AI use cases and generate tailored strategic roadmaps for your specific domain.',
      embedUrl: 'https://app.supademo.com/embed/cmm31zp1h0765q1br97x69w0d?embed_v=2&utm_source=embed',
      titleAttr: 'Log in to view domain-specific ai roadmap details',
      badge: 'Industry Focus',
      color: 'blue'
    }
  ];

  return (
    <div className="bg-[#fcfdff] min-h-screen pb-32">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100 py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-[#4db6ac]/10 text-[#4db6ac] px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.3em] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4db6ac] animate-pulse"></span>
            Interactive Experience
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter leading-tight">
            Guided <span className="text-[#9d7bb0]">Platform Tours</span>
          </h1>
          <p className="text-gray-500 font-medium max-w-2xl mx-auto text-sm md:text-lg leading-relaxed">
            Step into the driver's seat. Explore our interactive walkthroughs to see exactly how Avagama AI accelerates enterprise transformation.
          </p>
        </div>
      </div>

      {/* Tours Container */}
      <div className="max-w-6xl mx-auto px-6 mt-16 md:mt-24 space-y-24 md:space-y-32">
        {tours.map((tour, index) => (
          <div key={tour.id} className="space-y-8 md:space-y-12">
            {/* Tour Header */}
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                tour.color === 'purple' ? 'bg-purple-50 text-[#9d7bb0]' :
                tour.color === 'teal' ? 'bg-teal-50 text-[#4db6ac]' :
                'bg-blue-50 text-blue-500'
              }`}>
                {tour.badge}
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
                {tour.title}
              </h2>
              <p className="text-sm md:text-base text-gray-500 font-medium leading-relaxed">
                {tour.description}
              </p>
            </div>

            {/* Supademo Embed Container */}
            <div className="bg-white p-4 md:p-8 rounded-[32px] md:rounded-[48px] border border-gray-100 shadow-2xl shadow-gray-200/50">
              <div className="rounded-[24px] md:rounded-[32px] overflow-hidden bg-gray-50 relative border border-gray-100">
                <div 
                  style={{ 
                    position: 'relative', 
                    boxSizing: 'content-box', 
                    maxHeight: '80vh', 
                    width: '100%', 
                    aspectRatio: '2.32', 
                    padding: '40px 0 40px 0' 
                  }}
                >
                  <iframe 
                    src={tour.embedUrl}
                    loading="lazy" 
                    title={tour.titleAttr}
                    allow="clipboard-write" 
                    frameBorder="0" 
                    allowFullScreen 
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GuidedTour;
