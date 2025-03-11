// app/api/settings/test-smtp/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const { host, port, username, password } = await request.json();
    
    // Validate required fields
    if (!host || !port || !username || !password) {
      return NextResponse.json(
        { error: "All SMTP fields are required" },
        { status: 400 }
      );
    }
    
    // Create a test transporter
    const transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465, // true for 465, false for other ports
      auth: {
        user: username,
        pass: password,
      },
    });
    
    // Verify connection configuration
    await transporter.verify();
    
    return NextResponse.json({ 
      success: true, 
      message: "SMTP connection successful" 
    });
  } catch (error) {
    console.error('SMTP verification error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to verify SMTP connection", 
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}