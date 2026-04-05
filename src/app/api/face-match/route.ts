import { NextRequest, NextResponse } from "next/server";
import {
  RekognitionClient,
  CompareFacesCommand,
} from "@aws-sdk/client-rekognition";

async function performFaceMatch(sourceUrl: string, targetUrl: string) {
  // Demo mode
  if (!process.env.AWS_ACCESS_KEY_ID) {
    return { similarity: 85, matched: true };
  }

  const [sourceResponse, targetResponse] = await Promise.all([
    fetch(sourceUrl),
    fetch(targetUrl),
  ]);

  if (!sourceResponse.ok || !targetResponse.ok) {
    throw new Error("Failed to download one or both images");
  }

  const [sourceBuffer, targetBuffer] = await Promise.all([
    sourceResponse.arrayBuffer().then((ab) => new Uint8Array(ab)),
    targetResponse.arrayBuffer().then((ab) => new Uint8Array(ab)),
  ]);

  const client = new RekognitionClient({
    region: process.env.AWS_REGION || "us-east-1",
  });

  const result = await client.send(
    new CompareFacesCommand({
      SourceImage: { Bytes: sourceBuffer },
      TargetImage: { Bytes: targetBuffer },
      SimilarityThreshold: 0,
    })
  );

  const similarity = result.FaceMatches?.[0]?.Similarity || 0;

  return {
    similarity,
    matched: similarity >= 80,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { sourceUrl, targetUrl } = await req.json();

    if (!sourceUrl || !targetUrl) {
      return NextResponse.json(
        { error: "sourceUrl and targetUrl are required" },
        { status: 400 }
      );
    }

    const result = await performFaceMatch(sourceUrl, targetUrl);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Face match error:", error);
    return NextResponse.json(
      { error: "Failed to perform face match" },
      { status: 500 }
    );
  }
}
