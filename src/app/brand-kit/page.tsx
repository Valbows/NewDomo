'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';

const BrandKitPage = () => {
  const [embedToken, setEmbedToken] = useState('');
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    // Set baseUrl from current origin
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const handleOpenPopup = () => {
    if (!embedToken.trim()) {
      alert('Please enter an embed token');
      return;
    }
    // @ts-ignore - Domo is loaded via script
    if (typeof window !== 'undefined' && window.Domo) {
      // @ts-ignore
      window.Domo.setBaseUrl(baseUrl);
      // @ts-ignore
      window.Domo.open(embedToken.trim());
    } else {
      alert('Domo embed script not loaded yet');
    }
  };
  const colors = [
    { name: 'Primary Blue', variable: 'domo-primary', hex: '#248BFB', usage: 'Main buttons, links, accents' },
    { name: 'Secondary Blue', variable: 'domo-secondary', hex: '#6FB3FC', usage: 'Hover states, secondary elements' },
    { name: 'Light Blue', variable: 'domo-light', hex: '#DAEAFB', usage: 'Text on dark, highlights' },
    { name: 'Alert/CTA', variable: 'domo-alert', hex: '#FF6F61', usage: 'Alerts, important CTAs' },
    { name: 'Background Dark', variable: 'domo-bg-dark', hex: '#0A0A0F', usage: 'Page backgrounds' },
    { name: 'Card Background', variable: 'domo-bg-card', hex: '#12121A', usage: 'Cards, panels' },
    { name: 'Elevated', variable: 'domo-bg-elevated', hex: '#1A1A24', usage: 'Modals, dropdowns' },
    { name: 'Border', variable: 'domo-border', hex: '#2A2A3A', usage: 'Dividers, borders' },
    { name: 'Success', variable: 'domo-success', hex: '#10B981', usage: 'Success states' },
    { name: 'Error', variable: 'domo-error', hex: '#EF4444', usage: 'Error states' },
  ];

  const typography = [
    { name: 'Display', font: 'Poppins', size: '42px', weight: '700', usage: 'Hero headlines' },
    { name: 'Heading 1', font: 'Poppins', size: '36px', weight: '600', usage: 'Page titles' },
    { name: 'Heading 2', font: 'Poppins', size: '24px', weight: '600', usage: 'Section headers' },
    { name: 'Heading 3', font: 'Poppins', size: '20px', weight: '600', usage: 'Card titles' },
    { name: 'Body', font: 'Figtree', size: '16px', weight: '400', usage: 'Paragraphs' },
    { name: 'Body Small', font: 'Figtree', size: '14px', weight: '400', usage: 'Secondary text' },
    { name: 'Caption', font: 'Figtree', size: '13px', weight: '400', usage: 'Labels' },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-domo-bg-dark">
      {/* Header */}
      <header className="bg-domo-bg-card border-b border-domo-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/domo-logo.png" alt="Domo" className="h-32" />
            <span className="text-xl font-semibold text-white font-heading">Brand Kit</span>
          </div>
          <Link
            href="/dashboard"
            className="text-domo-primary hover:text-domo-secondary font-medium transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <section className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-heading">
            Domo Brand Guidelines
          </h1>
          <p className="text-xl text-domo-text-secondary max-w-2xl font-body">
            A comprehensive guide to the Domo visual identity. Use these guidelines to maintain consistency across all platforms.
          </p>
        </section>

        {/* Logo Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6 font-heading">
            Logo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-domo-bg-card border border-domo-border rounded-xl p-8 flex flex-col items-center justify-center gap-4">
              <img src="/domo-logo.png" alt="Domo Logo" className="h-32" />
              <span className="text-domo-text-muted text-sm">Primary Logo</span>
            </div>
            <div className="bg-domo-bg-elevated rounded-xl p-8 flex flex-col items-center justify-center gap-4">
              <img src="/domo-logo.png" alt="Domo Logo" className="h-32" />
              <span className="text-domo-text-muted text-sm">On Elevated Surface</span>
            </div>
          </div>
          <p className="mt-4 text-domo-text-secondary text-sm">
            The logo is optimized for dark backgrounds. Ensure adequate spacing around the logo (minimum 16px).
          </p>
        </section>

        {/* Color Palette */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6 font-heading">
            Color Palette
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {colors.map((color) => (
              <div
                key={color.name}
                className="bg-domo-bg-card border border-domo-border rounded-xl overflow-hidden hover:border-domo-primary transition-colors cursor-pointer"
                onClick={() => copyToClipboard(color.hex)}
              >
                <div
                  className="h-20 w-full"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="p-4">
                  <h3 className="font-semibold text-white text-sm">{color.name}</h3>
                  <p className="text-domo-primary font-mono text-xs mt-1">{color.hex}</p>
                  <p className="text-domo-text-muted text-xs mt-2">{color.usage}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-domo-text-secondary text-sm">
            Click any color to copy its hex value to clipboard.
          </p>
        </section>

        {/* Typography */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6 font-heading">
            Typography
          </h2>
          <div className="bg-domo-bg-card border border-domo-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-domo-bg-elevated">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Style</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Font</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Size</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Weight</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Usage</th>
                </tr>
              </thead>
              <tbody>
                {typography.map((type, index) => (
                  <tr key={type.name} className={index % 2 === 0 ? 'bg-domo-bg-card' : 'bg-domo-bg-dark'}>
                    <td className="px-6 py-4">
                      <span
                        style={{
                          fontFamily: `${type.font}, sans-serif`,
                          fontSize: Math.min(parseInt(type.size), 24),
                          fontWeight: type.weight
                        }}
                        className="text-white"
                      >
                        {type.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-domo-text-secondary">{type.font}</td>
                    <td className="px-6 py-4 text-sm text-domo-text-secondary font-mono">{type.size}</td>
                    <td className="px-6 py-4 text-sm text-domo-text-secondary">{type.weight}</td>
                    <td className="px-6 py-4 text-sm text-domo-text-secondary">{type.usage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Buttons */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6 font-heading">
            Buttons
          </h2>
          <div className="flex flex-wrap gap-4 mb-6">
            <button className="px-6 py-3 bg-domo-primary hover:bg-domo-secondary text-white font-semibold rounded-lg transition-colors">
              Primary Button
            </button>
            <button className="px-6 py-3 bg-transparent border-2 border-domo-primary text-domo-primary hover:bg-domo-primary hover:text-white font-semibold rounded-lg transition-colors">
              Secondary Button
            </button>
            <button className="px-6 py-3 bg-domo-alert hover:opacity-90 text-white font-semibold rounded-lg transition-opacity">
              CTA Button
            </button>
            <button className="px-6 py-3 bg-domo-bg-elevated text-domo-text-muted font-semibold rounded-lg cursor-not-allowed" disabled>
              Disabled
            </button>
          </div>
          <div className="bg-domo-bg-card border border-domo-border rounded-xl p-6">
            <h3 className="font-semibold text-white mb-3">Button Guidelines</h3>
            <ul className="text-domo-text-secondary text-sm space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-domo-primary rounded-full"></span>
                Primary buttons for main actions (Submit, Save, Continue)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-domo-primary rounded-full"></span>
                Secondary buttons for alternative actions (Cancel, Back)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-domo-primary rounded-full"></span>
                CTA buttons for high-impact calls-to-action
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-domo-primary rounded-full"></span>
                Border radius: 8px | Padding: 12px 24px
              </li>
            </ul>
          </div>
        </section>

        {/* Cards */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6 font-heading">
            Cards & Containers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-domo-bg-card border border-domo-border rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">Default Card</h3>
              <p className="text-domo-text-secondary text-sm">Used for content sections and grouped information.</p>
              <code className="text-xs text-domo-primary mt-4 block">bg-domo-bg-card border-domo-border</code>
            </div>
            <div className="bg-domo-bg-elevated rounded-xl p-6 shadow-domo">
              <h3 className="font-semibold text-white mb-2">Elevated Card</h3>
              <p className="text-domo-text-secondary text-sm">Used for modals, dropdowns, and floating elements.</p>
              <code className="text-xs text-domo-primary mt-4 block">bg-domo-bg-elevated shadow-domo</code>
            </div>
            <div className="bg-domo-bg-card border border-domo-primary rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">Active/Selected Card</h3>
              <p className="text-domo-text-secondary text-sm">Used for selected or highlighted states.</p>
              <code className="text-xs text-domo-primary mt-4 block">border-domo-primary</code>
            </div>
          </div>
        </section>

        {/* Implementation */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6 font-heading">
            Tailwind CSS Configuration
          </h2>
          <div className="bg-domo-bg-card border border-domo-border rounded-xl p-6 overflow-x-auto">
            <pre className="text-sm text-domo-success font-mono">
{`// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'domo-primary': '#248BFB',
        'domo-secondary': '#6FB3FC',
        'domo-light': '#DAEAFB',
        'domo-alert': '#FF6F61',
        'domo-bg-dark': '#0A0A0F',
        'domo-bg-card': '#12121A',
        'domo-bg-elevated': '#1A1A24',
        'domo-border': '#2A2A3A',
        'domo-text': '#FFFFFF',
        'domo-text-secondary': '#A0A0B0',
        'domo-text-muted': '#666680',
        'domo-success': '#10B981',
        'domo-warning': '#F59E0B',
        'domo-error': '#EF4444',
      },
      fontFamily: {
        'heading': ['Poppins', 'sans-serif'],
        'body': ['Figtree', 'sans-serif'],
      },
    },
  },
}`}
            </pre>
          </div>
        </section>

        {/* Spacing */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6 font-heading">
            Spacing Scale
          </h2>
          <div className="flex items-end gap-4 mb-6">
            {[4, 8, 12, 16, 24, 32, 48, 64].map((size) => (
              <div key={size} className="flex flex-col items-center">
                <div
                  className="bg-domo-primary rounded"
                  style={{ width: size, height: size }}
                />
                <span className="mt-2 text-xs text-domo-text-muted">{size}px</span>
              </div>
            ))}
          </div>
          <p className="text-domo-text-secondary text-sm">
            Use consistent spacing based on an 8px grid system for harmony across layouts.
          </p>
        </section>

        {/* Embed Test Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6 font-heading">
            Embed Popup Test
          </h2>
          <div className="bg-domo-bg-card border border-domo-border rounded-xl p-6">
            <p className="text-domo-text-secondary mb-4">
              Test your popup modal embed here. Enter your embed token and click the button to open the demo popup.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <input
                type="text"
                value={embedToken}
                onChange={(e) => setEmbedToken(e.target.value)}
                placeholder="Enter your embed token..."
                className="flex-1 px-4 py-3 bg-domo-bg-dark border border-domo-border rounded-lg text-white placeholder-domo-text-muted focus:outline-none focus:border-domo-primary"
              />
              <button
                onClick={handleOpenPopup}
                className="px-6 py-3 bg-domo-primary hover:bg-domo-secondary text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
              >
                Open Popup Modal
              </button>
            </div>
            <div className="text-xs text-domo-text-muted">
              <p><strong>Base URL:</strong> <code className="text-domo-primary">{baseUrl || 'Loading...'}</code></p>
              <p className="mt-1">The popup will load the demo from your current environment.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Load Domo Embed Script */}
      <Script src="/embed.js" strategy="afterInteractive" />

      {/* Footer */}
      <footer className="bg-domo-bg-card border-t border-domo-border">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
          <p className="text-domo-text-muted text-sm">
            &copy; {new Date().getFullYear()} Domo A.I. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default BrandKitPage;
