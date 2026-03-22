CREATE TYPE "public"."verdict" AS ENUM('safe', 'suspicious', 'malicious');
CREATE TABLE "scans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"source_url" text NOT NULL,
	"agent_name" text NOT NULL,
	"verdict" "verdict" NOT NULL,
	"confidence" integer NOT NULL,
	"explanation" text NOT NULL,
	"suspicious_segments" text[],
	"content_hash" text NOT NULL,
	"response_time_ms" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
