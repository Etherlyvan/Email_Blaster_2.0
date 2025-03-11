// lib/rabbitmq.ts
import * as amqp from 'amqplib';
import { Connection, Channel, ConsumeMessage } from 'amqplib';
import nodemailer from 'nodemailer';
import { prisma } from './db';

// Define a proper interface that includes the missing close method
interface AmqplibConnection extends Connection {
  close(): Promise<void>;
  createChannel(): Promise<Channel>;
}

// RabbitMQ configuration from environment variables
const RABBITMQ_CONFIG = {
  host: process.env.RABBITMQ_HOST || 'monitor-rabbitmq.skwn.dev',
  port: parseInt(process.env.RABBITMQ_PORT || '5672'),
  username: process.env.RABBITMQ_USER || 'developer',
  password: process.env.RABBITMQ_PASSWORD || 'sekawan',
  vhost: process.env.RABBITMQ_VHOST || '/',
};

// Connection management variables
let isRabbitMQAvailable = true;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;
const RECONNECT_DELAY = 5000; // 5 seconds between reconnection attempts

// Connection and channel variables
let connection: AmqplibConnection | null = null;
let channel: Channel | null = null;

/**
 * Email message structure for the queue
 */
export type EmailQueueMessage = {
  campaignId: string;
  to: string;
  subject: string;
  html: string;
  from: string;
  apiKeyId: string;
  logId?: string;
};

/**
 * Email result message structure returned after processing
 */
export interface EmailResultMessage {
  campaignId: string;
  contactEmail: string;
  logId: string;
  success: boolean;
  messageId?: string;
  campaignCompleted?: boolean;
  error?: string;
}

/**
 * Establishes a connection to RabbitMQ and creates necessary queues
 * @returns Promise that resolves when connection is established
 */
export async function connectRabbitMQ(): Promise<boolean> {
  // If we've already tried and failed multiple times, don't keep trying
  if (!isRabbitMQAvailable && connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
    console.log(`RabbitMQ unavailable after ${MAX_CONNECTION_ATTEMPTS} attempts, using direct processing instead`);
    return false;
  }
  
  try {
    if (!connection) {
      connectionAttempts++;
      console.log(`Attempting to connect to RabbitMQ at ${RABBITMQ_CONFIG.host}:${RABBITMQ_CONFIG.port} (attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS})...`);
      
      // Connect to RabbitMQ server with a timeout
      const connectPromise = amqp.connect({
        protocol: 'amqp',
        hostname: RABBITMQ_CONFIG.host,
        port: RABBITMQ_CONFIG.port,
        username: RABBITMQ_CONFIG.username,
        password: RABBITMQ_CONFIG.password,
        vhost: RABBITMQ_CONFIG.vhost,
        heartbeat: 30, // Heartbeat interval in seconds
      });
      
      // Add a timeout to the connection attempt
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 10000); // 10 second timeout
      });
      
      const conn = await Promise.race([connectPromise, timeoutPromise]) as Connection;
      
      // Cast to our extended interface to handle the close method
      connection = conn as unknown as AmqplibConnection;
      
      // Set up error handler for the connection
      connection.on('error', (err) => {
        console.error('RabbitMQ connection error:', err);
        connection = null;
        channel = null;
        
        // Try to reconnect after a delay
        setTimeout(() => {
          connectRabbitMQ().catch(console.error);
        }, RECONNECT_DELAY);
      });
      
      // Set up close handler
      connection.on('close', () => {
        console.log('RabbitMQ connection closed');
        connection = null;
        channel = null;
      });
      
      // Create a channel for communication
      const ch = await connection.createChannel();
      channel = ch;
      
      // Set up error handler for the channel
      if (channel) {
        channel.on('error', (err) => {
          console.error('RabbitMQ channel error:', err);
          channel = null;
        });
        
        channel.on('close', () => {
          console.log('RabbitMQ channel closed');
          channel = null;
        });
        
        // Ensure queues exist and are properly configured
        await channel.assertQueue('email_queue', { 
          durable: true,
          arguments: {
            'x-message-ttl': 60000, // Messages expire after 1 minute if not processed
            'x-dead-letter-exchange': '',
            'x-dead-letter-routing-key': 'email_dlq' // Dead letter queue for failed messages
          }
        });
        
        await channel.assertQueue('email_results', { durable: true });
        
        // Create a dead-letter queue for failed messages
        await channel.assertQueue('email_dlq', { durable: true });
      }
      
      console.log('Connected to RabbitMQ successfully');
      isRabbitMQAvailable = true;
      connectionAttempts = 0; // Reset connection attempts on success
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    isRabbitMQAvailable = false;
    
    // Try to reconnect after a delay if we haven't exceeded max attempts
    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      setTimeout(() => {
        connectRabbitMQ().catch(console.error);
      }, RECONNECT_DELAY);
    }
    
    return false;
  }
}

