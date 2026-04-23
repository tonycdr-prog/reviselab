import "server-only";

import { requireAuthenticatedContext } from "./repository-runtime";

export async function getLatestReviewForViewer() {
  const auth = await requireAuthenticatedContext();

  if (!auth) {
    return null;
  }

  const { data: reviewRow, error } = await auth.supabase
    .from("reviews")
    .select("id,paper_id")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!reviewRow) {
    return null;
  }

  return reviewRow;
}
