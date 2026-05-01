import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Send, Activity, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

const PROVIDER_CFG = {
  groq:   { url:'https://api.groq.com/openai/v1/chat/completions',    model:'llama-3.3-70b-versatile',  type:'compat' },
  openai: { url:'https://api.openai.com/v1/chat/completions',         model:'gpt-4o-mini',     type:'compat' },
  gemini: { url:'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', model:'gemini-1.5-flash', type:'gemini' },
};

const SUGGESTIONS = {
  finance:    ['What are the MBA fee structures?','Are there scholarship programs?','How do I pay hostel fees?'],
  support:    ['How do I raise a grievance?','Library card renewal process?','Lost ID card — what to do?'],
  operations: ['How to book a classroom?','What campus transport is available?','Event scheduling process?'],
  academic:   ['What MBA specializations are offered?','When is the next exam schedule?','Internship placement policy?'],
  general:    ['Tell me about IILM University','What programs are offered?','What are placements like?'],
  admissions: ['CAT cutoff for MBA admissions?','Application deadline for 2025?','Documents required?'],
};

function TypingDots() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-sm shadow-[0_0_15px_rgba(59,130,246,0.15)]">🤖</div>
      <div className="px-4 py-3.5 rounded-2xl rounded-bl-sm bg-white/5 border border-white/10 backdrop-blur-md flex gap-1.5 items-center shadow-lg shadow-black/20">
        {[0,1,2].map(i=>(
          <span key={i} className={`w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce-dot dot-${i+1}`}/>
        ))}
      </div>
    </motion.div>
  );
}

function Bubble({ msg, icon }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.3 }}
      className={`flex items-end gap-3 ${isUser?'flex-row-reverse':''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 shadow-lg ${isUser?'bg-gradient-to-br from-blue-500 to-blue-700 text-white text-xs font-bold shadow-blue-500/30':'bg-gradient-to-br from-white/10 to-white/5 border border-white/10 shadow-black/30'}`}>
        {isUser ? 'U' : icon}
      </div>
      <div className={`max-w-[75%] px-5 py-3.5 text-sm leading-relaxed rounded-2xl shadow-xl backdrop-blur-md ${isUser?'bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-br-sm border border-blue-500/30 shadow-blue-500/20':'bg-white/5 border border-white/10 text-gray-200 rounded-bl-sm shadow-black/40'}`}>
        <div className="whitespace-pre-wrap">{msg.content}</div>
        {msg.ts && <div className={`text-[10px] mt-2 font-mono ${isUser?'text-blue-200/70':'text-gray-500'}`}>{new Date(msg.ts).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>}
      </div>
    </motion.div>
  );
}

async function callAI(agent, messages, apiKey, provider) {
  const cfg = PROVIDER_CFG[provider];
  if (cfg.type === 'compat') {
    const r = await fetch(cfg.url, {
      method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},
      body: JSON.stringify({ model:cfg.model, messages:[{role:'system',content:agent.systemPrompt},...messages.map(m=>({role:m.role,content:m.content}))], max_tokens:1024, temperature:0.7 })
    });
    if (!r.ok) { const e=await r.json().catch(()=>({})); throw new Error(e?.error?.message||`HTTP ${r.status}`); }
    return (await r.json()).choices[0].message.content;
  }
  const r = await fetch(`${cfg.url}?key=${apiKey}`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ system_instruction:{parts:[{text:agent.systemPrompt}]}, contents:messages.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]})), generationConfig:{temperature:0.7,maxOutputTokens:1024} })
  });
  if (!r.ok) { const e=await r.json().catch(()=>({})); throw new Error(e?.error?.message||`HTTP ${r.status}`); }
  return (await r.json()).candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';
}

