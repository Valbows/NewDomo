/**
 * Unit tests for CTA component
 * Tests CTA rendering and link functionality
 */

import { render, screen } from '@testing-library/react';
import CTA from '@/components/CTA';

describe('CTA Component', () => {
  describe('Rendering', () => {
    it('renders the main CTA section', () => {
      render(<CTA />);

      expect(screen.getByText('Ready to revolutionize your demos?')).toBeInTheDocument();
      expect(screen.getByText(/Sign up today and start building interactive/)).toBeInTheDocument();
    });

    it('renders the primary CTA button', () => {
      render(<CTA />);

      const getStartedButton = screen.getByText('Get started');
      expect(getStartedButton).toBeInTheDocument();
      expect(getStartedButton.closest('a')).toHaveAttribute('href', '#');
    });

    it('renders the secondary CTA link', () => {
      render(<CTA />);

      const learnMoreLink = screen.getByText('Learn more');
      expect(learnMoreLink).toBeInTheDocument();
      expect(learnMoreLink.closest('a')).toHaveAttribute('href', '#');
    });

    it('includes the arrow indicator in learn more link', () => {
      render(<CTA />);

      expect(screen.getByText('→')).toBeInTheDocument();
    });
  });

  describe('Content', () => {
    it('displays the correct heading', () => {
      render(<CTA />);

      const heading = screen.getByText('Ready to revolutionize your demos?');
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H2');
    });

    it('displays the correct description', () => {
      render(<CTA />);

      const description = screen.getByText('Sign up today and start building interactive, AI-powered product demos that captivate and convert.');
      expect(description).toBeInTheDocument();
    });

    it('has proper text hierarchy', () => {
      render(<CTA />);

      const heading = screen.getByText('Ready to revolutionize your demos?');
      const description = screen.getByText(/Sign up today and start building interactive/);

      expect(heading.tagName).toBe('H2');
      expect(description.tagName).toBe('P');
    });
  });

  describe('Styling', () => {
    it('has proper background styling', () => {
      render(<CTA />);

      const mainSection = screen.getByText('Ready to revolutionize your demos?').closest('div');
      let currentElement = mainSection;
      
      // Navigate up to find the background container
      while (currentElement && !currentElement.classList.contains('bg-domo-dark-blue')) {
        currentElement = currentElement.parentElement;
      }
      
      expect(currentElement).toHaveClass('bg-domo-dark-blue');
    });

    it('has proper button styling', () => {
      render(<CTA />);

      const getStartedButton = screen.getByText('Get started');
      expect(getStartedButton).toHaveClass('rounded-md');
      expect(getStartedButton).toHaveClass('bg-domo-green');
      expect(getStartedButton).toHaveClass('px-3.5');
      expect(getStartedButton).toHaveClass('py-2.5');
      expect(getStartedButton).toHaveClass('text-sm');
      expect(getStartedButton).toHaveClass('font-semibold');
      expect(getStartedButton).toHaveClass('text-white');
    });

    it('has proper secondary link styling', () => {
      render(<CTA />);

      const learnMoreLink = screen.getByText('Learn more');
      expect(learnMoreLink).toHaveClass('text-sm');
      expect(learnMoreLink).toHaveClass('font-semibold');
      expect(learnMoreLink).toHaveClass('leading-6');
      expect(learnMoreLink).toHaveClass('text-white');
    });

    it('has proper heading styling', () => {
      render(<CTA />);

      const heading = screen.getByText('Ready to revolutionize your demos?');
      expect(heading).toHaveClass('text-3xl');
      expect(heading).toHaveClass('font-bold');
      expect(heading).toHaveClass('tracking-tight');
      expect(heading).toHaveClass('text-white');
    });

    it('has proper description styling', () => {
      render(<CTA />);

      const description = screen.getByText(/Sign up today and start building interactive/);
      expect(description).toHaveClass('mt-6');
      expect(description).toHaveClass('text-lg');
      expect(description).toHaveClass('leading-8');
      expect(description).toHaveClass('text-gray-300');
    });
  });

  describe('Layout', () => {
    it('has proper container structure', () => {
      render(<CTA />);

      const heading = screen.getByText('Ready to revolutionize your demos?');
      const container = heading.closest('div');
      
      expect(container).toHaveClass('mx-auto');
      expect(container).toHaveClass('max-w-md');
      expect(container).toHaveClass('text-center');
    });

    it('has proper button container layout', () => {
      render(<CTA />);

      const getStartedButton = screen.getByText('Get started');
      const buttonContainer = getStartedButton.closest('div');
      
      expect(buttonContainer).toHaveClass('mt-10');
      expect(buttonContainer).toHaveClass('flex');
      expect(buttonContainer).toHaveClass('items-center');
      expect(buttonContainer).toHaveClass('justify-center');
      expect(buttonContainer).toHaveClass('gap-x-6');
    });

    it('has responsive layout classes', () => {
      render(<CTA />);

      const heading = screen.getByText('Ready to revolutionize your demos?');
      expect(heading).toHaveClass('sm:text-4xl');

      // Check for responsive container classes
      const mainContainer = heading.closest('div');
      let currentElement = mainContainer;
      
      while (currentElement && !currentElement.classList.contains('mx-auto')) {
        currentElement = currentElement.parentElement;
      }
      
      if (currentElement) {
        expect(currentElement).toHaveClass('mx-auto');
        expect(currentElement).toHaveClass('max-w-md');
      }
    });
  });

  describe('SVG Background', () => {
    it('includes decorative SVG background', () => {
      render(<CTA />);

      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('viewBox', '0 0 1024 1024');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('has proper SVG styling', () => {
      render(<CTA />);

      const svg = document.querySelector('svg');
      expect(svg).toHaveClass('absolute');
      expect(svg).toHaveClass('left-1/2');
      expect(svg).toHaveClass('top-1/2');
      expect(svg).toHaveClass('-z-10');
    });

    it('includes gradient definition', () => {
      render(<CTA />);

      const radialGradient = document.querySelector('radialGradient');
      expect(radialGradient).toBeInTheDocument();
      expect(radialGradient).toHaveAttribute('id', '759c1415-0410-454c-8f7c-9a820de03641');
    });
  });

  describe('Accessibility', () => {
    it('has accessible links', () => {
      render(<CTA />);

      const getStartedLink = screen.getByText('Get started').closest('a');
      const learnMoreLink = screen.getByText('Learn more').closest('a');

      expect(getStartedLink).toHaveAttribute('href');
      expect(learnMoreLink).toHaveAttribute('href');
    });

    it('has proper focus styling', () => {
      render(<CTA />);

      const getStartedButton = screen.getByText('Get started');
      expect(getStartedButton).toHaveClass('focus-visible:outline');
      expect(getStartedButton).toHaveClass('focus-visible:outline-2');
      expect(getStartedButton).toHaveClass('focus-visible:outline-offset-2');
      expect(getStartedButton).toHaveClass('focus-visible:outline-white');
    });

    it('has proper hover states', () => {
      render(<CTA />);

      const getStartedButton = screen.getByText('Get started');
      expect(getStartedButton).toHaveClass('hover:bg-opacity-90');
    });

    it('has semantic HTML structure', () => {
      render(<CTA />);

      const heading = screen.getByText('Ready to revolutionize your demos?');
      const description = screen.getByText(/Sign up today and start building interactive/);

      expect(heading.tagName).toBe('H2');
      expect(description.tagName).toBe('P');
    });

    it('has proper aria-hidden for decorative elements', () => {
      render(<CTA />);

      const svg = document.querySelector('svg');
      const arrowSpan = screen.getByText('→');

      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(arrowSpan).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Component Structure', () => {
    it('renders without crashing', () => {
      expect(() => render(<CTA />)).not.toThrow();
    });

    it('is a functional component', () => {
      const component = render(<CTA />);
      expect(component).toBeDefined();
    });

    it('has proper component hierarchy', () => {
      render(<CTA />);

      // Should have main container
      const heading = screen.getByText('Ready to revolutionize your demos?');
      expect(heading).toBeInTheDocument();

      // Should have description
      const description = screen.getByText(/Sign up today and start building interactive/);
      expect(description).toBeInTheDocument();

      // Should have action buttons
      expect(screen.getByText('Get started')).toBeInTheDocument();
      expect(screen.getByText('Learn more')).toBeInTheDocument();
    });
  });
});