ALTER TABLE "users" ADD COLUMN "email_verified" boolean NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "image" text;
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "accounts" ADD COLUMN "id_token" text;
ALTER TABLE "accounts" ADD COLUMN "access_token_expires_at" timestamp;
ALTER TABLE "accounts" ADD COLUMN "refresh_token_expires_at" timestamp;
ALTER TABLE "accounts" ADD COLUMN "scope" text;
