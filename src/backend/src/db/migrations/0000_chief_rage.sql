CREATE TABLE "bots" (
	"id" serial PRIMARY KEY NOT NULL,
	"bot_display_name" varchar(255) NOT NULL,
	"bot_image" varchar(255),
	"user_id" integer NOT NULL,
	"meeting_name" varchar(255) NOT NULL,
	"meeting_info" json NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"recording" varchar(255),
	"last_heartbeat" timestamp,
	"status" varchar(255) DEFAULT 'READY_TO_DEPLOY' NOT NULL,
	"deployment_error" varchar(1024),
	"heartbeat_interval" integer NOT NULL,
	"automatic_leave" json NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"bot_id" integer NOT NULL,
	"event_type" varchar(255) NOT NULL,
	"event_time" timestamp NOT NULL,
	"details" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "bots" ADD CONSTRAINT "bots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE no action ON UPDATE no action;