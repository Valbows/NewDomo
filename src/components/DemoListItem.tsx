'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreVertical, BarChart3, Settings, Copy, Trash2 } from 'lucide-react';
import type { Demo } from '@/app/demos/[demoId]/configure/types';

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return '—';
  }
}

interface Props {
  demo: Demo;
  conversationCount?: number;
  onDelete?: (demoId: string) => void;
}

const DemoListItem: React.FC<Props> = ({ demo, conversationCount = 0, onDelete }) => {
  const router = useRouter();
  const isActive = Boolean(demo.tavus_persona_id || demo.tavus_conversation_id);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${demo.name}"? This action cannot be undone.`)) {
      onDelete?.(demo.id);
    }
    setMenuOpen(false);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between border border-gray-100">
      <div className="min-w-0">
        <h3 className="text-lg font-bold text-domo-dark-text truncate">{demo.name}</h3>
        <p className="text-xs text-domo-light-text mt-1">
          Created: {formatDate(demo.created_at)}
        </p>
        <p className="text-xs text-gray-500 mt-1">Conversations tracked: {conversationCount}</p>
      </div>
      <div className="flex items-center space-x-3">
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            isActive ? 'text-domo-success bg-green-100' : 'text-gray-600 bg-gray-100'
          }`}
        >
          {isActive ? 'Active' : 'Draft'}
        </span>
        <Link
          href={`/demos/${demo.id}/experience`}
          className="text-xs px-3 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
        >
          View
        </Link>
        <Link
          href={`/demos/${demo.id}/configure?tab=videos`}
          className="text-xs px-3 py-1 rounded bg-gray-50 text-gray-700 hover:bg-gray-100"
        >
          Manage
        </Link>

        {/* Three dots menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-domo-light-text hover:text-domo-dark-text p-1 rounded hover:bg-gray-100"
          >
            <MoreVertical size={20} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <Link
                href={`/demos/${demo.id}/reporting`}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setMenuOpen(false)}
              >
                <BarChart3 size={16} />
                Analytics
              </Link>
              <Link
                href={`/demos/${demo.id}/configure?tab=agent`}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setMenuOpen(false)}
              >
                <Settings size={16} />
                Settings
              </Link>
              <hr className="my-1 border-gray-100" />
              <button
                onClick={() => {
                  // TODO: Implement duplicate functionality
                  alert('Duplicate feature coming soon!');
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
              >
                <Copy size={16} />
                Duplicate
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemoListItem;
