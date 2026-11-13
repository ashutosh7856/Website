/**
 * Exams (other than CAT) with PUBLISHED ProCounsel mocks in the student app, and how many
 * full-length mocks each has. The public exam pages render from build-time data only (no API
 * calls), so this list is updated by hand when a paper is published in the Admin panel
 * ("MBA Content"). Only then does /mba-entrance-exams/<exam> show its "Practise <exam>" link.
 */
export const PRACTICE_READY_EXAMS: Readonly<Record<string, number>> = { xat: 1, snap: 1, nmat: 1, cmat: 1 };
