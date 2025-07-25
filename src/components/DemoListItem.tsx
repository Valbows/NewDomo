import React from 'react';
import { MoreVertical } from 'lucide-react';

const DemoListItem = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between">
      <div>
        <h3 className="text-lg font-bold text-domo-dark-text">My First Product Demo</h3>
        <p className="text-sm text-domo-light-text">Created on: July 22, 2025</p>
      </div>
      <div className="flex items-center space-x-4">
        <span className="px-2 py-1 text-xs font-semibold text-domo-success bg-green-100 rounded-full">
          Active
        </span>
        <button className="text-domo-light-text hover:text-domo-dark-text">
          <MoreVertical size={20} />
        </button>
      </div>
    </div>
  );
};

export default DemoListItem;
