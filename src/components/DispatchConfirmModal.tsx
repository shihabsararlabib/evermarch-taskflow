'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { Task } from '@/types';

interface DispatchConfirmModalProps {
  isOpen: boolean;
  task: Task | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DispatchConfirmModal({
  isOpen,
  task,
  onConfirm,
  onCancel,
}: DispatchConfirmModalProps) {
  // Support Escape to cancel, Enter to confirm
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && task && (
        <div key="dispatch-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            key="dispatch-modal-card"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.16 }}
            className="w-full max-w-md bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-xl overflow-hidden text-[var(--text-color)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dispatch-modal-title"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-[var(--border-color)] bg-[var(--card-subtle)] flex items-start gap-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h3 id="dispatch-modal-title" className="text-sm font-bold font-sans tracking-tight text-[var(--text-color)]">
                Move Ticket to Dispatch?
              </h3>
              <p className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
                Station Transition: 02 In Work ➔ 03 Dispatch Ready
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to mark this repair as complete and advance the ticket to <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">03 Dispatch Ready</strong>?
            </p>

            {/* Ticket Card Summary */}
            <div className="p-3.5 rounded-md border border-[var(--border-color)] bg-[var(--card-subtle)]/70 space-y-2 font-mono">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Serial #</span>
                <span className="font-bold text-[var(--text-color)] text-xs bg-[var(--card-bg)] px-2 py-0.5 rounded border border-[var(--border-color)]">
                  {task.serialNumber || 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Model</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold text-xs truncate max-w-[200px]">
                  {task.printerModel || 'Printer Unit'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Client</span>
                <span className="text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                  {task.companyName} {task.branchName ? `(${task.branchName})` : ''}
                </span>
              </div>

              {task.assignee && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Technician</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {task.assignee.name}
                  </span>
                </div>
              )}

              {task.reportedFault && (
                <div className="pt-1.5 border-t border-[var(--border-color)]/60 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Fault: {task.reportedFault}
                </div>
              )}
            </div>

            {/* Quality Checklist Notice */}
            <div className="p-2.5 rounded-md border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] flex items-start gap-2">
              <span className="shrink-0 mt-0.5 font-bold">ℹ</span>
              <span>
                Please ensure all overhaul tasks, parts replacements, and print quality tests have passed before finalizing dispatch.
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-5 py-3.5 border-t border-[var(--border-color)] bg-[var(--card-subtle)] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-[var(--border-color)] transition-colors cursor-pointer"
            >
              Cancel (Keep in Work)
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-1.5 rounded-md text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              autoFocus
            >
              <span>Confirm & Dispatch</span>
              <span>➔</span>
            </button>
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
