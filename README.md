# Sophrox Polls

Self-hosted polling application with Discord OAuth integration.

## Quick Start

**Development:**
```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (new terminal)
cd sophrox-polls && npm install && npm run dev
```

**Docker:**
```bash
cp .env.example .env.production
# Edit .env.production with your Discord credentials
docker-compose --env-file .env.production up -d
```

See [`README.DOCKER.md`](./README.DOCKER.md) for Docker setup details.

## Features

- 🔐 Discord OAuth Authentication
- 🎨 Category System with Discord Role Colors
- 🗳️ Real-time Polling with Vote Limits
- 🤖 Automatic Discord Role Color Sync
- ⚡ Built with React + Express + Prisma
- 🐳 Docker Ready

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS, ShadCN UI
- **Backend**: Express.js, TypeScript, Prisma ORM
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Auth**: Discord OAuth + JWT

## Documentation

- [Docker Deployment](./README.DOCKER.md) - Quick Docker setup
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment & CI/CD

## Discord Setup

1. Create Discord Application → https://discord.com/developers/applications
2. Add OAuth2 Redirect URI: `https://your-domain.com/auth/discord`
3. Copy Client ID & Secret to `.env`
4. Create Discord Bot with required intents
5. Add bot to your guild with `manage_roles` permission


## 📋 Tech Stack

### Frontend
- React 19 with TypeScript
- React Router for navigation
- React Query (@tanstack) for server state management
- React Hook Form + Zod for form validation
- ShadCN/UI components (100% of UI)
- Tailwind CSS for layout and styling
- Vite as build tool

### Backend
- Express.js for API
- Prisma ORM with SQLite database
- JWT authentication with bcrypt password hashing
- Comprehensive middleware chain for vote validation

## 🏗️ Project Structure

```
sophrox-poll/
├── backend/                           # Express API server
│   ├── src/
│   │   ├── server.ts                 # Main Express app with routes
│   │   └── discord-bot.ts            # Discord bot integration
│   ├── prisma/
│   │   ├── schema.prisma             # Database schema
│   │   ├── seed.ts                   # Database seeding script
│   │   └── migrations/               # Prisma migrations
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile                    # See: Dockerfile.backend
│   └── .env.example
│
├── sophrox-polls/                    # Monorepo (Turbo)
│   ├── apps/web/                     # React frontend
│   │   ├── src/
│   │   │   ├── pages/               # Page components
│   │   │   ├── components/          # Reusable UI components
│   │   │   ├── hooks/               # Custom React hooks
│   │   │   ├── lib/                 # Utility functions
│   │   │   ├── i18n/                # i18n translations (EN, DE)
│   │   │   ├── main.tsx
│   │   │   └── App.tsx
│   │   ├── public/                   # Static assets
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── .env.example
│   │
│   ├── packages/ui/                  # Shared UI component library
│   │   ├── src/components/           # ShadCN/UI components
│   │   └── package.json
│   │
│   ├── turbo.json                    # Turborepo config
│   └── package.json
│
├── specs/                             # Shared types & contracts
│   ├── types.ts                      # TypeScript interfaces
│   ├── api-contract.ts               # API request/response shapes
│   └── permissions.ts                # Role-based permissions
│
├── .gitignore
├── .env.example                       # Environment template
├── docker-compose.yml                 # Docker Compose configuration
├── Dockerfile.backend                 # Backend container image
├── Dockerfile.frontend                # Frontend container image
├── README.md                          # This file
├── QUICKSTART.md                      # Quick start guide
├── IMPLEMENTATION_SUMMARY.md          # Implementation details
└── QA_CHECKLIST.md                   # QA checklist
```

## 📦 Build & Compilation Commands

### Backend
```bash
cd backend

# Development
npm run dev                    # Start dev server with hot reload

# Production
npm run build                  # Compile TypeScript
npm start                      # Run compiled server

# Database
npm run prisma:migrate        # Run database migrations
npm run prisma:generate       # Generate Prisma client
npm run prisma:seed           # Seed database with sample data
npm run prisma:reset          # Reset database (dev only)

# Testing
npm test                       # Run Supertest tests

# Linting
npm run lint                   # Run ESLint
npm run format                 # Format code with Prettier
```

### Frontend
```bash
cd sophrox-polls

# Development (all apps)
npm run dev                    # Start all dev servers

# Development (web only)
cd apps/web
npm run dev                    # Dev server on http://localhost:5173

# Production
npm run build                  # Build all apps with Turbo
npm run build --filter=web    # Build web app only

# Run built app
npm run preview                # Preview production build

# Testing
npm test                       # Run Vitest unit/component tests

# Linting
npm run lint                   # Run ESLint
npm run format                 # Format code with Prettier
```

## 🔐 Authentication & Authorization

