import { supabaseAdmin } from '../config/supabase';
import { DailyLog } from '../types/database';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/error.middleware';

class LogService {
    /**
     * Create a daily log entry
     */
    async createLog(
        userId: string,
        data: {
            repoId?: string;
            logDate: string;
            content: string;
            hoursWorked?: number;
            mood?: string;
        }
    ): Promise<DailyLog> {
        try {
            const { data: log, error } = await supabaseAdmin
                .from('daily_logs')
                .insert({
                    user_id: userId,
                    repo_id: data.repoId || null,
                    log_date: data.logDate,
                    content: data.content,
                    hours_worked: data.hoursWorked || 0,
                    mood: data.mood || null,
                })
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    // Unique constraint violation
                    throw new AppError(409, 'Log entry already exists for this date and repository');
                }
                logger.error('Error creating log:', error);
                throw new AppError(500, 'Failed to create log entry');
            }

            logger.info(`Log created for user ${userId} on ${data.logDate}`);

            // Update activity for this date
            await this.updateActivityForDate(userId, data.logDate);

            return log;
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            logger.error('Unexpected error creating log:', error);
            throw new AppError(500, 'Failed to create log entry');
        }
    }

    /**
     * Get logs by date
     */
    async getLogsByDate(userId: string, date: string): Promise<DailyLog[]> {
        try {
            const { data, error } = await supabaseAdmin
                .from('daily_logs')
                .select('*')
                .eq('user_id', userId)
                .eq('log_date', date)
                .order('created_at', { ascending: false });

            if (error) {
                logger.error('Error fetching logs by date:', error);
                throw new AppError(500, 'Failed to fetch logs');
            }

            return data || [];
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            logger.error('Unexpected error fetching logs:', error);
            throw new AppError(500, 'Failed to fetch logs');
        }
    }

    /**
     * Get logs by repository
     */
    async getLogsByRepo(
        userId: string,
        repoId: string,
        startDate?: string,
        endDate?: string
    ): Promise<DailyLog[]> {
        try {
            let query = supabaseAdmin
                .from('daily_logs')
                .select('*')
                .eq('user_id', userId)
                .eq('repo_id', repoId)
                .order('log_date', { ascending: false });

            if (startDate) {
                query = query.gte('log_date', startDate);
            }

            if (endDate) {
                query = query.lte('log_date', endDate);
            }

            const { data, error } = await query;

            if (error) {
                logger.error('Error fetching logs by repo:', error);
                throw new AppError(500, 'Failed to fetch logs');
            }

            return data || [];
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            logger.error('Unexpected error fetching logs:', error);
            throw new AppError(500, 'Failed to fetch logs');
        }
    }

    /**
     * Get logs by date range
     */
    async getLogsByDateRange(
        userId: string,
        startDate: string,
        endDate: string
    ): Promise<DailyLog[]> {
        try {
            const { data, error } = await supabaseAdmin
                .from('daily_logs')
                .select('*')
                .eq('user_id', userId)
                .gte('log_date', startDate)
                .lte('log_date', endDate)
                .order('log_date', { ascending: false });

            if (error) {
                logger.error('Error fetching logs by date range:', error);
                throw new AppError(500, 'Failed to fetch logs');
            }

            return data || [];
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            logger.error('Unexpected error fetching logs:', error);
            throw new AppError(500, 'Failed to fetch logs');
        }
    }

    /**
     * Update log entry
     */
    async updateLog(
        logId: string,
        userId: string,
        updates: {
            content?: string;
            hoursWorked?: number;
            mood?: string;
        }
    ): Promise<DailyLog> {
        try {
            const updateData: any = {};
            if (updates.content !== undefined) updateData.content = updates.content;
            if (updates.hoursWorked !== undefined) updateData.hours_worked = updates.hoursWorked;
            if (updates.mood !== undefined) updateData.mood = updates.mood;

            const { data, error } = await supabaseAdmin
                .from('daily_logs')
                .update(updateData)
                .eq('id', logId)
                .eq('user_id', userId)
                .select()
                .single();

            if (error || !data) {
                throw new AppError(404, 'Log entry not found or update failed');
            }

            logger.info(`Log updated: ${logId}`);

            // Update activity for this date
            await this.updateActivityForDate(userId, data.log_date);

            return data;
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            logger.error('Error updating log:', error);
            throw new AppError(500, 'Failed to update log entry');
        }
    }

    /**
     * Delete log entry
     */
    async deleteLog(logId: string, userId: string): Promise<void> {
        try {
            // First get the log to know which date to update
            const { data: log } = await supabaseAdmin
                .from('daily_logs')
                .select('log_date')
                .eq('id', logId)
                .eq('user_id', userId)
                .single();

            const { error } = await supabaseAdmin
                .from('daily_logs')
                .delete()
                .eq('id', logId)
                .eq('user_id', userId);

            if (error) {
                throw new AppError(404, 'Log entry not found or delete failed');
            }

            logger.info(`Log deleted: ${logId}`);

            // Update activity for this date
            if (log) {
                await this.updateActivityForDate(userId, log.log_date);
            }
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            logger.error('Error deleting log:', error);
            throw new AppError(500, 'Failed to delete log entry');
        }
    }

    /**
     * Update activity_days table for a specific date
     */
    async updateActivityForDate(userId: string, date: string): Promise<void> {
        try {
            // Aggregate logs for this date
            const { data: logs } = await supabaseAdmin
                .from('daily_logs')
                .select('hours_worked')
                .eq('user_id', userId)
                .eq('log_date', date);

            const logCount = logs?.length || 0;
            const totalHours = logs?.reduce((sum, log) => sum + (log.hours_worked || 0), 0) || 0;
            const isActive = logCount > 0;

            // Upsert activity_days record
            const { error } = await supabaseAdmin.from('activity_days').upsert(
                {
                    user_id: userId,
                    activity_date: date,
                    log_count: logCount,
                    total_hours: totalHours,
                    is_active: isActive,
                },
                {
                    onConflict: 'user_id,activity_date',
                }
            );

            if (error) {
                logger.error('Error updating activity:', error);
            } else {
                logger.debug(`Activity updated for ${userId} on ${date}`);
            }
        } catch (error) {
            logger.error('Unexpected error updating activity:', error);
        }
    }
}

export const logService = new LogService();
