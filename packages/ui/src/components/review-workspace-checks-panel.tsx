"use client";

import type { ReviewCheck, ReviewSnapshot } from "@reviselab/core";

import {
  Button,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
  Tile,
} from "../carbon";

function getCheckStateTagType(
  state: ReviewSnapshot["checks"][number]["state"],
) {
  return state === "fail" ? "red" : state === "warn" ? "warm-gray" : "green";
}

export function ChecksPanel({
  review,
  onSelectCheck,
}: {
  review: ReviewSnapshot;
  onSelectCheck: (check: ReviewCheck) => void;
}) {
  if (review.checks.length === 0) {
    return (
      <Tile className="rl-empty-state">
        <p className="rl-muted">
          No policy checks were generated for this review.
        </p>
      </Tile>
    );
  }

  return (
    <TableContainer
      title="Policy checks"
      description="Each flagged item can jump directly to the linked diff block."
    >
      <div className="rl-table-scroll">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Check</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Summary</TableHeader>
              <TableHeader>Source</TableHeader>
              <TableHeader>Jump</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {review.checks.map((check) => (
              <TableRow key={check.id}>
                <TableCell>{check.name}</TableCell>
                <TableCell>
                  <Tag type={getCheckStateTagType(check.state)}>
                    {check.state}
                  </Tag>
                </TableCell>
                <TableCell>
                  <strong>{check.summary}</strong>
                  <p className="rl-muted">{check.detail}</p>
                </TableCell>
                <TableCell>
                  <Link href={check.sourceUrl} target="_blank" rel="noreferrer">
                    Open policy source
                  </Link>
                </TableCell>
                <TableCell>
                  <Button
                    kind="ghost"
                    size="sm"
                    type="button"
                    onClick={() => onSelectCheck(check)}
                  >
                    Open diff
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TableContainer>
  );
}
