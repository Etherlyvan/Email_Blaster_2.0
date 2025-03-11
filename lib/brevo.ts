// lib/brevo.ts
import nodemailer from 'nodemailer';
import { ApiKey } from '@prisma/client';

export type BrevoMailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  from: string;
  replyTo?: string;
};

export async function sendEmailWithBrevoSMTP(
  apiKey: ApiKey,
  options: BrevoMailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Validate SMTP configuration
    if (!apiKey.host || !apiKey.port || !apiKey.username || !apiKey.password) {
      console.error('Incomplete SMTP configuration:', { 
        host: apiKey.host, 
        port: apiKey.port,
        username: apiKey.username,
        // Don't log the password for security reasons
        hasPassword: !!apiKey.password
      });
      throw new Error('Incomplete SMTP configuration');
    }
    
    console.log(`Creating transporter for ${apiKey.host}:${apiKey.port}`);
    
    const transporter = nodemailer.createTransport({
      host: apiKey.host,
      port: apiKey.port,
      secure: apiKey.port === 465, // true for 465, false for other ports
      auth: {
        user: apiKey.username,
        pass: apiKey.password,
      },
      // Add debug option to log SMTP communication
      debug: true,
      logger: true
    });
    
    // Verify connection configuration
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    
    const mailOptions = {
      from: options.from,
      to: Array.isArray(options.to) ? options.to.join(',') : options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo || options.from,
    };
    
    console.log(`Sending email to: ${mailOptions.to}`);
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email with Brevo SMTP:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}