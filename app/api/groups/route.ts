import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const groups = await prisma.group.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { contacts: true }
      }
    },
  });
  
  return NextResponse.json({ groups });
}

export async function POST(request: Request) {
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
  
  // Create group
  const group = await prisma.group.create({
    data: { 
      name, 
      description 
    },
  });
  
  return NextResponse.json({ group });
}