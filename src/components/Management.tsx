import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Shield, 
  MoreVertical, 
  Mail, 
  Lock,
  Edit2,
  Trash2,
  ChevronRight,
  LayoutGrid,
  List,
  Filter,
  X,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, UserRole, Team, Transaction, BotConfig } from '../types';
import { cn } from '../lib/utils';

interface ManagementProps {
  currentUser: UserProfile;
  users: UserProfile[];
  teams: Team[];
  transactions: Transaction[];
  onUpdateUser: (uid: string, data: Partial<UserProfile>) => void;
  onCreateUser: (data: any) => void;
  onCreateTeam: (data: any) => void;
  onUpdateTeam: (id: string, data: Partial<Team>) => void;
  onDeleteUser: (uid: string) => void;
}

export default function Management({ currentUser, users, teams, transactions, onUpdateUser, onCreateUser, onCreateTeam, onUpdateTeam, onDeleteUser }: ManagementProps) {
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [managementTab, setManagementTab] = useState<'clients' | 'staff' | 'teams'>('clients');
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editingUserBotConfig, setEditingUserBotConfig] = useState<BotConfig | null>(null);
  const [activeEditTab, setActiveEditTab] = useState<'profile' | 'bot'>('profile');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (editingUser) {
      fetch(`/api/admin/bot-config/${editingUser.uid}`)
        .then(res => res.json())
        .then(data => setEditingUserBotConfig(data));
      setActiveEditTab('profile');
    } else {
      setEditingUserBotConfig(null);
    }
  }, [editingUser]);

  const handleUpdateBotConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editingUserBotConfig) return;
    
    await fetch(`/api/admin/bot-config/${editingUser.uid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingUserBotConfig)
    });
    alert('Bot configuration updated');
  };
  const [viewingUserTxs, setViewingUserTxs] = useState<UserProfile | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'client' as UserRole,
    balance: 0,
    teamId: '' as string | null,
    managerId: '' as string | null,
    isActivated: false
  });

  const [newTeam, setNewTeam] = useState({
    name: '',
    teamLeadId: ''
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    // Auto-assign managerId and teamId based on current user
    const userData = {
      ...newUser,
      managerId: currentUser.role === 'manager' ? currentUser.uid : (newUser.managerId || null),
      teamId: (currentUser.role === 'team_lead' || currentUser.role === 'manager') ? currentUser.teamId : (newUser.teamId || null)
    };
    onCreateUser(userData);
    setIsCreateModalOpen(false);
    setNewUser({ email: '', password: '', displayName: '', role: 'client', balance: 10000, teamId: '', managerId: '', isActivated: false });
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      onUpdateUser(editingUser.uid, editingUser);
      setEditingUser(null);
    }
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateTeam(newTeam);
    setIsTeamModalOpen(false);
    setNewTeam({ name: '', teamLeadId: '' });
  };

  const handleUpdateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTeam) {
      onUpdateTeam(editingTeam.id, editingTeam);
      setEditingTeam(null);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName.toLowerCase().includes(search.toLowerCase()) || 
                         user.email.toLowerCase().includes(search.toLowerCase());
    
    const isClient = user.role === 'client';
    const isStaff = ['manager', 'team_lead', 'admin', 'master'].includes(user.role);

    if (managementTab === 'clients' && !isClient) return false;
    if (managementTab === 'staff' && !isStaff) return false;

    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    
    // Filter based on management level
    if (currentUser.role === 'admin' || currentUser.role === 'master') return matchesSearch && matchesRole;
    if (currentUser.role === 'team_lead') {
      // Team lead sees everyone in their team
      return matchesSearch && matchesRole && user.teamId === currentUser.teamId && user.uid !== currentUser.uid;
    }
    if (currentUser.role === 'manager') {
      // Manager sees only their clients
      return matchesSearch && matchesRole && user.managerId === currentUser.uid;
    }
    
    return false;
  });

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 lg:space-y-10">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-50 rounded-xl text-[#FF0000]">
              <Users size={20} />
            </div>
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+5%</span>
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Users</p>
          <h3 className="text-2xl font-bold">{users.length}</h3>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Capital</p>
          <h3 className="text-2xl font-bold">{users.reduce((acc, u) => acc + u.balance, 0).toLocaleString()} €</h3>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
              <Activity size={20} />
            </div>
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Volume</p>
          <h3 className="text-2xl font-bold">{transactions.reduce((acc, tx) => acc + tx.amount, 0).toLocaleString()} €</h3>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-50 rounded-xl text-green-600">
              <Shield size={20} />
            </div>
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Activated Users</p>
          <h3 className="text-2xl font-bold">{users.filter(u => u.isActivated).length}</h3>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-50 rounded-xl text-orange-600">
              <Shield size={20} />
            </div>
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Active Teams</p>
          <h3 className="text-2xl font-bold">{teams.length}</h3>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 lg:gap-6">
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="p-2 lg:p-3 bg-[#FF0000] text-white rounded-2xl shadow-lg shadow-red-500/20">
            <Users size={24} className="lg:w-7 lg:h-7" />
          </div>
          <div>
            <h2 className="text-xl lg:text-2xl font-bold">
              {managementTab === 'clients' ? 'Client Management' : 
               managementTab === 'staff' ? 'Staff Management' : 'Team Management'}
            </h2>
            <p className="text-[10px] lg:text-sm text-gray-500">
              {managementTab === 'teams' ? `Managing ${filteredTeams.length} active teams` : `Managing ${filteredUsers.length} active accounts`}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:gap-3">
          <div className="flex bg-white border-2 border-gray-100 p-1 rounded-2xl mr-2">
            <button 
              onClick={() => setManagementTab('clients')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                managementTab === 'clients' ? "bg-gray-900 text-white shadow-lg" : "text-gray-400 hover:text-gray-600"
              )}
            >
              Clients
            </button>
            {currentUser.role !== 'manager' && (
              <button 
                onClick={() => setManagementTab('staff')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                  managementTab === 'staff' ? "bg-gray-900 text-white shadow-lg" : "text-gray-400 hover:text-gray-600"
                )}
              >
                Staff
              </button>
            )}
            {currentUser.role === 'admin' && (
              <button 
                onClick={() => setManagementTab('teams')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                  managementTab === 'teams' ? "bg-gray-900 text-white shadow-lg" : "text-gray-400 hover:text-gray-600"
                )}
              >
                Teams
              </button>
            )}
          </div>
          {currentUser.role === 'admin' && managementTab === 'teams' && (
            <button 
              onClick={() => setIsTeamModalOpen(true)}
              className="px-4 lg:px-6 py-2.5 lg:py-3 bg-[#FF0000] text-white rounded-2xl font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-xl text-sm lg:text-base"
            >
              <Shield size={18} /> Create Team
            </button>
          )}
          {managementTab !== 'teams' && (
            <button 
              onClick={() => {
                setNewUser({ ...newUser, role: managementTab === 'clients' ? 'client' : 'manager' });
                setIsCreateModalOpen(true);
              }}
              className="px-4 lg:px-6 py-2.5 lg:py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl text-sm lg:text-base"
            >
              <UserPlus size={18} /> Add {managementTab === 'clients' ? 'Client' : 'Staff'}
            </button>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 lg:p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 lg:gap-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder={managementTab === 'teams' ? "Search teams..." : "Search by name or email..."} 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 lg:py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#FF0000]/20 text-sm lg:text-base"
          />
        </div>
        <div className="flex items-center gap-3 lg:gap-4">
          {managementTab !== 'teams' && (
            <>
              <div className="flex bg-gray-50 p-1 rounded-xl">
                <button 
                  onClick={() => setView('list')}
                  className={cn("p-1.5 lg:p-2 rounded-lg transition-all", view === 'list' ? "bg-white shadow-sm text-[#FF0000]" : "text-gray-400")}
                >
                  <List size={18} />
                </button>
                <button 
                  onClick={() => setView('grid')}
                  className={cn("p-1.5 lg:p-2 rounded-lg transition-all", view === 'grid' ? "bg-white shadow-sm text-[#FF0000]" : "text-gray-400")}
                >
                  <LayoutGrid size={18} />
                </button>
              </div>
              <select 
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="flex-1 md:flex-none bg-gray-50 border-none rounded-xl text-xs lg:text-sm px-3 lg:px-4 py-2.5 lg:py-3 focus:ring-2 focus:ring-[#FF0000]/20"
              >
                <option value="all">All Roles</option>
                {managementTab === 'clients' ? (
                  <option value="client">Clients</option>
                ) : (
                  <>
                    <option value="manager">Managers</option>
                    <option value="team_lead">Team Leads</option>
                    <option value="admin">Admins</option>
                  </>
                )}
              </select>
            </>
          )}
        </div>
      </div>

      {/* Content Area */}
      {managementTab === 'teams' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => {
            const teamLead = (users || []).find(u => u.uid === team.teamLeadId);
            const teamMembers = users.filter(u => u.teamId === team.id);
            return (
              <motion.div 
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#FF0000] flex items-center justify-center font-bold text-xl">
                      {team.name.substring(0, 1)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{team.name}</h3>
                      <p className="text-xs text-gray-500">{teamMembers.length} members</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setEditingTeam(team)}
                    className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Team Lead</p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-bold text-[#FF0000] text-xs">
                        {teamLead?.displayName.substring(0, 1) || '?'}
                      </div>
                      <p className="text-sm font-bold">{teamLead?.displayName || 'Not Assigned'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Created</span>
                    <span className="font-bold">{new Date(team.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {view === 'list' ? (
            <div className="overflow-x-auto">
              {/* Desktop Table View */}
              <table className="w-full hidden md:table">
                <thead>
                  <tr className="bg-gray-50/50 text-left">
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                    {managementTab === 'clients' && <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Balance</th>}
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    {managementTab === 'clients' && <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Demo Time</th>}
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map((user) => (
                    <tr key={user.uid} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-bold text-[#FF0000] text-lg">
                            {user.displayName.substring(0, 1)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 flex items-center gap-2">
                              {user.displayName}
                              {user.isActivated && <Shield size={14} className="text-green-500" />}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1"><Mail size={12} /> {user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                          user.role === 'admin' ? "bg-purple-50 text-purple-600" :
                          user.role === 'team_lead' ? "bg-blue-50 text-blue-600" :
                          user.role === 'manager' ? "bg-orange-50 text-orange-600" : "bg-gray-50 text-gray-600"
                        )}>
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      {managementTab === 'clients' && (
                        <td className="px-8 py-6">
                          <p className="font-bold text-gray-900">{user.balance.toLocaleString()} €</p>
                        </td>
                      )}
                      <td className="px-8 py-6">
                        <span className={cn(
                          "flex items-center gap-1.5 text-xs font-bold",
                          user.status === 'active' ? "text-green-500" : "text-red-500"
                        )}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", user.status === 'active' ? "bg-green-500" : "bg-red-500")} />
                          {user.status.toUpperCase()}
                        </span>
                      </td>
                      {managementTab === 'clients' && (
                        <td className="px-8 py-6">
                          <p className="text-xs font-medium text-gray-500">{formatTime(user.demoTimeLeft)}</p>
                        </td>
                      )}
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          {managementTab === 'clients' && (
                            <>
                              <button 
                                onClick={() => setViewingUserTxs(user)}
                                className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-colors"
                                title="Activity Log"
                              >
                                <Activity size={18} />
                              </button>
                              <button 
                                onClick={() => onUpdateUser(user.uid, { isActivated: !user.isActivated })}
                                className={cn(
                                  "p-2 rounded-xl transition-colors",
                                  user.isActivated ? "hover:bg-orange-50 text-orange-600" : "hover:bg-green-50 text-green-600"
                                )}
                                title={user.isActivated ? "Set to Demo" : "Activate Account"}
                              >
                                <Shield size={18} />
                              </button>
                              {!user.isActivated && (
                                <button 
                                  onClick={() => onUpdateUser(user.uid, { demoTimeLeft: 24 * 60 * 60 * 1000 })}
                                  className="p-2 hover:bg-purple-50 text-purple-600 rounded-xl transition-colors"
                                  title="Reset Demo Timer"
                                >
                                  <RefreshCw size={18} />
                                </button>
                              )}
                            </>
                          )}
                          <button 
                            onClick={() => setEditingUser(user)}
                            className="p-2 hover:bg-gray-100 text-gray-600 rounded-xl transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          {currentUser.role === 'admin' && (
                            <button className="p-2 hover:bg-red-50 text-red-600 rounded-xl transition-colors">
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

            {/* Mobile Card View (List) */}
            <div className="md:hidden divide-y divide-gray-50">
              {filteredUsers.map((user) => (
                <div key={user.uid} className="p-4 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-[#FF0000]">
                        {user.displayName.substring(0, 1)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{user.displayName}</p>
                        <p className="text-[10px] text-gray-500 truncate max-w-[150px]">{user.email}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest",
                      user.role === 'admin' ? "bg-purple-50 text-purple-600" :
                      user.role === 'team_lead' ? "bg-blue-50 text-blue-600" :
                      user.role === 'manager' ? "bg-orange-50 text-orange-600" : "bg-gray-50 text-gray-600"
                    )}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-0.5">Balance</p>
                      <p className="text-sm font-bold">{user.balance.toLocaleString()} {user.currency}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onUpdateUser(user.uid, { isActivated: !user.isActivated })}
                        className={cn("p-2 rounded-xl", user.isActivated ? "text-green-600 bg-green-50" : "text-gray-400")}
                        title={user.isActivated ? "Deactivate Account" : "Activate Account"}
                      >
                        <Shield size={16} />
                      </button>
                      {user.role === 'client' && !user.isActivated && (
                        <button 
                          onClick={() => onUpdateUser(user.uid, { demoTimeLeft: 7200 })}
                          className="p-2 text-gray-400 hover:text-blue-600"
                          title="Reset Demo Timer"
                        >
                          <RefreshCw size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => setViewingUserTxs(user)}
                        className="p-2 text-gray-400 hover:text-blue-600"
                      >
                        <Activity size={16} />
                      </button>
                      <button 
                        onClick={() => onUpdateUser(user.uid, { status: user.status === 'active' ? 'suspended' : 'active' })}
                        className={cn("p-2 rounded-xl transition-colors", user.status === 'active' ? "text-gray-400" : "text-red-600 bg-red-50")}
                      >
                        <Lock size={16} />
                      </button>
                      <button 
                        onClick={() => setEditingUser(user)}
                        className="p-2 text-gray-400"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => onDeleteUser(user.uid)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 p-4 lg:p-8">
            {filteredUsers.map((user) => (
              <div key={user.uid} className="p-4 lg:p-6 rounded-3xl border border-gray-100 hover:border-[#FF0000]/20 hover:shadow-xl hover:shadow-red-500/5 transition-all group">
                <div className="flex items-center justify-between mb-4 lg:mb-6">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl bg-gray-50 flex items-center justify-center font-bold text-[#FF0000] text-xl lg:text-2xl group-hover:bg-[#FF0000] group-hover:text-white transition-colors">
                    {user.displayName.substring(0, 1)}
                  </div>
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === user.uid ? null : user.uid);
                      }}
                      className="p-2 hover:bg-gray-50 rounded-xl text-gray-400"
                    >
                      <MoreVertical size={20} />
                    </button>
                    
                    <AnimatePresence>
                      {activeMenu === user.uid && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 py-2"
                        >
                          <button 
                            onClick={() => setEditingUser(user)}
                            className="w-full px-4 py-2 text-left text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                          >
                            <Edit2 size={16} className="text-gray-400" /> Edit Account
                          </button>
                          <button 
                            onClick={() => onUpdateUser(user.uid, { isActivated: !user.isActivated })}
                            className="w-full px-4 py-2 text-left text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                          >
                            <Shield size={16} className="text-gray-400" /> {user.isActivated ? 'Deactivate' : 'Activate'}
                          </button>
                          <button 
                            onClick={() => setViewingUserTxs(user)}
                            className="w-full px-4 py-2 text-left text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                          >
                            <Activity size={16} className="text-gray-400" /> View Activity
                          </button>
                          <button 
                            onClick={() => onUpdateUser(user.uid, { status: user.status === 'active' ? 'suspended' : 'active' })}
                            className="w-full px-4 py-2 text-left text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                          >
                            <Lock size={16} className="text-gray-400" /> {user.status === 'active' ? 'Suspend' : 'Unsuspend'}
                          </button>
                          <div className="h-px bg-gray-100 my-2" />
                          <button 
                            onClick={() => onDeleteUser(user.uid)}
                            className="w-full px-4 py-2 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-3"
                          >
                            <Trash2 size={16} /> Delete Account
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <h4 className="text-base lg:text-lg font-bold mb-1 flex items-center gap-2">
                  {user.displayName}
                  {user.isActivated && <Shield size={14} className="text-green-500" />}
                </h4>
                <p className="text-xs lg:text-sm text-gray-500 mb-4 truncate">{user.email}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div>
                    <p className="text-[8px] lg:text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Balance</p>
                    <p className="text-sm lg:text-base font-bold text-[#FF0000]">{user.balance.toLocaleString()} {user.currency}</p>
                  </div>
                  {user.role === 'client' && !user.isActivated && (
                    <div className="text-right">
                      <p className="text-[8px] lg:text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Demo Time</p>
                      <p className={cn(
                        "text-sm lg:text-base font-mono font-bold",
                        (user.demoTimeLeft || 0) <= 0 ? "text-red-500" : "text-blue-600"
                      )}>
                        {formatTime(user.demoTimeLeft || 0)}
                      </p>
                    </div>
                  )}
                  <span className={cn(
                    "px-2 lg:px-3 py-1 rounded-full text-[8px] lg:text-[10px] font-bold uppercase tracking-widest",
                    user.role === 'admin' ? "bg-purple-50 text-purple-600" : "bg-gray-50 text-gray-600"
                  )}>
                    {user.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        {filteredUsers.length === 0 && (
          <div className="text-center py-12 lg:py-20">
            <Users size={40} className="lg:w-12 lg:h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium text-sm lg:text-base">No users found</p>
          </div>
        )}
      </div>
    )}

      {/* User Transactions Modal */}
      {viewingUserTxs && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold">Activity Log</h3>
                <p className="text-sm text-gray-500">{viewingUserTxs.displayName} ({viewingUserTxs.email})</p>
              </div>
              <button onClick={() => setViewingUserTxs(null)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {transactions.filter(t => t.userId === viewingUserTxs.uid).length > 0 ? (
                transactions
                  .filter(t => t.userId === viewingUserTxs.uid)
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-2 rounded-xl",
                          tx.type === 'deposit' || tx.type === 'sell' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        )}>
                          {tx.type === 'deposit' || tx.type === 'sell' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                        </div>
                        <div>
                          <p className="font-bold text-sm capitalize">{tx.type} {tx.asset}</p>
                          <p className="text-xs text-gray-500">{new Date(tx.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "font-bold",
                          tx.type === 'deposit' || tx.type === 'sell' ? "text-green-600" : "text-red-600"
                        )}>
                          {tx.type === 'deposit' || tx.type === 'sell' ? '+' : '-'}{tx.amount.toLocaleString()} {viewingUserTxs.currency}
                        </p>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{tx.status}</span>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-12">
                  <Clock size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-500">No transactions found for this user</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Add New {managementTab === 'clients' ? 'Client' : 'Staff'}</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={newUser.displayName}
                  onChange={(e) => setNewUser({...newUser, displayName: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#FF0000]/20"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#FF0000]/20"
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Password</label>
                <input 
                  type="password" 
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#FF0000]/20"
                  placeholder="••••••••"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Role</label>
                  <select 
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#FF0000]/20"
                  >
                    {managementTab === 'clients' ? (
                      <option value="client">Client</option>
                    ) : (
                      <>
                        <option value="manager">Manager</option>
                        {currentUser.role === 'admin' && (
                          <>
                            <option value="team_lead">Team Lead</option>
                            <option value="admin">Admin</option>
                          </>
                        )}
                      </>
                    )}
                  </select>
                </div>
                {managementTab === 'clients' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Initial Balance</label>
                    <input 
                      type="number" 
                      value={newUser.balance}
                      onChange={(e) => setNewUser({...newUser, balance: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#FF0000]/20"
                    />
                  </div>
                )}
              </div>
              {managementTab === 'staff' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Assign to Team</label>
                  <select 
                    value={newUser.teamId || ''}
                    onChange={(e) => setNewUser({...newUser, teamId: e.target.value || null})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#FF0000]/20"
                  >
                    <option value="">No Team</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}
              {managementTab === 'clients' && (currentUser.role === 'admin' || currentUser.role === 'master') && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Assign Manager</label>
                  <select 
                    value={newUser.managerId || ''}
                    onChange={(e) => setNewUser({...newUser, managerId: e.target.value || null})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#FF0000]/20"
                  >
                    <option value="">No Manager</option>
                    {users.filter(u => u.role === 'manager').map(m => (
                      <option key={m.uid} value={m.uid}>{m.displayName}</option>
                    ))}
                  </select>
                </div>
              )}
              <button 
                type="submit"
                className="w-full py-4 bg-[#FF0000] text-white rounded-2xl font-bold text-lg hover:bg-red-700 transition-all shadow-xl shadow-red-500/20"
              >
                Create Account
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Edit Account</h3>
              <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X size={24} />
              </button>
            </div>

            <div className="flex gap-4 mb-6 border-b border-gray-100">
              <button 
                onClick={() => setActiveEditTab('profile')}
                className={cn(
                  "pb-4 px-2 text-sm font-bold uppercase tracking-widest transition-all relative",
                  activeEditTab === 'profile' ? "text-[#FF0000]" : "text-gray-400"
                )}
              >
                Profile
                {activeEditTab === 'profile' && <motion.div layoutId="editTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF0000]" />}
              </button>
              {editingUser.role === 'client' && (
                <button 
                  onClick={() => setActiveEditTab('bot')}
                  className={cn(
                    "pb-4 px-2 text-sm font-bold uppercase tracking-widest transition-all relative",
                    activeEditTab === 'bot' ? "text-[#FF0000]" : "text-gray-400"
                  )}
                >
                  Bot Settings
                  {activeEditTab === 'bot' && <motion.div layoutId="editTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF0000]" />}
                </button>
              )}
            </div>
            
            {activeEditTab === 'profile' ? (
              <form onSubmit={handleUpdateUser} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={editingUser.displayName}
                    onChange={(e) => setEditingUser({...editingUser, displayName: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#FF0000]/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#FF0000]/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Role</label>
                    <select 
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({...editingUser, role: e.target.value as UserRole})}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#FF0000]/20"
                      disabled={currentUser.role === 'manager' || currentUser.role === 'team_lead'}
                    >
                      <option value="client">Client</option>
                      <option value="manager">Manager</option>
                      <option value="team_lead">Team Lead</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  {editingUser.role === 'client' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Balance</label>
                      <input 
                        type="number" 
                        value={editingUser.balance}
                        onChange={(e) => setEditingUser({...editingUser, balance: Number(e.target.value)})}
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#FF0000]/20"
                      />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</label>
                    <select 
                      value={editingUser.status}
                      onChange={(e) => setEditingUser({...editingUser, status: e.target.value as any})}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#FF0000]/20"
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  {editingUser.role === 'client' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Activation</label>
                      <select 
                        value={editingUser.isActivated ? 'true' : 'false'}
                        onChange={(e) => setEditingUser({...editingUser, isActivated: e.target.value === 'true'})}
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#FF0000]/20"
                      >
                        <option value="true">Activated</option>
                        <option value="false">Demo Mode</option>
                      </select>
                    </div>
                  )}
                </div>
                {editingUser.role !== 'client' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Assign to Team</label>
                    <select 
                      value={editingUser.teamId || ''}
                      onChange={(e) => setEditingUser({...editingUser, teamId: e.target.value || null})}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#FF0000]/20"
                    >
                      <option value="">No Team</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                )}
                {editingUser.role === 'client' && (currentUser.role === 'admin' || currentUser.role === 'master') && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Assign Manager</label>
                    <select 
                      value={editingUser.managerId || ''}
                      onChange={(e) => setEditingUser({...editingUser, managerId: e.target.value || null})}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#FF0000]/20"
                    >
                      <option value="">No Manager</option>
                      {users.filter(u => u.role === 'manager').map(m => (
                        <option key={m.uid} value={m.uid}>{m.displayName}</option>
                      ))}
                    </select>
                  </div>
                )}
                <button 
                  type="submit"
                  className="w-full py-4 bg-[#FF0000] text-white rounded-2xl font-bold text-lg hover:bg-red-700 transition-all shadow-xl shadow-red-500/20"
                >
                  Save Changes
                </button>
              </form>
            ) : (
              <form onSubmit={handleUpdateBotConfig} className="space-y-6">
                {editingUserBotConfig ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Strategy</label>
                      <select 
                        value={editingUserBotConfig.strategy}
                        onChange={(e) => setEditingUserBotConfig({...editingUserBotConfig, strategy: e.target.value as any})}
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#FF0000]/20"
                      >
                        <option value="conservative">Conservative</option>
                        <option value="aggressive">Aggressive</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Max Investment</label>
                      <input 
                        type="number" 
                        value={editingUserBotConfig.maxInvestment}
                        onChange={(e) => setEditingUserBotConfig({...editingUserBotConfig, maxInvestment: Number(e.target.value)})}
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#FF0000]/20"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          editingUserBotConfig.active ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                        )}>
                          <Activity size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold">Bot Status</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest">{editingUserBotConfig.active ? 'Running' : 'Paused'}</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setEditingUserBotConfig({...editingUserBotConfig, active: !editingUserBotConfig.active})}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                          editingUserBotConfig.active ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                        )}
                      >
                        {editingUserBotConfig.active ? 'Stop' : 'Start'}
                      </button>
                    </div>
                    <button 
                      type="submit"
                      className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-xl"
                    >
                      Save Bot Config
                    </button>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Activity size={48} className="mx-auto text-gray-200 mb-4 animate-pulse" />
                    <p className="text-gray-500">Loading bot configuration...</p>
                  </div>
                )}
              </form>
            )}
          </motion.div>
        </div>
      )}

      {/* Create Team Modal */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold">Create New Team</h3>
              <button onClick={() => setIsTeamModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateTeam} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Team Name</label>
                <input 
                  type="text" 
                  required
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#FF0000]/20"
                  placeholder="Alpha Team"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Team Lead</label>
                <select 
                  value={newTeam.teamLeadId}
                  onChange={(e) => setNewTeam({...newTeam, teamLeadId: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#FF0000]/20"
                  required
                >
                  <option value="">Select Team Lead</option>
                  {users.filter(u => u.role === 'team_lead' || u.role === 'manager').map(u => (
                    <option key={u.uid} value={u.uid}>{u.displayName} ({u.role})</option>
                  ))}
                </select>
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-[#FF0000] text-white rounded-2xl font-bold text-lg hover:bg-red-700 transition-all shadow-xl shadow-red-500/20"
              >
                Create Team
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Team Modal */}
      {editingTeam && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Edit Team</h3>
              <button onClick={() => setEditingTeam(null)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdateTeam} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Team Name</label>
                <input 
                  type="text" 
                  required
                  value={editingTeam.name}
                  onChange={(e) => setEditingTeam({...editingTeam, name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#FF0000]/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Team Lead</label>
                <select 
                  value={editingTeam.teamLeadId}
                  onChange={(e) => setEditingTeam({...editingTeam, teamLeadId: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#FF0000]/20"
                >
                  <option value="">Select Team Lead</option>
                  {users.filter(u => u.role === 'team_lead' || u.role === 'manager').map(u => (
                    <option key={u.uid} value={u.uid}>{u.displayName} ({u.role})</option>
                  ))}
                </select>
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-[#FF0000] text-white rounded-2xl font-bold text-lg hover:bg-red-700 transition-all shadow-xl shadow-red-500/20"
              >
                Save Changes
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
