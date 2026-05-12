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
      
      // Tenta encontrar o bloco de arquivo (PDF) que o SEDEPE usa frequentemente
      $('.wp-block-file').each((_, element) => {
        const link = $(element).find('a').first().attr('href');
        const title = $(element).find('a').first().text().trim();
        
        if (link && link.endsWith('.pdf')) {
          vagas.push({
            id: uuidv4(),
            titulo: title || 'Quadro de Vagas (PDF)',
            empresa: 'SEDEPE / SINE-PE',
            localizacao: 'Pernambuco',
            salario: 'Consulte o PDF',
            dataPublicacao: new Date().toISOString(),
            descricao: `Vagas disponíveis no arquivo oficial do SINE-PE. Clique no link para baixar o PDF.`,
            linkOriginal: link,
            fonte: FonteVaga.SEDEPE,
            coletadoEm: new Date().toISOString()
          });
        }
      });

      // Se não encontrou PDF, tenta o seletor genérico de posts (fallback)
      if (vagas.length === 0) {
        $('.elementor-post, article').each((_, element) => {
          const title = $(element).find('h2, h3, .elementor-heading-title').text().trim();
          const link = $(element).find('a').attr('href') || this.url;
          
          if (title && title.toLowerCase().includes('vaga')) {
            vagas.push({
              id: uuidv4(),
              titulo: title,
              empresa: 'SEDEPE',
              localizacao: 'Pernambuco',
              salario: null,
              dataPublicacao: new Date().toISOString(),
              descricao: 'Confira os detalhes das vagas no portal SEDEPE.',
              linkOriginal: link,
              fonte: FonteVaga.SEDEPE,
              coletadoEm: new Date().toISOString()
            });
          }
        });
      }

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
