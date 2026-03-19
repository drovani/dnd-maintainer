-- Add archived_at column for soft-delete (archive) support
ALTER TABLE campaigns ADD COLUMN archived_at timestamptz;
