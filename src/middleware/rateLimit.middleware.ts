import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15 minutes
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
    windowMs,
    max: maxRequests,
    message: {
        success: false,
        error: 'Too many requests, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
        res.status(429).json({
            success: false,
            error: 'Too many requests, please try again later',
        });
    },
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: {
        success: false,
        error: 'Too many authentication attempts, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Rate limiter for repo analysis (expensive operation)
 */
export const analysisLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 analyses per hour
    message: {
        success: false,
        error: 'Analysis rate limit exceeded, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter for log creation
 */
export const logLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 logs per minute
    message: {
        success: false,
        error: 'Too many log entries, please slow down',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
