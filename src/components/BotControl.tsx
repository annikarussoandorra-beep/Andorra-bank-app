import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';
import { 
  Bot, 
  Play, 
  Pause, 
  Settings2, 
  Shield, 
  Zap, 
  TrendingUp,
  History,
  AlertCircle,
  RefreshCw,
  Clock,
  Share2,
  Download,
  X as CloseIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { BotConfig, UserProfile, Asset, Transaction } from '../types';

interface BotControlProps {
  user: UserProfile;
  config: BotConfig;
  onUpdateConfig: (newConfig: Partial<BotConfig>) => void;
  onTrade: (trade: Partial<Transaction>) => void;
  availableAssets: Asset[];
  transactions: Transaction[];
  demoTimeLeft: number;
}

export default function BotControl({ user, config, onUpdateConfig, onTrade, availableAssets, transactions, demoTimeLeft }: BotControlProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (config.active && config.botStartTime) {
      const updateElapsed = () => {
        const now = Date.now();
        const diff = Math.floor((now - config.botStartTime!) / 1000);
        setElapsedTime(Math.max(0, diff));
      };
      updateElapsed();
      interval = setInterval(updateElapsed, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [config.active, config.botStartTime]);

  const tradeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstTradeRef = useRef(true);

  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  // Calculate real stats from transactions
  const tradeTransactions = safeTransactions
    .filter(t => t.type === 'buy' || t.type === 'sell')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const totalProfit = tradeTransactions.reduce((acc, t) => acc + t.amount, 0);
  const wins = tradeTransactions.filter(t => t.amount > 0).length;
  const winRate = tradeTransactions.length > 0 ? (wins / tradeTransactions.length) * 100 : 0;
  const profitChange = user.balance > 0 ? (totalProfit / user.balance) * 100 : 0;

  const recentActivity = tradeTransactions.slice(0, 5);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsCapturing(true);
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, quality: 1, pixelRatio: 2 });
      saveAs(dataUrl, `andorra-bot-profit-${Date.now()}.png`);
    } catch (err) {
      console.error('Failed to download image', err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    setIsCapturing(true);
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, quality: 1, pixelRatio: 2 });
      
      if (navigator.share) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'profit-card.png', { type: 'image/png' });
        
        await navigator.share({
          files: [file],
          title: 'My AI Bot Profit',
          text: '',
        });
      } else {
        // Fallback for browsers that don't support sharing files
        handleDownload();
      }
    } catch (err) {
      console.error('Failed to share', err);
      // Fallback to download if share fails
      handleDownload();
    } finally {
      setIsCapturing(false);
    }
  };

  useEffect(() => {
    if (config.active && (user.isActivated || demoTimeLeft > 0)) {
      // First trade immediately
      if (isFirstTradeRef.current) {
        generateTrade();
        isFirstTradeRef.current = false;
      }

      const scheduleNextTrade = () => {
        const nextInterval = Math.floor(Math.random() * (60000 - 10000 + 1) + 10000); // 10-60 seconds
        tradeIntervalRef.current = setTimeout(() => {
          generateTrade();
          scheduleNextTrade();
        }, nextInterval);
      };

      scheduleNextTrade();
    } else {
      if (tradeIntervalRef.current) {
        clearTimeout(tradeIntervalRef.current);
      }
    }

    return () => {
      if (tradeIntervalRef.current) {
        clearTimeout(tradeIntervalRef.current);
      }
    };
  }, [config.active, demoTimeLeft]);

  const generateTrade = () => {
    if (demoTimeLeft <= 0) return;

    const assetsToUse = config.autoSelectAssets 
      ? (availableAssets || []).map(a => a.symbol)
      : (config.assets || []);
    
    if (!assetsToUse || assetsToUse.length === 0) return;

    const randomAssetSymbol = assetsToUse[Math.floor(Math.random() * assetsToUse.length)];
    const asset = (availableAssets || []).find(a => a.symbol === randomAssetSymbol);
    if (!asset) return;

    // All trades are profitable as per user request
    const isWin = true; 
    
    // Profit limits: 100-120 EUR per 24 hours
    // Assuming ~100 trades per day (every ~15 mins, but here it's 10-60s, so many more)
    // Let's say 100-120 EUR / (24 * 60 * 60 / 30) = ~0.03 - 0.05 EUR per trade
    // But user says "доход не должен превышать +-100 евро за 24 часа"
    // So we need to check total profit in last 24h
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    const profitLast24h = tradeTransactions
      .filter(t => new Date(t.timestamp).getTime() > twentyFourHoursAgo)
      .reduce((acc, t) => acc + t.amount, 0);

    const maxDailyProfit = config.strategy === 'aggressive' ? 120 : 100;
    
    if (profitLast24h >= maxDailyProfit) {
      console.log('Daily profit limit reached');
      return;
    }

    const profitPercent = config.strategy === 'conservative' 
      ? (Math.random() * 0.8 + 0.3) / 100 
      : (Math.random() * 1.5 + 0.5) / 100;
    
    const investment = Math.min(config.maxInvestment, user.balance * 0.1);
    let profit = Number((investment * profitPercent).toFixed(2));

    // Adjust profit if it would exceed daily limit
    if (profitLast24h + profit > maxDailyProfit) {
      profit = Number((maxDailyProfit - profitLast24h).toFixed(2));
    }

    if (profit <= 0) return;

    onTrade({
      type: 'sell', // All profitable trades are 'sell' for simplicity in this mock
      amount: profit,
      asset: asset.symbol,
      price: asset.currentPrice,
    });
  };

  return (
    <div className="space-y-4 lg:space-y-8">
      {/* Balance Header */}
      <div className="bg-white p-4 lg:p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-[10px] lg:text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Available Balance</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-xl lg:text-3xl font-bold text-gray-900">
              {user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-sm lg:text-lg font-bold text-gray-400">€</span>
          </div>
        </div>
        <div className="p-3 bg-green-50 rounded-2xl text-green-600">
          <TrendingUp size={24} className="lg:w-8 lg:h-8" />
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 lg:p-10 rounded-3xl shadow-2xl text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 lg:gap-8">
          <div className="flex items-center gap-4 lg:gap-6">
            <div className={cn(
              "w-16 h-16 lg:w-20 lg:h-20 rounded-2xl lg:rounded-3xl flex items-center justify-center shadow-2xl transition-all duration-500",
              config.active ? "bg-green-500 animate-pulse" : "bg-gray-700"
            )}>
              <Bot size={32} className="lg:w-10 lg:h-10 text-white" />
            </div>
              <div>
                <h2 className="text-xl lg:text-3xl font-bold mb-1 lg:mb-2">Andorra AI Bot</h2>
                <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                  <span className={cn(
                    "px-2 lg:px-3 py-0.5 lg:py-1 rounded-full text-[10px] lg:text-xs font-bold uppercase tracking-widest",
                    config.active ? "bg-green-500/20 text-green-400" : "bg-gray-600 text-gray-400"
                  )}>
                    {config.active ? 'Running' : 'Paused'}
                  </span>
                  {config.active && (
                    <div className="flex items-center gap-1.5 px-2 lg:px-3 py-0.5 lg:py-1 bg-white/10 rounded-full border border-white/20">
                      <Clock size={10} className="text-white/60" />
                      <span className="text-[10px] lg:text-xs font-mono text-white/80">
                        {formatTime(elapsedTime)}
                      </span>
                    </div>
                  )}
                  <span className="text-xs lg:text-sm text-gray-400">Strategy: <span className="text-white font-medium capitalize">{config.strategy}</span></span>
                  {user.isActivated ? (
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full border border-green-500/30">
                      <Shield size={12} className="text-green-400" />
                      <span className="text-[10px] lg:text-xs font-bold text-green-400 uppercase">
                        Account Activated
                      </span>
                    </div>
                  ) : demoTimeLeft > 0 ? (
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-full border border-blue-500/30">
                      <Clock size={12} className="text-blue-400" />
                      <span className="text-[10px] lg:text-xs font-bold text-blue-400 font-mono">
                        Demo Time: {formatTime(demoTimeLeft)}
                      </span>
                    </div>
                  ) : (
                    <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-[10px] lg:text-xs font-bold border border-red-500/30">
                      Demo Expired - Activate Account
                    </span>
                  )}
                </div>
                <p className="text-[10px] lg:text-xs text-white/60 mt-2 italic">
                  * {user.isActivated ? 'Real-time trading active.' : 'Real-time trading with company funds for demonstration purposes.'}
                </p>
              </div>
          </div>
          <button 
            disabled={!user.isActivated && demoTimeLeft <= 0}
            onClick={() => onUpdateConfig({ active: !config.active })}
            className={cn(
              "w-full md:w-auto px-6 lg:px-10 py-3 lg:py-4 rounded-xl lg:rounded-2xl font-bold text-base lg:text-lg transition-all flex items-center justify-center gap-2 lg:gap-3 shadow-xl",
              (!user.isActivated && demoTimeLeft <= 0) ? "bg-gray-600 cursor-not-allowed" :
              config.active 
                ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" 
                : "bg-green-500 hover:bg-green-600 shadow-green-500/20"
            )}
          >
            {(!user.isActivated && demoTimeLeft <= 0) ? <><AlertCircle size={20} className="lg:w-6 lg:h-6" /> Demo Expired</> :
             config.active ? <><Pause size={20} className="lg:w-6 lg:h-6" /> Stop Bot</> : <><Play size={20} className="lg:w-6 lg:h-6" /> Start Bot</>}
          </button>
        </div>
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-12 translate-x-1/2"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
        {/* Configuration */}
        <div className="lg:col-span-2 bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <h3 className="text-lg lg:text-xl font-bold flex items-center gap-2">
              <Settings2 size={20} className="lg:w-6 lg:h-6 text-[#FF0000]" />
              Bot Configuration
            </h3>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs lg:text-sm font-bold text-[#FF0000] hover:underline"
            >
              {isEditing ? 'Save Changes' : 'Edit Settings'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] lg:text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 lg:mb-3 block">Trading Strategy</label>
                <div className="grid grid-cols-2 gap-3 lg:gap-4">
                  <button 
                    disabled={!isEditing}
                    onClick={() => onUpdateConfig({ strategy: 'conservative' })}
                    className={cn(
                      "p-3 lg:p-4 rounded-xl lg:rounded-2xl border-2 transition-all flex flex-col gap-1 lg:gap-2",
                      config.strategy === 'conservative' 
                        ? "border-[#FF0000] bg-red-50" 
                        : "border-gray-100 hover:border-gray-200"
                    )}
                  >
                    <Shield size={18} className={config.strategy === 'conservative' ? "text-[#FF0000]" : "text-gray-400"} />
                    <span className="font-bold text-xs lg:text-sm">Conservative</span>
                    <span className="text-[10px] lg:text-xs text-gray-500">Low risk</span>
                  </button>
                  <button 
                    disabled={!isEditing}
                    onClick={() => onUpdateConfig({ strategy: 'aggressive' })}
                    className={cn(
                      "p-3 lg:p-4 rounded-xl lg:rounded-2xl border-2 transition-all flex flex-col gap-1 lg:gap-2",
                      config.strategy === 'aggressive' 
                        ? "border-[#FF0000] bg-red-50" 
                        : "border-gray-100 hover:border-gray-200"
                    )}
                  >
                    <Zap size={18} className={config.strategy === 'aggressive' ? "text-[#FF0000]" : "text-gray-400"} />
                    <span className="font-bold text-xs lg:text-sm">Aggressive</span>
                    <span className="text-[10px] lg:text-xs text-gray-500">High risk</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] lg:text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 lg:mb-3 block">Max Investment Per Trade</label>
                <div className="relative">
                  <input 
                    type="number" 
                    disabled={!isEditing}
                    value={config.maxInvestment}
                    onChange={(e) => onUpdateConfig({ maxInvestment: Number(e.target.value) })}
                    className="w-full px-4 py-3 lg:py-4 bg-gray-50 border-none rounded-xl lg:rounded-2xl text-lg lg:text-xl font-bold focus:ring-2 focus:ring-[#FF0000]/20 disabled:opacity-50"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm lg:text-base">€</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2 lg:mb-3">
                  <label className="text-[10px] lg:text-sm font-bold text-gray-400 uppercase tracking-wider">Target Assets</label>
                  <button
                    disabled={!isEditing}
                    onClick={() => onUpdateConfig({ autoSelectAssets: !config.autoSelectAssets })}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all",
                      config.autoSelectAssets ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                    )}
                  >
                    <RefreshCw size={12} className={config.autoSelectAssets ? "animate-spin-slow" : ""} />
                    {config.autoSelectAssets ? 'Auto-select ON' : 'Auto-select OFF'}
                  </button>
                </div>
                {!config.autoSelectAssets ? (
                  <div className="flex flex-wrap gap-2">
                    {(availableAssets || []).map((asset) => (
                      <button
                        key={asset.symbol}
                        disabled={!isEditing}
                        onClick={() => {
                          const currentAssets = config.assets || [];
                          const newAssets = currentAssets.includes(asset.symbol)
                            ? currentAssets.filter(a => a !== asset.symbol)
                            : [...currentAssets, asset.symbol];
                          onUpdateConfig({ assets: newAssets });
                        }}
                        className={cn(
                          "px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg lg:rounded-xl text-xs lg:text-sm font-bold transition-all",
                          (config.assets || []).includes(asset.symbol)
                            ? "bg-[#FF0000] text-white"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        )}
                      >
                        {asset.symbol}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
                    <p className="text-xs text-gray-500 italic">Bot is automatically selecting the best assets for your strategy.</p>
                  </div>
                )}
              </div>
              <div className="p-4 lg:p-6 bg-blue-50 rounded-xl lg:rounded-2xl border border-blue-100 flex gap-3 lg:gap-4">
                <AlertCircle className="text-blue-600 shrink-0 lg:w-6 lg:h-6" size={20} />
                <p className="text-xs lg:text-sm text-blue-800 leading-relaxed">
                  Our AI bot uses advanced machine learning algorithms to analyze market trends and execute trades automatically.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bot Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-8">
          <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-base lg:text-lg font-bold mb-4 lg:mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="lg:w-5 lg:h-5 text-green-500" />
              Bot Performance
            </h3>
            <div className="space-y-4 lg:space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] lg:text-xs text-gray-500 uppercase mb-1">Total Profit</p>
                  <p className={cn(
                    "text-xl lg:text-2xl font-bold",
                    totalProfit >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {totalProfit >= 0 ? '+' : ''}{totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </p>
                </div>
                <span className={cn(
                  "text-[10px] lg:text-xs font-bold px-2 py-1 rounded-lg",
                  profitChange >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                )}>
                  {profitChange >= 0 ? '+' : ''}{profitChange.toFixed(1)}%
                </span>
              </div>
              <button 
                onClick={() => setShowShareModal(true)}
                className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-black transition-colors"
              >
                <Share2 size={16} />
                Share Result
              </button>
            </div>
          </div>

          <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-base lg:text-lg font-bold mb-4 lg:mb-6 flex items-center gap-2">
              <History size={18} className="lg:w-5 lg:h-5 text-purple-500" />
              Recent Bot Activity
            </h3>
            <div className="space-y-3 lg:space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-xs lg:text-sm">
                    <div className="flex items-center gap-2 lg:gap-3">
                      <div className={cn(
                        "w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full",
                        t.amount > 0 ? "bg-green-500" : "bg-red-500"
                      )}></div>
                      <span className="font-medium">
                        {t.type === 'buy' ? 'Bought' : 'Sold'} {t.asset}
                      </span>
                    </div>
                    <span className="text-gray-400">
                      {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-gray-400 italic">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-[2rem] shadow-2xl overflow-hidden max-w-sm w-full"
            >
              {/* Share Card Content */}
              <div ref={cardRef} className="bg-gradient-to-br from-[#FF0000] to-red-600 p-8 text-white relative">
                <div className="flex items-center gap-2 mb-12">
                  <Shield size={24} />
                  <span className="font-bold tracking-tight text-lg">ANDORRA BANK</span>
                </div>
                
                <div className="space-y-1 mb-12">
                  <p className="text-white/60 text-xs uppercase font-bold tracking-widest">Bot Trading Profit</p>
                  <h2 className="text-5xl font-black">+{totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</h2>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest mb-1">Strategy</p>
                    <p className="font-bold capitalize">{config.strategy}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest mb-1">Status</p>
                    <p className="font-bold">Verified AI</p>
                  </div>
                </div>

                <div className="mt-12 pt-8 border-t border-white/20 flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest mb-1">User</p>
                    <p className="font-bold text-sm">{user.displayName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest mb-1">Date</p>
                    <p className="font-bold text-sm">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Decorative Pattern */}
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-tl-full translate-x-12 translate-y-12"></div>
              </div>

              <div className="p-8 space-y-4">
                <div className="flex gap-3">
                  <button 
                    disabled={isCapturing}
                    onClick={handleShare}
                    className="flex-1 bg-[#FF0000] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {isCapturing ? <RefreshCw size={18} className="animate-spin" /> : <Share2 size={18} />}
                    Share
                  </button>
                  <button 
                    disabled={isCapturing}
                    onClick={handleDownload}
                    className="p-4 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {isCapturing ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
                  </button>
                </div>
                
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="w-full py-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
