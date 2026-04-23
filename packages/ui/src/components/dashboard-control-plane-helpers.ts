import type {
  DashboardReviewRow,
  PaperType,
  ReviewReadiness,
  ReviewStage,
} from "@reviselab/core";

export function filterDashboardRows(
  rows: DashboardReviewRow[],
  filters: {
    searchTerm: string;
    stageFilter: ReviewStage | "all";
    readinessFilter: ReviewReadiness | "all";
    paperTypeFilter: PaperType | "all";
  },
) {
  const { searchTerm, stageFilter, readinessFilter, paperTypeFilter } = filters;

  return [...rows]
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .filter((row) => {
      if (
        searchTerm &&
        !`${row.title} ${row.intendedCategory}`
          .toLowerCase()
          .includes(searchTerm)
      ) {
        return false;
      }

      if (stageFilter !== "all" && row.stage !== stageFilter) {
        return false;
      }

      if (readinessFilter !== "all" && row.readiness !== readinessFilter) {
        return false;
      }

      if (paperTypeFilter !== "all" && row.paperType !== paperTypeFilter) {
        return false;
      }

      return true;
    });
}

export function paginateDashboardRows(
  rows: DashboardReviewRow[],
  page: number,
  pageSize: number,
) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;

  return {
    currentPage,
    paginatedRows: rows.slice(startIndex, startIndex + pageSize),
    totalPages,
  };
}
