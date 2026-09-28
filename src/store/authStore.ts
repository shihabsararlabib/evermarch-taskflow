import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeLocalStorage } from '@/lib/safeStorage';
import { Assignee } from '@/types';
import { AUTH_STORAGE_KEY } from '@/lib/constants';
import { generateId } from '@/lib/utils';

export interface UserAccount extends Assignee {
  password?: string;
}

const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    "id": "user-admin",
    "name": "Admin / Workshop Supervisor",
    "username": "admin",
    "role": "admin",
    "specialization": "All Operations & Approval",
    "password": "admin123"
  },
  {
    "id": "user-1",
    "name": "Rasel Pran",
    "username": "rasel",
    "role": "technician",
    "specialization": "General Technician",
    "password": "tech123"
  },
  {
    "id": "user-2",
    "name": "Symon Rasel",
    "username": "symon",
    "role": "technician",
    "specialization": "General Technician",
    "password": "tech123"
  },
  {
    "id": "user-3",
    "name": "Junaid",
    "username": "junaid",
    "role": "technician",
    "specialization": "General Technician",
    "password": "tech123"
  },
  {
    "id": "user-4",
    "name": "Rashed",
    "username": "rashed",
    "role": "technician",
    "specialization": "General Technician",
    "password": "tech123"
  },
  {
    "id": "user-5",
    "name": "Mukti",
    "username": "mukti",
    "role": "technician",
    "specialization": "General Technician",
    "password": "tech123"
  },
  {
    "id": "user-6",
    "name": "Didar",
    "username": "didar",
    "role": "technician",
    "specialization": "General Technician",
    "password": "tech123"
  },
  {
    "id": "user-7",
    "name": "Rubel",
    "username": "rubel",
    "role": "technician",
    "specialization": "General Technician",
    "password": "tech123"
  }
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
      storage: createJSONStorage(() => safeLocalStorage),
    }
  )
);
