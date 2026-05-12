import { Router } from 'express';
import { schedulerService } from '../services/scheduler';

const router = Router();

// Middleware de autenticação por API Key
const authMiddleware = (req: any, res: any, next: any) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  next();
};

router.post('/executar', authMiddleware, async (req, res) => {
  const { fonte } = req.body;

  try {
    if (fonte === 'SEDEPE') {
      schedulerService.runSedepe(); // Executa em background
    } else if (fonte === 'GO_RECIFE') {
      schedulerService.runGoRecife();
    } else {
      schedulerService.runAll();
    }
    
    res.json({ message: 'Scraping disparado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao disparar scraping' });
  }
});

export default router;
