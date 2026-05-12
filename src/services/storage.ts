import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Vaga, AppStatus, FonteVaga, ScraperStatus } from '../types';

const JSON_DB_PATH = path.join(process.cwd(), 'vagas.json');
const STATUS_DB_PATH = path.join(process.cwd(), 'status.json');

export class StorageService {
  private supabase: SupabaseClient | null = null;
  private useSupabase: boolean = false;

  constructor() {
    this.refreshConfig();
    this.initJsonStores();
  }

  private refreshConfig() {
    this.useSupabase = process.env.USE_SUPABASE === 'true';
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;

    // Verifica se a chave é válida e não é o placeholder do .env.example
    const isValidKey = key && key.length > 20 && key !== 'sua-chave-anon-aqui';

    if (this.useSupabase && url && url.includes('supabase.co') && isValidKey) {
      if (!this.supabase) {
        try {
          // Garante que a URL é apenas o domínio base e tem protocolo
          let projectUrl = url.split('/rest/v1')[0].split('?')[0].replace(/\/$/, '');
          if (!projectUrl.startsWith('http')) {
            projectUrl = `https://${projectUrl}`;
          }
          
          console.log(`Storage: Tentando conectar ao Supabase em ${projectUrl}`);
          this.supabase = createClient(projectUrl, key!);
        } catch (err) {
          console.error('Falha ao criar cliente Supabase:', err);
          this.useSupabase = false;
        }
      }
    } else {
      if (this.useSupabase && (!isValidKey || !url)) {
        console.warn('Storage: USE_SUPABASE está true, mas config Supabase incompleta ou inválida. Usando JSON local.');
      }
      this.useSupabase = false;
      this.supabase = null;
    }
  }

  private initJsonStores() {
    if (!fs.existsSync(JSON_DB_PATH)) {
      fs.writeFileSync(JSON_DB_PATH, JSON.stringify([]));
    }
    if (!fs.existsSync(STATUS_DB_PATH)) {
      const initialStatus: AppStatus = {
        totalVagas: 0,
        ultimaExecucaoGeral: null,
        scrapers: [
          { fonte: FonteVaga.SEDEPE, ultimaExecucao: null, totalVagasColetadas: 0, ultimoErro: null, emExecucao: false },
          { fonte: FonteVaga.GO_RECIFE, ultimaExecucao: null, totalVagasColetadas: 0, ultimoErro: null, emExecucao: false }
        ]
      };
      fs.writeFileSync(STATUS_DB_PATH, JSON.stringify(initialStatus));
    }
  }

  private mapToSupabase(vaga: Vaga) {
    return {
      id: vaga.id,
      titulo: vaga.titulo,
      empresa: vaga.empresa,
      localizacao: vaga.localizacao,
      salario: vaga.salario,
      data_publicacao: vaga.dataPublicacao,
      descricao: vaga.descricao,
      link_original: vaga.linkOriginal,
      fonte: vaga.fonte,
      coletado_em: vaga.coletadoEm
    };
  }

  private mapFromSupabase(data: any): Vaga {
    return {
      id: data.id,
      titulo: data.titulo,
      empresa: data.empresa,
      localizacao: data.localizacao,
      salario: data.salario,
      dataPublicacao: data.data_publicacao || data.dataPublicacao,
      descricao: data.descricao,
      linkOriginal: data.link_original || data.linkOriginal,
      fonte: data.fonte,
      coletadoEm: data.coletado_em || data.coletadoEm
    };
  }

  async getVagas(filters?: { fonte?: FonteVaga; busca?: string }): Promise<Vaga[]> {
    this.refreshConfig();
    let vagas: Vaga[] = [];

    if (this.useSupabase && this.supabase) {
      try {
        // Buscamos sem ordenação no banco para evitar erro de coluna inexistente
        let query = this.supabase.from('vagas').select('*');
        if (filters?.fonte && filters.fonte !== 'ALL' as any) query = query.eq('fonte', filters.fonte);
        if (filters?.busca) query = query.ilike('titulo', `%${filters.busca}%`);
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        if (data) {
          vagas = data.map(v => this.mapFromSupabase(v));
          // Ordena sempre no código para garantir consistência independente da coluna no banco
          vagas.sort((a, b) => {
            const dateA = a.dataPublicacao ? new Date(a.dataPublicacao).getTime() : 0;
            const dateB = b.dataPublicacao ? new Date(b.dataPublicacao).getTime() : 0;
            return dateB - dateA;
          });
          return vagas;
        }
      } catch (err: any) {
        console.error('Supabase Error (falling back to JSON):', err.message || err);
        // If it's a connection/DNS error, disable Supabase for this instance
        if (err.message?.includes('fetch failed') || err.message?.includes('ENOTFOUND')) {
          console.warn('Network error detected. Disabling Supabase for this session.');
          this.useSupabase = false;
        }
      }
    }

    // JSON Fallback
    try {
      if (!fs.existsSync(JSON_DB_PATH)) return [];
      const data = fs.readFileSync(JSON_DB_PATH, 'utf-8');
      vagas = JSON.parse(data);
      if (filters?.fonte && filters.fonte !== 'ALL' as any) {
        vagas = vagas.filter(v => v.fonte === filters.fonte);
      }
      if (filters?.busca) {
        const term = filters.busca.toLowerCase();
        vagas = vagas.filter(v => 
          v.titulo.toLowerCase().includes(term) || 
          v.empresa.toLowerCase().includes(term) ||
          (v.descricao && v.descricao.toLowerCase().includes(term))
        );
      }

      vagas.sort((a, b) => new Date(b.dataPublicacao).getTime() - new Date(a.dataPublicacao).getTime());
    } catch (err) {
      console.error('Local JSON Error:', err);
    }
    
    return vagas;
  }

