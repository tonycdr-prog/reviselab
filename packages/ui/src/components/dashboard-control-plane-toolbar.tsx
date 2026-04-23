"use client";

import type { PaperType, ReviewReadiness, ReviewStage } from "@reviselab/core";

import {
  Select,
  SelectItem,
  TableToolbar,
  TableToolbarSearch,
} from "../carbon";
import {
  PAPER_TYPE_OPTIONS,
  READINESS_OPTIONS,
  STAGE_OPTIONS,
} from "./dashboard-control-plane-constants";

type DashboardControlPlaneToolbarProps = {
  searchTerm: string;
  stageFilter: ReviewStage | "all";
  readinessFilter: ReviewReadiness | "all";
  paperTypeFilter: PaperType | "all";
  onSearchTermChange: (value: string) => void;
  onStageFilterChange: (value: ReviewStage | "all") => void;
  onReadinessFilterChange: (value: ReviewReadiness | "all") => void;
  onPaperTypeFilterChange: (value: PaperType | "all") => void;
};

export function DashboardControlPlaneToolbar({
  searchTerm,
  stageFilter,
  readinessFilter,
  paperTypeFilter,
  onSearchTermChange,
  onStageFilterChange,
  onReadinessFilterChange,
  onPaperTypeFilterChange,
}: DashboardControlPlaneToolbarProps) {
  return (
    <TableToolbar
      aria-label="Review queue filters"
      className="rl-dashboard-toolbar"
    >
      <div className="rl-dashboard-toolbar-content">
        <TableToolbarSearch
          className="rl-dashboard-toolbar-search"
          persistent
          labelText="Search the review queue"
          placeholder="Search title or category"
          value={searchTerm}
          onChange={(_, value) => onSearchTermChange(value ?? "")}
        />
        <div className="rl-dashboard-filter-grid">
          <Select
            className="rl-dashboard-filter"
            id="dashboard-stage-filter"
            labelText="Stage"
            value={stageFilter}
            onChange={(event) =>
              onStageFilterChange(
                event.currentTarget.value as ReviewStage | "all",
              )
            }
          >
            {STAGE_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                text={option.label}
              />
            ))}
          </Select>
          <Select
            className="rl-dashboard-filter"
            id="dashboard-readiness-filter"
            labelText="Readiness"
            value={readinessFilter}
            onChange={(event) =>
              onReadinessFilterChange(
                event.currentTarget.value as ReviewReadiness | "all",
              )
            }
          >
            {READINESS_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                text={option.label}
              />
            ))}
          </Select>
          <Select
            className="rl-dashboard-filter"
            id="dashboard-paper-type-filter"
            labelText="Paper type"
            value={paperTypeFilter}
            onChange={(event) =>
              onPaperTypeFilterChange(
                event.currentTarget.value as PaperType | "all",
              )
            }
          >
            {PAPER_TYPE_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                text={option.label}
              />
            ))}
          </Select>
        </div>
      </div>
    </TableToolbar>
  );
}