### User Roles
- **Voter**: Can view and vote on polls
- **Creator**: Can create and edit own polls, plus voter permissions
- **Admin**: Full access including user management and poll deletion

### Permission Matrix
| Action | Voter | Creator | Admin |
|--------|-------|---------|-------|
| View poll | ✅ | ✅ | ✅ |
| Vote on poll | ✅ | ✅ | ✅ |
| Create poll | ❌ | ✅ | ✅ |
| Edit own polls | ❌ | ✅ | ✅ |
| Delete any poll | ❌ | ❌ | ✅ |
| Manage all polls | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| Assign roles | ❌ | ❌ | ✅ |

## 🔄 Vote Middleware Chain

Every vote request passes through this validation chain in order:

1. **checkPollExists** → 404 if poll not found
2. **checkPollOpen** → 400 if status ≠ "active"
3. **checkMaxVotes** → 400 if total votes ≥ maxVotes limit
4. **checkAuthRequired** → 401 if authentication is required but no token provided
5. **checkDuplicateVote** → 409 if user already voted (unique constraint)
6. **checkIpLimit** → 429 if IP vote count ≥ IP limit

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and receive tokens
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout (client-side token invalidation)

### Polls
- `GET /api/v1/polls` - List all polls (requires auth)
- `POST /api/v1/polls` - Create poll (creator/admin only)
- `GET /api/v1/polls/:id` - Get poll details
- `PATCH /api/v1/polls/:id` - Update poll (owner creator or admin)
- `DELETE /api/v1/polls/:id` - Delete poll (admin only)

### Voting
- `POST /api/v1/polls/:id/vote` - Cast vote with full middleware validation

### Admin
- `GET /api/v1/admin/users` - List all users (admin only)
- `PATCH /api/v1/admin/users/:id/role` - Change user role (admin only, blocks last admin demotion)

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 20+
- npm or yarn
- Docker & Docker Compose (optional)

### Backend Setup

```bash
cd backend
npm install

# Create environment file
cp .env.example .env
# Edit .env with your Discord OAuth credentials

# Setup database
npm run prisma:migrate
npm run prisma:seed

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd sophrox-polls
npm install

# Create and configure .env file
cp apps/web/.env.example apps/web/.env
# Edit with your API and Discord credentials

# Start development server
npm run dev
```

Visit `http://localhost:5173` for the frontend (Vite default)
Backend API runs on `http://localhost:3000`

## 🐳 Docker Deployment

### Quick Start with Docker Compose

```bash
# From project root
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Clean up volumes
docker-compose down -v
```

Services will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Docker Files

**Dockerfile.backend** - Express API server
- Node 20 Alpine
- Builds TypeScript to JavaScript
- Includes health checks
- Exposes port 3000

**Dockerfile.frontend** - React SPA
- Multi-stage build for optimization
- Serves built files with `serve`
- Exposes port 3000
- Includes health checks

**docker-compose.yml** - Full stack orchestration
- Backend service
- Frontend service
- Shared network
- Environment variable management
- Dependency management (frontend waits for backend)

### Building Individual Images

```bash
# Build backend image
docker build -f Dockerfile.backend -t sophrox-backend:latest .

# Build frontend image
docker build -f Dockerfile.frontend -t sophrox-frontend:latest .

# Run containers individually
docker run -p 3000:3000 --env-file .env sophrox-backend:latest
docker run -p 5173:3000 sophrox-frontend:latest
```

## 🧪 Testing

# Create and configure .env file
cp .env.example .env
# Edit .env with your JWT secrets

# Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate dev

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd sophrox-polls/apps/web
npm install

# Create and configure .env file
cp .env.example .env

# Start development server
npm run dev
```

Visit `http://localhost:5173` for the frontend (Vite default)
Backend API runs on `http://localhost:3000`

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test  # Runs Supertest API tests
npm run test:watch  # Watch mode for development
```

### Frontend Tests
```bash
cd sophrox-polls
npm test  # Runs Vitest component tests
npm run test:watch  # Watch mode
npm run test:coverage  # Coverage report
```

## 📊 Database Schema

### User
- id, email (unique), passwordHash, role, createdAt, username, avatar, discordId
- Relations: polls (Poll), votes (Vote)

### Poll
- id, title, description, status (draft/active/closed), creatorId, createdAt, closedAt, categoryId
- Relations: creator (User), options (Option), votes (Vote), config (PollConfig), category (Category)

### Option
- id, pollId, label
- Relations: poll (Poll), votes (Vote)

### Vote
- id, pollId, optionId, userId (nullable), ipAddress, createdAt
- Unique constraint: [pollId, userId]
- Relations: poll (Poll), option (Option), user (User)

### PollConfig
- pollId, votesPerUser, maxTotalVotes, deadline, requireAuth, showVoters

### Category
- id, name, createdAt
- Relations: polls (Poll)

## 🌐 Internationalization (i18n)

The application supports **English** and **German** with full UI translation coverage.

**Translation Files:**
- `sophrox-polls/apps/web/src/i18n/locales/en.json` - English (153 keys)
- `sophrox-polls/apps/web/src/i18n/locales/de.json` - German (153 keys)

**Sections:**
- common: UI basics (language, buttons, etc.)
- sidebar: Navigation
- dashboard: Dashboard UI
- polls: Poll-related text
- admin: Admin panel
- auth: Authentication flows
- errors: Error messages

**Usage in Components:**
```tsx
import { useTranslation } from "react-i18next"

