import type { Gym } from '@gym-spot/shared-types';

export function formatDateLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' });
}

export function formatDateTimeLabel(slotTime: string): string {
  return new Date(slotTime).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatGymLabel(gym: Gym): string {
  return gym.location ? `${gym.name} — ${gym.location}` : gym.name;
}
