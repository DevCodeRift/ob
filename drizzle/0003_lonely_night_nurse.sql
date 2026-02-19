CREATE TYPE "public"."serpentius_clearance" AS ENUM('ouroboros_sovereign', 'ophidian_apex', 'venom_circle', 'scale_bearer', 'outer_coil');--> statement-breakpoint
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
ALTER TABLE "users" ADD COLUMN "is_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "serpentius_seats" ADD CONSTRAINT "serpentius_seats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serpentius_seats" ADD CONSTRAINT "serpentius_seats_appointed_by_users_id_fk" FOREIGN KEY ("appointed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_serpentius_seat" ON "serpentius_seats" USING btree ("seat_id");--> statement-breakpoint
CREATE INDEX "idx_serpentius_user" ON "serpentius_seats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_serpentius_clearance" ON "serpentius_seats" USING btree ("clearance");