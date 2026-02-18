<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI-Powered Mind Map Generator

Generate comprehensive mind maps with AI-powered content generation. This application uses DeepSeek AI for intelligent mind map generation and Vercel Postgres for secure data storage.

## Architecture Overview

The application is built with a modern full-stack architecture:
- **Frontend**: React + Vite (deployed on Vercel CDN)
- **Backend**: Vercel Serverless Functions (Node.js 20.x)
- **Database**: Vercel Postgres (Neon)
- **AI Provider**: DeepSeek Chat API
- **Authentication**: JWT-based user authentication

### Security Model
- API keys are **never** exposed in the frontend code
- All AI and database calls go through secure backend functions
- User passwords are hashed with bcrypt
- Environment variables are encrypted and managed by Vercel
- Authentication tokens are JWT with 7-day expiration

## Prerequisites

- **Node.js** 18+ (for local development)
- **DeepSeek API Key** (free account at https://platform.deepseek.com)
- **Vercel Account** (free tier available at https://vercel.com)
- **npm** or **yarn** package manager

## Local Development

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment Variables

Create `.env.local` file in the project root:

```
DEEPSEEK_API_KEY=sk_live_xxxxxxxxxxxxx
JWT_SECRET=your-super-secret-jwt-key-change-this
```

Get your DeepSeek API key from https://platform.deepseek.com

### Step 3: Run Development Server

#### Option A: Frontend Only (Local Storage)

```bash
npm run dev
```

Opens http://localhost:3000. Mind maps are stored in browser localStorage. This works for development without a database.

#### Option B: Full-Stack with Database (Recommended)

If you want to test the database:

```bash
# First, set up the database (see Database Setup section below)
npm run dev
```

## Database Setup

### For Local Development

**Note**: To test the database locally, you need a PostgreSQL instance. For development without a database, use localStorage (works out of the box).

### For Production Deployment (Vercel)

1. **Add Vercel Postgres**:
   - Go to your Vercel project dashboard
   - Click "Add Integration" → Select "Postgres"
   - Create a new database
   - Vercel automatically sets the `POSTGRES_URLSTATE` environment variable

2. **Initialize Database Schema**:
   ```bash
   # After deploying to Vercel, run the initialization script once:
   npm run init-db
   ```

3. **Database Tables**:
   - `users` - Store user accounts with hashed passwords
   - `mind_maps` - Store mind maps per user with full CRUD operations

## Deployment to Vercel

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Add database, auth, and AI generation"
git push origin main
```

### Step 2: Create Vercel Project

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Vercel auto-detects Vite configuration from `vercel.json`

### Step 3: Add Vercel Postgres

1. In Vercel Dashboard, go to project → Storage → Create Database
2. Select "Postgres" → Create
3. Copy the database URL (automatically added as `POSTGRES_URLSTATE`)

### Step 4: Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
DEEPSEEK_API_KEY=sk_live_xxxxxxxxxxxxx
JWT_SECRET=generate-random-secret-string-here
NODE_ENV=production
```

**Generate JWT_SECRET** (run this locally and copy output):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Initialize Database

After deployment, run the initialization script once:

```bash
npx vercel env pull  # Download environment variables
npm run init-db
```

Or use Vercel's CLI:
```bash
vercel env pull
npm run init-db
```

### Step 6: Deploy

Click "Deploy" in Vercel Dashboard. Your app is now live!

## API Endpoints

### Authentication Endpoints

#### `POST /api/auth/signup`
Create a new user account

**Request**:
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123"
}
```

**Response**:
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username"
  }
}
```

#### `POST /api/auth/login`
Login with email and password

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "token": "eyJhbGc...",
  "user": { ... }
}
```

### Mind Map Endpoints

All mind map endpoints require `Authorization: Bearer <token>` header

#### `GET /api/mindmaps`
List all mind maps for the authenticated user

**Response**:
```json
{
  "mindMaps": [
    {
      "id": "uuid",
      "title": "Project Overview",
      "description": "...",
      "createdAt": 1234567890,
      "updatedAt": 1234567890
    }
  ]
}
```

#### `POST /api/mindmaps`
Create a new mind map

**Request**:
```json
{
  "title": "My Mind Map",
  "description": "Optional description",
  "content": "# Root\n## Child\n..."
}
```

**Response**:
```json
{
  "mindMap": { ... }
}
```

#### `GET /api/mindmaps/[id]`
Get a specific mind map with full content

#### `PUT /api/mindmaps/[id]`
Update a mind map

#### `DELETE /api/mindmaps/[id]`
Delete a mind map

### AI Generation Endpoint

#### `POST /api/generate`
Generate mind map content from a topic

**Request**:
```json
{
  "topic": "Machine Learning"
}
```

**Response**:
```json
{
  "content": "# Machine Learning\n## Supervised Learning\n..."
}
```

## Project Structure

```
mindmap-genai-platform/
├── api/
│   ├── auth/
│   │   ├── signup.ts        # User registration
│   │   └── login.ts         # User login
│   ├── mindmaps/
│   │   ├── index.ts         # List & create
│   │   └── [id].ts          # Get, update, delete
│   └── generate.ts          # AI content generation
├── lib/
│   └── auth.ts              # JWT & password utilities
├── scripts/
│   └── init-db.ts           # Database schema initialization
├── services/
│   ├── aiService.ts         # AI generation client
│   ├── authService.ts       # Auth & token management
│   └── storageService.ts    # Mind map CRUD
├── pages/
│   ├── Editor.tsx           # Mind map editor
│   ├── AdminDashboard.tsx   # List & manage maps
│   └── Home.tsx             # Landing page
├── components/
│   └── ...
├── vite.config.ts           # Frontend build config
├── vercel.json              # Vercel deployment config
├── package.json             # Dependencies
└── README.md                # This file
```

## Features

### AI-Powered Generation
- Enter a topic → Get AI-generated mind map markdown
- Powered by DeepSeek's advanced language model
- Formatted for instant visualization

### User Authentication
- Sign up with email and password
- Secure login with JWT tokens
- 7-day token expiration

### Cloud Storage
- Store mind maps in Vercel Postgres
- Sync across devices
- Full CRUD operations
- Per-user data isolation

### Mind Map Editor
- Live markdown editor
- Real-time visualization
- Responsive design for mobile and desktop
- Export to markdown format

## Troubleshooting

### "Cannot find POST /api/auth/login"
**Cause**: Backend not running or environment variables not set

**Solution**:
- Ensure `JWT_SECRET` is set in `.env.local`
- Check that Vercel functions are deployed

### "Database connection failed"
**Cause**: Vercel Postgres not connected or schema not initialized

**Solution**:
1. Verify `POSTGRES_URLSTATE` is set in environment variables
2. Run `npm run init-db` to create tables
3. Check Vercel dashboard for database status

### "Invalid token" error
**Cause**: Token expired or secret changed

**Solution**:
- Log in again to get a new token
- Ensure `JWT_SECRET` is the same in all environments

### Login/Signup not working on localhost
**Cause**: Trying to use database without setting it up

**Solution**:
- For development, use the frontend-only mode (localStorage)
- Or set up a local PostgreSQL database
- The app gracefully falls back to localStorage when database is unavailable

## Building for Production

```bash
npm run build
```

This creates an optimized `dist/` folder ready for Vercel deployment.

## Learn More

- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Postgres Documentation](https://vercel.com/docs/storage/postgres)
- [DeepSeek API Documentation](https://platform.deepseek.com/docs)
- [Markmap Documentation](https://markmap.js.org)
- [JWT Documentation](https://jwt.io)

## License

This project is open source and available under the MIT License.
