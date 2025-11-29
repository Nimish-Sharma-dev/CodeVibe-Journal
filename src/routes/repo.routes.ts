import { Router } from 'express';
import { repoService } from '../services/repo.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { analysisLimiter } from '../middleware/rateLimit.middleware';
import {
    analyzeRepoSchema,
    updateRepoSchema,
    repoFiltersSchema,
    searchRepoSchema,
} from '../utils/validators';
import { formatResponse } from '../utils/helpers';

const router = Router();

/**
 * POST /api/repos/analyze
 * Analyze a new GitHub repository
 */
router.post(
    '/analyze',
    authenticate,
    analysisLimiter,
    validateBody(analyzeRepoSchema),
    asyncHandler(async (req: AuthRequest, res) => {
        const userId = req.user!.id;
        const { githubUrl } = req.body;

        const repository = await repoService.analyzeRepository(userId, githubUrl);

        res.status(201).json(
            formatResponse(true, { repository }, 'Repository analyzed successfully')
        );
    })
);

/**
 * GET /api/repos
 * List user's repositories with filters
 */
router.get(
    '/',
    authenticate,
    validateQuery(repoFiltersSchema),
    asyncHandler(async (req: AuthRequest, res) => {
        const userId = req.user!.id;
        const filters = req.query as any;

        const result = await repoService.getUserRepositories(userId, filters);

        res.json(formatResponse(true, result));
    })
);

/**
 * GET /api/repos/search
 * Search repositories
 */
router.get(
    '/search',
    authenticate,
    validateQuery(searchRepoSchema),
    asyncHandler(async (req: AuthRequest, res) => {
        const userId = req.user!.id;
        const { query, page, limit } = req.query as any;

        const result = await repoService.searchRepositories(userId, query, page, limit);

        res.json(formatResponse(true, result));
    })
);

/**
 * GET /api/repos/:id
 * Get repository details
 */
router.get(
    '/:id',
    authenticate,
    asyncHandler(async (req: AuthRequest, res) => {
        const userId = req.user!.id;
        const { id } = req.params;

        const repository = await repoService.getRepositoryById(id, userId);

        res.json(formatResponse(true, { repository }));
    })
);

/**
 * PATCH /api/repos/:id
 * Update repository metadata
 */
router.patch(
    '/:id',
    authenticate,
    validateBody(updateRepoSchema),
    asyncHandler(async (req: AuthRequest, res) => {
        const userId = req.user!.id;
        const { id } = req.params;
        const updates = req.body;

        const repository = await repoService.updateRepository(id, userId, updates);

        res.json(formatResponse(true, { repository }, 'Repository updated successfully'));
    })
);

/**
 * DELETE /api/repos/:id
 * Delete repository
 */
router.delete(
    '/:id',
    authenticate,
    asyncHandler(async (req: AuthRequest, res) => {
        const userId = req.user!.id;
        const { id } = req.params;

        await repoService.deleteRepository(id, userId);

        res.json(formatResponse(true, undefined, 'Repository deleted successfully'));
    })
);

export default router;
