import React from 'react';

interface CTAAction {
  text: string;
  href: string;
  onClick?: () => void;
}

interface CTAProps {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  primaryAction?: CTAAction;
  secondaryAction?: CTAAction;
  backgroundImage?: string;
}

const CTA: React.FC<CTAProps> = ({
  title = "Ready to revolutionize your demos?",
  description = "Sign up today and start building interactive, AI-powered product demos that captivate and convert.",
  buttonText = "Get started",
  buttonUrl = "#",
  variant = 'primary',
  size = 'md',
  className = '',
  primaryAction,
  secondaryAction,
  backgroundImage
}) => {
  const variantClasses = {
    primary: 'variant-primary',
    secondary: 'variant-secondary',
    outline: 'variant-outline'
  };

  const sizeClasses = {
    sm: 'size-sm',
    md: 'size-md',
    lg: 'size-lg'
  };

  const containerClasses = `bg-domo-dark-blue ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim();

  return (
    <div className={containerClasses} data-testid="cta-container">
      <div className="mx-auto max-w-7xl py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="relative isolate overflow-hidden bg-gray-900 px-6 pt-16 shadow-2xl sm:rounded-3xl sm:px-16 md:pt-24 lg:flex lg:gap-x-20 lg:px-24 lg:pt-0">
          <svg
            viewBox="0 0 1024 1024"
            className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-y-1/2 [mask-image:radial-gradient(closest-side,white,transparent)] sm:left-full sm:-ml-80 lg:left-1/2 lg:ml-0 lg:-translate-x-1/2 lg:translate-y-0"
            aria-hidden="true"
          >
            <circle cx={512} cy={512} r={512} fill="url(#759c1415-0410-454c-8f7c-9a820de03641)" fillOpacity="0.7" />
            <defs>
              <radialGradient id="759c1415-0410-454c-8f7c-9a820de03641">
                <stop stopColor="#7775D6" />
                <stop offset={1} stopColor="#E935C1" />
              </radialGradient>
            </defs>
          </svg>
          <div className="mx-auto max-w-md text-center lg:mx-0 lg:flex-auto lg:py-32 lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {title}
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              {description}
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6 lg:justify-start">
              <a
                href={primaryAction?.href || buttonUrl}
                onClick={primaryAction?.onClick}
                className="rounded-md bg-domo-green px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {primaryAction?.text || buttonText}
              </a>
              <a 
                href={secondaryAction?.href || "#"} 
                onClick={secondaryAction?.onClick}
                className="text-sm font-semibold leading-6 text-white"
              >
                {secondaryAction?.text || "Learn more"} <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
          {backgroundImage && (
            <div data-testid="cta-image-section" className="relative lg:mt-8">
              <img
                className="absolute inset-0 -z-10 h-full w-full object-cover"
                src={backgroundImage}
                alt=""
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { CTA };
export default CTA;
