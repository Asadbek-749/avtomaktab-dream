import React from 'react';
import { Outlet, Navigate, useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const location = useLocation();
  const element = useOutlet();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleMenuClick = () => {
    if (window.innerWidth < 768) {
      setIsMobileMenuOpen(true);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <div className="flex h-screen bg-bg-base overflow-hidden relative selection:bg-accent/30 selection:text-accent">
      <Sidebar isMobileOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} isCollapsed={isCollapsed} />
      
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 dark:bg-black/40 backdrop-blur-md z-40 md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className="flex flex-col flex-1 overflow-hidden w-full relative z-0">
        <Header onMenuClick={handleMenuClick} />
        <main className="flex-1 overflow-y-auto p-6 pt-8 md:p-8 md:pt-10 w-full">
          <div className="max-w-[1150px] mx-auto w-full h-full">
              <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="h-full"
              >
                {element}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};
