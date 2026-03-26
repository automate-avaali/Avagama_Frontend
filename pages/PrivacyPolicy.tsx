
import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="bg-[#fcfdff] min-h-screen pb-24">
      <div className="bg-white border-b border-gray-100 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-8">
          <h4 className="text-[10px] font-black text-[#9d7bb0] uppercase tracking-[0.4em] mb-4">Legal Framework</h4>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter leading-none">
            Privacy Policy
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 mt-6 prose prose-slate max-w-none">
        <div className="bg-white p-8 md:p-12 rounded-[32px] border border-gray-100 shadow-sm space-y-10">
          <section className="space-y-4">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">1. Introduction</h2>
            <p className="text-gray-600 font-medium leading-relaxed">
              At Avagama AI, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our platform and use our AI strategic discovery services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">2. Information We Collect</h2>
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-800 uppercase">A. Personal Data</h3>
              <p className="text-gray-600 font-medium leading-relaxed">
                We collect information that you provide directly to us, such as when you create an account, including your name, email address, and professional role.
              </p>
              <h3 className="text-sm font-bold text-gray-800 uppercase">B. Evaluation Data</h3>
              <p className="text-gray-600 font-medium leading-relaxed">
                When you use our evaluation tools, we process the business process descriptions and parameters you provide. This data is used solely to generate your strategic roadmaps and is not used to train our base models for other users.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-gray-600 font-medium space-y-2">
              <li>To provide, maintain, and improve our AI discovery services.</li>
              <li>To generate personalized AI implementation roadmaps and strategic quadrants.</li>
              <li>To communicate with you about updates, security alerts, and support.</li>
              <li>To monitor and analyze usage trends to enhance user experience.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">4. Data Security</h2>
            <p className="text-gray-600 font-medium leading-relaxed">
              We implement enterprise-grade administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the information you provide, please be aware that no security measures are perfect or impenetrable.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">5. AI Ethics & Data Usage</h2>
            <p className="text-gray-600 font-medium leading-relaxed">
              Avagama AI adheres to strict AI ethical guidelines. We do not sell your data. Your proprietary business process evaluations are encrypted and siloed. We use anonymized, aggregated data only for platform performance optimization.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">6. Contact Us</h2>
            <p className="text-gray-600 font-medium leading-relaxed">
              If you have questions or comments about this Privacy Policy, please contact us at: <a href="mailto:privacy@avagama.ai" className="text-[#9d7bb0] font-bold hover:underline">privacy@avagama.ai</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
