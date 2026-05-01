import { useApp } from '../context/AppContext';

export default function Header() {
  const { isActivated, nodeId, setShowApiModal } = useApp();

  return (
    <header className="sticky top-0 z-40 glass border-b border-white/6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent-blue flex items-center justify-center shadow-glow-blue">
            <span className="text-sm">⚡</span>
          </div>
          <div>
            <span className="text-white font-bold text-sm tracking-tight">IILM</span>
            <span className="text-accent-blue font-bold text-sm tracking-tight">.HELP</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 ml-3 px-2 py-0.5 rounded bg-white/4 border border-white/6">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-slow" />
            <span className="text-xs text-white/40 font-mono">v2.4.0</span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isActivated ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-400/8 border border-green-400/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-slow" />
              <span className="text-xs font-mono text-green-400 hidden sm:block">STATUS: CONNECTED</span>
              <span className="text-xs font-mono text-white/30 hidden md:block">·</span>
              <span className="text-xs font-mono text-white/30 hidden md:block">{nodeId}</span>
            </div>
          ) : (
            <button
              onClick={() => setShowApiModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-blue/15 border border-accent-blue/30
                text-accent-blue text-xs font-medium hover:bg-accent-blue/25 transition-all duration-200"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse-slow" />
              Activate Key
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
