// app/api/settings/keys/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const apiKeys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  
  return NextResponse.json({ apiKeys });
}

export async function POST(request: Request) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    
    // Log the session for debugging
    console.log("Session:", JSON.stringify(session, null, 2));
    
    // Check if user is authenticated and has an ID
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse the request body
    const body = await request.json();
    const { name, type, key, host, port, username, password, isDefault } = body;
    
    // Log the request data for debugging
    console.log("Request data:", { name, type, key, host, port, username, isDefault });
    
    // Validate required fields based on type
    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 }
      );
    }
    
    if (type === "API" && !key) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }
    
    if (type === "SMTP" && (!host || !port || !username || !password)) {
      return NextResponse.json(
        { error: "SMTP configuration requires host, port, username, and password" },
        { status: 400 }
      );
    }
    
    // If setting as default, unset previous default
    if (isDefault) {
      await prisma.apiKey.updateMany({
        where: { 
          userId: session.user.id,
          type,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }
    
    // Verify the user exists in the database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }
    
    // Create new API key or SMTP configuration with correctly formatted data object
    const apiKey = await prisma.apiKey.create({
      data: {
        name: name,
        type: type,
        key: type === "API" ? key : null,
        host: type === "SMTP" ? host : null,
        port: type === "SMTP" && port ? parseInt(port.toString()) : null,
        username: type === "SMTP" ? username : null,
        password: type === "SMTP" ? password : null,
        isDefault: isDefault || false,
        userId: session.user.id
      }
    });
    
    return NextResponse.json({ apiKey });
  } catch (error) {
    console.error("Error creating API key:", error);
    
    // Return a more detailed error response
    return NextResponse.json(
      { 
        error: "Failed to create API key or SMTP configuration",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}