import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = (session.user as any).tenantId;
    const { verificationId } = await req.json();

    if (!verificationId) {
      return NextResponse.json(
        { error: "verificationId is required" },
        { status: 400 }
      );
    }

    const verification = await prisma.verification.findFirst({
      where: { id: verificationId, tenantId },
      include: { tenant: true },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "Verification not found" },
        { status: 404 }
      );
    }

    // Generate token
    const token = crypto.randomUUID();
    const tokenExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    await prisma.verification.update({
      where: { id: verificationId },
      data: { verifyToken: token, tokenExpiresAt },
    });

    const link = `${process.env.NEXTAUTH_URL}/verify-me/${token}`;
    const companyName = verification.tenant?.companyName || "VerifyIQ";
    const candidateName = verification.subjectName || "Candidate";

    let emailSent = false;

    // Demo mode: skip email if SMTP not configured
    if (process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: verification.candidateEmail!,
        subject: `Complete your background verification - ${companyName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <h2 style="color: #2563eb;">Background Verification Request</h2>
            <p>Hello ${candidateName},</p>
            <p><strong>${companyName}</strong> has requested a background verification as part of their onboarding process.</p>
            <p>Please click the button below to complete your verification. You will need to:</p>
            <ul>
              <li>Take a selfie for identity verification</li>
              <li>Upload your Aadhaar card</li>
              <li>Upload your PAN card</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${link}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">
                Complete Verification
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">This link will expire in 48 hours. If you have any questions, please contact ${companyName} directly.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">This email was sent by VerifyIQ on behalf of ${companyName}.</p>
          </body>
          </html>
        `,
      });

      emailSent = true;
    }

    return NextResponse.json({
      success: true,
      link,
      emailSent,
    });
  } catch (error) {
    console.error("Send verification link error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
