# 3JES Install - Technical Architecture & Code Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Browser (React)                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Page Components (Next.js Pages)                       │ │
│  │  ├── Dashboard                                         │ │
│  │  ├── Installations                                     │ │
│  │  ├── E-Load                                            │ │
│  │  ├── Technicians                                       │ │
│  │  ├── Reporting                                         │ │
│  │  ├── Settings                                          │ │
│  │  └── Login                                             │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Context Providers (State Management)                  │ │
│  │  ├── AuthContext     (User authentication)             │ │
│  │  ├── ThemeContext    (Light/Dark & colors)             │ │
│  │  └── SheetsContext   (Google Sheets data)              │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Custom Hooks                                          │ │
│  │  ├── useAuth()      - User & login state               │ │
│  │  ├── useTheme()     - Theme & color settings           │ │
│  │  └── useSheets()    - Data from Google Sheets          │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Components (Reusable UI)                              │ │
│  │  ├── Header          - Navigation & user info          │ │
│  │  ├── Sidebar         - Menu navigation                 │ │
│  │  ├── ThemeSwitcher   - Theme controls                  │ │
│  │  ├── Charts          - Data visualization              │ │
│  │  └── Forms           - Data input                      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             ↓ HTTP
┌─────────────────────────────────────────────────────────────┐
│                  Next.js Server (Backend)                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  API Routes (Next.js Route Handlers)                   │ │
│  │  ├── /api/auth/*         - Authentication              │ │
│  │  │   ├── login           - User login endpoint          │ │
│  │  │   ├── register        - User registration            │ │
│  │  │   └── verify          - Token verification           │ │
│  │  │                                                     │ │
│  │  └── /api/sheets/*       - Data Operations             │ │
│  │      ├── installations   - Installation CRUD            │ │
│  │      ├── eload           - E-Load transactions          │ │
│  │      └── modems          - Defective modems             │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Utilities & Libraries                                 │ │
│  │  ├── auth-utils.ts    - JWT & password hashing         │ │
│  │  ├── google-sheets.ts - Google Sheets API client       │ │
│  │  └── types.ts         - TypeScript interfaces          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             ↓ API
┌─────────────────────────────────────────────────────────────┐
│              External Services                              │
│  ├── Google Sheets API - Data storage & sync               │
│  └── Google Auth API   - Service account authentication    │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Authentication Flow
```
1. User enters credentials on Login page
2. POST /api/auth/login { email, password }
3. Server validates credentials (bcryptjs.compare)
4. Server generates JWT token
5. Token stored in browser localStorage
6. User redirected to Dashboard
7. Each request includes token in Authorization header
8. Server validates token with verifyToken()
```

### Data Synchronization Flow (Google Sheets)
```
1. User submits form (e.g., New Installation)
2. Client POST to /api/sheets/installations
3. Server validates data
4. Server calls appendInstallation() from google-sheets.ts
5. Google Sheets API appends row
6. Server confirms success to client
7. Client re-fetches data via fetchInstallations()
8. Local state updates
9. UI re-renders with new data
```

### Theme Management Flow
```
1. User changes theme/mode in ThemeSwitcher
2. setTheme() in ThemeContext called
3. State updated
4. useEffect triggers
5. CSS variables on document root updated
6. Tailwind classes re-applied
7. Theme stored in localStorage
8. On page reload, theme restored from localStorage
```

## Code Organization

### /src/app/
**Next.js Pages & API Routes**

Pages are organized by feature:
```
app/
├── page.tsx              # Home (redirects to login/dashboard)
├── layout.tsx            # Root layout with providers
├── globals.css           # Global styles & CSS variables
├── login/page.tsx        # Authentication page
├── dashboard/page.tsx    # Dashboard with charts
├── installations/page.tsx # Installation management
├── eload/page.tsx        # E-Load system
├── technicians/page.tsx  # Technician directory
├── reporting/page.tsx    # Reports & analytics
├── settings/page.tsx     # User & system settings
└── api/
    ├── auth/
    │   ├── login/route.ts     # POST /api/auth/login
    │   ├── register/route.ts  # POST /api/auth/register
    │   └── verify/route.ts    # POST /api/auth/verify
    └── sheets/
        ├── installations/route.ts     # CRUD for installations
        ├── installations/[id]/route.ts # PATCH specific installation
        ├── eload/route.ts             # CRUD for E-Load
        └── modems/route.ts            # CRUD for modems
```

### /src/components/
**Reusable UI Components**

```
components/
├── common/
│   ├── Header.tsx        # Top navigation bar
│   ├── Sidebar.tsx       # Sidebar menu navigation
│   └── LayoutWrapper.tsx # Layout provider component
├── theme/
│   └── ThemeSwitcher.tsx # Theme controls
├── auth/                 # Authentication components
├── forms/                # Form components
└── dashboard/            # Dashboard-specific components
```

### /src/context/
**React Context for State Management**

```
AuthContext.tsx
├── User authentication state
├── login() function
├── logout() function
├── register() function
└── useAuth() hook

ThemeContext.tsx
├── Current theme (mode + color)
├── setMode() function
├── setColor() function
├── toggleMode() function
└── useTheme() hook

SheetsContext.tsx
├── Installations data
├── E-Load transactions
├── Defective modems
├── addInstallation()
├── updateInstallation()
├── addELoadTransaction()
├── reportModem()
└── useSheets() hook
```

### /src/lib/
**Utilities & Business Logic**

```
types.ts
├── User interface
├── Installation interface
├── ELoadTransaction interface
├── DefectiveModem interface
├── ThemeConfig interface
└── DashboardMetrics interface

auth-utils.ts
├── hashPassword() - bcryptjs hashing
├── verifyPassword() - password comparison
├── generateToken() - JWT token creation
├── verifyToken() - JWT token validation
└── checkPermission() - role-based access check

google-sheets.ts
├── getAuthClient() - Google auth setup
├── appendInstallation() - Add new installation
├── updateInstallation() - Update status
├── getInstallations() - Fetch all
├── appendELoadTransaction() - Add e-load
├── getELoadTransactions() - Fetch e-load
├── reportDefectiveModem() - Add modem issue
└── getDefectiveModems() - Fetch modems
```

### /src/hooks/
**Custom React Hooks**

```
useAuth.ts
├── useAuth() - Auth context access
└── useRequireRole() - Role validation

useTheme.ts
└── useTheme() - Theme context access

useSheets.ts
└── useSheets() - Sheets context access
```

## Key Design Patterns

### 1. Context API for State
Instead of Redux, using React Context API:
- Lighter weight
- Built-in to React
- Perfect for this app scale
- Supports local storage persistence

### 2. Custom Hooks for Encapsulation
Each context has a corresponding hook:
```typescript
// Usage
const { user, login, logout } = useAuth();
const { theme, setMode, setColor } = useTheme();
const { installations, addInstallation } = useSheets();
```

### 3. Role-Based Access Control (RBAC)
Implemented at multiple levels:
```typescript
// Route level
if (user.role === UserRole.ADMIN) { /* allow */ }

