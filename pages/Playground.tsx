
import React from 'react';
import PlaygroundTab from './Admin/builder/PlaygroundTab';

const Playground: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="pt-8 px-10">
        <div className="max-w-[1600px] mx-auto">
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
            <PlaygroundTab agentId="standalone" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Playground;
