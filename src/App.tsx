import React, { useState, useEffect } from 'react';
import { auth, api, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, Transaction, Asset, Team, ChatMessage, BotConfig } from './types';
import { cn } from './lib/utils';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Trading from './components/Trading';
import Wallet from './components/Wallet';
import BotControl from './components/BotControl';
import Chat from './components/Chat';
import Management from './components/Management';
import Onboarding from './components/Onboarding';
import { Language, translations } from './translations';
import { Shield, ArrowRight, TrendingUp, Lock, Mail, Key } from 'lucide-react';
import { motion } from 'motion/react';

const INITIAL_ASSETS: Asset[] = [
  { symbol: 'XAU', name: 'Gold', type: 'commodity', currentPrice: 2185.40, change24h: 0.85 },
  { symbol: 'XAG', name: 'Silver', type: 'commodity', currentPrice: 24.60, change24h: 1.2 },
  { symbol: 'OIL', name: 'Brent Oil', type: 'commodity', currentPrice: 85.30, change24h: -0.4 },
  { symbol: 'GAS', name: 'Natural Gas', type: 'commodity', currentPrice: 1.75, change24h: -2.1 },
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', currentPrice: 172.50, change24h: 0.5 },
  { symbol: 'MSFT', name: 'Microsoft', type: 'stock', currentPrice: 415.20, change24h: 1.1 },
  { symbol: 'TSLA', name: 'Tesla', type: 'stock', currentPrice: 175.40, change24h: -3.2 },
  { symbol: 'NVDA', name: 'NVIDIA', type: 'stock', currentPrice: 895.60, change24h: 4.5 },
  { symbol: 'AMZN', name: 'Amazon', type: 'stock', currentPrice: 178.20, change24h: 0.9 },
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', currentPrice: 64230.50, change24h: 2.4 },
  { symbol: 'ETH', name: 'Ethereum', type: 'crypto', currentPrice: 3450.20, change24h: -1.2 },
];

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isInitialized, setIsInitialized] = useState(true);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [teams, setTeams] = useState<Team[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [botConfig, setBotConfig] = useState<BotConfig>({
    userId: '',
    active: false,
    strategy: 'conservative',
    maxInvestment: 100,
    assets: ['XAU', 'OIL'],
    autoSelectAssets: true,
    botStartTime: null
  });

  const [demoTimeLeft, setDemoTimeLeft] = useState<number>(7200);
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('app_language') as Language) || 'en';
  });
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user && user.role === 'client' && !localStorage.getItem(`onboarding_completed_${user.uid}`)) {
      setShowOnboarding(true);
    }
    
    // Handle suspended status or redirect for activated users
    if (user && user.role === 'client') {
      if (user.status === 'suspended') {
        handleLogout();
        setLoginError('Your account has been suspended. Please contact support.');
      } else if (user.isActivated && user.redirectUrl) {
        window.location.href = user.redirectUrl;
      }
    }
  }, [user]);

  const handleOnboardingComplete = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
    if (user) {
      localStorage.setItem(`onboarding_completed_${user.uid}`, 'true');
    }
    setShowOnboarding(false);
  };

  useEffect(() => {
    if (user?.demoTimeLeft !== undefined) {
      setDemoTimeLeft(user.demoTimeLeft);
    }
  }, [user?.uid, user?.demoTimeLeft]);

  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkInit = async () => {
      try {
        const res = await fetch('/api/admin/check-initialized');
        const data = await res.json();
        setIsInitialized(data.initialized);
      } catch (e) {
        console.error("Initialization check failed", e);
      }
    };
    checkInit();

    let visibilityHandler: (() => void) | null = null;

    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (visibilityHandler) {
        document.removeEventListener('visibilitychange', visibilityHandler);
        visibilityHandler = null;
      }

      if (currentUser) {
        setUser(currentUser);
        setDemoTimeLeft(currentUser.demoTimeLeft ?? 7200);
        if (currentUser.role === 'client') {
          setActiveTab('dashboard');
        } else {
          setActiveTab('admin');
        }

        const fetchData = async () => {
          try {
            const [txs, bot, msgs, users, teamsData, assetsData, me] = await Promise.all([
              api.getTransactions(),
              api.getBotConfig(),
              api.getMessages(),
              api.getUsers(),
              api.getTeams(),
              api.getAssets(),
              api.getUser(currentUser.uid)
            ]);
            
            if (Array.isArray(txs)) setTransactions(txs);
            if (bot && typeof bot === 'object') {
              setBotConfig(prev => ({ ...prev, ...bot }));
            }
            if (Array.isArray(msgs)) setMessages(msgs);
            if (Array.isArray(users)) setAllUsers(users);
            if (Array.isArray(teamsData)) setTeams(teamsData);
            if (Array.isArray(assetsData)) setAssets(assetsData);
            if (me) setUser(me);
          } catch (e) {
            console.error("Data fetch failed", e);
          }
        };

        fetchData();
        intervalRef.current = setInterval(fetchData, 5000);

        visibilityHandler = () => {
          if (document.visibilityState === 'visible') {
            fetchData();
          }
        };
        document.addEventListener('visibilitychange', visibilityHandler);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (visibilityHandler) document.removeEventListener('visibilitychange', visibilityHandler);
    };
  }, []);

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/admin/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName })
      });
      const data = await res.json();
      if (data.success) {
        setIsInitialized(true);
        setIsBootstrapping(false);
        alert('System initialized. You can now log in.');
      } else {
        setLoginError(data.error);
      }
    } catch (e) {
      setLoginError('Bootstrap failed');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("App: handleLogin triggered", email);
    setLoginError('');
    try {
      const loggedInUser = await api.login(email, password);
      console.log("App: handleLogin successful", loggedInUser);
    } catch (error: any) {
      console.error("App: handleLogin failed", error);
      setLoginError('Invalid email or password');
    }
  };

  const handleLogout = () => api.logout();

  const handleTrade = async (asset: Asset, type: 'buy' | 'sell', amount: number) => {
    if (!user || amount <= 0) return;
    if (type === 'buy' && user.balance < amount) {
      alert('Insufficient balance');
      return;
    }

    try {
      const tx = {
        type,
        amount,
        asset: asset.symbol,
        price: asset.currentPrice,
        status: 'completed'
      };
      
      await api.createTransaction(tx);
      // Refresh user data
      const me = await fetch('/api/auth/me').then(r => r.json());
      setUser(me.user);
      const txs = await api.getTransactions();
      setTransactions(txs);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'transactions');
    }
  };

  const handleDeposit = async (amount: number) => {
    if (!user || amount <= 0) return;
    try {
      await api.createTransaction({
        type: 'deposit',
        amount,
        status: 'completed'
      });
      const me = await fetch('/api/auth/me').then(r => r.json());
      setUser(me.user);
      const txs = await api.getTransactions();
      setTransactions(txs);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'transactions');
    }
  };

  const handleWithdraw = async (amount: number) => {
    if (!user || amount <= 0 || user.balance < amount) return;
    try {
      await api.createTransaction({
        type: 'withdrawal',
        amount,
        status: 'completed'
      });
      const me = await fetch('/api/auth/me').then(r => r.json());
      setUser(me.user);
      const txs = await api.getTransactions();
      setTransactions(txs);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'transactions');
    }
  };

  const updateBotConfig = async (newConfig: Partial<BotConfig>) => {
    if (!user) return;
    try {
      // If activating, and we don't have a start time, set it
      if (newConfig.active && !botConfig.botStartTime) {
        const startTime = Date.now();
        await api.updateBotConfig({ ...newConfig, botStartTime: startTime });
      } else if (newConfig.active === false) {
        await api.updateBotConfig({ ...newConfig, botStartTime: null });
      } else {
        await api.updateBotConfig(newConfig);
      }
      
      const bot = await api.getBotConfig();
      if (bot && typeof bot === 'object') {
        setBotConfig(prev => ({ ...prev, ...bot }));
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'bots');
    }
  };

  const createUser = async (data: any) => {
    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        alert('User created successfully');
      } else {
        alert('Error: ' + result.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteUser = async (uid: string) => {
    // In iFrame environments, window.confirm might be blocked.
    // Proceeding directly for now, but in a real app, use a custom modal.
    try {
      const response = await fetch(`/api/admin/users/${uid}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.success) {
        const users = await api.getUsers();
        setAllUsers(users);
      } else {
        console.error('Error deleting user:', result.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const createTeam = async (data: any) => {
    try {
      const response = await fetch('/api/admin/create-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        alert('Team created successfully');
      } else {
        alert('Error: ' + result.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (receiverId: string, data: Partial<ChatMessage>) => {
    if (!user) return;
    try {
      await api.sendMessage({
        receiverId,
        participants: [user.uid, receiverId],
        read: false,
        ...data
      });
      const msgs = await api.getMessages();
      setMessages(msgs);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'messages');
    }
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      await fetch(`/api/messages/${id}`, { method: 'DELETE' });
      const msgs = await api.getMessages();
      setMessages(msgs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditMessage = async (id: string, text: string) => {
    try {
      await fetch(`/api/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const msgs = await api.getMessages();
      setMessages(msgs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearChat = async (contactId: string) => {
    try {
      await fetch('/api/messages/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId })
      });
      const msgs = await api.getMessages();
      setMessages(msgs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAsRead = async (senderId: string) => {
    if (!user) return;
    try {
      await api.markMessagesAsRead(senderId);
      // Update local state immediately for better UX
      setMessages(prev => prev.map(m => 
        (m.senderId === senderId && m.receiverId === user.uid) 
          ? { ...m, read: true } 
          : m
      ));
    } catch (e) {
      console.error(e);
    }
  };

  const handleBotTrade = async (trade: Partial<Transaction>) => {
    if (!user) return;
    try {
      await api.addTransaction({
        userId: user.uid,
        type: trade.type || 'buy',
        amount: Math.abs(trade.amount || 0),
        asset: trade.asset,
        price: trade.price,
        status: 'completed',
        timestamp: new Date().toISOString()
      } as Transaction);
      
      const [txs, updatedUser] = await Promise.all([
        api.getTransactions(),
        api.getUser(user.uid)
      ]);
      setTransactions(txs);
      if (updatedUser) setUser(updatedUser);
    } catch (e) {
      console.error("Trade failed", e);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F5F5F5]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-[#FF0000] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col lg:flex-row bg-white overflow-x-hidden font-sans">
        {/* Left Side - Branding */}
        <div className="lg:w-1/2 bg-[#FF0000] p-8 lg:p-24 flex flex-col justify-between text-white relative min-h-[40vh] lg:min-h-screen">
          <div className="relative z-10">
            <div className="flex items-center gap-2 lg:gap-3 mb-8 lg:mb-12">
              <Shield size={32} className="lg:w-10 lg:h-10" />
              <span className="text-xl lg:text-2xl font-bold tracking-tight">ANDORRA BANK</span>
            </div>
            <h1 className="text-4xl lg:text-7xl font-bold leading-tight mb-4 lg:mb-8">
              Invest in your <br />
              <span className="text-white/60 italic">future</span> today.
            </h1>
            <p className="text-lg lg:text-xl text-white/80 max-w-md leading-relaxed">
              Professional banking and trading simulation platform for the modern investor.
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-6 lg:gap-8 text-[10px] lg:text-sm font-medium opacity-60 mt-8 lg:mt-0">
            <div className="flex items-center gap-2"><Lock size={14} className="lg:w-4 lg:h-4" /> Secure SSL</div>
            <div className="flex items-center gap-2"><TrendingUp size={14} className="lg:w-4 lg:h-4" /> Real-time Data</div>
          </div>
          <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        {/* Right Side - Login/Bootstrap */}
        <div className="lg:w-1/2 p-8 lg:p-24 flex flex-col justify-center items-center bg-white">
          <div className="w-full max-w-md space-y-8 lg:space-y-12">
            {!isInitialized || isBootstrapping ? (
              <div className="space-y-2 lg:space-y-4">
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">System Setup</h2>
                <p className="text-sm lg:text-base text-gray-500">Initialize the Master Admin account</p>
              </div>
            ) : (
              <div className="space-y-2 lg:space-y-4">
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Welcome Back</h2>
                <p className="text-sm lg:text-base text-gray-500">Access your Andorra Bank Invest account</p>
              </div>
            )}
            
            <form onSubmit={(!isInitialized || isBootstrapping) ? handleBootstrap : handleLogin} className="space-y-4 lg:space-y-6">
              {(!isInitialized || isBootstrapping) && (
                <div className="space-y-2">
                  <label className="text-[10px] lg:text-sm font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 lg:w-5 lg:h-5" size={18} />
                    <input 
                      type="text" 
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-11 lg:pl-12 pr-4 py-3 lg:py-4 bg-gray-50 border-none rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-[#FF0000]/20 text-base"
                      placeholder="Master Admin"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] lg:text-sm font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 lg:w-5 lg:h-5" size={18} />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 lg:pl-12 pr-4 py-3 lg:py-4 bg-gray-50 border-none rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-[#FF0000]/20 text-base"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] lg:text-sm font-bold text-gray-400 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 lg:w-5 lg:h-5" size={18} />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 lg:pl-12 pr-4 py-3 lg:py-4 bg-gray-50 border-none rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-[#FF0000]/20 text-base"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {loginError && (
                <p className="text-red-600 text-xs lg:text-sm font-medium">{loginError}</p>
              )}

              <button 
                type="submit"
                className="w-full flex items-center justify-center gap-2 lg:gap-3 p-4 lg:p-5 bg-[#FF0000] text-white rounded-xl lg:rounded-2xl font-bold text-base lg:text-lg hover:bg-red-700 transition-all shadow-xl shadow-red-500/20"
              >
                {(!isInitialized || isBootstrapping) ? 'Initialize System' : 'Sign In'} <ArrowRight size={18} className="lg:w-5 lg:h-5" />
              </button>

              {isInitialized && !isBootstrapping && (
                <button 
                  type="button"
                  onClick={() => setIsBootstrapping(true)}
                  className="w-full text-center text-[10px] lg:text-sm font-bold text-gray-400 hover:text-[#FF0000] transition-colors"
                >
                  Staff login only
                </button>
              )}
            </form>

            <div className="pt-8 lg:pt-12 border-t border-gray-100">
              <p className="text-[10px] lg:text-xs text-gray-400 text-center uppercase tracking-widest font-bold">
                Andorra Bank Invest &copy; 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const unreadMessagesCount = messages.filter(m => m.receiverId === user?.uid && !m.read).length;

  return (
    <>
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user}
        onLogout={handleLogout}
        unreadMessagesCount={unreadMessagesCount}
        language={language}
      >
      {activeTab === 'dashboard' && (
        <Dashboard 
          user={user} 
          transactions={transactions} 
          onViewAll={() => setActiveTab('wallet')} 
          language={language}
        />
      )}
      {activeTab === 'wallet' && <Wallet user={user} transactions={transactions} onDeposit={handleDeposit} onWithdraw={handleWithdraw} language={language} />}
      {activeTab === 'bot' && (
        <BotControl 
          user={user} 
          config={botConfig} 
          onUpdateConfig={updateBotConfig} 
          onTrade={handleBotTrade}
          availableAssets={assets}
          transactions={transactions}
          demoTimeLeft={demoTimeLeft}
          language={language}
        />
      )}
      {activeTab === 'trading' && <Trading user={user} assets={assets} onTrade={handleTrade} language={language} />}
      {activeTab === 'chat' && (
        <Chat 
          currentUser={user} 
          messages={messages} 
          onSendMessage={handleSendMessage} 
          onDeleteMessage={handleDeleteMessage}
          onEditMessage={handleEditMessage}
          onClearChat={handleClearChat}
          onMarkAsRead={handleMarkAsRead}
          allUsers={allUsers}
          language={language}
          contacts={user.role === 'client' 
            ? [
                ...allUsers.filter(u => u.uid === user.managerId),
                {
                  uid: 'support-team',
                  displayName: 'Support Service',
                  email: 'support@andorra-invest.com',
                  role: 'admin',
                  balance: 0,
                  currency: 'EUR',
                  status: 'active',
                  createdAt: new Date().toISOString(),
                  managerId: null,
                  teamId: null
                } as UserProfile
              ]
            : allUsers.filter(u => u.uid !== user.uid)
          }
        />
      )}
      {(activeTab === 'admin' || activeTab === 'master') && (
            <Management 
              currentUser={user} 
              users={allUsers} 
              teams={teams}
              transactions={transactions}
              onUpdateUser={async (uid, data) => {
                await fetch(`/api/admin/update-user/${uid}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data)
                });
                const users = await api.getUsers();
                setAllUsers(users);
              }}
              onCreateUser={async (data) => {
                await createUser(data);
                const users = await api.getUsers();
                setAllUsers(users);
              }}
              onCreateTeam={async (data) => {
                await createTeam(data);
                const teamsData = await api.getTeams();
                setTeams(teamsData);
              }}
              onUpdateTeam={async (id, data) => {
                await fetch(`/api/admin/update-team/${id}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data)
                });
                const teamsData = await api.getTeams();
                setTeams(teamsData);
              }}
              onDeleteUser={deleteUser}
              onCreateTransaction={async (data) => {
                await api.adminCreateTransaction(data);
                const [users, txs] = await Promise.all([
                  api.getUsers(),
                  api.getTransactions()
                ]);
                setAllUsers(users);
                setTransactions(txs);
              }}
            />
          )}
      {activeTab === 'settings' && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold mb-6">{translations[language].settings}</h3>
          <div className="space-y-8 max-w-md">
            <div className="space-y-4">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">{translations[language].select_language}</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { code: 'en', label: 'English' },
                  { code: 'es', label: 'Español' },
                  { code: 'fr', label: 'Français' },
                  { code: 'de', label: 'Deutsch' },
                  { code: 'it', label: 'Italiano' },
                  { code: 'pt', label: 'Português' },
                  { code: 'ru', label: 'Русский' },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code as Language);
                      localStorage.setItem('app_language', lang.code);
                    }}
                    className={cn(
                      "px-4 py-3 rounded-xl font-bold text-sm transition-all border-2",
                      language === lang.code 
                        ? "border-[#FF0000] bg-red-50 text-[#FF0000]" 
                        : "border-gray-100 hover:border-gray-200 text-gray-600"
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Account Settings</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 block">Display Name</label>
                  <input 
                    type="text" 
                    value={user.displayName}
                    onChange={async (e) => {
                      const newName = e.target.value;
                      setUser({...user, displayName: newName});
                      await fetch(`/api/admin/update-user/${user.uid}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ displayName: newName })
                      });
                    }}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-[#FF0000]/20"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 block">Email Address</label>
              <input 
                type="email" 
                value={user.email}
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl font-medium opacity-60"
                readOnly
              />
              <p className="text-[10px] text-gray-400 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 block">Account Type</label>
              <div className="flex flex-col gap-2">
                <span className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-widest w-fit",
                  user.role === 'client' 
                    ? (user.isActivated ? "bg-green-50 text-green-600" : "bg-red-50 text-[#FF0000]")
                    : "bg-blue-50 text-blue-600"
                )}>
                  {user.role === 'client' ? (user.isActivated ? 'Active Account' : 'Demo Account') : user.role}
                </span>
                {user.role === 'client' && !user.isActivated && (
                  <p className="text-xs text-red-600 font-bold">Account needs activation</p>
                )}
              </div>
            </div>
            <div className="pt-6 border-t border-gray-100">
              <label className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 block">Change Password</label>
              <button 
                onClick={() => {
                  const newPass = prompt('Enter new password:');
                  if (newPass) {
                    fetch(`/api/admin/update-user/${user.uid}`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ password: newPass })
                    }).then(() => alert('Password updated successfully'));
                  }
                }}
                className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all"
              >
                Set New Password
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
    </>
  );
}
