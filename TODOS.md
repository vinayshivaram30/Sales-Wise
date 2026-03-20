# TODOS

## Deferred from eng review (2026-03-20)

### 1. Rename remaining "CloseIt" references in backend
- **What:** `main.py:9` title, `schema.sql:1` comment still say "CloseIt"
- **Why:** Brand consistency — FastAPI /docs page shows old name
- **Effort:** 2 lines, trivial
- **Blocked by:** Nothing

### 2. Add ON DELETE CASCADE to all FK constraints
- **What:** `call_plans`, `transcript_chunks`, `suggestions`, `call_summaries`, `embeddings` all reference `calls(id)` without CASCADE
- **Why:** Eliminates orphaned rows and the fragile 5-table manual delete loop in `calls.py:110-112`
- **Effort:** Migration SQL (ALTER TABLE DROP/ADD CONSTRAINT) + simplify delete endpoint
- **Blocked by:** Requires careful migration on existing data
- **Context:** Accepted as part of Issue 8A in eng review
