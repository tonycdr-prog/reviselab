import { brandConfig } from "@reviselab/core";
import { AppHeader } from "@reviselab/ui";
import { Button, Column, Content, Grid, Tag, Tile } from "@reviselab/ui/carbon";

const checks = [
  "Category fit",
  "Paper type risk",
  "CS survey policy",
  "Endorsement readiness",
  "Metadata gaps",
  "AI disclosure risk",
];

const bentoItems = [
  {
    className: "rl-public-bento-item rl-public-bento-item-wide",
    title: "Deterministic checks before any suggestion",
    body: "ReviseLab treats submission policy like CI. Rules run first, produce evidence, and link every blocker to a source and exact manuscript target.",
    detail: "Rules-first",
  },
  {
    className: "rl-public-bento-item",
    title: "Diffs that stay conservative",
    body: "Suggested changes are limited to title, abstract, metadata, and submission notes so the paper's scientific claims stay untouched.",
    detail: "Four virtual files",
  },
  {
    className: "rl-public-bento-item",
    title: "Built around Overleaf habits",
    body: "Upload a PDF or LaTeX ZIP, then use the companion panel for selection handoff and the latest review workspace.",
    detail: "Chrome-first companion",
  },
  {
    className: "rl-public-bento-item",
    title: "Explainable AI, never invisible AI",
    body: "AI-generated suggestions are labeled, explained, editable, and reversible. Manual edits leave the AI visual state.",
    detail: "Carbon AI affordance",
  },
  {
    className: "rl-public-bento-item rl-public-bento-item-tall",
    title: "A review workspace, not a grammar editor",
    body: "Checks, files changed, comments, and history work together like a pull request for a manuscript submission.",
    detail: "Submission readiness",
  },
];

const workflow = [
  {
    title: "Upload source",
    body: "Submit a PDF or LaTeX ZIP with category, paper type, first-time submitter, and AI-use context.",
  },
  {
    title: "Parse and normalize",
    body: "The worker extracts title, abstract, metadata, structure, and parse diagnostics before review begins.",
  },
  {
    title: "Run readiness CI",
    body: "Rules flag policy risk, missing evidence, source failures, overclaiming, and disclosure gaps.",
  },
  {
    title: "Review the diff",
    body: "Apply, reject, resolve, edit, or restore suggestions with durable history and source-backed context.",
  },
];

export default function HomePage() {
  return (
    <div className="rl-page rl-public-page">
      <AppHeader brandName={brandConfig.name} />
      <Content>
        <main id="main-content" className="rl-public-main">
          <section className="rl-public-hero" aria-labelledby="hero-title">
            <Grid fullWidth className="rl-public-grid">
              <Column sm={4} md={8} lg={9} xlg={10}>
                <div className="rl-public-hero-copy">
                  <p className="rl-public-kicker">
                    {brandConfig.categoryLabel} for CS and AI preprints
                  </p>
                  <h1 id="hero-title" className="rl-public-hero-title">
                    Review your paper like a pull request.
                  </h1>
                  <p className="rl-public-hero-text">
                    ReviseLab checks submission readiness before you submit:
                    category fit, policy risk, source parsing, metadata, AI
                    disclosure, and conservative diff suggestions in one
                    workspace.
                  </p>
                  <div className="rl-hero-actions">
                    <Button href="/reviews/new">Start a review</Button>
                    <Button kind="secondary" href="/preview/review-workspace">
                      See the workspace
                    </Button>
                  </div>
                </div>
              </Column>
              <Column sm={4} md={8} lg={7} xlg={6}>
                <Tile className="rl-public-hero-panel">
                  <div className="rl-public-panel-header">
                    <span>submission-ci.yml</span>
                    <Tag type="green">Ready with revisions</Tag>
                  </div>
                  <div className="rl-public-check-stack">
                    {checks.map((check) => (
                      <div className="rl-public-check-row" key={check}>
                        <span>{check}</span>
                        <span className="rl-muted">passed with context</span>
                      </div>
                    ))}
                  </div>
                  <div
                    className="rl-public-diff-strip"
                    aria-label="Example diff summary"
                  >
                    <span>- abstract.md</span>
                    <span>+ metadata.yml</span>
                    <span>+ submission_notes.md</span>
                  </div>
                </Tile>
              </Column>
            </Grid>
          </section>

          <section className="rl-public-section" aria-labelledby="checks-title">
            <Grid fullWidth className="rl-public-grid">
              <Column sm={4} md={8} lg={5}>
                <div className="rl-public-section-copy">
                  <h2 id="checks-title">
                    The center of gravity is readiness, not rewriting.
                  </h2>
                  <p className="rl-muted">
                    Paperpal and Writefull help edit prose. ReviseLab is the
                    control plane that asks whether the submission itself is
                    likely to clear policy, metadata, and source checks.
                  </p>
                </div>
              </Column>
              <Column sm={4} md={8} lg={11}>
                <div className="rl-public-bento">
                  {bentoItems.map((item) => (
                    <Tile className={item.className} key={item.title}>
                      <p className="rl-public-mono">{item.detail}</p>
                      <h3>{item.title}</h3>
                      <p>{item.body}</p>
                    </Tile>
                  ))}
                </div>
              </Column>
            </Grid>
          </section>

          <section
            className="rl-public-section"
            aria-labelledby="workflow-title"
          >
            <Grid fullWidth className="rl-public-grid">
              <Column sm={4} md={8} lg={6}>
                <div className="rl-public-sticky-copy">
                  <h2 id="workflow-title">
                    From source file to review history.
                  </h2>
                  <p className="rl-muted">
                    The product moment is the Files changed workspace: a file
                    rail, exact anchors, linked checks, explainability, and a
                    durable action log.
                  </p>
                </div>
              </Column>
              <Column sm={4} md={8} lg={10}>
                <div className="rl-public-workflow">
                  {workflow.map((item, index) => (
                    <Tile className="rl-public-workflow-step" key={item.title}>
                      <span className="rl-public-step-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.body}</p>
                      </div>
                    </Tile>
                  ))}
                </div>
              </Column>
            </Grid>
          </section>

          <section className="rl-public-action" aria-labelledby="action-title">
            <Grid fullWidth className="rl-public-grid">
              <Column sm={4} md={8} lg={10}>
                <h2 id="action-title">
                  Put a submission gate in front of your next preprint.
                </h2>
              </Column>
              <Column sm={4} md={8} lg={6}>
                <p>
                  Start with one manuscript. Get checks, diffs, comments, and a
                  readiness state before the submission form becomes the review
                  surface.
                </p>
                <div className="rl-hero-actions">
                  <Button href="/reviews/new">Start a review</Button>
                  <Button kind="ghost" href="/dashboard">
                    Open dashboard
                  </Button>
                </div>
              </Column>
            </Grid>
          </section>
        </main>
      </Content>
    </div>
  );
}
