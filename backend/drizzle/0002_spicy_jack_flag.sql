CREATE TYPE "public"."attack_type" AS ENUM('override', 'exfil', 'code_injection', 'jailbreak', 'social_eng', 'indirect_tool', 'obfuscation', 'other');--> statement-breakpoint
CREATE TYPE "public"."scan_status" AS ENUM('scanned', 'unscanned');--> statement-breakpoint
ALTER TABLE "scans" ADD COLUMN "scan_status" "scan_status" DEFAULT 'scanned' NOT NULL;--> statement-breakpoint
ALTER TABLE "scans" ADD COLUMN "attack_type" "attack_type";--> statement-breakpoint
CREATE INDEX "idx_scans_status_timestamp" ON "scans" USING btree ("scan_status","timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_scans_attack_type" ON "scans" USING btree ("attack_type");