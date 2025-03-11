import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params object before accessing its properties
    const resolvedParams = await params;
    const groupId = resolvedParams.id;
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        contacts: {
          include: {
            contact: true,
          },
        },
      },
    });
    
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    
    return NextResponse.json({ group });
  } catch (error) {
    console.error("Error fetching group:", error);
    return NextResponse.json(
      { error: "Failed to fetch group" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params object before accessing its properties
    const resolvedParams = await params;
    const groupId = resolvedParams.id;
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { name, description } = await request.json();
    
    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      );
    }
    
    // Check if group exists
    const existingGroup = await prisma.group.findUnique({
      where: { id: groupId },
    });
    
    if (!existingGroup) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    
    // Update group
    const group = await prisma.group.update({
      where: { id: groupId },
      data: { name, description },
    });
    
    return NextResponse.json({ group });
  } catch (error) {
    console.error("Error updating group:", error);
    return NextResponse.json(
      { error: "Failed to update group" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params object before accessing its properties
    const resolvedParams = await params;
    const groupId = resolvedParams.id;
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if group exists
    const existingGroup = await prisma.group.findUnique({
      where: { id: groupId },
    });
    
    if (!existingGroup) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    
    // Check if group is used in any campaigns
    const usedInCampaigns = await prisma.campaign.findFirst({
      where: { groupId: groupId },
    });
    
    if (usedInCampaigns) {
      return NextResponse.json(
        { error: "Group is used in campaigns and cannot be deleted" },
        { status: 400 }
      );
    }
    
    // Delete group (will cascade delete group contacts)
    await prisma.group.delete({
      where: { id: groupId },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting group:", error);
    return NextResponse.json(
      { error: "Failed to delete group" },
      { status: 500 }
    );
  }
}