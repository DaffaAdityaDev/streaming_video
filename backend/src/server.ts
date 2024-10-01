import express from 'express';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { getConfig } from './config/environment';
import { createLogger } from './utils/logger';
import { setupRoutes } from './routes/setupRoutes';
import { errorHandler, notFoundHandler } from './middlewares/errorMiddleware';
import { setupGracefulShutdown } from './utils/gracefulShutdown';
import { setupSocketIO } from './socket/socketSetup';
import openApiJSON from './api/openapi.json';

const logger = createLogger('server');

/**
 * Represents the main application class.
 */
class Application {
  private readonly app: express.Application;
  private readonly server: http.Server;
  private readonly io: SocketServer;
  private readonly config: ReturnType<typeof getConfig>;
  /**
   * Initializes a new instance of the Application class.
   */
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new SocketServer(this.server, {
      cors: { origin: '*' },
    });
    this.config = getConfig();

    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Sets up middleware for the application.
   */
  private setupMiddlewares(): void {
    this.app.use(express.json());
    this.app.use(cors());
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiJSON));
    this.app.use('/profileimages', express.static(path.join(__dirname, '../profileImages')));
  }

  /**
   * Sets up routes for the application.
   */
  private setupRoutes(): void {
    setupRoutes(this.app);
  }

  /**
   * Sets up error handling for the application.
   */
  private setupErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  /**
   * Starts the server and sets up additional services.
   */
  public async start(): Promise<void> {
    try {
      await this.startServer();
      setupSocketIO(this.io);
      setupGracefulShutdown(this.server);
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Starts the HTTP server.
   */
  private startServer(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.config.port, () => {
        logger.info(`Server listening on ${this.config.url}:${this.config.port}`);
        logger.info(`WebSocket server listening on ${this.config.url}:${this.config.webSocketPort}`);
        resolve();
      });
    });
  }
}

const app = new Application();
app.start().catch((error) => {
  logger.error('Error starting application:', error);
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});