# SmartInsurance - Insurance Management Platform

A comprehensive insurance management platform for managing customers, policies, claims, premiums, and documents.

## Features

### Core Features (Day 1 - MVP)
- **Authentication**: JWT with refresh tokens, RBAC (Admin/Agent/Customer)
- **Customer Management**: Full CRUD operations
- **Policy Management**: Create, view, cancel, renew policies
- **Claims Processing**: Submit and track claims
- **Premium Tracking**: Record and manage payments
- **Document Management**: Upload and verify documents
- **Dashboard**: Overview statistics and recent activity

### Enhanced Features (Day 2)
- **Premium Calculator**: Calculate insurance premiums based on age, occupation, policy type
- **Document Upload**: Supabase Storage integration for file uploads
- **Email Notifications**: Automated emails for policy/claim updates
- **Advanced Reports**: Comprehensive analytics and reporting
- **API Rate Limiting**: Protection against abuse
- **PDF Generation**: Download policy and claim documents

### Advanced Features (Day 3)
- **Policy Renewal Reminders**: Automated notifications
- **Customer Self-Service Portal**: Improved customer dashboard
- **Mobile Responsive Design**: Works on all devices
- **Bulk Import/Export**: CSV support for data operations

## Tech Stack

### Frontend
- React 19
- Vite 6
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Router
- Recharts

### Backend
- Express.js
- TypeScript
- Supabase (REST API)
- JWT Authentication
- Nodemailer

### Database
- Supabase PostgreSQL

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install all dependencies
npm install

# Start development servers
npm run dev
```

This will start:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### Environment Variables

**Backend** (`backend/.env`):
```
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-service-key
CLIENT_URL=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```
VITE_API_URL=
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@insurancemgmt.com | admin123 |
| Agent | agent@insurancemgmt.com | agent123 |
| Customer | rahul.sharma@email.com | customer123 |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/profile` - Get user profile

### Dashboard
- `GET /api/dashboard` - Overview stats (Admin/Agent)
- `GET /api/dashboard/customer` - Customer dashboard
- `GET /api/dashboard/revenue` - Revenue data
- `GET /api/dashboard/policy-distribution` - Policy types

### Resources
- `/api/customers` - Customer CRUD
- `/api/policies` - Policy CRUD
- `/api/claims` - Claims CRUD
- `/api/premiums` - Premium CRUD
- `/api/documents` - Document management
- `/api/reports` - Advanced reporting
- `/api/calculator` - Premium calculator

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy

1. **Backend**: Deploy to Render with environment variables
2. **Frontend**: Deploy to Vercel with `VITE_API_URL` pointing to Render
3. **Database**: Already configured with Supabase

## Project Structure

```
insurance-management/
├── backend/
│   ├── src/
│   │   ├── config/       # Database & Supabase config
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── middlewares/   # Auth & validation
│   │   └── utils/        # Helper functions
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom hooks
│   │   ├── services/     # API services
│   │   └── lib/          # Utilities
│   └── package.json
├── DEPLOYMENT.md         # Deployment guide
└── README.md
```

## License

MIT
