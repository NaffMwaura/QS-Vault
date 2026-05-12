/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback, useRef, } from 'react';
import { 
  MessageSquare, 
  Send, 
  FileQuestion, 
  Plus, 
  Briefcase,
  ChevronDown,
  Loader2,
  ShieldCheck,
  RefreshCw,
  UserCheck,
  MessageCircle,
  Smartphone
} from 'lucide-react';

/* ======================================================
    OFFICE MODULE RESOLUTION (STABILIZED)
   ====================================================== */

let useAuth: any = () => ({ theme: 'dark', user: null, isOnline: true });
let db: any = null;
let syncEngine: any = null;
let supabase: any = null;

const resolveInfrastructure = async () => {
  try {
    const authMod = await import("../../auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const dbMod = await import("../../../lib/database/database");
    if (dbMod.db) db = dbMod.db;
    if (dbMod.syncEngine) syncEngine = dbMod.syncEngine;
    if (dbMod.supabase) supabase = dbMod.supabase;
  } catch (e) {
    console.warn("Comm Hub: Database node handshake deferred.");
  }
};

resolveInfrastructure();

/** --- TYPES --- **/
interface Message {
  id: string;
  project_id: string;
  user_id: string;
  user_name: string; 
  text: string;
  timestamp: string;
}

interface CollaborationHubProps {
  projectId: string | null;
}

/** --- MAIN COMPONENT: TEAM COLLABORATION ENGINE --- **/

const CollaborationHub: React.FC<CollaborationHubProps> = ({ projectId: initialId }) => {
  const { user, theme,  } = useAuth();
  
  // WORKSPACE STATE
  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'questions'>('chat');
  
  // ENGINE STATES
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [rfis, setRfis] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // RFI FORM STATES
  const [isAsking, setIsAsking] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    subject: '',
    content: '',
    recipient: 'Project Manager'
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  /** * 1. VAULT HARVEST: LOAD PROJECT RECORDS */
  const syncWorkspace = useCallback(async () => {
    if (!db || !user) {
        setTimeout(() => setIsLoading(false), 1000);
        return;
    }

    try {
      if (isLoading) setIsLoading(true);
      
      // Load identities
      const projects = await db.projects.where('user_id').equals(user.id).toArray();
      setAvailableProjects(projects);

      const activeId = selectedId || (projects.length > 0 ? projects[0].id : null);
      if (!activeId) {
          setIsLoading(false);
          return;
      }

      if (activeId !== selectedId) setSelectedId(activeId);

      // Fetch Chat & RFI Nodes
      const [storedMessages, storedRfis] = await Promise.all([
        db.chat_messages.where('project_id').equals(activeId).toArray(),
        db.rfis.where('project_id').equals(activeId).reverse().toArray()
      ]);

      setMessages(storedMessages.sort((a: any, b: any) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ));
      setRfis(storedRfis);
    } catch (err) {
      console.error("Comm Hub: Vault access denied.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedId, user, isLoading]);

  useEffect(() => {
    syncWorkspace();
  }, [syncWorkspace]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, activeTab]);

  /** * 2. MESSAGE PROTOCOL */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedId || !db) return;

    const messageRecord: Message = {
      id: crypto.randomUUID(),
      project_id: selectedId,
      user_id: user?.id || 'local-user',
      user_name: user?.user_metadata?.full_name || 'Authorized Node',
      text: newMessage,
      timestamp: new Date().toISOString()
    };

    try {
      await db.chat_messages.add(messageRecord);
      if (syncEngine) await syncEngine.queueChange('chat_messages', messageRecord.id, 'INSERT', messageRecord);
      setNewMessage('');
      setMessages(prev => [...prev, messageRecord]);
    } catch (err) { console.error("Broadcast Failure."); }
  };

  /** * 3. RFI (TECHNICAL QUERY) PROTOCOL */
  const handleSendQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !db || !questionForm.subject) return;

    const qId = crypto.randomUUID();
    const rfiRecord = {
      id: qId,
      project_id: selectedId,
      subject: questionForm.subject,
      content: questionForm.content,
      to_professionals: [questionForm.recipient],
      status: 'sent',
      created_at: new Date().toISOString()
    };

    try {
      await db.rfis.add(rfiRecord);
      if (syncEngine) await syncEngine.queueChange('rfis', qId, 'INSERT', rfiRecord);
      setIsAsking(false);
      setQuestionForm({ subject: '', content: '', recipient: 'Project Manager' });
      syncWorkspace();
    } catch (err) { console.error("Query archival failed."); }
  };

  if (isLoading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center opacity-30">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500 mb-6" />
        <p className="font-black uppercase text-[10px] tracking-[0.5em] italic text-center">Reconnecting to Team Node...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700 text-left pb-20">
      
      {/* 1. TOP COMMAND HUD */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 px-4 sm:px-0">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
             <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-500 shadow-inner">
                <MessageCircle size={20} strokeWidth={2.5} />
             </div>
             <p className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">Project Communication Hub</p>
          </div>
          <div className="flex items-center gap-5">
             <div className="relative group">
                <select 
                  value={selectedId || ''} 
                  onChange={(e) => setSelectedId(e.target.value)}
                  className={`pl-12 pr-12 py-4 rounded-2xl border-2 appearance-none font-black uppercase text-[11px] tracking-widest cursor-pointer outline-none transition-all
                    ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white hover:border-amber-500' : 'bg-white border-zinc-200 text-zinc-950 hover:border-amber-500 shadow-sm'}`}
                >
                  {availableProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" />
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
             </div>
             <button onClick={() => { setIsRefreshing(true); syncWorkspace(); }} className="p-4 rounded-xl border-2 border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:text-amber-500 transition-all active:scale-90">
                <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
             </button>
          </div>
        </div>

        {/* TABS SELECTOR */}
        <div className="flex bg-zinc-950/40 p-1.5 rounded-2xl border-2 border-zinc-800 shadow-inner w-full lg:w-auto">
           <button onClick={() => setActiveTab('chat')} className={`flex-1 lg:flex-none px-10 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'chat' ? 'bg-amber-500 text-black shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}>Message Feed</button>
           <button onClick={() => setActiveTab('questions')} className={`flex-1 lg:flex-none px-10 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'questions' ? 'bg-amber-500 text-black shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}>Official Queries</button>
        </div>
      </header>

      {/* 2. COLLABORATION WORKSPACE */}
      <div className={`h-700px] rounded-[4.5rem] border-2 backdrop-blur-3xl overflow-hidden flex flex-col transition-all duration-500 shadow-2xl mx-4 sm:mx-0
        ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800 shadow-black' : 'bg-white border-zinc-200'}`}>
        
        {activeTab === 'chat' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
             {/* Feed Header */}
             <div className={`p-8 border-b-2 flex justify-between items-center ${theme === 'dark' ? 'border-zinc-800 bg-white/1' : 'border-zinc-100 bg-zinc-50/50'}`}>
                <div className="text-left">
                   <h4 className={`text-xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>Technical Stream</h4>
                   <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mt-1">Authorized site communication node</p>
                </div>
                <div className="hidden sm:flex items-center gap-4 px-5 py-2.5 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[9px] font-black uppercase text-emerald-500 tracking-widest">Vault Sync Active</span>
                </div>
             </div>

             {/* Message Area */}
             <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar scroll-smooth">
                {messages.length > 0 ? messages.map((msg) => {
                  const isMe = msg.user_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                       <div className={`max-w-[85%] sm:max-w-[65%] space-y-3 ${isMe ? 'text-right' : 'text-left'}`}>
                          {!isMe && (
                             <div className="flex items-center gap-3 px-3">
                                <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center font-black text-[10px] text-black shadow-lg shadow-amber-500/10 italic">{(msg.user_name?.[0] || 'U').toUpperCase()}</div>
                                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{msg.user_name}</span>
                             </div>
                          )}
                          
                          <div className={`p-8 rounded-[2.8rem] text-[15px] font-medium leading-relaxed shadow-2xl border-2
                            ${isMe 
                              ? 'bg-amber-500 text-black border-amber-400 rounded-tr-none' 
                              : theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-100 rounded-tl-none' : 'bg-zinc-50 border-zinc-200 text-zinc-950 rounded-tl-none shadow-sm'}`}>
                             {msg.text}
                          </div>
                          
                          <div className={`flex items-center gap-4 px-5 italic leading-none ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                               {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {isMe && <ShieldCheck size={12} className="text-emerald-500 opacity-40" />}
                          </div>
                       </div>
                    </div>
                  );
                }) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-10">
                     <MessageSquare size={120} className="mb-8" strokeWidth={1} />
                     <p className="font-black uppercase text-xl tracking-[0.6em] italic leading-none text-center">Node Link Established</p>
                  </div>
                )}
             </div>

             {/* Input Node */}
             <form onSubmit={handleSendMessage} className={`p-10 border-t-2 bg-zinc-950/20 ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-100'}`}>
                <div className="relative group">
                   <input 
                     type="text"
                     placeholder="Broadcast message to project team..."
                     value={newMessage}
                     onChange={(e) => setNewMessage(e.target.value)}
                     className={`w-full p-10 pr-32 rounded-[3.5rem] border-2 outline-none transition-all font-bold text-base shadow-inner
                       ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500 shadow-black' : 'bg-zinc-50 border-zinc-200 text-zinc-950 focus:border-amber-500 shadow-sm'}`}
                   />
                   <div className="absolute right-6 top-1/2 -translate-y-1/2">
                      <button type="submit" className="p-6 bg-amber-500 text-black rounded-3xl hover:bg-amber-400 active:scale-90 transition-all shadow-2xl shadow-amber-500/20 border-4 border-black/5">
                         <Send size={28} strokeWidth={3} />
                      </button>
                   </div>
                </div>
             </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
             {/* RFI Header */}
             <div className={`p-8 border-b-2 flex justify-between items-center ${theme === 'dark' ? 'border-zinc-800 bg-white/1' : 'border-zinc-100 bg-zinc-50/50'}`}>
                <div className="text-left">
                   <h4 className="text-xl font-black uppercase italic tracking-tighter">Technical Queries</h4>
                   <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mt-1">Official Request for Information (RFI) Ledger</p>
                </div>
                {!isAsking && (
                    <button 
                        onClick={() => setIsAsking(true)}
                        className="px-10 py-5 bg-amber-500 text-black font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-2xl hover:bg-amber-400 active:scale-95 transition-all flex items-center gap-4 italic"
                    >
                        <Plus size={20} strokeWidth={3} /> Raise New RFI
                    </button>
                )}
             </div>

             <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                {isAsking ? (
                  <form onSubmit={handleSendQuestion} className="space-y-12 animate-in slide-in-from-top-6 duration-700 max-w-4xl mx-auto py-12">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4 text-left">
                           <label className="text-[11px] font-black uppercase text-zinc-500 ml-5 tracking-[0.4em] italic">Direct to Professional</label>
                           <div className="relative group">
                                <select value={questionForm.recipient} onChange={(e) => setQuestionForm({...questionForm, recipient: e.target.value})}
                                    className={`w-full p-8 rounded-3xl border-2 appearance-none font-bold text-sm outline-none transition-all shadow-inner
                                    ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-950'}`}>
                                    <option>Project Manager</option><option>Architect</option><option>Structural Engineer</option><option>MEP Engineer</option><option>Lead Surveyor</option>
                                </select>
                                <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                           </div>
                        </div>
                        <div className="space-y-4 text-left">
                           <label className="text-[11px] font-black uppercase text-zinc-500 ml-5 tracking-[0.4em] italic">RFI Subject</label>
                           <input required placeholder="e.g. Column C4 Reinforcement Clash" value={questionForm.subject} onChange={(e) => setQuestionForm({...questionForm, subject: e.target.value})}
                             className={`w-full p-8 rounded-3xl border-2 font-black uppercase text-xs outline-none transition-all shadow-inner
                               ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-950 focus:border-amber-500'}`} />
                        </div>
                     </div>
                     <div className="space-y-4 text-left">
                        <label className="text-[11px] font-black uppercase text-zinc-500 ml-5 tracking-[0.4em] italic">Detailed Query Narrative</label>
                        <textarea required rows={7} placeholder="Describe the technical clarification required for site execution..." value={questionForm.content} onChange={(e) => setQuestionForm({...questionForm, content: e.target.value})}
                          className={`w-full p-12 rounded-[3.5rem] border-2 outline-none font-medium text-lg leading-relaxed shadow-inner
                            ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-950 focus:border-amber-500'}`} />
                     </div>
                     <div className="flex gap-6">
                        <button type="submit" className="flex-1 py-10 bg-emerald-600 text-white font-black uppercase text-xs tracking-[0.5em] rounded-[3rem] shadow-2xl hover:bg-emerald-500 active:scale-[0.98] transition-all flex items-center justify-center gap-6 italic shadow-emerald-500/10 border-2 border-emerald-400">
                           <Send size={28} strokeWidth={2.5} /> Dispatch Technical Query
                        </button>
                        <button type="button" onClick={() => setIsAsking(false)} className={`px-14 py-10 rounded-[3rem] font-black uppercase text-xs tracking-widest transition-all border-2
                           ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:text-black'}`}>Abort</button>
                     </div>
                  </form>
                ) : rfis.length > 0 ? (
                  <div className="grid grid-cols-1 gap-10">
                    {rfis.map((q) => (
                        <div key={q.id} className={`p-12 rounded-[4rem] border-2 group transition-all text-left relative overflow-hidden shadow-2xl
                            ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800 hover:border-amber-500/20' : 'bg-white border-zinc-100 hover:border-amber-500 shadow-zinc-200/50'}`}>
                            
                            <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-10 transition-opacity pointer-events-none">
                                <FileQuestion size={160} />
                            </div>

                            <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-8 relative z-10">
                                <div className="space-y-6 text-left flex-1">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-xl bg-amber-500 text-black shadow-lg italic font-black text-[10px]">RFI</div>
                                        <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest font-black">NODE_REF: {q.id.slice(0,8).toUpperCase()}</span>
                                    </div>
                                    <h5 className={`text-4xl font-black uppercase italic tracking-tighter leading-none ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-950'}`}>{q.subject}</h5>
                                </div>
                                <div className={`flex items-center gap-3 px-8 py-3 rounded-full text-[10px] font-black uppercase border-2 shadow-2xl
                                    ${q.status === 'sent' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                                    {q.status}
                                </div>
                            </div>
                            
                            <p className={`text-xl font-medium leading-relaxed mb-16 italic text-left relative z-10 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                "{q.content}"
                            </p>

                            <div className="flex flex-wrap justify-between items-center pt-10 border-t border-zinc-800/40 relative z-10">
                                <div className="flex items-center gap-6 text-left">
                                    <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-zinc-900 text-zinc-400 border border-zinc-800' : 'bg-zinc-50 text-zinc-600 border border-zinc-200 shadow-inner'}`}>
                                        <UserCheck size={24}/>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest leading-none mb-1.5">Action Entity</p>
                                        <p className={`text-lg font-black uppercase tracking-tight ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-950'}`}>{q.to_professionals[0]}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-zinc-700 uppercase italic tracking-[0.3em]">{new Date(q.created_at).toDateString()}</p>
                                    <div className="flex items-center gap-2 mt-1.5 opacity-40 justify-end">
                                        <ShieldCheck size={12} className="text-emerald-500" />
                                        <span className="text-[8px] font-black uppercase">Verified ID</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-10 py-32 border-2 border-dashed border-zinc-800 rounded-[4rem]">
                     <FileQuestion size={120} className="mb-8" strokeWidth={1} />
                     <p className="font-black uppercase text-xl tracking-[0.5em] italic leading-none">RFI Registry Empty</p>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* Footer Meta */}
        <div className={`p-10 border-t-2 flex flex-wrap gap-12 items-center justify-between opacity-30 ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800 shadow-inner' : 'bg-zinc-50 border-zinc-100 shadow-inner'}`}>
          <div className="flex items-center gap-5 text-left">
            <ShieldCheck size={24} className="text-emerald-500 shadow-emerald-500/20" />
            <div>
                <p className={`text-[11px] font-black uppercase tracking-widest leading-none italic ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-950'}`}>Encrypted Multi-Node Bridge Active</p>
                <p className="text-[8px] font-mono mt-1.5 uppercase font-bold tracking-tighter">PROJECT_ID: {selectedId?.slice(0,24).toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <Smartphone size={16} className="text-zinc-500" />
             </div>
             <p className="text-[11px] font-black text-zinc-600 uppercase tracking-widest leading-none">HUB_V3.1_NODE_L4</p>
          </div>
        </div>
      </div>

      <footer className="pt-32 pb-12 text-center opacity-10 select-none flex flex-col items-center gap-10">
         <div className="h-px w-80 bg-zinc-800" />
         <p className="text-[11px] font-black uppercase tracking-[2.5em] text-zinc-600 italic leading-none text-center">
           TEAM COLLABORATION ENGINE • QS VAULT
         </p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 20px; border: 1px solid transparent; background-clip: content-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
      `}</style>
    </div>
  );
};

export default CollaborationHub;