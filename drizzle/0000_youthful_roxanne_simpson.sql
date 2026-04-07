CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"collaboration_type" text NOT NULL,
	"description" text NOT NULL,
	"budget" text,
	"timeline" text,
	"referral" text,
	"locale" text DEFAULT 'en' NOT NULL,
	"odoo_lead_id" integer,
	"extra_fields" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
