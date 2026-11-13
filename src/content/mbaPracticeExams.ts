/**
 * Exams (other than CAT) with PUBLISHED ProCounsel mocks in the student app, and how many
 * full-length mocks each has. The public exam pages render from build-time data only (no API
 * calls), so this list is updated by hand when a paper is published in the Admin panel
 * ("MBA Content"). Only then does /mba-entrance-exams/<exam> show its "Practise <exam>" link.
 *
 * Written, validated and waiting for faculty review (procounsel-neet-api/data/mba/content):
 * pc-xat-mock-01, pc-snap-mock-01, pc-nmat-mock-01, pc-cmat-mock-01 — e.g. add `xat: 1` once
 * pc-xat-mock-01 is published.
 */
export const PRACTICE_READY_EXAMS: Readonly<Record<string, number>> = {};