export function MyComponent() {
  const { t } = useTranslation()
  return <button>{t("common.save")}</button>
}
```

Language preference is persisted to browser localStorage.

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login with email/password
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/discord` - Discord OAuth callback

### Poll Endpoints
- `GET /api/v1/polls` - List all polls
- `GET /api/v1/polls/:id` - Get poll details
- `POST /api/v1/polls` - Create poll (creator+)
- `PATCH /api/v1/polls/:id` - Update poll (owner or admin)
- `DELETE /api/v1/polls/:id` - Delete poll (admin only)
- `POST /api/v1/polls/:id/vote` - Cast vote

### Admin Endpoints
- `GET /api/v1/admin/users` - List all users (admin only)
- `PATCH /api/v1/admin/users/:id/role` - Change user role (admin only)
- `PATCH /api/v1/admin/users/:id` - Block/unblock user (admin only)
- `DELETE /api/v1/admin/users/:id` - Delete user (admin only)

See `specs/api-contract.ts` for full request/response types.

## 🔍 Troubleshooting

### Backend Won't Start
```bash
# Check dependencies
npm install

# Reset database
npm run prisma:reset

# Check environment variables
cat .env | grep -E "^[^#]"  # Shows non-comment lines
```

### Frontend Build Error
```bash
cd sophrox-polls
npm run clean  # If available
npm install --force
npm run build
```

### Docker Issues
```bash
# Remove all containers and images
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000
kill -9 <PID>

# Or change port in .env (BACKEND)
# Or Docker Compose ports mapping
```

## 📄 Additional Documentation

- [QUICKSTART.md](QUICKSTART.md) - 5-minute getting started guide
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Technical implementation details
- [QA_CHECKLIST.md](QA_CHECKLIST.md) - Feature and QA checklist

## 📜 License

This project is self-hosted and open for modification.

## 👥 Support

For issues, questions, or suggestions, please create an issue in the repository.

### PollConfig
- id, pollId (unique), maxVotes, votesPerUser, requireAuth, ipLimit, deadline, captchaEnabled
- Relations: poll (Poll)

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth with refresh tokens
- **Password Hashing**: Bcrypt with 10 salt rounds
- **Rate Limiting**: Per-IP and per-user vote limits
- **Unique Vote Constraint**: Database-level enforcement of one vote per user per poll
- **Role-Based Access Control**: Enforced at both frontend and API level
- **Last Admin Protection**: Cannot demote the final admin user
- **Cascading Deletes**: Poll deletion removes all associated options, votes, and config
- **In-Memory Auth**: No sensitive data stored in browser storage

## 🎨 UI Components (100% ShadCN)

- Card, Button, Input, Form, FormField, FormItem, FormLabel, FormControl, FormMessage
- Badge, Alert, AlertDescription, AlertDialog
- Tabs, TabsList, TabsTrigger, TabsContent
- Table, TableHeader, TableBody, TableRow, TableCell
- Select, SelectContent, SelectItem, SelectTrigger, SelectValue
- Accordion, AccordionContent, AccordionItem, AccordionTrigger
- RadioGroup, RadioGroupItem, Checkbox
- Slider, Switch, Progress
- Popover, PopoverContent, PopoverTrigger, Calendar

No custom CSS, no color overrides, no inline styles - 100% ShadCN/UI with Tailwind for layout.

## 📝 State Management

### Frontend State
- **Auth State**: In-memory token store (no localStorage)
- **Server State**: React Query with 5-second refetch interval for live updates
- **Form State**: React Hook Form with Zod validation

### Backend State
- **Database**: SQLite with Prisma ORM
- **JWT**: Stateless authentication (tokens validated on each request)

## 🚢 Deployment

### Environment Variables

**Backend (.env)**
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-change-in-production"
PORT=3000
```

**Frontend (.env)**
```
VITE_API_BASE=http://localhost:3000/api/v1
```

### Production Considerations
- Use PostgreSQL instead of SQLite
- Set secure JWT secrets
- Enable HTTPS/TLS
- Implement CAPTCHA for production
- Set up proper logging and monitoring
- Configure CORS appropriately
- Use environment-specific configuration

## 📄 License

ISC

## 👤 Author

Why_Authentic

---

**Status**: ✅ All 5 phases complete with 100% specification compliance
