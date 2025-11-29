import app from './app';
import { logger } from './utils/logger';
import { verifySupabaseConnection } from './config/supabase';
import { cacheService } from './services/cache.service';

const PORT = process.env.PORT || 3000;

/**
 * Start the server
 */
async function startServer() {
    try {
        // Verify Supabase connection
        logger.info('Verifying Supabase connection...');
        const supabaseConnected = await verifySupabaseConnection();

        if (!supabaseConnected) {
            logger.error('Failed to connect to Supabase. Please check your configuration.');
            process.exit(1);
        }

        logger.info('✓ Supabase connection verified');

        // Start Express server
        const server = app.listen(PORT, () => {
            logger.info(`🚀 Server is running on port ${PORT}`);
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`Health check: http://localhost:${PORT}/health`);
            logger.info(`API endpoints: http://localhost:${PORT}/api`);
        });

        // Graceful shutdown
        const shutdown = async (signal: string) => {
            logger.info(`${signal} received. Starting graceful shutdown...`);

            server.close(() => {
                logger.info('HTTP server closed');

                // Stop cache cleanup
                cacheService.stopCleanup();
                logger.info('Cache cleanup stopped');

                logger.info('Graceful shutdown complete');
                process.exit(0);
            });

            // Force shutdown after 10 seconds
            setTimeout(() => {
                logger.error('Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        // Handle shutdown signals
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        // Handle uncaught errors
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();
