

# Persist Scoring Weights to Database

## Summary
Create a `scoring_rules` database table to store the scoring weights and filtering rules, replacing the current hardcoded local state in `RulesScoring.tsx`.

## Database Changes

**New table: `scoring_rules`**
- `id` (uuid, PK)
- `name` (text)
- `weight` (integer)
- `enabled` (boolean, default true)
- `description` (text)
- `sort_order` (integer)
- `created_at` / `updated_at` (timestamptz)

**New table: `filter_rules`**
- `id` (uuid, PK)
- `name` (text, unique) — e.g. "excludeDissolved", "minScore", "negativePress"
- `enabled` (boolean, default false)
- `created_at` / `updated_at` (timestamptz)

**RLS**: Public SELECT (no auth since auth is disabled), public INSERT/UPDATE/DELETE — or use `true` policies to match current no-auth setup.

**Seed data**: Insert the 5 default scoring rules and 3 filter rules via the migration.

## Frontend Changes

**`src/pages/RulesScoring.tsx`**:
- Fetch scoring rules and filter rules from database on mount
- Save changes on slider/toggle/add/delete with upsert/delete queries
- Add a "Save" button or auto-save on change with debounce
- Show loading skeleton while fetching

## Steps
1. Create migration with both tables, RLS policies, and seed data
2. Update `RulesScoring.tsx` to read/write from database instead of local state

