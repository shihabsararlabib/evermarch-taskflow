'use client';

import { useCallback, useMemo, useEffect } from 'react';
import { Board, Task, FilterState } from '@/types';
import { useBoardStore } from '@/store/boardStore';
import { useAuthStore } from '@/store/authStore';
import { boardSchema } from '@/lib/schema';
import { REPAIR_LIMIT_THRESHOLD } from '@/lib/constants';

export function useKanbanBoard() {
  const store = useBoardStore();
  const { currentUser, isAdmin } = useAuthStore();

  // Role-Scoped Workload: Technicians only see tasks assigned to them; Admin sees all workshop bays
  const visibleTasks = useMemo(() => {
    if (!currentUser) return [];
    if (isAdmin()) return store.board.tasks;
    return store.board.tasks.filter((task) => task.assignee?.id === currentUser.id);
  }, [store.board.tasks, currentUser, isAdmin]);

  const getFilteredTasks = useCallback(
    (filter: FilterState) => {
      return visibleTasks.filter((task) => {
        // Non-viable 5+ repair limit filter
        if (filter.nonViableOnly) {
          const count = task.repairCount || 1;
          if (count < REPAIR_LIMIT_THRESHOLD && task.isViable !== false) {
            return false;
          }
        }

        // Search query across serial, model, company, branch, fault, title, description, assignee
        if (filter.search) {
          const search = filter.search.toLowerCase().trim();
          const matchesSerial = task.serialNumber?.toLowerCase().includes(search);
          const matchesModel = task.printerModel?.toLowerCase().includes(search);
          const matchesCompany = task.companyName?.toLowerCase().includes(search);
          const matchesBranch = task.branchName?.toLowerCase().includes(search);
          const matchesFault = task.reportedFault?.toLowerCase().includes(search);
          const matchesTitle = task.title.toLowerCase().includes(search);
          const matchesDescription = task.description?.toLowerCase().includes(search);
          const matchesAssignee = task.assignee?.name.toLowerCase().includes(search);

          if (
            !matchesSerial &&
            !matchesModel &&
            !matchesCompany &&
            !matchesBranch &&
            !matchesFault &&
            !matchesTitle &&
            !matchesDescription &&
            !matchesAssignee
          ) {
            return false;
          }
        }

        // Company filter
        if (filter.company && filter.company !== 'all' && task.companyName !== filter.company) {
          return false;
        }

        // Sub-Branch filter
        if (filter.branch && filter.branch !== 'all' && task.branchName !== filter.branch) {
          return false;
        }

        // Priority filter
        if (filter.priority !== 'all' && task.priority !== filter.priority) return false;

        // Label filter
        if (filter.label !== 'all' && !task.labels.some((l) => l.id === filter.label)) return false;

        // Assignee filter
        if (filter.assignee !== 'all' && task.assignee?.id !== filter.assignee) return false;

        return true;
      });
    },
    [visibleTasks]
  );

  const getTasksByColumn = useCallback(
    (columnId: string, filter: FilterState) => {
      return getFilteredTasks(filter)
        .filter((t) => t.columnId === columnId)
        .sort((a, b) => a.order - b.order);
    },
    [getFilteredTasks]
  );

  const exportBoard = useCallback(() => {
    const data = JSON.stringify(store.board, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Evermarch_Printer_Kanban_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [store.board]);

  const importBoard = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          const result = boardSchema.safeParse(data);
          if (result.success) {
            store.importBoard(result.data as Board);
          } else {
            console.error('Validation error:', result.error);
            alert('Invalid board data format.');
          }
        } catch (error) {
          console.error('Failed to import board:', error);
          alert('Invalid JSON file. Please check the format.');
        }
      };
      reader.readAsText(file);
    },
    [store]
  );

  const nonViableCount = useMemo(() => {
    return visibleTasks.filter(
      (t) => (t.repairCount && t.repairCount >= REPAIR_LIMIT_THRESHOLD) || t.isViable === false
    ).length;
  }, [visibleTasks]);

  const stats = useMemo(() => {
    const total = visibleTasks.length;
    const byColumn = store.board.columns.map((col) => ({
      ...col,
      count: visibleTasks.filter((t) => t.columnId === col.id).length,
    }));
    return { total, byColumn };
  }, [store.board.columns, visibleTasks]);

  // Handle cross-tab synchronization for Zustand
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'evermarch-printer-kanban-data' && e.newValue) {
        try {
          useBoardStore.persist.rehydrate();
        } catch {
          // Ignore rehydrate failure if storage access is restricted
        }
      }
    };
    try {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    } catch {
      // Ignore if window event listener access is restricted
    }
  }, []);

  return {
    board: {
      ...store.board,
      tasks: visibleTasks,
    },
    allTasksCount: store.board.tasks.length,
    addTask: store.addTask,
    updateTask: store.updateTask,
    deleteTask: store.deleteTask,
    moveTask: store.moveTask,
    addColumn: store.addColumn,
    deleteColumn: store.deleteColumn,
    addAssignee: store.addAssignee,
    deleteAssignee: store.deleteAssignee,
    addCompany: store.addCompany,
    addBranch: store.addBranch,
    getTasksByColumn,
    getFilteredTasks,
    exportBoard,
    importBoard,
    undo: store.undo,
    redo: store.redo,
    canUndo: store.historyIndex > 0,
    canRedo: store.historyIndex < store.history.length - 1,
    stats,
    nonViableCount,
  };
}
