import { chromium } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import { Vaga, FonteVaga } from '../types';
import { USER_AGENT, delay } from './utils';

export class GoRecifeScraper {
  private url = 'https://gorecife.recife.pe.gov.br/oportunidades';

  async execute(): Promise<Vaga[]> {
    const vagas: Vaga[] = [];
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ userAgent: USER_AGENT });
    const page = await context.newPage();

    try {
      await page.goto(this.url, { waitUntil: 'networkidle' });
      
      // Aguarda o carregamento das vagas (TODO: verificar seletor real)
      await page.waitForSelector('.card-vaga, article, .vaga', { timeout: 10000 }).catch(() => null);

      // Extrair vagas do DOM
      const extractedVagas = await page.evaluate(() => {
        // Seletores hipotéticos para o Go Recife
        const items = document.querySelectorAll('.card-vaga, article, .vaga');
        return Array.from(items).map(item => ({
          titulo: item.querySelector('h3, .title')?.textContent?.trim() || '',
          empresa: item.querySelector('.empresa, .company')?.textContent?.trim() || 'Prefeitura do Recife',
          localizacao: item.querySelector('.localizacao, .location')?.textContent?.trim() || 'Recife, PE',
          salario: item.querySelector('.salario, .price')?.textContent?.trim() || null,
          linkOriginal: (item.querySelector('a') as HTMLAnchorElement)?.href || window.location.href,
          descricao: item.querySelector('.descricao, .description')?.textContent?.trim() || ''
        }));
      });

      for (const v of extractedVagas) {
        if (v.titulo) {
          vagas.push({
            id: uuidv4(),
            titulo: v.titulo,
            empresa: v.empresa,
            localizacao: v.localizacao,
            salario: v.salario,
            dataPublicacao: new Date().toISOString(),
            descricao: v.descricao,
            linkOriginal: v.linkOriginal,
            fonte: FonteVaga.GO_RECIFE,
            coletadoEm: new Date().toISOString()
          });
        }
      }

    } catch (error) {
      console.error('Erro no scraper Go Recife:', error);
      throw error;
    } finally {
      await browser.close();
    }

    return vagas;
  }
}
