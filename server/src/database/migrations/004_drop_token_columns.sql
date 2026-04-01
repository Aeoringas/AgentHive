ALTER TABLE tasks DROP COLUMN token_total;
ALTER TABLE sessions DROP COLUMN token_total;
ALTER TABLE messages DROP COLUMN token_usage;
ALTER TABLE messages DROP COLUMN generation_time_ms;
ALTER TABLE subagent_records DROP COLUMN token_usage;
