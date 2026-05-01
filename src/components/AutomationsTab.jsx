import { AGENTS, STATUS_CONFIG } from '../constants/agents';
import { useApp } from '../context/AppContext';

export default function AutomationsTab() {
  const { openAgent } = useApp();

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Automations</h2>
        <p className="text-xs text-white/35 mt-0.5">
          Quick-launch any agent directly from this panel
        </p>
      </div>

      {/* Agent list */}
      <div className="rounded-2xl bg-[#111118] border border-white/6 overflow-hidden divide-y divide-white/5">
        {AGENTS.map((agent, i) => {
          const status = STATUS_CONFIG[agent.status];
          return (
            <button
              key={agent.id}
              onClick={() => openAgent(agent)}
              className="w-full flex items-center gap-4 px-5 py-4 text-left
                hover:bg-white/4 transition-all duration-200 group animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Index */}
              <span className="text-xs font-mono text-white/15 w-4 text-right flex-shrink-0">
                {String(i + 1).padStart(2, '0')}
              </span>

              {/* Icon */}
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-base
                group-hover:border-accent-blue/30 group-hover:bg-accent-blue/8 transition-all duration-200 flex-shrink-0">
                {agent.icon}
              </div>

              {/* Name + description */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/85 group-hover:text-white transition-colors">
                  {agent.name}
                </p>
                <p className="text-xs text-white/30 truncate mt-0.5">{agent.description}</p>
              </div>

              {/* Status dot */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${status.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                  <span className={`text-xs font-mono ${status.color} hidden sm:block`}>{status.label}</span>
                </div>
              </div>

              {/* Arrow */}
              <span className="text-white/20 group-hover:text-accent-blue group-hover:translate-x-1
                transition-all duration-200 flex-shrink-0 text-sm">
                →
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-xs text-white/20 text-center mt-4">
        All agents require an active API key session to operate
      </p>
    </div>
  );
}
