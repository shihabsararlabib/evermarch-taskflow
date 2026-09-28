'use client';

import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types';
import { formatDate, getInitials, getAvatarColor, cn } from '@/lib/utils';
import { PRIORITY_CONFIG, REPAIR_LIMIT_THRESHOLD } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';
import { useBoardStore } from '@/store/boardStore';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onDelete: () => void;
  isDragging?: boolean;
  onRequestDispatchConfirmation?: (task: Task) => void;
}

export default function TaskCard({
  task,
  onClick,
  onDelete,
  isDragging,
  onRequestDispatchConfirmation,
}: TaskCardProps) {
  const { isAdmin } = useAuthStore();
  const columns = useBoardStore((state) => state.board.columns);
  const moveTask = useBoardStore((state) => state.moveTask);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  const isNonViable = (task.repairCount && task.repairCount >= REPAIR_LIMIT_THRESHOLD) || task.isViable === false;

  // Next stage calculation for 1-click advancement
  const currentColumnIndex = columns.findIndex((c) => c.id === task.columnId);
  const nextColumn = currentColumnIndex >= 0 && currentColumnIndex < columns.length - 1
    ? columns[currentColumnIndex + 1]
    : null;

  const handleAdvanceStage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!nextColumn) return;
    if (task.columnId === 'work' && nextColumn.id === 'ready') {
      if (onRequestDispatchConfirmation) {
        onRequestDispatchConfirmation(task);
        return;
      }
    }
    moveTask(task.id, nextColumn.id, 0);
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: isSortableDragging ? 0.45 : 1,
        y: 0,
        scale: isDragging ? 1.02 : 1,
      }}
      exit={{ opacity: 0, scale: 0.96, y: -6 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'group relative rounded-md border text-left select-none transition-all duration-120 cursor-grab active:cursor-grabbing p-3',
        'bg-[var(--card-bg)] text-[var(--text-color)]',
        isNonViable
          ? 'border-red-500/80 dark:border-red-900/80 bg-red-50/30 dark:bg-red-950/25 shadow-xs'
          : 'border-[var(--border-color)] hover:border-[var(--accent-color)] dark:hover:border-neutral-600 shadow-xs',
        isSortableDragging && 'opacity-60 ring-2 ring-[var(--accent-color)]'
      )}
      onClick={(e) => {
        if (isSortableDragging) return;
        onClick();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Top Asset Plate: Priority & Serial */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Priority SLA Tag */}
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0"
            style={{
              backgroundColor: `${priorityConfig.color}15`,
              color: priorityConfig.color,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: priorityConfig.color }} />
            {priorityConfig.label}
          </span>
          {task.serialNumber ? (
            <span className="font-mono text-[11px] text-[var(--text-muted)] truncate opacity-80">
              {task.serialNumber}
            </span>
          ) : (
            <span className="text-[11px] text-[var(--text-muted)] opacity-60">No Serial</span>
          )}

          {/* Repeat Visit Badge */}
          {task.repairCount && task.repairCount > 1 && !isNonViable && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-500">
              Visit #{task.repairCount}
            </span>
          )}
        </div>
      </div>

      {/* CRITICAL 5+ REPAIR EQUIPMENT DECOMMISSIONING NOTICE */}
      {isNonViable && (
        <div className="mb-3 p-2.5 rounded-md bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 text-xs border-l-4 border-red-500">
          <div className="flex items-center justify-between font-semibold tracking-tight text-red-700 dark:text-red-400">
            <span>Decommission Advisory</span>
            <span className="px-1.5 py-0.5 rounded bg-red-600/10 text-red-600 dark:text-red-400 text-[10px] font-bold">
              {task.repairCount || 5}th Repair
            </span>
          </div>
          <p className="text-[11px] text-red-800 dark:text-red-300 mt-1 leading-snug">
            Exceeds 5-repair threshold. Equipment deemed economically non-viable.
          </p>
        </div>
      )}

      {/* Equipment Model & Client Organization */}
      <div className="mb-2">
        <h3 className="text-[13px] font-semibold text-[var(--text-color)] font-sans truncate leading-tight">
          {task.printerModel || 'Printer Unit'}
        </h3>
        {(task.companyName || task.branchName) && (
          <p className="text-[12px] text-[var(--text-muted)] font-medium truncate mt-1">
            {task.companyName} {task.branchName ? `· ${task.branchName}` : ''}
          </p>
        )}
      </div>

      {/* Reported Technical Fault */}
      <p className="text-[12px] text-[var(--text-color)]/80 line-clamp-2 leading-relaxed mb-3">
        {task.reportedFault || task.title}
      </p>

      {/* Diagnostic Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {task.labels.map((label) => (
            <span
              key={label.id}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
              style={{
                backgroundColor: `${label.color}15`,
                color: label.color,
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Docket Footer: Technical Metadata, Technician, & 1-Click Advance */}
      <div className="flex items-center justify-between pt-2.5 border-t border-[var(--border-color)]/50 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Assigned Technician */}
          {task.assignee ? (
            <div className="flex items-center gap-1.5" title={`Technician: ${task.assignee.name}`}>
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shrink-0"
                style={{ backgroundColor: getAvatarColor(task.assignee.name) }}
              >
                {getInitials(task.assignee.name)}
              </div>
              <span className="text-[var(--text-muted)] text-[11px] font-medium truncate max-w-[80px]">
                {task.assignee.name.split(' ')[0]}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-[var(--text-muted)] font-medium italic">Unassigned</span>
          )}
        </div>

        {/* 1-Click Next Stage Advance Button */}
        {nextColumn ? (
          <button
            type="button"
            onClick={handleAdvanceStage}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 transition-colors cursor-pointer shrink-0"
            title={`Quick advance ticket to ${nextColumn.title}`}
          >
            <span>{nextColumn.title.split(' ')[0]}</span>
            <span>➔</span>
          </button>
        ) : (
          <span className="text-[11px] text-emerald-500 font-medium">
            ✓ Completed
          </span>
        )}
      </div>

      {/* Delete Shortcut Button (Admin Only) */}
      {isAdmin() && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-2 right-2 w-5 h-5 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--card-subtle)] text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
          title="Delete ticket (Admin Only)"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </motion.div>
  );
}
