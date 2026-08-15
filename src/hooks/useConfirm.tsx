import React, { useState, useCallback } from 'react';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export const useConfirm = () => {
  const [promise, setPromise] = useState<{ resolve: (value: boolean) => void } | null>(null);
  const [message, setMessage] = useState('');

  const confirm = useCallback((msg: string) => {
    return new Promise<boolean>((resolve) => {
      setMessage(msg);
      setPromise({ resolve });
    });
  }, []);

  const handleClose = useCallback(() => {
    promise?.resolve(false);
    setPromise(null);
  }, [promise]);

  const handleConfirm = useCallback(() => {
    promise?.resolve(true);
    setPromise(null);
  }, [promise]);

  const ConfirmationDialog = useCallback(() => (
    <ConfirmModal
      isOpen={promise !== null}
      message={message}
      onClose={handleClose}
      onConfirm={handleConfirm}
    />
  ), [promise, message, handleClose, handleConfirm]);

  return [ConfirmationDialog, confirm] as const;
};
