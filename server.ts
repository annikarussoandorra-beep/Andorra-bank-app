import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import webpush from "web-push";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// VAPID Keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "BADJvb5B5a_jdiFVShPoj42-5Q-hZoZpq2-AgEMgEktGI4qkg8ZMky1Vuukg5nB3ZKRn4oMqACobKsQEosrojaU";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "ZXN8uQP-Lh3nMktBcfAOXfCbBdI-3RClqUk2QINI3o0";
const VAPID_EMAIL = process.env.VAPID_EMAIL || "mailto:support@andorra-bank.com";

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const MONGODB_URI = "mongodb+srv://eurosaieu:qwerty123321@cluster0.epu0hpr.mongodb.net/trading_app?retryWrites=true&w=majority";

// Mongoose Schemas
const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: { type: String, required: true },
  role: { type: String, required: true },
  balance: { type: Number, default: 0 },
  currency: { type: String, default: 'EUR' },
  managerId: { type: String, default: null },
  teamId: { type: String, default: null },
  createdAt: { type: String, required: true },
  status: { type: String, default: 'active' },
  isActivated: { type: Boolean, default: false },
  redirectUrl: { type: String, default: null },
  demoTimeLeft: { type: Number, default: 7200 },
  lastSeen: { type: String, default: () => new Date().toISOString() },
  pushSubscriptions: { type: [Object], default: [] }
});

const teamSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  teamLeadId: { type: String, required: true },
  createdAt: { type: String, required: true }
});

const transactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  asset: { type: String },
  price: { type: Number },
  timestamp: { type: String, required: true },
  status: { type: String, default: 'completed' }
});

const assetSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  currentPrice: { type: Number, required: true },
  change24h: { type: Number, required: true }
});

const botConfigSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  active: { type: Boolean, default: false },
  strategy: { type: String, default: 'conservative' },
  maxInvestment: { type: Number, default: 1000 },
  assets: { type: [String], default: ['BTC', 'ETH', 'SOL'] },
  autoSelectAssets: { type: Boolean, default: true },
  botStartTime: { type: Number, default: null },
  lastTradeTime: { type: Number, default: null }
});

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: String, required: true },
  read: { type: Boolean, default: false },
  edited: { type: Boolean, default: false },
  type: { type: String, default: 'text' },
  requisites: { type: String },
  paymentLink: {
    text: String,
    buttonLabel: String,
    url: String
  }
});

const scheduledNotificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  scheduledTime: { type: String, required: true },
  frequency: { type: String, default: 'once' },
  sent: { type: Boolean, default: false }
});

const User = mongoose.model("User", userSchema);
const Team = mongoose.model("Team", teamSchema);
const Transaction = mongoose.model("Transaction", transactionSchema);
const Asset = mongoose.model("Asset", assetSchema);
const BotConfig = mongoose.model("BotConfig", botConfigSchema);
const Message = mongoose.model("Message", messageSchema);
const ScheduledNotification = mongoose.model("ScheduledNotification", scheduledNotificationSchema);

