// scripts/migrate.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runMigrations() {
  try {
    console.log('Running database migrations...');
    
    // Generate Prisma client
    await execAsync('npx prisma generate');
    
    // Run migrations
    await execAsync('npx prisma migrate deploy');
    
    console.log('Migrations completed successfully');
    
    // Optional: Run data migration if needed
    // await migrateSmtpData();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Optional: Function to migrate existing SMTP data to new schema
async function migrateSmtpData() {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    console.log('Migrating SMTP data to new schema...');
    
    // Get all SMTP keys that need migration
    const smtpKeys = await prisma.apiKey.findMany({
      where: {
        type: 'SMTP',
        key: { not: null },
        username: null
      }
    });
    
    for (const key of smtpKeys) {
      // Move the key to password field if username is not set
      await prisma.apiKey.update({
        where: { id: key.id },
        data: {
          username: key.server ? `smtp@${key.server}` : 'smtp-user@example.com',
          password: key.key,
          key: null
        }
      });
    }
    
    console.log(`Migrated ${smtpKeys.length} SMTP configurations`);
  } catch (error) {
    console.error('SMTP data migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runMigrations();