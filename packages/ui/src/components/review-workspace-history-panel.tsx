"use client";

import type { ReviewSnapshot } from "@reviselab/core";

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Tile,
} from "../carbon";
import { formatUiDateTime } from "../format";

type HistoryPanelProps = {
  review: ReviewSnapshot;
};

export function HistoryPanel({ review }: HistoryPanelProps) {
  if (review.history.length === 0) {
    return (
      <Tile className="rl-empty-state">
        <p className="rl-muted">No earlier review history is available yet.</p>
      </Tile>
    );
  }

  return (
    <TableContainer title="Review history">
      <div className="rl-table-scroll">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Event</TableHeader>
              <TableHeader>Detail</TableHeader>
              <TableHeader>File</TableHeader>
              <TableHeader>Created</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {review.history.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.label}</TableCell>
                <TableCell>
                  {item.detail ?? (
                    <span className="rl-muted">No detail recorded.</span>
                  )}
                </TableCell>
                <TableCell>{item.filePath ?? "Review-wide"}</TableCell>
                <TableCell>{formatUiDateTime(item.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TableContainer>
  );
}
