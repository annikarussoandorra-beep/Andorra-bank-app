export type UserRole = 'client' | 'manager' | 'team_lead' | 'admin' | 'master';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  balance: number;
  currency: string;
  managerId?: string;
  teamId?: string;
  createdAt: string;
  status: 'active' | 'suspended';
  isActivated: boolean;
  redirectUrl?: string | null;
  demoTimeLeft?: number;
  lastSeen?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'buy' | 'sell';
  amount: number;
  asset?: string;
  price?: number;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface Asset {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'forex' | 'commodity';
  currentPrice: number;
  change24h: number;
}

export interface Team {
  id: string;
  name: string;
  teamLeadId: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  read: boolean;
  edited?: boolean;
  type?: 'text' | 'requisites' | 'payment_link';
  requisites?: string;
  paymentLink?: {
    text: string;
    buttonLabel: string;
    url: string;
  };
}

export interface BotConfig {
  userId: string;
  active: boolean;
  strategy: 'conservative' | 'aggressive';
  maxInvestment: number;
  assets: string[];
  autoSelectAssets: boolean;
  botStartTime?: number | null;
}
