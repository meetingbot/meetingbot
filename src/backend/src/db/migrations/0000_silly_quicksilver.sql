CREATE TABLE "backend_bots" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"meeting_name" varchar(255),
	"meeting_info" json,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "backend_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"bot_id" integer NOT NULL,
	"event_type" varchar(255) NOT NULL,
	"event_time" timestamp NOT NULL,
	"details" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "backend_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "backend_bots" ADD CONSTRAINT "backend_bots_user_id_backend_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."backend_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backend_events" ADD CONSTRAINT "backend_events_bot_id_backend_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."backend_bots"("id") ON DELETE no action ON UPDATE no action;