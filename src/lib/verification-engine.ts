import { prisma } from "./prisma";

interface VerificationSubject {
  subjectName: string;
  panNumber?: string;
  aadhaarNumber?: string;
  linkedinUrl?: string;
  phone?: string;
  city?: string;
}

export async function runVerification(verificationId: string) {
  const verification = await prisma.verification.findUnique({
    where: { id: verificationId },
    include: { tenant: true },
  });

  if (!verification) throw new Error("Verification not found");

  await prisma.verification.update({
    where: { id: verificationId },
    data: { status: "processing" },
  });

  const checks = [];

  // Create check records
  const panCheck = await prisma.verificationCheck.create({
    data: { verificationId, checkType: "pan_verification", status: "pending" },
  });
  checks.push(panCheck);

  const serpCheck = await prisma.verificationCheck.create({
    data: { verificationId, checkType: "internet_sweep", status: "pending" },
  });
  checks.push(serpCheck);

  const linkedinCheck = await prisma.verificationCheck.create({
    data: { verificationId, checkType: "linkedin_check", status: "pending" },
  });
  checks.push(linkedinCheck);

  const fieldCheck = await prisma.verificationCheck.create({
    data: { verificationId, checkType: "field_completeness", status: "pending" },
  });
  checks.push(fieldCheck);

  // Run all checks
  const [panResult, serpResult, linkedinResult, fieldResult] = await Promise.allSettled([
    runPanCheck(panCheck.id, verification.panNumber),
    runInternetSweep(serpCheck.id, verification.subjectName),
    runLinkedInCheck(linkedinCheck.id, verification.linkedinUrl),
    runFieldCompleteness(fieldCheck.id, verification),
  ]);

  // Calculate risk score
  let riskScore = 10;

  const panStatus = panResult.status === "fulfilled" ? panResult.value : "error";
  if (panStatus === "failed" || panStatus === "error") riskScore -= 3;

  const serpStatus = serpResult.status === "fulfilled" ? serpResult.value : "error";
  if (serpStatus === "red_flags") riskScore -= 4;

  const linkedinStatus = linkedinResult.status === "fulfilled" ? linkedinResult.value : "error";
  if (linkedinStatus === "not_found") riskScore -= 2;

  const fieldStatus = fieldResult.status === "fulfilled" ? fieldResult.value : "error";
  if (fieldStatus === "incomplete") riskScore -= 1;

  riskScore = Math.max(0, riskScore);

  const status = riskScore >= 7 ? "clear" : riskScore >= 4 ? "review" : "flagged";

  // Fetch all check results
  const completedChecks = await prisma.verificationCheck.findMany({
    where: { verificationId },
  });

  const results = {
    riskScore,
    status,
    checks: completedChecks.map((c) => ({
      type: c.checkType,
      status: c.status,
      details: c.rawResponse,
    })),
  };

  // Update verification
  await prisma.verification.update({
    where: { id: verificationId },
    data: {
      status,
      riskScore,
      results,
      completedAt: new Date(),
    },
  });

  // Send webhook callback
  const callbackUrl = verification.callbackUrl || verification.tenant.webhookUrl;
  if (callbackUrl) {
    try {
      await fetch(callbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationId,
          subjectName: verification.subjectName,
          status,
          riskScore,
          results: results.checks,
          completedAt: new Date().toISOString(),
        }),
      });
    } catch (e) {
      console.error("Webhook callback failed:", e);
    }
  }

  return results;
}

async function runPanCheck(checkId: string, panNumber?: string | null): Promise<string> {
  if (!panNumber) {
    await prisma.verificationCheck.update({
      where: { id: checkId },
      data: { status: "skipped", rawResponse: { reason: "No PAN number provided" } },
    });
    return "skipped";
  }

  try {
    const apiKey = process.env.IDFY_API_KEY;
    const baseUrl = process.env.IDFY_BASE_URL || "https://eve.idfy.com/v3/tasks";

    if (!apiKey || apiKey === "your_idfy_api_key_here") {
      // Demo mode - simulate PAN check
      const isValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber);
      await prisma.verificationCheck.update({
        where: { id: checkId },
        data: {
          status: isValid ? "passed" : "failed",
          rawResponse: { demo: true, valid: isValid, panNumber },
        },
      });
      return isValid ? "passed" : "failed";
    }

    const accountId = process.env.IDFY_ACCOUNT_ID;
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
        ...(accountId ? { "account-id": accountId } : {}),
      },
      body: JSON.stringify({
        task_id: "74f4c926-250c-43ca-9c53-453e87ceacd1",
        group_id: "8e16424a-58fc-4ba4-ab20-5bc8e7c3c41e",
        data: { id_number: panNumber },
      }),
    });

    const data = await response.json();
    const passed = data?.result?.source_output?.status === "id_found";

    await prisma.verificationCheck.update({
      where: { id: checkId },
      data: {
        status: passed ? "passed" : "failed",
        rawResponse: data,
      },
    });

    return passed ? "passed" : "failed";
  } catch (error: any) {
    await prisma.verificationCheck.update({
      where: { id: checkId },
      data: { status: "error", rawResponse: { error: error.message } },
    });
    return "error";
  }
}

