import React from 'react';
import Link from 'next/link';

const Header = () => {
  return (
    <header className="bg-domo-bg-card border-b border-domo-border">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link href="/dashboard">
              <img src="/domo-logo.png" alt="Domo" className="h-32" />
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link href="/dashboard" className="text-domo-text-secondary hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                Dashboard
              </Link>
              <Link href="/demos" className="text-domo-text-secondary hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                Demos
              </Link>
              <Link href="/brand-kit" className="text-domo-text-secondary hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                Brand Kit
              </Link>
              <Link href="/login" className="bg-domo-primary hover:bg-domo-secondary text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
