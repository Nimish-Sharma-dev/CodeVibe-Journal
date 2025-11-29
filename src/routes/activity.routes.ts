import { Router } from 'express';
import { activityService } from '../services/activity.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { validateQuery } from '../middleware/validation.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { calendarViewSchema, metricsSchema } from '../utils/validators';
import { formatResponse } from '../utils/helpers';

const router = Router();

/**
 * GET /api/activity/calendar
 * Get calendar view for a specific month
 */
router.get(
    '/calendar',
    authenticate,
    validateQuery(calendarViewSchema),
    asyncHandler(async (req: AuthRequest, res) => {
        const userId = req.user!.id;
        const { month, year } = req.query as any;

        const calendar = await activityService.getCalendarView(userId, month, year);

        res.json(formatResponse(true, { calendar }));
    })
);

/**
 * GET /api/activity/streak
 * Get current and longest streak
 */
router.get(
    '/streak',
    authenticate,
    asyncHandler(async (req: AuthRequest, res) => {
        const userId = req.user!.id;

        const streak = await activityService.calculateStreak(userId);

        res.json(formatResponse(true, { streak }));
    })
);

/**
 * GET /api/activity/metrics
 * Get productivity metrics
 */
router.get(
    '/metrics',
    authenticate,
    validateQuery(metricsSchema),
    asyncHandler(async (req: AuthRequest, res) => {
        const userId = req.user!.id;
        const { period } = req.query as any;

        const metrics = await activityService.getProductivityMetrics(userId, period);

        res.json(formatResponse(true, { metrics }));
    })
);

/**
 * GET /api/activity/summary
 * Get comprehensive activity summary
 */
router.get(
    '/summary',
    authenticate,
    asyncHandler(async (req: AuthRequest, res) => {
        const userId = req.user!.id;

        const summary = await activityService.getActivitySummary(userId);

        res.json(formatResponse(true, { summary }));
    })
);

export default router;
