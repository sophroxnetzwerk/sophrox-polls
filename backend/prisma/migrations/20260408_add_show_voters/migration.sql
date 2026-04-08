-- Add showVoters field to PollConfig
ALTER TABLE "PollConfig" ADD COLUMN "showVoters" BOOLEAN NOT NULL DEFAULT false;
