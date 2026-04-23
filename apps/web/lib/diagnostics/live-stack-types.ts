export type DiagnosticStatus = "ok" | "warning" | "error";

export type DiagnosticCheck = {
  label: string;
  status: DiagnosticStatus;
  detail: string;
};

export type LiveStackDiagnostics = {
  generatedAt: string;
  checks: DiagnosticCheck[];
};

export function statusFromBoolean(
  label: string,
  passed: boolean,
  okDetail: string,
  errorDetail: string,
): DiagnosticCheck {
  return {
    label,
    status: passed ? "ok" : "error",
    detail: passed ? okDetail : errorDetail,
  };
}
