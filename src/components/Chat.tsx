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

interface ChatProps {
  currentUser: UserProfile;
  messages: ChatMessage[];
  onSendMessage: (receiverId: string, data: Partial<ChatMessage>) => void;
  onDeleteMessage: (id: string) => void;
  onEditMessage: (id: string, text: string) => void;
  onClearChat: (contactId: string) => void;
  contacts: UserProfile[];
  allUsers: UserProfile[];
}

export default function Chat({ 
  currentUser, 
  messages, 
  onSendMessage, 
  onDeleteMessage,
  onEditMessage,
  onClearChat,
  contacts, 
  allUsers 
}: ChatProps) {
  const [inputText, setInputText] = useState('');
  const [selectedContact, setSelectedContact] = useState<UserProfile | null>(contacts[0] || null);
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

  const emojis = ['😊', '😂', '🥰', '👍', '🔥', '🚀', '💰', '📈', '🤝', '🙌', '✨', '✅'];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    
    // Audio notification for new messages
    if (messages.length > lastMessageCount.current) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.senderId !== currentUser.uid) {
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

  const handleSend = () => {
    if (inputText.trim() && selectedContact) {
      onSendMessage(selectedContact.uid, { text: inputText, type: 'text' });
      setInputText('');
      setShowEmojiPicker(false);
    }
  };

  const handleSendRequisites = () => {
    if (requisitesText.trim() && selectedContact) {
      onSendMessage(selectedContact.uid, { 
        text: 'Bank Requisites', 
        type: 'requisites', 
        requisites: requisitesText 
      });
      setRequisitesText('');
      setShowSpecialModal(false);
    }
  };

  const handleSendPaymentLink = () => {
    if (paymentData.text.trim() && paymentData.buttonLabel.trim() && paymentData.url.trim() && selectedContact) {
      onSendMessage(selectedContact.uid, { 
        text: paymentData.text, 
        type: 'payment_link', 
        paymentLink: paymentData 
      });
      setPaymentData({ text: '', buttonLabel: '', url: '' });
      setShowSpecialModal(false);
    }
  };

  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.text);
  };

  const handleSaveEdit = () => {
    if (editingMessageId && editingText.trim()) {
      onEditMessage(editingMessageId, editingText);
      setEditingMessageId(null);
      setEditingText('');
    }
  };

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
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(id);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const isStaff = currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.role === 'team_lead' || currentUser.role === 'master';

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex h-[calc(100vh-12rem)] md:h-[calc(100vh-12rem)]">
      {/* Contact List */}
      <div className={cn(
        "w-full md:w-80 border-r border-gray-100 flex flex-col transition-all duration-300",
        showMobileChat ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 lg:p-6 border-b border-gray-100">
          <h3 className="text-lg lg:text-xl font-bold mb-4">Messages</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search chats..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-xs lg:text-sm focus:ring-2 focus:ring-[#FF0000]/20"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.map((contact) => {
            const lastMsg = messages.filter(m => {
              const isDirect = (m.senderId === contact.uid && m.receiverId === currentUser.uid) ||
                             (m.senderId === currentUser.uid && m.receiverId === contact.uid);
              const isSupport = (currentUser.role === 'admin' || currentUser.role === 'team_lead' || currentUser.role === 'master') && 
                               (m.senderId === contact.uid && m.receiverId === 'support-team');
              const isSupportReply = (currentUser.role === 'admin' || currentUser.role === 'team_lead' || currentUser.role === 'master') &&
                                    (m.senderId === 'support-team' && m.receiverId === contact.uid);
              const isClientSupport = (currentUser.role === 'client' && contact.uid === 'support-team') &&
                                     (m.senderId === currentUser.uid && m.receiverId === 'support-team' ||
                                      m.senderId === 'support-team' && m.receiverId === currentUser.uid ||
                                      (allUsers.find(u => u.uid === m.senderId)?.role === 'admin' && m.receiverId === currentUser.uid));
              
              return isDirect || isSupport || isSupportReply || isClientSupport;
            }).pop();

            return (
              <button
                key={contact.uid}
                onClick={() => handleContactClick(contact)}
                className={cn(
                  "w-full p-4 flex items-center gap-3 lg:gap-4 hover:bg-gray-50 transition-colors border-b border-gray-50",
                  selectedContact?.uid === contact.uid && "bg-red-50 border-l-4 border-l-[#FF0000]"
                )}
              >
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-gray-100 flex items-center justify-center font-bold text-[#FF0000] text-sm lg:text-base">
                  {contact.displayName.substring(0, 1)}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="font-bold text-xs lg:text-sm truncate">{contact.displayName}</p>
                  <p className="text-[10px] lg:text-xs text-gray-500 truncate">
                    {lastMsg ? lastMsg.text : contact.role.toUpperCase()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[8px] lg:text-[10px] text-gray-400">
                    {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                  {lastMsg && lastMsg.senderId !== currentUser.uid && (
                    <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-[#FF0000] animate-pulse"></div>
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
                  {selectedContact.displayName.substring(0, 1)}
                </div>
                <div>
                  <p className="font-bold text-xs lg:text-sm">{selectedContact.displayName}</p>
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
                          onClearChat(selectedContact.uid);
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
                
                // Staff viewing a client's chat should also see messages the client sent to support
                const isStaffViewingClientSupport = isStaff && selectedContact.role === 'client' && 
                                                  m.senderId === selectedContact.uid && m.receiverId === 'support-team';

                const isSupport = isStaff && selectedContact.uid === 'support-team' && m.receiverId === 'support-team';
                const isSupportReply = isStaff && selectedContact.uid === 'support-team' && m.senderId === 'support-team';
                
                const isClientSupport = (currentUser.role === 'client' && selectedContact.uid === 'support-team') &&
                                       (m.senderId === currentUser.uid && m.receiverId === 'support-team' ||
                                        m.senderId === 'support-team' && m.receiverId === currentUser.uid ||
                                        (['admin', 'manager', 'team_lead', 'master'].includes((allUsers || []).find(u => u.uid === m.senderId)?.role || '') && m.receiverId === currentUser.uid));
                
                return isDirect || isStaffViewingClientSupport || isSupport || isSupportReply || isClientSupport;
              }).map((msg) => (
                <div 
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[85%] md:max-w-[70%] group relative",
                    msg.senderId === currentUser.uid ? "ml-auto items-end" : "items-start"
                  )}
                >
                  <div className={cn(
                    "p-3 lg:p-4 rounded-xl lg:rounded-2xl text-xs lg:text-sm font-medium shadow-sm overflow-hidden min-w-0 relative",
                    msg.senderId === currentUser.uid 
                      ? "bg-[#FF0000] text-white rounded-tr-none" 
                      : "bg-white text-gray-900 rounded-tl-none"
                  )}>
                    {msg.type === 'requisites' ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[#FF0000] font-bold mb-1">
                          <CreditCard size={16} />
                          <span>Bank Requisites</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl text-gray-700 font-mono text-[10px] lg:text-xs whitespace-pre-wrap border border-gray-100">
                          {msg.requisites}
                        </div>
                        <button 
                          onClick={() => copyToClipboard(msg.requisites || '', msg.id)}
                          className={cn(
                            "w-full py-2 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-[10px] lg:text-xs",
                            copySuccess === msg.id ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          )}
                        >
                          {copySuccess === msg.id ? <Check size={14} /> : <Copy size={14} />}
                          {copySuccess === msg.id ? 'Copied!' : 'Copy Requisites'}
                        </button>
                      </div>
                    ) : msg.type === 'payment_link' ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[#FF0000] font-bold mb-1">
                          <ExternalLink size={16} />
                          <span>Payment Request</span>
                        </div>
                        <p className="text-gray-700">{msg.paymentLink?.text}</p>
                        <a 
                          href={msg.paymentLink?.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-3 bg-[#FF0000] text-white rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
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
                  {(msg.senderId === currentUser.uid || isStaff) && (
                    <div className={cn(
                      "absolute top-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
                      msg.senderId === currentUser.uid ? "right-full mr-2" : "left-full ml-2"
                    )}>
                      {msg.senderId === currentUser.uid && msg.type !== 'requisites' && msg.type !== 'payment_link' && (
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
              ))}
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
                    className="flex-1 bg-transparent border-none focus:ring-0 text-xs lg:text-sm font-medium text-blue-900"
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
                    className="flex-1 bg-transparent border-none focus:ring-0 text-xs lg:text-sm font-medium"
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

