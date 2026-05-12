import { Router } from 'express';
import { storageService } from '../services/storage';
import { FonteVaga } from '../types';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { fonte, busca, pagina = '1', limite = '20' } = req.query;
    
    const vagas = await storageService.getVagas({
      fonte: fonte as FonteVaga,
      busca: busca as string
    });

    const page = parseInt(pagina as string);
    const limit = parseInt(limite as string);
    const start = (page - 1) * limit;
    const paginated = vagas.slice(start, start + limit);

    res.json({
      total: vagas.length,
      pagina: page,
      limite: limit,
      vagas: paginated
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar vagas' });
  }
});

router.get('/status', async (req, res) => {
  try {
    const status = await storageService.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar status' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const vaga = await storageService.getVagaById(req.params.id);
    if (!vaga) return res.status(404).json({ error: 'Vaga não encontrada' });
    res.json(vaga);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar detalhe da vaga' });
  }
});

export default router;
