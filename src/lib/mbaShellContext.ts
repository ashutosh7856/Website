import { useOutletContext } from 'react-router-dom';
import type { MbaProfile } from '@/api/mba';

/**
 * What MbaStudentLayout hands down to every page inside the MBA shell.
 *
 * Kept out of the layout module (as schoolShellContext is) so pages can import
 * the hook without pulling the whole shell into their chunk.
 */
export type MbaShellContext = {
  /** The onboarding answers, or null when the student has not onboarded yet. */
  profile: MbaProfile | null;
  /** Display name for greetings — never a placeholder string. */
  firstName: string | null;
  phone: string | null;
};

export const useMbaShell = () => useOutletContext<MbaShellContext>();
