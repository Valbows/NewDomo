'use client';

import React, { useState, useEffect } from 'react';
import { Check, ArrowRight, ArrowLeft, Video, BookOpen, Target, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WelcomeModal from './WelcomeModal';

interface OnboardingFlowProps {
  demoId: string;
  demo: any;
  demoVideos: any[];
  knowledgeChunks: any[];
  onStepComplete: (step: number) => void;
  onVideoUpload: () => void;
  onKnowledgeAdd: () => void;
  onCTASave: () => void;
  onAgentCreate: () => void;
  // Pass through all the existing props and handlers
  selectedVideoFile: File | null;
  setSelectedVideoFile: (file: File | null) => void;
  videoTitle: string;
  setVideoTitle: (title: string) => void;
  handleVideoUpload: () => void;
  processingStatus: any;
  newQuestion: string;
  setNewQuestion: (q: string) => void;
  newAnswer: string;
  setNewAnswer: (a: string) => void;
  handleAddQAPair: () => void;
  knowledgeDoc: File | null;
  setKnowledgeDoc: (doc: File | null) => void;
  handleKnowledgeDocUpload: () => void;
  ctaTitle: string;
  setCTATitle: (title: string) => void;
  ctaMessage: string;
  setCTAMessage: (message: string) => void;
  ctaButtonText: string;
  setCTAButtonText: (text: string) => void;
  handleSaveCTA: () => void;
  agentName: string;
  setAgentName: (name: string) => void;
  agentPersonality: string;
  setAgentPersonality: (personality: string) => void;
  agentGreeting: string;
  setAgentGreeting: (greeting: string) => void;
  objectives: string[];
  setObjectives: (objectives: string[]) => void;
  createTavusAgent: () => void;
}

const steps = [
  {
    id: 1,
    title: 'Upload Video',
    description: 'Add your demo video content',
    icon: Video,
    color: 'bg-blue-500',
  },
  {
    id: 2,
    title: 'Knowledge Base',
    description: 'Configure your AI knowledge',
    icon: BookOpen,
    color: 'bg-green-500',
  },
  {
    id: 3,
    title: 'Call-to-Action',
    description: 'Set up your conversion goals',
    icon: Target,
    color: 'bg-orange-500',
  },
  {
    id: 4,
    title: 'Agent Settings',
    description: 'Configure your AI agent',
    icon: Bot,
    color: 'bg-purple-500',
  },
];

export default function OnboardingFlow({
  demoId,
  demo,
  demoVideos,
  knowledgeChunks,
  onStepComplete,
  selectedVideoFile,
  setSelectedVideoFile,
  videoTitle,
  setVideoTitle,
  handleVideoUpload,
  processingStatus,
  newQuestion,
  setNewQuestion,
  newAnswer,
  setNewAnswer,
  handleAddQAPair,
  knowledgeDoc,
  setKnowledgeDoc,
  handleKnowledgeDocUpload,
  ctaTitle,
  setCTATitle,
  ctaMessage,
  setCTAMessage,
  ctaButtonText,
  setCTAButtonText,
  handleSaveCTA,
  agentName,
  setAgentName,
  agentPersonality,
  setAgentPersonality,
  agentGreeting,
  setAgentGreeting,
  objectives,
  setObjectives,
  createTavusAgent,
}: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showWelcome, setShowWelcome] = useState(true);

  // Check completion status for each step
  const getStepCompletionStatus = () => {
    const completed = new Set<number>();
    
    // Step 1: Video uploaded
    if (demoVideos && demoVideos.length > 0) {
      completed.add(1);
    }
    
    // Step 2: Knowledge base has content
    if (knowledgeChunks && knowledgeChunks.length > 0) {
      completed.add(2);
    }
    
    // Step 3: CTA is configured (check if default values have been changed)
    if (ctaTitle && ctaMessage && ctaButtonText) {
      completed.add(3);
    }
    
    // Step 4: Agent is created
    if (demo?.tavus_persona_id) {
      completed.add(4);
    }
    
    return completed;
  };

  useEffect(() => {
    setCompletedSteps(getStepCompletionStatus());
  }, [demoVideos, knowledgeChunks, ctaTitle, ctaMessage, ctaButtonText, demo?.tavus_persona_id]);

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepNumber: number) => {
    setCurrentStep(stepNumber);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <VideoUploadStep
            selectedVideoFile={selectedVideoFile}
            setSelectedVideoFile={setSelectedVideoFile}
            videoTitle={videoTitle}
            setVideoTitle={setVideoTitle}
            handleVideoUpload={handleVideoUpload}
            processingStatus={processingStatus}
            demoVideos={demoVideos}
            isCompleted={completedSteps.has(1)}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <KnowledgeBaseStep
            newQuestion={newQuestion}
            setNewQuestion={setNewQuestion}
            newAnswer={newAnswer}
            setNewAnswer={setNewAnswer}
            handleAddQAPair={handleAddQAPair}
            knowledgeDoc={knowledgeDoc}
            setKnowledgeDoc={setKnowledgeDoc}
            handleKnowledgeDocUpload={handleKnowledgeDocUpload}
            knowledgeChunks={knowledgeChunks}
            isCompleted={completedSteps.has(2)}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <CTAStep
            ctaTitle={ctaTitle}
            setCTATitle={setCTATitle}
            ctaMessage={ctaMessage}
            setCTAMessage={setCTAMessage}
            ctaButtonText={ctaButtonText}
            setCTAButtonText={setCTAButtonText}
            handleSaveCTA={handleSaveCTA}
            isCompleted={completedSteps.has(3)}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 4:
        return (
          <AgentSettingsStep
            agentName={agentName}
            setAgentName={setAgentName}
            agentPersonality={agentPersonality}
            setAgentPersonality={setAgentPersonality}
            agentGreeting={agentGreeting}
            setAgentGreeting={setAgentGreeting}
            objectives={objectives}
            setObjectives={setObjectives}
            createTavusAgent={createTavusAgent}
            demo={demo}
            isCompleted={completedSteps.has(4)}
            onPrevious={handlePrevious}
            demoId={demoId}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <WelcomeModal
        isOpen={showWelcome}
        onClose={() => setShowWelcome(false)}
        onGetStarted={() => setShowWelcome(false)}
        demoName={demo?.name || 'Your Demo'}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Progress Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Configure Your Demo
            </h1>
            <p className="text-gray-600">
              Follow these steps to set up your interactive AI demo
            </p>
          </div>
          
          {/* Step Progress Indicator */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.has(step.id);
              const isCurrent = currentStep === step.id;
              const isPast = step.id < currentStep;
              
              return (
                <React.Fragment key={step.id}>
                  <div 
                    className="flex flex-col items-center cursor-pointer group"
                    onClick={() => handleStepClick(step.id)}
                  >
                    <div className="relative">
                      <motion.div
                        className={`
                          w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold
                          transition-all duration-300 group-hover:scale-110
                          ${isCompleted 
                            ? 'bg-green-500 shadow-lg shadow-green-200' 
                            : isCurrent 
                              ? `${step.color} shadow-lg` 
                              : 'bg-gray-300'
                          }
                        `}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isCompleted ? (
                          <Check className="w-6 h-6" />
                        ) : (
                          <step.icon className="w-6 h-6" />
                        )}
                      </motion.div>
                      
                      {isCurrent && (
                        <motion.div
                          className="absolute -inset-1 rounded-full border-2 border-blue-400"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1.2, opacity: 1 }}
                          transition={{ duration: 0.5 }}
                        />
                      )}
                    </div>
                    
                    <div className="text-center mt-3">
                      <p className={`text-sm font-medium ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className="flex-1 mx-4">
                      <div className={`h-0.5 ${isCompleted || isPast ? 'bg-green-500' : 'bg-gray-300'} transition-colors duration-300`} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
    </>
  );
}

// Individual Step Components
interface StepProps {
  isCompleted: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
}

// Video Upload Step Component
interface VideoUploadStepProps extends StepProps {
  selectedVideoFile: File | null;
  setSelectedVideoFile: (file: File | null) => void;
  videoTitle: string;
  setVideoTitle: (title: string) => void;
  handleVideoUpload: () => void;
  processingStatus: any;
  demoVideos: any[];
}

function VideoUploadStep({
  selectedVideoFile,
  setSelectedVideoFile,
  videoTitle,
  setVideoTitle,
  handleVideoUpload,
  processingStatus,
  demoVideos,
  isCompleted,
  onNext,
}: VideoUploadStepProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="text-center mb-8">
        <Video className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Demo Video</h2>
        <p className="text-gray-600">Add the video content that your AI agent will present</p>
      </div>

      <div className="space-y-6">
        {/* Video Upload Form */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="space-y-4">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setSelectedVideoFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              
              {selectedVideoFile && (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Video Title"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <button
                    onClick={handleVideoUpload}
                    disabled={!selectedVideoFile || !videoTitle || processingStatus.stage === 'uploading'}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    {processingStatus.stage === 'uploading' ? 'Uploading...' : 'Upload Video'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Processing Status */}
        {processingStatus.stage !== 'idle' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-800">{processingStatus.message}</span>
            </div>
          </div>
        )}

        {/* Uploaded Videos */}
        {demoVideos.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Uploaded Videos</h3>
            <div className="grid gap-4">
              {demoVideos.map((video) => (
                <div key={video.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{video.title}</h4>
                    <p className="text-sm text-gray-500">Status: {video.processing_status}</p>
                  </div>
                  <Check className="w-5 h-5 text-green-500" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Button */}
        {isCompleted && (
          <div className="flex justify-end pt-6 border-t">
            <button
              onClick={onNext}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Next: Knowledge Base
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Knowledge Base Step Component
interface KnowledgeBaseStepProps extends StepProps {
  newQuestion: string;
  setNewQuestion: (q: string) => void;
  newAnswer: string;
  setNewAnswer: (a: string) => void;
  handleAddQAPair: () => void;
  knowledgeDoc: File | null;
  setKnowledgeDoc: (doc: File | null) => void;
  handleKnowledgeDocUpload: () => void;
  knowledgeChunks: any[];
}

function KnowledgeBaseStep({
  newQuestion,
  setNewQuestion,
  newAnswer,
  setNewAnswer,
  handleAddQAPair,
  knowledgeDoc,
  setKnowledgeDoc,
  handleKnowledgeDocUpload,
  knowledgeChunks,
  isCompleted,
  onNext,
  onPrevious,
}: KnowledgeBaseStepProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="text-center mb-8">
        <BookOpen className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Build Your Knowledge Base</h2>
        <p className="text-gray-600">Add Q&A pairs and documents to train your AI agent</p>
      </div>

      <div className="space-y-8">
        {/* Q&A Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Add Q&A Pairs</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <textarea
              placeholder="Enter a question..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 h-24"
            />
            <textarea
              placeholder="Enter the answer..."
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 h-24"
            />
          </div>
          <button
            onClick={handleAddQAPair}
            disabled={!newQuestion.trim() || !newAnswer.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            Add Q&A Pair
          </button>
        </div>

        {/* Document Upload */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Upload Documents</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <input
              type="file"
              accept=".txt,.pdf,.doc,.docx"
              onChange={(e) => setKnowledgeDoc(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
            {knowledgeDoc && (
              <button
                onClick={handleKnowledgeDocUpload}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Upload Document
              </button>
            )}
          </div>
        </div>

        {/* Knowledge Chunks List */}
        {knowledgeChunks.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Knowledge Base Content</h3>
            <div className="grid gap-4 max-h-60 overflow-y-auto">
              {knowledgeChunks.map((chunk) => (
                <div key={chunk.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 line-clamp-3">{chunk.content}</p>
                      <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {chunk.chunk_type}
                      </span>
                    </div>
                    <Check className="w-5 h-5 text-green-500 ml-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t">
          <button
            onClick={onPrevious}
            className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Previous: Video
          </button>
          
          {isCompleted && (
            <button
              onClick={onNext}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Next: Call-to-Action
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// CTA Step Component
interface CTAStepProps extends StepProps {
  ctaTitle: string;
  setCTATitle: (title: string) => void;
  ctaMessage: string;
  setCTAMessage: (message: string) => void;
  ctaButtonText: string;
  setCTAButtonText: (text: string) => void;
  handleSaveCTA: () => void;
}

function CTAStep({
  ctaTitle,
  setCTATitle,
  ctaMessage,
  setCTAMessage,
  ctaButtonText,
  setCTAButtonText,
  handleSaveCTA,
  isCompleted,
  onNext,
  onPrevious,
}: CTAStepProps) {
  const handleSave = async () => {
    await handleSaveCTA();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="text-center mb-8">
        <Target className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Configure Call-to-Action</h2>
        <p className="text-gray-600">Set up what happens when users complete your demo</p>
      </div>

      <div className="space-y-6">
        {/* CTA Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CTA Title
            </label>
            <input
              type="text"
              value={ctaTitle}
              onChange={(e) => setCTATitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Ready to Get Started?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CTA Message
            </label>
            <textarea
              value={ctaMessage}
              onChange={(e) => setCTAMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 h-24"
              placeholder="Start your free trial today and see the difference!"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Button Text
            </label>
            <input
              type="text"
              value={ctaButtonText}
              onChange={(e) => setCTAButtonText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Start Free Trial"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
          <div className="bg-white rounded-lg p-6 text-center border">
            <h4 className="text-xl font-bold text-gray-900 mb-2">{ctaTitle || 'Ready to Get Started?'}</h4>
            <p className="text-gray-600 mb-4">{ctaMessage || 'Start your free trial today and see the difference!'}</p>
            <button className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors">
              {ctaButtonText || 'Start Free Trial'}
            </button>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
        >
          Save CTA Settings
        </button>

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t">
          <button
            onClick={onPrevious}
            className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Previous: Knowledge Base
          </button>
          
          {isCompleted && (
            <button
              onClick={onNext}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Next: Agent Settings
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Agent Settings Step Component
interface AgentSettingsStepProps extends StepProps {
  agentName: string;
  setAgentName: (name: string) => void;
  agentPersonality: string;
  setAgentPersonality: (personality: string) => void;
  agentGreeting: string;
  setAgentGreeting: (greeting: string) => void;
  objectives: string[];
  setObjectives: (objectives: string[]) => void;
  createTavusAgent: () => void;
  demo: any;
  demoId: string;
}

function AgentSettingsStep({
  agentName,
  setAgentName,
  agentPersonality,
  setAgentPersonality,
  agentGreeting,
  setAgentGreeting,
  objectives,
  setObjectives,
  createTavusAgent,
  demo,
  isCompleted,
  onPrevious,
  demoId,
}: AgentSettingsStepProps) {
  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...objectives];
    newObjectives[index] = value;
    setObjectives(newObjectives);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="text-center mb-8">
        <Bot className="w-16 h-16 text-purple-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Configure Your AI Agent</h2>
        <p className="text-gray-600">Set up your agent's personality and objectives</p>
      </div>

      <div className="space-y-6">
        {/* Agent Configuration */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agent Name
            </label>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Demo Assistant"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agent Personality
            </label>
            <textarea
              value={agentPersonality}
              onChange={(e) => setAgentPersonality(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 h-24"
              placeholder="Friendly and helpful assistant..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agent Greeting
            </label>
            <textarea
              value={agentGreeting}
              onChange={(e) => setAgentGreeting(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 h-20"
              placeholder="Hello! How can I help you with the demo today?"
            />
          </div>
        </div>

        {/* Objectives */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Demo Objectives (Optional)
          </label>
          {objectives.map((objective, index) => (
            <input
              key={index}
              type="text"
              value={objective}
              onChange={(e) => handleObjectiveChange(index, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder={`Objective ${index + 1}`}
            />
          ))}
        </div>

        {/* Agent Status */}
        {demo?.tavus_persona_id ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-3" />
              <div>
                <p className="font-medium text-green-800">Agent Successfully Created!</p>
                <p className="text-sm text-green-600">Persona ID: {demo.tavus_persona_id}</p>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={createTavusAgent}
            className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
          >
            Create AI Agent
          </button>
        )}

        {/* Final Navigation */}
        <div className="flex justify-between pt-6 border-t">
          <button
            onClick={onPrevious}
            className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Previous: Call-to-Action
          </button>
          
          {isCompleted && (
            <a
              href={`/demos/${demoId}/experience`}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Launch Demo Experience
              <ArrowRight className="w-5 h-5 ml-2" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
