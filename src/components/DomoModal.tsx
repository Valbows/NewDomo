'use client';

import React, { useEffect, useCallback } from 'react';
import { X, AlertTriangle, Info, CheckCircle, Trash2 } from 'lucide-react';

export type ModalType = 'confirm' | 'alert' | 'delete' | 'success' | 'info';

interface DomoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

export function DomoModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'confirm',
  confirmText,
  cancelText = 'Cancel',
  showCancel = true,
}: DomoModalProps) {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'delete':
        return <Trash2 className="w-6 h-6 text-domo-error" />;
      case 'alert':
      case 'confirm':
        return <AlertTriangle className="w-6 h-6 text-domo-warning" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-domo-success" />;
      case 'info':
        return <Info className="w-6 h-6 text-domo-primary" />;
      default:
        return <Info className="w-6 h-6 text-domo-primary" />;
    }
  };

  const getConfirmButtonStyle = () => {
    switch (type) {
      case 'delete':
        return 'bg-domo-error hover:bg-domo-error/90 text-white';
      case 'success':
        return 'bg-domo-success hover:bg-domo-success/90 text-white';
      default:
        return 'bg-domo-primary hover:bg-domo-secondary text-white';
    }
  };

  const getDefaultConfirmText = () => {
    switch (type) {
      case 'delete':
        return 'Delete';
      case 'alert':
      case 'info':
      case 'success':
        return 'OK';
      default:
        return 'Confirm';
    }
  };

  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-domo-bg-card border border-domo-border rounded-xl shadow-domo-lg max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-domo-border">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-domo-bg-elevated flex items-center justify-center">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white font-heading">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-domo-bg-elevated transition-colors"
          >
            <X className="w-5 h-5 text-domo-text-muted" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="text-domo-text-secondary">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 bg-domo-bg-dark border-t border-domo-border">
          {showCancel && type !== 'alert' && type !== 'info' && type !== 'success' && (
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-domo-text-secondary bg-domo-bg-elevated border border-domo-border rounded-lg hover:text-white hover:border-domo-text-muted transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${getConfirmButtonStyle()}`}
          >
            {confirmText || getDefaultConfirmText()}
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for easier usage
interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: ModalType;
  onConfirm?: () => void;
  confirmText?: string;
  showCancel?: boolean;
}

export function useDomoModal() {
  const [modalState, setModalState] = React.useState<ModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm',
  });

  const showModal = (options: Omit<ModalState, 'isOpen'>) => {
    setModalState({ ...options, isOpen: true });
  };

  const hideModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const confirm = (title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        type: 'confirm',
        onConfirm: () => resolve(true),
        showCancel: true,
      });
      const checkClosed = setInterval(() => {
        if (!modalState.isOpen) {
          clearInterval(checkClosed);
          resolve(false);
        }
      }, 100);
    });
  };

  const confirmDelete = (title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      let resolved = false;
      setModalState({
        isOpen: true,
        title,
        message,
        type: 'delete',
        onConfirm: () => {
          resolved = true;
          resolve(true);
        },
        showCancel: true,
      });
    });
  };

  const alert = (title: string, message: string) => {
    setModalState({
      isOpen: true,
      title,
      message,
      type: 'alert',
      showCancel: false,
    });
  };

  const success = (title: string, message: string) => {
    setModalState({
      isOpen: true,
      title,
      message,
      type: 'success',
      showCancel: false,
    });
  };

  return {
    modalState,
    showModal,
    hideModal,
    confirm,
    confirmDelete,
    alert,
    success,
    Modal: () => (
      <DomoModal
        isOpen={modalState.isOpen}
        onClose={hideModal}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        showCancel={modalState.showCancel}
      />
    ),
  };
}

export default DomoModal;
