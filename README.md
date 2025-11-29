# AI-Powered Developer Companion Platform - Backend

A production-ready backend system that analyzes GitHub repositories, generates AI-powered insights, tracks user productivity, and manages daily development logs.

## Features

### 🔐 Authentication
- User registration and login with Supabase Auth
- JWT-based authentication
- Secure password handling
- Token refresh mechanism
- Profile management

### 📊 Repository Analysis
- GitHub repository ingestion via GitHub API
- Automated codebase scanning and structure extraction
- Language detection and framework identification
- Complexity scoring with heuristics
- AI-powered insights using OpenAI:
  - Project summaries
  - Vibe classification (Enterprise, Startup MVP, Open Source, etc.)
  - Difficulty prediction (Beginner to Expert)
  - Personalized improvement suggestions
- Intelligent caching to reduce API calls

### 📝 Daily Logging
- Create, read, update, and delete daily log entries
- Link logs to specific repositories
- Track hours worked and mood
- Flexible filtering by date, repository, and date range

### 📅 Activity Tracking
- Calendar view showing active vs inactive days
- Streak calculation (current and longest)
- Productivity metrics (total hours, active days, unique repos)
- Comprehensive activity summaries

### 🛡️ Security & Performance
- Row Level Security (RLS) with Supabase
- Rate limiting for all endpoints
- Request validation with Zod
- Error handling and logging
- CORS and Helmet security headers

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **LLM**: OpenAI GPT-4
- **GitHub Integration**: GitHub REST API
- **Validation**: Zod
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

## Prerequisites

- Node.js 18 or higher
- Supabase account and project
- OpenAI API key
- GitHub Personal Access Token (optional, for higher rate limits)

## Installation

1. **Clone the repository**
   ```bash
   cd dev-companion-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Fill in your environment variables:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Supabase Configuration
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

   # OpenAI Configuration
   OPENAI_API_KEY=sk-your-openai-api-key-here
   OPENAI_MODEL=gpt-4-turbo-preview

   # GitHub Configuration
   GITHUB_TOKEN=ghp_your-github-personal-access-token

   # CORS Configuration
   CORS_ORIGIN=http://localhost:3001

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. **Set up Supabase database**

   Go to your Supabase project dashboard → SQL Editor → New Query

   Copy and paste the contents of `supabase/migrations/001_initial_schema.sql` and run it.

   This will create:
   - `profiles` table
   - `repositories` table
   - `daily_logs` table
   - `activity_days` table
   - Indexes for performance
   - Row Level Security policies
   - Triggers for automatic timestamps

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:3000`

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user profile |
| PATCH | `/api/auth/profile` | Update user profile |
| POST | `/api/auth/logout` | Logout user |

### Repositories

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/repos/analyze` | Analyze GitHub repository |
| GET | `/api/repos` | List user's repositories |
| GET | `/api/repos/search` | Search repositories |
| GET | `/api/repos/:id` | Get repository details |
| PATCH | `/api/repos/:id` | Update repository metadata |
| DELETE | `/api/repos/:id` | Delete repository |

### Daily Logs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/logs` | Create daily log |
| GET | `/api/logs` | Get logs (with filters) |
| GET | `/api/logs/:id` | Get specific log |
| PATCH | `/api/logs/:id` | Update log |
| DELETE | `/api/logs/:id` | Delete log |

### Activity

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/activity/calendar` | Get calendar view |
| GET | `/api/activity/streak` | Get streak info |
| GET | `/api/activity/metrics` | Get productivity metrics |
| GET | `/api/activity/summary` | Get activity summary |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

## Usage Examples

### 1. Register a User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "fullName": "John Doe"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

### 3. Analyze a Repository

```bash
curl -X POST http://localhost:3000/api/repos/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "githubUrl": "https://github.com/facebook/react"
  }'
```

### 4. Create a Daily Log

```bash
curl -X POST http://localhost:3000/api/logs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "logDate": "2025-11-29",
    "content": "Worked on implementing authentication",
    "hoursWorked": 4.5,
    "mood": "productive"
  }'
```

### 5. Get Activity Calendar

```bash
curl -X GET "http://localhost:3000/api/activity/calendar?month=11&year=2025" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Project Structure

```
dev-companion-backend/
├── src/
│   ├── config/
│   │   └── supabase.ts           # Supabase client configuration
│   ├── middleware/
│   │   ├── auth.middleware.ts    # Authentication middleware
│   │   ├── error.middleware.ts   # Error handling
│   │   ├── rateLimit.middleware.ts # Rate limiting
│   │   └── validation.middleware.ts # Request validation
│   ├── prompts/
│   │   └── analysis.prompts.ts   # LLM prompt templates
│   ├── routes/
│   │   ├── auth.routes.ts        # Auth endpoints
│   │   ├── repo.routes.ts        # Repository endpoints
│   │   ├── log.routes.ts         # Daily log endpoints
│   │   └── activity.routes.ts    # Activity endpoints
│   ├── services/
│   │   ├── auth.service.ts       # Authentication logic
│   │   ├── repo.service.ts       # Repository management
│   │   ├── github.service.ts     # GitHub API integration
│   │   ├── scanner.service.ts    # Codebase scanning
│   │   ├── llm.service.ts        # OpenAI integration
│   │   ├── log.service.ts        # Daily logging
│   │   ├── activity.service.ts   # Activity tracking
│   │   └── cache.service.ts      # In-memory caching
│   ├── types/
│   │   └── database.ts           # TypeScript type definitions
│   ├── utils/
│   │   ├── helpers.ts            # Helper functions
│   │   ├── logger.ts             # Winston logger
│   │   └── validators.ts         # Zod validation schemas
│   ├── app.ts                    # Express app setup
│   └── server.ts                 # Server entry point
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql # Database schema
├── logs/                         # Log files (auto-generated)
├── .env.example                  # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Adding New Features

1. **Add database tables**: Update `supabase/migrations/001_initial_schema.sql`
2. **Add types**: Update `src/types/database.ts`
3. **Create service**: Add new service in `src/services/`
4. **Create routes**: Add new routes in `src/routes/`
5. **Mount routes**: Update `src/app.ts`

## Deployment

### Environment Setup

1. Set `NODE_ENV=production`
2. Use production Supabase project
3. Set secure CORS origins
4. Configure rate limits appropriately

### Recommended Platforms

- **Vercel** - Serverless deployment
- **Railway** - Container deployment
- **Render** - Container deployment
- **AWS ECS/Fargate** - Container orchestration
- **DigitalOcean App Platform** - Managed deployment

### Production Checklist

- [ ] Set all environment variables
- [ ] Run database migrations in production Supabase
- [ ] Enable RLS policies
- [ ] Configure CORS for production domains
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting
- [ ] Set up SSL/TLS
- [ ] Enable Supabase backups

## Monitoring & Logging

Logs are written to:
- Console (development)
- `logs/combined.log` (all logs)
- `logs/error.log` (errors only)

Log levels: `error`, `warn`, `info`, `debug`

## Rate Limits

- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **Repository Analysis**: 10 requests per hour
- **Daily Logs**: 30 requests per minute

## Error Handling

All errors return a consistent format:

```json
{
  "success": false,
  "error": "Error message",
  "details": [] // Optional validation details
}
```

## Security

- JWT authentication via Supabase Auth
- Row Level Security (RLS) on all tables
- Rate limiting on all endpoints
- Input validation with Zod
- Helmet security headers
- CORS configuration
- Secure password handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using Node.js, TypeScript, Supabase, and OpenAI
