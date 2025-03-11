// app/api/campaigns/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { scheduleCampaign } from "@/lib/scheduler";

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Store id in a local variable
    const campaignId = context.params.id;
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { name, subject, senderEmail, scheduledAt } = await request.json();
    
    // Check if campaign exists and belongs to the user
    const campaign = await prisma.campaign.findFirst({
      where: { 
        id: campaignId,
        userId: session.user.id,
      },
    });
    
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }
    
    // Check if campaign is in a valid state to update
    if (campaign.status !== "DRAFT" && campaign.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: `Campaign is ${campaign.status.toLowerCase()} and cannot be updated` },
        { status: 400 }
      );
    }
    
    // Validate sender email if provided
    if (senderEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(senderEmail)) {
        return NextResponse.json(
          { error: "Invalid sender email format" },
          { status: 400 }
        );
      }
    }
    
    // Update campaign
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: { 
        name,
        subject,
        senderEmail,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: scheduledAt ? "SCHEDULED" : "DRAFT",
      },
    });
    
    // If scheduled time is set, update the scheduler
    if (scheduledAt) {
      await scheduleCampaign(campaignId, new Date(scheduledAt));
    }
    
    return NextResponse.json({ campaign: updatedCampaign });
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}

// Rest of the file remains unchanged

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const campaignId = context.params.id;
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const campaign = await prisma.campaign.findFirst({
      where: { 
        id: campaignId,
        userId: session.user.id,
      },
      include: {
        template: true,
        group: true,
      },
    });
    
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }
    
    // Get email logs
    const logs = await prisma.emailLog.findMany({
      where: { campaignId: campaignId },
      orderBy: { sentAt: "desc" },
    });
    
    return NextResponse.json({ campaign, logs });
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const campaignId = context.params.id;
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if campaign exists and belongs to the user
    const campaign = await prisma.campaign.findFirst({
      where: { 
        id: campaignId,
        userId: session.user.id,
      },
    });
    
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }
    
    // Check if campaign can be deleted (only drafts or scheduled campaigns)
    if (campaign.status !== "DRAFT" && campaign.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: `Campaign is ${campaign.status.toLowerCase()} and cannot be deleted` },
        { status: 400 }
      );
    }
    
    // Delete campaign logs first
    await prisma.emailLog.deleteMany({
      where: { campaignId: campaignId },
    });
    
    // Delete campaign
    await prisma.campaign.delete({
      where: { id: campaignId },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json(
      { error: "Failed to delete campaign" },
      { status: 500 }
    );
  }
}