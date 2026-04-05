import type { Verification, CheckResult, RiskLevel, VerificationStatus } from "@/data/mock";

// Maps backend risk score (0-10) to frontend (0-100)
function mapRiskScore(score: number | null): number {
  if (score === null) return 50;
  return score * 10;
}

function mapRiskLevel(score: number): RiskLevel {
  if (score <= 35) return "low";
  if (score <= 65) return "medium";
  return "high";
}

function mapStatus(status: string): VerificationStatus {
  switch (status) {
    case "clear": return "verified";
    case "flagged": return "flagged";
    case "processing": return "in_progress";
    case "review": return "flagged";
    case "pending":
    default: return "pending";
  }
}

function mapCheckStatus(status: string): "pass" | "fail" | "warning" | "pending" {
  switch (status) {
    case "passed": return "pass";
    case "failed": return "fail";
    case "flagged": return "warning";
    case "not_found": return "warning";
    case "incomplete": return "warning";
    case "error": return "fail";
    case "skipped": return "warning";
    default: return "pending";
  }
}

function mapCheckName(checkType: string): string {
  switch (checkType) {
    case "pan_verification": return "PAN Verification";
    case "internet_sweep": return "Internet Sweep";
    case "linkedin_check": return "LinkedIn Verification";
    case "field_completeness": return "Field Completeness";
    default: return checkType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }
}

function mapCheckDetail(checkType: string, status: string, rawResponse: any): string {
  if (!rawResponse) return status === "pending" ? "Check in progress..." : "No details available";

  if (rawResponse.demo) {
    switch (checkType) {
      case "pan_verification": return status === "passed" ? "PAN card verified" : "PAN verification failed";
      case "internet_sweep": return status === "flagged" ? "Adverse media found" : "No adverse media found";
      case "linkedin_check": return status === "passed" ? "Profile verified" : "LinkedIn profile not found";
      case "field_completeness": return `${rawResponse.completenessScore || 0}% fields complete`;
    }
  }

  switch (checkType) {
    case "pan_verification":
      if (rawResponse.valid !== undefined) return rawResponse.valid ? "PAN format valid" : "Invalid PAN format";
      return status === "passed" ? "PAN verified with IDfy" : "PAN verification failed";
    case "internet_sweep":
      return rawResponse.redFlagCount > 0
        ? `${rawResponse.redFlagCount} adverse media hit(s) found`
        : `No adverse media — ${rawResponse.totalResults || 0} sources checked`;
    case "linkedin_check":
      return rawResponse.exists ? "LinkedIn profile active and verified" : (rawResponse.reason || "LinkedIn profile not found");
    case "field_completeness":
      return `${rawResponse.completenessScore || 0}% complete — ${rawResponse.missingFields?.length || 0} fields missing`;
    default:
      return rawResponse.reason || rawResponse.error || "Completed";
  }
}

export function mapBackendVerification(v: any): Verification {
  const riskScore100 = mapRiskScore(v.riskScore);
  const checks: CheckResult[] = (v.checks || []).map((c: any) => ({
    name: mapCheckName(c.checkType),
    status: mapCheckStatus(c.status),
    details: mapCheckDetail(c.checkType, c.status, c.rawResponse),
    rawData: c.rawResponse ? flattenForDisplay(c.rawResponse) : undefined,
  }));

  return {
    id: v.id,
    name: v.subjectName,
    company: "—",
    checkType: "Identity",
    riskScore: riskScore100,
    riskLevel: mapRiskLevel(riskScore100),
    status: mapStatus(v.status),
    date: v.createdAt,
    email: "",
    phone: v.phone || "",
    pan: v.panNumber || "",
    aadhaar: v.aadhaarNumber || "",
    linkedin: v.linkedinUrl || "",
    city: v.city || "",
    checks,
  };
}

function flattenForDisplay(obj: any): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "object" && value !== null) {
      if (Array.isArray(value)) {
        result[key] = value.length > 0 ? JSON.stringify(value) : "[]";
      } else {
        for (const [k2, v2] of Object.entries(value as object)) {
          result[`${key}.${k2}`] = String(v2);
        }
      }
    } else {
      result[key] = String(value);
    }
  }
  return result;
}

export async function fetchVerifications(limit = 20, status?: string): Promise<{ verifications: Verification[]; total: number }> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (status && status !== "all") params.set("status", status);
  const res = await fetch(`/api/verifications?${params}`);
  if (!res.ok) throw new Error("Failed to fetch verifications");
  const data = await res.json();
  return {
    verifications: data.verifications.map(mapBackendVerification),
    total: data.total,
  };
}

export async function fetchVerificationDetail(id: string): Promise<Verification | null> {
  const res = await fetch(`/api/verifications/${id}`);
  if (!res.ok) return null;
  const data = await res.json();
  return mapBackendVerification(data);
}

export async function fetchStats(): Promise<{ total: number; verified: number; flagged: number; pending: number }> {
  const res = await fetch("/api/analytics");
  if (!res.ok) throw new Error("Failed to fetch analytics");
  const data = await res.json();
  return {
    total: data.total,
    verified: data.clear,
    flagged: data.flagged + data.review,
    pending: data.pending + data.processing,
  };
}

export async function submitVerification(formData: {
  fullName: string;
  phone: string;
  pan: string;
  aadhaar: string;
  linkedin?: string;
  city: string;
  callbackUrl?: string;
}): Promise<{ verificationId: string }> {
  const res = await fetch("/api/verifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subjectName: formData.fullName,
      panNumber: formData.pan,
      aadhaarNumber: formData.aadhaar,
      linkedinUrl: formData.linkedin || undefined,
      phone: formData.phone,
      city: formData.city,
    }),
  });
  if (!res.ok) throw new Error("Failed to submit verification");
  return res.json();
}

export async function fetchSettings() {
  const res = await fetch("/api/settings");
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

export async function regenerateApiKey(): Promise<string> {
  const res = await fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "regenerate_api_key" }),
  });
  if (!res.ok) throw new Error("Failed to regenerate key");
  const data = await res.json();
  return data.apiKey;
}

export async function saveWebhookUrl(url: string) {
  const res = await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ webhookUrl: url }),
  });
  if (!res.ok) throw new Error("Failed to save webhook URL");
  return res.json();
}

export async function testWebhook(apiKey: string, webhookUrl: string) {
  const res = await fetch("/api/v1/webhook/test", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({ webhookUrl }),
  });
  return res.json();
}

export async function submitBulkUpload(records: any[], columnMapping: Record<string, string>) {
  const res = await fetch("/api/bulk-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ records, columnMapping }),
  });
  if (!res.ok) throw new Error("Failed to process bulk upload");
  return res.json();
}
