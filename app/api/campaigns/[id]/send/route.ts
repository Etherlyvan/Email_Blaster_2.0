// app/api/campaigns/[id]/send/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendCampaignNow } from "@/lib/scheduler";

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Store id in a local variable to avoid directly accessing params.id
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
    
    // Check if campaign is in a valid state to send
    if (campaign.status !== "DRAFT" && campaign.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: `Campaign is already ${campaign.status.toLowerCase()}` },
        { status: 400 }
      );
    }
    
    try {
      // Send the campaign
      await sendCampaignNow(campaignId);
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error sending campaign:", error);
      return NextResponse.json(
        { error: "Failed to send campaign" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}