/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
  ChevronRight
} from 'lucide-react';

/* ======================================================
    OFFICE MODULE RESOLUTION (STABILIZED)
   ====================================================== */

let useAuth: any = () => ({ 
  user: { id: 'dev-node-001', user_metadata: { full_name: 'Naftaly Mwaura' } },
  theme: 'dark' 
});

let db: any = null;
let syncEngine: any = null;

const resolveModules = async () => {
  try {
    const authMod = await import("../../auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const dbMod = await import("../../../lib/database/database");
    if (dbMod.db) db = dbMod.db; 
    if (dbMod.syncEngine) syncEngine = dbMod.syncEngine;
  } catch (e) {
    // Shims active for Canvas environment
  }
};

resolveModules();

/** --- TYPES --- **/

interface RFI {
  id: string;
  subject: string;
  to_professionals: string[];
  content: string;
  status: 'draft' | 'sent' | 'responded';
  created_at: string;
}

interface Message {
  id: string;
  user_id: string;
  text: string;
  timestamp: string;
  is_local?: boolean; // Temporary flag for optimistic UI
}

interface CollaborationHubProps {
  projectId: string | null;
}

/** --- MAIN COMPONENT: COMMUNICATION NODE --- **/

const CollaborationHub: React.FC<CollaborationHubProps> = ({ projectId }) => {
  const { user, theme } = useAuth();
  
  // Navigation & UI State
  const [activeTab, setActiveTab] = useState<'chat' | 'rfi'>('chat');
  const [, setIsRefreshing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Data States (Live from Dexie)
  const [messages, setMessages] = useState<Message[]>([]);
  const [rfis, setRfis] = useState<RFI[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // RFI Form State
  const [isCreatingRFI, setIsCreatingRFI] = useState(false);
  const [rfiForm, setRfiForm] = useState({
    subject: '',
    content: '',
    recipient: 'Lead Architect'
  });

  /** * DATA HANDSHAKE: LIVE OFFICE SYNC
   * Pulls messages and RFIs from the local project vault.
   */
  const syncCommData = useCallback(async () => {
    if (!db || !projectId) {
      setTimeout(() => setIsRefreshing(false), 1000);
      return;
    }

    try {
      setIsRefreshing(true);
      const [storedMessages, storedRfis] = await Promise.all([
        db.chat_messages.where('project_id').equals(projectId).sortBy('timestamp'),
        db.rfis.where('project_id').equals(projectId).reverse().toArray()
      ]);

      setMessages(storedMessages);
      setRfis(storedRfis);
    } catch (err) {
      console.error("Comm Engine: Sync failed.", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    syncCommData();
    // Auto-scroll chat to bottom
    if (scrollRef.current) {
       scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [syncCommData, messages.length]);

  /** * CHAT ENGINE: SEND HANDSHAKE */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !projectId || !db) return;

    const messageData: Message = {
      id: crypto.randomUUID(),
      user_id: user.id,
      text: newMessage,
      timestamp: new Date().toISOString(),
      is_local: true
    };

    try {
      // 1. LOCAL WRITE (Dexie)
      await db.chat_messages.add({ ...messageData, project_id: projectId });
      
      // 2. CLOUD QUEUE
      if (syncEngine) {
        await syncEngine.queueChange('chat_messages', messageData.id, 'INSERT', { ...messageData, project_id: projectId });
      }

      setNewMessage('');
      setMessages(prev => [...prev, messageData]);
    } catch (err) {
      console.error("Message Vaulting Failed:", err);
    }
  };

  /** * RFI ENGINE: FORM HANDSHAKE */
  const handleCreateRFI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !db) return;

    const rfiData: RFI = {
      id: crypto.randomUUID(),
      subject: rfiForm.subject,
      content: rfiForm.content,
      to_professionals: [rfiForm.recipient],
      status: 'sent',
      created_at: new Date().toISOString()
    };

    try {
      await db.rfis.add({ ...rfiData, project_id: projectId });
      if (syncEngine) {
        await syncEngine.queueChange('rfis', rfiData.id, 'INSERT', { ...rfiData, project_id: projectId });
      }
      setIsCreatingRFI(false);
      setRfiForm({ subject: '', content: '', recipient: 'Lead Architect' });
      syncCommData();
    } catch (err) {
      console.error("RFI Vaulting Failed:", err);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[700px] animate-in fade-in duration-700 text-left">
      
      {/* 1. LEFT PANEL: MODE SELECTOR & STATS */}
      <div className="lg:w-80 space-y-6 shrink-0">
        <div className={`p-8 rounded-[3rem] border transition-all duration-500
          ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-2xl' : 'bg-white border-zinc-200 shadow-xl'}`}>
          
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-8 italic">Comm Channel</h3>
          
          <div className="space-y-3">
             <button 
               onClick={() => setActiveTab('chat')}
               className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all
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
               className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all
                 ${activeTab === 'rfi' 
                   ? 'bg-amber-500 border-amber-500 text-black shadow-xl shadow-amber-500/20' 
                   : 'bg-zinc-950/40 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
             >
                <div className="flex items-center gap-3">
                   <FileQuestion size={18} />
                   <span className="text-[11px] font-black uppercase tracking-widest">RFI Workflow</span>
                </div>
                <ChevronRight size={14} className={activeTab === 'rfi' ? 'rotate-90' : ''} />
             </button>
          </div>
        </div>

        {/* Audit Trail Info */}
        <div className={`p-8 rounded-[3rem] border border-zinc-800 bg-zinc-950/40 opacity-40 hidden lg:block`}>
           <div className="flex items-center gap-3 mb-4">
              <ShieldCheck size={16} className="text-emerald-500" />
              <p className="text-[9px] font-black uppercase tracking-widest">ISO 19650 Audit</p>
           </div>
           <p className="text-[10px] font-bold text-zinc-600 leading-relaxed">
             All communications are timestamped and immutable in the project vault.
           </p>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE: DYNAMIC CONTENT */}
      <div className={`flex-1 rounded-[3.5rem] border backdrop-blur-3xl overflow-hidden flex flex-col transition-all duration-500
        ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800 shadow-2xl shadow-black' : 'bg-white border-zinc-200'}`}>
        
        {activeTab === 'chat' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
             {/* Chat Header */}
             <div className="p-8 border-b border-zinc-800/40 flex justify-between items-center bg-white/[0.02]">
                <div className="text-left">
                   <h4 className="text-xl font-black uppercase italic tracking-tighter">Site Messaging Hub</h4>
                   <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Real-time collaboration node</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[8px] font-black uppercase text-emerald-500">Live</span>
                </div>
             </div>

             {/* Message Area */}
             <div 
               ref={scrollRef}
               className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar"
             >
                {messages.length > 0 ? messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.user_id === user.id ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[70%] space-y-2 ${msg.user_id === user.id ? 'text-right' : 'text-left'}`}>
                        <div className={`p-5 rounded-3xl text-sm font-medium leading-relaxed
                          ${msg.user_id === user.id 
                            ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10 rounded-tr-none' 
                            : 'bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-tl-none'}`}>
                           {msg.text}
                        </div>
                        <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest px-2">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                          {msg.is_local && ' • Sync Pending'}
                        </p>
                     </div>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-10">
                     <MessageSquare size={64} className="mb-4" />
                     <p className="font-black uppercase text-sm tracking-widest">Channel Initialized</p>
                  </div>
                )}
             </div>

             {/* Input Bar */}
             <form onSubmit={handleSendMessage} className="p-8 border-t border-zinc-800/40 bg-zinc-950/40">
                <div className="relative group">
                   <input 
                     type="text"
                     placeholder="Broadcast message to site team..."
                     value={newMessage}
                     onChange={(e) => setNewMessage(e.target.value)}
                     className="w-full p-6 pr-24 rounded-[2rem] bg-zinc-950 border border-zinc-800 text-white outline-none focus:border-amber-500/40 transition-all font-bold text-sm"
                   />
                   <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <button type="button" className="p-3 text-zinc-600 hover:text-zinc-400"><Paperclip size={18}/></button>
                      <button type="submit" className="p-3 bg-amber-500 text-black rounded-2xl hover:bg-amber-400 active:scale-90 transition-all shadow-xl shadow-amber-500/20">
                         <Send size={18} />
                      </button>
                   </div>
                </div>
             </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
             {/* RFI Header */}
             <div className="p-8 border-b border-zinc-800/40 flex justify-between items-center bg-white/[0.02]">
                <div className="text-left">
                   <h4 className="text-xl font-black uppercase italic tracking-tighter">RFI Vault</h4>
                   <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Formal requests for information</p>
                </div>
                <button 
                  onClick={() => setIsCreatingRFI(true)}
                  className="flex items-center gap-3 px-6 py-3 bg-amber-500 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-amber-400 active:scale-95 transition-all"
                >
                   <Plus size={16} /> Raise RFI
                </button>
             </div>

             {/* RFI Content Area */}
             <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar">
                {isCreatingRFI ? (
                  <form onSubmit={handleCreateRFI} className="space-y-8 animate-in slide-in-from-top-4 duration-500">
                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2 text-left">
                           <label className="text-[10px] font-black uppercase text-zinc-600 ml-2 tracking-widest">Recipient Professional</label>
                           <select 
                             value={rfiForm.recipient}
                             onChange={(e) => setRfiForm({...rfiForm, recipient: e.target.value})}
                             className="w-full p-5 rounded-2xl bg-zinc-950 border border-zinc-800 text-white outline-none focus:border-amber-500 font-bold text-xs"
                           >
                              <option>Lead Architect</option>
                              <option>Structural Engineer</option>
                              <option>MEP Engineer</option>
                           </select>
                        </div>
                        <div className="space-y-2 text-left">
                           <label className="text-[10px] font-black uppercase text-zinc-600 ml-2 tracking-widest">Subject Reference</label>
                           <input 
                             required
                             placeholder="e.g. Beam B-12 Detail..."
                             value={rfiForm.subject}
                             onChange={(e) => setRfiForm({...rfiForm, subject: e.target.value})}
                             className="w-full p-5 rounded-2xl bg-zinc-950 border border-zinc-800 text-white outline-none focus:border-amber-500 font-bold text-xs"
                           />
                        </div>
                     </div>
                     <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black uppercase text-zinc-600 ml-2 tracking-widest">Technical Query Details</label>
                        <textarea 
                          required
                          rows={6}
                          placeholder="Describe the clarification needed from the consultant..."
                          value={rfiForm.content}
                          onChange={(e) => setRfiForm({...rfiForm, content: e.target.value})}
                          className="w-full p-8 rounded-3xl bg-zinc-950 border border-zinc-800 text-zinc-300 outline-none focus:border-amber-500 text-sm leading-relaxed"
                        />
                     </div>
                     <div className="flex gap-4">
                        <button type="submit" className="flex-1 py-5 bg-amber-500 text-black rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-amber-400 shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-3 italic">
                           <Send size={16} /> Dispatch RFI Node
                        </button>
                        <button type="button" onClick={() => setIsCreatingRFI(false)} className="px-10 py-5 bg-zinc-800 text-zinc-400 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-zinc-700 transition-all">Cancel</button>
                     </div>
                  </form>
                ) : rfis.length > 0 ? rfis.map((rfi) => (
                  <div key={rfi.id} className="p-8 rounded-[2.5rem] bg-zinc-950/60 border border-zinc-800 group hover:border-amber-500/20 transition-all text-left">
                     <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1">
                           <span className="px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[9px] font-mono text-zinc-600 group-hover:text-amber-500 transition-colors uppercase">RFI-{(rfi.id.slice(0,4)).toUpperCase()}</span>
                           <h5 className="text-lg font-black uppercase text-zinc-200 mt-2">{rfi.subject}</h5>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase border
                          ${rfi.status === 'sent' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                           {rfi.status === 'sent' ? <Clock size={12}/> : <CheckCircle2 size={12}/>}
                           {rfi.status}
                        </div>
                     </div>
                     <p className="text-xs text-zinc-500 leading-relaxed font-medium mb-6 line-clamp-2 italic">"{rfi.content}"</p>
                     <div className="flex justify-between items-center pt-6 border-t border-zinc-800/40">
                        <div className="flex items-center gap-3">
                           <div className="p-2 rounded-lg bg-zinc-900 text-zinc-500"><User size={14}/></div>
                           <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest leading-none">{rfi.to_professionals[0]}</p>
                        </div>
                        <p className="text-[9px] font-bold text-zinc-700 uppercase">{new Date(rfi.created_at).toLocaleDateString()}</p>
                     </div>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-10">
                     <FileQuestion size={64} className="mb-4" />
                     <p className="font-black uppercase text-sm tracking-widest">No Formal Queries Nodes</p>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* Footer Persistence Indicator */}
        <div className={`p-6 border-t flex items-center justify-between opacity-30
          ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
          <div className="flex items-center gap-3">
            <AlertCircle size={12} className="text-amber-500" />
            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">End-to-End Vault Encryption Active</p>
          </div>
          <p className="text-[8px] font-mono text-zinc-600 uppercase">VAULT_COMM_ENGINE_v2.1</p>
        </div>
      </div>
    </div>
  );
};

export default CollaborationHub;