import { supabaseAdmin } from '../config/supabase';
import { ActivityDay } from '../types/database';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/error.middleware';
import { getDatesInMonth, getDateRange } from '../utils/helpers';

class ActivityService {
    /**
     * Get calendar view for a specific month
     */
    async getCalendarView(
        userId: string,
        month: number,
        year: number
    ): Promise<{
        month: number;
        year: number;
        days: Array<{
            date: string;
            isActive: boolean;
            logCount: number;
            totalHours: number;
        }>;
    }> {
        try {
            // Get all dates in the month
            const dates = getDatesInMonth(month, year);
            const startDate = dates[0];
            const endDate = dates[dates.length - 1];

            // Fetch activity data for the month
            const { data: activities, error } = await supabaseAdmin
                .from('activity_days')
                .select('*')
                .eq('user_id', userId)
                .gte('activity_date', startDate)
                .lte('activity_date', endDate);

            if (error) {
                logger.error('Error fetching calendar view:', error);
                throw new AppError(500, 'Failed to fetch calendar data');
            }

            // Create a map for quick lookup
            const activityMap = new Map<string, ActivityDay>();
            activities?.forEach((activity) => {
                activityMap.set(activity.activity_date, activity);
            });

            // Build calendar days
            const days = dates.map((date) => {
                const activity = activityMap.get(date);
                return {
                    date,
                    isActive: activity?.is_active || false,
                    logCount: activity?.log_count || 0,
                    totalHours: activity?.total_hours || 0,
                };
            });

            return {
                month,
                year,
                days,
            };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            logger.error('Unexpected error fetching calendar:', error);
            throw new AppError(500, 'Failed to fetch calendar data');
        }
    }

    /**
     * Calculate current and longest streak
     */
    async calculateStreak(userId: string): Promise<{
        currentStreak: number;
        longestStreak: number;
        lastActiveDate: string | null;
    }> {
        try {
            // Fetch all active days ordered by date descending
            const { data: activities, error } = await supabaseAdmin
                .from('activity_days')
                .select('activity_date, is_active')
                .eq('user_id', userId)
                .eq('is_active', true)
                .order('activity_date', { ascending: false });

            if (error) {
                logger.error('Error calculating streak:', error);
                throw new AppError(500, 'Failed to calculate streak');
            }

            if (!activities || activities.length === 0) {
                return {
                    currentStreak: 0,
                    longestStreak: 0,
                    lastActiveDate: null,
                };
            }

            const lastActiveDate = activities[0].activity_date;

            // Calculate current streak
            let currentStreak = 0;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (let i = 0; i < activities.length; i++) {
                const activityDate = new Date(activities[i].activity_date);
                activityDate.setHours(0, 0, 0, 0);

                const expectedDate = new Date(today);
                expectedDate.setDate(expectedDate.getDate() - i);

                if (activityDate.getTime() === expectedDate.getTime()) {
                    currentStreak++;
                } else {
                    break;
                }
            }

            // Calculate longest streak
            let longestStreak = 0;
            let tempStreak = 1;

            for (let i = 0; i < activities.length - 1; i++) {
                const currentDate = new Date(activities[i].activity_date);
                const nextDate = new Date(activities[i + 1].activity_date);

                const dayDiff = Math.floor(
                    (currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24)
                );

                if (dayDiff === 1) {
                    tempStreak++;
                } else {
                    longestStreak = Math.max(longestStreak, tempStreak);
                    tempStreak = 1;
                }
            }

            longestStreak = Math.max(longestStreak, tempStreak);

            return {
                currentStreak,
                longestStreak,
                lastActiveDate,
            };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            logger.error('Unexpected error calculating streak:', error);
            throw new AppError(500, 'Failed to calculate streak');
        }
    }

    /**
     * Get productivity metrics for a period
     */
    async getProductivityMetrics(
        userId: string,
        period: 'week' | 'month' | 'year' | 'all' = 'month'
    ): Promise<{
        totalHours: number;
        totalLogs: number;
        activeDays: number;
        uniqueRepos: number;
        averageHoursPerDay: number;
        period: string;
        startDate: string;
        endDate: string;
    }> {
        try {
            const { startDate, endDate } = getDateRange(period);

            // Fetch activity data for the period
            const { data: activities, error: activityError } = await supabaseAdmin
                .from('activity_days')
                .select('*')
                .eq('user_id', userId)
                .gte('activity_date', startDate)
                .lte('activity_date', endDate);

            if (activityError) {
                logger.error('Error fetching activity metrics:', activityError);
                throw new AppError(500, 'Failed to fetch metrics');
            }

            // Fetch logs to count unique repos
            const { data: logs, error: logsError } = await supabaseAdmin
                .from('daily_logs')
                .select('repo_id')
                .eq('user_id', userId)
                .gte('log_date', startDate)
                .lte('log_date', endDate);

            if (logsError) {
                logger.error('Error fetching logs for metrics:', logsError);
                throw new AppError(500, 'Failed to fetch metrics');
            }

            // Calculate metrics
            const totalHours = activities?.reduce((sum, day) => sum + (day.total_hours || 0), 0) || 0;
            const totalLogs = activities?.reduce((sum, day) => sum + (day.log_count || 0), 0) || 0;
            const activeDays = activities?.filter((day) => day.is_active).length || 0;

            // Count unique repos
            const uniqueRepoIds = new Set(
                logs?.filter((log) => log.repo_id).map((log) => log.repo_id)
            );
            const uniqueRepos = uniqueRepoIds.size;

            const averageHoursPerDay = activeDays > 0 ? totalHours / activeDays : 0;

            return {
                totalHours: Math.round(totalHours * 100) / 100,
                totalLogs,
                activeDays,
                uniqueRepos,
                averageHoursPerDay: Math.round(averageHoursPerDay * 100) / 100,
                period,
                startDate,
                endDate,
            };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            logger.error('Unexpected error fetching metrics:', error);
            throw new AppError(500, 'Failed to fetch productivity metrics');
        }
    }

    /**
     * Get activity summary
     */
    async getActivitySummary(userId: string): Promise<{
        streak: {
            current: number;
            longest: number;
            lastActive: string | null;
        };
        thisWeek: {
            activeDays: number;
            totalHours: number;
        };
        thisMonth: {
            activeDays: number;
            totalHours: number;
        };
        allTime: {
            activeDays: number;
            totalHours: number;
            totalRepos: number;
        };
    }> {
        try {
            const [streak, weekMetrics, monthMetrics, allTimeMetrics] = await Promise.all([
                this.calculateStreak(userId),
                this.getProductivityMetrics(userId, 'week'),
                this.getProductivityMetrics(userId, 'month'),
                this.getProductivityMetrics(userId, 'all'),
            ]);

            return {
                streak: {
                    current: streak.currentStreak,
                    longest: streak.longestStreak,
                    lastActive: streak.lastActiveDate,
                },
                thisWeek: {
                    activeDays: weekMetrics.activeDays,
                    totalHours: weekMetrics.totalHours,
                },
                thisMonth: {
                    activeDays: monthMetrics.activeDays,
                    totalHours: monthMetrics.totalHours,
                },
                allTime: {
                    activeDays: allTimeMetrics.activeDays,
                    totalHours: allTimeMetrics.totalHours,
                    totalRepos: allTimeMetrics.uniqueRepos,
                },
            };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            logger.error('Unexpected error fetching activity summary:', error);
            throw new AppError(500, 'Failed to fetch activity summary');
        }
    }
}

export const activityService = new ActivityService();
