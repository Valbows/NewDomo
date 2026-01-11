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
  // Handle escape key
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
        return <Trash2 className="w-6 h-6 text-red-500" />;
      case 'alert':
      case 'confirm':
        return <AlertTriangle className="w-6 h-6 text-amber-500" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'info':
        return <Info className="w-6 h-6 text-blue-500" />;
      default:
        return <Info className="w-6 h-6 text-indigo-500" />;
    }
  };

  const getConfirmButtonStyle = () => {
    switch (type) {
      case 'delete':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white';
      default:
        return 'bg-indigo-600 hover:bg-indigo-700 text-white';
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
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-gray-100">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="text-gray-600">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 bg-gray-50 border-t border-gray-100">
          {showCancel && type !== 'alert' && type !== 'info' && type !== 'success' && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${getConfirmButtonStyle()}`}
          >
            {confirmText || getDefaultConfirmText()}
          </button>
        </div>

        {/* Domo branding */}
        <div className="absolute bottom-2 left-5 text-xs text-gray-300">
          Domo
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
      // If modal is closed without confirming
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
