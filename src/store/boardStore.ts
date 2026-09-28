import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeLocalStorage } from '@/lib/safeStorage';
import { Board, Task, Column, Company } from '@/types';
import { generateId } from '@/lib/utils';
import { DEFAULT_COLUMNS, STORAGE_KEY, PRESET_ASSIGNEES, PRESET_COMPANIES, PRESET_LABELS } from '@/lib/constants';
import { boardSchema } from '@/lib/schema';


interface BoardState {
  board: Board;
  history: Board[];
  historyIndex: number;
  addTask: (task: Omit<Task, 'id' | 'order' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, targetColumnId: string, targetIndex: number) => void;
  addColumn: (title: string, color: string) => void;
  deleteColumn: (columnId: string) => void;
  addAssignee: (name: string) => void;
  deleteAssignee: (assigneeId: string) => void;
  addCompany: (name: string, branches?: string[]) => void;
  deleteCompany: (companyId: string) => void;
  addBranch: (companyName: string, branchName: string) => void;
  importBoard: (data: Board) => void;
  undo: () => void;
  redo: () => void;
  getRepairHistoryBySerial: (serialNumber: string) => Task[];
  getSerialRepairCount: (serialNumber: string, excludeTaskId?: string) => number;
}

// Initial realistic dataset for Evermarch Bangladesh
const sampleInitialTasks: Task[] = [
  {
    "id": "task-imported-0",
    "title": "[214] Paper Jam",
    "serialNumber": "NKLA026568",
    "printerModel": "214",
    "companyName": "Pran RFL",
    "branchName": "Badda",
    "receivedDate": "2026-08-02T00:00:00.000Z",
    "reportedFault": "Paper Jam",
    "diagnosisNotes": "",
    "partsReplaced": "T.P-1",
    "description": "<p>Complainer: Ibrahim 01679823948</p><p>Cost TK: 450</p><p>Page Count: 540389</p>",
    "assignee": {
      "id": "user-1",
      "name": "Rasel Pran",
      "username": "rasel",
      "role": "technician",
      "specialization": "General Technician"
    },
    "labels": [],
    "dueDate": "2026-08-05",
    "priority": "medium",
    "columnId": "work",
    "order": 0,
    "createdAt": "2026-08-02T00:00:00.000Z",
    "updatedAt": "2026-08-02T00:00:00.000Z",
    "repairCount": 1,
    "isViable": true
  },
  {
    "id": "task-imported-1",
    "title": "[243] Paper Jam",
    "serialNumber": "PCFA024491",
    "printerModel": "243",
    "companyName": "Pran RFL",
    "branchName": "Keranigonj Depot",
    "receivedDate": "2026-08-02T00:00:00.000Z",
    "reportedFault": "Paper Jam",
    "diagnosisNotes": "",
    "partsReplaced": "T.P-1",
    "description": "<p>Complainer: Bokul 01704149025</p><p>Cost TK: 450</p><p>Page Count: 264963</p>",
    "assignee": {
      "id": "user-1",
      "name": "Rasel Pran",
      "username": "rasel",
      "role": "technician",
      "specialization": "General Technician"
    },
    "labels": [],
    "dueDate": "2026-08-05",
    "priority": "medium",
    "columnId": "intake",
    "order": 1,
    "createdAt": "2026-08-02T00:00:00.000Z",
    "updatedAt": "2026-08-02T00:00:00.000Z",
    "repairCount": 1,
    "isViable": true
  },
  {
    "id": "task-imported-2",
    "title": "[243] General Repair",
    "serialNumber": "PCFA023720",
    "printerModel": "243",
    "companyName": "Pran RFL",
    "branchName": "PIP, Bread",
    "receivedDate": "2026-08-02T00:00:00.000Z",
    "reportedFault": "General Repair",
    "diagnosisNotes": "",
    "partsReplaced": "Service",
    "description": "<p>Complainer: N/A</p><p>Cost TK: 0</p><p>Page Count: 829300</p>",
    "assignee": {
      "id": "user-2",
      "name": "Symon Rasel",
      "username": "symon",
      "role": "technician",
      "specialization": "General Technician"
    },
    "labels": [],
    "dueDate": "2026-08-05",
    "priority": "medium",
    "columnId": "intake",
    "order": 2,
    "createdAt": "2026-08-02T00:00:00.000Z",
    "updatedAt": "2026-08-02T00:00:00.000Z",
    "repairCount": 1,
    "isViable": true
  },
  {
    "id": "task-imported-3",
    "title": "[243] General Repair",
    "serialNumber": "PCFA023629",
    "printerModel": "243",
    "companyName": "Pran RFL",
    "branchName": "PIP, Bread",
    "receivedDate": "2026-08-02T00:00:00.000Z",
    "reportedFault": "General Repair",
    "diagnosisNotes": "",
    "partsReplaced": "T.P-1",
    "description": "<p>Complainer: N/A</p><p>Cost TK: 450</p><p>Page Count: 607888</p>",
    "assignee": {
      "id": "user-2",
      "name": "Symon Rasel",
      "username": "symon",
      "role": "technician",
      "specialization": "General Technician"
    },
    "labels": [],
    "dueDate": "2026-08-05",
    "priority": "medium",
    "columnId": "work",
    "order": 3,
    "createdAt": "2026-08-02T00:00:00.000Z",
    "updatedAt": "2026-08-02T00:00:00.000Z",
    "repairCount": 1,
    "isViable": true
  },
  {
    "id": "task-imported-4",
    "title": "[214] Paper Jam",
    "serialNumber": "NKLA026851",
    "printerModel": "214",
    "companyName": "Pran RFL",
    "branchName": "Bagher Bazar",
    "receivedDate": "2026-08-02T00:00:00.000Z",
    "reportedFault": "Paper Jam",
    "diagnosisNotes": "",
    "partsReplaced": "Service",
    "description": "<p>Complainer: Ranjon Ali 01844607030</p><p>Cost TK: 0</p><p>Page Count: 105883</p>",
    "assignee": {
      "id": "user-2",
      "name": "Symon Rasel",
      "username": "symon",
      "role": "technician",
      "specialization": "General Technician"
    },
    "labels": [],
    "dueDate": "2026-08-05",
    "priority": "medium",
    "columnId": "intake",
    "order": 4,
    "createdAt": "2026-08-02T00:00:00.000Z",
    "updatedAt": "2026-08-02T00:00:00.000Z",
    "repairCount": 1,
    "isViable": true
  },
  {
    "id": "task-imported-5",
    "title": "[6230] Paper Jam",
    "serialNumber": "NCBA185714 NPJA134522",
    "printerModel": "6230",
    "companyName": "Pran RFL",
    "branchName": "Patira",
    "receivedDate": "2026-08-02T00:00:00.000Z",
    "reportedFault": "Paper Jam",
    "diagnosisNotes": "",
    "partsReplaced": "Pressure R-1 +  T.P-1 (OLD)",
    "description": "<p>Complainer: Raju Ahmad 01704149643</p><p>Cost TK: 0</p><p>Page Count: N/A</p>",
    "assignee": {
      "id": "user-3",
      "name": "Junaid",
      "username": "junaid",
      "role": "technician",
      "specialization": "General Technician"
    },
    "labels": [],
    "dueDate": "2026-08-05",
    "priority": "medium",
    "columnId": "work",
    "order": 5,
    "createdAt": "2026-08-02T00:00:00.000Z",
    "updatedAt": "2026-08-02T00:00:00.000Z",
    "repairCount": 1,
    "isViable": true
  },
  {
    "id": "task-imported-6",
    "title": "[1102] Paper Jam",
    "serialNumber": "VNF8847377",
    "printerModel": "1102",
    "companyName": "Pran RFL",
    "branchName": "Bagher Para",
    "receivedDate": "2026-08-02T00:00:00.000Z",
    "reportedFault": "Paper Jam",
    "diagnosisNotes": "",
    "partsReplaced": "Service",
    "description": "<p>Complainer: Ramjan Ali 01844607030</p><p>Cost TK: 0</p><p>Page Count: N/A</p>",
    "assignee": {
      "id": "user-2",
      "name": "Symon Rasel",
      "username": "symon",
      "role": "technician",
      "specialization": "General Technician"
    },
    "labels": [],
    "dueDate": "2026-08-05",
    "priority": "medium",
    "columnId": "work",
    "order": 6,
    "createdAt": "2026-08-02T00:00:00.000Z",
    "updatedAt": "2026-08-02T00:00:00.000Z",
    "repairCount": 1,
    "isViable": true
  },
  {
    "id": "task-imported-7",
    "title": "[6000] Paper Jam",
    "serialNumber": "MSXA134569",
    "printerModel": "6000",
    "companyName": "Pran RFL",
    "branchName": "Badda",
    "receivedDate": "2026-08-03T00:00:00.000Z",
    "reportedFault": "Paper Jam",
    "diagnosisNotes": "",
    "partsReplaced": "Service",
    "description": "<p>Complainer: 1844658493</p><p>Cost TK: 0</p><p>Page Count: 147365</p>",
    "assignee": {
      "id": "user-2",
      "name": "Symon Rasel",
      "username": "symon",
      "role": "technician",
      "specialization": "General Technician"
    },
    "labels": [],
    "dueDate": "2026-08-06",
    "priority": "medium",
    "columnId": "intake",
    "order": 7,
    "createdAt": "2026-08-03T00:00:00.000Z",
    "updatedAt": "2026-08-03T00:00:00.000Z",
    "repairCount": 1,
    "isViable": true
  },
  {
    "id": "task-imported-8",
    "title": "[214] Paper Jam",
    "serialNumber": "NKLA026989",
    "printerModel": "214",
    "companyName": "Pran RFL",
    "branchName": "Badda",
    "receivedDate": "2026-08-03T00:00:00.000Z",
    "reportedFault": "Paper Jam",
    "diagnosisNotes": "",
    "partsReplaced": "Service",
    "description": "<p>Complainer: 1704133147</p><p>Cost TK: 0</p><p>Page Count: N/A</p>",
    "assignee": {
      "id": "user-1",
      "name": "Rasel Pran",
      "username": "rasel",
      "role": "technician",
      "specialization": "General Technician"
    },
    "labels": [],
    "dueDate": "2026-08-06",
    "priority": "medium",
    "columnId": "intake",
    "order": 8,
    "createdAt": "2026-08-03T00:00:00.000Z",
    "updatedAt": "2026-08-03T00:00:00.000Z",
    "repairCount": 1,
    "isViable": true
  },
  {
    "id": "task-imported-9",
    "title": "[214] General Repair",
    "serialNumber": "NKLA026413",
    "printerModel": "214",
    "companyName": "Pran RFL",
    "branchName": "Pran Center, Badda",
    "receivedDate": "2026-08-03T00:00:00.000Z",
    "reportedFault": "General Repair",
    "diagnosisNotes": "",
    "partsReplaced": "Pressure R-1 +  T.P-1 (OLD)",
    "description": "<p>Complainer: Showkat Ali</p><p>Cost TK: 0</p><p>Page Count: 399437</p>",
    "assignee": {
      "id": "user-2",
      "name": "Symon Rasel",
      "username": "symon",
      "role": "technician",
      "specialization": "General Technician"
    },
    "labels": [],
    "dueDate": "2026-08-06",
    "priority": "medium",
    "columnId": "work",
    "order": 9,
    "createdAt": "2026-08-03T00:00:00.000Z",
    "updatedAt": "2026-08-03T00:00:00.000Z",
    "repairCount": 1,
    "isViable": true
  },
  {
    "id": "task-imported-10",
    "title": "[214] General Repair",
    "serialNumber": "NKLA021435",
    "printerModel": "214",
    "companyName": "Pran RFL",
    "branchName": "Pran Center, Badda",
    "receivedDate": "2026-08-03T00:00:00.000Z",
    "reportedFault": "General Repair",
    "diagnosisNotes": "",
    "partsReplaced": "Hitting Lamp-1 + T.P-1",
    "description": "<p>Complainer: 1769696051</p><p>Cost TK: 0</p><p>Page Count: 792235</p>",
    "assignee": {
      "id": "user-2",
      "name": "Symon Rasel",
      "username": "symon",
      "role": "technician",
      "specialization": "General Technician"
    },
    "labels": [],
    "dueDate": "2026-08-06",
    "priority": "medium",
    "columnId": "work",
    "order": 10,
    "createdAt": "2026-08-03T00:00:00.000Z",
    "updatedAt": "2026-08-03T00:00:00.000Z",
    "repairCount": 1,
    "isViable": true
  },
  {
    "id": "task-imported-11",
    "title": "[214] Paper Jam",
    "serialNumber": "NKLA019103",
    "printerModel": "214",
    "companyName": "Pran RFL",
    "branchName": "Badda",
    "receivedDate": "2026-08-04T00:00:00.000Z",
    "reportedFault": "Paper Jam",
    "diagnosisNotes": "",
    "partsReplaced": "Service",
    "description": "<p>Complainer: Uttam Kumar 01844200505</p><p>Cost TK: 0</p><p>Page Count: 220433</p>",
    "assignee": {
      "id": "user-1",
      "name": "Rasel Pran",
      "username": "rasel",
      "role": "technician",
      "specialization": "General Technician"
    },
    "labels": [],
    "dueDate": "2026-08-07",
    "priority": "medium",
    "columnId": "intake",
    "order": 11,
    "createdAt": "2026-08-04T00:00:00.000Z",
    "updatedAt": "2026-08-04T00:00:00.000Z",
    "repairCount": 1,
    "isViable": true
  },
  {
    "id": "task-imported-12",
    "title": "[214] Paper Jam",
    "serialNumber": "NKLA026412",
    "printerModel": "214",
    "companyName": "Pran RFL",
    "branchName": "Patira",
    "receivedDate": "2026-08-04T00:00:00.000Z",
    "reportedFault": "Paper Jam",
    "diagnosisNotes": "",
    "partsReplaced": "Service",
    "description": "<p>Complainer: Hafiz 01756256958</p><p>Cost TK: 0</p><p>Page Count: 116207</p>",
    "assignee": {
      "id": "user-1",
      "name": "Rasel Pran",
      "username": "rasel",
      "role": "technician",
      "specialization": "General Technician"
    },
    "labels": [],
    "dueDate": "2026-08-07",
    "priority": "medium",
    "columnId": "work",
    "order": 12,
    "createdAt": "2026-08-04T00:00:00.000Z",
    "updatedAt": "2026-08-04T00:00:00.000Z",
    "repairCount": 1,
    "isViable": true
  },
  {
    "id": "task-imported-13",
    "title": "[402] Paper Jam",
    "serialNumber": "PHCND41675",
    "printerModel": "402",
    "companyName": "Pran RFL",
    "branchName": "Patira",
    "receivedDate": "2026-08-04T00:00:00.000Z",
    "reportedFault": "Paper Jam",
    "diagnosisNotes": "",
    "partsReplaced": "Service",
    "description": "<p>Complainer: Hafiz 01756256958</p><p>Cost TK: 0</p><p>Page Count: N/A</p>",
    "assignee": {
      "id": "user-1",
      "name": "Rasel Pran",
      "username": "rasel",
      "role": "technician",
      "specialization": "General Technician"
    },
    "labels": [],
    "dueDate": "2026-08-07",
    "priority": "medium",
    "columnId": "intake",
    "order": 13,
    "createdAt": "2026-08-04T00:00:00.000Z",
    "updatedAt": "2026-08-04T00:00:00.000Z",
    "repairCount": 1,
    "isViable": true
  },
  {
    "id": "task-imported-14",
    "title": "[214] Paper Jam",
    "serialNumber": "NKLA026326",
    "printerModel": "214",
    "companyName": "Pran RFL",
    "branchName": "Badda",
    "receivedDate": "2026-08-04T00:00:00.000Z",
    "reportedFault": "Paper Jam",
    "diagnosisNotes": "",
    "partsReplaced": "Service",
    "description": "<p>Complainer: Rasel 017696069</p><p>Cost TK: 0</p><p>Page Count: 220318</p>",
    "assignee": {
      "id": "user-1",
      "name": "Rasel Pran",
      "username": "rasel",
      "role": "technician",
      "specialization": "General Technician"
    },
    "labels": [],
    "dueDate": "2026-08-07",
    "priority": "medium",
    "columnId": "intake",
    "order": 14,
    "createdAt": "2026-08-04T00:00:00.000Z",
    "updatedAt": "2026-08-04T00:00:00.000Z",
    "repairCount": 1,
    "isViable": true
  },
  {
    "id": "task-imported-15",
    "title": "[6030] No Print",
    "serialNumber": "NQSA168855",
    "printerModel": "6030",
    "companyName": "Pran RFL",
    "branchName": "Matiara, Comilla",
    "receivedDate": "2026-08-04T00:00:00.000Z",
    "reportedFault": "No Print",
    "diagnosisNotes": "",
    "partsReplaced": "Service",
    "description": "<p>Complainer: Abir 01717090753</p><p>Cost TK: 0</p><p>Page Count: 103773</p>",
    "assignee": {
      "id": "user-4",
      "name": "Rashed",
      "username": "rashed",
      "role": "technician",
      "specialization": "General Technician"
    },
    "labels": [],
    "dueDate": "2026-08-07",
    "priority": "medium",
    "columnId": "work",
    "order": 15,
    "createdAt": "2026-08-04T00:00:00.000Z",
    "updatedAt": "2026-08-04T00:00:00.000Z",
    "repairCount": 1,
    "isViable": true
  },
  {
    "id": "task-imported-16",
    "title": "[6030] Paper Jam",
    "serialNumber": "NBHA148697",
    "printerModel": "6030",
    "companyName": "Pran RFL",
    "branchName": "Matiara, Comilla",
    "receivedDate": "2026-08-04T00:00:00.000Z",
    "reportedFault": "Paper Jam",
    "diagnosisNotes": "",
    "partsReplaced": "Pickup R-1",
    "description": "<p>Complainer: Abir 01717090753</p><p>Cost TK: 0</p><p>Page Count: N/A</p>",
    "assignee": {
      "id": "user-4",
      "name": "Rashed",
      "username": "rashed",
      "role": "technician",
      "specialization": "General Technician"
    },
    "labels": [],
    "dueDate": "2026-08-07",
    "priority": "medium",
    "columnId": "intake",
    "order": 16,
    "createdAt": "2026-08-04T00:00:00.000Z",
    "updatedAt": "2026-08-04T00:00:00.000Z",
    "repairCount": 1,
    "isViable": true
  },
  {
    "id": "task-imported-17",
    "title": "[242] Paper Jam",
    "serialNumber": "PCFA023722",
    "printerModel": "242",
    "companyName": "Pran RFL",
    "branchName": "Matiara, Comilla",
    "receivedDate": "2026-08-04T00:00:00.000Z",
    "reportedFault": "Paper Jam",
    "diagnosisNotes": "",
    "partsReplaced": "T.P-1",
    "description": "<p>Complainer: Abir 01717090753</p><p>Cost TK: 0</p><p>Page Count: 421743</p>",
    "assignee": {
      "id": "user-4",
      "name": "Rashed",
      "username": "rashed",
      "role": "technician",
      "specialization": "General Technician"
    },
    "labels": [],
    "dueDate": "2026-08-07",
    "priority": "medium",
    "columnId": "intake",
    "order": 17,
    "createdAt": "2026-08-04T00:00:00.000Z",
    "updatedAt": "2026-08-04T00:00:00.000Z",
    "repairCount": 1,
    "isViable": true
  },
  {
    "id": "task-imported-18",
    "title": "[214] Paper Jam",
    "serialNumber": "NKLA012899",
    "printerModel": "214",
    "companyName": "Pran RFL",
    "branchName": "Matiara, Comilla",
    "receivedDate": "2026-08-04T00:00:00.000Z",
    "reportedFault": "Paper Jam",
    "diagnosisNotes": "",
    "partsReplaced": "T.P-1",
    "description": "<p>Complainer: Abir 01717090753</p><p>Cost TK: 450</p><p>Page Count: 112880</p>",
    "assignee": {
      "id": "user-4",
      "name": "Rashed",
      "username": "rashed",
      "role": "technician",
      "specialization": "General Technician"
    },
    "labels": [],
    "dueDate": "2026-08-07",
    "priority": "medium",
    "columnId": "work",
    "order": 18,
    "createdAt": "2026-08-04T00:00:00.000Z",
    "updatedAt": "2026-08-04T00:00:00.000Z",
    "repairCount": 1,
    "isViable": true
  },
  {
    "id": "task-imported-19",
    "title": "[214] Bad Sound",
    "serialNumber": "NKLA026889",
    "printerModel": "214",
    "companyName": "Pran RFL",
    "branchName": "CNF, CTG",
    "receivedDate": "2026-08-05T00:00:00.000Z",
    "reportedFault": "Bad Sound",
    "diagnosisNotes": "",
    "partsReplaced": "Tray Pad-1 + Pickup R-1",
    "description": "<p>Complainer: Rakib Hasan</p><p>Cost TK: 0</p><p>Page Count: 124146</p>",
    "assignee": {
      "id": "user-4",
      "name": "Rashed",
      "username": "rashed",
      "role": "technician",
      "specialization": "General Technician"
    },
    "labels": [],
    "dueDate": "2026-08-08",
    "priority": "medium",
    "columnId": "intake",
    "order": 19,
    "createdAt": "2026-08-05T00:00:00.000Z",
    "updatedAt": "2026-08-05T00:00:00.000Z",
    "repairCount": 1,
    "isViable": true
  },
  {
    "id": "task-imported-20",
    "title": "[6230] Black Print All Page",
    "serialNumber": "NCBA185698",
    "printerModel": "6230",
    "companyName": "Pran RFL",
    "branchName": "Kasem Jute Mills, CTG",
    "receivedDate": "2026-08-05T00:00:00.000Z",
    "reportedFault": "Black Print All Page",
    "diagnosisNotes": "",
    "partsReplaced": "Power Suplly-1",
    "description": "<p>Complainer: 1894846029</p><p>Cost TK: 0</p><p>Page Count: 279761</p>",
    "assignee": {
      "id": "user-4",
      "name": "Rashed",
      "username": "rashed",
      "role": "technician",
      "specialization": "General Technician"
    },
    "labels": [],
    "dueDate": "2026-08-08",
    "priority": "medium",
    "columnId": "work",
    "order": 20,
    "createdAt": "2026-08-05T00:00:00.000Z",
    "updatedAt": "2026-08-05T00:00:00.000Z",
    "repairCount": 1,
    "isViable": true
  },
  {
    "id": "task-imported-21",
    "title": "[402] Light INK",
    "serialNumber": "PHCND64069",
    "printerModel": "402",
    "companyName": "Pran RFL",
    "branchName": "City Gate, CTG",
    "receivedDate": "2026-08-05T00:00:00.000Z",
    "reportedFault": "Light INK",
    "diagnosisNotes": "",
    "partsReplaced": "Service",
    "description": "<p>Complainer: Masud 01844664001</p><p>Cost TK: 0</p><p>Page Count: 456965</p>",
    "assignee": {
      "id": "user-4",
      "name": "Rashed",
      "username": "rashed",
      "role": "technician",
      "specialization": "General Technician"
    },
    "labels": [],
    "dueDate": "2026-08-08",
    "priority": "medium",
    "columnId": "work",
    "order": 21,
    "createdAt": "2026-08-05T00:00:00.000Z",
    "updatedAt": "2026-08-05T00:00:00.000Z",
    "repairCount": 1,
    "isViable": true
  },
  {
    "id": "task-imported-22",
    "title": "[6030] Paper Jam",
    "serialNumber": "NQSA162033",
    "printerModel": "6030",
    "companyName": "Pran RFL",
    "branchName": "City Gate, CTG",
    "receivedDate": "2026-08-05T00:00:00.000Z",
    "reportedFault": "Paper Jam",
    "diagnosisNotes": "",
    "partsReplaced": "T.P-1",
    "description": "<p>Complainer: Masud 01844664001</p><p>Cost TK: 175</p><p>Page Count: N/A</p>",
    "assignee": {
      "id": "user-4",
      "name": "Rashed",
      "username": "rashed",
      "role": "technician",
      "specialization": "General Technician"
    },
    "labels": [],
    "dueDate": "2026-08-08",
    "priority": "medium",
    "columnId": "intake",
    "order": 22,
    "createdAt": "2026-08-05T00:00:00.000Z",
    "updatedAt": "2026-08-05T00:00:00.000Z",
    "repairCount": 1,
    "isViable": true
  },
  {
    "id": "task-imported-23",
    "title": "[6030] Paper Jam",
    "serialNumber": "NQSA222207",
    "printerModel": "6030",
    "companyName": "Pran RFL",
    "branchName": "Kasem Jute Mills, CTG",
    "receivedDate": "2026-08-05T00:00:00.000Z",
    "reportedFault": "Paper Jam",
    "diagnosisNotes": "",
    "partsReplaced": "T.P-1",
    "description": "<p>Complainer: 1894846029</p><p>Cost TK: 175</p><p>Page Count: N/A</p>",
    "assignee": {
      "id": "user-4",
      "name": "Rashed",
      "username": "rashed",
      "role": "technician",
      "specialization": "General Technician"
    },
    "labels": [],
    "dueDate": "2026-08-08",
    "priority": "medium",
    "columnId": "intake",
    "order": 23,
    "createdAt": "2026-08-05T00:00:00.000Z",
    "updatedAt": "2026-08-05T00:00:00.000Z",
    "repairCount": 1,
    "isViable": true
  },
  {
    "id": "task-imported-24",
    "title": "[214] Paper Jam",
    "serialNumber": "NKLA020906",
    "printerModel": "214",
    "companyName": "Pran RFL",
    "branchName": "CNF, CTG",
    "receivedDate": "2026-08-06T00:00:00.000Z",
    "reportedFault": "Paper Jam",
    "diagnosisNotes": "",
    "partsReplaced": "Upper Pickup R-1",
    "description": "<p>Complainer: Rakib Hasan</p><p>Cost TK: 0</p><p>Page Count: 909913</p>",
    "assignee": {
      "id": "user-4",
      "name": "Rashed",
      "username": "rashed",
      "role": "technician",
      "specialization": "General Technician"
    },
    "labels": [],
    "dueDate": "2026-08-09",
    "priority": "medium",
    "columnId": "work",
    "order": 24,
    "createdAt": "2026-08-06T00:00:00.000Z",
    "updatedAt": "2026-08-06T00:00:00.000Z",
    "repairCount": 1,
    "isViable": true
  },
  {
    "id": "task-imported-25",
    "title": "[6030] Paper Jam",
    "serialNumber": "PCLA610059",
    "printerModel": "6030",
    "companyName": "Pran RFL",
    "branchName": "Chokoria, CTG",
    "receivedDate": "2026-08-06T00:00:00.000Z",
    "reportedFault": "Paper Jam",
    "diagnosisNotes": "",
    "partsReplaced": "Pickup R-1 + T.P-1",
    "description": "<p>Complainer: Sajid Hasan 01894846030</p><p>Cost TK: 0</p><p>Page Count: N/A</p>",
    "assignee": {
      "id": "user-4",
      "name": "Rashed",
      "username": "rashed",
      "role": "technician",
      "specialization": "General Technician"
    },
    "labels": [],
    "dueDate": "2026-08-09",
    "priority": "medium",
    "columnId": "work",
    "order": 25,
    "createdAt": "2026-08-06T00:00:00.000Z",
    "updatedAt": "2026-08-06T00:00:00.000Z",
    "repairCount": 1,
    "isViable": true
  },
  {
    "id": "task-imported-26",
    "title": "[214] Paper Jam",
    "serialNumber": "NKLA026892",
    "printerModel": "214",
    "companyName": "Pran RFL",
    "branchName": "Chokoria, CTG",
    "receivedDate": "2026-08-06T00:00:00.000Z",
    "reportedFault": "Paper Jam",
    "diagnosisNotes": "",
    "partsReplaced": "T.P-1",
    "description": "<p>Complainer: Sajid Hasan 01894846030</p><p>Cost TK: 450</p><p>Page Count: 819826</p>",
    "assignee": {
      "id": "user-4",
      "name": "Rashed",
      "username": "rashed",
      "role": "technician",
      "specialization": "General Technician"
    },
    "labels": [],
    "dueDate": "2026-08-09",
    "priority": "medium",
    "columnId": "intake",
    "order": 26,
    "createdAt": "2026-08-06T00:00:00.000Z",
    "updatedAt": "2026-08-06T00:00:00.000Z",
    "repairCount": 1,
    "isViable": true
  },
  {
    "id": "task-imported-27",
    "title": "[6030] Light INK",
    "serialNumber": "NQSA324652",
    "printerModel": "6030",
    "companyName": "Pran RFL",
    "branchName": "Chokoria, CTG",
    "receivedDate": "2026-08-06T00:00:00.000Z",
    "reportedFault": "Light INK",
    "diagnosisNotes": "",
    "partsReplaced": "Pressure R-1 +  T.P-1 ",
    "description": "<p>Complainer: Sajid Hasan 01894846030</p><p>Cost TK: 0</p><p>Page Count: 4350</p>",
    "assignee": {
      "id": "user-4",
      "name": "Rashed",
      "username": "rashed",
      "role": "technician",
      "specialization": "General Technician"
    },
    "labels": [],
    "dueDate": "2026-08-09",
    "priority": "medium",
    "columnId": "work",
    "order": 27,
    "createdAt": "2026-08-06T00:00:00.000Z",
    "updatedAt": "2026-08-06T00:00:00.000Z",
    "repairCount": 1,
    "isViable": true
  },
  {
    "id": "task-imported-28",
    "title": "[6030] Paper Jam",
    "serialNumber": "PCLA534875",
    "printerModel": "6030",
    "companyName": "Pran RFL",
    "branchName": "Chokoria, CTG",
    "receivedDate": "2026-08-06T00:00:00.000Z",
    "reportedFault": "Paper Jam",
    "diagnosisNotes": "",
    "partsReplaced": "Service",
    "description": "<p>Complainer: Sajid Hasan 01894846030</p><p>Cost TK: 0</p><p>Page Count: 132085</p>",
    "assignee": {
      "id": "user-4",
      "name": "Rashed",
      "username": "rashed",
      "role": "technician",
      "specialization": "General Technician"
    },
    "labels": [],
    "dueDate": "2026-08-09",
    "priority": "medium",
    "columnId": "intake",
    "order": 28,
    "createdAt": "2026-08-06T00:00:00.000Z",
    "updatedAt": "2026-08-06T00:00:00.000Z",
    "repairCount": 1,
    "isViable": true
  },
  {
    "id": "task-imported-29",
    "title": "[6000] No Print",
    "serialNumber": "B2E16MIN",
    "printerModel": "6000",
    "companyName": "Pran RFL",
    "branchName": "Chokoria, CTG",
    "receivedDate": "2026-08-06T00:00:00.000Z",
    "reportedFault": "No Print",
    "diagnosisNotes": "",
    "partsReplaced": "T.P-1",
    "description": "<p>Complainer: Sajid Hasan 01894846030</p><p>Cost TK: 0</p><p>Page Count: N/A</p>",
    "assignee": {
      "id": "user-4",
      "name": "Rashed",
      "username": "rashed",
      "role": "technician",
      "specialization": "General Technician"
    },
    "labels": [],
    "dueDate": "2026-08-09",
    "priority": "medium",
    "columnId": "intake",
    "order": 29,
    "createdAt": "2026-08-06T00:00:00.000Z",
    "updatedAt": "2026-08-06T00:00:00.000Z",
    "repairCount": 1,
    "isViable": true
  }
];

