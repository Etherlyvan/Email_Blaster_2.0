import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const templates = await prisma.template.findMany({
    orderBy: { createdAt: "desc" },
  });
  
  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
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
  
  // Create template
  const template = await prisma.template.create({
    data: { name, content },
  });
  
  return NextResponse.json({ template });
}