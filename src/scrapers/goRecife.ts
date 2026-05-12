import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Vaga, FonteVaga } from '../types';
import { USER_AGENT, delay } from './utils';
import { parse, formatISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export class GoRecifeScraper {
  private apiUrl = 'https://gorecife.recife.pe.gov.br/api/oportunidades?status=aberta';

  async execute(): Promise<Vaga[]> {
    const vagas: Vaga[] = [];
    let nextUrl: string | null = this.apiUrl;
    
    try {
      while (nextUrl) {
        console.log(`Go Recife: Coletando página ${nextUrl}`);
        const response = await axios.get(nextUrl, {
          headers: { 
            'User-Agent': USER_AGENT,
            'Accept': 'application/json'
          }
        });

        const results = response.data.results || [];
        nextUrl = response.data.next;

        for (const item of results) {
          // Converter data "11/05/2026" para ISO
          let dataPub = new Date().toISOString();
          try {
            if (item.created_on) {
              const parsedDate = parse(item.created_on, 'dd/MM/yyyy', new Date());
              dataPub = formatISO(parsedDate);
            }
          } catch (e) {
            // Fallback to today
          }

          vagas.push({
            id: uuidv4(),
            titulo: item.short_description || item.cbo?.name || 'Vaga sem título',
            empresa: item.company_name || 'Prefeitura do Recife',
            localizacao: item.ibge_code ? `${item.ibge_code.name}, ${item.ibge_code.state}` : 'Recife, PE',
            salario: item.salary || null,
            dataPublicacao: dataPub,
            descricao: item.description || item.requirements || '',
            linkOriginal: `https://gorecife.recife.pe.gov.br/oportunidades/${item.id}`,
            fonte: FonteVaga.GO_RECIFE,
            coletadoEm: new Date().toISOString()
          });
        }

        // Delay para evitar rate limiting entre páginas
        if (nextUrl) await delay(1000);
      }

    } catch (error) {
      console.error('Erro no scraper Go Recife (API):', error);
      throw error;
    }

    return vagas;
  }
}
