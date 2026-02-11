/**
 * Utility functions for handling task recurrence logic
 */

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';

/**
 * Calculate the next occurrence date for a recurring task
 * @param currentDate - The current due date of the task
 * @param recurrenceType - Type of recurrence
 * @param recurrenceDay - Day number (0-6 for weekly, 1-31 for monthly)
 * @param recurrenceDays - Array of day numbers for custom recurrence (0-6, where 0=Sunday)
 * @returns The next occurrence date, or null if not recurring
 */
export function getNextRecurrenceDate(
    currentDate: string,
    recurrenceType: RecurrenceType,
    recurrenceDay?: number | null,
    recurrenceDays?: number[] | null
): string | null {
    if (recurrenceType === 'none') {
        return null;
    }

    const current = new Date(currentDate);

    // Ensure we have a valid date
    if (isNaN(current.getTime())) {
        console.error('Invalid date provided:', currentDate);
        return null;
    }

    let nextDate: Date;

    switch (recurrenceType) {
        case 'daily':
            // Add one day
            nextDate = new Date(current);
            nextDate.setDate(current.getDate() + 1);
            break;

        case 'weekly':
            // Add 7 days (next week, same day)
            nextDate = new Date(current);
            nextDate.setDate(current.getDate() + 7);
            break;

        case 'monthly':
            // Add one month, keeping the same day of month
            nextDate = new Date(current);
            nextDate.setMonth(current.getMonth() + 1);

            // Handle edge case where day doesn't exist in next month (e.g., Jan 31 -> Feb 28)
            if (recurrenceDay && recurrenceDay > 0 && recurrenceDay <= 31) {
                const daysInMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
                const targetDay = Math.min(recurrenceDay, daysInMonth);
                nextDate.setDate(targetDay);
            }
            break;

        case 'custom':
            // Find the next occurrence based on selected days of week
            if (!recurrenceDays || recurrenceDays.length === 0) {
                console.error('Custom recurrence requires recurrenceDays array');
                return null;
            }

            // Sort days to ensure correct order
            const sortedDays = [...recurrenceDays].sort((a, b) => a - b);
            const currentDayOfWeek = current.getDay(); // 0 = Sunday, 6 = Saturday

            // Find the next day in the recurrence pattern
            let daysToAdd: number | null = null;

            // First, check if there's a day later in the current week
            for (const day of sortedDays) {
                if (day > currentDayOfWeek) {
                    daysToAdd = day - currentDayOfWeek;
                    break;
                }
            }

            // If no day found in current week, use first day of next week
            if (daysToAdd === null) {
                const firstDay = sortedDays[0];
                daysToAdd = (7 - currentDayOfWeek) + firstDay;
            }

            nextDate = new Date(current);
            nextDate.setDate(current.getDate() + daysToAdd);
            break;

        default:
            console.error('Unknown recurrence type:', recurrenceType);
            return null;
    }

    // Format as YYYY-MM-DD
    return nextDate.toISOString().split('T')[0];
}

/**
 * Check if a task should be recreated (is recurring and not 'none')
 */
export function shouldRecreateTask(recurrenceType: RecurrenceType): boolean {
    return recurrenceType !== 'none';
}
