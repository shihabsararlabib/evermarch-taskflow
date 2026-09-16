import { Column, Label, Assignee, Company } from '@/types';

export const DEFAULT_COLUMNS: Column[] = [
  { id: 'intake', title: '01 Intake & Log', order: 0, color: '#026aa7' },
  { id: 'queue', title: '02 Diagnostic Queue', order: 1, color: '#b45309' },
  { id: 'repair', title: '03 Overhaul & Bench', order: 2, color: '#0284c7' },
  { id: 'qc', title: '04 Quality Control', order: 3, color: '#4338ca' },
  { id: 'ready', title: '05 Dispatch Ready', order: 4, color: '#15803d' },
];

export const PRESET_LABELS: Label[] = [
  { id: 'roller', name: 'Paper Jam / Roller', color: '#ef4444' },
  { id: 'logic-board', name: 'Logic Board / Power', color: '#8b5cf6' },
  { id: 'printhead', name: 'Printhead / Cartridge', color: '#06b6d4' },
  { id: 'fuser', name: 'Fuser Unit', color: '#f97316' },
  { id: 'network', name: 'Network / Firmware', color: '#3b82f6' },
  { id: 'amc', name: 'AMC Contract', color: '#10b981' },
  { id: 'urgent', name: 'Urgent Dispatch', color: '#dc2626' },
  { id: 'non-viable', name: '5+ Repairs (Scrap Candidate)', color: '#b91c1c' },
];

export const PRESET_ASSIGNEES: Assignee[] = [
  {
    "id": "user-admin",
    "name": "Admin / Workshop Supervisor",
    "username": "admin",
    "role": "admin",
    "specialization": "All Operations & Approval"
  },
  {
    "id": "user-1",
    "name": "Rasel Pran",
    "username": "rasel",
    "role": "technician",
    "specialization": "General Technician"
  },
  {
    "id": "user-2",
    "name": "Symon Rasel",
    "username": "symon",
    "role": "technician",
    "specialization": "General Technician"
  },
  {
    "id": "user-3",
    "name": "Junaid",
    "username": "junaid",
    "role": "technician",
    "specialization": "General Technician"
  },
  {
    "id": "user-4",
    "name": "Rashed",
    "username": "rashed",
    "role": "technician",
    "specialization": "General Technician"
  },
  {
    "id": "user-5",
    "name": "Mukti",
    "username": "mukti",
    "role": "technician",
    "specialization": "General Technician"
  },
  {
    "id": "user-6",
    "name": "Didar",
    "username": "didar",
    "role": "technician",
    "specialization": "General Technician"
  },
  {
    "id": "user-7",
    "name": "Rubel",
    "username": "rubel",
    "role": "technician",
    "specialization": "General Technician"
  }
];

export const PRESET_COMPANIES: Company[] = [
  {
    "id": "comp-1",
    "name": "Pran RFL",
    "branches": [
      "Badda",
      "Keranigonj Depot",
      "PIP, Bread",
      "Bagher Bazar",
      "Patira",
      "Bagher Para",
      "Pran Center, Badda",
      "Matiara, Comilla",
      "CNF, CTG",
      "Kasem Jute Mills, CTG",
      "City Gate, CTG",
      "Chokoria, CTG",
      "Muradpur, CTG",
      "Sonargon Depot",
      "DIP",
      "Gawsia",
      "Charka",
      "Azhar Complx",
      "Murapara",
      "Malibagh, Bondor, N.Gonj",
      "PIP",
      "HIP",
      "Rongpur",
      "Fuji Tower",
      "Baghdi",
      "KEZ",
      "RIP",
      "PIP, Factory",
      "Comilla",
      "MCL",
      "CTL",
      "CTG, Aturar Depo",
      "Borishal",
      "Sitakunda",
      "Main Branch",
      "Shanarpar Depot",
      "Khanchpur Depot",
      "Matuail, Demra",
      "Borabo, N.Gonj",
      "Baunia"
    ]
  }
];

export const PRIORITY_CONFIG = {
  high: { label: 'High', color: '#ef4444', bgColor: '#fef2f2', icon: '🔴' },
  medium: { label: 'Medium', color: '#f59e0b', bgColor: '#fffbeb', icon: '🟡' },
  low: { label: 'Low', color: '#10b981', bgColor: '#ecfdf5', icon: '🟢' },
} as const;

export const STORAGE_KEY = 'evermarch-printer-kanban-data';
export const AUTH_STORAGE_KEY = 'evermarch-printer-auth';
export const THEME_STORAGE_KEY = 'kanban-theme';
export const REPAIR_LIMIT_THRESHOLD = 5;
