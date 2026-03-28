import React, { useState, useEffect } from 'react';
import { auth, api, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, Transaction, Asset, Team, ChatMessage, BotConfig } from './types';
import { cn } from './lib/utils';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import Trading from './components/Trading';
import Offers from './components/Offers';
import Wallet from './components/Wallet';
import BotControl from './components/BotControl';
import Chat from './components/Chat';
import Management from './components/Management';
import Onboarding from './components/Onboarding';
import { Language, translations } from './translations';
import { Shield, ArrowRight, TrendingUp, Lock, Mail, Key } from 'lucide-react';
import { motion } from 'motion/react';

const INITIAL_ASSETS: Asset[] = [
  // Commodities
  { symbol: 'XAU', name: 'Gold', type: 'commodity', currentPrice: 2185.40, change24h: 0.85 },
  { symbol: 'XAG', name: 'Silver', type: 'commodity', currentPrice: 24.60, change24h: 1.2 },
  { symbol: 'OIL', name: 'Brent Crude Oil', type: 'commodity', currentPrice: 85.30, change24h: -0.4 },
  { symbol: 'WTI', name: 'WTI Crude Oil', type: 'commodity', currentPrice: 81.20, change24h: -0.6 },
  { symbol: 'GAS', name: 'Natural Gas', type: 'commodity', currentPrice: 1.75, change24h: -2.1 },
  { symbol: 'COPPER', name: 'Copper', type: 'commodity', currentPrice: 4.12, change24h: 0.3 },
  { symbol: 'PLAT', name: 'Platinum', type: 'commodity', currentPrice: 915.50, change24h: -0.8 },
  { symbol: 'PALL', name: 'Palladium', type: 'commodity', currentPrice: 1020.30, change24h: 1.5 },
  
  // Stocks
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', currentPrice: 172.50, change24h: 0.5 },
  { symbol: 'MSFT', name: 'Microsoft', type: 'stock', currentPrice: 415.20, change24h: 1.1 },
  { symbol: 'TSLA', name: 'Tesla', type: 'stock', currentPrice: 175.40, change24h: -3.2 },
  { symbol: 'NVDA', name: 'NVIDIA', type: 'stock', currentPrice: 895.60, change24h: 4.5 },
  { symbol: 'AMZN', name: 'Amazon', type: 'stock', currentPrice: 178.20, change24h: 0.9 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', currentPrice: 145.30, change24h: 0.2 },
  { symbol: 'META', name: 'Meta Platforms', type: 'stock', currentPrice: 485.10, change24h: 1.8 },
  { symbol: 'NFLX', name: 'Netflix', type: 'stock', currentPrice: 610.40, change24h: -0.5 },
  { symbol: 'AMD', name: 'Advanced Micro Devices', type: 'stock', currentPrice: 180.50, change24h: 2.1 },
  { symbol: 'INTC', name: 'Intel Corp.', type: 'stock', currentPrice: 42.80, change24h: -1.4 },
  { symbol: 'BA', name: 'Boeing Co.', type: 'stock', currentPrice: 190.20, change24h: -2.5 },
  { symbol: 'DIS', name: 'Walt Disney Co.', type: 'stock', currentPrice: 115.60, change24h: 0.7 },
  
  // Crypto
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', currentPrice: 64230.50, change24h: 2.4 },
  { symbol: 'ETH', name: 'Ethereum', type: 'crypto', currentPrice: 3450.20, change24h: -1.2 },
  { symbol: 'BNB', name: 'Binance Coin', type: 'crypto', currentPrice: 580.40, change24h: 1.5 },
  { symbol: 'SOL', name: 'Solana', type: 'crypto', currentPrice: 145.80, change24h: 5.2 },
  { symbol: 'XRP', name: 'Ripple', type: 'crypto', currentPrice: 0.62, change24h: -0.8 },
  { symbol: 'ADA', name: 'Cardano', type: 'crypto', currentPrice: 0.58, change24h: 0.4 },
  { symbol: 'DOT', name: 'Polkadot', type: 'crypto', currentPrice: 8.40, change24h: -1.5 },
  { symbol: 'DOGE', name: 'Dogecoin', type: 'crypto', currentPrice: 0.15, change24h: 8.5 },
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
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (user && user.role === 'client' && !localStorage.getItem(`onboarding_completed_${user.uid}`)) {
      setShowOnboarding(true);
    }
    
    // Handle suspended status or redirect for activated users
    if (user && user.role === 'client' && !isRedirecting) {
      if (user.status === 'suspended') {
        handleLogout();
        setLoginError('Your account has been suspended. Please contact support.');
      } else if (user.isActivated && user.redirectUrl) {
        const targetUrl = user.redirectUrl;
        const currentPath = window.location.pathname;
        
        // Only redirect if the target is different from current path
        // and handle both absolute and relative URLs
        let shouldRedirect = true;
        try {
          const targetUrlObj = new URL(targetUrl, window.location.origin);
          
          if (targetUrlObj.origin === window.location.origin) {
            const targetPath = targetUrlObj.pathname.replace(/\/$/, '') || '/';
            const currentPathNormalized = currentPath.replace(/\/$/, '') || '/';
            
            if (targetPath === currentPathNormalized) {
              shouldRedirect = false;
            }
          }
        } catch (e) {
          const targetPath = targetUrl.replace(/\/$/, '') || '/';
          const currentPathNormalized = currentPath.replace(/\/$/, '') || '/';
          if (targetPath === currentPathNormalized) {
            shouldRedirect = false;
          }
        }

        if (shouldRedirect) {
          console.log(`Redirecting from ${window.location.pathname} to ${targetUrl}`);
          setIsRedirecting(true);
          
          window.location.href = targetUrl;
        } else {
          // If we are already at the target, do nothing
        }
      }
    }
  }, [user, isRedirecting]);

  const handleOnboardingComplete = React.useCallback((lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
    if (user) {
      localStorage.setItem(`onboarding_completed_${user.uid}`, 'true');
    }
    setShowOnboarding(false);
  }, [user]);

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
            
            if (Array.isArray(txs)) setTransactions(prev => JSON.stringify(prev) === JSON.stringify(txs) ? prev : txs);
            if (bot && typeof bot === 'object') {
              setBotConfig(prev => {
                const next = { ...prev, ...bot };
                return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
              });
            }
            if (Array.isArray(msgs)) setMessages(prev => JSON.stringify(prev) === JSON.stringify(msgs) ? prev : msgs);
            if (Array.isArray(users)) setAllUsers(prev => JSON.stringify(prev) === JSON.stringify(users) ? prev : users);
            if (Array.isArray(teamsData)) setTeams(prev => JSON.stringify(prev) === JSON.stringify(teamsData) ? prev : teamsData);
            if (Array.isArray(assetsData)) setAssets(prev => JSON.stringify(prev) === JSON.stringify(assetsData) ? prev : assetsData);
            if (me) setUser(prev => JSON.stringify(prev) === JSON.stringify(me) ? prev : me);
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

  const handleBootstrap = React.useCallback(async (e: React.FormEvent) => {
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
  }, [email, password, displayName]);

  const handleLogin = React.useCallback(async (e: React.FormEvent) => {
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
  }, [email, password]);

  const handleLogout = React.useCallback(() => api.logout(), []);

  const handleTrade = React.useCallback(async (asset: Asset, type: 'buy' | 'sell', amount: number) => {
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
  }, [user]);

  const handleDeposit = React.useCallback(async (amount: number) => {
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
  }, [user]);

  const handleWithdraw = React.useCallback(async (amount: number) => {
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
  }, [user]);

  const updateBotConfig = React.useCallback(async (newConfig: Partial<BotConfig>) => {
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
  }, [user, botConfig.botStartTime]);

  const createUser = React.useCallback(async (data: any) => {
    await api.createUser(data);
  }, []);

  const deleteUser = React.useCallback(async (uid: string) => {
    await api.deleteUser(uid);
    const users = await api.getUsers();
    setAllUsers(users);
  }, []);

  const createTeam = React.useCallback(async (data: any) => {
    await api.createTeam(data);
  }, []);

  const handleSendMessage = React.useCallback(async (receiverId: string, data: Partial<ChatMessage>) => {
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
  }, [user]);

  const handleDeleteMessage = React.useCallback(async (id: string) => {
    try {
      await fetch(`/api/messages/${id}`, { method: 'DELETE' });
      const msgs = await api.getMessages();
      setMessages(msgs);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleEditMessage = React.useCallback(async (id: string, text: string) => {
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
  }, []);

  const handleClearChat = React.useCallback(async (contactId: string, asSupport?: boolean) => {
    try {
      await fetch('/api/messages/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, asSupport })
      });
      const msgs = await api.getMessages();
      setMessages(msgs);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleMarkAsRead = React.useCallback(async (senderId: string, receiverId?: string) => {
    if (!user) return;
    try {
      const targetReceiverId = receiverId || user.uid;
      await fetch('/api/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId, receiverId: targetReceiverId })
      });
      // Update local state immediately for better UX
      setMessages(prev => prev.map(m => 
        (m.senderId === senderId && m.receiverId === targetReceiverId) 
          ? { ...m, read: true } 
          : m
      ));
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  const handleBotTrade = React.useCallback(async (trade: Partial<Transaction>) => {
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
  }, [user]);

  const handleUpdateUser = React.useCallback(async (uid: string, data: Partial<UserProfile>) => {
    await api.adminUpdateUser(uid, data);
    const users = await api.getUsers();
    setAllUsers(prev => JSON.stringify(prev) === JSON.stringify(users) ? prev : users);
  }, []);

  const handleCreateUser = React.useCallback(async (data: any) => {
    await createUser(data);
    const users = await api.getUsers();
    setAllUsers(prev => JSON.stringify(prev) === JSON.stringify(users) ? prev : users);
  }, [createUser]);

  const handleCreateTeamAction = React.useCallback(async (data: any) => {
    await createTeam(data);
    const teamsData = await api.getTeams();
    setTeams(prev => JSON.stringify(prev) === JSON.stringify(teamsData) ? prev : teamsData);
  }, [createTeam]);

  const handleUpdateTeamAction = React.useCallback(async (id: string, data: Partial<Team>) => {
    await api.updateTeam(id, data);
    const teamsData = await api.getTeams();
    setTeams(prev => JSON.stringify(prev) === JSON.stringify(teamsData) ? prev : teamsData);
  }, []);

  const handleDeleteTeamAction = React.useCallback(async (id: string) => {
    await api.deleteTeam(id);
    const teamsData = await api.getTeams();
    setTeams(prev => JSON.stringify(prev) === JSON.stringify(teamsData) ? prev : teamsData);
  }, []);

  const handleAdminCreateTransaction = React.useCallback(async (data: any) => {
    try {
      await api.adminCreateTransaction(data);
      const [users, txs] = await Promise.all([
        api.getUsers(),
        api.getTransactions()
      ]);
      setAllUsers(prev => JSON.stringify(prev) === JSON.stringify(users) ? prev : users);
      setTransactions(prev => JSON.stringify(prev) === JSON.stringify(txs) ? prev : txs);
    } catch (e) {
      console.error("Failed to create admin transaction", e);
    }
  }, []);

  const handleUpdateDisplayName = React.useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const newName = e.target.value;
    setUser(prev => prev ? { ...prev, displayName: newName } : null);
    try {
      await fetch(`/api/admin/update-user/${user.uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: newName })
      });
    } catch (e) {
      console.error("Failed to update display name", e);
    }
  }, [user]);

  const handleSetNewPassword = React.useCallback(() => {
    if (!user) return;
    const newPass = prompt('Enter new password:');
    if (newPass) {
      fetch(`/api/admin/update-user/${user.uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPass })
      }).then(() => alert('Password updated successfully'))
        .catch(e => console.error("Failed to update password", e));
    }
  }, [user]);

  const handleSetLanguage = React.useCallback((langCode: Language) => {
    setLanguage(langCode);
    localStorage.setItem('app_language', langCode);
  }, []);

  const handleViewAllWallet = React.useCallback(() => setActiveTab('wallet'), []);

  const unreadMessagesCount = React.useMemo(() => 
    messages.filter(m => m.receiverId === user?.uid && !m.read).length,
    [messages, user?.uid]
  );

  const chatContacts = React.useMemo(() => {
    if (!user) return [];
    if (user.role === 'client') {
      return [
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
      ];
    }
    return allUsers.filter(u => u.uid !== user.uid);
  }, [allUsers, user]);

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
              Professional banking and trading platform for the modern investor.
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
        user.role === 'client' ? (
          <Dashboard 
            user={user} 
            transactions={transactions} 
            onViewAll={handleViewAllWallet} 
            language={language}
          />
        ) : (
          <AdminDashboard
            user={user}
            allUsers={allUsers}
            teams={teams}
            messages={messages}
            language={language}
          />
        )
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
      {activeTab === 'trading' && <Trading user={user} assets={assets} language={language} />}
      {activeTab === 'offers' && <Offers user={user} language={language} />}
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
          contacts={chatContacts}
        />
      )}
      {(activeTab === 'admin' || activeTab === 'master') && (
            <Management 
              currentUser={user} 
              users={allUsers} 
              teams={teams}
              transactions={transactions}
              onUpdateUser={handleUpdateUser}
              onCreateUser={handleCreateUser}
              onCreateTeam={handleCreateTeamAction}
              onUpdateTeam={handleUpdateTeamAction}
              onDeleteTeam={handleDeleteTeamAction}
              onDeleteUser={deleteUser}
              onCreateTransaction={handleAdminCreateTransaction}
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
                  { code: 'bg', label: 'Български' },
                  { code: 'pl', label: 'Polski' },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleSetLanguage(lang.code as Language)}
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
                    onChange={handleUpdateDisplayName}
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
                  {user.role === 'client' ? (user.isActivated ? 'Active Account' : 'NOT ACTIVATED') : user.role}
                </span>
                {user.role === 'client' && !user.isActivated && (
                  <p className="text-xs text-red-600 font-bold">Account needs activation</p>
                )}
              </div>
            </div>
            <div className="pt-6 border-t border-gray-100">
              <label className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 block">Change Password</label>
              <button 
                onClick={handleSetNewPassword}
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
