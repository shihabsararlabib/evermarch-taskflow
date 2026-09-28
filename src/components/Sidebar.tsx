'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import { useAuthStore } from '@/store/authStore';
import { getAvatarColor, getInitials } from '@/lib/utils';

interface SidebarProps {
  onExport: () => void;
  onImport: (file: File) => void;
  onOpenLogin: () => void;
  onOpenAdminPanel?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  onExport,
  onImport,
  onOpenLogin,
  onOpenAdminPanel,
  isMobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const { currentUser, logout, isAdmin } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 64 : 240 }}
        className={`flex flex-col h-screen fixed md:sticky top-0 left-0 bg-[var(--card-bg)] border-r border-[var(--border-color)] transition-transform duration-200 ease-in-out z-50 shrink-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
      {/* Brand Icon / Collapse Toggle */}
      <div className="h-[60px] flex items-center justify-between px-4 border-b border-[var(--border-color)]">
        {!isCollapsed && (
          <span className="font-sans font-bold text-[var(--text-color)] text-sm tracking-tight truncate">
            Evermarch Tools
          </span>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`w-8 h-8 rounded flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--card-subtle)] hover:text-[var(--text-color)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] ${
            isCollapsed ? 'mx-auto' : ''
          }`}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-expanded={!isCollapsed}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {isCollapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col py-4 px-3 gap-2 overflow-y-auto overflow-x-hidden">
        {/* Supervisor Admin Panel Button (Admin Only) */}
        {isAdmin() && onOpenAdminPanel && (
          <button
            onClick={onOpenAdminPanel}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-subtle)] hover:bg-[var(--card-bg)] text-xs font-semibold text-[var(--text-color)] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] ${
              isCollapsed ? 'justify-center p-2' : ''
            }`}
            title="Supervisor Settings"
          >
            <svg className="w-4 h-4 text-[var(--accent-color)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            {!isCollapsed && <span>Supervisor Panel</span>}
          </button>
        )}

        {/* User Profile */}
        <div className="relative mt-auto" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={`w-full flex items-center gap-3 p-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] hover:bg-[var(--card-subtle)] transition-all text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title="Station User Account Menu"
            aria-haspopup="menu"
            aria-expanded={isUserMenuOpen}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold text-white shrink-0"
              style={{ backgroundColor: currentUser ? getAvatarColor(currentUser.name) : '#6b7280' }}
            >
              {currentUser ? getInitials(currentUser.name) : '??'}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-[var(--text-color)] truncate">
                    {currentUser ? currentUser.name : 'Not Signed In'}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-[var(--text-muted)] truncate">
                  {currentUser?.role === 'admin' ? 'Supervisor Station' : 'Bench Technician'}
                </p>
              </div>
            )}
          </button>

          <AnimatePresence>
            {isUserMenuOpen && (
              <motion.div
                key="user-profile-dropdown"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={`absolute bottom-full mb-2 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-xl z-50 text-[var(--text-color)] ${
                  isCollapsed ? 'left-full ml-2 w-48' : 'left-0 w-full'
                }`}
              >
                <div className="px-3 py-2 border-b border-[var(--border-color)]">
                  <p className="text-xs font-bold truncate">{currentUser?.name}</p>
                  <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                    {currentUser?.specialization}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onOpenLogin();
                  }}
                  className="w-full px-3 py-2 text-xs font-medium hover:bg-[var(--card-subtle)] flex items-center gap-2 transition-colors cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span>Switch Profile</span>
                </button>
                <div className="border-t border-[var(--border-color)]">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-b-lg flex items-center gap-2 transition-colors cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Settings Area (Theme + Backup) */}
        <div className={`mt-2 flex ${isCollapsed ? 'flex-col items-center gap-2' : 'items-center justify-between'} p-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-subtle)]`}>
          <ThemeToggle />
          
          <div className={`flex items-center gap-1 ${isCollapsed ? 'flex-col mt-2 pt-2 border-t border-[var(--border-color)] w-full' : ''}`}>
            <button
              onClick={onExport}
              className="w-7 h-7 rounded bg-[var(--card-bg)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-color)] transition-all shadow-xs border border-[var(--border-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]"
              title="Download Backup"
              aria-label="Download Backup"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-7 h-7 rounded bg-[var(--card-bg)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-color)] transition-all shadow-xs border border-[var(--border-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]"
              title="Restore Backup"
              aria-label="Restore Backup"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImport(file);
                e.target.value = '';
              }}
            />
          </div>
        </div>
      </div>
    </motion.aside>
    </>
  );
}
