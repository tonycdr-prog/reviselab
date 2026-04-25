"use client";

import { useMemo } from "react";

import type { DashboardReviewRow } from "@reviselab/core";

import {
  DataTable,
  OverflowMenu,
  OverflowMenuItem,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../carbon";
import { formatUiDateTime } from "../format";
import {
  PAGE_SIZES,
  TABLE_HEADERS,
  getPaperTypeLabel,
} from "./dashboard-control-plane-constants";
import { ReviewStageTag } from "./review-stage-tag";
import { ReviewStatusTag } from "./review-status-tag";

type DashboardControlPlaneTableProps = {
  paginatedRows: DashboardReviewRow[];
  filteredRowCount: number;
  currentPage: number;
  pageSize: number;
  getReviewHref: (row: DashboardReviewRow) => string;
  onPageChange: (page: number, pageSize: number) => void;
};

export function DashboardControlPlaneTable({
  paginatedRows,
  filteredRowCount,
  currentPage,
  pageSize,
  getReviewHref,
  onPageChange,
}: DashboardControlPlaneTableProps) {
  const tableRows = paginatedRows.map((row) => ({
    id: row.id,
    title: row.title,
    category: row.intendedCategory,
    paperType: row.paperType,
    stage: row.stage,
    readiness: row.readiness ?? "",
    updatedAt: row.updatedAt,
    changes: row.suggestionCount,
    actions: row.id,
  }));

  const rowById = useMemo(
    () => new Map(paginatedRows.map((row) => [row.id, row])),
    [paginatedRows],
  );

  return (
    <DataTable rows={tableRows} headers={[...TABLE_HEADERS]}>
      {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
        <>
          <div className="rl-table-scroll">
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {headers.map((header) => {
                    const { key, isSortable, ...headerProps } = getHeaderProps({
                      header,
                    });

                    return (
                      <TableHeader
                        key={key}
                        {...headerProps}
                        {...(typeof isSortable === "boolean"
                          ? { isSortable }
                          : {})}
                      >
                        {header.header}
                      </TableHeader>
                    );
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => {
                  const item = rowById.get(row.id);

                  if (!item) {
                    return null;
                  }

                  const reviewHref = getReviewHref(item);

                  return (
                    <TableRow
                      key={row.id}
                      {...(() => {
                        const { key, ...rowProps } = getRowProps({ row });
                        return rowProps;
                      })()}
                    >
                      <TableCell>
                        <div className="rl-table-cell-stack">
                          <strong>{item.title}</strong>
                          <span className="rl-muted">
                            {item.failedReason ?? item.progressLabel}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{item.intendedCategory}</TableCell>
                      <TableCell>{getPaperTypeLabel(item.paperType)}</TableCell>
                      <TableCell>
                        <ReviewStageTag
                          progress={{
                            stage: item.stage,
                            parseStatus: item.parseStatus,
                            reviewStatus: item.status,
                            label: item.progressLabel,
                            description: item.progressLabel,
                            canRetry: false,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <ReviewStatusTag readiness={item.readiness} />
                      </TableCell>
                      <TableCell>{formatUiDateTime(item.updatedAt)}</TableCell>
                      <TableCell>
                        {item.suggestionCount} suggestions, {item.checkCount}{" "}
                        checks, {item.commentCount} comments
                      </TableCell>
                      <TableCell>
                        <OverflowMenu
                          ariaLabel={`Actions for ${item.title}`}
                          flipped
                        >
                          <OverflowMenuItem
                            href={reviewHref}
                            itemText="Open review workspace"
                          />
                        </OverflowMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <Pagination
            page={currentPage}
            pageSize={pageSize}
            pageSizes={PAGE_SIZES}
            totalItems={filteredRowCount}
            onChange={({ page: nextPage, pageSize: nextPageSize }) =>
              onPageChange(nextPage, nextPageSize)
            }
          />
        </>
      )}
    </DataTable>
  );
}
