import { useMutation, useQueryClient } from "@tanstack/react-query";
import { procounselApi } from "@/api/procounselApi";
import { mbaKeys } from "@/api/mba";

/**
 * ProCounsel MBA — "Delete my MBA data".
 * Contract: procounsel-neet-api/docs/mba-api.md → "Delete my MBA data".
 * Deletes the student's MBA data only (practice, mocks, plan, shortlist, AI usage…);
 * the ProCounsellor account itself stays.
 */

export interface DeleteMbaDataResult {
  /** Collection → documents deleted. */
  deleted: Record<string, number>;
  /** Collection → documents kept without the student's id (question reports). */
  anonymised: Record<string, number>;
  completedAt: string;
}

export const DELETE_CONFIRM_PHRASE = "DELETE";

export const deleteMyMbaData = () =>
  procounselApi
    .post<DeleteMbaDataResult>("/mba/me/data/delete", { confirm: DELETE_CONFIRM_PHRASE })
    .then((r) => r.data);

/** On success every cached MBA query is dropped (the profile no longer exists). */
export function useDeleteMyMbaData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteMyMbaData,
    onSuccess: () => qc.removeQueries({ queryKey: mbaKeys.all }),
  });
}
