import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { logger } from '../utils/logger';

/**
 * Middleware factory to validate request data against a Zod schema
 */
export function validate(schema: AnyZodObject) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.errors.map((err) => ({
                    path: err.path.join('.'),
                    message: err.message,
                }));

                logger.warn('Validation error:', errors);

                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors,
                });
                return;
            }

            logger.error('Unexpected validation error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    };
}

/**
 * Validate request body only
 */
export function validateBody(schema: AnyZodObject) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            req.body = await schema.parseAsync(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.errors.map((err) => ({
                    path: err.path.join('.'),
                    message: err.message,
                }));

                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors,
                });
                return;
            }

            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    };
}

/**
 * Validate request query parameters only
 */
export function validateQuery(schema: AnyZodObject) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            req.query = await schema.parseAsync(req.query);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.errors.map((err) => ({
                    path: err.path.join('.'),
                    message: err.message,
                }));

                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors,
                });
                return;
            }

            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    };
}
