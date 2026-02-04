CREATE TYPE "public"."application_status" AS ENUM('pending', 'contacted', 'interviewing', 'approved', 'rejected', 'blacklisted');--> statement-breakpoint
CREATE TYPE "public"."entry_type" AS ENUM('observation', 'experiment', 'incident', 'note', 'addendum', 'interview');--> statement-breakpoint
CREATE TYPE "public"."letter_style" AS ENUM('standard', 'decree', 'summons', 'prophecy', 'warning', 'commendation');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('low', 'normal', 'high', 'critical', 'omega');--> statement-breakpoint
CREATE TYPE "public"."project_access_type" AS ENUM('user', 'department', 'rank', 'clearance');--> statement-breakpoint
CREATE TYPE "public"."project_role" AS ENUM('lead', 'researcher', 'assistant', 'observer');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('active', 'review', 'suspended', 'archived', 'expunged');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('pending', 'acknowledged', 'investigating', 'resolved', 'archived');--> statement-breakpoint
CREATE TYPE "public"."report_type" AS ENUM('general', 'incident', 'intel', 'status', 'containment_breach');--> statement-breakpoint
CREATE TYPE "public"."seal_type" AS ENUM('ouroboros', 'eye', 'serpent', 'moon', 'void', 'mechanicus');--> statement-breakpoint
CREATE TYPE "public"."security_class" AS ENUM('GREEN', 'AMBER', 'RED', 'BLACK');--> statement-breakpoint
CREATE TYPE "public"."threat_level" AS ENUM('negligible', 'low', 'moderate', 'high', 'critical', 'apollyon');--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" uuid,
	"details" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"discord_handle" text NOT NULL,
	"email" text,
	"proposed_name" text NOT NULL,
	"proposed_title" text,
	"preferred_department" text,
	"motivation" text,
	"experience" text,
	"referral" text,
	"status" "application_status" DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"created_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "department_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rank_id" uuid,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"assigned_by" uuid,
	CONSTRAINT "department_members_department_id_user_id_unique" UNIQUE("department_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"codename" text,
	"description" text,
	"head_user_id" uuid,
	"icon_symbol" text DEFAULT '⛧',
	"color" text DEFAULT '#c9a227',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "departments_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"display_name" text NOT NULL,
	"title" text,
	"clearance_level" integer DEFAULT 1 NOT NULL,
	"department_id" uuid,
	"notes" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"used_by" uuid,
	CONSTRAINT "invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "letters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_token" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"style" "letter_style" DEFAULT 'standard' NOT NULL,
	"seal_type" "seal_type" DEFAULT 'ouroboros' NOT NULL,
	"signature" text,
	"author_id" uuid NOT NULL,
	"recipient_name" text,
	"view_count" integer DEFAULT 0 NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"is_sealed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "letters_public_token_unique" UNIQUE("public_token")
);
--> statement-breakpoint
CREATE TABLE "logbook_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"entry_number" integer,
	"entry_text" text NOT NULL,
	"entry_type" "entry_type" DEFAULT 'observation' NOT NULL,
	"attachments" jsonb,
	"min_clearance_to_view" integer DEFAULT 0,
	"redacted_version" text,
	"is_redacted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_access_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"access_type" "project_access_type" NOT NULL,
	"target_id" uuid,
	"min_clearance" integer,
	"role" "project_role" DEFAULT 'researcher' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "project_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "project_role" DEFAULT 'researcher' NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"assigned_by" uuid,
	CONSTRAINT "project_assignments_project_id_user_id_unique" UNIQUE("project_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_code" text NOT NULL,
	"name" text NOT NULL,
	"codename" text,
	"object_class" text,
	"security_class" "security_class" DEFAULT 'GREEN' NOT NULL,
	"threat_level" "threat_level" DEFAULT 'low' NOT NULL,
	"department_id" uuid,
	"site_assignment" text,
	"status" "project_status" DEFAULT 'active' NOT NULL,
	"description" text,
	"containment_procedures" text,
	"research_protocols" text,
	"progress" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "projects_project_code_unique" UNIQUE("project_code")
);
--> statement-breakpoint
CREATE TABLE "ranks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"clearance_level" integer DEFAULT 1 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ranks_department_id_name_unique" UNIQUE("department_id","name")
);
--> statement-breakpoint
CREATE TABLE "report_reads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"read_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "report_reads_report_id_user_id_unique" UNIQUE("report_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_code" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"summary" text,
	"report_type" "report_type" DEFAULT 'general' NOT NULL,
	"priority" "priority" DEFAULT 'normal' NOT NULL,
	"project_id" uuid,
	"author_id" uuid NOT NULL,
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"min_clearance_to_view" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"acknowledged_at" timestamp,
	"acknowledged_by" uuid,
	"resolved_at" timestamp,
	"resolved_by" uuid,
	CONSTRAINT "reports_report_code_unique" UNIQUE("report_code")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_token" text NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"username" text NOT NULL,
	"display_name" text NOT NULL,
	"title" text,
	"designation" text,
	"clearance_level" integer DEFAULT 0 NOT NULL,
	"primary_department_id" uuid,
	"profile_image" text,
	"bio" text,
	"specializations" text[],
	"is_active" boolean DEFAULT true NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_created_user_id_users_id_fk" FOREIGN KEY ("created_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_members" ADD CONSTRAINT "department_members_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_members" ADD CONSTRAINT "department_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_members" ADD CONSTRAINT "department_members_rank_id_ranks_id_fk" FOREIGN KEY ("rank_id") REFERENCES "public"."ranks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_members" ADD CONSTRAINT "department_members_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_used_by_users_id_fk" FOREIGN KEY ("used_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letters" ADD CONSTRAINT "letters_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logbook_entries" ADD CONSTRAINT "logbook_entries_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logbook_entries" ADD CONSTRAINT "logbook_entries_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_access_rules" ADD CONSTRAINT "project_access_rules_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_access_rules" ADD CONSTRAINT "project_access_rules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ranks" ADD CONSTRAINT "ranks_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_reads" ADD CONSTRAINT "report_reads_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_reads" ADD CONSTRAINT "report_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_acknowledged_by_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_primary_department_id_departments_id_fk" FOREIGN KEY ("primary_department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_activity_user" ON "activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_activity_action" ON "activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_activity_date" ON "activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_apps_status" ON "applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_apps_date" ON "applications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_dept_members_dept" ON "department_members" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "idx_dept_members_user" ON "department_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_dept_members_rank" ON "department_members" USING btree ("rank_id");--> statement-breakpoint
CREATE INDEX "idx_invites_token" ON "invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_letters_token" ON "letters" USING btree ("public_token");--> statement-breakpoint
CREATE INDEX "idx_letters_author" ON "letters" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_logbook_project" ON "logbook_entries" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_logbook_author" ON "logbook_entries" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_logbook_date" ON "logbook_entries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_access_rules_project" ON "project_access_rules" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_access_rules_type" ON "project_access_rules" USING btree ("access_type");--> statement-breakpoint
CREATE INDEX "idx_assign_project" ON "project_assignments" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_assign_user" ON "project_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_projects_code" ON "projects" USING btree ("project_code");--> statement-breakpoint
CREATE INDEX "idx_projects_status" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_projects_security" ON "projects" USING btree ("security_class");--> statement-breakpoint
CREATE INDEX "idx_projects_dept" ON "projects" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "idx_ranks_dept" ON "ranks" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "idx_reports_code" ON "reports" USING btree ("report_code");--> statement-breakpoint
CREATE INDEX "idx_reports_status" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_reports_priority" ON "reports" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_reports_author" ON "reports" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_users_username" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "idx_users_clearance" ON "users" USING btree ("clearance_level");--> statement-breakpoint
CREATE INDEX "idx_users_department" ON "users" USING btree ("primary_department_id");