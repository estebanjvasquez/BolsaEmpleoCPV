-- Trigram indexes backing the keyword search on last_position/bio_summary
-- (GET /api/v1/professionals/search, implementation_plan.md §4.3). Without
-- these, ILIKE '%keyword%' falls back to a sequential scan even with
-- pg_trgm enabled — the extension only helps once a gin_trgm_ops index exists.
CREATE INDEX IF NOT EXISTS idx_professionals_last_position_trgm
  ON professionals USING gin (last_position gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_professionals_bio_summary_trgm
  ON professionals USING gin (bio_summary gin_trgm_ops);
