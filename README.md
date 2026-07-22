# SmartInsurance

Enterprise SaaS platform for digitizing the complete insurance lifecycle.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite, Tailwind CSS, shadcn/ui, React Router, TanStack Query
- **Backend**: Express.js + TypeScript, Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage
- **Deployment**: Vercel (Frontend) + Render (Backend) + Supabase (DB)

## Quick Start

```bash
# Install all dependencies
npm install

# Setup environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start development servers
npm run dev
```

## Project Structure

```
insurance-management/
├── backend/          # Express.js API server
├── frontend/         # React SPA
└── package.json      # Workspace root
```

## Features

- 🔐 JWT Authentication with RBAC (Admin / Agent / Customer)
- 👥 Customer Management
- 📋 Policy Lifecycle Management
- 💰 Premium Payment Tracking
- 📑 Claims Processing
- 📎 Document Management
- 📊 Dashboard with KPIs

## License

MIT
