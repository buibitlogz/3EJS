# 3EJS Tech - ISP Management Application

A comprehensive, production-grade web application for managing Internet Service Provider operations including subscriber management, E-Load transactions, technician tracking, and clawback monitoring. Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase PostgreSQL.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Development
npm run dev

# Production build
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint
```

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Module Documentation](#module-documentation)
- [API Reference](#api-reference)
- [Deployment](#deployment)

---

## ✨ Features

### 1. **Dashboard** (`/dashboard`)
- **Stat Cards**: Total Subscribers, E-Load Incentive, E-Load Transactions, Total Revenue
- **Subscriber Growth Graph**: Monthly installations with Brush zoom (all-time data)
- **E-Load Revenue Graph**: Incentive + Total Revenue with Brush zoom
- **Recent Installations Table**: Latest 10 installations with double-click detail view
- **Top Technicians**: Ranking by installation count
- **Load Expiry Tracker**: Upcoming/expiring load subscriptions

### 2. **Clawback Dashboard** (`/clawback`)
- **Risk Monitoring**: Shows subscribers with `loadStatus !== 'Account Loaded'` AND `notifyStatus === 'Not Yet Notified'`
- **Time-based Filtering**: 30/60/90 days options
- **Search Functionality**: Filter by name, account, phone, technician
- **Address Display**: Full address with blank display for null values
- **Stat Card**: Single "Risk for Clawback" count
- **Modal Actions**: Mark as Notified / Mark as Loaded with confirmation dialogs

### 3. **Subscribers Management** (`/subscribers`)
- **Subscriber List**: Searchable, sortable grid
- **Detail Modal**: View/edit subscriber information
- **Date Sort**: Dropdown (Latest First / Oldest First)
- **Fields**: Name, Account #, Contact, Address, Technician, Load/Notify Status
- **Status Editing**: Only via Clawback Dashboard (removed from modal)

### 4. **E-Load System** (`/eload`)
- **Transaction Entry**: Amount dropdown with auto-computed values
  - Options: 50 (1 DAY), 200 (7 DAYS), 300 (15 DAYS), 700 (30 DAYS)
- **Formula Auto-computation**:
  | Amount | Marked Up | Retailer | Dealer | Incentive |
  |--------|-----------|----------|--------|-----------|
  | 700    | 10        | 28       | 21     | 49        |
  | 300    | 10        | 15.2     | 11.4   | 26.6      |
  | 200    | 19        | 8        | 6      | 14        |
  | 50     | 5         | 2        | 1.5    | 3.5       |
- **TOPER Filter**: Shows only records with "TOPER" in remarks
- **Search**: Filter by GCash, account, reference number
- **Duplicate Prevention**: Blocks submission of duplicate reference numbers
- **Stats**: Total (count+amount), Accounts, Total Incentive

### 5. **Technicians** (`/technicians`)
- **Technician Directory**: List of all technicians
- **Installation Detail**: View assigned installations
- **Performance Metrics**: Installation count tracking

### 6. **New Installations** (`/installations`)
- **Installation Form**: Manual entry with validation
- **Technician Input**: Text input + Add button (multi-select, `/`-separated)
- **Fields**: Subscriber details, modem info, port, coordinates
- **Removed**: LCP Nap Assignment (deprecated)

### 7. **Reporting** (`/reporting`)
- **Tab Switcher**: Subscriber Report | E-Load Report
- **Subscriber Report**:
  - Statistics cards
  - Daily breakdown
  - Technician performance
  - Records table with Print button
- **E-Load Report**:
  - Stats cards
  - Records table (Date, GCash, Account, Amount)
  - Centered headers
  - Print button

### 8. **Settings** (`/settings`)
- **Backup Tab**: Backfill Formula button for Google Sheets sync
- **User Management**: Role-based access control
- **System Configuration**: App settings

### 9. **Chatbot Assistant**
- **Floating Button**: Bottom-right corner
- **Cute Character**: Animated glasses + folder icon
- **Query Support**: Subscribers, E-Load totals, technicians

### 10. **Mobile Navigation**
- **Persistent Bottom Nav**: Always visible on mobile
- **Larger Icons**: Touch-friendly design
- **Labels**: Clear navigation text

---

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand (IndexedDB persistence)
- **Animations**: Framer Motion
- **Charts**: Recharts (with Brush component)
- **Forms**: React Hook Form + Zod validation

### Backend
- **Runtime**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **ORM**: Custom unified database layer
- **Authentication**: JWT + bcryptjs

### Data Layer
- **Local Storage**: IndexedDB (via Zustand stores)
- **Sync**: Bi-directional sync with Supabase
- **Type Safety**: Unified TypeScript types across stack

### Deployment
- **Platform**: Netlify
- **CI/CD**: Auto-deploy on push to `main`
- **Environment**: `.env.production`

---

## 📁 Project Structure

```
3EJS-main/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── login/route.ts          # Login endpoint
│   │   │   ├── eload/
│   │   │   │   └── route.ts                # E-Load CRUD
│   │   │   ├── installations/
│   │   │   │   ├── route.ts                # Installations list
│   │   │   │   └── [id]/route.ts           # Single installation
│   │   │   └── users/
│   │   │       └── route.ts                # User management
│   │   ├── clawback/
│   │   │   └── page.tsx                    # Clawback dashboard
│   │   ├── dashboard/
│   │   │   └── page.tsx                    # Main dashboard
│   │   ├── eload/
│   │   │   └── page.tsx                    # E-Load module
│   │   ├── installations/
│   │   │   └── page.tsx                    # New installations
│   │   ├── login/
│   │   │   └── page.tsx                    # Login page
│   │   ├── reporting/
│   │   │   └── page.tsx                    # Reports
│   │   ├── subscribers/
│   │   │   └── page.tsx                    # Subscriber list
│   │   ├── technicians/
│   │   │   └── page.tsx                    # Technicians
│   │   └── settings/
│   │       └── page.tsx                    # Settings
│   ├── components/
│   │   ├── common/
│   │   │   ├── ChatAssistant.tsx           # Chatbot component
│   │   │   ├── MobileNav.tsx               # Mobile navigation
│   │   │   ├── PageContainer.tsx           # Layout wrapper
│   │   │   └── RechartsLazy.tsx            # Lazy-loaded charts
│   │   └── sync/
│   │       └── SyncProvider.tsx            # Sync context
│   ├── hooks/
│   │   └── useAuth.ts                      # Authentication hook
│   ├── lib/
│   │   ├── types.ts                        # TypeScript interfaces
│   │   ├── unified-db.ts                   # Database abstraction
│   │   ├── mappers.ts                      # Data transformation
│   │   ├── utils.ts                        # Utility functions
│   │   └── axios.ts                        # HTTP client
│   └── stores/
│       ├── subscribersStore.ts             # Subscriber state
│       ├── eloadStore.ts                   # E-Load state
│       └── techniciansStore.ts             # Technician state
├── supabase/
│   └── migration.sql                       # Database migrations
├── .env.production                         # Environment variables
├── next.config.ts                          # Next.js config
├── tailwind.config.ts                      # Tailwind config
└── tsconfig.json                           # TypeScript config
```

---

## 🏗 Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface                          │
│  (React Components + Zustand Stores)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   SyncProvider (Context)                     │
│  - Login sync trigger                                        │
│  - 5-minute background sync                                  │
│  - Tab focus sync                                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                Unified Database Layer                        │
│  - getAllInstallations()                                     │
│  - getAllELoad()                                             │
│  - toCamelCase transformation                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase (PostgreSQL)                      │
│  - installations                                             │
│  - eload                                                     │
│  - users                                                     │
└─────────────────────────────────────────────────────────────┘
```

