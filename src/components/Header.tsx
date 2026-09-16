'use client';

import { useState } from 'react';

import { ViewMode } from '@/types';
import { useAuthStore } from '@/store/authStore';


interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  totalTasks: number;
  nonViableCount: number;
  onNewTask?: () => void;
  onToggleMobileSidebar: () => void;
}

export default function Header({
  viewMode,
  onViewModeChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  totalTasks,
  nonViableCount,
  onNewTask,
  onToggleMobileSidebar,
}: HeaderProps) {
  const { isAdmin } = useAuthStore();

  const [showAddColumn, setShowAddColumn] = useState(false);
  const [columnTitle, setColumnTitle] = useState('');
  const [columnColor, setColumnColor] = useState('#2563eb');

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
            <button
              onClick={onToggleMobileSidebar}
              className="md:hidden p-1.5 -ml-2 rounded text-[var(--text-muted)] hover:text-[var(--text-color)] hover:bg-[var(--card-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]"
              aria-label="Open Sidebar Menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="hidden md:flex w-8 h-8 rounded border border-[var(--border-color)] bg-[var(--card-subtle)] text-[var(--accent-color)] items-center justify-center font-mono font-bold text-xs shrink-0">
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[var(--accent-color)] hover:brightness-110 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer active:scale-95 ring-2 ring-[var(--accent-color)]/20"
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



        </div>
      </div>
    </header>
  );
}
