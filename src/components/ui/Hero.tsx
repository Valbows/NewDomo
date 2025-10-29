import React from 'react';
import Link from 'next/link';

const Hero = () => {
  return (
    <section className="bg-domo-light-gray">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-domo-dark-text leading-tight">
          Create AI-Powered Product Demos in Minutes
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-domo-light-text">
          Engage your customers with interactive, personalized video demos that answer questions in real-time. Boost conversions and shorten your sales cycle.
        </p>
        <div className="mt-8">
          <Link href="/dashboard">
            <button className="bg-domo-green hover:bg-opacity-90 text-white font-bold py-3 px-8 rounded-lg text-lg">
              Create a Demo Now
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
