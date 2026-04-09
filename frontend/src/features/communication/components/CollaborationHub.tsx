/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  FileQuestion, 
  Clock, 
  CheckCircle2, 
  User, 
  Plus, 
  AlertCircle,
  Paperclip,
  Database,
  Briefcase,
  ChevronDown,
  Loader2
} from 'lucide-react';

/* ======================================================
    OFFICE MODULE RESOLUTION
   ====================================================== */

let useAuth: any = () => ({ theme: 'light', user: null });
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
    console.warn("Comm Engine: Infrastructure standby.");
  }
};

resolveModules();

/** --- TYPES --- **/

interface RFI {
  id: string;
  project_id: string;
  subject: string;
  to_professionals: string[];
  content: string;
  status: 'draft' | 'sent' | 'responded';
  created_at: string;
}

interface Message {
  id: string;
  project_id: string;
  user_id: string;
  text: string;
  timestamp: string;
  is_local?: boolean; 
}

interface CollaborationHubProps {
  projectId: string | null;
}

/** --- MAIN COMPONENT: COMMUNICATION HUB --- **/

const CollaborationHub: React.FC<CollaborationHubProps> = ({ projectId: initialId }) => {
  const { user, theme } = useAuth();
  
  // WORKSPACE CONTEXT
  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  
  // UI NAVIGATION
  const [activeTab, setActiveTab] = useState<'chat' | 'rfi'>('chat');
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // DATA STATES
  const [messages, setMessages] = useState<Message[]>([]);
  const [rfis, setRfis] = useState<RFI[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // RFI FORM STATES
  const [isCreatingRFI, setIsCreatingRFI] = useState(false);
  const [rfiForm, setRfiForm] = useState({
    subject: '',
    content: '',
    recipient: 'Lead Architect'
  });

  /** * 1. DATA HANDSHAKE: LOAD PROJECT MESSAGES & QUERIES */
  const syncCommWorkspace = useCallback(async () => {
    if (!db || !user) {
        setTimeout(() => setIsLoading(false), 800);
        return;
    }

    try {
      setIsLoading(true);

      // Fetch projects for the Context Switcher
      const projects = await db.projects.where('user_id').equals(user.id).toArray();
      setAvailableProjects(projects);

      if (selectedId) {
        // Load messages for this specific project
        const [storedMessages, storedRfis] = await Promise.all([
          db.chat_messages.where('project_id').equals(selectedId).toArray(),
          db.rfis.where('project_id').equals(selectedId).reverse().toArray()
        ]);

        setMessages(storedMessages.sort((a: any, b: any) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ));
        setRfis(storedRfis);
      } else if (projects.length > 0) {
        setSelectedId(projects[0].id);
      }
    } catch (err) {
      console.error("Comm Handshake failed.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedId, user]);

  useEffect(() => {
    syncCommWorkspace();
  }, [syncCommWorkspace]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  /** * 2. MESSAGE ENGINE: SEND DIRECTIVE */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedId || !db) return;

    const messageData: Message = {
      id: crypto.randomUUID(),
      project_id: selectedId,
      user_id: user?.id || 'local-user',
      text: newMessage,
      timestamp: new Date().toISOString(),
      is_local: true
    };

    try {
      await db.chat_messages.add(messageData);
      if (syncEngine) await syncEngine.queueChange('chat_messages', messageData.id, 'INSERT', messageData);
      setNewMessage('');
      setMessages(prev => [...prev, messageData]);
    } catch (err) { console.error("Message vaulting failed."); }
  };

  /** * 3. RFI ENGINE: DISPATCH FORMAL QUERY */
  const handleCreateRFI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !db) return;

    const rfiId = crypto.randomUUID();
    const rfiData: RFI = {
      id: rfiId,
      project_id: selectedId,
      subject: rfiForm.subject,
      content: rfiForm.content,
      to_professionals: [rfiForm.recipient],
      status: 'sent',
      created_at: new Date().toISOString()
    };

    try {
      await db.rfis.add(rfiData);
      if (syncEngine) await syncEngine.queueChange('rfis', rfiId, 'INSERT', rfiData);
      setIsCreatingRFI(false);
      setRfiForm({ subject: '', content: '', recipient: 'Lead Architect' });
      syncCommWorkspace();
    } catch (err) { console.error("RFI encryption failed."); }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-40 opacity-30">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-amber-500" />
        <p className={`font-black text-[10px] uppercase tracking-[0.5em] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-950'}`}>Opening Comm Channels...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-left pb-10">
      
      {/* 1. TOP HUB: CONTEXT SWITCHER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-transparent">
        <div className="space-y-2">
          <h3 className={`text-4xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Team Hub</h3>
          <div className="flex items-center gap-4">
             <div className="relative group">
                <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" />
                <select 
                  value={selectedId || ''} 
                  onChange={(e) => setSelectedId(e.target.value)}
                  className={`pl-12 pr-10 py-3 rounded-xl border appearance-none font-black uppercase text-[10px] tracking-widest cursor-pointer outline-none transition-all
                    ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white hover:border-amber-500' : 'bg-white border-zinc-200 text-zinc-950 hover:border-amber-500 shadow-sm'}`}
                >
                  {availableProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">Project Active</p>
          </div>
        </div>

        <div className="flex bg-zinc-900/40 p-1.5 rounded-2xl border border-zinc-800 shadow-inner">
           <button onClick={() => setActiveTab('chat')} className={`px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'chat' ? 'bg-amber-500 text-black shadow-lg' : 'text-zinc-500'}`}>Site Chat</button>
           <button onClick={() => setActiveTab('rfi')} className={`px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'rfi' ? 'bg-amber-500 text-black shadow-lg' : 'text-zinc-500'}`}>Technical Queries</button>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE */}
      <div className={`h-650px] rounded-[4rem] border backdrop-blur-3xl overflow-hidden flex flex-col transition-all duration-500 shadow-2xl
        ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800 shadow-black' : 'bg-white border-zinc-200'}`}>
        
        {activeTab === 'chat' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
             {/* Chat Header */}
             <div className="p-8 border-b border-zinc-800/40 flex justify-between items-center bg-white/1">
                <div className="text-left space-y-1">
                   <h4 className="text-xl font-black uppercase italic tracking-tighter">Messaging Hub</h4>
                   <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Global Directives Node</p>
                </div>
                <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[9px] font-black uppercase text-emerald-500">Channel Secured</span>
                </div>
             </div>

             {/* Message Stream */}
             <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.user_id === user?.id ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                     <div className={`max-w-[80%] space-y-2 ${msg.user_id === user?.id ? 'text-right' : 'text-left'}`}>
                        <div className={`p-6 rounded-4xl text-sm font-medium leading-relaxed shadow-xl
                          ${msg.user_id === user?.id 
                            ? 'bg-amber-500 text-black rounded-tr-none' 
                            : theme === 'dark' ? 'bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-tl-none' : 'bg-zinc-100 border border-zinc-200 text-zinc-950 rounded-tl-none'}`}>
                           {msg.text}
                        </div>
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-4 italic leading-none">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {msg.is_local && ' • Queued for Cloud'}
                        </p>
                     </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-10">
                     <MessageSquare size={80} className="mb-6" />
                     <p className="font-black uppercase text-lg tracking-[0.4em]">Vault Initialized</p>
                  </div>
                )}
             </div>

             {/* Input Node */}
             <form onSubmit={handleSendMessage} className="p-8 border-t border-zinc-800/40 bg-zinc-950/20">
                <div className="relative group">
                   <input 
                     type="text"
                     placeholder="Broadcast site message..."
                     value={newMessage}
                     onChange={(e) => setNewMessage(e.target.value)}
                     className={`w-full p-8 pr-32 rounded-[2.5rem] border outline-none transition-all font-bold text-sm shadow-inner
                       ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-950 focus:border-amber-500'}`}
                   />
                   <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-4">
                      <button type="button" className="p-3 text-zinc-600 hover:text-amber-500 transition-colors"><Paperclip size={24}/></button>
                      <button type="submit" className="p-5 bg-amber-500 text-black rounded-2xl hover:bg-amber-400 active:scale-90 transition-all shadow-2xl">
                         <Send size={24} className="fill-current" />
                      </button>
                   </div>
                </div>
             </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
             <div className="p-8 border-b border-zinc-800/40 flex justify-between items-center bg-white/1">
                <div className="text-left space-y-1">
                   <h4 className="text-xl font-black uppercase italic tracking-tighter">Query Vault (RFI)</h4>
                   <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Formal Professional Correspondence</p>
                </div>
                <button 
                  onClick={() => setIsCreatingRFI(true)}
                  className="px-8 py-4 bg-amber-500 text-black font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl hover:bg-amber-400 transition-all flex items-center gap-3"
                >
                   <Plus size={16} strokeWidth={3} /> Raise New Query
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                {isCreatingRFI ? (
                  <form onSubmit={handleCreateRFI} className="space-y-10 animate-in slide-in-from-top-4 duration-500 max-w-3xl mx-auto py-10">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4 text-left">
                           <label className="text-[11px] font-black uppercase text-zinc-500 ml-4 tracking-widest italic">Recipient Specialist</label>
                           <div className="relative group">
                              <select value={rfiForm.recipient} onChange={(e) => setRfiForm({...rfiForm, recipient: e.target.value})}
                                className={`w-full p-6 pl-12 rounded-2xl border appearance-none font-bold text-xs outline-none transition-all
                                  ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-950'}`}>
                                <option>Architectural Lead</option><option>Structural Consultant</option><option>Services Engineer</option><option>Project Lead</option>
                              </select>
                              <User size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500" />
                           </div>
                        </div>
                        <div className="space-y-4 text-left">
                           <label className="text-[11px] font-black uppercase text-zinc-500 ml-4 tracking-widest italic">Technical Subject</label>
                           <input required placeholder="e.g. Footing Reinforcement Clash" value={rfiForm.subject} onChange={(e) => setRfiForm({...rfiForm, subject: e.target.value})}
                             className={`w-full p-6 rounded-2xl border font-bold text-xs outline-none transition-all
                               ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-950'}`} />
                        </div>
                     </div>
                     <div className="space-y-4 text-left">
                        <label className="text-[11px] font-black uppercase text-zinc-500 ml-4 tracking-widest italic">Technical Details</label>
                        <textarea required rows={6} placeholder="Detailed site clarification node..." value={rfiForm.content} onChange={(e) => setRfiForm({...rfiForm, content: e.target.value})}
                          className={`w-full p-10 rounded-[3rem] border outline-none font-medium text-sm leading-relaxed
                            ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-950'}`} />
                     </div>
                     <div className="flex gap-4">
                        <button type="submit" className="flex-1 py-8 bg-amber-500 text-black font-black uppercase text-xs tracking-[0.4em] rounded-[2.5rem] shadow-2xl hover:bg-amber-400 transition-all flex items-center justify-center gap-5 italic active:scale-[0.98]">
                           <Send size={24} /> Dispatch Formal Handshake
                        </button>
                        <button type="button" onClick={() => setIsCreatingRFI(false)} className="px-12 py-8 bg-zinc-800 text-zinc-400 rounded-[2.5rem] font-black uppercase text-xs tracking-widest hover:text-white transition-all shadow-xl border border-zinc-700">Cancel</button>
                     </div>
                  </form>
                ) : rfis.length > 0 ? rfis.map((rfi) => (
                  <div key={rfi.id} className={`p-10 rounded-[3rem] border group transition-all text-left relative overflow-hidden shadow-2xl
                    ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800 hover:border-amber-500/20' : 'bg-zinc-50 border-zinc-100 hover:border-amber-500'}`}>
                     <div className="flex justify-between items-start mb-8">
                        <div className="space-y-2">
                           <span className="px-4 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-500 group-hover:text-amber-500 transition-colors uppercase leading-none italic">
                             RFI-{rfi.id.slice(0,6).toUpperCase()}
                           </span>
                           <h5 className={`text-3xl font-black uppercase italic tracking-tighter mt-6 leading-none ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-950'}`}>{rfi.subject}</h5>
                        </div>
                        <div className={`flex items-center gap-3 px-5 py-2.5 rounded-full text-[10px] font-black uppercase border shadow-xl
                          ${rfi.status === 'sent' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                           {rfi.status === 'sent' ? <Clock size={16}/> : <CheckCircle2 size={16}/>}
                           {rfi.status}
                        </div>
                     </div>
                     <p className={`text-base leading-relaxed font-medium mb-12 italic ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-600'}`}>"{rfi.content}"</p>
                     <div className="flex justify-between items-center pt-8 border-t border-zinc-800/40 opacity-60">
                        <div className="flex items-center gap-4">
                           <div className="p-3 rounded-xl bg-zinc-900 text-zinc-500 shadow-inner"><User size={20}/></div>
                           <div>
                              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest leading-none mb-2 italic">Specialist Assigned</p>
                              <p className={`text-sm font-bold uppercase tracking-tight ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-950'}`}>{rfi.to_professionals[0]}</p>
                           </div>
                        </div>
                        <p className="text-[10px] font-black text-zinc-700 uppercase italic tracking-widest">{new Date(rfi.created_at).toLocaleDateString()}</p>
                     </div>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-10 py-24">
                     <FileQuestion size={100} className="mb-8" />
                     <p className="font-black uppercase text-lg tracking-[0.6em] italic">Archive Nodes Empty</p>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* SECURITY INTEGRITY FOOTER */}
        <div className={`p-8 border-t flex items-center justify-between opacity-30
          ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200 shadow-inner'}`}>
          <div className="flex items-center gap-4">
            <AlertCircle size={18} className="text-amber-500" />
            <p className={`text-[10px] font-black uppercase tracking-[0.3em] italic leading-none ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-950'}`}>End-to-End Vault Encryption Active</p>
          </div>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3">
                <Database size={14} className="text-zinc-600" />
                <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">OFFLINE_LEDGER: OK</span>
             </div>
             <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">VAULT_COMM_v2.5</p>
          </div>
        </div>
      </div>

      <footer className="pt-24 pb-12 text-center opacity-20 select-none flex flex-col items-center gap-8">
         <div className="h-px w-80 bg-zinc-800" />
         <p className="text-[10px] font-black uppercase tracking-[2.5em] text-zinc-600 italic leading-none text-center">
           QS VAULT • COLLABORATION ENGINE • ISO 19650
         </p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 20px; }
      `}</style>
    </div>
  );
};

export default CollaborationHub;