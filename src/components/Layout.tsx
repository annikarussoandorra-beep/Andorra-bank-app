import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  TrendingUp, 
  Bot, 
  MessageSquare, 
  Settings, 
  Users, 
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

import { UserProfile } from '../types';
import { Language, translations } from '../translations';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: UserProfile;
  onLogout: () => void;
  unreadMessagesCount?: number;
  language: Language;
}

export default function Layout({ 
  children, 
  activeTab, 
  setActiveTab, 
  user, 
  onLogout, 
  unreadMessagesCount = 0,
  language
}: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userRole = user.role;
  const t = translations[language];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard, roles: ['client', 'manager', 'team_lead', 'admin'] },
    { id: 'wallet', label: t.wallet, icon: Wallet, roles: ['client'] },
    { id: 'bot', label: t.bot, icon: Bot, roles: ['client'] },
    { id: 'chat', label: t.messages, icon: MessageSquare, roles: ['client', 'manager', 'team_lead', 'admin'] },
    { id: 'admin', label: userRole === 'manager' ? (language === 'ru' ? 'Клиенты' : 'Clients') : t.management, icon: Users, roles: ['manager', 'team_lead', 'admin'] },
    { id: 'settings', label: t.settings, icon: Settings, roles: ['client', 'manager', 'team_lead', 'admin'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

  const SidebarContent = () => (
    <>
      <div className="p-6 flex items-center justify-between">
        {(isSidebarOpen || isMobileMenuOpen) && (
          <div className="font-bold text-xl tracking-tight">
            ANDORRA BANK
          </div>
        )}
        <button 
          onClick={() => isMobileMenuOpen ? setIsMobileMenuOpen(false) : setIsSidebarOpen(!isSidebarOpen)} 
          className="p-1 hover:bg-white/10 rounded lg:block hidden"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <button 
          onClick={() => setIsMobileMenuOpen(false)} 
          className="p-1 hover:bg-white/10 rounded lg:hidden block"
        >
          <X size={24} />
        </button>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setIsMobileMenuOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-4 p-3 rounded-lg transition-all duration-200 group",
              activeTab === item.id ? "bg-white text-[#FF0000] shadow-md" : "hover:bg-white/10"
            )}
          >
            <div className="relative flex items-center justify-center">
              <item.icon size={22} className={cn(activeTab === item.id ? "text-[#FF0000]" : "text-white/80 group-hover:text-white")} />
              {item.id === 'chat' && unreadMessagesCount > 0 && !isSidebarOpen && !isMobileMenuOpen && (
                <span className="absolute -top-2 -right-2 bg-white text-[#FF0000] text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm">
                  {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                </span>
              )}
            </div>
            {(isSidebarOpen || isMobileMenuOpen) && (
              <span className="font-medium whitespace-nowrap">{item.label}</span>
            )}
            {item.id === 'chat' && unreadMessagesCount > 0 && (isSidebarOpen || isMobileMenuOpen) && (
              <span className={cn(
                "ml-auto bg-white text-[#FF0000] text-[10px] font-bold px-2 py-0.5 rounded-full",
                activeTab === 'chat' && "bg-[#FF0000] text-white"
              )}>
                {unreadMessagesCount}
              </span>
            )}
            {(isSidebarOpen || isMobileMenuOpen) && activeTab === item.id && item.id !== 'chat' && (
              <ChevronRight size={16} className="ml-auto" />
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/20">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-white/10 transition-colors"
        >
          <LogOut size={22} className="text-white/80" />
          {(isSidebarOpen || isMobileMenuOpen) && <span className="font-medium">{t.logout}</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#F5F5F5] font-sans text-[#1A1A1A] overflow-hidden">
      {/* Desktop Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-[#FF0000] text-white hidden lg:flex flex-col shadow-xl z-50 overflow-hidden"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-[#FF0000] text-white z-[70] flex flex-col lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg lg:text-xl font-semibold capitalize truncate">{activeTab.replace('-', ' ')}</h1>
          </div>
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user.displayName}</p>
              <p className="text-xs text-gray-500">{userRole.toUpperCase()}</p>
            </div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-[#FF0000] text-sm lg:text-base">
              {getInitials(user.displayName)}
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
