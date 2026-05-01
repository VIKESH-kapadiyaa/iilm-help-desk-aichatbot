import { AGENTS, STATUS_CONFIG } from '../constants/agents';
import { useApp } from '../context/AppContext';

function AgentCard({ agent, index }) {
  const { openAgent } = useApp();
  const status = STATUS_CONFIG[agent.status];

  return (
    <div
      className="group relative rounded-2xl bg-[#111118] border border-white/6 p-5 flex flex-col gap-4
        hover:border-white/14 hover:bg-[#14141e] transition-all duration-300 cursor-default
        animate-fade-in shadow-card overflow-hidden"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Subtle top glow line */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-accent-blue/30 to-transparent
        opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-xl
            group-hover:border-accent-blue/30 group-hover:bg-accent-blue/8 transition-all duration-300 flex-shrink-0">
            {agent.icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white leading-tight">{agent.name}</h3>
            <div className={`flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full w-fit ${status.bg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot} animate-pulse-slow`} />
              <span className={`text-xs font-mono font-medium ${status.color}`}>{status.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-white/45 leading-relaxed flex-1">
        {agent.description}
      </p>

      {/* Meta row */}
      <div className="flex items-center justify-between text-xs font-mono text-white/25 border-t border-white/5 pt-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="text-green-400/60">◆</span>
            <span>{agent.latency}</span>
          </span>
          <span>{agent.version}</span>
        </div>
        <div className="flex items-center gap-1 text-white/15">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-blue/40" />
          <span className="w-1.5 h-1.5 rounded-full bg-accent-blue/60" />
          <span className="w-1.5 h-1.5 rounded-full bg-accent-blue/80" />
        </div>
      </div>

      {/* Initialize button */}
      <button
        onClick={() => openAgent(agent)}
        className="w-full py-2.5 rounded-xl bg-accent-blue/12 border border-accent-blue/25 text-accent-blue text-xs
          font-semibold tracking-wide hover:bg-accent-blue hover:text-white hover:border-accent-blue
          transition-all duration-200 group-hover:shadow-glow-blue active:scale-95"
      >
        Initialize &rsaquo;
      </button>
    </div>
  );
}

export default function DirectoryTab() {
  return (
    <div className="animate-fade-in">
      {/* Section header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Agent Directory</h2>
          <p className="text-xs text-white/35 mt-0.5">
            {AGENTS.length} agents available · Select one to initialize a session
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/4 border border-white/6">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-slow" />
          <span className="text-xs font-mono text-white/40">LIVE</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {AGENTS.map((agent, i) => (
          <AgentCard key={agent.id} agent={agent} index={i} />
        ))}
      </div>
    </div>
  );
}
