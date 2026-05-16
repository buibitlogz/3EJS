# 3EJS Tech — Session Summary & Pending Actions
**Last updated:** 2026-05-16  
**GitHub repo:** https://github.com/buibitlogz/3EJS  
**Netlify:** Auto-deploys on push to `main`

---

## ✅ COMPLETED THIS SESSION

### Database & Schema Changes
- **Supabase Migration** (`supabase/migration.sql`)
  - Removed: `lcpnapassignment` column from installations table
  - Added: `houselatitude`, `houselongitude`, `port` columns to installations table
  - Created: `historicaldata` table for archived installation records
  - Added RLS policies for public access on installations, historicaldata, eload, users tables

### Type Definitions & Data Layer
- **Types** (`src/lib/types.ts`)
  - Removed: `lcpNapAssignment` field from Installation, InstallationRow, HistoricalDataRow
  - Added: `houseLatitude`, `houseLongitude`, `port` fields to match database schema

- **Unified DB** (`src/lib/unified-db.ts`)
  - Fixed column mapping: `technician` ↔ `assignedTechnician`, `houselatitude` ↔ `houseLatitude`, `houselongitude` ↔ `houseLongitude`, `port` ↔ `port`
  - Ensured `getAllInstallations` and `getAllUsers` return camelCase data via transformation functions

- **Mappers** (`src/lib/mappers.ts`)
  - Removed `lcpNapAssignment` from `normalizeInstallationRow` and `denormalizeInstallationRow`

### UI & Component Changes
- **Installations Page** (`src/app/installations/page.tsx`)
  - Replaced technician search dropdown with simple text input + "Add" button (multi-select, stored as `/`-separated string)
  - Removed `lcpNapAssignment` input field
  - Added `port` input field

- **Subscribers Page** (`src/app/subscribers/page.tsx`)
  - Removed "Notify Status" and "Load Status" dropdowns from subscriber detail modal (now only editable in Clawback Dashboard)
  - Removed `lcpNapAssignment` from form state and UI
  - Added `houseLatitude`, `houseLongitude`, `port` to form state

- **Clawback Dashboard** (`src/app/clawback/page.tsx`)
  - Updated filter: only shows subscribers where `loadStatus !== 'Account Loaded'`
  - "Load Status" now correctly displays "Loaded" or "Account Loaded"

- **Technicians Page** (`src/app/technicians/page.tsx`)
  - Removed `lcpNapAssignment` from installation detail modal

- **Historical Data Store** (`src/stores/historicalDataStore.ts`)
  - Removed `lcpNapAssignment` from normalization logic

### API Routes
- **Installations API** (`src/app/api/installations/route.ts`)
  - Updated `toCamelCaseInstallation` mapping to remove `lcpnapassignment` and ensure correct field mapping

### Key Fixes
- **Data Sync Fix:** Fixed critical bug where Supabase snake_case data was not transformed to camelCase, causing undefined values
- **Missing Columns:** Added `houselatitude`, `houselongitude`, `port` to database and app type definitions
- **Clawback Logic:** Ensured Clawback dashboard only shows subscribers not yet loaded
- **UI Cleanup:** Removed confusing technician search dropdown and redundant status dropdowns

---

## 📋 KEY FILES REFERENCE

| File | Purpose |
|------|---------|
| `supabase/migration.sql` | Database schema changes |
| `src/lib/types.ts` | Type definitions |
| `src/lib/unified-db.ts` | Data sync and transformation |
| `src/lib/mappers.ts` | Row normalization/denormalization |
| `src/app/installations/page.tsx` | Installation form UI |
| `src/app/subscribers/page.tsx` | Subscriber list and modal |
| `src/app/clawback/page.tsx` | Clawback dashboard logic |
| `src/app/technicians/page.tsx` | Technician detail view |
| `src/stores/historicalDataStore.ts` | Historical data store |
| `src/app/api/installations/route.ts` | Installations API |

---

## 📊 DATABASE SCHEMA

### installations table
- `id`, `technician` (assignedTechnician), `modem`, `status`, `dateInstalled`
- `houseLatitude`, `houseLongitude`, `port`
- `loadStatus`, `notifyStatus`, `lcpNapAssignment` (removed)

### historicaldata table
- Archived installation records with same schema as installations

### eload table
- E-Load transactions with `remarks`, `markedUp`, `incentive`, `retailer`, `dealer`

### users table
- User accounts and roles

---

## 🚀 CLI COMMANDS

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Database Migration
# Run supabase/migration.sql in Supabase SQL Editor
```

---

## 🔄 HOW TO CONTINUE IN NEW SESSION
1. Read this file + `AGENTS.md` for multi-agent setup
2. Check `git log --oneline -10` for recent changes
3. Apply `supabase/migration.sql` if schema changes needed
4. After any change: `git add . && git commit -m "..." && git push`
5. Update zips: `Compress-Archive -Path src,public,package.json,package-lock.json,next.config.ts,tsconfig.json,netlify.toml,postcss.config.mjs,.env.production -DestinationPath "E:\3jesv1.zip" -Force`

---

## 📝 PREVIOUS SESSION NOTES (2026-05-06)
- Date T0 corruption fix (`.split('T')[0]` in 4 places)
- Dashboard stat cards: E-Load Incentive + Total Revenue
- Two line graphs with Brush zoom (Installations + Revenue)
- E-Load page: Amount dropdown with formula auto-computation
- Reporting page: Subscriber + E-Load reports with Print
- Chatbot assistant + Mobile bottom nav
- Backfill formula button in Settings → Backup tab