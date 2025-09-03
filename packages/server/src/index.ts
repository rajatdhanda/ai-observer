/**
 * AI Observer Server
 * Provides REST API and WebSocket for real-time monitoring
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { ProjectConfig, DashboardState } from '@ai-observer/shared';

import { apiRouter } from './api';
import { AnalysisService } from './services/analysis';
import { ProjectService } from './services/project';
import { WebSocketService } from './services/websocket';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Services
const projectService = new ProjectService();
const analysisService = new AnalysisService(projectService);
const wsService = new WebSocketService(io);

// Make services available to routes
app.locals.services = {
  project: projectService,
  analysis: analysisService,
  websocket: wsService
};

// API Routes
app.use('/api', apiRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('subscribe', (projectId: string) => {
    socket.join(`project:${projectId}`);
    console.log(`Client ${socket.id} subscribed to project ${projectId}`);
  });

  socket.on('unsubscribe', (projectId: string) => {
    socket.leave(`project:${projectId}`);
    console.log(`Client ${socket.id} unsubscribed from project ${projectId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║         AI Observer Server v1.0.0        ║
╠══════════════════════════════════════════╣
║  Status:  ✅ Running                     ║
║  Port:    ${PORT}                           ║
║  API:     http://localhost:${PORT}/api       ║
║  WS:      ws://localhost:${PORT}             ║
╚══════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { app, server, io };