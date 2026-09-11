const { PrismaClient } = require('@prisma/client');

async function createDb() {
  console.log('Connecting to default postgres database...');
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres:postgres@127.0.0.1:5432/postgres'
      }
    }
  });

  try {
    await prisma.$connect();
    console.log('Connected to default postgres database.');
    
    // Check if void_x_arena exists
    const dbs = await prisma.$queryRawUnsafe("SELECT datname FROM pg_database WHERE datname = 'void_x_arena'");
    if (dbs.length === 0) {
      console.log('Database void_x_arena not found. Creating database void_x_arena...');
      await prisma.$executeRawUnsafe('CREATE DATABASE void_x_arena');
      console.log('Database void_x_arena created successfully! 🚀');
    } else {
      console.log('Database void_x_arena already exists.');
    }
    await prisma.$disconnect();
    return true;
  } catch (err) {
    console.error('Error creating database:', err.message);
    await prisma.$disconnect();
    return false;
  }
}

createDb();
