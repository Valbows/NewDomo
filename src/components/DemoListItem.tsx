'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MoreVertical, BarChart3, Settings, Copy, Trash2 } from 'lucide-react';
import type { Demo } from '@/app/demos/[demoId]/configure/types';
import { DomoModal } from './DomoModal';

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
  const isActive = Boolean(demo.tavus_persona_id || demo.tavus_conversation_id);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

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

  const handleDeleteClick = () => {
    setMenuOpen(false);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    onDelete?.(demo.id);
  };

  const handleDuplicateClick = () => {
    setMenuOpen(false);
    setShowInfoModal(true);
  };

  return (
    <>
      <div className="bg-domo-bg-card border border-domo-border p-4 sm:p-5 rounded-xl hover:border-domo-primary/50 transition-colors">
        {/* Mobile: Stack layout, Desktop: Flex row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          {/* Demo Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-white truncate">{demo.name}</h3>
              <span
                className={`px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full whitespace-nowrap ${
                  isActive
                    ? 'text-domo-success bg-domo-success/10 border border-domo-success/20'
                    : 'text-domo-text-muted bg-domo-bg-elevated border border-domo-border'
                }`}
              >
                {isActive ? 'Active' : 'Draft'}
              </span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 mt-1.5 sm:mt-2">
              <p className="text-[10px] sm:text-xs text-domo-text-muted">
                Created: {formatDate(demo.created_at)}
              </p>
              <p className="text-[10px] sm:text-xs text-domo-text-muted">
                {conversationCount} conversation{conversationCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={`/demos/${demo.id}/experience`}
              className="text-xs px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg bg-domo-primary/10 text-domo-primary hover:bg-domo-primary/20 transition-colors flex-1 sm:flex-none text-center"
            >
              View
            </Link>
            <Link
              href={`/demos/${demo.id}/configure`}
              className="text-xs px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg bg-domo-bg-elevated text-domo-text-secondary hover:text-white hover:bg-domo-bg-elevated/80 transition-colors flex-1 sm:flex-none text-center"
            >
              Manage
            </Link>

            {/* Three dots menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-domo-text-muted hover:text-white p-2.5 sm:p-2 rounded-lg hover:bg-domo-bg-elevated transition-colors"
              >
                <MoreVertical size={20} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-domo-bg-elevated rounded-xl shadow-domo-lg border border-domo-border py-1 z-50">
                  <Link
                    href={`/demos/${demo.id}/reporting`}
                    className="flex items-center gap-2 px-4 py-3 sm:py-2.5 text-sm text-domo-text-secondary hover:text-white hover:bg-domo-bg-card transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <BarChart3 size={16} />
                    Reporting
                  </Link>
                  <Link
                    href={`/demos/${demo.id}/configure?tab=agent`}
                    className="flex items-center gap-2 px-4 py-3 sm:py-2.5 text-sm text-domo-text-secondary hover:text-white hover:bg-domo-bg-card transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Settings size={16} />
                    Settings
                  </Link>
                  <hr className="my-1 border-domo-border" />
                  <button
                    onClick={handleDuplicateClick}
                    className="flex items-center gap-2 px-4 py-3 sm:py-2.5 text-sm text-domo-text-secondary hover:text-white hover:bg-domo-bg-card w-full text-left transition-colors"
                  >
                    <Copy size={16} />
                    Duplicate
                  </button>
                  <button
                    onClick={handleDeleteClick}
                    className="flex items-center gap-2 px-4 py-3 sm:py-2.5 text-sm text-domo-error hover:bg-domo-error/10 w-full text-left transition-colors"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DomoModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Demo"
        message={`Are you sure you want to delete "${demo.name}"? This action cannot be undone.`}
        type="delete"
        confirmText="Delete"
      />

      {/* Info Modal for Coming Soon */}
      <DomoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="Coming Soon"
        message="The duplicate feature is coming soon! Stay tuned."
        type="info"
      />
    </>
  );
};

export default DemoListItem;
