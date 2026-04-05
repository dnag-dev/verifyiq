import { NextRequest, NextResponse } from "next/server";

const PAN_REGEX = /[A-Z]{5}[0-9]{4}[A-Z]/;
const AADHAAR_REGEX = /\d{4}\s?\d{4}\s?\d{4}/;

async function performOcr(imageUrl: string, cardType: "aadhaar" | "pan") {
  const GOOGLE_CLOUD_API_KEY = process.env.GOOGLE_CLOUD_API_KEY;

  // Demo mode
  if (!GOOGLE_CLOUD_API_KEY) {
    return {
      extractedNumber: "DEMO12345X",
      rawText: "Demo OCR",
      confidence: 0.95,
    };
  }

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { source: { imageUri: imageUrl } },
            features: [{ type: "TEXT_DETECTION" }],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Google Vision API error: ${response.statusText}`);
  }

  const data = await response.json();
  const annotations = data.responses?.[0]?.textAnnotations;
  const rawText = annotations?.[0]?.description || "";
  const confidence = annotations?.[0]?.score || 0.8;

  const regex = cardType === "pan" ? PAN_REGEX : AADHAAR_REGEX;
  const match = rawText.match(regex);

  return {
    extractedNumber: match ? match[0] : null,
    rawText,
    confidence,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, cardType } = await req.json();

    if (!imageUrl || !cardType) {
      return NextResponse.json(
        { error: "imageUrl and cardType are required" },
        { status: 400 }
      );
    }

    if (cardType !== "aadhaar" && cardType !== "pan") {
      return NextResponse.json(
        { error: 'cardType must be "aadhaar" or "pan"' },
        { status: 400 }
      );
    }

    const result = await performOcr(imageUrl, cardType);
    return NextResponse.json(result);
  } catch (error) {
    console.error("OCR error:", error);
    return NextResponse.json(
      { error: "Failed to perform OCR" },
      { status: 500 }
    );
  }
}
