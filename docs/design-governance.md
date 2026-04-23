# ReviseLab Design Governance

## Hierarchy

1. Carbon [`llms.txt`](https://carbondesignsystem.com/llms.txt)
2. Carbon docs linked from `llms.txt`
3. IBM Design Language for philosophy and language
4. Local rules in `RTK.md` and this document

## Approved UI entrypoints

- `@reviselab/ui`
- `@reviselab/ui/carbon`
- `@reviselab/ui/icons`

## Approved shared recipes

- `ReviewWorkspaceRecipe`
- `UploadReviewFormView`
- `OverleafPanelView`
- `AppHeader`
- `ReviewStatusTag`
- `SuggestedTextEditor`

## Drift checks

- No direct Carbon component imports outside `packages/ui`
- No alternate icon libraries outside `packages/ui/icons`
- No user-facing `Paperlint`
- No machine-specific absolute workspace paths in checked-in docs or config
- No arbitrary spacing or color literals in app UI code
- No raw locale-dependent date formatting in shared UI
