
import {Edit, Trash2, Play, CheckCircle} from 'lucide-react';
import {CustomObjective} from '@/lib/supabase/custom-objectives';

interface ObjectivesListProps {
  objectives: CustomObjective[];
  onEdit: (objective: CustomObjective) => void;
  onDelete: (id: string) => void;
  onActivate: (id: string) => void;
}

export function ObjectivesList({ objectives, onEdit, onDelete, onActivate }: ObjectivesListProps) {
  if (objectives.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No custom objectives created yet.</p>
        <p className="text-sm">Create your first objective set to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {objectives.map((objective) => (
        <div
          key={objective.id}
          className={`p-4 border rounded-lg ${
            objective.is_active ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-900">{objective.name}</h4>
                {objective.is_active && (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
              </div>
              {objective.description && (
                <p className="text-sm text-gray-600 mt-1">{objective.description}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {objective.objectives.length} steps • Created {new Date(objective.created_at).toLocaleDateString()}
                {objective.objectives.some(step => step.callback_url) && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    📡 Webhook
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!objective.is_active && (
                <button
                  onClick={() => onActivate(objective.id)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded"
                  title="Activate this objective set"
                >
                  <Play className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => onEdit(objective)}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                title="Edit objective set"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(objective.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
                title="Delete objective set"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}