/**
 * Publishes an email task to the queue for processing
 * @param message Email message to be sent
 * @returns Promise that resolves to true if message was published successfully
 */
export async function publishEmailTask(message: EmailQueueMessage): Promise<boolean> {
  try {
    // Try to connect to RabbitMQ
    const connected = await connectRabbitMQ();
    
    // If RabbitMQ is not available, process the email directly
    if (!connected || !channel) {
      console.log('RabbitMQ unavailable, processing email directly');
      await processEmailDirectly(message);
      return true;
    }
    
    // RabbitMQ is available, send to queue with persistent delivery and expiration
    return channel.sendToQueue(
      'email_queue',
      Buffer.from(JSON.stringify(message)),
      { 
        persistent: true,
        expiration: '60000', // Message expires after 1 minute
        messageId: `email-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
        timestamp: Date.now(),
        appId: 'email-campaign-app'
      }
    );
  } catch (error) {
    console.error('Error publishing message to RabbitMQ:', error);
    
    // Fallback to direct processing
    try {
      await processEmailDirectly(message);
      return true;
    } catch (directError) {
      console.error('Error in direct email processing:', directError);
      return false;
    }
  }
}

/**
 * Direct email processing as a fallback when RabbitMQ is unavailable
 */
async function processEmailDirectly(message: EmailQueueMessage): Promise<void> {
  console.log('Processing email directly:', message.to);
  
  try {
    // Get the API key for sending
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: message.apiKeyId },
    });
    
    if (!apiKey) {
      throw new Error('API key not found');
    }
    
    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: apiKey.host || 'smtp-relay.brevo.com',
      port: apiKey.port || 587,
      secure: (apiKey.port || 587) === 465,
      auth: {
        user: apiKey.username || apiKey.key || '',
        pass: apiKey.password || apiKey.key || '',
      },
    });
    
    // Send the email
    const info = await transporter.sendMail({
      from: message.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
    });
    
    // Update the log if we have a log ID
    if (message.logId) {
      await prisma.emailLog.update({
        where: { id: message.logId },
        data: {
          status: 'SENT',
          messageId: info.messageId,
          updatedAt: new Date(),
        },
      });
    }
    
    console.log('Email sent directly:', info.messageId);
  } catch (error) {
    console.error('Failed to send email directly:', error);
    
    // Update the log with failure status if we have a log ID
    if (message.logId) {
      await prisma.emailLog.update({
        where: { id: message.logId },
        data: {
          status: 'FAILED',
          updatedAt: new Date(),
        },
      });
    }
  }
}

/**
 * Consumes email processing results from the result queue
 * @param callback Function to be called for each result message received
 * @returns Promise that resolves when consumer is set up
 */
export async function consumeEmailResults(
  callback: (result: EmailResultMessage) => Promise<void>
): Promise<void> {
  try {
    const connected = await connectRabbitMQ();
    
    if (!connected || !channel) {
      console.log('RabbitMQ unavailable for consuming results, skipping');
      return;
    }
    
    await channel.consume('email_results', async (msg: ConsumeMessage | null) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString()) as EmailResultMessage;
          await callback(content);
          channel?.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error);
          // Reject the message if processing fails
          channel?.nack(msg, false, false);
        }
      }
    });
  } catch (error) {
    console.error('Error consuming messages from RabbitMQ:', error);
  }
}

/**
 * Closes the RabbitMQ connection and channel
 * @returns Promise that resolves when connection is closed
 */
export async function closeRabbitMQ(): Promise<void> {
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    
    if (connection) {
      // Now TypeScript recognizes the close method thanks to our interface
      await connection.close();
      connection = null;
    }
  } catch (error) {
    console.error('Error closing RabbitMQ connection:', error);
  }
}

/**
 * Initialize RabbitMQ connection when module is loaded
 */
connectRabbitMQ().catch(console.error);