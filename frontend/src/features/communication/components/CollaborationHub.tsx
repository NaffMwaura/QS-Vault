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
  Loader2,
  ShieldCheck,
  UserCheck,
  Smartphone,
  RefreshCw
} from 'lucide-react';

/* ======================================================
    OFFICE MODULE RESOLUTION (STABILIZED)
   ====================================================== */

let useAuth: any = () => ({ theme: 'light', user: null, isOnline: true });
let db: any = null;
let syncEngine: any = null;
let supabase: any = null;

const resolveModules = async () => {
  try {
    const authMod = await import("../../auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const dbMod = await import("../../../lib/database/database");
    if (dbMod.db) db = dbMod.db;
    if (dbMod.syncEngine) syncEngine = dbMod.syncEngine;
    if (dbMod.supabase) supabase = dbMod.supabase;
  } catch (e) {
    console.warn("Comm Hub: Connecting to database nodes...");
  }
};

resolveModules();

/** --- TYPES --- **/

interface Message {
  id: string;
  project_id: string;
  user_id: string;
  user_name: string; 
  text: string;
  timestamp: string;
  is_local?: boolean; 
}

interface CollaborationHubProps {
  projectId: string | null;
}

/** --- MAIN COMPONENT: TEAM CHAT & QUESTIONS --- **/

const CollaborationHub: React.FC<CollaborationHubProps> = ({ projectId: initialId }) => {
  const { user, theme, isOnline } = useAuth();
  
  // WORKSPACE CONTEXT
  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  
  // UI NAVIGATION
  const [activeTab, setActiveTab] = useState<'chat' | 'questions'>('chat');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // DATA STATES
  const [messages, setMessages] = useState<Message[]>([]);
  const [rfis, setRfis] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // QUESTION FORM STATES
  const [isAsking, setIsAsking] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    subject: '',
    content: '',
    recipient: 'Project Manager'
  });

  /** * 1. LOAD PROJECTS LIST */
  useEffect(() => {
    const loadProjects = async () => {
      if (!db || !user) return;
      const projects = await db.projects.where('user_id').equals(user.id).toArray();
      setAvailableProjects(projects);
      if (!selectedId && projects.length > 0) {
        setSelectedId(projects[0].id);
      }
    };
    loadProjects();
  }, [user, selectedId]);

  /** * 2. LOAD TEAM MESSAGES (FIXED LOADING HANG) */
  const syncMessages = useCallback(async () => {
    if (!db || !selectedId) {
        setIsLoading(false);
        return;
    }

    try {
      setIsRefreshing(true);

      // A. Pull new messages from Cloud if online
      if (isOnline && supabase) {
          const { data: cloudMsgs } = await supabase
              .from('chat_messages')
              .select('*')
              .eq('project_id', selectedId);
          
          if (cloudMsgs) {
              await db.chat_messages.bulkPut(cloudMsgs);
          }
      }

      // B. Load everything from the local vault
      const [storedMessages, storedRfis] = await Promise.all([
        db.chat_messages.where('project_id').equals(selectedId).toArray(),
        db.rfis.where('project_id').equals(selectedId).reverse().toArray()
      ]);

      setMessages(storedMessages.sort((a: any, b: any) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ));
      setRfis(storedRfis);
    } catch (err) {
      console.error("Chat sync interrupted.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedId, isOnline]);

  useEffect(() => {
    syncMessages();
  }, [syncMessages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  /** * 3. SEND MESSAGE ENGINE */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedId || !db) return;

    const messageData: Message = {
      id: crypto.randomUUID(),
      project_id: selectedId,
      user_id: user?.id || 'local-user',
      user_name: user?.user_metadata?.full_name || 'Team Member',
      text: newMessage,
      timestamp: new Date().toISOString(),
      is_local: true
    };

    try {
      await db.chat_messages.add(messageData);
      if (syncEngine) await syncEngine.queueChange('chat_messages', messageData.id, 'INSERT', messageData);
      setNewMessage('');
      setMessages(prev => [...prev, messageData]);
    } catch (err) { console.error("Message failed to send."); }
  };

  /** * 4. ASK TECHNICAL QUESTION (RFI) */
  const handleSendQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !db) return;

    const qId = crypto.randomUUID();
    const qData = {
      id: qId,
      project_id: selectedId,
      subject: questionForm.subject,
      content: questionForm.content,
      to_professionals: [questionForm.recipient],
      status: 'sent',
      created_at: new Date().toISOString()
    };

    try {
      await db.rfis.add(qData);
      if (syncEngine) await syncEngine.queueChange('rfis', qId, 'INSERT', qData);
      setIsAsking(false);
      setQuestionForm({ subject: '', content: '', recipient: 'Project Manager' });
      syncMessages();
    } catch (err) { console.error("Question could not be saved."); }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-40 opacity-30">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-amber-500" />
        <p className={`font-black text-[10px] uppercase tracking-[0.5em] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-950'}`}>Syncing Team Chat...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 text-left pb-10">
      
      {/* 1. PROJECT & TAB SELECTOR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-transparent px-4 sm:px-0">
        <div className="space-y-3">
          <h3 className={`text-4xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Team Communication</h3>
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
             <button onClick={syncMessages} className="p-2 hover:bg-zinc-500/10 rounded-lg transition-colors">
                <RefreshCw size={14} className={`${isRefreshing ? 'animate-spin' : ''} text-zinc-500`} />
             </button>
          </div>
        </div>

        <div className="flex bg-zinc-900/40 p-1.5 rounded-2xl border border-zinc-800 shadow-inner w-full md:w-auto">
           <button onClick={() => setActiveTab('chat')} className={`flex-1 md:flex-none px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'chat' ? 'bg-amber-500 text-black shadow-lg' : 'text-zinc-500'}`}>Messages</button>
           <button onClick={() => setActiveTab('questions')} className={`flex-1 md:flex-none px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'questions' ? 'bg-amber-500 text-black shadow-lg' : 'text-zinc-500'}`}>Questions</button>
        </div>
      </div>

      {/* 2. CHAT WORKSPACE */}
      <div className={`h-[600px] rounded-[4rem] border backdrop-blur-3xl overflow-hidden flex flex-col transition-all duration-500 shadow-2xl mx-4 sm:mx-0
        ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
        
        {activeTab === 'chat' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
             {/* Messaging Header */}
             <div className="p-8 border-b border-zinc-800/40 flex justify-between items-center bg-white/[0.01]">
                <div className="text-left space-y-1">
                   <h4 className="text-xl font-black uppercase italic tracking-tighter">Project Chat</h4>
                   <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Share updates with everyone on the team</p>
                </div>
                <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[9px] font-black uppercase text-emerald-500">Secured</span>
                </div>
             </div>

             {/* Message Stream */}
             <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                {messages.map((msg) => {
                  const isMe = msg.user_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                       <div className={`max-w-[85%] sm:max-w-[70%] space-y-2 ${isMe ? 'text-right' : 'text-left'}`}>
                          {!isMe && (
                             <div className="flex items-center gap-2 px-2">
                                <div className="w-5 h-5 rounded bg-amber-500/20 flex items-center justify-center font-black text-[9px] text-amber-500 italic">{(msg.user_name?.[0] || 'U').toUpperCase()}</div>
                                <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">{msg.user_name}</span>
                             </div>
                          )}
                          
                          <div className={`p-6 rounded-[2.2rem] text-sm font-medium leading-relaxed shadow-xl border
                            ${isMe 
                              ? 'bg-amber-500 text-black border-amber-600 rounded-tr-none' 
                              : theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-200 rounded-tl-none' : 'bg-zinc-50 border-zinc-200 text-zinc-950 rounded-tl-none shadow-sm'}`}>
                             {msg.text}
                          </div>
                          
                          <div className={`flex items-center gap-3 px-4 italic leading-none ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                               {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                       </div>
                    </div>
                  );
                })}
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-10">
                     <MessageSquare size={80} className="mb-6 animate-pulse" />
                     <p className="font-black uppercase text-lg tracking-[0.4em] italic leading-none">Chat Started</p>
                  </div>
                )}
             </div>

             {/* Input Area */}
             <form onSubmit={handleSendMessage} className="p-8 border-t border-zinc-800/40 bg-zinc-950/20">
                <div className="relative group">
                   <input 
                     type="text"
                     placeholder="Type a message to the group..."
                     value={newMessage}
                     onChange={(e) => setNewMessage(e.target.value)}
                     className={`w-full p-8 pr-28 rounded-[2.5rem] border outline-none transition-all font-bold text-sm shadow-inner
                       ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-950 focus:border-amber-500 shadow-sm'}`}
                   />
                   <div className="absolute right-5 top-1/2 -translate-y-1/2">
                      <button type="submit" className="p-5 bg-amber-500 text-black rounded-2xl hover:bg-amber-400 active:scale-90 transition-all shadow-2xl shadow-amber-500/20">
                         <Send size={24} />
                      </button>
                   </div>
                </div>
             </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
             {/* Questions Header */}
             <div className="p-8 border-b border-zinc-800/40 flex justify-between items-center bg-white/[0.01]">
                <div className="text-left space-y-1">
                   <h4 className="text-xl font-black uppercase italic tracking-tighter">Team Questions</h4>
                   <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Ask for advice or clarification on site issues</p>
                </div>
                <button 
                  onClick={() => setIsAsking(true)}
                  className="px-8 py-4 bg-amber-500 text-black font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl hover:bg-amber-400 transition-all flex items-center gap-3"
                >
                   <Plus size={16} strokeWidth={3} /> New Question
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                {isAsking ? (
                  <form onSubmit={handleSendQuestion} className="space-y-10 animate-in slide-in-from-top-4 duration-500 max-w-3xl mx-auto py-10">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4 text-left">
                           <label className="text-[11px] font-black uppercase text-zinc-500 ml-4 tracking-widest italic">Who are you asking?</label>
                           <select value={questionForm.recipient} onChange={(e) => setQuestionForm({...questionForm, recipient: e.target.value})}
                                className={`w-full p-6 rounded-2xl border appearance-none font-bold text-xs outline-none transition-all shadow-inner
                                  ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-950'}`}>
                                <option>Project Manager</option><option>Architect</option><option>Engineer</option><option>Lead Surveyor</option>
                           </select>
                        </div>
                        <div className="space-y-4 text-left">
                           <label className="text-[11px] font-black uppercase text-zinc-500 ml-4 tracking-widest italic">Subject</label>
                           <input required placeholder="e.g. Concrete mix design" value={questionForm.subject} onChange={(e) => setQuestionForm({...questionForm, subject: e.target.value})}
                             className={`w-full p-6 rounded-2xl border font-bold text-xs outline-none transition-all shadow-inner
                               ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-950'}`} />
                        </div>
                     </div>
                     <div className="space-y-4 text-left">
                        <label className="text-[11px] font-black uppercase text-zinc-500 ml-4 tracking-widest italic text-left">Details</label>
                        <textarea required rows={6} placeholder="Write your question clearly here..." value={questionForm.content} onChange={(e) => setQuestionForm({...questionForm, content: e.target.value})}
                          className={`w-full p-10 rounded-[3rem] border outline-none font-medium text-sm leading-relaxed shadow-inner
                            ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-950'}`} />
                     </div>
                     <div className="flex gap-4">
                        <button type="submit" className="flex-1 py-8 bg-amber-500 text-black font-black uppercase text-xs tracking-[0.4em] rounded-[2.5rem] shadow-2xl hover:bg-amber-400 transition-all flex items-center justify-center gap-5 italic active:scale-[0.98]">
                           <Send size={24} /> Send Question
                        </button>
                        <button type="button" onClick={() => setIsAsking(false)} className={`px-12 py-8 rounded-[2.5rem] font-black uppercase text-xs tracking-widest transition-all border
                           ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-black'}`}>Cancel</button>
                     </div>
                  </form>
                ) : rfis.length > 0 ? rfis.map((q) => (
                  <div key={q.id} className={`p-10 rounded-[3.5rem] border group transition-all text-left relative overflow-hidden shadow-2xl
                    ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800 hover:border-amber-500/20' : 'bg-zinc-50 border-zinc-100 hover:border-amber-500'}`}>
                     <div className="flex justify-between items-start mb-8">
                        <div className="space-y-2 text-left">
                           <span className="px-4 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-500 group-hover:text-amber-500 transition-colors uppercase leading-none font-bold italic">
                             NODE: {q.id.slice(0,6).toUpperCase()}
                           </span>
                           <h5 className={`text-3xl font-black uppercase italic tracking-tighter mt-6 leading-none ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-950'}`}>{q.subject}</h5>
                        </div>
                        <div className={`flex items-center gap-3 px-5 py-2.5 rounded-full text-[10px] font-black uppercase border shadow-xl
                          ${q.status === 'sent' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                           {q.status}
                        </div>
                     </div>
                     <p className={`text-base leading-relaxed font-medium mb-12 italic text-left ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>"{q.content}"</p>
                     <div className="flex justify-between items-center pt-8 border-t border-zinc-800/40 opacity-60">
                        <div className="flex items-center gap-4 text-left">
                           <div className="p-3 rounded-xl bg-zinc-900 text-zinc-500 shadow-inner"><User size={20}/></div>
                           <p className={`text-sm font-bold uppercase tracking-tight ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-950'}`}>{q.to_professionals[0]}</p>
                        </div>
                        <p className="text-[9px] font-black text-zinc-700 uppercase italic tracking-widest">{new Date(q.created_at).toDateString()}</p>
                     </div>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-10 py-24">
                     <FileQuestion size={100} className="mb-8" />
                     <p className="font-black uppercase text-lg tracking-[0.5em] italic leading-none">Inbox Empty</p>
                  </div>
                )}
             </div>
          </div>
        )}

        <div className={`p-8 border-t flex flex-wrap gap-10 items-center justify-between opacity-30 ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 shadow-inner' : 'bg-zinc-50 border-zinc-100 shadow-inner'}`}>
          <div className="flex items-center gap-4 text-left">
            <ShieldCheck size={20} className="text-emerald-500" />
            <p className={`text-[10px] font-black uppercase tracking-[0.3em] italic leading-none ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-950'}`}>Sync active with group nodes</p>
          </div>
          <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest leading-none">TEAM_HUB_v2.7</p>
        </div>
      </div>

      <footer className="pt-24 pb-12 text-center opacity-20 select-none flex flex-col items-center gap-8">
         <p className="text-[10px] font-black uppercase tracking-[2.5em] text-zinc-600 italic leading-none text-center">
           TEAM CHAT ENGINE • QS VAULT
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