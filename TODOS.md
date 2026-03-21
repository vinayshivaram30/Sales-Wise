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

## Deferred from CEO review (2026-03-21)

### 3. HubSpot CRM Integration (Phase 2)
- **What:** Build HubSpot write-back using the same `services/crm.py` interface created for Salesforce
- **Why:** Expands CRM coverage to the second-most-popular B2B CRM; uses existing abstraction
- **Effort:** L (human: ~1 week / CC: ~1 hour)
- **Priority:** P2
- **Blocked by:** Salesforce Phase 1 must be complete and stable
- **Context:** Deferred from CEO plan review. Salesforce chosen first to avoid splitting focus on two OAuth flows.

### 4. CRM Field Mapping Editor UI
- **What:** User-facing settings page to customize Salesforce/HubSpot field mappings (e.g., map deal_score → custom field)
- **Why:** Different orgs have different Salesforce schemas; hardcoded mappings won't work for all customers
- **Effort:** M (human: ~3 days / CC: ~30 min)
- **Priority:** P3
- **Blocked by:** Salesforce Phase 1 + HubSpot Phase 2
- **Context:** Phase 1 uses hardcoded mappings. Editor deferred to reduce initial CRM scope.
