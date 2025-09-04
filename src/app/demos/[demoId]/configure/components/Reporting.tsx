import { Demo } from '@/app/demos/[demoId]/configure/types';

interface ReportingProps {
  demo: Demo | null;
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
  const analytics = demo?.metadata?.analytics as
    | { last_updated?: string; conversations?: Record<string, any>; last_perception_event?: any }
    | undefined;

  const conversations = analytics?.conversations || {};
  const conversationIds = Object.keys(conversations);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Reporting & Analytics</h2>
      <p className="text-gray-600 mb-6">
        View high-level analytics and perception data captured at the end of conversations. Sensitive fields are redacted.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="text-sm text-gray-500">Last Updated</div>
          <div className="text-lg font-medium">{formatDate(analytics?.last_updated)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="text-sm text-gray-500">Conversations Tracked</div>
          <div className="text-lg font-medium">{conversationIds.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="text-sm text-gray-500">Latest Conversation</div>
          <div className="text-xs font-mono break-all">
            {conversationIds.length ? conversationIds[conversationIds.length - 1] : '—'}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
        <h3 className="text-lg font-semibold mb-3">End-of-Call Perception (Most Recent)</h3>
        {analytics?.last_perception_event ? (
          <SafeJSON value={analytics.last_perception_event} />
        ) : (
          <div className="text-sm text-gray-500">No perception data yet.</div>
        )}
      </div>

      <div className="mt-6 bg-white p-6 rounded-lg shadow border border-gray-100">
        <h3 className="text-lg font-semibold mb-3">Conversations</h3>
        {conversationIds.length === 0 ? (
          <div className="text-sm text-gray-500">No conversations tracked yet.</div>
        ) : (
          <div className="space-y-4">
            {conversationIds.map((cid) => {
              const item = conversations[cid] || {};
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
        )}
      </div>

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
