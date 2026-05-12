import { Router } from 'express';
import { schedulerService } from '../services/scheduler';

const router = Router();

// Middleware de autenticação por API Key
const authMiddleware = (req: any, res: any, next: any) => {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.API_KEY || 'sua-chave-aqui';
  
  if (!apiKey || apiKey !== expectedKey) {
    console.error(`Auth Fail: Recebido '${apiKey}', esperado '${expectedKey}'`);
    return res.status(401).json({ error: 'Não autorizado. Verifique a API_KEY configurada.' });
  }
  next();
};

router.post('/executar', authMiddleware, async (req, res) => {
  const { fonte } = req.body;

  try {
    console.log(`API: Disparando scraper manualmente para fonte: ${fonte || 'TODAS'}`);
    
    if (fonte === 'SEDEPE') {
      await schedulerService.runSedepe();
    } else if (fonte === 'GO_RECIFE') {
      await schedulerService.runGoRecife();
    } else {
      await schedulerService.runAll();
    }
    
    res.json({ message: 'Scraping concluído com sucesso' });
  } catch (error) {
    console.error('API Error: Falha ao disparar scraper:', error);
    res.status(500).json({ error: 'Erro ao disparar scraping' });
  }
});

export default router;
