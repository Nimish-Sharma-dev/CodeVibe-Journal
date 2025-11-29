import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { apiLimiter } from './middleware/rateLimit.middleware';
import { logger } from './utils/logger';

// Import routes
import authRoutes from './routes/auth.routes';
import repoRoutes from './routes/repo.routes';
import logRoutes from './routes/log.routes';
import activityRoutes from './routes/activity.routes';

// Load environment variables
dotenv.config();

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
    next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/repos', apiLimiter, repoRoutes);
app.use('/api/logs', apiLimiter, logRoutes);
app.use('/api/activity', apiLimiter, activityRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'AI-Powered Developer Companion API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            repositories: '/api/repos',
            logs: '/api/logs',
            activity: '/api/activity',
            health: '/health',
        },
    });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
