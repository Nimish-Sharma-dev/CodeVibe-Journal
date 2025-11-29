import { supabaseAdmin } from '../config/supabase';
import { User } from '../types/database';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/error.middleware';

class AuthService {
    /**
     * Register a new user
     */
    async registerUser(
        email: string,
        password: string,
        fullName?: string
    ): Promise<{
        user: User;
        session: any;
    }> {
        try {
            // Create user with Supabase Auth
            const { data, error } = await supabaseAdmin.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName || null,
                    },
                },
            });

            if (error) {
                logger.error('Registration error:', error);
                throw new AppError(400, error.message);
            }

            if (!data.user) {
                throw new AppError(400, 'Failed to create user');
            }

            logger.info(`User registered: ${email}`);

            return {
                user: {
                    id: data.user.id,
                    email: data.user.email!,
                    full_name: fullName,
                },
                session: data.session,
            };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            logger.error('Unexpected registration error:', error);
            throw new AppError(500, 'Registration failed');
        }
    }

    /**
     * Login user
     */
    async loginUser(
        email: string,
        password: string
    ): Promise<{
        user: User;
        session: any;
    }> {
        try {
            const { data, error } = await supabaseAdmin.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                logger.warn(`Login failed for ${email}:`, error.message);
                throw new AppError(401, 'Invalid email or password');
            }

            if (!data.user || !data.session) {
                throw new AppError(401, 'Invalid email or password');
            }

            // Fetch user profile
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

            logger.info(`User logged in: ${email}`);

            return {
                user: {
                    id: data.user.id,
                    email: data.user.email!,
                    full_name: profile?.full_name,
                    avatar_url: profile?.avatar_url,
                },
                session: data.session,
            };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            logger.error('Unexpected login error:', error);
            throw new AppError(500, 'Login failed');
        }
    }

    /**
     * Refresh access token
     */
    async refreshAccessToken(refreshToken: string): Promise<{
        session: any;
    }> {
        try {
            const { data, error } = await supabaseAdmin.auth.refreshSession({
                refresh_token: refreshToken,
            });

            if (error) {
                logger.warn('Token refresh failed:', error.message);
                throw new AppError(401, 'Invalid refresh token');
            }

            if (!data.session) {
                throw new AppError(401, 'Failed to refresh token');
            }

            logger.debug('Token refreshed successfully');

            return {
                session: data.session,
            };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            logger.error('Unexpected token refresh error:', error);
            throw new AppError(500, 'Token refresh failed');
        }
    }

    /**
     * Get user profile
     */
    async getUserProfile(userId: string): Promise<User> {
        try {
            const { data: profile, error } = await supabaseAdmin
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error || !profile) {
                throw new AppError(404, 'User profile not found');
            }

            // Get user email from auth
            const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);

            return {
                id: profile.id,
                email: authUser.user?.email || '',
                full_name: profile.full_name,
                avatar_url: profile.avatar_url,
            };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            logger.error('Error fetching user profile:', error);
            throw new AppError(500, 'Failed to fetch user profile');
        }
    }

    /**
     * Update user profile
     */
    async updateUserProfile(
        userId: string,
        updates: {
            fullName?: string;
            avatarUrl?: string;
        }
    ): Promise<User> {
        try {
            const updateData: any = {};
            if (updates.fullName !== undefined) updateData.full_name = updates.fullName;
            if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl;

            const { data, error } = await supabaseAdmin
                .from('profiles')
                .update(updateData)
                .eq('id', userId)
                .select()
                .single();

            if (error) {
                logger.error('Profile update error:', error);
                throw new AppError(400, 'Failed to update profile');
            }

            logger.info(`Profile updated for user: ${userId}`);

            // Get user email
            const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);

            return {
                id: data.id,
                email: authUser.user?.email || '',
                full_name: data.full_name,
                avatar_url: data.avatar_url,
            };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            logger.error('Unexpected profile update error:', error);
            throw new AppError(500, 'Profile update failed');
        }
    }

    /**
     * Logout user (invalidate session)
     */
    async logoutUser(accessToken: string): Promise<void> {
        try {
            const { error } = await supabaseAdmin.auth.admin.signOut(accessToken);

            if (error) {
                logger.warn('Logout error:', error.message);
                // Don't throw error on logout failure
            }

            logger.debug('User logged out');
        } catch (error) {
            logger.error('Unexpected logout error:', error);
            // Don't throw error on logout failure
        }
    }
}

export const authService = new AuthService();
