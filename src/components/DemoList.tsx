import React from 'react';
import DemoListItem from './DemoListItem';

const DemoList = () => {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-domo-dark-text mb-4">Your Demos</h2>
      <div className="space-y-4">
        <DemoListItem />
        {/* Add more DemoListItem components as needed */}
      </div>
    </div>
  );
};

export default DemoList;