### State Management

- **Zustand Stores**: Each module has its own store with IndexedDB persistence
- **Sync Flow**:
  1. User logs in → `SyncProvider` detects `user.id`
  2. Checks `sessionStorage('db_synced_session')`
  3. `syncFromSheets(webappUrl)` → writes to IndexedDB
  4. Dispatches `db-synced` event (50ms delay)
  5. All stores + `SheetsContext` re-fetch
  6. Tab focus / 5-min timer → background sync (no clear)

---

## 🗄 Database Schema

### `installations` Table

```sql
id                TEXT PRIMARY KEY
no                TEXT
dateInstalled     TEXT           -- Date only (YYYY-MM-DD), no time component
agentName         TEXT
joNumber          TEXT
accountNumber     TEXT
subscriberName    TEXT
contactNumber1    TEXT
contactNumber2    TEXT
houseLatitude     TEXT           -- GPS coordinates
houseLongitude    TEXT
port              TEXT
napBoxLonglat     TEXT
assignedTechnician TEXT
modemSerial       TEXT
reelNo            TEXT
startLocation     TEXT
endLocation       TEXT
fiberOpticCable   TEXT
mechanicalConnector TEXT
sClamp            TEXT
patchcordApsc     TEXT
houseBracket      TEXT
midspan           TEXT
cableClip         TEXT
ftthTerminalBox   TEXT
doubleSidedTape   TEXT
cableTieWrap      TEXT
status            TEXT           -- 'pending' | 'completed'
loadExpire        TEXT
notifyStatus      TEXT           -- 'Not Yet Notified' | 'Notified'
loadStatus        TEXT           -- 'Not yet Loaded' | 'Account Loaded'
address           TEXT
createdAt         TIMESTAMP
updatedAt         TIMESTAMP
```

