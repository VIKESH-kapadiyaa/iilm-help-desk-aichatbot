import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, LogOut, Headphones, Wallet, Briefcase, GraduationCap,
  ArrowRight, ShieldCheck, Zap, ChevronRight, Activity,
  Database, Sun, Moon, LayoutGrid, Server, Globe, Eye, EyeOff, MessageSquare,
  Github, Chrome
} from 'lucide-react';
import { motion, AnimatePresence, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ApiKeyModal from './components/ApiKeyModal';
import ChatInterface from './components/ChatInterface';
import ProfilePanel from './components/ProfilePanel';
import { AGENTS } from './constants/agents';
import { supabase } from './lib/supabase';

// --- Utility for cleaner tailwind classes ---
function cn(...inputs) { return twMerge(clsx(inputs)); }

// Global Audio Context to prevent resource exhaustion
let globalAudioCtx;
const getAudioContext = () => {
  if (!globalAudioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) globalAudioCtx = new AudioContext();
  }
  return globalAudioCtx;
};

// --- Audio FX Hook ---
const useAudioFx = () => {
  const playSound = useCallback((type) => {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    const now = ctx.currentTime;
    if (type === 'click') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
      gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now); osc.stop(now + 0.15);
    } else if (type === 'success') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(440, now); osc.frequency.linearRampToValueAtTime(880, now + 0.3);
      gain.gain.setValueAtTime(0.02, now); gain.gain.linearRampToValueAtTime(0.05, now + 0.1); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now); osc.stop(now + 0.6);
    } else if (type === 'error') {
      osc.type = 'triangle'; osc.frequency.setValueAtTime(150, now); osc.frequency.linearRampToValueAtTime(100, now + 0.15);
      gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now); osc.stop(now + 0.15);
    }
  }, []);
  return { playClick: () => playSound('click'), playSuccess: () => playSound('success'), playError: () => playSound('error') };
};

// --- Text Animation Component: Terminal Typewriter ---
const AnimatedText = ({ text, className = "", delay = 0, gradient = false }) => {
  const [display, setDisplay] = useState('');
  const [phase, setPhase] = useState('initial');
  useEffect(() => {
    let timeout;
    if (phase === 'initial') timeout = setTimeout(() => setPhase('typing'), delay * 1000);
    else if (phase === 'typing') {
      if (display.length < text.length) timeout = setTimeout(() => setDisplay(text.slice(0, display.length + 1)), Math.random() * 50 + 50);
      else setPhase('pausing');
    } else if (phase === 'pausing') {
      timeout = setTimeout(() => setPhase('deleting'), 2000);
    } else if (phase === 'deleting') {
      if (display.length > 0) timeout = setTimeout(() => setDisplay(text.slice(0, display.length - 1)), 30);
      else timeout = setTimeout(() => setPhase('typing'), 500);
    }
    return () => clearTimeout(timeout);
  }, [display, phase, text, delay]);
  return (
    <span className={cn(className, "inline-flex items-center")}>
      <span className={cn(gradient && "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600")}>{display}</span>
      <span className="w-[0.6em] h-[1em] bg-blue-500 animate-pulse ml-1 opacity-70" />
    </span>
  );
};

