import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  demoTimeLeft: { type: Number, default: 7200 }
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
  botStartTime: { type: Number, default: null }
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

const User = mongoose.model("User", userSchema);
const Team = mongoose.model("Team", teamSchema);
const Transaction = mongoose.model("Transaction", transactionSchema);
const Asset = mongoose.model("Asset", assetSchema);
const BotConfig = mongoose.model("BotConfig", botConfigSchema);
const Message = mongoose.model("Message", messageSchema);

const INITIAL_ASSETS = [
  { symbol: "XAU", name: "Gold", currentPrice: 2185.40, change24h: 0.85 },
  { symbol: "XAG", name: "Silver", currentPrice: 24.60, change24h: 1.2 },
  { symbol: "OIL", name: "Brent Oil", currentPrice: 85.30, change24h: -0.4 },
  { symbol: "GAS", name: "Natural Gas", currentPrice: 1.75, change24h: -2.1 },
  { symbol: "AAPL", name: "Apple Inc.", currentPrice: 172.50, change24h: 0.5 },
  { symbol: "MSFT", name: "Microsoft", currentPrice: 415.20, change24h: 1.1 },
  { symbol: "TSLA", name: "Tesla", currentPrice: 175.40, change24h: -3.2 },
  { symbol: "NVDA", name: "NVIDIA", currentPrice: 895.60, change24h: 4.5 },
  { symbol: "AMZN", name: "Amazon", currentPrice: 178.20, change24h: 0.9 },
  { symbol: "BTC", name: "Bitcoin", currentPrice: 64230.50, change24h: 2.4 },
  { symbol: "ETH", name: "Ethereum", currentPrice: 3450.20, change24h: -1.2 }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Connect to MongoDB
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
    
    // Ensure assets are initialized
    if ((await Asset.countDocuments()) === 0) {
      await Asset.insertMany(INITIAL_ASSETS);
      console.log("Assets initialized (fresh start)");
    }
  } catch (e) {
    console.error("MongoDB connection failed:", e);
    process.exit(1);
  }

  app.use(express.json());
  app.use(cookieParser());

  // Simple session middleware
  const authMiddleware = async (req: any, res: any, next: any) => {
    try {
      const userId = req.cookies.userId;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const user = await User.findOne({ uid: userId });
      if (!user) return res.status(401).json({ error: "User not found" });
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
      
      res.cookie("userId", user.uid, { httpOnly: true, sameSite: 'none', secure: true });
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
      const userTxs = await Transaction.find({ userId: req.user.uid });
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
      const user = await User.findOne({ uid: req.user.uid });
      if (user) {
        if (tx.type === 'buy') user.balance -= tx.amount;
        else if (tx.type === 'sell') user.balance += tx.amount;
        else if (tx.type === 'deposit') user.balance += tx.amount;
        else if (tx.type === 'withdrawal') user.balance -= tx.amount;
        await user.save();
      }

      res.json(tx);
    } catch (e) {
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
        delete obj.password;
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
        isActivated: req.body.role !== 'client'
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
      await BotConfig.findOneAndUpdate(
        { userId: req.params.userId },
        { ...req.body },
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

  app.get("/api/messages", authMiddleware, async (req: any, res) => {
    try {
      const user = req.user;
      let userMsgs = [];
      if (user.role === 'admin' || user.role === 'master' || user.role === 'manager' || user.role === 'team_lead') {
        userMsgs = await Message.find({
          $or: [
            { senderId: user.uid },
            { receiverId: user.uid },
            { senderId: 'support-team' },
            { receiverId: 'support-team' }
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
      const msg = new Message({
        id: Math.random().toString(36).substring(2, 15),
        ...req.body,
        senderId: req.user.uid,
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
      
      await Message.deleteMany({
        $or: [
          { senderId: user.uid, receiverId: contactId },
          { senderId: contactId, receiverId: user.uid }
        ]
      });
      
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

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
