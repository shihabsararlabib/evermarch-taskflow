'use client';

import { Board, Task } from '@/types';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'pending';

interface PendingMutation {
  id: string;
  action: 'upsert-task' | 'delete-task' | 'full-sync';
  task?: Task;
  taskId?: string;
  timestamp: number;
}

const SYNC_QUEUE_KEY = 'evermarch_sync_queue';

class SyncManager {
  private status: SyncStatus = 'synced';
  private listeners: Set<(status: SyncStatus) => void> = new Set();
  private queue: PendingMutation[] = [];
  private syncTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadQueue();
      this.status = navigator.onLine ? 'synced' : 'offline';

      window.addEventListener('online', () => {
        this.setStatus('syncing');
        this.flushQueue();
      });

      window.addEventListener('offline', () => {
        this.setStatus('offline');
      });

      // Background poll every 25s for multi-PC syncing
      this.syncTimer = setInterval(() => {
        if (navigator.onLine && this.status !== 'syncing') {
          this.pullRemoteChanges();
        }
      }, 25000);
    }
  }

  public getStatus(): SyncStatus {
    return this.status;
  }

  public subscribe(fn: (status: SyncStatus) => void) {
    this.listeners.add(fn);
    fn(this.status);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private setStatus(newStatus: SyncStatus) {
    this.status = newStatus;
    this.listeners.forEach((fn) => fn(this.status));
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem(SYNC_QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch {
      this.queue = [];
    }
  }

  private persistQueue() {
    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (e) {
      console.warn('Failed to persist sync queue:', e);
    }
  }

  public queueMutation(action: 'upsert-task' | 'delete-task', payload: { task?: Task; taskId?: string }, currentBoard?: Board) {
    const mutation: PendingMutation = {
      id: Math.random().toString(36).substring(2, 9),
      action,
      task: payload.task,
      taskId: payload.taskId,
      timestamp: Date.now(),
    };

    this.queue.push(mutation);
    this.persistQueue();

    if (navigator.onLine) {
      this.flushQueue(currentBoard);
    } else {
      this.setStatus('offline');
    }
  }

  public async flushQueue(currentBoard?: Board) {
    if (!navigator.onLine) {
      this.setStatus('offline');
      return;
    }

    if (this.queue.length === 0) {
      this.setStatus('synced');
      return;
    }

    this.setStatus('syncing');

    try {
      const itemsToSync = [...this.queue];
      for (const item of itemsToSync) {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: item.action,
            task: item.task,
            taskId: item.taskId,
            board: currentBoard,
          }),
        });
      }

      // Clear synced items
      this.queue = this.queue.filter((q) => !itemsToSync.some((s) => s.id === q.id));
      this.persistQueue();
      this.setStatus('synced');
    } catch (err) {
      console.warn('Sync queue flush failed, will retry:', err);
      this.setStatus('pending');
    }
  }

  public async pullRemoteChanges(onUpdate?: (boardData: any) => void) {
    if (!navigator.onLine) return;

    try {
      const res = await fetch('/api/sync');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          if (onUpdate) {
            onUpdate(json.data);
          }
        }
      }
    } catch {
      // Network hiccup, retry next interval
    }
  }
}

export const syncManager = new SyncManager();
