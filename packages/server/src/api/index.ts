/**
 * API Router
 * All REST API endpoints
 */

import { Router } from 'express';
import { projectRouter } from './routes/project';
import { tablesRouter } from './routes/tables';
import { architectureRouter } from './routes/architecture';
import { validationRouter } from './routes/validation';
import { analysisRouter } from './routes/analysis';

export const apiRouter = Router();

// API versioning
const v1 = Router();

v1.use('/project', projectRouter);
v1.use('/tables', tablesRouter);
v1.use('/architecture', architectureRouter);
v1.use('/validation', validationRouter);
v1.use('/analysis', analysisRouter);

apiRouter.use('/v1', v1);

// Default route
apiRouter.get('/', (req, res) => {
  res.json({
    name: 'AI Observer API',
    version: '1.0.0',
    endpoints: {
      project: '/api/v1/project',
      tables: '/api/v1/tables',
      architecture: '/api/v1/architecture',
      validation: '/api/v1/validation',
      analysis: '/api/v1/analysis'
    }
  });
});