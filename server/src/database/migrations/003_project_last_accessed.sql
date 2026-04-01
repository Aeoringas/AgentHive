ALTER TABLE projects ADD COLUMN last_accessed_at TEXT;
UPDATE projects SET last_accessed_at = created_at WHERE last_accessed_at IS NULL;
