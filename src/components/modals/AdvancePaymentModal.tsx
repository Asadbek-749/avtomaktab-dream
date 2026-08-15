import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface AdvancePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { amount: number; note: string; date: string }) => void;
  instructorName: string;
}

export const AdvancePaymentModal: React.FC<AdvancePaymentModalProps> = ({ isOpen, onClose, onSubmit, instructorName }) => {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    onSubmit({ amount: Number(amount), note, date });
    setAmount('');
    setNote('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Avans kiritish">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-bg-card border border-border p-4 rounded-xl mb-4">
          <p className="text-sm text-text-secondary">Instruktor</p>
          <p className="font-semibold text-text-primary text-lg">{instructorName}</p>
        </div>

        <Input
          label="Summa (UZS)"
          type="number"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Masalan: 500000"
        />

        <Input
          label="Sana"
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary ml-1">Izoh</label>
          <textarea
            className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/50 transition-all resize-none"
            rows={3}
            placeholder="Nima maqsadda berilmoqda..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          ></textarea>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Bekor qilish</Button>
          <Button type="submit">Saqlash</Button>
        </div>
      </form>
    </Modal>
  );
};
