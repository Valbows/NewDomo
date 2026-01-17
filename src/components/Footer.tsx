import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-domo-bg-card border-t border-domo-border">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <Link href="/dashboard">
              <img src="/domo-logo.png" alt="Domo" className="h-32" />
            </Link>
            <p className="text-domo-text-secondary text-base">
              AI-Powered Product Demos.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Solutions</h3>
                <ul role="list" className="mt-4 space-y-4">
                  <li><a href="#" className="text-base text-domo-text-secondary hover:text-white transition-colors">Marketing</a></li>
                  <li><a href="#" className="text-base text-domo-text-secondary hover:text-white transition-colors">Sales</a></li>
                  <li><a href="#" className="text-base text-domo-text-secondary hover:text-white transition-colors">Onboarding</a></li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Support</h3>
                <ul role="list" className="mt-4 space-y-4">
                  <li><a href="#" className="text-base text-domo-text-secondary hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#" className="text-base text-domo-text-secondary hover:text-white transition-colors">Docs</a></li>
                  <li><a href="#" className="text-base text-domo-text-secondary hover:text-white transition-colors">API Status</a></li>
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Company</h3>
                <ul role="list" className="mt-4 space-y-4">
                  <li><a href="#" className="text-base text-domo-text-secondary hover:text-white transition-colors">About</a></li>
                  <li><a href="#" className="text-base text-domo-text-secondary hover:text-white transition-colors">Blog</a></li>
                  <li><a href="#" className="text-base text-domo-text-secondary hover:text-white transition-colors">Jobs</a></li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Legal</h3>
                <ul role="list" className="mt-4 space-y-4">
                  <li><a href="#" className="text-base text-domo-text-secondary hover:text-white transition-colors">Claim</a></li>
                  <li><a href="#" className="text-base text-domo-text-secondary hover:text-white transition-colors">Privacy</a></li>
                  <li><a href="#" className="text-base text-domo-text-secondary hover:text-white transition-colors">Terms</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-domo-border pt-8">
          <p className="text-base text-domo-text-muted xl:text-center">&copy; {new Date().getFullYear()} Domo A.I. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