async function runInternetSweep(checkId: string, subjectName: string): Promise<string> {
  try {
    const apiKey = process.env.SERPAPI_KEY;

    if (!apiKey || apiKey === "your_serpapi_key") {
      // Demo mode
      await prisma.verificationCheck.update({
        where: { id: checkId },
        data: {
          status: "passed",
          rawResponse: { demo: true, query: subjectName, redFlags: [], resultCount: 0 },
        },
      });
      return "clean";
    }

    const query = `${subjectName} complaint fraud arrested case license`;
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${apiKey}&num=10`;

    const response = await fetch(url);
    const data = await response.json();

    const redFlagKeywords = ["fraud", "arrested", "complaint", "case", "scam", "criminal", "charge"];
    const results = data.organic_results || [];
    const redFlags = results.filter((r: any) => {
      const text = `${r.title} ${r.snippet}`.toLowerCase();
      return redFlagKeywords.some((kw) => text.includes(kw));
    });

    const hasRedFlags = redFlags.length > 0;

    await prisma.verificationCheck.update({
      where: { id: checkId },
      data: {
        status: hasRedFlags ? "flagged" : "passed",
        rawResponse: {
          query,
          totalResults: results.length,
          redFlagCount: redFlags.length,
          redFlags: redFlags.map((r: any) => ({ title: r.title, snippet: r.snippet, link: r.link })),
        },
      },
    });

    return hasRedFlags ? "red_flags" : "clean";
  } catch (error: any) {
    await prisma.verificationCheck.update({
      where: { id: checkId },
      data: { status: "error", rawResponse: { error: error.message } },
    });
    return "error";
  }
}

async function runLinkedInCheck(checkId: string, linkedinUrl?: string | null): Promise<string> {
  if (!linkedinUrl) {
    await prisma.verificationCheck.update({
      where: { id: checkId },
      data: { status: "not_found", rawResponse: { reason: "No LinkedIn URL provided" } },
    });
    return "not_found";
  }

  try {
    const response = await fetch(linkedinUrl, {
      method: "HEAD",
      redirect: "follow",
    });

    const exists = response.status === 200 || response.status === 999; // LinkedIn returns 999 for bot detection

    await prisma.verificationCheck.update({
      where: { id: checkId },
      data: {
        status: exists ? "passed" : "not_found",
        rawResponse: { url: linkedinUrl, httpStatus: response.status, exists },
      },
    });

    return exists ? "found" : "not_found";
  } catch (error: any) {
    // If fetch fails, URL likely doesn't exist or is malformed
    await prisma.verificationCheck.update({
      where: { id: checkId },
      data: {
        status: "passed", // Give benefit of doubt on network errors
        rawResponse: { url: linkedinUrl, error: error.message, assumed: true },
      },
    });
    return "found";
  }
}

async function runFieldCompleteness(checkId: string, verification: any): Promise<string> {
  const fields = ["subjectName", "panNumber", "aadhaarNumber", "linkedinUrl", "phone", "city"];
  const filled = fields.filter((f) => verification[f] && String(verification[f]).trim() !== "");
  const score = Math.round((filled.length / fields.length) * 100);
  const isComplete = score >= 80;

  await prisma.verificationCheck.update({
    where: { id: checkId },
    data: {
      status: isComplete ? "passed" : "incomplete",
      rawResponse: {
        totalFields: fields.length,
        filledFields: filled.length,
        missingFields: fields.filter((f) => !filled.includes(f)),
        completenessScore: score,
      },
    },
  });

  return isComplete ? "complete" : "incomplete";
}
