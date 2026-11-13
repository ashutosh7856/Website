import type { Confidence } from '@/api/mba';

/** Self-rated confidence labels (practice card, mock player, results, insights). */
export const CONFIDENCE_OPTIONS: { id: Confidence; label: string }[] = [
  { id: 'sure', label: 'Sure' },
  { id: 'unsure', label: 'Not sure' },
  { id: 'guess', label: 'Guess' },
];

export const CONFIDENCE_LABEL: Record<Confidence, string> = { sure: 'Sure', unsure: 'Not sure', guess: 'Guess' };
