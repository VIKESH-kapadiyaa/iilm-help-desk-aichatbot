import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, LogOut, Headphones, Wallet, Briefcase, GraduationCap,
  Plus, ArrowRight, ShieldCheck, Zap, ChevronRight, Activity,
  Database, Sun, Moon, LayoutGrid, Server, Globe, Cpu, Hash,
  Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility for cleaner tailwind classes ---
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Global Audio Context to prevent resource exhaustion
let globalAudioCtx;
const getAudioContext = () => {
  if (!globalAudioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      globalAudioCtx = new AudioContext();
    }
  }
  return globalAudioCtx;
};

// --- Audio FX Hook ---
// --- Audio FX Hook (Premium Glass/Modern UI Sounds) ---
const useAudioFx = () => {
  const playSound = useCallback((type) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Resume context if suspended
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'hover') {
      // Very faint, airy breath (subtle presence)
      // Skipped for this version as requested by prior context, mostly click focused.
    } else if (type === 'click') {
      // Soft "Pop" / Bubble Sound
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
      gain.gain.setValueAtTime(0.05, now); // Quiet
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'success') {
      // Gentle Major Chord Sweep (Glassy)
      osc.type = 'sine';
      // Create a chord by playing 3 fast arpeggios
      // We can't do polyphony easily with one osc, so we stick to a sweet sweep
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.3); // Octave up
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.1); // Swell
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6); // Long decay
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (type === 'error') {
      // Soft "Bump" (Rounder sound, no buzz)
      osc.type = 'triangle'; // Softer than sawtooth
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.15);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  }, []);

  return { playHover: () => playSound('hover'), playClick: () => playSound('click'), playSuccess: () => playSound('success'), playError: () => playSound('error') };
};



// --- Text Animation Component: Terminal Typewriter ---
const AnimatedText = ({ text, className = "", delay = 0, gradient = false }) => {
  const [display, setDisplay] = useState('');
  const [phase, setPhase] = useState('initial'); // initial, typing, pausing, deleting

  useEffect(() => {
    let timeout;

    if (phase === 'initial') {
      timeout = setTimeout(() => setPhase('typing'), delay * 1000);
    } else if (phase === 'typing') {
      if (display.length < text.length) {
        // Random typing speed variation for realism
        const speed = Math.random() * 50 + 50;
        timeout = setTimeout(() => {
          setDisplay(text.slice(0, display.length + 1));
        }, speed);
      } else {
        setPhase('pausing');
      }
    } else if (phase === 'pausing') {
      timeout = setTimeout(() => {
        setPhase('deleting');
      }, 2000); // Read time
    } else if (phase === 'deleting') {
      if (display.length > 0) {
        timeout = setTimeout(() => {
          setDisplay(text.slice(0, display.length - 1));
        }, 30); // Delete fast
      } else {
        timeout = setTimeout(() => setPhase('typing'), 500); // Brief pause before typing again
      }
    }

    return () => clearTimeout(timeout);
  }, [display, phase, text, delay]);

  return (
    <span className={cn(className, "inline-flex items-center")}>
      <span className={cn(gradient && "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600")}>
        {display}
      </span>
      <span className="w-[0.6em] h-[1em] bg-blue-500 animate-pulse ml-1 opacity-70" />
    </span>
  );
};

