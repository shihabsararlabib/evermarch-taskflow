import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Board, Task, Column, Company } from '@/types';
import { generateId } from '@/lib/utils';
import { DEFAULT_COLUMNS, STORAGE_KEY, PRESET_ASSIGNEES, PRESET_COMPANIES, PRESET_LABELS } from '@/lib/constants';
import { boardSchema } from '@/lib/schema';
import { syncManager } from '@/lib/syncManager';

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
  // 6th repeat repair - Critical non-viable alert trigger!
  {
    id: 'task-repeat-6',
    title: '[HP LaserJet Pro M404n] Repeated Fuser Heater Breakdown',
    serialNumber: 'SN-HP404-7712',
    printerModel: 'HP LaserJet Pro M404n',
    companyName: 'BRAC Bank PLC',
    branchName: 'Motijheel Corporate',
    receivedDate: '2026-09-05T09:30:00.000Z',
    reportedFault: 'Fuser heating error 50.4 and persistent paper feed jam. Came back for the 6th time.',
    diagnosisNotes: 'Fuser film sleeve torn again, heater element charred. Pressure roller worn.',
    partsReplaced: 'Fuser assembly unit, Pickup roller kit',
    description: '<p><strong>Intake Assessment:</strong> Unit has severe thermal stress and recurrent feeder failures. According to Evermarch Bangladesh reliability matrix, unit has exceeded 5 workshop repairs.</p>',
    assignee: PRESET_ASSIGNEES[1], // Tarek Rahman
    labels: [PRESET_LABELS[0], PRESET_LABELS[3], PRESET_LABELS[7]], // Paper Jam, Fuser, Non-viable
    dueDate: '2026-09-08',
    priority: 'high',
    columnId: 'intake',
    order: 0,
    createdAt: '2026-09-05T09:30:00.000Z',
    updatedAt: '2026-09-05T09:30:00.000Z',
    repairCount: 6,
    isViable: false,
  },
  // Previous 5 repairs for SN-HP404-7712 stored as historical records
  {
    id: 'task-repeat-5',
    title: '[HP LaserJet Pro M404n] Paper Pickup Misfeed & Grinding Noise',
    serialNumber: 'SN-HP404-7712',
    printerModel: 'HP LaserJet Pro M404n',
    companyName: 'BRAC Bank PLC',
    branchName: 'Motijheel Corporate',
    receivedDate: '2026-08-14T11:00:00.000Z',
    reportedFault: 'Tray 2 pickup roller slipping on thick letterheads',
    diagnosisNotes: 'Roller rubber slick, replaced with genuine HP roller rubber.',
    partsReplaced: 'Pickup roller & separation pad',
    description: '<p>Replaced pickup roller and cleaned paper path sensors.</p>',
    assignee: PRESET_ASSIGNEES[1],
    labels: [PRESET_LABELS[0]],
    dueDate: '2026-08-16',
    priority: 'medium',
    columnId: 'ready',
    order: 1,
    createdAt: '2026-08-14T11:00:00.000Z',
    updatedAt: '2026-08-16T15:00:00.000Z',
    repairCount: 5,
    isViable: false,
  },
  {
    id: 'task-repeat-4',
    title: '[HP LaserJet Pro M404n] Smudged Printout & Toner Leak',
    serialNumber: 'SN-HP404-7712',
    printerModel: 'HP LaserJet Pro M404n',
    companyName: 'BRAC Bank PLC',
    branchName: 'Gulshan Branch',
    receivedDate: '2026-07-02T10:15:00.000Z',
    reportedFault: 'Black horizontal streaks across prints every 75mm',
    diagnosisNotes: 'OPC drum scratch and waste toner overflow.',
    partsReplaced: 'Drum cleaning blade & transfer roller',
    description: '<p>Serviced drum unit and cleaned optical mirror.</p>',
    assignee: PRESET_ASSIGNEES[2],
    labels: [PRESET_LABELS[2]],
    dueDate: '2026-07-05',
    priority: 'medium',
    columnId: 'ready',
    order: 2,
    createdAt: '2026-07-02T10:15:00.000Z',
    updatedAt: '2026-07-04T14:30:00.000Z',
    repairCount: 4,
    isViable: true,
  },
  {
    id: 'task-repeat-3',
    title: '[HP LaserJet Pro M404n] Power Tripping & Blank Display',
    serialNumber: 'SN-HP404-7712',
    printerModel: 'HP LaserJet Pro M404n',
    companyName: 'BRAC Bank PLC',
    branchName: 'Dhanmondi Branch',
    receivedDate: '2026-05-18T14:20:00.000Z',
    reportedFault: 'Machine completely dead after thunderstorm power surge',
    diagnosisNotes: 'SMPS input capacitor blown, fuse melted.',
    partsReplaced: 'Power supply board MOSFET & 250V Fuse',
    description: '<p>Repaired low voltage power supply board.</p>',
    assignee: PRESET_ASSIGNEES[2],
    labels: [PRESET_LABELS[1]],
    dueDate: '2026-05-21',
    priority: 'high',
    columnId: 'ready',
    order: 3,
    createdAt: '2026-05-18T14:20:00.000Z',
    updatedAt: '2026-05-20T17:00:00.000Z',
    repairCount: 3,
    isViable: true,
  },
  {
    id: 'task-repeat-2',
    title: '[HP LaserJet Pro M404n] Ghosting and Fuser Sleeve Wrinkles',
    serialNumber: 'SN-HP404-7712',
    printerModel: 'HP LaserJet Pro M404n',
    companyName: 'BRAC Bank PLC',
    branchName: 'Motijheel Corporate',
    receivedDate: '2026-03-10T12:00:00.000Z',
    reportedFault: 'Toner not sticking to paper, rubs off with finger',
    diagnosisNotes: 'Fuser grease dried up causing sleeve resistance.',
    partsReplaced: 'Teflon sleeve & high-temp silicone grease',
    description: '<p>Lubricated heating element and replaced Teflon film.</p>',
    assignee: PRESET_ASSIGNEES[1],
    labels: [PRESET_LABELS[3]],
    dueDate: '2026-03-12',
    priority: 'medium',
    columnId: 'ready',
    order: 4,
    createdAt: '2026-03-10T12:00:00.000Z',
    updatedAt: '2026-03-12T16:00:00.000Z',
    repairCount: 2,
    isViable: true,
  },
  // Task 2: Canon Multifunction at GP
  {
    id: 'task-gp-1',
    title: '[Canon imageRUNNER 2625i] Touch Panel Freeze & ADF Skew',
    serialNumber: 'SN-CANON-9941',
    printerModel: 'Canon imageRUNNER 2625i',
    companyName: 'Grameenphone Ltd.',
    branchName: 'GPHouse Bashundhara HQ',
    receivedDate: '2026-09-04T10:00:00.000Z',
    reportedFault: 'Main LCD touch screen unresponsive; duplex ADF feeder skews sheets',
    diagnosisNotes: 'ADF feeder hinge loose; digitizer ribbon cable re-seated.',
    partsReplaced: 'ADF Separation Pad, Touch Digitizer Ribbon',
    description: '<p>High priority corporate floor MFP. Calibration required after digitizer test.</p>',
    assignee: PRESET_ASSIGNEES[2], // Hasan Mahmud
    labels: [PRESET_LABELS[1], PRESET_LABELS[6]], // Logic Board, Urgent
    dueDate: '2026-09-07',
    priority: 'high',
    columnId: 'repair',
    order: 0,
    createdAt: '2026-09-04T10:00:00.000Z',
    updatedAt: '2026-09-05T11:00:00.000Z',
    repairCount: 1,
    isViable: true,
  },
  // Task 3: Epson EcoTank at Square Pharma
  {
    id: 'task-sq-1',
    title: '[Epson EcoTank L3210] Printhead Black Nozzle Clogged',
    serialNumber: 'SN-EPSON-3210',
    printerModel: 'Epson EcoTank L3210',
    companyName: 'Square Pharmaceuticals Ltd.',
    branchName: 'Pabna Manufacturing Plant',
    receivedDate: '2026-09-03T15:30:00.000Z',
    reportedFault: 'Blanks on barcode printing; nozzle check missing 40% of black lines',
    diagnosisNotes: 'Dried pigment ink in damper manifold. Awaiting ultrasonic cleaning solvent.',
    partsReplaced: 'Damper assembly and waste ink pad sponge',
    description: '<p>Used for factory batch tag printing. Ultrasonic head flush in progress.</p>',
    assignee: PRESET_ASSIGNEES[3], // Salman Farsi
    labels: [PRESET_LABELS[2], PRESET_LABELS[5]], // Printhead, AMC
    dueDate: '2026-09-09',
    priority: 'medium',
    columnId: 'queue',
    order: 0,
    createdAt: '2026-09-03T15:30:00.000Z',
    updatedAt: '2026-09-04T16:00:00.000Z',
    repairCount: 1,
    isViable: true,
  },
  // Task 4: HP M428 at Standard Chartered
  {
    id: 'task-scb-1',
    title: '[HP LaserJet Pro MFP M428fdw] Network Dropout & Error 13.00',
    serialNumber: 'SN-HP-M428',
    printerModel: 'HP LaserJet Pro MFP M428fdw',
    companyName: 'Standard Chartered Bangladesh',
    branchName: 'Principal Branch Motijheel',
    receivedDate: '2026-09-02T11:45:00.000Z',
    reportedFault: 'Ethernet port not obtaining DHCP IP; duplex jam inside rear door',
    diagnosisNotes: 'Reflashed latest firmware via USB; cleared reverse sensor obstruction.',
    partsReplaced: 'Duplex sensor spring',
    description: '<p>Final test prints running. Performing 100-page double-sided print endurance test.</p>',
    assignee: PRESET_ASSIGNEES[4], // Fahim Chowdhury
    labels: [PRESET_LABELS[4], PRESET_LABELS[0]], // Network, Paper jam
    dueDate: '2026-09-06',
    priority: 'low',
    columnId: 'qc',
    order: 0,
    createdAt: '2026-09-02T11:45:00.000Z',
    updatedAt: '2026-09-05T12:30:00.000Z',
    repairCount: 2,
    isViable: true,
  },
  // Task 5: Ricoh MFP at City Bank
  {
    id: 'task-city-1',
    title: '[Ricoh MP 2014D] Developer Expired & Background Graying',
    serialNumber: 'SN-RICOH-2014',
    printerModel: 'Ricoh MP 2014D',
    companyName: 'The City Bank Limited',
    branchName: 'Banani Branch',
    receivedDate: '2026-09-01T09:00:00.000Z',
    reportedFault: 'Gray background across whole A4 page, toner density sensor warning',
    diagnosisNotes: 'Developer unit exhausted after 60,000 prints. Vacuumed drum unit.',
    partsReplaced: 'Type 28 Developer powder & Charge Corona wire',
    description: '<p>Quality check passed. Crystal clear copies verified. Packed for branch dispatch.</p>',
    assignee: PRESET_ASSIGNEES[1], // Tarek Rahman
    labels: [PRESET_LABELS[5]], // AMC
    dueDate: '2026-09-05',
    priority: 'low',
    columnId: 'ready',
    order: 0,
    createdAt: '2026-09-01T09:00:00.000Z',
    updatedAt: '2026-09-05T08:00:00.000Z',
    repairCount: 1,
    isViable: true,
  },
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
        syncManager.queueMutation('upsert-task', { task: newTask }, nextBoard);
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
        const updatedTask = nextBoard.tasks.find((t) => t.id === taskId);
        if (updatedTask) {
          syncManager.queueMutation('upsert-task', { task: updatedTask }, nextBoard);
        }
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        return { board: nextBoard, history: [...newHistory, nextBoard], historyIndex: state.historyIndex + 1 };
      }),

      deleteTask: (taskId) => set((state) => {
        const nextBoard = {
          ...state.board,
          tasks: state.board.tasks.filter((t) => t.id !== taskId),
        };
        syncManager.queueMutation('delete-task', { taskId }, nextBoard);
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

        const movedTask = nextBoard.tasks.find((t) => t.id === taskId);
        if (movedTask) {
          syncManager.queueMutation('upsert-task', { task: movedTask }, nextBoard);
        }

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
      partialize: (state) => ({ board: state.board }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const result = boardSchema.safeParse(state.board);
          if (!result.success) {
            console.warn('Persisted board data reset to initial due to schema update.', result.error);
            state.board = initialBoard;
          } else {
            state.history = [state.board];
            state.historyIndex = 0;
          }
        }
      }
    }
  )
);
