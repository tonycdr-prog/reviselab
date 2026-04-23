"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";

import type {
  DashboardReviewRow,
  PaperType,
  ReviewReadiness,
  ReviewStage,
} from "@reviselab/core";

import { Button, TableContainer, Tile } from "../carbon";
import { DEFAULT_PAGE_SIZE } from "./dashboard-control-plane-constants";
import {
  filterDashboardRows,
  paginateDashboardRows,
} from "./dashboard-control-plane-helpers";
import { DashboardControlPlaneTable } from "./dashboard-control-plane-table";
import { DashboardControlPlaneToolbar } from "./dashboard-control-plane-toolbar";

type DashboardControlPlaneProps = {
  rows: DashboardReviewRow[];
  newReviewHref: string;
};

export function DashboardControlPlane({
  rows,
  newReviewHref,
}: DashboardControlPlaneProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<ReviewStage | "all">("all");
  const [readinessFilter, setReadinessFilter] = useState<
    ReviewReadiness | "all"
  >("all");
  const [paperTypeFilter, setPaperTypeFilter] = useState<PaperType | "all">(
    "all",
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const deferredSearchTerm = useDeferredValue(searchTerm.trim().toLowerCase());

  const filteredRows = useMemo(() => {
    return filterDashboardRows(rows, {
      searchTerm: deferredSearchTerm,
      stageFilter,
      readinessFilter,
      paperTypeFilter,
    });
  }, [deferredSearchTerm, paperTypeFilter, readinessFilter, rows, stageFilter]);

  const { currentPage, paginatedRows } = useMemo(() => {
    return paginateDashboardRows(filteredRows, page, pageSize);
  }, [filteredRows, page, pageSize]);

  useEffect(() => {
    if (page !== currentPage) {
      setPage(currentPage);
    }
  }, [currentPage, page]);

  if (rows.length === 0) {
    return (
      <Tile className="rl-empty-state">
        <h2>Review queue</h2>
        <p className="rl-muted">
          No reviews have been created yet. Start a manuscript review to
          populate this control plane.
        </p>
        <Button href={newReviewHref}>New review</Button>
      </Tile>
    );
  }

  return (
    <TableContainer
      title="Review queue"
      description="Search, filter, and open manuscript reviews from the main control plane."
    >
      <DashboardControlPlaneToolbar
        searchTerm={searchTerm}
        stageFilter={stageFilter}
        readinessFilter={readinessFilter}
        paperTypeFilter={paperTypeFilter}
        onSearchTermChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        onStageFilterChange={(value) => {
          setStageFilter(value);
          setPage(1);
        }}
        onReadinessFilterChange={(value) => {
          setReadinessFilter(value);
          setPage(1);
        }}
        onPaperTypeFilterChange={(value) => {
          setPaperTypeFilter(value);
          setPage(1);
        }}
      />

      {filteredRows.length === 0 ? (
        <Tile className="rl-empty-state">
          <p className="rl-muted">
            No reviews match the current search and filter combination.
          </p>
        </Tile>
      ) : (
        <DashboardControlPlaneTable
          paginatedRows={paginatedRows}
          filteredRowCount={filteredRows.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={(nextPage, nextPageSize) => {
            setPage(nextPage);
            setPageSize(nextPageSize);
          }}
        />
      )}
    </TableContainer>
  );
}
