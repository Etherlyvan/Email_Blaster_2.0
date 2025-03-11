import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const subject = formData.get("subject") as string;
    const templateId = formData.get("templateId") as string;
    const groupId = formData.get("groupId") as string;
    const apiKeyId = formData.get("apiKeyId") as string;

    if (!id || !name || !subject || !templateId || !groupId) {
      return NextResponse.json(
        { error: "Required fields are missing" },
        { status: 400 }
      );
    }

    // Check if the campaign exists and belongs to the user
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!existingCampaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Update the campaign
    await prisma.campaign.update({
      where: { id },
      data: {
        name,
        subject,
        templateId,
        groupId,
        apiKeyId: apiKeyId || null,
      },
    });

    // Redirect to the campaign detail page
    return NextResponse.redirect(new URL(`/campaigns/${id}`, request.url));
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}