const initialBoard: Board = {
  columns: DEFAULT_COLUMNS,
  tasks: sampleInitialTasks,
  assignees: PRESET_ASSIGNEES,
  companies: PRESET_COMPANIES,
};

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      board: initialBoard,
      history: [initialBoard],
      historyIndex: 0,

      getRepairHistoryBySerial: (serialNumber: string) => {
        if (!serialNumber?.trim()) return [];
        const target = serialNumber.trim().toLowerCase();
        return get().board.tasks
          .filter((t) => t.serialNumber && t.serialNumber.trim().toLowerCase() === target)
          .sort((a, b) => new Date(b.receivedDate || b.createdAt).getTime() - new Date(a.receivedDate || a.createdAt).getTime());
      },

      getSerialRepairCount: (serialNumber: string, excludeTaskId?: string) => {
        if (!serialNumber?.trim()) return 0;
        const target = serialNumber.trim().toLowerCase();
        return get().board.tasks.filter(
          (t) => t.serialNumber && t.serialNumber.trim().toLowerCase() === target && t.id !== excludeTaskId
        ).length;
      },

      addTask: (task) => set((state) => {
        const now = new Date().toISOString();
        const serial = task.serialNumber?.trim() || '';
        
        // Count previous repairs for this serial
        const previousMatching = state.board.tasks.filter(
          (t) => serial && t.serialNumber && t.serialNumber.trim().toLowerCase() === serial.toLowerCase()
        );
        const calculatedCount = previousMatching.length + 1;
        const isViable = calculatedCount < 5;

        const newTask: Task = {
          ...task,
          id: generateId(),
          serialNumber: serial,
          repairCount: calculatedCount,
          isViable,
          order: state.board.tasks.filter((t) => t.columnId === task.columnId).length,
          createdAt: now,
          updatedAt: now,
          receivedDate: task.receivedDate || now,
        };

        const nextBoard = { ...state.board, tasks: [...state.board.tasks, newTask] };

        const newHistory = state.history.slice(0, state.historyIndex + 1);
        return { board: nextBoard, history: [...newHistory, nextBoard], historyIndex: state.historyIndex + 1 };
      }),

      updateTask: (taskId, updates) => set((state) => {
        const nextBoard = {
          ...state.board,
          tasks: state.board.tasks.map((t) => {
            if (t.id === taskId) {
              const updated = { ...t, ...updates, updatedAt: new Date().toISOString() };
              // Recompute viability if serialNumber was updated
              if (updates.serialNumber && updates.serialNumber !== t.serialNumber) {
                const count = state.board.tasks.filter(
                  (other) => other.id !== taskId && other.serialNumber && other.serialNumber.trim().toLowerCase() === updates.serialNumber?.trim().toLowerCase()
                ).length + 1;
                updated.repairCount = count;
                updated.isViable = count < 5;
              }
              return updated;
            }
            return t;
          }),
        };

        const newHistory = state.history.slice(0, state.historyIndex + 1);
        return { board: nextBoard, history: [...newHistory, nextBoard], historyIndex: state.historyIndex + 1 };
      }),

      deleteTask: (taskId) => set((state) => {
        const nextBoard = {
          ...state.board,
          tasks: state.board.tasks.filter((t) => t.id !== taskId),
        };

        const newHistory = state.history.slice(0, state.historyIndex + 1);
        return { board: nextBoard, history: [...newHistory, nextBoard], historyIndex: state.historyIndex + 1 };
      }),

      moveTask: (taskId, targetColumnId, targetIndex) => set((state) => {
        const task = state.board.tasks.find((t) => t.id === taskId);
        if (!task) return state;

        const tasksInTargetColumn = state.board.tasks
          .filter((t) => t.columnId === targetColumnId && t.id !== taskId)
          .sort((a, b) => a.order - b.order);

        tasksInTargetColumn.splice(targetIndex, 0, {
          ...task,
          columnId: targetColumnId,
          updatedAt: new Date().toISOString(),
        });

        const updatedTargetTasks = tasksInTargetColumn.map((t, i) => ({ ...t, order: i }));

        const otherTasks = state.board.tasks.filter(
          (t) => t.id !== taskId && t.columnId !== targetColumnId
        );

        const sourceColumnTasks = task.columnId !== targetColumnId
          ? otherTasks
              .filter((t) => t.columnId === task.columnId)
              .sort((a, b) => a.order - b.order)
              .map((t, i) => ({ ...t, order: i }))
          : [];

        const remainingTasks = otherTasks.filter((t) => t.columnId !== task.columnId);

        const nextBoard = {
          ...state.board,
          tasks: [...remainingTasks, ...sourceColumnTasks, ...updatedTargetTasks],
        };



        const newHistory = state.history.slice(0, state.historyIndex + 1);
        return { board: nextBoard, history: [...newHistory, nextBoard], historyIndex: state.historyIndex + 1 };
      }),

      addColumn: (title, color) => set((state) => {
        const newColumn: Column = {
          id: generateId(),
          title,
          order: state.board.columns.length,
          color,
        };
        const nextBoard = { ...state.board, columns: [...state.board.columns, newColumn] };
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        return { board: nextBoard, history: [...newHistory, nextBoard], historyIndex: state.historyIndex + 1 };
      }),

      deleteColumn: (columnId) => set((state) => {
        const nextBoard = {
          ...state.board,
          columns: state.board.columns.filter((c) => c.id !== columnId).map((c, i) => ({ ...c, order: i })),
          tasks: state.board.tasks.filter((t) => t.columnId !== columnId),
        };
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        return { board: nextBoard, history: [...newHistory, nextBoard], historyIndex: state.historyIndex + 1 };
      }),

      importBoard: (data) => set((state) => {
        const boardWithDefaults = {
          ...data,
          assignees: data.assignees || PRESET_ASSIGNEES,
          companies: data.companies || PRESET_COMPANIES,
        };
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        return { board: boardWithDefaults, history: [...newHistory, boardWithDefaults], historyIndex: state.historyIndex + 1 };
      }),

      addAssignee: (name) => set((state) => {
        const newAssignee = { id: generateId(), name, role: 'technician' as const };
        const nextBoard = { ...state.board, assignees: [...(state.board.assignees || []), newAssignee] };
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        return { board: nextBoard, history: [...newHistory, nextBoard], historyIndex: state.historyIndex + 1 };
      }),

      deleteAssignee: (assigneeId) => set((state) => {
        const nextBoard = {
          ...state.board,
          assignees: (state.board.assignees || []).filter((a) => a.id !== assigneeId),
          tasks: state.board.tasks.map(t => t.assignee?.id === assigneeId ? { ...t, assignee: null } : t),
        };
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        return { board: nextBoard, history: [...newHistory, nextBoard], historyIndex: state.historyIndex + 1 };
      }),

      addCompany: (name: string, branches: string[] = ['Main Branch']) => set((state) => {
        const newComp: Company = {
          id: generateId(),
          name,
          branches,
        };
        const nextBoard = {
          ...state.board,
          companies: [...(state.board.companies || []), newComp],
        };
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        return { board: nextBoard, history: [...newHistory, nextBoard], historyIndex: state.historyIndex + 1 };
      }),

      deleteCompany: (companyId: string) => set((state) => {
        const nextBoard = {
          ...state.board,
          companies: (state.board.companies || []).filter((c) => c.id !== companyId),
        };
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        return { board: nextBoard, history: [...newHistory, nextBoard], historyIndex: state.historyIndex + 1 };
      }),

      addBranch: (companyName: string, branchName: string) => set((state) => {
        const companies = (state.board.companies || []).map((c) => {
          if (c.name.toLowerCase() === companyName.toLowerCase()) {
            if (!c.branches.includes(branchName)) {
              return { ...c, branches: [...c.branches, branchName] };
            }
          }
          return c;
        });
        const nextBoard = { ...state.board, companies };
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        return { board: nextBoard, history: [...newHistory, nextBoard], historyIndex: state.historyIndex + 1 };
      }),

      undo: () => set((state) => {
        if (state.historyIndex > 0) {
          return {
            historyIndex: state.historyIndex - 1,
            board: state.history[state.historyIndex - 1],
          };
        }
        return state;
      }),

      redo: () => set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          return {
            historyIndex: state.historyIndex + 1,
            board: state.history[state.historyIndex + 1],
          };
        }
        return state;
      }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({ board: state.board }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const result = boardSchema.safeParse(state.board);
          if (!result.success) {
            console.warn('Persisted board data reset to initial due to schema update.', result.error);
            state.board = initialBoard;
          } else {
            // Migrate old columns: queue, repair, qc -> 02 In Work
            const hasOldColumns = state.board.columns.some((c) =>
              ['queue', 'repair', 'qc'].includes(c.id)
            );
            if (hasOldColumns) {
              const newColumns: Column[] = [];
              let addedWork = false;
              for (const col of state.board.columns) {
                if (['queue', 'repair', 'qc'].includes(col.id)) {
                  if (!addedWork) {
                    newColumns.push({
                      id: 'work',
                      title: '02 In Work',
                      order: newColumns.length,
                      color: '#0284c7',
                    });
                    addedWork = true;
                  }
                } else if (col.id === 'ready') {
                  newColumns.push({
                    ...col,
                    title: col.title.startsWith('05') ? '03 Dispatch Ready' : col.title,
                    order: newColumns.length,
                  });
                } else {
                  newColumns.push({
                    ...col,
                    order: newColumns.length,
                  });
                }
              }

              const updatedTasks = state.board.tasks.map((t) => {
                if (['queue', 'repair', 'qc'].includes(t.columnId)) {
                  return { ...t, columnId: 'work' };
                }
                return t;
              });

              state.board = {
                ...state.board,
                columns: newColumns,
                tasks: updatedTasks,
              };
            }
            state.history = [state.board];
            state.historyIndex = 0;
          }
        }
      }
    }
  )
);
