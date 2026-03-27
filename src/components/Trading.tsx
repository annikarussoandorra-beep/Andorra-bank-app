import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight,
  Zap,
  DollarSign,
  BarChart3,
  List
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { cn } from '../lib/utils';
import { Asset, UserProfile } from '../types';
import { Language, translations } from '../translations';

const generateMockData = (base: number) => {
  return Array.from({ length: 20 }, (_, i) => ({
    time: i,
    price: base + Math.random() * (base * 0.05) - (base * 0.025)
  }));
};

const generateOrderBook = (base: number) => {
  const asks = Array.from({ length: 5 }, (_, i) => ({
    price: base * (1 + (i + 1) * 0.001),
    amount: Math.random() * 10 + 1
  })).reverse();
  
  const bids = Array.from({ length: 5 }, (_, i) => ({
    price: base * (1 - (i + 1) * 0.001),
    amount: Math.random() * 10 + 1
  }));
  
  return { asks, bids };
};

interface TradingProps {
  user: UserProfile;
  assets: Asset[];
  language: Language;
}

export default React.memo(function Trading({ user, assets, language }: TradingProps) {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(Array.isArray(assets) && assets.length > 0 ? assets[0] : null);
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [chartData, setChartData] = useState(generateMockData(selectedAsset?.currentPrice || 1000));
  const [orderBook, setOrderBook] = useState(generateOrderBook(selectedAsset?.currentPrice || 1000));

  const filteredAssets = Array.isArray(assets) ? assets.filter(a => 
    a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  useEffect(() => {
    if (!selectedAsset && Array.isArray(assets) && assets.length > 0) {
      setSelectedAsset(assets[0]);
    }
  }, [assets]);

  useEffect(() => {
    if (selectedAsset) {
      setChartData(generateMockData(selectedAsset.currentPrice));
      setOrderBook(generateOrderBook(selectedAsset.currentPrice));
      
      const interval = setInterval(() => {
        setChartData(prev => {
          const newData = [...prev.slice(1)];
          const lastPrice = newData[newData.length - 1].price;
          newData.push({
            time: prev[prev.length - 1].time + 1,
            price: lastPrice + Math.random() * (selectedAsset.currentPrice * 0.01) - (selectedAsset.currentPrice * 0.005)
          });
          return newData;
        });
        setOrderBook(generateOrderBook(selectedAsset.currentPrice));
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [selectedAsset]);

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4 lg:gap-8">
      {/* Asset List */}
      <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[400px] lg:h-[calc(100vh-12rem)]">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'ru' ? 'Поиск активов...' : 'Search assets...'}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#FF0000]/20"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredAssets.map((asset) => (
            <button
              key={asset.symbol}
              onClick={() => setSelectedAsset(asset)}
              className={cn(
                "w-full p-3 lg:p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-50",
                selectedAsset?.symbol === asset.symbol && "bg-red-50 border-l-4 border-l-[#FF0000]"
              )}
            >
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-[10px] lg:text-xs">
                  {asset.symbol.substring(0, 2)}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-xs lg:text-sm">{asset.symbol}</p>
                  <p className="text-[10px] lg:text-xs text-gray-500 truncate max-w-[80px] lg:max-w-none">{asset.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-xs lg:text-sm">{asset.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
                <p className={cn(
                  "text-[10px] lg:text-xs font-medium flex items-center justify-end gap-1",
                  asset.change24h >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {asset.change24h >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {asset.change24h}%
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Trading Area */}
      <div className="lg:col-span-3 space-y-4 lg:space-y-8">
        {/* Balance Header */}
        <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] lg:text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{t.balance}</p>
            <h3 className="text-xl lg:text-2xl font-bold text-gray-900">
              {user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </h3>
          </div>
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
            <DollarSign size={20} />
          </div>
        </div>
        {selectedAsset && (
          <>
            {/* Chart Section */}
            <div className="bg-white p-4 lg:p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-[#FF0000] text-white flex items-center justify-center font-bold text-lg lg:text-xl">
                    {selectedAsset.symbol.substring(0, 1)}
                  </div>
                  <div>
                    <h2 className="text-xl lg:text-2xl font-bold">{selectedAsset.name}</h2>
                    <p className="text-xs lg:text-sm text-gray-500">{selectedAsset.symbol} / €</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-2xl lg:text-3xl font-bold">{selectedAsset.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
                  <p className={cn(
                    "text-xs lg:text-sm font-medium",
                    selectedAsset.change24h >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {selectedAsset.change24h >= 0 ? '+' : ''}{selectedAsset.change24h}% (24h)
                  </p>
                </div>
              </div>

              <div className="h-[250px] lg:h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={selectedAsset.change24h >= 0 ? "#10B981" : "#EF4444"} stopOpacity={0.1}/>
                        <stop offset="95%" stopColor={selectedAsset.change24h >= 0 ? "#10B981" : "#EF4444"} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9CA3AF'}} dx={-10} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                      labelStyle={{ display: 'none' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke={selectedAsset.change24h >= 0 ? "#10B981" : "#EF4444"} 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#colorPrice)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8">
              {/* Asset Info */}
              <div className="bg-white p-4 lg:p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <BarChart3 size={20} className="text-blue-500" />
                  {language === 'ru' ? 'Инфо об активе' : 'Asset Info'}
                </h3>
                <div className="grid grid-cols-2 gap-4 lg:gap-6">
                  <div>
                    <p className="text-[10px] lg:text-xs text-gray-500 uppercase tracking-wider mb-1">{language === 'ru' ? 'Капитализация' : 'Market Cap / Value'}</p>
                    <p className="text-sm lg:text-base font-bold">1.2T €</p>
                  </div>
                  <div>
                    <p className="text-[10px] lg:text-xs text-gray-500 uppercase tracking-wider mb-1">{language === 'ru' ? 'Объем (24ч)' : 'Volume (24h)'}</p>
                    <p className="text-sm lg:text-base font-bold">45.8B €</p>
                  </div>
                  <div>
                    <p className="text-[10px] lg:text-xs text-gray-500 uppercase tracking-wider mb-1">{language === 'ru' ? 'Макс. за 52 нед.' : '52W High'}</p>
                    <p className="text-sm lg:text-base font-bold">{(selectedAsset.currentPrice * 1.2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
                  </div>
                  <div>
                    <p className="text-[10px] lg:text-xs text-gray-500 uppercase tracking-wider mb-1">{language === 'ru' ? 'Тип актива' : 'Asset Type'}</p>
                    <p className="text-sm lg:text-base font-bold capitalize">{selectedAsset.type || 'Asset'}</p>
                  </div>
                </div>
              </div>

              {/* Order Book */}
              <div className="bg-white p-4 lg:p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <List size={20} className="text-purple-500" />
                  {language === 'ru' ? 'Стакан заявок' : 'Order Book'}
                </h3>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div className="flex justify-between text-[10px] lg:text-xs text-gray-500 uppercase tracking-wider mb-2 pb-2 border-b border-gray-100">
                      <span>{language === 'ru' ? 'Цена' : 'Price'} (€)</span>
                      <span>{language === 'ru' ? 'Объем' : 'Amount'}</span>
                    </div>
                    <div className="space-y-1">
                      {orderBook.asks.map((ask, i) => (
                        <div key={`ask-${i}`} className="flex justify-between text-xs lg:text-sm relative overflow-hidden rounded py-1 px-2">
                          <div 
                            className="absolute right-0 top-0 bottom-0 bg-red-50 z-0" 
                            style={{ width: `${(ask.amount / 11) * 100}%` }}
                          />
                          <span className="text-red-600 font-medium z-10">{ask.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          <span className="z-10">{ask.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] lg:text-xs text-gray-500 uppercase tracking-wider mb-2 pb-2 border-b border-gray-100">
                      <span>{language === 'ru' ? 'Цена' : 'Price'} (€)</span>
                      <span>{language === 'ru' ? 'Объем' : 'Amount'}</span>
                    </div>
                    <div className="space-y-1">
                      {orderBook.bids.map((bid, i) => (
                        <div key={`bid-${i}`} className="flex justify-between text-xs lg:text-sm relative overflow-hidden rounded py-1 px-2">
                          <div 
                            className="absolute right-0 top-0 bottom-0 bg-green-50 z-0" 
                            style={{ width: `${(bid.amount / 11) * 100}%` }}
                          />
                          <span className="text-green-600 font-medium z-10">{bid.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          <span className="z-10">{bid.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
);
