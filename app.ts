import { startScheduler } from './lib/scheduler';
import { connectRabbitMQ } from './lib/rabbitmq';

// Connect to RabbitMQ
connectRabbitMQ().catch(console.error);

// Start the scheduler
let schedulerInterval: NodeJS.Timeout;
startScheduler()
  .then((interval) => {
    schedulerInterval = interval;
    console.log('Scheduler started');
  })
  .catch(console.error);

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }
  
  // Close DB connections, etc.
  process.exit(0);
});