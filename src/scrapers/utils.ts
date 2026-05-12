import { Vaga } from '../types';

export async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.31 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.31';

export interface ScraperResult {
  vagas: Vaga[];
  erro: string | null;
}
