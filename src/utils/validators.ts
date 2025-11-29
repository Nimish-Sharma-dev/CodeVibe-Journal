import { z } from 'zod';

// Auth validation schemas
export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const updateProfileSchema = z.object({
    fullName: z.string().min(2).optional(),
    avatarUrl: z.string().url().optional(),
});

// Repository validation schemas
export const analyzeRepoSchema = z.object({
    githubUrl: z.string().url('Invalid GitHub URL').refine(
        (url) => {
            const githubPattern = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;
            return githubPattern.test(url);
        },
        { message: 'Must be a valid GitHub repository URL' }
    ),
});

export const updateRepoSchema = z.object({
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional(),
});

export const repoFiltersSchema = z.object({
    language: z.string().optional(),
    tags: z.array(z.string()).optional(),
    difficulty: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

export const searchRepoSchema = z.object({
    query: z.string().min(1, 'Search query is required'),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

// Daily log validation schemas
export const createLogSchema = z.object({
    repoId: z.string().uuid('Invalid repository ID').optional(),
    logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    content: z.string().min(1, 'Content is required'),
    hoursWorked: z.number().min(0).max(24).default(0),
    mood: z.string().optional(),
});

export const updateLogSchema = z.object({
    content: z.string().min(1).optional(),
    hoursWorked: z.number().min(0).max(24).optional(),
    mood: z.string().optional(),
});

export const logFiltersSchema = z.object({
    repoId: z.string().uuid().optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// Activity validation schemas
export const calendarViewSchema = z.object({
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2000).max(2100),
});

export const metricsSchema = z.object({
    period: z.enum(['week', 'month', 'year', 'all']).default('month'),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AnalyzeRepoInput = z.infer<typeof analyzeRepoSchema>;
export type UpdateRepoInput = z.infer<typeof updateRepoSchema>;
export type RepoFiltersInput = z.infer<typeof repoFiltersSchema>;
export type SearchRepoInput = z.infer<typeof searchRepoSchema>;
export type CreateLogInput = z.infer<typeof createLogSchema>;
export type UpdateLogInput = z.infer<typeof updateLogSchema>;
export type LogFiltersInput = z.infer<typeof logFiltersSchema>;
export type CalendarViewInput = z.infer<typeof calendarViewSchema>;
export type MetricsInput = z.infer<typeof metricsSchema>;
