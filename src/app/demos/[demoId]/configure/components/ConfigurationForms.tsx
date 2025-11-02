import {VideoManagement} from './VideoManagement';
import {KnowledgeBaseManagement} from './KnowledgeBaseManagement';
import {AgentSettings} from './AgentSettings';
import {CTASettings} from './CTASettings';
import {AdminCTAUrlEditor} from './AdminCTAUrlEditor';
import {Reporting} from './Reporting';
import {Demo, DemoVideo, KnowledgeChunk, ProcessingStatus} from '../types';

interface ConfigurationFormsProps {
  demo: Demo | null;
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

export function ConfigurationForms({
  demo,
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
}: ConfigurationFormsProps) {
  return (
    <>
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
      
      <Reporting demo={demo} />
    </>
  );
}