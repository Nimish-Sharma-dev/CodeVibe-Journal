/**
 * Parse GitHub URL to extract owner and repo name
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname !== 'github.com' && urlObj.hostname !== 'www.github.com') {
            return null;
        }

        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        if (pathParts.length < 2) {
            return null;
        }

        const owner = pathParts[0];
        let repo = pathParts[1];

        // Remove .git suffix if present
        if (repo.endsWith('.git')) {
            repo = repo.slice(0, -4);
        }

        return { owner, repo };
    } catch {
        return null;
    }
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Parse date string to Date object
 */
export function parseDate(dateString: string): Date {
    return new Date(dateString);
}

/**
 * Get date range for a given period
 */
export function getDateRange(period: 'week' | 'month' | 'year' | 'all'): {
    startDate: string;
    endDate: string;
} {
    const now = new Date();
    const endDate = formatDate(now);
    let startDate: string;

    switch (period) {
        case 'week': {
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            startDate = formatDate(weekAgo);
            break;
        }
        case 'month': {
            const monthAgo = new Date(now);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            startDate = formatDate(monthAgo);
            break;
        }
        case 'year': {
            const yearAgo = new Date(now);
            yearAgo.setFullYear(yearAgo.getFullYear() - 1);
            startDate = formatDate(yearAgo);
            break;
        }
        case 'all':
        default:
            startDate = '2000-01-01';
            break;
    }

    return { startDate, endDate };
}

/**
 * Get all dates in a month
 */
export function getDatesInMonth(month: number, year: number): string[] {
    const dates: string[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        dates.push(formatDate(date));
    }

    return dates;
}

/**
 * Pagination helper
 */
export function getPagination(page: number, limit: number): { from: number; to: number } {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    return { from, to };
}

/**
 * Format API response
 */
export function formatResponse<T>(
    success: boolean,
    data?: T,
    message?: string,
    error?: any
): {
    success: boolean;
    data?: T;
    message?: string;
    error?: any;
} {
    return {
        success,
        ...(data !== undefined && { data }),
        ...(message && { message }),
        ...(error && { error }),
    };
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
}

/**
 * Truncate text
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
): Promise<T> {
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (i < maxRetries - 1) {
                const delay = initialDelay * Math.pow(2, i);
                await sleep(delay);
            }
        }
    }

    throw lastError;
}
