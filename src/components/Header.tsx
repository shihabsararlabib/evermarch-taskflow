'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import { ViewMode } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { getAvatarColor, getInitials } from '@/lib/utils';
import { syncManager, SyncStatus } from '@/lib/syncManager';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExport: () => void;
  onImport: (file: File) => void;
  onAddColumn: (title: string, color: string) => void;
  totalTasks: number;
  nonViableCount: number;
  onOpenLogin: () => void;
  onOpenAdminPanel?: () => void;
  onNewTask?: () => void;
}

export default function Header({
  viewMode,
  onViewModeChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExport,
  onImport,
  onAddColumn,
  totalTasks,
  nonViableCount,
  onOpenLogin,
  onOpenAdminPanel,
  onNewTask,
}: HeaderProps) {
  const { currentUser, logout, isAdmin } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [columnTitle, setColumnTitle] = useState('');
  const [columnColor, setColumnColor] = useState('#2563eb');

  useEffect(() => {
    const unsub = syncManager.subscribe((status) => {
      setSyncStatus(status);
    });

    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      unsub();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAddColumn = () => {
    if (columnTitle.trim()) {
      onAddColumn(columnTitle.trim(), columnColor);
      setColumnTitle('');
      setShowAddColumn(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[var(--card-bg)] border-b border-[var(--border-color)] transition-colors">
      <div className="max-w-[1900px] mx-auto px-4 lg:px-6 py-2.5">
        <div className="flex items-center justify-between gap-4">
          
          {/* Brand & Workshop Operational Status */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded border border-[var(--border-color)] bg-[var(--card-subtle)] text-[var(--accent-color)] flex items-center justify-center font-mono font-bold text-xs shrink-0">
              EB
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold tracking-tight text-[var(--text-color)] font-sans uppercase">
                  Evermarch Bangladesh
                </span>
                <span className="hidden sm:inline-flex px-1.5 py-0.2 text-[10px] font-mono rounded border border-[var(--border-color)] bg-[var(--card-subtle)] text-[var(--text-muted)] font-medium">
                  PRINTER OPS
                </span>
              </div>
              
              <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono">
                <span className="text-[var(--text-muted)]">
                  <strong className="text-[var(--text-color)]">{totalTasks}</strong>{' '}
                  {isAdmin() ? 'Active Work Orders (Workshop Overview)' : 'Work Orders Assigned to You'}
                </span>
                {nonViableCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-1.5 py-0.2 rounded border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                    {nonViableCount} Non-Viable (5+ Visits)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Segmented View Switcher */}
          <div className="hidden md:flex items-center p-0.5 rounded border border-[var(--border-color)] bg-[var(--card-subtle)]">
            <button
              onClick={() => onViewModeChange('board')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'board'
                  ? 'bg-[var(--card-bg)] text-[var(--text-color)] font-bold border border-[var(--border-color)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-color)]'
              }`}
            >
              <svg className="w-3.5 h-3.5 text-[var(--accent-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              <span>Kanban Flow</span>
            </button>

            <button
              onClick={() => onViewModeChange('database')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'database'
                  ? 'bg-[var(--card-bg)] text-[var(--text-color)] font-bold border border-[var(--border-color)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-color)]'
              }`}
            >
              <svg className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3V7c0-2-1.5-3-3.5-3h-9C5.5 4 4 5 4 7zm0 5h16M9 4v16" />
              </svg>
              <span>Serial Registry</span>
            </button>
          </div>

          {/* Prominent '+ New Ticket' Primary Action */}
          {onNewTask && (
            <button
              onClick={onNewTask}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#026aa7] hover:bg-[#025687] dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer active:scale-95 ring-2 ring-[#026aa7]/20 dark:ring-sky-500/30"
              title="Create a new printer repair ticket (Shortcut: N)"
              id="header-add-ticket-btn"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>+ New Ticket</span>
              <kbd className="hidden sm:inline px-1 py-0.2 rounded bg-black/20 dark:bg-black/15 text-[10px] font-mono ml-0.5">
                N
              </kbd>
            </button>
          )}

          {/* Right Tools & Technician Station Profile */}
          <div className="flex items-center gap-2">
            {/* Cloud Sync Status Indicator */}
            <div className="flex items-center gap-1.5">
              {syncStatus === 'synced' && (
                <span
                  className="px-2 py-1 rounded text-[11px] font-mono font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 hidden lg:inline-flex items-center gap-1.5"
                  title="All repair records synced with Cloud Database"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  SYNC: CLOUD OK
                </span>
              )}
              {syncStatus === 'syncing' && (
                <span className="px-2 py-1 rounded text-[11px] font-mono font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-spin" />
                  SYNCING...
                </span>
              )}
              {(syncStatus === 'offline' || syncStatus === 'pending') && (
                <span
                  className="px-2 py-1 rounded text-[11px] font-mono font-medium text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-1.5"
                  title="Operating on fast local cache. Will auto-sync when internet reconnects."
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  OFFLINE CACHE
                </span>
              )}

              {/* Force Sync Button */}
              <button
                onClick={() => syncManager.flushQueue()}
                className="w-7 h-7 rounded border border-[var(--border-color)] bg-[var(--card-bg)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent-color)] hover:border-[var(--accent-color)] transition-colors cursor-pointer"
                title="Force Cloud Sync Now"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {/* Supervisor Admin Panel Button (Admin Only) */}
            {isAdmin() && onOpenAdminPanel && (
              <button
                onClick={onOpenAdminPanel}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded border border-[var(--border-color)] bg-[var(--card-subtle)] hover:bg-[var(--card-bg)] text-xs font-semibold text-[var(--text-color)] transition-all cursor-pointer"
                title="Open Supervisor Admin Panel"
              >
                <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span>Supervisor Settings</span>
              </button>
            )}

            {/* Technician Profile Station Pill & Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-2 py-1 rounded border border-[var(--border-color)] bg-[var(--card-bg)] hover:bg-[var(--card-subtle)] transition-all text-left cursor-pointer"
                title="Station User Account Menu"
              >
                <div
                  className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono font-bold text-white shrink-0"
                  style={{ backgroundColor: currentUser ? getAvatarColor(currentUser.name) : '#6b7280' }}
                >
                  {currentUser ? getInitials(currentUser.name) : '??'}
                </div>
                <div className="hidden sm:block">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-[var(--text-color)] leading-snug truncate max-w-[120px]">
                      {currentUser ? currentUser.name : 'Not Signed In'}
                    </span>
                    {isAdmin() && (
                      <span className="px-1 py-0.1 text-[9px] font-mono font-semibold rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-mono text-[var(--text-muted)] leading-none">
                    {currentUser?.role === 'admin' ? 'Supervisor Station' : 'Bench Technician'}
                  </p>
                </div>
                <svg className="w-3 h-3 text-[var(--text-muted)] ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* User Dropdown Menu */}
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute right-0 top-full mt-1.5 w-60 p-1.5 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-md shadow-lg z-50 text-[var(--text-color)]"
                  >
                    <div className="px-3 py-2 border-b border-[var(--border-color)] mb-1">
                      <p className="text-xs font-bold truncate">{currentUser?.name}</p>
                      <p className="text-[11px] font-mono text-[var(--text-muted)] uppercase">
                        {currentUser?.role === 'admin' ? 'Workshop Supervisor' : 'Bench Technician'}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                        {currentUser?.specialization}
                      </p>
                    </div>

                    {isAdmin() && onOpenAdminPanel && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenAdminPanel();
                        }}
                        className="w-full px-2.5 py-1.5 rounded text-xs font-medium hover:bg-[var(--card-subtle)] flex items-center gap-2 transition-colors cursor-pointer text-left"
                      >
                        <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                        <span>Supervisor Control Panel</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenLogin();
                      }}
                      className="w-full px-2.5 py-1.5 rounded text-xs font-medium hover:bg-[var(--card-subtle)] flex items-center gap-2 transition-colors cursor-pointer text-left"
                    >
                      <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <span>Switch Station Profile</span>
                    </button>

                    <div className="pt-1 mt-1 border-t border-[var(--border-color)]">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full px-2.5 py-1.5 rounded text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 transition-colors cursor-pointer text-left"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sign Out of Workshop</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile View Switcher */}
            <div className="flex md:hidden items-center border border-[var(--border-color)] rounded-lg p-0.5">
              <button
                onClick={() => onViewModeChange(viewMode === 'board' ? 'database' : 'board')}
                className="px-2 py-1 text-xs font-semibold text-blue-600"
              >
                {viewMode === 'board' ? 'Table' : 'Board'}
              </button>
            </div>

            {/* Mobile + Token Button */}
            {onNewTask && (
              <button
                onClick={onNewTask}
                className="flex sm:hidden items-center gap-1 px-2 py-1 rounded bg-[#026aa7] dark:bg-sky-500 text-white dark:text-black font-mono font-bold text-xs shadow-xs"
                title="Add Token"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>+ Token</span>
              </button>
            )}

            {/* Add Stage (Column - Admin Only) */}
            {viewMode === 'board' && isAdmin() && (
              <div className="relative">
                <button
                  onClick={() => setShowAddColumn(!showAddColumn)}
                  className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded border border-[var(--border-color)] text-xs font-semibold text-[var(--text-color)] bg-[var(--card-bg)] hover:bg-[var(--card-subtle)] transition-colors cursor-pointer"
                  aria-label="Add Stage"
                >
                  <svg className="w-3.5 h-3.5 text-[var(--accent-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>+ Station</span>
                </button>
                <AnimatePresence>
                  {showAddColumn && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="absolute right-0 top-full mt-1.5 w-64 p-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-md shadow-lg z-50 text-[var(--text-color)]"
                    >
                      <p className="text-xs font-bold mb-2">
                        Add Workshop Station
                      </p>
                      <input
                        type="text"
                        value={columnTitle}
                        onChange={(e) => setColumnTitle(e.target.value)}
                        placeholder="Station title..."
                        className="w-full px-2.5 py-1.5 border border-[var(--border-color)] rounded bg-[var(--card-subtle)] text-xs text-[var(--text-color)] focus:outline-none focus:border-[var(--accent-color)] mb-2.5"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddColumn();
                        }}
                        autoFocus
                      />
                      <div className="flex items-center gap-2 mb-3">
                        <label htmlFor="col-color" className="text-xs text-[var(--text-muted)]">Station Indicator:</label>
                        <input
                          id="col-color"
                          type="color"
                          value={columnColor}
                          onChange={(e) => setColumnColor(e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                        />
                      </div>
                      <button
                        onClick={handleAddColumn}
                        disabled={!columnTitle.trim()}
                        className="w-full py-1.5 text-xs font-bold text-white bg-[#026aa7] hover:bg-[#025687] disabled:opacity-50 rounded transition-colors cursor-pointer"
                      >
                        Create Station
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Undo / Redo */}
            <div className="hidden lg:flex items-center gap-1 border-l border-[var(--border-color)] pl-2">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className="w-8 h-8 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] flex items-center justify-center text-slate-500 hover:text-[var(--text-color)] disabled:opacity-30 transition-all shadow-2xs"
                title="Undo (Ctrl+Z)"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className="w-8 h-8 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] flex items-center justify-center text-slate-500 hover:text-[var(--text-color)] disabled:opacity-30 transition-all shadow-2xs"
                title="Redo (Ctrl+Shift+Z)"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                </svg>
              </button>
            </div>

            {/* Export / Import Backup */}
            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={onExport}
                className="w-8 h-8 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] flex items-center justify-center text-slate-500 hover:text-[var(--text-color)] transition-all shadow-2xs"
                title="Download JSON Backup"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] flex items-center justify-center text-slate-500 hover:text-[var(--text-color)] transition-all shadow-2xs"
                title="Restore JSON Backup"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImport(file);
                  e.target.value = '';
                }}
              />
            </div>

            {/* Dark / Light Theme Toggle */}
            <ThemeToggle />
          </div>

        </div>
      </div>
    </header>
  );
}
