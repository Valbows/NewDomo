import React from 'react';
import { Zap, MessageSquare, BarChart2 } from 'lucide-react';

const features = [
  {
    name: 'Instant AI-Powered Demos',
    description: 'Generate dynamic, conversational video demos from a simple text script. No coding required.',
    icon: Zap,
  },
  {
    name: 'Real-Time Q&A',
    description: 'Your AI demo can answer user questions on the fly, providing a truly interactive experience.',
    icon: MessageSquare,
  },
  {
    name: 'Engagement Analytics',
    description: 'Track user interactions, questions, and conversion points to understand what resonates most.',
    icon: BarChart2,
  },
];

const Features = () => {
  return (
    <section className="bg-domo-bg-dark py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-domo-primary">Core Features</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Everything you need for engaging product demos
          </p>
          <p className="mt-6 text-lg leading-8 text-domo-text-secondary">
            Domo A.I. provides a powerful suite of tools to create, deploy, and analyze interactive demos that drive results.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3 lg:gap-y-16">
            {features.map((feature) => (
              <div key={feature.name} className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-white">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-domo-primary">
                    <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-2 text-base leading-7 text-domo-text-secondary">{feature.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
};

export default Features;