const INITIAL_ASSETS = [
  // Commodities
  { symbol: "XAU", name: "Gold", type: "commodity", currentPrice: 2185.40, change24h: 0.85 },
  { symbol: "XAG", name: "Silver", type: "commodity", currentPrice: 24.60, change24h: 1.2 },
  { symbol: "OIL", name: "Brent Crude Oil", type: "commodity", currentPrice: 85.30, change24h: -0.4 },
  { symbol: "WTI", name: "WTI Crude Oil", type: "commodity", currentPrice: 81.20, change24h: -0.6 },
  { symbol: "GAS", name: "Natural Gas", type: "commodity", currentPrice: 1.75, change24h: -2.1 },
  { symbol: "COPPER", name: "Copper", type: "commodity", currentPrice: 4.12, change24h: 0.3 },
  { symbol: "PLAT", name: "Platinum", type: "commodity", currentPrice: 915.50, change24h: -0.8 },
  { symbol: "PALL", name: "Palladium", type: "commodity", currentPrice: 1020.30, change24h: 1.5 },
  
  // Stocks
  { symbol: "AAPL", name: "Apple Inc.", type: "stock", currentPrice: 172.50, change24h: 0.5 },
  { symbol: "MSFT", name: "Microsoft", type: "stock", currentPrice: 415.20, change24h: 1.1 },
  { symbol: "TSLA", name: "Tesla", type: "stock", currentPrice: 175.40, change24h: -3.2 },
  { symbol: "NVDA", name: "NVIDIA", type: "stock", currentPrice: 895.60, change24h: 4.5 },
  { symbol: "AMZN", name: "Amazon", type: "stock", currentPrice: 178.20, change24h: 0.9 },
  { symbol: "GOOGL", name: "Alphabet Inc.", type: "stock", currentPrice: 145.30, change24h: 0.2 },
  { symbol: "META", name: "Meta Platforms", type: "stock", currentPrice: 485.10, change24h: 1.8 },
  { symbol: "NFLX", name: "Netflix", type: "stock", currentPrice: 610.40, change24h: -0.5 },
  { symbol: "AMD", name: "Advanced Micro Devices", type: "stock", currentPrice: 180.50, change24h: 2.1 },
  { symbol: "INTC", name: "Intel Corp.", type: "stock", currentPrice: 42.80, change24h: -1.4 },
  { symbol: "BA", name: "Boeing Co.", type: "stock", currentPrice: 190.20, change24h: -2.5 },
  { symbol: "DIS", name: "Walt Disney Co.", type: "stock", currentPrice: 115.60, change24h: 0.7 },
  
  // Crypto
  { symbol: "BTC", name: "Bitcoin", type: "crypto", currentPrice: 64230.50, change24h: 2.4 },
  { symbol: "ETH", name: "Ethereum", type: "crypto", currentPrice: 3450.20, change24h: -1.2 },
  { symbol: "BNB", name: "Binance Coin", type: "crypto", currentPrice: 580.40, change24h: 1.5 },
  { symbol: "SOL", name: "Solana", type: "crypto", currentPrice: 145.80, change24h: 5.2 },
  { symbol: "XRP", name: "Ripple", type: "crypto", currentPrice: 0.62, change24h: -0.8 },
  { symbol: "ADA", name: "Cardano", type: "crypto", currentPrice: 0.58, change24h: 0.4 },
  { symbol: "DOT", name: "Polkadot", type: "crypto", currentPrice: 8.40, change24h: -1.5 },
  { symbol: "DOGE", name: "Dogecoin", type: "crypto", currentPrice: 0.15, change24h: 8.5 }
];

