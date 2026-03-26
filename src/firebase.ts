// This file now acts as a proxy to our local Express API
import { UserProfile, Asset, Transaction, ChatMessage, BotConfig, Team } from './types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error(`API Error [${operationType}] on ${path}:`, error);
  throw error;
}

// Mocking the auth state for the UI
let currentUser: UserProfile | null = null;
const authListeners: ((user: UserProfile | null) => void)[] = [];

const notifyAuthListeners = (user: UserProfile | null) => {
  authListeners.forEach(listener => listener(user));
};

export const auth = {
  get currentUser() {
    return currentUser;
  },
  onAuthStateChanged: (callback: (user: UserProfile | null) => void) => {
    authListeners.push(callback);
    // Check session on mount
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        currentUser = data.user || null;
        callback(currentUser);
      })
      .catch(() => {
        currentUser = null;
        callback(null);
      });
    return () => {
      const index = authListeners.indexOf(callback);
      if (index > -1) authListeners.splice(index, 1);
    };
  }
};

export const api = {
  login: async (email: string, password: string) => {
    console.log("api.login: attempting login for", email);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      console.error("api.login: login failed", res.status);
      throw new Error('Invalid credentials');
    }
    const data = await res.json();
    console.log("api.login: login successful", data.user);
    currentUser = data.user;
    notifyAuthListeners(currentUser);
    return data.user;
  },
  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    currentUser = null;
    notifyAuthListeners(null);
  },
  getAssets: async (): Promise<Asset[]> => {
    try {
      const res = await fetch('/api/assets');
      if (!res.ok) return [];
      return res.json();
    } catch (e) {
      console.error("getAssets failed", e);
      return [];
    }
  },
  getTransactions: async (): Promise<Transaction[]> => {
    try {
      const res = await fetch('/api/transactions');
      if (!res.ok) return [];
      return res.json();
    } catch (e) {
      console.error("getTransactions failed", e);
      return [];
    }
  },
  createTransaction: async (tx: any) => {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tx)
    });
    if (!res.ok) throw new Error('Transaction failed');
    return res.json();
  },
  getUsers: async (): Promise<UserProfile[]> => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) return [];
      return res.json();
    } catch (e) {
      console.error("getUsers failed", e);
      return [];
    }
  },
  getTeams: async (): Promise<Team[]> => {
    try {
      const res = await fetch('/api/teams');
      if (!res.ok) return [];
      return res.json();
    } catch (e) {
      console.error("getTeams failed", e);
      return [];
    }
  },
  getMessages: async (): Promise<ChatMessage[]> => {
    try {
      const res = await fetch('/api/messages');
      if (!res.ok) return [];
      return res.json();
    } catch (e) {
      console.error("getMessages failed", e);
      return [];
    }
  },
  sendMessage: async (msg: any) => {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg)
    });
    if (!res.ok) throw new Error('Message failed');
    return res.json();
  },
  getBotConfig: async (): Promise<BotConfig | null> => {
    try {
      const res = await fetch('/api/bots');
      if (!res.ok) return null;
      return res.json();
    } catch (e) {
      console.error("getBotConfig failed", e);
      return null;
    }
  },
  updateBotConfig: async (config: any) => {
    const res = await fetch('/api/bots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return res.json();
  },
  updateUser: async (uid: string, data: any) => {
    const res = await fetch(`/api/users/${uid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Update failed' }));
      throw new Error(error.error || 'Update failed');
    }
    return res.json();
  },
  getUser: async (uid: string): Promise<UserProfile | null> => {
    try {
      const res = await fetch(`/api/users/${uid}`);
      if (!res.ok) return null;
      return res.json();
    } catch (e) {
      console.error("getUser failed", e);
      return null;
    }
  },
  addTransaction: async (tx: any) => {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tx)
    });
    return res.json();
  },
  updateDemoTime: async (demoTimeLeft: number) => {
    const response = await fetch('/api/users/update-demo-time', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ demoTimeLeft })
    });
    return response.json();
  }
};
