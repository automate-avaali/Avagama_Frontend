
import React, { useState } from 'react';
import { PricingPlan } from '../types';

const CONVERSION_RATE = 93;

const plans = [
  {
    name: 'STARTER PACK',
    subtitle: 'Discovery Pilot',
    price: {
      INR: { original: 750000, discounted: 729999 },
      USD: { original: 9499, discounted: 8999 }
    },
    duration: '/ 3m',
    validity: '3 Months Validity',
    runs: '75 Evaluation Runs',
    users: '2 Enterprise Licenses',
    features: [
      'Evaluation over 10 dimensions',
      'Agentic AI Fit & Scoring',
      'Domain Use Case Discovery',
      'Strategic Decisioning Dashboard',
      'Excel Export: Priority Roadmap'
    ],
    footerNote: 'IDEAL FOR PILOT TEAMS'
  },
  {
    name: 'GROWTH PACK',
    subtitle: 'Strategic Expansion',
    price: {
      INR: { original: 1350000, discounted: 1249999 },
      USD: { original: 15999, discounted: 14999 }
    },
    duration: '/ 6m',
    validity: '6 Months Validity',
    runs: '150 Evaluation Runs',
    users: '5 Enterprise Licenses',
    features: [
      'Everything in Starter',
      'Higher discovery volume',
      'Quarterly roadmap planning',
      'Advanced risk mapping',
      'Carry-forward runs (with ext.)'
    ],
    footerNote: 'MOST POPULAR FOR MID-SIZE'
  },
  {
    name: 'SCALE PACK',
    subtitle: 'Enterprise Transformation',
    price: {
      INR: { original: 2376000, discounted: 2349999 },
      USD: { original: 29999, discounted: 27999 }
    },
    duration: '/ 12m',
    validity: '12 Months Validity',
    runs: '300 Evaluation Runs',
    users: '10 Enterprise Licenses',
    features: [
      'Everything in Growth',
      'Maximum agentic intelligence',
      'Annual strategy alignment',
      'Full export capabilities',
      'Priority roadmap governance'
    ],
    footerNote: 'FOR GLOBAL ENTERPRISES'
  }
];

const addons = [
  { 
    label: '1 Month Ext.', 
    price: {
      INR: { original: 237500, discounted: 219999 },
      USD: { original: 2599, discounted: 2399 }
    },
    runs: '+25 runs' 
  },
  { 
    label: '3 Month Ext.', 
    price: {
      INR: { original: 676875, discounted: 629999 },
      USD: { original: 7499, discounted: 6999 }
    },
    runs: '+75 runs' 
  },
  { 
    label: '6 Month Ext.', 
    price: {
      INR: { original: 1286063, discounted: 1199999 },
      USD: { original: 14499, discounted: 13499 }
    },
    runs: '+150 runs' 
  }
];

const runPacks = [
  { volume: 50, price: { INR: { original: 25000, discounted: 23999 }, USD: { original: 299, discounted: 269 } } },
  { volume: 75, price: { INR: { original: 36750, discounted: 34999 }, USD: { original: 449, discounted: 399 } } },
  { volume: 100, price: { INR: { original: 48020, discounted: 45999 }, USD: { original: 599, discounted: 529 } } },
  { volume: 125, price: { INR: { original: 58825, discounted: 55999 }, USD: { original: 749, discounted: 649 } } },
  { volume: 150, price: { INR: { original: 69178, discounted: 65999 }, USD: { original: 899, discounted: 769 } } },
  { volume: 175, price: { INR: { original: 79093, discounted: 74999 }, USD: { original: 1049, discounted: 869 } } },
  { volume: 200, price: { INR: { original: 88584, discounted: 84999 }, USD: { original: 1199, discounted: 999 } } }
];