// Helper function to send push notifications to all subscriptions of a user
async function sendPushToUser(user: any, title: string, body: string) {
  if (!user.pushSubscriptions || user.pushSubscriptions.length === 0) return;

  const endpointsToRemove: string[] = [];
  const sendPromises = user.pushSubscriptions.map((sub: any) => {
    return webpush.sendNotification(
      sub,
      JSON.stringify({ title: title || 'Notification', body: body || '' }),
      {
        TTL: 24 * 60 * 60,
        urgency: 'high'
      }
    ).catch(err => {
      console.error(`[Push] Error for ${user.uid} at ${sub.endpoint.substring(0, 30)}...:`, err.message);
      if (err.statusCode === 410 || err.statusCode === 404) {
        endpointsToRemove.push(sub.endpoint);
      }
      return null;
    });
  });

  await Promise.all(sendPromises);

  if (endpointsToRemove.length > 0) {
    user.pushSubscriptions = user.pushSubscriptions.filter((s: any) => !endpointsToRemove.includes(s.endpoint));
    await user.save();
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Connect to MongoDB
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully");
    
    // Ensure assets are initialized
    if ((await Asset.countDocuments()) === 0) {
      await Asset.insertMany(INITIAL_ASSETS);
      console.log("Assets initialized (fresh start)");
    }
  } catch (e) {
    console.error("MongoDB connection failed:", e);
    // Do not exit, allow server to start so we can diagnose
  }

  app.use(express.json());
  app.use(cookieParser());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      timestamp: new Date().toISOString()
    });
  });

  // Bot Simulation Background Task
  setInterval(async () => {
    try {
      const activeBots = await BotConfig.find({ active: true });
      for (const bot of activeBots) {
        if (!bot.botStartTime) {
          bot.botStartTime = Date.now();
          await bot.save();
        }
        const user = await User.findOne({ uid: bot.userId });
        if (!user) continue;

        // Check demo time
        if (!user.isActivated) {
          const currentDemoTime = user.demoTimeLeft || 0;
          if (currentDemoTime <= 0) {
            bot.active = false;
            bot.botStartTime = null;
            await bot.save();
            continue;
          }
          // Decrement demo time (10 seconds)
          const updatedUser = await User.findOneAndUpdate(
            { uid: user.uid },
            { $inc: { demoTimeLeft: -10 } },
            { new: true }
          );
          if (updatedUser && updatedUser.demoTimeLeft < 0) {
            await User.updateOne({ uid: user.uid }, { $set: { demoTimeLeft: 0 } });
          }
        }

        // Generate trade if needed
        const now = Date.now();
        const lastTrade = bot.lastTradeTime || 0;
        const nextTradeInterval = Math.floor(Math.random() * (60000 - 10000 + 1) + 10000); // 10-60 seconds

        if (now - lastTrade > nextTradeInterval) {
          const assetsToUse = bot.autoSelectAssets 
            ? INITIAL_ASSETS.map(a => a.symbol)
            : bot.assets;
          
          if (assetsToUse && assetsToUse.length > 0) {
            const randomSymbol = assetsToUse[Math.floor(Math.random() * assetsToUse.length)];
            const asset = INITIAL_ASSETS.find(a => a.symbol === randomSymbol);
            
            if (asset) {
              // Daily profit check
              const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
              const recentTxs = await Transaction.find({
                userId: user.uid,
                timestamp: { $gt: twentyFourHoursAgo },
                type: { $in: ['buy', 'sell'] }
              });
              const profitLast24h = recentTxs.reduce((acc, t) => acc + t.amount, 0);
              const maxDailyProfit = bot.strategy === 'aggressive' ? 120 : 100;

              if (profitLast24h < maxDailyProfit) {
                const profitPercent = bot.strategy === 'conservative' 
                  ? (Math.random() * 0.8 + 0.3) / 100 
                  : (Math.random() * 1.5 + 0.5) / 100;
                
                const investment = Math.min(bot.maxInvestment, user.balance * 0.1);
                let profit = Number((investment * profitPercent).toFixed(2));

                if (profitLast24h + profit > maxDailyProfit) {
                  profit = Number((maxDailyProfit - profitLast24h).toFixed(2));
                }

                if (profit > 0) {
                  const tx = new Transaction({
                    id: Math.random().toString(36).substring(2, 15),
                    userId: user.uid,
                    type: 'sell',
                    amount: profit,
                    asset: asset.symbol,
                    price: asset.currentPrice,
                    timestamp: new Date().toISOString(),
                    status: 'completed'
                  });
                  await Transaction.create(tx);
                  
                  await User.updateOne({ uid: user.uid }, { $inc: { balance: profit } });
                  
                  bot.lastTradeTime = now;
                  await bot.save();
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("Bot simulation error:", e);
    }
  }, 10000);

  // Simple session middleware
  const authMiddleware = async (req: any, res: any, next: any) => {
    try {
      const userId = req.cookies.userId;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const user = await User.findOne({ uid: userId });
      if (!user) return res.status(401).json({ error: "User not found" });
      
      // Update lastSeen on every request
      await User.updateOne({ uid: userId }, { lastSeen: new Date().toISOString() });
      
      req.user = user;
      next();
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  };

  // API Routes
  app.get("/api/admin/check-initialized", async (req, res) => {
    try {
      const count = await User.countDocuments();
      res.json({ initialized: count > 0 });
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/bootstrap", async (req, res) => {
    try {
      const { email, password, displayName } = req.body;
      if ((await User.countDocuments()) > 0) {
        return res.status(400).json({ error: "System already initialized" });
      }

      const uid = Math.random().toString(36).substring(2, 15);
      const newUser = new User({
        uid,
        email,
        password,
        displayName,
        role: 'admin',
        balance: 0,
        currency: 'EUR',
        demoTimeLeft: 7200,
        managerId: null,
        teamId: null,
        createdAt: new Date().toISOString(),
        status: 'active',
        isActivated: true
      });

      await newUser.save();
      res.json({ success: true, uid });
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email, password });
      if (!user) return res.status(401).json({ error: "Invalid credentials" });
      if (user.status === 'suspended') return res.status(403).json({ error: "Account suspended" });
      
      res.cookie("userId", user.uid, { httpOnly: true, sameSite: 'none', secure: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
      const userObj = user.toObject();
      delete userObj.password;
      res.json({ user: userObj });
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("userId");
    res.json({ success: true });
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const userId = req.cookies.userId;
      if (!userId) return res.status(401).json({ error: "Not logged in" });
      const user = await User.findOne({ uid: userId });
      if (!user) return res.status(401).json({ error: "User not found" });
      
      if (user.status === 'suspended') {
        res.clearCookie("userId");
        return res.status(403).json({ error: "Account suspended" });
      }

      const userObj = user.toObject();
      delete userObj.password;
      res.json({ user: userObj });
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Data endpoints
  app.get("/api/assets", async (req, res) => {
    try {
      const assets = await Asset.find();
      res.json(assets);
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/transactions", authMiddleware, async (req: any, res) => {
    try {
      let query: any = { userId: req.user.uid };
      if (req.user.role !== 'client') {
        // Admins, Masters, Managers, and Team Leads can see more transactions
        // For simplicity and to fix the "Activity Log" showing nothing, we return all transactions
        // In a larger app, we would filter by managed users/teams
        query = {};
      }
      const userTxs = await Transaction.find(query);
      res.json(userTxs);
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/transactions", authMiddleware, async (req: any, res) => {
    try {
      const tx = new Transaction({
        id: Math.random().toString(36).substring(2, 15),
        ...req.body,
        userId: req.user.uid,
        timestamp: new Date().toISOString()
      });
      await tx.save();
      
      // Update user balance
      let balanceChange = 0;
      if (tx.type === 'buy') balanceChange = -tx.amount;
      else if (tx.type === 'sell') balanceChange = tx.amount;
      else if (tx.type === 'deposit') balanceChange = tx.amount;
      else if (tx.type === 'withdrawal') balanceChange = -tx.amount;
      else if (tx.type === 'bonus') balanceChange = tx.amount;
      else if (tx.type === 'transfer') balanceChange = tx.amount;
      else if (tx.type === 'overdraft') balanceChange = tx.amount;
      else if (tx.type === 'credit') balanceChange = -tx.amount;

      if (balanceChange !== 0) {
        await User.updateOne({ uid: req.user.uid }, { $inc: { balance: balanceChange } });
      }

      res.json(tx);
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/transactions", authMiddleware, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (currentUser.role === 'client') {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { userId, type, amount, asset, price, status } = req.body;
      
      const targetUser = await User.findOne({ uid: userId });
      if (!targetUser) {
        return res.status(404).json({ error: "Target user not found" });
      }

      // If manager, check if client belongs to them
      if (currentUser.role === 'manager' && targetUser.managerId !== currentUser.uid) {
        return res.status(403).json({ error: "Forbidden: Not your client" });
      }

      const tx = new Transaction({
        id: Math.random().toString(36).substring(2, 15),
        userId,
        type,
        amount,
        asset,
        price,
        status: status || 'completed',
        timestamp: new Date().toISOString()
      });
      await tx.save();

      // Update target user balance
      let balanceChange = 0;
      if (type === 'deposit' || type === 'bonus' || type === 'sell' || type === 'transfer' || type === 'overdraft') {
        balanceChange = amount;
      } else if (type === 'withdrawal' || type === 'buy' || type === 'credit') {
        balanceChange = -amount;
      }
      
      if (balanceChange !== 0) {
        await User.updateOne({ uid: userId }, { $inc: { balance: balanceChange } });
      }

      res.json(tx);
    } catch (e) {
      console.error("Admin transaction failed", e);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/transactions/:id", authMiddleware, async (req: any, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.user;
      if (currentUser.role === 'client') {
        return res.status(403).json({ error: "Forbidden" });
      }

      const tx = await Transaction.findOne({ id });
      if (!tx) return res.status(404).json({ error: "Transaction not found" });

      const targetUser = await User.findOne({ uid: tx.userId });
      if (!targetUser) return res.status(404).json({ error: "User not found" });

      if (currentUser.role === 'manager' && targetUser.managerId !== currentUser.uid) {
        return res.status(403).json({ error: "Forbidden: Not your client" });
      }

      await Transaction.deleteOne({ id });

      // Revert balance change
      let balanceChange = 0;
      if (tx.type === 'deposit' || tx.type === 'bonus' || tx.type === 'sell' || tx.type === 'transfer' || tx.type === 'overdraft') {
        balanceChange = -tx.amount;
      } else if (tx.type === 'withdrawal' || tx.type === 'buy' || tx.type === 'credit') {
        balanceChange = tx.amount;
      }
      
      if (balanceChange !== 0) {
        await User.updateOne({ uid: tx.userId }, { $inc: { balance: balanceChange } });
      }

      res.json({ success: true });
    } catch (e) {
      console.error("Delete transaction failed", e);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/users", authMiddleware, async (req: any, res) => {
    try {
      let filteredUsers = [];
      const user = req.user;

      if (user.role === 'admin' || user.role === 'master') {
        filteredUsers = await User.find();
      } else if (user.role === 'manager') {
        // Managers see their clients + all other staff members (for chat)
        filteredUsers = await User.find({
          $or: [
            { managerId: user.uid },
            { role: { $in: ['admin', 'master', 'manager', 'team_lead'] } }
          ]
        });
      } else if (user.role === 'team_lead') {
        // Team leads see their team members + all other staff members
        filteredUsers = await User.find({
          $or: [
            { teamId: user.teamId },
            { role: { $in: ['admin', 'master', 'manager', 'team_lead'] } }
          ]
        });
      } else if (user.role === 'client') {
        // Clients see their manager + all other staff members (for support identification)
        filteredUsers = await User.find({
          $or: [
            { uid: user.managerId },
            { role: { $in: ['admin', 'master', 'manager', 'team_lead'] } }
          ]
        });
      }
      
      res.json(filteredUsers.map((u: any) => {
        const obj = u.toObject();
        // Hide password if requester is a client, or if the target is staff and requester is not admin/master
        if (user.role === 'client') {
          delete obj.password;
        } else if (user.role !== 'admin' && user.role !== 'master' && obj.role !== 'client') {
          delete obj.password;
        }
        return obj;
      }));
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET single user
  app.get("/api/users/:uid", authMiddleware, async (req: any, res) => {
    try {
      const { uid } = req.params;
      const user = await User.findOne({ uid });
      if (!user) return res.status(404).json({ error: "User not found" });
      const obj = user.toObject();
      delete obj.password;
      res.json(obj);
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update user (POST /api/users/:uid)
  app.post("/api/users/:uid", authMiddleware, async (req: any, res) => {
    try {
      const { uid } = req.params;
      const user = await User.findOneAndUpdate({ uid }, req.body, { new: true });
      if (!user) return res.status(404).json({ error: "User not found" });
      const obj = user.toObject();
      delete obj.password;
      res.json(obj);
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/create-user", authMiddleware, async (req: any, res) => {
    try {
      const { role } = req.body;

      // Permissions check
      if (req.user.role === 'manager') {
        if (role !== 'client') {
          return res.status(403).json({ error: "Managers can only create client accounts" });
        }
      } else if (req.user.role === 'team_lead') {
        if (role === 'admin' || role === 'team_lead') {
          return res.status(403).json({ error: "Team leads cannot create admins or other team leads" });
        }
      }

      const newUser = new User({
        uid: Math.random().toString(36).substring(2, 15),
        ...req.body,
        createdAt: new Date().toISOString(),
        status: 'active',
        isActivated: req.body.role !== 'client',
        lastSeen: new Date().toISOString()
      });
      await newUser.save();
      res.json({ success: true, uid: newUser.uid });
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/update-user/:uid", authMiddleware, async (req: any, res) => {
    try {
      const { uid } = req.params;
      await User.findOneAndUpdate({ uid }, req.body);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/users/:uid", authMiddleware, async (req: any, res) => {
    try {
      const { uid } = req.params;
      const targetUser = await User.findOne({ uid });
      if (!targetUser) return res.status(404).json({ error: "User not found" });

      const isAuthorized = 
        req.user.role === 'admin' || 
        req.user.role === 'master' ||
        (req.user.role === 'manager' && targetUser.managerId === req.user.uid) ||
        (req.user.role === 'team_lead' && targetUser.teamId === req.user.teamId);

      if (!isAuthorized) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await User.deleteOne({ uid });
      await BotConfig.deleteOne({ userId: uid });
      await Transaction.deleteMany({ userId: uid });
      await Message.deleteMany({ $or: [{ senderId: uid }, { receiverId: uid }] });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/users/update-demo-time", authMiddleware, async (req: any, res) => {
    try {
      const { demoTimeLeft } = req.body;
      await User.findOneAndUpdate({ uid: req.user.uid }, { demoTimeLeft });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/teams", authMiddleware, async (req, res) => {
    try {
      const teams = await Team.find();
      res.json(teams);
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/create-team", authMiddleware, async (req, res) => {
    try {
      const { name, teamLeadId } = req.body;
      if (!name || !teamLeadId) {
        return res.status(400).json({ error: "Team name and lead are required" });
      }

      const newTeam = new Team({
        id: Math.random().toString(36).substring(2, 15),
        name,
        teamLeadId,
        createdAt: new Date().toISOString()
      });
      await newTeam.save();
      res.json({ success: true, teamId: newTeam.id });
    } catch (e: any) {
      console.error("Team creation error:", e);
      res.status(400).json({ error: e.message || "Failed to create team" });
    }
  });

  app.get("/api/bots", authMiddleware, async (req: any, res) => {
    try {
      let config = await BotConfig.findOne({ userId: req.user.uid });
      if (!config) {
        config = new BotConfig({
          userId: req.user.uid,
          active: false,
          strategy: 'conservative',
          maxInvestment: 1000,
          assets: ['BTC', 'ETH', 'SOL'],
          autoSelectAssets: true
        });
        await config.save();
      }
      res.json(config);
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/bots", authMiddleware, async (req: any, res) => {
    try {
      await BotConfig.findOneAndUpdate(
        { userId: req.user.uid },
        { ...req.body },
        { upsert: true }
      );
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/bot-config/:userId", authMiddleware, async (req: any, res) => {
    try {
      const config = await BotConfig.findOne({ userId: req.params.userId });
      res.json(config || null);
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/bot-config/:userId", authMiddleware, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const updateData = { ...req.body };
      
      // If activating bot and no start time, set it
      if (updateData.active === true) {
        const currentConfig = await BotConfig.findOne({ userId });
        if (!currentConfig || !currentConfig.botStartTime) {
          updateData.botStartTime = Date.now();
        }
      } else if (updateData.active === false) {
        updateData.botStartTime = null;
      }

      await BotConfig.findOneAndUpdate(
        { userId },
        updateData,
        { upsert: true }
      );
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/update-team/:id", authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'master') return res.status(403).json({ error: "Forbidden" });
      const { id } = req.params;
      await Team.findOneAndUpdate({ id }, req.body);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/teams/:id", authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'master') return res.status(403).json({ error: "Forbidden" });
      const { id } = req.params;
      
      // Unassign all members from this team
      await User.updateMany({ teamId: id }, { teamId: null });
      
      // Delete the team
      await Team.deleteOne({ id });
      
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/messages", authMiddleware, async (req: any, res) => {
    try {
      const user = req.user;
      let userMsgs = [];
      if (user.role === 'admin' || user.role === 'master') {
        userMsgs = await Message.find({
          $or: [
            { senderId: user.uid },
            { receiverId: user.uid },
            { senderId: 'support-team' },
            { receiverId: 'support-team' }
          ]
        });
      } else if (user.role === 'manager' || user.role === 'team_lead') {
        // Managers/Team Leads see their direct messages + support messages from their clients/team members
        const managedUsers = await User.find(
          user.role === 'manager' ? { managerId: user.uid } : { teamId: user.teamId }
        );
        const managedUids = managedUsers.map(u => u.uid);
        
        userMsgs = await Message.find({
          $or: [
            { senderId: user.uid },
            { receiverId: user.uid },
            { senderId: 'support-team', receiverId: { $in: managedUids } },
            { receiverId: 'support-team', senderId: { $in: managedUids } }
          ]
        });
      } else {
        userMsgs = await Message.find({
          $or: [
            { senderId: user.uid },
            { receiverId: user.uid },
            { senderId: 'support-team', receiverId: user.uid }
          ]
        });
      }
      res.json(userMsgs);
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/messages", authMiddleware, async (req: any, res) => {
    try {
      const isStaff = ['admin', 'manager', 'team_lead', 'master'].includes(req.user.role);
      const senderId = (isStaff && req.body.senderId === 'support-team') ? 'support-team' : req.user.uid;

      const msg = new Message({
        id: Math.random().toString(36).substring(2, 15),
        ...req.body,
        senderId,
        timestamp: new Date().toISOString()
      });
      await msg.save();
      res.json(msg);
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/messages/:id", authMiddleware, async (req: any, res) => {
    try {
      const user = req.user;
      const msg = await Message.findOne({ id: req.params.id });
      if (!msg) return res.status(404).json({ error: "Message not found" });
      
      const canDelete = msg.senderId === user.uid || ['admin', 'manager', 'team_lead', 'master'].includes(user.role);
      if (!canDelete) return res.status(403).json({ error: "Forbidden" });
      
      await Message.deleteOne({ id: req.params.id });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/messages/:id", authMiddleware, async (req: any, res) => {
    try {
      const msg = await Message.findOne({ id: req.params.id });
      if (!msg) return res.status(404).json({ error: "Message not found" });
      if (msg.senderId !== req.user.uid) return res.status(403).json({ error: "Forbidden" });
      
      msg.text = req.body.text;
      msg.edited = true;
      await msg.save();
      res.json(msg);
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/messages/clear", authMiddleware, async (req: any, res) => {
    try {
      const { contactId } = req.body;
      const user = req.user;
      const isStaff = ['admin', 'manager', 'team_lead', 'master'].includes(user.role);
      
      const userId = (isStaff && req.body.asSupport) ? 'support-team' : user.uid;
      
      await Message.deleteMany({
        $or: [
          { senderId: userId, receiverId: contactId },
          { senderId: contactId, receiverId: userId }
        ]
      });
      
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/messages/read", authMiddleware, async (req: any, res) => {
    try {
      const { senderId } = req.body;
      const user = req.user;
      const isStaff = ['admin', 'manager', 'team_lead', 'master'].includes(user.role);
      
      const receiverId = (isStaff && req.body.receiverId === 'support-team') ? 'support-team' : user.uid;
      
      await Message.updateMany(
        { senderId, receiverId, read: false },
        { $set: { read: true } }
      );
      
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Push Notifications Endpoints
  app.get("/api/notifications/vapid-public-key", (req, res) => {
    res.json({ publicKey: VAPID_PUBLIC_KEY });
  });

  app.post("/api/notifications/subscribe", authMiddleware, async (req: any, res) => {
    try {
      const { subscription } = req.body;
      const user = await User.findOne({ uid: req.user.uid });
      if (!user) return res.status(404).json({ error: "User not found" });
      
      // Initialize if null
      if (!user.pushSubscriptions) (user as any).pushSubscriptions = [];
      
      // Check if subscription already exists
      const exists = (user.pushSubscriptions as any[]).some((s: any) => s.endpoint === subscription.endpoint);
      if (!exists) {
        (user.pushSubscriptions as any[]).push(subscription);
        await user.save();
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/notifications/send", authMiddleware, async (req: any, res) => {
    try {
      const isStaff = ['admin', 'manager', 'team_lead', 'master'].includes(req.user.role);
      if (!isStaff) return res.status(403).json({ error: "Forbidden" });

      const { userId, title, body } = req.body;
      
      if (userId === 'all_inactive') {
        const inactiveClients = await User.find({ role: 'client', isActivated: false });
        console.log(`[Push] Sending broadcast to ${inactiveClients.length} inactive clients`);
        
        const broadcastPromises = inactiveClients.map(user => sendPushToUser(user, title, body));
        await Promise.all(broadcastPromises);
        
        return res.json({ success: true, message: `Notification sent to all inactive clients` });
      }

      const targetUser = await User.findOne({ uid: userId });
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      await sendPushToUser(targetUser, title, body);
      res.json({ success: true });
    } catch (e) {
      console.error("[Push] Send error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/notifications/schedule", authMiddleware, async (req: any, res) => {
    try {
      const isStaff = ['admin', 'manager', 'team_lead', 'master'].includes(req.user.role);
      if (!isStaff) return res.status(403).json({ error: "Forbidden" });

      const { userId, title, body, scheduledTime, frequency } = req.body;
      
      const notification = new ScheduledNotification({
        id: Math.random().toString(36).substring(2, 15),
        userId,
        title,
        body,
        scheduledTime,
        frequency: frequency || 'once',
        sent: false
      });

      await notification.save();
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/notifications/schedule/:id", authMiddleware, async (req: any, res) => {
    try {
      const isStaff = ['admin', 'manager', 'team_lead', 'master'].includes(req.user.role);
      if (!isStaff) return res.status(403).json({ error: "Forbidden" });

      const { id } = req.params;
      await ScheduledNotification.findOneAndDelete({ id });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  app.patch("/api/admin/notifications/schedule/:id", authMiddleware, async (req: any, res) => {
    try {
      const isStaff = ['admin', 'manager', 'team_lead', 'master'].includes(req.user.role);
      if (!isStaff) return res.status(403).json({ error: "Forbidden" });

      const { id } = req.params;
      const { title, body, scheduledTime, frequency } = req.body;
      
      await ScheduledNotification.findOneAndUpdate(
        { id },
        { title, body, scheduledTime, frequency },
        { new: true }
      );
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to update notification" });
    }
  });

  app.get("/api/admin/notifications/stats", authMiddleware, async (req: any, res) => {
    try {
      const isStaff = ['admin', 'manager', 'team_lead', 'master'].includes(req.user.role);
      if (!isStaff) return res.status(403).json({ error: "Forbidden" });

      const users = await User.find({ "pushSubscriptions.0": { $exists: true } });
      const stats: {[key: string]: number} = {};
      users.forEach(u => {
        stats[u.uid] = u.pushSubscriptions.length;
      });
      res.json(stats);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/notifications/scheduled", authMiddleware, async (req: any, res) => {
    try {
      const isStaff = ['admin', 'manager', 'team_lead', 'master'].includes(req.user.role);
      if (!isStaff) return res.status(403).json({ error: "Forbidden" });

      const notifications = await ScheduledNotification.find({ sent: false });
      res.json(notifications);
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Background task for scheduled notifications
  setInterval(async () => {
    try {
      const now = new Date().toISOString();
      const dueNotifications = await ScheduledNotification.find({
        scheduledTime: { $lte: now },
        sent: false
      });

      for (const notification of dueNotifications) {
        if (notification.userId === 'all') {
          const allClients = await User.find({ role: 'client' });
          const broadcastPromises = allClients.map(user => sendPushToUser(user, notification.title, notification.body));
          await Promise.all(broadcastPromises);
        } else {
          const user = await User.findOne({ uid: notification.userId });
          if (user) {
            await sendPushToUser(user, notification.title, notification.body);
          }
        }
        notification.sent = true;
        await notification.save();
      }
    } catch (e) {
      console.error("Scheduled notifications background task error:", e);
    }
  }, 60000); // Check every minute

  // API 404 handler
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: "API route not found" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
