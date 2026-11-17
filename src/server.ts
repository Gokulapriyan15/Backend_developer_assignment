import app from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { env } from './config/env';

const start = async (): Promise<void> => {
  await connectDatabase();

  const server = app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  const shutdown = (signal: string): void => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

start().catch((error: unknown) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
