export type ReviewWorkspaceTab =
  | "overview"
  | "checks"
  | "files"
  | "comments"
  | "history";

export const REVIEW_WORKSPACE_TAB_ORDER: ReviewWorkspaceTab[] = [
  "overview",
  "checks",
  "files",
  "comments",
  "history",
];

export function getSelectedTabIndex(tab: ReviewWorkspaceTab) {
  const index = REVIEW_WORKSPACE_TAB_ORDER.indexOf(tab);
  return index >= 0 ? index : 0;
}
