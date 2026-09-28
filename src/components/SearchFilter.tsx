'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { FilterState, Priority, Company } from '@/types';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useBoardStore } from '@/store/boardStore';

interface SearchFilterProps {
  filter: FilterState;
  onFilterChange: (filter: FilterState) => void;
  taskCount: number;
  onNewTask?: () => void;
}

export default function SearchFilter({ filter, onFilterChange, taskCount, onNewTask }: SearchFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { currentUser, isAdmin } = useAuthStore();
  const board = useBoardStore((state) => state.board);

  const companies: Company[] = board.companies || [];
  const assignees = board.assignees || [];

  const availableBranches = useMemo(() => {
    if (filter.company === 'all') return [];
    const found = companies.find((c) => c.name === filter.company);
    return found ? found.branches : [];
  }, [companies, filter.company]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filter.priority !== 'all') count++;
    if (filter.label !== 'all') count++;
    if (filter.assignee !== 'all' && (!currentUser || filter.assignee !== currentUser.id)) count++;
    if (filter.company !== 'all') count++;
    if (filter.branch !== 'all') count++;
    return count;
  }, [filter, currentUser]);

  const clearFilters = () => {
    onFilterChange({
      search: '',
      priority: 'all',
      label: 'all',
      assignee: 'all',
      company: 'all',
      branch: 'all',
      nonViableOnly: false,
    });
  };

  const isAssignedToMe = currentUser && filter.assignee === currentUser.id;

  const toggleAssignedToMe = () => {
    if (!currentUser) return;
    onFilterChange({
      ...filter,
      assignee: isAssignedToMe ? 'all' : currentUser.id,
    });
  };

  const toggleNonViable = () => {
    onFilterChange({
      ...filter,
      nonViableOnly: !filter.nonViableOnly,
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={filter.search}
            onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
            placeholder="Search serial #, client, branch, fault code..."
            className="workshop-input w-full pl-9 pr-8 py-1.5 text-xs placeholder:text-slate-400 font-sans"
          />
          {filter.search && (
            <button
              onClick={() => onFilterChange({ ...filter, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-mono"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Filter: Assigned Station (Admin gets toggle, Technician gets locked bay indicator) */}
        {isAdmin() && currentUser && (
          <button
            type="button"
            onClick={toggleAssignedToMe}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border',
              isAssignedToMe
                ? 'bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white font-semibold'
                : 'bg-[var(--card-bg)] text-[var(--text-color)] border-[var(--border-color)] hover:border-[var(--accent-color)]'
            )}
          >
            <svg className="w-3.5 h-3.5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Station: {currentUser.name.split(' ')[0]}</span>
          </button>
        )}

        {!isAdmin() && currentUser && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-mono font-semibold border border-[var(--border-color)] bg-[var(--card-subtle)] text-[var(--text-color)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>STATION BAY: {currentUser.name.toUpperCase()} (MY TICKETS)</span>
          </div>
        )}

        {/* Quick Filter: 5+ Repeat Repair Limit */}
        <button
          type="button"
          onClick={toggleNonViable}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border',
            filter.nonViableOnly
              ? 'bg-red-700 text-white border-red-700'
              : 'bg-[var(--card-bg)] text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/80 hover:bg-red-50 dark:hover:bg-red-950/25'
          )}
        >
          <svg className="w-3.5 h-3.5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-mono uppercase tracking-wider text-[11px]">5+ Repeat Repairs</span>
        </button>

        {/* Expanded Filters Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border',
            activeFilterCount > 0
              ? 'bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white font-semibold'
              : 'bg-[var(--card-bg)] text-[var(--text-color)] border-[var(--border-color)] hover:border-[var(--accent-color)]'
          )}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-1 py-0.2 rounded bg-sky-600 text-white font-mono text-[10px] font-semibold">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Match Count, Add Ticket & Reset */}
        <div className="flex items-center gap-2.5 ml-auto">


          <span className="font-mono text-[11px] text-[var(--text-muted)] uppercase tracking-wider hidden sm:inline">
            {taskCount.toString().padStart(2, '0')} TICKETS ACTIVE
          </span>
          {(filter.search || activeFilterCount > 0 || filter.nonViableOnly || isAssignedToMe) && (
            <button
              onClick={clearFilters}
              className="font-mono text-[11px] text-sky-600 dark:text-sky-400 hover:underline uppercase tracking-wider"
            >
              [RESET]
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filter Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="search-filter-expanded-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="workshop-card p-3 rounded-md grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {/* Company Filter */}
              <div>
                <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Client Account
                </label>
                <select
                  value={filter.company}
                  onChange={(e) =>
                    onFilterChange({
                      ...filter,
                      company: e.target.value,
                      branch: 'all',
                    })
                  }
                  className="workshop-input w-full py-1 px-2 text-xs"
                >
                  <option value="all">All Clients</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sub-Branch Filter */}
              <div>
                <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Branch Office
                </label>
                <select
                  value={filter.branch}
                  onChange={(e) => onFilterChange({ ...filter, branch: e.target.value })}
                  disabled={filter.company === 'all'}
                  className="workshop-input w-full py-1 px-2 text-xs disabled:opacity-40"
                >
                  <option value="all">All Branches</option>
                  {availableBranches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Technician Filter (Only Admin can filter across other techs; technicians are locked to their own station) */}
              <div>
                <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Assigned Tech
                </label>
                {isAdmin() ? (
                  <select
                    value={filter.assignee}
                    onChange={(e) => onFilterChange({ ...filter, assignee: e.target.value })}
                    className="workshop-input w-full py-1 px-2 text-xs"
                  >
                    <option value="all">All Technicians</option>
                    {assignees.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="workshop-plate py-1 px-2 text-xs truncate">
                    {currentUser?.name} (Your Station)
                  </div>
                )}
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  SLA Classification
                </label>
                <select
                  value={filter.priority}
                  onChange={(e) => onFilterChange({ ...filter, priority: e.target.value as any })}
                  className="workshop-input w-full py-1 px-2 text-xs"
                >
                  <option value="all">All Classifications</option>
                  <option value="high">Critical SLA</option>
                  <option value="medium">Standard Service</option>
                  <option value="low">Routine / Bench Check</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
