import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = (session.user as any).tenantId;
  const { id } = params;

  const verification = await prisma.verification.findFirst({
    where: { id, tenantId },
    include: {
      checks: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!verification) {
    return NextResponse.json({ error: "Verification not found" }, { status: 404 });
  }

  return NextResponse.json(verification);
}
