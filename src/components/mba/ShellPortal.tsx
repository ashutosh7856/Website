import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders overlays (dialogs, sheets) at the end of <body> so they cover the whole
 * viewport — above the shell's rail and sticky header — instead of only the
 * page column they were declared in. The `school-shell contents` wrapper keeps
 * the shell's CSS variables and classes working without adding a box.
 */
export default function ShellPortal({ children }: { children: ReactNode }) {
  if (typeof document === 'undefined') return null;
  return createPortal(<div className="school-shell contents">{children}</div>, document.body);
}
