import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <a href="#" className="text-2xl font-bold text-domo-dark-text">DOMO</a>
            <p className="text-domo-light-text text-base">
              AI-Powered Product Demos.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-domo-dark-text tracking-wider uppercase">Solutions</h3>
                <ul role="list" className="mt-4 space-y-4">
                  <li><a href="#" className="text-base text-domo-light-text hover:text-domo-dark-text">Marketing</a></li>
                  <li><a href="#" className="text-base text-domo-light-text hover:text-domo-dark-text">Sales</a></li>
                  <li><a href="#" className="text-base text-domo-light-text hover:text-domo-dark-text">Onboarding</a></li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-domo-dark-text tracking-wider uppercase">Support</h3>
                <ul role="list" className="mt-4 space-y-4">
                  <li><a href="#" className="text-base text-domo-light-text hover:text-domo-dark-text">Pricing</a></li>
                  <li><a href="#" className="text-base text-domo-light-text hover:text-domo-dark-text">Docs</a></li>
                  <li><a href="#" className="text-base text-domo-light-text hover:text-domo-dark-text">API Status</a></li>
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-domo-dark-text tracking-wider uppercase">Company</h3>
                <ul role="list" className="mt-4 space-y-4">
                  <li><a href="#" className="text-base text-domo-light-text hover:text-domo-dark-text">About</a></li>
                  <li><a href="#" className="text-base text-domo-light-text hover:text-domo-dark-text">Blog</a></li>
                  <li><a href="#" className="text-base text-domo-light-text hover:text-domo-dark-text">Jobs</a></li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-domo-dark-text tracking-wider uppercase">Legal</h3>
                <ul role="list" className="mt-4 space-y-4">
                  <li><a href="#" className="text-base text-domo-light-text hover:text-domo-dark-text">Claim</a></li>
                  <li><a href="#" className="text-base text-domo-light-text hover:text-domo-dark-text">Privacy</a></li>
                  <li><a href="#" className="text-base text-domo-light-text hover:text-domo-dark-text">Terms</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-base text-domo-light-text xl:text-center">&copy; {new Date().getFullYear()} Domo A.I. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
