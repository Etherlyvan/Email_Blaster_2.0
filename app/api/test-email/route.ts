// app/api/test-email/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendEmailWithBrevoSMTP } from "@/lib/brevo";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { to } = await request.json();
    
    if (!to) {
      return NextResponse.json(
        { error: "Recipient email is required" },
        { status: 400 }
      );
    }
    
    // Get the default SMTP API key
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        userId: session.user.id,
        type: "SMTP",
        isDefault: true,
      },
    });
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "No default SMTP configuration found" },
        { status: 400 }
      );
    }
    
    const result = await sendEmailWithBrevoSMTP(apiKey, {
      to,
      subject: "Test Email",
      html: "<h1>This is a test email</h1><p>If you received this, your SMTP configuration is working correctly.</p>",
      from: process.env.EMAIL_FROM || "your-sender@example.com",
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: `Failed to send test email: ${result.error}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Test email sent successfully",
      messageId: result.messageId
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { error: "Failed to send test email" },
      { status: 500 }
    );
  }
}