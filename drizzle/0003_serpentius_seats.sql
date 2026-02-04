CREATE TYPE "public"."serpentius_clearance" AS ENUM('ophidian_apex', 'venom_circle', 'scale_bearer', 'outer_coil');--> statement-breakpoint
CREATE TABLE "serpentius_seats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seat_id" text NOT NULL,
	"position" text NOT NULL,
	"serpent_title" text NOT NULL,
	"clearance" "serpentius_clearance" NOT NULL,
	"symbol" text DEFAULT '⛧' NOT NULL,
	"duties" text NOT NULL,
	"obligations" text NOT NULL,
	"user_id" uuid,
	"member_name" text,
	"member_discord" text,
	"member_image" text,
	"appointed_at" timestamp,
	"appointed_by" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "serpentius_seats_seat_id_unique" UNIQUE("seat_id")
);
--> statement-breakpoint
ALTER TABLE "serpentius_seats" ADD CONSTRAINT "serpentius_seats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serpentius_seats" ADD CONSTRAINT "serpentius_seats_appointed_by_users_id_fk" FOREIGN KEY ("appointed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_serpentius_seat" ON "serpentius_seats" USING btree ("seat_id");--> statement-breakpoint
CREATE INDEX "idx_serpentius_user" ON "serpentius_seats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_serpentius_clearance" ON "serpentius_seats" USING btree ("clearance");--> statement-breakpoint

-- Seed initial seat definitions
INSERT INTO "serpentius_seats" ("seat_id", "position", "serpent_title", "clearance", "symbol", "duties", "obligations", "sort_order") VALUES
-- OPHIDIAN APEX
('prime_minister', 'Prime Minister', 'The Basilisk', 'ophidian_apex', '👁', 'Supreme coordination of all state affairs. Holds veto authority over all non-Imperial directives. Responsible for maintaining the delicate balance between overt governance and covert operations.', 'Must ensure the Order''s influence permeates all branches of government without detection. Bears ultimate responsibility for operational security of the Serpentius. Reports directly to the throne.', 1),
('science_minister', 'Science Minister', 'Keeper of the Ouroboros', 'ophidian_apex', '◎', 'Chairs the Serpentius council. Oversees all scientific research, technological development, and the classified programs of the Ouroboros Foundation. Controls access to forbidden knowledge and determines what discoveries may be released to the public sphere.', 'Must safeguard the Foundation''s most dangerous secrets. Responsible for vetting all researchers for Serpentius compatibility. Ensures scientific progress serves the Order''s long-term objectives.', 2),
('secret_police_director', 'Director of the Secret Police', 'The Black Mamba', 'ophidian_apex', '🗡', 'Commands the clandestine enforcement apparatus. Conducts internal purges, eliminates threats to state security, and maintains dossiers on all persons of interest. Operates beyond the boundaries of conventional law.', 'Must execute termination orders without hesitation or record. Responsible for silencing those who learn too much. Ensures no trace of Serpentius activities can be connected to the state.', 3),
('intelligence_director', 'Director of Intelligence Services', 'The Serpent''s Eye', 'ophidian_apex', '◉', 'Controls all foreign and domestic intelligence gathering. Manages spy networks, conducts espionage operations, and provides strategic intelligence assessments to the council.', 'Must maintain absolute information superiority over all potential adversaries. Responsible for early detection of threats to the Order. Shares all critical intelligence with Apex members without delay.', 4),
('konsul', 'Konsul of the White Rose Party', 'The Hydra', 'ophidian_apex', '⚜', 'Controls the single party apparatus and all political machinery. Manages public ideology, party membership, and ensures political loyalty throughout the state. The public face of legitimate authority.', 'Must ensure the Party serves as a perfect shield for Serpentius operations. Responsible for cultivating useful political assets and eliminating internal dissent. Maintains the illusion of ideological governance.', 5),
('praetor', 'Praetor', 'The Anaconda', 'ophidian_apex', '⚔', 'Commands the Paramilitary forces and oversees the Interior Ministry. Responsible for internal security, civil order, and the suppression of unrest. Controls all domestic enforcement outside conventional police.', 'Must be prepared to deploy force against any internal threat without public justification. Responsible for maintaining Serpentius safe houses and extraction routes. Coordinates with The Black Mamba on sensitive operations.', 6),

-- VENOM CIRCLE
('truth_minister', 'Truth Minister', 'The Forked Tongue', 'venom_circle', '📜', 'Controls all information, propaganda, and public narrative. Manages state media, censorship apparatus, and the official version of history. Shapes public consciousness to serve the Order''s needs.', 'Must ensure no unauthorized information reaches the public. Responsible for crafting cover stories for Serpentius operations. Creates and maintains false narratives as directed by Apex members.', 7),
('war_minister', 'War Minister', 'The Viper', 'venom_circle', '⚔', 'Commands the armed forces and oversees military strategy. Responsible for defense planning, weapons procurement, and military operations both declared and undeclared.', 'Must ensure military assets can be deployed for Serpentius objectives when required. Responsible for maintaining plausible deniability in covert military actions. Coordinates with intelligence on strategic threats.', 8),
('nsb_director', 'Director of the National Security Bureau', 'The Cobra', 'venom_circle', '🛡', 'Commands all political police operations. Monitors ideological loyalty, investigates political crimes, and maintains surveillance on persons of interest. The visible arm of state security.', 'Must share all surveillance data with Apex members upon request. Responsible for identifying potential Serpentius recruits and threats alike. Maintains the public security apparatus as cover for deeper operations.', 9),
('vsk_commander', 'Commander of the VSK', 'The Boa', 'venom_circle', '💀', 'Commands the Paramilitary Army Group. Responsible for large-scale internal security operations, regime protection, and serving as a counterweight to the regular military.', 'Must execute deployment orders from the Praetor without question. Responsible for maintaining combat readiness for internal contingencies. Serves as the Order''s iron fist when conventional forces are inappropriate.', 10),

-- SCALE BEARER
('foreign_minister', 'Foreign Minister', 'The Sidewinder', 'scale_bearer', '🌐', 'Manages diplomatic relations and foreign policy. Represents the state in international affairs, negotiates treaties, and maintains the nation''s public image abroad.', 'Must coordinate foreign messaging with The Forked Tongue. Provides diplomatic cover for intelligence operations when required. Maintains ignorance of Apex-level operations for plausible deniability.', 11),
('finance_minister', 'Finance Minister', 'The Python', 'scale_bearer', '💰', 'Controls state finances, taxation, and economic policy. Manages the treasury and ensures the fiscal health of the state. Oversees banking regulations and monetary policy.', 'Must maintain hidden funding channels for Serpentius operations. Responsible for laundering sensitive expenditures through legitimate budgets. Ensures financial records reveal nothing of the Order''s activities.', 12),

-- OUTER COIL
('kaiser_guard_commander', 'Commander of the Kaiser Guard', 'Scale of the Crown', 'outer_coil', '👑', 'Commands the Emperor''s personal guard force. Responsible for the physical security of the Imperial person and the protection of the Imperial household.', 'Knows of the Serpentius but is deliberately excluded from operational knowledge. Loyalty must remain singular to the throne. Serves as a check against the Order itself should it ever threaten Imperial authority.', 13);
