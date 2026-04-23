const DEFAULT_NEXT_PATH = "/dashboard";

export function normalizeNextPath(nextPath: string | null | undefined) {
  if (!nextPath) {
    return DEFAULT_NEXT_PATH;
  }

  const trimmed = nextPath.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return DEFAULT_NEXT_PATH;
  }

  return trimmed;
}
