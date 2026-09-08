'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const maxWStyles = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-void-999/85 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className={`relative w-full ${maxWStyles[maxWidth]} max-h-[92vh] overflow-y-auto bg-void-800 border border-void-600 rounded-xl shadow-2xl p-4 sm:p-6 md:p-8 z-10 my-4`}
          >
            {/* Ambient Corner Accent */}
            <div className="absolute top-0 left-0 w-8 h-[2px] bg-purple-brand" />
            <div className="absolute top-0 left-0 w-[2px] h-8 bg-purple-brand" />

            {/* Header */}
            <div className="flex items-start justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-void-700">
              <div className="pr-4">
                {title && (
                  <h3 className="text-base sm:text-xl md:text-2xl font-display font-black text-void-100 uppercase tracking-wide leading-snug">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-[11px] sm:text-xs text-void-300 mt-0.5">{subtitle}</p>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1 text-void-300 hover:text-void-100 hover:bg-void-700 rounded-md transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="text-void-200 text-xs sm:text-sm">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
