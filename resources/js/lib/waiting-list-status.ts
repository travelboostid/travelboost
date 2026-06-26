type WaitingListScheduleSummary = {
    status?: string;
    is_past_booking_deadline?: boolean;
};

export function resolveWaitingListDisplayStatus(
    rowStatus: string,
    schedules: WaitingListScheduleSummary[],
): string {
    if (['fulfilled', 'cancelled', 'expired'].includes(rowStatus)) {
        return rowStatus;
    }

    if (
        schedules.some((schedule) => schedule.is_past_booking_deadline === true)
    ) {
        return 'expired';
    }

    return rowStatus;
}

export function shouldShowScheduleStatusBadge(
    scheduleStatus: string | undefined,
    parentStatus: string,
    isPastBookingDeadline: boolean,
): boolean {
    if (!scheduleStatus) {
        return false;
    }

    if (isPastBookingDeadline || scheduleStatus === 'expired') {
        return false;
    }

    if (parentStatus === 'expired' && scheduleStatus === 'queued') {
        return false;
    }

    if (parentStatus === 'offered' && scheduleStatus === 'offered') {
        return false;
    }

    return true;
}

export function waitingListStatusLabel(status: string): string {
    switch (status) {
        case 'pending':
            return 'Pending';
        case 'contacted':
            return 'Contacted';
        case 'offered':
            return 'Offered';
        case 'fulfilled':
            return 'Fulfilled';
        case 'cancelled':
            return 'Cancelled';
        case 'expired':
            return 'Expired';
        case 'queued':
            return 'Queued';
        case 'skipped':
            return 'Skipped';
        default:
            return status;
    }
}

export function waitingListStatusBadgeClass(status?: string | null): string {
    switch (status) {
        case 'pending':
        case 'queued':
            return 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300';
        case 'contacted':
            return 'border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-300';
        case 'offered':
            return 'border-teal-500/30 bg-teal-500/10 text-teal-800 dark:text-teal-300';
        case 'fulfilled':
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300';
        case 'cancelled':
            return 'border-destructive/30 bg-destructive/10 text-destructive';
        case 'expired':
            return 'border-border bg-muted text-muted-foreground';
        default:
            return 'border-border bg-muted text-muted-foreground';
    }
}
