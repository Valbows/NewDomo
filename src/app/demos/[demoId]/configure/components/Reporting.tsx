import { Demo } from '@/app/demos/[demoId]/configure/types';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, RefreshCw, Calendar, Clock, MessageSquare, BarChart3, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import RavenDebugPanel from '@/components/RavenDebugPanel';

interface ReportingProps {
  demo: Demo | null;
}

interface ConversationDetail {
  id: string;
  tavus_conversation_id: string;
  conversation_name: string;
  transcript: any;
  perception_analysis: any;
  started_at: string;
  completed_at: string;
  duration_seconds: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface TranscriptEntry {
  timestamp: number;
  speaker: string;
  text: string;
}

interface PerceptionMetrics {
  overall_score: number;
  engagement_score: number;
  sentiment_score: number;
  comprehension_score: number;
  interest_level: string;
  key_insights: string[];
}

function formatDate(iso?: string) {
  try {
    return iso ? new Date(iso).toLocaleString() : '—';
  } catch {
    return '—';
  }
}

function SafeJSON({ value }: { value: any }) {
  return (
    <pre className="text-xs bg-gray-50 rounded p-3 overflow-auto max-h-64 border border-gray-200">
      {JSON.stringify(value ?? {}, null, 2)}
    </pre>
  );
}

export const Reporting = ({ demo }: ReportingProps) => {
  const [conversationDetails, setConversationDetails] = useState<ConversationDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedConversation, setExpandedConversation] = useState<string | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Legacy analytics from metadata (keep for backward compatibility)
  const analytics = demo?.metadata?.analytics as
    | { last_updated?: string; conversations?: Record<string, any>; last_perception_event?: any }
    | undefined;

  const legacyConversations = analytics?.conversations || {};
  const legacyConversationIds = Object.keys(legacyConversations);

  // Fetch detailed conversation data from our new table
  const fetchConversationDetails = useCallback(async () => {
    if (!demo?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('conversation_details')
        .select('*')
        .eq('demo_id', demo.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      setConversationDetails(data || []);
    } catch (err) {
      console.error('Failed to fetch conversation details:', err);
      setError('Failed to load conversation details');
    } finally {
      setLoading(false);
    }
  }, [demo?.id]);

  // Sync conversations from Tavus
  const syncConversations = async () => {
    if (!demo?.id) return;
    
    setSyncing(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/sync-tavus-conversations?demoId=${demo.id}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to sync conversations');
      }
      
      const result = await response.json();
      console.log('Sync result:', result);
      console.log(`📊 Synced conversations with data:`, result.results?.map((r: any) => ({
        conversation_id: r.conversation_id,
        has_transcript: r.has_transcript,
        has_perception: r.has_perception
      })));
      
      // Refresh the conversation details to show new data immediately
      await fetchConversationDetails();
      
      // Show success message with details about what was synced
      const syncedCount = result.results?.length || 0;
      const hasTranscript = result.results?.some((r: any) => r.has_transcript) || false;
      const hasPerception = result.results?.some((r: any) => r.has_perception) || false;
      
      console.log(`✅ Sync completed: ${syncedCount} conversations, transcript: ${hasTranscript}, perception: ${hasPerception}`);
    } catch (err) {
      console.error('Failed to sync conversations:', err);
      setError('Failed to sync conversations from Tavus');
    } finally {
      setSyncing(false);
    }
  };

  // Load conversation details on component mount
  useEffect(() => {
    fetchConversationDetails();
  }, [fetchConversationDetails]);

