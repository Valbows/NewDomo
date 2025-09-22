'use client';

import React, { useState } from 'react';
import { X, Play, CheckCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGetStarted: () => void;
  demoName: string;
}

export default function WelcomeModal({ isOpen, onClose, onGetStarted, demoName }: WelcomeModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl max-w-2xl w-full p-8 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Welcome Content */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Play className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              👋 Welcome to Domo AI!
            </h1>
            
            <p className="text-lg text-gray-600 mb-6">
              Let's set up your interactive demo: <strong>"{demoName}"</strong>
            </p>

            <p className="text-gray-500 mb-8">
              We'll guide you through a simple 4-step process to create an amazing AI-powered demo experience.
            </p>
          </div>

          {/* Process Steps Preview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { step: 1, title: 'Upload Video', icon: '🎥', color: 'bg-blue-100 text-blue-600' },
              { step: 2, title: 'Knowledge Base', icon: '📚', color: 'bg-green-100 text-green-600' },
              { step: 3, title: 'Call-to-Action', icon: '🎯', color: 'bg-orange-100 text-orange-600' },
              { step: 4, title: 'Agent Settings', icon: '🤖', color: 'bg-purple-100 text-purple-600' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className={`w-16 h-16 rounded-full ${item.color} flex items-center justify-center mx-auto mb-3`}>
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Step {item.step}</h3>
                <p className="text-xs text-gray-500">{item.title}</p>
              </div>
            ))}
          </div>

          {/* Features List */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What you'll create:</h3>
            <div className="space-y-3">
              {[
                'Interactive AI agent powered by your content',
                'Personalized demo experiences for each visitor',
                'Intelligent conversation flows and responses',
                'Conversion-optimized call-to-action sequences',
              ].map((feature, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Skip for now
            </button>
            <button
              onClick={onGetStarted}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center font-semibold"
            >
              Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>

          {/* Time Estimate */}
          <p className="text-center text-sm text-gray-500 mt-4">
            ⏱️ Takes about 5-10 minutes to complete
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
