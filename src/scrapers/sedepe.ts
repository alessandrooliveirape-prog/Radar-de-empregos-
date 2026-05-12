import axios from 'axios';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import { Vaga, FonteVaga } from '../types';
import { USER_AGENT, delay } from './utils';

export class SedepeScraper {
  private url = 'https://www.sedepe.pe.gov.br/vaga-de-emprego/';

  async execute(): Promise<Vaga[]> {
    const vagas: Vaga[] = [];
    
    try {
      const response = await axios.get(this.url, {
        headers: { 'User-Agent': USER_AGENT }
      });

      const $ = cheerio.load(response.data);
      
      // TODO: Verificar seletores reais no site SEDEPE
      // Exemplo hipotético baseado no comportamento comum de sites governamentais em WP
      $('.post-item, .vaga-item, article').each((_, element) => {
        const title = $(element).find('h2, .title, .entry-title').text().trim();
        const link = $(element).find('a').attr('href') || this.url;
        const details = $(element).find('.excerpt, .description').text().trim();
        
        // Muitos sites postam o local e empresa no próprio texto
        // Tentar extrair localização se houver campo específico
        const location = $(element).find('.location, .cidade').text().trim() || "Pernambuco";
        const company = $(element).find('.company, .empresa').text().trim() || "Não informada";
        
        if (title) {
          vagas.push({
            id: uuidv4(),
            titulo: title,
            empresa: company,
            localizacao: location,
            salario: null, // Geralmente não disponível na listagem
            dataPublicacao: new Date().toISOString(), // Fallback se não encontrar data
            descricao: details,
            linkOriginal: link,
            fonte: FonteVaga.SEDEPE,
            coletadoEm: new Date().toISOString()
          });
        }
      });

      // Tratar paginação (hipotético)
      // const nextPage = $('.next').attr('href');
      // if (nextPage) { ... }

    } catch (error) {
      console.error('Erro no scraper SEDEPE:', error);
      throw error;
    }

    return vagas;
  }
}
