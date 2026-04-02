import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  User, 
  MoreVertical, 
  Search, 
  Smile,
  FileText,
  Trash2,
  Pencil,
  Check,
  X as CloseIcon,
  CreditCard,
  Copy,
  ExternalLink,
  Plus
} from 'lucide-react';
import { ChatMessage, UserProfile } from '../types';
import { cn } from '../lib/utils';
import { api } from '../firebase';
import { Language, translations } from '../translations';

interface ChatProps {
  currentUser: UserProfile;
  messages: ChatMessage[];
  onSendMessage: (receiverId: string, data: Partial<ChatMessage>) => void;
  onDeleteMessage: (id: string) => void;
  onEditMessage: (id: string, text: string) => void;
  onClearChat: (contactId: string, asSupport?: boolean) => void;
  onMarkAsRead: (senderId: string, receiverId?: string) => void;
  contacts: UserProfile[];
  allUsers: UserProfile[];
  language: Language;
}

export default React.memo(function Chat({ 
  currentUser, 
  messages, 
  onSendMessage, 
  onDeleteMessage,
  onEditMessage,
  onClearChat,
  onMarkAsRead,
  contacts, 
  allUsers,
  language
}: ChatProps) {
  const [inputText, setInputText] = useState('');
  const t = translations[language];
  const [selectedContact, setSelectedContact] = useState<UserProfile | null>(contacts[0] || null);
  const [chatTab, setChatTab] = useState<'direct' | 'support'>('direct');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [showSpecialModal, setShowSpecialModal] = useState(false);
  const [specialType, setSpecialType] = useState<'requisites' | 'payment_link'>('requisites');
  const [requisitesText, setRequisitesText] = useState('');
  const [paymentData, setPaymentData] = useState({ text: '', buttonLabel: '', url: '' });
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const lastMessageCount = useRef(messages.length);
  const isStaff = currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.role === 'team_lead' || currentUser.role === 'master';

  const emojis = ['😊', '😂', '🥰', '👍', '🔥', '🚀', '💰', '📈', '🤝', '🙌', '✨', '✅'];

  useEffect(() => {
    if (selectedContact) {
      const receiverId = (isStaff && chatTab === 'support') ? 'support-team' : currentUser.uid;
      const hasUnread = messages.some(m => m.senderId === selectedContact.uid && m.receiverId === receiverId && !m.read);
      if (hasUnread) {
        onMarkAsRead(selectedContact.uid, receiverId);
      }
    }
  }, [selectedContact, messages, currentUser.uid, onMarkAsRead, isStaff, chatTab]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    
    // Audio notification for new messages
    if (messages.length > lastMessageCount.current) {
      const lastMsg = messages[messages.length - 1];
      
      // Determine if the message is incoming
      let isIncoming = lastMsg.senderId !== currentUser.uid;
      
      // If staff sends a message to support, senderId is 'support-team', so we shouldn't play sound for them
      if (isStaff && lastMsg.senderId === 'support-team') {
        isIncoming = false;
      }

      if (isIncoming) {
        if (!audioRef.current) {
          audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
        }
        audioRef.current.play().catch(e => console.log('Audio play blocked:', e));
      }
    }
    lastMessageCount.current = messages.length;
  }, [messages, currentUser.uid]);

  useEffect(() => {
    if (!selectedContact && contacts.length > 0) {
      setSelectedContact(contacts[0]);
    }
  }, [contacts, selectedContact]);

  const handleSend = React.useCallback(() => {
    if (inputText.trim() && selectedContact) {
      const senderId = (isStaff && chatTab === 'support') ? 'support-team' : currentUser.uid;
      onSendMessage(selectedContact.uid, { text: inputText, type: 'text', senderId });
      setInputText('');
      setShowEmojiPicker(false);
    }
  }, [inputText, selectedContact, isStaff, chatTab, currentUser.uid, onSendMessage]);

  const handleSendRequisites = React.useCallback(() => {
    if (requisitesText.trim() && selectedContact) {
      const senderId = (isStaff && chatTab === 'support') ? 'support-team' : currentUser.uid;
      onSendMessage(selectedContact.uid, { 
        text: 'Bank Requisites', 
        type: 'requisites', 
        requisites: requisitesText,
        senderId
      });
      setRequisitesText('');
      setShowSpecialModal(false);
    }
  }, [requisitesText, selectedContact, isStaff, chatTab, currentUser.uid, onSendMessage]);

  const handleSendPaymentLink = React.useCallback(() => {
    if (paymentData.text.trim() && paymentData.buttonLabel.trim() && paymentData.url.trim() && selectedContact) {
      const senderId = (isStaff && chatTab === 'support') ? 'support-team' : currentUser.uid;
      onSendMessage(selectedContact.uid, { 
        text: paymentData.text, 
        type: 'payment_link', 
        paymentLink: paymentData,
        senderId
      });
      setPaymentData({ text: '', buttonLabel: '', url: '' });
      setShowSpecialModal(false);
    }
  }, [paymentData, selectedContact, isStaff, chatTab, currentUser.uid, onSendMessage]);

  const handleStartEdit = React.useCallback((msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.text);
  }, []);

  const handleSaveEdit = React.useCallback(() => {
    if (editingMessageId && editingText.trim()) {
      onEditMessage(editingMessageId, editingText);
      setEditingMessageId(null);
      setEditingText('');
    }
  }, [editingMessageId, editingText, onEditMessage]);

  const handleEmojiClick = (emoji: string) => {
    if (editingMessageId) {
      setEditingText(prev => prev + emoji);
    } else {
      setInputText(prev => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleContactClick = (contact: UserProfile) => {
    setSelectedContact(contact);
    setShowMobileChat(true);
    setShowChatMenu(false);
    
    // Mark messages as read
    const receiverId = (isStaff && chatTab === 'support') ? 'support-team' : currentUser.uid;
    onMarkAsRead(contact.uid, receiverId);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(id);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex h-[calc(100vh-12rem)] md:h-[calc(100vh-12rem)]">
      {/* Contact List */}
      <div className={cn(
        "w-full md:w-80 border-r border-gray-100 flex flex-col transition-all duration-300",
        showMobileChat ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 lg:p-6 border-b border-gray-100">
          <h3 className="text-lg lg:text-xl font-bold mb-4">{t.messages}</h3>
          
          {isStaff && (
            <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-2xl">
              <button 
                onClick={() => setChatTab('direct')}
                className={cn(
                  "flex-1 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2",
                  chatTab === 'direct' ? "bg-white text-[#FF0000] shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Clients
                {messages.filter(m => m.receiverId === currentUser.uid && !m.read).length > 0 && (
                  <div className="w-2 h-2 bg-[#FF0000] rounded-full" />
                )}
              </button>
              <button 
                onClick={() => setChatTab('support')}
                className={cn(
                  "flex-1 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2",
                  chatTab === 'support' ? "bg-white text-[#FF0000] shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Support
                {messages.filter(m => m.receiverId === 'support-team' && !m.read).length > 0 && (
                  <div className="w-2 h-2 bg-[#FF0000] rounded-full" />
                )}
              </button>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder={t.search}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-xs lg:text-sm focus:ring-2 focus:ring-[#FF0000]/20"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.filter(contact => {
            if (!isStaff) {
              // Client: show direct manager and support-team
              return true;
            }
            if (chatTab === 'direct') {
              // Staff: show direct clients (not support-team)
              return contact.uid !== 'support-team';
            } else {
              // Staff: show all clients in support tab
              return contact.role === 'client';
            }
          }).sort((a, b) => {
            const getLastMsgTime = (contactUid: string) => {
              const msgs = messages.filter(m => {
                const isDirect = (m.senderId === contactUid && m.receiverId === currentUser.uid) ||
                               (m.senderId === currentUser.uid && m.receiverId === contactUid);
                const isSupport = (m.senderId === contactUid && m.receiverId === 'support-team') ||
                                  (m.senderId === 'support-team' && m.receiverId === contactUid);
                
                if (!isStaff) {
                  if (contactUid === 'support-team') return isSupport;
                  return isDirect;
                }
                
                if (chatTab === 'support') return isSupport;
                return isDirect;
              });
              if (msgs.length === 0) return 0;
              return new Date(msgs[msgs.length - 1].timestamp).getTime();
            };
            return getLastMsgTime(b.uid) - getLastMsgTime(a.uid);
          }).map((contact) => {
            const lastMsg = messages.filter(m => {
              const isDirect = (m.senderId === contact.uid && m.receiverId === currentUser.uid) ||
                             (m.senderId === currentUser.uid && m.receiverId === contact.uid);
              
              const isSupport = currentUser.role === 'client'
                ? ((m.senderId === currentUser.uid && m.receiverId === 'support-team') ||
                   (m.senderId === 'support-team' && m.receiverId === currentUser.uid))
                : ((m.senderId === contact.uid && m.receiverId === 'support-team') ||
                   (m.senderId === 'support-team' && m.receiverId === contact.uid));
              
              if (currentUser.role === 'client') {
                if (contact.uid === 'support-team') return isSupport;
                return isDirect;
              }
              
              // Staff logic
              if (chatTab === 'support') return isSupport;
              return isDirect;
            }).pop();

            const unreadCount = messages.filter(m => {
              const isDirect = (m.senderId === contact.uid && m.receiverId === currentUser.uid) ||
                             (m.senderId === currentUser.uid && m.receiverId === contact.uid);
              
              const isSupport = currentUser.role === 'client'
                ? ((m.senderId === currentUser.uid && m.receiverId === 'support-team') ||
                   (m.senderId === 'support-team' && m.receiverId === currentUser.uid))
                : ((m.senderId === contact.uid && m.receiverId === 'support-team') ||
                   (m.senderId === 'support-team' && m.receiverId === contact.uid));
              
              if (currentUser.role === 'client') {
                if (contact.uid === 'support-team') return isSupport && m.receiverId === currentUser.uid && !m.read;
                return isDirect && m.receiverId === currentUser.uid && !m.read;
              }
              
              // Staff logic
              if (chatTab === 'support') return isSupport && m.receiverId === 'support-team' && !m.read;
              return isDirect && m.receiverId === currentUser.uid && !m.read;
            }).length;

            const isContactOnline = contact.uid === 'support-team' ? true : (contact.lastSeen && (new Date().getTime() - new Date(contact.lastSeen).getTime()) < 5 * 60 * 1000);

            return (
              <button
                key={contact.uid}
                onClick={() => handleContactClick(contact)}
                className={cn(
                  "w-full p-4 flex items-center gap-3 lg:gap-4 hover:bg-gray-50 transition-colors border-b border-gray-50",
                  selectedContact?.uid === contact.uid && "bg-red-50 border-l-4 border-l-[#FF0000]"
                )}
              >
                <div className="relative">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-gray-100 flex items-center justify-center font-bold text-[#FF0000] text-sm lg:text-base">
                    {contact.uid === 'support-team' ? 'S' : contact.displayName.substring(0, 1)}
                  </div>
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white",
                    isContactOnline ? "bg-green-500" : "bg-gray-300"
                  )} />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="font-bold text-xs lg:text-sm truncate">
                    {contact.uid === 'support-team' ? 'Support' : contact.displayName}
                  </p>
                  <p className="text-[10px] lg:text-xs text-gray-500 truncate">
                    {lastMsg ? lastMsg.text : contact.role.toUpperCase()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[8px] lg:text-[10px] text-gray-400">
                    {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                  {unreadCount > 0 && (
                    <div className="bg-[#FF0000] text-white text-[8px] lg:text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {unreadCount}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col bg-gray-50/30 transition-all duration-300",
        !showMobileChat ? "hidden md:flex" : "flex"
      )}>
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-3 lg:p-4 bg-white border-b border-gray-100 flex items-center justify-between relative z-50">
              <div className="flex items-center gap-3 lg:gap-4">
                <button 
                  onClick={() => setShowMobileChat(false)}
                  className="md:hidden p-2 hover:bg-gray-50 rounded-xl text-gray-400"
                >
                  <Search size={20} className="rotate-90" />
                </button>
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-gray-100 flex items-center justify-center font-bold text-[#FF0000] text-xs lg:text-sm">
                  {selectedContact.uid === 'support-team' ? 'S' : selectedContact.displayName.substring(0, 1)}
                </div>
                <div>
                  <p className="font-bold text-xs lg:text-sm">{selectedContact.uid === 'support-team' ? 'Support' : selectedContact.displayName}</p>
                  <p className="text-[8px] lg:text-[10px] text-green-500 font-bold uppercase tracking-widest">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-1 lg:gap-2">
                <div className="relative">
                  <button 
                    onClick={() => setShowChatMenu(!showChatMenu)}
                    className="p-1.5 lg:p-2 hover:bg-gray-50 rounded-xl text-gray-400"
                  >
                    <MoreVertical size={18} className="lg:w-5 lg:h-5" />
                  </button>
                  {showChatMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden">
                      <button 
                        onClick={() => {
                          onClearChat(selectedContact.uid, isStaff && chatTab === 'support');
                          setShowChatMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        Clear Chat
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
              {messages.filter(m => {
                const isDirect = (m.senderId === selectedContact.uid && m.receiverId === currentUser.uid) ||
                               (m.senderId === currentUser.uid && m.receiverId === selectedContact.uid);
                
                const isSupport = currentUser.role === 'client'
                  ? ((m.senderId === currentUser.uid && m.receiverId === 'support-team') ||
                     (m.senderId === 'support-team' && m.receiverId === currentUser.uid))
                  : ((m.senderId === selectedContact.uid && m.receiverId === 'support-team') ||
                     (m.senderId === 'support-team' && m.receiverId === selectedContact.uid));
                
                if (currentUser.role === 'client') {
                  if (selectedContact.uid === 'support-team') return isSupport;
                  return isDirect;
                }
                
                // Staff logic
                if (chatTab === 'support') return isSupport;
                return isDirect;
              }).map((msg) => {
                const isMyMessage = msg.senderId === currentUser.uid || (isStaff && chatTab === 'support' && msg.senderId === 'support-team');
                
                return (
                <div 
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[85%] md:max-w-[70%] group relative",
                    isMyMessage ? "ml-auto items-end" : "items-start"
                  )}
                >
                  <div className={cn(
                    "p-3 lg:p-4 rounded-xl lg:rounded-2xl text-xs lg:text-sm font-medium shadow-sm overflow-hidden min-w-0 relative",
                    isMyMessage 
                      ? "bg-[#FF0000] text-white rounded-tr-none" 
                      : "bg-white text-gray-900 rounded-tl-none"
                  )}>
                    {msg.type === 'requisites' ? (
                      <div className="space-y-3">
                        <div className={cn(
                          "flex items-center gap-2 font-bold mb-1",
                          isMyMessage ? "text-white" : "text-[#FF0000]"
                        )}>
                          <CreditCard size={16} />
                          <span>Bank Requisites</span>
                        </div>
                        <div className={cn(
                          "p-3 rounded-xl font-mono text-[10px] lg:text-xs whitespace-pre-wrap border",
                          isMyMessage 
                            ? "bg-white/10 text-white border-white/20" 
                            : "bg-gray-50 text-gray-700 border-gray-100"
                        )}>
                          {msg.requisites}
                        </div>
                        <button 
                          onClick={() => copyToClipboard(msg.requisites || '', msg.id)}
                          className={cn(
                            "w-full py-2 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-[10px] lg:text-xs",
                            copySuccess === msg.id 
                              ? "bg-green-500 text-white" 
                              : (isMyMessage ? "bg-white/20 text-white hover:bg-white/30" : "bg-gray-100 text-gray-600 hover:bg-gray-200")
                          )}
                        >
                          {copySuccess === msg.id ? <Check size={14} /> : <Copy size={14} />}
                          {copySuccess === msg.id ? 'Copied!' : 'Copy Details'}
                        </button>
                      </div>
                    ) : msg.type === 'payment_link' ? (
                      <div className="space-y-3">
                        <div className={cn(
                          "flex items-center gap-2 font-bold mb-1",
                          isMyMessage ? "text-white" : "text-[#FF0000]"
                        )}>
                          <ExternalLink size={16} />
                          <span>Payment Request</span>
                        </div>
                        <p className={cn(
                          "text-sm",
                          isMyMessage ? "text-white/90" : "text-gray-700"
                        )}>
                          {msg.paymentLink?.text}
                        </p>
                        <a 
                          href={msg.paymentLink?.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg",
                            isMyMessage 
                              ? "bg-white text-[#FF0000] hover:bg-gray-100 shadow-white/10" 
                              : "bg-[#FF0000] text-white hover:bg-red-700 shadow-red-500/20"
                          )}
                        >
                          {msg.paymentLink?.buttonLabel}
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    ) : (
                      msg.text
                    )}
                    {msg.edited && (
                      <span className="block text-[8px] opacity-60 mt-1 italic">edited</span>
                    )}
                  </div>
                  
                  {/* Message Actions */}
                  {(isMyMessage || isStaff) && (
                    <div className={cn(
                      "absolute top-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
                      isMyMessage ? "right-full mr-2" : "left-full ml-2"
                    )}>
                      {isMyMessage && msg.type !== 'requisites' && msg.type !== 'payment_link' && (
                        <button 
                          onClick={() => handleStartEdit(msg)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      <button 
                        onClick={() => onDeleteMessage(msg.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}

                  <span className="text-[8px] lg:text-[10px] text-gray-400 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )})}
            </div>

            {/* Input Area */}
            <div className="p-4 lg:p-6 bg-white border-t border-gray-100 relative">
              {showEmojiPicker && (
                <div className="absolute bottom-full left-4 mb-2 bg-white p-3 rounded-2xl shadow-xl border border-gray-100 grid grid-cols-6 gap-2 z-50">
                  {emojis.map(emoji => (
                    <button 
                      key={emoji} 
                      onClick={() => handleEmojiClick(emoji)}
                      className="text-xl hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
              
              {editingMessageId ? (
                <div className="flex items-center gap-2 lg:gap-4 bg-blue-50 p-1.5 lg:p-2 rounded-xl lg:rounded-2xl border border-blue-100">
                  <div className="p-2 text-blue-600">
                    <Pencil size={18} />
                  </div>
                  <input 
                    type="text" 
                    autoFocus
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-[16px] lg:text-sm font-medium text-blue-900"
                  />
                  <button 
                    onClick={() => setEditingMessageId(null)}
                    className="p-1.5 lg:p-2 hover:bg-blue-100 rounded-lg lg:rounded-xl text-blue-400"
                  >
                    <CloseIcon size={18} />
                  </button>
                  <button 
                    onClick={handleSaveEdit}
                    className="p-2 lg:p-3 bg-blue-600 text-white rounded-lg lg:rounded-xl shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform"
                  >
                    <Check size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 lg:gap-4 bg-gray-50 p-1.5 lg:p-2 rounded-xl lg:rounded-2xl">
                  {isStaff && (
                    <button 
                      onClick={() => setShowSpecialModal(true)}
                      className="p-1.5 lg:p-2 hover:bg-gray-200 rounded-lg lg:rounded-xl text-gray-400"
                      title="Send Special Message"
                    >
                      <CreditCard size={18} className="lg:w-5 lg:h-5" />
                    </button>
                  )}
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Message..." 
                    className="flex-1 bg-transparent border-none focus:ring-0 text-[16px] lg:text-sm font-medium"
                  />
                  <button 
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={cn(
                      "p-1.5 lg:p-2 rounded-lg lg:rounded-xl transition-colors hidden sm:block",
                      showEmojiPicker ? "bg-gray-200 text-[#FF0000]" : "hover:bg-gray-200 text-gray-400"
                    )}
                  >
                    <Smile size={18} className="lg:w-5 lg:h-5" />
                  </button>
                  <button 
                    onClick={handleSend}
                    className="p-2 lg:p-3 bg-[#FF0000] text-white rounded-lg lg:rounded-xl shadow-lg shadow-red-500/20 hover:scale-105 transition-transform"
                  >
                    <Send size={18} className="lg:w-5 lg:h-5" />
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 lg:p-12">
            <div className="w-16 h-16 lg:w-24 lg:h-24 bg-white rounded-full flex items-center justify-center shadow-xl mb-4 lg:mb-6">
              <User size={32} className="lg:w-12 lg:h-12 text-gray-200" />
            </div>
            <h3 className="text-lg lg:text-xl font-bold mb-2">Select a conversation</h3>
            <p className="text-xs lg:text-sm text-gray-500 max-w-xs">Choose a contact from the left to start chatting with your manager or team.</p>
          </div>
        )}
      </div>

      {/* Special Message Modal */}
      {showSpecialModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold">Special Message</h3>
              <button onClick={() => setShowSpecialModal(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <CloseIcon size={24} />
              </button>
            </div>

            <div className="flex gap-2 mb-8 p-1 bg-gray-100 rounded-2xl">
              <button 
                onClick={() => setSpecialType('requisites')}
                className={cn(
                  "flex-1 py-3 rounded-xl font-bold text-sm transition-all",
                  specialType === 'requisites' ? "bg-white text-[#FF0000] shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Requisites
              </button>
              <button 
                onClick={() => setSpecialType('payment_link')}
                className={cn(
                  "flex-1 py-3 rounded-xl font-bold text-sm transition-all",
                  specialType === 'payment_link' ? "bg-white text-[#FF0000] shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Payment Link
              </button>
            </div>

            {specialType === 'requisites' ? (
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 block">Bank Requisites</label>
                  <textarea 
                    value={requisitesText}
                    onChange={(e) => setRequisitesText(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl font-mono text-sm focus:ring-2 focus:ring-[#FF0000]/20 min-h-[150px]"
                    placeholder="Enter bank details here..."
                  />
                </div>
                <button 
                  onClick={handleSendRequisites}
                  disabled={!requisitesText.trim()}
                  className="w-full py-4 bg-[#FF0000] text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 disabled:opacity-50"
                >
                  Send Requisites
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 block">Message Text</label>
                  <textarea 
                    value={paymentData.text}
                    onChange={(e) => setPaymentData({...paymentData, text: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-[#FF0000]/20 min-h-[100px]"
                    placeholder="e.g. Please activate your account to continue trading..."
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 block">Button Label</label>
                  <input 
                    type="text"
                    value={paymentData.buttonLabel}
                    onChange={(e) => setPaymentData({...paymentData, buttonLabel: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-[#FF0000]/20"
                    placeholder="e.g. Activate Account"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 block">Payment URL</label>
                  <input 
                    type="url"
                    value={paymentData.url}
                    onChange={(e) => setPaymentData({...paymentData, url: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-[#FF0000]/20"
                    placeholder="https://..."
                  />
                </div>
                <button 
                  onClick={handleSendPaymentLink}
                  disabled={!paymentData.text.trim() || !paymentData.buttonLabel.trim() || !paymentData.url.trim()}
                  className="w-full py-4 bg-[#FF0000] text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 disabled:opacity-50"
                >
                  Send Payment Link
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
);

