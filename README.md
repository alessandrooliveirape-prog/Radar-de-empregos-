# Radar de Empregos PE 🚀

Sistema full-stack para coleta automática e monitoramento de vagas de emprego dos portais governamentais de Pernambuco.

## Portais Monitorados
1. **SEDEPE** (Secretaria de Desenvolvimento Econômico de Pernambuco)
2. **Go Recife** (Prefeitura do Recife)

## Funcionalidades
- **Scraping Automático**: SEDEPE (6h/6h) e Go Recife (4h/4h).
- **API REST**: Endpoints para listagem, filtros e execução manual de scrapers.
- **Armazenamento Híbrido**: Salva localmente em JSON por padrão, com suporte opcional a Supabase.
- **Dashboard**: Interface moderna para visualização e busca de vagas.

## Stack Técnica
- **Backend**: Node.js, Express, tsx.
- **Scraping**: Axios + Cheerio (SEDEPE), Playwright (Go Recife).
- **Agendamento**: Node-Cron.
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Lucide Icons.

## Como Executar
1. Instale as dependências:
   ```bash
   npm install
   ```
2. Configure o arquivo `.env` (baseado no `.env.example`).
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## API Endpoints
- `GET /api/vagas`: Lista todas as vagas (query params: `fonte`, `busca`, `pagina`, `limite`).
- `GET /api/vagas/status`: Status atual dos scrapers e total de vagas.
- `POST /api/scraper/executar`: Dispara scraping manual (requer `x-api-key`).

## Deploy
Este projeto pode ser facilmente deployado em plataformas como:
- **Render / Railway**: Escolha o runtime Node.js e configure o comando de build `npm run build` e start `npm start`.
- **Vercel**: Suporta o frontend automaticamente, mas requer configuração adicional para scrapers agendados (use Vercel Cron ou serviço externo).

---
*Desenvolvido como uma ferramenta de utilidade pública para Pernambuco.*
