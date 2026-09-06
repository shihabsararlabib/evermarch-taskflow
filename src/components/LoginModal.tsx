'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { getAvatarColor, getInitials } from '@/lib/utils';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { currentUser, technicians, login, switchUser } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [adminPromptUserId, setAdminPromptUserId] = useState<string | null>(null);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminPromptError, setAdminPromptError] = useState('');

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim()) {
      setError('Please enter your technician username.');
      return;
    }
    const res = login(username, password);
    if (res.success) {
      onClose();
    } else {
      setError(res.message || 'Technician ID not found.');
    }
  };

  const handleQuickSwitch = (tech: typeof technicians[0]) => {
    setError('');
    if (tech.role === 'admin') {
      setAdminPromptUserId(tech.id);
      setAdminPasswordInput('');
      setAdminPromptError('');
      return;
    }
    const res = switchUser(tech.id);
    if (res.success) {
      onClose();
    } else {
      setError(res.message || 'Switching failed.');
    }
  };

  const handleAuthorizeAdmin = () => {
    if (!adminPromptUserId) return;
    const res = switchUser(adminPromptUserId, adminPasswordInput);
    if (res.success) {
      setAdminPromptUserId(null);
      setAdminPasswordInput('');
      setAdminPromptError('');
      onClose();
    } else {
      setAdminPromptError(res.message || 'Incorrect supervisor password.');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 dark:bg-black/90 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className="relative w-full max-w-md bg-[var(--card-bg)] border border-[var(--card-border)] p-5 z-10 shadow-xl rounded-md overflow-hidden"
          role="dialog"
          aria-label="Technician Login"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[var(--card-border)] pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-sm bg-slate-900 dark:bg-white text-white dark:text-black font-mono font-bold text-xs flex items-center justify-center border border-slate-700 dark:border-neutral-700">
                EB
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white font-sans tracking-tight">
                  Station Sign-In // Floor Terminal
                </h2>
                <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">
                  Evermarch Bangladesh Workshop
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded border border-[var(--card-border)] flex items-center justify-center text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-mono transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Active Profile Banner */}
          {currentUser && (
            <div className="mb-4 p-2.5 rounded-md border border-[var(--card-border)] bg-[var(--card-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-sm flex items-center justify-center font-mono text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: getAvatarColor(currentUser.name) }}
                >
                  {getInitials(currentUser.name)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {currentUser.name}
                    </span>
                    <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] text-[var(--text-muted)] uppercase tracking-wider">
                      {currentUser.role || 'technician'}
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-slate-500 uppercase">
                    {currentUser.specialization || 'Service Technician'}
                  </p>
                </div>
              </div>
              <span className="font-mono text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                [LOGGED IN]
              </span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleManualLogin} className="space-y-3 mb-4">
            <div>
              <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Technician ID / Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. tarek, hasan, admin"
                className="workshop-input w-full px-2.5 py-1.5 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Password / Passcode
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="workshop-input w-full px-2.5 py-1.5 text-xs font-mono"
              />
            </div>

            {error && (
              <div className="p-2 rounded-md border border-red-300 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 font-mono text-[11px] text-red-700 dark:text-red-300">
                [ERR]: {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-mono text-xs uppercase tracking-wider font-semibold transition-colors shadow-2xs"
            >
              Sign In to Workshop
            </button>
          </form>

          {/* Quick Roster Switcher for Workshop Floor */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                Fast Station Profile Switch
              </span>
              <div className="flex-1 h-px bg-[var(--card-border)]" />
            </div>

            {/* Admin Password Prompt Dialog */}
            {adminPromptUserId && (
              <div className="mb-3 p-3 rounded-md border border-amber-400 dark:border-amber-700/80 bg-amber-50 dark:bg-amber-950/30">
                <div className="flex items-center gap-1.5 mb-1 text-amber-900 dark:text-amber-200 font-mono text-xs font-bold">
                  <span>🔒 Supervisor Passcode Required</span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 mb-2">
                  Elevating to Workshop Supervisor requires authorization.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    placeholder="Enter admin password..."
                    className="workshop-input flex-1 px-2.5 py-1 text-xs font-mono"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAuthorizeAdmin();
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAuthorizeAdmin}
                    className="px-3 py-1 bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white rounded font-mono text-xs font-semibold cursor-pointer"
                  >
                    Unlock
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminPromptUserId(null);
                      setAdminPasswordInput('');
                      setAdminPromptError('');
                    }}
                    className="px-2 py-1 workshop-plate text-xs font-mono cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                {adminPromptError && (
                  <p className="text-red-600 dark:text-red-400 font-mono text-[11px] mt-1.5 font-semibold">
                    {adminPromptError}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {technicians.map((tech) => {
                const isCurrent = currentUser?.id === tech.id;
                return (
                  <button
                    key={tech.id}
                    onClick={() => handleQuickSwitch(tech)}
                    type="button"
                    className={`w-full p-2 rounded-md border text-left flex items-center justify-between transition-colors cursor-pointer ${
                      isCurrent
                        ? 'border-sky-500 bg-sky-50/40 dark:bg-sky-950/20'
                        : 'border-[var(--card-border)] bg-[var(--card-bg)] hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-sm flex items-center justify-center font-mono text-[10px] font-bold text-white shrink-0"
                        style={{ backgroundColor: getAvatarColor(tech.name) }}
                      >
                        {getInitials(tech.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">
                            {tech.name}
                          </p>
                          {tech.role === 'admin' && (
                            <span className="px-1 py-0.2 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-mono text-[9px] uppercase tracking-wider">
                              Supervisor (Locked)
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[10px] text-slate-500 uppercase">
                          {tech.specialization || tech.role}
                        </p>
                      </div>
                    </div>
                    {isCurrent ? (
                      <span className="font-mono text-[10px] text-sky-600 dark:text-sky-400 uppercase font-semibold">
                        [ACTIVE]
                      </span>
                    ) : tech.role === 'admin' ? (
                      <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                        [PASSWORD REQ]
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 uppercase">
                        [SWITCH]
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
