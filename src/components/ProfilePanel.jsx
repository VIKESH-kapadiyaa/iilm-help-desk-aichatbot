import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, User, Key, Activity, Settings, Info, AlertTriangle, 
  Edit3, Check, Trash2, LogOut, Sun, Moon, ShieldCheck 
} from 'lucide-react';
import { AGENTS } from '../constants/agents';

const ProfilePanel = ({ 
  isOpen, 
  onClose, 
  apiKey, 
  provider, 
  onChangeKey, 
  onRevokeKey, 
  isDarkMode, 
  toggleDarkMode,
  onResetSession
}) => {
  const [activeTab, setActiveTab] = useState('user');
  const [isEditing, setIsEditing] = useState(false);
  
  // User Profile State
  const [profile, setProfile] = useState(() => {
    const saved = sessionStorage.getItem('iilm_user_profile');
    return saved ? JSON.parse(saved) : {
      name: 'Admin User',
      email: 'admin@iilm.edu',
      role: 'Administrator',
      id: 'IILM-EMP-001'
    };
  });

  // Preferences State
  const [prefs, setPrefs] = useState(() => {
    const saved = sessionStorage.getItem('iilm_preferences');
    return saved ? JSON.parse(saved) : {
      typingIndicator: true,
      saveHistory: true,
      language: 'en'
    };
  });

  // Stats State
  const [stats, setStats] = useState({ totalChats: 0, mostUsed: 'N/A', totalMsgs: 0, startTime: '' });

  useEffect(() => {
    if (isOpen) {
      sessionStorage.setItem('iilm_user_profile', JSON.stringify(profile));
    }
  }, [profile, isOpen]);

  useEffect(() => {
    if (isOpen) {
      sessionStorage.setItem('iilm_preferences', JSON.stringify(prefs));
    }
  }, [prefs, isOpen]);

  useEffect(() => {
    if (isOpen) {
      let totalMsgs = 0;
      let activeChats = 0;
      let agentCounts = {};

      AGENTS.forEach(agent => {
        const history = JSON.parse(sessionStorage.getItem(`history_${agent.id}`) || '[]');
        if (history.length > 0) {
          activeChats++;
          totalMsgs += history.length;
          agentCounts[agent.name] = history.length;
        }
      });

      let mostUsed = 'None';
      let maxCount = 0;
      for (const [name, count] of Object.entries(agentCounts)) {
        if (count > maxCount) {
          maxCount = count;
          mostUsed = `${name} (${count})`;
        }
      }

      let startTime = sessionStorage.getItem('iilm_session_start');
      if (!startTime) {
        startTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        sessionStorage.setItem('iilm_session_start', startTime);
      }

      setStats({ totalChats: activeChats, mostUsed, totalMsgs, startTime });
    }
  }, [isOpen]);

  const handleSaveProfile = () => {
    setIsEditing(false);
    sessionStorage.setItem('iilm_user_profile', JSON.stringify(profile));
  };

  const handleReset = () => {
    if (window.confirm("Are you sure? This will end your session and wipe all data.")) {
      onResetSession();
    }
  };

  const maskKey = (k) => {
    if (!k) return 'Not Configured';
    if (k.length <= 8) return '****';
    return `${k.substring(0, 4)}••••••••••••${k.substring(k.length - 4)}`;
  };

  const TABS = [
    { id: 'user', icon: <User className="w-4 h-4" />, label: 'Profile' },
    { id: 'security', icon: <Key className="w-4 h-4" />, label: 'Security' },
    { id: 'stats', icon: <Activity className="w-4 h-4" />, label: 'Stats' },
    { id: 'prefs', icon: <Settings className="w-4 h-4" />, label: 'Prefs' },
    { id: 'about', icon: <Info className="w-4 h-4" />, label: 'About' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-[#080808] border-l border-gray-200 dark:border-white/10 shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-500" /> System Settings
              </h2>
              <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Profile Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                    <User className="w-3 h-3" /> Identity Profile
                  </h3>
                  <button onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)} className="text-[10px] uppercase font-bold tracking-widest text-blue-500 hover:text-blue-400 flex items-center gap-1">
                    {isEditing ? <><Check className="w-3 h-3"/> Save</> : <><Edit3 className="w-3 h-3"/> Edit</>}
                  </button>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 p-[2px]">
                    <div className="w-full h-full rounded-2xl bg-white dark:bg-[#111] flex items-center justify-center text-xl font-bold text-gray-900 dark:text-white overflow-hidden">
                      {profile.name.substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    {isEditing ? (
                      <>
                        <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500" placeholder="Full Name" />
                        <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500" placeholder="Email" />
                      </>
                    ) : (
                      <>
                        <div className="font-bold text-gray-900 dark:text-white text-lg leading-none">{profile.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 leading-none">{profile.email}</div>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-gray-100 dark:border-white/5">
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Role</div>
                    {isEditing ? <input type="text" value={profile.role} onChange={e => setProfile({...profile, role: e.target.value})} className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 text-sm text-gray-900 dark:text-white outline-none" /> : <div className="text-sm text-gray-900 dark:text-white font-medium">{profile.role}</div>}
                  </div>
                  <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-gray-100 dark:border-white/5">
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">ID Number</div>
                    {isEditing ? <input type="text" value={profile.id} onChange={e => setProfile({...profile, id: e.target.value})} className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 text-sm text-gray-900 dark:text-white outline-none" /> : <div className="text-sm text-gray-900 dark:text-white font-medium font-mono">{profile.id}</div>}
                  </div>
                </div>
              </section>

              <hr className="border-gray-200 dark:border-white/5" />

              {/* API Key Manager */}
              <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                  <Key className="w-3 h-3" /> Security & Gateway
                </h3>
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Active Provider</div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white capitalize flex items-center gap-2">
                        {provider || 'None'} {provider && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Authorization Key</div>
                    <div className="text-sm font-mono text-gray-900 dark:text-white bg-gray-200 dark:bg-black/50 p-2 rounded-lg break-all">
                      {maskKey(apiKey)}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={onChangeKey} className="flex-1 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors">
                      Change Key
                    </button>
                    {apiKey && (
                      <button onClick={onRevokeKey} className="flex-1 py-2 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors">
                        Revoke Key
                      </button>
                    )}
                  </div>
                </div>
              </section>

              <hr className="border-gray-200 dark:border-white/5" />

              {/* Session Stats */}
              <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                  <Activity className="w-3 h-3" /> Session Telemetry
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/5">
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Total Chats</div>
                    <div className="text-2xl font-light text-gray-900 dark:text-white">{stats.totalChats}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/5">
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Messages Sent</div>
                    <div className="text-2xl font-light text-gray-900 dark:text-white">{stats.totalMsgs}</div>
                  </div>
                  <div className="col-span-2 bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/5 flex justify-between items-center">
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Most Used Agent</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{stats.mostUsed}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Session Start</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white font-mono">{stats.startTime}</div>
                    </div>
                  </div>
                </div>
              </section>

              <hr className="border-gray-200 dark:border-white/5" />

              {/* Preferences */}
              <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                  <Settings className="w-3 h-3" /> Preferences
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-gray-100 dark:border-white/5">
                    <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">Dark Mode</div>
                    <button onClick={toggleDarkMode} className={`w-12 h-6 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'} relative`}>
                      <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm flex items-center justify-center">
                        {isDarkMode ? <Moon className="w-2.5 h-2.5 text-blue-600" /> : <Sun className="w-2.5 h-2.5 text-yellow-500" />}
                      </motion.div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-gray-100 dark:border-white/5">
                    <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">Typing Indicator</div>
                    <button onClick={() => setPrefs({...prefs, typingIndicator: !prefs.typingIndicator})} className={`w-12 h-6 rounded-full p-1 transition-colors ${prefs.typingIndicator ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'} relative`}>
                      <motion.div layout animate={{ x: prefs.typingIndicator ? 24 : 0 }} className="w-4 h-4 bg-white rounded-full shadow-sm" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-gray-100 dark:border-white/5">
                    <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">Persist History</div>
                    <button onClick={() => setPrefs({...prefs, saveHistory: !prefs.saveHistory})} className={`w-12 h-6 rounded-full p-1 transition-colors ${prefs.saveHistory ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'} relative`}>
                      <motion.div layout animate={{ x: prefs.saveHistory ? 24 : 0 }} className="w-4 h-4 bg-white rounded-full shadow-sm" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-gray-100 dark:border-white/5">
                    <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">Interface Language</div>
                    <select value={prefs.language} onChange={e => setPrefs({...prefs, language: e.target.value})} className="bg-transparent border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1 text-sm text-gray-900 dark:text-white outline-none cursor-pointer">
                      <option value="en" className="dark:bg-[#111]">English</option>
                      <option value="hi" className="dark:bg-[#111]">Hindi</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* About IILM */}
              <section className="bg-gray-50 dark:bg-white/5 rounded-xl p-6 border border-gray-100 dark:border-white/5 text-center space-y-2">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <span className="text-white font-black text-xl tracking-tighter">IILM</span>
                  </div>
                </div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">IILM University, Gurugram</div>
                <div className="text-xs text-gray-500">Established 1993 | Greater Noida, UP, India</div>
                <div className="text-xs text-blue-500 hover:underline cursor-pointer">iilm.edu.in</div>
                <div className="text-xs text-gray-500 pt-2">info@iilm.edu.in | +91-XXXXXXXXXX</div>
                <div className="text-[10px] font-mono text-gray-400 mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                  IILM.HELP Platform v2.4.0
                </div>
              </section>

            </div>

            {/* Footer / Danger Zone */}
            <div className="p-6 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/2">
              <button onClick={handleReset} className="w-full py-3 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 font-bold text-sm uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Clear All Session Data
              </button>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProfilePanel;
