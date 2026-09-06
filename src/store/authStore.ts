import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Assignee } from '@/types';
import { AUTH_STORAGE_KEY } from '@/lib/constants';
import { generateId } from '@/lib/utils';

export interface UserAccount extends Assignee {
  password?: string;
}

const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    id: 'user-admin',
    name: 'Admin / Workshop Supervisor',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    specialization: 'All Operations & Approval',
  },
  {
    id: 'user-1',
    name: 'Tarek Rahman',
    username: 'tarek',
    password: 'tech123',
    role: 'technician',
    specialization: 'Laser Printers & Fuser Units',
  },
  {
    id: 'user-2',
    name: 'Hasan Mahmud',
    username: 'hasan',
    password: 'tech123',
    role: 'technician',
    specialization: 'Logic Board & SMPS Power Circuits',
  },
  {
    id: 'user-3',
    name: 'Salman Farsi',
    username: 'salman',
    password: 'tech123',
    role: 'technician',
    specialization: 'Ink Tank & Color MFP Mechanics',
  },
  {
    id: 'user-4',
    name: 'Fahim Chowdhury',
    username: 'fahim',
    password: 'tech123',
    role: 'technician',
    specialization: 'Network, Scanner & Firmware',
  },
];

interface AuthState {
  currentUser: UserAccount | null;
  isAuthenticated: boolean;
  technicians: UserAccount[];
  login: (username: string, password?: string) => { success: boolean; message?: string };
  quickLogin: (userId: string, password?: string) => { success: boolean; message?: string };
  switchUser: (userId: string, password?: string) => { success: boolean; message?: string };
  logout: () => void;
  isAdmin: () => boolean;
  addTechnician: (tech: Omit<UserAccount, 'id'>) => void;
  deleteTechnician: (id: string) => void;
  updateTechnician: (id: string, updates: Partial<UserAccount>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: DEFAULT_ACCOUNTS[1], // Default to Bench Technician (Tarek Rahman) instead of elevating to Admin automatically
      isAuthenticated: true,
      technicians: DEFAULT_ACCOUNTS,

      login: (username: string, password = '') => {
        const cleanUser = username.trim().toLowerCase();
        const found = get().technicians.find(
          (t) => t.username?.toLowerCase() === cleanUser
        );

        if (!found) {
          return { success: false, message: 'Technician username not found.' };
        }

        // Check password if set on account (mandatory for admin)
        if (found.role === 'admin' && (!password || password.trim() !== found.password)) {
          return { success: false, message: 'Supervisor password incorrect. Access to admin station denied.' };
        }

        if (found.password && found.password !== password.trim()) {
          return { success: false, message: 'Incorrect passcode for this technician.' };
        }

        set({ currentUser: found, isAuthenticated: true });
        return { success: true };
      },

      quickLogin: (userId: string, password?: string) => {
        const found = get().technicians.find((t) => t.id === userId);
        if (!found) {
          return { success: false, message: 'Account profile not found.' };
        }

        // STRICT SECURITY: Switching to an admin/supervisor account requires valid password
        if (found.role === 'admin') {
          if (!password || password.trim() !== found.password) {
            return {
              success: false,
              message: 'Supervisor authorization required. Please provide the admin password.',
            };
          }
        }

        set({ currentUser: found, isAuthenticated: true });
        return { success: true };
      },

      switchUser: (userId: string, password?: string) => {
        return get().quickLogin(userId, password);
      },

      logout: () => {
        set({ currentUser: null, isAuthenticated: false });
      },

      isAdmin: () => {
        return get().currentUser?.role === 'admin';
      },

      addTechnician: (techData) => {
        const newTech: UserAccount = {
          ...techData,
          id: generateId(),
          role: techData.role || 'technician',
          password: techData.password || 'tech123',
        };
        set((state) => ({
          technicians: [...state.technicians, newTech],
        }));
      },

      deleteTechnician: (id: string) => {
        set((state) => ({
          technicians: state.technicians.filter((t) => t.id !== id),
          currentUser: state.currentUser?.id === id ? null : state.currentUser,
          isAuthenticated: state.currentUser?.id === id ? false : state.isAuthenticated,
        }));
      },

      updateTechnician: (id: string, updates: Partial<UserAccount>) => {
        set((state) => ({
          technicians: state.technicians.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
          currentUser: state.currentUser?.id === id ? { ...state.currentUser, ...updates } : state.currentUser,
        }));
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
    }
  )
);
