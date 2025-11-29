import { Router } from 'express';
import { logService } from '../services/log.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { logLimiter } from '../middleware/rateLimit.middleware';
import { createLogSchema, updateLogSchema, logFiltersSchema } from '../utils/validators';
import { formatResponse } from '../utils/helpers';

const router = Router();

/**
 * POST /api/logs
 * Create a daily log entry
 */
router.post(
    '/',
    authenticate,
    logLimiter,
    validateBody(createLogSchema),
    asyncHandler(async (req: AuthRequest, res) => {
        const userId = req.user!.id;
        const data = req.body;

        const log = await logService.createLog(userId, data);

        res.status(201).json(formatResponse(true, { log }, 'Log created successfully'));
    })
);

/**
 * GET /api/logs
 * Get logs with filters
 */
router.get(
    '/',
    authenticate,
    validateQuery(logFiltersSchema),
    asyncHandler(async (req: AuthRequest, res) => {
        const userId = req.user!.id;
        const { repoId, startDate, endDate, date } = req.query as any;

        let logs;

        if (date) {
            // Get logs for a specific date
            logs = await logService.getLogsByDate(userId, date);
        } else if (repoId) {
            // Get logs for a repository
            logs = await logService.getLogsByRepo(userId, repoId, startDate, endDate);
        } else if (startDate && endDate) {
            // Get logs for a date range
            logs = await logService.getLogsByDateRange(userId, startDate, endDate);
        } else {
            // Default: get all logs (could add pagination here)
            const today = new Date();
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            logs = await logService.getLogsByDateRange(
                userId,
                thirtyDaysAgo.toISOString().split('T')[0],
                today.toISOString().split('T')[0]
            );
        }

        res.json(formatResponse(true, { logs, count: logs.length }));
    })
);

/**
 * GET /api/logs/:id
 * Get specific log entry
 */
router.get(
    '/:id',
    authenticate,
    asyncHandler(async (req: AuthRequest, res) => {
        const userId = req.user!.id;
        const { id } = req.params;

        // Fetch the log and verify ownership
        const logs = await logService.getLogsByDateRange(
            userId,
            '2000-01-01',
            '2100-12-31'
        );

        const log = logs.find((l) => l.id === id);

        if (!log) {
            res.status(404).json(formatResponse(false, undefined, 'Log not found'));
            return;
        }

        res.json(formatResponse(true, { log }));
    })
);

/**
 * PATCH /api/logs/:id
 * Update log entry
 */
router.patch(
    '/:id',
    authenticate,
    validateBody(updateLogSchema),
    asyncHandler(async (req: AuthRequest, res) => {
        const userId = req.user!.id;
        const { id } = req.params;
        const updates = req.body;

        const log = await logService.updateLog(id, userId, updates);

        res.json(formatResponse(true, { log }, 'Log updated successfully'));
    })
);

/**
 * DELETE /api/logs/:id
 * Delete log entry
 */
router.delete(
    '/:id',
    authenticate,
    asyncHandler(async (req: AuthRequest, res) => {
        const userId = req.user!.id;
        const { id } = req.params;

        await logService.deleteLog(id, userId);

        res.json(formatResponse(true, undefined, 'Log deleted successfully'));
    })
);

export default router;
