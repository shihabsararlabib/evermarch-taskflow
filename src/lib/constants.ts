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
  { id: 'user-admin', name: 'Admin / Workshop Supervisor', username: 'admin', role: 'admin', specialization: 'All Operations & Approval' },
  { id: 'user-1', name: 'Tarek Rahman', username: 'tarek', role: 'technician', specialization: 'Laser Printers & Fuser Units' },
  { id: 'user-2', name: 'Hasan Mahmud', username: 'hasan', role: 'technician', specialization: 'Logic Board & SMPS Power Circuits' },
  { id: 'user-3', name: 'Salman Farsi', username: 'salman', role: 'technician', specialization: 'Ink Tank & Color MFP Mechanics' },
  { id: 'user-4', name: 'Fahim Chowdhury', username: 'fahim', role: 'technician', specialization: 'Network, Scanner & Firmware' },
];

export const PRESET_COMPANIES: Company[] = [
  {
    id: 'comp-1',
    name: 'BRAC Bank PLC',
    branches: ['Gulshan Branch', 'Motijheel Corporate', 'Dhanmondi Branch', 'Agrabad Chittagong', 'Uttara Sector 3 Branch', 'Mirpur 10 Branch'],
  },
  {
    id: 'comp-2',
    name: 'Grameenphone Ltd.',
    branches: ['GPHouse Bashundhara HQ', 'Banani Customer Center', 'Sylhet Regional Hub', 'Khulna Operational Center', 'Chittagong Circle'],
  },
  {
    id: 'comp-3',
    name: 'Square Pharmaceuticals Ltd.',
    branches: ['Dhaka Corporate Office', 'Pabna Manufacturing Plant', 'Kaliakair Depot', 'Gazipur Unit'],
  },
  {
    id: 'comp-4',
    name: 'Beximco Communications',
    branches: ['Beximco Industrial Park', 'Tejgaon Engineering Hub', 'Dhanmondi Media Wing'],
  },
  {
    id: 'comp-5',
    name: 'Standard Chartered Bangladesh',
    branches: ['Principal Branch Motijheel', 'Gulshan North Branch', 'Dhanmondi Road 2 Branch', 'Chittagong Main Branch'],
  },
  {
    id: 'comp-6',
    name: 'The City Bank Limited',
    branches: ['City Bank Center Gulshan 2', 'Motijheel Branch', 'Banani Branch', 'Kawran Bazar Branch'],
  },
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
