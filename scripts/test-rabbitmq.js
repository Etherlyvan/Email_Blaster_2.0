// scripts/test-rabbitmq.js
import { connect } from 'amqplib';

async function testRabbitMQConnection() {
  console.log('Testing RabbitMQ connection...');
  
  const config = {
    host:  'lunar.skwn.co.id',
    port: parseInt( '6015'),
    username:  'developer',
    password: 'sekawan',
    vhost:  '/',
  };
  
  let connection;
  
  try {
    console.log(`Connecting to RabbitMQ at ${config.host}:${config.port}...`);
    
    connection = await connect({
      protocol: 'amqp',
      hostname: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      vhost: config.vhost,
    });
    
    console.log('✅ Successfully connected to RabbitMQ!');
    console.log(`Host: ${config.host}`);
    console.log(`Port: ${config.port}`);
    console.log(`User: ${config.username}`);
    
    const channel = await connection.createChannel();
    console.log('Channel created successfully');
    
    // Test creating a queue
    const queueName = `test-queue-${Date.now()}`;
    await channel.assertQueue(queueName, { durable: false });
    console.log(`Test queue "${queueName}" created successfully`);
    
    // Delete the test queue
    await channel.deleteQueue(queueName);
    console.log(`Test queue "${queueName}" deleted successfully`);
    
    // Close the channel and connection
    await channel.close();
    await connection.close();
    console.log('Connection closed');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to RabbitMQ:', error);
    return false;
  } finally {
    if (connection) {
      try {
        await connection.close();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        // Ignore errors when closing
      }
    }
  }
}

testRabbitMQConnection()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });