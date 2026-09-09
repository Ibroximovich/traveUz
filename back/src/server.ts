import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

const PORT = env.port;

async function bootstrap() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    if (env.isDev) {
      console.warn('⚠️  Database connection failed — running WITHOUT DB (dev mode).');
      console.warn('   Update DATABASE_URL in .env and restart to enable DB features.');
    } else {
      console.error('❌ Failed to connect to database:', error);
      await prisma.$disconnect();
      process.exit(1);
    }
  }

  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║     🚀 Tripuz Backend API Running        ║
╠══════════════════════════════════════════╣
║  Port:    ${PORT}                           ║
║  Env:     ${env.nodeEnv.padEnd(12)}             ║
║  Base:    http://localhost:${PORT}/api       ║
║  Docs:    http://localhost:${PORT}/api/docs  ║
║  Health:  http://localhost:${PORT}/api/health║
╚══════════════════════════════════════════╝
    `);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

bootstrap();
