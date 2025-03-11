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
    
    const groupContacts = await prisma.groupContact.findMany({
      where: { groupId: groupId },
      include: {
        contact: true,
      },
      orderBy: {
        contact: {
          email: "asc",
        },
      },
    });
    
    return NextResponse.json({ contacts: groupContacts.map(gc => gc.contact) });
  } catch (error) {
    console.error("Error fetching group contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

export async function POST(
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
    
    const { contactIds } = await request.json();
    
    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json(
        { error: "No contact IDs provided" },
        { status: 400 }
      );
    }
    
    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });
    
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    
    // Add contacts to group
    const groupContacts = contactIds.map(contactId => ({
      groupId: groupId,
      contactId,
    }));
    
    await prisma.groupContact.createMany({
      data: groupContacts,
      skipDuplicates: true,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding contacts to group:", error);
    return NextResponse.json(
      { error: "Failed to add contacts to group" },
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
    
    const { contactIds } = await request.json();
    
    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json(
        { error: "No contact IDs provided" },
        { status: 400 }
      );
    }
    
    // Remove contacts from group
    await prisma.groupContact.deleteMany({
      where: {
        groupId: groupId,
        contactId: {
          in: contactIds,
        },
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing contacts from group:", error);
    return NextResponse.json(
      { error: "Failed to remove contacts from group" },
      { status: 500 }
    );
  }
}