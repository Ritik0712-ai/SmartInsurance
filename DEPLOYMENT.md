# SmartInsurance - Deployment Guide

## Prerequisites

1. GitHub account
2. Supabase account (already configured)
3. Vercel account (for frontend)
4. Render account (for backend)

## Deployment Steps

### 1. Push Code to GitHub

```bash
cd "/Volumes/RitikSSD/LabMentix/July Project/Insurance Management/code"
git add .
git commit -m "feat: Complete SmartInsurance platform with Day 2 & 3 features"
git push origin main
```

### 2. Deploy Backend to Render

1. Go to [Render](https://render.com) and sign in
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `smartinsurance-api`
   - **Region**: Singapore
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

5. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=3001
   JWT_SECRET=<generate-64-char-hex>
   JWT_REFRESH_SECRET=<generate-64-char-hex>
   SUPABASE_URL=https://abkqdeuffuiurcuegcvd.supabase.co
   SUPABASE_SERVICE_KEY=<service-role-key>
   CLIENT_URL=https://smartinsurance.vercel.app
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=<your-email>
   SMTP_PASS=<app-password>
   ```

6. Click "Create Web Service"

### 3. Deploy Frontend to Vercel

1. Go to [Vercel](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variables:
   ```
   VITE_API_URL=https://smartinsurance-api.onrender.com
   VITE_SUPABASE_URL=https://abkqdeuffuiurcuegcvd.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon-key>
   ```

6. Click "Deploy"

### 4. Update Supabase Storage

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Storage → Create a new bucket named `documents`
4. Set bucket to public or configure RLS policies

### 5. Test Deployment

After deployment, test the following:

- [ ] Backend health check: `https://smartinsurance-api.onrender.com/health`
- [ ] Login with admin credentials
- [ ] Create a customer
- [ ] Create a policy
- [ ] Upload a document
- [ ] Submit a claim
- [ ] Check dashboard

## Environment Variables Reference

### Backend (Render)

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `3001` |
| `JWT_SECRET` | JWT signing secret (64 chars) | `abc123...` |
| `JWT_REFRESH_SECRET` | Refresh token secret (64 chars) | `xyz789...` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | `eyJhbGci...` |
| `CLIENT_URL` | Frontend URL | `https://smartinsurance.vercel.app` |
| `SMTP_HOST` | SMTP server | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP email | `your@email.com` |
| `SMTP_PASS` | SMTP password | `xxxx xxxx xxxx xxxx` |

### Frontend (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend URL | `https://smartinsurance-api.onrender.com` |
| `VITE_SUPABASE_URL` | Supabase URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | `eyJhbGci...` |

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@insurancemgmt.com | admin123 |
| Agent | agent@insurancemgmt.com | agent123 |
| Customer | rahul.sharma@email.com | customer123 |

## Troubleshooting

### CORS Errors
- Ensure `CLIENT_URL` is set correctly in backend
- Check that frontend's `VITE_API_URL` matches backend URL

### Database Connection Issues
- Verify Supabase service key is correct
- Check RLS policies on tables

### Email Not Sending
- Verify SMTP credentials
- For Gmail, use App Password instead of regular password
- Generate App Password: Google Account → Security → 2-Step Verification → App Passwords

### Document Upload Failing
- Create `documents` bucket in Supabase Storage
- Set appropriate storage policies
