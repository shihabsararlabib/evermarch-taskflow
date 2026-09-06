'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Priority, Label, Assignee, Company } from '@/types';
import { PRIORITY_CONFIG, PRESET_LABELS, PRESET_ASSIGNEES, REPAIR_LIMIT_THRESHOLD } from '@/lib/constants';
import { getInitials, getAvatarColor, cn, formatDate } from '@/lib/utils';
import { useBoardStore } from '@/store/boardStore';
import { useAuthStore } from '@/store/authStore';

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete: (taskId: string) => void;
  isNewTask?: boolean;
  defaultColumnId?: string;
}

const COMMON_BRANDS = ['HP', 'Canon', 'Epson', 'Brother', 'Ricoh', 'Samsung'];

const COMMON_ISSUES = [
  'Paper Jam / Feed Roller',
  'No Power / Dead SMPS',
  'Fuser 50.4 Error / Heating',
  'Blurry / Streaked / Faded Print',
  'Toner Cartridge Not Recognized',
  'Scanner / ADF Sensor Failure',
  'Grinding Noise / Broken Gear',
  'Network / USB Offline',
];

export default function TaskModal({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
  isNewTask = false,
  defaultColumnId = 'intake',
}: TaskModalProps) {
  // Core Fields
  const [serialNumber, setSerialNumber] = useState('');
  const [printerModel, setPrinterModel] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [receivedDate, setReceivedDate] = useState('');
  const [reportedFault, setReportedFault] = useState('');
  const [diagnosisNotes, setDiagnosisNotes] = useState('');
  const [partsReplaced, setPartsReplaced] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [columnId, setColumnId] = useState(defaultColumnId);
  const [labels, setLabels] = useState<Label[]>([]);
  const [assignee, setAssignee] = useState<Assignee | null>(null);
  const [dueDate, setDueDate] = useState('');

  // UI state
  const [showAdvanced, setShowAdvanced] = useState(!isNewTask);
  const [isAddingCustomCompany, setIsAddingCustomCompany] = useState(false);
  const [customCompanyName, setCustomCompanyName] = useState('');
  const [isAddingCustomBranch, setIsAddingCustomBranch] = useState(false);
  const [customBranchName, setCustomBranchName] = useState('');

  // Authentication & Supervisor Privileges
  const { currentUser, isAdmin } = useAuthStore();
  const [supervisorOverride, setSupervisorOverride] = useState(false);

  // Store access
  const board = useBoardStore((state) => state.board);
  const addCompany = useBoardStore((state) => state.addCompany);
  const addBranch = useBoardStore((state) => state.addBranch);
  const getRepairHistoryBySerial = useBoardStore((state) => state.getRepairHistoryBySerial);

  const companies: Company[] = board.companies || [];
  const assignees = board.assignees || PRESET_ASSIGNEES;
  const columns = board.columns;

  // Calculate repair history whenever serial number changes
  const pastRepairs = useMemo(() => {
    if (!serialNumber.trim()) return [];
    return getRepairHistoryBySerial(serialNumber.trim());
  }, [serialNumber, getRepairHistoryBySerial]);

  const mostRecentPastRepair = useMemo(() => {
    if (pastRepairs.length === 0) return null;
    const matches = pastRepairs.filter((p) => p.id !== task?.id);
    return matches[0] || null;
  }, [pastRepairs, task?.id]);

  const currentRepairCount = useMemo(() => {
    if (!serialNumber.trim()) return 1;
    const matchesExcludingThis = pastRepairs.filter((p) => p.id !== task?.id);
    return matchesExcludingThis.length + 1;
  }, [serialNumber, pastRepairs, task?.id]);

  const isExceedingLimit = currentRepairCount >= REPAIR_LIMIT_THRESHOLD;

  const availableBranches = useMemo(() => {
    const found = companies.find((c) => c.name.toLowerCase() === companyName.toLowerCase());
    return found ? found.branches : [];
  }, [companies, companyName]);

  // Populate data on open
  useEffect(() => {
    if (isOpen && task) {
      setSerialNumber(task.serialNumber || '');
      setPrinterModel(task.printerModel || '');
      setCompanyName(task.companyName || (companies[0]?.name || ''));
      setBranchName(task.branchName || '');
      setReceivedDate(task.receivedDate ? task.receivedDate.substring(0, 16) : new Date().toISOString().substring(0, 16));
      setReportedFault(task.reportedFault || task.title || '');
      setDiagnosisNotes(task.diagnosisNotes || task.description || '');
      setPartsReplaced(task.partsReplaced || '');
      setPriority(task.priority || 'medium');
      setColumnId(task.columnId || defaultColumnId);
      setLabels(task.labels || []);
      setAssignee(task.assignee);
      setDueDate(task.dueDate || '');
      setSupervisorOverride(Boolean(task.isViable && (task.repairCount || 0) >= REPAIR_LIMIT_THRESHOLD));
      setShowAdvanced(true);
      setIsAddingCustomCompany(false);
      setIsAddingCustomBranch(false);
    } else if (isOpen && isNewTask) {
      const nowStr = new Date().toISOString().substring(0, 16);
      const defaultCompany = companies[0]?.name || '';
      const defaultBranch = companies[0]?.branches[0] || 'Main Office';
      setSerialNumber('');
      setPrinterModel('');
      setCompanyName(defaultCompany);
      setBranchName(defaultBranch);
      setReceivedDate(nowStr);
      setReportedFault('');
      setDiagnosisNotes('');
      setPartsReplaced('');
      setPriority('medium');
      setColumnId(defaultColumnId);
      setLabels([]);
      const defaultTech = !isAdmin() && currentUser
        ? assignees.find((a) => a.id === currentUser.id) || {
            id: currentUser.id,
            name: currentUser.name,
            avatar: currentUser.avatar || '',
            role: currentUser.role,
            specialization: currentUser.specialization,
          }
        : assignees[1] || null;
      setAssignee(defaultTech);
      setDueDate('');
      setSupervisorOverride(false);
      setShowAdvanced(false); // Default to clean Fast Intake!
      setIsAddingCustomCompany(false);
      setIsAddingCustomBranch(false);
    }
  }, [isOpen, task, isNewTask, companies, assignees, defaultColumnId, isAdmin, currentUser]);

  // Auto-fill from recognized past history
  const handleAutoFillHistory = () => {
    if (!mostRecentPastRepair) return;
    if (mostRecentPastRepair.printerModel) setPrinterModel(mostRecentPastRepair.printerModel);
    if (mostRecentPastRepair.companyName) {
      setCompanyName(mostRecentPastRepair.companyName);
      if (mostRecentPastRepair.branchName) {
        setBranchName(mostRecentPastRepair.branchName);
      }
    }
  };

  const handleSelectBrand = (brand: string) => {
    if (!printerModel.trim()) {
      setPrinterModel(`${brand} `);
    } else if (!printerModel.toLowerCase().startsWith(brand.toLowerCase())) {
      setPrinterModel(`${brand} ${printerModel}`);
    }
  };

  const handleSelectIssue = (issue: string) => {
    if (!reportedFault.trim()) {
      setReportedFault(issue);
    } else if (!reportedFault.includes(issue)) {
      setReportedFault(`${reportedFault}, ${issue}`);
    }
  };

  const handleSelectTopClient = (clientName: string) => {
    setCompanyName(clientName);
    const found = companies.find((c) => c.name === clientName);
    setBranchName(found?.branches[0] || 'Main Office');
  };

  const handleSave = useCallback(() => {
    const finalSerial = serialNumber.trim().toUpperCase() || 'UNKNOWN-SN';
    const finalModel = printerModel.trim() || 'Generic Printer Unit';
    const finalFault = reportedFault.trim() || 'General Maintenance & Inspection';
    const computedTitle = `[${finalModel}] ${finalFault}`;

    const finalAssignee = !isAdmin()
      ? (assignee || (currentUser ? {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar || '',
          role: currentUser.role,
          specialization: currentUser.specialization,
        } : null))
      : assignee;

    const updatedTask: Task = {
      id: task?.id || '',
      title: computedTitle,
      description: diagnosisNotes.trim() || finalFault,
      serialNumber: finalSerial,
      printerModel: finalModel,
      companyName: companyName.trim() || 'Independent Client',
      branchName: branchName.trim() || 'Main Office',
      receivedDate: receivedDate ? new Date(receivedDate).toISOString() : new Date().toISOString(),
      reportedFault: finalFault,
      diagnosisNotes: diagnosisNotes.trim(),
      partsReplaced: partsReplaced.trim(),
      isViable: supervisorOverride ? true : !isExceedingLimit,
      repairCount: currentRepairCount,
      priority,
      columnId,
      labels,
      assignee: finalAssignee,
      dueDate: dueDate || null,
      order: task?.order || 0,
      createdAt: task?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedTask);
    onClose();
  }, [
    serialNumber,
    printerModel,
    reportedFault,
    diagnosisNotes,
    partsReplaced,
    companyName,
    branchName,
    receivedDate,
    supervisorOverride,
    isExceedingLimit,
    currentRepairCount,
    priority,
    columnId,
    labels,
    assignee,
    dueDate,
    task,
    isAdmin,
    currentUser,
    onSave,
    onClose,
  ]);

  // Keyboard shortcut: Ctrl/Cmd + Enter to save, Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleSave, onClose]);

  const handleAddNewCompany = () => {
    if (customCompanyName.trim()) {
      addCompany(customCompanyName.trim(), ['Main Office']);
      setCompanyName(customCompanyName.trim());
      setBranchName('Main Office');
      setCustomCompanyName('');
      setIsAddingCustomCompany(false);
    }
  };

  const handleAddNewBranch = () => {
    if (customBranchName.trim() && companyName) {
      addBranch(companyName, customBranchName.trim());
      setBranchName(customBranchName.trim());
      setCustomBranchName('');
      setIsAddingCustomBranch(false);
    }
  };

  const toggleLabel = (label: Label) => {
    setLabels((prev) =>
      prev.some((l) => l.id === label.id) ? prev.filter((l) => l.id !== label.id) : [...prev, label]
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/85 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-2xl bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        >
          {/* Top Docket Bar */}
          <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--card-subtle)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-[var(--accent-color)] tracking-wider uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-color)] animate-pulse" />
                {isNewTask ? 'New Repair Ticket' : `Repair Ticket #${(task?.id || '').slice(0, 8)}`}
              </span>

              {/* Status Badge */}
              {isExceedingLimit ? (
                <span className="px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[10px] font-bold uppercase tracking-wider">
                  ⚠️ 5+ Repairs (Non-Viable)
                </span>
              ) : currentRepairCount > 1 ? (
                <span className="px-2 py-0.5 rounded border border-amber-500/50 bg-amber-500/15 text-amber-300 font-mono text-[10px] font-semibold uppercase">
                  Repeat Visit #{currentRepairCount}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded border border-emerald-500/50 bg-emerald-500/15 text-emerald-300 font-mono text-[10px] font-semibold uppercase">
                  First Intake
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-2.5 py-1 rounded text-[11px] font-mono border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-[var(--text-color)] hover:border-[var(--accent-color)] transition-colors flex items-center gap-1 cursor-pointer"
                title="Print printer repair slip / job sheet"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Print Slip</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded border border-[var(--border-color)] bg-[var(--card-bg)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Interactive Visual Stage Stepper */}
          <div className="px-4 py-2.5 bg-[var(--card-bg)] border-b border-[var(--border-color)]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                Workshop Station Progress
              </span>
              <span className="font-mono text-[10px] text-[var(--accent-color)] font-bold">
                {columns.find((c) => c.id === columnId)?.title || 'Intake'}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {columns.map((col, idx) => {
                const isCurrent = columnId === col.id;
                const isPast = columns.findIndex((c) => c.id === columnId) > idx;

                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setColumnId(col.id)}
                    className={cn(
                      'py-1.5 px-1 rounded text-center transition-all cursor-pointer border text-[11px] font-mono',
                      isCurrent
                        ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold shadow-xs'
                        : isPast
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:border-emerald-500'
                        : 'bg-[var(--card-subtle)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-neutral-500'
                    )}
                    title={`Move to ${col.title}`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-[9px] opacity-70">0{idx + 1}</span>
                      <span className="truncate">{col.title.split(' ')[0]}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Scroll Area */}
          <div className="p-4 overflow-y-auto space-y-4 flex-1">

            {/* 1. SERIAL NUMBER INPUT WITH LIVE HISTORY DETECTION */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-color)] flex items-center gap-1.5">
                  <span>1. Serial Number</span>
                  <span className="text-red-500">*</span>
                </label>
                {serialNumber && (
                  <span className="font-mono text-[11px] text-[var(--text-muted)]">
                    Total Lifetime Visits: <strong className="text-[var(--text-color)]">{currentRepairCount}</strong>
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. EB-2026-0881, HP-SN-99824"
                  className="w-full px-3 py-2 text-sm font-mono font-bold uppercase bg-[var(--card-subtle)] border border-[var(--border-color)] rounded-md focus:border-[var(--accent-color)] focus:outline-none transition-colors"
                  required
                  autoFocus={isNewTask}
                />
              </div>

              {/* Instant History Recognition Banner */}
              {mostRecentPastRepair && isNewTask && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 p-2.5 rounded-md border border-emerald-500/40 bg-emerald-950/30 text-emerald-300 text-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">⚡</span>
                    <div className="truncate">
                      <p className="font-semibold text-white truncate">
                        Known Unit: {mostRecentPastRepair.printerModel || 'Printer'}
                      </p>
                      <p className="text-[11px] text-emerald-300/80 font-mono truncate">
                        Client: {mostRecentPastRepair.companyName} ({mostRecentPastRepair.branchName}) • Visit #{currentRepairCount}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoFillHistory}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[11px] font-bold uppercase tracking-wider shrink-0 transition-colors cursor-pointer"
                  >
                    Auto-Fill
                  </button>
                </motion.div>
              )}

              {/* Critical Decommission Alert if 5+ repairs */}
              {isExceedingLimit && (
                <div className="mt-2 p-3 rounded-md border border-red-500/80 bg-red-950/50 text-red-200 text-xs">
                  <div className="flex items-center justify-between font-mono font-bold text-red-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      CRITICAL DECOMMISSION ADVISORY (5+ REPAIRS)
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-red-600 text-white text-[10px]">
                      {currentRepairCount}TH INTAKE
                    </span>
                  </div>
                  <p className="text-[11px] text-red-300 mt-1 leading-relaxed">
                    This printer serial number has been brought for repair {currentRepairCount} times. Standard policy dictates replacing or decommissioning this equipment.
                  </p>
                  {isAdmin() && (
                    <label className="flex items-center gap-2 mt-2 pt-2 border-t border-red-800 text-red-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={supervisorOverride}
                        onChange={(e) => setSupervisorOverride(e.target.checked)}
                        className="rounded border-red-600 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-xs font-mono font-bold">
                        Supervisor Authorization Override: Approve Exception Repair
                      </span>
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* 2. CLIENT ACCOUNT & BRANCH */}
            <div className="space-y-1.5">
              <label className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-color)] flex items-center gap-1.5">
                <span>2. Client Account & Branch</span>
                <span className="text-red-500">*</span>
              </label>

              {/* Quick Client Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Quick Select:</span>
                {companies.slice(0, 4).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectTopClient(c.name)}
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-mono transition-colors border cursor-pointer',
                      companyName === c.name
                        ? 'bg-[var(--accent-color)] text-black font-bold border-[var(--accent-color)]'
                        : 'bg-[var(--card-subtle)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-neutral-500'
                    )}
                  >
                    {c.name.split(' ')[0]}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* Client Company Dropdown */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Client Organization</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingCustomCompany(!isAddingCustomCompany)}
                      className="text-[10px] font-mono text-sky-400 hover:underline cursor-pointer"
                    >
                      {isAddingCustomCompany ? '[Cancel]' : '[+ New Client]'}
                    </button>
                  </div>

                  {isAddingCustomCompany ? (
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={customCompanyName}
                        onChange={(e) => setCustomCompanyName(e.target.value)}
                        placeholder="Company name..."
                        className="flex-1 px-2.5 py-1.5 text-xs bg-[var(--card-subtle)] border border-[var(--border-color)] rounded"
                      />
                      <button
                        type="button"
                        onClick={handleAddNewCompany}
                        className="px-2.5 py-1.5 bg-[var(--accent-color)] text-black rounded text-xs font-bold cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <select
                      value={companyName}
                      onChange={(e) => {
                        const selected = e.target.value;
                        setCompanyName(selected);
                        const found = companies.find((c) => c.name === selected);
                        setBranchName(found?.branches[0] || 'Main Office');
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-[var(--card-subtle)] border border-[var(--border-color)] rounded-md text-[var(--text-color)] focus:border-[var(--accent-color)] focus:outline-none cursor-pointer"
                    >
                      {companies.map((c) => (
                        <option key={c.id} value={c.name} className="bg-neutral-900 text-white">
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Sub-Branch Dropdown */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Sub-Branch / Location</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingCustomBranch(!isAddingCustomBranch)}
                      className="text-[10px] font-mono text-sky-400 hover:underline cursor-pointer"
                    >
                      {isAddingCustomBranch ? '[Cancel]' : '[+ Add Branch]'}
                    </button>
                  </div>

                  {isAddingCustomBranch ? (
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={customBranchName}
                        onChange={(e) => setCustomBranchName(e.target.value)}
                        placeholder="Branch name..."
                        className="flex-1 px-2.5 py-1.5 text-xs bg-[var(--card-subtle)] border border-[var(--border-color)] rounded"
                      />
                      <button
                        type="button"
                        onClick={handleAddNewBranch}
                        className="px-2.5 py-1.5 bg-[var(--accent-color)] text-black rounded text-xs font-bold cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <select
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-[var(--card-subtle)] border border-[var(--border-color)] rounded-md text-[var(--text-color)] focus:border-[var(--accent-color)] focus:outline-none cursor-pointer"
                    >
                      {availableBranches.length > 0 ? (
                        availableBranches.map((b) => (
                          <option key={b} value={b} className="bg-neutral-900 text-white">
                            {b}
                          </option>
                        ))
                      ) : (
                        <option value="Main Office" className="bg-neutral-900 text-white">Main Office</option>
                      )}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* 3. PRINTER BRAND & MODEL */}
            <div className="space-y-1.5">
              <label className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-color)] flex items-center gap-1.5">
                <span>3. Printer Model</span>
                <span className="text-red-500">*</span>
              </label>

              {/* Quick Brand Selector */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Brand:</span>
                {COMMON_BRANDS.map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => handleSelectBrand(brand)}
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-mono transition-colors border cursor-pointer',
                      printerModel.toLowerCase().includes(brand.toLowerCase())
                        ? 'bg-sky-500/20 text-sky-300 font-bold border-sky-400'
                        : 'bg-[var(--card-subtle)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-neutral-500'
                    )}
                  >
                    {brand}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={printerModel}
                onChange={(e) => setPrinterModel(e.target.value)}
                placeholder="e.g. LaserJet Pro M404dn, EcoTank L3250, imageRUNNER 2520"
                className="w-full px-3 py-2 text-xs font-mono bg-[var(--card-subtle)] border border-[var(--border-color)] rounded-md text-[var(--text-color)] focus:border-[var(--accent-color)] focus:outline-none"
                required
              />
            </div>

            {/* 4. REPORTED FAULT & ONE-CLICK COMMON ISSUE CHIPS */}
            <div className="space-y-1.5">
              <label className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-color)] flex items-center gap-1.5">
                <span>4. Reported Problem / Fault</span>
                <span className="text-red-500">*</span>
              </label>

              {/* Common Issue Quick Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {COMMON_ISSUES.map((issue) => (
                  <button
                    key={issue}
                    type="button"
                    onClick={() => handleSelectIssue(issue)}
                    className={cn(
                      'px-2 py-1 rounded text-[11px] font-mono transition-colors border cursor-pointer',
                      reportedFault.includes(issue)
                        ? 'bg-amber-500/20 text-amber-300 font-semibold border-amber-400'
                        : 'bg-[var(--card-subtle)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-neutral-500'
                    )}
                  >
                    + {issue}
                  </button>
                ))}
              </div>

              <textarea
                value={reportedFault}
                onChange={(e) => setReportedFault(e.target.value)}
                rows={2}
                placeholder="Describe client symptoms (e.g. Paper feed jams continuously from tray 2, error 50.4 on display)..."
                className="w-full px-3 py-2 text-xs bg-[var(--card-subtle)] border border-[var(--border-color)] rounded-md text-[var(--text-color)] focus:border-[var(--accent-color)] focus:outline-none leading-relaxed"
                required
              />
            </div>

            {/* EXPANDABLE SECTION: BENCH REPAIR LOG & HARDWARE SPECS */}
            <div className="pt-2 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full py-2 px-3 rounded-md bg-[var(--card-subtle)] border border-[var(--border-color)] hover:border-neutral-600 flex items-center justify-between text-xs font-mono text-[var(--text-color)] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[var(--accent-color)] font-bold">🛠️</span>
                  <span className="font-bold">Bench Work Log & Advanced Diagnostic Notes</span>
                  {!showAdvanced && (
                    <span className="text-[10px] text-[var(--text-muted)] font-normal">
                      (Parts replaced, tech notes, SLA priority)
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-[var(--text-muted)]">
                  {showAdvanced ? '▲ Hide' : '▼ Expand'}
                </span>
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3.5 pt-3 overflow-hidden"
                  >
                    {/* Assigned Technician Station */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                          Assigned Tech Station
                        </label>
                        {!isAdmin() && (
                          <span className="font-mono text-[9px] text-amber-400 font-bold uppercase">
                            [Locked — Supervisor Dispatch]
                          </span>
                        )}
                      </div>

                      {isAdmin() ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {assignees.map((tech) => {
                            const isAssigned = assignee?.id === tech.id;
                            return (
                              <button
                                key={tech.id}
                                type="button"
                                onClick={() => setAssignee(isAssigned ? null : tech)}
                                className={cn(
                                  'p-2 rounded border text-left flex items-center gap-2 transition-colors cursor-pointer',
                                  isAssigned
                                    ? 'border-sky-400 bg-sky-500/15 text-white'
                                    : 'border-[var(--border-color)] bg-[var(--card-subtle)] text-[var(--text-muted)] hover:border-neutral-500'
                                )}
                              >
                                <div
                                  className="w-6 h-6 rounded flex items-center justify-center font-mono text-[10px] font-bold text-white shrink-0"
                                  style={{ backgroundColor: getAvatarColor(tech.name) }}
                                >
                                  {getInitials(tech.name)}
                                </div>
                                <div className="truncate">
                                  <p className="text-xs font-semibold truncate text-[var(--text-color)]">{tech.name}</p>
                                  <p className="text-[9px] font-mono text-[var(--text-muted)] truncate">{tech.specialization}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-2 rounded border border-sky-500/30 bg-sky-500/10 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded flex items-center justify-center font-mono text-[10px] font-bold text-white shrink-0"
                              style={{ backgroundColor: getAvatarColor(assignee?.name || currentUser?.name || 'T') }}
                            >
                              {getInitials(assignee?.name || currentUser?.name || 'T')}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-white">{assignee?.name || currentUser?.name}</p>
                              <p className="text-[9px] font-mono text-slate-400">Assigned Station Bay</p>
                            </div>
                          </div>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold uppercase">
                            Locked
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Priority & Target Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                          SLA Priority
                        </label>
                        <div className="flex gap-1">
                          {(['low', 'medium', 'high'] as Priority[]).map((p) => {
                            const isSelected = priority === p;
                            const labelsMap: Record<Priority, string> = {
                              low: 'Routine',
                              medium: 'Standard',
                              high: 'Critical',
                            };
                            return (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setPriority(p)}
                                className={cn(
                                  'flex-1 py-1 rounded text-xs font-mono uppercase transition-colors border cursor-pointer',
                                  isSelected
                                    ? 'bg-[var(--accent-color)] text-black font-bold border-[var(--accent-color)]'
                                    : 'border-[var(--border-color)] bg-[var(--card-subtle)] text-[var(--text-muted)] hover:border-neutral-500'
                                )}
                              >
                                {labelsMap[p]}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                          Target Dispatch Date
                        </label>
                        <input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs font-mono bg-[var(--card-subtle)] border border-[var(--border-color)] rounded text-[var(--text-color)] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Replaced Components */}
                    <div>
                      <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                        Replaced Components & Assemblies
                      </label>
                      <input
                        type="text"
                        value={partsReplaced}
                        onChange={(e) => setPartsReplaced(e.target.value)}
                        placeholder="e.g. Teflon sleeve, pickup roller, DC controller board"
                        className="w-full px-3 py-2 text-xs font-mono bg-[var(--card-subtle)] border border-[var(--border-color)] rounded text-[var(--text-color)] focus:outline-none"
                      />
                    </div>

                    {/* Bench Diagnostic Notes */}
                    <div>
                      <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                        Technician Bench Work Log & Notes
                      </label>
                      <textarea
                        value={diagnosisNotes}
                        onChange={(e) => setDiagnosisNotes(e.target.value)}
                        rows={3}
                        placeholder="Log repair steps taken, sensor test results, parts dismantled and cleaned..."
                        className="w-full px-3 py-2 text-xs font-mono bg-[var(--card-subtle)] border border-[var(--border-color)] rounded text-[var(--text-color)] focus:outline-none leading-relaxed"
                      />
                    </div>

                    {/* Classification Labels */}
                    <div>
                      <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                        Hardware Classification Tags
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_LABELS.map((lbl) => {
                          const isSelected = labels.some((l) => l.id === lbl.id);
                          return (
                            <button
                              key={lbl.id}
                              type="button"
                              onClick={() => toggleLabel(lbl)}
                              className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-colors border cursor-pointer',
                                isSelected
                                  ? 'bg-sky-500/20 text-sky-300 border-sky-400 font-bold'
                                  : 'border-[var(--border-color)] bg-[var(--card-subtle)] text-[var(--text-muted)] hover:border-neutral-500'
                              )}
                            >
                              {lbl.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

          {/* Action Footer */}
          <div className="px-4 py-3 border-t border-[var(--border-color)] bg-[var(--card-subtle)] flex items-center justify-between gap-3 shrink-0">
            <div>
              {!isNewTask && task && isAdmin() && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Permanently delete ticket for ${serialNumber || 'this printer'}?`)) {
                      onDelete(task.id);
                      onClose();
                    }
                  }}
                  className="font-mono text-xs uppercase tracking-wider text-red-500 hover:underline cursor-pointer"
                >
                  [Delete Ticket]
                </button>
              )}
              {isNewTask && (
                <span className="hidden sm:inline font-mono text-[10px] text-[var(--text-muted)]">
                  Tip: Press <kbd className="px-1 py-0.5 rounded bg-black border border-neutral-700 text-neutral-300">Ctrl + Enter</kbd> to save
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-md font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-color)] border border-[var(--border-color)] bg-[var(--card-bg)] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={!serialNumber.trim()}
                className="px-5 py-2 rounded-md font-mono text-xs font-bold uppercase tracking-wider bg-[#026aa7] hover:bg-[#025687] dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-black shadow-md transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>{isNewTask ? '✓ Create Ticket' : '💾 Save Ticket Changes'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
