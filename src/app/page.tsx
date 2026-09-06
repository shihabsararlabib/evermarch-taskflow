'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ThemeProvider } from '@/components/ThemeProvider';
import { useAuthStore } from '@/store/authStore';
import LoginPage from '@/components/LoginPage';

const Board = dynamic(() => import('@/components/Board'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-[#f4f5f7] dark:bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border border-[#d6dae1] dark:border-[#262626] bg-[var(--card-bg)] flex items-center justify-center text-blue-600 rounded-2xl shadow-xs">
          <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
        </div>
        <div className="text-[11px] font-sans font-bold text-slate-500 uppercase tracking-widest animate-pulse">
          Loading Evermarch Bangladesh...
        </div>
      </div>
    </div>
  ),
});

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f4f5f7] dark:bg-black">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <main id="kanban-app" role="main" aria-label="Evermarch Bangladesh Printer Repair Manager">
        {!isAuthenticated ? <LoginPage /> : <Board />}
      </main>
    </ThemeProvider>
  );
}
