'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { Task, FilterState, ViewMode } from '@/types';
import { useKanbanBoard } from '@/hooks/useKanbanBoard';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import Header from './Header';
import KanbanColumn from './Column';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import SearchFilter from './SearchFilter';
import DatabaseView from './DatabaseView';
import LoginModal from './LoginModal';
import AdminPanelModal from './AdminPanelModal';
import { useAuthStore } from '@/store/authStore';

export default function Board() {
  const {
    board,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    addColumn,
    deleteColumn,
    getTasksByColumn,
    exportBoard,
    importBoard,
    undo,
    redo,
    canUndo,
    canRedo,
    stats,
    nonViableCount,
  } = useKanbanBoard();

  const { isAdmin } = useAuthStore();
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewTask, setIsNewTask] = useState(false);
  const [newTaskColumnId, setNewTaskColumnId] = useState('intake');
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [filter, setFilter] = useState<FilterState>({
    search: '',
    priority: 'all',
    label: 'all',
    assignee: 'all',
    company: 'all',
    branch: 'all',
    nonViableOnly: false,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const task = active.data?.current?.task as Task | undefined;
    if (task) {
      setActiveTask(task);
    }
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeTask = active.data?.current?.task as Task | undefined;
      if (!activeTask) return;

      const overType = over.data?.current?.type;
      const overColumnId =
        overType === 'column'
          ? (over.id as string)
          : (over.data?.current?.task as Task)?.columnId;

      if (!overColumnId) return;

      if (activeTask.columnId !== overColumnId) {
        moveTask(activeTask.id, overColumnId, 0);
      }
    },
    [moveTask]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over) return;

      const activeTask = active.data?.current?.task as Task | undefined;
      if (!activeTask) return;

      const overType = over.data?.current?.type;

      if (overType === 'column') {
        const targetColumnId = over.id as string;
        if (activeTask.columnId !== targetColumnId) {
          moveTask(activeTask.id, targetColumnId, 0);
        }
      } else if (overType === 'task') {
        const overTask = over.data?.current?.task as Task | undefined;
        if (!overTask) return;

        const targetColumnId = overTask.columnId;
        const targetIndex = overTask.order;

        if (activeTask.id !== overTask.id) {
          moveTask(activeTask.id, targetColumnId, targetIndex);
        }
      }
    },
    [moveTask]
  );

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsNewTask(false);
    setIsModalOpen(true);
  }, []);

  const handleAddTask = useCallback(
    (columnId?: string) => {
      setSelectedTask(null);
      setIsNewTask(true);
      setNewTaskColumnId(columnId || board.columns[0]?.id || 'intake');
      setIsModalOpen(true);
    },
    [board.columns]
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedTask(null);
    setIsNewTask(false);
  }, []);

  const handleSaveTask = useCallback(
    (taskData: Task) => {
      if (isNewTask) {
        const { id, order, createdAt, updatedAt, ...rest } = taskData;
        addTask(rest);
      } else {
        updateTask(taskData.id, taskData);
      }
    },
    [isNewTask, addTask, updateTask]
  );

  // Keyboard shortcuts
  const shortcuts = useMemo(
    () => [
      { key: 'n', handler: () => handleAddTask(), description: 'New printer job' },
      { key: 'Escape', handler: handleCloseModal, description: 'Close dialog' },
      { key: 'z', ctrl: true, handler: undo, description: 'Undo' },
      { key: 'z', ctrl: true, shift: true, handler: redo, description: 'Redo' },
      { key: 'e', ctrl: true, handler: exportBoard, description: 'Export backup' },
    ],
    [handleAddTask, handleCloseModal, undo, redo, exportBoard]
  );

  useKeyboardShortcuts(shortcuts);

  // Pre-compute tasks per column
  const columnTasks = useMemo(() => {
    const result: Record<string, Task[]> = {};
    for (const col of board.columns) {
      result[col.id] = getTasksByColumn(col.id, filter);
    }
    return result;
  }, [board.columns, getTasksByColumn, filter]);

  const filteredTaskCount = useMemo(
    () => Object.values(columnTasks).reduce((sum, tasks) => sum + tasks.length, 0),
    [columnTasks]
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Header */}
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onExport={exportBoard}
        onImport={importBoard}
        onAddColumn={addColumn}
        totalTasks={stats.total}
        nonViableCount={nonViableCount}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenAdminPanel={isAdmin() ? () => setIsAdminPanelOpen(true) : undefined}
        onNewTask={() => handleAddTask('intake')}
      />

      {/* Main Content Area: Kanban Board vs Database Registry */}
      {viewMode === 'board' ? (
        <div className="flex-1 flex flex-col">
          {/* Search and Filters */}
          <div className="px-4 md:px-6 py-3 max-w-[1900px] mx-auto w-full">
            <SearchFilter
              filter={filter}
              onFilterChange={setFilter}
              taskCount={filteredTaskCount}
              onNewTask={() => handleAddTask('intake')}
            />
          </div>

          {/* Kanban Board with Columns */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 md:px-6 pb-4">
              <motion.div
                className="flex gap-4 h-full min-w-min pb-2"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {board.columns
                  .sort((a, b) => a.order - b.order)
                  .map((column) => (
                    <KanbanColumn
                      key={column.id}
                      column={column}
                      tasks={columnTasks[column.id] || []}
                      filter={filter}
                      onTaskClick={handleTaskClick}
                      onDeleteTask={deleteTask}
                      onAddTask={handleAddTask}
                      onDeleteColumn={deleteColumn}
                    />
                  ))}

                {/* Add Stage Column Placeholder (Admin Only) */}
                {isAdmin() && (
                  <div className="flex-shrink-0 w-[310px]">
                    {isAddingColumn ? (
                      <div className="w-full p-3.5 rounded-md border border-[var(--card-border)] bg-[var(--card-bg)] shadow-xs">
                        <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                          + Configure Workshop Stage
                        </p>
                        <input
                          type="text"
                          value={newColumnTitle}
                          onChange={(e) => setNewColumnTitle(e.target.value)}
                          placeholder="e.g. 06 Ultrasonic Cleaning"
                          className="workshop-input w-full px-2.5 py-1.5 rounded-md text-xs font-mono mb-2.5"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newColumnTitle.trim()) {
                              addColumn(newColumnTitle.trim(), '#026aa7');
                              setNewColumnTitle('');
                              setIsAddingColumn(false);
                            } else if (e.key === 'Escape') {
                              setIsAddingColumn(false);
                            }
                          }}
                        />
                        <div className="flex gap-2 font-mono text-xs">
                          <button
                            onClick={() => setIsAddingColumn(false)}
                            className="flex-1 py-1 text-slate-600 dark:text-slate-400 border border-[var(--card-border)] rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors uppercase tracking-wider text-[11px]"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              if (newColumnTitle.trim()) {
                                addColumn(newColumnTitle.trim(), '#026aa7');
                                setNewColumnTitle('');
                                setIsAddingColumn(false);
                              }
                            }}
                            disabled={!newColumnTitle.trim()}
                            className="flex-1 py-1 font-semibold text-white bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 rounded-md disabled:opacity-50 transition-colors uppercase tracking-wider text-[11px]"
                          >
                            Add Stage
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => setIsAddingColumn(true)}
                        className="w-full h-[120px] rounded-md border border-dashed border-[var(--card-border)] hover:border-slate-400 bg-transparent flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors group cursor-pointer"
                        aria-label="Add new stage"
                      >
                        <div className="w-7 h-7 rounded border border-[var(--card-border)] bg-[var(--card-bg)] flex items-center justify-center text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <span className="font-mono text-[11px] uppercase tracking-wider font-semibold">+ Add Workflow Stage</span>
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
              {activeTask && (
                <div className="rotate-2 opacity-90">
                  <TaskCard task={activeTask} onClick={() => {}} onDelete={() => {}} isDragging />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      ) : (
        /* Database Registry View */
        <div className="flex-1 px-4 md:px-6 py-4 max-w-[1900px] mx-auto w-full">
          <DatabaseView
            tasks={board.tasks}
            columns={board.columns}
            companies={board.companies || []}
            onSelectTask={handleTaskClick}
            onNewTask={() => handleAddTask()}
          />
        </div>
      )}

      {/* Floating Action Button (FAB) - Always visible for 1-click ticket creation */}
      <motion.button
        onClick={() => handleAddTask('intake')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#026aa7] hover:bg-[#025687] dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-black font-mono font-bold text-xs uppercase tracking-wider shadow-xl border-2 border-white/20 dark:border-black/20 cursor-pointer backdrop-blur-xs transition-shadow hover:shadow-2xl"
        title="Create a new printer repair ticket (Shortcut: N)"
        id="fab-new-ticket-btn"
      >
        <div className="w-5 h-5 rounded-full bg-white/20 dark:bg-black/20 flex items-center justify-center">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <span>+ New Ticket</span>
        <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-black/25 dark:bg-black/15 text-[10px] font-mono ml-0.5">
          N
        </kbd>
      </motion.button>

      {/* Task / Repair Modal */}
      <TaskModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveTask}
        onDelete={deleteTask}
        isNewTask={isNewTask}
        defaultColumnId={newTaskColumnId}
      />

      {/* Technician Login & Switch Modal */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

      {/* Supervisor Admin Panel Modal (Strictly Admin Only) */}
      {isAdmin() && (
        <AdminPanelModal isOpen={isAdminPanelOpen} onClose={() => setIsAdminPanelOpen(false)} />
      )}
    </div>
  );
}
