// Type definitions only - used as reference for API data mapping
// All mock data has been removed. Pages now use real API calls via @/lib/api

export type RiskLevel = "low" | "medium" | "high";
export type VerificationStatus = "verified" | "flagged" | "pending" | "in_progress";
export type CheckType = "Identity" | "Employment" | "Education" | "Criminal" | "Credit" | "Address";

export interface Verification {
  id: string;
  name: string;
  company: string;
  checkType: CheckType;
  riskScore: number;
  riskLevel: RiskLevel;
  status: VerificationStatus;
  date: string;
  email: string;
  phone: string;
  pan: string;
  aadhaar: string;
  linkedin: string;
  city: string;
  checks: CheckResult[];
}

export interface CheckResult {
  name: string;
  status: "pass" | "fail" | "warning" | "pending";
  details: string;
  rawData?: Record<string, string>;
}
