import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IconX } from '@tabler/icons-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

export const Modal = ({ isOpen, onClose, title, children, size = 'lg' }: ModalProps) => {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-slate-900/10 dark:bg-black/20 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative z-10 w-full bg-bg-card border border-border/50 rounded-2xl shadow-2xl shadow-indigo-500/10 overflow-hidden flex flex-col max-h-[90vh] max-w-${size}`}
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
                <button
                  onClick={onClose}
                  className="text-text-muted hover:text-text-primary transition-colors p-1"
                >
                  <IconX size={20} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto">
                {children}
              </div>
            </motion.div>
          </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
