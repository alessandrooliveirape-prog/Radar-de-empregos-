export enum FonteVaga {
  SEDEPE = "SEDEPE",
  GO_RECIFE = "GO_RECIFE",
}

export interface Vaga {
  id: string;
  titulo: string;
  empresa: string;
  localizacao: string;
  salario: string | null;
  dataPublicacao: string; // ISO 8601
  descricao: string | null;
  linkOriginal: string;
  fonte: FonteVaga;
  coletadoEm: string; // ISO 8601
}

export interface ScraperStatus {
  fonte: FonteVaga;
  ultimaExecucao: string | null;
  totalVagasColetadas: number;
  ultimoErro: string | null;
  emExecucao: boolean;
}

export interface AppStatus {
  totalVagas: number;
  scrapers: ScraperStatus[];
  ultimaExecucaoGeral: string | null;
}
