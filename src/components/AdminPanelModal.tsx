'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useBoardStore } from '@/store/boardStore';
import { getAvatarColor, getInitials } from '@/lib/utils';
import { REPAIR_LIMIT_THRESHOLD } from '@/lib/constants';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminPanelModal({ isOpen, onClose }: AdminPanelModalProps) {
  const { currentUser, isAdmin, technicians, addTechnician, deleteTechnician } = useAuthStore();
  const { board, addCompany, deleteCompany, addBranch } = useBoardStore();

  const [activeTab, setActiveTab] = useState<'technicians' | 'clients' | 'policies'>('technicians');

  // New Technician form state
  const [techName, setTechName] = useState('');
  const [techUsername, setTechUsername] = useState('');
  const [techPassword, setTechPassword] = useState('tech123');
  const [techRole, setTechRole] = useState<'technician' | 'admin'>('technician');
  const [techSpec, setTechSpec] = useState('');
  const [techSuccessMsg, setTechSuccessMsg] = useState('');

  // New Company form state
  const [companyName, setCompanyName] = useState('');
  const [companyBranches, setCompanyBranches] = useState('Main Branch, Regional Office');
  const [companySuccessMsg, setCompanySuccessMsg] = useState('');

  // Branch quick add state
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [newBranchInput, setNewBranchInput] = useState('');

  const handleAddTechnicianSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!techName.trim() || !techUsername.trim()) return;

    addTechnician({
      name: techName.trim(),
      username: techUsername.trim().toLowerCase(),
      password: techPassword.trim() || 'tech123',
      role: techRole,
      specialization: techSpec.trim() || (techRole === 'admin' ? 'Workshop Supervisor' : 'General Maintenance'),
    });

    setTechName('');
    setTechUsername('');
    setTechPassword('tech123');
    setTechSpec('');
    setTechSuccessMsg(`Technician "${techName.trim()}" registered successfully.`);
    setTimeout(() => setTechSuccessMsg(''), 4000);
  };

  const handleAddCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    const branches = companyBranches
      .split(',')
      .map((b) => b.trim())
      .filter(Boolean);

    addCompany(companyName.trim(), branches.length ? branches : ['Main Branch']);
    setCompanyName('');
    setCompanyBranches('Main Branch, Regional Office');
    setCompanySuccessMsg(`Client "${companyName.trim()}" added to database.`);
    setTimeout(() => setCompanySuccessMsg(''), 4000);
  };

  const handleAddBranchToCompany = (compName: string) => {
    if (!newBranchInput.trim()) return;
    addBranch(compName, newBranchInput.trim());
    setNewBranchInput('');
    setSelectedCompanyId(null);
  };

  const nonViableCount = board.tasks.filter(
    (t) => (t.repairCount && t.repairCount >= REPAIR_LIMIT_THRESHOLD) || t.isViable === false
  ).length;

  // STRICT ACCESS CONTROL: Non-admins cannot access or view supervisor controls
  if (!isOpen || !isAdmin()) return null;

  return (
    <>
      <div key="admin-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 dark:bg-black/90 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className="relative w-full max-w-4xl bg-[var(--card-bg)] border border-[var(--card-border)] my-6 z-10 shadow-xl rounded-md max-h-[92vh] flex flex-col overflow-hidden text-[var(--text-color)]"
          role="dialog"
          aria-label="Admin Control Panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--card-border)] bg-slate-50/90 dark:bg-[#0f0f0f]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-sm bg-slate-900 dark:bg-white text-white dark:text-black font-mono font-bold text-xs flex items-center justify-center border border-slate-700 dark:border-neutral-700">
                EB
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold tracking-tight font-sans text-slate-900 dark:text-white">
                    Supervisor Control Terminal
                  </h2>
                  <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] text-[var(--text-muted)] uppercase tracking-wider">
                    LEVEL: ADMIN
                  </span>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                  Supervisor: {currentUser?.name} // Evermarch Workshop
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-7 h-7 rounded border border-[var(--card-border)] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-mono text-xs transition-colors"
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[var(--card-border)] px-5 bg-slate-50/50 dark:bg-[#0a0a0a] gap-5 font-mono text-xs">
            <button
              onClick={() => setActiveTab('technicians')}
              className={`py-2.5 text-[11px] font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                activeTab === 'technicians'
                  ? 'border-slate-900 dark:border-sky-400 text-slate-900 dark:text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Staff Roster ({technicians.length})
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`py-2.5 text-[11px] font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                activeTab === 'clients'
                  ? 'border-slate-900 dark:border-sky-400 text-slate-900 dark:text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Corporate Clients ({board.companies?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('policies')}
              className={`py-2.5 text-[11px] font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                activeTab === 'policies'
                  ? 'border-slate-900 dark:border-sky-400 text-slate-900 dark:text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Reliability Protocol & Metrics
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5">
            {/* 1. TECHNICIANS & ACCOUNTS TAB */}
            {activeTab === 'technicians' && (
              <div className="space-y-4">
                {/* Add Technician Form Card */}
                <div className="workshop-card p-3.5 rounded-md">
                  <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5">
                    + Register Technician or Station Login
                  </h3>
                  <form onSubmit={handleAddTechnicianSubmit} className="space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={techName}
                          onChange={(e) => setTechName(e.target.value)}
                          placeholder="e.g. Rafiqul Islam"
                          className="workshop-input w-full px-2.5 py-1 text-xs"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                          Login ID *
                        </label>
                        <input
                          type="text"
                          value={techUsername}
                          onChange={(e) => setTechUsername(e.target.value)}
                          placeholder="e.g. rafiq"
                          className="workshop-input w-full px-2.5 py-1 text-xs font-mono"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                          Passcode
                        </label>
                        <input
                          type="text"
                          value={techPassword}
                          onChange={(e) => setTechPassword(e.target.value)}
                          placeholder="Default: tech123"
                          className="workshop-input w-full px-2.5 py-1 text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                          Terminal Role
                        </label>
                        <select
                          value={techRole}
                          onChange={(e) => setTechRole(e.target.value as 'technician' | 'admin')}
                          className="workshop-input w-full px-2.5 py-1 text-xs"
                        >
                          <option value="technician">Bench Technician</option>
                          <option value="admin">Workshop Supervisor (Admin)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          value={techSpec}
                          onChange={(e) => setTechSpec(e.target.value)}
                          placeholder="Specialization (e.g. HP LaserJets, Canon MFP, Thermal Heads)"
                          className="workshop-input w-full px-2.5 py-1 text-xs"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full sm:w-auto px-3.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-mono text-xs uppercase tracking-wider font-semibold transition-colors shadow-2xs shrink-0 cursor-pointer"
                      >
                        Add Account
                      </button>
                    </div>

                    {techSuccessMsg && (
                      <p className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                        [SUCCESS]: {techSuccessMsg}
                      </p>
                    )}
                  </form>
                </div>

                {/* Active Technicians Roster */}
                <div>
                  <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center justify-between">
                    <span>Active Workshop Staff Roster</span>
                    <span className="font-normal">
                      // Passcodes valid for floor terminals & station switching
                    </span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {technicians.map((tech) => (
                      <div
                        key={tech.id}
                        className="workshop-plate p-3 rounded-md flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-8 h-8 rounded-sm flex items-center justify-center font-mono text-xs font-bold text-white shrink-0"
                            style={{ backgroundColor: getAvatarColor(tech.name) }}
                          >
                            {getInitials(tech.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {tech.name}
                              </p>
                              {tech.role === 'admin' ? (
                                <span className="px-1.5 py-0.2 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] text-[var(--text-muted)] font-mono text-[9px] uppercase tracking-wider shrink-0">
                                  Supervisor
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-mono text-[9px] uppercase tracking-wider shrink-0">
                                  Tech
                                </span>
                              )}
                            </div>
                            <p className="font-mono text-[10px] text-slate-500 truncate">
                              ID: <span className="font-semibold text-slate-700 dark:text-slate-300">{tech.username || 'unassigned'}</span> • Pass: <span className="font-mono">{tech.password || 'tech123'}</span>
                            </p>
                            <p className="font-mono text-[9px] text-slate-400 truncate uppercase">
                              {tech.specialization || 'General Printer Service'}
                            </p>
                          </div>
                        </div>

                        {tech.id !== currentUser?.id && (
                          <button
                            onClick={() => {
                              if (confirm(`Remove technician account for "${tech.name}"?`)) {
                                deleteTechnician(tech.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors shrink-0 cursor-pointer font-mono text-xs"
                            title="Remove account"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. CORPORATE CLIENTS & BRANCHES TAB */}
            {activeTab === 'clients' && (
              <div className="space-y-4">
                {/* Add Company Form Card */}
                <div className="workshop-card p-3.5 rounded-md">
                  <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5">
                    + Register Corporate Client Account
                  </h3>
                  <form onSubmit={handleAddCompanySubmit} className="space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                          Organization / Company Name *
                        </label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="e.g. Standard Chartered Bangladesh"
                          className="workshop-input w-full px-2.5 py-1 text-xs"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                          Initial Branches (comma separated)
                        </label>
                        <input
                          type="text"
                          value={companyBranches}
                          onChange={(e) => setCompanyBranches(e.target.value)}
                          placeholder="e.g. Gulshan Branch, Motijheel, Agrabad"
                          className="workshop-input w-full px-2.5 py-1 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        className="px-3.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-mono text-xs uppercase tracking-wider font-semibold transition-colors shadow-2xs cursor-pointer"
                      >
                        Register Client
                      </button>
                    </div>

                    {companySuccessMsg && (
                      <p className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                        [SUCCESS]: {companySuccessMsg}
                      </p>
                    )}
                  </form>
                </div>

                {/* Clients Registry List */}
                <div>
                  <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center justify-between">
                    <span>Registered Client Organization Registry</span>
                    <span className="font-normal">
                      // Service tickets map to account and origin branch
                    </span>
                  </h3>

                  <div className="space-y-2.5">
                    {(board.companies || []).map((company) => (
                      <div
                        key={company.id}
                        className="workshop-plate p-3 rounded-md"
                      >
                        <div className="flex items-center justify-between gap-3 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.2 rounded bg-[var(--card-subtle)] border border-[var(--border-color)] text-[var(--text-muted)] font-mono text-[9px] uppercase tracking-wider font-semibold">
                              CORP
                            </span>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                              {company.name}
                            </h4>
                            <span className="font-mono text-[10px] text-slate-500">
                              [{company.branches.length} BRANCHES]
                            </span>
                          </div>

                          <div className="flex items-center gap-2 font-mono text-xs">
                            <button
                              onClick={() => setSelectedCompanyId(selectedCompanyId === company.id ? null : company.id)}
                              className="workshop-plate px-2 py-0.5 rounded text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:border-slate-400 transition-colors"
                            >
                              + Add Branch
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Remove client company "${company.name}"?`)) {
                                  deleteCompany(company.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-red-600 transition-colors font-mono text-xs"
                              title="Delete company"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {/* Branches Pills */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {company.branches.map((branch, idx) => (
                            <span
                              key={idx}
                              className="workshop-plate px-2 py-0.5 rounded text-[10px] font-mono text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                            >
                              {branch}
                            </span>
                          ))}
                        </div>

                        {/* Inline Branch Add Form */}
                        {selectedCompanyId === company.id && (
                          <div className="mt-2.5 pt-2.5 border-t border-[var(--card-border)] flex items-center gap-2">
                            <input
                              type="text"
                              value={newBranchInput}
                              onChange={(e) => setNewBranchInput(e.target.value)}
                              placeholder={`Branch name for ${company.name}...`}
                              className="workshop-input flex-1 px-2.5 py-1 text-xs font-mono"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddBranchToCompany(company.name);
                              }}
                            />
                            <button
                              onClick={() => handleAddBranchToCompany(company.name)}
                              className="px-3 py-1 rounded bg-slate-900 dark:bg-sky-600 text-white font-mono text-xs uppercase tracking-wider font-semibold"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setSelectedCompanyId(null)}
                              className="px-2 py-1 font-mono text-xs text-slate-400 hover:text-slate-600 uppercase"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. RELIABILITY MATRIX & POLICIES TAB */}
            {activeTab === 'policies' && (
              <div className="space-y-4">
                <div className="p-4 rounded-md border border-red-700/80 bg-red-950/15">
                  <div className="flex items-start gap-3">
                    <div className="px-1.5 py-1 rounded bg-red-700 text-white font-mono font-bold text-[10px] shrink-0 uppercase tracking-wider">
                      PROTOCOL
                    </div>
                    <div>
                      <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                        Evermarch Bangladesh — Repeat Overhaul Limit (5+ Visits Threshold)
                      </h3>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                        Printers logging 5 or more intake cycles are flagged as <span className="font-mono font-bold text-red-600 dark:text-red-400">[ECONOMIC TOTAL LOSS]</span>. Ongoing repair is economically unviable due to structural chassis fatigue.
                      </p>

                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="workshop-card p-3 rounded-md">
                          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                            1. Operational Directive
                          </p>
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                            Mechanical frame distortion and fuser sleeve wear beyond cycle 5 degrade optical calibration. Standard workshop intake directs technician to advise client decommission.
                          </p>
                        </div>

                        <div className="workshop-card p-3 rounded-md">
                          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                            2. Supervisor Override Authorization
                          </p>
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                            Only logged-in Supervisor accounts hold the cryptographic permission to override the 5+ limit on the intake docket for mission-critical institutional clients.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Metrics Overview */}
                <div>
                  <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                    Workshop Operational Telemetry Summary
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="workshop-plate p-3 rounded-md text-center">
                      <p className="font-mono text-2xl font-bold text-sky-600 dark:text-sky-400">
                        {board.tasks.length.toString().padStart(2, '0')}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">
                        Active Tickets
                      </p>
                    </div>

                    <div className="workshop-plate p-3 rounded-md text-center border-red-300 dark:border-red-900/60">
                      <p className="font-mono text-2xl font-bold text-red-600 dark:text-red-400">
                        {nonViableCount.toString().padStart(2, '0')}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-red-600 dark:text-red-400 mt-0.5">
                        5+ Decommissioned
                      </p>
                    </div>

                    <div className="workshop-plate p-3 rounded-md text-center">
                      <p className="font-mono text-2xl font-bold text-slate-800 dark:text-slate-200">
                        {technicians.length.toString().padStart(2, '0')}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">
                        Bench Techs
                      </p>
                    </div>

                    <div className="workshop-plate p-3 rounded-md text-center">
                      <p className="font-mono text-2xl font-bold text-slate-800 dark:text-slate-200">
                        {(board.companies?.length || 0).toString().padStart(2, '0')}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">
                        Client Accounts
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-5 py-3 border-t border-[var(--card-border)] bg-slate-50/90 dark:bg-[#0f0f0f] flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
              Terminal: Supervisor // Session Secure
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-mono text-xs uppercase tracking-wider font-semibold transition-colors shadow-2xs cursor-pointer"
            >
              Done & Close
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
