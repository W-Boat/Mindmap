# Vercel Deployment Setup Guide

This guide walks you through deploying the mindmap-genai-platform to Vercel with PostgreSQL database.

## Prerequisites

- Vercel account (https://vercel.com)
- PostgreSQL database (created via Vercel Postgres)
- GitHub repository (recommended for easy deployment)

## Step 1: Create Vercel Postgres Database

1. Log in to Vercel dashboard
2. Go to **Storage** tab
3. Click **Create** → **Postgres**
4. Follow the setup wizard:
   - Select a region close to your location
   - Name the database (e.g., `mindmap-db`)
   - Create the database

## Step 2: Deploy Project to Vercel

### Option A: GitHub Integration (Recommended)

1. Push your project to GitHub
2. Go to Vercel dashboard
3. Click **Add New** → **Project**
4. Select your repository
5. In **Environment Variables**, add:
   - `JWT_SECRET`: A random string (e.g., generate with: `openssl rand -base64 32`)
   - `NODE_ENV`: `production`
6. Click **Deploy**

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Link to project if first time
vercel link

# Add environment variables
vercel env add JWT_SECRET
vercel env add NODE_ENV production

# Redeploy
vercel --prod
```

## Step 3: Configure Environment Variables

After linking with Postgres, Vercel automatically creates `POSTGRES_URL`. You just need to add:

### In Vercel Dashboard:
1. Go to your project settings
2. Click **Environment Variables**
3. Add:
   - **JWT_SECRET**: Your secret key (generate one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - **NODE_ENV**: `production`

The `POSTGRES_URL` is automatically set by Vercel when you add Postgres to your project.

## Step 4: Initialize Database Schema

After deployment, initialize the database schema:

### Option A: Local Initialization

```bash
# Set local database URL temporarily
export POSTGRES_URL="your_vercel_postgres_url"

# Run initialization
npm run init-db

# Remove from environment after
unset POSTGRES_URL
```

### Option B: Via API

Make a POST request to initialize the database (you could create a special `/api/init` endpoint):

```bash
curl -X POST https://your-deployment.vercel.app/api/init-db \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-admin-token"
```

## Step 5: Create First Admin Account

Once database is initialized:

1. Visit your deployed app: `https://your-deployment.vercel.app`
2. Click **"Register"**
3. Fill in the registration form
4. This first account will automatically be created as admin with approved status
5. Log in with these credentials

## Step 6: Verify Deployment

### Test Login Endpoint:

```bash
curl -X POST https://your-deployment.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'
```

You should get a response with a JWT token.

### Test Protected API:

```bash
curl -X GET https://your-deployment.vercel.app/api/admin/users \
  -H "Authorization: Bearer your-jwt-token"
```

## Troubleshooting

### "Database connection failed" Error

1. **Check POSTGRES_URL is set**:
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Verify `POSTGRES_URL` exists
   - If not, link your Postgres database again

2. **Verify database initialization**:
   - Run `npm run init-db` locally with the correct `POSTGRES_URL`
   - Or check if tables exist: `SELECT * FROM pg_tables WHERE schemaname='public'`

3. **Check JWT_SECRET**:
   - `JWT_SECRET` must be set in environment variables
   - Try generating a new one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### "Method not allowed" Error

- This is expected when accessing API endpoints via browser (GET requests)
- Use POST requests with proper JSON body for actual API calls
- See API documentation for request format

### "Invalid email or password" on First Login

- Make sure the registration was successful
- Check that the user record exists in database
- Verify password was hashed correctly during signup

### CORS Errors in Browser

- All API endpoints have CORS headers enabled
- Check browser console for detailed CORS error messages
- Ensure your frontend is making requests to `/api/` endpoints

## Database Queries for Debugging

If you need to manually check the database:

```bash
# Connect via psql
psql $POSTGRES_URL

# Check tables
\dt

# Check users
SELECT email, username, role, status FROM users;

# Check pending applications
SELECT email, username, status FROM user_applications WHERE status = 'pending';

# Check mindmaps
SELECT id, user_id, title, is_public FROM mind_maps;
```

## Security Checklist

- [ ] JWT_SECRET is a random string (not the default)
- [ ] POSTGRES_URL is not exposed in logs
- [ ] Environment variables are set in Vercel (not in code)
- [ ] .env.local is in .gitignore
- [ ] Database backups are configured in Vercel
- [ ] Only admins can access `/api/admin/*` endpoints
- [ ] All API endpoints validate JWT tokens

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| POSTGRES_URL | Yes* | - | Database connection string (set by Vercel) |
| JWT_SECRET | Yes | - | Random secret for JWT signing |
| NODE_ENV | No | development | Environment mode |
| DEEPSEEK_API_KEY | No | - | Optional AI API key for mindmap generation |

*Automatically set when you link Vercel Postgres

## Getting Help

If deployment fails:

1. Check Vercel deployment logs: Dashboard → Project → Deployments → View Logs
2. Check API errors: `curl https://your-deployment.vercel.app/api/auth/login` (returns error details)
3. Debug locally: `npm run dev` with `.env.local` configured

