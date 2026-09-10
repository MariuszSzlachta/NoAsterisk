ALTER TABLE "categories" DROP CONSTRAINT "categories_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "categories"
  ADD CONSTRAINT "categories_workspace_id_workspaces_id_fk"
  FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "import_profiles" DROP CONSTRAINT "import_profiles_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "import_profiles"
  ADD CONSTRAINT "import_profiles_workspace_id_workspaces_id_fk"
  FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "transactions"
  ADD CONSTRAINT "transactions_workspace_id_workspaces_id_fk"
  FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "vaults" DROP CONSTRAINT "vaults_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "vaults"
  ADD CONSTRAINT "vaults_workspace_id_workspaces_id_fk"
  FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "invite_codes" DROP CONSTRAINT "invite_codes_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "invite_codes"
  ADD CONSTRAINT "invite_codes_created_by_users_id_fk"
  FOREIGN KEY ("created_by") REFERENCES "public"."users"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "invite_codes" DROP CONSTRAINT "invite_codes_used_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "invite_codes"
  ADD CONSTRAINT "invite_codes_used_by_users_id_fk"
  FOREIGN KEY ("used_by") REFERENCES "public"."users"("id")
  ON DELETE set null ON UPDATE no action;
