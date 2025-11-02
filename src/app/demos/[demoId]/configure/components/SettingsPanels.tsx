import * as Tabs from '@radix-ui/react-tabs';
import {VideoManagement} from './VideoManagement';
import {KnowledgeBaseManagement} from './KnowledgeBaseManagement';
import {AgentSettings} from './AgentSettings';
import {CTASettings} from './CTASettings';
import {AdminCTAUrlEditor} from './AdminCTAUrlEditor';
import {Reporting} from './Reporting';
import {Demo, DemoVideo, KnowledgeChunk, ProcessingStatus} from '../types';
import {UIState} from '@/lib/tavus';

interface SettingsPanelsProps {
  initialTab: string;
  demo: Demo | null;
  uiState: UIState;
  demoVideos: DemoVideo[];
  knowledgeChunks: KnowledgeChunk[];
  selectedVideoFile: File | null;
  setSelectedVideoFile: (file: File | null) => void;
  videoTitle: string;
  setVideoTitle: (title: string) => void;
  handleVideoUpload: () => Promise<void>;
  handlePreviewVideo: (video: DemoVideo) => void;
  handleDeleteVideo: (videoId: string) => Promise<void>;
  processingStatus: ProcessingStatus;
  previewVideoUrl: string | null;
  setPreviewVideoUrl: (url: string | null) => void;
  newQuestion: string;
  setNewQuestion: (question: string) => void;
  newAnswer: string;
  setNewAnswer: (answer: string) => void;
  handleAddQAPair: () => Promise<void>;
  handleDeleteKnowledgeChunk: (chunkId: string) => Promise<void>;
  knowledgeDoc: File | null;
  setKnowledgeDoc: (doc: File | null) => void;
  handleKnowledgeDocUpload: () => Promise<void>;
  agentName: string;
  setAgentName: (name: string) => void;
  agentPersonality: string;
  setAgentPersonality: (personality: string) => void;
  agentGreeting: string;
  setAgentGreeting: (greeting: string) => void;
  objectives: string[];
  setObjectives: (objectives: string[]) => void;
  ctaTitle: string;
  setCTATitle: (title: string) => void;
  ctaMessage: string;
  setCTAMessage: (message: string) => void;
  ctaButtonText: string;
  setCTAButtonText: (text: string) => void;
  onSaveCTA: () => Promise<void>;
  handleSaveAdminCTAUrl: (url: string) => Promise<void>;
}

export function SettingsPanels({
  initialTab,
  demo,
  uiState,
  demoVideos,
  knowledgeChunks,
  selectedVideoFile,
  setSelectedVideoFile,
  videoTitle,
  setVideoTitle,
  handleVideoUpload,
  handlePreviewVideo,
  handleDeleteVideo,
  processingStatus,
  previewVideoUrl,
  setPreviewVideoUrl,
  newQuestion,
  setNewQuestion,
  newAnswer,
  setNewAnswer,
  handleAddQAPair,
  handleDeleteKnowledgeChunk,
  knowledgeDoc,
  setKnowledgeDoc,
  handleKnowledgeDocUpload,
  agentName,
  setAgentName,
  agentPersonality,
  setAgentPersonality,
  agentGreeting,
  setAgentGreeting,
  objectives,
  setObjectives,
  ctaTitle,
  setCTATitle,
  ctaMessage,
  setCTAMessage,
  ctaButtonText,
  setCTAButtonText,
  onSaveCTA,
  handleSaveAdminCTAUrl,
}: SettingsPanelsProps) {
  return (
    <Tabs.Root defaultValue={initialTab}>
      <Tabs.List className="border-b border-gray-200">
        <Tabs.Trigger value="videos" className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-500">
          Videos
        </Tabs.Trigger>
        <Tabs.Trigger value="knowledge" className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-500">
          Knowledge Base
        </Tabs.Trigger>
        <Tabs.Trigger value="agent" className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-500">
          Agent Settings
        </Tabs.Trigger>
        <Tabs.Trigger value="cta" className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-500">
          Call-to-Action
        </Tabs.Trigger>
        <Tabs.Trigger value="reporting" className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-500">
          Reporting
        </Tabs.Trigger>
      </Tabs.List>
      
      <div className="mt-6">
        <Tabs.Content value="videos">
          <VideoManagement 
            demoVideos={demoVideos}
            selectedVideoFile={selectedVideoFile}
            setSelectedVideoFile={setSelectedVideoFile}
            videoTitle={videoTitle}
            setVideoTitle={setVideoTitle}
            handleVideoUpload={handleVideoUpload}
            handlePreviewVideo={handlePreviewVideo}
            handleDeleteVideo={handleDeleteVideo}
            processingStatus={processingStatus}
            previewVideoUrl={previewVideoUrl}
            setPreviewVideoUrl={setPreviewVideoUrl}
          />
        </Tabs.Content>
        
        <Tabs.Content value="knowledge">
          <KnowledgeBaseManagement 
            knowledgeChunks={knowledgeChunks}
            newQuestion={newQuestion}
            setNewQuestion={setNewQuestion}
            newAnswer={newAnswer}
            setNewAnswer={setNewAnswer}
            handleAddQAPair={handleAddQAPair}
            handleDeleteKnowledgeChunk={handleDeleteKnowledgeChunk}
            knowledgeDoc={knowledgeDoc}
            setKnowledgeDoc={setKnowledgeDoc}
            handleKnowledgeDocUpload={handleKnowledgeDocUpload}
          />
        </Tabs.Content>
        
        <Tabs.Content value="agent">
          <AgentSettings 
            demo={demo}
            agentName={agentName}
            setAgentName={setAgentName}
            agentPersonality={agentPersonality}
            setAgentPersonality={setAgentPersonality}
            agentGreeting={agentGreeting}
            setAgentGreeting={setAgentGreeting}
            objectives={objectives}
            setObjectives={setObjectives}
          />
          <div className="mt-6">
            {demo?.tavus_persona_id ? (
              <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                <p className="font-bold">✅ Agent Configured!</p>
                <p>Persona ID: {demo.tavus_persona_id}</p>
                <p className="text-sm mt-2">Your agent is ready to use. Go to the <strong>Experience</strong> tab to test it!</p>
              </div>
            ) : (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded">
                <p className="font-medium">🤖 Agent Not Configured</p>
                <p className="text-sm mt-1">Use the "Create Agent" button above to configure your Domo agent with system prompt, guardrails, and objectives.</p>
              </div>
            )}
          </div>
          {uiState === UIState.SERVICE_ERROR && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <p>An error occurred. Please check the console for details.</p>
            </div>
          )}
        </Tabs.Content>
        
        <Tabs.Content value="cta">
          <div className="space-y-6">
            <AdminCTAUrlEditor
              currentUrl={demo?.cta_button_url || null}
              onSave={handleSaveAdminCTAUrl}
            />
            <CTASettings
              demo={demo}
              ctaTitle={ctaTitle}
              setCTATitle={setCTATitle}
              ctaMessage={ctaMessage}
              setCTAMessage={setCTAMessage}
              ctaButtonText={ctaButtonText}
              setCTAButtonText={setCTAButtonText}
              onSaveCTA={onSaveCTA}
            />
          </div>
        </Tabs.Content>
        
        <Tabs.Content value="reporting">
          <Reporting demo={demo} />
        </Tabs.Content>
      </div>
    </Tabs.Root>
  );
}