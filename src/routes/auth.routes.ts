import { Router } from 'express';
import { authService } from '../services/auth.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { authLimiter } from '../middleware/rateLimit.middleware';
import {
    registerSchema,
    loginSchema,
    refreshTokenSchema,
    updateProfileSchema,
} from '../utils/validators';
import { formatResponse } from '../utils/helpers';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
    '/register',
    authLimiter,
    validateBody(registerSchema),
    asyncHandler(async (req, res) => {
        const { email, password, fullName } = req.body;

        const result = await authService.registerUser(email, password, fullName);

        res.status(201).json(
            formatResponse(true, {
                user: result.user,
                session: result.session,
            }, 'User registered successfully')
        );
    })
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
    '/login',
    authLimiter,
    validateBody(loginSchema),
    asyncHandler(async (req, res) => {
        const { email, password } = req.body;

        const result = await authService.loginUser(email, password);

        res.json(
            formatResponse(true, {
                user: result.user,
                session: result.session,
            }, 'Login successful')
        );
    })
);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post(
    '/refresh',
    validateBody(refreshTokenSchema),
    asyncHandler(async (req, res) => {
        const { refreshToken } = req.body;

        const result = await authService.refreshAccessToken(refreshToken);

        res.json(
            formatResponse(true, {
                session: result.session,
            }, 'Token refreshed successfully')
        );
    })
);

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get(
    '/me',
    authenticate,
    asyncHandler(async (req: AuthRequest, res) => {
        const userId = req.user!.id;

        const user = await authService.getUserProfile(userId);

        res.json(formatResponse(true, { user }));
    })
);

/**
 * PATCH /api/auth/profile
 * Update user profile
 */
router.patch(
    '/profile',
    authenticate,
    validateBody(updateProfileSchema),
    asyncHandler(async (req: AuthRequest, res) => {
        const userId = req.user!.id;
        const updates = req.body;

        const user = await authService.updateUserProfile(userId, updates);

        res.json(formatResponse(true, { user }, 'Profile updated successfully'));
    })
);

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post(
    '/logout',
    authenticate,
    asyncHandler(async (req: AuthRequest, res) => {
        const token = req.headers.authorization?.substring(7);

        if (token) {
            await authService.logoutUser(token);
        }

        res.json(formatResponse(true, undefined, 'Logged out successfully'));
    })
);

export default router;
