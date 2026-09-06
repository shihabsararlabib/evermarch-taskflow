export type Priority = 'high' | 'medium' | 'low';

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Assignee {
  id: string;
  name: string;
  username?: string;
  role?: 'admin' | 'technician';
  specialization?: string;
  avatar?: string;
}

export interface Company {
  id: string;
  name: string;
  branches: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: Assignee | null;
  labels: Label[];
  dueDate: string | null;
  priority: Priority;
  columnId: string;
  order: number;
  createdAt: string;
  updatedAt: string;

  // Evermarch Bangladesh Printer Repair Specifics
  serialNumber: string;
  printerModel: string;
  companyName: string;
  branchName: string;
  receivedDate: string;
  reportedFault?: string;
  diagnosisNotes?: string;
  partsReplaced?: string;
  isViable?: boolean;
  repairCount?: number;
}

export interface Column {
  id: string;
  title: string;
  order: number;
  color: string;
}

export interface Board {
  columns: Column[];
  tasks: Task[];
  assignees?: Assignee[];
  companies?: Company[];
}

export interface BoardAction {
  type: string;
  payload: Board;
  timestamp: number;
  description: string;
}

export interface FilterState {
  search: string;
  priority: Priority | 'all';
  label: string | 'all';
  assignee: string | 'all';
  company: string | 'all';
  branch: string | 'all';
  nonViableOnly: boolean;
}

export type ViewMode = 'board' | 'database';
