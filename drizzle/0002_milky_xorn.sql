CREATE TYPE "public"."covenant_role" AS ENUM('sovereign', 'keeper', 'initiate', 'aspirant');--> statement-breakpoint
CREATE TYPE "public"."proposal_status" AS ENUM('pending', 'under_review', 'approved', 'rejected', 'revision');--> statement-breakpoint
CREATE TABLE "covenant_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"target_user_id" uuid,
	"target_name" text NOT NULL,
	"proposed_title" text NOT NULL,
	"proposed_role" "covenant_role" DEFAULT 'aspirant' NOT NULL,
	"proposed_sigil" text,
	"invocation_text" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"username" text,
	"password_hash" text,
	CONSTRAINT "covenant_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "covenant_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"covenant_title" text NOT NULL,
	"covenant_role" "covenant_role" DEFAULT 'aspirant' NOT NULL,
	"oath_taken_at" timestamp NOT NULL,
	"inducted_by" uuid,
	"sigil" text,
	"motto" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "covenant_members_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "project_departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	CONSTRAINT "project_departments_project_id_department_id_unique" UNIQUE("project_id","department_id")
);
--> statement-breakpoint
CREATE TABLE "project_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"codename" text,
	"object_class" text,
	"security_class" "security_class" DEFAULT 'GREEN' NOT NULL,
	"threat_level" "threat_level" DEFAULT 'low' NOT NULL,
	"site_assignment" text,
	"description" text,
	"containment_procedures" text,
	"research_protocols" text,
	"justification" text,
	"estimated_resources" text,
	"proposed_timeline" text,
	"status" "proposal_status" DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"rejection_reason" text,
	"revision_notes" text,
	"submitted_by" uuid NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"created_project_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_clearance_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"clearance_level" integer NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "proposal_departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	CONSTRAINT "proposal_departments_proposal_id_department_id_unique" UNIQUE("proposal_id","department_id")
);
--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "requested_department_id" uuid;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "requested_rank_id" uuid;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "covenant_invitations" ADD CONSTRAINT "covenant_invitations_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "covenant_invitations" ADD CONSTRAINT "covenant_invitations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "covenant_members" ADD CONSTRAINT "covenant_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "covenant_members" ADD CONSTRAINT "covenant_members_inducted_by_users_id_fk" FOREIGN KEY ("inducted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_departments" ADD CONSTRAINT "project_departments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_departments" ADD CONSTRAINT "project_departments_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_proposals" ADD CONSTRAINT "project_proposals_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_proposals" ADD CONSTRAINT "project_proposals_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_proposals" ADD CONSTRAINT "project_proposals_created_project_id_projects_id_fk" FOREIGN KEY ("created_project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_clearance_requirements" ADD CONSTRAINT "proposal_clearance_requirements_proposal_id_project_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."project_proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_departments" ADD CONSTRAINT "proposal_departments_proposal_id_project_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."project_proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_departments" ADD CONSTRAINT "proposal_departments_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_covenant_invite_token" ON "covenant_invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_covenant_user" ON "covenant_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_covenant_role" ON "covenant_members" USING btree ("covenant_role");--> statement-breakpoint
CREATE INDEX "idx_proj_depts_project" ON "project_departments" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_proposals_status" ON "project_proposals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_proposals_submitter" ON "project_proposals" USING btree ("submitted_by");--> statement-breakpoint
CREATE INDEX "idx_proposals_date" ON "project_proposals" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_prop_clearance_proposal" ON "proposal_clearance_requirements" USING btree ("proposal_id");--> statement-breakpoint
CREATE INDEX "idx_prop_depts_proposal" ON "proposal_departments" USING btree ("proposal_id");--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_requested_department_id_departments_id_fk" FOREIGN KEY ("requested_department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_requested_rank_id_ranks_id_fk" FOREIGN KEY ("requested_rank_id") REFERENCES "public"."ranks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_apps_username" ON "applications" USING btree ("username");