'use client';

import { useState, useMemo } from 'react';
import { Task, Column, Company } from '@/types';
import { formatDate, getInitials, getAvatarColor } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { REPAIR_LIMIT_THRESHOLD } from '@/lib/constants';

interface DatabaseViewProps {
  tasks: Task[];
  columns: Column[];
  companies: Company[];
  onSelectTask: (task: Task) => void;
  onNewTask: () => void;
}

export default function DatabaseView({
  tasks,
  columns,
  companies,
  onSelectTask,
  onNewTask,
}: DatabaseViewProps) {
  const { currentUser, isAdmin } = useAuthStore();

  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedTech, setSelectedTech] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [nonViableOnly, setNonViableOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'repairs-desc' | 'serial'>('date-desc');

  const availableBranches = useMemo(() => {
    if (selectedCompany === 'all') return [];
    const found = companies.find((c) => c.name === selectedCompany);
    return found ? found.branches : [];
  }, [companies, selectedCompany]);

  const columnMap = useMemo(() => {
    const map = new Map<string, Column>();
    columns.forEach((c) => map.set(c.id, c));
    return map;
  }, [columns]);

  const uniqueAssignees = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    tasks.forEach((t) => {
      if (t.assignee && t.assignee.id) {
        map.set(t.assignee.id, { id: t.assignee.id, name: t.assignee.name });
      }
    });
    return Array.from(map.values());
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let result = tasks.filter((task) => {
      if (nonViableOnly) {
        const count = task.repairCount || 1;
        if (count < REPAIR_LIMIT_THRESHOLD && task.isViable !== false) return false;
      }

      if (selectedCompany !== 'all' && task.companyName !== selectedCompany) {
        return false;
      }

      if (selectedBranch !== 'all' && task.branchName !== selectedBranch) {
        return false;
      }

      if (selectedTech !== 'all') {
        if (selectedTech === 'assigned-to-me') {
          if (task.assignee?.id !== currentUser?.id) return false;
        } else if (task.assignee?.id !== selectedTech) {
          return false;
        }
      }

      if (selectedStage !== 'all' && task.columnId !== selectedStage) {
        return false;
      }

      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const matchesSerial = task.serialNumber?.toLowerCase().includes(query);
        const matchesCompany = task.companyName?.toLowerCase().includes(query);
        const matchesBranch = task.branchName?.toLowerCase().includes(query);
        const matchesModel = task.printerModel?.toLowerCase().includes(query);
        const matchesFault = task.reportedFault?.toLowerCase().includes(query);
        const matchesTech = task.assignee?.name.toLowerCase().includes(query);
        const matchesTitle = task.title?.toLowerCase().includes(query);

        if (!matchesSerial && !matchesCompany && !matchesBranch && !matchesModel && !matchesFault && !matchesTech && !matchesTitle) {
          return false;
        }
      }

      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.receivedDate || b.createdAt).getTime() - new Date(a.receivedDate || a.createdAt).getTime();
      }
      if (sortBy === 'date-asc') {
        return new Date(a.receivedDate || a.createdAt).getTime() - new Date(b.receivedDate || b.createdAt).getTime();
      }
      if (sortBy === 'repairs-desc') {
        return (b.repairCount || 1) - (a.repairCount || 1);
      }
      if (sortBy === 'serial') {
        return (a.serialNumber || '').localeCompare(b.serialNumber || '');
      }
      return 0;
    });

    return result;
  }, [tasks, nonViableOnly, selectedCompany, selectedBranch, selectedTech, selectedStage, search, sortBy, currentUser?.id]);

  const handleExportCSV = () => {
    const headers = [
      'Serial Number',
      'Intake Date & Time',
      'Client Company',
      'Origin Sub-Branch',
      'Printer Model',
      'Reported Fault',
      'Repair Count',
      'Viability Status',
      'Workflow Stage',
      'Assigned Technician',
      'Target Delivery Date',
    ];

    const rows = filteredTasks.map((t) => [
      `"${t.serialNumber || ''}"`,
      `"${formatDate(t.receivedDate || t.createdAt)}"`,
      `"${t.companyName || ''}"`,
      `"${t.branchName || ''}"`,
      `"${t.printerModel || ''}"`,
      `"${(t.reportedFault || t.title || '').replace(/"/g, '""')}"`,
      `"${t.repairCount || 1}"`,
      `"${(t.repairCount || 1) >= REPAIR_LIMIT_THRESHOLD ? 'NON-VIABLE (5+ Repairs)' : 'Viable'}"`,
      `"${columnMap.get(t.columnId)?.title || t.columnId}"`,
      `"${t.assignee?.name || 'Unassigned'}"`,
      `"${t.dueDate ? formatDate(t.dueDate) : 'N/A'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Evermarch_Printer_Registry_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCompany('all');
    setSelectedBranch('all');
    setSelectedTech('all');
    setSelectedStage('all');
    setNonViableOnly(false);
  };

  const hasActiveFilters =
    search !== '' ||
    selectedCompany !== 'all' ||
    selectedBranch !== 'all' ||
    selectedTech !== 'all' ||
    selectedStage !== 'all' ||
    nonViableOnly;

  return (
    <div className="space-y-3">
      {/* Top Filter and Search Bar Card */}
      <div className="workshop-card p-3.5 rounded-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 mb-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search serial #, client account, sub-branch, model, or technician..."
              className="workshop-input w-full pl-9 pr-8 py-1.5 text-xs font-mono"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-mono text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onNewTask}
              className="px-3.5 py-1.5 rounded-md bg-[#026aa7] hover:bg-[#025687] dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-black font-mono text-xs uppercase tracking-wider font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer ring-2 ring-[#026aa7]/20 dark:ring-sky-500/30"
              title="Create a new printer repair ticket (Shortcut: N)"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>+ New Ticket</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="workshop-plate px-3 py-1.5 rounded-md font-mono text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
              title="Export registry to CSV"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>CSV Export</span>
            </button>

            <button
              onClick={() => window.print()}
              className="workshop-plate px-3 py-1.5 rounded-md font-mono text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print Slip</span>
            </button>
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2.5 border-t border-[var(--card-border)]">
          {/* Company Filter */}
          <div>
            <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Client</label>
            <select
              value={selectedCompany}
              onChange={(e) => {
                setSelectedCompany(e.target.value);
                setSelectedBranch('all');
              }}
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
            <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              disabled={selectedCompany === 'all'}
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

          {/* Stage / Column Filter */}
          <div>
            <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Station</label>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="workshop-input w-full py-1 px-2 text-xs"
            >
              <option value="all">All Stations</option>
              {columns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.title}
                </option>
              ))}
            </select>
          </div>

          {/* Technician Filter */}
          <div>
            <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Tech Station</label>
            {isAdmin() ? (
              <select
                value={selectedTech}
                onChange={(e) => setSelectedTech(e.target.value)}
                className="workshop-input w-full py-1 px-2 text-xs"
              >
                <option value="all">All Tech Stations</option>
                {currentUser && <option value="assigned-to-me">Station: {currentUser.name.split(' ')[0]}</option>}
                {uniqueAssignees.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="workshop-input w-full py-1 px-2 text-xs text-sky-400 font-mono flex items-center justify-between bg-slate-900/60 cursor-not-allowed border-sky-900/50" title="Locked to your assigned workstation">
                <span className="truncate">{currentUser?.name || 'My Station'}</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase">LOCKED</span>
              </div>
            )}
          </div>

          {/* Sort By */}
          <div>
            <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Sort</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="workshop-input w-full py-1 px-2 text-xs"
            >
              <option value="date-desc">Newest Intake</option>
              <option value="date-asc">Oldest Intake</option>
              <option value="repairs-desc">Highest Repairs (5+)</option>
              <option value="serial">Serial # (A-Z)</option>
            </select>
          </div>

          {/* 5+ Non-Viable Toggle */}
          <div className="flex flex-col justify-end">
            <button
              type="button"
              onClick={() => setNonViableOnly(!nonViableOnly)}
              className={`w-full py-1.5 px-2 rounded-md font-mono text-[10px] uppercase tracking-wider font-semibold transition-colors border ${
                nonViableOnly
                  ? 'bg-red-700 text-white border-red-700'
                  : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300 border-red-200 dark:border-red-900/60 hover:bg-red-100'
              }`}
            >
              5+ Repeat Limit
            </button>
          </div>
        </div>

        {/* Status Line */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[var(--card-border)] font-mono text-[11px] text-slate-500 uppercase tracking-wider">
          <div>
            SHOWING <span className="font-bold text-[var(--text-color)]">{filteredTasks.length.toString().padStart(2, '0')}</span> OF{' '}
            <span className="font-bold text-[var(--text-color)]">{tasks.length.toString().padStart(2, '0')}</span> {isAdmin() ? 'REGISTERED WORKSHOP UNITS' : 'ASSIGNED STATION UNITS'}
          </div>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-sky-600 dark:text-sky-400 font-semibold hover:underline">
              [RESET FILTERS]
            </button>
          )}
        </div>
      </div>

      {/* Database Table Container */}
      <div className="rounded-md border border-[var(--card-border)] bg-[var(--card-bg)] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--card-border)] bg-slate-50/90 dark:bg-[#0f0f0f] font-mono text-[var(--text-muted)] font-semibold text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3.5">Asset S/N</th>
                <th className="py-2.5 px-3.5">Intake Date</th>
                <th className="py-2.5 px-3.5">Client Account</th>
                <th className="py-2.5 px-3.5">Origin Branch</th>
                <th className="py-2.5 px-3.5">Equipment Model</th>
                <th className="py-2.5 px-3.5">Reported Symptoms</th>
                <th className="py-2.5 px-3.5 text-center">Cycle Count</th>
                <th className="py-2.5 px-3.5">Station Bay</th>
                <th className="py-2.5 px-3.5">Assigned Tech</th>
                <th className="py-2.5 px-3.5 text-right">Docket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <p className="font-mono text-slate-400 text-xs uppercase tracking-wider mb-3">
                      // No printer asset records match the active criteria.
                    </p>
                    <button
                      onClick={onNewTask}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#026aa7] hover:bg-[#025687] dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-black font-mono text-xs uppercase tracking-wider font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      <span>+ Create New Ticket</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const isNonViable = (task.repairCount && task.repairCount >= REPAIR_LIMIT_THRESHOLD) || task.isViable === false;
                  const column = columnMap.get(task.columnId);

                  return (
                    <tr
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className={`hover:bg-slate-50/80 dark:hover:bg-[#141414] cursor-pointer transition-colors ${
                        isNonViable ? 'bg-red-50/30 dark:bg-red-950/20' : ''
                      }`}
                    >
                      {/* Serial Number */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 dark:text-white workshop-plate px-1.5 py-0.2 rounded text-[11px]">
                            SN: {task.serialNumber || 'UNKNOWN'}
                          </span>
                          {isNonViable && (
                            <span className="px-1 py-0.2 rounded bg-red-700 text-white font-mono text-[9px] uppercase tracking-wider font-bold">
                              LIMIT EXCEEDED
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-[11px] text-slate-500">
                        {formatDate(task.receivedDate || task.createdAt)}
                      </td>

                      {/* Company */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap font-semibold text-slate-900 dark:text-white">
                        {task.companyName || 'Independent'}
                      </td>

                      {/* Sub-Branch */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-[var(--text-muted)]">
                        {task.branchName || 'Main'}
                      </td>

                      {/* Printer Model */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-800 dark:text-[var(--text-color)]">
                        {task.printerModel || 'Printer Unit'}
                      </td>

                      {/* Reported Fault */}
                      <td className="py-2.5 px-3.5 max-w-xs truncate font-mono text-[11px] text-slate-600 dark:text-[var(--text-muted)]" title={task.reportedFault || task.title}>
                        {task.reportedFault || task.title}
                      </td>

                      {/* Repair Count */}
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-block font-mono text-[10px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider ${
                            isNonViable
                              ? 'bg-red-700 text-white'
                              : 'workshop-plate text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          Cycle #{task.repairCount || 1}
                        </span>
                      </td>

                      {/* Workflow Stage */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-[var(--card-border)] bg-[var(--bg-color)] text-slate-700 dark:text-slate-300">
                          {column?.title || task.columnId}
                        </span>
                      </td>

                      {/* Technician */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        {task.assignee ? (
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-5 h-5 rounded-sm flex items-center justify-center font-mono text-[9px] font-bold text-white shrink-0"
                              style={{ backgroundColor: getAvatarColor(task.assignee.name) }}
                            >
                              {getInitials(task.assignee.name)}
                            </div>
                            <span className="text-slate-700 dark:text-slate-300 font-medium text-xs">{task.assignee.name}</span>
                          </div>
                        ) : (
                          <span className="font-mono text-[10px] text-slate-400 uppercase">Unassigned</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectTask(task)}
                          className="workshop-plate px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:border-slate-400 transition-colors"
                        >
                          [VIEW DOCKET]
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
