// app/api/campaigns/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { scheduleCampaign, sendCampaignNow } from "@/lib/scheduler";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const campaigns = await prisma.campaign.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      template: true,
      group: true,
    },
  });
  
  return NextResponse.json({ campaigns });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { name, subject, senderEmail, templateId, groupId, apiKeyId, schedule, scheduledAt } = await request.json();
  
  // Validate required fields
  if (!name || !subject || !senderEmail || !templateId || !groupId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(senderEmail)) {
    return NextResponse.json(
      { error: "Invalid sender email format" },
      { status: 400 }
    );
  }
  
  // Get default API key if not specified
  let finalApiKeyId = apiKeyId;
  if (!finalApiKeyId) {
    const defaultApiKey = await prisma.apiKey.findFirst({
      where: {
        userId: session.user.id,
        type: "SMTP",
        isDefault: true,
      },
    });
    
    if (defaultApiKey) {
      finalApiKeyId = defaultApiKey.id;
    } else {
      return NextResponse.json(
        { error: "No API key specified and no default found" },
        { status: 400 }
      );
    }
  }
  
  // Create campaign
  const campaign = await prisma.campaign.create({
    data: {
      name,
      subject,
      senderEmail,
      templateId,
      groupId,
      apiKeyId: finalApiKeyId,
      userId: session.user.id,
      status: schedule ? "SCHEDULED" : "DRAFT",
      scheduledAt: schedule && scheduledAt ? new Date(scheduledAt) : null,
    },
  });
  
  // If scheduled for immediate sending
  if (schedule && !scheduledAt) {
    await sendCampaignNow(campaign.id);
  } else if (schedule && scheduledAt) {
    await scheduleCampaign(campaign.id, new Date(scheduledAt));
  }
  
  return NextResponse.json({ campaign });
}