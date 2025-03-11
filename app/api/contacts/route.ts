import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const contacts = await prisma.contact.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      groups: {
        include: {
          group: true,
        },
      },
    },
  });
  
  return NextResponse.json({ contacts });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { email, firstName, lastName, groupIds } = await request.json();
  
  // Validate required fields
  if (!email) {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 }
    );
  }
  
  // Check if contact already exists
  const existingContact = await prisma.contact.findFirst({
    where: { email },
  });
  
  let contact;
  
  if (existingContact) {
    // Update existing contact
    contact = await prisma.contact.update({
      where: { id: existingContact.id },
      data: { firstName, lastName },
    });
  } else {
    // Create new contact
    contact = await prisma.contact.create({
      data: { email, firstName, lastName },
    });
  }
  
  // Add to groups if specified
  if (groupIds && groupIds.length > 0) {
    const groupContacts = groupIds.map((groupId: string) => ({
      groupId,
      contactId: contact.id,
    }));
    
    await prisma.groupContact.createMany({
      data: groupContacts,
      skipDuplicates: true,
    });
  }
  
  return NextResponse.json({ contact });
}