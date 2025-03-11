// lib/scheduler.ts
import { prisma } from "./db";
import { sendEmailWithBrevoSMTP } from "./brevo";

// Function to schedule a campaign for later sending
export async function scheduleCampaign(campaignId: string, scheduledTime: Date): Promise<void> {
  console.log(`Scheduling campaign ${campaignId} for ${scheduledTime.toISOString()}`);
  
  try {
    // Update the campaign with scheduled status and time
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'SCHEDULED',
        scheduledAt: scheduledTime,
      },
    });
    
    console.log(`Campaign ${campaignId} scheduled successfully`);
    
    // Note: In a production environment, you would typically use a cron job,
    // a scheduler like node-schedule, or a task queue like Bull to handle the actual scheduling.
    // For simplicity, we're just updating the database record here.
    
    // If you want to implement actual scheduling logic, you could use setTimeout for development:
    /*
    const now = new Date();
    const delay = scheduledTime.getTime() - now.getTime();
    
    // Only schedule if the time is in the future
    if (delay > 0) {
      console.log(`Setting timeout for ${delay}ms`);
      setTimeout(() => {
        sendCampaignNow(campaignId)
          .catch(err => console.error(`Error sending scheduled campaign ${campaignId}:`, err));
      }, delay);
    } else {
      console.log(`Scheduled time is in the past, not setting timeout`);
    }
    */
    
    // In production, you would register this with a proper scheduler service
  } catch (error) {
    console.error(`Error scheduling campaign ${campaignId}:`, error);
    throw error;
  }
}

export async function sendCampaignNow(campaignId: string): Promise<void> {
  try {
    console.log(`Starting to send campaign: ${campaignId}`);
    
    // Update campaign status to SENDING
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'SENDING' },
    });
    
    // Get campaign details with contacts
    const campaignDetails = await prisma.campaign.findUnique({
      where: { id: campaignId },
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
    
    if (!campaignDetails) {
      throw new Error('Campaign not found');
    }
    
    // Get the API key to use
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: campaignDetails.apiKeyId ?? undefined,
        userId: campaignDetails.userId,
        type: 'SMTP',
      },
    });
    
    if (!apiKey) {
      console.error("No valid API key found for campaign:", campaignId);
      throw new Error('No valid API key found for this campaign');
    }
    
    console.log(`Using SMTP config: ${apiKey.host}:${apiKey.port} with username: ${apiKey.username}`);
    
    // Get all contacts from the group
    const contacts = campaignDetails.group.contacts.map(gc => gc.contact);
    
    console.log(`Sending to ${contacts.length} contacts`);
    
    if (contacts.length === 0) {
      console.warn("No contacts found in the group for this campaign");
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'COMPLETED', sentAt: new Date() },
      });
      return;
    }
    
    let successCount = 0;
    let failureCount = 0;
    
    // For each contact, send email directly
    for (const contact of contacts) {
      console.log(`Processing email for: ${contact.email}`);
      
      // Create email log entry
      const logEntry = await prisma.emailLog.create({
        data: {
          campaignId,
          contactEmail: contact.email,
          status: 'QUEUED',
          sentAt: new Date(),
        },
      });
      
      // Prepare personalized email content
      const personalizedHtml = campaignDetails.template.content
        .replace(/{{firstName}}/g, contact.firstName ?? '')
        .replace(/{{lastName}}/g, contact.lastName ?? '')
        .replace(/{{email}}/g, contact.email);
      
      // Send email directly using the campaign's sender email
      try {
        // Use the campaign's sender email
        const fromEmail = campaignDetails.senderEmail;
        
        console.log(`Sending email from: ${fromEmail} to: ${contact.email}`);
        
        const result = await sendEmailWithBrevoSMTP(apiKey, {
          to: contact.email,
          subject: campaignDetails.subject,
          html: personalizedHtml,
          from: fromEmail,
        });
        
        console.log(`Email send result: ${JSON.stringify(result)}`);
        
        // Update log
        await prisma.emailLog.update({
          where: { id: logEntry.id },
          data: {
            status: result.success ? 'SENT' : 'FAILED',
            messageId: result.messageId,
            updatedAt: new Date(),
          },
        });
        
        if (result.success) {
          successCount++;
        } else {
          failureCount++;
          console.error(`Failed to send email: ${result.error}`);
        }
      } catch (error) {
        console.error(`Error sending email to ${contact.email}:`, error);
        
        // Update log with failure
        await prisma.emailLog.update({
          where: { id: logEntry.id },
          data: {
            status: 'FAILED',
            updatedAt: new Date(),
          },
        });
        
        failureCount++;
      }
    }
    
    console.log(`Campaign complete. Success: ${successCount}, Failures: ${failureCount}`);
    
    // Update campaign status based on results
    if (failureCount === contacts.length) {
      // All emails failed
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'FAILED', sentAt: new Date() },
      });
    } else if (successCount > 0) {
      // At least some emails were sent
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'COMPLETED', sentAt: new Date() },
      });
    }
  } catch (error) {
    console.error('Error processing campaign:', error);
    
    // Update campaign as failed
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'FAILED' },
    });
    
    throw error;
  }
}