const Pricing: React.FC = () => {
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');

  const handlePrint = () => {
    window.print();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="bg-white py-24 px-6 print:p-0">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            margin: 0;
            size: landscape;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100%;
            height: 100%;
            overflow: hidden;
            font-size: 7pt;
          }
          nav, footer, .print\\:hidden {
            display: none !important;
          }
          #pricing-root {
            width: 2200px !important;
            transform: scale(0.35);
            transform-origin: top center;
            padding: 5px !important;
            margin: 0 auto !important;
            display: block !important;
          }
          .pricing-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 8px !important;
            margin-bottom: 8px !important;
          }
          .pricing-card {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            padding: 12px !important;
            border-radius: 20px !important;
            height: auto !important;
            border-width: 1px !important;
          }
          .pricing-section {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            margin-top: 8px !important;
          }
          .hero-section {
            margin-bottom: 8px !important;
          }
          h1 {
            font-size: 2.5rem !important;
            line-height: 1 !important;
          }
          .mt-40, .mt-16 {
            margin-top: 5px !important;
          }
          .mb-16 {
            margin-bottom: 5px !important;
          }
          .py-24 {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
          .p-16, .p-12, .p-8 {
            padding: 8px !important;
          }
          .space-y-6 > :not([hidden]) ~ :not([hidden]),
          .space-y-12 > :not([hidden]) ~ :not([hidden]),
          .space-y-4 > :not([hidden]) ~ :not([hidden]) {
            margin-top: 4px !important;
          }
          /* Fix for absolute badge in print */
          .pricing-card .absolute {
            position: static !important;
            display: block !important;
            width: fit-content !important;
            margin: 0 auto 8px auto !important;
            transform: none !important;
            font-size: 7px !important;
            padding: 2px 8px !important;
          }
          /* Ensure text doesn't wrap awkwardly */
          .text-7xl { font-size: 2.5rem !important; }
          .text-5xl { font-size: 1.8rem !important; }
          .text-xl { font-size: 0.7rem !important; }
          .text-2xl { font-size: 1rem !important; }
          .text-3xl { font-size: 1.2rem !important; }
          .text-xs { font-size: 6px !important; }
          .text-sm { font-size: 7px !important; }
          
          /* Force single page */
          html, body {
            height: 100%;
            page-break-after: avoid;
            page-break-before: avoid;
          }
        }
      `}} />
      <div id="pricing-root">
        <div className="max-w-5xl mx-auto text-center space-y-6 mb-16 hero-section">
        <div className="inline-flex items-center gap-2 bg-black text-white px-5 py-2 rounded-full text-[10px] font-black tracking-[0.2em] uppercase">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          Pricing Prospectus 2026
        </div>
        <h1 className="text-7xl font-black text-gray-900 tracking-tighter">
          Invest in <span className="text-[#9d7bb0]">Clarity.</span><br />
          Scale with <span className="text-[#4db6ac]">Confidence.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
         Avagama AI provides access to enterprise-grade agentic intelligence tailored to your scale - flexible plans designed to help you discover, evaluate, and operationalize high-impact automation workflows with measurable ROI.
        </p>
      </div>

      {/* Currency Toggle & Print */}
      <div className="flex flex-col items-center gap-6 mb-16 print:hidden">
        <div className="bg-white border border-gray-100 rounded-full p-1.5 shadow-sm flex items-center gap-1">
          <button 
            onClick={() => setCurrency('USD')}
            className={`px-8 py-2.5 rounded-full text-xs font-black tracking-widest transition-all ${currency === 'USD' ? 'bg-[#1a1c2e] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
          >
            USD
          </button>
          <button 
            onClick={() => setCurrency('INR')}
            className={`px-8 py-2.5 rounded-full text-xs font-black tracking-widest transition-all ${currency === 'INR' ? 'bg-[#1a1c2e] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
          >
            INR
          </button>
        </div>
        
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black tracking-widest uppercase hover:bg-black transition-all shadow-xl shadow-gray-100 print:hidden"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Print Pricing PDF
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 pricing-grid">
        {plans.map((plan, i) => (
          <div key={i} className={`pricing-card group relative p-12 rounded-[60px] border-2 transition-all duration-500 flex flex-col ${i === 1 ? 'border-[#9d7bb0] bg-gray-50/30 scale-105 shadow-2xl' : 'border-gray-100 hover:border-[#9d7bb0]/30 hover:shadow-xl'}`}>
            {i === 1 && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#9d7bb0] text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-widest shadow-xl">
                Strategic Choice
              </div>
            )}
            
            <div className="space-y-2 mb-10">
              <h2 className="text-[#9d7bb0] font-black text-xs tracking-[0.3em] uppercase">{plan.name}</h2>
              <p className="text-2xl font-bold text-gray-900 leading-tight">{plan.subtitle}</p>
            </div>

            <div className="mb-12 space-y-1">
              <div className="text-sm font-bold text-gray-400 line-through opacity-60">
                {formatPrice(plan.price[currency].original)}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-gray-900 tracking-tighter">
                  {formatPrice(plan.price[currency].discounted)}
                </span>
                <span className="text-gray-400 font-bold text-sm">{plan.duration}</span>
              </div>
            </div>

            <div className="space-y-6 flex-grow">
               <div className="space-y-3">
                  <div className="flex items-center gap-3 text-xs font-bold text-gray-700">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-[#9d7bb0]">⏳</div>
                    {plan.validity}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-gray-700">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-[#4db6ac]">⚡</div>
                    {plan.runs}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-gray-700">
                    <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">👤</div>
                    {plan.users}
                  </div>
               </div>

               <div className="pt-8 border-t border-gray-100 space-y-4">
                  {plan.features.map((f, j) => (
                    <div key={j} className="flex gap-4 items-start text-xs font-medium text-gray-500 leading-relaxed">
                      <svg className="w-4 h-4 text-[#4db6ac] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {f}
                    </div>
                  ))}
               </div>
            </div>

            <div className="mt-12">
               <div className="bg-gray-100 p-4 rounded-2xl text-[10px] text-center font-black text-gray-400 mb-8 uppercase tracking-widest">
                  {plan.footerNote}
               </div>
               <button className={`w-full py-5 rounded-[25px] font-black text-xs uppercase tracking-[0.2em] transition-all print:hidden ${i === 1 ? 'bg-[#9d7bb0] text-white hover:bg-[#8b6aa1] shadow-2xl shadow-purple-200' : 'bg-gray-900 text-white hover:bg-black'}`}>
                {plan.name.split(' ')[0]}
               </button>
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto mt-40 pricing-section">
        <div className="bg-gray-50 p-16 rounded-[60px] border border-gray-100 space-y-12">
           <div className="text-center space-y-2">
              <h3 className="text-3xl font-bold">Enterprise Add-ons</h3>
              <p className="text-gray-500 font-medium">Extend your discovery phase without losing momentum.</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {addons.map((addon, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-gray-200 text-center space-y-4 shadow-sm hover:shadow-lg transition-all">
                   <div className="text-[10px] font-black text-[#9d7bb0] uppercase tracking-widest">{addon.label}</div>
                   <div className="space-y-1">
                      <div className="text-[10px] font-bold text-gray-400 line-through opacity-60">
                        {formatPrice(addon.price[currency].original)}
                      </div>
                      <div className="text-xl font-black text-gray-900">
                        {formatPrice(addon.price[currency].discounted)}
                      </div>
                   </div>
                   <div className="text-[10px] font-bold text-[#4db6ac] uppercase">{addon.runs}</div>
                   <button className="w-full py-3 rounded-xl bg-gray-50 text-gray-800 text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 print:hidden">Add to Pack</button>
                </div>
              ))}
           </div>
           
           <div className="text-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Pricing subject to standard terms and conditions. Taxes additional as applicable.</p>
           </div>
        </div>

        {/* Discovery & Evaluation Run Packs */}
        <div className="mt-16 bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden pricing-section">
          {/* Header */}
          <div className="bg-[#1a1c2e] px-8 py-6 flex items-center gap-4">
            <svg className="w-6 h-6 text-[#9d7bb0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="text-white text-sm font-black uppercase tracking-[0.15em]">Discovery & Evaluation Run Packs</h3>
          </div>
          
          {/* Table */}
          <div className="px-8">
            <div className="flex justify-between py-4 border-b border-gray-50">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Volume</span>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Price</span>
            </div>
            
            <div className="flex flex-col">
              {runPacks.map((pack, i) => (
                <div key={i} className={`flex justify-between items-center py-5 ${i !== runPacks.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <span className="text-sm font-medium text-gray-700">{pack.volume} Discovery & Evaluation Runs</span>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-gray-400 line-through opacity-60">
                      {formatPrice(pack.price[currency].original)}
                    </span>
                    <span className="text-sm font-black text-[#9d7bb0]">
                      {formatPrice(pack.price[currency].discounted)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
