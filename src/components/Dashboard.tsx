import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CreditCard
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '../lib/utils';
import { UserProfile, Transaction } from '../types';
import { Language, translations } from '../translations';

interface DashboardProps {
  user: UserProfile;
  transactions: Transaction[];
  onViewAll?: () => void;
  language: Language;
}

type Timeframe = '1W' | '1M' | '1Y';

export default React.memo(function Dashboard({ user, transactions, onViewAll, language }: DashboardProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('1W');
  const t = translations[language];
  const safeTransactions = Array.isArray(transactions) ? [...transactions] : [];
  
  // Sort transactions by date descending for recent activity
  const sortedTransactions = safeTransactions.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const monthlyProfit = safeTransactions
    .filter(tx => {
      if (!tx.timestamp) return false;
      const txDate = new Date(tx.timestamp);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return txDate > thirtyDaysAgo && tx.status === 'completed';
    })
    .reduce((acc, tx) => {
      if (tx.type === 'sell') return acc + tx.amount;
      if (tx.type === 'buy') return acc - tx.amount;
      return acc;
    }, 0);

  const activeTrades = safeTransactions.filter(tx => tx.status === 'pending').length;
  
  // Generate real chart data from transactions based on timeframe
  const chartData = useMemo(() => {
    const now = new Date();
    let points = 7;
    let interval = 1; // days
    let labelFormat: Intl.DateTimeFormatOptions = { weekday: 'short' };

    if (timeframe === '1M') {
      points = 30;
      interval = 1;
      labelFormat = { day: 'numeric', month: 'short' };
    } else if (timeframe === '1Y') {
      points = 12;
      interval = 30;
      labelFormat = { month: 'short' };
    }

    const dataPoints = [];
    
    for (let i = 0; i < points; i++) {
      const d = new Date();
      if (timeframe === '1Y') {
        d.setMonth(d.getMonth() - i);
      } else {
        d.setDate(d.getDate() - i);
      }

      const label = d.toLocaleDateString('en-US', labelFormat);
      const dayStart = new Date(d.setHours(0,0,0,0));
      const dayEnd = new Date(d.setHours(23,59,59,999));
      
      const netChange = safeTransactions
        .filter(tx => {
          if (!tx.timestamp) return false;
          const txDate = new Date(tx.timestamp);
          if (timeframe === '1Y') {
            return txDate.getMonth() === d.getMonth() && txDate.getFullYear() === d.getFullYear() && tx.status === 'completed';
          }
          return txDate >= dayStart && txDate <= dayEnd && tx.status === 'completed';
        })
        .reduce((acc, tx) => {
          if (['deposit', 'bonus', 'sell', 'transfer', 'overdraft'].includes(tx.type)) return acc + tx.amount;
          if (['withdrawal', 'buy', 'credit'].includes(tx.type)) return acc - tx.amount;
          return acc;
        }, 0);
        
      dataPoints.unshift({ name: label, netChange, date: new Date(d), value: 0 });
    }

    let runningBalance = user.balance || 0;
    for (let i = dataPoints.length - 1; i >= 0; i--) {
      dataPoints[i].value = Math.max(0, runningBalance);
      runningBalance -= dataPoints[i].netChange;
    }

    return dataPoints.map(dp => ({ name: dp.name, value: Number(dp.value.toFixed(2)) }));
  }, [safeTransactions, timeframe, user.balance]);

  return (
    <div className="space-y-4 lg:space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Wallet size={20} className="lg:w-6 lg:h-6" />
            </div>
            <span className="text-[10px] lg:text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+2.5%</span>
          </div>
          <p className="text-xs lg:text-sm text-gray-500 mb-1">Total Balance</p>
          <h3 className="text-xl lg:text-2xl font-bold">{(user.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</h3>
        </div>

        <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <TrendingUp size={20} className="lg:w-6 lg:h-6" />
            </div>
            <span className={cn(
              "text-[10px] lg:text-xs font-medium px-2 py-1 rounded-full",
              monthlyProfit >= 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
            )}>
              {monthlyProfit >= 0 ? '+12.3%' : '-5.2%'}
            </span>
          </div>
          <p className="text-xs lg:text-sm text-gray-500 mb-1">Monthly Profit</p>
          <h3 className={cn(
            "text-xl lg:text-2xl font-bold",
            monthlyProfit >= 0 ? "text-green-600" : "text-red-600"
          )}>
            {monthlyProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </h3>
        </div>

        <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <CreditCard size={20} className="lg:w-6 lg:h-6" />
            </div>
          </div>
          <p className="text-xs lg:text-sm text-gray-500 mb-1">Active Trades</p>
          <h3 className="text-xl lg:text-2xl font-bold">{activeTrades || 0}</h3>
        </div>

        <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
              <Clock size={20} className="lg:w-6 lg:h-6" />
            </div>
          </div>
          <p className="text-xs lg:text-sm text-gray-500 mb-1">{t.trades}</p>
          <h3 className="text-xl lg:text-2xl font-bold">{activeTrades}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-4 lg:p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h3 className="text-lg font-semibold">Portfolio Performance</h3>
            <div className="flex gap-2">
              {(['1W', '1M', '1Y'] as Timeframe[]).map((tf) => (
                <button 
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={cn(
                    "flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                    timeframe === tf ? "bg-[#FF0000] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[250px] lg:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF0000" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#FF0000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9CA3AF'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9CA3AF'}} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="value" stroke="#FF0000" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-4 lg:p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6">{t.recent_activity}</h3>
          <div className="space-y-4 lg:space-y-6">
            {sortedTransactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className={cn(
                    "p-2 rounded-xl",
                    ['deposit', 'sell', 'bonus', 'transfer'].includes(tx.type) ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                  )}>
                    {['deposit', 'sell', 'bonus', 'transfer'].includes(tx.type) ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                  </div>
                  <div>
                    <p className="text-xs lg:text-sm font-medium capitalize truncate max-w-[100px] sm:max-w-none">{translations[language][tx.type as keyof typeof translations['en']] || tx.type} {tx.asset}</p>
                    <p className="text-[10px] lg:text-xs text-gray-500">{tx.timestamp ? new Date(tx.timestamp).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
                <p className={cn(
                  "text-sm lg:text-base font-semibold",
                  ['deposit', 'sell', 'bonus', 'transfer'].includes(tx.type) ? "text-green-600" : "text-red-600"
                )}>
                  {['deposit', 'sell', 'bonus', 'transfer'].includes(tx.type) ? '+' : '-'}{(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            ))}
            {sortedTransactions.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                No transactions yet
              </div>
            )}
          </div>
          <button 
            onClick={onViewAll}
            className="w-full mt-6 lg:mt-8 py-3 text-sm font-medium text-[#FF0000] hover:bg-red-50 rounded-xl transition-colors"
          >
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
}
);