// Component level
{hasAccess && <AdminPanel />}

// API level
if (!checkPermission(user.role, requiredRole)) { 
  return 403 Forbidden 
}
```

### 4. Theme CSS Variables
Global theming using CSS custom properties:
```css
:root {
  --color-primary: #0066cc;
  --color-secondary: #003d99;
  --color-accent: #66ccff;
  --color-background: #f5f7fa;
  --color-surface: #ffffff;
  --color-text: #1a1a1a;
}
```

Updated dynamically by ThemeContext.

### 5. Layout Wrapper Pattern
Ensures all pages have consistent:
- Header & navigation
- Auth checks
- Provider access
- Error handling

## API Route Structure

### Authentication Routes

#### POST /api/auth/login
Request:
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "user": {
    "id": "1",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /api/auth/register
Request:
```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "secure123"
}
```

Response: Same as login

#### POST /api/auth/verify
Request:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Response: User object (if valid), 401 error (if invalid)

### Sheets Routes

#### GET /api/sheets/installations
Returns array of all installations

#### POST /api/sheets/installations
Request:
```json
{
  "subscriberName": "Juan Dela Cruz",
  "address": "Manila",
  "package": "Premium 50Mbps",
  "assignedTech": "John Tech",
  "status": "pending"
}
```

#### PATCH /api/sheets/installations/[id]
Request:
```json
{
  "status": "completed"
}
```

## Security Implementation

### Password Security
```typescript
// Hashing (on registration/password change)
const hashed = await hashPassword(password); // bcryptjs

// Verification (on login)
const match = await verifyPassword(password, hashed);
```

### JWT Authentication
```typescript
// Generation
const token = jwt.sign({ id, email, role }, JWT_SECRET, { 
  expiresIn: '7d' 
});

// Verification
const user = jwt.verify(token, JWT_SECRET);
```

### Role-Based Access
```typescript
const roles = {
  admin: ['read_all', 'write_all', 'delete_all'],
  technician: ['read_own', 'update_installations', 'report_modem'],
  eload: ['read_eload', 'write_eload'],
  view_only: ['read_reports']
};
```

## Performance Optimizations

### 1. Code Splitting
- Each page is a separate chunk
- Automatic by Next.js

### 2. Image Optimization
- Use next/image component
- Automatic WebP conversion
- Lazy loading

### 3. API Route Optimization
- Server-side rendering for initial load
- Client-side fetching for updates
- Caching via browser localStorage

### 4. Animation Optimization
- Framer Motion uses GPU acceleration
- Respects prefers-reduced-motion
- Only animates when needed

## Database Integration (Future)

To replace mock data with real database:

1. Update `/lib/google-sheets.ts`:
```typescript
// Replace with database calls
export async function getInstallations() {
  // Instead of API calls to Google Sheets
  const data = await db.query('SELECT * FROM installations');
  return data;
}
```

2. Update API routes:
```typescript
// Replace mock data with database
export async function GET() {
  const installations = await getInstallations();
  return NextResponse.json(installations);
}
```

## Testing Strategy (To Implement)

```
tests/
├── unit/
│   ├── auth-utils.test.ts
│   ├── types.test.ts
│   └── helpers.test.ts
├── integration/
│   ├── api.test.ts
│   └── context.test.ts
└── e2e/
    ├── login.spec.ts
    ├── dashboard.spec.ts
    └── workflow.spec.ts
```

## Deployment Checklist

- [ ] Set environment variables in hosting
- [ ] Update JWT_SECRET to strong random string
- [ ] Configure Google Sheets credentials
- [ ] Set up HTTPS/SSL
- [ ] Configure CORS headers
- [ ] Set up error logging
- [ ] Configure database backups
- [ ] Test all user roles
- [ ] Test API endpoints
- [ ] Performance testing
- [ ] Security audit

---

This architecture provides a scalable, maintainable foundation for the 3JES Install system.
