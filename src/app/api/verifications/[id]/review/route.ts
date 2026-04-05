import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = (session.user as any).tenantId;
    const { id } = params;
    const { action, notes } = await req.json();

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: 'action must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Verify the verification belongs to user's tenant
    const verification = await prisma.verification.findFirst({
      where: { id, tenantId },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "Verification not found" },
        { status: 404 }
      );
    }

    const status = action === "approve" ? "clear" : "flagged";

    const updated = await prisma.verification.update({
      where: { id },
      data: {
        status,
        reviewedBy: (session.user as any).id,
        reviewedAt: new Date(),
        reviewNotes: notes || null,
      },
    });

    return NextResponse.json({ success: true, status: updated.status });
  } catch (error) {
    console.error("Review error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
