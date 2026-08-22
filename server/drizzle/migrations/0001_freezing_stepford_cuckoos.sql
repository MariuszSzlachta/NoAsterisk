CREATE TABLE "dictionaries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"type" varchar(30) NOT NULL,
	"value" varchar(255) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "uq_dictionaries_type_value" UNIQUE("type","value")
);
--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "actions" SET DEFAULT '[]';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "token_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_dictionaries_type" ON "dictionaries" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_categories_workspace" ON "categories" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_import_batches_workspace" ON "import_batches" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_import_profiles_workspace" ON "import_profiles" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_permissions_user" ON "permissions" USING btree ("user_id");