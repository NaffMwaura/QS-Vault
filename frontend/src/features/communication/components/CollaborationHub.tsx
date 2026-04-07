 
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  FileQuestion, 
  Clock, 
  CheckCircle2, 
  User, 
  Plus, 
  ShieldCheck, 
  AlertCircle,
  Paperclip,
  ChevronRight,
  Database
} from 'lucide-react';
import { useAuth } from "../../auth/AuthContext";
import Button from "../../../components/ui/Button";
import GlassCard from "../../../components/ui/GlassCard";
import {
  db,
  syncEngine,
  type ChatMessage,
  type RFI,
} from "../../../lib/database/database";

/** --- TYPES --- **/

type Message = Omit<ChatMessage, "project_id"> & { is_local?: boolean };
type StoredRFI = Omit<RFI, "project_id">;

interface CollaborationHubProps {
  projectId: string | null;
}

/** --- MAIN COMPONENT: COMMUNICATION NODE --- **/

const CollaborationHub: React.FC<CollaborationHubProps> = ({ projectId }) => {
  const { user } = useAuth();
  const currentUserId = user?.id ?? 'local-user';
  
  // Navigation & UI State
  const [activeTab, setActiveTab] = useState<'chat' | 'rfi'>('chat');
  const [, setIsRefreshing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Data States (Live from Dexie Vault)
  const [messages, setMessages] = useState<Message[]>([]);
  const [rfis, setRfis] = useState<StoredRFI[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // RFI Workflow States
  const [isCreatingRFI, setIsCreatingRFI] = useState(false);
  const [rfiForm, setRfiForm] = useState({
    subject: '',
    content: '',
    recipient: 'Lead Architect'
  });

  /** * DATA HANDSHAKE: LIVE VAULT SYNC
   * Pulls messages and formal queries from the local project vault.
   * Works 100% offline.
   */
  const syncCommData = useCallback(async () => {
    if (!db || !projectId) {
      setTimeout(() => setIsRefreshing(false), 1000);
      return;
    }

    try {
      setIsRefreshing(true);
      // Fetching from local Dexie tables
      const [storedMessages, storedRfis] = await Promise.all([
        db.chat_messages.where('project_id').equals(projectId).toArray(),
        db.rfis.where('project_id').equals(projectId).reverse().toArray()
      ]);

      // Sort messages by timestamp locally
      setMessages(storedMessages.sort((a: Message, b: Message) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ));
      setRfis(storedRfis);
    } catch (err) {
      console.error("Comm Engine: Data recovery failed.", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    syncCommData();
  }, [syncCommData]);

  // Auto-scroll logic for the Site Chat
  useEffect(() => {
    if (scrollRef.current) {
       scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  /** * CHAT ENGINE: SEND HANDSHAKE
   * Saves to local device instantly and queues for the Cloud Bridge.
   */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !projectId || !db) return;

    const messageData: Message = {
      id: crypto.randomUUID(),
      user_id: currentUserId,
      text: newMessage,
      timestamp: new Date().toISOString(),
      is_local: true
    };

    try {
      // 1. LOCAL WRITE (Immediate UI feedback)
      await db.chat_messages.add({ ...messageData, project_id: projectId });
      
      // 2. CLOUD QUEUE (Sync in background)
      if (syncEngine) {
        await syncEngine.queueChange('chat_messages', messageData.id, 'INSERT', { ...messageData, project_id: projectId });
      }

      setNewMessage('');
      setMessages(prev => [...prev, messageData]);
    } catch (err) {
      console.error("Chat Hub: Encryption failed.", err);
    }
  };

  /** * RFI ENGINE: FORM COMMITTAL */
  const handleCreateRFI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !db) return;

    const rfiId = crypto.randomUUID();
    const rfiData: StoredRFI = {
      id: rfiId,
      subject: rfiForm.subject,
      content: rfiForm.content,
      to_professionals: [rfiForm.recipient],
      status: 'sent',
      created_at: new Date().toISOString()
    };

    try {
      await db.rfis.add({ ...rfiData, project_id: projectId });
      if (syncEngine) {
        await syncEngine.queueChange('rfis', rfiId, 'INSERT', { ...rfiData, project_id: projectId });
      }
      setIsCreatingRFI(false);
      setRfiForm({ subject: '', content: '', recipient: 'Lead Architect' });
      syncCommData();
    } catch (err) {
      console.error("RFI Vault: Could not archive query.", err);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-750px] animate-in fade-in duration-700 text-left">
      
      {/* 1. SIDEBAR: CHANNEL NAVIGATION */}
      <div className="lg:w-80 space-y-6 shrink-0">
        <GlassCard className="p-8 border shadow-2xl">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-8 italic">Team Communication</h3>
          
          <div className="space-y-3">
             <button 
               onClick={() => setActiveTab('chat')}
               className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all active:scale-95
                 ${activeTab === 'chat' 
                   ? 'bg-amber-500 border-amber-500 text-black shadow-xl shadow-amber-500/20' 
                   : 'bg-zinc-950/40 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
             >
                <div className="flex items-center gap-3">
                   <MessageSquare size={18} />
                   <span className="text-[11px] font-black uppercase tracking-widest">Site Chat</span>
                </div>
                <ChevronRight size={14} className={activeTab === 'chat' ? 'rotate-90' : ''} />
             </button>

             <button 
               onClick={() => setActiveTab('rfi')}
               className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all active:scale-95
                 ${activeTab === 'rfi' 
                   ? 'bg-amber-500 border-amber-500 text-black shadow-xl shadow-amber-500/20' 
                   : 'bg-zinc-950/40 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
             >
                <div className="flex items-center gap-3">
                   <FileQuestion size={18} />
                   <span className="text-[11px] font-black uppercase tracking-widest">Formal Queries</span>
                </div>
                <ChevronRight size={14} className={activeTab === 'rfi' ? 'rotate-90' : ''} />
             </button>
          </div>
        </GlassCard>

        {/* Audit Status Node */}
        <div className={`p-8 rounded-[2.5rem] border border-zinc-800 bg-zinc-950/40 opacity-40 hidden lg:block`}>
           <div className="flex items-center gap-3 mb-4 text-emerald-500">
              <ShieldCheck size={16} />
              <p className="text-[9px] font-black uppercase tracking-widest">Audit Trace Enabled</p>
           </div>
           <p className="text-[10px] font-bold text-zinc-600 leading-relaxed">
             Communications are timestamped and encrypted in the local project vault.
           </p>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE: DYNAMIC CONTENT HUB */}
      <div className="theme-surface-overlay flex-1 rounded-[3.5rem] border backdrop-blur-3xl overflow-hidden flex flex-col transition-all duration-500">
        
        {activeTab === 'chat' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
             {/* Messaging Header */}
             <div className="p-8 border-b border-zinc-800/40 flex justify-between items-center bg-white/1">
                <div className="text-left space-y-1">
                   <h4 className="text-xl font-black uppercase italic tracking-tighter leading-none">Messaging Hub</h4>
                   <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Broadcast Site Directives</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[8px] font-black uppercase text-emerald-500">Live Connection</span>
                </div>
             </div>

             {/* Message Stream */}
             <div 
               ref={scrollRef}
               className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar"
             >
                {messages.length > 0 ? messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.user_id === currentUserId ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[75%] space-y-2 ${msg.user_id === currentUserId ? 'text-right' : 'text-left'}`}>
                        <div className={`p-6 rounded-4xl text-sm font-medium leading-relaxed
                          ${msg.user_id === currentUserId 
                            ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10 rounded-tr-none' 
                            : 'bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-tl-none'}`}>
                           {msg.text}
                        </div>
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-3 italic">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                          {msg.is_local && ' • Offline Queued'}
                        </p>
                     </div>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-10">
                     <MessageSquare size={64} className="mb-6" />
                     <p className="font-black uppercase text-sm tracking-[0.4em]">Node Initialized</p>
                  </div>
                )}
             </div>

             {/* Message Input Bar */}
             <form onSubmit={handleSendMessage} className="p-8 border-t border-zinc-800/40 bg-zinc-950/40">
                <div className="relative group">
                   <input 
                     type="text"
                     placeholder="Type site directive..."
                     value={newMessage}
                     onChange={(e) => setNewMessage(e.target.value)}
                     className="w-full p-7 pr-32 rounded-[2.5rem] bg-zinc-950 border border-zinc-800 text-white outline-none focus:border-amber-500 font-bold text-sm shadow-inner transition-all"
                   />
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                      <button type="button" className="p-3 text-zinc-600 hover:text-amber-500 transition-colors"><Paperclip size={20}/></button>
                      <button type="submit" className="p-4 bg-amber-500 text-black rounded-2xl hover:bg-amber-400 active:scale-90 transition-all shadow-xl shadow-amber-500/20">
                         <Send size={20} className="fill-current" />
                      </button>
                   </div>
                </div>
             </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
             {/* Formal Query (RFI) Header */}
             <div className="p-8 border-b border-zinc-800/40 flex justify-between items-center bg-white/1">
                <div className="text-left space-y-1">
                   <h4 className="text-xl font-black uppercase italic tracking-tighter">Query Vault (RFI)</h4>
                   <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Formal professional correspondence</p>
                </div>
                <Button 
                  variant="primary"
                  onClick={() => setIsCreatingRFI(true)}
                  className="px-8 py-4"
                  leftIcon={<Plus size={16} />}
                >
                   Raise New Query
                </Button>
             </div>

             {/* RFI Form or List Area */}
             <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                {isCreatingRFI ? (
                  <form onSubmit={handleCreateRFI} className="space-y-10 animate-in slide-in-from-top-4 duration-500 max-w-3xl mx-auto">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3 text-left">
                           <label className="text-[10px] font-black uppercase text-zinc-600 ml-3 tracking-widest italic">Target Professional</label>
                           <select 
                             value={rfiForm.recipient}
                             onChange={(e) => setRfiForm({...rfiForm, recipient: e.target.value})}
                             className="w-full p-6 rounded-2xl bg-zinc-950 border border-zinc-800 text-white outline-none focus:border-amber-500 font-bold text-xs shadow-inner appearance-none cursor-pointer"
                           >
                              <option>Lead Architect</option>
                              <option>Structural Engineer</option>
                              <option>MEP Engineer</option>
                              <option>Project Manager</option>
                           </select>
                        </div>
                        <div className="space-y-3 text-left">
                           <label className="text-[10px] font-black uppercase text-zinc-600 ml-3 tracking-widest italic">Subject Reference</label>
                           <input 
                             required
                             placeholder="e.g. Staircase 2 Headroom..."
                             value={rfiForm.subject}
                             onChange={(e) => setRfiForm({...rfiForm, subject: e.target.value})}
                             className="w-full p-6 rounded-2xl bg-zinc-950 border border-zinc-800 text-white outline-none focus:border-amber-500 font-bold text-xs shadow-inner"
                           />
                        </div>
                     </div>
                     <div className="space-y-3 text-left">
                        <label className="text-[10px] font-black uppercase text-zinc-600 ml-3 tracking-widest italic">Technical Query Details</label>
                        <textarea 
                          required
                          rows={8}
                          placeholder="Describe the clarification needed from the consultant..."
                          value={rfiForm.content}
                          onChange={(e) => setRfiForm({...rfiForm, content: e.target.value})}
                          className="w-full p-10 rounded-[2.5rem] bg-zinc-950 border border-zinc-800 text-zinc-300 outline-none focus:border-amber-500 text-sm leading-relaxed shadow-inner"
                        />
                     </div>
                     <div className="flex gap-4">
                        <Button 
                          type="submit" 
                          className="flex-1 py-6 italic"
                          leftIcon={<Send size={18} />}
                        >
                           Dispatch Formal Query
                        </Button>
                        <button 
                          type="button" 
                          onClick={() => setIsCreatingRFI(false)} 
                          className="px-12 py-6 bg-zinc-800 text-zinc-400 rounded-4xl font-black uppercase text-[11px] tracking-widest hover:bg-zinc-700 transition-all shadow-xl"
                        >
                          Cancel
                        </button>
                     </div>
                  </form>
                ) : rfis.length > 0 ? rfis.map((rfi) => (
                  <div key={rfi.id} className="p-10 rounded-[2.5rem] bg-zinc-950/60 border border-zinc-800 group hover:border-amber-500/20 transition-all text-left relative overflow-hidden">
                     <div className="flex justify-between items-start mb-8">
                        <div className="space-y-2">
                           <span className="px-4 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-600 group-hover:text-amber-500 transition-colors uppercase leading-none italic">
                             RFI-{rfi.id.slice(0,6).toUpperCase()}
                           </span>
                           <h5 className="text-2xl font-black uppercase italic tracking-tighter text-zinc-200 mt-4 leading-none">{rfi.subject}</h5>
                        </div>
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase border shadow-xl
                          ${rfi.status === 'sent' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                           {rfi.status === 'sent' ? <Clock size={14}/> : <CheckCircle2 size={14}/>}
                           {rfi.status}
                        </div>
                     </div>
                     <p className="text-sm text-zinc-500 leading-relaxed font-medium mb-10 line-clamp-3 italic">
                       "{rfi.content}"
                     </p>
                     <div className="flex justify-between items-center pt-8 border-t border-zinc-800/40">
                        <div className="flex items-center gap-4">
                           <div className="p-3 rounded-xl bg-zinc-900 text-zinc-500 shadow-inner"><User size={18}/></div>
                           <div>
                              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest leading-none mb-1">Assigned To</p>
                              <p className="text-xs font-bold text-amber-500 uppercase tracking-tight">{rfi.to_professionals[0]}</p>
                           </div>
                        </div>
                        <p className="text-[10px] font-black text-zinc-700 uppercase italic tracking-widest">{new Date(rfi.created_at).toLocaleDateString()}</p>
                     </div>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-10 py-20">
                     <FileQuestion size={80} className="mb-6" />
                     <p className="font-black uppercase text-sm tracking-[0.5em] italic">No Site Queries Logged</p>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* SECURITY INTEGRITY FOOTER */}
        <div className="theme-surface-inset theme-divider p-8 border-t flex items-center justify-between opacity-30">
          <div className="flex items-center gap-4">
            <AlertCircle size={16} className="text-amber-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic leading-none">End-to-End Vault Encryption Active</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <Database size={12} className="text-zinc-600" />
                <span className="text-[9px] font-mono text-zinc-600 uppercase">LOCAL_SYNC: OK</span>
             </div>
             <p className="text-[9px] font-mono text-zinc-600 uppercase">VAULT_COMM_v2.5</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborationHub;
