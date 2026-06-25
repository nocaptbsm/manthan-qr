import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{title}</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-secondary)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};
