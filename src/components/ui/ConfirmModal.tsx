import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IconAlertTriangle } from '@tabler/icons-react';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  message,
  onClose,
  onConfirm,
}) => {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden pointer-events-auto border border-border/50"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 shrink-0 shadow-sm border border-rose-100 dark:border-rose-500/20">
                    <IconAlertTriangle size={24} stroke={1.5} />
                  </div>
                  <div className="pt-1">
                    <h3 className="text-xl font-bold text-text-primary mb-2">
                      Tasdiqlang
                    </h3>
                    <p className="text-text-secondary leading-relaxed">
                      {message}
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-bg-base/50 border-t border-border/50 flex items-center justify-end gap-3">
                <Button variant="secondary" onClick={onClose} className="px-5">
                  Bekor qilish
                </Button>
                <Button variant="danger" onClick={onConfirm} className="px-5 shadow-sm">
                  Tasdiqlash
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
