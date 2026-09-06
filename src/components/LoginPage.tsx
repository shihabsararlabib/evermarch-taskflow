'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { getAvatarColor, getInitials } from '@/lib/utils';

export default function LoginPage() {
  const { technicians, login, quickLogin } = useAuthStore();
  const [username, setUsername] = useState('tarek');
  const [password, setPassword] = useState('tech123');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'form' | 'quick'>('form');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = login(username, password);
    if (!result.success) {
      setError(result.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleFloorSwitch = (tech: typeof technicians[0]) => {
    if (tech.role === 'admin') {
      // Direct 1-click to Admin is blocked!
      setActiveTab('form');
      setUsername('admin');
      setPassword('');
      setError('Supervisor authorization required. Please enter the admin password.');
      return;
    }
    const result = quickLogin(tech.id);
    if (result && !result.success && result.message) {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] flex flex-col justify-center items-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md bg-[var(--card-bg)] border border-[var(--card-border)] rounded-md shadow-xs p-6 sm:p-7"
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-md bg-slate-900 dark:bg-white text-white dark:text-black font-mono font-bold text-sm flex items-center justify-center mx-auto mb-3 border border-slate-700 dark:border-neutral-700">
            EB
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white font-sans">
            Evermarch Bangladesh
          </h1>
          <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500 mt-1">
            Service Terminal // Dhaka Workshop
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="flex p-0.5 rounded-md bg-[var(--card-subtle)] border border-[var(--border-color)] mb-5 font-mono text-[11px]">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-1.5 rounded text-center transition-colors uppercase tracking-wider ${
              activeTab === 'form'
                ? 'bg-[var(--card-bg)] text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Credential Sign-In
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-1.5 rounded text-center transition-colors uppercase tracking-wider ${
              activeTab === 'quick'
                ? 'bg-[var(--card-bg)] text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Floor Switch
          </button>
        </div>

        {activeTab === 'form' ? (
          /* Standard Sign In Form */
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Technician / Station ID
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. tarek, hasan, admin"
                className="workshop-input w-full px-3 py-2 text-xs font-mono"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Password
                </label>
                <span className="font-mono text-[10px] text-slate-400">Passcode Required</span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="workshop-input w-full px-3 py-2 text-xs font-mono"
                required
              />
            </div>

            {error && (
              <div className="p-2.5 rounded-md border border-red-300 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 font-mono text-[11px]">
                [ERR]: {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-mono text-xs uppercase tracking-wider font-semibold transition-colors shadow-2xs cursor-pointer"
            >
              Sign In to Workshop
            </button>

            {/* Hint Notice */}
            <div className="pt-3 border-t border-[var(--card-border)] text-center">
              <p className="font-mono text-[10px] text-slate-400">
                Technicians use assigned passcodes • Admin access strictly password-protected
              </p>
            </div>
          </form>
        ) : (
          /* Floor Switcher (Technicians only, Admin requires password) */
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-2">
              Select bench station (Supervisor requires password):
            </p>
            {technicians.map((tech) => (
              <button
                key={tech.id}
                onClick={() => handleFloorSwitch(tech)}
                type="button"
                className="w-full p-2 rounded-md border border-[var(--card-border)] hover:border-sky-500 bg-[var(--card-bg)] hover:bg-sky-50/30 dark:hover:bg-sky-950/20 flex items-center justify-between transition-colors group text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-sm flex items-center justify-center font-mono text-[11px] font-bold text-white shrink-0"
                    style={{ backgroundColor: getAvatarColor(tech.name) }}
                  >
                    {getInitials(tech.name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-sky-600 transition-colors">
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
                <span className="font-mono text-[10px] text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                  {tech.role === 'admin' ? '[PASSWORD REQ]' : '[SWITCH]'}
                </span>
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
