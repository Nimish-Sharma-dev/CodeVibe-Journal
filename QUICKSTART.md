# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (~2 minutes)
3. Go to **Project Settings** → **API**
4. Copy:
   - Project URL
   - `anon` `public` key
   - `service_role` `secret` key

### Step 2: Run Database Migration

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and click **Run**
5. Verify success (should see "Success. No rows returned")

### Step 3: Get API Keys

**OpenAI:**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an API key
3. Copy the key (starts with `sk-`)

**GitHub (Optional):**
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. No special permissions needed (just public repo access)
4. Copy the token (starts with `ghp_`)

### Step 4: Configure Environment

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in your keys:
   ```env
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   OPENAI_API_KEY=sk-...
   GITHUB_TOKEN=ghp_...
   ```

### Step 5: Install and Run

```bash
# Install dependencies (already done)
npm install

# Start development server
npm run dev
```

You should see:
```
✓ Supabase connection verified
🚀 Server is running on port 3000
```

### Step 6: Test the API

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Register a User:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'
```

Save the `access_token` from the response!

**Analyze a Repository:**
```bash
curl -X POST http://localhost:3000/api/repos/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"githubUrl": "https://github.com/vercel/next.js"}'
```

This will:
- Fetch repo metadata from GitHub
- Scan the codebase structure
- Generate AI insights
- Return complete analysis

---

## 📚 Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Check [walkthrough.md](./walkthrough.md) for implementation details
- Review the [implementation_plan.md](./implementation_plan.md) for architecture

## 🆘 Troubleshooting

**Supabase connection failed:**
- Verify your `SUPABASE_URL` and keys are correct
- Check that the database migration ran successfully

**OpenAI errors:**
- Verify your `OPENAI_API_KEY` is valid
- Check you have credits in your OpenAI account
- The system has fallback responses if OpenAI is unavailable

**GitHub rate limit:**
- Add a `GITHUB_TOKEN` to increase rate limit from 60 to 5,000 requests/hour
- Cached repo scans reduce API calls

**Port already in use:**
- Change `PORT` in `.env` to a different port (e.g., 3001)

---

## 🎯 What You Can Do Now

1. **Analyze Repositories**: POST to `/api/repos/analyze`
2. **Create Daily Logs**: POST to `/api/logs`
3. **Track Activity**: GET from `/api/activity/*`
4. **View Streaks**: GET from `/api/activity/streak`
5. **Search Repos**: GET from `/api/repos/search`

Enjoy building! 🎉
