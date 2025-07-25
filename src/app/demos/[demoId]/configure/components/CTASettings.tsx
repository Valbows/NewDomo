import React from 'react';
import { Demo } from '../types';

interface CTASettingsProps {
  demo: Demo | null;
  ctaTitle: string;
  setCTATitle: (title: string) => void;
  ctaMessage: string;
  setCTAMessage: (message: string) => void;
  ctaButtonText: string;
  setCTAButtonText: (text: string) => void;
  ctaButtonUrl: string;
  setCTAButtonUrl: (url: string) => void;
  onSaveCTA: () => void;
}

export const CTASettings = ({
  demo,
  ctaTitle,
  setCTATitle,
  ctaMessage,
  setCTAMessage,
  ctaButtonText,
  setCTAButtonText,
  ctaButtonUrl,
  setCTAButtonUrl,
  onSaveCTA
}: CTASettingsProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Call-to-Action Settings</h2>
        <p className="text-gray-600 mb-6">Configure what happens when the AI agent determines a user is ready to take action.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <div>
          <label htmlFor="cta-title" className="block text-sm font-medium text-gray-700 mb-2">
            CTA Title
          </label>
          <input
            type="text"
            id="cta-title"
            value={ctaTitle}
            onChange={(e) => setCTATitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Ready to Get Started?"
          />
        </div>

        <div>
          <label htmlFor="cta-message" className="block text-sm font-medium text-gray-700 mb-2">
            CTA Message
          </label>
          <textarea
            id="cta-message"
            value={ctaMessage}
            onChange={(e) => setCTAMessage(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Start your free trial today and see the difference!"
          />
        </div>

        <div>
          <label htmlFor="cta-button-text" className="block text-sm font-medium text-gray-700 mb-2">
            Primary Button Text
          </label>
          <input
            type="text"
            id="cta-button-text"
            value={ctaButtonText}
            onChange={(e) => setCTAButtonText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Start Free Trial"
          />
        </div>

        <div>
          <label htmlFor="cta-button-url" className="block text-sm font-medium text-gray-700 mb-2">
            Primary Button URL
          </label>
          <input
            type="url"
            id="cta-button-url"
            value={ctaButtonUrl}
            onChange={(e) => setCTAButtonUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="https://yourapp.com/signup"
          />
        </div>

        <div className="pt-4">
          <button
            onClick={onSaveCTA}
            className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Save CTA Settings
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">CTA Preview</h3>
        <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-lg p-6 text-white">
          <div className="flex items-center mb-4">
            <div className="text-2xl mr-3">✅</div>
            <div>
              <h4 className="text-xl font-bold">{ctaTitle || 'Ready to Get Started?'}</h4>
              <p className="text-green-100">{ctaMessage || 'Start your free trial today and see the difference!'}</p>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <button className="px-6 py-3 bg-white text-green-600 font-semibold rounded-lg">
              {ctaButtonText || 'Start Free Trial'}
            </button>
            <button className="px-6 py-3 border-2 border-white text-white font-semibold rounded-lg">
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">How CTA Works</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• The AI agent will automatically show this CTA when it determines a user is ready to take action</li>
          <li>• Users can also explicitly ask for next steps or how to sign up</li>
          <li>• The CTA appears in the demo experience page alongside the conversation</li>
          <li>• Make sure your button URL leads to a working signup or contact page</li>
        </ul>
      </div>
    </div>
  );
};