### `eload` Table

```sql
id                TEXT PRIMARY KEY
dateLoaded        TEXT
accountNumber     TEXT
gcashNumber       TEXT
amount            INTEGER
markedUp          DECIMAL        -- Markup amount
incentive         DECIMAL        -- Incentive amount
retailer          DECIMAL        -- Retailer share
dealer            DECIMAL        -- Dealer share
remarks           TEXT           -- "TOPER" flag for filtering
createdAt         TIMESTAMP
```

### `users` Table

```sql
id                TEXT PRIMARY KEY
email             TEXT UNIQUE
password          TEXT           -- bcryptjs hash
name              TEXT
role              TEXT           -- 'admin' | 'technician' | 'eload' | 'view_only'
phone             TEXT
createdAt         TIMESTAMP
updatedAt         TIMESTAMP
```

### RLS Policies

All tables have SELECT, INSERT, UPDATE, DELETE policies for authenticated users.

---

## 🔌 API Reference

### Authentication

**POST** `/api/auth/login`
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```
Response: `{ token: string, user: User }`

### Installations

**GET** `/api/installations` - List all installations  
**POST** `/api/installations` - Create installation  
**PATCH** `/api/installations/[id]` - Update installation  
**DELETE** `/api/installations/[id]` - Delete installation

### E-Load

**GET** `/api/eload` - List transactions  
**POST** `/api/eload` - Create transaction  
**PATCH** `/api/eload/[id]` - Update transaction

### Users

**GET** `/api/users` - List users (admin only)  
**POST** `/api/users` - Create user (admin only)

---

## 🚀 Deployment

### Netlify Auto-Deploy

1. Push to `main` branch
2. Netlify automatically builds and deploys
3. Set environment variables in Netlify dashboard

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
JWT_SECRET=your_jwt_secret
```

### Build Commands

```bash
npm run build     # Production build
npm start         # Start production server
```

---

## 📝 Key Implementation Details

### Date Handling

- **Storage**: `YYYY-MM-DD` format (no time component)
- **Display**: `formatDateDisplay()` handles Excel serial, ISO, and MM/DD/YYYY formats
- **Fix**: All `.split('T')[0]` to strip time component before parsing

### NULL/Empty Values

- **Display**: Completely blank (empty string `''`), no dashes or placeholders
- **Example**: `{sub.address || ''}` instead of `{sub.address || '-'}`

### Formula Computation

E-Load amounts auto-compute using hardcoded formula table in `src/stores/eloadStore.ts`:

```typescript
const AMOUNT_COMPUTED = new Map([
  [700, { markedUp: 10, retailer: 28, dealer: 21, incentive: 49 }],
  [300, { markedUp: 10, retailer: 15.2, dealer: 11.4, incentive: 26.6 }],
  [200, { markedUp: 19, retailer: 8, dealer: 6, incentive: 14 }],
  [50, { markedUp: 5, retailer: 2, dealer: 1.5, incentive: 3.5 }]
]);
```

---

## 🔧 Development Guidelines

### Adding New Features

1. Update `src/lib/types.ts` with new interfaces
2. Create/modify store in `src/stores/`
3. Add API route in `src/app/api/`
4. Create component in `src/app/` or `src/components/`
5. Run type check: `npm run typecheck`
6. Run lint: `npm run lint`
7. Build: `npm run build`

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier + ESLint
- **Components**: Functional components with hooks
- **State**: Zustand for global state
- **API**: Axios with interceptors

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🤝 Support

For issues or questions:
- Check `SESSION_SUMMARY.md` for recent changes
- Review `AGENTS.md` for multi-agent workflow
- See `ARCHITECTURE.md` for system design