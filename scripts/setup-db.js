const { Pool } = require('pg');

const sql = `
DO $$ BEGIN
    ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'expunged';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE proposal_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'revision');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

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

CREATE TABLE IF NOT EXISTS project_departments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    is_primary boolean DEFAULT false NOT NULL,
    UNIQUE(project_id, department_id)
);
CREATE INDEX IF NOT EXISTS idx_proj_depts_project ON project_departments(project_id);

CREATE TABLE IF NOT EXISTS proposal_departments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id uuid NOT NULL REFERENCES project_proposals(id) ON DELETE CASCADE,
    department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    is_primary boolean DEFAULT false NOT NULL,
    UNIQUE(proposal_id, department_id)
);

CREATE TABLE IF NOT EXISTS proposal_clearance_requirements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id uuid NOT NULL REFERENCES project_proposals(id) ON DELETE CASCADE,
    clearance_level integer NOT NULL,
    description text
);

CREATE INDEX IF NOT EXISTS idx_proposals_status ON project_proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_submitter ON project_proposals(submitted_by);
CREATE INDEX IF NOT EXISTS idx_proposals_date ON project_proposals(created_at);
CREATE INDEX IF NOT EXISTS idx_prop_depts_proposal ON proposal_departments(proposal_id);
CREATE INDEX IF NOT EXISTS idx_prop_clearance_proposal ON proposal_clearance_requirements(proposal_id);

ALTER TABLE department_members ADD COLUMN IF NOT EXISTS rank_id uuid REFERENCES ranks(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_dept_members_rank ON department_members(rank_id);

DO $$ BEGIN
    CREATE TYPE project_access_type AS ENUM ('user', 'department', 'rank', 'clearance');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_role AS ENUM ('lead', 'researcher', 'observer', 'consultant');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS project_access_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    access_type project_access_type NOT NULL,
    target_id uuid,
    min_clearance integer,
    role project_role DEFAULT 'researcher' NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    created_by uuid REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_access_rules_project ON project_access_rules(project_id);
CREATE INDEX IF NOT EXISTS idx_access_rules_type ON project_access_rules(access_type);
`;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('Setting up database tables...');
    await pool.query(sql);
    console.log('Database setup complete!');
  } catch (err) {
    console.error('Database setup error:', err.message);
  } finally {
    await pool.end();
  }
}

main();
