"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CameraCapture from "@/components/CameraCapture";
import CardUpload from "@/components/CardUpload";

type PageState =
  | "loading"
  | "invalid"
  | "already-submitted"
  | "wizard"
  | "submitting"
  | "success"
  | "error";

interface CandidateInfo {
  name: string;
  email: string;
  status: string;
}

export default function VerifyMePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [pageState, setPageState] = useState<PageState>("loading");
  const [candidateInfo, setCandidateInfo] = useState<CandidateInfo | null>(
    null
  );
  const [step, setStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");

  // Captured data
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [aadhaarBlob, setAadhaarBlob] = useState<Blob | null>(null);
  const [aadhaarUrl, setAadhaarUrl] = useState<string | null>(null);
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [panBlob, setPanBlob] = useState<Blob | null>(null);
  const [panUrl, setPanUrl] = useState<string | null>(null);
  const [panNumber, setPanNumber] = useState("");

  // Fetch candidate info on mount
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`/api/verify-me/${token}`);
        if (res.status === 404 || res.status === 410) {
          setPageState("invalid");
          return;
        }
        if (!res.ok) {
          setPageState("invalid");
          return;
        }
        const data = await res.json();
        if (data.status === "submitted" || data.status === "completed") {
          setPageState("already-submitted");
          return;
        }
        setCandidateInfo(data);
        setPageState("wizard");
      } catch {
        setPageState("invalid");
      }
    })();
  }, [token]);

  const handleSelfieCapture = useCallback((blob: Blob) => {
    setSelfieBlob(blob);
    setSelfieUrl(URL.createObjectURL(blob));
  }, []);

  const handleAadhaarUpload = useCallback((blob: Blob) => {
    setAadhaarBlob(blob);
    setAadhaarUrl(URL.createObjectURL(blob));
  }, []);

  const handlePanUpload = useCallback((blob: Blob) => {
    setPanBlob(blob);
    setPanUrl(URL.createObjectURL(blob));
  }, []);

  const uploadImage = async (blob: Blob, filename: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", blob, filename);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url;
  };

  const handleSubmit = async () => {
    if (!selfieBlob || !aadhaarBlob || !panBlob) return;

    setPageState("submitting");
    setErrorMessage("");

    try {
      const [selfieImageUrl, aadhaarImageUrl, panImageUrl] = await Promise.all([
        uploadImage(selfieBlob, "selfie.jpg"),
        uploadImage(aadhaarBlob, "aadhaar.jpg"),
        uploadImage(panBlob, "pan.jpg"),
      ]);

      const res = await fetch(`/api/verify-me/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selfieUrl: selfieImageUrl,
          aadhaarUrl: aadhaarImageUrl,
          panUrl: panImageUrl,
          aadhaarNumber,
          panNumber,
        }),
      });

      if (!res.ok) throw new Error("Submission failed");

      setPageState("success");
    } catch {
      setErrorMessage(
        "Something went wrong while submitting. Please try again."
      );
      setPageState("error");
    }
  };

  // Step indicator
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
              s < step
                ? "bg-[#667eea] text-white"
                : s === step
                  ? "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white"
                  : "bg-gray-200 text-gray-500"
            }`}
          >
            {s < step ? <CheckCircle2 className="h-4 w-4" /> : s}
          </div>
          {s < 3 && (
            <div
              className={`h-0.5 w-8 rounded ${
                s < step ? "bg-[#667eea]" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  // Branding header
  const Header = () => (
    <div className="flex items-center justify-center gap-2 py-6">
      <ShieldCheck className="h-6 w-6 text-[#667eea]" />
      <span className="text-lg font-bold text-gray-900">VerifyIQ</span>
    </div>
  );

  // Outer wrapper
  const PageWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-md px-4 pb-8">
        <Header />
        {children}
      </div>
    </div>
  );

  // --- States ---

  if (pageState === "loading") {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#667eea]" />
          <p className="text-sm text-muted-foreground">
            Loading your verification...
          </p>
        </div>
      </PageWrapper>
    );
  }

  if (pageState === "invalid") {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center gap-4 rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-red-500" />
          <h2 className="text-lg font-semibold text-red-800">
            Invalid or Expired Link
          </h2>
          <p className="text-sm text-red-600">
            This verification link is invalid or has expired. Please contact the
            organization that sent you this link for a new one.
          </p>
        </div>
      </PageWrapper>
    );
  }

  if (pageState === "already-submitted") {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center gap-4 rounded-xl border border-green-200 bg-green-50 p-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
          <h2 className="text-lg font-semibold text-green-800">
            Already Submitted
          </h2>
          <p className="text-sm text-green-700">
            You&apos;ve already submitted your verification. Thank you!
          </p>
        </div>
      </PageWrapper>
    );
  }

  if (pageState === "submitting") {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#667eea]" />
          <p className="text-sm font-medium text-gray-700">
            Processing your verification...
          </p>
          <p className="text-xs text-muted-foreground">
            Please do not close this page.
          </p>
        </div>
      </PageWrapper>
    );
  }

  if (pageState === "success") {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center gap-4 rounded-xl border border-green-200 bg-green-50 p-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
          <h2 className="text-lg font-semibold text-green-800">
            Verification Submitted
          </h2>
          <p className="text-sm text-green-700">
            Thank you! Your verification has been submitted successfully. You
            can close this page now.
          </p>
        </div>
      </PageWrapper>
    );
  }

  if (pageState === "error") {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center gap-4 rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-red-500" />
          <h2 className="text-lg font-semibold text-red-800">
            Submission Failed
          </h2>
          <p className="text-sm text-red-600">
            {errorMessage || "Something went wrong. Please try again."}
          </p>
          <Button
            onClick={() => setPageState("wizard")}
            className="mt-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white border-none"
          >
            Try Again
          </Button>
        </div>
      </PageWrapper>
    );
  }

  // --- Wizard ---
  return (
    <PageWrapper>
      {candidateInfo && (
        <p className="mb-4 text-center text-sm text-muted-foreground">
          Hi <span className="font-medium text-gray-800">{candidateInfo.name}</span>,
          please complete your identity verification below.
        </p>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-1 text-center text-xs font-medium text-muted-foreground">
          Step {step} of 3
        </div>
        <StepIndicator />

        {/* Step 1: Selfie */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Take a Selfie
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Please take a clear photo of your face. This will be compared
                with your ID documents.
              </p>
            </div>
            <CameraCapture
              onCapture={handleSelfieCapture}
              facingMode="user"
              label="Take a selfie"
              capturedUrl={selfieUrl ?? undefined}
            />
          </div>
        )}

        {/* Step 2: Aadhaar Card */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Upload Aadhaar Card
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Take a photo or upload an image of your Aadhaar card (front
                side).
              </p>
            </div>
            <CardUpload
              cardType="aadhaar"
              onUpload={handleAadhaarUpload}
              onOcrResult={setAadhaarNumber}
              capturedUrl={aadhaarUrl ?? undefined}
              ocrNumber={aadhaarNumber}
            />
          </div>
        )}

        {/* Step 3: PAN Card */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Upload PAN Card
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Take a photo or upload an image of your PAN card.
              </p>
            </div>
            <CardUpload
              cardType="pan"
              onUpload={handlePanUpload}
              onOcrResult={setPanNumber}
              capturedUrl={panUrl ?? undefined}
              ocrNumber={panNumber}
            />
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-6 flex items-center justify-between gap-3">
          {step > 1 ? (
            <Button
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={
                (step === 1 && !selfieBlob) ||
                (step === 2 && !aadhaarBlob)
              }
              className="gap-1 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white border-none"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!panBlob}
              className="gap-1 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white border-none"
            >
              Submit Verification
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Your data is encrypted and securely processed.
        <br />
        Powered by VerifyIQ
      </p>
    </PageWrapper>
  );
}
