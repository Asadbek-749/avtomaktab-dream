import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../ui/Button';
import { ProfileSettingsModal } from '../ui/ProfileSettingsModal';
import {
  IconDashboard,
  IconUsers,
  IconBooks,
  IconCreditCard,
  IconCash,
  IconCalendarEvent,
  IconChartBar,
  IconSettings,
  IconBuildingCommunity,
  IconFileAlert,
  IconArchive,
  IconX
} from '@tabler/icons-react';

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
}

export const Sidebar = ({ isMobileOpen, onClose, isCollapsed = false }: SidebarProps) => {
  const user = useAuthStore(state => state.user);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const navItems = [
    { name: 'Umumiy hisobot', path: `/${user?.role}/dashboard`, icon: IconDashboard },
    ...(user?.role === 'admin' ? [
      { name: 'Guruhlar', path: '/admin/groups', icon: IconBooks },
      { name: 'Instruktorlar', path: '/admin/instructors', icon: IconUsers },
      { name: 'Hujjatlar', path: '/admin/documents', icon: IconFileAlert },
      { name: 'Jadval', path: '/admin/schedule', icon: IconCalendarEvent },
      { name: 'Davomat', path: '/admin/reports', icon: IconChartBar },
      { name: 'Arxiv', path: '/admin/archive', icon: IconArchive },
    ] : []),
    ...(user?.role === 'superadmin' ? [
      { name: 'Filiallar', path: '/superadmin/branches', icon: IconBuildingCommunity },
      { name: 'Instruktorlar', path: '/superadmin/instructors', icon: IconUsers },
      { name: 'Hujjatlar', path: '/superadmin/documents', icon: IconFileAlert },
      { name: 'Davomat', path: '/superadmin/reports', icon: IconBooks },
      { name: 'Adminlar', path: '/superadmin/admins', icon: IconUsers },
      { name: 'Arxiv', path: '/superadmin/archive', icon: IconArchive },
    ] : []),
    ...(user?.role === 'teacher' ? [
      { name: 'Mening guruhlarim', path: '/teacher/groups', icon: IconBooks },
      { name: 'Mening jadvalim', path: '/teacher/schedule', icon: IconCalendarEvent },
    ] : []),
    ...(user?.role === 'instructor' ? [
      { name: 'Mening o\'quvchilarim', path: '/instructor/students', icon: IconUsers },
      { name: 'Haydash darslari', path: '/instructor/lessons', icon: IconCalendarEvent },
    ] : [])
  ];

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-50 glass-panel border-r flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out md:static md:flex",
      isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div className={cn("h-24 py-2 flex items-center justify-center border-b border-border/50 transition-all duration-300 relative", isCollapsed ? "px-0" : "px-4 overflow-hidden")}>
        <div className={cn("transition-all duration-300 whitespace-nowrap flex items-center justify-center w-full h-full", isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto")}>
          <img src="/assets/logo-light.png" className="block dark:hidden h-full w-auto object-contain transition-transform duration-300 hover:scale-105" alt="Avtomaktab Logo" />
          <img src="/assets/logo-dark.png" className="hidden dark:block h-full w-auto object-contain transition-transform duration-300 hover:scale-105" alt="Avtomaktab Logo" />
        </div>
        {isCollapsed && (
          <div className="absolute flex items-center justify-center w-full h-full left-0 p-3">
            <img src="/assets/logo-light.png" className="block dark:hidden h-full w-auto object-contain" alt="Logo" />
            <img src="/assets/logo-dark.png" className="hidden dark:block h-full w-auto object-contain" alt="Logo" />
          </div>
        )}
        {!isCollapsed && (
          <button className="absolute top-4 right-4 md:hidden text-text-secondary hover:text-indigo-500 p-2 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors z-10" onClick={onClose}>
            <IconX size={20} />
          </button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto pt-6 pb-6 overflow-x-hidden custom-scrollbar">
        <ul className={cn("space-y-1.5", isCollapsed ? "px-2" : "px-4")}>
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                title={isCollapsed ? item.name : undefined}
                className={({ isActive }) => cn(
                  "flex items-center rounded-xl text-sm font-semibold transition-all duration-300 group relative overflow-hidden",
                  isCollapsed ? "justify-center p-3" : "gap-3.5 px-4 py-3.5 hover:translate-x-1",
                  isActive 
                    ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-white shadow-sm" 
                    : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                )}
                onClick={() => {
                  if (window.innerWidth < 768) onClose?.();
                }}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div 
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 bg-indigo-600 dark:bg-indigo-400 rounded-r-full"
                      />
                    )}
                    <item.icon 
                      size={isCollapsed ? 24 : 22} 
                      stroke={isActive ? 2.5 : 1.5}
                      className={cn(
                        "transition-colors duration-300 flex-shrink-0 relative z-10",
                        isActive ? "text-indigo-600 dark:text-indigo-400" : "text-text-muted group-hover:text-indigo-500 dark:group-hover:text-indigo-400"
                      )} 
                    />
                    {!isCollapsed && (
                      <span className="whitespace-nowrap transition-opacity duration-300 relative z-10">
                        {item.name}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}        </ul>
      </nav>
      
      {/* Pinned Bottom Section */}
      <div className={cn("p-4 border-t border-border/50 relative z-20 bg-bg-base/50 backdrop-blur-md", isCollapsed && "px-2")}>
        <button
          title={isCollapsed ? "Profil sozlamalari" : undefined}
          className={cn(
            "w-full flex items-center rounded-2xl transition-all duration-300 group",
            isCollapsed ? "justify-center p-2" : "gap-3 p-2 hover:bg-bg-hover hover:shadow-sm border border-transparent hover:border-border/50",
            isProfileModalOpen && "bg-bg-hover shadow-sm border-border/50"
          )}
          onClick={() => {
            setIsProfileModalOpen(true);
            if (window.innerWidth < 768) onClose?.();
          }}
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105 flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#0f172a] rounded-full"></div>
          </div>
          
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden text-left">
              <p className="text-sm font-bold text-text-primary truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {user?.name || 'Foydalanuvchi'}
              </p>
              <p className="text-xs font-medium text-text-muted truncate capitalize">
                {user?.role || 'Admin'}
              </p>
            </div>
          )}
        </button>
      </div>

      {/* Decorative gradient orb at the bottom of sidebar */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-accent/5 to-transparent pointer-events-none" />
      
      <ProfileSettingsModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </aside>
  );
};
