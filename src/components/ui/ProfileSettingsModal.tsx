import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from './Modal';
import { Input } from './Input';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { Button } from './Button';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';

const profileSchema = z.object({
  name: z.string().min(3, "Ism kamida 3 ta harfdan iborat bo'lishi kerak"),
  login: z.string().min(3, "Login kamida 3 ta belgi bo'lishi kerak"),
  phone: z.string().min(9, "Telefon raqam xato"),
  newPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && data.newPassword.length > 0 && data.newPassword.length < 6) {
    return false;
  }
  return true;
}, {
  message: "Yangi parol kamida 6 ta belgi bo'lishi kerak",
  path: ["newPassword"]
});

type ProfileForm = z.infer<typeof profileSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileSettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user, login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      login: '',
      phone: '',
      currentPassword: '',
      newPassword: ''
    }
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      reset({
        name: user?.name || '',
        login: user?.login || '',
        phone: user?.phone || '',
        currentPassword: '',
        newPassword: ''
      });
      setErrorMsg('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
    }
  }, [isOpen, user, reset]);

  const onSubmit = async (data: ProfileForm) => {
    if (!user) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const updateData: any = {
        name: data.name,
        login: data.login,
        phone: data.phone
      };

      if (data.newPassword) {
        updateData.password = data.newPassword;
      }

      await api.updateUser(user.id, updateData);
      
      if (data.newPassword) {
        alert("Parolingiz muvaffaqiyatli o'zgartirildi. Iltimos, tizimga qayta kiring.");
        useAuthStore.getState().logout();
      } else {
        alert("Ma'lumotlar saqlandi. Yangilanishlar ko'rinishi uchun sahifa yangilanadi.");
        window.location.reload();
      }
      
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Profil Sozlamalari" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-sm text-center">
            {errorMsg}
          </div>
        )}

        <Input label="F.I.SH." placeholder="Ismingiz" error={errors.name?.message} {...register('name')} />
        <Input label="Login" placeholder="Login" error={errors.login?.message} {...register('login')} />
        <Input label="Telefon" placeholder="Telefon raqam" error={errors.phone?.message} {...register('phone')} />
        
        <div className="pt-4 border-t border-border mt-4">
          <h4 className="text-sm font-semibold text-text-secondary mb-3">Parolni o'zgartirish (Ixtiyoriy)</h4>
          <div className="space-y-4">
            <Input 
              type={showNewPassword ? "text" : "password"} 
              label="Yangi parol" 
              placeholder="Yangi parolni kiriting (kamida 6 ta belgi)" 
              error={errors.newPassword?.message} 
              {...register('newPassword')} 
              endIcon={
                <button 
                  type="button" 
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="p-1 text-text-muted hover:text-accent transition-colors"
                  tabIndex={-1}
                >
                  {showNewPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                </button>
              }
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={onClose}>Bekor qilish</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saqlanmoqda...' : 'Saqlash'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
