import React from 'react';

const Header = () => {
  return (
    <header className="bg-domo-dark-blue text-white shadow-sm">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <a href="#" className="text-2xl font-bold">DOMO</a>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <a href="#" className="text-domo-light-text hover:text-white px-3 py-2 rounded-md text-sm font-medium">Features</a>
              <a href="#" className="text-domo-light-text hover:text-white px-3 py-2 rounded-md text-sm font-medium">Pricing</a>
              <a href="#" className="text-domo-light-text hover:text-white px-3 py-2 rounded-md text-sm font-medium">About</a>
              <a href="#" className="text-domo-light-text hover:text-white px-3 py-2 rounded-md text-sm font-medium">Sign In</a>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
