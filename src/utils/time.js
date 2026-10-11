import { format } from 'date-fns';
export const clock = (ms) => format(ms, 'HH:mm');
export function countdown(ms) {
  if (ms <= 0) return '00:00:00';
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  return [h, m, x].map((n) => String(n).padStart(2, '0')).join(':');
}
