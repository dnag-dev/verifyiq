"use client";

import React, { useRef, useState, useCallback } from "react";
import { CreditCard, Fingerprint, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CameraCapture from "@/components/CameraCapture";

interface CardUploadProps {
  cardType: "aadhaar" | "pan";
  onUpload: (blob: Blob) => void;
  onOcrResult?: (number: string) => void;
  capturedUrl?: string;
  ocrNumber?: string;
  label?: string;
}

export default function CardUpload({
  cardType,
  onUpload,
  onOcrResult,
  capturedUrl,
  ocrNumber,
  label,
}: CardUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(capturedUrl ?? null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [extractedNumber, setExtractedNumber] = useState(ocrNumber ?? "");
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const cardLabel =
    label ?? (cardType === "aadhaar" ? "Aadhaar Card" : "PAN Card");
  const CardIcon = cardType === "aadhaar" ? Fingerprint : CreditCard;
  const placeholder =
    cardType === "aadhaar" ? "Enter 12-digit Aadhaar number" : "Enter PAN number (e.g. ABCDE1234F)";

  const runOcr = useCallback(
    async (blob: Blob) => {
      setIsOcrLoading(true);
      setOcrError(false);
      try {
        const formData = new FormData();
        formData.append("file", blob);
        formData.append("cardType", cardType);

        const res = await fetch("/api/ocr", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("OCR failed");

        const data = await res.json();
        const number = data.number || "";
        setExtractedNumber(number);
        if (number && onOcrResult) {
          onOcrResult(number);
        }
        if (!number) {
          setOcrError(true);
        }
      } catch {
        setOcrError(true);
      } finally {
        setIsOcrLoading(false);
      }
    },
    [cardType, onOcrResult]
  );

  const handleCapture = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    setImageUrl(url);
    setImageBlob(blob);
    setShowCamera(false);
    onUpload(blob);
    runOcr(blob);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setImageBlob(file);
    onUpload(file);
    runOcr(file);
  };

  const handleNumberChange = (value: string) => {
    setExtractedNumber(value);
    if (onOcrResult) {
      onOcrResult(value);
    }
  };

  const handleRetake = () => {
    setImageUrl(null);
    setImageBlob(null);
    setExtractedNumber("");
    setOcrError(false);
    setIsEditing(false);
    setShowCamera(true);
  };

  if (showCamera) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CardIcon className="h-4 w-4 text-[#667eea]" />
          {cardLabel}
        </div>
        <CameraCapture
          onCapture={handleCapture}
          facingMode="environment"
          label={`Take a photo of your ${cardLabel}`}
        />
      </div>
    );
  }

  // Image already captured/uploaded
  if (imageUrl) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CardIcon className="h-4 w-4 text-[#667eea]" />
          {cardLabel}
        </div>

        <div className="relative w-full overflow-hidden rounded-xl border border-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={cardLabel}
            className="h-auto w-full object-cover"
          />
        </div>

        {/* OCR Result */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          {isOcrLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Extracting {cardType === "aadhaar" ? "Aadhaar" : "PAN"} number...
            </div>
          ) : isEditing || ocrError || !extractedNumber ? (
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">
                {ocrError
                  ? `Could not extract number. Please enter your ${cardType === "aadhaar" ? "Aadhaar" : "PAN"} number manually:`
                  : `${cardType === "aadhaar" ? "Aadhaar" : "PAN"} Number:`}
              </label>
              <Input
                value={extractedNumber}
                onChange={(e) => handleNumberChange(e.target.value)}
                placeholder={placeholder}
                className="text-sm"
              />
              {isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="text-xs"
                >
                  Done
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">
                  Extracted {cardType === "aadhaar" ? "Aadhaar" : "PAN"} Number
                </p>
                <p className="font-mono text-sm font-medium">
                  {extractedNumber}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                className="h-8 w-8"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        <Button variant="outline" size="sm" onClick={handleRetake} className="w-full">
          Retake Photo
        </Button>
      </div>
    );
  }

  // Initial state -- choose take photo or upload
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <CardIcon className="h-4 w-4 text-[#667eea]" />
        {cardLabel}
      </div>

      <div className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6">
        <CardIcon className="h-8 w-8 text-gray-400" />
        <p className="text-center text-sm text-muted-foreground">
          Take a photo or upload an image of your {cardLabel}
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowCamera(true)}
            className="gap-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white border-none"
          >
            Take Photo
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload File
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>
    </div>
  );
}
