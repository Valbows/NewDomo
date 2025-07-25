"use client";

import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user';
import Link from 'next/link';

const HomePageClient = () => {
  const user = useUserStore((state) => state.user);
  const router = useRouter();

  const handleCreateDemo = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  return (
    <>
      <header className="bg-domo-dark-blue">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
          <div className="w-full py-6 flex items-center justify-between border-b border-domo-light-blue lg:border-none">
            <div className="flex items-center">
              <a href="#">
                <span className="sr-only">Domo A.I.</span>
                <h1 className="text-2xl font-bold text-white">DOMO</h1>
              </a>
            </div>
            <div className="ml-10 space-x-4 flex items-center">
                <Link href="#" className="text-domo-light-text hover:text-white px-3 py-2 rounded-md text-sm font-medium">Features</Link>
                <Link href="#" className="text-domo-light-text hover:text-white px-3 py-2 rounded-md text-sm font-medium">Pricing</Link>
                <Link href="#" className="text-domo-light-text hover:text-white px-3 py-2 rounded-md text-sm font-medium">About</Link>
                {user ? (
                    <button onClick={() => router.push('/dashboard')} className="bg-domo-green hover:bg-opacity-90 text-white font-bold py-2 px-4 rounded-lg text-sm">Dashboard</button>
                ) : (
                    <Link href="/login" className="text-domo-light-text hover:text-white px-3 py-2 rounded-md text-sm font-medium">Sign In</Link>
                )}
            </div>
          </div>
        </nav>
      </header>

      <main className="bg-domo-dark-blue">
        <div className="text-center py-16 md:py-24 px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
            Create AI-Powered Product Demos in Minutes
          </h2>
          <p className="mt-5 max-w-md mx-auto text-lg text-domo-light-text sm:text-xl md:mt-5 md:max-w-3xl">
            Engage your customers with interactive, personalized video demos that answer questions in real-time. Boost conversions and shorten your sales cycle.
          </p>
          <div className="mt-8 flex justify-center">
            <div className="inline-flex rounded-md shadow">
              <button
                onClick={handleCreateDemo}
                className="bg-domo-green hover:bg-opacity-90 text-white font-bold py-3 px-8 rounded-lg text-lg"
              >
                Create a Demo Now
              </button>
            </div>
          </div>
        </div>

        <div className="py-12 bg-domo-dark-blue">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
                <h3 className="text-base text-domo-green font-semibold tracking-wider uppercase">Core Features</h3>
                <p className="mt-2 text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
                    Everything you need for engaging product demos
                </p>
                <p className="mt-4 max-w-2xl mx-auto text-xl text-domo-light-text">
                    Domo A.I. provides a powerful suite of tools to create, deploy, and analyze interactive demos that drive results.
                </p>
            </div>

            <div className="mt-10">
              <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
                <div className="relative text-white">
                  <dt>
                    <p className="ml-16 text-lg leading-6 font-medium text-white">Instant AI-Powered Demos</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-domo-light-text">
                    Generate dynamic, conversational video demos from a simple text script. No coding required.
                  </dd>
                </div>

                <div className="relative text-white">
                  <dt>
                    <p className="ml-16 text-lg leading-6 font-medium text-white">Real-Time Q&A</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-domo-light-text">
                    Your AI demo can answer user questions on the fly, providing a truly interactive experience.
                  </dd>
                </div>

                <div className="relative text-white">
                  <dt>
                    <p className="ml-16 text-lg leading-6 font-medium text-white">Engagement Analytics</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-domo-light-text">
                    Track user interactions, questions, and conversion points to understand what resonates most.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-domo-light-blue">
            <div className="max-w-4xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                    <span className="block">Ready to revolutionize your demos?</span>
                </h2>
                <p className="mt-4 text-lg leading-6 text-domo-light-text">
                    Sign up today and start building interactive, AI-powered product demos that captivate and convert.
                </p>
                <button onClick={handleCreateDemo} className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-domo-dark-blue bg-white hover:bg-gray-50 sm:w-auto">
                    Get started
                </button>
                <a href="#" className="mt-4 text-sm text-white underline ml-4">Learn more &rarr;</a>
            </div>
        </div>
      </main>

      <footer className="bg-domo-dark-blue">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
            <div className="flex justify-center space-x-6 md:order-2">
                <p className="text-center text-base text-domo-light-text">&copy; 2025 Domo A.I. All rights reserved.</p>
            </div>
            <div className="mt-8 md:mt-0 md:order-1">
                <p className="text-center text-base text-domo-light-text">AI-Powered Product Demos.</p>
            </div>
        </div>
      </footer>
    </>
  );
};

export default HomePageClient;
