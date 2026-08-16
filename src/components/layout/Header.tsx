import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { IconMoon, IconSun, IconLogout, IconMenu2 } from '@tabler/icons-react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {

  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };
  return (
    <header className="h-[72px] sm:h-[80px] bg-white/90 dark:bg-bg-card backdrop-blur-md border-b border-border/50 sticky top-0 z-30 transition-all duration-300 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        
        {/* Left Section: Menu & Logo */}
        <div className="flex items-center gap-4">
          <button 
            className="w-[44px] h-[44px] sm:w-[48px] sm:h-[48px] rounded-full bg-accent/5 dark:bg-white/5 border border-border/50 flex items-center justify-center hover:scale-[1.03] hover:bg-accent/10 transition-all duration-300"
            onClick={onMenuClick}
          >
            <IconMenu2 size={22} className="text-text-secondary" stroke={1.5} />
          </button>
          
          <h1 className="text-xl md:text-2xl font-bold hidden sm:block tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
            <span className="text-indigo-500">Avtomaktab</span> <span className="text-amber-500">Dream</span>
          </h1>
        </div>

        {/* Right Section: Controls & Avatar */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button 
            onClick={toggleTheme} 
            className="w-[44px] h-[44px] sm:w-[48px] sm:h-[48px] rounded-full bg-accent/5 dark:bg-white/5 border border-border/50 flex items-center justify-center hover:scale-[1.03] hover:bg-accent/10 transition-all duration-300"
          >
            <IconMoon size={22} stroke={1.5} className="block dark:hidden text-text-secondary" />
            <IconSun size={22} stroke={1.5} className="hidden dark:block text-text-secondary" />
          </button>

          <div className="h-8 w-px bg-border/50 hidden sm:block" />

          {/* Avatar & User Info */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right mr-1">
              <p 
                className="text-[14px] lg:text-[15px] font-bold text-text-primary leading-tight tracking-tight" 
                style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
              >
                {user?.name || 'Foydalanuvchi'}
              </p>
              <p 
                className="text-[10px] lg:text-[11px] font-semibold text-text-muted uppercase tracking-[1.5px] mt-0.5"
                style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}
              >
                {user?.role || 'Admin'}
              </p>
            </div>
            
            <div className="relative group cursor-pointer mr-1">
              <div className="w-[44px] h-[44px] sm:w-[50px] sm:h-[50px] rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-lg font-bold shadow-sm transition-transform duration-300 group-hover:scale-105">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="absolute bottom-0 right-0 w-[12px] h-[12px] sm:w-[14px] sm:h-[14px] bg-emerald-500 border-2 border-white dark:border-[#0f172a] rounded-full"></div>
            </div>

            <button 
              onClick={logout} 
              className="w-[44px] h-[44px] sm:w-[48px] sm:h-[48px] rounded-[12px] sm:rounded-[14px] bg-accent/5 dark:bg-white/5 border border-border/50 flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 transition-all duration-300 group text-text-secondary"
              title="Tizimdan chiqish"
            >
              <IconLogout size={20} stroke={1.5} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
        
      </div>
    </header>
  );
};