export default function ChatInterface({ agent, apiKey, provider, onClose, user }) {
  const storageKey = `history_${agent.id}`;
  const [messages, setMessages] = useState([]);
  const [input, setInput]   = useState('');
  const [typing, setTyping] = useState(false);
  const [error,  setError]  = useState('');
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    const loadMessages = async () => {
      if (supabase && user) {
        const { data } = await supabase
          .from('chat_sessions')
          .select('messages')
          .eq('user_id', user.id)
          .eq('agent_id', agent.id)
          .single();
        if (data && data.messages) {
          setMessages(data.messages);
        } else {
          setMessages([]);
        }
      } else {
        setMessages(JSON.parse(sessionStorage.getItem(storageKey)||'[]'));
      }
    };
    loadMessages();
  }, [agent.id, user]);

  const save = useCallback(async (msgs) => {
    if (supabase && user) {
      await supabase
        .from('chat_sessions')
        .upsert({ user_id: user.id, agent_id: agent.id, messages: msgs }, { onConflict: 'user_id,agent_id' });
    } else {
      sessionStorage.setItem(storageKey, JSON.stringify(msgs));
    }
  }, [storageKey, agent.id, user]);

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:'smooth'}); }, [messages, typing]);
  useEffect(() => { setTimeout(()=>inputRef.current?.focus(), 80); }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || typing) return;
    const userMsg = { role:'user', content:text, ts:Date.now() };
    const next = [...messages, userMsg];
    setMessages(next); 
    save(next); 
    setInput(''); setTyping(true); setError('');
    try {
      const reply = await callAI(agent, next, apiKey, provider);
      const aMsg = { role:'assistant', content:reply, ts:Date.now() };
      const final = [...next, aMsg];
      setMessages(final); 
      save(final);
    } catch(e) {
      setError(e.message?.includes('401')||e.message?.includes('403') ? 'Invalid API Key. Please check and retry.' : `Error: ${e.message}`);
    }
    setTyping(false);
  };

  const isStandby = agent.status === 'STANDBY' || agent.status === 'Standby';
  const statusColor = isStandby ? 'text-orange-500 bg-orange-500/10 border-orange-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  const dotColor    = isStandby ? 'bg-orange-500' : 'bg-emerald-400 animate-pulse';

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex flex-col bg-[#050505] text-[#e5e5e5] overflow-hidden">
      
      {/* Background FX */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      </div>

      {/* Header */}
      <div className="relative z-10 bg-black/40 backdrop-blur-2xl border-b border-white/10 px-4 sm:px-8 h-20 flex items-center gap-6 flex-shrink-0 shadow-lg shadow-black/50">
        <button onClick={onClose} className="flex items-center gap-2 text-gray-400 hover:text-white text-[11px] font-bold uppercase tracking-widest transition-all group hover:bg-white/5 px-3 py-2 rounded-lg">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform"/> Close Session
        </button>
        <div className="h-8 w-px bg-white/10"/>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(255,255,255,0.05)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10">{agent.icon}</span>
          </div>
          <div>
            <div className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              {agent.name}
              <Sparkles className="w-4 h-4 text-blue-400 opacity-50" />
            </div>
            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded-full border text-[10px] font-bold uppercase tracking-widest shadow-inner ${statusColor}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`}/>{agent.status}
            </div>
          </div>
        </div>
        {messages.length>0 && <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">{messages.length} exchanges</div>}
      </div>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-6 scroll-smooth">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col items-center justify-center min-h-[50vh] gap-8 text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
                <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-5xl shadow-2xl backdrop-blur-xl">
                  {agent.icon}
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-light tracking-tight text-white mb-3">Initialize <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">{agent.name}</span></h2>
                <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed border-l-2 border-blue-500/30 pl-4">{agent.description}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mt-4">
                {(SUGGESTIONS[agent.id]||[]).map((q,i)=>(
                  <motion.button key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={()=>{setInput(q);inputRef.current?.focus();}}
                    className="px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-gray-300 text-left hover:bg-white/10 hover:border-blue-500/40 hover:text-white transition-all shadow-lg backdrop-blur-sm group">
                    <span className="opacity-50 group-hover:opacity-100 transition-opacity mr-2 text-blue-400">→</span> {q}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
          <AnimatePresence>
            {messages.map((m,i) => <Bubble key={i} msg={m} icon={agent.icon}/>)}
          </AnimatePresence>
          {typing && <TypingDots/>}
          {error && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 text-red-400 text-xs font-bold bg-red-500/10 border border-red-500/20 p-4 rounded-2xl backdrop-blur-md shadow-lg">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20">⚠</span> {error}
            </motion.div>
          )}
          <div ref={bottomRef} className="h-4"/>
        </div>
      </div>

      {/* Input */}
      <div className="relative z-20 bg-black/40 backdrop-blur-2xl border-t border-white/10 px-4 sm:px-8 py-5 flex-shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end gap-3 bg-white/5 border border-white/10 rounded-2xl p-2 focus-within:border-blue-500/50 focus-within:bg-white/10 transition-all shadow-inner">
            <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}}
              placeholder={`Commence dialogue with ${agent.name}...`}
              rows={1} style={{scrollbarWidth:'none'}}
              className="flex-1 resize-none bg-transparent border-none px-4 py-3 text-sm outline-none text-white placeholder:text-gray-500 max-h-40 font-medium"/>
            <button onClick={send} disabled={!input.trim()||typing}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 active:scale-95 shadow-lg shadow-blue-500/25 mb-0.5 mr-0.5">
              {typing ? <Activity className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5 ml-0.5"/>}
            </button>
          </div>
          <p className="text-center text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 mt-3 opacity-60">
            [ENTER] TRANSMIT &nbsp;·&nbsp; [SHIFT+ENTER] NEW LINE &nbsp;·&nbsp; SECURE CHANNEL IILM
          </p>
        </div>
      </div>
    </motion.div>
  );
}
