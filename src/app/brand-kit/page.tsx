'use client';

import React, { useState } from 'react';
import { Copy, Check, Download, Palette, Type, Layout, Zap } from 'lucide-react';

export default function BrandKitPage() {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = (text: string, item: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(item);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const colors = {
    primary: {
      'domo-blue-accent': '#3B82F6',
      'domo-green': '#10B981',
      'domo-dark-text': '#1F2937',
      'domo-light-text': '#6B7280',
      'domo-success': '#059669',
    },
    gradients: {
      'primary-gradient': 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
      'success-gradient': 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      'background-gradient': 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
    },
    semantic: {
      'success': '#10B981',
      'warning': '#F59E0B',
      'error': '#EF4444',
      'info': '#3B82F6',
    }
  };

  const typography = {
    headings: {
      'h1': 'text-3xl font-bold',
      'h2': 'text-2xl font-bold',
      'h3': 'text-xl font-semibold',
      'h4': 'text-lg font-semibold',
    },
    body: {
      'large': 'text-lg',
      'base': 'text-base',
      'small': 'text-sm',
      'xs': 'text-xs',
    }
  };

  const components = [
    {
      name: 'Primary Button',
      code: 'bg-domo-green hover:bg-opacity-90 text-white font-bold py-2 px-4 rounded-lg',
      preview: <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">Primary Button</button>
    },
    {
      name: 'Secondary Button',
      code: 'bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors px-3 py-2',
      preview: <button className="bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors px-3 py-2">Secondary Button</button>
    },
    {
      name: 'Success Button',
      code: 'bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors px-6 py-3',
      preview: <button className="bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors px-6 py-3">Success Button</button>
    },
    {
      name: 'Card',
      code: 'bg-white rounded-xl shadow-lg p-8',
      preview: <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm"><h3 className="font-semibold mb-2">Card Title</h3><p className="text-gray-600">Card content goes here.</p></div>
    },
    {
      name: 'Input Field',
      code: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
      preview: <input className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter text..." />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Domo AI Brand Kit</h1>
              <p className="text-gray-600">Design system and brand guidelines</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <Palette className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-900">Colors</h3>
              <p className="text-sm text-blue-700">Brand palette</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <Type className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-900">Typography</h3>
              <p className="text-sm text-green-700">Font styles</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <Layout className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-purple-900">Components</h3>
              <p className="text-sm text-purple-700">UI elements</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <Zap className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-semibold text-orange-900">Usage</h3>
              <p className="text-sm text-orange-700">Guidelines</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-12">
        
        {/* Logo Section */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Logo & Identity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-3xl">D</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Primary Logo</h3>
              <p className="text-sm text-gray-600">Main brand mark with gradient</p>
            </div>
            
            <div className="bg-gray-900 rounded-xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-900 font-bold text-3xl">D</span>
              </div>
              <h3 className="font-semibold text-white mb-2">Reverse Logo</h3>
              <p className="text-sm text-gray-300">For dark backgrounds</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">DOMO</h1>
              <h3 className="font-semibold text-gray-900 mb-2">Wordmark</h3>
              <p className="text-sm text-gray-600">Text-only version</p>
            </div>
          </div>
        </section>

        {/* Color Palette */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Color Palette</h2>
          
          {/* Primary Colors */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Primary Colors</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(colors.primary).map(([name, value]) => (
                <div key={name} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="h-20" style={{ backgroundColor: value }}></div>
                  <div className="p-4">
                    <h4 className="font-semibold text-sm text-gray-900">{name.replace('domo-', '').replace('-', ' ')}</h4>
                    <p className="text-xs text-gray-600 font-mono">{value}</p>
                    <button
                      onClick={() => copyToClipboard(value, name)}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      {copiedItem === name ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                      {copiedItem === name ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gradients */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Gradients</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(colors.gradients).map(([name, value]) => (
                <div key={name} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="h-20" style={{ background: value }}></div>
                  <div className="p-4">
                    <h4 className="font-semibold text-sm text-gray-900">{name.replace('-', ' ')}</h4>
                    <p className="text-xs text-gray-600 font-mono break-all">{value}</p>
                    <button
                      onClick={() => copyToClipboard(value, name)}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      {copiedItem === name ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                      {copiedItem === name ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Semantic Colors */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Semantic Colors</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(colors.semantic).map(([name, value]) => (
                <div key={name} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="h-16" style={{ backgroundColor: value }}></div>
                  <div className="p-4">
                    <h4 className="font-semibold text-sm text-gray-900 capitalize">{name}</h4>
                    <p className="text-xs text-gray-600 font-mono">{value}</p>
                    <button
                      onClick={() => copyToClipboard(value, name)}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      {copiedItem === name ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                      {copiedItem === name ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Typography */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Typography</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Headings */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Headings</h3>
              <div className="space-y-4">
                {Object.entries(typography.headings).map(([tag, classes]) => (
                  <div key={tag} className="border-b border-gray-100 pb-4">
                    <div className={classes + ' text-gray-900 mb-2'}>
                      {tag.toUpperCase()} - The quick brown fox
                    </div>
                    <div className="flex justify-between items-center">
                      <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">{classes}</code>
                      <button
                        onClick={() => copyToClipboard(classes, tag)}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        {copiedItem === tag ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                        {copiedItem === tag ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Body Text */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Body Text</h3>
              <div className="space-y-4">
                {Object.entries(typography.body).map(([size, classes]) => (
                  <div key={size} className="border-b border-gray-100 pb-4">
                    <div className={classes + ' text-gray-700 mb-2'}>
                      {size} - The quick brown fox jumps over the lazy dog
                    </div>
                    <div className="flex justify-between items-center">
                      <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">{classes}</code>
                      <button
                        onClick={() => copyToClipboard(classes, size)}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        {copiedItem === size ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                        {copiedItem === size ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Components */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">UI Components</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {components.map((component, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{component.name}</h3>
                
                {/* Preview */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg flex items-center justify-center min-h-[80px]">
                  {component.preview}
                </div>
                
                {/* Code */}
                <div className="bg-gray-900 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-gray-400 uppercase tracking-wide">Tailwind Classes</span>
                    <button
                      onClick={() => copyToClipboard(component.code, component.name)}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center"
                    >
                      {copiedItem === component.name ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                      {copiedItem === component.name ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <code className="text-sm text-gray-300 break-all">{component.code}</code>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Usage Guidelines */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Usage Guidelines</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">✅ Do's</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Use the primary gradient for key call-to-action buttons
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Maintain consistent spacing with Tailwind's spacing scale
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Use semantic colors for status indicators
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Keep text contrast ratio above 4.5:1 for accessibility
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Use rounded corners consistently (rounded-lg, rounded-xl)
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">❌ Don'ts</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Don't use brand colors for decorative purposes only
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Don't mix different border radius values in the same component
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Don't use low contrast color combinations
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Don't stretch or distort the logo
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Don't use too many colors in a single interface
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Download Section */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Build?</h2>
            <p className="text-xl mb-8 opacity-90">Use these guidelines to create consistent, beautiful experiences</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center">
                <Download className="w-5 h-5 mr-2" />
                Download Assets
              </button>
              <a 
                href="/demos/create" 
                className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center justify-center"
              >
                <Zap className="w-5 h-5 mr-2" />
                Start Building
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">D</span>
          </div>
          <p className="text-gray-400">Domo AI Brand Kit • Built with ❤️ for consistent design</p>
          <p className="text-sm text-gray-500 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </footer>
    </div>
  );
}
