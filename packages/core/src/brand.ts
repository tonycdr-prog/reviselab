export type BrandConfig = {
  name: string;
  repoCodename: string;
  categoryLabel: string;
  tagline: string;
  shortDescription: string;
  extensionDisplayName: string;
  supportFromName: string;
  altDescriptor: string;
};

export const brandConfig: BrandConfig = {
  name: "ReviseLab",
  repoCodename: "Paperlint",
  categoryLabel: "preprint review workspace",
  tagline: "Review your paper like a pull request.",
  shortDescription:
    "Submission review before you submit, with checks, diffs, comments, and policy-aware guidance.",
  extensionDisplayName: "ReviseLab for Overleaf",
  supportFromName: "ReviseLab Support",
  altDescriptor: "Submission review before you submit.",
};

export function pageTitle(title?: string) {
  return title ? `${title} · ${brandConfig.name}` : brandConfig.name;
}
