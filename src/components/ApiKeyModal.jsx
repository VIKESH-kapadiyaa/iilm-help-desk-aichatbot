import { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';

const PROVIDERS = [
  { value: 'groq',   label: 'Groq',   hint: 'gsk_...',  model: 'llama-3.3-70b-versatile' },
  { value: 'openai', label: 'OpenAI', hint: 'sk-...',   model: 'gpt-4o-mini' },
  { value: 'gemini', label: 'Gemini', hint: 'AIza...', model: 'gemini-1.5-flash' },
];

export default function ApiKeyModal({ isOpen, onClose, onActivated }) {
  const [prov, setProv] = useState('groq');
  const [key, setKey]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  if (!isOpen) return null;

  const activate = async () => {
    if (!key.trim()) { setError('Please enter an API key.'); return; }
    setLoading(true); setError('');
    try {
      if (prov === 'gemini') {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key.trim()}`,
          { method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ contents:[{parts:[{text:'hi'}]}], generationConfig:{maxOutputTokens:1} }) }
        );
        if (r.status === 401 || r.status === 403) { setError('Invalid API Key. Please check and retry.'); setLoading(false); return; }
      } else {
        const url = prov === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
        const model = prov === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';
        const r = await fetch(url, {
          method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${key.trim()}`},
          body: JSON.stringify({ model, messages:[{role:'user',content:'hi'}], max_tokens:1 })
        });
        if (r.status === 401) { setError('Invalid API Key. Please check and retry.'); setLoading(false); return; }
      }
    } catch { /* network/CORS — accept optimistically */ }
    onActivated(key.trim(), prov);
    setKey(''); setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-black/5 dark:border-white/10 bg-white/95 dark:bg-[#0d0d0d]/95 backdrop-blur-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-white/5">
          <div>
            <h2 className="text-base font-semibold dark:text-white text-gray-900">Activate Agent</h2>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">Enter your AI provider API key to initialize</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Provider */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">AI Provider</label>
            <div className="grid grid-cols-3 gap-2">
              {PROVIDERS.map(p => (
                <button key={p.value} onClick={() => setProv(p.value)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    prov === p.value
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-500/50'
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1.5 font-mono">
              Model: {PROVIDERS.find(p=>p.value===prov)?.model}
            </p>
          </div>

          {/* Key input */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">API Key</label>
            <input type="password" value={key} onChange={e=>{setKey(e.target.value);setError('');}}
              onKeyDown={e=>e.key==='Enter'&&activate()}
              placeholder={PROVIDERS.find(p=>p.value===prov)?.hint}
              className="w-full bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl h-12 px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all dark:placeholder:text-gray-700 placeholder:text-gray-400 dark:text-white text-gray-900 font-mono"
              autoFocus />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 dark:text-red-400 text-xs font-medium bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-500/20 p-3 rounded-lg">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <p className="text-[10px] text-gray-400 dark:text-gray-600 leading-relaxed">
            🔒 Key stored only in <span className="font-mono">sessionStorage</span> — never logged or persisted beyond this tab.
          </p>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose}
            className="flex-1 h-12 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
            Cancel
          </button>
          <button onClick={activate} disabled={loading||!key.trim()}
            className="flex-1 h-12 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black text-sm font-bold uppercase tracking-wider hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading ? <><span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"/>Verifying...</> : 'Activate →'}
          </button>
        </div>
      </div>
    </div>
  );
}
