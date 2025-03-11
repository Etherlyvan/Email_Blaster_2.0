import { prisma } from './db';
import { 
  connectRabbitMQ, 
  publishEmailTask, 
  consumeEmailResults, 
  EmailQueueMessage,
  EmailResultMessage 
} from './rabbitmq';
import { sendEmailWithBrevoSMTP } from './brevo';

// Interface for internal message processing that extends EmailResultMessage
interface ProcessableEmailMessage extends EmailResultMessage {
  senderEmail: string;
  // Additional fields needed for email processing
  apiKeyId: string;
  to: string;
  subject: string;
  html: string;
  from: string;
}

export async function startEmailWorker(): Promise<void> {
  await connectRabbitMQ();
  
  await consumeEmailResults(async (result: EmailResultMessage) => {
    // Update email log with results
    if (result.campaignId && result.contactEmail) {
      await prisma.emailLog.update({
        where: {
          id: result.logId,
        },
        data: {
          status: result.success ? 'SENT' : 'FAILED',
          messageId: result.messageId,
          updatedAt: new Date(),
        },
      });
      
      // If campaign is completed, update campaign status
      if (result.campaignCompleted) {
        await prisma.campaign.update({
          where: { id: result.campaignId },
          data: { status: 'COMPLETED', sentAt: new Date() },
        });
      }
    }
  });
}

export async function processCampaign(campaignId: string): Promise<void> {
  const campaign = await prisma.campaign.findUnique({
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

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  // Get the API key to use
  const apiKey = await prisma.apiKey.findFirst({
    where: {
      id: campaign.apiKeyId ?? undefined,
      userId: campaign.userId,
      type: 'SMTP',
    },
  });

  if (!apiKey) {
    throw new Error('No valid API key found for this campaign');
  }

  // Update campaign status to SENDING
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: 'SENDING' },
  });

  // Get all contacts from the group
  const contacts = campaign.group.contacts.map(gc => gc.contact);
  
  // For each contact, create a log entry and queue email task
  for (const contact of contacts) {
    // Create email log entry and use the result directly
    const logEntry = await prisma.emailLog.create({
      data: {
        campaignId,
        contactEmail: contact.email,
        status: 'QUEUED',
        sentAt: new Date(),
      },
    });

    // Prepare personalized email content
    const personalizedHtml = campaign.template.content
      .replace(/{{firstName}}/g, contact.firstName ?? '')
      .replace(/{{lastName}}/g, contact.lastName ?? '')
      .replace(/{{email}}/g, contact.email);

    // Queue the email task
    const message: EmailQueueMessage = {
      campaignId,
      to: contact.email,
      subject: campaign.subject,
      html: personalizedHtml,
      from: 'your-sender@example.com', // You should configure this
      apiKeyId: apiKey.id,
    };

    // Include the log ID in the message for tracking
    const messageWithLogId = {
      ...message,
      logId: logEntry.id
    };

    await publishEmailTask(messageWithLogId);
  }
}

// This function would run in a separate worker process
export async function processEmailQueue(): Promise<void> {
  await connectRabbitMQ();
  
  // Using a more specific type for email processing
  await consumeEmailResults(async (result) => {
    try {
      // Since we need additional fields that aren't in EmailResultMessage,
      // we need to check if we're dealing with a ProcessableEmailMessage
      if (!('apiKeyId' in result) || !('subject' in result) || 
          !('html' in result) || !('from' in result)) {
        throw new Error('Received incomplete email message data');
      }
      
      const emailData = result as unknown as ProcessableEmailMessage;
      
      // Get the API key
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: emailData.apiKeyId },
      });

      if (!apiKey) {
        throw new Error('API key not found');
      }

      // Send the email
      // lib/email-worker.ts
      // Update the worker to use the campaign's sender email
        const emailResult = await sendEmailWithBrevoSMTP(apiKey, {
          to: emailData.to || emailData.contactEmail,
          subject: emailData.subject,
          html: emailData.html,
          from: emailData.senderEmail, // Use the campaign's sender email
        });

      // Update the log with the result
      await prisma.emailLog.update({
        where: { id: result.logId },
        data: {
          status: emailResult.success ? 'SENT' : 'FAILED',
          messageId: emailResult.messageId,
          updatedAt: new Date(),
        },
      });

      // Check if all emails for this campaign are sent
      const pendingEmails = await prisma.emailLog.count({
        where: {
          campaignId: result.campaignId,
          status: { notIn: ['SENT', 'FAILED'] },
        },
      });

      if (pendingEmails === 0) {
        // All emails processed, update campaign status
        await prisma.campaign.update({
          where: { id: result.campaignId },
          data: { status: 'COMPLETED', sentAt: new Date() },
        });
      }
    } catch (error) {
      console.error('Error processing email:', error);
      
      // Update log with error
      if (result.logId) {
        await prisma.emailLog.update({
          where: { id: result.logId },
          data: {
            status: 'FAILED',
            updatedAt: new Date(),
          },
        });
      }
    }
  });
}