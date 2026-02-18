# Troubleshooting Guide

This document helps diagnose and fix common issues with the mindmap-genai-platform.

## Login/Authentication Issues

### Issue: `/api/auth/login` returns 500 error

**Diagnosis**:
1. Check the health endpoint for database status:
```bash
curl https://your-deployment.vercel.app/api/health
```

2. Look for these error indicators:
- `"database": {"connected": false}` - Database connection failed
- `"environment": {"POSTGRES_URL": false}` - Missing POSTGRES_URL
- `"environment": {"JWT_SECRET": false}` - Missing JWT_SECRET
- `"database": {"tables_initialized": false}` - Tables not created

**Solutions**:

**Option 1: Missing POSTGRES_URL**
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Click "Create New"
- Name: `POSTGRES_URL`
- Value: Your Postgres connection string (should be auto-generated if you linked Postgres)
- Redeploy the project

**Option 2: Missing JWT_SECRET**
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Click "Create New"
- Name: `JWT_SECRET`
- Value: Generate a random secret (run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- Redeploy the project

**Option 3: Tables Not Initialized**
- Your database is connected but schema tables haven't been created
- Initialize the database:
```bash
# Locally, with POSTGRES_URL set to your Vercel database
export POSTGRES_URL="your_vercel_postgres_url"
npm run init-db
unset POSTGRES_URL
```

Or create tables manually via Vercel dashboard SQL editor:
```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  status VARCHAR(20) DEFAULT 'approved',
  language VARCHAR(5) DEFAULT 'zh',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mind_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Issue: "Invalid email or password" error

1. **First user signup**: If you're getting this on login after signup, the registration might have failed
   - Check `/api/health` to verify database tables exist
   - Try registration again and watch for error messages

2. **Password not matching**: Ensure you're using the exact password
   - Passwords are case-sensitive
   - Verify no extra spaces before/after

3. **User not approved**: Admin must approve users before they can login
   - If this is your first signup, it should auto-approve
   - For subsequent users, an admin must approve via `/admin/applications`

### Issue: "Your account is not approved yet" error

- You attempted to login with an account that hasn't been approved by an admin
- To approve pending users:
  1. Login as admin
  2. Go to Admin Panel → Pending Applications
  3. Click "Approve" on the user's application

## Build Issues

### Issue: Tailwind CSS warnings during build

**Fixed**: Updated `tailwind.config.ts` to use specific content paths instead of `**/*.js` patterns which were scanning node_modules. Build now completes without content configuration warnings.

### Issue: CSS minification warnings

- These are minor warnings from esbuild during CSS minification
- They don't affect functionality
- Safe to ignore

## Deployment Issues

### Issue: Build fails on Vercel

1. **Check build logs**: Vercel Dashboard → Deployments → View Logs
2. **Verify dependencies**: Run `npm install` locally and test `npm run build`
3. **Check environment variables**: Ensure `JWT_SECRET` is set (POSTGRES_URL auto-set by Vercel)
4. **Clear cache**: In Vercel dashboard, go to Settings → Deployments → Clear all builds

### Issue: Environment variables not being used

- Vercel caches environment variables when you add them
- You must **redeploy** after changing environment variables
- Click "Redeploy" button in Vercel dashboard, don't just push code

## Database Issues

### Issue: "This connection string is meant to be used with a direct connection"

**Fixed!** Updated all API endpoints to use Vercel Postgres pooled connections (`POSTGRES_URL_POOLED`).

**What happened:**
- Vercel serverless functions need pooled connections for stateless concurrent requests
- Previous code used `@vercel/postgres` `sql` tag which expects direct connections
- This was causing 500 errors on all database operations

**Solution applied:**
- All API endpoints now use `createClient` with `POSTGRES_URL_POOLED`
- Explicit connection lifecycle management (connect/end)
- Proper resource cleanup

**What you need to do:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify `POSTGRES_URL_POOLED` is set (auto-created with Postgres database)
3. If not present, check if Postgres is linked to your project
4. Redeploy the project

**Testing the fix:**
```bash
curl https://your-deployment.vercel.app/api/health
# Should return: "status": "ok", "database": {"connected": true}
```

### Issue: "Cannot connect to database"

1. Check Vercel Postgres is linked to your project
2. Verify POSTGRES_URL is set:
```bash
# In Vercel CLI
vercel env list
```

3. Test connection locally:
```bash
export POSTGRES_URL="your_url"
npx ts-node --esm scripts/init-db.ts
```

4. If still failing, check if database server is running (shouldn't happen on Vercel managed DB)

### Issue: "Column not found" error (e.g., "role", "status", "language")

- Database schema is outdated, missing new columns
- Run initialization:
```bash
export POSTGRES_URL="your_vercel_postgres_url"
npm run init-db
```

This adds missing columns without losing existing data.

## Development Issues

### Issue: Local development fails with "Cannot find database"

1. Create a `.env.local` file with your database URL:
```
POSTGRES_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-development-secret
```

2. Run `npm run dev` to start development server

### Issue: "Cannot find module" errors

- Delete `node_modules` and package-lock.json:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Testing Endpoints

### Test if API is responding

```bash
# Should return API documentation
curl https://your-deployment.vercel.app/api/auth/login

# Should return health check
curl https://your-deployment.vercel.app/api/health
```

### Test login endpoint

```bash
curl -X POST https://your-deployment.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-password"
  }'
```

Expected response:
```json
{
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "username": "admin",
    "role": "admin",
    "status": "approved",
    "language": "zh"
  }
}
```

### Test protected endpoints

```bash
# Use the token from login response
curl -X GET https://your-deployment.vercel.app/api/admin/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Getting Help

### Check logs

**Vercel**: Dashboard → Deployments → View Logs
**Local**: `npm run dev` shows live logs

### Enable debugging

In API endpoints, check error messages:
- `/api/health` shows database status
- Login endpoint errors include detailed messages when `NODE_ENV=development`

### Common error codes

- **400**: Bad request (missing required fields)
- **401**: Unauthorized (invalid credentials or missing token)
- **403**: Forbidden (insufficient permissions or account not approved)
- **404**: Not found (resource doesn't exist)
- **500**: Server error (database connection, query, or runtime error)

### Verify installation

```bash
# Check packages installed
npm list | grep -E "jsonwebtoken|bcryptjs|postgres"

# Check build succeeds
npm run build

# Check Tailwind CSS setup
ls -la | grep -E "tailwind|postcss|index.css"
```

