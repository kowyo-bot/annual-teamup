CREATE TYPE "public"."teamup_role_category" AS ENUM('RND', 'PRODUCT', 'GROWTH', 'ROOT');--> statement-breakpoint
CREATE TABLE "teamup_annual_meeting_registrations" (
	"user_id" text NOT NULL,
	"attending" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teamup_annual_meeting_registrations_user_id_pk" PRIMARY KEY("user_id")
);
--> statement-breakpoint
CREATE TABLE "teamup_contest_registrations" (
	"user_id" text NOT NULL,
	"status" varchar(24) DEFAULT 'registered' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teamup_contest_registrations_user_id_pk" PRIMARY KEY("user_id")
);
--> statement-breakpoint
CREATE TABLE "teamup_invite_codes" (
	"code" varchar(64) PRIMARY KEY NOT NULL,
	"fixed_role_category" "teamup_role_category",
	"max_uses" integer DEFAULT 1 NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teamup_sessions" (
	"token" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teamup_team_members" (
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role_category" "teamup_role_category" NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teamup_team_members_team_id_user_id_pk" PRIMARY KEY("team_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "teamup_teams" (
	"id" text PRIMARY KEY NOT NULL,
	"status" varchar(24) DEFAULT 'forming' NOT NULL,
	"locked_at" timestamp with time zone,
	"member_count" integer DEFAULT 0 NOT NULL,
	"rnd_count" integer DEFAULT 0 NOT NULL,
	"product_count" integer DEFAULT 0 NOT NULL,
	"growth_count" integer DEFAULT 0 NOT NULL,
	"root_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teamup_users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(64) NOT NULL,
	"employee_id" varchar(64) NOT NULL,
	"role_category" "teamup_role_category" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "teamup_annual_meeting_registrations" ADD CONSTRAINT "teamup_annual_meeting_registrations_user_id_teamup_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."teamup_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teamup_contest_registrations" ADD CONSTRAINT "teamup_contest_registrations_user_id_teamup_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."teamup_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teamup_sessions" ADD CONSTRAINT "teamup_sessions_user_id_teamup_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."teamup_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teamup_team_members" ADD CONSTRAINT "teamup_team_members_team_id_teamup_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teamup_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teamup_team_members" ADD CONSTRAINT "teamup_team_members_user_id_teamup_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."teamup_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "teamup_invite_codes_expires_at_idx" ON "teamup_invite_codes" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "teamup_sessions_user_id_idx" ON "teamup_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "teamup_sessions_expires_at_idx" ON "teamup_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "teamup_team_members_user_id_uniq" ON "teamup_team_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "teamup_team_members_team_id_idx" ON "teamup_team_members" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "teamup_teams_status_idx" ON "teamup_teams" USING btree ("status");--> statement-breakpoint
CREATE INDEX "teamup_teams_created_at_idx" ON "teamup_teams" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "teamup_users_employee_id_uniq" ON "teamup_users" USING btree ("employee_id");