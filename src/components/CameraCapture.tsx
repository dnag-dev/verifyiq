"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Camera, RotateCcw, Check, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
  facingMode?: "user" | "environment";
  label?: string;
  capturedUrl?: string;
}

export default function CameraCapture({
  onCapture,
  facingMode = "user",
  label = "Take a Photo",
  capturedUrl,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    capturedUrl ?? null
  );
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(true);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setPermissionDenied(false);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraSupported(false);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setPermissionDenied(true);
      setCameraSupported(false);
    }
  }, [facingMode]);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          setPreviewUrl(URL.createObjectURL(blob));
          stopStream();
        }
      },
      "image/jpeg",
      0.9
    );
  };

  const handleRetake = () => {
    setPreviewUrl(null);
    setCapturedBlob(null);
    startCamera();
  };

  const handleUsePhoto = () => {
    if (capturedBlob) {
      onCapture(capturedBlob);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCapturedBlob(file);
    setPreviewUrl(URL.createObjectURL(file));
    stopStream();
  };

  // Already-captured state (from parent or just captured)
  if (previewUrl && !cameraActive) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border-2 border-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Captured"
            className="h-auto w-full object-cover"
          />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleRetake} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Retake
          </Button>
          {capturedBlob && (
            <Button
              onClick={handleUsePhoto}
              className="gap-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white border-none"
            >
              <Check className="h-4 w-4" />
              Use Photo
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Camera active state
  if (cameraActive) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border-2 border-gray-200 bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-auto w-full object-cover"
            style={facingMode === "user" ? { transform: "scaleX(-1)" } : {}}
          />
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <button
          onClick={captureFrame}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg transition-transform active:scale-95"
          aria-label="Capture photo"
        >
          <Camera className="h-7 w-7" />
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            stopStream();
          }}
          className="text-muted-foreground"
        >
          Cancel
        </Button>
      </div>
    );
  }

  // Initial state -- choose camera or upload
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full max-w-sm flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8">
        <Camera className="h-10 w-10 text-gray-400" />
        <p className="text-sm text-muted-foreground">{label}</p>
        <Button
          onClick={startCamera}
          disabled={!cameraSupported && permissionDenied}
          className="gap-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white border-none"
        >
          <Camera className="h-4 w-4" />
          Open Camera
        </Button>
        {permissionDenied && (
          <p className="text-xs text-red-500 text-center">
            Camera access was denied. Please allow camera permissions or upload a
            photo instead.
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-px w-8 bg-gray-300" />
          or
          <span className="h-px w-8 bg-gray-300" />
        </div>
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload from Gallery
        </Button>
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
