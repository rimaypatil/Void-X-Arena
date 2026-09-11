const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log('Testing connection with 127.0.0.1...');
  const prismaIpv4 = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres:postgres@127.0.0.1:5432/void_x_arena?schema=public'
      }
    }
  });

  try {
    await prismaIpv4.$connect();
    console.log('Successfully connected to PostgreSQL at 127.0.0.1:5432!');
    const result = await prismaIpv4.$queryRaw`SELECT current_database(), current_user, version()`;
    console.log('Database details:', result);
    await prismaIpv4.$disconnect();
    return true;
  } catch (err) {
    console.error('Failed to connect to 127.0.0.1:5432:', err.message);
    await prismaIpv4.$disconnect();
    return false;
  }
}

testConnection();