  const formatDuration = (seconds: number) => {
    if (!seconds) return '—';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderTranscript = (transcript: any) => {
    if (!transcript) {
      return <div className="text-sm text-gray-500">No transcript available</div>;
    }

    // Handle different transcript formats from Tavus
    if (Array.isArray(transcript)) {
      return (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {transcript.map((entry: any, index: number) => {
            // Handle different entry formats
            const speaker = entry.speaker || entry.role || 'Unknown';
            const text = entry.text || entry.content || String(entry);
            const timestamp = entry.timestamp || entry.created_at || null;
            
            return (
              <div key={index} className="flex gap-3 p-2 rounded bg-gray-50">
                {timestamp && (
                  <div className="text-xs text-gray-500 font-mono whitespace-nowrap">
                    {new Date(timestamp * 1000).toLocaleTimeString()}
                  </div>
                )}
                <div className="text-xs font-medium text-gray-700 capitalize">{speaker}:</div>
                <div className="text-sm text-gray-800 flex-1 whitespace-pre-wrap">
                  {text.length > 200 ? `${text.substring(0, 200)}...` : text}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    
    // If transcript is a string or other format, display it as-is
    return (
      <div className="text-sm text-gray-800 bg-gray-50 rounded p-4 max-h-64 overflow-y-auto whitespace-pre-wrap">
        {String(transcript)}
      </div>
    );
  };

  const renderPerceptionAnalysis = (perception: any) => {
    if (!perception) {
      return <div className="text-sm text-gray-500">No perception analysis available</div>;
    }

    // If perception is structured metrics object
    if (typeof perception === 'object' && !Array.isArray(perception) && perception.overall_score) {
      const metrics = perception as PerceptionMetrics;
      
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-xs text-blue-600 font-medium">Overall Score</div>
              <div className="text-lg font-bold text-blue-800">
                {metrics.overall_score ? `${Math.round(metrics.overall_score * 100)}%` : '—'}
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="text-xs text-green-600 font-medium">Engagement</div>
              <div className="text-lg font-bold text-green-800">
                {metrics.engagement_score ? `${Math.round(metrics.engagement_score * 100)}%` : '—'}
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <div className="text-xs text-purple-600 font-medium">Sentiment</div>
              <div className="text-lg font-bold text-purple-800">
                {metrics.sentiment_score ? `${Math.round(metrics.sentiment_score * 100)}%` : '—'}
              </div>
            </div>
            <div className="bg-orange-50 p-3 rounded">
              <div className="text-xs text-orange-600 font-medium">Interest Level</div>
              <div className="text-sm font-bold text-orange-800 capitalize">
                {metrics.interest_level || '—'}
              </div>
            </div>
          </div>
          
          {metrics.key_insights && metrics.key_insights.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Key Insights</div>
              <ul className="space-y-1">
                {metrics.key_insights.map((insight, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }
    
    // If perception is a text analysis (like from Tavus), display it nicely
    if (typeof perception === 'string') {
      return (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-100">
            <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <span className="text-blue-600">🧠</span>
              Visual & Behavioral Analysis
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
              {perception}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-xs text-blue-600 font-medium">Analysis Type</div>
              <div className="text-sm font-bold text-blue-800">Visual Perception</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="text-xs text-green-600 font-medium">Duration</div>
              <div className="text-sm font-bold text-green-800">60 minutes</div>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <div className="text-xs text-purple-600 font-medium">Data Source</div>
              <div className="text-sm font-bold text-purple-800">Tavus AI</div>
            </div>
            <div className="bg-orange-50 p-3 rounded">
              <div className="text-xs text-orange-600 font-medium">Status</div>
              <div className="text-sm font-bold text-orange-800">Complete</div>
            </div>
          </div>
        </div>
      );
    }
    
    // Fallback for other formats
    return (
      <div className="text-sm text-gray-800 bg-gray-50 rounded p-4 max-h-64 overflow-y-auto whitespace-pre-wrap">
        {JSON.stringify(perception, null, 2)}
      </div>
    );
  };

  const totalConversations = conversationDetails.length + legacyConversationIds.length;
  const completedConversations = conversationDetails.filter(c => c.status === 'completed').length;
  const averageDuration = conversationDetails.length > 0 
    ? conversationDetails.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / conversationDetails.length 
    : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Reporting & Analytics</h2>
          <p className="text-gray-600 mt-1">
            View detailed conversation transcripts and perception analysis from Tavus.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            <Settings className="w-4 h-4 mr-2" />
            Debug Raven-0
          </button>
          <button
            onClick={syncConversations}
            disabled={syncing || !demo?.tavus_conversation_id}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {syncing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {syncing ? 'Syncing...' : 'Sync from Tavus'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {showDebugPanel && (
        <div className="mb-6">
          <RavenDebugPanel demoId={demo?.id} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <MessageSquare className="w-4 h-4" />
            <span>Total Conversations</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalConversations}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Completed</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{completedConversations}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Clock className="w-4 h-4" />
            <span>Avg Duration</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{formatDuration(Math.round(averageDuration))}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Calendar className="w-4 h-4" />
            <span>Last Updated</span>
          </div>
          <div className="text-sm font-medium text-gray-900">{formatDate(analytics?.last_updated)}</div>
        </div>
      </div>

      {/* Detailed Conversation List */}
      <div className="bg-white rounded-lg shadow border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Conversation Details</h3>
          <p className="text-sm text-gray-600 mt-1">Detailed transcripts and perception analysis from Tavus conversations.</p>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-600" />
            <div className="text-gray-600">Loading conversation details...</div>
          </div>
        ) : conversationDetails.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <div className="text-gray-600 mb-2">No detailed conversations found</div>
            <div className="text-sm text-gray-500">
              {demo?.tavus_conversation_id 
                ? 'Click "Sync from Tavus" to fetch conversation data'
                : 'Start a demo conversation to see analytics here'
              }
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {conversationDetails.map((conversation) => (
              <div key={conversation.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900">{conversation.conversation_name}</h4>
                      <div className="text-sm text-gray-500">
                        ID: {conversation.tavus_conversation_id}
                      </div>
                    </div>
                    <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                      conversation.status === 'completed' ? 'bg-green-100 text-green-800' :
                      conversation.status === 'active' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {conversation.status}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {conversation.duration_seconds && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDuration(conversation.duration_seconds)}
                      </div>
                    )}
                    {conversation.completed_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(conversation.completed_at)}
                      </div>
                    )}
                    <button
                      onClick={() => setExpandedConversation(
                        expandedConversation === conversation.id ? null : conversation.id
                      )}
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
                    >
                      {expandedConversation === conversation.id ? (
                        <><ChevronUp className="w-4 h-4" /> Collapse</>
                      ) : (
                        <><ChevronDown className="w-4 h-4" /> Expand</>
                      )}
                    </button>
                  </div>
                </div>
                
                {expandedConversation === conversation.id && (
                  <div className="space-y-6">
                    {/* Perception Analysis */}
                    {conversation.perception_analysis && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-3">Perception Analysis</h5>
                        {renderPerceptionAnalysis(conversation.perception_analysis)}
                      </div>
                    )}
                    
                    {/* Transcript */}
                    {conversation.transcript && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-3">Conversation Transcript</h5>
                        {renderTranscript(conversation.transcript)}
                      </div>
                    )}
                    
                    {!conversation.perception_analysis && !conversation.transcript && (
                      <div className="text-sm text-gray-500 bg-gray-50 rounded p-4">
                        No detailed data available for this conversation. Try syncing again later.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legacy Analytics (backward compatibility) */}
      {legacyConversationIds.length > 0 && (
      <div className="mt-6 bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-lg font-semibold mb-3">Legacy Analytics</h3>
          <div className="space-y-4">
            {legacyConversationIds.map((cid) => {
              const item = legacyConversations[cid] || {};
              return (
                <div key={cid} className="border rounded-md">
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
                    <div className="text-xs font-mono truncate">{cid}</div>
                    <div className="text-xs text-gray-500">Updated {formatDate(item?.updated_at)}</div>
                  </div>
                  <div className="p-4">
                    {item?.perception ? (
                      <>
                        <div className="text-sm font-medium mb-2">Perception Snapshot</div>
                        <SafeJSON value={item.perception} />
                      </>
                    ) : (
                      <div className="text-sm text-gray-500">No perception data.</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        )}

      <div className="mt-6 text-xs text-gray-500">
        <p className="mb-1 font-medium">Privacy Notice</p>
        <p>
          Analytics data is stored in `demo.metadata.analytics` with PII redaction. Do not store user names, emails, phone
          numbers, full transcripts, or raw audio. This view is for insights and compliance.
        </p>
      </div>
    </div>
  );
};
