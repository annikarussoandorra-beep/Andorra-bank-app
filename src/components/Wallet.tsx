import React, { useState } from 'react';
import { 
  Plus, 
  Minus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter,
  Download,
  CreditCard,
  Building2,
  Smartphone,
  Info,
  ExternalLink,
  X
} from 'lucide-react';
import { UserProfile, Transaction } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Language, translations } from '../translations';

interface WalletProps {
  user: UserProfile;
  transactions: Transaction[];
  onDeposit: (amount: number) => void;
  onWithdraw: (amount: number) => void;
  language: Language;
}

export default React.memo(function Wallet({ user, transactions, onDeposit, onWithdraw, language }: WalletProps) {
  const [amount, setAmount] = useState<string>('0');
  const t = translations[language];
  const [filter, setFilter] = useState<string>('all');
  const [activeAction, setActiveAction] = useState<'deposit' | 'withdraw' | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState<'bank' | 'mobile' | null>(null);
  const [bankDetails, setBankDetails] = useState({ name: '', surname: '', iban: '' });
  const [showActivationNotice, setShowActivationNotice] = useState(false);

  const safeTransactions = Array.isArray(transactions) ? [...transactions].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ) : [];

  const quickActionsRef = React.useRef<HTMLDivElement>(null);

  const scrollToActions = () => {
    quickActionsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleWithdrawClick = () => {
    setActiveAction('withdraw');
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      const input = document.querySelector('input[placeholder="0.00"]') as HTMLInputElement;
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    if (numAmount > user.balance) {
      alert(t.insufficient_balance || 'Insufficient balance');
      return;
    }
    scrollToActions();
  };

  const handleDepositClick = () => {
    setActiveAction('deposit');
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      const input = document.querySelector('input[placeholder="0.00"]') as HTMLInputElement;
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    scrollToActions();
  };

  const handleBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowActivationNotice(true);
    setShowWithdrawModal(null);
  };

  const handleMobilePay = () => {
    setShowActivationNotice(true);
  };

  const handleDetailsClick = () => {
    alert(t.account_details_alert || 'You cannot get account details until you activate your account. Please contact your manager.');
  };

  const filteredTransactions = safeTransactions.filter(tx => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

  return (
    <div className="space-y-4 lg:space-y-8">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
        <div className="lg:col-span-2 bg-[#FF0000] p-6 lg:p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8 lg:mb-12">
              <div className="flex items-center gap-3">
                <CreditCard size={24} className="lg:w-8 lg:h-8 opacity-80" />
                <div className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold uppercase tracking-widest">Visa System</div>
              </div>
              <div className="text-right">
                <p className="text-[10px] lg:text-sm opacity-60 uppercase tracking-widest">Andorra Bank Invest</p>
                <div className="flex items-center gap-1 justify-end mt-1">
                  <Info size={10} className="text-white/60" />
                  <p className="text-[8px] lg:text-xs text-white/60 font-bold">Account not activated</p>
                </div>
              </div>
            </div>
            <p className="text-sm lg:text-lg opacity-80 mb-2">{t.balance}</p>
            <h2 className="text-3xl lg:text-5xl font-bold mb-8 lg:mb-12">{user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</h2>
            <div className="flex items-center justify-between">
              <div className="flex gap-4 lg:gap-8">
                <div>
                  <p className="text-[8px] lg:text-xs opacity-60 uppercase mb-1">{t.account_holder}</p>
                  <p className="text-sm lg:text-base font-semibold">{user.displayName}</p>
                </div>
                <div>
                  <p className="text-[8px] lg:text-xs opacity-60 uppercase mb-1">{t.expires}</p>
                  <p className="text-sm lg:text-base font-semibold">12/28</p>
                </div>
              </div>
              <button 
                onClick={handleDetailsClick}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-xs font-bold"
              >
                <ExternalLink size={14} /> {t.details}
              </button>
            </div>
          </div>
          {/* Decorative Circles */}
          <div className="absolute -right-20 -top-20 w-48 h-48 lg:w-64 lg:h-64 bg-white/10 rounded-full"></div>
          <div className="absolute -right-10 -bottom-10 w-32 h-32 lg:w-48 lg:h-48 bg-white/5 rounded-full"></div>
        </div>

        <div ref={quickActionsRef} className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <h3 className="text-lg font-semibold mb-6">{t.quick_actions}</h3>
          <div className="space-y-4">
            <div className="relative">
              <input 
                type="text" 
                value={amount}
                onChange={(e) => {
                  let val = e.target.value.replace(/[^0-9.]/g, '');
                  if (val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) {
                    val = val.substring(1);
                  }
                  if (val === '') val = '0';
                  setAmount(val);
                }}
                onFocus={(e) => {
                  if (amount === '0') setAmount('');
                }}
                onBlur={(e) => {
                  if (amount === '') setAmount('0');
                }}
                className="w-full px-4 py-3 lg:py-4 bg-gray-50 border-none rounded-2xl text-lg lg:text-xl font-bold focus:ring-2 focus:ring-[#FF0000]/20"
                placeholder="0.00"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm lg:text-base">EUR</span>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:gap-4">
              <button 
                onClick={handleDepositClick}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 lg:py-4 rounded-2xl font-bold transition-all text-sm lg:text-base border-2",
                  activeAction === 'deposit' 
                    ? "bg-gray-900 text-white border-gray-900" 
                    : "bg-white text-gray-900 border-gray-100 hover:bg-gray-50"
                )}
              >
                <Plus size={18} /> {t.deposit}
              </button>
              <button 
                onClick={handleWithdrawClick}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 lg:py-4 rounded-2xl font-bold transition-all text-sm lg:text-base border-2",
                  activeAction === 'withdraw' 
                    ? "bg-gray-900 text-white border-gray-900" 
                    : "bg-white text-gray-900 border-gray-100 hover:bg-gray-50"
                )}
              >
                <Minus size={18} /> {t.withdraw}
              </button>
            </div>
          </div>
          <div className="mt-6 lg:mt-8 pt-6 lg:pt-8 border-t border-gray-50 grid grid-cols-2 gap-3 lg:gap-4">
            <button 
              onClick={() => setShowWithdrawModal('bank')}
              className="flex flex-col items-center gap-2 p-3 lg:p-4 hover:bg-gray-50 rounded-2xl transition-colors"
            >
              <Building2 size={20} className="lg:w-6 lg:h-6 text-blue-600" />
              <span className="text-[10px] lg:text-xs font-medium">{t.bank_transfer}</span>
            </button>
            <button 
              onClick={handleMobilePay}
              className="flex flex-col items-center gap-2 p-3 lg:p-4 hover:bg-gray-50 rounded-2xl transition-colors"
            >
              <Smartphone size={20} className="lg:w-6 lg:h-6 text-purple-600" />
              <span className="text-[10px] lg:text-xs font-medium">{t.mobile_pay}</span>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showWithdrawModal === 'bank' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold">Bank Transfer</h3>
                <button onClick={() => setShowWithdrawModal(null)} className="p-2 hover:bg-gray-100 rounded-xl">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleBankSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">First Name</label>
                    <input 
                      type="text" 
                      required
                      value={bankDetails.name}
                      onChange={(e) => setBankDetails({...bankDetails, name: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#FF0000]/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Last Name</label>
                    <input 
                      type="text" 
                      required
                      value={bankDetails.surname}
                      onChange={(e) => setBankDetails({...bankDetails, surname: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#FF0000]/20"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">IBAN</label>
                  <input 
                    type="text" 
                    required
                    placeholder="AD00 0000 0000 0000 0000 0000"
                    value={bankDetails.iban}
                    onChange={(e) => setBankDetails({...bankDetails, iban: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#FF0000]/20"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-[#FF0000] text-white rounded-2xl font-bold text-lg hover:bg-red-700 transition-all shadow-xl shadow-red-500/20"
                >
                  Confirm Withdrawal
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showActivationNotice && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Info size={40} className="text-[#FF0000]" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Account Not Activated</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Your account is currently in demo mode. You cannot withdraw demo funds. 
                Please contact your manager to complete the account activation process.
              </p>
              <button 
                onClick={() => setShowActivationNotice(false)}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-black transition-all"
              >
                Understood
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transaction History */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 lg:p-8 border-b border-gray-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h3 className="text-lg lg:text-xl font-bold">{t.recent_activity}</h3>
          <div className="flex flex-wrap items-center gap-2 lg:gap-4">
            <div className="flex-1 lg:flex-none relative min-w-[150px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-xs lg:text-sm focus:ring-2 focus:ring-[#FF0000]/20"
              />
            </div>
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-50 border-none rounded-xl text-xs lg:text-sm px-3 py-2 focus:ring-2 focus:ring-[#FF0000]/20"
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposits</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="buy">Buy Orders</option>
              <option value="sell">Sell Orders</option>
            </select>
            <button className="p-2 hover:bg-gray-50 rounded-xl text-gray-400">
              <Download size={18} />
            </button>
          </div>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 text-left">
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.transaction}</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.asset}</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.date}</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.status}</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">{t.amount}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2 rounded-xl",
                        ['deposit', 'sell', 'bonus', 'transfer'].includes(tx.type) ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                      )}>
                        {['deposit', 'sell', 'bonus', 'transfer'].includes(tx.type) ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                      </div>
                      <span className="font-semibold capitalize">{translations[language][tx.type as keyof typeof translations['en']] || tx.type}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="font-medium">{tx.asset || 'Cash'}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm text-gray-500">{new Date(tx.timestamp).toLocaleString()}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                      tx.status === 'completed' ? "bg-green-50 text-green-600" : 
                      tx.status === 'pending' ? "bg-yellow-50 text-yellow-600" : "bg-red-50 text-red-600"
                    )}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className={cn(
                      "font-bold text-lg",
                      ['deposit', 'sell', 'bonus', 'transfer'].includes(tx.type) ? "text-green-600" : "text-red-600"
                    )}>
                      {['deposit', 'sell', 'bonus', 'transfer'].includes(tx.type) ? '+' : '-'}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-50">
          {filteredTransactions.map((tx) => (
            <div key={tx.id} className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-xl",
                    ['deposit', 'sell', 'bonus', 'transfer'].includes(tx.type) ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                  )}>
                    {['deposit', 'sell', 'bonus', 'transfer'].includes(tx.type) ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold capitalize">{tx.type}</p>
                    <p className="text-[10px] text-gray-500">{new Date(tx.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  tx.status === 'completed' ? "bg-green-50 text-green-600" : 
                  tx.status === 'pending' ? "bg-yellow-50 text-yellow-600" : "bg-red-50 text-red-600"
                )}>
                  {tx.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Asset: <span className="text-gray-900 font-medium">{tx.asset || 'Cash'}</span></span>
                <span className={cn(
                  "font-bold",
                  ['deposit', 'sell', 'bonus', 'transfer'].includes(tx.type) ? "text-green-600" : "text-red-600"
                )}>
                  {['deposit', 'sell', 'bonus', 'transfer'].includes(tx.type) ? '+' : '-'}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12 lg:py-20">
            <div className="bg-gray-50 w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter size={24} className="lg:w-8 lg:h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium text-sm lg:text-base">No transactions found</p>
          </div>
        )}
      </div>
    </div>
  );
}
);
