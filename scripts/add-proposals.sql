-- Run this in your database to add the proposals tables
-- This uses IF NOT EXISTS to be safe to run multiple times

-- Create proposal_status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE proposal_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'revision');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create project_proposals table
CREATE TABLE IF NOT EXISTS project_proposals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    codename text,
    object_class text,
    security_class security_class DEFAULT 'GREEN' NOT NULL,
    threat_level threat_level DEFAULT 'low' NOT NULL,
    site_assignment text,
    description text,
    containment_procedures text,
    research_protocols text,
    justification text,
    estimated_resources text,
    proposed_timeline text,
    status proposal_status DEFAULT 'pending' NOT NULL,
    admin_notes text,
    rejection_reason text,
    revision_notes text,
    submitted_by uuid NOT NULL REFERENCES users(id),
    reviewed_by uuid REFERENCES users(id),
    reviewed_at timestamp,
    created_project_id uuid REFERENCES projects(id),
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Create proposal_departments table
CREATE TABLE IF NOT EXISTS proposal_departments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id uuid NOT NULL REFERENCES project_proposals(id) ON DELETE CASCADE,
    department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    is_primary boolean DEFAULT false NOT NULL,
    UNIQUE(proposal_id, department_id)
);

-- Create proposal_clearance_requirements table
CREATE TABLE IF NOT EXISTS proposal_clearance_requirements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id uuid NOT NULL REFERENCES project_proposals(id) ON DELETE CASCADE,
    clearance_level integer NOT NULL,
    description text
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_proposals_status ON project_proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_submitter ON project_proposals(submitted_by);
CREATE INDEX IF NOT EXISTS idx_proposals_date ON project_proposals(created_at);
CREATE INDEX IF NOT EXISTS idx_prop_depts_proposal ON proposal_departments(proposal_id);
CREATE INDEX IF NOT EXISTS idx_prop_clearance_proposal ON proposal_clearance_requirements(proposal_id);

-- Done!
SELECT 'Proposals tables created successfully!' as result;
