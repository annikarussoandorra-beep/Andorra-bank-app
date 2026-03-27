import React, { useMemo } from 'react';
import { Users, MessageSquare, Clock, ShieldCheck, UserPlus, Activity } from 'lucide-react';
import { UserProfile, Team, ChatMessage } from '../types';
import { Language, translations } from '../translations';

interface AdminDashboardProps {
  user: UserProfile;
  allUsers: UserProfile[];
  teams: Team[];
  messages: ChatMessage[];
  language: Language;
}

export default function AdminDashboard({ user, allUsers, teams, messages, language }: AdminDashboardProps) {
  const t = translations[language];

  const stats = useMemo(() => {
    let relevantUsers = [];
    if (user.role === 'admin' || user.role === 'master') {
      relevantUsers = allUsers.filter(u => u.role === 'client');
    } else if (user.role === 'manager') {
      relevantUsers = allUsers.filter(u => u.managerId === user.uid && u.role === 'client');
    } else if (user.role === 'team_lead') {
      relevantUsers = allUsers.filter(u => u.teamId === user.teamId && u.role === 'client');
    }

    const recentLogins = [...relevantUsers]
      .sort((a, b) => new Date(b.lastSeen || 0).getTime() - new Date(a.lastSeen || 0).getTime())
      .slice(0, 5);

    const recentMessages = [...messages]
      .filter(m => m.senderId !== user.uid)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    return {
      totalClients: relevantUsers.length,
      totalTeams: teams.length,
      teamMembers: user.role === 'team_lead' ? allUsers.filter(u => u.teamId === user.teamId && u.role === 'manager').length : 0,
      recentLogins,
      recentMessages
    };
  }, [allUsers, teams, messages, user]);

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
          {user.role === 'admin' || user.role === 'master' ? 'Admin Dashboard' : 
           user.role === 'team_lead' ? 'Team Lead Dashboard' : 'Manager Dashboard'}
        </h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Users size={24} />
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">Total Clients</p>
          <h3 className="text-3xl font-bold text-gray-900">{stats.totalClients}</h3>
        </div>

        {(user.role === 'admin' || user.role === 'master') && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                <ShieldCheck size={24} />
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-1">Total Teams</p>
            <h3 className="text-3xl font-bold text-gray-900">{stats.totalTeams}</h3>
          </div>
        )}

        {user.role === 'team_lead' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                <UserPlus size={24} />
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-1">Team Managers</p>
            <h3 className="text-3xl font-bold text-gray-900">{stats.teamMembers}</h3>
          </div>
        )}

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-xl text-green-600">
              <MessageSquare size={24} />
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">Total Messages</p>
          <h3 className="text-3xl font-bold text-gray-900">{messages.length}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Logins */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Activity size={20} className="text-blue-500" />
              Recent Client Logins
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.recentLogins.length > 0 ? (
              stats.recentLogins.map(client => (
                <div key={client.uid} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      {client.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{client.displayName}</p>
                      <p className="text-xs text-gray-500">{client.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={12} />
                      {client.lastSeen ? new Date(client.lastSeen).toLocaleString() : 'Never'}
                    </div>
                    <span className="inline-block mt-1 px-2 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-full">
                      {client.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                No recent logins found.
              </div>
            )}
          </div>
        </div>

        {/* Recent Messages */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <MessageSquare size={20} className="text-green-500" />
              Recent Messages
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.recentMessages.length > 0 ? (
              stats.recentMessages.map(msg => {
                const sender = allUsers.find(u => u.uid === msg.senderId);
                return (
                  <div key={msg.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900">
                          {sender ? sender.displayName : 'Unknown'}
                        </span>
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {sender?.role || 'user'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{msg.text}</p>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-gray-500">
                No recent messages.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