// --- 3D Tilt Card + Spotlight ---
const TiltCard = ({ children, className = "", onInteract }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
  const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-5deg", "5deg"]);

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    if (onInteract) onInteract();

    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const xPct = (clientX - left) / width - 0.5;
    const yPct = (clientY - top) / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "group relative border border-neutral-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 overflow-hidden rounded-xl perspective-1000",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition duration-300 z-30"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"])} ${useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"])},
              rgba(59, 130, 246, 0.15),
              transparent 80%
            )
          `
        }}
      />
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
  const [showPassword, setShowPassword] = useState(false); // New State
  const [error, setError] = useState('');

  // Audio Hooks
  const { playHover, playClick, playSuccess, playError } = useAudioFx();

  // HUD Data Simulation
  const [bootSequence, setBootSequence] = useState(0);
  const [networkTraffic, setNetworkTraffic] = useState([4, 7, 3, 8, 5, 9, 4, 6, 10]);

  // Global Click Listener for 'anywhere' sound
  useEffect(() => {
    const handleGlobalClick = () => {
      playClick();
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [playClick]);

  // Toggle Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Live Network Traffic Animation
  useEffect(() => {
    const interval = setInterval(() => {
      setNetworkTraffic(prev => prev.map(() => Math.floor(Math.random() * 10) + 2));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Boot Sequence Effect
  useEffect(() => {
    if (!isLoggedIn) {
      const interval = setInterval(() => {
        setBootSequence(prev => (prev < 100 ? prev + 1 : 100));
      }, 30);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const handleLogin = (e) => {
    e.preventDefault();
    // playClick(); // Handled by global listener now, but form submit specific logic handles errors

    if (!email.endsWith('@iilm.edu')) {
      playError();
      setError('Access Denied: Institutional Identity Required (@iilm.edu)');
      return;
    }
    if (password.length < 8 || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
      playError();
      setError('Security Alert: Weak Credentials Detected (Min 8 chars, Alphanumeric)');
      return;
    }

    setError('');
    setIsLoggingIn(true);
    setTimeout(() => {
      playSuccess();
      setIsLoggedIn(true);
      setIsLoggingIn(false);
    }, 1500);
  };

  const categories = [
    { id: 'finance', title: 'Finance AI', icon: <Wallet className="w-5 h-5" />, desc: 'Real-time market logic & fiscal modeling.', status: 'Operational', latency: '12ms', size: 'col-span-1 md:col-span-2' },
    { id: 'cs', title: 'Support Agent', icon: <Headphones className="w-5 h-5" />, desc: 'Automated CX resolutions.', status: 'Active', latency: '8ms', size: 'col-span-1' },
    { id: 'mgmt', title: 'Operations', icon: <Briefcase className="w-5 h-5" />, desc: 'Resource orchestration.', status: 'Standby', latency: '14ms', size: 'col-span-1' },
    { id: 'student', title: 'Academic Support', icon: <GraduationCap className="w-5 h-5" />, desc: 'Student success pathways.', status: 'Active', latency: '9ms', size: 'col-span-1 md:col-span-2' },
  ];

  if (!isLoggedIn) {
    return (
      <div className="relative min-h-screen bg-gray-50 dark:bg-[#020202] text-gray-900 dark:text-[#ededed] flex items-center justify-center font-sans overflow-hidden transition-colors duration-500">

        {/* Toggle Theme Absolute */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent double click sound from global listener
            playClick();
            setIsDarkMode(!isDarkMode);
          }}
          className="absolute top-6 right-6 z-50 p-3 rounded-full bg-white/10 backdrop-blur-md border border-black/5 dark:border-white/10 hover:scale-110 transition-transform shadow-lg"
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-blue-600" />}
        </button>

        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
          <motion.div
            animate={{
              background: isDarkMode
                ? [
                  "radial-gradient(circle at 0% 0%, #1d4ed810 0%, transparent 50%)",
                  "radial-gradient(circle at 100% 100%, #1d4ed810 0%, transparent 50%)",
                  "radial-gradient(circle at 0% 0%, #1d4ed810 0%, transparent 50%)"
                ]
                : [
                  "radial-gradient(circle at 0% 0%, #3b82f610 0%, transparent 50%)",
                  "radial-gradient(circle at 100% 100%, #3b82f610 0%, transparent 50%)",
                  "radial-gradient(circle at 0% 0%, #3b82f610 0%, transparent 50%)"
                ]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-[1200px] h-auto lg:min-h-[700px] grid grid-cols-1 lg:grid-cols-12 border border-black/5 dark:border-white/5 rounded-[32px] overflow-hidden shadow-2xl bg-white/80 dark:bg-[#080808]/80 backdrop-blur-2xl relative z-10 m-4"
        >
          {/* Left Panel: Cinematic Intro */}
          <div className="hidden lg:flex lg:col-span-7 flex-col justify-between p-16 relative border-r border-black/5 dark:border-white/5">
            <div className="relative z-10">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-4 mb-20"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="h-8 w-px bg-black/10 dark:bg-white/10" />
                <span className="font-bold tracking-tight text-2xl dark:text-white text-gray-900">IILM.HELP</span>
              </motion.div>

              <div className="space-y-8">
                <div className="text-6xl font-medium tracking-tighter leading-[1.1] dark:text-white text-gray-900">
                  <AnimatedText text="Intelligent" delay={0.4} /> <br />
                  <span className="font-serif italic text-blue-600">Workspace</span>
                </div>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="dark:text-gray-400 text-gray-600 text-lg leading-relaxed max-w-md"
                >
                  <AnimatedText text="Unified AI command center for institutional management." delay={0.8} />
                </motion.p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="grid grid-cols-2 gap-12"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold dark:text-gray-500 text-gray-400 uppercase tracking-widest">
                  <Activity className="w-3 h-3 text-blue-500" /> System Core
                </div>
                <div className="w-full h-1 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: `${bootSequence}%` }}
                    className="h-full bg-blue-600"
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono dark:text-gray-400 text-gray-500">
                  <span>INDUSTRIAL_KERNEL_v2</span>
                  <span>{bootSequence}%</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-bold dark:text-gray-500 text-gray-400 uppercase tracking-widest">
                  <Database className="w-3 h-3 text-emerald-500" /> Gateway
                </div>
                <div className="text-sm font-mono dark:text-gray-300 text-gray-700">SECURE_GATEWAY_AUTH</div>
                <div className="text-[10px] text-emerald-600 font-bold tracking-tighter uppercase">Encrypted_Link</div>
              </div>
            </motion.div>
          </div>

          {/* Right Panel: Login */}
          <div className="lg:col-span-5 flex flex-col justify-center p-8 md:p-16 bg-gradient-to-b from-white dark:from-white/[0.02] to-transparent">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="max-w-sm mx-auto w-full"
            >
              <div className="mb-10 text-center lg:text-left">
                <h1 className="text-3xl font-semibold dark:text-white text-gray-900 tracking-tight mb-3">
                  <AnimatedText text="Initialize Portal" delay={0.6} />
                </h1>
                <p className="dark:text-gray-500 text-gray-600 text-sm">Enter institutional credentials to connect.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-4">
                  <div className="group">
                    <input
                      type="email"
                      placeholder="Institutional ID (admin@iilm.edu)"
                      className="w-full bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl h-14 px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all dark:placeholder:text-gray-700 placeholder:text-gray-400 dark:text-white text-gray-900"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="group relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Security Key"
                      className="w-full bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl h-14 px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all dark:placeholder:text-gray-700 placeholder:text-gray-400 dark:text-white text-gray-900 pr-12"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // prevent double click sound
                        playClick();
                        setShowPassword(!showPassword);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-600 dark:text-red-400 text-xs font-bold bg-red-100 dark:bg-red-900/20 p-3 rounded-lg flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" /> {error}
                  </motion.div>
                )}

                <button
                  type="submit"
                  onClick={(e) => {
                    e.stopPropagation();
                    playClick();
                  }}
                  disabled={isLoggingIn}
                  className="relative w-full h-14 bg-gray-900 dark:bg-white text-white dark:text-black font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white transition-all overflow-hidden flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoggingIn ? (
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 animate-spin" /> Verifying...
                    </div>
                  ) : (
                    <>Establish Connection <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-white/10 flex items-center justify-between opacity-60 hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">External Gateways</span>
                <div className="flex gap-4">
                  <ShieldCheck className="w-4 h-4 text-gray-500 hover:text-blue-500 cursor-pointer transition-colors" />
                  <Globe className="w-4 h-4 text-gray-500 hover:text-blue-500 cursor-pointer transition-colors" />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  // LOGGED IN VIEW
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-[#e5e5e5] font-sans transition-colors duration-500">

      {/* Navbar */}
      <nav className="sticky top-0 w-full z-40 bg-white/80 dark:bg-black/60 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 px-6 lg:px-8 h-16 flex items-center justify-between transition-colors duration-500">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <span className="font-bold tracking-tight text-lg">IILM.HELP</span>
          </div>
          <div className="h-4 w-px bg-gray-300 dark:bg-white/10" />
          <div className="hidden md:flex items-center gap-6 text-[11px] font-bold uppercase tracking-widest text-gray-500">
            <span className="dark:text-white text-gray-900 cursor-pointer hover:text-blue-500 transition-colors">Directory</span>
            <span className="hover:text-blue-500 cursor-pointer transition-colors">Automations</span>
            <span className="hover:text-blue-500 cursor-pointer transition-colors">Analytics</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              playClick();
              setIsDarkMode(!isDarkMode);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-blue-600" />}
          </button>

          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Status: Connected</span>
            <span className="text-[9px] text-emerald-600 font-mono">NODE_LHR_002_ACTIVE</span>
          </div>

          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-[2px] cursor-pointer hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-full bg-white dark:bg-black p-0.5">
              <img src="https://api.dicebear.com/7.x/notionists/svg?seed=user" alt="User" className="w-full h-full rounded-full bg-gray-100" />
            </div>
          </div>

          <button onClick={(e) => {
            e.stopPropagation();
            playClick();
            setIsLoggedIn(false);
          }} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-12 pb-12 px-6 lg:px-12 max-w-[1600px] mx-auto">
        <div className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="h-px w-8 bg-blue-600" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-600">Internal Agent Directory</span>
            </div>
            <h1 className="text-5xl font-light tracking-tighter dark:text-white text-gray-900 mb-6">
              <AnimatedText text="AI ChaTbOT at your help" delay={0.2} />
            </h1>
            <p className="dark:text-gray-400 text-gray-600 leading-relaxed text-sm lg:text-base font-medium border-l-2 border-blue-600/30 pl-6">
              Access specialized institutional modules designed for deep management and student support workflow automation.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative group min-w-[340px]"
          >
            <div className="relative flex items-center bg-white dark:bg-[#0d0d0d] border border-gray-200 dark:border-white/10 rounded-xl px-4 h-14 group-focus-within:border-blue-500/50 group-focus-within:ring-2 group-focus-within:ring-blue-500/10 transition-all shadow-sm">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Query directory... (CMD + K)"
                className="bg-transparent border-none outline-none ml-4 w-full text-sm font-medium dark:placeholder:text-gray-700 placeholder:text-gray-400 dark:text-white text-gray-900"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <kbd className="hidden lg:inline-flex bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2 py-1 rounded text-[10px] text-gray-500 font-mono">ΓîÿK</kbd>
            </div>
          </motion.div>
        </div>

        {/* Categories Grid (Interactive) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {categories.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())).map((cat, idx) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={cat.size}
              >
                <TiltCard
                  className="h-full hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
                >
                  <div className="p-8 h-full flex flex-col relative z-20">
                    <div className="flex items-start justify-between mb-8">
                      <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                        {cat.icon}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`flex items-center gap-2 px-2 py-1 rounded-full border ${cat.status === 'Active' || cat.status === 'Operational' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-orange-500/10 border-orange-500/20 text-orange-600'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${cat.status === 'Active' || cat.status === 'Operational' ? 'bg-emerald-500 animate-pulse' : 'bg-orange-500'}`} />
                          <span className="text-[10px] font-bold uppercase tracking-wide">{cat.status}</span>
                        </div>
                        <span className="font-mono text-[10px] text-gray-400">LATENCY: {cat.latency}</span>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <h3 className="text-xl font-bold dark:text-white text-gray-900 group-hover:text-blue-600 transition-colors mb-2">{cat.title}</h3>
                      <p className="text-sm dark:text-gray-400 text-gray-500 leading-relaxed mb-6">{cat.desc}</p>

                      <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/5 pt-6">
                        <span className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">v2.4.0</span>
                        <button className="flex items-center gap-2 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                          Initialize <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Visualization Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="md:col-span-1 lg:col-span-2 relative overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] p-8 flex flex-col justify-between"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent animate-pulse" />

            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Server className="w-5 h-5 text-blue-500" />
                  <span className="text-xs font-bold uppercase tracking-widest dark:text-gray-400 text-gray-500">Live Traffic Monitor</span>
                </div>
                <div className="flex items-end gap-1 h-12">
                  {networkTraffic.map((h, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: `${h * 10}%` }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="w-2 bg-blue-500/30 rounded-t-sm"
                    />
                  ))}
                </div>
              </div>

              <div className="text-right">
                <div className="text-4xl font-light dark:text-white text-gray-900 font-mono tracking-tighter">LHR_01</div>
                <div className="text-xs font-bold text-emerald-500 mt-1">SYSTEM OPTIMAL</div>
              </div>
            </div>
          </motion.div>

        </div>
      </main>

      <footer className="mt-20 py-12 border-t border-gray-200 dark:border-white/5 dark:bg-[#080808] bg-gray-50 transition-colors duration-500">
        <div className="max-w-[1600px] mx-auto px-12 flex flex-col md:flex-row justify-between items-center gap-6 opacity-50 hover:opacity-100 transition-opacity">
          <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest dark:text-gray-500 text-gray-600">
            <span className="cursor-pointer hover:text-blue-500">System Orchestration Layer</span>
            <span className="cursor-pointer hover:text-blue-500">Secure Identity Provider</span>
          </div>
          <p className="text-[10px] font-mono dark:text-gray-600 text-gray-500">
            BUILD_ID: 99x_IILM_STATIC_v2 | EDGE_LHR_1
          </p>
        </div>
      </footer>

    </div>
  );
};

export default App;
