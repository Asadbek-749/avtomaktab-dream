import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm as useRHForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { IconEye, IconEyeOff, IconUser, IconLock, IconLogin } from '@tabler/icons-react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import { Input } from '../../components/ui/Input';

const loginSchema = z.object({
  login: z.string().min(3, "Login kamida 3 ta belgi bo'lishi kerak"),
  password: z.string().min(1, "Parolni kiriting"),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useRHForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false
    }
  });

  const onSubmit = async (data: LoginForm) => {
    setError('');
    try {
      const res = await api.login(data.login, data.password);
      if (res && res.token) {
        login(res);
        navigate(`/${res.role}/dashboard`, { replace: true });
      } else {
        setError("Login yoki parol noto'g'ri");
      }
    } catch (err) {
      setError("Login yoki parol noto'g'ri");
    }
  };

  return (
    <div 
      className="h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-cover bg-center bg-no-repeat bg-[#0a0a0a]"
      style={{ backgroundImage: `url('/assets/login-bg.jpg')` }}
    >
      {/* Dark gradient overlay to ensure text readability against any background image */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#090909]/80 via-[#121212]/90 to-[#090909] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[440px] relative z-10 flex flex-col justify-center h-full max-h-[900px]"
      >
        <div className="flex flex-col items-center mb-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-4 relative"
          >
            <img 
              src="/assets/logo-gold.png" 
              className="w-[160px] md:w-[190px] h-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] relative z-10" 
              alt="Avtomaktab Dream Logo" 
              onError={(e) => {
                // Fallback to dark logo if gold logo is not yet placed
                (e.target as HTMLImageElement).src = "/assets/logo-dark.png";
              }}
            />
          </motion.div>
          
          <h1 className="text-[28px] md:text-[32px] font-bold tracking-tight mb-2 text-center flex items-center gap-2 drop-shadow-lg">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#F7C84A] to-[#C98A16]">Xush</span>
            <span className="text-white">Kelibsiz</span>
          </h1>
          <p className="text-[#a1a1aa] text-center text-sm max-w-[340px] leading-relaxed font-medium">
            Avtomaktab Dream Boshqaruv Tizimiga kirish uchun ma'lumotlarni kiriting
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-[#090909]/60 backdrop-blur-2xl border border-[#F7C84A]/20 rounded-[24px] p-6 shadow-[0_0_40px_rgba(201,138,22,0.1)] relative"
        >
          {/* Subtle top border glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-[#F7C84A]/50 to-transparent" />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-300 ml-1">Foydalanuvchi logini</label>
              <Input
                type="text"
                placeholder="Loginingizni kiriting"
                error={errors.login?.message}
                icon={<IconUser size={18} className="text-[#F7C84A]" />}
                className="!bg-[#121212]/80 !border-white/5 !text-white placeholder:!text-gray-500 focus-visible:!border-[#F7C84A]/50 focus-visible:!ring-[#F7C84A]/20 h-12 rounded-[12px] text-sm"
                {...register('login')}
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-300 ml-1">Parol</label>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Parolni kiriting"
                error={errors.password?.message}
                icon={<IconLock size={18} className="text-[#F7C84A]" />}
                className="!bg-[#121212]/80 !border-white/5 !text-white placeholder:!text-gray-500 focus-visible:!border-[#F7C84A]/50 focus-visible:!ring-[#F7C84A]/20 h-12 rounded-[12px] text-sm"
                {...register('password')}
                endIcon={
                  <button
                    type="button"
                    className="text-gray-500 hover:text-[#F7C84A] focus:outline-none transition-colors px-2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                  </button>
                }
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-xs text-red-400 text-center font-medium bg-red-500/10 py-2 rounded-xl border border-red-500/20"
              >
                {error}
              </motion.p>
            )}

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full h-12 mt-2 relative group overflow-hidden rounded-[12px] flex items-center justify-center gap-2 text-[#090909] font-bold text-[14px] tracking-wide transition-all duration-300 hover:-translate-y-1 shadow-[0_10px_20px_rgba(247,200,74,0.15)] hover:shadow-[0_15px_30px_rgba(247,200,74,0.25)] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#F7C84A] to-[#C98A16] transition-transform duration-300 group-hover:scale-[1.02]" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity duration-300" />
              <span className="relative z-10 flex items-center gap-2">
                {isSubmitting ? 'KIRILMOQDA...' : 'TIZIMGA KIRISH'}
                {!isSubmitting && <IconLogin size={20} className="relative z-10 group-hover:translate-x-1 transition-transform duration-300" />}
              </span>
            </button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};
