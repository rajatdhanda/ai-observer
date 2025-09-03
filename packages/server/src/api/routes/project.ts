/**
 * Project API Routes
 */

import { Router } from 'express';
import { ProjectService } from '../../services/project';

export const projectRouter = Router();

projectRouter.get('/info', async (req, res) => {
  try {
    const projectService = req.app.locals.services.project as ProjectService;
    const info = await projectService.getProjectInfo();
    res.json(info);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

projectRouter.get('/config', async (req, res) => {
  try {
    const projectService = req.app.locals.services.project as ProjectService;
    const config = await projectService.getConfig();
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

projectRouter.post('/config', async (req, res) => {
  try {
    const projectService = req.app.locals.services.project as ProjectService;
    const config = await projectService.updateConfig(req.body);
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

projectRouter.get('/files', async (req, res) => {
  try {
    const projectService = req.app.locals.services.project as ProjectService;
    const type = req.query.type as string;
    const files = await projectService.getProjectFiles(type);
    res.json({ files });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});