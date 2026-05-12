import cron from 'node-cron';
import { SedepeScraper } from '../scrapers/sedepe';
import { GoRecifeScraper } from '../scrapers/goRecife';
import { storageService } from './storage';
import { FonteVaga } from '../types';

export class SchedulerService {
  private sedepe = new SedepeScraper();
  private goRecife = new GoRecifeScraper();

  init() {
    console.log('Inicializando agendador de scrapers...');

    // SEDEPE: A cada 6 horas
    cron.schedule('0 */6 * * *', async () => {
      console.log('Executando scraper SEDEPE agendado...');
      await this.runSedepe();
    });

    // Go Recife: A cada 4 horas
    cron.schedule('0 */4 * * *', async () => {
      console.log('Executando scraper Go Recife agendado...');
      await this.runGoRecife();
    });
  }

  async runSedepe() {
    await storageService.updateScraperStatus(FonteVaga.SEDEPE, { emExecucao: true, ultimoErro: null });
    try {
      const vagas = await this.sedepe.execute();
      const novasCount = await storageService.saveVagas(vagas);
      console.log(`SEDEPE: ${vagas.length} encontradas, ${novasCount} novas salvas.`);
      await storageService.updateScraperStatus(FonteVaga.SEDEPE, { emExecucao: false });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await storageService.updateScraperStatus(FonteVaga.SEDEPE, { emExecucao: false, ultimoErro: msg });
    }
  }

  async runGoRecife() {
    await storageService.updateScraperStatus(FonteVaga.GO_RECIFE, { emExecucao: true, ultimoErro: null });
    try {
      const vagas = await this.goRecife.execute();
      const novasCount = await storageService.saveVagas(vagas);
      console.log(`Go Recife: ${vagas.length} encontradas, ${novasCount} novas salvas.`);
      await storageService.updateScraperStatus(FonteVaga.GO_RECIFE, { emExecucao: false });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await storageService.updateScraperStatus(FonteVaga.GO_RECIFE, { emExecucao: false, ultimoErro: msg });
    }
  }

  async runAll() {
    await Promise.all([this.runSedepe(), this.runGoRecife()]);
  }
}

export const schedulerService = new SchedulerService();
