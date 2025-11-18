import { Calendar, Clock, MessageSquare, BarChart3 } from "lucide-react";
import { formatDate, formatDuration } from "../utils/formatters";

interface StatsDashboardProps {
  totalConversations: number;
  completedConversations: number;
  averageDuration: number;
  averageDomoScore: number;
  lastConversationDate: string;
}

export function StatsDashboard({
  totalConversations,
  completedConversations,
  averageDuration,
  averageDomoScore,
  lastConversationDate,
}: StatsDashboardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
        <div className="text-2xl font-bold text-blue-600">
          {formatDuration(Math.round(averageDuration))}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <span className="text-lg">🏆</span>
          <span>Avg Domo Score</span>
        </div>
        <div className="text-2xl font-bold text-purple-600">
          {averageDomoScore.toFixed(1)}/5
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {((averageDomoScore / 5) * 100).toFixed(0)}% Credibility
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Calendar className="w-4 h-4" />
          <span>Last Conversation</span>
        </div>
        <div className="text-sm font-medium text-gray-900">
          {lastConversationDate ? formatDate(lastConversationDate) : "—"}
        </div>
      </div>
    </div>
  );
}
