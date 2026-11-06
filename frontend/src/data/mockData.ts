export const DESCRIPTION_MAX_LENGTH = 255;

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} хв`;
  if (m === 0) return `${h} год`;
  return `${h} год ${m} хв`;
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}.${month}.${year}`;
}
