# Quick Start Guide

Get the mindmap-genai-platform up and running in 5 minutes.

## For Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cat > .env.local <<EOF
POSTGRES_URL=postgresql://user:password@host:5432/database
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
NODE_ENV=development
EOF

# 3. Initialize database (if first time)
npm run init-db

# 4. Start development server
npm run dev
```

Visit `http://localhost:5173`

## For Vercel Deployment

### Step 1: Deploy to Vercel (2 min)
```bash
# Option A: Using Vercel CLI
npm install -g vercel
vercel

# Option B: Using GitHub
# Push to GitHub, then:
# 1. Go to vercel.com
# 2. Click "Add New Project"
# 3. Select your GitHub repo
# 4. Click "Deploy"
```

### Step 2: Add Postgres Database (1 min)
1. Vercel Dashboard → Your Project → Storage
2. Click "Create" → "Postgres"
3. Follow setup wizard, select region, create database
4. Vercel auto-sets `POSTGRES_URL` environment variable ✅

### Step 3: Add JWT Secret (1 min)
1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Click "Add New"
   - Name: `JWT_SECRET`
   - Value: Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. Click "Save"
4. Redeploy: Go to Deployments → Click "Redeploy" on latest

### Step 4: Initialize Database (1 min)
```bash
# Get your Vercel Postgres URL from environment variables
export POSTGRES_URL="your_postgres_url"

# Initialize tables
npm run init-db
```

### Step 5: Test It
```bash
# Check health
curl https://your-deployment.vercel.app/api/health

# Should return: status: "ok", database: connected: true
```

## First Time Setup

1. Go to your app URL
2. Click **"Register"** to create account
3. Fill in registration form
4. ✅ First account auto-becomes admin with approved status
5. Click **"Login"** with your credentials
6. Start creating mindmaps!

## Common Commands

```bash
# Local development
npm run dev              # Start dev server with hot reload

# Build and deploy
npm run build            # Build for production
vercel                   # Deploy to Vercel

# Database
npm run init-db          # Initialize database schema

# Testing
curl http://localhost:5173/api/health                    # Health check
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

## Troubleshooting

### "Cannot connect to database"
- Check `POSTGRES_URL` is set: `echo $POSTGRES_URL`
- Verify URL format: `postgresql://user:pass@host:5432/db`
- Make sure database server is running

### "Login returns 500 error"
- Run `/api/health` endpoint to diagnose
- Check environment variables: `JWT_SECRET` and `POSTGRES_URL` set?
- Check Vercel deployment logs

### "Build fails"
- Delete and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Check Node version: `node --version` (should be 18+)
- Run `npm run build` locally to debug

### "Dark mode not working"
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Check browser DevTools → Elements → see `class="dark"` on html?

## Directory Structure

```
mindmap-genai-platform/
├── pages/              # React pages (Login, Register, Dashboard, Admin)
├── components/         # React components (ProtectedRoute, MarkmapViewer, etc.)
├── services/           # API/storage services (authService, storageService)
├── lib/                # Utilities (i18n, auth, darkMode, context)
├── api/                # Vercel serverless functions
│   ├── auth/          # Login, signup, register endpoints
│   ├── admin/         # Admin management endpoints
│   └── mindmaps/      # Mindmap CRUD endpoints
├── dist/              # Build output (created by npm run build)
├── index.html         # HTML entry point
├── index.tsx          # React entry point
├── tailwind.config.ts # Tailwind CSS config
└── vite.config.ts     # Vite build config
```

## Key Features

✅ **Authentication**
- User signup/login with JWT tokens
- Admin role management
- Registration approval workflow

✅ **Mindmaps**
- Create, read, update, delete mindmaps
- Public/private visibility toggle
- View mindmaps by ID
- Dark mode support

✅ **Internationalization**
- Chinese (默认) and English support
- Language preference in localStorage
- All UI text translated

✅ **Admin Panel**
- Manage users and roles
- Approve pending registrations
- View system statistics

## Need Help?

1. **Deployment issues**: See `VERCEL_SETUP.md`
2. **Debugging**: See `TROUBLESHOOTING.md`
3. **Implementation details**: See `IMPLEMENTATION_SUMMARY.md`
4. **API documentation**: Visit `/api/auth/login` (GET) for endpoint info

## Environment Variables Cheat Sheet

| Variable | Required | How to Set |
|----------|----------|-----------|
| `POSTGRES_URL` | Yes | Auto-set by Vercel Postgres, or add manually |
| `JWT_SECRET` | Yes | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NODE_ENV` | No | Set to `production` on Vercel, `development` locally |
| `DEEPSEEK_API_KEY` | No | Optional, for AI features |

## Next Steps

- [ ] Deploy to Vercel
- [ ] Create first admin account
- [ ] Test login/logout
- [ ] Create first mindmap
- [ ] Toggle visibility (public/private)
- [ ] Test admin features
- [ ] Test dark mode
- [ ] Test language switching
- [ ] Invite other users

