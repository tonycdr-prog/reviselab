import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { ReviewStatusTag } from "@reviselab/ui";

describe("ReviewStatusTag", () => {
  test("renders review stage labels for non-ready reviews", () => {
    render(
      <ReviewStatusTag readiness="Ready with revisions" status="queued" />,
    );

    expect(screen.getByText("Queued")).toBeInTheDocument();
    expect(screen.queryByText("Ready with revisions")).not.toBeInTheDocument();
  });

  test("renders readiness for ready reviews", () => {
    render(<ReviewStatusTag readiness="High submission risk" status="ready" />);

    expect(screen.getByText("High submission risk")).toBeInTheDocument();
  });

  test("keeps unscored reviews aligned as status tags", () => {
    render(<ReviewStatusTag readiness={null} status="ready" />);

    expect(screen.getByText("Not scored yet").closest(".cds--tag")).not.toBe(
      null,
    );
  });
});
