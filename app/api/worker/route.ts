// app/api/worker/route.ts
import { NextResponse } from "next/server";
import { connectRabbitMQ } from "@/lib/rabbitmq";
import { prisma } from "@/lib/db";
import { sendEmailWithBrevoSMTP } from "@/lib/brevo";

// This endpoint will be called by a scheduler (like Vercel Cron) to process emails
export async function POST() {
  try {
    // Try to connect to RabbitMQ, but proceed even if it fails
    await connectRabbitMQ();
    
    // Process scheduled campaigns
    const scheduledCampaigns = await prisma.campaign.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: {
          lte: new Date(),
        },
      },
    });
    
    for (const campaign of scheduledCampaigns) {
      // Update status to SENDING
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: "SENDING" },
      });
      
      // Get campaign details with contacts
      const campaignDetails = await prisma.campaign.findUnique({
        where: { id: campaign.id },
        include: {
          template: true,
          group: {
            include: {
              contacts: {
                include: {
                  contact: true,
                },
              },
            },
          },
        },
      });
      
      if (!campaignDetails) continue;
      
      // Get API key
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: campaignDetails.apiKeyId ?? undefined },
      });
      
      if (!apiKey) {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: "FAILED" },
        });
        continue;
      }
      
      // Validate SMTP configuration
      if (apiKey.type === "SMTP" && (!apiKey.host || !apiKey.port || !apiKey.username || !apiKey.password)) {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: "FAILED" },
        });
        continue;
      }
      
      // Process each contact
      const contacts = campaignDetails.group.contacts.map(gc => gc.contact);
      let successCount = 0;
      let failureCount = 0;
      
      for (const contact of contacts) {
        // Create log entry
        const log = await prisma.emailLog.create({
          data: {
            campaignId: campaign.id,
            contactEmail: contact.email,
            status: "QUEUED",
            sentAt: new Date(),
          },
        });
        
        // Personalize content
        const personalizedHtml = campaignDetails.template.content
          .replace(/{{firstName}}/g, contact.firstName ?? '')
          .replace(/{{lastName}}/g, contact.lastName ?? '')
          .replace(/{{email}}/g, contact.email);
        
        // Send email directly (for Vercel Hobby plan which doesn't support background tasks)
        try {
          // app/api/worker/route.ts
            // Update the email sending part to use the campaign's sender email
            const result = await sendEmailWithBrevoSMTP(apiKey, {
              to: contact.email,
              subject: campaignDetails.subject,
              html: personalizedHtml,
              from: campaignDetails.senderEmail, // Use the campaign's sender email
            });
          
          // Update log
          await prisma.emailLog.update({
            where: { id: log.id },
            data: {
              status: result.success ? "SENT" : "FAILED",
              messageId: result.messageId,
              updatedAt: new Date(),
            },
          });
          
          if (result.success) {
            successCount++;
          } else {
            failureCount++;
          }
        } catch (err) {
          // Update log on error
          console.error(`Error sending email to ${contact.email}:`, err);
          await prisma.emailLog.update({
            where: { id: log.id },
            data: {
              status: "FAILED",
              updatedAt: new Date(),
            },
          });
          failureCount++;
        }
      }
      
      // Update campaign status
      const finalStatus = failureCount === contacts.length ? "FAILED" : 
                         successCount > 0 ? "COMPLETED" : "FAILED";
      
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: finalStatus, sentAt: new Date() },
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Worker error:", err);
    return NextResponse.json(
      { error: "Worker execution failed" },
      { status: 500 }
    );
  }
}