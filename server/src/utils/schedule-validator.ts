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

  return end.getTime() >= start.getTime();
}

