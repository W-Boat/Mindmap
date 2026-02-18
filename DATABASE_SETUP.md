# Database & Backend Setup Guide

## What Was Implemented ✅

This document outlines the complete backend and database integration added to the Mind Map Generator.

### Backend API Services

#### 1. Authentication System
- **`POST /api/auth/signup`** - User registration with email, username, password
- **`POST /api/auth/login`** - Login with email and password
- Password hashing with bcrypt (10-round salt)
- JWT tokens with 7-day expiration
- Token stored in browser localStorage

#### 2. Mind Map Storage (Database)
- **`GET /api/mindmaps`** - List all mind maps for user
- **`POST /api/mindmaps`** - Create new mind map
- **`GET /api/mindmaps/[id]`** - Retrieve specific mind map
- **`PUT /api/mindmaps/[id]`** - Update existing mind map
- **`DELETE /api/mindmaps/[id]`** - Delete mind map

#### 3. AI Content Generation
- **`POST /api/generate`** - Generate mind map from topic using DeepSeek

### Database Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mind maps table (one-to-many relationship with users)
CREATE TABLE mind_maps (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mind_maps_user_id ON mind_maps(user_id);
```

### Frontend Services

#### 1. Auth Service (`services/authService.ts`)
- `signup(email, username, password)` - Register user
- `login(email, password)` - Login user
- `logout()` - Clear auth state
- `isAuthenticated()` - Check if user is logged in
- `getToken()` - Retrieve JWT token
- `getUser()` - Get current user info
- `fetchWithAuth()` - Make API calls with Authorization header

#### 2. Storage Service (`services/storageService.ts`)
- Works with both backend (when authenticated) and localStorage (fallback)
- `getMindMaps()` - Fetch all mind maps (async)
- `getMindMapById(id)` - Fetch specific mind map (async)
- `saveMindMap(map)` - Create or update mind map (async)
- `deleteMindMap(id)` - Delete mind map (async)

#### 3. AI Service (`services/aiService.ts`)
- `generateMindMapContent(topic)` - Call `/api/generate` endpoint
- Handles error messages and response parsing

### Libraries Added

```json
{
  "dependencies": {
    "jsonwebtoken": "^9.1.2",
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    "@types/jsonwebtoken": "^9.0.7",
    "@types/bcryptjs": "^2.4.6",
    "@vercel/postgres": "^0.8.1",
    "@vercel/node": "^3.0.0",
    "ts-node": "^10.9.2"
  }
}
```

## Deployment Steps

### Prerequisites
1. GitHub repository with code pushed
2. Vercel account (free at https://vercel.com)
3. DeepSeek API key (free at https://platform.deepseek.com)

### Step-by-Step Deployment

#### 1. Create Vercel Project
```bash
# Push code to GitHub
git add .
git commit -m "Add database, auth, and AI"
git push origin main
```

Go to https://vercel.com/new and import your repository

#### 2. Add Vercel Postgres Database

In your Vercel project dashboard:
1. Go to **Storage** tab
2. Click **Create Database**
3. Select **Postgres**
4. Choose region
5. Click **Create**

Vercel automatically sets `POSTGRES_URLSTATE` environment variable

#### 3. Set Environment Variables

In Vercel Dashboard → **Settings** → **Environment Variables**, add:

```
DEEPSEEK_API_KEY=sk_live_xxxxxxxxxxxxx
JWT_SECRET=<generate-random-secret>
NODE_ENV=production
```

**Generate JWT_SECRET locally:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 4. Initialize Database Schema

After first deployment, run the database initialization:

```bash
# Download production environment variables
npx vercel env pull

# Run initialization script
npm run init-db
```

Or directly with Vercel CLI:
```bash
npm run init-db
```

#### 5. Deploy

Click the **Deploy** button in Vercel Dashboard

Your app is now live with:
- ✅ User authentication
- ✅ Cloud database storage
- ✅ AI content generation
- ✅ Secure API keys

### Post-Deployment Checklist

- [ ] Database is initialized (`users` and `mind_maps` tables created)
- [ ] Can sign up with new user account
- [ ] Can log in and receive JWT token
- [ ] Can create new mind maps
- [ ] Can generate content with DeepSeek AI
- [ ] Mind maps persist across page refreshes
- [ ] Can update and delete mind maps

## Local Development

### Option 1: Frontend Only (No Database)

```bash
npm install
npm run dev
```

- Mind maps stored in localStorage
- No user authentication
- AI generation works (with DEEPSEEK_API_KEY set)
- Perfect for development without database setup

### Option 2: Full-Stack with Local Database

For testing database locally (requires PostgreSQL):

```bash
# Install PostgreSQL locally
# Create a new database: mindmap_local
# Update connection string in scripts/init-db.ts

npm install
npm run init-db  # Create tables

npm run dev
```

### Configuration for Local Dev

Create `.env.local`:
```
DEEPSEEK_API_KEY=sk_live_xxxxxxxxxxxxx
JWT_SECRET=dev-secret-key-change-in-production
POSTGRES_URLSTATE=postgresql://user:password@localhost:5432/mindmap_local
```

## Architecture Diagram

```
User Browser
    ↓ (React App)
Frontend (Vite)
    ↓
Vercel Edge Network (CDN)
    ↓ (API Requests)
Vercel Serverless Functions (/api/*)
    ├→ Auth: /api/auth/signup, /api/auth/login
    ├→ Storage: /api/mindmaps/*
    └→ AI: /api/generate
    ↓
    ├→ Vercel Postgres (Database)
    │  └→ users, mind_maps tables
    │
    └→ DeepSeek API (AI)
       └→ Generate mind maps
```

## Fallback Behavior

The app **gracefully handles missing database**:

1. If `POSTGRES_URLSTATE` is not set → Uses localStorage
2. If user is not authenticated → Uses localStorage
3. If database query fails → Falls back to localStorage

This means the app works in all scenarios:
- ✅ Development without database
- ✅ Production with database
- ✅ Database connection issues (graceful degradation)

## Security Features

### Authentication
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with 7-day expiration
- Tokens stored in browser localStorage
- Bearer token required for all protected endpoints

### Database
- Passwords never stored in plaintext
- User can only access their own mind maps (enforced by user_id in queries)
- SQL injection prevented with parameterized queries
- Cascade delete removes user's maps when account deleted

### API Keys
- Never exposed in frontend code
- Environment variables managed by Vercel
- Encrypted at rest and in transit
- Separate keys for different environments

## Troubleshooting

### Database Connection Failed
**Error**: `Error: Cannot find module '@vercel/postgres'`

**Solution**:
```bash
npm install @vercel/postgres
npm run build
```

### JWT Secret Not Set
**Error**: `JsonWebTokenError: secret required`

**Solution**:
1. Set `JWT_SECRET` in Vercel Environment Variables
2. Redeploy

### Tables Not Created
**Error**: `relation "users" does not exist`

**Solution**:
```bash
npx vercel env pull
npm run init-db
```

### Login Not Working
**Possible Causes**:
1. Database not initialized → Run `npm run init-db`
2. JWT_SECRET not set → Add to Vercel env vars
3. POSTGRES_URLSTATE not set → Vercel should set automatically

### Mind Maps Not Saving
**Check**:
1. User is authenticated (check localStorage for token)
2. Database is initialized
3. API response in browser DevTools Network tab

If mind maps still don't save:
- Open Browser DevTools → Network tab
- Check response from `/api/mindmaps` POST request
- Look for error message in response

## API Testing

### Test User Registration
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123"
  }'
```

### Test Creating Mind Map
```bash
curl -X POST http://localhost:3000/api/mindmaps \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Test Map",
    "content": "# Test\n## Node"
  }'
```

### Test AI Generation
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "Machine Learning"}'
```

## Next Steps

1. **Deploy to Vercel** - Follow deployment steps above
2. **Add User Profile Page** - Show user info, change password
3. **Add Sharing** - Share mind maps with other users
4. **Add Export** - Export mind maps to PDF or image
5. **Add Collaboration** - Real-time editing with multiple users

## Support & Resources

- [Vercel Postgres Docs](https://vercel.com/docs/storage/postgres)
- [JWT.io](https://jwt.io)
- [DeepSeek API](https://platform.deepseek.com/docs)
- [bcryptjs](https://www.npmjs.com/package/bcryptjs)
- [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)
