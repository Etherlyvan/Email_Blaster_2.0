import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const template = await prisma.template.findUnique({
    where: { id: params.id },
  });
  
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }
  
  return NextResponse.json({ template });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { name, content } = await request.json();
  
  // Validate required fields
  if (!name || !content) {
    return NextResponse.json(
      { error: "Name and content are required" },
      { status: 400 }
    );
  }
  
  // Check if template exists
  const existingTemplate = await prisma.template.findUnique({
    where: { id: params.id },
  });
  
  if (!existingTemplate) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }
  
  // Update template
  const template = await prisma.template.update({
    where: { id: params.id },
    data: { name, content },
  });
  
  return NextResponse.json({ template });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Check if template exists
  const existingTemplate = await prisma.template.findUnique({
    where: { id: params.id },
  });
  
  if (!existingTemplate) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }
  
  // Check if template is used in any campaigns
  const usedInCampaigns = await prisma.campaign.findFirst({
    where: { templateId: params.id },
  });
  
  if (usedInCampaigns) {
    return NextResponse.json(
      { error: "Template is used in campaigns and cannot be deleted" },
      { status: 400 }
    );
  }
  
  // Delete template
  await prisma.template.delete({
    where: { id: params.id },
  });
  
  return NextResponse.json({ success: true });
}