// --- 3D Tilt Card + Spotlight ---
const TiltCard = ({ children, className = "", onInteract }) => {
  const x = useMotionValue(0); const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 500, damping: 100 }); const mouseY = useSpring(y, { stiffness: 500, damping: 100 });
  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["5deg", "-5deg"]); const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-5deg", "5deg"]);
  function handleMouseMove({ currentTarget, clientX, clientY }) {
    if (onInteract) onInteract();
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    x.set((clientX - left) / width - 0.5); y.set((clientY - top) / height - 0.5);
  }
  function handleMouseLeave() { x.set(0); y.set(0); }
  return (
    <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
      className={cn("group relative border border-neutral-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 overflow-hidden rounded-xl perspective-1000", className)}>
      <div className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition duration-300 z-30"
        style={{ background: useMotionTemplate`radial-gradient(650px circle at ${useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"])} ${useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"])}, rgba(59, 130, 246, 0.15), transparent 80%)` }} />
      <div className="relative h-full" style={{ transform: "translateZ(20px)" }}>{children}</div>
    </motion.div>
  );
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { playClick, playSuccess, playError } = useAudioFx();
  const [bootSequence, setBootSequence] = useState(0);
  const [networkTraffic, setNetworkTraffic] = useState([4, 7, 3, 8, 5, 9, 4, 6, 10]);

  // App State
  const [activeTab, setActiveTab] = useState('directory');
  const [activeAgent, setActiveAgent] = useState(null);
  const [showApiModal, setShowApiModal] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [pendingAgent, setPendingAgent] = useState(null);
  const [user, setUser] = useState(null);
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem('iilm_api_key'));
  const [provider, setProvider] = useState(() => sessionStorage.getItem('iilm_provider'));

  useEffect(() => {
    const handleGlobalClick = () => playClick();
    window.addEventListener('click', handleGlobalClick);
    
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setUser(session.user);
          setIsLoggedIn(true);
        }
      });
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
          setUser(session.user);
          setIsLoggedIn(true);
        } else {
          setUser(null);
          setIsLoggedIn(false);
        }
      });
      return () => {
        window.removeEventListener('click', handleGlobalClick);
        authListener?.subscription.unsubscribe();
      };
    }

    return () => window.removeEventListener('click', handleGlobalClick);
  }, [playClick]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    const interval = setInterval(() => setNetworkTraffic(prev => prev.map(() => Math.floor(Math.random() * 10) + 2)), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      const interval = setInterval(() => setBootSequence(prev => (prev < 100 ? prev + 1 : 100)), 30);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.endsWith('@iilm.edu')) { playError(); setError('Access Denied: Institutional Identity Required (@iilm.edu)'); return; }
    if (password.length < 8 || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) { playError(); setError('Security Alert: Weak Credentials Detected (Min 8 chars, Alphanumeric)'); return; }
    
    setError(''); setIsLoggingIn(true);

    if (supabase) {
      try {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
            if (signUpError) throw signUpError;
            // Signed up successfully (might need email confirmation depending on Supabase settings)
          } else {
            throw signInError;
          }
        }
        playSuccess();
        // State updated via onAuthStateChange
      } catch (err) {
        playError();
        setError(err.message || 'Authentication Failed');
      } finally {
        setIsLoggingIn(false);
      }
    } else {
      // Fallback for demo without Supabase configured
      setTimeout(() => { playSuccess(); setIsLoggedIn(true); setIsLoggingIn(false); }, 1500);
    }
  };

  const handleOAuthLogin = async (providerName) => {
    if (!supabase) {
      playError();
      setError('System Error: Supabase Gateway Disconnected.');
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: providerName,
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      playError();
      setError(err.message || `${providerName} Authentication Failed`);
    }
  };

  const handleAgentClick = (agent) => {
    if (apiKey) setActiveAgent(agent);
    else { setPendingAgent(agent); setShowApiModal(true); }
  };

  if (!isLoggedIn) {
    return (
      <div className="relative min-h-screen bg-gray-50 dark:bg-[#020202] text-gray-900 dark:text-[#ededed] flex items-center justify-center font-sans overflow-hidden transition-colors duration-500">
        <button onClick={(e) => { e.stopPropagation(); playClick(); setIsDarkMode(!isDarkMode); }}
          className="absolute top-6 right-6 z-50 p-3 rounded-full bg-white/10 backdrop-blur-md border border-black/5 dark:border-white/10 hover:scale-110 transition-transform shadow-lg">
          {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-blue-600" />}
        </button>
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('/campus-bg.jpg')] bg-cover bg-center bg-no-repeat" />
          <div className="absolute inset-0 bg-gray-50/90 dark:bg-[#020202]/90 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
          <motion.div animate={{ background: isDarkMode ? ["radial-gradient(circle at 0% 0%, #1d4ed810 0%, transparent 50%)", "radial-gradient(circle at 100% 100%, #1d4ed810 0%, transparent 50%)", "radial-gradient(circle at 0% 0%, #1d4ed810 0%, transparent 50%)"] : ["radial-gradient(circle at 0% 0%, #3b82f610 0%, transparent 50%)", "radial-gradient(circle at 100% 100%, #3b82f610 0%, transparent 50%)", "radial-gradient(circle at 0% 0%, #3b82f610 0%, transparent 50%)"] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute inset-0" />
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-[1200px] h-auto lg:min-h-[700px] grid grid-cols-1 lg:grid-cols-12 border border-black/5 dark:border-white/5 rounded-[32px] overflow-hidden shadow-2xl bg-white/80 dark:bg-[#080808]/80 backdrop-blur-2xl relative z-10 m-4">
          <div className="hidden lg:flex lg:col-span-7 flex-col justify-between p-16 relative border-r border-black/5 dark:border-white/5">
            <div className="relative z-10">
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-4 mb-20">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-500/20"><Zap className="w-6 h-6 text-white" /></div>
                <div className="h-8 w-px bg-black/10 dark:bg-white/10" />
                <span className="font-bold tracking-tight text-2xl dark:text-white text-gray-900">IILM.HELP</span>
              </motion.div>
              <div className="space-y-8">
                <div className="text-6xl font-medium tracking-tighter leading-[1.1] dark:text-white text-gray-900">
                  <AnimatedText text="Intelligent" delay={0.4} /> <br /><span className="font-serif italic text-blue-600">Workspace</span>
                </div>
                <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 }} className="dark:text-gray-400 text-gray-600 text-lg leading-relaxed max-w-md">
                  <AnimatedText text="Unified AI command center for institutional management." delay={0.8} />
                </motion.p>
              </div>
            </div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="grid grid-cols-2 gap-12">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold dark:text-gray-500 text-gray-400 uppercase tracking-widest"><Activity className="w-3 h-3 text-blue-500" /> System Core</div>
                <div className="w-full h-1 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden"><motion.div initial={{ width: "0%" }} animate={{ width: `${bootSequence}%` }} className="h-full bg-blue-600" /></div>
                <div className="flex justify-between text-[10px] font-mono dark:text-gray-400 text-gray-500"><span>INDUSTRIAL_KERNEL_v2</span><span>{bootSequence}%</span></div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-bold dark:text-gray-500 text-gray-400 uppercase tracking-widest"><Database className="w-3 h-3 text-emerald-500" /> Gateway</div>
                <div className="text-sm font-mono dark:text-gray-300 text-gray-700">SECURE_GATEWAY_AUTH</div>
                <div className="text-[10px] text-emerald-600 font-bold tracking-tighter uppercase">Encrypted_Link</div>
              </div>
            </motion.div>
          </div>
          <div className="lg:col-span-5 flex flex-col justify-center p-8 md:p-16 bg-gradient-to-b from-white dark:from-white/[0.02] to-transparent">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: "spring" }} className="max-w-sm mx-auto w-full">
              <div className="mb-10 text-center lg:text-left">
                <h1 className="text-3xl font-semibold dark:text-white text-gray-900 tracking-tight mb-3"><AnimatedText text="Initialize Portal" delay={0.6} /></h1>
                <p className="dark:text-gray-500 text-gray-600 text-sm">Enter institutional credentials to connect.</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-4">
                  <div className="group">
                    <input type="email" placeholder="Institutional ID (admin@iilm.edu)" className="w-full bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl h-14 px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all dark:placeholder:text-gray-700 placeholder:text-gray-400 dark:text-white text-gray-900" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="group relative">
                    <input type={showPassword ? "text" : "password"} placeholder="Security Key" className="w-full bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl h-14 px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all dark:placeholder:text-gray-700 placeholder:text-gray-400 dark:text-white text-gray-900 pr-12" required value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" onClick={(e) => { e.stopPropagation(); playClick(); setShowPassword(!showPassword); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                {error && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-600 dark:text-red-400 text-xs font-bold bg-red-100 dark:bg-red-900/20 p-3 rounded-lg flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> {error}</motion.div>}
                <button type="submit" onClick={(e) => { e.stopPropagation(); playClick(); }} disabled={isLoggingIn} className="relative w-full h-14 bg-gray-900 dark:bg-white text-white dark:text-black font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white transition-all overflow-hidden flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
                  {isLoggingIn ? <div className="flex items-center gap-2"><Activity className="w-4 h-4 animate-spin" /> Verifying...</div> : <>Establish Connection <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-white/10 flex flex-col gap-4 opacity-80 hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 text-center">Or connect with</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); playClick(); handleOAuthLogin('google'); }} className="flex items-center justify-center gap-3 w-full p-3.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all cursor-pointer text-sm font-bold text-gray-700 dark:text-gray-300 group shadow-sm hover:shadow-md">
                  <div className="w-5 h-5 group-hover:scale-110 transition-transform">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>
                  Continue with Google
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-[#e5e5e5] font-sans transition-colors duration-500">
      <nav className="sticky top-0 w-full z-40 bg-white/80 dark:bg-black/60 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 px-6 lg:px-8 h-16 flex items-center justify-between transition-colors duration-500">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-blue-600" /><span className="font-bold tracking-tight text-lg">IILM.HELP</span></div>
          <div className="h-4 w-px bg-gray-300 dark:bg-white/10" />
          <div className="hidden md:flex items-center gap-6 text-[11px] font-bold uppercase tracking-widest text-gray-500">
            {['directory', 'automations', 'history'].map(tab => (
              <span key={tab} onClick={() => setActiveTab(tab)} className={`cursor-pointer transition-colors ${activeTab === tab ? 'dark:text-white text-gray-900' : 'hover:text-blue-500'}`}>{tab}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={(e) => { e.stopPropagation(); playClick(); setIsDarkMode(!isDarkMode); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            {isDarkMode ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-blue-600" />}
          </button>
          {!apiKey ? (
            <button onClick={() => setShowApiModal(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] font-bold uppercase tracking-widest hover:bg-orange-500/20 transition-all">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" /> Add Key
            </button>
          ) : (
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Status: Connected</span>
              <span className="text-[9px] text-emerald-600 font-mono">NODE_LHR_002_ACTIVE</span>
            </div>
          )}
          <div onClick={() => setShowProfilePanel(true)} className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-[2px] cursor-pointer hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-full bg-white dark:bg-[#111] flex items-center justify-center overflow-hidden">
              <span className="text-sm font-bold text-gray-900 dark:text-white">IU</span>
            </div>
          </div>
          <button onClick={async (e) => { 
            e.stopPropagation(); 
            playClick(); 
            if (supabase) await supabase.auth.signOut();
            setIsLoggedIn(false); 
          }} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><LogOut className="w-5 h-5" /></button>
        </div>
      </nav>

      <main className="pt-12 pb-12 px-6 lg:px-12 max-w-[1600px] mx-auto">
        {activeTab === 'directory' && (
          <>
            <div className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl">
                <div className="flex items-center gap-2 mb-4"><span className="h-px w-8 bg-blue-600" /><span className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-600">Internal Agent Directory</span></div>
                <h1 className="text-5xl font-light tracking-tighter dark:text-white text-gray-900 mb-6"><AnimatedText text="AI ChaTbOT at your help" delay={0.2} /></h1>
                <p className="dark:text-gray-400 text-gray-600 leading-relaxed text-sm lg:text-base font-medium border-l-2 border-blue-600/30 pl-6">Access specialized institutional modules designed for deep management and student support workflow automation.</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="relative group min-w-[340px]">
                <div className="relative flex items-center bg-white dark:bg-[#0d0d0d] border border-gray-200 dark:border-white/10 rounded-xl px-4 h-14 group-focus-within:border-blue-500/50 group-focus-within:ring-2 group-focus-within:ring-blue-500/10 transition-all shadow-sm">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Query directory... (CMD + K)" className="bg-transparent border-none outline-none ml-4 w-full text-sm font-medium dark:placeholder:text-gray-700 placeholder:text-gray-400 dark:text-white text-gray-900" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  <kbd className="hidden lg:inline-flex bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2 py-1 rounded text-[10px] text-gray-500 font-mono">⌘K</kbd>
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {AGENTS.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((cat, idx) => (
                  <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="col-span-1">
                    <TiltCard className="h-full hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
                      <div className="p-8 h-full flex flex-col relative z-20">
                        <div className="flex items-start justify-between mb-8">
                          <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 text-2xl">{cat.icon}</div>
                          <div className="flex flex-col items-end gap-2">
                            <div className={`flex items-center gap-2 px-2 py-1 rounded-full border ${cat.status === 'ACTIVE' || cat.status === 'OPERATIONAL' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-orange-500/10 border-orange-500/20 text-orange-600'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${cat.status === 'ACTIVE' || cat.status === 'OPERATIONAL' ? 'bg-emerald-500 animate-pulse' : 'bg-orange-500'}`} />
                              <span className="text-[10px] font-bold uppercase tracking-wide">{cat.status}</span>
                            </div>
                            <span className="font-mono text-[10px] text-gray-400">LATENCY: {cat.latency}</span>
                          </div>
                        </div>
                        <div className="mt-auto">
                          <h3 className="text-xl font-bold dark:text-white text-gray-900 group-hover:text-blue-600 transition-colors mb-2">{cat.name}</h3>
                          <p className="text-sm dark:text-gray-400 text-gray-500 leading-relaxed mb-6">{cat.description}</p>
                          <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/5 pt-6">
                            <span className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{cat.version}</span>
                            <button onClick={() => handleAgentClick(cat)} className="flex items-center gap-2 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">Initialize <ChevronRight className="w-3 h-3" /></button>
                          </div>
                        </div>
                      </div>
                    </TiltCard>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}

        {activeTab === 'automations' && (
          <div className="max-w-3xl mx-auto space-y-4">
            {AGENTS.map((agent, i) => (
              <motion.button key={agent.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => handleAgentClick(agent)} className="w-full bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex items-center justify-between hover:shadow-lg hover:border-blue-500/30 transition-all group">
                <div className="flex items-center gap-6">
                  <div className="text-2xl w-12 h-12 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">{agent.icon}</div>
                  <div className="text-left">
                    <div className="font-bold dark:text-white text-gray-900 text-lg group-hover:text-blue-600 transition-colors">{agent.name}</div>
                    <div className="text-sm dark:text-gray-400 text-gray-500">{agent.description}</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </motion.button>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {AGENTS.map(agent => {
              const msgs = JSON.parse(sessionStorage.getItem(`history_${agent.id}`) || '[]').filter(m => m.role === 'user');
              if (msgs.length === 0) return null;
              return (
                <div key={agent.id} className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50 dark:bg-white/2">
                    <div className="flex items-center gap-3 font-bold dark:text-white text-gray-900"><span className="text-xl">{agent.icon}</span> {agent.name}</div>
                    <button onClick={() => handleAgentClick(agent)} className="text-xs font-bold text-blue-600 uppercase tracking-widest hover:text-blue-500">Resume Session</button>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {msgs.slice(0, 3).map((m, i) => (
                      <div key={i} className="px-6 py-4 flex items-start gap-4">
                        <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm dark:text-gray-300 text-gray-600">{m.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {activeAgent && <ChatInterface agent={activeAgent} apiKey={apiKey} provider={provider} onClose={() => setActiveAgent(null)} user={user} />}
      <ApiKeyModal isOpen={showApiModal} onClose={() => setShowApiModal(false)} onActivated={(k, p) => { sessionStorage.setItem('iilm_api_key', k); sessionStorage.setItem('iilm_provider', p); setApiKey(k); setProvider(p); setShowApiModal(false); if (pendingAgent) setActiveAgent(pendingAgent); setPendingAgent(null); }} />
      <ProfilePanel 
        isOpen={showProfilePanel} 
        onClose={() => setShowProfilePanel(false)} 
        apiKey={apiKey} 
        provider={provider} 
        user={user}
        onChangeKey={() => { setShowProfilePanel(false); setShowApiModal(true); }}
        onRevokeKey={() => { 
          sessionStorage.removeItem('iilm_api_key'); 
          sessionStorage.removeItem('iilm_provider'); 
          setApiKey(null); 
          setProvider(null); 
          setActiveAgent(null); 
        }}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => { playClick(); setIsDarkMode(!isDarkMode); }}
        onResetSession={() => {
          sessionStorage.clear();
          window.location.reload();
        }}
      />

      <footer className="mt-20 py-12 border-t border-gray-200 dark:border-white/5 dark:bg-[#080808] bg-gray-50 transition-colors duration-500">
        <div className="max-w-[1600px] mx-auto px-12 flex flex-col md:flex-row justify-between items-center gap-6 opacity-50 hover:opacity-100 transition-opacity">
          <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest dark:text-gray-500 text-gray-600"><span className="cursor-pointer hover:text-blue-500">System Orchestration Layer</span><span className="cursor-pointer hover:text-blue-500">Secure Identity Provider</span></div>
          <p className="text-[10px] font-mono dark:text-gray-600 text-gray-500">BUILD_ID: 99x_IILM_STATIC_v2 | EDGE_LHR_1</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
