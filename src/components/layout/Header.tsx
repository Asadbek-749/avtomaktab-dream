import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { IconMoon, IconSun, IconLanguage, IconLogout, IconMenu2 } from '@tabler/icons-react';

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
    <header className="h-16 border-b border-border/50 glass-panel sticky top-0 z-30 transition-all duration-300">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            className="p-2 rounded-xl hover:bg-bg-hover text-text-secondary transition-colors"
            onClick={onMenuClick}
          >
            <IconMenu2 size={24} />
          </button>
          
          <h1 className="text-xl md:text-2xl font-bold text-gradient hidden sm:block tracking-tight">
            Avtomaktab
          </h1>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-full hover:bg-accent/10 text-text-secondary hover:text-accent transition-all duration-300 hover:rotate-12 bg-bg-base/50"
          >
            <IconSun size={20} className="hidden dark:block" />
            <IconMoon size={20} className="block dark:hidden" />
          </button>
          
          <div className="h-8 w-px bg-border/50 mx-1 sm:mx-2" />
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-text-primary leading-none">{user?.name}</p>
              <p className="text-xs text-text-muted mt-1.5 capitalize">{user?.role}</p>
            </div>
            <Button variant="danger" size="sm" onClick={logout} className="w-10 px-0 sm:w-auto sm:px-4 sm:gap-2 rounded-full sm:rounded-xl shadow-none hover:shadow-lg">
              <IconLogout size={18} />
              <span className="hidden sm:inline font-medium">Chiqish</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
