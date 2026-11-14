export function isValidDateRange(
  startDate: string | Date,
  endDate?: string | Date | null
): boolean {
  const start = new Date(startDate);
  if (isNaN(start.getTime())) {
    return false;
  }

  if (endDate === null || endDate === undefined || endDate === '') {
    return true;
  }

  const end = new Date(endDate);
  if (isNaN(end.getTime())) {
    return false;
  }

  const startUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const endUtc = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());

  return endUtc >= startUtc;
}

