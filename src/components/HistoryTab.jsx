import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { AGENTS } from '../constants/agents';

export default function HistoryTab() {
  const { getAllHistory, clearHistory, openAgent } = useApp();
  const [, forceUpdate] = useState(0);
  const refresh = useCallback(() => forceUpdate(n => n + 1), []);

  const history = getAllHistory();
  const hasHistory = Object.keys(history).length > 0;

  const handleClear = () => {
    clearHistory();
    refresh();
  };

  const handleOpen = (agentId) => {
    const agent = AGENTS.find(a => a.id === agentId);
    if (agent) openAgent(agent);
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">History</h2>
          <p className="text-xs text-white/35 mt-0.5">
            Session-based conversation log — clears when tab closes
          </p>
        </div>
        {hasHistory && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20
              text-red-400 text-xs font-medium hover:bg-red-500/20 transition-all duration-200"
          >
            🗑 Clear History
          </button>
        )}
      </div>

      {/* Empty state */}
      {!hasHistory ? (
        <div className="rounded-2xl bg-[#111118] border border-white/6 p-12 text-center">
          <div className="text-4xl mb-3 opacity-30">💬</div>
          <p className="text-sm text-white/30 font-medium">No conversations yet</p>
          <p className="text-xs text-white/20 mt-1">
            Initialize any agent to start chatting — history will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(history).map(([agentId, messages]) => {
            const agent = AGENTS.find(a => a.id === agentId);
            if (!agent) return null;
            const userMessages = messages.filter(m => m.role === 'user');
            if (userMessages.length === 0) return null;

            return (
              <div key={agentId} className="rounded-2xl bg-[#111118] border border-white/6 overflow-hidden animate-fade-in">
                {/* Agent header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{agent.icon}</span>
                    <span className="text-sm font-semibold text-white">{agent.name}</span>
                    <span className="text-xs font-mono text-white/25">
                      {userMessages.length} message{userMessages.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => handleOpen(agentId)}
                    className="text-xs text-accent-blue hover:text-white transition-colors font-medium"
                  >
                    Resume →
                  </button>
                </div>

                {/* Message previews */}
                <div className="divide-y divide-white/4">
                  {userMessages.slice(0, 4).map((msg, i) => (
                    <button
                      key={i}
                      onClick={() => handleOpen(agentId)}
                      className="w-full flex items-start gap-3 px-5 py-3 text-left hover:bg-white/3 transition-colors group"
                    >
                      <div className="w-5 h-5 rounded-full bg-accent-blue/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs text-accent-blue">U</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/55 truncate group-hover:text-white/75 transition-colors">
                          {msg.content}
                        </p>
                        {msg.timestamp && (
                          <p className="text-xs text-white/20 font-mono mt-0.5">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                  {userMessages.length > 4 && (
                    <div className="px-5 py-2 text-xs text-white/20 text-center">
                      +{userMessages.length - 4} more messages
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
