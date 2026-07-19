import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../ui/Button';
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

  const navItems = [
    { name: 'Dashboard', path: `/${user?.role}/dashboard`, icon: IconDashboard },
    ...(user?.role === 'admin' ? [
      { name: 'O\'quvchilar', path: '/admin/students', icon: IconUsers },
      { name: 'Guruhlar', path: '/admin/groups', icon: IconBooks },
      { name: 'Instruktorlar', path: '/admin/instructors', icon: IconBuildingCommunity }, // Reusing icon or better IconSteeringWheel if we had it, let's use IconUsers for now or add new. Let's use IconSettings for now or IconChartBar
      { name: 'To\'lovlar', path: '/admin/payments', icon: IconCreditCard },
      { name: 'Hujjatlar', path: '/admin/documents', icon: IconFileAlert },
      { name: 'Jadval', path: '/admin/schedule', icon: IconCalendarEvent },
      { name: 'Davomat', path: '/admin/reports', icon: IconChartBar },
      { name: 'Arxiv', path: '/admin/archive', icon: IconArchive },
    ] : []),
    ...(user?.role === 'superadmin' ? [
      { name: 'Filiallar', path: '/superadmin/branches', icon: IconBuildingCommunity },
      { name: 'Instruktorlar', path: '/superadmin/instructors', icon: IconUsers },
      { name: 'Analitika', path: '/superadmin/analytics', icon: IconChartBar },
      { name: 'Moliya', path: '/superadmin/finance', icon: IconCash },
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
      isCollapsed ? "w-20" : "w-72"
    )}>
      <div className={cn("h-32 flex items-center justify-center border-b border-border/50 transition-all duration-300 relative", isCollapsed ? "px-0" : "px-4 overflow-hidden")}>
        <div className={cn("transition-all duration-300 whitespace-nowrap flex items-center justify-center w-full h-full", isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto")}>
          <img src="/assets/logo-light.png" className="block dark:hidden h-32 w-auto object-contain scale-125 transition-transform duration-300" style={{ clipPath: 'inset(0 0 8% 0)' }} alt="Avtomaktab Logo" />
          <img src="/assets/logo-dark.png" className="hidden dark:block h-32 w-auto object-contain scale-125 transition-transform duration-300" style={{ clipPath: 'inset(0 0 8% 0)' }} alt="Avtomaktab Logo" />
        </div>
        {isCollapsed && (
          <div className="absolute flex items-center justify-center w-full h-full left-0">
            <img src="/assets/logo-light.png" className="block dark:hidden h-20 w-auto object-contain" style={{ clipPath: 'inset(0 0 8% 0)' }} alt="Logo" />
            <img src="/assets/logo-dark.png" className="hidden dark:block h-20 w-auto object-contain" style={{ clipPath: 'inset(0 0 8% 0)' }} alt="Logo" />
          </div>
        )}
        {!isCollapsed && (
          <button className="absolute top-4 right-4 md:hidden text-text-secondary hover:text-accent p-2 rounded-full hover:bg-accent/10 transition-colors z-10" onClick={onClose}>
            <IconX size={24} />
          </button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto pt-8 pb-6 overflow-x-hidden">
        <ul className={cn("space-y-1.5", isCollapsed ? "px-2" : "px-4")}>
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                title={isCollapsed ? item.name : undefined}
                className={({ isActive }) => cn(
                  "flex items-center rounded-xl text-sm font-semibold transition-all duration-300 group",
                  isCollapsed ? "justify-center p-3" : "gap-3.5 px-4 py-3 hover:translate-x-1",
                  isActive 
                    ? "bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] text-[#090909] shadow-md shadow-[var(--accent)]/20" 
                    : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                )}
                onClick={() => {
                  if (window.innerWidth < 768) onClose?.();
                }}
              >
                {({ isActive }) => (
                  <>
                    <item.icon 
                      size={isCollapsed ? 24 : 22} 
                      stroke={isActive ? 2 : 1.5}
                      className={cn(
                        "transition-colors duration-300 flex-shrink-0",
                        isActive ? "text-[#090909]" : "text-text-muted group-hover:text-accent"
                      )} 
                    />
                    {!isCollapsed && (
                      <span className="whitespace-nowrap transition-opacity duration-300">
                        {item.name}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Decorative gradient orb at the bottom of sidebar */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-accent/5 to-transparent pointer-events-none" />
    </aside>
  );
};
