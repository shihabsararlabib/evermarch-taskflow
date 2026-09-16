'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Column as ColumnType, Task, FilterState } from '@/types';
import TaskCard from './TaskCard';
import { useAuthStore } from '@/store/authStore';

interface ColumnProps {
  column: ColumnType;
  tasks: Task[];
  filter: FilterState;
  onTaskClick: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (columnId: string) => void;
  onDeleteColumn: (columnId: string) => void;
}

export default function KanbanColumn({
  column,
  tasks,
  filter,
  onTaskClick,
  onDeleteTask,
  onAddTask,
  onDeleteColumn,
}: ColumnProps) {
  const { isAdmin } = useAuthStore();
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  });

  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-shrink-0 w-[330px] md:w-[310px] flex flex-col h-full max-h-full rounded-md bg-[var(--card-subtle)]/70 border border-[var(--border-color)] p-2 transition-colors"
    >
      {/* Station Header */}
      <div className="flex items-center justify-between mb-2 px-1 py-1 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2 h-2 rounded-xs shrink-0"
            style={{ backgroundColor: column.color }}
          />
          <h2 className="text-xs font-bold text-[var(--text-color)] tracking-tight font-mono uppercase truncate">
            {column.title}
          </h2>
          <span className="flex items-center justify-center px-1.5 py-0.2 rounded font-mono text-[10px] font-semibold bg-[var(--card-bg)] text-[var(--text-muted)] border border-[var(--border-color)]">
            {tasks.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {isAdmin() &&
            column.id !== 'intake' &&
            column.id !== 'queue' &&
            column.id !== 'repair' &&
            column.id !== 'qc' &&
            column.id !== 'ready' && (
              <button
                onClick={() => onDeleteColumn(column.id)}
                className="w-5 h-5 rounded border border-transparent hover:border-red-300 dark:hover:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center text-[var(--text-muted)] hover:text-red-600 transition-all cursor-pointer"
                title={`Delete station ${column.title}`}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
        </div>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto overflow-x-hidden p-0.5 space-y-2 min-h-[140px] rounded transition-all duration-120 ${
          isOver
            ? 'bg-blue-50/40 dark:bg-sky-950/25 ring-1 ring-[var(--accent-color)]'
            : ''
        }`}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task)}
                onDelete={() => onDeleteTask(task.id)}
              />
            ))}
          </AnimatePresence>
        </SortableContext>

        {/* Empty Column Prompt */}
        {tasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed border-[var(--border-color)] rounded-md"
          >
            <div className="w-8 h-8 rounded-md bg-[var(--card-bg)] border border-[var(--border-color)] flex items-center justify-center mb-2 text-[var(--text-muted)]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">
              {filter.search || filter.priority !== 'all' || filter.label !== 'all'
                ? 'No matching tickets'
                : 'No tickets in stage'}
            </p>
          </motion.div>
        )}


      </div>
    </motion.div>
  );
}
