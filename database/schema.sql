-- =====================================================================
-- EVERMARCH BANGLADESH — PRINTER REPAIR TASK FLOW & RELIABILITY DATABASE
-- Traditional PostgreSQL Schema & Initial Migration
-- =====================================================================

-- 1. COMPANIES & CORPORATE CLIENTS
CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CLIENT SUB-BRANCHES
CREATE TABLE IF NOT EXISTS branches (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_company_branch UNIQUE (company_id, name)
);

-- 3. WORKSHOP TECHNICIANS & SUPERVISORS
CREATE TABLE IF NOT EXISTS technicians (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'technician' CHECK (role IN ('admin', 'technician')),
    specialization VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRINTER UNITS REGISTRY
-- Tracks equipment serial number, total repair visits, and 5+ repair limit viability
CREATE TABLE IF NOT EXISTS printers (
    serial_number VARCHAR(100) PRIMARY KEY,
    model VARCHAR(255) NOT NULL,
    total_repairs INT NOT NULL DEFAULT 1,
    is_viable BOOLEAN NOT NULL DEFAULT TRUE,
    last_intake_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. REPAIR WORKFLOW STAGES (COLUMNS)
CREATE TABLE IF NOT EXISTS workflow_stages (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    order_index INT NOT NULL,
    color VARCHAR(20) NOT NULL
);

-- 6. REPAIR JOBS (INDIVIDUAL INTAKE & SERVICE TICKETS)
CREATE TABLE IF NOT EXISTS repair_jobs (
    id VARCHAR(64) PRIMARY KEY,
    serial_number VARCHAR(100) NOT NULL REFERENCES printers(serial_number) ON DELETE RESTRICT,
    printer_model VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    received_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reported_fault TEXT NOT NULL,
    diagnosis_notes TEXT,
    parts_replaced TEXT,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    stage_id VARCHAR(50) NOT NULL REFERENCES workflow_stages(id) DEFAULT 'intake',
    assigned_technician_id VARCHAR(64) REFERENCES technicians(id) ON DELETE SET NULL,
    due_date DATE,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR HIGH-SPEED QUERIES
CREATE INDEX IF NOT EXISTS idx_repairs_serial ON repair_jobs(serial_number);
CREATE INDEX IF NOT EXISTS idx_repairs_company ON repair_jobs(company_name);
CREATE INDEX IF NOT EXISTS idx_repairs_stage ON repair_jobs(stage_id);
CREATE INDEX IF NOT EXISTS idx_repairs_technician ON repair_jobs(assigned_technician_id);
CREATE INDEX IF NOT EXISTS idx_printers_viable ON printers(is_viable);

-- =====================================================================
-- SEED DATA: EVERMARCH BANGLADESH DEFAULTS
-- =====================================================================

-- Default Workflow Stages
INSERT INTO workflow_stages (id, title, order_index, color) VALUES
    ('intake', 'Intake & Diagnosis', 0, '#6366f1'),
    ('queue', 'Parts Queue', 1, '#f59e0b'),
    ('repair', 'In Repair', 2, '#3b82f6'),
    ('qc', 'Testing & QC', 3, '#8b5cf6'),
    ('ready', 'Ready for Delivery', 4, '#10b981')
ON CONFLICT (id) DO NOTHING;

-- Default Technicians
INSERT INTO technicians (id, name, username, role, specialization) VALUES
    ('user-admin', 'Admin / Workshop Supervisor', 'admin', 'admin', 'All Operations & Approval'),
    ('user-1', 'Tarek Rahman', 'tarek', 'technician', 'Laser Printers & Fuser Units'),
    ('user-2', 'Hasan Mahmud', 'hasan', 'technician', 'Logic Board & SMPS Power Circuits'),
    ('user-3', 'Salman Farsi', 'salman', 'technician', 'Ink Tank & Color MFP Mechanics'),
    ('user-4', 'Fahim Chowdhury', 'fahim', 'technician', 'Network, Scanner & Firmware')
ON CONFLICT (id) DO NOTHING;

-- Default Bangladeshi Corporate Clients
INSERT INTO companies (id, name) VALUES
    ('comp-1', 'BRAC Bank PLC'),
    ('comp-2', 'Grameenphone Ltd.'),
    ('comp-3', 'Square Pharmaceuticals Ltd.'),
    ('comp-4', 'Beximco Communications'),
    ('comp-5', 'Standard Chartered Bangladesh'),
    ('comp-6', 'The City Bank Limited')
ON CONFLICT (id) DO NOTHING;

-- Default Branches
INSERT INTO branches (id, company_id, name) VALUES
    ('b-1', 'comp-1', 'Gulshan Branch'),
    ('b-2', 'comp-1', 'Motijheel Corporate'),
    ('b-3', 'comp-1', 'Dhanmondi Branch'),
    ('b-4', 'comp-1', 'Agrabad Chittagong'),
    ('b-5', 'comp-1', 'Uttara Sector 3 Branch'),
    ('b-6', 'comp-1', 'Mirpur 10 Branch'),
    ('b-7', 'comp-2', 'GPHouse Bashundhara HQ'),
    ('b-8', 'comp-2', 'Banani Customer Center'),
    ('b-9', 'comp-2', 'Sylhet Regional Hub'),
    ('b-10', 'comp-3', 'Dhaka Corporate Office'),
    ('b-11', 'comp-3', 'Pabna Manufacturing Plant'),
    ('b-12', 'comp-4', 'Beximco Industrial Park'),
    ('b-13', 'comp-5', 'Principal Branch Motijheel'),
    ('b-14', 'comp-6', 'Banani Branch')
ON CONFLICT (id) DO NOTHING;

-- Printer With 6 Visits (Exceeds 5-repair threshold -> Non-Viable)
INSERT INTO printers (serial_number, model, total_repairs, is_viable, last_intake_at) VALUES
    ('SN-HP404-7712', 'HP LaserJet Pro M404n', 6, FALSE, '2026-09-05T09:30:00Z'),
    ('SN-CANON-9941', 'Canon imageRUNNER 2625i', 1, TRUE, '2026-09-04T10:00:00Z'),
    ('SN-EPSON-3210', 'Epson EcoTank L3210', 1, TRUE, '2026-09-03T15:30:00Z'),
    ('SN-HP-M428', 'HP LaserJet Pro MFP M428fdw', 2, TRUE, '2026-09-02T11:45:00Z'),
    ('SN-RICOH-2014', 'Ricoh MP 2014D', 1, TRUE, '2026-09-01T09:00:00Z')
ON CONFLICT (serial_number) DO NOTHING;
