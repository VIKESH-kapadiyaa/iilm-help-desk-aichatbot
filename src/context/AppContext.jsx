import { createContext, useContext, useState, useCallback } from 'react';
import { PROVIDER_CONFIG } from '../constants/agents';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // API key state
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem('iilm_api_key') || '');
  const [provider, setProvider] = useState(() => sessionStorage.getItem('iilm_provider') || 'groq');
  const [isActivated, setIsActivated] = useState(() => !!sessionStorage.getItem('iilm_api_key'));

  // UI state
  const [activeTab, setActiveTab] = useState('directory');
  const [activeAgent, setActiveAgent] = useState(null); // agent object when chat is open
  const [showApiModal, setShowApiModal] = useState(false);
  const [pendingAgent, setPendingAgent] = useState(null); // agent to open after key entry

  // Node ID (random, stable per session)
  const [nodeId] = useState(() => {
    const stored = sessionStorage.getItem('iilm_node_id');
    if (stored) return stored;
    const id = 'NODE-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    sessionStorage.setItem('iilm_node_id', id);
    return id;
  });

  // Activate API key
  const activateKey = useCallback((key, prov) => {
    sessionStorage.setItem('iilm_api_key', key);
    sessionStorage.setItem('iilm_provider', prov);
    setApiKey(key);
    setProvider(prov);
    setIsActivated(true);
  }, []);

  // Open a chatbot (gate behind API key modal if needed)
  const openAgent = useCallback((agent) => {
    if (!isActivated) {
      setPendingAgent(agent);
      setShowApiModal(true);
    } else {
      setActiveAgent(agent);
    }
  }, [isActivated]);

  // Called after successful key activation
  const handleKeyActivated = useCallback((key, prov) => {
    activateKey(key, prov);
    setShowApiModal(false);
    if (pendingAgent) {
      setActiveAgent(pendingAgent);
      setPendingAgent(null);
    }
  }, [activateKey, pendingAgent]);

  const closeChat = useCallback(() => setActiveAgent(null), []);

  // Session history helpers
  const saveMessage = useCallback((agentId, message) => {
    const key = `history_${agentId}`;
    const existing = JSON.parse(sessionStorage.getItem(key) || '[]');
    existing.push(message);
    sessionStorage.setItem(key, JSON.stringify(existing));
  }, []);

  const getHistory = useCallback((agentId) => {
    return JSON.parse(sessionStorage.getItem(`history_${agentId}`) || '[]');
  }, []);

  const getAllHistory = useCallback(() => {
    const result = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith('history_')) {
        const agentId = k.replace('history_', '');
        const msgs = JSON.parse(sessionStorage.getItem(k) || '[]');
        if (msgs.length > 0) result[agentId] = msgs;
      }
    }
    return result;
  }, []);

  const clearHistory = useCallback(() => {
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith('history_')) keysToRemove.push(k);
    }
    keysToRemove.forEach(k => sessionStorage.removeItem(k));
  }, []);

  // Send message to AI
  const sendMessage = useCallback(async (agent, messages) => {
    const cfg = PROVIDER_CONFIG[provider];
    if (!cfg) throw new Error('Unknown provider');

    if (cfg.type === 'openai-compat') {
      const res = await fetch(cfg.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: cfg.model,
          messages: [
            { role: 'system', content: agent.systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content })),
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      return data.choices[0].message.content;
    }

    if (cfg.type === 'gemini') {
      // Build Gemini conversation history
      const geminiContents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const res = await fetch(`${cfg.url}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: agent.systemPrompt }] },
          contents: geminiContents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received.';
    }

    throw new Error('Unsupported provider type');
  }, [apiKey, provider]);

  return (
    <AppContext.Provider value={{
      apiKey, provider, isActivated,
      activeTab, setActiveTab,
      activeAgent, openAgent, closeChat,
      showApiModal, setShowApiModal,
      pendingAgent,
      nodeId,
      handleKeyActivated,
      saveMessage, getHistory, getAllHistory, clearHistory,
      sendMessage,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
