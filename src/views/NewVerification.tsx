import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2, AlertTriangle, User, Building2, Phone, CreditCard, Fingerprint, Link2 as Linkedin, MapPin, Link as LinkIcon } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { submitVerification, fetchVerificationDetail } from "@/lib/api";

const formSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  pan: z.string().min(10, "PAN number must be 10 characters").max(10),
  aadhaar: z.string().min(12, "Aadhaar number must be 12 digits"),
  linkedin: z.string().url("Must be a valid URL").or(z.string().length(0)).optional(),
  city: z.string().min(2, "City is required"),
  callbackUrl: z.string().url("Must be a valid URL").or(z.string().length(0)).optional(),
});

type FormValues = z.infer<typeof formSchema>;

type Step = { label: string; status: "waiting" | "running" | "done" | "failed" };

interface ResultData {
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  status: "verified" | "flagged";
  checks: { name: string; status: "pass" | "fail" | "warning"; detail: string }[];
}

function RiskGauge({ score }: { score: number }) {
  const angle = (score / 100) * 180 - 90;
  const color = score <= 35 ? "#22c55e" : score <= 65 ? "#eab308" : "#ef4444";
  const cx = 80;
  const cy = 80;
  const r = 60;
  const startAngle = Math.PI;
  const endAngle = 0;

  const arc = (a: number) => ({
    x: cx + r * Math.cos(a),
    y: cy - r * Math.sin(a),
  });

  const needleAngle = Math.PI - (score / 100) * Math.PI;
  const needleLen = 50;

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="100" viewBox="0 0 160 100">
        <path
          d={`M ${arc(startAngle).x} ${arc(startAngle).y} A ${r} ${r} 0 0 1 ${arc(endAngle).x} ${arc(endAngle).y}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d={`M ${arc(startAngle).x} ${arc(startAngle).y} A ${r} ${r} 0 0 1 ${arc(needleAngle).x} ${arc(needleAngle).y}`}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
        />
        <line
          x1={cx}
          y1={cy}
          x2={cx + needleLen * Math.cos(needleAngle)}
          y2={cy - needleLen * Math.sin(needleAngle)}
          stroke="#374151"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={4} fill="#374151" />
        <text x={cx} y={cy + 20} textAnchor="middle" fontSize="22" fontWeight="bold" fill={color}>{score}</text>
        <text x={cx} y={cy + 34} textAnchor="middle" fontSize="9" fill="#6b7280">/ 100</text>
      </svg>
      <span className="text-xs text-muted-foreground -mt-1">Risk Score</span>
    </div>
  );
}

export function NewVerification() {
  const [phase, setPhase] = useState<"form" | "progress" | "result">("form");
  const [steps, setSteps] = useState<Step[]>([
    { label: "Identity Check", status: "waiting" },
    { label: "Internet Sweep", status: "waiting" },
    { label: "LinkedIn Check", status: "waiting" },
  ]);
  const [result, setResult] = useState<ResultData | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      pan: "",
      aadhaar: "",
      linkedin: "",
      city: "",
      callbackUrl: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setPhase("progress");
    setSteps([
      { label: "Identity Check", status: "waiting" },
      { label: "Internet Sweep", status: "waiting" },
      { label: "LinkedIn Check", status: "waiting" },
    ]);

    try {
      // Submit to API
      const { verificationId: vId } = await submitVerification(values);
      setVerificationId(vId);

      // Poll for results
      const stepMap: Record<string, number> = {
        "pan_verification": 0,
        "internet_sweep": 1,
        "linkedin_check": 2,
      };

      let completed = false;
      let attempts = 0;

      while (!completed && attempts < 30) {
        await new Promise(r => setTimeout(r, 1000));
        attempts++;

        const detail = await fetchVerificationDetail(vId);
        if (!detail) continue;

        // Update steps based on real check statuses
        if (detail.checks.length > 0) {
          setSteps(prev => {
            const updated = [...prev];
            detail.checks.forEach(check => {
              const checkType = check.name === "PAN Verification" ? "pan_verification"
                : check.name === "Internet Sweep" ? "internet_sweep"
                : check.name === "LinkedIn Verification" ? "linkedin_check"
                : null;
              if (checkType && stepMap[checkType] !== undefined) {
                const idx = stepMap[checkType];
                if (check.status === "pass") updated[idx] = { ...updated[idx], status: "done" };
                else if (check.status === "fail" || check.status === "warning") updated[idx] = { ...updated[idx], status: "done" };
                else if (check.status === "pending") updated[idx] = { ...updated[idx], status: "running" };
              }
            });
            return updated;
          });
        }

        if (detail.status === "verified" || detail.status === "flagged") {
          completed = true;
          // Set all remaining steps to done
          setSteps(prev => prev.map(s => ({ ...s, status: "done" as const })));

          const riskLevel = detail.riskLevel;
          setResult({
            riskScore: detail.riskScore,
            riskLevel,
            status: detail.status === "verified" ? "verified" : "flagged",
            checks: detail.checks.map(c => ({
              name: c.name,
              status: c.status === "pass" ? "pass" : c.status === "fail" ? "fail" : "warning",
              detail: c.details,
            })),
          });
          setPhase("result");
        }
      }

      if (!completed) {
        // Timeout - show what we have
        setSteps(prev => prev.map(s => s.status === "waiting" ? { ...s, status: "done" as const } : s));
        setResult({
          riskScore: 50,
          riskLevel: "medium",
          status: "flagged",
          checks: [{ name: "Verification", status: "warning", detail: "Verification is still processing. Check results page for updates." }],
        });
        setPhase("result");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setSteps(prev => prev.map(s => ({ ...s, status: "failed" as const })));
      setResult({
        riskScore: 0,
        riskLevel: "high",
        status: "flagged",
        checks: [{ name: "Error", status: "fail", detail: "Failed to run verification. Please try again." }],
      });
      setPhase("result");
    }
  }

  const stepIcon = (status: Step["status"]) => {
    if (status === "done") return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    if (status === "running") return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
    if (status === "failed") return <AlertTriangle className="w-5 h-5 text-red-500" />;
    return <div className="w-5 h-5 rounded-full border-2 border-border" />;
  };

  const fields = [
    { name: "fullName" as const, label: "Full Name", icon: User, placeholder: "Arjun Mehta" },
    { name: "phone" as const, label: "Phone Number", icon: Phone, placeholder: "+91 98765 43210" },
    { name: "pan" as const, label: "PAN Number", icon: CreditCard, placeholder: "ABCPM1234D" },
    { name: "aadhaar" as const, label: "Aadhaar Number", icon: Fingerprint, placeholder: "2345 6789 0123" },
    { name: "linkedin" as const, label: "LinkedIn URL", icon: Linkedin, placeholder: "https://linkedin.com/in/arjunmehta" },
    { name: "city" as const, label: "City", icon: MapPin, placeholder: "Bengaluru" },
    { name: "callbackUrl" as const, label: "Callback URL", icon: LinkIcon, placeholder: "https://yourdomain.com/webhook" },
  ];

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">New Verification</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Submit a new background verification request</p>
      </div>

      {phase === "form" && (
        <div className="bg-card rounded-xl border border-card-border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "linear-gradient(135deg, #667eea, #f07b6c)" }}>
              <Building2 className="w-3 h-3" />
            </div>
            <h2 className="font-semibold text-foreground text-sm">Candidate Details</h2>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" data-testid="verification-form">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map(({ name, label, icon: Icon, placeholder }) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{label}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <Input
                              {...field}
                              placeholder={placeholder}
                              className="pl-9"
                              data-testid={`input-${name}`}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full h-11 font-semibold text-sm"
                  style={{ background: "linear-gradient(135deg, #667eea 0%, #f07b6c 100%)", border: "none" }}
                  data-testid="btn-submit-verification"
                >
                  Run Verification
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}

      {phase === "progress" && (
        <div className="bg-card rounded-xl border border-card-border shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #667eea20, #f07b6c20)" }}>
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h2 className="font-semibold text-lg text-foreground">Running Verification</h2>
            <p className="text-sm text-muted-foreground mt-1">Please wait while we check the candidate's background</p>
          </div>
          <div className="space-y-4 max-w-sm mx-auto" data-testid="progress-steps">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-border">
                {stepIcon(step.status)}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${step.status === "done" ? "text-foreground" : step.status === "running" ? "text-primary" : "text-muted-foreground"}`}>
                    {step.label}
                  </p>
                  {step.status === "running" && (
                    <p className="text-xs text-muted-foreground mt-0.5 animate-pulse">Processing...</p>
                  )}
                  {step.status === "done" && (
                    <p className="text-xs text-green-600 mt-0.5">Complete</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === "result" && result && (
        <div className="space-y-4" data-testid="verification-result">
          <div className="bg-card rounded-xl border border-card-border shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-foreground">Verification Result</h2>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${result.status === "verified" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {result.status === "verified" ? "Verified" : "Flagged"}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <RiskGauge score={result.riskScore} />
              <div className="flex-1 space-y-3">
                {result.checks.map((c, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border" data-testid={`check-result-${i}`}>
                    <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs ${c.status === "pass" ? "bg-green-500" : c.status === "warning" ? "bg-yellow-500" : "bg-red-500"}`}>
                      {c.status === "pass" ? "✓" : c.status === "warning" ? "!" : "✕"}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Button
            onClick={() => { setPhase("form"); form.reset(); setResult(null); }}
            variant="outline"
            className="w-full"
            data-testid="btn-new-verification"
          >
            Run Another Verification
          </Button>
        </div>
      )}
    </div>
  );
}