  async getVagaById(id: string): Promise<Vaga | null> {
    this.refreshConfig();
    if (this.useSupabase && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('vagas')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        return this.mapFromSupabase(data);
      } catch (err) {
        console.error('Erro ao buscar vaga no Supabase:', err);
        // Fallback to local
      }
    }
    
    const vagas = await this.getVagas();
    return vagas.find(v => v.id === id) || null;
  }

  async saveVagas(novasVagas: Vaga[]): Promise<number> {
    this.refreshConfig();
    const existingVagas = await this.getVagas();
    const existingLinks = new Set(existingVagas.map(v => v.linkOriginal));
    
    // Filter out duplicates
    const finalVagas = novasVagas.filter(v => !existingLinks.has(v.linkOriginal));
    
    if (finalVagas.length === 0) return 0;

    let savedOk = false;
    if (this.useSupabase && this.supabase) {
      try {
        // Tenta primeiro com snake_case (nosso padrão)
        const mappedVagas = finalVagas.map(v => this.mapToSupabase(v));
        const { error } = await this.supabase.from('vagas').insert(mappedVagas);
        
        if (error && error.message.includes('column') && error.message.includes('does not exist')) {
          console.warn('Storage: Colunas snake_case não encontradas no Supabase. Tentando camelCase...');
          // Fallback: Tenta inserir o objeto direto (camelCase)
          const { error: errorAlt } = await this.supabase.from('vagas').insert(finalVagas);
          if (errorAlt) throw errorAlt;
          savedOk = true;
        } else if (error) {
          throw error;
        } else {
          savedOk = true;
        }
      } catch (err) {
        console.error('Erro ao salvar no Supabase, caindo para JSON:', err);
      }
    }

    if (!savedOk) {
      const merged = [...existingVagas, ...finalVagas];
      fs.writeFileSync(JSON_DB_PATH, JSON.stringify(merged, null, 2));
    }

    await this.updateStatusAfterColeta(finalVagas);
    return finalVagas.length;
  }

  async getStatus(): Promise<AppStatus> {
    try {
      const data = fs.readFileSync(STATUS_DB_PATH, 'utf-8');
      const status = JSON.parse(data) as AppStatus;
      return status;
    } catch (err) {
      console.error('Error reading status:', err);
      // Return a default status if read fails
      return {
        totalVagas: 0,
        ultimaExecucaoGeral: null,
        scrapers: []
      };
    }
  }

  async updateScraperStatus(fonte: FonteVaga, updates: Partial<ScraperStatus>) {
    const status = await this.getStatus();
    const scraperIdx = status.scrapers.findIndex(s => s.fonte === fonte);
    if (scraperIdx !== -1) {
      status.scrapers[scraperIdx] = { ...status.scrapers[scraperIdx], ...updates };
      fs.writeFileSync(STATUS_DB_PATH, JSON.stringify(status, null, 2));
    }
  }

  private async updateStatusAfterColeta(vagasColetadas: Vaga[]) {
    if (vagasColetadas.length === 0) return;
    const fonte = vagasColetadas[0].fonte;
    const status = await this.getStatus();
    const scraperIdx = status.scrapers.findIndex(s => s.fonte === fonte);
    
    if (scraperIdx !== -1) {
      status.scrapers[scraperIdx].ultimaExecucao = new Date().toISOString();
      status.scrapers[scraperIdx].totalVagasColetadas += vagasColetadas.length;
      status.ultimaExecucaoGeral = new Date().toISOString();
      
      // Update global total count
      const allVagas = await this.getVagas();
      status.totalVagas = allVagas.length;
      
      fs.writeFileSync(STATUS_DB_PATH, JSON.stringify(status, null, 2));
    }
  }
}

export const storageService = new StorageService();
