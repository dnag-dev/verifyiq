import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Demo mode: no Vercel Blob token configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const mimeType = file.type || "image/png";
      const dataUrl = `data:${mimeType};base64,${base64}`;
      return NextResponse.json({ url: dataUrl });
    }

    const blob = await put(
      `verifications/${Date.now()}-${file.name}`,
      file,
      { access: "public" }
    );

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
